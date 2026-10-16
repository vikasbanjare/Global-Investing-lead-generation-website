import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[1440, 900], [375, 812]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1.5 });
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelector('.buy-grid').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(2200);
  if (w === 1440) await p.click('#amounts [data-v="100"]', { force: true }), await p.waitForTimeout(1300);
  await p.locator('.buy-grid').screenshot({ path: `${process.argv[2]}/buy2-${w}.png` });
  if (w === 1440) {
    await p.evaluate(() => document.querySelector('.tile-marks').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(1500);
    await p.hover('.tile-marks li:nth-child(2)'); await p.waitForTimeout(700);
    await p.locator('.tile-lead').screenshot({ path: `${process.argv[2]}/leaders-hover.png` });
  }
}
await b.close();
