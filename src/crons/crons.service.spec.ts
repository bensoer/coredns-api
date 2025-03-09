import { Test, TestingModule } from '@nestjs/testing';
import { CronsService } from './crons.service';
import { ZoneService } from '../zone/zone.service';
import { RecordService } from '../record/record.service';
import { ConfigModule } from '@nestjs/config';

describe('CronsService', () => {
  let service: CronsService;

  beforeEach(async () => {
    const zoneService = {};
    const recordService = {};

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(() => ({
          COREDNS_CONFIG_ROOT: './config',
        })),
      ],
      providers: [CronsService, ZoneService, RecordService],
    })
      .overrideProvider(ZoneService)
      .useValue(zoneService)
      .overrideProvider(RecordService)
      .useValue(recordService)
      .compile();

    service = module.get<CronsService>(CronsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
