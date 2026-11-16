'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   fight3d.js — 3B dövüş katmanı
   • arkadan takip kamerası (GTA tarzı) + yandan / tepeden seçenekleri
   • joystick kameraya göre: ileri = kameranın baktığı yön
   • gerçekçi iskeletli vücut: dövüş duruşu, yürüyüş/koşu, yumruk serisi (direkt-kroşe-aparkat),
     tekme, süpürme, uçan tekme, silah savurma, blok, darbe alma, yere düşme, kalkma, sersemleme, tırmanma…
   • pozlar kareler arası yumuşak geçişle karışır (kukla gibi sıçramaz)
   ========================================================= */
function fight3dOn(){ return typeof R3 !== 'undefined' && R3.init && R3.init(); }
const PX = 1 / 100;
const X3 = x => x * PX, Y3 = y => (GROUND - y) * PX, Z3 = z => (z || 0) * PX;
const FCAMS = ['arka', 'yan', 'tepe'], FCAM_NAME = { arka:'Arkadan', yan:'Yandan', tepe:'Tepeden' };
const FCAM_BTN = { x:W - 100, y:10, w:42, h:36 };

function fight3dSetup(L){
  const p = L.p;
  L.c3 = { mode:L.camForce || 'tepe', yaw:Math.PI / 2, pos:null, look:null, fov:50, rt:performance.now() };     // açılış daima tepeden; 📹 ile değişir
  // kalabalık (sivil seyirciler) kaldırımlara
  L.crowd3 = (L.def.crowd || []).map((cr, i) => { const back = i % 2 === 0, z = back ? L.zMin - 90 : L.zMax + 90; return { look:LOOK[cr[0]], x:cr[1], z, yaw:back ? -Math.PI / 2 : Math.PI / 2, pose:cr[2] || 'arms', seed:i * 1.7 }; });
}
function fight3dTap(L, t){
  if (inB(FCAM_BTN, t)){ const i = (FCAMS.indexOf(L.c3.mode) + 1) % FCAMS.length; L.c3.mode = FCAMS[i]; if (L.c3.mode === 'arka') L.c3.yaw = L.p.yaw || 0; SFX.click(); L.camMsg = 'KAMERA: ' + FCAM_NAME[L.c3.mode].toUpperCase(); L.camMsgT = 1.4; return true; }
  return false;
}

