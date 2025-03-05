import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

export default new DataSource({
  type: 'sqlite',
  database: `/etc/coredns/sqlite.db`,
  synchronize: false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*-migration.js'],
  migrationsRun: false,
  logging: true,
});
