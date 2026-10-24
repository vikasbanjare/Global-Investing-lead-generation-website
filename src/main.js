import './style.css';
import { marketStatus, cityTime, REF_PRICES } from './market.js';
import { sparkFor } from './v/kit.js'; // the shared smooth chart helper

const $ = (s, root = document) => root.querySelector(s);
const bind = (key, value) => document.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => { el.textContent = value; });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
document.documentElement.classList.add('js'); // reveal styles only apply when JS can undo them
document.addEventListener('touchstart', () => {}, { passive: true }); // lets :active fire on iOS (the leaders board)

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
const narrow = matchMedia('(width <= 900px)');
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
  label.style.transform = 'translate(-50%, calc(-100% - 2px))'; // sits just above the pin, clear of the map credit chip
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
document.querySelectorAll('.ticker, .tile-marks, .explorer').forEach((el) => lazyLogos.observe(el));

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
// Looping CSS animations stop while their section is off-screen (style.css: .is-off).
const offscreen = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)));
document.querySelectorAll('main > section').forEach((s) => offscreen.observe(s));
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
// ponytail: resolves at once until the CRM endpoint exists; the loading/failure states below already work with a real POST.
const sendLead = (mobile, source) => Promise.resolve({ mobile, source }); // TODO(lead-endpoint): fetch('/api/leads', { method: 'POST', body: JSON.stringify({ mobile, source }) })
function setupCapture(formSel, sentSel, errorSel, editSel) {
  const form = $(formSel), sent = $(sentSel), error = $(errorSel), field = form.querySelector('input'), BAD = error.textContent;
  field.addEventListener('focus', () => track('lead_focus', { form: form.id }), { once: true });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const digits = field.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const valid = /^[6-9]\d{9}$/.test(digits);
    error.hidden = valid;
    field.setAttribute('aria-invalid', String(!valid));
    track(valid ? 'lead_submit_valid' : 'lead_submit_invalid', { form: form.id });
    if (!valid) { error.textContent = BAD; field.focus(); return; }
    const btn = form.querySelector('[type=submit]');
    if (btn.disabled) return; // no double submit while sending
    btn.disabled = true; form.setAttribute('aria-busy', 'true');
    sendLead(digits, form.id)
      .then(() => { form.hidden = true; sent.hidden = false; }, () => { error.textContent = 'We couldn’t send that. Check your connection and try again.'; error.hidden = false; })
      .finally(() => { btn.disabled = false; form.removeAttribute('aria-busy'); });
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
  input.focus({ preventScroll: true }); // inside the tap, so iOS opens the keyboard
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
});

// ---------- Diagrams (money routes, the four-step journey) reveal when first seen
const laneObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); laneObserver.unobserve(e.target); } });
}, { threshold: 0.35 });
document.querySelectorAll('.lane, .journey, .sector-cols').forEach((el) => laneObserver.observe(el)); // diagrams reveal in sequence when first seen

