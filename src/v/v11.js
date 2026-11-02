// v11 · Rupee to Wall Street: the page is a hand-placed pixel world drawn live on a low-res canvas, in brand navy and
// orange only. Scrolling flies a rupee coin from Mumbai through GIFT City (where it turns into a dollar) and across the
// ocean to Wall Street. Buying bursts coins at the exchange; selling flies you back the way you came.
import './base.css';
import './v11.css';
import { boot, footer, C, icon, leadForm, logo, usd, brandMark, faqList, $, $$, reducedMotion, REF_PRICES } from './kit.js';
import { usSessionInIST, istClock } from '../market.js';

const NAVY = '#072d5e', INK = '#04213f', N2 = '#1f4a82', N3 = '#5b7ea9', N4 = '#9db6d3', N5 = '#cfdcec';
const O = '#ff5400', O1 = '#c84200', O2 = '#ff8a4c', O3 = '#ffc7a6', O4 = '#ffe3d2', CREAM = '#fff4ec', W = '#ffffff';

// ---------- 3×5 bitmap font and coin glyphs
const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', ' ': '000000000000000' };
const GLYPH = { '₹': ['11111', '00010', '11111', '00010', '11100', '00110', '00011'], $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'] };
const textW = (s) => s.length * 4 - 1;
function pixText(c, s, x, y, col) {
  c.fillStyle = col;
  [...s].forEach((ch, i) => { const g = FONT[ch] || FONT[' ']; for (let b = 0; b < 15; b++) if (g[b] === '1') c.fillRect(x + i * 4 + b % 3, y + Math.floor(b / 3), 1, 1); });
}
const rect = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const dither = (c, col, x, y, w, h, step = 2) => { c.fillStyle = col; for (let j = 0; j < h; j++) for (let i = (j % 2) * (step >> 1); i < w; i += step) c.fillRect(x + i, y + j, 1, 1); };
const rng = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const layer = (w, h) => { const el = document.createElement('canvas'); el.width = w; el.height = h; const c = el.getContext('2d'); return { el, c }; };

// ---------- world geometry: where the camera stops, one stop per glass card
const STOPS = [0, 460, 1240, 1980, 2700, 3400];
const OCEAN = [1800, 3100];   // world x where the road gives way to water

// ---------- buildings
function tower(c, r, x, g, w, h, pal, top = -1) {
  const y = g - h;
  rect(c, pal.body, x, y, w, h);
  rect(c, pal.shade, x + w - Math.max(2, w >> 2), y, Math.max(2, w >> 2), h);
  if (pal.hi) rect(c, pal.hi, x, y, 1, h);
  if (pal.win && w >= 8) for (let wy = y + 3; wy < g - 3; wy += 4) for (let wx = x + 2; wx < x + w - 3; wx += 3) {
    const lit = r() < pal.lit;
    rect(c, lit ? (r() < 0.6 ? O2 : CREAM) : pal.win, wx, wy, 1, 2);
  }
  const t = top < 0 ? Math.floor(r() * 5) : top;
  if (t === 1) rect(c, pal.shade, x + (w >> 1), y - 12, 1, 12);
  if (t === 2) { rect(c, pal.body, x + 2, y - 8, w - 4, 8); rect(c, pal.body, x + 4, y - 14, Math.max(2, w - 8), 6); }
  if (t === 3) { rect(c, pal.shade, x + 2, y - 2, 1, 2); rect(c, pal.shade, x + 6, y - 2, 1, 2); rect(c, pal.body, x + 1, y - 7, 7, 5); }
  if (t === 4) for (let i = 0; i < 12; i++) rect(c, pal.body, x + (w >> 1) - Math.floor((12 - i) * w / 28), y - i, Math.max(1, Math.floor((12 - i) * w / 14)), 1);
}
const NEAR = { body: NAVY, shade: INK, hi: N2, win: N2, lit: 0.22 };
const MID = { body: N3, shade: N2, win: N4, lit: 0 };
const FAR = { body: N4, shade: N3, lit: 0 };

function gateway(c, cx, g) {   // Gateway of India
  const x = cx - 36;
  rect(c, N2, x - 4, g - 4, 80, 4);
  rect(c, CREAM, x, g - 40, 72, 36);
  rect(c, O3, x + 60, g - 40, 12, 36);
  rect(c, NAVY, x + 26, g - 30, 20, 26); rect(c, NAVY, x + 28, g - 32, 16, 2); rect(c, NAVY, x + 31, g - 34, 10, 2);
  [6, 58].forEach((a) => { rect(c, N2, x + a, g - 28, 8, 24); rect(c, N2, x + a + 1, g - 30, 6, 2); rect(c, N2, x + a + 3, g - 32, 2, 2); });
  [2, 22, 44, 64].forEach((a) => { rect(c, CREAM, a + x, g - 52, 7, 12); rect(c, O3, a + x + 5, g - 52, 2, 12); rect(c, CREAM, a + x + 1, g - 55, 5, 3); rect(c, O2, a + x + 3, g - 58, 1, 3); });
  rect(c, CREAM, x + 8, g - 44, 56, 4); rect(c, N3, x + 8, g - 43, 56, 1);
}

function bank(c, cx, g) {
  const x = cx - 30;
  rect(c, CREAM, x, g - 58, 60, 58); rect(c, O3, x + 50, g - 58, 10, 58);
  rect(c, NAVY, x - 3, g - 62, 66, 5);
  for (let i = 0; i < 5; i++) rect(c, N3, x + 5 + i * 11, g - 34, 3, 34);
  rect(c, NAVY, x + 24, g - 22, 12, 22);
  pixText(c, 'YOUR BANK', x + 12, g - 48, NAVY);
}

function gift(c, cx, g) {   // the two GIFT City towers, with angled crowns
  [[-30, 150], [8, 128]].forEach(([dx, h]) => {
    const x = cx + dx, y = g - h, w = 24;
    rect(c, NAVY, x, y, w, h); rect(c, INK, x + 18, y, 6, h);
    for (let wy = y + 4; wy < g - 4; wy += 4) { rect(c, N2, x + 2, wy, 15, 1); if ((wy + dx) % 12 === 0) rect(c, O2, x + 2, wy, 15, 1); }
    for (let i = 0; i < 12; i++) rect(c, O, x + i * 2, y - 12 + i, 24 - i * 2, 1);
  });
  rect(c, N2, cx - 6, g - 60, 14, 3);
  rect(c, INK, cx - 26, g - 12, 50, 12);
  pixText(c, 'GIFT CITY', cx - 18, g - 9, CREAM);
}

function liberty(c, cx, g) {
  rect(c, N3, cx - 40, g - 4, 80, 10); rect(c, N2, cx - 22, g - 26, 44, 22); rect(c, N4, cx - 22, g - 26, 8, 22);
  rect(c, N3, cx - 14, g - 44, 28, 18); rect(c, N4, cx - 14, g - 44, 6, 18);
  for (let i = 0; i < 40; i++) { const w = 6 + i * 0.28; rect(c, NAVY, cx - w / 2, g - 44 - 40 + i, w, 1); }
  rect(c, N2, cx - 2, g - 80, 2, 36);
  rect(c, NAVY, cx - 4, g - 93, 8, 9); rect(c, N2, cx - 3, g - 91, 5, 5);
  [-5, -2, 1, 4].forEach((d, i) => rect(c, NAVY, cx + d, g - 97 + (i === 1 || i === 2 ? -1 : 0), 1, 4));
  rect(c, NAVY, cx + 5, g - 104, 3, 24); rect(c, O1, cx + 3, g - 107, 7, 3);
  rect(c, O, cx + 4, g - 111, 5, 4); rect(c, O2, cx + 5, g - 114, 3, 3);
  rect(c, NAVY, cx - 9, g - 74, 4, 10);
}

function exchange(c, cx, g) {   // the columns on Wall Street
  const x = cx - 48;
  rect(c, N4, x - 6, g - 6, 108, 6); rect(c, N5, x - 3, g - 10, 102, 4);
  rect(c, INK, x, g - 56, 96, 46);
  for (let i = 0; i < 6; i++) { rect(c, CREAM, x + 4 + i * 16, g - 56, 7, 46); rect(c, N4, x + 9 + i * 16, g - 56, 2, 46); rect(c, CREAM, x + 2 + i * 16, g - 58, 11, 2); }
  rect(c, CREAM, x - 3, g - 66, 102, 8); rect(c, N4, x - 3, g - 60, 102, 2);
  for (let i = 0; i < 14; i++) rect(c, CREAM, x - 3 + i * 3.6, g - 67 - i, 102 - i * 7.2, 1);
  pixText(c, 'WALL ST', cx - 13, g - 65, NAVY);
  // flag on the roof, in brand colours
  rect(c, INK, cx - 1, g - 106, 1, 26);
  for (let i = 0; i < 7; i++) rect(c, i % 2 ? CREAM : O, cx, g - 106 + i * 2, 26, 2);
  rect(c, NAVY, cx, g - 106, 10, 8); dither(c, CREAM, cx + 1, g - 105, 8, 6, 2);
}

function palm(c, x, g, h) {
  for (let i = 0; i < h; i++) rect(c, INK, x + Math.round(Math.sin(i / 14) * 5), g - i, 4, 1);
  const tx = x + Math.round(Math.sin(h / 14) * 5) + 1, ty = g - h;
  [[-1, 0.3], [1, 0.3], [-1, -0.2], [1, -0.2], [-0.5, 0.7], [0.5, 0.7]].forEach(([dx, dy]) => { for (let i = 0; i < 24; i++) rect(c, INK, tx + dx * i, ty + dy * i + i * i * 0.04, 3, 3 - Math.floor(i / 12)); });
}
function tree(c, r, x, g, s) {
  rect(c, INK, x - 2, g - s, 4, s);
  for (let k = 0; k < 7; k++) {
    const a = r() * 6.28, d = r() * s * 0.6, cx = x + Math.cos(a) * d, cy = g - s - Math.abs(Math.sin(a)) * d * 0.7, R = s * (0.35 + r() * 0.25);
    for (let j = -R; j < R; j++) { const hw = Math.sqrt(R * R - j * j); rect(c, INK, cx - hw, cy + j, hw * 2, 1); }
    dither(c, N2, Math.round(cx - R * 0.6), Math.round(cy - R * 0.7), Math.round(R * 1.2), Math.round(R * 0.5), 3);
  }
}
function cloud(c, r, x, y, s) {
  for (let k = 0; k < 5; k++) { const R = s * (0.5 + r() * 0.6), cx = x + (k - 2) * s * 0.8, cy = y + r() * s * 0.3; for (let j = -R; j <= 0; j++) { const hw = Math.sqrt(R * R - j * j); rect(c, W, cx - hw, cy + j, hw * 2, 1); } }
  dither(c, W, Math.round(x - s * 2.4), Math.round(y), Math.round(s * 4.8), 2, 2);
}

// ---------- the scene
function buildWorld(w, h, g) {
  const L = STOPS.at(-1) + w + 120, a = (i) => STOPS[i] + w * 0.66;
  const near = layer(L, h), mid = layer(Math.ceil(L * 0.6 + w), h), far = layer(Math.ceil(L * 0.35 + w), h), sky = layer(Math.ceil(L * 0.15 + w), h), fore = layer(Math.ceil(L * 1.3 + w), h);
  let r = rng(11);
  for (let x = 0; x < sky.el.width; x += 70 + r() * 90) cloud(sky.c, r, x, 24 + r() * h * 0.28, 6 + r() * 9);
  // far and mid skylines stop for the ocean and come back for New York
  const skyPart = (l, f, pal, minH, maxH, sa, sb) => {
    let x = 0;
    const put = (to) => { while (x < to) { const bw = 10 + Math.floor(r() * 20); tower(l.c, r, Math.round(x), g, bw, minH + r() * r() * (maxH - minH), pal); x += bw + r() * 4; } };
    put(sa * f + w * 0.2); x = sb * f + w; put(l.el.width);
  };
  skyPart(far, 0.35, FAR, 40, 150, OCEAN[0] - 100, STOPS[3]);
  skyPart(mid, 0.6, MID, 24, 118, OCEAN[0] - 100, STOPS[3]);
  // near: a low street, then the landmark for each stop
  const street = (from, to, skip) => {
    let x = from;
    while (x < to) { const bw = 10 + Math.floor(r() * 16), hh = 18 + r() * r() * 66; if (!skip.some((s) => x + bw > s - 58 && x < s + 58)) tower(near.c, r, x, g, bw, hh, NEAR); x += bw + 2 + r() * 10; }
  };
  const skips = [a(0), a(1), a(2), a(4), a(5)];
  street(0, OCEAN[0] - 60, skips); street(OCEAN[1] + 24, L, skips);
  gateway(near.c, a(0), g);
  bank(near.c, a(1), g);
  gift(near.c, a(2), g);
  liberty(near.c, a(4), g);
  // Manhattan rises behind the exchange
  [[-120, 22, 168, 2], [-92, 18, 124, 4], [68, 18, 138, 2], [92, 24, 186, 1], [122, 16, 108, 3]].forEach(([dx, bw, hh, t]) => tower(near.c, r, a(5) + dx, g, bw, Math.min(hh, g - 20), NEAR, t));
  exchange(near.c, a(5), g);
  // foreground planting frames the shot
  r = rng(5);
  if (w >= 300) for (let x = 40; x < fore.el.width; x += 130 + r() * 150) {
    const wx = x / 1.3;
    if (wx > OCEAN[0] - 60 && wx < OCEAN[1] + 40) continue;
    if (STOPS.some((s) => { const sx = x - s * 1.3; return sx > w * 0.38 && sx < w * 0.98; })) continue;
    if (wx < OCEAN[0]) palm(fore.c, x, h, h - g + 44 + r() * 30); else tree(fore.c, r, x, h + 2, 44 + r() * 18);
  }
  return { near, mid, far, sky, fore, L };
}

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const mix3 = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const SKIES = [[O4, O3, '#ffa877'], [CREAM, O4, O3], [N5, '#e8f0fc', CREAM], ['#e8f0fc', '#f3f8ff', O4], [N5, '#f3f8ff', W], [N5, '#f3f8ff', CREAM]].map((s) => s.map(hex));

function startWorld(canvas, stage, api) {
  const c = canvas.getContext('2d');
  let w = 0, h = 0, g = 0, world = null, cam = 0, skyTile = null, skyKey = '';
  const bursts = [];

  function resize() {
    const vw = stage.clientWidth, vh = stage.clientHeight, phone = vw < 720;
    const s = phone ? 2 : Math.max(2, Math.round(vh / 290));
    const nw = Math.ceil(vw / s), nh = Math.ceil(vh / s);
    if (nw === w && Math.abs(nh - h) < 4 && world) return;
    w = nw; h = nh; canvas.width = w; canvas.height = h;
    g = Math.round(h * (phone ? 0.42 : 0.8));
    world = buildWorld(w, h, g); skyKey = '';
  }
  // Sky is a 3-stop gradient quantised through an 8×8 Bayer matrix, so it reads as dithered print; only the colours change along the route.
  function paintSky(u) {
    const i = Math.min(SKIES.length - 2, Math.floor(u)), f = u - i, key = `${i}${f.toFixed(2)}${h}`;
    if (key !== skyKey) {
      skyKey = key;
      const stops = SKIES[i].map((col, k) => mix3(col, SKIES[i + 1][k], f));
      const { el, c: tc } = layer(8, h), im = tc.createImageData(8, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < 8; x++) {
        const t = (y / Math.max(g, 1)) * 2, q = Math.min(1.999, t), k = Math.floor(q), mixV = q - k;
        const n = 5, lv = Math.floor(mixV * n + BAYER[(y % 8) * 8 + x] / 64) / n;
        const col = mix3(stops[k], stops[k + 1], lv), o = (y * 8 + x) * 4;
        im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255;
      }
      tc.putImageData(im, 0, 0); skyTile = c.createPattern(el, 'repeat-x');
    }
    c.fillStyle = skyTile; c.fillRect(0, 0, w, h);
  }
  const draw = (l, f) => c.drawImage(l.el, -Math.round(cam * f), 0);

  function coin(x, y, glyph) {
    rect(c, O1, x - 4, y - 8, 9, 17); rect(c, O1, x - 8, y - 4, 17, 9); rect(c, O1, x - 6, y - 6, 13, 13);
    rect(c, O, x - 4, y - 7, 8, 15); rect(c, O, x - 7, y - 4, 15, 8); rect(c, O, x - 5, y - 6, 11, 13);
    rect(c, O2, x - 4, y - 6, 3, 1); rect(c, O2, x - 6, y - 4, 1, 3);
    GLYPH[glyph].forEach((row, j) => [...row].forEach((b, k) => { if (b === '1') rect(c, W, x - 2 + k, y - 3 + j, 1, 1); }));
  }

  function frame(t) {
    const target = api.camTarget();
    cam += (target - cam) * (reducedMotion ? 1 : 0.12);
    const u = Math.max(0, api.progress()) * (SKIES.length - 1);
    paintSky(u);
    // sun climbs from the Mumbai evening to the New York morning
    const R = Math.min(40, w * 0.12), sunX = w * 0.8, sunY = g - 26 - (g - 26 - R - 34) * (u / 5) ** 0.8;
    for (let j = -R; j <= R; j++) { const hw = Math.sqrt(R * R - j * j); rect(c, u < 3 ? O : O2, sunX - hw, sunY + j, hw * 2, 1); }
    draw(world.sky, 0.15); draw(world.far, 0.35); draw(world.mid, 0.6);
    // ground, then water between the two coasts
    rect(c, N3, 0, g, w, 3); rect(c, N2, 0, g + 3, w, h - g); dither(c, NAVY, 0, g + 18, w, h - g - 18, 4);
    const dashT = Math.round(cam) % 24;
    for (let x = -dashT; x < w; x += 24) rect(c, CREAM, x, g + 10, 10, 1);
    const wa = Math.round(OCEAN[0] - cam), wb = Math.round(OCEAN[1] - cam);
    if (wb > 0 && wa < w) {
      const x0 = Math.max(0, wa), wd = Math.min(w, wb) - x0;
      rect(c, N4, x0, g - 2, wd, h - g + 2); dither(c, N3, x0, g + 6, wd, h - g - 6, 3);
      for (let j = 0; j < 7; j++) { const yy = g + j * 9, sh = Math.round(Math.sin(t / 900 + j) * 8); for (let x = x0 - (x0 % 34) + sh + j * 11; x < x0 + wd; x += 34) if (x >= x0) rect(c, CREAM, x, yy, 8 + j, 1); }
    }
    draw(world.near, 1);
    const a = (i) => STOPS[i] + w * 0.66;
    // the ship crosses mid-ocean
    const sx = Math.round(a(3) - cam + Math.sin(t / 7000) * 26), bob = Math.round(Math.sin(t / 700) * 1.2);
    if (sx > -80 && sx < w + 80) {
      rect(c, NAVY, sx - 42, g - 10 + bob, 84, 12); rect(c, O, sx - 42, g - 2 + bob, 84, 2);
      [O, CREAM, N3, O2, N2, CREAM, O].forEach((col, i) => { rect(c, col, sx - 34 + i * 8, g - 18 + bob, 7, 8); if (i % 2) rect(c, col === O2 ? CREAM : O2, sx - 34 + i * 8, g - 25 + bob, 7, 7); });
      rect(c, CREAM, sx + 24, g - 26 + bob, 12, 16); rect(c, NAVY, sx + 26, g - 23 + bob, 8, 2);
    }
    // birds
    for (let i = 0; i < 6; i++) { const bx = ((t / 30 + i * 37 - cam * 0.25) % (w + 40) + w + 40) % (w + 40) - 20, by = 34 + i * 9 + Math.sin(t / 500 + i) * 3, flap = Math.sin(t / 130 + i) > 0 ? 1 : 0; rect(c, NAVY, bx, by, 1, 1); rect(c, NAVY, bx - 2, by - flap, 2, 1); rect(c, NAVY, bx + 1, by - flap, 2, 1); }
    // street traffic on both coasts
    for (let i = 0; i < 9; i++) { const lane = i % 2, span = STOPS.at(-1) + w, cx = ((t / (lane ? 40 : -55) + i * 410) % span + span) % span; if (cx > OCEAN[0] - 10 && cx < OCEAN[1] + 10) continue; const sxx = Math.round(cx - cam); if (sxx > -20 && sxx < w) { rect(c, i % 3 ? CREAM : O, sxx, g + 4 + lane * 8, 12, 3); rect(c, INK, sxx + 2, g + 2 + lane * 8, 7, 2); } }
    // LED ticker on the exchange roof: names only, never a price
    const lx = Math.round(a(5) - cam + 34), ly = g - 92;
    if (lx > -70 && lx < w) { rect(c, INK, lx, ly, 62, 9); c.save(); c.beginPath(); c.rect(lx + 2, ly, 58, 9); c.clip(); const tape = 'AAPL NVDA MSFT TSLA AMZN META NFLX GOOGL '; const tw = textW(tape) + 1; for (let k = 0; k < 2; k++) pixText(c, tape, lx + 2 - (Math.floor(t / 60) % tw) + k * tw, ly + 2, O2); c.restore(); }
    // the coin: hops along the road, flies over the water, and changes currency at GIFT City
    const cx = Math.round(w * (w < 300 ? 0.2 : 0.42)), wx = cam + cx;
    const over = Math.min(1, Math.max(0, Math.min(wx - OCEAN[0] + 80, OCEAN[1] - wx + 80) / 80));
    const hop = Math.abs(Math.sin(cam / 26)) * 14;
    const cy = Math.round(g - 10 - hop - over * (g * 0.3 + Math.sin(t / 600) * 4));
    rect(c, 'rgba(4,33,63,.35)', cx - 6 + Math.round(over * 4), g + 1, 12, 1);
    if (over > 0.6) { const wing = Math.sin(t / 110) > 0 ? -3 : 1; rect(c, W, cx - 16, cy + wing, 8, 2); rect(c, W, cx + 9, cy + wing, 8, 2); rect(c, N4, cx - 12, cy + wing + 2, 4, 1); rect(c, N4, cx + 9, cy + wing + 2, 4, 1); }
    coin(cx, cy, wx > a(2) ? '$' : '₹');
    // buy burst
    for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.vy += 0.09; b.x += b.vx; b.y += b.vy; if (b.y > h + 8) { bursts.splice(i, 1); continue; } rect(c, O1, b.x - 2, b.y - 2, 5, 5); rect(c, b.c, b.x - 1, b.y - 2, 3, 4); }
    draw(world.fore, 1.3);
  }

  let raf = 0, visible = true;
  const loop = (t) => { frame(t); raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0; };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(stage);
  document.addEventListener('visibilitychange', kick);
  resize(); addEventListener('resize', () => { resize(); });
  cam = api.camTarget(); kick();
  return {
    burst() { const x0 = Math.round(STOPS.at(-1) + w * 0.66 - cam); for (let i = 0; i < 70; i++) bursts.push({ x: x0, y: g - 66, vx: (Math.random() - 0.5) * 3.4, vy: -1.5 - Math.random() * 3.2, c: Math.random() < 0.7 ? O : O2 }); },
  };
}

