'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   core.js
   ekran · yardımcılar · kayıt · ses · müzik · dublaj · kontroller
   ========================================================= */
const VERSION = 'v.06';
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
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
function rr(c, x, y, w, h, r){ r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function shade(hex, f){ if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  return 'rgb(' + Math.min(255, Math.round(((n >> 16) & 255) * f)) + ',' + Math.min(255, Math.round(((n >> 8) & 255) * f)) + ',' + Math.min(255, Math.round((n & 255) * f)) + ')'; }
function wrap(c, text, maxW){ const words = String(nmz(text)).split(' '), lines = []; let cur = '';
  for (const w of words){ const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > maxW && cur){ lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines; }
/* oyuncunun adı hikâyede Issem'in yerini alır (ekler ünlü uyumuna göre) */
function trSuffix(name, suf){
  const v = (name.toLocaleLowerCase('tr-TR').match(/[aeıioöuü]/g) || ['e']).pop(), endsV = /[aeıioöuü]$/i.test(name);
  const four = { a:'ı', 'ı':'ı', e:'i', i:'i', o:'u', u:'u', 'ö':'ü', 'ü':'ü' }[v] || 'i', two = 'aıou'.includes(v) ? 'a' : 'e';
  if (suf === 'e') return (endsV ? 'y' : '') + two;
  if (suf === 'i') return (endsV ? 'y' : '') + four;
  if (suf === 'in') return (endsV ? 'n' : '') + four + 'n';
  return suf;
}
function nmz(s){
  if (typeof s !== 'string' || (s.indexOf('ssem') < 0 && s.indexOf('SSEM') < 0) || typeof PNAME === 'undefined' || PNAME === 'Issem') return s;
  return s.replace(/Issem'(in|i|e)(?![a-zçğıöşü])/g, (m, suf) => PNAME + "'" + trSuffix(PNAME, suf)).replace(/Issem/g, PNAME).replace(/ISSEM/g, PNAME.toLocaleUpperCase('tr-TR'));
}
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const fnt = (size, weight = 'bold') => weight + ' ' + size + 'px ' + FONT;
/* metni verilen genişliğe sığdıracak yazı boyunu bulur */
function fitSize(c, s, maxW, size, weight = 'bold'){ let z = size; c.font = fnt(z, weight);
  while (z > 9 && c.measureText(s).width * 1.06 > maxW){ z -= 1; c.font = fnt(z, weight); } return z; }
function txt(c, s, x, y, size, col, align = 'left', weight = 'bold', stroke, maxW){
  s = nmz(s);
  if (maxW) size = fitSize(c, s, maxW, size, weight);
  c.font = fnt(size, weight); c.textAlign = align;
  if (stroke){ c.lineWidth = stroke; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y); c.textAlign = 'left';
}
/* yazıyı her zaman tamamen içine alan kutu (emoji payı dahil) */
function pill(c, s, cx, cy, size, bg, fg, opt = {}){
  s = nmz(s);
  const maxW = opt.maxW || W - 40, weight = opt.weight || 'bold';
  size = fitSize(c, s, maxW - 40, size, weight);
  c.font = fnt(size, weight);
  const tw = c.measureText(s).width * 1.08 + (s.match(/[←-⯿\u{1F000}-\u{1FFFF}]/gu) || []).length * size * .35;
  const pw = tw + size * 1.8, ph = size * 2;
  let x = opt.align === 'left' ? cx : opt.align === 'right' ? cx - pw : cx - pw / 2;
  c.fillStyle = bg; rr(c, x, cy - ph / 2, pw, ph, opt.r || ph / 3); c.fill();
  if (opt.border){ c.strokeStyle = opt.border; c.lineWidth = 2; c.stroke(); }
  c.font = fnt(size, weight); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = fg; c.fillText(s, x + pw / 2, cy + 1);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  return { x, y: cy - ph / 2, w: pw, h: ph };
}
const inB = (b, p) => p && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
function scrY(c, y){ const m = c.getTransform(); return (m.d * y + m.f) / (scale * dpr); }

/* ---------- kayıt ---------- */
const SAVE_KEY = 'sonSampiyon_v2';
const SAVE_DEF = { maxCh:1, stars:{}, cur:null, diff:1, music:1, voice:1, best:{} };
function loadSave(){ try { return Object.assign({}, SAVE_DEF, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch(e){ return Object.assign({}, SAVE_DEF); } }
let SAVE = loadSave();
function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch(e){} }

/* ---------- zorluk ---------- */
const DIFFS = [
  { name:'Kolay',  dmg:.6,  hp:.8,  aggr:.8,  maxAtk:1, zone:1.35, ph:1.25, keeper:.7 },
  { name:'Normal', dmg:1,   hp:1,   aggr:1,   maxAtk:2, zone:1,    ph:1,    keeper:1 },
  { name:'Zor',    dmg:1.45,hp:1.3, aggr:1.3, maxAtk:3, zone:.72,  ph:.85,  keeper:1.3 },
];
const DIFF = () => DIFFS[SAVE.diff] || DIFFS[1];

/* =========================================================
   SES
   ========================================================= */
let AC = null, MASTER = null, SFXG = null, MUSG = null;
function audioInit(){
  if (!AC){ try { AC = new (window.AudioContext || window.webkitAudioContext)();
    MASTER = AC.createGain(); MASTER.gain.value = .95; MASTER.connect(AC.destination);
    SFXG = AC.createGain(); SFXG.gain.value = 1; SFXG.connect(MASTER);
    MUSG = AC.createGain(); MUSG.gain.value = .5; MUSG.connect(MASTER); } catch(e){} }
  if (AC && AC.state === 'suspended' && !document.hidden) AC.resume();
  if (typeof MUSIC !== 'undefined' && MUSIC.el && MUSIC.el.paused && SAVE.music && !document.hidden){ const el = MUSIC.el; el.play().then(() => fadeEl(el, musicVol(), 600)).catch(() => {}); }
}
function env(g, t, vol, a, d){ g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
function tone(f, d, type = 'square', vol = .15, slide = 0, delay = 0, out){
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
  env(g, t, vol, .006, d); o.connect(g); g.connect(out || SFXG); o.start(t); o.stop(t + d + .05);
}
let NOISEBUF = null;
function nbuf(){ if (!NOISEBUF){ const n = AC.sampleRate * 2; NOISEBUF = AC.createBuffer(1, n, AC.sampleRate); const a = NOISEBUF.getChannelData(0); for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1; } return NOISEBUF; }
function noise(d, vol = .25, delay = 0, hp = 0, lp = 0, out){
  if (!AC) return; const t = AC.currentTime + delay;
  const s = AC.createBufferSource(); s.buffer = nbuf(); const g = AC.createGain(); env(g, t, vol, .004, d);
  let node = s;
  if (hp){ const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
  if (lp){ const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
  node.connect(g); g.connect(out || SFXG); s.start(t, Math.random()); s.stop(t + d + .05);
}
function swoosh(d = .6, vol = .3, delay = 0, f0 = 300, f1 = 5000){
  if (!AC) return; const t = AC.currentTime + delay;
  const s = AC.createBufferSource(); s.buffer = nbuf(); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
  const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + d * .5); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f); f.connect(g); g.connect(SFXG); s.start(t); s.stop(t + d + .05);
}
/* büyük patlama: ARAÇ logosu ve bossların gelişi */
function boom(delay = 0, vol = 1){
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.2);
  env(g, t, .9 * vol, .005, 1.5); o.connect(g); g.connect(SFXG); o.start(t); o.stop(t + 1.6);
  const s = AC.createBufferSource(); s.buffer = nbuf(); const f = AC.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(90, t + 1.6);
  const g2 = AC.createGain(); env(g2, t, .85 * vol, .003, 1.8); s.connect(f); f.connect(g2); g2.connect(SFXG); s.start(t); s.stop(t + 2);
  noise(.25, .5 * vol, delay, 2500);                           // çatırtı
  for (let i = 0; i < 6; i++) noise(.05, .18 * vol, delay + .15 + Math.random() * .7, 3000);
}
const SFX = {
  punch(){ const v = Math.random(); noise(.07, .45, 0, 0, 2500); tone(120 + v * 60, .1, 'sine', .45, -60); },
  punchHeavy(){ noise(.12, .6, 0, 0, 1800); tone(90, .18, 'sine', .6, -50); noise(.03, .3, 0, 4000); },
  kick(){ noise(.1, .55, 0, 0, 1400); tone(75, .2, 'sine', .7, -40); },
  hit(){ SFX.punch(); }, hit2(){ SFX.punchHeavy(); },
  whiff(){ swoosh(.14, .16, 0, 800, 3000); },
  block(){ tone(1400, .05, 'square', .06); noise(.05, .2, 0, 3000); tone(700, .08, 'triangle', .1, 0, .02); },
  shoot(){ noise(.05, .5, 0, 0, 1800); tone(95, .14, 'sine', .7, -40); },
  ballKick(){ noise(.04, .55, 0, 0, 2200); tone(110, .12, 'sine', .6, -50); },
  net(){ noise(.35, .25, 0, 1500, 6000); },
  post(){ tone(1900, .5, 'sine', .2, -40); tone(2900, .3, 'sine', .08); },
  whistle(){ refWhistle([.18, .38]); },
  longWhistle(){ refWhistle([.25, .25, .9]); },
  goal(){ SFX.roar(3.2); [523, 659, 784, 1046].forEach((f, i) => tone(f, .3, 'triangle', .1, 0, i * .1)); },
  roar(d = 2.4){ noise(d, .35, 0, 250, 2600); noise(d * .8, .25, .2, 500, 4000); },
  crowd(){ noise(2.2, .14, 0, 300, 2500); },
  ooh(){ tone(220, .8, 'sawtooth', .04, -60); noise(1, .12, 0, 300, 1200); },
  blip(){ tone(900, .02, 'square', .015); },
  click(){ tone(1600, .03, 'square', .05); tone(2400, .03, 'square', .03, 0, .02); },
  ok(){ tone(660, .08, 'triangle', .15); tone(990, .14, 'triangle', .15, 0, .08); },
  ko(){ tone(320, .45, 'sawtooth', .1, -260); noise(.2, .3, 0, 0, 900); },
  bell(){ [0, .25, .5].forEach(d => { tone(1320, .6, 'triangle', .14, 0, d); tone(2640, .3, 'sine', .05, 0, d); }); },
  msg(){ tone(1320, .08, 'sine', .14); tone(1760, .14, 'sine', .14, 0, .11); },
  ring(){ for (let i = 0; i < 3; i++){ tone(1180, .1, 'sine', .12, 0, i * .25); tone(1480, .1, 'sine', .12, 0, i * .25 + .1); } },
  power(){ tone(220, .7, 'sawtooth', .12, -190); noise(.3, .1); },
  hurt(){ tone(190, .2, 'sawtooth', .14, -110); noise(.1, .3, 0, 0, 1600); },
  jump(){ swoosh(.12, .1, 0, 600, 2400); },
  land(){ noise(.06, .2, 0, 0, 600); },
  swap(){ swoosh(.25, .25); tone(500, .12, 'triangle', .1, 400); },
  dash(){ swoosh(.3, .3); },
  slide(){ noise(.35, .25, 0, 200, 1500); },
  slam(){ boom(0, .6); },
  alarm(){ for (let i = 0; i < 4; i++){ tone(880, .18, 'square', .06, 0, i * .4); tone(620, .18, 'square', .06, 0, i * .4 + .2); } },
  clap(){ for (let i = 0; i < 6; i++) noise(.05, .3, i * .28, 1200); },
  door(){ tone(90, .4, 'square', .08, -30); noise(.3, .2, 0, 0, 900); },
  doorClose(){ noise(.12, .45, 0, 0, 700); tone(70, .15, 'sine', .4); },
  pickup(){ tone(880, .08, 'triangle', .12); tone(1320, .12, 'triangle', .12, 0, .07); },
  grab(){ noise(.05, .25, 0, 0, 1200); },
  throwIt(){ swoosh(.25, .3, 0, 400, 2500); },
  wood(){ noise(.18, .55, 0, 0, 1800); for (let i = 0; i < 4; i++) tone(rand(180, 320), .06, 'square', .08, -50, i * .04); },
  glass(){ noise(.25, .4, 0, 3000); for (let i = 0; i < 6; i++) tone(rand(2500, 5000), .12, 'sine', .07, 0, i * .03); },
  card(){ noise(.12, .35, 0, 400, 2500); },
  metal(){ tone(420, .5, 'square', .06, -20); tone(1260, .4, 'sine', .08); noise(.06, .3, 0, 2000); },
  dizzy(){ [1800, 2200, 1900].forEach((f, i) => tone(f, .08, 'sine', .06, 300, i * .12)); },
  superOn(){ tone(200, .8, 'sawtooth', .12, 900); swoosh(.8, .3, 0, 200, 6000); },
  fire(){ noise(.6, .35, 0, 300, 3000); tone(150, .5, 'sawtooth', .1, -80); },
  pickupHp(){ [660, 880, 1320].forEach((f, i) => tone(f, .1, 'triangle', .12, 0, i * .06)); },
  boss(){ boom(0, .7); tone(65, 1.6, 'sawtooth', .1); tone(98, 1.6, 'sawtooth', .07); },
  win(){ [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'triangle', .14, 0, i * .12)); },
  lose(){ [392, 330, 262, 196].forEach((f, i) => tone(f, .35, 'triangle', .14, 0, i * .18)); },
  speaker(){ noise(.35, .18, 0, 900, 3500); tone(988, .18, 'sine', .1, 0, .05); tone(784, .3, 'sine', .1, 0, .25); },
  keypad(){ tone(rand(900, 1400), .07, 'square', .07); },
  keyErr(){ tone(220, .25, 'square', .1); tone(180, .3, 'square', .1, 0, .12); },
  static(){ noise(.5, .25, 0, 1000); },
  screenOff(){ tone(4000, .25, 'sine', .05, -3800); noise(.1, .1, 0, 3000); },
  rank(){ boom(0, .4); tone(880, .3, 'triangle', .12); },
};
function refWhistle(parts){ let t = 0; for (const d of parts){ if (!AC) return;
  const t0 = AC.currentTime + t; const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
  o.type = 'sine'; o.frequency.value = 2950; o2.type = 'sine'; o2.frequency.value = 3010; lfo.frequency.value = 28; lg.gain.value = 140;
  lfo.connect(lg); lg.connect(o.frequency); env(g, t0, .09, .01, d); o.connect(g); o2.connect(g); g.connect(SFXG);
  [o, o2, lfo].forEach(x => { x.start(t0); x.stop(t0 + d + .05); }); t += d + .12; } }
function vib(p){ try { navigator.vibrate && navigator.vibrate(p); } catch(e){} }

/* ---------- tribün ambiyansı (maçlar) ---------- */
let CROWD_NODE = null;
function crowdAmb(on, level = .12){
  if (!AC) return;
  if (on && !CROWD_NODE){ const s = AC.createBufferSource(); s.buffer = nbuf(); s.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .6;
    const g = AC.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(level, AC.currentTime + 1.5);
    s.connect(f); f.connect(g); g.connect(SFXG); s.start(); CROWD_NODE = { s, g }; }
  else if (!on && CROWD_NODE){ const n = CROWD_NODE; CROWD_NODE = null; n.g.gain.linearRampToValueAtTime(0, AC.currentTime + .8); setTimeout(() => { try { n.s.stop(); } catch(e){} }, 900); }
}
function crowdLevel(v){ if (CROWD_NODE && AC) CROWD_NODE.g.gain.setTargetAtTime(v, AC.currentTime, .3); }

/* =========================================================
   MÜZİK — önce MP3 (menu.mp3 / dovus.mp3 / futbol.mp3), yoksa oyunun kendi bestesi
   ========================================================= */
const MUSIC = { kind:null, el:null, synth:null, duck:1, timer:null };
/* ekrana göre müzik: kapak/hikâye = menu, dövüş = dovus, futbol = futbol, final ve jenerik = final */
const MFILES = { menu:'menu.mp3', story:'menu.mp3', fight:'dovus.mp3', football:'futbol.mp3', final:'final.mp3' };
const MVOL = { menu:.55, story:.2, fight:.42, football:.38, final:.6 };
function musicVol(){ return (MVOL[MUSIC.kind] || .5) * MUSIC.duck; }
const AUDS = new Set();                      // oluşturulan tüm müzik öğeleri (arka planda hepsi durdurulur)
let HIDDEN = !!document.hidden;
function fadeEl(el, to, ms, done){
  clearInterval(el._fi); const from = el.volume, t0 = Date.now();
  const fin = () => { clearInterval(el._fi); el._fi = null; if (done) done(); };
  if (HIDDEN || ms <= 0){ try { el.volume = Math.max(0, Math.min(1, to)); } catch(e){} fin(); return; }
  el._fi = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / ms); try { el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch(e){} if (k >= 1) fin(); }, 30);
}
function killEl(el){ try { clearInterval(el._fi); el.pause(); el.removeAttribute('src'); el.load(); } catch(e){} AUDS.delete(el); }
function playMusic(kind){
  if (!SAVE.music){ stopMusic(); return; }
  if (MUSIC.kind === kind) return;
  const prevKind = MUSIC.kind;
  if (MUSIC.el && prevKind && MFILES[prevKind] === MFILES[kind]){ MUSIC.kind = kind; fadeEl(MUSIC.el, musicVol(), 600); return; }   // aynı parça: sadece ses seviyesi
  if (MUSIC.el){ const old = MUSIC.el; fadeEl(old, 0, 700, () => killEl(old)); MUSIC.el = null; }
  stopSynth(); MUSIC.kind = kind;
  const el = new Audio(MFILES[kind]); el.loop = true; el.volume = 0; MUSIC.el = el; AUDS.add(el);
  if (HIDDEN) return;                                          // arka plandaysa çalma; öne gelince başlar
  const fallback = () => { if (MUSIC.kind === kind && MUSIC.el === el){ MUSIC.el = null; startSynth(kind); } };
  el.addEventListener('error', fallback);
  const p = el.play(); if (p && p.then) p.then(() => { if (HIDDEN || MUSIC.el !== el){ try { el.pause(); } catch(e){} return; } fadeEl(el, musicVol(), 900); }).catch(e => { if (e && e.name === 'NotAllowedError') return; fallback(); }); else fadeEl(el, musicVol(), 900);
}
function stopMusic(){ MUSIC.kind = null; if (MUSIC.el){ const old = MUSIC.el; fadeEl(old, 0, 400, () => killEl(old)); MUSIC.el = null; } stopSynth(); }
/* uygulama arka plana alınınca / kapatılınca TÜM sesler durur; öne gelince kaldığı yerden devam */
function bgPause(){ HIDDEN = true; try { hush(); } catch(e){} for (const a of AUDS) try { a.pause(); } catch(e){}
  if (AC && AC.state === 'running') AC.suspend().catch(() => {}); }
function bgResume(){ if (document.hidden) return; HIDDEN = false; if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
  if (MUSIC.el && SAVE.music){ const el = MUSIC.el; el.play().then(() => fadeEl(el, musicVol(), 400)).catch(() => {}); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) bgPause(); else bgResume(); });
