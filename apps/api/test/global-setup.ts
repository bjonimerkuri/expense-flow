import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Runs once before the integration suite: bring the schema up to date on the test database.
// Uses the compiled output (`nest build` runs first) so the migration list matches production.
export default async function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/expenses_test';
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { dataSourceOptions } = require('../dist/data-source') as typeof import('../src/data-source');
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();
  await ds.runMigrations({ transaction: 'each' });
  await ds.destroy();
}
