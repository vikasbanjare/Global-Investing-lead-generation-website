// Lower Manhattan for the hero, built from real OpenStreetMap footprints and heights (public/data/manhattan.json,
// made by scripts/build-city-data.mjs). Clay-model treatment: buildings grow out of the ground on load, the camera
// follows the pointer and eases back as the page scrolls, clouds drift over. Data © OpenStreetMap contributors (ODbL).
import * as THREE from 'three';

const PAGE_BG = 0xf3f8ff; // brand Cloud White; must match --bg
const ORANGE = 0xe97e26;
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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false; // the light never moves: bake shadows, refresh only while buildings grow
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAGE_BG, 980, 1750); // starts just past the Financial District: Midtown and the far shores sit in haze
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 3200);

  // Morning light: cool sky fill, warm low sun from the east-south-east (the real morning sun over the East River).
  scene.add(new THREE.HemisphereLight(0xf8fbff, 0xdde1e8, 1.35)); // soft fill: shaded faces stay readable, sunlit ones pop
  const sun = new THREE.DirectionalLight(0xffd3a3, 3.6);
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
    water: new THREE.MeshBasicMaterial({ color: 0xd2e3f5, toneMapped: false }),
    land: new THREE.MeshStandardMaterial({ color: 0xf3f5f9, roughness: 1 }),
    park: new THREE.MeshStandardMaterial({ color: 0xe1e9dd, roughness: 1 }),
    clay: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xc9d8ec, roughness: 0.3, metalness: 0.2 }),
    navy: new THREE.MeshStandardMaterial({ color: 0x1b3c6a, roughness: 0.7 }),
    cable: new THREE.LineBasicMaterial({ color: 0x8aa0c0 }),
    marker: new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0.95, depthWrite: false }),
  };

  const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat.water);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  const uT = { value: 0 };
  let placeContext = () => {};
  const grow = []; // landmark groups scaled on Y during the intro
  const PIN_Y = 34; // above every tower around the NYSE (tallest neighbour ≈ 23 units)
  let ring, anchor = new THREE.Vector3(0, PIN_Y + 4, 0); // label sits just above the pin
  const keepClearOf = new THREE.Vector3(0, 8, 0); // the NYSE: clouds never cross the camera's view of it

  function build(d) {
    const rand = rng(7);
    // ---- Land and parks (flat clay slabs on the water)
    const slab = (flat, depth, material, y) => {
      const shape = new THREE.Shape(pairs(flat).map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = depth ? new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.25, bevelSegments: 1 }) : new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, material);
      m.position.y = y;
      m.receiveShadow = true;
      scene.add(m);
    };
    d.land.forEach((l) => slab(l, GROUND - 0.25, mat.land, 0));
    d.parks.forEach((p) => slab(p, 0, mat.park, GROUND + 0.02));

    // ---- Buildings: one merged mesh of real footprints, extruded to real heights.
    const TONES = [new THREE.Color(0xf4f6fa), new THREE.Color(0xd5e0ef), new THREE.Color(0xf1ebe3)]; // clay, glass, masonry
    const pos = [], nor = [], col = [], del = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), f = new THREE.Vector3();
    let color, delay;
    const tri = (p0, p1, p2, normal) => {
      f.subVectors(p1, p0).cross(c.subVectors(p2, p0));
      const [q1, q2] = f.dot(normal) < 0 ? [p2, p1] : [p1, p2]; // wind every face toward its outward normal
      for (const p of [p0, q1, q2]) { pos.push(p.x, p.y, p.z); nor.push(normal.x, normal.y, normal.z); col.push(color.r, color.g, color.b); del.push(delay); }
    };
    const up = new THREE.Vector3(0, 1, 0);
    for (const row of d.b) {
      const [base, h, tone] = row;
      const pts = pairs(row.slice(3));
      if (pts.length < 3) continue;
      const y0 = GROUND + base, y1 = y0 + h;
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const v = 0.97 + rand() * 0.04;
      color = TONES[tone].clone().multiplyScalar(v);
      delay = Math.hypot(cx, cz) * 0.0065 + rand() * 0.25;
      for (let i = 0; i < pts.length; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
        n.set(z1 - z0, 0, -(x1 - x0)).normalize();
        if (inside(pts, (x0 + x1) / 2 + n.x * 0.05, (z0 + z1) / 2 + n.z * 0.05)) n.negate();
        const nn = n.clone();
        a.set(x0, y0, z0); b.set(x1, y0, z1); const t1 = new THREE.Vector3(x1, y1, z1), t0 = new THREE.Vector3(x0, y1, z0);
        tri(a.clone(), b.clone(), t1, nn); tri(a.clone(), t1.clone(), t0, nn);
      }
      const faces = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []);
      for (const [i, j, k] of faces) tri(new THREE.Vector3(pts[i][0], y1, pts[i][1]), new THREE.Vector3(pts[j][0], y1, pts[j][1]), new THREE.Vector3(pts[k][0], y1, pts[k][1]), up);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aDelay', new THREE.Float32BufferAttribute(del, 1));

    // Facades: floor bands and window bays drawn from world position on vertical faces, faded where they'd shimmer.
    const facade = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, vertexColors: true });
    facade.onBeforeCompile = (sh) => {
      patchGrowth(sh, uT);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float side = 1.0 - step(0.5, abs(vWN.y));
          float u = abs(vWN.x) > 0.5 ? vWPos.z : vWPos.x;
          float fy = fract(vWPos.y / 0.9), fu = fract(u / 0.75);
          float win = step(0.3, fy) * step(fy, 0.78) * step(0.18, fu) * step(fu, 0.82) * step(1.5, vWPos.y);
          float aa = clamp(1.0 - max(fwidth(vWPos.y / 0.9), fwidth(u / 0.75)) * 1.4, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.7, 0.77, 0.88), win * side * aa * 0.55);`);
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
    for (const row of d.b) for (let i = 3; i < row.length; i += 2) { mx0 = Math.min(mx0, row[i]); mx1 = Math.max(mx1, row[i]); mz0 = Math.min(mz0, row[i + 1]); mz1 = Math.max(mz1, row[i + 1]); }
    const lands = d.land.map(pairs);
    // Real positions from latitude/longitude, in the same projection as the data.
    const ll = (lat, lon) => [((lon - d.origin[1]) * 111320 * Math.cos((d.origin[0] * Math.PI) / 180)) / d.unit, (-(lat - d.origin[0]) * 110540) / d.unit];
    const esb = ll(40.7484, -73.9857);
    const fill = [];
    for (let x = -330; x <= 440; x += 7) {
      for (let z = -880; z <= 260; z += 7) {
        if ((Math.round(x / 7) % 4 === 0) || (Math.round(z / 7) % 3 === 0) || rand() < 0.14) continue; // streets, and the odd open lot
        const inMapped = x > mx0 - 3 && x < mx1 + 3 && z > mz0 - 3 && z < mz1 + 3;
        if (inMapped || !lands.some((l) => inside(l, x, z))) continue;
        const north = Math.max(0, -(z - mz0)) / 120; // Manhattan rises again towards Midtown
        const onManhattan = inside(lands[0], x, z);
        const midtown = onManhattan ? Math.exp(-((x - esb[0]) ** 2 + (z - esb[1]) ** 2) / (2 * 130 ** 2)) : 0;
        const h = 1.6 + rand() * 5 + (onManhattan ? rand() * 9 * Math.min(1, 0.4 + north) : rand() * 4) + midtown * rand() * rand() * 34;
        fill.push({ x: x + (rand() - 0.5) * 1.8, z: z + (rand() - 0.5) * 1.8, w: 3 + rand() * 3, d: 3 + rand() * 3, h, delay: 0.8 + Math.hypot(x, z) * 0.004 + rand() * 0.3 });
      }
    }
    const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const ctxMesh = new THREE.InstancedMesh(boxGeo, mat.clay, fill.length);
    ctxMesh.castShadow = ctxMesh.receiveShadow = true;
    scene.add(ctxMesh);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    placeContext = (time) => {
      fill.forEach((bk, i) => {
        const e = easeOut(clamp01((time - bk.delay) / 1.3));
        ctxMesh.setMatrixAt(i, m4.compose(pv.set(bk.x, GROUND, bk.z), q, sv.set(bk.w, Math.max(0.001, bk.h * e), bk.d)));
      });
      ctxMesh.instanceMatrix.needsUpdate = true;
    };
    placeContext(0);

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
    nyse.add(new THREE.Mesh(new THREE.BoxGeometry(9, 6.4, 7).translate(0, 3.2, 0), mat.navy));
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
      grd.addColorStop(0, dark ? 'rgba(15,36,71,0.9)' : 'rgba(255,255,255,1)');
      grd.addColorStop(0.55, dark ? 'rgba(15,36,71,0.5)' : 'rgba(246,249,255,0.85)');
      grd.addColorStop(1, dark ? 'rgba(15,36,71,0)' : 'rgba(214,224,240,0)');
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
  const target = new THREE.Vector3(-20, 26, -50);
  const rig = { az: 0.15, pol: 1.12, r: 760 };
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  let scroll = 0, size = { w: 1, h: 1, top: 0 }, zoom = 1;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    size = { w, h, top: canvas.offsetTop };
    zoom = w >= 900 ? 1 : 0.62; // phones/tablets: the city band is small, bring the Financial District closer
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Lens shift: city sits right of the copy on desktop, below it on phones.
    if (w >= 900) camera.setViewOffset(w, h, -w * 0.27, -h * 0.04, w, h);
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
    if (!reducedMotion) placeClouds(Math.min(0.1, now - lastDrift));
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
      v.copy(anchor).project(camera);
      label.style.transform = `translate3d(${((v.x + 1) / 2) * size.w}px, ${size.top + ((1 - v.y) / 2) * size.h}px, 0) translate(-50%, calc(-100% - 14px))`;
    }

    if (growing || settling) wake();
    else if (!reducedMotion && visible && clouds.length) setTimeout(wake, 33);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  }).observe(canvas);
  new ResizeObserver(wake).observe(canvas);

  // Load the city, compile shaders off the main thread where supported, then start the intro.
  data
    .then((d) => { build(d); return renderer.compileAsync ? renderer.compileAsync(scene, camera).catch(() => {}) : null; })
    .then(() => { built = true; clock.start(); wake(); })
    .catch(() => hero?.classList.add('no-webgl')); // no data: the poster stands in

  if (new URLSearchParams(location.search).has('debug')) window.__city = { scene, renderer, camera, rig, target, wake: () => { introDone && wake(); } }; // dev inspection only
  return { renderer, scene, camera };
}
