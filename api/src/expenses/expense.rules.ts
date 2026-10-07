import { AuthUser, Role } from '../common/roles';

export const STATUSES = ['pending', 'approved', 'rejected', 'paid'] as const;
export const CATEGORIES = ['travel', 'meals', 'software', 'equipment', 'other'] as const;

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];

const FLOW: Record<Status, Status[]> = {
  pending: ['approved', 'rejected'],
  approved: ['paid'],
  rejected: [],
  paid: [],
};

const ROLE_FOR_TARGET: Record<Status, Role | null> = {
  pending: null,
  approved: 'manager',
  rejected: 'manager',
  paid: 'finance',
};

export const canTransition = (from: Status, to: Status): boolean => FLOW[from].includes(to);

export const roleCanMoveTo = (role: Role, to: Status): boolean => ROLE_FOR_TARGET[to] === role;

export const isOwnExpense = (user: Pick<AuthUser, 'id'>, expense: { submittedBy: number }): boolean =>
  expense.submittedBy === user.id;

export const canViewExpense = (user: Pick<AuthUser, 'id' | 'role'>, expense: { submittedBy: number }): boolean =>
  user.role !== 'employee' || isOwnExpense(user, expense);
