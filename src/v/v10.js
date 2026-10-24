// v10 · Fluid (after Apple's "Designing Fluid Interfaces" and the apple-design skill): system type with size-specific
// tracking, apple.com-style white and grey bands, a translucent header, its own fewer sections, a centred hero over a
// product stage of three white UI cards, and one signature interaction at its centre —
// the amount dial. Drag or flick the ruler: it tracks 1:1 from where you grabbed it, momentum projects where it lands,
// it rubber-bands past the ends and settles on a critically damped spring that can be grabbed again mid-flight.
import './base.css';
import './sections.css';
import './v10.css';
import { boot, header, footer, C, icon, leadForm, logo, usd, sparkFor, $, $$, reducedMotion, REF_PRICES } from './kit.js';
import * as S from './sections.js';

const AMTS = [1, 5, 10, 25, 50, 100, 250, 500];
const PICKS = [['Apple', 'AAPL', 'apple'], ['NVIDIA', 'NVDA', 'nvidia'], ['Microsoft', 'MSFT', 'microsoft']];
const STEP = 76;   // px between amounts on the ruler

const dial = `<div class="dial-card">
  <p class="dial-amt"><b class="num" id="dial-v">$1</b> <span>buys</span></p>
  <ul class="dial-picks">${PICKS.map(([n, t, l]) => `<li>${logo(l, t)}<span><b>${n}</b><small>${t} · ${usd.format(REF_PRICES[t])}</small></span><em class="num" data-t="${t}"></em></li>`).join('')}</ul>
  <div class="dial" role="slider" tabindex="0" aria-label="Amount to invest, in US dollars" aria-valuemin="1" aria-valuemax="500" aria-valuenow="1" aria-valuetext="$1">
    <div class="dial-track">${AMTS.map((a, i) => `<span data-i="${i}">$${a}</span>`).join('')}</div>
    <i class="dial-needle" aria-hidden="true"></i>
  </div>
  <p class="dial-note">Drag or flick to change the amount · reference prices, for illustration</p>
</div>`;

// ---------- v10's own sections: each one idea, big type, a real visual where it earns its place
const tile = (cls, [t, d], art) => `<li class="tile ${cls} rv"><div class="tile-art" aria-hidden="true">${art}</div><h3>${t}</h3><p>${d}</p></li>`;
const F = C.features.items;
const bento = `<section class="sec s-bento" id="product"><div class="vw">
  <div class="head rv"><h2>${C.features.title}</h2></div>
  <ul class="bento">
    ${tile('t-find', F[1], `<span class="search">${icon.search}<span>Apple</span><em>AAPL</em></span>`)}
    ${tile('t-hold', F[2], `<span class="hold"><small>US holdings</small><b class="num">$1,248.60</b>${sparkFor('GOOGL', 220, 56, { baseline: false })}</span>`)}
    ${tile('t-fx', F[3], '<b class="big fx"><span>₹</span><i>→</i><span>$</span></b>')}
  </ul>
</div></section>`;

const wall = `<section class="sec s-wall" id="brands"><div class="vw">
  <div class="head rv"><h2>${C.brands.title}</h2><p>${C.brands.sub}</p></div>
  <ul class="wall rv">${C.brands.list.map(([n, t, l]) => `<li title="${n}">${logo(l, t)}<span class="sr-only">${n}</span></li>`).join('')}</ul>
</div></section>`;

const why = `<section class="sec s-why10" id="why"><div class="vw">
  <h2 class="rv">${C.why.title}</h2>
  <ol class="stmts">${C.why.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
</div></section>`;

const steps = `<section class="sec s-steps" id="how"><div class="vw">
  <div class="head rv"><h2>${C.steps.title}</h2></div>
  <ol class="steps4">${C.steps.items.map(([t, d], i) => `<li class="rv" style="--i:${i}"><span class="n num">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
  <p class="steps-cta rv"><a class="btn btn-primary" href="#start">${C.steps.cta}</a></p>
