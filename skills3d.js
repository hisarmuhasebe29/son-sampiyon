'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   skills3d.js — BECERİ OYUNLARI (antrenman tesisi)
   7 çalışma × 3 seviye (Bronz / Gümüş / Altın): dribling slalomu, yerden pas, orta, hedef şutu,
   frikik, penaltı, top sektirme. Madalyalar kaydedilir, ilk kez kazanılan madalya jeton verir.
   ========================================================= */
const SK_MEDAL = ['#cd7f32', '#c8ced6', '#f2c230'], SK_TIER = ['BRONZ', 'GÜMÜŞ', 'ALTIN'], SK_COIN = [25, 50, 100];
const SKILLS = [
  { id:'drib', ic:'💨', name:'Dribling Slalomu', desc:'Direklerin arasından zikzak geç, sonunda kaleye vur. Direğe çarpmak +2 sn, kaçırılan şut +4 sn.', unit:'sn', low:true,
    tiers:[{ gates:6, gap:4.2, w:2.6, tgt:21 }, { gates:8, gap:3.6, w:2.1, tgt:18 }, { gates:10, gap:3.2, w:1.8, tgt:16 }] },
  { id:'pas', ic:'➡️', name:'Yerden Pas', desc:'Parlayan arkadaşına, önündeki koni kapısından geçecek şekilde pas ver. Süre 60 sn.', unit:'puan',
    tiers:[{ mates:3, gate:3.2, dummies:0, tgt:900 }, { mates:4, gate:2.6, dummies:2, tgt:1500 }, { mates:5, gate:2.1, dummies:4, tgt:2100 }] },
  { id:'orta', ic:'🌙', name:'Orta Yap', desc:'Topu ceza sahasındaki lastik halkalara düşür. Merkez 300, iç 200, dış 100. Rüzgâra dikkat!', unit:'puan',
    tiers:[{ balls:6, far:0, wind:0, tgt:700 }, { balls:6, far:1, wind:.8, tgt:1000 }, { balls:6, far:2, wind:1.5, tgt:1300 }] },
  { id:'sut', ic:'⚽', name:'Hedef Şutu', desc:'Kaledeki hedef halkaları vur. Üst köşe 300, alt köşe 200, diğer gol 50.', unit:'puan',
    tiers:[{ shots:8, keeper:0, tgt:900 }, { shots:8, keeper:.75, tgt:1000 }, { shots:8, keeper:1.05, tgt:1250 }] },
  { id:'frikik', ic:'🎯', name:'Frikik Ustası', desc:'Barajın üstünden hedeflere vur. Kalecinin uzağı = daha çok puan.', unit:'puan',
    tiers:[{ shots:6, keeper:.6, tgt:500 }, { shots:6, keeper:.9, tgt:750 }, { shots:6, keeper:1.15, tgt:1000 }] },
  { id:'penalti', ic:'🧤', name:'Penaltı', desc:'5 penaltı at. Kaleci her seviyede daha iyi okur.', unit:'gol',
    tiers:[{ shots:5, keeper:.8, tgt:3 }, { shots:5, keeper:1.1, tgt:4 }, { shots:5, keeper:1.45, tgt:5 }] },
  { id:'sektir', ic:'🔁', name:'Top Sektirme', desc:'Top yeşil halkaya inince ⚽ bas! Erken ya da geç basarsan top düşer. 3 can. Hedefe ulaşınca madalya!', unit:'vuruş',
    tiers:[{ win:.2, lives:3, tgt:15 }, { win:.15, lives:3, tgt:30 }, { win:.11, lives:3, tgt:50 }] },
];
MODES.sdrib = { shoot:['H', '⚽'], dash:['L', '💨'] };
MODES.spas = { pass:['I', '➡️'], dash:['L', '💨'] };
MODES.sorta = { lob:['K', '🌙'] };
MODES.sjug = { shoot:['H', '⚽'] };
function skWrap(c, text, x, y, maxW, lh, size, col, align){ c.font = size + 'px ' + FONT; wrap(c, text, maxW).forEach((l, i) => txt(c, l, x, y + i * lh, size, col, align || 'center', 'normal')); }
function skSave(){ if (!SAVE.skills) SAVE.skills = {}; if (!SAVE.skBest) SAVE.skBest = {}; return SAVE.skills; }

