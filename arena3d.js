'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   arena3d.js — 3B dövüş sahneleri
   Her bölüm arka planı (sokak, depo, tünel, fabrika, karargâh, salon, stat…) gerçek bir 3B mekân olarak kurulur:
   zemin, duvarlar / bina cepheleri, tavan, ışıklar, sis, hava (kar / yağmur), dekor; oyun alanı = koridor
   (x boyunca ilerlenir, z derinlik). Platformlar arka duvar boyunca yükseltilmiş blok, geçitler arka duvarda.
   Hepsi kodla çizilir (indirme yok).
   ========================================================= */
const ARENA = {
  sokak:     { d:330, kind:'street', night:1, snow:1 },
  arkaSokak: { d:250, kind:'alley', night:1, rain:1 },
  tunel:     { d:270, kind:'tunnel' },
  depo:      { d:320, kind:'warehouse' },
  fabrikaDis:{ d:340, kind:'yard', night:1 },
  fabrika:   { d:300, kind:'factory' },
  eskiOkul:  { d:320, kind:'gym' },
  karargah:  { d:260, kind:'office' },
  guvenlik:  { d:280, kind:'security' },
  salon:     { d:330, kind:'salon' },
  stadArka:  { d:260, kind:'under' },
  gizli:     { d:290, kind:'crypt' },
  stad:      { d:420, kind:'pitch', night:1 },
  dojo:      { d:300, kind:'dojo' },
};
function arenaKind(def){ return (ARENA[def.bg] || ARENA.depo).kind; }
function arenaDims(def){ const A = ARENA[def.bg] || ARENA.depo; return { zMin:-A.d, zMax:A.d }; }
const ATEX = new Map();
function aTex(key, w, h, draw, rx = 1, ry = 1){
  const { T, canvasTex } = R3.world(); let t = ATEX.get(key);
  if (!t){ t = canvasTex(w, h, draw); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; ATEX.set(key, t); }
  const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); c.wrapS = c.wrapT = T.RepeatWrapping; return c;
}
/* ---------- yordamsal dokular ---------- */
const noiseFill = (c, w, h, n, a, cols) => { for (let i = 0; i < n; i++){ c.globalAlpha = Math.random() * a; c.fillStyle = cols[i % cols.length]; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3); } c.globalAlpha = 1; };
const TX = {
  asphaltSnow:(c, w, h) => { c.fillStyle = '#5b6068'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 9000, .35, ['#3d4148', '#7a8088', '#2e3238']);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(240,245,255,.85)'); g.addColorStop(.18, 'rgba(240,245,255,.35)'); g.addColorStop(.4, 'rgba(240,245,255,.06)'); g.addColorStop(.6, 'rgba(240,245,255,.06)'); g.addColorStop(.82, 'rgba(240,245,255,.35)'); g.addColorStop(1, 'rgba(240,245,255,.85)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(230,236,245,.5)'; for (let i = 0; i < 400; i++){ c.beginPath(); c.arc(Math.random() * w, Math.random() * h, Math.random() * 6, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(40,44,50,.35)'; c.lineWidth = 10; for (const y of [h * .38, h * .44, h * .56, h * .62]){ c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x * .02) * 3); c.stroke(); } },
  asphaltWet:(c, w, h) => { c.fillStyle = '#26292e'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 9000, .4, ['#16181b', '#3a3e45', '#4a505a']);
    c.fillStyle = 'rgba(120,140,170,.18)'; for (let i = 0; i < 14; i++){ c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 8 + Math.random() * 20, 0, 0, 7); c.fill(); } },
  sidewalk:(c, w, h) => { c.fillStyle = '#8d9096'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(60,62,66,.6)'; c.lineWidth = 3; for (let x = 0; x <= w; x += 64){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 64){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } noiseFill(c, w, h, 4000, .3, ['#6d7076', '#a4a7ad']); c.fillStyle = 'rgba(240,245,255,.4)'; c.fillRect(0, 0, w, h); },
  brick:(col, mortar = '#5a4d44') => (c, w, h) => { c.fillStyle = mortar; c.fillRect(0, 0, w, h); const bw = 64, bh = 24; for (let y = 0, r = 0; y < h; y += bh, r++) for (let x = -(r % 2) * bw / 2; x < w; x += bw){ const k = .82 + Math.random() * .3; c.fillStyle = shade(col, k); c.fillRect(x + 2, y + 2, bw - 4, bh - 4); } noiseFill(c, w, h, 5000, .25, ['#000000', '#ffffff']); },
  concrete:(col) => (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 12000, .18, ['#000000', '#ffffff', '#555555']); c.globalAlpha = .12; for (let i = 0; i < 30; i++){ c.fillStyle = Math.random() < .5 ? '#000000' : '#ffffff'; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 80, 20 + Math.random() * 50, 0, 0, 7); c.fill(); } c.globalAlpha = 1; },
  floorLines:(c, w, h) => { TX.concrete('#8b8f94')(c, w, h); c.fillStyle = '#f2c230'; c.fillRect(0, h * .12, w, 10); c.fillRect(0, h * .86, w, 10); c.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < w; x += 128) c.fillRect(x, 0, 2, h); },
  corrugated:(col) => (c, w, h) => { const g = c.createLinearGradient(0, 0, 32, 0); g.addColorStop(0, shade(col, .78)); g.addColorStop(.5, shade(col, 1.12)); g.addColorStop(1, shade(col, .78)); c.fillStyle = g; for (let x = 0; x < w; x += 32){ c.save(); c.translate(x, 0); c.fillRect(0, 0, 32, h); c.restore(); } noiseFill(c, w, h, 3000, .2, ['#000000', '#c07a40']); },
  wood:(col) => (c, w, h) => { for (let y = 0, i = 0; y < h; y += 32, i++){ c.fillStyle = shade(col, .85 + ((i * 37) % 9) / 30); c.fillRect(0, y, w, 32); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, y, w, 2); for (let x = (i * 97) % 256; x < w; x += 256) c.fillRect(x, y, 2, 32); }
    c.globalAlpha = .12; for (let i = 0; i < 300; i++){ c.strokeStyle = Math.random() < .5 ? '#000000' : '#ffffff'; c.beginPath(); const y = Math.random() * h; c.moveTo(0, y); c.bezierCurveTo(w * .3, y + 3, w * .6, y - 3, w, y + 1); c.stroke(); } c.globalAlpha = 1; },
  tatami:(c, w, h) => { c.fillStyle = '#c9b77a'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,100,50,.25)'; for (let y = 0; y < h; y += 3){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = '#2f4a2a'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10); c.fillRect(0, 0, 10, h); c.fillRect(w / 2 - 5, 0, 10, h); },
  shoji:(c, w, h) => { c.fillStyle = '#f3ead2'; c.fillRect(0, 0, w, h); c.fillStyle = '#5a3a20'; for (let x = 0; x <= w; x += w / 4) c.fillRect(x - 4, 0, 8, h); for (let y = 0; y <= h; y += h / 6) c.fillRect(0, y - 4, w, 8); noiseFill(c, w, h, 1500, .08, ['#8a7a5a']); },
  marble:(c, w, h) => { c.fillStyle = '#ece8e1'; c.fillRect(0, 0, w, h); c.globalAlpha = .35; for (let i = 0; i < 26; i++){ c.strokeStyle = Math.random() < .5 ? '#a49a8d' : '#c9bfae'; c.lineWidth = Math.random() * 2.5; c.beginPath(); let x = Math.random() * w, y = Math.random() * h; c.moveTo(x, y); for (let k = 0; k < 8; k++){ x += (Math.random() - .3) * 80; y += (Math.random() - .5) * 60; c.lineTo(x, y); } c.stroke(); } c.globalAlpha = 1;
    c.strokeStyle = 'rgba(120,110,100,.35)'; c.lineWidth = 2; for (let x = 0; x <= w; x += 128){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 128){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } },
  tiles:(a, b) => (c, w, h) => { for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64){ c.fillStyle = ((x + y) / 64) % 2 ? a : b; c.fillRect(x, y, 64, 64); } c.strokeStyle = 'rgba(0,0,0,.22)'; for (let x = 0; x <= w; x += 64){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 64){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } noiseFill(c, w, h, 2000, .1, ['#ffffff']); },
  stone:(c, w, h) => { c.fillStyle = '#3a3530'; c.fillRect(0, 0, w, h); for (let y = 0, r = 0; y < h; y += 48, r++) for (let x = -(r % 2) * 40; x < w; x += 80){ c.fillStyle = shade('#6f675c', .75 + Math.random() * .4); c.beginPath(); c.roundRect ? c.roundRect(x + 3, y + 3, 74, 42, 8) : c.rect(x + 3, y + 3, 74, 42); c.fill(); } noiseFill(c, w, h, 6000, .22, ['#000000', '#ffffff']); },
  panel:(col) => (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; for (let x = 0; x <= w; x += 128){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, 0, w, h * .5); },
};
/* bina cephesi: tuğla/sıva + pencereler (bazıları ışıklı), zemin katta dükkân */
function facadeTex(seed, base, night){
  return aTex('fac' + seed + base + night, 512, 1024, (c, w, h) => {
    TX.brick(base, '#4a3f38')(c, w, h); let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let fl = 0; fl < 5; fl++) for (let i = 0; i < 3; i++){ const x = 40 + i * 160, y = 70 + fl * 165;
      c.fillStyle = '#2a2e35'; c.fillRect(x - 8, y - 8, 116, 136); const lit = night && rnd() < .45;
      const g = c.createLinearGradient(0, y, 0, y + 120); if (lit){ g.addColorStop(0, '#ffe2a0'); g.addColorStop(1, '#d9902e'); } else { g.addColorStop(0, '#5f7a96'); g.addColorStop(1, '#2a3a4c'); }
      c.fillStyle = g; c.fillRect(x, y, 100, 120); c.fillStyle = '#e8e2d6'; c.fillRect(x + 47, y, 6, 120); c.fillRect(x, y + 56, 100, 6); c.fillStyle = '#d8d2c6'; c.fillRect(x - 12, y + 124, 124, 10);
      if (rnd() < .3){ c.fillStyle = 'rgba(160,40,40,.85)'; c.fillRect(x + 2, y + 2, 44, 52); } }
  });
}
function signTex(text, bg, fg){ return aTex('sg' + text + bg, 512, 128, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = fg; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = fg; c.font = 'italic 900 64px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 4, w - 40); }); }

/* ---------- yapı taşları ---------- */
function A3(){ const Wd = R3.world(); return Wd; }
const AMAT = new Map();
function stdM(o){ const { T } = A3(); const plain = !o.map && !o.transparent; if (plain){ const k = JSON.stringify(o); let m = AMAT.get(k); if (!m){ m = new T.MeshStandardMaterial(Object.assign({ roughness:.85, metalness:.02 }, o)); AMAT.set(k, m); } return m; }
  return new T.MeshStandardMaterial(Object.assign({ roughness:.85, metalness:.02 }, o)); }
const dynM = m => { m.userData.dyn = 1; return m; };
function plane(w, h, m, x, y, z, rx = 0, ry = 0){ const { T } = A3(); const p = new T.Mesh(new T.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); p.receiveShadow = true; return p; }
function boxM(w, h, d, m, x, y, z, cast = true){ const { T } = A3(); const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; return b; }
function cylM(r, h, m, x, y, z, seg = 16, r2){ const { T } = A3(); const b = new T.Mesh(new T.CylinderGeometry(r, r2 == null ? r : r2, h, seg), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; return b; }
const emis = (col, k = 1.6) => { const { T } = A3(); return new T.MeshStandardMaterial({ color:col, emissive:new T.Color(col), emissiveIntensity:k, roughness:.4 }); };
/* sokak lambası */
function streetLamp(g0, x, z, face, U){ const pole = stdM({ color:'#2b2f36', metalness:.6, roughness:.4 }), g = new (A3().T.Group)(); g0.add(g); if (face < 0) U.front.push(g);
  g.add(cylM(.07, 4.6, pole, x, 2.3, z, 10)); const arm = boxM(.9, .07, .07, pole, x, 4.55, z + face * .42); arm.rotation.y = Math.PI / 2; g.add(arm);
  g.add(boxM(.42, .12, .24, pole, x, 4.5, z + face * .85)); g.add(boxM(.36, .04, .2, emis('#ffd9a0', 2.4), x, 4.43, z + face * .85, false)); U.lamps.push([x, 4.3, z + face * .85, '#ffc98a', 7]); }
/* basit araba (alçak poligon, gövde + kabin + tekerler + farlar) */
function carMesh(col, U, x, z, rot){ const { T } = A3(), g = new T.Group(), body = stdM({ color:col, metalness:.55, roughness:.3 }), glass = stdM({ color:'#1d2834', metalness:.3, roughness:.1 }), tire = stdM({ color:'#111111', roughness:.9 });
  g.add(boxM(4.1, .62, 1.75, body, 0, .58, 0)); g.add(boxM(2.2, .55, 1.6, glass, -.15, 1.15, 0)); g.add(boxM(2.0, .08, 1.55, body, -.15, 1.44, 0));
  for (const [wx, wz] of [[1.35, .82], [1.35, -.82], [-1.35, .82], [-1.35, -.82]]){ const w = cylM(.33, .24, tire, wx, .33, wz, 14); w.rotation.x = Math.PI / 2; g.add(w); }
  g.add(boxM(.05, .14, .4, emis('#fff6d8', 1.2), 2.06, .66, .55, false)); g.add(boxM(.05, .14, .4, emis('#fff6d8', 1.2), 2.06, .66, -.55, false)); g.add(boxM(.05, .12, .4, emis('#ff2a2a', 1.4), -2.06, .7, .55, false)); g.add(boxM(.05, .12, .4, emis('#ff2a2a', 1.4), -2.06, .7, -.55, false));
  g.add(boxM(3.9, .06, 1.6, stdM({ color:'#f4f8ff', roughness:.9 }), -.15, 1.5, 0, false));
  g.position.set(x, 0, z); g.rotation.y = rot; return g; }
function rackMesh(len, U, x, z){ const { T } = A3(), g = new T.Group(), steel = stdM({ color:'#e0621a', metalness:.5, roughness:.4 }), beam = stdM({ color:'#2d5aa8', metalness:.5, roughness:.4 }), wood = stdM({ color:'#b98a52', roughness:.9 });
  const n = Math.max(1, Math.floor(len / 2.7)); for (let i = 0; i <= n; i++){ const px = -len / 2 + i * len / n; g.add(boxM(.09, 4.2, .09, steel, px, 2.1, -.5)); g.add(boxM(.09, 4.2, .09, steel, px, 2.1, .5)); }
  for (const y of [.12, 1.5, 2.9]){ g.add(boxM(len, .12, .08, beam, 0, y, -.5)); g.add(boxM(len, .12, .08, beam, 0, y, .5)); }
  const boxCols = ['#b8874f', '#c9a26b', '#9e7444', '#7a8a96'];
  for (const y of [.18, 1.56, 2.96]) for (let i = 0; i < n * 2; i++){ if (hash01(i * 7.3 + y * 3 + x) < .2) continue; const bx = -len / 2 + (i + .5) * len / (n * 2); g.add(boxM(1.1, .14, .95, wood, bx, y + .07, 0));
    const h = .5 + hash01(i + y) * .55; g.add(boxM(1.0, h, .9, stdM({ color:boxCols[(i + Math.floor(y)) % 4], roughness:.9 }), bx, y + .14 + h / 2, 0)); }
  g.position.set(x, 0, z); return g; }

/* ---------- sahne kurulumu ---------- */
function arenaFor(L){ return R3.custom('ar_' + (L.key || 'x') + (L.duo ? 'd' : '') + '_' + (L.def.width || W), () => buildArena(L)); }
function buildArena(L){
  const { T } = A3(), def = L.def, A = ARENA[def.bg] || ARENA.depo, g = new T.Group(), len = (def.width || W) / 100, z0 = L.zMin / 100, z1 = L.zMax / 100;
  const U = g.userData = { kind:A.kind, lamps:[], front:[], ceil:[], len, z0, z1, night:!!A.night, gate:null, bars:null, flick:[], alarm:[] };
  const kind = A.kind, X0 = -6, X1 = len + 6, LX = X1 - X0, MX = (X0 + X1) / 2;
  const floor = (tex, rep, rough = .9, metal = 0) => { const p = plane(LX, (z1 - z0) + 8, stdM({ map:aTex(tex[0], tex[1], tex[2], tex[3], LX / rep, ((z1 - z0) + 8) / rep), roughness:rough, metalness:metal }), MX, 0, (z0 + z1) / 2, -Math.PI / 2); g.add(p); return p; };
  const wallBack = (m, h, z = z0 - .02) => { const p = plane(LX, h, m, MX, h / 2, z); g.add(p); return p; };
  const wallFront = (m, h, z = z1 + .02) => { const p = plane(LX, h, m, MX, h / 2, z, 0, Math.PI); g.add(p); U.front.push(dynM(p)); return p; };
  const endWalls = (m, h) => { for (const [x, ry] of [[-.25, Math.PI / 2], [len + .25, -Math.PI / 2]]){ const p = plane((z1 - z0) + 3, h, m, x, h / 2, (z0 + z1) / 2, 0, ry); g.add(p); } };
  const ceiling = (m, h) => { const p = plane(LX, (z1 - z0) + 3, m, MX, h, (z0 + z1) / 2, Math.PI / 2); g.add(p); U.ceil.push(dynM(p)); return p; };
  let sky = null, fog = ['#20242c', 14, 46], light = { hemi:['#c8d4e8', '#3a3530', 1.0], sun:['#fff2dd', 1.6], sunDir:[.3, 1, .5], fill:.35 }, post = {};
  if (kind === 'street' || kind === 'alley' || kind === 'yard'){
    const alley = kind === 'alley', yard = kind === 'yard';
    floor(alley ? ['wet', 512, 512, TX.asphaltWet] : yard ? ['yard', 512, 512, TX.concrete('#55595e')] : ['snowroad', 512, 512, TX.asphaltSnow], alley ? 6 : 9, alley ? .35 : .82, alley ? .25 : 0);
    if (!alley && !yard){ for (const [zz, w] of [[z0 - 1.5, 3], [z1 + 1.5, 3]]) { const s = plane(LX, w, stdM({ map:aTex('swalk', 256, 256, TX.sidewalk, LX / 2.5, w / 2.5), roughness:.9 }), MX, .12, zz, -Math.PI / 2); g.add(s); g.add(boxM(LX, .14, .18, stdM({ color:'#9a9da3' }), MX, .07, zz + (zz < 0 ? 1.5 : -1.5))); } }
    // binalar (iki yanda) — cepheler
    const bz0 = alley ? z0 - .3 : yard ? z0 - 5 : z0 - 3.2, bz1 = alley ? z1 + 1.15 : z1 + 3.2, bh = alley ? 11 : 14, cols = ['#8a4b3a', '#9a6a4a', '#6b5a50', '#7a3f35', '#8f7a64'];
    for (const [bz, face] of [[bz0, 1], [bz1, -1]]){ if (yard && face < 0) continue; let x = X0 - 4, i = 0;
      while (x < X1 + 4){ const bw = 6 + hash01(i * 3.7 + face) * 5, h = bh + hash01(i * 1.9 + face * 4) * 5; const m = stdM({ map:facadeTex(i + (face > 0 ? 0 : 20), cols[(i + (face > 0 ? 0 : 2)) % cols.length], U.night ? 1 : 0), roughness:.9 }); m.map.repeat.set(bw / 6, h / 12);
        const p = plane(bw, h, m, x + bw / 2, h / 2, bz, 0, face > 0 ? 0 : Math.PI); g.add(p); if (face < 0) U.front.push(dynM(p));
        g.add(boxM(bw + .2, .5, .5, stdM({ color:'#3a3030' }), x + bw / 2, h + .25, bz + face * .1)); if (face < 0) U.front.push(dynM(g.children[g.children.length - 1]));
        if (!alley && !yard && face > 0 && hash01(i * 5.3) < .75){ const names = ['KAFE ŞAHİN', 'BAKKAL', 'BERBER', 'ÇİÇEKÇİ', 'FIRIN', 'KIRTASİYE', 'TERZİ']; const sg = plane(Math.min(4, bw - 1), .8, new T.MeshBasicMaterial({ map:signTex(names[i % names.length], ['#14306b', '#7a1d1d', '#1d5a3a', '#3a2a5a'][i % 4], '#ffe9a8'), toneMapped:false }), x + bw / 2, 3.4, bz + .06); g.add(sg);
          const win = plane(Math.min(4, bw - 1), 2.1, emis(U.night ? '#ffcf7a' : '#5f7a96', U.night ? .9 : .2), x + bw / 2, 1.5, bz + .05); g.add(win); }
        x += bw + .02; i++; } }
    if (!alley && !yard){ for (let x = 1.5; x < len + 2; x += 8){ streetLamp(g, x, z0 - 1.2, 1, U); streetLamp(g, x + 4, z1 + 1.2, -1, U); }
      const carCols = ['#9b1c1c', '#1c3f9b', '#e0e0e0', '#2b2b2b', '#c9a227'];
      for (let x = 2, i = 0; x < len + 4; x += 6.5 + hash01(i) * 4, i++){ const c = carMesh(carCols[i % 5], U, x, z1 + 1.9, hash01(i * 2) < .5 ? 0 : Math.PI); g.add(c); U.front.push(dynM(c)); }
      for (let x = 0; x < len; x += 3.7){ g.add(boxM(.6 + hash01(x) * .8, .25, .5, stdM({ color:'#f2f6fc', roughness:.95 }), x, .12, z0 - .15 - hash01(x * 3) * .3, false)); }
      sky = 'dusk'; fog = ['#3a4560', 12, 60]; light = { hemi:['#8fa4d8', '#2a2a36', .75], sun:['#ffd2a8', .9], sunDir:[-.6, .8, .4], fill:.25 }; post = { bloom:.5, th:.8 };
    }
    if (alley){ const esc = stdM({ color:'#1c1f24', metalness:.6, roughness:.5 });
      for (let x = 1.5; x < len; x += 7){ for (let fl = 0; fl < 3; fl++){ const y = 3 + fl * 2.6; g.add(boxM(3, .08, 1.0, esc, x, y, z0 + .2)); g.add(boxM(3, .7, .04, esc, x, y + .4, z0 + .7)); } }
      for (let x = 3, i = 0; x < len; x += 9, i++){ const d = boxM(1.8, 1.25, .95, stdM({ color:i % 2 ? '#2f5a3a' : '#3a4a5a', metalness:.4, roughness:.6 }), x, .62, z1 + .55); g.add(d); U.front.push(dynM(d)); }
      const neon = [['GECE KULÜBÜ', '#ff3fa0'], ['OTEL', '#3fd0ff'], ['BAR', '#ffcf3f']];
      for (let x = 4, i = 0; x < len; x += 10, i++){ const n = neon[i % 3]; const s = plane(2.6, .7, new T.MeshBasicMaterial({ map:signTex(n[0], '#120818', n[1]), toneMapped:false }), x, 4.4, z0 + .08); g.add(s); U.lamps.push([x, 4.0, z0 + .6, n[1], 7]); U.flick.push(dynM(s)); }
      sky = 'night'; fog = ['#141a24', 8, 34]; light = { hemi:['#6a7aa8', '#141418', .55], sun:['#a8b8ff', .55], sunDir:[.2, 1, .4], fill:.2 }; post = { bloom:.65, th:.7, sat:1.12 };
    }
    if (yard){ const fence = stdM({ color:'#8a929c', metalness:.6, roughness:.5, transparent:true, opacity:.55 });
      for (let x = -4; x < len + 4; x += 3){ g.add(cylM(.05, 2.6, stdM({ color:'#6a7078', metalness:.6 }), x, 1.3, z1 + .4, 8)); } const fp = plane(LX, 2.5, fence, MX, 1.25, z1 + .4, 0, Math.PI); g.add(fp); U.front.push(dynM(fp));
      g.add(boxM(8, 7, 3, stdM({ map:facadeTex(77, '#6b4a3a', 1), roughness:.9 }), len * .55, 3.5, z0 - 6.5)); g.add(cylM(.6, 16, stdM({ color:'#7a4a3a' }), len * .8, 8, z0 - 7, 12, .8));
      for (let x = 1, i = 0; x < len; x += 6, i++){ g.add(boxM(6, 2.6, 2.4, stdM({ color:['#2d5aa8', '#a83a2d', '#3a8a4a'][i % 3], metalness:.5, roughness:.5 }), x + 2.5, 1.3, z0 - 1.6)); }
      for (let x = 2; x < len; x += 9){ g.add(cylM(.06, 6, stdM({ color:'#3a3f46', metalness:.6 }), x, 3, z0 - .3, 8)); g.add(boxM(.8, .4, .3, emis('#fff2d0', 2.2), x, 6, z0 - .1, false)); U.lamps.push([x, 5.6, z0 + .6, '#fff0d0', 10]); }
      sky = 'night'; fog = ['#1a2230', 14, 55]; light = { hemi:['#8a9ac8', '#2a2a30', .95], sun:['#d8e0ff', 1.3], sunDir:[.4, 1, .6], fill:.35 }; post = { bloom:.55, th:.75 };
    }
  } else if (kind === 'pitch'){
    if (typeof buildWorld === 'function'){ const w = buildWorld('stad'); w.position.x = len / 2; g.add(w); U.stad = w; }
    sky = 'stad'; fog = null; light = { hemi:['#cfd8ff', '#2a3a20', 1.1], sun:['#ffffff', 2.2], sunDir:[.3, 1, .5], fill:.5 }; post = { bloom:.45, th:.85 };
  } else {
    /* iç mekânlar */
    const S = {
      warehouse:{ fl:['flines', 512, 512, TX.floorLines], fr:7, rough:.6, wall:['corr', 256, 256, TX.corrugated('#5a6f86')], wr:3, h:7.5, ceil:'#3a4048', light:{ hemi:['#dfe6f0', '#4a4438', 1.1], sun:['#fff0d8', 1.7], sunDir:[.5, 1, .25], fill:.35 }, fog:['#6a7280', 16, 48] },
      tunnel:{ fl:['tfl', 512, 512, TX.asphaltWet], fr:6, rough:.4, wall:['tcon', 512, 512, TX.concrete('#6f7378')], wr:4, h:4.6, ceil:'#3a3d42', light:{ hemi:['#a8c4d8', '#202428', .7], sun:['#d8f0ff', .6], sunDir:[.1, 1, .2], fill:.2 }, fog:['#1a2026', 8, 30] },
      factory:{ fl:['ffl', 512, 512, TX.concrete('#62666b')], fr:6, rough:.7, wall:['fbr', 512, 512, TX.brick('#6b4a3a')], wr:4, h:7, ceil:'#2e3238', light:{ hemi:['#d8d0c0', '#3a3028', .9], sun:['#ffe0b0', 1.3], sunDir:[.4, 1, .3], fill:.3 }, fog:['#3a3630', 12, 40] },
      gym:{ fl:['gfl', 512, 512, TX.wood('#b07a44')], fr:5, rough:.5, wall:['gwl', 512, 512, TX.brick('#8a7a64', '#6a5a4a')], wr:4, h:7, ceil:'#4a4238', light:{ hemi:['#f0e4cc', '#4a3a28', 1.0], sun:['#ffe8c0', 1.4], sunDir:[.5, 1, .2], fill:.3 }, fog:['#5a5040', 14, 40] },
      office:{ fl:['ofl', 512, 512, TX.tiles('#c8ccd2', '#b8bcc4')], fr:5, rough:.25, metal:.05, wall:['owl', 256, 256, TX.panel('#dfe3e8')], wr:3, h:3.4, ceil:'#e8ecf0', light:{ hemi:['#eef4ff', '#6a6a70', 1.2], sun:['#ffffff', 1.1], sunDir:[.2, 1, .3], fill:.4 }, fog:['#a0a8b4', 14, 40] },
      security:{ fl:['sfl', 512, 512, TX.tiles('#3a3f48', '#32363e')], fr:4, rough:.4, wall:['swl', 256, 256, TX.panel('#2a3040')], wr:3, h:3.4, ceil:'#1e222a', light:{ hemi:['#7aa8ff', '#101418', .6], sun:['#9ac0ff', .6], sunDir:[.2, 1, .3], fill:.25 }, fog:['#0e1420', 8, 30] },
      salon:{ fl:['mfl', 512, 512, TX.marble], fr:5, rough:.18, metal:.05, wall:['slw', 256, 256, TX.panel('#5a1e24')], wr:3, h:7, ceil:'#3a1418', light:{ hemi:['#ffe8d0', '#3a2018', 1.0], sun:['#ffe2b0', 1.2], sunDir:[.2, 1, .3], fill:.35 }, fog:['#2a1410', 12, 40] },
      under:{ fl:['ufl', 512, 512, TX.concrete('#6a6e72')], fr:6, rough:.7, wall:['uwl', 512, 512, TX.concrete('#7a7e84')], wr:4, h:4.2, ceil:'#4a4e54', light:{ hemi:['#d0dce8', '#2a2a2a', .85], sun:['#e8f0ff', .8], sunDir:[.2, 1, .3], fill:.25 }, fog:['#2a3038', 10, 34] },
      crypt:{ fl:['cfl', 512, 512, TX.stone], fr:4, rough:.85, wall:['cwl', 512, 512, TX.stone], wr:3, h:5, ceil:'#201c18', light:{ hemi:['#c89a6a', '#100c08', .5], sun:['#ffb070', .4], sunDir:[.2, 1, .3], fill:.15 }, fog:['#140e0a', 7, 28] },
      dojo:{ fl:['dfl', 512, 512, TX.tatami], fr:2.6, rough:.8, wall:['dwl', 512, 512, TX.shoji], wr:3.2, h:5, ceil:'#4a3424', light:{ hemi:['#ffe8c8', '#4a3424', 1.15], sun:['#ffe0b0', 1.4], sunDir:[.4, 1, .3], fill:.35 }, fog:['#4a3a2a', 14, 40] },
    }[kind] || {};
    floor(S.fl, S.fr, S.rough, S.metal || 0);
    const wm = stdM({ map:aTex(S.wall[0], S.wall[1], S.wall[2], S.wall[3], LX / S.wr, S.h / S.wr), roughness:.85 });
    const PAD = { warehouse:[1.6, .8], factory:[1.6, 1.05], security:[.95, .75], salon:[.75, .1], under:[.52, .1], office:[.02, .65], dojo:[.2, .2], gym:[.02, .02], tunnel:[.02, .02], crypt:[.02, .02] }[kind] || [.02, .02];
    const backZ = z0 - PAD[0], frontZ = z1 + PAD[1];
    wallBack(wm, S.h, backZ); wallFront(wm, S.h, frontZ); endWalls(wm, S.h); ceiling(stdM({ color:S.ceil, roughness:.9 }), S.h);
    if (kind === 'warehouse'){
      for (let x = 2.2; x < len - 1; x += 6.5) g.add(rackMesh(4.8, U, x + 2, z0 - .85));
      const col = stdM({ color:'#3a4a5c', metalness:.55, roughness:.4 }); for (let x = 0; x < len + 1; x += 6.5){ g.add(boxM(.3, S.h, .3, col, x, S.h / 2, z0 - .05)); const cf = boxM(.3, S.h, .3, col, x, S.h / 2, z1 + .5); g.add(cf); U.front.push(dynM(cf)); }
      for (let x = 0; x < len + 1; x += 6.5){ const tr = boxM(.18, .5, (z1 - z0) + 3, col, x, S.h - .35, (z0 + z1) / 2); g.add(tr); U.ceil.push(dynM(tr)); }
      for (let x = 1; x < len; x += 4){ const w = plane(2.4, 1.1, emis('#dfefff', 1.3), x, S.h - 1.4, backZ + .03); g.add(w); }
      for (let x = 3.2; x < len; x += 6.5){ const lamp = R3.world().mesh('cone', stdM({ color:'#2a2e34', metalness:.5 }), .38, .3, .38, x, S.h - 1.2, (z0 + z1) / 2); g.add(lamp); U.ceil.push(dynM(lamp)); g.add(boxM(.4, .03, .4, emis('#fff4dc', 2.6), x, S.h - 1.36, (z0 + z1) / 2, false)); U.lamps.push([x, S.h - 1.6, (z0 + z1) / 2, '#fff1d6', 11]); }
      // ışık huzmeleri (camdan giren güneş)
      for (let x = 1; x < len; x += 8){ const b = plane(2.2, S.h * 1.25, new T.MeshBasicMaterial({ color:'#fff4d8', transparent:true, opacity:.07, depthWrite:false, side:T.DoubleSide, toneMapped:false }), x + 1.2, S.h * .5, (z0 + z1) / 2 - .5, -.55, 0); b.rotation.z = .35; g.add(b); }
      for (let x = 4, i = 0; x < len; x += 11, i++){ g.add(R3.world().mesh('cyl', stdM({ color:'#2d6ab0', metalness:.4 }), .3, .9, .3, x, .45, z1 + .38)); g.add(R3.world().mesh('cyl', stdM({ color:'#b03a2d', metalness:.4 }), .3, .9, .3, x + .7, .45, z1 + .4)); }
    } else if (kind === 'tunnel'){
      const arch = new T.Mesh(new T.CylinderGeometry((z1 - z0) / 2 + .4, (z1 - z0) / 2 + .4, LX, 24, 1, true, 0, Math.PI), stdM({ map:aTex('tarch', 512, 512, TX.concrete('#5f6368'), LX / 4, 3), side:T.BackSide, roughness:.9 }));
      arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.set(MX, S.h - 1.2, (z0 + z1) / 2); g.add(arch); U.ceil.push(dynM(arch));
      const pipe = stdM({ color:'#6a5a3a', metalness:.6, roughness:.45 }); for (const [y, r] of [[2.6, .14], [2.95, .09], [3.2, .07]]){ const p = cylM(r, LX, pipe, MX, y, z0 + .2, 12); p.rotation.z = Math.PI / 2; g.add(p); }
      for (let x = 1; x < len; x += 4.5){ const l = boxM(1.4, .06, .14, emis('#e8f6ff', 2.6), x, S.h - .5, (z0 + z1) / 2, false); g.add(l); U.ceil.push(dynM(l)); U.lamps.push([x, S.h - .8, (z0 + z1) / 2, '#d8f0ff', 8]); if (hash01(x) < .25) U.flick.push(dynM(l)); }
      const tags = ['ARAÇ', 'İSSEM', 'UFİS 10', 'ŞAMPİYON']; for (let x = 3, i = 0; x < len; x += 7, i++){ const s = plane(3, 1.2, new T.MeshBasicMaterial({ map:aTex('gr' + i, 512, 192, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = 'italic 900 110px ' + FONT; c.lineWidth = 14; c.strokeStyle = '#111'; c.fillStyle = ['#ff3fa0', '#3fd0ff', '#7dff5a', '#ffcf3f'][i % 4]; c.textAlign = 'center'; c.strokeText(tags[i % 4], w / 2, 140); c.fillText(tags[i % 4], w / 2, 140); }), transparent:true }), x, 1.4, z0 + .03); g.add(s); }
    } else if (kind === 'factory'){
      for (let x = 2, i = 0; x < len; x += 5.5, i++){ const m = stdM({ color:i % 2 ? '#3a5a7a' : '#7a6a3a', metalness:.6, roughness:.4 }); g.add(boxM(2.2, 2.4, 1.4, m, x, 1.2, z0 - .75)); g.add(cylM(.18, 3, stdM({ color:'#8a8a8a', metalness:.7 }), x - .6, 3.6, z0 - .8, 10)); g.add(boxM(.6, .4, .05, emis(i % 2 ? '#7dff9a' : '#ff5a5a', 1.6), x + .5, 1.8, z0 - .04, false)); }
      const belt = boxM(LX, .5, .9, stdM({ color:'#1e2226', roughness:.6 }), MX, .5, z1 + .5); g.add(belt); U.front.push(dynM(belt));
      for (let x = 2; x < len; x += 7){ const b = R3.world().mesh('sph', emis('#ff2a2a', 2.2), .14, .14, .14, x, S.h - .9, z0 - .2); g.add(b); U.alarm.push(dynM(b)); U.lamps.push([x, S.h - 1.4, (z0 + z1) / 2, '#ffd8b0', 10]); }
    } else if (kind === 'gym'){
      const bars = stdM({ color:'#9a6a3a' }); for (let x = 1; x < len; x += 3){ for (let i = 0; i < 6; i++) g.add(boxM(1.2, .05, .05, bars, x, .4 + i * .45, z0 + .03)); g.add(boxM(.07, 2.8, .07, bars, x - .6, 1.4, z0 + .03)); g.add(boxM(.07, 2.8, .07, bars, x + .6, 1.4, z0 + .03)); }
      for (let x = 2; x < len; x += 5){ g.add(plane(2.2, 1.6, emis('#cfe0ef', .7), x, 5, z0 + .03)); U.lamps.push([x, 5.2, (z0 + z1) / 2, '#ffe8c8', 10]); }
      g.add(boxM(1.8, 1.1, .08, stdM({ color:'#f0f0f0' }), len / 2, 3.4, z0 + .1));
    } else if (kind === 'office'){
      const glass = new T.MeshStandardMaterial({ color:'#a8c8e0', transparent:true, opacity:.28, roughness:.05, metalness:.2 });
      for (let x = 0; x < len; x += 3){ g.add(boxM(.06, S.h, .06, stdM({ color:'#3a3f46', metalness:.6 }), x, S.h / 2, z0 + .03)); }
      for (let x = 1.5, i = 0; x < len; x += 3, i++){ const gp = plane(2.9, S.h, glass, x, S.h / 2, z0 + .05); g.add(gp); const desk = boxM(1.6, .75, .7, stdM({ color:'#c8a878' }), x, .37, z0 - 1); g.add(desk); g.add(boxM(.5, .32, .04, emis('#5ab0ff', 1.1), x, .95, z0 - 1.1, false)); }
      for (let x = 1, i = 0; x < len; x += 2.4, i++){ const pn = boxM(1.2, .04, .6, emis('#ffffff', 1.6), x, S.h - .02, (z0 + z1) / 2, false); g.add(pn); U.ceil.push(dynM(pn)); if (i % 2 === 0) U.lamps.push([x, S.h - .4, (z0 + z1) / 2, '#ffffff', 8]); }
      for (let x = 2.5; x < len; x += 6){ g.add(cylM(.22, .5, stdM({ color:'#6a4a3a' }), x, .25, z1 + .3)); g.add(R3.world().mesh('sph', stdM({ color:'#3a7a3a' }), .4, .55, .4, x, .9, z1 + .3)); }
      if (L.st.alarm) for (let x = 2; x < len; x += 6){ const b = R3.world().mesh('sph', emis('#ff2a2a', 2.2), .12, .12, .12, x, S.h - .2, z0 + .15); g.add(b); U.alarm.push(dynM(b)); }
      const logo = plane(2.6, .9, new T.MeshBasicMaterial({ map:signTex('KARARGÂH', '#1a1a1a', '#ff3b3b'), toneMapped:false }), len * .5, 2.4, z0 + .06); g.add(logo);
    } else if (kind === 'security'){
      const scr = aTex('scr' + (L.st.screen || ''), 512, 288, (c, w, h) => { c.fillStyle = '#0a1420'; c.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++){ const x = (i % 3) * w / 3, y = Math.floor(i / 3) * h / 2; c.fillStyle = '#16283a'; c.fillRect(x + 6, y + 6, w / 3 - 12, h / 2 - 12); c.fillStyle = '#7dff9a'; c.font = '14px monospace'; c.fillText('KAM ' + (i + 1), x + 12, y + 24); }
        if (L.st.screen === 'masked'){ c.fillStyle = '#000'; c.beginPath(); c.arc(w / 2, h / 2 + 10, 60, 0, 7); c.fill(); c.fillStyle = '#ff2a2a'; c.fillRect(w / 2 - 30, h / 2, 18, 8); c.fillRect(w / 2 + 12, h / 2, 18, 8); } });
      const mon = plane(Math.min(7, len - 2), 2.2, new T.MeshBasicMaterial({ map:scr, toneMapped:false }), len / 2, 2.0, z0 - .9); g.add(mon); U.flick.push(dynM(mon));
      for (let x = 1.5; x < len; x += 3){ g.add(boxM(1.8, .75, .8, stdM({ color:'#3a3f48', metalness:.4 }), x, .37, z0 - .45)); }
      for (let x = 1; x < len; x += 3.5){ g.add(boxM(.7, 2.2, .6, stdM({ color:'#1a1e24', metalness:.5 }), x, 1.1, z1 + .35)); g.add(boxM(.5, .04, .02, emis('#7dff9a', 1.8), x, 1.6, z1 + .04, false)); }
      for (let x = 1.5; x < len; x += 3) U.lamps.push([x, S.h - .5, (z0 + z1) / 2, '#9ac0ff', 7]);
    } else if (kind === 'salon'){
      g.add(plane(LX, 2.2, stdM({ color:'#8a1a1a', roughness:.95 }), MX, .012, (z0 + z1) / 2, -Math.PI / 2));
      const gold = stdM({ color:'#c9a24a', metalness:.85, roughness:.3 }); for (let x = 0; x < len + 1; x += 3.2){ g.add(cylM(.32, S.h, stdM({ color:'#efe6d8', roughness:.4 }), x, S.h / 2, z0 - .38, 18)); g.add(cylM(.42, .3, gold, x, S.h - .15, z0 - .38, 18)); g.add(cylM(.42, .3, gold, x, .15, z0 - .38, 18)); }
      for (let x = 1.6; x < len; x += 4.8){ const ch = R3.world().mesh('sph', emis('#fff0c8', 1.8), .5, .35, .5, x, S.h - 1.4, (z0 + z1) / 2); g.add(ch); U.ceil.push(dynM(ch)); U.lamps.push([x, S.h - 1.8, (z0 + z1) / 2, '#ffe6b8', 12]); }
      for (let x = .8; x < len; x += 3.2){ g.add(plane(1.6, S.h - 1, stdM({ color:'#6a1018', roughness:.95 }), x + 1.6, (S.h - 1) / 2 + .5, z0 - .72)); }
    } else if (kind === 'under'){
      for (let x = 1; x < len; x += .7){ g.add(boxM(.62, 1.9, .45, stdM({ color:hash01(x) < .5 ? '#2d5aa8' : '#3a6ab8', metalness:.5, roughness:.4 }), x, .95, z0 - .25)); }
      const pipe = stdM({ color:'#8a8a8a', metalness:.6, roughness:.4 }); for (const y of [3.4, 3.7]){ const p = cylM(.12, LX, pipe, MX, y, z0 + .3, 10); p.rotation.z = Math.PI / 2; g.add(p); }
      for (let x = 1; x < len; x += 4){ const l = boxM(1.2, .05, .12, emis('#eef6ff', 2.4), x, S.h - .05, (z0 + z1) / 2, false); g.add(l); U.ceil.push(dynM(l)); U.lamps.push([x, S.h - .5, (z0 + z1) / 2, '#eef6ff', 8]); }
      const sg = plane(2, .6, new T.MeshBasicMaterial({ map:signTex('SAHA ➜', '#1d5a3a', '#ffffff'), toneMapped:false }), len - 2, 2.6, z0 - .48); g.add(sg);
    } else if (kind === 'crypt'){
      for (let x = 1.5; x < len; x += 4){ g.add(boxM(.12, .5, .12, stdM({ color:'#3a2a1a' }), x, 2.2, z0 + .1)); const fl = R3.world().mesh('cone', emis('#ff9a3a', 2.6), .1, .28, .1, x, 2.6, z0 + .14); g.add(fl); U.flick.push(dynM(fl)); U.lamps.push([x, 2.6, z0 + .6, '#ff9a4a', 7]); }
      for (let x = 3, i = 0; x < len; x += 6, i++){ g.add(plane(1.2, 2.6, stdM({ color:i % 2 ? '#6a1018' : '#14306b', roughness:.95 }), x, 3, z0 + .04)); }
    } else if (kind === 'dojo'){
      const beam = stdM({ color:'#4a2c18', roughness:.8 }); for (let x = 0; x < len + 1; x += 2.4){ g.add(boxM(.22, S.h, .22, beam, x, S.h / 2, z0 - .1)); const f = boxM(.22, S.h, .22, beam, x, S.h / 2, z1 + .1); g.add(f); U.front.push(dynM(f)); }
      for (let x = 1.2, i = 0; x < len; x += 4.8, i++){ g.add(plane(.8, 2, new T.MeshBasicMaterial({ map:aTex('scroll' + i, 128, 320, (c, w, h) => { c.fillStyle = '#efe4c8'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1a10'; c.font = 'bold 60px serif'; c.textAlign = 'center'; ['力', '心', '道'].forEach((k, j) => c.fillText(['GÜÇ', 'KALP', 'YOL'][i % 3] ? k : k, w / 2, 90 + j * 90)); c.fillStyle = '#4a2c18'; c.fillRect(0, 0, w, 12); c.fillRect(0, h - 12, w, 12); }) }), x + 1.2, 2.6, z0 - .19)); }
      for (let x = 2.4; x < len; x += 4.8){ const lt = plane(1.0, 1.0, emis('#ffe2b0', 1.2), x, S.h - .02, (z0 + z1) / 2, Math.PI / 2); g.add(lt); U.ceil.push(dynM(lt)); U.lamps.push([x, S.h - .5, (z0 + z1) / 2, '#ffe2b0', 9]); }
    }
    light = S.light; fog = S.fog; post = { bloom:.35, th:.88 };
  }
  /* platformlar (arka duvar boyunca yükseltilmiş blok), basamaklar, merdivenler */
  for (const p of L.plats || []){ const x1 = p.x1 / 100, x2 = p.x2 / 100, top = (GROUND - p.y) / 100, pz0 = p.z1 / 100, pz1 = p.z2 / 100, w = x2 - x1, d = pz1 - pz0;
    const style = p.step ? 'step' : p.style || (kind === 'salon' ? 'marble' : 'dock');
    const mBody = style === 'marble' ? stdM({ map:aTex('pmar', 512, 512, TX.marble, w / 2, top / 2), roughness:.25 }) : style === 'scaffold' ? stdM({ color:'#7a828c', metalness:.5, roughness:.45 }) : style === 'balcony' ? stdM({ map:aTex('pbr', 512, 512, TX.brick('#8a6a5a'), w / 2, top / 2), roughness:.9 }) : stdM({ map:aTex('pcon', 512, 512, TX.concrete('#8a8e94'), w / 2, top / 2), roughness:.85 });
    g.add(boxM(w, top, d, mBody, (x1 + x2) / 2, top / 2, (pz0 + pz1) / 2));
    if (style === 'step'){ g.add(boxM(w, .04, .06, stdM({ color:'#f2c230' }), (x1 + x2) / 2, top - .02, pz1 - .03, false)); continue; }
    g.add(boxM(w, .08, d, stdM({ color:style === 'scaffold' ? '#b07a3a' : '#9a9ea4', roughness:.8 }), (x1 + x2) / 2, top + .04, (pz0 + pz1) / 2));
    // ön kenar: sarı-siyah ikaz şeridi (salonda altın şerit)
    if (style === 'marble') g.add(boxM(w, .08, .06, stdM({ color:'#c9a24a', metalness:.85, roughness:.3 }), (x1 + x2) / 2, top - .04, pz1 + .02, false)); else g.add(plane(w, .16, stdM({ map:aTex('haz', 256, 32, (c, ww, hh) => { c.fillStyle = '#f2c230'; c.fillRect(0, 0, ww, hh); c.fillStyle = '#111'; for (let x = -32; x < ww; x += 32){ c.beginPath(); c.moveTo(x, hh); c.lineTo(x + 16, 0); c.lineTo(x + 32, 0); c.lineTo(x + 16, hh); c.fill(); } }, w / 1.2, 1) }), (x1 + x2) / 2, top - .08, pz1 + .005));
    if (style === 'scaffold'){ const pipe = stdM({ color:'#9aa2ac', metalness:.7, roughness:.3 }); for (let x = x1 + .1; x < x2; x += 1.1){ g.add(cylM(.03, top, pipe, x, top / 2, pz1 + .03, 8)); } for (let x = x1 + .1; x + 1.1 < x2 + .05; x += 1.1){ const b = cylM(.025, Math.hypot(1.1, top), pipe, x + .55, top / 2, pz1 + .04, 6); b.rotation.z = Math.atan2(1.1, top); g.add(b); } }
    // korkuluk (arka)
    const rail = stdM({ color:'#3a3f46', metalness:.6, roughness:.4 }); { const r = cylM(.025, w, rail, (x1 + x2) / 2, top + 1.0, pz0 + .08, 8); r.rotation.z = Math.PI / 2; g.add(r); } for (let x = x1 + .05; x <= x2; x += .5) g.add(cylM(.018, 1.0, rail, x, top + .5, pz0 + .08, 6));
    if (p.ladder !== false){ const lx = ladX(p) / 100, lz = ladZ(L, p) / 100, wood = stdM({ color:style === 'scaffold' ? '#a0662a' : '#6a7078', metalness:style === 'scaffold' ? 0 : .5, roughness:.6 });
      for (const dz of [-.22, .22]) g.add(cylM(.025, top + .9, wood, lx - .08, (top + .9) / 2, lz + dz, 8)); for (let y = .25; y < top + .8; y += .28){ const r = cylM(.018, .44, wood, lx - .08, y, lz, 6); r.rotation.x = Math.PI / 2; g.add(r); } } }
  /* geçit (arka duvarda kapı / cam / merdiven, yerde kapak) */
  if (def.gate){ const gx = (def.gate.x != null ? def.gate.x : (def.width || W) - 110) / 100, kindG = def.gate.kind, wz = z0 + .01, G = { kind:kindG, x:gx };
    if (kindG === 'door'){ g.add(boxM(1.5, 2.55, .12, stdM({ color:'#2a2d33', metalness:.4 }), gx, 1.27, wz + .02)); const glow = dynM(plane(1.1, 2.25, emis('#fff2c8', 2.2), gx, 1.12, wz + .03)); g.add(glow); G.glow = glow;
      const piv = new T.Group(); piv.position.set(gx - .55, 0, wz + .06); const leaf = boxM(1.1, 2.25, .06, stdM({ color:'#6b4a2b', roughness:.7 }), .55, 1.12, 0); piv.add(leaf); piv.add(boxM(.05, .05, .08, stdM({ color:'#e8c547', metalness:.8 }), .98, 1.05, .04)); g.add(piv); G.leaf = piv;
      const sg = plane(.7, .26, new T.MeshBasicMaterial({ map:signTex('ÇIKIŞ', '#1f9d55', '#ffffff'), toneMapped:false }), gx, 2.75, wz + .03); g.add(sg); }
    else if (kindG === 'window'){ g.add(boxM(1.7, 2.1, .14, stdM({ color:'#3a3f48', metalness:.5 }), gx, 1.85, wz + .03));
      const crack = aTex('crack', 256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2; for (let i = 0; i < 14; i++){ const a = i * .45; c.beginPath(); c.moveTo(w * .55, h * .45); let x = w * .55, y = h * .45; for (let k = 0; k < 5; k++){ x += Math.cos(a + (Math.random() - .5) * .5) * 26; y += Math.sin(a + (Math.random() - .5) * .5) * 26; c.lineTo(x, y); } c.stroke(); } });
      const glass = plane(1.45, 1.85, new T.MeshStandardMaterial({ color:'#a8d8ff', transparent:true, opacity:.45, roughness:.05, metalness:.3 }), gx, 1.85, wz + .1); g.add(glass); G.glass = glass;
      const cr = plane(1.45, 1.85, new T.MeshBasicMaterial({ map:crack, transparent:true, opacity:0, depthWrite:false }), gx, 1.85, wz + .11); g.add(cr); G.crack = cr;
      const night = plane(1.45, 1.85, emis('#0b1530', .3), gx, 1.85, wz + .05); g.add(night); }
    else if (kindG === 'ladder'){ const st = stdM({ color:'#8a929c', metalness:.7, roughness:.35 }); for (const dz of [-.25, .25]) g.add(cylM(.03, 8, st, gx + dz, 4, wz + .2, 8)); for (let y = .3; y < 8; y += .3){ const r = cylM(.02, .5, st, gx, y, wz + .2, 6); r.rotation.z = Math.PI / 2; g.add(r); }
      const lg = plane(1.4, 3, new T.MeshBasicMaterial({ color:'#fff2c0', transparent:true, opacity:.25, depthWrite:false, toneMapped:false }), gx, 5.5, wz + .3); g.add(lg); G.glow = lg; }
    else if (kindG === 'hatch'){ const hole = new T.Mesh(new T.CircleGeometry(.62, 32), new T.MeshBasicMaterial({ color:'#050505' })); hole.rotation.x = -Math.PI / 2; hole.position.set(gx, .012, 0); g.add(hole);
      const piv = new T.Group(); piv.position.set(gx + .62, .02, 0); const lid = cylM(.62, .05, stdM({ color:'#5d646c', metalness:.7, roughness:.4 }), -.62, 0, 0, 24); piv.add(lid); g.add(piv); G.leaf = piv;
      const ring = new T.Mesh(new T.RingGeometry(.64, .78, 32), new T.MeshBasicMaterial({ color:'#f2c230', transparent:true, opacity:.6, toneMapped:false })); ring.rotation.x = -Math.PI / 2; ring.position.set(gx, .015, 0); g.add(ring); G.ring = ring; }
    U.gate = G; }
  /* dalga sırasında alanı kapatan bariyerler */
  { const mk = () => { const m = new T.Mesh(new T.PlaneGeometry((z1 - z0), 2.6), new T.MeshBasicMaterial({ map:aTex('bar', 256, 64, (c, w, h) => { const gg = c.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, 'rgba(255,60,60,0)'); gg.addColorStop(1, 'rgba(255,60,60,.65)'); c.fillStyle = gg; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,220,220,.8)'; for (let x = 0; x < w; x += 24) c.fillRect(x, h - 6, 12, 6); }, 4, 1), transparent:true, depthWrite:false, side:T.DoubleSide, toneMapped:false })); m.rotation.y = Math.PI / 2; m.position.set(0, 1.3, (z0 + z1) / 2); m.visible = false; m.userData.keep = 1; g.add(m); return m; };
    U.bars = [mk(), mk()]; }
  /* nokta ışıkları (en yakın lambalara taşınır) */
  U.pl = []; for (let i = 0; i < 3; i++){ const pl = new T.PointLight('#ffffff', 0, 9, 1.6); pl.castShadow = false; g.add(pl); U.pl.push(pl); }
  /* hava: kar / yağmur */
  if (A.snow || A.rain){ const n = A.rain ? 1800 : 1400, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++){ pos[i * 3] = Math.random() * 24 - 12; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = Math.random() * 24 - 12; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pm = new T.PointsMaterial({ color:A.rain ? '#a8c4e8' : '#ffffff', size:A.rain ? .045 : .07, transparent:true, opacity:A.rain ? .55 : .9, depthWrite:false, sizeAttenuation:true });
    const pts = new T.Points(geo, pm); pts.frustumCulled = false; pts.userData.keep = 1; g.add(pts); U.weather = { pts, rain:!!A.rain, n }; }
  /* gökyüzü / arka plan */
  U.bg = sky === 'dusk' ? aTex('skyDusk', 16, 256, (c, w, h) => { const gg = c.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, '#0e1530'); gg.addColorStop(.5, '#3a3a6a'); gg.addColorStop(.8, '#c86a4a'); gg.addColorStop(1, '#f2b07a'); c.fillStyle = gg; c.fillRect(0, 0, w, h); })
       : sky === 'night' ? new T.Color('#0a0e18') : sky === 'stad' ? null : new T.Color(fog ? fog[0] : '#202020');
  U.fogA = fog; U.light = light; U.post = post;
  g.traverse(o => { if (o.isMesh && !o.userData.keep){ o.receiveShadow = true; } });
  R3.compact(g); for (const o of g.children) if (o.isMesh && !o.userData.keep && !o.userData.dyn && !o.material.transparent){ o.receiveShadow = true; if (!o.castShadow && o.geometry && !o.geometry.parameters) o.castShadow = true; }
  return g;
}
/* her kare: ışık, sis, arka plan */
function arenaLight(L, U, Wd){
  const { T, scene, sun, hemi, fill } = Wd, p = L.p, li = U.light;
  if (U.stad && typeof f3Begin === 'function'){ /* stat: futbol ışıkları */ }
  if (U.bg && U.bg.isTexture){ scene.background = U.bg; } else scene.background = U.bg || new T.Color('#0a0e18');
  if (U.fogA){ if (!U.fog) U.fog = new T.Fog(U.fogA[0], U.fogA[1], U.fogA[2]); scene.fog = U.fog; } else scene.fog = null;
  hemi.color.set(li.hemi[0]); hemi.groundColor.set(li.hemi[1]); hemi.intensity = li.hemi[2]; sun.color.set(li.sun[0]); sun.intensity = li.sun[1]; fill.intensity = li.fill;
  const cx = X3(p.x), cz = Z3(p.z), d = li.sunDir; sun.position.set(cx + d[0] * 12, d[1] * 12, cz + d[2] * 12); sun.target.position.set(cx, 0, cz); sun.target.updateMatrixWorld(); R3.shadowBox(9, 9, 40);
  fill.position.set(cx - 6, 4, cz + 8);
  // en yakın 3 lamba → nokta ışık
  const C = L.c3 && L.c3.look ? L.c3.look : [cx, 1, cz];
  const ls = U.lamps.map(l => [Math.hypot(l[0] - C[0], l[2] - C[2]), l]).sort((a, b) => a[0] - b[0]);
  U.pl.forEach((pl, i) => { const l = ls[i] && ls[i][1]; if (!l){ pl.intensity = 0; return; } pl.position.set(l[0], l[1], l[2]); pl.color.set(l[3]); pl.distance = l[4] * 1.3; pl.intensity = (U.night ? 9 : 5) * (1 - Math.min(.6, ls[i][0] / 30)); });
}
function arenaTick(L, U, dt){
  const t = gameTime, cam = R3.world().cam, inside = L.c3 && L.c3.mode === 'arka';
  for (const m of U.front) m.visible = inside;
  for (const m of U.ceil) m.visible = !(L.c3 && L.c3.mode === 'tepe');
  for (const m of U.flick) if (m.material && m.material.emissive) m.material.emissiveIntensity = 1.6 + (Math.sin(t * 23 + m.position.x) > .85 ? -1.2 : 0) + Math.sin(t * 7 + m.position.x) * .3;
  for (const b of U.alarm){ const on = L.st.alarm ? (Math.sin(t * 6 + b.position.x) > 0) : false; b.material.emissiveIntensity = on ? 3 : .2; }
  // bariyerler
  if (U.bars){ const on = L.active && !L.done; U.bars[0].visible = on && L.lockL > 0; U.bars[1].visible = on && L.lockR < (L.def.width || W);
    U.bars[0].position.x = X3(L.lockL) + .05; U.bars[1].position.x = X3(L.lockR) - .05; for (const b of U.bars) b.material.opacity = .55 + .25 * Math.sin(t * 5); }
  // geçit durumu
  const G = U.gate, LG = L.gate; if (G){ const st = LG ? LG.st : 'closed', open = LG ? LG.open || 0 : 0;
    if (G.kind === 'door'){ G.leaf.rotation.y = -open * 1.6; G.glow.material.emissiveIntensity = .4 + open * 2.4; }
    if (G.kind === 'window'){ const hits = LG ? LG.hits : 0; G.crack.material.opacity = hits > 0 ? .9 : 0; G.glass.visible = st !== 'go'; G.crack.visible = st !== 'go'; }
    if (G.kind === 'ladder' && G.glow) G.glow.material.opacity = (LG && st === 'wait') ? .25 + .15 * Math.sin(t * 4) : .12;
    if (G.kind === 'hatch'){ G.leaf.rotation.z = st === 'go' ? Math.min(1.9, (LG.t || 0) * 5) : 0; G.ring.material.opacity = LG && st === 'wait' ? .4 + .35 * Math.sin(t * 5) : .2; } }
  // hava
  if (U.weather){ const W2 = U.weather, a = W2.pts.geometry.attributes.position, arr = a.array, cx = cam.position.x, cz = cam.position.z, fall = (W2.rain ? 9 : 1.2) * dt;
    for (let i = 0; i < W2.n; i++){ let y = arr[i * 3 + 1] - fall * (W2.rain ? 1 : .7 + (i % 5) * .12); if (!W2.rain) arr[i * 3] += Math.sin(t * .8 + i) * dt * .25; if (y < 0) y += 12; arr[i * 3 + 1] = y; }
    W2.pts.position.set(Math.round(cx / 24) * 24, 0, Math.round(cz / 24) * 24); for (let i = 0; i < W2.n; i++){ const k = i * 3; let x = arr[k] + W2.pts.position.x; if (x < cx - 12) arr[k] += 24; else if (x > cx + 12) arr[k] -= 24; let z = arr[k + 2] + W2.pts.position.z; if (z < cz - 12) arr[k + 2] += 24; else if (z > cz + 12) arr[k + 2] -= 24; }
    a.needsUpdate = true; }
}
