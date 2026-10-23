// Renders the social share image (public/og-image.jpg, 1200×630): MAPS logo, the reviewed hero headline and lead,
// the trust highlights, and the city render (public/city-poster.webp — rendered without the held-back aerial photo).
// Usage: node scripts/render-og.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';

const b64 = (f) => readFileSync(f).toString('base64');
const logo = readFileSync('public/maps-logo.svg', 'utf8');
const html = `<!doctype html><html><head><style>
@font-face { font-family: 'Open Sans'; font-weight: 400 800; src: url(data:font/woff2;base64,${b64('public/fonts/open-sans.woff2')}) format('woff2'); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 900px; overflow: hidden; background: #fff; }
.frame { position: relative; width: 1200px; height: 630px; overflow: hidden; font-family: 'Open Sans', sans-serif; color: #04213f;
  background: radial-gradient(60% 80% at 85% 85%, rgba(255, 84, 0, 0.16), transparent 70%), linear-gradient(180deg, #f3f8ff, #fff); }
.city { position: absolute; right: -150px; bottom: -40px; width: 880px; }
.fade { position: absolute; inset: 0; background: linear-gradient(90deg, #f6f9fe 0%, #f6f9fe 38%, rgba(246, 249, 254, 0) 62%), linear-gradient(0deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 22%), linear-gradient(180deg, #f3f8ff 0%, rgba(243, 248, 255, 0) 45%); }
.copy { position: absolute; left: 72px; top: 64px; width: 600px; }
.logo svg { width: 190px; height: auto; display: block; }
h1 { margin-top: 56px; font-size: 64px; line-height: 1.02; font-weight: 800; letter-spacing: -0.04em; color: #072d5e; }
h1 span { display: block; color: #ff5400; }
p { margin-top: 22px; font-size: 24px; line-height: 1.45; color: #4b6189; max-width: 520px; }
ul { position: absolute; left: 72px; bottom: 56px; display: flex; gap: 12px; padding: 0; list-style: none; }
li { padding: 12px 18px; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px rgba(7,45,94,.1), 0 14px 30px -18px rgba(4,33,63,.4); font-size: 17px; font-weight: 700; color: #072d5e; }
li b { color: #ff5400; margin-right: 6px; }
</style></head><body><div class="frame">
<img class="city" src="data:image/webp;base64,${b64('public/city-poster.webp')}"><div class="fade"></div>
<div class="copy"><div class="logo">${logo}</div>
<h1>US stocks: <span>New possibilities for your portfolio.</span></h1>
<p>Invest in US-listed companies and ETFs from India. With fractional shares, you invest for as low as $1.</p></div>
<ul><li><b>5,000+</b>US stocks &amp; ETFs</li><li><b>$1</b>Fractional investing</li><li><b>₹0</b>Account opening</li><li><b>GIFT City</b>IFSCA-regulated route</li></ul>
</div></body></html>`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } }); // taller than the image: a 630px-tall headless viewport stitches its last strip
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
writeFileSync('public/og-image.jpg', await page.screenshot({ type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } }));
await browser.close();
console.log('public/og-image.jpg written');