/* ---------- kamera ---------- */
function angDiff(a, b){ return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
function fight3dCam(L, rdt){
  const C = L.c3, p = L.p, cam = R3.world().cam, near = [];
  const px = X3(p.x), py = Y3(p.y), pz = Z3(p.z);
  for (const e of L.ents){ if (e.dead || e.dummy || e.hide3 || (e.__V3 && e.__V3.hide3) || !sameLevel(e, p)) continue; const d = pdist(e, p); if (d < 700) near.push([d, e]); }
  near.sort((a, b) => a[0] - b[0]);
  let fx = px, fz = pz;
  if (C.mode === 'arka'){
    /* GTA tarzı: kamera hareket yönünü yavaşça takip eder (kameraya doğru koşarken dönmez);
       dururken en yakın rakip görüş açısından çıkarsa en az dönüşle kadraja alır — ani savrulma yok */
    let want = C.yaw, rate = 1.5;
    const vsp = Math.hypot(p.vx, p.vz || 0);
    if (vsp > 60 && !p.atk){ const my = Math.atan2(-(p.vz || 0), p.vx), d = angDiff(my, C.yaw); if (Math.abs(d) < 2.1) want = C.yaw + d; rate = 1.3; }
    else if (near.length && near[0][0] < 520){ const e = near[0][1], ea = Math.atan2(-(e.z - p.z), e.x - p.x), ra = angDiff(ea, C.yaw), lim = .75; if (Math.abs(ra) > lim){ want = C.yaw + Math.sign(ra) * (Math.abs(ra) - lim); rate = 2.2; } }
    else if (L.go && !L.active) want = 0;
    if (L.gate && L.gate.st === 'wait' && vsp < 60){ const ap = gatePt(L, L.gate), ga = Math.atan2(-(ap.z - p.z), ap.x - p.x), rg = angDiff(ga, C.yaw); if (Math.abs(rg) > .6) want = C.yaw + Math.sign(rg) * (Math.abs(rg) - .6); }
    C.yaw += angDiff(want, C.yaw) * Math.min(1, rdt * rate);
    { const ax = Math.cos(C.yaw) >= 0 ? 0 : Math.PI, dv = angDiff(C.yaw, ax), lim = (L.zMax - L.zMin) < 600 ? .5 : .78; if (Math.abs(dv) > lim) C.yaw = ax + Math.sign(dv) * lim; }   // koridor ekseninden fazla sapma
    if (near.length && near[0][0] < 420){ const e = near[0][1]; fx = lerp(px, X3(e.x), .22); fz = lerp(pz, Z3(e.z), .22); }
    const F = { x:Math.cos(C.yaw), z:-Math.sin(C.yaw) }, dist = near.length ? 4.2 : 3.7, h = near.length ? 2.25 : 1.9;
    let cx = clamp(px - F.x * dist, -3, X3(L.def.width || W) + 3), cz = pz - F.z * dist;
    const zl = Z3(L.zMin) + .65, zh = Z3(L.zMax) - .65, c0 = cz; cz = clamp(cz, zl, zh);
    const squeeze = Math.abs(cz - c0);
    C.tPos = [cx, Math.max(py, 0) + h + Math.min(.5, squeeze * .35), cz]; C.tLook = [fx + F.x * 1.4, Math.max(py, 0) + 1.05, fz + F.z * 1.4]; C.tFov = 56;
  } else if (C.mode === 'yan'){
    C.yaw += angDiff(Math.PI / 2, C.yaw) * Math.min(1, rdt * 4);
    if (near.length){ fx = lerp(px, X3(near[0][1].x), .35); }
    C.tPos = [fx, Math.max(py, 0) + 2.5, Math.max(pz, Z3(L.zMin) + 2) + 6.8]; C.tLook = [fx, Math.max(py, 0) + .95, pz - .4]; C.tFov = 46;
  } else {
    C.yaw += angDiff(Math.PI / 2, C.yaw) * Math.min(1, rdt * 4);
    /* bir düşman arka duvardaki kapıdan / merdivenden geliyorsa kamera hafifçe geriye bakar (giriş görünsün) */
    let eb = 0; for (const E of L.ent3 || []) if (E.back && (E.warn > 0 || E.open > .05) && Math.abs(X3(E.x) - px) < 6) eb = 1;
    if (L.entry && !L.entry.done && (L.ent3 || []).some(E => E.entry && E.back)) eb = 1;
    C.eb = (C.eb || 0) + (eb - (C.eb || 0)) * Math.min(1, rdt * 1.6);
    const tz = lerp(pz, Math.max(Z3(L.zMin) - .4, pz - 3), C.eb * .6);
    C.tPos = [px, Math.max(py, 0) + 6.1 + C.eb * .5, tz + 4.7]; C.tLook = [px, Math.max(py, 0) + .55, tz - .25]; C.tFov = 46;
  }
  const k = C.pos ? Math.min(1, rdt * (C.mode === 'arka' ? 5.5 : 4)) : 1;
  if (!C.pos){ C.pos = C.tPos.slice(); C.look = C.tLook.slice(); C.fov = C.tFov; }
  for (let i = 0; i < 3; i++){ C.pos[i] += (C.tPos[i] - C.pos[i]) * k; C.look[i] += (C.tLook[i] - C.look[i]) * Math.min(1, k * 1.4); }
  C.fov += (C.tFov - C.fov) * k;
  const sh = shake * .0045;
  cam.position.set(C.pos[0] + (Math.random() - .5) * sh, C.pos[1] + (Math.random() - .5) * sh, C.pos[2] + (Math.random() - .5) * sh);
  cam.lookAt(C.look[0], C.look[1], C.look[2]);
  cam.fov = C.fov / Math.max(1, FX.zoom || 1); cam.aspect = W / H; cam.zoom = 1; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
}

/* ---------- pozlar (L3: bacaklar · kollar · leğen · omurga · baş) ---------- */
const sq = x => x * x, sstep3 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function Q0(){ return { legs:[{ h:0, k:-.06, a:.03, ab:.07, tw:0 }, { h:0, k:-.06, a:.03, ab:.07, tw:0 }], arms:[{ s:.05, e:.2, ab:.12, tw:0, h:0 }, { s:.05, e:.2, ab:.12, tw:0, h:0 }], pel:{ y:0, yaw:0, roll:0, pitch:0 }, sp:{ pitch:0, yaw:0, roll:0 }, hd:{ pitch:0, yaw:0 } }; }
function Qcopy(Q){ return { legs:Q.legs.map(o => Object.assign({}, o)), arms:Q.arms.map(o => Object.assign({}, o)), pel:Object.assign({}, Q.pel), sp:Object.assign({}, Q.sp), hd:Object.assign({}, Q.hd) }; }
function Qmix(A, B, k){ const m = (a, b) => { for (const key in b){ const va = a[key] == null ? 0 : a[key]; a[key] = va + (b[key] - va) * k; } };
  for (let i = 0; i < 2; i++){ m(A.legs[i], B.legs[i]); m(A.arms[i], B.arms[i]); } m(A.pel, B.pel); m(A.sp, B.sp); m(A.hd, B.hd); return A; }
/* dövüş duruşu: sol ayak önde, kalça yan, yumruklar çene hizasında; hafif sekme */
function poseGuard(t, o = {}){
  const Q = Q0(), b = o.bounce ? Math.abs(Math.sin(t * 6.5)) : 0, br = Math.sin(t * 1.8);
  Q.legs[0] = { h:.34, k:-.44, a:.14, ab:.1, tw:-.1 }; Q.legs[1] = { h:-.2, k:-.36, a:.32, ab:.13, tw:.3 };
  Q.pel = { y:-.06 + .013 * b + .004 * br, yaw:.38, roll:.02, pitch:0 };
  Q.sp = { pitch:-.12 - .02 * br, yaw:-.3, roll:-.02 }; Q.hd = { pitch:.08, yaw:-.08 };
  Q.arms[0] = { s:.5 + .03 * br, e:2.05, ab:.16, tw:.12, h:-.15 }; Q.arms[1] = { s:.32 + .03 * br, e:2.3, ab:.2, tw:.15, h:-.15 };
  return Q;
}
function poseRelax(t, seed){ return BODY.idle(t, { seed }).L3; }
/* hazır duruş: yumruklar göğüs hizasında, dirsekler aşağıda (eller havada dolaşmaz) */
function poseReady(t, seed){ const Q = poseGuard(t), br = Math.sin(t * 1.8 + (seed || 0));
  Q.arms[0] = { s:.3 + .02 * br, e:1.5, ab:.17, tw:.08, h:-.1 }; Q.arms[1] = { s:.16 + .02 * br, e:1.68, ab:.19, tw:.1, h:-.1 };
  Q.pel.y = -.045; Q.pel.yaw = .3; Q.sp.yaw = -.24; Q.sp.pitch = -.08; Q.hd.pitch = .05; return Q; }
function poseMove(f, sp, guard, back){
  f.gph = (f.gph || 0) + (f.__dt || .016) * Math.PI * 2 * (.85 + .1 * Math.min(8, sp));
  const Q = BODY.gait(f.gph, sp, { back:back ? 1 : 0 }).L3;
  if (guard){ const g = poseReady(f.animT || 0); for (let i = 0; i < 2; i++){ Q.arms[i] = Object.assign({}, g.arms[i]); Q.arms[i].s += Q.legs[1 - i].h * .12; } Q.sp.pitch -= .04; }
  return Q;
}
/* saldırılar: k = 0..1 ilerleme; ext = uzanma eğrisi (hızlı çıkış, yavaş dönüş) */
const extK = (k, p = .38) => k < p ? sstep3(0, 1, k / p) : 1 - sstep3(0, 1, (k - p) / (1 - p));
function poseAttack(anim, k, f, combo){
  const Q = poseGuard(f.animT || 0), x = extK(k);
  switch (anim){
    case 'punch': {
      if (combo === 2){ // kroşe / ağır vuruş: kol yanda yay çizer, gövde döner
        const a = Q.arms[0]; a.s = lerp(.5, 1.42, x); a.ab = lerp(.16, 1.05, x); a.e = lerp(2.05, 1.45, x); a.tw = lerp(.12, -.4, x);
        Q.pel.yaw = lerp(.38, -.42, x); Q.sp.yaw = lerp(-.3, .12, x); Q.pel.y -= .05 * x; Q.legs[1].tw = lerp(.3, -.35, x); Q.legs[1].a = lerp(.32, .55, x); Q.hd.yaw = lerp(-.08, .2, x);
      } else if (combo === 1){ // düz (arka el)
        const a = Q.arms[1]; a.s = lerp(.32, 1.56, x); a.e = lerp(2.3, .1, x); a.ab = lerp(.2, .02, x); a.tw = lerp(.15, -.2, x);
        Q.arms[0].s -= .15 * x; Q.arms[0].e += .2 * x;
        Q.pel.yaw = lerp(.38, -.32, x); Q.sp.yaw = lerp(-.3, -.06, x); Q.sp.pitch -= .1 * x; Q.legs[1].tw = lerp(.3, -.4, x); Q.legs[1].a = lerp(.32, .6, x); Q.legs[1].k -= .1 * x; Q.legs[0].k -= .12 * x;
      } else { // direkt (ön el)
        const a = Q.arms[0]; a.s = lerp(.5, 1.56, x); a.e = lerp(2.05, .12, x); a.ab = lerp(.16, .04, x); a.tw = lerp(.12, -.15, x);
        Q.pel.yaw = lerp(.38, .24, x); Q.sp.yaw = lerp(-.3, -.36, x); Q.sp.pitch -= .06 * x; Q.legs[0].h += .08 * x;
      } break; }
    case 'kick': { // döner tekme: bacak toplanır → uzanır → geri
      const ch = sstep3(0, .3, k), ex = k < .3 ? 0 : k < .55 ? sstep3(.3, .55, k) : 1 - sstep3(.55, 1, k), up = Math.max(ch * (1 - sstep3(.6, 1, k)), ex);
      Q.legs[0] = { h:lerp(.34, 1.45, up), k:lerp(-.44, -1.9, ch) * (1 - ex) + -.12 * ex, a:.4, ab:.45 * up, tw:-.3 * up };
      Q.legs[1] = { h:-.08, k:-.28, a:.22, ab:.08, tw:lerp(.3, .9, up) };
      Q.pel.yaw = lerp(.38, -.55, up); Q.pel.roll = .22 * up; Q.pel.y = -.04; Q.sp.pitch = lerp(-.12, .3, up); Q.sp.roll = -.18 * up; Q.sp.yaw = lerp(-.3, .25, up);
      Q.arms[1].s = lerp(.78, .25, up); Q.arms[1].e = lerp(2.25, 1.1, up); Q.arms[1].ab = lerp(.3, .55, up); Q.hd.pitch = lerp(.08, -.1, up); break; }
    case 'upper': { const c = sstep3(0, .3, k), r = sstep3(.25, .5, k) * (1 - sstep3(.7, 1, k));
      Q.pel.y = lerp(-.06, -.2, c * (1 - r)) + .04 * r; Q.legs[0].k = lerp(-.44, -1.0, c * (1 - r)); Q.legs[1].k = lerp(-.36, -.95, c * (1 - r)); Q.legs[0].h += .3 * c * (1 - r); Q.legs[1].a = .5;
      const a = Q.arms[1]; a.s = lerp(.5, 2.35, r); a.e = lerp(2.0, 1.05, r); a.ab = .12; a.tw = -.3;
      Q.sp.pitch = lerp(-.38 * c, .22, r); Q.pel.yaw = lerp(.38, -.25, r); Q.sp.yaw = lerp(-.3, -.05, r); Q.hd.pitch = lerp(.2, -.15, r); break; }
    case 'sweep': { const s = sstep3(0, .25, k) * (1 - sstep3(.8, 1, k));
      Q.pel.y = -.52 * s; Q.legs[1] = { h:lerp(-.2, 1.25, s), k:lerp(-.36, -2.35, s), a:.6, ab:.15, tw:.2 };
      Q.legs[0] = { h:lerp(.34, .2, s), k:lerp(-.44, -.08, s), a:.1, ab:lerp(.1, 1.15, s), tw:0 };
      Q.sp.pitch = -.45 * s; Q.arms[1].s = lerp(.78, 1.0, s); Q.arms[1].e = lerp(2.25, .35, s); Q.arms[0].s = lerp(.98, .4, s); Q.arms[0].ab = lerp(.2, .9, s); Q.hd.pitch = .35 * s; break; }
    case 'flykick': case 'air': {
      Q.legs[0] = { h:1.35, k:-.12, a:.45, ab:.12, tw:0 }; Q.legs[1] = { h:.55, k:-1.85, a:.5, ab:.12, tw:0 };
      Q.sp.pitch = .32; Q.pel.yaw = -.2; Q.sp.yaw = .1; Q.arms[0] = { s:.4, e:.9, ab:.85, tw:0, h:0 }; Q.arms[1] = { s:.2, e:.6, ab:.9, tw:0, h:0 }; Q.hd.pitch = -.12; break; }
    case 'shoot': { // futbol vuruşu (Issem): geri salınım → vuruş → takip
      const bk = k < .35 ? sstep3(0, .35, k) : 0, sw = k < .35 ? 0 : sstep3(.35, .62, k), fo = sstep3(.62, 1, k);
      const kl = Q.legs[1]; kl.h = lerp(lerp(-.1, -.95, bk), 1.45, sw) - .35 * fo; kl.k = (bk > 0 && sw === 0) ? lerp(-.2, -1.7, bk) : lerp(-1.6, -.12, sw); kl.a = .45; kl.ab = .1; kl.tw = 0;
      Q.legs[0] = { h:.15, k:-.32, a:.12, ab:.12, tw:0 };
      Q.pel.yaw = lerp(.1, -.4, sw); Q.sp.yaw = lerp(.15, -.2, sw); Q.sp.pitch = lerp(-.1, .2, sw); Q.pel.y = -.05;
      Q.arms[0] = { s:lerp(.5, .9, sw), e:.6, ab:.95, tw:0, h:0 }; Q.arms[1] = { s:lerp(.2, -.4, sw), e:.5, ab:.8, tw:0, h:0 }; Q.hd.pitch = .25; break; }
    case 'swing': { const up = sstep3(0, .3, k), dn = sstep3(.28, .55, k), back = sstep3(.7, 1, k);
      const a = Q.arms[0]; a.s = lerp(lerp(.98, 2.85, up), .7, dn) + .3 * back; a.e = lerp(lerp(1.95, 1.3, up), .25, dn); a.ab = lerp(.2, .45, up) - .3 * dn; a.tw = lerp(.35, -.5, dn);
      Q.arms[1].s = lerp(.78, 2.4, up * (1 - dn)); Q.arms[1].e = 1.2;
      Q.sp.yaw = lerp(-.45, .35, dn); Q.pel.yaw = lerp(.5, -.3, dn); Q.sp.pitch = lerp(.12, -.3, dn); Q.legs[0].h += .2 * dn; Q.legs[0].k -= .25 * dn; break; }
    case 'throw': { const up = sstep3(0, .35, k), fw = sstep3(.3, .6, k);
      for (const a of Q.arms){ a.s = lerp(lerp(.9, 2.9, up), 1.35, fw); a.e = lerp(lerp(1.9, 1.2, up), .15, fw); a.ab = .22; a.tw = 0; }
      Q.sp.pitch = lerp(.25 * up, -.3, fw); Q.pel.yaw = 0; Q.sp.yaw = 0; Q.legs[0].h = lerp(.34, .55, fw); break; }
    case 'spin': {
      Q.legs[0] = { h:.55, k:-.12, a:.4, ab:1.25, tw:0 }; Q.legs[1] = { h:.1, k:-.5, a:.3, ab:.1, tw:0 }; Q.pel.yaw = 0; Q.sp.yaw = 0; Q.sp.pitch = .1;
      Q.arms[0] = { s:.3, e:.4, ab:1.3, tw:0, h:0 }; Q.arms[1] = { s:.3, e:.4, ab:1.3, tw:0, h:0 }; break; }
  }
  return Q;
}
/* düşman vuruş hazırlığı (kırmızı yanıp sönerken) ve vuruş anı */
function poseWind(e, w){
  const Q = poseGuard(e.animT || 0), tr = Math.sin((e.animT || 0) * 40) * .03;
  if (e.move === 'slam'){ for (const a of Q.arms){ a.s = 2.9 + tr; a.e = .55; a.ab = .3; a.tw = 0; } Q.sp.pitch = .25; Q.pel.y = -.02; Q.pel.yaw = 0; Q.sp.yaw = 0; Q.hd.pitch = -.15; return Q; }
  if (e.move === 'leap'){ Q.pel.y = -.2; Q.legs[0].k = -1.2; Q.legs[1].k = -1.1; Q.legs[0].h = .7; Q.sp.pitch = -.35; Q.arms[0].s = -.4; Q.arms[1].s = -.5; Q.hd.pitch = .3; return Q; }
  if (e.move === 'dash' || e.move === 'rush'){ Q.pel.y = -.14; Q.sp.pitch = -.48; Q.legs[0].h = .6; Q.legs[0].k = -1.1; Q.legs[1].h = -.35; Q.legs[1].k = -.7; Q.arms[0].s = .3; Q.arms[0].ab = .6; Q.arms[1].s = -.3; Q.arms[1].e = 1.2; Q.hd.pitch = .35; return Q; }
  if (e.weapon){ const a = Q.arms[0]; a.s = 2.8 + tr; a.e = 1.3; a.ab = .45; a.tw = .2; Q.sp.yaw = -.45; Q.pel.yaw = .5; Q.sp.pitch = .12; return Q; }
  if (e.T && e.T.kick){ Q.legs[0] = { h:1.05, k:-1.85, a:.45, ab:.3, tw:-.2 }; Q.legs[1].k = -.3; Q.sp.pitch = .18; Q.pel.yaw = .1; return Q; }
  const a = Q.arms[1]; a.s = -.35 + tr; a.e = 1.75; a.ab = .45; a.tw = .3; Q.pel.yaw = .62; Q.sp.yaw = -.42; Q.sp.pitch = .05; return Q;
}
function poseStrike(e, k){
  if (e.move === 'slam'){ const Q = poseGuard(e.animT || 0); for (const a of Q.arms){ a.s = .7; a.e = .35; a.ab = .25; } Q.pel.y = -.28; Q.legs[0].k = -1.0; Q.legs[1].k = -.9; Q.sp.pitch = -.55; Q.hd.pitch = .45; return Q; }
  if (e.weapon) return poseAttack('swing', .45 + k * .3, e, 0);
  if (e.T && e.T.kick){ const Q = poseAttack('kick', .45, e, 0); return Q; }
  return poseAttack('punch', .36, e, 1);
}
/* darbe alma katmanı: geriye savrulma, baş geri, kollar açılır */
function addHit(Q, f, kk){
  const F = fwdOf(f), hv = f.hitV || { x:-F.x, z:-F.z }, along = hv.x * F.x + hv.z * F.z, side = -hv.x * F.z + hv.z * F.x, s = kk * (f.hitK || .8);
  Q.sp.pitch += -.42 * along * s; Q.sp.roll += .35 * side * s; Q.sp.yaw += .3 * side * s; Q.hd.pitch += -.38 * along * s; Q.hd.yaw += .45 * side * s;
  Q.pel.y -= .03 * s; Q.legs[1].h -= .25 * s * Math.max(0, -along); Q.legs[1].k -= .2 * s;
  for (const a of Q.arms){ a.s = lerp(a.s, .35, s * .7); a.e = lerp(a.e, 1.0, s * .7); a.ab = lerp(a.ab, .6, s * .6); }
  return Q;
}
function poseBlock(t, kick){ const Q = poseGuard(t);
  Q.arms[0] = { s:1.42, e:2.42, ab:-.06, tw:.55, h:0 }; Q.arms[1] = { s:1.32, e:2.46, ab:-.02, tw:.55, h:0 };
  Q.sp.pitch = -.16 - .1 * kick; Q.hd.pitch = .22; Q.pel.y = -.08 - .02 * kick; Q.pel.yaw = .3; Q.sp.yaw = -.25; return Q; }
function poseDizzy(t){ const Q = Q0(), w = Math.sin(t * 4), w2 = Math.sin(t * 2.6);
  Q.legs[0] = { h:.12 + .1 * w, k:-.32, a:.15, ab:.14, tw:0 }; Q.legs[1] = { h:-.08 - .1 * w, k:-.36, a:.18, ab:.14, tw:0 };
  Q.sp = { pitch:-.15 + .12 * w2, yaw:.2 * w, roll:.22 * w }; Q.hd = { pitch:.25 + .15 * w2, yaw:-.3 * w };
  Q.arms[0] = { s:.15 + .15 * w, e:.35, ab:.25, tw:0, h:0 }; Q.arms[1] = { s:.1 - .15 * w, e:.3, ab:.22, tw:0, h:0 }; Q.pel.y = -.05; return Q; }
function poseLie(t, dead){ const Q = Q0(), b = dead ? 0 : Math.sin(t * 2) * .05;
  Q.legs[0] = { h:.15, k:-.25, a:.2, ab:.18, tw:.1 }; Q.legs[1] = { h:.55 + b, k:-1.1, a:.25, ab:.2, tw:-.1 };
  Q.arms[0] = { s:.4, e:.5, ab:1.15, tw:0, h:0 }; Q.arms[1] = { s:1.2, e:.9, ab:.75, tw:0, h:0 }; Q.hd = { pitch:dead ? .1 : -.15 + b, yaw:.4 }; return Q; }
function poseKneel(k){ const Q = Q0();
  Q.legs[0] = { h:1.45, k:-1.65, a:.25, ab:.1, tw:0 }; Q.legs[1] = { h:-.05, k:-2.3, a:.9, ab:.1, tw:0 };
  Q.pel.y = -.44 * (1 - k); Q.sp.pitch = -.35; Q.hd.pitch = .2; Q.arms[0] = { s:.85, e:.7, ab:.2, tw:0, h:0 }; Q.arms[1] = { s:.3, e:.5, ab:.35, tw:0, h:0 }; return Q; }
function poseClimb(t){ const Q = Q0(), s = Math.sin(t * 9);
  Q.arms[0] = { s:2.7 + s * .35, e:.75 - s * .3, ab:.25, tw:0, h:0 }; Q.arms[1] = { s:2.7 - s * .35, e:.75 + s * .3, ab:.25, tw:0, h:0 };
  Q.legs[0] = { h:.8 + s * .5, k:-1.4 - s * .3, a:.3, ab:.12, tw:0 }; Q.legs[1] = { h:.8 - s * .5, k:-1.4 + s * .3, a:.3, ab:.12, tw:0 }; Q.sp.pitch = -.12; Q.hd.pitch = -.3; return Q; }
function poseCarry(Q){ for (const a of Q.arms){ a.s = 2.95; a.e = .4; a.ab = .32; a.tw = 0; } Q.sp.pitch = .05; return Q; }
function poseSlide(){ const Q = Q0();
  Q.legs[0] = { h:1.45, k:-.06, a:.35, ab:.1, tw:0 }; Q.legs[1] = { h:.2, k:-2.0, a:.5, ab:.18, tw:0 }; Q.pel.y = -.58;
  Q.sp.pitch = .55; Q.hd.pitch = -.35; Q.arms[0] = { s:-.5, e:.3, ab:.55, tw:0, h:0 }; Q.arms[1] = { s:.5, e:.6, ab:.6, tw:0, h:0 }; return Q; }
function poseAir(f){ const Q = Q0(), up = (f.vy || 0) < 0;
  Q.legs[0] = { h:up ? .85 : .5, k:up ? -1.45 : -.6, a:.3, ab:.12, tw:0 }; Q.legs[1] = { h:up ? .25 : .1, k:up ? -.8 : -.3, a:.3, ab:.12, tw:0 };
  Q.arms[0] = { s:1.0, e:1.2, ab:.5, tw:0, h:0 }; Q.arms[1] = { s:.6, e:1.0, ab:.55, tw:0, h:0 }; Q.sp.pitch = up ? -.1 : .05; return Q; }
function poseDash(f){ const sp = 8; f.gph = (f.gph || 0) + (f.__dt || .016) * Math.PI * 2 * 1.6; const Q = BODY.gait(f.gph, sp).L3; Q.sp.pitch -= .3; Q.arms[0].s = .55; Q.arms[0].ab = .7; Q.arms[0].e = 1.4; Q.hd.pitch += .25; return Q; }

/* bir dövüşçünün (oyuncu / düşman) bu karedeki pozu + gövde dönüşü */
function fighterPose3(L, f, isE){
  const t = f.animT || 0, v = f.__S3 ? f.__V3 : f, sp = Math.hypot(v.vx || 0, v.vz || 0) * PX;
  let Q, body = { x:0, y:0, z:0, lift:0 }, fast = false;
  const fall = v.fallV || { x:-fwdOf(f).x, z:-fwdOf(f).z }, F = fwdOf(f), backFall = (fall.x * F.x + fall.z * F.z) < 0;
  const lieA = backFall ? Math.PI / 2 : -Math.PI / 2;
  if (v.grabbedBy || v.grabbed){ Q = poseLie(t * 3); body.z = -Math.PI / 2; body.lift = .12; Q.legs[0].h += Math.sin(t * 12) * .3; Q.arms[0].s += Math.sin(t * 11) * .4; fast = true; }
  else if (v.dead || v.down > 0){ const airK = v.onGround ? 1 : clamp(1 - (v.down > 0 ? v.down - .55 : .5), .25, 1);
    Q = poseLie(t, v.dead); body.z = lieA * (v.onGround ? 1 : sstep3(0, 1, airK)); body.lift = v.onGround ? .13 : 0; fast = !v.onGround; }
  else if (v.getup > 0){ const k = 1 - clamp(v.getup / .35, 0, 1); Q = poseKneel(k); body.z = lieA * .55 * (1 - sstep3(0, .55, k)); fast = true; }
  else if (v.climb || v.climbG){ Q = poseClimb(t); }
  else if (v.dive){ Q = Q0(); for (const a of Q.arms){ a.s = 2.95; a.e = .15; a.ab = .15; } Q.legs[0].h = -.1; Q.legs[1].h = -.25; Q.legs[1].k = -.5; body.z = -1.3; fast = true; }
  else if (v.roll > 0 && v.roll < 1){ Q = poseAir({ vy:-1 }); body.z = -v.roll * Math.PI * 2; body.lift = .5; fast = true; }
  else if (v.slideT > 0){ Q = poseSlide(); body.z = .2; fast = true; }
  else if (v.dashing > 0){ Q = poseDash(f); fast = true; }
  else if (v.dizzy > 0){ Q = poseDizzy(t); body.x = Math.sin(t * 4) * .06; }
  else if (v.atk && v.atk.m){ const m = v.atk.m, k = clamp(v.atk.t / m.dur, 0, 1); fast = true;
    Q = poseAttack(m.anim, k, f, v.atk.combo || 0);
    if (m.anim === 'flykick'){ body.z = .45; }
    if (m.anim === 'spin'){ body.y = k * Math.PI * 4; body.lift = .25 * Math.sin(k * Math.PI); }
    if (m.anim === 'sweep'){ body.y = -sstep3(.15, .75, k) * Math.PI * 1.6; } }
  else if (isE && v.leaping > 0 && !v.onGround){ Q = poseAttack(f.T && f.T.kick ? 'flykick' : 'air', .4, f, 0); if (f.T && f.T.kick) body.z = .35; fast = true; }
  else if (isE && v.wind > 0){ Q = poseWind(f, v.wind); fast = true; }
  else if (isE && v.strike > 0){ Q = poseStrike(f, 1 - v.strike / .2); fast = true; }
  else if (v.blocking){ Q = poseBlock(t, v.blockT3 > 0 ? v.blockT3 / .2 : 0); fast = true; }
  else if (v.onGround === false && !(v.vy === 0)){ Q = poseAir(v); }
  else if (v.carry || v.carryE){ Q = poseCarry(sp > .4 ? poseMove(f, sp, false) : poseRelax(t, 1)); }
  else if (v.stun > 0 && isE){ Q = poseRelax(t, f.uid); }
  else {
    /* kavgaya hazır mı? oyuncu: az önce vurduysa · düşman: menzile girip saldırmak üzereyse */
    /* eller yalnız vuruş / blok / saldırı hazırlığında kalkar; yürürken ve beklerken doğal duruş */
    if (sp > .45) Q = poseMove(f, sp, false);
    else if (L.done && !isE){ Q = poseGuard(t); for (const a of Q.arms){ a.s = 2.8 + Math.sin(t * 7) * .15; a.e = .4; a.ab = .35; } Q.pel.yaw = 0; Q.sp.yaw = 0; }
    else Q = poseRelax(t, isE ? f.uid : 0);
  }
  if (v.hitT3 > 0 && !(v.dead || v.down > 0)) { addHit(Q, f, clamp(v.hitT3 / .32, 0, 1)); fast = true; }
  if (v.stun > 0 && !(v.dead || v.down > 0)) addHit(Q, f, .5);
  return { Q, body, fast };
}
/* pozu yumuşat (önceki kareyle karıştır) ve çiz */
function drawFighter3(L, f, id, isE, rdt){
  f.__dt = rdt;
  const R0 = fighterPose3(L, f, isE), k = Math.min(1, rdt * (R0.fast ? 26 : 13));
  f.__Q = f.__Q ? Qmix(f.__Q, R0.Q, k) : Qcopy(R0.Q);
  const B = f.__B || (f.__B = { x:0, y:0, z:0, lift:0 }); for (const key of ['x', 'z', 'lift']) B[key] += (R0.body[key] - B[key]) * Math.min(1, rdt * (R0.fast ? 18 : 10)); B.y = R0.body.y;
  const P = { lean:0, bob:0, fl:[0, 0], bl:[0, 0], fa:[0, 0], ba:[0, 0], L3:f.__Q };
  const tint = null;
  if (isE && f.wind > 0 && !f.dead){ const col = f.move === 'slam' ? '#ffa000' : f.move === 'dash' || f.move === 'rush' ? '#ff2ad4' : '#ff2a2a';
    const ring = R3.custom('wr' + f.uid, () => { const { T } = R3.world(); const m = new T.Mesh(new T.RingGeometry(.42, .62, 40), new T.MeshBasicMaterial({ color:'#ff2a2a', transparent:true, opacity:.85, depthWrite:false, side:T.DoubleSide, toneMapped:false })); m.rotation.x = -Math.PI / 2; m.userData.keep = 1; return m; });
    ring.material.color.set(col); ring.position.set(X3(f.x), Y3(f.y) + .02, Z3(f.z)); const pk = 1 + .18 * Math.sin(gameTime * 26); ring.scale.setScalar((f.look.scale || 1) * pk); ring.material.opacity = .55 + .35 * Math.abs(Math.sin(gameTime * 13)); }
  const sink = f.dead ? sstep3(1.2, 1.8, f.deadT || 0) * .3 : 0;
  const hold = fHold(f, true), sc = f.look.scale || 1;
  const s3 = f.look.scale3 ? f.look.scale3 / (f.look.scale || 1) : 1;      // 3B'de iri adamlar daha geniş, aşırı uzun değil
  const R = R3.charW(id, f.look, P, X3(f.x), Y3(f.y) + B.lift - sink, Z3(f.z), (f.yaw || 0) + B.y, s3, exprOf(f), false, hold, { tint });
  R.body.rotation.set(B.x, 0, B.z); if (Math.abs(B.z) > .3) R.body.position.y = Math.abs(Math.sin(B.z)) * .12 * sc;
  return R;
}

/* ---------- eşya / yerde duranlar / mermiler ---------- */
function pickMesh3(id, build){ return R3.custom(id, build); }
function weaponMesh3(kind){ const { T, mat, mesh } = R3.world(), g = new T.Group();
  if (kind === 'sopa'){ const m = mesh('cyl', mat('#9a6a3a'), .024, .62, .024, 0, 0, 0); m.rotation.z = Math.PI / 2; g.add(m); const t = mesh('cyl', mat('#9a6a3a'), .036, .22, .036, .26, 0, 0); t.rotation.z = Math.PI / 2; g.add(t); }
  else if (kind === 'boru'){ const m = mesh('cyl', mat('#8a929c', { metalness:.7, roughness:.3 }), .026, .66, .026, 0, 0, 0); m.rotation.z = Math.PI / 2; g.add(m); }
  else { g.add(mesh('cyl', mat('#2e8b57', { transparent:true, opacity:.85, roughness:.1 }), .04, .18, .04, 0, .09, 0)); g.add(mesh('cyl', mat('#2e8b57'), .016, .08, .016, 0, .22, 0)); }
  return g; }
function hpMesh3(){ const { T, mat, mesh } = R3.world(), g = new T.Group(); g.add(mesh('box', mat('#e8eef5', { roughness:.4 }), .26, .18, .18, 0, .09, 0)); g.add(mesh('box', mat('#e53935', { emissive:new T.Color('#e53935'), emissiveIntensity:.5 }), .06, .2, .19, 0, .09, 0)); g.add(mesh('box', mat('#e53935', { emissive:new T.Color('#e53935'), emissiveIntensity:.5 }), .2, .06, .19, 0, .09, 0)); g.add(mesh('box', mat('#9aa4ae'), .1, .03, .05, 0, .19, 0)); return g; }
function glowRing3(id, col){ return R3.custom(id, () => { const { T } = R3.world(); const m = new T.Mesh(new T.RingGeometry(.22, .3, 32), new T.MeshBasicMaterial({ color:col, transparent:true, opacity:.75, depthWrite:false, side:T.DoubleSide, toneMapped:false })); m.rotation.x = -Math.PI / 2; m.userData.keep = 1; return m; }); }
function drawProps3(L){
  const t = gameTime;
  for (const o of L.objs){ if (o.broken || o.held) continue; const sh = o.shakeT > 0 ? Math.sin(t * 80) * .02 : 0;
    const r = R3.objW('o' + o.uid, o.t, X3(o.x) + sh, Y3(o.y), Z3(o.z), 0, o.w * PX, o.h * PX); r.rotation.set(0, o.rot || 0, 0); }
  L.pickups.forEach((k, i) => { const id = 'pk' + i + k.kind + (k.w || ''), bob = Math.sin(k.t * 4) * .03;
    const g = pickMesh3(id, () => k.kind === 'hp' ? hpMesh3() : weaponMesh3(k.w));
    g.position.set(X3(k.x), Y3(k.y) + (k.kind === 'hp' ? .02 + bob : .04), Z3(k.z)); g.rotation.set(0, k.kind === 'hp' ? t * 1.6 : (k.x * .01) % 3, 0);
    const ring = glowRing3('pr' + i, k.kind === 'hp' ? '#7dff9a' : '#f2c230'); ring.position.set(X3(k.x), Y3(k.y) + .015, Z3(k.z)); ring.scale.setScalar(1 + .12 * Math.sin(t * 6)); ring.material.opacity = .45 + .3 * Math.sin(t * 6); });
  L.proj.forEach((b, i) => { const X = X3(b.x), Y = Y3(b.y), Z = Z3(b.z);
    if (b.kind === 'ball' || b.kind === 'fire'){ const r = R3.objW('pj' + i + b.kind, b.kind, X, Y + (b.kind === 'ball' ? .1 : 0), Z, b.spin * .2); if (b.kind === 'fire') r.rotation.set(0, Math.atan2(-(b.vz || 0), b.vx), 0); }
    else if (b.kind === 'obj'){ const D = OBJ[b.obj], r = R3.objW('pj' + i + b.obj, b.obj, X, Y - D.h * PX / 2, Z, b.spin * .12, D.w * PX, D.h * PX); r.rotation.y = b.spin * .07; }
    else { const g = pickMesh3('pw' + i + b.w, () => weaponMesh3(b.w)); g.position.set(X, Y, Z); g.rotation.set(b.spin * .2, Math.atan2(-(b.vz || 0), b.vx), b.spin * .35); } });
  (L.debris || []).forEach((q, i) => { const m = R3.custom('db' + i, () => { const { T } = R3.world(); const b = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color:'#a0723f', roughness:.8 })); b.castShadow = true; return b; });
    m.material.color.set(q.col); m.scale.set(Math.max(.02, q.w * PX), Math.max(.02, q.h * PX), Math.max(.02, q.d * PX)); m.position.set(X3(q.x), Y3(q.y), Z3(q.z)); m.rotation.set(q.rx, q.ry, 0); const k = Math.min(1, q.life / .6); if (k < 1) m.scale.multiplyScalar(k); });
  L.shocks.forEach((s, i) => { const g = R3.custom('sk' + i, () => { const { T } = R3.world(); const m = new T.Mesh(new T.RingGeometry(.86, 1, 48), new T.MeshBasicMaterial({ color:'#ffb24d', transparent:true, opacity:.8, depthWrite:false, side:T.DoubleSide, toneMapped:false })); m.rotation.x = -Math.PI / 2; m.userData.keep = 1; return m; });
    g.position.set(X3(s.x), Y3(s.y) + .03, Z3(s.z)); g.scale.setScalar(Math.max(.05, s.r * PX)); g.material.opacity = Math.min(.85, s.life); });
}

