// Shared by the design variations (/v2/–/v9/): copy, small renderers and the page behaviours every variation needs
// (lead forms, FAQ, market clocks, scroll reveals, off-screen pausing, analytics, the version switcher).
// Each variation imports this, renders its own sections into #app and brings its own stylesheet.
import { marketStatus, cityTime, REF_PRICES } from '../market.js';
import * as C from './content.js';

export { C, REF_PRICES, marketStatus, cityTime };
export const BASE = import.meta.env.BASE_URL;
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Illustrative quote: reference price plus a stable pseudo day-change per ticker (same numbers as the live page).
export const dayChange = (t) => { let h = 7; for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 997; return ((h % 400) - 160) / 100; };
export const quote = (t) => ({ px: REF_PRICES[t], ch: dayChange(t) });
export const pct = (ch) => `${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(2)}%`;

const WIDE = new Set(['visa', 'goldmansachs']);
export const logo = (slug, ticker = '') => (slug
  ? `<span class="logo${WIDE.has(slug) ? ' logo-wide' : ''}" style="--logo: url(${BASE}logos/${slug}.svg)" aria-hidden="true"></span>`
  : `<span class="logo-mono" aria-hidden="true">${ticker.slice(0, 2)}</span>`);

export const icon = {
  go: '<svg class="i-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  check: '<svg class="i-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.4 2.8 2.8L12.5 5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 4.5 5.6v5.6c0 4.6 3.1 8.6 7.5 10 4.4-1.4 7.5-5.4 7.5-10V5.6Z"/><path d="m8.6 12.2 2.4 2.4 4.5-4.6"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="3.6"/><path d="M3.5 19.5c.8-3.6 3.4-5.6 6.5-5.6s5.7 2 6.5 5.6M18 8v6M15 11h6"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 15l4-4 3 3 5-6"/><path d="M15 8h3v3"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5S14.6 18.1 12 20.5C9.4 18.1 8.2 15.3 8.2 12S9.4 5.9 12 3.5Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.4l-5.1 2.8L8 13.6 3.8 9.7l5.7-.7Z"/></svg>',
  swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l4 4v13H7Z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/></svg>',
};

