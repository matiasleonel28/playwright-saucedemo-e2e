import { test, expect } from '../fixtures/test';
import { messages, titles, users } from '../data/testData';

// This file drives the login form, so it starts with no saved session.
// Every other spec reuses the session created by tests/auth.setup.ts.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in @smoke', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.title).toHaveText(titles.inventory);
  });

  test('locked out user sees an error @regression', async ({ page, loginPage }) => {
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await expect(loginPage.error).toHaveText(messages.lockedOut);
    await expect(page).not.toHaveURL(/inventory\.html/);
  });

  test('invalid credentials are rejected @regression', async ({ loginPage }) => {
    await loginPage.login(users.invalid.username, users.invalid.password);
    await expect(loginPage.error).toHaveText(messages.invalid);
  });

  test('problem user logs in but sees broken product images @regression', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(users.problem.username, users.problem.password);
    await expect(page).toHaveURL(/inventory\.html/);
    const sources = await inventoryPage.productImageSources();
    expect(sources.length).toBeGreaterThan(1);
    // Known defect of problem_user: every product shows the same image.
    expect(new Set(sources).size).toBe(1);
  });

  test('inventory is protected when not logged in @regression', async ({ loginPage, inventoryPage }) => {
    await inventoryPage.goto();
    await expect(loginPage.error).toHaveText(messages.inventoryRequiresLogin);
  });
});
