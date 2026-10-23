// v5 · 3D city, new story: the live Manhattan hero full-bleed, then one scroll story from Mumbai to Wall Street
// (the four steps, the money routes and both clocks), a brand skyline, and the rest set calmly around it.
import './base.css';
import './v5.css';
import { C, BASE, boot, header, footer, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, reducedMotion, REF_PRICES, sparkFor } from './kit.js';

const STEP_ICONS = [icon.user, icon.shield, icon.wallet, icon.chart];
// Brand skyline: a designed profile (heights are decoration, not data), each tower in its brand's own colours
// (identification only), with a crown style per tower: setback, flat roof or antenna.
const TOWER_H = [268, 300, 252, 340, 284, 260, 312, 276];
const ROOF = ['set', 'flat', 'set', 'mast', 'flat', 'set', 'flat', 'set'];
const BRAND = { apple: ['#8e8e93', '#5c5c62'], microsoft: ['#2b88d8', '#0f5ea8'], google: ['#4285f4', '#1a5fd0'], amazon: ['#5b6d82', '#3b4c60'],
  tesla: ['#e82127', '#a3161b'], nvidia: ['#76b900', '#4e7f00'], meta: ['#0866ff', '#0550c7'], netflix: ['#e50914', '#9b0610'] };
const WHY_LINKS = ['#popular', '#brands', '#pricing']; // sectors, the brand skyline, FX pricing
const ORDER_ICONS = [icon.chart, icon.swap, icon.shield];
const TAX_ICONS = [icon.chart, icon.wallet, icon.swap, icon.doc];
const ticket = 'GOOGL', tq = quote(ticket); // the phone's illustrative order ticket

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-copy">
    <p class="eyebrow">${C.hero.eyebrow}</p>
    <h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1>
    <p class="lead">${C.hero.lead}</p>
    <p class="form-title sr-only" id="form-title">${C.hero.formTitle}</p>
    ${leadForm('lead', C.hero.cta, 'form-title')}
    <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}<span>${p}</span></li>`).join('')}</ul>
  </div>
  <div class="hero-stage" aria-hidden="true">
    <img class="hero-poster" src="${BASE}city-poster.webp" alt="" width="1600" height="840" fetchpriority="high">
    <canvas class="hero-canvas"></canvas>
    <div class="ws-label"><span class="ws-dot loop"></span><strong>Wall Street</strong><span class="ws-time"><span data-bind="nyc">—</span> ET</span></div>
  </div>
  <div class="vw hero-foot">
    <ul class="hl" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>
  </div>
</section>

<section class="sec journey" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2></div>
    <div class="jr">
      <aside class="jr-map" aria-hidden="true">
        <p class="jr-city"><b>Mumbai</b><span><span data-bind="ist">—</span> IST</span></p>
        <ol class="jr-line">${C.steps.items.map(([t], i) => `<li><span>${i + 1}</span><em>${t}</em></li>`).join('')}</ol>
        <p class="jr-city"><b>New York</b><span><span data-bind="nyc">—</span> ET</span></p>
      </aside>
      <ol class="jr-steps">${C.steps.items.map(([t, d], i) => `<li class="jr-step${i === 1 ? ' has-side' : ''}" data-step="${i}">
        <div class="jr-head"><span class="jr-ico">${STEP_ICONS[i]}</span><div><p class="jr-n">Step ${i + 1}</p><h3>${t}</h3><p class="jr-d">${d}</p></div></div>
        ${i === 0 ? `<p class="jr-sub">${C.who.title}</p><dl class="jr-who">${C.who.items.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : ''}
        ${i === 1 ? verifyMock() : ''}
        ${i === 2 ? route(C.routes[0]) : ''}
        ${i === 3 ? `${route(C.routes[1])}<a class="btn btn-primary" href="#lead">${C.steps.cta}</a>` : ''}
      </li>`).join('')}</ol>
    </div>
  </div>
</section>

