import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMonitorFields1753702473131 implements MigrationInterface {
  name = 'AddMonitorFields1753702473131';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before adding them
    const checkResultTable = await queryRunner.getTable('check_result');
    const monitorTable = await queryRunner.getTable('monitor');

    // Only add responseHeaders if it doesn't exist
    if (
      checkResultTable &&
      !checkResultTable.findColumnByName('responseHeaders')
    ) {
      await queryRunner.query(
        `ALTER TABLE "check_result" ADD "responseHeaders" jsonb`,
      );
    }

    // Only add monitor fields if they don't exist
    if (monitorTable) {
      if (!monitorTable.findColumnByName('lastCheckedAt')) {
        await queryRunner.query(
          `ALTER TABLE "monitor" ADD "lastCheckedAt" TIMESTAMP WITH TIME ZONE`,
        );
      }
      if (!monitorTable.findColumnByName('httpMethod')) {
        await queryRunner.query(
          `ALTER TABLE "monitor" ADD "httpMethod" character varying NOT NULL DEFAULT 'GET'`,
        );
      }
      if (!monitorTable.findColumnByName('timeout')) {
        await queryRunner.query(
          `ALTER TABLE "monitor" ADD "timeout" integer NOT NULL DEFAULT '10000'`,
        );
      }
      if (!monitorTable.findColumnByName('headers')) {
        await queryRunner.query(`ALTER TABLE "monitor" ADD "headers" jsonb`);
      }
      if (!monitorTable.findColumnByName('body')) {
        await queryRunner.query(`ALTER TABLE "monitor" ADD "body" text`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const monitorTable = await queryRunner.getTable('monitor');
    const checkResultTable = await queryRunner.getTable('check_result');

    if (monitorTable) {
      if (monitorTable.findColumnByName('body')) {
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "body"`);
      }
      if (monitorTable.findColumnByName('headers')) {
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "headers"`);
      }
      if (monitorTable.findColumnByName('timeout')) {
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "timeout"`);
      }
      if (monitorTable.findColumnByName('httpMethod')) {
        await queryRunner.query(
          `ALTER TABLE "monitor" DROP COLUMN "httpMethod"`,
        );
      }
      if (monitorTable.findColumnByName('lastCheckedAt')) {
        await queryRunner.query(
          `ALTER TABLE "monitor" DROP COLUMN "lastCheckedAt"`,
        );
      }
    }

    if (
      checkResultTable &&
      checkResultTable.findColumnByName('responseHeaders')
    ) {
      await queryRunner.query(
        `ALTER TABLE "check_result" DROP COLUMN "responseHeaders"`,
      );
    }
  }
}
