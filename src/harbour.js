// Harbour simulation for the hero: real ferry routes, boat kinematics, tidal current, Kelvin wakes, flowing water.
//
// Physics (scene units: 1 unit = 8 m; time runs at TIME_SCALE × real time so slow vessels visibly move):
// - Each vessel steers toward its next waypoint with a bounded yaw rate (turning radius), accelerates and brakes
//   with a bounded acceleration, and slows on a v = sqrt(2·a·d) profile into terminals, where it dwells.
// - Ground velocity = water-relative velocity + tidal current at the vessel, so boats crab and drift like real ones.
// - Tidal current: rectilinear M2 tide (period 12.42 h). The East River and Hudson reverse every half cycle.
//   Peak speeds are typical published values (East River ~2.5 kn, Hudson/Upper Bay ~1.5 kn); the phase is a
//   reference epoch, not a tide table.
// - Wakes: every few metres the stern drops a sample; each sample's two Kelvin arms spread at 19.47° from the
//   track (the deep-water Kelvin angle), the turbulent centre-line stays narrow, and all wake water drifts with the
//   current and fades.
import * as THREE from 'three';

const UNIT = 8; // metres per scene unit
const KN = 0.514444 / UNIT; // knots → units per second
const TIME_SCALE = 6;
const KELVIN = Math.tan((19.47 * Math.PI) / 180);
const M2 = 12.4206 * 3600; // seconds
const M2_EPOCH = Date.UTC(2026, 0, 1, 4, 10) / 1000; // reference max-ebb time (approximate phase)

// Unit vectors, in scene space (x east, z south), of each waterway's ebb (seaward) direction.
const EBB_EAST_RIVER = new THREE.Vector2(-0.7, 0.71).normalize();
const EBB_HUDSON = new THREE.Vector2(-0.12, 1).normalize();

