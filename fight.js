'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   fight.js
   iki katlı alanlar · eşyalar · silahlar · baş dönmesi · süper · yavaş çekim
   ========================================================= */
let shake = 0, hitstop = 0;
const FX = { ts:1, tsT:0, zoom:1, zx:480, zy:300, flash:0 };
function slowMo(x, y, dur = 1.1){ FX.ts = .28; FX.tsT = dur; FX.zoom = 1.18; FX.zx = x; FX.zy = y; }

const MOVES = {
  issem: { punch:[{ dur:.26, a:.06, b:.15, range:66, dmg:8, kb:170, anim:'punch' }, { dur:.32, a:.08, b:.18, range:70, dmg:11, kb:300, anim:'punch', heavy:true }],
           kick:{ dur:.36, a:.12, b:.22, range:84, dmg:11, kb:320, anim:'kick' }, ball:{ dur:.42, a:.17, anim:'shoot', cd:.6 },
           sweep:{ dur:.4, a:.12, b:.24, range:90, dmg:9, kb:120, anim:'kick', down:true, low:true }, air:{ dur:.55, a:.04, b:.5, range:72, dmg:13, kb:320, anim:'kick', down:true },
           upper:{ dur:.38, a:.1, b:.24, range:70, dmg:13, kb:120, anim:'upper', heavy:true, launch:true }, fly:{ dur:.5, a:.06, b:.42, range:92, dmg:15, kb:460, anim:'flykick', heavy:true, down:true } },
  ufis:  { punch:[{ dur:.21, a:.05, b:.13, range:64, dmg:7, kb:120, anim:'punch' }, { dur:.21, a:.05, b:.13, range:64, dmg:7, kb:140, anim:'punch' }, { dur:.32, a:.08, b:.19, range:70, dmg:13, kb:360, anim:'punch', heavy:true, down:true }],
           kick:{ dur:.4, a:.12, b:.26, range:94, dmg:14, kb:440, anim:'kick', heavy:true },
           sweep:{ dur:.38, a:.1, b:.24, range:96, dmg:10, kb:120, anim:'kick', down:true, low:true }, air:{ dur:.55, a:.04, b:.5, range:76, dmg:15, kb:360, anim:'kick', down:true },
           upper:{ dur:.36, a:.09, b:.22, range:72, dmg:15, kb:120, anim:'upper', heavy:true, launch:true }, fly:{ dur:.5, a:.06, b:.42, range:98, dmg:17, kb:500, anim:'flykick', heavy:true, down:true } },
};
const WEAPONS = { sopa:{ dmg:15, range:98, dur:.4, kb:380, uses:7, sfx:'wood' }, boru:{ dmg:18, range:104, dur:.48, kb:420, uses:9, sfx:'metal' }, sise:{ dmg:14, range:80, dur:.32, kb:260, uses:1, sfx:'glass' } };
const OBJ = {
  kutu:{ w:52, h:52, hp:18, solid:1, carry:1, col:'#a0723f', sfx:'wood', tdmg:16 },
  koli:{ w:46, h:38, hp:6,  solid:1, carry:1, col:'#c9a26b', sfx:'card', tdmg:8 },
  dolap:{ w:62, h:118, hp:34, solid:1, carry:0, col:'#5d6b7a', sfx:'metal' },
  varil:{ w:46, h:62, hp:28, solid:1, carry:1, col:'#7a2a1a', sfx:'metal', tdmg:22, heavy:1 },
  sise:{ w:12, h:26, hp:1, solid:0, carry:0, col:'#2e8b57', sfx:'glass', weapon:'sise' },
  cop:{ w:44, h:60, hp:14, solid:1, carry:1, col:'#5f6f62', sfx:'metal', tdmg:18 },
};
const ETYPES = {
  dummy:   { hp:22 },
  thug:    { look:'thug',    hp:32, speed:118, range:58, dmg:8,  windT:.48, dz:26, wpn:[['sopa', .45]] },
  masked:  { look:'masked',  hp:34, speed:128, range:58, dmg:9,  windT:.45, dz:28, wpn:[['sise', .2]], leap:true },
  guard:   { look:'guard',   hp:36, speed:112, range:60, dmg:9,  windT:.5,  dz:30, wpn:[['sopa', .35]] },
  kicker:  { look:'kicker',  hp:26, speed:175, range:76, dmg:8,  windT:.32, dz:22, kick:true, leap:true },
  shield:  { look:'shieldg', hp:46, speed:88,  range:60, dmg:10, windT:.55, dz:40, shield:true },
  charger: { look:'charger', hp:46, speed:96,  range:62, dmg:13, windT:.5,  dz:30, rush:true },
  brute:   { look:'brute',   hp:80, speed:85,  range:76, dmg:14, windT:.7,  dz:50, big:true, wpn:[['boru', .55]] },
  yardimci:{ look:'yardimci',hp:300, speed:170, range:62, dmg:11, windT:.36, dz:80, boss:true, name:'YARDIMCI', combo:2, dodge:.28, dash:true },
  narak:   { look:'narak',   hp:420, speed:210, range:68, dmg:12, windT:.28, dz:95, boss:true, name:'NARAK', combo:3, dodge:.42, dash:true },
  dovuscu: { look:'dovuscu', hp:480, speed:110, range:84, dmg:17, windT:.6,  dz:110, boss:true, name:'YENİ DÖVÜŞÇÜ', combo:1, slam:true, big:true },
  lider:   { look:'lider',   hp:580, speed:155, range:66, dmg:13, windT:.38, dz:100, boss:true, name:'LİDER', combo:2, dodge:.3, dash:true, slam:true, summon:true },
};
/* ---------- 3B düzlem yardımcıları: x (koridor boyunca) · z (derinlik) · yaw (bakış) — 2D'de z = 0 ---------- */
const fwdOf = f => ({ x:Math.cos(f.yaw || 0), z:-Math.sin(f.yaw || 0) });
function setYaw(f, a){ f.yaw = Math.atan2(Math.sin(a), Math.cos(a)); f.face = Math.cos(f.yaw) >= -1e-6 ? 1 : -1; }
function faceSign(f, s){ setYaw(f, s >= 0 ? 0 : Math.PI); }
function faceTo(f, x, z){ const dx = x - f.x, dz = (z || 0) - (f.z || 0); if (Math.abs(dx) + Math.abs(dz) > .5) setYaw(f, Math.atan2(-dz, dx)); }
function turnTo(f, a, k){ let d = a - (f.yaw || 0); d = Math.atan2(Math.sin(d), Math.cos(d)); setYaw(f, (f.yaw || 0) + d * Math.min(1, k)); }
const pdist = (a, b) => Math.hypot(a.x - b.x, (a.z || 0) - (b.z || 0));
function relTo(p, e){ const F = fwdOf(p), dx = e.x - p.x, dz = (e.z || 0) - (p.z || 0); return { along:dx * F.x + dz * F.z, side:Math.abs(-dx * F.z + dz * F.x), d:Math.hypot(dx, dz) }; }
function dirV(d){ if (typeof d === 'number') return { x:d >= 0 ? 1 : -1, z:0 }; const l = Math.hypot(d.x, d.z || 0) || 1; return { x:d.x / l, z:(d.z || 0) / l }; }
const dSign = d => typeof d === 'number' ? (d >= 0 ? 1 : -1) : (d.x >= 0 ? 1 : -1);
const awayV = (a, b) => dirV({ x:a.x - b.x || .001, z:(a.z || 0) - (b.z || 0) });
function move2(f, dt){ f.x += f.vx * dt; f.z = (f.z || 0) + (f.vz || 0) * dt; }
function damp2(f, k){ f.vx *= k; f.vz = (f.vz || 0) * k; }
const inZ = (s, f, m = 4) => s.z1 == null || ((f.z || 0) >= s.z1 - m && (f.z || 0) <= s.z2 + m);
/* kutu (eşya) kenarına yatay uzaklık */
function boxDist(o, x, z){ const hx = o.w / 2, hz = (o.d || o.w) / 2, dx = Math.max(0, Math.abs(x - o.x) - hx), dz = Math.max(0, Math.abs((z || 0) - (o.z || 0)) - hz); return Math.hypot(dx, dz); }
const rz = L => L.d3 ? rand(L.zMin + 70, L.zMax - 70) : 0;

function makeFighter(kind, x){
  if (kind === 'issem'){ const hp = Math.round(100 * (.85 + PST('day') * .35)); return Object.assign(makeFighter('_', x), { kind, mk:'issem', look:LOOK.issem, hp, maxhp:hp }); }
  return { kind, mk: kind === 'ufisGenc' ? 'ufis' : kind, x, y:GROUND, z:0, vx:0, vy:0, vz:0, face:1, yaw:0, hp:100, maxhp:100, look:LOOK[kind], animT:0, atk:null, stun:0, inv:0, cd:0,
    onGround:true, plat:null, combo:0, lastAtkEnd:-9, blocking:false, dead:false, defE:'neutral', sup:0, dz:0, dizzy:0, down:0, getup:0, slideT:0, slideCd:0, weapon:null, carry:null, dropT:0 };
}
let ENEMY_UID = 0;
function makeEnemy(type, x, o = {}){
  const T = ETYPES[type], D = DIFF(), fc = o.face || -1;
  const e = { uid:++ENEMY_UID, type, T, x, y:o.y || GROUND, z:o.z || 0, vx:0, vy:0, vz:0, face:fc, yaw:fc > 0 ? 0 : Math.PI, animT:Math.random() * 3, stun:0, wind:0, strike:0, cd:rand(.6, 1.4), dead:false, deadT:0, onGround:true, plat:null,
    inv:0, hop:0, dashing:0, comboN:0, hits:0, hitT:0, armorT:0, defE:'angry', dz:0, dizzy:0, down:0, getup:0, weapon:null, flash:0, jumpCd:0, dropT:0, strafe:Math.random() < .5 ? 1 : -1, strafeT:rand(1, 3) };
  if (type === 'dummy') return Object.assign(e, { dummy:true, hp:22, maxhp:22, wob:0, wv:0, fall:0, cd:0 });
  e.look = (typeof enemyLook === 'function' && enemyLook(type, e.uid)) || LOOK[T.look]; e.hp = e.maxhp = Math.round(T.hp * D.hp); if (T.boss) e.cd = 1.2;
  if (o.weapon !== undefined) e.weapon = o.weapon ? { t:o.weapon, uses:WEAPONS[o.weapon].uses } : null;
  else if (T.wpn) for (const [w, p] of T.wpn) if (Math.random() < p){ e.weapon = { t:w, uses:WEAPONS[w].uses }; break; }
  return e;
}
const alive = L => L.ents.filter(e => !e.dead && !e.dummy);
function spawnParts(L, x, y, col, n, type = 'spark', sp = 260, z){ const d3 = L && L.d3; for (let i = 0; i < n; i++) L.parts.push({ x, y, z:z || 0, vx:rand(-sp, sp), vy:rand(-sp * 1.2, sp * .2), vz:d3 ? rand(-sp, sp) * .7 : 0, life:rand(.25, .55), col, type, r:rand(0, 6) }); }
function floatText(L, x, y, text, col, size, z){ L.texts.push({ x, y, z:z != null ? z : (L.p ? L.p.z || 0 : 0), t:0, text, col, size }); }
function sameLevel(a, b){ return Math.abs(a.y - b.y) < 46; }

/* ---------- vuruş ---------- */
function hitEnemy(L, e, dmg, kb, dir, o = {}){
  const dv = dirV(dir), ds = dSign(dir);
  if (Math.random() < (o.heavy || o.down ? .55 : .25)) grunt(e.T && e.T.boss ? 'boss' : 'enemy', pick(['u', 'o', 'a']), o.heavy ? .2 : .13, .85);
  if (e.dead) return;
  if (e.dummy){ e.hp -= dmg; e.wv += ds * 9; e.wobV = dv; SFX.punch(); spawnParts(L, e.x, e.y - 90, '#ffe066', 6, 'spark', 260, e.z); L.bursts.push({ x:e.x - dv.x * 8, y:e.y - 92, z:e.z - dv.z * 8, t:0 });
    if (e.hp <= 0 && !e.dead){ e.dead = true; e.fallDir = ds; e.fallV = dv; SFX.wood(); floatText(L, e.x, e.y - 130, 'DEVRİLDİ!', '#ffd34d', undefined, e.z); } return; }
  if (e.down > 0 || e.inv > 0) return;
  const T = e.T, boss = T.boss, sc = e.look.scale || 1;
  if (e.dizzy > 0) dmg = Math.round(dmg * 1.3);
  e.hp -= dmg; e.flash = .1; hitstop = o.heavy ? .09 : .05; shake = Math.max(shake, o.heavy ? 8 : 5);
  e.hitV = dv; e.hitK = o.heavy ? 1 : .6; e.hitT3 = .32;
  { const w = L.p && L.p.weapon && L.p.atk ? L.p.weapon.t : null;
    if (w === 'sopa') SFX.batHit(); else if (w === 'boru') SFX.clang(); else if (w === 'sise') SFX.bottle();
    else if (o.launch) SFX.crunch(); else if (o.heavy) (Math.random() < .5 ? SFX.punchHeavy : SFX.bodyBlow)(); else (Math.random() < .5 ? SFX.punch : Math.random() < .5 ? SFX.punchFace : SFX.elbow)(); }
  vib(o.heavy ? 40 : 20); if (L.combo >= 2 && L.comboT > 0) SFX.combo();
  L.combo = L.comboT > 0 ? L.combo + 1 : 1; L.comboT = 1.4; L.score += dmg * 10 + (L.combo >= 3 ? L.combo * 15 : 0);
  const p = L.p; if (p) p.sup = Math.min(100, p.sup + dmg * .9);
  const hx = e.x - dv.x * 10, hz = e.z - dv.z * 10, hy = e.y - 88 * sc;
  L.bursts.push({ x:hx, y:hy, z:hz, t:0, big:o.heavy });
  impactFX(L, hx, hy, dv, o, hz); styleHit(L, o);
  spawnParts(L, e.x - dv.x * 8, e.y - 85 * sc, '#ffe066', o.heavy ? 12 : 7, 'spark', 260, e.z - dv.z * 8);
  if (e.weapon && (o.down || o.heavy) && Math.random() < .7) dropWeapon(L, e);
  e.dz += dmg;
  if (e.armorT > 0 && !o.down){ e.vx += kb * dv.x * .12; e.vz += kb * dv.z * .12; }
  else if (o.launch && !boss){ e.down = 1.1; e.vx = dv.x * 90; e.vz = dv.z * 90; e.vy = -820; e.onGround = false; e.flying = true; e.fallV = dv; e.wind = 0; e.strike = 0; e.stun = 0; floatText(L, e.x, e.y - 160, 'APARKAT!', '#ffcc66', 26, e.z); if (e.weapon) dropWeapon(L, e); }
  else if (o.down && (!boss || e.hits >= 2 || o.super)){ knockDown(L, e, dv, kb); }
  else {
    e.hits = e.hitT > 0 ? e.hits + 1 : 1; e.hitT = .9;
    const thr = boss ? 4 : T.big ? 2 : 3;
    if (e.hits >= thr && e.hp > 0 && e.dizzy <= 0){
      e.hits = 0; e.armorT = boss ? 1 : .75; e.stun = 0; e.dashing = 0; e.strike = 0;
      if (boss && Math.random() < .4){ e.inv = .4; e.hop = .3; e.vx = dv.x * 520; e.vz = dv.z * 520; e.cd = .15; }
      else { faceTo(e, e.x - dv.x * 20, e.z - dv.z * 20); e.move = 'hit'; e.wind = T.windT * .6; e.vx = 0; e.vz = 0; }
      if (!L.armorHint){ L.armorHint = true; L.hint = L.d3 ? 'Üst üste vurunca karşılık veriyorlar → 🛡️ blokla ya da 💨 kaç!' : 'Üst üste vurunca karşılık veriyorlar → 🛡️ blokla ya da ⬇ eğil!'; L.hintT = 4.5; }
    } else { e.wind = 0; e.strike = 0; e.dashing = 0; e.stun = boss ? .16 : .3; e.vx = kb * dv.x * (boss ? .35 : 1); e.vz = kb * dv.z * (boss ? .35 : 1); e.cd = Math.max(e.cd, boss ? .25 : .35); }
  }
  if (e.dz >= T.dz * (boss ? 1 : DIFF().hp) && e.hp > 0 && e.down <= 0){ e.dz = 0; e.dizzy = boss ? 1.3 : 1.9; e.wind = 0; e.strike = 0; e.stun = 0; SFX.dizzy(); floatText(L, e.x, e.y - 150, 'SERSEM!', '#fff176', 26, e.z); if (e.weapon) dropWeapon(L, e); }
  if (e.hp <= 0){ killEnemy(L, e, dv); }
}
function knockDown(L, e, dir, kb){
  const dv = dirV(dir); setTimeout(() => SFX.bodyFall(), 260);
  const v = Math.max(240, kb * .8);
  e.down = e.T && e.T.boss ? .7 : 1.0; e.vx = dv.x * v; e.vz = dv.z * v; e.vy = -260; e.onGround = false; e.wind = 0; e.strike = 0; e.dashing = 0; e.stun = 0; e.hits = 0; e.flying = true; e.fallV = dv;
  SFX.land(); if (e.weapon) dropWeapon(L, e);
}
function killEnemy(L, e, dir){
  const dv = dirV(dir);
  e.dead = true; e.vy = -380; e.vx = dv.x * 280; e.vz = dv.z * 280; e.onGround = false; e.flying = true; e.fallV = dv; SFX.ko(); vib(60);
  const boss = e.T.boss; L.score += boss ? 1500 : 120;
  floatText(L, e.x, e.y - 140, boss ? 'K.O.!' : 'KO!', '#ff6b6b', boss ? 52 : 30, e.z);
  if (e.weapon) dropWeapon(L, e);
  const last = alive(L).length === 0 && (!L.def.waves || L.wi >= L.def.waves.length) && !L.def.survive;
  if (boss || last){ slowMo(e.x, e.y - 80, boss ? 1.6 : 1.0); SFX.slowmo(); SFX.crunch(); hitstop = .15; shake = 16; if (boss){ SFX.bell(); say('Nakavt!', 'Spiker'); } }
  else if (Math.random() < .18) L.pickups.push({ x:e.x, y:e.y, z:e.z, kind:'hp', t:0 });
}
function dropWeapon(L, e){ if (!e.weapon) return; SFX.clatter(); const F = fwdOf(e); L.pickups.push({ x:e.x - F.x * 20, y:e.y, z:e.z - F.z * 20, kind:'weapon', w:e.weapon.t, uses:e.weapon.uses, t:0, vy:-200, vx:-F.x * 120, vz:-F.z * 120 }); e.weapon = null; SFX.metal(); }
function hurtPlayer(L, dmg, from, o = {}){
  if (L.p && !L.p.dead && L.p.inv <= 0 && !L.p.blocking) grunt(L.p.mk === 'ufis' ? 'ufis' : 'issem', pick(['a', 'o']), .2, 1);
  const p = L.p; if (p.inv > 0 || p.dead || L.done || p.down > 0) return;
  const fx = typeof from === 'number' ? from : from.x, fz = typeof from === 'number' ? (p.z || 0) : (from.z || 0);
  if (p.slideT > 0 && !o.low){ if (p.slideT > .2 && !p.dodged){ p.dodged = true; perfectDodge(L, p, o.src); } return; }
  if (p.crouch && o.high && !o.unblockable){ floatText(L, p.x, p.y - 100, 'EĞİLDİ!', '#9ad7ff', undefined, p.z); return; }
  dmg = Math.round(dmg * DIFF().dmg);
  const F = fwdOf(p), facing = (fx - p.x) * F.x + (fz - p.z) * F.z > 0;
  if (p.blocking && facing && !o.unblockable && gameTime - (p.blockAt || -9) < .22){ parry(L, p, o.src); return; }
  if (p.blocking && facing && !o.unblockable){
    p.hp -= Math.ceil(dmg * .15); (Math.random() < .5 ? SFX.parry : SFX.block)(); vib(15); shake = Math.max(shake, 3); p.sup = Math.min(100, p.sup + 4);
    spawnParts(L, p.x + F.x * 22, p.y - 78, '#9ad7ff', 8, 'spark', 260, p.z + F.z * 22); p.x -= F.x * 14; p.z -= F.z * 14; floatText(L, p.x, p.y - 140, 'BLOK!', '#9ad7ff', undefined, p.z); p.blockT3 = .2;
    if (!L.blkHint){ L.blkHint = true; L.hint = 'İpucu: darbe gelmeden HEMEN ÖNCE 🛡️ bas → MÜKEMMEL BLOK! Rakip sendeler.'; L.hintT = 5; }
  } else {
    if (p.carryE){ const e = p.carryE; p.carryE = null; e.grabbedBy = null; e.down = .7; e.onGround = false; e.flying = true; }
    const av = dirV({ x:p.x - fx || (p.face > 0 ? -1 : 1), z:p.z - fz });
    p.hp -= dmg; p.stun = .35; p.inv = .7; p.atk = null; styleAdd(L, -45, true); p.vx = av.x * 220; p.vz = av.z * 220; p.dz += dmg; p.sup = Math.min(100, p.sup + dmg * .5);
    p.hitV = { x:-av.x, z:-av.z }; p.hitT3 = .35;
    L.taken += dmg; SFX.hurt(); vib(80); shake = Math.max(shake, 9); spawnParts(L, p.x, p.y - 85, '#ff8080', 10, 'spark', 260, p.z);
    if (p.carry){ dropCarry(L, p); }
    if (o.down){ p.down = .8; p.vy = -240; p.onGround = false; p.fallV = av; }
    if (p.dz >= 45 && p.hp > 0){ p.dz = 0; p.dizzy = 1.5; SFX.dizzy(); floatText(L, p.x, p.y - 150, 'BAŞIN DÖNDÜ! Tuşlara bas!', '#fff176', 20, p.z); }
  }
  if (p.hp <= 0){ p.hp = 0; p.dead = true; p.fallV = p.fallV || dirV({ x:p.x - fx || 1, z:p.z - fz }); SFX.ko(); }
}

