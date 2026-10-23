// Local dev and tests run at the site root. The hosted design preview (GitHub Pages) is built with
//   BASE_PATH=/<repo>/ SITE_URL=https://<user>.github.io/<repo>/ PREVIEW=1 npx vite build
// which serves from a subfolder, makes the share image absolute, and marks the page as an unofficial,
// non-indexed preview (it carries mStock's brand and a phone-number form that sends nothing).
import { defineConfig } from 'vite';
import { existsSync, readdirSync } from 'node:fs';

// Design variations live beside the live page as their own pages (v2/index.html … → /v2/ …).
const variations = readdirSync('.').filter((d) => /^v\d+$/.test(d) && existsSync(`${d}/index.html`));

// Continuous ("squircle") corners, the way Apple draws them: every rounded rule gets a twin under
// @supports (corner-shape) with corner-shape: squircle and a radius scaled up (a squircle of the same radius
// reads tighter). Circles and pills (%, ≥ 500px) are pinned to round. Browsers without corner-shape keep the arcs.
const SQUIRCLE_SCALE = 1.35;
const scaleRadius = (v) => v.split(/\s+(?![^(]*\))/).map((t) => {
  if (/^0(px)?$/.test(t)) return '0';
  const px = /^([\d.]+)px$/.exec(t);
  if (px) return `${Math.round(Number(px[1]) * SQUIRCLE_SCALE * 10) / 10}px`;
  return `calc(${t} * ${SQUIRCLE_SCALE})`;
}).join(' ');
const smoothCorners = () => ({
  postcssPlugin: 'smooth-corners',
  OnceExit(root, { AtRule }) {
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes|supports/.test(rule.parent.name)) return;
      const decls = rule.nodes.filter((n) => n.type === 'decl' && /^border(-(top|bottom)-(left|right))?-radius$/.test(n.prop));
      if (!decls.length || decls.some((d) => /inherit|initial|unset/.test(d.value))) return;
      const round = decls.some((d) => /%/.test(d.value) || /\b([5-9]\d\d|\d{4,})px/.test(d.value));
      const twin = rule.clone({ nodes: [] });
      twin.append({ prop: 'corner-shape', value: round ? 'round' : 'squircle' });
      if (!round) decls.forEach((d) => twin.append({ prop: d.prop, value: scaleRadius(d.value), important: d.important }));
      rule.after(new AtRule({ name: 'supports', params: '(corner-shape: squircle)', nodes: [twin] }));
    });
  },
});

const preview = process.env.PREVIEW === '1';
const site = process.env.SITE_URL || '';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  // PAGES=main,v6 builds only those pages (parallel agents each build their own page into their own outDir).
  build: { rollupOptions: { input: Object.fromEntries([['main', 'index.html'], ...variations.map((d) => [d, `${d}/index.html`])].filter(([k]) => !process.env.PAGES || process.env.PAGES.split(',').includes(k))) } },
  // The NYS aerial photo ships only where it exists (it is held back from the hosted preview); skip its requests otherwise.
  define: { __HAS_ORTHO__: JSON.stringify(existsSync('public/data/ortho.webp')) },
  css: { postcss: { plugins: [smoothCorners()] } },
  plugins: [{
    name: 'design-preview',
    transformIndexHtml(html) {
      if (site) html = html.replace('<meta property="og:image" content="/og-image.jpg">', `<meta property="og:image" content="${site}og-image.jpg">`);
      if (!preview) return html;
      return html
        .replace('<head>', '<head>\n  <meta name="robots" content="noindex, nofollow">')
        .replace('<body>', '<body>\n  <p class="preview-banner" role="note"><b>Design preview</b> · Not an official website. Forms here don’t send any data.</p>');
    },
  }],
});
