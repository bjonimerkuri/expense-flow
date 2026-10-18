import 'reflect-metadata';
import { config } from './config';
import { AppDataSource } from './data-source';
import { seed } from './seed';

// Wipes every table and re-seeds the demo data. Used by the e2e suite. Never runs in production.
async function main() {
  if (config.isProd) throw new Error('db:reset is disabled in production');
  await AppDataSource.initialize();
  await AppDataSource.runMigrations({ transaction: 'each' });
  await AppDataSource.query('TRUNCATE expense_events, expenses, users RESTART IDENTITY CASCADE');
  await seed(AppDataSource);
  console.log('Database reset and seeded');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => AppDataSource.isInitialized && AppDataSource.destroy());
