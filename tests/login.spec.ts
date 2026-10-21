import { test, expect } from '../fixtures/test';
import { users, messages } from '../data/testData';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in @smoke', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.title).toHaveText('Products');
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

  test('problem user logs in but sees broken product images @regression', async ({ page, loginPage }) => {
    await loginPage.login(users.problem.username, users.problem.password);
    await expect(page).toHaveURL(/inventory\.html/);
    const srcs = await page
      .locator('img.inventory_item_img')
      .evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute('src')));
    // Known defect of problem_user: every product shows the same image.
    expect(new Set(srcs).size).toBe(1);
  });

  test('inventory is protected when not logged in @regression', async ({ page, loginPage }) => {
    await page.goto('/inventory.html');
    await expect(loginPage.error).toContainText(
      "You can only access '/inventory.html' when you are logged in",
    );
  });
});
