// v7 · Royal (after the "TabPay" case study): white page, electric navy→blue gradient panels on a fine grid,
// tilted glass UI cards in the hero, a big-numbers strip and a blue steps panel.
import './base.css';
import './sections.css';
import './v7.css';
import { boot, header, footer, logo, quote, usd, pct, REF_PRICES } from './kit.js';
import * as S from './sections.js';

const t = 'AAPL', q = quote(t);
const html = `${header()}
<main id="main" tabindex="-1">
<section class="hero" id="top"><div class="vw">
  <div class="hero-panel">
    <div class="hero-copy">${S.heroCopy()}</div>
    <div class="glass-stack" aria-hidden="true">
      <div class="gcard g-port"><p class="gk">US portfolio</p><p class="gv num">$1,248.60</p><p class="gch num">▲ 2.41% today</p>
        <div class="gbars">${[38, 52, 44, 61, 57, 70, 66, 78].map((h) => `<i style="--h:${h}%"></i>`).join('')}</div></div>
      <div class="gcard g-order"><p class="gk">Buy by amount</p>
        <p class="g-stock"><span class="g-logo">${logo('apple')}</span><b>Apple Inc.</b><small>${t} · ${usd.format(q.px)}</small></p>
        <p class="gv num">$1.00</p><p class="gsub">≈ <b class="num">${(1 / REF_PRICES[t]).toFixed(4)}</b> shares · <span class="${q.ch >= 0 ? 'up' : 'down'} num">${pct(q.ch)}</span></p>
        <p class="gbtn">Review order</p></div>
      <div class="gcard g-ok"><span>✓</span><p><b>Order filled</b><small>Fractional · $1.00</small></p></div>
    </div>
  </div>
</div></section>
${S.highlights('stats')}
${S.brands()}
${S.product()}
${S.why()}
<div class="blue-band">${S.how()}</div>
${S.popular()}
${S.pricing()}
${S.tax()}
${S.faq()}
<div class="close-band">${S.closing()}</div>
</main>
${footer()}`;

boot('v7', html);
S.setupSections();
