import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');
const reportFile = path.join(raiz, 'playwright-report', 'index.html');
const resultados = path.join(raiz, 'performance', 'resultados');

const planos = [
  {
    id: 'carga',
    titulo: 'Teste de carga',
    exigeVazao: true,
    texto: 'Trinta segundos sustentados em 250 requisições por segundo.',
  },
  {
    id: 'base',
    titulo: 'Linha de base',
    exigeVazao: false,
    texto: 'Quinze segundos em cerca de 10 requisições por segundo, antes do pico.',
  },
  {
    id: 'pico',
    titulo: 'Teste de pico',
    exigeVazao: true,
    texto: 'Vinte segundos de pico em 250 requisições por segundo.',
  },
];

function numero(valor, casas) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function percentual(valor) {
  return `${numero((valor || 0) * 100, 1)}%`;
}

function atende(medido) {
  return Boolean(
    medido &&
      medido.requisicoesPorSegundo >= 250 &&
      medido.percentil90 < 2000 &&
      medido.comprasConfirmadas >= 0.95,
  );
}

function lerPlano(id) {
  const arquivo = path.join(resultados, `${id}.json`);
  if (!fs.existsSync(arquivo)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

function linha(medida, meta, resultado) {
  return `<tr><td>${medida}</td><td>${meta}</td><td>${resultado}</td></tr>`;
}

function tabela(plano, medido) {
  const vazao = medido ? numero(medido.requisicoesPorSegundo, 1) : 'não executou';
  const p90 = medido ? `${numero(medido.percentil90, 0)} ms` : 'não executou';
  const confirmadas = medido ? percentual(medido.comprasConfirmadas) : 'não executou';
  const erros = medido ? percentual(medido.taxaDeErro) : 'não executou';
  const descartadas = medido ? String(medido.iteracoesDescartadas || 0) : 'não executou';
  const conclusao = plano.exigeVazao ? (atende(medido) ? 'Atendeu' : 'Não atendeu') : 'Apoio do pico';
  return `<section>
    <h3>${plano.titulo}</h3>
    <p>${plano.texto}</p>
    <table>
      <tr><th>Medida</th><th>Meta</th><th>Resultado</th></tr>
      ${linha('Requisições por segundo', plano.exigeVazao ? '250 ou mais' : 'cerca de 10', vazao)}
      ${linha('Percentil 90', plano.exigeVazao ? 'abaixo de 2000 ms' : 'informativo', p90)}
      ${linha('Compras confirmadas', '95% ou mais', confirmadas)}
      ${linha('Erros HTTP', 'quanto menor, melhor', erros)}
      ${linha('Iterações descartadas', 'zero indica que a vazão foi sustentada', descartadas)}
      ${linha('Conclusão deste plano', '', conclusao)}
    </table>
  </section>`;
}

function htmlDosDados() {
  const medidos = planos.map((plano) => ({ plano, medido: lerPlano(plano.id) }));
  const julgados = medidos.filter((item) => item.plano.exigeVazao);
  const ok = julgados.every((item) => atende(item.medido));
  const faixa = ok ? 'Critério atendido' : 'Critério não atendido';
  return `<style id="dados-performance-estilo">
  #dados-performance { margin: 8px 0 16px; border: 1px solid var(--color-border-default, #d0d7de); border-radius: 6px; background: var(--color-canvas-overlay, var(--color-canvas-default, #fff)); color: var(--color-fg-default, #1c1c1c); font: 14px/1.45 -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif; }
  #dados-performance summary { padding: 10px 12px; font-weight: 600; }
  #dados-performance .corpo { padding: 0 12px 12px; }
  #dados-performance .faixa { padding: 8px 10px; margin: 0 0 10px; font-weight: 700; border-radius: 4px; }
  #dados-performance .faixa.ok { background: #e5f6e8; color: #1c1c1c; }
  #dados-performance .faixa.fail { background: #fde8e6; color: #1c1c1c; }
  #dados-performance h3 { margin: 12px 0 4px; font-size: 15px; }
  #dados-performance p { margin: 0 0 8px; }
  #dados-performance table { width: 100%; border-collapse: collapse; margin: 0 0 8px; }
  #dados-performance th, #dados-performance td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--color-border-muted, #d8dee4); vertical-align: top; }
  #dados-performance th { width: 34%; }
</style>
<details id="dados-performance">
  <summary>Dados do teste de Performance</summary>
  <div class="corpo">
    <p class="faixa ${ok ? 'ok' : 'fail'}">${faixa}</p>
    <p>O critério vale para a carga e para o pico, ao mesmo tempo: 250 requisições por segundo e percentil 90 abaixo de 2 segundos, com a compra confirmada.</p>
    ${medidos.map((item) => tabela(item.plano, item.medido)).join('\n')}
  </div>
</details>
<script id="dados-performance-script">
  const blocoPerformance = document.getElementById('dados-performance');
  function posicionarDadosPerformance() {
    if (!blocoPerformance) return;
    const cabecalho = [...document.querySelectorAll('.chip-header-allow-selection')]
      .find((item) => item.textContent.trim() === 'Teste Performance - fluxo/compra_passagem.spec.js');
    const grupo = cabecalho && cabecalho.closest('.chip');
    if (!grupo || grupo.nextElementSibling === blocoPerformance) return;
    grupo.insertAdjacentElement('afterend', blocoPerformance);
  }
  const observadorPerformance = new MutationObserver(posicionarDadosPerformance);
  observadorPerformance.observe(document.getElementById('root'), { childList: true, subtree: true });
  posicionarDadosPerformance();
</script>`;
}

export function embutirPerformance() {
  if (!fs.existsSync(reportFile)) {
    return;
  }
  let html = fs.readFileSync(reportFile, 'utf8');
  html = html.replace(/<style id="dados-performance-estilo">[\s\S]*?<\/style>\s*/g, '');
  html = html.replace(/<details id="dados-performance">[\s\S]*?<\/details>\s*/g, '');
  html = html.replace(/<script id="dados-performance-script">[\s\S]*?<\/script>\s*/g, '');
  const bloco = htmlDosDados();
  if (html.includes("<div id='root'></div>")) {
    html = html.replace("<div id='root'></div>", `<div id='root'></div>\n${bloco}`);
  } else {
    html = html.replace('</body>', `${bloco}</body>`);
  }
  fs.writeFileSync(reportFile, html);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  embutirPerformance();
}
