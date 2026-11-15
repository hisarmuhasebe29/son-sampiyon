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
           sweep:{ dur:.4, a:.12, b:.24, range:90, dmg:9, kb:120, anim:'kick', down:true, low:true }, air:{ dur:.55, a:.04, b:.5, range:72, dmg:13, kb:320, anim:'kick', down:true } },
  ufis:  { punch:[{ dur:.21, a:.05, b:.13, range:64, dmg:7, kb:120, anim:'punch' }, { dur:.21, a:.05, b:.13, range:64, dmg:7, kb:140, anim:'punch' }, { dur:.32, a:.08, b:.19, range:70, dmg:13, kb:360, anim:'punch', heavy:true, down:true }],
           kick:{ dur:.4, a:.12, b:.26, range:94, dmg:14, kb:440, anim:'kick', heavy:true },
           sweep:{ dur:.38, a:.1, b:.24, range:96, dmg:10, kb:120, anim:'kick', down:true, low:true }, air:{ dur:.55, a:.04, b:.5, range:76, dmg:15, kb:360, anim:'kick', down:true } },
};
const WEAPONS = { sopa:{ dmg:15, range:98, dur:.4, kb:380, uses:7, sfx:'wood' }, boru:{ dmg:18, range:104, dur:.48, kb:420, uses:9, sfx:'metal' }, sise:{ dmg:14, range:80, dur:.32, kb:260, uses:1, sfx:'glass' } };
const OBJ = {
  kutu:{ w:52, h:52, hp:18, solid:1, carry:1, col:'#a0723f', sfx:'wood', tdmg:16 },
  koli:{ w:46, h:38, hp:6,  solid:1, carry:1, col:'#c9a26b', sfx:'card', tdmg:8 },
  dolap:{ w:62, h:118, hp:34, solid:1, carry:0, col:'#5d6b7a', sfx:'metal' },
  varil:{ w:46, h:62, hp:28, solid:1, carry:1, col:'#7a2a1a', sfx:'metal', tdmg:22, heavy:1 },
  sise:{ w:12, h:26, hp:1, solid:0, carry:0, col:'#2e8b57', sfx:'glass', weapon:'sise' },
};
const ETYPES = {
  dummy:   { hp:22 },
  thug:    { look:'thug',    hp:32, speed:118, range:58, dmg:8,  windT:.48, dz:26, wpn:[['sopa', .45]] },
  masked:  { look:'masked',  hp:34, speed:128, range:58, dmg:9,  windT:.45, dz:28, wpn:[['sise', .2]] },
  guard:   { look:'guard',   hp:36, speed:112, range:60, dmg:9,  windT:.5,  dz:30, wpn:[['sopa', .35]] },
  kicker:  { look:'kicker',  hp:26, speed:175, range:76, dmg:8,  windT:.32, dz:22, kick:true },
  shield:  { look:'shieldg', hp:46, speed:88,  range:60, dmg:10, windT:.55, dz:40, shield:true },
  brute:   { look:'brute',   hp:80, speed:85,  range:76, dmg:14, windT:.7,  dz:50, big:true, wpn:[['boru', .55]] },
  yardimci:{ look:'yardimci',hp:300, speed:170, range:62, dmg:11, windT:.36, dz:80, boss:true, name:'YARDIMCI', combo:2, dodge:.28, dash:true },
  narak:   { look:'narak',   hp:420, speed:210, range:68, dmg:12, windT:.28, dz:95, boss:true, name:'NARAK', combo:3, dodge:.42, dash:true },
  dovuscu: { look:'dovuscu', hp:480, speed:110, range:84, dmg:17, windT:.6,  dz:110, boss:true, name:'YENİ DÖVÜŞÇÜ', combo:1, slam:true, big:true },
  lider:   { look:'lider',   hp:580, speed:155, range:66, dmg:13, windT:.38, dz:100, boss:true, name:'LİDER', combo:2, dodge:.3, dash:true, slam:true, summon:true },
};
function makeFighter(kind, x){
  return { kind, mk: kind === 'ufisGenc' ? 'ufis' : kind, x, y:GROUND, vx:0, vy:0, face:1, hp:100, maxhp:100, look:LOOK[kind], animT:0, atk:null, stun:0, inv:0, cd:0,
    onGround:true, plat:null, combo:0, lastAtkEnd:-9, blocking:false, dead:false, defE:'neutral', sup:0, dz:0, dizzy:0, down:0, getup:0, slideT:0, slideCd:0, weapon:null, carry:null, dropT:0 };
}
function makeEnemy(type, x, o = {}){
  const T = ETYPES[type], D = DIFF();
  const e = { type, T, x, y:o.y || GROUND, vx:0, vy:0, face:o.face || -1, animT:Math.random() * 3, stun:0, wind:0, strike:0, cd:rand(.6, 1.4), dead:false, deadT:0, onGround:true, plat:null,
    inv:0, hop:0, dashing:0, comboN:0, hits:0, hitT:0, armorT:0, defE:'angry', dz:0, dizzy:0, down:0, getup:0, weapon:null, flash:0, jumpCd:0, dropT:0 };
  if (type === 'dummy') return Object.assign(e, { dummy:true, hp:22, maxhp:22, wob:0, wv:0, fall:0, cd:0 });
  e.look = LOOK[T.look]; e.hp = e.maxhp = Math.round(T.hp * D.hp); if (T.boss) e.cd = 1.2;
  if (o.weapon !== undefined) e.weapon = o.weapon ? { t:o.weapon, uses:WEAPONS[o.weapon].uses } : null;
  else if (T.wpn) for (const [w, p] of T.wpn) if (Math.random() < p){ e.weapon = { t:w, uses:WEAPONS[w].uses }; break; }
  return e;
}
const alive = L => L.ents.filter(e => !e.dead && !e.dummy);
function spawnParts(L, x, y, col, n, type = 'spark', sp = 260){ for (let i = 0; i < n; i++) L.parts.push({ x, y, vx:rand(-sp, sp), vy:rand(-sp * 1.2, sp * .2), life:rand(.25, .55), col, type, r:rand(0, 6) }); }
function floatText(L, x, y, text, col, size){ L.texts.push({ x, y, t:0, text, col, size }); }
function sameLevel(a, b){ return Math.abs(a.y - b.y) < 46; }