// The MAPS lettering alone (no tagline), for decorative watermarks. fill: a colour or url(#gradient-id).
const MAPS_MARK = '<path d="M90.68,86.06S123.18,11.8,125.69,5.33h48.89c.04,9.89-6.47,130.97-6.45,140.94h-35.15l5.82-98.68s-39.61,92.43-42.24,98.68h-27.78l-12.46-98.68c-.96,4.47-14.11,70.41-21.29,98.68H0C3.64,133.67,30.43,12.59,32.55,5.33h47.07l11.04,80.73h.01Z"/><path d="M239.72,88.66l22.26-52.31,7.25,52.31h-29.51ZM272.95,117.75s2.49,22.99,3.39,28.52h37.22c-2.07-11.63-22.39-132.72-23.88-140.92h-47.11c-2.72,5.85-56.51,127.07-62.89,140.92h37.85c1.99-4.71,11.55-28.46,11.55-28.46l43.86-.04h.01Z"/><path d="M405.73,34.9c.93.63,1.79,1.37,2.56,2.26.36.42.7.86,1,1.32.19.28.33.58.49.87.1.19.23.38.33.57.2.41.36.84.54,1.3.04.1.09.19.12.29.19.52.33,1.08.45,1.64v.06c.51,2.34.57,5.02.15,8.02v-.03s-.03.1-.04.25c0,.07-.01.13-.03.23,0,.04-.01.13-.03.19-.01.12-.04.25-.06.39,0,.07-.03.17-.04.25-.03.15-.06.31-.1.48-.03.12-.06.25-.09.38-.04.17-.07.33-.12.52-.03.13-.07.29-.1.42-.04.19-.1.38-.16.58-.04.15-.1.32-.15.48-.06.2-.13.41-.2.63-.06.17-.12.35-.19.51-.07.22-.15.44-.23.64-.01.06-.04.1-.06.16,0,.04-.03.06-.04.1-1.44,3.55-4.28,6.21-7.76,7.61-.03,0-.04,0-.07.01-1.25.49-2.58.83-3.96.96-1.99.19-4.54.36-7.51.45l-12.3-.31h-.04c1.18-8.26,2.24-15.76,3.07-21.61.13-.93.26-1.83.38-2.68.32-2.23.6-4.13.8-5.67.06-.39.1-.73.15-1.06.09-.57.15-1.06.2-1.48.06-.39.1-.73.15-.99.07-.51.1-.79.1-.79h8.66c1.48,0,3,.04,4.53.17,2.27.2,4.53.6,6.61,1.4,1.03.39,2.04.9,2.95,1.51h.03v-.04ZM442.03,18.37c-9.34-10.78-25.38-13.02-37.26-13.02h-53.24c-.22,1.54-.97,6.77-2.07,14.36-.28,1.89-.57,3.94-.87,6.11-.31,2.17-.64,4.47-.99,6.88-.7,4.82-1.44,10.05-2.24,15.55-.23,1.63-.47,3.27-.71,4.95-.32,2.23-.65,4.5-.97,6.78-.54,3.71-1.08,7.49-1.62,11.29-.79,5.43-1.56,10.88-2.34,16.25-.38,2.6-.74,5.19-1.11,7.76-.35,2.39-.68,4.76-1.02,7.07-.36,2.58-.73,5.11-1.09,7.55-.17,1.18-.33,2.33-.49,3.48-.22,1.51-.44,3-.64,4.45-.04.26-.07.52-.12.79-.31,2.17-.61,4.25-.89,6.23-.06.39-.1.77-.16,1.13-.17,1.21-.35,2.39-.49,3.51-.03.2-.06.39-.09.6-.26,1.86-.51,3.61-.74,5.21-.31,2.07-.55,3.88-.79,5.46-.1.7-.2,1.35-.28,1.95-.06.39-.12.79-.16,1.13-.1.7-.19,1.3-.25,1.79-.03.25-.06.45-.09.64h35.34c.33-2.15,1.7-11.7,3.52-24.42.16-1.12.32-2.27.49-3.43.23-1.6.47-3.23.7-4.92.35-2.4.7-4.86,1.05-7.38.1-.77.22-1.56.33-2.34.28-1.95.55-3.93.84-5.92.17-1.22.35-2.46.52-3.7.17-1.21.35-2.43.52-3.64v-.1c4.73.06,14.54.13,19.96-.25,12.47-.89,11.87-1.09,14.23-1.41,2.18-.31,6.05-.95,6.05-.95,17.26-3.2,30.75-9.24,34.16-36.03.45-3.35.71-6.53.71-9.56,0-9.91-2.58-17.88-7.76-23.85h.01Z"/><path d="M537.26,68.57c-3.4-2.62-7.39-5.05-12-7.12-.16-.1-10.24-5.11-10.24-5.11l-.09-.04-.19-.1c-3.3-1.89-11.03-6.39-11.03-13.92,0-3.68,1.46-6.85,4.06-9.08,3.2-2.63,8.13-3.61,13.42-2.68,6.66,1.03,14.32,5.38,22.71,12.57,3.99-7.68,11.61-22.38,14.39-27.65-9.65-7.92-19-12.18-32.93-14.64-17.24-2.58-33.86,1.11-45.53,9.94-9.81,7.54-15.92,18.54-17.58,31.85-.25,2.3-.33,4.45-.33,6.56,0,6.27,4.93,16.66,5.78,16.76,7.19,11.77,30.31,15.67,41.96,31.94.36.51.61,1.08.86,1.64.71,1.62,1.08,3.32,1.08,5.11,0,.89-.06,1.73-.22,2.62-.58,3.16-2.2,5.75-4.73,7.55-5.19,3.62-12.53,2.82-17.64,1.94-12-2.08-21.56-11.19-29.28-18.77-4.86,7.89-15,24.43-18.23,29.77,14.2,12.94,29.51,20.84,45.76,23.11,16.43,2.46,32.71-1.24,44.79-10.14,10.55-7.81,17.16-19.16,19.18-32.84.67-3.96.95-7.67.74-11.22-1.19-19.6-14.73-28.08-14.73-28.08v.03Z"/>';
export const mapsMark = (fill = '#ff5400', cls = 'maps-mark', defs = '') => `<svg class="${cls}" viewBox="0 0 558.32 152" aria-hidden="true" focusable="false">${defs}<g fill="${fill}">${MAPS_MARK}</g></svg>`;
export const brandMark = (cls = 'brand') => `<img class="${cls}" src="${BASE}maps-logo.svg" alt="MAPS — Mirae Asset Portfolio Service" width="121" height="48">`;

