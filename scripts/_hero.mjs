import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1240 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/?live', { waitUntil: 'networkidle' });
await p.waitForTimeout(9000);
await p.screenshot({ path: process.argv[2] + '/hero-tall.png', fullPage: false, clip: { x: 0, y: 440, width: 1440, height: 800 }});
await b.close();