/* ---------- menü ---------- */
function SkillMenu(){
  const S = { t:0, sel:null }; showControls(null); playMusic('menu'); skSave();
  const bBack = { x:16, y:12, w:110, h:38, size:16 };
  const card = i => ({ x:40 + (i % 4) * 224, y:84 + Math.floor(i / 4) * 196, w:208, h:180 });
  const tierB = k => ({ x:236 + k * 170, y:360, w:150, h:64, size:18 });
  const bMatch = card(7), durB = k => ({ x:250 + k * 160, y:330, w:140, h:70, size:18 });
  const DUR = [[3, 150], [5, 260], [8, 420]], bCamS = { x:216, y:412, w:258, h:40, size:14 }, bCtlS = { x:486, y:412, w:258, h:40, size:14 };
  function startMatch(k){ SFX.whistle(); stats = newStats(); cur = Match3D({ cam:S.mcam || 'yayin', training:true, free:true, bibs:true, time:DUR[k][1], startMin:0, need:0, teams:['ANL', 'YDK'], obj:'Antrenman maçı: A takımı – Yedekler', defs:[] }); }
  S.update = dt => { S.t += dt; if (!tap) return;
    if (inB(bBack, tap)){ SFX.back(); if (S.sel || S.match){ S.sel = null; S.match = false; return; } toCover(); return; }
    if (S.match){ for (let k = 0; k < 3; k++) if (inB(durB(k), tap)){ startMatch(k); return; } if (inB(bCamS, tap)){ S.mcam = nextCam(S.mcam || 'yayin'); SFX.click(); return; } if (inB(bCtlS, tap)){ SAVE.ctl = SAVE.ctl === 'solo' ? 'team' : 'solo'; persist(); SFX.click(); return; } if (!inB({ x:200, y:150, w:560, h:330 }, tap)) S.match = false; return; }
    if (!S.sel && inB(bMatch, tap)){ SFX.click(); S.match = true; return; }
    if (S.sel){ const d = S.sel, got = SAVE.skills[d.id] || 0;
      for (let k = 0; k < 3; k++) if (inB(tierB(k), tap)){ if (k > got){ SFX.keyErr(); S.lock = 1.2; return; } SFX.ok(); cur = Skill(d.id, k); return; }
      if (!inB({ x:200, y:120, w:560, h:330 }, tap)) S.sel = null; return; }
    SKILLS.forEach((d, i) => { if (inB(card(i), tap)){ SFX.click(); S.sel = d; } }); };
  S.draw = c => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e3b22'); g.addColorStop(1, '#06160d'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = .08; for (let i = 0; i < 12; i++){ c.fillStyle = i % 2 ? '#ffffff' : '#000000'; c.fillRect(i * 80, 0, 80, H); } c.globalAlpha = 1;
    button(c, bBack, '◀ Geri'); txt(c, '🎯 BECERİ OYUNLARI', 480, 42, 30, '#f2c230', 'center', 'italic 900', 5);
    const tot = SKILLS.reduce((a, d) => a + (SAVE.skills[d.id] || 0), 0); txt(c, 'Madalya: ' + tot + ' / ' + SKILLS.length * 3, 930, 40, 16, '#ffffff', 'right', 'bold');
    SKILLS.forEach((d, i) => { const b = card(i), got = SAVE.skills[d.id] || 0;
      c.fillStyle = 'rgba(255,255,255,.07)'; rr(c, b.x, b.y, b.w, b.h, 16); c.fill(); c.strokeStyle = got === 3 ? '#f2c230' : 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.stroke();
      c.save(); c.beginPath(); c.arc(b.x + b.w / 2, b.y + 50, 30, 0, 7); c.fillStyle = 'rgba(242,194,48,.16)'; c.fill(); c.restore();
      txt(c, d.ic, b.x + b.w / 2, b.y + 62, 32, '#f2c230', 'center');
      txt(c, d.name, b.x + b.w / 2, b.y + 106, 17, '#ffffff', 'center', '900', 0, b.w - 16);
      for (let k = 0; k < 3; k++){ const x = b.x + b.w / 2 + (k - 1) * 34, y = b.y + 142; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fillStyle = k < got ? SK_MEDAL[k] : 'rgba(255,255,255,.12)'; c.fill();
        if (k < got) txt(c, '★', x, y + 5, 13, '#ffffff', 'center', '900'); }
    });
    { const b = bMatch; const g2 = c.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h); g2.addColorStop(0, 'rgba(242,194,48,.28)'); g2.addColorStop(1, 'rgba(20,48,107,.5)'); c.fillStyle = g2; rr(c, b.x, b.y, b.w, b.h, 16); c.fill();
      c.strokeStyle = '#f2c230'; c.lineWidth = 2; c.stroke(); txt(c, '⚽', b.x + b.w / 2, b.y + 62, 34, '#f2c230', 'center');
      txt(c, 'ANTRENMAN MAÇI', b.x + b.w / 2, b.y + 106, 17, '#ffffff', 'center', '900', 0, b.w - 16); txt(c, 'A takımı – Yedekler', b.x + b.w / 2, b.y + 132, 13, '#c8d3ff', 'center', 'bold', 0, b.w - 16);
      txt(c, 'Galibiyet: +20 🪙', b.x + b.w / 2, b.y + 158, 12, '#f2c230', 'center', 'bold'); }
    if (S.match){ c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H); c.fillStyle = '#0d2a1a'; rr(c, 200, 150, 560, 330, 20); c.fill(); c.strokeStyle = '#f2c230'; c.lineWidth = 3; c.stroke();
      txt(c, '⚽ ANTRENMAN MAÇI', 480, 196, 26, '#f2c230', 'center', 'italic 900');
      skWrap(c, 'Tesiste 11\'e 11 hazırlık maçı: senin takımın, sarı yelek giyen Yedekler\'e karşı. Maç süresini seç:', 480, 236, 520, 22, 16, '#ffffff', 'center');
      for (let k = 0; k < 3; k++){ const b = durB(k); c.fillStyle = 'rgba(242,194,48,.9)'; rr(c, b.x, b.y, b.w, b.h, 14); c.fill(); txt(c, DUR[k][0] + ' dk', b.x + b.w / 2, b.y + 32, 22, '#14306b', 'center', '900'); txt(c, ['Kısa', 'Normal', 'Uzun'][k], b.x + b.w / 2, b.y + 54, 13, '#14306b', 'center', 'bold'); }
      button(c, bCamS, '📹 Kamera: ' + camName(S.mcam || 'yayin') + ' ⟳'); button(c, bCtlS, SAVE.ctl === 'solo' ? '👤 Sadece ben oynarım ⟳' : '👥 Takımı yönetirim ⟳'); txt(c, 'Zorluk: ' + DIFF().name + ' · Maçta 📹 kamerayı, 👥/👤 kontrol şeklini değiştirir', 480, 470, 12, '#c8d3ff', 'center', 'normal'); }
    if (S.sel){ const d = S.sel, got = SAVE.skills[d.id] || 0;
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H); c.fillStyle = '#0d2a1a'; rr(c, 200, 120, 560, 330, 20); c.fill(); c.strokeStyle = '#f2c230'; c.lineWidth = 3; c.stroke();
      txt(c, d.ic + ' ' + d.name, 480, 166, 26, '#f2c230', 'center', 'italic 900', 0, 520);
      skWrap(c, d.desc, 480, 204, 520, 22, 16, '#ffffff', 'center');
      for (let k = 0; k < 3; k++){ const b = tierB(k), lock = k > got, t = d.tiers[k];
        c.fillStyle = lock ? 'rgba(255,255,255,.08)' : SK_MEDAL[k]; rr(c, b.x, b.y, b.w, b.h, 14); c.fill();
        txt(c, (lock ? '🔒 ' : '') + SK_TIER[k], b.x + b.w / 2, b.y + 28, 18, lock ? '#8fa0c8' : '#101010', 'center', '900');
        txt(c, (d.low ? '≤ ' : '≥ ') + t.tgt + ' ' + d.unit, b.x + b.w / 2, b.y + 50, 14, lock ? '#8fa0c8' : '#202020', 'center', 'bold');
        const best = SAVE.skBest[d.id + k]; if (best != null) txt(c, 'En iyi: ' + best, b.x + b.w / 2, b.y + 84, 13, '#c8d3ff', 'center', 'normal'); }
      txt(c, 'İlk madalyada jeton: Bronz 25 · Gümüş 50 · Altın 100', 480, 300, 14, '#c8d3ff', 'center', 'normal');
      if (S.lock > 0){ S.lock -= 1 / 60; pill(c, 'Önce bir alt seviyeyi geç!', 480, 470, 16, 'rgba(0,0,0,.85)', '#ffcc66'); } }
  };
  return S;
}

