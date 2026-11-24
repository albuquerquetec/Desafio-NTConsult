import http from 'k6/http';
import { check } from 'k6';

const baseUrl = 'https://www.blazedemo.com';
const alvoHttp = Number(__ENV.ALVO_RPS || '250');
const segundos = __ENV.SEGUNDOS || '30';
const exigeVazao = __ENV.EXIGE_VAZAO === '1';
const chamadasPorCompra = 4;
const janelaSegundos = 2;
const comprasPorJanela = Math.max(1, Math.round((alvoHttp / chamadasPorCompra) * janelaSegundos));
const comprasPorSegundo = comprasPorJanela / janelaSegundos;

export const options = {
  scenarios: {
    compra: {
      executor: 'constant-arrival-rate',
      rate: comprasPorJanela,
      timeUnit: `${janelaSegundos}s`,
      duration: `${segundos}s`,
      preAllocatedVUs: Math.max(20, Math.ceil(comprasPorSegundo * 4)),
      maxVUs: Math.max(40, Math.ceil(comprasPorSegundo * 10)),
      gracefulStop: '20s',
    },
  },
  thresholds: exigeVazao
    ? {
        http_reqs: ['rate>249'],
        http_req_duration: ['p(90)<2000'],
        checks: ['rate>0.95'],
      }
    : {
        checks: ['rate>0.95'],
      },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

function hidden(html, name) {
  const found = String(html).match(new RegExp(`value="([^"]+)"\\s+name="${name}"`));
  return found ? found[1] : '';
}

export default function compra() {
  http.get(`${baseUrl}/`);
  const reserve = http.post(`${baseUrl}/reserve.php`, {
    fromPort: 'Paris',
    toPort: 'Buenos Aires',
  });
  http.post(`${baseUrl}/purchase.php`, {
    flight: hidden(reserve.body, 'flight'),
    price: hidden(reserve.body, 'price'),
    airline: hidden(reserve.body, 'airline'),
    fromPort: 'Paris',
    toPort: 'Buenos Aires',
  });
  const confirmation = http.post(`${baseUrl}/confirmation.php`, {
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
  });

  check(confirmation, {
    'compra confirmada': (response) =>
      response.status === 200 && String(response.body).includes('Thank you for your purchase today!'),
  });
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration?.values || {};
  const requests = data.metrics.http_reqs?.values || {};
  const failed = data.metrics.http_req_failed?.values || {};
  const checks = data.metrics.checks?.values || {};
  const dropped = data.metrics.dropped_iterations?.values || {};
  const summary = {
    plano: __ENV.PLANO || 'plano',
    titulo: __ENV.TITULO || 'Performance',
    alvoRps: alvoHttp,
    exigeVazao,
    duracaoSegundos: (data.state?.testRunDurationMs || 0) / 1000,
    requisicoes: requests.count || 0,
    requisicoesPorSegundo: requests.rate || 0,
    percentil90: duration['p(90)'] || 0,
    mediaMs: duration.avg || 0,
    taxaDeErro: failed.rate || 0,
    comprasConfirmadas: checks.rate || 0,
    iteracoesDescartadas: dropped.count || 0,
  };

  return {
    [`performance/resultados/${summary.plano}.json`]: JSON.stringify(summary, null, 2),
  };
}
