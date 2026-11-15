'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   art.js
   karakterler · yüzler · pozlar · eşyalar · mekanlar · ışıklar
   ========================================================= */
const INK = '#12141c';
const LOOK = {
  issem:   { skin:'#e8b48a', hair:'#3a2414', hs:'curly', headband:'#f2c230', shirt:'#14306b', stripe:'#f2c230', shorts:'#14306b', socks:'#f2c230', shoes:'#ffffff', eye:'#3b2a1a', sh:1, num:'10' },
  mate:    { skin:'#d8a47f', hair:'#222222', hs:'short', shirt:'#14306b', stripe:'#f2c230', shorts:'#14306b', socks:'#f2c230', shoes:'#ffffff', sh:1, num:'7' },
  mate2:   { skin:'#8d5a3b', hair:'#111111', hs:'curly', shirt:'#14306b', stripe:'#f2c230', shorts:'#14306b', socks:'#f2c230', shoes:'#ffffff', sh:1, num:'9' },
  ufis:    { skin:'#e0b090', hair:'#d9d9d9', hs:'bun', beard:'#e6e6e6', bs:'long', brow:'#e6e6e6', shirt:'#f3efe6', shorts:'#2b2b2b', socks:'#2b2b2b', shoes:'#222222', robe:true, belt:'#1a1a1a', eye:'#2a2a2a' },
  ufisGenc:{ skin:'#e8bb95', hair:'#1b1b1b', hs:'bun', shirt:'#f3efe6', shorts:'#2b2b2b', socks:'#2b2b2b', shoes:'#222222', robe:true, belt:'#8a1c1c', eye:'#2a2a2a' },
  usta:    { skin:'#d9a985', hair:'#f0f0f0', hs:'bald', beard:'#f4f4f4', bs:'long', brow:'#f4f4f4', shirt:'#8b6b4a', shorts:'#5a4532', socks:'#5a4532', shoes:'#3a2a1c', robe:true, belt:'#3a2a1c', eye:'#2a2a2a' },
  coach:   { skin:'#d9a27a', hair:'#7a7a7a', hs:'short', shirt:'#2a2f3a', shorts:'#2a2f3a', socks:'#2a2f3a', shoes:'#111111' },
  leo:     { skin:'#e2ac84', hair:'#6b4a2b', hs:'cap', cap:'#1e6b4a', beard:'#6b4a2b', bs:'goatee', shirt:'#1e6b4a', stripe:'#ffffff', shorts:'#1b2a24', socks:'#1b2a24', shoes:'#ffffff' },
  lider:   { skin:'#c99472', hair:'#111111', hs:'hat', glasses:true, shirt:'#141414', tie:'#b3122e', shorts:'#141414', socks:'#141414', shoes:'#000000', suit:true },
  yardimci:{ skin:'#b98a6a', hair:'#222222', hs:'bald', glasses:true, shirt:'#3b3f47', tie:'#e6e6e6', shorts:'#2a2d33', socks:'#2a2d33', shoes:'#000000', suit:true },
  narak:   { skin:'#cf9a74', hair:'#0d0d0d', hs:'spiky', scar:true, shirt:'#5c0f16', shorts:'#1a1a1a', socks:'#1a1a1a', shoes:'#111111', robe:true, belt:'#111111', eye:'#1a1a1a' },
  dovuscu: { skin:'#a77a58', hair:'#111111', hs:'bald', beard:'#151515', bs:'full', shirt:'#4b5563', shorts:'#1f2937', socks:'#1f2937', shoes:'#111111', scale:1.35 },
  thug:    { skin:'#c99472', hair:'#111111', hs:'short', bandana:'#b3122e', shirt:'#1b1b1b', shorts:'#2a2a2a', socks:'#2a2a2a', shoes:'#000000' },
  masked:  { skin:'#c99472', hair:'#111111', hs:'mask', shirt:'#151515', shorts:'#1f1f1f', socks:'#1f1f1f', shoes:'#000000' },
  guard:   { skin:'#d1a07c', hair:'#333333', hs:'cap', cap:'#1c2a4a', shirt:'#5b8bd6', shorts:'#1c2a4a', socks:'#1c2a4a', shoes:'#000000' },
  kicker:  { skin:'#c48d68', hair:'#2b1a10', hs:'spiky', shirt:'#4a1d6b', stripe:'#b07cff', shorts:'#22102f', socks:'#22102f', shoes:'#111111', bandana:'#b07cff' },
  shieldg: { skin:'#d1a07c', hair:'#222222', hs:'helmet', shirt:'#2f3b52', shorts:'#1c2333', socks:'#1c2333', shoes:'#000000', shield:true },
  brute:   { skin:'#b9845f', hair:'#111111', hs:'bald', bandana:'#b3122e', beard:'#151515', bs:'stubble', shirt:'#3a1414', shorts:'#222222', socks:'#222222', shoes:'#000000', scale:1.28 },
  rival:   { skin:'#d8a47f', hair:'#3a2a1a', hs:'short', shirt:'#c0392b', stripe:'#ffffff', shorts:'#ffffff', socks:'#c0392b', shoes:'#111111', sh:1, num:'4' },
  rival2:  { skin:'#8d5a3b', hair:'#111111', hs:'curly', shirt:'#c0392b', stripe:'#ffffff', shorts:'#ffffff', socks:'#c0392b', shoes:'#111111', sh:1, num:'5' },
  keeper:  { skin:'#e0b090', hair:'#4a3020', hs:'short', shirt:'#27ae60', stripe:'#145a32', shorts:'#111111', socks:'#27ae60', shoes:'#111111', gloves:true, sh:1, num:'1' },
  golge:   { skin:'#111111', hair:'#000000', hs:'hat', shadow:true, shirt:'#0a0a0a', tie:'#3a0000', shorts:'#0a0a0a', socks:'#0a0a0a', shoes:'#000000', suit:true },
};
LOOK.mystery = LOOK.lider;
const SPEAKERS = {
  'Issem':{ look:'issem', col:'#f2c230' }, 'Ufis':{ look:'ufis', col:'#ff9a6b' }, 'Teknik Direktör':{ look:'coach', col:'#9ecbff' },
  'Gizemli Adam':{ look:'lider', col:'#c79bff' }, 'Lider':{ look:'lider', col:'#c79bff' }, 'Yardımcı':{ look:'yardimci', col:'#d0d4dc' },
  'Güvenlik Görevlisi':{ look:'guard', col:'#8fb6ff' }, 'Görevli':{ look:'guard', col:'#8fb6ff' }, 'Maskeli Adam':{ look:'masked', col:'#ff6b6b' },
  'Futbolcu':{ look:'mate', col:'#f2c230' }, 'Takım Arkadaşı':{ look:'mate2', col:'#f2c230' }, 'Leo':{ look:'leo', col:'#6fe0a8' },
  'Usta':{ look:'usta', col:'#ffd59a' }, 'Narak':{ look:'narak', col:'#ff5a5a' }, 'Dövüşçü':{ look:'dovuscu', col:'#b8c2d1' },
  'Gizemli Kişi':{ look:'golge', col:'#ff4040' }, 'Spiker':{ look:null, col:'#ffffff' },
};
const NAMES = { issem:'ISSEM', ufis:'UFİS' };

/* ---------- ifade ---------- */
function exprOf(f){
  if (f.dead || f.down > 0) return 'ko';
  if (f.dizzy > 0) return 'dizzy';
  if (f.e) return f.e;
  if (f.stun > 0) return 'pain';
  if (f.atk || f.wind > 0 || f.strike > 0 || f.dashing > 0 || f.slideT > 0) return 'shout';
  if (f.blocking) return 'angry';
  return f.defE || 'neutral';
}

