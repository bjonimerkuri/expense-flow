import { allowedActions, canTransition, canViewExpense, isOwnExpense, roleCanMoveTo } from './expense.rules';

describe('expense status flow', () => {
  it('allows pending to approved or rejected', () => {
    expect(canTransition('pending', 'approved')).toBe(true);
    expect(canTransition('pending', 'rejected')).toBe(true);
  });

  it('only allows paying approved expenses', () => {
    expect(canTransition('approved', 'paid')).toBe(true);
    expect(canTransition('pending', 'paid')).toBe(false);
    expect(canTransition('rejected', 'paid')).toBe(false);
  });

  it('treats rejected and paid as final', () => {
    expect(canTransition('rejected', 'approved')).toBe(false);
    expect(canTransition('paid', 'approved')).toBe(false);
  });
});

describe('roles', () => {
  it('lets managers approve and reject, but not pay', () => {
    expect(roleCanMoveTo('manager', 'approved')).toBe(true);
    expect(roleCanMoveTo('manager', 'rejected')).toBe(true);
    expect(roleCanMoveTo('manager', 'paid')).toBe(false);
  });

  it('lets only finance pay', () => {
    expect(roleCanMoveTo('finance', 'paid')).toBe(true);
    expect(roleCanMoveTo('finance', 'approved')).toBe(false);
  });

  it('never lets employees move an expense', () => {
    expect(roleCanMoveTo('employee', 'approved')).toBe(false);
    expect(roleCanMoveTo('employee', 'paid')).toBe(false);
  });
});

describe('visibility and ownership', () => {
  it('lets employees see only their own expenses', () => {
    expect(canViewExpense({ id: 1, role: 'employee' }, { submittedBy: 1 })).toBe(true);
    expect(canViewExpense({ id: 1, role: 'employee' }, { submittedBy: 2 })).toBe(false);
  });

  it('lets managers and finance see everything', () => {
    expect(canViewExpense({ id: 9, role: 'manager' }, { submittedBy: 2 })).toBe(true);
    expect(canViewExpense({ id: 9, role: 'finance' }, { submittedBy: 2 })).toBe(true);
  });

  it('detects the submitter', () => {
    expect(isOwnExpense({ id: 3 }, { submittedBy: 3 })).toBe(true);
    expect(isOwnExpense({ id: 3 }, { submittedBy: 4 })).toBe(false);
  });
});

describe('allowedActions', () => {
  it('lets a manager approve or reject a pending expense they did not submit', () => {
    expect(allowedActions({ id: 2, role: 'manager' }, { status: 'pending', submittedBy: 1 })).toEqual([
      'approve',
      'reject',
    ]);
  });

  it('never lets someone act on their own expense', () => {
    expect(allowedActions({ id: 2, role: 'manager' }, { status: 'pending', submittedBy: 2 })).toEqual([]);
    expect(allowedActions({ id: 3, role: 'finance' }, { status: 'approved', submittedBy: 3 })).toEqual([]);
  });

  it('lets finance pay only approved expenses', () => {
    expect(allowedActions({ id: 3, role: 'finance' }, { status: 'approved', submittedBy: 1 })).toEqual(['pay']);
    expect(allowedActions({ id: 3, role: 'finance' }, { status: 'pending', submittedBy: 1 })).toEqual([]);
  });

  it('offers employees nothing, and nothing on final states', () => {
    expect(allowedActions({ id: 1, role: 'employee' }, { status: 'pending', submittedBy: 9 })).toEqual([]);
    expect(allowedActions({ id: 2, role: 'manager' }, { status: 'paid', submittedBy: 1 })).toEqual([]);
    expect(allowedActions({ id: 2, role: 'manager' }, { status: 'rejected', submittedBy: 1 })).toEqual([]);
  });
});
