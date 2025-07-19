import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1752915796334 implements MigrationInterface {
  name = 'InitialSchema1752915796334';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "check_result" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" integer NOT NULL, "responseTime" integer NOT NULL, "isUp" boolean NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "errorMessage" character varying, "monitorId" uuid NOT NULL, CONSTRAINT "PK_15b8e86b94d18989428912dede5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_532ee0f0a1b31ca136b7d71080" ON "check_result" ("monitorId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "monitor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "url" character varying NOT NULL, "interval" integer NOT NULL DEFAULT '60', "paused" boolean NOT NULL DEFAULT false, "maxLatencyMs" integer NOT NULL DEFAULT '500', "maxConsecutiveFailures" integer NOT NULL DEFAULT '3', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_2206b1127c3617bd63373acba74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "check_result" ADD CONSTRAINT "FK_c9ea410e1d100cc2cd63c208356" FOREIGN KEY ("monitorId") REFERENCES "monitor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monitor" ADD CONSTRAINT "FK_17b6081f05eee538f7db3de2f9c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "monitor" DROP CONSTRAINT "FK_17b6081f05eee538f7db3de2f9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "check_result" DROP CONSTRAINT "FK_c9ea410e1d100cc2cd63c208356"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e12875dfb3b1d92d7d7c5377e2"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "monitor"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_532ee0f0a1b31ca136b7d71080"`,
    );
    await queryRunner.query(`DROP TABLE "check_result"`);
  }
}
