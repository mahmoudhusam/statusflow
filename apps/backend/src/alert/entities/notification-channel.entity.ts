import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@/user/user.entity';

export enum ChannelType {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  SLACK = 'slack',
}

@Entity('notification_channels')
export class NotificationChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ChannelType,
  })
  type: ChannelType;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb' })
  configuration: {
    // Email config
    emailAddresses?: string[];

    // Webhook config
    webhookUrl?: string;
    webhookHeaders?: Record<string, string>;
    webhookMethod?: string;

    // SMS config
    phoneNumbers?: string[];

    // Slack config
    slackWebhookUrl?: string;
    slackChannel?: string;
  };

  // Quiet hours configuration
  @Column({ type: 'jsonb', nullable: true })
  quietHours?: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "08:00"
    timezone: string; // "America/New_York"
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  lastTestAt?: Date;

  @Column({ nullable: true })
  lastTestSuccess?: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
