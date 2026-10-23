// v3 · Bold orange brand, light: a white → orange gradient hero with staggered "$1 buys" cards, warm white cards,
// real-looking app vignettes. White text only on the orange gradient.
import './base.css';
import './v3.css';
import { C, boot, header, footer, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, REF_PRICES, chartSVG, sparkFor, pricePath, curvePath } from './kit.js';

const FEAT = ['apple', 'Apple', 'AAPL'];
const MORE = [['nvidia', 'NVIDIA', 'NVDA'], ['microsoft', 'Microsoft', 'MSFT'], ['tesla', 'Tesla', 'TSLA']];
const qPill = (t) => { const q = quote(t); return `<span class="qpill ${q.ch >= 0 ? 'is-up' : 'is-down'} num">${pct(q.ch)}</span>`; };
const per1 = (t) => (1 / REF_PRICES[t]).toFixed(4);
const STEP_ICONS = [icon.user, icon.shield, icon.wallet, icon.chart];
const trust = `<p class="trust">${icon.shield}<span>${C.highlights[3].note} · ${C.whyUs.items[3]}</span></p>`;

// Hero "$1 buys": one featured card and a readable list card, staggered side by side, never overlapping.
// The AAPL chart uses the order ticket's 480 × 120 geometry (CSS scales it), so both AAPL lines draw the same shape.
const buys = `<div class="buys" aria-hidden="true">
  <div class="bcard b-feat loop">
    <p class="b-top"><span class="b-logo">${logo(FEAT[0])}</span><span class="b-name"><b>${FEAT[1]}</b><small>${FEAT[2]}</small></span>
      <span class="b-q"><b class="num">${usd.format(REF_PRICES[FEAT[2]])}</b>${qPill(FEAT[2])}</span></p>
    <p class="b-big num">$1</p>
    <p class="b-sub">buys <b class="num">${per1(FEAT[2])}</b> shares</p>
    <div class="b-chart">${chartSVG(FEAT[2], quote(FEAT[2]).ch, 480, 120, { tone: 'brand' })}</div>
  </div>
  <div class="bcard b-list">
    <p class="b-head"><b class="num">$1</b> buys</p>
    <ul>${MORE.map(([l, n, t]) => `<li><span class="b-logo">${logo(l)}</span><span class="b-name"><b>${n}</b><small>${t}</small></span>${sparkFor(t, 64, 28, { baseline: false, dot: false })}<span class="b-sh"><b class="num">${per1(t)}</b> shares</span></li>`).join('')}</ul>
  </div>
</div>`;

// Product tiles: a small app vignette each (decorative; the tile text carries the meaning).
const VIG = [
  `<span class="vg-card"><span class="vg-row"><span class="vg-logo">${logo('apple')}</span><span class="vg-t"><b>Apple</b><small>AAPL</small></span><b class="vg-amt num">$1.00</b></span>
    <span class="vg-foot">buys <b class="num">${per1('AAPL')}</b> shares</span></span>`,
  `<span class="vg-field">${icon.search}<span>Company, sector or theme</span></span>
    <span class="vg-chips">${['Technology', 'Healthcare', 'ETFs'].map((s) => `<span>${s}</span>`).join('')}</span>`,
  `<span class="vg-card vg-hold">${['AAPL', 'NVDA', 'TSLA'].map((t) => `<span class="vg-pos"><b>${t}</b>${sparkFor(t, 72, 22, { baseline: false, dot: false })}${qPill(t)}</span>`).join('')}</span>`,
  `<span class="vg-fx"><span class="vg-cur"><b>₹</b>INR</span><span class="vg-arrow">${icon.swap}</span><span class="vg-cur is-usd"><b>$</b>USD</span></span>`,
];

