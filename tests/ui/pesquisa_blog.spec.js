import { test } from '@playwright/test';
import { BlogSearchPage } from '../../src/pages/BlogSearchPage.js';

test.describe('Teste UI - ui/pesquisa_blog.spec.js', () => {
  test('pesquisa com termo existente exibe artigos', async ({ page }) => {
    const blog = new BlogSearchPage(page);
    await blog.open();
    await blog.search('empréstimo');
    await blog.expectResultsHeading('empréstimo');
    await blog.expectArticleContaining('empréstimo');
  });

  test('pesquisa com termo inexistente informa ausencia de artigos', async ({ page }) => {
    const blog = new BlogSearchPage(page);
    await blog.open();
    await blog.search('xyzabc123naoexiste');
    await blog.expectNoArticles('xyzabc123naoexiste');
  });

  test('pesquisa com um unico caractere ainda abre a pagina de resultados', async ({ page }) => {
    const blog = new BlogSearchPage(page);
    await blog.open();
    await blog.search('a');
    await blog.expectResultsHeading('a');
  });
});
