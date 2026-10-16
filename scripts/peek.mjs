// Quick look while tuning: node scripts/peek.mjs <out.png> [width=1440] [height=900] [waitMs=5200]
// Builds nothing; run `npx vite build` first.
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const [out, w = 1440, h = 900, wait = 5200] = process.argv.slice(2);
const server = await preview({ preview: { port: 4176, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.goto('http://localhost:4176/', { waitUntil: 'networkidle' });
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out });
await browser.close();
await new Promise((r) => server.httpServer.close(r));
