import { expect } from '@playwright/test';

export class BlogSearchPage {
  constructor(page) {
    this.page = page;
    this.searchIcon = page.locator('a.astra-search-icon').first();
    this.overlay = page.locator('.ast-search-box');
  }

  async open() {
    await this.page.goto('https://blogdoagi.com.br/', { waitUntil: 'domcontentloaded' });
    await expect(this.searchIcon).toBeVisible();
  }

  async search(term) {
    const field = this.overlay.locator('input.search-field');
    await this.openSearch(field);
    await field.fill(term);
    await this.overlay.locator('button.search-submit').click();
    await this.page.waitForURL(/[?&]s=/);
  }

  async openSearch(field) {
    // O blog adia o script da lupa. O primeiro clique só carrega esse script; os seguintes abrem o campo.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.searchIcon.click({ noWaitAfter: true });
      if (await this.becomesVisible()) {
        return;
      }
    }
    await field.waitFor({ state: 'visible' });
  }

  async becomesVisible() {
    const field = this.overlay.locator('input.search-field');
    const started = Date.now();
    while (Date.now() - started < 2000) {
      if (await field.isVisible().catch(() => false)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return false;
  }

  async expectResultsHeading(term) {
    await expect(this.page.getByRole('heading', { level: 1 })).toContainText(
      `Resultados encontrados para: ${term}`,
    );
  }

  async expectArticleContaining(term) {
    const article = this.page.getByRole('heading', { level: 2 }).filter({ hasText: term }).first();
    await expect(article).toBeVisible();
  }

  async expectNoArticles(term) {
    await this.expectResultsHeading(term);
    await expect(
      this.page.getByText('Lamentamos, mas nada foi encontrado para sua pesquisa, tente novamente com outras palavras.'),
    ).toBeVisible();
  }
}
