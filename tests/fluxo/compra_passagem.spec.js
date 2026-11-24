import { expect, test } from '@playwright/test';
import { BlazeDemoClient } from '../../src/api/BlazeDemoClient.js';

test.describe('Teste Performance - fluxo/compra_passagem.spec.js', () => {
  test('passagem comprada com sucesso', async ({ request }) => {
    const result = await new BlazeDemoClient(request).buy('Paris', 'Buenos Aires');
    expect(result.status).toBe(200);
    expect(result.text).toContain('Thank you for your purchase today!');
  });
});
