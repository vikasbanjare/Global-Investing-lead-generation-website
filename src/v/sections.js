// Shared, visual-first sections for the reference-inspired options (/v6/–/v9/): big rounded gradient panels, UI renders
// inside cards, bento layouts, app-screen sequences. Same reviewed copy everywhere; each option themes it in CSS
// (--panel, --panel-2, --glow, --heading …) and brings its own hero.
import { C, leadForm, faqList, logo, icon, quote, pct, usd, esc, $, $$, track, REF_PRICES } from './kit.js';

const qCell = (t) => { const q = quote(t); return `<span class="q"><b class="num">${usd.format(q.px)}</b><em class="num ${q.ch >= 0 ? 'up' : 'down'}">${pct(q.ch)}</em></span>`; };
const share = (t, amt = 1) => (amt / REF_PRICES[t]).toFixed(4);
function walk(w, h, seed, drift = -0.02) {
  let y = h * 0.7, s = seed; const pts = [];
  for (let i = 0; i <= 26; i++) { s = (s * 7919 + 13) % 9973; y = Math.max(6, Math.min(h - 4, y + h * drift + ((s / 9973) - 0.5) * h * 0.18)); pts.push([(i / 26) * w, y]); }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return { line: d, area: `${d} L${w} ${h} L0 ${h} Z` };
}
const chart = (w = 240, h = 70, seed = 41) => { const a = walk(w, h, seed); return `<svg class="mini-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path class="ar" d="${a.area}"/><path class="ln" d="${a.line}"/></svg>`; };

// ---------- hero bits
export const heroCopy = () => `<p class="eyebrow">${C.hero.eyebrow}</p>
  <h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1>
  <p class="lead">${C.hero.lead}</p>
  <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
  <p class="form-title" id="form-title">${C.hero.formTitle}</p>
  ${leadForm('lead', C.hero.cta, 'form-title')}
  <a class="tlink hero-how" href="#how">${C.hero.how}${icon.go}</a>`;

export const highlights = (cls = '') => `<section class="s-hl ${cls}" aria-label="Key investment highlights"><ul class="vw hl-grid">${C.highlights.map((h, i) => `<li class="rv" style="--i:${i}"><b>${h.fig}</b><span>${h.label}</span><small>${h.note}</small></li>`).join('')}</ul></section>`;

// ---------- phone + screens (decorative)
export const screens = {
  dashboard: () => `<div class="app-top"><small>Good evening</small><b>US portfolio</b></div>
    <div class="app-card"><small>Portfolio value</small><b class="num">$1,248.60</b><em class="num">▲ 2.41% today</em>${chart(240, 60, 41)}</div>
    <ul class="app-list">${[['apple', 'AAPL'], ['nvidia', 'NVDA'], ['microsoft', 'MSFT']].map(([l, t]) => `<li><span class="al-logo">${logo(l)}</span><b>${t}</b>${qCell(t)}</li>`).join('')}</ul>`,
  buy: () => `<div class="app-top"><small>Buy by amount</small><b>Apple Inc. · AAPL</b></div>
    <div class="app-amt"><b class="num">$1.00</b><small>≈ <span class="num">${share('AAPL')}</span> shares</small></div>
    <div class="app-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => `<i>${k}</i>`).join('')}</div>
    <p class="app-cta">Review order</p>`,
  activity: () => `<div class="app-top"><small>Activity</small><b>Orders</b></div>
    <ul class="app-list">${[['apple', 'AAPL', 'Bought $1.00'], ['nvidia', 'NVDA', 'Bought $25.00'], ['tesla', 'TSLA', 'Limit $310.00']].map(([l, t, s]) => `<li><span class="al-logo">${logo(l)}</span><b>${t}<small>${s}</small></b><span class="al-ok">Filled</span></li>`).join('')}</ul>
    <div class="app-card app-card-alt"><small>USD buying power</small><b class="num">$297.62</b><em>After conversion and credit</em></div>`,
  open: () => `<div class="app-top"><small>Step 1</small><b>Open your account</b></div>
    <div class="ui-field"><small>Mobile</small><span>+91 98•••• ••10</span></div><div class="ui-field"><small>PAN</small><span>ABCDE••••F</span></div><div class="ui-field"><small>Email</small><span>you@email.com</span></div><p class="app-cta">Continue</p>`,
  verify: () => `<div class="app-top"><small>Step 2</small><b>Get verified</b></div>
    <div class="ui-badge">${icon.shield}</div><ul class="ui-checks"><li>PAN ✓</li><li>Identity ✓</li><li>Address ✓</li></ul><p class="ui-note">Awaiting account approval</p>`,
  fund: () => `<div class="app-top"><small>Step 3</small><b>Add USD buying power</b></div>
    <div class="ui-fx"><div><small>You send</small><b class="num">₹25,000</b></div><i>↓</i><div class="hot"><small>Buying power</small><b class="num">$297.62</b></div></div><p class="ui-note">Illustrative, at ₹84 per dollar</p>`,
  track: () => `<div class="app-top"><small>Step 4</small><b>Find, invest, track</b></div>
    <div class="app-card"><small>Portfolio value</small><b class="num">$312.40</b><em class="num">▲ 1.12% today</em>${chart(240, 54, 77)}</div>
    <ul class="app-list">${[['apple', 'AAPL'], ['nvidia', 'NVDA']].map(([l, t]) => `<li><span class="al-logo">${logo(l)}</span><b>${t}</b>${qCell(t)}</li>`).join('')}</ul>`,
};
export const phone = (screen, cls = '') => `<div class="dphone ${cls}" aria-hidden="true"><div class="dp-screen"><div class="dp-sb"><span data-bind="ist">—</span><i></i><span>●●●</span></div>${screens[screen]()}</div></div>`;

