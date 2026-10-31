import { test, expect } from '../fixtures/test';
import { products, titles } from '../data/testData';

test.describe('Cart', () => {
  test('adding and removing products updates the badge and the cart @smoke', async ({
    loggedInPage,
    cartPage,
  }) => {
    await loggedInPage.addToCart(products.backpack.name);
    await loggedInPage.addToCart(products.bikeLight.name);
    await expect(loggedInPage.cartBadge).toHaveText('2');

    await loggedInPage.removeFromCart(products.bikeLight.name);
    await expect(loggedInPage.cartBadge).toHaveText('1');

    await loggedInPage.openCart();
    await expect(cartPage.title).toHaveText(titles.cart);
    expect(await cartPage.itemNames()).toEqual([products.backpack.name]);

    await cartPage.remove(products.backpack.name);
    await expect(cartPage.items).toHaveCount(0);
    await expect(loggedInPage.cartBadge).toBeHidden();
  });

  test('cart persists after page reload @regression', async ({ page, loggedInPage }) => {
    await loggedInPage.addToCart(products.boltTShirt.name);
    await page.reload();
    await expect(loggedInPage.cartBadge).toHaveText('1');
  });

  test('continue shopping returns to the inventory and keeps the cart @regression', async ({
    page,
    loggedInPage,
    cartPage,
  }) => {
    await loggedInPage.addToCart(products.backpack.name);
    await loggedInPage.openCart();
    await cartPage.continueShopping();
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(loggedInPage.cartBadge).toHaveText('1');
  });
});
