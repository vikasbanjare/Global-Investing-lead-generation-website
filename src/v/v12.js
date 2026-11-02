// v12 · The wall becomes the app: a tilted wall of real trading screens slides past under the headline. Scrolling flattens
// it, one phone flies to centre and the page turns into a working app: pick a stock, key an amount, slide to buy or sell.
// Everything inside is DOM (sharp text, real controls); the 3D is plain CSS. Nothing is ever placed.
import './base.css';
import './v12.css';
import { boot, footer, C, leadForm, logo, usd, brandMark, faqList, quote, pct, $, $$, reducedMotion, REF_PRICES } from './kit.js';
import { usSessionInIST, istClock } from '../market.js';

const STOCKS = [['Apple', 'AAPL', 'apple'], ['NVIDIA', 'NVDA', 'nvidia'], ['Microsoft', 'MSFT', 'microsoft'], ['Tesla', 'TSLA', 'tesla'], ['Amazon', 'AMZN', 'amazon'], ['Netflix', 'NFLX', 'netflix'], ['Meta', 'META', 'meta']];
const s = usSessionInIST(), OPEN = istClock(s.open), CLOSE = istClock(s.close);

// A stable made-up line per ticker: same shape every visit, ending in the direction of its illustrative day change.
function spark(t, w = 268, h = 110) {
  let seed = 3; for (const c of t) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5, up = quote(t).ch >= 0;
  let y = up ? 0.72 : 0.3; const pts = [];
  for (let i = 0; i <= 44; i++) { y += r() * 0.13 + (up ? -0.012 : 0.012); y = Math.min(0.92, Math.max(0.08, y)); pts.push(`${(i / 44 * w).toFixed(1)},${(y * h).toFixed(1)}`); }
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.join(' ')}" fill="none" stroke="#ff5400" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
const rowOf = ([n, t, l]) => { const q = quote(t); return `<div class="r"><span class="r-l">${logo(l, t)}</span><span class="r-n"><b>${n}</b><small>${t}</small></span><span class="r-p"><b>${usd.format(q.px)}</b><small class="${q.ch >= 0 ? 'up' : 'dn'}">${pct(q.ch)}</small></span></div>`; };

// ---------- the screens on the wall
const WALL = {
  stock: (i) => { const [n, t, l] = STOCKS[i % STOCKS.length], q = quote(t); return `<div class="sc"><p class="sc-top">${logo(l, t)}<b>${n}</b></p><p class="big">${usd.format(q.px)}</p><p class="${q.ch >= 0 ? 'up' : 'dn'} ch">${pct(q.ch)} today</p>${spark(t)}<p class="rng"><i>1D</i><i class="on">1M</i><i>6M</i><i>1Y</i><i>5Y</i></p><div class="duo"><span class="pb ghost">Sell</span><span class="pb">Buy</span></div></div>`; },
  list: (i) => `<div class="sc"><h4>US stocks</h4><p class="srch">Search company, sector or theme</p>${[0, 1, 2, 3, 4, 5].map((k) => rowOf(STOCKS[(i + k) % STOCKS.length])).join('')}</div>`,
  amount: (i) => { const [, t] = STOCKS[i % STOCKS.length], a = [1, 25, 10, 50][i % 4]; return `<div class="sc sc-c"><p class="lab">Buy ${t}</p><p class="amt-b">$${a}</p><p class="lab">${(a / REF_PRICES[t]).toFixed(4)} shares</p><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '‹'].map((d) => `<i>${d}</i>`).join('')}</div><span class="pb">Review</span></div>`; },
  orders: () => `<div class="sc"><h4>Order type</h4>${C.orders.rows.map(([a, b]) => `<div class="o-r"><b>${a}</b><small>${b}</small></div>`).join('')}</div>`,
  route: () => `<div class="sc"><h4>INR to USD</h4><ol class="tr">${C.routes[0].steps.map((x) => `<li>${x}</li>`).join('')}</ol><p class="lab">${C.routes[0].note}</p></div>`,
  hours: () => `<div class="sc sc-c"><p class="lab">US market opens</p><p class="amt-b hrs">${OPEN}</p><p class="lab">India time, on trading days</p><div class="o-r o-c"><b>Closes</b><small>${CLOSE} IST</small></div><div class="o-r o-c"><b>Regular session</b><small>Mon to Fri, 9:30 AM to 4:00 PM ET</small></div></div>`,
  zero: () => `<div class="sc sc-o"><p class="big-o">₹0</p><p>account opening</p><span class="pb pb-w">Open account</span></div>`,
};
const ORDER = ['stock', 'list', 'amount', 'route', 'stock', 'orders', 'hours', 'stock', 'zero', 'list', 'amount'];
let wallN = 0;
const phone = () => { const k = ORDER[wallN % ORDER.length]; const h = WALL[k](wallN++); return `<div class="ph" aria-hidden="true">${h}</div>`; };
const col = (x, rows, dir) => { const a = Array.from({ length: rows }, phone).join(''); return `<div class="col" style="--x:${x}"><div class="track ${dir ? 'rev' : ''}">${a}${a}</div></div>`; };

