import { type Locator, type Page } from '@playwright/test';

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly completeHeader: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.completeHeader = page.getByTestId('complete-header');
    this.cancelButton = page.getByTestId('cancel');
  }

  async fillInformation(info: { firstName?: string; lastName?: string; postalCode?: string }) {
    if (info.firstName !== undefined) await this.firstName.fill(info.firstName);
    if (info.lastName !== undefined) await this.lastName.fill(info.lastName);
    if (info.postalCode !== undefined) await this.postalCode.fill(info.postalCode);
    await this.continueButton.click();
  }

  async itemNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  /** Subtotal, tax, and total parsed from the overview labels. */
  async totals(): Promise<{ subtotal: number; tax: number; total: number }> {
    const [subtotal, tax, total] = await Promise.all([
      this.subtotal.textContent(),
      this.tax.textContent(),
      this.total.textContent(),
    ]);
    return {
      subtotal: parseAmount(subtotal),
      tax: parseAmount(tax),
      total: parseAmount(total),
    };
  }

  async finish() {
    await this.finishButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}

function parseAmount(text: string | null): number {
  return Number((text ?? '').replace(/[^0-9.]/g, ''));
}
