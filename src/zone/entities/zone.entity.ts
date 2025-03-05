import { AutoMap } from '@automapper/classes';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('zone')
export class Zone {
  public static createFromSOAData(zoneName: string, soaLine: string) {
    const cleanedEnds = soaLine.trim();
    const singleSpaced = cleanedEnds.replace(/\s+/g, ' ');
    const components = singleSpaced.split(' ');

    const zone = new Zone();
    zone.hostname = zoneName;
    zone.servername = components[3];
    zone.contact = components[4];
    zone.serial = components[5];
    zone.refresh = Number(components[6]);
    zone.retry = Number(components[7]);
    zone.expiry = Number(components[8]);
    zone.ttl = Number(components[9]);

    return zone;
  }

  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  guid: string;

  @AutoMap()
  @Column()
  hostname: string;

  @AutoMap()
  @Column()
  servername: string;

  @AutoMap()
  @Column()
  contact: string;

  @AutoMap()
  @Column()
  serial: string;

  @AutoMap()
  @Column()
  ttl: number;

  @AutoMap()
  @Column()
  refresh: number;

  @AutoMap()
  @Column()
  retry: number;

  @AutoMap()
  @Column()
  expiry: number;
}
