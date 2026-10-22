// v9 · Sky (after the "SentoBot" comparison site): a dreamy blue sky with soft clouds, a frosted-glass hero card, the
// city render as the landscape below, and glass sections on the sky.
import './base.css';
import './sections.css';
import './v9.css';
import { boot, header, footer, BASE } from './kit.js';
import * as S from './sections.js';

const clouds = (n) => `<div class="clouds" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="cl loop" style="--i:${i}"></i>`).join('')}</div>`;
const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  ${clouds(6)}
  <div class="vw hero-in"><div class="glass hero-card">${S.heroCopy()}</div></div>
  <div class="land" aria-hidden="true"><img src="${BASE}city-poster.webp" alt="" width="1600" height="840"></div>
</section>
${S.highlights()}
<div class="sky-band">${clouds(4)}${S.brands()}</div>
${S.product()}
${S.why()}
<div class="sky-band">${clouds(4)}${S.how()}</div>
${S.popular()}
${S.pricing()}
${S.tax()}
${S.faq()}
<div class="sky-band sky-end">${clouds(5)}${S.closing(`<img class="close-city" src="${BASE}city-poster.webp" alt="" width="1600" height="840">`)}</div>
</main>
${footer()}`;

boot('v9', html);
S.setupSections();
