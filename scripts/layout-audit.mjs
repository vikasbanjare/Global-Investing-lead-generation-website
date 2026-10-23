// Strict layout audit of every page (live + /vN/) at phone, tablet, laptop and desktop widths.
// Flags: content overflowing the viewport, clipped text, tap targets under 40px on phones, text under 11px,
// and visible text boxes overlapping each other. Usage: npx vite build && node scripts/layout-audit.mjs [out.json]
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { auditPage } from './layout-audit-core.mjs';

const pages = ['', ...readdirSync('.').filter((d) => /^v\d+$/.test(d) && existsSync(`${d}/index.html`)).sort((a, b) => a.slice(1) - b.slice(1)).map((d) => `${d}/`)];
const widths = [375, 768, 1280, 1440];
const server = await preview({ preview: { port: 4193, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ channel: 'chrome' });
const report = {};
for (const p of pages) for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(`http://localhost:4193/${p}`, { waitUntil: 'networkidle' });
  report[`${p || 'live/'}@${w}`] = await auditPage(page, w);
  await page.close();
}
await browser.close(); await new Promise((r) => server.httpServer.close(r));
let total = 0;
for (const [k, v] of Object.entries(report)) {
  const n = Object.values(v).reduce((s, a) => s + a.length, 0); total += n;
  if (n) console.log(`\n${k}: ${Object.entries(v).filter(([, a]) => a.length).map(([t, a]) => `${t} ${a.length}`).join(', ')}`), Object.entries(v).forEach(([t, a]) => a.forEach((x) => console.log(`  ${t}: ${x}`)));
}
console.log(`\nTOTAL ${total} issues across ${pages.length} pages × ${widths.length} widths`);
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 1));
