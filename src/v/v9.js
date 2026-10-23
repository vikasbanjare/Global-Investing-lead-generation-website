// v9 · Sky (after the "SentoBot" case study): one continuous light sky with drifting clouds, a frosted two-pane hero
// card, the city render as the landscape at both ends of the page, and glass panels floating on the sky.
import './base.css';
import './sections.css';
import './v9.css';
import { boot, header, footer, BASE, C, logo, icon, quote, pct, usd, chartSVG, sparkFor, $$ } from './kit.js';
import * as S from './sections.js';

// Clouds. CSS has no modulo, so each cloud's place is worked out here and handed over as custom properties:
// --p phase along the drift (0–1, also its resting spot under reduced motion), --y top, --w width, --d drift time.
// Every third cloud is a far one (smaller, fainter, slower). y0/spread keep the clouds in the bluest part of a band.
const clouds = (n, seed = 0, y0 = 4, spread = 60) => `<div class="clouds" aria-hidden="true">${Array.from({ length: n }, (_, k) => {
  const i = k + seed, far = i % 3 === 1;
  const w = far ? 150 + ((i * 41) % 90) : 240 + ((i * 53) % 180), d = far ? 170 + ((i * 13) % 60) : 100 + ((i * 17) % 50);
  return `<i class="cl${far ? ' cl-far' : ''} loop" style="--p:${((i * 0.618) % 1).toFixed(3)};--y:${y0 + ((i * 37) % spread)}%;--w:${w}px;--d:${d}s"></i>`;
}).join('')}</div>`;
// Sky bands (brands, how, closing) carry clouds as the section's first child, so the section stays `main > section`
// (analytics, off-screen pausing). The other sections sit on the calm page colour, without clouds.
const sky = (html, ...c) => html.replace('<div class="vw', `${clouds(...c)}<div class="vw`);

// The city render, aspect-correct (object-fit), fading into the sky at both edges.
const land = (cls, extra = '') => `<div class="land${cls}" aria-hidden="true"><img src="${BASE}city-poster.webp" alt="" width="1600" height="842"${cls ? ' loading="lazy"' : ''} decoding="async">${extra}</div>`;
// Small glass quote chips drifting over the skyline (illustrative UI, same reference prices as the rest of the page).
const chip = (t, name, slug, cls) => {
  const q = quote(t);
  return `<div class="chip ${cls} loop"><span class="chip-logo">${logo(slug)}</span><span class="chip-t"><b>${t}</b><small>${name}</small></span>${sparkFor(t, 72, 28, { baseline: false })}<span class="chip-q"><b class="num">${usd.format(q.px)}</b><em class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</em></span></div>`;
};

// Hero: copy on the left, the form in its own white tile on the right (same markup, split; wording unchanged), a
// reassurance line under the form, and the four highlights as a stats row inside the card, so value, form and trust
// all sit in the first viewport. The checklist is its own grid item, so on phones it can follow the form.
const [heroIntro, heroRest] = S.heroCopy().split('<ul class="points">');
const [heroPoints, heroForm] = heroRest.split('<p class="form-title"');
const trust = `<p class="form-trust">${icon.shield}<span>${C.whyUs.items[3]}</span></p>`;
// Phones: the first checklist line repeats under the form's reassurance line (and its original is hidden there), so
// two trust lines sit above the fold at 375 × 812. Elsewhere it stays in the checklist only.
const pt1 = `<p class="form-pt">${icon.check}<span>${C.hero.points[0]}</span></p>`;
const heroHL = `<ul class="hero-hl" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b class="num">${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>`;

// Brands: each sentence of the title on its own balanced line.
const brands = S.brands().replace(C.brands.title, C.brands.title.replace(/^(.*?\?) /, '<span class="l">$1</span> '));

// Why: a small illustrative chart on each panel, drawn with the shared kit helpers (no figures, no claims).
const stretch = (svg) => svg.replace('<svg ', '<svg preserveAspectRatio="none" ');
const WHY_ART = [
  `<div class="w-art w-lines" aria-hidden="true">${stretch(chartSVG('w-div-a', 1.8, 280, 72, { tone: 'muted', baseline: false, dot: false }))}${stretch(chartSVG('w-div-b', -0.6, 280, 72, { tone: 'navy', baseline: false, dot: false }))}${stretch(chartSVG('w-div-c', 2.4, 280, 72, { tone: 'brand', baseline: false, dot: false }))}</div>`,
  `<div class="w-art w-leaders" aria-hidden="true">${[['apple', 'AAPL'], ['microsoft', 'MSFT'], ['nvidia', 'NVDA'], ['google', 'GOOGL']].map(([l, t]) => `<span><i>${logo(l)}</i>${sparkFor(t, 56, 18, { baseline: false, dot: false })}</span>`).join('')}</div>`,
  `<div class="w-art w-fx" aria-hidden="true">${stretch(chartSVG('w-usd-inr', 0.9, 280, 72, { tone: 'brand', dot: false }))}</div>`,
];
let w = 0;
const why = S.why().replace(/<span class="w-num/g, (m) => WHY_ART[w++] + m);

// How: the "Who can start investing?" kicker becomes the title of the whole who-row instead of card 1's label.
// Step 4's phone gets the app's tab bar, so its screen is not half empty (illustrative UI labels).
const tabbar = `<div class="app-tabs">${['Home', 'Search', 'Orders', 'Account'].map((t, i) => `<span${i === 0 ? ' class="on"' : ''}><i></i>${t}</span>`).join('')}</div>`;
const how = S.how().replace(/<p class="who-k"[^>]*>.*?<\/p>/g, '').replace('<div class="who-row">', `<div class="who-row"><p class="who-k">${C.who.title}</p>`)
  .replace('</ul></div></div><p class="sc-n num">04', `</ul>${tabbar}</div></div><p class="sc-n num">04`);

// Closing: the same reassurance as the hero form, plus the ₹0 fact from the pricing tag next to the button.
const closing = S.closing()
  .replace('</li></ul>\n      <a class="tlink"', `</li><li>${icon.check}${C.charges.items[1].tag}</li></ul>\n      ${trust}<a class="tlink"`)
  .replace('</section>', `${land(' land-end')}</section>`);

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  ${clouds(6, 0, 4, 56)}
  <div class="vw hero-in"><div class="hero-card">
    <div class="hero-copy">${heroIntro}</div>
    <ul class="points">${heroPoints.trim()}
    <div class="hero-form"><p class="form-title"${heroForm.replace('<a class="tlink hero-how"', `${trust}${pt1}<a class="tlink hero-how"`)}</div>
    ${heroHL}
  </div></div>
  ${land('', chip('GOOGL', 'Alphabet', 'google', 'chip-a') + chip('NVDA', 'NVIDIA', 'nvidia', 'chip-b'))}
</section>
${sky(brands, 4, 3, 24, 44)}
${S.product()}
${why}
${sky(how, 5, 13, 18, 64)}
${S.popular()}
${S.pricing()}
${S.tax()}
${S.faq()}
${sky(closing, 4, 31, 12, 40)}
</main>
${footer()}`;

boot('v9', html);
S.setupSections();

// One primary action per view: the header's "Start investing" steps aside while a lead form is on screen.
const inView = new Set();
const io = new IntersectionObserver((es) => {
  es.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
  document.documentElement.classList.toggle('form-in-view', inView.size > 0);
});
$$('#lead, #lead-sent, #lead-2, #lead-2-sent').forEach((el) => io.observe(el));
