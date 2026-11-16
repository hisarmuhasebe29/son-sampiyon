'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   foot3d.js
   3B futbol: yayın kamerası (kale karşıda) · serbest koşu · yerde hedef oku + güç
   plonjon atlayan kaleci · penaltı / frikik (baraj) / şut antrenmanı · maçlar · gol sevinçleri
   ========================================================= */
const GL = 52.5, GW = 3.66, GH = 2.44, BR = .11;
const pxToM = px => -8 + (px - 300) / 2340 * 60.5;
const yawTo = (dx, dz) => Math.atan2(-dz, dx);
const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
const easeOut = k => 1 - (1 - k) * (1 - k);

/* ---------- dünya: stadyum (gece, tribün, ışıklar) / antrenman tesisi (gündüz) ---------- */
let F3SKY = null;
function f3Sky(top, mid, bot){ const { canvasTex } = R3.world(); return canvasTex(4, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(.6, mid); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, w, h); }); }
function buildWorld(kind){
  const { T, mat, mesh, canvasTex } = R3.world();
  const root = new T.Group(), U = root.userData = { ads:[], crowd:[], nets:[], kind };
  const night = kind === 'stad';
  U.fog = new T.Fog(night ? '#0b1430' : '#d6e9fb', night ? 110 : 150, night ? 260 : 560);
  /* çim: biçme desenli (20 şerit), kale ağızlarında aşınma, yakında çim dokusu; şeritler bakış açısına göre açılıp kararır (PES gibi) */
  const grassTex = canvasTex(2048, 1024, (c, w, h) => {
    for (let i = 0; i < 20; i++){ c.fillStyle = i % 2 ? '#3f8f37' : '#4fa346'; c.fillRect(i * w / 20, 0, w / 20 + 1, h); }
    for (let j = 0; j < 14; j++){ c.fillStyle = j % 2 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.025)'; c.fillRect(0, j * h / 14, w, h / 14 + 1); }
    const px = x => (x + 65) / 130 * w, pz = z => (z + 45) / 90 * h;
    const wear = (x, z, rx, rz, a) => { const g = c.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), rx / 130 * w); g.addColorStop(0, 'rgba(150,130,70,' + a + ')'); g.addColorStop(1, 'rgba(150,130,70,0)'); c.save(); c.translate(px(x), pz(z)); c.scale(1, (rz / 90 * h) / (rx / 130 * w)); c.translate(-px(x), -pz(z)); c.fillStyle = g; c.beginPath(); c.arc(px(x), pz(z), rx / 130 * w, 0, 7); c.fill(); c.restore(); };
    for (const s of [1, -1]){ wear(s * 51, 0, 4.5, 6, .45); wear(s * 41.5, 0, 1.6, 1.6, .35); wear(s * 46, 0, 9, 12, .12); }
    wear(0, 0, 3, 3, .18); wear(0, 0, 14, 10, .06);
    const d = c.getImageData(0, 0, w, h); for (let k = 0; k < d.data.length; k += 4){ const n = (Math.random() - .5) * 26; d.data[k] += n * .5; d.data[k + 1] += n; d.data[k + 2] += n * .35; } c.putImageData(d, 0, 0); });
  { const rr = R3.world().renderer; grassTex.anisotropy = rr ? Math.min(16, rr.capabilities.getMaxAnisotropy()) : 8; }
  const detTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++){ const x = Math.random() * w, y = Math.random() * h, l = 2 + Math.random() * 5, v = Math.random() < .5 ? 40 + Math.random() * 60 : 170 + Math.random() * 70; c.strokeStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; c.lineWidth = .8 + Math.random(); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (Math.random() - .5) * 1.5, y - l); c.stroke(); } });
  detTex.wrapS = detTex.wrapT = T.RepeatWrapping; detTex.colorSpace = T.NoColorSpace; detTex.anisotropy = 4;
  const pitchM = new T.MeshStandardMaterial({ map:grassTex, roughness:.92, color:night ? '#e2f0dc' : '#d2e4c8' });
  pitchM.onBeforeCompile = sh => { sh.uniforms.tDet = { value:detTex };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;').replace('#include <project_vertex>', '#include <project_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW; uniform sampler2D tDet;').replace('#include <map_fragment>', `#include <map_fragment>
      { float band = mod(floor((vGW.x + 65.0) / 6.5), 2.0); vec3 V = normalize(cameraPosition - vGW);
        float k = (band * 2.0 - 1.0) * (0.035 + 0.09 * V.x); float det = texture2D(tDet, vGW.xz * .6).r * .6 + texture2D(tDet, vGW.xz * .13).r * .4;
        diffuseColor.rgb *= (1.0 + k) * (0.84 + 0.32 * det); }`); };
  pitchM.customProgramCacheKey = () => 'pitchGrass';
  const pitch = new T.Mesh(new T.PlaneGeometry(130, 90), pitchM); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; pitch.userData.keep = 1; root.add(pitch);
  const outer = new T.Mesh(new T.PlaneGeometry(500, 400), new T.MeshStandardMaterial({ color:night ? '#16301a' : '#5f913f', roughness:1 })); outer.rotation.x = -Math.PI / 2; outer.position.y = -.03; outer.receiveShadow = true; root.add(outer);
  /* çizgiler */
  const LM = new T.MeshStandardMaterial({ color:'#f5f5f5', roughness:.75 }), LW = .12;
  const flat = (geo, x, z) => { const m = new T.Mesh(geo, LM); m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); m.receiveShadow = true; root.add(m); return m; };
  const strip = (x1, z1, x2, z2) => flat(new T.PlaneGeometry(Math.abs(x2 - x1) + LW, Math.abs(z2 - z1) + LW), (x1 + x2) / 2, (z1 + z2) / 2);
  const rect = (x1, z1, x2, z2) => { strip(x1, z1, x2, z1); strip(x1, z2, x2, z2); strip(x1, z1, x1, z2); strip(x2, z1, x2, z2); };
  rect(-GL, -34, GL, 34); strip(0, -34, 0, 34);
  flat(new T.RingGeometry(9.15 - LW / 2, 9.15 + LW / 2, 80), 0, 0); flat(new T.CircleGeometry(.22, 16), 0, 0);
  for (const s of [1, -1]){
    rect(s * GL, -20.16, s * (GL - 16.5), 20.16); rect(s * GL, -9.16, s * (GL - 5.5), 9.16); flat(new T.CircleGeometry(.2, 16), s * (GL - 11), 0);
    flat(new T.RingGeometry(9.15 - LW / 2, 9.15 + LW / 2, 48, 1, s > 0 ? 2.215 : -.927, 1.853), s * (GL - 11), 0);
    for (const sz of [1, -1]) flat(new T.RingGeometry(1 - LW / 2, 1 + LW / 2, 12, 1, s > 0 ? (sz > 0 ? Math.PI / 2 : Math.PI) : (sz > 0 ? 0 : Math.PI * 1.5), Math.PI / 2), s * GL, sz * 34);
  }
  /* kaleler + file */
  const netTex = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 2); c.lineTo(w, 2); c.moveTo(2, 0); c.lineTo(2, h); c.stroke(); });
  netTex.wrapS = netTex.wrapT = T.RepeatWrapping;
  const netM = new T.MeshStandardMaterial({ map:netTex, transparent:true, alphaTest:.3, side:T.DoubleSide, roughness:.9 });
  const uvScale = (geo, s = 1 / .16) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s); return geo; };
  const Yv = new T.Vector3(0, 1, 0);
  const rod = (g, a, b, r, m) => { const d = new T.Vector3().subVectors(b, a), L = d.length(); const o = new T.Mesh(new T.CylinderGeometry(r, r, L, 10), m); o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(Yv, d.normalize()); o.castShadow = true; g.add(o); return o; };
  function goal(s){
    const g = new T.Group(), white = mat('#ffffff', { roughness:.25 }), grey = mat('#a7adb5', { metalness:.5, roughness:.4 });
    for (const z of [-GW, GW]){ rod(g, new T.Vector3(0, 0, z), new T.Vector3(0, GH, z), .062, white); rod(g, new T.Vector3(0, GH, z), new T.Vector3(1.9, 1.85, z), .025, grey); rod(g, new T.Vector3(1.9, 0, z), new T.Vector3(1.9, 1.85, z), .025, grey); rod(g, new T.Vector3(0, .02, z), new T.Vector3(1.9, .02, z), .025, grey); }
    rod(g, new T.Vector3(0, GH, -GW - .06), new T.Vector3(0, GH, GW + .06), .062, white); rod(g, new T.Vector3(1.9, 1.85, -GW), new T.Vector3(1.9, 1.85, GW), .025, grey);
    const back = new T.Mesh(uvScale(new T.PlaneGeometry(GW * 2, 1.85, 8, 4)), netM); back.rotation.y = Math.PI / 2; back.position.set(1.9, .925, 0); g.add(back);
    const topG = uvScale(new T.PlaneGeometry(1.97, GW * 2)); topG.rotateX(Math.PI / 2); topG.rotateZ(-Math.atan2(.59, 1.9)); const top = new T.Mesh(topG, netM); top.position.set(.95, GH - .3, 0); g.add(top);
    for (const z of [-GW, GW]){ const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(1.9, 0); sh.lineTo(1.9, 1.85); sh.lineTo(0, GH); sh.closePath(); const sg = uvScale(new T.ShapeGeometry(sh)); const side = new T.Mesh(sg, netM); side.position.z = z; g.add(side); }
    if (s < 0){ g.rotation.y = Math.PI; } g.position.x = s * GL; root.add(g);
    U.nets.push({ s, back, g, t:9 });
  }
  goal(1); goal(-1);
  /* reklam panoları (LED) */
  const adTex = canvasTex(1024, 64, (c, w, h) => { const S = [['ARAÇ', '#14306b', '#f2c230'], ['SON ŞAMPİYON', '#b3122e', '#ffffff'], ['ANOLECRAB', '#f2c230', '#14306b'], ['UON PMAC', '#101418', '#2ecc71']];
    S.forEach(([t, bg, fg], i) => { c.fillStyle = bg; c.fillRect(i * 256, 0, 256, h); c.fillStyle = fg; c.font = 'italic 900 34px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, i * 256 + 128, h / 2 + 2, 236); }); });
  adTex.wrapS = T.RepeatWrapping; U.ads.push(adTex);
  const adM = new T.MeshStandardMaterial({ map:adTex, emissiveMap:adTex, emissive:new T.Color('#ffffff'), emissiveIntensity:night ? .9 : .35, roughness:.5 });
  const board = (len, x, z, ry) => { const tx = adTex.clone(); tx.repeat.x = len / 16; tx.wrapS = T.RepeatWrapping; tx.needsUpdate = true; U.ads.push(tx);
    const m = new T.Mesh(new T.BoxGeometry(len, .9, .12), new T.MeshStandardMaterial({ map:tx, emissiveMap:tx, emissive:new T.Color('#ffffff'), emissiveIntensity:night ? .85 : .3, roughness:.5 }));
    m.position.set(x, .45, z); m.rotation.y = ry; m.castShadow = true; root.add(m); };
  if (night){ board(96, 0, 37.2, 0); board(96, 0, -37.2, 0); for (const s of [1, -1]){ board(17, s * 57.5, -12, Math.PI / 2); board(17, s * 57.5, 12, Math.PI / 2); } }
  else { board(96, 0, 36, 0); board(96, 0, -36, 0); for (const s of [1, -1]){ board(14, s * 57, -11, Math.PI / 2); board(14, s * 57, 11, Math.PI / 2); } }
  void adM;
  if (night){
    buildStadium(root, U, R3.world());
  } else buildTesis(root, U, R3.world());
  R3.flatten(root); R3.compact(root);
  root.traverse(o => { if (o.isMesh && !o.material.transparent && !o.isInstancedMesh){ o.receiveShadow = true; } });
  return root;
}

/* ---------- kare kurulumu ---------- */
function f3Begin(G, dt){
  if (!R3.free()) return null;
  const W3 = R3.world(), { scene, cam, sun, hemi, fill } = W3;
  const root = R3.custom('w_' + G.kind, () => buildWorld(G.kind)), U = root.userData;
  if (!F3SKY) F3SKY = { stad:f3Sky('#02040c', '#0a1430', '#1d2c56'), tesis:f3Sky('#3d8ae0', '#8ec5ff', '#e6f3ff') };
  scene.background = F3SKY[G.kind]; scene.fog = U.fog;
  const night = G.kind === 'stad', f = G.focus;
  hemi.intensity = night ? .62 : 1.05; sun.intensity = night ? 3.1 : 2.6; fill.intensity = night ? 1.25 : .45;
  R3.post = night ? { th:1.0, bloom:.42, sat:1.12, vig:.45, tint:[.97, 1, 1.05], lift:0, sharp:.5 } : { th:1.2, bloom:.2, sat:1.14, vig:.3, tint:[1.03, 1.01, .97], lift:0, sharp:.5 };
  sun.position.set(f.x - 16, 32, f.z + (night ? 20 : 14)); sun.target.position.set(f.x, 0, f.z); R3.shadowBox(26, 26, 90); fill.position.set(f.x + 25, 18, f.z - 22);
  const sk = G.shake || 0;
  cam.fov = G.fov || 42; cam.zoom = 1; cam.aspect = W / H; cam.updateProjectionMatrix();
  cam.position.set(G.camPos.x + rand(-1, 1) * sk * .02, G.camPos.y + rand(-1, 1) * sk * .02, G.camPos.z); cam.lookAt(G.camLook);
  for (const t of U.ads) t.offset.x = (G.t * .035) % 1;
  for (const t of U.crowd) t.offset.y = G.cheer ? Math.abs(Math.sin(G.t * 13)) * .006 : Math.sin(G.t * 2) * .0015;
  stadTick(U, G, dt);
  for (const n of U.nets){ n.t += dt; const k = n.t < .6 ? Math.sin(n.t / .6 * Math.PI) * (1 - n.t / .6) : 0; n.back.position.x = 1.9 + k * .7; n.back.scale.set(1, 1 + k * .05, 1); }
  if (U.screen && G.screen){ const key = G.screen.join('|'); if (key !== U.screen.key){ U.screen.key = key; const c = U.screen.c; c.fillStyle = '#05070f'; c.fillRect(0, 0, 512, 192);
      c.fillStyle = '#14306b'; c.fillRect(0, 0, 512, 40); c.fillStyle = '#f2c230'; c.font = 'italic 900 26px ' + FONT; c.textAlign = 'center'; c.fillText('UON PMAC · ' + (G.screen[3] || ''), 256, 29);
      c.font = '900 84px ' + FONT; c.fillStyle = '#ffffff'; c.fillText(G.screen[0], 110, 140); c.fillText(G.screen[2], 402, 140); c.fillStyle = '#f2c230'; c.fillText(G.screen[1], 256, 140); U.screen.tex.needsUpdate = true;
      if (U.screen.all) for (const o of U.screen.all) if (o.c !== c){ o.c.drawImage(c.canvas, 0, 0); o.tex.needsUpdate = true; } } }
  return W3;
}
function f3Net(G, s){ if (!R3.init()) return; const root = R3.custom('w_' + G.kind, () => buildWorld(G.kind)); for (const n of root.userData.nets) if (n.s === s) n.t = 0; }

/* ---------- gece: 4 projektörden gelen yumuşak gölgeler (PES/FIFA gece maçı görünümü) ---------- */
function f3NightShadows(list){
  const im = R3.custom('nshad', () => { const { T, canvasTex } = R3.world();
    const tex = canvasTex(64, 128, (c, w, h) => { const g = c.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h / 2, w * .45, h * .5, 0, 0, 7); c.fill(); });
    const geo = new T.PlaneGeometry(.55, 2.1); geo.rotateX(-Math.PI / 2); geo.translate(0, .015, -1.0);
    const m = new T.InstancedMesh(geo, new T.MeshBasicMaterial({ map:tex, transparent:true, opacity:.2, depthWrite:false, toneMapped:false }), 26 * 4); m.frustumCulled = false; m.renderOrder = 1;
    const g = new (R3.world().T.Group)(); g.add(m); return g; });
  const { T } = R3.world(), M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), P = new T.Vector3(), S = new T.Vector3(1, 1, 1), m = im.children[0];
  let n = 0;
  for (const p of list){ if (p.down > 0) continue; for (let k = 0; k < 4; k++){ const a = Math.PI / 4 + k * Math.PI / 2 + Math.atan2(p.z, p.x) * .05; E.set(0, a, 0); Q.setFromEuler(E); P.set(p.x, 0, p.z); M4.compose(P, Q, S); m.setMatrixAt(n++, M4); } if (n >= 26 * 4) break; }
  m.count = n; m.instanceMatrix.needsUpdate = true;
}
/* ---------- gol bandı + havai fişekler (geçişli gol kutlaması) ---------- */
function drawGoalBanner(c, M, ours, name, min, names, prof, training){
  const t = M.goalT; if (t > 3.2) return;
  const inK = Math.min(1, t / .35), outK = t > 2.5 ? Math.min(1, (t - 2.5) / .45) : 0, k = inK * (1 - outK);
  if (t < .18){ c.fillStyle = 'rgba(255,255,255,' + (1 - t / .18) * .7 + ')'; c.fillRect(0, 0, W, H); }
  const cA = ours ? prof.shirt : '#7a1010', cB = ours ? prof.stripe : '#ff5a5a';
  c.save(); c.translate(480, 248); c.rotate(-.06);
  for (let i = 0; i < 3; i++){ const w = W * 1.4 * Math.min(1, (t - i * .06) / .3) * (1 - outK); if (w <= 0) continue; c.fillStyle = i === 1 ? cB : cA; c.globalAlpha = i === 1 ? .95 : .88; c.fillRect(-w / 2 + (i - 1) * 40 * (1 - inK), -64 + i * 44, w, i === 1 ? 40 : 42); }
  c.globalAlpha = 1; c.restore();
  if (k > 0){ const s = .6 + .4 * easeOut(inK) + Math.sin(t * 10) * .02 * (1 - outK);
    c.save(); c.translate(480, 254); c.scale(s, s); c.globalAlpha = k; txt(c, ours ? 'GOOOOL!' : 'RAKİP GOLÜ', 0, 8, ours ? 92 : 64, ours ? '#ffffff' : '#ffdede', 'center', 'italic 900', 10); c.restore();
    c.globalAlpha = k; pill(c, '⚽ ' + min + "'  " + (name || (ours ? names[0] : names[1])) + '   ·   ' + names[0] + ' ' + M.score[0] + ' - ' + M.score[1] + ' ' + names[1], 480, 320, 17, 'rgba(6,10,26,.9)', '#f2c230', { maxW:700 }); c.globalAlpha = 1; }
  if (ours && !training){ M.fwT = (M.fwT || 0) - 1 / 60; if (t < 2.6 && M.fwT <= 0){ M.fwT = .32; const x = rand(80, 880), y = rand(40, 150), col = pick(['#f2c230', '#ffffff', prof.shirt, '#ff6a00', '#7fd0ff']); for (let i = 0; i < 26; i++){ const a = i / 26 * Math.PI * 2; M.fw.push({ x, y, vx:Math.cos(a) * rand(90, 170), vy:Math.sin(a) * rand(90, 170), l:1, col }); } } }
  for (const q of M.fw){ q.l -= 1 / 60 * 1.3; q.x += q.vx / 60; q.y += q.vy / 60; q.vy += 120 / 60; c.globalAlpha = Math.max(0, q.l); c.fillStyle = q.col; c.fillRect(q.x - 2, q.y - 2, 4, 4); }
  c.globalAlpha = 1; M.fw = M.fw.filter(q => q.l > 0);
}
/* ---------- tekrar (replay) yayını katmanı ---------- */
function drawReplayHud(c, real, slow, t){
  const bar = 42; c.fillStyle = '#000000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
  const k = Math.min(1, real * 3); c.save(); c.globalAlpha = k;
  c.fillStyle = 'rgba(179,18,46,.95)'; rr(c, 18, 52, 160, 38, 8); c.fill(); aracBadge(c, 40, 71, 13);
  txt(c, 'TEKRAR', 104, 79, 20, '#ffffff', 'center', 'italic 900'); if (Math.floor(t * 2) % 2) { c.fillStyle = '#ff2e2e'; c.beginPath(); c.arc(166, 64, 5, 0, 7); c.fill(); }
  if (slow) txt(c, '◀◀ YAVAŞ ÇEKİM', 942, 79, 14, '#ffffff', 'right', 'bold', 3);
  txt(c, 'dokun: geç', 480, H - 14, 12, '#c8d3ff', 'center', 'normal'); c.restore();
  if (real < .35){ const w = (1 - real / .35); c.fillStyle = 'rgba(20,48,107,' + w + ')'; c.fillRect(0, 0, W * w, H); aracBadge(c, 480, 270, 60 * w + 10); }
}
/* ---------- maç öncesi kadro kartları (PES tarzı) ---------- */
function drawLineups(c, k, teams, names, training, t, cam, solo){
  const a = Math.min(1, k * 4) * Math.min(1, (1 - k) * 6); if (a <= 0) return; c.save(); c.globalAlpha = a;
  const g = c.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, 'rgba(4,8,22,.9)'); g.addColorStop(1, 'rgba(4,8,22,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 120);
  txt(c, training ? 'ANOLECRAB ANTRENMAN TESİSİ · HAZIRLIK MAÇI' : 'UON PMAC STADYUMU', 480, 40, 24, '#f2c230', 'center', 'italic 900', 5);
  txt(c, names[0] + '  vs  ' + names[1], 480, 74, 30, '#ffffff', 'center', '900', 6);
  const col = (tm, x, head, color) => { c.fillStyle = 'rgba(6,10,26,.84)'; rr(c, x, 120, 230, 330, 14); c.fill(); c.fillStyle = color; c.fillRect(x, 120, 230, 6);
    txt(c, head, x + 115, 152, 18, '#ffffff', 'center', '900');
    tm.forEach((p, i) => { const y = 180 + i * 24; txt(c, String(p.num), x + 34, y, 15, color, 'right', '900'); txt(c, (p.nm || (p.look && p.look.nm) || p.role) + '', x + 44, y, 15, '#ffffff', 'left', 'bold', 0, 130);
      txt(c, p.role === 'GK' ? 'KL' : p.role === 'DF' ? 'DF' : p.role === 'MF' ? 'OS' : 'FV', x + 212, y, 12, '#8fa0c8', 'right', 'bold'); }); };
  const slide = (1 - Math.min(1, k * 5)) * 260;
  col(teams[0], 24 - slide, names[0] + ' · 4-3-3', '#f2c230'); col(teams[1], 706 + slide, names[1] + ' · 4-3-3', '#ff6b6b');
  if (k > .15){ tapHint(c, 480, 462, true, 'dokun: geç ▶'); button(c, Object.assign({ size:14 }, INTRO_CAM), '📹 Kamera: ' + camName(cam || 'yayin') + ' ⟳'); button(c, Object.assign({ size:14 }, INTRO_CTL), solo ? '👤 Sadece ben ⟳' : '👥 Takımı yönet ⟳'); }
  c.restore();
}
const INTRO_CAM = { x:206, y:482, w:268, h:40 }, INTRO_CTL = { x:486, y:482, w:268, h:40 };
/* ---------- falso seçimi (frikik / korner / şut çalışması) + gidiş yolu önizlemesi ---------- */
const CURL_L = { x:330, y:392, w:58, h:56 }, CURL_R = { x:572, y:392, w:58, h:56 };
const CURL_TXT = ['◀◀ SOLA ÇOK', '◀ SOLA', 'DÜZ', 'SAĞA ▶', 'SAĞA ÇOK ▶▶'];
function curlTap(S){ if (!tap) return false; if (inB(CURL_L, tap) || inB(CURL_R, tap)){ S.curlSel = clamp(Math.round(((S.curlSel || 0) + (inB(CURL_L, tap) ? -.5 : .5)) * 2) / 2, -1, 1); SFX.click(); vib(8); tap = null; return true; } return false; }
function curlDraw(c, S){
  const v = S.curlSel || 0, i = Math.round(v * 2) + 2;
  for (const [b, ic] of [[CURL_L, '↶'], [CURL_R, '↷']]){ c.fillStyle = 'rgba(8,12,30,.78)'; rr(c, b.x, b.y, b.w, b.h, 14); c.fill(); c.strokeStyle = '#f2c230'; c.lineWidth = 2; c.stroke(); txt(c, ic, b.x + b.w / 2, b.y + 38, 30, '#f2c230', 'center', '900'); }
  c.fillStyle = 'rgba(8,12,30,.82)'; rr(c, 396, 398, 168, 44, 10); c.fill();
  txt(c, 'FALSO', 480, 416, 11, '#c8d3ff', 'center', 'bold'); txt(c, CURL_TXT[i], 480, 436, 15, v ? '#f2c230' : '#ffffff', 'center', '900');
  for (let k = 0; k < 5; k++){ c.fillStyle = k === i ? '#f2c230' : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(424 + k * 28, 446, 3.5, 0, 7); c.fill(); }
}
/* önizleme noktaları: şutun hatasız hali */
function shotPreview(c, B, aim, power, opts){
  const P = f3Shot(B, aim, Math.max(.35, power || .6), opts); P.tz = aim.tz; P.ty = Math.max(BR, aim.th);
  for (let k = .06; k <= 1.001; k += .07){ const q = shotPos(P, k), pr = R3.project(q.x, q.y, q.z); if (pr.behind) continue; c.globalAlpha = .35 + .5 * k; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(pr.x, pr.y, 2 + k * 2.2, 0, 7); c.fill(); }
  c.globalAlpha = 1;
}
/* hedef dairesi (kale üzerinde, ekranda belirgin) */
function aimMarker(c, y, z, r){ const p = R3.project(GL, y, z); if (p.behind) return; const pz = R3.project(GL, y, z + r), rr2 = Math.max(10, Math.abs(pz.x - p.x));
  c.lineWidth = 3; c.strokeStyle = '#f2c230'; c.beginPath(); c.arc(p.x, p.y, rr2, 0, 7); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x - rr2 - 6, p.y); c.lineTo(p.x + rr2 + 6, p.y); c.moveTo(p.x, p.y - rr2 - 6); c.lineTo(p.x, p.y + rr2 + 6); c.stroke(); }
/* ---------- yer işaretleri ---------- */
function f3Ring(id, x, z, col, r = .5, op = .9){
  const g = R3.custom(id, () => { const { T } = R3.world(); const m = new T.Mesh(new T.RingGeometry(.78, 1, 40), new T.MeshBasicMaterial({ color:col, transparent:true, opacity:op, depthWrite:false, side:T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.renderOrder = 2; const g = new T.Group(); g.add(m); return g; });
  g.position.set(x, .03, z); g.scale.setScalar(r); g.children[0].material.opacity = op; return g;
}
function f3Arrow(x, z, yaw, len, col = '#f2c230'){
  const g = R3.custom('aimArrow', () => { const { T } = R3.world(); const sh = new T.Shape(); sh.moveTo(0, -.09); sh.lineTo(.74, -.09); sh.lineTo(.74, -.24); sh.lineTo(1, 0); sh.lineTo(.74, .24); sh.lineTo(.74, .09); sh.lineTo(0, .09); sh.closePath();
    const geo = new T.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2); const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color:col, transparent:true, opacity:.88, depthWrite:false })); m.renderOrder = 3; const g = new T.Group(); g.add(m); return g; });
  g.position.set(x, .04, z); g.rotation.set(0, yaw, 0); g.scale.set(len, 1, Math.min(1.4, .7 + len * .08)); g.children[0].material.color.set(col); return g;
}
function f3Reticle(y, z, r, col){
  const g = R3.custom('aimRet', () => { const { T } = R3.world(); const g = new T.Group(); const m = new T.MeshBasicMaterial({ color:'#f2c230', transparent:true, opacity:.95, depthTest:false, side:T.DoubleSide });
    const ring = new T.Mesh(new T.RingGeometry(.86, 1, 40), m); g.add(ring); const dot = new T.Mesh(new T.CircleGeometry(.1, 12), m); g.add(dot);
    for (const a of [0, 1, 2, 3]){ const t = new T.Mesh(new T.PlaneGeometry(.06, .36), m); t.position.set(Math.cos(a * Math.PI / 2) * 1.1, Math.sin(a * Math.PI / 2) * 1.1, 0); t.rotation.z = a * Math.PI / 2 + Math.PI / 2; g.add(t); }
    g.rotation.y = -Math.PI / 2; g.renderOrder = 5; return g; });
  g.position.set(GL - .02, y, z); g.scale.setScalar(Math.max(.22, r)); g.children[0].material.color.set(col); return g;
}

/* ---------- şut modeli ---------- */
function f3Shot(from, aim, power, o = {}){
  const side = o.side || 1, acc = o.acc != null ? o.acc : PST('sut'), dist = Math.hypot(side * GL - from.x, aim.tz - from.z);
  const err = (1 - acc) * .5 + dist * .011 + Math.max(0, power - .85) * 3.2;
  const over = Math.max(0, power - .85) * 4.5;
  const tz = aim.tz + rand(-1, 1) * err, ty = Math.max(BR, aim.th + over + rand(-1, 1) * err * .55);
  const speed = 13 + power * 19 + acc * 4, dur = dist / speed;
  const arc = Math.max(0, .1 + aim.th * .42 + (1 - power) * 1.25 - (aim.th < .5 ? .3 : 0)) * (o.arcMul || 1);
  const curl = o.curlAbs != null ? o.curlAbs * (1 - power * .3) : (o.curl || .3) * (playerProfile().foot === 'Sol' ? -1 : 1) * (1 - power * .4);
  return { x0:from.x, y0:BR, z0:from.z, tx:side * (GL + .05), side, ty, tz, dur, arc, curl, t:0, power, dist, ev:null, kev:1, done:false, err };
}
const shotPos = (S, k) => ({ x:lerp(S.x0, S.tx, k), y:Math.max(BR, lerp(S.y0, S.ty, k) + S.arc * 4 * k * (1 - k)), z:lerp(S.z0, S.tz, k) + S.curl * Math.sin(Math.PI * Math.min(1, k)) });
function f3Resolve(S, K, o = {}){
  if (o.wall){ const Wl = o.wall; for (let k = 0; k <= 1; k += .01){ const q = shotPos(S, k), along = (q.x - S.x0) * Wl.dx + (q.z - S.z0) * Wl.dz;
      if (along >= Wl.d){ const lat = (q.x - Wl.cx) * Wl.nx + (q.z - Wl.cz) * Wl.nz; if (Math.abs(lat) < 1.2 && q.y < 2.12){ S.ev = 'wall'; S.kev = k; return; } break; } } }
  const ty = S.ty, tz = S.tz, D = DIFF();
  if (Math.abs(Math.abs(tz) - GW) < .13 && ty < GH + .08){ S.ev = 'post'; S.kev = 1; return; }
  if (Math.abs(ty - GH) < .12 && Math.abs(tz) < GW + .05){ S.ev = 'bar'; S.kev = 1; return; }
  if (Math.abs(tz) > GW || ty > GH){ S.ev = ty > GH ? 'over' : 'out'; S.kev = 1; S.dive = { z:clamp(tz, K.z - 2.5, K.z + 2.5), y:Math.min(1.6, ty), react:.25 }; return; }
  const mul = (o.keeperMul || 1) * D.keeper;
  const corner = clamp((Math.abs(tz) - .8) / 2.8, 0, 1);
  const read = clamp(.5 * mul * (1 - S.power * .45) * (1 - corner * .55) + (S.dist > 22 ? .08 : 0), .05, .9);
  const isRead = Math.random() < read;
  let gz = isRead ? tz + rand(-.3, .3) : pick([-2.6, -1.3, 0, 1.3, 2.6]) + rand(-.2, .2), gy = isRead ? ty : rand(.3, 1.7);
  const react = o.react != null ? o.react : .2 + rand(0, .08);
  const avail = Math.max(0, S.dur - react), reach = 1.0 + Math.min(2.8, avail * 6.2) - (ty > 1.9 && Math.abs(tz - K.z) > 2.2 ? .6 : 0);
  gz = clamp(gz, K.z - reach, K.z + reach);
  const tol = isRead ? .85 : Math.max(.15, .55 - S.power * .35);
  const save = Math.abs(gz - tz) < tol && Math.abs(gy - ty) < 1.0 && Math.abs(tz - K.z) <= reach + .1;
  S.ev = save ? (S.power < .62 && Math.abs(tz - K.z) < 1.7 && ty < 1.9 ? 'catch' : 'parry') : 'goal';
  S.kev = save ? Math.max(.5, 1 - .55 / S.dist) : 1;
  if (save){ const q = shotPos(S, S.kev); gz = q.z; gy = q.y; }
  S.dive = { z:gz, y:gy, react };
}

/* ---------- kaleci ---------- */
function newKeeper(g = 1){ return { g, x:g * (GL - .55), z:0, y:0, roll:0, st:'ready', kt:0, animT:Math.random() * 3, z0:0, tz:0, ty:0, dd:.5, hold:false }; }
function keeperDive(K, dv, S){ K.st = 'wait'; K.kt = -dv.react; K.z0 = K.z; K.tz = dv.z; K.ty = dv.y; K.dd = clamp(S.dur * S.kev - dv.react, .2, .55); }
function keeperUpd(K, dt){
  K.animT += dt; K.kt += dt;
  if (K.st === 'wait'){ const side = Math.sign(K.tz - K.z) || 1; K.z += side * Math.min(.9, Math.abs(K.tz - K.z)) * dt * 2.6; K.z0 = K.z; }
  if (K.st === 'wait' && K.kt >= 0){ K.st = 'dive'; K.kt = 0; }
  if (K.st === 'dive' || K.st === 'down'){
    const k = Math.min(1, K.kt / K.dd), e = easeOut(k), dz = K.tz - K.z0, side = Math.sign(dz) || 1, lat = Math.abs(dz);
    const rollMax = lat < .7 ? 0 : Math.min(1.45, (lat - .3) * .85);
    const hands = rollMax ? 2.0 * Math.sin(rollMax) : 0;
    K.roll = -side * rollMax * e * K.g;
    K.z = K.z0 + (dz - side * Math.min(lat, hands)) * e;
    const jumpH = (K.ty > 1.3 ? Math.min(1.1, K.ty - 1.0) : 0) + .42 * (rollMax / 1.42) + .08;
    K.y = K.st === 'down' ? Math.max(0, K.y - dt * 3) : Math.sin(Math.min(1, k) * Math.PI * .85) * jumpH + (rollMax ? Math.max(0, (K.ty - .4) * .35) * Math.sin(k * Math.PI) : 0);
    if (K.kt > K.dd + .25 && K.st === 'dive'){ K.st = 'down'; }
    if (K.st === 'down' && K.kt > K.dd + (K.hold ? .35 : .5)){ K.st = 'rise'; K.rt = 0; K.r0 = K.roll; K.y0 = K.y; }
  }
  if (K.st === 'rise'){ K.rt += dt; const k = Math.min(1, K.rt / .3), e = easeOut(k); K.roll = K.r0 * (1 - e); K.y = K.y0 * (1 - e); if (k >= 1){ K.st = 'ready'; K.roll = 0; K.y = 0; } }
}
function keeperHands(K){ const r = K.roll, up = 1.95; return { x:K.x - .25 * K.g, y:K.y + Math.cos(r) * up, z:K.z - Math.sin(r) * up * K.g }; }
function keeperPose(K){
  if (K.kick > 0){ const k = clamp(1 - K.kick / .4, 0, 1); return { lean:6, bob:4, fl:[.45, .1], bl:[-.3, -.2], fa:[lerp(2.95, 1.2, k), lerp(3.1, 1.3, k)], ba:[.4, .8], lie:false, rot:0 }; }
  if (K.hold) return { lean:4, bob:4, fl:[.15, .05], bl:[-.15, -.1], fa:[1.35, 2.7], ba:[1.25, 2.6], lie:false, rot:0 };
  if (K.st === 'rise') return { lean:12, bob:14, fl:[.9, .2], bl:[.1, -.9], fa:[.9, 1.6], ba:[.8, 1.5], lie:false, rot:0, spread:.3 };
  if (K.st === 'wait') return BODY.keeperStance(K.animT, 'shuffle', K.tz - K.z);
  if (K.st === 'dive'){ const k = Math.min(1, K.kt / (K.dd || .4)); return { lean:K.roll ? -2 : -6, bob:0, fl:[lerp(.6, .25, k), lerp(.1, .15, k)], bl:[lerp(.3, -.35, k), lerp(-.6, -.55, k)], fa:[lerp(1.6, 3.05, k), lerp(2.0, 3.12, k)], ba:[lerp(1.4, 2.9, k), lerp(1.8, 3.0, k)], lie:false, rot:0, spread:.18 }; }
  if (K.st === 'down') return { lean:-2, bob:0, fl:[.35, .2], bl:[-.25, -.4], fa:[2.9, 3.05], ba:[2.6, 2.95], lie:false, rot:0, spread:.3 };
  // hazır: koşu / geri geri / yan adım / ayak ucunda zıplama / rahat
  const mode = K.mode || 'set', sp = K.spd || 0;
  if (sp > 2.8 || mode === 'run'){ K.gph = (K.gph || 0) + (1 / 60) * Math.PI * 2 * (.85 + .085 * Math.max(sp, 3)); return BODY.gait(K.gph, Math.max(sp, 3), { back:K.back ? 1 : 0 }); }
  if (mode === 'relax'){ if (sp > .45){ K.gph = (K.gph || 0) + (1 / 60) * Math.PI * 2 * (.85 + .085 * sp); return BODY.gait(K.gph, sp, { back:K.back ? 1 : 0 }); } return BODY.keeperStance(K.animT, 'relax', 0); }
  if (sp > .45) return BODY.keeperStance(K.animT, 'shuffle', K.lat);
  return BODY.keeperStance(K.animT, mode, K.lat);
}
function drawKeeper(K, ex, id = 'fk', look = LOOK.keeper){
  const dt = 1 / 60, vx = (K.x - (K.px == null ? K.x : K.px)) / dt, vz = (K.z - (K.pz == null ? K.z : K.pz)) / dt; K.px = K.x; K.pz = K.z;
  K.spd = lerp(K.spd || 0, Math.min(9, Math.hypot(vx, vz)), .25); K.lat = lerp(K.lat || 0, vz, .25); K.back = vx * K.g > .8;
  const base = K.g > 0 ? Math.PI : 0, yaw = K.st === 'ready' && !K.hold && K.yaw != null ? K.yaw : base;
  R3.charW(id, look, keeperPose(K), K.x, K.y, K.z, yaw, 1, ex || 'angry', false, null, { rx:K.roll });
}

/* ---------- top ---------- */
function newBall(x, z){ return { x, y:BR, z, vx:0, vy:0, vz:0, free:false, held:false, rot:0, yaw:0, life:0 }; }
function ballPhys(B, dt, inNet){
  B.vy -= 9.8 * dt; B.x += B.vx * dt; B.y += B.vy * dt; B.z += B.vz * dt; B.life += dt;
  if (B.y < BR){ B.y = BR; if (B.vy < -1.2){ B.vy = -B.vy * .5; SFX.ballKick && Math.abs(B.vy) > 2 && 0; } else B.vy = 0; B.vx *= Math.pow(.35, dt); B.vz *= Math.pow(.35, dt); }
  const sd = inNet === true ? 1 : inNet;
  if (inNet && sd * B.x > GL - .1 && Math.abs(B.z) < GW + .2){ if (sd * B.x > GL + 1.75){ B.x = sd * (GL + 1.75); B.vx = -sd * Math.abs(B.vx) * .1; B.vz *= .3; } if (Math.abs(B.z) > GW - .15){ B.z = Math.sign(B.z) * (GW - .15); B.vz = -B.vz * .1; } if (B.y > GH - .2){ B.y = GH - .2; B.vy = -Math.abs(B.vy) * .2; } }
  const sp = Math.hypot(B.vx, B.vz); if (sp > .1){ B.yaw = yawTo(B.vx, B.vz); B.rot -= sp * dt / BR; }
}
function f3Ball(B){ const r = R3.objW('ball3', 'ball', B.x, B.y, B.z); r.scale.setScalar(BR / .1); r.rotation.set(0, B.yaw, B.rot, 'YXZ'); return r; }

/* ---------- kamera ---------- */
function camTo(G, px, py, pz, lx, ly, lz, k){ G.camPos.x = lerp(G.camPos.x, px, k); G.camPos.y = lerp(G.camPos.y, py, k); G.camPos.z = lerp(G.camPos.z, pz, k); G.camLook.x = lerp(G.camLook.x, lx, k); G.camLook.y = lerp(G.camLook.y, ly, k); G.camLook.z = lerp(G.camLook.z, lz, k); }
function f3Input(){ const ix = Math.abs(JOY.x) > .08 ? JOY.x : (keys.right ? 1 : 0) - (keys.left ? 1 : 0); const iy = Math.abs(JOY.y) > .08 ? -JOY.y : 0; return { ix, iy, m:Math.min(1, Math.hypot(ix, iy)) }; }

/* ---------- 2B arayüz (ekran üstü) ---------- */
function scoreBug(c, teams, score, minute){
  const x = 12, y = 10;
  c.fillStyle = 'rgba(6,10,26,.9)'; rr(c, x, y, 250, 34, 6); c.fill();
  c.fillStyle = '#14306b'; c.fillRect(x + 4, y + 4, 6, 26); c.fillStyle = '#f2c230'; c.fillRect(x + 10, y + 4, 3, 26);
  txt(c, teams[0], x + 20, y + 24, 17, '#ffffff', 'left', '900');
  c.fillStyle = '#f2c230'; rr(c, x + 80, y + 4, 74, 26, 4); c.fill(); txt(c, score[0] + ' - ' + score[1], x + 117, y + 24, 19, '#14306b', 'center', '900');
  txt(c, teams[1], x + 164, y + 24, 17, '#ffffff', 'left', '900'); c.fillStyle = '#c0392b'; c.fillRect(x + 225, y + 4, 6, 26);
  c.fillStyle = 'rgba(255,255,255,.14)'; rr(c, x + 254, y, 74, 34, 6); c.fill(); txt(c, minute, x + 291, y + 24, 17, '#ffffff', 'center', '900');
}
function powerHud(c, power, label){
  const x = 330, y = 486, w = 300;
  c.fillStyle = 'rgba(0,0,0,.72)'; rr(c, x - 12, y - 30, w + 24, 52, 10); c.fill();
  txt(c, label || 'GÜÇ — bırakınca vurur', 480, y - 10, 13, '#ffffff', 'center', 'bold', 0, w);
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#2ecc71'); g.addColorStop(.7, '#f1c40f'); g.addColorStop(.85, '#e67e22'); g.addColorStop(1, '#c0392b');
  c.fillStyle = '#1c1c1c'; rr(c, x, y, w, 14, 5); c.fill(); c.fillStyle = g; rr(c, x, y, Math.max(6, w * power), 14, 5); c.fill();
  c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x + w * .85, y - 3, 2, 20);
}
function radar(c, list){
  const w = 78, h = 120, x = W - w - 12, y = 54;
  c.fillStyle = 'rgba(10,40,20,.62)'; rr(c, x, y, w, h, 6); c.fill(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.strokeRect(x + 3, y + 3, w - 6, h - 6);
  c.beginPath(); c.moveTo(x + 3, y + h / 2); c.lineTo(x + w - 3, y + h / 2); c.stroke(); c.strokeRect(x + w / 2 - 17, y + 3, 34, 18); c.strokeRect(x + w / 2 - 17, y + h - 21, 34, 18);
  const P = (wx, wz) => [x + 3 + (wz + 34) / 68 * (w - 6), y + 3 + (GL - wx) / (GL * 2) * (h - 6)];
  for (const d of list){ const [px, py] = P(d.x, d.z); c.fillStyle = d.col; c.beginPath(); c.arc(px, py, d.r || 3, 0, 7); c.fill(); if (d.me){ c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke(); } }
}
function wtext(G, text, x, y, z, col, size){ G.texts.push({ text, x, y, z, col, size, t:0 }); }
function drawWTexts(c, G){
  for (const t of G.texts){ const p = R3.project(t.x, t.y, t.z); if (p.behind) continue; c.globalAlpha = Math.max(0, 1 - t.t / 1.8); const s = 1 + Math.max(0, .25 - t.t) * 2;
    txt(c, t.text, p.x, p.y - t.t * 26, (t.size || 40) * s, t.col || '#ffffff', 'center', 'italic 900', 7, 900); }
  c.globalAlpha = 1;
}
function confetti(G, n){ for (let i = 0; i < n; i++) G.conf.push({ x:rand(0, W), y:rand(-200, -10), vx:rand(-40, 40), vy:rand(120, 260), r:rand(0, 6), vr:rand(-8, 8), col:pick(['#f2c230', '#14306b', '#ffffff', '#2e86de', '#ff5a5a']), life:4 }); }
function drawConf(c, G, dt){ for (const q of G.conf){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillStyle = q.col; c.fillRect(-4, -2, 8, 4); c.restore(); } G.conf = G.conf.filter(q => q.life > 0 && q.y < H + 20); }
function pauseBtn(c){ c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 9, 5, 18); c.fillRect(PAUSE_BTN.x + 23, PAUSE_BTN.y + 9, 5, 18); }
function nameTag(c, x, y, z, name, num){ const p = R3.project(x, y, z); if (p.behind) return; pill(c, '#' + num + ' ' + name, p.x, p.y - 8, 13, 'rgba(20,48,107,.88)', '#f2c230', { maxW:160 }); }

/* ---------- oyuncu (kontrol) ---------- */
function newP(x, z){ return { x, z, y:0, vx:0, vz:0, yaw:0, animT:0, dash:0, dashCd:0, slideT:0, slideCd:0, stun:0, atk:null, sp:0 }; }
const P_SPEED = () => 5.6 + PST('hiz') * 2.2;
function playerPose(p, extra){
  if (extra) return extra;
  if (p.atk) return getPose({ animT:p.animT, atk:p.atk });
  if (p.slideT > 0) return getPose({ slide:1 });
  if (p.dash > 0){ const q = Object.assign({}, p, { sp:9 }); const P = fbMove(q, 1 / 60); p.gph = q.gph; return P; }
  return fbMove(p, 1 / 60);
}
const footFace = () => playerProfile().foot === 'Sol' ? -1 : 1;

/* ---------- gol sevinci ---------- */
function celebPose(G, p, t){
  const kind = playerProfile().celeb;
  if (kind === 'ucak'){ const a = t * 2.2, P = getPose({ animT:t, vx:400, run:true }); P.fa = [.05, .05]; P.ba = [.05, .05]; P.spread = 1.45; P.lean = 8;
    p.x = G.cx + Math.cos(a) * 3; p.z = G.cz + Math.sin(a) * 3; p.yaw = yawTo(-Math.sin(a), Math.cos(a)); return P; }
  if (kind === 'takla'){ if (t < .9){ const k = t / .9; p.y = Math.sin(k * Math.PI) * 1.3; const P = getPose({ pose:'crouch' }); P.rot = -k * Math.PI * 2; P.fa = [2.0, 2.4]; P.ba = [1.9, 2.3]; return P; }
    p.y = 0; return getPose({ animT:t, pose:'cheer' }); }
  if (kind === 'diz'){ const k = Math.min(1, t / 1.1); if (t < 1.4){ p.x += Math.cos(p.yaw) * (1 - k) * 7 * .016; p.z -= Math.sin(p.yaw) * (1 - k) * 7 * .016; }
    const P = getPose({ pose:'kneel' }); P.fa = [2.8, 3.05]; P.ba = [2.7, 3.0]; P.lean = -10; P.spread = .35; return P; }
  const P = getPose({ animT:t, pose:t % 1.6 < .8 ? 'trophy' : 'point' }); if (t % 1.6 >= .8){ P.fa = [2.6, 2.7]; } return P;
}

/* =========================================================
   DURAN TOP 3B: penaltı · frikik (baraj) · şut antrenmanı
   ========================================================= */
function SetPiece3D(def){
  const mode = def.mode;
  const S = { kind:'tesis', game:'setpiece', def, t:0, shots:0, goals:0, results:[], state:'ready', stT:0, aim:{ tz:0, th:.9 }, power:0, charging:false, pauseM:false, lost:false, lostT:0,
    texts:[], conf:[], camPos:new THREE.Vector3(30, 4, 0), camLook:new THREE.Vector3(GL, 1, 0), focus:{ x:GL - 12, z:0 }, fov:33, shake:0, cheer:false, K:newKeeper(), B:null, wall:null, shot:null };
  S.hint = { penalty:'Joystick: sarı hedefi köşeye götür · ⚽ basılı tut: güç · bırak: vur! Kırmızı güç = üstten aut.',
    freekick:'Hedefi üst köşeye al: top barajın ÜSTÜNDEN aşsın! Orta güç = daha çok falso ve yükseklik.',
    shot:'Joystick: hedef · ⚽ basılı tut: güç · bırak: şut! Köşeler kaleciden uzaktır.' }[mode] || def.hint;
  const ctrl = () => showControls('shot'); ctrl(); playMusic('football'); crowdAmb(true, .06);
  const SPOTS = { penalty:[[GL - 11, 0]], freekick:[[GL - 24, -6], [GL - 22, 7], [GL - 26, 2], [GL - 23, -9]], shot:[[GL - 18, 0], [GL - 20, -7], [GL - 19, 6], [GL - 21, -2], [GL - 17, 9]] };
  const coachLook = curCh >= 5 ? LOOK.leo : LOOK.coach;
  function setup(snap){
    const sp = SPOTS[mode][S.shots % SPOTS[mode].length];
    S.B = newBall(sp[0], sp[1]); S.K = newKeeper(); S.shot = null; S.state = 'ready'; S.power = 0; S.charging = false;
    const dirx = GL - sp[0], dirz = -sp[1], dl = Math.hypot(dirx, dirz), dx = dirx / dl, dz = dirz / dl;
    S.p = newP(sp[0] - dx * 2.4 + dz * 1.0 * -footFace(), sp[1] - dz * 2.4 - dx * 1.0 * -footFace()); S.p.yaw = yawTo(sp[0] - S.p.x, sp[1] - S.p.z);
    S.aim = { tz:mode === 'penalty' ? 0 : -Math.sign(sp[1] || 1) * 2.2, th:mode === 'freekick' ? 1.9 : .8 }; if (S.curlSel == null) S.curlSel = mode === 'freekick' ? (sp[1] > 0 ? -.5 : .5) : 0;
    S.wall = null;
    if (mode === 'freekick'){ const np = Math.sign(sp[1] || 1) * GW * .55, wx = GL - sp[0], wz = np - sp[1], wl = Math.hypot(wx, wz), wdx = wx / wl, wdz = wz / wl;
      S.wall = { d:9.15, dx:wdx, dz:wdz, cx:sp[0] + wdx * 9.15, cz:sp[1] + wdz * 9.15, nx:-wdz, nz:wdx, jump:0 }; }
    const cx = sp[0] - dx * 11.5, cz = sp[1] - dz * 11.5;
    if (snap){ S.camPos.set(cx, 3.6, cz); S.camLook.set(GL, .5, sp[1] * .3); }
  }
  setup(true);
  function restart(){ stats.retries++; crowdAmb(false); cur = SetPiece3D(def); }
  function launch(){
    S.shot = f3Shot(S.B, S.aim, S.power, mode === 'penalty' ? { curl:.2 } : { curlAbs:(S.curlSel || 0) * 1.7 });
    f3Resolve(S.shot, S.K, { wall:S.wall, keeperMul:mode === 'penalty' ? .85 : mode === 'shot' ? .9 : 1, react:mode === 'penalty' ? .06 : null });
    keeperDive(S.K, S.shot.dive || { z:S.K.z, y:1, react:.3 }, S.shot);
    if (S.wall) S.wall.jump = .001;
    SFX.ballKick(); setTimeout(() => SFX.dive(), 300); vib(25); S.shots++; S.state = 'shot';
  }
  function event(ev){
    const B = S.B, Sh = S.shot, q = shotPos(Sh, Sh.kev), q0 = shotPos(Sh, Math.max(0, Sh.kev - .02)), k = 1 / (.02 * Sh.dur);
    B.x = q.x; B.y = q.y; B.z = q.z; B.vx = (q.x - q0.x) * k; B.vy = (q.y - q0.y) * k; B.vz = (q.z - q0.z) * k; B.free = true;
    let msg = '', col = '#ffffff';
    if (ev === 'goal'){ S.goals++; S.results.push(1); SFX.net(); SFX.goal(); vib([60, 50, 160]); f3Net(S, 1); msg = 'GOOOL!'; col = '#f2c230'; say(pick(['Gol!', 'Harika vuruş!', 'Köşeye!']), 'Spiker'); confetti(S, 70); S.cheer = true; S.shake = 6; }
    else { S.results.push(0); SFX.ooh();
      if (ev === 'catch'){ B.free = false; B.held = true; S.K.hold = true; SFX.gloveCatch(); msg = 'KALECİ YAKALADI!'; }
      else if (ev === 'parry'){ B.vx = -3.5; B.vy = 3.4; B.vz = (Math.sign(B.z - S.K.z) || 1) * 5.5; SFX.glovePunch(); msg = 'KALECİ ÇELDİ!'; }
      else if (ev === 'post' || ev === 'bar'){ B.vx = -5.5; B.vy = ev === 'bar' ? 3 : 1.4; B.vz = -Math.sign(B.z) * 2.4; SFX.post(); msg = ev === 'bar' ? 'ÜST DİREK!' : 'DİREK!'; S.shake = 4; }
      else if (ev === 'wall'){ B.vx = -S.wall.dx * 6; B.vy = 3.2; B.vz = -S.wall.dz * 6 + rand(-2, 2); SFX.bodyBlow(); msg = 'BARAJ!'; }
      else msg = ev === 'over' ? 'ÜSTTEN AUT!' : 'AUT!';
    }
    wtext(S, msg, GL - 2, 3.2, B.z * .5, col, ev === 'goal' ? 76 : 44);
    S.state = 'result'; S.stT = ev === 'goal' ? 2.3 : 1.8;
  }
  S.update = dt => {
    if (S.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ S.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)){ crowdAmb(false); toCover(); } } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !S.lost){ S.pauseM = true; showControls(null); return; }
    if (mode !== 'penalty' && S.state === 'ready') curlTap(S);
    S.t += dt; S.shake *= Math.pow(.02, dt); keeperUpd(S.K, dt); S.p.animT += dt;
    for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 1.8);
    if (S.lost){ S.lostT += dt; if (tap && S.lostT > .8) restart(); return; }
    const B = S.B, p = S.p;
    if (S.state === 'ready'){
      const I = f3Input(); S.aim.tz = clamp(S.aim.tz + I.ix * dt * 4.2, -4.6, 4.6); S.aim.th = clamp(S.aim.th + I.iy * dt * 2.1, .12, 3.0);
      if (keys.shoot){ if (!S.charging){ S.charging = true; S.power = 0; } S.power = Math.min(1, S.power + dt * .95); }
      else if (S.charging){ S.charging = false; S.state = 'runup'; S.stT = .38; S.rx = p.x; S.rz = p.z; }
      if (S.K.st === 'ready'){ S.K.z = Math.sin(S.t * (mode === 'penalty' ? 1.3 : .9)) * (mode === 'penalty' ? .55 : .35) + (mode === 'penalty' ? 0 : clamp(B.z * .12, -1, 1)); S.K.x = GL - (mode === 'penalty' ? .35 : 1.4 + Math.sin(S.t * .7) * .3); S.K.mode = mode === 'penalty' ? 'pen' : 'set'; S.K.yaw = yawTo(B.x - S.K.x, B.z - S.K.z); }
    } else if (S.state === 'runup'){
      S.stT -= dt; const k = 1 - Math.max(0, S.stT) / .38; p.x = lerp(S.rx, B.x - Math.cos(p.yaw) * .55, k); p.z = lerp(S.rz, B.z + Math.sin(p.yaw) * .55, k); p.sp = 6;
      if (S.stT <= 0){ p.sp = 0; p.atk = { m:{ dur:.42, anim:'shoot' }, t:.15 }; launch(); }
    } else if (S.state === 'shot'){
      const Sh = S.shot; Sh.t += dt; const k = Sh.t / Sh.dur;
      if (k < Sh.kev){ const q = shotPos(Sh, k); B.x = q.x; B.y = q.y; B.z = q.z; B.yaw = yawTo(Sh.tx - Sh.x0, Sh.tz - Sh.z0); B.rot -= dt * 40; }
      else event(Sh.ev);
    } else if (S.state === 'result'){
      S.stT -= dt; if (S.stT < .8) S.cheer = false;
      if (S.stT <= 0){
        const left = def.shots - S.shots;
        if (S.goals >= def.need){ S.state = 'won'; S.stT = 1.8; SFX.win(); say(curCh >= 5 ? 'Harika! Antrenman tamam.' : 'Aferin! Antrenman tamam.', curCh >= 5 ? 'Leo' : 'Spiker'); confetti(S, 90); }
        else if (S.goals + left < def.need || left <= 0){ S.lost = true; S.lostT = 0; showControls(null); SFX.lose(); }
        else setup(false);
      }
    } else if (S.state === 'won'){ S.stT -= dt; if (S.stT <= 0){ stats.lvls++; stats.dmg += (S.shots - S.goals) / Math.max(1, S.shots) * .6; crowdAmb(false); next(); return; } }
    if (p.atk){ p.atk.t += dt; if (p.atk.t > p.atk.m.dur) p.atk = null; }
    if (B.free) ballPhys(B, dt, S.shot && S.shot.ev === 'goal');
    if (B.held){ const h = keeperHands(S.K); B.x = S.K.x - .45; B.y = S.K.y + 1.15; B.z = S.K.z; void h; }
    if (S.wall && S.wall.jump > 0){ S.wall.jump += dt; if (S.wall.jump > .7) S.wall.jump = 0; }
    // kamera
    const dl = Math.hypot(GL - B.x, B.z) || 1;
    if (S.state === 'ready' || S.state === 'runup'){ const sp = SPOTS[mode][(S.shots) % SPOTS[mode].length], dx = (GL - sp[0]) / Math.hypot(GL - sp[0], sp[1]), dz = -sp[1] / Math.hypot(GL - sp[0], sp[1]);
      camTo(S, sp[0] - dx * 8.5, 3.4, sp[1] - dz * 8.5, GL, .5, sp[1] * .3 + (S.aim.tz - sp[1] * .3) * .15, Math.min(1, dt * 4)); }
    else camTo(S, S.camPos.x, S.camPos.y, S.camPos.z, lerp(GL, B.x, .35), Math.max(.8, B.y * .6), B.z * .6, Math.min(1, dt * 3));
    S.focus = { x:GL - 10, z:B.z * .5 }; void dl;
  };
  const r2 = v => Math.round(v * 100) / 100;
  S.mpSnap = () => ({ p:[r2(S.p.x), r2(S.p.z), r2(S.p.yaw), r2(S.p.sp || 0), S.p.atk ? r2(S.p.atk.t) : -1], K:[r2(S.K.x), r2(S.K.z), r2(S.K.y), r2(S.K.roll), S.K.st, S.K.hold ? 1 : 0],
    B:[r2(S.B.x), r2(S.B.y), r2(S.B.z), r2(S.B.yaw), r2(S.B.rot)], st:S.state, ch:S.charging ? 1 : 0, pw:r2(S.power), aim:[r2(S.aim.tz), r2(S.aim.th)], res:S.results.slice(), g:S.goals, sh:S.shots,
    cam:[r2(S.camPos.x), r2(S.camPos.y), r2(S.camPos.z), r2(S.camLook.x), r2(S.camLook.y), r2(S.camLook.z)], wall:S.wall ? [r2(S.wall.cx), r2(S.wall.cz), r2(S.wall.nx), r2(S.wall.nz), r2(S.wall.dx), r2(S.wall.dz), r2(S.wall.jump)] : 0,
    tx:S.texts.map(t => [t.text, r2(t.x), r2(t.y), r2(t.z), t.col, t.size, r2(t.t)]), lost:S.lost ? r2(S.lostT) : -1, cheer:S.cheer ? 1 : 0, t:r2(S.t) });
  S.mpApply = s => {
    [S.p.x, S.p.z, S.p.yaw, S.p.sp] = s.p; S.p.atk = s.p[4] >= 0 ? { m:{ dur:.42, anim:'shoot' }, t:s.p[4] } : null;
    [S.K.x, S.K.z, S.K.y, S.K.roll, S.K.st] = s.K; S.K.hold = !!s.K[5]; [S.B.x, S.B.y, S.B.z, S.B.yaw, S.B.rot] = s.B;
    S.state = s.st; S.charging = !!s.ch; S.power = s.pw; S.aim.tz = s.aim[0]; S.aim.th = s.aim[1]; S.results = s.res; S.goals = s.g; S.shots = s.sh;
    S.camPos.set(s.cam[0], s.cam[1], s.cam[2]); S.camLook.set(s.cam[3], s.cam[4], s.cam[5]);
    if (s.wall){ S.wall = S.wall || {}; [S.wall.cx, S.wall.cz, S.wall.nx, S.wall.nz, S.wall.dx, S.wall.dz, S.wall.jump] = s.wall; } else S.wall = null;
    S.texts = s.tx.map(t => ({ text:t[0], x:t[1], y:t[2], z:t[3], col:t[4], size:t[5], t:t[6] })); S.lost = s.lost >= 0; S.lostT = Math.max(0, s.lost); S.cheer = !!s.cheer; S.t = s.t; };
  S.viewTick = dt => { S.p.animT += dt; S.K.animT += dt; };
  S.draw = c => {
    const dt = 1 / 60;
    if (!f3Begin(S, dt)){ c.fillStyle = '#000'; c.fillRect(0, 0, W, H); txt(c, '3B grafik desteklenmiyor', 480, 270, 24, '#fff', 'center'); return; }
    const p = S.p, B = S.B;
    const pP = S.state === 'won' || (S.state === 'result' && S.results[S.results.length - 1]) ? getPose({ animT:S.t, pose:'cheer' }) : S.charging ? Object.assign(getPose({ animT:S.t, pose:'stand' }), { lean:6, fl:[.25, .05], bl:[-.3, -.25] }) : playerPose(p);
    R3.charW('fp', LOOK.issem, pP, p.x, p.y, p.z, p.yaw, 1, S.charging ? 'angry' : S.state === 'won' ? 'happy' : 'neutral', false, null, { face:footFace() });
    drawKeeper(S.K, S.results[S.results.length - 1] && S.state === 'result' ? 'sad' : 'angry');
    R3.charW('fc', coachLook, getPose({ animT:S.t, pose:S.goals ? 'arms' : 'wait' }), GL - 20, 0, -24, yawTo(B.x - (GL - 20), B.z + 24), 1, S.state === 'result' && S.results[S.results.length - 1] ? 'happy' : 'neutral');
    if (S.wall){ const Wl = S.wall, jy = Wl.jump > 0 ? Math.sin(Math.min(1, Wl.jump / .55) * Math.PI) * .42 : 0;
      for (let i = 0; i < 4; i++){ const o = (i - 1.5) * .56; const P = getPose({ animT:S.t + i, pose:'stand' }); P.fa = [.35, .7]; P.ba = [.3, .6]; P.lean = 2;
        R3.charW('fw' + i, LOOK[i % 2 ? 'rival2' : 'rival'], P, Wl.cx + Wl.nx * o, jy, Wl.cz + Wl.nz * o, yawTo(-Wl.dx, -Wl.dz), 1, 'angry'); } }
    f3Ball(B);
    if (S.state === 'ready'){
      const tl = Math.hypot(GL - B.x, S.aim.tz - B.z), ay = yawTo(GL - B.x, S.aim.tz - B.z);
      f3Arrow(B.x, B.z, ay, 1.2 + S.power * Math.min(9, tl * .45), S.power > .85 ? '#ff4a3a' : '#f2c230');
      const err = (1 - PST('sut')) * .5 + tl * .011 + Math.max(0, S.power - .85) * 3.2;
      f3Reticle(S.aim.th + Math.max(0, S.power - .85) * 2, S.aim.tz, .32 + err * .9, S.power > .85 ? '#ff4a3a' : '#f2c230');
      f3Ring('ringP', p.x, p.z, '#f2c230', .55);
    }
    R3.render();
    drawWTexts(c, S); drawConf(c, S, dt);
    pill(c, def.title || 'Antrenman', 14, 28, 17, 'rgba(6,10,26,.85)', '#f2c230', { align:'left', maxW:330 });
    for (let i = 0; i < def.shots; i++){ const r = S.results[i], x = 26 + i * 26, y = 62; c.fillStyle = r === 1 ? '#2ecc71' : r === 0 ? '#e74c3c' : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); if (r != null) txt(c, r ? '✓' : '✕', x, y + 5, 12, '#ffffff', 'center', '900'); }
    txt(c, 'Gol ' + S.goals + ' / ' + def.need, 26 + def.shots * 26, 67, 16, '#ffffff', 'left', 'bold', 4);
    if (S.state === 'ready'){ shotPreview(c, B, S.aim, S.power, mode === 'penalty' ? { curl:.2 } : { curlAbs:(S.curlSel || 0) * 1.7 }); aimMarker(c, S.aim.th, S.aim.tz, .45); if (mode !== 'penalty') curlDraw(c, S);
      powerHud(c, S.power, S.charging ? 'GÜÇ — bırakınca vurur' : '⚽ basılı tut: güç · joystick: hedef');
      const np = R3.project(p.x, 2.1, p.z); if (!np.behind) pill(c, PNAME, np.x, np.y, 13, 'rgba(20,48,107,.85)', '#f2c230', { maxW:150 }); }
    if (S.t < 6 && S.state === 'ready'){ c.globalAlpha = Math.min(1, 6 - S.t); pill(c, S.hint, 480, 104, 15, 'rgba(20,48,107,.92)', '#ffffff', { maxW:880 }); c.globalAlpha = 1; }
    pauseBtn(c);
    if (S.state === 'won'){ c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, W, H); txt(c, 'BAŞARILI!', 480, 270, 64, '#f2c230', 'center', 'italic 900', 8); }
    if (S.pauseM) drawPause(c);
    if (S.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H); txt(c, 'OLMADI!', 480, 220, 52, '#ff6b6b', 'center', '900');
      txt(c, S.goals + ' gol attın, ' + def.need + ' gerekiyordu.', 480, 268, 21, '#ffffff', 'center', 'normal', 0, 880);
      txt(c, 'İpucu: hedefi köşeye al, gücü kırmızıya taşırma. ' + (mode === 'freekick' ? 'Barajı aşmak için hedefi yükselt.' : ''), 480, 298, 16, '#c8d3ff', 'center', 'normal', 0, 880);
      tapHint(c, 480, 350, S.lostT > .8, 'Tekrar dene ▶'); }
  };
  return S;
}

