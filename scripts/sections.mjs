// Viewport screenshot of every section (full-page captures are unreliable with the WebGL canvas).
// Usage: npx vite build && node scripts/sections.mjs <outDir> [width=1440] [height=900] [page path, e.g. v2/]
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [out, w = 1440, h = 900, pagePath = ''] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const server = await preview({ preview: { port: 4181, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.goto(`http://localhost:4181/${pagePath}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const tops = await page.evaluate(() => [...document.querySelectorAll('main > section, main > div > section, footer')].map((el) => ({ name: (el.id || el.className.split(' ').pop()), top: Math.round(el.getBoundingClientRect().top + scrollY) })));
for (const [i, s] of tops.entries()) {
  await page.evaluate((y) => window.scrollTo(0, y), s.top);
  await page.waitForTimeout(1300); // scroll reveals finish (0.8s + stagger)
  await page.screenshot({ path: join(out, `${String(i).padStart(2, '0')}-${s.name}-${w}.png`) });
}
console.log(tops.map((s) => `${s.name}@${s.top}`).join(' '));
await browser.close();
await new Promise((r) => server.httpServer.close(r));
