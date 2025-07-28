import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMonitorFields1753702473131 implements MigrationInterface {
    name = 'AddMonitorFields1753702473131'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "check_result" ADD "responseHeaders" jsonb`);
        await queryRunner.query(`ALTER TABLE "monitor" ADD "lastCheckedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "monitor" ADD "httpMethod" character varying NOT NULL DEFAULT 'GET'`);
        await queryRunner.query(`ALTER TABLE "monitor" ADD "timeout" integer NOT NULL DEFAULT '10000'`);
        await queryRunner.query(`ALTER TABLE "monitor" ADD "headers" jsonb`);
        await queryRunner.query(`ALTER TABLE "monitor" ADD "body" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "body"`);
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "headers"`);
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "timeout"`);
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "httpMethod"`);
        await queryRunner.query(`ALTER TABLE "monitor" DROP COLUMN "lastCheckedAt"`);
        await queryRunner.query(`ALTER TABLE "check_result" DROP COLUMN "responseHeaders"`);
    }

}
