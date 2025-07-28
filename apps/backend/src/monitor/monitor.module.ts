import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CheckResult } from '../check-result/check-result.entity';
import { Monitor } from './monitor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Monitor, CheckResult]),
    HttpModule.register({
      timeout: 30000, // 30 seconds default timeout
      maxRedirects: 5, // Allow up to 5 redirects
    }),
  ],
  providers: [MonitorService],
  controllers: [MonitorController],
  exports: [MonitorService],
})
export class MonitorModule {}
