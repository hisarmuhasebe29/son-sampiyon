'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   cut3d.js — ara sahneler gerçek 3B mekânda
   Hikâye sahneleri artık boyalı düz duvar değil: dövüş alanlarıyla aynı 3B mekânlar (depo, fabrika, karargâh,
   stat, sokak, dojo…) + sahneye özel eşyalar (ekranlar, tuş takımı, kapı, koltuk, masa, dolaplar, kupalar…).
   Canlı eşyalar (güvenlik ekranları, dev ekran, tuş takımı, hoparlör, sürgülü kapı) eski 2D çizimden her kare
   dokuya basılır — durumları (açık / kapalı / hata / maskeli adam) hikâyedeki gibi aynen çalışır.
   WebGL yoksa ya da bir şey ters giderse eski 2D arka plan kullanılır.
   ========================================================= */
const CUT3 = { depo:'depo', fabrika:'fabrika', fabrikaDis:'fabrikaDis', karargah:'karargah', guvenlik:'guvenlik', salon:'salon', eskiOkul:'eskiOkul', gizli:'gizli', stadArka:'stadArka',
  tunel:'tunel', sokak:'sokak', arkaSokak:'arkaSokak', dojo:'dojo', eskiDojo:'dojo', stad:'stad', sehir:'sehir', stadDis:'stadDis', tunelCikis:'tunelCikis', kapi:'kapi', safe:'safe',
  leo:'leo', liderOda:'liderOda', soyunma:'soyunma', tesisDis:'tesisDis', saha:'saha' };
