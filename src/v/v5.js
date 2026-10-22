// v5 · 3D city, new story: the live Manhattan hero full-bleed, then one scroll story from Mumbai to Wall Street
// (the four steps, the money routes and both clocks), a brand skyline, and the rest set calmly around it.
import './base.css';
import './v5.css';
import { C, BASE, boot, header, footer, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, reducedMotion, REF_PRICES } from './kit.js';

const STEP_ICONS = [icon.user, icon.shield, icon.wallet, icon.chart];
// brand skyline: tower height grows with share price (log scale), so the row reads like a skyline
const towerH = (t) => Math.round(90 + Math.log10(REF_PRICES[t]) * 70);

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <canvas class="hero-canvas" aria-hidden="true"></canvas>
  <img class="hero-poster" src="${BASE}city-poster.webp" alt="" width="1600" height="840" aria-hidden="true" loading="lazy">
  <div class="hero-fade" aria-hidden="true"></div>
  <div class="ws-label" aria-hidden="true"><span class="ws-dot"></span><strong>Wall Street</strong><span data-bind="nyc">—</span>&nbsp;ET</div>
  <div class="vw hero-copy">
    <p class="eyebrow">${C.hero.eyebrow}</p>
    <h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1>
    <p class="lead">${C.hero.lead}</p>
    <p class="form-title sr-only" id="form-title">${C.hero.formTitle}</p>
    ${leadForm('lead', C.hero.cta, 'form-title')}
    <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
  </div>
  <div class="vw hero-foot">
    <ul class="hl" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>
    <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
  </div>
</section>

<section class="sec journey" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2></div>
    <div class="jr">
      <aside class="jr-map" aria-hidden="true">
        <p class="jr-city"><b>Mumbai</b><span data-bind="ist">—</span> IST</p>
        <ol class="jr-line">${C.steps.items.map(([t], i) => `<li data-n="${i}"><span>${i + 1}</span>${t}</li>`).join('')}</ol>
        <p class="jr-city"><b>New York</b><span data-bind="nyc">—</span> ET</p>
      </aside>
      <ol class="jr-steps">${C.steps.items.map(([t, d], i) => `<li class="jr-step" data-step="${i}">
        <span class="jr-ico">${STEP_ICONS[i]}</span><p class="jr-n">Step ${i + 1}</p><h3>${t}</h3><p class="jr-d">${d}</p>
        ${i === 0 ? `<details class="jr-more"><summary>${C.who.title}</summary><dl class="jr-who">${C.who.items.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></details>` : ''}
        ${i === 2 ? route(C.routes[0]) : ''}
        ${i === 3 ? `${route(C.routes[1])}<a class="btn btn-primary" href="#lead">${C.steps.cta}</a>` : ''}
      </li>`).join('')}</ol>
    </div>
  </div>
</section>

<section class="sec skyline" id="brands">
  <div class="vw">
    <div class="head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
    <ul class="towers rv">${C.brands.list.map(([n, t, l], i) => { const q = quote(t); return `<li style="--h:${towerH(t)}px; --i:${i}"><a href="#lead" aria-label="Invest in ${n} (${t}), ${usd.format(q.px)}">
      <span class="t-tip"><b class="num">${usd.format(q.px)}</b><span class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span></span>
      <span class="t-logo">${logo(l)}</span><span class="t-body"><span class="t-name">${t}</span></span></a></li>`; }).join('')}</ul>
  </div>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="eyebrow">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <ol class="feats">${C.features.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><span class="f-n num">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    <div class="split">
      <div class="rv">
        <h3 class="h3">${C.orders.title}</h3>
        <div class="acc">${C.orders.rows.map(([t, d, b], i) => `<details${i === 0 ? ' open' : ''}><summary>${t}</summary><dl><div><dt>${C.orders.cols[1]}</dt><dd>${d}</dd></div><div><dt>${C.orders.cols[2]}</dt><dd>${b}</dd></div></dl></details>`).join('')}</div>
      </div>
      <div class="rv" style="--i:1">
        <h3 class="h3">${C.supports.title}</h3>
        <dl class="sup">${C.supports.items.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
      </div>
    </div>
  </div>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="rv" style="--i:${i}"><span class="why-ico">${[icon.globe, icon.star, icon.swap][i]}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
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
    <ol class="whyus">${C.whyUs.items.map((t, i) => `<li class="rv" style="--i:${i}"><span class="num">0${i + 1}</span>${t}</li>`).join('')}</ol>
    <h3 class="h3 center rv">${C.charges.title}</h3>
    <div class="charges">${C.charges.items.map((c, i) => `<article class="charge${c.hot ? ' is-hot' : ''} rv" style="--i:${i}">${c.tag ? `<span class="charge-tag">${c.tag}</span>` : ''}
      <p class="charge-k">${c.label}</p><p class="charge-v num">${c.fig.replace('*', '<sup>*</sup>')}</p><p class="charge-n">${c.note}</p>
      <a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`).join('')}</div>
    <p class="fine center">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head rv"><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div>
    <div class="tax-grid">${C.tax.items.map(([t, d], i) => `<article class="rv" style="--i:${i}"><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></article>`).join('')}</div>
    <p class="center"><a class="btn btn-ghost" href="#tax-guide">${icon.doc}${C.tax.cta}</a></p>
  </div>
</section>

<section class="sec faq" id="faq"><div class="vw faq-in"><h2 class="rv">${C.faq.title}</h2>${faqList()}</div></section>

<section class="closing" id="start">
  <div class="vw">
    <div class="close-card rv">
      <h2>${C.closing.title}</h2>
      <p class="lead">${C.closing.sub}</p>
      ${leadForm('lead-2', C.closing.cta)}
      <ul class="benefits">${C.closing.benefits.map((b) => `<li>${icon.check}${b}</li>`).join('')}</ul>
      <a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a>
      <p class="fine">${C.closing.fine}</p>
    </div>
  </div>
</section>
</main>
${footer()}`;

function route(r) {
  return `<div class="jr-route"><p><b>${r.title}</b><span>${r.tag}</span></p><ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol><small>${r.note}</small></div>`;
}

boot('v5', html);

// ---------- live 3D city on desktop (same module and data as the live page); phones get the poster
const hero = $('.hero');
if (matchMedia('(max-width: 900px)').matches) hero.classList.add('is-poster');
else {
  const start = () => import('../city.js')
    .then(({ createCity }) => { if (!createCity({ canvas: $('.hero-canvas'), label: $('.ws-label'), reducedMotion, withClouds: true })) hero.classList.add('no-webgl'); })
    .catch(() => hero.classList.add('no-webgl'));
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 200));
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
}

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
    <span class="r-px num">${usd.format(q.px)}</span><span class="r-ch num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span><span class="r-go">Invest${icon.go}</span></a>`; }).join('');
  if (focus) tabs[i].focus();
}
tabs.forEach((t, i) => t.addEventListener('click', () => { show(i); track('sector_tab', { sector: names[i] }); }));
$('.tabs').addEventListener('keydown', (e) => {
  const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: names.length - 1 }[e.key];
  if (n !== undefined) { e.preventDefault(); show((n + names.length) % names.length, true); }
});
show(0);
