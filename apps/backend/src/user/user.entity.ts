import { Monitor } from '../monitor/monitor.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AlertRule } from '@/alert/entities/alert-rule.entity';
import { NotificationChannel } from '@/alert/entities/notification-channel.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Monitor, (monitor) => monitor.user)
  monitors: Monitor[];

  @OneToMany(() => AlertRule, (alertRule) => alertRule.user)
  alertRules: AlertRule[];

  @OneToMany(() => NotificationChannel, (channel) => channel.user)
  notificationChannels: NotificationChannel[];
}