/* ---------- ortak oyun çatısı ---------- */
function Skill(id, tier){
  const D = SKILLS.find(d => d.id === id), P = D.tiers[tier];
  const S = { kind:'tesis', game:'skill', id, tier, D, P, t:0, clock:0, score:0, state:'intro', stT:2.2, pauseM:false, texts:[], conf:[], shake:0, cheer:false, excite:.3,
    camPos:new THREE.Vector3(-14, 6, 0), camLook:new THREE.Vector3(0, 0, 0), focus:{ x:0, z:0 }, fov:46, p:newP(0, 0), B:newBall(0, 0), K:null, objs:[], msg:'', msgT:0, extra:{} };
  playMusic('football'); crowdAmb(true, .05);
  const done = (ok) => {
    S.state = 'done'; S.ok = ok; showControls(null); S.stT = 0; const sv = skSave(), key = id + tier, val = D.unit === 'sn' ? Math.round(S.score * 10) / 10 : S.score;
    if (SAVE.skBest[key] == null || (D.low ? val < SAVE.skBest[key] : val > SAVE.skBest[key])) SAVE.skBest[key] = val;
    S.coins = 0; if (ok && (sv[id] || 0) < tier + 1){ sv[id] = tier + 1; S.coins = SK_COIN[tier]; prof().coins = (prof().coins || 0) + S.coins; SFX.coin && setTimeout(() => SFX.coin(), 700); S.newMedal = true; }
    persist(); if (ok){ SFX.win(); confetti(S, 110); say(pick(['Muhteşem!', 'Madalya senin!', 'İşte bu!']), 'Leo'); } else { SFX.lose(); }
  };
  S.finish = done;
  S.say = (t, col, size) => { wtext(S, t, S.B.x, 2.6, S.B.z, col || '#f2c230', size || 54); };
  const E = SK_ENG[id]; E.init(S);
  const restart = () => { crowdAmb(false); cur = Skill(id, tier); };
  const bAgain = { x:300, y:380, w:170, h:54, size:18 }, bMenu = { x:490, y:380, w:170, h:54, size:18 }, bNext = { x:395, y:446, w:170, h:44, size:16 };
  S.update = dt => {
    if (S.state === 'done'){ S.stT += dt; S.t += dt; for (const t of S.texts) t.t += dt; if (!tap || S.stT < .8) return;
      if (inB(bAgain, tap)){ SFX.click(); restart(); } else if (inB(bMenu, tap)){ SFX.back(); crowdAmb(false); cur = SkillMenu(); }
      else if (S.ok && tier < 2 && inB(bNext, tap)){ SFX.ok(); crowdAmb(false); cur = Skill(id, tier + 1); } return; }
    if (S.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ S.pauseM = false; E.ctrl(S); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)){ crowdAmb(false); cur = SkillMenu(); } } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause)){ S.pauseM = true; showControls(null); return; }
    S.t += dt; S.shake *= Math.pow(.02, dt); if (S.msgT > 0) S.msgT -= dt;
    for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 1.8);
    if (S.K) keeperUpd(S.K, dt);
    if (S.state === 'intro'){ S.stT -= dt; if (S.stT <= 0 || (tap && S.stT < 1.6)){ S.state = 'play'; E.ctrl(S); SFX.whistle(); } }
    else if (S.state === 'play'){ S.clock += dt; E.update(S, dt); }
    if (S.p.atk){ S.p.atk.t += dt; if (S.p.atk.t > S.p.atk.m.dur) S.p.atk = null; }
    S.p.animT += dt;
  };
  S.draw = c => {
    const dt = 1 / 60;
    if (!f3Begin(S, dt)){ c.fillStyle = '#000'; c.fillRect(0, 0, W, H); txt(c, '3B grafik desteklenmiyor', 480, 270, 24, '#fff', 'center'); return; }
    E.draw3d(S);
    R3.charW('fp', LOOK.issem, S.pose || playerPose(S.p), S.p.x, S.p.y || 0, S.p.z, S.p.yaw, 1, S.state === 'done' && S.ok ? 'happy' : 'neutral', false, null, { face:footFace() });
    if (S.K) drawKeeper(S.K, 'angry');
    R3.charW('fc', LOOK.leo, getPose({ animT:S.t, pose:S.cheer || (S.state === 'done' && S.ok) ? 'arms' : 'wait' }), S.coach ? S.coach[0] : -6, 0, S.coach ? S.coach[1] : -30, S.coach ? S.coach[2] : yawTo(S.p.x + 6, S.p.z + 30), 1, S.state === 'done' ? (S.ok ? 'happy' : 'sad') : 'neutral');
    if (!S.hideBall) f3Ball(S.B);
    R3.render();
    drawWTexts(c, S); drawConf(c, S, dt);
    // üst bilgi
    pill(c, D.ic + ' ' + D.name + ' · ' + SK_TIER[tier], 14, 28, 16, 'rgba(6,10,26,.86)', SK_MEDAL[tier], { align:'left', maxW:420 });
    const val = D.unit === 'sn' ? (S.score).toFixed(1) : String(S.score);
    c.fillStyle = 'rgba(6,10,26,.86)'; rr(c, 14, 50, 250, 44, 10); c.fill();
    txt(c, val + ' ' + D.unit, 26, 80, 24, '#ffffff', 'left', '900'); txt(c, (D.low ? 'hedef ≤ ' : 'hedef ≥ ') + P.tgt, 252, 80, 14, SK_MEDAL[tier], 'right', 'bold');
    E.hud(S, c);
    if (S.msgT > 0){ c.globalAlpha = Math.min(1, S.msgT * 2); pill(c, S.msg, 480, 128, 22, 'rgba(20,48,107,.92)', '#f2c230', { maxW:700 }); c.globalAlpha = 1; }
    pauseBtn(c);
    if (S.state === 'intro'){ c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(6,20,12,.92)'; rr(c, 190, 150, 580, 220, 18); c.fill(); c.strokeStyle = SK_MEDAL[tier]; c.lineWidth = 3; c.stroke();
      txt(c, D.ic + ' ' + D.name, 480, 196, 28, '#f2c230', 'center', 'italic 900', 0, 540); txt(c, SK_TIER[tier] + ' · ' + (D.low ? 'Hedef: ' + P.tgt + ' sn altı' : 'Hedef: ' + P.tgt + ' ' + D.unit), 480, 230, 18, SK_MEDAL[tier], 'center', '900');
      skWrap(c, D.desc, 480, 266, 540, 21, 15, '#ffffff', 'center'); skWrap(c, E.tip, 480, 322, 540, 20, 14, '#9fe0b0', 'center'); }
    if (S.pauseM) drawPause(c);
    if (S.state === 'done'){ const k = Math.min(1, S.stT * 2.5);
      c.fillStyle = 'rgba(0,0,0,' + .62 * k + ')'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(480, 200); c.scale(k, k);
      if (S.ok){ c.beginPath(); c.arc(0, -10, 62, 0, 7); c.fillStyle = SK_MEDAL[tier]; c.fill(); c.lineWidth = 6; c.strokeStyle = '#ffffff'; c.stroke(); txt(c, '★', 0, 14, 64, '#ffffff', 'center', '900'); }
      c.restore();
      txt(c, S.ok ? SK_TIER[tier] + ' MADALYA!' : 'OLMADI!', 480, 300, 40, S.ok ? '#f2c230' : '#ff6b6b', 'center', 'italic 900', 6);
      txt(c, 'Sonuç: ' + val + ' ' + D.unit + '   ·   hedef: ' + (D.low ? '≤ ' : '≥ ') + P.tgt + '   ·   en iyi: ' + SAVE.skBest[id + tier], 480, 334, 17, '#ffffff', 'center', 'bold', 0, 880);
      if (S.coins) txt(c, '+' + S.coins + ' 🪙 jeton', 480, 362, 18, '#f2c230', 'center', '900');
      button(c, bAgain, '↻ Tekrar'); button(c, bMenu, '☰ Menü'); if (S.ok && tier < 2) button(c, bNext, SK_TIER[tier + 1] + ' ▶', true, S.t); }
  };
  return S;
}

