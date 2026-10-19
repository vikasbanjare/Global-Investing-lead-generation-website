import './style.css';
import { marketStatus, cityTime, usSessionInIST, istClock, formatWait, REF_PRICES } from './market.js';

const $ = (s, root = document) => root.querySelector(s);
const bind = (key, value) => document.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => { el.textContent = value; });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// ---------- Pause motion (WCAG 2.2.2): one switch stops every loop — CSS animations, the 3D harbour, the ticking prices.
// Remembered per visitor; reduced-motion visitors start paused.
const root = document.documentElement;
const motionPaused = () => root.classList.contains('motion-paused');
const setMotion = (paused) => {
  root.classList.toggle('motion-paused', paused);
  document.querySelectorAll('.motion-toggle').forEach((b) => { b.querySelector('.mt-label').textContent = paused ? 'Play motion' : 'Pause motion'; }); // the label is the state (no aria-pressed: one signal, no contradiction)
  window.dispatchEvent(new Event('motionchange'));
  try { localStorage.setItem('motion-paused', paused ? '1' : '0'); } catch {}
};
let savedMotion = null;
try { savedMotion = localStorage.getItem('motion-paused'); } catch {}
setMotion(savedMotion === '1');
document.querySelectorAll('.motion-toggle').forEach((b) => b.addEventListener('click', () => setMotion(!motionPaused())));
document.documentElement.classList.add('js'); // reveal styles only apply when JS can undo them

// ---------- Hero city
// Desktop: live 3D (Three.js), started after load when the main thread is idle.
// Phones/tablets (≤900px): a pre-rendered poster of the same scene (scripts/render-poster.mjs), no WebGL.
const hero = $('.hero');
const canvas = $('.hero-canvas');
const label = $('.ws-label');
const poster = $('.hero-poster');
const POSTER_LABEL = { x: 0.522, y: 0.625 }; // from render-poster.mjs: fraction of the 1600×840 poster
function placePosterLabel() {
  // Mirror object-fit: cover on the poster's real box (CSS owns the band's size, zoom and offset).
  const hb = hero.getBoundingClientRect();
  const pb = poster.getBoundingClientRect();
  const s = Math.max(pb.width / 1600, pb.height / 840);
  const dw = 1600 * s, dh = 840 * s;
  label.style.left = `${pb.left - hb.left + POSTER_LABEL.x * dw - (dw - pb.width) / 2}px`;
  label.style.top = `${pb.top - hb.top + POSTER_LABEL.y * dh - (dh - pb.height) / 2}px`;
}
const narrow = matchMedia('(max-width: 900px)');
const forceLive = new URLSearchParams(location.search).has('live');
let live = false;
const startCity = () => {
  if (live) return;
  live = true;
  hero.classList.add('is-live');
  label.removeAttribute('style');
  label.classList.remove('is-on');
  import('./city.js')
    .then(({ createCity }) => {
      if (!createCity({ canvas, label, reducedMotion, withClouds: !forceLive })) hero.classList.add('no-webgl');
    })
    .catch(() => hero.classList.add('no-webgl'));
};
const whenIdle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
if (narrow.matches && !forceLive) {
  placePosterLabel();
  window.addEventListener('resize', () => { if (!live) placePosterLabel(); }, { passive: true });
  label.style.transform = 'translate(-50%, calc(-100% - 14px))';
  label.classList.add('is-on');
  narrow.addEventListener('change', (e) => { if (!e.matches) whenIdle(startCity); });
} else if (document.readyState === 'complete') whenIdle(startCity);
else window.addEventListener('load', () => whenIdle(startCity), { once: true });


// ---------- Ticker: its 16 logos load only as the band nears the viewport (they'd otherwise compete with the hero for bandwidth).
// (same for the bento's brand marks)
const lazyLogos = new IntersectionObserver((entries, obs) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.querySelectorAll('[data-logo]').forEach((el) => el.style.setProperty('--logo', `url(${import.meta.env.BASE_URL}logos/${el.dataset.logo}.svg)`));
  obs.unobserve(e.target);
}), { rootMargin: '400px 0px' });
document.querySelectorAll('.ticker, .tile-marks, .floaters').forEach((el) => lazyLogos.observe(el));

