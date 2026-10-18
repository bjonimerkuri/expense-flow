# 2. One Vercel project, with NestJS running as a serverless function under /api

Status: accepted

## Decision

Deploy one Vercel project per repository. Angular is served as static output. `api/index.js` re-exports the compiled
NestJS app (`apps/api/dist/serverless.js`), which bootstraps once per warm instance and reuses the Express server for
later invocations. `vercel.json` rewrites `/api/*` to that function and every other path to `index.html`. Locally,
`ng serve` proxies `/api` to the API on port 3001, so the frontend always calls the relative URL `/api`.

## Consequences

- No CORS and no per-environment API URL.
- Each preview deployment is self-contained, with its own database branch through the Neon integration.
- Cold starts include Nest bootstrap and a database connection. Instances keep a pool of at most three connections,
  and the pooled Neon connection string should be used.
- TypeORM loads its driver dynamically, which Vercel's file tracer cannot see, so `serverless.ts` imports `pg`
  explicitly and `vercel.json` includes `apps/api/dist/**`.
- Swagger UI is local-only because its static assets do not bundle cleanly into a function. The OpenAPI document is
  always served at `/api/openapi.json`.
