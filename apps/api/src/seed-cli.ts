import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { DEMO_PASSWORD, seed } from './seed';

AppDataSource.initialize()
  .then(() => seed(AppDataSource))
  .then(() => console.log(`Seeded. Log in with employee@, manager@ or finance@example.com / ${DEMO_PASSWORD}`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => AppDataSource.isInitialized && AppDataSource.destroy());
