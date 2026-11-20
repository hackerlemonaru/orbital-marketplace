import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/home/user/.cache/ms-playwright';
process.env.TMPDIR ||= '/home/user/.tmp';

const site = JSON.parse(readFileSync(resolve(root, 'src/data/site.json'), 'utf8'));
const outputDir = resolve(root, 'public/media/products');
mkdirSync(outputDir, { recursive: true });
const force = process.env.FORCE_PRODUCT_RENDER === '1';

const renders = site.featured.map((asset) => ({
  asset,
  target: resolve(root, 'public' + asset.productImage),
}));

function ready(target) {
  try {
    return !force && statSync(target).size > 1000;
  } catch {
    return false;
  }
}

const pending = renders.filter(({ target }) => !ready(target));
if (!pending.length) {
  console.log(`product renders: ${renders.length} validated shots already present; skipped`);
  process.exit(0);
}

const server = await createServer({
  root,
  configFile: resolve(root, 'vite.config.ts'),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, strictPort: false },
});
await server.listen();
const base = server.resolvedUrls?.local?.[0] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({
  headless: true,
  timeout: 30000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  for (const { asset, target } of pending) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(45000);
    try {
      const url = new URL('render-featured.html', base);
      url.searchParams.set('model', asset.modelPath);
      await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForFunction(() => window.__RENDER_READY__ === true, null, { timeout: 45000 });
      const error = await page.evaluate(() => window.__RENDER_ERROR__ || '');
      if (error) throw new Error(`Could not render ${asset.id}: ${error}`);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.screenshot({
        path: target,
        type: 'jpeg',
        quality: 88,
        clip: { x: 0, y: 0, width: 1200, height: 900 },
      });
      console.log('product render', asset.renderSlug, target);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
