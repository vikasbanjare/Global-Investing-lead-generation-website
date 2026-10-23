// v6 · Peach glow (after the "Spendvest" case study, kept light): warm white page, soft orange glows, three app
// screens floating beside the hero form, visual-first sections, and a fitted glowing wordmark to close.
// Shared sections are reused as-is; the few v6-only tweaks below are string swaps on their markup (wording unchanged).
import './base.css';
import './sections.css';
import './v6.css';
import { boot, header, footer, leadForm, mapsMark, C, $$, icon, logo, chartSVG } from './kit.js';
import * as S from './sections.js';

// App-screen headers in the step phones: app-like labels instead of repeating the step titles printed below them.
const APP_TOP = { 1: ['Welcome', 'Sign up'], 2: ['KYC', 'Verification'], 3: ['Wallet', 'Add funds'], 4: ['Home', 'Portfolio'] };
const relabel = (html) => html.replace(/<small>Step (\d)<\/small><b>[^<]*<\/b>/g, (m, n) => `<small>${APP_TOP[n][0]}</small><b>${APP_TOP[n][1]}</b>`);

// Why: a small visual per statement (illustrative, no figures).
let off = 0;
const donut = `<svg class="w-donut" viewBox="0 0 80 80">${[34, 26, 22, 18].map((v, i) => {
  const c = `<circle class="d${i}" cx="40" cy="40" r="30" pathLength="100" stroke-dasharray="${v - 3} ${103 - v}" stroke-dashoffset="${-off}" transform="rotate(-90 40 40)"/>`;
  off += v; return c;
}).join('')}</svg>`;
const WHY_VIS = [
  donut,
  `<div class="w-icons">${['apple', 'nvidia', 'microsoft', 'amazon', 'google'].map((l) => `<span>${logo(l)}</span>`).join('')}</div>`,
  chartSVG('dollarise', 3.4, 176, 72, { cls: 'w-chart', tone: 'brand', baseline: false }),
];

const RING = '<svg class="ring" viewBox="0 0 120 120"><defs><linearGradient id="v6-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5f10"/><stop offset="1" stop-color="#e04400"/></linearGradient></defs>'
  + '<circle class="ring-bg" cx="60" cy="60" r="50"/><circle class="ring-on" cx="60" cy="60" r="50" pathLength="100" transform="rotate(-90 60 60)"/></svg>';

const product = S.product().replace('<i id="frac-pie"></i>', `<i id="frac-pie">${RING}</i>`);

const why = S.why().replace(/<span class="w-num num" aria-hidden="true">0(\d)<\/span>/g,
  (m, n) => `<div class="w-top">${m}<div class="w-vis" aria-hidden="true">${WHY_VIS[n - 1]}</div></div>`);

const how = relabel(S.how())
  .replace(C.steps.title, C.steps.title.replace('US markets', 'US&nbsp;markets'))
  .replace(`<p class="who-k">${C.who.title}</p>`, '')
  .replaceAll('<p class="who-k" aria-hidden="true">&nbsp;</p>', '')
  .replace('<div class="who-row">', `<h3 class="h3 who-title rv">${C.who.title}</h3><div class="who-row">`);

// Closing: orders filled + USD buying power fills the screen (not the step-03 Add funds screen).
const closing = S.closing(S.phone('activity'));

// Hero, composed here so phones get the CTA first: value prop → form → highlights, then the points.
// Laptops place the points under the form and the phones beside both (grid areas in v6.css); DOM order = phone order.
const hero = `<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-top"><p class="eyebrow">${C.hero.eyebrow}</p><h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1><p class="lead">${C.hero.lead}</p></div>
    <div class="hero-form"><p class="form-title" id="form-title">${C.hero.formTitle}</p>${leadForm('lead', C.hero.cta, 'form-title')}</div>
    ${S.highlights()}
    <div class="hero-pts"><ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul><a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a></div>
    <div class="stage" aria-hidden="true">
      <div class="ph ph-l loop">${S.phone('buy')}</div>
      <div class="ph ph-c loop">${S.phone('dashboard')}</div>
      <div class="ph ph-r loop">${S.phone('activity')}</div>
    </div>
  </div>
</section>`;

// Closing wordmark: the MAPS lettering, lit from the top and fading into the page.
const WM = mapsMark('url(#v6-wm)', 'wm', '<defs><linearGradient id="v6-wm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5400"/><stop offset="0.45" stop-color="#ff8a4c"/><stop offset="0.78" stop-color="#ffd2b8"/><stop offset="1" stop-color="#fffaf6" stop-opacity="0"/></linearGradient></defs>');

const html = `${header()}
<main id="main" tabindex="-1">
${hero}
${why}
${S.brands().replace(C.brands.title, C.brands.title.replace('? ', '?<br>'))}
${product}
${how}
${S.popular().replace(C.sectors.title, C.sectors.title.replace('US stocks', 'US&nbsp;stocks'))}
${S.pricing()}
${S.tax()}
${S.faq()}
${closing}
<section class="wordmark" aria-hidden="true">${WM}</section>
</main>
${footer()}`;

boot('v6', html);
S.setupSections();

// One primary CTA per view: while any in-page primary button (or a sent state) is on screen, the header CTA steps back
// to a ghost and the phone dock stays down.
const onScreen = new Set();
const io = new IntersectionObserver((es) => {
  es.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
  document.documentElement.classList.toggle('cta-on', onScreen.size > 0);
});
$$('main .btn-primary, #lead-sent, #lead-2-sent').forEach((el) => io.observe(el));

// FAQ answers start open on every screen (no key info behind toggles); the buttons still collapse them.
$$('.faq-q').forEach((q) => { q.setAttribute('aria-expanded', 'true'); document.getElementById(q.getAttribute('aria-controls')).classList.add('is-open'); });
