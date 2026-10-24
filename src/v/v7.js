// v7 · Royal (after the "TabPay" case study): white page; three royal panels (hero, steps band, closing band) on one
// width, radius and grid texture; glass UI cards float in the hero; a white numbers bar docks on the hero panel.
import './base.css';
import './sections.css';
import './v7.css';
import { boot, header, footer, logo, icon, quote, usd, pct, chartSVG, sparkFor, C, $, $$, REF_PRICES } from './kit.js';
import * as S from './sections.js';

const t = 'AAPL', q = quote(t);
const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top"><div class="vw">
  <div class="hero-panel">
    <div class="hero-copy">${S.heroCopy()}</div>
    <div class="glass-stack" aria-hidden="true">
      <div class="gcard g-port loop"><p class="gk">US portfolio</p><p class="gv num">$1,248.60</p><p class="gch num">▲ 2.41% today</p>
        ${chartSVG('pf41', 2.41, 268, 80, { cls: 'g-chart', tone: 'brand', baseline: false, n: 48 })}</div>
      <div class="gcard g-order loop"><p class="gk">Buy by amount</p>
        <p class="g-stock"><span class="g-logo">${logo('apple')}</span><b>Apple Inc.</b><small>${t} · ${usd.format(q.px)}</small></p>
        <p class="gv num">$1.00</p><p class="gsub">≈ <b class="num">${(1 / REF_PRICES[t]).toFixed(4)}</b> shares · <span class="${q.ch >= 0 ? 'up' : 'down'} num">${pct(q.ch)}</span></p>
        <p class="gbtn">Review order</p></div>
      <div class="gcard g-ok loop"><span>${icon.check}</span><p><b>Order filled</b><small>Fractional · $1.00</small></p></div>
    </div>
  </div>
</div></section>
${S.highlights('stats')}
${S.brands()}
${S.why()}
${S.product()}
${S.how()}
${S.popular()}
${S.pricing()}
${S.tax()}
${S.faq()}
${S.closing()}
</main>
${footer()}`;

boot('v7', html);
S.setupSections();

// Trust next to both forms, in reviewed words only (highlight notes + the Mirae Asset line from "Why MAPS").
// ponytail: the hero's "How it works" link gives way to it; the header nav and the scroll already lead there.
const trust = (items) => `<ul class="trust">${items.map((s) => `<li>${icon.shield}<span>${s}</span></li>`).join('')}</ul>`;
$('.hero .hero-how').outerHTML = trust([C.highlights[3].note, C.whyUs.items[3]]);
$('.close-copy .benefits').insertAdjacentHTML('afterend', trust([C.highlights[2].note, C.whyUs.items[3]]));

// One primary button per view: the header CTA steps back to a ghost while a lead form is on screen.
const vh = $('.vh'), onScreen = new Set();
const formIO = new IntersectionObserver((es) => {
  es.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
  vh.classList.toggle('form-on', onScreen.size > 0);
});
$$('#lead, #lead-sent, #lead-2, #lead-2-sent').forEach((el) => formIO.observe(el));
// Phones: the dock (kit.js) steps away while an in-page orange CTA ("Start now", "Open account") is on screen.
const dock = $('.vdock'), ctas = new Set();
const ctaIO = new IntersectionObserver((es) => {
  es.forEach((e) => (e.isIntersecting ? ctas.add(e.target) : ctas.delete(e.target)));
  dock.classList.toggle('cta-near', ctas.size > 0);
});
$$('main a.btn-primary').forEach((el) => ctaIO.observe(el));

// KPI cards: a royal icon chip on each label; the note never breaks at its hyphen (same words).
const PIE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12h8.5"/></svg>';
const KPI_ICON = [icon.chart, PIE, icon.user, icon.shield];
$$('.s-hl .hl-grid li').forEach((li, i) => {
  li.querySelector('span').insertAdjacentHTML('afterbegin', `<i class="kpi-i" aria-hidden="true">${KPI_ICON[i]}</i>`);
  const n = li.querySelector('small'); n.textContent = n.textContent.replace('-', '‑');
});

// Why: a small UI vignette per statement instead of a big "01/02/03" (illustrative, no figures).
const MIX = ['#072d5e', '#0b3f8a', '#1f5fd6', '#9dbcf2'];
const WHY_ART = [
  `<div class="wv wv-mix" aria-hidden="true"><i style="background: conic-gradient(${MIX[0]} 0 34%, ${MIX[1]} 0 58%, ${MIX[2]} 0 80%, ${MIX[3]} 0)"></i>
    <ul>${Object.keys(C.sectors.list).slice(0, 4).map((s, i) => `<li style="--c: ${MIX[i]}">${s}</li>`).join('')}</ul></div>`,
  `<div class="wv wv-logos" aria-hidden="true"><p>${['apple', 'nvidia', 'microsoft', 'amazon'].map((l) => `<span>${logo(l)}</span>`).join('')}</p><small>AAPL · NVDA · MSFT · AMZN</small></div>`,
  `<div class="wv wv-fx" aria-hidden="true"><small>USD / INR</small>${chartSVG('usdinr', 0.4, 320, 72, { tone: 'brand' })}</div>`,
];
$$('.s-why .w-num').forEach((n, i) => { n.outerHTML = WHY_ART[i]; });
// Headline breaks between its two sentences (same words).
$('#brands h2').innerHTML = C.brands.title.replace('? ', '?<br> ');
// Pricing notes: a "·" never starts a line (same words, non-breaking space before it).
$$('.charge-n').forEach((n) => { n.textContent = n.textContent.replaceAll(' · ', '\u00a0· '); });
// The first answer is visible without a tap.
$('#faq-q-0').setAttribute('aria-expanded', 'true'); $('#faq-0').classList.add('is-open');
// Icon-wall bob pauses off-screen like every other loop.
$$('.ai-tile').forEach((e) => e.classList.add('loop'));
// Watchlist rows: a wide sparkline drawn at its display size (kit.js), re-drawn whenever a sector tab renders.
const sx = $('#sx-panel');
const widen = () => $$('.sx-row', sx).forEach((r) => { r.querySelector('.sx-spark').outerHTML = sparkFor(r.querySelector('.sx-name small').textContent, 400, 36, { cls: 'sx-spark' }); });
new MutationObserver(widen).observe(sx, { childList: true });
widen();
// How: the royal band keeps the heading and the four steps; who-can-start and the money routes sit under it on the page.
const band = $('.s-how > .vw');
band.classList.add('how-band');
band.insertAdjacentHTML('afterend', '<div class="vw how-more"></div>');
$('.how-more').append($('.s-how .who-row'), $('.s-how .route-row'));
// Phones: the steps become a swipe row, so the row joins the tab order there (keyboard scrolling).
const steps = $('.s-how .screens'), narrow = matchMedia('(max-width: 560px)');
const kb = () => (narrow.matches ? steps.setAttribute('tabindex', '0') : steps.removeAttribute('tabindex'));
narrow.addEventListener('change', kb);
kb();
steps.setAttribute('aria-label', C.steps.title);