// ---------- the live phone
const live = `<div class="ph ph-live" id="live" inert>
  <div class="scr-wrap"><div class="scrs" id="scrs">
    <section class="sc scr" aria-label="Pick a stock">
      <p class="sc-top" id="pick-top"></p><p class="big" id="pick-px"></p><p class="ch" id="pick-ch"></p><div id="pick-spark"></div>
      <div class="pick" role="group" aria-label="Stocks">${STOCKS.slice(0, 5).map(([n, t, l], i) => `<button type="button" data-t="${t}" aria-pressed="${!i}"><span class="r-l">${logo(l, t)}</span><span class="r-n"><b>${n}</b><small>${t}</small></span><span class="r-p"><b>${usd.format(REF_PRICES[t])}</b></span></button>`).join('')}</div>
      <button type="button" class="pb" data-next="1">Continue</button>
    </section>
    <section class="sc sc-c scr" aria-label="Enter an amount">
      <p class="lab" id="am-l"></p><p class="amt-b" id="am-v" aria-live="polite">$25</p><p class="lab" id="am-s"></p>
      <div class="pad" role="group" aria-label="Keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '‹'].map((d) => `<button type="button" data-k="${d}" aria-label="${d === '‹' ? 'Delete' : d === 'C' ? 'Clear' : d}">${d}</button>`).join('')}</div>
      <button type="button" class="pb" data-next="2">Review</button>
    </section>
    <section class="sc scr" aria-label="Review and confirm">
      <div class="tabs" role="group" aria-label="Order side"><button type="button" data-side="buy" aria-pressed="true">Buy</button><button type="button" data-side="sell" aria-pressed="false">Sell</button></div>
      <p class="sc-top" id="rv-top"></p><p class="amt-b rv" id="rv-a"></p>
      <dl class="rv-d"><div><dt>Shares</dt><dd id="rv-s"></dd></div><div><dt>Reference price</dt><dd id="rv-p"></dd></div><div><dt>Brokerage 0.25%</dt><dd id="rv-f"></dd></div></dl>
      <p class="lab rv-n" id="rv-n"></p>
      <label class="slide"><span class="sr-only" id="sl-sr"></span><input id="sl" type="range" min="0" max="100" value="0"><span class="slide-t" id="sl-t" aria-hidden="true"></span></label>
    </section>
  </div></div>
</div>`;

