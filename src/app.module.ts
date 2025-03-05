import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { LoggerMiddleware } from './logger/logger.middleware';
import { ZoneModule } from './zone/zone.module';
import { RecordModule } from './record/record.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Constants } from './utils/constants';
import { CronsModule } from './crons/crons.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true, // cache the config results to speed up lookups
      expandVariables: true, // allow variable references in the .env file
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
        synchronize: false,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    ZoneModule,
    RecordModule,
    CronsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
