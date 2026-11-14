'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   game.js  (sahneler & oynanış)
   ========================================================= */
let cur = null, curCh = 1, curI = 0, stats = null;
let shake = 0, hitstop = 0;
const PAUSE_BTN = { x: W - 52, y: 10, w: 40, h: 36 };
const SKIP_BTN = { x: W - 112, y: 10, w: 100, h: 34, size: 16 };

/* ---------- akış ---------- */
function startChapter(ch, i = 0){
  curCh = ch; curI = i; stats = { dmg:0, lvls:0, retries:0 }; runNode();
}
function runNode(){
  const C = CHAPTERS[curCh - 1];
  if (curI >= C.flow.length){ endChapter(); return; }
  SAVE.cur = { ch:curCh, i:curI }; persist();
  const n = C.flow[curI];
  if (n.cut){ cur = Cut(n.cut); showControls(null); }
  else if (n.lvl){ cur = Level(LEVELS[n.lvl]); }
  else if (n.match){ cur = Match(n.match); }
}
function next(){ curI++; runNode(); }
function endChapter(){
  const avg = stats.lvls ? stats.dmg / stats.lvls : 0;
  let st = 3 - (stats.retries > 0 ? 1 : 0) - (avg > .5 ? 1 : 0); st = Math.max(1, st);
  SAVE.stars[curCh] = Math.max(SAVE.stars[curCh] || 0, st);
  SAVE.maxCh = Math.max(SAVE.maxCh, Math.min(10, curCh + 1));
  SAVE.cur = curCh < 10 ? { ch:curCh + 1, i:0 } : null; persist();
  showControls(null);
  cur = ChapterEnd(curCh, st);
}
function toCover(){ showControls(null); cur = Cover(); }
function fs(){ try { const d = document.documentElement; if (d.requestFullscreen && !document.fullscreenElement) d.requestFullscreen().catch(() => {});
  if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch(e){} }

/* =========================================================
   GİRİŞ EKRANLARI
   ========================================================= */
function Splash(){
  const S = { t:0 };
  S.update = dt => { S.t += dt; if (tap){ fs(); audioInit(); cur = Intro(); } };
  S.draw = c => {
    c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);
    c.globalAlpha = .6 + Math.sin(S.t * 4) * .4; txt(c, '▶  Başlamak için dokunun', 480, 270, 30, '#f2c230', 'center'); c.globalAlpha = 1;
    txt(c, '🔊 Sesi açın · 📱 Telefonu yan tutun', 480, 320, 18, 'rgba(255,255,255,.6)', 'center', 'normal');
  };
  return S;
}
let LOGO = null;
function makeLogo(){
  const o = document.createElement('canvas'); o.width = 760; o.height = 240; const c = o.getContext('2d');
  c.font = 'italic 900 170px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
  return { o, c };
}
function Intro(){
  const I = { t:0, sparks:[] };
  if (!LOGO) LOGO = makeLogo();
  swoosh(.8, .4, 0); swoosh(.6, .3, .3);
  tone(48, 1.6, 'sine', .55, -10, .78); noise(.35, .4, .78);
  [0, 1, 2, 3].forEach(i => { tone(180 + i * 40, .25, 'square', .07, -60, .82 + i * .16); noise(.08, .25, .82 + i * .16, 800); });
  [110, 165, 220, 277, 330].forEach((f, i) => tone(f, 2.6, i % 2 ? 'sawtooth' : 'triangle', .06, 0, 1.55));
  swoosh(1.0, .2, 1.65);
  const letters = ['A', 'R', 'A', 'Ç'];
  I.update = dt => {
    I.t += dt;
    if (I.t > .78 && !I.boom){ I.boom = true; shake = 14; for (let i = 0; i < 70; i++) I.sparks.push({ x:480, y:250, vx:rand(-700, 700), vy:rand(-500, 300), l:rand(.4, 1.2) }); vib(80); }
    for (const s of I.sparks){ s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; s.l -= dt; }
    I.sparks = I.sparks.filter(s => s.l > 0);
    if (I.t > 4.9 || (tap && I.t > .4)) cur = Cover();
  };
  I.draw = c => {
    c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);
    const t = I.t;
    // ışık çizgileri
    if (t < 1.2){ for (let i = 0; i < 8; i++){ const k = clamp(t / .78, 0, 1), y = 250 + (i - 3.5) * 22 * (1 - k);
        const a = (1 - Math.max(0, (t - .78) / .4));
        c.strokeStyle = 'rgba(242,194,48,' + (a * .9) + ')'; c.lineWidth = 3 - Math.abs(i - 3.5) * .5;
        c.beginPath(); c.moveTo(-200 + k * 680 - 300 * (i % 2), y); c.lineTo(-200 + k * 680, y); c.stroke();
        c.beginPath(); c.moveTo(1160 - k * 680 + 300 * (i % 2), y); c.lineTo(1160 - k * 680, y); c.stroke(); } }
    if (t > .74 && t < 1.1){ const a = 1 - (t - .74) / .36; c.fillStyle = 'rgba(255,240,200,' + a + ')'; c.beginPath(); c.arc(480, 250, 40 + (t - .74) * 1400, 0, 7); c.fill(); }
    for (const s of I.sparks){ c.fillStyle = 'rgba(255,214,90,' + Math.min(1, s.l) + ')'; c.fillRect(s.x, s.y, 3, 3); }
    // logo
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
        c.font = 'bold 22px ' + FONT; c.textAlign = 'center'; c.fillStyle = '#ffffff';
        const s = 'O Y U N   S T Ü D Y O S U'; c.fillText(s, 480, 380); c.textAlign = 'left'; c.globalAlpha = 1; }
    }
    if (t > 4.1){ c.fillStyle = 'rgba(0,0,0,' + Math.min(1, (t - 4.1) / .7) + ')'; c.fillRect(0, 0, W, H); }
  };
  return I;
}
function Cover(){
  const K = { t:0 };
  const bMain = { x:340, y:236, w:280, h:58, size:24 }, bCh = { x:340, y:306, w:280, h:48 }, bDiff = { x:340, y:366, w:280, h:44, size:19 };
  K.update = dt => { K.t += dt;
    if (!tap) return;
    if (inB(bMain, tap) || tap.key){ SFX.whistle(); fs(); const s = SAVE.cur; if (s && (s.ch > 1 || s.i > 0)) startChapter(s.ch, s.i); else startChapter(1); }
    else if (inB(bCh, tap)){ SFX.ok(); cur = ChapterSelect(); }
    else if (inB(bDiff, tap)){ SAVE.diff = (SAVE.diff + 1) % 3; persist(); SFX.blip(); }
  };
  K.draw = c => {
    bgStad(c, K.t, { cheer:true, score:'— : —', minute:'FİNAL' });
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(5,8,25,.55)'); g.addColorStop(1, 'rgba(5,8,25,.85)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // enerji çizgisi
    c.strokeStyle = 'rgba(242,194,48,' + (.35 + .25 * Math.sin(K.t * 6)) + ')'; c.lineWidth = 3; c.beginPath();
    for (let x = 250; x <= 710; x += 20) c.lineTo(x, 470 - 120 + Math.sin(x * .07 + K.t * 12) * 10); c.stroke();
    drawHuman(c, 175, 505, LOOK.issem, getPose({ animT:K.t, pose:'guard' }), 1, 2.3, 1, null, 'angry');
    drawHuman(c, 785, 505, LOOK.ufis, getPose({ animT:K.t + 1, pose:'guard' }), -1, 2.3, 1, null, 'angry');
    drawBall(c, 250, 492, K.t * 3, 1.6);
    txt(c, 'ARAÇ', 22, 34, 22, '#f2c230', 'left', 'italic 900');
    c.font = 'italic 900 84px ' + FONT; c.textAlign = 'center'; c.lineWidth = 10; c.strokeStyle = '#000000'; c.lineJoin = 'round'; c.strokeText('SON ŞAMPİYON', 480, 128);
    const tg = c.createLinearGradient(0, 60, 0, 130); tg.addColorStop(0, '#fff6c8'); tg.addColorStop(.6, '#f2c230'); tg.addColorStop(1, '#b37a00'); c.fillStyle = tg; c.fillText('SON ŞAMPİYON', 480, 128); c.textAlign = 'left';
    txt(c, 'Birinde saha, diğerinde savaş alanı. İkisinde de şampiyonluk mücadelesi!', 480, 168, 17, '#d8e0ff', 'center', 'italic', 4);
    const s = SAVE.cur, cont = s && (s.ch > 1 || s.i > 0);
    button(c, bMain, cont ? '▶  DEVAM ET (Bölüm ' + s.ch + ')' : '▶  YENİ OYUN', true, K.t);
    button(c, bCh, '📖  BÖLÜMLER');
    button(c, bDiff, 'Zorluk: ' + DIFF().name + '  ⟳');
    txt(c, VERSION, 480, 528, 13, 'rgba(255,255,255,.5)', 'center', 'normal');
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
      c.fillStyle = open ? 'rgba(20,48,107,.9)' : 'rgba(40,40,50,.85)'; rr(c, k.x, k.y, k.w, k.h, 14); c.fill();
      c.strokeStyle = open ? '#f2c230' : '#555555'; c.lineWidth = 2; c.stroke();
      txt(c, String(k.n), k.x + k.w / 2, k.y + 52, 42, open ? '#f2c230' : '#777777', 'center', '900');
      c.font = 'bold 15px ' + FONT; const lines = wrap(c, C.title, k.w - 20);
      lines.forEach((l, j) => txt(c, l, k.x + k.w / 2, k.y + 86 + j * 19, 15, open ? '#ffffff' : '#888888', 'center'));
      if (!open) txt(c, '🔒', k.x + k.w / 2, k.y + 150, 24, '#ffffff', 'center');
      else { const st = SAVE.stars[k.n] || 0; for (let j = 0; j < 3; j++){ c.fillStyle = j < st ? '#f2c230' : 'rgba(255,255,255,.2)'; drawStar(c, k.x + k.w / 2 - 28 + j * 28, k.y + 146, 11); } } }
  };
  return S;
}
function ChapterEnd(n, st){
  const E = { t:0 }; const bNext = { x:270, y:400, w:200, h:54 }, bMenu = { x:490, y:400, w:200, h:54, size:20 };
  SFX.win();
  E.update = dt => { E.t += dt; if (!tap || E.t < 1.2) return;
    if (inB(bMenu, tap)) toCover();
    else if (inB(bNext, tap) || tap.key){ if (n >= 10){ cur = Credits(); } else startChapter(n + 1); } };
  E.draw = c => {
    bgSehir(c, E.t); c.fillStyle = 'rgba(0,0,0,.62)'; c.fillRect(0, 0, W, H);
    txt(c, 'BÖLÜM ' + n + ' TAMAMLANDI', 480, 120, 46, '#f2c230', 'center', 'italic 900', 6);
    txt(c, CHAPTERS[n - 1].title, 480, 160, 22, '#ffffff', 'center');
    for (let j = 0; j < 3; j++){ const k = clamp((E.t - .4 - j * .3) / .3, 0, 1); const sc = k < 1 ? k * 1.3 : 1;
      c.save(); c.translate(400 + j * 80, 230); c.scale(sc, sc); c.fillStyle = j < st ? '#f2c230' : 'rgba(255,255,255,.18)'; drawStar(c, 0, 0, 30); c.restore();
      if (k > 0 && k < .2 && j < st && !E['s' + j]){ E['s' + j] = true; tone(880 + j * 220, .15, 'triangle', .12); } }
    const C = CHAPTERS[n - 1];
    if (C.teaser){ txt(c, 'Gelecek Bölüm: ' + C.teaser[0], 480, 310, 22, '#ffffff', 'center');
      c.font = 'italic 18px ' + FONT; wrap(c, C.teaser[1], 700).forEach((l, i) => txt(c, l, 480, 340 + i * 24, 18, '#c8d3ff', 'center', 'italic')); }
    if (E.t > 1.2){ button(c, bNext, n >= 10 ? 'FİNAL ▶' : 'DEVAM ▶', true, E.t); button(c, bMenu, 'Ana Menü'); }
  };
  return E;
}
function Credits(){
  const R = { t:0 }; SFX.win();
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
   ARA SAHNE
   ========================================================= */
function Cut(def){
  const C = { t:0, i:-1, typed:0, lt:0, line:null, dark:0, flash:0, blipT:0, conf:[],
    st: { screen:def.screen || null, door:!!def.door, minute:def.minute || '', score:def.score || null, teams:def.teams || null, sepia:!!def.sepia,
          alarm:!!def.alarm, car:def.car || 0, bigscreen:def.bigscreen || null, crowdOn:def.crowdOn !== false, cheer:!!def.cheer },
    actors: (def.actors || []).map(a => Object.assign({ animT: Math.random() * 3, vx:0, onGround:true, e0:a.e || 'neutral' }, a)) };
  const actor = id => C.actors.find(a => a.id === id);
  const textOf = ln => ln.item ? (ln.n || '') : (ln.t || ln.n || ln.msg || '');
  function nextLine(){
    C.i++; if (C.i >= def.lines.length){ next(); return; }
    const ln = C.line = def.lines[C.i]; C.typed = 0; C.lt = 0;
    for (const a of C.actors){ a.talking = false; a.e = a.e0; }
    if (ln.set) for (const id in ln.set){ const a = actor(id); if (a){ Object.assign(a, ln.set[id]); if (ln.set[id].e) a.e0 = ln.set[id].e; } }
    if (ln.show) ln.show.forEach(id => { const a = actor(id); if (a) a.hidden = false; });
    if (ln.hide) ln.hide.forEach(id => { const a = actor(id); if (a) a.hidden = true; });
    if (ln.who && SPEAKERS[ln.who] && SPEAKERS[ln.who].look){ const a = C.actors.find(x => x.look === SPEAKERS[ln.who].look && !x.hidden); if (a){ a.talking = true; if (ln.e) a.e = ln.e; } }
    const fx = ln.fx ? [].concat(ln.fx) : [];
    for (const f of fx){
      if (f === 'dark'){ C.dark = 1; SFX.power(); vib(120); }
      if (f === 'light'){ C.dark = 0; C.flash = 1; }
      if (f === 'door'){ C.st.door = true; SFX.door(); }
      if (f === 'alarm'){ C.st.alarm = true; SFX.alarm(); vib([100, 80, 100]); }
      if (f === 'alarmOff') C.st.alarm = false;
      if (f === 'sepia') C.st.sepia = true;
      if (f === 'nosepia') C.st.sepia = false;
      if (f === 'shake'){ shake = 12; SFX.hit2(); vib(90); }
      if (f === 'flash'){ C.flash = 1; SFX.hit(); }
      if (f === 'cheer'){ C.st.cheer = true; SFX.crowd(); }
      if (f === 'confetti'){ for (let i = 0; i < 120; i++) C.conf.push({ x:rand(0, W), y:rand(-300, 0), vy:rand(60, 160), vx:rand(-30, 30), r:rand(0, 6), c:pick(['#f2c230', '#14306b', '#ffffff', '#ff5a5a']) }); }
    }
    if (ln.screen !== undefined) C.st.screen = ln.screen;
    if (ln.bigscreen !== undefined) C.st.bigscreen = ln.bigscreen;
    if (ln.min) C.st.minute = ln.min;
    if (ln.score) C.st.score = ln.score;
    if (ln.msg || ln.call){ SFX.msg(); vib([40, 60, 40]); }
    if (ln.big){ shake = 8; if (ln.sfx === undefined) SFX.hit2(); }
    if (ln.sfx && SFX[ln.sfx]) SFX[ln.sfx]();
  }
  nextLine();
  C.update = dt => {
    C.t += dt; C.lt += dt; if (C.flash > 0) C.flash -= dt * 1.5;
    for (const a of C.actors){ a.animT += dt;
      if (a.tx != null){ const d = a.tx - a.x;
        if (Math.abs(d) > 3){ a.vx = Math.sign(d) * (a.speed || 150); a.face = Math.sign(d); a.x += a.vx * dt; if (Math.abs(a.tx - a.x) < 3) a.x = a.tx; }
        else { a.vx = 0; a.tx = null; if (a.faceTo) a.face = a.faceTo; if (a.hideAt) a.hidden = true; } } }
    for (const q of C.conf){ q.y += q.vy * dt; q.x += q.vx * dt + Math.sin(C.t * 3 + q.r) * .5; q.r += dt * 4; }
    const ln = C.line; if (!ln) return;
    const full = textOf(ln).length;
    if (C.typed < full){ C.typed = Math.min(full, C.typed + dt * 48); C.blipT -= dt; if (C.blipT <= 0 && (ln.who || ln.call)){ SFX.blip(); C.blipT = .07; } }
    else for (const a of C.actors) a.talking = false;
    if (tap && C.lt > .15){
      if (inB(SKIP_BTN, tap) && !tap.key){ next(); return; }
      if (C.typed < full) C.typed = full; else nextLine(); }
  };
  C.draw = c => {
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    c.save(); c.translate(sx, sy);
    drawBg(c, def.bg, C.st, C.t);
    const list = C.actors.filter(a => !a.hidden).sort((a, b) => (a.y || GROUND) - (b.y || GROUND));
    for (const a of list){ const ex = a.talking && !a.e ? 'neutral' : a.e;
      drawHuman(c, a.x, a.y || GROUND, LOOK[a.look], getPose(a), a.face, a.s || 1, a.alpha || 1, null, ex || 'neutral', a.talking && C.typed < textOf(C.line || {}).length);
      if (a.trophy){ const hx = a.x + a.face * 3, hy = (a.y || GROUND) - 168 * (a.s || 1); c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(hx - 16, hy); c.lineTo(hx + 16, hy); c.lineTo(hx + 7, hy + 26); c.lineTo(hx - 7, hy + 26); c.fill(); c.fillRect(hx - 3, hy + 26, 6, 8); c.fillRect(hx - 10, hy + 32, 20, 5); } }
    if (def.ball) drawBall(c, def.ball[0], def.ball[1], C.t * 2, .8);
    c.restore();
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
      txt(c, ln.card, 480, 250, 56, '#f2c230', 'center', 'italic 900');
      if (ln.sub) txt(c, ln.sub, 480, 302, 30, '#ffffff', 'center', 'normal');
      c.fillStyle = '#f2c230'; c.fillRect(480 - 120 * a, 322, 240 * a, 2);
      c.globalAlpha = 1; tapHint(c, 480, 470, true); return;
    }
    if (ln.big){
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
      const k = Math.min(1, C.lt * 3), sc = k < 1 ? 2 - k : 1 + Math.sin(C.t * 6) * .02;
      c.save(); c.translate(480, 250); c.scale(sc, sc);
      txt(c, ln.big, 0, 0, ln.size || 70, ln.col || '#f2c230', 'center', 'italic 900', 10); c.restore();
      if (ln.n) txt(c, ln.n, 480, 320, 22, '#ffffff', 'center', 'bold', 4);
      tapHint(c, 480, 470, C.lt > .5); return;
    }
    if (ln.msg || ln.call){
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H);
      const px = 330, py = 40, pw = 300, ph = 440;
      c.fillStyle = '#111111'; rr(c, px, py, pw, ph, 32); c.fill(); c.fillStyle = ln.red ? '#1a0505' : '#e9edf5'; rr(c, px + 12, py + 40, pw - 24, ph - 74, 10); c.fill();
      c.fillStyle = ln.red ? '#3a0a0a' : '#333a48'; c.fillRect(px + 12, py + 40, pw - 24, 44);
      txt(c, ln.call ? '📹  Görüntülü arama' : (ln.from || '👤  Bilinmeyen Numara'), px + 26, py + 68, 16, '#ffffff');
      let by = py + 100;
      if (ln.call){ c.fillStyle = '#16202e'; c.fillRect(px + 12, py + 84, pw - 24, 200); const glitch = (C.t * 10 | 0) % 7 === 0;
        drawPortrait(c, px + pw / 2 + (glitch ? 6 : 0), py + 175, 54, ln.call, 'shock', !done);
        if (glitch){ c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(px + 12, py + 150, pw - 24, 10); } by = py + 296; }
      if (ln.photo){ c.fillStyle = '#f5f0e0'; c.fillRect(px + 70, py + 96, 160, 150); c.fillStyle = '#2a2116'; c.fillRect(px + 80, py + 106, 140, 110); drawPortrait(c, px + 150, py + 156, 34, ln.photo, 'sad'); by = py + 258; }
      c.font = '19px ' + FONT; const text = ln.msg || ln.t; const lines = wrap(c, text, pw - 82);
      const bh = lines.length * 25 + 22; c.fillStyle = ln.red ? '#5a0b0b' : '#ffffff'; rr(c, px + 26, by, pw - 52, bh, 14); c.fill();
      let n = Math.floor(C.typed);
      lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n)); n -= l.length + 1; txt(c, s, px + 40, by + 28 + i * 25, 19, ln.red ? '#ff6b6b' : '#1b1b1b', 'left', ln.red ? 'bold' : 'normal'); });
      if (ln.call && ln.who) txt(c, ln.who + ':', px + 40, by - 8, 14, '#f2c230');
      tapHint(c, 480, 512, done); return;
    }
    if (ln.item){ drawItem(c, ln, C); }
    if (ln.roster){ drawRoster(c, C.lt); }
    // diyalog kutusu
    if (!textOf(ln)) { tapHint(c, 480, 512, true); return; }
    const bx = 30, by = 392, bw = 900, bh = 136, sp = ln.who && SPEAKERS[ln.who];
    const hasP = sp && sp.look;
    c.fillStyle = 'rgba(8,12,30,.92)'; rr(c, bx, by, bw, bh, 14); c.fill();
    c.strokeStyle = ln.who ? (sp ? sp.col : '#ffffff') : 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke();
    let tx = bx + 28;
    if (hasP){ c.save(); c.beginPath(); c.arc(bx + 70, by + 68, 52, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip();
      drawPortrait(c, bx + 70, by + 66, 34, sp.look, ln.e || 'neutral', !done); c.restore();
      c.strokeStyle = sp.col; c.lineWidth = 3; c.beginPath(); c.arc(bx + 70, by + 68, 52, 0, 7); c.stroke(); tx = bx + 140; }
    if (ln.who){ c.font = 'bold 20px ' + FONT; const nw = c.measureText(ln.who).width + 30;
      c.fillStyle = sp ? sp.col : '#ffffff'; rr(c, tx - 8, by - 18, nw, 34, 10); c.fill(); txt(c, ln.who, tx + 7, by + 6, 20, '#0b1020'); }
    const fs2 = ln.who ? 25 : 23; c.font = (ln.who ? '' : 'italic ') + fs2 + 'px ' + FONT;
    const lines = wrap(c, textOf(ln), bx + bw - tx - 30); let n = Math.floor(C.typed);
    lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n)); n -= l.length + 1; txt(c, s, tx, by + (ln.who ? 52 : 44) + i * 31, fs2, ln.who ? '#ffffff' : '#dfe6ff', 'left', ln.who ? 'normal' : 'italic'); });
    tapHint(c, bx + bw - 44, by + bh - 14, done);
  };
  return C;
}
function drawItem(c, ln, C){
  const k = Math.min(1, C.lt * 3); c.save(); c.globalAlpha = k; c.translate(480, 200); c.scale(.8 + .2 * k, .8 + .2 * k); c.rotate(-.04);
  const it = ln.item;
  if (it === 'paper'){ c.fillStyle = '#f3ecd8'; c.fillRect(-120, -120, 240, 200); c.strokeStyle = '#8a1c1c'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, -50, 34, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-26, -28); c.lineTo(26, -72); c.moveTo(-26, -72); c.lineTo(26, -28); c.stroke(); c.beginPath(); c.arc(0, -50, 10, 0, 7); c.fill();
    txt(c, 'ADRES:', -100, 20, 18, '#3a2a1a'); c.strokeStyle = '#3a2a1a'; c.lineWidth = 2; c.beginPath(); for (let x = -30; x < 100; x += 6) c.lineTo(x, 15 + Math.sin(x) * 3); c.stroke();
    c.beginPath(); for (let x = -100; x < 90; x += 6) c.lineTo(x, 45 + Math.sin(x * .7) * 3); c.stroke(); }
  else if (it === 'file' || it === 'narak'){ c.fillStyle = '#c9a65a'; rr(c, -170, -130, 340, 230, 8); c.fill(); c.fillStyle = '#e8d9b0'; c.fillRect(-150, -112, 300, 200);
    c.save(); c.rotate(-.2); c.strokeStyle = '#b3122e'; c.lineWidth = 4; c.strokeRect(20, -100, 120, 40); txt(c, 'GİZLİ', 80, -70, 26, '#b3122e', 'center', '900'); c.restore();
    if (it === 'narak'){ c.fillStyle = '#2a2a2a'; c.fillRect(-135, -95, 100, 120); drawPortrait(c, -85, -40, 30, 'narak', 'angry'); txt(c, 'ADI: NARAK', -20, 0, 24, '#1a1a1a', 'left', '900'); txt(c, 'Örgütün en güçlü dövüşçüsü', -20, 30, 14, '#3a2a1a'); }
    else { for (let i = 0; i < 4; i++){ c.fillStyle = '#ffffff'; c.fillRect(-135 + i * 70, -40, 56, 64); drawPortrait(c, -107 + i * 70, -14, 14, i % 2 ? 'mate2' : 'mate', 'neutral'); }
      c.fillStyle = '#5a4a3a'; for (let i = 0; i < 3; i++) c.fillRect(-135, 40 + i * 14, 240 - i * 40, 5); } }
  else if (it === 'card'){ c.fillStyle = '#0d0d0d'; rr(c, -180, -80, 360, 160, 12); c.fill(); c.strokeStyle = '#c9a227'; c.lineWidth = 3; c.stroke();
    c.font = 'italic bold 24px ' + FONT; wrap(c, ln.t || '', 320).forEach((l, i) => txt(c, l, 0, -10 + i * 30, 24, '#e8c547', 'center', 'italic bold')); txt(c, '📍', 0, 52, 22, '#ff4040', 'center'); }
  else if (it === 'invite'){ c.fillStyle = '#ffffff'; rr(c, -220, -130, 440, 240, 10); c.fill(); c.fillStyle = '#14306b'; c.fillRect(-220, -130, 440, 40);
    txt(c, '✉  Yeni e-posta', -200, -103, 18, '#ffffff'); txt(c, 'DÜNYA ŞAMPİYONLAR TURNUVASI', 0, -40, 22, '#14306b', 'center', '900'); txt(c, 'Resmî Davetiye', 0, -10, 18, '#555555', 'center');
    txt(c, 'Başlangıç: 3 gün sonra', 0, 30, 18, '#b3122e', 'center'); c.fillStyle = '#f2c230'; rr(c, -70, 55, 140, 36, 8); c.fill(); txt(c, 'KATIL', 0, 80, 18, '#14306b', 'center'); }
  else if (it === 'photoUsta'){ c.fillStyle = '#f5f0e0'; c.fillRect(-110, -140, 220, 250); c.fillStyle = '#2a2116'; c.fillRect(-95, -125, 190, 170); drawPortrait(c, 0, -50, 52, 'usta', 'sad');
    c.font = 'italic 16px ' + FONT; wrap(c, ln.t || '', 200).forEach((l, i) => txt(c, l, 0, 70 + i * 20, 15, '#5a1a1a', 'center', 'italic bold')); }
  c.restore();
}
function drawRoster(c, t){
  const R = [['issem', 'Issem', 'Futbol takımının lideri'], ['ufis', 'Ufis', 'Dövüş ve savunma uzmanı'], ['leo', 'Leo', 'Organizasyon ve strateji']];
  R.forEach(([k, n, d], i) => { const a = clamp((t - i * .25) * 3, 0, 1); if (a <= 0) return; c.globalAlpha = a;
    const x = 120 + i * 250, y = 60; c.fillStyle = 'rgba(10,20,50,.92)'; rr(c, x, y, 220, 300, 16); c.fill(); c.strokeStyle = SPEAKERS[n].col; c.lineWidth = 3; c.stroke();
    c.save(); c.beginPath(); c.rect(x + 10, y + 10, 200, 190); c.clip(); c.fillStyle = '#1b2a48'; c.fillRect(x + 10, y + 10, 200, 190); drawPortrait(c, x + 110, y + 100, 56, k, 'happy'); c.restore();
    txt(c, n.toUpperCase(), x + 110, y + 236, 28, SPEAKERS[n].col, 'center', 'italic 900'); txt(c, d, x + 110, y + 270, 15, '#ffffff', 'center', 'normal'); c.globalAlpha = 1; });
}

