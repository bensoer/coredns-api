import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';
import { ZoneService } from '../zone/zone.service';
import { ZoneRepository } from '../zone/zone.repository';
import { Record } from './entities/record.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { RecordRepository } from './record.repository';
import { faker } from '@faker-js/faker/.';
import { CreateRecordDto } from './dto/create-record.dto';
import { RecordProfile } from './automap/record.profile';
import { GetRecordDto } from './dto/get-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { FakeRecord } from '../../test/fake/record.fake';
import { FakeZone } from '../../test/fake/zone.fake';

describe('RecordController', () => {
  let controller: RecordController;
  let recordService: RecordService;

  beforeEach(async () => {
    const zoneRepository = {};
    const zoneService = {};

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Record],
          synchronize: true,
        }),
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      controllers: [RecordController],
      providers: [
        RecordService,
        RecordRepository,
        ZoneService,
        ZoneRepository,
        RecordProfile,
        {
          provide: getRepositoryToken(Record),
          useValue: {},
        },
        /*{
          provide: getMapperToken(),
          useValue: createMapper({
            strategyInitializer: classes(),
          }),
        }*/
      ],
    })
      .overrideProvider(ZoneService)
      .useValue(zoneService)
      .overrideProvider(ZoneRepository)
      .useValue(zoneRepository)
      .compile();

    controller = module.get<RecordController>(RecordController);
    recordService = module.get<RecordService>(RecordService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a record', async () => {
    const zoneGuid = faker.string.uuid();
    const createRecordDto = FakeRecord.fakeCreateRecordDto();

    const record = FakeRecord.fakeRecord();

    jest
      .spyOn(recordService, 'create')
      .mockImplementation(
        async (zoneGuid: string, createRecordDto: CreateRecordDto) => record,
      );

    const createdRecord = await controller.create(zoneGuid, createRecordDto);

    expect(createdRecord).toBeInstanceOf(GetRecordDto);
    expect(createdRecord.guid).toEqual(record.guid);
    expect(createdRecord.domain).toEqual(record.domain);
    expect(createdRecord.type).toEqual(record.type);
    expect(createdRecord.content).toEqual(record.content);

    expect(recordService.create).toHaveBeenCalledTimes(1);
    expect(recordService.create).toHaveBeenCalledWith(
      zoneGuid,
      createRecordDto,
    );
  });

  it('should get all records of a zone', async () => {
    const zone = FakeZone.fakeZone();

    const recordCount = faker.number.int({ min: 1, max: 10 });
    const records = new Array<Record>();
    for (let i = 0; i < recordCount; i++) {
      records.push(FakeRecord.fakeRecord(zone.id));
    }
    const recordsAsGetRecords = records.map((record) => {
      return {
        guid: record.guid,
        domain: record.domain,
        type: record.type,
        content: record.content,
      } as GetRecordDto;
    });

    jest
      .spyOn(recordService, 'findAll')
      .mockImplementation(async (zoneGuid: string) => records);

    const foundRecords = await controller.findAll(zone.guid);

    expect(foundRecords).toHaveLength(recordCount);
    expect(foundRecords).toBeInstanceOf(Array<GetRecordDto>);
    for (const record of foundRecords) {
      expect(recordsAsGetRecords).toContainEqual(record);
    }

    expect(recordService.findAll).toHaveBeenCalledTimes(1);
    expect(recordService.findAll).toHaveBeenCalledWith(zone.guid);
  });

  it('should get a record', async () => {
    const zone = FakeZone.fakeZone();
    const record = FakeRecord.fakeRecord(zone.id);
    const recordAsGetRecordDto = {
      guid: record.guid,
      domain: record.domain,
      type: record.type,
      content: record.content,
    } as GetRecordDto;

    jest
      .spyOn(recordService, 'findOne')
      .mockImplementation(async (recordGuid: string) => record);

    const foundRecord = await controller.findOne(zone.guid, record.guid);

    expect(foundRecord).toEqual(recordAsGetRecordDto);
    expect(foundRecord).toBeInstanceOf(GetRecordDto);

    expect(recordService.findOne).toHaveBeenCalledTimes(1);
    expect(recordService.findOne).toHaveBeenCalledWith(record.guid);
  });

  it('should update a record', async () => {
    const zone = FakeZone.fakeZone();
    const record = FakeRecord.fakeRecord(zone.id);
    const updateRecordDto = FakeRecord.fakeUpdateRecordDto();
    const recordAsGetRecordDto = {
      guid: record.guid,
      domain: record.domain,
      type: record.type,
      content: record.content,
    } as GetRecordDto;

    jest
      .spyOn(recordService, 'update')
      .mockImplementation(
        async (recordGuid: string, updateRecordDto: UpdateRecordDto) => record,
      );

    const updatedRecord = await controller.update(
      zone.guid,
      record.guid,
      updateRecordDto,
    );

    expect(updatedRecord).toEqual(recordAsGetRecordDto);
    expect(updatedRecord).toBeInstanceOf(GetRecordDto);

    expect(recordService.update).toHaveBeenCalledTimes(1);
    expect(recordService.update).toHaveBeenCalledWith(
      record.guid,
      updateRecordDto,
    );
  });

  it('should delete a record', async () => {
    const zone = FakeZone.fakeZone();
    const record = FakeRecord.fakeRecord(zone.id);
    const recordAsGetRecordDto = {
      guid: record.guid,
      domain: record.domain,
      type: record.type,
      content: record.content,
    } as GetRecordDto;

    jest
      .spyOn(recordService, 'remove')
      .mockImplementation(async (recordGuid: string) => record);

    const removedRecord = await controller.remove(zone.guid, record.guid);

    expect(removedRecord).toEqual(recordAsGetRecordDto);
    expect(removedRecord).toBeInstanceOf(GetRecordDto);

    expect(recordService.remove).toHaveBeenCalledTimes(1);
    expect(recordService.remove).toHaveBeenCalledWith(record.guid);
  });
});
