// Section screenshots of /v10/ at desktop and phone. Usage: npx vite build && node scripts/v10-shots.mjs <outdir>
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const out = process.argv[2]; mkdirSync(out, { recursive: true });
const ids = ['top', 'fractional', 'product', 'brands', 'why', 'how', 'pricing', 'tax', 'faq', 'start'];
const server = await preview({ preview: { port: 4194, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ channel: 'chrome' });
for (const [tag, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
  // hero with motion (settled), sections with reduced motion so reveals don't hide content
  const hero = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'phone' ? 2 : 1 });
  await hero.goto('http://localhost:4194/v10/', { waitUntil: 'networkidle' });
  await hero.waitForTimeout(2600);
  await hero.screenshot({ path: `${out}/${tag}-hero.png` });
  await hero.close();
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'phone' ? 2 : 1, reducedMotion: 'reduce' });
  await page.goto('http://localhost:4194/v10/', { waitUntil: 'networkidle' });
  for (const id of ids) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await el.screenshot({ path: `${out}/${tag}-${id}.png` });
  }
  await page.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true });
  await page.close();
}
await browser.close(); await new Promise((r) => server.httpServer.close(r));
console.log('shots ->', out);
