export class DogApiClient {
  constructor(request) {
    this.request = request;
  }

  listAll() {
    return this.get('/api/breeds/list/all');
  }

  imagesOf(breed) {
    return this.get(`/api/breed/${encodeURIComponent(breed)}/images`);
  }

  randomImage() {
    return this.get('/api/breeds/image/random');
  }

  async get(path) {
    const response = await this.request.get(`https://dog.ceo${path}`);
    const text = await response.text();
    let body = { message: text };
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
    return { status: response.status(), body, text };
  }
}
