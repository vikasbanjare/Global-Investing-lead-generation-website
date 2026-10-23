// v4 · "Wall Street, built from candles": the hero rests on a real candlestick chart (wicks, green/red bodies) and
// the smooth price line (kit curvePath) threads every close over the rooftops. The rest of the page keeps to the idea: a
// live opening-bell clock, a ticker tape, product screens, numbered step cards, trade tickets for order types.
// Light page, exact brand navy and orange; green/red only for market data.
import './base.css';
import './v4.css';
import { C, boot, header, footer, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, pricePath, curvePath, chartSVG, sparkFor } from './kit.js';
import { usSessionInIST, istClock } from '../market.js';

const ALL = Object.entries(C.sectors.list).flatMap(([s, list]) => list.map(([n, t, l]) => ({ s, n, t, l, ...quote(t) })));
const NAME = { ...Object.fromEntries(ALL.map((r) => [r.t, [r.n, r.l]])), AVGO: ['Broadcom', 'broadcom'] };
const UP = ALL.filter((r) => r.ch >= 0), DOWN = ALL.filter((r) => r.ch < 0);
const S = usSessionInIST();
const f1 = (n) => Math.round(n * 10) / 10;
const hash = (a, b) => (((a * 7919 + b * 104729 + 13) % 997) + 997) % 997 / 997; // deterministic 0..1
const nb = (s) => s.replace(/ (\S+)$/, ' $1');                                // no orphan last word (same wording)
const IST = (m) => istClock(m).toUpperCase();

// The candle chart. Closes come from kit pricePath; curvePath maps them so that the curve's x for candle i is that
// tower's centre (pad = gap + bw/2), and the same y-map sets the candle body (open = previous close) on each roof.
let skyId = 0;
function skyline({ w, h, n, seed, change = 3, cls = '', dot = 0 }) {
  const id = ++skyId, gap = w / (n * 5), bw = (w - gap * (n + 1)) / n, pad = gap + bw / 2;
  const base = h - 8, roof = h * 0.16, minH = h * 0.2;
  const c = curvePath(pricePath(seed, change, n), w, base - minH - roof + 2 * pad, pad), off = roof - pad;
  const Y = c.pts.map((p) => p[1] + off);
  const cw = Math.max(3, bw * 0.5);                                   // candle body: half the slot, like a real chart
  let nu = 0, nd = 0;
  const towers = Y.map((yc, i) => {
    const yo = i ? Y[i - 1] : yc + 3, up = yc <= yo, top = Math.min(yo, yc), cap = Math.max(3, Math.abs(yo - yc));
    const x = gap + i * (bw + gap), cx = x + bw / 2;
    const hi = top - h * (0.02 + hash(i, 1) * 0.05), lo = top + cap + h * (0.02 + hash(i, 2) * 0.05); // wick: session high/low
    const st = up ? UP[nu++ % UP.length] : DOWN[nd++ % DOWN.length];   // the hover quote moves the same way as its candle
    return `<g class="tower ${up ? 'up' : 'down'}" style="--i:${i}" data-t="${st.t}" data-n="${esc(st.n)}">`
      + `<rect class="hit" x="${f1(x)}" y="0" width="${f1(bw + gap)}" height="${h}"/>`
      + `<line x1="${f1(cx)}" x2="${f1(cx)}" y1="${f1(hi)}" y2="${f1(Math.min(lo, base))}"/>`
      + `<rect class="body" x="${f1(cx - cw / 2)}" y="${f1(top)}" width="${f1(cw)}" height="${f1(cap)}" rx="${f1(Math.min(cap / 2, cw * 0.2))}"/></g>`;
  }).join('');
  const grid = [0.3, 0.5, 0.7, 0.9].map((k) => `<line x1="0" x2="${w}" y1="${f1(h * k)}" y2="${f1(h * k)}"/>`).join('');
  const area = `${c.line} L${c.end[0]} ${f1(base - off)} L${c.pts[0][0]} ${f1(base - off)} Z`;
  return `<svg class="sky ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <defs><linearGradient id="skL${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb07a"/><stop offset="1" stop-color="#ff5400"/></linearGradient>
    <linearGradient id="skA${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a4c" stop-opacity=".26"/><stop offset="1" stop-color="#ffd2b8" stop-opacity="0"/></linearGradient></defs>
    <path class="parea" transform="translate(0 ${f1(off)})" d="${area}" fill="url(#skA${id})"/>
    <g class="grid">${grid}</g>
    <g class="towers">${towers}</g>
    <path class="pline" transform="translate(0 ${f1(off)})" d="${c.line}" stroke="url(#skL${id})"/>
    ${dot ? `<g class="last" transform="translate(${c.end[0]} ${f1(c.end[1] + off)})"><circle class="pring loop" r="${dot * 2.2}"/><circle class="pdot" r="${dot}"/></g>` : ''}
    <line class="street" x1="0" x2="${w}" y1="${base}" y2="${base}"/>
  </svg>`;
}

