import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [out, cols, colw, ...files] = process.argv.slice(2);
const imgs = files.map((f) => [f.split('/').pop(), `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`]);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: (+colw + 6) * +cols, height: 300 } });
await p.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},${colw}px);gap:6px;align-items:start;background:#fff">${imgs.map(([n, s]) => `<div style="position:relative"><img src="${s}" style="width:${colw}px;display:block"><b style="position:absolute;left:3px;top:3px;background:#ff0;font:12px sans-serif">${n}</b></div>`).join('')}</body>`);
await p.waitForTimeout(300); await p.screenshot({ path: out, fullPage: true }); await b.close();