// ---------- page
const session = usSessionInIST();
const openAt = istClock(session.open).replace(':00', '').replace(' ', ' ').toUpperCase();
const STOCKS = [['Apple', 'AAPL', 'apple'], ['NVIDIA', 'NVDA', 'nvidia'], ['Microsoft', 'MSFT', 'microsoft'], ['Tesla', 'TSLA', 'tesla'], ['Amazon', 'AMZN', 'amazon']];
const CH = C.charges.items;

const ticket = `<div class="tk">
  <div class="tk-side" role="group" aria-label="Order side">
    <button type="button" class="is-on" data-side="buy" aria-pressed="true">Buy</button>
    <button type="button" data-side="sell" aria-pressed="false">Sell</button>
  </div>
  <div class="tk-stocks" role="group" aria-label="Stock">${STOCKS.map(([n, t, l], i) => `<button type="button" data-t="${t}" data-n="${n}" aria-pressed="${!i}" class="${i ? '' : 'is-on'}" aria-label="${n}">${logo(l, t)}</button>`).join('')}</div>
  <label class="tk-amt"><span class="sr-only">Amount in US dollars</span>$<input id="tk-amt" type="number" inputmode="numeric" min="1" max="250000" value="10"></label>
  <p class="tk-out num" id="tk-out"></p>
  <div class="tk-chips">${[1, 10, 50, 100].map((a) => `<button type="button" data-a="${a}">$${a}</button>`).join('')}</div>
  <button type="button" class="btn btn-primary tk-go" id="tk-go"></button>
  <p class="tk-say" id="tk-say" role="status">Preview only, using reference prices. No order is placed here.</p>
</div>`;

