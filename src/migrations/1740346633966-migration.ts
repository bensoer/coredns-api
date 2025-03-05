import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1740346633966 implements MigrationInterface {
  name = 'Migration1740346633966';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "zone" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guid" varchar NOT NULL, "hostname" varchar NOT NULL, "servername" varchar NOT NULL, "contact" varchar NOT NULL, "serial" varchar NOT NULL, "ttl" integer NOT NULL, "refresh" integer NOT NULL, "retry" integer NOT NULL, "expiry" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "record" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "zoneId" integer NOT NULL, "guid" varchar NOT NULL, "domain" varchar NOT NULL, "type" varchar NOT NULL, "content" varchar NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "record"`);
    await queryRunner.query(`DROP TABLE "zone"`);
  }
}
