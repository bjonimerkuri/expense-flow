import { INestApplication } from '@nestjs/common';
import { bearer, createTestApp, createUser, http, login, resetDatabase } from './helpers';

let app: INestApplication;
let employee: string;
let otherEmployee: string;
let manager: string;
let finance: string;

const expenseBody = { title: 'Taxi to airport', amount: 4250, category: 'travel' };

async function submit(token: string, overrides: Record<string, unknown> = {}) {
  const res = await http(app)
    .post('/api/expenses')
    .set(bearer(token))
    .send({ ...expenseBody, ...overrides });
  expect(res.status).toBe(201);
  return res.body as { id: number; status: string; actions: string[] };
}

const act = (token: string, id: number, action: 'approve' | 'reject' | 'pay', body: object = {}) =>
  http(app).post(`/api/expenses/${id}/${action}`).set(bearer(token)).send(body);

beforeAll(async () => {
  app = await createTestApp();
});
beforeEach(async () => {
  await resetDatabase(app);
  await createUser(app, 'employee@example.com', 'employee');
  await createUser(app, 'other@example.com', 'employee');
  await createUser(app, 'manager@example.com', 'manager');
  await createUser(app, 'finance@example.com', 'finance');
  employee = await login(app, 'employee@example.com');
  otherEmployee = await login(app, 'other@example.com');
  manager = await login(app, 'manager@example.com');
  finance = await login(app, 'finance@example.com');
});
afterAll(() => app.close());

describe('submitting and visibility', () => {
  it('stores money as integer cents and rejects anything else', async () => {
    const created = await submit(employee);
    expect(created.status).toBe('pending');
    expect(created.actions).toEqual([]); // you cannot act on your own expense

    const fractional = await http(app).post('/api/expenses').set(bearer(employee)).send({ ...expenseBody, amount: 42.5 });
    expect(fractional.status).toBe(400);
    const negative = await http(app).post('/api/expenses').set(bearer(employee)).send({ ...expenseBody, amount: -1 });
    expect(negative.status).toBe(400);
  });

  it('lets employees see only their own expenses, and 404s on anyone elses', async () => {
    const mine = await submit(employee);
    const theirs = await submit(otherEmployee, { title: 'Their lunch' });

    const list = await http(app).get('/api/expenses').set(bearer(employee));
    expect(list.body.items.map((e: { id: number }) => e.id)).toEqual([mine.id]);

    expect((await http(app).get(`/api/expenses/${theirs.id}`).set(bearer(employee))).status).toBe(404);
    expect((await http(app).get('/api/expenses').set(bearer(manager))).body.total).toBe(2);
  });

  it('tells reviewers what they can do next', async () => {
    const created = await submit(employee);
    const asManager = await http(app).get(`/api/expenses/${created.id}`).set(bearer(manager));
    const asFinance = await http(app).get(`/api/expenses/${created.id}`).set(bearer(finance));
    expect(asManager.body.actions).toEqual(['approve', 'reject']);
    expect(asFinance.body.actions).toEqual([]); // nothing to pay until it is approved
  });
});

describe('approval workflow', () => {
  it('runs pending, approved, paid with the right role at each step', async () => {
    const { id } = await submit(employee);

    expect((await act(finance, id, 'pay')).status).toBe(403); // wrong role
    expect((await act(manager, id, 'pay')).status).toBe(403);

    expect((await act(manager, id, 'approve')).body.status).toBe('approved');
    expect((await act(manager, id, 'approve')).status).toBe(422); // already approved

    expect((await act(finance, id, 'approve')).status).toBe(403);
    expect((await act(finance, id, 'pay')).body.status).toBe('paid');
    expect((await act(finance, id, 'pay')).status).toBe(422); // final state
  });

  it('requires a reason to reject, and rejected is final', async () => {
    const { id } = await submit(employee);
    expect((await act(manager, id, 'reject', {})).status).toBe(400);
    expect((await act(manager, id, 'reject', { reason: '  ' })).status).toBe(400);

    const rejected = await act(manager, id, 'reject', { reason: 'Missing receipt' });
    expect(rejected.body).toMatchObject({ status: 'rejected', rejectionReason: 'Missing receipt' });
    expect((await act(manager, id, 'approve')).status).toBe(422);
  });

  it('enforces separation of duties: nobody acts on their own expense', async () => {
    const own = await submit(manager, { title: 'Manager conference' });
    const res = await act(manager, own.id, 'approve');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/own expense/);
  });

  it('lets exactly one of two simultaneous reviewers win', async () => {
    const { id } = await submit(employee);
    const [a, b] = await Promise.all([act(manager, id, 'approve'), act(manager, id, 'reject', { reason: 'No' })]);
    expect([a.status, b.status].sort()).toEqual([201, 422]); // row lock: the loser sees the new state
  });

  it('keeps an audit trail of every change', async () => {
    const { id } = await submit(employee);
    await act(manager, id, 'approve');
    await act(finance, id, 'pay');

    const detail = await http(app).get(`/api/expenses/${id}`).set(bearer(manager));
    expect(detail.body.history.map((h: { toStatus: string }) => h.toStatus)).toEqual(['pending', 'approved', 'paid']);
    expect(detail.body.history.map((h: { actorEmail: string }) => h.actorEmail)).toEqual([
      'employee@example.com',
      'manager@example.com',
      'finance@example.com',
    ]);
  });
});

describe('listing and reporting', () => {
  it('filters by status and paginates', async () => {
    for (let i = 0; i < 12; i++) await submit(employee, { title: `Expense number ${i}` });
    const page3 = await http(app).get('/api/expenses?pageSize=5&page=3').set(bearer(manager));
    expect(page3.body).toMatchObject({ total: 12, page: 3 });
    expect(page3.body.items).toHaveLength(2);
    expect((await http(app).get('/api/expenses?status=paid').set(bearer(manager))).body.total).toBe(0);
    expect((await http(app).get('/api/expenses?status=bogus').set(bearer(manager))).status).toBe(400);
  });

  it('summarises spend for managers and finance only', async () => {
    const a = await submit(employee, { amount: 1000, category: 'meals' });
    await submit(employee, { amount: 2500, category: 'meals' });
    const c = await submit(employee, { amount: 9900, category: 'software' });
    await act(manager, a.id, 'approve');
    await act(manager, c.id, 'reject', { reason: 'Duplicate' });

    expect((await http(app).get('/api/expenses/summary').set(bearer(employee))).status).toBe(403);
    const summary = await http(app).get('/api/expenses/summary').set(bearer(finance));
    expect(summary.status).toBe(200);
    // Rejected spend is excluded from the category totals.
    expect(summary.body.byCategory).toEqual([{ category: 'meals', total: 3500, count: 2 }]);
    expect(summary.body.byStatus).toEqual(
      expect.arrayContaining([
        { status: 'approved', total: 1000, count: 1 },
        { status: 'pending', total: 2500, count: 1 },
        { status: 'rejected', total: 9900, count: 1 },
      ]),
    );
  });
});
