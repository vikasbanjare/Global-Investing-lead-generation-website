// Hero load timeline on a throttled connection (desktop, real GPU): when the 3D code and data arrive, when the city is
// built and when its intro ends. Usage: npx vite build && node scripts/perf-hero.mjs [mbps]
import { chromium } from 'playwright-core';
import { preview } from 'vite';
const mbps = Number(process.argv[2] || 20);
const server = await preview({ preview: { port: 4182, strictPort: true }, logLevel: 'silent' });
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await p.context().newCDPSession(p);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (mbps * 1e6) / 8, uploadThroughput: 2e6 });
const t0 = Date.now(); const reqs = [];
p.on('requestfinished', async (r) => { const u = r.url(); if (/city-|manhattan|trees|ortho|three|index-/.test(u)) { const s = await r.sizes().catch(() => ({})); reqs.push(`${String(Date.now() - t0).padStart(5)} ms  ${u.split('/').pop().slice(0, 34)}  ${Math.round((s.responseBodySize || 0) / 1024)} KB`); } });
await p.goto('http://localhost:4182/', { waitUntil: 'load' });
const load = Date.now() - t0;
await p.waitForFunction(() => performance.getEntriesByName('city:intro-done').length, null, { timeout: 60000 });
const marks = await p.evaluate(() => Object.fromEntries(['city:built', 'city:intro-done'].map((n) => [n, Math.round(performance.getEntriesByName(n)[0].startTime)])));
const lt = await p.evaluate(() => performance.getEntriesByType('longtask').length);
console.log(`network ${mbps} Mbps · load event ${load} ms`); reqs.sort().forEach((r) => console.log('  ' + r));
console.log('  marks', JSON.stringify(marks));
await b.close(); server.httpServer.close();
