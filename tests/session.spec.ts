import { test, expect } from '../fixtures/test';
import { messages } from '../data/testData';

test.describe('Session', () => {
  test('logout returns to the login page and blocks inventory @regression', async ({
    loggedInPage,
    loginPage,
  }) => {
    await loggedInPage.logout();
    await expect(loginPage.loginButton).toBeVisible();

    await loggedInPage.goto();
    await expect(loginPage.error).toHaveText(messages.inventoryRequiresLogin);
  });
});