/* ---------- vuruş ---------- */
function hitEnemy(L, e, dmg, kb, dir, o = {}){
  if (e.dead) return;
  if (e.dummy){ e.hp -= dmg; e.wv += dir * 9; SFX.punch(); spawnParts(L, e.x, e.y - 90, '#ffe066', 6); L.bursts.push({ x:e.x - dir * 8, y:e.y - 92, t:0 });
    if (e.hp <= 0 && !e.dead){ e.dead = true; e.fallDir = dir; SFX.wood(); floatText(L, e.x, e.y - 130, 'DEVRİLDİ!', '#ffd34d'); } return; }
  if (e.down > 0 || e.inv > 0) return;
  const T = e.T, boss = T.boss;
  if (e.dizzy > 0) dmg = Math.round(dmg * 1.3);
  e.hp -= dmg; e.flash = .1; hitstop = o.heavy ? .09 : .05; shake = Math.max(shake, o.heavy ? 8 : 5);
  (o.heavy ? SFX.punchHeavy : SFX.punch)(); vib(o.heavy ? 40 : 20);
  L.combo = L.comboT > 0 ? L.combo + 1 : 1; L.comboT = 1.4; L.score += dmg * 10 + (L.combo >= 3 ? L.combo * 15 : 0);
  const p = L.p; if (p) p.sup = Math.min(100, p.sup + dmg * .9);
  L.bursts.push({ x:e.x - dir * 10, y:e.y - 88 * (e.look.scale || 1), t:0, big:o.heavy });
  spawnParts(L, e.x - dir * 8, e.y - 85 * (e.look.scale || 1), '#ffe066', o.heavy ? 12 : 7);
  if (e.weapon && (o.down || o.heavy) && Math.random() < .7) dropWeapon(L, e);
  e.dz += dmg;
  if (e.armorT > 0 && !o.down){ e.vx += kb * dir * .12; }
  else if (o.down && (!boss || e.hits >= 2 || o.super)){ knockDown(L, e, dir, kb); }
  else {
    e.hits = e.hitT > 0 ? e.hits + 1 : 1; e.hitT = .9;
    const thr = boss ? 4 : T.big ? 2 : 3;
    if (e.hits >= thr && e.hp > 0 && e.dizzy <= 0){
      e.hits = 0; e.armorT = boss ? 1 : .75; e.stun = 0; e.dashing = 0; e.strike = 0;
      if (boss && Math.random() < .4){ e.inv = .4; e.hop = .3; e.vx = dir * 520; e.cd = .15; }
      else { e.face = -dir; e.move = 'hit'; e.wind = T.windT * .6; e.vx = 0; }
      if (!L.armorHint){ L.armorHint = true; L.hint = 'Üst üste vurunca karşılık veriyorlar → 🛡️ blokla ya da ⬇ eğil!'; L.hintT = 4.5; }
    } else { e.wind = 0; e.strike = 0; e.dashing = 0; e.stun = boss ? .16 : .3; e.vx = kb * dir * (boss ? .35 : 1); e.cd = Math.max(e.cd, boss ? .25 : .35); }
  }
  if (e.dz >= T.dz * (boss ? 1 : DIFF().hp) && e.hp > 0 && e.down <= 0){ e.dz = 0; e.dizzy = boss ? 1.3 : 1.9; e.wind = 0; e.strike = 0; e.stun = 0; SFX.dizzy(); floatText(L, e.x, e.y - 150, 'SERSEM!', '#fff176', 26); if (e.weapon) dropWeapon(L, e); }
  if (e.hp <= 0){ killEnemy(L, e, dir); }
}
function knockDown(L, e, dir, kb){
  e.down = e.T && e.T.boss ? .7 : 1.0; e.vx = dir * Math.max(240, kb * .8); e.vy = -260; e.onGround = false; e.wind = 0; e.strike = 0; e.dashing = 0; e.stun = 0; e.hits = 0; e.flying = true;
  SFX.land(); if (e.weapon) dropWeapon(L, e);
}
function killEnemy(L, e, dir){
  e.dead = true; e.vy = -380; e.vx = dir * 280; e.onGround = false; e.flying = true; SFX.ko(); vib(60);
  const boss = e.T.boss; L.score += boss ? 1500 : 120;
  floatText(L, e.x, e.y - 140, boss ? 'K.O.!' : 'KO!', '#ff6b6b', boss ? 52 : 30);
  if (e.weapon) dropWeapon(L, e);
  const last = alive(L).length === 0 && (!L.def.waves || L.wi >= L.def.waves.length) && !L.def.survive;
  if (boss || last){ slowMo(e.x, e.y - 80, boss ? 1.6 : 1.0); hitstop = .15; shake = 16; if (boss){ SFX.bell(); say('Nakavt!', 'Spiker'); } }
  else if (Math.random() < .18) L.pickups.push({ x:e.x, y:e.y, kind:'hp', t:0 });
}
function dropWeapon(L, e){ if (!e.weapon) return; L.pickups.push({ x:e.x - e.face * 20, y:e.y, kind:'weapon', w:e.weapon.t, uses:e.weapon.uses, t:0, vy:-200, vx:-e.face * 120 }); e.weapon = null; SFX.metal(); }
function hurtPlayer(L, dmg, fromX, o = {}){
  const p = L.p; if (p.inv > 0 || p.dead || L.done || p.down > 0) return;
  if (p.slideT > 0 && !o.low) return;
  if (p.crouch && o.high && !o.unblockable){ floatText(L, p.x, p.y - 100, 'EĞİLDİ!', '#9ad7ff'); return; }
  dmg = Math.round(dmg * DIFF().dmg);
  const facing = (fromX - p.x) * p.face > 0;
  if (p.blocking && facing && !o.unblockable){
    p.hp -= Math.ceil(dmg * .15); SFX.block(); vib(15); shake = Math.max(shake, 3); p.sup = Math.min(100, p.sup + 4);
    spawnParts(L, p.x + p.face * 22, p.y - 78, '#9ad7ff', 8); p.x -= p.face * 14; floatText(L, p.x, p.y - 140, 'BLOK!', '#9ad7ff');
  } else {
    p.hp -= dmg; p.stun = .35; p.inv = .7; p.atk = null; p.vx = (p.x > fromX ? 1 : -1) * 220; p.dz += dmg; p.sup = Math.min(100, p.sup + dmg * .5);
    L.taken += dmg; SFX.hurt(); vib(80); shake = Math.max(shake, 9); spawnParts(L, p.x, p.y - 85, '#ff8080', 10);
    if (p.carry){ dropCarry(L, p); }
    if (o.down){ p.down = .8; p.vy = -240; p.onGround = false; }
    if (p.dz >= 45 && p.hp > 0){ p.dz = 0; p.dizzy = 1.5; SFX.dizzy(); floatText(L, p.x, p.y - 150, 'BAŞIN DÖNDÜ! Tuşlara bas!', '#fff176', 20); }
  }
  if (p.hp <= 0){ p.hp = 0; p.dead = true; SFX.ko(); }
}

/* ---------- fizik: zemin + platform + kutu üstü ---------- */
function surfaces(L){ const s = L.def.platforms ? L.def.platforms.slice() : [];
  for (const o of L.objs) if (!o.broken && !o.held && OBJ[o.t].solid) s.push({ x1:o.x - o.w / 2, x2:o.x + o.w / 2, y:o.y - o.h, obj:o });
  return s; }
function physics(L, f, dt, surf){
  const prevY = f.y;
  if (f.dropT > 0) f.dropT -= dt;
  if (f.onGround && f.plat && (f.x < f.plat.x1 - 4 || f.x > f.plat.x2 + 4 || (f.plat.obj && (f.plat.obj.broken || f.plat.obj.held)))){ f.onGround = false; f.plat = null; }
  if (!f.onGround) f.vy += 2300 * dt;
  f.y += f.vy * dt;
  if (f.vy >= 0 && f.dropT <= 0){
    for (const s of surf){ if (f.x >= s.x1 - 4 && f.x <= s.x2 + 4 && prevY <= s.y + 1 && f.y >= s.y){ f.y = s.y; f.vy = 0; if (!f.onGround) landed(L, f); f.onGround = true; f.plat = s; break; } }
  }
  if (f.y >= GROUND){ f.y = GROUND; f.vy = 0; if (!f.onGround) landed(L, f); f.onGround = true; f.plat = null; }
}
function landed(L, f){ if (f.flying || f.vy > 600){ spawnParts(L, f.x, f.y - 4, 'rgba(200,190,170,.8)', 8, 'dust', 160); SFX.land(); } f.flying = false; }

