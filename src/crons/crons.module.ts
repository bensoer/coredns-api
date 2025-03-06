import {
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { CronsService } from './crons.service';
import { RecordModule } from '../record/record.module';
import { ZoneModule } from '../zone/zone.module';

@Module({
  imports: [RecordModule, ZoneModule],
  controllers: [],
  providers: [CronsService],
})
export class CronsModule {}
