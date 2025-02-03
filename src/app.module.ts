import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { LoggerMiddleware } from './logger/logger.middleware';
import { ZoneModule } from './zone/zone.module';
import { RecordModule } from './record/record.module';

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
    ZoneModule,
    RecordModule
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer){
    consumer.apply(
      LoggerMiddleware
    )
    .forRoutes('*')
  }
}
