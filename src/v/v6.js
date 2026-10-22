// v6 · Peach glow (after the "Spendvest" case study, kept light): warm white page, soft orange glows, three app
// screens floating in the hero, visual-first sections, and a huge glowing wordmark to close.
import './base.css';
import './sections.css';
import './v6.css';
import { boot, header, footer } from './kit.js';
import * as S from './sections.js';

const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top">
  <div class="glow g1" aria-hidden="true"></div><div class="glow g2" aria-hidden="true"></div>
  <div class="vw hero-copy">${S.heroCopy()}</div>
  <div class="vw stage" aria-hidden="true">
    <figure class="ph ph-l"><figcaption>Buy by amount</figcaption>${S.phone('buy')}</figure>
    <figure class="ph ph-c"><figcaption>Dashboard</figcaption>${S.phone('dashboard')}</figure>
    <figure class="ph ph-r"><figcaption>Activity</figcaption>${S.phone('activity')}</figure>
  </div>
</section>
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
<section class="wordmark" aria-hidden="true"><p>m.Stock Global</p></section>
</main>
${footer()}`;

boot('v6', html);
S.setupSections();