/* ---------- eşyalar ---------- */
function breakObj(L, o, dir = 1){
  if (o.broken) return; o.broken = true; const D = OBJ[o.t]; (SFX[D.sfx] || SFX.wood)(); shake = Math.max(shake, 4);
  spawnParts(L, o.x, o.y - o.h / 2, D.col, 16, o.t === 'sise' ? 'glass' : 'chip', 300);
  L.score += 30;
  const r = Math.random();
  if (o.drop){ if (o.drop === 'hp') L.pickups.push({ x:o.x, y:o.y, kind:'hp', t:0 }); else L.pickups.push({ x:o.x, y:o.y, kind:'weapon', w:o.drop, uses:WEAPONS[o.drop].uses, t:0 }); }
  else if (o.t === 'dolap'){ if (r < .45) L.pickups.push({ x:o.x, y:o.y, kind:'weapon', w:'boru', uses:WEAPONS.boru.uses, t:0 }); else if (r < .8) L.pickups.push({ x:o.x, y:o.y, kind:'hp', t:0 }); }
  else if (o.t === 'kutu' || o.t === 'koli'){ if (r < .25) L.pickups.push({ x:o.x, y:o.y, kind:'hp', t:0 }); else if (r < .4) L.pickups.push({ x:o.x, y:o.y, kind:'weapon', w:'sopa', uses:WEAPONS.sopa.uses, t:0 }); }
}
function hitObjects(L, x1, x2, y, dmg, dir){ for (const o of L.objs){ if (o.broken || o.held) continue; if (o.x + o.w / 2 > x1 && o.x - o.w / 2 < x2 && y > o.y - o.h - 30 && y < o.y + 30){ o.hp -= dmg; o.shakeT = .2; if (o.hp <= 0) breakObj(L, o, dir); } } }
function dropCarry(L, p){ const o = p.carry; if (!o) return; o.held = false; o.x = p.x + p.face * 30; o.y = p.plat ? p.plat.y : GROUND; p.carry = null; }
function throwThing(L, p, kind, extra){
  const y0 = p.y - 120;
  L.proj.push(Object.assign({ x:p.x + p.face * 20, y:y0, vx:p.face * 720, vy:-120, life:1.4, owner:'p', spin:0, hit:new Set() }, extra, { kind }));
  SFX.throwIt(); p.atk = { m:{ dur:.3, a:1, b:0, anim:'throw' }, t:0, hit:new Set() };
}

