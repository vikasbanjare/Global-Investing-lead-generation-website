// Full axe-core audit (all WCAG 2.x A/AA rules + best practices) at 375 and 1440, plus an
// accessibility-tree dump of the hero and first landmarks for a screen-reader-style review.
// Usage: npx vite build && node scripts/a11y.mjs
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const server = await preview({ preview: { port: 4197, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ channel: 'chrome' });
let total = 0;
for (const [w, h] of [[375, 812], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:4197/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // let entrance animations finish (mid-fade text reads as low contrast)
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }));
  });
  total += res.length;
  console.log(`\n${w}px: ${res.length} violation types`);
  res.forEach((v) => console.log(` - [${v.impact}] ${v.id}: ${v.help}\n     ${v.nodes.join('\n     ')}`));
  if (w === 1440) {
    const snap = await page.accessibility.snapshot({ interestingOnly: true });
    const lines = [];
    const walk = (n, d) => { if (lines.length > 60) return; if (n.role !== 'none' && n.role !== 'generic') lines.push(`${'  '.repeat(d)}${n.role}${n.name ? ` "${n.name.slice(0, 70)}"` : ''}${n.level ? ` (h${n.level})` : ''}`); (n.children || []).forEach((c) => walk(c, d + 1)); };
    walk(snap, 0);
    console.log('\nAccessibility tree (first 60 nodes):\n' + lines.join('\n'));
  }
  await page.close();
}
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exit(total ? 1 : 0);
