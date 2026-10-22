// Publish the site to the GitHub Pages repo (its Actions workflow builds and serves it as a noindex design preview).
// Usage: GH_TOKEN="$(gh auth token)" node scripts/deploy-pages.mjs "commit message"
// Clones the repo fresh (isomorphic-git: system git is blocked here), replaces index.html, vite.config.js, src/,
// public/ and scripts/, and never ships the NYS aerial photo (public/data/ortho.*) until its licence is confirmed.
// Render the phone poster without the photo first (see iterations/LOG.md, iter-115).
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'https://github.com/vikasbanjare/Global-Investing-lead-generation-website.git';
const token = process.env.GH_TOKEN;
const message = process.argv[2];
if (!token || !message) throw new Error('usage: GH_TOKEN=… node scripts/deploy-pages.mjs "message"');
const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gi-site-'));
const onAuth = () => ({ username: 'x-access-token', password: token });

await git.clone({ fs, http, dir, url: REPO, singleBranch: true, depth: 1, onAuth });
const variations = (d) => fs.readdirSync(d).filter((f) => /^v\d+$/.test(f)); // design variations: v2/, v3/ …
for (const p of ['src', 'public', 'scripts', ...variations(dir)]) fs.rmSync(path.join(dir, p), { recursive: true, force: true });
for (const p of ['index.html', 'vite.config.js', 'src', 'public', 'scripts', ...variations(src)]) {
  fs.cpSync(path.join(src, p), path.join(dir, p), { recursive: true, filter: (f) => !/[\\/]public[\\/]data[\\/]ortho\./.test(f) });
}
if (fs.readdirSync(path.join(dir, 'public/data')).some((f) => f.startsWith('ortho.'))) throw new Error('aerial photo must not ship');

for (const [file, head, work, stage] of await git.statusMatrix({ fs, dir })) {
  if (work === 0) await git.remove({ fs, dir, filepath: file });
  else if (head !== work || work !== stage) await git.add({ fs, dir, filepath: file });
}
const sha = await git.commit({ fs, dir, message, author: { name: 'Vikas', email: 'vikasbanjare94@gmail.com' } });
const res = await git.push({ fs, http, dir, onAuth });
fs.rmSync(dir, { recursive: true, force: true });
console.log(`commit ${sha.slice(0, 7)} push ok: ${res.ok}`);
