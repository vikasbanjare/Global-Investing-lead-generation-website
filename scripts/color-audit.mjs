// Every visible text node: its colour vs the background actually behind it (walking up through transparent layers,
// gradients reduced to their dominant stop). Reports pairs per section, worst first.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
const server = await preview({ preview: { port: 4370 }, logLevel: 'silent' });
const b = await chromium.launch({ channel: 'chrome' });
const out = {};
for (const w of [1440, 375]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:4370/', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.reveal,.floater{opacity:1!important;scale:1!important;transform:none!important;transition:none!important}' });
  await p.evaluate(() => document.querySelectorAll('.lane,.session,.layers,.phone-stage').forEach((e) => e.classList.add('is-in')));
  out[w] = await p.evaluate(() => {
    const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const blend = (fg, bg) => { const a = fg[3] ?? 1; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)); };
    const bgOf = (el) => {
      const stack = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        const img = cs.backgroundImage;
        if (img && img !== 'none' && /gradient/.test(img)) { const cols = img.match(/rgba?\([^)]+\)/g); if (cols) { stack.push(parse(cols[Math.floor(cols.length / 2)])); if ((parse(cols[0])[3] ?? 1) >= 0.99) break; } }
        const c = parse(cs.backgroundColor); if (c && (c[3] ?? 1) > 0) { stack.push(c); if ((c[3] ?? 1) >= 0.99) break; }
      }
      let bg = [243, 248, 255];
      for (let i = stack.length - 1; i >= 0; i--) bg = blend(stack[i], bg);
      return bg.map(Math.round);
    };
    const rows = {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      const el = n.parentElement; if (!n.textContent.trim() || !el) continue;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (!r.width || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]:not(.floaters)') || el.closest('.sr-only, canvas, svg')) continue;
      const fgRaw = parse(cs.color); const bg = bgOf(el); const fg = blend(fgRaw, bg).map(Math.round);
      const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const large = size >= 24 || (bold && size >= 18.66);
      const need = large ? 3 : 4.5;
      const sec = (el.closest('section, header, footer')?.className || el.closest('section, header, footer')?.tagName || '?').split(' ').slice(0, 2).join('.');
      const key = `${sec} | rgb(${fg}) on rgb(${bg})`;
      const row = rows[key] ||= { sec, fg: `rgb(${fg})`, bg: `rgb(${bg})`, ratio: +ratio.toFixed(2), need, n: 0, sample: n.textContent.trim().slice(0, 28) };
      row.n++; row.need = Math.max(row.need, need);
    }
    return Object.values(rows).sort((a, b) => a.ratio / a.need - b.ratio / b.need);
  });
  await p.close();
}
for (const w of [1440, 375]) { console.log('--', w); for (const r of out[w].slice(0, 14)) console.log((r.ratio < r.need ? 'FAIL ' : 'ok   ') + r.ratio + ' (need ' + r.need + ')  ' + r.sec + '  ' + r.fg + ' on ' + r.bg + '  "' + r.sample + '" ×' + r.n); }
console.log('pairs', out[1440].length);
const byBg = {};
for (const r of out[1440]) (byBg[r.bg] ||= new Map()).set(r.fg, (byBg[r.bg].get(r.fg) || 0) + r.n);
console.log('-- text colours used on each background (1440):');
for (const [bg, m] of Object.entries(byBg).sort((a, b) => [...b[1].values()].reduce((x, y) => x + y) - [...a[1].values()].reduce((x, y) => x + y))) console.log(bg.padEnd(18), [...m.entries()].map(([f, n]) => f + '×' + n).join('  '));
await b.close(); server.httpServer.close();
