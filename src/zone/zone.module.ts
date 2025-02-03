import { Module } from '@nestjs/common';
import { ZoneService } from './zone.service';
import { ZoneController } from './zone.controller';
import { ZoneProfile } from './automap/zone.profile';

@Module({
  controllers: [ZoneController],
  providers: [ZoneService, ZoneProfile],
})
export class ZoneModule {}
