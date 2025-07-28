import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1753091512938 implements MigrationInterface {
    name = 'InitialSchema1753091512938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "check_result" DROP COLUMN "errorMessage"`);
        await queryRunner.query(`ALTER TABLE "check_result" ADD "errorMessage" character varying(500)`);
        await queryRunner.query(`CREATE INDEX "IDX_8424426fd8f310fb9ba4ee7dde" ON "check_result" ("createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8424426fd8f310fb9ba4ee7dde"`);
        await queryRunner.query(`ALTER TABLE "check_result" DROP COLUMN "errorMessage"`);
        await queryRunner.query(`ALTER TABLE "check_result" ADD "errorMessage" character varying`);
    }

}