const cards = [
  `<h1 class="gc-h1">Wall Street opens at ${openAt}.</h1>
   <p>India time, on trading days. Buy and sell US stocks and ETFs from where you are, starting from $1.*</p>
   <p class="gc-live"><i data-market-dot></i><span data-bind="status"></span></p>
   <div class="gc-cta"><a class="btn btn-primary" href="#lead">${C.hero.cta}</a><a class="gc-down" href="#c1">Scroll to fly the rupee ${icon.go}</a></div>
   <p class="gc-fine">*For eligible securities. Investments in securities markets are subject to market risks.</p>`,
  `<p class="gc-k">Mumbai</p><h2>First, your account.</h2>
   <p>${C.steps.items[0][1]} ${C.steps.items[1][1]} ₹0 to open it.</p>
   <p class="gc-fine">${C.who.items[1][1]}</p>`,
  `<p class="gc-k">GIFT City</p><h2>Here, rupees become dollars.</h2>
   <p>Start an LRS remittance from your bank. It converts INR to USD and routes the funds through the GIFT City account.</p>
   <p class="gc-fine">LRS limit: $250,000 per financial year, across all permitted purposes. ${C.routes[0].note}.</p>`,
  `<p class="gc-k">Somewhere over the ocean</p><h2><b class="num">5,000+</b> US stocks and ETFs ahead.</h2>
   <p>Add exposure to businesses and sectors outside India. ${'Diversification cannot eliminate market risk.'}</p>
   <p class="gc-fine">${C.why.items[2][1]}</p>`,
  `<p class="gc-k">Almost there</p><h2>What it costs.</h2>
   <dl class="gc-costs"><div><dt>Account opening</dt><dd class="num">₹0</dd></div><div><dt>Brokerage</dt><dd class="num">0.25%</dd></div><div><dt>Resident withdrawal fee</dt><dd class="num">USD 0</dd></div></dl>
   <p class="gc-fine">Brokerage is on trade value. Check applicable levies and charges. Bank and FX charges may apply.</p>`,
  `<p class="gc-k">Wall Street</p><h2 class="sr-only">Place an order</h2>${ticket}`,
];

