// v4 · Data-first market: a market strip with both clocks and the US session in IST, a sector heatmap hero,
// a sortable stock table and a fee schedule. Light terminal look: hairline grids, tabular figures.
import './base.css';
import './v4.css';
import { C, boot, header, footer, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, tickClocks } from './kit.js';
import { usSessionInIST, istClock } from '../market.js';

const ALL = Object.entries(C.sectors.list).flatMap(([s, list]) => list.map(([n, t, l]) => ({ s, n, t, l, ...quote(t) })));
// heat colour: light tints so ink text stays readable on every cell
const heat = (ch) => {
  const k = Math.min(1, Math.abs(ch) / 2);
  return ch >= 0 ? `hsl(145 ${45 + k * 10}% ${93 - k * 22}%)` : `hsl(0 ${70 + k * 10}% ${95 - k * 18}%)`;
};
const S = usSessionInIST();
const sessionLabel = `${istClock(S.open)} – ${istClock(S.close)} IST`;

const html = `${header()}
<aside class="mstrip" aria-label="Market clocks"><div class="vw mstrip-in">
  <p><span class="k">Mumbai</span> <b data-bind="ist">—</b></p>
  <p><span class="k">New York</span> <b data-bind="nyc">—</b></p>
  <p class="mstrip-status"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p>
  <div class="session" aria-label="US regular session in India time: ${sessionLabel}"><span class="k">US session (IST)</span>
    <div class="sbar"><i class="sbar-open" style="--a:${(S.open % 1440) / 1440}; --b:${Math.min(S.close, 1440) / 1440}"></i>${S.close > 1440 ? `<i class="sbar-open" style="--a:0; --b:${(S.close - 1440) / 1440}"></i>` : ''}<i class="sbar-now" id="sbar-now"></i></div>
    <b class="num">${sessionLabel}</b></div>
</div></aside>
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-copy">
      <p class="k">${C.hero.eyebrow}</p>
      <h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1>
      <p class="lead">${C.hero.lead}</p>
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
    </div>
    <div class="dash panel" aria-label="Illustrative market overview">
      <div class="dash-head"><p class="k">Market overview</p><p class="k">Illustrative · USD</p></div>
      <ul class="etfs">${['SPY', 'QQQ', 'VOO'].map((t) => { const q = quote(t); const n = C.sectors.list.ETFs.find((r) => r[1] === t)[0]; return `<li><p class="k">${t}</p><b class="num">${usd.format(q.px)}</b><span class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span><small>${n}</small></li>`; }).join('')}</ul>
      <div class="heat">${Object.entries(C.sectors.list).filter(([s]) => s !== 'ETFs').map(([s, list]) => `<div class="heat-col"><p class="k">${s}</p>${list.map(([n, t]) => { const q = quote(t); return `<a href="#lead" class="cell" style="background:${heat(q.ch)}" aria-label="${esc(n)} ${t}, ${pct(q.ch)}"><b>${t}</b><span class="num">${q.ch >= 0 ? '+' : '−'}${Math.abs(q.ch).toFixed(2)}%</span></a>`; }).join('')}</div>`).join('')}</div>
      <p class="dash-foot">${C.sectors.note}</p>
    </div>
  </div>
  <div class="vw"><dl class="kpis" aria-label="Key investment highlights">${C.highlights.map((h, i) => `<div class="rv" style="--i:${i}"><dt class="k">${h.label}</dt><dd><b>${h.fig}</b><small>${h.note}</small></dd></div>`).join('')}</dl></div>
</section>

<section class="sec brands" id="brands">
  <div class="vw">
    <div class="head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
    <ul class="watch">${C.brands.list.map(([n, t, l], i) => { const q = quote(t); return `<li class="rv" style="--i:${i % 4}"><a href="#lead" aria-label="Invest in ${n} (${t})">
      <span class="w-top"><span class="w-logo">${logo(l)}</span><b class="w-t">${t}</b></span><small>${n}</small>
      <span class="w-px num">${usd.format(q.px)}</span><span class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span></a></li>`; }).join('')}</ul>
  </div>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="k">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <div class="specs">${C.features.items.map(([t, d], i) => `<article class="spec rv" style="--i:${i}">
      <p class="k">F-0${i + 1}</p><h3>${t}</h3><p>${d}</p>
      <div class="spec-viz" aria-hidden="true">${[
        `<span class="viz-frac"><b class="num">$1.00</b><i style="--f:.0043"></i><small class="num">0.0043 AAPL</small></span>`,
        `<span class="viz-search">${icon.search}<span>Technology</span><span>Healthcare</span><span>ETFs</span></span>`,
        `<span class="viz-hold">${['AAPL', 'NVDA', 'AMZN'].map((t) => `<i style="--w:${0.3 + (quote(t).px % 50) / 100}"></i>`).join('')}</span>`,
        `<span class="viz-fx"><b>INR</b><i class="loop"></i><b>USD</b></span>`][i]}</div>
    </article>`).join('')}</div>

    <div class="block rv">
      <h3 class="h3">${C.orders.title}</h3>
      <div class="panel ot-panel"><table class="otable"><caption class="sr-only">${C.orders.title}</caption>
        <thead><tr>${C.orders.cols.map((c) => `<th scope="col">${c}</th>`).join('')}<th scope="col">m.Stock</th></tr></thead>
        <tbody>${C.orders.rows.map(([t, d, b]) => `<tr><th scope="row">${t}</th><td>${d}</td><td>${b}</td><td><span class="ok">${icon.check}Supported</span></td></tr>`).join('')}</tbody></table></div>
    </div>
    <div class="block">
      <h3 class="h3 rv">${C.supports.title}</h3>
      <dl class="grid3">${C.supports.items.map(([t, d], i) => `<div class="panel rv" style="--i:${i}"><dt><span class="k">0${i + 1}</span>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>
  </div>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="grid3">${C.why.items.map(([t, d], i) => `<article class="panel why-p rv" style="--i:${i}"><span class="why-ico">${[icon.globe, icon.star, icon.swap][i]}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec how" id="how">
  <div class="vw">
    <div class="head head-row rv"><h2>${C.steps.title}</h2><a class="btn btn-ink" href="#lead">${C.steps.cta}</a></div>
    <ol class="pipe">${C.steps.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><p class="pipe-k"><span class="num">0${i + 1}</span><i></i></p><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    <div class="block panel who"><h3>${C.who.title}</h3><dl>${C.who.items.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl></div>
    ${C.routes.map((r) => `<div class="flow rv"><p class="flow-head"><b>${r.title}</b><span class="k">${r.tag}</span></p>
      <ol>${r.steps.map((s, i) => `<li><span class="k">${i + 1}</span>${s}</li>`).join('')}</ol><p class="flow-note">${r.note}</p></div>`).join('')}
  </div>
</section>

<section class="sec popular" id="popular">
  <div class="vw">
    <div class="head head-row rv"><h2>${C.sectors.title}</h2><p class="mkt"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p></div>
    <div class="filters" role="group" aria-label="Sectors">${Object.keys(C.sectors.list).map((s, i) => `<button type="button" data-s="${s}" aria-pressed="${i === 0}">${s}</button>`).join('')}</div>
    <div class="panel tbl-wrap"><table class="stbl">
      <caption class="sr-only">US stocks by sector, illustrative prices</caption>
      <thead><tr><th scope="col">${C.sectors.cols[0]}</th><th scope="col">${C.sectors.cols[1]}</th>
        <th scope="col" class="r" aria-sort="none"><button type="button" data-sort="px">${C.sectors.cols[2]}<span aria-hidden="true">↕</span></button></th>
        <th scope="col" class="r" aria-sort="none"><button type="button" data-sort="ch">${C.sectors.cols[3]}<span aria-hidden="true">↕</span></button></th>
        <th scope="col" class="r"><span class="sr-only">${C.sectors.cols[4]}</span></th></tr></thead>
      <tbody id="stbl"></tbody></table></div>
    <div class="pop-foot"><a class="tlink" href="#lead">${C.sectors.cta}${icon.go}</a><p class="fine">${C.sectors.note}</p></div>
  </div>
</section>

<section class="sec pricing" id="pricing">
  <div class="vw">
    <div class="head rv"><h2>${C.whyUs.title}</h2></div>
    <ul class="grid4 checks">${C.whyUs.items.map((t, i) => `<li class="panel rv" style="--i:${i}"><span class="k">0${i + 1}</span>${t}</li>`).join('')}</ul>
    <h3 class="h3 rv">${C.charges.title}</h3>
    <div class="panel fees rv"><table class="ftbl"><caption class="sr-only">${C.charges.title}</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">Charge</th><th scope="col">Details</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead>
      <tbody>${C.charges.items.map((c) => `<tr${c.hot ? ' class="is-hot"' : ''}><th scope="row">${c.label}${c.tag ? `<span class="fee-tag">${c.tag}</span>` : ''}</th><td class="fee-v num">${c.fig.replace('*', '<sup>*</sup>')}</td><td>${c.note}</td><td class="r"><a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></td></tr>`).join('')}</tbody></table></div>
    <p class="fine">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head head-row rv"><div><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div><a class="btn btn-ghost" href="#tax-guide">${C.tax.cta}</a></div>
    <div class="grid4">${C.tax.items.map(([t, d], i) => `<article class="panel tax-p rv" style="--i:${i}"><p class="k">TX-0${i + 1}</p><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec faq" id="faq"><div class="vw faq-in"><h2 class="rv">${C.faq.title}</h2>${faqList()}</div></section>

<section class="sec closing" id="start">
  <div class="vw close-in panel">
    <div>
      <h2>${C.closing.title}</h2>
      <p class="lead">${C.closing.sub}</p>
      ${leadForm('lead-2', C.closing.cta)}
      <a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a>
    </div>
    <ul class="close-list">${C.closing.benefits.map((b, i) => `<li><span class="k">0${i + 1}</span>${b}</li>`).join('')}<li class="fine">${C.closing.fine}</li></ul>
  </div>
</section>
</main>
${footer()}`;

boot('v4', html);

// "now" marker on the IST day bar
const nowEl = $('#sbar-now');
const placeNow = () => { const ist = new Date(Date.now() + 330 * 60000); nowEl.style.setProperty('--x', (ist.getUTCHours() * 60 + ist.getUTCMinutes()) / 1440); };
placeNow(); setInterval(() => { placeNow(); tickClocks(); }, 30000);

// sector filter + sortable table
let sector = 'Technology', sortKey = null, dir = -1;
const body = $('#stbl');
function render() {
  const rows = ALL.filter((r) => r.s === sector);
  if (sortKey) rows.sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
  body.innerHTML = rows.map((r) => `<tr><th scope="row"><a class="co" href="#lead" aria-label="Invest in ${esc(r.n)} (${r.t})">${logo(r.l, r.t)}${esc(r.n)}</a></th><td class="k">${r.t}</td>
    <td class="r num">${usd.format(r.px)}</td><td class="r num ${r.ch >= 0 ? 'up' : 'down'}">${pct(r.ch)}</td>
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
