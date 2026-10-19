import { chromium } from 'playwright-core';
const out = process.argv[2];
const b = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[1440, 900], [375, 812]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(220); }
  await p.waitForTimeout(3000);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(500);
  const r = await p.evaluate((w) => {
    const vis = (e) => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
    const sections = [...document.querySelectorAll('main > section, footer')].map((s) => {
      const blocks = [...s.querySelectorAll(':scope .wrap > *, :scope > .wrap')].filter(vis).map((e) => Math.round(e.getBoundingClientRect().width));
      return `${s.id || s.className.split(' ')[1] || s.tagName}: h=${Math.round(s.offsetHeight)} contentW=[${[...new Set(blocks)].slice(0, 6).join(',')}]`;
    });
    const texts = {}; [...document.querySelectorAll('h1,h2,h3,p,b,strong,li')].filter(vis).forEach((e) => { const t = e.textContent.trim().replace(/\s+/g, ' '); if (t.length > 18 && e.children.length < 3) (texts[t] = texts[t] || []).push(e.closest('section,footer,header')?.id || e.closest('section,footer,header')?.className.split(' ')[0]); });
    const dups = Object.entries(texts).filter(([, v]) => v.length > 1).map(([t, v]) => `${v.length}× "${t.slice(0, 60)}" in ${[...new Set(v)].join('/')}`);
    const dead = ['.floaters', '.floater', '.money-flow', '.phone-tilt', '.vault', '.vring', '.steps', '.stack', '.slab', '.app-buy', '.phone-stage', '.frac', '.clocks', '.dayline'].filter((s) => document.querySelector(s)).map((s) => `${s} x${document.querySelectorAll(s).length}`);
    const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return vis(e) && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.ticker, .card-ring, .hero-canvas, .ring-stage'); }).slice(0, 8).map((e) => `${e.tagName}.${e.className.toString().split(' ')[0]} ${Math.round(e.getBoundingClientRect().left)}→${Math.round(e.getBoundingClientRect().right)}`);
    const ids = {}; document.querySelectorAll('[id]').forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; });
    return { H: document.documentElement.scrollHeight, sections, dups, dead, over, dupIds: Object.entries(ids).filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`) };
  }, w);
  console.log(`\n===== ${w} (page ${r.H}px)`); r.sections.forEach((s) => console.log('  ' + s));
  console.log('  duplicates:', r.dups.length ? '\n    ' + r.dups.join('\n    ') : 'none');
  console.log('  leftover markup:', r.dead.join(', ') || 'none');
  console.log('  overflow:', r.over.join(' | ') || 'none'); console.log('  duplicate ids:', r.dupIds.join(', ') || 'none');
  await p.screenshot({ path: `${out}/full-${w}.png`, fullPage: true });
}
await b.close();
