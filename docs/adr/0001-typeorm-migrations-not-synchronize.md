# 1. TypeORM migrations instead of `synchronize`

Status: accepted

## Context

The original project let TypeORM create and alter tables from the entities (`synchronize: true`). That is convenient
locally but can drop columns or data on a production database, and it leaves no record of how the schema changed.

## Decision

`synchronize` is off everywhere. The schema is created by explicit, hand-written migrations
(`apps/api/src/migrations`) that also carry what entities cannot express: `CHECK` constraints on role, category,
status and `amount > 0`, foreign keys, and indexes. A small runner (`migrate-cli.ts`) applies them under a Postgres
advisory lock, and the Vercel build runs it before deploying.

## Consequences

- The database rejects bad data even if the API is bypassed.
- Every schema change is reviewed in a pull request.
- Migrations are registered by import in `data-source.ts` rather than by glob, so they are bundled and traced reliably
  in the serverless function.