// ---------- brands: an app-icon wall in a gradient panel
export const brands = () => `<section class="sec s-brands" id="brands"><div class="vw">
  <div class="head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
  <div class="panel icon-wall rv">${C.brands.list.map(([n, t, l], i) => `<a class="app-icon" href="#lead" style="--i:${i}" aria-label="Invest in ${n} (${t})"><span class="ai-tile">${logo(l)}</span><b>${n}</b>${qCell(t)}</a>`).join('')}</div>
</div></section>`;

// ---------- product: a bento with live UI inside each card, then order types and support
const ORDER_ART = [
  '<path class="o-ln" d="M10 70 L60 52 L100 60 L150 34 L200 42 L250 18"/><circle class="o-dot" cx="250" cy="18" r="7"/>',
  '<path class="o-lvl" d="M0 58 H260"/><path class="o-ln" d="M10 22 L60 34 L100 46 L140 58 L190 50 L250 30"/><circle class="o-dot" cx="140" cy="58" r="7"/>',
  '<path class="o-lvl" d="M0 30 H260"/><path class="o-ln" d="M10 70 L60 62 L110 50 L150 30 L200 22 L250 14"/><circle class="o-dot" cx="150" cy="30" r="7"/>',
  '<circle cx="130" cy="44" r="34" class="o-pie-bg"/><path class="o-pie" d="M130 44 V10 A34 34 0 0 1 158 63 Z"/>',
];
export const product = () => `<section class="sec s-product" id="product"><div class="vw">
  <div class="head rv"><p class="eyebrow">${C.features.eyebrow}</p><h2>${C.features.title}</h2></div>
  <div class="bento">
    <article class="b-card b-frac panel rv">
      <div class="b-text"><h3>${C.features.items[0][0]}</h3><p>${C.features.items[0][1]}</p></div>
      <div class="frac" role="group" aria-label="Try an amount">
        <div class="frac-pie" aria-hidden="true"><i id="frac-pie"></i><span><b class="num" id="frac-n">${share('AAPL')}</b><small>of 1 Apple share</small></span></div>
        <div class="frac-amts">${[1, 10, 50, 100].map((a, i) => `<button type="button" data-amt="${a}" aria-pressed="${i === 0}">$${a}</button>`).join('')}</div>
        <p class="frac-note">The circle is one whole Apple share (${usd.format(REF_PRICES.AAPL)}, reference price); your amount fills it.</p>
      </div>
    </article>
    <article class="b-card b-find rv" style="--i:1"><div class="b-text"><h3>${C.features.items[1][0]}</h3><p>${C.features.items[1][1]}</p></div>
      <div class="ui-search" aria-hidden="true">${icon.search}<span class="typed loop">AI and semiconductors</span></div>
      <p class="ui-chips" aria-hidden="true">${Object.keys(C.sectors.list).slice(0, 4).map((s, i) => `<span${i ? '' : ' class="on"'}>${s}</span>`).join('')}</p></article>
    <article class="b-card b-hold rv" style="--i:2"><div class="b-text"><h3>${C.features.items[2][0]}</h3><p>${C.features.items[2][1]}</p></div>
      <div class="ui-hold" aria-hidden="true"><p><small>Portfolio value</small><b class="num">$312.40</b></p>${chart(260, 56, 29)}</div></article>
    <article class="b-card b-fx rv" style="--i:3"><div class="b-text"><h3>${C.features.items[3][0]}</h3><p>${C.features.items[3][1]}</p></div>
      <div class="ui-flow" aria-hidden="true"><span>₹ INR</span><i class="loop"></i><span class="hot">$ USD</span></div></article>
  </div>
  <h3 class="h3 rv">${C.orders.title}</h3>
  <div class="orders-row">${C.orders.rows.map(([t, d, b], i) => `<article class="o-card rv" style="--i:${i}">
    <svg class="o-art" viewBox="0 0 260 88" aria-hidden="true">${ORDER_ART[i]}</svg>
    <h4>${t}</h4><dl><div><dt>${C.orders.cols[1]}</dt><dd>${d}</dd></div><div><dt>${C.orders.cols[2]}</dt><dd>${b}</dd></div></dl></article>`).join('')}</div>
  <div class="sup-strip rv"><h3>${C.supports.title}</h3><dl>${C.supports.items.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl></div>
</div></section>`;

