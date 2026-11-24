import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const planos = [
  {
    id: 'carga',
    titulo: 'Teste de carga',
    alvoRps: 250,
    segundos: '30',
    exigeVazao: true,
  },
  {
    id: 'base',
    titulo: 'Linha de base',
    alvoRps: 10,
    segundos: '15',
    exigeVazao: false,
  },
  {
    id: 'pico',
    titulo: 'Teste de pico',
    alvoRps: 250,
    segundos: '20',
    exigeVazao: true,
  },
];

const outDir = path.join(__dirname, 'resultados');

function quoteArg(arg) {
  const text = String(arg);
  if (!/[\s"]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '')}"`;
}

function run(command, args) {
  const result = spawnSync(command, args.map(quoteArg), { stdio: 'inherit', shell: true });
  if (result.error) {
    return 1;
  }
  return result.status === null ? 1 : result.status;
}

function readPlan(id) {
  const file = path.join(outDir, `${id}.json`);
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function atende(measured) {
  if (!measured) {
    return false;
  }
  return measured.requisicoesPorSegundo >= 250 && measured.percentil90 < 2000 && measured.comprasConfirmadas >= 0.95;
}

function number(value, digits) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function percent(value) {
  return `${number((value || 0) * 100, 1)}%`;
}

function row(plan, measured) {
  const throughput = measured ? number(measured.requisicoesPorSegundo, 1) : 'não executou';
  const p90 = measured ? `${number(measured.percentil90, 0)} ms` : 'não executou';
  const confirmed = measured ? percent(measured.comprasConfirmadas) : 'não executou';
  const status = plan.exigeVazao ? (atende(measured) ? 'Atendeu' : 'Não atendeu') : 'Apoio do pico';
  return { plan, throughput, p90, confirmed, status };
}

function writeSummary(results, k6Missing) {
  fs.mkdirSync(outDir, { recursive: true });
  const judged = results.filter((item) => item.plan.exigeVazao);
  const ok = !k6Missing && judged.every((item) => item.status === 'Atendeu');
  const banner = k6Missing ? 'O k6 não está instalado' : ok ? 'Critério atendido' : 'Critério não atendido';
  const markdown = [
    `## Performance`,
    ``,
    `**${banner}**`,
    ``,
    `| Plano | Requisições por segundo | Percentil 90 | Compras confirmadas | Conclusão |`,
    `| --- | ---: | ---: | ---: | --- |`,
    ...results.map(
      (item) =>
        `| ${item.plan.titulo} | ${item.throughput} | ${item.p90} | ${item.confirmed} | ${item.status} |`,
    ),
    ``,
    `Os números completos estão no relatório principal, no bloco Dados do teste de Performance.`,
    ``,
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'resumo.md'), markdown);
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const version = spawnSync('k6', ['version'], { encoding: 'utf8', shell: true });
  if (version.status !== 0) {
    writeSummary(
      planos.map((plan) => row(plan, null)),
      true,
    );
    console.error('O k6 não está instalado.');
    process.exit(1);
  }

  let failed = false;
  for (const plan of planos) {
    const status = run('k6', [
      'run',
      path.join(__dirname, 'compra.js'),
      '-e',
      `PLANO=${plan.id}`,
      '-e',
      `ALVO_RPS=${plan.alvoRps}`,
      '-e',
      `SEGUNDOS=${plan.segundos}`,
      '-e',
      `EXIGE_VAZAO=${plan.exigeVazao ? '1' : '0'}`,
    ]);
    if (status !== 0 && status !== 99) {
      failed = true;
    }
  }

  const results = planos.map((plan) => row(plan, readPlan(plan.id)));
  writeSummary(results, false);
  process.exit(failed ? 1 : 0);
}

main();
