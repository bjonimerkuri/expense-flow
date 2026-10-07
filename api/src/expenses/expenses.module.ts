import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { ExpenseEvent } from './expense-event.entity';
import { Expense } from './expense.entity';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Expense, ExpenseEvent])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
