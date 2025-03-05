import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateZoneDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description:
      'The endpoint (can be DNS or IP) to reach the DNS server where this Zone is located.',
  })
  servername: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'The email address of the contact responsible for this zone',
  })
  contact: string;

  @IsNumber()
  @ApiProperty({
    description:
      'The default TTL in seconds for any records created in this zone',
  })
  ttl: number;

  @IsNumber()
  @ApiProperty({
    description:
      'Refresh rate in seconds. How long this zone information is valid before it should be refetched by clients',
  })
  refresh: number;

  @IsNumber()
  @ApiProperty({
    description:
      'Retry backoff time in seconds. If retrieval of Zone information failes, how long for clients to wait before fetching this zone information again',
  })
  retry: number;

  @IsNumber()
  @ApiProperty({
    description: 'When this SOA record in seconds expires',
  })
  expiry: number;
}
