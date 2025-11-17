import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '@/user/user.entity';
import { Monitor } from '@/monitor/monitor.entity';
import { AlertHistory } from './alert-history.entity';

export enum AlertType {
  DOWNTIME = 'downtime',
  LATENCY = 'latency',
  STATUS_CODE = 'status_code',
  SSL_EXPIRY = 'ssl_expiry',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AlertType,
    default: AlertType.DOWNTIME,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.HIGH,
  })
  severity: AlertSeverity;

  @Column({ default: true })
  enabled: boolean;

  // Conditions
  @Column({ type: 'jsonb' })
  conditions: {
    consecutiveFailures?: number;
    latencyThreshold?: number;
    statusCodes?: number[];
    sslDaysBeforeExpiry?: number;
  };

  // Notification channels
  @Column({ type: 'jsonb' })
  channels: {
    email?: boolean;
    webhook?: {
      enabled: boolean;
      url?: string;
      headers?: Record<string, string>;
    };
    sms?: {
      enabled: boolean;
      phoneNumbers?: string[];
    };
  };

  @ManyToOne(() => User, (user) => user.alertRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Monitor, (monitor) => monitor.alertRules, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'monitorId' })
  monitor?: Monitor;

  @Column({ nullable: true })
  monitorId?: string;

  @OneToMany(() => AlertHistory, (history) => history.alertRule)
  history: AlertHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
