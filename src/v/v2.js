// v2 · Light editorial: airy white pages, an app phone in the hero, brand price cards, live feature cards.
import './base.css';
import './v2.css';
import { C, boot, header, footer, leadForm, faqList, orderTable, logo, icon, quote, pct, usd, esc, $, $$, track, REF_PRICES } from './kit.js';

// A small deterministic sparkline per ticker (decoration for the illustrative quotes).
function spark(t, w = 96, h = 32) {
  let s = 0; for (const c of t) s = (s * 33 + c.charCodeAt(0)) % 9973;
  // a random walk that drifts toward the day's direction
  const up = quote(t).ch >= 0, n = 28;
  let y = up ? 0.7 : 0.3;
  const pts = Array.from({ length: n }, (_, i) => {
    s = (s * 7919 + 13) % 9973;
    if (i) y = Math.min(0.92, Math.max(0.08, y + ((s / 9973) - 0.5) * 0.22 + (up ? -0.02 : 0.02)));
    return [i * (w / (n - 1)), y * h];
  });
  return `<svg class="spark ${quote(t).ch >= 0 ? 'up' : 'down'}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}"/></svg>`;
}
const priceCell = (t) => { const q = quote(t); return `<b class="num">${usd.format(q.px)}</b><span class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span>`; };

