// Build-verify-screenshot for one iteration.
// Usage: node scripts/shoot.mjs iterations/screens/iter-NN
// Serves dist/ with `vite preview`, drives the installed Google Chrome via playwright-core,
// writes hero + full-page shots at 375/768/1440, and exits non-zero on any failure.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
if (!out) { console.error('usage: node scripts/shoot.mjs <outDir>'); process.exit(2); }
mkdirSync(out, { recursive: true });

const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'silent' });
const url = 'http://localhost:4173/';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const widths = [[375, 812], [768, 1024], [1440, 900]];
const report = { url, widths: {}, failures: [] };
const fail = (msg) => report.failures.push(msg);

for (const [w, h] of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5200); // let the city finish growing
  await page.screenshot({ path: join(out, `hero-${w}.png`) });
  await page.addStyleTag({ content: '.dock { display: none !important; } .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }' }); // fixed elements misplace in full-page captures; scroll reveals never fire in one
  await page.screenshot({ path: join(out, `full-${w}.png`), fullPage: true });
  const metrics = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    webgl: !document.querySelector('.hero').classList.contains('no-webgl'),
    height: document.documentElement.scrollHeight,
  }));
  report.widths[w] = { ...metrics, errors };
  if (metrics.overflowX > 0) fail(`${w}px: horizontal overflow ${metrics.overflowX}px`);
  if (errors.length) fail(`${w}px: console errors: ${errors.join(' | ')}`);
  if (!metrics.webgl) fail(`${w}px: WebGL hero failed`);
  if (w >= 900 && !(await page.evaluate(() => document.querySelector('.hero').classList.contains('is-live')))) fail(`${w}px: live city did not start`);
  if (w < 900 && !(await page.evaluate(() => { const i = document.querySelector('.hero-poster'); return i.complete && i.naturalWidth > 0 && getComputedStyle(i).display !== 'none'; }))) fail(`${w}px: poster not shown`);
  await page.close();
}

