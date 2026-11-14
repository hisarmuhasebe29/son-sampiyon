'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   core.js  (çizim, ses, giriş)
   ========================================================= */
const VERSION = 'v.03';
const W = 960, H = 540, GROUND = 470;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let scale = 1, dpr = 1, paused = false;

function resize(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sw = innerWidth, sh = innerHeight;
  scale = Math.min(sw / W, sh / H);
  cv.style.width = (W * scale) + 'px'; cv.style.height = (H * scale) + 'px';
  cv.width = Math.round(W * scale * dpr); cv.height = Math.round(H * scale * dpr);
  paused = sh > sw * 1.05;
  document.getElementById('rotate').style.display = paused ? 'flex' : 'none';
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

/* ---------- yardımcılar ---------- */
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
function rr(c, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function shade(hex, f){ if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  return 'rgb(' + Math.min(255, Math.round(((n >> 16) & 255) * f)) + ',' + Math.min(255, Math.round(((n >> 8) & 255) * f)) + ',' + Math.min(255, Math.round((n & 255) * f)) + ')'; }
function wrap(c, text, maxW){ const words = String(text).split(' '), lines = []; let cur = '';
  for (const w of words){ const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > maxW && cur){ lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines; }
const SAVE_KEY = 'sonSampiyon_v2';
function loadSave(){ try { return Object.assign({ maxCh:1, stars:{}, cur:null, diff:1 }, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch(e){ return { maxCh:1, stars:{}, cur:null, diff:1 }; } }
let SAVE = loadSave();
function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch(e){} }
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
function txt(c, s, x, y, size, col, align = 'left', weight = 'bold', stroke){
  c.font = weight + ' ' + size + 'px ' + FONT; c.textAlign = align;
  if (stroke){ c.lineWidth = stroke; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y); c.textAlign = 'left';
}

/* ---------- zorluk ---------- */
const DIFFS = [
  { name:'Kolay',  dmg:.6,  hp:.8,  aggr:.8,  maxAtk:1, zone:1.35, ph:1.25 },
  { name:'Normal', dmg:1,   hp:1,   aggr:1,   maxAtk:2, zone:1,    ph:1 },
  { name:'Zor',    dmg:1.45,hp:1.3, aggr:1.3, maxAtk:3, zone:.72,  ph:.85 },
];
const DIFF = () => DIFFS[SAVE.diff] || DIFFS[1];

/* ---------- ses & titreşim ---------- */
let AC = null, MASTER = null;
function audioInit(){
  if (!AC){ try { AC = new (window.AudioContext || window.webkitAudioContext)(); MASTER = AC.createGain(); MASTER.gain.value = .9; MASTER.connect(AC.destination); } catch(e){} }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f, d, type = 'square', vol = .15, slide = 0, delay = 0){
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + d + .05);
}
function noise(d, vol = .25, delay = 0, hp = 0){
  if (!AC) return; const t = AC.currentTime + delay, n = Math.floor(AC.sampleRate * d);
  const b = AC.createBuffer(1, n, AC.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(); s.buffer = b; const g = AC.createGain(); g.gain.value = vol;
  if (hp){ const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; s.connect(f); f.connect(g); } else s.connect(g);
  g.connect(MASTER); s.start(t);
}
function swoosh(d = .6, vol = .3, delay = 0){
  if (!AC) return; const t = AC.currentTime + delay, n = Math.floor(AC.sampleRate * d);
  const b = AC.createBuffer(1, n, AC.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < n; i++){ const k = i / n; a[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * k); }
  const s = AC.createBufferSource(); s.buffer = b; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(5000, t + d);
  const g = AC.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(MASTER); s.start(t);
}
const SFX = {
  hit(){ noise(.12, .35); tone(150, .12, 'square', .12, -90); },
  hit2(){ noise(.16, .45); tone(110, .2, 'square', .16, -60); },
  block(){ tone(700, .06, 'square', .08); tone(1000, .06, 'square', .06, 0, .04); },
  shoot(){ noise(.06, .3); tone(230, .16, 'sine', .3, -160); },
  whistle(){ tone(2100, .18, 'sine', .12); tone(2100, .4, 'sine', .12, 0, .26); },
  longWhistle(){ tone(2100, .3, 'sine', .12); tone(2100, .3, 'sine', .12, 0, .38); tone(2100, .9, 'sine', .12, 0, .76); },
  goal(){ [523, 659, 784, 1046].forEach((f, i) => tone(f, .25, 'triangle', .16, 0, i * .1)); noise(2.2, .1, .1, 400); },
  blip(){ tone(900, .025, 'square', .02); },
  ok(){ tone(660, .08, 'triangle', .15); tone(990, .14, 'triangle', .15, 0, .08); },
  ko(){ tone(320, .45, 'sawtooth', .12, -260); },
  msg(){ tone(1320, .08, 'sine', .14); tone(1760, .14, 'sine', .14, 0, .11); },
  ring(){ for (let i = 0; i < 3; i++){ tone(1180, .1, 'sine', .12, 0, i * .25); tone(1480, .1, 'sine', .12, 0, i * .25 + .1); } },
  power(){ tone(220, .7, 'sawtooth', .12, -190); noise(.3, .1); },
  hurt(){ tone(190, .2, 'sawtooth', .16, -110); noise(.1, .25); },
  crowd(){ noise(2.2, .08, 0, 300); noise(1.4, .06, .6, 500); },
  jump(){ tone(380, .1, 'triangle', .08, 220); },
  swap(){ swoosh(.25, .25); tone(500, .12, 'triangle', .1, 400); },
  dash(){ swoosh(.3, .3); },
  slam(){ tone(70, .5, 'sine', .4, -30); noise(.4, .4); },
  alarm(){ for (let i = 0; i < 4; i++){ tone(880, .18, 'square', .07, 0, i * .4); tone(620, .18, 'square', .07, 0, i * .4 + .2); } },
  clap(){ for (let i = 0; i < 6; i++) noise(.05, .3, i * .28, 1200); },
  door(){ tone(90, .4, 'square', .1, -30); noise(.3, .2); },
  pickup(){ tone(880, .08, 'triangle', .12); tone(1320, .12, 'triangle', .12, 0, .07); },
  boss(){ tone(65, 1.4, 'sawtooth', .14); tone(98, 1.4, 'sawtooth', .1); tone(130, 1.4, 'triangle', .08); },
  win(){ [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'triangle', .14, 0, i * .12)); },
  lose(){ [392, 330, 262, 196].forEach((f, i) => tone(f, .35, 'triangle', .14, 0, i * .18)); },
};
function vib(p){ try { navigator.vibrate && navigator.vibrate(p); } catch(e){} }

/* ---------- giriş ---------- */
const keys = { left:0, right:0, jump:0, punch:0, special:0, block:0, swap:0 };
const pressedAt = {};
let gameTime = 0, tap = null;
function press(k, v){ if (v && !keys[k]) pressedAt[k] = gameTime; keys[k] = v ? 1 : 0; }
function took(k){ if (pressedAt[k] != null && gameTime - pressedAt[k] < .22){ pressedAt[k] = null; return true; } return false; }
document.querySelectorAll('.btn').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); audioInit(); press(k, 1); b.classList.add('on'); };
  const off = e => { e.preventDefault(); press(k, 0); b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
cv.addEventListener('pointerdown', e => {
  audioInit(); const r = cv.getBoundingClientRect();
  tap = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
});
addEventListener('contextmenu', e => e.preventDefault());
const KMAP = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'jump', KeyZ:'punch', KeyX:'special', KeyC:'block', KeyS:'swap' };
addEventListener('keydown', e => {
  audioInit();
  if (KMAP[e.code]) { press(KMAP[e.code], 1); e.preventDefault(); }
  if (e.code === 'Enter'){ tap = { x: W / 2, y: H / 2, key: true }; e.preventDefault(); }
  if (e.code === 'Space'){ press('jump', 1); tap = { x: W / 2, y: H / 2, key: true }; e.preventDefault(); }
  if (e.code === 'Escape' || e.code === 'KeyP'){ tap = { x: W - 30, y: 30, pause: true }; }
});
addEventListener('keyup', e => { if (KMAP[e.code]) press(KMAP[e.code], 0); if (e.code === 'Space') press('jump', 0); });

const UI = document.getElementById('ui');
function showControls(cfg){
  UI.style.display = cfg ? 'block' : 'none';
  for (const k in keys) keys[k] = 0;
  document.querySelectorAll('.btn').forEach(b => {
    b.classList.remove('on');
    if (!cfg) return;
    const k = b.dataset.k; const show = cfg.keys.includes(k);
    b.style.display = show ? 'flex' : 'none';
    if (k === 'special') b.textContent = cfg.spec || '⚽';
    if (k === 'block') b.textContent = cfg.block || '🛡️';
  });
}

/* =========================================================
   KARAKTERLER — görünüm
   ========================================================= */
const LOOK = {
  issem:   { skin:'#e8b48a', hair:'#3a2414', hs:'curly', headband:'#f2c230', shirt:'#14306b', stripe:'#f2c230', shorts:'#14306b', socks:'#f2c230', shoes:'#ffffff', eye:'#3b2a1a' },
  mate:    { skin:'#d8a47f', hair:'#222222', hs:'short', shirt:'#14306b', stripe:'#f2c230', shorts:'#14306b', socks:'#f2c230', shoes:'#ffffff' },
  mate2:   { skin:'#8d5a3b', hair:'#111111', hs:'curly', shirt:'#14306b', stripe:'#f2c230', shorts:'#14306b', socks:'#f2c230', shoes:'#ffffff' },
  ufis:    { skin:'#e0b090', hair:'#e2e2e2', hs:'bun', beard:'#e6e6e6', bs:'long', brow:'#e6e6e6', shirt:'#f3efe6', shorts:'#2b2b2b', socks:'#2b2b2b', shoes:'#222222', robe:true, belt:'#1a1a1a', eye:'#2a2a2a' },
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
  rival:   { skin:'#d8a47f', hair:'#3a2a1a', hs:'short', shirt:'#c0392b', stripe:'#ffffff', shorts:'#ffffff', socks:'#c0392b', shoes:'#111111' },
  rival2:  { skin:'#8d5a3b', hair:'#111111', hs:'curly', shirt:'#c0392b', stripe:'#ffffff', shorts:'#ffffff', socks:'#c0392b', shoes:'#111111' },
  keeper:  { skin:'#e0b090', hair:'#4a3020', hs:'short', shirt:'#27ae60', stripe:'#145a32', shorts:'#111111', socks:'#27ae60', shoes:'#111111', gloves:true },
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

/* ---------- yüz (yandan) ---------- */
function exprOf(f){
  if (f.dead) return 'ko';
  if (f.e) return f.e;
  if (f.stun > 0) return 'pain';
  if (f.atk || f.wind > 0 || f.strike > 0 || f.dashing > 0) return 'shout';
  if (f.blocking) return 'angry';
  return f.defE || 'neutral';
}
function sideFace(c, hx, hy, look, ex, talk){
  if (look.shadow){ c.fillStyle = '#ff2a2a'; c.fillRect(hx + 5, hy - 3, 4, 2); return; }
  if (look.hs === 'mask'){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(hx + 7, hy - 2, 3, 2, -.2, 0, 7); c.fill(); return; }
  // göz
  if (ex === 'ko'){ c.strokeStyle = '#111111'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx + 4, hy - 5); c.lineTo(hx + 9, hy); c.moveTo(hx + 9, hy - 5); c.lineTo(hx + 4, hy); c.stroke(); }
  else if (look.glasses){ c.fillStyle = '#0a0a0a'; rr(c, hx + 2, hy - 5.5, 11, 5, 2); c.fill(); }
  else {
    const eh = ex === 'shock' || ex === 'pain' ? 3.2 : ex === 'angry' || ex === 'shout' ? 2 : 2.6;
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(hx + 6.5, hy - 2.5, 3.3, eh, 0, 0, 7); c.fill();
    c.fillStyle = look.eye || '#1a1a1a'; c.beginPath(); c.arc(hx + 7.6, hy - 2.4, 1.7, 0, 7); c.fill();
  }
  // kaş
  c.strokeStyle = look.brow || (look.hs === 'bald' || look.hs === 'hat' || look.hs === 'helmet' || look.hs === 'cap' ? '#2a1a10' : look.hair); c.lineWidth = 2; c.lineCap = 'round';
  c.beginPath();
  if (ex === 'angry' || ex === 'shout'){ c.moveTo(hx + 2.5, hy - 8.5); c.lineTo(hx + 10.5, hy - 5.5); }
  else if (ex === 'shock'){ c.moveTo(hx + 2.5, hy - 9); c.lineTo(hx + 10.5, hy - 10); }
  else if (ex === 'sad' || ex === 'pain'){ c.moveTo(hx + 2.5, hy - 6.5); c.lineTo(hx + 10.5, hy - 9); }
  else { c.moveTo(hx + 2.5, hy - 7.5); c.lineTo(hx + 10.5, hy - 7.5); }
  c.stroke();
  // burun
  c.strokeStyle = shade(look.skin, .75); c.lineWidth = 1.5; c.beginPath(); c.moveTo(hx + 12, hy - 1); c.lineTo(hx + 14, hy + 2.5); c.lineTo(hx + 11.5, hy + 3); c.stroke();
  // sakal
  if (look.beard){ c.fillStyle = look.beard;
    if (look.bs === 'long'){ c.beginPath(); c.moveTo(hx - 4, hy + 4); c.quadraticCurveTo(hx + 4, hy + 30, hx + 12, hy + 6); c.lineTo(hx + 8, hy + 3); c.fill(); }
    else if (look.bs === 'goatee'){ c.beginPath(); c.ellipse(hx + 9, hy + 10, 3.5, 4, 0, 0, 7); c.fill(); }
    else if (look.bs === 'full'){ c.beginPath(); c.arc(hx + 3, hy + 4, 11, .1, Math.PI * .95); c.fill(); }
    else { c.globalAlpha = .45; c.beginPath(); c.arc(hx + 3, hy + 4, 10.5, .15, Math.PI * .9); c.fill(); c.globalAlpha = 1; } }
  // ağız
  const open = talk && Math.sin(gameTime * 22) > 0;
  c.strokeStyle = '#3a1a14'; c.fillStyle = '#5a1a1a'; c.lineWidth = 1.8;
  const mx = hx + 9, my = hy + 6.5;
  if (ex === 'shock' || ex === 'pain' || ex === 'shout' || open){ c.beginPath(); c.ellipse(mx, my, ex === 'shout' ? 3 : 2.2, ex === 'shout' ? 2.6 : 2.8, 0, 0, 7); c.fill(); }
  else if (ex === 'happy'){ c.beginPath(); c.arc(mx - 1, my - 2.5, 3.5, .3, Math.PI - .5); c.stroke(); }
  else if (ex === 'angry' || ex === 'sad'){ c.beginPath(); c.moveTo(mx - 3, my + 1); c.lineTo(mx + 2, my - .5); c.stroke(); }
  else if (ex === 'smirk'){ c.beginPath(); c.moveTo(mx - 3, my); c.quadraticCurveTo(mx, my + 1, mx + 3, my - 2); c.stroke(); }
  else if (ex !== 'ko'){ c.beginPath(); c.moveTo(mx - 2.5, my); c.lineTo(mx + 2, my); c.stroke(); }
  if (look.scar){ c.strokeStyle = '#8a3a3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hx + 3, hy - 10); c.lineTo(hx + 10, hy + 3); c.stroke(); }
}
function sideHair(c, hx, hy, look){
  const hc = look.hair;
  switch (look.hs){
    case 'short': c.fillStyle = hc; c.beginPath(); c.arc(hx - 1, hy - 1, 13.8, Math.PI * .92, Math.PI * 2.0); c.fill(); break;
    case 'curly': c.fillStyle = hc; for (let i = 0; i < 7; i++){ const a = Math.PI * (1.0 + i * .15); c.beginPath(); c.arc(hx - 1 + Math.cos(a) * 11, hy - 2 + Math.sin(a) * 11, 5.5, 0, 7); c.fill(); } break;
    case 'bun': c.fillStyle = hc; c.beginPath(); c.arc(hx - 1, hy - 1, 13.6, Math.PI * .95, Math.PI * 1.95); c.fill(); c.beginPath(); c.arc(hx - 10, hy - 13, 6.5, 0, 7); c.fill(); break;
    case 'spiky': c.fillStyle = hc; c.beginPath(); c.arc(hx - 1, hy - 1, 13.6, Math.PI * .95, Math.PI * 2); c.fill();
      for (let i = 0; i < 5; i++){ const x0 = hx - 13 + i * 6; c.beginPath(); c.moveTo(x0, hy - 8); c.lineTo(x0 - 4, hy - 22 + (i % 2) * 3); c.lineTo(x0 + 5, hy - 10); c.fill(); } break;
    case 'cap': c.fillStyle = look.cap; c.beginPath(); c.arc(hx - 1, hy - 3, 13.8, Math.PI, Math.PI * 2); c.fill(); c.fillRect(hx + 4, hy - 6, 14, 4); break;
    case 'helmet': c.fillStyle = '#3d4a63'; c.beginPath(); c.arc(hx - 1, hy - 1, 15, Math.PI * .9, Math.PI * 2.05); c.fill(); c.fillStyle = 'rgba(160,200,255,.35)'; c.fillRect(hx + 2, hy - 7, 12, 9); break;
    case 'hat': c.fillStyle = '#0d0d0d'; c.fillRect(hx - 18, hy - 12, 36, 4); c.fillRect(hx - 11, hy - 26, 22, 15); c.fillStyle = '#5a0000'; c.fillRect(hx - 11, hy - 15, 22, 3); break;
    case 'mask': c.fillStyle = '#0f0f0f'; c.beginPath(); c.arc(hx, hy, 13.4, 0, 7); c.fill(); break;
    case 'bald': c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(hx - 2, hy - 9, 5, 2.5, -.3, 0, 7); c.fill(); if (look.hair && look.hair !== '#111111' && look.beard){ c.fillStyle = look.hair; c.fillRect(hx - 13, hy - 3, 4, 7); } break;
  }
  if (look.headband){ c.fillStyle = look.headband; c.fillRect(hx - 13, hy - 9, 26, 4); c.beginPath(); c.moveTo(hx - 12, hy - 8); c.lineTo(hx - 21, hy - 3); c.lineTo(hx - 18, hy + 1); c.fill(); }
  if (look.bandana){ c.fillStyle = look.bandana; c.fillRect(hx - 14, hy - 9, 28, 5); c.beginPath(); c.moveTo(hx - 13, hy - 8); c.lineTo(hx - 24, hy - 2); c.lineTo(hx - 20, hy + 2); c.fill(); }
}

/* ---------- pozlar ---------- */
function getPose(f){
  const t = f.animT || 0;
  const P = { lean:3, bob:Math.sin(t * 3) * 1.2, fl:[.12, .02], bl:[-.12, -.2], fa:[.55, 2.5], ba:[.35, 2.3], lie:false };
  if (f.dead || f.pose === 'lie'){ P.lie = true; P.bob = 0; P.fa = [1.9, 2.1]; P.ba = [2.5, 2.6]; P.fl = [.1, 0]; P.bl = [-.1, -.1]; return P; }
  const moving = Math.abs(f.vx || 0) > 10 && (f.onGround !== false);
  if (moving && !f.atk && !(f.stun > 0) && !f.blocking && !(f.wind > 0) && !(f.dashing > 0)){
    const sp = f.run ? 15 : 11, s = Math.sin(t * sp);
    P.fl = [s * .6, s * .6 - .35 - .25 * Math.max(0, -s)];
    P.bl = [-s * .6, -s * .6 - .35 - .25 * Math.max(0, s)];
    P.bob = -Math.abs(Math.cos(t * sp)) * 2.5; P.lean = f.run ? 9 : 6;
    if (f.pose || f.run){ P.fa = [-s * .6, -s * .6 + 1.1]; P.ba = [s * .6, s * .6 + 1.1]; }
    return P;
  }
  if (f.dashing > 0){ P.lean = 14; P.fl = [.9, .4]; P.bl = [-.9, -1.4]; P.fa = [1.5, 1.6]; P.ba = [-.8, -.3]; return P; }
  if (f.slide > 0){ P.lie = false; P.lean = -16; P.fl = [1.5, 1.55]; P.bl = [.7, -.4]; P.fa = [-.9, -.4]; P.ba = [-1.2, -.6]; P.bob = 22; return P; }
  switch (f.pose){
    case 'stand': P.fa = [.12, .08]; P.ba = [-.1, -.1]; P.lean = 0; return P;
    case 'phone': P.fa = [.3, 2.95]; P.ba = [-.1, -.1]; P.lean = 1; return P;
    case 'arms':  P.fa = [.35, 1.85]; P.ba = [.25, 1.8]; P.lean = -1; return P;
    case 'shock': P.fa = [-.5, 2.6]; P.ba = [-.8, 2.4]; P.lean = -5; return P;
    case 'cheer': { const s = Math.sin(t * 8) * .2; P.fa = [2.7 + s, 3.0]; P.ba = [2.6 - s, 2.9]; P.lean = -2; P.bob = -Math.abs(Math.sin(t * 8)) * 6; return P; }
    case 'trophy': P.fa = [2.8, 3.1]; P.ba = [2.6, 3.0]; P.lean = -2; return P;
    case 'point': P.fa = [1.55, 1.6]; P.ba = [.1, .1]; P.lean = 2; return P;
    case 'bow': P.lean = 12; P.fa = [.3, .3]; P.ba = [.2, .2]; return P;
    case 'kneel': P.fl = [1.4, .1]; P.bl = [.3, -1.4]; P.bob = 18; P.lean = 4; P.fa = [.4, .4]; P.ba = [.2, .2]; return P;
    case 'guard': P.fa = [1.1, 2.6]; P.ba = [.7, 2.4]; P.lean = 4; P.fl = [.35, .1]; P.bl = [-.35, -.3]; return P;
    case 'sit': P.fl = [1.5, 0]; P.bl = [1.4, 0]; P.bob = 20; P.lean = -2; P.fa = [.8, 1.6]; P.ba = [.6, 1.5]; return P;
  }
  if (f.stun > 0){ P.lean = -9; P.fa = [-.4, .6]; P.ba = [-.7, .2]; P.bob = 0; return P; }
  if (f.wind > 0){
    if (f.move === 'slam'){ P.fa = [2.9, 3.1]; P.ba = [2.8, 3.0]; P.lean = -6; return P; }
    if (f.move === 'dash'){ P.lean = 10; P.fa = [-.9, 1.1]; P.fl = [.5, .1]; P.bl = [-.6, -.9]; P.bob = 6; return P; }
    if (f.T && f.T.kick){ P.lean = -6; P.fl = [.6, -.6]; return P; }
    P.lean = -5; P.fa = [-.9, 1.1]; P.ba = [.6, 2.4]; return P; }
  if (f.strike > 0){
    if (f.move === 'slam'){ P.fa = [1.2, .9]; P.ba = [1.0, .8]; P.lean = 14; P.bob = 8; return P; }
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
    } else if (m.anim === 'kick'){
      P.fl = [lerp(.12, 1.55, ext), lerp(.02, 1.62, ext)]; P.lean = 3 - 12 * ext; P.fa = [.2, 1.3]; P.ba = [-.3, 1.2];
    } else if (m.anim === 'shoot'){
      const a = k < .35 ? -(k / .35) * .8 : Math.min(1.3, -.8 + ((k - .35) / .3) * 2.1);
      P.fl = [a, a < 0 ? a - .7 : a]; P.lean = -4; P.fa = [.9, 1.2]; P.ba = [-.6, -.3];
    }
    return P;
  }
  if (f.blocking){ P.fa = [1.0, 3.0]; P.ba = [.8, 2.9]; P.lean = -2; return P; }
  if (f.onGround === false){ P.fl = [.7, -.3]; P.bl = [-.1, -1.0]; P.fa = [.9, 2.6]; P.ba = [-.5, .3]; return P; }
  return P;
}

/* ---------- gövde çizimi ---------- */
function drawHuman(c, x, y, look, P, face, s = 1, alpha = 1, tint = null, ex = 'neutral', talk = false){
  const sc = s * (look.scale || 1);
  const col = k => tint || look[k];
  const back = k => tint || shade(look[k], .72);
  c.save(); c.translate(x, y); c.globalAlpha = alpha;
  if (P.lie){ c.translate(0, -9 * sc); c.scale(face * sc, sc); c.rotate(-Math.PI / 2); }
  else c.scale(face * sc, sc);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const hip = [0, -54 + P.bob], sh = [P.lean, -92 + P.bob];
  function leg(a, cc){
    const k = [hip[0] + Math.sin(a[0]) * 27, hip[1] + Math.cos(a[0]) * 27];
    const f = [k[0] + Math.sin(a[1]) * 26, k[1] + Math.cos(a[1]) * 26];
    c.strokeStyle = cc('shorts'); c.lineWidth = look.suit ? 10 : 11; c.beginPath(); c.moveTo(hip[0], hip[1]); c.lineTo(k[0], k[1]); c.stroke();
    c.strokeStyle = look.suit ? cc('shorts') : cc('socks'); c.lineWidth = 9; c.beginPath(); c.moveTo(k[0], k[1]); c.lineTo(f[0], f[1]); c.stroke();
    if (!look.suit && !look.robe && look.shorts !== look.socks && !tint){ c.strokeStyle = cc('skin'); c.lineWidth = 8; c.beginPath(); c.moveTo(k[0], k[1]); c.lineTo(lerp(k[0], f[0], .25), lerp(k[1], f[1], .25)); c.stroke(); }
    c.fillStyle = cc('shoes'); c.beginPath(); c.ellipse(f[0] + 4, f[1] + 1, 8, 4.5, 0, 0, 7); c.fill();
  }
  function arm(a, cc){
    const e = [sh[0] + Math.sin(a[0]) * 22, sh[1] + 3 + Math.cos(a[0]) * 22];
    const h = [e[0] + Math.sin(a[1]) * 21, e[1] + Math.cos(a[1]) * 21];
    c.strokeStyle = cc('shirt'); c.lineWidth = look.robe ? 12 : 9; c.beginPath(); c.moveTo(sh[0], sh[1] + 3); c.lineTo(e[0], e[1]); c.stroke();
    c.strokeStyle = look.suit ? cc('shirt') : cc('skin'); c.lineWidth = 7; c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(h[0], h[1]); c.stroke();
    c.fillStyle = look.gloves && !tint ? '#f5f5f5' : cc('skin'); c.beginPath(); c.arc(h[0], h[1], look.gloves ? 7 : 5.5, 0, 7); c.fill();
    return h;
  }
  leg(P.bl, back); arm(P.ba, back); leg(P.fl, col);
  c.fillStyle = col('shirt'); c.beginPath();
  c.moveTo(hip[0] - 14, hip[1] + (look.robe ? 16 : 3)); c.lineTo(hip[0] + 14, hip[1] + (look.robe ? 16 : 3));
  c.lineTo(sh[0] + 15, sh[1]); c.quadraticCurveTo(sh[0], sh[1] - 6, sh[0] - 15, sh[1]); c.closePath(); c.fill();
  if (!tint){
    if (look.stripe){ c.fillStyle = look.stripe; const my = lerp(hip[1], sh[1], .5), mx = lerp(hip[0], sh[0], .5); c.fillRect(mx - 15, my - 5, 30, 8); }
    if (look.belt){ c.fillStyle = look.belt; c.fillRect(hip[0] - 15, hip[1] - 2, 30, 6); }
    if (look.tie){ c.fillStyle = '#e8e8e8'; c.beginPath(); c.moveTo(sh[0] + 4, sh[1] + 1); c.lineTo(sh[0] + 12, sh[1] + 1); c.lineTo(lerp(hip[0], sh[0], .5) + 10, lerp(hip[1], sh[1], .5)); c.fill();
      c.fillStyle = look.tie; c.fillRect(sh[0] + 7, sh[1] + 2, 3.5, 22); }
  }
  const hx = sh[0] + 2, hy = sh[1] - 17;
  c.strokeStyle = col('skin'); c.lineWidth = 7; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(hx, hy + 8); c.stroke();
  c.fillStyle = col('skin'); c.beginPath(); c.arc(hx, hy, 13, 0, 7); c.fill();
  if (!tint){ c.fillStyle = shade(look.skin, .85); c.beginPath(); c.ellipse(hx - 3, hy + 1, 3, 4, 0, 0, 7); c.fill(); sideHair(c, hx, hy, look); sideFace(c, hx, hy, look, ex, talk); }
  const hand = arm(P.fa, col);
  if (look.shield && !P.lie){ c.fillStyle = tint || 'rgba(170,200,240,.55)'; c.strokeStyle = '#1c2333'; c.lineWidth = 2.5; rr(c, hand[0] - 2, hand[1] - 34, 14, 62, 5); c.fill(); c.stroke(); }
  c.restore();
}

/* ---------- portre (önden) ---------- */
function drawPortrait(c, cx, cy, R, key, ex = 'neutral', talk = false){
  const look = LOOK[key]; if (!look) return;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  // omuz
  c.fillStyle = look.shirt; c.beginPath(); c.ellipse(cx, cy + R * 1.55, R * 1.25, R * .8, 0, Math.PI, 0); c.fill();
  if (look.stripe){ c.fillStyle = look.stripe; c.fillRect(cx - R * 1.15, cy + R * 1.18, R * 2.3, R * .16); }
  if (look.tie){ c.fillStyle = '#e8e8e8'; c.beginPath(); c.moveTo(cx - R * .3, cy + R * .8); c.lineTo(cx + R * .3, cy + R * .8); c.lineTo(cx, cy + R * 1.4); c.fill(); c.fillStyle = look.tie; c.fillRect(cx - R * .08, cy + R * .85, R * .16, R * .7); }
  if (look.robe){ c.strokeStyle = shade(look.shirt, .7); c.lineWidth = R * .06; c.beginPath(); c.moveTo(cx - R * .5, cy + R * .8); c.lineTo(cx + R * .2, cy + R * 1.5); c.stroke(); }
  c.fillStyle = look.skin; c.fillRect(cx - R * .28, cy + R * .6, R * .56, R * .35);
  if (look.hs === 'bun'){ c.fillStyle = look.hair; c.beginPath(); c.arc(cx, cy - R * 1.08, R * .32, 0, 7); c.fill(); }
  // kulak + kafa
  c.fillStyle = shade(look.skin, .92); c.beginPath(); c.arc(cx - R * .92, cy + R * .05, R * .17, 0, 7); c.arc(cx + R * .92, cy + R * .05, R * .17, 0, 7); c.fill();
  c.fillStyle = look.skin; c.beginPath(); c.ellipse(cx, cy, R * .9, R, 0, 0, 7); c.fill();
  if (look.shadow){ c.fillStyle = '#0a0a0a'; c.beginPath(); c.ellipse(cx, cy, R * .92, R * 1.02, 0, 0, 7); c.fill();
    c.fillStyle = '#ff2020'; c.fillRect(cx - R * .45, cy - R * .1, R * .25, R * .07); c.fillRect(cx + R * .2, cy - R * .1, R * .25, R * .07); }
  if (look.hs === 'mask'){ c.fillStyle = '#0f0f0f'; c.beginPath(); c.ellipse(cx, cy, R * .92, R * 1.02, 0, 0, 7); c.fill(); }
  // sakal (arka plan)
  if (look.beard && !look.shadow){ c.fillStyle = look.beard;
    if (look.bs === 'long'){ c.beginPath(); c.moveTo(cx - R * .75, cy + R * .2); c.quadraticCurveTo(cx - R * .6, cy + R * 1.6, cx, cy + R * 1.75); c.quadraticCurveTo(cx + R * .6, cy + R * 1.6, cx + R * .75, cy + R * .2); c.quadraticCurveTo(cx, cy + R * .75, cx - R * .75, cy + R * .2); c.fill(); }
    else if (look.bs === 'goatee'){ c.beginPath(); c.ellipse(cx, cy + R * .78, R * .25, R * .25, 0, 0, 7); c.fill(); }
    else if (look.bs === 'full'){ c.beginPath(); c.moveTo(cx - R * .88, cy + R * .05); c.quadraticCurveTo(cx - R * .7, cy + R * 1.2, cx, cy + R * 1.15); c.quadraticCurveTo(cx + R * .7, cy + R * 1.2, cx + R * .88, cy + R * .05); c.quadraticCurveTo(cx, cy + R * .55, cx - R * .88, cy + R * .05); c.fill(); }
    else { c.globalAlpha = .4; c.beginPath(); c.ellipse(cx, cy + R * .55, R * .7, R * .42, 0, 0, Math.PI); c.fill(); c.globalAlpha = 1; } }
  // saç
  const hc = look.hair;
  switch (look.hs){
    case 'short': c.fillStyle = hc; c.beginPath(); c.ellipse(cx, cy - R * .45, R * .95, R * .62, 0, Math.PI, 0); c.fill(); c.fillRect(cx - R * .95, cy - R * .5, R * .2, R * .45); c.fillRect(cx + R * .75, cy - R * .5, R * .2, R * .45); break;
    case 'curly': c.fillStyle = hc; for (let i = 0; i < 9; i++){ const a = Math.PI * (1.0 + i / 8); c.beginPath(); c.arc(cx + Math.cos(a) * R * .82, cy - R * .3 + Math.sin(a) * R * .72, R * .27, 0, 7); c.fill(); } break;
    case 'bun': c.fillStyle = hc; c.beginPath(); c.ellipse(cx, cy - R * .5, R * .92, R * .55, 0, Math.PI, 0); c.fill(); break;
    case 'spiky': c.fillStyle = hc; c.beginPath(); c.ellipse(cx, cy - R * .5, R * .95, R * .55, 0, Math.PI, 0); c.fill();
      for (let i = 0; i < 7; i++){ const x0 = cx - R * .9 + i * R * .3; c.beginPath(); c.moveTo(x0 - R * .15, cy - R * .6); c.lineTo(x0 + R * .05, cy - R * 1.45 + (i % 2) * R * .2); c.lineTo(x0 + R * .25, cy - R * .6); c.fill(); } break;
    case 'cap': c.fillStyle = look.cap; c.beginPath(); c.ellipse(cx, cy - R * .45, R * .98, R * .65, 0, Math.PI, 0); c.fill(); c.fillRect(cx - R * 1.05, cy - R * .5, R * 2.1, R * .16); break;
    case 'helmet': c.fillStyle = '#3d4a63'; c.beginPath(); c.ellipse(cx, cy - R * .3, R * 1.05, R * .85, 0, Math.PI, 0); c.fill(); break;
    case 'hat': c.fillStyle = '#0d0d0d'; c.fillRect(cx - R * 1.25, cy - R * .62, R * 2.5, R * .16); c.fillRect(cx - R * .72, cy - R * 1.45, R * 1.44, R * .88); c.fillStyle = '#5a0000'; c.fillRect(cx - R * .72, cy - R * .8, R * 1.44, R * .14); break;
    case 'bald': c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(cx - R * .3, cy - R * .65, R * .3, R * .14, -.3, 0, 7); c.fill(); break;
  }
  if (look.headband){ c.fillStyle = look.headband; c.fillRect(cx - R * .9, cy - R * .5, R * 1.8, R * .18); }
  if (look.bandana){ c.fillStyle = look.bandana; c.fillRect(cx - R * .92, cy - R * .52, R * 1.84, R * .2); }
  if (!look.shadow){
    // gözler
    const ey = cy - R * .08, ex1 = cx - R * .36, ex2 = cx + R * .36;
    if (look.hs === 'mask'){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(ex1, ey, R * .16, R * .09, .2, 0, 7); c.ellipse(ex2, ey, R * .16, R * .09, -.2, 0, 7); c.fill(); }
    else if (look.glasses){ c.fillStyle = '#0a0a0a'; rr(c, ex1 - R * .25, ey - R * .14, R * .5, R * .28, R * .08); c.fill(); rr(c, ex2 - R * .25, ey - R * .14, R * .5, R * .28, R * .08); c.fill(); c.fillRect(ex1, ey - R * .06, ex2 - ex1, R * .06);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(ex1 - R * .15, ey - R * .1, R * .12, R * .06); c.fillRect(ex2 - R * .15, ey - R * .1, R * .12, R * .06); }
    else if (ex === 'ko'){ c.strokeStyle = '#111111'; c.lineWidth = R * .06; for (const exx of [ex1, ex2]){ c.beginPath(); c.moveTo(exx - R * .12, ey - R * .12); c.lineTo(exx + R * .12, ey + R * .12); c.moveTo(exx + R * .12, ey - R * .12); c.lineTo(exx - R * .12, ey + R * .12); c.stroke(); } }
    else { const eh = ex === 'shock' ? R * .17 : ex === 'angry' ? R * .09 : ex === 'happy' ? R * .08 : R * .13;
      for (const exx of [ex1, ex2]){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(exx, ey, R * .17, eh, 0, 0, 7); c.fill();
        c.fillStyle = look.eye || '#2a1a10'; c.beginPath(); c.arc(exx, ey + R * .01, Math.min(R * .085, eh), 0, 7); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(exx + R * .03, ey - R * .03, R * .025, 0, 7); c.fill(); } }
    // kaşlar
    if (look.hs !== 'mask'){
      c.strokeStyle = look.brow || (['bald', 'hat', 'helmet', 'cap'].includes(look.hs) ? '#2a1a10' : look.hair); c.lineWidth = R * .09;
      const by = cy - R * .32;
      const tilt = ex === 'angry' || ex === 'shout' ? R * .12 : ex === 'sad' || ex === 'pain' ? -R * .1 : ex === 'shock' ? 0 : 0;
      const lift = ex === 'shock' ? -R * .1 : 0;
      c.beginPath(); c.moveTo(ex1 - R * .2, by + lift - tilt * .3); c.lineTo(ex1 + R * .2, by + lift + tilt); c.moveTo(ex2 + R * .2, by + lift - tilt * .3); c.lineTo(ex2 - R * .2, by + lift + tilt); c.stroke();
    }
    if (look.hs !== 'mask'){
      // burun
      c.strokeStyle = shade(look.skin, .72); c.lineWidth = R * .05; c.beginPath(); c.moveTo(cx, cy - R * .02); c.lineTo(cx - R * .08, cy + R * .25); c.lineTo(cx + R * .06, cy + R * .28); c.stroke();
      // ağız
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
   MEKANLAR
   ========================================================= */
const CROWD = []; for (let i = 0; i < 520; i++){ const row = Math.floor(i / 52);
  CROWD.push({ x: (i % 52) * 18.5 + (row % 2) * 9 + rand(-2, 2), y: 132 + row * 16, c: ['#e6e6e6','#f2c230','#14306b','#c43c3c','#7a8cff','#ffffff'][Math.floor(Math.random() * 6)], ph: Math.random() * 6 }); }
const BUILD = []; { let x = -20; while (x < W + 40){ const w = rand(50, 110); BUILD.push({ x, w, h: rand(110, 300) }); x += w + rand(2, 10); } }

function bgSaha(c){
  let g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#6fbcef'); g.addColorStop(1, '#d4ecf8');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#4f8c3c'; for (let i = 0; i < 13; i++){ c.beginPath(); c.arc(i * 80 + 20, 245 + (i % 3) * 8, 52, 0, 7); c.fill(); }
  c.fillStyle = '#a9b1b8'; c.fillRect(0, 262, W, 46);
  c.fillStyle = '#14306b'; c.fillRect(300, 270, 360, 30); txt(c, 'ANOLECRAB ANTRENMAN TESİSİ', 480, 292, 20, '#f2c230', 'center');
  for (let i = 0; i < 6; i++){ c.fillStyle = i % 2 ? '#3f9a3f' : '#47a847'; c.fillRect(0, 308 + i * 39, W, 39); }
  c.fillStyle = '#ffffff'; c.fillRect(0, 316, W, 3);
}
function bgDojo(c, door, ruined){
  c.fillStyle = ruined ? '#9d8f73' : '#eadcbf'; c.fillRect(0, 0, W, 340);
  c.fillStyle = '#6b4226'; c.fillRect(0, 0, W, 26); for (let x = 0; x < W; x += 160) c.fillRect(x, 0, 14, 340);
  for (let x = 250; x < W - 80; x += 160){ c.fillStyle = ruined ? '#bfb39a' : '#fff8e8'; c.fillRect(x + 25, 70, 100, 150); c.strokeStyle = '#7a5235'; c.lineWidth = 3;
    c.strokeRect(x + 25, 70, 100, 150); c.beginPath(); c.moveTo(x + 75, 70); c.lineTo(x + 75, 220); c.moveTo(x + 25, 145); c.lineTo(x + 125, 145); c.stroke();
    if (ruined){ c.fillStyle = '#4a3a2a'; c.beginPath(); c.moveTo(x + 40, 80); c.lineTo(x + 70, 120); c.lineTo(x + 50, 140); c.fill(); } }
  for (const lx of [330, 650]){ c.strokeStyle = '#333333'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, 26); c.lineTo(lx, 50); c.stroke();
    c.fillStyle = ruined ? '#6b2b22' : '#c0392b'; c.beginPath(); c.ellipse(lx, 72, 18, 24, 0, 0, 7); c.fill(); c.fillStyle = '#f39c12'; c.fillRect(lx - 10, 46, 20, 5); c.fillRect(lx - 10, 93, 20, 5); }
  c.fillStyle = '#5a3820'; c.fillRect(70, 130, 140, 340);
  c.fillStyle = door ? '#141414' : '#8b5a33'; c.fillRect(82, 142, 116, 328);
  if (!door){ c.strokeStyle = '#5a3820'; c.lineWidth = 3; c.strokeRect(92, 160, 96, 120); c.strokeRect(92, 300, 96, 150); }
  c.fillStyle = '#a8743f'; c.fillRect(0, 340, W, H - 340);
  c.strokeStyle = '#8d5f31'; c.lineWidth = 2; for (let y = 360; y < H; y += 26){ c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = 'rgba(180,40,40,.25)'; c.fillRect(260, 380, 640, 130);
  if (ruined){ c.fillStyle = 'rgba(40,30,20,.35)'; c.fillRect(0, 0, W, H); }
}
function bigScreenContent(c, x, y, w, h, kind, t){
  c.fillStyle = '#05070c'; c.fillRect(x, y, w, h);
  if (kind === 'off' || !kind){ c.fillStyle = '#0b0f18'; c.fillRect(x + 4, y + 4, w - 8, h - 8); return; }
  c.save(); c.beginPath(); c.rect(x + 4, y + 4, w - 8, h - 8); c.clip();
  c.fillStyle = '#0d1a2e'; c.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === 'lider'){ c.fillStyle = '#2a0c12'; c.fillRect(x, y, w, h); drawPortrait(c, cx, cy - h * .05, h * .3, 'lider', 'smirk', true); }
  else if (kind === 'usta'){ c.fillStyle = '#2a2116'; c.fillRect(x, y, w, h); drawPortrait(c, cx, cy - h * .05, h * .3, 'usta', 'sad'); }
  else if (kind === 'ufisPhoto'){ c.fillStyle = '#3d2e1c'; c.fillRect(x, y, w, h); drawPortrait(c, cx, cy - h * .05, h * .3, 'ufisGenc', 'neutral');
    c.globalCompositeOperation = 'color'; c.fillStyle = '#a07848'; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'source-over'; }
  else if (kind === 'players'){ const keysP = ['mate', 'mate2', 'mate', 'mate2', 'mate', 'mate2'];
    for (let i = 0; i < 6; i++){ const px = x + w * (.18 + (i % 3) * .32), py = y + h * (i < 3 ? .3 : .72); c.fillStyle = '#1b2b45'; c.fillRect(px - w * .13, py - h * .2, w * .26, h * .4);
      drawPortrait(c, px, py - h * .03, h * .11, keysP[i], i % 2 ? 'sad' : 'shock'); } }
  else if (kind === 'masked'){ for (let i = 0; i < 3; i++) drawPortrait(c, x + w * (.25 + i * .25), cy, h * .2, 'masked', 'angry'); }
  else if (kind === 'watch'){ drawPortrait(c, x + w * .3, cy, h * .24, 'issem', 'neutral'); drawPortrait(c, x + w * .7, cy, h * .24, 'ufis', 'neutral');
    c.fillStyle = Math.sin(t * 5) > 0 ? '#ff2020' : '#550000'; c.beginPath(); c.arc(x + 20, y + 20, 6, 0, 7); c.fill(); txt(c, 'REC', x + 32, y + 26, 14, '#ff4040'); }
  else if (kind === 'split'){ c.fillStyle = '#245c2e'; c.fillRect(x, y, w / 2, h); c.fillStyle = '#2a2d33'; c.fillRect(x + w / 2, y, w / 2, h);
    drawPortrait(c, x + w * .25, cy, h * .22, 'issem', 'neutral'); drawPortrait(c, x + w * .75, cy, h * .22, 'ufis', 'angry'); c.fillStyle = '#000000'; c.fillRect(cx - 2, y, 4, h); }
  else if (kind === 'stadium'){ c.fillStyle = '#0a1230'; c.fillRect(x, y, w, h); c.fillStyle = '#2f8f3a'; c.beginPath(); c.ellipse(cx, cy + h * .2, w * .38, h * .22, 0, 0, 7); c.fill();
    c.strokeStyle = '#8a93b0'; c.lineWidth = 6; c.beginPath(); c.ellipse(cx, cy + h * .2, w * .44, h * .3, 0, 0, 7); c.stroke();
    c.fillStyle = '#f2c230'; c.fillRect(x + w * .1, y + h * .12, w * .8, h * .2); txt(c, 'DÜNYA ŞAMPİYONLAR TURNUVASI', cx, y + h * .26, Math.max(10, w * .045), '#14306b', 'center'); }
  c.fillStyle = 'rgba(255,255,255,.05)'; for (let yy = y; yy < y + h; yy += 4) c.fillRect(x, yy, w, 1);
  c.restore();
}
const THEMES = {
  guvenlik: { wall:'#252b38', floor:'#363b45', props:[['cameras', 120], ['monitors', 520], ['desk', 520]] },
  depo:     { wall:'#4b4036', floor:'#5a5046', props:[['crates', 40], ['lamp', 300], ['tablePhotos', 480], ['lamp', 680], ['crates', 760]] },
  safe:     { wall:'#5b4b3d', floor:'#6f5a44', props:[['window', 120], ['lamp', 430], ['sofa', 600]] },
  liderOda: { wall:'#161019', floor:'#1e1622', props:[['bigscreen', 560], ['desk', 160], ['chair', 300]] },
  fabrikaDis:{ outdoor:true, wall:'#2c3138', floor:'#2b2b2e', props:[['factory', 0], ['searchlight', 700], ['fence', 0], ['cameras', 300]] },
  fabrika:  { wall:'#363b40', floor:'#4a4e54', props:[['pipes', 0], ['monitors', 330], ['lamp', 150], ['lamp', 650], ['servers', 800]] },
  kapi:     { wall:'#363b40', floor:'#4a4e54', props:[['pipes', 0], ['speaker', 320], ['keypad', 540], ['door', 640]] },
  eskiOkul: { wall:'#7d6e57', floor:'#665338', props:[['beams', 0], ['medals', 220], ['medals', 640], ['cracks', 0]], dim:.18 },
  leo:      { wall:'#e6dfd1', floor:'#9a7a55', props:[['trophies', 110], ['window', 480], ['desk', 640]] },
  karargah: { wall:'#141d2b', floor:'#1f2937', props:[['bluelights', 0], ['servers', 40], ['bigscreen', 480], ['servers', 840]] },
  salon:    { wall:'#5e4f3f', floor:'#b48550', props:[['hoops', 60], ['lamp', 320], ['lamp', 640], ['hoops', 900], ['courtlines', 0]], dim:.2 },
  soyunma:  { wall:'#21406a', floor:'#7a7f87', props:[['lockers', 0], ['banner', 480]] },
  gizli:    { wall:'#24211e', floor:'#2e2a26', props:[['redlights', 0], ['bars', 140], ['door', 640]] },
};
function drawProp(c, kind, x, st, t){
  switch (kind){
    case 'monitors': for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++){ const mx = x - 170 + i * 88, my = 70 + r * 66;
        c.fillStyle = '#111111'; c.fillRect(mx, my, 80, 56); const kind2 = st.screen === 'masked' && r === 0 && i < 3 ? 'masked1' : st.screen === 'players' && (i + r) % 2 === 0 ? 'player1' : 'static';
        c.fillStyle = kind2 === 'static' ? (Math.sin(t * 3 + i + r) > 0 ? '#1b3a5c' : '#16304d') : '#0d1a2e'; c.fillRect(mx + 3, my + 3, 74, 50);
        if (kind2 === 'masked1') drawPortrait(c, mx + 40, my + 26, 14, 'masked', 'angry');
        if (kind2 === 'player1') drawPortrait(c, mx + 40, my + 26, 13, i % 2 ? 'mate2' : 'mate', 'sad');
        if (kind2 === 'static'){ c.fillStyle = 'rgba(120,200,255,.25)'; c.fillRect(mx + 8, my + 30, 40, 3); c.fillRect(mx + 8, my + 38, 55, 3); } } break;
    case 'desk': c.fillStyle = '#3a2b20'; c.fillRect(x - 110, 395, 220, 14); c.fillRect(x - 100, 409, 10, 50); c.fillRect(x + 90, 409, 10, 50);
      c.fillStyle = '#20242c'; c.fillRect(x - 40, 365, 70, 30); c.fillStyle = '#5ab0ff'; c.fillRect(x - 36, 369, 62, 22); break;
    case 'chair': c.fillStyle = '#2a1520'; rr(c, x - 30, 330, 60, 80, 10); c.fill(); c.fillRect(x - 5, 410, 10, 50); break;
    case 'cameras': c.fillStyle = '#d0d4dc'; c.fillRect(x, 60, 34, 16); c.fillStyle = '#222222'; c.fillRect(x + 30, 64, 10, 8); c.fillStyle = Math.sin(t * 4) > 0 ? '#ff2020' : '#550000'; c.beginPath(); c.arc(x + 6, 68, 3, 0, 7); c.fill(); c.fillStyle = '#888888'; c.fillRect(x + 10, 44, 4, 16); break;
    case 'crates': for (let i = 0; i < 3; i++){ const bx = x + (i % 2) * 70, by = 470 - 70 * (1 + Math.floor(i / 2)); c.fillStyle = '#8a6438'; c.fillRect(bx, by, 68, 68); c.strokeStyle = '#5a3f22'; c.lineWidth = 4; c.strokeRect(bx + 2, by + 2, 64, 64); c.beginPath(); c.moveTo(bx + 4, by + 4); c.lineTo(bx + 64, by + 64); c.stroke(); } break;
    case 'lamp': { c.strokeStyle = '#222222'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 60); c.stroke(); c.fillStyle = '#333333'; c.beginPath(); c.moveTo(x - 22, 78); c.lineTo(x + 22, 78); c.lineTo(x + 8, 60); c.lineTo(x - 8, 60); c.fill();
      const g = c.createRadialGradient(x, 80, 5, x, 160, 200); g.addColorStop(0, 'rgba(255,230,160,.35)'); g.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = g; c.fillRect(x - 200, 70, 400, 400); } break;
    case 'tablePhotos': c.fillStyle = '#4a3527'; c.fillRect(x - 100, 400, 200, 12); c.fillRect(x - 90, 412, 10, 58); c.fillRect(x + 80, 412, 10, 58);
      for (let i = 0; i < 4; i++){ c.fillStyle = '#f2f2f2'; c.fillRect(x - 85 + i * 44, 388, 36, 26); drawPortrait(c, x - 67 + i * 44, 398, 6, i % 2 ? 'mate2' : 'mate', 'neutral'); }
      c.fillStyle = '#c0392b'; c.fillRect(x - 10, 380, 6, 30); break;
    case 'window': c.fillStyle = '#0c1430'; c.fillRect(x, 90, 180, 150); c.fillStyle = '#ffd666'; for (let i = 0; i < 18; i++) c.fillRect(x + 10 + (i * 37) % 160, 120 + (i * 53) % 100, 5, 7);
      c.strokeStyle = '#6b5340'; c.lineWidth = 8; c.strokeRect(x, 90, 180, 150); c.beginPath(); c.moveTo(x + 90, 90); c.lineTo(x + 90, 240); c.stroke(); break;
    case 'sofa': c.fillStyle = '#6b2f2f'; rr(c, x - 110, 360, 220, 60, 14); c.fill(); rr(c, x - 120, 400, 240, 50, 12); c.fill(); break;
    case 'bigscreen': { const w = 380, h = 210; c.fillStyle = '#0a0a0a'; c.fillRect(x - w / 2 - 8, 50 - 8, w + 16, h + 16); bigScreenContent(c, x - w / 2, 50, w, h, st.screen, t);
      if (st.screen && st.screen !== 'off'){ const g = c.createRadialGradient(x, 155, 50, x, 155, 300); g.addColorStop(0, 'rgba(100,150,255,.12)'); g.addColorStop(1, 'rgba(100,150,255,0)'); c.fillStyle = g; c.fillRect(x - 300, 0, 600, 470); } } break;
    case 'factory': c.fillStyle = '#20252c'; c.fillRect(x + 40, 110, 560, 300); c.fillStyle = '#2a3038'; c.beginPath(); c.moveTo(x + 40, 110); c.lineTo(x + 180, 60); c.lineTo(x + 320, 110); c.lineTo(x + 460, 60); c.lineTo(x + 600, 110); c.fill();
      c.fillStyle = '#3a4048'; c.fillRect(x + 680, 30, 30, 380); c.fillStyle = '#ffd666'; for (let i = 0; i < 6; i++) c.fillRect(x + 80 + i * 85, 180, 40, 30); txt(c, 'FABRİKA NO: 7', x + 320, 150, 22, '#8a93a0', 'center'); break;
    case 'searchlight': { const a = Math.sin(t * .8) * .5; c.save(); c.translate(x, 60); c.rotate(a); const g = c.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(255,255,200,.4)'); g.addColorStop(1, 'rgba(255,255,200,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(120, 420); c.lineTo(-120, 420); c.fill(); c.restore(); } break;
    case 'fence': c.strokeStyle = '#555c66'; c.lineWidth = 2; for (let fx = x; fx < x + W; fx += 24){ c.beginPath(); c.moveTo(fx, 320); c.lineTo(fx + 24, 400); c.moveTo(fx + 24, 320); c.lineTo(fx, 400); c.stroke(); } c.fillStyle = '#6b737e'; c.fillRect(x, 316, W, 5); break;
    case 'pipes': c.fillStyle = '#5d646c'; c.fillRect(x, 60, W, 16); c.fillRect(x, 92, W, 10); c.fillStyle = '#7a828b'; for (let px = x + 40; px < x + W; px += 200){ c.fillRect(px, 54, 14, 28); } c.fillStyle = '#b3122e'; for (let px = x + 140; px < x + W; px += 320){ c.beginPath(); c.arc(px, 97, 9, 0, 7); c.fill(); } break;
    case 'servers': for (let i = 0; i < 2; i++){ const sx = x + i * 46 - 46; c.fillStyle = '#0d1117'; c.fillRect(sx, 170, 42, 230); for (let j = 0; j < 12; j++){ c.fillStyle = Math.sin(t * 6 + i * 3 + j * 1.7) > .3 ? '#2ecc71' : '#0a3a1a'; c.fillRect(sx + 6, 180 + j * 18, 4, 4); c.fillStyle = '#1b2230'; c.fillRect(sx + 14, 178 + j * 18, 22, 8); } } break;
    case 'speaker': c.fillStyle = '#1a1a1a'; rr(c, x - 22, 70, 44, 54, 6); c.fill(); c.fillStyle = '#333333'; for (let j = 0; j < 4; j++) c.fillRect(x - 16, 80 + j * 10, 32, 4); break;
    case 'keypad': c.fillStyle = '#1a1a1a'; rr(c, x - 20, 250, 40, 60, 5); c.fill(); c.fillStyle = st.door ? '#2ecc71' : (Math.sin(t * 5) > 0 ? '#ff2020' : '#550000'); c.fillRect(x - 12, 256, 24, 8);
      c.fillStyle = '#666666'; for (let j = 0; j < 9; j++) c.fillRect(x - 13 + (j % 3) * 10, 270 + Math.floor(j / 3) * 11, 7, 7); break;
    case 'door': c.fillStyle = '#2a2d33'; c.fillRect(x - 10, 130, 240, 340); c.fillStyle = st.door ? '#0a0a0a' : '#4b5059'; c.fillRect(x + 4, 144, 212, 326);
      if (!st.door){ c.fillStyle = '#5d636d'; c.fillRect(x + 108, 144, 4, 326); c.fillStyle = '#ffcc00'; for (let j = 0; j < 6; j++) c.fillRect(x + 4 + j * 36, 440, 18, 30); } break;
    case 'beams': c.fillStyle = '#4a3a28'; c.fillRect(x, 0, W, 24); for (let bx = x; bx < x + W; bx += 190) c.fillRect(bx, 0, 16, 470); break;
    case 'medals': c.fillStyle = '#5a4630'; c.fillRect(x - 90, 110, 180, 120); for (let i = 0; i < 3; i++){ c.fillStyle = '#d8cfb8'; c.fillRect(x - 80 + i * 56, 122, 48, 60); drawPortrait(c, x - 56 + i * 56, 148, 10, i === 1 ? 'usta' : 'ufisGenc', 'neutral'); }
      for (let i = 0; i < 4; i++){ c.fillStyle = '#c9a227'; c.beginPath(); c.arc(x - 66 + i * 44, 210, 8, 0, 7); c.fill(); c.fillStyle = '#8a1c1c'; c.fillRect(x - 69 + i * 44, 192, 6, 10); } break;
    case 'cracks': c.strokeStyle = 'rgba(40,30,20,.6)'; c.lineWidth = 2; for (const [cx2, cy2] of [[120, 80], [470, 60], [800, 120]]){ c.beginPath(); c.moveTo(x + cx2, cy2); c.lineTo(x + cx2 + 20, cy2 + 30); c.lineTo(x + cx2 + 5, cy2 + 55); c.lineTo(x + cx2 + 30, cy2 + 90); c.stroke(); }
      c.strokeStyle = 'rgba(220,220,220,.25)'; c.lineWidth = 1; for (let i = 0; i < 6; i++){ c.beginPath(); c.moveTo(x + 20, 26); c.lineTo(x + 20 + Math.cos(i * .3) * 60, 26 + Math.sin(i * .3) * 60); c.stroke(); } break;
    case 'trophies': c.fillStyle = '#6b4a2b'; c.fillRect(x - 80, 230, 170, 10); c.fillRect(x - 80, 150, 170, 10);
      for (let i = 0; i < 4; i++){ const tx = x - 60 + i * 42; c.fillStyle = '#e0b030'; c.beginPath(); c.moveTo(tx - 12, 200); c.lineTo(tx + 12, 200); c.lineTo(tx + 5, 222); c.lineTo(tx - 5, 222); c.fill(); c.fillRect(tx - 2, 222, 4, 6); c.fillRect(tx - 8, 226, 16, 4); } break;
    case 'bluelights': for (let lx = x + 80; lx < x + W; lx += 220){ const g = c.createRadialGradient(lx, 30, 4, lx, 30, 160); g.addColorStop(0, 'rgba(80,160,255,.45)'); g.addColorStop(1, 'rgba(80,160,255,0)'); c.fillStyle = g; c.fillRect(lx - 160, 0, 320, 260); c.fillStyle = '#9ad7ff'; c.fillRect(lx - 30, 24, 60, 5); } break;
    case 'redlights': for (let lx = x + 120; lx < x + W; lx += 300){ const on = Math.sin(t * 4 + lx) > 0; const g = c.createRadialGradient(lx, 40, 4, lx, 40, 160); g.addColorStop(0, on ? 'rgba(255,40,40,.45)' : 'rgba(255,40,40,.12)'); g.addColorStop(1, 'rgba(255,40,40,0)'); c.fillStyle = g; c.fillRect(lx - 160, 0, 320, 300); c.fillStyle = on ? '#ff3030' : '#661010'; c.beginPath(); c.arc(lx, 36, 8, 0, 7); c.fill(); } break;
    case 'bars': c.fillStyle = '#15130f'; c.fillRect(x - 10, 150, 260, 320); c.strokeStyle = '#6b6f75'; c.lineWidth = 6; for (let bx = x; bx < x + 250; bx += 26){ c.beginPath(); c.moveTo(bx, 150); c.lineTo(bx, 470); c.stroke(); } c.fillRect(x - 10, 150, 260, 8); break;
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
    c.fillStyle = '#f5f0d0'; c.beginPath(); c.arc(830, 70, 26, 0, 7); c.fill(); }
  else { c.fillStyle = th.wall; c.fillRect(0, 0, W, 400); c.fillStyle = shade(th.wall, .8); c.fillRect(0, 380, W, 20); }
  c.fillStyle = th.floor; c.fillRect(0, 400, W, H - 400);
  c.strokeStyle = shade(th.floor, .85); c.lineWidth = 2; const off = camX % 90; for (let x = -off; x < W + 60; x += 90){ c.beginPath(); c.moveTo(x, 400); c.lineTo(x - 40, H); c.stroke(); }
  const k0 = Math.floor(camX / W) - 1;
  for (let k = k0; k <= k0 + 2; k++){
    const ox = k * W - camX; if (ox > W || ox < -W * 1.2) continue;
    for (const p of th.props){ if (p[0] === 'bigscreen' && k !== 0 && !st.repeatScreen) continue; drawProp(c, p[0], ox + p[1], st, t); }
  }
  if (th.dim){ c.fillStyle = 'rgba(0,0,0,' + th.dim + ')'; c.fillRect(0, 0, W, H); }
}
function bgStad(c, t, st){
  st = st || {};
  let g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#070b22'); g.addColorStop(1, '#1d2752');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const ox = st.camX ? -(st.camX * .15) % 18.5 : 0;
  c.fillStyle = '#262b40'; c.fillRect(0, 120, W, 180);
  for (const p of CROWD){ const b = st.crowdOn !== false ? Math.sin(t * (st.cheer ? 16 : 9) + p.ph) * (st.cheer ? 3 : 1.6) : 0; c.fillStyle = p.c; c.fillRect(p.x + ox, p.y + b, 6, 7); }
  for (const fx of [70, 890]){ c.fillStyle = '#555c70'; c.fillRect(fx - 4, 20, 8, 110);
    const gl = c.createRadialGradient(fx, 30, 5, fx, 30, 120); gl.addColorStop(0, 'rgba(255,255,230,.9)'); gl.addColorStop(1, 'rgba(255,255,230,0)');
    c.fillStyle = gl; c.fillRect(fx - 120, -90, 240, 240); c.fillStyle = '#fffbe0'; c.fillRect(fx - 26, 18, 52, 22); }
  if (st.bigscreen){ c.fillStyle = '#0a0a0a'; c.fillRect(320, 6, 320, 140); bigScreenContent(c, 326, 12, 308, 128, st.bigscreen, t); }
  else if (!st.noBoard){ c.fillStyle = '#0c0f1c'; rr(c, 330, 18, 300, 56, 8); c.fill(); c.strokeStyle = '#f2c230'; c.lineWidth = 2; c.stroke();
    txt(c, (st.teams ? st.teams[0] : 'ANL') + ' ' + (st.score || '0 - 0') + ' ' + (st.teams ? st.teams[1] : 'RKP'), 480, 46, 22, '#ffd34d', 'center');
    txt(c, st.minute || "0'", 480, 66, 15, '#ffffff', 'center'); }
  c.fillStyle = '#ffffff'; c.fillRect(0, 296, W, 6);
  for (let i = 0; i < 6; i++){ c.fillStyle = i % 2 ? '#2f8f3a' : '#37a043'; c.fillRect(0, 302 + i * 40, W, 40); }
  if (st.camX != null){ c.fillStyle = 'rgba(0,0,0,.06)'; const o2 = st.camX % 240; for (let x = -o2; x < W; x += 240) c.fillRect(x, 302, 120, H - 302); }
  else { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.beginPath(); c.ellipse(480, 410, 150, 48, 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(480, 302); c.lineTo(480, H); c.stroke(); }
}
function bgTunel(c, camX, worldW, alt){
  c.fillStyle = '#17191d'; c.fillRect(0, 0, W, H);
  c.fillStyle = alt ? '#3d3a36' : '#3a3e46'; c.fillRect(0, 70, W, 330);
  c.fillStyle = '#2a2d33'; for (let x = -(camX % 120); x < W; x += 120) c.fillRect(x, 70, 4, 330);
  c.fillStyle = '#4a4f59'; c.fillRect(0, 96, W, 10); c.fillRect(0, 118, W, 6);
  for (let wx = 200; wx < worldW; wx += 320){ const x = wx - camX; if (x < -150 || x > W + 150) continue;
    const gl = c.createRadialGradient(x, 72, 4, x, 72, 140); gl.addColorStop(0, 'rgba(255,230,160,.55)'); gl.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = gl; c.fillRect(x - 140, 0, 280, 260); c.fillStyle = '#ffe9a8'; c.fillRect(x - 30, 66, 60, 8); }
  for (let wx = 520; wx < worldW - 300; wx += 640){ const x = wx - camX; if (x < -200 || x > W + 200) continue;
    if (alt){ c.fillStyle = '#5a2020'; c.fillRect(x - 90, 170, 180, 80); txt(c, 'SADECE PERSONEL', x, 215, 18, '#ffffff', 'center'); continue; }
    c.fillStyle = '#14306b'; c.fillRect(x - 90, 170, 180, 110); c.fillStyle = '#f2c230'; c.fillRect(x - 90, 222, 180, 12);
    txt(c, 'ANOLECRAB', x, 205, 22, '#f2c230', 'center'); txt(c, 'ŞAMPİYONLAR BURADAN GEÇER', x, 260, 14, '#ffffff', 'center'); }
  const ex = worldW - 70 - camX;
  if (ex < W + 200){ const gl = c.createLinearGradient(ex - 120, 0, ex + 60, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,.95)');
    c.fillStyle = gl; c.fillRect(ex - 120, 70, 300, 400); c.fillStyle = '#2ecc71'; c.fillRect(ex - 70, 120, 90, 30); txt(c, 'ÇIKIŞ', ex - 52, 142, 18, '#ffffff'); }
  c.fillStyle = '#4b4e55'; c.fillRect(0, 400, W, H - 400);
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
  c.strokeStyle = '#2a2d3a'; c.lineWidth = 6; c.beginPath(); c.moveTo(660, 400); c.lineTo(660, 230); c.lineTo(700, 230); c.stroke();
  const gl = c.createRadialGradient(700, 240, 2, 700, 300, 140); gl.addColorStop(0, 'rgba(255,220,140,.4)'); gl.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = gl; c.fillRect(560, 230, 280, 240);
  if (car) drawProp(c, 'car', car, {}, t);
}
function drawBg(c, key, st, t){
  const camX = st.camX || 0;
  if (key === 'saha') bgSaha(c);
  else if (key === 'dojo') bgDojo(c, st.door, false);
  else if (key === 'eskiDojo') bgDojo(c, false, true);
  else if (key === 'stad') bgStad(c, t, st);
  else if (key === 'sehir') bgSehir(c, t, st.car);
  else if (key === 'tunel') bgTunel(c, camX, st.worldW || W, false);
  else if (key === 'stadArka') bgTunel(c, camX, st.worldW || W, true);
  else if (THEMES[key]) bgInterior(c, camX, THEMES[key], st, t);
  if (st.sepia){ c.globalCompositeOperation = 'color'; c.fillStyle = '#9a7040'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(60,40,20,.18)'; c.fillRect(0, 0, W, H); }
  if (st.alarm){ c.fillStyle = 'rgba(255,0,0,' + (.08 + .08 * Math.sin(t * 8)) + ')'; c.fillRect(0, 0, W, H); }
}
function drawBall(c, x, y, spin, s = 1){
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(spin);
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill(); c.strokeStyle = '#222222'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#222222'; c.beginPath(); c.arc(0, 0, 3.5, 0, 7); c.fill();
  for (let i = 0; i < 5; i++){ const a = i * 1.2566; c.beginPath(); c.arc(Math.cos(a) * 8, Math.sin(a) * 8, 2, 0, 7); c.fill(); }
  c.restore();
}
function drawStar(c, x, y, r){ c.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr2 = i % 2 ? r * .45 : r;
  c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); }
function tapHint(c, x, y, show, label = 'dokun ▶'){
  if (!show) return; c.globalAlpha = .55 + Math.sin(gameTime * 6) * .4; txt(c, label, x, y, 18, '#f2c230', 'center'); c.globalAlpha = 1;
}
function button(c, b, label, primary, t = 0){
  const pulse = primary ? 1 + Math.sin(t * 4) * .025 : 1;
  c.save(); c.translate(b.x + b.w / 2, b.y + b.h / 2); c.scale(pulse, pulse);
  c.fillStyle = primary ? '#f2c230' : 'rgba(10,16,40,.75)'; rr(c, -b.w / 2, -b.h / 2, b.w, b.h, 12); c.fill();
  c.strokeStyle = primary ? '#fff3b0' : 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke();
  txt(c, label, 0, 8, b.size || 22, primary ? '#14306b' : '#ffffff', 'center'); c.restore();
}
const inB = (b, p) => p && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
