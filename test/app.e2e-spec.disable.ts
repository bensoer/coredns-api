import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forFeature(() => ({
          COREDNS_CONFIG_ROOT: './config',
        })),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /zone', async () => {
    const response = await request(app.getHttpServer()).get('/zone');
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual([]);
  });

  afterAll(async () => {
    await app.close();
  });
});
