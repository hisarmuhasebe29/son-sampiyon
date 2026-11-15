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
  U.fog = new T.Fog(night ? '#0b1430' : '#cfe6ff', night ? 110 : 120, night ? 260 : 330);
  /* çim */
  const grassTex = canvasTex(1024, 128, (c, w, h) => { for (let i = 0; i < 20; i++){ c.fillStyle = i % 2 ? '#3b8a35' : '#46993f'; c.fillRect(i * w / 20, 0, w / 20 + 1, h); }
    const d = c.getImageData(0, 0, w, h); for (let k = 0; k < d.data.length; k += 4){ const n = (Math.random() - .5) * 24; d.data[k] += n * .55; d.data[k + 1] += n; d.data[k + 2] += n * .4; } c.putImageData(d, 0, 0); });
  const pitch = new T.Mesh(new T.PlaneGeometry(130, 90), new T.MeshStandardMaterial({ map:grassTex, roughness:.95 })); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; root.add(pitch);
  const outer = new T.Mesh(new T.PlaneGeometry(500, 400), new T.MeshStandardMaterial({ color:night ? '#1c3a1b' : '#5f913f', roughness:1 })); outer.rotation.x = -Math.PI / 2; outer.position.y = -.03; outer.receiveShadow = true; root.add(outer);
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
  board(96, 0, 36, 0); board(96, 0, -36, 0); for (const s of [1, -1]){ board(14, s * 57, -11, Math.PI / 2); board(14, s * 57, 11, Math.PI / 2); }
  void adM;
  if (night){
    /* tribünler */
    const crowd = home => canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#151a28'; c.fillRect(0, 0, w, h);
      const cols = home ? ['#14306b', '#14306b', '#f2c230', '#f2c230', '#ffffff', '#1d4fa8'] : ['#c0392b', '#c0392b', '#ffffff', '#14306b', '#f2c230', '#2a2f3a'];
      const skins = ['#f1c9a5', '#e0ac85', '#c48d68', '#8d5a3c', '#5a3a26'];
      for (let r = 0; r < 34; r++){ const y = r * 15 + 4; c.fillStyle = r % 2 ? '#20283a' : '#273049'; c.fillRect(0, y + 10, w, 5);
        for (let i = 0; i < 64; i++){ if (Math.random() < .07) continue; const x = i * 16 + 8 + rand(-3, 3), yy = y + rand(-1, 1);
          c.fillStyle = pick(cols); c.fillRect(x - 5, yy + 5, 10, 8); c.fillStyle = pick(skins); c.beginPath(); c.arc(x, yy + 2, 3.6, 0, 7); c.fill();
          if (Math.random() < .12){ c.fillStyle = pick(cols); c.fillRect(x - 6, yy - 9, 12, 7); } } }
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(.4, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    const stand = (tex, len, a, b, n) => { const t = tex.clone(); t.wrapS = T.RepeatWrapping; t.repeat.x = len / 32; t.needsUpdate = true; U.crowd.push(t);
      const L = a.distanceTo(b), m = new T.Mesh(new T.PlaneGeometry(len, L), new T.MeshStandardMaterial({ map:t, emissiveMap:t, emissive:new T.Color('#ffffff'), emissiveIntensity:.55, roughness:.9 }));
      m.position.copy(a).add(b).multiplyScalar(.5); m.lookAt(m.position.clone().add(n)); root.add(m); return m; };
    const homeT = crowd(true), awayT = crowd(false);
    stand(homeT, 140, new T.Vector3(0, 1.2, 39), new T.Vector3(0, 24, 66), new T.Vector3(0, .77, -.64));
    stand(awayT, 140, new T.Vector3(0, 1.2, -39), new T.Vector3(0, 24, -66), new T.Vector3(0, .77, .64));
    for (const s of [1, -1]){ const st = stand(s > 0 ? awayT : homeT, 82, new T.Vector3(s * 60, 1.2, 0), new T.Vector3(s * 86, 24, 0), new T.Vector3(-s * .64, .77, 0)); st.rotation.z = 0; }
    const dark = mat('#1a1f2b', { roughness:.9 }), roofM = mat('#2a303c', { metalness:.3, roughness:.6 });
    for (const s of [1, -1]){ root.add(mesh('box', dark, 140, 1.6, 1, 0, .8, s * 38.6)); root.add(mesh('box', roofM, 150, .9, 22, 0, 27, s * 64)); root.add(mesh('box', mat('#fff6d8', { emissive:new T.Color('#fff6d8'), emissiveIntensity:1.5 }), 140, .2, .5, 0, 26.4, s * 53.5));
      root.add(mesh('box', dark, 1, 1.6, 80, s * 59.6, .8, 0)); root.add(mesh('box', roofM, 24, .9, 92, s * 76, 27, 0));
      for (const z of [1, -1]) root.add(mesh('box', dark, 26, 26, 28, s * 78, 13, z * 56)); }
    /* ışık kuleleri */
    const glow = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,248,220,.75)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    for (const sx of [1, -1]) for (const sz of [1, -1]){
      const x = sx * 70, z = sz * 56; root.add(mesh('cyl', mat('#5a6270', { metalness:.6, roughness:.4 }), .7, 42, .7, x, 21, z));
      const head = mesh('box', mat('#fffbe8', { emissive:new T.Color('#fffbe8'), emissiveIntensity:2.2 }), 8, 4.5, .6, x, 43, z); head.lookAt(0, 0, 0); root.add(head);
      const sp = new T.Sprite(new T.SpriteMaterial({ map:glow, color:'#fff4d6', blending:T.AdditiveBlending, depthWrite:false, transparent:true, fog:false })); sp.position.set(x - sx * .8, 43, z - sz * .8); sp.scale.set(22, 22, 1); root.add(sp); }
    /* dev ekran */
    const scr = document.createElement('canvas'); scr.width = 512; scr.height = 192; const st = new T.CanvasTexture(scr); st.colorSpace = T.SRGBColorSpace;
    const sm = new T.Mesh(new T.PlaneGeometry(22, 8.2), new T.MeshBasicMaterial({ map:st, toneMapped:false })); sm.position.set(86, 30, 0); sm.rotation.y = -Math.PI / 2; root.add(sm);
    root.add(mesh('box', mat('#111111'), .6, 9, 23, 86.4, 30, 0)); U.screen = { c:scr.getContext('2d'), tex:st, key:'' };
  } else {
    /* antrenman tesisi: çit, ağaçlar, bina, tribüncük, koniler */
    const fenceTex = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(40,90,50,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); });
    fenceTex.wrapS = fenceTex.wrapT = T.RepeatWrapping;
    const fM = new T.MeshStandardMaterial({ map:fenceTex, transparent:true, alphaTest:.3, side:T.DoubleSide }), postM = mat('#2f5a3a', { metalness:.4 });
    const fence = (len, x, z, ry) => { const g = uvScale(new T.PlaneGeometry(len, 4), 1 / .5); const m = new T.Mesh(g, fM); m.position.set(x, 2, z); m.rotation.y = ry; root.add(m);
      for (let i = -len / 2; i <= len / 2; i += 6){ const p = mesh('cyl', postM, .06, 4.1, .06, 0, 2.05, 0); p.position.set(x + Math.cos(ry) * i, 2.05, z - Math.sin(ry) * i); root.add(p); } };
    fence(130, 0, 44, 0); fence(130, 0, -44, 0); fence(88, 65, 0, Math.PI / 2); fence(88, -65, 0, Math.PI / 2);
    const trunk = mat('#6b4a2b'), leafs = [mat('#2f6b2a'), mat('#3d7d34'), mat('#285a24')];
    for (let i = 0; i < 46; i++){ const a = i / 46 * Math.PI * 2, r = rand(78, 105), x = Math.cos(a) * r * 1.15, z = Math.sin(a) * r * .8, s = rand(.8, 1.4);
      root.add(mesh('cyl', trunk, .35 * s, 3 * s, .35 * s, x, 1.5 * s, z)); const lf = pick(leafs);
      root.add(mesh('sph', lf, 2.6 * s, 3 * s, 2.6 * s, x, 4.6 * s, z)); root.add(mesh('sph', lf, 1.9 * s, 2.2 * s, 1.9 * s, x + .8, 6.4 * s, z - .4)); }
    const bld = new T.Group(); bld.add(mesh('box', mat('#eef1f5'), 34, 9, 12, 0, 4.5, 0)); bld.add(mesh('box', mat('#14306b'), 34.2, 1.2, 12.2, 0, 7.6, 0));
    for (let i = -14; i <= 14; i += 4) bld.add(mesh('box', mat('#7fb3e8', { metalness:.3, roughness:.15 }), 2.4, 2.4, .1, i, 4.2, 6.05));
    const signT = canvasTex(1024, 96, (c, w, h) => { c.fillStyle = '#14306b'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2c230'; c.font = 'italic 900 56px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ANOLECRAB ANTRENMAN TESİSİ', w / 2, h / 2 + 3, 980); });
    const sign = new T.Mesh(new T.PlaneGeometry(30, 2.8), new T.MeshBasicMaterial({ map:signT })); sign.position.set(0, 10.6, 6.1); bld.add(sign);
    bld.position.set(0, 0, -62); root.add(bld);
    const bench = mat('#c0392b'), benchB = mat('#7a7f88', { metalness:.4 });
    for (let i = 0; i < 4; i++){ root.add(mesh('box', benchB, 30, .5 + i * .6, 1.2, 10, (.5 + i * .6) / 2, 47 + i * 1.2)); root.add(mesh('box', bench, 30, .12, 1.0, 10, .56 + i * .6, 47 + i * 1.2)); }
    const cone = mat('#ff7a1a', { roughness:.6 });
    for (let i = 0; i < 9; i++) root.add(mesh('cone', cone, .18, .45, .18, -30 + i * 4, .225, -28 + (i % 2) * 2.5));
    for (let i = 0; i < 6; i++) root.add(mesh('cone', cone, .18, .45, .18, 20 + i * 3, .225, 28));
  }
  R3.compact(root);
  root.traverse(o => { if (o.isMesh && !o.material.transparent){ o.receiveShadow = true; } });
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
  hemi.intensity = night ? .85 : 1.3; sun.intensity = night ? 2.5 : 2.7; fill.intensity = night ? 1.0 : .45;
  sun.position.set(f.x - 16, 32, f.z + (night ? 20 : 14)); sun.target.position.set(f.x, 0, f.z); R3.shadowBox(26, 26, 90); fill.position.set(f.x + 25, 18, f.z - 22);
  const sk = G.shake || 0;
  cam.fov = G.fov || 42; cam.zoom = 1; cam.aspect = W / H; cam.updateProjectionMatrix();
  cam.position.set(G.camPos.x + rand(-1, 1) * sk * .02, G.camPos.y + rand(-1, 1) * sk * .02, G.camPos.z); cam.lookAt(G.camLook);
  for (const t of U.ads) t.offset.x = (G.t * .035) % 1;
  for (const t of U.crowd) t.offset.y = G.cheer ? Math.abs(Math.sin(G.t * 13)) * .006 : Math.sin(G.t * 2) * .0015;
  for (const n of U.nets){ n.t += dt; const k = n.t < .6 ? Math.sin(n.t / .6 * Math.PI) * (1 - n.t / .6) : 0; n.back.position.x = 1.9 + k * .7; n.back.scale.set(1, 1 + k * .05, 1); }
  if (U.screen && G.screen){ const key = G.screen.join('|'); if (key !== U.screen.key){ U.screen.key = key; const c = U.screen.c; c.fillStyle = '#05070f'; c.fillRect(0, 0, 512, 192);
      c.fillStyle = '#14306b'; c.fillRect(0, 0, 512, 40); c.fillStyle = '#f2c230'; c.font = 'italic 900 26px ' + FONT; c.textAlign = 'center'; c.fillText('UON PMAC · ' + (G.screen[3] || ''), 256, 29);
      c.font = '900 84px ' + FONT; c.fillStyle = '#ffffff'; c.fillText(G.screen[0], 110, 140); c.fillText(G.screen[2], 402, 140); c.fillStyle = '#f2c230'; c.fillText(G.screen[1], 256, 140); U.screen.tex.needsUpdate = true; } }
  return W3;
}
function f3Net(G, s){ const root = R3.custom('w_' + G.kind, () => buildWorld(G.kind)); for (const n of root.userData.nets) if (n.s === s) n.t = 0; }

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
  const curl = (o.curl || .3) * (playerProfile().foot === 'Sol' ? -1 : 1) * (1 - power * .4);
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
  if (K.st === 'wait' && K.kt >= 0){ K.st = 'dive'; K.kt = 0; }
  if (K.st === 'dive' || K.st === 'down'){
    const k = Math.min(1, K.kt / K.dd), e = easeOut(k), dz = K.tz - K.z0, side = Math.sign(dz) || 1, lat = Math.abs(dz);
    const rollMax = lat < .9 ? 0 : Math.min(1.42, (lat - .5) * .7);
    const hands = rollMax ? 2.0 * Math.sin(rollMax) : 0;
    K.roll = -side * rollMax * e * K.g;
    K.z = K.z0 + (dz - side * Math.min(lat, hands)) * e;
    const jumpH = K.ty > 1.3 ? Math.min(1.0, K.ty - 1.1) : .25 * (rollMax / 1.42);
    K.y = K.st === 'down' ? Math.max(0, K.y - dt * 3) : Math.sin(Math.min(1, k) * Math.PI * .85) * jumpH + (rollMax ? Math.max(0, (K.ty - .4) * .35) * Math.sin(k * Math.PI) : 0);
    if (K.kt > K.dd + .25 && K.st === 'dive'){ K.st = 'down'; }
  }
}
function keeperHands(K){ const r = K.roll, up = 1.95; return { x:K.x - .25 * K.g, y:K.y + Math.cos(r) * up, z:K.z - Math.sin(r) * up * K.g }; }
function keeperPose(K){
  if (K.hold) return { lean:4, bob:4, fl:[.15, .05], bl:[-.15, -.1], fa:[1.35, 2.7], ba:[1.25, 2.6], lie:false, rot:0 };
  if (K.st === 'dive' || K.st === 'down'){ return { lean:K.roll ? 0 : -4, bob:0, fl:[.35, .2], bl:[-.25, -.1], fa:[3.0, 3.1], ba:[2.85, 3.0], lie:false, rot:0, spread:.25 }; }
  const s = Math.sin(K.animT * 5) * .5;
  return { lean:9, bob:11 + s * 2, fl:[.55, .1], bl:[-.25, -.75], fa:[.95, 1.6], ba:[.85, 1.5], lie:false, rot:0, spread:.45 };
}
function drawKeeper(K, ex, id = 'fk', look = LOOK.keeper){
  R3.charW(id, look, keeperPose(K), K.x, K.y, K.z, K.g > 0 ? Math.PI : 0, 1, ex || 'angry', false, null, { rx:K.roll });
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
  if (p.dash > 0) return getPose({ dashing:1 });
  if (p.sp > .6) return getPose({ animT:p.animT, vx:p.sp * 100, run:true });
  return getPose({ animT:p.animT, pose:'stand' });
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
    texts:[], conf:[], camPos:new THREE.Vector3(30, 4, 0), camLook:new THREE.Vector3(GL, 1, 0), focus:{ x:GL - 12, z:0 }, fov:40, shake:0, cheer:false, K:newKeeper(), B:null, wall:null, shot:null };
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
    S.aim = { tz:mode === 'penalty' ? 0 : -Math.sign(sp[1] || 1) * 2.2, th:mode === 'freekick' ? 1.9 : .8 };
    S.wall = null;
    if (mode === 'freekick'){ const np = Math.sign(sp[1] || 1) * GW * .55, wx = GL - sp[0], wz = np - sp[1], wl = Math.hypot(wx, wz), wdx = wx / wl, wdz = wz / wl;
      S.wall = { d:9.15, dx:wdx, dz:wdz, cx:sp[0] + wdx * 9.15, cz:sp[1] + wdz * 9.15, nx:-wdz, nz:wdx, jump:0 }; }
    const cx = sp[0] - dx * 11.5, cz = sp[1] - dz * 11.5;
    if (snap){ S.camPos.set(cx, 4.6, cz); S.camLook.set(GL, .2, sp[1] * .3); }
  }
  setup(true);
  function restart(){ stats.retries++; crowdAmb(false); cur = SetPiece3D(def); }
  function launch(){
    S.shot = f3Shot(S.B, S.aim, S.power, { curl:mode === 'freekick' ? .95 : .35 });
    f3Resolve(S.shot, S.K, { wall:S.wall, keeperMul:mode === 'penalty' ? .85 : mode === 'shot' ? .9 : 1, react:mode === 'penalty' ? .06 : null });
    keeperDive(S.K, S.shot.dive || { z:S.K.z, y:1, react:.3 }, S.shot);
    if (S.wall) S.wall.jump = .001;
    SFX.ballKick(); vib(25); S.shots++; S.state = 'shot';
  }
  function event(ev){
    const B = S.B, Sh = S.shot, q = shotPos(Sh, Sh.kev), q0 = shotPos(Sh, Math.max(0, Sh.kev - .02)), k = 1 / (.02 * Sh.dur);
    B.x = q.x; B.y = q.y; B.z = q.z; B.vx = (q.x - q0.x) * k; B.vy = (q.y - q0.y) * k; B.vz = (q.z - q0.z) * k; B.free = true;
    let msg = '', col = '#ffffff';
    if (ev === 'goal'){ S.goals++; S.results.push(1); SFX.net(); SFX.goal(); vib([60, 50, 160]); f3Net(S, 1); msg = 'GOOOL!'; col = '#f2c230'; say(pick(['Gol!', 'Harika vuruş!', 'Köşeye!']), 'Spiker'); confetti(S, 70); S.cheer = true; S.shake = 6; }
    else { S.results.push(0); SFX.ooh();
      if (ev === 'catch'){ B.free = false; B.held = true; S.K.hold = true; SFX.punch(); msg = 'KALECİ YAKALADI!'; }
      else if (ev === 'parry'){ B.vx = -3.5; B.vy = 3.4; B.vz = (Math.sign(B.z - S.K.z) || 1) * 5.5; SFX.punch(); msg = 'KALECİ ÇELDİ!'; }
      else if (ev === 'post' || ev === 'bar'){ B.vx = -5.5; B.vy = ev === 'bar' ? 3 : 1.4; B.vz = -Math.sign(B.z) * 2.4; SFX.post(); msg = ev === 'bar' ? 'ÜST DİREK!' : 'DİREK!'; S.shake = 4; }
      else if (ev === 'wall'){ B.vx = -S.wall.dx * 6; B.vy = 3.2; B.vz = -S.wall.dz * 6 + rand(-2, 2); SFX.punch(); msg = 'BARAJ!'; }
      else msg = ev === 'over' ? 'ÜSTTEN AUT!' : 'AUT!';
    }
    wtext(S, msg, GL - 2, 3.2, B.z * .5, col, ev === 'goal' ? 76 : 44);
    S.state = 'result'; S.stT = ev === 'goal' ? 2.3 : 1.8;
  }
  S.update = dt => {
    if (S.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ S.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)){ crowdAmb(false); toCover(); } } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !S.lost){ S.pauseM = true; showControls(null); return; }
    S.t += dt; S.shake *= Math.pow(.02, dt); keeperUpd(S.K, dt); S.p.animT += dt;
    for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 1.8);
    if (S.lost){ S.lostT += dt; if (tap && S.lostT > .8) restart(); return; }
    const B = S.B, p = S.p;
    if (S.state === 'ready'){
      const I = f3Input(); S.aim.tz = clamp(S.aim.tz + I.ix * dt * 4.2, -4.6, 4.6); S.aim.th = clamp(S.aim.th + I.iy * dt * 2.1, .12, 3.0);
      if (keys.shoot){ if (!S.charging){ S.charging = true; S.power = 0; } S.power = Math.min(1, S.power + dt * .95); }
      else if (S.charging){ S.charging = false; S.state = 'runup'; S.stT = .38; S.rx = p.x; S.rz = p.z; }
      if (S.K.st === 'ready') S.K.z = Math.sin(S.t * 1.6) * (mode === 'penalty' ? .35 : .2) + (mode === 'penalty' ? 0 : clamp(B.z * .12, -1, 1));
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
      camTo(S, sp[0] - dx * 11.5, 4.6, sp[1] - dz * 11.5, GL, .2, sp[1] * .3 + (S.aim.tz - sp[1] * .3) * .15, Math.min(1, dt * 4)); }
    else camTo(S, S.camPos.x, S.camPos.y, S.camPos.z, lerp(GL, B.x, .35), Math.max(.8, B.y * .6), B.z * .6, Math.min(1, dt * 3));
    S.focus = { x:GL - 10, z:B.z * .5 }; void dl;
  };
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
    if (S.state === 'ready'){ powerHud(c, S.power, S.charging ? 'GÜÇ — bırakınca vurur' : '⚽ basılı tut: güç · joystick: hedef');
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