/* ---------- saç (göz ve kaşın ÜSTÜNDE kalır) ---------- */
function hairCap(c, hx, hy, col, r = 14.6){
  const fr = -.66, bk = Math.PI + .5;
  c.fillStyle = col; c.beginPath(); c.arc(hx - 1, hy - 1, r, fr, bk, true);
  c.quadraticCurveTo(hx - 5, hy - 7, hx - 1 + r * Math.cos(fr), hy - 1 + r * Math.sin(fr)); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2; c.stroke();
}
function sideHair(c, hx, hy, look){
  const hc = look.hair;
  switch (look.hs){
    case 'short': hairCap(c, hx, hy, hc); break;
    case 'curly': hairCap(c, hx, hy, hc, 14);
      c.fillStyle = hc; for (let i = 0; i < 7; i++){ const a = -1.05 - i * .36; c.beginPath(); c.arc(hx - 1 + Math.cos(a) * 13, hy - 1 + Math.sin(a) * 13, 5.2, 0, 7); c.fill(); } break;
    case 'bun': hairCap(c, hx, hy, hc, 14.4); c.fillStyle = hc; c.beginPath(); c.arc(hx - 10, hy - 13, 6.5, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.2; c.stroke(); c.fillStyle = shade(hc, .7); c.fillRect(hx - 12, hy - 8.5, 5, 3); break;
    case 'spiky': hairCap(c, hx, hy, hc); c.fillStyle = hc;
      for (let i = 0; i < 5; i++){ const x0 = hx - 13 + i * 5.5; c.beginPath(); c.moveTo(x0, hy - 9); c.lineTo(x0 - 4, hy - 23 + (i % 2) * 3); c.lineTo(x0 + 5, hy - 11); c.fill(); } break;
    case 'cap': c.fillStyle = look.cap; c.beginPath(); c.arc(hx - 1, hy - 3, 14.6, Math.PI, Math.PI * 2); c.fill(); c.fillRect(hx + 4, hy - 7, 15, 4); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); break;
    case 'helmet': c.fillStyle = '#3d4a63'; c.beginPath(); c.arc(hx - 1, hy - 1, 16, Math.PI * .9, Math.PI * 2.05); c.fill(); c.fillStyle = 'rgba(160,200,255,.35)'; c.fillRect(hx + 2, hy - 7, 13, 9); break;
    case 'hat': c.fillStyle = '#0d0d0d'; c.fillRect(hx - 19, hy - 13, 38, 4); c.fillRect(hx - 12, hy - 28, 24, 16); c.fillStyle = '#5a0000'; c.fillRect(hx - 12, hy - 16, 24, 3); break;
    case 'mask': c.fillStyle = '#0f0f0f'; c.beginPath(); c.arc(hx, hy, 14.4, 0, 7); c.fill(); break;
    case 'bald': c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(hx - 2, hy - 10, 5, 2.5, -.3, 0, 7); c.fill();
      if (look.beard && look.hair !== '#111111'){ c.fillStyle = look.hair; c.fillRect(hx - 14, hy - 3, 4, 8); } break;
  }
  if (look.headband){ c.fillStyle = look.headband; c.beginPath(); c.moveTo(hx - 14, hy - 9); c.lineTo(hx + 12, hy - 11); c.lineTo(hx + 12, hy - 7); c.lineTo(hx - 14, hy - 5); c.fill();
    c.beginPath(); c.moveTo(hx - 13, hy - 8); c.lineTo(hx - 23, hy - 2); c.lineTo(hx - 19, hy + 2); c.fill(); }
  if (look.bandana){ c.fillStyle = look.bandana; c.fillRect(hx - 15, hy - 11, 29, 5); c.beginPath(); c.moveTo(hx - 14, hy - 9); c.lineTo(hx - 25, hy - 3); c.lineTo(hx - 21, hy + 1); c.fill(); }
}
function sideFace(c, hx, hy, look, ex, talk){
  if (look.shadow){ c.fillStyle = '#ff2a2a'; c.fillRect(hx + 6, hy - 3, 4, 2); return; }
  if (look.hs === 'mask'){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(hx + 7.5, hy - 2, 3.2, 2, -.2, 0, 7); c.fill(); return; }
  if (ex === 'ko' || ex === 'dizzy'){ c.strokeStyle = INK; c.lineWidth = 1.8;
    if (ex === 'ko'){ c.beginPath(); c.moveTo(hx + 4.5, hy - 5.5); c.lineTo(hx + 10, hy); c.moveTo(hx + 10, hy - 5.5); c.lineTo(hx + 4.5, hy); c.stroke(); }
    else { c.beginPath(); for (let a = 0; a < 9; a += .5) c.lineTo(hx + 7 + Math.cos(a + gameTime * 9) * a * .35, hy - 2.5 + Math.sin(a + gameTime * 9) * a * .35); c.stroke(); } }
  else if (look.glasses){ c.fillStyle = '#0a0a0a'; rr(c, hx + 2.5, hy - 6, 12, 5.5, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(hx + 4, hy - 5, 3, 1.5); }
  else {
    const eh = ex === 'shock' || ex === 'pain' ? 3.4 : ex === 'angry' || ex === 'shout' ? 2.1 : ex === 'happy' ? 1.8 : 2.8;
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(hx + 7.2, hy - 2.4, 3.5, eh, 0, 0, 7); c.fill();
    c.fillStyle = look.eye || '#1a1a1a'; c.beginPath(); c.arc(hx + 8.4, hy - 2.3, Math.min(1.9, eh), 0, 7); c.fill();
  }
  c.strokeStyle = look.brow || (['bald', 'hat', 'helmet', 'cap'].includes(look.hs) ? '#2a1a10' : shade(look.hair, .8)); c.lineWidth = 2.4; c.lineCap = 'round';
  c.beginPath();
  if (ex === 'angry' || ex === 'shout'){ c.moveTo(hx + 3, hy - 9); c.lineTo(hx + 11.5, hy - 5.8); }
  else if (ex === 'shock'){ c.moveTo(hx + 3, hy - 9.5); c.lineTo(hx + 11.5, hy - 10.2); }
  else if (ex === 'sad' || ex === 'pain' || ex === 'dizzy'){ c.moveTo(hx + 3, hy - 6.8); c.lineTo(hx + 11.5, hy - 9.4); }
  else { c.moveTo(hx + 3, hy - 7.8); c.lineTo(hx + 11.5, hy - 7.8); }
  c.stroke();
  c.strokeStyle = shade(look.skin, .7); c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx + 12.6, hy - 1.5); c.lineTo(hx + 15, hy + 2.5); c.lineTo(hx + 12, hy + 3.2); c.stroke();
  if (look.beard){ c.fillStyle = look.beard;
    if (look.bs === 'long'){ c.beginPath(); c.moveTo(hx - 4, hy + 4); c.quadraticCurveTo(hx + 4, hy + 32, hx + 13, hy + 6); c.lineTo(hx + 9, hy + 3.5); c.fill(); }
    else if (look.bs === 'goatee'){ c.beginPath(); c.ellipse(hx + 9.5, hy + 10.5, 3.6, 4.2, 0, 0, 7); c.fill(); }
    else if (look.bs === 'full'){ c.beginPath(); c.arc(hx + 3, hy + 4, 11.5, .1, Math.PI * .95); c.fill(); }
    else { c.globalAlpha = .45; c.beginPath(); c.arc(hx + 3, hy + 4, 11, .15, Math.PI * .9); c.fill(); c.globalAlpha = 1; } }
  const open = talk && Math.sin(gameTime * 22) > 0;
  c.strokeStyle = '#3a1a14'; c.fillStyle = '#5a1a1a'; c.lineWidth = 1.9;
  const mx = hx + 9.6, my = hy + 7;
  if (ex === 'shock' || ex === 'pain' || ex === 'shout' || open){ c.beginPath(); c.ellipse(mx, my, ex === 'shout' ? 3.2 : 2.3, ex === 'shout' ? 2.8 : 2.9, 0, 0, 7); c.fill(); }
  else if (ex === 'happy'){ c.beginPath(); c.arc(mx - 1, my - 2.6, 3.7, .3, Math.PI - .5); c.stroke(); }
  else if (ex === 'angry' || ex === 'sad' || ex === 'dizzy'){ c.beginPath(); c.moveTo(mx - 3, my + 1); c.lineTo(mx + 2, my - .5); c.stroke(); }
  else if (ex === 'smirk'){ c.beginPath(); c.moveTo(mx - 3, my); c.quadraticCurveTo(mx, my + 1, mx + 3, my - 2); c.stroke(); }
  else if (ex !== 'ko'){ c.beginPath(); c.moveTo(mx - 2.5, my); c.lineTo(mx + 2, my); c.stroke(); }
  if (look.scar){ c.strokeStyle = '#8a3a3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hx + 3, hy - 11); c.lineTo(hx + 11, hy + 3); c.stroke(); }
}

/* ---------- pozlar ---------- */
function getPose(f){
  const t = f.animT || 0;
  const P = { lean:3, bob:Math.sin(t * 3) * 1.2, fl:[.12, .02], bl:[-.12, -.2], fa:[.55, 2.5], ba:[.35, 2.3], lie:false, rot:0 };
  if (f.dead || f.down > 0 || f.pose === 'lie'){ P.lie = true; P.bob = 0; P.fa = [1.9, 2.1]; P.ba = [2.5, 2.6]; P.fl = [.1, 0]; P.bl = [-.1, -.1]; return P; }
  if (f.getup > 0 || f.pose === 'kneel'){ P.fl = [1.4, .1]; P.bl = [.3, -1.4]; P.bob = 18; P.lean = 4; P.fa = [.4, .4]; P.ba = [.2, .2]; return P; }
  const crouch = f.crouch || f.pose === 'crouch';
  const moving = Math.abs(f.vx || 0) > 10 && (f.onGround !== false);
  const busy = f.atk || f.stun > 0 || f.blocking || f.wind > 0 || f.dashing > 0 || f.slideT > 0 || f.dizzy > 0 || f.act;
  if (moving && !busy){
    const sp = f.run ? 15 : 11, s = Math.sin(t * sp);
    P.fl = [s * .6, s * .6 - .35 - .25 * Math.max(0, -s)]; P.bl = [-s * .6, -s * .6 - .35 - .25 * Math.max(0, s)];
    P.bob = -Math.abs(Math.cos(t * sp)) * 2.5; P.lean = f.run ? 10 : 6;
    if (crouch){ P.bob = 14; P.lean = 14; P.fl[0] += .4; P.bl[0] += .1; P.fa = [1.0, 2.2]; P.ba = [.6, 1.8]; return P; }
    if (f.carry){ P.fa = [2.7, 3.1]; P.ba = [2.6, 3.0]; return P; }
    if (f.pose || f.run){ P.fa = [-s * .7, -s * .7 + 1.2]; P.ba = [s * .7, s * .7 + 1.2]; }
    if (f.hold && !f.carry) P.fa = [.5, 1.6];
    return P;
  }
  if (f.dizzy > 0){ const w = Math.sin(t * 4); P.lean = w * 7; P.fa = [.3 + w * .2, .5]; P.ba = [.2 - w * .2, .4]; P.bob = 1; P.rot = w * .05; return P; }
  if (f.slideT > 0 || f.slide > 0){ P.lean = -18; P.fl = [1.52, 1.58]; P.bl = [.7, -.5]; P.fa = [-1.0, -.4]; P.ba = [-1.3, -.6]; P.bob = 24; return P; }
  if (f.dashing > 0){ P.lean = 14; P.fl = [.9, .4]; P.bl = [-.9, -1.4]; P.fa = [1.5, 1.6]; P.ba = [-.8, -.3]; return P; }
  const pose = f.act ? f.act.pose : f.pose;
  switch (pose){
    case 'stand': P.fa = [.12, .08]; P.ba = [-.1, -.1]; P.lean = 0; return P;
    case 'phone': P.fa = [.3, 2.95]; P.ba = [-.1, -.1]; P.lean = 1; return P;
    case 'pocket': P.fa = [-.15, -.55]; P.ba = [-.1, -.1]; P.lean = 1; return P;
    case 'show': P.fa = [1.05, 2.15]; P.ba = [-.1, -.1]; P.lean = 2; return P;
    case 'give': P.fa = [1.45, 1.62]; P.ba = [.1, .1]; P.lean = 5; return P;
    case 'type': P.fa = [1.25, 2.55 + Math.sin(t * 18) * .18]; P.ba = [.9, 2.3 + Math.cos(t * 16) * .15]; P.lean = 4; return P;
    case 'wait': { const k = Math.max(0, Math.sin(t * 7)); P.fl = [.12 + k * .25, .02 + k * .5]; P.fa = [.35, 1.85]; P.ba = [.25, 1.8]; P.lean = 0; return P; }
    case 'arms':  P.fa = [.35, 1.85]; P.ba = [.25, 1.8]; P.lean = -1; return P;
    case 'shock': P.fa = [-.5, 2.6]; P.ba = [-.8, 2.4]; P.lean = -5; return P;
    case 'cheer': { const s = Math.sin(t * 8) * .2; P.fa = [2.7 + s, 3.0]; P.ba = [2.6 - s, 2.9]; P.lean = -2; P.bob = -Math.abs(Math.sin(t * 8)) * 6; return P; }
    case 'trophy': P.fa = [2.8, 3.1]; P.ba = [2.6, 3.0]; P.lean = -2; return P;
    case 'point': P.fa = [1.55, 1.6]; P.ba = [.1, .1]; P.lean = 2; return P;
    case 'bow': P.lean = 12; P.fa = [.3, .3]; P.ba = [.2, .2]; return P;
    case 'guard': P.fa = [1.1, 2.6]; P.ba = [.7, 2.4]; P.lean = 4; P.fl = [.35, .1]; P.bl = [-.35, -.3]; return P;
    case 'sit': P.fl = [1.5, 0]; P.bl = [1.4, 0]; P.bob = 20; P.lean = -2; P.fa = [.8, 1.6]; P.ba = [.6, 1.5]; return P;
    case 'crouch': P.bob = 18; P.lean = 12; P.fl = [1.0, -.3]; P.bl = [.3, -1.0]; P.fa = [1.0, 2.2]; P.ba = [.6, 1.8]; return P;
    case 'peek': P.bob = 14; P.lean = 16; P.fl = [.9, -.2]; P.bl = [.2, -.9]; P.fa = [1.2, 2.5]; P.ba = [.8, 2.0]; return P;
    case 'grabbed': P.fl = [1.4, .1]; P.bl = [.3, -1.4]; P.bob = 18; P.lean = -6; P.fa = [-.7, -.3]; P.ba = [-.9, -.4]; return P;
    case 'grab': P.fa = [1.35, 1.45]; P.ba = [1.25, 1.35]; P.lean = 6; return P;
    case 'punchA': P.fa = [1.57, 1.57]; P.lean = 10; return P;
    case 'kickA': P.fl = [1.55, 1.62]; P.lean = -10; P.fa = [.2, 1.3]; P.ba = [-.3, 1.2]; return P;
    case 'carry': P.fa = [2.7, 3.1]; P.ba = [2.6, 3.0]; return P;
    case 'lookUp': P.lean = -3; P.fa = [.12, .08]; P.ba = [-.1, -.1]; return P;
    case 'sad': P.lean = 6; P.fa = [.1, .1]; P.ba = [-.05, -.05]; P.bob = 1; return P;
  }
  if (f.stun > 0){ P.lean = -9; P.fa = [-.4, .6]; P.ba = [-.7, .2]; P.bob = 0; return P; }
  if (f.wind > 0){
    if (f.move === 'slam'){ P.fa = [2.9, 3.1]; P.ba = [2.8, 3.0]; P.lean = -6; return P; }
    if (f.move === 'dash'){ P.lean = 10; P.fa = [-.9, 1.1]; P.fl = [.5, .1]; P.bl = [-.6, -.9]; P.bob = 6; return P; }
    if (f.weapon){ P.fa = [2.6, 3.0]; P.ba = [.6, 2.2]; P.lean = -6; return P; }
    if (f.T && f.T.kick){ P.lean = -6; P.fl = [.6, -.6]; return P; }
    P.lean = -5; P.fa = [-.9, 1.1]; P.ba = [.6, 2.4]; return P; }
  if (f.strike > 0){
    if (f.move === 'slam'){ P.fa = [1.2, .9]; P.ba = [1.0, .8]; P.lean = 14; P.bob = 8; return P; }
    if (f.weapon){ P.fa = [1.3, 1.2]; P.lean = 10; return P; }
    if (f.T && f.T.kick){ P.fl = [1.55, 1.6]; P.lean = -10; return P; }
    P.lean = 8; P.fa = [1.57, 1.57]; return P; }
  if (f.atk){
    const m = f.atk.m, k = f.atk.t / m.dur;
    const ext = k < .35 ? k / .35 : Math.max(0, 1 - (k - .35) / .65);
    if (m.anim === 'punch'){
      if (f.atk.combo === 1) P.ba = [lerp(.35, 1.57, ext), lerp(2.3, 1.57, ext)];
      else P.fa = [lerp(.55, 1.57, ext), lerp(2.5, 1.57, ext)];
      P.lean = 3 + 8 * ext;
      if (f.atk.combo === 2){ P.fa = [lerp(.55, 2.3, ext), lerp(2.5, 2.6, ext)]; P.bob = -8 * ext; }
    } else if (m.anim === 'swing'){ P.fa = [lerp(2.9, 1.3, Math.min(1, k * 2.2)), lerp(3.1, 1.2, Math.min(1, k * 2.2))]; P.lean = 3 + 8 * ext; }
    else if (m.anim === 'kick'){ P.fl = [lerp(.12, 1.55, ext), lerp(.02, 1.62, ext)]; P.lean = 3 - 12 * ext; P.fa = [.2, 1.3]; P.ba = [-.3, 1.2]; }
    else if (m.anim === 'spin'){ const a = k * Math.PI * 4; P.fl = [1.5, 1.6]; P.rot = a; P.lean = 0; P.fa = [1.4, 1.5]; P.ba = [-1.4, -1.5]; P.bob = -20; }
    else if (m.anim === 'throw'){ P.fa = [lerp(2.9, 1.2, Math.min(1, k * 2)), lerp(3.1, 1.3, Math.min(1, k * 2))]; P.lean = 8 * ext; }
    else if (m.anim === 'shoot'){ const a = k < .35 ? -(k / .35) * .8 : Math.min(1.3, -.8 + ((k - .35) / .3) * 2.1); P.fl = [a, a < 0 ? a - .7 : a]; P.lean = -4; P.fa = [.9, 1.2]; P.ba = [-.6, -.3]; }
    return P;
  }
  if (f.carry){ P.fa = [2.7, 3.1]; P.ba = [2.6, 3.0]; return P; }
  if (f.blocking){ P.fa = [1.0, 3.0]; P.ba = [.8, 2.9]; P.lean = -2; return P; }
  if (crouch){ P.bob = 18; P.lean = 10; P.fl = [1.0, -.3]; P.bl = [.3, -1.0]; P.fa = [1.1, 2.6]; P.ba = [.7, 2.4]; return P; }
  if (f.onGround === false){ P.fl = [.7, -.3]; P.bl = [-.1, -1.0]; P.fa = [.9, 2.6]; P.ba = [-.5, .3]; return P; }
  if (f.hold) P.fa = [.5, 1.6];
  return P;
}

/* ---------- elde tutulan eşyalar ---------- */
function drawHeld(c, kind, ang){
  c.save(); c.rotate(-ang + Math.PI / 2); c.lineWidth = 2; c.strokeStyle = INK;
  switch (kind){
    case 'sopa': c.fillStyle = '#9a6a3a'; c.beginPath(); c.moveTo(-3, -2); c.lineTo(46, -5); c.lineTo(46, 5); c.lineTo(-3, 2); c.closePath(); c.fill(); c.stroke(); break;
    case 'boru': c.fillStyle = '#8a929c'; rr(c, -4, -3, 50, 6, 3); c.fill(); c.stroke(); c.fillStyle = '#5d646c'; c.fillRect(40, -4, 7, 8); break;
    case 'sise': c.fillStyle = '#2e8b57'; rr(c, 0, -4, 20, 8, 3); c.fill(); c.stroke(); c.fillRect(19, -2, 9, 4); break;
    case 'paper': c.rotate(Math.PI / 2 - .3); c.fillStyle = '#f3ecd8'; c.fillRect(-6, -14, 13, 16); c.strokeRect(-6, -14, 13, 16); c.fillStyle = '#8a1c1c'; c.beginPath(); c.arc(0, -8, 3, 0, 7); c.fill(); break;
    case 'phone': c.rotate(Math.PI / 2); c.fillStyle = '#111111'; rr(c, -4, -14, 9, 16, 2); c.fill(); c.fillStyle = '#5ab0ff'; c.fillRect(-3, -12, 7, 11); break;
    case 'file': c.rotate(Math.PI / 2 - .2); c.fillStyle = '#c9a65a'; c.fillRect(-11, -16, 22, 17); c.strokeRect(-11, -16, 22, 17); c.fillStyle = '#b3122e'; c.fillRect(-6, -12, 10, 4); break;
    case 'card': c.rotate(Math.PI / 2); c.fillStyle = '#0d0d0d'; c.fillRect(-8, -10, 16, 10); c.strokeStyle = '#c9a227'; c.strokeRect(-8, -10, 16, 10); break;
  }
  c.restore();
}

/* ---------- gövde (dış çizgili, gölgeli çizgi film) ---------- */
function drawHuman(c, x, y, look, P, face, s = 1, alpha = 1, tint = null, ex = 'neutral', talk = false, hold = null){
  const sc = s * (look.scale || 1);
  const col = k => tint || look[k];
  const back = k => tint || shade(look[k], .7);
  const out = !tint;
  c.save(); c.translate(x, y); c.globalAlpha = alpha;
  if (P.lie){ c.translate(0, -10 * sc); c.scale(face * sc, sc); c.rotate(-Math.PI / 2); }
  else { c.scale(face * sc, sc); if (P.rot){ c.translate(0, -60); c.rotate(P.rot); c.translate(0, 60); } }
  c.lineCap = 'round'; c.lineJoin = 'round';
  const hip = [0, -56 + P.bob], sh = [P.lean, -97 + P.bob];
  const seg = (pts, color, w) => { if (out){ c.strokeStyle = INK; c.lineWidth = w + 3.2; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
    c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };
  function leg(a, cc, isBack){
    const k = [hip[0] + Math.sin(a[0]) * 28, hip[1] + Math.cos(a[0]) * 28];
    const f = [k[0] + Math.sin(a[1]) * 27, k[1] + Math.cos(a[1]) * 27];
    if (look.sh){ const m = [lerp(hip[0], k[0], .62), lerp(hip[1], k[1], .62)];
      seg([m, k], cc('skin'), 10.5); seg([k, f], cc('socks'), 10); seg([hip, m], cc('shorts'), 15); }
    else { seg([hip, k], cc('shorts'), 13); seg([k, f], look.robe ? cc('shorts') : cc('socks'), 11); }
    c.fillStyle = cc('shoes'); c.beginPath(); c.ellipse(f[0] + 4.5, f[1] + 1, 9, 5, 0, 0, 7); c.fill(); if (out){ c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke(); }
  }
  function arm(a, cc){
    const e = [sh[0] + Math.sin(a[0]) * 23, sh[1] + 4 + Math.cos(a[0]) * 23];
    const h = [e[0] + Math.sin(a[1]) * 22, e[1] + Math.cos(a[1]) * 22];
    seg([[sh[0], sh[1] + 4], e], cc('shirt'), look.robe ? 13 : 11);
    seg([e, h], look.suit ? cc('shirt') : cc('skin'), 9);
    c.fillStyle = look.gloves && !tint ? '#f5f5f5' : cc('skin'); c.beginPath(); c.arc(h[0], h[1], look.gloves ? 7.5 : 6.3, 0, 7); c.fill(); if (out){ c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke(); }
    return { h, a: a[1] };
  }
  leg(P.bl, back, true); arm(P.ba, back); leg(P.fl, col);
  // gövde
  const wb = look.robe ? 16 : 13, ws = 18;
  c.beginPath(); c.moveTo(hip[0] - wb, hip[1] + (look.robe ? 18 : 4)); c.lineTo(hip[0] + wb, hip[1] + (look.robe ? 18 : 4));
  c.lineTo(sh[0] + ws, sh[1] + 2); c.quadraticCurveTo(sh[0], sh[1] - 7, sh[0] - ws, sh[1] + 2); c.closePath();
  c.fillStyle = col('shirt'); c.fill();
  if (out){ c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-40, -140, 32 + P.lean * .5, 140); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(sh[0] + 8, sh[1], 10, 60);
      if (look.stripe){ c.fillStyle = look.stripe; const my = lerp(hip[1], sh[1], .52); c.fillRect(-30, my - 4, 60, 8); }
      if (look.num){ c.fillStyle = look.stripe || '#ffffff'; c.font = 'bold 13px ' + FONT; c.textAlign = 'center'; c.save(); c.scale(-1, 1); c.restore(); }
      if (look.belt){ c.fillStyle = look.belt; c.fillRect(-30, hip[1] - 3, 60, 7); }
      if (look.robe){ c.strokeStyle = shade(look.shirt, .7); c.lineWidth = 2; c.beginPath(); c.moveTo(sh[0] - 4, sh[1] + 2); c.lineTo(hip[0] + 6, hip[1] - 3); c.stroke(); }
      if (look.tie){ c.fillStyle = '#e8e8e8'; c.beginPath(); c.moveTo(sh[0] + 5, sh[1] + 1); c.lineTo(sh[0] + 14, sh[1] + 1); c.lineTo(lerp(hip[0], sh[0], .5) + 12, lerp(hip[1], sh[1], .5)); c.fill(); c.fillStyle = look.tie; c.fillRect(sh[0] + 8, sh[1] + 2, 4, 24); }
      c.restore(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(); }
  // baş
  const hx = sh[0] + 2, hy = sh[1] - 18;
  seg([[sh[0], sh[1]], [hx, hy + 9]], col('skin'), 8);
  c.fillStyle = col('skin'); c.beginPath(); c.arc(hx, hy, 14, 0, 7); c.fill();
  if (out){ c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc(hx, hy, 14, Math.PI * .55, Math.PI * 1.45); c.fill();
    c.fillStyle = shade(look.skin, .85); c.beginPath(); c.ellipse(hx - 3, hy + 1, 3, 4, 0, 0, 7); c.fill();
    sideHair(c, hx, hy, look); sideFace(c, hx, hy, look, ex, talk); }
  const fa = arm(P.fa, col);
  if (hold === 'box'){ c.fillStyle = '#a0723f'; c.fillRect(fa.h[0] - 26, fa.h[1] - 40, 46, 38); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(fa.h[0] - 26, fa.h[1] - 40, 46, 38); }
  else if (hold) { c.save(); c.translate(fa.h[0], fa.h[1]); drawHeld(c, hold, fa.a); c.restore(); }
  if (look.shield && !P.lie){ c.fillStyle = tint || 'rgba(170,200,240,.6)'; c.strokeStyle = INK; c.lineWidth = 2.5; rr(c, fa.h[0] - 2, fa.h[1] - 36, 15, 66, 5); c.fill(); c.stroke(); }
  c.restore();
  return P.lie ? [x - face * 40 * sc, y - 12 * sc] : [x + face * fa.h[0] * sc, y + fa.h[1] * sc];
}
/* yere düşmüş birinin başının yeri (yıldızlar burada döner) */
const headPos = (f, sc = 1) => f.dead || f.down > 0 ? [f.x - f.face * 108 * sc, f.y - 14 * sc] : [f.x + f.face * 4 * sc, f.y - 118 * sc];
function dizzyStars(c, x, y, t, n = 3, r = 20){ c.fillStyle = '#fff176'; for (let i = 0; i < n; i++){ const a = t * 6 + i * (Math.PI * 2 / n); drawStar(c, x + Math.cos(a) * r, y + Math.sin(a) * r * .35, 6); } }

/* ---------- portre (önden) ---------- */
function drawPortrait(c, cx, cy, R, key, ex = 'neutral', talk = false){
  const look = LOOK[key]; if (!look) return;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = look.shirt; c.beginPath(); c.ellipse(cx, cy + R * 1.55, R * 1.25, R * .8, 0, Math.PI, 0); c.fill();
  if (look.stripe){ c.fillStyle = look.stripe; c.fillRect(cx - R * 1.15, cy + R * 1.18, R * 2.3, R * .16); }
  if (look.tie){ c.fillStyle = '#e8e8e8'; c.beginPath(); c.moveTo(cx - R * .3, cy + R * .8); c.lineTo(cx + R * .3, cy + R * .8); c.lineTo(cx, cy + R * 1.4); c.fill(); c.fillStyle = look.tie; c.fillRect(cx - R * .08, cy + R * .85, R * .16, R * .7); }
  if (look.robe){ c.strokeStyle = shade(look.shirt, .7); c.lineWidth = R * .06; c.beginPath(); c.moveTo(cx - R * .5, cy + R * .8); c.lineTo(cx + R * .2, cy + R * 1.5); c.stroke(); }
  c.fillStyle = look.skin; c.fillRect(cx - R * .28, cy + R * .6, R * .56, R * .35);
  if (look.hs === 'bun'){ c.fillStyle = look.hair; c.beginPath(); c.arc(cx, cy - R * 1.1, R * .3, 0, 7); c.fill(); }
  c.fillStyle = shade(look.skin, .92); c.beginPath(); c.arc(cx - R * .92, cy + R * .05, R * .17, 0, 7); c.arc(cx + R * .92, cy + R * .05, R * .17, 0, 7); c.fill();
  c.fillStyle = look.skin; c.beginPath(); c.ellipse(cx, cy, R * .9, R, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, R * .05); c.stroke();
  if (look.shadow){ c.fillStyle = '#0a0a0a'; c.beginPath(); c.ellipse(cx, cy, R * .92, R * 1.02, 0, 0, 7); c.fill();
    c.fillStyle = '#ff2020'; c.fillRect(cx - R * .45, cy - R * .1, R * .25, R * .07); c.fillRect(cx + R * .2, cy - R * .1, R * .25, R * .07); }
  if (look.hs === 'mask'){ c.fillStyle = '#0f0f0f'; c.beginPath(); c.ellipse(cx, cy, R * .92, R * 1.02, 0, 0, 7); c.fill(); }
  if (look.beard && !look.shadow){ c.fillStyle = look.beard;
    if (look.bs === 'long'){ c.beginPath(); c.moveTo(cx - R * .75, cy + R * .2); c.quadraticCurveTo(cx - R * .6, cy + R * 1.6, cx, cy + R * 1.75); c.quadraticCurveTo(cx + R * .6, cy + R * 1.6, cx + R * .75, cy + R * .2); c.quadraticCurveTo(cx, cy + R * .75, cx - R * .75, cy + R * .2); c.fill(); }
    else if (look.bs === 'goatee'){ c.beginPath(); c.ellipse(cx, cy + R * .78, R * .25, R * .25, 0, 0, 7); c.fill(); }
    else if (look.bs === 'full'){ c.beginPath(); c.moveTo(cx - R * .88, cy + R * .05); c.quadraticCurveTo(cx - R * .7, cy + R * 1.2, cx, cy + R * 1.15); c.quadraticCurveTo(cx + R * .7, cy + R * 1.2, cx + R * .88, cy + R * .05); c.quadraticCurveTo(cx, cy + R * .55, cx - R * .88, cy + R * .05); c.fill(); }
    else { c.globalAlpha = .4; c.beginPath(); c.ellipse(cx, cy + R * .55, R * .7, R * .42, 0, 0, Math.PI); c.fill(); c.globalAlpha = 1; } }
  const hc = look.hair;
  switch (look.hs){
    case 'short': c.fillStyle = hc; c.beginPath(); c.ellipse(cx, cy - R * .5, R * .95, R * .6, 0, Math.PI, 0); c.fill(); c.fillRect(cx - R * .95, cy - R * .52, R * .18, R * .35); c.fillRect(cx + R * .77, cy - R * .52, R * .18, R * .35); break;
    case 'curly': c.fillStyle = hc; for (let i = 0; i < 9; i++){ const a = Math.PI * (1.04 + i * .115); c.beginPath(); c.arc(cx + Math.cos(a) * R * .8, cy - R * .42 + Math.sin(a) * R * .62, R * .25, 0, 7); c.fill(); } break;
    case 'bun': c.fillStyle = hc; c.beginPath(); c.ellipse(cx, cy - R * .52, R * .92, R * .55, 0, Math.PI, 0); c.fill(); break;
    case 'spiky': c.fillStyle = hc; c.beginPath(); c.ellipse(cx, cy - R * .52, R * .95, R * .55, 0, Math.PI, 0); c.fill();
      for (let i = 0; i < 7; i++){ const x0 = cx - R * .9 + i * R * .3; c.beginPath(); c.moveTo(x0 - R * .15, cy - R * .6); c.lineTo(x0 + R * .05, cy - R * 1.45 + (i % 2) * R * .2); c.lineTo(x0 + R * .25, cy - R * .6); c.fill(); } break;
    case 'cap': c.fillStyle = look.cap; c.beginPath(); c.ellipse(cx, cy - R * .48, R * .98, R * .62, 0, Math.PI, 0); c.fill(); c.fillRect(cx - R * 1.05, cy - R * .52, R * 2.1, R * .16); break;
    case 'helmet': c.fillStyle = '#3d4a63'; c.beginPath(); c.ellipse(cx, cy - R * .35, R * 1.05, R * .82, 0, Math.PI, 0); c.fill(); break;
    case 'hat': c.fillStyle = '#0d0d0d'; c.fillRect(cx - R * 1.25, cy - R * .62, R * 2.5, R * .16); c.fillRect(cx - R * .72, cy - R * 1.45, R * 1.44, R * .88); c.fillStyle = '#5a0000'; c.fillRect(cx - R * .72, cy - R * .8, R * 1.44, R * .14); break;
    case 'bald': c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(cx - R * .3, cy - R * .65, R * .3, R * .14, -.3, 0, 7); c.fill(); break;
  }
  if (look.headband){ c.fillStyle = look.headband; c.fillRect(cx - R * .9, cy - R * .56, R * 1.8, R * .17); }
  if (look.bandana){ c.fillStyle = look.bandana; c.fillRect(cx - R * .92, cy - R * .58, R * 1.84, R * .19); }
  if (!look.shadow){
    const ey = cy - R * .06, ex1 = cx - R * .36, ex2 = cx + R * .36;
    if (look.hs === 'mask'){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(ex1, ey, R * .16, R * .09, .2, 0, 7); c.ellipse(ex2, ey, R * .16, R * .09, -.2, 0, 7); c.fill(); }
    else if (look.glasses){ c.fillStyle = '#0a0a0a'; rr(c, ex1 - R * .25, ey - R * .14, R * .5, R * .28, R * .08); c.fill(); rr(c, ex2 - R * .25, ey - R * .14, R * .5, R * .28, R * .08); c.fill(); c.fillRect(ex1, ey - R * .06, ex2 - ex1, R * .06);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(ex1 - R * .15, ey - R * .1, R * .12, R * .06); c.fillRect(ex2 - R * .15, ey - R * .1, R * .12, R * .06); }
    else if (ex === 'ko'){ c.strokeStyle = INK; c.lineWidth = R * .06; for (const exx of [ex1, ex2]){ c.beginPath(); c.moveTo(exx - R * .12, ey - R * .12); c.lineTo(exx + R * .12, ey + R * .12); c.moveTo(exx + R * .12, ey - R * .12); c.lineTo(exx - R * .12, ey + R * .12); c.stroke(); } }
    else { const eh = ex === 'shock' ? R * .17 : ex === 'angry' ? R * .09 : ex === 'happy' ? R * .08 : R * .13;
      for (const exx of [ex1, ex2]){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(exx, ey, R * .17, eh, 0, 0, 7); c.fill();
        c.fillStyle = look.eye || '#2a1a10'; c.beginPath(); c.arc(exx, ey + R * .01, Math.min(R * .085, eh), 0, 7); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(exx + R * .03, ey - R * .03, R * .025, 0, 7); c.fill(); } }
    if (look.hs !== 'mask'){
      c.strokeStyle = look.brow || (['bald', 'hat', 'helmet', 'cap'].includes(look.hs) ? '#2a1a10' : shade(look.hair, .8)); c.lineWidth = R * .09;
      const by = cy - R * .31, tilt = ex === 'angry' || ex === 'shout' ? R * .12 : ex === 'sad' || ex === 'pain' ? -R * .1 : 0, lift = ex === 'shock' ? -R * .1 : 0;
      c.beginPath(); c.moveTo(ex1 - R * .2, by + lift - tilt * .3); c.lineTo(ex1 + R * .2, by + lift + tilt); c.moveTo(ex2 + R * .2, by + lift - tilt * .3); c.lineTo(ex2 - R * .2, by + lift + tilt); c.stroke();
      c.strokeStyle = shade(look.skin, .72); c.lineWidth = R * .05; c.beginPath(); c.moveTo(cx, cy - R * .02); c.lineTo(cx - R * .08, cy + R * .25); c.lineTo(cx + R * .06, cy + R * .28); c.stroke();
      const my = cy + R * .5, open = talk && Math.sin(gameTime * 20) > 0;
      c.strokeStyle = '#4a1a14'; c.fillStyle = '#5a1515'; c.lineWidth = R * .06;
      if (ex === 'shock' || ex === 'shout' || open){ c.beginPath(); c.ellipse(cx, my, R * (open && ex !== 'shock' ? .16 : .13), R * (open ? .12 : .16), 0, 0, 7); c.fill(); }
      else if (ex === 'happy'){ c.beginPath(); c.arc(cx, my - R * .14, R * .26, .35, Math.PI - .35); c.stroke(); }
      else if (ex === 'angry' || ex === 'sad' || ex === 'pain'){ c.beginPath(); c.arc(cx, my + R * .16, R * .22, Math.PI + .5, -.5); c.stroke(); }
      else if (ex === 'smirk'){ c.beginPath(); c.moveTo(cx - R * .2, my); c.quadraticCurveTo(cx + R * .05, my + R * .06, cx + R * .24, my - R * .1); c.stroke(); }
      else { c.beginPath(); c.moveTo(cx - R * .18, my); c.lineTo(cx + R * .18, my); c.stroke(); }
      if (look.scar){ c.strokeStyle = '#8a3a3a'; c.lineWidth = R * .05; c.beginPath(); c.moveTo(ex2 - R * .2, cy - R * .55); c.lineTo(ex2 + R * .15, cy + R * .25); c.stroke(); }
    }
  }
  c.restore();
}

/* =========================================================
   IŞIK — lambaya yakın dar, aşağı doğru genişleyen koni
   ========================================================= */
function lightCone(c, x, y0, w0, w1, y1, rgb = '255,232,170', a = .32){
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - w0 / 2, y0); c.lineTo(x + w0 / 2, y0); c.lineTo(x + w1 / 2, y1); c.lineTo(x - w1 / 2, y1); c.closePath(); c.fill();
  const g2 = c.createRadialGradient(x, y1 - 2, 4, x, y1 - 2, w1 * .5); g2.addColorStop(0, 'rgba(' + rgb + ',' + a * .5 + ')'); g2.addColorStop(1, 'rgba(' + rgb + ',0)');
  c.fillStyle = g2; c.beginPath(); c.ellipse(x, y1, w1 * .55, 14, 0, 0, 7); c.fill();
}

/* =========================================================
   MEKANLAR
   ========================================================= */
const CROWD = []; for (let i = 0; i < 620; i++){ const row = Math.floor(i / 52);
  CROWD.push({ x: (i % 52) * 18.5 + (row % 2) * 9 + rand(-2, 2), y: 124 + row * 15, c: ['#e6e6e6','#f2c230','#14306b','#c43c3c','#7a8cff','#ffffff','#2a4fa8'][Math.floor(Math.random() * 7)], ph: Math.random() * 6 }); }
const BUILD = []; { let x = -20; while (x < W + 40){ const w = rand(50, 110); BUILD.push({ x, w, h: rand(110, 300) }); x += w + rand(2, 10); } }

function monitorFace(c, mx, my, w, h, kind, i, t){
  c.fillStyle = '#0d1a2e'; c.fillRect(mx, my, w, h);
  if (kind === 'masked'){ c.fillStyle = '#1d2533'; c.fillRect(mx, my, w, h); drawPortrait(c, mx + w / 2 + (i % 3 - 1) * 8, my + h * .55, h * .27, 'masked', 'angry'); }
  else if (kind === 'lider'){ c.fillStyle = '#2a0c12'; c.fillRect(mx, my, w, h); drawPortrait(c, mx + w / 2, my + h * .5, h * .28, 'lider', 'smirk', true); }
  else if (kind === 'players'){
    c.fillStyle = '#3a3a40'; c.fillRect(mx, my, w, h); c.fillStyle = '#2a2a30'; c.fillRect(mx, my + h * .7, w, h * .3); c.fillStyle = '#55555e'; c.fillRect(mx + w * .7, my + h * .15, w * .2, h * .25);
    if (i === 5){ for (let j = 0; j < 4; j++) drawPortrait(c, mx + w * (.18 + j * .21), my + h * .58, h * .16, j % 2 ? 'mate2' : 'mate', 'sad'); txt(c, 'ODA 3', mx + 4, my + 11, 9, '#ff5a5a'); }
    else drawPortrait(c, mx + w / 2, my + h * .58, h * .25, i % 2 ? 'mate2' : 'mate', i % 3 ? 'sad' : 'shock'); }
  else { c.fillStyle = Math.sin(t * 3 + i) > 0 ? '#1b3a5c' : '#16304d'; c.fillRect(mx, my, w, h); c.fillStyle = 'rgba(120,200,255,.25)'; c.fillRect(mx + 6, my + h * .55, w * .5, 3); c.fillRect(mx + 6, my + h * .7, w * .7, 3); }
  c.fillStyle = 'rgba(255,255,255,.06)'; for (let yy = my; yy < my + h; yy += 3) c.fillRect(mx, yy, w, 1);
}
function crtOff(c, x, y, w, h, k){ // k: 0..1 kapanma
  c.fillStyle = '#000000'; c.fillRect(x, y, w, h);
  if (k < 1){ const lh = Math.max(1, h * (1 - k * 2.2)), lw = w * (k < .45 ? 1 : 1 - (k - .45) / .55);
    c.fillStyle = 'rgba(230,240,255,' + (1 - k * .6) + ')'; c.fillRect(x + (w - lw) / 2, y + (h - lh) / 2, lw, lh); }
}
function bigScreenContent(c, x, y, w, h, kind, t, offK){
  c.fillStyle = '#05070c'; c.fillRect(x, y, w, h);
  if (kind === 'off' || !kind){ if (offK != null && offK < 1) crtOff(c, x + 4, y + 4, w - 8, h - 8, offK); else { c.fillStyle = '#0b0f18'; c.fillRect(x + 4, y + 4, w - 8, h - 8); } return; }
  c.save(); c.beginPath(); c.rect(x + 4, y + 4, w - 8, h - 8); c.clip();
  c.fillStyle = '#0d1a2e'; c.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === 'lider'){ c.fillStyle = '#2a0c12'; c.fillRect(x, y, w, h); drawPortrait(c, cx, cy - h * .05, h * .3, 'lider', 'smirk', true); }
  else if (kind === 'usta'){ c.fillStyle = '#2a2116'; c.fillRect(x, y, w, h); drawPortrait(c, cx, cy - h * .05, h * .3, 'usta', 'sad'); }
  else if (kind === 'ufisPhoto'){ c.fillStyle = '#3d2e1c'; c.fillRect(x, y, w, h); drawPortrait(c, cx, cy - h * .05, h * .3, 'ufisGenc', 'neutral');
    c.globalCompositeOperation = 'color'; c.fillStyle = '#a07848'; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'source-over'; }
  else if (kind === 'players'){ for (let i = 0; i < 6; i++) monitorFace(c, x + 10 + (i % 3) * (w - 20) / 3, y + 10 + Math.floor(i / 3) * (h - 20) / 2, (w - 20) / 3 - 6, (h - 20) / 2 - 6, 'players', i === 4 ? 5 : i, t); }
  else if (kind === 'masked'){ for (let i = 0; i < 3; i++) drawPortrait(c, x + w * (.25 + i * .25), cy, h * .2, 'masked', 'angry'); }
  else if (kind === 'watch'){ drawPortrait(c, x + w * .3, cy, h * .24, 'issem', 'neutral'); drawPortrait(c, x + w * .7, cy, h * .24, 'ufis', 'neutral');
    c.fillStyle = Math.sin(t * 5) > 0 ? '#ff2020' : '#550000'; c.beginPath(); c.arc(x + 20, y + 20, 6, 0, 7); c.fill(); txt(c, 'REC', x + 32, y + 26, 14, '#ff4040'); }
  else if (kind === 'split'){ c.fillStyle = '#245c2e'; c.fillRect(x, y, w / 2, h); c.fillStyle = '#2a2d33'; c.fillRect(x + w / 2, y, w / 2, h);
    drawPortrait(c, x + w * .25, cy, h * .22, 'issem', 'neutral'); drawPortrait(c, x + w * .75, cy, h * .22, 'ufis', 'angry'); c.fillStyle = '#000000'; c.fillRect(cx - 2, y, 4, h); }
  else if (kind === 'stadium'){ c.fillStyle = '#0a1230'; c.fillRect(x, y, w, h); c.fillStyle = '#2f8f3a'; c.beginPath(); c.ellipse(cx, cy + h * .2, w * .38, h * .22, 0, 0, 7); c.fill();
    c.strokeStyle = '#8a93b0'; c.lineWidth = 6; c.beginPath(); c.ellipse(cx, cy + h * .2, w * .44, h * .3, 0, 0, 7); c.stroke();
    c.fillStyle = '#f2c230'; c.fillRect(x + w * .08, y + h * .1, w * .84, h * .22); txt(c, 'DÜNYA ŞAMPİYONLAR TURNUVASI', cx, y + h * .25, 16, '#14306b', 'center', 'bold', 0, w * .78); }
  c.fillStyle = 'rgba(255,255,255,.05)'; for (let yy = y; yy < y + h; yy += 4) c.fillRect(x, yy, w, 1);
  c.restore();
}
const THEMES = {
  guvenlik: { wall:'#252b38', floor:'#363b45', props:[['ceilingCam', 110], ['monitors', 520], ['desk', 520]] },
  depo:     { wall:'#4b4036', floor:'#5a5046', props:[['crates', 40], ['lamp', 300], ['tablePhotos', 480], ['lamp', 680], ['crates', 760]] },
  safe:     { wall:'#5b4b3d', floor:'#6f5a44', props:[['window', 120], ['lamp', 430], ['sofa', 600]] },
  liderOda: { wall:'#161019', floor:'#1e1622', props:[['bigscreen', 560], ['desk', 160], ['chair', 300]] },
  fabrikaDis:{ outdoor:true, wall:'#2c3138', floor:'#2b2b2e', props:[['factory', 0], ['wallCam', 0], ['tower', 760], ['streetlamp', 90], ['fence', 0]] },
  fabrika:  { wall:'#363b40', floor:'#4a4e54', props:[['pipes', 0], ['monitors', 330], ['lamp', 150], ['lamp', 650], ['servers', 800]] },
  kapi:     { wall:'#363b40', floor:'#4a4e54', props:[['pipes', 0], ['lamp', 300], ['speaker', 420], ['keypad', 580], ['door', 660]] },
  eskiOkul: { wall:'#7d6e57', floor:'#665338', props:[['beams', 0], ['medals', 220], ['medals', 640], ['cracks', 0]], dim:.18 },
  leo:      { wall:'#e6dfd1', floor:'#9a7a55', props:[['trophies', 110], ['window', 480], ['desk', 640]] },
  karargah: { wall:'#141d2b', floor:'#1f2937', props:[['bluelights', 0], ['servers', 40], ['bigscreen', 480], ['servers', 840]] },
  salon:    { wall:'#5e4f3f', floor:'#b48550', props:[['hoops', 60], ['lamp', 320], ['lamp', 640], ['hoops', 900], ['courtlines', 0]], dim:.2 },
  soyunma:  { wall:'#21406a', floor:'#7a7f87', props:[['lockers', 0], ['banner', 480]] },
  gizli:    { wall:'#24211e', floor:'#2e2a26', props:[['redlights', 0], ['bars', 140], ['door', 640]] },
};
function drawProp(c, kind, x, st, t){
  switch (kind){
    case 'monitors': { const offK = st.screen === 'off' && st.offT != null ? st.offT / .45 : null;
      c.fillStyle = '#20242c'; c.fillRect(x - 180, 62, 362, 140);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++){ const mx = x - 172 + i * 89, my = 68 + r * 66, idx = r * 4 + i;
        c.fillStyle = '#111111'; c.fillRect(mx, my, 82, 60);
        if (st.screen === 'off'){ if (offK != null && offK < 1) crtOff(c, mx + 3, my + 3, 76, 54, offK); else { c.fillStyle = '#05070c'; c.fillRect(mx + 3, my + 3, 76, 54); } }
        else monitorFace(c, mx + 3, my + 3, 76, 54, st.screen || 'static', idx, t); } } break;
    case 'desk': c.fillStyle = '#3a2b20'; c.fillRect(x - 110, 395, 220, 14); c.fillRect(x - 100, 409, 10, 50); c.fillRect(x + 90, 409, 10, 50);
      c.fillStyle = '#20242c'; c.fillRect(x - 40, 365, 70, 30); c.fillStyle = '#5ab0ff'; c.fillRect(x - 36, 369, 62, 22); break;
    case 'chair': c.fillStyle = '#2a1520'; rr(c, x - 30, 330, 60, 80, 10); c.fill(); c.fillRect(x - 5, 410, 10, 50); break;
    case 'ceilingCam': c.fillStyle = '#5a606a'; c.fillRect(x + 8, 0, 6, 30); c.fillRect(x - 4, 0, 30, 5);
      c.fillStyle = '#d0d4dc'; rr(c, x - 6, 28, 38, 18, 4); c.fill(); c.fillStyle = '#222222'; c.fillRect(x + 28, 32, 10, 10);
      c.fillStyle = Math.sin(t * 4) > 0 ? '#ff2020' : '#550000'; c.beginPath(); c.arc(x + 2, 37, 3, 0, 7); c.fill(); break;
    case 'wallCam': { const cx = x + 640, cy = 130; c.fillStyle = '#5a606a'; c.fillRect(cx - 4, cy, 18, 5); c.fillRect(cx + 10, cy - 6, 5, 16);
      c.fillStyle = '#d0d4dc'; rr(c, cx - 38, cy - 8, 38, 18, 4); c.fill(); c.fillStyle = '#222222'; c.fillRect(cx - 46, cy - 4, 10, 10);
      c.fillStyle = Math.sin(t * 4) > 0 ? '#ff2020' : '#550000'; c.beginPath(); c.arc(cx - 6, cy + 1, 3, 0, 7); c.fill(); } break;
    case 'crates': for (let i = 0; i < 3; i++){ const bx = x + (i % 2) * 70, by = 470 - 70 * (1 + Math.floor(i / 2)); c.fillStyle = '#8a6438'; c.fillRect(bx, by, 68, 68); c.strokeStyle = '#5a3f22'; c.lineWidth = 4; c.strokeRect(bx + 2, by + 2, 64, 64); c.beginPath(); c.moveTo(bx + 4, by + 4); c.lineTo(bx + 64, by + 64); c.stroke(); } break;
    case 'lamp': c.strokeStyle = '#222222'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 58); c.stroke();
      c.fillStyle = '#333333'; c.beginPath(); c.moveTo(x - 20, 76); c.lineTo(x + 20, 76); c.lineTo(x + 8, 58); c.lineTo(x - 8, 58); c.fill();
      c.fillStyle = '#fff3c0'; c.beginPath(); c.ellipse(x, 77, 10, 3, 0, 0, 7); c.fill(); lightCone(c, x, 77, 34, 300, 470); break;
    case 'streetlamp': c.fillStyle = '#2a2d3a'; c.fillRect(x - 4, 250, 8, 220); c.fillRect(x - 4, 250, 46, 6); c.fillStyle = '#3a3e4c'; rr(c, x + 26, 246, 34, 12, 4); c.fill();
      c.fillStyle = '#fff3c0'; c.fillRect(x + 30, 257, 26, 3); lightCone(c, x + 43, 259, 26, 230, 470, '255,226,150', .3); break;
    case 'tablePhotos': c.fillStyle = '#4a3527'; c.fillRect(x - 100, 400, 200, 12); c.fillRect(x - 90, 412, 10, 58); c.fillRect(x + 80, 412, 10, 58);
      for (let i = 0; i < 4; i++){ c.fillStyle = '#f2f2f2'; c.fillRect(x - 85 + i * 44, 384, 36, 28); drawPortrait(c, x - 67 + i * 44, 395, 6, i % 2 ? 'mate2' : 'mate', 'neutral'); }
      c.fillStyle = '#c0392b'; c.fillRect(x - 10, 378, 6, 30); break;
    case 'window': c.fillStyle = '#0c1430'; c.fillRect(x, 90, 180, 150); c.fillStyle = '#ffd666'; for (let i = 0; i < 18; i++) c.fillRect(x + 10 + (i * 37) % 160, 120 + (i * 53) % 100, 5, 7);
      c.strokeStyle = '#6b5340'; c.lineWidth = 8; c.strokeRect(x, 90, 180, 150); c.beginPath(); c.moveTo(x + 90, 90); c.lineTo(x + 90, 240); c.stroke(); break;
    case 'sofa': c.fillStyle = '#6b2f2f'; rr(c, x - 110, 360, 220, 60, 14); c.fill(); rr(c, x - 120, 400, 240, 50, 12); c.fill(); break;
    case 'bigscreen': { const w = 380, h = 210; c.fillStyle = '#0a0a0a'; c.fillRect(x - w / 2 - 8, 42, w + 16, h + 16);
      bigScreenContent(c, x - w / 2, 50, w, h, st.screen, t, st.screen === 'off' && st.offT != null ? st.offT / .45 : null); } break;
    case 'factory': c.fillStyle = '#20252c'; c.fillRect(x + 40, 110, 600, 300); c.fillStyle = '#2a3038'; c.beginPath(); c.moveTo(x + 40, 110); c.lineTo(x + 190, 60); c.lineTo(x + 340, 110); c.lineTo(x + 490, 60); c.lineTo(x + 640, 110); c.fill();
      c.fillStyle = '#ffd666'; for (let i = 0; i < 6; i++) c.fillRect(x + 90 + i * 85, 180, 40, 30); txt(c, 'FABRİKA NO: 7', x + 340, 150, 22, '#8a93a0', 'center');
      // yan kapı
      { const dk = st.doorK || 0; c.fillStyle = '#0a0a0a'; c.fillRect(x + 520, 300, 70, 110); c.fillStyle = '#4b5059'; c.fillRect(x + 520, 300, 70 * (1 - dk * .9), 110); c.strokeStyle = '#2a2d33'; c.lineWidth = 3; c.strokeRect(x + 520, 300, 70, 110);
        c.fillStyle = '#ffcc00'; c.fillRect(x + 528, 290, 54, 6); } break;
    case 'tower': c.fillStyle = '#3a4048'; c.fillRect(x + 6, 50, 14, 360); c.fillRect(x - 10, 44, 46, 14); c.fillStyle = '#d0d4dc'; c.fillRect(x - 2, 30, 30, 16);
      { const a = Math.sin(t * .8) * .5; c.save(); c.translate(x + 13, 46); c.rotate(a); const g = c.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(255,255,200,.4)'); g.addColorStop(1, 'rgba(255,255,200,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(120, 420); c.lineTo(-120, 420); c.fill(); c.restore(); } break;
    case 'fence': c.strokeStyle = '#555c66'; c.lineWidth = 2; for (let fx = x; fx < x + W; fx += 24){ if (fx > x + 300 && fx < x + 380) continue; c.beginPath(); c.moveTo(fx, 330); c.lineTo(fx + 24, 410); c.moveTo(fx + 24, 330); c.lineTo(fx, 410); c.stroke(); } c.fillStyle = '#6b737e'; c.fillRect(x, 326, 300, 5); c.fillRect(x + 380, 326, W - 380, 5); break;
    case 'pipes': c.fillStyle = '#5d646c'; c.fillRect(x, 60, W, 16); c.fillRect(x, 92, W, 10); c.fillStyle = '#7a828b'; for (let px = x + 40; px < x + W; px += 200) c.fillRect(px, 54, 14, 28); c.fillStyle = '#b3122e'; for (let px = x + 140; px < x + W; px += 320){ c.beginPath(); c.arc(px, 97, 9, 0, 7); c.fill(); } break;
    case 'servers': for (let i = 0; i < 2; i++){ const sx = x + i * 46 - 46; c.fillStyle = '#0d1117'; c.fillRect(sx, 170, 42, 230); for (let j = 0; j < 12; j++){ c.fillStyle = Math.sin(t * 6 + i * 3 + j * 1.7) > .3 ? '#2ecc71' : '#0a3a1a'; c.fillRect(sx + 6, 180 + j * 18, 4, 4); c.fillStyle = '#1b2230'; c.fillRect(sx + 14, 178 + j * 18, 22, 8); } } break;
    case 'speaker': { c.fillStyle = '#1a1a1a'; rr(c, x - 22, 120, 44, 54, 6); c.fill(); c.fillStyle = '#333333'; for (let j = 0; j < 4; j++) c.fillRect(x - 16, 130 + j * 10, 32, 4);
      c.fillStyle = '#5a606a'; c.fillRect(x - 3, 100, 6, 20);
      if (st.speakT > 0){ c.strokeStyle = 'rgba(255,255,255,' + Math.min(.7, st.speakT) + ')'; c.lineWidth = 3; for (let k = 0; k < 3; k++){ const r = 30 + ((t * 60 + k * 20) % 60); c.beginPath(); c.arc(x, 147, r, -.6, .6); c.stroke(); c.beginPath(); c.arc(x, 147, r, Math.PI - .6, Math.PI + .6); c.stroke(); } } } break;
    case 'keypad': { c.fillStyle = '#1a1a1a'; rr(c, x - 24, 240, 48, 76, 6); c.fill(); c.strokeStyle = '#555555'; c.lineWidth = 2; c.stroke();
      const kp = st.keypad || 'idle'; c.fillStyle = kp === 'err' ? '#3a0000' : kp === 'ok' ? '#003a10' : '#0a1a10'; c.fillRect(x - 18, 246, 36, 14);
      txt(c, kp === 'err' ? 'HATA' : kp === 'ok' ? 'AÇIK' : kp === 'type' ? '*'.repeat(1 + Math.floor((t * 6) % 4)) : '----', x, 257, 10, kp === 'err' ? '#ff4040' : '#3cff7a', 'center');
      c.fillStyle = '#777777'; for (let j = 0; j < 12; j++) c.fillRect(x - 15 + (j % 3) * 11, 266 + Math.floor(j / 3) * 11, 8, 8);
      c.fillStyle = kp === 'err' && Math.sin(t * 20) > 0 ? '#ff2020' : '#550000'; c.beginPath(); c.arc(x + 14, 310, 3, 0, 7); c.fill(); } break;
    case 'door': { const dk = st.doorK || 0; c.fillStyle = '#2a2d33'; c.fillRect(x - 10, 130, 240, 340); c.fillStyle = '#0a0a0a'; c.fillRect(x + 4, 144, 212, 326);
      const ph = 326 * (1 - dk); c.fillStyle = '#4b5059'; c.fillRect(x + 4, 144, 212, ph);
      if (ph > 20){ c.fillStyle = '#5d636d'; c.fillRect(x + 108, 144, 4, ph); c.fillStyle = '#ffcc00'; for (let j = 0; j < 6; j++) c.fillRect(x + 4 + j * 36, 144 + ph - 30, 18, 26); } } break;
    case 'beams': c.fillStyle = '#4a3a28'; c.fillRect(x, 0, W, 24); for (let bx = x; bx < x + W; bx += 190) c.fillRect(bx, 0, 16, 470); break;
    case 'medals': c.fillStyle = '#5a4630'; c.fillRect(x - 90, 110, 180, 120); for (let i = 0; i < 3; i++){ c.fillStyle = '#d8cfb8'; c.fillRect(x - 80 + i * 56, 122, 48, 60); drawPortrait(c, x - 56 + i * 56, 148, 10, i === 1 ? 'usta' : 'ufisGenc', 'neutral'); }
      for (let i = 0; i < 4; i++){ c.fillStyle = '#c9a227'; c.beginPath(); c.arc(x - 66 + i * 44, 210, 8, 0, 7); c.fill(); c.fillStyle = '#8a1c1c'; c.fillRect(x - 69 + i * 44, 192, 6, 10); } break;
    case 'cracks': c.strokeStyle = 'rgba(40,30,20,.6)'; c.lineWidth = 2; for (const [cx2, cy2] of [[120, 80], [470, 60], [800, 120]]){ c.beginPath(); c.moveTo(x + cx2, cy2); c.lineTo(x + cx2 + 20, cy2 + 30); c.lineTo(x + cx2 + 5, cy2 + 55); c.lineTo(x + cx2 + 30, cy2 + 90); c.stroke(); } break;
    case 'trophies': c.fillStyle = '#6b4a2b'; c.fillRect(x - 80, 230, 170, 10); c.fillRect(x - 80, 150, 170, 10);
      for (let i = 0; i < 4; i++){ const tx = x - 60 + i * 42; c.fillStyle = '#e0b030'; c.beginPath(); c.moveTo(tx - 12, 200); c.lineTo(tx + 12, 200); c.lineTo(tx + 5, 222); c.lineTo(tx - 5, 222); c.fill(); c.fillRect(tx - 2, 222, 4, 6); c.fillRect(tx - 8, 226, 16, 4); } break;
    case 'bluelights': for (let lx = x + 80; lx < x + W; lx += 220){ c.fillStyle = '#9ad7ff'; c.fillRect(lx - 24, 22, 48, 6); lightCone(c, lx, 28, 44, 240, 470, '110,180,255', .26); } break;
    case 'redlights': for (let lx = x + 120; lx < x + W; lx += 300){ const on = Math.sin(t * 4 + lx) > 0; c.fillStyle = on ? '#ff3030' : '#661010'; c.beginPath(); c.arc(lx, 30, 9, 0, 7); c.fill(); lightCone(c, lx, 36, 18, 220, 470, '255,50,50', on ? .3 : .08); } break;
    case 'bars': c.fillStyle = '#15130f'; c.fillRect(x - 10, 150, 260, 320); c.strokeStyle = '#6b6f75'; c.lineWidth = 6; for (let bx = x; bx < x + 250; bx += 26){ c.beginPath(); c.moveTo(bx, 150); c.lineTo(bx, 470); c.stroke(); } c.fillStyle = '#6b6f75'; c.fillRect(x - 10, 150, 260, 8); break;
    case 'hoops': c.fillStyle = '#e8e8e8'; c.fillRect(x - 50, 120, 100, 70); c.strokeStyle = '#d35400'; c.lineWidth = 4; c.strokeRect(x - 20, 150, 40, 30); c.beginPath(); c.ellipse(x, 196, 22, 6, 0, 0, 7); c.stroke(); c.fillStyle = '#555555'; c.fillRect(x - 4, 190, 8, 280); break;
    case 'courtlines': c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 3; c.beginPath(); c.ellipse(x + 480, 440, 160, 30, 0, 0, 7); c.stroke(); break;
    case 'lockers': for (let lx = x + 10; lx < x + W; lx += 74){ c.fillStyle = '#1b2f4f'; c.fillRect(lx, 100, 70, 300); c.strokeStyle = '#0f1d33'; c.lineWidth = 3; c.strokeRect(lx, 100, 70, 300);
        c.fillStyle = '#0f1d33'; for (let j = 0; j < 4; j++) c.fillRect(lx + 15, 120 + j * 6, 40, 2); c.fillStyle = '#f2c230'; c.fillRect(lx + 30, 70, 10, 30); }
      c.fillStyle = '#5b3a20'; c.fillRect(x, 400, W, 16); break;
    case 'banner': c.fillStyle = '#14306b'; c.fillRect(x - 200, 30, 400, 46); c.fillStyle = '#f2c230'; c.fillRect(x - 200, 70, 400, 6); txt(c, 'ANOLECRAB', x, 63, 28, '#f2c230', 'center'); break;
    case 'car': c.fillStyle = '#0a0a0c'; rr(c, x - 130, 400, 260, 50, 14); c.fill(); rr(c, x - 80, 365, 150, 45, 12); c.fill(); c.fillStyle = '#1b2a3a'; c.fillRect(x - 70, 372, 60, 30); c.fillRect(x, 372, 60, 30);
      c.fillStyle = '#222222'; c.beginPath(); c.arc(x - 80, 452, 20, 0, 7); c.arc(x + 80, 452, 20, 0, 7); c.fill(); c.fillStyle = '#fff3b0'; c.fillRect(x + 118, 412, 12, 8); break;
  }
}
function bgInterior(c, camX, th, st, t){
  if (th.outdoor){ const g = c.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, '#04071a'); g.addColorStop(1, '#1a1d3a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#f5f0d0'; c.beginPath(); c.arc(860, 60, 24, 0, 7); c.fill(); }
  else { const g = c.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, shade(th.wall, .75)); g.addColorStop(1, th.wall); c.fillStyle = g; c.fillRect(0, 0, W, 400); c.fillStyle = shade(th.wall, .7); c.fillRect(0, 384, W, 16); }
  const fg = c.createLinearGradient(0, 400, 0, H); fg.addColorStop(0, th.floor); fg.addColorStop(1, shade(th.floor, .7)); c.fillStyle = fg; c.fillRect(0, 400, W, H - 400);
  c.strokeStyle = shade(th.floor, .82); c.lineWidth = 2; const off = camX % 90; for (let x = -off; x < W + 60; x += 90){ c.beginPath(); c.moveTo(x, 400); c.lineTo(x - 40, H); c.stroke(); }
  const k0 = Math.floor(camX / W) - 1;
  for (let k = k0; k <= k0 + 2; k++){
    const ox = k * W - camX; if (ox > W || ox < -W * 1.2) continue;
    for (const p of th.props){ if (p[0] === 'bigscreen' && k !== 0) continue; drawProp(c, p[0], ox + p[1], st, t); }
  }
  if (th.dim){ c.fillStyle = 'rgba(0,0,0,' + th.dim + ')'; c.fillRect(0, 0, W, H); }
}
function bgSaha(c){
  let g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#5fb2ea'); g.addColorStop(1, '#d4ecf8');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#4f8c3c'; for (let i = 0; i < 13; i++){ c.beginPath(); c.arc(i * 80 + 20, 245 + (i % 3) * 8, 52, 0, 7); c.fill(); }
  c.fillStyle = '#a9b1b8'; c.fillRect(0, 262, W, 46);
  c.fillStyle = '#14306b'; c.fillRect(280, 268, 400, 34); txt(c, 'ANOLECRAB ANTRENMAN TESİSİ', 480, 292, 20, '#f2c230', 'center', 'bold', 0, 380);
  for (let i = 0; i < 6; i++){ c.fillStyle = i % 2 ? '#3f9a3f' : '#47a847'; c.fillRect(0, 308 + i * 39, W, 39); }
  c.fillStyle = '#ffffff'; c.fillRect(0, 316, W, 3);
}
function bgDojo(c, st, ruined){
  c.fillStyle = ruined ? '#9d8f73' : '#eadcbf'; c.fillRect(0, 0, W, 340);
  c.fillStyle = '#6b4226'; c.fillRect(0, 0, W, 26); for (let x = 0; x < W; x += 160) c.fillRect(x, 0, 14, 340);
  for (let x = 250; x < W - 80; x += 160){ c.fillStyle = ruined ? '#bfb39a' : '#fff8e8'; c.fillRect(x + 25, 70, 100, 150); c.strokeStyle = '#7a5235'; c.lineWidth = 3;
    c.strokeRect(x + 25, 70, 100, 150); c.beginPath(); c.moveTo(x + 75, 70); c.lineTo(x + 75, 220); c.moveTo(x + 25, 145); c.lineTo(x + 125, 145); c.stroke(); }
  for (const lx of [330, 650]){ c.strokeStyle = '#333333'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, 26); c.lineTo(lx, 50); c.stroke();
    c.fillStyle = ruined ? '#6b2b22' : '#c0392b'; c.beginPath(); c.ellipse(lx, 72, 18, 24, 0, 0, 7); c.fill(); c.fillStyle = '#f39c12'; c.fillRect(lx - 10, 46, 20, 5); c.fillRect(lx - 10, 93, 20, 5);
    lightCone(c, lx, 96, 22, 200, 470, '255,190,120', .16); }
  // kapı (açılıp kapanır)
  const dk = st.doorK || 0;
  c.fillStyle = '#5a3820'; c.fillRect(70, 130, 140, 340); c.fillStyle = '#0d0d10'; c.fillRect(82, 142, 116, 328);
  if (dk > 0){ const g = c.createLinearGradient(82, 0, 198, 0); g.addColorStop(0, 'rgba(120,140,180,.25)'); g.addColorStop(1, 'rgba(120,140,180,0)'); c.fillStyle = g; c.fillRect(82, 142, 116, 328); }
  const pw = 116 * (1 - dk * .82); c.fillStyle = '#8b5a33'; c.fillRect(82, 142, pw, 328);
  if (pw > 40){ c.strokeStyle = '#5a3820'; c.lineWidth = 3; c.strokeRect(92, 160, pw - 20, 120); c.strokeRect(92, 300, pw - 20, 150); c.fillStyle = '#d4a017'; c.beginPath(); c.arc(82 + pw - 12, 310, 4, 0, 7); c.fill(); }
  c.fillStyle = '#a8743f'; c.fillRect(0, 340, W, H - 340);
  c.strokeStyle = '#8d5f31'; c.lineWidth = 2; for (let y = 360; y < H; y += 26){ c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = 'rgba(180,40,40,.25)'; c.fillRect(260, 380, 640, 130);
  if (ruined){ c.fillStyle = 'rgba(40,30,20,.35)'; c.fillRect(0, 0, W, H); }
}
function bgStad(c, t, st){
  st = st || {};
  let g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#060a20'); g.addColorStop(1, '#1d2752');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const ox = st.camX ? -(st.camX * .15) % 18.5 : 0;
  c.fillStyle = '#262b40'; c.fillRect(0, 116, W, 186); c.fillStyle = '#1a1e30'; c.fillRect(0, 116, W, 6);
  for (const p of CROWD){ const b = st.crowdOn !== false ? Math.sin(t * (st.cheer ? 16 : 9) + p.ph) * (st.cheer ? 3 : 1.4) : 0; c.fillStyle = p.c; c.fillRect(p.x + ox, p.y + b, 6, 7); }
  c.fillStyle = '#14306b'; c.fillRect(0, 282, W, 16); for (let x = (-(st.camX || 0) * .9) % 240; x < W; x += 240){ txt(c, 'ANOLECRAB', x + 20, 295, 12, '#f2c230'); txt(c, 'ARAÇ', x + 150, 295, 12, '#ffffff'); }
  for (const fx of [70, 890]){ c.fillStyle = '#555c70'; c.fillRect(fx - 4, 20, 8, 110);
    const gl = c.createRadialGradient(fx, 30, 5, fx, 30, 90); gl.addColorStop(0, 'rgba(255,255,230,.9)'); gl.addColorStop(1, 'rgba(255,255,230,0)');
    c.fillStyle = gl; c.fillRect(fx - 90, -60, 180, 180); c.fillStyle = '#fffbe0'; c.fillRect(fx - 26, 18, 52, 22); }
  if (st.bigscreen){ c.fillStyle = '#0a0a0a'; c.fillRect(320, 6, 320, 140); bigScreenContent(c, 326, 12, 308, 128, st.bigscreen, t, st.bigscreen === 'off' && st.offT != null ? st.offT / .45 : null); }
  else if (!st.noBoard){ c.fillStyle = '#0c0f1c'; rr(c, 330, 18, 300, 56, 8); c.fill(); c.strokeStyle = '#f2c230'; c.lineWidth = 2; c.stroke();
    txt(c, (st.teams ? st.teams[0] : 'ANL') + ' ' + (st.score || '0 - 0') + ' ' + (st.teams ? st.teams[1] : 'RKP'), 480, 46, 22, '#ffd34d', 'center', 'bold', 0, 280);
    txt(c, st.minute || "0'", 480, 66, 15, '#ffffff', 'center'); }
  const pg = c.createLinearGradient(0, 300, 0, H); pg.addColorStop(0, '#2f8a3a'); pg.addColorStop(1, '#1f6a2a'); c.fillStyle = pg; c.fillRect(0, 298, W, H - 298);
  for (let i = 0; i < 6; i++){ if (i % 2){ c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, 302 + i * 40, W, 40); } }
  c.fillStyle = '#ffffff'; c.fillRect(0, 298, W, 5);
  if (st.camX != null){ c.fillStyle = 'rgba(0,0,0,.06)'; const o2 = st.camX % 240; for (let x = -o2; x < W; x += 240) c.fillRect(x, 302, 120, H - 302); }
  else { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.beginPath(); c.ellipse(480, 410, 150, 48, 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(480, 302); c.lineTo(480, H); c.stroke(); }
  for (const fx of [70, 890]){ c.fillStyle = 'rgba(255,255,220,.05)'; c.beginPath(); c.moveTo(fx - 20, 40); c.lineTo(fx + 20, 40); c.lineTo(fx < 480 ? 520 : 760, H); c.lineTo(fx < 480 ? 200 : 440, H); c.fill(); }
}
function bgTunel(c, camX, worldW, alt){
  c.fillStyle = '#17191d'; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 70, 0, 400); g.addColorStop(0, alt ? '#34312d' : '#30343c'); g.addColorStop(1, alt ? '#45413c' : '#424752'); c.fillStyle = g; c.fillRect(0, 70, W, 330);
  c.fillStyle = '#2a2d33'; for (let x = -(camX % 120); x < W; x += 120) c.fillRect(x, 70, 4, 330);
  c.fillStyle = '#4a4f59'; c.fillRect(0, 96, W, 10); c.fillRect(0, 118, W, 6);
  for (let wx = 520; wx < worldW - 300; wx += 640){ const x = wx - camX; if (x < -200 || x > W + 200) continue;
    if (alt){ c.fillStyle = '#5a2020'; c.fillRect(x - 100, 170, 200, 80); txt(c, 'SADECE PERSONEL', x, 216, 18, '#ffffff', 'center', 'bold', 0, 180); continue; }
    c.fillStyle = '#14306b'; c.fillRect(x - 100, 165, 200, 120); c.strokeStyle = '#f2c230'; c.lineWidth = 3; c.strokeRect(x - 100, 165, 200, 120);
    c.fillStyle = '#f2c230'; c.fillRect(x - 100, 220, 200, 10);
    txt(c, 'ANOLECRAB', x, 205, 24, '#f2c230', 'center', 'bold', 0, 180);
    txt(c, 'ŞAMPİYONLAR', x, 254, 15, '#ffffff', 'center', 'bold', 0, 180); txt(c, 'BURADAN GEÇER', x, 274, 15, '#ffffff', 'center', 'bold', 0, 180); }
  for (let wx = 200; wx < worldW; wx += 320){ const x = wx - camX; if (x < -150 || x > W + 150) continue;
    c.fillStyle = '#ffe9a8'; c.fillRect(x - 30, 66, 60, 8); lightCone(c, x, 74, 60, 300, 400, '255,230,160', .3); }
  const ex = worldW - 70 - camX;
  if (ex < W + 200){ const gl = c.createLinearGradient(ex - 120, 0, ex + 60, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,.95)');
    c.fillStyle = gl; c.fillRect(ex - 120, 70, 300, 400); c.fillStyle = '#2ecc71'; c.fillRect(ex - 76, 120, 100, 30); txt(c, 'ÇIKIŞ', ex - 26, 142, 18, '#ffffff', 'center'); }
  const fg = c.createLinearGradient(0, 400, 0, H); fg.addColorStop(0, '#4b4e55'); fg.addColorStop(1, '#33363c'); c.fillStyle = fg; c.fillRect(0, 400, W, H - 400);
  c.strokeStyle = '#3d4046'; c.lineWidth = 2; for (let x = -(camX % 90); x < W; x += 90){ c.beginPath(); c.moveTo(x, 400); c.lineTo(x - 40, H); c.stroke(); }
}
function bgSehir(c, t, car){
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05081a'); g.addColorStop(1, '#2a1f4a');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f5f0d0'; c.beginPath(); c.arc(820, 80, 34, 0, 7); c.fill();
  for (const b of BUILD){ c.fillStyle = '#10142a'; c.fillRect(b.x, 400 - b.h, b.w, b.h);
    c.fillStyle = 'rgba(255,214,102,.75)'; for (let y = 420 - b.h; y < 390; y += 22) for (let x = b.x + 8; x < b.x + b.w - 8; x += 16)
      if (((x * 7 + y * 3) | 0) % 5 === 0) c.fillRect(x, y, 6, 9); }
  c.fillStyle = '#1b1d29'; c.fillRect(0, 400, W, H - 400);
  c.fillStyle = '#f2c230'; for (let x = 0; x < W; x += 80) c.fillRect(x, 500, 40, 5);
  drawProp(c, 'streetlamp', 640, {}, t);
  if (car) drawProp(c, 'car', car, {}, t);
}
/* --- giriş sahneleri: antrenman tesisi ve stadyum dışı --- */
function bgTesisDis(c, t){
  let g = c.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, '#4fa6e6'); g.addColorStop(1, '#cfe9f7'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y, s] of [[150, 70, 1], [600, 50, 1.3], [840, 95, .9]]){ const xx = (x + t * 8 * s) % (W + 200) - 100; c.beginPath(); c.ellipse(xx, y, 60 * s, 18 * s, 0, 0, 7); c.ellipse(xx + 40 * s, y - 10, 40 * s, 16 * s, 0, 0, 7); c.fill(); }
  c.fillStyle = '#4f8c3c'; for (let i = 0; i < 14; i++){ c.beginPath(); c.arc(i * 75, 250 + (i % 3) * 6, 48, 0, 7); c.fill(); }
  c.fillStyle = '#d9dee4'; c.fillRect(280, 150, 400, 160); c.fillStyle = '#b8c0c8'; c.fillRect(280, 150, 400, 14);
  c.fillStyle = '#7fb6e0'; for (let i = 0; i < 6; i++) c.fillRect(300 + i * 64, 190, 44, 40);
  c.fillStyle = '#14306b'; c.fillRect(300, 112, 360, 44); c.strokeStyle = '#f2c230'; c.lineWidth = 3; c.strokeRect(300, 112, 360, 44);
  txt(c, 'ANOLECRAB ANTRENMAN TESİSİ', 480, 142, 20, '#f2c230', 'center', 'bold', 0, 340);
  for (const fx of [240, 720]){ c.fillStyle = '#888888'; c.fillRect(fx, 120, 4, 190); c.fillStyle = fx < 480 ? '#14306b' : '#f2c230'; c.beginPath(); c.moveTo(fx + 4, 122); c.lineTo(fx + 4 + 44 + Math.sin(t * 4) * 4, 132); c.lineTo(fx + 4, 146); c.fill(); }
  c.fillStyle = '#7a8088'; c.fillRect(0, 300, W, 12);
  for (let i = 0; i < 5; i++){ c.fillStyle = i % 2 ? '#3f9a3f' : '#47a847'; c.fillRect(0, 312 + i * 46, W, 46); }
  c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(120, 340, 720, 170); c.beginPath(); c.moveTo(480, 340); c.lineTo(480, 510); c.stroke(); c.beginPath(); c.arc(480, 425, 45, 0, 7); c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.strokeRect(120, 395, 40, 60); c.strokeRect(800, 395, 40, 60);
}
function bgStadDis(c, t){
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#03061a'); g.addColorStop(1, '#1a1440'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++){ c.fillStyle = 'rgba(255,255,255,' + (.3 + .3 * Math.sin(t * 2 + i)) + ')'; c.fillRect((i * 97) % W, (i * 41) % 160, 2, 2); }
  const glow = c.createRadialGradient(480, 260, 50, 480, 260, 420); glow.addColorStop(0, 'rgba(255,240,200,.35)'); glow.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = glow; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1c2340'; c.beginPath(); c.ellipse(480, 330, 420, 150, 0, Math.PI, 0); c.fill(); c.fillRect(60, 330, 840, 110);
  c.fillStyle = '#2a3460'; for (let i = 0; i < 16; i++){ c.fillRect(80 + i * 52, 300 - Math.sin(i / 15 * Math.PI) * 90, 26, 140 + Math.sin(i / 15 * Math.PI) * 90); }
  c.fillStyle = '#f2c230'; c.fillRect(60, 330, 840, 6);
  for (const [x, y] of [[110, 120], [850, 120], [300, 70], [660, 70]]){ c.fillStyle = '#555c70'; c.fillRect(x - 3, y, 6, 140); c.fillStyle = '#fffbe0'; c.fillRect(x - 22, y - 10, 44, 16);
    const gl = c.createRadialGradient(x, y, 4, x, y, 80); gl.addColorStop(0, 'rgba(255,255,230,.8)'); gl.addColorStop(1, 'rgba(255,255,230,0)'); c.fillStyle = gl; c.fillRect(x - 80, y - 80, 160, 160);
    lightCone(c, x, y + 6, 30, 220, 330, '255,250,220', .12); }
  c.fillStyle = '#14306b'; c.fillRect(330, 360, 300, 50); txt(c, 'UON PMAC STADI', 480, 394, 26, '#f2c230', 'center', 'bold', 0, 280);
  c.fillStyle = '#0d0f18'; c.fillRect(0, 440, W, 100);
  for (let i = 0; i < 70; i++){ const x = (i * 37 + Math.sin(t + i) * 4) % W, y = 455 + (i % 4) * 18; c.fillStyle = i % 3 ? '#14306b' : '#f2c230'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.fillRect(x - 6, y + 4, 12, 16); }
}
function bgTunelCikis(c, t){
  c.fillStyle = '#0c0d10'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1a1c22'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(640, 140); c.lineTo(320, 140); c.fill(); c.beginPath(); c.moveTo(0, H); c.lineTo(W, H); c.lineTo(640, 400); c.lineTo(320, 400); c.fill();
  const g = c.createRadialGradient(480, 270, 30, 480, 270, 260); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(.5, 'rgba(255,255,220,.6)'); g.addColorStop(1, 'rgba(255,255,220,0)');
  c.fillStyle = '#9bd18a'; c.fillRect(320, 140, 320, 260); c.fillStyle = '#2f8a3a'; c.fillRect(320, 300, 320, 100);
  for (let i = 0; i < 80; i++){ c.fillStyle = ['#ffffff', '#f2c230', '#14306b', '#c43c3c'][i % 4]; c.fillRect(324 + (i * 13) % 312, 160 + Math.floor(i / 24) * 14 + Math.sin(t * 12 + i) * 2, 4, 5); }
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function drawBg(c, key, st, t){
  const camX = st.camX || 0;
  if (key === 'saha') bgSaha(c);
  else if (key === 'dojo') bgDojo(c, st, false);
  else if (key === 'eskiDojo') bgDojo(c, st, true);
  else if (key === 'stad') bgStad(c, t, st);
  else if (key === 'sehir') bgSehir(c, t, st.car);
  else if (key === 'tunel') bgTunel(c, camX, st.worldW || W, false);
  else if (key === 'stadArka') bgTunel(c, camX, st.worldW || W, true);
  else if (key === 'tesisDis') bgTesisDis(c, t);
  else if (key === 'stadDis') bgStadDis(c, t);
  else if (key === 'tunelCikis') bgTunelCikis(c, t);
  else if (THEMES[key]) bgInterior(c, camX, THEMES[key], st, t);
  if (st.sepia){ c.globalCompositeOperation = 'color'; c.fillStyle = '#9a7040'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(60,40,20,.18)'; c.fillRect(0, 0, W, H); }
  if (st.alarm){ c.fillStyle = 'rgba(255,0,0,' + (.08 + .08 * Math.sin(t * 8)) + ')'; c.fillRect(0, 0, W, H); }
}
function vignette(c, a = .45){ const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .65); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + a + ')'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
function drawBall(c, x, y, spin, s = 1, fire){
  c.save(); c.translate(x, y); c.scale(s, s);
  if (fire){ for (let i = 0; i < 6; i++){ c.fillStyle = 'rgba(255,' + (120 + i * 20) + ',0,' + (.5 - i * .07) + ')'; c.beginPath(); c.arc(-fire * (8 + i * 9), Math.sin(gameTime * 30 + i) * 3, 12 - i, 0, 7); c.fill(); } }
  c.rotate(spin);
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
  c.fillStyle = '#222222'; c.beginPath(); c.arc(0, 0, 3.5, 0, 7); c.fill();
  for (let i = 0; i < 5; i++){ const a = i * 1.2566; c.beginPath(); c.arc(Math.cos(a) * 8, Math.sin(a) * 8, 2, 0, 7); c.fill(); }
  c.restore();
}
function drawStar(c, x, y, r){ c.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr2 = i % 2 ? r * .45 : r;
  c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); }
function burst(c, x, y, r, col, a = 1){ c.globalAlpha = a; c.fillStyle = col; c.beginPath(); for (let i = 0; i < 16; i++){ const ang = i * Math.PI / 8, rr2 = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(ang) * rr2, y + Math.sin(ang) * rr2); } c.closePath(); c.fill(); c.globalAlpha = 1; }
function tapHint(c, x, y, show, label = 'dokun ▶'){ if (!show) return; c.globalAlpha = .55 + Math.sin(gameTime * 6) * .4; txt(c, label, x, y, 18, '#f2c230', 'center'); c.globalAlpha = 1; }
function button(c, b, label, primary, t = 0){
  const pulse = primary ? 1 + Math.sin(t * 4) * .025 : 1;
  c.save(); c.translate(b.x + b.w / 2, b.y + b.h / 2); c.scale(pulse, pulse);
  c.fillStyle = primary ? '#f2c230' : 'rgba(10,16,40,.78)'; rr(c, -b.w / 2, -b.h / 2, b.w, b.h, 12); c.fill();
  c.strokeStyle = primary ? '#fff3b0' : 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke();
  txt(c, label, 0, (b.size || 22) * .36, b.size || 22, primary ? '#14306b' : '#ffffff', 'center', 'bold', 0, b.w - 22); c.restore();
}

