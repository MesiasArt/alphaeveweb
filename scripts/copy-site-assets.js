import { copyFileSync, cpSync, mkdirSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const imageExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

mkdirSync(output, { recursive: true });

function writeArtistGalleryLists(artistsRoot) {
  if (!existsSync(artistsRoot)) return;
  for (const entry of readdirSync(artistsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const galleryDir = join(artistsRoot, entry.name, 'galeria');
    if (!existsSync(galleryDir) || !statSync(galleryDir).isDirectory()) {
      writeFileSync(join(artistsRoot, entry.name, 'galeria.json'), '[]\n');
      continue;
    }
    const files = readdirSync(galleryDir)
      .filter(name => imageExt.has(extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    writeFileSync(join(artistsRoot, entry.name, 'galeria.json'), `${JSON.stringify(files, null, 2)}\n`);
  }
}

writeArtistGalleryLists(resolve(root, 'artistas'));

for (const directory of ['artistas', 'series', 'clientes', 'historia', 'datos', 'eventos']) {
  cpSync(resolve(root, directory), resolve(output, directory), {
    recursive: true,
    filter: source => {
      const name = basename(source).toLowerCase();
      const extension = extname(name);
      return name !== 'readme.md' && name !== '.gitkeep' && extension !== '.tif' && extension !== '.tiff';
    },
  });
}

copyFileSync(resolve(root, 'alpha eve logo.png'), resolve(output, 'alpha eve logo.png'));
copyFileSync(resolve(root, 'alpha eve favicon.png'), resolve(output, 'alpha eve favicon.png'));
copyFileSync(resolve(root, 'banner.jpg'), resolve(output, 'banner.jpg'));
copyFileSync(resolve(root, 'packito logo.png'), resolve(output, 'packito logo.png'));
copyFileSync(resolve(root, 'editorial.js'), resolve(output, 'editorial.js'));
