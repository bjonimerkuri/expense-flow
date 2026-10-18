import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from './auth/user.entity';
import { Role } from './common/roles';
import { ExpenseEvent } from './expenses/expense-event.entity';
import { Expense } from './expenses/expense.entity';
import { Status } from './expenses/expense.rules';

export const DEMO_PASSWORD = 'password123';

/** Idempotent: safe to run on every deploy. */
export async function seed(ds: DataSource) {
  const users = ds.getRepository(User);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const ensure = async (email: string, role: Role) => {
    const existing = await users.findOneBy({ email });
    if (existing) return existing;
    return users.save(users.create({ email, role, passwordHash: hash }));
  };

  const employee = await ensure('employee@example.com', 'employee');
  const manager = await ensure('manager@example.com', 'manager');
  const finance = await ensure('finance@example.com', 'finance');

  if ((await ds.getRepository(Expense).count()) > 0) return;

  const samples: [string, number, Expense['category'], Status][] = [
    ['Train to client workshop', 8450, 'travel', 'pending'],
    ['Team lunch', 6200, 'meals', 'pending'],
    ['IDE annual licence', 24900, 'software', 'approved'],
    ['External monitor', 31900, 'equipment', 'paid'],
    ['Conference ticket', 49900, 'other', 'rejected'],
  ];

  for (const [title, amount, category, status] of samples) {
    const expense = await ds.getRepository(Expense).save({
      title,
      amount,
      category,
      status,
      submittedBy: employee.id,
      description: null,
      reviewerId: status === 'pending' ? null : manager.id,
      rejectionReason: status === 'rejected' ? 'Not covered by the travel policy' : null,
    });
    const events = ds.getRepository(ExpenseEvent);
    const record = (actorId: number, from: Status | null, to: Status, note: string | null = null) =>
      events.save({ expenseId: expense.id, actorId, fromStatus: from, toStatus: to, note });

    await record(employee.id, null, 'pending');
    if (status === 'approved' || status === 'paid') await record(manager.id, 'pending', 'approved');
    if (status === 'paid') await record(finance.id, 'approved', 'paid');
    if (status === 'rejected') await record(manager.id, 'pending', 'rejected', 'Not covered by the travel policy');
  }
}