// Interaction checks at desktop width.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
const check = async (name, fn) => { try { const ok = await fn(); if (!ok) fail(`check failed: ${name}`); } catch (e) { fail(`check error: ${name}: ${e.message}`); } };
await check('clocks filled', async () => /\d:\d\d/.test(await page.textContent('[data-bind="ist"]')));
await check('market status filled', async () => /US market (open|opens)/.test(await page.textContent('.live [data-bind="status"]')));
await check('short number rejected', async () => { await page.fill('#mobile', '12345'); await page.click('#lead button'); return page.isVisible('#lead-error'); });
await check('valid number accepted', async () => { await page.fill('#mobile', '98765 43210'); await page.click('#lead button'); return page.isVisible('#sent'); });
await check('edit number restores form', async () => { await page.click('#edit-number'); return page.isVisible('#lead'); });
await check('session chart shows the live session on an IST axis', async () => page.evaluate(() => { const t = document.querySelector('.when [data-bind="sessionText"]').textContent; const axis = document.querySelectorAll('#sess-axis span'); return /^(7|8):00\u00a0pm – (1|2):30\u00a0am$/.test(t) && document.querySelector('#sess-line').getAttribute('d').split('L').length === 79 && axis.length >= 7 && /IST$/.test(axis[0].querySelector('b').textContent); }));
await check('ticker shows prices with up/down colours', async () => page.evaluate(() => { const li = document.querySelector('.ticker-track li'); return /^\$[\d,]+\.\d\d$/.test(li.querySelector('.tk-px').textContent) && /^(▲|▼) \d+\.\d\d%$/.test(li.querySelector('.tk-ch').textContent) && /up|down/.test(li.querySelector('.tk-ch').className); }));
await check('closing form validates and confirms', async () => { await page.fill('#mobile-2', '123'); await page.click('#lead-2 button'); const err = await page.isVisible('#lead-2-error'); await page.fill('#mobile-2', '9876543210'); await page.click('#lead-2 button'); return err && (await page.isVisible('#sent-2')); });
await check('amount chip updates ticket', async () => { await page.click('#amounts [data-v="100"]', { force: true }); await page.waitForFunction(() => document.querySelector('.app-big [data-bind="amt"]').textContent === '100', null, { timeout: 3000 }); return true; });
await check('sector tab switches list', async () => { await page.click('#tabs [data-s="ETFs"]'); return (await page.textContent('#rows')).includes('S&P 500'); });
await check('tabs: arrow keys move selection and focus', async () => { await page.focus('#tabs [aria-selected="true"]'); await page.keyboard.press('ArrowRight'); return page.evaluate(() => document.activeElement?.getAttribute('aria-selected') === 'true' && document.activeElement.id !== 'tab-etfs' && document.querySelector('#rows-panel').getAttribute('aria-labelledby') === document.activeElement.id && document.querySelectorAll('#tabs [tabindex="0"]').length === 1); });
await check('session chart and layers reveal when scrolled into view', async () => { for (const sel of ['.session', '.layers']) { await page.evaluate((q) => document.querySelector(q).scrollIntoView({ block: 'center' }), sel); await page.waitForTimeout(1800); } return page.evaluate(() => document.querySelector('.session').classList.contains('is-in') && document.querySelector('.layers').classList.contains('is-in') && Number(getComputedStyle(document.querySelector('.layer-core')).opacity) > 0.99 && getComputedStyle(document.querySelector('.sess-reveal')).clipPath.startsWith('inset(0')); });
await check('routes reveal when scrolled into view', async () => { await page.evaluate(() => document.querySelector('.lane').scrollIntoView({ block: 'center' })); await page.waitForTimeout(2200); return page.evaluate(() => document.querySelector('.lane').classList.contains('is-in') && Number(getComputedStyle(document.querySelector('.lane .node:last-child')).opacity) > 0.99); });
await check('desktop header docks and returns on scroll-up', async () => { await page.evaluate(() => window.scrollTo(0, 3000)); await page.waitForTimeout(200); await page.evaluate(() => window.scrollTo(0, 2600)); await page.waitForTimeout(450); const r = await page.evaluate(() => { const h = document.querySelector('.site-header'); return h.classList.contains('is-docked') && h.classList.contains('is-shown') && h.getBoundingClientRect().top >= 0; }); await page.evaluate(() => window.scrollTo(0, 0)); return r; });
// FAQ check waits for state: software GL on this machine makes fixed delays flaky.
await check('faq expands, collapses, hides from AT', async () => { const q = page.locator('.faq-q').nth(2); await q.click(); const shown = await page.waitForFunction(() => { const p = document.querySelector('#faq-2 .faq-a'); return getComputedStyle(p).visibility === 'visible' && p.getBoundingClientRect().height > 20; }, null, { timeout: 4000 }).then(() => true, () => false); await q.click(); const hidden = await page.waitForFunction(() => getComputedStyle(document.querySelector('#faq-2 .faq-a')).visibility === 'hidden', null, { timeout: 4000 }).then(() => true, () => false); return shown && hidden && (await q.getAttribute('aria-expanded')) === 'false'; });
await check('keyboard reaches form', async () => { await page.goto(url); for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.activeElement?.id === 'mobile')) return true; } return false; });
await page.close();

// Mobile dock appears after the hero, taps back to the form.
const mob = await browser.newPage({ viewport: { width: 375, height: 812 } });
await mob.goto(url, { waitUntil: 'networkidle' });
await check('dock hidden at top', async () => !(await mob.evaluate(() => document.querySelector('#dock').classList.contains('is-on'))));
await mob.evaluate(() => window.scrollTo(0, 3000)); await mob.waitForTimeout(400);
await check('dock shown mid-page', async () => mob.evaluate(() => document.querySelector('#dock').classList.contains('is-on')));
await mob.screenshot({ path: join(out, 'mid-375.png') });
await mob.click('#dock a'); await mob.waitForTimeout(900);
await check('dock returns to form', async () => mob.evaluate(() => document.activeElement?.id === 'mobile' && window.scrollY < 200));
await mob.close();

await browser.close();
await new Promise((r) => server.httpServer.close(r));
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ failures: report.failures, widths: Object.fromEntries(Object.entries(report.widths).map(([k, v]) => [k, { overflowX: v.overflowX, webgl: v.webgl, errors: v.errors.length }])) }, null, 2));
process.exit(report.failures.length ? 1 : 0);
