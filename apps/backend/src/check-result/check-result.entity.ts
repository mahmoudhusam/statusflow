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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ nullable: true })
  errorMessage?: string;

  @ManyToOne(() => Monitor, (monitor) => monitor.checkResults)
  @JoinColumn({ name: 'monitorId' })
  monitor: Monitor;

  @Column()
  monitorId: string;
}
