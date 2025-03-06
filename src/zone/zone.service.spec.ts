import { Test, TestingModule } from '@nestjs/testing';
import { ZoneService } from './zone.service';
import { ConfigModule } from '@nestjs/config';
import { ZoneRepository } from './zone.repository';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';

describe('ZoneService', () => {
  let service: ZoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [ Zone ],
          synchronize: true
        }),
        ConfigModule.forFeature(() => ({
          COREDNS_CONFIG_ROOT: './config'
        }))
      ],
      providers: [
        ZoneService, 
        ZoneRepository,
        {
          provide: getRepositoryToken(Zone),
          useValue: {}
        }
      
      ],
    }).compile();

    service = module.get<ZoneService>(ZoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
