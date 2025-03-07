import { Test, TestingModule } from '@nestjs/testing';
import { RecordService } from './record.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Record } from './entities/record.entity';
import { ZoneRepository } from '../zone/zone.repository';
import { ZoneService } from '../zone/zone.service';
import { RecordRepository } from './record.repository';
import { Zone } from '../zone/entities/zone.entity';
import { faker } from '@faker-js/faker';
import { CreateRecordDto } from './dto/create-record.dto';
import { EntityNotFoundError } from 'typeorm';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('RecordService', () => {
  let service: RecordService;
  let recordRepository: RecordRepository
  let zoneRepository: ZoneRepository

  beforeEach(async () => {

    const zoneService = {}

    const module: TestingModule = await Test.createTestingModule({
      imports: [ 
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [ Record ],
          synchronize: true
        }),
      ],
      providers: [
        RecordService,
        RecordRepository,
        ZoneService,
        ZoneRepository,
        {
          provide: getRepositoryToken(Record),
          useValue: {/*
            async read(zoneGuid: string){
              return { id: 5 }
            },
            async insert(record: Record){
              return { id: 10 }
            }
          */}
        },
      ],
    })
    .overrideProvider(ZoneService)
    .useValue(zoneService)
    .overrideProvider(ZoneRepository)
    .useValue({ async read(guid:string) {}})
    .compile();

    service = module.get<RecordService>(RecordService);
    recordRepository = module.get<RecordRepository>(RecordRepository);
    zoneRepository = module.get<ZoneRepository>(ZoneRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const fakeZone = (guidOverride?: string): Zone => ({
    guid: guidOverride != undefined ? guidOverride : faker.string.uuid(),
    hostname: faker.string.alphanumeric(),
    servername: faker.string.alphanumeric(),
    contact: faker.string.alpha(),
    serial: faker.string.numeric(10),
    ttl: faker.number.int(),
    refresh: faker.number.int(),
    retry: faker.number.int(),
    expiry: faker.number.int(),
    id: faker.number.int()
  })

  const fakeRecord = (zoneIdOverride?: number): Record => ({
    zoneId: zoneIdOverride != undefined ? zoneIdOverride : faker.number.int(),
    guid: faker.string.uuid(),
    domain: faker.internet.domainName(),
    type: faker.string.fromCharacters(['A', 'CNAME', 'TXT', 'MS', 'NS', 'SRV']),
    content: faker.string.alphanumeric()
  })

  const fakeCreateRecordDto = (): CreateRecordDto => ({
    domain: faker.internet.domainName(),
    type: faker.string.fromCharacters(['A', 'CNAME', 'TXT', 'MS', 'NS', 'SRV']),
    content: faker.string.alphanumeric()
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('insert should be successfull', async () => {

    const zone = fakeZone()
    const createRecordDto = fakeCreateRecordDto()

    jest.spyOn(zoneRepository, 'read').mockImplementation(async (guid: string) => zone)
    jest.spyOn(recordRepository, 'insert').mockImplementation(async (record: Record) => 5)

    const insertedRecord = await service.create(zone.guid, createRecordDto)

    expect(insertedRecord.zoneId).toEqual(zone.id)
    expect(insertedRecord.id).toBeDefined()
    expect(insertedRecord.id).toEqual(5)

    expect(insertedRecord.domain).toEqual(createRecordDto.domain)
    expect(insertedRecord.type).toEqual(createRecordDto.type)
    expect(insertedRecord.content).toEqual(createRecordDto.content)

    expect(zoneRepository.read).toHaveBeenCalledTimes(1)
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid)
    expect(recordRepository.insert).toHaveBeenCalledTimes(1)

  })

  it('insert should 404 if zone does not exist', async () => {

    const zone = fakeZone()
    const createRecordDto = fakeCreateRecordDto()

    jest.spyOn(zoneRepository, 'read').mockImplementation(async (guid: string) => {throw new EntityNotFoundError(Zone, undefined)})
    jest.spyOn(recordRepository, 'insert').mockImplementation(async (record: Record) => 5)

    try{
      await service.create(zone.guid, createRecordDto)
      fail("This should have thrown an exception")
    }catch(error){
      expect(error).toEqual(new NotFoundException("Zone For Record Not Found"))
    }

    expect(zoneRepository.read).toHaveBeenCalledTimes(1)
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid)
    expect(recordRepository.insert).toHaveBeenCalledTimes(0)
  })

  it('insert should 409 if record already exists', async () => {

    const zone = fakeZone()
    const createRecordDto = fakeCreateRecordDto()

    jest.spyOn(zoneRepository, 'read').mockImplementation(async (guid: string) => zone)
    jest.spyOn(recordRepository, 'insert').mockImplementation(async (record: Record) => { throw new Error()})

    try{
      await service.create(zone.guid, createRecordDto)
      fail("This should have thrown an exception")
    }catch(error){
      expect(error).toEqual(new ConflictException("Record Already Exists"))
    }

    expect(zoneRepository.read).toHaveBeenCalledTimes(1)
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid)
    expect(recordRepository.insert).toHaveBeenCalledTimes(1)
  })

  it('findAll should succeed', async () => {

    const zone = fakeZone()
    let recordNumber = faker.number.int(25)
    const records = new Array<Record>()
    while(recordNumber > 0){
      records.push(fakeRecord(zone.id))
      recordNumber--
    }
    
    jest.spyOn(zoneRepository, 'read').mockImplementation(async (guid: string) => zone)
    jest.spyOn(recordRepository, 'readAllOfZone').mockImplementation(async (zoneId: number) =>  { return { totalItems: records.length, entities: records }})

    const foundRecords = await service.findAll(zone.guid)

    expect(foundRecords).toHaveLength(records.length)
    for(const record of records){
      expect(foundRecords).toContainEqual(record)
    }

    expect(zoneRepository.read).toHaveBeenCalledTimes(1)
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid)
    expect(recordRepository.readAllOfZone).toHaveBeenCalledTimes(1)
    expect(recordRepository.readAllOfZone).toHaveBeenCalledWith(zone.id)
    
  })

  it('findAll should 404 if zone does not exist', async () => {

    const zone = fakeZone()
    let recordNumber = faker.number.int(25)
    const records = new Array<Record>()
    while(recordNumber > 0){
      records.push(fakeRecord(zone.id))
      recordNumber--
    }

    jest.spyOn(zoneRepository, 'read').mockImplementation(async (guid: string) => {throw new EntityNotFoundError(Zone, undefined)})
    jest.spyOn(recordRepository, 'readAllOfZone').mockImplementation(async (zoneId: number) =>  { return { totalItems: records.length, entities: records }})

    try{
      await service.findAll(zone.guid)
      fail("This should have thrown an exception")
    }catch(error){
      expect(error).toEqual(new NotFoundException("Zone For Record Not Found"))
    }

    expect(zoneRepository.read).toHaveBeenCalledTimes(1)
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid)
    expect(recordRepository.readAllOfZone).toHaveBeenCalledTimes(0)
  })

  it('findAll should 500 if readAllOfZone Repository Call Fails', async () => {

    const zone = fakeZone()
    let recordNumber = faker.number.int(25)
    const records = new Array<Record>()
    while(recordNumber > 0){
      records.push(fakeRecord(zone.id))
      recordNumber--
    }

    const errorThrownByReadAllOfZone = new Error()

    jest.spyOn(zoneRepository, 'read').mockImplementation(async (guid: string) => zone)
    jest.spyOn(recordRepository, 'readAllOfZone').mockImplementation(async (zoneId: number) =>  { throw errorThrownByReadAllOfZone })

    try{
      await service.findAll(zone.guid)
      fail("This should have thrown an exception")
    }catch(error){
      expect(error).toEqual(new InternalServerErrorException(errorThrownByReadAllOfZone))
    }

    expect(zoneRepository.read).toHaveBeenCalledTimes(1)
    expect(zoneRepository.read).toHaveBeenCalledWith(zone.guid)
    expect(recordRepository.readAllOfZone).toHaveBeenCalledTimes(1)
    expect(recordRepository.readAllOfZone).toHaveBeenCalledWith(zone.id)
  })
});
