// v2 · Light editorial: airy white pages, an app phone in the hero, brand price cards, live feature cards.
import './base.css';
import './v2.css';
import { C, boot, header, footer, leadForm, faqList, orderTable, logo, icon, quote, pct, usd, esc, $, $$, track, REF_PRICES, sparkFor, chartSVG } from './kit.js';

// Sparklines and the portfolio chart come from kit.js (smooth, start at the previous close, end at the quote's 1D %).
const spark = (t, w = 96, h = 32) => sparkFor(t, w, h, { cls: 'spark', dot: w >= 90, baseline: w >= 60 });
const priceCell = (t) => { const q = quote(t); return `<b class="num">${usd.format(q.px)}</b><span class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</span>`; };

const keep = (s) => s.replace(/ (?=\S+$)/, '&nbsp;'); // no lone last word, even without text-wrap: balance
const noHyphenBreak = (s) => s.replace(/\S+-\S+/g, (w) => `<span class="nw">${w}</span>`); // 'Nasdaq-100', 'Coca-Cola' never split at the hyphen
const HOME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4Z"/></svg>';
// Why-cards: a small real-data visual each (logos, a 1D sparkline, the currency pair) instead of an icon tile.
const WHY_VIZ = [
  `<span class="why-viz viz-stack" aria-hidden="true">${['apple', 'microsoft', 'google', 'amazon', 'nvidia'].map((l) => `<i>${logo(l)}</i>`).join('')}</span>`,
  `<span class="why-viz viz-tk" aria-hidden="true"><span class="b-logo">${logo('google')}</span><span class="b-name"><b>GOOGL</b><small>Alphabet</small></span>${sparkFor('GOOGL', 96, 32, { cls: 'spark' })}</span>`,
  `<span class="why-viz viz-fx" aria-hidden="true"><b>₹</b>${icon.swap}<b>$</b></span>`,
];

const AMOUNTS = [1, 10, 50, 100];
const share = (amt) => (amt / REF_PRICES.AAPL).toFixed(4);

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="vw hero-in">
    <div class="hero-copy">
      <p class="pill"><span class="pill-dot"></span>${C.hero.eyebrow}</p>
      <h1>${C.hero.h1} <span>${keep(C.hero.h1b)}</span></h1>
      <p class="lead">${C.hero.lead.replace('$1', '<b>$1</b>')}</p>
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="stage3d" id="stage3d">
        <div class="phone">
          <span class="ph-btn ph-btn-a"></span><span class="ph-btn ph-btn-b"></span><span class="ph-btn ph-btn-c"></span>
          <div class="screen">
            <div class="sb"><span data-bind="ist">—</span><i class="island"></i><span class="sb-ico"><svg viewBox="0 0 18 10"><path d="M1 9h2V6H1zM5 9h2V4H5zM9 9h2V2H9zM13 9h2V0h-2z"/></svg><svg viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="3"/><rect x="2.5" y="2.5" width="14" height="6" rx="1.5"/><path d="M22 4v3"/></svg></span></div>
            <div class="app-head"><p><small>Good evening</small><b>Your US portfolio</b></p><span class="avatar">IN</span></div>
            <div class="pcard">
              <p class="pc-k">Portfolio value</p>
              <p class="pc-v num">$1,248.60</p>
              <p class="pc-ch"><span class="num">▲ $29.40 (2.41%)</span> today</p>
              ${chartSVG('portfolio', 2.41, 260, 58, { cls: 'pc-chart', tone: 'brand', baseline: false })}
            </div>
            <div class="seg2"><span class="on">Stocks</span><span>ETFs</span><span>Orders</span></div>
            <ul class="hold2">${[['google', 'Alphabet', 'GOOGL'], ['netflix', 'Netflix', 'NFLX'], ['microsoft', 'Microsoft', 'MSFT']].map(([l, n, t]) => `<li><span class="h2-logo">${logo(l)}</span><span class="h2-name"><b>${n}</b><small>${t}</small></span>${spark(t, 44, 20)}<span class="h2-px">${priceCell(t)}</span></li>`).join('')}</ul>
            <p class="buy1"><span>Buy <b>$1</b> of Apple</span><i>→ ${share(1)} sh</i></p>
            <div class="tabbar"><i class="on">${HOME}</i><i>${icon.search}</i><i>${icon.wallet}</i><i>${icon.user}</i></div>
          </div>
          <span class="glare"></span>
        </div>
        <div class="float fl-fill"><span class="f-ok">${icon.check}</span><p><b>Order filled</b><small class="num">${share(1)} AAPL for $1.00</small></p></div>
        <div class="float fl-fx"><span class="f-ico">₹→$</span><p><b>USD buying power</b><small>After conversion and credit</small></p></div>
        <div class="float fl-gift"><span class="f-shield">${icon.shield}</span><p><b>GIFT City route</b><small>${C.highlights[3].note}</small></p></div>
      </div>
      <p class="art-note">Illustrative screen</p>
    </div>
    <ul class="hl" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul>
  </div>
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
          <p class="frac-out"><b class="num" id="frac-n">${share(1)}</b> of 1 Apple share</p>
          <div class="frac-bar"><i id="frac-fill" style="--f:${1 / REF_PRICES.AAPL}"></i></div>
          <p class="frac-scale" aria-hidden="true"><span>$0</span><span>1 share = ${usd.format(REF_PRICES.AAPL)}</span></p>
        </div>
      </article>
      <article class="card f-find rv" style="--i:1">
        <div class="f-text"><h3>${C.features.items[1][0]}</h3><p>${C.features.items[1][1]}</p></div>
        <div class="find" aria-hidden="true">
          <p class="find-box">${icon.search}<span class="find-typed loop">AI and semiconductors</span></p>
          <p class="find-chips">${Object.keys(C.sectors.list).slice(0, 3).map((s) => `<span>${s}</span>`).join('')}</p>
          <p class="find-hit"><span class="b-logo">${logo('nvidia')}</span><span class="b-name"><b>NVIDIA</b><small>NVDA</small></span>${spark('NVDA', 72, 24)}<span class="h-px">${priceCell('NVDA')}</span></p>
        </div>
      </article>
      <article class="card f-hold rv" style="--i:2">
        <div class="f-text"><h3>${C.features.items[2][0]}</h3><p>${C.features.items[2][1]}</p></div>
        <ul class="hold" aria-hidden="true">${[['google', 'GOOGL'], ['microsoft', 'MSFT'], ['amazon', 'AMZN']].map(([l, t]) => `<li><span class="b-logo">${logo(l)}</span><b>${t}</b>${spark(t, 160, 28)}<span class="h-px">${priceCell(t)}</span></li>`).join('')}</ul>
      </article>
      <article class="card f-usd rv" style="--i:3">
        <div class="f-text"><h3>${C.features.items[3][0]}</h3><p>${C.features.items[3][1]}</p></div>
        <div class="fx" aria-hidden="true"><span class="fx-end"><span class="fx-c">₹<span class="fx-cur">&nbsp;INR</span></span><small>Your bank</small></span><span class="fx-line"><i class="loop"></i></span><span class="fx-node">${icon.shield}<small>GIFT City</small></span><span class="fx-line"><i class="loop"></i></span><span class="fx-end"><span class="fx-c fx-usd">$<span class="fx-cur">&nbsp;USD</span></span><small>Buying power</small></span></div>
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
    <div class="why-grid">${C.why.items.map(([t, d], i) => `<article class="card rv" style="--i:${i}">${WHY_VIZ[i]}<h3>${keep(t)}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec how" id="how">
  <div class="vw">
    <div class="head rv"><h2>${C.steps.title}</h2></div>
    <ol class="steps">${C.steps.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><span class="step-ico">${[icon.user, icon.shield, icon.wallet, icon.chart][i]}<span class="step-n">${i + 1}</span></span><h3>${keep(t)}</h3><p>${d}</p></li>`).join('')}</ol>
    <p class="steps-cta rv"><a class="btn btn-primary" href="#lead">${C.steps.cta}</a></p>
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
      <p class="charge-k">${c.label}</p><p class="charge-v num">${c.fig.replace('*', '<sup>*</sup>')}</p><p class="charge-n">${c.note.replace(' · ', '&nbsp;· ')}</p>
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

