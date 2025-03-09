import { Test, TestingModule } from '@nestjs/testing';
import { ZoneController } from './zone.controller';
import { ZoneService } from './zone.service';
import { ZoneProfile } from './automap/zone.profile';
import { ZoneRepository } from './zone.repository';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';
import { ConfigModule } from '@nestjs/config';
import { getMapperToken } from '@automapper/nestjs';
import { createMapper, Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { faker } from '@faker-js/faker/.';
import { CreateZoneDto } from './dto/create-zone.dto';
import { GetZoneDto } from './dto/get-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

describe('ZoneController', () => {
  let controller: ZoneController;
  let zoneService: ZoneService;
  let classMapper: Mapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Zone],
          synchronize: true,
        }),
        ConfigModule.forFeature(() => ({
          COREDNS_CONFIG_ROOT: './config',
        })),
      ],
      controllers: [ZoneController],
      providers: [
        ZoneService,
        ZoneProfile,
        ZoneRepository,
        {
          provide: getRepositoryToken(Zone),
          useValue: {},
        },
        {
          provide: getMapperToken(),
          useValue: createMapper({
            strategyInitializer: classes(),
          }),
        },
      ],
    }).compile();

    controller = module.get<ZoneController>(ZoneController);
    zoneService = module.get<ZoneService>(ZoneService);
    classMapper = module.get<Mapper>(getMapperToken());
  });

  const fakeCreateZoneDto = (): CreateZoneDto => ({
    hostname: faker.internet.domainName(),
    servername: faker.internet.domainName(),
    contact: faker.internet.email(),
    ttl: faker.number.int(),
    retry: faker.number.int(),
    expiry: faker.number.int(),
    refresh: faker.number.int(),
  });

  const fakeUpdateZoneDto = (): UpdateZoneDto => ({
    servername: faker.internet.domainName(),
    contact: faker.internet.email(),
    ttl: faker.number.int(),
    retry: faker.number.int(),
    expiry: faker.number.int(),
    refresh: faker.number.int(),
  });

  const fakeZone = (guidOverride?: string): Zone => ({
    guid: guidOverride != undefined ? guidOverride : faker.string.uuid(),
    hostname: faker.internet.domainName(),
    servername: faker.internet.domainName(),
    contact: faker.internet.email(),
    serial: faker.string.numeric(10),
    ttl: faker.number.int(),
    refresh: faker.number.int(),
    retry: faker.number.int(),
    expiry: faker.number.int(),
    id: faker.number.int(),
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a zone', async () => {
    const createZoneDto = fakeCreateZoneDto();
    const zone = fakeZone();
    const zoneAsGetZoneDto = await classMapper.mapAsync(zone, Zone, GetZoneDto);

    jest
      .spyOn(zoneService, 'create')
      .mockImplementation(async (createZoneDto: CreateZoneDto) => zone);

    const createdZone = await controller.create(createZoneDto);

    expect(createdZone).toBeInstanceOf(GetZoneDto);
    expect(createdZone).toEqual(zoneAsGetZoneDto);

    expect(zoneService.create).toHaveBeenCalledTimes(1);
    expect(zoneService.create).toHaveBeenCalledWith(createZoneDto);
  });

  it('should get all zones', async () => {
    const zoneCount = faker.number.int({ min: 1, max: 10 });
    const zones = new Array<Zone>();
    for (let i = 0; i < zoneCount; i++) {
      zones.push(fakeZone());
    }
    const zonesAsGetZoneDtos: Array<GetZoneDto> = classMapper.mapArray(
      zones,
      Zone,
      GetZoneDto,
    );

    jest.spyOn(zoneService, 'findAll').mockImplementation(async () => zones);

    const foundZones = await controller.findAll();

    expect(foundZones).toHaveLength(zoneCount);
    expect(foundZones).toBeInstanceOf(Array<GetZoneDto>);
    for (const zone of foundZones) {
      expect(zonesAsGetZoneDtos).toContainEqual(zone);
    }

    expect(zoneService.findAll).toHaveBeenCalledTimes(1);
    expect(zoneService.findAll).toHaveBeenCalledWith();
  });

  it('should get a zone', async () => {
    const zone = fakeZone();
    const zoneAsGetZoneDto = await classMapper.mapAsync(zone, Zone, GetZoneDto);

    jest
      .spyOn(zoneService, 'findOne')
      .mockImplementation(async (zoneGuid: string) => zone);

    const foundZone = await controller.findOne(zone.guid);

    expect(foundZone).toEqual(zoneAsGetZoneDto);
    expect(foundZone).toBeInstanceOf(GetZoneDto);

    expect(zoneService.findOne).toHaveBeenCalledTimes(1);
    expect(zoneService.findOne).toHaveBeenCalledWith(zone.guid);
  });

  it('should update a zone', async () => {
    const zone = fakeZone();
    const updatedZoneDto = fakeUpdateZoneDto();
    const zoneAsGetZoneDto = await classMapper.mapAsync(zone, Zone, GetZoneDto);

    jest
      .spyOn(zoneService, 'update')
      .mockImplementation(
        async (zoneGuid: string, updateZoneDto: UpdateZoneDto) => zone,
      );

    const updatedZone = await controller.update(zone.guid, updatedZoneDto);

    expect(updatedZone).toEqual(zoneAsGetZoneDto);
    expect(updatedZone).toBeInstanceOf(GetZoneDto);

    expect(zoneService.update).toHaveBeenCalledTimes(1);
    expect(zoneService.update).toHaveBeenCalledWith(zone.guid, updatedZoneDto);
  });

  it('should delete a record', async () => {
    const zone = fakeZone();
    const zoneAsGetZoneDto = await classMapper.mapAsync(zone, Zone, GetZoneDto);

    jest
      .spyOn(zoneService, 'remove')
      .mockImplementation(async (zoneGuid: string) => zone);

    const removedZone = await controller.remove(zone.guid);

    expect(removedZone).toEqual(zoneAsGetZoneDto);
    expect(removedZone).toBeInstanceOf(GetZoneDto);

    expect(zoneService.remove).toHaveBeenCalledTimes(1);
    expect(zoneService.remove).toHaveBeenCalledWith(zone.guid);
  });
});