// Small app UI used inside the feature and "why" cards (illustrative labels only; quotes are the page's reference prices).
const chip = (t) => { const q = quote(t); return `<em class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</em>`; };
const coin = (t) => `<span class="ui-logo">${logo(NAME[t][1], t)}</span>`;
const row = (t, sub = t) => `<li>${coin(t)}<span class="ui-name"><b>${esc(NAME[t][0])}</b><small>${sub}</small></span>${sparkFor(t, 64, 24, { cls: 'ui-spark', baseline: false, dot: false })}${chip(t)}</li>`;
const seg = (opts, on) => `<span class="ui-seg">${opts.map((o, i) => `<span${i === on ? ' class="on"' : ''}>${o}</span>`).join('')}</span>`;
const FEATURE_UI = [
  () => `<p class="ui-row">${coin('AAPL')}<span class="ui-name"><b>Apple</b><small>AAPL · Fractional</small></span><span class="ui-px num">${usd.format(quote('AAPL').px)}</span></p>
    <p class="ui-amt"><small>Invest amount</small><b class="num">$1.00</b><small class="num">≈ ${(1 / quote('AAPL').px).toFixed(4)} shares</small></p>
    <p class="ui-chips"><span class="on">$1</span><span>$5</span><span>$10</span><span>$25</span></p>`,
  () => `<p class="ui-search">${icon.search}<span>Semiconductors</span><i></i></p>
    <p class="ui-tags"><span class="on">Technology</span><span>AI</span><span>ETFs</span></p>
    <ul class="ui-list">${row('NVDA')}${row('AVGO')}</ul>`,
  () => `<p class="ui-row"><span class="ui-name"><b>US holdings</b><small>Positions · Balances · History</small></span>${seg(['1D', '1M', '1Y'], 0)}</p>
    ${chartSVG('v4-holdings', 1.4, 300, 64, { tone: 'brand', cls: 'ui-chart' })}
    <ul class="ui-list">${row('MSFT')}</ul>`,
  () => `<p class="ui-fx"><span><small>From your bank</small><b>₹ INR</b></span><i>${icon.swap}</i><span><small>Buying power</small><b>$ USD</b></span></p>
    <ol class="ui-steps"><li class="done">INR sent through your bank</li><li class="done">Converted to USD</li><li class="now">Buying power credited</li></ol>`,
];
const WHY_UI = [
  () => `<ul class="ui-list">${row('NFLX', 'Consumer')}${row('LLY', 'Healthcare')}${row('XOM', 'Energy')}</ul>`,
  () => `<p class="ui-row">${coin('MSFT')}<span class="ui-name"><b>Microsoft</b><small>MSFT · Nasdaq</small></span><span class="ui-px num">${usd.format(quote('MSFT').px)}</span></p>
    ${sparkFor('MSFT', 300, 64, { cls: 'ui-chart' })}`,
  () => `<p class="ui-row"><span class="ui-name"><b>Portfolio value</b><small>View in</small></span>${seg(['₹ INR', '$ USD'], 1)}</p>
    ${chartSVG('v4-usd', 0.9, 300, 64, { tone: 'brand', cls: 'ui-chart' })}`,
];
const TICKET = ['MKT', 'LMT', 'STP', 'AMT'];
const SPEC_ICON = [icon.chart, icon.swap, icon.shield], WHO_ICON = [icon.user, icon.doc, icon.globe], TAX_ICON = [icon.chart, icon.wallet, icon.swap, icon.doc];
const ico = (svg, cls = '') => `<span class="ico${cls}" aria-hidden="true">${svg}</span>`;
const charge = (c) => `<article class="charge${c.hot ? ' is-hot' : ''} rv">${c.tag ? `<p class="ch-flag">${c.tag}</p>` : ''}<p class="ch-k">${c.label}</p><p class="ch-v num"><span>${c.fig.replace('*', '<sup>*</sup>')}</span></p><p class="ch-n">${c.note}</p><a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`;