/* ---------- fizik: zemin + platform + kutu üstü ---------- */
function surfaces(L){ const s = (L.plats || L.def.platforms || []).slice();
  for (const o of L.objs) if (!o.broken && !o.held && OBJ[o.t].solid) s.push(L.d3 ? { x1:o.x - o.w / 2, x2:o.x + o.w / 2, z1:o.z - o.d / 2, z2:o.z + o.d / 2, y:o.y - o.h, obj:o } : { x1:o.x - o.w / 2, x2:o.x + o.w / 2, y:o.y - o.h, obj:o });
  return s; }
function physics(L, f, dt, surf){
  const prevY = f.y, m = L.d3 ? 16 : 4;
  if (f.dropT > 0) f.dropT -= dt;
  if (f.onGround && f.dropT <= 0){                       // basamaklar: yürüyerek çık / in
    for (const s of surf){ if (s.step && s !== f.plat && f.x >= s.x1 - 2 && f.x <= s.x2 + 2 && inZ(s, f, m) && Math.abs(f.y - s.y) <= 36 && (s.y < f.y - 1 || (f.plat && f.plat.step && (f.x < f.plat.x1 || f.x > f.plat.x2 || !inZ(f.plat, f, m))))){ f.y = s.y; f.plat = s; break; } } }
  if (f.onGround && f.plat && (f.x < f.plat.x1 - m || f.x > f.plat.x2 + m || !inZ(f.plat, f, m) || (f.plat.obj && (f.plat.obj.broken || f.plat.obj.held)))){ f.onGround = false; f.plat = null; }
  if (!f.onGround) f.vy += 2300 * dt;
  f.y += f.vy * dt;
  if (f.vy >= 0 && f.dropT <= 0){
    for (const s of surf){ if (f.x >= s.x1 - m && f.x <= s.x2 + m && inZ(s, f, m) && prevY <= s.y + 1 && f.y >= s.y){ f.y = s.y; f.vy = 0; if (!f.onGround) landed(L, f); f.onGround = true; f.plat = s; break; } }
  }
  if (f.y >= GROUND){ f.y = GROUND; f.vy = 0; if (!f.onGround) landed(L, f); f.onGround = true; f.plat = null; }
}
/* 3B: yüksek yüzeyler (yükseltilmiş platform, kutular) altındakiler için duvar gibidir — dışarı it */
function solidPush(L, f, surf, r = 22){
  if (!L.d3) return null; let hit = null;
  for (const s of surf){ if (s.z1 == null) continue; const rise = f.y - s.y; if (s.step ? rise <= 40 : rise <= 6) continue;
    const ox = Math.min(f.x - (s.x1 - r), (s.x2 + r) - f.x), oz = Math.min(f.z - (s.z1 - r), (s.z2 + r) - f.z); if (ox <= 0 || oz <= 0) continue;
    hit = s; if (ox < oz){ f.x += f.x < (s.x1 + s.x2) / 2 ? -ox : ox; } else { f.z += f.z < (s.z1 + s.z2) / 2 ? -oz : oz; } }
  return hit;
}
function bound3(L, f, r = 22){ if (!L.d3) return false; const z0 = f.z; f.z = clamp(f.z, L.zMin + r, L.zMax - r); return f.z !== z0; }
function landed(L, f){ if (f.flying || f.vy > 600){ spawnParts(L, f.x, f.y - 4, 'rgba(200,190,170,.8)', 8, 'dust', 160, f.z); SFX.land(); } f.flying = false; }

/* ---------- eşyalar ---------- */
function breakObj(L, o, dir = 1){
  if (o.broken) return; o.broken = true; const D = OBJ[o.t]; (SFX[D.sfx] || SFX.wood)(); shake = Math.max(shake, 4);
  spawnParts(L, o.x, o.y - o.h / 2, D.col, 16, o.t === 'sise' ? 'glass' : 'chip', 300, o.z); o.brokeT = 0;
  if (L.d3 && o.t !== 'sise'){ const dv = dirV(dir), n = o.t === 'dolap' ? 8 : o.t === 'koli' ? 5 : 7; L.debris = L.debris || [];      // 3B kırık parçalar
    for (let i = 0; i < n; i++){ const pw = o.w * rand(.25, .6), ph = o.t === 'varil' || o.t === 'cop' ? o.h * rand(.25, .45) : o.h * rand(.08, .16);
      L.debris.push({ x:o.x + rand(-o.w / 3, o.w / 3), y:o.y - rand(8, o.h * .8), z:o.z + rand(-o.d / 3, o.d / 3), vx:dv.x * rand(60, 240) + rand(-130, 130), vz:dv.z * rand(60, 240) + rand(-130, 130), vy:-rand(260, 560),
        rx:rand(0, 6), ry:rand(0, 6), wr:rand(-9, 9), w:pw, h:ph, d:o.d * rand(.15, .4), col:o.t === 'kutu' ? '#a0723f' : o.t === 'koli' ? '#c9a26b' : D.col, life:3.2 }); }
    if (L.debris.length > 56) L.debris.splice(0, L.debris.length - 56); }
  L.score += 30;
  const r = Math.random(), at = { x:o.x, y:o.y, z:o.z };
  if (o.drop){ if (o.drop === 'hp') L.pickups.push(Object.assign({ kind:'hp', t:0 }, at)); else L.pickups.push(Object.assign({ kind:'weapon', w:o.drop, uses:WEAPONS[o.drop].uses, t:0 }, at)); }
  else if (o.t === 'dolap'){ if (r < .45) L.pickups.push(Object.assign({ kind:'weapon', w:'boru', uses:WEAPONS.boru.uses, t:0 }, at)); else if (r < .8) L.pickups.push(Object.assign({ kind:'hp', t:0 }, at)); }
  else if (o.t === 'kutu' || o.t === 'koli'){ if (r < .25) L.pickups.push(Object.assign({ kind:'hp', t:0 }, at)); else if (r < .4) L.pickups.push(Object.assign({ kind:'weapon', w:'sopa', uses:WEAPONS.sopa.uses, t:0 }, at)); }
}
/* (cx, cz) çevresinde r yarıçapta, yy yüksekliğindeki eşyalara vur */
function hitObjsNear(L, cx, cz, r, yy, dmg, dir){ for (const o of L.objs){ if (o.broken || o.held) continue; if (boxDist(o, cx, L.d3 ? cz : o.z) < r && yy > o.y - o.h - 30 && yy < o.y + 30){ o.hp -= dmg; o.shakeT = .25;
    if (o.hp <= 0) breakObj(L, o, dir); else { const D = OBJ[o.t]; (SFX[D.sfx] || SFX.wood)(); spawnParts(L, o.x, o.y - o.h * .6, D.col, 5, o.t === 'sise' ? 'glass' : 'chip', 220, o.z); if (L.d3) floatText(L, o.x, o.y - o.h - 20, 'ÇAT!', '#ffcc66', 18, o.z); } } } }
function hitObjects(L, x1, x2, y, dmg, dir){ hitObjsNear(L, (x1 + x2) / 2, L.p ? L.p.z : 0, (x2 - x1) / 2, y, dmg, dir); }
function dropCarry(L, p){ const o = p.carry; if (!o) return; const F = fwdOf(p); o.held = false; o.x = p.x + F.x * 30; o.z = (p.z || 0) + F.z * 30; o.y = p.plat ? p.plat.y : GROUND; p.carry = null; }
function throwThing(L, p, kind, extra){
  const y0 = p.y - 120, F = fwdOf(p);
  L.proj.push(Object.assign({ x:p.x + F.x * 20, z:p.z + F.z * 20, y:y0, vx:F.x * 720, vz:F.z * 720, vy:-120, life:1.4, owner:'p', spin:0, hit:new Set() }, extra, { kind }));
  SFX.throwIt(); p.atk = { m:{ dur:.3, a:1, b:0, anim:'throw' }, t:0, hit:new Set() };
}

