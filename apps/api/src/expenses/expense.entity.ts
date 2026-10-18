import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Category, Status } from './expense.rules';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar' })
  category: Category;

  @Column({ type: 'varchar', default: 'pending' })
  status: Status;

  @Column({ type: 'int' })
  submittedBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'submittedBy' })
  submitter: User;

  @Column({ type: 'int', nullable: true })
  reviewerId: number | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
