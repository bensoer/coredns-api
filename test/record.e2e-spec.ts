import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomapperModule, getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { DataSource } from 'typeorm';
import { Record } from '../src/record/entities/record.entity';
import { RecordModule } from '../src/record/record.module';
import { FakeZone } from './fake/zone.fake';
import { ZoneRepository } from '../src/zone/zone.repository';
import { faker } from '@faker-js/faker/.';
import { Zone } from '../src/zone/entities/zone.entity';
import { GetZoneDto } from '../src/zone/dto/get-zone.dto';
import { ZoneModule } from '../src/zone/zone.module';

describe('RecordController (e2e)', () => {
  let app: INestApplication;
  //let recordRepository: RecordRepository;
  let zoneRepository: ZoneRepository;
  let dataSource: DataSource;
  let classMapper: Mapper;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RecordModule,
        ZoneModule,
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true, // cache the config results to speed up lookups
          load: [
            () => ({
              COREDNS_CONFIG_ROOT: './config',
            }),
          ],
        }),
        // AutoMapper for DTO <-> Entity mapping
        // https://medium.com/@exfabrica/nestjs-dto-with-automapper-c4e89009f30b
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'sqlite',
            database: `${configService.getOrThrow<string>('COREDNS_CONFIG_ROOT')}/sqlite.record.db`,
            synchronize: true,
            entities: [Record, Zone],
          }),
          inject: [ConfigService],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // get zoneRepository to modify the database
    //recordRepository = app.get<RecordRepository>(RecordRepository);
    zoneRepository = app.get<ZoneRepository>(ZoneRepository);
    dataSource = app.get<DataSource>(DataSource);
    classMapper = app.get<Mapper>(getMapperToken());
  });

  afterEach(async () => {
    await dataSource.createQueryRunner().clearTable('record');
    await dataSource.createQueryRunner().clearTable('zone');
  });

  it('GET /zone/{zoneGuid}/record When Empty', async () => {
    const zones = FakeZone.fakeZoneFactory(
      faker.number.int({ min: 3, max: 5 }),
    );
    for (const zone of zones) {
      await zoneRepository.insert(zone);
    }
    const zonesAsGetZoneDtos = await classMapper.mapArrayAsync(
      zones,
      Zone,
      GetZoneDto,
    );

    for (const zone of zonesAsGetZoneDtos) {
      const response = await request(app.getHttpServer()).get(
        '/zone/' + zone.guid + '/record',
      );
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual([]);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
