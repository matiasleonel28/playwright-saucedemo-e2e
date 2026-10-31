import { test, expect } from '../fixtures/test';

test.describe('Inventory sorting', () => {
  test('sort by name A to Z @regression', async ({ loggedInPage }) => {
    // The catalog already opens in A to Z. Leave that order and come back,
    // or this passes even when the A to Z option does nothing.
    await loggedInPage.sortBy('za');
    await loggedInPage.sortBy('az');
    const names = await loggedInPage.productNames();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('sort by name Z to A @regression', async ({ loggedInPage }) => {
    await loggedInPage.sortBy('za');
    const names = await loggedInPage.productNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('sort by price low to high @smoke', async ({ loggedInPage }) => {
    await loggedInPage.sortBy('lohi');
    const prices = await loggedInPage.productPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sort by price high to low @regression', async ({ loggedInPage }) => {
    await loggedInPage.sortBy('hilo');
    const prices = await loggedInPage.productPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });
});
