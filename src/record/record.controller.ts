import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Put,
} from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { GetRecordDto } from './dto/get-record.dto';
import { Record } from './entities/record.entity';

@Controller('/zone/:zoneGuid/record')
@ApiTags('Record')
export class RecordController {
  constructor(
    private readonly recordService: RecordService,
    @InjectMapper() private readonly classMapper: Mapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({ summary: 'Create A Record For A Zone' })
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false,
  })
  async create(
    @Param('zoneGuid') zoneGuid: string,
    @Body() createRecordDto: CreateRecordDto,
  ): Promise<GetRecordDto> {
    const record = await this.recordService.create(zoneGuid, createRecordDto);
    return this.classMapper.mapAsync(record, Record, GetRecordDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({ summary: 'Get All Records Of A Zone' })
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: true,
  })
  async findAll(
    @Param('zoneGuid') zoneGuid: string,
  ): Promise<Array<GetRecordDto>> {
    const records = await this.recordService.findAll(zoneGuid);
    return this.classMapper.mapArrayAsync(records, Record, GetRecordDto);
  }

  @Get(':recordGuid')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({ summary: 'Get A Record' })
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false,
  })
  async findOne(
    @Param('zoneGuid') zoneGuid: string,
    @Param('recordGuid') recordGuid: string,
  ): Promise<GetRecordDto> {
    const record = await this.recordService.findOne(recordGuid);
    return this.classMapper.mapAsync(record, Record, GetRecordDto);
  }

  @Put(':recordGuid')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({ summary: 'Update A Record' })
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false,
  })
  async update(
    @Param('zoneGuid') zoneGuid: string,
    @Param('recordGuid') recordGuid: string,
    @Body() updateRecordDto: UpdateRecordDto,
  ): Promise<GetRecordDto> {
    const updatedRecord = await this.recordService.update(
      recordGuid,
      updateRecordDto,
    );
    return this.classMapper.mapAsync(updatedRecord, Record, GetRecordDto);
  }

  @Delete(':recordGuid')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({ summary: 'Delete A Record' })
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false,
  })
  async remove(
    @Param('zoneGuid') zoneGuid: string,
    @Param('recordGuid') recordGuid: string,
  ): Promise<GetRecordDto> {
    const deletedRecord = await this.recordService.remove(recordGuid);
    return this.classMapper.mapAsync(deletedRecord, Record, GetRecordDto);
  }
}