/* ---------- topla koşma (dribling / pas) ---------- */
function skRun(S, dt, o = {}){
  const p = S.p, B = S.B, I = f3Input(), sprint = keys.dash ? 1.32 : 1, top = P_SPEED() * .92 * sprint * (o.slow || 1);
  const ux = I.m > .1 ? I.iy / Math.max(.001, Math.hypot(I.ix, I.iy)) : 0, uz = I.m > .1 ? I.ix / Math.max(.001, Math.hypot(I.ix, I.iy)) : 0;
  const tvx = ux * top * I.m, tvz = uz * top * I.m, acc = Math.min(1, dt * (B.owner === p ? 6 : 9));
  p.vx += (tvx - p.vx) * acc; p.vz += (tvz - p.vz) * acc; p.x += p.vx * dt; p.z += p.vz * dt; p.sp = Math.hypot(p.vx, p.vz);
  if (p.sp > .4) p.yaw = angLerp(p.yaw, yawTo(p.vx, p.vz), Math.min(1, dt * 10));
  if (o.bounds){ p.x = clamp(p.x, o.bounds[0], o.bounds[1]); p.z = clamp(p.z, o.bounds[2], o.bounds[3]); }
  if (B.owner === p){ const fx = Math.cos(p.yaw), fz = -Math.sin(p.yaw), touch = .5 + .18 * Math.max(0, Math.sin(p.animT * 9)) * Math.min(1, p.sp / 4);
    B.x = lerp(B.x, p.x + fx * touch, Math.min(1, dt * 16)); B.z = lerp(B.z, p.z + fz * touch, Math.min(1, dt * 16)); B.y = BR; B.vx = p.vx; B.vz = p.vz; B.vy = 0;
    if (p.sp > .3){ B.yaw = p.yaw; B.rot -= p.sp * dt / BR; } }
  else if (B.free){ ballPhys(B, dt); if (o.fric && B.y <= BR + .01){ const k = Math.pow(o.fric / .35, dt); B.vx *= k; B.vz *= k; } if (!o.noTake && Math.hypot(B.x - p.x, B.z - p.z) < .75 && B.y < .7 && Math.hypot(B.vx, B.vz) < 14){ B.owner = p; B.free = false; SFX.trap && SFX.trap(); } }
}
function skKick(S, tx, tz, speed, lob){
  const B = S.B, p = S.p, dx = tx - B.x, dz = tz - B.z, d = Math.hypot(dx, dz) || 1;
  B.owner = null; B.free = true;
  if (lob){ const T = .55 + d / 19; B.vx = dx / T; B.vz = dz / T; B.vy = 9.8 * T / 2; }
  else { const v = speed || clamp(d * 1.05 + 6, 9, 22); B.vx = dx / d * v; B.vz = dz / d * v; B.vy = 0; }
  p.atk = { m:{ dur:.32, anim:'shoot' }, t:.05 }; SFX.pass ? SFX.pass() : SFX.ballKick(); vib(15);
}
/* ---------- şut istasyonu (hedef şutu, frikik, penaltı) ---------- */
function skStation(S, spots, o){
  S.K = o.keeper ? newKeeper() : null; S.fov = 34; S.shots = 0; S.goals = 0; S.res = []; S.aim = { tz:0, th:.9 }; S.power = 0; S.charging = false; S.sub = 'ready';
  S.setup = () => { const sp = spots[S.shots % spots.length]; S.B = newBall(sp[0], sp[1]); if (S.K){ S.K = newKeeper(); } S.shot = null; S.sub = 'ready'; S.power = 0; S.charging = false;
    const dirx = GL - sp[0], dirz = -sp[1], dl = Math.hypot(dirx, dirz), dx = dirx / dl, dz = dirz / dl; S.sp = sp; S.dx = dx; S.dz = dz;
    S.p = newP(sp[0] - dx * 2.4 + dz * -footFace(), sp[1] - dz * 2.4 - dx * -footFace()); S.p.yaw = yawTo(sp[0] - S.p.x, sp[1] - S.p.z);
    S.aim = { tz:o.pen ? 0 : -Math.sign(sp[1] || 1) * 2.2, th:o.wall ? 1.9 : .8 }; if (S.curlSel == null) S.curlSel = o.wall ? (sp[1] > 0 ? -.5 : .5) : 0;
    S.wall = null;
    if (o.wall){ const np = Math.sign(sp[1] || 1) * GW * .55, wx = GL - sp[0], wz = np - sp[1], wl = Math.hypot(wx, wz), wdx = wx / wl, wdz = wz / wl;
      S.wall = { d:9.15, dx:wdx, dz:wdz, cx:sp[0] + wdx * 9.15, cz:sp[1] + wdz * 9.15, nx:-wdz, nz:wdx, jump:0, n:o.wallN || 4 }; } };
  S.setup();
  S.stUpdate = (dt, onResult) => {
    const B = S.B, p = S.p;
    if (S.sub === 'ready'){
      if (!o.pen) curlTap(S);
      const I = f3Input(); S.aim.tz = clamp(S.aim.tz + I.ix * dt * 4.2, -4.6, 4.6); S.aim.th = clamp(S.aim.th + I.iy * dt * 2.1, .12, 3.0);
      if (keys.shoot){ if (!S.charging){ S.charging = true; S.power = 0; } S.power = Math.min(1, S.power + dt * .95); }
      else if (S.charging){ S.charging = false; S.sub = 'runup'; S.stT = .38; S.rx = p.x; S.rz = p.z; }
      if (S.K && S.K.st === 'ready'){ S.K.z = Math.sin(S.t * (o.pen ? 1.3 : .9)) * (o.pen ? .55 : .35) + (o.pen ? 0 : clamp(B.z * .12, -1, 1)); S.K.x = GL - (o.pen ? .35 : 1.4 + Math.sin(S.t * .7) * .3); S.K.mode = o.pen ? 'pen' : 'set'; S.K.yaw = yawTo(B.x - S.K.x, B.z - S.K.z); }
    } else if (S.sub === 'runup'){
      S.stT -= dt; const k = 1 - Math.max(0, S.stT) / .38; p.x = lerp(S.rx, B.x - Math.cos(p.yaw) * .55, k); p.z = lerp(S.rz, B.z + Math.sin(p.yaw) * .55, k); p.sp = 6;
      if (S.stT <= 0){ p.sp = 0; p.atk = { m:{ dur:.42, anim:'shoot' }, t:.15 };
        S.shot = f3Shot(B, S.aim, S.power, o.pen ? { curl:.2 } : { curlAbs:(S.curlSel || 0) * 1.7 });
        if (S.K){ f3Resolve(S.shot, S.K, { wall:S.wall, keeperMul:o.keeper, react:o.pen ? .06 : null }); keeperDive(S.K, S.shot.dive || { z:S.K.z, y:1, react:.3 }, S.shot); }
        else { const Sh = S.shot; if (S.wall){ f3Resolve(Sh, { z:0 }, { wall:S.wall, keeperMul:0 }); }
          if (Sh.ev !== 'wall'){ const ty = Sh.ty, tz = Sh.tz; Sh.ev = Math.abs(Math.abs(tz) - GW) < .13 && ty < GH + .08 ? 'post' : Math.abs(ty - GH) < .12 && Math.abs(tz) < GW + .05 ? 'bar' : Math.abs(tz) > GW || ty > GH ? (ty > GH ? 'over' : 'out') : 'goal'; Sh.kev = 1; } }
        if (S.wall) S.wall.jump = .001;
        SFX.ballKick(); if (S.K) setTimeout(() => SFX.dive(), 300); vib(25); S.shots++; S.sub = 'shot'; }
    } else if (S.sub === 'shot'){
      const Sh = S.shot; Sh.t += dt; const k = Sh.t / Sh.dur;
      if (k < Sh.kev){ const q = shotPos(Sh, k); B.x = q.x; B.y = q.y; B.z = q.z; B.yaw = yawTo(Sh.tx - Sh.x0, Sh.tz - Sh.z0); B.rot -= dt * 40; }
      else {
        const q = shotPos(Sh, Sh.kev), q0 = shotPos(Sh, Math.max(0, Sh.kev - .02)), kk = 1 / (.02 * Sh.dur);
        B.x = q.x; B.y = q.y; B.z = q.z; B.vx = (q.x - q0.x) * kk; B.vy = (q.y - q0.y) * kk; B.vz = (q.z - q0.z) * kk; B.free = true;
        const ev = Sh.ev; S.res.push(ev === 'goal' ? 1 : 0);
        if (ev === 'goal'){ S.goals++; SFX.net(); SFX.goal(); f3Net(S, 1); S.cheer = true; S.shake = 5; }
        else { SFX.ooh(); if (ev === 'catch'){ B.free = false; B.held = true; S.K.hold = true; SFX.gloveCatch(); } else if (ev === 'parry'){ B.vx = -3.5; B.vy = 3.4; B.vz = (Math.sign(B.z - S.K.z) || 1) * 5.5; SFX.glovePunch(); }
          else if (ev === 'post' || ev === 'bar'){ B.vx = -5.5; B.vy = ev === 'bar' ? 3 : 1.4; B.vz = -Math.sign(B.z) * 2.4; SFX.post(); S.shake = 4; }
          else if (ev === 'wall'){ B.vx = -S.wall.dx * 6; B.vy = 3.2; B.vz = -S.wall.dz * 6 + rand(-2, 2); SFX.bodyBlow(); } }
        onResult(ev, Sh); S.sub = 'result'; S.stT = ev === 'goal' ? 1.9 : 1.6; }
    } else if (S.sub === 'result'){ S.stT -= dt; if (S.stT < .7) S.cheer = false; if (S.stT <= 0) return true; }
    if (B.free) ballPhys(B, dt, S.shot && S.shot.ev === 'goal');
    if (B.held && S.K){ B.x = S.K.x - .45; B.y = S.K.y + 1.15; B.z = S.K.z; }
    if (S.wall && S.wall.jump > 0){ S.wall.jump += dt; if (S.wall.jump > .7) S.wall.jump = 0; }
    if (S.sub === 'ready' || S.sub === 'runup') camTo(S, S.sp[0] - S.dx * 8.5, 3.4, S.sp[1] - S.dz * 8.5, GL, .5, S.sp[1] * .3 + (S.aim.tz - S.sp[1] * .3) * .15, Math.min(1, dt * 4));
    else camTo(S, S.camPos.x, S.camPos.y, S.camPos.z, lerp(GL, B.x, .35), Math.max(.8, B.y * .6), B.z * .6, Math.min(1, dt * 3));
    S.focus = { x:GL - 10, z:B.z * .5 };
    return false;
  };
  S.stDraw = () => {
    const B = S.B;
    if (S.wall){ const Wl = S.wall, jy = Wl.jump > 0 ? Math.sin(Math.min(1, Wl.jump / .55) * Math.PI) * .42 : 0;
      for (let i = 0; i < Wl.n; i++){ const off = (i - (Wl.n - 1) / 2) * .56; drawMannequin('fw' + i, Wl.cx + Wl.nx * off, jy, Wl.cz + Wl.nz * off); } }
    if (S.sub === 'ready'){ const tl = Math.hypot(GL - B.x, S.aim.tz - B.z), ay = yawTo(GL - B.x, S.aim.tz - B.z);
      f3Arrow(B.x, B.z, ay, 1.2 + S.power * Math.min(9, tl * .45), S.power > .85 ? '#ff4a3a' : '#f2c230');
      const err = (1 - PST('sut')) * .5 + tl * .011 + Math.max(0, S.power - .85) * 3.2;
      f3Reticle(S.aim.th + Math.max(0, S.power - .85) * 2, S.aim.tz, .32 + err * .9, S.power > .85 ? '#ff4a3a' : '#f2c230'); }
  };
  S.stHud = c => { for (let i = 0; i < o.shots; i++){ const r = S.res[i], x = 26 + i * 24, y = 112; c.fillStyle = r === 1 ? '#2ecc71' : r === 0 ? '#e74c3c' : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); }
    if (S.sub === 'ready'){ shotPreview(c, S.B, S.aim, S.power, o.pen ? { curl:.2 } : { curlAbs:(S.curlSel || 0) * 1.7 }); aimMarker(c, S.aim.th, S.aim.tz, .45); if (!o.pen) curlDraw(c, S); powerHud(c, S.power, S.charging ? 'GÜÇ — bırakınca vurur' : '⚽ basılı tut: güç · joystick: hedef'); } };
}
/* hedef halkası (kale çizgisinde dikey) */
function skGoalTarget(id, z, y, r, col, on){
  const g = R3.custom(id, () => { const { T } = R3.world(); const g = new T.Group();
    const m = new T.MeshBasicMaterial({ color:col, transparent:true, opacity:.85, side:T.DoubleSide, depthWrite:false, toneMapped:false });
    g.add(new T.Mesh(new T.RingGeometry(.8, 1, 40), m)); const f = new T.Mesh(new T.CircleGeometry(.8, 40), new T.MeshBasicMaterial({ color:col, transparent:true, opacity:.18, side:T.DoubleSide, depthWrite:false, toneMapped:false })); g.add(f);
    g.rotation.y = -Math.PI / 2; return g; });
  g.position.set(GL - .02, y, z); g.scale.setScalar(r); g.children[0].material.opacity = on ? .95 : .3; g.children[1].material.opacity = on ? .22 : .05; return g;
}
function drawMannequin(id, x, y, z){
  const g = R3.custom('mq_' + id, () => { const { T, mat, mesh } = R3.world(); const g = new T.Group(), m = mat('#2a63d4', { roughness:.55 });
    g.add(mesh('cyl', m, .22, 1.25, .15, 0, .95, 0)); g.add(mesh('sph', m, .15, .17, .13, 0, 1.75, 0)); g.add(mesh('cyl', mat('#c8ccd2', { metalness:.5 }), .03, .35, .03, 0, .17, 0)); g.add(mesh('box', mat('#333333'), .5, .05, .5, 0, .02, 0));
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; });
  g.position.set(x, y, z); return g;
}
function skPole(id, x, z, col, wob){ const g = R3.custom('pl_' + id, () => { const { T, mat, mesh } = R3.world(); const g = new T.Group(); g.add(mesh('cyl', mat(col, { roughness:.4 }), .035, 1.7, .035, 0, .85, 0)); g.add(mesh('cyl', mat('#333333'), .12, .05, .12, 0, .025, 0)); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; });
  g.position.set(x, 0, z); g.rotation.set(wob ? Math.sin(wob * 30) * wob * .5 : 0, 0, wob ? Math.cos(wob * 27) * wob * .4 : 0); return g; }
