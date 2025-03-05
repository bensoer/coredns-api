import {
  Logger,
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { CronsService } from './crons.service';
import { RecordModule } from 'src/record/record.module';
import { ZoneModule } from 'src/zone/zone.module';
import { DataSource, EntityManager, Repository, Table } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Record } from 'src/record/entities/record.entity';
import { RecordService } from 'src/record/record.service';
import { RecordRepository } from 'src/record/record.repository';
import dataSource from '../typeorm.config';

@Module({
  imports: [RecordModule, ZoneModule],
  controllers: [],
  providers: [CronsService],
})
export class CronsModule implements OnModuleInit, OnApplicationBootstrap {
  constructor() {} //private databaseService: DatabaseService
  onApplicationBootstrap() {
    //this.databaseService.createDatabaseTablesIfNotExist()
  }

  async onModuleInit() {
    //this.databaseService.createDatabaseTablesIfNotExist()
    /*const createTablesMigration = new CreateTablesMigration()
    if(!dataSource.isInitialized){
      await dataSource.initialize()
    }
    console.log("About To Apply Migration")
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()
    await createTablesMigration.up(dataSource.createQueryRunner())
    console.log("Done!")*/
  }
}
