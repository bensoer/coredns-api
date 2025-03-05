import { AutoMap } from '@automapper/classes';
import { Zone } from 'src/zone/entities/zone.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('record')
export class Record {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  zoneId: number;

  @Column()
  guid: string;

  @AutoMap()
  @Column()
  domain: string;

  @AutoMap()
  @Column()
  type: string;

  @AutoMap()
  @Column()
  content: string;
}
