import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Record } from './entities/record.entity';
import { DataSource, QueryRunner, Repository, Table } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RecordRepository {
  private readonly logger = new Logger(RecordRepository.name);

  constructor(
    @InjectRepository(Record) private recordRepository: Repository<Record>,
  ) {}

  public async insert(record: Record): Promise<number> {
    const queryBuilder = this.recordRepository.createQueryBuilder('records');
    const insertResults = await queryBuilder
      .insert()
      .into(Record)
      .values([record])
      .execute();

    return insertResults.identifiers[0].id;
  }

  public async update(
    guid: string,
    record: Record,
    queryRunner?: QueryRunner,
  ): Promise<number> {
    const queryBuilder = this.recordRepository.createQueryBuilder(
      'records',
      queryRunner,
    );
    const updateResult = await queryBuilder
      .update(Record)
      .set(record)
      .where('guid = :guid', { guid: guid })
      .execute();

    return updateResult.affected ?? parseInt(updateResult.raw);
  }

  public async read(guid: string): Promise<Record> {
    const queryBuilder = this.recordRepository.createQueryBuilder('records');
    queryBuilder.where('guid = :guid', { guid: guid });

    return await queryBuilder.getOneOrFail();
  }

  public async readAllOfZone(
    zoneId: number,
  ): Promise<{ totalItems: number; entities: Record[] }> {
    const queryBuilder = this.recordRepository.createQueryBuilder('records');
    queryBuilder.where('zoneId = :zoneId', { zoneId: zoneId });

    const totalItems = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return { totalItems, entities };
  }

  public async delete(guid: string): Promise<number> {
    const queryBuilder = this.recordRepository.createQueryBuilder('records');
    const deleteResult = await queryBuilder
      .delete()
      .from(Record)
      .where('guid = :guid', { guid: guid })
      .execute();

    return deleteResult.affected ?? parseInt(deleteResult.raw);
  }
}
