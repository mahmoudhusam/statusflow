import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1753091512938 implements MigrationInterface {
  name = 'InitialSchema1753091512938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user table
    await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL UNIQUE,
                "password" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
    await queryRunner.query(
      `CREATE INDEX "IDX_e12875dfb3b1d92d7d7c5377556" ON "user" ("email")`,
    );

    // Create monitor table
    await queryRunner.query(`
            CREATE TABLE "monitor" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "url" character varying NOT NULL,
                "interval" integer NOT NULL DEFAULT 60,
                "paused" boolean NOT NULL DEFAULT false,
                "maxLatencyMs" integer NOT NULL DEFAULT 500,
                "maxConsecutiveFailures" integer NOT NULL DEFAULT 3,
                "lastCheckedAt" TIMESTAMP WITH TIME ZONE,
                "httpMethod" character varying NOT NULL DEFAULT 'GET',
                "timeout" integer NOT NULL DEFAULT 10000,
                "headers" jsonb,
                "body" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "FK_monitor_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

    // Create check_result table
    await queryRunner.query(`
            CREATE TABLE "check_result" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "status" integer NOT NULL,
                "responseTime" integer NOT NULL,
                "isUp" boolean NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "errorMessage" character varying(500),
                "responseHeaders" jsonb,
                "monitorId" uuid NOT NULL,
                CONSTRAINT "FK_c9ea410e1d100cc2cd63c208356" FOREIGN KEY ("monitorId") REFERENCES "monitor"("id") ON DELETE CASCADE
            )
        `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_8424426fd8f310fb9ba4ee7dde" ON "check_result" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_check_result_monitor_created" ON "check_result" ("monitorId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_check_result_monitor_created"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8424426fd8f310fb9ba4ee7dde"`,
    );
    await queryRunner.query(`DROP TABLE "check_result"`);
    await queryRunner.query(`DROP TABLE "monitor"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e12875dfb3b1d92d7d7c5377556"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
