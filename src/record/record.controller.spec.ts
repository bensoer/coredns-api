import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';
import { ZoneService } from '../zone/zone.service';
import { ZoneRepository } from '../zone/zone.repository';
import { Record } from './entities/record.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { getMapperToken } from '@automapper/nestjs';
import { createMapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { RecordRepository } from './record.repository';

describe('RecordController', () => {
  let controller: RecordController;

  beforeEach(async () => {

    const zoneRepository = {}
    const zoneService = {}


    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [ Record ],
          synchronize: true
        })
      ],
      controllers: [RecordController],
      providers: [
        RecordService, 
        RecordRepository,
        ZoneService, 
        ZoneRepository,
        {
          provide: getRepositoryToken(Record),
          useValue: {}
        },
        {
          provide: getMapperToken(),
          useValue: createMapper({
            strategyInitializer: classes(),
          }),
        }
      ],
    })
    .overrideProvider(ZoneService)
    .useValue(zoneService)
    .overrideProvider(ZoneRepository)
    .useValue(zoneRepository)
    .compile();

    controller = module.get<RecordController>(RecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
