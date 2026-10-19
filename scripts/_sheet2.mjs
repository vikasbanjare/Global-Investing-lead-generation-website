import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [out, w, colw, ...files] = process.argv.slice(2);
const imgs = files.map((f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: +w, height: 400 } });
await p.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(${imgs.length > 2 ? 2 : imgs.length},${colw}px);gap:6px;background:#fff">${imgs.map((s) => `<img src="${s}" style="width:${colw}px;display:block">`).join('')}</body>`);
await p.waitForTimeout(300); await p.screenshot({ path: out, fullPage: true }); await b.close();
