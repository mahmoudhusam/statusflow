import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { AlertRule } from './alert-rule.entity';
import { Monitor } from '@/monitor/monitor.entity';

export enum AlertStatus {
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
  ACKNOWLEDGED = 'acknowledged',
}

@Entity('alert_history')
export class AlertHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.TRIGGERED,
  })
  status: AlertStatus;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    responseTime?: number;
    statusCode?: number;
    errorMessage?: string;
    consecutiveFailures?: number;
  };

  @Column({ type: 'jsonb' })
  channelsNotified: {
    email?: boolean;
    webhook?: boolean;
    sms?: boolean;
  };

  @ManyToOne(() => AlertRule, (rule) => rule.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alertRuleId' })
  alertRule: AlertRule;

  @Column()
  alertRuleId: string;

  @ManyToOne(() => Monitor, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitorId' })
  monitor?: Monitor;

  @Column({ nullable: true })
  monitorId?: string;

  @Column({ nullable: true })
  acknowledgedAt?: Date;

  @Column({ nullable: true })
  acknowledgedBy?: string;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  triggeredAt: Date;
}