// ---------- Ticker prices: an illustrative trading tape (no market-data feed is connected; the note on the page says so).
const PX = REF_PRICES;
const quotes = Object.fromEntries(Object.entries(PX).map(([s, p]) => [s, { ref: p, px: p * (1 + (Math.random() - 0.45) * 0.03) }]));
const tickerItems = [...document.querySelectorAll('.ticker-track li')].map((li) => {
  const sym = li.querySelector('.ticker-sym').textContent;
  li.insertAdjacentHTML('beforeend', '<span class="tk-px"></span><span class="tk-ch"></span>');
  return { sym, px: li.querySelector('.tk-px'), ch: li.querySelector('.tk-ch') };
});
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
function paintQuote(it, dir) {
  const q = quotes[it.sym], pct = (q.px / q.ref - 1) * 100;
  it.px.textContent = usd.format(q.px);
  it.ch.textContent = `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(2)}%`;
  it.ch.className = `tk-ch ${pct >= 0 ? 'up' : 'down'}`;
  if (dir && !reducedMotion) { it.px.classList.remove('flash-up', 'flash-down'); void it.px.offsetWidth; it.px.classList.add(`flash-${dir}`); setTimeout(() => it.px.classList.remove(`flash-${dir}`), 120); }
}
tickerItems.forEach((it) => paintQuote(it));
let tickerOn = false;
new IntersectionObserver(([e]) => { tickerOn = e.isIntersecting; }).observe($('.ticker'));
setInterval(() => {
  if (!tickerOn || document.hidden || motionPaused()) return;
  for (const sym of Object.keys(quotes).sort(() => Math.random() - 0.5).slice(0, 3)) { // a few trades per beat, like a real tape
    const q = quotes[sym], step = (Math.random() - 0.5) * 0.004;
    q.px *= 1 + step;
    tickerItems.filter((it) => it.sym === sym).forEach((it) => paintQuote(it, step >= 0 ? 'up' : 'down'));
  }
}, 1200);

