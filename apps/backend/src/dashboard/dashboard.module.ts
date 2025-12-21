import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Monitor } from '@/monitor/monitor.entity';
import { CheckResult } from '@/check-result/check-result.entity';
import { AlertHistory } from '@/alert/entities/alert-history.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Monitor, CheckResult, AlertHistory])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
