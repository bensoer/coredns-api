import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import { RecordRepository } from './record.repository';
import { UUIUtils } from '../utils/uuidutils';
import { ZoneRepository } from '../zone/zone.repository';
import { DataSource, EntityNotFoundError } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name);

  constructor(
    private recordRepository: RecordRepository,
    private zoneRepository: ZoneRepository,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async create(zoneGuid: string, newRecord: CreateRecordDto): Promise<Record> {
    try {
      const zone = await this.zoneRepository.read(zoneGuid);

      const record: Record = {
        guid: UUIUtils.generateUUID(),
        zoneId: zone.id,
        domain: newRecord.domain,
        type: newRecord.type,
        content: newRecord.content,
      };

      record.id = await this.recordRepository.insert(record);

      return record;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Zone For Record Not Found');
      }

      // else we assume this is an error from the insert failing
      throw new ConflictException('Record Already Exists');
    }
  }

  async findAll(zoneGuid: string): Promise<Array<Record>> {
    try {
      const zone = await this.zoneRepository.read(zoneGuid);
      const pageObject = await this.recordRepository.readAllOfZone(zone.id);
      return pageObject.entities;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Zone For Record Not Found');
      }

      throw new InternalServerErrorException(error);
    }
  }

  async findOne(recordGuid: string): Promise<Record> {
    try {
      return await this.recordRepository.read(recordGuid);
    } catch (error: unknown) {
      throw new NotFoundException('Record Not Found');
    }
  }

  async update(
    recordGuid: string,
    recordUpdates: UpdateRecordDto,
  ): Promise<Record> {
    const existingRecord = await this.findOne(recordGuid);

    const updatedRecord: Record = {
      id: existingRecord.id,
      guid: recordGuid,
      zoneId: existingRecord.zoneId,
      type: recordUpdates.type,
      content: recordUpdates.content,
      domain: recordUpdates.domain,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const effectedRows = await this.recordRepository.update(
        recordGuid,
        updatedRecord,
        queryRunner,
      );
      if (effectedRows <= 0) {
        throw new NotFoundException(
          'Record To Update Was Not Found. Changes Have Not Been Applied',
        );
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return await this.findOne(recordGuid);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }
  }

  async remove(recordGuid: string): Promise<Record> {
    const existingRecord = await this.findOne(recordGuid);

    const effectedRows = await this.recordRepository.delete(recordGuid);
    if (effectedRows <= 0) {
      throw new NotFoundException(
        'Record To Delete Was Not Found. Changes Have Not Been Applied',
      );
    }

    return existingRecord;
  }
}
