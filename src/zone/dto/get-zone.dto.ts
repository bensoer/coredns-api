import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class GetZoneDto {
  @AutoMap()
  @ApiProperty()
  guid: string;

  @AutoMap()
  @ApiProperty()
  hostname: string;

  @AutoMap()
  @ApiProperty()
  servername: string;

  @AutoMap()
  @ApiProperty()
  contact: string;

  @AutoMap()
  @ApiProperty()
  ttl: number;

  @AutoMap()
  @ApiProperty()
  refresh: number;

  @AutoMap()
  @ApiProperty()
  retry: number;

  @AutoMap()
  @ApiProperty()
  expiry: number;
}