<section class="sec skyline" id="brands">
  <div class="vw">
    <div class="head rv"><h2>${C.brands.title}</h2><p class="sub">${C.brands.sub}</p></div>
    <ul class="towers rv">${C.brands.list.map(([n, t, l], i) => { const q = quote(t); return `<li class="t-${ROOF[i]}" style="--h:${TOWER_H[i]}px; --i:${i}; --c1:${BRAND[l][0]}; --c2:${BRAND[l][1]}"><a href="#lead" aria-label="Invest in ${n} (${t}), ${usd.format(q.px)}, ${q.ch >= 0 ? 'up' : 'down'} ${Math.abs(q.ch).toFixed(2)}%">
      <span class="t-tip" aria-hidden="true"><b class="num">${usd.format(q.px)}</b><span class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span>${sparkFor(t, 76, 20, { baseline: false })}</span>
      <span class="t-body"><span class="t-lit"></span><span class="t-logo">${logo(l)}</span></span><span class="t-name">${t}</span></a></li>`; }).join('')}</ul>
  </div>
  <div class="plaza" aria-hidden="true"></div>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="eyebrow">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <div class="showcase">
      <ol class="feats">${C.features.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><span class="n num">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
      ${phone()}
    </div>
    <p class="center prod-cta"><a class="btn btn-primary" href="#lead">${C.hero.cta}</a></p>
    <div class="split">
      <div class="rv">
        <h3 class="h3">${C.orders.title}</h3>
        <ul class="tickets">${C.orders.rows.map(([t, d, b]) => `<li><h4>${t}</h4><dl><div><dt>${C.orders.cols[1]}</dt><dd>${d}</dd></div><div><dt>${C.orders.cols[2]}</dt><dd>${b}</dd></div></dl></li>`).join('')}</ul>
      </div>
      <div class="rv" style="--i:1">
        <h3 class="h3">${C.supports.title}</h3>
        <dl class="sup">${C.supports.items.map(([t, d], i) => `<div><dt><span class="sup-ico">${ORDER_ICONS[i]}</span>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
      </div>
    </div>
  </div>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="rv" style="--i:${i}">${whyArt(i)}<h3>${t}</h3><p>${d}</p><a class="tlink" href="${WHY_LINKS[i]}">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec popular" id="popular">
  <div class="vw">
    <div class="head rv"><h2>${C.sectors.title}</h2><p class="mkt"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p></div>
    <div class="tabs" role="tablist" aria-label="Sectors">${Object.keys(C.sectors.list).map((s, i) => `<button type="button" role="tab" id="st-${i}" aria-controls="st-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${s}</button>`).join('')}</div>
    <div class="rows" id="st-panel" role="tabpanel" aria-labelledby="st-0"></div>
    <div class="pop-foot"><a class="tlink" href="#lead">${C.sectors.cta}${icon.go}</a><p class="fine">${C.sectors.note}</p></div>
  </div>
</section>

<section class="sec pricing" id="pricing">
  <div class="vw">
    <div class="head rv"><h2>${C.whyUs.title}</h2></div>
    <ol class="whyus">${C.whyUs.items.map((t, i) => `<li class="rv" style="--i:${i}"><span class="n num">0${i + 1}</span><p>${t}</p></li>`).join('')}</ol>
    <h3 class="h3 center rv">${C.charges.title}</h3>
    <div class="charges">${C.charges.items.map((c, i) => `<article class="charge${c.hot ? ' is-hot' : ''} rv" style="--i:${i}">${c.tag ? `<span class="charge-tag">${c.tag}</span>` : ''}
      <p class="charge-k">${c.label}</p><p class="charge-v num">${c.fig.split(' / ').map((f) => `<span>${f.replace('*', '<sup>*</sup>')}</span>`).join(' / ')}</p><p class="charge-n">${c.note}</p>
      <a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`).join('')}</div>
    <p class="fine center">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head rv"><h2>${C.tax.title}</h2><p class="sub">${C.tax.sub}</p></div>
    <div class="tax-grid">${C.tax.items.map(([t, d], i) => `<article class="rv" style="--i:${i}"><span class="tax-ico">${TAX_ICONS[i]}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></article>`).join('')}</div>
    <p class="center"><a class="btn btn-ghost" href="#tax-guide">${icon.doc}${C.tax.cta}</a></p>
  </div>
</section>

<section class="sec faq" id="faq"><div class="vw faq-in">
  <div class="faq-side rv"><h2>${C.faq.title}</h2><div class="faq-cta"><a class="btn btn-primary" href="#lead">${C.hero.cta}</a><a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a></div></div>
  ${faqList()}
</div></section>

<section class="closing" id="start">
  <div class="vw">
    <div class="close-card rv">
      <h2>${C.closing.title}</h2>
      <p class="lead">${C.closing.sub}</p>
      ${leadForm('lead-2', C.closing.cta)}
      <ul class="benefits">${C.closing.benefits.map((b) => `<li>${icon.check}${b}</li>`).join('')}</ul>
      <p class="trust">${icon.shield}<span>${C.highlights[3].note} · ${C.whyUs.items[3]}</span></p>
      <a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a>
      <p class="fine">${C.closing.fine}</p>
    </div>
  </div>
</section>
</main>
${footer()}`;

function route(r) {
  return `<div class="jr-route"><p class="jr-rt"><b>${r.title}</b><span>${r.tag}</span></p><ol>${r.steps.map((s, i) => `<li><i aria-hidden="true">${i + 1}</i><span>${s}</span></li>`).join('')}</ol><small>${r.note}</small></div>`;
}
// Step 2: a small, decorative verification card (labels from the step 1 checklist).
function verifyMock() {
  return `<div class="jr-verify" aria-hidden="true"><p><b>Verification</b><span class="chip">In review</span></p>
    <ul>${['PAN', 'Identity', 'Address'].map((t, i) => `<li><span>${t}</span><i class="${i < 2 ? 'ok' : 'wait loop'}">${i < 2 ? icon.check : ''}</i></li>`).join('')}</ul>
    <div class="bar"><span></span></div></div>`;
}
// Why: one small visual per reason (decorative).
function whyArt(i) {
  if (i === 0) return '<div class="why-art art-mix" aria-hidden="true"><span class="donut"></span><span class="chip">India</span><span class="chip">US</span></div>';
  if (i === 1) return `<div class="why-art art-logos" aria-hidden="true">${['apple', 'microsoft', 'nvidia'].map((l) => `<span>${logo(l)}</span>`).join('')}</div>`;
  return `<div class="why-art art-fx" aria-hidden="true"><span class="chip">USD / INR</span>${sparkFor('USDINR', 140, 40, { tone: 'brand', baseline: false })}</div>`;
}
// Product: a floating phone with a fractional order ticket (illustrative UI, decorative).
function phone() {
  const shares = (1 / REF_PRICES[ticket]).toFixed(4);
  return `<div class="phone loop" aria-hidden="true"><div class="ph-screen">
    <div class="ph-sb"><span data-bind="ist">—</span><i></i><span class="ph-sig"></span></div>
    <div class="ph-top"><span class="ph-logo">${logo('google')}</span><p><b>Alphabet</b><small>${ticket} · NASDAQ</small></p></div>
    <p class="ph-px"><b class="num">${usd.format(tq.px)}</b><span class="num ${tq.ch >= 0 ? 'up' : 'down'}">${pct(tq.ch)}</span></p>
    ${sparkFor(ticket, 252, 84)}
    <div class="ph-range">${['1D', '1W', '1M', '1Y'].map((r, i) => `<span${i === 0 ? ' class="on"' : ''}>${r}</span>`).join('')}</div>
    <div class="ph-seg">${['Market', 'Limit', 'Stop', 'Amount'].map((r, i) => `<span${i === 3 ? ' class="on"' : ''}>${r}</span>`).join('')}</div>
    <div class="ph-amt"><small>Amount (USD)</small><b class="num">$1.00</b><small>≈ <span class="num">${shares}</span> shares</small></div>
    <span class="ph-cta">Review order</span>
  </div></div>`;
}

boot('v5', html);
// FAQ answers are key info: always open, read as a plain Q&A list
$$('.faq-q').forEach((q) => { q.setAttribute('aria-expanded', 'true'); $('#' + q.getAttribute('aria-controls')).classList.add('is-open'); });

// ---------- live 3D city on desktop (same module and data as the live page); phones and no-WebGL get the poster
const hero = $('.hero'), mq = matchMedia('(max-width: 900px)');
const hasGL = () => { try { const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'); g?.getExtension('WEBGL_lose_context')?.loseContext(); return !!g; } catch { return false; } };
let started = false;
function startCity() {
  if (started) return;
  started = true;
  if (!hasGL()) { hero.classList.add('no-webgl'); return; } // skip the three.js download entirely
  // the poster stays as a placeholder until the city is built, then fades as the towers grow
  try { new PerformanceObserver((l, o) => { if (l.getEntriesByName('city:built').length) { hero.classList.add('is-live'); o.disconnect(); } }).observe({ type: 'mark', buffered: true }); } catch { /* the canvas paints over the poster */ }
  $('.hero-canvas').addEventListener('webglcontextlost', () => hero.classList.add('no-webgl')); // GPU dropped: back to the poster
  import('../city.js')
    .then(({ createCity }) => { if (!createCity({ canvas: $('.hero-canvas'), label: $('.ws-label'), reducedMotion, withClouds: false })) hero.classList.add('no-webgl'); })
    .catch(() => hero.classList.add('no-webgl'));
}
const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(startCity, { timeout: 1500 }) : setTimeout(startCity, 200));
function mode() {
  hero.classList.toggle('is-poster', mq.matches);
  if (!mq.matches && !started) { if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true }); }
}
mq.addEventListener('change', mode);
mode();

// ---------- journey: the step nearest the middle of the screen lights its stop on the route
const stops = $$('.jr-line li'), steps = $$('.jr-step'), map = $('.jr-map');
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const n = Number(e.target.dataset.step);
  steps.forEach((s, k) => s.classList.toggle('is-active', k === n));
  stops.forEach((s, k) => { s.classList.toggle('is-done', k < n); s.classList.toggle('is-active', k === n); });
  map.style.setProperty('--p', n / (stops.length - 1));
}), { rootMargin: '-45% 0px -45% 0px' });
steps.forEach((s) => io.observe(s));

// ---------- sectors
const names = Object.keys(C.sectors.list), tabs = $$('.tabs [role="tab"]');
function show(i, focus) {
  tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
  $('#st-panel').setAttribute('aria-labelledby', tabs[i].id);
  $('#st-panel').innerHTML = C.sectors.list[names[i]].map(([n, t, l], k) => { const q = quote(t); return `<a class="row" href="#lead" style="--i:${k}" aria-label="Invest in ${esc(n)} (${t})">
    <span class="r-logo">${logo(l, t)}</span><span class="r-name"><b>${esc(n)}</b><small>${t}</small></span>
    <span class="r-sp">${sparkFor(t, 120, 32, { dot: false })}</span>
    <span class="r-px num">${usd.format(q.px)}</span><span class="r-ch num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span><span class="r-go">Invest${icon.go}</span></a>`; }).join('');
  if (focus) tabs[i].focus();
}
// phones: the tab strip scrolls sideways; keep the chosen tab in view without moving the page
const reveal = (i) => { const b = tabs[i], s = b.parentElement; s.scrollTo?.({ left: b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2, behavior: reducedMotion ? 'auto' : 'smooth' }); };
tabs.forEach((t, i) => t.addEventListener('click', () => { show(i); reveal(i); track('sector_tab', { sector: names[i] }); }));
$('.tabs').addEventListener('keydown', (e) => {
  const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: names.length - 1 }[e.key];
  if (n !== undefined) { e.preventDefault(); const k = (n + names.length) % names.length; show(k, true); reveal(k); }
});
show(0);
