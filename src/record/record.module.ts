import { Module } from '@nestjs/common';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { RecordProfile } from './automap/record.profile';

@Module({
  controllers: [RecordController],
  providers: [RecordService, RecordProfile],
})
export class RecordModule {}