/* ---------- oyuncu ---------- */
/* 3B'de hedef yardımı: yakındaki düşmana dön (joystick yönü öncelikli) */
function aimAssist(L, p, IN){
  if (!L.d3) return null;
  const hint = IN && IN.m > .25 ? Math.atan2(-IN.z, IN.x) : p.yaw;
  let best = null, bs = 1e9;
  for (const e of L.ents){ if (e.dead || e.ent || e.grabbedBy || (e.down > 0 && !e.dummy) || !sameLevel(e, p)) continue; const d = pdist(e, p); if (d > 210) continue;
    const a = Math.atan2(-(e.z - p.z), e.x - p.x), da = Math.abs(Math.atan2(Math.sin(a - hint), Math.cos(a - hint)));
    if (da > 1.45 && d > 95) continue; const s = d + da * 90; if (s < bs){ bs = s; best = e; } }
  if (best) faceTo(p, best.x, best.z); return best;
}
function playerAttack(L, p, m, extra = {}){
  p.atk = Object.assign({ m, t:0, hit:new Set(), done:false }, extra); SFX.whiff();
  if (p.mk === 'ufis'){ if (Math.random() < .8) grunt('ufis', m.anim === 'spin' || m.down ? 'a' : pick(['u', 'a', 'u']), m.heavy || m.down ? .24 : .14); }
  else if (Math.random() < .35) grunt('issem', pick(['a', 'e']), .12, .8);
  for (const e of L.ents){ if (!e.T || !e.T.dodge || e.dead || e.ent || e.wind > 0 || e.strike > 0 || e.dashing > 0 || e.stun > 0 || e.dizzy > 0 || e.down > 0) continue;
    if (pdist(e, p) < 130 && Math.random() < e.T.dodge * DIFF().aggr * .85){ const av = awayV(e, p); e.hop = .28; e.vx = av.x * 470; e.vz = av.z * 470; e.inv = .32; } }
}
/* hareket girdisi: 2D'de yalnız x; 3B'de kameraya göre (ileri = kameranın baktığı yön) */
function moveIn(L){
  if (L.botDir) return L.botDir;
  let ix = JOY.x || 0, iy = JOY.y || 0;
  if (Math.abs(ix) < .05) ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (!L.d3){ return { x:Math.abs(ix) > .35 ? Math.sign(ix) : 0, z:0, m:Math.abs(ix) > .35 ? 1 : 0 }; }
  const m = Math.min(1, Math.hypot(ix, iy)); if (m < .18) return { x:0, z:0, m:0 };
  const cy = L.c3 ? L.c3.yaw : 0, Fx = Math.cos(cy), Fz = -Math.sin(cy), Rx = -Fz, Rz = Fx;
  const wx = Rx * ix - Fx * iy, wz = Rz * ix - Fz * iy, l = Math.hypot(wx, wz) || 1, k = clamp((m - .18) / .62, 0, 1);
  return { x:wx / l * k, z:wz / l * k, m:k };
}
const ladZ = (L, pl) => pl.z1 != null && pl.z1 > -1e8 ? (pl.z1 + pl.z2) / 2 : 0;
const ladX = pl => (pl.ladderX || pl.x1 - 26) + 11;
function updPlayer(L, dt, surf){
  const p = L.p, def = L.def, MV = MOVES[p.mk], d3 = L.d3;
  if (keys.block && !p.blkWas) p.blockAt = gameTime; p.blkWas = !!keys.block;
  p.animT += dt; if (p.inv > 0) p.inv -= dt; if (p.cd > 0) p.cd -= dt; if (p.slideCd > 0) p.slideCd -= dt; p.dz = Math.max(0, p.dz - dt * 8);
  if (p.hitT3 > 0) p.hitT3 -= dt; if (p.blockT3 > 0) p.blockT3 -= dt;
  const IN = moveIn(L); p.inM = IN.m;
  if (p.climb){ const pl = p.climb, lx = ladX(pl), lz = ladZ(L, pl);
    if (p.stun > 0 || p.down > 0 || p.dead) p.climb = null;
    else { p.vx = 0; p.vz = 0; p.vy = 0; p.onGround = false; p.plat = null; p.atk = null; p.x = lerp(p.x, lx, Math.min(1, dt * 12)); if (d3){ p.z = lerp(p.z, lz, Math.min(1, dt * 12)); faceSign(p, 1); } p.y -= 270 * dt;
      if (p.y <= pl.y){ p.y = pl.y; p.x = pl.x1 + 20; faceSign(p, 1); p.onGround = true; p.plat = pl; p.climb = null; SFX.land(); } return; } }
  if (!p.climb && p.onGround && !p.plat && !p.carry && !p.dead && p.down <= 0){
    let lad = null;
    if (d3){ for (const pl of L.plats || []){ if (pl.ladder === false || pl.step) continue; const dx = ladX(pl) - p.x, dz = ladZ(L, pl) - p.z, d = Math.hypot(dx, dz);
        if (d < 46 && (keys.up || (IN.m > .3 && (dx * IN.x + dz * IN.z) / (d || 1) / IN.m > .35) || d < 16)){ lad = pl; break; } } }
    else if (keys.up) lad = (L.plats || []).find(pl => pl.ladder !== false && Math.abs(p.x - ladX(pl)) < 30);
    if (lad){ p.climb = lad; pressedAt.jump = null; SFX.metal(); return; } }
  const spd = Math.hypot(p.vx, p.vz || 0);
  if (p.onGround && spd > 120 && !p.dead){ p.stepT = (p.stepT || 0) - dt; if (p.stepT <= 0){ SFX.step(); p.stepT = spd > 240 ? .26 : .36; } }
  const F = fwdOf(p);
  if (p.dead){ damp2(p, .9); }
  else if (p.down > 0){ p.down -= dt; damp2(p, Math.pow(.05, dt)); if (p.down <= 0){ p.getup = .3; p.inv = .6; } }
  else if (p.getup > 0){ p.getup -= dt; p.vx = 0; p.vz = 0; }
  else if (p.dizzy > 0){ p.dizzy -= dt; damp2(p, .8); for (const k of ['punch', 'kick', 'block', 'slide', 'grab', 'jump']) if (took(k)) p.dizzy -= .18; }
  else if (p.stun > 0){ p.stun -= dt; damp2(p, Math.pow(.01, dt)); p.blocking = false; }
  else if (p.slideT > 0){ p.slideT -= dt; const S = p.slideV || F, sv = 560 * Math.min(1, p.slideT * 4 + .3); p.vx = S.x * sv; p.vz = S.z * sv;
    for (const e of L.ents){ if (e.dead || p.atkHit && p.atkHit.has(e) || !sameLevel(e, p)) continue; if (Math.hypot(e.x - (p.x + S.x * 30), (e.z || 0) - (p.z + S.z * 30)) < (d3 ? 40 : 34)){ (p.atkHit = p.atkHit || new Set()).add(e); hitEnemy(L, e, 10, 260, S, { down:true, heavy:true }); } }
    hitObjsNear(L, p.x + S.x * 10, p.z + S.z * 10, 22, p.y, 8, S);
    if (p.slideT <= 0){ p.atkHit = null; p.vx = 0; p.vz = 0; } }
  else if (p.atk){
    const a = p.atk, m = a.m; a.t += dt;
    if (m.special === 'finisher'){ finisherTick(L, p, a, dt); }
    else if (m.special === 'dragon'){ p.vx = F.x * 520; p.vz = F.z * 520; p.inv = .1;
      for (const e of L.ents){ if (e.dead || a.hit.has(e) || !sameLevel(e, p)) continue; if (pdist(e, p) < 70){ a.hit.add(e); hitEnemy(L, e, 24, 520, awayV(e, p), { down:true, heavy:true, super:true }); } }
      hitObjsNear(L, p.x, p.z, 60, p.y, 30, F); }
    else if (m.ball){ if (!a.done && a.t >= m.a){ a.done = true; const fire = !!m.fire, v = fire ? (m.fast ? 1350 : 900) : 840;
        L.proj.push({ kind:fire ? 'fire' : 'ball', x:p.x + F.x * 30, z:p.z + F.z * 30, y:p.y - (fire ? 60 : 14), vx:F.x * v, vz:F.z * v, vy:fire ? 0 : -150, life:1.4, owner:'p', spin:0, hit:new Set(), dmg:fire ? (m.fast ? 34 : 28) : 14, pierce:fire, down:fire }); fire ? SFX.fire() : SFX.shoot(); vib(15); hitObjsNear(L, p.x + F.x * 40, p.z + F.z * 40, 38, p.y - 20, 12, F); } }
    else if (a.t >= m.a && a.t <= m.b){
      const reach = m.range;
      for (const e of L.ents){ if (e.dead || a.hit.has(e)) continue;
        const R = relTo(p, e), big = e.T && e.T.big ? 14 : 0;
        if (R.along > -14 && R.along < reach + big && R.side < 46 + big && Math.abs(e.y - p.y) < (a.air ? 110 : 70)){ a.hit.add(e);
          if (e.inv > 0) continue;
          if (e.T && e.T.shield && relTo(e, p).along > 0 && relTo(e, p).side < relTo(e, p).along * 1.2 && !(m.anim === 'kick' || m.heavy || m.anim === 'swing') && e.stun <= 0 && e.dizzy <= 0){
            SFX.block(); spawnParts(L, e.x - F.x * 18, e.y - 80, '#9ad7ff', 8, 'spark', 260, e.z - F.z * 18); p.vx = -F.x * 160; p.vz = -F.z * 160; floatText(L, e.x, e.y - 140, 'KALKAN!', '#9ad7ff', undefined, e.z); e.blockT3 = .25;
            if (!L.shieldHint){ L.shieldHint = true; L.hint = 'Kalkanlıya 🦵 tekme, 💨 kayarak tekme ya da silah!'; L.hintT = 5; } continue; }
          hitEnemy(L, e, Math.round(m.dmg * (p.mk === 'issem' ? .85 + PST('guc') * .4 : 1)), m.kb, d3 ? awayV(e, p) : p.face, { heavy:m.heavy, down:m.down, launch:m.launch });
          if (m.anim === 'swing' && p.weapon){ p.weapon.uses--; (SFX[WEAPONS[p.weapon.t].sfx] || SFX.wood)(); if (p.weapon.uses <= 0){ if (p.weapon.t === 'sise') spawnParts(L, e.x, e.y - 90, '#2e8b57', 10, 'glass', 260, e.z); floatText(L, p.x, p.y - 150, 'Kırıldı!', '#ffffff', undefined, p.z); p.weapon = null; } } } }
      if (!a.objHit){ a.objHit = true; hitObjsNear(L, p.x + F.x * reach * .5, p.z + F.z * reach * .5, reach * .55, p.y - (m.low ? 0 : 40), m.dmg, F); } }
    if (p.onGround && !m.special) damp2(p, Math.pow(.001, dt));
    if (a.t >= m.dur){ p.atk = null; p.lastAtkEnd = gameTime; }
  } else {
    p.crouch = !d3 && !!keys.down && p.onGround && !p.carry;
    p.blocking = !!keys.block && p.onGround && !p.carry;
    if (p.blocking){ p.vx = 0; p.vz = 0;
      if (d3 && !p.weapon && !p.carryE){ if (took('punch')){ aimAssist(L, p, IN); p.blocking = false; playerAttack(L, p, MV.upper); } else if (took('kick')){ aimAssist(L, p, IN); p.blocking = false; playerAttack(L, p, MV.sweep); } } }
    else {
      const sp = (p.carry ? (OBJ[p.carry.t].heavy ? 150 : 200) : p.crouch ? 110 : 275) * (p.mk === 'issem' ? .9 + PST('hiz') * .25 : 1);
      if (d3){ p.vx = IN.x * sp; p.vz = IN.z * sp; if (IN.m > .15) turnTo(p, Math.atan2(-IN.z, IN.x), dt * 16); }
      else { const mv = IN.x; p.vx = mv * sp; p.vz = 0; if (mv) faceSign(p, mv); }
      if (took('jump') && p.onGround){
        if (!d3 && keys.down && p.plat && !p.plat.obj){ p.dropT = .3; p.onGround = false; p.plat = null; p.y += 2; }
        else { p.vy = -860; p.onGround = false; p.plat = null; L.jumped = true; SFX.jump(); } }
      if (took('grab')) grabAction(L, p);
      else if (took('super') && p.sup >= 100 && !p.carry){ aimAssist(L, p, IN); superMove(L, p); }
      else if (took('slide') && p.onGround && p.slideCd <= 0 && !p.carry){ p.slideT = .38; p.slideCd = .7; p.slideV = d3 && IN.m > .2 ? dirV(IN) : fwdOf(p); if (d3) setYaw(p, Math.atan2(-p.slideV.z, p.slideV.x)); SFX.slide(); }
      else if (took('punch')){
        if (p.carry) grabAction(L, p);
        else if (p.weapon){ aimAssist(L, p, IN); const W2 = WEAPONS[p.weapon.t]; playerAttack(L, p, { dur:W2.dur, a:W2.dur * .3, b:W2.dur * .62, range:W2.range, dmg:W2.dmg, kb:W2.kb, anim:'swing', heavy:true, down:p.weapon.t !== 'sise' && Math.random() < .5 }); }
        else if (p.carryE) throwEnemy(L, p);
        else if (!p.onGround){ aimAssist(L, p, IN); playerAttack(L, p, MV.air, { air:true }); }
        else if (p.crouch){ playerAttack(L, p, MV.upper); p.crouch = false; }
        else { const chain = MV.punch; p.combo = (gameTime - p.lastAtkEnd < .38 && p.lastType === 'punch') ? (p.combo + 1) % chain.length : 0; p.lastType = 'punch';
          aimAssist(L, p, IN); playerAttack(L, p, chain[p.combo], { combo:p.combo }); } }
      else if (took('kick') && !p.carry){
        p.lastType = 'kick'; const fin = p.onGround && finTarget(L, p);
        if (fin) startFinisher(L, p, fin);
        else if (!p.onGround){ aimAssist(L, p, IN); playerAttack(L, p, MV.air, { air:true }); }
        else if (p.crouch) playerAttack(L, p, MV.sweep);
        else if (Math.hypot(p.vx, p.vz) > 150 && p.onGround){ aimAssist(L, p, IN); const F2 = fwdOf(p); p.vy = -430; p.onGround = false; p.plat = null; p.vx = F2.x * 520; p.vz = F2.z * 520; playerAttack(L, p, MV.fly); p.flyK = .5; }
        else if (p.mk === 'issem' && p.cd <= 0){ aimAssist(L, p, IN); p.cd = MV.ball.cd; playerAttack(L, p, MV.ball); }
        else { aimAssist(L, p, IN); playerAttack(L, p, MV.kick); } }
    }
  }
  physics(L, p, dt, surf);
  move2(p, dt);
  p.x = clamp(p.x, L.lockL + 28, Math.min(L.lockR - 28, def.maxX || (def.width || W) - 28));
  if (d3){ bound3(L, p, 24); solidPush(L, p, surf); }
  if (p.carry){ p.carry.x = p.x; p.carry.z = p.z; p.carry.y = p.y - 140; }
}
function grabAction(L, p){
  if (p.carry){ const o = p.carry; p.carry = null; o.held = false; o.broken = true; throwThing(L, p, 'obj', { obj:o.t, dmg:OBJ[o.t].tdmg, down:true }); return; }
  if (p.weapon){ const w = p.weapon; p.weapon = null; aimAssist(L, p, null); throwThing(L, p, 'weapon', { w:w.t, dmg:14, down:w.t !== 'sise' }); return; }
  if (p.carryE){ throwEnemy(L, p); return; }
  for (const e of L.ents){ if (e.dead || e.ent || e.dummy || (e.T && (e.T.boss || e.T.big)) || e.grabbedBy || !e.T) continue;
    if (pdist(e, p) < 72 && Math.abs(e.y - p.y) < 30 && (e.dizzy > 0 || e.stun > 0 || e.hp < e.maxhp * .35)){
      e.grabbedBy = p; p.carryE = e; e.dizzy = 0; e.stun = 0; e.wind = 0; e.strike = 0; e.atk = null; faceTo(p, e.x, e.z); SFX.grab(); floatText(L, p.x, p.y - 190, 'KALDIR!', '#f2c230', 24, p.z);
      if (!L.liftHint){ L.liftHint = true; L.hint = 'Düşmanı kaldırdın! 👊 ya da ✋ ile fırlat — diğerlerine çarpsın!'; L.hintT = 4; } return; } }
  let best = null, bd = 60;
  for (const k of L.pickups){ const d = pdist(k, p); if (k.kind === 'weapon' && d < bd && Math.abs(k.y - p.y) < 40){ best = { k }; bd = d; } }
  for (const o of L.objs){ if (o.broken || o.held) continue; const D = OBJ[o.t], d = L.d3 ? boxDist(o, p.x, p.z) + 20 : Math.abs(o.x - p.x); if ((D.carry || D.weapon) && d < bd && Math.abs(o.y - p.y) < 40){ best = { o }; bd = d; } }
  if (!best){ floatText(L, p.x, p.y - 150, 'Yakında alınacak bir şey yok', '#ffffff', 16, p.z); return; }
  if (best.k){ const k = best.k; k.got = true; p.weapon = { t:k.w, uses:k.uses }; SFX.grab(); floatText(L, p.x, p.y - 150, k.w.toUpperCase() + '!', '#f2c230', undefined, p.z); }
  else { const o = best.o; if (OBJ[o.t].weapon){ o.broken = true; p.weapon = { t:OBJ[o.t].weapon, uses:1 }; SFX.grab(); }
    else { o.held = true; p.carry = o; SFX.grab(); if (!L.carryHint){ L.carryHint = true; L.hint = 'Fırlatmak için ✋ ya da 👊 bas!'; L.hintT = 3.5; } } }
}
function throwEnemy(L, p){
  const e = p.carryE; if (!e) return; p.carryE = null; e.grabbedBy = null; aimAssist(L, p, null); const F = fwdOf(p);
  e.x = p.x + F.x * 30; e.z = p.z + F.z * 30; e.y = p.y - 110; e.vx = F.x * 760; e.vz = F.z * 760; e.vy = -300; e.onGround = false; e.flying = true; e.thrown = true; e.down = 1.2; setYaw(e, p.yaw + Math.PI); e.fallV = F;
  e.hp -= 16; SFX.throwIt(); shake = 6; hitstop = .06; p.atk = { m:{ dur:.32, a:1, b:0, anim:'throw' }, t:0, hit:new Set() }; floatText(L, e.x, e.y - 60, 'FIRLAT!', '#ff9a3a', 28, e.z);
  if (e.hp <= 0) killEnemy(L, e, F);
}
function superMove(L, p){
  p.sup = 0; SFX.superOn(); FX.flash = .5; hitstop = .25; vib([60, 40, 120]);
  const sm = p.mk === 'issem' ? playerProfile().sup : 'ejder';
  const name = { ates:'ATEŞ ŞUTU!', yildirim:'YILDIRIM ŞUTU!', kasirga:'KASIRGA TEKMESİ!', ejder:'EJDER TEKMESİ!' }[sm] || 'ATEŞ ŞUTU!';
  L.superBanner = { t:1.4, name, kind:p.kind }; say(name.replace('!', ''), p.mk === 'issem' ? 'Issem' : 'Ufis');
  if (sm === 'yildirim'){ FX.flash = .8; playerAttack(L, p, { dur:.42, a:.2, anim:'shoot', ball:true, fire:true, fast:true }); }
  else if (sm === 'kasirga') playerAttack(L, p, { dur:.62, a:0, b:.62, anim:'spin', special:'dragon' });
  else if (p.mk === 'issem') playerAttack(L, p, { dur:.5, a:.25, anim:'shoot', ball:true, fire:true });
  else playerAttack(L, p, { dur:.62, a:0, b:.62, anim:'spin', special:'dragon' });
}