addEventListener('pagehide', bgPause); addEventListener('pageshow', bgResume);
document.addEventListener('freeze', bgPause); document.addEventListener('resume', bgResume);
function setDuck(d){ MUSIC.duck = d; if (MUSIC.el) try { MUSIC.el.volume = musicVol(); } catch(e){} if (MUSG && AC) MUSG.gain.setTargetAtTime(.5 * d * (MUSIC.kind === 'story' ? .45 : 1), AC.currentTime, .15); }
/* --- yedek besteler (telifsiz, oyuna özel) --- */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SONGS = {
  menu:     { bpm:122, chords:[[52, 'M'], [59, 'M'], [61, 'm'], [57, 'M']], drum:'rock',
    lead:[71,71,68,71,73,71,68,64, 66,66,63,66,68,66,63,59, 64,68,73,71,68,64,68,71, 73,71,69,68,64,66,68,0] },
  fight:    { bpm:142, chords:[[57, 'm'], [53, 'M'], [55, 'M'], [52, 'M']], drum:'fight',
    lead:[69,0,72,69,76,0,74,72, 72,0,69,72,77,76,74,72, 74,0,71,74,79,77,76,74, 76,75,76,79,76,0,71,0] },
  football: { bpm:118, chords:[[50, 'M'], [57, 'M'], [59, 'm'], [55, 'M']], drum:'stadium',
    lead:[74,0,74,76,78,0,76,74, 73,0,73,74,76,0,74,73, 71,0,71,73,74,76,78,0, 79,78,76,74,76,0,0,0] },
};
SONGS.story = SONGS.menu; SONGS.final = SONGS.football;
function startSynth(kind){
  if (!AC || !SAVE.music) return; stopSynth();
  const S = SONGS[kind] || SONGS.menu, step = 60 / S.bpm / 2; let i = 0, next = AC.currentTime + .1;
  MUSG.gain.value = .5 * MUSIC.duck * (kind === 'story' ? .45 : 1);
  MUSIC.synth = kind;
  MUSIC.timer = setInterval(() => {
    if (!AC) return;
    while (next < AC.currentTime + .2){ synthStep(S, i, next, step); i = (i + 1) % 64; next += step; }
  }, 30);
}
function stopSynth(){ if (MUSIC.timer){ clearInterval(MUSIC.timer); MUSIC.timer = null; } MUSIC.synth = null; }
function mnote(f, t, d, type, vol, cutoff){
  const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter(); o.type = type; o.frequency.value = f;
  fl.type = 'lowpass'; fl.frequency.value = cutoff || 2400; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(fl); fl.connect(g); g.connect(MUSG); o.start(t); o.stop(t + d + .05);
}
function mdrum(kind, t){
  if (kind === 'k'){ const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .2); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .28); o.connect(g); g.connect(MUSG); o.start(t); o.stop(t + .3); }
  else { const s = AC.createBufferSource(); s.buffer = nbuf(); const f = AC.createBiquadFilter(); const g = AC.createGain();
    if (kind === 's'){ f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); }
    else if (kind === 'c'){ f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2; g.gain.setValueAtTime(.6, t); g.gain.exponentialRampToValueAtTime(.001, t + .12); }
    else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); }
    s.connect(f); f.connect(g); g.connect(MUSG); s.start(t, Math.random()); s.stop(t + .25); }
}
function synthStep(S, i, t, step){
  const bar = Math.floor(i / 8) % 4, e = i % 8, section = Math.floor(i / 32);
  const [root, q] = S.chords[bar];
  const third = q === 'm' ? 3 : 4;
  // davul
  if (S.drum === 'fight'){ if (e % 2 === 0 || e === 3) mdrum('k', t); if (e === 2 || e === 6) mdrum('s', t); mdrum('h', t); mdrum('h', t + step / 2); }
  else if (S.drum === 'stadium'){ if (e === 0 || e === 4 || e === 5) mdrum('k', t); if (e === 2 || e === 6){ mdrum('c', t); mdrum('c', t + .02); } if (e % 2 === 1) mdrum('h', t); }
  else { if (e === 0 || e === 3 || e === 4) mdrum('k', t); if (e === 2 || e === 6) mdrum('s', t); mdrum('h', t); }
  // bas
  const bassN = S.drum === 'fight' ? [0, 0, 12, 0, 0, 12, 0, 7][e] : [0, 0, 7, 0, 0, 0, 7, 12][e];
  mnote(mtof(root - 12 + bassN), t, step * .9, 'sawtooth', .16, 700);
  // akor vuruşları
  if (S.drum === 'fight' ? e % 2 === 0 : (e === 0 || e === 3 || e === 6)){
    [0, third, 7, 12].forEach(n => mnote(mtof(root + n), t, step * (S.drum === 'fight' ? .8 : 1.6), 'sawtooth', .035, 1800)); }
  // ana melodi (ikinci bölümde)
  if (section === 1){ const m = S.lead[(i - 32) % 32]; if (m) mnote(mtof(m), t, step * 1.1, S.drum === 'stadium' ? 'triangle' : 'square', .06, 3000); }
}

