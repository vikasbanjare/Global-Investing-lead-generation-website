// Hero lab. Kept: A · the city inside the $1 (B two cities, C phone window and D $1 slice were tried and dropped).
// Every hero answers in 5 seconds: what (US stocks), for whom (from India), the doubts ($1 · ₹0 · IFSCA route), and
// one action (the mobile form), with one visual that proves the promise rather than decorates.
import './base.css';
import './sections.css';
import './heroes.css';
import { boot, header, C, leadForm, logo, $, reducedMotion, REF_PRICES } from './kit.js';

const proof = `<ul class="hx-proof">${C.highlights.slice(1, 4).map((h) => `<li><b class="num">${h.fig}</b><span>${h.label}</span></li>`).join('')}</ul>`;
const copy = (k, h1 = `${C.hero.h1} <span>${C.hero.h1b}</span>`) => `<div class="hx-copy">
  <p class="hx-eyebrow">${C.hero.eyebrow}</p>
  <h1>${h1}</h1>
  <p class="hx-lead">${C.hero.lead}</p>
  <p class="hx-ft" id="ft-${k}">${C.hero.formTitle}</p>
  ${leadForm(`lead-${k}`, C.hero.cta, `ft-${k}`)}
  ${proof}
</div>`;
const tag = (l, name, idea) => `<p class="hx-tag"><b>Hero ${l}</b> · ${name}<span>${idea}</span></p>`;

// A · the city inside the $1: the type is a window onto the 3D city render
const heroA = `<section class="hx hx-a" id="a">${tag('A', 'The city inside the $1', '$1 is your way into Wall Street')}
  <div class="vw hx-in">
    <div class="hx-art"><b class="dollar" aria-hidden="true">$1</b><i class="floor" aria-hidden="true"></i>
      <p class="dollar-cap">${logo('apple', 'AAPL')}<span><b class="num">$1</b> buys <b class="num">≈ ${(1 / REF_PRICES.AAPL).toFixed(4)}</b> Apple share</span></p>
      <p class="credit">City: buildings © OpenStreetMap contributors · trees: NYC Parks · reference price</p></div>
    ${copy('a')}
  </div>
</section>`;

boot('heroes', `${header()}<main id="main" tabindex="-1">${heroA}</main>`);
$('.vh .btn-primary')?.setAttribute('href', '#lead-a');

// the city drifts inside the letters toward the pointer (eased by CSS transitions on --mx/--my)
const hx = $('#a'), d = $('.dollar');
if (!reducedMotion && matchMedia('(hover: hover)').matches) {
  hx.addEventListener('pointermove', (e) => { const r = hx.getBoundingClientRect(); d.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2); d.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2); });
  hx.addEventListener('pointerleave', () => { d.style.setProperty('--mx', 0); d.style.setProperty('--my', 0); });
}
