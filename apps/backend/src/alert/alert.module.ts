000000000000000import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertHistory } from './entities/alert-history.entity';
import { NotificationChannel } from './entities/notification-channel.entity';
import { Monitor } from '@/monitor/monitor.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlertRule,
      AlertHistory,
      NotificationChannel,
      Monitor,
    ]),
    ConfigModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
