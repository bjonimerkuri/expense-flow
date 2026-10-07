import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { AuthUser } from '../common/roles';
import { ExpenseEvent } from './expense-event.entity';
import { Expense } from './expense.entity';
import { canTransition, canViewExpense, isOwnExpense, roleCanMoveTo, Status } from './expense.rules';
import { CreateExpenseDto, ListQueryDto } from './expenses.dto';

const toView = (e: Expense) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  amount: e.amount,
  category: e.category,
  status: e.status,
  submittedBy: e.submittedBy,
  submitterEmail: e.submitter?.email ?? null,
  rejectionReason: e.rejectionReason,
  createdAt: e.createdAt,
});

@Injectable()
export class ExpensesService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(ExpenseEvent) private readonly events: Repository<ExpenseEvent>,
  ) {}

  create(user: AuthUser, dto: CreateExpenseDto) {
    return this.ds.transaction(async (m) => {
      const expense = await m.save(
        m.create(Expense, {
          title: dto.title,
          description: dto.description ?? null,
          amount: dto.amount,
          category: dto.category,
          submittedBy: user.id,
        }),
      );
      await m.save(ExpenseEvent, { expenseId: expense.id, actorId: user.id, fromStatus: null, toStatus: 'pending' });
      return { ...toView(expense), submitterEmail: user.email };
    });
  }

  async list(user: AuthUser, query: ListQueryDto) {
    const where: FindOptionsWhere<Expense> = {};
    if (user.role === 'employee') where.submittedBy = user.id;
    if (query.status) where.status = query.status;

    const [rows, total] = await this.expenses.findAndCount({
      where,
      relations: { submitter: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return { items: rows.map(toView), total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: number, user: AuthUser) {
    const expense = await this.expenses.findOne({ where: { id }, relations: { submitter: true } });
    if (!expense || !canViewExpense(user, expense)) throw new NotFoundException('Expense not found');

    const history = await this.events.find({
      where: { expenseId: id },
      relations: { actor: true },
      order: { createdAt: 'ASC' },
    });
    return {
      ...toView(expense),
      history: history.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        note: h.note,
        actorEmail: h.actor.email,
        createdAt: h.createdAt,
      })),
    };
  }

  async summary() {
    const byCategory = await this.expenses
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('e.status <> :rejected', { rejected: 'rejected' })
      .groupBy('e.category')
      .orderBy('total', 'DESC')
      .getRawMany();

    const byStatus = await this.expenses
      .createQueryBuilder('e')
      .select('e.status', 'status')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.status')
      .getRawMany();

    const format = (rows: Record<string, string>[], key: string) =>
      rows.map((r) => ({ [key]: r[key], total: Number(r.total), count: Number(r.count) }));
    return { byCategory: format(byCategory, 'category'), byStatus: format(byStatus, 'status') };
  }

  transition(id: number, user: AuthUser, to: Status, note?: string) {
    return this.ds.transaction(async (m) => {
      const expense = await m.findOne(Expense, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!expense || !canViewExpense(user, expense)) throw new NotFoundException('Expense not found');
      if (!roleCanMoveTo(user.role, to)) throw new ForbiddenException('Your role cannot do this');
      if (isOwnExpense(user, expense)) throw new ForbiddenException('You cannot act on your own expense');
      if (!canTransition(expense.status, to)) {
        throw new UnprocessableEntityException(`Cannot move an expense from ${expense.status} to ${to}`);
      }
      if (to === 'rejected' && !note) throw new BadRequestException('A reason is required');

      const from = expense.status;
      expense.status = to;
      expense.reviewerId = user.id;
      if (to === 'rejected') expense.rejectionReason = note ?? null;
      await m.save(expense);
      await m.save(ExpenseEvent, { expenseId: id, actorId: user.id, fromStatus: from, toStatus: to, note: note ?? null });

      return { id: expense.id, status: expense.status, rejectionReason: expense.rejectionReason };
    });
  }
}
