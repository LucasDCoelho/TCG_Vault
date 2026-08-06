import { cp, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(frontRoot, 'dist', 'front', 'browser');
const appDir = join(dist, 'app');
const landing = join(frontRoot, 'landing');

if (!(await readdir(dist, { withFileTypes: true })).length) {
  throw new Error(`Output vazio em ${dist}. Rode 'npm run build' antes de 'build:deploy'.`);
}

await rm(appDir, { recursive: true, force: true });
await mkdir(appDir, { recursive: true });

for (const entry of await readdir(dist, { withFileTypes: true })) {
  if (entry.name === 'app') continue;
  await rename(join(dist, entry.name), join(appDir, entry.name));
}

for (const entry of await readdir(landing, { withFileTypes: true })) {
  if (entry.isFile()) {
    await cp(join(landing, entry.name), join(dist, entry.name));
  }
}

console.log('build:deploy ok — landing na raiz, SPA em /app/');