/* ---------- düşman ---------- */
function updEnemy(L, e, dt, surf){
  const d3 = L.d3;
  if (e.grabbedBy){ const p = e.grabbedBy; e.animT += dt;
    if (p.dead || p.down > 0 || p.stun > 0 || L.p !== p || e.dead){ e.grabbedBy = null; p.carryE = null; e.down = .8; e.vy = -120; e.onGround = false; e.flying = true; return; }
    const F = fwdOf(p); e.x = p.x - F.x * 6; e.z = p.z - F.z * 6; e.y = p.y - 132; e.vx = 0; e.vz = 0; e.vy = 0; e.onGround = false; setYaw(e, p.yaw); return; }
  if (e.ent){ e.animT += dt; entStep(L, e, dt); return; }
  e.animT += dt; if (e.flash > 0) e.flash -= dt; if (e.inv > 0) e.inv -= dt; if (e.hitT > 0) e.hitT -= dt; if (e.armorT > 0) e.armorT -= dt; if (e.jumpCd > 0) e.jumpCd -= dt;
  if (e.hitT3 > 0) e.hitT3 -= dt; if (e.blockT3 > 0) e.blockT3 -= dt;
  e.dz = Math.max(0, e.dz - dt * 6);
  if (e.dummy){ e.wv += (-e.wob * 140 - e.wv * 7) * dt; e.wob += e.wv * dt; if (e.dead) e.fall = Math.min(1.45, e.fall + dt * 4); return; }
  if (e.dead){ e.deadT += dt; physics(L, e, dt, surf); move2(e, dt); if (e.onGround) damp2(e, Math.pow(.02, dt)); if (d3 && bound3(L, e)) damp2(e, .3); return; }
  if (L.frozen){ faceTo(e, L.p.x, L.p.z); physics(L, e, dt, surf); return; }
  if (L.finT > 0 && e !== L.finE){ e.animT -= dt * .7; physics(L, e, dt, surf); return; }
  const p = L.p, T = e.T, D = DIFF(), dx = p.x - e.x, dz = (p.z || 0) - (e.z || 0), dist = Math.hypot(dx, dz), F = fwdOf(e);
  if (e.flying && Math.hypot(e.vx, e.vz) > 200){ for (const o of L.objs){ if (!o.broken && !o.held && boxDist(o, e.x, d3 ? e.z : o.z) < 10 && Math.abs(o.y - e.y) < 60){ breakObj(L, o, dirV({ x:e.vx, z:e.vz })); e.hp -= 6; floatText(L, e.x, e.y - 120, 'ÇAT!', '#ffcc66', 22, e.z); if (e.hp <= 0 && !e.dead) killEnemy(L, e, { x:e.vx, z:e.vz }); } } }
  if (T.summon && !e.summoned && e.hp < e.maxhp * .5){ e.summoned = true; floatText(L, e.x, e.y - 170, 'ADAMLARIM!', '#ff5a5a', 34, e.z); SFX.alarm();
    const s1 = makeEnemy('masked', L.camX - 40, { weapon:'sopa', z:rz(L) }), s2 = makeEnemy('masked', L.camX + W + 40, { z:rz(L) }); L.ents.push(s1, s2); sendIn(L, s1); sendIn(L, s2); }
  if (e.down > 0){ e.down -= dt; move2(e, dt); if (e.onGround) damp2(e, Math.pow(.02, dt)); if (e.down <= 0){ e.getup = .35; e.inv = .5; } }
  else if (e.getup > 0){ e.getup -= dt; }
  else if (e.dizzy > 0){ e.dizzy -= dt; e.vx = 0; e.vz = 0; }
  else if (e.stun > 0){ e.stun -= dt; move2(e, dt); damp2(e, Math.pow(.02, dt)); }
  else if (e.hop > 0){ e.hop -= dt; move2(e, dt); damp2(e, Math.pow(.05, dt)); }
  else if (e.dashing > 0){ e.dashing -= dt; move2(e, dt);
    if (!e.dashHit && pdist(p, e) < 42 && sameLevel(p, e)){ e.dashHit = true; const hb = p.hp; hurtPlayer(L, T.dmg * 1.2, { x:e.x - F.x * 30, z:e.z - F.z * 30 }, { down:true, src:e }); if (T.rush && p.hp >= hb) e.dodgedBy = true; }
    const wall = e.x <= L.lockL + 24 || e.x >= L.lockR - 24 || (d3 && (e.z <= L.zMin + 26 || e.z >= L.zMax - 26 || solidPush(L, e, surf, 24)));
    if (T.rush && wall && e.dashing > 0){ e.dashing = 0; e.vx = -F.x * 120; e.vz = -F.z * 120; e.dizzy = 1.8; shake = 10; SFX.wallSlam(); floatText(L, e.x, e.y - 150, 'DUVARA!', '#ffcc66', 26, e.z); }
    if (e.dashing <= 0){ e.vx = 0; e.vz = 0; e.cd = rand(.6, 1.1) / D.aggr; if (T.rush && (!e.dashHit || e.dodgedBy) && e.dizzy <= 0){ e.dizzy = 1.3; floatText(L, e.x, e.y - 150, 'NEFES NEFESE!', '#fff176', 20, e.z); } e.dodgedBy = false; } }
  else if (e.leaping > 0){ e.leaping -= dt; move2(e, dt);
    if (!e.leapHit && pdist(p, e) < 52 && Math.abs(p.y - e.y) < 95 && !e.onGround){ e.leapHit = true; hurtPlayer(L, T.dmg * 1.15, e, { down:!!T.kick, src:e }); }
    if ((e.onGround && e.leaping < .45) || e.leaping <= 0){ e.leaping = 0; e.vx = 0; e.vz = 0; e.cd = rand(.8, 1.4) / D.aggr; } }
  else if (e.picking > 0){ e.picking -= dt; if (e.picking <= 0 && e.pickTarget && !e.pickTarget.got){ e.pickTarget.got = true; e.weapon = { t:e.pickTarget.w, uses:e.pickTarget.uses }; SFX.grab(); } }
  else if (e.wind > 0){ e.wind -= dt;
    if (d3 && (e.move === 'hit' || e.move === 'rush' || e.move === 'dash') && e.wind > .14) turnTo(e, Math.atan2(-dz, dx), dt * (e.move === 'hit' ? 7 : 12));
    if (e.wind <= 0){ const F2 = fwdOf(e);
      if (e.move === 'leap'){ const tt = .5, d2 = Math.max(40, dist - 30); e.leaping = .8; e.vy = -600; e.onGround = false; e.plat = null; faceTo(e, p.x, p.z); e.vx = dx / (dist || 1) * d2 / tt; e.vz = dz / (dist || 1) * d2 / tt; e.leapHit = false; SFX.jump(); grunt('enemy', 'a', .25, 1); }
      else if (e.move === 'dash'){ e.dashing = .42; e.vx = F2.x * 760; e.vz = F2.z * 760; e.dashHit = false; SFX.dash(); }
      else if (e.move === 'rush'){ e.dashing = .75; e.vx = F2.x * 640; e.vz = F2.z * 640; e.dashHit = false; SFX.dash(); grunt('enemy', 'a', .3, 1); }
      else if (e.move === 'slam'){ e.strike = .35; shake = 12; SFX.slam(); vib(120); L.shocks.push({ x:e.x, z:e.z, y:e.y, r:0, dir:1, life:1.1, hit:false, dmg:T.dmg * .85 }); }
      else { e.strike = .2; SFX.whiff();
        const wp = e.weapon ? WEAPONS[e.weapon.t] : null, range = wp ? wp.range - 10 : T.range, R = relTo(e, p);
        if (dist < range + 20 && R.along > 0 && R.side < (d3 ? 52 : 1e9) && sameLevel(p, e)){
          hurtPlayer(L, wp ? T.dmg + 5 : T.dmg, e, { high:!T.kick && !wp, down:!!(wp && e.weapon.t === 'boru'), src:e });
          if (wp && p.inv > .5){ (SFX[wp.sfx] || SFX.wood)(); e.weapon.uses--; if (e.weapon.uses <= 0){ e.weapon = null; } } } } } }
  else if (e.strike > 0){ e.strike -= dt;
    if (e.strike <= 0){ if (T.combo && e.move === 'hit' && e.comboN < T.combo - 1 && dist < T.range + 30){ e.comboN++; e.wind = T.windT * .55; faceTo(e, p.x, p.z); }
      else { e.comboN = 0; e.cd = rand(.9, 1.7) * (T.boss ? .6 : 1) * (T.big ? 1.15 : 1) / D.aggr; } } }
  else {
    faceTo(e, p.x, p.z); e.cd -= dt;
    const range = e.weapon ? WEAPONS[e.weapon.t].range - 12 : T.range;
    // kat değiştirme
    const dy = p.y - e.y;
    if (Math.abs(dy) > 46 && e.onGround && e.jumpCd <= 0 && !p.dead){
      if (dy < 0){ const target = surf.find(s => p.x >= s.x1 - 4 && p.x <= s.x2 + 4 && inZ(s, p, 6) && Math.abs(s.y - p.y) < 6);
        if (target && e.x > target.x1 - 30 && e.x < target.x2 + 30 && (!d3 || (e.z > target.z1 - 48 && e.z < target.z2 + 48)) && e.y - target.y < 170){ e.vy = -880; e.onGround = false; e.plat = null; e.jumpCd = 1.2; e.jumpTo = target; } }
      else if (!d3 && e.plat && !e.plat.obj){ e.dropT = .3; e.onGround = false; e.plat = null; e.y += 2; e.jumpCd = .8; } }
    if (e.onGround) e.jumpTo = null;
    // yerdeki silahı al
    if (!e.weapon && !T.boss && !T.shield){ const k = L.pickups.find(k => k.kind === 'weapon' && !k.got && pdist(k, e) < 34 && Math.abs(k.y - e.y) < 30); if (k){ e.picking = .35; e.pickTarget = k; e.vx = 0; e.vz = 0; return; } }
    const attacking = L.ents.filter(o => !o.dead && (o.wind > 0 || o.strike > 0 || o.dashing > 0)).length;
    if (d3){
      /* 3B: oyuncunun etrafını sar — sırası gelen yaklaşır, diğerleri bir adım geride çember çizer */
      const ready = e.cd < .45 && (attacking < D.maxAtk || T.boss), want = ready ? range * .85 : range + 78 + (T.big ? 26 : 0);
      const ux = dist > 1 ? dx / dist : 1, uz = dist > 1 ? dz / dist : 0;
      let vx = 0, vz = 0;
      if (e.jumpTo){ const t = e.jumpTo, tx = clamp(p.x, t.x1 + 20, t.x2 - 20), tz = clamp(p.z, t.z1 + 20, t.z2 - 20), l = Math.hypot(tx - e.x, tz - e.z) || 1; vx = (tx - e.x) / l * 260; vz = (tz - e.z) / l * 260; }
      else {
        const spd = dist > want + 170 && !T.boss ? Math.min(T.speed * 2.1, 330) : T.speed;       // uzaktaysa koşar
        if (dist > want + 12) { const k = Math.min(1, (dist - want) / 60); vx = ux * spd * k; vz = uz * spd * k; }
        else if (dist < want - 30){ vx = -ux * T.speed * .55; vz = -uz * T.speed * .55; }
        if (!ready && Math.abs(dist - want) < 60){ e.strafeT -= dt; if (e.strafeT <= 0){ e.strafe = -e.strafe; e.strafeT = rand(1.2, 3); } vx += -uz * e.strafe * T.speed * .42; vz += ux * e.strafe * T.speed * .42; }
        for (const o of L.ents){ if (o === e || o.dead || o.dummy || !sameLevel(o, e)) continue; const ox = e.x - o.x, oz = e.z - o.z, od = Math.hypot(ox, oz); if (od < 58 && od > .01){ const k = (58 - od) / 58 * 140; vx += ox / od * k; vz += oz / od * k; } }
      }
      e.vx = vx; e.vz = vz; move2(e, dt);
    } else {
      e.vx = dist > range ? e.face * T.speed : 0; e.vz = 0;
      for (const o of L.ents){ if (o !== e && !o.dead && !o.dummy && sameLevel(o, e)){ const d = e.x - o.x; if (Math.abs(d) < 40) e.vx += (d >= 0 ? 1 : -1) * 90; } }
      e.x += e.vx * dt;
    }
    if (e.cd <= 0 && !p.dead && sameLevel(p, e) && !e.jumpTo){
      if (Math.random() < .3) grunt(T.boss ? 'boss' : 'enemy', 'e', .12, .7);
      if (T.rush && dist > 150 && dist < 560 && Math.random() < .7){ e.move = 'rush'; e.wind = .8 / Math.sqrt(D.aggr); e.vx = 0; e.vz = 0; floatText(L, e.x, e.y - 160, '!', '#ff3b3b', 40, e.z); }
      else if (d3 && T.leap && e.onGround && dist > 140 && dist < 270 && Math.random() < .3){ e.move = 'leap'; e.wind = .42 / Math.sqrt(D.aggr); e.vx = 0; e.vz = 0; }
      else if (T.dash && dist > 230 && Math.random() < .6){ e.move = 'dash'; e.wind = .55 / Math.sqrt(D.aggr); e.vx = 0; e.vz = 0; }
      else if (T.slam && dist < 300 && Math.random() < (T.boss ? .35 : .2)){ e.move = 'slam'; e.wind = .8 / Math.sqrt(D.aggr); e.vx = 0; e.vz = 0; }
      else if (dist <= range + 8 && (attacking < D.maxAtk || T.boss)){ e.move = 'hit'; e.wind = (T.windT + (e.weapon ? .1 : 0)) / Math.sqrt(D.aggr) * (d3 ? 1.12 : 1); e.vx = 0; e.vz = 0; }
    }
  }
  physics(L, e, dt, surf);
  if (e.x > L.lockL + 20 && e.x < L.lockR - 20) e.inside = true;
  if (e.inside) e.x = clamp(e.x, L.lockL + 20, L.lockR - 20);
  if (d3){ bound3(L, e); const hs = solidPush(L, e, surf);
    if (hs && e.onGround && e.jumpCd <= 0 && !T.big && !T.boss && e.y - hs.y < 135 && Math.hypot(e.vx, e.vz) > 50 && !(e.wind > 0 || e.strike > 0)){ e.vy = -760; e.onGround = false; e.plat = null; e.jumpCd = 1.1; SFX.jump(); } }   // önüne engel çıkarsa üstünden zıpla
}

/* =========================================================
   GİRİŞLER (3B): düşmanlar duvardan geçmez — kapıdan / merdivenle yukarıdan / kapaktan alttan / atlayarak / koşarak gelir
   entPath: bir girişin t saniyedeki konumu ve pozu (düşman da bölüme giren oyuncu da aynı yolu izler)
   ========================================================= */
function entPath(L, E, t, side = 0, face){
  const r = { x:E.x, y:E.y || GROUND, z:E.z, yaw:-Math.PI / 2, vis:t >= 0, open:0, vx:0, vz:0, vy:0, air:false, climb:false, roll:0, dive:0, done:false };
  if (t < 0){ r.vis = false; r.z = E.k === 'hatch' ? E.z : E.k === 'run' ? E.wz : E.k === 'drop' ? E.wz - 60 : E.wz; r.y = E.k === 'ladder' || E.k === 'drop' ? GROUND - E.h : E.k === 'hatch' ? GROUND + 190 : (E.y || GROUND); return r; }
  const ease = k => 1 - (1 - k) * (1 - k);
  const walk = (z0, z1, x0, x1, t0, sp = 235) => { const d = Math.hypot(z1 - z0, x1 - x0), T = Math.max(.05, d / sp), k = clamp((t - t0) / T, 0, 1); r.z = lerp(z0, z1, k); r.x = lerp(x0, x1, k);
    if (k < 1 && t >= t0){ r.vz = (z1 - z0) / T; r.vx = (x1 - x0) / T; } if (Math.hypot(x1 - x0, z1 - z0) > 1) r.yaw = Math.atan2(-(z1 - z0), x1 - x0); return t0 + T; };
  if (E.k === 'door'){ const tO = .36; r.y = E.y || GROUND; r.vis = t > .12;
    const tE = walk(E.wz + 4, E.z, E.x, E.x + side, tO * .6); if (t < tO * .6) r.z = E.wz + 4;
    r.open = t < tO ? t / tO : (r.z < E.wz + 110 ? 1 : 0); r.done = t >= tE; }
  else if (E.k === 'hatch'){ const tO = .32, tC = .85, k = clamp((t - tO) / tC, 0, 1), fy = face != null ? face : -Math.PI / 2;
    r.vis = t > tO - .04; r.y = GROUND + 190 * (1 - ease(k)); r.climb = k < 1; r.open = 1; r.yaw = fy;
    if (k >= 1){ const F = { x:Math.cos(fy), z:-Math.sin(fy) }, tE = walk(E.z, E.z + F.z * 52, E.x, E.x + F.x * 52 + side, tO + tC, 200); r.done = t >= tE; } }
  else if (E.k === 'ladder'){ const top = GROUND - E.h, tb = .42, tc = E.h / 250, ts = .2; r.vis = t > .1; r.open = t < .25 ? t / .25 : t < tb + ts + .2 ? 1 : 0;
    if (t < tb){ r.y = top; walk(E.wz - 12, E.zt, E.x, E.x, 0, 200); }
    else if (t < tb + ts){ r.y = top; r.z = lerp(E.zt, E.zr + 28, (t - tb) / ts); r.yaw = Math.PI / 2; }
    else if (t < tb + ts + tc){ r.y = top + (t - tb - ts) * 250; r.z = E.zr + 28; r.yaw = Math.PI / 2; r.climb = true; }
    else { r.y = GROUND; const tE = walk(E.zr + 28, E.z, E.x, E.x + side, tb + ts + tc); r.done = t >= tE; } }
  else if (E.k === 'drop'){ const top = GROUND - E.h, tu = .42, tw = .16, tj = .6;
    if (t < tu){ const k = t / tu; r.y = top + 85 * (1 - ease(k)); r.z = E.wz - 60 + 60 * k; r.climb = true; }
    else if (t < tu + tw){ r.y = top; r.z = E.wz; }
    else { const k = clamp((t - tu - tw) / tj, 0, 1); r.z = lerp(E.wz, E.z, k); r.x = lerp(E.x, E.x + side, k); r.y = lerp(top, GROUND, k * k) - Math.sin(k * Math.PI) * 70; r.air = k < 1; r.vy = k < .3 ? -300 : 300; r.vz = (E.z - E.wz) / tj; r.done = k >= 1; } }
  else if (E.k === 'window'){ const sill = GROUND - E.h, t1 = .3, t2 = .62; r.open = 1;
    if (t < t1){ const k = t / t1; r.y = sill - Math.sin(k * Math.PI) * 22; r.z = lerp(E.wz - 20, E.wz + 95, k); r.dive = 1; r.vz = 400; r.air = true; r.vy = -1; }
    else { const k = clamp((t - t1) / t2, 0, 1); r.z = lerp(E.wz + 95, E.z, k); r.x = lerp(E.x, E.x + side, k); r.y = lerp(sill, GROUND, k * k) - Math.sin(k * Math.PI) * (E.h > 150 ? 40 : 70); r.roll = k < 1 ? Math.max(.01, k) : 0; r.air = k < 1; r.vy = 300; r.done = k >= 1; } }
  else if (E.k === 'run'){ const tE = walk(E.wz, E.z, E.x - 160, E.x + side, 0, 430); r.done = t >= tE; }
  return r;
}
function entSfx(L, E, ev){
  if (ev === 'go'){ if (E.k === 'door') SFX.door(); else if (E.k === 'hatch' || E.k === 'ladder') SFX.metal(); else if (E.k === 'window'){ SFX.glass(); spawnParts(L, E.x, GROUND - E.h - 80, '#bfe6ff', 26, 'glass', 380, E.wz + 40); } }
  if (ev === 'land'){ SFX.land(); spawnParts(L, E.x, GROUND - 4, 'rgba(200,190,170,.8)', 10, 'dust', 170, E.z); }
}
/* düşmanı bir girişe gönder (dalga / hayatta kal / patron çağırması) */
const ENT_GAP = { door:.85, hatch:1.35, ladder:1.6, drop:1.0, run:.55, window:1 };
function sendIn(L, e, platY){
  if (!L.d3 || !L.ent3 || !L.ent3.length) return false;
  const p = L.p, lo = L.lockL + 60, hi = L.lockR - 60, now = L.time;
  let C;
  if (platY != null){ const pl = L.plats.find(q => !q.step && Math.abs(q.y - platY) < 8 && e.x > q.x1 - 200 && e.x < q.x2 + 200) || L.plats.find(q => !q.step && Math.abs(q.y - platY) < 8); C = pl ? L.ent3.filter(E => E.plat === pl.i) : []; if (!C.length) return false; }
  else { C = L.ent3.filter(E => !E.entry && E.plat == null && E.x > lo && E.x < hi); if (!C.length) C = L.ent3.filter(E => !E.entry && E.plat == null).sort((a, b) => Math.abs(a.x - (lo + hi) / 2) - Math.abs(b.x - (lo + hi) / 2)).slice(0, 2);
    if (!C.length) return false;
    const far = C.filter(E => Math.hypot(E.x - p.x, E.z - (p.z || 0)) > 190 && Math.hypot(E.x - p.x, E.wz - (p.z || 0)) > 120); if (far.length) C = far; }
  let best = null, bs = 1e9; for (const E of C){ const s = Math.max(E.free || 0, now) + Math.random() * .7 + (E.lastUse === now ? .4 : 0); if (s < bs){ bs = s; best = E; } }
  const E = best, start = Math.max(E.free || 0, now + .8) + .15 + Math.random() * .25;      // ≥ .8 sn önce lamba yanıp söner
  E.free = start + (ENT_GAP[E.k] || 1) + (E.k === 'ladder' ? E.h / 250 : 0); E.lastUse = now;
  e.ent = { i:E.i, t:now - start, face:null }; e.inside = true; e.inv = 99; e.hide3 = true; e.vx = e.vz = e.vy = 0;
  const r = entPath(L, E, -1); e.x = r.x; e.y = r.y; e.z = r.z;
  return true;
}
function entStep(L, e, dt){
  const E = L.ent3 && L.ent3[e.ent.i]; if (!E){ e.ent = null; e.inv = 0; e.hide3 = false; return; }
  const t0 = e.ent.t; e.ent.t += dt; const tt = e.ent.t;
  if (tt < 0 && tt > -.85) E.warn = 1;                  // girişten hemen önce lamba yanıp söner / kapak titrer (uyarı)
  if (t0 < 0 && tt >= 0) entSfx(L, E, 'go');
  if (e.ent.face == null && tt >= 0) e.ent.face = Math.atan2(-((L.p.z || 0) - E.z), L.p.x - E.x);
  const r = entPath(L, E, tt, 0, e.ent.face);
  e.x = r.x; e.y = r.y; e.z = r.z; setYaw(e, r.yaw); e.vx = r.vx; e.vz = r.vz; e.vy = r.vy; e.onGround = !r.air; e.climbG = r.climb ? 1 : 0; e.hide3 = !r.vis; e.dive = 0;
  E.o2 = Math.max(E.o2 || 0, r.open);
  if (r.done){ if (E.k === 'drop' || E.k === 'window') entSfx(L, E, 'land');
    e.ent = null; e.inv = .25; e.hide3 = false; e.climbG = 0; e.onGround = true; e.vy = 0; e.vx = 0; e.vz = 0; e.cd = Math.max(e.cd || 0, .5); e.hop = 0;
    e.plat = E.plat != null ? L.plats.find(q => q.i === E.plat) || null : null; faceTo(e, L.p.x, L.p.z); }
}
function entTick(L, dt){
  for (const E of L.ent3 || []){ const o = E.o2 || 0;
    E.open = o >= E.open ? o : Math.max(o, E.open - dt * 2.6);
    if (E.open > .85) E.wasOpen = true;
    if (E.wasOpen && o < .05 && E.open < .25){ E.wasOpen = false; if (E.k === 'door') SFX.doorClose(); else if (E.k === 'hatch') SFX.metal(); }
    E.o2 = 0; E.warn = Math.max(0, (E.warn || 0) - dt * 3); }
}
/* =========================================================
   DÖVÜŞ BÖLÜMÜ
   ========================================================= */