/* ---------- ara sahne nesneleri (büyük görünüm) ---------- */
function drawItem(c, ln, k){
  c.save(); c.globalAlpha = k; c.translate(480, 200); c.scale(.8 + .2 * k, .8 + .2 * k); c.rotate(-.04);
  const it = ln.item;
  if (it === 'paper'){ c.fillStyle = '#f3ecd8'; c.fillRect(-120, -120, 240, 200); c.strokeStyle = '#8a1c1c'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, -50, 34, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-26, -28); c.lineTo(26, -72); c.moveTo(-26, -72); c.lineTo(26, -28); c.stroke(); c.fillStyle = '#8a1c1c'; c.beginPath(); c.arc(0, -50, 10, 0, 7); c.fill();
    txt(c, 'ADRES:', -100, 20, 18, '#3a2a1a'); txt(c, 'Eski Sanayi, Fabrika No: 7', -100, 50, 16, '#3a2a1a', 'left', 'italic bold', 0, 200); }
  else if (it === 'file' || it === 'narak'){ c.fillStyle = '#c9a65a'; rr(c, -170, -130, 340, 230, 8); c.fill(); c.fillStyle = '#e8d9b0'; c.fillRect(-150, -112, 300, 200);
    c.save(); c.rotate(-.2); c.strokeStyle = '#b3122e'; c.lineWidth = 4; c.strokeRect(20, -100, 120, 40); txt(c, 'GİZLİ', 80, -70, 26, '#b3122e', 'center', '900'); c.restore();
    if (it === 'narak'){ c.fillStyle = '#2a2a2a'; c.fillRect(-135, -95, 100, 120); drawPortrait(c, -85, -40, 30, 'narak', 'angry'); txt(c, 'ADI: NARAK', -20, 0, 24, '#1a1a1a', 'left', '900'); txt(c, 'Örgütün en güçlü dövüşçüsü', -20, 30, 14, '#3a2a1a', 'left', 'bold', 0, 160); }
    else { for (let i = 0; i < 4; i++){ c.fillStyle = '#ffffff'; c.fillRect(-135 + i * 70, -40, 56, 64); drawPortrait(c, -107 + i * 70, -14, 14, i % 2 ? 'mate2' : 'mate', 'neutral'); }
      c.fillStyle = '#5a4a3a'; for (let i = 0; i < 3; i++) c.fillRect(-135, 40 + i * 14, 240 - i * 40, 5); } }
  else if (it === 'card'){ c.fillStyle = '#0d0d0d'; rr(c, -180, -80, 360, 160, 12); c.fill(); c.strokeStyle = '#c9a227'; c.lineWidth = 3; c.stroke();
    c.font = fnt(24, 'italic bold'); wrap(c, ln.t || '', 320).forEach((l, i) => txt(c, l, 0, -10 + i * 30, 24, '#e8c547', 'center', 'italic bold')); txt(c, '📍', 0, 52, 22, '#ff4040', 'center'); }
  else if (it === 'invite'){ c.fillStyle = '#ffffff'; rr(c, -220, -130, 440, 240, 10); c.fill(); c.fillStyle = '#14306b'; c.fillRect(-220, -130, 440, 40);
    txt(c, '✉  Yeni e-posta', -200, -103, 18, '#ffffff'); txt(c, 'DÜNYA ŞAMPİYONLAR TURNUVASI', 0, -40, 22, '#14306b', 'center', '900', 0, 400); txt(c, 'Resmî Davetiye', 0, -10, 18, '#555555', 'center');
    txt(c, 'Başlangıç: 3 gün sonra', 0, 30, 18, '#b3122e', 'center'); c.fillStyle = '#f2c230'; rr(c, -70, 55, 140, 36, 8); c.fill(); txt(c, 'KATIL', 0, 80, 18, '#14306b', 'center'); }
  else if (it === 'photoUsta'){ c.fillStyle = '#f5f0e0'; c.fillRect(-110, -140, 220, 250); c.fillStyle = '#2a2116'; c.fillRect(-95, -125, 190, 170); drawPortrait(c, 0, -50, 52, 'usta', 'sad');
    c.font = fnt(15, 'italic bold'); wrap(c, ln.t || '', 196).forEach((l, i) => txt(c, l, 0, 70 + i * 20, 15, '#5a1a1a', 'center', 'italic bold')); }
  c.restore();
}
function drawRoster(c, t){
  const R = [['issem', 'Issem', 'Futbol takımının lideri'], ['ufis', 'Ufis', 'Dövüş ve savunma uzmanı'], ['leo', 'Leo', 'Organizasyon ve strateji']];
  R.forEach(([k, n, d], i) => { const a = clamp((t - i * .25) * 3, 0, 1); if (a <= 0) return; c.globalAlpha = a;
    const x = 120 + i * 250, y = 60; c.fillStyle = 'rgba(10,20,50,.92)'; rr(c, x, y, 220, 300, 16); c.fill(); c.strokeStyle = SPEAKERS[n].col; c.lineWidth = 3; c.stroke();
    c.save(); c.beginPath(); c.rect(x + 10, y + 10, 200, 190); c.clip(); c.fillStyle = '#1b2a48'; c.fillRect(x + 10, y + 10, 200, 190); drawPortrait(c, x + 110, y + 100, 56, k, 'happy'); c.restore();
    txt(c, n.toUpperCase(), x + 110, y + 236, 28, SPEAKERS[n].col, 'center', 'italic 900'); txt(c, d, x + 110, y + 270, 15, '#ffffff', 'center', 'normal', 0, 200); c.globalAlpha = 1; });
}
