// Lower Manhattan for the hero, built from real OpenStreetMap footprints and heights (public/data/manhattan.json,
// made by scripts/build-city-data.mjs). Clay-model treatment: buildings grow out of the ground on load, the camera
// follows the pointer and eases back as the page scrolls, clouds drift over. Data © OpenStreetMap contributors (ODbL).
import * as THREE from 'three';
import { createHarbour } from './harbour.js';

const PAGE_BG = 0xf3f8ff; // brand Cloud White; must match --bg

// Curved horizon (the reference's "earth falling away"): every vertex drops with its distance from the camera's
// line of sight, sideways and beyond the focus. Done once in the shared projection chunk so all materials,
// shadows and sprites agree. CURVE_D is roughly the camera-to-focus distance; the label mirrors it in JS.
const CURVE_K = 0.00016, CURVE_D = 1150;
THREE.ShaderChunk.project_vertex = THREE.ShaderChunk.project_vertex.replace(
  'mvPosition = modelViewMatrix * mvPosition;',
  'mvPosition = modelViewMatrix * mvPosition;\n{ float dz_ = max(0.0, -mvPosition.z - ' + CURVE_D.toFixed(1) + '); mvPosition.y -= (dz_ * dz_ + mvPosition.x * mvPosition.x) * ' + CURVE_K + '; }',
);
const ORANGE = 0xff5400;
const GROUND = 0.6; // land surface height

// Seeded random so the scene is identical on every load.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function inside(pts, x, z) {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const pairs = (flat) => { // [x0, z0, x1, z1, ...] -> [[x, z], ...] without repeated points (rounding leaves some)
  const p = [];
  for (let i = 0; i < flat.length; i += 2) {
    const q = [flat[i], flat[i + 1]], last = p[p.length - 1];
    if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) > 0.05) p.push(q);
  }
  if (p.length > 2 && Math.hypot(p[0][0] - p.at(-1)[0], p[0][1] - p.at(-1)[1]) <= 0.05) p.pop();
  return p;
};

// GPU growth: every vertex rises with its building's delay (one draw call, no per-frame CPU work).
const GROW_VERT = 'float e_ = 1.0 - pow(1.0 - clamp((uT - aDelay) / 1.3, 0.0, 1.0), 3.0);\ntransformed.y = ' + GROUND.toFixed(1) + ' + (transformed.y - ' + GROUND.toFixed(1) + ') * max(e_, 0.001);';
function patchGrowth(shader, uT) {
  shader.uniforms.uT = uT;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float aDelay;\nuniform float uT;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + GROW_VERT);
}

