import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distIndex = resolve(root, 'dist/index.html');
const site = JSON.parse(readFileSync(resolve(root, 'src/data/site.json'), 'utf8'));
const metrics = JSON.parse(readFileSync(resolve(root, 'src/data/metrics.json'), 'utf8'));
const assetCount = new Intl.NumberFormat('en-US').format(metrics.assets);
const description = `Browse ${assetCount} models, shaders and motion assets. Every file shows its licence, source and checksum before you download.`;
const boot = JSON.stringify({ metrics, site }).replace(/</g, '\\u003c');

const server = await createServer({
  root,
  configFile: resolve(root, 'vite.config.ts'),
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});

try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx');
  const appHtml = render();
  let html = readFileSync(distIndex, 'utf8');
  html = html
    .replace('%ORBITAL_APP%', appHtml)
    .replaceAll('%ORBITAL_ASSET_COUNT%', assetCount)
    .replaceAll('%ORBITAL_DESCRIPTION%', description)
    .replaceAll('%ORBITAL_BOOT%', boot);
  if (html.includes('%ORBITAL_')) {
    throw new Error('Prerender placeholders were not fully resolved');
  }
  writeFileSync(distIndex, html);
  console.log(`prerendered hero with ${metrics.assets} assets and ${metrics.usedGib} GiB used`);
} finally {
  await server.close();
}
