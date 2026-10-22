// Local dev and tests run at the site root. The hosted design preview (GitHub Pages) is built with
//   BASE_PATH=/<repo>/ SITE_URL=https://<user>.github.io/<repo>/ PREVIEW=1 npx vite build
// which serves from a subfolder, makes the share image absolute, and marks the page as an unofficial,
// non-indexed preview (it carries mStock's brand and a phone-number form that sends nothing).
import { defineConfig } from 'vite';
import { existsSync, readdirSync } from 'node:fs';

// Design variations live beside the live page as their own pages (v2/index.html … → /v2/ …).
const variations = readdirSync('.').filter((d) => /^v\d+$/.test(d) && existsSync(`${d}/index.html`));

const preview = process.env.PREVIEW === '1';
const site = process.env.SITE_URL || '';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: { rollupOptions: { input: Object.fromEntries([['main', 'index.html'], ...variations.map((d) => [d, `${d}/index.html`])]) } },
  // The NYS aerial photo ships only where it exists (it is held back from the hosted preview); skip its requests otherwise.
  define: { __HAS_ORTHO__: JSON.stringify(existsSync('public/data/ortho.webp')) },
  plugins: [{
    name: 'design-preview',
    transformIndexHtml(html) {
      if (site) html = html.replace('<meta property="og:image" content="/og-image.jpg">', `<meta property="og:image" content="${site}og-image.jpg">`);
      if (!preview) return html;
      return html
        .replace('<head>', '<head>\n  <meta name="robots" content="noindex, nofollow">')
        .replace('<body>', '<body>\n  <p class="preview-banner" role="note"><b>Design preview</b> · Not an official mStock website. Forms here don’t send any data.</p>');
    },
  }],
});