const html = `<a class="skip" href="#main">Skip to content</a>
<header class="pill-bar">
  <nav class="pill" aria-label="Primary"><a href="#top" class="pill-home" aria-label="MAPS — Mirae Asset Portfolio Service, back to top">${brandMark()}</a><a class="pill-l" href="#charges">Charges</a><a class="pill-l" href="#brands">Stocks</a><a class="pill-l" href="#faq">FAQs</a><a class="btn btn-primary btn-sm" href="#lead">${C.hero.cta}</a></nav>
  <p class="clock"><span data-bind="nyc"></span> NYC</p>
</header>
<main id="main" tabindex="-1">
  <section class="fly" id="top" aria-label="From India to Wall Street">
    <div class="stage" id="stage">
      <canvas id="world" aria-hidden="true"></canvas>
      ${cards.map((c, i) => `<article class="gc${i === 5 ? ' gc-t' : ''}" id="c${i}" data-i="${i}">${c}</article>`).join('')}
    </div>
  </section>

  <section class="band" id="brands"><div class="vw">
    <h2>${C.brands.title}</h2>
    <ul class="wall">${C.brands.list.map(([n, t, l]) => `<li>${logo(l, t)}<b>${n}</b><small>${t}</small></li>`).join('')}</ul>
  </div></section>

  <section class="band band-t" id="charges"><div class="vw">
    <h2>${C.charges.title}</h2>
    <ul class="costs">${CH.map((c) => `<li><p>${c.label}</p><b class="num">${c.fig}</b><small>${c.note}</small></li>`).join('')}</ul>
    <p class="fine">${C.charges.foot}</p>
  </div></section>

  <section class="band" id="faq"><div class="vw vw-n"><h2>${C.faq.title}</h2>${faqList()}</div></section>

  <section class="band band-end" id="start"><div class="vw vw-n">
    <h2 id="close-t">Ready when Wall Street is.</h2>
    <p class="sub">${C.closing.benefits.join(' · ')}</p>
    ${leadForm('lead', C.closing.cta, 'close-t')}
    <p class="fine">${C.closing.fine}</p>
  </div></section>
</main>
${footer()}`;

