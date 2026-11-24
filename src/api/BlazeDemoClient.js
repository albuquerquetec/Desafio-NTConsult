const baseUrl = 'https://www.blazedemo.com';

export class BlazeDemoClient {
  constructor(request) {
    this.request = request;
  }

  async buy(from, to) {
    await this.request.get(`${baseUrl}/`);
    const reserve = await this.request.post(`${baseUrl}/reserve.php`, {
      form: { fromPort: from, toPort: to },
    });
    const reserveHtml = await reserve.text();
    const purchase = await this.request.post(`${baseUrl}/purchase.php`, {
      form: {
        flight: this.hidden(reserveHtml, 'flight'),
        price: this.hidden(reserveHtml, 'price'),
        airline: this.hidden(reserveHtml, 'airline'),
        fromPort: from,
        toPort: to,
      },
    });
    if (!purchase.ok()) {
      throw new Error(`A escolha do voo respondeu ${purchase.status()}`);
    }
    const confirmation = await this.request.post(`${baseUrl}/confirmation.php`, {
      form: {
        inputName: 'Ada Lovelace',
        address: 'Rua 1',
        city: 'Sao Paulo',
        state: 'SP',
        zipCode: '01000-000',
        cardType: 'visa',
        creditCardNumber: '4111111111111111',
        creditCardMonth: '11',
        creditCardYear: '2028',
        nameOnCard: 'Ada Lovelace',
      },
    });
    return { status: confirmation.status(), text: await confirmation.text() };
  }

  hidden(html, name) {
    const match = html.match(new RegExp(`value="([^"]+)"\\s+name="${name}"`));
    if (!match) {
      throw new Error(`Nao achei o campo ${name} na lista de voos`);
    }
    return match[1];
  }
}
