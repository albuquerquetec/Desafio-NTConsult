import { expect, test } from '@playwright/test';
import { DogApiClient } from '../../src/api/DogApiClient.js';

test.describe('Teste API - api/dog_api.spec.js', () => {
  test('listar todas as racas', async ({ request }) => {
    const body = await new DogApiClient(request).listAll();
    expectSuccess(body);
    const breeds = breedMap(body);
    expect(breeds).toHaveProperty('hound');
    expect(Array.isArray(breeds.hound)).toBe(true);
  });

  test('a lista distingue raca sem sub-raca e raca com sub-racas', async ({ request }) => {
    const body = await new DogApiClient(request).listAll();
    expectSuccess(body);
    const breeds = breedMap(body);
    expect(breeds.affenpinscher).toEqual([]);
    expect(breeds.bulldog.length).toBeGreaterThan(0);
  });

  test('listar imagens de uma raca existente', async ({ request }) => {
    const body = await new DogApiClient(request).imagesOf('hound');
    expectSuccess(body);
    expect(Array.isArray(body.body.message)).toBe(true);
    const images = body.body.message;
    expect(images.length).toBeGreaterThan(0);
    for (const image of images.slice(0, 5)) {
      expect(image).toMatch(/^https:\/\/images\.dog\.ceo\/.+\.(jpg|jpeg|png)$/i);
    }
  });

  test('consultar uma imagem aleatoria', async ({ request }) => {
    const body = await new DogApiClient(request).randomImage();
    expectSuccess(body);
    expect(body.body.message).toEqual(
      expect.stringMatching(/^https:\/\/images\.dog\.ceo\/.+\.(jpg|jpeg|png)$/i),
    );
  });

  test('consultar imagens de uma raca inexistente', async ({ request }) => {
    const body = await new DogApiClient(request).imagesOf('raca-inexistente-qa');
    expect(body.status).toBe(404);
    expect(body.body.status).toBe('error');
    expect(String(body.body.message)).toContain('Breed not found');
  });
});

function expectSuccess(body) {
  expect(body.status).toBe(200);
  expect(body.body.status).toBe('success');
}

function breedMap(body) {
  expect(typeof body.body.message).toBe('object');
  return body.body.message;
}
