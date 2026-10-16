// Minimal git for the iteration loop, via isomorphic-git (system git is blocked by the
// unaccepted Xcode license on this machine). Writes a standard .git directory.
// Usage:
//   node scripts/git.mjs commit "iter-01: message"
//   node scripts/git.mjs tag-best
//   node scripts/git.mjs restore-best      # working tree back to `best`, keeps iterations/
//   node scripts/git.mjs log
import git from 'isomorphic-git';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // fileURLToPath: the folder name has spaces
const author = { name: 'Vikas', email: 'vikasbanjare94@gmail.com' };
const [cmd, arg] = process.argv.slice(2);
const keep = (f) => f.startsWith('iterations/');

if (!fs.existsSync(path.join(dir, '.git'))) await git.init({ fs, dir, defaultBranch: 'main' });

async function stageAll() {
  const matrix = await git.statusMatrix({ fs, dir });
  for (const [file, head, work, stage] of matrix) {
    if (work === 0) await git.remove({ fs, dir, filepath: file });
    else if (head !== work || work !== stage) await git.add({ fs, dir, filepath: file });
  }
}

if (cmd === 'commit') {
  await stageAll();
  const message = `${arg}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n`;
  const sha = await git.commit({ fs, dir, message, author });
  console.log('committed', sha.slice(0, 7), arg);
} else if (cmd === 'tag-best') {
  await git.tag({ fs, dir, ref: 'best', force: true });
  console.log('best ->', (await git.resolveRef({ fs, dir, ref: 'best' })).slice(0, 7));
} else if (cmd === 'restore-best') {
  const best = await git.resolveRef({ fs, dir, ref: 'best' });
  const bestFiles = new Set(await git.listFiles({ fs, dir, ref: best }));
  for (const f of bestFiles) {
    if (keep(f)) continue;
    const { blob } = await git.readBlob({ fs, dir, oid: best, filepath: f });
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), Buffer.from(blob));
  }
  for (const f of await git.listFiles({ fs, dir, ref: 'HEAD' })) {
    if (!keep(f) && !bestFiles.has(f) && fs.existsSync(path.join(dir, f))) fs.unlinkSync(path.join(dir, f));
  }
  console.log('working tree restored to best', best.slice(0, 7), '(iterations/ kept)');
} else if (cmd === 'log') {
  const best = await git.resolveRef({ fs, dir, ref: 'best' }).catch(() => null);
  for (const c of await git.log({ fs, dir, depth: Number(arg) || 20 })) {
    console.log(c.oid.slice(0, 7), c.oid === best ? '(best)' : '      ', c.commit.message.split('\n')[0]);
  }
} else {
  console.error('commands: commit <msg> | tag-best | restore-best | log');
  process.exit(2);
}
