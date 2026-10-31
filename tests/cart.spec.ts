import { test, expect } from '../fixtures/test';
import { products } from '../data/testData';

test.describe('Cart', () => {
  test('add and remove products updates the badge and cart @smoke', async ({ loggedInPage, cartPage }) => {
    await loggedInPage.addToCart(products.backpack.name);
    await loggedInPage.addToCart(products.bikeLight.name);
    await expect(loggedInPage.cartBadge).toHaveText('2');

    await loggedInPage.removeFromCart(products.bikeLight.name);
    await expect(loggedInPage.cartBadge).toHaveText('1');

    await loggedInPage.openCart();
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
});