export function createCity({ canvas, label, reducedMotion = false, withClouds = true }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null; // caller shows the static fallback
  }
  const hero = canvas.closest('.hero');
  const data = fetch(`${import.meta.env.BASE_URL}data/manhattan.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  // Real aerial photography of the harbour (NYS ITS orthoimagery, colour-graded): draped on land and roofs.
  const treesData = fetch(`${import.meta.env.BASE_URL}data/trees.json`).then((r) => r.json()).catch(() => []);
  const orthoBox = fetch(`${import.meta.env.BASE_URL}data/ortho.json`).then((r) => r.json()).catch(() => null); // optional: builds without it use plain ground
  const orthoTex = new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}data/ortho.webp`).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }).catch(() => null);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false; // the light never moves: bake shadows, refresh only while buildings grow
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAGE_BG, 1150, 1950); // the Financial District stays crisp; uptown and the far shores dissolve into haze
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 5000);

  // Morning light: cool sky fill, warm low sun from the east-south-east (the real morning sun over the East River).
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x9a958c, 0.55)); // sky above, warm ground bounce below
  // Image-based light from a generated morning sky: glass and water reflect it, shadowed faces pick up its blue.
  {
    const pm = new THREE.PMREMGenerator(renderer);
    const skyScene = new THREE.Scene();
    const skyGeo = new THREE.SphereGeometry(100, 32, 16);
    const cols = []; const pp = skyGeo.attributes.position;
    const zen = new THREE.Color(0x8fb6e3), hor = new THREE.Color(0xf6efe4), gnd = new THREE.Color(0x7d7f80), tmp = new THREE.Color();
    for (let i = 0; i < pp.count; i++) { const y = pp.getY(i) / 100; tmp.copy(y > 0 ? hor : gnd).lerp(y > 0 ? zen : gnd, Math.pow(Math.abs(y), 0.6)); cols.push(tmp.r, tmp.g, tmp.b); }
    skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    skyScene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    scene.environment = pm.fromScene(skyScene, 0.02).texture;
    scene.environmentIntensity = 0.75;
    pm.dispose();
  }
  const sun = new THREE.DirectionalLight(0xffcf96, 4.4); // stronger key vs fill: towers read as volumes
  sun.position.set(200, 150, 60); // a low east-south-east morning sun: long shadows across the grid from this view
  sun.target.position.set(0, 0, -40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -250, right: 250, top: 250, bottom: -250, near: 10, far: 700 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.4;
  scene.add(sun, sun.target);

  const mat = {
    // Unlit, fixed pale blue: lit water turned beige-grey under the warm sun. Haze still blends it into the page.
    water: new THREE.MeshStandardMaterial({ color: 0x2b5874, roughness: 0.32, metalness: 0.12 }), // New York Harbor: grey-blue, not pool blue // deep harbour blue, reflects the sky
    land: new THREE.MeshStandardMaterial({ color: 0x9c9a95, roughness: 0.95 }), // streets and plazas: asphalt and paving
    park: new THREE.MeshStandardMaterial({ color: 0x7f9a62, roughness: 1 }),
    clay: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xc9d8ec, roughness: 0.3, metalness: 0.2 }),
    navy: new THREE.MeshStandardMaterial({ color: 0x072d5e, roughness: 0.7 }),
    cable: new THREE.LineBasicMaterial({ color: 0x8aa0c0 }),
    marker: new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0.95, depthWrite: false }),
  };

  const water = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600, 160, 160), mat.water);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  const uT = { value: 0 };
  let placeContext = () => {};
  let harbour = null; // boats, tidal current, wakes and flowing water (src/harbour.js), built with the city
  const grow = []; // landmark groups scaled on Y during the intro
  const PIN_Y = 22; // above every tower around the NYSE (tallest neighbour ≈ 23 units)
  let ring, anchor = new THREE.Vector3(0, PIN_Y + 4, 0); // label sits just above the pin
  const keepClearOf = new THREE.Vector3(0, 8, 0); // the NYSE: clouds never cross the camera's view of it

  // GLSL: world x/z → lon/lat (same local projection as the data) → web-mercator UV in the aerial image.
  let ob = { west: 0, east: 0, south: 0, north: 0 };
  const orthoU = { uOrtho: { value: null }, uOB: { value: new THREE.Vector4() }, uOrig: { value: new THREE.Vector4() } };
  const ORTHO_GLSL = `uniform sampler2D uOrtho; uniform vec4 uOB; uniform vec4 uOrig;
    vec4 orthoAt(vec3 w) {
      float lon = uOrig.y + w.x / uOrig.z, lat = uOrig.x - w.z / uOrig.w;
      float my = log(tan(0.785398 + radians(lat) * 0.5));
      vec2 uv = vec2((lon - uOB.x) / (uOB.y - uOB.x), (my - uOB.z) / (uOB.w - uOB.z));
      float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
      return vec4(texture2D(uOrtho, clamp(uv, 0.0, 1.0)).rgb, inside);
    }`;
  // roofsOnly: drape the photo on low roofs only (tall roofs lean in aerial photos, so their pixels are wrong).
  const patchOrtho = (sh, amount, roofsOnly) => {
    Object.assign(sh.uniforms, orthoU);
    if (!sh.vertexShader.includes('varying vec3 vWPos')) {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;');
    }
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + ORTHO_GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec4 o_ = orthoAt(vWPos); float up_ = ${roofsOnly ? 'step(0.5, abs(vWN.y)) * (1.0 - smoothstep(3.0, 5.5, vWPos.y)) * (1.0 - step(vGlass, -0.5))' : '1.0'}; diffuseColor.rgb = mix(diffuseColor.rgb, o_.rgb, o_.a * up_ * ${amount.toFixed(2)}); }`);
  };

  function build(d) {
    const rand = rng(7);
    // ---- Land and parks (flat clay slabs on the water)
    // Flat ground pieces, tessellated so the curved horizon bends them smoothly (long triangles would sink).
    const tessellate = (geo, maxEdge) => {
      const src = geo.toNonIndexed().attributes.position.array, out = [];
      const split = (a, b, c, depth) => {
        const d = (p, q) => Math.hypot(p[0] - q[0], p[2] - q[2]);
        if (depth > 9 || Math.max(d(a, b), d(b, c), d(c, a)) <= maxEdge) { out.push(...a, ...b, ...c); return; }
        const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
        const ab = m(a, b), bc = m(b, c), ca = m(c, a);
        split(a, ab, ca, depth + 1); split(ab, b, bc, depth + 1); split(ca, bc, c, depth + 1); split(ab, bc, ca, depth + 1);
      };
      for (let i = 0; i < src.length; i += 9) split([src[i], src[i + 1], src[i + 2]], [src[i + 3], src[i + 4], src[i + 5]], [src[i + 6], src[i + 7], src[i + 8]], 0);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
      g.computeVertexNormals();
      return g;
    };
    const slab = (flat, depth, material, y) => {
      const shape = new THREE.Shape(pairs(flat).map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(tessellate(geo, 24), material);
      m.position.y = y + depth;
      m.receiveShadow = true;
      scene.add(m);
    };
    // Ground: the real aerial photo (streets, parks, piers, the shores' real buildings seen from above).
    const ground = new THREE.MeshStandardMaterial({ color: 0xbdbab3, roughness: 0.95 });
    ground.onBeforeCompile = (sh) => patchOrtho(sh, 1.0, false);
    d.land.forEach((l) => slab(l, GROUND - 0.25, ground, 0));
    // Seawalls: the island's stone edge from the waterline up to the street, instead of a paper-thin cut.
    { const wall = [], wn = [];
      for (const l of d.land) { const p = pairs(l); for (let i = 0; i < p.length; i++) { const [x0, z0] = p[i], [x1, z1] = p[(i + 1) % p.length];
        const nx = z1 - z0, nz = -(x1 - x0), L = Math.hypot(nx, nz) || 1; const y = GROUND - 0.25;
        wall.push(x0, 0, z0, x1, 0, z1, x1, y, z1, x0, 0, z0, x1, y, z1, x0, y, z0); for (let k = 0; k < 6; k++) wn.push(nx / L, 0, nz / L); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wall, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3));
      scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.95, side: THREE.DoubleSide }))); }

    // ---- Buildings: one merged mesh of real footprints, extruded to real heights.
    const PAL = d.palette.map((h) => new THREE.Color(h)); // real OSM building:colour / roof:colour (sRGB → linear)
    const pos = [], nor = [], col = [], del = [], gls = [], tops = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), f = new THREE.Vector3();
    let color, delay, glassy, top;
    const tri = (p0, p1, p2, normal) => {
      f.subVectors(p1, p0).cross(c.subVectors(p2, p0));
      const [q1, q2] = f.dot(normal) < 0 ? [p2, p1] : [p1, p2]; // wind every face toward its outward normal
      for (const p of [p0, q1, q2]) { pos.push(p.x, p.y, p.z); nor.push(normal.x, normal.y, normal.z); col.push(color.r, color.g, color.b); del.push(delay); gls.push(glassy); tops.push(top); }
    };
    const up = new THREE.Vector3(0, 1, 0);
    // Rooftop kit, merged into the city mesh so it grows with its building. glassy = -1 marks plain surfaces (no windows).
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const quad = (p0, p1, p2, p3, nrm) => { tri(p0, p1, p2, nrm); tri(p0, p2, p3, nrm); };
    const box = (x, z, w, d2, yb, ht, rot = 0) => {
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const P = (u, v, y) => V(x + u * cs - v * sn, y, z + u * sn + v * cs);
      const c4 = [[-w / 2, -d2 / 2], [w / 2, -d2 / 2], [w / 2, d2 / 2], [-w / 2, d2 / 2]];
      for (let i = 0; i < 4; i++) {
        const [u0, v0] = c4[i], [u1, v1] = c4[(i + 1) % 4];
        const ex = P(u1, v1, 0).sub(P(u0, v0, 0)), nrm = V(ex.z, 0, -ex.x).normalize();
        const mid = P((u0 + u1) / 2, (v0 + v1) / 2, 0);
        if (nrm.x * (mid.x - x) + nrm.z * (mid.z - z) < 0) nrm.negate(); // face outward
        quad(P(u0, v0, yb), P(u1, v1, yb), P(u1, v1, yb + ht), P(u0, v0, yb + ht), nrm);
      }
      quad(P(-w / 2, -d2 / 2, yb + ht), P(w / 2, -d2 / 2, yb + ht), P(w / 2, d2 / 2, yb + ht), P(-w / 2, d2 / 2, yb + ht), up);
    };
    const WOOD = new THREE.Color('#8a6a50'), WOOD_TOP = new THREE.Color('#5b4a3e'), STEEL = new THREE.Color('#4a4f57'), HVAC = new THREE.Color('#d9dcdf');
    // NYC wooden water tank on steel legs (≈4 m across, 5 m tall, conical cap).
    const waterTower = (x, z, yb) => {
      const r = 0.6, legH = 0.45, tankH = 0.75, N = 10; // ≈5 m across, 6 m tall
      color = STEEL; for (const [u, v] of [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]]) box(x + u, z + v, 0.07, 0.07, yb, legH);
      color = WOOD;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2;
        const nrm = V(Math.cos(am), 0, Math.sin(am));
        quad(V(x + r * Math.cos(a0), yb + legH, z + r * Math.sin(a0)), V(x + r * Math.cos(a1), yb + legH, z + r * Math.sin(a1)), V(x + r * Math.cos(a1), yb + legH + tankH, z + r * Math.sin(a1)), V(x + r * Math.cos(a0), yb + legH + tankH, z + r * Math.sin(a0)), nrm);
      }
      color = WOOD_TOP;
      const apex = V(x, yb + legH + tankH + 0.32, z);
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2;
        tri(V(x + r * 1.06 * Math.cos(a0), yb + legH + tankH, z + r * 1.06 * Math.sin(a0)), V(x + r * 1.06 * Math.cos(a1), yb + legH + tankH, z + r * 1.06 * Math.sin(a1)), apex.clone(), V(Math.cos(am) * 0.7, 0.7, Math.sin(am) * 0.7).normalize());
      }
    };
    for (const row of d.b) {
      const [base, h, tone, wallI, roofI] = row;
      const pts = pairs(row.slice(5));
      if (pts.length < 3) continue;
      const y0 = GROUND + base, y1 = y0 + h;
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const v = 0.96 + rand() * 0.06;
      const wallC = PAL[wallI].clone().multiplyScalar(v), roofC = PAL[roofI].clone().multiplyScalar(v);
      glassy = tone === 1 ? 1 : 0;
      top = y1;
      color = wallC;
      delay = Math.hypot(cx, cz) * 0.0065 + rand() * 0.25;
      for (let i = 0; i < pts.length; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
        n.set(z1 - z0, 0, -(x1 - x0)).normalize();
        if (inside(pts, (x0 + x1) / 2 + n.x * 0.05, (z0 + z1) / 2 + n.z * 0.05)) n.negate();
        const nn = n.clone();
        a.set(x0, y0, z0); b.set(x1, y0, z1); const t1 = new THREE.Vector3(x1, y1, z1), t0 = new THREE.Vector3(x0, y1, z0);
        tri(a.clone(), b.clone(), t1, nn); tri(a.clone(), t1.clone(), t0, nn);
      }
      color = roofC; glassy = 0;
      const faces = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []);
      for (const [i, j, k] of faces) tri(new THREE.Vector3(pts[i][0], y1, pts[i][1]), new THREE.Vector3(pts[j][0], y1, pts[j][1]), new THREE.Vector3(pts[k][0], y1, pts[k][1]), up);
      // Rooftop clutter where it fits inside the footprint: stair/elevator bulkhead, water tanks on masonry, plant on towers.
      const area = Math.abs(faces.reduce((s, [i, j, k]) => s + ((pts[j][0] - pts[i][0]) * (pts[k][1] - pts[i][1]) - (pts[k][0] - pts[i][0]) * (pts[j][1] - pts[i][1])) / 2, 0));
      const fits = (x, z, r) => [[r, r], [-r, r], [r, -r], [-r, -r]].every(([u, v]) => inside(pts, x + u, z + v));
      const edge = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
      if (h > 2 && area > 6) {
        glassy = -1; top = y1 + 3;
        const ext = Math.sqrt(area), bx = cx + (rand() - 0.5) * ext * 0.3, bz = cz + (rand() - 0.5) * ext * 0.3, bw = THREE.MathUtils.clamp(ext * 0.3, 0.6, 3.2);
        if (rand() < 0.8 && fits(bx, bz, bw * 0.6)) { color = roofC.clone().lerp(wallC, 0.5).multiplyScalar(0.92); box(bx, bz, bw, bw * (0.6 + rand() * 0.5), y1, 0.35 + rand() * 0.45, edge); }
        if (tone !== 1 && h < 24 && rand() < 0.55) {
          const tx = cx + (rand() - 0.5) * ext * 0.5, tz = cz + (rand() - 0.5) * ext * 0.5;
          if (fits(tx, tz, 0.7)) waterTower(tx, tz, y1);
        }
        if (tone === 1 || h > 24) for (let k = 0; k < 3; k++) {
          const ux = cx + (rand() - 0.5) * ext * 0.55, uz = cz + (rand() - 0.5) * ext * 0.55;
          if (fits(ux, uz, 0.5)) { color = HVAC; box(ux, uz, 0.5 + rand() * 0.5, 0.4 + rand() * 0.4, y1, 0.22 + rand() * 0.15, edge); }
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aDelay', new THREE.Float32BufferAttribute(del, 1));
    geo.setAttribute('aGlass', new THREE.Float32BufferAttribute(gls, 1));
    geo.setAttribute('aTop', new THREE.Float32BufferAttribute(tops, 1));

    // Facades: floor bands and window bays drawn from world position on vertical faces, faded where they'd shimmer.
    const facade = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, vertexColors: true });
    facade.onBeforeCompile = (sh) => {
      patchGrowth(sh, uT);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;\nattribute float aGlass;\nvarying float vGlass;\nattribute float aTop;\nvarying float vTop;\nvarying float vY0;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);\nvGlass = aGlass;\nvTop = aTop - position.y;\nvY0 = position.y;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;\nvarying float vGlass;\nvarying float vTop;\nvarying float vY0;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float side = 1.0 - step(0.5, abs(vWN.y));
          float glz = max(vGlass, 0.0), plain = step(vGlass, -0.5), mas = (1.0 - glz) * (1.0 - plain);
          float u = abs(vWN.x) > 0.5 ? vWPos.z : vWPos.x;
          float fy = fract(vY0 / 0.45), fu = fract(u / 0.42);      // ~3.6 m floors, ~3.4 m bays (8 m per unit)
          float aa = clamp(1.0 - max(fwidth(vY0 / 0.45), fwidth(u / 0.42)) * 1.2, 0.0, 1.0);
          float hAbove = vY0 - ${GROUND.toFixed(2)};
          float above = step(0.6, hAbove) * step(0.34, vTop);
          // Masonry: punched windows, dark glass with a cool sky tint.
          float punched = step(0.28, fy) * step(fy, 0.8) * step(0.22, fu) * step(fu, 0.78) * above;
          vec3 pane = vec3(0.16, 0.2, 0.26);
          diffuseColor.rgb = mix(diffuseColor.rgb, pane, punched * side * mix(0.32, 0.62, aa) * mas);
          // Glass towers: sky reflected more strongly up the shaft, lighter spandrel bands every floor, thin mullions.
          float frac = hAbove / max(hAbove + vTop, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.7, 0.82), glz * side * (0.05 + 0.17 * smoothstep(0.1, 1.0, frac)));
          float spandrel = step(0.84, fy) * above, mullion = step(0.93, fu);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.35 + 0.04, max(spandrel, mullion * 0.6) * side * glz * mix(0.35, 0.8, aa));
          // Cornice: a lit stone band at the parapet with its shadow line under it (masonry only).
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.2 + 0.03, step(vTop, 0.22) * side * mas);
          diffuseColor.rgb *= 1.0 - 0.38 * step(0.22, vTop) * step(vTop, 0.32) * side * mas;
          // Storefronts: a dark glazed base with mullions along the street.
          float shop = step(0.06, hAbove) * step(hAbove, 0.5) * side * (1.0 - plain);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.1, 0.12, 0.15), vec3(0.75, 0.72, 0.66), step(0.9, fract(u / 0.7))), shop * 0.85);
          // Grounding: walls darken towards street level (cheap ambient occlusion), so towers sit on the ground.
          float ao = mix(0.7, 1.0, smoothstep(0.6, 7.0, vWPos.y));
          diffuseColor.rgb *= mix(1.0, ao, side);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.14, max(vGlass, 0.0) * (1.0 - step(0.5, abs(vWN.y))));')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.45, max(vGlass, 0.0) * (1.0 - step(0.5, abs(vWN.y))));');
      patchOrtho(sh, 0.85, true); // real rooftops from the aerial photo
    };
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    depth.onBeforeCompile = (sh) => patchGrowth(sh, uT);
    const city = new THREE.Mesh(geo, facade);
    city.customDepthMaterial = depth;
    city.castShadow = city.receiveShadow = true;
    scene.add(city);

    // ---- Context beyond the mapped area (north Manhattan, Brooklyn, Jersey City): low-detail blocks that fade
    // into the haze, so the real Financial District doesn't end in an empty plain. Not real buildings.
    let mx0 = Infinity, mx1 = -Infinity, mz0 = Infinity, mz1 = -Infinity;
    for (const row of d.b) for (let i = 5; i < row.length; i += 2) { mx0 = Math.min(mx0, row[i]); mx1 = Math.max(mx1, row[i]); mz0 = Math.min(mz0, row[i + 1]); mz1 = Math.max(mz1, row[i + 1]); }
    const lands = d.land.map(pairs);
    // Real positions from latitude/longitude, in the same projection as the data.
    const ll = (lat, lon) => [((lon - d.origin[1]) * 111320 * Math.cos((d.origin[0] * Math.PI) / 180)) / d.unit, (-(lat - d.origin[0]) * 110540) / d.unit];
    const esb = ll(40.7484, -73.9857);
    const fill = [];
    for (let x = -330; x <= 440; x += 7) {
      for (let z = -880; z <= 260; z += 7) {
        if (rand() < 0.22) continue; // open lots, so the blocks don't read as a grid
        const inMapped = x > mx0 - 3 && x < mx1 + 3 && z > mz0 - 3 && z < mz1 + 3;
        if (inMapped || !lands.some((l) => inside(l, x, z))) continue;
        { const lon = d.origin[1] + x * d.unit / (111320 * Math.cos((d.origin[0] * Math.PI) / 180)), lat = d.origin[0] - z * d.unit / 110540;
          if (lon > ob.west && lon < ob.east && lat > ob.south && lat < ob.north) continue; } // the photo shows the real city here
        const north = Math.max(0, -(z - mz0)) / 120; // Manhattan rises again towards Midtown
        const onManhattan = inside(lands[0], x, z);
        if (!onManhattan && (Math.hypot(x, z) < 650 || rand() < 0.45)) continue; // keep the near sides open water and low shore: Manhattan is the subject
        const midtown = onManhattan ? Math.exp(-((x - esb[0]) ** 2 + (z - esb[1]) ** 2) / (2 * 130 ** 2)) : 0;
        const h = 1.6 + rand() * 5 + (onManhattan ? rand() * 9 * Math.min(1, 0.4 + north) : rand() * 4) + midtown * rand() * rand() * 34;
        fill.push({ x: x + (rand() - 0.5) * 4, z: z + (rand() - 0.5) * 4, w: 2.5 + rand() * 5, d: 2.5 + rand() * 5, r: onManhattan ? 0.5 + (rand() - 0.5) * 0.08 : (rand() - 0.5) * 0.3, h: h * (0.5 + rand() * 0.5), delay: 0.8 + Math.hypot(x, z) * 0.004 + rand() * 0.3 });
      }
    }
    const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const ctxMesh = new THREE.InstancedMesh(boxGeo, mat.clay, fill.length);
    ctxMesh.castShadow = false; ctxMesh.receiveShadow = true; // no shadow clutter from context blocks
    const CTX = ['#b9a48c', '#a7856c', '#c8b9a3', '#9fa6ad', '#8d9fb2', '#c3ad94', '#a8968a'].map((h) => new THREE.Color(h)); // brownstone, brick, limestone, glass
    const bgC = new THREE.Color(PAGE_BG), tc = new THREE.Color();
    // Atmospheric perspective: context blocks fade toward the page colour with distance, so the real island stays the subject.
    fill.forEach((bk, i) => ctxMesh.setColorAt(i, tc.copy(CTX[(i * 7 + (i >> 3)) % CTX.length]).lerp(bgC, Math.min(0.78, 0.2 + Math.hypot(bk.x, bk.z) / 900))));
    scene.add(ctxMesh);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
    placeContext = (time) => {
      fill.forEach((bk, i) => {
        const e = easeOut(clamp01((time - bk.delay) / 1.3));
        ctxMesh.setMatrixAt(i, m4.compose(pv.set(bk.x, GROUND, bk.z), q.setFromAxisAngle(yAxis, bk.r), sv.set(bk.w, Math.max(0.001, bk.h * e), bk.d)));
      });
      ctxMesh.instanceMatrix.needsUpdate = true;
    };
    placeContext(0);

    // ---- Street and park trees at their real positions (NYC Parks Forestry Tree Points), crown size from trunk diameter.
    treesData.then((t) => {
      const n = t.length / 3;
      if (!n) return;
      const crown = new THREE.IcosahedronGeometry(1, 0).scale(1, 0.85, 1);
      const trees = new THREE.InstancedMesh(crown, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), n);
      // Mid-October in New York: mostly green, some crowns already turning.
      const LEAF = ['#506a3f', '#5a7546', '#47603d', '#66784a', '#8a8548', '#9a7442', '#8a5c3a'].map((h) => new THREE.Color(h));
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), tr = rng(11);
      for (let i = 0; i < n; i++) {
        const r = Math.max(0.25, t[i * 3 + 2]);
        q4.setFromAxisAngle(up, tr() * Math.PI);
        m4.compose(new THREE.Vector3(t[i * 3], GROUND - 0.25 + 0.35 + r * 0.85, t[i * 3 + 1]), q4, new THREE.Vector3(r, r * (0.9 + tr() * 0.3), r));
        trees.setMatrixAt(i, m4);
        const k = tr();
        trees.setColorAt(i, LEAF[k < 0.84 ? Math.floor(tr() * 4) : 4 + Math.floor(tr() * 3)]);
      }
      trees.castShadow = true; trees.receiveShadow = true;
      scene.add(trees);
      renderer.shadowMap.needsUpdate = true;
    });

    // ---- Harbour: ferries on their real routes, moved by simple ship kinematics and the tide (src/harbour.js).
    harbour = createHarbour({ scene, camera, renderer, ll, reducedMotion, curve: { K: CURVE_K, D: CURVE_D } });
    mat.water.onBeforeCompile = harbour.patchWater;
    mat.water.needsUpdate = true;
    harbour.step(0);

    // ---- Landmarks, at their real positions
    // One World Trade Center: tapered square prism on a podium, with spire (417 m roof, 541 m spire).
    const wtc = new THREE.Group();
    const podium = new THREE.Mesh(new THREE.BoxGeometry(7.4, 9, 7.4).translate(0, 4.5, 0), mat.glass);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 5.2, 43, 4, 1).translate(0, 21.5 + 9, 0), mat.glass);
    shaft.rotation.y = Math.PI / 4;
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 15, 6).translate(0, 52 + 7.5, 0), mat.clay);
    for (const o of [podium, shaft, spire]) { o.castShadow = o.receiveShadow = true; wtc.add(o); }
    wtc.position.set(d.wtc[0], GROUND, d.wtc[1]);
    scene.add(wtc);
    grow.push({ obj: wtc, delay: 0.5 });

    // Empire State Building, at its real position and height (381 m roof, 443 m tip): setbacks, crown, mast.
    const esbG = new THREE.Group();
    const tiers = [[13, 6.5, 8], [10, 5.5, 10], [7, 4.8, 22], [4.6, 3.6, 4], [3, 2.6, 3]];
    let y = 0;
    for (const [w, dd, h] of tiers) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd).translate(0, y + h / 2, 0), mat.clay); m.castShadow = m.receiveShadow = true; esbG.add(m); y += h; }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.8, 8.4, 8).translate(0, y + 4.2, 0), mat.clay);
    esbG.add(mast);
    esbG.position.set(esb[0], GROUND, esb[1]);
    esbG.rotation.y = 0.5; // the Midtown grid runs 29° off true north
    scene.add(esbG);
    grow.push({ obj: esbG, delay: 1.1 });

    // New York Stock Exchange: block, six columns, pediment, facing Broad Street.
    const nyse = new THREE.Group();
    nyse.add(new THREE.Mesh(new THREE.BoxGeometry(9, 6.4, 7).translate(0, 3.2, 0), new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.6 }))); // white marble, as built
    for (let i = 0; i < 6; i++) {
      const colm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 5, 10).translate(0, 2.5, 0), mat.clay);
      colm.position.set(-3.4 + i * 1.36, 0, 4.1);
      nyse.add(colm);
    }
    const entab = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.9, 1.4).translate(0, 5.45, 4.1), mat.clay);
    const triangle = new THREE.Shape([new THREE.Vector2(-4.8, 0), new THREE.Vector2(4.8, 0), new THREE.Vector2(0, 1.7)]);
    const pediment = new THREE.Mesh(new THREE.ExtrudeGeometry(triangle, { depth: 1.4, bevelEnabled: false }).translate(0, 5.9, 3.4), mat.clay);
    nyse.add(entab, pediment);
    nyse.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    nyse.position.set(0, GROUND, 0);
    nyse.rotation.y = -d.nyse.angle; // long side follows Broad Street; the portico faces the camera side
    nyse.scale.set(0.62, 0.78, 0.8); // the real footprint is about 42 m × 52 m
    scene.add(nyse);
    grow.push({ obj: nyse, delay: 0.25, sy: 0.78 });

    // Marker on the NYSE roof: the page's one orange moment in the scene (its pulse lives in CSS on the label).
    ring = new THREE.Group(); // roof ring + a thin leader up to the label, like a map callout
    const disc = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 48), mat.marker);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = GROUND + 6.4;
    const leader = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 6).translate(0, 0.5, 0), mat.marker);
    leader.position.y = GROUND + 6.4;
    leader.scale.y = PIN_Y - GROUND - 6.4;
    const pin = new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 16), new THREE.MeshBasicMaterial({ color: ORANGE, toneMapped: false }));
    pin.position.y = PIN_Y;
    const halo = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 16), new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false }));
    halo.position.y = PIN_Y;
    ring.add(disc, leader, pin, halo);
    ring.visible = false;
    scene.add(ring);

    // Brooklyn Bridge along its mapped line: deck, two towers, catenary cables.
    if (d.bridge) {
      const [ax, az] = d.bridge.a, [bx, bz] = d.bridge.b;
      const L = Math.hypot(bx - ax, bz - az) + 60; // the mapped deck stops at the data edge; run on into Brooklyn
      const bridge = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(L, 0.5, 2.6).translate(L / 2, 5, 0), mat.clay);
      bridge.add(deck);
      const towers = [L * 0.36, L * 0.86];
      for (const tx of towers) {
        for (const dz of [-1.2, 1.2]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.1).translate(0, 5.5, 0), mat.clay);
          leg.position.set(tx, 0, dz);
          bridge.add(leg);
        }
        for (const y of [8, 10.6]) {
          const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 3.4), mat.clay);
          beam.position.set(tx, y, 0);
          bridge.add(beam);
        }
      }
      bridge.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      for (const dz of [-1.2, 1.2]) {
        const pts = [];
        const span = (xa, xb, ya, yb, sag) => {
          for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            pts.push(new THREE.Vector3(xa + (xb - xa) * t, ya + (yb - ya) * t - Math.sin(Math.PI * t) * sag, dz));
          }
        };
        span(0, towers[0], 5.3, 11, 1.4);
        span(towers[0], towers[1], 11, 11, 6.2);
        span(towers[1], L, 11, 5.3, 1.4);
        bridge.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat.cable));
      }
      bridge.position.set(ax, 0, az);
      bridge.rotation.y = -Math.atan2(bz - az, bx - ax);
      scene.add(bridge);
      grow.push({ obj: bridge, delay: 1.0 });
    }
  }

  // ---- Clouds: soft puffs drifting east, with their shadows gliding over the ground below.
  const puff = (dark) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const r2 = rng(dark ? 3 : 5);
    for (let k = 0; k < 7; k++) {
      const x = 34 + r2() * 60, y = 44 + r2() * 40, r = 22 + r2() * 26;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, dark ? 'rgba(4, 33, 63,0.9)' : 'rgba(255,255,255,1)');
      grd.addColorStop(0.55, dark ? 'rgba(4, 33, 63,0.5)' : 'rgba(246,249,255,0.85)');
      grd.addColorStop(1, dark ? 'rgba(4, 33, 63,0)' : 'rgba(214,224,240,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // Seen from above, cloud tops are bright white: no grey underside (that was for the old side-on view).
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const sunDir = sun.position.clone().normalize();
  const clouds = [];
  // Is a point on the camera's line of sight to the NYSE? (the sightline leans toward the camera as it rises)
  const blocksView = (x, y, z, r) => {
    const k = (y - keepClearOf.y) * Math.tan(rig.pol);
    return Math.hypot(x - (keepClearOf.x + Math.sin(rig.az) * k), z - (keepClearOf.z + Math.cos(rig.az) * k)) < r + 18;
  };
  // In front of the city (between it and the camera)?
  const inFront = (x, z) => (x - target.x) * Math.sin(rig.az) + (z - target.z) * Math.cos(rig.az) > -20;
  function addClouds() { // built after the intro, so their textures never compete with the buildings growing in
    const cloudTex = puff(false), shadeTex = puff(true);
    const crand = rng(11);
    for (let k = 0; k < 6; k++) {
      const y = 74 + crand() * 30, sc = 40 + crand() * 34;
      let x, z, tries = 0;
      do { x = -420 + crand() * 860; z = -420 + crand() * 600; } while ((blocksView(x, y, z, sc * 0.5) || inFront(x, z)) && ++tries < 60); // beyond the city, never between it and the camera
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.55 + crand() * 0.2, depthWrite: false, fog: false }));
      sprite.scale.set(sc, sc * 0.55, 1);
      const shade = new THREE.Mesh(new THREE.PlaneGeometry(sc * 0.9, sc * 0.5), new THREE.MeshBasicMaterial({ map: shadeTex, transparent: true, opacity: 0.2, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2;
      const cl = { sprite, shade, x, y, z, r: sc * 0.5, speed: 1.6 + crand() * 1.4 };
      shade.visible = false; // on pale water, cloud shadows read as smudges
      scene.add(sprite, shade);
      clouds.push(cl);
    }
    placeClouds(0);
  }
  const placeClouds = (dt) => {
    for (const cl of clouds) {
      cl.x += cl.speed * dt;
      if (cl.x > 440) cl.x -= 860;
      // drifting through the NYSE sightline: fade out and back in, never parked over the building
      const target = blocksView(cl.x, cl.y, cl.z, cl.r) || inFront(cl.x, cl.z) || cl.x > 410 || cl.x < -400 ? 0 : 1; // also fade at both ends of the lane
      cl.fade = cl.fade === undefined ? target : cl.fade + (target - cl.fade) * Math.min(1, dt * 2);
      cl.sprite.material.opacity = (0.42 + (cl.r % 0.15)) * cl.fade;
      cl.shade.material.opacity = 0.07 * cl.fade;
      cl.sprite.position.set(cl.x, cl.y, cl.z);
      const k = cl.y / sunDir.y; // shadow falls along the sunlight onto the ground
      cl.shade.position.set(cl.x - sunDir.x * k, GROUND + 0.15, cl.z - sunDir.z * k);
    }
  };

  // ---- Camera rig
  // Low and wide from the harbour: Lower Manhattan reads as a skyline rising from the water (One World Trade Center
  // the hero, Midtown and the Empire State in the haze), not a map of rooftops. Real towers hide the NYSE from here
  // (ray-marched), so an orange map pin rises above the skyline at its spot.
  // From over the harbour, south of the tip, looking up the island: the tip centred under the headline, water on both sides.
  const target = new THREE.Vector3(-5, 20, -50);
  const rig = { az: 0, pol: 1.05, r: 680 }; // matched to the user's reference layout: tip centred under the copy, water both sides
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  let scroll = 0, size = { w: 1, h: 1, top: 0 }, zoom = 1;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    size = { w, h, top: canvas.offsetTop };
    zoom = w >= 900 ? 1 : 0.55; // phones/tablets: the city band is small, bring the Financial District closer
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Lens shift: city sits right of the copy on desktop, below it on phones.
    if (w >= 900) camera.setViewOffset(w, h, 0, -h * 0.02, w, h); // centred layout: the city sits in the lower part of the hero, under the copy
    else camera.setViewOffset(w, h, 0, h * 0.06, w, h);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ---- Loop: runs during the intro and while the camera eases; then only for the cloud drift (~30 fps) while on screen.
  const clock = new THREE.Clock(false);
  let visible = true, raf = 0, built = false, introDone = false, frameNo = 0, scrollEased = 0, lastDrift = 0;
  const INTRO = 3.4;
  const v = new THREE.Vector3();
  const wake = () => { if (visible && !raf && built) raf = requestAnimationFrame(frame); };

  const onPointer = (e) => {
    if (reducedMotion) return;
    ptr.x = (e.clientX / window.innerWidth - 0.5) * 2;
    ptr.y = (e.clientY / window.innerHeight - 0.5) * 2;
    wake();
  };
  const onScroll = () => { scroll = clamp01(window.scrollY / Math.max(1, canvas.clientHeight)); wake(); };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  function frame() {
    raf = 0;
    const t = reducedMotion ? 99 : clock.getElapsedTime();
    const growing = !introDone;
    if (growing) {
      uT.value = t;
      placeContext(t);
      for (const g of grow) g.obj.scale.y = Math.max(0.001, easeOut(clamp01((t - g.delay) / 1.4))) * (g.sy || 1);
      if (frameNo++ % 6 === 0) renderer.shadowMap.needsUpdate = true; // shadows lag growth by a few frames: invisible, cheap
      if (t > INTRO) {
        introDone = true;
        uT.value = 99;
        placeContext(99);
        renderer.shadowMap.needsUpdate = true;
        ring.visible = true;
        if (withClouds && !clouds.length) addClouds();
        if (label) label.classList.add('is-on');
      }
    }

    const now = clock.getElapsedTime();
    if (!reducedMotion) { placeClouds(Math.min(0.1, now - lastDrift)); harbour?.step(now - lastDrift); }
    lastDrift = now;

    const dx = ptr.x - ptr.sx, dy = ptr.y - ptr.sy, ds = scroll - scrollEased;
    ptr.sx += dx * 0.08;
    ptr.sy += dy * 0.08;
    scrollEased += ds * 0.15;
    const settling = Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002 || Math.abs(ds) > 0.001;

    const az = rig.az + ptr.sx * 0.08;
    const pol = rig.pol - ptr.sy * 0.035 - scrollEased * 0.16;
    const r = rig.r * zoom + scrollEased * 90;
    camera.position.set(target.x + r * Math.sin(pol) * Math.sin(az), target.y + r * Math.cos(pol), target.z + r * Math.sin(pol) * Math.cos(az));
    camera.lookAt(target);

    renderer.render(scene, camera);

    if (label && introDone) {
      v.copy(anchor).applyMatrix4(camera.matrixWorldInverse);
      { const dz = Math.max(0, -v.z - CURVE_D); v.y -= (dz * dz + v.x * v.x) * CURVE_K; }
      v.applyMatrix4(camera.projectionMatrix);
      label.style.transform = `translate3d(${((v.x + 1) / 2) * size.w}px, ${size.top + ((1 - v.y) / 2) * size.h}px, 0) translate(-50%, calc(-100% - 14px))`;
    }

    if (growing || settling) wake();
    else if (!reducedMotion && visible && (clouds.length || harbour)) setTimeout(wake, 33);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  }).observe(canvas);
  new ResizeObserver(wake).observe(canvas);

  // Load the city, compile shaders off the main thread where supported, then start the intro.
  data
    .then((d) => Promise.all([orthoBox, orthoTex]).then(([box, tex]) => {
      const mY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
      if (box && tex) {
        ob = box;
        orthoU.uOrtho.value = tex;
        orthoU.uOB.value.set(box.west, box.east, mY(box.south), mY(box.north));
      } else orthoU.uOB.value.set(1, 2, 1, 2); // no photo: every point falls outside it
      orthoU.uOrig.value.set(d.origin[0], d.origin[1], (111320 * Math.cos((d.origin[0] * Math.PI) / 180)) / d.unit, 110540 / d.unit);
      return d;
    }))
    .then((d) => { build(d); return renderer.compileAsync ? renderer.compileAsync(scene, camera).catch(() => {}) : null; })
    .then(() => { built = true; clock.start(); wake(); })
    .catch(() => hero?.classList.add('no-webgl')); // no data: the poster stands in

  if (new URLSearchParams(location.search).has('debug')) window.__city = { scene, renderer, camera, rig, target, wake: () => { introDone && wake(); } }; // dev inspection only
  return { renderer, scene, camera };
}
