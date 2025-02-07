import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsIn, IsNotEmpty, IsString } from "class-validator"

export class CreateRecordDto {

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description:
            'Domain for the record. To add a record for the root domain / zone. Use @',
    })
    domain: string


    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => ("" + value).toUpperCase())
    @IsIn([ 'A', 'CNAME', 'MX', 'NS', 'SRV', 'TXT' ])
    @ApiProperty({
        description:
            'Record Type',
        enum: [ 'A', 'CNAME', 'MX', 'NS', 'SRV', 'TXT']
    })
    type: string

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description:
            'The record value',
    })
    value: string

}
