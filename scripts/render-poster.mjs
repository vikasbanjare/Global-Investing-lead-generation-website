// Renders the phone/tablet hero poster from the live 3D scene.
// Usage: npx vite build && node scripts/render-poster.mjs && npx vite build
// Writes public/city-poster.webp and prints the Wall Street label position (percent of the band)
// to paste into POSTER_LABEL in src/main.js.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';

const server = await preview({ preview: { port: 4180, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// 800px wide is inside the ≤900px layout, so the poster uses the exact phone framing (band 420px tall).
const page = await browser.newPage({ viewport: { width: 800, height: 1200 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:4180/?live', { waitUntil: 'networkidle' });
await page.waitForFunction(() => /translate3d/.test(document.querySelector(".ws-label").style.transform), null, { timeout: 60000 });
await page.waitForTimeout(4500); // intro finished, clouds settled
const label = await page.evaluate(() => {
  const canvas = document.querySelector('.hero-canvas');
  const m = /translate3d\(([\d.]+)px, ([\d.]+)px/.exec(document.querySelector('.ws-label').style.transform);
  return { x: (Number(m[1]) / canvas.clientWidth) * 100, y: ((Number(m[2]) - canvas.offsetTop) / canvas.clientHeight) * 100 };
});
await page.addStyleTag({ content: '.ws-label, .hero-fade, .hero-copy, .nav, .dock { visibility: hidden !important; }' });
const png = await page.locator('.hero-canvas').screenshot({ type: 'png', omitBackground: true });
const webp = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/webp', 0.6).split(',')[1];
}, png.toString('base64'));
writeFileSync('public/city-poster.webp', Buffer.from(webp, 'base64'));
console.log(`poster ${Math.round(Buffer.from(webp, 'base64').length / 1024)} KB; label at x=${label.x.toFixed(1)}% y=${label.y.toFixed(1)}%`);
// Keep the phone label in sync with the poster (the anchor moves whenever the scene changes).
const mainPath = 'src/main.js';
const main = readFileSync(mainPath, 'utf8');
const line = `const POSTER_LABEL = { x: ${(label.x / 100).toFixed(3)}, y: ${(label.y / 100).toFixed(3)} };`;
writeFileSync(mainPath, main.replace(/const POSTER_LABEL = \{[^}]*\};/, line));
console.log('updated', line);
await browser.close();
await new Promise((r) => server.httpServer.close(r));
