import './style.css';
import { marketStatus, cityTime, usSessionInIST, istClock, formatWait, REF_PRICES } from './market.js';

const $ = (s, root = document) => root.querySelector(s);
const bind = (key, value) => document.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => { el.textContent = value; });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js'); // reveal styles only apply when JS can undo them

// ---------- Hero city
// Desktop: live 3D (Three.js), started after load when the main thread is idle.
// Phones/tablets (≤900px): a pre-rendered poster of the same scene (scripts/render-poster.mjs), no WebGL.
const hero = $('.hero');
const canvas = $('.hero-canvas');
const label = $('.ws-label');
const poster = $('.hero-poster');
const POSTER_LABEL = { x: 0.521, y: 0.594 }; // from render-poster.mjs: fraction of the 1600×840 poster
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
  if (!tickerOn || document.hidden) return;
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
    track(valid ? 'lead_submit_valid' : 'lead_submit_invalid', { form: form.id });
    if (!valid) { field.focus(); return; }
    // TODO(lead-endpoint): fetch('/api/leads', { method: 'POST', body: JSON.stringify({ mobile: digits, source: form.id }) })
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
  if (b) { amount = Number(b.dataset.v); renderAmount(); paintFrac(amount, true); }
});
paintAmount(amount);
renderAmount();

// ---------- What the amount buys: one NVIDIA share as 100 squares, and the same money across other favourites.
const qtyText = (q) => (q < 1 ? q.toFixed(4) : `${q.toFixed(2)}`);
const FAVS = [['Apple', 'AAPL', 'apple'], ['Tesla', 'TSLA', 'tesla'], ['Meta', 'META', 'meta'], ['Netflix', 'NFLX', 'netflix'], ['Coca-Cola', 'KO', 'cocacola']];
const fracList = $('#frac-list');
fracList.innerHTML = FAVS.map(([name, sym, logo]) => `<li><span class="logo" style="--logo: url(${import.meta.env.BASE_URL}logos/${logo}.svg)"></span><span class="fl-name"><b>${name}</b><small>${sym} · $${REF_PRICES[sym].toFixed(2)}</small></span><span class="fl-bar"><i></i></span><b class="fl-qty"></b></li>`).join('');
function paintFrac(v, pop) {
  const q = v / REF_PRICES.NVDA, whole = Math.floor(q), part = q - whole;
  bind('nvdaQty', qtyText(q));
  bind('nvdaPx', REF_PRICES.NVDA.toFixed(2));
  bind('amtFinal', v);
  bind('amtInrFinal', Math.round(v * FX).toLocaleString('en-IN'));
  $('.frac-big span').textContent = q < 1 ? 'of an NVIDIA share' : 'NVIDIA shares';
  const tile = (f, label) => `<figure class="ftile"><span class="fgrid">${Array.from({ length: 100 }, (_, i) => `<i style="--o:${Math.max(0, Math.min(1, f * 100 - i)).toFixed(2)};--d:${i * 6}ms"></i>`).join('')}</span><figcaption>${label}</figcaption></figure>`;
  $('#frac-tiles').innerHTML = Array.from({ length: Math.min(whole, 3) }, () => tile(1, '1 share')).join('') + (part > 0.0005 ? tile(part, part.toFixed(4)) : '');
  fracList.querySelectorAll('li').forEach((li, k) => {
    const fq = v / REF_PRICES[FAVS[k][1]];
    li.querySelector('.fl-bar i').style.setProperty('--f', Math.min(1, fq).toFixed(3));
    li.querySelector('.fl-qty').textContent = fq < 1 ? `${fq.toFixed(4)} sh` : `${fq.toFixed(2)} sh`;
  });
  if (pop && !reducedMotion) { const f1 = $('.f1'); f1.classList.remove('pop'); void f1.offsetWidth; f1.classList.add('pop'); }
}
paintFrac(amount);

// ---------- Diagrams (money routes, session timeline, protection layers) reveal when first seen
const laneObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); laneObserver.unobserve(e.target); } });
}, { threshold: 0.35 });
document.querySelectorAll('.lane, .session, .layers, .phone-stage').forEach((el) => laneObserver.observe(el)); // diagrams reveal in sequence when first seen

// ---------- The page unfolds: every block rises in as it enters the viewport, staggered within its group.
const REVEAL = ['.section-head', '.stats > .stat', '.ticker', '.product-copy .features > li', '.orders > *', '.bento > .tile',
  '.eligibility', '.steps > li', '.trust-head', '.tabs', '#rows-panel', '.popular-foot', '.pricing-head', '.pricing-body > *', '.prices',
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
  document.getElementById(q.getAttribute('aria-controls')).classList.toggle('is-open', !open);
});