// ---------- Live clocks
function tick() {
  const now = new Date();
  const status = marketStatus(now);
  bind('ist', cityTime(now, 'Asia/Kolkata'));
  bind('istShort', cityTime(now, 'Asia/Kolkata').replace(/\s?[AP]M$/, '')); // phone status bar, like iOS
  bind('nyc', cityTime(now, 'America/New_York'));
  bind('status', status.text);
  document.querySelectorAll('#mkt-dot, [data-market-dot]').forEach((d) => d.classList.toggle('is-open', status.open));
  // Session chart: one US trading day drawn on an India-time axis (opening bell at the left edge, closing bell at the right).
  const session = usSessionInIST(now);
  bind('openIST', istClock(session.open));
  bind('closeIST', istClock(session.close));
  bind('statusShort', status.open ? `US market open · closes in ${formatWait(status.minutesLeft)}` : `US market opens in ${formatWait(status.minutesLeft)}`);
  bind('sessionText', `${istClock(session.open)} – ${istClock(session.close)}`);
  drawSession(session, status);
}
// Illustrative intraday path: a seeded random walk (same shape all day), busier at the open and close like real sessions.
const SESSION_MIN = 390;
const sessPath = (() => {
  let seed = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()).replaceAll('-', ''));
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pts = [0];
  for (let i = 1; i <= 78; i++) { const u = i / 78, vol = 0.6 + 1.6 * (Math.exp(-u * 8) + Math.exp(-(1 - u) * 10)); pts.push(pts[i - 1] + (rnd() - 0.47) * vol); }
  return pts;
})();
const hourLabel = (min) => { const m = ((min % 1440) + 1440) % 1440, h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''}\u00a0${h < 12 ? 'am' : 'pm'}`; };
function drawSession(session, status) {
  const lo = Math.min(...sessPath), hi = Math.max(...sessPath);
  const y = (v) => 210 - ((v - lo) / (hi - lo || 1)) * 180;
  const x = (i) => (i / (sessPath.length - 1)) * 1000;
  const line = sessPath.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  $('#sess-line').setAttribute('d', line);
  $('#sess-area').setAttribute('d', `${line} L1000 240 L0 240 Z`);
  $('.session-base').setAttribute('y1', y(sessPath[0]).toFixed(1));
  $('.session-base').setAttribute('y2', y(sessPath[0]).toFixed(1));
  // Live: draw up to now. Closed: the whole day, as a typical session.
  const elapsed = status.open ? SESSION_MIN - status.minutesLeft : SESSION_MIN;
  const k = Math.min(sessPath.length - 1, Math.round((elapsed / SESSION_MIN) * (sessPath.length - 1)));
  $('#sess-clip-r').setAttribute('width', x(k).toFixed(1));
  const pct = (sessPath[k] - sessPath[0]) * 0.18; // ponytail: walk units → % move, tuned to read like a normal day (±1–2%)
  const up = pct >= 0;
  $('.session').classList.toggle('is-down', !up);
  const ch = $('#sess-ch');
  ch.textContent = `${up ? '▲' : '▼'} ${Math.abs(pct).toFixed(2)}%`;
  ch.className = `tk-ch ${up ? 'up' : 'down'}`;
  const nowEl = $('#sess-now');
  nowEl.hidden = !status.open;
  nowEl.style.left = `${(x(k) / 10).toFixed(2)}%`;
  nowEl.style.top = `${((y(sessPath[k]) / 240) * 100).toFixed(2)}%`;
  // Axis: India time in bold on every full hour, New York time beneath.
  const ticks = [session.open];
  for (let t = Math.ceil((session.open + 1) / 60) * 60; t <= session.close - 45; t += 60) ticks.push(t); // no hour label crowding the close
  ticks.push(session.close);
  $('#sess-axis').innerHTML = ticks.map((t, i) => `<span class="${i % 2 && i !== ticks.length - 1 ? 'minor' : ''}" style="left:${(((t - session.open) / SESSION_MIN) * 100).toFixed(2)}%"><b>${hourLabel(t)}${i ? '' : ' IST'}</b><small>${hourLabel(570 + t - session.open)}${i ? '' : ' ET'}</small></span>`).join('');
}
tick();
setInterval(tick, 20_000);

// ---------- Lead capture (hero + closing band share the same behaviour)
// ponytail: front-end only. POST { mobile } to the lead endpoint (CRM) where marked.
// ---------- Funnel analytics. Events go to window.dataLayer (Google Tag Manager's standard queue), so whichever
// analytics/A-B tool mStock uses can read them; no third-party script is loaded here. Never includes the number.
window.dataLayer = window.dataLayer || [];
const calcContext = {}; // set once the visitor uses the calculator: { calc_amount, calc_sym } ride along with the lead
const track = (event, props = {}) => window.dataLayer.push({ event, ...props, variant: document.documentElement.dataset.variant || 'default' });
const seen = new Set();
const leadViews = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting && !seen.has(e.target.id)) { seen.add(e.target.id); track('lead_view', { form: e.target.id }); }
}), { threshold: 0.6 });
leadViews.observe($('#lead')); leadViews.observe($('#lead-2'));
function setupCapture(formSel, sentSel, errorSel, editSel) {
  const form = $(formSel), sent = $(sentSel), error = $(errorSel), field = form.querySelector('input');
  field.addEventListener('focus', () => track('lead_focus', { form: form.id }), { once: true });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const digits = field.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const valid = /^[6-9]\d{9}$/.test(digits);
    error.hidden = valid;
    field.setAttribute('aria-invalid', String(!valid));
    track(valid ? 'lead_submit_valid' : 'lead_submit_invalid', { form: form.id, ...calcContext });
    if (!valid) { field.focus(); return; }
    // TODO(lead-endpoint): fetch('/api/leads', { method: 'POST', body: JSON.stringify({ mobile: digits, source: form.id, ...calcContext }) })
    form.hidden = true;
    sent.hidden = false;
  });
  field.addEventListener('input', () => { error.hidden = true; field.removeAttribute('aria-invalid'); });
  $(editSel).addEventListener('click', () => { sent.hidden = true; form.hidden = false; field.focus(); });
  return field;
}
const input = setupCapture('#lead', '#sent', '#lead-error', '#edit-number');
setupCapture('#lead-2', '#sent-2', '#lead-2-error', '#edit-number-2');

// ---------- Desktop header: docks after the hero, hides on scroll-down, shows on scroll-up
const header = $('.site-header');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const past = y > hero.offsetHeight - 80;
  header.classList.toggle('is-docked', past);
  header.classList.toggle('is-shown', past && y < lastY - 2);
  if (Math.abs(y - lastY) > 2) lastY = y;
}, { passive: true });
header.addEventListener('focusin', () => header.classList.add('is-shown')); // keyboard users always see where focus is

// ---------- Mobile dock: shown while neither the hero form nor the closing CTA is on screen
const dock = $('#dock');
const dockLink = dock.querySelector('a');
const onScreen = new Map();
const updateDock = () => {
  const show = [...onScreen.values()].every((v) => !v) && window.scrollY > 200;
  dock.classList.toggle('is-on', show);
  dock.setAttribute('aria-hidden', String(!show));
  dockLink.tabIndex = show ? 0 : -1;
};
const dockObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => onScreen.set(e.target, e.isIntersecting));
  updateDock();
});
[$('.hero-copy'), $('.cta'), $('.footer')].forEach((el) => dockObserver.observe(el));
dockLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  setTimeout(() => input.focus({ preventScroll: true }), reducedMotion ? 0 : 500);
});

// ---------- Buy-by-amount ticket
const FX = 84; // ponytail: indicative rate; replace with live FX before launch
const amounts = [10, 25, 50, 100, 500];
let amount = 25;
const chips = $('#amounts');
let shown = amount; // value currently on screen, eased toward `amount`
function paintAmount(v) {
  bind('amt', Math.round(v));
  bind('amtInr', Math.round(v * FX).toLocaleString('en-IN'));
  bind('fee', (v * 0.0025).toFixed(2));
  bind('total', (v * 1.0025).toFixed(2));
}
function renderAmount() {
  bind('fx', FX);
  chips.innerHTML = amounts.map((v) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${v === amount}">$${v}</button>`).join('');
  const from = shown, to = amount, start = performance.now(), dur = reducedMotion ? 0 : 320;
  const step = (now) => {
    const t = dur ? Math.min(1, (now - start) / dur) : 1;
    shown = from + (to - from) * (1 - Math.pow(1 - t, 3));
    paintAmount(t === 1 ? to : shown);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
chips.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) { amount = Number(b.dataset.v); renderAmount(); paintFrac(amount, true); $('#calc-amt').value = String(amount); noteCalc('amount_chip'); }
});
paintAmount(amount);
renderAmount();

