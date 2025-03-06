import { AutoMap } from '@automapper/classes';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
