import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './user/user.entity';
import { Monitor } from './monitor/monitor.entity';
import { CheckResult } from './check-result/check-result.entity';
import { AlertRule } from './alert/entities/alert-rule.entity';
import { AlertHistory } from './alert/entities/alert-history.entity';
import { NotificationChannel } from './alert/entities/notification-channel.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // This MUST be false for migrations
  logging: false,
  entities: [
    User,
    Monitor,
    CheckResult,
    AlertRule,
    AlertHistory,
    NotificationChannel,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsRun: false,
  ssl: {
    rejectUnauthorized: false,
  },
});