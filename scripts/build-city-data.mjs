// Turns raw OpenStreetMap data (brief/data/*.json, fetched with Overpass) into the compact city the hero renders.
// Usage: node scripts/build-city-data.mjs   → public/data/manhattan.json
// Data © OpenStreetMap contributors, ODbL. The page credits it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UNIT = 8; // metres per scene unit
const bld = JSON.parse(readFileSync('brief/data/lower-manhattan-osm.json', 'utf8')).elements;
const ctx = JSON.parse(readFileSync('brief/data/lower-manhattan-context-osm.json', 'utf8')).elements;

// ---- Projection: local tangent plane centred on the NYSE (x = east, z = south, in scene units).
const nyseWay = bld.find((w) => w.tags.name === 'New York Stock Exchange');
const centroidLL = (g) => [g.reduce((s, p) => s + p.lat, 0) / g.length, g.reduce((s, p) => s + p.lon, 0) / g.length];
const [LAT0, LON0] = centroidLL(nyseWay.geometry);
const KX = 111320 * Math.cos((LAT0 * Math.PI) / 180), KZ = 110540;
const proj = (lon, lat) => [((lon - LON0) * KX) / UNIT, (-(lat - LAT0) * KZ) / UNIT];
const r1 = (v) => Math.round(v * 10) / 10;

