import { Test, TestingModule } from '@nestjs/testing';
import { RecordService } from './record.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Record } from './entities/record.entity';
import { ZoneRepository } from '../zone/zone.repository';
import { ZoneService } from '../zone/zone.service';
import { RecordRepository } from './record.repository';

describe('RecordService', () => {
  let service: RecordService;

  beforeEach(async () => {

    const zoneService = {}
    const zoneRepository = {}


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
          useValue: {}
        },
      ],
    })
    .overrideProvider(ZoneService)
    .useValue(zoneService)
    .overrideProvider(ZoneRepository)
    .useValue(zoneRepository)
    .compile();

    service = module.get<RecordService>(RecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