/* sahneye özel eşyalar: [tür, x(px), seçenek] — 2D sahnedeki yerleriyle aynı */
const CUT_PROPS = {
  depo:     [['tablePhotos', 480]],
  guvenlik: [['monitors', 520, { yb:1.05, s:1.05 }], ['desk', 520, { z:.75 }], ['ceilingCam', 110]],
  fabrika:  [['monitors', 330, { yb:1.25, s:1.1 }], ['console', 330], ['servers', 800]],
  kapi:     [['speaker', 420, { yb:2.55 }], ['keypad', 580, { yb:1.05 }], ['door', 660, { yb:0 }]],
  karargah: [['bigscreen', 480, { yb:1.05 }], ['servers', 40], ['servers', 840]],
  liderOda: [['bigscreen', 560, { yb:1.25 }], ['desk', 160, { z:1.1 }], ['chair', 300]],
  safe:     [['window', 120, { yb:1.0 }], ['floorLamp', 430], ['sofa', 600]],
  leo:      [['trophies', 110, { yb:.95 }], ['window', 480, { yb:1.0 }], ['desk', 640, { z:1.0 }]],
  soyunma:  [['banner', 480, { yb:2.5 }]],
  eskiOkul: [['medals', 220, { yb:1.45 }], ['medals', 640, { yb:1.45 }]],
  gizli:    [['bars', 140], ['door', 640, { yb:0 }]],
  dojo:     [['doorSlide', 140]], eskiDojo:[['doorSlide', 140]],
  sehir:    [['car']],
  stad:     [['stadScreen']],
};
/* 2D çizimden dokuya basılan duvar eşyaları: 2D sahnedeki kapladığı alan, ışıklı mı, her kare mi */
const FLAT3 = {
  monitors: { reg:x => [x - 184, 58, 370, 148], glow:1, dyn:1 },
  bigscreen:{ reg:x => [x - 200, 40, 400, 230], glow:1, dyn:1 },
  keypad:   { reg:x => [x - 26, 238, 52, 80], glow:1, dyn:1 },
  speaker:  { reg:x => [x - 96, 96, 192, 140], dyn:1 },
  door:     { reg:x => [x - 12, 128, 244, 344], dyn:1 },
  window:   { reg:x => [x - 6, 84, 192, 162], glow:1 },
  medals:   { reg:x => [x - 92, 108, 184, 124] },
  trophies: { reg:x => [x - 84, 146, 178, 92] },
  banner:   { reg:x => [x - 202, 28, 404, 50] },
};
function cut3Ok(def){ try { return !SAVE.f2d && typeof fight3dOn === 'function' && fight3dOn() && !!CUT3[def.bg] && !!ARENA[CUT3[def.bg]]; } catch(e){ return false; } }
/* buildArena için sahte bölüm: genişlik bir ekran, platform / giriş yok; eşyaların önündeki dekor boşaltılır */
function cutL(def, C){
  const bg = CUT3[def.bg], A = ARENA[bg], w = def.worldW || W, ent3 = [];
  for (const p of CUT_PROPS[def.bg] || []){ const F = FLAT3[p[0]]; let r = F ? F.reg(p[1]) : p[0] === 'servers' ? [p[1] - 50, 0, 100, 0] : p[0] === 'bars' ? [p[1] - 10, 0, 260, 0] : p[0] === 'console' ? [p[1] - 190, 0, 380, 0] : null;
    if (r) for (let x = r[0] + 30; x <= r[0] + r[2] - 30 + .1; x += 70) ent3.push({ x, back:true }); }
  return { def:{ bg, width:w }, key:'cut_' + def.bg, zMin:-A.d, zMax:A.d, plats:[], objs:[], ent3, st:C.st, cut:true, c3:{ mode:'yan' }, p:{ x:480, y:GROUND, z:0 }, time:0 };
}
function cutWallZ(L, kind){ const z0 = L.zMin / 100; return kind === 'street' ? z0 - 3.2 + .02 : kind === 'alley' ? z0 - .3 : kind === 'yard' ? z0 - .4 : z0 - (IPAD[kind] || [.02])[0] + .01; }
/* ---------- eşyaları kur ---------- */
function cutBuildProps(bgKey, L, U, root){
  const { T } = A3(), kind = U.kind, wz = cutWallZ(L, kind), out = [];
  const wood = stdM({ color:'#4a3527', roughness:.6 }), dark = stdM({ color:'#20242c', metalness:.4, roughness:.5 }), steel = stdM({ color:'#8a929c', metalness:.7, roughness:.35 });
  const add = m => { m.userData.dyn = 1; root.add(m); return m; };
  for (const [k, x0, o0] of CUT_PROPS[bgKey] || []){ const o = o0 || {}, x = (x0 || 0) / 100;
    if (FLAT3[k]){ const F = FLAT3[k], [rx, ry, rw, rh] = F.reg(x0), s = o.s || 1, cw = Math.ceil(rw * 1.6), ch = Math.ceil(rh * 1.6);
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      const m = F.glow ? new T.MeshBasicMaterial({ map:tex, transparent:true, alphaTest:.03, toneMapped:false }) : new T.MeshStandardMaterial({ map:tex, transparent:true, alphaTest:.03, roughness:.6 });
      const pw = rw / 100 * s, ph = rh / 100 * s, yb = o.yb != null ? o.yb : (470 - ry - rh) / 100;
      const pl = add(new T.Mesh(new T.PlaneGeometry(pw, ph), m)); pl.position.set((rx + rw / 2) / 100, yb + ph / 2, wz + .11);
      if (F.glow && k !== 'window') add(boxM(pw + .1, ph + .1, .08, dark, (rx + rw / 2) / 100, yb + ph / 2, wz + .04));
      out.push({ flat:1, k, x:x0, rx, ry, rw, rh, cv, ctx:cv.getContext('2d'), tex, dyn:!!F.dyn, drawn:false, mesh:pl }); continue; }
    if (k === 'tablePhotos'){ const z = -.9; add(boxM(2.0, .06, .9, wood, x, .76, z)); for (const dx of [-.9, .9]) for (const dz of [-.38, .38]) add(boxM(.06, .74, .06, wood, x + dx, .37, z + dz));
      for (let i = 0; i < 4; i++){ const tx = aTex('ph' + i, 96, 80, (c, w, h) => { c.fillStyle = '#f4f4f4'; c.fillRect(0, 0, w, h); c.fillStyle = '#cfd8e2'; c.fillRect(6, 6, w - 12, h - 18); try { drawPortrait(c, w / 2, h * .45, 18, i % 2 ? 'mate2' : 'mate', 'neutral'); } catch(e){} });
        const ph = add(new T.Mesh(new T.PlaneGeometry(.34, .28), stdM({ map:tx, roughness:.5 }))); ph.position.set(x - .66 + i * .44, .8, z + .05); ph.rotation.x = -1.25; }
      add(cylM(.025, .3, stdM({ color:'#c0392b' }), x - .12, .92, z - .1, 8)).rotation.z = 1.3; continue; }
    if (k === 'desk'){ const z = wz + (o.z || .9); add(boxM(2.2, .06, .8, wood, x, .76, z)); for (const dx of [-1, 1]) add(boxM(.08, .74, .7, wood, x + dx, .37, z));
      add(boxM(.7, .42, .05, dark, x - .1, 1.0, z - .15)); add(plane(.64, .36, emis('#5ab0ff', 1.3), x - .1, 1.0, z - .12)); add(boxM(.5, .03, .18, dark, x - .1, .8, z + .12)); continue; }
    if (k === 'chair'){ const z = wz + 1.6, cm = stdM({ color:'#2a1520', roughness:.6 }); add(boxM(.55, .1, .55, cm, x, .5, z)); add(boxM(.55, .75, .1, cm, x, .95, z - .27)); add(cylM(.04, .45, steel, x, .25, z, 8)); add(boxM(.6, .04, .08, steel, x, .03, z)); add(boxM(.08, .04, .6, steel, x, .03, z)); continue; }
    if (k === 'sofa'){ const z = wz + .55, sm = stdM({ color:'#6b2f2f', roughness:.85 }); add(boxM(2.3, .45, .9, sm, x, .22, z)); add(boxM(2.3, .55, .22, sm, x, .62, z - .34)); for (const dx of [-1.08, 1.08]) add(boxM(.2, .62, .9, sm, x + dx, .32, z));
      for (const dx of [-.55, .55]) add(boxM(.95, .14, .7, stdM({ color:'#7a3838', roughness:.9 }), x + dx, .5, z + .06)); continue; }
    if (k === 'floorLamp'){ const z = wz + .45; add(cylM(.02, 1.55, dark, x, .78, z, 8)); add(cylM(.2, .04, dark, x, .02, z, 16)); const sh = add(cylM(.16, .3, emis('#ffd8a0', 1.4), x, 1.62, z, 16, .26)); U.lamps.push([x, 1.5, z + .3, '#ffcf90', 6]); continue; }
    if (k === 'ceilingCam'){ const y = 2.9, z = wz + .25; add(boxM(.06, .3, .06, dark, x, y + .15, wz + .05)); add(boxM(.36, .16, .2, stdM({ color:'#d0d4dc', metalness:.3 }), x + .1, y, z)); add(boxM(.1, .1, .05, dark, x + .3, y, z));
      const led = add(boxM(.04, .04, .02, emis('#ff2020', 2), x - .05, y, z + .11, false)); out.push({ led }); continue; }
    if (k === 'servers'){ const z = wz + .35; for (let i = 0; i < 2; i++){ const sx = x - .23 + i * .46; add(boxM(.42, 2.3, .6, stdM({ color:'#0d1117', metalness:.5, roughness:.4 }), sx, 1.15, z));
        const leds = []; for (let j = 0; j < 12; j++){ const l = add(boxM(.04, .04, .02, emis('#2ecc71', 2), sx - .14, .35 + j * .16, z + .31, false)); leds.push(l); add(boxM(.24, .05, .02, stdM({ color:'#1b2230' }), sx + .05, .35 + j * .16, z + .31, false)); } out.push({ leds, i }); } continue; }
    if (k === 'console'){ const z = wz + .5; add(boxM(3.8, .9, .7, stdM({ color:'#2a3038', metalness:.5, roughness:.45 }), x, .45, z)); add(boxM(3.8, .06, .8, dark, x, .92, z + .05));
      for (let i = 0; i < 10; i++) add(boxM(.1, .04, .06, emis(['#ff5a5a', '#7dff9a', '#ffd34d'][i % 3], 1.8), x - 1.6 + i * .35, .96, z + .25, false)); continue; }
    if (k === 'bars'){ const z = wz + 1.3, bm = stdM({ color:'#6b6f75', metalness:.7, roughness:.35 }); add(plane(2.6, 3.2, stdM({ color:'#15130f', roughness:1 }), x + 1.2, 1.6, wz + .04));
      for (let bx = 0; bx <= 2.5; bx += .26) add(cylM(.03, 3.2, bm, x + bx, 1.6, z, 8)); const tb = add(boxM(2.62, .08, .08, bm, x + 1.25, 3.2, z)); add(boxM(2.62, .08, .08, bm, x + 1.25, .05, z));
      for (const bx of [0, 2.5]) add(boxM(.08, 3.2, 1.3, bm, x + bx, 1.6, wz + .65)); continue; }
    if (k === 'doorSlide'){ const z = wz + .03; add(boxM(1.5, 2.6, .1, stdM({ color:'#5a3820', roughness:.7 }), x, 1.3, z)); add(plane(1.18, 2.3, emis('#202838', .35), x, 1.18, z + .055));
      const leaf = add(boxM(1.16, 2.3, .05, stdM({ map:aTex('dsh', 256, 256, TX.shoji), roughness:.8 }), x, 1.18, z + .09)); out.push({ slide:leaf, x0:x }); continue; }
    if (k === 'car'){ const car = carMesh('#0a0a0c', U, 3, -1.7, 0); car.userData.dyn = 1; root.add(car); out.push({ car }); continue; }
    if (k === 'stadScreen'){ const cv = document.createElement('canvas'); cv.width = 512; cv.height = 212; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      const g = new T.Group(); g.userData.dyn = 1; const scr = new T.Mesh(new T.PlaneGeometry(15, 6.2), new T.MeshBasicMaterial({ map:tex, toneMapped:false })); g.add(scr); g.add(boxM(15.6, 6.8, .4, dark, 0, 0, -.25));
      for (const dx of [-5, 5]) g.add(boxM(.15, 8, .15, steel, dx, 6.5, -.3)); g.position.set(4.8, 9.4, -34); root.add(g); out.push({ stad:g, cv, ctx:cv.getContext('2d'), tex }); continue; }
  }
  return out;
}
/* ---------- her kare: canlı eşyalar ---------- */
function cutTickProps(list, st, t, cx){
  for (const P of list){
    if (P.flat){ if (P.drawn && !P.dyn) continue; if (P.dyn && P.drawn && (P.fr = (P.fr || 0) + 1) % 2) continue;
      const c = P.ctx, kx = P.cv.width / P.rw, ky = P.cv.height / P.rh; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, P.cv.width, P.cv.height);
      c.setTransform(kx, 0, 0, ky, -P.rx * kx, -P.ry * ky); try { drawProp(c, P.k, P.x, st, t); } catch(e){} P.tex.needsUpdate = true; P.drawn = true; continue; }
    if (P.led) P.led.material.emissiveIntensity = Math.sin(t * 4) > 0 ? 2.4 : .2;
    if (P.leds) P.leds.forEach((l, j) => { l.material.emissiveIntensity = Math.sin(t * 6 + P.i * 3 + j * 1.7) > .3 ? 2.2 : .15; });
    if (P.slide) P.slide.position.x = P.x0 + (st.doorK || 0) * 1.0;
    if (P.car){ const on = !!st.car; P.car.visible = on; if (on) P.car.position.x = st.car / 100; }
    if (P.stad){ const on = !!st.bigscreen; P.stad.visible = on; P.stad.position.x = cx;
      if (on){ const c = P.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, 512, 212); c.setTransform(512 / 308, 0, 0, 212 / 128, 0, 0);
        try { bigScreenContent(c, 0, 0, 308, 128, st.bigscreen, t, st.bigscreen === 'off' && st.offT != null ? st.offT / .45 : null); } catch(e){} P.tex.needsUpdate = true; } }
  }
}
/* ---------- ışık: arenanın ışık ayarları, güneş ekran ortasında ---------- */
function cutLight(U, st, t, ox, gy, sc, cx){
  const Wd = R3.world(), { T, scene, sun, hemi, fill } = Wd, li = U.light;
  scene.background = U.bg && U.bg.isTexture ? U.bg : (U.bg || new T.Color('#0a0e18'));
  if (U.fogA){ if (!U.fog) U.fog = new T.Fog(U.fogA[0], U.fogA[1] + 4, U.fogA[2] + 8); scene.fog = U.fog; } else scene.fog = null;
  hemi.color.set(li.hemi[0]); hemi.groundColor.set(li.hemi[1]); hemi.intensity = li.hemi[2] * 1.08; sun.color.set(li.sun[0]); sun.intensity = li.sun[1]; fill.intensity = li.fill + .15;
  if (st.alarm && Math.sin(t * 6) > 0){ hemi.color.set('#ff8a8a'); sun.color.set('#ffb0b0'); }
  const d = li.sunDir; sun.position.set(4.8 + d[0] * 12, gy + d[1] * 12, 2 + d[2] * 12); sun.target.position.set(4.8, gy, 0); sun.target.updateMatrixWorld(); R3.shadowBox(10, 8, 50);
  fill.position.set(-1.2, gy + 4, 9);
  const ls = U.lamps.map(l => [Math.abs(l[0] - cx) + Math.abs(l[2]) * .3, l]).sort((a, b) => a[0] - b[0]);
  U.pl.forEach((pl, i) => { const l = ls[i] && ls[i][1]; if (!l){ pl.intensity = 0; return; } pl.position.set(l[0], l[1], l[2]); pl.color.set(l[3]); pl.distance = l[4] * 1.3; pl.intensity = (U.night ? 9 : 5) * (1 - Math.min(.6, ls[i][0] / 30)); });
}
/* ---------- çiz: Cut.draw kameranın kaydırmasını uyguladıktan sonra çağırır ---------- */
function cut3Draw(c, def, C){
  const bgKey = def.bg, L = C.L3 || (C.L3 = cutL(def, C)); L.st = C.st;
  const id = 'cut3_' + bgKey + '_' + (def.worldW || W);
  if (!R3.has(id)) arenaKeep(id); else if (ARENA_LRU[ARENA_LRU.length - 1] !== id) arenaKeep(id);
  const S = R3.custom(id, () => { const { T } = A3(), g = new T.Group(), ar = buildArena(L); g.add(ar); g.userData.ar = ar; g.userData.props = cutBuildProps(bgKey, L, ar.userData, g); return g; });
  const m = c.getTransform(), k = scale * dpr, sc = Math.hypot(m.a, m.b) / k, ox = m.e / k / 100, gy = (540 - scrY(c, GROUND)) / 100;
  S.position.set(ox, gy, 0); S.scale.setScalar(sc);
  const U = S.userData.ar.userData, cx = (4.8 - ox) / sc;
  cutLight(U, C.st, C.t, ox, gy, sc, cx);
  L.time = C.t; arenaTick(L, U, 1 / 60);
  if (U.stad && typeof stadTick === 'function' && U.stad.userData){ const SU = U.stad.userData; try { stadTick(SU, { t:C.t, cheer:!!C.st.cheer, excite:C.st.cheer ? .9 : .3 }, 1 / 60); } catch(e){}
    if (SU.crowdMat){ if (!SU.crowdMesh) U.stad.traverse(o => { if (o.material === SU.crowdMat) SU.crowdMesh = o; }); if (SU.crowdMesh) SU.crowdMesh.visible = C.st.crowdOn !== false; } }
  cutTickProps(S.userData.props, C.st, C.t, cx);
  R3.hideShadowPlane();
  return true;
}
/* stattaki skor tabelası (dev ekran kapalıyken) — 3B sahnenin üstünde */
function cut3Overlay(c, def, st){
  if (def.bg !== 'stad' || st.bigscreen || st.noBoard) return;
  c.fillStyle = 'rgba(12,15,28,.92)'; rr(c, 330, 18, 300, 56, 8); c.fill(); c.strokeStyle = '#f2c230'; c.lineWidth = 2; c.stroke();
  txt(c, (st.teams ? st.teams[0] : 'ANL') + ' ' + (st.score || '0 - 0') + ' ' + (st.teams ? st.teams[1] : 'RKP'), 480, 46, 22, '#ffd34d', 'center', 'bold', 0, 280);
  txt(c, st.minute || "0'", 480, 66, 15, '#ffffff', 'center');
}
