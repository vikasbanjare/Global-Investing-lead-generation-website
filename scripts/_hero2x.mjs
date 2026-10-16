import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/?live', { waitUntil: 'networkidle' });
await p.waitForTimeout(9000);
await p.screenshot({ path: process.argv[2], clip: { x: 300, y: 520, width: 900, height: 380 } });
await b.close();