/* ---------- oyuncu ---------- */
function playerAttack(L, p, m, extra = {}){
  p.atk = Object.assign({ m, t:0, hit:new Set(), done:false }, extra); SFX.whiff();
  for (const e of L.ents){ if (!e.T || !e.T.dodge || e.dead || e.wind > 0 || e.strike > 0 || e.dashing > 0 || e.stun > 0 || e.dizzy > 0 || e.down > 0) continue;
    if (Math.abs(e.x - p.x) < 130 && Math.random() < e.T.dodge * DIFF().aggr * .85){ e.hop = .28; e.vx = -e.face * 470; e.inv = .32; } }
}
function updPlayer(L, dt, surf){
  const p = L.p, def = L.def, MV = MOVES[p.mk];
  p.animT += dt; if (p.inv > 0) p.inv -= dt; if (p.cd > 0) p.cd -= dt; if (p.slideCd > 0) p.slideCd -= dt; p.dz = Math.max(0, p.dz - dt * 8);
  if (p.dead){ p.vx *= .9; }
  else if (p.down > 0){ p.down -= dt; p.vx *= Math.pow(.05, dt); if (p.down <= 0){ p.getup = .3; p.inv = .6; } }
  else if (p.getup > 0){ p.getup -= dt; p.vx = 0; }
  else if (p.dizzy > 0){ p.dizzy -= dt; p.vx *= .8; for (const k of ['punch', 'kick', 'block', 'slide', 'grab', 'jump']) if (took(k)) p.dizzy -= .18; }
  else if (p.stun > 0){ p.stun -= dt; p.vx *= Math.pow(.01, dt); p.blocking = false; }
  else if (p.slideT > 0){ p.slideT -= dt; p.vx = p.face * 560 * Math.min(1, p.slideT * 4 + .3);
    for (const e of L.ents){ if (e.dead || p.atkHit && p.atkHit.has(e) || !sameLevel(e, p)) continue; if (Math.abs(e.x - (p.x + p.face * 30)) < 34){ (p.atkHit = p.atkHit || new Set()).add(e); hitEnemy(L, e, 10, 260, p.face, { down:true, heavy:true }); } }
    hitObjects(L, p.x - 20, p.x + 20, p.y, 8, p.face);
    if (p.slideT <= 0){ p.atkHit = null; p.vx = 0; } }
  else if (p.atk){
    const a = p.atk, m = a.m; a.t += dt;
    if (m.special === 'dragon'){ p.vx = p.face * 520; p.inv = .1;
      for (const e of L.ents){ if (e.dead || a.hit.has(e) || !sameLevel(e, p)) continue; if (Math.abs(e.x - p.x) < 70){ a.hit.add(e); hitEnemy(L, e, 24, 520, p.face, { down:true, heavy:true, super:true }); } }
      hitObjects(L, p.x - 60, p.x + 60, p.y, 30, p.face); }
    else if (m.ball){ if (!a.done && a.t >= m.a){ a.done = true; const fire = !!m.fire; L.proj.push({ kind:fire ? 'fire' : 'ball', x:p.x + p.face * 30, y:p.y - (fire ? 60 : 14), vx:p.face * (fire ? 900 : 840), vy:fire ? 0 : -150, life:1.4, owner:'p', spin:0, hit:new Set(), dmg:fire ? 28 : 14, pierce:fire, down:fire }); fire ? SFX.fire() : SFX.shoot(); vib(15); } }
    else if (a.t >= m.a && a.t <= m.b){
      const reach = m.range + (p.weapon && m.anim === 'swing' ? 0 : 0);
      for (const e of L.ents){ if (e.dead || a.hit.has(e)) continue;
        const dx = (e.x - p.x) * p.face;
        if (dx > -14 && dx < reach + (e.T && e.T.big ? 14 : 0) && Math.abs(e.y - p.y) < (a.air ? 110 : 70)){ a.hit.add(e);
          if (e.inv > 0) continue;
          if (e.T && e.T.shield && e.face === -p.face && !(m.anim === 'kick' || m.heavy || m.anim === 'swing') && e.stun <= 0 && e.dizzy <= 0){
            SFX.block(); spawnParts(L, e.x - p.face * 18, e.y - 80, '#9ad7ff', 8); p.vx = -p.face * 160; floatText(L, e.x, e.y - 140, 'KALKAN!', '#9ad7ff');
            if (!L.shieldHint){ L.shieldHint = true; L.hint = 'Kalkanlıya 🦵 tekme, 💨 kayarak tekme ya da silah!'; L.hintT = 5; } continue; }
          hitEnemy(L, e, m.dmg, m.kb, p.face, { heavy:m.heavy, down:m.down });
          if (m.anim === 'swing' && p.weapon){ p.weapon.uses--; (SFX[WEAPONS[p.weapon.t].sfx] || SFX.wood)(); if (p.weapon.uses <= 0){ if (p.weapon.t === 'sise') spawnParts(L, e.x, e.y - 90, '#2e8b57', 10, 'glass'); floatText(L, p.x, p.y - 150, 'Kırıldı!', '#ffffff'); p.weapon = null; } } } }
      if (!a.objHit){ a.objHit = true; hitObjects(L, Math.min(p.x, p.x + p.face * reach), Math.max(p.x, p.x + p.face * reach), p.y - (m.low ? 0 : 40), m.dmg, p.face); } }
    if (p.onGround && !m.special) p.vx *= Math.pow(.001, dt);
    if (a.t >= m.dur){ p.atk = null; p.lastAtkEnd = gameTime; }
  } else {
    p.crouch = !!keys.down && p.onGround && !p.carry;
    p.blocking = !!keys.block && p.onGround && !p.carry;
    const mv = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (p.blocking){ p.vx = 0; }
    else {
      p.vx = mv * (p.carry ? (OBJ[p.carry.t].heavy ? 150 : 200) : p.crouch ? 110 : 275); if (mv) p.face = mv;
      if (took('jump') && p.onGround){
        if (keys.down && p.plat && !p.plat.obj){ p.dropT = .3; p.onGround = false; p.plat = null; p.y += 2; }
        else { p.vy = -860; p.onGround = false; p.plat = null; L.jumped = true; SFX.jump(); } }
      if (took('grab')) grabAction(L, p);
      else if (took('super') && p.sup >= 100 && !p.carry) superMove(L, p);
      else if (took('slide') && p.onGround && p.slideCd <= 0 && !p.carry){ p.slideT = .38; p.slideCd = .7; SFX.slide(); }
      else if (took('punch')){
        if (p.carry) grabAction(L, p);
        else if (p.weapon){ const W2 = WEAPONS[p.weapon.t]; playerAttack(L, p, { dur:W2.dur, a:W2.dur * .3, b:W2.dur * .62, range:W2.range, dmg:W2.dmg, kb:W2.kb, anim:'swing', heavy:true, down:p.weapon.t !== 'sise' && Math.random() < .5 }); }
        else if (!p.onGround) playerAttack(L, p, MV.air, { air:true });
        else { const chain = MV.punch; p.combo = (gameTime - p.lastAtkEnd < .38 && p.lastType === 'punch') ? (p.combo + 1) % chain.length : 0; p.lastType = 'punch';
          playerAttack(L, p, chain[p.combo], { combo:p.combo }); } }
      else if (took('kick') && !p.carry){
        p.lastType = 'kick';
        if (!p.onGround) playerAttack(L, p, MV.air, { air:true });
        else if (p.crouch) playerAttack(L, p, MV.sweep);
        else if (p.mk === 'issem' && p.cd <= 0){ p.cd = MV.ball.cd; playerAttack(L, p, MV.ball); }
        else playerAttack(L, p, MV.kick); }
    }
  }
  physics(L, p, dt, surf);
  p.x += p.vx * dt;
  p.x = clamp(p.x, L.lockL + 28, Math.min(L.lockR - 28, def.maxX || (def.width || W) - 28));
  if (p.carry){ p.carry.x = p.x; p.carry.y = p.y - 140; }
}
function grabAction(L, p){
  if (p.carry){ const o = p.carry; p.carry = null; o.held = false; o.broken = true; throwThing(L, p, 'obj', { obj:o.t, dmg:OBJ[o.t].tdmg, down:true }); return; }
  if (p.weapon){ const w = p.weapon; p.weapon = null; throwThing(L, p, 'weapon', { w:w.t, dmg:14, down:w.t !== 'sise' }); return; }
  let best = null, bd = 60;
  for (const k of L.pickups){ if (k.kind === 'weapon' && Math.abs(k.x - p.x) < bd && Math.abs(k.y - p.y) < 40){ best = { k }; bd = Math.abs(k.x - p.x); } }
  for (const o of L.objs){ if (o.broken || o.held) continue; const D = OBJ[o.t]; if ((D.carry || D.weapon) && Math.abs(o.x - p.x) < bd && Math.abs(o.y - p.y) < 40){ best = { o }; bd = Math.abs(o.x - p.x); } }
  if (!best){ floatText(L, p.x, p.y - 150, 'Yakında alınacak bir şey yok', '#ffffff', 16); return; }
  if (best.k){ const k = best.k; k.got = true; p.weapon = { t:k.w, uses:k.uses }; SFX.grab(); floatText(L, p.x, p.y - 150, k.w.toUpperCase() + '!', '#f2c230'); }
  else { const o = best.o; if (OBJ[o.t].weapon){ o.broken = true; p.weapon = { t:OBJ[o.t].weapon, uses:1 }; SFX.grab(); }
    else { o.held = true; p.carry = o; SFX.grab(); if (!L.carryHint){ L.carryHint = true; L.hint = 'Fırlatmak için ✋ ya da 👊 bas!'; L.hintT = 3.5; } } }
}
function superMove(L, p){
  p.sup = 0; SFX.superOn(); FX.flash = .5; hitstop = .25; vib([60, 40, 120]);
  const name = p.mk === 'issem' ? 'ATEŞ ŞUTU!' : 'EJDER TEKMESİ!';
  L.superBanner = { t:1.4, name, kind:p.kind }; say(name.replace('!', ''), p.mk === 'issem' ? 'Issem' : 'Ufis');
  if (p.mk === 'issem') playerAttack(L, p, { dur:.5, a:.25, anim:'shoot', ball:true, fire:true });
  else playerAttack(L, p, { dur:.62, a:0, b:.62, anim:'spin', special:'dragon' });
}

