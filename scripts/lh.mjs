// Lighthouse (mobile preset) against the production build.
// Usage: node scripts/lh.mjs [outFile.json]   (run `npx vite build` first)
import { preview } from 'vite';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'node:fs';

// Pass --desktop for the desktop preset (live 3D city).
const desktop = process.argv.includes('--desktop');
const server = await preview({ preview: { port: 4174, strictPort: true }, logLevel: 'silent' });
// --gpu: real GPU via Metal (what a desktop visitor has); default: software GL (SwiftShader), a pessimistic floor.
const gpu = process.argv.includes('--gpu');
const glFlags = gpu ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', ...glFlags] });
try {
  const config = desktop ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
  const { lhr } = await lighthouse(`http://localhost:4174/${process.argv.find((a) => /^v\d+\/$/.test(a)) || ''}`, {
    port: chrome.port, output: 'json', logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  }, config);
  const score = (k) => Math.round(lhr.categories[k].score * 100);
  const a = lhr.audits;
  const summary = {
    performance: score('performance'), accessibility: score('accessibility'), bestPractices: score('best-practices'), seo: score('seo'),
    lcp: a['largest-contentful-paint'].displayValue, cls: a['cumulative-layout-shift'].displayValue,
    tbt: a['total-blocking-time'].displayValue, fcp: a['first-contentful-paint'].displayValue,
    failedA11y: Object.values(lhr.categories.accessibility.auditRefs).map((r) => a[r.id]).filter((x) => x.score !== null && x.score < 1).map((x) => x.id),
    a11yNodes: Object.fromEntries(Object.values(lhr.categories.accessibility.auditRefs).map((r) => a[r.id]).filter((x) => x.score !== null && x.score < 1)
      .map((x) => [x.id, (x.details?.items || []).slice(0, 8).map((i) => `${i.node?.selector || ''} :: ${(i.node?.explanation || '').split('\n').slice(-1)[0].slice(0, 110)}`)])),
  };
  if (process.argv[2] && !process.argv[2].startsWith('--') && !/^v\d+\/$/.test(process.argv[2])) writeFileSync(process.argv[2], JSON.stringify(summary, null, 2));
  if (process.env.LHR_OUT) writeFileSync(process.env.LHR_OUT, JSON.stringify(lhr)); // full report for diagnosis
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await chrome.kill();
  await new Promise((r) => server.httpServer.close(r));
}