/* =========================================================
   DUBLAJ — telefonun Türkçe sesi, her karaktere ayrı ton/hız
   ========================================================= */
const VOX = {
  narr:{ p:1, r:1.04 }, 'Issem':{ p:1.25, r:1.08 }, 'Ufis':{ p:.62, r:.86 }, 'Teknik Direktör':{ p:.85, r:.96 },
  'Gizemli Adam':{ p:.42, r:.82 }, 'Lider':{ p:.42, r:.82 }, 'Yardımcı':{ p:.75, r:1 }, 'Güvenlik Görevlisi':{ p:1, r:1.12 },
  'Görevli':{ p:1, r:1.12 }, 'Maskeli Adam':{ p:.58, r:.95 }, 'Futbolcu':{ p:1.4, r:1.22 }, 'Takım Arkadaşı':{ p:1.3, r:1.1 },
  'Leo':{ p:1.05, r:1.02 }, 'Usta':{ p:.52, r:.74 }, 'Narak':{ p:.5, r:1.14 }, 'Dövüşçü':{ p:.32, r:.84 },
  'Gizemli Kişi':{ p:.28, r:.74 }, 'Spiker':{ p:1.3, r:1.24 },
};
let TR_VOICES = [], SPEAKING = false, SPEAK_ID = 0;
function loadVoices(){ try { TR_VOICES = speechSynthesis.getVoices().filter(v => /^tr/i.test(v.lang)); } catch(e){} }
if (window.speechSynthesis){ loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
const clean = s => String(s).replace(/[←-⯿\u{1F000}-\u{1FFFF}️]/gu, '').replace(/…/g, '.').trim();
function say(text, who, onend){
  if (!SAVE.voice || !window.speechSynthesis){ return false; }
  try {
    speechSynthesis.cancel(); const t = clean(nmz(text)); if (!t) return false;
    const u = new SpeechSynthesisUtterance(t); u.lang = 'tr-TR';
    const v = VOX[who] || VOX.narr; u.pitch = v.p; u.rate = v.r; u.volume = 1;
    if (TR_VOICES.length) u.voice = TR_VOICES[who && who !== 'narr' && TR_VOICES.length > 1 && v.p > 1.1 ? 1 : 0];
    const id = ++SPEAK_ID; SPEAKING = true; setDuck(.3);
    const end = () => { if (id === SPEAK_ID){ SPEAKING = false; setDuck(1); if (onend) onend(); } };
    u.onend = end; u.onerror = end; speechSynthesis.speak(u); return true;
  } catch(e){ SPEAKING = false; return false; }
}
function hush(){ SPEAK_ID++; SPEAKING = false; try { window.speechSynthesis && speechSynthesis.cancel(); } catch(e){} setDuck(1); }
function unlockSpeech(){ try { if (window.speechSynthesis){ const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch(e){} }

/* =========================================================
   KONTROLLER — solda joystick, sağda duruma göre tuşlar
   ========================================================= */
const keys = { left:0, right:0, up:0, down:0, jump:0, punch:0, kick:0, block:0, slide:0, grab:0, super:0, swap:0, shoot:0, dash:0, tackle:0, pass:0, thru:0, lob:0 };
const JOY = { x:0, y:0, active:false };
const pressedAt = {};
let gameTime = 0, tap = null, anyPress = false;
function press(k, v){ if (v && !keys[k]){ pressedAt[k] = gameTime; anyPress = true; } keys[k] = v ? 1 : 0; }
function took(k){ if (pressedAt[k] != null && gameTime - pressedAt[k] < .22){ pressedAt[k] = null; return true; } return false; }
document.querySelectorAll('.btn').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); audioInit(); press(k, 1); b.classList.add('on'); };
  const off = e => { e.preventDefault(); press(k, 0); b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
/* joystick */
const joyEl = document.getElementById('joy'), knobEl = document.getElementById('knob');
let joyId = null;
function joySet(dx, dy){
  JOY.x = dx; JOY.y = dy;
  knobEl.style.transform = 'translate(' + (dx * 34) + '%,' + (dy * 34) + '%)';
  press('left', dx < -.35); press('right', dx > .35);
  const up = dy < -.55, dn = dy > .55;
  if (up && !keys.up) press('jump', 1); else if (!up) press('jump', 0);
  press('up', up); press('down', dn);
}
function joyMove(e){ const r = joyEl.getBoundingClientRect(); const R = r.width / 2;
  let dx = (e.clientX - r.left - R) / (R * .8), dy = (e.clientY - r.top - R) / (R * .8); const m = Math.hypot(dx, dy); if (m > 1){ dx /= m; dy /= m; } joySet(dx, dy); }
joyEl.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); joyId = e.pointerId; try { joyEl.setPointerCapture(joyId); } catch(_){} JOY.active = true; joyEl.classList.add('on'); joyMove(e); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joyId){ e.preventDefault(); joyMove(e); } });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; JOY.active = false; joyEl.classList.remove('on'); joySet(0, 0); };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);