export function header() {
  return `<a class="skip" href="#main">Skip to content</a>
<header class="vh"><div class="vw vh-in">
  <a href="#top" class="vh-home" aria-label="MAPS — Mirae Asset Portfolio Service, back to top">${brandMark()}</a>
  <nav class="vh-nav" aria-label="Primary">${C.nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>
  <a class="btn btn-primary btn-sm" href="#lead">${C.hero.cta}</a>
</div></header>`;
}

// Lead form: hero (#lead) and closing band (#lead-2) share markup and behaviour.
export function leadForm(id, button, labelledBy = '') {
  return `<form class="capture" id="${id}" novalidate${labelledBy ? ` aria-labelledby="${labelledBy}"` : ''}>
  <label class="sr-only" for="${id}-m">Mobile number</label>
  <span class="capture-cc">+91</span>
  <input id="${id}-m" name="mobile" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="Your mobile number" aria-describedby="${id}-err ${id}-note" required>
  <button class="btn btn-primary" type="submit">${button}</button>
</form>
<p class="capture-error" id="${id}-err" role="alert" hidden>Enter a 10-digit mobile number.</p>
<div class="capture capture-sent" id="${id}-sent" hidden role="status">
  <div><strong>Your account-opening link is on its way.</strong><span>Keep PAN, identity and address details ready.</span></div>
  <button class="btn btn-ghost btn-sm" type="button" data-edit="${id}">Edit number</button>
</div>
<p class="capture-note" id="${id}-note">We’ll send your account-opening link to this number. No spam: by continuing you agree to be contacted about your account, as set out in our <a href="#privacy">Privacy&nbsp;Policy</a>.</p>`;
}

export function faqList() {
  return `<div class="faq-list">${C.faq.items.map(([q, a], i) => `<div class="faq-item">
  <h3><button type="button" class="faq-q" aria-expanded="false" aria-controls="faq-${i}" id="faq-q-${i}">${esc(q)}</button></h3>
  <div class="faq-panel" id="faq-${i}" role="region" aria-labelledby="faq-q-${i}"><p>${esc(a)}</p></div>
</div>`).join('')}</div>`;
}

export function orderTable() {
  return `<table class="otable"><caption class="sr-only">${esc(C.orders.title)}</caption>
  <thead><tr>${C.orders.cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>
  <tbody>${C.orders.rows.map(([t, d, b]) => `<tr><th scope="row">${t}</th><td>${d}</td><td>${b}</td></tr>`).join('')}</tbody></table>`;
}

export function footer() {
  return `<footer class="vf"><div class="vw">
  <div class="vf-grid">
    <div>${brandMark('brand brand-foot')}<p>${C.footer.about}</p></div>
    ${C.footer.cols.map(([h, links]) => `<nav aria-label="${h}"><h3>${h}</h3>${links.map(([u, t]) => `<a href="${u}">${t}</a>`).join('')}</nav>`).join('')}
  </div>
  <p class="vf-fine">${C.footer.fine}</p>
</div></footer>`;
}

// ---------- behaviours
window.dataLayer = window.dataLayer || [];
export const track = (event, props = {}) => window.dataLayer.push({ event, ...props, variant: document.documentElement.dataset.variant });

// Lead send with loading, failure and no double submit. ponytail: sendLead resolves at once until the CRM endpoint
// exists; swap in the real POST and the states already work.
const FAIL = 'We couldn’t send that. Check your connection and try again.';
const sendLead = (mobile, source) => Promise.resolve({ mobile, source }); // TODO(lead-endpoint): POST { mobile, source } to the CRM
function submitLead(form, mobile, source, done, fail) {
  const btn = form.querySelector('[type=submit]');
  if (btn.disabled) return;
  btn.disabled = true; form.setAttribute('aria-busy', 'true');
  sendLead(mobile, source).then(done, fail).finally(() => { btn.disabled = false; form.removeAttribute('aria-busy'); });
}

