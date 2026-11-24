import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { embutirPerformance } from './embutir-performance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..'),
  });
  if (result.error) {
    return 1;
  }
  return result.status === null ? 1 : result.status;
}

const functional = run('npx', ['playwright', 'test']);
const performance = run('node', ['performance/executar.js']);
embutirPerformance();
process.exit(functional !== 0 || performance !== 0 ? 1 : 0);
