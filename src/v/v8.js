// v8 · Pastel (after the "Pulse" fintech case study): soft grey page, a huge two-weight headline, pastel mesh-gradient
// panels holding a phone and iridescent value cards; visual-first sections.
import './base.css';
import './sections.css';
import './v8.css';
import { boot, header, footer, C, icon, leadForm } from './kit.js';
import * as S from './sections.js';

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top"><div class="vw">
  <div class="hero-top">
    <h1>${C.hero.h1} <span>${C.hero.h1b}</span></h1>
    <div class="hero-side"><p class="eyebrow">${C.hero.eyebrow}</p><p class="lead">${C.hero.lead}</p><a class="tlink" href="#how">${C.hero.how}${icon.go}</a></div>
  </div>
  <div class="mesh-stage">
    <div class="hero-form">
      <ul class="points">${C.hero.points.map((p) => `<li>${icon.check}${p}</li>`).join('')}</ul>
      <p class="form-title" id="form-title">${C.hero.formTitle}</p>
      ${leadForm('lead', C.hero.cta, 'form-title')}
    </div>
    <div class="mesh-art" aria-hidden="true">
      ${S.phone('dashboard', 'p-main')}
      <div class="iri i1"><small>USD buying power</small><b class="num">$297.62</b></div>
      <div class="iri i2"><small>Bought for $1</small><b class="num">0.0043 AAPL</b></div>
    </div>
  </div>
</div></section>
${S.highlights()}
${S.brands()}
${S.product()}
${S.why()}
${S.how()}
${S.popular()}
${S.pricing()}
${S.tax()}
${S.faq()}
${S.closing()}
</main>
${footer()}`;

boot('v8', html);
S.setupSections();
