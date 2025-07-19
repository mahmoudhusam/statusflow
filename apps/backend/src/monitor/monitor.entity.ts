import { User } from '../user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { CheckResult } from '../check-result/check-result.entity';

@Entity()
export class Monitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ default: 60 })
  interval: number;

  @Column({ default: false })
  paused: boolean;

  @Column('int', { default: 500 })
  maxLatencyMs: number;

  @Column('int', { default: 3 })
  maxConsecutiveFailures: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.monitors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => CheckResult, (checkResult) => checkResult.monitor, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  checkResults: CheckResult[];
}
