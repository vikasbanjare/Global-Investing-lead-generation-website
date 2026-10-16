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

  // ---- Vessels on real routes (lat, lon waypoints; terminals at both ends).
  const P = (lat, lon) => new THREE.Vector2(...ll(lat, lon));
  const fleet = [
    { name: 'Staten Island Ferry', len: 94, beam: 21, colour: 0xff6a00, vmax: 16, accel: 0.25, yaw: 3,
      route: [P(40.7008, -74.0131), P(40.6955, -74.0175), P(40.6855, -74.0300), P(40.6720, -74.0470)] },
    { name: 'NYC Ferry · East River', len: 26, beam: 8, colour: 0xffffff, vmax: 22, accel: 0.45, yaw: 8,
      route: [P(40.7030, -74.0066), P(40.7046, -73.9990), P(40.7031, -73.9956)] },
    { name: 'Governors Island ferry', len: 30, beam: 10, colour: 0xffffff, vmax: 9, accel: 0.25, yaw: 6,
      route: [P(40.7003, -74.0122), P(40.6962, -74.0138), P(40.6922, -74.0158)] },
    { name: 'Harbour tour', len: 40, beam: 10, colour: 0xf4f1ea, vmax: 10, accel: 0.25, yaw: 5,
      route: [P(40.7120, -74.0205), P(40.7020, -74.0210), P(40.6975, -74.0140), P(40.6990, -74.0040), P(40.7045, -73.9975)] },
    { name: 'Tug and barge · Hudson', len: 70, beam: 14, colour: 0x8b5a3c, vmax: 6, accel: 0.08, yaw: 2,
      route: [P(40.7250, -74.0230), P(40.7050, -74.0240), P(40.6880, -74.0290)] },
    { name: 'Water taxi', len: 18, beam: 6, colour: 0xffd400, vmax: 18, accel: 0.5, yaw: 10,
      route: [P(40.7012, -74.0170), P(40.6990, -74.0080), P(40.7040, -74.0010)] },
  ];

  const hullMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 });
  const white = hullMat(0xffffff);
  const vessels = fleet.map((f, i) => {
    const L = f.len / UNIT, B = f.beam / UNIT;
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(L, B * 0.45, B).translate(0, B * 0.25, 0), hullMat(f.colour));
    const bow = new THREE.Mesh(new THREE.ConeGeometry(B / 2, B * 0.9, 4).rotateZ(-Math.PI / 2).rotateX(Math.PI / 4).translate(L / 2 + B * 0.42, B * 0.25, 0), hullMat(f.colour));
    const deck = new THREE.Mesh(new THREE.BoxGeometry(L * 0.55, B * 0.4, B * 0.8).translate(-L * 0.08, B * 0.65, 0), white);
    hull.castShadow = deck.castShadow = true;
    g.add(hull, bow, deck);
    scene.add(g);
    const start = f.route[0], next = f.route[1];
    return {
      ...f, g, L, vmax: f.vmax * KN, accel: f.accel / UNIT, yawMax: (f.yaw * Math.PI) / 180,
      pos: start.clone(), psi: Math.atan2(next.y - start.y, next.x - start.x), v: 0,
      leg: 1, dir: 1, dwell: i * 25, // stagger departures (warm-up spreads them along their routes)
      emitAcc: 0,
    };
  });

  // ---- Wake particles (one buffer for the fleet).
  const MAX = 3600;
  const wake = { n: 0, x: new Float32Array(MAX), z: new Float32Array(MAX), fx: new Float32Array(MAX), fz: new Float32Array(MAX), v: new Float32Array(MAX), age: new Float32Array(MAX), life: new Float32Array(MAX), beam: new Float32Array(MAX) };
  const POINTS = MAX * 3;
  const pos = new Float32Array(POINTS * 3), alpha = new Float32Array(POINTS), size = new Float32Array(POINTS);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  const foam = new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uScale: { value: 1 } },
    vertexShader: `uniform float uScale; attribute float aAlpha; attribute float aSize; varying float vA;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dz = max(0.0, -mv.z - ${curve.D.toFixed(1)}); mv.y -= (dz * dz + mv.x * mv.x) * ${curve.K};
        gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / -mv.z; vA = aAlpha; }`,
    fragmentShader: `varying float vA; void main() { vec2 c = gl_PointCoord - 0.5; float d = dot(c, c);
        if (d > 0.25) discard; gl_FragColor = vec4(1.0, 1.0, 1.0, vA * (1.0 - d * 4.0)); }`,
  }));
  foam.frustumCulled = false;
  scene.add(foam);

  const cur = new THREE.Vector2();
  const nowSec = () => Date.now() / 1000;
  let simClock = 0;

  function stepVessel(s, dt, phase) {
    const target = s.route[s.leg];
    const toT = new THREE.Vector2().subVectors(target, s.pos);
    const dist = toT.length();
    const isTerminal = s.leg === 0 || s.leg === s.route.length - 1;
    if (s.dwell > 0) { s.dwell -= dt; s.v = 0; return; }
    if (dist < (isTerminal ? 1.2 : 6)) {
      if (isTerminal) { // arrive, dwell, reverse
        s.dwell = 40 + Math.random() * 30; s.dir = -s.dir; s.leg += s.dir; return;
      }
      s.leg += s.dir;
      return;
    }
    // Steering: bounded yaw rate toward the waypoint (turn radius grows with speed).
    let dPsi = Math.atan2(toT.y, toT.x) - s.psi;
    dPsi = Math.atan2(Math.sin(dPsi), Math.cos(dPsi));
    const yawRate = s.yawMax * Math.min(1, 0.35 + s.v / s.vmax);
    s.psi += THREE.MathUtils.clamp(dPsi, -yawRate * dt, yawRate * dt);
    // Throttle: brake into terminals (v = sqrt(2 a d)), ease off in sharp turns.
    let remaining = dist;
    for (let k = s.leg; k !== -1 && k !== s.route.length && !(k === 0 || k === s.route.length - 1); k += s.dir) remaining += s.route[k].distanceTo(s.route[k + s.dir]);
    const vTarget = Math.min(s.vmax * (1 - 0.5 * Math.min(1, Math.abs(dPsi) / 1.2)), Math.sqrt(2 * s.accel * remaining));
    s.v += THREE.MathUtils.clamp(vTarget - s.v, -s.accel * 1.6 * dt, s.accel * dt);
    // Ground velocity = water velocity + current.
    current(s.pos.x, s.pos.y, phase, cur);
    s.pos.x += (Math.cos(s.psi) * s.v + cur.x) * dt;
    s.pos.y += (Math.sin(s.psi) * s.v + cur.y) * dt;
    // Wake samples, spaced by distance travelled through the water.
    s.emitAcc += s.v * dt;
    while (s.emitAcc > 0.6 && s.v > 0.05) {
      s.emitAcc -= 0.6;
      const i = wake.n < MAX ? wake.n++ : 0; // ponytail: full buffer overwrites the oldest slot (index 0 after compaction)
      wake.x[i] = s.pos.x - Math.cos(s.psi) * s.L * 0.5; wake.z[i] = s.pos.y - Math.sin(s.psi) * s.L * 0.5;
      wake.fx[i] = Math.cos(s.psi); wake.fz[i] = Math.sin(s.psi); wake.v[i] = s.v; wake.age[i] = 0;
      wake.life[i] = 18 + 40 * (s.v / (22 * KN)); wake.beam[i] = s.L * 0.18;
    }
  }

  function stepWake(dt, phase) {
    let k = 0;
    for (let i = 0; i < wake.n; i++) {
      wake.age[i] += dt;
      if (wake.age[i] > wake.life[i]) continue;
      if (k !== i) for (const a of ['x', 'z', 'fx', 'fz', 'v', 'age', 'life', 'beam']) wake[a][k] = wake[a][i];
      current(wake.x[k], wake.z[k], phase, cur);
      wake.x[k] += cur.x * dt; wake.z[k] += cur.y * dt; // wake water drifts with the tide
      k++;
    }
    wake.n = k;
    let p = 0;
    for (let i = 0; i < wake.n; i++) {
      const a = wake.age[i], t = a / wake.life[i];
      const spread = a * wake.v[i] * KELVIN + wake.beam[i]; // Kelvin arms
      const nx = -wake.fz[i], nz = wake.fx[i];
      const fade = (1 - t) * (1 - t);
      for (const [off, al, sz] of [[0, 0.75 * Math.exp(-a / 6), wake.beam[i] * 2 + a * 0.12], [spread, 0.55 * fade, 1.1 + a * 0.05], [-spread, 0.55 * fade, 1.1 + a * 0.05]]) {
        pos[p * 3] = wake.x[i] + nx * off; pos[p * 3 + 1] = 0.7; pos[p * 3 + 2] = wake.z[i] + nz * off;
        alpha[p] = al; size[p] = sz; p++;
      }
    }
    geo.setDrawRange(0, p);
    geo.attributes.position.needsUpdate = geo.attributes.aAlpha.needsUpdate = geo.attributes.aSize.needsUpdate = true;
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
      foam.material.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan((camera.fov * Math.PI) / 360)); // world size → px
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
