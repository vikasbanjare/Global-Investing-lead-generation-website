// Screenshot specific elements: node scripts/_el.mjs <out> <path>|<selector>|<name> ...
import { preview } from 'vite';
import { chromium } from 'playwright-core';
const [out, ...jobs] = process.argv.slice(2);
const server = await preview({ preview: { port: 4192, strictPort: true }, logLevel: 'silent' });
const b = await chromium.launch({ channel: 'chrome' });
for (const job of jobs) {
  const [path, sel, name, w = '1440'] = job.split('|');
  const p = await b.newPage({ viewport: { width: Number(w), height: 900 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:4192/${path}`, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important} *,*::before,*::after{animation-play-state:paused!important;animation-delay:-1s!important}' });
  const el = p.locator(sel).first();
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(900);
  await el.screenshot({ animations: 'disabled', timeout: 15000, path: `${out}/${name}.png` });
  await p.close();
}
await b.close(); await new Promise((r) => server.httpServer.close(r));
