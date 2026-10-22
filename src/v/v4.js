// v4 · "Wall Street, built from candles": the skyline is a price chart. Candles stand as navy towers with lit windows,
// the price line runs over the rooftops, and the rest of the page keeps to the idea: a live opening-bell clock, a ticker
// tape, features as the floors of one building, an elevator for the four steps, trade tickets for order types and
// price tags for charges. Light page, exact brand navy and orange; green/red only for market data.
import './base.css';
import './v4.css';
import { C, boot, header, footer, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, tickClocks, reducedMotion } from './kit.js';
import { usSessionInIST, istClock } from '../market.js';

const ALL = Object.entries(C.sectors.list).flatMap(([s, list]) => list.map(([n, t, l]) => ({ s, n, t, l, ...quote(t) })));
const S = usSessionInIST();

// The candle skyline (deterministic): each candle is a tower — height = the candle's top, spire = the day's high.
function skyline(w = 1200, h = 300, n = 34, seed = 7) {
  let s = seed, p = 0.42; const c = [];
  for (let i = 0; i < n; i++) {
    s = (s * 7919 + 13) % 9973; const r1 = s / 9973; s = (s * 7919 + 13) % 9973; const r2 = s / 9973;
    const open = p; p = Math.min(0.92, Math.max(0.18, p + (r1 - 0.44) * 0.16 + (i > n * 0.55 ? 0.012 : 0)));
    c.push({ open, close: p, high: Math.max(open, p) + 0.03 + r2 * 0.07, up: p >= open });
  }
  const gap = 6, bw = (w - gap * (n + 1)) / n, base = h - 8;
  const Y = (v) => base - v * (h - 40);
  const towers = c.map((k, i) => {
    const x = gap + i * (bw + gap), top = Y(Math.max(k.open, k.close)), spire = Y(k.high);
    const rows = Math.max(0, Math.floor((base - top - 10) / 12)), cols = Math.max(1, Math.floor((bw - 8) / 8));
    let lit = '';
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) lit += `<rect x="${(x + 5 + q * 8).toFixed(1)}" y="${(top + 8 + r * 12).toFixed(1)}" width="4" height="6" class="${((i * 31 + r * 17 + q * 7) % 9) < 2 ? 'win on' : 'win'}"/>`;
    const st = ALL[i % ALL.length];
    return `<g class="tower" style="--i:${i}" data-t="${st.t}" data-n="${esc(st.n)}">
      <line class="spire" x1="${(x + bw / 2).toFixed(1)}" x2="${(x + bw / 2).toFixed(1)}" y1="${spire.toFixed(1)}" y2="${top.toFixed(1)}"/>
      <rect class="body" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(base - top).toFixed(1)}" rx="2"/>
      <rect class="cap ${k.up ? 'up' : 'down'}" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="4" rx="1"/>${lit}</g>`;
  }).join('');
  const line = c.map((k, i) => `${i ? 'L' : 'M'}${(gap + i * (bw + gap) + bw / 2).toFixed(1)} ${(Y(Math.max(k.open, k.close)) - 14).toFixed(1)}`).join(' ');
  return `<svg class="sky" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs><linearGradient id="towerG${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d4a94"/><stop offset="1" stop-color="#072d5e"/></linearGradient>
    <linearGradient id="lineG${seed}" x1="0" x2="1"><stop offset="0" stop-color="#ffb07a"/><stop offset="1" stop-color="#ff5400"/></linearGradient></defs>
    <g class="towers" fill="url(#towerG${seed})">${towers}</g>
    <path class="pline" d="${line}" pathLength="1" stroke="url(#lineG${seed})"/>
    <circle class="pdot" r="6"><animateMotion dur="9s" repeatCount="indefinite" path="${line}"/></circle>
    <rect class="street" x="0" y="${base}" width="${w}" height="8"/>
  </svg>`;
}

const FLOOR_MARK = ['$1', icon.search, icon.chart, '₹→$'];
const TICKET = ['MKT', 'LMT', 'STP', 'AMT'];
const tag = (c) => `<article class="ptag${c.hot ? ' is-hot' : ''} rv">${c.tag ? `<span class="pt-flag">${c.tag}</span>` : ''}<i class="pt-hole" aria-hidden="true"></i><p class="pt-k">${c.label}</p><p class="pt-v num">${c.fig.replace('*', '<sup>*</sup>')}</p><p class="pt-n">${c.note}</p><a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`;

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-copy">
      <p class="pill"><span class="live-dot" data-market-dot></span>${C.hero.eyebrow}</p>
      <h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1>
      <p class="lead">${C.hero.lead}</p>
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
    </div>
    <aside class="bell" aria-label="US market clock">
      <p class="bell-k">Opening bell</p>
      <div class="bell-clocks"><p><small>Mumbai</small><b data-bind="ist">—</b></p><p><small>New York</small><b data-bind="nyc">—</b></p></div>
      <p class="bell-status"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p>
      <div class="bell-bar" aria-hidden="true"><i class="bb-open" style="--a:${(S.open % 1440) / 1440}; --b:${Math.min(S.close, 1440) / 1440}"></i>${S.close > 1440 ? `<i class="bb-open" style="--a:0; --b:${(S.close - 1440) / 1440}"></i>` : ''}<i class="bb-now" id="bb-now"></i></div>
      <p class="bell-foot">US session <b class="num">${istClock(S.open)} – ${istClock(S.close)}</b> IST</p>
    </aside>
  </div>
  <div class="sky-wrap">${skyline()}<p class="sky-tip" id="sky-tip" hidden></p></div>
  <ul class="tape" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>
