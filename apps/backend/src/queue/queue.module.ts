import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MonitorQueueService } from './monitor-queue.service';
import { MonitorProcessor } from './monitor.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Monitor } from '../monitor/monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';
import { HttpModule } from '@nestjs/axios';
import { AlertModule } from 'src/alert/alert.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'monitor-checks',
    }),
    TypeOrmModule.forFeature([Monitor, CheckResult]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AlertModule,
  ],
  providers: [MonitorQueueService, MonitorProcessor],
  exports: [MonitorQueueService],
})
export class QueueModule {}