cv.addEventListener('pointerdown', e => { audioInit(); const r = cv.getBoundingClientRect(); tap = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; });
addEventListener('contextmenu', e => e.preventDefault());
const KMAP = { ArrowLeft:'left', ArrowRight:'right', ArrowDown:'down', KeyZ:'punch', KeyX:'kick', KeyC:'block', KeyV:'slide', KeyA:'grab', KeyD:'super', KeyS:'swap', KeyQ:'shoot', KeyW:'dash', KeyE:'tackle', KeyR:'pass', KeyF:'thru', KeyG:'lob' };
addEventListener('keydown', e => {
  audioInit();
  if (e.repeat) { if (KMAP[e.code] || e.code === 'ArrowUp' || e.code === 'Space') e.preventDefault(); return; }
  if (KMAP[e.code]){ press(KMAP[e.code], 1); e.preventDefault(); }
  if (e.code === 'ArrowUp'){ press('up', 1); press('jump', 1); e.preventDefault(); }
  if (e.code === 'Enter'){ tap = { x: W / 2, y: H / 2, key: true }; e.preventDefault(); }
  if (e.code === 'Space'){ press('jump', 1); tap = { x: W / 2, y: H / 2, key: true }; e.preventDefault(); }
  if (e.code === 'Escape' || e.code === 'KeyP') tap = { x: W - 30, y: 30, pause: true };
  if (e.code === 'ArrowUp') JOY.y = -1; if (e.code === 'ArrowDown') JOY.y = 1;
});
addEventListener('keyup', e => { if (KMAP[e.code]) press(KMAP[e.code], 0); if (e.code === 'Space' || e.code === 'ArrowUp'){ press('jump', 0); press('up', 0); } if (e.code === 'ArrowUp' || e.code === 'ArrowDown') JOY.y = 0; });

