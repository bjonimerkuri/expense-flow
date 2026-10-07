import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { User } from './auth/user.entity';
import { ExpenseEvent } from './expenses/expense-event.entity';
import { Expense } from './expenses/expense.entity';
import { Role } from './common/roles';

const PASSWORD = 'password123';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const ds = app.get(DataSource);
  const users = ds.getRepository(User);

  const ensure = async (email: string, role: Role) => {
    const existing = await users.findOneBy({ email });
    if (existing) return existing;
    return users.save(users.create({ email, role, passwordHash: await bcrypt.hash(PASSWORD, 10) }));
  };

  const employee = await ensure('employee@example.com', 'employee');
  await ensure('manager@example.com', 'manager');
  await ensure('finance@example.com', 'finance');

  if ((await ds.getRepository(Expense).count()) === 0) {
    const samples = [
      ['Train to client workshop', 8450, 'travel'],
      ['Team lunch', 6200, 'meals'],
      ['IDE annual licence', 24900, 'software'],
      ['External monitor', 31900, 'equipment'],
    ] as const;
    for (const [title, amount, category] of samples) {
      const expense = await ds
        .getRepository(Expense)
        .save({ title, amount, category, submittedBy: employee.id, description: null });
      await ds
        .getRepository(ExpenseEvent)
        .save({ expenseId: expense.id, actorId: employee.id, fromStatus: null, toStatus: 'pending' });
    }
  }

  console.log(`Seeded. Log in with employee@example.com, manager@example.com or finance@example.com / ${PASSWORD}`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