/* 3B yerleşim: platformlar arka duvar boyunca yükseltilmiş blok; eşyalar kenarlara; düşmanlar derinliğe yayılır */
const PLAT_D = 210;
function hash01(n){ const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); }
function Level(def, carry, mpo){
  const key = typeof def === 'string' ? def : Object.keys(LEVELS).find(k => LEVELS[k] === def);
  if (typeof def === 'string') def = LEVELS[def];
  mpo = mpo || (carry && carry.mpo) || null;
  if (mpo && mpo.duo) def = mpDupDef(def);              // iki oyuncu yan yana: düşman sayısı iki katı
  const L = { kind:'fight', def, ents:[], proj:[], parts:[], texts:[], shocks:[], pickups:[], bursts:[], objs:[], camX:0, lockL:0, lockR:def.width || W, time:0, done:0, doneT:0,
    lost:false, lostT:0, jumped:false, obj:def.obj || '', hint:def.hint || '', hintT:def.hint ? 7 : 0, go:false, wi:0, active:false, combo:0, comboT:0, score:0, taken:0,
    swapCd:0, bark:null, barkT:0, barkI:0, pauseM:false, spawnT:1.5, bossE:null, bossIntro:0, frozen:true, superBanner:null,
    st:{ weather:def.weather || null, sepia:!!def.sepia, alarm:!!def.alarm, screen:def.screen || null, worldW:def.width || W, noBoard:true, doorK:def.doorK || 0 } };
  L.key = key; L.mpo = mpo; L.view = !!(mpo && mpo.view);
  /* 3B mi? (WebGL yoksa eski yan görünüm) */
  L.d3 = !SAVE.f2d && typeof fight3dOn === 'function' && fight3dOn();
  if (L.d3){ const A = typeof arenaDims === 'function' ? arenaDims(def) : { zMin:-300, zMax:300 }; L.zMin = A.zMin; L.zMax = A.zMax; L.hint = h3txt(L.hint); }
  else { L.zMin = 0; L.zMax = 0; }
  L.plats = (def.platforms || []).map((pl, i) => Object.assign({ i }, pl, L.d3 ? { z1:L.zMin, z2:L.zMin + PLAT_D } : {}));
  L.team = (def.chars || ['issem']).map(k => makeFighter(k, def.start || 120));
  L.team.forEach(f => faceSign(f, def.startFace || 1));
  L.p = L.team[0];
  if (mpo && mpo.duo && L.team.length > 1){ L.duo = true; L.p = L.team.find(f => f.kind === MP.char) || L.team[0]; L.rp = L.team.find(f => f !== L.p); L.rp.x = L.p.x - 60; if (L.d3){ L.rp.z = 70; L.p.z = -30; } }
  if (carry){ FX.zoom = 1; FX.ts = 1; FX.tsT = 0; FX.flash = 0; for (const f of L.team){ const c = carry.team.find(t => t.kind === f.kind); if (c){ f.hp = Math.max(c.hp, f.maxhp * (carry.retry ? .6 : .25)); f.sup = c.sup; f.dead = false; } }
    const q = L.team.find(f => f.kind === carry.pk); if (q && !L.duo) L.p = q; L.entry = { kind:carry.entry, t:0 }; L.fadeIn = 1; if (!carry.retry) L.banT = 3; }
  const onPlat = y => y && y < GROUND - 4;
  const platZ = () => L.zMin + PLAT_D * rand(.35, .65);
  (def.objects || []).forEach((o, i) => { const D = OBJ[o[0]], y = o[2] || GROUND;
    let z = 0; if (L.d3){ if (onPlat(y)) z = platZ(); else { const side = hash01(o[1] * .37 + i) < .5 ? -1 : 1, edge = side < 0 ? L.zMin + 40 + (L.plats.some(pl => o[1] > pl.x1 - 40 && o[1] < pl.x2 + 40) ? PLAT_D : 0) : L.zMax - 40; z = edge - side * (D.w * .5 + hash01(o[1] + i * 3.1) * 70); } }
    L.objs.push({ uid:L.objs.length, t:o[0], x:o[1], y, z, w:D.w, h:D.h, d:o[0] === 'dolap' ? 50 : D.w * .9, hp:D.hp, drop:o[3], rot:L.d3 ? (hash01(o[1] * .13) - .5) * .5 : 0 }); });
  if (L.d3 && typeof arenaKind === 'function'){                    // 3B: kenarlarda kırılabilir ek eşyalar (kutular, çöp kovaları, variller, şişeler)
    const kinds = { street:['cop', 'koli', 'sise', 'cop'], alley:['cop', 'koli', 'varil', 'sise'], warehouse:['kutu', 'koli', 'varil', 'kutu'], tunnel:['koli', 'varil', 'sise'], yard:['varil', 'kutu', 'varil'], factory:['varil', 'kutu', 'dolap'],
      gym:['koli', 'kutu'], office:['koli', 'dolap', 'koli'], security:['koli', 'dolap'], salon:['koli', 'sise'], under:['koli', 'kutu', 'dolap'], crypt:['kutu', 'koli', 'varil'], dojo:['koli', 'kutu', 'sise'] }[arenaKind(def)] || [];
    const len = def.width || W, gx = def.gate ? (def.gate.x != null ? def.gate.x : len - 110) : -999;
    for (let x = 230, i = 0; kinds.length && x < len - 110; x += 240 + hash01(i * 5.1 + len) * 230, i++){
      if (Math.abs(x - (def.start || 120)) < 110 || Math.abs(x - gx) < 140 || L.plats.some(pl => !pl.step && x > ladX(pl) - 90 && x < ladX(pl) + 40)) continue;
      const k = kinds[Math.floor(hash01(i * 3.7 + len * .01) * kinds.length)], D = OBJ[k], back = hash01(i * 2.3 + len) < .5;
      const onP = L.plats.some(pl => x > pl.x1 - 70 && x < pl.x2 + 70), useBack = back && !onP, z = useBack ? L.zMin + 42 + D.w * .3 : L.zMax - 42 - D.w * .3;
      if (L.objs.some(o => Math.abs(o.x - x) < 90 && Math.abs(o.z - z) < 90)) continue;
      L.objs.push({ uid:L.objs.length, t:k, x, y:GROUND, z, w:D.w, h:D.h, d:k === 'dolap' ? 50 : D.w * .9, hp:D.hp, rot:(hash01(x * .21) - .5) * .6, decor:true }); } }
  L.ent3 = L.d3 && typeof arenaEntrances === 'function' ? arenaEntrances(L) : [];
  if (L.ent3.length) L.objs = L.objs.filter(o => !(o.decor && L.ent3.some(E => (E.back && Math.abs(o.x - E.x) < 110 && o.z < L.zMin + 170) || (E.k === 'hatch' && Math.hypot(o.x - E.x, o.z - E.z) < 120))));
  for (const w of def.weapons || []) L.pickups.push({ x:w[1], y:w[2] || GROUND, z:L.d3 ? rand(-80, 80) : 0, kind:'weapon', w:w[0], uses:WEAPONS[w[0]].uses, t:0 });
  (def.preset || []).forEach((it, i) => { const e = makeEnemy(it[0], it[1], it[2] || {}); e.inside = true;
    if (L.d3){ e.z = onPlat(e.y) ? platZ() : ETYPES[it[0]].boss ? 0 : ((i % 3) - 1) * 110 + rand(-25, 25); faceTo(e, L.p.x, L.p.z); }
    L.ents.push(e); if (ETYPES[it[0]].boss){ L.bossE = e; } });
  if (def.preset && def.preset.length){ L.active = true; L.lockL = 0; L.lockR = W; }
  if (def.survive) L.surviveT = def.survive;
  if (def.limit) L.limitT = def.limit * (SAVE.diff === 0 ? 1.3 : SAVE.diff === 2 ? .9 : 1);
  if (def.init) def.init(L);
  if (L.d3){ L.ents.forEach((e, i) => { if (e.dummy) e.z = ((i % 3) - 1) * 90; }); L.hint = h3txt(L.hint); L.obj = h3txt(L.obj); }
  anyPress = false;
  const ctrl = () => showControls(L.view && !L.duo ? null : (L.d3 ? 'fight3' : 'fight'), { swap:L.team.length > 1 && !L.duo, labels:{ kick: L.p.mk === 'issem' ? '⚽' : '🦵' } });
  ctrl(); L.ctrl = ctrl; playMusic('fight');
  if (L.d3 && typeof fight3dSetup === 'function') fight3dSetup(L);
  function doSwap(force){
    const o = L.team.find(f => f !== L.p && !f.dead); if (!o || (L.swapCd > 0 && !force)) return;
    if (L.p.carry) dropCarry(L, L.p);
    o.x = L.p.x; o.y = L.p.y; o.z = L.p.z; o.vy = 0; o.onGround = L.p.onGround; o.plat = L.p.plat; setYaw(o, L.p.yaw); o.vx = 0; o.vz = 0; o.atk = null; o.stun = 0; o.down = 0; o.dizzy = 0; o.inv = .6; L.p = o; L.swapCd = .9;
    SFX.swap(); spawnParts(L, o.x, o.y - 70, '#ffffff', 14, 'spark', 260, o.z); floatText(L, o.x, o.y - 150, NAMES[o.mk] + '!', '#f2c230', undefined, o.z); ctrl();
  }
  function lose(){ if (L.lost) return; L.lost = true; L.lostT = 0; showControls(null); SFX.lose(); }
  function restart(){ stats.retries++; cur = Level(L.key || def, carry ? Object.assign({}, carry, { retry:true }) : null, mpo); }
  L.restart = restart;
  L.update = dt => {
    if (L.pauseM){
      if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ L.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)) toCover(); }
      return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !L.lost){ L.pauseM = true; showControls(null); return; }
    if (L.d3 && tap && typeof fight3dTap === 'function' && fight3dTap(L, tap)){ tap = null; }
    if (L.fadeIn > 0) L.fadeIn = Math.max(0, L.fadeIn - dt * (L.d3 ? 1.5 : 2));
    if (L.entry && !L.entry.done){ entryAnim(L, dt); return; }
    if (L.gate && L.gate.st !== 'wait'){ gateAnim(L, dt); return; }
    L.time += dt; if (L.hintT > 0) L.hintT -= dt;
    if (L.p && !L.p.dead && L.p.hp < L.p.maxhp * .25){ L.hbT = (L.hbT || 0) - dt; if (L.hbT <= 0){ SFX.heart(); L.hbT = .85; } } if (L.swapCd > 0) L.swapCd -= dt; if (L.comboT > 0) L.comboT -= dt; if (L.bossIntro > 0) L.bossIntro -= dt;
    if (L.superBanner){ L.superBanner.t -= dt; if (L.superBanner.t <= 0) L.superBanner = null; }
    for (const b of L.bursts) b.t += dt; L.bursts = L.bursts.filter(b => b.t < .18);
    fxTick(L, dt);
    const surf = surfaces(L);
    if (L.frozen){
      for (const f of L.team) f.animT += dt; for (const e of L.ents){ e.animT += dt; }
      if (anyPress || (tap && !inB(PAUSE_BTN, tap)) || (L.duo && MP.rin.any)){ L.frozen = false; MP.rin.any = false; for (const k in pressedAt) pressedAt[k] = null; if (L.bossE){ L.bossIntro = 2.2; SFX.boss(); shake = 8; } else { SFX.whistle(); say('Dövüş!', 'Spiker'); } }
      return; }
    if (L.lost){ L.lostT += dt; if (tap && L.lostT > .8) restart(); return; }
    if (def.barks && L.barkI < def.barks.length && L.time > def.barks[L.barkI].at){ L.bark = def.barks[L.barkI++]; L.barkT = 3.2; say(L.bark.t, L.bark.who); }
    if (L.barkT > 0) L.barkT -= dt;
    if (L.team.length > 1 && !L.duo && took('swap')) doSwap();
    if (!L.p.dead || !L.duo) updPlayer(L, dt, surf);
    if (L.duo && L.rp) mpRemoteUpdate(L, dt, surf);
    setBtnReady('super', L.p.sup >= 100); setBtnLabel('grab', L.p.carry || L.p.weapon ? '🎯' : '✋');
    for (const f of L.team) if (f !== L.p && !f.dead && f.hp < f.maxhp) f.hp = Math.min(f.maxhp, f.hp + dt * 1.5);
    for (const e of L.ents){ if (L.duo){ const sp = L.p; L.p = mpTarget(L, e); updEnemy(L, e, dt, surf); L.p = sp; } else updEnemy(L, e, dt, surf); }
    if (L.d3) entTick(L, dt);
    if (L.d3) for (const pl of (L.duo ? [L.p, L.rp] : [L.p])){ if (!pl || pl.dead || pl.climb || pl.down > 0) continue;      // gövdeler iç içe geçmesin
      for (const e of L.ents){ if (e.dead || e.ent || e.down > 0 || e.grabbedBy || e === pl.carryE || e.dashing > 0 || e.leaping > 0 || !sameLevel(e, pl)) continue;
        const dx = e.x - pl.x, dz = e.z - pl.z, d = Math.hypot(dx, dz), R = e.dummy ? 34 : 40 * (.5 + .5 * (e.look ? e.look.scale || 1 : 1));
        if (d < R && d > .01){ const k = R - d, me = e.dummy ? 0 : .7; e.x += dx / d * k * me; e.z += dz / d * k * me; pl.x -= dx / d * k * (1 - me); pl.z -= dz / d * k * (1 - me); } } }
    for (const e of L.ents){ if (!e.thrown) continue; if (e.onGround && Math.hypot(e.vx, e.vz) < 200){ e.thrown = false; continue; }
      for (const o of L.ents){ if (o === e || o.dead || o.dummy || o.down > 0 || o.grabbedBy || (e.hitSet && e.hitSet.has(o))) continue;
        if (pdist(o, e) < 46 && Math.abs(o.y - e.y) < 120){ (e.hitSet = e.hitSet || new Set()).add(o); SFX.wallSlam(); hitEnemy(L, o, 14, 380, L.d3 ? { x:e.vx, z:e.vz } : (Math.sign(e.vx) || 1), { down:true, heavy:true }); floatText(L, o.x, o.y - 150, 'ÇARPIŞMA!', '#ff9a3a', 24, o.z); } } }
    // mermiler: top, ateş, fırlatılan eşya ve silahlar
    for (const b of L.proj){
      if (b.kind !== 'fire') b.vy += 900 * dt; b.x += b.vx * dt; b.z = (b.z || 0) + (b.vz || 0) * dt; b.y += b.vy * dt; b.spin += Math.hypot(b.vx, b.vz || 0) * dt / 10; b.life -= dt;
      if (b.y > GROUND - 10 && b.kind === 'ball'){ b.y = GROUND - 10; b.vy *= -.5; }
      if (b.y > GROUND - 10 && b.kind !== 'ball' && !b.dead){ b.dead = true; b.life = Math.min(b.life, .05); breakProj(L, b); }
      if (L.d3 && (b.z < L.zMin + 10 || b.z > L.zMax - 10)){ if (b.kind === 'ball'){ b.vz = -b.vz * .6; b.z = clamp(b.z, L.zMin + 10, L.zMax - 10); } else if (!b.dead){ b.dead = true; b.life = Math.min(b.life, .05); breakProj(L, b); } }
      if (!b.dead) for (const e of L.ents){ if (e.dead || e.inv > 0 || b.hit.has(e) || e.down > 0) continue;
        if (Math.hypot(e.x - b.x, (e.z || 0) - (b.z || 0)) < (L.d3 ? 36 : 30) && b.y > e.y - 140 * (e.look && e.look.scale || 1) && b.y < e.y + 10){ b.hit.add(e); hitEnemy(L, e, b.dmg || 14, 330, L.d3 ? { x:b.vx, z:b.vz || 0 } : Math.sign(b.vx), { down:b.down, heavy:true });
          if (!b.pierce){ b.dead = b.kind !== 'ball'; if (b.kind === 'ball'){ b.vx *= -.3; b.vz = (b.vz || 0) * -.3; b.vy = -320; b.hit = new Set(L.ents); } else { breakProj(L, b); b.life = 0; } break; } } }
      if (!b.dead && b.kind !== 'ball') for (const o of L.objs){ if (!o.broken && !o.held && boxDist(o, b.x, L.d3 ? b.z : o.z) < 8 && b.y > o.y - o.h && b.y < o.y){ breakObj(L, o, dirV({ x:b.vx, z:b.vz || 0 })); if (!b.pierce){ b.dead = true; b.life = 0; breakProj(L, b); } } }
      if (b.kind === 'ball' && !b.dead) for (const o of L.objs){ if (!o.broken && !o.held && !(b.hitO && b.hitO.has(o)) && boxDist(o, b.x, L.d3 ? b.z : o.z) < 12 && b.y > o.y - o.h - 10 && b.y < o.y){ (b.hitO = b.hitO || new Set()).add(o);
          hitObjsNear(L, o.x, o.z, 4, o.y - o.h / 2, 14, { x:b.vx, z:b.vz || 0 }); b.vx *= -.35; b.vz = (b.vz || 0) * -.35; b.vy = -260; SFX.ballKick && SFX.ballKick(); } }
      if (def.ball && b.kind === 'ball') def.ball(L, b);
    }
    L.proj = L.proj.filter(b => b.life > 0 && (L.d3 ? (b.x > L.lockL - 700 && b.x < L.lockR + 700) : (b.x > L.camX - 120 && b.x < L.camX + W + 120)));
    for (const s of L.shocks){ s.r += 540 * dt; s.life -= dt;
      for (const F of (L.duo ? [L.p, L.rp] : [L.p])) if (!s.hit && !F.dead && Math.abs(pdist(F, s) - s.r) < 30 && F.onGround && Math.abs(F.y - s.y) < 20){ s.hit = true; const sp = L.p; L.p = F; hurtPlayer(L, s.dmg, s, { unblockable:true, low:true }); L.p = sp; } }
    L.shocks = L.shocks.filter(s => s.life > 0);
    for (const k of L.pickups){ k.t += dt; if (k.vy != null){ k.vy += 1400 * dt; k.y += k.vy * dt; k.x += (k.vx || 0) * dt; k.z = (k.z || 0) + (k.vz || 0) * dt; if (L.d3) k.z = clamp(k.z, L.zMin + 20, L.zMax - 20);
        const fl = surf.find(s => k.x >= s.x1 && k.x <= s.x2 && inZ(s, k, 0) && k.y >= s.y && k.y - k.vy * dt <= s.y + 2); if (fl){ k.y = fl.y; k.vy = null; } else if (k.y >= GROUND){ k.y = GROUND; k.vy = null; } }
      const kf = (L.duo ? [L.p, L.rp] : [L.p]).find(F => !F.dead && pdist(F, k) < (L.d3 ? 38 : 32) && Math.abs(F.y - k.y) < 30);
      if (k.kind === 'hp' && kf){ k.got = true; kf.hp = Math.min(kf.maxhp, kf.hp + 20); SFX.pickupHp(); floatText(L, k.x, k.y - 120, '+20 ❤', '#7dff9a', undefined, k.z); } }
    L.pickups = L.pickups.filter(k => !k.got && (k.kind === 'weapon' || k.t < 14));
    for (const o of L.objs){ if (o.shakeT > 0) o.shakeT -= dt; if (o.brokeT != null) o.brokeT += dt; }
    for (const q of L.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z = (q.z || 0) + (q.vz || 0) * dt; q.vy += (q.type === 'dust' ? 100 : 900) * dt; q.r += dt * 8; if (q.type === 'dust' && q.vz) q.vz *= Math.pow(.2, dt); }
    if (L.debris){ for (const q of L.debris){ q.life -= dt; q.vy += 1700 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.rx += q.wr * dt; q.ry += q.wr * .7 * dt;
        if (q.y > GROUND - q.h / 2){ q.y = GROUND - q.h / 2; q.vy *= -.25; q.vx *= .55; q.vz *= .55; q.wr *= .5; if (Math.abs(q.vy) < 40) q.vy = 0; } if (L.d3) q.z = clamp(q.z, L.zMin + 6, L.zMax - 6); }
      L.debris = L.debris.filter(q => q.life > 0); }
    L.parts = L.parts.filter(q => q.life > 0);
    for (const t of L.texts) t.t += dt; L.texts = L.texts.filter(t => t.t < 1.2);
    L.ents = L.ents.filter(e => !(e.dead && !e.dummy && e.deadT > 1.8));
    if (!L.done) waveLogic(L, dt);
    if (def.update) def.update(L, dt);
    if (L.duo){ const al = [L.p, L.rp].filter(F => !F.dead), mid = al.length ? al.reduce((s, F) => s + F.x, 0) / al.length : L.p.x;
      L.camX = clamp(mid - W * .5, L.lockL, Math.max(L.lockL, L.lockR - W)); if (!L.d3) for (const F of al) F.x = clamp(F.x, L.camX + 26, L.camX + W - 26);
      if (L.p.dead && L.rp.dead && !L.lost) lose(); }
    else L.camX = clamp(L.p.x - W * .4, L.lockL, Math.max(L.lockL, L.lockR - W));
    if (L.p.dead && !L.lost && !L.duo){
      L.deadT = (L.deadT || 0) + dt;
      if (L.deadT > .9){ L.deadT = 0; const o = L.team.find(f => !f.dead); if (o) doSwap(true); else lose(); } }
    if (L.done){
      if (!L.rank){ const lost = L.team.reduce((s, f) => s + (1 - Math.max(0, f.hp) / f.maxhp), 0) / L.team.length;
        L.rank = lost < .1 ? 'S' : lost < .3 ? 'A' : lost < .6 ? 'B' : 'C'; L.lostFrac = lost; SFX.rank(); }
      L.doneT += dt;
      if (def.gate){ gateWait(L, dt); }
      else if (L.doneT > 2.4){ stats.lvls++; stats.dmg += L.lostFrac; stats.ranks.push(L.rank); next(); } }
  };
  function waveLogic(L, dt){
    const p = L.p, n = alive(L).length;
    if (def.survive){
      L.surviveT -= dt; L.spawnT -= dt;
      if (L.spawnT <= 0 && n < 2 + SAVE.diff){ const side = Math.random() < .5 ? 1 : -1; const e = makeEnemy(pick(def.pool), side > 0 ? L.camX + W + 40 : L.camX - 40, { z:rz(L) }); L.ents.push(e); sendIn(L, e); L.spawnT = rand(1.8, 3.2) / DIFF().aggr; }
      if (L.surviveT <= 0){ L.done = 1; L.obj = def.doneMsg || 'Dayandın!'; SFX.ok(); for (const e of L.ents) if (!e.dead && !e.dummy){ e.stun = 3; const av = awayV(e, p); e.vx = av.x * 300; e.vz = av.z * 300; } }
      return;
    }
    if (L.limitT != null){ L.limitT -= dt; if (L.limitT <= 0){ L.limitT = 0; L.loseMsg = def.loseMsg || 'Süre doldu!'; lose(); return; } }
    if (L.active){
      if (n === 0){ L.active = false; L.lockL = 0; L.lockR = def.width || W;
        if (L.wi < (def.waves || []).length || def.exit){ L.go = true; if (!def.noHeal){ p.hp = Math.min(p.maxhp, p.hp + 12); floatText(L, p.x, p.y - 150, '+12 ❤', '#7dff9a', undefined, p.z); } SFX.ok(); }
        if (L.wi >= (def.waves || []).length && !def.exit && !def.custom){ L.done = 1; L.obj = def.doneMsg || 'Kazandın!'; } } }
    else if (def.waves && L.wi < def.waves.length && p.x > def.waves[L.wi].at){
      const w = def.waves[L.wi++]; L.active = true; L.go = false; L.lockL = L.camX; L.lockR = L.camX + W;
      w.list.forEach((it, i) => { const [t, side, o] = Array.isArray(it) ? it : [it, i % 2 ? -1 : 1];
        const e = makeEnemy(t, side > 0 ? L.camX + W + 40 + i * 70 : L.camX - 40 - i * 70, Object.assign({ z:rz(L) }, o || {}));
        if (o && o.y){ e.x = L.camX + (side > 0 ? W - 120 - i * 60 : 120 + i * 60); e.inside = true; if (L.d3){ const pl = L.plats.find(pl => e.x > pl.x1 - 10 && e.x < pl.x2 + 10 && Math.abs(pl.y - o.y) < 8) || L.plats.find(pl => !pl.step); if (pl){ e.x = clamp(e.x, pl.x1 + 30, pl.x2 - 30); e.z = L.zMin + PLAT_D * .5; } } }
        if (ETYPES[t].boss){ L.bossE = e; L.bossIntro = 2.2; SFX.boss(); shake = 8; e.x = L.camX + W - 160; e.z = 0; e.inside = true; }
        faceTo(e, p.x, p.z); L.ents.push(e); if (L.d3 && !ETYPES[t].boss) sendIn(L, e, o && o.y ? o.y : null); });
      if (w.hint){ L.hint = L.d3 ? h3txt(w.hint) : w.hint; L.hintT = 4.5; }
      SFX.whistle(); }
    else if (def.waves && L.wi >= def.waves.length && def.exit && !L.active && p.x > (def.width || W) - 150){ L.done = 1; L.obj = def.doneMsg || 'Çıkışa ulaştın!'; SFX.goal(); }
    else if (!def.waves && def.exit && !L.active && p.x > (def.width || W) - 150){ L.done = 1; L.obj = def.doneMsg || 'Çıkışa ulaştın!'; SFX.ok(); }
  }
  L.draw = c => (L.d3 ? drawLevel3D(c, L) : drawLevel(c, L));
  return L;
}
/* 3B'de ⬇/⬆ gerektiren eski ipuçlarını yeni tuşlara çevir */
function h3txt(s){ if (!s) return s;
  return s.replace(/Düşman KIRMIZI yanınca vuracak/g, 'Düşmanın altında KIRMIZI halka çıkınca vuracak').replace(/Kırmızı yanıp koşar/g, 'Altında pembe halka çıkınca koşar').replace(/⬇\s*\+\s*👊/g, '🛡️ + 👊').replace(/⬇\s*\+\s*🦵/g, '🛡️ + 🦵').replace(/⬇\+🦵/g, '🛡️+🦵').replace(/⬇\+👊/g, '🛡️+👊')
    .replace(/⬆ zıpla, ⬇\+⬆ ile aşağı in\./g, '⬆ zıpla; kenardan yürüyüp in.').replace(/ya da ⬇ eğil/g, 'ya da 💨 kaç').replace(/🪜 ⬆ tırman/g, '🪜 merdivene yürü').replace(/Merdivenle üst kata ⬆ tırman/g, 'Üst kata merdivenden çık').replace(/⬆ tırman/g, 'merdivene yürü')
    ; }
