import { MigrationInterface, QueryRunner } from "typeorm";

export class EditCheckResultEntity1754406460320 implements MigrationInterface {
    name = 'EditCheckResultEntity1754406460320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "check_result" DROP CONSTRAINT "FK_c9ea410e1d100cc2cd63c208356"`);
        await queryRunner.query(`ALTER TABLE "check_result" ADD CONSTRAINT "FK_c9ea410e1d100cc2cd63c208356" FOREIGN KEY ("monitorId") REFERENCES "monitor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "check_result" DROP CONSTRAINT "FK_c9ea410e1d100cc2cd63c208356"`);
        await queryRunner.query(`ALTER TABLE "check_result" ADD CONSTRAINT "FK_c9ea410e1d100cc2cd63c208356" FOREIGN KEY ("monitorId") REFERENCES "monitor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
