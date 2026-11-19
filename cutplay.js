'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   cutplay.js — sahne yönetmeni
   Ara sahnelerde her cümle ne diyorsa karakterler onu yapar: top sürer, düdük çalar, telefona bakar, tünelden çıkar,
   itişir, koşar, frene basar… Hikâye metni (story.js) değişmez; bu dosya cümlelere "oyun" ekler (en altta CP_PLAN).
   - Satırda play varsa önceki oyun biter, yenisi başlar; play yoksa önceki oyun sürer (konuşmalar sırasında hareket devam eder).
   - Karakterler derinlikte (z, metre) yürüyebilir; kamera 3B uçuş yapabilir (stat üstünden süzülme, arkadan takip).
   - 3B yoksa (eski telefonlar) aynı oyunlar 2D çizimle çalışır.
   ========================================================= */

/* ---------- yardımcılar ---------- */
const cpE = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
function cpRng(seed){ let s = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0 || 7; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function cpA(C, id){ return C.actors.find(a => a.id === id); }
function cpSpawn(C, id, look, x, o){
  let a = cpA(C, id);
  if (!a){ a = { id, look, x, face:1, animT:(id.length * 1.37) % 3, vx:0, onGround:true, e0:'neutral', e:'neutral', z:0, cpTmp:true }; C.actors.push(a); }
  a.hidden = false; return Object.assign(a, o || {});
}
function cpGo(a, x, z, sp, then){ if (!a) return; a.goal = { x, z:z == null ? (a.z || 0) : z, sp:sp || 150, then:then || null }; a.tx = null; }
/* ---------- pozlar (açılar: 0 = aşağı, + = öne; [üst, alt]) ---------- */
function cpIdle(a, t){ const b = Math.sin(t * 1.5 + a.x * .01);
  const P = { lean:1, bob:b * .7, fl:[.06, .02], bl:[-.07, -.1], fa:[.13 + b * .02, .1], ba:[-.11 - b * .02, -.05], lie:false, rot:0 };
  if (a.talking){ const g = Math.sin(t * 5.3), h = Math.sin(t * 3.1 + 1); P.fa = [.55 + g * .25, 1.35 + h * .3]; P.ba = [.15 + h * .12, .5 + g * .2]; P.lean = 3; }
  return P; }
const CPOSE = {
  stand:(a, t, P) => { const p = cpIdle(a, t); return p; },
  whistle:(a, t, P) => { P.fa = [2.05, 2.85]; P.ba = [-.1, -.06]; P.lean = -2; P.bob = 0; return P; },
  point:(a, t, P) => { P.fa = [1.55, 1.62]; P.ba = [-.08, -.05]; P.lean = 2; return P; },
  pointUp:(a, t, P) => { P.fa = [2.4, 2.5]; P.ba = [-.08, -.05]; return P; },
  clap:(a, t, P) => { const c = Math.sin(t * 11); P.fa = [1.2 + c * .16, 1.62]; P.ba = [1.2 - c * .16, 1.62]; P.lean = 1; return P; },
  cheer:(a, t, P) => { const s = Math.sin(t * 8) * .2; P.fa = [2.7 + s, 3.0]; P.ba = [2.6 - s, 2.9]; P.lean = -2; P.bob = -Math.abs(Math.sin(t * 8)) * 7; return P; },
  jump:(a, t, P) => { const s = Math.sin(t * 7); P.fa = [2.8 + s * .2, 3.05]; P.ba = [2.75 - s * .2, 3.0]; a.lift = Math.max(0, s) * .32; P.fl = [.3 * Math.max(0, s), .5 * Math.max(0, s)]; return P; },
  fistPump:(a, t, P) => { const s = Math.max(0, Math.sin(t * 6)); P.fa = [1.6 + s * 1.2, 2.6 + s * .4]; P.ba = [.2, .6]; P.lean = -3; return P; },
  wave:(a, t, P) => { const s = Math.sin(t * 9); P.fa = [2.55 + s * .25, 3.0 + s * .4]; P.ba = [-.1, -.05]; return P; },
  phone:(a, t, P) => { P.fa = [.3, 2.95]; if (!(Math.abs(a.vx || 0) > 10)) P.ba = [-.1, -.1]; P.lean = 3; return P; },
  pocket:(a, t, P) => { P.fa = [-.15, -.55]; P.lean = 1; return P; },
  show:(a, t, P) => { P.fa = [1.05, 2.15]; P.ba = [-.1, -.1]; P.lean = 3; return P; },
  read:(a, t, P) => { P.fa = [.95, 2.3]; P.ba = [.8, 2.25]; P.lean = 6; return P; },
  give:(a, t, P) => { P.fa = [1.45, 1.6]; P.lean = 5; return P; },
  think:(a, t, P) => { P.fa = [1.5, 2.95]; P.ba = [.8, 1.9]; P.lean = 2; return P; },
  arms:(a, t, P) => { P.fa = [.35, 1.85]; P.ba = [.25, 1.8]; P.lean = -1; return P; },
  fist:(a, t, P) => { const w = Math.sin(t * 30) * .03; P.fa = [.3 + w, 1.25]; P.ba = [-.08 - w, 1.0]; P.lean = 4; return P; },
  guard:(a, t, P) => { P.fa = [1.1, 2.6]; P.ba = [.7, 2.4]; P.lean = 4; P.fl = [.35, .1]; P.bl = [-.35, -.3]; P.bob = 3 + Math.sin(t * 4) * 1.5; return P; },
  punch:(a, t, P) => { const k = (t * 3.2) % 1, hit = k < .28, alt = Math.floor(t * 3.2) % 2; P.fl = [.35, .1]; P.bl = [-.35, -.3]; P.lean = hit ? 12 : 4;
    P.fa = hit && !alt ? [1.57, 1.57] : [1.1, 2.6]; P.ba = hit && alt ? [1.57, 1.57] : [.7, 2.4]; return P; },
  kickHi:(a, t, P) => { const k = (t * 1.6) % 1; P.fl = k < .3 ? [1.6, 1.65] : [.35, .1]; P.lean = k < .3 ? -12 : 4; P.fa = [1.1, 2.6]; P.ba = [.7, 2.4]; return P; },
  shove:(a, t, P) => { const k = Math.max(0, Math.sin(t * 4.5)); P.fa = [1.35 + k * .15, 1.45 + k * .1]; P.ba = [1.25 + k * .15, 1.4]; P.lean = 6 + k * 12; P.fl = [.3, .05]; P.bl = [-.4, -.5]; return P; },
  stagger:(a, t, P) => { const s = Math.sin(t * 7); P.lean = -10 + s * 4; P.fa = [-.6 + s * .4, .3]; P.ba = [.8 - s * .4, 1.4]; P.fl = [.4, .1]; return P; },
  block:(a, t, P) => { P.fa = [1.25, 1.45]; P.ba = [1.2, 1.4]; P.fl = [.32, .05]; P.bl = [-.32, -.1]; P.lean = 2; P.bob = 3; return P; },
  skid:(a, t, P) => { P.lean = -16; P.fl = [.95, .55]; P.bl = [-.45, -.75]; P.fa = [.9, 1.7]; P.ba = [-.7, .1]; P.bob = 10; return P; },
  hug:(a, t, P) => { P.fa = [1.35, 2.0]; P.ba = [1.3, 2.05]; P.lean = 6; return P; },
  shake:(a, t, P) => { P.fa = [1.0 + Math.sin(t * 9) * .08, 1.25]; P.lean = 3; return P; },
  bow:(a, t, P) => { P.lean = 22; P.fa = [.25, .2]; P.ba = [.2, .15]; return P; },
  nod:(a, t, P) => { const p = cpIdle(a, t); p.lean = 3 + Math.max(0, Math.sin(t * 5)) * 7; return p; },
  sad:(a, t, P) => { P.lean = 8; P.fa = [.08, .05]; P.ba = [-.04, -.02]; P.bob = 2; return P; },
  shock:(a, t, P) => { P.fa = [-.5, 2.6]; P.ba = [-.8, 2.4]; P.lean = -6; return P; },
  type:(a, t, P) => { P.fa = [1.25, 2.55 + Math.sin(t * 18) * .18]; P.ba = [.9, 2.3 + Math.cos(t * 16) * .15]; P.lean = 5; return P; },
  mic:(a, t, P) => { P.fa = [1.85, 2.8]; P.ba = a.talking ? [.6 + Math.sin(t * 4) * .3, 1.6] : [-.1, -.05]; P.lean = 1; return P; },
  crouch:(a, t, P) => { P.bob = 16; P.lean = 16; P.fl[0] += .45; P.bl[0] += .15; P.fa = [1.0, 2.1]; P.ba = [.6, 1.8]; return P; },
  lookUp:(a, t, P) => { P.lean = -6; return P; },
  juggle:(a, t, P) => { const s = Math.sin(t * 7.5), u = Math.max(0, s), v = Math.max(0, -s); P.fl = [.1 + u * .95, .05 + u * .55]; P.bl = [-.05 + v * .95, -.05 + v * .55];
    P.fa = [.65, .95]; P.ba = [.55, .85]; P.lean = 4; P.bob = 1; return P; },
  kick:(a, t, P) => { const k = a.cpPT || 0; if (k < .32){ const q = k / .32; P.fl = [-.2 - q * .6, -.4 - q * .9]; P.lean = 6; P.fa = [.5, .9]; P.ba = [-.5 - q * .4, .1]; }
    else if (k < .55){ P.fl = [1.35, 1.45]; P.lean = -10; P.fa = [.9, 1.2]; P.ba = [-.6, .2]; } else { const q = Math.min(1, (k - .55) / .45); P.fl = [1.35 - q * 1.2, 1.45 - q * 1.35]; P.lean = -10 + q * 10; } return P; },
  dribble:(a, t, P) => { P.lean = (P.lean || 6) + 5; return P; },
  run:(a, t, P) => P,
  fear:(a, t, P) => { P.fa = [2.2 + Math.sin(t * 12) * .2, 2.9]; P.ba = [2.1 - Math.sin(t * 12) * .2, 2.8]; return P; },
  carryFile:(a, t, P) => { P.fa = [.95, 2.2]; P.lean = 3; return P; },
  talk:(a, t, P) => { const s = a.talking; a.talking = true; const p = cpIdle(a, t); a.talking = s; return p; },
  stretch:(a, t, P) => { const s = Math.sin(t * 2.2); P.fa = [2.7 + s * .25, 3.05]; P.ba = [2.7 - s * .25, 3.05]; P.lean = s * 6; return P; },
};
/* ---------- top ---------- */
function cpBall(C, x, z, h){ C.ball = { x, z:z || 0, h:h || 0, vx:0, vz:0, vh:0, owner:null, spin:0, vis:true }; C.noDefBall = true; return C.ball; }
function cpKick(B, tx, tz, sp, loft){ const dx = (tx - B.x) / 100, dz = (tz - B.z), d = Math.hypot(dx, dz) || .01, T = d / sp;
  B.owner = null; B.vx = dx / T * 100; B.vz = dz / T; B.vh = loft ? 9.8 * T / 2 : 0; SFX.kick && SFX.kick(); }
function cpBallTick(C, dt){
  const B = C.ball; if (!B) return;
  if (B.owner){ const a = B.owner, f = a.yaw3 != null ? [Math.cos(a.yaw3), -Math.sin(a.yaw3)] : [a.face >= 0 ? 1 : -1, 0], mv = Math.abs(a.vx || 0) > 10;
    const touch = mv ? (.5 + .5 * Math.sin(a.animT * 7.5)) * 16 : 0;
    if (B.jug){ B.h = Math.abs(Math.sin(a.animT * 7.5)) * .55 + .06; B.x = a.x + f[0] * 18; B.z = (a.z || 0) + f[1] * .18; }
    else { B.h = 0; B.x = a.x + f[0] * (22 + touch); B.z = (a.z || 0) + f[1] * (.22 + touch / 100) + .02; }
    B.spin += dt * (mv ? 9 : B.jug ? 6 : 0); return; }
  B.vh -= 9.8 * dt; B.h += B.vh * dt; if (B.h < 0){ B.h = 0; B.vh = Math.abs(B.vh) > 1.2 ? -B.vh * .5 : 0; }
  const fr = B.h > .02 ? Math.pow(.92, dt) : Math.pow(.35, dt); B.vx *= fr; B.vz *= fr; B.x += B.vx * dt; B.z += B.vz * dt; B.spin += dt * Math.hypot(B.vx / 100, B.vz) * 3;
  if (B.net && B.x > B.net.x){ B.x = B.net.x; B.vx *= -.15; B.vz *= .3; }
}
function cpBallDraw(c, C, has3){
  const B = C.ball; if (!B || !B.vis) return;
  if (has3 && C.S3){ const S = C.S3, r = R3.objW('cpBall', 'ball', S.ox + B.x / 100 * S.sc, S.gy + (B.h + .11) * S.sc, B.z * S.sc, B.spin); r.scale.setScalar(S.sc); }
  else drawBall(c, B.x, GROUND - 10 - B.h * 100, B.spin, .8);
}
/* ---------- 3B yardımcı eşyalar (arena yerel koordinatı: x metre, y metre, z metre) ---------- */
function cpPut(C, id, build, x, y, z, ry){ const S = C.S3; if (!S) return null; const o = R3.custom(id, () => { const g = build(R3.world().T); g.userData.keep = 1; return g; });
  o.position.set(S.ox + x * S.sc, S.gy + y * S.sc, z * S.sc); o.scale.setScalar(S.sc); o.rotation.set(0, ry || 0, 0); return o; }
const CP_SMOKE = (c, w, h) => { const gg = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gg.addColorStop(0, 'rgba(255,255,255,.85)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(0, 0, w, h); };
const CPB = {
  cone:T => { const g = new T.Group(), m = new T.MeshStandardMaterial({ color:'#ff7a1a', roughness:.5 }), w = new T.MeshStandardMaterial({ color:'#ffffff', roughness:.5 });
    const c = new T.Mesh(new T.ConeGeometry(.12, .32, 14), m); c.position.y = .17; g.add(c); const r = new T.Mesh(new T.CylinderGeometry(.075, .09, .05, 14), w); r.position.y = .2; g.add(r);
    const b = new T.Mesh(new T.BoxGeometry(.3, .03, .3), m); b.position.y = .015; g.add(b); c.castShadow = true; return g; },
  goal:T => { const g = new T.Group(), w = new T.MeshStandardMaterial({ color:'#ffffff', roughness:.35 }), n = new T.MeshBasicMaterial({ color:'#ffffff', transparent:true, opacity:.28, side:T.DoubleSide, wireframe:true });
    const post = (x, y, z, h, rx, rz) => { const p = new T.Mesh(new T.CylinderGeometry(.04, .04, h, 8), w); p.position.set(x, y, z); p.rotation.set(rx || 0, 0, rz || 0); p.castShadow = true; g.add(p); };
    post(0, .8, -1.5, 1.6); post(0, .8, 1.5, 1.6); post(0, 1.6, 0, 3.0, Math.PI / 2); const back = new T.Mesh(new T.PlaneGeometry(3, 1.6, 12, 6), n); back.position.set(.9, .8, 0); back.rotation.y = Math.PI / 2; g.add(back);
    const top = new T.Mesh(new T.PlaneGeometry(.9, 3, 4, 12), n); top.rotation.set(-Math.PI / 2, 0, 0); top.position.set(.45, 1.6, 0); g.add(top);
    for (const z of [-1.5, 1.5]){ const s = new T.Mesh(new T.PlaneGeometry(.9, 1.6, 4, 6), n); s.position.set(.45, .8, z); g.add(s); } return g; },
  flare:T => { const g = new T.Group(), f = new T.Mesh(new T.SphereGeometry(.22, 10, 8), new T.MeshBasicMaterial({ color:'#ff3a1a', toneMapped:false })); g.add(f);
    const h = new T.Mesh(new T.SphereGeometry(.7, 12, 10), new T.MeshBasicMaterial({ color:'#ff5a2a', transparent:true, opacity:.35, blending:T.AdditiveBlending, depthWrite:false, toneMapped:false })); g.add(h);
    const pl = new T.PointLight('#ff4a1a', 6, 9, 1.6); pl.position.y = .4; g.add(pl); g.userData.halo = h; g.userData.pl = pl; return g; },
  smoke:T => { const tex = aTex('cpSmoke', 64, 64, CP_SMOKE);
    const g = new T.Group(); g.userData.parts = [];
    for (let i = 0; i < 9; i++){ const s = new T.Sprite(new T.SpriteMaterial({ map:tex, color:'#d8c8c8', transparent:true, opacity:.4, depthWrite:false })); g.add(s); g.userData.parts.push({ s, k:i / 9 }); } return g; },
  flag:T => { const g = new T.Group(), pole = new T.Mesh(new T.CylinderGeometry(.03, .03, 2.4, 6), new T.MeshStandardMaterial({ color:'#cccccc', metalness:.6 })); pole.position.y = 1.2; g.add(pole);
    const geo = new T.PlaneGeometry(1.5, .95, 10, 4), m = new T.MeshStandardMaterial({ map:aTex('cpFlag', 128, 80, (c, w, h) => { c.fillStyle = '#14306b'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2c230'; c.fillRect(0, h * .36, w, h * .28); c.fillStyle = '#ffffff'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.fillText('ANL', w / 2, h * .62); }), side:T.DoubleSide, roughness:.8 });
    const fl = new T.Mesh(geo, m); fl.position.set(.78, 1.9, 0); g.add(fl); g.userData.flag = fl; g.userData.base = Float32Array.from(geo.attributes.position.array); return g; },
  arch:T => { const g = new T.Group(), m = new T.MeshStandardMaterial({ color:'#2a2f38', metalness:.4, roughness:.6 });
    const box = (w, h, d, x, y, z) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); };
    box(.5, 3.4, 1.2, -1.85, 1.7, 0); box(.5, 3.4, 1.2, 1.85, 1.7, 0); box(4.2, .6, 1.2, 0, 3.6, 0);
    const d = new T.Mesh(new T.PlaneGeometry(3.2, 3.3), new T.MeshBasicMaterial({ color:'#06070a' })); d.position.set(0, 1.65, -.3); g.add(d);
    const s = new T.Mesh(new T.PlaneGeometry(2.4, .4), new T.MeshBasicMaterial({ map:signTex('SOYUNMA ODASI', '#1f2a44', '#ffffff'), toneMapped:false })); s.position.set(0, 3.62, .61); g.add(s); return g; },
  dust:T => { const tex = aTex('cpSmoke', 64, 64, CP_SMOKE); const g = new T.Group(); g.userData.parts = [];
    for (let i = 0; i < 6; i++){ const s = new T.Sprite(new T.SpriteMaterial({ map:tex, color:'#c8d8a0', transparent:true, opacity:.5, depthWrite:false })); g.add(s); g.userData.parts.push({ s, k:i / 6 }); } return g; },
};
function cpSmokeTick(o, t, rise, spread, col){ if (!o) return; for (const q of o.userData.parts){ const k = (q.k + t * .18) % 1; q.s.position.set(Math.sin(q.k * 20 + t) * spread * k, k * rise, Math.cos(q.k * 13) * spread * .5 * k);
  const s = .6 + k * 2.6; q.s.scale.set(s, s, 1); q.s.material.opacity = .5 * (1 - k); if (col) q.s.material.color.set(col); } }
function cpFlagTick(o, t){ const fl = o && o.userData.flag; if (!fl) return; const p = fl.geometry.attributes.position, b = o.userData.base;
  for (let i = 0; i < p.count; i++){ const x = b[i * 3] + .75; p.array[i * 3 + 2] = Math.sin(x * 3.2 - t * 7) * .12 * x; } p.needsUpdate = true; }
/* ---------- motor: satır başlar / biter, her kare ---------- */
function cpInit(C, def){ C.plays = []; C.cpOv = null; for (const a of C.actors) if (a.z == null) a.z = 0; if (def.cp) cpStart(C, def.cp); }
function cpLine(C, ln){
  if (ln.set) for (const id in ln.set){ const a = cpA(C, id); if (a && ln.set[id] && ln.set[id].pose !== undefined) a.cpPose = null; }
  if (ln.play === undefined) return;
  cpStop(C, ln.play === null);
  if (ln.play) cpStart(C, ln.play);
}
function cpStart(C, spec){ for (const s of [].concat(spec)){ const V = CP[s.do]; if (!V){ console.warn('cp?', s.do); continue; }
  const p = Object.assign({ t:0, rnd:cpRng(C.i + 1 + (s.seed || 0)) }, s); p.V = V; C.plays.push(p); try { V.start && V.start(C, p); } catch(e){ console.warn('cp start', s.do, e); } } }
function cpStop(C, all){ const keep = []; for (const p of C.plays){ if (p.keep && !all){ keep.push(p); continue; } try { p.V.end && p.V.end(C, p); } catch(e){} }
  C.plays = keep; C.cam3 = null; C.cpOv = null; if (!keep.length) for (const a of C.actors){ a.cpPose = null; a.lift = 0; } }
function cpTick(C, dt){
  C.dt = dt;
  for (const p of C.plays){ p.t += dt; try { p.V.tick && p.V.tick(C, p, dt); } catch(e){ console.warn('cp tick', p.do, e); p.V = {}; } }
  for (const a of C.actors){
    if (a.goal){ const g = a.goal, dx = g.x - a.x, dz = (g.z - (a.z || 0)) * 100, d = Math.hypot(dx, dz);
      if (d < 3){ a.x = g.x; a.z = g.z; a.vx = 0; a.run = false; a.goal = null; if (g.then) Object.assign(a, g.then); }
      else { const v = Math.min(d, g.sp * dt); a.x += dx / d * v; a.z = (a.z || 0) + dz / d * v / 100; a.vx = g.sp; a.run = g.sp > 220; if (Math.abs(dx) > 1) a.face = dx > 0 ? 1 : -1;
        a.yaw3 = Math.abs(dz) > Math.abs(dx) * .3 ? Math.atan2(-dz, dx) : (g.keepYaw ? a.yaw3 : null); } }
    if (a.cpPT != null) a.cpPT += dt;
    a.__P = null;
    if (a.hidden || a.act || a.fallV || a.pose === 'lie' || a.pose === 'kneel') continue;
    const fn = a.cpPose && CPOSE[a.cpPose];
    if (fn){ const sv = a.pose; a.pose = null; const base = getPose(a); a.pose = sv; a.__P = fn(a, a.animT, base); }
    else if (!a.pose && !(Math.abs(a.vx || 0) > 10)) a.__P = cpIdle(a, a.animT);
  }
  cpBallTick(C, dt);
  if (C.cpOv) C.cpOv.t = (C.cpOv.t || 0) + dt;
  if (C.st.wave && C.S3 && C.S3.U.stad){ const SU = C.S3.U.stad.userData; if (!(SU.waveT > 0)){ SU.waveT = 14; SU.waveA = Math.PI; } }
}
/* derinlikte (z) ya da serbest yönde duran karakter: arenanın gerçek koordinatında çizilir */
function cpChar3(C, a, ex){
  const use = C.cam3 || a.w3 || a.yaw3 != null || Math.abs(a.z || 0) > .01; if (!use) return false;
  const S = C.S3, look = LOOK[a.look]; if (!look) return false;
  const ty = a.yaw3 != null ? a.yaw3 : (a.face >= 0 ? -.45 : Math.PI + .45);
  if (a.yawS == null) a.yawS = ty; let d = ty - a.yawS; d = Math.atan2(Math.sin(d), Math.cos(d)); a.yawS += d * Math.min(1, (C.dt || 1 / 60) * 9);
  const ly = (GROUND - (a.y || GROUND)) / 100 + (a.lift || 0);
  R3.charW(R3.autoId(look), look, getPose(a), S.ox + a.x / 100 * S.sc, S.gy + ly * S.sc, (a.z || 0) * S.sc, a.yawS, (a.s || 1) * S.sc, ex, !!a.talking, a.trophy ? 'trophy' : a.hold || null, { face:a.face >= 0 ? 1 : -1 });
  return true;
}
function cpDraw(c, C, has3){
  for (const p of C.plays){ if (p.V.draw) try { p.V.draw(c, C, p, has3); } catch(e){ console.warn('cp draw', p.do, e); p.V = {}; } }
  cpBallDraw(c, C, has3);
}
function cpOverlay(c, C){
  for (const p of C.plays){ if (p.V.over) try { p.V.over(c, C, p); } catch(e){} }
  const O = C.cpOv; if (O){
    const a = O.t < .5 ? O.t / .5 : O.t > O.dur - .6 ? Math.max(0, (O.dur - O.t) / .6) : 1, ta = Math.min(1, Math.max(0, (O.t - .35) * 2.5)) * a;
    if (O.dark){ c.fillStyle = 'rgba(0,0,0,' + (a * .96) + ')'; c.fillRect(0, 0, W, H); }
    c.globalAlpha = ta; txt(c, O.text, 480, 250, O.size || 62, '#f2c230', 'center', 'italic 900', 6, 900); if (O.sub) txt(c, O.sub, 480, 300, 24, '#ffffff', 'center', 'normal', 0, 880); c.globalAlpha = 1;
    if (O.t > O.dur) C.cpOv = null; }
}
/* 3B kamera uçuşu (arena yerel koordinatında anahtar kareler) */
function cpCam3(C){
  const K = C.cam3, S = C.S3; if (!K || !S) return; const cam = R3.world().cam, t = K.t || 0, P = K.keys; let i = 0; while (i < P.length - 2 && t > P[i + 1][0]) i++;
  const A = P[i], B = P[Math.min(P.length - 1, i + 1)], k = B[0] > A[0] ? cpE((t - A[0]) / (B[0] - A[0])) : 1, L = (u, v) => u + (v - u) * k;
  const w = v => [S.ox + v[0] * S.sc, S.gy + v[1] * S.sc, v[2] * S.sc];
  const p = w([L(A[1][0], B[1][0]), L(A[1][1], B[1][1]), L(A[1][2], B[1][2])]), q = w([L(A[2][0], B[2][0]), L(A[2][1], B[2][1]), L(A[2][2], B[2][2])]);
  cam.position.set(p[0], p[1], p[2]); cam.lookAt(q[0], q[1], q[2]); cam.fov = L(A[3] || 40, B[3] || 40); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  if (R3.shadowBox) R3.shadowBox(30, 30, 140);
}
function cpCamTick(C, dt){ if (C.cam3) C.cam3.t = (C.cam3.t || 0) + dt; }
/* ---------- oyunlar ---------- */
const CP = {};
/* zaman çizelgesi: [saniye, kim, {...}] — kim: aktör id | 'st' (sahne)
   aktör: go:[x,z,hız] run:[x,z] pose:'ad' face show hide hold e yaw spawn:{look,x,z} own:true kick:[x,z,hız,havadan] jug:true lift
   sahne: sfx fx min zoom cam overlay:{text,dur,dark} wave cheer */
CP.tl = { start(C, p){ p.i = 0; p.steps = (p.steps || []).slice().sort((a, b) => a[0] - b[0]); CP.tl.tick(C, p, 0); },
  tick(C, p){ while (p.i < p.steps.length && p.t >= p.steps[p.i][0]){ const [, who, o] = p.steps[p.i++]; cpDo(C, who, o, p); } } };
function cpDo(C, who, o, p){
  if (who === 'st'){ if (o.sfx && SFX[o.sfx]) SFX[o.sfx](); if (o.fx) C.cpFx && C.cpFx([].concat(o.fx)); if (o.min) C.st.minute = o.min; if (o.zoom != null) C.zoom.tz = o.zoom; if (o.cam != null) C.cam.tx = o.cam;
    if (o.overlay) C.cpOv = Object.assign({ t:0, dur:2.2 }, o.overlay); if (o.wave) C.st.wave = true; if (o.cheer != null) C.st.cheer = o.cheer; if (o.vib) vib(o.vib); if (o.shake) shake = Math.max(shake, o.shake);
    if (o.ball) cpBall(C, o.ball[0], o.ball[1], o.ball[2]); if (o.door != null){ C.st.door = o.door; SFX[o.door ? 'door' : 'doorClose'] && SFX[o.door ? 'door' : 'doorClose'](); } if (o.st) Object.assign(C.st, o.st); return; }
  let a = cpA(C, who);
  if (o.spawn){ a = cpSpawn(C, who, o.spawn.look, o.spawn.x, { z:o.spawn.z || 0, face:o.spawn.face || 1, s:o.spawn.s || 1 }); }
  if (!a) return;
  if (o.at){ a.x = o.at[0]; if (o.at[1] != null) a.z = o.at[1]; a.tx = null; a.vx = 0; a.goal = null; a.hidden = false; }
  if (o.show) a.hidden = false; if (o.hide) a.hidden = true;
  if (o.face) a.face = o.face; if (o.yaw !== undefined) a.yaw3 = o.yaw; if (o.e){ a.e = o.e; a.e0 = o.e; } if (o.hold !== undefined) a.hold = o.hold;
  if (o.pose !== undefined){ a.cpPose = o.pose; a.cpPT = 0; if (o.pose === null) a.pose = null; }
  if (o.rawPose !== undefined) a.pose = o.rawPose;
  if (o.fall){ a.cpPose = null; a.pose = 'lie'; a.fallV = o.fall * 300; SFX.punchHeavy(); shake = Math.max(shake, 5); }
  if (o.up){ a.pose = null; a.fallV = 0; }
  if (o.go) cpGo(a, o.go[0], o.go[1], o.go[2] || 150);
  if (o.run) cpGo(a, o.run[0], o.run[1], o.run[2] || 300);
  if (o.stop){ a.goal = null; a.vx = 0; }
  if (o.own && C.ball){ C.ball.owner = a; C.ball.jug = false; }
  if (o.jug && C.ball){ C.ball.owner = a; C.ball.jug = true; }
  if (o.kick && C.ball){ cpKick(C.ball, o.kick[0], o.kick[1], o.kick[2] || 14, o.kick[3]); a.cpPose = 'kick'; a.cpPT = .3; }
  if (o.sfx && SFX[o.sfx]) SFX[o.sfx]();
}
/* sahneye eşya koy: items:[[tür, x(px), z(m), y(m), dönüş]] */
CP.props = { draw(c, C, p, has3){ if (!has3) return; (p.items || []).forEach((it, i) => { const o = cpPut(C, 'cpP' + p.do + i + it[0], CPB[it[0]], it[1] / 100, it[3] || 0, it[2] || 0, it[4] || 0);
  if (!o) return; if (it[0] === 'flare'){ const k = .8 + Math.random() * .4; o.userData.halo.scale.setScalar(k); o.userData.pl.intensity = 4 + Math.random() * 4; } if (it[0] === 'flag') cpFlagTick(o, C.t + i); if (it[0] === 'smoke') cpSmokeTick(o, C.t + i * .3, 4, 1.4, it[5]); }); } };
/* yazı (ERTESİ GÜN vb.) */
CP.title = { start(C, p){ C.cpOv = { t:0, dur:p.dur || 2.4, text:p.text, sub:p.sub, dark:p.dark !== false, size:p.size }; } };
/* 3B kamera uçuşu */
CP.fly = { start(C, p){ C.cam3 = { t:-(p.delay || 0), keys:p.keys }; }, tick(C, p, dt){ if (C.cam3) C.cam3.t += dt; if (p.loop && C.cam3 && C.cam3.t > p.keys[p.keys.length - 1][0] + (p.hold || 1.5)) C.cam3.t = 0; },
  end(C){ C.cam3 = null; } };
/* stat atmosferi: meşale + duman + bayrak + dalga (tribünler arena yerelinde z≈-41..-60) */
CP.crowd = { start(C, p){ C.st.cheer = true; C.st.crowdOn = true; if (p.wave) C.st.wave = true; },
  draw(c, C, p, has3){ if (!has3) return; const n = p.flares || 0, fl = p.flags || 0;
    for (let i = 0; i < n; i++){ const x = -22 + (i * 47 % 60), d = 4 + (i * 7 % 12), z = -41 - d, y = 1.4 + d / .86 * .44;
      const o = cpPut(C, 'cpFl' + i, CPB.flare, x, y, z); if (o){ o.userData.halo.scale.setScalar(.8 + Math.random() * .5); o.userData.pl.intensity = 5 + Math.random() * 5; }
      cpSmokeTick(cpPut(C, 'cpSm' + i, CPB.smoke, x, y + .4, z), C.t + i, 9, 3, p.smokeCol || '#e8c8c8'); }
    for (let i = 0; i < fl; i++){ const x = -26 + (i * 29 % 62), d = 2 + (i * 5 % 14), z = -41 - d, y = 1.25 + d / .86 * .44; cpFlagTick(cpPut(C, 'cpFg' + i, CPB.flag, x, y, z, .3), C.t * 1.2 + i); } },
  end(C, p){ if (p.stopCheer) C.st.cheer = false; } };
/* arka planda koşan oyuncular (ısınma / antrenman) */
CP.jog = { start(C, p){ p.list = []; for (let i = 0; i < (p.n || 4); i++){ const id = (p.pre || 'jg') + i, z = (p.z || -5) - (i % 2) * 1.6, x = 120 + i * 190;
    const a = cpSpawn(C, id, p.looks ? p.looks[i % p.looks.length] : (i % 2 ? 'mate2' : 'mate'), x, { z, s:1 }); a.jx = [p.x0 || 60, p.x1 || 900]; a.jdir = i % 2 ? -1 : 1; p.list.push(a); } },
  tick(C, p){ for (const a of p.list){ if (a.goal) continue; a.jdir = -a.jdir; cpGo(a, a.jdir > 0 ? a.jx[1] : a.jx[0], a.z, p.sp || 250); } },
  end(C, p){ if (p.leave) for (const a of p.list) a.hidden = true; } };

/* ===== BÖLÜM 1 ===== */
/* antrenman: dubalar arasında top sürme → top sektirme → kaleye şut; hoca düdük çalıp işaret eder; arkada takım koşar */
CP.train = {
  start(C, p){ const I = cpA(C, 'issem'), H = cpA(C, 'coach'); p.cones = [270, 360, 450, 540, 630]; p.gx = 790; p.cz = [-1.2, -2.3];
    if (H){ H.x = 120; H.z = -.4; H.face = 1; H.pose = null; H.hold = 'whistle'; }
    if (I){ I.pose = null; I.x = 200; I.z = -1.75; I.face = 1; } cpBall(C, 220, -1.75, 0); C.ball.owner = I; p.ph = 0; p.pt = 0; p.loopT = 0;
    CP.jog.start(C, p.jog = { n:4, z:-6.5, x0:40, x1:920, sp:240, pre:'tj' }); },
  tick(C, p, dt){ const I = cpA(C, 'issem'), H = cpA(C, 'coach'), B = C.ball; CP.jog.tick(C, p.jog); p.pt += dt; if (!I || !B) return;
    if (H){ const k = (p.t % 7.5); H.cpPose = k < 1.1 ? 'whistle' : k < 2.6 ? 'point' : k > 5.6 && k < 6.8 ? 'clap' : null; if (k < dt * 1.2 && p.t > .2) SFX.whistle(); H.face = I.x > H.x ? 1 : -1; }
    if (p.ph === 0){ // dubalar arasında slalom
      if (!I.goal){ const i = p.ci = (p.ci == null ? 0 : p.ci + 1); if (i < p.cones.length){ cpGo(I, p.cones[i] + 30, p.cz[i % 2 ? 0 : 1], 260); I.goal.keepYaw = true; } else { cpGo(I, 660, -1.75, 230); p.ph = 1; } }
      B.owner = I; B.jug = false; }
    else if (p.ph === 1 && !I.goal){ p.ph = 2; p.pt = 0; I.face = 1; I.yaw3 = null; B.jug = true; I.cpPose = 'juggle'; }
    else if (p.ph === 2 && p.pt > 2.6){ p.ph = 3; p.pt = 0; B.jug = false; B.owner = I; B.h = 0; I.cpPose = 'kick'; I.cpPT = 0; }
    else if (p.ph === 3){ if (B.owner && p.pt > .32){ cpKick(B, p.gx + 50, -1.75, 17, true); B.vh = 3.2; B.net = { x:p.gx + 70 }; SFX.shot && SFX.shot(); }
      if (p.pt > 1.0 && I.cpPose === 'kick'){ I.cpPose = 'fistPump'; } if (p.pt > 2.2){ p.ph = 4; p.pt = 0; I.cpPose = null; } }
    else if (p.ph === 4){ if (!I.goal && p.pt < .1) cpGo(I, p.gx + 20, -1.75, 240); if (!I.goal && p.pt > .1){ B.net = null; B.x = I.x + 20; B.owner = I; cpGo(I, 200, -1.75, 300); p.ph = 5; } }
    else if (p.ph === 5 && !I.goal){ p.ph = 0; p.ci = null; I.face = 1; } },
  draw(c, C, p, has3){ if (!has3){ for (const x of p.cones){ c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(x - 8, GROUND); c.lineTo(x + 8, GROUND); c.lineTo(x, GROUND - 22); c.fill(); } return; }
    p.cones.forEach((x, i) => cpPut(C, 'cpCone' + i, CPB.cone, x / 100, 0, p.cz[i % 2 ? 1 : 0] + (i % 2 ? .45 : -.45))); cpPut(C, 'cpGoal', CPB.goal, (p.gx + 80) / 100, 0, -1.75); },
  end(C, p){ CP.jog.end(C, p.jog || {}); }
};
/* antrenman biter: herkes tesise yürür, Issem durur, telefonu titrer, çıkarıp bakar */
CP.toLocker = {
  start(C, p){ const I = cpA(C, 'issem'); p.mates = [];
    [['lk0', 'mate', 380], ['lk1', 'mate2', 470], ['lk2', 'mate', 650], ['lk3', 'mate2', 740]].forEach(([id, lk, x], i) => { const a = cpSpawn(C, id, lk, x, { z:-1.5 - i * .5, face:1 }); cpGo(a, 1150 + i * 40, -4.5, 120 + i * 8); p.mates.push(a); });
    if (I){ I.hold = null; I.cpPose = null; cpGo(I, 640, -.6, 115); } C.noDefBall = true; },
  tick(C, p){ const I = cpA(C, 'issem'); if (!I) return;
    if (p.t > 1.6 && !p.buzz){ p.buzz = 1; I.goal = null; I.vx = 0; SFX.msg && SFX.msg(); vib([30, 40, 30]); }
    if (p.buzz && p.t > 1.6 && p.t < 2.4) I.cpPose = 'pocket';
    if (p.t > 2.4 && !p.out){ p.out = 1; I.hold = 'phone'; I.cpPose = 'phone'; I.face = 1; SFX.grab && SFX.grab(); } },
  over(c, C, p){ },
  draw(c, C, p){ const I = cpA(C, 'issem'); if (!I) return; const hx = I.x + 10, hy = (I.y || GROUND) - 205;
    if (p.buzz && !p.out){ c.strokeStyle = '#ffffff'; c.lineWidth = 3; for (let i = 0; i < 3; i++){ const r = 10 + i * 7 + (C.t * 40 % 7); c.globalAlpha = .8 - i * .25; c.beginPath(); c.arc(I.x + I.face * 8, (I.y || GROUND) - 95, r, -.8, .8); c.stroke(); } c.globalAlpha = 1; }
    if (p.out){ const k = Math.min(1, (p.t - 2.4) * 3); c.globalAlpha = k; c.fillStyle = '#ffffff'; rr(c, hx - 60, hy - 34 - 6 * (1 - k), 150, 40, 12); c.fill(); c.beginPath(); c.moveTo(hx - 20, hy + 6); c.lineTo(hx - 4, hy + 6); c.lineTo(hx - 18, hy + 20); c.fill();
      txt(c, '💬 1 yeni mesaj', hx + 15, hy - 8, 17, '#14306b', 'center', 'bold'); c.globalAlpha = 1; } },
  end(C, p){ for (const a of p.mates) a.hidden = true; }
};
/* ertesi gün: kararma + yazı, sonra boş sahanın / dolu tribünlerin üstünden kamera süzülür */
CP.nextDay = {
  start(C, p){ C.cpOv = { t:0, dur:2.3, text:'ERTESİ GÜN', dark:true }; for (const a of C.actors) a.hidden = true; C.noDefBall = true; C.st.cheer = true; C.st.wave = true; SFX.roar && SFX.roar(2);
    C.cam3 = { t:-1.6, keys:[ [0, [-34, 16, 22], [-6, 5, -48], 46], [4.5, [-4, 21, 26], [6, 4, -50], 44], [9, [30, 14, 18], [14, 6, -46], 46], [13, [42, 9, 4], [10, 5, -44], 50] ] }; },
  tick(C, p, dt){ if (C.cam3){ C.cam3.t += dt; if (C.cam3.t > 15) C.cam3.t = 0; } },
  end(C){ C.cam3 = null; }
};
/* tünelden çıkış: oyuncular sırayla sahaya yürür, dizilir, el sallar; tribün coşar */
CP.walkOut = {
  start(C, p){ C.cam3 = null; const ids = ['m1', 'm2', 'm3', 'issem', 'm4', 'm5', 'm6'], xs = [140, 245, 350, 470, 590, 695, 800]; p.ids = ids;
    ids.forEach((id, i) => { const a = cpA(C, id); if (!a) return; a.hidden = true; a.pose = null; a.x = -60 - i * 10; a.z = -6; a.face = 1; a.tgX = xs[i]; a.at = .1 + i * .42; });
    C.st.cheer = true; C.cpFx && C.cpFx(['cheer']); },
  tick(C, p){ for (const id of p.ids){ const a = cpA(C, id); if (!a) continue;
    if (a.hidden && p.t > a.at){ a.hidden = false; cpGo(a, a.tgX - 120, -3.2, 230); a.ph = 1; }
    else if (a.ph === 1 && !a.goal){ cpGo(a, a.tgX, 0, 190); a.ph = 2; }
    else if (a.ph === 2 && !a.goal){ a.ph = 3; a.face = 1; a.yaw3 = -.9; a.cpPose = id === 'issem' ? 'wave' : (id.charCodeAt(1) % 2 ? 'clap' : 'wave'); } }
    if (p.t > 4.5 && !p.conf){ p.conf = 1; C.cpFx && C.cpFx(['confetti']); } },
  draw(c, C, p, has3){ CP.crowd.draw(c, C, { flares:7, flags:6 }, has3); },
  end(C, p){ for (const id of p.ids){ const a = cpA(C, id); if (a){ a.cpPose = null; a.yaw3 = null; a.ph = 0; a.hidden = false; a.x = a.tgX; a.z = 0; a.goal = null; } } }
};
/* başlama vuruşu: hakem düdük çalar, orta yuvarlaktan top oynanır, oyuncular mevkilerine koşar, dakika saymaya başlar */
CP.kickoff = {
  start(C, p){ const R = cpSpawn(C, 'ref', 'hakem', 560, { z:-1.6, face:-1, hold:'whistle' }); R.cpPose = 'whistle';
    const I = cpA(C, 'issem'); if (I){ I.x = 470; I.z = 0; I.face = 1; I.yaw3 = null; I.cpPose = null; } const M = cpA(C, 'm3'); if (M){ M.x = 400; M.z = -.4; M.face = 1; M.cpPose = null; }
    for (const id of ['m1', 'm2', 'm4', 'm5', 'm6']){ const a = cpA(C, id); if (a){ a.cpPose = null; a.yaw3 = null; } }
    p.riv = [[600, -.6], [650, -3.2], [720, -1.4], [800, -5.2], [870, -2.6], [910, -6.4]].map(([x, z], i) => { const r = cpSpawn(C, 'rv' + i, i % 2 ? 'rival2' : 'rival', x, { z, face:-1 }); r.cpPose = null; return r; });
    cpBall(C, 490, 0, 0); p.min = 0; SFX.whistle(); if (!p.noMin) C.st.minute = "0'"; },
  tick(C, p){ const I = cpA(C, 'issem'), M = cpA(C, 'm3'), R = cpA(C, 'ref'), B = C.ball;
    if (p.t > .9 && !p.k1){ p.k1 = 1; if (R){ R.cpPose = 'point'; cpGo(R, 700, -3, 200); R.hold = null; } if (I){ I.cpPose = 'kick'; I.cpPT = 0; } }
    if (p.t > 1.2 && !p.k2 && B){ p.k2 = 1; cpKick(B, 390, -.4, 8); }
    if (p.t > 1.9 && !p.k3){ p.k3 = 1; if (M && B){ B.owner = M; cpGo(M, 260, -2.2, 260); } if (I){ I.cpPose = null; cpGo(I, 640, -1.2, 300); }
      const pos = { m1:[90, -4.5], m2:[230, -6.5], m4:[520, -5.5], m5:[380, -3], m6:[300, -7], rv0:[560, -1.6], rv1:[700, -4], rv2:[620, -.6], rv3:[760, -6], rv4:[840, -2.8], rv5:[900, -5] }; for (const id in pos){ const a = cpA(C, id); if (a) cpGo(a, pos[id][0], pos[id][1], 250 + (id.charCodeAt(1) % 3) * 30); } }
    if (p.t > 3.6 && !p.k4 && M && B && B.owner === M){ p.k4 = 1; M.cpPose = 'kick'; M.cpPT = .3; cpKick(B, 640, -1.2, 13); }
    if (p.k4 && B && !B.owner && I && Math.abs(B.x - I.x) < 30) B.owner = I;
    if (!p.noMin){ const m = Math.min(5, Math.floor(p.t / 1.1)); if (m !== p.min){ p.min = m; C.st.minute = m + "'"; } } },
  draw(c, C, p, has3){ CP.crowd.draw(c, C, { flares:3, flags:5 }, has3); },
  end(C, p){ const R = cpA(C, 'ref'); if (R) R.cpPose = null; }
};
/* maç akıyor: top oyuncular arasında dolaşır, herkes topa göre yer alır */
CP.matchSim = {
  start(C, p){ if (!C.ball) cpBall(C, 480, -2, 0); p.ids = ['m1', 'm2', 'm3', 'issem', 'm4', 'm5', 'm6', 'rv0', 'rv1', 'rv2', 'rv3', 'rv4', 'rv5', 'ref']; p.nt = 0; p.home = {}; for (const id of p.ids){ const a = cpA(C, id); if (a) p.home[id] = [a.x, a.z || 0]; } },
  tick(C, p, dt){ const B = C.ball; if (!B) return; const act = p.ids.map(id => cpA(C, id)).filter(a => a && !a.hidden && a.id !== 'ref');
    if (!act.length){ return; }
    p.nt -= dt; if (B.owner && B.owner.hidden) B.owner = null;
    if (B.owner){ const o = B.owner; if (!o.goal) cpGo(o, Math.max(60, Math.min(900, o.x + (p.rnd() - .4) * 260)), Math.max(-7, Math.min(-.3, (o.z || 0) + (p.rnd() - .5) * 2)), 250);
      if (p.nt <= 0){ const to = act[Math.floor(p.rnd() * act.length)]; if (to !== o){ o.cpPose = 'kick'; o.cpPT = .3; cpKick(B, to.x, to.z || 0, 11); p.nt = 1.4 + p.rnd() * 1.4; } } }
    else { let best = null, bd = 1e9; for (const a of act){ const d = Math.hypot(a.x - B.x, ((a.z || 0) - B.z) * 100); if (d < bd){ bd = d; best = a; } }
      if (best){ if (bd < 26 && B.h < .5){ B.owner = best; best.cpPose = null; p.nt = .8 + p.rnd(); } else cpGo(best, B.x, B.z, 300); } }
    for (const a of act){ if (a === B.owner || a.goal) continue; const h = p.home[a.id] || [a.x, a.z]; if (p.rnd() < dt * .6) cpGo(a, Math.max(40, Math.min(920, (h[0] + B.x) / 2 + (p.rnd() - .5) * 120)), Math.max(-7.5, Math.min(-.2, (h[1] + B.z) / 2 + (p.rnd() - .5))), 200 + p.rnd() * 80); }
    const R = cpA(C, 'ref'); if (R && !R.goal && p.rnd() < dt * .5) cpGo(R, B.x + 120 * (p.rnd() < .5 ? -1 : 1), -2.5 - p.rnd() * 3, 210); },
  draw(c, C, p, has3){ CP.crowd.draw(c, C, { flares:2, flags:4 }, has3); }
};
/* karmaşa: oyuncular itişir, çetenin adamları sahaya koşar, tribünde meşale dumanı, hakem araya girer */
CP.chaos = {
  start(C, p){ for (let i = 0; i < 6; i++){ const r = cpA(C, 'rv' + i); if (r){ r.goal = null; r.vx = 0; r.cpPose = i % 2 ? 'shock' : 'arms'; r.x = 560 + i * 70; r.z = -6 - (i % 3); } }
    const pairs = [['cx0', 'rival', 'cx1', 'steward', 160, -3.0], ['cx2', 'rival2', 'cx3', 'steward', 690, -4.2]]; p.pairs = [];
    for (const [a1, l1, a2, l2, x, z] of pairs){ const A = cpSpawn(C, a1, l1, x, { z, face:1 }), B = cpSpawn(C, a2, l2, x + 60, { z, face:-1 }); A.cpPose = 'shove'; B.cpPose = 'shove'; B.animT = A.animT + 1.5; p.pairs.push([A, B, x]); }
    p.gang = []; for (let i = 0; i < 4; i++){ const g = cpSpawn(C, 'cg' + i, i % 2 ? 'thug' : 'masked', -80 - i * 70, { z:-6 - (i % 2) * 1.5, face:1 }); cpGo(g, 1100, g.z, 330 + i * 15); p.gang.push(g); }
    const R = cpSpawn(C, 'ref', 'hakem', 420, { z:-3.6, face:-1, hold:'whistle' }); R.cpPose = null; cpGo(R, 220, -3.0, 330); p.ri = 0; C.ball && (C.ball.vis = true);
    const I = cpA(C, 'issem'); if (I){ I.cpPose = 'shock'; I.goal = null; I.x = 480; I.z = 0; I.yaw3 = null; } SFX.roar && SFX.roar(1.5); },
  tick(C, p){ for (const [A, B, x] of p.pairs){ const k = Math.sin(A.animT * 4.5); A.x = x + Math.max(0, k) * 10; B.x = x + 60 + Math.max(0, -k) * 10 - Math.max(0, k) * 8; B.cpPose = k > .6 ? 'stagger' : 'shove'; }
    for (const g of p.gang) if (!g.goal) cpGo(g, g.x > 500 ? -120 : 1100, g.z, 340);
    const R = cpA(C, 'ref'); if (R && !R.goal){ p.ri++; const tgt = p.pairs[p.ri % 2]; cpGo(R, tgt[2] + 30, tgt[0].z + .4, 320); R.cpPose = 'block'; R.hold = p.ri % 3 ? null : 'whistle'; if (p.ri % 3 === 0) SFX.whistle(); } },
  draw(c, C, p, has3){ CP.crowd.draw(c, C, { flares:9, flags:2, smokeCol:'#bfb3b3' }, has3); },
  end(C, p){ }
};
/* tünele koşu: kamera arkadan takip eder; tünel ağzında çetenin adamları önüne çıkar, Issem frene basar */
CP.tunnelRun = {
  start(C, p){ const I = cpA(C, 'issem'); for (const a of C.actors) if (a.id !== 'issem' && !a.id.startsWith('tb')) a.hidden = true; if (C.ball) C.ball.vis = false;
    p.tz = 30.2; if (I){ I.cpPose = null; I.x = 520; I.z = 21; I.face = 1; I.yaw3 = -Math.PI / 2; I.w3 = true; cpGo(I, 560, p.tz - 1.6, 640); }
    p.bl = []; for (let i = 0; i < 3; i++){ const b = cpSpawn(C, 'tb' + i, i === 1 ? 'brute' : 'thug', 480 + i * 75, { z:p.tz + 2.4, face:-1, w3:true }); b.hidden = true; b.yaw3 = Math.PI / 2; p.bl.push(b); }
    C.cam3 = { t:0, keys:[] }; SFX.dash && SFX.dash(); },
  tick(C, p, dt){ const I = cpA(C, 'issem'); if (!I) return; const ix = I.x / 100, iz = I.z || 0;
    if (p.t > 1.3 && !p.out){ p.out = 1; p.bl.forEach((b, i) => { b.hidden = false; cpGo(b, b.x, p.tz + .2, 230); b.goal.keepYaw = true; b.cpPose = 'block'; }); }
    if (p.out && !p.br && iz > p.tz - 3.4){ p.br = 1; I.goal = null; I.vx = 0; I.cpPose = 'skid'; p.brT = p.t; SFX.whiff && SFX.whiff(); shake = Math.max(shake, 4); vib(40); }
    if (p.br && I.cpPose === 'skid' && p.t - p.brT < .45) I.z += dt * 3.2 * (1 - (p.t - p.brT) / .45);
    if (p.br && p.t - p.brT > .55 && !p.gd){ p.gd = 1; I.cpPose = 'guard'; for (const b of p.bl) b.cpPose = b.id === 'tb1' ? 'arms' : 'guard'; }
    const k = cpE(Math.min(1, p.t / 1.0)), bk = p.br ? cpE(Math.min(1, (p.t - p.brT) / 1.3)) : 0;
    const side = [ix + 5.5, 1.8, iz + 1.5], back = [ix - .35, 1.85, iz - 4.4], end = [ix + 3.4, 1.9, iz - 2.4];
    const pos = side.map((v, i) => v + (back[i] - v) * k).map((v, i) => v + (end[i] - v) * bk), look = [ix + bk * .2, 1.25, iz + 4.5 - bk * 2.5];
    C.cam3.keys = [[0, pos, look, 50], [1, pos, look, 50]]; C.cam3.t = 0; },
  draw(c, C, p, has3){ if (!has3) return; cpPut(C, 'cpArch', CPB.arch, 5.6, 0, p.tz + 2.9, Math.PI);
    const I = cpA(C, 'issem'); if (p.br && I && p.t - p.brT < 1.2) cpSmokeTick(cpPut(C, 'cpDust', CPB.dust, I.x / 100, 0, (I.z || 0) + .3), (p.t - p.brT) * 3, .8, .9, '#c8d8a0'); },
  end(C, p){ C.cam3 = null; const I = cpA(C, 'issem'); if (I){ I.w3 = false; } }
};
/* stat çıkışı: telefon cebe (yakın plan) → çıkışa doğru yürüyüş */
CP.exitWalk = {
  start(C, p){ const I = cpA(C, 'issem'); if (!I) return; I.x = 230; I.z = 0; I.face = 1; I.vx = 0; I.hold = 'phone'; I.cpPose = 'phone'; I.pose = null; I.tx = null; C.zoom.z = C.zoom.tz = 2.3; C.cam.x = C.cam.tx = -215; },
  tick(C, p){ const I = cpA(C, 'issem'); if (!I) return;
    if (p.t > 1.1 && !p.pk){ p.pk = 1; I.cpPose = 'pocket'; SFX.grab && SFX.grab(); }
    if (p.t > 1.55 && !p.pk2){ p.pk2 = 1; I.hold = null; I.cpPose = null; }
    if (p.t > 1.9 && !p.w){ p.w = 1; C.zoom.z = C.zoom.tz = 1; C.cam.x = C.cam.tx = 0; cpGo(I, 640, -.7, 100); p.wT = p.t; }
    if (p.w && !I.goal && !p.w2){ p.w2 = 1; cpGo(I, 1000, -.7, 100); }
    if (p.w2 && !I.goal && !p.gone){ p.gone = 1; I.hidden = true; }
    if (p.w){ const k = cpE(Math.min(1, (p.t - p.wT) / 7)), ix = I.x / 100; C.cam3 = { t:0, keys:[[0, [1.8 + k * 4.4, 1.45, 6.0 - k * .6], [4.8 + k * 3.4, 2.7 - k * .6, -6], 54], [1, [0, 0, 0], [0, 0, 0], 56]] }; } },
  end(C){ C.cam3 = null; }
};
/* Ufis gizemli adamın bıraktığı adrese ulaşır: kâğıda bakar, binaya bakar */
CP.address = {
  start(C, p){ const U = cpA(C, 'ufis'); if (!U) return; U.x = -60; U.z = 0; U.face = 1; U.hold = 'paper'; U.cpPose = 'read'; cpGo(U, 400, 0, 95); },
  tick(C, p){ const U = cpA(C, 'ufis'); if (!U) return;
    if (!U.goal && !p.st){ p.st = 1; p.sT = p.t; U.cpPose = 'read'; }
    if (p.st && p.t - p.sT > 1.6 && !p.lk){ p.lk = 1; U.cpPose = 'lookUp'; U.yaw3 = Math.PI / 2; }
    if (p.lk && p.t - p.sT > 3.2 && !p.lk2){ p.lk2 = 1; U.hold = null; U.cpPose = 'fist'; U.yaw3 = null; U.face = 1; } }
};
/* genel: biri birkaç kişiyi dövüp yere serer */
CP.brawl = {
  start(C, p){ p.i = 0; p.nt = p.delay || .4; const A = cpA(C, p.who); if (A){ A.cpPose = 'guard'; A.hidden = false; } },
  tick(C, p, dt){ const A = cpA(C, p.who); if (!A) return; const L = p.targets || []; if (p.i >= L.length){ if (!p.fin){ p.fin = 1; A.cpPose = p.endPose || 'guard'; } return; }
    const T = cpA(C, L[p.i]); if (!T || T.pose === 'lie'){ p.i++; return; }
    const dx = T.x - A.x; A.face = dx > 0 ? 1 : -1;
    if (Math.abs(dx) > 70 && !A.goal){ cpGo(A, T.x - A.face * 60, T.z || 0, 380); A.cpPose = null; return; }
    if (A.goal) return; A.cpPose = p.i % 2 ? 'kickHi' : 'punch'; T.cpPose = 'stagger'; p.nt -= dt;
    if (p.nt <= 0){ T.cpPose = null; T.e = 'pain'; T.fallV = A.face * 260; T.pose = 'lie'; T.stars = true; SFX.punchHeavy(); shake = Math.max(shake, 6); vib(35); p.i++; p.nt = .55; } }
};
/* genel: kişiler yürüyüp kadrajdan çıkar */
CP.leave = { start(C, p){ (p.who || []).forEach((id, i) => { const a = cpA(C, id); if (a){ a.cpPose = null; cpGo(a, p.x != null ? p.x : 1150, p.z != null ? p.z : (a.z || 0), p.sp || 130, { hidden:!!p.hide }); } }); } };
/* genel: biri etrafına bakınır */
CP.lookAround = { tick(C, p){ [].concat(p.who).forEach((id, i) => { const a = cpA(C, id); if (!a || a.hidden) return; const k = Math.floor(p.t / (p.per || 1.1) + i * .37) % 2; a.face = k ? -1 : 1; a.yaw3 = null; a.cpPose = p.pose || (i % 2 ? 'shock' : null); }); } };
/* stat dışı: taraftarlar kapılara yürür, atkı sallar; kamera geniş açıdan yaklaşır */
CP.fansGates = {
  start(C, p){ const looks = ['fan1', 'fan2', 'civ1', 'civ3', 'fan1', 'civ4', 'fan2', 'civ5', 'fan1', 'civ2'];
    p.f = looks.map((lk, i) => { const L = i % 2 === 0, a = cpSpawn(C, 'fg' + i, lk, L ? -80 - i * 40 : 1040 + i * 40, { z:-1.5 - (i % 4) * 1.2, face:L ? 1 : -1 }); a.cpPose = i % 3 === 0 ? 'wave' : i % 3 === 1 ? 'cheer' : null; a.gx = 150 + (i * 97) % 700; return a; });
    p.f.forEach((a, i) => cpGo(a, a.gx, -7.6, 120 + (i % 3) * 20)); C.st.cheer = true;
    C.cam3 = { t:0, keys:[[0, [1.4, 1.6, 8.6], [4.8, 4.2, -9], 60], [7, [3.4, 1.7, 6.2], [5.4, 3.0, -9], 54]] }; },
  tick(C, p, dt){ if (C.cam3) C.cam3.t += dt; for (const a of p.f) if (!a.goal && !a.hidden && (a.z || 0) < -7.4){ a.hidden = true; } },
  draw(c, C, p, has3){ if (!has3) return; p.f.forEach((a, i) => { if (i % 3 !== 1 || a.hidden) return; const o = cpPut(C, 'cpFF' + i, CPB.flag, a.x / 100 + .1, 1.0, (a.z || 0) + .05, 0); cpFlagTick(o, C.t * 1.3 + i); }); },
  end(C){ C.cam3 = null; }
};
/* gol sevinci: herkes golcüye koşar, zıplar; meşale + konfeti */
CP.goalCeleb = {
  start(C, p){ const S = cpA(C, p.who || 'issem'); if (!S) return; S.cpPose = 'fistPump'; S.trophy = false; C.st.cheer = true; SFX.roar && SFX.roar(2.5); if (!p.noConf) C.cpFx && C.cpFx(['confetti']);
    p.m = C.actors.filter(a => /^(m|t)\d/.test(a.id) && !a.hidden && a.look.startsWith('mate'));
    p.m.forEach((a, i) => { const ang = i / Math.max(1, p.m.length) * Math.PI * 2; cpGo(a, S.x + Math.cos(ang) * (70 + (i % 2) * 30), (S.z || 0) - .4 - Math.abs(Math.sin(ang)) * 1.4, 300 + (i % 3) * 30, { cpPose:i % 2 ? 'jump' : 'cheer' }); a.cpPose = null; }); },
  tick(C, p){ const S = cpA(C, p.who || 'issem'); if (S && p.t > 1.6 && S.cpPose === 'fistPump') S.cpPose = 'jump'; },
  draw(c, C, p, has3){ if (!p.noFlare) CP.crowd.draw(c, C, { flares:8, flags:6 }, has3); }
};
/* siyah araç gelip durur */
CP.carIn = { start(C, p){ C.st.car = p.from || -500; SFX.dash && SFX.dash(); }, tick(C, p){ const k = cpE(Math.min(1, p.t / (p.dur || 1.8))); C.st.car = (p.from || -500) + ((p.to || 300) - (p.from || -500)) * (1 - Math.pow(1 - k, 2)); } };
/* genel: düşman dev ekranda belirir / ekrana bakılır — ekran zaten sahnede, kişiyi yavaşça yaklaştır */
CP.push = { start(C, p){ C.zoom.tz = p.zoom || 1.35; if (p.cam != null) C.cam.tx = p.cam; } };

/* ================= PLAN: hangi cümlede ne oynanır =================
   anahtar 'bölüm.akış.satır' → oyun (ya da liste). Sahne düzeltmeleri: CP_FIX. */
const STEP = (...s) => ({ do:'tl', steps:s });
const CP_PLAN = {
  /* ---- Bölüm 1 ---- */
  '1.1.0': { do:'train' },
  '1.4.0': STEP([0, 'issem', { pose:'nod' }], [0, 'coach', { pose:'point' }]),
  '1.4.1': STEP([0, 'issem', { pose:'fistPump' }], [0, 'coach', { pose:'clap' }]),
  '1.4.2': { do:'toLocker' },
  '1.4.4': STEP([0, 'issem', { pose:'shock' }]),
  '1.5.1': STEP([0, 'ufis', { pose:'punch' }], [2.2, 'ufis', { pose:'kickHi' }], [4.4, 'ufis', { pose:'guard' }]),
  '1.7.0': STEP([1.8, 'ufis', { pose:'guard', face:-1 }]),
  '1.8.1': { do:'nextDay' },
  '1.8.2': { do:'walkOut' },
  '1.8.3': { do:'kickoff' },
  '1.8.4': { do:'matchSim' },
  '1.8.5': STEP([0, 'issem', { stop:true, pose:'shock' }], [0, 'm3', { stop:true }], [0, 'm1', { stop:true }], [0, 'm2', { stop:true }], [0, 'm4', { stop:true }], [0, 'm5', { stop:true }], [0, 'm6', { stop:true }], [0, 'ref', { stop:true }]),
  '1.8.6': STEP([0, 'issem', { stop:true, pose:'lookUp' }], [0, 'ref', { stop:true, pose:'shock' }], [1.2, 'issem', { pose:'shock' }]),
  '1.8.7': { do:'chaos' },
  '1.8.8': STEP([0, 'issem', { pose:'lookUp' }], [.8, 'issem', { pose:'shock', face:-1 }], [1.6, 'issem', { face:1 }]),
  '1.8.10': { do:'tunnelRun' },
  '1.10.1': { do:'exitWalk' },
  '1.11.0': { do:'address' },
  '1.0.2': STEP([0, 'w1', { spawn:{ look:'mate', x:-80, z:-3 }, go:[1100, -3, 115] }], [.6, 'w2', { spawn:{ look:'mate2', x:-80, z:-3.8 }, go:[1100, -3.8, 120] }], [1.2, 'w3', { spawn:{ look:'coach', x:-80, z:-2.4 }, go:[1100, -2.4, 105] }]),
  /* ---- Bölüm 2 ---- */
  '2.0.2': STEP([0, 'issem', { at:[-40, 0], go:[300, 0, 140] }], [2.4, 'issem', { pose:'think' }]),
  '2.0.3': STEP([0, 'issem', { pose:null, go:[470, 0, 140] }], [1.1, 'issem', { face:1, pose:'type' }]),
  '2.0.4': STEP([0, 'issem', { pose:'think' }]),
  '2.0.5': STEP([.7, 'issem', { pose:'type' }], [1.3, 'issem', { pose:'think' }]),
  '2.0.7': STEP([.4, 'issem', { face:-1, pose:'shock' }]),
  '2.0.8': STEP([0, 'issem', { pose:null }], [0, 'guard', { pose:'arms' }]),
  '2.0.10': STEP([0, 'guard', { pose:'point' }]),
  '2.1.1': STEP([0, 'issem', { at:[-40, 0], go:[300, 0, 120], pose:'crouch' }], [2.7, 'issem', { pose:null }]),
  '2.5.1': STEP([0, 'issem', { at:[-60, 0], go:[360, 0, 130] }], [.4, 'ufis', { at:[-170, 0], go:[580, 0, 130] }], [6, 'ufis', { face:-1 }]),
  '2.6.6': STEP([0, 'issem', { face:1, pose:'nod' }], [0, 'ufis', { face:-1, pose:'nod' }]),
  '2.7.1': STEP([0, 'lider', { yaw:1.57, pose:'arms' }]),
  '2.7.2': STEP([0, 'lider', { yaw:null, face:1, pose:null }]),
  /* ---- Bölüm 3 ---- */
  '3.0.3': STEP([0, 'st', { cam:220, zoom:1.15 }], [2.8, 'st', { cam:0, zoom:1 }]),
  '3.3.1': STEP([0, 'issem', { at:[60, 0], go:[260, 0, 120] }], [.3, 'ufis', { at:[-60, 0], go:[140, 0, 120] }], [2, 'issem', { pose:'lookUp' }], [2.2, 'ufis', { pose:'think' }]),
  '3.3.2': STEP([0, 'issem', { pose:null }], [0, 'ufis', { pose:null }]),
  '3.3.4': STEP([0, 'issem', { pose:'think' }], [0, 'ufis', { go:[320, 0, 120] }]),
  '3.3.5': STEP([0, 'issem', { pose:null }]),
  '3.8.5': STEP([0, 'issem', { pose:'think' }], [0, 'ufis', { pose:'fist' }]),
  /* ---- Bölüm 4 ---- */
  '4.0.3': STEP([0, 'issem', { go:[460, 0, 90] }], [1.4, 'issem', { face:1, pose:'think' }]),
  '4.0.4': STEP([0, 'issem', { pose:null }]),
  '4.1.1': STEP([0, 'genc', { pose:'punch' }], [0, 'usta', { pose:'guard' }]),
  '4.1.2': STEP([0, 'usta', { pose:'nod' }], [0, 'genc', { pose:'guard' }]),
  '4.5.1': STEP([0, 'issem', { at:[-40, 0], go:[520, 0, 130] }], [.3, 'ufis', { at:[-150, 0], go:[400, 0, 130] }]),
  '4.5.2': STEP([0, 'ufis', { yaw:1.57, pose:'lookUp' }], [.4, 'issem', { go:[640, 0, 90] }], [1.7, 'issem', { yaw:1.57, pose:'think' }]),
  '4.5.3': STEP([0, 'yard', { pose:'clap' }], [.3, 'issem', { yaw:null, face:-1, pose:'shock' }], [.3, 'ufis', { yaw:null, pose:null }]),
  '4.5.4': STEP([0, 'yard', { pose:'arms' }], [0, 'issem', { pose:null }]),
  '4.8.1': STEP([0, 'lider', { pose:'point' }], [0, 'm1', { pose:'nod' }], [0, 'm2', { pose:'nod' }]),
  /* ---- Bölüm 5 ---- */
  '5.0.2': STEP([.7, 'issem', { pose:'read' }], [0, 'ufis', { pose:'think' }]),
  '5.0.3': STEP([0, 'ufis', { pose:null }]),
  '5.1.2': STEP([0, 'st', { ball:[660, 0, 0] }], [0, 'leo', { jug:true, pose:'juggle' }]),
  '5.1.3': STEP([0, 'leo', { pose:null, kick:[720, -.6, 2] }]),
  '5.1.4': STEP([0, 'issem', { pose:'talk' }], [0, 'leo', { pose:'nod' }]),
  '5.1.5': STEP([0, 'issem', { pose:null }], [0, 'leo', { pose:null }]),
  '5.2.1': STEP([0, 'leo', { pose:'point' }], [0, 'issem', { pose:'think' }], [0, 'ufis', { pose:'nod' }]),
  '5.2.2': STEP([0, 'leo', { pose:null }], [0, 'issem', { pose:null }], [0, 'ufis', { pose:null }]),
  '5.3.0': STEP([0, 'leo', { spawn:{ look:'leo', x:-60 }, go:[430, 0, 130] }], [.3, 'issem', { spawn:{ look:'issem', x:-170 }, go:[300, 0, 130] }]),
  '5.6.1': STEP([0, 'leo', { yaw:1.57, pose:'type' }]),
  '5.6.3': STEP([0, 'leo', { yaw:null, face:-1, pose:'fistPump' }]),
  '5.6.4': STEP([0, 'leo', { pose:null }]),
  '5.6.6': STEP([0, 'leo', { yaw:1.57, pose:'type' }], [0, 'issem', { go:[480, 0, 120] }], [1.4, 'issem', { pose:'lookUp' }]),
  '5.7.1': { do:'carIn', from:-520, to:300 },
  '5.8.1': STEP([0, 'st', { ball:[350, 0, 0] }], [0, 'issem', { jug:true, pose:'juggle' }], [0, 'ufis', { pose:'punch' }], [0, 'leo', { yaw:1.57, pose:'type' }]),
  '5.8.2': STEP([0, 'issem', { pose:null, kick:[300, -.6, 1.5] }], [0, 'ufis', { pose:null }], [0, 'leo', { pose:null, yaw:null, face:-1 }], [0, 'st', { zoom:1.15 }]),
  /* ---- Bölüm 6 ---- */
  '6.0.2': STEP([0, 'leo', { yaw:1.57, pose:'type' }], [0, 'issem', { pose:'stretch' }], [0, 'ufis', { pose:'guard' }]),
  '6.0.3': STEP([0, 'leo', { pose:null, yaw:null, face:-1 }], [0, 'issem', { pose:null, go:[450, 0, 140] }], [0, 'ufis', { pose:null, go:[330, 0, 140] }]),
  '6.1.2': STEP([0, 'st', { cam:120, zoom:1.1 }], [0, 'issem', { rawPose:'peek' }], [.3, 'leo', { rawPose:'peek' }]),
  '6.1.3': STEP([0, 'st', { cam:0, zoom:1 }]),
  '6.3.0': STEP([0, 'issem', { at:[60, 0], go:[300, 0, 120] }], [.2, 'ufis', { at:[-60, 0], go:[180, 0, 120] }], [1.7, 'issem', { pose:'lookUp' }], [1.9, 'ufis', { pose:'lookUp' }]),
  '6.3.2': STEP([0, 'issem', { pose:null }], [0, 'ufis', { pose:null }]),
  '6.3.7': STEP([0, 'issem', { pose:'fist' }], [0, 'ufis', { pose:'arms' }]),
  '6.3.8': STEP([0, 'ufis', { pose:null }]),
  '6.4.3': STEP([0, 'ufis', { pose:'fist' }]),
  '6.4.4': STEP([0, 'ufis', { pose:null }]),
  '6.7.0': STEP([0, 'issem', { at:[-80, 0], run:[420, 0, 380] }], [.2, 'ufis', { at:[-190, 0], run:[300, 0, 380] }], [.1, 'leo', { at:[-60, 0], run:[560, 0, 380] }], [2.2, 'leo', { face:-1 }]),
  '6.8.1': STEP([0, 'lider', { yaw:1.57 }]),
  '6.8.2': STEP([0, 'lider', { yaw:null, face:-1 }]),
  '6.8.4': STEP([0, 'lider', { yaw:1.57, pose:'lookUp' }]),
  '6.8.5': STEP([0, 'lider', { yaw:null, face:1, pose:null }]),
  /* ---- Bölüm 7 ---- */
  '7.0.2': STEP([0, 'issem', { go:[270, 0, 90] }], [1.2, 'issem', { pose:'think' }], [0, 'ufis', { pose:'think' }]),
  '7.0.4': STEP([0, 'ufis', { pose:'fist' }], [0, 'issem', { pose:null }]),
  '7.0.5': STEP([0, 'ufis', { pose:null }]),
  '7.1.2': STEP([0, 'narak', { pose:'arms' }], [.3, 'issem', { pose:'shock' }], [.3, 'leo', { pose:'shock' }]),
  '7.1.3': STEP([0, 'issem', { pose:null }], [0, 'leo', { pose:null }]),
  '7.1.8': STEP([0, 'ufis', { go:[540, 0, 260] }], [.5, 'ufis', { pose:'punch' }], [.5, 'narak', { pose:'guard' }]),
  '7.3.0': STEP([0, 'ufis', { pose:'guard' }]),
  '7.3.1': STEP([0, 'ufis', { pose:null }]),
  '7.4.1': STEP([0, 'lider', { yaw:1.57 }]),
  '7.4.2': STEP([0, 'lider', { yaw:null, face:-1 }]),
  '7.4.4': STEP([0, 'lider', { yaw:1.57, pose:'arms' }]),
  '7.4.5': STEP([0, 'lider', { yaw:null, face:1, pose:null }]),
  /* ---- Bölüm 8 ---- */
  '8.0.2': STEP([0, 'issem', { pose:'lookUp' }]),
  '8.0.4': STEP([0, 'issem', { pose:'crouch' }], [1.8, 'issem', { pose:'stretch' }]),
  '8.0.5': STEP([0, 'issem', { pose:null }]),
  '8.3.1': { do:'fansGates' },
  '8.5.1': { do:'kickoff' },
  '8.7.1': { do:'goalCeleb' },
  '8.8.2': STEP([0, 'ufis', { pose:'lookUp' }]),
  '8.8.3': STEP([0, 'ufis', { pose:null }]),
  '8.10.1': STEP([0, 'lider', { yaw:1.57, pose:'arms' }]),
  '8.10.3': STEP([0, 'lider', { yaw:null, face:1, pose:null }]),
  '8.11.1': { do:'lookAround', who:['issem', 'm1', 'm2', 'm3', 'm4'] },
  '8.11.2': STEP([0, 'issem', { face:1, pose:null }]),
  /* ---- Bölüm 9 ---- */
  '9.2.1': STEP([0, 'issem', { at:[-60, 0], run:[420, 0, 330] }], [0, 'm1', { pose:'guard' }], [0, 'm2', { pose:'guard' }], [1.8, 'issem', { pose:'lookUp' }]),
  '9.2.2': STEP([0, 'issem', { pose:null }]),
  '9.5.1': STEP([0, 'issem', { spawn:{ look:'issem', x:-80, z:-4 }, run:[1120, -4, 430] }], [0, 'ufis', { pose:'bow' }]),
  '9.8.0': STEP([0, 'issem', { pose:'guard', go:[470, 0, 150] }], [0, 'ufis', { pose:'guard', go:[390, 0, 150] }], [.8, 'g2', { go:[720, 0, 150] }]),
  '9.9.1': STEP([0, 'issem', { pose:'jump' }], [0, 'm1', { pose:'cheer' }], [0, 'm3', { pose:'jump' }], [0, 'st', { cheer:true }]),
  '9.9.2': STEP([0, 'ufis', { go:[205, 0, 140] }], [0, 'usta', { go:[150, 0, 100] }], [1.3, 'ufis', { face:-1, pose:'hug' }], [1.3, 'usta', { face:1, pose:'hug' }]),
  '9.9.3': STEP([0, 'ufis', { pose:null }], [0, 'usta', { pose:null }]),
  '9.9.5': { do:'goalCeleb', noFlare:true, noConf:true },
  '9.9.10': STEP([0, 'issem', { pose:'wave', go:[560, 0, 120] }], [0, 'ufis', { pose:'clap' }], [0, 'usta', { pose:'clap' }]),
  /* ---- Bölüm 10 ---- */
  '10.0.4': STEP([0, 't1', { go:[380, 0, 100] }], [0, 't3', { go:[580, 0, 100] }], [0, 't2', { go:[270, 0, 100] }]),
  '10.0.6': STEP([0, 'issem', { pose:'fistPump' }], [0, 't1', { pose:'cheer' }], [0, 't3', { pose:'clap' }]),
  '10.0.7': { do:'leave', who:['t1', 't2', 't3', 'issem'], x:1160, sp:180, hide:true },
  '10.1.1': { do:'fansGates' },
  '10.3.1': { do:'kickoff', noMin:true },
  '10.3.2': STEP([0, 'issem', { pose:'sad' }], [0, 'm1', { pose:'sad' }], [0, 'm2', { pose:'sad' }], [0, 'rv0', { pose:'jump' }], [0, 'rv2', { pose:'cheer' }], [0, 'rv1', { pose:'cheer' }]),
  '10.3.3': STEP([0, 'issem', { pose:'fist' }], [0, 'm1', { pose:null }], [0, 'm2', { pose:null }]),
  '10.3.4': { do:'kickoff', noMin:true },
  '10.5.2': { do:'goalCeleb' },
  '10.5.3': STEP([0, 'ref', { spawn:{ look:'hakem', x:720, z:-1.6, face:-1 }, hold:'whistle', pose:'whistle' }], [1.0, 'ref', { pose:'pointUp' }], [1.6, 'issem', { pose:'jump' }]),
  '10.5.5': STEP([.2, 'm1', { pose:'jump' }], [.4, 'm3', { pose:'jump' }], [.1, 'm5', { pose:'jump' }]),
  '10.6.1': STEP([0, 'issem', { go:[470, 0, 120] }], [1.7, 'issem', { face:-1 }]),
  '10.6.6': STEP([0, 'issem', { pose:'shake' }], [0, 'ufis', { pose:'shake' }], [1.6, 'issem', { pose:'hug' }], [1.6, 'ufis', { pose:'hug' }], [3.2, 'issem', { pose:'bow' }], [3.2, 'ufis', { pose:'bow' }], [3.2, 'usta', { pose:'bow' }],
    [4.6, 'issem', { pose:'wave' }], [4.6, 'ufis', { pose:'wave', face:-1 }], [5.2, 'ufis', { go:[-140, 0, 110] }], [5.4, 'usta', { pose:'wave', go:[-220, 0, 100] }]),
  '10.7.1': { do:'carIn', from:-520, to:260 },
  '10.8.0': STEP([0, 'golge', { at:[-60, 0], go:[300, 0, 110] }]),
  '10.8.4': STEP([1.4, 'golge', { yaw:1.57 }]),
  '10.8.5': STEP([0, 'golge', { yaw:null, face:-1 }]),
};
/* sahne düzeltmeleri (yükleme anında; hikâye metni aynı kalır) */
function cpFixStory(){
  const F = (ch, i) => CHAPTERS[ch - 1] && CHAPTERS[ch - 1].flow[i] && CHAPTERS[ch - 1].flow[i].cut;
  // B1 · antrenman sonu: telefonu Issem önce yürüyüp titreyince çıkarsın (oyun yönetir)
  { const c = F(1, 4); if (c){ const ln = c.lines[2]; if (ln && ln.set && ln.set.issem) delete ln.set.issem.takeout; } }
  // B1 · maç günü: sahada henüz kimse yok, top orta yuvarlakta durmasın
  { const c = F(1, 8); if (c){ c.actors.forEach(a => a.hidden = true); delete c.ball; } }
  // B1 · bölüm sonu: berber sokağı değil stat çıkışı; Ufis bu karede yok — kendi adresine vardığı ayrı kare
  { const f = CHAPTERS[0].flow, c = F(1, 10); if (c && !c.cpSplit){ c.cpSplit = 1; c.bg = 'stadCikis';
      c.actors = c.actors.filter(a => a.id !== 'ufis'); const rest = c.lines.splice(2);
      f.splice(11, 0, { cut:{ bg:'arkaSokak', music:c.music, actors:[ A('ufis', 'ufis', -60, 1) ], lines:rest } }); } }
}
function cpApplyPlan(){
  try { cpFixStory(); } catch(e){ console.warn('cpFix', e); }
  for (const k in CP_PLAN){ const [ch, fi, li] = k.split('.').map(Number), c = CHAPTERS[ch - 1] && CHAPTERS[ch - 1].flow[fi] && CHAPTERS[ch - 1].flow[fi].cut;
    if (!c || !c.lines[li]){ console.warn('cp plan yok', k); continue; } c.lines[li].play = CP_PLAN[k]; }
}
cpApplyPlan();
