export const PASSWORD = 'secret_sauce';

export const users = {
  standard: { username: 'standard_user', password: PASSWORD },
  lockedOut: { username: 'locked_out_user', password: PASSWORD },
  problem: { username: 'problem_user', password: PASSWORD },
  invalid: { username: 'invalid_user', password: 'wrong_password' },
} as const;

export const products = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
} as const;

export const customer = { firstName: 'Matias', lastName: 'Gomez', postalCode: '1425' } as const;

export const messages = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  invalid: 'Epic sadface: Username and password do not match any user in this service',
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
  orderComplete: 'Thank you for your order!',
} as const;
