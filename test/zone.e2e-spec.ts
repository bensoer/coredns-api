import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZoneModule } from '../src/zone/zone.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from '../src/zone/entities/zone.entity';
import { ZoneProfile } from '../src/zone/automap/zone.profile';
import { AutomapperModule, getMapperToken } from '@automapper/nestjs';
import { createMapper, Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { ZoneRepository } from '../src/zone/zone.repository';
import { faker } from '@faker-js/faker/.';
import { GetZoneDto } from '../src/zone/dto/get-zone.dto';

describe('ZoneController (e2e)', () => {
  let app: INestApplication;
  let zoneRepository: ZoneRepository
  let dataSource: DataSource
  let classMapper: Mapper;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ZoneModule,
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true, // cache the config results to speed up lookups
            load: [ () => ({
                COREDNS_CONFIG_ROOT: './config',
            })]
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
                database: `${configService.getOrThrow<string>('COREDNS_CONFIG_ROOT')}/sqlite.db`,
                synchronize: true,
                entities: [ Zone ]
            }),
            inject: [ConfigService],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // get zoneRepository to modify the database
    zoneRepository = app.get<ZoneRepository>(ZoneRepository)
    dataSource = app.get<DataSource>(DataSource)
    classMapper = app.get<Mapper>(getMapperToken());
  });

  afterEach(async () => {
    await dataSource.createQueryRunner().clearTable("zone")
  })

  const fakeZone = (guidOverride?: string): Zone => ({
    guid: guidOverride != undefined ? guidOverride : faker.string.uuid(),
    hostname: faker.internet.domainName(),
    servername: faker.internet.domainName(),
    contact: faker.internet.email().replaceAll('@', '.'),
    serial: faker.string.numeric(10),
    ttl: faker.number.int(),
    refresh: faker.number.int(),
    retry: faker.number.int(),
    expiry: faker.number.int(),
    id: faker.number.int(),
  });

  const fakeZoneFactory = (numberOfZones: number): Array<Zone> => {
    const zones = []
    for(let i = 0; i < numberOfZones; i++){
      zones.push(fakeZone())
    }

    return zones
  }

  it('GET /zone When Empty', async () => {
    const response = await request(app.getHttpServer()).get('/zone')
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual([])
  });

  it('GET /zone When Has Data', async () => {

    const zones = fakeZoneFactory(faker.number.int({min: 3, max:5}))
    await zones.map((zone) => zoneRepository.insert(zone))
    const zonesAsGetZoneDtos = await classMapper.mapArrayAsync(zones, Zone, GetZoneDto)

    const response = await request(app.getHttpServer()).get('/zone')

    expect(response.statusCode).toEqual(200)
    for(const zoneFromBody of response.body){
      expect(zonesAsGetZoneDtos).toContainEqual(zoneFromBody)
    }
  })

  afterAll(async ()=> {
    await app.close()
  })
});
