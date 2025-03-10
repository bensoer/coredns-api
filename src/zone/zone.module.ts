import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { ZoneService } from './zone.service';
import { ZoneController } from './zone.controller';
import { ZoneProfile } from './automap/zone.profile';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';
import { ZoneRepository } from './zone.repository';
import { FileUtils } from '../utils/fileutils';
import * as fsp from 'fs/promises';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [TypeOrmModule.forFeature([Zone]), ConfigModule],
  controllers: [ZoneController],
  providers: [ZoneService, ZoneProfile, ZoneRepository],
  exports: [ZoneRepository, ZoneService],
})
export class ZoneModule implements OnModuleInit {
  private readonly COREDNS_CONFIG_ROOT: string;

  constructor(@Inject() private configService: ConfigService) {
    this.COREDNS_CONFIG_ROOT = configService.getOrThrow<string>(
      'COREDNS_CONFIG_ROOT',
    );
  }

  async onModuleInit() {
    const coreFileCheck = async () => {
      if (
        !(await FileUtils.fileExists(`${this.COREDNS_CONFIG_ROOT}/Corefile`))
      ) {
        const corefileData = `import ./Corefile.d/*`;
        await fsp.writeFile(
          `${this.COREDNS_CONFIG_ROOT}/Corefile`,
          corefileData,
        );
      }
    };

    const zoneFolderCheck = async () => {
      try {
        await fsp.access(
          `${this.COREDNS_CONFIG_ROOT}/zones`,
          fsp.constants.F_OK,
        );
      } catch (err) {
        await fsp.mkdir(`${this.COREDNS_CONFIG_ROOT}/zones`, {
          recursive: true,
        });
      }
    };

    const coreFileDCheck = async () => {
      if (
        !(await FileUtils.fileExists(`${this.COREDNS_CONFIG_ROOT}/Corefile`))
      ) {
        const defaultDnsForwardAddresses = '8.8.8.8 8.8.4.4';
        let dnsForwardAddresses = this.configService.get(
          'DNS_FORWARD_ADDRESSES',
          defaultDnsForwardAddresses,
        );
        const components = dnsForwardAddresses.split(' ');

        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        for (const possibleIP of components) {
          if (!ipv4Pattern.test(possibleIP)) {
            dnsForwardAddresses = defaultDnsForwardAddresses;
            break;
          }
        }

        const corefileData = `.:53 {
    forward . ${dnsForwardAddresses}
    log
    errors
    health :8080
    reload
}`;

        await fsp.mkdir(`${this.COREDNS_CONFIG_ROOT}/Corefile.d`, {
          recursive: true,
        });
        await fsp.writeFile(
          `${this.COREDNS_CONFIG_ROOT}/Corefile.d/Corefile`,
          corefileData,
        );
      }
    };

    await Promise.all([coreFileCheck(), zoneFolderCheck(), coreFileDCheck()]);
  }
}
