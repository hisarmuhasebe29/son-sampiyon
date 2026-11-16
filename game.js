'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   game.js
   akış · giriş · kapak · ara sahneler · bölüm sonu · güncelleme · ana döngü
   ========================================================= */
let cur = null, curCh = 1, curI = 0, stats = null;
const SKIP_BTN = { x: W - 112, y: 10, w: 100, h: 34, size: 16 };
const newStats = () => ({ dmg:0, lvls:0, retries:0, tackles:0, ranks:[] });

/* ---------- akış ---------- */
function startChapter(ch, i = 0){ if (MP.on && MP.role === 'guest') return; curCh = ch; curI = i; stats = newStats(); runNode(); }
function runNode(){
  if (MP.on){ mpRunNode(); return; }
  const C = CHAPTERS[curCh - 1];
  if (curI >= C.flow.length){ endChapter(); return; }
  SAVE.cur = { ch:curCh, i:curI }; persist();
  const n = C.flow[curI]; FX.ts = 1; FX.zoom = 1; FX.flash = 0; hush();
  if (n.cut){ cur = Cut(n.cut); showControls(null); }
  else if (n.lvl){ cur = Level(LEVELS[n.lvl]); }
  else if (n.match){ cur = R3.init() ? Match3D(n.match) : Match(n.match); }
  else if (n.set){ cur = R3.init() ? SetPiece3D(n.set) : SetPiece(n.set); }
}
function next(){ if (MP.on){ mpNext(); return; } curI++; runNode(); }
function endChapter(){
  if (MP.on && MP.role === 'guest') return;
  if (MP.on && MP.peerStats){ const q = MP.peerStats; stats.retries += q.retries || 0; stats.dmg += q.dmg || 0; stats.lvls += q.lvls || 0; stats.tackles += q.tackles || 0; stats.ranks = stats.ranks.concat(q.ranks || []); MP.peerStats = null; }
  const avg = stats.lvls ? stats.dmg / stats.lvls : 0;
  const reasons = [];
  if (stats.retries > 0) reasons.push('−1 ★  Bir bölümde yenilip tekrar denedin (' + stats.retries + ' kez). İpucu: kırmızı yanan düşmana 🛡️ blok, şok dalgasına ⬆ zıpla.');
  if (avg > .5) reasons.push('−1 ★  Çok hasar aldın (ortalama canının %' + Math.round(avg * 100) + '\'ini kaybettin). İpucu: kombo yap, sersemleyen düşmanı bitir, can şişelerini topla.');
  if (stats.tackles > 3) reasons.push('Maçlarda topu ' + stats.tackles + ' kez kaptırdın. İpucu: rakip kırmızı yanınca ⬆ zıpla ya da 💨 çalım at.');
  let st = 3 - (stats.retries > 0 ? 1 : 0) - (avg > .5 ? 1 : 0); st = Math.max(1, st);
  const before = SAVE.stars[curCh] || 0, coins = awardCoins(curCh, st, before);
  SAVE.stars[curCh] = Math.max(before, st);
  SAVE.maxCh = Math.max(SAVE.maxCh, Math.min(10, curCh + 1));
  SAVE.cur = curCh < 10 ? { ch:curCh + 1, i:0 } : null; persist();
  showControls(null);
  if (MP.on) netSend({ t:'end', r:1, ch:curCh, st, reasons, ranks:stats.ranks.slice() });
  cur = ChapterEnd(curCh, st, reasons, stats.ranks.slice(), coins);
}
function toCover(){ if (MP.inRoom && !MP.leaving){ MP.leaving = true; mpLeave(); MP.leaving = false; } showControls(null); crowdAmb(false); hush(); cur = Cover(); }
function fs(){ try { const d = document.documentElement; if (d.requestFullscreen && !document.fullscreenElement) d.requestFullscreen().catch(() => {});
  if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch(e){} }

/* =========================================================
   GİRİŞ — ARAÇ (patlama sesiyle)
   ========================================================= */
function Splash(){
  const S = { t:0 };
  S.update = dt => { S.t += dt; if (tap){ fs(); audioInit(); unlockSpeech(); cur = Intro(); } };
  S.draw = c => {
    c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);
    c.globalAlpha = .6 + Math.sin(S.t * 4) * .4; txt(c, '▶  Başlamak için dokunun', 480, 270, 30, '#f2c230', 'center'); c.globalAlpha = 1;
    txt(c, '🔊 Sesi açın · 📱 Telefonu yan tutun', 480, 320, 18, 'rgba(255,255,255,.6)', 'center', 'normal');
  };
  return S;
}
let LOGO = null;
function Intro(){
  const I = { t:0, sparks:[], rings:[] };
  if (!LOGO){ const o = document.createElement('canvas'); o.width = 760; o.height = 240; const c = o.getContext('2d'); c.font = 'italic 900 170px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; LOGO = { o, c }; }
  swoosh(.8, .45, 0, 200, 6000); swoosh(.6, .35, .3, 300, 5000);
  [0, 1, 2, 3].forEach(i => { tone(160 + i * 30, .3, 'square', .08, -60, .86 + i * .16); noise(.1, .35, .86 + i * .16, 0, 1600); });
  [110, 165, 220, 277, 330].forEach((f, i) => tone(f, 2.8, i % 2 ? 'sawtooth' : 'triangle', .05, 0, 1.6));
  swoosh(1.0, .25, 1.65, 500, 8000);
  const letters = ['A', 'R', 'A', 'Ç'];
  I.update = dt => {
    I.t += dt;
    if (I.t > .78 && !I.boom){ I.boom = true; boom(0, 1.25); shake = 18; vib([100, 40, 160]); for (let i = 0; i < 110; i++) I.sparks.push({ x:480, y:250, vx:rand(-900, 900), vy:rand(-650, 350), l:rand(.4, 1.4), c:pick(['#ffd34d', '#ff8c1a', '#ffffff']) }); I.rings.push(0); }
    for (const s of I.sparks){ s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; s.l -= dt; } I.sparks = I.sparks.filter(s => s.l > 0);
    I.rings = I.rings.map(r => r + dt).filter(r => r < .8);
    shake *= Math.pow(.01, dt);
    if (I.t > 4.9 || (tap && I.t > .4)) cur = Cover();
  };
  I.draw = c => {
    c.save(); c.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    c.fillStyle = '#000000'; c.fillRect(-20, -20, W + 40, H + 40);
    const t = I.t;
    if (t < 1.2){ for (let i = 0; i < 10; i++){ const k = clamp(t / .78, 0, 1), y = 250 + (i - 4.5) * 20 * (1 - k), a = 1 - Math.max(0, (t - .78) / .4);
        c.strokeStyle = 'rgba(242,194,48,' + (a * .9) + ')'; c.lineWidth = 3 - Math.abs(i - 4.5) * .45;
        c.beginPath(); c.moveTo(-200 + k * 680 - 300 * (i % 2), y); c.lineTo(-200 + k * 680, y); c.stroke();
        c.beginPath(); c.moveTo(1160 - k * 680 + 300 * (i % 2), y); c.lineTo(1160 - k * 680, y); c.stroke(); } }
    if (t > .74 && t < 1.15){ const a = 1 - (t - .74) / .41; c.fillStyle = 'rgba(255,240,200,' + a + ')'; c.beginPath(); c.arc(480, 250, 40 + (t - .74) * 1600, 0, 7); c.fill(); }
    for (const r of I.rings){ c.strokeStyle = 'rgba(255,200,80,' + (1 - r / .8) + ')'; c.lineWidth = 6; c.beginPath(); c.arc(480, 250, 60 + r * 700, 0, 7); c.stroke(); }
    for (const s of I.sparks){ c.fillStyle = s.c; c.globalAlpha = Math.min(1, s.l); c.fillRect(s.x, s.y, 3, 3); } c.globalAlpha = 1;
    if (t > .78){
      const lc = LOGO.c; lc.clearRect(0, 0, 760, 240);
      const g = lc.createLinearGradient(0, 40, 0, 200); g.addColorStop(0, '#fff6c8'); g.addColorStop(.5, '#f2c230'); g.addColorStop(1, '#a87400');
      const xs = [190, 330, 470, 600];
      letters.forEach((L, i) => { const lt = t - .82 - i * .16; if (lt < 0) return;
        const k = Math.min(1, lt / .32), sc = k < 1 ? 2.4 - 1.55 * k + Math.sin(k * Math.PI) * .25 : 1;
        lc.save(); lc.translate(xs[i], 125); lc.scale(sc, sc); lc.globalAlpha = Math.min(1, k * 1.5);
        lc.lineWidth = 8; lc.strokeStyle = '#3a2800'; lc.strokeText(L, 0, 0); lc.fillStyle = g; lc.fillText(L, 0, 0); lc.restore(); });
      if (t > 1.6 && t < 2.6){ const k = (t - 1.6) / 1.0; lc.save(); lc.globalCompositeOperation = 'source-atop';
        const sx = -200 + k * 1160; const sg = lc.createLinearGradient(sx - 80, 0, sx + 80, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.95)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        lc.fillStyle = sg; lc.transform(1, 0, -.35, 1, 0, 0); lc.fillRect(sx - 80, 0, 160, 240); lc.restore(); }
      c.drawImage(LOGO.o, 480 - 380, 250 - 125);
      if (t > 1.85){ const a = Math.min(1, (t - 1.85) / .6);
        c.globalAlpha = a; c.fillStyle = '#f2c230'; c.fillRect(250, 372, 140 * a, 2); c.fillRect(710 - 140 * a, 372, 140 * a, 2);
        txt(c, 'O Y U N   S T Ü D Y O S U', 480, 380, 22, '#ffffff', 'center'); c.globalAlpha = 1; }
    }
    c.restore();
    if (t > 4.1){ c.fillStyle = 'rgba(0,0,0,' + Math.min(1, (t - 4.1) / .7) + ')'; c.fillRect(0, 0, W, H); }
  };
  return I;
}

/* =========================================================
   KAPAK
   ========================================================= */
function Cover(){
  const K = { t:0, msg:'' }; playMusic('menu');
  const bMain = { x:340, y:180, w:280, h:56, size:22 }, bMP = { x:340, y:242, w:280, h:46, size:19 }, bCh = { x:340, y:294, w:136, h:40, size:15 }, bSk = { x:484, y:294, w:136, h:40, size:15 }, bDiff = { x:340, y:340, w:280, h:38, size:16 },
    bMus = { x:340, y:384, w:136, h:40, size:15 }, bVox = { x:484, y:384, w:136, h:40, size:15 }, bUpd = { x:796, y:496, w:154, h:32, size:13 }, bPl = { x:796, y:452, w:154, h:38, size:15 };
  K.update = dt => { K.t += dt;
    if (!tap) return;
    if (inB(bMain, tap) || tap.key){ SFX.whistle(); fs(); const s = SAVE.cur; if (!SAVE.player){ cur = Creator(() => startChapter(1)); return; } if (s && (s.ch > 1 || s.i > 0)) startChapter(s.ch, s.i); else startChapter(1); }
    else if (inB(bPl, tap)){ SFX.click(); cur = Creator(); }
    else if (inB(bMP, tap)){ SFX.click(); fs(); cur = Lobby(); }
    else if (K.chip && inB(K.chip, tap)){ SFX.click(); cur = ProfileScreen(); }
    else if (inB(bCh, tap)){ SFX.click(); cur = ChapterSelect(); }
    else if (inB(bSk, tap)){ SFX.click(); fs(); if (!SAVE.player){ cur = Creator(() => { cur = SkillMenu(); }); return; } cur = SkillMenu(); }
    else if (inB(bDiff, tap)){ SAVE.diff = (SAVE.diff + 1) % 3; persist(); SFX.click(); }
    else if (inB(bMus, tap)){ SAVE.music = SAVE.music ? 0 : 1; persist(); SFX.click(); if (SAVE.music){ MUSIC.kind = null; playMusic('menu'); } else stopMusic(); }
    else if (inB(bVox, tap)){ SAVE.voice = SAVE.voice ? 0 : 1; persist(); SFX.click(); if (SAVE.voice){ unlockSpeech(); setTimeout(() => say('Dublaj açık.', 'Spiker'), 150); } else hush(); }
    else if (inB(bUpd, tap)){ SFX.click(); UPDATE_MSG = 'Kontrol ediliyor…'; checkVersion(true); }
  };
  K.draw = c => {
    const D3 = R3.side(540, { bright:true }), b = D3 ? R3.bgFrom(c) : c;
    bgBright(b, K.t);
    const fade = b.createLinearGradient(0, 0, 0, H); fade.addColorStop(0, 'rgba(255,255,255,0)'); fade.addColorStop(.75, 'rgba(255,255,255,0)'); fade.addColorStop(1, 'rgba(230,238,246,.6)'); b.fillStyle = fade; b.fillRect(0, 0, W, H);
    // kahramanlar: Issem önde sevinç çığlığı, Ufis arkada dövüş duruşu
    const Pi = getPose({ animT:K.t, pose:'cheer' }); Pi.fa = [2.0 + Math.sin(K.t * 2) * .05, 2.6]; Pi.ba = [.9, 2.3]; Pi.lean = -6;
    drawHuman(c, 210, 560, LOOK.issem, Pi, 1, 2.75, 1, null, 'shout');
    drawHuman(c, 785, 548, LOOK.ufis, getPose({ animT:K.t + 1, pose:'guard' }), -1, 2.45, 1, null, 'angry');
    drawBall(c, 330, 512, K.t * 3, 1.5);
    aracBadge(c, 48, 44, 32);
    c.font = 'italic 900 86px ' + FONT; c.textAlign = 'center'; c.lineJoin = 'round';
    c.lineWidth = 16; c.strokeStyle = '#ffffff'; c.strokeText('SON ŞAMPİYON', 480, 120);
    c.lineWidth = 5; c.strokeStyle = '#0b0f1a'; c.strokeText('SON ŞAMPİYON', 480, 120);
    const tg = c.createLinearGradient(0, 50, 0, 122); tg.addColorStop(0, '#2a2f3a'); tg.addColorStop(.55, '#0b0f1a'); tg.addColorStop(1, '#14306b'); c.fillStyle = tg; c.fillText('SON ŞAMPİYON', 480, 120); c.textAlign = 'left';
    txt(c, 'Birinde saha, diğerinde savaş alanı. İkisinde de şampiyonluk mücadelesi!', 480, 158, 17, '#14306b', 'center', 'italic 900', 0, 640);
    const s = SAVE.cur, cont = s && (s.ch > 1 || s.i > 0);
    button(c, bMain, cont ? '▶  TEK OYUNCULU · Bölüm ' + s.ch : '▶  TEK OYUNCULU', true, K.t);
    button(c, bMP, '👥  ÇOK OYUNCULU');
    button(c, bCh, '📖 BÖLÜMLER'); button(c, bSk, '🎯 ANTRENMAN');
    button(c, bDiff, 'Zorluk: ' + DIFF().name + '  ⟳');
    button(c, bMus, (SAVE.music ? '🎵 Müzik: Açık' : '🔇 Müzik: Kapalı'));
    button(c, bVox, (SAVE.voice ? '🗣 Dublaj: Açık' : '🤐 Dublaj: Kapalı'));
    if (SAVE.voice && VOICE_OK === false) txt(c, 'Bu telefonda Türkçe ses bulunamadı — yazı sesi çalar. (Ayarlar › Metin okuma › Türkçe ses indir)', 480, 438, 12, '#ffcc66', 'center', 'bold', 3, 600);
    button(c, bUpd, '⟳ Güncelle · ' + VERSION);
    button(c, bPl, '👤 Karakterler');
    K.chip = profileChip(c, 728, 8);
    if (UPDATE_MSG) pill(c, UPDATE_MSG, 480, 448, 16, 'rgba(0,0,0,.7)', '#7dff9a');
  };
  return K;
}
function ChapterSelect(){
  const S = { t:0 }; const back = { x:20, y:16, w:120, h:40, size:18 };
  const cards = CHAPTERS.map((C, i) => ({ x:40 + (i % 5) * 180, y:110 + Math.floor(i / 5) * 190, w:164, h:172, n:i + 1 }));
  S.update = dt => { S.t += dt; if (!tap) return;
    if (inB(back, tap)){ toCover(); return; }
    for (const k of cards) if (inB(k, tap)){ if (k.n <= SAVE.maxCh){ SFX.whistle(); fs(); startChapter(k.n); } else SFX.block(); } };
  S.draw = c => {
    bgSehir(c, S.t); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H);
    txt(c, 'BÖLÜMLER', 480, 58, 34, '#f2c230', 'center', 'italic 900', 6);
    button(c, back, '◀ Geri');
    for (const k of cards){ const open = k.n <= SAVE.maxCh, C = CHAPTERS[k.n - 1];
      c.fillStyle = open ? 'rgba(20,48,107,.92)' : 'rgba(40,40,50,.85)'; rr(c, k.x, k.y, k.w, k.h, 14); c.fill();
      c.strokeStyle = open ? '#f2c230' : '#555555'; c.lineWidth = 2; c.stroke();
      txt(c, String(k.n), k.x + k.w / 2, k.y + 52, 42, open ? '#f2c230' : '#777777', 'center', '900');
      c.font = fnt(15); wrap(c, C.title, k.w - 20).forEach((l, j) => txt(c, l, k.x + k.w / 2, k.y + 86 + j * 19, 15, open ? '#ffffff' : '#888888', 'center', 'bold', 0, k.w - 14));
      if (!open) txt(c, '🔒', k.x + k.w / 2, k.y + 150, 24, '#ffffff', 'center');
      else { const st = SAVE.stars[k.n] || 0; for (let j = 0; j < 3; j++){ c.fillStyle = j < st ? '#f2c230' : 'rgba(255,255,255,.2)'; drawStar(c, k.x + k.w / 2 - 28 + j * 28, k.y + 146, 11); } } }
  };
  return S;
}
function ChapterEnd(n, st, reasons, ranks, coins){
  const E = { t:0 }; if (coins) setTimeout(() => SFX.coin(), 900); const bNext = { x:270, y:452, w:200, h:52 }, bMenu = { x:490, y:452, w:200, h:52, size:20 };
  SFX.win(); playMusic(n >= 10 ? 'final' : 'menu'); say('Bölüm ' + n + ' tamamlandı. ' + st + ' yıldız.', 'Spiker');
  E.update = dt => { E.t += dt;
    if (MP.on){ if (MP.role === 'guest'){ if (tap && inB(bMenu, tap)) toCover(); else if (tap) netSend({ t:'tap', r:1 }); return; }
      const rt = MP.remoteTaps.shift(); if (!tap && (rt || E.t > 10) && E.t > 1.2) tap = { x:bNext.x + 5, y:bNext.y + 5, key:true }; }
    if (!tap || E.t < 1.2) return;
    if (inB(bMenu, tap)) toCover();
    else if (inB(bNext, tap) || tap.key){ if (n >= 10){ if (MP.on){ netSend({ t:'credits', r:1 }); MP.credits = true; } cur = Credits(); } else startChapter(n + 1); } };
  E.draw = c => {
    bgSehir(c, E.t); c.fillStyle = 'rgba(0,0,0,.66)'; c.fillRect(0, 0, W, H);
    txt(c, 'BÖLÜM ' + n + ' TAMAMLANDI', 480, 70, 42, '#f2c230', 'center', 'italic 900', 6, 860);
    txt(c, CHAPTERS[n - 1].title, 480, 104, 20, '#ffffff', 'center');
    for (let j = 0; j < 3; j++){ const k = clamp((E.t - .4 - j * .3) / .3, 0, 1); const sc = k < 1 ? k * 1.3 : 1;
      c.save(); c.translate(400 + j * 80, 158); c.scale(sc, sc); c.fillStyle = j < st ? '#f2c230' : 'rgba(255,255,255,.18)'; drawStar(c, 0, 0, 28); c.restore();
      if (k > 0 && k < .2 && j < st && !E['s' + j]){ E['s' + j] = true; tone(880 + j * 220, .15, 'triangle', .12); } }
    if (ranks.length) txt(c, 'Dereceler: ' + ranks.join(' · '), 480, 212, 17, '#9ad7ff', 'center', 'bold', 0, 800);
    if (coins && E.t > .9){ const k = Math.min(1, (E.t - .9) * 3); c.globalAlpha = k; pill(c, '+' + coins + ' 🪙 oyun parası kazandın!  (toplam ' + prof().coins + ')', 780, 158, 15, 'rgba(242,194,48,.95)', '#14306b'); c.globalAlpha = 1; }
    let y = 244;
    if (st === 3) { txt(c, 'Kusursuz! Hiç yenilmeden ve az hasarla bitirdin.', 480, y, 18, '#7dff9a', 'center', 'bold', 0, 860); y += 30; }
    else { txt(c, 'Neden ' + st + ' yıldız?', 480, y, 18, '#ffcc66', 'center', 'bold'); y += 26;
      c.font = fnt(15, 'normal'); for (const r of reasons) for (const l of wrap(c, r, 820)){ txt(c, l, 480, y, 15, '#ffffff', 'center', 'normal'); y += 21; } y += 6; }
    const C = CHAPTERS[n - 1];
    if (C.teaser && E.t > 1){ txt(c, 'Gelecek Bölüm: ' + C.teaser[0], 480, Math.max(y + 18, 360), 19, '#ffffff', 'center', 'bold', 0, 860);
      c.font = fnt(16, 'italic'); wrap(c, C.teaser[1], 760).forEach((l, i) => txt(c, l, 480, Math.max(y + 18, 360) + 26 + i * 21, 16, '#c8d3ff', 'center', 'italic')); }
    if (E.t > 1.2){ button(c, bNext, n >= 10 ? 'FİNAL ▶' : 'DEVAM ▶', true, E.t); button(c, bMenu, 'Ana Menü'); }
  };
  return E;
}
function Credits(){
  const R = { t:0 }; SFX.win(); playMusic('final');
  const lines = [['SON ŞAMPİYON', 54, '#f2c230'], ['İlk Film Tamamlandı!', 28, '#ffffff'], ['', 20], ['Yapım', 18, '#9aa4c4'], ['ARAÇ OYUN STÜDYOSU', 30, '#f2c230'], ['', 20],
    ['Hikâye ve Senaryo', 18, '#9aa4c4'], ['ARAÇ', 26, '#ffffff'], ['', 20], ['Karakterler', 18, '#9aa4c4'], ['Issem · Ufis · Leo · Usta', 24, '#ffffff'], ['Narak · Yardımcı · Lider', 24, '#ffffff'], ['', 30],
    ['DEVAM EDECEK...', 40, '#ff5a5a'], ['İkinci filmde Issem ve Ufis, şimdiye kadar', 20, '#c8d3ff'], ['karşılaştıkları en büyük tehditle yüzleşecek!', 20, '#c8d3ff']];
  R.update = dt => { R.t += dt; if (tap && R.t > 2) toCover(); };
  R.draw = c => {
    c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);
    let y = H + 40 - R.t * 45; if (y < -40 * lines.length + 300) y = -40 * lines.length + 300;
    for (const [s, sz, col] of lines){ if (s) txt(c, s, 480, y, sz, col || '#ffffff', 'center', sz > 30 ? 'italic 900' : 'bold'); y += sz + 22; }
    tapHint(c, 480, 515, R.t > 2, 'Ana menü için dokun');
  };
  return R;
}

