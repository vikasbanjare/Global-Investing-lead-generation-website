// Local dev and tests run at the site root. The hosted design preview (GitHub Pages) is built with
//   BASE_PATH=/<repo>/ SITE_URL=https://<user>.github.io/<repo>/ PREVIEW=1 npx vite build
// which serves from a subfolder, makes the share image absolute, and marks the page as an unofficial,
// non-indexed preview (it carries mStock's brand and a phone-number form that sends nothing).
import { defineConfig } from 'vite';

const preview = process.env.PREVIEW === '1';
const site = process.env.SITE_URL || '';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
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
