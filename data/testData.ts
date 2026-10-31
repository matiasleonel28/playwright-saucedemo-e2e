export const PASSWORD = 'secret_sauce';

export const users = {
  standard: { username: 'standard_user', password: PASSWORD },
  lockedOut: { username: 'locked_out_user', password: PASSWORD },
  problem: { username: 'problem_user', password: PASSWORD },
  invalid: { username: 'invalid_user', password: 'wrong_password' },
} as const;

export const products = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
} as const;

/**
 * SauceDemo computes tax as 8% of the item total, rounds that tax to the cent,
 * then adds the rounded tax to the subtotal.
 */
export const TAX_RATE = 0.08;

export function expectedOrder(prices: readonly number[]) {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), tax, total };
}

export const customer = { firstName: 'Matias', lastName: 'Gomez', postalCode: '1425' } as const;

export const titles = {
  inventory: 'Products',
  cart: 'Your Cart',
} as const;

export const messages = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  invalid: 'Epic sadface: Username and password do not match any user in this service',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  inventoryRequiresLogin: "Epic sadface: You can only access '/inventory.html' when you are logged in.",
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
  orderComplete: 'Thank you for your order!',
} as const;
