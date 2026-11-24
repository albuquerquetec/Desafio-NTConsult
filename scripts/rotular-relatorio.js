import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rotuloDoArquivo } from './guia-relatorio.js';

const require = createRequire(import.meta.url);
const { yauzl, yazl } = require('playwright-core/lib/utilsBundle');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportFile = path.join(__dirname, '..', 'playwright-report', 'index.html');

function rotularValor(valor) {
  if (typeof valor === 'string') {
    return rotuloDoArquivo(valor) ?? valor;
  }
  if (Array.isArray(valor)) {
    return valor.map(rotularValor);
  }
  if (valor && typeof valor === 'object') {
    const saida = {};
    for (const [chave, item] of Object.entries(valor)) {
      if ((chave === 'file' || chave === 'fileName') && typeof item === 'string') {
        saida[chave] = rotuloDoArquivo(item) ?? item;
      } else {
        saida[chave] = rotularValor(item);
      }
    }
    return saida;
  }
  return valor;
}

async function lerZip(buffer) {
  const zip = await yauzl.fromBufferPromise(buffer, { lazyEntries: true });
  const arquivos = [];
  await new Promise((resolve, reject) => {
    zip.on('entry', (entry) => {
      zip.openReadStream(entry, (error, stream) => {
        if (error) {
          reject(error);
          return;
        }
        const partes = [];
        stream.on('data', (parte) => partes.push(parte));
        stream.on('end', () => {
          arquivos.push({ name: entry.fileName, data: Buffer.concat(partes) });
          zip.readEntry();
        });
        stream.on('error', reject);
      });
    });
    zip.on('end', resolve);
    zip.on('error', reject);
    zip.readEntry();
  });
  return arquivos;
}

function gravarZip(arquivos) {
  return new Promise((resolve, reject) => {
    const zip = new yazl.ZipFile();
    for (const arquivo of arquivos) {
      zip.addBuffer(arquivo.data, arquivo.name);
    }
    const partes = [];
    zip.outputStream.on('data', (parte) => partes.push(parte));
    zip.outputStream.on('end', () => resolve(Buffer.concat(partes)));
    zip.outputStream.on('error', reject);
    zip.end();
  });
}

export async function rotularRelatorio() {
  if (!fs.existsSync(reportFile)) {
    return;
  }
  let html = fs.readFileSync(reportFile, 'utf8');
  const encontrado = html.match(/data:application\/zip;base64,([A-Za-z0-9+/=]+)/);
  if (!encontrado) {
    throw new Error('O relatório do Playwright não trouxe os dados dos testes.');
  }
  const arquivos = await lerZip(Buffer.from(encontrado[1], 'base64'));
  for (const arquivo of arquivos) {
    if (!arquivo.name.endsWith('.json')) {
      continue;
    }
    const json = JSON.parse(arquivo.data.toString('utf8'));
    arquivo.data = Buffer.from(JSON.stringify(rotularValor(json)));
  }
  const zip = await gravarZip(arquivos);
  html = html.replace(encontrado[0], `data:application/zip;base64,${zip.toString('base64')}`);
  html = html.replace(/<style>\s*#guia-dos-testes[\s\S]*?<\/style>/, '');
  html = html.replace(/<section id="guia-dos-testes">[\s\S]*?<\/section>/, '');
  fs.writeFileSync(reportFile, html);
}

class RotularRelatorio {
  async onEnd() {
    await rotularRelatorio();
  }
}

export default RotularRelatorio;