/* =========================================================
   DÖVÜŞ
   ========================================================= */
const MOVES = {
  issem: { punch:{ dur:.3, a:.08, b:.18, range:64, dmg:9, kb:200, anim:'punch' },
           special:{ dur:.42, a:.17, b:.2, anim:'shoot', ball:true, cd:.55 } },
  ufis:  { punch:{ dur:.22, a:.05, b:.13, range:62, dmg:7, kb:130, anim:'punch' },
           special:{ dur:.4, a:.12, b:.26, range:90, dmg:14, kb:430, anim:'kick', cd:.25 } },
};
const ETYPES = {
  dummy:   { hp:22 },
  thug:    { look:'thug',    hp:30, speed:118, range:58, dmg:8,  windT:.48 },
  masked:  { look:'masked',  hp:34, speed:128, range:58, dmg:9,  windT:.45 },
  guard:   { look:'guard',   hp:36, speed:112, range:60, dmg:9,  windT:.5 },
  kicker:  { look:'kicker',  hp:26, speed:175, range:76, dmg:8,  windT:.32, kick:true },
  shield:  { look:'shieldg', hp:46, speed:88,  range:60, dmg:10, windT:.55, shield:true },
  brute:   { look:'brute',   hp:78, speed:85,  range:76, dmg:14, windT:.7,  big:true },
  yardimci:{ look:'yardimci',hp:280, speed:170, range:62, dmg:11, windT:.36, boss:true, name:'YARDIMCI', combo:2, dodge:.28, dash:true },
  narak:   { look:'narak',   hp:400, speed:210, range:68, dmg:12, windT:.28, boss:true, name:'NARAK', combo:3, dodge:.42, dash:true, kick:false },
  dovuscu: { look:'dovuscu', hp:460, speed:110, range:84, dmg:17, windT:.6,  boss:true, name:'YENİ DÖVÜŞÇÜ', combo:1, slam:true, big:true },
  lider:   { look:'lider',   hp:560, speed:155, range:66, dmg:13, windT:.38, boss:true, name:'LİDER', combo:2, dodge:.3, dash:true, slam:true, summon:true },
};
function makeFighter(kind, x){
  return { kind, mk: kind === 'ufisGenc' ? 'ufis' : kind, x, y:GROUND, vx:0, vy:0, face:1, hp:100, maxhp:100, look:LOOK[kind], animT:0, atk:null, stun:0, inv:0, cd:0,
    onGround:true, combo:0, lastAtkEnd:-9, blocking:false, dead:false, flash:0, defE:'neutral' };
}
function makeEnemy(type, x){
  const T = ETYPES[type], D = DIFF();
  const e = { type, T, x, y:GROUND, vx:0, vy:0, face:-1, animT:Math.random() * 3, stun:0, wind:0, strike:0, cd:rand(.6, 1.4), flash:0, dead:false, deadT:0, onGround:true,
    inv:0, hop:0, dashing:0, comboN:0, hits:0, hitT:0, defE:'angry' };
  if (type === 'dummy') return Object.assign(e, { dummy:true, hp:22, maxhp:22, wob:0, wv:0, fall:0, cd:0 });
  e.look = LOOK[T.look]; e.hp = e.maxhp = Math.round(T.hp * D.hp); if (T.boss) e.cd = 1.2;
  return e;
}
function startAtk(L, p, kind){
  let m = MOVES[p.mk][kind]; let combo = 0;
  if (kind === 'punch' && p.mk === 'ufis'){
    p.combo = (gameTime - p.lastAtkEnd < .38 && p.lastType === 'punch') ? (p.combo + 1) % 3 : 0; combo = p.combo;
    if (combo === 2) m = Object.assign({}, m, { dmg:13, kb:360, dur:.3, b:.18 });
  }
  if (kind === 'special'){ if (p.cd > 0) return; p.cd = m.cd; }
  p.atk = { m, t:0, hit:new Set(), done:false, combo }; p.lastType = kind;
  if (m.anim !== 'shoot') tone(500 + combo * 120, .05, 'triangle', .05, -200);
  for (const e of L.ents){ if (!e.T || !e.T.dodge || e.dead || e.wind > 0 || e.strike > 0 || e.dashing > 0 || e.stun > 0) continue;
    if (Math.abs(e.x - p.x) < 130 && Math.random() < e.T.dodge * DIFF().aggr * .85){ e.hop = .28; e.vx = -e.face * 470; e.inv = .32; } }
}
function spawnSparks(L, x, y, col, n, type = 'spark'){
  for (let i = 0; i < n; i++) L.parts.push({ x, y, vx:rand(-260, 260), vy:rand(-320, 60), life:rand(.2, .45), col, type });
}
function floatText(L, x, y, text, col, size){ L.texts.push({ x, y, t:0, text, col, size }); }
function hitEnemy(L, e, dmg, kb, dir){
  e.hp -= dmg; e.flash = .1; hitstop = .05; shake = Math.max(shake, 5); SFX.hit(); vib(25);
  L.combo = L.comboT > 0 ? L.combo + 1 : 1; L.comboT = 1.4;
  spawnSparks(L, e.x - dir * 6, e.y - 80 * (e.look && e.look.scale || 1), '#ffe066', 8);
  if (e.dummy){ e.wv += dir * 9; if (e.hp <= 0 && !e.dead){ e.dead = true; e.fallDir = dir; SFX.ko(); floatText(L, e.x, e.y - 130, 'DEVRİLDİ!', '#ffd34d'); } return; }
  const T = e.T, boss = T.boss;
  if (e.armorT > 0){ e.vx += kb * dir * .12; }
  else {
    e.hits = e.hitT > 0 ? e.hits + 1 : 1; e.hitT = .9;
    const thr = boss ? 4 : T.big ? 2 : 3;
    if (e.hits >= thr && e.hp > 0){
      e.hits = 0; e.armorT = boss ? 1 : .75; e.stun = 0; e.dashing = 0; e.strike = 0;
      if (boss && Math.random() < .4){ e.inv = .4; e.hop = .3; e.vx = dir * 520; e.cd = .15; }
      else { e.face = -dir; e.move = 'hit'; e.wind = T.windT * .6; e.vx = 0; }
      if (!L.armorHint){ L.armorHint = true; L.hint = 'Dikkat! Üst üste vurunca karşılık veriyorlar → 🛡️ blokla!'; L.hintT = 4.5; }
    } else { e.wind = 0; e.strike = 0; e.dashing = 0; e.stun = boss ? .16 : .3; e.vx = kb * dir * (boss ? .35 : 1); e.cd = Math.max(e.cd, boss ? .25 : .35); }
  }
  if (e.hp <= 0 && !e.dead){ e.dead = true; e.vy = -380; e.vx = dir * 260; e.onGround = false; SFX.ko(); vib(60);
    floatText(L, e.x, e.y - 140, boss ? 'K.O.!' : 'KO!', '#ff6b6b', boss ? 48 : 30); spawnSparks(L, e.x, e.y - 100, '#fff59d', boss ? 20 : 6, 'star');
    if (boss){ hitstop = .4; shake = 16; SFX.win(); }
    else if (Math.random() < .2) L.pickups.push({ x:e.x, t:0 }); }
}
function hurtPlayer(L, dmg, fromX, unblockable){
  const p = L.p; if (p.inv > 0 || p.dead || L.done) return;
  dmg = Math.round(dmg * DIFF().dmg);
  const facing = (fromX - p.x) * p.face > 0;
  if (p.blocking && facing && !unblockable){
    p.hp -= Math.ceil(dmg * .15); SFX.block(); vib(15); shake = Math.max(shake, 3);
    spawnSparks(L, p.x + p.face * 22, p.y - 78, '#9ad7ff', 8); p.x -= p.face * 14; floatText(L, p.x, p.y - 140, 'BLOK!', '#9ad7ff');
  } else {
    p.hp -= dmg; p.stun = .35; p.inv = .75; p.atk = null; p.vx = (p.x > fromX ? 1 : -1) * 220;
    SFX.hurt(); vib(80); shake = Math.max(shake, 9); spawnSparks(L, p.x, p.y - 85, '#ff8080', 10);
  }
  if (p.hp <= 0){ p.hp = 0; p.dead = true; SFX.ko(); }
}
function updPlayer(L, dt){
  const p = L.p, def = L.def;
  p.animT += dt; if (p.inv > 0) p.inv -= dt; if (p.cd > 0) p.cd -= dt;
  if (p.dead){ p.vx *= .9; }
  else if (p.stun > 0){ p.stun -= dt; p.vx *= Math.pow(.01, dt); p.blocking = false; }
  else if (p.atk){
    const a = p.atk, m = a.m; a.t += dt;
    if (m.ball){ if (!a.done && a.t >= m.a){ a.done = true; L.balls.push({ x:p.x + p.face * 30, y:p.y - 14, vx:p.face * 840, vy:-150, life:1.4, spin:0, live:true }); SFX.shoot(); vib(15); } }
    else if (a.t >= m.a && a.t <= m.b){
      for (const e of L.ents){ if (e.dead || a.hit.has(e)) continue;
        const dx = (e.x - p.x) * p.face;
        if (dx > -12 && dx < m.range + (e.T && e.T.big ? 14 : 0) && Math.abs(e.y - p.y) < 75){ a.hit.add(e);
          if (e.inv > 0) continue;
          if (e.T && e.T.shield && e.face === -p.face && !(m.anim === 'kick' || a.combo === 2) && e.stun <= 0){
            SFX.block(); spawnSparks(L, e.x - p.face * 18, e.y - 80, '#9ad7ff', 8); p.vx = -p.face * 160; floatText(L, e.x, e.y - 140, 'KALKAN!', '#9ad7ff');
            if (!L.shieldHint){ L.shieldHint = true; L.hint = 'Kalkanlıya 🦵 tekme, ⚽ şut, 3. kombo vuruşu ya da arkadan vur!'; L.hintT = 5; } continue; }
          hitEnemy(L, e, m.dmg, m.kb, p.face); } } }
    if (p.onGround) p.vx *= Math.pow(.001, dt);
    if (a.t >= m.dur){ p.atk = null; p.lastAtkEnd = gameTime; }
  } else {
    p.blocking = !!keys.block && p.onGround;
    if (p.blocking){ p.vx = 0; }
    else {
      const mv = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      p.vx = mv * 275; if (mv) p.face = mv;
      if (took('jump') && p.onGround){ p.vy = -830; p.onGround = false; L.jumped = true; SFX.jump(); }
      if (took('punch')) startAtk(L, p, 'punch');
      else if (took('special')) startAtk(L, p, 'special');
    }
  }
  p.vy += 2300 * dt; p.y += p.vy * dt;
  if (p.y >= GROUND){ p.y = GROUND; p.vy = 0; p.onGround = true; }
  p.x += p.vx * dt;
  p.x = clamp(p.x, L.lockL + 28, Math.min(L.lockR - 28, def.maxX || (def.width || W) - 28));
}
function updEnemy(L, e, dt){
  e.animT += dt; if (e.flash > 0) e.flash -= dt; if (e.inv > 0) e.inv -= dt; if (e.hitT > 0) e.hitT -= dt; if (e.armorT > 0) e.armorT -= dt;
  if (e.dummy){ e.wv += (-e.wob * 140 - e.wv * 7) * dt; e.wob += e.wv * dt; if (e.dead) e.fall = Math.min(1.45, e.fall + dt * 4); return; }
  if (e.dead){ e.deadT += dt; e.vy += 2300 * dt; e.y += e.vy * dt; if (e.y >= GROUND){ e.y = GROUND; e.vy = 0; e.vx *= Math.pow(.02, dt); } e.x += e.vx * dt; return; }
  const p = L.p, T = e.T, D = DIFF(), dx = p.x - e.x, dist = Math.abs(dx);
  if (T.summon && !e.summoned && e.hp < e.maxhp * .5){ e.summoned = true; floatText(L, e.x, e.y - 170, 'ADAMLARIM!', '#ff5a5a', 34); SFX.alarm();
    L.ents.push(makeEnemy('masked', L.camX - 40), makeEnemy('masked', L.camX + W + 40)); }
  if (e.stun > 0){ e.stun -= dt; e.x += e.vx * dt; e.vx *= Math.pow(.02, dt); }
  else if (e.hop > 0){ e.hop -= dt; e.x += e.vx * dt; e.vx *= Math.pow(.05, dt); }
  else if (e.dashing > 0){ e.dashing -= dt; e.x += e.vx * dt;
    if (!e.dashHit && Math.abs(p.x - e.x) < 42 && p.y > GROUND - 55){ e.dashHit = true; hurtPlayer(L, T.dmg * 1.2, e.x - e.face * 30); }
    if (e.dashing <= 0){ e.vx = 0; e.cd = rand(.6, 1.1) / D.aggr; } }
  else if (e.wind > 0){ e.wind -= dt;
    if (e.wind <= 0){
      if (e.move === 'dash'){ e.dashing = .42; e.vx = e.face * 760; e.dashHit = false; SFX.dash(); }
      else if (e.move === 'slam'){ e.strike = .35; shake = 12; SFX.slam(); vib(120); L.shocks.push({ x:e.x, dir:1, life:1.1, hit:false, dmg:T.dmg * .85 }, { x:e.x, dir:-1, life:1.1, hit:false, dmg:T.dmg * .85 }); }
      else { e.strike = .2; tone(260, .08, 'square', .06, -100);
        if (dist < T.range + 20 && Math.sign(dx) === e.face && Math.abs(p.y - e.y) < 60) hurtPlayer(L, T.dmg, e.x); } } }
  else if (e.strike > 0){ e.strike -= dt;
    if (e.strike <= 0){ if (T.combo && e.move === 'hit' && e.comboN < T.combo - 1 && dist < T.range + 30){ e.comboN++; e.wind = T.windT * .55; e.face = dx > 0 ? 1 : -1; }
      else { e.comboN = 0; e.cd = rand(.9, 1.7) * (T.boss ? .6 : 1) * (T.big ? 1.15 : 1) / D.aggr; } } }
  else {
    e.face = dx > 0 ? 1 : -1; e.cd -= dt;
    e.vx = dist > T.range ? e.face * T.speed : 0;
    for (const o of L.ents){ if (o !== e && !o.dead && !o.dummy){ const d = e.x - o.x; if (Math.abs(d) < 40) e.vx += (d >= 0 ? 1 : -1) * 90; } }
    e.x += e.vx * dt;
    const attacking = L.ents.filter(o => !o.dead && (o.wind > 0 || o.strike > 0 || o.dashing > 0)).length;
    if (e.cd <= 0 && !p.dead){
      if (T.dash && dist > 230 && Math.random() < .6){ e.move = 'dash'; e.wind = .55 / Math.sqrt(D.aggr); e.vx = 0; }
      else if (T.slam && dist < 300 && Math.random() < (T.boss ? .35 : .2)){ e.move = 'slam'; e.wind = .8 / Math.sqrt(D.aggr); e.vx = 0; }
      else if (dist <= T.range + 8 && (attacking < D.maxAtk || T.boss)){ e.move = 'hit'; e.wind = T.windT / Math.sqrt(D.aggr); e.vx = 0; }
    }
  }
  if (e.x > L.lockL + 20 && e.x < L.lockR - 20) e.inside = true;
  if (e.inside) e.x = clamp(e.x, L.lockL + 20, L.lockR - 20);
}

