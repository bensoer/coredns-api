import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class GetRecordDto {
  @AutoMap()
  @ApiProperty()
  guid: string;

  @AutoMap()
  @ApiProperty()
  domain: string;

  @AutoMap()
  @ApiProperty()
  type: string;

  @AutoMap()
  @ApiProperty()
  content: string;
}
