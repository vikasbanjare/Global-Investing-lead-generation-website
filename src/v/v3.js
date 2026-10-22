// v3 · Bold orange brand: orange and ink blocks, chunky condensed type, playful cards, sticky stacking steps.
import './base.css';
import './v3.css';
import { C, boot, header, footer, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, REF_PRICES } from './kit.js';

const fan = [['apple', 'Apple', 'AAPL'], ['nvidia', 'NVIDIA', 'NVDA'], ['tesla', 'Tesla', 'TSLA']];
const qPill = (t) => { const q = quote(t); return `<span class="qpill ${q.ch >= 0 ? 'is-up' : 'is-down'} num">${pct(q.ch)}</span>`; };
const STEP_ICONS = [icon.user, icon.shield, icon.wallet, icon.chart];

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-copy">
      <p class="tag">${C.hero.eyebrow}</p>
      <h1><span>${C.hero.h1}</span> ${C.hero.h1b}</h1>
      <p class="lead">${C.hero.lead}</p>
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
    </div>
    <div class="fan" aria-hidden="true">${fan.map(([l, n, t], i) => `<div class="fcard" style="--k:${i - 1}">
      <p class="fcard-top"><span class="fcard-logo">${logo(l)}</span><b>${n}</b><small>${t}</small></p>
      <p class="fcard-big num">$1</p>
      <p class="fcard-sub">buys <b class="num">${(1 / REF_PRICES[t]).toFixed(4)}</b> shares</p>
      <p class="fcard-px"><span class="num">${usd.format(REF_PRICES[t])}</span>${qPill(t)}</p>
    </div>`).join('')}</div>
  </div>
</section>

<section class="hl-band" aria-label="Key investment highlights">
  <ul class="vw hl">${C.highlights.map((h, i) => `<li class="rv" style="--i:${i}"><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>
</section>

<section class="sec brands" id="brands">
  <div class="vw head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
  <div class="marquee" aria-hidden="true"><div class="mq-track loop">${[0, 1].map(() => `<ul>${C.brands.list.map(([n, t, l]) => `<li>${logo(l)}<b>${n}</b><span>${t}</span></li>`).join('')}</ul>`).join('')}</div></div>
  <ul class="sr-only">${C.brands.list.map(([n, t]) => `<li>${n} (${t})</li>`).join('')}</ul>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="tag tag-ink">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <div class="tiles">${C.features.items.map(([t, d], i) => `<article class="tile tile-${i} rv" style="--i:${i}">
      <span class="glyph" aria-hidden="true">${['$1', icon.search, icon.chart, '₹→$'][i]}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>

    <div class="picker rv">
      <h3 class="h3">${C.orders.title}</h3>
      <div class="pick-tabs" role="tablist" aria-label="${C.orders.cols[0]}">${C.orders.rows.map(([t], i) => `<button type="button" role="tab" id="ot-${i}" aria-controls="ot-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t}</button>`).join('')}</div>
      <div class="pick-panel" id="ot-panel" role="tabpanel" aria-labelledby="ot-0">
        <dl><div><dt>${C.orders.cols[1]}</dt><dd id="ot-do">${C.orders.rows[0][1]}</dd></div><div><dt>${C.orders.cols[2]}</dt><dd id="ot-best">${C.orders.rows[0][2]}</dd></div></dl>
      </div>
    </div>

    <div class="supports">
      <h3 class="h3 rv">${C.supports.title}</h3>
      <dl>${C.supports.items.map(([t, d], i) => `<div class="rv" style="--i:${i}"><dt><span class="num">0${i + 1}</span>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>
  </div>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="wtile wtile-${i} rv" style="--i:${i}"><span class="w-ico">${[icon.globe, icon.star, icon.swap][i]}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec how" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2><a class="btn btn-ink" href="#lead">${C.steps.cta}</a></div>
    <ol class="track rv">${C.steps.items.map(([t, d], i) => `<li style="--i:${i}"><span class="t-n num">0${i + 1}</span><span class="t-ico">${STEP_ICONS[i]}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    <div class="who">
      <h3 class="h3 rv">${C.who.title}</h3>
      <dl>${C.who.items.map(([t, d], i) => `<div class="rv" style="--i:${i}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>
    <div class="routes">${C.routes.map((r, k) => `<article class="route route-${k} rv">
      <p class="route-head"><b>${r.title}</b><span>${r.tag}</span></p>
      <ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="route-note">${r.note}</p></article>`).join('')}</div>
  </div>
</section>

<section class="sec popular" id="popular">
  <div class="vw">
    <div class="head rv"><h2>${C.sectors.title}</h2><p class="mkt"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p></div>
    <div class="chips" role="tablist" aria-label="Sectors">${Object.keys(C.sectors.list).map((s, i) => `<button type="button" role="tab" id="sx-${i}" aria-controls="sx-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${s}</button>`).join('')}</div>
    <div id="sx-panel" role="tabpanel" aria-labelledby="sx-0">
      <p class="board-head" aria-hidden="true"><span>${C.sectors.cols[0]}</span><span>${C.sectors.cols[2]}</span><span>${C.sectors.cols[3]}</span><span></span></p>
      <ol class="board" id="board"></ol>
    </div>
    <div class="pop-foot"><a class="btn btn-ink" href="#lead">${C.sectors.cta}${icon.go}</a><p class="fine">${C.sectors.note}</p></div>
  </div>
</section>

<section class="sec pricing" id="pricing">
  <div class="vw">
    <div class="head rv"><h2>${C.whyUs.title}</h2></div>
    <ul class="stickers">${C.whyUs.items.map((t, i) => `<li class="rv" style="--i:${i}">${icon.check}${t}</li>`).join('')}</ul>
    <h3 class="h3 rv">${C.charges.title}</h3>
    <div class="charges">${C.charges.items.map((c, i) => `<article class="charge${c.hot ? ' is-hot' : ''} rv" style="--i:${i}">
      ${c.tag ? `<span class="charge-tag">${c.tag}</span>` : ''}<p class="charge-k">${c.label}</p><p class="charge-v num">${c.fig.replace('*', '<sup>*</sup>')}</p><p class="charge-n">${c.note}</p>
      <a class="btn ${c.hot ? 'btn-ink' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`).join('')}</div>
    <p class="fine center">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head rv"><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div>
    <ol class="tax-list">${C.tax.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><span class="tax-n num">0${i + 1}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></li>`).join('')}</ol>
    <p class="center"><a class="btn btn-ink" href="#tax-guide">${C.tax.cta}</a></p>
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

const doEl = $('#ot-do'), bestEl = $('#ot-best'), panel = $('#ot-panel');
tabs('.pick-tabs', (i) => {
  doEl.textContent = C.orders.rows[i][1]; bestEl.textContent = C.orders.rows[i][2];
  panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
  track('order_type_tab', { type: C.orders.rows[i][0] });
});

const names = Object.keys(C.sectors.list);
tabs('.chips', (i) => {
  $('#board').innerHTML = C.sectors.list[names[i]].map(([n, t, l], k) => `<li style="--i:${k}"><a href="#lead" aria-label="Invest in ${esc(n)} (${t})">
    <span class="bd-rank num">${k + 1}</span><span class="bd-logo">${logo(l, t)}</span><span class="bd-name"><b>${esc(n)}</b><small>${t}</small></span>
    <span class="bd-px num">${usd.format(quote(t).px)}</span>${qPill(t)}<span class="bd-go">Invest${icon.go}</span></a></li>`).join('');
});