// ---------- why: three big statement panels
export const why = () => `<section class="sec s-why" id="why"><div class="vw">
  <div class="head rv"><h2>${C.why.title}</h2></div>
  <div class="why-row">${C.why.items.map(([t, d], i) => `<article class="w-panel w-${i} rv" style="--i:${i}"><span class="w-num num" aria-hidden="true">0${i + 1}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#faq">${C.why.more}${icon.go}</a></article>`).join('')}</div>
</div></section>`;

// ---------- how: the four steps as four app screens
export const how = () => `<section class="sec s-how" id="how"><div class="vw">
  <div class="head rv"><h2>${C.steps.title}</h2><a class="btn btn-primary" href="#lead">${C.steps.cta}</a></div>
  <ol class="screens panel">${C.steps.items.map(([t, d], i) => `<li class="rv" style="--i:${i}">${phone(['open', 'verify', 'fund', 'track'][i], 'mini')}<p class="sc-n num">0${i + 1}</p><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
  <div class="who-row">${C.who.items.map(([t, d], i) => `<div class="who-card rv" style="--i:${i}">${i === 0 ? `<p class="who-k">${C.who.title}</p>` : '<p class="who-k" aria-hidden="true">&nbsp;</p>'}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
  <div class="route-row">${C.routes.map((r, k) => `<article class="route rv" style="--i:${k}"><p class="route-head"><b>${r.title}</b><span>${r.tag}</span></p><ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol><p class="route-note">${r.note}</p></article>`).join('')}</div>
</div></section>`;

// ---------- popular: a "dashboard window"
export const popular = () => `<section class="sec s-popular" id="popular"><div class="vw">
  <div class="head rv"><h2>${C.sectors.title}</h2><p class="mkt"><span class="live-dot" data-market-dot></span><span data-bind="status"></span></p></div>
  <div class="window rv">
    <div class="win-bar" aria-hidden="true"><i></i><i></i><i></i><span>US stocks · ${C.sectors.cols[2]}</span></div>
    <div class="sx-tabs" role="tablist" aria-label="Sectors">${Object.keys(C.sectors.list).map((s, i) => `<button type="button" role="tab" id="sx-${i}" aria-controls="sx-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${s}</button>`).join('')}</div>
    <div class="sx-panel" id="sx-panel" role="tabpanel" aria-labelledby="sx-0"></div>
  </div>
  <div class="pop-foot"><a class="tlink" href="#lead">${C.sectors.cta}${icon.go}</a><p class="fine">${C.sectors.note}</p></div>
</div></section>`;

// ---------- pricing: chips + big-number tiles (₹0 in the centre)
export const pricing = () => `<section class="sec s-pricing" id="pricing"><div class="vw">
  <div class="head rv"><h2>${C.whyUs.title}</h2></div>
  <ul class="whyus">${C.whyUs.items.map((t, i) => `<li class="rv" style="--i:${i}">${icon.check}<span>${t}</span></li>`).join('')}</ul>
  <h3 class="h3 rv">${C.charges.title}</h3>
  <div class="charge-grid">${C.charges.items.map((c, i) => `<article class="charge${c.hot ? ' is-hot panel' : ''} rv" style="--i:${i}">${c.tag ? `<span class="charge-tag">${c.tag}</span>` : ''}<p class="charge-k">${c.label}</p><p class="charge-v num">${c.fig.replace('*', '<sup>*</sup>')}</p><p class="charge-n">${c.note}</p><a class="btn ${c.hot ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#lead">${c.cta}</a></article>`).join('')}</div>
  <p class="fine center">${C.charges.foot}</p>
</div></section>`;

export const tax = () => `<section class="sec s-tax" id="tax"><div class="vw">
  <div class="head rv"><h2>${C.tax.title}</h2><p>${C.tax.sub}</p></div>
  <div class="tax-grid">${C.tax.items.map(([t, d], i) => `<article class="taxc rv" style="--i:${i}"><span class="tax-n num">0${i + 1}</span><h3>${t}</h3><p>${d}</p><a class="tlink" href="#tax-guide">${C.tax.more}${icon.go}</a></article>`).join('')}</div>
  <p class="center"><a class="btn btn-ghost" href="#tax-guide">${C.tax.cta}</a></p>
</div></section>`;

export const faq = () => `<section class="sec s-faq" id="faq"><div class="vw faq-in"><h2 class="rv">${C.faq.title}</h2>${faqList()}</div></section>`;

export const closing = (art = '') => `<section class="s-closing" id="start"><div class="vw">
  <div class="close-panel panel rv">
    <div class="close-copy">
      <h2>${C.closing.title}</h2>
      <p class="lead">${C.closing.sub}</p>
      ${leadForm('lead-2', C.closing.cta)}
      <ul class="benefits">${C.closing.benefits.map((b) => `<li>${icon.check}${b}</li>`).join('')}</ul>
      <a class="tlink" href="#lead-2">${C.closing.expert}${icon.go}</a>
      <p class="fine">${C.closing.fine}</p>
    </div>
    <div class="close-art" aria-hidden="true">${art || phone('dashboard')}</div>
  </div>
</div></section>`;

// ---------- behaviours
export function setupSections() {
  // fractional pie
  const pie = $('#frac-pie'), n = $('#frac-n');
  $$('[data-amt]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-amt]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const a = Number(b.dataset.amt);
    n.textContent = share('AAPL', a); pie.style.setProperty('--p', (a / REF_PRICES.AAPL).toFixed(4));
    track('fraction_amount', { amount: a });
  }));
  // sector tabs
  const names = Object.keys(C.sectors.list), tabs = $$('.sx-tabs [role="tab"]'), panel = $('#sx-panel');
  const show = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tabs[i].id);
    panel.innerHTML = C.sectors.list[names[i]].map(([nm, t, l], k) => `<a class="sx-row" href="#lead" style="--i:${k}" aria-label="Invest in ${esc(nm)} (${t})"><span class="sx-logo">${logo(l, t)}</span><span class="sx-name"><b>${esc(nm)}</b><small>${t}</small></span><svg class="sx-spark" viewBox="0 0 90 26" aria-hidden="true"><path d="${walk(90, 26, t.charCodeAt(0) * 7 + k, quote(t).ch >= 0 ? -0.03 : 0.03).line}" class="${quote(t).ch >= 0 ? 'up' : 'down'}"/></svg>${qCell(t)}<span class="sx-go" aria-hidden="true">Invest${icon.go}</span></a>`).join('');
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => { show(i); track('sector_tab', { sector: names[i] }); }));
  $('.sx-tabs').addEventListener('keydown', (e) => {
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: names.length - 1 }[e.key];
    if (k !== undefined) { e.preventDefault(); show((k + names.length) % names.length, true); }
  });
  show(0);
}