function skCone(id, x, z, col = '#ff7a1a'){ const g = R3.custom('cn_' + id, () => { const { T, mat, mesh } = R3.world(); const g = new T.Group(); g.add(mesh('cone', mat(col, { roughness:.55 }), .17, .42, .17, 0, .21, 0)); g.add(mesh('box', mat(col), .3, .03, .3, 0, .015, 0)); return g; });
  g.position.set(x, 0, z); return g; }
function skTire(id, x, z, r, col, hl){ const g = R3.custom('ti_' + id, () => { const { T, mat } = R3.world(); const g = new T.Group();
    const tor = new T.Mesh(new T.TorusGeometry(1, .14, 10, 36), mat('#1b1b1b', { roughness:.9 })); tor.rotation.x = Math.PI / 2; tor.position.y = .1; g.add(tor);
    const disc = new T.Mesh(new T.CircleGeometry(.86, 36), new T.MeshBasicMaterial({ color:col, transparent:true, opacity:.4, depthWrite:false })); disc.rotation.x = -Math.PI / 2; disc.position.y = .03; g.add(disc); return g; });
  g.position.set(x, 0, z); g.scale.set(r, 1, r); g.children[1].material.opacity = hl ? .65 : .35; return g; }

/* ---------- çalışmaların kendi kuralları ---------- */
const SK_ENG = {
  /* 1) DRİBLİNG SLALOMU */
  drib:{ tip:'Joystick ile yön ver, 💨 basılı tut: sprint. Son direkten sonra ⚽ ile kaleye vur!',
    init(S){ const P = S.P; S.gates = []; const x0 = -6;
      for (let i = 0; i < P.gates; i++){ const side = i % 2 ? 1 : -1; S.gates.push({ x:x0 + i * P.gap, z:side * 1.6, side, w:P.w, passed:false, hit:0 }); }
      S.endX = x0 + P.gates * P.gap + 2; S.p = newP(x0 - 6, 0); S.p.yaw = 0; S.B = newBall(x0 - 5.4, 0); S.B.owner = S.p; S.gi = 0; S.score = 0; S.pen = 0; S.phase = 'run'; S.coach = [x0 - 4, -8, yawTo(4, 8)];
      S.camPos.set(x0 - 16, 6, 0); S.camLook.set(x0 + 4, 0, 0); },
    ctrl(){ showControls('sdrib'); fbLabels({ shoot:['⚽', 'ŞUT'], dash:['💨', 'SPRİNT'] }); },
    update(S, dt){ const p = S.p, B = S.B; S.score = S.clock + S.pen;
      skRun(S, dt, { bounds:[-40, GL - 1, -20, 20] });
      // kapı: oyuncu kapının işaretli tarafından geçmeli (direk ile çizgi arası)
      const g = S.gates[S.gi];
      if (g && p.x > g.x){ const ok = g.side > 0 ? p.z > g.z - g.w * .15 && p.z < g.z + g.w : p.z < g.z + g.w * .15 && p.z > g.z - g.w;
        if (ok){ g.passed = true; SFX.click(); } else { S.pen += 2; S.msg = 'Kapıyı kaçırdın! +2 sn'; S.msgT = 1.2; SFX.keyErr(); } S.gi++; }
      for (const q of S.gates){ if (q.hit > 0) q.hit -= dt; if (Math.hypot(p.x - q.x, p.z - q.z) < .45 && q.hit <= 0){ q.hit = .8; S.pen += 2; SFX.post(); S.msg = 'Direğe çarptın! +2 sn'; S.msgT = 1.2; p.vx *= -.4; p.vz *= -.4; }
        if (B.owner !== p && Math.hypot(B.x - q.x, B.z - q.z) < .2 && q.hit <= 0){ q.hit = .6; B.vx *= -.5; B.vz *= -.5; SFX.post(); } }
      if (S.phase === 'run' && B.owner === p && took('shoot')){ const tz = clamp(f3Input().ix * 3, -3, 3); S.phase = 'shot';
        S.shot = f3Shot(B, { tz, th:.7 }, .78, { curl:.25 }); const Sh = S.shot; Sh.ev = Math.abs(Sh.tz) < GW && Sh.ty < GH && p.x > S.endX - 2 ? 'goal' : 'out'; Sh.kev = 1; B.owner = null; SFX.ballKick(); p.atk = { m:{ dur:.42, anim:'shoot' }, t:.1 }; }
      if (S.phase === 'shot'){ const Sh = S.shot; Sh.t += dt; const k = Sh.t / Sh.dur;
        if (k < 1){ const q = shotPos(Sh, k); B.x = q.x; B.y = q.y; B.z = q.z; B.rot -= dt * 40; }
        else { if (Sh.ev === 'goal'){ SFX.net(); SFX.goal(); f3Net(S, 1); S.cheer = true; S.score = S.clock + S.pen; S.finish(S.score <= S.P.tgt); }
          else { S.pen += 4; S.msg = 'Kaçtı! +4 sn — topu al, tekrar vur'; S.msgT = 1.6; SFX.ooh(); B.x = GL - 14; B.z = 0; B.y = BR; B.vx = B.vz = 0; B.free = true; S.phase = 'run'; } } }
      if (S.phase === 'run' && B.owner !== p && !B.free){ B.free = true; }
      const look = Math.min(GL, p.x + 10); camTo(S, p.x - 11, 5.2, p.z * .5, look, .3, p.z * .3, Math.min(1, dt * 3.5)); S.focus = { x:p.x + 4, z:p.z }; },
    draw3d(S){ S.gates.forEach((g, i) => { skPole('d' + i, g.x, g.z, g.side > 0 ? '#f2d21a' : '#e03a2a', g.hit > 0 ? g.hit : 0); skCone('dc' + i, g.x, g.z + g.side * g.w, i === S.gi ? '#2ecc71' : '#ff7a1a'); });
      if (S.gates[S.gi]){ const g = S.gates[S.gi]; f3Ring('nextG', g.x, g.z + g.side * g.w * .5, '#2ecc71', .7); } else f3Ring('nextG', GL - 11, 0, '#f2c230', 1.2); },
    hud(S, c){ txt(c, 'Kapı ' + Math.min(S.gi, S.gates.length) + ' / ' + S.gates.length + (S.pen ? '   ceza +' + S.pen + ' sn' : ''), 26, 116, 15, '#ffffff', 'left', 'bold', 3);
      if (S.gi >= S.gates.length && S.phase === 'run') pill(c, '⚽ ŞUT! Kaleye vur', 480, 470, 20, 'rgba(242,194,48,.95)', '#14306b'); } },

  /* 2) YERDEN PAS */
  pas:{ tip:'Joystick ile koş · ➡️ PAS: baktığın yöndeki arkadaşa. Kırmızı kuklalar topu keser!',
    init(S){ const P = S.P; S.mates = [];
      const spots = [[18, -14], [22, 12], [6, 18], [4, -19], [28, 0]];
      for (let i = 0; i < P.mates; i++){ const [x, z] = spots[i], dx = 0 - x, dz = 0 - z, d = Math.hypot(dx, dz); S.mates.push({ x, z, yaw:yawTo(dx, dz), gx:x + dx / d * 3.2, gz:z + dz / d * 3.2, nx:-dz / d, nz:dx / d, hold:0, animT:Math.random() * 3 }); }
      S.dum = []; for (let i = 0; i < P.dummies; i++){ const m = S.mates[i % S.mates.length]; S.dum.push({ x:m.x * .55 + (i % 2 ? 2 : -2), z:m.z * .55, ph:i * 1.7 }); }
      S.target = 0; S.p = newP(-2, 0); S.B = newBall(-1.4, 0); S.B.owner = S.p; S.score = 0; S.combo = 0; S.flight = null; S.coach = [-12, -24, yawTo(10, 24)];
      S.camPos.set(-18, 13, 0); S.camLook.set(6, 0, 0); },
    ctrl(){ showControls('spas'); fbLabels({ pass:['➡️', 'PAS'], dash:['💨', 'SPRİNT'] }); },
    update(S, dt){ const p = S.p, B = S.B, P = S.P; const left = 60 - S.clock;
      if (left <= 0){ S.finish(S.score >= P.tgt); return; }
      for (const d of S.dum){ d.cz = d.z + Math.sin(S.t * 1.3 + d.ph) * 2.2; }
      skRun(S, dt, { bounds:[-15, 34, -24, 24], noTake:!!S.flight, fric:S.flight || S.retFly ? .8 : null });
      if (B.owner === p && took('pass')){
        const fx = Math.cos(p.yaw), fz = -Math.sin(p.yaw); let best = null, bs = -1;
        S.mates.forEach((m, i) => { const dx = m.x - p.x, dz = m.z - p.z, d = Math.hypot(dx, dz), dot = (dx * fx + dz * fz) / d; if (dot > .5 && dot - d * .004 > bs){ bs = dot - d * .004; best = i; } });
        const m = best != null ? S.mates[best] : null;
        if (m) skKick(S, m.x, m.z, clamp(Math.hypot(m.x - B.x, m.z - B.z) * .9 + 8, 12, 22)); else skKick(S, p.x + fx * 14, p.z + fz * 14, 14);
        S.flight = { to:best, gate:false, x0:B.x, z0:B.z, t:0 }; }
      if (S.flight){ const F = S.flight; F.t += dt;
        // kapıdan geçti mi? (hedef arkadaşın önündeki iki koni arası)
        if (F.to != null){ const m = S.mates[F.to], s = (B.x - m.gx) * (m.x - m.gx) + (B.z - m.gz) * (m.z - m.gz), lat = (B.x - m.gx) * m.nx + (B.z - m.gz) * m.nz;
          if (!F.gate && s > 0 && Math.abs(lat) < S.P.gate / 2) F.gate = true; }
        for (const d of S.dum) if (Math.hypot(B.x - d.x, B.z - d.cz) < .55 && B.y < 1.2){ B.vx = -B.vx * .3; B.vz = (Math.random() - .5) * 6; SFX.bodyBlow(); S.msg = 'Kukla kesti!'; S.msgT = 1; S.combo = 0; S.flight = null; break; }
        if (S.flight){ for (let i = 0; i < S.mates.length; i++){ const m = S.mates[i]; if (Math.hypot(B.x - m.x, B.z - m.z) < 1.1){
            const good = i === S.target && F.gate; if (good){ S.combo++; const pts = 100 + Math.min(4, S.combo - 1) * 25; S.score += pts; SFX.coin ? SFX.coin() : SFX.ok(); wtext(S, '+' + pts, m.x, 2.4, m.z, '#2ecc71', 40); S.target = (S.target + 1 + Math.floor(Math.random() * (S.mates.length - 1))) % S.mates.length; }
            else { S.combo = 0; S.msg = i === S.target ? 'Konilerin arasından geçmedi!' : 'Yanlış arkadaş!'; S.msgT = 1.2; SFX.keyErr(); }
            m.hold = .55; B.free = false; B.owner = null; B.vx = B.vz = 0; B.x = m.x; B.z = m.z; S.flight = null; S.ret = i; break; } } }
        if (S.flight && F.t > 4){ S.flight = null; B.free = true; S.combo = 0; } }
      if (S.ret != null){ const m = S.mates[S.ret]; m.hold -= dt; B.x = m.x + Math.cos(m.yaw) * .5; B.z = m.z - Math.sin(m.yaw) * .5;
        if (m.hold <= 0){ S.ret = null; const lx = p.x + p.vx * .6, lz = p.z + p.vz * .6; B.owner = null; B.free = true; const dx = lx - B.x, dz = lz - B.z, d = Math.hypot(dx, dz) || 1, v = clamp(d * .9 + 6, 10, 18); B.vx = dx / d * v; B.vz = dz / d * v; SFX.pass ? SFX.pass() : SFX.ballKick(); } }
      if (B.free && !S.flight && S.ret == null && (Math.abs(B.x) > 50 || Math.abs(B.z) > 32)){ B.x = p.x + 1; B.z = p.z; B.vx = B.vz = 0; }
      camTo(S, p.x - 15, 12, p.z * .6, p.x + 9, 0, p.z * .5, Math.min(1, dt * 2.5)); S.focus = { x:p.x + 5, z:p.z }; },
    draw3d(S){ S.mates.forEach((m, i) => { const on = i === S.target, look = Object.assign({}, LOOK.mate, { __sig:'skm' + (i % 2) });
        R3.charW('sm' + i, i % 2 ? LOOK.mate2 : LOOK.mate, getPose({ animT:S.t + m.animT, pose:on ? 'arms' : 'stand' }), m.x, 0, m.z, m.yaw, 1, on ? 'happy' : 'neutral'); void look;
        skCone('pa' + i, m.gx + m.nx * S.P.gate / 2, m.gz + m.nz * S.P.gate / 2, on ? '#2ecc71' : '#ff7a1a'); skCone('pb' + i, m.gx - m.nx * S.P.gate / 2, m.gz - m.nz * S.P.gate / 2, on ? '#2ecc71' : '#ff7a1a');
        if (on) f3Ring('pasT', m.x, m.z, '#2ecc71', 1.1 + Math.sin(S.t * 6) * .1); });
      S.dum.forEach((d, i) => { const g = drawMannequin('pd' + i, d.x, 0, d.cz != null ? d.cz : d.z); g.children.forEach(ch => { if (ch.material && ch.material.color && !ch.userData.red){ ch.userData.red = 1; ch.material = ch.material.clone(); ch.material.color.set('#c0392b'); } }); }); },
    hud(S, c){ const left = Math.max(0, 60 - S.clock); txt(c, '⏱ ' + left.toFixed(0) + ' sn' + (S.combo > 1 ? '   🔥 seri x' + S.combo : ''), 26, 118, 16, left < 10 ? '#ff6b6b' : '#ffffff', 'left', 'bold', 3); } },

  /* 3) ORTA */
  orta:{ tip:'Joystick: hedef halkayı ceza sahasında gezdir · 🌙 ORTA: bas, top havalanır. Rüzgâr oku topu iter!',
    init(S){ const P = S.P; S.balls = 0; S.score = 0; S.sub = 'aim'; S.rings = [];
      const base = [[GL - 8, -2], [GL - 12, 4], [GL - 6, 6], [GL - 15, -6], [GL - 10, 0]];
      base.forEach(([x, z], i) => S.rings.push({ x:x - P.far * 3 + (i % 2) * P.far, z:z + (P.far ? (i % 2 ? 2 : -2) : 0), r:2.3 - P.far * .35 }));
      S.p = newP(GL - 28, -29); S.p.yaw = yawTo(1, 1.4); S.B = newBall(GL - 27.4, -28.6); S.aimP = { x:GL - 10, z:0 }; S.wind = P.wind ? { x:(Math.random() - .5) * P.wind * 2, z:(Math.random() - .3) * P.wind } : { x:0, z:0 };
      S.coach = [GL - 30, -33, yawTo(1, 1)]; S.camPos.set(GL - 36, 5, -36); S.camLook.set(GL - 12, 0, 0); },
    ctrl(){ showControls('sorta'); fbLabels({ lob:['🌙', 'ORTA'] }); },
    update(S, dt){ const B = S.B, P = S.P;
      if (S.sub === 'aim'){ const I = f3Input(); S.aimP.x = clamp(S.aimP.x + I.iy * dt * 9, GL - 22, GL - 2); S.aimP.z = clamp(S.aimP.z + I.ix * dt * 9, -16, 16);
        if (took('lob')){ S.sub = 'run'; S.stT = .35; S.p.atk = null; } }
      else if (S.sub === 'run'){ S.stT -= dt; S.p.sp = 5; if (S.stT <= 0){ S.p.sp = 0; S.p.atk = { m:{ dur:.42, anim:'shoot' }, t:.15 };
          const acc = (PST('sut') + PST('calim')) / 2, err = (1 - acc) * 2.2 + .5, tx = S.aimP.x + rand(-1, 1) * err, tz = S.aimP.z + rand(-1, 1) * err; const dx = tx - B.x, dz = tz - B.z, d = Math.hypot(dx, dz), T = .75 + d / 22;
          B.vx = dx / T + S.wind.x * 1.2; B.vz = dz / T + S.wind.z * 1.2; B.vy = 9.8 * T / 2; B.free = true; S.sub = 'fly'; S.balls++; SFX.ballKick(); S.flyT = 0; } }
      else if (S.sub === 'fly'){ S.flyT += dt; const wasUp = B.y > BR + .05; B.vx += S.wind.x * dt * .8; B.vz += S.wind.z * dt * .8; ballPhys(B, dt);
        if (wasUp && B.y <= BR + .01 && !S.landed){ S.landed = true; let pts = 0, ri = -1;
          S.rings.forEach((r, i) => { const d = Math.hypot(B.x - r.x, B.z - r.z) / r.r; const v = d < .33 ? 300 : d < .66 ? 200 : d < 1 ? 100 : 0; if (v > pts){ pts = v; ri = i; } });
          S.score += pts; S.lastRing = ri; S.flash = .8;
          if (pts){ wtext(S, '+' + pts, B.x, 2.2, B.z, pts === 300 ? '#f2c230' : '#2ecc71', pts === 300 ? 60 : 46); SFX.coin ? SFX.coin() : SFX.ok(); if (pts === 300){ S.cheer = true; } } else { wtext(S, 'Halka dışı', B.x, 2.2, B.z, '#ff6b6b', 34); SFX.ooh(); }
          S.sub = 'wait'; S.stT = 1.4; } }
      else if (S.sub === 'wait'){ ballPhys(B, dt); S.stT -= dt; if (S.stT < .6) S.cheer = false;
        if (S.stT <= 0){ if (S.balls >= P.balls){ S.finish(S.score >= P.tgt); return; } S.sub = 'aim'; S.landed = false; S.B = newBall(GL - 27.4, -28.6); S.p = newP(GL - 28, -29); S.p.yaw = yawTo(1, 1.4);
          if (P.wind) S.wind = { x:(Math.random() - .5) * P.wind * 2, z:(Math.random() - .3) * P.wind }; } }
      if (S.flash > 0) S.flash -= dt;
      if (S.sub === 'fly' || S.sub === 'wait') camTo(S, GL - 30, 7, -30, lerp(GL - 10, B.x, .5), Math.max(0, B.y * .5), lerp(0, B.z, .5), Math.min(1, dt * 2.5));
      else camTo(S, GL - 36, 5.5, -36, S.aimP.x, 0, S.aimP.z * .7, Math.min(1, dt * 3));
      S.focus = { x:GL - 12, z:-6 }; },
    draw3d(S){ S.rings.forEach((r, i) => skTire('o' + i, r.x, r.z, r.r, i === S.lastRing && S.flash > 0 ? '#f2c230' : '#2e86de', i === S.lastRing && S.flash > 0));
      if (S.sub === 'aim'){ f3Ring('ortaAim', S.aimP.x, S.aimP.z, '#f2c230', .9 + Math.sin(S.t * 6) * .08); f3Arrow(S.B.x, S.B.z, yawTo(S.aimP.x - S.B.x, S.aimP.z - S.B.z), Math.min(10, Math.hypot(S.aimP.x - S.B.x, S.aimP.z - S.B.z) * .35)); } },
    hud(S, c){ txt(c, 'Top ' + S.balls + ' / ' + S.P.balls, 26, 118, 16, '#ffffff', 'left', 'bold', 3);
      if (S.P.wind){ const a = Math.atan2(S.wind.x, -S.wind.z), m = Math.hypot(S.wind.x, S.wind.z); c.save(); c.translate(900, 126); c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fill();
        c.rotate(a); c.fillStyle = '#7fd0ff'; c.beginPath(); c.moveTo(0, -20); c.lineTo(9, 6); c.lineTo(0, 1); c.lineTo(-9, 6); c.closePath(); c.fill(); c.restore(); txt(c, 'RÜZGÂR ' + m.toFixed(1), 900, 172, 12, '#7fd0ff', 'center', 'bold'); }
      if (S.sub === 'aim') pill(c, '🌙 ORTA bas · joystick: hedef', 480, 486, 16, 'rgba(0,0,0,.7)', '#ffffff'); } },

  /* 4) HEDEF ŞUTU */
  sut:{ tip:'Hedefi halkaların ortasına al, gücü kırmızıya taşırma. Üst köşeler en değerlisi!',
    init(S){ S.T = [[-2.75, 1.95, 300], [2.75, 1.95, 300], [-2.8, .55, 200], [2.8, .55, 200]].map(([z, y, v]) => ({ z, y, v, r:.62 }));
      skStation(S, [[GL - 18, 0], [GL - 20, -6], [GL - 19, 6], [GL - 21, -2], [GL - 17, 8], [GL - 22, 3], [GL - 18, -9], [GL - 20, 0]], { keeper:S.P.keeper, shots:S.P.shots }); S.coach = [GL - 22, -20, yawTo(1, 1)]; },
    ctrl(){ showControls('shot'); },
    update(S, dt){ const end = S.stUpdate(dt, (ev, Sh) => { if (ev !== 'goal'){ wtext(S, ev === 'catch' || ev === 'parry' ? 'KURTARIŞ' : 'AUT', GL - 2, 3, Sh.tz * .5, '#ff6b6b', 40); return; }
        let pts = 50; for (const t of S.T){ if (Math.hypot(Sh.tz - t.z, Sh.ty - t.y) < t.r){ pts = Math.max(pts, t.v); } } S.score += pts; wtext(S, '+' + pts, GL - 2, 3.1, Sh.tz * .5, pts >= 300 ? '#f2c230' : '#2ecc71', pts >= 300 ? 70 : 50); });
      if (end){ if (S.shots >= S.P.shots){ S.finish(S.score >= S.P.tgt); return; } S.setup(); } },
    draw3d(S){ S.T.forEach((t, i) => skGoalTarget('gt' + i, t.z, t.y, t.r, t.v >= 300 ? '#f2c230' : '#2ecc71', true)); S.stDraw(); },
    hud(S, c){ S.stHud(c); } },

  /* 5) FRİKİK */
  frikik:{ tip:'Hedefi yükselt: top barajın üstünden geçsin. Orta güç = daha çok falso.',
    init(S){ S.T = [[-2.7, 2.0, 300], [2.7, 2.0, 300], [-2.9, .6, 150], [2.9, .6, 150]].map(([z, y, v]) => ({ z, y, v, r:.7 }));
      skStation(S, [[GL - 24, -6], [GL - 22, 7], [GL - 26, 2], [GL - 23, -9], [GL - 25, 5], [GL - 21, -3]], { keeper:S.P.keeper, shots:S.P.shots, wall:true, wallN:4 + S.tier }); S.coach = [GL - 30, -22, yawTo(1, 1)]; },
    ctrl(){ showControls('shot'); },
    update(S, dt){ const end = S.stUpdate(dt, (ev, Sh) => { if (ev !== 'goal'){ wtext(S, ev === 'wall' ? 'BARAJ' : ev === 'catch' || ev === 'parry' ? 'KURTARIŞ' : 'AUT', GL - 2, 3, Sh.tz * .5, '#ff6b6b', 40); return; }
        let pts = 100; for (const t of S.T){ if (Math.hypot(Sh.tz - t.z, Sh.ty - t.y) < t.r) pts = Math.max(pts, t.v); } S.score += pts; wtext(S, '+' + pts, GL - 2, 3.1, Sh.tz * .5, '#f2c230', 60); });
      if (end){ if (S.shots >= S.P.shots){ S.finish(S.score >= S.P.tgt); return; } S.setup(); } },
    draw3d(S){ S.T.forEach((t, i) => skGoalTarget('ft' + i, t.z, t.y, t.r, t.v >= 300 ? '#f2c230' : '#2ecc71', true)); S.stDraw(); },
    hud(S, c){ S.stHud(c); } },

  /* 6) PENALTI */
  penalti:{ tip:'Kaleci ortada sallanır: hızlı ve köşeye! Gücü kırmızıya taşırırsan üstten gider.',
    init(S){ skStation(S, [[GL - 11, 0]], { keeper:S.P.keeper, shots:S.P.shots, pen:true }); S.coach = [GL - 20, -18, yawTo(1, 1)]; },
    ctrl(){ showControls('shot'); },
    update(S, dt){ const end = S.stUpdate(dt, (ev, Sh) => { if (ev === 'goal'){ S.score++; wtext(S, 'GOL!', GL - 2, 3.1, Sh.tz * .5, '#f2c230', 70); } else wtext(S, ev === 'catch' || ev === 'parry' ? 'KURTARIŞ' : 'KAÇTI', GL - 2, 3, Sh.tz * .5, '#ff6b6b', 44); });
      if (end){ const left = S.P.shots - S.shots; if (S.shots >= S.P.shots || S.score + left < S.P.tgt){ S.finish(S.score >= S.P.tgt); return; } S.setup(); } },
    draw3d(S){ S.stDraw(); }, hud(S, c){ S.stHud(c); } },

  /* 7) TOP SEKTİRME */
  sektir:{ tip:'Top yere yaklaşırken halka yeşile döner: o anda ⚽ bas. Her 10 vuruşta top hızlanır!',
    init(S){ S.p = newP(0, 0); S.p.yaw = Math.PI / 2; S.B = newBall(.3, 0); S.B.y = .4; S.jv = 0; S.lives = S.P.lives; S.score = 0; S.sub = 'up'; S.coach = [3, -5, yawTo(-3, 5)];
      S.bt = 0; S.period = 1.1; S.kickT = 0; S.camPos.set(-1.5, 1.6, -5.2); S.camLook.set(0, 1.1, 0);
      S.miss = () => { S.lives--; S.sub = 'drop'; S.stT = 1.1; S.B.free = true; S.B.vx = rand(-1, 1); S.B.vz = rand(-1, 1); S.B.vy = 1; SFX.ooh(); S.msg = S.lives > 0 ? 'Düştü! Kalan can: ' + S.lives : 'Bitti!'; S.msgT = 1.1; }; },
    ctrl(){ showControls('sjug'); fbLabels({ shoot:['⚽', 'VUR'] }); },
    update(S, dt){ const B = S.B, P = S.P, per = Math.max(.62, S.period - Math.floor(S.score / 10) * .07);
      // top: periyodik zıplama; yükseklik ~ 1.4 m
      S.bt += dt; const k = S.bt / per, h = 1.5;
      if (S.sub === 'up'){ B.y = .35 + h * 4 * k * (1 - k); B.x = .32 + Math.sin(S.t * 2) * .05; B.z = Math.cos(S.t * 1.7) * .05; B.rot -= dt * 9;
        const wnd = P.win / per;
        if (took('shoot')){ if (Math.abs(1 - k) < wnd || (k > 1 && k < 1 + wnd)){ S.score++; S.bt = 0; S.p.atk = { m:{ dur:.28, anim:'kick' }, t:.04 }; SFX.ballKick(); vib(12);
            if (S.score % 10 === 0){ wtext(S, S.score + '!', 0, 2.6, 0, '#f2c230', 56); SFX.coin ? SFX.coin() : SFX.ok(); S.cheer = true; setTimeout(() => S.cheer = false, 900); }
            if (S.score >= P.tgt){ S.finish(true); return; } }
          else { S.miss(); } }
        else if (k > 1 + wnd){ S.miss(); } }
      else if (S.sub === 'drop'){ S.stT -= dt; ballPhys(B, dt); if (S.stT <= 0){ if (S.lives <= 0){ S.finish(S.score >= P.tgt); return; } S.sub = 'up'; S.bt = 0; B.free = false; B.vx = B.vz = 0; } }
      camTo(S, -1.6, 1.5, -5.4, 0, 1.0, 0, Math.min(1, dt * 3)); S.focus = { x:0, z:0 };
      S.pose = S.p.atk ? Object.assign(getPose({ animT:S.t, pose:'stand' }), { fl:[1.1, .5], bl:[-.05, -.05], lean:-4 }) : null; },
    hud(S, c){ txt(c, 'Can: ' + '❤'.repeat(Math.max(0, S.lives)) + '   Seri: ' + S.score, 26, 118, 16, '#ffffff', 'left', 'bold', 3);
      if (S.sub === 'up'){ const per = Math.max(.62, S.period - Math.floor(S.score / 10) * .07), k = S.bt / per, wnd = S.P.win / per, good = Math.abs(1 - k) < wnd;
        const p = R3.project(S.B.x, .32, S.B.z); const r = 18 + Math.max(0, 1 - k) * 60; c.lineWidth = 5; c.strokeStyle = good ? '#2ecc71' : 'rgba(255,255,255,.8)';
        c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.stroke(); c.strokeStyle = 'rgba(46,204,113,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, 18, 0, 7); c.stroke(); } },
    draw3d(){} },
};