export function createHarbour({ scene, camera, renderer, ll, reducedMotion, curve }) {
  const tide = (tSec) => Math.cos((2 * Math.PI * (tSec - M2_EPOCH)) / M2); // +1 max ebb, -1 max flood
  // Current field (units/s) at a scene point: East River east of the island's tip, Hudson/Upper Bay elsewhere.
  const eastRiverWeight = (x, z) => THREE.MathUtils.smoothstep(x, 20, 70) * (1 - THREE.MathUtils.smoothstep(z, 70, 140));
  const current = (x, z, phase, out = new THREE.Vector2()) => {
    const w = eastRiverWeight(x, z);
    const er = 2.5 * KN * phase, hu = 1.5 * KN * phase;
    return out.set(EBB_EAST_RIVER.x * er * w + EBB_HUDSON.x * hu * (1 - w), EBB_EAST_RIVER.y * er * w + EBB_HUDSON.y * hu * (1 - w));
  };

  // ---- Vessels on real water (lat, lon waypoints). One big cruise boat runs left to right through the view, under the
  // Brooklyn Bridge (loop: it re-enters off-screen); small craft shuttle between terminals elsewhere.
  const P = (lat, lon) => new THREE.Vector2(...ll(lat, lon));
  const fleet = [
    { name: 'Harbor cruise · East River', len: 85, beam: 16, hull: 0x0d2a4a, decks: 2, funnel: true, vmax: 11, accel: 0.12, yaw: 3, loop: true,
      route: [P(40.6990, -74.0380), P(40.6995, -74.0250), P(40.6993, -74.0120), P(40.7020, -74.0035), P(40.7055, -73.9975), P(40.7072, -73.9915), P(40.7085, -73.9860)] },
    { name: 'Water taxi', len: 18, beam: 6, hull: 0xffd400, decks: 1, vmax: 18, accel: 0.5, yaw: 10,
      route: [P(40.7012, -74.0170), P(40.6990, -74.0080), P(40.6962, -74.0048)] },
    { name: 'Governors Island ferry', len: 26, beam: 9, hull: 0xffffff, decks: 1, vmax: 9, accel: 0.25, yaw: 6,
      route: [P(40.7003, -74.0122), P(40.6962, -74.0138), P(40.6922, -74.0158)] },
    { name: 'NYC Ferry · Hudson', len: 26, beam: 8, hull: 0xffffff, decks: 1, vmax: 20, accel: 0.45, yaw: 8,
      route: [P(40.7145, -74.0195), P(40.7080, -74.0260), P(40.7140, -74.0330)] },
    { name: 'Tug · Hudson', len: 24, beam: 9, hull: 0x9a2f22, decks: 1, vmax: 8, accel: 0.15, yaw: 4,
      route: [P(40.7250, -74.0230), P(40.7050, -74.0245), P(40.6900, -74.0300)] },
    { name: 'Sailboat', len: 12, beam: 4, hull: 0xffffff, decks: 0, mast: true, vmax: 5, accel: 0.1, yaw: 6,
      route: [P(40.6920, -74.0300), P(40.6990, -74.0265), P(40.7060, -74.0245)] },
  ];

  const mat = (c, r = 0.55) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const white = mat(0xf7f7f5), glassBand = mat(0x1d2a3a, 0.3);
  const vessels = fleet.map((f, i) => {
    const L = f.len / UNIT, B = f.beam / UNIT;
    const g = new THREE.Group();
    const hullMat = mat(f.hull);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(L, B * 0.42, B).translate(0, B * 0.21, 0), hullMat);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(B / 2, B * 1.1, 4).rotateZ(-Math.PI / 2).rotateX(Math.PI / 4).scale(1, 0.42 / 0.707, 1).translate(L / 2 + B * 0.5, B * 0.21, 0), hullMat);
    g.add(hull, bow);
    for (let k = 0; k < f.decks; k++) { // superstructure decks stepping back, with a dark window band
      const dl = L * (0.7 - k * 0.18), dy = B * (0.42 + k * 0.32);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(dl, B * 0.3, B * 0.86).translate(-L * 0.05 - k * L * 0.04, dy + B * 0.15, 0), white));
      g.add(new THREE.Mesh(new THREE.BoxGeometry(dl * 1.002, B * 0.1, B * 0.865).translate(-L * 0.05 - k * L * 0.04, dy + B * 0.17, 0), glassBand));
    }
    if (f.funnel) g.add(new THREE.Mesh(new THREE.CylinderGeometry(B * 0.14, B * 0.16, B * 0.5, 10).translate(-L * 0.2, B * 1.25, 0), mat(0xff5400)));
    if (f.mast) g.add(new THREE.Mesh(new THREE.ConeGeometry(B * 0.9, L * 0.9, 3).scale(0.08, 1, 1).translate(0, L * 0.45 + B * 0.4, 0), white)); // sail
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    const start = f.route[0], next = f.route[1];
    return {
      ...f, g, L, B, vmax: f.vmax * KN, accel: f.accel / UNIT, yawMax: (f.yaw * Math.PI) / 180,
      pos: start.clone(), psi: Math.atan2(next.y - start.y, next.x - start.x), v: f.loop ? f.vmax * KN : 0,
      leg: 1, dir: 1, dwell: f.loop ? 0 : i * 20, emitAcc: 0,
      trail: [], // stern samples, newest first: { x, z, fx, fz, v, age }
    };
  });

  // ---- Wakes: one soft foam ribbon per vessel. It opens at the Kelvin angle behind the stern; the turbulent centre
  // fades fast, the two edges (the Kelvin arms) linger; foam is broken up by noise and drifts with the current.
  const MAXS = 90, SPACING = 0.55;
  const wakeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute float aU; attribute float aT; varying float vU; varying float vT; varying vec2 vP;
      void main() { vU = aU; vT = aT; vP = position.xz; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dz = max(0.0, -mv.z - ${curve.D.toFixed(1)}); mv.y -= (dz * dz + mv.x * mv.x) * ${curve.K};
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vU; varying float vT; varying vec2 vP;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        float u = abs(vU);
        float core = (1.0 - smoothstep(0.0, 0.5, u)) * exp(-vT * 5.0) * 0.85;
        float arm = smoothstep(0.62, 0.9, u) * (1.0 - smoothstep(0.9, 1.0, u)) * 0.6;
        float foam = (core + arm) * (0.55 + 0.45 * n(vP * 2.3 + vT * 3.0)) * pow(1.0 - vT, 1.6);
        foam *= smoothstep(0.0, 0.03, vT + 0.01); // soft start at the stern
        gl_FragColor = vec4(vec3(1.0), foam * 0.9); }`,
  });
  for (const s of vessels) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXS * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(MAXS * 2).map((_, k) => (k % 2 ? 1 : -1)), 1));
    geo.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(MAXS * 2), 1).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let k = 0; k < MAXS - 1; k++) { const a0 = k * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
    geo.setIndex(idx);
    s.wake = new THREE.Mesh(geo, wakeMat);
    s.wake.frustumCulled = false;
    s.wake.renderOrder = 1;
    scene.add(s.wake);
    s.life = 30 + s.L * 2; // big hulls leave longer wakes
  }

  const cur = new THREE.Vector2();
  const nowSec = () => Date.now() / 1000;
  let simClock = 0;

  function stepVessel(s, dt, phase) {
    const target = s.route[s.leg];
    const toT = new THREE.Vector2().subVectors(target, s.pos);
    const dist = toT.length();
    const isTerminal = s.leg === 0 || s.leg === s.route.length - 1;
    if (s.dwell > 0) { s.dwell -= dt; s.v = 0; return; }
    if (dist < (isTerminal && !s.loop ? 1.2 : 6)) {
      if (s.loop && s.leg === s.route.length - 1) { // through the view and out: re-enter at the start, off-screen
        s.pos.copy(s.route[0]); s.leg = 1; s.psi = Math.atan2(s.route[1].y - s.route[0].y, s.route[1].x - s.route[0].x); s.trail.length = 0; return;
      }
      if (isTerminal) { s.dwell = 40 + Math.random() * 30; s.dir = -s.dir; s.leg += s.dir; return; } // arrive, dwell, reverse
      s.leg += s.dir;
      return;
    }
    // Steering: bounded yaw rate toward the waypoint (turn radius grows with speed).
    let dPsi = Math.atan2(toT.y, toT.x) - s.psi;
    dPsi = Math.atan2(Math.sin(dPsi), Math.cos(dPsi));
    const yawRate = s.yawMax * Math.min(1, 0.35 + s.v / s.vmax);
    s.psi += THREE.MathUtils.clamp(dPsi, -yawRate * dt, yawRate * dt);
    // Throttle: brake into terminals (v = sqrt(2 a d)), ease off in sharp turns; loopers keep cruising.
    let remaining = dist;
    for (let k = s.leg; k !== -1 && k !== s.route.length && !(k === 0 || k === s.route.length - 1); k += s.dir) remaining += s.route[k].distanceTo(s.route[k + s.dir]);
    const vTarget = s.loop ? s.vmax * (1 - 0.35 * Math.min(1, Math.abs(dPsi) / 1.2)) : Math.min(s.vmax * (1 - 0.5 * Math.min(1, Math.abs(dPsi) / 1.2)), Math.sqrt(2 * s.accel * remaining));
    s.v += THREE.MathUtils.clamp(vTarget - s.v, -s.accel * 1.6 * dt, s.accel * dt);
    // Ground velocity = water velocity + current.
    current(s.pos.x, s.pos.y, phase, cur);
    s.pos.x += (Math.cos(s.psi) * s.v + cur.x) * dt;
    s.pos.y += (Math.sin(s.psi) * s.v + cur.y) * dt;
    // Wake samples at the stern, spaced by distance travelled through the water.
    s.emitAcc += s.v * dt;
    while (s.emitAcc > SPACING && s.v > 0.05) {
      s.emitAcc -= SPACING;
      s.trail.unshift({ x: s.pos.x - Math.cos(s.psi) * s.L * 0.5, z: s.pos.y - Math.sin(s.psi) * s.L * 0.5, fx: Math.cos(s.psi), fz: Math.sin(s.psi), v: s.v, age: 0 });
      if (s.trail.length > MAXS) s.trail.length = MAXS;
    }
  }

  function stepWake(dt, phase) {
    for (const s of vessels) {
      const tr = s.trail;
      for (const p of tr) { p.age += dt; current(p.x, p.z, phase, cur); p.x += cur.x * dt; p.z += cur.y * dt; } // wake water drifts with the tide
      while (tr.length && tr[tr.length - 1].age > s.life) tr.pop();
      const pos = s.wake.geometry.attributes.position.array, at = s.wake.geometry.attributes.aT.array;
      // The ribbon starts at the live stern so it never detaches from the boat.
      const pts = [{ x: s.pos.x - Math.cos(s.psi) * s.L * 0.5, z: s.pos.y - Math.sin(s.psi) * s.L * 0.5, fx: Math.cos(s.psi), fz: Math.sin(s.psi), v: s.v, age: 0 }, ...tr].slice(0, MAXS);
      pts.forEach((p, k) => {
        const half = s.B * 0.55 + p.age * p.v * KELVIN; // Kelvin half-angle opening
        const nx = -p.fz, nz = p.fx;
        pos.set([p.x - nx * half, 0.55, p.z - nz * half, p.x + nx * half, 0.55, p.z + nz * half], k * 6);
        at[k * 2] = at[k * 2 + 1] = Math.min(1, p.age / s.life);
      });
      s.wake.geometry.setDrawRange(0, Math.max(0, pts.length - 1) * 6);
      s.wake.geometry.attributes.position.needsUpdate = s.wake.geometry.attributes.aT.needsUpdate = true;
    }
  }

  // ---- Water surface: ripples advected by the same current, so sun glints flow with the tide.
  const waterU = { uTime: { value: 0 }, uEbbER: { value: new THREE.Vector2() }, uEbbH: { value: new THREE.Vector2() } };
  const patchWater = (sh) => {
    Object.assign(sh.uniforms, waterU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWP; uniform float uTime; uniform vec2 uEbbER; uniform vec2 uEbbH;
        // Wind chop: directional waves at spread angles and wavelengths (no single grid direction, so no stripes).
        vec2 chop(vec2 p) { vec2 g = vec2(0.0);
          for (int i = 0; i < 6; i++) { float fi = float(i); float a = fi * 2.399; float k = 0.35 * pow(1.55, fi);
            vec2 dir = vec2(cos(a), sin(a)); g += dir * k * cos(dot(p, dir) * k + fi * 1.7) / pow(1.55, fi * 1.4); }
          return g; }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float w = smoothstep(20.0, 70.0, vWP.x) * (1.0 - smoothstep(70.0, 140.0, vWP.z));
          vec2 flow = mix(uEbbH, uEbbER, w);
          vec2 q = vWP.xz - flow * uTime;           // advect the pattern with the current
          float fade = smoothstep(1400.0, 500.0, length(vViewPosition)); // distant chop averages out instead of aliasing
          vec2 g = chop(q) * 0.16 * fade;
          vec3 nW = normalize(vec3(-g.x, 1.0, -g.y));
          normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz); }`);
  };

  // Warm-up: run the harbour forward so the hero opens mid-voyage, wakes already trailing.
  for (let i = 0; i < 360; i++) {
    const ph = tide(nowSec());
    for (const s of vessels) stepVessel(s, 0.5, ph);
    stepWake(0.5, ph);
  }

  return {
    patchWater,
    step(dtReal) {
      const dt = Math.min(0.1, dtReal) * (reducedMotion ? 0 : TIME_SCALE);
      simClock += dt;
      const phase = tide(nowSec());
      waterU.uTime.value = simClock % 20000; // float32-safe
      waterU.uEbbER.value.copy(EBB_EAST_RIVER).multiplyScalar(2.5 * KN * phase);
      waterU.uEbbH.value.copy(EBB_HUDSON).multiplyScalar(1.5 * KN * phase);
      for (const s of vessels) {
        if (dt > 0) stepVessel(s, dt, phase);
        s.g.position.set(s.pos.x, 0.25, s.pos.y);
        s.g.rotation.y = -s.psi;
      }
      if (dt > 0) stepWake(dt, phase);
    },
  };
}