/* sağ tuşların yerleri (yuva) */
const SLOTS = { A:'right:19vmin;bottom:3vmin;width:21vmin;height:21vmin;font-size:9vmin', B:'right:2vmin;bottom:17vmin', C:'right:41vmin;bottom:2vmin',
  D:'right:21vmin;bottom:26vmin', E:'right:2vmin;bottom:36vmin', F:'right:40vmin;bottom:20vmin', G:'right:58vmin;bottom:3vmin;width:13vmin;height:13vmin;font-size:6vmin',
  /* futbol: PES mobil tarzı elmas dizilim */
  H:'right:34vmin;bottom:14vmin;width:19vmin;height:19vmin;font-size:7vmin;border-color:#5aa0ff', I:'right:15vmin;bottom:1vmin;width:17vmin;height:17vmin;font-size:6vmin;border-color:#2ecc71',
  J:'right:15vmin;bottom:33vmin;width:17vmin;height:17vmin;font-size:6vmin;border-color:#f1c40f', K:'right:0vmin;bottom:16vmin;width:16vmin;height:16vmin;font-size:6vmin;border-color:#ff6b6b',
  L:'right:36vmin;bottom:35vmin;width:13vmin;height:13vmin;font-size:5vmin;border-color:#9ad7ff' };
const MODES = {
  fight: { punch:['A', '👊'], kick:['B', '🦵'], block:['C', '🛡️'], slide:['D', '💨'], super:['E', '⭐'], grab:['F', '✋'], swap:['G', '⇄'] },
  match: { shoot:['A', '⚽'], dash:['B', '💨'], tackle:['C', '🦶'] },
  shot:  { shoot:['A', '⚽'] },
  foot:  { shoot:['H', '⚽'], pass:['I', '➡️'], thru:['J', '⤴️'], lob:['K', '🌙'], dash:['L', '💨'] },
};
const UI = document.getElementById('ui');
function showControls(mode, opt = {}){
  UI.style.display = mode ? 'block' : 'none';
  for (const k in keys) keys[k] = 0; JOY.x = JOY.y = 0; knobEl.style.transform = '';
  if (!mode) return;
  const M = MODES[mode];
  document.querySelectorAll('.btn').forEach(b => {
    const k = b.dataset.k, d = M[k];
    b.classList.remove('on', 'ready');
    if (!d || (k === 'swap' && !opt.swap) || (k === 'grab' && opt.noGrab)){ b.style.display = 'none'; return; }
    b.style.cssText = 'display:flex;' + SLOTS[d[0]];
    b._h = null; b.textContent = (opt.labels && opt.labels[k]) || d[1];
  });
  joyEl.style.display = opt.noJoy ? 'none' : 'block';
}
function setBtnReady(k, on){ const b = document.querySelector('.btn[data-k="' + k + '"]'); if (b) b.classList.toggle('ready', !!on); }
function setBtnHTML(k, s){ const b = document.querySelector('.btn[data-k="' + k + '"]'); if (b && b._h !== s){ b._h = s; b.innerHTML = s; } }
function setBtnLabel(k, s){ const b = document.querySelector('.btn[data-k="' + k + '"]'); if (b && b.textContent !== s) b.textContent = s; }