// ---------- The page unfolds: every block rises in as it enters the viewport, staggered within its group.
const REVEAL = ['.section-head', '.ticker', '.explorer', '.orders > *', '.bento > .tile', '.eligibility', '.popular-foot',
  '.pricing-head', '.benefits > li', '.charges', '.tax-item', '.faq-item', '.cta-inner > *'].join(', ');
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
  Financials: [['Visa', 'V', 'visa'], ['Mastercard', 'MA', 'mastercard'], ['Goldman Sachs', 'GS'], ['Bank of America', 'BAC', 'bankofamerica'], ['American Express', 'AXP']],
  Consumer: [['Tesla', 'TSLA', 'tesla'], ['Netflix', 'NFLX', 'netflix'], ['Coca-Cola', 'KO', 'cocacola'], ['Starbucks', 'SBUX', 'starbucks'], ['McDonald’s', 'MCD', 'mcdonalds']],
  Energy: [['Exxon Mobil', 'XOM'], ['Chevron', 'CVX'], ['ConocoPhillips', 'COP'], ['NextEra Energy', 'NEE'], ['SLB', 'SLB']],
  ETFs: [['S&P 500 ETF', 'SPY'], ['Nasdaq-100 ETF', 'QQQ'], ['Vanguard S&P 500', 'VOO'], ['Total Stock Market', 'VTI'], ['Core S&P 500', 'IVV']],
};
const esc = (s) => s.replace(/&/g, '&amp;');
const WIDE = new Set(['visa']); // wordmarks in square viewBoxes: size their mask by width
// ponytail: no mark SVG yet (LLY, JNJ, UNH, ABBV, MRK, energy, ETF issuers; GS/AXP wordmarks are illegible at 36px) → the
// disc shows the ticker. Add the slug as the 3rd item once public/logos has a square mark.
const GO = '<svg class="link-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
// One light column per sector (after Dhan's sector columns). Each row: Company, Ticker, Price (USD), 1D %, and the whole
// row is the Invest link. Prices are illustrative reference values (REF_PRICES) with a stable pseudo day-change per ticker.
const SECTOR_ICON = {
  Technology: '<rect x="5" y="5" width="10" height="10" rx="2"/><path d="M8 2v3M12 2v3M8 15v3M12 15v3M2 8h3M2 12h3M15 8h3M15 12h3"/>',
  Healthcare: '<path d="M10 16.5s-6-3.6-6-8.2A3.3 3.3 0 0 1 10 6.4a3.3 3.3 0 0 1 6 1.9c0 4.6-6 8.2-6 8.2Z"/>',
  Financials: '<path d="M3 8h14L10 3.5 3 8ZM5 8v6M8.3 8v6M11.7 8v6M15 8v6M3 16.5h14"/>',
  Consumer: '<path d="M4.5 7h11l-1 9.5h-9L4.5 7ZM7.5 7V5.5a2.5 2.5 0 0 1 5 0V7"/>',
  Energy: '<path d="M11 2.5 4.5 11.5H10l-1 6 6.5-9H10l1-6Z"/>',
  ETFs: '<path d="m10 3 7 3.8-7 3.8-7-3.8L10 3ZM3 10.2l7 3.8 7-3.8M3 13.6l7 3.8 7-3.8"/>',
};
const dayChange = (t) => { let h = 7; for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 997; return ((h % 400) - 160) / 100; };
function sectorRow([name, ticker, logo], i) {
  const mark = logo ? `<span class="logo${WIDE.has(logo) ? ' logo-wide' : ''}" style="--logo: url(${import.meta.env.BASE_URL}logos/${logo}.svg)"></span>` : `<span class="sc-mono">${ticker}</span>`;
  const px = REF_PRICES[ticker], ch = dayChange(ticker);
  return `<li style="--i: ${i}"><a class="sc-row" href="#lead" aria-label="Invest in ${esc(name)} (${ticker})">
    <span class="sc-mark" aria-hidden="true">${mark}</span>
    <span class="sc-co"><b>${esc(name)}</b><small>${ticker}</small></span>
    <span class="sc-q"><b class="sc-px">${px ? usd.format(px) : '—'}</b><span class="sc-ch ${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(2)}%</span></span>
    <span class="sc-go" aria-hidden="true">Invest${GO}</span>
  </a></li>`;
}
const cols = $('#sector-cols');
cols.innerHTML = Object.entries(sectors).map(([name, list]) => `<section class="sc" aria-label="${name}">
  <h3 class="sc-head"><svg viewBox="0 0 20 20" aria-hidden="true">${SECTOR_ICON[name]}</svg>${name}<span class="sc-cols-label" aria-hidden="true">USD · 1D</span></h3>
  <ul class="sc-list">${list.map(sectorRow).join('')}</ul>
</section>`).join('');
// Arrows page one column at a time; they disable at either end (state read on scroll, nothing animates from it).
const scBtns = document.querySelectorAll('.sc-btn');
const scEnds = () => {
  const max = cols.scrollWidth - cols.clientWidth - 2;
  scBtns[0].disabled = cols.scrollLeft <= 2;
  scBtns[1].disabled = cols.scrollLeft >= max;
};
scBtns.forEach((b) => b.addEventListener('click', () => {
  const step = cols.querySelector('.sc').offsetWidth + 16;
  cols.scrollBy({ left: step * Number(b.dataset.dir), behavior: reducedMotion ? 'auto' : 'smooth' });
}));
cols.addEventListener('scroll', scEnds, { passive: true });
addEventListener('resize', scEnds);
scEnds();

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
  const mine = document.querySelector('script[type="module"][src*="/assets/main-"]')?.getAttribute('src');
  setTimeout(() => fetch(location.pathname, { cache: 'no-store' }).then((r) => r.text()).then((html) => {
    const latest = /<script[^>]+type="module"[^>]+src="([^"]*\/assets\/main-[^"]+)"/.exec(html)?.[1];
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

// ---------- Global investing made simple: a feature explorer. Four tabs, each with a small live demo; it cycles every
// 6 s while on screen until the visitor takes over (click, key, slider, hover).
const ex = document.querySelector('.explorer');
if (ex) {
  const tabs = [...ex.querySelectorAll('.ex-tab')], demos = [...ex.querySelectorAll('.ex-demo')], panel = ex.querySelector('.ex-stage'), list = ex.querySelector('.ex-list');
  ex.querySelectorAll('[data-spark]').forEach((el) => { el.innerHTML = sparkFor(el.dataset.spark, 120, 32, { baseline: false }); });
  let k = 0, auto = !reducedMotion, timer = 0, typing = 0;
  const typeSearch = () => { // the search demo types its query
    clearInterval(typing);
    const el = ex.querySelector('#ex-typed'), q = 'AI and semiconductors';
    let i = 0; el.textContent = '';
    if (reducedMotion) { el.textContent = q; return; }
    typing = setInterval(() => { el.textContent = q.slice(0, ++i); if (i >= q.length) clearInterval(typing); }, 70);
  };
  const show = (n, focus) => {
    k = n;
    tabs.forEach((t, i) => { const on = i === n; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; t.classList.toggle('is-auto', on && auto); });
    demos.forEach((d, i) => d.classList.toggle('is-on', i === n));
    panel.setAttribute('aria-labelledby', tabs[n].id);
    if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tabs[n].offsetLeft - 8, behavior: reducedMotion ? 'auto' : 'smooth' });
    if (n === 1) typeSearch();
    if (focus) tabs[n].focus();
    clearTimeout(timer);
    if (auto) timer = setTimeout(() => show((k + 1) % tabs.length), 6000);
  };
  const stop = () => { auto = false; clearTimeout(timer); tabs.forEach((t) => t.classList.remove('is-auto')); };
  tabs.forEach((t, i) => t.addEventListener('click', () => { stop(); show(i); track('feature_tab', { feature: i + 1 }); }));
  ex.querySelector('.ex-list').addEventListener('keydown', (e) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); stop(); show((k + d + tabs.length) % tabs.length, true); }
  });
  ex.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') stop(); });
  list.addEventListener('pointerdown', stop, { passive: true });
  list.addEventListener('touchstart', stop, { passive: true });
  // Fractional: the slider sets the amount; each circle is one whole NVIDIA share and fills by the part you'd own
  // ($25 → a 14% wedge of the first; $500 → two full circles and most of a third).
  const slider = ex.querySelector('#ex-slider'), pies = [...ex.querySelectorAll('#ex-pies .pie')];
  const paintAmt = () => {
    const v = Number(slider.value), q = v / REF_PRICES.NVDA;
    ex.querySelector('#ex-amt').textContent = v;
    ex.querySelector('#ex-qty').textContent = q < 1 ? q.toFixed(4) : q.toFixed(3);
    ex.querySelector('#ex-unit').textContent = q < 1 ? 'of 1 NVIDIA share' : 'NVIDIA shares';
    pies.forEach((pie, i) => { const f = Math.min(1, Math.max(0, q - i)); pie.style.setProperty('--p', f.toFixed(4)); pie.classList.toggle('is-full', f >= 1); pie.classList.toggle('is-empty', f <= 0); });
    slider.style.setProperty('--v', `${((v - 1) / 499) * 100}%`);
  };
  slider.addEventListener('input', () => { stop(); paintAmt(); });
  paintAmt();
  // Holdings: flip USD and INR (illustrative rate).
  const ccy = ex.querySelector('#ex-ccy');
  ccy.addEventListener('click', () => {
    stop();
    const inr = ccy.getAttribute('aria-pressed') !== 'true';
    ccy.setAttribute('aria-pressed', String(inr));
    const fmt = (v) => (inr ? `₹${Math.round(v * 84).toLocaleString('en-IN')}` : `$${v.toFixed(2)}`);
    ex.querySelectorAll('.ex-hold em').forEach((e) => { e.textContent = fmt(Number(e.dataset.usd)); });
    ex.querySelector('#ex-total').textContent = fmt(312.4);
  });
  new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); show(0); } }, { threshold: 0.4 }).observe(ex);
}