function setupCaptures() {
  $$('form.capture').forEach((form) => {
    const id = form.id, field = form.querySelector('input'), error = $(`#${id}-err`), sent = $(`#${id}-sent`), BAD = error.textContent;
    field.addEventListener('focus', () => track('lead_focus', { form: id }), { once: true });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const digits = field.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      const valid = /^[6-9]\d{9}$/.test(digits);
      error.hidden = valid;
      field.setAttribute('aria-invalid', String(!valid));
      track(valid ? 'lead_submit_valid' : 'lead_submit_invalid', { form: id });
      if (!valid) { error.textContent = BAD; field.focus(); return; }
      submitLead(form, digits, id, () => { form.hidden = true; sent.hidden = false; }, () => { error.textContent = FAIL; error.hidden = false; });
    });
    field.addEventListener('input', () => { error.hidden = true; field.removeAttribute('aria-invalid'); });
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]');
    if (!b) return;
    const id = b.dataset.edit;
    $(`#${id}-sent`).hidden = true; $(`#${id}`).hidden = false; $(`#${id}-m`).focus();
  });
}

function setupFaq() {
  document.addEventListener('click', (e) => {
    const q = e.target.closest('.faq-q');
    if (!q) return;
    const open = q.getAttribute('aria-expanded') === 'true';
    q.setAttribute('aria-expanded', String(!open));
    $(`#${q.getAttribute('aria-controls')}`).classList.toggle('is-open', !open);
    if (!open) track('faq_open', { question: q.textContent.slice(0, 80) });
  });
}

export function tickClocks() {
  const now = new Date(), s = marketStatus(now);
  const set = (k, v) => $$(`[data-bind="${k}"]`).forEach((el) => { el.textContent = v; });
  set('ist', cityTime(now, 'Asia/Kolkata'));
  set('nyc', cityTime(now, 'America/New_York'));
  set('status', s.text);
  $$('[data-market-dot]').forEach((d) => d.classList.toggle('is-open', s.open));
  return s;
}

// One-shot reveal for anything marked .rv (staggered by --i), and loops paused while their section is off-screen.
function setupMotion() {
  const rv = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); rv.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach((el) => rv.observe(el));
  // Every top-level block of main (a section, or a band div wrapping sections) and every section inside one.
  // CSS loops pause via .is-off; SMIL animations (which CSS cannot pause) pause with their block too.
  const off = new IntersectionObserver((es) => es.forEach((e) => {
    e.target.classList.toggle('is-off', !e.isIntersecting);
    e.target.querySelectorAll('animate, animateMotion, animateTransform').forEach((a) => {
      const svg = a.ownerSVGElement;
      if (svg) e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations();
    });
  }));
  $$('main > *, main section').forEach((s) => off.observe(s));
  const seen = new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { track('section_view', { section: e.target.id }); o.unobserve(e.target); } }), { rootMargin: '-45% 0px -45% 0px' });   // fires as any part crosses mid-viewport, however tall the section
  $$('main section[id]').forEach((s) => seen.observe(s));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#lead"], a[href="#lead-2"]');
    if (a) track('cta_click', { label: a.textContent.trim().slice(0, 40), from: a.closest('section[id]')?.id || 'header' });
  });
}

