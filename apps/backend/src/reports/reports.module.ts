import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Monitor } from '../monitor/monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Monitor, CheckResult])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
