import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './user/user.entity';
import { Monitor } from './monitor/monitor.entity';
import { CheckResult } from './check-result/check-result.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false, // This MUST be false for migrations
  logging: false,
  entities: [User, Monitor, CheckResult],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsRun: false,
});
