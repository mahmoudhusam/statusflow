import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlertSystem1763377686778 implements MigrationInterface {
    name = 'AddAlertSystem1763377686778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."alert_history_status_enum" AS ENUM('triggered', 'resolved', 'acknowledged')`);
        await queryRunner.query(`CREATE TABLE "alert_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."alert_history_status_enum" NOT NULL DEFAULT 'triggered', "title" character varying NOT NULL, "message" text NOT NULL, "metadata" jsonb, "channelsNotified" jsonb NOT NULL, "alertRuleId" uuid NOT NULL, "monitorId" uuid, "acknowledgedAt" TIMESTAMP, "acknowledgedBy" character varying, "resolvedAt" TIMESTAMP, "triggeredAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_01cc54a2bdfa890a86511d26822" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."alert_rules_type_enum" AS ENUM('downtime', 'latency', 'status_code', 'ssl_expiry')`);
        await queryRunner.query(`CREATE TYPE "public"."alert_rules_severity_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`CREATE TABLE "alert_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "type" "public"."alert_rules_type_enum" NOT NULL DEFAULT 'downtime', "severity" "public"."alert_rules_severity_enum" NOT NULL DEFAULT 'high', "enabled" boolean NOT NULL DEFAULT true, "conditions" jsonb NOT NULL, "channels" jsonb NOT NULL, "userId" uuid NOT NULL, "monitorId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ae580564f087ffab9d229225aec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_channels_type_enum" AS ENUM('email', 'webhook', 'sms', 'slack')`);
        await queryRunner.query(`CREATE TABLE "notification_channels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" "public"."notification_channels_type_enum" NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "isDefault" boolean NOT NULL DEFAULT false, "configuration" jsonb NOT NULL, "quietHours" jsonb, "userId" uuid NOT NULL, "lastTestAt" TIMESTAMP, "lastTestSuccess" boolean, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3bc0cb5b60e8659f5fc859b2af0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "alert_history" ADD CONSTRAINT "FK_476160865187a93f1a9860da060" FOREIGN KEY ("alertRuleId") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_history" ADD CONSTRAINT "FK_24dce22925b078267d751e00076" FOREIGN KEY ("monitorId") REFERENCES "monitor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_rules" ADD CONSTRAINT "FK_b1073c34d9de2ae50a0abd9616f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_rules" ADD CONSTRAINT "FK_3f2db39b3da427936bcd85309ac" FOREIGN KEY ("monitorId") REFERENCES "monitor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_channels" ADD CONSTRAINT "FK_e2678bd798912a88145dcfbcb02" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_channels" DROP CONSTRAINT "FK_e2678bd798912a88145dcfbcb02"`);
        await queryRunner.query(`ALTER TABLE "alert_rules" DROP CONSTRAINT "FK_3f2db39b3da427936bcd85309ac"`);
        await queryRunner.query(`ALTER TABLE "alert_rules" DROP CONSTRAINT "FK_b1073c34d9de2ae50a0abd9616f"`);
        await queryRunner.query(`ALTER TABLE "alert_history" DROP CONSTRAINT "FK_24dce22925b078267d751e00076"`);
        await queryRunner.query(`ALTER TABLE "alert_history" DROP CONSTRAINT "FK_476160865187a93f1a9860da060"`);
        await queryRunner.query(`DROP TABLE "notification_channels"`);
        await queryRunner.query(`DROP TYPE "public"."notification_channels_type_enum"`);
        await queryRunner.query(`DROP TABLE "alert_rules"`);
        await queryRunner.query(`DROP TYPE "public"."alert_rules_severity_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_rules_type_enum"`);
        await queryRunner.query(`DROP TABLE "alert_history"`);
        await queryRunner.query(`DROP TYPE "public"."alert_history_status_enum"`);
    }

}