const AMOUNTS = [1, 10, 50, 100];
const share = (amt) => (amt / REF_PRICES.AAPL).toFixed(4);

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-copy">
      <p class="pill"><span class="pill-dot"></span>${C.hero.eyebrow}</p>
      <h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1>
      <p class="lead">${C.hero.lead.replace('$1', '<b>$1</b>')}</p>
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="phone loop">
        <div class="phone-top"><span data-bind="ist">—</span><i></i></div>
        <div class="app">
          <p class="app-tab"><b>US stocks</b><span>Portfolio</span></p>
          <div class="app-quote">
            <span class="app-logo">${logo('apple')}</span>
            <div><b>Apple Inc.</b><small>AAPL · Nasdaq</small></div>
            <div class="app-px">${priceCell('AAPL')}</div>
          </div>
          ${spark('AAPL', 260, 90).replace('class="spark', 'class="spark spark-lg')}
          <div class="ticket">
            <p class="ticket-k">Buy by amount</p>
            <p class="ticket-v num">$1.00</p>
            <p class="ticket-k">You get <b class="num">${share(1)}</b> shares</p>
            <span class="btn btn-primary btn-sm">Buy</span>
          </div>
          <ul class="app-list">${[['nvidia', 'NVDA'], ['microsoft', 'MSFT'], ['tesla', 'TSLA']].map(([l, t]) => `<li>${logo(l)}<b>${t}</b>${spark(t, 54, 18)}${priceCell(t)}</li>`).join('')}</ul>
        </div>
      </div>
      <p class="chip chip-a loop"><span class="chip-ico">₹→$</span>${C.features.items[3][0]}</p>
      <p class="chip chip-b loop">${icon.shield}${C.highlights[3].note}</p>
    </div>
  </div>
  <div class="vw"><ul class="hl" aria-label="Key investment highlights">${C.highlights.map((h, i) => `<li class="rv" style="--i:${i}"><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul></div>
</section>

<section class="sec brands" id="brands">
  <div class="vw">
    <div class="head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
    <ul class="brand-grid">${C.brands.list.map(([n, t, l], i) => `<li class="rv" style="--i:${i % 4}"><a href="#lead" aria-label="Invest in ${n} (${t})">
      <span class="b-logo">${logo(l)}</span><span class="b-name"><b>${n}</b><small>${t}</small></span><span class="b-px">${priceCell(t)}</span>
    </a></li>`).join('')}</ul>
  </div>
</section>

<section class="sec product" id="product">
  <div class="vw">
    <div class="head rv"><p class="eyebrow">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
    <div class="bento">
      <article class="card f-frac rv">
        <div class="f-text"><h3>${C.features.items[0][0]}</h3><p>${C.features.items[0][1]}</p></div>
        <div class="frac" role="group" aria-label="Try an amount">
          <div class="frac-amts">${AMOUNTS.map((a, i) => `<button type="button" data-amt="${a}" aria-pressed="${i === 0}">$${a}</button>`).join('')}</div>
          <p class="frac-out"><b class="num" id="frac-n">${share(1)}</b> of 1 Apple share <span class="num">· ${usd.format(REF_PRICES.AAPL)} a share</span></p>
          <div class="frac-bar"><i id="frac-fill" style="--f:${1 / REF_PRICES.AAPL}"></i></div>
        </div>
      </article>
      <article class="card f-find rv" style="--i:1">
        <div class="f-text"><h3>${C.features.items[1][0]}</h3><p>${C.features.items[1][1]}</p></div>
        <div class="find" aria-hidden="true">
          <p class="find-box">${icon.search}<span class="find-typed loop">AI and semiconductors</span></p>
          <p class="find-chips">${Object.keys(C.sectors.list).slice(0, 5).map((s) => `<span>${s}</span>`).join('')}</p>
        </div>
      </article>
      <article class="card f-hold rv" style="--i:2">
        <div class="f-text"><h3>${C.features.items[2][0]}</h3><p>${C.features.items[2][1]}</p></div>
        <ul class="hold" aria-hidden="true">${[['apple', 'AAPL'], ['nvidia', 'NVDA'], ['amazon', 'AMZN']].map(([l, t]) => `<li>${logo(l)}<b>${t}</b>${spark(t, 64, 22)}${priceCell(t)}</li>`).join('')}</ul>
      </article>
      <article class="card f-fx rv" style="--i:3">
        <div class="f-text"><h3>${C.features.items[3][0]}</h3><p>${C.features.items[3][1]}</p></div>
        <div class="fx" aria-hidden="true"><span class="fx-c">₹ INR</span><span class="fx-line"><i class="loop"></i></span><span class="fx-c fx-usd">$ USD</span></div>
      </article>
    </div>
    <div class="orders rv">
      <h3 class="h3">${C.orders.title}</h3>
      <div class="card otable-card">${orderTable()}</div>
    </div>
    <div class="supports">
      <h3 class="h3 rv">${C.supports.title}</h3>
      <dl class="sup-grid">${C.supports.items.map(([t, d], i) => `<div class="card rv" style="--i:${i}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>
  </div>
</section>

<section class="sec why" id="why">
  <div class="vw">
    <div class="head rv"><h2>${C.why.title}</h2></div>
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="card rv" style="--i:${i}"><span class="why-ico">${[icon.globe, icon.star, icon.swap][i]}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec how" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2><a class="btn btn-ink" href="#lead">${C.steps.cta}</a></div>
    <ol class="steps">${C.steps.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><span class="step-n">${i + 1}</span><span class="step-ico">${[icon.user, icon.shield, icon.wallet, icon.chart][i]}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    <div class="who card rv"><h3>${C.who.title}</h3><dl>${C.who.items.map(([t, d]) => `<div><dt>${icon.check}${t}</dt><dd>${d}</dd></div>`).join('')}</dl></div>
    <div class="routes">${C.routes.map((r, k) => `<article class="card route rv" style="--i:${k}">
      <p class="route-head"><b>${r.title}</b><span>${r.tag}</span></p>
      <ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="route-note">${r.note}</p></article>`).join('')}</div>
  </div>
</section>

<section class="sec popular" id="popular">
  <div class="vw">
    <div class="head head-row rv"><h2>${C.sectors.title}</h2><p class="mkt"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p></div>
    <div class="seg" role="tablist" aria-label="Sectors">${Object.keys(C.sectors.list).map((s, i) => `<button type="button" role="tab" id="seg-${i}" aria-controls="sec-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${s}</button>`).join('')}</div>
    <div id="sec-panel" role="tabpanel" aria-labelledby="seg-0"><ul class="stock-cards" id="stock-cards"></ul></div>
    <div class="pop-foot"><a class="tlink" href="#lead">${C.sectors.cta}${icon.go}</a><p class="fine">${C.sectors.note}</p></div>
  </div>
</section>

<section class="sec pricing" id="pricing">
  <div class="vw">
    <div class="head rv"><h2>${C.whyUs.title}</h2></div>
    <ul class="whyus">${C.whyUs.items.map((t, i) => `<li class="rv" style="--i:${i}">${icon.check}<span>${t}</span></li>`).join('')}</ul>
    <h3 class="h3 charges-title rv">${C.charges.title}</h3>
    <div class="charges">${C.charges.items.map((c, i) => `<article class="card charge${c.hot ? ' is-hot' : ''} rv" style="--i:${i}">${c.tag ? `<span class="charge-tag">${c.tag}</span>` : ''}
      <span class="charge-ico">${[icon.chart, icon.user, icon.wallet][i]}</span>
      <p class="charge-k">${c.label}</p><p class="charge-v num">${c.fig.replace('*', '<sup>*</sup>')}</p><p class="charge-n">${c.note}</p>
      <a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`).join('')}</div>
    <p class="fine center">${C.charges.foot}</p>
  </div>
</section>

<section class="sec tax" id="tax">
  <div class="vw">
    <div class="head head-row rv"><div><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div><a class="btn btn-ghost" href="#tax-guide">${icon.doc}${C.tax.cta}</a></div>
    <div class="tax-grid">${C.tax.items.map(([t, d], i) => `<article class="card rv" style="--i:${i}"><span class="tax-n num">0${i + 1}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec faq" id="faq">
  <div class="vw faq-in"><h2 class="rv">${C.faq.title}</h2>${faqList()}</div>
</section>

<section class="sec closing" id="start">
  <div class="vw">
    <div class="close-card rv">
      <div>
        <h2>${C.closing.title}</h2>
        <p class="lead">${C.closing.sub}</p>
        ${leadForm('lead-2', C.closing.cta)}
        <ul class="benefits">${C.closing.benefits.map((b) => `<li>${icon.check}${b}</li>`).join('')}</ul>
        <a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a>
        <p class="fine">${C.closing.fine}</p>
      </div>
      <ul class="orbit" aria-hidden="true">${C.brands.list.map(([, , l], i) => `<li class="loop" style="--i:${i}">${logo(l)}</li>`).join('')}</ul>
    </div>
  </div>
</section>
</main>
${footer()}`;

boot('v2', html);

// fractional amount chips
const fracN = $('#frac-n'), fill = $('#frac-fill');
$$('[data-amt]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-amt]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const a = Number(b.dataset.amt);
  fracN.textContent = share(a);
  fill.style.setProperty('--f', a / REF_PRICES.AAPL);
  track('fraction_amount', { amount: a });
}));

// sector tabs → five stock cards
const names = Object.keys(C.sectors.list);
const tabs = $$('.seg [role="tab"]');
function showSector(i, focus) {
  tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
  $('#sec-panel').setAttribute('aria-labelledby', tabs[i].id);
  $('#stock-cards').innerHTML = C.sectors.list[names[i]].map(([n, t, l], k) => `<li style="--i:${k}"><a href="#lead" aria-label="Invest in ${esc(n)} (${t})">
    <span class="sc-top"><span class="b-logo">${logo(l, t)}</span><span class="b-name"><b>${esc(n)}</b><small>${t}</small></span></span>
    ${spark(t, 120, 36)}
    <span class="sc-bot">${priceCell(t)}</span><span class="sc-go">Invest${icon.go}</span></a></li>`).join('');
  if (focus) tabs[i].focus();
}
tabs.forEach((t, i) => t.addEventListener('click', () => { showSector(i); track('sector_tab', { sector: names[i] }); }));
$('.seg').addEventListener('keydown', (e) => {
  const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: names.length - 1 }[e.key];
  if (n === undefined) return;
  e.preventDefault(); showSector((n + names.length) % names.length, true);
});
showSector(0);
