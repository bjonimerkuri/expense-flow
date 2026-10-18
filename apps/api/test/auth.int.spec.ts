import { INestApplication } from '@nestjs/common';
import { bearer, createTestApp, createUser, http, PASSWORD, resetDatabase } from './helpers';

let app: INestApplication;

beforeAll(async () => {
  app = await createTestApp();
});
beforeEach(() => resetDatabase(app));
afterAll(() => app.close());

describe('auth', () => {
  it('registers an employee, normalising the email', async () => {
    const res = await http(app).post('/api/auth/register').send({ email: ' New@Example.com ', password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'new@example.com', role: 'employee' });
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects a duplicate email', async () => {
    await createUser(app, 'dup@example.com', 'employee');
    const res = await http(app).post('/api/auth/register').send({ email: 'dup@example.com', password: PASSWORD });
    expect(res.status).toBe(409);
  });

  it('rejects a weak password and unknown fields', async () => {
    const weak = await http(app).post('/api/auth/register').send({ email: 'a@example.com', password: 'short' });
    expect(weak.status).toBe(400);
    const extra = await http(app)
      .post('/api/auth/register')
      .send({ email: 'a@example.com', password: PASSWORD, role: 'finance' });
    expect(extra.status).toBe(400); // cannot self-assign a role
  });

  it('answers wrong password and unknown email identically', async () => {
    await createUser(app, 'a@example.com', 'employee');
    const wrongPassword = await http(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'nope-nope' });
    const unknownEmail = await http(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: PASSWORD });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('requires a valid bearer token', async () => {
    expect((await http(app).get('/api/expenses')).status).toBe(401);
    expect((await http(app).get('/api/expenses').set(bearer('garbage'))).status).toBe(401);
  });

  it('answers the health check and serves the OpenAPI document', async () => {
    expect((await http(app).get('/api/health')).body).toEqual({ status: 'ok' });
    const doc = await http(app).get('/api/openapi.json');
    expect(doc.status).toBe(200);
    expect(doc.body.paths['/api/expenses']).toBeDefined();
  });
});
