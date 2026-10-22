import './style.css';
import { marketStatus, cityTime, REF_PRICES } from './market.js';

const $ = (s, root = document) => root.querySelector(s);
const bind = (key, value) => document.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => { el.textContent = value; });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
document.documentElement.classList.add('js'); // reveal styles only apply when JS can undo them

// ---------- Hero city
// Desktop: live 3D (Three.js), started after load when the main thread is idle.
// Phones/tablets (≤900px): a pre-rendered poster of the same scene (scripts/render-poster.mjs), no WebGL.
const hero = $('.hero');
const canvas = $('.hero-canvas');
const label = $('.ws-label');
const poster = $('.hero-poster');
const POSTER_LABEL = { x: 0.521, y: 0.496 }; // from render-poster.mjs: fraction of the 1600×840 poster
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
// Start downloading the 3D code as soon as the page parses (desktop only); it is only run after load, when idle.
// The city's data is preloaded from index.html, so code and data arrive in parallel instead of one after the other.
const cityModule = narrow.matches && !forceLive ? null : import('./city.js');
let city = null; // the live scene's controls (layout, zoom, tilt), once it has started
const startCity = () => {
  if (live) return;
  live = true;
  hero.classList.add('is-live');
  label.removeAttribute('style');
  label.classList.remove('is-on');
  (cityModule || import('./city.js'))
    .then(({ createCity }) => {
      city = createCity({ canvas, label, reducedMotion, withClouds: !forceLive });
      if (!city) hero.classList.add('no-webgl');
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
  if (!tickerOn || document.hidden || reducedMotion) return;
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
}
tick();
setInterval(tick, 20_000);

// ---------- Lead capture (hero + closing band share the same behaviour)
// ponytail: front-end only. POST { mobile } to the lead endpoint (CRM) where marked.
// ---------- Funnel analytics. Events go to window.dataLayer (Google Tag Manager's standard queue), so whichever
// analytics/A-B tool m.Stock uses can read them; no third-party script is loaded here. Never includes the number.
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

// ---------- Diagrams (money routes, the four-step staircase) reveal when first seen
const laneObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); laneObserver.unobserve(e.target); } });
}, { threshold: 0.35 });
document.querySelectorAll('.lane, .stairs').forEach((el) => laneObserver.observe(el)); // diagrams reveal in sequence when first seen

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
  Technology: [['Apple', 'AAPL', 'apple'], ['Microsoft', 'MSFT', 'microsoft'], ['NVIDIA', 'NVDA', 'nvidia'], ['Alphabet', 'GOOGL', 'google'], ['Amazon', 'AMZN', 'amazon']],
  Healthcare: [['Eli Lilly', 'LLY'], ['Johnson & Johnson', 'JNJ'], ['UnitedHealth', 'UNH'], ['AbbVie', 'ABBV'], ['Merck', 'MRK']],
  Financials: [['Visa', 'V', 'visa'], ['Mastercard', 'MA', 'mastercard'], ['Goldman Sachs', 'GS', 'goldmansachs'], ['Bank of America', 'BAC', 'bankofamerica'], ['American Express', 'AXP', 'americanexpress']],
  Consumer: [['Tesla', 'TSLA', 'tesla'], ['Netflix', 'NFLX', 'netflix'], ['Coca-Cola', 'KO', 'cocacola'], ['Starbucks', 'SBUX', 'starbucks'], ['McDonald’s', 'MCD', 'mcdonalds']],
  Energy: [['Exxon Mobil', 'XOM'], ['Chevron', 'CVX'], ['ConocoPhillips', 'COP'], ['NextEra Energy', 'NEE'], ['SLB', 'SLB']],
  ETFs: [['S&P 500 ETF', 'SPY'], ['Nasdaq-100 ETF', 'QQQ'], ['Vanguard S&P 500', 'VOO'], ['Total Stock Market', 'VTI'], ['Core S&P 500', 'IVV']],
};
const esc = (s) => s.replace(/&/g, '&amp;');
const WIDE = new Set(['visa', 'goldmansachs']); // wordmarks in square viewBoxes: size their mask by width
// "Tonight on Wall Street": a split-flap board. Tickers flip letter by letter into place.
const GO = '<svg class="link-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
// Columns follow the reviewed copy: Company, Ticker (split-flap), Price (USD), 1D %, Invest. Prices are illustrative
// reference values (REF_PRICES) with a stable pseudo day-change per ticker, labelled as such under the board.
const dayChange = (t) => { let h = 7; for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 997; return ((h % 400) - 160) / 100; };
function boardRow([name, ticker, logo]) {
  const cells = [...ticker.padEnd(5)].map((c) => `<span class="flap">${c === ' ' ? '' : c}</span>`).join('');
  const mark = logo ? `<span class="logo${WIDE.has(logo) ? ' logo-wide' : ''}" style="--logo: url(${import.meta.env.BASE_URL}logos/${logo}.svg)"></span>` : `<span class="board-mono" aria-hidden="true">${ticker.slice(0, 2)}</span>`;
  const px = REF_PRICES[ticker], ch = dayChange(ticker);
  return `<tr>
    <td class="b-co"><span class="b-co-in">${mark}<span>${esc(name)}</span></span></td>
    <td class="b-tick"><span class="sr-only">${ticker}</span><span class="flaps" aria-hidden="true" data-t="${ticker.padEnd(5)}">${cells}</span></td>
    <td class="b-px">${px ? usd.format(px) : '—'}</td>
    <td class="b-ch"><span class="${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(2)}%</span></td>
    <td class="b-go"><a class="text-link board-go" href="#lead">Invest${GO}</a></td>
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
  if (a) track('cta_click', { label: a.textContent.trim().slice(0, 40), from: a.closest('section[id], header, footer')?.id || a.closest('header, footer')?.tagName.toLowerCase() || 'page' });
});

// ---------- Stale-page check (production). GitHub Pages lets browsers reuse the page for 10 minutes; after a deploy
// that can show an old version. Ask once, bypassing the cache, and reload if the page has been rebuilt since.
if (import.meta.env.PROD) {
  const mine = document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src');
  setTimeout(() => fetch(location.pathname, { cache: 'no-store' }).then((r) => r.text()).then((html) => {
    const latest = /<script[^>]+type="module"[^>]+src="([^"]*\/assets\/index-[^"]+)"/.exec(html)?.[1];
    if (mine && latest && latest !== mine && !sessionStorage.getItem('reloaded-for')) { sessionStorage.setItem('reloaded-for', latest); location.reload(); }
  }).catch(() => {}), 1500);
}

// ---------- Hero A/B (design preview): one button flips between A · Centred and B · Split. Remembered; ?hero= overrides.
// The inline script in index.html applies it before first paint; here the button label and the 3D camera follow.
const heroBtn = document.querySelector('.hero-switch');
const setHero = (mode, save) => {
  const split = mode === 'split';
  if (split) root.dataset.hero = 'split'; else delete root.dataset.hero;
  heroBtn.setAttribute('aria-label', `Hero layout: ${split ? 'B, split' : 'A, centred'}. Switch to ${split ? 'A, centred' : 'B, split'}`);
  city?.setLayout?.(mode);
  if (save) { try { localStorage.setItem('hero-layout', mode); } catch {} track('hero_layout', { layout: mode }); }
};
setHero(root.dataset.hero === 'split' ? 'split' : 'centred');
heroBtn.addEventListener('click', () => setHero(root.dataset.hero === 'split' ? 'centred' : 'split', true));
document.querySelector('.map-ctrl')?.addEventListener('click', (e) => {
  const b = e.target.closest('[data-map]');
  if (!b || !city) return;
  ({ in: () => city.zoomBy(0.85), out: () => city.zoomBy(1 / 0.85), up: () => city.tiltBy(-0.08), down: () => city.tiltBy(0.08), reset: () => city.resetView() })[b.dataset.map]();
});
