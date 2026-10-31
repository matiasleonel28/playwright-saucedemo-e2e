import { type Locator, type Page } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly productImages: Locator;
  readonly sortSelect: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly openMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.productImages = this.items.getByRole('img');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.openMenuButton = page.getByTestId('open-menu');
    this.logoutLink = page.getByRole('button', { name: 'Logout' });
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  async addToCart(name: string) {
    await this.item(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: SortOption) {
    await this.sortSelect.selectOption(option);
  }

  async productNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  async productPrices(): Promise<number[]> {
    const texts = await this.page.getByTestId('inventory-item-price').allTextContents();
    return texts.map((text) => Number(text.replace('$', '')));
  }

  /** `src` of each product image, in catalog order. */
  async productImageSources(): Promise<string[]> {
    return this.productImages.evaluateAll((images) =>
      images.map((image) => (image as HTMLImageElement).getAttribute('src') ?? ''),
    );
  }

  async openCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.openMenuButton.click();
    await this.logoutLink.click();
  }
}
