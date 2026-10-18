# Contributing

## Setup

```bash
nvm use                 # Node 20
docker compose up -d    # PostgreSQL (creates the expenses and expenses_test databases)
npm ci
npm run db:migrate && npm run db:seed
npm run dev             # API on :3001 (Swagger UI at /api/docs), web on :4200
```

## Before you push

```bash
npm run check           # format, lint, typecheck, unit tests, build
npm run test:int        # API tests against a real database
npm run e2e             # Playwright; starts the API and web app for you
```

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- **Schema changes:** add a new TypeORM migration in `apps/api/src/migrations`, register it in `data-source.ts`, and never edit one that has shipped. `synchronize` stays off.
- **Business rules** (status flow, who may act, separation of duties) live in `apps/api/src/expenses/expense.rules.ts` as pure functions with unit tests. The API returns each expense's `actions` and the UI renders exactly those.
- **Accessibility:** every interactive element needs a visible label and a visible focus state. The e2e suite runs axe on
  key pages.
