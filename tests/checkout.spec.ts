import { test, expect } from '../fixtures/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { customer, messages, products } from '../data/testData';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedInPage, cartPage }) => {
    await loggedInPage.addToCart(products.backpack);
    await loggedInPage.addToCart(products.bikeLight);
    await loggedInPage.openCart();
    await cartPage.checkout();
  });

  test('complete purchase end to end @smoke', async ({ page, checkoutPage }) => {
    await checkoutPage.fillInformation(customer);
    await expect(page).toHaveURL(/checkout-step-two\.html/);

    const subtotal = CheckoutPage.amount(await checkoutPage.subtotal.textContent());
    const tax = CheckoutPage.amount(await checkoutPage.tax.textContent());
    const total = CheckoutPage.amount(await checkoutPage.total.textContent());
    expect(subtotal).toBeCloseTo(29.99 + 9.99, 2);
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
});
