import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { Role } from '../src/common/roles';
import { configureApp } from '../src/configure-app';

export const PASSWORD = 'password123';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app, { swaggerUi: false });
  await app.init();
  return app;
}

export const http = (app: INestApplication) => request(app.getHttpServer());

export async function resetDatabase(app: INestApplication) {
  await app.get(DataSource).query('TRUNCATE expense_events, expenses, users RESTART IDENTITY CASCADE');
}

export async function createUser(app: INestApplication, email: string, role: Role) {
  const users = app.get(DataSource).getRepository(User);
  const hash = await bcrypt.hash(PASSWORD, 4); // low cost: tests only
  return users.save(users.create({ email, role, passwordHash: hash }));
}

export async function login(app: INestApplication, email: string): Promise<string> {
  const res = await http(app).post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 201) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.body.token;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