/* ---------- düşman ---------- */
function updEnemy(L, e, dt, surf){
  e.animT += dt; if (e.flash > 0) e.flash -= dt; if (e.inv > 0) e.inv -= dt; if (e.hitT > 0) e.hitT -= dt; if (e.armorT > 0) e.armorT -= dt; if (e.jumpCd > 0) e.jumpCd -= dt;
  e.dz = Math.max(0, e.dz - dt * 6);
  if (e.dummy){ e.wv += (-e.wob * 140 - e.wv * 7) * dt; e.wob += e.wv * dt; if (e.dead) e.fall = Math.min(1.45, e.fall + dt * 4); return; }
  if (e.dead){ e.deadT += dt; physics(L, e, dt, surf); e.x += e.vx * dt; if (e.onGround) e.vx *= Math.pow(.02, dt); return; }
  if (L.frozen){ e.face = L.p.x > e.x ? 1 : -1; physics(L, e, dt, surf); return; }
  const p = L.p, T = e.T, D = DIFF(), dx = p.x - e.x, dist = Math.abs(dx);
  if (e.flying && Math.abs(e.vx) > 200){ for (const o of L.objs){ if (!o.broken && !o.held && Math.abs(o.x - e.x) < o.w / 2 + 10 && Math.abs(o.y - e.y) < 60){ breakObj(L, o, Math.sign(e.vx)); e.hp -= 6; floatText(L, e.x, e.y - 120, 'ÇAT!', '#ffcc66', 22); if (e.hp <= 0 && !e.dead) killEnemy(L, e, Math.sign(e.vx)); } } }
  if (T.summon && !e.summoned && e.hp < e.maxhp * .5){ e.summoned = true; floatText(L, e.x, e.y - 170, 'ADAMLARIM!', '#ff5a5a', 34); SFX.alarm();
    L.ents.push(makeEnemy('masked', L.camX - 40, { weapon:'sopa' }), makeEnemy('masked', L.camX + W + 40)); }
  if (e.down > 0){ e.down -= dt; e.x += e.vx * dt; if (e.onGround) e.vx *= Math.pow(.02, dt); if (e.down <= 0){ e.getup = .35; e.inv = .5; } }
  else if (e.getup > 0){ e.getup -= dt; }
  else if (e.dizzy > 0){ e.dizzy -= dt; e.vx = 0; }
  else if (e.stun > 0){ e.stun -= dt; e.x += e.vx * dt; e.vx *= Math.pow(.02, dt); }
  else if (e.hop > 0){ e.hop -= dt; e.x += e.vx * dt; e.vx *= Math.pow(.05, dt); }
  else if (e.dashing > 0){ e.dashing -= dt; e.x += e.vx * dt;
    if (!e.dashHit && Math.abs(p.x - e.x) < 42 && sameLevel(p, e)){ e.dashHit = true; hurtPlayer(L, T.dmg * 1.2, e.x - e.face * 30, { down:true }); }
    if (e.dashing <= 0){ e.vx = 0; e.cd = rand(.6, 1.1) / D.aggr; } }
  else if (e.picking > 0){ e.picking -= dt; if (e.picking <= 0 && e.pickTarget && !e.pickTarget.got){ e.pickTarget.got = true; e.weapon = { t:e.pickTarget.w, uses:e.pickTarget.uses }; SFX.grab(); } }
  else if (e.wind > 0){ e.wind -= dt;
    if (e.wind <= 0){
      if (e.move === 'dash'){ e.dashing = .42; e.vx = e.face * 760; e.dashHit = false; SFX.dash(); }
      else if (e.move === 'slam'){ e.strike = .35; shake = 12; SFX.slam(); vib(120); L.shocks.push({ x:e.x, y:e.y, dir:1, life:1.1, hit:false, dmg:T.dmg * .85 }, { x:e.x, y:e.y, dir:-1, life:1.1, hit:false, dmg:T.dmg * .85 }); }
      else { e.strike = .2; SFX.whiff();
        const wp = e.weapon ? WEAPONS[e.weapon.t] : null, range = wp ? wp.range - 10 : T.range;
        if (dist < range + 20 && Math.sign(dx) === e.face && sameLevel(p, e)){
          hurtPlayer(L, wp ? T.dmg + 5 : T.dmg, e.x, { high:!T.kick && !wp, down:!!(wp && e.weapon.t === 'boru') });
          if (wp && p.inv > .5){ (SFX[wp.sfx] || SFX.wood)(); e.weapon.uses--; if (e.weapon.uses <= 0){ e.weapon = null; } } } } } }
  else if (e.strike > 0){ e.strike -= dt;
    if (e.strike <= 0){ if (T.combo && e.move === 'hit' && e.comboN < T.combo - 1 && dist < T.range + 30){ e.comboN++; e.wind = T.windT * .55; e.face = dx > 0 ? 1 : -1; }
      else { e.comboN = 0; e.cd = rand(.9, 1.7) * (T.boss ? .6 : 1) * (T.big ? 1.15 : 1) / D.aggr; } } }
  else {
    e.face = dx > 0 ? 1 : -1; e.cd -= dt;
    const range = e.weapon ? WEAPONS[e.weapon.t].range - 12 : T.range;
    // kat değiştirme
    const dy = p.y - e.y;
    if (Math.abs(dy) > 46 && e.onGround && e.jumpCd <= 0 && !p.dead){
      if (dy < 0){ const target = surf.find(s => p.x >= s.x1 - 4 && p.x <= s.x2 + 4 && Math.abs(s.y - p.y) < 6);
        if (target && e.x > target.x1 - 30 && e.x < target.x2 + 30 && e.y - target.y < 170){ e.vy = -880; e.onGround = false; e.plat = null; e.jumpCd = 1.2; } }
      else if (e.plat && !e.plat.obj){ e.dropT = .3; e.onGround = false; e.plat = null; e.y += 2; e.jumpCd = .8; } }
    // yerdeki silahı al
    if (!e.weapon && !T.boss && !T.shield){ const k = L.pickups.find(k => k.kind === 'weapon' && !k.got && Math.abs(k.x - e.x) < 34 && Math.abs(k.y - e.y) < 30); if (k){ e.picking = .35; e.pickTarget = k; e.vx = 0; return; } }
    e.vx = dist > range ? e.face * T.speed : 0;
    for (const o of L.ents){ if (o !== e && !o.dead && !o.dummy && sameLevel(o, e)){ const d = e.x - o.x; if (Math.abs(d) < 40) e.vx += (d >= 0 ? 1 : -1) * 90; } }
    e.x += e.vx * dt;
    const attacking = L.ents.filter(o => !o.dead && (o.wind > 0 || o.strike > 0 || o.dashing > 0)).length;
    if (e.cd <= 0 && !p.dead && sameLevel(p, e)){
      if (T.dash && dist > 230 && Math.random() < .6){ e.move = 'dash'; e.wind = .55 / Math.sqrt(D.aggr); e.vx = 0; }
      else if (T.slam && dist < 300 && Math.random() < (T.boss ? .35 : .2)){ e.move = 'slam'; e.wind = .8 / Math.sqrt(D.aggr); e.vx = 0; }
      else if (dist <= range + 8 && (attacking < D.maxAtk || T.boss)){ e.move = 'hit'; e.wind = (T.windT + (e.weapon ? .1 : 0)) / Math.sqrt(D.aggr); e.vx = 0; }
    }
  }
  physics(L, e, dt, surf);
  if (e.x > L.lockL + 20 && e.x < L.lockR - 20) e.inside = true;
  if (e.inside) e.x = clamp(e.x, L.lockL + 20, L.lockR - 20);
}

/* =========================================================
   DÖVÜŞ BÖLÜMÜ
   ========================================================= */
