import { Test, TestingModule } from '@nestjs/testing';
import { ZoneController } from './zone.controller';
import { ZoneService } from './zone.service';
import { ZoneProfile } from './automap/zone.profile';
import { ZoneRepository } from './zone.repository';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';
import { ConfigModule } from '@nestjs/config';
import { getMapperToken } from '@automapper/nestjs';
import { createMapper } from '@automapper/core';
import { classes } from '@automapper/classes';

describe('ZoneController', () => {
  let controller: ZoneController;

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
      controllers: [ZoneController],
      providers: [
        ZoneService, 
        ZoneProfile, 
        ZoneRepository,
        {
          provide: getRepositoryToken(Zone),
          useValue: {}
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