// Order ticket: the same AAPL chart for every order type; Limit and Stop add a dashed price level.
const TK = 'AAPL', TW = 480, TH = 120, tq = quote(TK);
const tEnd = curvePath(pricePath(TK, tq.ch, Math.max(24, Math.round(TW / 5))), TW, TH, 4).end[1]; // same path chartSVG draws
const LV = { limit: Math.min(TH - 10, tEnd + 26), stop: Math.max(10, tEnd - 30) };
const ticket = `<div class="ticket" aria-hidden="true">
  <p class="tk-head"><span class="tk-logo">${logo('apple')}</span><span class="tk-name"><b>Apple</b><small>AAPL</small></span><span class="tk-px num">${usd.format(tq.px)}</span>${qPill(TK)}</p>
  <div class="tk-chart">${chartSVG(TK, tq.ch, TW, TH, { tone: 'brand' })}
    <svg class="tk-lv" viewBox="0 0 ${TW} ${TH}">${Object.entries(LV).map(([k, y]) => `<line class="tk-line tk-line-${k}" x1="0" x2="${TW}" y1="${y}" y2="${y}"/>`).join('')}</svg>
    ${Object.entries(LV).map(([k, y]) => `<span class="tk-tag tk-tag-${k}" style="top:${((y / TH) * 100).toFixed(1)}%">${k === 'limit' ? 'Limit' : 'Stop'}</span>`).join('')}
  </div>
  <p class="tk-foot"><span class="tk-type" id="tk-type">${C.orders.rows[0][0]}</span><span class="tk-amt"><b class="num">$1.00</b> buys <b class="num">${per1(TK)}</b> shares</span></p>
</div>`;

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-copy">
      <p class="tag">${C.hero.eyebrow}</p>
      <h1><span>${C.hero.h1}</span> ${C.hero.h1b.replace(/ (\S+)$/, '&nbsp;$1')}</h1>
      <p class="lead">${C.hero.lead}</p>
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <div class="hero-form">
        <p class="form-title" id="form-title">${C.hero.formTitle}</p>
        ${leadForm('lead', C.hero.cta, 'form-title')}
        ${trust}
      </div>
      <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
    </div>
    ${buys}
    <ul class="hl" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>
  </div>
</section>