// ---------- Order types: a 3D ring of bent cards that turns on its own while on screen, can be dragged left or right,
// and pauses on hover. The four types (from the screen-reader list in the HTML) each appear three times, so the ring is
// wide (gentle bend, near neighbours) and only the front card and its two neighbours ever show (narrow screens: the front
// card). It rests on each card, then turns to the next, so the visible cards are always whole and readable.
// Each card is cut into a few vertical slices on a cylinder, so it curves.
const oring = document.querySelector('#oring');
if (oring) {
  const ICON = {
    bolt: '<path d="M13 2.5 5.5 13H11l-1 8.5L17.5 11H12l1-8.5Z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    trigger: '<path d="M4 17l5-5 4 4 7-8"/><path d="M4 7h7" stroke-dasharray="2 2.5"/><circle cx="20" cy="8" r="1.6"/>',
    pie: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5A8.5 8.5 0 0 1 20.5 12Z"/>',
  };
  const items = [...oring.querySelectorAll('.oring-src li')].map((li) => ({ icon: li.dataset.icon, name: li.querySelector('b').textContent, rows: [...li.querySelectorAll('span')].map((sp) => [sp.firstChild.textContent.replace(':', '').trim(), sp.querySelector('em').textContent]) }));
  const cards = [...items, ...items, ...items];
  const STEP = (2 * Math.PI) / cards.length;
  const cyl = oring.querySelector('#oring-cyl'), stage = oring.querySelector('.oring-stage');
  const cardHTML = (c) => `<div class="ocard"><span class="oc-ico"><svg viewBox="0 0 24 24">${ICON[c.icon]}</svg></span><b class="oc-name">${c.name}</b><dl>${c.rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>`;
  const RAD = Math.PI / 180;
  const geo = () => {
    // widest card that keeps both resting neighbours wholly inside the stage (their projected outer edge is ≈1.4 card widths
    // from the centre); below 260px there is no room for neighbours, so only the front card shows
    const half = stage.clientWidth / 2, both = Math.floor((half - 48) / 1.4), phone = both < 260;
    const w = phone ? Math.round(Math.min(330, stage.clientWidth - 64)) : Math.min(330, both);
    // fade window (degrees from the front): fully opaque inside `full`, gone by `gone`
    return { w, r: Math.round((cards.length * (w + 40)) / (2 * Math.PI)), n: phone ? 6 : 8, full: (phone ? 8 : 30) * RAD, gone: (phone ? 24 : 54) * RAD };
  };
  // every card gets the height of the tallest one (measured at the real width, so no line is ever cut)
  const measure = (w) => {
    const box = document.createElement('div');
    box.innerHTML = items.map((c) => cardHTML(c).replace('class="ocard"', `class="ocard ocard-measure" style="width:${w}px"`)).join('');
    stage.append(box);
    const h = Math.max(...[...box.children].map((el) => el.offsetHeight));
    box.remove();
    return Math.ceil(h / 8) * 8;
  };
  let g = null, groups = [], rot = 0, target = 0, dwell = 0, painted = NaN, vel = 0, dragging = false, moved = 0, hover = false, visible = false, raf = 0, last = 0, lastX = 0;
  const build = () => {
    g = geo();
    const { r, w, n } = g, h = (g.h = measure(w)), d = w / r / n, sw = 2 * r * Math.tan(d / 2) + 0.6;
    cyl.innerHTML = cards.map((c, i) => `<div class="ogroup" style="transform: rotateY(${((i * STEP) / RAD).toFixed(3)}deg)">${Array.from({ length: n }, (_, j) => `<div class="oslice" style="width:${sw.toFixed(2)}px;height:${h}px;margin:${-h / 2}px 0 0 ${(-sw / 2).toFixed(2)}px;transform: rotateY(${(((j - (n - 1) / 2) * d) / RAD).toFixed(3)}deg) translateZ(${r}px)"><div style="position:absolute;top:0;left:${(-j * (w / n)).toFixed(2)}px;width:${w}px;height:${h}px">${cardHTML(c)}</div></div>`).join('')}</div>`).join('');
    groups = [...cyl.children];
    stage.style.setProperty('--card-h', `${h}px`);
    painted = NaN;
    paint();
  };
  const paint = () => {
    if (rot === painted) return; // nothing moved since the last frame
    painted = rot;
    cyl.style.transform = `translateZ(${-g.r}px) rotateY(${(-rot / RAD).toFixed(3)}deg)`; // no tilt: it would drop the front card r·sin(tilt) px into the clip
    groups.forEach((el, i) => {
      const th = Math.abs(Math.atan2(Math.sin(i * STEP - rot), Math.cos(i * STEP - rot)));
      const o = Math.min(1, Math.max(0, (g.gone - th) / (g.gone - g.full)));
      el.style.setProperty('--o', o.toFixed(3)); // opacity on the flat slices only (CSS): the 3D groups never flatten
      el.style.visibility = o > 0 ? '' : 'hidden';
      el.classList.toggle('is-front', th < STEP / 2);
    });
  };
  const DWELL = 3.2; // seconds each card rests at the front before the ring turns on (hover holds it)
  const tick = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (!dragging) {
      if (Math.abs(target - rot) < 0.001) { rot = target; if (!hover && (dwell += dt) > DWELL) { dwell = 0; target += STEP; } }
      else rot += (target - rot) * Math.min(1, dt * 5); // eased turn, ~0.7 s
    }
    paint();
    if (visible && !reducedMotion) raf = requestAnimationFrame(tick); else last = 0;
  };
  const run = () => { if (!raf && visible && !reducedMotion) raf = requestAnimationFrame(tick); };
  stage.addEventListener('pointerenter', () => { hover = true; });
  stage.addEventListener('pointerleave', () => { hover = false; });
  stage.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = e.clientX; stage.setPointerCapture(e.pointerId); stage.classList.add('is-drag'); });
  stage.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); rot -= dx / g.r; vel = (-dx / g.r) * 8; paint(); });
  const end = (e) => {
    if (!dragging) return;
    dragging = false; stage.classList.remove('is-drag');
    target = Math.round((rot + vel) / STEP) * STEP; dwell = 0; vel = 0; // settle on the nearest card (a flick carries on)
    if (reducedMotion) { rot = target; paint(); }
    if (e.type === 'pointerup' && moved > 8) track('order_ring_drag'); // a vertical swipe that starts here ends in pointercancel: not a drag
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(stage);
  let resizing = 0;
  addEventListener('resize', () => { cancelAnimationFrame(resizing); resizing = requestAnimationFrame(() => { if (geo().w !== g.w) build(); }); }, { passive: true });
  build();
  document.fonts?.ready.then(() => { if (measure(g.w) !== g.h) build(); }); // remeasure once the web font is in
}
