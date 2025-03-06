import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import { Zone } from './entities/zone.entity';
import { UUIUtils } from '../utils/uuidutils';
import { ZoneRepository } from './zone.repository';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class ZoneService {
  private readonly configurationFolderRoot;
  private readonly zoneFolderRoot;
  private readonly coreFolderRoot;

  private readonly logger = new Logger(ZoneService.name);

  constructor(
    private zoneRepository: ZoneRepository,
    configService: ConfigService,
    @InjectDataSource() private dataSource: DataSource,
  ) {

    this.configurationFolderRoot = configService.getOrThrow<string>(
      'COREDNS_CONFIG_ROOT',
    );
    this.zoneFolderRoot = `${this.configurationFolderRoot}/zones`;
    this.coreFolderRoot = `${this.configurationFolderRoot}/Corefile.d`;
  }

  async create(createZoneDto: CreateZoneDto): Promise<Zone> {
    // Check this zone doesn't already exist. If it does we error
    if (await this.zoneExists(createZoneDto.hostname)) {
      throw new BadRequestException('Zone Already Exists');
    }

    const zone: Zone = {
      guid: UUIUtils.generateUUID(),
      hostname: createZoneDto.hostname,
      servername: createZoneDto.servername,
      contact: createZoneDto.contact,
      serial: await this.generateSOASerialNumber(),
      ttl: createZoneDto.ttl,
      refresh: createZoneDto.refresh,
      retry: createZoneDto.retry,
      expiry: createZoneDto.expiry,
    };

    zone.id = await this.zoneRepository.insert(zone);

    // Create A Corefile Configuration
    const coreData = `# ${createZoneDto.hostname} Zone Configuration
${createZoneDto.hostname}:53 {
    auto {
        directory ${this.zoneFolderRoot}/db.${createZoneDto.hostname}.d
    }
    log
    errors
}
`;
    await fs.writeFile(
      `${this.coreFolderRoot}/${createZoneDto.hostname}.Corefile`,
      coreData,
    );

    return zone;
  }

  async findAll(): Promise<Array<Zone>> {
    const { totalItems, entities } = await this.zoneRepository.readAll();
    return entities;
  }

  async zoneExists(zoneHostname: string): Promise<boolean> {
    try {
      await this.zoneRepository.readOneByHostname(zoneHostname);
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateSOASerialNumber(): Promise<string> {
    const utcDateTime = new Date(Date.now());
    return `${String(utcDateTime.getUTCFullYear()).slice(-2)}${('0' + String(utcDateTime.getUTCMonth())).slice(-2)}${('0' + String(utcDateTime.getUTCDate())).slice(-2)}${('0' + String(utcDateTime.getUTCHours())).slice(-2)}${('0' + String(utcDateTime.getUTCMinutes())).slice(-2)}`;
  }

  async findOne(zoneGuid: string): Promise<Zone> {
    try {
      return await this.zoneRepository.read(zoneGuid);
    } catch (error) {
      throw new NotFoundException('Zone Not Found - Zone Does Not Exist');
    }
  }

  async update(zoneGuid: string, updateZoneDto: UpdateZoneDto): Promise<Zone> {
    // Confirm it exists by finding it
    const existingZone = await this.findOne(zoneGuid);

    const updatedZone: Zone = {
      id: existingZone.id,
      guid: existingZone.guid,
      hostname: existingZone.hostname,
      servername: updateZoneDto.servername,
      contact: updateZoneDto.contact,
      serial: await this.generateSOASerialNumber(),
      ttl: updateZoneDto.ttl,
      refresh: updateZoneDto.refresh,
      retry: updateZoneDto.retry,
      expiry: updateZoneDto.expiry,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const effectedRows = await this.zoneRepository.update(
        zoneGuid,
        updatedZone,
        queryRunner,
      );
      if (effectedRows <= 0) {
        throw new InternalServerErrorException(
          'Zone Update Failed. Changes Have Not Been Applied',
        );
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return await this.findOne(zoneGuid);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }
  }

  async remove(zoneGuid: string): Promise<Zone> {
    const existingZone = await this.findOne(zoneGuid);

    const effectedRows = await this.zoneRepository.delete(zoneGuid);
    if (effectedRows <= 0) {
      throw new NotFoundException(
        'Record To Delete Was Not Found. Changes Have Not Been Applied',
      );
    }

    await fs.rm(`${this.coreFolderRoot}/${existingZone.hostname}.Corefile`, {
      force: true,
    });

    return existingZone;
  }
}
