'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   fightx.js — modern dövüş katmanı
   • MÜKEMMEL BLOK (parry): darbe gelmeden hemen önce 🛡️ → hasar yok, rakip sendeler, zaman donar
   • MÜKEMMEL KAÇIŞ: darbe anında 💨 kayma → ağır çekim, süper dolar
   • BİTİRİCİ: sersemlemiş rakibe 🦵 → sinematik 3 vuruşluk seri (kamera yakınlaşır, siyah bantlar)
   • STİL DERECESİ: D → C → B → A → S → ŞAMPİYON (farklı hareketler = daha hızlı yükselir, darbe yiyince düşer)
   • darbe efektleri: hız çizgileri, şok halkaları, yön çizgili kıvılcımlar, kamera vuruşu
   • yeni düşman: HÜCUMCU (koşarak omuz atar; kaçırırsa nefes nefese kalır, duvara çarparsa sersemler)
   ========================================================= */
LOOK.charger = { skin:'#d8a47f', hair:'#3a2414', hs:'short', headband:'#ff6a00', shirt:'#c0392b', stripe:'#2b2b2b', shorts:'#2b2b2b', socks:'#2b2b2b', shoes:'#111111', scale:1.12, beard:'#3a2414', bs:'stubble' };

/* ---------- stil derecesi ---------- */
const STYLE = [[0, 'D', 'Deneme', '#9aa0a8'], [35, 'C', 'Cesur', '#7fd0ff'], [75, 'B', 'Büyük', '#7dff9a'], [125, 'A', 'Alev', '#ffb84d'], [185, 'S', 'Süper', '#ff5a5a'], [260, 'SS', 'ŞAMPİYON!', '#f2c230']];
function styleOf(L){ const v = (L.sty && L.sty.v) || 0; let r = STYLE[0]; for (const s of STYLE) if (v >= s[0]) r = s; return r; }
function styleAdd(L, n, hurt){
  const S = L.sty || (L.sty = { v:0, hold:0, last:[], pop:0 }); const before = styleOf(L)[1];
  S.v = clamp(S.v + n, 0, 320); if (hurt){ S.v = Math.min(S.v, 40); S.last = []; } else S.hold = 1.6;
  const after = styleOf(L)[1]; if (after !== before && n > 0){ S.pop = 1; if (after === 'S' || after === 'SS'){ SFX.combo(); if (after === 'SS') say('Şampiyon gibi dövüşüyor!', 'Spiker'); } }
}
function styleHit(L, o){
  const p = L.p, m = p && p.atk ? p.atk.m : null, kind = o.finisher ? 'fin' : m ? (m.anim + (m.heavy ? '+' : '')) : p && p.slideT > 0 ? 'slide' : 'thr';
  const S = L.sty || (L.sty = { v:0, hold:0, last:[], pop:0 }); const fresh = !S.last.includes(kind);
  S.last.push(kind); if (S.last.length > 3) S.last.shift();
  styleAdd(L, (fresh ? 11 : 4) + (o.heavy ? 5 : 0) + (o.launch ? 6 : 0) + (o.finisher ? 30 : 0));
}

