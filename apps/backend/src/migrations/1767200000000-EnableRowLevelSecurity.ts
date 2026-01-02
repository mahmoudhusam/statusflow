import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enable Row Level Security (RLS) on all tables.
 *
 * NOTE: This migration was already applied manually via Supabase SQL Editor
 * to fix security warnings. This file exists to track the change in git
 * and maintain complete migration history.
 *
 * If running on a fresh database, this will enable RLS.
 * If running on production (where it was already applied), this is idempotent -
 * enabling RLS on a table that already has it enabled is a no-op in PostgreSQL.
 */
export class EnableRowLevelSecurity1767200000000 implements MigrationInterface {
  name = 'EnableRowLevelSecurity1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable RLS on all application tables
    // Note: ENABLE ROW LEVEL SECURITY is idempotent - safe to run if already enabled
    await queryRunner.query(
      `ALTER TABLE public.user ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.monitor ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.check_result ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Disable RLS on all tables (for rollback)
    // Note: This removes RLS enforcement but does not delete any policies
    await queryRunner.query(
      `ALTER TABLE public.migrations DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.notification_channels DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.alert_history DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.alert_rules DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.check_result DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.monitor DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE public.user DISABLE ROW LEVEL SECURITY`,
    );
  }
}
