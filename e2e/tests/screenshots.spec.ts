import { test } from '@playwright/test';
import { signIn } from './helpers';

// Regenerates the README images: npm run screenshots
test.use({ viewport: { width: 1280, height: 800 } });

test('@screenshots sign-in', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: 'docs/screenshots/sign-in.png' });
});

test('@screenshots manager queue', async ({ page }) => {
  await signIn(page, 'manager@example.com');
  await page.getByRole('table').waitFor();
  await page.screenshot({ path: 'docs/screenshots/queue.png' });
});

test('@screenshots dashboard', async ({ page }) => {
  await signIn(page, 'manager@example.com');
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('heading', { name: 'Spend by category' }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/dashboard.png' });
});
