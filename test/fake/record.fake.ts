import { faker } from '@faker-js/faker/.';
import { CreateRecordDto } from '../../src/record/dto/create-record.dto';
import { Record } from '../../src/record/entities/record.entity';
import { UpdateRecordDto } from '../../src/record/dto/update-record.dto';

export class FakeRecord {
  public static fakeRecord(zoneIdOverride?: number): Record {
    return {
      zoneId: zoneIdOverride != undefined ? zoneIdOverride : faker.number.int(),
      guid: faker.string.uuid(),
      domain: faker.internet.domainName(),
      type: faker.string.fromCharacters([
        'A',
        'CNAME',
        'TXT',
        'MS',
        'NS',
        'SRV',
      ]),
      content: faker.string.alphanumeric(),
    };
  }

  public static fakeCreateRecordDto(): CreateRecordDto {
    return {
      domain: faker.internet.domainName(),
      type: faker.string.fromCharacters([
        'A',
        'CNAME',
        'TXT',
        'MS',
        'NS',
        'SRV',
      ]),
      content: faker.string.alphanumeric(),
    };
  }

  public static fakeUpdateRecordDto(): UpdateRecordDto {
    return {
      domain: faker.internet.domainName(),
      type: faker.string.fromCharacters([
        'A',
        'CNAME',
        'TXT',
        'MS',
        'NS',
        'SRV',
      ]),
      content: faker.string.alphanumeric(),
    };
  }
}
