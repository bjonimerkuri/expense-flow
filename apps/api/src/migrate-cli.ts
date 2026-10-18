import 'reflect-metadata';
import { AppDataSource } from './data-source';

// Applies pending migrations. Run by `npm run db:migrate` and by the Vercel build.
async function main() {
  await AppDataSource.initialize();
  // Serialise concurrent deploys on a Postgres advisory lock.
  await AppDataSource.query('SELECT pg_advisory_lock(727002)');
  try {
    const applied = await AppDataSource.runMigrations({ transaction: 'each' });
    console.log(applied.length ? `applied: ${applied.map((m) => m.name).join(', ')}` : 'database is up to date');
  } finally {
    await AppDataSource.query('SELECT pg_advisory_unlock(727002)');
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
