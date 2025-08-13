import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CheckResult } from '../check-result/check-result.entity';
import { Monitor } from './monitor.entity';
import { QueueModule } from '../queue/queue.module';
import { AlertModule } from '../alert/alert.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Monitor, CheckResult]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    QueueModule,
    AlertModule,
  ],
  providers: [MonitorService],
  controllers: [MonitorController],
  exports: [MonitorService],
})
export class MonitorModule {}
