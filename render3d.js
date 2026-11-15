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
  const MATS = new Map();
  function mat(col, o){ const k = col + (o ? JSON.stringify(o) : ''); let m = MATS.get(k);
    if (!m){ m = new T.MeshStandardMaterial(Object.assign({ color:new T.Color(col), roughness:.6, metalness:.04 }, o || {})); MATS.set(k, m); } return m; }
  const GEO = { sph:new T.SphereGeometry(1, 22, 16), box:new T.BoxGeometry(1, 1, 1), cyl:new T.CylinderGeometry(1, 1, 1, 18), cone:new T.ConeGeometry(1, 1, 14),
    cap:new T.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI * .56), torso:new T.CylinderGeometry(1, .76, 1, 20), skirt:new T.CylinderGeometry(.86, 1, 1, 20, 1, true),
    ring:new T.TorusGeometry(1, .08, 8, 32), brim:new T.CylinderGeometry(1, 1, 1, 24) };
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
  function limb(parent, len, r, m, jointM){ parent.add(mesh('cyl', m, r, len, r, 0, -len / 2, 0)); if (jointM) parent.add(mesh('sph', jointM, r * 1.05, r * 1.05, r * 1.05)); }
  function fist(parent, look, gloves){
    const sk = gloves ? mat('#f5f5f5') : mat(look.skin);
    parent.add(mesh('box', sk, .062, .07, .07, .006, -.032, 0));
    for (let i = 0; i < 4; i++){ const f = mesh('cyl', sk, .0135, .05, .0135, .034, -.012 - i * .017, -.016 + i * .011); f.rotation.x = Math.PI / 2; f.rotation.z = .2; parent.add(f);
      parent.add(mesh('sph', sk, .015, .015, .015, .04, -.012 - i * .017, .012)); }
    const th = mesh('cyl', sk, .014, .045, .014, .02, -.01, -.03); th.rotation.z = -.6; parent.add(th);
    if (gloves) parent.add(mesh('box', mat('#27ae60'), .07, .02, .075, 0, .002, 0));
  }
  function buildRig(look){
    const R = { look, root:G(), legs:[], arms:[] };
    const wt = look.wt || 1, hg = look.hgt || 1;
    const skin = mat(look.skin), shirt = mat(look.shirt), shorts = mat(look.shorts), socks = mat(look.socks), shoes = mat(look.shoes, { roughness:.35 });
    const hips = R.hips = G(); R.body = G(); R.root.add(R.body); R.body.add(hips);
    hips.add(mesh('cyl', shorts, .14 * wt, .17, .1 * wt, 0, .03, 0));
    for (const side of [1, -1]){
      const leg = G(); leg.position.set(0, 0, side * .078 * wt); hips.add(leg);
      if (look.sh){ leg.add(mesh('cyl', shorts, .077 * wt, .15, .077 * wt, 0, -.07, 0)); leg.add(mesh('cyl', skin, .058 * wt, .15, .058 * wt, 0, -.2, 0)); }
      else limb(leg, .28, .066 * wt, shorts);
      const knee = G(); knee.position.y = -.28; leg.add(knee); knee.add(mesh('sph', look.sh ? skin : shorts, .058 * wt, .058 * wt, .058 * wt));
      limb(knee, .27, .054 * wt, look.robe ? shorts : socks);
      if (look.sh) knee.add(mesh('cyl', mat(look.stripe || look.socks), .057 * wt, .025, .057 * wt, 0, -.06, 0));
      const ank = G(); ank.position.y = -.27; knee.add(ank);
      ank.add(mesh('box', shoes, .17, .062, .086, .045, -.022, 0)); ank.add(mesh('box', mat('#1a1a1a', { roughness:.8 }), .175, .018, .09, .045, -.058, 0));
      if (look.sh) ank.add(mesh('box', mat('#ffffff'), .06, .01, .088, .06, -.005, 0));
      R.legs.push({ leg, knee, ank });
    }
    const spine = R.spine = G(); spine.position.y = .02; hips.add(spine);
    const torso = mesh('torso', shirt, .19 * wt, .43, .125 * wt, 0, .215, 0); spine.add(torso);
    if (look.robe){ const sk = mesh('skirt', shirt, .175 * wt, .3, .13 * wt, 0, -.12, 0); spine.add(sk); }
    if (look.stripe) spine.add(mesh('torso', mat(look.stripe), .182 * wt * 1.01, .06, .12 * wt * 1.02, 0, .22, 0));
    if (look.belt) spine.add(mesh('cyl', mat(look.belt), .152 * wt, .05, .105 * wt, 0, .02, 0));
    if (look.tie){ spine.add(mesh('box', mat('#e8e8e8'), .02, .16, .06, .118 * wt, .33, 0)); spine.add(mesh('box', mat(look.tie), .02, .22, .03, .125 * wt, .28, 0)); }
    if (look.suit) spine.add(mesh('box', mat(shade(look.shirt, .8)), .02, .3, .02, .121 * wt, .26, .05));
    spine.add(mesh('cyl', skin, .052, .1, .05, 0, .46, 0));
    const head = R.head = buildHead(look); head.position.set(.01, .6, 0); head.scale.setScalar(1.14); spine.add(head);
    for (const side of [1, -1]){
      const sh = G(); sh.position.set(0, .4, side * .2 * wt); spine.add(sh);
      sh.add(mesh('sph', shirt, .066 * wt, .066 * wt, .066 * wt));
      limb(sh, .23, (look.robe ? .066 : .054) * wt, shirt);
      const el = G(); el.position.y = -.23; sh.add(el); el.add(mesh('sph', look.suit ? shirt : skin, .048 * wt, .048 * wt, .048 * wt));
      limb(el, .21, .044 * wt, look.suit ? shirt : skin);
      const hand = G(); hand.position.y = -.22; el.add(hand); fist(hand, look, look.gloves);
      const holdG = G(); holdG.position.set(.02, -.04, 0); hand.add(holdG);
      if (look.shield && side === 1){ hand.add(mesh('box', mat('#a8c4e8', { transparent:true, opacity:.65, metalness:.3, roughness:.2 }), .03, .62, .2, .08, .1, 0)); }
      R.arms.push({ sh, el, hand, holdG });
    }
    R.carryG = G(); R.carryG.position.y = 1.45; R.root.add(R.carryG);
    R.root.scale.set(1, hg, 1);
    const groups = []; R.root.traverse(o => { if (o.isGroup) groups.push(o); }); groups.forEach(compact);
    R.root.traverse(o => { if (o.isMesh) o.castShadow = !o.userData.dyn; });
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
    for (const ch of g.children){ if (!ch.isMesh || ch.userData.dyn || ch.material.transparent) continue; ch.updateMatrix(); const k = ch.material.uuid; if (!by.has(k)) by.set(k, { m:ch.material, list:[] }); by.get(k).list.push(ch); }
    for (const { m, list } of by.values()){ if (list.length < 2) continue; const geos = list.map(o => o.geometry.clone().applyMatrix4(o.matrix)); for (const o of list) g.remove(o); g.add(new T.Mesh(mergeGeos(geos), m)); }
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
    const t = gameTime, open = talk && Math.sin(t * 22) > 0;
    const brow = { angry:[.06, .5], shout:[.06, .5], shock:[.078, 0], sad:[.06, -.4], pain:[.058, -.4], dizzy:[.058, -.3] }[ex] || [.066, 0];
    U.brows.forEach((b, i) => { b.position.y = brow[0]; b.rotation.x = (i ? -1 : 1) * brow[1]; });
    const eyeY = ex === 'shock' || ex === 'pain' ? 1.25 : ex === 'angry' || ex === 'shout' ? .7 : ex === 'happy' ? .55 : ex === 'ko' || ex === 'dizzy' ? .15 : 1;
    U.eyes.forEach(e => e.scale.y = .026 * eyeY); U.pupils.forEach(p => { p.visible = ex !== 'ko'; p.scale.y = .015 * Math.min(1, eyeY + .2); });
    const m = U.mouth; if (!m) return;
    if (ex === 'shock' || ex === 'shout' || ex === 'pain' || open){ m.scale.set(.012, ex === 'shout' ? .05 : .04, ex === 'shout' ? .07 : .05); }
    else if (ex === 'happy'){ m.scale.set(.012, .026, .085); }
    else if (ex === 'smirk'){ m.scale.set(.012, .014, .06); m.rotation.x = .25; return; }
    else m.scale.set(.012, .014, .062);
    m.rotation.x = 0;
  }
  /* ---------- poz uygula (2D açılar → 3B eklemler) ---------- */
  function applyPose(R, P, face, ex, talk, hold){
    const near = face >= 0 ? 0 : 1, far = 1 - near;
    const L = R.legs, A = R.arms;
    const setLeg = (l, a) => { l.leg.rotation.z = a[0]; l.knee.rotation.z = a[1] - a[0]; l.ank.rotation.z = -a[1]; };
    const sp = P.spread || 0;
    const setArm = (r, a) => { r.sh.rotation.z = a[0]; r.el.rotation.z = a[1] - a[0]; r.hand.rotation.z = 0; r.sh.rotation.x = r === A[0] ? -sp : sp; };
    setLeg(L[near], P.fl); setLeg(L[far], P.bl); setArm(A[near], P.fa); setArm(A[far], P.ba);
    R.hips.position.y = (56 - P.bob) / 100;
    R.spine.rotation.z = -Math.atan2(P.lean, 41);
    R.body.rotation.set(0, 0, 0); R.body.position.set(0, 0, 0);
    if (P.lie){ R.body.rotation.z = Math.PI / 2; R.body.position.y = .12; }
    else if (P.rot){ R.body.rotation.z = -P.rot; R.body.position.y = .55; R.hips.position.y -= .55; }
    setFace(R, ex, talk);
    if (hold === 'box') setHeld(R, near, 'box'); else setHeld(R, near, hold);
  }
  function tintRig(R, tint){
    if (R.tint === tint) return; R.tint = tint;
    R.root.traverse(o => { if (!o.isMesh) return; if (!o.userData.base) o.userData.base = o.material; o.material = tint ? mat(tint, { emissive:new T.Color(tint), emissiveIntensity:.6 }) : o.userData.base; });
  }
  function rigFor(id, look){
    let R = pool.get(id);
    const sig = look.__sig || (look.__sig = Math.random().toString(36));
    if (!R || R.sig !== sig){ if (R){ scene.remove(R.root); R.root.traverse(o => { if (o.isMesh && o.geometry.userData.own) o.geometry.dispose(); }); } R = buildRig(look); R.sig = sig; pool.set(id, R); scene.add(R.root); }
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
    cam = new T.PerspectiveCamera(30, W / H, .1, 400); scene.add(cam);
    hemi = new T.HemisphereLight(0xe8eeff, 0x4a4030, 1.45); scene.add(hemi);
    sun = new T.DirectionalLight(0xfff2dd, 2.3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006;
    const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 6; sc.bottom = -6; sc.near = .5; sc.far = 60; scene.add(sun); scene.add(sun.target);
    fill = new T.DirectionalLight(0x9ab8ff, .6); scene.add(fill);
    bgCanvas = document.createElement('canvas'); bgCanvas.width = W; bgCanvas.height = H; bgCtx = bgCanvas.getContext('2d');
    bgTex = new T.CanvasTexture(bgCanvas); bgTex.colorSpace = T.SRGBColorSpace;
    bgPlane = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map:bgTex, toneMapped:false, depthWrite:false }));
    bgPlane.renderOrder = -10; cam.add(bgPlane);
    shadowPlane = new T.Mesh(new T.PlaneGeometry(400, 12), new T.ShadowMaterial({ opacity:.38 })); shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.receiveShadow = true; scene.add(shadowPlane);
    ready = true; resize3(); return true;
  }
  function resize3(){ if (!ready) return; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.setSize(W * scale, H * scale, false); g3.style.width = (W * scale) + 'px'; g3.style.height = (H * scale) + 'px'; }
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
    scene.background = null; scene.fog = null; hemi.intensity = o.dark ? .75 : 1.25; sun.intensity = o.dark ? 1.4 : 2.3; fill.intensity = .6;
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
    const R = rigFor(id, look); applyPose(R, P, face, ex, talk, hold); tintRig(R, tint);
    const z = R3.zNext != null ? R3.zNext : Math.min(2, zc++ * .16), k = (D - z) / D; R3.zNext = null; const _k = k, sc = s * (look.scale || 1) * _k;     // çizim sırası = derinlik (perspektif telafili)
    R.root.position.set(4.8 + (x / 100 - 4.8) * k, 2.7 + ((540 - y) / 100 - 2.7) * k, z);
    R.root.rotation.set(0, P.back ? Math.PI / 2 : face >= 0 ? -.45 : Math.PI + .45, 0);
    R.root.scale.set(sc, sc * (look.hgt || 1), sc);
    return R;
  }
  /* serbest dünyada karakter (metre / birim) */
  function charW(id, look, P, wx, wy, wz, yaw, s = 1, ex = 'neutral', talk = false, hold = null, extra){
    const R = rigFor(id, look); applyPose(R, P, extra && extra.face || 1, ex, talk, hold); tintRig(R, extra && extra.tint || null);
    const sc = s * (look.scale || 1);
    R.root.position.set(wx, wy, wz); R.root.rotation.set(extra && extra.rx || 0, yaw, extra && extra.rz || 0, 'YXZ'); R.root.scale.set(sc, sc * (look.hgt || 1), sc);
    return R;
  }
  function objS(id, kind, x, y, w, h, rot = 0, shake = 0){ const r = obj(id, kind, w / 100, h / 100); r.position.set(x / 100 + shake, (540 - y) / 100 + (R3.lift || 0), 0); r.rotation.set(0, 0, rot); return r; }
  function objW(id, kind, x, y, z, rot = 0, w, h){ const r = obj(id, kind, w, h); r.position.set(x, y, z); r.rotation.set(0, 0, rot); return r; }
  function custom(id, build){ let o = pool.get(id); if (!o){ o = { root:build(), sig:'c' }; pool.set(id, o); scene.add(o.root); } used.add(id); o.root.visible = true; return o.root; }
  const _v = new T.Vector3();
  function project(x, y, z){ _v.set(x, y, z).project(cam); return { x:(_v.x + 1) / 2 * W, y:(1 - _v.y) / 2 * H, behind:_v.z > 1 }; }
  function free(){ if (!init()) return false; mode = 'free'; drew = true; g3.style.display = 'block'; bgPlane.visible = false; shadowPlane.visible = false; cam.zoom = 1; R3.lift = 0; H3on = false; return true; }
  function render(){ if (!ready) return; for (const [id, o] of pool) if (!used.has(id)) o.root.visible = false; renderer.render(scene, cam); rendered = true; }
  const ids = new Map(); let zc = 0;
  function autoId(look){ const sig = look.__sig || (look.__sig = Math.random().toString(36)); const n = (ids.get(sig) || 0) + 1; ids.set(sig, n); return sig + ':' + n; }
  function begin(){ used.clear(); ids.clear(); zc = 0; drew = false; rendered = false; bgUsed = false; filt = ''; H3on = false; }
  function end(){
    if (!bgUsed) bgc.style.display = 'none';
    if (!ready) return;
    if (drew && !rendered) render();
    if (!drew) g3.style.display = 'none';
    if (g3.style.filter !== filt) g3.style.filter = filt;
    H3on = false;
  }
  function world(){ return { scene, cam, T, mat, mesh, GEO, canvasTex, sun, hemi, fill, renderer }; }
  return { init, side, free, shadowBox, compact, bgFrom, filter, ground, autoId, char, charW, objS, objW, platform, custom, project, render, begin, end, world, lift:0, ok:() => ready };
})();