/* =========================================================
   ARA SAHNE — animasyonlu, dublajlı
   ========================================================= */
function Cut(def){
  const C = { t:0, i:-1, typed:0, lt:0, line:null, dark:0, flash:0, blipT:0, conf:[], seqI:0, cam:{ x:def.camX || 0, tx:def.camX || 0 }, zoom:{ z:def.zoom || 1, tz:def.zoom || 1 },
    st: { screen:def.screen || null, door:!!def.door, doorK:def.door ? 1 : 0, minute:def.minute || '', score:def.score || null, teams:def.teams || null, sepia:!!def.sepia,
          alarm:!!def.alarm, car:def.car || 0, bigscreen:def.bigscreen || null, crowdOn:def.crowdOn !== false, cheer:!!def.cheer, keypad:'idle', speakT:0, offT:null, worldW:def.worldW || W },
    actors: (def.actors || []).map(a => Object.assign({ animT: Math.random() * 3, vx:0, onGround:true, e0:a.e || 'neutral' }, a)) };
  if (def.bg === 'stad') for (const a of C.actors){ if (a.s == null) a.s = .8; if (a.y == null) a.y = 485; }
  playMusic(def.music || 'story');
  if (def.bg === 'stad' || def.bg === 'stadDis' || def.bg === 'tunelCikis') crowdAmb(true, def.bg === 'stadDis' ? .16 : .1); else crowdAmb(false);
  const actor = id => C.actors.find(a => a.id === id);
  const textOf = ln => nmz(ln.item ? (ln.n || '') : (ln.t || ln.n || ln.msg || ''));
  function applyProps(a, p){
    if (!a || !p) return;
    for (const k in p){
      if (k === 'takeout'){ a.hold = null; a.act = { pose:'pocket', t:0, dur:.5, then:{ hold:p.takeout, pose:p.takeout === 'phone' ? 'phone' : 'show' } }; SFX.grab(); }
      else if (k === 'act'){ a.act = Object.assign({ t:0, dur:.35 }, p.act); if (p.act.sfx && SFX[p.act.sfx]) SFX[p.act.sfx](); }
      else if (k === 'fall'){ a.pose = 'lie'; a.fallV = p.fall * 340; a.act = null; SFX.punchHeavy(); shake = Math.max(shake, 6); }
      else if (k === 'e'){ a.e = p.e; a.e0 = p.e; }
      else a[k] = p[k];
    }
  }
  function setScreen(v){ if (v === 'off' && C.st.screen && C.st.screen !== 'off'){ C.st.offT = 0; SFX.screenOff(); } C.st.screen = v; }
  function applyTarget(tg, p){
    if (tg === 'st'){ for (const k in p){ if (k === 'screen') setScreen(p.screen); else C.st[k] = p[k]; } if (p.keypad === 'type') SFX.keypad(); if (p.keypad === 'err') SFX.keyErr(); if (p.door === true) SFX.door(); if (p.door === false) SFX.doorClose(); }
    else if (tg === 'sfx'){ (SFX[p] || (() => {}))(); }
    else if (tg === 'cam') C.cam.tx = p;
    else if (tg === 'zoom') C.zoom.tz = p;
    else if (tg === 'fx') doFx([].concat(p));
    else applyProps(actor(tg), p);
  }
  function doFx(fx){
    for (const f of fx){
      if (f === 'dark'){ C.dark = 1; SFX.power(); vib(120); }
      if (f === 'light'){ C.dark = 0; C.flash = 1; }
      if (f === 'door'){ C.st.door = true; SFX.door(); }
      if (f === 'doorClose'){ C.st.door = false; SFX.doorClose(); }
      if (f === 'alarm'){ C.st.alarm = true; SFX.alarm(); vib([100, 80, 100]); }
      if (f === 'alarmOff') C.st.alarm = false;
      if (f === 'sepia') C.st.sepia = true;
      if (f === 'nosepia') C.st.sepia = false;
      if (f === 'shake'){ shake = 12; SFX.punchHeavy(); vib(90); }
      if (f === 'flash'){ C.flash = 1; SFX.punch(); }
      if (f === 'cheer'){ C.st.cheer = true; SFX.roar(2); }
      if (f === 'speaker'){ C.st.speakT = 3; SFX.speaker(); }
      if (f === 'confetti'){ for (let i = 0; i < 140; i++) C.conf.push({ x:rand(0, W), y:rand(-300, 0), vy:rand(60, 160), vx:rand(-30, 30), r:rand(0, 6), c:pick(['#f2c230', '#14306b', '#ffffff', '#ff5a5a']) }); }
    }
  }
  function nextLine(){
    C.i++; if (C.i >= def.lines.length){ hush(); if (!(MP.on && MP.role === 'guest')) next(); return; }
    if (MP.on && MP.role === 'host') netSend({ t:'line', r:1, ch:curCh, i:curI, li:C.i });
    const ln = C.line = def.lines[C.i]; C.typed = 0; C.lt = 0; C.seqI = 0;
    for (const a of C.actors){ a.talking = false; a.e = a.e0; }
    if (ln.set) for (const id in ln.set) applyTarget(id, ln.set[id]);
    if (ln.show) ln.show.forEach(id => { const a = actor(id); if (a) a.hidden = false; });
    if (ln.hide) ln.hide.forEach(id => { const a = actor(id); if (a) a.hidden = true; });
    C.speaker = null;
    if (ln.who && SPEAKERS[ln.who] && SPEAKERS[ln.who].look){ const a = C.actors.find(x => x.look === SPEAKERS[ln.who].look && !x.hidden); if (a){ C.speaker = a; if (ln.e) a.e = ln.e; } }
    if (ln.fx) doFx([].concat(ln.fx));
    if (ln.screen !== undefined) setScreen(ln.screen);
    if (ln.bigscreen !== undefined){ if (ln.bigscreen === 'off' && C.st.bigscreen && C.st.bigscreen !== 'off'){ C.st.offT = 0; SFX.screenOff(); } C.st.bigscreen = ln.bigscreen; }
    if (ln.min) C.st.minute = ln.min;
    if (ln.score) C.st.score = ln.score;
    if (ln.cam != null) C.cam.tx = ln.cam;
    if (ln.zoom != null) C.zoom.tz = ln.zoom;
    if (ln.msg || ln.call){ SFX.msg(); vib([40, 60, 40]); }
    if (ln.callCut){ SFX.static(); }
    if (ln.big){ shake = 8; if (ln.sfx === undefined) SFX.punchHeavy(); }
    if (ln.sfx && SFX[ln.sfx]) SFX[ln.sfx]();
    // dublaj
    const spoken = ln.card ? (ln.card + (ln.sub ? '. ' + ln.sub : '')) : ln.big ? ln.big : ln.msg ? ln.msg : ln.call ? ln.t : textOf(ln);
    C.spoke = false; if (spoken) C.spoke = say(spoken, ln.big ? 'Spiker' : ln.call ? ln.who : (ln.who || 'narr'));
  }
  nextLine();
  C.mpLine = li => { while (C.i < li && C.i < def.lines.length - 1){ const ln = C.line; if (ln && ln.seq) while (C.seqI < ln.seq.length){ const s = ln.seq[C.seqI++]; applyTarget(s[1], s[2]); } nextLine(); } };
  C.update = dt => {
    if (MP.on){ if (MP.role === 'guest'){ if (tap){ netSend({ t:'tap', r:1, skip:inB(SKIP_BTN, tap) && !tap.key ? 1 : 0 }); tap = null; } }
      else { const rt = MP.remoteTaps.shift(); if (rt && !tap) tap = rt.skip ? { x:SKIP_BTN.x + 4, y:SKIP_BTN.y + 4 } : { x:480, y:300, key:true }; } }
    C.t += dt; C.lt += dt; if (C.flash > 0) C.flash -= dt * 1.5; if (C.st.speakT > 0) C.st.speakT -= dt; if (C.st.offT != null) C.st.offT += dt;
    C.st.doorK = clamp(C.st.doorK + (C.st.door ? 1 : -1) * dt * 2.4, 0, 1);
    C.cam.x = lerp(C.cam.x, C.cam.tx, Math.min(1, dt * 2.2)); C.zoom.z = lerp(C.zoom.z, C.zoom.tz, Math.min(1, dt * 1.6));
    const ln = C.line; if (!ln) return;
    if (ln.seq) while (C.seqI < ln.seq.length && C.lt >= ln.seq[C.seqI][0]){ const s = ln.seq[C.seqI++]; applyTarget(s[1], s[2]); }
    for (const a of C.actors){ a.animT += dt;
      if (a.act){ a.act.t += dt; if (a.act.t >= a.act.dur){ const th = a.act.then; a.act = null; if (th) applyProps(a, th); } }
      if (a.fallV){ a.x += a.fallV * dt; a.fallV *= Math.pow(.02, dt); if (Math.abs(a.fallV) < 5) a.fallV = 0; }
      if (a.patrol && a.tx == null && !a.hidden){ a.tx = a.x < (a.patrol[0] + a.patrol[1]) / 2 ? a.patrol[1] : a.patrol[0]; a.speed = 60; }
      if (a.tx != null){ const d = a.tx - a.x;
        if (Math.abs(d) > 3){ a.vx = Math.sign(d) * (a.speed || 150); a.face = Math.sign(d); a.x += a.vx * dt; a.run = (a.speed || 150) > 220; if (Math.abs(a.tx - a.x) < 3) a.x = a.tx; }
        else { a.vx = 0; a.tx = null; if (a.faceTo) a.face = a.faceTo; if (a.hideAt){ a.hidden = true; if (a.closeDoor){ C.st.door = false; SFX.doorClose(); } } } } }
    for (const q of C.conf){ q.y += q.vy * dt; q.x += q.vx * dt + Math.sin(C.t * 3 + q.r) * .5; q.r += dt * 4; }
    const full = textOf(ln).length;
    if (C.typed < full){ C.typed = Math.min(full, C.typed + dt * 40); C.blipT -= dt; if (C.blipT <= 0 && (!SAVE.voice || !voiceAvailable() || !C.spoke)){ SFX.type(); C.blipT = rand(.045, .075); } }
    if (C.speaker) C.speaker.talking = C.typed < full || SPEAKING;
    if (tap && C.lt > .15){
      if (inB(SKIP_BTN, tap) && !tap.key){ hush(); next(); return; }
      if (C.typed < full) C.typed = full;
      else { if (ln.seq) while (C.seqI < ln.seq.length){ const s = ln.seq[C.seqI++]; applyTarget(s[1], s[2]); } nextLine(); } }
  };
  C.draw = c => {
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    c.save();
    if (C.zoom.z !== 1){ c.translate(480, 300); c.scale(C.zoom.z, C.zoom.z); c.translate(-480, -300); }
    c.translate(sx, sy);
    C.st.camX = C.cam.x;
    const D3 = R3.side(GROUND, { dark:def.bg === 'gizli' || C.st.alarm });
    drawBg(D3 ? R3.bgFrom(c) : c, def.bg, C.st, C.t);
    c.translate(-Math.round(C.cam.x), def.noLift ? 0 : -74);            // karakterler yazı kutusunun üstünde kalsın
    if (D3){ R3.ground(scrY(c, GROUND)); if (C.st.sepia) R3.filter('sepia(.85) saturate(.8)'); }
    const list = C.actors.filter(a => !a.hidden).sort((a, b) => (a.y || GROUND) - (b.y || GROUND));
    for (const a of list){ const ex = a.e || 'neutral';
      if (D3){} else if (a.pose === 'lie' || a.fallV){ c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(a.x - (a.face || 1) * 50, (a.y || GROUND) + 2, 60 * (a.s || 1), 6, 0, 0, 7); c.fill(); }
      else { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(a.x, (a.y || GROUND) + 3, 24 * (a.s || 1), 5, 0, 0, 7); c.fill(); }
      drawHuman(c, a.x, a.y || GROUND, LOOK[a.look], getPose(a), a.face, a.s || 1, a.alpha || 1, null, ex, !!a.talking, a.trophy && D3 ? 'trophy' : a.hold || null);
      if (a.pose === 'lie' && a.stars){ const hp2 = headPos(Object.assign({ down:1 }, a), a.s || 1); dizzyStars(c, hp2[0], hp2[1] - 6, gameTime, 3, 16); }
      if (a.trophy && !D3){ const hx = a.x + a.face * 3, hy = (a.y || GROUND) - 172 * (a.s || 1); c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(hx - 16, hy); c.lineTo(hx + 16, hy); c.lineTo(hx + 7, hy + 26); c.lineTo(hx - 7, hy + 26); c.fill(); c.fillRect(hx - 3, hy + 26, 6, 8); c.fillRect(hx - 10, hy + 32, 20, 5); } }
    if (def.ball) drawBall(c, def.ball[0], def.ball[1], C.t * 2, .8);
    c.restore();
    vignette(c, .3);
    if (C.st.sepia){ c.globalCompositeOperation = 'color'; c.fillStyle = '#9a7040'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    for (const q of C.conf){ c.fillStyle = q.c; c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillRect(-4, -2, 8, 4); c.restore(); }
    if (C.dark){ c.fillStyle = 'rgba(0,0,0,.94)'; c.fillRect(0, 0, W, H); }
    if (C.flash > 0){ c.fillStyle = 'rgba(255,255,255,' + Math.max(0, C.flash) + ')'; c.fillRect(0, 0, W, H); }
    const ln = C.line; if (!ln) return;
    const done = C.typed >= textOf(ln).length;
    if (!ln.card) button(c, SKIP_BTN, 'ATLA ⏭');
    if (ln.card){
      c.fillStyle = 'rgba(0,0,0,.9)'; c.fillRect(0, 0, W, H);
      const a = Math.min(1, C.lt * 2.5); c.globalAlpha = a;
      txt(c, ln.card, 480, 250, 56, '#f2c230', 'center', 'italic 900', 0, 880);
      if (ln.sub) txt(c, ln.sub, 480, 302, 30, '#ffffff', 'center', 'normal', 0, 880);
      c.fillStyle = '#f2c230'; c.fillRect(480 - 120 * a, 322, 240 * a, 2);
      c.globalAlpha = 1; tapHint(c, 480, 470, true); return;
    }
    if (ln.big){
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
      const k = Math.min(1, C.lt * 3), sc = k < 1 ? 2 - k : 1 + Math.sin(C.t * 6) * .02;
      c.save(); c.translate(480, 250); c.scale(sc, sc); txt(c, ln.big, 0, 0, ln.size || 70, ln.col || '#f2c230', 'center', 'italic 900', 10, 900); c.restore();
      if (ln.n) txt(c, ln.n, 480, 320, 22, '#ffffff', 'center', 'bold', 4, 880);
      tapHint(c, 480, 470, C.lt > .5); return;
    }
    if (ln.msg || ln.call || ln.callCut){ drawPhone(c, ln, C, done); return; }
    if (ln.item) drawItem(c, ln, Math.min(1, C.lt * 3));
    if (ln.roster) drawRoster(c, C.lt);
    if (!textOf(ln)){ tapHint(c, 480, 512, true); return; }
    const bx = 30, by = 392, bw = 900, bh = 136, sp = ln.who && SPEAKERS[ln.who];
    const hasP = sp && sp.look;
    c.fillStyle = 'rgba(8,12,30,.93)'; rr(c, bx, by, bw, bh, 14); c.fill();
    c.strokeStyle = ln.who ? (sp ? sp.col : '#ffffff') : 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke();
    let tx = bx + 28;
    if (hasP){ c.save(); c.beginPath(); c.arc(bx + 70, by + 68, 52, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip();
      drawPortrait(c, bx + 70, by + 66, 34, sp.look, ln.e || 'neutral', !done || SPEAKING); c.restore();
      c.strokeStyle = sp.col; c.lineWidth = 3; c.beginPath(); c.arc(bx + 70, by + 68, 52, 0, 7); c.stroke(); tx = bx + 140; }
    if (ln.who) pill(c, ln.who, tx - 8, by - 1, 18, sp ? sp.col : '#ffffff', '#0b1020', { align:'left', r:10 });
    const fs2 = ln.who ? 25 : 23; c.font = fnt(fs2, ln.who ? 'normal' : 'italic');
    const lines = wrap(c, textOf(ln), bx + bw - tx - 30); let n = Math.floor(C.typed);
    lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n)); n -= l.length + 1; txt(c, s, tx, by + (ln.who ? 54 : 44) + i * 31, fs2, ln.who ? '#ffffff' : '#dfe6ff', 'left', ln.who ? 'normal' : 'italic'); });
    tapHint(c, bx + bw - 44, by + bh - 14, done);
  };
  return C;
}
function drawPhone(c, ln, C, done){
  c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H);
  const px = 330, py = 30, pw = 300, ph = 460;
  c.fillStyle = '#111111'; rr(c, px, py, pw, ph, 32); c.fill(); c.strokeStyle = '#333333'; c.lineWidth = 3; c.stroke();
  const red = ln.red;
  c.fillStyle = red ? '#1a0505' : '#e9edf5'; rr(c, px + 12, py + 40, pw - 24, ph - 74, 10); c.fill();
  c.fillStyle = red ? '#3a0a0a' : '#333a48'; c.fillRect(px + 12, py + 40, pw - 24, 44);
  txt(c, ln.call || ln.callCut ? '📹  Görüntülü arama' : (ln.from || '👤  Bilinmeyen Numara'), px + 26, py + 68, 16, '#ffffff', 'left', 'bold', 0, pw - 50);
  let by = py + 100;
  if (ln.call || ln.callCut){
    const vx = px + 12, vy = py + 84, vw = pw - 24, vh = 200;
    c.save(); c.beginPath(); c.rect(vx, vy, vw, vh); c.clip();
    c.fillStyle = '#2a2a30'; c.fillRect(vx, vy, vw, vh); c.fillStyle = '#3a3a40'; c.fillRect(vx, vy + vh * .7, vw, vh * .3);
    const cutK = ln.callCut ? C.lt / .9 : 0;
    if (cutK < 1){ const glitch = ln.callCut ? true : (C.t * 10 | 0) % 7 === 0;
      drawPortrait(c, vx + vw / 2 + (glitch ? rand(-10, 10) : 0), vy + 92, 54, ln.call || 'mate', 'shock', !done && !ln.callCut);
      if (glitch){ for (let i = 0; i < (ln.callCut ? 10 : 2); i++){ c.fillStyle = 'rgba(255,255,255,' + rand(.1, .4) + ')'; c.fillRect(vx, vy + rand(0, vh), vw, rand(2, 10)); } }
      if (ln.callCut && cutK > .5){ for (let i = 0; i < 400; i++){ c.fillStyle = Math.random() > .5 ? '#ffffff' : '#000000'; c.fillRect(vx + rand(0, vw), vy + rand(0, vh), 3, 3); } } }
    else { c.fillStyle = '#000000'; c.fillRect(vx, vy, vw, vh); txt(c, 'BAĞLANTI KESİLDİ', vx + vw / 2, vy + vh / 2 + 6, 18, '#ff4040', 'center', 'bold'); }
    c.restore();
    if (ln.call && ln.who) pill(c, ln.who, vx + vw / 2, vy + vh + 18, 15, '#f2c230', '#14306b');
    by = py + 330;
    if (ln.callCut){ tapHint(c, 480, 512, C.lt > .9); return; }
  }
  if (ln.photo){ c.fillStyle = '#f5f0e0'; c.fillRect(px + 70, py + 96, 160, 150); c.fillStyle = '#2a2116'; c.fillRect(px + 80, py + 106, 140, 110); drawPortrait(c, px + 150, py + 156, 34, ln.photo, 'sad'); by = py + 258; }
  c.font = fnt(19, 'normal'); const text = ln.msg || ln.t; const lines = wrap(c, text, pw - 82);
  const bh = lines.length * 25 + 22; c.fillStyle = red ? '#5a0b0b' : '#ffffff'; rr(c, px + 26, by, pw - 52, bh, 14); c.fill();
  let n = Math.floor(C.typed);
  lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n)); n -= l.length + 1; txt(c, s, px + 40, by + 28 + i * 25, 19, red ? '#ff6b6b' : '#1b1b1b', 'left', red ? 'bold' : 'normal'); });
  tapHint(c, 480, 518, done);
}

