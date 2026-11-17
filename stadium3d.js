'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   stadium3d.js
   UON PMAC stadyumu: kase şeklinde iki katlı tribün (basamaklı), 3B seyirci (tek çizimde ~20 bin kişi,
   oturan / ayağa kalkan / kollarını kaldıran / zıplayan, Meksika dalgası), çatı + ışık şeridi, LED kuşak,
   dev ekranlar, yedek kulübeleri, fotoğrafçılar, köşe bayrakları, tünel. Hepsi kodla çizilir (indirme yok).
   ========================================================= */
const STAD = { AX:60.5, AZ:41, RC:11 };
const LOWEND = (navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

/* yuvarlatılmış dikdörtgen (sahayı çevreleyen) — d kadar dışa kaydırılmış nokta */
function stadRing(seg){
  const { AX, AZ, RC } = STAD, sx = AX - RC, sz = AZ - RC, out = [];
  const corner = (cx, cz, a0, a1) => { for (let k = 0; k <= seg; k++){ const a = a0 + (a1 - a0) * k / seg; out.push({ cx, cz, nx:Math.cos(a), nz:Math.sin(a) }); } };
  corner(sx, sz, Math.PI / 2, 0); corner(sx, -sz, 0, -Math.PI / 2); corner(-sx, -sz, -Math.PI / 2, -Math.PI); corner(-sx, sz, -Math.PI, -Math.PI * 1.5);
  return out;
}
const ringPt = (s, d) => ({ x:s.cx + s.nx * (STAD.RC + d), z:s.cz + s.nz * (STAD.RC + d) });
/* d mesafesinde çevre boyunca eşit aralıklı noktalar (koltuklar için) */
function ringWalk(d, step, cb){
  const R = stadRing(24), P = R.map(s => Object.assign(ringPt(s, d), { nx:s.nx, nz:s.nz }));
  let acc = step / 2;
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b.x - a.x, b.z - a.z); if (L < 1e-4) continue;
    while (acc <= L){ const k = acc / L; const nx = a.nx + (b.nx - a.nx) * k, nz = a.nz + (b.nz - a.nz) * k, n = Math.hypot(nx, nz) || 1; cb(a.x + (b.x - a.x) * k, a.z + (b.z - a.z) * k, nx / n, nz / n); acc += step; }
    acc -= L;
  }
}

/* ---------- basamaklı tribün geometrisi (köşe renkli) ---------- */
function stadTier(T, o){
  const R = stadRing(9), pos = [], col = [], c1 = new T.Color(), c2 = new T.Color(), c3 = new T.Color();
  const quad = (a, b, c, d, cc) => { for (const p of [a, b, c, a, c, d]){ pos.push(p[0], p[1], p[2]); col.push(cc.r, cc.g, cc.b); } };
  for (let i = 0; i < R.length; i++){
    const A = R[i], B = R[(i + 1) % R.length];
    for (let r = 0; r < o.rows; r++){
      const d0 = o.d0 + r * o.rd, d1 = d0 + o.rd, h0 = o.h0 + r * o.rr, h1 = h0 + o.rr;
      const a0 = ringPt(A, d0), b0 = ringPt(B, d0), a1 = ringPt(A, d1), b1 = ringPt(B, d1);
      const seat = o.seatCol(r, i); c1.set(seat); c2.set(o.riser); c3.copy(c2).multiplyScalar(.75);
      quad([a0.x, h0, a0.z], [b0.x, h0, b0.z], [b1.x, h0, b1.z], [a1.x, h0, a1.z], c1);                 // basamak (koltuk sırası)
      quad([a1.x, h0, a1.z], [b1.x, h0, b1.z], [b1.x, h1, b1.z], [a1.x, h1, a1.z], c2);                 // yükselti
    }
    // ön duvar
    const f0 = ringPt(A, o.d0), f1 = ringPt(B, o.d0); c3.set(o.front); quad([f0.x, o.frontY, f0.z], [f1.x, o.frontY, f1.z], [f1.x, o.h0, f1.z], [f0.x, o.h0, f0.z], c3);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  return new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors:true, roughness:.85, metalness:.05, side:T.DoubleSide }));
}
/* çevre boyunca dikey şerit (LED kuşak, duvar) — u = yay uzunluğu */
function stadBand(T, d, y0, y1, m, uScale){
  const R = stadRing(12), pos = [], uv = [], idx = []; let s = 0;
  R.forEach((A, i) => { const p = ringPt(A, d); if (i){ const q = ringPt(R[i - 1], d); s += Math.hypot(p.x - q.x, p.z - q.z); } pos.push(p.x, y0, p.z, p.x, y1, p.z); uv.push(s / uScale, 0, s / uScale, 1); });
  const n = R.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; idx.push(i * 2, j * 2, j * 2 + 1, i * 2, j * 2 + 1, i * 2 + 1); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return new T.Mesh(g, m);
}
/* yatay halka (çatı, konkor) */
function stadFlat(T, dIn, dOut, yIn, yOut, m){
  const R = stadRing(12), pos = [], idx = [];
  R.forEach(A => { const a = ringPt(A, dIn), b = ringPt(A, dOut); pos.push(a.x, yIn, a.z, b.x, yOut, b.z); });
  const n = R.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; idx.push(i * 2, j * 2, j * 2 + 1, i * 2, j * 2 + 1, i * 2 + 1); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new T.Mesh(g, m);
}