boot('v11', html);

// ---------- scroll drives the camera and picks the card
const fly = $('.fly'), stage = $('#stage'), gcs = $$('.gc');
const progress = () => { const r = fly.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
function camTarget() {
  const u = progress() * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(u));
  const f = Math.min(1, Math.max(0, (u - i - 0.28) / 0.44)), e = f * f * (3 - 2 * f);
  return STOPS[i] + (STOPS[i + 1] - STOPS[i]) * e;
}
function pickCard() {
  const u = progress() * (STOPS.length - 1), near = Math.round(u), on = Math.abs(u - near) < 0.26 ? near : -1;
  gcs.forEach((el, i) => el.classList.toggle('is-on', i === on));
}
addEventListener('scroll', pickCard, { passive: true }); pickCard();
const scene = startWorld($('#world'), stage, { camTarget, progress });

// In-page links into the flight scroll to that card's stop.
$('.gc-down').addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: fly.offsetTop + (fly.offsetHeight - innerHeight) / 5 }); });

// ---------- the ticket
const T = { side: 'buy', t: 'AAPL', n: 'Apple', a: 10 };
const out = $('#tk-out'), go = $('#tk-go'), say = $('#tk-say'), amt = $('#tk-amt');
function renderTicket() {
  const a = Math.max(1, Number(amt.value) || 1), px = REF_PRICES[T.t]; T.a = a;
  const word = T.side === 'buy' ? 'buys' : 'sells';
  out.textContent = `${word} ${(a / px).toFixed(4)} ${T.t} · brokerage ${usd.format(a * 0.0025)}`;
  go.textContent = T.side === 'buy' ? `Buy $${a} of ${T.n}` : `Sell $${a} and fly home`;
}
document.addEventListener('click', (e) => {
  const side = e.target.closest('[data-side]'), st = e.target.closest('[data-t]'), chip = e.target.closest('[data-a]');
  if (side) { T.side = side.dataset.side; $$('[data-side]').forEach((b) => { const on = b === side; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); }); }
  if (st) { T.t = st.dataset.t; T.n = st.dataset.n; $$('[data-t]').forEach((b) => { const on = b === st; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); }); }
  if (chip) amt.value = chip.dataset.a;
  if (side || st || chip) renderTicket();
});
amt.addEventListener('input', renderTicket);
renderTicket();

let flight = 0;
const cancelFlight = () => { cancelAnimationFrame(flight); flight = 0; };
['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, cancelFlight, { passive: true }));
go.addEventListener('click', () => {
  if (T.side === 'buy') {
    scene.burst();
    say.innerHTML = `That was a preview. <a href="#lead">Open an account</a> to place real orders.`;
    return;
  }
  say.textContent = 'Withdrawals start at USD 20. After review, USD converts to INR and reaches your linked bank.';
  if (reducedMotion) return;
  // Sell flies the route backwards; any wheel, touch or key hands control straight back.
  const from = scrollY, to = fly.offsetTop, t0 = performance.now(), dur = 9000;
  const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = k * k * (3 - 2 * k); scrollTo({ top: from + (to - from) * e, behavior: 'instant' }); if (k < 1) flight = requestAnimationFrame(step); };
  setTimeout(() => { flight = requestAnimationFrame(step); }, 1400);
});
