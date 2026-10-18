# Architecture

## Runtime

```mermaid
flowchart LR
  Browser["Angular SPA<br/>(static files)"] -- "/api/*" --> Fn["NestJS app<br/>(Vercel function)"]
  Fn -- "TypeORM, pooled" --> DB[("PostgreSQL<br/>(Neon)")]
  Dev["ng serve :4200"] -. "proxy /api" .-> Local["NestJS :3001"]
```

## Data model

```mermaid
erDiagram
  users ||--o{ expenses : "submittedBy"
  users |o--o{ expenses : "reviewerId"
  expenses ||--o{ expense_events : "audit trail"
  users ||--o{ expense_events : "actorId"
  users { int id PK  text email UK  text role }
  expenses { int id PK  text title  int amount_cents  text category  text status  int submittedBy FK  int reviewerId FK }
  expense_events { int id PK  int expenseId FK  int actorId FK  text fromStatus  text toStatus  text note }
```

## Status flow and who may move it

```mermaid
stateDiagram-v2
  [*] --> pending: employee submits
  pending --> approved: manager approves
  pending --> rejected: manager rejects (reason required)
  approved --> paid: finance pays
  rejected --> [*]
  paid --> [*]
```

Nobody may act on an expense they submitted, whatever their role.

## Where things live

| Concern | Location |
|---|---|
| Rules (pure, unit-tested) | `apps/api/src/expenses/expense.rules.ts` |
| Transitions, locking, audit events | `apps/api/src/expenses/expenses.service.ts` |
| Config and fail-fast env validation | `apps/api/src/config.ts` |
| Schema | `apps/api/src/migrations`, wired in `data-source.ts` |
| App wiring shared by server, function and tests | `apps/api/src/configure-app.ts` |
| Vercel function entry | `api/index.js` → `apps/api/src/serverless.ts` |
| Angular features / core / shared | `apps/web/src/app/{features,core,shared}` |
| Tests | unit `apps/api/src/*.spec.ts`, integration `apps/api/test/`, e2e `e2e/tests/` |