// Hero: the phone and its floating cards tilt toward the pointer (depth from translateZ in CSS).
const st = $('#stage3d'), art = $('.hero-art');
if (st && matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const step = () => { cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12; st.style.setProperty('--rx', `${(-cy * 8).toFixed(2)}deg`); st.style.setProperty('--ry', `${(cx * 12).toFixed(2)}deg`); raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(step) : 0; };
  art.addEventListener('pointermove', (e) => { const r = art.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; if (!raf) raf = requestAnimationFrame(step); });
  art.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
}

// fractional amount chips
const fracN = $('#frac-n'), fill = $('#frac-fill');
$$('[data-amt]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-amt]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const a = Number(b.dataset.amt);
  fracN.textContent = share(a);
  fill.style.setProperty('--f', a / REF_PRICES.AAPL);
  track('fraction_amount', { amount: a });
}));

// FAQ: the first answer starts open
$('.faq-q')?.setAttribute('aria-expanded', 'true');
$('#faq-0')?.classList.add('is-open');

// sector tabs → five stock cards
const names = Object.keys(C.sectors.list);
const tabs = $$('.seg [role="tab"]');
function showSector(i, focus) {
  tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
  $('#sec-panel').setAttribute('aria-labelledby', tabs[i].id);
  $('#stock-cards').innerHTML = C.sectors.list[names[i]].map(([n, t, l], k) => `<li style="--i:${k}"><a href="#lead" aria-label="Invest in ${esc(n)} (${t})">
    <span class="sc-top"><span class="b-logo">${l ? logo(l) : `<span class="logo-mono" aria-hidden="true">${t}</span>`}</span><span class="b-name"><b>${noHyphenBreak(esc(n))}</b><small>${t}</small></span></span>
    ${spark(t, 120, 36)}
    <span class="sc-bot">${priceCell(t)}</span></a></li>`).join('');
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
