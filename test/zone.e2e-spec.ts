import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZoneModule } from '../src/zone/zone.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from '../src/zone/entities/zone.entity';
import { AutomapperModule, getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { DataSource } from 'typeorm';
import { ZoneRepository } from '../src/zone/zone.repository';
import { faker } from '@faker-js/faker/.';
import { GetZoneDto } from '../src/zone/dto/get-zone.dto';
import { FakeZone } from './fake/zone.fake';

describe('ZoneController (e2e)', () => {
  let app: INestApplication;
  let zoneRepository: ZoneRepository;
  let dataSource: DataSource;
  let classMapper: Mapper;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
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
            database: `${configService.getOrThrow<string>('COREDNS_CONFIG_ROOT')}/sqlite.zone.db`,
            synchronize: true,
            entities: [Zone],
          }),
          inject: [ConfigService],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // get zoneRepository to modify the database
    zoneRepository = app.get<ZoneRepository>(ZoneRepository);
    dataSource = app.get<DataSource>(DataSource);
    classMapper = app.get<Mapper>(getMapperToken());
  });

  afterEach(async () => {
    await dataSource.createQueryRunner().clearTable('zone');
  });

  it('GET /zone When Empty', async () => {
    const response = await request(app.getHttpServer()).get('/zone');
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual([]);
  });

  it('GET /zone When Has Data', async () => {
    const zones = FakeZone.fakeZoneFactory(
      faker.number.int({ min: 3, max: 5 }),
    );
    await zones.map((zone) => zoneRepository.insert(zone));
    const zonesAsGetZoneDtos = await classMapper.mapArrayAsync(
      zones,
      Zone,
      GetZoneDto,
    );

    const response = await request(app.getHttpServer()).get('/zone');

    expect(response.statusCode).toEqual(200);
    for (const zoneFromBody of response.body) {
      expect(zonesAsGetZoneDtos).toContainEqual(zoneFromBody);
    }
  });

  it('GET /zone/{zoneGuid} - Get A specific zone', async () => {
    const zones = FakeZone.fakeZoneFactory(
      faker.number.int({ min: 3, max: 5 }),
    );
    await zones.map((zone) => zoneRepository.insert(zone));
    const zonesAsGetZoneDtos = await classMapper.mapArrayAsync(
      zones,
      Zone,
      GetZoneDto,
    );
    const randomZoneIndexToGet = faker.number.int({
      min: 0,
      max: zones.length - 1,
    });

    const response = await request(app.getHttpServer()).get(
      '/zone/' + zonesAsGetZoneDtos[randomZoneIndexToGet].guid,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(zonesAsGetZoneDtos[randomZoneIndexToGet]);
  });

  it('PUT /zone/{zoneGuid} - Update A Zone', async () => {
    const zones = FakeZone.fakeZoneFactory(
      faker.number.int({ min: 3, max: 5 }),
    );
    await zones.map((zone) => zoneRepository.insert(zone));
    const zonesAsGetZoneDtos = await classMapper.mapArrayAsync(
      zones,
      Zone,
      GetZoneDto,
    );
    const randomZoneIndexToUpdate = faker.number.int({
      min: 0,
      max: zones.length - 1,
    });

    const zoneToUpdate = zonesAsGetZoneDtos[randomZoneIndexToUpdate];

    const fakeUpdateZoneDto = FakeZone.fakeUpdateZoneDto();
    const response = await request(app.getHttpServer())
      .put('/zone/' + zonesAsGetZoneDtos[randomZoneIndexToUpdate].guid)
      .send(fakeUpdateZoneDto);

    expect(response.status).toEqual(200);
    expect(response.body).not.toEqual(zoneToUpdate);
  });

  it('DELETE /zone/{zoneGuid} - Delete A Zone', async () => {
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
    const randomZoneIndexToDelete = faker.number.int({
      min: 0,
      max: zones.length - 1,
    });

    const zoneToDelete = zonesAsGetZoneDtos[randomZoneIndexToDelete];

    const response = await request(app.getHttpServer()).delete(
      '/zone/' + zonesAsGetZoneDtos[randomZoneIndexToDelete].guid,
    );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual(zoneToDelete);

    // check the database that this zone is gone
    const shouldBeStillExistingZones = zones.filter(
      (zone) => zone.guid != zoneToDelete.guid,
    );
    const existingZonesInDB = (await zoneRepository.readAll()).entities;

    expect(existingZonesInDB).toHaveLength(zones.length - 1);
    for (const shouldBeExistingZone of shouldBeStillExistingZones) {
      expect(existingZonesInDB).toContainEqual(shouldBeExistingZone);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
