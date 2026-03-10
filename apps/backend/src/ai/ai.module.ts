import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MonitorModule } from '@/monitor/monitor.module';
import { DashboardModule } from '@/dashboard/dashboard.module';

@Module({
  imports: [MonitorModule, DashboardModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