function Level(def){
  const L = { def, ents:[], balls:[], parts:[], texts:[], shocks:[], pickups:[], camX:0, lockL:0, lockR:def.width || W, time:0, done:0, doneT:0,
    lost:false, lostT:0, jumped:false, obj:def.obj || '', hint:def.hint || '', hintT:def.hint ? 7 : 0, go:false, wi:0, active:false, combo:0, comboT:0,
    swapCd:0, bark:null, barkT:0, barkI:0, pauseM:false, spawnT:1.5, bossE:null, bossIntro:0, st:{ sepia:!!def.sepia, alarm:!!def.alarm, screen:def.screen || null, worldW:def.width || W, noBoard:true } };
  L.team = (def.chars || ['issem']).map(k => makeFighter(k, def.start || 120));
  L.p = L.team[0];
  if (def.survive) L.surviveT = def.survive;
  if (def.limit) L.limitT = def.limit * (SAVE.diff === 0 ? 1.3 : SAVE.diff === 2 ? .9 : 1);
  if (def.init) def.init(L);
  const ctrl = () => showControls({ keys:['left', 'right', 'jump', 'punch', 'special', 'block'].concat(L.team.length > 1 ? ['swap'] : []), spec: L.p.mk === 'ufis' ? '🦵' : '⚽' });
  ctrl(); L.ctrl = ctrl;
  function doSwap(force){
    const o = L.team.find(f => f !== L.p && !f.dead); if (!o || (L.swapCd > 0 && !force)) return;
    o.x = L.p.x; o.y = GROUND; o.face = L.p.face; o.vx = 0; o.atk = null; o.stun = 0; o.inv = .6; L.p = o; L.swapCd = .9;
    SFX.swap(); spawnSparks(L, o.x, o.y - 70, '#ffffff', 14); floatText(L, o.x, o.y - 150, NAMES[o.mk] + '!', '#f2c230'); ctrl();
  }
  function lose(){ if (L.lost) return; L.lost = true; L.lostT = 0; showControls(null); SFX.lose(); }
  function restart(){ stats.retries++; cur = Level(def); }
  L.update = dt => {
    if (L.pauseM){
      if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ L.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)) toCover(); }
      return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !L.lost){ L.pauseM = true; showControls(null); return; }
    L.time += dt; if (L.hintT > 0) L.hintT -= dt; if (L.swapCd > 0) L.swapCd -= dt; if (L.comboT > 0) L.comboT -= dt; if (L.bossIntro > 0) L.bossIntro -= dt;
    if (L.lost){ L.lostT += dt; if (tap && L.lostT > .8) restart(); return; }
    if (def.barks && L.barkI < def.barks.length && L.time > def.barks[L.barkI].at){ L.bark = def.barks[L.barkI++]; L.barkT = 3; }
    if (L.barkT > 0) L.barkT -= dt;
    if (L.team.length > 1 && took('swap')) doSwap();
    updPlayer(L, dt);
    for (const f of L.team) if (f !== L.p && !f.dead && f.hp < f.maxhp) f.hp = Math.min(f.maxhp, f.hp + dt * 1.5);
    for (const e of L.ents) updEnemy(L, e, dt);
    for (const b of L.balls){
      b.vy += 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += b.vx * dt / 10; b.life -= dt;
      if (b.y > GROUND - 10){ b.y = GROUND - 10; b.vy *= -.5; }
      if (b.live) for (const e of L.ents){ if (e.dead || e.inv > 0) continue;
        if (Math.abs(e.x - b.x) < 28 && b.y > e.y - 140 * (e.look && e.look.scale || 1)){ hitEnemy(L, e, 14, 330, Math.sign(b.vx)); b.live = false; b.vx *= -.3; b.vy = -320; break; } }
      if (def.ball) def.ball(L, b);
    }
    L.balls = L.balls.filter(b => b.life > 0 && b.x > L.camX - 100 && b.x < L.camX + W + 100);
    for (const s of L.shocks){ s.x += s.dir * 540 * dt; s.life -= dt;
      if (!s.hit && Math.abs(L.p.x - s.x) < 30 && L.p.y > GROUND - 24){ s.hit = true; hurtPlayer(L, s.dmg, s.x - s.dir * 20, true); } }
    L.shocks = L.shocks.filter(s => s.life > 0);
    for (const k of L.pickups){ k.t += dt; if (Math.abs(L.p.x - k.x) < 32 && L.p.onGround){ k.got = true; L.p.hp = Math.min(L.p.maxhp, L.p.hp + 18); SFX.pickup(); floatText(L, k.x, GROUND - 120, '+18 ❤', '#7dff9a'); } }
    L.pickups = L.pickups.filter(k => !k.got && k.t < 12);
    for (const q of L.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 900 * dt; }
    L.parts = L.parts.filter(q => q.life > 0);
    for (const t of L.texts) t.t += dt; L.texts = L.texts.filter(t => t.t < 1.1);
    L.ents = L.ents.filter(e => !(e.dead && !e.dummy && e.deadT > 1.6));
    if (!L.done) waveLogic(L, dt);
    if (def.update) def.update(L, dt);
    L.camX = clamp(L.p.x - W * .4, L.lockL, Math.max(L.lockL, L.lockR - W));
    if (L.p.dead && !L.lost){
      L.deadT = (L.deadT || 0) + dt;
      if (L.deadT > .9){ L.deadT = 0; const o = L.team.find(f => !f.dead); if (o){ doSwap(true); } else lose(); } }
    if (L.done){ L.doneT += dt; if (L.doneT > 1.8){
      stats.lvls++; stats.dmg += L.team.reduce((s, f) => s + (1 - Math.max(0, f.hp) / f.maxhp), 0) / L.team.length; next(); } }
  };
  function waveLogic(L, dt){
    const p = L.p, alive = L.ents.filter(e => !e.dead && !e.dummy).length;
    if (def.survive){
      L.surviveT -= dt; L.spawnT -= dt;
      if (L.spawnT <= 0 && alive < 2 + SAVE.diff){ const side = Math.random() < .5 ? 1 : -1; L.ents.push(makeEnemy(pick(def.pool), side > 0 ? L.camX + W + 40 : L.camX - 40)); L.spawnT = rand(1.8, 3.2) / DIFF().aggr; }
      if (L.surviveT <= 0){ L.done = 1; L.obj = def.doneMsg || 'Dayandın!'; SFX.ok(); for (const e of L.ents) if (!e.dead){ e.stun = 3; e.vx = (e.x > p.x ? 1 : -1) * 300; } }
      return;
    }
    if (L.limitT != null){ L.limitT -= dt; if (L.limitT <= 0){ L.limitT = 0; L.loseMsg = def.loseMsg || 'Süre doldu!'; lose(); return; } }
    if (!def.waves) return;
    if (L.active){
      if (alive === 0){ L.active = false; L.lockL = 0; L.lockR = def.width || W;
        if (L.wi < def.waves.length || def.exit){ L.go = true; if (!def.noHeal){ p.hp = Math.min(p.maxhp, p.hp + 15); floatText(L, p.x, p.y - 150, '+15 ❤', '#7dff9a'); } SFX.ok(); }
        if (L.wi >= def.waves.length && !def.exit){ L.done = 1; L.obj = def.doneMsg || 'Kazandın!'; } } }
    else if (L.wi < def.waves.length && p.x > def.waves[L.wi].at){
      const w = def.waves[L.wi++]; L.active = true; L.go = false; L.lockL = L.camX; L.lockR = L.camX + W;
      w.list.forEach((it, i) => { const [t, side] = Array.isArray(it) ? it : [it, i % 2 ? -1 : 1];
        const e = makeEnemy(t, side > 0 ? L.camX + W + 40 + i * 70 : L.camX - 40 - i * 70);
        if (ETYPES[t].boss){ L.bossE = e; L.bossIntro = 2.2; SFX.boss(); shake = 8; e.x = L.camX + W - 160; e.inside = true; }
        L.ents.push(e); });
      if (w.hint){ L.hint = w.hint; L.hintT = 4.5; }
      if (!L.bossE || L.bossIntro <= 0) SFX.whistle(); }
    else if (L.wi >= def.waves.length && def.exit && p.x > (def.width || W) - 150){ L.done = 1; L.obj = def.doneMsg || 'Çıkışa ulaştın!'; SFX.goal(); }
  }
  L.draw = c => {
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    L.st.camX = L.camX;
    c.save(); c.translate(sx, sy);
    drawBg(c, def.bg, L.st, L.time);
    c.translate(-Math.round(L.camX), 0);
    if (def.drawWorld) def.drawWorld(L, c);
    for (const k of L.pickups){ const bob = Math.sin(k.t * 5) * 4; c.fillStyle = '#7ec8ff'; rr(c, k.x - 7, GROUND - 34 + bob, 14, 26, 4); c.fill(); c.fillStyle = '#1e6bd6'; c.fillRect(k.x - 4, GROUND - 40 + bob, 8, 6); c.fillStyle = '#ffffff'; c.fillRect(k.x - 7, GROUND - 24 + bob, 14, 6); }
    for (const s of L.shocks){ c.globalAlpha = Math.min(1, s.life * 2); c.fillStyle = '#c9a26b'; for (let i = 0; i < 5; i++){ c.beginPath(); c.arc(s.x - s.dir * i * 10, GROUND - 6 - i * 3, 12 - i * 2, 0, 7); c.fill(); } c.globalAlpha = 1; }
    for (const e of L.ents) drawEnemy(c, e);
    const p = L.p;
    if (!(p.inv > 0 && Math.floor(p.inv * 20) % 2 === 0)){
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(p.x, GROUND + 3, 26, 6, 0, 0, 7); c.fill();
      drawHuman(c, p.x, p.y, p.look, getPose(p), p.face, 1, 1, null, exprOf(p));
    }
    for (const b of L.balls) drawBall(c, b.x, b.y, b.spin);
    for (const q of L.parts){ c.globalAlpha = Math.min(1, q.life / .25); c.fillStyle = q.col;
      if (q.type === 'star') drawStar(c, q.x, q.y, 7); else c.fillRect(q.x - 2.5, q.y - 2.5, 5, 5); }
    c.globalAlpha = 1;
    for (const t of L.texts){ c.globalAlpha = Math.max(0, 1 - t.t); txt(c, t.text, t.x, t.y - t.t * 50, t.size || 30, t.col, 'center', 'bold', 4); }
    c.globalAlpha = 1;
    c.restore();
    drawHud(c, L);
  };
  return L;
}
function drawEnemy(c, e){
  if (e.dummy){
    c.save(); c.translate(e.x, GROUND); c.rotate(e.dead ? e.fall * (e.fallDir || 1) : e.wob * .06);
    c.fillStyle = '#6b4226'; c.fillRect(-6, -100, 12, 100); c.fillRect(-30, -78, 60, 9);
    c.fillStyle = e.flash > 0 ? '#ffffff' : '#c49a6c'; rr(c, -18, -96, 36, 52, 10); c.fill();
    c.beginPath(); c.arc(0, -112, 14, 0, 7); c.fill(); c.strokeStyle = '#7a5235'; c.lineWidth = 2; c.stroke();
    c.restore(); return;
  }
  const alpha = e.dead ? Math.max(0, 1 - Math.max(0, e.deadT - .9) / .7) : (e.inv > 0 && e.hop > 0 ? .55 : 1);
  let tint = null;
  if (e.flash > 0) tint = '#ffffff';
  else if (e.wind > 0 && Math.floor(e.wind * 14) % 2 === 0) tint = e.move === 'slam' ? '#ffa000' : e.move === 'dash' ? '#ff00aa' : '#ff3b3b';
  const sc = e.look.scale || 1;
  if (e.armorT > 0 && !e.dead){ c.strokeStyle = 'rgba(255,160,0,.8)'; c.lineWidth = 3; c.beginPath(); c.ellipse(e.x, e.y - 70 * sc, 34 * sc, 82 * sc, 0, 0, 7); c.stroke(); }
  if (e.T.boss && !e.dead){ const g = c.createRadialGradient(e.x, e.y - 70 * sc, 10, e.x, e.y - 70 * sc, 110 * sc); g.addColorStop(0, 'rgba(255,40,40,.18)'); g.addColorStop(1, 'rgba(255,40,40,0)'); c.fillStyle = g; c.fillRect(e.x - 120 * sc, e.y - 190 * sc, 240 * sc, 200 * sc); }
  if (e.dashing > 0){ for (let i = 1; i < 4; i++) drawHuman(c, e.x - e.face * i * 26, e.y, e.look, getPose(e), e.face, 1, .18, '#ff4da6'); }
  c.globalAlpha = alpha * .25; c.fillStyle = '#000000'; c.beginPath(); c.ellipse(e.x, GROUND + 3, 26 * sc, 6, 0, 0, 7); c.fill(); c.globalAlpha = 1;
  drawHuman(c, e.x, e.y, e.look, getPose(e), e.face, 1, alpha, tint, exprOf(e));
  const top = e.y - 135 * sc;
  if (e.wind > 0) txt(c, e.move === 'slam' ? '⬆ ZIPLA!' : '!', e.x, top - 6, e.move === 'slam' ? 20 : 28, e.move === 'slam' ? '#ffa000' : '#ff3b3b', 'center', 'bold', 4);
  if (!e.dead && !e.T.boss && e.hp < e.maxhp){ c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(e.x - 25, top, 50, 6); c.fillStyle = '#ff5252'; c.fillRect(e.x - 25, top, 50 * Math.max(0, e.hp) / e.maxhp, 6); }
  if (e.dead && e.deadT < 1.4){ c.fillStyle = '#fff59d'; for (let i = 0; i < 3; i++){ const a = e.deadT * 6 + i * 2.1; drawStar(c, e.x - e.face * 40 + Math.cos(a) * 18, GROUND - 20 + Math.sin(a) * 6, 6); } }
}
function hpBar(c, x, y, w, f, name, active){
  c.fillStyle = active ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.4)'; rr(c, x, y, w, 38, 10); c.fill();
  if (active){ c.strokeStyle = '#f2c230'; c.lineWidth = 2; c.stroke(); }
  c.save(); c.beginPath(); c.arc(x + 20, y + 19, 16, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip(); drawPortrait(c, x + 20, y + 21, 11, f.kind, f.dead ? 'ko' : f.hp < 30 ? 'pain' : 'neutral'); c.restore();
  txt(c, NAMES[f.mk], x + 42, y + 16, 13, active ? '#ffffff' : '#aab4cc');
  c.fillStyle = '#3a0d0d'; rr(c, x + 42, y + 21, w - 52, 10, 4); c.fill();
  const r = Math.max(0, f.hp) / f.maxhp; c.fillStyle = r > .5 ? '#2ecc71' : r > .25 ? '#f1c40f' : '#e74c3c';
  if (r > 0){ rr(c, x + 42, y + 21, (w - 52) * r, 10, 4); c.fill(); }
}
const NAMES = { issem:'ISSEM', ufis:'UFİS' };
function drawHud(c, L){
  L.team.forEach((f, i) => hpBar(c, 12 + i * 200, 10, 190, f, null, f === L.p));
  if (L.team.length > 1 && L.swapCd <= 0 && !L.team.find(f => f !== L.p).dead) txt(c, '⇄ değiştir', 12, 64, 13, 'rgba(255,255,255,.6)', 'left', 'normal');
  if (L.obj){ c.font = 'bold 19px ' + FONT; const w = c.measureText(L.obj).width + 34; const ox = L.team.length > 1 ? 560 : 480;
    c.fillStyle = 'rgba(0,0,0,.6)'; rr(c, ox - w / 2, 12, w, 38, 10); c.fill(); txt(c, L.obj, ox, 38, 19, '#f2c230', 'center'); }
  if (L.surviveT != null && !L.done){ const s = Math.max(0, Math.ceil(L.surviveT)); txt(c, '⏱ 0:' + String(s).padStart(2, '0'), 480, 86, 34, s <= 5 ? '#7dff9a' : '#ffffff', 'center', '900', 5); }
  if (L.limitT != null && !L.done){ const s = Math.max(0, Math.ceil(L.limitT)); txt(c, '🚨 ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), 480, 86, 30, s <= 10 ? '#ff5a5a' : '#ffffff', 'center', '900', 5); }
  if (L.hint && L.hintT > 0){ c.globalAlpha = Math.min(1, L.hintT); c.font = 'bold 17px ' + FONT;
    const w = c.measureText(L.hint).width + 30; c.fillStyle = 'rgba(20,48,107,.88)'; rr(c, W / 2 - w / 2, 100, w, 34, 9); c.fill();
    txt(c, L.hint, W / 2, 123, 17, '#ffffff', 'center'); c.globalAlpha = 1; }
  const b = L.bossE;
  if (b && !b.dead){ const bw = 420, bx = W / 2 - bw / 2, by = 148;
    c.fillStyle = 'rgba(0,0,0,.65)'; rr(c, bx - 6, by - 22, bw + 12, 42, 8); c.fill(); txt(c, b.T.name, bx, by - 4, 16, '#ff5a5a', 'left', '900');
    c.fillStyle = '#3a0d0d'; c.fillRect(bx, by + 2, bw, 10); c.fillStyle = '#e74c3c'; c.fillRect(bx, by + 2, bw * Math.max(0, b.hp) / b.maxhp, 10); }
  if (L.bossIntro > 0 && b){ const k = L.bossIntro; c.fillStyle = 'rgba(0,0,0,' + Math.min(.6, k) + ')'; c.fillRect(0, 200, W, 140);
    c.save(); c.beginPath(); c.arc(260, 270, 60, 0, 7); c.fillStyle = '#2a0c12'; c.fill(); c.clip(); drawPortrait(c, 260, 272, 40, b.T.look, 'angry'); c.restore();
    txt(c, b.T.name, 520, 285, 62, '#ff4040', 'center', 'italic 900', 8); txt(c, 'BOSS', 520, 318, 18, '#ffffff', 'center'); }
  if (L.combo >= 3 && L.comboT > 0){ c.globalAlpha = Math.min(1, L.comboT * 2); txt(c, L.combo + ' KOMBO!', W - 30, 120, 30 + Math.min(14, L.combo), '#f2c230', 'right', 'italic 900', 5); c.globalAlpha = 1; }
  if (L.bark && L.barkT > 0){ const sp = SPEAKERS[L.bark.who]; c.globalAlpha = Math.min(1, L.barkT * 2);
    const by0 = 178; c.fillStyle = 'rgba(8,12,30,.9)'; rr(c, 12, by0, 430, 56, 12); c.fill(); c.strokeStyle = sp.col; c.lineWidth = 2; c.stroke();
    c.save(); c.beginPath(); c.arc(42, by0 + 28, 22, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip(); drawPortrait(c, 42, by0 + 30, 15, sp.look, L.bark.e || 'shout', true); c.restore();
    txt(c, L.bark.who, 74, by0 + 22, 14, sp.col); txt(c, L.bark.t, 74, by0 + 44, 17, '#ffffff', 'left', 'normal'); c.globalAlpha = 1; }
  if (L.go && !L.active && !L.done && Math.sin(gameTime * 7) > -.3) txt(c, 'İLERLE ▶', W - 24, 250, 30, '#f2c230', 'right', '900', 5);
  c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 9, 5, 18); c.fillRect(PAUSE_BTN.x + 23, PAUSE_BTN.y + 9, 5, 18);
  if (L.pauseM) drawPause(c);
  if (L.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H);
    txt(c, L.loseMsg ? L.loseMsg.toUpperCase() : 'YENİLDİN!', 480, 230, 50, '#ff6b6b', 'center', '900');
    txt(c, 'Pes etmek yok. Şampiyonlar tekrar kalkar.', 480, 280, 22, '#ffffff', 'center', 'normal');
    tapHint(c, 480, 340, L.lostT > .8, 'Tekrar dene ▶'); }
}
function drawPause(c){
  c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(0, 0, W, H);
  txt(c, 'DURAKLATILDI', 480, 160, 42, '#f2c230', 'center', 'italic 900');
  button(c, { x:330, y:200, w:300, h:54 }, '▶  Devam', true, gameTime);
  button(c, { x:330, y:266, w:300, h:50, size:20 }, '↺  Yeniden başla');
  button(c, { x:330, y:328, w:300, h:50, size:20 }, '⌂  Ana menü');
}

/* =========================================================
   FUTBOL MAÇI — çalım + şut
   ========================================================= */
function Match(def){
  const PITCH = 2760, GOALX = 2640, BOXX = 2230, MID = 1350, D = DIFF();
  const M = { def, t:0, camX:0, clock:def.startMin || 0, goals:0, score:(def.score || [0, 0]).slice(), state:'play', stT:0, parts:[], texts:[], pauseM:false,
    tackles:0, aimT:0, shot:null, lost:false, lostT:0, defs:[], extra:0, hintT:6, hint:def.hint || 'Rakip kırmızı yanınca kayacak: ⤒ zıpla ya da 💨 çalımla geç!' };
  const p = { x:300, y:GROUND, vy:0, vx:0, face:1, animT:0, onGround:true, dash:0, dashCd:0, run:true };
  const keeper = { x:GOALX - 34, y:GROUND, vy:0, face:-1, animT:0, onGround:true, look:LOOK.keeper, vx:0, dive:0 };
  const mates = [{ off:-180, look:LOOK.mate, animT:0 }, { off:-320, look:LOOK.mate2, animT:.5 }];
  M.p = p;
  const ctrl = () => showControls({ keys:['left', 'right', 'jump', 'special', 'block'], spec:'⚽', block:'💨' });
  ctrl();
  const base = def.defs || [820, 1180, 1520, 1860, 2120];
  function makeDef(x){ return { x, y:GROUND, vx:0, face:-1, st:'wait', t:0, animT:Math.random() * 3, look:pick([LOOK.rival, LOOK.rival2]), onGround:true, speed:(def.training ? 150 : 205) * D.aggr }; }
  function resetAttack(fromX, full){
    p.x = fromX; p.y = GROUND; p.vy = 0; p.face = 1; p.dash = 0; M.state = 'play'; M.shot = null; keeper.y = GROUND; keeper.vy = 0; keeper.dive = 0;
    if (full){ M.defs = base.map(makeDef); for (let i = 0; i < M.extra; i++) M.defs.push(makeDef(1000 + i * 520 + 260)); }
    else { M.defs = M.defs.filter(d => d.x > fromX + 320); for (const d of M.defs){ d.st = 'wait'; d.vx = 0; }
      if (M.defs.length < 2) M.defs.push(makeDef(Math.min(BOXX - 80, fromX + 700)), makeDef(Math.min(BOXX + 60, fromX + 1050))); }
  }
  resetAttack(300, true);
  function lose(msg){ M.lost = true; M.lostT = 0; M.loseMsg = msg; showControls(null); SFX.lose(); }
  function restart(){ stats.retries++; cur = Match(def); }
  function shoot(){
    const dist = GOALX - p.x, m = .5 + .5 * Math.sin(M.aimT * 4.4 * D.aggr), zone = clamp(.34 - (dist - 250) / 2400, .08, .34) * D.zone * (def.training ? 1.25 : 1);
    const d = Math.abs(m - .5); let res = d < zone / 2 ? 'goal' : d < zone ? (Math.random() < .5 ? 'goal' : 'save') : (Math.random() < .5 ? 'save' : 'miss');
    const h = res === 'miss' ? GROUND - 160 : GROUND - rand(25, 100);
    M.shot = { t:0, dur:.45 + dist / 3200, x0:p.x + 18, y0:GROUND - 10, x1:res === 'save' ? keeper.x - 6 : GOALX + 40, y1:h, res, peak:Math.min(90, dist / 12) };
    M.state = 'shot'; SFX.shoot(); vib(30); p.atk = { m:MOVES.issem.special, t:0 };
  }
  M.update = dt => {
    if (M.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ M.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)) toCover(); } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !M.lost){ M.pauseM = true; showControls(null); return; }
    M.t += dt; if (M.hintT > 0) M.hintT -= dt;
    if (M.lost){ M.lostT += dt; if (tap && M.lostT > .8) restart(); return; }
    if (def.time && M.state !== 'won'){ M.clock = Math.min(90, M.clock + dt * (90 - (def.startMin || 0)) / def.time);
      if (M.clock >= 90 && M.state === 'play'){ SFX.longWhistle(); lose('Süre bitti!'); return; } }
    p.animT += dt; keeper.animT += dt; for (const m of mates) m.animT += dt;
    if (p.atk){ p.atk.t += dt; if (p.atk.t > p.atk.m.dur) p.atk = null; }
    if (M.state === 'play' || M.state === 'aim'){
      const slow = M.state === 'aim' ? .25 : 1;
      if (M.state === 'play'){
        if (p.dashCd > 0) p.dashCd -= dt;
        if (p.dash > 0){ p.dash -= dt; p.vx = p.face * 650; }
        else { const mv = (keys.right ? 1 : 0) - (keys.left ? 1 : 0); p.vx = mv * 295; if (mv) p.face = mv; }
        if (took('block') && p.dashCd <= 0){ p.dash = .28; p.dashCd = .85; SFX.dash(); }
        if (took('jump') && p.onGround){ p.vy = -760; p.onGround = false; SFX.jump(); }
        if (took('special') && p.onGround){ if (p.x > GOALX - 1700){ M.state = 'aim'; M.aimT = 0; p.vx = 0; tone(600, .1, 'triangle', .1); } else { floatText(M, p.x, GROUND - 150, 'Kaleye çok uzak!', '#ffffff'); } }
      } else {
        M.aimT += dt; p.vx = 0;
        if (took('special') || M.aimT > 2.4) shoot();
      }
      p.vy += 2200 * dt; p.y += p.vy * dt; if (p.y >= GROUND){ p.y = GROUND; p.vy = 0; p.onGround = true; }
      p.x = clamp(p.x + p.vx * dt, 60, GOALX - 120);
      for (const d of M.defs){ d.animT += dt;
        const dx = p.x - d.x, dist = Math.abs(dx);
        if (d.st === 'wait'){ if (dist < 520) d.st = 'chase'; d.vx = 0; }
        else if (d.st === 'chase'){ d.face = dx > 0 ? 1 : -1; d.vx = d.face * d.speed * (dx > 0 ? 1.12 : 1); d.x += d.vx * dt * slow;
          if (dist < 125 && p.onGround !== false){ d.st = 'wind'; d.t = .42 / D.aggr * (def.training ? 1.3 : 1); d.vx = 0; } }
        else if (d.st === 'wind'){ d.t -= dt * slow; d.face = dx > 0 ? 1 : -1; if (d.t <= 0){ d.st = 'slide'; d.t = .42; d.vx = d.face * 610; d.hit = false; tone(300, .1, 'sawtooth', .05, -100); } }
        else if (d.st === 'slide'){ d.x += d.vx * dt * slow; d.vx *= Math.pow(.3, dt); d.t -= dt * slow;
          if (!d.hit && Math.abs(p.x - d.x) < 36 && p.y > GROUND - 24 && p.dash <= 0){ d.hit = true;
            M.state = 'lostball'; M.stT = 1.5; M.tackles++; SFX.hurt(); SFX.whistle(); vib(120); shake = 8;
            floatText(M, p.x, GROUND - 150, 'TOP KAPTIRILDI!', '#ff6b6b'); if (def.time) M.clock = Math.min(89.5, M.clock + 4); }
          if (d.t <= 0){ d.st = 'down'; d.t = .9; } }
        else if (d.st === 'down'){ d.t -= dt * slow; if (d.t <= 0) d.st = 'chase'; }
      }
      M.defs = M.defs.filter(d => p.x - d.x < 760);
    }
    else if (M.state === 'shot'){
      const s = M.shot; s.t += dt; const k = Math.min(1, s.t / s.dur);
      M.ballX = lerp(s.x0, s.x1, k); M.ballY = lerp(s.y0, s.y1, k) - Math.sin(k * Math.PI) * s.peak;
      if (k > .55 && !keeper.dive){ keeper.dive = 1; keeper.vy = s.res === 'save' ? -(GROUND - s.y1) * 6.5 - 200 : (s.y1 < GROUND - 60 ? -260 : -650); }
      if (k >= 1){
        if (s.res === 'goal'){ M.goals++; M.score[0]++; M.state = 'goal'; M.stT = 2.8; SFX.goal(); SFX.crowd(); vib([80, 60, 200]); shake = 10;
          floatText(M, GOALX - 200, GROUND - 230, 'GOOOOOL!', '#f2c230', 76);
          for (let i = 0; i < 80; i++) M.parts.push({ x:GOALX - rand(0, 600), y:rand(-50, 200), vx:rand(-40, 40), vy:rand(80, 200), life:3, col:pick(['#f2c230', '#14306b', '#ffffff']), type:'conf' }); }
        else { M.state = 'nogoal'; M.stT = 1.6; SFX.lose();
          floatText(M, GOALX - 200, GROUND - 200, s.res === 'save' ? 'KALECİ KURTARDI!' : 'AUT!', '#ffffff', 44); }
      }
    }
    else if (M.state === 'goal' || M.state === 'nogoal' || M.state === 'lostball'){
      M.stT -= dt;
      if (M.state === 'lostball'){ p.vx = 0; }
      if (M.stT <= 0){
        if (M.state === 'goal'){ if (M.goals >= def.need){ M.state = 'won'; M.stT = 1.5; SFX.longWhistle(); } else { M.extra++; resetAttack(300, true); } }
        else if (M.state === 'nogoal') resetAttack(Math.max(300, BOXX - 1250), false);
        else resetAttack(Math.max(300, p.x - 450), false);
      }
    }
    else if (M.state === 'won'){ M.stT -= dt; if (M.stT <= 0){ stats.lvls++; stats.dmg += Math.min(1, M.tackles * .18); next(); return; } }
    keeper.vy += 2200 * dt; keeper.y += keeper.vy * dt; if (keeper.y >= GROUND){ keeper.y = GROUND; keeper.vy = 0; }
    keeper.x = GOALX - 34 + Math.sin(M.t * 1.5) * 8;
    for (const q of M.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.type !== 'conf') q.vy += 900 * dt; }
    M.parts = M.parts.filter(q => q.life > 0);
    for (const t of M.texts) t.t += dt; M.texts = M.texts.filter(t => t.t < 1.6);
    const target = M.state === 'shot' || M.state === 'goal' || M.state === 'nogoal' ? GOALX - W + 160 : p.x - 300;
    M.camX = lerp(M.camX, clamp(target, 0, PITCH - W), Math.min(1, dt * 6));
  };
  M.draw = c => {
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    c.save(); c.translate(sx, sy);
    const mm = Math.floor(M.clock);
    bgStad(c, M.t, { camX:M.camX, score:M.score[0] + ' - ' + M.score[1], minute:def.time ? mm + "'" : 'ANTRENMAN', teams:def.teams || ['ANL', 'RKP'], cheer:M.state === 'goal' });
    c.translate(-Math.round(M.camX), 0);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(MID, 302); c.lineTo(MID - 60, H); c.stroke(); c.beginPath(); c.ellipse(MID - 30, 410, 140, 46, 0, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(BOXX, 302); c.lineTo(BOXX - 60, H); c.stroke(); c.beginPath(); c.moveTo(BOXX, 302); c.lineTo(GOALX + 100, 302); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(BOXX + 200, 420, 4, 0, 7); c.fill();
    // kale
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5;
    for (let y = GROUND - 128; y < GROUND; y += 12){ c.beginPath(); c.moveTo(GOALX + 4, y); c.lineTo(GOALX + 70, y + 8); c.stroke(); }
    for (let x = GOALX + 10; x < GOALX + 72; x += 12){ c.beginPath(); c.moveTo(x, GROUND - 128); c.lineTo(x + 6, GROUND); c.stroke(); }
    c.strokeStyle = '#ffffff'; c.lineWidth = 8; c.beginPath(); c.moveTo(GOALX, GROUND + 2); c.lineTo(GOALX, GROUND - 132); c.lineTo(GOALX + 74, GROUND - 124); c.stroke();
    if (def.training) drawHuman(c, 200, GROUND - 4, LOOK.leo, getPose({ animT:M.t, pose:'arms' }), 1, .95, 1, null, 'happy');
    for (const m of mates){ const mx = p.x + m.off + Math.sin(M.t + m.off) * 30; drawHuman(c, mx, GROUND - 10, m.look, getPose({ animT:m.animT, vx:200, run:true }), 1, .88, .9); }
    drawHuman(c, keeper.x, keeper.y, keeper.look, getPose({ animT:keeper.animT, pose: keeper.y < GROUND - 5 ? 'cheer' : 'guard' }), -1, 1, 1, null, M.state === 'goal' ? 'sad' : 'angry');
    for (const d of M.defs){ const tint = d.st === 'wind' && Math.floor(d.t * 14) % 2 === 0 ? '#ff3b3b' : null;
      const pose = d.st === 'slide' ? { slide:1, animT:d.animT } : d.st === 'down' ? { pose:'lie', animT:d.animT } : { animT:d.animT, vx:d.vx, run:true, wind:d.st === 'wind' ? 1 : 0 };
      drawHuman(c, d.x, d.y, d.look, getPose(pose), d.face, 1, 1, tint, d.st === 'down' ? 'pain' : 'angry');
      if (d.st === 'wind') txt(c, '!', d.x, d.y - 150, 30, '#ff3b3b', 'center', 'bold', 4); }
    if (p.dash > 0) for (let i = 1; i < 4; i++) drawHuman(c, p.x - p.face * i * 24, p.y, LOOK.issem, getPose(p), p.face, 1, .2, '#9ad7ff');
    const pp = Object.assign({}, p, { vx: M.state === 'play' ? p.vx : 0, dashing:p.dash });
    drawHuman(c, p.x, p.y, LOOK.issem, getPose(M.state === 'goal' ? { animT:p.animT, pose:'cheer' } : M.state === 'lostball' ? { animT:p.animT, pose:'shock' } : pp), p.face, 1, 1, null,
      M.state === 'goal' || M.state === 'won' ? 'happy' : M.state === 'aim' ? 'angry' : M.state === 'lostball' ? 'shock' : 'neutral');
    if (M.state === 'shot') drawBall(c, M.ballX, M.ballY, M.t * 20);
    else if (M.state === 'goal') drawBall(c, GOALX + 40, GROUND - 10, 0);
    else if (M.state !== 'lostball' && M.state !== 'nogoal') drawBall(c, p.x + p.face * 18, GROUND - 10 + (p.y - GROUND) * .6 - Math.abs(Math.sin(p.animT * 12)) * 5, p.x / 10);
    for (const q of M.parts){ c.fillStyle = q.col; c.fillRect(q.x, q.y, 6, 4); }
    for (const t of M.texts){ c.globalAlpha = Math.max(0, 1 - t.t / 1.6); txt(c, t.text, t.x, t.y - t.t * 30, t.size || 30, t.col, 'center', 'italic 900', 6); }
    c.globalAlpha = 1;
    c.restore();
    // HUD
    if (def.obj){ c.font = 'bold 19px ' + FONT; const w = c.measureText(def.obj).width + 34; c.fillStyle = 'rgba(0,0,0,.6)'; rr(c, 12, 12, w, 38, 10); c.fill(); txt(c, def.obj, 12 + w / 2, 38, 19, '#f2c230', 'center'); }
    txt(c, 'Gol: ' + M.goals + ' / ' + def.need, 24, 76, 18, '#ffffff', 'left', 'bold', 4);
    if (M.hintT > 0){ c.globalAlpha = Math.min(1, M.hintT); c.font = 'bold 17px ' + FONT; const w = c.measureText(M.hint).width + 30; c.fillStyle = 'rgba(20,48,107,.88)'; rr(c, W / 2 - w / 2, 92, w, 34, 9); c.fill(); txt(c, M.hint, W / 2, 115, 17, '#ffffff', 'center'); c.globalAlpha = 1; }
    if (p.x > BOXX - 200 && M.state === 'play' && Math.sin(gameTime * 6) > -.4) txt(c, '⚽ ŞUT!', 480, 170, 30, '#f2c230', 'center', '900', 5);
    if (M.state === 'aim'){ const bw = 420, bx = W / 2 - bw / 2, by = 190; const dist = GOALX - p.x;
      const zone = clamp(.34 - (dist - 250) / 2400, .08, .34) * D.zone * (def.training ? 1.25 : 1);
      c.fillStyle = 'rgba(0,0,0,.7)'; rr(c, bx - 10, by - 34, bw + 20, 76, 10); c.fill(); txt(c, 'Yeşilde ⚽ bas!', 480, by - 12, 18, '#ffffff', 'center');
      c.fillStyle = '#c0392b'; c.fillRect(bx, by, bw, 22); c.fillStyle = '#f1c40f'; c.fillRect(bx + bw * (.5 - zone), by, bw * zone * 2, 22); c.fillStyle = '#2ecc71'; c.fillRect(bx + bw * (.5 - zone / 2), by, bw * zone, 22);
      const m = .5 + .5 * Math.sin(M.aimT * 4.4 * D.aggr); c.fillStyle = '#ffffff'; c.fillRect(bx + bw * m - 3, by - 6, 6, 34); }
    c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 9, 5, 18); c.fillRect(PAUSE_BTN.x + 23, PAUSE_BTN.y + 9, 5, 18);
    if (M.state === 'won'){ c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, W, H); txt(c, 'MAÇ BİTTİ!', 480, 260, 60, '#f2c230', 'center', 'italic 900', 8); }
    if (M.pauseM) drawPause(c);
    if (M.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H); txt(c, M.loseMsg.toUpperCase(), 480, 230, 52, '#ff6b6b', 'center', '900');
      txt(c, 'Skor: ' + M.score[0] + ' - ' + M.score[1] + ' · Tekrar dene, bu maçı alırız!', 480, 280, 22, '#ffffff', 'center', 'normal'); tapHint(c, 480, 340, M.lostT > .8, 'Tekrar dene ▶'); }
  };
  return M;
}

/* =========================================================
   ANA DÖNGÜ
   ========================================================= */
let last = performance.now();
function loop(now){
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  if (!paused){
    for (let k = 0; k < (window.__speed || 1); k++){
      gameTime += dt;
      if (hitstop > 0) hitstop -= dt; else cur.update(dt);
      shake *= Math.pow(.004, dt); if (shake < .3) shake = 0;
      if (k === 0) tap = null;
    }
  }
  tap = null;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  cur.draw(ctx);
  requestAnimationFrame(loop);
}
cur = Splash();
requestAnimationFrame(loop);
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