function Level(def){
  const L = { kind:'fight', def, ents:[], proj:[], parts:[], texts:[], shocks:[], pickups:[], bursts:[], objs:[], camX:0, lockL:0, lockR:def.width || W, time:0, done:0, doneT:0,
    lost:false, lostT:0, jumped:false, obj:def.obj || '', hint:def.hint || '', hintT:def.hint ? 7 : 0, go:false, wi:0, active:false, combo:0, comboT:0, score:0, taken:0,
    swapCd:0, bark:null, barkT:0, barkI:0, pauseM:false, spawnT:1.5, bossE:null, bossIntro:0, frozen:true, superBanner:null,
    st:{ sepia:!!def.sepia, alarm:!!def.alarm, screen:def.screen || null, worldW:def.width || W, noBoard:true, doorK:def.doorK || 0 } };
  L.team = (def.chars || ['issem']).map(k => makeFighter(k, def.start || 120));
  L.team.forEach(f => f.face = def.startFace || 1);
  L.p = L.team[0];
  for (const o of def.objects || []){ const D = OBJ[o[0]]; L.objs.push({ t:o[0], x:o[1], y:o[2] || GROUND, w:D.w, h:D.h, hp:D.hp, drop:o[3] }); }
  for (const w of def.weapons || []) L.pickups.push({ x:w[1], y:w[2] || GROUND, kind:'weapon', w:w[0], uses:WEAPONS[w[0]].uses, t:0 });
  for (const it of def.preset || []){ const e = makeEnemy(it[0], it[1], it[2] || {}); e.inside = true; L.ents.push(e); if (ETYPES[it[0]].boss){ L.bossE = e; } }
  if (def.preset && def.preset.length){ L.active = true; L.lockL = 0; L.lockR = W; }
  if (def.survive) L.surviveT = def.survive;
  if (def.limit) L.limitT = def.limit * (SAVE.diff === 0 ? 1.3 : SAVE.diff === 2 ? .9 : 1);
  if (def.init) def.init(L);
  anyPress = false;
  const ctrl = () => showControls('fight', { swap:L.team.length > 1, labels:{ kick: L.p.mk === 'issem' ? '⚽' : '🦵' } });
  ctrl(); L.ctrl = ctrl; playMusic('fight');
  function doSwap(force){
    const o = L.team.find(f => f !== L.p && !f.dead); if (!o || (L.swapCd > 0 && !force)) return;
    if (L.p.carry) dropCarry(L, L.p);
    o.x = L.p.x; o.y = L.p.y; o.vy = 0; o.onGround = L.p.onGround; o.plat = L.p.plat; o.face = L.p.face; o.vx = 0; o.atk = null; o.stun = 0; o.down = 0; o.dizzy = 0; o.inv = .6; L.p = o; L.swapCd = .9;
    SFX.swap(); spawnParts(L, o.x, o.y - 70, '#ffffff', 14); floatText(L, o.x, o.y - 150, NAMES[o.mk] + '!', '#f2c230'); ctrl();
  }
  function lose(){ if (L.lost) return; L.lost = true; L.lostT = 0; showControls(null); SFX.lose(); }
  function restart(){ stats.retries++; cur = Level(def); }
  L.restart = restart;
  L.update = dt => {
    if (L.pauseM){
      if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ L.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)) toCover(); }
      return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !L.lost){ L.pauseM = true; showControls(null); return; }
    L.time += dt; if (L.hintT > 0) L.hintT -= dt; if (L.swapCd > 0) L.swapCd -= dt; if (L.comboT > 0) L.comboT -= dt; if (L.bossIntro > 0) L.bossIntro -= dt;
    if (L.superBanner){ L.superBanner.t -= dt; if (L.superBanner.t <= 0) L.superBanner = null; }
    for (const b of L.bursts) b.t += dt; L.bursts = L.bursts.filter(b => b.t < .18);
    const surf = surfaces(L);
    if (L.frozen){
      for (const f of L.team) f.animT += dt; for (const e of L.ents){ e.animT += dt; }
      if (anyPress || (tap && !inB(PAUSE_BTN, tap))){ L.frozen = false; for (const k in pressedAt) pressedAt[k] = null; if (L.bossE){ L.bossIntro = 2.2; SFX.boss(); shake = 8; } else { SFX.whistle(); say('Dövüş!', 'Spiker'); } }
      return; }
    if (L.lost){ L.lostT += dt; if (tap && L.lostT > .8) restart(); return; }
    if (def.barks && L.barkI < def.barks.length && L.time > def.barks[L.barkI].at){ L.bark = def.barks[L.barkI++]; L.barkT = 3.2; say(L.bark.t, L.bark.who); }
    if (L.barkT > 0) L.barkT -= dt;
    if (L.team.length > 1 && took('swap')) doSwap();
    updPlayer(L, dt, surf);
    setBtnReady('super', L.p.sup >= 100); setBtnLabel('grab', L.p.carry || L.p.weapon ? '🎯' : '✋');
    for (const f of L.team) if (f !== L.p && !f.dead && f.hp < f.maxhp) f.hp = Math.min(f.maxhp, f.hp + dt * 1.5);
    for (const e of L.ents) updEnemy(L, e, dt, surf);
    // mermiler: top, ateş, fırlatılan eşya ve silahlar
    for (const b of L.proj){
      if (b.kind !== 'fire') b.vy += 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += b.vx * dt / 10; b.life -= dt;
      if (b.y > GROUND - 10 && b.kind === 'ball'){ b.y = GROUND - 10; b.vy *= -.5; }
      if (b.y > GROUND - 10 && b.kind !== 'ball' && !b.dead){ b.dead = true; b.life = Math.min(b.life, .05); breakProj(L, b); }
      if (!b.dead) for (const e of L.ents){ if (e.dead || e.inv > 0 || b.hit.has(e) || e.down > 0) continue;
        if (Math.abs(e.x - b.x) < 30 && b.y > e.y - 140 * (e.look && e.look.scale || 1) && b.y < e.y + 10){ b.hit.add(e); hitEnemy(L, e, b.dmg || 14, 330, Math.sign(b.vx), { down:b.down, heavy:true });
          if (!b.pierce){ b.dead = b.kind !== 'ball'; if (b.kind === 'ball'){ b.vx *= -.3; b.vy = -320; b.hit = new Set(L.ents); } else { breakProj(L, b); b.life = 0; } break; } } }
      if (!b.dead && b.kind !== 'ball') for (const o of L.objs){ if (!o.broken && !o.held && Math.abs(o.x - b.x) < o.w / 2 + 8 && b.y > o.y - o.h && b.y < o.y){ breakObj(L, o, Math.sign(b.vx)); if (!b.pierce){ b.dead = true; b.life = 0; breakProj(L, b); } } }
      if (def.ball && b.kind === 'ball') def.ball(L, b);
    }
    L.proj = L.proj.filter(b => b.life > 0 && b.x > L.camX - 120 && b.x < L.camX + W + 120);
    for (const s of L.shocks){ s.x += s.dir * 540 * dt; s.life -= dt;
      if (!s.hit && Math.abs(L.p.x - s.x) < 30 && L.p.onGround && Math.abs(L.p.y - s.y) < 20){ s.hit = true; hurtPlayer(L, s.dmg, s.x - s.dir * 20, { unblockable:true, low:true }); } }
    L.shocks = L.shocks.filter(s => s.life > 0);
    for (const k of L.pickups){ k.t += dt; if (k.vy != null){ k.vy += 1400 * dt; k.y += k.vy * dt; k.x += (k.vx || 0) * dt; const fl = surf.find(s => k.x >= s.x1 && k.x <= s.x2 && k.y >= s.y && k.y - k.vy * dt <= s.y + 2); if (fl){ k.y = fl.y; k.vy = null; } else if (k.y >= GROUND){ k.y = GROUND; k.vy = null; } }
      if (k.kind === 'hp' && Math.abs(L.p.x - k.x) < 32 && Math.abs(L.p.y - k.y) < 30){ k.got = true; L.p.hp = Math.min(L.p.maxhp, L.p.hp + 20); SFX.pickupHp(); floatText(L, k.x, k.y - 120, '+20 ❤', '#7dff9a'); } }
    L.pickups = L.pickups.filter(k => !k.got && (k.kind === 'weapon' || k.t < 14));
    for (const o of L.objs){ if (o.shakeT > 0) o.shakeT -= dt; }
    for (const q of L.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.type === 'dust' ? 100 : 900) * dt; q.r += dt * 8; }
    L.parts = L.parts.filter(q => q.life > 0);
    for (const t of L.texts) t.t += dt; L.texts = L.texts.filter(t => t.t < 1.2);
    L.ents = L.ents.filter(e => !(e.dead && !e.dummy && e.deadT > 1.8));
    if (!L.done) waveLogic(L, dt);
    if (def.update) def.update(L, dt);
    L.camX = clamp(L.p.x - W * .4, L.lockL, Math.max(L.lockL, L.lockR - W));
    if (L.p.dead && !L.lost){
      L.deadT = (L.deadT || 0) + dt;
      if (L.deadT > .9){ L.deadT = 0; const o = L.team.find(f => !f.dead); if (o) doSwap(true); else lose(); } }
    if (L.done){
      if (!L.rank){ const lost = L.team.reduce((s, f) => s + (1 - Math.max(0, f.hp) / f.maxhp), 0) / L.team.length;
        L.rank = lost < .1 ? 'S' : lost < .3 ? 'A' : lost < .6 ? 'B' : 'C'; L.lostFrac = lost; SFX.rank(); }
      L.doneT += dt;
      if (L.doneT > 2.4){ stats.lvls++; stats.dmg += L.lostFrac; stats.ranks.push(L.rank); next(); } }
  };
  function waveLogic(L, dt){
    const p = L.p, n = alive(L).length;
    if (def.survive){
      L.surviveT -= dt; L.spawnT -= dt;
      if (L.spawnT <= 0 && n < 2 + SAVE.diff){ const side = Math.random() < .5 ? 1 : -1; L.ents.push(makeEnemy(pick(def.pool), side > 0 ? L.camX + W + 40 : L.camX - 40)); L.spawnT = rand(1.8, 3.2) / DIFF().aggr; }
      if (L.surviveT <= 0){ L.done = 1; L.obj = def.doneMsg || 'Dayandın!'; SFX.ok(); for (const e of L.ents) if (!e.dead && !e.dummy){ e.stun = 3; e.vx = (e.x > p.x ? 1 : -1) * 300; } }
      return;
    }
    if (L.limitT != null){ L.limitT -= dt; if (L.limitT <= 0){ L.limitT = 0; L.loseMsg = def.loseMsg || 'Süre doldu!'; lose(); return; } }
    if (L.active){
      if (n === 0){ L.active = false; L.lockL = 0; L.lockR = def.width || W;
        if (L.wi < (def.waves || []).length || def.exit){ L.go = true; if (!def.noHeal){ p.hp = Math.min(p.maxhp, p.hp + 12); floatText(L, p.x, p.y - 150, '+12 ❤', '#7dff9a'); } SFX.ok(); }
        if (L.wi >= (def.waves || []).length && !def.exit && !def.custom){ L.done = 1; L.obj = def.doneMsg || 'Kazandın!'; } } }
    else if (def.waves && L.wi < def.waves.length && p.x > def.waves[L.wi].at){
      const w = def.waves[L.wi++]; L.active = true; L.go = false; L.lockL = L.camX; L.lockR = L.camX + W;
      w.list.forEach((it, i) => { const [t, side, o] = Array.isArray(it) ? it : [it, i % 2 ? -1 : 1];
        const e = makeEnemy(t, side > 0 ? L.camX + W + 40 + i * 70 : L.camX - 40 - i * 70, o || {});
        if (o && o.y){ e.x = L.camX + (side > 0 ? W - 120 - i * 60 : 120 + i * 60); e.inside = true; }
        if (ETYPES[t].boss){ L.bossE = e; L.bossIntro = 2.2; SFX.boss(); shake = 8; e.x = L.camX + W - 160; e.inside = true; }
        L.ents.push(e); });
      if (w.hint){ L.hint = w.hint; L.hintT = 4.5; }
      SFX.whistle(); }
    else if (def.waves && L.wi >= def.waves.length && def.exit && !L.active && p.x > (def.width || W) - 150){ L.done = 1; L.obj = def.doneMsg || 'Çıkışa ulaştın!'; SFX.goal(); }
    else if (!def.waves && def.exit && !L.active && p.x > (def.width || W) - 150){ L.done = 1; L.obj = def.doneMsg || 'Çıkışa ulaştın!'; SFX.ok(); }
  }
  L.draw = c => drawLevel(c, L);
  return L;
}
function breakProj(L, b){ if (b.kind === 'obj'){ const D = OBJ[b.obj]; (SFX[D.sfx] || SFX.wood)(); spawnParts(L, b.x, b.y, D.col, 14, 'chip', 300); }
  else if (b.kind === 'weapon'){ if (b.w === 'sise'){ SFX.glass(); spawnParts(L, b.x, b.y, '#2e8b57', 12, 'glass'); } else { L.pickups.push({ x:b.x, y:Math.min(GROUND, b.y), kind:'weapon', w:b.w, uses:Math.max(2, WEAPONS[b.w].uses - 3), t:0, vy:-150, vx:-b.vx * .1 }); SFX.metal(); } } }

