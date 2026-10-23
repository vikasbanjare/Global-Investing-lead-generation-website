// v8 · Pastel (after the "Pulse" fintech case study): soft grey page, a huge two-weight headline, pastel mesh-gradient
// panels holding a phone and frosted value chips; visual-first sections.
import './base.css';
import './sections.css';
import './v8.css';
import { boot, header, footer, C, icon, leadForm, sparkFor, $, $$ } from './kit.js';
import * as S from './sections.js';

// Trust beside both forms, from the reviewed copy only.
const trust = `<p class="trust">${icon.shield}<span>${C.whyUs.items[3]}</span></p>`;
// The key highlights live on the hero stage, in reach of the form (hyphenated words never break).
const nw = (s) => s.replace(/(\S+-\S+)/g, '<span class="nw">$1</span>');
const hlBar = `<ul class="hl-bar" aria-label="Key investment highlights">${C.highlights.map((h) => `<li><b class="num">${h.fig}</b><span>${h.label}</span><small>${nw(h.note)}</small></li>`).join('')}</ul>`;

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top"><div class="vw">
  <div class="hero-top">
    <div><p class="eyebrow">${C.hero.eyebrow}</p><h1>${C.hero.h1} <span>${C.hero.h1b.replace(/ (\S+)$/, '&nbsp;$1')}</span></h1></div>
    <div class="hero-side"><p class="lead">${C.hero.lead}</p><a class="tlink" href="#how">${C.hero.how}${icon.go}</a></div>
  </div>
  <div class="mesh-stage">
    <div class="hero-form">
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
      ${trust}
    </div>
    <div class="mesh-art" aria-hidden="true">
      ${S.phone('dashboard', 'p-main')}
      <div class="iri i1 loop"><small>USD buying power</small><b class="num">$297.62</b></div>
      <div class="iri i2 loop"><small>Bought for $1</small><b class="num">0.0043 AAPL</b>${sparkFor('AAPL', 96, 28, { baseline: false })}</div>
    </div>
    ${hlBar}
  </div>
</div></section>
${S.brands()}
${S.why()}
${S.product()}
${S.how()}
${S.popular()}
${S.pricing()}
${S.tax()}
${S.faq()}
${S.closing(S.phone('activity'))}
</main>
${footer()}
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><linearGradient id="v8-of" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#072d5e" stop-opacity=".14"/><stop offset="1" stop-color="#072d5e" stop-opacity="0"/></linearGradient></svg>`;

boot('v8', html);

// Two-weight section titles, like the hero: each title's closing clause drops to the light weight. Words unchanged;
// a title that no longer ends with its clause simply stays one weight.
const LIGHT = ['Now own the stock', 'made simple', 'Indian markets?', 'markets in 4 steps', 'by sector', 'for US investing?', 'with tax questions', 'with m.Stock'];
$$('.head h2, .close-copy h2').forEach((h) => {
  const t = h.textContent, tail = LIGHT.find((s) => t.endsWith(` ${s}`));
  if (!tail) return;
  const span = document.createElement('span');
  span.textContent = tail;
  h.replaceChildren(`${t.slice(0, -tail.length - 1)} `, span);
});
// The closing form gets the same reassurance line as the hero form.
$('#start .benefits').insertAdjacentHTML('afterend', trust);
// The brand icons bob as a whole (tile + label), paused off-screen.
$$('.icon-wall .app-icon').forEach((a) => a.classList.add('loop'));
// On phones the four steps and the order types become swipe rows; keep them reachable by keyboard while they scroll.
const rows = [$('.screens'), $('.orders-row')], narrow = matchMedia('(max-width: 560px)');
$('.orders-row').setAttribute('role', 'group');
$('.orders-row').setAttribute('aria-label', C.orders.title);
const syncRows = () => rows.forEach((r) => (narrow.matches ? r.setAttribute('tabindex', '0') : r.removeAttribute('tabindex')));
syncRows(); narrow.addEventListener('change', syncRows);
// One primary action per view: the header CTA steps aside while either lead form is on screen.
const hcta = $('.vh .btn-primary'), inView = new Set();
const io = new IntersectionObserver((es) => {
  es.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
  hcta.classList.toggle('is-quiet', inView.size > 0);
});
$$('#lead, #lead-sent, #lead-2, #lead-2-sent').forEach((el) => io.observe(el));

S.setupSections();