// ---------- Fractional calculator: type any amount, pick a company, see the exact fraction (and the phone follows).
const STOCKS = [['NVDA', 'NVIDIA', 'nvidia', 'Nasdaq'], ['AAPL', 'Apple', 'apple', 'Nasdaq'], ['TSLA', 'Tesla', 'tesla', 'Nasdaq'], ['META', 'Meta', 'meta', 'Nasdaq'], ['NFLX', 'Netflix', 'netflix', 'Nasdaq'], ['KO', 'Coca-Cola', 'cocacola', 'NYSE']];
const logoUrl = (logo) => `url(${import.meta.env.BASE_URL}logos/${logo}.svg)`;
let sel = 'NVDA';
const qtyText = (q) => (q < 1 ? q.toFixed(4) : q.toFixed(q < 100 ? 3 : 1));
const ringOffset = (q) => (100 - (q >= 1 && q % 1 < 0.0005 ? 100 : (q % 1) * 100)).toFixed(2); // a whole share closes the ring
const pick = $('#calc-pick');
pick.innerHTML = STOCKS.map(([sym, name, logo]) => `<button type="button" role="radio" data-sym="${sym}"><span class="ring-wrap"><svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-track" cx="60" cy="60" r="52"/><circle class="ring-fill" cx="60" cy="60" r="52" pathLength="100"/></svg><span class="logo" style="--logo: ${logoUrl(logo)}"></span></span><span class="sr-only">${name}, </span><b class="pick-qty"></b> <small>${sym}</small></button>`).join('');
function paintFrac(v, pop) {
  const [sym, name, logo, exch] = STOCKS.find((s) => s[0] === sel);
  const px = REF_PRICES[sym], q = v / px;
  bind('qty', qtyText(q));
  bind('qtyUnit', q < 1 ? 'of a share of' : q < 2 ? 'share of' : 'shares of');
  bind('wholeNote', q >= 1 ? ` · ${Math.floor(q)} whole + ${(q % 1).toFixed(2)}` : '');
  bind('sym', sym); bind('stockName', name); bind('exch', exch); bind('px', px.toFixed(2));
  bind('amtFinal', v.toLocaleString('en-US', { maximumFractionDigits: 2 }));
  bind('amtInrFinal', Math.round(v * FX).toLocaleString('en-IN'));
  $('#ring-logo').style.setProperty('--logo', logoUrl(logo));
  $('#ring-main').style.strokeDashoffset = ringOffset(q);
  pick.querySelectorAll('button').forEach((b) => {
    const pq = v / REF_PRICES[b.dataset.sym];
    b.setAttribute('aria-checked', String(b.dataset.sym === sel));
    b.querySelector('.ring-fill').style.strokeDashoffset = ringOffset(pq);
    b.querySelector('.pick-qty').textContent = qtyText(pq);
  });
  ringTo(sel, pop);
}
pick.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { sel = b.dataset.sym; paintFrac(amount, true); noteCalc('calc_pick'); } });
// Calculator events: what people try is a leading signal for who signs up (and which stocks to lead with).
const noteCalc = (event) => { Object.assign(calcContext, { calc_amount: amount, calc_sym: sel }); track(event, { amount, sym: sel }); };
let calcTimer = 0;
// The calculator's answer leads straight to the form: the amount and stock travel with the lead.
$('#calc-cta').addEventListener('click', (e) => {
  e.preventDefault();
  noteCalc('calc_cta_click');
  const form = $('#lead'), field = $('#mobile');
  form.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  setTimeout(() => { field.focus({ preventScroll: true }); form.classList.add('is-primed'); setTimeout(() => form.classList.remove('is-primed'), 1600); }, reducedMotion ? 0 : 600);
});
// Typed amounts: digits and one decimal point, $1 to $1,000,000 (the order minimum and a sane ceiling).
const calcIn = $('#calc-amt');
calcIn.addEventListener('input', () => {
  const clean = calcIn.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.\d{0,2}).*$/, '$1');
  if (clean !== calcIn.value) calcIn.value = clean;
  const v = Math.min(1e6, Number(clean) || 0);
  const ok = v >= 1;
  calcIn.closest('.calc').classList.toggle('is-invalid', !ok);
  $('#calc-hint').lastChild.textContent = ok ? ' · type any amount from $1' : ' · the minimum is $1';
  if (!ok) return;
  amount = v; renderAmount(); paintFrac(v);
  clearTimeout(calcTimer); calcTimer = setTimeout(() => noteCalc('calc_input'), 900); // once the visitor stops typing
});
calcIn.addEventListener('blur', () => { if (!(Number(calcIn.value) >= 1)) { calcIn.value = String(amount); calcIn.closest('.calc').classList.remove('is-invalid'); $('#calc-hint').lastChild.textContent = ' · type any amount from $1'; } });
// ---------- Card ring (after gettakecontrol.app's hero). The selected stock's card sits on the phone, wider than its
// screen; the other leaders bend away around a tilted 3D cylinder. Each card is cut into thin vertical slices, each
// turned a little further, so the cards curve with the ring (the reference builds its cards the same way).
// The intro spins the ring once when it comes into view (the pill names each sector); after that, picking a company in
// the calculator turns the ring to it.
const ringEl = $('#ring'), ringStage = $('#ring-stage'), ringTrack = $('#ring-track'), ringPill = $('#ring-pill');
const RING = [['NVDA', 'NVIDIA', 'nvidia', 'Nasdaq', 'AI chips'], ['AAPL', 'Apple', 'apple', 'Nasdaq', 'Consumer tech'], ['TSLA', 'Tesla', 'tesla', 'Nasdaq', 'EVs'], ['META', 'Meta', 'meta', 'Nasdaq', 'Social'],
  ['NFLX', 'Netflix', 'netflix', 'Nasdaq', 'Streaming'], ['KO', 'Coca-Cola', 'cocacola', 'NYSE', 'Beverages'], ['GOOGL', 'Alphabet', 'google', 'Nasdaq', 'Search and cloud'], ['AMZN', 'Amazon', 'amazon', 'Nasdaq', 'E-commerce']];
