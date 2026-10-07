import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Status } from './expense.rules';

@Entity('expense_events')
export class ExpenseEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  expenseId: number;

  @Column({ type: 'int' })
  actorId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ type: 'varchar', nullable: true })
  fromStatus: Status | null;

  @Column({ type: 'varchar' })
  toStatus: Status;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
