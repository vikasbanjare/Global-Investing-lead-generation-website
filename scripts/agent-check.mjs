// One-page build + check, safe to run in parallel (own outDir, own port, nothing shared).
// Usage: node scripts/agent-check.mjs <page: live|v2…v9> <port> <workDir> [--shots]
//   builds only that page into <workDir>/dist, serves it on <port>, then:
//   --shots  section screenshots at 375 and 1440 (+ hero at 768, 1280) → <workDir>/shots/
//   always   layout audit (overflow, clipped text, tap targets, tiny text, overlaps) and axe (WCAG 2.2 AA) at 375 + 1440
import { build, preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { auditPage } from './layout-audit-core.mjs';

const [page, port, work] = process.argv.slice(2);
const shots = process.argv.includes('--shots');
if (!page || !port || !work) throw new Error('usage: node scripts/agent-check.mjs <live|vN> <port> <workDir> [--shots]');
const key = page === 'live' ? 'main' : page, path = page === 'live' ? '' : `${page}/`, outDir = join(work, 'dist');
process.env.PAGES = key;
await build({ logLevel: 'error', build: { outDir, emptyOutDir: true } });
const server = await preview({ logLevel: 'silent', build: { outDir }, preview: { port: Number(port), strictPort: true } });
const browser = await chromium.launch({ channel: 'chrome' });
const axe = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const url = `http://localhost:${port}/${path}`;
const result = { page, url, shots: [], layout: {}, axe: {} };
if (shots) mkdirSync(join(work, 'shots'), { recursive: true });
for (const w of [375, 768, 1280, 1440]) {
  const p = await browser.newPage({ viewport: { width: w, height: w < 800 ? 812 : 900 } });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  if (shots && (w === 375 || w === 1440)) {
    const tops = await p.evaluate(() => [...document.querySelectorAll('main > section, main > div > section, footer')].map((el) => ({ name: el.id || el.className.split(' ')[0] || el.tagName.toLowerCase(), top: Math.round(el.getBoundingClientRect().top + scrollY) })));
    for (const [i, s] of tops.entries()) {
      await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), s.top);
      await p.waitForTimeout(900);
      const f = join(work, 'shots', `${String(i).padStart(2, '0')}-${s.name}-${w}.png`);
      await p.screenshot({ path: f }); result.shots.push(f);
    }
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  } else if (shots) {
    const f = join(work, 'shots', `hero-${w}.png`); await p.screenshot({ path: f }); result.shots.push(f);
  }
  result.layout[w] = await auditPage(p, w);
  if (w === 375 || w === 1440) {
    await p.addScriptTag({ content: axe });
    result.axe[w] = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map((v) => `${v.id}: ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`));
  }
  result.layout[w].errors = [...new Set(errors)].slice(0, 10);
  await p.close();
}
await browser.close(); await new Promise((r) => server.httpServer.close(r));
writeFileSync(join(work, 'check.json'), JSON.stringify(result, null, 1));
const n = (o) => Object.values(o).reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);
console.log(`${page}: layout issues ${Object.entries(result.layout).map(([w, o]) => `${w}:${n(o)}`).join(' ')} · axe ${Object.entries(result.axe).map(([w, a]) => `${w}:${a.length}`).join(' ')} · console errors ${Object.values(result.layout).reduce((s, o) => s + o.errors.length, 0)}`);
for (const [w, o] of Object.entries(result.layout)) for (const [k, v] of Object.entries(o)) for (const x of v) console.log(`  [${w}] ${k}: ${x}`);
for (const [w, a] of Object.entries(result.axe)) for (const x of a) console.log(`  [${w}] axe: ${x}`);
if (shots) console.log(`screenshots: ${join(work, 'shots')} (${result.shots.length} files)`);