// The US session on a noon-to-noon IST axis, so the evening session is one continuous segment.
const ax = (m) => (((m - 720) % 1440) + 1440) % 1440 / 1440;
const sA = ax(S.open), sB = sA + (S.close - S.open) / 1440;

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-copy">
      <p class="pill"><span class="live-dot" data-market-dot></span>${C.hero.eyebrow}</p>
      <h1>${C.hero.h1} <span>${nb(C.hero.h1b)}</span></h1>
      <p class="lead">${C.hero.lead}</p>
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
    </div>
    <div class="sky-wrap" id="sky">${skyline({ w: 1200, h: 220, n: 34, seed: 'skyline', cls: 'sky-d', dot: 5 })}${skyline({ w: 600, h: 260, n: 14, seed: 'roof', cls: 'sky-m', dot: 9 })}<p class="sky-tip" id="sky-tip" aria-hidden="true" hidden></p></div>
    <div class="hero-side">
      <aside class="bell" aria-label="US market clock">
        <p class="bell-k">Opening bell</p>
        <div class="bell-clocks"><p><small>Mumbai</small><b data-bind="ist">—</b></p><p><small>New York</small><b data-bind="nyc">—</b></p></div>
        <p class="bell-status"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p>
        <div class="bell-bar" aria-hidden="true"><div class="bb-track"><i class="bb-open" style="--a:${f1(sA * 1000) / 1000}; --b:${f1(sB * 1000) / 1000}"></i><i class="bb-now" id="bb-now"></i></div>
          <p class="bb-ticks"><span>12 PM</span><span>6 PM</span><span>12 AM</span><span>6 AM</span></p></div>
        <p class="bell-foot">US session <b class="num">${IST(S.open)} – ${IST(S.close)}</b> IST</p>
      </aside>
      <ul class="hl" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="sec brands" id="brands">
  <div class="vw head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
  <div class="ticker" aria-hidden="true"><div class="tk-track loop">${[0, 1].map(() => `<ul>${C.brands.list.map(([, t, l]) => { const q = quote(t); return `<li>${logo(l)}<b>${t}</b><span class="num">${usd.format(q.px)}</span><em class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</em></li>`; }).join('')}</ul>`).join('')}</div></div>
  <ul class="sr-only">${C.brands.list.map(([n, t]) => `<li>${n} (${t})</li>`).join('')}</ul>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="eyebrow">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <div class="feat">${C.features.items.map(([t, d], i) => `<article class="fcard rv" style="--i:${i}"><div class="well" aria-hidden="true"><div class="ui">${FEATURE_UI[i]()}</div></div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>

    <h3 class="h3 rv">${C.orders.title}</h3>
    <div class="tickets">${C.orders.rows.map(([t, d, b], i) => `<article class="ticket rv" style="--i:${i}">
      <p class="tk-head"><span class="tk-code num">${TICKET[i]}</span><b>${t}</b></p>
      <dl class="tk-row"><dt>${C.orders.cols[1]}</dt><dd>${d}</dd></dl><dl class="tk-row"><dt>${C.orders.cols[2]}</dt><dd>${b}</dd></dl></article>`).join('')}</div>

    <h3 class="h3 rv">${C.supports.title}</h3>
    <dl class="specs">${C.supports.items.map(([t, d], i) => `<div class="spec rv" style="--i:${i}"><dt>${ico(SPEC_ICON[i])}${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
  </div>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="wcard rv" style="--i:${i}"><div class="well" aria-hidden="true"><div class="ui">${WHY_UI[i]()}</div></div><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec how" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2><a class="btn btn-primary" href="#lead">${C.steps.cta}</a></div>
    <div class="lift">
      <ol class="lift-steps">${C.steps.items.map(([t, d], i) => `<li data-step="${i}"><p class="ls-n"><span class="sr-only">Step </span>${i + 1}</p><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    </div>
    <div class="who rv"><h3>${C.who.title}</h3><dl>${C.who.items.map(([t, d], i) => `<div><dt>${ico(WHO_ICON[i], ' ico-navy')}${t}</dt><dd>${d}</dd></div>`).join('')}</dl></div>
    <div class="routes">${C.routes.map((r) => `<article class="route rv"><p class="route-tag">${r.tag}</p><h3>${r.title}</h3><ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol><p class="route-note">${r.note}</p></article>`).join('')}</div>
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
    <ul class="whyus rv">${C.whyUs.items.map((t, i) => `<li><span class="wn num" aria-hidden="true">0${i + 1}</span><p>${t}</p></li>`).join('')}</ul>
    <h3 class="h3 rv">${C.charges.title}</h3>
    <div class="charges">${C.charges.items.map(charge).join('')}</div>
    <p class="fine center">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head head-row rv"><div><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div><a class="btn btn-ghost" href="#tax-guide">${C.tax.cta}</a></div>
    <div class="tax-grid">${C.tax.items.map(([t, d], i) => `<article class="rv" style="--i:${i}">${ico(TAX_ICON[i], ' ico-navy')}<h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></article>`).join('')}</div>
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
  <div class="sky-wrap sky-close">${skyline({ w: 1200, h: 200, n: 40, seed: 'nyse', change: 2, cls: 'sky-d' })}${skyline({ w: 600, h: 240, n: 14, seed: 'open', cls: 'sky-m' })}</div>
</section>
</main>
${footer()}`;

boot('v4', html);

// opening-bell "now" marker on the noon-to-noon IST bar (boot already refreshes the clocks)
const nowEl = $('#bb-now');
const placeNow = () => { const ist = new Date(Date.now() + 330 * 60000); nowEl.style.setProperty('--x', f1(ax(ist.getUTCHours() * 60 + ist.getUTCMinutes()) * 1000) / 1000); };
placeNow(); setInterval(placeNow, 30000);

// skyline towers: the quote of the tower under the pointer; without a pointer (touch) the last candle's quote shows
const wrap = $('#sky'), tip = $('#sky-tip'), touch = matchMedia('(hover: none)').matches;
const lastTower = () => $$('.sky', wrap).find((s) => s.getClientRects().length)?.querySelector('.tower:last-of-type');
function place(g) {
  if (!g) { tip.hidden = true; return; }
  const q = quote(g.dataset.t), svg = g.ownerSVGElement, sr = svg.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
  const k = sr.width / svg.viewBox.baseVal.width, b = g.querySelector('.body'), sp = g.querySelector('line');
  tip.innerHTML = `<b>${g.dataset.n}</b> <span>${g.dataset.t}</span> <span class="num">${usd.format(q.px)}</span> <em class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</em>`;
  tip.hidden = false;
  const half = tip.offsetWidth / 2 + 8, cx = sr.left - wr.left + (Number(b.getAttribute('x')) + Number(b.getAttribute('width')) / 2) * k;
  tip.style.left = `${Math.min(Math.max(cx, half), wr.width - half)}px`;
  tip.style.top = `${sr.top - wr.top + Number(sp.getAttribute('y1')) * k - 8}px`;
}
const rest = () => place(touch ? lastTower() : null);
wrap.addEventListener('pointerover', (e) => { const g = e.target.closest('.tower'); if (g) place(g); });
wrap.addEventListener('pointerleave', rest);
addEventListener('resize', rest);
rest();

// steps: the card in view lights its number badge
const steps = $$('.lift-steps li');
const setStep = (n) => steps.forEach((s, k) => s.classList.toggle('is-active', k === n));
setStep(0);
const lift = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setStep(Number(e.target.dataset.step)); }), { rootMargin: '-40% 0px -40% 0px' });
steps.forEach((s) => lift.observe(s));

// sector filter + sortable table
let sector = 'Technology', sortKey = null, dir = -1;
const body = $('#stbl');
function render() {
  const rows = ALL.filter((r) => r.s === sector);
  if (sortKey) rows.sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
  body.innerHTML = rows.map((r) => `<tr><th scope="row"><a class="co" href="#lead" aria-label="Invest in ${esc(r.n)} (${r.t})"><span class="co-logo">${logo(r.l, r.t)}</span>${esc(r.n)}</a></th><td class="t-tk">${r.t}</td>
    <td class="r num">${usd.format(r.px)}</td><td class="r num"><span class="chg-cell">${sparkFor(r.t, 64, 24, { cls: 't-spark', baseline: false, dot: false })}<span class="chg ${r.ch >= 0 ? 'up' : 'down'}">${pct(r.ch)}</span></span></td>
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