const STEP = (2 * Math.PI) / RING.length;
const geo = () => (innerWidth < 900 ? { r: 360, w: 272, h: 142, n: 12 } : { r: 480, w: 360, h: 160, n: 14 }); // card arc (w / r) stays under the 45° step, or neighbours overlap
let ringGeo = null, rot = 0, rotTarget = 0, spread = 1, ringRaf = 0, scrollTurning = false;
const cardHTML = ([sym, name, logo, exch]) => `<div class="rcard"><span class="rc-logo"><span class="logo" style="--logo: ${logoUrl(logo)}"></span></span><div class="rc-body"><b class="rc-name">${name}</b><span class="rc-sym">${sym} · ${exch}</span></div><p class="rc-own">You’d own <b class="rc-qty"></b> for <b class="rc-amt"></b>.</p><div class="rc-chips"><span>Price $${REF_PRICES[sym].toFixed(2)}</span><span>From $1</span></div></div>`;
function buildRing() {
  ringGeo = geo();
  const { r, w, h, n } = ringGeo, arc = w / r, d = arc / n, sw = 2 * r * Math.tan(d / 2) + 0.6; // +0.6 px: no hairline seams
  ringEl.innerHTML = RING.map((c, i) => `<div class="rgroup" data-sym="${c[0]}" style="transform: rotateY(${((i * STEP * 180) / Math.PI).toFixed(3)}deg)">${Array.from({ length: n }, (_, j) => `<div class="rslice" style="width:${sw.toFixed(2)}px;height:${h}px;margin:${-h / 2}px 0 0 ${(-sw / 2).toFixed(2)}px;transform: rotateY(${(((j - (n - 1) / 2) * d * 180) / Math.PI).toFixed(3)}deg) translateZ(${r}px)"><div style="position:absolute;top:0;left:${(-j * (w / n)).toFixed(2)}px;width:${w}px;height:${h}px">${cardHTML(c)}</div></div>`).join('')}</div>`).join('');
  ringStage.style.setProperty('--ring-r', `${r}px`);
  fillRing();
}
function fillRing() {
  ringEl.querySelectorAll('.rgroup').forEach((g) => {
    const q = amount / REF_PRICES[g.dataset.sym];
    g.querySelectorAll('.rc-qty').forEach((e) => { e.textContent = `${qtyText(q)} sh`; });
    g.querySelectorAll('.rc-amt').forEach((e) => { e.textContent = usd.format(amount).replace('.00', ''); });
  });
}
function layoutRing() {
  ringEl.style.transform = `translateZ(${-ringGeo.r}px) rotateX(-4deg) rotateY(${((-rot * 180) / Math.PI).toFixed(3)}deg)`;
  ringEl.querySelectorAll('.rgroup').forEach((g, i) => {
    let th = i * STEP - rot; th = Math.atan2(Math.sin(th), Math.cos(th));
    g.style.transform = `rotateY(${(((rot + th * spread) * 180) / Math.PI).toFixed(3)}deg)`; // spread < 1: cards gather behind the front one
    g.classList.toggle('is-front', Math.cos(th) > 0.97);
  });
}
function turnRing() {
  ringRaf = 0;
  const d = rotTarget - rot;
  rot = Math.abs(d) < 0.002 || reducedMotion ? rotTarget : rot + d * 0.14;
  layoutRing();
  if (rot !== rotTarget) ringRaf = requestAnimationFrame(turnRing);
}
function ringTo(sym, pop) {
  fillRing();
  const [, , , , sector] = RING.find((s) => s[0] === sym) || RING[0];
  bind('sector', sector);
  if (pop && !reducedMotion) { ringPill.classList.remove('is-pop'); void ringPill.offsetWidth; ringPill.classList.add('is-pop'); }
  if (scrollTurning) return; // the intro owns the rotation while it plays
  const target = RING.findIndex((s) => s[0] === sym) * STEP;
  rotTarget += Math.atan2(Math.sin(target - rotTarget), Math.cos(target - rotTarget)); // the short way round
  if (!ringRaf) ringRaf = requestAnimationFrame(turnRing);
}
const ease = (t) => 1 - Math.pow(1 - t, 3), easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Intro, once per visit: as soon as the phone is a quarter on screen it rises, the cards fan out of the front card and
// the ring makes one quick full turn (the pill flicks through the sectors), then settles on the selection.
const ringIntro = () => {
  const t0 = performance.now(), D = 2400, start = rot;
  let lastK = -1;
  scrollTurning = true; // calculator picks wait for the turn to finish
  const frame = (now) => {
    const t = Math.min(1, (now - t0) / D);
    spread = ease(Math.min(1, t / 0.3));
    ringStage.style.setProperty('--rise', (1 - spread).toFixed(3));
    rot = start + easeInOut(Math.max(0, (t - 0.12) / 0.88)) * 2 * Math.PI;
    const k = ((Math.round(rot / STEP) % RING.length) + RING.length) % RING.length;
    if (k !== lastK) { lastK = k; bind('sector', RING[k][4]); }
    layoutRing();
    if (t < 1) { requestAnimationFrame(frame); return; }
    rot = rotTarget = start; scrollTurning = false; layoutRing(); ringTo(sel, true);
    ringStage.dataset.intro = 'done';
  };
  requestAnimationFrame(frame);
};
const showRingStill = () => { spread = 1; ringStage.style.setProperty('--rise', '0'); layoutRing(); ringStage.dataset.intro = 'done'; };
const onRingResize = () => {
  const g = geo();
  if (!ringGeo || g.r !== ringGeo.r) buildRing();
  const slot = ringStage.querySelector('.rs-slot'), rise = getComputedStyle(ringStage).getPropertyValue('--rise');
  ringStage.style.setProperty('--rise', '0');
  ringStage.style.setProperty('--ring-y', `${Math.round(slot.getBoundingClientRect().top + slot.offsetHeight / 2 - ringStage.getBoundingClientRect().top)}px`);
  ringStage.style.setProperty('--rise', rise);
  layoutRing();
};
window.addEventListener('resize', onRingResize, { passive: true });
document.fonts?.ready.then(onRingResize);
buildRing();
rot = rotTarget = RING.findIndex((s) => s[0] === sel) * STEP;
onRingResize();
if (reducedMotion || document.documentElement.classList.contains('motion-paused')) showRingStill();
else {
  spread = 0; ringStage.style.setProperty('--rise', '1'); layoutRing();
  new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); ringIntro(); } }, { threshold: 0.25 }).observe(ringStage);
}
{ const hr = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  bind('greeting', hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'); }

paintFrac(amount);
// ---------- Four layers: the first time the route is seen, a dot runs from your rupees to the US market and each
// checkpoint lights as it passes. Without JS, or with reduced motion / Pause motion, every checkpoint is simply lit.
const gates = $('.gates');
if (gates && !reducedMotion && !root.classList.contains('motion-paused')) {
  gates.classList.add('is-run');
  const rail = gates.querySelector('.gate-rail'), checks = [...gates.querySelectorAll('.gate')];
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    const vertical = getComputedStyle(gates.querySelector('.gate-row')).gridTemplateColumns.split(' ').length === 1;
    const r = rail.getBoundingClientRect();
    const at = checks.map((g) => { const c = g.querySelector('.gate-check').getBoundingClientRect(); return vertical ? (c.top + c.height / 2 - r.top) / r.height : (c.left + c.width / 2 - r.left) / r.width; });
    const t0 = performance.now(), D = 2600;
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / D), p = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      gates.style.setProperty('--run', p.toFixed(4));
      checks.forEach((g, i) => g.classList.toggle('is-lit', p >= at[i] - 0.01));
      if (t < 1) requestAnimationFrame(frame); else gates.classList.add('is-done');
    };
    requestAnimationFrame(frame);
  }, { threshold: 0.45 }).observe(gates);
}