function breakProj(L, b){ if (b.kind === 'obj'){ const D = OBJ[b.obj]; (SFX[D.sfx] || SFX.wood)(); spawnParts(L, b.x, b.y, D.col, 14, 'chip', 300, b.z); }
  else if (b.kind === 'weapon'){ if (b.w === 'sise'){ SFX.glass(); spawnParts(L, b.x, b.y, '#2e8b57', 12, 'glass', 260, b.z); } else { L.pickups.push({ x:b.x, y:Math.min(GROUND, b.y), z:b.z || 0, kind:'weapon', w:b.w, uses:Math.max(2, WEAPONS[b.w].uses - 3), t:0, vy:-150, vx:-b.vx * .1, vz:-(b.vz || 0) * .1 }); SFX.metal(); } } }

/* ---------- geçitler: kapı · cam · merdiven · kapak (odadan odaya geçiş animasyonları) ---------- */
const GATE_TXT = { door:'🚪 Kapıya yürü', window:'🪟 Camı kır! (👊 / 🦵)', ladder:'🪜 Merdivene git, ⬆ tırman', hatch:'⬇ Kapaktan aşağı in' };
const GATE_TXT3 = { door:'🚪 Kapıya yürü', window:'🪟 Camı kır! (👊 / 🦵)', ladder:'🪜 Merdivene yürü', hatch:'🕳️ Kapağa yürü' };
/* 3B'de kapı/cam/merdiven arka duvarda, kapak yerde */
function gatePt(L, G){ return L.d3 ? { x:G.x, z:G.kind === 'hatch' ? 0 : L.zMin + 46 } : { x:G.x, z:0 }; }
function gateWait(L, dt){
  const def = L.def, gp = g => L.gate ? pdist(g, gatePt(L, L.gate)) : 0;
  const p = L.duo && L.gate ? [L.p, L.rp].filter(F => !F.dead).sort((a, b) => gp(a) - gp(b))[0] || L.p : L.p;
  if (!L.gate){ L.gate = { kind:def.gate.kind, x:def.gate.x != null ? def.gate.x : (def.width || W) - 110, st:'wait', t:0, hits:0, open:0 }; L.lockR = def.width || W; L.lockL = 0; L.go = false;
    L.obj = (L.d3 ? GATE_TXT3 : GATE_TXT)[L.gate.kind]; SFX.ok(); if (def.gate.say) say(def.gate.say, NAMES[p.mk] ? (p.mk === 'issem' ? 'Issem' : 'Ufis') : 'narr'); }
  const G = L.gate, ap = gatePt(L, G), near = L.d3 ? pdist(p, ap) : Math.abs(p.x - G.x);
  if (p.dead || p.down > 0 || L.doneT < .8) return;
  if (G.kind === 'door' && near < (L.d3 ? 58 : 50) && p.onGround){ G.st = 'go'; G.t = 0; SFX.door(); }
  else if (G.kind === 'window'){
    const F = fwdOf(p), hit = L.d3 ? Math.hypot(p.x + F.x * 55 - ap.x, p.z + F.z * 55 - ap.z) < 80 : Math.abs(p.x + p.face * 55 - G.x) < 70;
    if (p.atk && !p.atk.gateHit && p.atk.t > p.atk.m.dur * .25 && hit){ p.atk.gateHit = true; G.hits++; shake = 5;
      if (G.hits < 2){ SFX.glass(); spawnParts(L, G.x, GROUND - 150, '#bfe6ff', 8, 'glass', 260, L.d3 ? L.zMin + 10 : 0); floatText(L, G.x, GROUND - 240, 'ÇATIRDADI!', '#bfe6ff', 24, L.d3 ? L.zMin + 30 : 0); }
      else { SFX.glass(); SFX.punchHeavy(); spawnParts(L, G.x, GROUND - 150, '#bfe6ff', 34, 'glass', 420, L.d3 ? L.zMin + 10 : 0); G.st = 'go'; G.t = 0; hitstop = .12; } } }
  else if ((G.kind === 'ladder' || G.kind === 'hatch') && near < 45 && p.onGround && (L.d3 || (G.kind === 'ladder' ? (keys.up || JOY.y < -.5) : (keys.down || JOY.y > .5)))){ G.st = 'go'; G.t = 0; SFX.metal(); }
}
function gateAnim(L, dt){
  const G = L.gate, p = L.p; G.t += dt; p.animT += dt; p.atk = null; p.blocking = false; p.crouch = false;
  for (const q of L.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z = (q.z || 0) + (q.vz || 0) * dt; q.vy += 900 * dt; q.r += dt * 8; } L.parts = L.parts.filter(q => q.life > 0);
  for (const t of L.texts) t.t += dt; L.texts = L.texts.filter(t => t.t < 1.2);
  if (L.d3){ const ap = gatePt(L, G), toWall = Math.PI / 2;      // arka duvara (−z) dön
    if (G.kind === 'door'){ G.open = Math.min(1, G.t / .45); if (G.t > .25){ p.x = lerp(p.x, G.x, Math.min(1, dt * 6)); setYaw(p, toWall); p.vx = 0; p.vz = -170; p.z -= 170 * dt; if (p.z < L.zMin + 8) p.hideG = true; } else { p.vx = p.vz = 0; turnTo(p, toWall, dt * 10); }
      if (G.t > .95) L.fade = Math.min(1, (G.t - .95) / .4); }
    else if (G.kind === 'window'){ setYaw(p, toWall); p.x = lerp(p.x, G.x, Math.min(1, dt * 5));
      if (!G.jump){ p.vz = -430; p.vx = 0; p.z -= 430 * dt; if (p.z < L.zMin + 120){ G.jump = 1; p.vy = -620; p.onGround = false; FX.ts = .45; FX.tsT = .5; SFX.jump(); } }
      else { p.z -= 430 * dt; p.vy += 2300 * dt; p.y = Math.min(GROUND, p.y + p.vy * dt); p.dive = 1; if (p.z < L.zMin - 30) p.hideG = true; if (p.z < L.zMin + 20) L.fade = Math.min(1, (L.fade || 0) + dt * 2.6); } }
    else if (G.kind === 'ladder'){ p.vx = p.vz = 0; p.x = lerp(p.x, G.x, Math.min(1, dt * 10)); p.z = lerp(p.z, L.zMin + 24, Math.min(1, dt * 10)); setYaw(p, toWall); p.climbG = 1; if (G.t > .2) p.y -= 210 * dt; if (p.y < GROUND - 300) L.fade = Math.min(1, (L.fade || 0) + dt * 2.5); }
    else if (G.kind === 'hatch'){ p.vx = p.vz = 0; p.x = lerp(p.x, ap.x, Math.min(1, dt * 10)); p.z = lerp(p.z, ap.z, Math.min(1, dt * 10)); p.climbG = 1; if (G.t > .25){ p.y += 150 * dt; L.fade = Math.min(1, (L.fade || 0) + dt * 1.6); } }
  } else {
  if (G.kind === 'door'){ G.open = Math.min(1, G.t / .45); if (G.t > .3){ faceSign(p, 1); p.vx = 170; p.x += 170 * dt; if (p.x > G.x + 10) p.hideG = true; } else p.vx = 0;
    if (G.t > .9) L.fade = Math.min(1, (G.t - .9) / .4); }
  else if (G.kind === 'window'){
    if (!G.jump){ faceSign(p, 1); p.vx = 430; p.x += 430 * dt; if (p.x > G.x - 90){ G.jump = 1; p.vy = -620; p.onGround = false; FX.ts = .45; FX.tsT = .5; SFX.jump(); } }
    else { p.x += 430 * dt; p.vy += 2300 * dt; p.y += p.vy * dt; p.dive = 1; if (p.x > G.x + 30) p.hideG = true; if (p.x > G.x) L.fade = Math.min(1, (L.fade || 0) + dt * 2.6); } }
  else if (G.kind === 'ladder'){ p.vx = 0; p.x = lerp(p.x, G.x, Math.min(1, dt * 10)); p.climbG = 1; faceSign(p, 1); if (G.t > .2) p.y -= 210 * dt; if (p.y < GROUND - 300) L.fade = Math.min(1, (L.fade || 0) + dt * 2.5); }
  else if (G.kind === 'hatch'){ p.vx = 0; p.x = lerp(p.x, G.x, Math.min(1, dt * 10)); p.climbG = 1; if (G.t > .25){ p.y += 150 * dt; L.fade = Math.min(1, (L.fade || 0) + dt * 1.6); } }
  }
  if (L.duo && L.rp){ const q = L.rp, F = fwdOf(p); q.x = p.x - F.x * 50 * (G.kind === 'ladder' || G.kind === 'hatch' ? 0 : 1); q.z = p.z - F.z * 50 * (G.kind === 'ladder' || G.kind === 'hatch' ? 0 : 1) + (L.d3 && G.kind !== 'hatch' ? 40 : 0); q.y = p.y; setYaw(q, p.yaw); q.vx = p.vx; q.vz = p.vz; q.dive = p.dive; q.climbG = p.climbG; q.hideG = p.hideG; q.animT = p.animT; }
  if (L.fade > 0 && !G.wh){ G.wh = 1; SFX.whoosh(); }
  if ((L.fade || 0) >= 1 && G.t > .5) finishGate(L);
}
function finishGate(L){
  const def = L.def, room = def.gate.room;
  if (room){ cur = Level(room, { team:L.team.map(f => ({ kind:f.kind, hp:f.hp, sup:f.sup })), pk:L.p.kind, entry:L.gate.kind, mpo:L.mpo }); return; }
  stats.lvls++; stats.dmg += L.lostFrac || 0; stats.ranks.push(L.rank || 'B'); next();
}
function entryAnim3(L, dt){
  const En = L.entry, E = L.ent3.find(q => q.entry); En.t += dt;
  const team = (L.duo ? [L.p, L.rp] : [L.p]).filter(Boolean); let all = true;
  team.forEach((f, j) => { f.animT += dt; if (f.__entDone) return;
    const tt = En.t - .45 - j * .62, t0 = tt - dt;
    if (t0 < 0 && tt >= 0 && !j) entSfx(L, E, 'go');
    const r = entPath(L, E, tt, j && E.k !== 'hatch' ? 80 : 0, j ? Math.PI : 0);
    f.x = r.x; f.y = r.y; f.z = r.z; setYaw(f, r.yaw); f.vx = r.vx; f.vz = r.vz; f.vy = r.vy; f.onGround = !r.air; f.climbG = r.climb ? 1 : 0; f.roll = r.roll; f.dive = r.dive; f.hideG = !r.vis; f.atk = null; f.blocking = false;
    E.o2 = Math.max(E.o2 || 0, r.open);
    if (r.done){ f.__entDone = true; if (E.k === 'drop' || E.k === 'window'){ entSfx(L, E, 'land'); shake = Math.max(shake, 5); }
      f.climbG = 0; f.roll = 0; f.dive = 0; f.hideG = false; f.vx = f.vz = f.vy = 0; f.onGround = true; f.y = GROUND; setYaw(f, 0); }
    else all = false; });
  entTick(L, dt);
  if (all){ En.done = true; for (const f of L.team){ delete f.__entDone; if (!team.includes(f)){ f.x = L.p.x; f.y = GROUND; f.z = L.p.z; f.hideG = false; } } }
}
function entryAnim(L, dt){
  if (L.d3 && L.ent3 && L.ent3.some(q => q.entry)) return entryAnim3(L, dt);
  const E = L.entry, p = L.p; E.t += dt; p.animT += dt;
  const sx = L.def.start || 120;
  if (E.kind === 'door' || !E.kind){ if (E.t === dt){ L.st.doorK = 1; } p.x = lerp(sx - 130, sx, Math.min(1, E.t / .7)); p.vx = 170; p.vz = 0; faceSign(p, 1); if (E.t > .7){ p.vx = 0; L.st.doorK = Math.max(0, 1 - (E.t - .7) * 3); } if (E.t > 1.05){ E.done = true; SFX.doorClose(); } }
  else if (E.kind === 'window'){ const k = Math.min(1, E.t / .8); faceSign(p, 1); p.x = lerp(sx - 240, sx, k); p.y = GROUND - Math.sin(k * Math.PI) * 120; p.roll = k; if (k >= 1){ p.roll = 0; p.y = GROUND; E.done = true; SFX.land(); spawnParts(L, p.x, GROUND - 4, 'rgba(200,190,170,.8)', 8, 'dust', 160, p.z); } }
  else if (E.kind === 'ladder'){ p.climbG = 1; p.x = sx; p.y = lerp(GROUND + 170, GROUND, Math.min(1, E.t / .9)); if (E.t > .9){ p.climbG = 0; p.y = GROUND; E.done = true; SFX.land(); } }
  else if (E.kind === 'hatch'){ p.x = sx; p.y = lerp(GROUND - 380, GROUND, Math.min(1, E.t / .5) ** 2); if (E.t > .5){ p.y = GROUND; E.done = true; SFX.land(); shake = 6; spawnParts(L, p.x, GROUND - 4, 'rgba(200,190,170,.8)', 12, 'dust', 200, p.z); } }
  if (E.done){ p.vx = 0; p.vz = 0; p.onGround = true; p.vy = 0; for (const f of L.team) if (f !== p){ f.x = p.x; f.y = GROUND; f.z = p.z; } }
}
function drawGate(c, L){
  const g = L.def.gate; if (!g) return;
  const G = L.gate || { kind:g.kind, x:g.x != null ? g.x : (L.def.width || W) - 110, hits:0, open:0, st:'closed' };
  const x = G.x, t = gameTime;
  c.save(); c.lineWidth = 3; c.strokeStyle = INK;
  if (G.kind === 'door'){
    c.fillStyle = '#2a2d33'; c.fillRect(x - 62, GROUND - 226, 124, 226);
    const op = G.open || 0; const lg = c.createLinearGradient(x, GROUND - 210, x, GROUND); lg.addColorStop(0, '#fff6d0'); lg.addColorStop(1, '#f2c230');
    c.fillStyle = op > 0 ? lg : '#0a0a0a'; c.fillRect(x - 50, GROUND - 212, 100, 212);
    if (op > 0){ c.globalAlpha = .35 * op; c.fillStyle = '#fff6d0'; c.beginPath(); c.moveTo(x - 50, GROUND); c.lineTo(x + 50, GROUND); c.lineTo(x + 160, GROUND + 60); c.lineTo(x - 160, GROUND + 60); c.fill(); c.globalAlpha = 1; }
    const pw = 100 * (1 - op * .85); c.fillStyle = '#6b4a2b'; c.fillRect(x - 50, GROUND - 212, pw, 212); c.strokeRect(x - 50, GROUND - 212, pw, 212);
    if (pw > 30){ c.strokeStyle = '#4a3020'; c.strokeRect(x - 42, GROUND - 200, pw - 16, 80); c.strokeRect(x - 42, GROUND - 110, pw - 16, 96); c.fillStyle = '#e8c547'; c.beginPath(); c.arc(x - 50 + pw - 12, GROUND - 106, 6, 0, 7); c.fill(); }
    c.fillStyle = '#2ecc71'; c.fillRect(x - 24, GROUND - 246, 48, 16); c.font = fnt(11); c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.fillText('ÇIKIŞ', x, GROUND - 234); c.textAlign = 'left';
  } else if (G.kind === 'window'){
    const y0 = GROUND - 250, h = 190;
    c.fillStyle = '#3a3f48'; c.fillRect(x - 74, y0 - 12, 148, h + 24);
    if (G.st !== 'go'){ const gl = c.createLinearGradient(x - 60, y0, x + 60, y0 + h); gl.addColorStop(0, 'rgba(160,210,255,.75)'); gl.addColorStop(1, 'rgba(60,110,170,.75)'); c.fillStyle = gl; c.fillRect(x - 62, y0, 124, h);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(x - 50, y0 + 10); c.lineTo(x - 20, y0 + 10); c.lineTo(x - 56, y0 + 90); c.lineTo(x - 56, y0 + 40); c.fill();
      if (G.hits > 0){ c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; for (let i = 0; i < 9; i++){ const a = i * .7; c.beginPath(); c.moveTo(x + 10, y0 + 90); c.lineTo(x + 10 + Math.cos(a) * 70, y0 + 90 + Math.sin(a) * 80); c.stroke(); } } }
    else { c.fillStyle = '#0b1530'; c.fillRect(x - 62, y0, 124, h); c.fillStyle = 'rgba(160,210,255,.7)'; c.beginPath(); c.moveTo(x - 62, y0); c.lineTo(x - 30, y0); c.lineTo(x - 62, y0 + 50); c.fill(); c.beginPath(); c.moveTo(x + 62, y0 + h); c.lineTo(x + 20, y0 + h); c.lineTo(x + 62, y0 + h - 60); c.fill(); }
    c.strokeStyle = '#1e2229'; c.lineWidth = 6; c.strokeRect(x - 62, y0, 124, h); if (G.st !== 'go'){ c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 + h); c.moveTo(x - 62, y0 + h / 2); c.lineTo(x + 62, y0 + h / 2); c.stroke(); }
    c.fillStyle = '#5a606a'; c.fillRect(x - 80, y0 + h + 10, 160, 12);
  } else if (G.kind === 'ladder'){
    const lg = c.createLinearGradient(0, 0, 0, 260); lg.addColorStop(0, 'rgba(255,240,190,.55)'); lg.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = lg; c.fillRect(x - 60, 0, 120, 260);
    c.fillStyle = '#1a1c22'; c.fillRect(x - 56, 0, 112, 26);
    c.strokeStyle = '#a0662a'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 22, 0); c.lineTo(x - 22, GROUND); c.moveTo(x + 22, 0); c.lineTo(x + 22, GROUND); c.stroke();
    c.lineWidth = 4; for (let y = 24; y < GROUND; y += 26){ c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x + 22, y); c.stroke(); }
  } else if (G.kind === 'hatch'){
    c.fillStyle = '#050505'; c.beginPath(); c.ellipse(x, GROUND + 6, 58, 12, 0, 0, 7); c.fill();
    c.fillStyle = '#5d646c'; c.save(); c.translate(x + 58, GROUND + 4); c.rotate(G.st === 'go' ? -1.3 : -.15); c.fillRect(-4, -12, 8, 12); c.fillRect(0, -10, 6, 10); c.restore();
    c.strokeStyle = '#a0662a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 16, GROUND - 26); c.lineTo(x - 16, GROUND + 8); c.moveTo(x + 16, GROUND - 26); c.lineTo(x + 16, GROUND + 8); c.stroke();
  }
  c.restore();
}
function drawGateUI(c, L){
  const G = L.gate; if (!G || G.st !== 'wait' || L.doneT < 2.2) return;
  const sx = G.x - L.camX, bob = Math.sin(gameTime * 6) * 6;
  if (sx > W - 30) txt(c, '➡ ' + GATE_TXT[G.kind], W - 24, 300, 22, '#f2c230', 'right', '900', 5);
  else { pill(c, GATE_TXT[G.kind], sx, (G.kind === 'window' ? GROUND - 290 : G.kind === 'hatch' ? GROUND - 90 : GROUND - 270) + bob, 16, 'rgba(10,16,40,.9)', '#f2c230', { border:'#f2c230' }); }
}

