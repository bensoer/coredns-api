import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Zone } from './entities/zone.entity';

@Injectable()
export class ZoneRepository {
  constructor(
    @InjectRepository(Zone) private zoneRepository: Repository<Zone>,
  ) {}

  public async insert(zone: Zone): Promise<number> {
    const queryBuilder = this.zoneRepository.createQueryBuilder('zones');
    const insertResults = await queryBuilder
      .insert()
      .into(Zone)
      .values([zone])
      .execute();

    return insertResults.identifiers[0].id;
  }

  public async update(
    guid: string,
    zone: Zone,
    queryRunner?: QueryRunner,
  ): Promise<number> {
    const queryBuilder = this.zoneRepository.createQueryBuilder(
      'zones',
      queryRunner,
    );
    const updateResult = await queryBuilder
      .update(Zone)
      .set(zone)
      .where('guid = :guid', { guid: guid })
      .execute();

    return updateResult.affected ?? parseInt(updateResult.raw);
  }

  public async read(guid: string): Promise<Zone> {
    const queryBuilder = this.zoneRepository.createQueryBuilder('zones');
    queryBuilder.where('guid = :guid', { guid: guid });

    return await queryBuilder.getOneOrFail();
  }

  public async readOneByHostname(hostname: string): Promise<Zone> {
    const queryBuilder = this.zoneRepository.createQueryBuilder('zones');
    queryBuilder.where('hostname = :hostname', { hostname: hostname });

    return await queryBuilder.getOneOrFail();
  }

  public async readAll(): Promise<{ totalItems: number; entities: Zone[] }> {
    const queryBuilder = this.zoneRepository.createQueryBuilder('zones');

    const totalItems = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return { totalItems, entities };
  }

  public async delete(guid: string): Promise<number> {
    const queryBuilder = this.zoneRepository.createQueryBuilder('zones');
    const deleteResult = await queryBuilder
      .delete()
      .from(Zone)
      .where('guid = :guid', { guid: guid })
      .execute();

    return deleteResult.affected ?? parseInt(deleteResult.raw);
  }
}
