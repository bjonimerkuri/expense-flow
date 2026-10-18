import { spawnSync } from 'node:child_process';

// Start every run from the same known data: migrated schema, demo users, sample expenses.
// The API web server has already compiled apps/api/dist by the time this runs.
export default function globalSetup() {
  const result = spawnSync('node', ['apps/api/dist/reset-cli.js'], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw new Error('database reset failed. Is PostgreSQL running (docker compose up -d)?');
}