/* ---------- çizim ---------- */
function drawPlatform(c, p){
  if (p.step){ const g = c.createLinearGradient(0, p.y, 0, GROUND); g.addColorStop(0, '#7b828e'); g.addColorStop(1, '#4b505a'); c.fillStyle = g; c.fillRect(p.x1, p.y, p.x2 - p.x1, GROUND - p.y);
    c.fillStyle = '#a7aeb9'; c.fillRect(p.x1, p.y, p.x2 - p.x1, 5); c.fillStyle = '#f2c230'; c.fillRect(p.x1, p.y + 5, p.x2 - p.x1, 3); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(p.x1, p.y, p.x2 - p.x1, GROUND - p.y); return; }
  if (p.style === 'balcony'){ const w = p.x2 - p.x1; c.fillStyle = '#23262e'; c.fillRect(p.x1, p.y, w, 10);
    c.strokeStyle = '#2b2f37'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x1, p.y - 46); c.lineTo(p.x2, p.y - 46); c.moveTo(p.x1, p.y - 24); c.lineTo(p.x2, p.y - 24); c.stroke();
    for (let x = p.x1; x <= p.x2; x += 18){ c.beginPath(); c.moveTo(x, p.y); c.lineTo(x, p.y - 46); c.stroke(); }
    c.strokeStyle = '#1a1c22'; c.lineWidth = 5; c.beginPath(); c.moveTo(p.x1 + 10, p.y + 10); c.lineTo(p.x1 + 60, p.y - 120); c.moveTo(p.x2 - 10, p.y + 10); c.lineTo(p.x2 - 60, p.y - 120); c.stroke();
    if (p.ladder !== false){ const lx = p.ladderX || p.x1 - 26; c.strokeStyle = '#2b2f37'; c.lineWidth = 4; c.beginPath(); c.moveTo(lx, p.y); c.lineTo(lx, GROUND); c.moveTo(lx + 22, p.y); c.lineTo(lx + 22, GROUND); c.stroke(); c.lineWidth = 3; for (let y = p.y + 14; y < GROUND; y += 18){ c.beginPath(); c.moveTo(lx, y); c.lineTo(lx + 22, y); c.stroke(); } }
    return; }
  if (p.style === 'scaffold'){ const w = p.x2 - p.x1; c.strokeStyle = '#8a929c'; c.lineWidth = 5; for (let x = p.x1 + 6; x <= p.x2; x += 110){ c.beginPath(); c.moveTo(x, p.y); c.lineTo(x, GROUND); c.stroke(); }
    c.lineWidth = 3; for (let x = p.x1 + 6; x + 110 <= p.x2 + 6; x += 110){ c.beginPath(); c.moveTo(x, p.y); c.lineTo(x + 110, GROUND); c.moveTo(x + 110, p.y); c.lineTo(x, GROUND); c.stroke(); }
    c.fillStyle = '#b07a3a'; c.fillRect(p.x1, p.y, w, 12); c.strokeStyle = '#6b4a22'; c.lineWidth = 2; for (let x = p.x1; x < p.x2; x += 40) c.strokeRect(x, p.y, 40, 12);
    if (p.ladder !== false){ const lx = p.ladderX || p.x1 - 26; c.strokeStyle = '#a0662a'; c.lineWidth = 4; c.beginPath(); c.moveTo(lx, p.y); c.lineTo(lx, GROUND); c.moveTo(lx + 22, p.y); c.lineTo(lx + 22, GROUND); c.stroke(); c.lineWidth = 3; for (let y = p.y + 14; y < GROUND; y += 20){ c.beginPath(); c.moveTo(lx, y); c.lineTo(lx + 22, y); c.stroke(); } }
    return; }
  const w = p.x2 - p.x1;
  c.fillStyle = '#2b2f37'; for (let x = p.x1 + 20; x < p.x2; x += 140) c.fillRect(x, p.y + 12, 12, GROUND - p.y - 12);
  c.fillStyle = '#5a606a'; c.fillRect(p.x1, p.y, w, 14); c.fillStyle = '#7a828c'; c.fillRect(p.x1, p.y, w, 4);
  c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(p.x1, p.y, w, 14);
  c.strokeStyle = '#8a929c'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x1, p.y - 34); c.lineTo(p.x2, p.y - 34); c.stroke();
  for (let x = p.x1 + 6; x <= p.x2; x += 36){ c.beginPath(); c.moveTo(x, p.y); c.lineTo(x, p.y - 34); c.stroke(); }
  if (p.ladder !== false){ const lx = p.ladderX || p.x1 - 26; c.strokeStyle = '#a0662a'; c.lineWidth = 4; c.beginPath(); c.moveTo(lx, p.y); c.lineTo(lx, GROUND); c.moveTo(lx + 22, p.y); c.lineTo(lx + 22, GROUND); c.stroke();
    c.lineWidth = 3; for (let y = p.y + 14; y < GROUND; y += 20){ c.beginPath(); c.moveTo(lx, y); c.lineTo(lx + 22, y); c.stroke(); } }
}
function drawObj(c, o, t){
  if (o.broken && !o.held) return; const D = OBJ[o.t]; const jx = o.shakeT > 0 ? Math.sin(t * 80) * 3 : 0;
  const x = o.x - o.w / 2 + jx, y = o.y - o.h;
  c.lineWidth = 2.2; c.strokeStyle = INK;
  if (o.t === 'kutu'){ c.fillStyle = D.col; c.fillRect(x, y, o.w, o.h); c.strokeRect(x, y, o.w, o.h); c.strokeStyle = '#6b4a22'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 4, y + 4); c.lineTo(x + o.w - 4, y + o.h - 4); c.moveTo(x + o.w - 4, y + 4); c.lineTo(x + 4, y + o.h - 4); c.stroke(); c.strokeRect(x + 3, y + 3, o.w - 6, o.h - 6); }
  else if (o.t === 'koli'){ c.fillStyle = D.col; c.fillRect(x, y, o.w, o.h); c.strokeRect(x, y, o.w, o.h); c.fillStyle = '#a8814f'; c.fillRect(x + o.w / 2 - 5, y, 10, o.h); c.fillStyle = '#5a3f22'; c.font = fnt(9); c.fillText('⬆⬆', x + 4, y + 14); }
  else if (o.t === 'dolap'){ c.fillStyle = D.col; c.fillRect(x, y, o.w, o.h); c.strokeRect(x, y, o.w, o.h); c.strokeStyle = '#3d4a58'; c.strokeRect(x + 5, y + 5, o.w / 2 - 7, o.h - 10); c.strokeRect(x + o.w / 2 + 2, y + 5, o.w / 2 - 7, o.h - 10);
    c.fillStyle = '#c0c6cc'; c.fillRect(x + o.w / 2 - 6, y + o.h / 2, 3, 12); c.fillRect(x + o.w / 2 + 4, y + o.h / 2, 3, 12); for (let j = 0; j < 3; j++){ c.fillStyle = '#2d3640'; c.fillRect(x + 10, y + 14 + j * 6, 16, 2); c.fillRect(x + o.w / 2 + 8, y + 14 + j * 6, 16, 2); } }
  else if (o.t === 'varil'){ c.fillStyle = D.col; rr(c, x, y, o.w, o.h, 8); c.fill(); c.stroke(); c.fillStyle = '#4a1a10'; c.fillRect(x, y + 12, o.w, 5); c.fillRect(x, y + o.h - 17, o.w, 5); c.fillStyle = '#ffcc00'; c.font = fnt(14); c.fillText('⚠', x + o.w / 2 - 7, y + o.h / 2 + 5); }
  else if (o.t === 'cop'){ c.fillStyle = D.col; c.beginPath(); c.moveTo(x + 3, y + 8); c.lineTo(x + o.w - 3, y + 8); c.lineTo(x + o.w - 7, y + o.h); c.lineTo(x + 7, y + o.h); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.3)'; for (let k = 1; k < 4; k++){ c.beginPath(); c.moveTo(x + 5 + k, y + 8 + k * 13); c.lineTo(x + o.w - 5 - k, y + 8 + k * 13); c.stroke(); }
    c.fillStyle = shade(D.col, 1.2); c.beginPath(); c.ellipse(x + o.w / 2, y + 7, o.w / 2 + 2, 6, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.stroke(); c.fillRect(x + o.w / 2 - 6, y - 2, 12, 4); }
  else if (o.t === 'sise'){ c.fillStyle = D.col; rr(c, x, y + 8, o.w, o.h - 8, 3); c.fill(); c.stroke(); c.fillRect(x + 3, y, 6, 10); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 2, y + 10, 2, 12); }
}
function drawPickup(c, k){
  if (k.kind === 'hp'){ const bob = Math.sin(k.t * 5) * 4; c.fillStyle = '#7ec8ff'; rr(c, k.x - 8, k.y - 36 + bob, 16, 28, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.fillStyle = '#1e6bd6'; c.fillRect(k.x - 4, k.y - 42 + bob, 8, 6); c.fillStyle = '#ffffff'; c.fillRect(k.x - 8, k.y - 26 + bob, 16, 6);
    if (Math.sin(k.t * 6) > 0){ c.fillStyle = '#ff4d6d'; drawStar(c, k.x + 12, k.y - 44 + bob, 4); } return; }
  c.save(); c.translate(k.x, k.y - 6); drawHeld(c, k.w, Math.PI / 2 + .05); c.restore();
  if (Math.sin(k.t * 5) > .3){ c.strokeStyle = 'rgba(242,194,48,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(k.x + 20, k.y - 4, 34, 8, 0, 0, 7); c.stroke(); }
}
function drawEnemy(c, e, L){
  if (e.hide3) return;
  if (e.dummy){
    c.save(); c.translate(e.x, GROUND); c.rotate(e.dead ? e.fall * (e.fallDir || 1) : e.wob * .06);
    c.fillStyle = '#6b4226'; c.fillRect(-6, -100, 12, 100); c.fillRect(-30, -78, 60, 9);
    c.fillStyle = '#c49a6c'; rr(c, -18, -96, 36, 52, 10); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(0, -112, 14, 0, 7); c.fill(); c.stroke(); c.restore(); return;
  }
  const alpha = e.dead ? Math.max(0, 1 - Math.max(0, e.deadT - 1.1) / .7) : (e.inv > 0 && e.hop > 0 ? .55 : 1);
  let tint = null;
  if (e.flash > 0) tint = '#ffffff';
  else if (e.wind > 0 && Math.floor(e.wind * 14) % 2 === 0) tint = e.move === 'slam' ? '#ffa000' : e.move === 'dash' ? '#ff00aa' : '#ff3b3b';
  const sc = e.look.scale || 1;
  const b = H3on ? R3.bgFrom(c) : c;
  if (e.T.boss && !e.dead){ const g = b.createRadialGradient(e.x, e.y - 70 * sc, 10, e.x, e.y - 70 * sc, 110 * sc); g.addColorStop(0, 'rgba(255,40,40,.18)'); g.addColorStop(1, 'rgba(255,40,40,0)'); b.fillStyle = g; b.fillRect(e.x - 120 * sc, e.y - 190 * sc, 240 * sc, 200 * sc); }
  if (e.dashing > 0){ const bb = H3on ? R3.bgFrom(c) : c; H3on = false; for (let i = 1; i < 4; i++) drawHuman(bb, e.x - e.face * i * 26, e.y, e.look, getPose(e), e.face, 1, .18, '#ff4da6'); H3on = b !== c; }
  if (!H3on){ c.globalAlpha = alpha * .28; c.fillStyle = '#000000'; c.beginPath(); c.ellipse(e.x, e.y + 3, 26 * sc, 6, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
  drawHuman(c, e.x, e.y, e.look, getPose(e), e.face, 1, alpha, tint, exprOf(e), false, e.weapon ? e.weapon.t : null);
  const top = e.y - 140 * sc;
  if (e.wind > 0 && e.move === 'slam') txt(c, '⬆ ZIPLA!', e.x, top - 6, 20, '#ffa000', 'center', 'bold', 4);
  if (!e.dead && !e.T.boss && e.hp < e.maxhp && e.down <= 0){ c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(e.x - 25, top, 50, 6); c.fillStyle = '#ff5252'; c.fillRect(e.x - 25, top, 50 * Math.max(0, e.hp) / e.maxhp, 6); }
  if ((e.dizzy > 0 || (e.down > 0) || (e.dead && e.deadT < 1.5))){ const hp2 = headPos(e, sc); dizzyStars(c, hp2[0], hp2[1] - (e.down > 0 || e.dead ? 6 : 18), gameTime, e.dizzy > 0 ? 4 : 3, e.dizzy > 0 ? 22 : 18); }
}
function fHold(f, D3){ if (f.__hold !== undefined) return f.__hold === 0 ? null : (!D3 && String(f.__hold).startsWith('carry_') ? 'box' : f.__hold); return f.carry ? (D3 ? 'carry_' + f.carry.t : 'box') : f.weapon ? f.weapon.t : null; }
function drawLevel(c, L){
  const def = L.def, sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
  L.st.camX = L.camX;
  c.save();
  if (FX.zoom > 1.001){ const zx = FX.zx - L.camX; c.translate(zx, FX.zy); c.scale(FX.zoom, FX.zoom); c.translate(-zx, -FX.zy); }
  const p = L.p;
  if (p.dizzy > 0){ c.translate(480, 270); c.rotate(Math.sin(gameTime * 5) * .025); c.translate(-480 + Math.sin(gameTime * 7) * 6, -270); }
  c.translate(sx, sy);
  const D3 = R3.side(GROUND), B = D3 ? () => R3.bgFrom(c) : () => c;
  drawBg(B(), def.bg, L.st, L.time);
  c.translate(-Math.round(L.camX), 0);
  if (D3) R3.ground(scrY(c, GROUND));
  if (def.drawWorld) def.drawWorld(L, B());
  for (const pl of def.platforms || []) drawPlatform(B(), pl);
  drawGate(B(), L);
  for (const o of L.objs) if (!o.held) drawObj(B(), o, gameTime);
  for (const k of L.pickups) drawPickup(B(), k);
  { const b = B(); for (const s of L.shocks){ b.globalAlpha = Math.min(1, s.life * 2); b.fillStyle = '#c9a26b'; for (const dir of [1, -1]) for (let i = 0; i < 5; i++){ b.beginPath(); b.arc(s.x + dir * (s.r || 0) - dir * i * 10, s.y - 6 - i * 3, 12 - i * 2, 0, 7); b.fill(); } b.globalAlpha = 1; } }
  for (const cr of def.crowd || []){ if (cr[1] - L.camX < -90 || cr[1] - L.camX > W + 90) continue;
    const hype = L.combo >= 3 && L.comboT > 0, P = getPose({ animT:L.time * (hype ? 1.4 : 1) + cr[1], pose:hype ? 'cheer' : cr[2] || 'arms' });
    if (D3) R3.zNext = -1.9; drawHuman(c, cr[1], 404, LOOK[cr[0]], P, cr[3] || -1, .82, 1, null, hype ? 'happy' : 'shock'); }
  for (const e of L.ents) drawEnemy(c, e, L);
  if (!p.hideG && !(p.inv > 0 && p.down <= 0 && p.getup <= 0 && !(p.atk && p.atk.m.special) && Math.floor(p.inv * 20) % 2 === 0)){
    if (!D3){ c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(p.x, (p.plat ? p.plat.y : GROUND) + 3, 26, 6, 0, 0, 7); c.fill(); }
    if (p.slideT > 0){ const bb = D3 ? R3.bgFrom(c) : c; H3on = false; for (let i = 1; i < 3; i++) drawHuman(bb, p.x - p.face * i * 22, p.y, p.look, getPose(p), p.face, 1, .2, '#9ad7ff'); H3on = D3; }
    drawHuman(c, p.x, p.y, p.look, getPose(p), p.face, 1, 1, null, exprOf(p), false, fHold(p, D3));
    if (p.carry && !D3){ const o = p.carry; c.save(); c.translate(0, 0); const D = OBJ[o.t]; c.fillStyle = D.col; c.fillRect(p.x - o.w / 2, p.y - 170, o.w, o.h * .8); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(p.x - o.w / 2, p.y - 170, o.w, o.h * .8); c.restore(); }
    if (p.dizzy > 0 || p.down > 0){ const hp2 = headPos(p); dizzyStars(c, hp2[0], hp2[1] - 18, gameTime, 4, 22); }
  }
  if (L.duo && L.rp && !L.rp.hideG){ const q = L.rp; drawHuman(c, q.x, q.y, q.look, getPose(q), q.face, 1, q.dead ? .55 : 1, null, exprOf(q), false, fHold(q, D3));
    if (q.dizzy > 0 || q.down > 0){ const h2 = headPos(q); dizzyStars(c, h2[0], h2[1] - 18, gameTime, 4, 22); } }
  if (L.duo) for (const F of [L.p, L.rp]) if (!F.hideG){ const mine = F.kind === MP.char; pill(c, (mine ? '▼ SEN' : '▼ ' + (MP.peer && MP.peer.name || 'Arkadaşın')), F.x, F.y - 178, 11, mine ? 'rgba(242,194,48,.9)' : 'rgba(90,160,255,.9)', mine ? '#14306b' : '#ffffff'); }
  for (const pl of def.platforms || []) if (pl.ladder !== false){ const lx = (pl.ladderX || pl.x1 - 26) + 11; if (Math.abs(p.x - lx) < 90 && p.y > pl.y + 20 && !p.climb) pill(c, '⬆ TIRMAN', lx, pl.y - 24 + Math.sin(gameTime * 6) * 4, 13, 'rgba(10,16,40,.85)', '#f2c230'); }
  for (const b of L.proj){
    if (b.kind === 'ball' || b.kind === 'fire') drawBall(c, b.x, b.y, b.spin, b.kind === 'fire' ? 1.4 : 1, b.kind === 'fire' ? Math.sign(b.vx) : 0);
    else if (b.kind === 'obj'){ const D = OBJ[b.obj]; c.save(); c.translate(b.x, b.y); c.rotate(b.spin * .1); c.fillStyle = D.col; c.fillRect(-20, -18, 40, 36); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-20, -18, 40, 36); c.restore(); }
    else { c.save(); c.translate(b.x, b.y); drawHeld(c, b.w, b.spin * .2); c.restore(); } }
  fxDrawWorld(c, L);
  for (const b of L.bursts) burst(c, b.x, b.y, (b.big ? 30 : 20) * (1 + b.t * 4), b.big ? '#ffffff' : '#fff3a0', 1 - b.t / .18);
  for (const q of L.parts){ if (q.type === 'streak') continue; c.globalAlpha = Math.min(1, q.life / .25); c.fillStyle = q.col;
    if (q.type === 'star') drawStar(c, q.x, q.y, 7);
    else if (q.type === 'chip'){ c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillRect(-5, -2, 10, 4); c.restore(); }
    else if (q.type === 'glass'){ c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.beginPath(); c.moveTo(0, -4); c.lineTo(3, 3); c.lineTo(-3, 3); c.fill(); c.restore(); }
    else if (q.type === 'dust'){ c.beginPath(); c.arc(q.x, q.y, 6 + (1 - q.life) * 10, 0, 7); c.fill(); }
    else c.fillRect(q.x - 2.5, q.y - 2.5, 5, 5); }
  c.globalAlpha = 1;
  for (const t of L.texts){ c.globalAlpha = Math.max(0, 1 - t.t / 1.2); txt(c, t.text, t.x, t.y - t.t * 50, t.size || 30, t.col, 'center', 'bold', 5); }
  c.globalAlpha = 1;
  c.restore();
  if (p.dizzy > 0){ c.fillStyle = 'rgba(140,60,200,' + (.12 + .06 * Math.sin(gameTime * 8)) + ')'; c.fillRect(0, 0, W, H); }
  if (FX.flash > 0){ c.fillStyle = 'rgba(255,240,200,' + FX.flash + ')'; c.fillRect(0, 0, W, H); }
  drawWeather(c, def.weather, L.time, L.camX);
  fxDrawScreen(c, L);
  drawGateUI(c, L);
  vignette(c, .35);
  if (L.fade > 0 || L.fadeIn > 0){ c.fillStyle = 'rgba(0,0,0,' + Math.max(L.fade || 0, L.fadeIn || 0) + ')'; c.fillRect(0, 0, W, H); }
  drawFightHud(c, L);
}
const PAUSE_BTN = { x: W - 52, y: 10, w: 40, h: 36 };
function hpBar(c, x, y, w, f, active){
  c.fillStyle = active ? 'rgba(0,0,0,.65)' : 'rgba(0,0,0,.4)'; rr(c, x, y, w, 46, 10); c.fill();
  if (active){ c.strokeStyle = '#f2c230'; c.lineWidth = 2; c.stroke(); }
  c.save(); c.beginPath(); c.arc(x + 22, y + 23, 18, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip(); drawPortrait(c, x + 22, y + 25, 12, f.kind, f.dead ? 'ko' : f.hp < 30 ? 'pain' : 'neutral'); c.restore();
  txt(c, NAMES[f.mk], x + 46, y + 15, 13, active ? '#ffffff' : '#aab4cc');
  if (f.weapon) txt(c, f.weapon.t.toUpperCase() + ' ×' + f.weapon.uses, x + w - 10, y + 15, 11, '#f2c230', 'right');
  c.fillStyle = '#3a0d0d'; rr(c, x + 46, y + 20, w - 56, 10, 4); c.fill();
  const r = Math.max(0, f.hp) / f.maxhp; c.fillStyle = r > .5 ? '#2ecc71' : r > .25 ? '#f1c40f' : '#e74c3c';
  if (r > 0){ rr(c, x + 46, y + 20, (w - 56) * r, 10, 4); c.fill(); }
  c.fillStyle = '#2a2410'; rr(c, x + 46, y + 34, w - 56, 6, 3); c.fill();
  c.fillStyle = f.sup >= 100 ? (Math.sin(gameTime * 10) > 0 ? '#fff176' : '#f2c230') : '#c9a227'; if (f.sup > 0){ rr(c, x + 46, y + 34, (w - 56) * f.sup / 100, 6, 3); c.fill(); }
}
function drawFightHud(c, L){
  L.team.forEach((f, i) => hpBar(c, 12 + i * 212, 8, 202, f, f === L.p));
  if (L.obj) pill(c, L.obj, L.team.length > 1 ? 640 : 520, 30, 18, 'rgba(0,0,0,.65)', '#f2c230', { maxW:L.team.length > 1 ? 380 : 520 });
  if (L.surviveT != null && !L.done){ const s = Math.max(0, Math.ceil(L.surviveT)); txt(c, '⏱ 0:' + String(s).padStart(2, '0'), 480, 92, 34, s <= 5 ? '#7dff9a' : '#ffffff', 'center', '900', 5); }
  if (L.limitT != null && !L.done){ const s = Math.max(0, Math.ceil(L.limitT)); txt(c, '🚨 ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), 480, 92, 30, s <= 10 ? '#ff5a5a' : '#ffffff', 'center', '900', 5); }
  if (L.hint && L.hintT > 0){ c.globalAlpha = Math.min(1, L.hintT); pill(c, L.hint, 480, 118, 16, 'rgba(20,48,107,.9)', '#ffffff'); c.globalAlpha = 1; }
  const b = L.bossE;
  if (b && !b.dead){ const bw = 420, bx = W / 2 - bw / 2, by = 186;
    c.fillStyle = 'rgba(0,0,0,.65)'; rr(c, bx - 8, by - 24, bw + 16, 44, 8); c.fill(); txt(c, b.T.name, bx, by - 6, 16, '#ff5a5a', 'left', '900');
    c.fillStyle = '#3a0d0d'; c.fillRect(bx, by + 2, bw, 10); c.fillStyle = '#e74c3c'; c.fillRect(bx, by + 2, bw * Math.max(0, b.hp) / b.maxhp, 10); }
  if (L.bossIntro > 0 && b){ const k = L.bossIntro; c.fillStyle = 'rgba(0,0,0,' + Math.min(.65, k) + ')'; c.fillRect(0, 200, W, 140);
    c.save(); c.beginPath(); c.arc(260, 270, 60, 0, 7); c.fillStyle = '#2a0c12'; c.fill(); c.clip(); drawPortrait(c, 260, 272, 40, b.T.look, 'angry'); c.restore();
    txt(c, b.T.name, 540, 285, 60, '#ff4040', 'center', 'italic 900', 8, 520); txt(c, 'BOSS', 540, 318, 18, '#ffffff', 'center'); }
  if (L.superBanner){ const k = L.superBanner.t; c.globalAlpha = Math.min(1, k * 2); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 210, W, 110);
    c.save(); c.beginPath(); c.arc(200, 265, 46, 0, 7); c.fillStyle = '#4a2a00'; c.fill(); c.clip(); drawPortrait(c, 200, 267, 32, L.superBanner.kind, 'shout'); c.restore();
    txt(c, L.superBanner.name, 560, 285, 56, '#ffb300', 'center', 'italic 900', 8, 600); c.globalAlpha = 1; }
  drawStyleRank(c, L);
  if (L.combo >= 3 && L.comboT > 0){ c.globalAlpha = Math.min(1, L.comboT * 2); txt(c, L.combo + ' KOMBO!', W - 28, 150, 30 + Math.min(14, L.combo), '#f2c230', 'right', 'italic 900', 5); c.globalAlpha = 1; }
  if (L.bark && L.barkT > 0){ const sp = SPEAKERS[L.bark.who]; c.globalAlpha = Math.min(1, L.barkT * 2);
    const by0 = 214; c.font = fnt(16, 'normal'); const bw = Math.min(560, c.measureText(L.bark.t).width + 110);
    c.fillStyle = 'rgba(8,12,30,.92)'; rr(c, 12, by0, bw, 56, 12); c.fill(); c.strokeStyle = sp.col; c.lineWidth = 2; c.stroke();
    c.save(); c.beginPath(); c.arc(42, by0 + 28, 22, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip(); drawPortrait(c, 42, by0 + 30, 15, sp.look, L.bark.e || 'shout', true); c.restore();
    txt(c, L.bark.who, 74, by0 + 22, 14, sp.col); txt(c, L.bark.t, 74, by0 + 44, 16, '#ffffff', 'left', 'normal', 0, bw - 86); c.globalAlpha = 1; }
  if (L.go && !L.active && !L.done && Math.sin(gameTime * 7) > -.3) txt(c, 'İLERLE ▶', W - 24, 250, 30, '#f2c230', 'right', '900', 5);
  c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 9, 5, 18); c.fillRect(PAUSE_BTN.x + 23, PAUSE_BTN.y + 9, 5, 18);
  if (L.frozen && !(L.entry && !L.entry.done) && !(L.banT > .6)){ c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, H); c.globalAlpha = .7 + Math.sin(gameTime * 5) * .3; pill(c, 'Hazırsan herhangi bir tuşa bas ▶', 480, 300, 24, 'rgba(10,16,40,.9)', '#f2c230', { border:'#f2c230' }); c.globalAlpha = 1; }
  if (L.done && L.rank && !(L.def.gate && L.doneT > 2.2)){ const k = Math.min(1, L.doneT * 3); c.fillStyle = 'rgba(0,0,0,' + .45 * k + ')'; c.fillRect(0, 190, W, 160);
    txt(c, L.obj || 'Tamam!', 480, 236, 26, '#ffffff', 'center', 'bold', 4, 800);
    c.save(); c.translate(480, 300); c.scale(2 - k, 2 - k); txt(c, 'DERECE: ' + L.rank, 0, 14, 44, { S:'#ffd700', A:'#7dff9a', B:'#9ad7ff', C:'#ff9a6b' }[L.rank], 'center', 'italic 900', 6); c.restore(); }
  if (L.pauseM) drawPause(c);
  if (L.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H);
    txt(c, L.loseMsg ? L.loseMsg.toUpperCase() : 'YENİLDİN!', 480, 230, 50, '#ff6b6b', 'center', '900', 0, 800);
    txt(c, 'Pes etmek yok. Şampiyonlar tekrar kalkar.', 480, 280, 22, '#ffffff', 'center', 'normal');
    tapHint(c, 480, 340, L.lostT > .8, 'Tekrar dene ▶'); }
}
function drawPause(c){
  c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(0, 0, W, H);
  txt(c, 'DURAKLATILDI', 480, 160, 42, '#f2c230', 'center', 'italic 900');
  button(c, { x:330, y:200, w:300, h:54 }, '▶  Devam', true, gameTime);
  button(c, { x:330, y:266, w:300, h:50, size:20 }, '↺  Yeniden başla');
  button(c, { x:330, y:328, w:300, h:50, size:20 }, '⌂  Ana menü');
  txt(c, cur && cur.d3 ? 'Kontroller: joystick koş (kameraya göre) · 👊 yumruk serisi · 🦵 tekme/şut · ⬆ zıpla · 🛡️ blok · 🛡️+👊 aparkat · 🛡️+🦵 süpürme · 💨 kayarak kaç · ✋ al/fırlat · ⭐ süper · 📹 kamera'
    : 'Kontroller: 👊 yumruk · 🦵 tekme/şut · ⬇+🦵 süpürme · 💨 kayarak tekme · ✋ al/fırlat · ⭐ süper · havada 👊/🦵 uçan vuruş', 480, 420, 13, '#c8d3ff', 'center', 'normal', 0, 900);
}
