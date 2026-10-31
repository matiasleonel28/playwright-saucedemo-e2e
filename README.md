# playwright-saucedemo-e2e

[![Playwright Tests](https://github.com/matiasleonel28/playwright-saucedemo-e2e/actions/workflows/playwright.yml/badge.svg)](https://github.com/matiasleonel28/playwright-saucedemo-e2e/actions/workflows/playwright.yml)

End-to-end tests for [SauceDemo](https://www.saucedemo.com), the public demo store from Sauce Labs. The app is small and stable, and it ships with users that behave differently (a locked-out user, a user with a known image defect), so it is a useful place to show how a Playwright suite is structured.

The suite checks that a shopper can sign in, sort the catalog, change the cart, and finish checkout, and that the unhappy paths around those steps fail in a way the UI actually reports.

## Stack

- [Playwright Test](https://playwright.dev) and TypeScript
- ESLint (`typescript-eslint` and `eslint-plugin-playwright`) and Prettier
- GitHub Actions

## Architecture

```
├── .github/workflows/playwright.yml   # lint, format, then Chromium and Firefox
├── data/testData.ts                   # users, products, prices, copy, tax rule
├── fixtures/auth.ts                   # path of the saved session file
├── fixtures/test.ts                   # page-object fixtures and loggedInPage
├── pages/                             # Page Object Model
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
├── tests/
│   ├── auth.setup.ts                  # signs in once; not a product test
│   ├── login.spec.ts                  # real login form, no saved session
│   ├── session.spec.ts
│   ├── inventory.spec.ts
│   ├── cart.spec.ts
│   └── checkout.spec.ts
└── playwright.config.ts
```

Three pieces connect, and each one has a single job.

**Page objects** own locators and the actions a user takes (`login`, `sortBy`, `addToCart`, `fillInformation`). Specs do not call `locator`, `getByRole`, or `getByTestId`. Assertions stay in the specs. A page object that asserts hides the failure inside a helper and makes the test title lie about what it checked.

**The setup project** (`tests/auth.setup.ts`) signs in as `standard_user` through the UI one time and writes cookies plus localStorage to `playwright/.auth/standard-user.json`. The Chromium and Firefox projects depend on `setup` and set `storageState` to that file, so every browser context starts already signed in. The file is gitignored: it is a live session, even though the demo password is public.

`loggedInPage` in `fixtures/test.ts` does not log in. It opens `/inventory.html` and checks the URL. If the saved session is missing or rejected, the fixture fails before the test body, which is the signal you want.

**`login.spec.ts` opts out** with `test.use({ storageState: { cookies: [], origins: [] } })`. Those cases still type into the form: valid user, `locked_out_user`, a bad password, empty fields, `problem_user`, and a direct visit to the inventory while logged out. Putting that opt-out on the file, instead of a second browser project, keeps "which browser" and "are we signed in?" as separate decisions.

`npm run test:smoke` and `npm run test:regression` still run the setup project first. `--grep` filters the browser projects; a project dependency is not skipped just because its title has no tag.

SauceDemo stores the session in a cookie named `session-username`. That is why one `storageState` file works in Firefox after Chromium created it. The cart lives in `localStorage` under `cart-contents`. Each test gets its own copy of the file, so adding an item in one test does not leak into the next.

The alternative was the previous fixture, which signed in through the UI before every test. That works, and it keeps tests independent, but it repeats the login journey inside cart and checkout failures and spends a navigation on every test. A `globalSetup` script can also write the file. A setup project is used here because it shows up in the report as its own test, and Playwright runs it automatically as a dependency.

## How to run locally

```bash
npm ci
npx playwright install --with-deps chromium firefox

npm test                 # Chromium and Firefox
npm run test:chromium   # faster loop while writing a test
npm run test:firefox
npm run test:smoke       # @smoke only (setup still runs)
npm run test:regression  # @regression only
npm run test:headed      # headed, both projects
npm run report           # HTML report
npm run lint
npm run format:check
```

On failure, Playwright keeps a trace, a screenshot, and a video under `test-results/`. Open a trace with `npx playwright show-trace <path-to-trace.zip>`.

## Test strategy

**Smoke** is the short path that says the shop still works: one successful login, sort by price low to high, add and remove from the cart, and one purchase. **Regression** is everything else: rejected logins, the other three sorts, cart persistence, continue shopping, checkout validation, cancel, logout, and the known `problem_user` image defect. A test carries one tag, in the title, because `--grep @smoke` matches the title. The suites do not overlap.

**Locators.** `playwright.config.ts` sets `testIdAttribute` to `data-test`, and `getByTestId` is the default when SauceDemo exposes one. `getByRole` is used when the accessible name is the label a person sees (`Add to cart`, `Remove`, `Logout`, `Open Menu`). The menu icon's `data-test="open-menu"` sits on the image, and the button in front of it receives the click, so logout uses the button's role. Product images in the `problem_user` check are `getByRole('img')` inside each inventory item. The image `data-test` contains the product name, and `img.inventory_item_img` is a CSS class, which is a styling hook rather than a contract.

**No hard waits.** Actions and web-first assertions (`toHaveText`, `toHaveURL`, `toBeVisible`, `toHaveCount`) wait on their own. There is no `waitForTimeout`. Sort tests compare the names or prices the page returned with a freshly sorted copy of that same array. The assertion describes the rule (ascending, descending) instead of a frozen list of six products that would need an edit every time the catalog changed.

`expectedOrder()` in `data/testData.ts` adds the catalog prices, takes 8%, rounds that tax to the cent with `toFixed(2)`, and adds the rounded tax to the subtotal. That is the same order of operations the app uses. The spec then checks that the total on screen equals the subtotal plus the tax it read, so a wrong label still fails even if our formula and the app drift together.

## Test cases

The Scenario column matches the test title, without the tag. Search the spec for that sentence.

| ID             | Area      | Scenario                                                      | Expected result                                                                                                                                                        | Tag         |
| -------------- | --------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| TC-LOGIN-01    | Login     | standard user can log in                                      | Inventory opens and the title is Products                                                                                                                              | @smoke      |
| TC-LOGIN-02    | Login     | locked out user sees an error                                 | Locked-out message is shown and the inventory URL is not opened                                                                                                        | @regression |
| TC-LOGIN-03    | Login     | invalid credentials are rejected                              | Credentials error is shown                                                                                                                                             | @regression |
| TC-LOGIN-04    | Login     | shows an error when username is empty                         | Username-required error is shown                                                                                                                                       | @regression |
| TC-LOGIN-05    | Login     | shows an error when password is empty                         | Password-required error is shown                                                                                                                                       | @regression |
| TC-LOGIN-06    | Login     | problem user logs in but sees broken product images           | Inventory opens, more than one image is rendered, and every `src` is the same                                                                                          | @regression |
| TC-LOGIN-07    | Login     | inventory is protected when not logged in                     | Login page shows that `/inventory.html` requires a session                                                                                                             | @regression |
| TC-SESSION-01  | Session   | logout returns to the login page and blocks inventory         | Login button is visible, and opening the inventory again shows the protected-route error                                                                               | @regression |
| TC-INV-01      | Inventory | sort by name A to Z                                           | After Z to A, choosing A to Z lists names in ascending order                                                                                                           | @regression |
| TC-INV-02      | Inventory | sort by name Z to A                                           | Names are in descending order                                                                                                                                          | @regression |
| TC-INV-03      | Inventory | sort by price low to high                                     | Prices are in ascending order                                                                                                                                          | @smoke      |
| TC-INV-04      | Inventory | sort by price high to low                                     | Prices are in descending order                                                                                                                                         | @regression |
| TC-CART-01     | Cart      | adding and removing products updates the badge and the cart   | Badge goes 2, then 1; the cart lists the backpack; removing it hides the badge                                                                                         | @smoke      |
| TC-CART-02     | Cart      | cart persists after page reload                               | Badge is still 1 after reload                                                                                                                                          | @regression |
| TC-CART-03     | Cart      | continue shopping returns to the inventory and keeps the cart | Inventory URL is shown and the badge is still 1                                                                                                                        | @regression |
| TC-CHECKOUT-01 | Checkout  | complete purchase end to end                                  | Overview lists backpack and bike light, subtotal matches the catalog, tax is 8% rounded to the cent, total equals subtotal plus tax, and the thank-you header is shown | @smoke      |
| TC-CHECKOUT-02 | Checkout  | shows validation error when first name is missing             | First-name error, still on step one                                                                                                                                    | @regression |
| TC-CHECKOUT-03 | Checkout  | shows validation error when last name is missing              | Last-name error, still on step one                                                                                                                                     | @regression |
| TC-CHECKOUT-04 | Checkout  | shows validation error when postal code is missing            | Postal-code error, still on step one                                                                                                                                   | @regression |
| TC-CHECKOUT-05 | Checkout  | cancel on the information step returns to the cart            | Cart URL is shown and both products are still in it                                                                                                                    | @regression |

The setup project's "authenticate as standard user" step is not in this table. It prepares state. It is not a claim about the product.

## Continuous integration

The badge above points at [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml). The workflow runs on every push to `main`, on pull requests against `main`, and when someone starts it by hand.

1. **Lint and format** runs `npm run lint` and `npm run format:check`. The browser jobs wait for this job, so a formatting miss does not spend time installing browsers.
2. **Playwright** is a matrix of Chromium and Firefox (`fail-fast: false`, so one browser does not cancel the other). Each job runs `npx playwright test --project=<browser>`. The Firefox job also installs Chromium, because the setup project signs in with Chromium and Firefox reuses the file.
3. **The HTML report is uploaded even when tests fail.** The upload step uses `if: ${{ !cancelled() }}`, so a failed test still publishes `playwright-report-chromium` or `playwright-report-firefox` (kept for 14 days). A cancelled run does not upload. On failure the report includes the trace, screenshot, and video for that test.

## Future improvements

- Open a product detail page and add to the cart from there. The list and the detail page are different routes and an easy place for a price or name to drift.
- Characterize `error_user` the same way `problem_user` images are characterized (adding an odd item id throws). Left out so this suite does not turn into a catalog of every intentional bug.
- Leave `performance_glitch_user` alone until there is a time budget. That user blocks the main thread for about five seconds, so a timing assertion would be slow and easy to flake.
- Add an axe scan of login and inventory with a written baseline. The demo already has violations; the useful failure is a new one.
- Cover **Reset App State** in the menu, which clears the cart without a reload. Logout already proves the session cookie is removed. This would prove the cart storage is removed.

## Author

**Matías Gomez** — QA Analyst, Buenos Aires · [@matiasleonel28](https://github.com/matiasleonel28)
