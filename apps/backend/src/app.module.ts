import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MonitorModule } from '@/monitor/monitor.module';
import { UserModule } from '@/user/user.module';
import { CheckResultModule } from '@/check-result/check-result.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertService } from '@/alert/alert.service';
import { AlertModule } from '@/alert/alert.module';
import { QueueModule } from '@/queue/queue.module';
import { ReportsModule } from '@/reports/reports.module';
import { DashboardModule } from '@/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Keep this as false for migrations
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        ssl: {
          rejectUnauthorized: false,
        },
        // logging: ['query', 'error'], // Enable query and error logging

        // Connection pool settings (uncomment if needed for extra protection)
        // Useful when running multiple instances or as defense-in-depth
        // extra: {
        //   max: 10,                 // Max connections in pool
        //   min: 2,                  // Min connections to keep warm
        //   idleTimeoutMillis: 30000, // Close idle connections after 30s
        // },
      }),
    }),

    AuthModule,
    MonitorModule,
    UserModule,
    CheckResultModule,
    AlertModule,
    QueueModule,
    ReportsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