/* ---------- darbe efektleri ---------- */
function impactFX(L, x, y, dir, o){
  const fx = L.fx || (L.fx = { rings:[], lines:0, lx:0, ly:0, bars:0 });
  for (let i = 0; i < (o.heavy ? 9 : 5); i++){ const a = (dir > 0 ? 0 : Math.PI) + rand(-.7, .7), v = rand(380, 820); L.parts.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 60, life:rand(.14, .26), col:o.heavy ? '#ffffff' : '#ffe9a0', type:'streak', r:0, ang:a }); }
  if (o.heavy || o.launch || o.finisher){ fx.rings.push({ x, y, t:0, big:!!o.finisher }); FX.zoom = Math.max(FX.zoom, o.finisher ? 1.22 : 1.06); FX.zx = x; FX.zy = y; }
  if (o.finisher || o.launch){ fx.lines = .32; fx.lx = x; fx.ly = y; }
}
function fxTick(L, dt){
  if (!L.chHint && L.ents.some(e => e.T && e.T.rush && !e.dead)){ L.chHint = true; L.hint = 'HÜCUMCU! Kırmızı yanıp koşar: çarpmadan hemen önce 🛡️ (MÜKEMMEL BLOK) ya da 💨 kay. Duvara çarparsa sersemler!'; L.hintT = 6; }
  const fx = L.fx; if (fx){ for (const r of fx.rings) r.t += dt; fx.rings = fx.rings.filter(r => r.t < .35); if (fx.lines > 0) fx.lines -= dt; if (fx.bars > 0 && !(L.finT > 0)) fx.bars = Math.max(0, fx.bars - dt * 3); }
  if (L.finT > 0){ L.finT -= dt; if (fx) fx.bars = Math.min(1, fx.bars + dt * 6); if (L.finT <= 0) L.finE = null; }
  if (L.sty){ const S = L.sty; if (S.hold > 0) S.hold -= dt; else S.v = Math.max(0, S.v - dt * 14); if (S.pop > 0) S.pop -= dt * 2.5; }
  for (const q of L.parts) if (q.type === 'streak'){ q.vx *= Math.pow(.02, dt); q.vy *= Math.pow(.02, dt); }
}
function fxDrawWorld(c, L){
  const fx = L.fx; if (!fx) return;
  for (const r of fx.rings){ const k = r.t / .35; c.globalAlpha = (1 - k) * .9; c.strokeStyle = r.big ? '#f2c230' : '#ffffff'; c.lineWidth = (r.big ? 9 : 5) * (1 - k) + 1;
    c.beginPath(); c.ellipse(r.x, r.y, (r.big ? 140 : 70) * (.25 + k), (r.big ? 70 : 34) * (.25 + k), 0, 0, 7); c.stroke(); }
  c.globalAlpha = 1;
  // yön çizgili kıvılcımlar (parçacıklar arasında özel çizim)
  for (const q of L.parts){ if (q.type !== 'streak') continue; c.globalAlpha = Math.min(1, q.life / .14); c.strokeStyle = q.col; c.lineWidth = 3; c.lineCap = 'round';
    const l = Math.hypot(q.vx, q.vy) * .035 + 4; const an = Math.atan2(q.vy, q.vx); c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - Math.cos(an) * l, q.y - Math.sin(an) * l); c.stroke(); }
  c.globalAlpha = 1;
  // bitirici istemi: sersemleyen düşmanın üstünde
  const p = L.p; if (p && !p.dead && !p.atk){ const e = finTarget(L, p); if (e){ const y = e.y - 170 * (e.look.scale || 1) - 20 + Math.sin(gameTime * 8) * 4;
      pill(c, '🦵 BİTİR!', e.x, y, 15, 'rgba(242,194,48,.95)', '#14306b'); } }
}
function fxDrawScreen(c, L){
  const fx = L.fx; if (!fx) return;
  if (fx.lines > 0){ const k = fx.lines / .32, cx = fx.lx - L.camX, cy = fx.ly; c.save(); c.globalAlpha = k * .8; c.strokeStyle = '#ffffff';
    for (let i = 0; i < 46; i++){ const a = i / 46 * Math.PI * 2 + (i % 3) * .05, r0 = 150 + (i * 37) % 90, r1 = 700; c.lineWidth = 1 + (i % 4);
      c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * .7); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .7); c.stroke(); } c.restore(); }
  if (fx.bars > 0){ const h = 46 * fx.bars; c.fillStyle = '#000000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
    if (L.finT > 0) { c.globalAlpha = fx.bars; txt(c, 'BİTİRİCİ!', 480, H - h / 2 + 10, 28, '#f2c230', 'center', 'italic 900', 5); c.globalAlpha = 1; } }
}
function drawStyleRank(c, L){
  const S = L.sty; if (!S || S.v < 35 || L.done) return;
  const r = styleOf(L), nx = STYLE[STYLE.indexOf(r) + 1], k = nx ? (S.v - r[0]) / (nx[0] - r[0]) : 1, pop = Math.max(0, S.pop || 0);
  const x = W - 74, y = 196; c.save(); c.translate(x, y); c.scale(1 + pop * .5, 1 + pop * .5); c.rotate(-.12);
  txt(c, r[1], 0, 22, r[1].length > 1 ? 52 : 62, r[3], 'center', 'italic 900', 7); c.restore();
  txt(c, r[2], x, y + 44, 15, r[3], 'center', 'italic 900', 4);
  c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x - 46, y + 54, 92, 7); c.fillStyle = r[3]; c.fillRect(x - 46, y + 54, 92 * clamp(k, 0, 1), 7);
}