// ---------- Diagrams (money routes, session timeline, protection layers) reveal when first seen
const laneObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); laneObserver.unobserve(e.target); } });
}, { threshold: 0.35 });
document.querySelectorAll('.lane, .session, .layers, .phone-stage, .stairs').forEach((el) => laneObserver.observe(el)); // diagrams reveal in sequence when first seen

// ---------- The page unfolds: every block rises in as it enters the viewport, staggered within its group.
const REVEAL = ['.section-head', '.stats > .stat', '.ticker', '.product-copy .features > li', '.orders > *', '.bento > .tile',
  '.eligibility', '.trust-head', '.tabs', '#rows-panel', '.popular-foot', '.pricing-head', '.pricing-body > *', '.prices',
  '.tax-item', '.faq .split-top > div:first-child', '.faq-item', '.cta-inner > *'].join(', ');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-up'); revealObserver.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
document.querySelectorAll(REVEAL).forEach((el) => {
  const sibs = [...el.parentElement.children].filter((c) => c.matches(REVEAL));
  el.style.setProperty('--i', Math.min(sibs.indexOf(el), 5));
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// ---------- Popular stocks by sector
const sectors = {
  Technology: [['Apple', 'AAPL', 'apple'], ['NVIDIA', 'NVDA', 'nvidia'], ['Broadcom', 'AVGO', 'broadcom'], ['Alphabet', 'GOOGL', 'google'], ['Meta', 'META', 'meta']],
  Consumer: [['Amazon', 'AMZN', 'amazon'], ['Tesla', 'TSLA', 'tesla'], ['Netflix', 'NFLX', 'netflix'], ['Coca-Cola', 'KO', 'cocacola'], ['Starbucks', 'SBUX', 'starbucks']],
  Financials: [['Visa', 'V', 'visa'], ['Mastercard', 'MA', 'mastercard'], ['Goldman Sachs', 'GS', 'goldmansachs'], ['Bank of America', 'BAC', 'bankofamerica'], ['American Express', 'AXP', 'americanexpress']],
  Healthcare: [['Eli Lilly', 'LLY'], ['Johnson & Johnson', 'JNJ'], ['UnitedHealth', 'UNH'], ['AbbVie', 'ABBV'], ['Merck', 'MRK']],
  ETFs: [['S&P 500 ETF', 'SPY'], ['Nasdaq-100 ETF', 'QQQ'], ['Vanguard S&P 500', 'VOO'], ['Total Stock Market', 'VTI'], ['Core S&P 500', 'IVV']],
};
const esc = (s) => s.replace(/&/g, '&amp;');
// Listing venue per ticker (Nasdaq unless listed here).
const VENUE = { KO: 'NYSE', V: 'NYSE', MA: 'NYSE', GS: 'NYSE', BAC: 'NYSE', AXP: 'NYSE', LLY: 'NYSE', JNJ: 'NYSE', UNH: 'NYSE', ABBV: 'NYSE', MRK: 'NYSE', SPY: 'NYSE Arca', VOO: 'NYSE Arca', VTI: 'NYSE Arca', IVV: 'NYSE Arca' };
const WIDE = new Set(['visa', 'goldmansachs']); // wordmarks in square viewBoxes: size their mask by width
const CHEVRON = '<svg class="stock-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
// "Tonight on Wall Street": a split-flap board. Tickers flip letter by letter into place; no prices, so nothing reads as a quote.
const GO = '<svg class="link-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
const session = () => $('.when [data-bind="sessionText"]')?.textContent || '7:00\u00a0pm – 1:30\u00a0am';
function boardRow([name, ticker, logo]) {
  const cells = [...ticker.padEnd(5)].map((c) => `<span class="flap">${c === ' ' ? '' : c}</span>`).join('');
  const mark = logo ? `<span class="logo${WIDE.has(logo) ? ' logo-wide' : ''}" style="--logo: url(${import.meta.env.BASE_URL}logos/${logo}.svg)"></span>` : `<span class="board-mono" aria-hidden="true">${ticker.slice(0, 2)}</span>`;
  return `<tr>
    <td class="b-tick"><span class="sr-only">${ticker}</span><span class="flaps" aria-hidden="true" data-t="${ticker.padEnd(5)}">${cells}</span></td>
    <td class="b-co"><span class="b-co-in">${mark}<span>${esc(name)}</span></span></td>
    <td class="b-ex">${VENUE[ticker] || 'Nasdaq'}</td>
    <td class="b-tr"><span data-bind="sessionText">${session()}</span>&nbsp;IST</td>
    <td class="b-go"><a class="text-link board-go" href="#lead">From $1${GO}</a></td>
  </tr>`;
}
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let boardSeen = false;
function flipBoard() {
  if (!boardSeen || reducedMotion) return;
  document.querySelectorAll('#rows .flaps').forEach((row, r) => {
    const target = row.dataset.t;
    row.querySelectorAll('.flap').forEach((cell, i) => {
      const settle = performance.now() + 260 + i * 80 + r * 110;
      const spin = setInterval(() => {
        const done = performance.now() >= settle;
        cell.textContent = done ? target[i].trim() : FLAP[(Math.random() * FLAP.length) | 0];
        cell.classList.remove('is-flip'); void cell.offsetWidth; cell.classList.add('is-flip');
        if (done) clearInterval(spin);
      }, 55);
    });
  });
}
new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { boardSeen = true; flipBoard(); obs.disconnect(); } }, { threshold: 0.35 }).observe($('#rows-panel'));
let sector = 'Technology';
const tabs = $('#tabs');
const rows = $('#rows');
const panel = $('#rows-panel');
const slug = (name) => `tab-${name.toLowerCase()}`;
function renderSector(focus = false) {
  // WAI-ARIA tabs: roving tabindex, arrow/Home/End keys, tab ↔ panel linked.
  tabs.innerHTML = Object.keys(sectors).map((name) => {
    const on = name === sector;
    return `<button type="button" class="tab" role="tab" id="${slug(name)}" data-s="${name}" aria-selected="${on}" aria-controls="rows-panel" tabindex="${on ? 0 : -1}">${name}</button>`;
  }).join('');
  panel.setAttribute('aria-labelledby', slug(sector));
  rows.innerHTML = sectors[sector].map(boardRow).join('');
  flipBoard();
  if (focus) document.getElementById(slug(sector)).focus();
}
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) { sector = b.dataset.s; renderSector(true); }
});
tabs.addEventListener('keydown', (e) => {
  const names = Object.keys(sectors);
  const i = names.indexOf(sector);
  const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: names.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  sector = names[(next + names.length) % names.length];
  renderSector(true);
});
renderSector();

