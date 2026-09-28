import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');

mkdirSync(output, { recursive: true });

for (const directory of ['artistas', 'series', 'clientes', 'historia']) {
  cpSync(resolve(root, directory), resolve(output, directory), {
    recursive: true,
    filter: source => basename(source).toLowerCase() !== 'readme.md',
  });
}

copyFileSync(resolve(root, 'alpha eve logo.png'), resolve(output, 'alpha eve logo.png'));
