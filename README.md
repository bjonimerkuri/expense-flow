# Expense Flow (Angular + NestJS + PostgreSQL)

An expense approval app. Employees submit expenses, managers approve or reject them, and finance marks approved ones as paid. A dashboard shows spend by category and status.

## What it demonstrates
**Angular**
- **NgRx SignalStore** for feature state: loading, errors, pagination and filters live in one store.
- **Optimistic updates with rollback:** approving or rejecting updates the UI immediately and restores the previous state if the API call fails.
- Standalone components, signals, the new control flow, lazy-loaded routes, functional guards (including a role guard factory) and an HTTP interceptor.
- Typed reactive forms, and a dashboard built with `toSignal`.

**NestJS**
- Feature modules, dependency injection, DTO validation with class-validator, and a global `ValidationPipe`.
- A custom `@CurrentUser()` decorator, a `@Roles()` decorator and a `RolesGuard` built on `Reflector`.
- TypeORM entities with relations, transactions and **pessimistic locking** on status changes.
- Swagger/OpenAPI docs at `/docs`, generated through the Nest Swagger plugin.

**Business rules**
- Status flow: `pending` to `approved` or `rejected`, then `approved` to `paid`. Rejected and paid are final.
- **Separation of duties:** nobody can approve, reject or pay their own expense.
- An **audit trail** (`expense_events`) records every status change with the actor and a note.
- Money is stored as integer cents.
- The rules live in pure functions with unit tests (Jest).

## Stack
Angular 18 · NgRx Signals · RxJS · NestJS 10 · TypeORM · PostgreSQL · JWT · Swagger · Jest

## Roles
| Role | Can do |
|---|---|
| employee | Submit expenses, see only their own |
| manager | See all, approve or reject, view the dashboard |
| finance | See all, mark approved expenses as paid, view the dashboard |

## Run locally
```bash
docker compose up -d
cd api && npm install && npm run seed && npm run start:dev
cd web && npm install && npm start
cd api && npm test
```
Open http://localhost:4200. API docs: http://localhost:3001/docs. Demo accounts (password `password123`): `employee@example.com`, `manager@example.com`, `finance@example.com`.

## API
| Method | Route | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | public |
| POST | `/expenses` | any user |
| GET | `/expenses?status=&page=&pageSize=` | employees see their own, others see all |
| GET | `/expenses/:id` | owner, manager or finance (includes history) |
| POST | `/expenses/:id/approve` and `/reject` | manager |
| POST | `/expenses/:id/pay` | finance |
| GET | `/expenses/summary` | manager, finance |

## Decisions and trade-offs
- **SignalStore instead of a full NgRx store:** less boilerplate for a feature of this size, with the same predictable state model.
- **Optimistic updates** make the UI feel instant, and the rollback keeps it honest when the server rejects a change.
- **Pessimistic locking** on the expense row prevents two reviewers from changing the same expense at once.
- **`synchronize: true`** is for the demo. Production should use migrations.
- **JWT in localStorage** keeps the demo simple. Prefer httpOnly cookies in production.

## Limitations and next steps
- [ ] API e2e tests against a real database, and Angular component tests
- [ ] TypeORM migrations
- [ ] Receipt uploads and email notifications
- [ ] Multi-currency
- [ ] Deploy a live demo and add the link and screenshots here