/* =========================================================
   OTOMATİK GÜNCELLEME — link ve ana ekran uygulaması birlikte
   ========================================================= */
let UPDATE_MSG = '';
async function hardUpdate(){
  UPDATE_MSG = 'Güncelleniyor…';
  try { if (window.caches){ const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } } catch(e){}
  try { if (navigator.serviceWorker){ const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); } } catch(e){}
  location.replace(location.pathname + '?u=' + Date.now());
}
async function checkVersion(manual){
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache:'no-store' });
    if (!r.ok) throw 0;
    const j = await r.json();
    if (j.v && j.v !== VERSION){
      let tried = null; try { tried = sessionStorage.getItem('ss_upd'); } catch(e){}
      if (tried !== j.v){ try { sessionStorage.setItem('ss_upd', j.v); } catch(e){} UPDATE_MSG = 'Yeni sürüm (' + j.v + ') yükleniyor…'; setTimeout(hardUpdate, 600); }
    } else if (manual){ UPDATE_MSG = 'Güncel sürümdesiniz (' + VERSION + ') ✓'; setTimeout(() => UPDATE_MSG = '', 2500); }
  } catch(e){ if (manual){ UPDATE_MSG = 'İnternet yok, sonra tekrar deneyin'; setTimeout(() => UPDATE_MSG = '', 2500); } }
}
if ('serviceWorker' in navigator){
  const hadCtrl = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadCtrl || reloaded) return; reloaded = true; location.reload(); });
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache:'none' }).then(reg => {
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible'){ reg.update().catch(() => {}); checkVersion(); } });
    }).catch(() => {});
  });
}
addEventListener('load', () => checkVersion());
if (location.search.indexOf('u=') >= 0){ try { history.replaceState(null, '', location.pathname); } catch(e){} }