</div></section>`;

const price = `<section class="sec s-price" id="pricing"><div class="vw">
  <div class="head rv"><h2>${C.charges.title}</h2></div>
  <ul class="prices">${C.charges.items.map((c, i) => `<li class="rv${c.hot ? ' is-hot' : ''}" style="--i:${i}">${c.tag ? `<p class="p-tag">${c.tag}</p>` : ''}<p class="p-k">${c.label}</p><b class="p-fig num">${c.fig}</b><p class="p-note">${c.note}</p></li>`).join('')}</ul>
  <p class="fine rv">${C.charges.foot}</p>
</div></section>`;

const taxes = `<section class="sec s-tax10" id="tax"><div class="vw tax-in">
  <div class="rv"><h2>${C.tax.title}</h2><p class="sub">${C.tax.sub}</p><a class="tlink" href="#tax">${icon.doc}${C.tax.cta}</a></div>
  <dl class="tax-list">${C.tax.items.map(([t, d], i) => `<div class="rv" style="--i:${i}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
</div></section>`;

const close = `<section class="sec s-close10" id="start"><div class="vw">
  <h2 class="rv" id="close-title">${C.closing.title}</h2>
  <p class="sub rv">${C.closing.sub}</p>
  <ul class="benefits rv">${C.closing.benefits.map((b) => `<li>${icon.check}${b}</li>`).join('')}</ul>
  <div class="close-form rv">${leadForm('lead-2', C.closing.cta, 'close-title')}<p class="fine">${C.closing.fine}</p></div>
  <ul class="trust10 rv">${C.whyUs.items.map((t) => `<li>${t}</li>`).join('')}</ul>
</div></section>`;

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="hx-panel">
    <div class="spark" aria-hidden="true">${[[12, 62, 18], [86, 54, 22], [74, 80, 12], [22, 86, 10], [52, 92, 8]].map(([x, y, z]) => `<i style="left:${x}%;top:${y}%;--z:${z}px"></i>`).join('')}</div>
    <div class="vw hero-copy">
      <p class="eyebrow">${C.hero.eyebrow}</p>
      <h1><span class="ring">${C.hero.h1}<svg viewBox="0 0 300 110" preserveAspectRatio="none" aria-hidden="true"><path d="M58 18C124 2 238 6 279 30c34 20 4 56-70 66-92 13-188 6-199-27C2 44 40 24 98 14"/></svg></span> <span class="l2">${C.hero.h1b}</span></h1>
      <p class="lead">${C.hero.lead}</p>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      <a class="tlink" href="#how">${C.hero.how}${icon.go}</a>
    </div>
  </div>
  <ul class="stats" aria-label="Key investment highlights">${C.highlights.map((h, i) => `<li><span class="st-ico" aria-hidden="true">${[icon.globe, icon.chart, icon.wallet, icon.shield][i]}</span><span><b class="num">${h.fig}</b><small>${h.label}</small></span></li>`).join('')}</ul>
  <div class="vw stage">
    <div class="side s-left" aria-hidden="true">
      <span class="side-ico ok">${icon.check}</span>
      <p class="side-k">Order filled</p>
      <p class="side-v num">${(1 / REF_PRICES.AAPL).toFixed(4)} AAPL</p>
      <p class="side-s">Bought for $1.00 · fractional</p>
    </div>
    ${dial}
    <div class="side s-right" aria-hidden="true">
      <span class="side-ico fx">₹<i>→</i>$</span>
      <p class="side-k">USD buying power</p>
      <p class="side-v num">$297.62</p>
      <p class="side-s">${F[3][1].split('. ')[1]}</p>
    </div>
  </div>
</section>
${bento}
${wall}
${why}
${steps}
${price}
${taxes}
${S.faq()}
${close}
</main>
${footer()}`;

boot('v10', html);

// ---------- the amount dial
const el = $('.dial'), track = $('.dial-track'), out = $('#dial-v'), shares = $$('.dial-picks em');
const MAX = 0, MIN = -(AMTS.length - 1) * STEP;
let x = 0, v = 0, target = 0, raf = 0, drag = null, cur = -1;

const rubber = (o, d = 160, c = 0.55) => (o * d * c) / (d + c * Math.abs(o));            // progressive resistance
const bounded = (p) => (p > MAX ? MAX + rubber(p - MAX) : p < MIN ? MIN - rubber(MIN - p) : p);
const project = (vel, d = 0.99) => ((vel / 1000) * d) / (1 - d);   // Apple's momentum projection; 0.99 = the snappier rate, right for a picker
const snap = (p) => Math.round(Math.min(MAX, Math.max(MIN, p)) / STEP) * STEP;

function show(i) {
  if (i === cur) return;
  cur = i;
  const a = AMTS[i];
  out.textContent = `$${a}`;
  shares.forEach((s) => { s.textContent = `${(a / REF_PRICES[s.dataset.t]).toFixed(4)} sh`; });
  el.setAttribute('aria-valuenow', a); el.setAttribute('aria-valuetext', `$${a}`);
  $$('span', track).forEach((s, k) => s.classList.toggle('is-on', k === i));
}
function render() {
  track.style.transform = `translate3d(${x}px, 0, 0)`;
  show(Math.round(-Math.min(MAX, Math.max(MIN, x)) / STEP));
}
// Critically damped spring (damping 1.0, response 0.4 s), always from the live value, so a grab mid-flight never jumps.
function settle() {
  cancelAnimationFrame(raf);
  if (reducedMotion) { x = target; v = 0; render(); return; }
  const w = (2 * Math.PI) / 0.4;
  let last = performance.now();
  const step = (t) => {
    const dt = Math.min(0.032, (t - last) / 1000); last = t;
    v += (-w * w * (x - target) - 2 * w * v) * dt;
    x += v * dt;
    if (Math.abs(x - target) < 0.3 && Math.abs(v) < 4) { x = target; v = 0; render(); return; }
    render();
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
const goTo = (i, instant = false) => {
  target = -Math.max(0, Math.min(AMTS.length - 1, i)) * STEP;
  if (instant) { cancelAnimationFrame(raf); x = target; v = 0; render(); } else settle();
};

el.addEventListener('pointerdown', (e) => {
  if (drag) return;                                            // a second finger never hijacks the drag
  el.setPointerCapture(e.pointerId);
  cancelAnimationFrame(raf);                                   // interruptible: take over from wherever it is now
  drag = { x0: e.clientX, start: x, moved: false, hist: [[e.timeStamp, e.clientX]], hit: e.target.closest('[data-i]') };
  el.classList.add('is-held');
});
el.addEventListener('pointermove', (e) => {
  if (!drag) return;
  if (Math.abs(e.clientX - drag.x0) > 6) drag.moved = true;    // small hysteresis before a tap becomes a drag
  x = bounded(drag.start + (e.clientX - drag.x0));             // 1:1, keeping the grab offset
  drag.hist.push([e.timeStamp, e.clientX]);
  if (drag.hist.length > 5) drag.hist.shift();
  render();
});
const release = () => {
  if (!drag) return;
  el.classList.remove('is-held');
  if (!drag.moved && drag.hit) { const i = Number(drag.hit.dataset.i); drag = null; goTo(i); return; }   // tap a label to jump there
  // release velocity from the last 100ms only: a finger that paused before lifting carries no stale flick
  const now = performance.now(), h = drag.hist.filter(([t]) => now - t < 100);
  const [t0, p0] = h[0] || [0, 0], [t1, p1] = h[h.length - 1] || [0, 0];
  v = t1 > t0 ? ((p1 - p0) / (t1 - t0)) * 1000 : 0;          // handed to the spring
  target = snap(x + project(v));
  drag = null;
  settle();
};
el.addEventListener('pointerup', release);
el.addEventListener('pointercancel', release);
el.addEventListener('keydown', (e) => {
  const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
  // keys step instantly: a repeated key action never waits on an animation
  if (k) { e.preventDefault(); goTo(cur + k, true); }
  if (e.key === 'Home') { e.preventDefault(); goTo(0, true); }
  if (e.key === 'End') { e.preventDefault(); goTo(AMTS.length - 1, true); }
});
render();
