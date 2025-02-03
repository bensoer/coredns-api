import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UsePipes, ValidationPipe, Put, HttpStatus } from '@nestjs/common';
import { ZoneService } from './zone.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { GetZoneDto } from './dto/get-zone.dto';
import { Zone } from './entities/zone.entity';

@Controller('zone')
@ApiTags('Zone')
export class ZoneController {
  constructor(
    private readonly zoneService: ZoneService,
    @InjectMapper() private readonly classMapper: Mapper
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  @ApiOperation({ summary: 'Create A Zone'})
  @ApiOkResponse({
    type: GetZoneDto,
    isArray: false,
  })
  async create(@Body() createZoneDto: CreateZoneDto): Promise<GetZoneDto> {
    const zone = await this.zoneService.create(createZoneDto);
    return this.classMapper.mapAsync(zone, Zone, GetZoneDto)

  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get All Zones Setup With CoreDNS'})
  @ApiOkResponse({
    type: GetZoneDto,
    isArray: true,
  })
  async findAll(): Promise<Array<GetZoneDto>> {
    const zones = await this.zoneService.findAll();
    return this.classMapper.mapArrayAsync(zones, Zone, GetZoneDto) 
  }

  @Get(':zoneName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get A Zone'})
  @ApiOkResponse({
    type: GetZoneDto,
    isArray: false,
  })
  async findOne(@Param('zoneName') zoneName: string): Promise<GetZoneDto> {
    const zone = await this.zoneService.findOne(zoneName);
    return this.classMapper.mapAsync(zone, Zone, GetZoneDto)
  }

  @Put(':zoneName')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  @ApiOperation({summary: 'Update A Zone'})
  @ApiOkResponse({
    type: GetZoneDto,
    isArray: false,
  })
  async update(@Param('zoneName') zoneName: string, @Body() updateZoneDto: UpdateZoneDto): Promise<GetZoneDto> {
    const zone = await this.zoneService.update(zoneName, updateZoneDto);
    return this.classMapper.mapAsync(zone, Zone, GetZoneDto)
  }

  @Delete(':zoneName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Delete A Zone'})
  @ApiOkResponse({
    type: GetZoneDto,
    isArray: false,
  })
  async remove(@Param('zoneName') zoneName: string): Promise<GetZoneDto> {
    const zone = await this.zoneService.remove(zoneName);
    return this.classMapper.mapAsync(zone, Zone, GetZoneDto)
  }
}
