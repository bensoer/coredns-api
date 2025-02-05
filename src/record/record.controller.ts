import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, UsePipes, ValidationPipe, Put } from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { GetRecordDto } from './dto/get-record.dto';
import { Record } from './entities/record.entity';

@Controller('/zone/:zoneName/record')
@ApiTags('Record')
export class RecordController {
  constructor(
    private readonly recordService: RecordService,
    @InjectMapper() private readonly classMapper: Mapper
  ) {}


  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    }))
  @ApiOperation({ summary: 'Create A Record'})
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false
  })
  async create(@Param('zoneName') zoneName: string, @Body() createRecordDto: CreateRecordDto): Promise<GetRecordDto> {
    const record = await this.recordService.create(zoneName, createRecordDto);
    return this.classMapper.mapAsync(record, Record, GetRecordDto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  @ApiOperation({ summary: 'Get All Records'})
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: true
  })
  async findAll(@Param('zoneName') zoneName: string): Promise<Array<GetRecordDto>> {
    const records = await this.recordService.findAll(zoneName);
    return this.classMapper.mapArrayAsync(records, Record, GetRecordDto)
  }

  @Get(':hash')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  @ApiOperation({ summary: 'Get A Record'})
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false
  })
  async findOne(@Param('zoneName') zoneName:string, @Param('hash') hash: string): Promise<GetRecordDto> {
    const record = await this.recordService.findOne(zoneName, hash);
    return this.classMapper.mapAsync(record, Record, GetRecordDto)
  }

  @Put(':hash')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  @ApiOperation({ summary: 'Update A Record'})
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false
  })
  async update(@Param('zoneName') zoneName: string, @Param('hash') hash: string, @Body() updateRecordDto: UpdateRecordDto): Promise<GetRecordDto> {
    const updatedRecord = await this.recordService.update(zoneName, hash, updateRecordDto);
    return this.classMapper.mapAsync(updatedRecord, Record, GetRecordDto)
  }

  @Delete(':hash')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  @ApiOperation({ summary: 'Delete A Record'})
  @ApiOkResponse({
    type: GetRecordDto,
    isArray: false
  })
  async remove(@Param('zoneName') zoneName: string, @Param('hash') hash: string): Promise<GetRecordDto> {
    const deletedRecord = await this.recordService.remove(zoneName, hash)
    return this.classMapper.mapAsync(deletedRecord, Record, GetRecordDto)
  }
}
