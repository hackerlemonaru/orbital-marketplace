import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = resolve(__dirname, '../..');
const phase = Number(process.argv[2] || '3');
const baseURL = process.argv[3] || 'http://127.0.0.1:4173/';
const widths = [1440, 1920, 390];
const outDir = resolve(repo, 'screenshots');
mkdirSync(outDir, { recursive: true });
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/home/user/.cache/ms-playwright';
process.env.TMPDIR ||= '/home/user/.tmp';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

async function settleImages(page) {
  await page.evaluate(async () => {
    const images = [...document.querySelectorAll('img')];
    images.forEach((image) => { image.loading = 'eager'; });
    await Promise.all(images.map(async (image) => {
      try { await image.decode(); } catch { /* a fallback source may still be resolving */ }
    }));
    images.filter((image) => image.closest('.product-shot') && image.naturalWidth > 0).forEach((image) => {
      image.dispatchEvent(new Event('load', { bubbles: true }));
      image.classList.add('is-loaded');
    });
  });
}

const cards = [];
try {
  for (const width of widths) {
    const height = width === 390 ? 844 : width === 1920 ? 1080 : 900;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    // Reduced motion is a deterministic, accessible capture state: the pinned
    // sequence renders its full card grid instead of a scroll-dependent frame.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    await settleImages(page);
    // Load lazy images and settle scroll-driven layout before tiled capture.
    let total = await page.evaluate(() => Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)));
    for (let y = 0; y < total; y += Math.max(600, height)) {
      await page.evaluate((position) => window.scrollTo(0, position), y);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);
    await settleImages(page);

    const tileDir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'orbital-tiles-'));
    const manifest = { output: resolve(outDir, `phase-${phase}-${width}.jpg`), width, total: 0, tiles: [] };
    try {
      // Chromium cannot capture very tall pages in one surface. Tile the viewport,
      // keep the first viewport's sticky navigation, then replace it with an
      // equal-height spacer so later tiles do not repeat the header.
      const first = join(tileDir, 'tile-0.jpg');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(160);
      await page.screenshot({ path: first, type: 'jpeg', quality: 82, animations: 'disabled' });
      manifest.tiles.push({ path: first, pasteY: 0, cropTop: 0, cropHeight: Math.min(height, total) });

      await page.evaluate(() => {
        const header = document.querySelector('.site-nav');
        if (header && !document.querySelector('.screenshot-nav-spacer')) {
          const spacer = document.createElement('div');
          spacer.className = 'screenshot-nav-spacer';
          spacer.style.height = `${header.getBoundingClientRect().height}px`;
          spacer.setAttribute('aria-hidden', 'true');
          header.before(spacer);
          header.style.position = 'absolute';
          header.style.top = '-10000px';
          header.style.visibility = 'hidden';
        }
        document.querySelectorAll('.scroll-progress').forEach((element) => { element.style.display = 'none'; });
      });
      await page.waitForTimeout(220);
      total = await page.evaluate(() => Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)));
      manifest.total = total;

      let index = 1;
      for (let y = height; y < total; y += height, index += 1) {
        const remaining = Math.min(height, total - y);
        const captureY = Math.max(0, Math.min(y, total - height));
        await page.evaluate((position) => window.scrollTo(0, position), captureY);
        await page.waitForTimeout(90);
        const tile = join(tileDir, `tile-${index}.jpg`);
        await page.screenshot({ path: tile, type: 'jpeg', quality: 82, animations: 'disabled' });
        manifest.tiles.push({
          path: tile,
          pasteY: y,
          cropTop: y - captureY,
          cropHeight: remaining,
        });
      }

      const manifestPath = join(tileDir, 'manifest.json');
      writeFileSync(manifestPath, JSON.stringify(manifest));
      execFileSync('python3', [resolve(__dirname, 'stitch-screenshots.py'), manifestPath], { stdio: 'inherit' });
      const data = readFileSync(manifest.output);
      cards.push({ width, height, file: manifest.output, bytes: data.length, dataUri: `data:image/jpeg;base64,${data.toString('base64')}`, errors });
      console.log(`phase ${phase} ${width}px: ${manifest.output} (${(data.length / 1024).toFixed(1)} KB, ${errors.length} console errors)`);
      if (errors.length) console.log(errors.slice(0, 5).map((error) => `  ${error}`).join('\n'));
    } finally {
      rmSync(tileDir, { recursive: true, force: true });
    }
    await page.close();
  }
} finally {
  await browser.close();
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ORBITAL phase ${phase} screenshots</title>
<style>
  body{margin:0;background:#08090B;color:#F4F5F7;font:16px/1.5 system-ui,sans-serif;padding:32px}
  h1{font-size:30px;letter-spacing:-.03em;margin:0 0 8px}p{color:#8B909A;margin:0 0 28px}
  section{margin:0 0 48px;border-top:1px solid rgba(255,255,255,.1);padding-top:20px}
  h2{font-size:20px;margin:0 0 14px}img{display:block;width:100%;height:auto;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#111317}
  .meta{font-size:13px;color:#8B909A;margin-top:8px}
</style></head><body>
<h1>ORBITAL — phase ${phase}</h1><p>Full-page captures at 1440, 1920 and 390 px wide.</p>
${cards.map((card) => `<section><h2>${card.width} px viewport</h2><img src="${card.dataUri}" alt="Phase ${phase} at ${card.width} pixels"><div class="meta">${card.file} · ${(card.bytes / 1024).toFixed(1)} KB · ${card.errors.length} console errors</div></section>`).join('\n')}
</body></html>`;
writeFileSync(resolve(outDir, `phase-${phase}-review.html`), html);
console.log(`review: ${resolve(outDir, `phase-${phase}-review.html`)}`);