// ---- Geometry helpers
const area = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return a / 2; };
const inside = (pts, x, z) => { let hit = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit; } return hit; };
const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
function simplify(pts, tol) { // Douglas–Peucker on an open polyline
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, z] = pts[i], dx = b[0] - a[0], dz = b[1] - a[1];
    const d = Math.abs(dz * x - dx * z + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dz) || 1);
    if (d > dmax) { dmax = d; idx = i; }
  }
  return dmax > tol ? [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)] : [a, b];
}
const ring = (geom, tol = 1 / UNIT) => {
  let pts = geom.map((p) => proj(p.lon, p.lat));
  if (pts.length > 1 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts.pop();
  const s = simplify([...pts, pts[0]], tol); s.pop();
  return s.length >= 3 ? s : pts;
};
const metres = (v) => { if (v == null) return null; const n = parseFloat(String(v).replace(',', '.')); if (Number.isNaN(n)) return null; return /ft|'/.test(String(v)) ? n * 0.3048 : n; };

// ---- Buildings: render parts where a building has them, otherwise its outline.
const isPart = (w) => 'building:part' in w.tags;
const parts = bld.filter(isPart).map((w) => ({ w, pts: ring(w.geometry) }));
const outlines = bld.filter((w) => !isPart(w)).map((w) => ({ w, pts: ring(w.geometry) }));
const hasParts = (o) => parts.some((p) => { const [x, z] = centroid(p.pts); return inside(o.pts, x, z); });
const SKIP = new Set(['New York Stock Exchange', 'One World Trade Center']); // drawn as hand-built landmarks
// Their unnamed parts too: anything centred inside either landmark's outline (grown 1.5 m) is dropped.
const landmarkRings = ['New York Stock Exchange', 'One World Trade Center'].map((n) => ring(bld.find((x) => x.tags.name === n).geometry));
const grownInside = (pts, x, z) => inside(pts, x, z) || pts.some(([px, pz]) => Math.hypot(px - x, pz - z) < 1.5 / UNIT * 4);
const inLandmark = (pts) => { const [x, z] = centroid(pts); return landmarkRings.some((r) => grownInside(r, x, z)); };
const out = [];
for (const { w, pts } of [...parts, ...outlines.filter((o) => !hasParts(o))]) {
  if (SKIP.has(w.tags.name) || inLandmark(pts)) continue;
  if (parts.some((p) => p.w === w) && SKIP.has(w.tags.name)) continue;
  const a = Math.abs(area(pts)) * UNIT * UNIT;
  if (a < 25) continue;
  const lv = parseFloat(w.tags['building:levels']);
  const h = metres(w.tags.height) ?? (lv ? lv * 3.2 : 12);
  const base = metres(w.tags.min_height) ?? (parseFloat(w.tags['building:min_level']) * 3.2 || 0);
  if (h - base < 1.5) continue;
  const year = parseInt(w.tags.start_date, 10);
  const mat = `${w.tags['building:material'] || ''} ${w.tags.material || ''}`;
  const tone = h >= 120 || /glass/.test(mat) ? 1 : (h <= 45 && ((year && year < 1940) || /brick|stone|marble|granite/.test(mat))) ? 2 : 0;
  const ccw = area(pts) > 0 ? pts : [...pts].reverse();
  out.push([r1(base / UNIT), r1((h - base) / UNIT), tone, ...ccw.flat().map(r1)]);
}

// ---- Land: chain coastline ways, close each landmass with corners outside the view.
const coast = ctx.filter((w) => w.tags.natural === 'coastline').map((w) => w.geometry.map((p) => [p.lon, p.lat]));
const chains = [];
const segs = coast.slice();
while (segs.length) {
  let ch = segs.shift(), grew = true;
  while (grew) {
    grew = false;
    for (const s of segs) {
      const eq = (p, q) => p[0] === q[0] && p[1] === q[1];
      if (eq(s[0], ch.at(-1))) { ch = ch.concat(s.slice(1)); segs.splice(segs.indexOf(s), 1); grew = true; break; }
      if (eq(s.at(-1), ch[0])) { ch = s.slice(0, -1).concat(ch); segs.splice(segs.indexOf(s), 1); grew = true; break; }
    }
  }
  chains.push(ch);
}
const pick = (test) => chains.find((c) => test(c[0], c.at(-1)));
const close = (c, corners) => (c[0][0] === c.at(-1)[0] && c[0][1] === c.at(-1)[1] ? c : c.concat(corners));
const lands = [
  close(pick((a, b) => a[0] < -74.005 && b[0] > -73.99 && a[1] > 40.72), [[-73.97, 40.8], [-74.0114, 40.8]]), // Manhattan
  close(pick((a, b) => a[0] > -73.99 && b[1] < 40.69), [[-74.0074, 40.66], [-73.93, 40.66], [-73.93, 40.7059]]), // Brooklyn
  close(pick((a, b) => a[0] < -74.03 && b[1] > 40.73), [[-74.08, 40.736], [-74.08, 40.7117]]), // Jersey City
  pick((a, b) => a[0] === b[0] && a[1] === b[1]), // Governors Island
].filter(Boolean).map((c) => { const s = simplify(c.map(([lon, lat]) => proj(lon, lat)), 2 / UNIT); return s.flat().map(r1); });

const parks = ctx.filter((w) => w.tags.leisure === 'park').map((w) => ring(w.geometry, 2 / UNIT)).filter((p) => Math.abs(area(p)) * UNIT * UNIT > 400).map((p) => p.flat().map(r1));

// ---- Landmark anchors
const at = (name) => { const w = bld.find((x) => x.tags.name === name); return centroid(ring(w.geometry)).map(r1); };
const bb = ctx.find((w) => w.tags.name === 'Brooklyn Bridge');
let bridge = null;
if (bb) { // the bridge is mapped as a closed deck outline: its span is the farthest-apart pair of points
  const P = bb.geometry.map((p) => proj(p.lon, p.lat));
  let d = 0;
  for (const p of P) for (const q of P) { const L = Math.hypot(p[0] - q[0], p[1] - q[1]); if (L > d) { d = L; bridge = { a: p.map(r1), b: q.map(r1) }; } }
  if (bridge.a[0] > bridge.b[0]) bridge = { a: bridge.b, b: bridge.a }; // a = Manhattan end
}
const nysePts = ring(nyseWay.geometry);
// NYSE facade faces Broad Street: take the footprint's longest edge for orientation.
let best = 0, angle = 0;
for (let i = 0; i < nysePts.length; i++) { const [a, b] = [nysePts[i], nysePts[(i + 1) % nysePts.length]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best) { best = L; angle = Math.atan2(b[1] - a[1], b[0] - a[0]); } }

mkdirSync('public/data', { recursive: true });
const data = { unit: UNIT, origin: [LAT0, LON0], attribution: '© OpenStreetMap contributors (ODbL)', b: out, land: lands, parks, nyse: { at: [0, 0], angle: r1(angle * 100) / 100, size: [r1(best), r1(Math.sqrt(Math.abs(area(nysePts))) )] }, wtc: at('One World Trade Center'), bridge };
writeFileSync('public/data/manhattan.json', JSON.stringify(data));
const tall = out.filter((b) => b[1] * UNIT > 150).length;
console.log(`buildings ${out.length} (towers >150 m: ${tall}), land ${lands.length}, parks ${parks.length}, ${Math.round(JSON.stringify(data).length / 1024)} KB, wtc ${data.wtc}, bridge ${JSON.stringify(bridge)}, nyse angle ${data.nyse.angle}`);
