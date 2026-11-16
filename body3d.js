'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   body3d.js — gerçekçi futbolcu gövdesi
   Tek parça, iskeletli (SkinnedMesh) beden: eklem topları yok; diz, dirsek, kalça, omuz kesintisiz bükülür.
   Gerçek insan oranları (boy ≈ 1.8 m, baş = boyun 1/7.5'i), heykel gibi şekillendirilmiş kafa (çene, elmacık,
   kaş kemiği, burun, dudak, kulak), saç kabukları, eller, kramponlar, bol şort, kısa/uzun kollu forma,
   çorap bantları, yaka, sırtta isim + numara, göğüste arma. Ayrıca prosedürel futbol animasyonları:
   koşu / sprint / yürüyüş (kalça dönüşü, kol salınımı, diz kalkışı), nefes alan bekleme, kaleci duruşları.
   ========================================================= */
const BODY = (() => {
  let T, W3, WEAVE = null; const TEX = new Map();
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const col3 = h => { const c = new T.Color(h); return [c.r, c.g, c.b]; };
  function weave(){ if (WEAVE) return WEAVE;
    WEAVE = W3.canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2){ const v = 226 + ((x + y) % 4 ? 16 : 0) + Math.random() * 12; c.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; c.fillRect(x, y, 2, 2); }
      c.fillStyle = 'rgba(0,0,0,.045)'; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 1, h); });
    WEAVE.wrapS = WEAVE.wrapT = T.RepeatWrapping; WEAVE.repeat.set(5, 6); return WEAVE; }

  /* ---------- geometri biriktirici (loft) ---------- */
  function acc(){ return { pos:[], uv:[], col:[], si:[], sw:[], tri:[[], []], n:0, seams:[] }; }
  // halkalar: { y, cx, cz, rf (ön x), rb (arka x), rs (yan z), col, m (0 kumaş / 1 ten), w:(y,x,z)=>[[kemik, ağırlık]...] }
  function loft(A, rings, seg, o = {}){
    const base = A.n;
    rings.forEach((r, ri) => {
      for (let j = 0; j <= seg; j++){ const th = j / seg * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        const x = r.cx + (c > 0 ? r.rf : r.rb) * c, z = r.cz + r.rs * s, y = r.y + (r.dy ? r.dy(c, s) : 0);
        A.pos.push(x, y, z); A.uv.push(j / seg, ri / (rings.length - 1)); A.col.push(...r.col);
        const w = r.w(y, x, z), si = [0, 0, 0, 0], sw = [0, 0, 0, 0]; let tot = 0; w.slice(0, 4).forEach(([b, v], k) => { si[k] = b; sw[k] = v; tot += v; });
        for (let k = 0; k < 4; k++) sw[k] /= tot || 1; A.si.push(...si); A.sw.push(...sw); A.n++; }
      A.seams.push([base + ri * (seg + 1), base + ri * (seg + 1) + seg]);
    });
    for (let ri = 0; ri < rings.length - 1; ri++){ const g = rings[ri].m === 1 && rings[ri + 1].m === 1 ? 1 : 0, T0 = A.tri[g];
      for (let j = 0; j < seg; j++){ const a = base + ri * (seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1; if (o.flip) T0.push(a, b, c, b, d, c); else T0.push(a, c, b, b, c, d); } }
    if (o.capBottom){ const r = rings[0]; A.pos.push(r.cx, r.y - (o.capBottom || 0), r.cz); A.uv.push(.5, 0); A.col.push(...r.col); const w = r.w(r.y, r.cx, r.cz); const si = [0, 0, 0, 0], sw = [0, 0, 0, 0]; w.slice(0, 4).forEach(([b, v], k) => { si[k] = b; sw[k] = v; });
      const t = sw.reduce((a, b) => a + b, 0) || 1; A.si.push(...si); A.sw.push(...sw.map(v => v / t)); const ci = A.n++; const g = r.m === 1 ? 1 : 0;
      for (let j = 0; j < seg; j++){ const a = base + j, b = a + 1; if (o.flip) A.tri[g].push(ci, b, a); else A.tri[g].push(ci, a, b); } }
  }
  /* profil + bölgeler → halkalar: bölge sınırlarında iki halka (kumaş kenarı / bant) */
  function ringsFrom(prof, region, bounds, cx, cz, w, k){
    const ys = new Set(prof.map(q => q[0])); for (const y of bounds){ ys.add(y - .0015); ys.add(y + .0015); }
    const at = y => { let i = 0; while (i < prof.length - 2 && prof[i + 1][0] < y) i++; const a = prof[i], c = prof[i + 1], t = clamp((y - a[0]) / (c[0] - a[0]), 0, 1); return [lerp(a[1], c[1], t), lerp(a[2], c[2], t), lerp(a[3], c[3], t)]; };
    return [...ys].filter(y => y >= prof[0][0] && y <= prof[prof.length - 1][0]).sort((a, b) => a - b).map(y => { const [rs, rf, rb] = at(y), R = region(y), l = (R.loose || 1) * k;
      return { y, cx:typeof cx === 'function' ? cx(y) : cx, cz:typeof cz === 'function' ? cz(y) : cz, rf:rf * l, rb:rb * l, rs:rs * l, col:R.col, m:R.m, w }; });
  }
  function finish(A){
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(A.pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(A.uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(A.col, 3));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(A.si, 4)); g.setAttribute('skinWeight', new T.Float32BufferAttribute(A.sw, 4));
    const idx = A.tri[0].concat(A.tri[1]); g.setIndex(idx); g.addGroup(0, A.tri[0].length, 0); g.addGroup(A.tri[0].length, A.tri[1].length, 1);
    g.computeVertexNormals(); const n = g.attributes.normal;
    for (const [a, b] of A.seams){ const x = (n.getX(a) + n.getX(b)) / 2, y = (n.getY(a) + n.getY(b)) / 2, z = (n.getZ(a) + n.getZ(b)) / 2, l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); }
    g.computeBoundingSphere(); g.userData.own = 1; return g;
  }

  /* ---------- kafa: heykel gibi şekillenmiş küre ---------- */
  function headGeo(look){
    const g = new T.SphereGeometry(1, 44, 32), p = g.attributes.position, cols = [], sk = new T.Color(look.skin), lip = new T.Color(look.skin).lerp(new T.Color('#b0504c'), .42),
      blush = new T.Color(look.skin).lerp(new T.Color('#d06a5a'), .16), stub = new T.Color(look.skin).lerp(new T.Color(look.beard || '#2a1a10'), .3), wide = look.face === 'round' ? 1.06 : look.face === 'square' ? 1.03 : 1;
    const g2 = (a, b) => Math.exp(-a * a - b * b);
    for (let i = 0; i < p.count; i++){
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const front = Math.max(0, x);
      let c = sk.clone();
      if (y < -.05){ const k = (-y - .05) / .95; z *= 1 - .3 * k * (look.face === 'square' ? .6 : 1); x *= 1 - .1 * k; }    // çene daralır
      if (x < 0) x *= 1.06;                                                                                                   // ense
      if (y > .55) { x *= .97; }
      x += front * .07 * g2((y - .26) / .12, z / .5);                                                                         // kaş kemiği
      x -= front * .05 * g2((y - .1) / .09, (Math.abs(z) - .34) / .12);                                                      // göz çukuru
      z += Math.sign(z) * .035 * front * g2((y + .02) / .12, (Math.abs(z) - .62) / .14);                                     // elmacık
      x += .17 * Math.pow(front, 4) * g2((y + .1) / .17, z / .12) * (1 + .45 * sstep(.1, -.22, y)); x += .03 * Math.pow(front, 4) * g2((y + .2) / .06, (Math.abs(z) - .11) / .06);   // burun + kanatları
      x += .045 * Math.pow(front, 3) * g2((y + .41) / .05, z / .22) + .04 * Math.pow(front, 3) * g2((y + .52) / .05, z / .2);   // üst + alt dudak
      x += .06 * front * g2((y + .78) / .12, z / .3);                                                                         // çene ucu
      if (front > .55 && Math.abs(y + .465) < .095 && Math.abs(z) < .27 - Math.abs(y + .465) * .8) c = lip;
      else if (front > .4 && Math.abs(y + .1) < .14 && Math.abs(Math.abs(z) - .5) < .14) c = blush;
      if (look.beard && look.bs === 'stubble' && y < -.25 && x > -.3) c = stub;
      p.setXYZ(i, x * .1, y * .118, z * .079 * wide); cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals(); sphereSeam(g, 44, 32); g.userData.own = 1; return g;
  }
  function sphereSeam(g, ws, hs){ const n = g.attributes.normal; for (let r = 0; r <= hs; r++){ const a = r * (ws + 1), c = a + ws; const x = (n.getX(a) + n.getX(c)) / 2, y = (n.getY(a) + n.getY(c)) / 2, z = (n.getZ(a) + n.getZ(c)) / 2, l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(c, x / l, y / l, z / l); } }
  /* saç: kafa kabuğundan saç çizgisinin üstü, biraz kalın */
  function hairGeo(look, src, style){
    const sp = src.attributes.position, sn = src.attributes.normal, idx = src.index.array, pos = [], keep = new Uint8Array(sp.count);
    const thick = style === 'curly' ? .016 : style === 'long' ? .012 : .007;
    for (let i = 0; i < sp.count; i++){ const x = sp.getX(i) / .1, y = sp.getY(i) / .118, z = sp.getZ(i) / .079;
      const hairline = x > .3 ? .42 - (style === 'long' ? .05 : 0) : x > -.2 ? (Math.abs(z) > .6 ? .12 : .3) : (style === 'long' ? -.95 : -.42);
      keep[i] = y > hairline - .08 && !(style === 'mohawk' && Math.abs(z) > .22) ? 1 : 0;
      const fade = sstep(hairline - .08, hairline + .1, y);
      const bump = style === 'curly' ? (Math.sin(x * 40) * Math.sin(y * 37) * Math.sin(z * 41)) * .008 : style === 'spiky' ? Math.max(0, Math.sin(x * 30 + z * 22)) * .012 : 0;
      const t = (thick + bump + (style === 'mohawk' ? .03 * Math.max(0, y) : 0) + (style === 'long' && x < 0 ? .01 : 0)) * fade - .0015 * (1 - fade);
      pos.push(sp.getX(i) + sn.getX(i) * t, sp.getY(i) + sn.getY(i) * t + (style === 'mohawk' ? .02 * Math.max(0, y) : 0), sp.getZ(i) + sn.getZ(i) * t); }
    const tri = []; for (let i = 0; i < idx.length; i += 3) if (keep[idx[i]] && keep[idx[i + 1]] && keep[idx[i + 2]]) tri.push(idx[i], idx[i + 1], idx[i + 2]);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(tri); g.computeVertexNormals(); sphereSeam(g, 44, 32); g.userData.own = 1; return g;
  }
  function buildFace(look, headBone, mat, mesh){
    const H = new T.Group(); H.position.set(.008, .1, 0); headBone.add(H);
    const hg = headGeo(look); const head = new T.Mesh(hg, new T.MeshStandardMaterial({ vertexColors:true, map:faceTex(look), roughness:.5, metalness:0 })); head.castShadow = true; H.add(head);
    const U = headBone.userData = { eyes:[], pupils:[], brows:[], fs:.42 };
    const skin = mat(look.skin, { roughness:.55 });
    for (const z of [.079, -.079]){ const e = mesh('sph', skin, .017, .028, .009, -.008, .004, z); e.rotation.y = z > 0 ? -.35 : .35; H.add(e); const e2 = mesh('sph', mat(new T.Color(look.skin).multiplyScalar(.8).getStyle()), .009, .016, .004, -.006, .004, z * 1.06); H.add(e2); }   // kulaklar
    if (look.hs === 'mask'){ H.add(new T.Mesh(hg, mat('#121212', { roughness:.7 }))); H.children[H.children.length - 1].scale.setScalar(1.03); }
    const white = mat('#f4f1ec', { roughness:.25 }), iris = mat(look.eye || '#3b2a1a', { roughness:.15 }), browM = mat(look.brow || (['bald', 'hat', 'helmet', 'cap', 'mask'].includes(look.hs) ? '#2a1a10' : look.hair || '#2a1a10'), { roughness:.9 });
    for (const z of [.028, -.028]){
      const e = mesh('sph', white, .0078, .0096, .0135, .086, .013, z); e.userData.dyn = 1; H.add(e); U.eyes.push(e);
      const p = mesh('sph', iris, .0045, .0066, .0066, .092, .013, z); p.userData.dyn = 1; H.add(p); U.pupils.push(p);
      const b = mesh('box', browM, .0022, .0022, .022, .0962, .034, z); b.userData.dyn = 1; H.add(b); U.brows.push(b);
      const pu = mesh('sph', mat('#0a0a0a', { roughness:.1 }), .0018, .0028, .0028, .0955, .013, z); pu.userData.dyn = 1; H.add(pu);
      const lid = mesh('cap', mat(new T.Color(look.skin).multiplyScalar(.93).getStyle(), { roughness:.6 }), .009, .009, .013, .085, .016, z); lid.rotation.z = -.25; H.add(lid);
    }
    U.mouth = mesh('box', mat('#5a2422'), .003, .0018, .02, .0985, -.0545, 0); U.mouth.userData.dyn = 1; H.add(U.mouth);
    // saç
    const hm = new T.MeshStandardMaterial({ color:look.hair || '#222222', roughness:.82, metalness:.02 });
    const style = look.hs || 'short';
    if (['short', 'curly', 'spiky', 'long', 'bun', 'mohawk'].includes(style)){ const h = new T.Mesh(hairGeo(look, hg, style), hm); h.castShadow = true; H.add(h);
      if (style === 'bun'){ H.add(mesh('sph', hm, .034, .034, .034, -.075, .085, 0)); }
      if (style === 'long'){ H.add(mesh('box', hm, .03, .1, .13, -.08, -.06, 0)); } }
    else if (style === 'cap'){ H.add(mesh('cap', mat(look.cap), .108, .12, .086, -.005, .02, 0)); H.add(mesh('box', mat(look.cap), .08, .008, .1, .1, .045, 0)); }
    else if (style === 'helmet'){ H.add(mesh('cap', mat('#3d4a63', { metalness:.4, roughness:.3 }), .118, .13, .095, 0, 0, 0)); }
    else if (style === 'hat'){ H.add(mesh('brim', mat('#0d0d0d'), .15, .01, .15, 0, .08, 0)); H.add(mesh('cyl', mat('#0d0d0d'), .085, .1, .085, 0, .13, 0)); }
    if (look.headband) { const hb = mesh('cyl', mat(look.headband), .103, .022, .083, -.004, .055, 0); H.add(hb); }
    if (look.bandana) H.add(mesh('cyl', mat(look.bandana), .104, .026, .084, -.004, .06, 0));
    if (look.beard && look.bs && look.bs !== 'stubble'){ const bm = mat(look.beard, { roughness:.9 });
      if (look.bs === 'goatee') H.add(mesh('sph', bm, .022, .026, .024, .09, -.088, 0));
      else if (look.bs === 'full') H.add(mesh('sph', bm, .085, .055, .072, .02, -.065, 0));
      else if (look.bs === 'long'){ const b = mesh('cone', bm, .06, .16, .06, .05, -.15, 0); b.rotation.z = Math.PI; H.add(b); H.add(mesh('sph', bm, .08, .045, .075, .03, -.07, 0)); } }
    if (look.glasses) for (const z of [.028, -.028]) H.add(mesh('box', mat('#0a0a0a', { metalness:.5, roughness:.1 }), .004, .016, .03, .1, .014, z));
    R3.compact(H); return H;
  }

  /* ---------- el: parmaklar ve başparmak — kıvrık, boğumlu ama kesintisiz tüpler (avuç gövdeyle tek parça) ---------- */
  function tubeAlong(pts, r0, r1, seg = 10, rad = 8){
    const curve = new T.CatmullRomCurve3(pts), P = curve.getSpacedPoints(seg), pos = [], idx = [], X = new T.Vector3(1, 0, 0), tmp = new T.Vector3(), Bn = new T.Vector3(), Nn = new T.Vector3();
    for (let i = 0; i <= seg; i++){ const t = i / seg, tg = curve.getTangentAt(Math.min(.999, t)); Bn.crossVectors(tg, X).normalize(); if (Bn.lengthSq() < .1) Bn.set(0, 0, 1); Nn.crossVectors(Bn, tg).normalize();
      const knuckle = 1 + .1 * Math.exp(-Math.pow((t - .42) / .06, 2)) + .08 * Math.exp(-Math.pow((t - .72) / .05, 2)), r = lerp(r0, r1, t) * knuckle * (i === seg ? .55 : 1);
      for (let j = 0; j < rad; j++){ const a = j / rad * Math.PI * 2; tmp.copy(P[i]).addScaledVector(Nn, Math.cos(a) * r * 1.08).addScaledVector(Bn, Math.sin(a) * r * .92); pos.push(tmp.x, tmp.y, tmp.z); } }
    const tip = P[seg].clone().add(curve.getTangentAt(.999).multiplyScalar(r1 * .6)); pos.push(tip.x, tip.y, tip.z); const ti = (seg + 1) * rad;
    for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++){ const a = i * rad + j, b2 = i * rad + (j + 1) % rad, c2 = a + rad, d = b2 + rad; idx.push(a, c2, b2, b2, c2, d); }
    for (let j = 0; j < rad; j++) idx.push(seg * rad + j, ti, seg * rad + (j + 1) % rad);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.userData.own = 1; return g;
  }
  function handGroup(side, M, gk, look, mat){
    const g = new T.Group(), S = gk ? 1.16 : 1, V = (x, y, z) => new T.Vector3(x, y, z);
    // parmaklar: işaret (önde) → serçe (arkada); boğumlarda hafif bükülme, avuca doğru kıvrık
    [[.028, .072, .0088, 1], [.01, .08, .0092, 1.05], [-.008, .076, .009, 1.1], [-.025, .062, .008, 1.2]].forEach(([x, L, r, cu]) => {
      const a1 = .25 * cu, a2 = .55 * cu, a3 = .75 * cu, s1 = L * .45, s2 = L * .32, s3 = L * .23, z0 = 0, y0 = -.088;
      const p0 = V(x * S, y0 + .012, z0), p1 = V(x * S, y0, z0);
      const p2 = V(x * S, p1.y - Math.cos(a1) * s1 * S, z0 - side * Math.sin(a1) * s1 * S);
      const p3 = V(x * S, p2.y - Math.cos(a2) * s2 * S, p2.z - side * Math.sin(a2) * s2 * S);
      const p4 = V(x * S, p3.y - Math.cos(a3) * s3 * S, p3.z - side * Math.sin(a3) * s3 * S);
      const m = new T.Mesh(tubeAlong([p0, p1, p2, p3, p4], r * S, r * .82 * S), M); m.castShadow = true; g.add(m); });
    // başparmak: avucun önünden öne-aşağı, hafif içe
    { const p = [V(.022, -.03, -side * .008), V(.036, -.05, -side * .014), V(.046, -.072, -side * .02), V(.05, -.09, -side * .028)].map(v => v.multiplyScalar(S));
      const m = new T.Mesh(tubeAlong(p, .0118 * S, .0092 * S, 8, 8), M); m.castShadow = true; g.add(m); }
    if (gk){ const band = new T.Mesh(new T.CylinderGeometry(.034, .034, .022, 14), mat(look.stripe || '#27ae60')); band.position.y = -.002; band.scale.z = .62; g.add(band); }
    R3.compact(g); return g;
  }
  /* ---------- yüz dokusu: kaş kılları, kirpik çizgisi, burun delikleri, dudak, yüz gölgeleri, sakal izi ---------- */
  function faceTex(look){
    const key = 'f|' + look.skin + '|' + (look.brow || look.hair) + '|' + (look.beard ? look.bs : '') + '|' + look.face;
    let t = TEX.get(key); if (t) return t;
    const S = 512, UV = (nx, ny, nz) => { const th = Math.acos(clamp(ny, -1, 1)); let ph = Math.atan2(nz, -nx); if (ph < 0) ph += Math.PI * 2; return [ph / (Math.PI * 2) * S, (th / Math.PI) * S]; };
    const dir = (y, z) => { const x = Math.sqrt(Math.max(0, 1 - y * y - z * z)); return [x, y, z]; };
    t = W3.canvasTex(S, S, (c) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, S, S);
      const P = (y, z) => UV(...dir(y, z));
      const blob = (y, z, rx, ry, col) => { const [u, v] = P(y, z); const g = c.createRadialGradient(u, v, 0, u, v, rx); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.translate(u, v); c.scale(1, ry / rx); c.translate(-u, -v); c.fillStyle = g; c.fillRect(u - rx, v - rx, rx * 2, rx * 2); c.restore(); };
      // göz çukuru gölgesi, burun yanları, yanaklar
      for (const z of [.35, -.35]){ blob(.12, z, 15, 9, 'rgba(120,80,70,.2)'); }
      blob(.45, 0, 40, 14, 'rgba(255,255,255,.0)');
      // kaşlar: kıl çizgileri
      const bc = look.brow || (['bald', 'hat', 'helmet', 'cap', 'mask'].includes(look.hs) ? '#2a1a10' : look.hair || '#2a1a10');
      c.strokeStyle = bc; c.lineCap = 'round';
      for (const s of [1, -1]) for (let i = 0; i < 26; i++){ const k = i / 25, z = s * (.16 + k * .36), y = .27 + .05 * Math.sin(k * Math.PI) - k * .02;
        const [u, v] = P(y, z), [u2, v2] = P(y + .03, z + s * .05); c.globalAlpha = .35 + .4 * Math.sin(k * Math.PI); c.lineWidth = 1.1 + 1.2 * (1 - k); c.beginPath(); c.moveTo(u, v + 2); c.lineTo(u2, v2); c.stroke(); }
      c.globalAlpha = 1;
      // kirpik çizgisi (üst göz kapağı)
      for (const s of [1, -1]){ c.strokeStyle = 'rgba(45,28,22,.55)'; c.lineWidth = 1.3; c.beginPath(); for (let i = 0; i <= 10; i++){ const k = i / 10, z = s * (.22 + k * .26), y = .145 + .03 * Math.sin(k * Math.PI); const [u, v] = P(y, z); i ? c.lineTo(u, v) : c.moveTo(u, v); } c.stroke(); }
      // burun delikleri + burun ucu gölgesi
      for (const s of [1, -1]) blob(-.21, s * .07, 3, 2, 'rgba(70,35,30,.4)');
      // dudak çizgisi ve alt dudak gölgesi
      { c.strokeStyle = 'rgba(110,55,50,.5)'; c.lineWidth = 1.4; c.beginPath(); for (let i = 0; i <= 12; i++){ const z = -.24 + i / 12 * .48, y = -.45 - .015 * Math.cos(z * 6); const [u, v] = P(y, z); i ? c.lineTo(u, v) : c.moveTo(u, v); } c.stroke();
        blob(-.55, 0, 12, 5, 'rgba(110,60,55,.22)'); }
      // ağız kenarı çizgileri
      for (const s of [1, -1]){ c.strokeStyle = 'rgba(120,80,70,.22)'; c.lineWidth = 1.5; c.beginPath(); const a = P(-.2, s * .2), b2 = P(-.42, s * .28); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b2[0]) / 2 + s * 4, (a[1] + b2[1]) / 2, b2[0], b2[1]); c.stroke(); }
      // sakal izi
      if (look.beard && look.bs === 'stubble'){ c.fillStyle = 'rgba(40,25,15,.18)'; for (let i = 0; i < 2400; i++){ const z = (Math.random() - .5) * 1.4, y = -.3 - Math.random() * .6; if (y * y + z * z > .95) continue; const [u, v] = P(y, z); c.fillRect(u, v, 1.2, 1.2); } }
    });
    t.colorSpace = T.SRGBColorSpace; TEX.set(key, t); return t;
  }
  /* ---------- krampon: ayak biçimli gövde (topuk, burun, üst), koyu taban, kenar şeritleri, çiviler ---------- */
  const BOOTG = new Map();
  function bootGeo(colTop, colSole, colStripe, cleats){
    const key = colTop + colSole + colStripe + cleats; if (BOOTG.has(key)) return BOOTG.get(key);
    const W0 = x => { const tbl = [[-.07, .012], [-.066, .027], [-.05, .035], [-.02, .038], [.03, .04], [.08, .045], [.12, .045], [.15, .042], [.17, .037], [.185, .03], [.195, .021], [.2, .01]]; let i = 0; while (i < tbl.length - 2 && tbl[i + 1][0] < x) i++; const a = tbl[i], c = tbl[i + 1]; return lerp(a[1], c[1], clamp((x - a[0]) / (c[0] - a[0]), 0, 1)); };
    const H0 = x => { const tbl = [[-.07, .045], [-.066, .09], [-.04, .102], [-.01, .1], [.03, .09], [.08, .072], [.12, .058], [.15, .05], [.175, .044], [.19, .037], [.2, .024]]; let i = 0; while (i < tbl.length - 2 && tbl[i + 1][0] < x) i++; const a = tbl[i], c = tbl[i + 1]; return lerp(a[1], c[1], clamp((x - a[0]) / (c[0] - a[0]), 0, 1)); };
    const xs = []; for (let i = 0; i <= 22; i++) xs.push(-.07 + i / 22 * .27);
    const R = 18, pos = [], col = [], idx = [], cT = new T.Color(colTop), cS = new T.Color(colSole), cR = new T.Color(colStripe), base = -.05, sole = .013;
    xs.forEach((x, i) => { const w = W0(x), h = H0(x);
      for (let j = 0; j < R; j++){ const a = j / R * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const z = w * ca * (sa < 0 ? 1.02 : 1), y = base + (sa >= 0 ? sole + (h - sole) * Math.pow(sa, .75) : sole * (1 + sa * .9));
        pos.push(x, y, z); const yy = y - base, side2 = Math.abs(ca) > .35 && sa > 0, wave = .03 + .022 * Math.sin((x + .07) / .267 * Math.PI * 1.1);
        const stripe = (side2 && Math.abs(yy - wave) < .0045 && x > -.04 && x < .16) || (x < -.045 && yy > .02 && sa > .1) || (yy > sole + .001 && yy < sole + .005);
        const c = yy < sole + .001 ? cS : stripe ? cR : cT; col.push(c.r, c.g, c.b); } });
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < R; j++){ const a = i * R + j, b2 = i * R + (j + 1) % R, c2 = a + R, d = b2 + R; idx.push(a, c2, b2, b2, c2, d); }
    const cap = (i, flip) => { const ci = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let j = 0; j < R; j++){ cx += pos[(i * R + j) * 3]; cy += pos[(i * R + j) * 3 + 1]; cz += pos[(i * R + j) * 3 + 2]; } pos.push(cx / R, cy / R, cz / R); col.push(cT.r, cT.g, cT.b);
      for (let j = 0; j < R; j++){ const a = i * R + j, b2 = i * R + (j + 1) % R; if (flip) idx.push(ci, b2, a); else idx.push(ci, a, b2); } };
    cap(0, true); cap(xs.length - 1, false);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    BOOTG.set(key, g); return g;
  }
  function bootMesh(look, side, mat){
    const g = new T.Group(), top = look.shoes || '#111111', sh = !!look.sh;
    const m = new T.Mesh(bootGeo(top, sh ? '#1a1a1a' : '#202020', sh ? (look.stripe || '#ffffff') : top, sh), new T.MeshStandardMaterial({ vertexColors:true, roughness:sh ? .42 : .55, metalness:0 })); m.castShadow = true; g.add(m);
    if (sh){ const stud = mat('#cfcfcf', { metalness:.6, roughness:.3 }); for (const [x, z] of [[.15, .022], [.15, -.022], [.1, .028], [.1, -.028], [.05, .026], [.05, -.026], [-.045, .02], [-.045, -.02]]){ const st = new T.Mesh(W3.GEO.cyl, stud); st.scale.set(.007, .012, .007); st.position.set(x, -.054, z); g.add(st); } }
    R3.compact(g); return g;
  }
  /* ---------- sırt numarası / arma ---------- */
  function decalTex(key, w, h, draw){ let t = TEX.get(key); if (!t){ t = W3.canvasTex(w, h, draw); TEX.set(key, t); } return t; }
  function decal(tex, w, h){ return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map:tex, transparent:true, alphaTest:.35, roughness:.75, polygonOffset:true, polygonOffsetFactor:-2 })); }

  /* ---------- iskelet + beden ---------- */
  function build(look){
    T = R3.world().T; W3 = R3.world(); const { mat, mesh } = W3;
    const wt = look.wt || 1, ath = look.sh || look.athl, gk = !!look.gloves;
    const bones = [], B = (parent, x, y, z) => { const b = new T.Bone(); b.position.set(x, y, z); if (parent) parent.add(b); bones.push(b); return bones.length - 1; };
    const iRoot = B(null, 0, 0, 0), iPel = B(bones[iRoot], 0, .98, 0);
    const iHip = [B(bones[iPel], 0, -.06, .094 * wt), B(bones[iPel], 0, -.06, -.094 * wt)];
    const iKnee = iHip.map(h => B(bones[h], 0, -.45, 0)), iAnk = iKnee.map(k => B(bones[k], 0, -.42, 0));
    const iSp = B(bones[iPel], 0, .11, 0), iCh = B(bones[iSp], 0, .2, 0), iNeck = B(bones[iCh], 0, .19, 0), iHead = B(bones[iNeck], 0, .08, 0);
    const SW = .2 * wt;
    const iSh = [B(bones[iCh], -.005, .15, SW), B(bones[iCh], -.005, .15, -SW)];
    const iEl = iSh.map(s => B(bones[s], 0, -.29, 0)), iHand = iEl.map(e => B(bones[e], 0, -.26, 0));
    const root = bones[iRoot]; root.updateMatrixWorld(true);
    // bölge renkleri
    const C = { skin:col3(look.skin), shirt:col3(look.shirt || '#888888'), shorts:col3(look.shorts || '#333333'), socks:col3(look.socks || look.shorts || '#333333'),
      stripe:col3(look.stripe || look.shirt || '#ffffff') };
    const sleeveLong = gk || look.ls || look.suit || !look.sh || look.robe;
    const A = acc(), seg = 22;
    /* bacaklar */
    for (let s = 0; s < 2; s++){
      const cz = (s ? -1 : 1) * .094 * wt, hip = iHip[s], knee = iKnee[s], ank = iAnk[s];
      const w = y => { const out = []; const kb = sstep(.4, .55, y), ab = sstep(.05, .13, y), pb = sstep(.86, 1.0, y) * .55;
        if (y > .55){ out.push([hip, 1 - pb]); if (pb) out.push([iPel, pb]); } else if (y > .4){ out.push([hip, kb], [knee, 1 - kb]); } else { out.push([knee, ab], [ank, 1 - ab]); } return out; };
      const prof = [[.03, .026, .026, .028], [.07, .027, .027, .029], [.14, .031, .03, .033], [.24, .04, .036, .048], [.34, .048, .043, .062], [.42, .046, .045, .055], [.47, .048, .05, .048],
        [.52, .053, .055, .05], [.62, .064, .066, .06], [.75, .074, .077, .072], [.86, .082, .085, .085], [.96, .085, .09, .095]];
      const k = (.8 + .2 * wt) * (ath ? 1 : 1.04);
      const region = look.sh ? (y => y > .63 ? { col:C.shorts, m:0, loose:1.17 } : y > .4 ? { col:C.skin, m:1 } : y > .355 && y < .38 ? { col:C.stripe, m:0, loose:1.07 } : { col:C.socks, m:0, loose:1.06 })
        : (y => ({ col:look.robe && y < .5 ? C.shirt : C.shorts, m:0, loose:look.robe ? 1.25 : 1.08 }));
      loft(A, ringsFrom(prof, region, look.sh ? [.63, .4, .355, .38] : [], 0, cz, w, k), seg);
    }
    /* gövde */
    { const w = (y, x, z) => { const out = [];
        const a = sstep(.98, 1.12, y), bb = sstep(1.2, 1.32, y);
        if (y < 1.12){ out.push([iPel, 1 - a]); if (a) out.push([iSp, a]); } else if (y < 1.32){ out.push([iSp, 1 - bb]); if (bb) out.push([iCh, bb]); } else out.push([iCh, 1]);
        if (y < .97){ const hk = sstep(.97, .86, y) * .5 * sstep(.03, .1, Math.abs(z)); if (hk) out.push([iHip[z > 0 ? 0 : 1], hk]); }
        return out; };
      const k = (ath ? 1 : 1.06) * wt;
      const prof = [[.87, .1, .05, .06], [.9, .15, .09, .11], [.98, .165, .095, .12], [1.06, .148, .09, .096], [1.14, .15, .096, .096], [1.22, .16, .107, .1], [1.3, .17, .117, .102],
        [1.37, .182, .112, .1], [1.41, .184, .1, .095], [1.44, .158, .088, .082], [1.47, .112, .074, .07], [1.495, .078, .058, .058], [1.515, .062, .05, .05]];
      const region = look.robe ? (y => ({ col:C.shirt, m:0, loose:1.05 })) : look.sh ? (y => y > 1.0 ? { col:C.shirt, m:0, loose:y < 1.08 ? 1.075 : 1.045 } : { col:C.shorts, m:0, loose:1.04 }) : (y => y > .99 ? { col:C.shirt, m:0, loose:1.03 } : { col:C.shorts, m:0, loose:1.02 });
      loft(A, ringsFrom(prof, region, look.robe ? [] : [1.0], 0, 0, w, k), 28, { capBottom:.01 });
    }
    /* boyun */
    { const w = y => { const a = sstep(1.47, 1.53, y), b = sstep(1.54, 1.58, y); return y < 1.53 ? [[iCh, 1 - a], [iNeck, a]] : [[iNeck, 1 - b], [iHead, b]]; };
      loft(A, [[1.46, .06], [1.51, .054], [1.55, .05], [1.6, .046]].map(([y, r]) => ({ y, cx:.005, cz:0, rf:r * .95, rb:r * 1.02, rs:r * 1.05, col:C.skin, m:1, w })), 16); }
    /* kollar */
    for (let s = 0; s < 2; s++){
      const sg = s ? -1 : 1, cz = sg * SW, sh = iSh[s], el = iEl[s], hd = iHand[s];
      const w = y => { const c = sstep(1.46, 1.36, y), e = sstep(1.1, 1.2, y), h = sstep(.86, .93, y);
        if (y > 1.2){ const out = [[sh, c]]; if (c < 1) out.push([iCh, 1 - c]); return out; } if (y > 1.1) return [[sh, e], [el, 1 - e]]; return [[el, h], [hd, 1 - h]]; };
      const prof = [[.795, .014, .036, .034], [.81, .0165, .043, .041], [.835, .018, .044, .042], [.86, .019, .04, .038], [.877, .02, .031, .029], [.89, .024, .024, .023], [.95, .028, .026, .025], [1.02, .033, .034, .032], [1.1, .036, .038, .036], [1.15, .034, .035, .036], [1.2, .038, .041, .04], [1.3, .044, .047, .046],
        [1.36, .05, .052, .05], [1.42, .056, .057, .056], [1.465, .044, .046, .046]];
      const k = (.86 + .14 * wt) * (ath ? 1 : 1.05);
      const glove = col3('#f1f1f1'), handR = y => gk && y < .9 ? { col:glove, m:0, loose:1.14 } : { col:C.skin, m:1 };
      const region = sleeveLong ? (y => y > .95 ? { col:C.shirt, m:0, loose:y > 1.36 ? 1.06 : 1.12 } : y > .915 ? { col:gk ? C.stripe : C.shirt, m:0, loose:1.12 } : handR(y))
        : (y => y > 1.315 ? { col:C.shirt, m:0, loose:y > 1.38 ? 1.08 : 1.2 } : y > 1.3 ? { col:C.stripe, m:0, loose:1.2 } : handR(y));
      loft(A, ringsFrom(prof, region, (sleeveLong ? [.915, .95] : [1.3, 1.315]).concat(gk ? [.9] : []), 0, y => cz - sg * Math.max(0, y - 1.39) * 1.6, w, k), 16, { capBottom:.004 });
    }
    const geo = finish(A);
    const clothM = new T.MeshStandardMaterial({ vertexColors:true, map:weave(), roughness:.8, metalness:0 }), skinM = new T.MeshStandardMaterial({ vertexColors:true, roughness:.55, metalness:0 });
    const body = new T.SkinnedMesh(geo, [clothM, skinM]); body.castShadow = true; body.receiveShadow = false; body.frustumCulled = false;
    body.add(root); body.updateMatrixWorld(true); body.bind(new T.Skeleton(bones));
    const bn = i => bones[i];
    /* kafa, eller, kramponlar, aksesuar */
    const headB = bn(iHead); buildFace(look, headB, mat, mesh);
    const handM = gk ? mat('#f1f1f1', { roughness:.6 }) : mat(look.skin, { roughness:.55 });
    const holdGs = [];
    for (let s = 0; s < 2; s++){ const hb = bn(iHand[s]), g = handGroup(s ? -1 : 1, handM, gk, look, mat); hb.add(g);
      const holdG = new T.Group(); holdG.position.set(.02, -.07, 0); g.add(holdG); holdGs.push(holdG); }
    for (let s = 0; s < 2; s++){ const ab = bn(iAnk[s]); ab.add(bootMesh(look, s ? -1 : 1, mat)); }
    const chest = bn(iCh);
    if (look.sh){ const st = mat(look.stripe || '#ffffff'); const col = mesh('ring', st, .062, .062, .062, .002, .222, 0); col.rotation.x = Math.PI / 2; col.scale.set(.06, .064, .28); chest.add(col);
      if (look.num){ const key = 'b|' + look.num + '|' + (look.nm || '') + '|' + look.stripe + '|' + look.shirt;
        const bt = decalTex(key, 256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; const fg = look.stripe || '#ffffff', ol = shade(look.shirt, .55);
          if (look.nm){ c.font = '900 34px ' + FONT; c.lineWidth = 6; c.strokeStyle = ol; c.strokeText(look.nm.toLocaleUpperCase('tr-TR'), w / 2, 40, 230); c.fillStyle = fg; c.fillText(look.nm.toLocaleUpperCase('tr-TR'), w / 2, 40, 230); }
          c.font = '900 150px ' + FONT; c.lineWidth = 12; c.strokeStyle = ol; c.strokeText(look.num, w / 2, 152); c.fillStyle = fg; c.fillText(look.num, w / 2, 152); });
        const bk = decal(bt, .27, .27); bk.position.set(-.112 * wt, .02, 0); bk.rotation.y = -Math.PI / 2; chest.add(bk);
        const ct = decalTex('c|' + look.stripe + '|' + look.shirt + '|' + look.num, 128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = look.stripe || '#ffffff'; c.beginPath(); c.moveTo(20, 18); c.lineTo(58, 10); c.lineTo(58, 70); c.quadraticCurveTo(39, 92, 20, 70); c.closePath(); c.fill();
          c.fillStyle = shade(look.shirt, .6); c.font = '900 38px ' + FONT; c.fillText('A', 39, 44); c.fillStyle = look.stripe || '#ffffff'; c.font = '900 46px ' + FONT; c.fillText(look.num, 96, 46); });
        const cr = decal(ct, .1, .1); cr.position.set(.124 * wt, .06, -.06); cr.rotation.y = Math.PI / 2; chest.add(cr); } }
    if (look.belt) bn(iPel).add(mesh('cyl', mat(look.belt), .1 * wt, .045, .17 * wt, 0, -.04, 0));
    if (look.robe){ const sk = mesh('skirt', mat(look.shirt), .12 * wt, .36, .18 * wt, 0, -.18, 0); bn(iPel).add(sk); }
    if (look.tie){ chest.add(mesh('box', mat(look.tie), .012, .2, .03, .118, .1, 0)); }
    /* rig nesnesi — eski iskeletle aynı arayüz (applyPose, setFace, setHeld, tint) */
    const R = { look, real:true, root:new T.Group(), legs:[], arms:[], hipBase:.98 };
    R.body = new T.Group(); R.root.add(R.body); R.body.add(body);
    R.hips = bn(iPel); R.spine = bn(iSp); R.chest = chest; R.neck = bn(iNeck); R.head = headB;
    for (let s = 0; s < 2; s++){ R.legs.push({ leg:bn(iHip[s]), knee:bn(iKnee[s]), ank:bn(iAnk[s]) }); R.arms.push({ sh:bn(iSh[s]), el:bn(iEl[s]), hand:bn(iHand[s]), holdG:holdGs[s], side:s ? -1 : 1 }); }
    R.carryG = new T.Group(); R.carryG.position.y = 1.9; R.root.add(R.carryG);
    R.root.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) o.castShadow = !o.userData.dyn && !o.material.transparent; });
    return R;
  }

  /* ---------- prosedürel futbol animasyonları (3B poz: P.L3) ---------- */
  // bacak: h (kalça öne +), k (diz, bükülme -), a (ayak bileği), ab (dışa açılma), tw (dönme) · kol: s (öne +), e (dirsek +), ab, tw
  function gait(ph, sp, o = {}){
    const k = clamp((sp - 2) / 6.5, 0, 1), walk = sp < 2.4, back = o.back || 0, side = o.side || 0;
    const L = { legs:[], arms:[], pel:{}, sp:{}, hd:{} };
    for (let i = 0; i < 2; i++){
      const p = ph + i * Math.PI, sn = Math.sin(p);
      let hip, knee;
      if (walk){ const a = .1 + sp * .12; hip = a * sn * (back ? -.8 : 1); knee = .08 + (.25 + sp * .12) * Math.pow(Math.max(0, Math.sin(p + 1.2)), 2); }
      else { hip = (.32 + .52 * k) * sn + .1 * k; knee = .28 + (.55 + 1.15 * k) * Math.pow(.5 + .5 * Math.sin(p + 1.75), 1.7); }
      const shin = hip - knee;
      const foot = -shin * (walk ? .9 : .7) + (walk ? 0 : .3 * k * Math.max(0, -Math.cos(p - .4)));
      const ab = .035 + (side ? .12 * (.5 + .5 * Math.sin(p * 1 + (i ? 0 : Math.PI))) * Math.abs(side) : 0);
      L.legs.push({ h:hip, k:-knee, a:foot, ab, tw:0 });
      const arm = -(walk ? .18 + sp * .1 : .35 + .55 * k) * sn;
      L.arms.push({ s:arm + (walk ? 0 : .05), e:walk ? .25 + sp * .05 : 1.05 + .45 * k, ab:.1 + .06 * k, tw:0 });
    }
    const bounce = walk ? .012 * Math.cos(ph * 2) : .028 * k * Math.abs(Math.cos(ph)) - .015;
    L.pel = { y:(walk ? -.008 : -.035 - .025 * k) + bounce, yaw:(walk ? .07 : .12 + .06 * k) * Math.sin(ph), roll:.03 * Math.sin(ph), pitch:0 };
    L.sp = { pitch:-(walk ? .04 : .15 + .22 * k) + back * .14, yaw:-(walk ? .1 : .16 + .08 * k) * Math.sin(ph), roll:0 };
    L.hd = { pitch:walk ? .02 : .08 + .1 * k, yaw:(walk ? .04 : .08) * Math.sin(ph) };
    return { lean:0, bob:0, fl:[0, 0], bl:[0, 0], fa:[0, 0], ba:[0, 0], L3:L };
  }
  function idle(t, o = {}){
    const br = Math.sin(t * 1.6), sw = Math.sin(t * .55 + (o.seed || 0)), L = { legs:[], arms:[], pel:{}, sp:{}, hd:{} };
    for (let i = 0; i < 2; i++){ const s = i ? -1 : 1; L.legs.push({ h:.03 + .02 * s * sw, k:-.08 - .03 * Math.max(0, s * sw), a:.05, ab:.07, tw:.05 });
      L.arms.push({ s:.04 + .02 * br, e:.22 + .04 * br, ab:.13, tw:0 }); }
    L.pel = { y:-.012 + .004 * br, yaw:.04 * sw, roll:.025 * sw, pitch:0 };
    L.sp = { pitch:-.02 + .015 * br, yaw:-.03 * sw, roll:-.02 * sw };
    L.hd = { pitch:0, yaw:(o.look || 0) + .15 * Math.sin(t * .3 + (o.seed || 0) * 2) };
    return { lean:0, bob:0, fl:[0, 0], bl:[0, 0], fa:[0, 0], ba:[0, 0], L3:L };
  }
  /* kaleci: hazır duruş (dizler kırık, kollar açık, ayak ucunda zıplar) · yan adım · rahat */
  function keeperStance(t, mode, lat){
    const L = { legs:[], arms:[], pel:{}, sp:{}, hd:{} };
    if (mode === 'relax') return idle(t, { seed:3 });
    const deep = mode === 'set' ? 1 : .8, hop = mode === 'set' ? Math.max(0, Math.sin(t * 8.5)) * .018 : 0, ph = t * 9;
    for (let i = 0; i < 2; i++){ const s = i ? -1 : 1;
      let ab = .3 * deep;
      if (mode === 'shuffle'){ ab = .2 + .2 * (.5 + .5 * Math.sin(ph)) ; }
      L.legs.push({ h:.55 * deep, k:-.95 * deep, a:.42 * deep, ab, tw:.12 * s });
      L.arms.push({ s:.55 + .05 * Math.sin(t * 3 + i), e:.85, ab:.75 + (mode === 'set' ? .08 * Math.sin(t * 4 + i * 2) : 0), tw:0 }); }
    L.pel = { y:-.16 * deep + hop + (mode === 'shuffle' ? .02 * Math.abs(Math.sin(ph)) : 0), yaw:0, roll:mode === 'shuffle' ? .04 * Math.sign(lat || 1) : 0, pitch:0 };
    if (mode === 'pen') for (let i = 0; i < 2; i++){ L.arms[i] = { s:.25, e:.35 + .2 * Math.sin(t * 3.2 + i * 2), ab:1.25 + .3 * Math.sin(t * 2.6 + i * 1.7), tw:0 }; }
    L.sp = { pitch:-.5 * deep, yaw:0, roll:0 }; L.hd = { pitch:.42 * deep, yaw:0 };
    return { lean:0, bob:0, fl:[0, 0], bl:[0, 0], fa:[0, 0], ba:[0, 0], L3:L };
  }
  return { build, gait, idle, keeperStance };
})();
function buildRealRig(look){ return BODY.build(look); }
/* futbol pozları için kısayollar: oyuncunun yürüme fazını kendisi tutar */
function fbMove(p, dt, o){ p.gph = (p.gph || Math.random() * 6) + dt * Math.PI * 2 * (.85 + .085 * Math.min(9, p.sp || 0)); return (p.sp || 0) > .5 ? BODY.gait(p.gph, p.sp, o) : BODY.idle(p.animT || 0, { seed:(p.i || 0) * 1.3 }); }
