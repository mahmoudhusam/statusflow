import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Monitor } from '../monitor/monitor.entity';

@Index(['monitorId', 'createdAt'])
@Index('IDX_check_result_monitor_created_isUp', ['monitorId', 'createdAt', 'isUp'])
@Entity()
export class CheckResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: number;

  @Column()
  responseTime: number; //milliseconds

  @Column()
  isUp: boolean;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  responseHeaders?: Record<string, string>;

  @ManyToOne(() => Monitor, (monitor) => monitor.checkResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'monitorId' })
  monitor: Monitor;

  @Column()
  monitorId: string;
}
