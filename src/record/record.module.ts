import { Module } from '@nestjs/common';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { RecordProfile } from './automap/record.profile';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Record } from './entities/record.entity';
import { RecordRepository } from './record.repository';
import { ZoneModule } from '../zone/zone.module';

@Module({
  imports: [TypeOrmModule.forFeature([Record]), ZoneModule],
  controllers: [RecordController],
  providers: [RecordService, RecordProfile, RecordRepository],
  exports: [RecordService],
})
export class RecordModule {}