/* ---------- ekran katmanı: dünya noktasını ekrana yansıt ---------- */
const prj = (x, y, z) => R3.project(X3(x), Y3(y), Z3(z));
function overlay3(c, L){
  const t = gameTime;
  // parçacıklar
  for (const q of L.parts){ const P = prj(q.x, q.y, q.z); if (P.behind) continue; const a = Math.min(1, q.life / (q.type === 'streak' ? .14 : .25)); c.globalAlpha = a; c.fillStyle = q.col; c.strokeStyle = q.col;
    if (q.type === 'streak'){ const P2 = prj(q.x - q.vx * .035, q.y - q.vy * .035, (q.z || 0) - (q.vz || 0) * .035); c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P2.x, P2.y); c.stroke(); }
    else if (q.type === 'star') drawStar(c, P.x, P.y, 6);
    else if (q.type === 'chip'){ c.save(); c.translate(P.x, P.y); c.rotate(q.r); c.fillRect(-4, -2, 8, 4); c.restore(); }
    else if (q.type === 'glass'){ c.save(); c.translate(P.x, P.y); c.rotate(q.r); c.beginPath(); c.moveTo(0, -4); c.lineTo(3, 3); c.lineTo(-3, 3); c.fill(); c.restore(); }
    else if (q.type === 'dust'){ c.globalAlpha = a * .7; c.beginPath(); c.arc(P.x, P.y, 5 + (1 - q.life) * 12, 0, 7); c.fill(); }
    else c.fillRect(P.x - 2, P.y - 2, 4, 4); }
  c.globalAlpha = 1;
  // darbe parlamaları ve şok halkaları
  for (const b of L.bursts){ const P = prj(b.x, b.y, b.z); if (!P.behind) burst(c, P.x, P.y, (b.big ? 26 : 17) * (1 + b.t * 4), b.big ? '#ffffff' : '#fff3a0', 1 - b.t / .18); }
  const fx = L.fx; if (fx) for (const r of fx.rings){ const k = r.t / .35, P = prj(r.x, r.y, r.z); if (P.behind) continue; c.globalAlpha = (1 - k) * .85; c.strokeStyle = r.big ? '#f2c230' : '#ffffff'; c.lineWidth = (r.big ? 8 : 4) * (1 - k) + 1;
    c.beginPath(); c.ellipse(P.x, P.y, (r.big ? 120 : 56) * (.25 + k), (r.big ? 120 : 56) * (.25 + k) * .8, 0, 0, 7); c.stroke(); }
  c.globalAlpha = 1;
  // düşman can çubukları, sersem yıldızları, uyarılar
  const pl = L.p;
  for (const e of L.ents){ if (e.dummy || e.ent || (e.__S3 ? e.__V3 : e).hide3) continue; const sc = e.look.scale || 1, P = prj(e.x, e.y - 196 * sc, e.z); if (P.behind) continue;
    if (!e.dead && !e.T.boss && e.hp < e.maxhp && e.down <= 0){ c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(P.x - 24, P.y, 48, 6); c.fillStyle = '#ff5252'; c.fillRect(P.x - 24, P.y, 48 * Math.max(0, e.hp) / e.maxhp, 6); }
    if (e.dizzy > 0 && !e.dead){ const H2 = prj(e.x, e.y - 186 * sc, e.z); dizzyStars(c, H2.x, H2.y, t, 4, 18); }
    if (e.wind > 0 && e.move === 'slam') txt(c, '⬆ ZIPLA!', P.x, P.y - 10, 20, '#ffa000', 'center', 'bold', 4);
    if (e.wind > 0 && !e.dead && e.move !== 'slam') txt(c, '!', P.x, P.y - 6 + Math.sin(t * 20) * 2, e.move === 'rush' || e.move === 'dash' ? 38 : 30, e.move === 'rush' || e.move === 'dash' ? '#ff2ad4' : '#ff3b3b', 'center', '900', 5); }
  for (const f of L.team) if (!f.hideG && (f.dizzy > 0 || f.down > 0) && !f.dead){ const H2 = prj(f.x, f.y - 186, f.z); dizzyStars(c, H2.x, H2.y, t, 4, 18); }
  if (pl && !pl.dead && !pl.atk){ const e = finTarget(L, pl); if (e){ const P = prj(e.x, e.y - 215 * (e.look.scale || 1), e.z); if (!P.behind) pill(c, '🦵 BİTİR!', P.x, P.y + Math.sin(t * 8) * 4, 15, 'rgba(242,194,48,.95)', '#14306b'); } }
  // merdiven istemi
  for (const p of L.plats || []) if (p.ladder !== false && !p.step && pl && !pl.climb && pl.y > p.y + 20){ const lx = ladX(p), lz = ladZ(L, p); if (Math.hypot(pl.x - lx, pl.z - lz) < 150){ const P = prj(lx, p.y - 40, lz); if (!P.behind) pill(c, '🪜 TIRMAN', P.x, P.y + Math.sin(t * 6) * 4, 13, 'rgba(10,16,40,.85)', '#f2c230'); } }
  // iki oyunculu: kim kim
  if (L.duo) for (const F of [L.p, L.rp]) if (F && !F.hideG){ const mine = F.kind === MP.char, P = prj(F.x, F.y - 200, F.z); if (!P.behind) pill(c, mine ? '▼ SEN' : '▼ ' + (MP.peer && MP.peer.name || 'Arkadaşın'), P.x, P.y, 11, mine ? 'rgba(242,194,48,.9)' : 'rgba(90,160,255,.9)', mine ? '#14306b' : '#ffffff'); }
  // yazılar
  for (const q of L.texts){ const P = prj(q.x, q.y, q.z); if (P.behind) continue; c.globalAlpha = Math.max(0, 1 - q.t / 1.2); txt(c, q.text, P.x, P.y - q.t * 50, (q.size || 30) * .9, q.col, 'center', 'bold', 5); }
  c.globalAlpha = 1;
}
function gateUI3(c, L){
  const G = L.gate; if (!G || G.st !== 'wait' || L.doneT < 2.2) return;
  const ap = gatePt(L, G), P = prj(ap.x, GROUND - (G.kind === 'window' ? 260 : G.kind === 'hatch' ? 40 : 250), G.kind === 'hatch' ? ap.z : L.zMin + 20), bob = Math.sin(gameTime * 6) * 6;
  if (P.behind || P.x < 20 || P.x > W - 20) txt(c, '➡ ' + GATE_TXT3[G.kind], W - 24, 300, 22, '#f2c230', 'right', '900', 5);
  else pill(c, GATE_TXT3[G.kind], P.x, P.y + bob, 16, 'rgba(10,16,40,.9)', '#f2c230', { border:'#f2c230' });
}
function fxScreen3(c, L){
  const fx = L.fx; if (!fx) return;
  if (fx.lines > 0){ const k = fx.lines / .32, P = prj(fx.lx, fx.ly, fx.lz || 0), cx = P.behind ? 480 : P.x, cy = P.behind ? 270 : P.y; c.save(); c.globalAlpha = k * .75; c.strokeStyle = '#ffffff';
    for (let i = 0; i < 46; i++){ const a = i / 46 * Math.PI * 2 + (i % 3) * .05, r0 = 150 + (i * 37) % 90, r1 = 700; c.lineWidth = 1 + (i % 4); c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * .7); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .7); c.stroke(); } c.restore(); }
  if (fx.bars > 0){ const h = 46 * fx.bars; c.fillStyle = '#000000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
    if (L.finT > 0){ c.globalAlpha = fx.bars; txt(c, 'BİTİRİCİ!', 480, H - h / 2 + 10, 28, '#f2c230', 'center', 'italic 900', 5); c.globalAlpha = 1; } }
}