const CHAPTERS = [
  ['Pick', 'Any brand you already know.', 'Search by company, sector or theme, across US stocks and ETFs.', '5,000+', 'US stocks & ETFs'],
  ['Amount', 'Think in dollars, not shares.', 'Buy a portion of eligible US stocks and ETFs. Key in what you want to put in.', '$1', 'to start, eligible securities'],
  ['Buy', 'Slide. That’s the order.', 'Market, limit, stop and fractional orders are supported. Try the slider, it’s only a preview.', '0.25%', 'brokerage on trade value'],
  ['Sell', 'Selling is the same slide.', 'Then request a withdrawal. USD converts to INR after review and reaches your linked bank.', 'USD 20', 'minimum withdrawal'],
];

const CH = C.charges.items;
const html = `<a class="skip" href="#main">Skip to content</a>
<header class="top"><a href="#main" class="top-h" aria-label="MAPS — Mirae Asset Portfolio Service, back to top">${brandMark()}</a>
  <nav aria-label="Primary"><a href="#money">Your money</a><a href="#charges">Charges</a><a href="#faq">FAQs</a></nav>
  <a class="btn btn-primary btn-sm" href="#lead">${C.hero.cta}</a></header>
<main id="main" tabindex="-1">
  <section class="pin" id="pin" aria-label="Try the app">
    <div class="stage" id="stage">
      <div class="plane" id="plane">
        ${col(-3, 3, 0)}${col(-2, 3, 1)}${col(-1, 3, 0)}
        <div class="col col-0" style="--x:0"><div class="c0-ghost c0-up">${phone()}</div>${live}<div class="c0-ghost c0-dn">${phone()}</div></div>
        ${col(1, 3, 1)}${col(2, 3, 0)}${col(3, 3, 1)}
      </div>
      <div class="veil" id="veil" aria-hidden="true"></div>
      <div class="hero" id="hero">
        <h1>Wall Street, in&nbsp;your&nbsp;hand.</h1>
        <p>Buy and sell US stocks and ETFs from India, starting from $1.*</p>
        <a class="btn btn-primary" href="#lead">${C.hero.cta}</a>
        <small>*For eligible securities. Investments in securities markets are subject to market risks. App screens are illustrative.</small>
      </div>
      ${CHAPTERS.map(([k, h, d, n, nl], i) => `<article class="chap" data-c="${i}"><div class="chap-l"><p class="k">${k}</p><h2>${h}</h2><p>${d}</p></div><div class="chap-r"><b>${n}</b><span>${nl}</span></div></article>`).join('')}
      <p class="illus">Reference prices, for illustration. Preview only: no order is placed.</p>
    </div>
  </section>

  <section class="sec" id="money"><div class="w">
    <p class="k">Your money</p><h2>Rupees out. Dollars in. And back.</h2>
    <div class="routes">${C.routes.map((r) => `<article><p class="tag">${r.tag}</p><h3>${r.title}</h3><ol>${r.steps.map((x) => `<li>${x}</li>`).join('')}</ol><p class="note">${r.note}</p></article>`).join('')}</div>
    <p class="fine">LRS allows eligible resident individuals up to $250,000 per financial year across all permitted purposes.</p>
  </div></section>

  <section class="sec sec-t" id="charges"><div class="w">
    <p class="k">Charges</p><h2>${C.charges.title}</h2>
    <ul class="costs">${[CH[1], CH[0], CH[2]].map((c) => `<li><b>${c.fig}</b><h3>${c.label}</h3><p>${c.note}</p></li>`).join('')}</ul>
    <p class="fine">${C.charges.foot}</p>
  </div></section>

  <section class="sec" id="faq"><div class="w w-f"><div><p class="k">Questions</p><h2>${C.faq.title}</h2></div>${faqList()}</div></section>

  <section class="end" id="start"><div class="w">
    <h2 id="end-t">Now do it for real.</h2>
    <p class="end-s">${C.closing.benefits.join(' · ')}</p>
    <div class="end-f">${leadForm('lead', C.closing.cta, 'end-t')}</div>
    <p class="end-n">${C.closing.fine}</p>
  </div></section>
</main>
${footer()}
<dialog class="flood" id="flood" aria-labelledby="fl-h"><div><h2 id="fl-h"></h2><p id="fl-p"></p><p class="fl-n">Preview only. No order was placed.</p><div class="fl-a"><a class="btn fl-go" href="#lead">${C.closing.cta}</a><button type="button" class="btn fl-x" id="fl-x">Keep playing</button></div></div></dialog>`;