// ---------- FAQ
// Markup lives in index.html (readable without JS and by crawlers); this only toggles it.
const faqList = $('#faqs');
faqList.addEventListener('click', (e) => {
  const q = e.target.closest('.faq-q');
  if (!q) return;
  const open = q.getAttribute('aria-expanded') === 'true';
  q.setAttribute('aria-expanded', String(!open));
  if (!open) track('faq_open', { question: q.textContent.trim().slice(0, 80) });
  document.getElementById(q.getAttribute('aria-controls')).classList.toggle('is-open', !open);
});

// ---------- Engagement events: which sections are seen, how far people scroll, which buttons lead to the form.
const sectionSeen = new IntersectionObserver((entries, obs) => entries.forEach((e) => {
  if (e.isIntersecting) { track('section_view', { section: e.target.id }); obs.unobserve(e.target); }
}), { threshold: 0.35 });
document.querySelectorAll('main section[id]').forEach((sec) => sectionSeen.observe(sec));
const depths = [25, 50, 75, 100];
window.addEventListener('scroll', () => {
  const pct = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
  while (depths.length && pct >= depths[0] - 0.5) track('scroll_depth', { percent: depths.shift() });
}, { passive: true });
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href="#lead"], a[href="#lead-2"]');
  if (a && a.id !== 'calc-cta') track('cta_click', { label: a.textContent.trim().slice(0, 40), from: a.closest('section[id], header, footer')?.id || a.closest('header, footer')?.tagName.toLowerCase() || 'page' });
});
