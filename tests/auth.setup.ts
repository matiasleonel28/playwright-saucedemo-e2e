import { expect, test as setup } from '@playwright/test';
import { users } from '../data/testData';
import { standardUserAuthFile } from '../fixtures/auth';
import { LoginPage } from '../pages/LoginPage';

setup('authenticate as standard user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await expect(page).toHaveURL(/inventory\.html/);
  await page.context().storageState({ path: standardUserAuthFile });
});
