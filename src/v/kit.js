// Shared by the design variations (/v2/–/v5/): copy, small renderers and the page behaviours every variation needs
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

export const brandMark = (cls = 'brand') => `<img class="${cls}" src="${BASE}maps-logo.svg" alt="MAPS World Markets" width="134" height="48">`;

export function header() {
  return `<a class="skip" href="#main">Skip to content</a>
<header class="vh"><div class="vw vh-in">
  <a href="#top" class="vh-home" aria-label="MAPS World Markets, back to top">${brandMark()}</a>
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

function setupCaptures() {
  $$('form.capture').forEach((form) => {
    const id = form.id, field = form.querySelector('input'), error = $(`#${id}-err`), sent = $(`#${id}-sent`);
    field.addEventListener('focus', () => track('lead_focus', { form: id }), { once: true });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const digits = field.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      const valid = /^[6-9]\d{9}$/.test(digits);
      error.hidden = valid;
      field.setAttribute('aria-invalid', String(!valid));
      track(valid ? 'lead_submit_valid' : 'lead_submit_invalid', { form: id });
      if (!valid) { field.focus(); return; }
      // TODO(lead-endpoint): POST { mobile: digits, source: id } to the CRM, as on the live page.
      form.hidden = true;
      sent.hidden = false;
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
  const off = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)));
  $$('main > section').forEach((s) => off.observe(s));
  const seen = new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { track('section_view', { section: e.target.id }); o.unobserve(e.target); } }), { threshold: 0.4 });
  $$('main > section[id]').forEach((s) => seen.observe(s));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#lead"], a[href="#lead-2"]');
    if (a) track('cta_click', { label: a.textContent.trim().slice(0, 40), from: a.closest('section[id]')?.id || 'header' });
  });
}

// A quiet corner switcher between the live design and the variations (design-review aid, not part of any design).
export const VERSIONS = [['', 'Live'], ['v2/', 'v2'], ['v3/', 'v3'], ['v4/', 'v4'], ['v5/', 'v5'], ['v6/', 'v6'], ['v7/', 'v7'], ['v8/', 'v8'], ['v9/', 'v9']];
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

// Dark themes: swap the logo's navy tagline for white (the orange mark stays exact).
export async function lightLogo() {
  try {
    const svg = await (await fetch(`${BASE}maps-logo.svg`)).text();
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/#072d5e/gi, '#ffffff'))}`;
    $$('img.brand').forEach((img) => { img.src = url; });
  } catch { /* keep the default logo */ }
}