/* ---------- çizim ---------- */
function drawPlatform(c, p){
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
  else if (o.t === 'sise'){ c.fillStyle = D.col; rr(c, x, y + 8, o.w, o.h - 8, 3); c.fill(); c.stroke(); c.fillRect(x + 3, y, 6, 10); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 2, y + 10, 2, 12); }
}
function drawPickup(c, k){
  if (k.kind === 'hp'){ const bob = Math.sin(k.t * 5) * 4; c.fillStyle = '#7ec8ff'; rr(c, k.x - 8, k.y - 36 + bob, 16, 28, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.fillStyle = '#1e6bd6'; c.fillRect(k.x - 4, k.y - 42 + bob, 8, 6); c.fillStyle = '#ffffff'; c.fillRect(k.x - 8, k.y - 26 + bob, 16, 6);
    if (Math.sin(k.t * 6) > 0){ c.fillStyle = '#ff4d6d'; drawStar(c, k.x + 12, k.y - 44 + bob, 4); } return; }
  c.save(); c.translate(k.x, k.y - 6); drawHeld(c, k.w, Math.PI / 2 + .05); c.restore();
  if (Math.sin(k.t * 5) > .3){ c.strokeStyle = 'rgba(242,194,48,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(k.x + 20, k.y - 4, 34, 8, 0, 0, 7); c.stroke(); }
}
function drawEnemy(c, e, L){
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
  if (e.T.boss && !e.dead){ const g = c.createRadialGradient(e.x, e.y - 70 * sc, 10, e.x, e.y - 70 * sc, 110 * sc); g.addColorStop(0, 'rgba(255,40,40,.18)'); g.addColorStop(1, 'rgba(255,40,40,0)'); c.fillStyle = g; c.fillRect(e.x - 120 * sc, e.y - 190 * sc, 240 * sc, 200 * sc); }
  if (e.dashing > 0){ for (let i = 1; i < 4; i++) drawHuman(c, e.x - e.face * i * 26, e.y, e.look, getPose(e), e.face, 1, .18, '#ff4da6'); }
  c.globalAlpha = alpha * .28; c.fillStyle = '#000000'; c.beginPath(); c.ellipse(e.x, e.y + 3, 26 * sc, 6, 0, 0, 7); c.fill(); c.globalAlpha = 1;
  drawHuman(c, e.x, e.y, e.look, getPose(e), e.face, 1, alpha, tint, exprOf(e), false, e.weapon ? e.weapon.t : null);
  const top = e.y - 140 * sc;
  if (e.wind > 0 && e.move === 'slam') txt(c, '⬆ ZIPLA!', e.x, top - 6, 20, '#ffa000', 'center', 'bold', 4);
  if (!e.dead && !e.T.boss && e.hp < e.maxhp && e.down <= 0){ c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(e.x - 25, top, 50, 6); c.fillStyle = '#ff5252'; c.fillRect(e.x - 25, top, 50 * Math.max(0, e.hp) / e.maxhp, 6); }
  if ((e.dizzy > 0 || (e.down > 0) || (e.dead && e.deadT < 1.5))){ const hp2 = headPos(e, sc); dizzyStars(c, hp2[0], hp2[1] - (e.down > 0 || e.dead ? 6 : 18), gameTime, e.dizzy > 0 ? 4 : 3, e.dizzy > 0 ? 22 : 18); }
}
function drawLevel(c, L){
  const def = L.def, sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
  L.st.camX = L.camX;
  c.save();
  if (FX.zoom > 1.001){ const zx = FX.zx - L.camX; c.translate(zx, FX.zy); c.scale(FX.zoom, FX.zoom); c.translate(-zx, -FX.zy); }
  const p = L.p;
  if (p.dizzy > 0){ c.translate(480, 270); c.rotate(Math.sin(gameTime * 5) * .025); c.translate(-480 + Math.sin(gameTime * 7) * 6, -270); }
  c.translate(sx, sy);
  drawBg(c, def.bg, L.st, L.time);
  c.translate(-Math.round(L.camX), 0);
  if (def.drawWorld) def.drawWorld(L, c);
  for (const pl of def.platforms || []) drawPlatform(c, pl);
  for (const o of L.objs) if (!o.held) drawObj(c, o, gameTime);
  for (const k of L.pickups) drawPickup(c, k);
  for (const s of L.shocks){ c.globalAlpha = Math.min(1, s.life * 2); c.fillStyle = '#c9a26b'; for (let i = 0; i < 5; i++){ c.beginPath(); c.arc(s.x - s.dir * i * 10, s.y - 6 - i * 3, 12 - i * 2, 0, 7); c.fill(); } c.globalAlpha = 1; }
  for (const e of L.ents) drawEnemy(c, e, L);
  if (!(p.inv > 0 && p.down <= 0 && p.getup <= 0 && Math.floor(p.inv * 20) % 2 === 0)){
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(p.x, (p.plat ? p.plat.y : GROUND) + 3, 26, 6, 0, 0, 7); c.fill();
    if (p.slideT > 0){ for (let i = 1; i < 3; i++) drawHuman(c, p.x - p.face * i * 22, p.y, p.look, getPose(p), p.face, 1, .2, '#9ad7ff'); }
    drawHuman(c, p.x, p.y, p.look, getPose(p), p.face, 1, 1, null, exprOf(p), false, p.carry ? 'box' : p.weapon ? p.weapon.t : null);
    if (p.carry){ const o = p.carry; c.save(); c.translate(0, 0); const D = OBJ[o.t]; c.fillStyle = D.col; c.fillRect(p.x - o.w / 2, p.y - 170, o.w, o.h * .8); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(p.x - o.w / 2, p.y - 170, o.w, o.h * .8); c.restore(); }
    if (p.dizzy > 0 || p.down > 0){ const hp2 = headPos(p); dizzyStars(c, hp2[0], hp2[1] - 18, gameTime, 4, 22); }
  }
  for (const b of L.proj){
    if (b.kind === 'ball' || b.kind === 'fire') drawBall(c, b.x, b.y, b.spin, b.kind === 'fire' ? 1.4 : 1, b.kind === 'fire' ? Math.sign(b.vx) : 0);
    else if (b.kind === 'obj'){ const D = OBJ[b.obj]; c.save(); c.translate(b.x, b.y); c.rotate(b.spin * .1); c.fillStyle = D.col; c.fillRect(-20, -18, 40, 36); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-20, -18, 40, 36); c.restore(); }
    else { c.save(); c.translate(b.x, b.y); drawHeld(c, b.w, b.spin * .2); c.restore(); } }
  for (const b of L.bursts) burst(c, b.x, b.y, (b.big ? 30 : 20) * (1 + b.t * 4), b.big ? '#ffffff' : '#fff3a0', 1 - b.t / .18);
  for (const q of L.parts){ c.globalAlpha = Math.min(1, q.life / .25); c.fillStyle = q.col;
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
  vignette(c, .35);
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
  if (L.combo >= 3 && L.comboT > 0){ c.globalAlpha = Math.min(1, L.comboT * 2); txt(c, L.combo + ' KOMBO!', W - 28, 150, 30 + Math.min(14, L.combo), '#f2c230', 'right', 'italic 900', 5); c.globalAlpha = 1; }
  if (L.bark && L.barkT > 0){ const sp = SPEAKERS[L.bark.who]; c.globalAlpha = Math.min(1, L.barkT * 2);
    const by0 = 214; c.font = fnt(16, 'normal'); const bw = Math.min(560, c.measureText(L.bark.t).width + 110);
    c.fillStyle = 'rgba(8,12,30,.92)'; rr(c, 12, by0, bw, 56, 12); c.fill(); c.strokeStyle = sp.col; c.lineWidth = 2; c.stroke();
    c.save(); c.beginPath(); c.arc(42, by0 + 28, 22, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip(); drawPortrait(c, 42, by0 + 30, 15, sp.look, L.bark.e || 'shout', true); c.restore();
    txt(c, L.bark.who, 74, by0 + 22, 14, sp.col); txt(c, L.bark.t, 74, by0 + 44, 16, '#ffffff', 'left', 'normal', 0, bw - 86); c.globalAlpha = 1; }
  if (L.go && !L.active && !L.done && Math.sin(gameTime * 7) > -.3) txt(c, 'İLERLE ▶', W - 24, 250, 30, '#f2c230', 'right', '900', 5);
  c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 9, 5, 18); c.fillRect(PAUSE_BTN.x + 23, PAUSE_BTN.y + 9, 5, 18);
  if (L.frozen){ c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, H); c.globalAlpha = .7 + Math.sin(gameTime * 5) * .3; pill(c, 'Hazırsan herhangi bir tuşa bas ▶', 480, 300, 24, 'rgba(10,16,40,.9)', '#f2c230', { border:'#f2c230' }); c.globalAlpha = 1; }
  if (L.done && L.rank){ const k = Math.min(1, L.doneT * 3); c.fillStyle = 'rgba(0,0,0,' + .45 * k + ')'; c.fillRect(0, 190, W, 160);
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
  txt(c, 'Kontroller: 👊 yumruk · 🦵 tekme/şut · ⬇+🦵 süpürme · 💨 kayarak tekme · ✋ al/fırlat · ⭐ süper · havada 👊/🦵 uçan vuruş', 480, 420, 13, '#c8d3ff', 'center', 'normal', 0, 900);
}
