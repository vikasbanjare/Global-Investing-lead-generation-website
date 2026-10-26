// Reviewed-copy coverage: which lines of brief/copy/v3-reviewed.txt a page does not render. Usage: npx vite build && node scripts/copy-check.mjs v10/ "" v6/
// Which reviewed-copy lines are missing from a page's rendered text (all FAQ answers opened first).
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const norm = (t) => t.toLowerCase().replace(/m\.stock/g, 'maps').replace(/[’'"“”]/g, "'").replace(/[^a-z0-9₹$%'&*]+/g, ' ').trim();
const skip = /^(hero \+ lead form|key investment highlights|primary cta|secondary cta|form heading|order type|what it does|best for|company|ticker|price|1d|action|footer|invest$|learn$|legal$)/i;
const lines = readFileSync('brief/copy/v3-reviewed.txt', 'utf8').split('\n').map((l) => l.replace(/^[\s•\t]+/, '').trim()).filter((l) => l.length > 3)
  .flatMap((l) => l.split(/\s{2,}\|\s{2,}|\s+•\s+|\s\|\s/)).map((l) => l.trim()).filter((l) => l.length > 2 && !skip.test(l));
const s = await preview({ preview: { port: 4811 }, logLevel: 'silent' });
const b = await chromium.launch({ channel: 'chrome' });
for (const u of process.argv.slice(2)) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await p.goto('http://localhost:4811/' + u, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelectorAll('.faq-q[aria-expanded="false"]').forEach((q) => q.click()));
  await p.waitForTimeout(300);
  const text = norm(await p.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join(' ')));
  const miss = lines.filter((l) => !text.includes(norm(l)));
  console.log(`\n== ${u || 'live'}: ${lines.length - miss.length}/${lines.length} present; missing ${miss.length}:`); miss.forEach((m) => console.log('  - ' + m.slice(0, 110)));
  await p.close();
}
await b.close(); s.httpServer.close();