boot('v12', html);

// ---------- app state
const App = { t: 'AAPL', n: 'Apple', l: 'apple', amt: '25', side: 'buy' };
const A = () => Math.max(1, Number(App.amt) || 0);
function render() {
  const q = quote(App.t), a = A(), buy = App.side === 'buy';
  $('#pick-top').innerHTML = `${logo(App.l, App.t)}<b>${App.n}</b>`;
  $('#pick-px').textContent = usd.format(q.px);
  const ch = $('#pick-ch'); ch.textContent = `${pct(q.ch)} today`; ch.className = `ch ${q.ch >= 0 ? 'up' : 'dn'}`;
  $('#pick-spark').innerHTML = spark(App.t);
  $$('#live [data-t]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === App.t));
  $('#am-l').textContent = `${buy ? 'Buy' : 'Sell'} ${App.t}`;
  $('#am-v').textContent = `$${App.amt || 0}`;
  $('#am-s').textContent = `${(a / q.px).toFixed(4)} shares`;
  $('#rv-top').innerHTML = `${logo(App.l, App.t)}<b>${buy ? 'Buy' : 'Sell'} ${App.n}</b>`;
  $('#rv-a').textContent = usd.format(a);
  $('#rv-s').textContent = (a / q.px).toFixed(4);
  $('#rv-p').textContent = usd.format(q.px);
  $('#rv-f').textContent = usd.format(a * 0.0025);
  $('#rv-n').textContent = buy ? 'Market order. Levies, bank and FX charges may apply.' : 'Market order. Withdrawals start at USD 20.';
  $$('#live [data-side]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.side === App.side));
  const label = `Slide to ${App.side}`; $('#sl-t').textContent = label; $('#sl-sr').textContent = `${label} ${usd.format(a)} of ${App.n}`;
}
render();

// ---------- scroll: wall flattens, then chapters
const pin = $('#pin'), plane = $('#plane'), stage = $('#stage'), hero = $('#hero'), veil = $('#veil'), liveEl = $('#live'), chaps = $$('.chap'), illus = $('.illus');
const MORPH = 0.2, CHAP0 = 0.24;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x) => x * x * (3 - 2 * x), mix = (a, b, t) => a + (b - a) * t;
const scrollFor = (i) => pin.offsetTop + (pin.offsetHeight - innerHeight) * (CHAP0 + (i + 0.5) * (1 - CHAP0) / 4);
let lastCh = -2, tilted = true;
function onScroll() {
  const vw = stage.clientWidth, vh = stage.clientHeight, phoneView = vw < 820;
  const p = clamp(-pin.getBoundingClientRect().top / (pin.offsetHeight - innerHeight)), m = ease(clamp(p / MORPH));
  // tilted wall at rest, phone sitting right of the headline → flat, centred, sized to the viewport
  const S1 = phoneView ? Math.min(1, (vh * 0.66) / 620, (vw - 40) / 300) : Math.min(1.2, (vh * 0.84) / 620);
  const x = mix(vw * (phoneView ? 0.5 : 0.7), vw * 0.5, m), y = mix(vh * (phoneView ? 0.74 : 0.52), vh * (phoneView ? 0.6 : 0.52), m);
  // once flat it drops to a plain 2D transform so the browser re-rasters the app's text at full sharpness
  plane.style.transform = m >= 0.999 ? `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${S1})` : `translate3d(${x}px, ${y}px, 0) rotateX(${mix(46, 0, m)}deg) rotateZ(${mix(-24, 0, m)}deg) scale(${mix(phoneView ? 0.62 : 0.86, S1, m)})`;
  plane.style.setProperty('--m', m.toFixed(3));
  hero.style.opacity = clamp(1 - p / 0.07); hero.style.visibility = p > 0.07 ? 'hidden' : 'visible';
  hero.style.transform = `translateY(${-p * 300}px)`;
  veil.style.opacity = clamp(1 - m * 1.4);
  const flat = m >= 0.999;
  if (flat === tilted) { tilted = !flat; plane.classList.toggle('is-flat', flat); stage.classList.toggle('is-flat', flat); liveEl.inert = !flat; }
  const ci = p < CHAP0 - 0.02 ? -1 : clamp(Math.floor((p - CHAP0) / ((1 - CHAP0) / 4) + 0.001), 0, 3);
  if (ci !== lastCh) {
    chaps.forEach((el, i) => el.classList.toggle('is-on', i === ci));
    illus.classList.toggle('is-on', ci >= 0);
    if (ci >= 0) {
      $('#scrs').style.transform = `translateX(${-Math.min(ci, 2) * 100 / 3}%)`;
      if (ci >= 2) { App.side = ci === 3 ? 'sell' : 'buy'; render(); }
    }
    lastCh = ci;
  }
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

// ---------- app controls
const MAX = 250000;
const flood = $('#flood'), sl = $('#sl');
liveEl.addEventListener('click', (e) => {
  const t = e.target.closest('[data-t]'), k = e.target.closest('[data-k]'), nx = e.target.closest('[data-next]'), sd = e.target.closest('[data-side]');
  if (t) { const st = STOCKS.find((x) => x[1] === t.dataset.t); App.n = st[0]; App.t = st[1]; App.l = st[2]; render(); }
  if (k) { const d = k.dataset.k; if (d === 'C') App.amt = ''; else if (d === '‹') App.amt = App.amt.slice(0, -1); else if (Number(App.amt + d) <= MAX) App.amt = (App.amt + d).replace(/^0+/, ''); render(); }
  if (sd) { App.side = sd.dataset.side; render(); }
  if (nx) scrollTo({ top: scrollFor(Number(nx.dataset.next)), behavior: reducedMotion ? 'instant' : 'smooth' });
});
// The slider is a native range input: keyboard and touch work for free. It springs back unless it reaches the end.
let back = 0;
const paintSlide = () => { $('#sl-t').style.opacity = 1 - sl.value / 60; };
const release = () => {
  cancelAnimationFrame(back);
  if (flood.open) return;
  const step = () => { sl.value = Number(sl.value) * 0.78; paintSlide(); if (Number(sl.value) > 0.5) back = requestAnimationFrame(step); else { sl.value = 0; paintSlide(); } };
  back = requestAnimationFrame(step);
};
sl.addEventListener('input', () => {
  paintSlide();
  if (Number(sl.value) < 97 || flood.open) return;
  const buy = App.side === 'buy', a = usd.format(A()), sh = (A() / REF_PRICES[App.t]).toFixed(4);
  $('#fl-h').textContent = buy ? `That’s ${sh} ${App.t}.` : `${a} of ${App.t}, sold.`;
  $('#fl-p').textContent = buy ? `${a} of ${App.n}, in one slide. That’s how it feels.` : 'Same slide, other direction. That’s how it feels.';
  const r = sl.getBoundingClientRect();
  flood.style.setProperty('--fx', `${r.right - 28}px`); flood.style.setProperty('--fy', `${r.top + r.height / 2}px`);
  flood.showModal();
});
['pointerup', 'touchend', 'keyup'].forEach((ev) => sl.addEventListener(ev, release));
$('#fl-x').addEventListener('click', () => flood.close());
$('.fl-go').addEventListener('click', () => flood.close());
flood.addEventListener('close', () => { sl.value = 0; paintSlide(); });
paintSlide();