/* ---------- seyirci atlası: 16 farklı kişi × 4 duruş (oturan, ayakta, kollar havada, alkış/atkı) ---------- */
function crowdAtlas(R3w, mask){
  const tx = R3w.canvasTex(2048, 1024, (c0, w, h) => {
    c0.clearRect(0, 0, w, h); c0.scale(2, 2);
    // maske modunda forma beyaz, geri kalan her şey siyah çizilir (uzakta da forma rengi doğru karışsın)
    const c = mask ? new Proxy(c0, { set(o, k, v){ if (k === 'fillStyle' || k === 'strokeStyle') v = typeof v === 'string' && v.startsWith('rgb(') && v.endsWith(',0,255)') ? '#ffffff' : typeof v === 'string' ? '#000000' : '#ffffff'; o[k] = v; return true; }, get(o, k){ const v = o[k]; return typeof v === 'function' ? v.bind(o) : v; } }) : c0;
    const skins = ['#f1c9a5', '#e0ac85', '#c48d68', '#8d5a3c', '#5a3a26', '#f5d3b5', '#d9a27c', '#a87150'];
    const hairs = ['#111111', '#3a2414', '#6b4a2b', '#c9a35a', '#2a1a10', '#888888', '#111111', '#4a2a10'];
    const pants = ['#1c2333', '#2c3e50', '#3b3b3b', '#1a1a1a', '#34495e', '#2d3436'];
    const SH = (sh) => mask ? 'rgb(' + Math.round(255 * sh) + ',0,255)' : 'rgb(' + Math.round(200 * sh) + ',' + Math.round(200 * sh) + ',' + Math.round(200 * sh) + ')';   // forma: gri tonlu gölge (renk shader'da)
    for (let v = 0; v < 16; v++) for (let p = 0; p < 4; p++){
      const ox = v * 64, oy = p * 128, sk = skins[v % 8], hr = hairs[(v * 3) % 8], pn = pants[v % 6], hat = v % 7 === 3, scarf = v % 4 === 1, kid = v === 9 || v === 14;
      c.save(); c.translate(ox + 32, oy); const S = kid ? .8 : 1;
      const base = p === 0 ? 120 : 126, top = p === 0 ? 40 : 18;                   // oturan daha alçak
      c.scale(S, 1); const yy = y => base - (base - y) * (kid ? .8 : 1);
      // bacaklar / şort
      if (p > 0){ c.fillStyle = pn; c.fillRect(-11, yy(80), 9, base - yy(80)); c.fillRect(2, yy(80), 9, base - yy(80)); }
      else { c.fillStyle = pn; c.fillRect(-12, yy(98), 24, 12); }
      // gövde (forma)
      const by = p === 0 ? yy(64) : yy(44), bh = p === 0 ? 38 : 40;
      const g = c0.createLinearGradient(-14, 0, 14, 0); g.addColorStop(0, SH(.62)); g.addColorStop(.5, SH(1)); g.addColorStop(1, SH(.7)); c.fillStyle = g;
      c.beginPath(); c.moveTo(-14, by + 4); c.quadraticCurveTo(0, by - 3, 14, by + 4); c.lineTo(13, by + bh); c.lineTo(-13, by + bh); c.closePath(); c.fill();
      // kollar
      c.lineCap = 'round'; c.lineWidth = 7;
      const arm = (x0, y0, x1, y1, x2, y2) => { c.strokeStyle = SH(.8); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = sk; c.lineWidth = 6; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.lineWidth = 7; };
      if (p === 0){ arm(-13, by + 6, -15, by + 22, -6, by + 34); arm(13, by + 6, 15, by + 22, 6, by + 34); }
      else if (p === 1){ arm(-13, by + 6, -16, by + 24, -15, by + 40); arm(13, by + 6, 16, by + 24, 15, by + 40); }
      else if (p === 2){ arm(-13, by + 6, -20, by - 10, -22, by - 28); arm(13, by + 6, 20, by - 10, 22, by - 28); c.fillStyle = sk; c.beginPath(); c.arc(-22, by - 30, 4, 0, 7); c.arc(22, by - 30, 4, 0, 7); c.fill(); }
      else { arm(-13, by + 6, -20, by - 6, -12, by - 22); arm(13, by + 6, 18, by + 10, 4, by + 4);
        if (scarf || v % 3 === 0){ c.fillStyle = SH(1); c.fillRect(-26, by - 40, 22, 7); c.fillStyle = '#f4f4f4'; c.fillRect(-26, by - 33, 22, 3); } }
      // atkı
      if (scarf && p !== 3){ c.fillStyle = SH(.95); c.fillRect(-10, by - 1, 20, 6); c.fillRect(4, by + 4, 6, 16); c.fillStyle = '#f4f4f4'; c.fillRect(4, by + 12, 6, 3); }
      // baş
      const hy = by - 12; c.fillStyle = sk; c.beginPath(); c.ellipse(0, hy, 10, 12, 0, 0, 7); c.fill();
      c.fillStyle = sk; c.fillRect(-4, hy + 8, 8, 7);
      if (hat){ c.fillStyle = SH(1); c.beginPath(); c.ellipse(0, hy - 6, 11, 8, 0, Math.PI, 0); c.fill(); c.fillRect(-11, hy - 6, 22, 3); }
      else if (v % 5 !== 4){ c.fillStyle = hr; c.beginPath(); c.ellipse(0, hy - 5, 10.5, 8, 0, Math.PI * .95, Math.PI * 2.05); c.fill(); if (v % 6 === 2){ c.fillRect(-10, hy - 5, 4, 16); c.fillRect(6, hy - 5, 4, 16); } }
      c.fillStyle = 'rgba(40,20,10,.55)'; c.fillRect(-5, hy - 1, 3, 2); c.fillRect(2, hy - 1, 3, 2);
      if (p >= 2){ c.fillStyle = '#3a1010'; c.beginPath(); c.ellipse(0, hy + 6, 3, 2.6, 0, 0, 7); c.fill(); }
      c.restore(); void top;
    }
  });
  tx.anisotropy = 8; return tx;
}
const CROWD_VS = `
attribute vec4 aInfo; attribute vec3 aShirt; attribute vec2 aAng;
uniform float uTime, uExcite, uCheerH, uCheerA, uWave;
uniform vec3 uHA, uHB, uAA, uAB;
varying vec2 vUv; varying vec3 vShirt; varying float vBright; varying float vFogD;
float h1(float n){ return fract(sin(n * 91.345) * 43758.5453); }
void main(){
  float ph = aInfo.x, idx = aInfo.z;
  float home = step(.5, idx) * step(idx, 2.5), away = step(2.5, idx);
  float cheer = home > .5 ? uCheerH : away > .5 ? uCheerA : uCheerH * .55;
  float t = uTime + ph * 17.0;
  float stand = max(step(h1(ph * 7.3), uExcite), aAng.y);
  float pose = stand;
  if (stand > .5 && h1(ph * 3.1) < .4) pose = fract(t * .3) < .45 ? 3.0 : 1.0;
  if (cheer > .05) pose = fract(t * .8) < .62 ? 2.0 : 3.0;
  float wd = abs(mod(aAng.x - uWave + 3.14159, 6.28318) - 3.14159);
  float wv = uWave > -9.0 ? smoothstep(.42, 0.0, wd) : 0.0;
  if (wv > .25) pose = 2.0;
  float jump = cheer * max(0.0, sin(t * 7.5)) * .32 + wv * .4 + stand * max(0.0, sin(t * 2.4)) * .025 * (1.0 - cheer);
  vec3 p = position; p.y += jump;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vUv = (vec2(aInfo.y, 3.0 - pose) + uv) / vec2(16.0, 4.0);
  vShirt = idx < .5 ? aShirt : idx < 1.5 ? uHA : idx < 2.5 ? uHB : idx < 3.5 ? uAA : uAB;
  vBright = aInfo.w; vFogD = -mv.z;
}`;
const CROWD_FS = `
uniform sampler2D uMap, uMask; uniform vec3 uFogC; uniform float uFogN, uFogF;
varying vec2 vUv; varying vec3 vShirt; varying float vBright; varying float vFogD;
void main(){
  vec4 c = texture2D(uMap, vUv);
  if (c.a < .42) discard;
  vec4 mk = texture2D(uMask, vUv);
  vec3 cc = c.rgb / max(c.a, .001);
  float sh = clamp(mk.r / max(mk.a, .001), 0.0, 1.0);
  vec3 col = mix(cc, vShirt * (.3 + .85 * cc.r), sh) * vBright;
  col = mix(col, uFogC, smoothstep(uFogN, uFogF, vFogD));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
function stadCrowd(T, R3w, U, tiers){
  const seats = [];
  const rnd = (() => { let s = 1234567; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  const NEUT = ['#2b2f3a', '#e9e9e9', '#5a6070', '#7a1f1f', '#1f3a7a', '#2f5f3a', '#c8a050', '#3a2a50', '#d35400', '#101010'];
  for (const tr of tiers){
    for (let r = 0; r < tr.rows; r++){
      const d = tr.d0 + r * tr.rd + tr.rd * .5, y = tr.h0 + r * tr.rr;
      let k = 0;
      ringWalk(d, tr.seatW, (x, z, nx, nz) => {
        k++;
        if (k % tr.aisle < 2) return;                                    // merdiven boşluğu
        if (tr.vom && r >= tr.vom[0] && r <= tr.vom[1] && k % 61 > 52) return;   // tünel ağızları
        const ang = Math.atan2(z, x);
        const awaySec = tr.upper && x > 30 && z < -8;
        const ultras = !tr.upper && x > STAD.AX - 2 && Math.abs(z) < 26;
        if (rnd() > (ultras || awaySec ? .97 : tr.fill) * (LOWEND ? .55 : 1)) return;
        const team = awaySec ? (rnd() < .7 ? 3 : 4) : rnd() < (ultras ? .92 : .62) ? (rnd() < .68 ? 1 : 2) : 0;
        const nc = new T.Color(NEUT[Math.floor(rnd() * NEUT.length)]);
        seats.push({ x:x + (rnd() - .5) * .08, y, z:z + (rnd() - .5) * .08, yaw:Math.atan2(-nx, -nz), info:[rnd(), Math.floor(rnd() * 16), team, tr.bright * (.82 + rnd() * .22)], shirt:nc, ang:[ang, ultras ? 1 : 0] });
      });
    }
  }
  return crowdMesh(T, R3w, U, seats);
}
function crowdMesh(T, R3w, U, seats, fog){
  const n = seats.length, geo = new T.PlaneGeometry(.66, 1.32); geo.translate(0, .66 - .08, 0);
  const iInfo = new Float32Array(n * 4), iShirt = new Float32Array(n * 3), iAng = new Float32Array(n * 2);
  const mat = new T.ShaderMaterial({ vertexShader:CROWD_VS, fragmentShader:CROWD_FS, toneMapped:true,
    uniforms:{ uMap:{ value:crowdAtlas(R3w) }, uMask:{ value:crowdAtlas(R3w, true) }, uTime:{ value:0 }, uExcite:{ value:.25 }, uCheerH:{ value:0 }, uCheerA:{ value:0 }, uWave:{ value:-99 },
      uHA:{ value:new T.Color('#14306b') }, uHB:{ value:new T.Color('#f2c230') }, uAA:{ value:new T.Color('#c0392b') }, uAB:{ value:new T.Color('#ffffff') },
      uFogC:{ value:new T.Color(fog ? fog[0] : '#0b1430') }, uFogN:{ value:fog ? fog[1] : 110 }, uFogF:{ value:fog ? fog[2] : 260 } } });
  const im = new T.InstancedMesh(geo, mat, n), M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), S = new T.Vector3(1, 1, 1), P = new T.Vector3();
  seats.forEach((s, i) => { E.set(0, s.yaw, 0); Q.setFromEuler(E); P.set(s.x, s.y, s.z); M4.compose(P, Q, S); im.setMatrixAt(i, M4);
    iInfo.set(s.info, i * 4); iShirt.set([s.shirt.r, s.shirt.g, s.shirt.b], i * 3); iAng.set(s.ang, i * 2); });
  geo.setAttribute('aInfo', new T.InstancedBufferAttribute(iInfo, 4)); geo.setAttribute('aShirt', new T.InstancedBufferAttribute(iShirt, 3)); geo.setAttribute('aAng', new T.InstancedBufferAttribute(iAng, 2));
  im.frustumCulled = false; im.userData.keep = 1;
  U.crowdMat = mat; U.crowdN = n;
  return im;
}

/* ---------- basit alçak poligon insan (kulübe, fotoğrafçı) ---------- */
function lowMan(T, R3w, x, y, z, yaw, shirt, o = {}){
  const { mesh, mat } = R3w, g = new T.Group(), sk = mat(o.skin || '#d9a27c'), sh = mat(shirt), pn = mat(o.pants || '#1c2333');
  if (o.sit){ g.add(mesh('box', pn, .42, .16, .34, .12, .46, 0)); g.add(mesh('box', pn, .14, .46, .32, .32, .23, 0)); g.add(mesh('box', sh, .26, .5, .4, -.04, .78, 0)); g.add(mesh('sph', sk, .11, .13, .11, -.02, 1.15, 0)); }
  else if (o.crouch){ g.add(mesh('box', pn, .4, .3, .34, 0, .2, 0)); g.add(mesh('box', sh, .3, .46, .4, .06, .58, 0)); g.add(mesh('sph', sk, .11, .13, .11, .1, .92, 0));
    g.add(mesh('box', mat('#151515', { roughness:.3, metalness:.4 }), .2, .14, .14, .28, .9, 0)); g.add(mesh('cyl', mat('#0a0a0a', { roughness:.2, metalness:.5 }), .055, .38, .055, .52, .9, 0).rotateZ(Math.PI / 2)); }
  else { g.add(mesh('box', pn, .26, .82, .34, 0, .41, 0)); g.add(mesh('box', sh, .28, .56, .44, 0, 1.1, 0)); g.add(mesh('sph', sk, .11, .13, .11, 0, 1.5, 0)); }
  g.position.set(x, y, z); g.rotation.y = yaw; return g;
}

/* ---------- stadyumu kur ---------- */
function buildStadium(root, U, R3w){
  const { T, mat, mesh, canvasTex } = R3w;
  const { AX, AZ } = STAD;
  const LOW = { d0:0, rows:22, rd:.86, rr:.44, h0:1.25, frontY:0, seatW:.62, fill:.86, bright:.95, aisle:44, vom:[9, 13] };
  const UP = { d0:22.6, rows:19, rd:.82, rr:.56, h0:14.2, frontY:11.8, seatW:.66, fill:.8, bright:.82, aisle:46, upper:true };
  const seatC = (r, i, up) => { const sec = Math.floor(i / 4) % 2; return up ? (sec ? '#1a2a52' : '#203465') : (r % 2 ? '#183064' : '#1c376f'); };
  root.add(stadTier(T, Object.assign({}, LOW, { seatCol:(r, i) => seatC(r, i, 0), riser:'#3c4250', front:'#20242e' })));
  root.add(stadTier(T, Object.assign({}, UP, { seatCol:(r, i) => seatC(r, i, 1), riser:'#363b48', front:'#1b1f28' })));
  const lowTop = LOW.h0 + LOW.rows * LOW.rr, lowBack = LOW.d0 + LOW.rows * LOW.rd, upTop = UP.h0 + UP.rows * UP.rr, upBack = UP.d0 + UP.rows * UP.rd;
  /* konkor (iki kat arası) + arka duvarlar */
  const conc = mat('#262b36', { roughness:.9 }), wall = mat('#1c2029', { roughness:.9 }), steel = mat('#5b6472', { metalness:.55, roughness:.4 });
  root.add(stadFlat(T, lowBack, UP.d0, lowTop, lowTop, conc));
  root.add(stadBand(T, lowBack + .2, lowTop, UP.frontY, mat('#14171f', { emissive:new T.Color('#2a2410'), emissiveIntensity:.35 }), 8));
  root.add(stadBand(T, upBack, upTop, upTop + 4.5, wall, 10));
  /* LED kuşak (üst kat önü) */
  const ledTex = canvasTex(2048, 64, (c, w, h) => { const S = [['ARAÇ', '#14306b', '#f2c230'], ['SON ŞAMPİYON', '#b3122e', '#ffffff'], ['ANOLECRAB', '#f2c230', '#14306b'], ['UON PMAC', '#101418', '#2ecc71'], ['USTA', '#ffffff', '#14306b'], ['ARAÇ STÜDYO', '#1d1d1d', '#ff6a00'], ['GOOOL!', '#2e86de', '#ffffff'], ['FUTBOL AİLEMİZ', '#0e5a2c', '#ffffff']];
    S.forEach(([t, bg, fg], i) => { c.fillStyle = bg; c.fillRect(i * 256, 0, 256, h); c.fillStyle = fg; c.font = 'italic 900 34px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, i * 256 + 128, h / 2 + 2, 236); }); });
  ledTex.wrapS = T.RepeatWrapping; U.ads.push(ledTex);
  root.add(stadBand(T, UP.d0 - .05, UP.frontY, UP.h0 - .3, new T.MeshStandardMaterial({ map:ledTex, emissiveMap:ledTex, emissive:new T.Color('#ffffff'), emissiveIntensity:1.1, roughness:.5 }), 38));
  /* korkuluklar */
  for (const [d, y] of [[LOW.d0 - .05, LOW.h0 + .9], [UP.d0 - .05, UP.h0 + .85], [lowBack, lowTop + 1]]) root.add(stadBand(T, d, y - .06, y, steel, 10));
  /* çatı: arka kirişten sahaya doğru uzanan, ön kenarında ışık şeridi */
  const roofY = upTop + 6.5, roofIn = 7.5, roofOut = upBack + 1.5;
  const roofM = new T.MeshStandardMaterial({ color:'#3a404c', roughness:.55, metalness:.35, side:T.DoubleSide });
  root.add(stadFlat(T, roofIn, roofOut, roofY + 1.2, roofY - .6, roofM));
  root.add(stadBand(T, roofIn, roofY + .2, roofY + 1.2, mat('#232832', { metalness:.4 }), 10));
  root.add(stadBand(T, roofIn + .15, roofY - .25, roofY + .2, mat('#fff8e0', { emissive:new T.Color('#fff4d0'), emissiveIntensity:2.6 }), 10));
  /* çatı kirişleri + direkler */
  ringWalk(roofOut - 1, 14, (x, z, nx, nz) => {
    const a = new T.Vector3(x, upTop + 4.5, z), b = new T.Vector3(x - nx * (roofOut - roofIn - 1), roofY + .4, z - nz * (roofOut - roofIn - 1));
    const L = a.distanceTo(b), m = new T.Mesh(R3w.GEO.box, steel); m.scale.set(.35, .5, L); m.position.copy(a).add(b).multiplyScalar(.5); m.lookAt(b); root.add(m);
    const p = new T.Mesh(R3w.GEO.box, steel); p.scale.set(.5, roofY - upTop - 4, .5); p.position.set(x, (roofY + upTop + 4.5) / 2, z); root.add(p); });
  /* ışık parlaması (tek çizim: noktalar) */
  const glowTex = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,246,215,.8)'); g.addColorStop(.5, 'rgba(255,236,190,.18)'); g.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const gp = []; ringWalk(roofIn + .4, 7.5, (x, z) => gp.push(x, roofY - .1, z));
  const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.Float32BufferAttribute(gp, 3));
  const pts = new T.Points(pg, new T.PointsMaterial({ map:glowTex, size:9, sizeAttenuation:true, color:'#fff2cf', transparent:true, depthWrite:false, blending:T.AdditiveBlending, fog:false }));
  pts.userData.keep = 1; root.add(pts);
  /* seyirci */
  root.add(stadCrowd(T, R3w, U, [LOW, UP]));
  /* dev ekranlar (iki kale arkası, çatıdan asılı) */
  U.screens = [];
  for (const s of [1, -1]){
    const scr = document.createElement('canvas'); scr.width = 512; scr.height = 192; const st = new T.CanvasTexture(scr); st.colorSpace = T.SRGBColorSpace;
    const sm = new T.Mesh(new T.PlaneGeometry(20, 7.5), new T.MeshBasicMaterial({ map:st, toneMapped:false })); sm.position.set(s * (AX + 12), roofY - 5, 0); sm.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; root.add(sm);
    const fr = mesh('box', mat('#0d0f14'), .5, 8.3, 21, s * (AX + 12.3), roofY - 5, 0); root.add(fr);
    root.add(mesh('box', steel, .25, 5, .25, s * (AX + 12.3), roofY - .5, 6)); root.add(mesh('box', steel, .25, 5, .25, s * (AX + 12.3), roofY - .5, -6));
    U.screens.push({ c:scr.getContext('2d'), tex:st });
  }
  U.screen = { c:U.screens[0].c, tex:U.screens[0].tex, key:'', all:U.screens };
  /* dev ekranın yanında LED skor tabelası (mavi pano, beyaz LED rakamlar) */
  U.boards = [];
  for (const s of [1, -1]){
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const bt = new T.CanvasTexture(cv); bt.colorSpace = T.SRGBColorSpace;
    const z = s > 0 ? -16.2 : 16.2, bm = new T.Mesh(new T.PlaneGeometry(10, 5), new T.MeshBasicMaterial({ map:bt, toneMapped:false })); bm.position.set(s * (AX + 11.9), roofY - 5.6, z); bm.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; root.add(bm);
    root.add(mesh('box', mat('#0d0f14'), .4, 5.5, 10.6, s * (AX + 12.2), roofY - 5.6, z)); root.add(mesh('box', steel, .2, 4, .2, s * (AX + 12.2), roofY - 1.6, z + 3)); root.add(mesh('box', steel, .2, 4, .2, s * (AX + 12.2), roofY - 1.6, z - 3));
    U.boards.push({ c:cv.getContext('2d'), tex:bt });
  }
  /* yedek kulübeleri + teknik alan + dördüncü hakem masası + tünel */
  const glass = new T.MeshStandardMaterial({ color:'#9fc4ff', transparent:true, opacity:.28, roughness:.05, metalness:.2, side:T.DoubleSide });
  for (const s of [1, -1]){
    const x = s * 9, g = new T.Group();
    g.add(mesh('box', mat('#e8eaee', { roughness:.5 }), 7.2, .12, 1.8, 0, 2.2, 0));
    const gl = new T.Mesh(R3w.GEO.box, glass); gl.scale.set(7.2, 2.1, .05); gl.position.set(0, 1.1, -.9); g.add(gl);
    for (const e of [-3.6, 3.6]){ const sg = new T.Mesh(R3w.GEO.box, glass); sg.scale.set(.05, 2.1, 1.8); sg.position.set(e, 1.1, 0); g.add(sg); }
    for (let i = 0; i < 8; i++) g.add(mesh('box', mat(s > 0 ? '#c0392b' : '#14306b', { roughness:.4 }), .55, .5, .5, -3.1 + i * .88, .45, .55));
    for (let i = 0; i < 5; i++) g.add(lowMan(T, R3w, -2.6 + i * 1.3, 0, .4, -Math.PI / 2, s > 0 ? '#e9e9e9' : '#1d4fa8', { sit:true, skin:['#f1c9a5', '#8d5a3c', '#c48d68', '#e0ac85', '#5a3a26'][i] }));
    g.position.set(x, 0, AZ - 4.3); g.rotation.y = Math.PI; root.add(g);
    // teknik alan çizgileri (kesikli)
    const LM = mat('#f5f5f5', { roughness:.75 });
    for (let k = 0; k < 10; k++) root.add(mesh('box', LM, .6, .01, .1, x - 4.5 + k * 1, .012, 35));
    for (const e of [-4.8, 4.8]) for (let k = 0; k < 2; k++) root.add(mesh('box', LM, .1, .01, .6, x + e, .012, 35.4 + k * 1));
  }
  root.add(mesh('box', mat('#1d2230'), 2.2, .9, .8, 0, .45, AZ - 4)); root.add(mesh('box', mat('#f2c230', { emissive:new T.Color('#f2c230'), emissiveIntensity:.6 }), 2.2, .12, .8, 0, .96, AZ - 4));
  root.add(mesh('box', mat('#0a0c12'), 5, 3.2, 2, 0, 1.6, AZ - .4)); root.add(mesh('box', mat('#f2c230', { emissive:new T.Color('#f2c230'), emissiveIntensity:.4 }), 5.4, .35, 2.1, 0, 3.3, AZ - .4));
  /* fotoğrafçılar (kale arkaları) */
  for (const s of [1, -1]) for (let i = 0; i < 7; i++){ const z = (i < 3 ? -1 : 1) * (6 + (i % 3) * 3.2 + (i > 5 ? 3 : 0)); root.add(lowMan(T, R3w, s * (52.5 + 3.4), 0, z, s > 0 ? Math.PI : 0, i % 2 ? '#1f1f1f' : '#f2c230', { crouch:true, skin:['#f1c9a5', '#8d5a3c', '#c48d68'][i % 3] })); }
  /* köşe bayrakları */
  U.flags = [];
  for (const sx of [1, -1]) for (const sz of [1, -1]){
    root.add(mesh('cyl', mat('#f4f4f4'), .025, 1.5, .025, sx * 52.5, .75, sz * 34));
    const fg = new T.PlaneGeometry(.45, .32, 6, 1); fg.translate(.225, 0, 0);
    const fl = new T.Mesh(fg, new T.MeshStandardMaterial({ color:'#f2c230', side:T.DoubleSide, roughness:.6 })); fl.position.set(sx * 52.5, 1.32, sz * 34); fl.userData.keep = 1; root.add(fl);
    U.flags.push({ m:fl, base:fg.attributes.position.array.slice(), ph:Math.random() * 6 });
  }
  /* stadyum dışı: yükselen arka duvarlar ve şehir ışıkları ufukta (sis içinde) */
  root.add(stadBand(T, roofOut + 2, 0, roofY + 2, mat('#0b0f19', { roughness:1 }), 10));
}
/* her kare: seyirci zamanı/heyecanı, bayraklar */
function stadTick(U, G, dt){
  if (U.crowdMat){ const u = U.crowdMat.uniforms; u.uTime.value = G.t;
    const cheerT = G.cheer ? 1 : 0; U.cheer = (U.cheer || 0) + (cheerT - (U.cheer || 0)) * Math.min(1, dt * (cheerT ? 6 : 1.2)); u.uCheerH.value = U.cheer * (G.cheerSide === 1 ? .2 : 1); u.uCheerA.value = U.cheer * (G.cheerSide === 1 ? 1 : 0);
    const ex = G.excite != null ? G.excite : .22; u.uExcite.value += (ex - u.uExcite.value) * Math.min(1, dt * 2);
    U.waveT = (U.waveT || 0) - dt; if (U.waveT < -40 && !G.cheer && G.allowWave){ U.waveT = 14; U.waveA = Math.PI; }
    if (U.waveT > 0){ U.waveA -= dt * .55; u.uWave.value = U.waveA; } else u.uWave.value = -99;
    if (G.kitH){ u.uHA.value.set(G.kitH[0]); u.uHB.value.set(G.kitH[1]); } if (G.kitA){ u.uAA.value.set(G.kitA[0]); u.uAB.value.set(G.kitA[1]); } }
  if (U.flags) for (const f of U.flags){ const a = f.m.geometry.attributes.position, L = f.len || .45, A = f.amp || .06; for (let i = 0; i < a.count; i++){ const x = f.base[i * 3]; a.setZ(i, Math.sin(G.t * 6 + f.ph + x * 9 / L * .45) * A * x / L); } a.needsUpdate = true; }
  tesisTick(U, G, dt);
}

/* =========================================================
   ANOLECRAB ANTRENMAN TESİSİ (gündüz): orman (rüzgârda sallanan ağaçlar), tepeler, bulutlu gök,
   modern bina, bayraklar, yan saha, antrenman ekipmanı, küçük tribünde aileler
   ========================================================= */
function treeMats(T, U){
  const sway = m => { m.onBeforeCompile = sh => { sh.uniforms.uTime = U.treeTime; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace('#include <begin_vertex>', `#include <begin_vertex>
    #ifdef USE_INSTANCING
      float ph = instanceMatrix[3].x * .13 + instanceMatrix[3].z * .17; float hk = max(0.0, position.y);
      float sw = sin(uTime * 1.5 + ph) * .035 + sin(uTime * 3.3 + ph * 2.1) * .012;
      transformed.x += sw * hk * hk; transformed.z += sw * .6 * hk * hk;
    #endif`); }; m.customProgramCacheKey = () => 'treeSway'; return m; };
  return { leaf:sway(new T.MeshStandardMaterial({ color:'#ffffff', roughness:.85, flatShading:true })), trunk:new T.MeshStandardMaterial({ color:'#6b4a2b', roughness:.95 }) };
}
function forest(root, T, U, list){
  U.treeTime = U.treeTime || { value:0 };
  const M = treeMats(T, U);
  const pine = (() => { const parts = []; for (let k = 0; k < 4; k++){ const g = new T.ConeGeometry(.42 - k * .08, .42, 9); g.translate(0, .3 + k * .2, 0); parts.push(g); } return mergeG(T, parts); })();
  const oak = (() => { const parts = []; for (const [x, y, z, r] of [[0, .62, 0, .36], [.18, .54, .08, .26], [-.16, .56, -.1, .27], [.04, .8, -.04, .25], [-.06, .5, .2, .22]]){ const g = new T.IcosahedronGeometry(r, 1); g.translate(x, y, z); parts.push(g); } return mergeG(T, parts); })();
  const trunkG = new T.CylinderGeometry(.035, .055, .5, 7); trunkG.translate(0, .25, 0);
  const kinds = [[pine, list.filter(t => t.k === 0)], [oak, list.filter(t => t.k === 1)]];
  const M4 = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), E = new T.Euler(), C = new T.Color();
  const tr = new T.InstancedMesh(trunkG, M.trunk, list.length); let ti = 0;
  for (const [geo, L] of kinds){
    const im = new T.InstancedMesh(geo, M.leaf, L.length);
    L.forEach((t, i) => { E.set(0, t.r, 0); Q.setFromEuler(E); S.set(t.s * (t.k ? 1.15 : 1), t.s, t.s * (t.k ? 1.15 : 1)); P.set(t.x, 0, t.z); M4.compose(P, Q, S); im.setMatrixAt(i, M4); tr.setMatrixAt(ti++, M4);
      C.set(t.c); im.setColorAt(i, C); });
    im.userData.keep = 1; im.castShadow = false; im.frustumCulled = false; root.add(im);
  }
  tr.userData.keep = 1; tr.frustumCulled = false; root.add(tr);
}
function mergeG(T, parts){
  let vc = 0; const geos = parts.map(g => g.index ? g.toNonIndexed() : g); for (const g of geos) vc += g.attributes.position.count;
  const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3); let o = 0;
  for (const g of geos){ pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(pos, 3)); G.setAttribute('normal', new T.BufferAttribute(nor, 3)); return G;
}
function buildTesis(root, U, R3w){
  const { T, mat, mesh, canvasTex } = R3w;
  const rnd = (() => { let s = 98765; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  /* gök: bulutlu kubbe (yavaşça döner) */
  const skyT = canvasTex(1024, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2667c9'); g.addColorStop(.55, '#6aa8ea'); g.addColorStop(.85, '#c4e0fb'); g.addColorStop(1, '#e6f2ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++){ const x = rnd() * w, y = 210 + rnd() * 220, s = 18 + rnd() * 34 * (y / 430); for (let k = 0; k < 8; k++){ const gx = x + (rnd() - .5) * s * 3, gy = y + (rnd() - .5) * s * .35, r = s * (.4 + rnd() * .5);
      c.save(); c.translate(gx, gy); c.scale(1.8, .7); const rg = c.createRadialGradient(0, 0, 0, 0, 0, r); rg.addColorStop(0, 'rgba(255,255,255,.62)'); rg.addColorStop(.6, 'rgba(255,255,255,.25)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(-r, -r, r * 2, r * 2); c.restore(); } } });
  skyT.wrapS = T.RepeatWrapping;
  const dome = new T.Mesh(new T.SphereGeometry(380, 32, 16, 0, Math.PI * 2, 0, Math.PI * .55), new T.MeshBasicMaterial({ map:skyT, side:T.BackSide, fog:false, depthWrite:false }));
  dome.userData.keep = 1; dome.renderOrder = -5; root.add(dome); U.dome = dome;
  /* güneş */
  const sunT = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(.12, 'rgba(255,250,220,.95)'); g.addColorStop(.35, 'rgba(255,240,190,.25)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const sunS = new T.Sprite(new T.SpriteMaterial({ map:sunT, color:'#ffffff', blending:T.AdditiveBlending, depthWrite:false, fog:false, toneMapped:false }));
  sunS.position.set(-160, 130, 190); sunS.scale.set(90, 90, 1); root.add(sunS);
  /* uzak tepeler (sisle mavimsi) */
  for (let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2 + rnd() * .3, r = 260 + rnd() * 60, s = 50 + rnd() * 60;
    const hill = mesh('sph', mat(rnd() < .5 ? '#5f8a52' : '#4e7a48', { roughness:1, flatShading:true }), s * 1.6, 18 + rnd() * 26, s, Math.cos(a) * r, -4, Math.sin(a) * r); hill.castShadow = false; root.add(hill); }
  /* orman: tesisin etrafında kuşak + arkada yoğun koru */
  const trees = [], PAL = [['#2d6a2c', '#24592a', '#336f30', '#2a5f33'], ['#4f8a34', '#5a9a3a', '#3f7d33', '#6a9e3a', '#7aa53e', '#b8a23a']];
  for (let i = 0; i < 520; i++){
    let x, z; const band = rnd();
    if (band < .7){ const a = rnd() * Math.PI * 2, r = 92 + rnd() * 110; x = Math.cos(a) * r * 1.2; z = Math.sin(a) * r * .95; }
    else { x = -150 + rnd() * 300; z = -100 - rnd() * 90; }
    if (Math.abs(x) < 80 && Math.abs(z) < 58) continue;                       // saha + bina
    if (x > 80 && x < 140 && Math.abs(z) < 30) continue;                     // yan saha
    const k = rnd() < .45 ? 0 : 1; trees.push({ x, z, k, s:(k ? 7 : 9) + rnd() * (k ? 6 : 9), r:rnd() * 6, c:PAL[k][Math.floor(rnd() * PAL[k].length)] });
  }
  forest(root, T, U, trees);
  /* çit */
  const fenceTex = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(40,90,50,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); });
  fenceTex.wrapS = fenceTex.wrapT = T.RepeatWrapping;
  const fM = new T.MeshStandardMaterial({ map:fenceTex, transparent:true, alphaTest:.3, side:T.DoubleSide }), postM = mat('#2f5a3a', { metalness:.4 });
  const fence = (len, x, z, ry) => { const g = new T.PlaneGeometry(len, 4); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len * 2, uv.getY(i) * 8); const m = new T.Mesh(g, fM); m.position.set(x, 2, z); m.rotation.y = ry; root.add(m);
    for (let i = -len / 2; i <= len / 2; i += 6){ const p = mesh('cyl', postM, .06, 4.1, .06, 0, 2.05, 0); p.position.set(x + Math.cos(ry) * i, 2.05, z - Math.sin(ry) * i); root.add(p); } };
  fence(130, 0, 44, 0); fence(130, 0, -44, 0); fence(88, 65, 0, Math.PI / 2); fence(88, -65, 0, Math.PI / 2);
  /* modern bina: cam cephe, saçak, giriş, logo */
  const bld = new T.Group(), white = mat('#eef1f5', { roughness:.5 }), navy = mat('#14306b', { roughness:.4 }), glassM = mat('#7fb3e8', { metalness:.35, roughness:.08 });
  bld.add(mesh('box', white, 44, 10, 14, 0, 5, 0)); bld.add(mesh('box', navy, 46, 1, 16, 0, 10.4, 0)); bld.add(mesh('box', mat('#2b3240', { metalness:.4 }), 44.2, .4, 14.2, 0, 3.6, 0));
  bld.add(mesh('box', glassM, 40, 5.6, .15, 0, 6.6, 7.05)); bld.add(mesh('box', glassM, 30, 3, .15, -4, 1.6, 7.05));
  for (let i = -20; i <= 20; i += 2.5) bld.add(mesh('box', mat('#d5dae2', { metalness:.5 }), .14, 6, .25, i, 6.6, 7.1));
  bld.add(mesh('box', navy, 9, .4, 5, 16, 3.4, 9.4)); bld.add(mesh('cyl', white, .18, 3.4, .18, 12, 1.7, 11.6)); bld.add(mesh('cyl', white, .18, 3.4, .18, 20, 1.7, 11.6));
  const signT = canvasTex(1024, 128, (c, w, h) => { c.fillStyle = '#14306b'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2c230'; c.font = 'italic 900 64px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ANOLECRAB ANTRENMAN TESİSİ', w / 2, h / 2 + 3, 990); });
  const sign = new T.Mesh(new T.PlaneGeometry(32, 4), new T.MeshBasicMaterial({ map:signT })); sign.position.set(0, 12.6, 6.5); bld.add(sign); bld.add(mesh('box', navy, 33, 4.4, .4, 0, 12.6, 6.2));
  bld.position.set(0, 0, -64); root.add(bld);
  /* bayrak direkleri (dalgalanan ARAÇ bayrakları) */
  U.flags = [];
  const flagT = [['#14306b', '#f2c230', 'ARAÇ'], ['#f2c230', '#14306b', 'ANL'], ['#b3122e', '#ffffff', '★']].map(([bg, fg, t]) => canvasTex(128, 80, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = 'italic 900 40px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, w / 2, h / 2 + 2); }));
  for (let i = 0; i < 3; i++){ const x = -8 + i * 8, z = -54; root.add(mesh('cyl', mat('#d9dde3', { metalness:.6, roughness:.3 }), .09, 12, .09, x, 6, z));
    const fg = new T.PlaneGeometry(3.2, 2, 10, 1); fg.translate(1.6, 0, 0);
    const fl = new T.Mesh(fg, new T.MeshStandardMaterial({ map:flagT[i], side:T.DoubleSide, roughness:.7 })); fl.position.set(x, 10.8, z); fl.userData.keep = 1; root.add(fl);
    U.flags.push({ m:fl, base:fg.attributes.position.array.slice(), ph:i * 1.7, amp:.35, len:3.2 }); }
  /* ışık direkleri (gündüz sönük) */
  for (const sx of [1, -1]) for (const sz of [1, -1]){ const x = sx * 62, z = sz * 41; root.add(mesh('cyl', mat('#8a929c', { metalness:.6 }), .25, 22, .25, x, 11, z));
    const hd = mesh('box', mat('#e8eef5', { metalness:.3 }), 3.2, 1.6, .4, x, 22, z); hd.lookAt(0, 0, 0); root.add(hd); }
  /* tesis tribünü: 8 basamak, çatılı, aileler ve taraftarlar */
  const seats = [], stepM = mat('#c0392b', { roughness:.6 }), stepM2 = mat('#9b2b20', { roughness:.6 }), conc = mat('#8a9099', { roughness:.9 }), steel = mat('#d0d4da', { metalness:.5, roughness:.35 });
  const SX0 = -26, SX1 = 30, SZ = 46.5, rows = 8, rd = .85, rr = .48;
  for (let i = 0; i < rows; i++){ const y = .5 + i * rr, z = SZ + i * rd;
    root.add(mesh('box', conc, SX1 - SX0, y, rd, (SX0 + SX1) / 2, y / 2, z + rd / 2)); root.add(mesh('box', i % 2 ? stepM : stepM2, SX1 - SX0, .1, rd * .6, (SX0 + SX1) / 2, y + .05, z + rd * .55));
    for (let k = 0; k < (SX1 - SX0) / .66; k++){ if (rnd() < .42) continue; seats.push({ x:SX0 + .4 + k * .66 + (rnd() - .5) * .1, y:y + .02, z:z + rd * .5, yaw:Math.PI, info:[rnd(), Math.floor(rnd() * 16), rnd() < .62 ? (rnd() < .6 ? 1 : 2) : 0, 1.05], shirt:new T.Color(['#e9e9e9', '#2b2f3a', '#c0392b', '#2e86de', '#f39c12', '#14306b'][Math.floor(rnd() * 6)]), ang:[0, 0] }); } }
  const backZ = SZ + rows * rd, topY = .5 + rows * rr;
  root.add(mesh('box', conc, SX1 - SX0, topY + 3, .4, (SX0 + SX1) / 2, (topY + 3) / 2, backZ + .2));
  root.add(mesh('box', mat('#e8eaee', { roughness:.4 }), SX1 - SX0 + 2, .25, rows * rd + 3.2, (SX0 + SX1) / 2, topY + 3.1, SZ + rows * rd / 2 - .6));
  for (let x = SX0; x <= SX1; x += 8) root.add(mesh('cyl', steel, .12, topY + 3, .12, x, (topY + 3) / 2, SZ - .9));
  { const sT = canvasTex(1024, 96, (c, w, h) => { c.fillStyle = '#14306b'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2c230'; c.font = 'italic 900 52px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ANOLECRAB · ARAÇ · SON ŞAMPİYON', w / 2, h / 2 + 3, 990); });
    const sg = new T.Mesh(new T.PlaneGeometry(SX1 - SX0, 1.5), new T.MeshBasicMaterial({ map:sT })); sg.position.set((SX0 + SX1) / 2, topY + 2.2, SZ - 1.0); sg.rotation.y = Math.PI; sg.userData.keep = 1; root.add(sg); }
  root.add(crowdMesh(T, R3w, U, seats, ['#cfe6ff', 120, 330]));
  /* yan saha (küçük kaleler) */
  const sideP = new T.Mesh(new T.PlaneGeometry(40, 26), mat('#4f9a44', { roughness:.95 })); sideP.rotation.x = -Math.PI / 2; sideP.position.set(108, .01, 0); root.add(sideP);
  const LM = mat('#f5f5f5', { roughness:.7 });
  for (const [w, d, x, z] of [[40, .1, 108, 13], [40, .1, 108, -13], [.1, 26, 88, 0], [.1, 26, 128, 0], [.1, 26, 108, 0]]) root.add(mesh('box', LM, w, .01, d, x, .015, z));
  for (const s of [1, -1]){ const gx = 108 + s * 20; root.add(mesh('cyl', LM, .05, 1.5, .05, gx, .75, -1.5)); root.add(mesh('cyl', LM, .05, 1.5, .05, gx, .75, 1.5)); const cb = mesh('cyl', LM, .05, 3, .05, gx, 1.5, 0); cb.rotation.x = Math.PI / 2; root.add(cb); }
  /* ekipman (yan çizgi dışında, çalışmalara engel olmaz) */
  const cone = mat('#ff7a1a', { roughness:.6 }), yel = mat('#f2d21a', { roughness:.5 }), red = mat('#e03a2a', { roughness:.5 }), dummyM = mat('#2a63d4', { roughness:.6 }), net = mat('#1b1b1b', { roughness:.8 });
  for (let i = 0; i < 12; i++) root.add(mesh('cone', cone, .16, .4, .16, -40 + i * 3, .2, 39.5 + (i % 2) * .8));
  for (let i = 0; i < 8; i++){ root.add(mesh('cyl', i % 2 ? yel : red, .03, 1.7, .03, 8 + i * 1.6, .85, -39)); root.add(mesh('cyl', mat('#333333'), .1, .04, .1, 8 + i * 1.6, .02, -39)); }
  for (let i = 0; i < 5; i++){ const x = -22 + i * .75; root.add(mesh('cyl', dummyM, .2, 1.4, .14, x, .95, -40.5)); root.add(mesh('sph', dummyM, .14, .16, .12, x, 1.8, -40.5)); root.add(mesh('box', mat('#333333'), .5, .06, .5, x, .03, -40.5)); }
  { const g = new T.Group(); g.add(mesh('box', mat('#b0b6bf', { metalness:.6 }), 2.4, .08, .08, 0, 1.6, 0)); g.add(mesh('box', mat('#b0b6bf', { metalness:.6 }), 2.4, .08, .08, 0, .1, 0));
    for (const x of [-1.2, 1.2]) g.add(mesh('box', mat('#b0b6bf', { metalness:.6 }), .08, 1.6, .08, x, .85, 0)); g.add(mesh('box', net, 2.3, 1.45, .03, 0, .85, 0)); g.position.set(-46, 0, 40); g.rotation.y = .3; root.add(g); }
  for (let i = 0; i < 10; i++) root.add(mesh('box', yel, .04, .02, .55, 30 + i * .5, .02, 40.2));
  for (let i = 0; i < 6; i++){ const x = 34 + i * 1.2; root.add(mesh('box', red, .05, .5, .05, x, .25, -38.6)); root.add(mesh('box', red, .05, .5, .05, x, .25, -37.8)); root.add(mesh('box', red, .05, .05, .85, x, .5, -38.2)); }
  for (const [x, z] of [[-30, -40], [44, 39.8]]){ root.add(mesh('cyl', mat('#1d1d1d'), .45, .7, .45, x, .35, z)); for (let k = 0; k < 6; k++) root.add(mesh('sph', mat('#ffffff', { roughness:.4 }), .11, .11, .11, x + Math.cos(k) * .25, .78, z + Math.sin(k) * .25)); }
  /* kuşlar */
  const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute([-.6, 0, 0, 0, -.12, 0, .6, 0, 0, 0, -.12, 0, 0, .05, 0], 3)); bg.setIndex([0, 1, 4, 2, 4, 1]); bg.computeVertexNormals();
  U.birds = []; for (let i = 0; i < 9; i++){ const b = new T.Mesh(bg, new T.MeshBasicMaterial({ color:'#2b3340', side:T.DoubleSide })); b.userData.keep = 1; root.add(b); U.birds.push({ m:b, a:rnd() * 6, r:90 + rnd() * 60, h:38 + rnd() * 20, sp:.06 + rnd() * .04, ph:rnd() * 6 }); }
}
function tesisTick(U, G, dt){
  if (U.treeTime) U.treeTime.value = G.t;
  if (U.dome) U.dome.rotation.y = G.t * .002;
  if (U.birds) for (const b of U.birds){ const a = b.a + G.t * b.sp; b.m.position.set(Math.cos(a) * b.r, b.h + Math.sin(G.t * .7 + b.ph) * 2, Math.sin(a) * b.r * .8); b.m.rotation.set(0, -a, 0); b.m.scale.set(1, 1 + Math.sin(G.t * 9 + b.ph) * .9, 1); }
}