/* ---------- bölüm geçişi: oyuncunun üstüne kapanan / açılan iris + altın halka, alan adı şeridi ---------- */
const AREA3 = { tunel:'Stat Tüneli', sokak1:'Karlı Sokak', depoHayatta:'Eski Depo', depoKacis:'Depo', depoCati:'Depo · Çatı Katı', arkaSokak:'Arka Sokak', fabrikaGiris:'Fabrika Bahçesi', fabrikaIc:'Fabrika',
  karargahGiris:'Karargâh', karargahOfis:'Güvenlik Odası', karargahKacis:'Karargâh · Kaçış', bossNarak:'Narak\'ın Salonu', stadArka:'Stadın Altı', gizliOda:'Gizli Oda', bossDovuscu:'Stadyum', bossLider:'Stadyum',
  dojo:'Dojo', gecmis:'Eski Dojo', bossYardimci:'Eski Okul' };
function iris3(c, L){
  const k = Math.max(L.fade || 0, L.fadeIn || 0); if (k <= 0) return;
  const p = L.p, P = p ? prj(p.x, p.y - 95, p.z) : { behind:true }, cx = P.behind ? 480 : clamp(P.x, 90, W - 90), cy = P.behind ? 270 : clamp(P.y, 70, H - 70);
  const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 30, r = Math.max(0, R * Math.pow(1 - k, 1.35));
  c.save(); c.fillStyle = '#04060b'; c.beginPath(); c.rect(0, 0, W, H); if (r > .5) c.arc(cx, cy, r, 0, Math.PI * 2, true); c.fill('evenodd');
  if (r > 3 && k > .03 && k < .98){ c.strokeStyle = 'rgba(242,194,48,' + Math.min(.9, k * 3) + ')'; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,' + Math.min(.35, k) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r + 8, 0, 7); c.stroke(); }
  c.restore();
}
function banner3(c, L, rdt){
  if (!(L.banT > 0)) return; if ((L.fadeIn || 0) > .45) return;
  L.banT -= rdt; const name = AREA3[L.key]; if (!name) return;
  const u = 3 - L.banT, a = clamp(Math.min(u * 4, L.banT * 2.2), 0, 1), x = lerp(-460, 0, 1 - Math.pow(1 - clamp(u * 3, 0, 1), 3));
  c.save(); c.globalAlpha = a; c.translate(x, 0);
  const g = c.createLinearGradient(0, 0, 460, 0); g.addColorStop(0, 'rgba(10,16,40,.95)'); g.addColorStop(.75, 'rgba(10,16,40,.75)'); g.addColorStop(1, 'rgba(10,16,40,0)');
  const by = 158; c.fillStyle = g; c.fillRect(0, by, 460, 62); c.fillStyle = '#f2c230'; c.fillRect(0, by, 6, 62); c.fillRect(0, by + 60, 300 * clamp(u * 2, 0, 1), 2);
  txt(c, '📍 ' + name.toLocaleUpperCase('tr'), 24, by + 40, 28, '#ffffff', 'left', 'italic 900', 4);
  c.restore();
}
/* ---------- ana çizim ---------- */
function drawLevel3D(c, L){
  if (!R3.free()){ return drawLevel(c, L); }
  const now = performance.now(), C = L.c3 || (fight3dSetup(L), L.c3), rdt = clamp((now - (C.rt || now)) / 1000, 0, .05); C.rt = now;
  const A = arenaFor(L), U = A.userData, Wd = R3.world();
  arenaLight(L, U, Wd);
  fight3dCam(L, rdt);
  arenaTick(L, U, rdt);
  for (const f of L.team){ if (f.hideG) continue; if (f === L.p || (L.duo && f === L.rp) || L.showAll) drawFighter3(L, f, 'f3' + f.kind + L.team.indexOf(f), false, rdt); }   // yedek oyuncu sahnede yok (⇄ ile gelir)
  for (const e of L.ents){
    if (e.dummy){ const r = R3.objW('dm' + e.uid, 'dummy', X3(e.x), 0, Z3(e.z), 0); const wv = e.wobV || { x:1, z:0 }, a = e.dead ? e.fall * (e.fallDir || 1) : e.wob * .06; r.rotation.set(-wv.z * a, 0, -wv.x * a); continue; }
    if ((e.__S3 ? e.__V3 : e).hide3) continue;
    drawFighter3(L, e, 'e3' + e.uid, true, rdt); }
  const camP = R3.world().cam.position;
  (L.crowd3 || []).forEach((q, i) => { if (Math.hypot(X3(q.x) - camP.x, Z3(q.z) - camP.z) < 2.2) return; const hype = L.combo >= 3 && L.comboT > 0; const P = getPose({ animT:L.time * (hype ? 1.4 : 1) + q.seed, pose:hype ? 'cheer' : q.pose });
    R3.charW('cw' + i, q.look, P, X3(q.x), 0, Z3(q.z), q.yaw + Math.sin(L.time * .3 + q.seed) * .3, 1, hype ? 'happy' : 'shock'); });
  drawProps3(L);
  R3.post = Object.assign({ th:.9, bloom:.32, sat:1.06, vig:.42, sharp:.4, tint:[1, 1, 1] }, U.post || {}, L.def.sepia ? { sat:.35, tint:[1.12, .98, .78] } : {}, L.st.alarm && Math.sin(gameTime * 6) > .6 ? { tint:[1.18, .86, .86] } : {});
  // --- 2D katman ---
  overlay3(c, L);
  const p = L.p;
  if (p.dizzy > 0){ c.fillStyle = 'rgba(140,60,200,' + (.12 + .06 * Math.sin(gameTime * 8)) + ')'; c.fillRect(0, 0, W, H); }
  if (FX.flash > 0){ c.fillStyle = 'rgba(255,240,200,' + FX.flash + ')'; c.fillRect(0, 0, W, H); }
  fxScreen3(c, L); gateUI3(c, L);
  iris3(c, L);
  drawFightHud(c, L); banner3(c, L, rdt);
  if (!L.lost && !L.pauseM){ c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, FCAM_BTN.x, FCAM_BTN.y, FCAM_BTN.w, FCAM_BTN.h, 8); c.fill(); txt(c, '📹', FCAM_BTN.x + 21, FCAM_BTN.y + 25, 18, '#ffffff', 'center'); }
  if (L.camMsgT > 0){ L.camMsgT -= rdt; c.globalAlpha = Math.min(1, L.camMsgT * 2); pill(c, L.camMsg, 480, 160, 16, 'rgba(10,16,40,.9)', '#f2c230'); c.globalAlpha = 1; }
}
/* ---------- çok oyunculu: poz durumu (ev sahibi → misafir) ---------- */
const S3K = ['dead', 'down', 'getup', 'climb', 'dive', 'roll', 'grabbed', 'carry', 'slideT', 'dashing', 'dizzy', 'stun', 'blocking', 'wind', 'strike', 'onGround', 'vy', 'vx', 'vz', 'hitT3', 'blockT3'];
function st3(f){ const r = v => typeof v === 'number' ? Math.round(v * 100) / 100 : v ? 1 : 0;
  return [r(f.dead), r(f.down), r(f.getup), f.climb || f.climbG ? 1 : 0, r(f.dive), r(f.roll), f.grabbedBy ? 1 : 0, f.carry || f.carryE ? 1 : 0, r(f.slideT), r(f.dashing), r(f.dizzy), r(f.stun), r(f.blocking), r(f.wind), r(f.strike), f.onGround === false ? 0 : 1, Math.round(f.vy || 0), Math.round(f.vx || 0), Math.round(f.vz || 0), r(f.hitT3), r(f.blockT3),
    f.atk && f.atk.m ? [f.atk.m.anim || '', Math.round(f.atk.t / f.atk.m.dur * 100) / 100, f.atk.combo || 0] : 0, f.move || '', f.hitV ? [r(f.hitV.x), r(f.hitV.z)] : 0, f.fallV ? [r(f.fallV.x), r(f.fallV.z)] : 0, r(f.leaping), f.hide3 ? 1 : 0]; }
function st3apply(f, a){ if (!a) return; const V = f.__V3 || (f.__V3 = {}); S3K.forEach((k, i) => { V[k] = a[i]; }); V.onGround = !!a[15];
  V.atk = a[21] ? { m:{ anim:a[21][0], dur:1 }, t:a[21][1], combo:a[21][2] } : null; V.move = a[22]; V.hitV = a[23] ? { x:a[23][0], z:a[23][1] } : null; V.fallV = a[24] ? { x:a[24][0], z:a[24][1] } : null; V.leaping = a[25] || 0; V.hide3 = a[26] || 0; f.__S3 = a; f.move = a[22]; }