// A quiet corner switcher between the live design and the variations (design-review aid, not part of any design).
export const VERSIONS = [['', 'Live'], ['v2/', 'v2'], ['v3/', 'v3'], ['v4/', 'v4'], ['v5/', 'v5'], ['v6/', 'v6'], ['v7/', 'v7'], ['v8/', 'v8'], ['v9/', 'v9'], ['v10/', 'v10']];
export function switcher(current) {
  const nav = document.createElement('nav');
  nav.className = 'vswitch';
  nav.setAttribute('aria-label', 'Design versions');
  nav.innerHTML = VERSIONS.map(([p, t]) => `<a href="${BASE}${p}"${t === current ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  document.body.append(nav);
}

// Phones: a sticky "Start investing" bar, hidden while either lead form is on screen (same idea as the live page's dock).
function setupDock() {
  const dock = document.createElement('div');
  dock.className = 'vdock';
  dock.setAttribute('aria-hidden', 'true'); // duplicate of the header CTA; kept out of the tab order
  dock.innerHTML = `<p><strong>US stocks from $1</strong><span>₹0 account opening</span></p><a class="btn btn-primary btn-sm" href="#lead" tabindex="-1">${C.hero.cta}</a>`;
  document.body.append(dock);
  const shown = new Set();
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? shown.add(e.target) : shown.delete(e.target)));
    dock.classList.toggle('is-on', shown.size === 0);
  });
  $$('#lead, #lead-sent, #lead-2, #lead-2-sent').forEach((el) => io.observe(el));
  // One primary CTA per view: while a form or any in-page orange button is on screen, the header CTA turns ghost
  // and the dock steps down (base.css .cta-on).
  const near = new Set();
  const io2 = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? near.add(e.target) : near.delete(e.target)));
    document.documentElement.classList.toggle('cta-on', near.size > 0);
  });
  $$('main .btn-primary, #lead-sent, #lead-2-sent').forEach((el) => io2.observe(el));
}

export function boot(variant, html) {
  const root = document.documentElement;
  root.classList.add('js');
  root.dataset.variant = variant;
  $('#app').innerHTML = html;
  setupCaptures();
  setupFaq();
  tickClocks();
  setInterval(tickClocks, 20000);
  setupMotion();
  setupDock();
  switcher(variant);
}

// Dark backgrounds: the all-white logo artwork (public/maps-logo-white.svg).
export function lightLogo() { $$('img.brand').forEach((img) => { img.src = `${BASE}maps-logo-white.svg`; }); }

// ---------- Charts. Illustrative, but drawn like a real intraday chart: a seeded random walk with momentum, lightly
// smoothed, that starts at the previous close and ends exactly at the quote's 1D change; rendered as a smooth curve
// (Catmull-Rom → cubic Bézier), with a dotted previous-close line, a soft area fill and an end dot.
const seeded = (seed) => { let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const seedOf = (str) => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100003, 7);
export function pricePath(seed, changePct, n = 48) {
  const r = seeded(typeof seed === 'number' ? seed : seedOf(seed));
  const raw = [0]; let m = 0;
  for (let i = 1; i < n; i++) { m = m * 0.62 + (r() - 0.5); raw.push(raw[i - 1] + m); }
  const sm = raw.map((v, i) => (raw[Math.max(0, i - 1)] + 2 * v + raw[Math.min(n - 1, i + 1)]) / 4);   // light smoothing
  const span = Math.max(...sm) - Math.min(...sm) || 1, amp = Math.max(Math.abs(changePct), 0.6) * 0.75;
  return sm.map((v, i) => ((v - (sm[n - 1] - sm[0]) * (i / (n - 1)) - sm[0]) / span) * amp + changePct * (i / (n - 1))); // bridge: 0 → changePct
}
const f1 = (n) => Math.round(n * 10) / 10;
export function curvePath(values, w, h, pad = 3) {
  const lo = Math.min(...values, 0), hi = Math.max(...values, 0), k = (h - pad * 2) / (hi - lo || 1);
  const P = values.map((v, i) => [f1(pad + (i / (values.length - 1)) * (w - pad * 2)), f1(h - pad - (v - lo) * k)]);
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return { line: d, area: `${d} L${P.at(-1)[0]} ${h} L${P[0][0]} ${h} Z`, base: f1(h - pad - (0 - lo) * k), end: P.at(-1), pts: P };
}
let gid = 0;
// A stock's sparkline (tone from its 1D change) or a portfolio chart (tone: 'brand'); fixed aspect, so dots stay round.
export function chartSVG(key, changePct, w, h, { cls = '', tone, baseline = true, dot = true, n } = {}) {
  const c = curvePath(pricePath(key, changePct, n || Math.max(24, Math.round(w / 5))), w, h, dot ? 4 : 2), id = `cg${++gid}`;
  const t = tone || (changePct >= 0 ? 'up' : 'down');
  return `<svg class="chart chart-${t} ${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0.22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>`
    + (baseline ? `<line class="c-base" x1="0" x2="${w}" y1="${c.base}" y2="${c.base}"/>` : '')
    + `<path class="c-area" d="${c.area}" fill="url(#${id})"/><path class="c-line" d="${c.line}"/>`
    + (dot ? `<circle class="c-dot" cx="${c.end[0]}" cy="${c.end[1]}" r="3"/>` : '') + '</svg>';
}
export const sparkFor = (t, w, h, opts) => chartSVG(t, quote(t).ch, w, h, opts);
