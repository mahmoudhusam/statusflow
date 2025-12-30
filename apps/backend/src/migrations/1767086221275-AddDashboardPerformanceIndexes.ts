import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDashboardPerformanceIndexes1767086221275
  implements MigrationInterface
{
  name = 'AddDashboardPerformanceIndexes1767086221275';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index on Monitor.userId for filtering monitors by user
    // This is critical - every dashboard query starts with finding user's monitors
    await queryRunner.query(
      `CREATE INDEX "IDX_monitor_userId" ON "monitor" ("userId")`,
    );

    // Compound index on CheckResult for aggregation queries
    // Covers: WHERE monitorId IN (...) AND createdAt >= ... with isUp for uptime calc
    await queryRunner.query(
      `CREATE INDEX "IDX_check_result_monitor_created_isUp" ON "check_result" ("monitorId", "createdAt", "isUp")`,
    );

    // Index on AlertHistory.monitorId for notification queries
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_history_monitorId" ON "alert_history" ("monitorId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_alert_history_monitorId"`);
    await queryRunner.query(`DROP INDEX "IDX_check_result_monitor_created_isUp"`);
    await queryRunner.query(`DROP INDEX "IDX_monitor_userId"`);
  }
}
