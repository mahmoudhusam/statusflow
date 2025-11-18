000000000000000import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertService } from '@/alert/alert.service';
import { AlertController } from '@/alert/alert.controller';
import { AlertRule } from '@/alert/entities/alert-rule.entity';
import { AlertHistory } from '@/alert/entities/alert-history.entity';
import { NotificationChannel } from '@/alert/entities/notification-channel.entity';
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
