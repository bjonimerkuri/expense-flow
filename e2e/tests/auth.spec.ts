import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('authentication', () => {
  test('sends signed-out visitors to the sign-in page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('shows a clear error for a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('employee@example.com');
    await page.getByLabel('Password').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
  });

  test('signs in with a demo account and keeps the session across a reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Manager' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Expenses');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Expenses');
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('the sign-in page has no detectable accessibility violations', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