</section>

<section class="sec brands" id="brands">
  <div class="vw head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
  <div class="ticker" aria-hidden="true"><div class="tk-track loop">${[0, 1].map(() => `<ul>${C.brands.list.map(([, t, l]) => { const q = quote(t); return `<li>${logo(l)}<b>${t}</b><span class="num">${usd.format(q.px)}</span><em class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</em></li>`; }).join('')}</ul>`).join('')}</div></div>
  <ul class="sr-only">${C.brands.list.map(([n, t]) => `<li>${n} (${t})</li>`).join('')}</ul>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="eyebrow">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <div class="tower-b rv">
      <div class="tb-roof" aria-hidden="true"><i></i></div>
      ${C.features.items.map((f, i) => [f, i]).reverse().map(([[t, d], i]) => `<article class="floor"><span class="fl-n" aria-hidden="true">F${i + 1}</span><span class="fl-win" aria-hidden="true">${'<i></i>'.repeat(8)}</span><span class="fl-mark" aria-hidden="true">${FLOOR_MARK[i]}</span><div><h3>${t}</h3><p>${d}</p></div></article>`).join('')}
      <div class="tb-base" aria-hidden="true">m.Stock</div>
    </div>

    <h3 class="h3 rv">${C.orders.title}</h3>
    <div class="tickets">${C.orders.rows.map(([t, d, b], i) => `<article class="ticket rv" style="--i:${i}">
      <p class="tk-head"><span class="num">${TICKET[i]}</span><b>${t}</b></p>
      <dl><div><dt>${C.orders.cols[1]}</dt><dd>${d}</dd></div><div><dt>${C.orders.cols[2]}</dt><dd>${b}</dd></div></dl>
      <p class="tk-foot" aria-hidden="true"><i></i><i></i><i></i></p></article>`).join('')}</div>

    <h3 class="h3 rv">${C.supports.title}</h3>
    <dl class="specs">${C.supports.items.map(([t, d], i) => `<div class="rv" style="--i:${i}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
  </div>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="rv" style="--i:${i}"><span class="w-art" aria-hidden="true">${skyline(240, 70, 9, 11 + i * 5)}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec how" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2><a class="btn btn-primary" href="#lead">${C.steps.cta}</a></div>
    <div class="lift">
      <div class="shaft" aria-hidden="true">${[3, 2, 1, 0].map((i) => `<span class="lv" data-lv="${i}">${i + 1}</span>`).join('')}<i class="car" id="car"></i></div>
      <ol class="lift-steps">${C.steps.items.map(([t, d], i) => `<li data-step="${i}"><p class="ls-n">Step ${i + 1}</p><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    </div>
    <div class="who rv"><h3>${C.who.title}</h3><dl>${C.who.items.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl></div>
    <div class="routes">${C.routes.map((r) => `<article class="route rv"><p class="route-head"><b>${r.title}</b><span>${r.tag}</span></p><ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol><p class="route-note">${r.note}</p></article>`).join('')}</div>
  </div>
</section>

<section class="sec popular" id="popular">
  <div class="vw">
    <div class="head head-row rv"><h2>${C.sectors.title}</h2><p class="mkt"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p></div>
    <div class="filters" role="group" aria-label="Sectors">${Object.keys(C.sectors.list).map((s, i) => `<button type="button" data-s="${s}" aria-pressed="${i === 0}">${s}</button>`).join('')}</div>
    <div class="tbl-wrap"><table class="stbl">
      <caption class="sr-only">US stocks by sector, illustrative prices</caption>
      <thead><tr><th scope="col">${C.sectors.cols[0]}</th><th scope="col" class="t-tk">${C.sectors.cols[1]}</th>
        <th scope="col" class="r" aria-sort="none"><button type="button" data-sort="px">${C.sectors.cols[2]}<span aria-hidden="true">↕</span></button></th>
        <th scope="col" class="r" aria-sort="none"><button type="button" data-sort="ch">${C.sectors.cols[3]}<span aria-hidden="true">↕</span></button></th>
        <th scope="col" class="r inv-col"><span class="sr-only">${C.sectors.cols[4]}</span></th></tr></thead>
      <tbody id="stbl"></tbody></table></div>
    <div class="pop-foot"><a class="tlink" href="#lead">${C.sectors.cta}${icon.go}</a><p class="fine">${C.sectors.note}</p></div>
  </div>
</section>

<section class="sec pricing" id="pricing">
  <div class="vw">
    <div class="head rv"><h2>${C.whyUs.title}</h2></div>
    <ul class="whyus">${C.whyUs.items.map((t, i) => `<li class="rv" style="--i:${i}"><span class="num">0${i + 1}</span>${t}</li>`).join('')}</ul>
    <h3 class="h3 rv">${C.charges.title}</h3>
    <div class="tags">${C.charges.items.map(tag).join('')}</div>
    <p class="fine center">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head head-row rv"><div><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div><a class="btn btn-ghost" href="#tax-guide">${C.tax.cta}</a></div>
    <div class="tax-grid">${C.tax.items.map(([t, d], i) => `<article class="rv" style="--i:${i}"><span class="tax-n num">0${i + 1}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec faq" id="faq"><div class="vw faq-in"><h2 class="rv">${C.faq.title}</h2>${faqList()}</div></section>

<section class="closing" id="start">
  <div class="vw close-in">
    <div class="close-card">
      <h2>${C.closing.title}</h2>
      <p class="lead">${C.closing.sub}</p>
      ${leadForm('lead-2', C.closing.cta)}
      <ul class="benefits">${C.closing.benefits.map((b) => `<li>${icon.check}${b}</li>`).join('')}</ul>
      <a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a>
      <p class="fine">${C.closing.fine}</p>
    </div>
  </div>
  <div class="sky-wrap sky-close">${skyline(1200, 200, 40, 23)}</div>
</section>
</main>
${footer()}`;

boot('v4', html);
if (reducedMotion) $$('animateMotion').forEach((m) => m.remove());

// opening-bell "now" marker on the IST day bar
const nowEl = $('#bb-now');
const placeNow = () => { const ist = new Date(Date.now() + 330 * 60000); nowEl.style.setProperty('--x', (ist.getUTCHours() * 60 + ist.getUTCMinutes()) / 1440); };
placeNow(); setInterval(() => { placeNow(); tickClocks(); }, 30000);

// skyline towers: hover shows the stock that tower stands for
const tip = $('#sky-tip'), wrap = $('.hero .sky-wrap');
wrap.addEventListener('pointerover', (e) => {
  const g = e.target.closest('.tower'); if (!g) return;
  const q = quote(g.dataset.t), r = g.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
  tip.innerHTML = `<b>${g.dataset.n}</b> <span>${g.dataset.t}</span> <span class="num">${usd.format(q.px)}</span> <em class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</em>`;
  tip.style.left = `${r.left - wr.left + r.width / 2}px`; tip.style.top = `${r.top - wr.top - 10}px`; tip.hidden = false;
});
wrap.addEventListener('pointerleave', () => { tip.hidden = true; });

// elevator: the car rises to the floor of the step in view
const car = $('#car'), lvs = $$('.lv'), steps = $$('.lift-steps li');
const lift = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const n = Number(e.target.dataset.step);
  car.style.setProperty('--f', n);
  lvs.forEach((l) => l.classList.toggle('is-on', Number(l.dataset.lv) <= n));
  steps.forEach((s, k) => s.classList.toggle('is-active', k === n));
}), { rootMargin: '-40% 0px -40% 0px' });
steps.forEach((s) => lift.observe(s));

// sector filter + sortable table
let sector = 'Technology', sortKey = null, dir = -1;
const body = $('#stbl');
function render() {
  const rows = ALL.filter((r) => r.s === sector);
  if (sortKey) rows.sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
  body.innerHTML = rows.map((r) => `<tr><th scope="row"><a class="co" href="#lead" aria-label="Invest in ${esc(r.n)} (${r.t})"><span class="co-logo">${logo(r.l, r.t)}</span>${esc(r.n)}</a></th><td class="t-tk">${r.t}</td>
    <td class="r num">${usd.format(r.px)}</td><td class="r num"><span class="chg ${r.ch >= 0 ? 'up' : 'down'}">${pct(r.ch)}</span></td>
    <td class="r inv-col"><a class="inv" href="#lead" tabindex="-1" aria-hidden="true">Invest${icon.go}</a></td></tr>`).join('');
}
$$('.filters button').forEach((b) => b.addEventListener('click', () => {
  $$('.filters button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  sector = b.dataset.s; render(); track('sector_filter', { sector });
}));
$$('[data-sort]').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.sort;
  dir = sortKey === k ? -dir : -1; sortKey = k;
  $$('[data-sort]').forEach((x) => x.closest('th').setAttribute('aria-sort', x === b ? (dir < 0 ? 'descending' : 'ascending') : 'none'));
  render(); track('table_sort', { by: k });
}));
render();