/* ---------- mükemmel blok / kaçış ---------- */
function parry(L, p, e){
  SFX.parry(); SFX.clang(); vib([10, 30, 40]); hitstop = .16; shake = Math.max(shake, 7); FX.flash = .35;
  spawnParts(L, p.x + p.face * 26, p.y - 82, '#9ad7ff', 14); impactFX(L, p.x + p.face * 26, p.y - 82, p.face, { heavy:true });
  floatText(L, p.x, p.y - 150, 'MÜKEMMEL BLOK!', '#9ad7ff', 26); p.sup = Math.min(100, p.sup + 18); styleAdd(L, 24); p.inv = .25;
  if (e && !e.dead){ e.wind = 0; e.strike = 0; e.dashing = 0; e.stun = 0; e.vx = -e.face * 260; e.dizzy = Math.max(e.dizzy || 0, e.T.boss ? .9 : 1.5); e.dz = 0;
    if (!e.T.boss) SFX.dizzy(); floatText(L, e.x, e.y - 120, 'SENDELEDİ!', '#fff176', 20); }
  if (!L.parryHint){ L.parryHint = true; L.hint = 'Harika! Sersemleyen rakibe 🦵 bas: BİTİRİCİ!'; L.hintT = 4; }
}
function perfectDodge(L, p, e){
  slowMo(p.x, p.y - 80, .5); SFX.whoosh ? SFX.whoosh() : SFX.dash(); vib(20);
  floatText(L, p.x, p.y - 150, 'MÜKEMMEL KAÇIŞ!', '#7dff9a', 24); p.sup = Math.min(100, p.sup + 14); styleAdd(L, 18); p.inv = Math.max(p.inv, .35);
  if (e && !e.dead && !e.T.boss){ e.stun = Math.max(e.stun, .5); }
}

/* ---------- bitirici ---------- */
function finTarget(L, p){
  let best = null, bd = 1e9;
  for (const e of L.ents){ if (e.dead || e.dummy || !(e.dizzy > 0) || e.down > 0 || e.grabbedBy || !sameLevel(e, p)) continue; const d = Math.abs(e.x - p.x); if (d < 100 && d < bd){ bd = d; best = e; } }
  return best;
}
function startFinisher(L, p, e){
  p.face = e.x >= p.x ? 1 : -1; p.atk = { m:{ dur:1.05, a:0, b:0, special:'finisher', anim:'punch', heavy:true }, t:0, hit:new Set(), e, stage:0 };
  p.inv = 1.3; p.vx = 0; e.dizzy = Math.max(e.dizzy, 1.2); e.inv = 0; e.face = -p.face; e.wind = 0; e.strike = 0;
  L.finT = 1.15; L.finE = e; FX.zoom = 1.12; FX.zx = (p.x + e.x) / 2; FX.zy = e.y - 90; SFX.anticip ? SFX.anticip() : SFX.whoosh && SFX.whoosh(); vib(20);
  grunt(p.mk === 'ufis' ? 'ufis' : 'issem', 'a', .28, 1.1);
}
function finisherTick(L, p, a, dt){
  const e = a.e, m = a.m; p.vx = 0;
  if (!e || e.dead){ if (a.t > .3) a.t = m.dur; return; }
  // rakibi önümüzde tut
  e.x = lerp(e.x, p.x + p.face * 62, Math.min(1, dt * 10)); FX.zx = (p.x + e.x) / 2; FX.zy = e.y - 90; FX.zoom = Math.max(FX.zoom, 1.12 + a.t * .12);
  const boss = e.T && e.T.boss, base = Math.round((p.mk === 'issem' ? 10 : 12) * (p.mk === 'issem' ? .85 + PST('guc') * .4 : 1));
  const calm = () => { e.dizzy = 1; e.stun = 0; e.vx = 0; e.wind = 0; e.strike = 0; e.armorT = 0; e.hits = 0; e.hitT = 0; e.dashing = 0; };
  if (a.stage === 0 && a.t > .12){ a.stage = 1; m.anim = 'punch'; calm(); hitEnemy(L, e, base, 0, p.face, { heavy:true }); calm(); }
  else if (a.stage === 1 && a.t > .34){ a.stage = 2; m.anim = 'upper'; calm(); hitEnemy(L, e, base + 3, 0, p.face, { heavy:true }); calm(); }
  else if (a.stage === 2 && a.t > .6){ a.stage = 3; m.anim = 'flykick'; p.vy = -380; p.onGround = false;
    const dmg = boss ? Math.round(e.maxhp * .16) : e.hp + 50;
    calm(); e.dizzy = 0; slowMo(e.x, e.y - 80, .9); FX.flash = .5; hitstop = .18; shake = 18; SFX.crunch(); SFX.punchHeavy();
    hitEnemy(L, e, dmg, 620, p.face, { heavy:true, down:true, launch:!boss, finisher:true, super:true });
    floatText(L, e.x, e.y - 190, boss ? 'AĞIR DARBE!' : 'BİTİRDİ!', '#f2c230', 40); p.sup = Math.min(100, p.sup + 20);
    say(pick(['Bitirici!', 'Ne vuruş ama!', 'Muhteşem!']), 'Spiker'); }
}
