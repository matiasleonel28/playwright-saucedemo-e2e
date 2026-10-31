import { test, expect } from '../fixtures/test';
import { customer, expectedOrder, messages, products } from '../data/testData';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedInPage, cartPage }) => {
    await loggedInPage.addToCart(products.backpack.name);
    await loggedInPage.addToCart(products.bikeLight.name);
    await loggedInPage.openCart();
    await cartPage.checkout();
  });

  test('complete purchase end to end @smoke', async ({ page, checkoutPage }) => {
    await checkoutPage.fillInformation(customer);
    await expect(page).toHaveURL(/checkout-step-two\.html/);
    expect(await checkoutPage.itemNames()).toEqual([products.backpack.name, products.bikeLight.name]);

    const { subtotal, tax, total } = await checkoutPage.totals();
    const expected = expectedOrder([products.backpack.price, products.bikeLight.price]);
    expect(subtotal).toBeCloseTo(expected.subtotal, 2);
    expect(tax).toBeCloseTo(expected.tax, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);

    await checkoutPage.finish();
    await expect(checkoutPage.completeHeader).toHaveText(messages.orderComplete);
  });

  const cases = [
    {
      field: 'first name',
      data: { lastName: customer.lastName, postalCode: customer.postalCode },
      error: messages.firstNameRequired,
    },
    {
      field: 'last name',
      data: { firstName: customer.firstName, postalCode: customer.postalCode },
      error: messages.lastNameRequired,
    },
    {
      field: 'postal code',
      data: { firstName: customer.firstName, lastName: customer.lastName },
      error: messages.postalCodeRequired,
    },
  ];

  for (const c of cases) {
    test(`shows validation error when ${c.field} is missing @regression`, async ({ page, checkoutPage }) => {
      await checkoutPage.fillInformation(c.data);
      await expect(checkoutPage.error).toHaveText(c.error);
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });
  }

  test('cancel on the information step returns to the cart @regression', async ({
    page,
    checkoutPage,
    cartPage,
  }) => {
    await checkoutPage.cancel();
    await expect(page).toHaveURL(/cart\.html/);
    expect(await cartPage.itemNames()).toEqual([products.backpack.name, products.bikeLight.name]);
  });
});
