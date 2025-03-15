import { faker } from '@faker-js/faker/.';
import { CreateZoneDto } from 'src/zone/dto/create-zone.dto';
import { UpdateZoneDto } from 'src/zone/dto/update-zone.dto';
import { Zone } from 'src/zone/entities/zone.entity';

export class FakeZone {
  public static fakeZone(guidOverride?: string): Zone {
    return {
      guid: guidOverride != undefined ? guidOverride : faker.string.uuid(),
      hostname: faker.string.alphanumeric(),
      servername: faker.string.alphanumeric(),
      contact: faker.internet.email(),
      serial: faker.string.numeric(10),
      ttl: faker.number.int(),
      refresh: faker.number.int(),
      retry: faker.number.int(),
      expiry: faker.number.int(),
      id: faker.number.int(),
    };
  }

  public static fakeUpdateZoneDto(): UpdateZoneDto {
    return {
      servername: faker.string.alphanumeric(),
      contact: faker.internet.email(),
      ttl: faker.number.int(),
      refresh: faker.number.int(),
      retry: faker.number.int(),
      expiry: faker.number.int(),
    };
  }

  public static fakeCreateZoneDto(): CreateZoneDto {
    return {
      hostname: faker.internet.domainName(),
      servername: faker.internet.domainName(),
      contact: faker.internet.email(),
      ttl: faker.number.int(),
      retry: faker.number.int(),
      expiry: faker.number.int(),
      refresh: faker.number.int(),
    };
  }

  public static fakeZoneFactory(numberOfZones: number): Array<Zone> {
    const zones = [];
    for (let i = 0; i < numberOfZones; i++) {
      zones.push(FakeZone.fakeZone());
    }

    return zones;
  }
}
