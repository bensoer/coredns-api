import { Test, TestingModule } from '@nestjs/testing';
import { ZoneService } from './zone.service';
import { ConfigModule } from '@nestjs/config';
import { ZoneRepository } from './zone.repository';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';
import { EntityNotFoundError, QueryRunner } from 'typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FakeZone } from '../../test/fake/zone.fake';

describe('ZoneService', () => {
  let service: ZoneService;
  let zoneRepository: ZoneRepository;

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
      providers: [
        ZoneService,
        ZoneRepository,
        {
          provide: getRepositoryToken(Zone),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ZoneService>(ZoneService);
    zoneRepository = module.get<ZoneRepository>(ZoneRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne should succeed', async () => {
    const zone = FakeZone.fakeZone();

    jest
      .spyOn(zoneRepository, 'read')
      .mockImplementation(async (zoneGuid: string) => zone);

    const foundZone = await service.findOne(zone.guid);

    expect(foundZone).toEqual(zone);

    expect(zoneRepository.read).toHaveBeenCalledTimes(1);
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid);
  });

  it('findOne should 404 if not found', async () => {
    const zone = FakeZone.fakeZone();

    jest
      .spyOn(zoneRepository, 'read')
      .mockImplementation(async (zoneGuid: string) => {
        throw new EntityNotFoundError(Zone, undefined);
      });

    try {
      await service.findOne(zone.guid);
      fail('This should have thrown an exception');
    } catch (error) {
      expect(error).toEqual(
        new NotFoundException('Zone Not Found - Zone Does Not Exist'),
      );
    }

    expect(zoneRepository.read).toHaveBeenCalledTimes(1);
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid);
  });

  it('update should succeed', async () => {
    const zone = FakeZone.fakeZone();
    const zoneUpdates = FakeZone.fakeUpdateZoneDto();

    jest
      .spyOn(service, 'findOne')
      .mockImplementation(async (zoneGuid: string) => zone);
    jest
      .spyOn(zoneRepository, 'update')
      .mockImplementation(
        async (
          zoneGuid: string,
          updatedZone: Zone,
          queryRunner?: QueryRunner,
        ) => 1,
      );

    const updatedRecord = await service.update(zone.guid, zoneUpdates);

    expect(updatedRecord).toEqual(zone);

    expect(zoneRepository.update).toHaveBeenCalledTimes(1);
    expect(service.findOne).toHaveBeenCalledTimes(2);
  });

  it('update should 404 if update fails', async () => {
    const zone = FakeZone.fakeZone();
    const zoneUpdates = FakeZone.fakeUpdateZoneDto();

    jest
      .spyOn(service, 'findOne')
      .mockImplementation(async (zoneGuid: string) => zone);
    jest
      .spyOn(zoneRepository, 'update')
      .mockImplementation(
        async (
          zoneGuid: string,
          updatedZone: Zone,
          queryRunner?: QueryRunner,
        ) => 0,
      );

    try {
      await service.update(zone.guid, zoneUpdates);
      fail('This should have thrown an exception');
    } catch (error) {
      expect(error).toEqual(
        new InternalServerErrorException(
          'Zone Update Failed. Changes Have Not Been Applied',
        ),
      );
    }

    expect(zoneRepository.update).toHaveBeenCalledTimes(1);
    expect(service.findOne).toHaveBeenCalledTimes(1);
  });

  it('remove should succeed', async () => {
    const zone = FakeZone.fakeZone();

    jest
      .spyOn(service, 'findOne')
      .mockImplementation(async (zoneGuid: string) => zone);
    jest
      .spyOn(zoneRepository, 'delete')
      .mockImplementation(async (zoneGuid: string) => 1);

    const removedRecord = await service.remove(zone.guid);

    expect(removedRecord).toEqual(zone);

    expect(zoneRepository.delete).toHaveBeenCalledTimes(1);
    expect(zoneRepository.delete).toHaveBeenCalledWith(zone.guid);
    expect(service.findOne).toHaveBeenCalledTimes(1);
    expect(service.findOne).toHaveBeenCalledWith(zone.guid);
  });

  it('remove should 404 if can\t find record', async () => {
    const zone = FakeZone.fakeZone();

    jest
      .spyOn(service, 'findOne')
      .mockImplementation(async (zoneGuid: string) => {
        throw new NotFoundException('Zone Not Found - Zone Does Not Exist');
      });
    jest
      .spyOn(zoneRepository, 'delete')
      .mockImplementation(async (zoneGuid: string) => 1);

    try {
      await service.remove(zone.guid);
      fail('Exception should have been thrown');
    } catch (error) {
      expect(error).toEqual(
        new NotFoundException('Zone Not Found - Zone Does Not Exist'),
      );
    }

    expect(zoneRepository.delete).toHaveBeenCalledTimes(0);
    expect(service.findOne).toHaveBeenCalledTimes(1);
    expect(service.findOne).toHaveBeenCalledWith(zone.guid);
  });

  it('remove should 404 if delete does not remove any records', async () => {
    const zone = FakeZone.fakeZone();

    jest
      .spyOn(service, 'findOne')
      .mockImplementation(async (zoneGuid: string) => zone);
    jest
      .spyOn(zoneRepository, 'delete')
      .mockImplementation(async (zoneGuid: string) => 0);

    try {
      await service.remove(zone.guid);
      fail('Exception should have been thrown');
    } catch (error) {
      expect(error).toEqual(
        new NotFoundException(
          'Record To Delete Was Not Found. Changes Have Not Been Applied',
        ),
      );
    }

    expect(zoneRepository.delete).toHaveBeenCalledTimes(1);
    expect(zoneRepository.delete).toHaveBeenCalledWith(zone.guid);
    expect(service.findOne).toHaveBeenCalledTimes(1);
    expect(service.findOne).toHaveBeenCalledWith(zone.guid);
  });
});
