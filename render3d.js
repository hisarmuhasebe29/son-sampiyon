'use strict';
let H3on = false;                 // drawHuman çağrıları 3B karaktere yönlendirilsin mi
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   render3d.js  (Three.js)
   3B karakterler: iskelet · parmaklı eller · krampon · yüz ifadeleri · saç/sakal
   Yan görünümde 1 birim = 100 piksel; karakterler 2D oyun mantığının pozlarını kullanır.
   ========================================================= */
const R3 = (() => {
  const T = window.THREE;
  if (!T){ const no = () => false, nop = () => {}; return { init:no, side:no, free:no, ok:no, begin:nop, end:nop, render:nop, filter:nop, ground:nop, lift:0 }; }
  let renderer, scene, cam, bgCanvas, bgCtx, bgTex, bgPlane, shadowPlane, sun, hemi, fill, ready = false, drew = false, mode = 'side';
  const pool = new Map(), used = new Set();
  const g3 = document.getElementById('g3');
  /* ---------- malzeme & geometri önbelleği ---------- */
  const MATS = new Map(), NUMTEX = new Map();
  function mat(col, o){ const k = col + (o ? JSON.stringify(o) : ''); let m = MATS.get(k);
    if (!m){ m = new T.MeshStandardMaterial(Object.assign({ color:new T.Color(col), roughness:.6, metalness:.04 }, o || {})); MATS.set(k, m); } return m; }
  /* kas profilli uzuv: (yarıçap, y) noktaları alttan üste; önde/arkada şişkinlik */
  const bump = (y, c, w) => Math.exp(-((y - c) / w) * ((y - c) / w));
  function shaped(prof, seg, front, back, zf){
    const g = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), seg), p = g.attributes.position;
    for (let i = 0; i < p.count; i++){ let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      x *= 1 + (x > 0 ? front(y) : back(y)) * Math.min(1, Math.abs(x) * 1.4); if (zf) z *= zf(y, x); p.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); return g; }
  const GEO = { sph:new T.SphereGeometry(1, 22, 16), box:new T.BoxGeometry(1, 1, 1), cyl:new T.CylinderGeometry(1, 1, 1, 18), cone:new T.ConeGeometry(1, 1, 14),
    cap:new T.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI * .56), limb:new T.CylinderGeometry(1, .82, 1, 16), skirt:new T.CylinderGeometry(.86, 1, 1, 20, 1, true),
    ring:new T.TorusGeometry(1, .08, 8, 32), brim:new T.CylinderGeometry(1, 1, 1, 24) };
  /* atletik gövde: önde göğüs, arkada kürek kemikleri, omuzda genişleme, belde incelme (x = derinlik, z = genişlik) */
  GEO.torso = shaped([[.8, -.5], [.82, -.38], [.85, -.2], [.91, 0], [.98, .17], [1, .3], [.96, .4], [.8, .47], [.48, .505], [.2, .515]], 26,
    y => .13 * bump(y, .2, .14) - .03 * bump(y, -.3, .2), y => .07 * bump(y, .27, .13) + .05 * bump(y, -.42, .1),
    y => 1 + .2 * Math.min(1, Math.max(0, (y - .08) / .3)) - .1 * bump(y, -.25, .2));
  GEO.hips = shaped([[.8, -.5], [.92, -.35], [.98, -.1], [1, .15], [.95, .4], [.9, .5]], 22, y => .02, y => .16 * bump(y, -.1, .25), y => 1.32);
  GEO.thigh = shaped([[.64, -.5], [.69, -.42], [.8, -.27], [.92, -.08], [1, .12], [.99, .3], [.94, .44], [.9, .5]], 18, y => .14 * bump(y, .02, .24), y => .09 * bump(y, .28, .2));
  GEO.calf = shaped([[.56, -.5], [.58, -.38], [.66, -.2], [.82, .02], [.96, .2], [1, .3], [.9, .44], [.8, .5]], 18, y => -.06 * bump(y, 0, .3), y => .26 * bump(y, .22, .17));
  GEO.uarm = shaped([[.78, -.5], [.84, -.32], [.95, -.08], [1, .1], [.99, .28], [.93, .42], [.86, .5]], 16, y => .12 * bump(y, -.02, .2), y => .09 * bump(y, .12, .24));
  GEO.farm = shaped([[.62, -.5], [.66, -.36], [.8, -.1], [.97, .2], [1, .3], [.93, .44], [.84, .5]], 16, y => .06 * bump(y, .25, .2), y => .04 * bump(y, .2, .2));
  GEO.neck = shaped([[1, -.5], [.9, -.3], [.86, 0], [.88, .5]], 16, y => -.08, y => .1 * bump(y, -.4, .2));
  GEO.trap = shaped([[1, -.5], [.9, -.1], [.6, .3], [.3, .5]], 22, y => -.2, y => .05, y => 1.8);
  GEO.sleeve = new T.CylinderGeometry(.9, 1, 1, 18, 1, true); GEO.shortsLeg = new T.CylinderGeometry(.9, 1, 1, 18, 1, true);
  GEO.boot = (() => { const g = new T.SphereGeometry(1, 20, 12), p = g.attributes.position; for (let i = 0; i < p.count; i++){ let x = p.getX(i), y = p.getY(i);
      if (y < -.3) y = -.3 - (y + .3) * .25; if (x < 0) { x *= .7; y = Math.max(y, -.32); } p.setXY(i, x, y); } g.computeVertexNormals(); return g; })();
  function mesh(geo, m, sx, sy, sz, x = 0, y = 0, z = 0){ const o = new T.Mesh(GEO[geo] || geo, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = false; return o; }
  const G = () => new T.Group();
  function canvasTex(w, h, draw){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }

  /* ---------- karakter iskeleti ---------- */
  function buildHead(look){
    const H = G(), skin = mat(look.skin), fw = look.face === 'round' ? 1.06 : look.face === 'square' ? 1.0 : .96;
    if (look.shadow){ H.add(mesh('sph', mat('#0a0a0a'), .14, .155, .135)); const e = mat('#ff2020', { emissive:new T.Color('#ff2020'), emissiveIntensity:2 });
      H.add(mesh('box', e, .02, .012, .03, .13, .02, .05)); H.add(mesh('box', e, .02, .012, .03, .13, .02, -.05)); H.userData = {}; return H; }
    const head = mesh('sph', look.hs === 'mask' ? mat('#111111') : skin, .14 * fw, .158, .136 * fw); H.add(head);
    if (look.face === 'square' && look.hs !== 'mask') H.add(mesh('box', skin, .2, .07, .22 * fw, .02, -.085, 0));
    H.add(mesh('sph', skin, .028, .042, .02, 0, 0, .135 * fw)); H.add(mesh('sph', skin, .028, .042, .02, 0, 0, -.135 * fw));
    const U = H.userData = { eyes:[], pupils:[], brows:[] };
    if (look.hs === 'mask'){ for (const z of [.05, -.05]){ const e = mesh('box', mat('#ffffff', { emissive:new T.Color('#666666') }), .02, .018, .04, .132, .02, z); H.add(e); U.eyes.push(e); } }
    else {
      const white = mat('#ffffff', { roughness:.3 }), iris = mat(look.eye || '#3b2a1a', { roughness:.2 }), brow = mat(look.brow || (['bald', 'hat', 'helmet', 'cap', 'mask'].includes(look.hs) ? '#2a1a10' : look.hair));
      for (const z of [.052, -.052]){
        const e = mesh('sph', white, .016, .026, .03, .118, .02, z); e.userData.dyn = 1; H.add(e); U.eyes.push(e);
        const p = mesh('sph', iris, .012, .015, .015, .131, .02, z); p.userData.dyn = 1; H.add(p); U.pupils.push(p);
        const b = mesh('box', brow, .016, .016, .062, .128, .066, z); b.userData.dyn = 1; H.add(b); U.brows.push(b);
        if (look.glasses){ H.add(mesh('box', mat('#0a0a0a', { roughness:.1, metalness:.5 }), .012, .035, .055, .14, .02, z)); }
      }
      if (look.glasses) H.add(mesh('box', mat('#0a0a0a'), .01, .008, .05, .142, .03, 0));
      const nose = mesh('cone', mat(shade(look.skin, .9)), .024, .06, .024, .152, -.012, 0); nose.rotation.z = -Math.PI / 2; H.add(nose);
      U.mouth = mesh('box', mat('#6b1f1f'), .012, .014, .062, .134, -.074, 0); U.mouth.userData.dyn = 1; H.add(U.mouth);
      const lid = mat(shade(look.skin, .92)), lip = mat(shade(look.skin, .78));
      for (const z of [.052, -.052]){ const l = mesh('cap', lid, .021, .02, .034, .112, .033, z); l.rotation.z = -.2; H.add(l); }
      H.add(mesh('sph', lip, .012, .009, .036, .136, -.061, 0)); H.add(mesh('sph', lip, .013, .011, .04, .133, -.088, 0));
      H.add(mesh('sph', mat(shade(look.skin, 1.04)), .03, .022, .03, .118, -.03, .07)); H.add(mesh('sph', mat(shade(look.skin, 1.04)), .03, .022, .03, .118, -.03, -.07));
      H.add(mesh('box', mat(shade(look.skin, .95)), .02, .05, .022, .145, .01, 0));
      if (look.scar) H.add(mesh('box', mat('#8a3a3a'), .006, .09, .01, .135, .02, -.075));
    }
    // saç
    const hm = mat(look.hair || '#222222', { roughness:.85 });
    const cap = (c = hm, s = 1) => { const m = mesh('cap', c, .152 * s * fw, .168 * s, .146 * s * fw, -.012, .012, 0); m.rotation.z = .32; return m; };
    switch (look.hs){
      case 'short': H.add(cap()); break;
      case 'curly': H.add(cap(hm, .98)); for (let i = 0; i < 14; i++){ const a = .4 + (i % 7) * .38, b = (Math.floor(i / 7) ? -.55 : .55) * (i % 2 ? .5 : 1);
          H.add(mesh('sph', hm, .046, .046, .046, -Math.cos(a) * .1 - .01, .07 + Math.sin(a) * .07, Math.sin(b) * .12)); } break;
      case 'bun': H.add(cap()); H.add(mesh('sph', hm, .062, .062, .062, -.118, .112, 0)); H.add(mesh('cyl', mat(shade(look.hair, .6)), .03, .02, .03, -.1, .08, 0)); break;
      case 'spiky': H.add(cap()); for (let i = 0; i < 8; i++){ const c = mesh('cone', hm, .035, .1, .035, -.08 + (i % 4) * .045, .16, (i < 4 ? .05 : -.05)); c.rotation.z = .5; H.add(c); } break;
      case 'long': H.add(cap()); H.add(mesh('box', hm, .07, .26, .26, -.11, -.06, 0)); break;
      case 'mohawk': H.add(mesh('box', hm, .24, .09, .045, -.02, .16, 0)); break;
      case 'cap': { const c = mesh('cap', mat(look.cap), .156 * fw, .17, .15 * fw, -.01, .02, 0); c.rotation.z = .12; H.add(c); H.add(mesh('box', mat(look.cap), .12, .014, .15, .14, .06, 0)); } break;
      case 'helmet': { const c = mesh('cap', mat('#3d4a63', { metalness:.4, roughness:.3 }), .17, .19, .165, 0, 0, 0); H.add(c); H.add(mesh('box', mat('#a0c8ff', { transparent:true, opacity:.45 }), .02, .08, .17, .15, .01, 0)); } break;
      case 'hat': H.add(mesh('brim', mat('#0d0d0d'), .22, .014, .22, 0, .1, 0)); H.add(mesh('cyl', mat('#0d0d0d'), .125, .15, .125, 0, .18, 0)); H.add(mesh('cyl', mat('#5a0000'), .127, .03, .127, 0, .12, 0)); break;
    }
    if (look.headband) H.add(mesh('cyl', mat(look.headband), .153 * fw, .035, .147 * fw, 0, .07, 0));
    if (look.bandana) H.add(mesh('cyl', mat(look.bandana), .155 * fw, .04, .149 * fw, 0, .075, 0));
    if (look.beard && !look.shadow){ const bm = mat(look.beard, { roughness:.9 });
      if (look.bs === 'long'){ const b = mesh('cone', bm, .1, .26, .1, .06, -.2, 0); b.rotation.z = Math.PI; H.add(b); H.add(mesh('sph', bm, .12, .07, .13, .04, -.09, 0)); }
      else if (look.bs === 'goatee') H.add(mesh('sph', bm, .03, .04, .035, .128, -.12, 0));
      else if (look.bs === 'full') H.add(mesh('sph', bm, .13, .09, .14, .03, -.08, 0));
      else { const s = mesh('sph', mat(look.beard, { transparent:true, opacity:.45 }), .137, .08, .137, .01, -.07, 0); H.add(s); } }
    return H;
  }
  function limb(parent, len, r, m, jointM){ parent.add(mesh('limb', m, r, len, r, 0, -len / 2, 0)); if (jointM) parent.add(mesh('sph', jointM, r * 1.05, r * 1.05, r * 1.05)); }
  function fist(parent, look, gloves){
    const sk = gloves ? mat('#f5f5f5') : mat(look.skin);
    parent.add(mesh('sph', sk, .036, .046, .038, .008, -.03, 0));
    for (let i = 0; i < 4; i++){ parent.add(mesh('sph', sk, .016, .014, .012, .03, -.012 - i * .014, -.013 + i * .009)); parent.add(mesh('sph', sk, .013, .012, .011, .036, -.026 - i * .014, -.006 + i * .009)); }
    const th = mesh('cyl', sk, .012, .042, .012, .022, -.012, -.03); th.rotation.z = -.6; parent.add(th);
    if (gloves) parent.add(mesh('box', mat('#27ae60'), .07, .02, .075, 0, .002, 0));
  }
  /* kumaş dokusu (tek gri doku, renk malzemeden gelir) */
  let WEAVE = null; const FAB = new Map();
  function fabric(col){ let m = FAB.get(col); if (m) return m;
    if (!WEAVE){ WEAVE = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#f4f4f4'; c.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2){ const v = 222 + ((x + y) % 4 ? 18 : 0) + Math.random() * 14; c.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; c.fillRect(x, y, 2, 2); }
        c.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 1, h); });
      WEAVE.wrapS = WEAVE.wrapT = T.RepeatWrapping; WEAVE.repeat.set(6, 4); WEAVE.colorSpace = T.SRGBColorSpace; }
    m = new T.MeshStandardMaterial({ color:new T.Color(col), map:WEAVE, roughness:.78, metalness:0, sheen:0 }); FAB.set(col, m); return m; }
  function decal(tex, w, h){ return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map:tex, transparent:true, alphaTest:.35, roughness:.75, polygonOffset:true, polygonOffsetFactor:-2 })); }
  function backTex(look){ const key = 'b|' + look.num + '|' + (look.nm || '') + '|' + look.stripe + '|' + look.shirt; let tx = NUMTEX.get(key);
    if (!tx){ tx = canvasTex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
        const fg = look.stripe || '#ffffff', ol = shade(look.shirt, .55);
        if (look.nm){ c.font = '900 34px ' + FONT; c.lineWidth = 6; c.strokeStyle = ol; c.strokeText(look.nm.toLocaleUpperCase('tr-TR'), w / 2, 40, 230); c.fillStyle = fg; c.fillText(look.nm.toLocaleUpperCase('tr-TR'), w / 2, 40, 230); }
        c.font = '900 150px ' + FONT; c.lineWidth = 12; c.strokeStyle = ol; c.strokeText(look.num, w / 2, 152); c.fillStyle = fg; c.fillText(look.num, w / 2, 152); }); NUMTEX.set(key, tx); }
    return tx; }
  function crestTex(look){ const key = 'c|' + look.stripe + '|' + look.shirt + '|' + look.num; let tx = NUMTEX.get(key);
    if (!tx){ tx = canvasTex(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = look.stripe || '#ffffff'; c.beginPath(); c.moveTo(20, 18); c.lineTo(58, 10); c.lineTo(58, 70); c.quadraticCurveTo(39, 92, 20, 70); c.closePath(); c.fill();
        c.fillStyle = shade(look.shirt, .6); c.font = '900 38px ' + FONT; c.fillText('A', 39, 44);
        c.fillStyle = look.stripe || '#ffffff'; c.font = '900 46px ' + FONT; c.fillText(look.num, 96, 46); }); NUMTEX.set(key, tx); }
    return tx; }
  function boot(parent, look, shoes){
    parent.add(mesh('boot', shoes, .1, .045, .045, .05, -.016, 0));
    parent.add(mesh('box', mat('#151515', { roughness:.8 }), .19, .016, .084, .043, -.054, 0));
    if (look.sh){ const stud = mat('#d9d9d9', { metalness:.6, roughness:.3 }); for (const [x, z] of [[.11, .025], [.11, -.025], [.06, .028], [.06, -.028], [-.02, .022], [-.02, -.022]]) parent.add(mesh('cyl', stud, .009, .014, .009, x, -.066, z));
      parent.add(mesh('box', mat(look.stripe || '#ffffff'), .07, .012, .1, .04, -.01, 0)); }
  }
  function buildRig(look){
    const R = { look, root:G(), legs:[], arms:[] };
    const wt = look.wt || 1, hg = look.hgt || 1, ath = look.sh || look.athl;
    const skin = mat(look.skin), shirt = look.sh ? fabric(look.shirt) : mat(look.shirt), shorts = look.sh ? fabric(look.shorts) : mat(look.shorts), socks = look.sh ? fabric(look.socks) : mat(look.socks), shoes = mat(look.shoes, { roughness:.32, metalness:.08 });
    const hips = R.hips = G(); R.body = G(); R.root.add(R.body); R.body.add(hips);
    hips.add(mesh('hips', shorts, .118 * wt, .17, .118 * wt, 0, .03, 0));
    for (const side of [1, -1]){
      const leg = G(); leg.position.set(0, 0, side * .09 * wt); hips.add(leg);
      if (look.sh){ leg.add(mesh('thigh', skin, .08 * wt, .28, .084 * wt, 0, -.14, 0)); leg.add(mesh('shortsLeg', shorts, .093 * wt, .19, .097 * wt, 0, -.075, 0)); }
      else leg.add(mesh('thigh', shorts, .078 * wt, .29, .08 * wt, 0, -.14, 0));
      const knee = G(); knee.position.y = -.28; leg.add(knee); knee.add(mesh('sph', look.sh ? skin : shorts, .058 * wt, .058 * wt, .058 * wt));
      knee.add(mesh('calf', look.robe ? shorts : socks, .062 * wt, .27, .062 * wt, 0, -.135, 0));
      if (look.sh){ knee.add(mesh('cyl', mat(look.stripe || look.socks), .065 * wt, .028, .065 * wt, 0, -.055, 0)); knee.add(mesh('cyl', socks, .067 * wt, .03, .067 * wt, 0, -.025, 0)); }
      const ank = G(); ank.position.y = -.27; knee.add(ank);
      boot(ank, look, shoes);
      R.legs.push({ leg, knee, ank });
    }
    const spine = R.spine = G(); spine.position.y = .02; hips.add(spine);
    const D = (ath ? .13 : .145) * wt, Wd = (ath ? .182 : .17) * wt;     // gövde derinliği / yarı genişliği
    const torso = mesh('torso', shirt, D, .43, Wd, 0, .215, 0); spine.add(torso);
    if (look.robe){ const sk = mesh('skirt', shirt, .175 * wt, .3, .13 * wt, 0, -.12, 0); spine.add(sk); }
    if (look.stripe && !look.sh) spine.add(mesh('torso', mat(look.stripe), D * 1.02, .06, Wd * 1.02, 0, .22, 0));
    if (look.sh){ const st = mat(look.stripe || '#ffffff');
      const col = mesh('ring', st, .062, .062, .062, 0, .445, 0); col.rotation.x = Math.PI / 2; col.scale.set(.06, .066, .55); spine.add(col);
      spine.add(mesh('box', st, .004, .26, .012, 0, .25, Wd * 1.06)); spine.add(mesh('box', st, .004, .26, .012, 0, .25, -Wd * 1.06)); }
    if (look.belt) spine.add(mesh('cyl', mat(look.belt), D * 1.02, .05, Wd * .9, 0, .02, 0));
    if (look.tie){ spine.add(mesh('box', mat('#e8e8e8'), .02, .16, .06, D * .95, .33, 0)); spine.add(mesh('box', mat(look.tie), .02, .22, .03, D * 1.0, .28, 0)); }
    if (look.suit) spine.add(mesh('box', mat(shade(look.shirt, .8)), .02, .3, .02, D * .97, .26, .05));
    spine.add(mesh('trap', look.sh || look.suit || look.robe ? shirt : skin, .075 * wt, .06, .1 * wt, -.008, .42, 0));
    spine.add(mesh('neck', skin, .05, .11, .052, 0, .47, 0));
    if (look.sh && look.num){
      const bk = decal(backTex(look), .26, .26); bk.position.set(-D * 1.07, .24, 0); bk.rotation.y = -Math.PI / 2; spine.add(bk);
      const cr = decal(crestTex(look), .12, .12); cr.position.set(D * 1.13, .33, -Wd * .02); cr.rotation.y = Math.PI / 2; spine.add(cr); }
    const head = R.head = buildHead(look); head.position.set(.012, .62, 0); head.scale.setScalar(look.sh ? .94 : 1.08); spine.add(head);
    for (const side of [1, -1]){
      const sh = G(); sh.position.set(-.005, .38, side * (Wd + .002)); spine.add(sh);
      sh.add(mesh('sph', shirt, .056 * wt, .052 * wt, .058 * wt, 0, -.028, side * .002));
      if (look.sh && look.ls) sh.add(mesh('uarm', shirt, .056 * wt, .23, .058 * wt, 0, -.115, 0));
      else if (look.sh){ sh.add(mesh('sleeve', shirt, .061 * wt, .13, .062 * wt, 0, -.06, 0)); sh.add(mesh('cyl', mat(look.stripe || look.shirt), .061 * wt, .014, .062 * wt, 0, -.123, 0)); sh.add(mesh('uarm', skin, .05 * wt, .23, .052 * wt, 0, -.115, 0)); }
      else sh.add(mesh('uarm', look.robe ? shirt : shirt, (look.robe ? .066 : .055) * wt, .23, (look.robe ? .066 : .056) * wt, 0, -.115, 0));
      const el = G(); el.position.y = -.23; sh.add(el); el.add(mesh('sph', look.suit ? shirt : skin, .045 * wt, .045 * wt, .045 * wt));
      el.add(mesh('farm', look.suit || look.ls ? shirt : skin, (look.ls ? .048 : .044) * wt, .21, (look.ls ? .05 : .046) * wt, 0, -.105, 0)); if (look.ls) el.add(mesh('cyl', mat(look.stripe || look.shirt), .036 * wt, .02, .038 * wt, 0, -.2, 0));
      const hand = G(); hand.position.y = -.22; el.add(hand); fist(hand, look, look.gloves);
      const holdG = G(); holdG.position.set(.02, -.04, 0); hand.add(holdG);
      if (look.shield && side === 1){ hand.add(mesh('box', mat('#a8c4e8', { transparent:true, opacity:.65, metalness:.3, roughness:.2 }), .03, .62, .2, .08, .1, 0)); }
      R.arms.push({ sh, el, hand, holdG, side });
    }
    R.carryG = G(); R.carryG.position.y = 1.45; R.root.add(R.carryG);
    R.root.scale.set(1, hg, 1);
    const groups = []; R.root.traverse(o => { if (o.isGroup) groups.push(o); }); groups.forEach(compact);
    R.root.traverse(o => { if (o.isMesh) o.castShadow = !o.userData.dyn && !o.material.transparent; });
    return R;
  }
  /* ---------- aynı malzemeli parçaları tek geometride birleştir (çizim çağrısı azaltma) ---------- */
  function mergeGeos(list){
    let vc = 0, ic = 0; for (const g of list){ vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), uv = new Float32Array(vc * 2), idx = new Uint32Array(ic); let vo = 0, io = 0;
    for (const g of list){ const n = g.attributes.position.count; pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
      if (g.index){ const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; } else { for (let i = 0; i < n; i++) idx[io + i] = vo + i; io += n; } vo += n; g.dispose(); }
    const G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(pos, 3)); G.setAttribute('normal', new T.BufferAttribute(nor, 3)); G.setAttribute('uv', new T.BufferAttribute(uv, 2)); G.setIndex(new T.BufferAttribute(idx, 1)); G.computeBoundingSphere(); G.userData.own = 1; return G;
  }
  function compact(g){
    const by = new Map();
    for (const ch of g.children){ if (!ch.isMesh || ch.isInstancedMesh || ch.userData.dyn || ch.userData.keep || ch.material.transparent || ch.material.isShaderMaterial) continue; ch.updateMatrix(); const k = ch.material.uuid; if (!by.has(k)) by.set(k, { m:ch.material, list:[] }); by.get(k).list.push(ch); }
    for (const { m, list } of by.values()){ if (list.length < 2) continue; const geos = list.map(o => o.geometry.clone().applyMatrix4(o.matrix)); for (const o of list) g.remove(o); g.add(new T.Mesh(mergeGeos(geos), m)); }
  }
  /* iç içe grupları köke indir (birleştirme için): dünya matrisini çocuğa göm */
  function flatten(root){
    root.updateMatrixWorld(true); const inv = new T.Matrix4().copy(root.matrixWorld).invert(), list = [];
    root.traverse(o => { if (o.isMesh && o.parent !== root && !o.isInstancedMesh && !o.userData.keep && !o.userData.dyn && !o.material.transparent && !(o.parent.userData && o.parent.userData.keep)) list.push(o); });
    for (const o of list){ const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld); o.parent.remove(o); m.decompose(o.position, o.quaternion, o.scale); root.add(o); }
    const empty = []; root.traverse(o => { if (o.isGroup && o !== root && !o.children.length) empty.push(o); }); for (const g of empty) g.parent && g.parent.remove(g);
  }
  /* ---------- eldeki eşyalar ---------- */
  const ITEM = {};
  function item(kind){
    const g = G();
    switch (kind){
      case 'sopa': { const m = mesh('cyl', mat('#9a6a3a'), .022, .52, .022, 0, .2, 0); const tip = mesh('cyl', mat('#9a6a3a'), .035, .2, .035, 0, .36, 0); g.add(m, tip); g.rotation.z = -1.2; } break;
      case 'boru': { g.add(mesh('cyl', mat('#8a929c', { metalness:.7, roughness:.3 }), .024, .55, .024, 0, .22, 0)); g.add(mesh('cyl', mat('#5d646c', { metalness:.7 }), .034, .06, .034, 0, .48, 0)); g.rotation.z = -1.2; } break;
      case 'sise': { g.add(mesh('cyl', mat('#2e8b57', { transparent:true, opacity:.85, roughness:.1 }), .035, .16, .035, 0, .08, 0)); g.add(mesh('cyl', mat('#2e8b57'), .014, .08, .014, 0, .2, 0)); g.rotation.z = -1.1; } break;
      case 'paper': g.add(mesh('box', mat('#f3ecd8'), .01, .13, .1, .04, .02, 0)); break;
      case 'phone': { g.add(mesh('box', mat('#111111', { roughness:.2 }), .012, .13, .065, .04, .03, 0)); g.add(mesh('box', mat('#5ab0ff', { emissive:new T.Color('#2a70c0'), emissiveIntensity:1 }), .004, .11, .055, .047, .03, 0)); } break;
      case 'file': g.add(mesh('box', mat('#c9a65a'), .02, .18, .24, .05, .02, 0)); break;
      case 'card': g.add(mesh('box', mat('#0d0d0d'), .01, .07, .11, .04, .01, 0)); break;
      case 'trophy': { const gold = mat('#e8b923', { metalness:.85, roughness:.25 }); g.add(mesh('cyl', gold, .09, .14, .09, 0, .25, 0)); g.add(mesh('cyl', gold, .02, .1, .02, 0, .13, 0)); g.add(mesh('cyl', gold, .07, .04, .07, 0, .07, 0));
        g.add(mesh('ring', gold, .05, .05, .05, .09, .26, 0)); g.add(mesh('ring', gold, .05, .05, .05, -.09, .26, 0)); } break;
    }
    return g;
  }
  function setHeld(R, slot, kind){
    const k = slot + ':' + (kind || '');
    if (R.heldKey === k) return; R.heldKey = k;
    for (const a of R.arms) a.holdG.clear(); R.carryG.clear();
    if (!kind) return;
    if (kind === 'box') R.carryG.add(mesh('box', mat('#a0723f'), .5, .4, .4, 0, 0, 0));
    else if (kind.startsWith('carry_')){ const t = kind.slice(6), dims = { kutu:[.52, .52], koli:[.46, .38], varil:[.46, .62], cop:[.44, .6], dolap:[.62, 1.18] }[t] || [.5, .4];
      const o = objMesh(t, dims[0], dims[1]); o.position.y = -dims[1] / 2 + .05; if (t === 'varil' || t === 'cop') o.rotation.z = Math.PI / 2; R.carryG.add(o); }
    else R.arms[slot].holdG.add(item(kind));
  }
  /* ---------- ifade ---------- */
  function setFace(R, ex, talk){
    const U = R.head.userData; if (!U || !U.brows) return;
    if (!U.b0) U.b0 = { eyes:U.eyes.map(e => e.scale.y), pup:U.pupils.map(p => p.scale.y), brows:U.brows.map(b => b.position.y), m:U.mouth ? U.mouth.scale.clone() : null };
    const fs = U.fs || 1, t = gameTime, open = talk && Math.sin(t * 22) > 0;
    const brow = { angry:[.06, .5], shout:[.06, .5], shock:[.078, 0], sad:[.06, -.4], pain:[.058, -.4], dizzy:[.058, -.3] }[ex] || [.066, 0];
    U.brows.forEach((b, i) => { b.position.y = U.b0.brows[i] + (brow[0] - .066) * fs; b.rotation.x = (i ? -1 : 1) * brow[1]; });
    const eyeY = ex === 'shock' || ex === 'pain' ? 1.25 : ex === 'angry' || ex === 'shout' ? .7 : ex === 'happy' ? .55 : ex === 'ko' || ex === 'dizzy' ? .15 : 1;
    U.eyes.forEach((e, i) => e.scale.y = U.b0.eyes[i] * eyeY); U.pupils.forEach((p, i) => { p.visible = ex !== 'ko'; p.scale.y = U.b0.pup[i] * Math.min(1, eyeY + .2); });
    const m = U.mouth; if (!m) return; const s0 = U.b0.m; let sy = 1, sz = 1, rx = 0;
    if (ex === 'shock' || ex === 'shout' || ex === 'pain' || open){ sy = ex === 'shout' ? 3.57 : 2.86; sz = ex === 'shout' ? 1.13 : .8; }
    else if (ex === 'happy'){ sy = 1.86; sz = 1.37; } else if (ex === 'smirk'){ sz = .97; rx = .25; }
    m.scale.set(s0.x, s0.y * sy, s0.z * sz); m.rotation.x = rx;
  }
  /* ---------- poz uygula (2D açılar → 3B eklemler) ---------- */
  function applyPose(R, P, face, ex, talk, hold){
    const near = face >= 0 ? 0 : 1, far = 1 - near;
    const L = R.legs, A = R.arms, HB = R.hipBase || .56;
    R.body.rotation.set(0, 0, 0); R.body.position.set(0, 0, 0);
    if (P.L3){ const Q = P.L3;
      for (let i = 0; i < 2; i++){ const sg = i ? -1 : 1, l = L[i], q = Q.legs[i], a = A[i], w = Q.arms[i];
        l.leg.rotation.set(-sg * (q.ab || 0), -sg * (q.tw || 0), q.h); l.knee.rotation.set(0, 0, q.k); l.ank.rotation.set(0, 0, q.a || 0);
        a.sh.rotation.set(-sg * (w.ab || 0), -sg * (w.tw || 0), w.s); a.el.rotation.set(0, 0, w.e); a.hand.rotation.set(0, 0, w.h || 0); }
      R.hips.position.y = HB + (Q.pel.y || 0) * (HB / .98); R.hips.rotation.set(Q.pel.roll || 0, Q.pel.yaw || 0, Q.pel.pitch || 0);
      R.spine.rotation.set(Q.sp.roll || 0, Q.sp.yaw || 0, Q.sp.pitch || 0); R.head.rotation.set(0, Q.hd.yaw || 0, Q.hd.pitch || 0);
      setFace(R, ex, talk); setHeld(R, 0, hold === 'box' ? 'box' : hold); return; }
    const setLeg = (l, a) => { l.leg.rotation.set(0, 0, a[0]); l.knee.rotation.set(0, 0, a[1] - a[0]); l.ank.rotation.set(0, 0, -a[1]); };
    const sp = P.spread || 0;
    const ab = R.real ? .12 : .1, setArm = (r, a) => { r.sh.rotation.set(r === A[0] ? -(sp + ab) : sp + ab, 0, a[0]); r.el.rotation.set(0, 0, a[1] - a[0]); r.hand.rotation.set(0, 0, 0); };
    setLeg(L[near], P.fl); setLeg(L[far], P.bl); setArm(A[near], P.fa); setArm(A[far], P.ba);
    if (R.real && !P.lie && !P.rot){ for (const l of L) l.leg.rotation.x = (l === L[0] ? -1 : 1) * .045; }
    R.hips.position.y = HB * (1 - P.bob / 56);
    R.spine.rotation.set(0, 0, -Math.atan2(P.lean, 41));
    const tw = P.lie || P.rot ? 0 : clamp(((P.fa[0] || 0) - (P.ba[0] || 0)) * (near ? -1 : 1), -1.6, 1.6);   // kol salınımına göre gövde/kalça dönmesi
    R.spine.rotation.y = tw * .07; R.hips.rotation.set(0, -tw * .045, 0); R.head.rotation.set(0, -tw * .05, 0);
    if (P.lie){ R.body.rotation.z = Math.PI / 2; R.body.position.y = R.real ? .14 : .12; }
    else if (P.rot){ R.body.rotation.z = -P.rot; R.body.position.y = HB; R.hips.position.y -= HB; }
    setFace(R, ex, talk);
    if (hold === 'box') setHeld(R, near, 'box'); else setHeld(R, near, hold);
  }
  function tintRig(R, tint){
    if (R.tint === tint) return; R.tint = tint;
    R.root.traverse(o => { if (!o.isMesh) return; if (!o.userData.base) o.userData.base = o.material; o.material = tint ? mat(tint, { emissive:new T.Color(tint), emissiveIntensity:.6 }) : o.userData.base; });
  }
  function rigFor(id, look, real){
    let R = pool.get(id);
    const sig = (look.__sig || (look.__sig = Math.random().toString(36))) + (real ? ':r' : '');
    if (!R || R.sig !== sig){ if (R){ scene.remove(R.root); R.root.traverse(o => { if (o.isMesh && o.geometry.userData.own) o.geometry.dispose(); }); } R = real ? buildRealRig(look) : buildRig(look); R.sig = sig; pool.set(id, R); scene.add(R.root); }
    used.add(id); R.root.visible = true; return R;
  }

  /* ---------- nesneler ---------- */
  const WOOD = () => canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#a0723f'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6b4a22'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); c.beginPath(); c.moveTo(4, 4); c.lineTo(w - 4, h - 4); c.moveTo(w - 4, 4); c.lineTo(4, h - 4); c.stroke(); });
  const CARD = () => canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#c9a26b'; c.fillRect(0, 0, w, h); c.fillStyle = '#a8814f'; c.fillRect(w / 2 - 6, 0, 12, h); c.fillStyle = '#5a3f22'; c.font = 'bold 12px sans-serif'; c.fillText('⬆⬆', 6, 18); });
  const LOCK = () => canvasTex(64, 128, (c, w, h) => { c.fillStyle = '#5d6b7a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3d4a58'; c.lineWidth = 3; c.strokeRect(4, 4, w / 2 - 6, h - 8); c.strokeRect(w / 2 + 2, 4, w / 2 - 6, h - 8); c.fillStyle = '#2d3640'; for (let j = 0; j < 3; j++){ c.fillRect(10, 14 + j * 6, 16, 2); c.fillRect(w / 2 + 8, 14 + j * 6, 16, 2); } });
  let TEX = null;
  function texs(){ if (!TEX) TEX = { kutu:WOOD(), koli:CARD(), dolap:LOCK() }; return TEX; }
  function objMesh(kind, w, h){
    const g = G();
    if (kind === 'kutu' || kind === 'koli' || kind === 'dolap'){ const m = new T.Mesh(GEO.box, new T.MeshStandardMaterial({ map:texs()[kind], roughness:.8 })); m.scale.set(w, h, kind === 'dolap' ? .5 : w * .9); m.position.y = h / 2; m.castShadow = true; g.add(m); }
    else if (kind === 'cop'){ const m = mat('#5f6f62', { metalness:.55, roughness:.4 }); const b = new T.Mesh(new T.CylinderGeometry(w / 2, w / 2 * .82, h, 18), m); b.position.y = h / 2; b.castShadow = true; g.add(b);
      for (let k = 1; k < 4; k++) g.add(mesh('cyl', mat('#4a574c', { metalness:.5 }), w / 2 * (1 - k * .05) + .005, .02, w / 2 * (1 - k * .05) + .005, 0, h * k / 4, 0));
      g.add(mesh('cyl', mat('#7a8b7d', { metalness:.5 }), w / 2 + .03, .05, w / 2 + .03, 0, h + .02, 0)); g.add(mesh('box', mat('#3d4740'), .14, .04, .04, 0, h + .07, 0)); }
    else if (kind === 'varil'){ g.add(mesh('cyl', mat('#7a2a1a', { metalness:.4, roughness:.45 }), w / 2, h, w / 2, 0, h / 2, 0)); g.add(mesh('cyl', mat('#4a1a10'), w / 2 + .005, .04, w / 2 + .005, 0, h * .2, 0)); g.add(mesh('cyl', mat('#4a1a10'), w / 2 + .005, .04, w / 2 + .005, 0, h * .8, 0)); }
    else if (kind === 'sise'){ g.add(mesh('cyl', mat('#2e8b57', { transparent:true, opacity:.85, roughness:.1 }), .05, .18, .05, 0, .09, 0)); g.add(mesh('cyl', mat('#2e8b57'), .02, .09, .02, 0, .22, 0)); }
    else if (kind === 'dummy'){ g.add(mesh('cyl', mat('#6b4226'), .06, 1.0, .06, 0, .5, 0)); g.add(mesh('box', mat('#6b4226'), .6, .08, .08, 0, .78, 0)); g.add(mesh('box', mat('#c49a6c'), .36, .52, .3, 0, .7, 0)); g.add(mesh('sph', mat('#c49a6c'), .14, .14, .14, 0, 1.12, 0)); }
    else if (kind === 'ball'){ g.add(new T.Mesh(new T.SphereGeometry(.1, 24, 16), new T.MeshStandardMaterial({ map:BALLTEX(), roughness:.4 }))); g.children[0].castShadow = true; }
    else if (kind === 'fire'){ g.add(new T.Mesh(new T.SphereGeometry(.14, 20, 14), new T.MeshStandardMaterial({ color:'#ffcc33', emissive:new T.Color('#ff6600'), emissiveIntensity:2.2 })));
      for (let i = 1; i < 6; i++) g.add(mesh('sph', mat('#ff7a00', { emissive:new T.Color('#ff3300'), emissiveIntensity:1.6, transparent:true, opacity:.6 - i * .09 }), .13 - i * .018, .13 - i * .018, .13 - i * .018, -i * .12, 0, 0)); }
    else if (ITEM[kind] !== undefined || ['sopa', 'boru', 'trophy'].includes(kind)){ const it = item(kind); it.rotation.z = kind === 'trophy' ? 0 : Math.PI / 2; g.add(it); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  let BALLT = null;
  function BALLTEX(){ if (!BALLT) BALLT = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#151515';
    for (let i = 0; i < 12; i++){ const x = (i % 6) * 44 + (Math.floor(i / 6) ? 22 : 0) + 10, y = Math.floor(i / 6) * 64 + 32; c.beginPath(); for (let k = 0; k < 5; k++){ const a = k * 1.2566 - Math.PI / 2; c.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); } c.fill(); } }); return BALLT; }
  function obj(id, kind, w = .5, h = .5){
    let o = pool.get(id); const sig = kind + w + h;
    if (!o || o.sig !== sig){ if (o) scene.remove(o.root); o = { root:objMesh(kind, w, h), sig }; pool.set(id, o); scene.add(o.root); }
    used.add(id); o.root.visible = true; return o.root;
  }
  function platform(id, p){
    let o = pool.get(id); const sig = 'pl' + p.x1 + p.x2 + p.y;
    if (!o || o.sig !== sig){ if (o) scene.remove(o.root); const g = G(), w = (p.x2 - p.x1) / 100, top = (540 - p.y) / 100, base = (540 - GROUND) / 100;
      const steel = mat('#5a606a', { metalness:.5, roughness:.4 }), dark = mat('#2b2f37', { metalness:.4 });
      g.add(mesh('box', steel, w, .12, .9, w / 2, top - .06, 0));
      for (let x = .2; x < w; x += 1.4){ g.add(mesh('box', dark, .1, top - base, .1, x, (top + base) / 2, -.35)); g.add(mesh('box', dark, .1, top - base, .1, x, (top + base) / 2, .35)); }
      { const rail = mesh('cyl', mat('#8a929c', { metalness:.7, roughness:.3 }), .02, w, .02, w / 2, top + .34, -.4); rail.rotation.z = Math.PI / 2; g.add(rail); }
      for (let x = .06; x <= w; x += .36) g.add(mesh('cyl', mat('#8a929c', { metalness:.7 }), .015, .34, .015, x, top + .17, -.4));
      if (p.ladder !== false){ const lx = ((p.ladderX || p.x1 - 26) - p.x1) / 100; const wood = mat('#a0662a');
        for (const z of [-.12, .12]) g.add(mesh('cyl', wood, .02, top - base, .02, lx, (top + base) / 2, z + .45));
        for (let y = base + .15; y < top; y += .2){ const r = mesh('cyl', wood, .015, .24, .015, lx, y, .45); r.rotation.x = Math.PI / 2; g.add(r); } }
      g.traverse(m => { if (m.isMesh){ m.castShadow = true; m.receiveShadow = true; } });
      g.position.x = p.x1 / 100; o = { root:g, sig }; pool.set(id, o); scene.add(g); }
    used.add(id); o.root.visible = true;
  }

  /* ---------- sahne ---------- */
  function init(){
    if (ready) return true; if (R3.failed) return false;
    try {
      renderer = new T.WebGLRenderer({ canvas:g3, antialias:true, alpha:true, powerPreference:'high-performance' }); renderer.setClearColor(0x000000, 0);
    } catch(e){ R3.failed = true; return false; }
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene();
    cam = new T.PerspectiveCamera(30, W / H, .1, 900); scene.add(cam);
    hemi = new T.HemisphereLight(0xe8eeff, 0x4a4030, 1.45); scene.add(hemi);
    sun = new T.DirectionalLight(0xfff2dd, 2.3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006;
    const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 6; sc.bottom = -6; sc.near = .5; sc.far = 60; scene.add(sun); scene.add(sun.target);
    fill = new T.DirectionalLight(0x9ab8ff, .6); scene.add(fill);
    try { const pm = new T.PMREMGenerator(renderer), es = new T.Scene();
      const sky = new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ side:T.BackSide, map:canvasTex(16, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(.45, '#dfe9f5'); g.addColorStop(.55, '#8a9a7a'); g.addColorStop(1, '#3a4a30'); c.fillStyle = g; c.fillRect(0, 0, w, h); }) }));
      es.add(sky); for (const [x, y, z] of [[8, 10, 6], [-9, 8, 4], [0, 12, -8]]){ const p = new T.Mesh(new T.PlaneGeometry(7, 4), new T.MeshBasicMaterial({ color:0xffffff, side:T.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); es.add(p); }
      scene.environment = pm.fromScene(es, .03).texture; scene.environmentIntensity = .55; pm.dispose(); } catch(e){}
    bgCanvas = document.createElement('canvas'); bgCanvas.width = W; bgCanvas.height = H; bgCtx = bgCanvas.getContext('2d');
    bgTex = new T.CanvasTexture(bgCanvas); bgTex.colorSpace = T.SRGBColorSpace;
    bgPlane = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map:bgTex, toneMapped:false, depthWrite:false }));
    bgPlane.renderOrder = -10; cam.add(bgPlane);
    shadowPlane = new T.Mesh(new T.PlaneGeometry(400, 12), new T.ShadowMaterial({ opacity:.38 })); shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.receiveShadow = true; scene.add(shadowPlane);
    ready = true; resize3(); return true;
  }
  function resize3(){ if (!ready) return; prNow = 0; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, R3.lowRes ? 1 : 1.75)); renderer.setSize(W * scale, H * scale, false); g3.style.width = (W * scale) + 'px'; g3.style.height = (H * scale) + 'px'; }
  addEventListener('resize', () => setTimeout(resize3, 50));
  const D = 2.7 / Math.tan(15 * Math.PI / 180);
  /* yan görünüm: kamera sabit, 1 birim = 100 ekran pikseli → karakterler 2D ekran koordinatına birebir oturur
     arka plan alttaki 2D tuvale (#bgc) çizilir; efekt / arayüz üstteki tuvalde kalır */
  const bgc = document.getElementById('bgc'), bctx = bgc.getContext('2d'); let bgUsed = false, rendered = false, filt = '';
  function side(groundY = GROUND, o = {}){
    if (!init()) return false;
    mode = 'side'; drew = true; g3.style.display = 'block';
    cam.fov = 30; cam.zoom = 1; cam.aspect = W / H; cam.position.set(4.8, 2.7, D); cam.rotation.set(0, 0, 0); cam.updateProjectionMatrix();
    bgPlane.visible = false; shadowPlane.visible = true; shadowPlane.position.set(4.8, (540 - groundY) / 100 + .002, 0);
    scene.background = null; scene.fog = null; hemi.intensity = o.dark ? .75 : o.bright ? 1.7 : 1.25; sun.intensity = o.dark ? 1.4 : o.bright ? 2.8 : 2.3; fill.intensity = o.bright ? 1.1 : .6;
    shadowBox(9, 6, 60); sun.position.set(2.2, 9.5, 7); sun.target.position.set(4.8, .5, 0); fill.position.set(8, 3, 6);
    R3.lift = 0; H3on = true;
    return true;
  }
  function bgFrom(c){
    if (!bgUsed){ bgUsed = true; if (bgc.width !== cv.width || bgc.height !== cv.height){ bgc.width = cv.width; bgc.height = cv.height; }
      bgc.style.width = cv.style.width; bgc.style.height = cv.style.height; bgc.style.display = 'block'; bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, bgc.width, bgc.height); }
    bctx.setTransform(c.getTransform()); bctx.globalAlpha = 1; bctx.globalCompositeOperation = 'source-over'; return bctx;
  }
  function filter(f){ filt = f; }
  let sbox = '';
  function shadowBox(hw, hh, far){ const k = hw + ',' + hh + ',' + far; if (k === sbox) return; sbox = k; const sc = sun.shadow.camera; sc.left = -hw; sc.right = hw; sc.top = hh; sc.bottom = -hh; sc.near = .5; sc.far = far; sc.updateProjectionMatrix(); }
  function ground(gy){ if (ready) shadowPlane.position.y = (540 - gy) / 100 + .002; }
  /* yan görünümde karakter (piksel koordinatı) */
  function char(id, look, P, face, x, y, s = 1, ex = 'neutral', talk = false, hold = null, tint = null){
    const R = rigFor(id, look, typeof buildRealRig === 'function' && !R3.oldRig); applyPose(R, P, face, ex, talk, hold); tintRig(R, tint);     // ara sahneler / menüler de dövüşteki gerçekçi gövdeyi kullanır
    const z = R3.zNext != null ? R3.zNext : Math.min(2, zc++ * .16), k = (D - z) / D; R3.zNext = null; const _k = k, sc = s * (look.scale || 1) * _k;     // çizim sırası = derinlik (perspektif telafili)
    R.root.position.set(4.8 + (x / 100 - 4.8) * k, 2.7 + ((540 - y) / 100 - 2.7) * k, z);
    R.root.rotation.set(0, P.back ? Math.PI / 2 : face >= 0 ? -.45 : Math.PI + .45, 0);
    R.root.scale.set(sc, sc * (look.hgt || 1), sc);
    return R;
  }
  /* serbest dünyada karakter (metre / birim) */
  function charW(id, look, P, wx, wy, wz, yaw, s = 1, ex = 'neutral', talk = false, hold = null, extra){
    const R = rigFor(id, look, typeof buildRealRig === 'function' && !(extra && extra.oldRig)); applyPose(R, P, extra && extra.face || 1, ex, talk, hold); tintRig(R, extra && extra.tint || null);
    const sc = s * (look.scale || 1);
    R.root.position.set(wx, wy, wz); R.root.rotation.set(extra && extra.rx || 0, yaw, extra && extra.rz || 0, 'YXZ'); R.root.scale.set(sc, sc * (look.hgt || 1), sc);
    return R;
  }
  function objS(id, kind, x, y, w, h, rot = 0, shake = 0){ const r = obj(id, kind, w / 100, h / 100); r.position.set(x / 100 + shake, (540 - y) / 100 + (R3.lift || 0), 0); r.rotation.set(0, 0, rot); return r; }
  function objW(id, kind, x, y, z, rot = 0, w, h){ const r = obj(id, kind, w, h); r.position.set(x, y, z); r.rotation.set(0, 0, rot); return r; }
  /* önbellekteki bir sahneyi sil (bellek: telefonda eski bölüm sahneleri birikmesin) — paylaşılan geometrilere dokunmaz */
  function drop(id){ const o = pool.get(id); if (!o || !o.root) return; scene.remove(o.root); const shared = new Set(Object.values(GEO));
    o.root.traverse(m => { if ((m.isMesh || m.isPoints) && m.geometry && !shared.has(m.geometry) && !m.geometry.userData.keepGeo) m.geometry.dispose(); }); pool.delete(id); used.delete(id); }
  function hideShadowPlane(){ if (ready) shadowPlane.visible = false; }
  function custom(id, build){ let o = pool.get(id); if (!o){ o = { root:build(), sig:'c' }; pool.set(id, o); scene.add(o.root); } used.add(id); o.root.visible = true; return o.root; }
  const _v = new T.Vector3();
  function project(x, y, z){ _v.set(x, y, z).project(cam); return { x:(_v.x + 1) / 2 * W, y:(1 - _v.y) / 2 * H, behind:_v.z > 1 }; }
  let prNow = 0; function applyPR(cap){ const v = Math.min(window.devicePixelRatio || 1, R3.lowRes ? 1 : cap); if (v !== prNow){ prNow = v; renderer.setPixelRatio(v); renderer.setSize(W * scale, H * scale, false); } }
  function free(){ if (!init()) return false; applyPR(2); mode = 'free'; drew = true; g3.style.display = 'block'; bgPlane.visible = false; shadowPlane.visible = false; cam.zoom = 1; R3.lift = 0; H3on = false; return true; }
  /* ---------- son işlem: parlama (bloom) + renk + vinyet — sadece futbolda; yavaş telefonda kendini kapatır ---------- */
  let PP = null;
  const PP_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  function ppMat(fs, uni){ return new T.ShaderMaterial({ vertexShader:PP_VS, fragmentShader:fs, uniforms:uni, depthTest:false, depthWrite:false, toneMapped:false }); }
  function postSetup(w, h){
    if (PP && PP.w === w && PP.h === h) return PP;
    if (PP){ PP.rt.dispose(); PP.h2.dispose(); PP.q1.dispose(); PP.q2.dispose(); }
    const o = { type:T.HalfFloatType, depthBuffer:false };
    const rt = new T.WebGLRenderTarget(w, h, { type:T.HalfFloatType, samples:renderer.capabilities.isWebGL2 ? 4 : 0 });
    const h2 = new T.WebGLRenderTarget(w >> 1, h >> 1, o), q1 = new T.WebGLRenderTarget(w >> 2, h >> 2, o), q2 = new T.WebGLRenderTarget(w >> 2, h >> 2, o);
    const old = PP; PP = { w, h, rt, h2, q1, q2, sc:old ? old.sc : new T.Scene(), oc:old ? old.oc : new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad:old ? old.quad : new T.Mesh(new T.PlaneGeometry(2, 2)), M:old ? old.M : null, slow:old ? old.slow : 0, off:old ? old.off : false };
    if (!old){ PP.sc.add(PP.quad); PP.quad.frustumCulled = false;
      PP.M = {
        bright:ppMat('uniform sampler2D t; uniform vec2 px; uniform float th; varying vec2 vUv; void main(){ vec3 c = (texture2D(t, vUv + px * vec2(-1., -1.)).rgb + texture2D(t, vUv + px * vec2(1., -1.)).rgb + texture2D(t, vUv + px * vec2(-1., 1.)).rgb + texture2D(t, vUv + px * vec2(1., 1.)).rgb) * .25; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(th, th * 1.6, l); gl_FragColor = vec4(c * k, 1.); }', { t:{ value:null }, px:{ value:new T.Vector2() }, th:{ value:.95 } }),
        down:ppMat('uniform sampler2D t; uniform vec2 px; varying vec2 vUv; void main(){ gl_FragColor = vec4((texture2D(t, vUv + px * vec2(-1., -1.)).rgb + texture2D(t, vUv + px * vec2(1., -1.)).rgb + texture2D(t, vUv + px * vec2(-1., 1.)).rgb + texture2D(t, vUv + px * vec2(1., 1.)).rgb) * .25, 1.); }', { t:{ value:null }, px:{ value:new T.Vector2() } }),
        blur:ppMat('uniform sampler2D t; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb * .2270; c += (texture2D(t, vUv + dir * 1.3846).rgb + texture2D(t, vUv - dir * 1.3846).rgb) * .3162; c += (texture2D(t, vUv + dir * 3.2308).rgb + texture2D(t, vUv - dir * 3.2308).rgb) * .0703; gl_FragColor = vec4(c, 1.); }', { t:{ value:null }, dir:{ value:new T.Vector2() } }),
        comp:new T.ShaderMaterial({ vertexShader:PP_VS, depthTest:false, depthWrite:false, toneMapped:true,
          uniforms:{ tCol:{ value:null }, tB:{ value:null }, tH:{ value:null }, bloom:{ value:.55 }, sat:{ value:1.12 }, vig:{ value:.55 }, tint:{ value:new T.Vector3(1, 1, 1) }, lift:{ value:.0 }, px:{ value:new T.Vector2() }, sharp:{ value:.45 } },
          fragmentShader:`uniform sampler2D tCol, tB, tH; uniform float bloom, sat, vig, lift, sharp; uniform vec3 tint; uniform vec2 px; varying vec2 vUv;
            void main(){ vec3 c = texture2D(tCol, vUv).rgb; vec3 nb = (texture2D(tCol, vUv + vec2(px.x, 0.)).rgb + texture2D(tCol, vUv - vec2(px.x, 0.)).rgb + texture2D(tCol, vUv + vec2(0., px.y)).rgb + texture2D(tCol, vUv - vec2(0., px.y)).rgb) * .25;
              c = max(vec3(0.), c + (c - nb) * sharp); vec3 b = texture2D(tB, vUv).rgb + texture2D(tH, vUv).rgb * .35;
              c += b * bloom; float l = dot(c, vec3(.2126, .7152, .0722)); c = mix(vec3(l), c, sat) * tint + lift;
              gl_FragColor = vec4(c, 1.);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
              vec2 d = vUv - .5; gl_FragColor.rgb *= 1. - dot(d, d) * vig; }` }) };
    }
    return PP;
  }
  function pass(m, src, dst){ PP.quad.material = m; if (m.uniforms.t) m.uniforms.t.value = src; renderer.setRenderTarget(dst); renderer.render(PP.sc, PP.oc); }
  let lastT = 0, slowEma = 16;
  function render(){ if (!ready) return; for (const [id, o] of pool) if (!used.has(id)) o.root.visible = false;
    const now = performance.now(), fdt = lastT ? now - lastT : 16; lastT = now; slowEma += (Math.min(fdt, 120) - slowEma) * .05;
    const want = mode === 'free' && R3.post && !(PP && PP.off) && renderer.capabilities.isWebGL2;
    if (!want){ if (slowEma > 46 && !R3.lowRes){ R3.slowT = (R3.slowT || 0) + fdt; if (R3.slowT > 4500){ R3.lowRes = true; resize3(); } } else R3.slowT = 0;
      renderer.setRenderTarget(null); renderer.render(scene, cam); rendered = true; return; }
    const sz = renderer.getDrawingBufferSize(new T.Vector2()); postSetup(Math.max(4, sz.x), Math.max(4, sz.y));
    if (slowEma > 40){ PP.slow += fdt; if (PP.slow > 3500){ PP.off = true; } } else PP.slow = Math.max(0, PP.slow - fdt * .5);
    renderer.setRenderTarget(PP.rt); renderer.clear(); renderer.render(scene, cam);
    const M = PP.M, P = R3.post;
    M.bright.uniforms.px.value.set(1 / PP.w, 1 / PP.h); M.bright.uniforms.th.value = P.th || .95; pass(M.bright, PP.rt.texture, PP.h2);
    M.down.uniforms.px.value.set(1 / (PP.w >> 1), 1 / (PP.h >> 1)); pass(M.down, PP.h2.texture, PP.q1);
    for (let k = 0; k < 2; k++){ M.blur.uniforms.dir.value.set(1 / (PP.w >> 2), 0); pass(M.blur, PP.q1.texture, PP.q2); M.blur.uniforms.dir.value.set(0, 1 / (PP.h >> 2)); pass(M.blur, PP.q2.texture, PP.q1); }
    const C = M.comp.uniforms; C.tCol.value = PP.rt.texture; C.tB.value = PP.q1.texture; C.tH.value = PP.h2.texture; C.bloom.value = P.bloom != null ? P.bloom : .55; C.sat.value = P.sat || 1.1; C.vig.value = P.vig != null ? P.vig : .5;
    C.tint.value.set(...(P.tint || [1, 1, 1])); C.lift.value = P.lift || 0; C.px.value.set(1 / PP.w, 1 / PP.h); C.sharp.value = P.sharp != null ? P.sharp : .45;
    PP.quad.material = M.comp; renderer.setRenderTarget(null); renderer.render(PP.sc, PP.oc); rendered = true; }
  const ids = new Map(); let zc = 0;
  function autoId(look){ const sig = look.__sig || (look.__sig = Math.random().toString(36)); const n = (ids.get(sig) || 0) + 1; ids.set(sig, n); return sig + ':' + n; }
  function begin(){ used.clear(); ids.clear(); zc = 0; drew = false; rendered = false; bgUsed = false; filt = ''; H3on = false; R3.post = null; }
  function end(){
    if (!bgUsed) bgc.style.display = 'none';
    if (!ready) return;
    if (drew && !rendered) render();
    if (!drew) g3.style.display = 'none';
    if (g3.style.filter !== filt) g3.style.filter = filt;
    H3on = false;
  }
  function world(){ return { scene, cam, T, mat, mesh, GEO, canvasTex, sun, hemi, fill, renderer }; }
  return { init, side, free, shadowBox, compact, flatten, bgFrom, filter, ground, autoId, char, charW, objS, objW, platform, custom, drop, hideShadowPlane, has:id => pool.has(id), project, render, begin, end, world, lift:0, ok:() => ready };
})();
