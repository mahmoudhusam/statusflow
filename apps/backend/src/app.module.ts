import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MonitorModule } from './monitor/monitor.module';
import { UserModule } from './user/user.module';
import { CheckResultModule } from './check-result/check-result.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertService } from './alert/alert.service';
import { AlertModule } from './alert/alert.module';
import { QueueModule } from './queue/queue.module';
import { ReportsModule } from './reports/reports.module';

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
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Keep this as false for migrations
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        // logging: ['query', 'error'], // Enable query and error logging
      }),
    }),

    AuthModule,
    MonitorModule,
    UserModule,
    CheckResultModule,
    AlertModule,
    QueueModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AlertService],
})
export class AppModule {}
