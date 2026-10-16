// Real trees for the hero: NYC Parks Forestry Tree Points (NYC Open Data, dataset hn5i-inap), living trees only.
// Raw download: brief/data/trees/forestry-tree-points.json (fetched with $where=within_box(location, 40.726, -74.025, 40.69, -73.97)).
// Output: public/data/trees.json as [x, z, crownRadius, ...] in scene units (same projection as manhattan.json).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url)); // fileURLToPath: the folder name has spaces
const d = JSON.parse(fs.readFileSync(`${root}public/data/manhattan.json`));
const raw = JSON.parse(fs.readFileSync(`${root}brief/data/trees/forestry-tree-points.json`));
const kx = (111320 * Math.cos((d.origin[0] * Math.PI) / 180)) / d.unit;
const out = [];
for (const t of raw) {
  if (t.tpstructure !== 'Full' || !t.location) continue;
  const [lon, lat] = t.location.coordinates;
  const dbh = Number(t.dbh) || 6; // trunk diameter, inches
  const crown = Math.min(7, 1.2 + dbh * 0.18); // metres: rough urban crown-to-trunk ratio
  const x = (lon - d.origin[1]) * kx, z = (-(lat - d.origin[0]) * 110540) / d.unit;
  if (x < -330 || x > 420 || z < -560 || z > 200) continue; // outside the hero's view (beyond it the haze hides them)
  out.push(+x.toFixed(1), +z.toFixed(1), +(crown / d.unit).toFixed(2));
}
fs.writeFileSync(`${root}public/data/trees.json`, JSON.stringify(out));
console.log(out.length / 3, 'trees');