/* =========================================================
   ANA DÖNGÜ
   ========================================================= */
let last = performance.now();
function loop(now){
  const rdt = Math.min(.033, (now - last) / 1000); last = now;
  if (!paused){
    for (let k = 0; k < (window.__speed || 1); k++){
      if (FX.tsT > 0){ FX.tsT -= rdt; if (FX.tsT <= 0) FX.ts = 1; }
      FX.zoom = FX.tsT > 0 ? FX.zoom : lerp(FX.zoom, 1, Math.min(1, rdt * 4)); if (FX.flash > 0) FX.flash -= rdt * 1.2;
      const dt = rdt * FX.ts;
      gameTime += dt;
      if (MP.lostT > 0 && tap && inB(MP_QUIT, tap)){ mpLeave('Çok oyunculu oyundan çıkıldı.'); tap = null; }
      if (hitstop > 0) hitstop -= rdt; else cur.update(dt);
      if (k === 0) mpTick(rdt);
      shake *= Math.pow(.004, rdt); if (shake < .3) shake = 0;
      if (k === 0) tap = null;
    }
  }
  tap = null;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  R3.begin(); cur.draw(ctx); R3.end(); mpOverlay(ctx);
  requestAnimationFrame(loop);
}
stats = newStats();
cur = Intro();
requestAnimationFrame(loop);
window.__sim = sec => { for (let i = 0; i < sec * 60; i++){ if (window.__bot) window.__bot(); gameTime += 1 / 60; if (hitstop > 0) hitstop -= 1 / 60; else cur.update(1 / 60); tap = null; } };