<section class="sec brands" id="brands">
  <div class="vw head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
  <div class="marquee" aria-hidden="true"><div class="mq-track loop">${[0, 1].map(() => `<ul>${C.brands.list.map(([n, t, l]) => `<li>${logo(l)}<b>${n}</b><span>${t}</span></li>`).join('')}</ul>`).join('')}</div></div>
  <ul class="sr-only">${C.brands.list.map(([n, t]) => `<li>${n} (${t})</li>`).join('')}</ul>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="card wtile rv" style="--i:${i}"><span class="w-ico">${[icon.globe, icon.star, icon.swap][i]}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="tag">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <div class="tiles">${C.features.items.map(([t, d], i) => `<article class="card tile rv" style="--i:${i}">
      <div class="vg vg-${i}" aria-hidden="true">${VIG[i]}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>

    <div class="picker rv">
      <h3 class="h3">${C.orders.title}</h3>
      <div class="seg pick-tabs" role="tablist" aria-label="${C.orders.cols[0]}">${C.orders.rows.map(([t], i) => `<button type="button" role="tab" id="ot-${i}" aria-controls="ot-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t}</button>`).join('')}</div>
      <div class="pick-panel" id="ot-panel" role="tabpanel" aria-labelledby="ot-0" data-mode="market">
        ${ticket}
        <dl><div><dt>${C.orders.cols[1]}</dt><dd id="ot-do">${C.orders.rows[0][1]}</dd></div><div><dt>${C.orders.cols[2]}</dt><dd id="ot-best">${C.orders.rows[0][2]}</dd></div></dl>
      </div>
    </div>

    <div class="supports">
      <h3 class="h3 rv">${C.supports.title}</h3>
      <dl>${C.supports.items.map(([t, d], i) => `<div class="card rv" style="--i:${i}"><dt><span class="num">0${i + 1}</span>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>
  </div>
</section>

<section class="sec how" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2></div>
    <ol class="track rv">${C.steps.items.map(([t, d], i) => `<li style="--i:${i}"><span class="t-n num">0${i + 1}</span><span class="t-ico">${STEP_ICONS[i]}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    <p class="how-cta center"><a class="btn btn-primary" href="#lead">${C.steps.cta}${icon.go}</a></p>
    <div class="who">
      <h3 class="h3 rv">${C.who.title}</h3>
      <dl>${C.who.items.map(([t, d], i) => `<div class="card rv" style="--i:${i}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>
    <div class="routes">${C.routes.map((r, k) => `<article class="route route-${k} rv">
      <p class="route-head"><b>${r.title}</b><span>${r.tag}</span></p>
      <ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="route-note">${r.note}</p></article>`).join('')}</div>
  </div>
</section>

<section class="sec popular" id="popular">
  <div class="vw">
    <div class="head rv"><h2>${C.sectors.title.replace('US stocks', 'US&nbsp;stocks')}</h2><p class="mkt"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p></div>
    <div class="seg chips" role="tablist" aria-label="Sectors">${Object.keys(C.sectors.list).map((s, i) => `<button type="button" role="tab" id="sx-${i}" aria-controls="sx-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${s}</button>`).join('')}</div>
    <div id="sx-panel" role="tabpanel" aria-labelledby="sx-0">
      <p class="board-head" aria-hidden="true"><span>${C.sectors.cols[0]}</span><span></span><span>${C.sectors.cols[2]}</span><span>${C.sectors.cols[3]}</span><span></span></p>
      <ol class="board" id="board"></ol>
    </div>
    <div class="pop-foot"><a class="btn btn-ghost" href="#lead">${C.sectors.cta}${icon.go}</a><p class="fine">${C.sectors.note}</p></div>
  </div>
</section>

<section class="sec pricing" id="pricing">
  <div class="vw">
    <div class="head rv"><h2>${C.whyUs.title}</h2></div>
    <ul class="stickers">${C.whyUs.items.map((t, i) => `<li class="rv" style="--i:${i}">${icon.check}${t}</li>`).join('')}</ul>
    <h3 class="h3 rv">${C.charges.title}</h3>
    <div class="charges">${C.charges.items.map((c, i) => `<article class="charge${c.hot ? ' is-hot' : ''} rv" style="--i:${i}">
      ${c.tag ? `<span class="charge-tag">${c.tag}</span>` : ''}<p class="charge-k">${c.label}</p><p class="charge-v num">${c.fig.replace(/USD /g, '<small>USD</small> ').replace('*', '<sup>*</sup>')}</p><p class="charge-n">${c.note}</p>
      <a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`).join('')}</div>
    <p class="fine center">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head rv"><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div>
    <ol class="tax-list">${C.tax.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><span class="tax-n num">0${i + 1}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></li>`).join('')}</ol>
    <p class="center"><a class="btn btn-ghost" href="#tax-guide">${C.tax.cta}</a></p>
  </div>
</section>

<section class="sec faq" id="faq">
  <div class="vw faq-in"><h2 class="rv">${C.faq.title}</h2>${faqList()}</div>
</section>

<section class="sec closing" id="start">
  <div class="vw close-in">
    <h2 class="rv">${C.closing.title}</h2>
    <p class="lead">${C.closing.sub}</p>
    ${leadForm('lead-2', C.closing.cta)}
    <ul class="benefits">${C.closing.benefits.map((b) => `<li>${icon.check}${b}</li>`).join('')}</ul>
    ${trust}
    <a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a>
    <p class="fine">${C.closing.fine}</p>
  </div>
</section>
</main>
${footer()}`;

boot('v3', html);

// Roving-tabindex tabs (order types, sectors): one helper, arrow keys + click.
function tabs(sel, onShow) {
  const list = $$(`${sel} [role="tab"]`);
  const show = (i, focus) => {
    list.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    $(`#${list[i].getAttribute('aria-controls')}`).setAttribute('aria-labelledby', list[i].id);
    onShow(i);
    if (focus) list[i].focus();
  };
  list.forEach((t, i) => t.addEventListener('click', () => show(i)));
  $(sel).addEventListener('keydown', (e) => {
    const i = list.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (n !== undefined) { e.preventDefault(); show((n + list.length) % list.length, true); }
  });
  show(0);
}

const doEl = $('#ot-do'), bestEl = $('#ot-best'), panel = $('#ot-panel'), tkType = $('#tk-type');
tabs('.pick-tabs', (i) => {
  doEl.textContent = C.orders.rows[i][1]; bestEl.textContent = C.orders.rows[i][2]; tkType.textContent = C.orders.rows[i][0];
  panel.dataset.mode = ['market', 'limit', 'stop', 'frac'][i];
  panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
  track('order_type_tab', { type: C.orders.rows[i][0] });
});

const names = Object.keys(C.sectors.list);
tabs('.chips', (i) => {
  $('#board').innerHTML = C.sectors.list[names[i]].map(([n, t, l], k) => `<li style="--i:${k}"><a href="#lead" aria-label="Invest in ${esc(n)} (${t})">
    <span class="bd-rank num">${k + 1}</span><span class="bd-logo">${logo(l, t)}</span><span class="bd-name"><b>${esc(n)}</b><small>${t}</small></span>
    <span class="bd-chart">${sparkFor(t, 160, 36, { baseline: true })}</span>
    <span class="bd-px num">${usd.format(quote(t).px)}</span>${qPill(t)}<span class="bd-go">Invest${icon.go}</span></a></li>`).join('');
});
