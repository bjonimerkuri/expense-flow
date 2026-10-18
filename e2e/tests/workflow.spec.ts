import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createExpenseAs, signIn, signOutAndIn, uniqueTitle } from './helpers';

const rowFor = (page: import('@playwright/test').Page, title: string) =>
  page.getByRole('row').filter({ has: page.getByRole('link', { name: title }) });

test.describe('expense approval workflow', () => {
  test('an expense goes from submitted to approved to paid, with a full audit trail', async ({ page }) => {
    const title = uniqueTitle('Client dinner');

    // Employee submits.
    await signIn(page, 'employee@example.com');
    await page.getByRole('link', { name: 'New expense' }).first().click();
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Amount (EUR)').fill('84.50');
    await page.getByLabel('Category').selectOption('meals');
    await page.getByRole('button', { name: 'Submit for approval' }).click();
    await expect(rowFor(page, title)).toContainText('Pending');
    await expect(rowFor(page, title)).toContainText('€84.50');
    await expect(rowFor(page, title).getByRole('button')).toHaveCount(0); // cannot act on own expense

    // Manager approves.
    await signOutAndIn(page, 'manager@example.com');
    await rowFor(page, title).getByRole('button', { name: /^Approve/ }).click();
    await expect(rowFor(page, title)).toContainText('Approved');
    await expect(rowFor(page, title).getByRole('button')).toHaveCount(0); // managers cannot pay

    // Finance pays.
    await signOutAndIn(page, 'finance@example.com');
    await rowFor(page, title).getByRole('button', { name: /^Mark paid/ }).click();
    await expect(rowFor(page, title)).toContainText('Paid');

    // Everyone involved is on the record.
    await page.getByRole('link', { name: title }).click();
    const history = page.getByRole('region', { name: 'History' }).getByRole('listitem');
    await expect(history).toHaveCount(3);
    await expect(history.nth(0)).toContainText('employee@example.com');
    await expect(history.nth(1)).toContainText('manager@example.com');
    await expect(history.nth(2)).toContainText('finance@example.com');
  });

  test('rejecting needs a reason, which the employee can then see', async ({ page, request }) => {
    const title = uniqueTitle('Conference ticket');
    await createExpenseAs(request, 'employee@example.com', title, 49900);

    await signIn(page, 'manager@example.com');
    await rowFor(page, title).getByRole('button', { name: /^Reject/ }).click();
    const confirm = page.getByRole('button', { name: 'Reject expense' });
    await expect(confirm).toBeDisabled();
    await page.getByLabel(/Reason for rejecting/).fill('Not covered by policy');
    await confirm.click();
    await expect(rowFor(page, title)).toContainText('Rejected');

    await signOutAndIn(page, 'employee@example.com');
    await expect(page.getByText('Rejected: Not covered by policy')).toBeVisible();
  });

  test('a manager cannot approve their own expense', async ({ page, request }) => {
    const title = uniqueTitle('Manager laptop bag');
    await createExpenseAs(request, 'manager@example.com', title);
    await signIn(page, 'manager@example.com');
    await expect(rowFor(page, title)).toContainText('Pending');
    await expect(rowFor(page, title).getByRole('button')).toHaveCount(0);
  });

  test('rolls the optimistic update back when the server refuses', async ({ page, request }) => {
    const title = uniqueTitle('Flaky approval');
    await createExpenseAs(request, 'employee@example.com', title);
    await page.route('**/api/expenses/*/approve', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Boom' }) }),
    );

    await signIn(page, 'manager@example.com');
    await rowFor(page, title).getByRole('button', { name: /^Approve/ }).click();
    await expect(page.getByRole('alert')).toHaveText('Boom');
    await expect(rowFor(page, title)).toContainText('Pending'); // restored
  });
});

test.describe('access by role', () => {
  test('employees have no dashboard, managers do', async ({ page }) => {
    await signIn(page, 'employee@example.com');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/$/); // guard redirects home

    await signOutAndIn(page, 'manager@example.com');
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Spend by category' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Totals by status' })).toBeVisible();
  });

  test("an employee cannot open someone else's expense", async ({ page, request }) => {
    const id = await createExpenseAs(request, 'manager@example.com', uniqueTitle('Private expense'));
    await signIn(page, 'employee@example.com');
    await page.goto(`/expenses/${id}`);
    await expect(page.getByRole('alert')).toHaveText('Expense not found');
  });

  test('the expense list has no detectable accessibility violations', async ({ page }) => {
    await signIn(page, 'manager@example.com');
    await expect(page.getByRole('table')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
