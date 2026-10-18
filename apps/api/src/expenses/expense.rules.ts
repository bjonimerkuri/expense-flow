import { AuthUser, Role } from '../common/roles';

export const STATUSES = ['pending', 'approved', 'rejected', 'paid'] as const;
export const CATEGORIES = ['travel', 'meals', 'software', 'equipment', 'other'] as const;
export const ACTIONS = ['approve', 'reject', 'pay'] as const;

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type ReviewAction = (typeof ACTIONS)[number];

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

const TARGET_OF: Record<ReviewAction, Status> = { approve: 'approved', reject: 'rejected', pay: 'paid' };

export const canTransition = (from: Status, to: Status): boolean => FLOW[from].includes(to);

export const roleCanMoveTo = (role: Role, to: Status): boolean => ROLE_FOR_TARGET[to] === role;

export const isOwnExpense = (user: Pick<AuthUser, 'id'>, expense: { submittedBy: number }): boolean =>
  expense.submittedBy === user.id;

export const canViewExpense = (user: Pick<AuthUser, 'id' | 'role'>, expense: { submittedBy: number }): boolean =>
  user.role !== 'employee' || isOwnExpense(user, expense);

/**
 * What this user may do to this expense right now: the right role, a valid transition, and not their own
 * expense (separation of duties). The API returns this list so the UI never re-implements the rules.
 */
export const allowedActions = (
  user: Pick<AuthUser, 'id' | 'role'>,
  expense: { status: Status; submittedBy: number },
): ReviewAction[] => {
  if (isOwnExpense(user, expense)) return [];
  return ACTIONS.filter(
    (action) => canTransition(expense.status, TARGET_OF[action]) && roleCanMoveTo(user.role, TARGET_OF[action]),
  );
};
