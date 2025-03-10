import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fsp from 'fs/promises';
import { createWriteStream } from 'fs';
import { FileUtils } from '../utils/fileutils';
import { ZoneService } from '../zone/zone.service';
import { RecordService } from '../record/record.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronsService {
  private readonly logger = new Logger(CronsService.name);
  private syncCronIsRunning = false;
  private readonly COREDNS_CONFIG_ROOT: string;

  constructor(
    private zoneService: ZoneService,
    private recordService: RecordService,
    private configService: ConfigService,
  ) {
    this.COREDNS_CONFIG_ROOT = configService.getOrThrow<string>(
      'COREDNS_CONFIG_ROOT',
    );
  }

  async getAllRecordEntries(zoneFolderPath: string): Promise<Array<string>> {
    const recordFiles = await fsp.readdir(zoneFolderPath, {
      withFileTypes: true,
    });
    const recordEntries = [];
    for (const recordFile of recordFiles) {
      if (!recordFile.name.startsWith('db')) {
        // this is then one of our record entries
        const recordString = await fsp.readFile(
          `${zoneFolderPath}/${recordFile.name}`,
          { encoding: 'utf-8' },
        );
        recordEntries.push(recordString);
      }
    }

    return recordEntries;
  }

  async isSOAEntry(line: string): Promise<boolean> {
    return line.includes('SOA');
  }

  async generateSOASerialNumber(): Promise<string> {
    const utcDateTime = new Date(Date.now());
    return `${String(utcDateTime.getUTCFullYear()).slice(-2)}${('0' + String(utcDateTime.getUTCMonth())).slice(-2)}${('0' + String(utcDateTime.getUTCDate())).slice(-2)}${('0' + String(utcDateTime.getUTCHours())).slice(-2)}${('0' + String(utcDateTime.getUTCMinutes())).slice(-2)}`;
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async syncRecordsWithZone() {
    // This way if execution takes longer then 30 seconds, the next execution will skip
    // So we only have 1 sync ever going on at one time
    // This is a very basic way to get a lock that works in this situation
    // Given its not distributed
    if (this.syncCronIsRunning) {
      return;
    } else {
      this.syncCronIsRunning = true;
    }

    this.zoneService.findAll();
    // NOTE: Zones contact emails will contain '@' character in them - which we need to remove before writing to file

    // Need to wrap everything in a try/catch so that IF there is any error, the lock will release
    try {
      this.logger.log('Scanning Zone Records And Updating Zone Files');

      const zoneFolders = await fsp.readdir(
        `${this.COREDNS_CONFIG_ROOT}/zones`,
        { withFileTypes: true },
      );
      for (const zoneFolder of zoneFolders) {
        if (zoneFolder.isDirectory()) {
          const zoneFolderName = zoneFolder.name;
          const zoneFileName = zoneFolderName.substring(
            0,
            zoneFolderName.lastIndexOf('.'),
          );
          const zoneName = zoneFileName.substring(
            zoneFileName.indexOf('.') + 1,
          );

          this.logger.log(`Processing Zone ${zoneName}`);

          const zoneFolderPath = `${this.COREDNS_CONFIG_ROOT}/zones/${zoneFolderName}`;
          const zoneFilePath = `${zoneFolderPath}/${zoneFileName}`;

          const recordStrings = await this.getAllRecordEntries(zoneFolderPath);

          const newZoneFileWriter = createWriteStream(
            `${zoneFolderPath}/new.${zoneFileName}`,
          );

          // Write out the $ORIGIN line entry
          recordStrings.unshift(`$ORIGIN ${zoneName}.`);

          for (const recordString of recordStrings) {
            await new Promise<void>((resolve, reject) => {
              newZoneFileWriter.write(recordString + '\n', (error) => {
                if (error) {
                  reject(error);
                }
                resolve();
              });
            });
          }

          newZoneFileWriter.close();

          // If this is a newly created zone this might not actually exist
          if (await FileUtils.fileExists(zoneFilePath)) {
            await fsp.rm(zoneFilePath);
          }

          await fsp.rename(
            `${zoneFolderPath}/new.${zoneFileName}`,
            zoneFilePath,
          );
        }
      }

      this.syncCronIsRunning = false;
    } catch (error) {
      this.syncCronIsRunning = false;
      this.logger.error(error);
    }
  }
}
