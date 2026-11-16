'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   match3d.js
   Gerçek maç (11'e 11): pas · ara pas · orta · şut · sprint / müdahale · değiştir · baskı · kayarak
   rakip takım da pas yapar, atağa kalkar, şut çeker · taç, korner, aut, santra · hızlı taktikler
   ========================================================= */
const FORM = [['GK', -1, 0], ['DF', -.66, -22], ['DF', -.72, -8], ['DF', -.72, 8], ['DF', -.66, 22],
  ['MF', -.3, -15], ['MF', -.38, 0], ['MF', -.3, 15], ['FW', .05, -20], ['FW', .12, 0], ['FW', .05, 20]];
const ME = 9;                                                // oyuncunun kendi futbolcusu: santrfor
const TACTICS = [['kontra', '⚡', 'Kontra'], ['pres', '🔥', 'Pres'], ['kapan', '🛡️', 'Kapan'], ['tiki', '🔁', 'Tiki-taka']];
const FB_ATT = { shoot:['⚽', 'ŞUT'], pass:['➡️', 'PAS'], thru:['⤴️', 'ARA PAS'], lob:['🌙', 'ORTA'], dash:['💨', 'SPRİNT'] };
const FB_DEF = { shoot:['🦶', 'MÜDAHALE'], pass:['🔄', 'DEĞİŞTİR'], thru:['🔥', 'BASKI'], lob:['🛝', 'KAYARAK'], dash:['💨', 'SPRİNT'] };
function fbLabels(set){ for (const k in set){ const [i, t] = set[k]; setBtnHTML(k, '<b>' + i + '</b><i>' + t + '</i>'); } }

function Match3D(def){
  const D = DIFF(), training = !!def.training, prof = playerProfile();
  const M = { kind:training ? 'tesis' : 'stad', game:'match', def, t:0, clock:def.startMin || 0, goals:0, score:(def.score || [0, 0]).slice(), state:'kick', stT:1.6,
    pauseM:false, lost:false, lostT:0, tackles:0, hintT:9, texts:[], conf:[], camPos:new THREE.Vector3(-22, 8, 0), camLook:new THREE.Vector3(0, 0, 0), focus:{ x:0, z:0 },
    fov:44, shake:0, cheer:false, aim:{ tz:0, th:.7 }, power:0, charging:false, tactic:null, tacT:0, msg:'', msgT:0, side:-1, lastMode:'',
    hint:'Joystick: koş · ➡️ PAS · ⤴️ ARA PAS · 🌙 ORTA · ⚽ basılı tut: ŞUT · 💨 basılı: sprint, dokun: çalım. Topu kaybedince tuşlar savunmaya döner!' };
  const B = M.B = { x:0, y:BR, z:0, vx:0, vy:0, vz:0, owner:null, last:0, rot:0, yaw:0, flight:null, held:false };
  const teams = M.teams = [[], []];
  // takım arkadaşları oyuncunun seçtiği formayı giyer; rakip forma çakışırsa rakip beyaz giyer
  const kit = { shirt:prof.shirt, stripe:prof.stripe, shorts:prof.shorts, socks:prof.socks };
  const kk = JSON.stringify(kit); if (!Match3D.kc || Match3D.kc.k !== kk) Match3D.kc = { k:kk, a:Object.assign({}, LOOK.mate, kit, { __sig:null }), b:Object.assign({}, LOOK.mate2, kit, { __sig:null }) };
  const mateA = Match3D.kc.a, mateB = Match3D.kc.b;
  const reddish = h => { const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return r > 150 && g < 110 && b < 110; };
  const clash = reddish(prof.shirt);
  if (!Match3D.away) Match3D.away = [Object.assign({}, LOOK.rival, { shirt:'#f4f4f4', stripe:'#c0392b', shorts:'#c0392b', socks:'#f4f4f4', __sig:null }), Object.assign({}, LOOK.rival2, { shirt:'#f4f4f4', stripe:'#c0392b', shorts:'#c0392b', socks:'#f4f4f4', __sig:null })];
  const rivA = clash ? Match3D.away[0] : LOOK.rival, rivB = clash ? Match3D.away[1] : LOOK.rival2;
  const looks = [[LOOK.keeper, mateA, mateB], [LOOK.keeper2, rivA, rivB]];
  for (let t = 0; t < 2; t++) FORM.forEach(([role, fx, fz], i) => {
    const look = t === 0 && i === ME ? LOOK.issem : role === 'GK' ? looks[t][0] : looks[t][1 + (i % 2)];
    const p = { t, i, role, fx, fz, look, x:0, z:0, y:0, vx:0, vz:0, yaw:t ? Math.PI : 0, animT:Math.random() * 3, sp:0, down:0, slideT:0, kick:0, burst:0, burstCd:0,
      num:t === 0 && i === ME ? prof.num : t === 0 ? [1, 2, 4, 5, 3, 6, 8, 14, 7, 9, 11, 17, 23][i] === prof.num ? 99 - i : [1, 2, 4, 5, 3, 6, 8, 14, 7, 9, 11][i] : [1, 2, 4, 5, 3, 6, 8, 10, 7, 9, 11][i], wind:0, tackleCd:0, base:role === 'FW' ? 6.1 : role === 'MF' ? 5.8 : 5.5 };
    if (role === 'GK') Object.assign(p, newKeeper(t === 0 ? -1 : 1));
    teams[t].push(p); });
  const all = [...teams[0], ...teams[1]], me = teams[0][ME];
  let ctrl = me, switchLock = 0, passRecv = null, decT = 0;
  const ctrlUI = () => { showControls('foot'); M.lastMode = ''; }; ctrlUI(); playMusic('football'); crowdAmb(true, training ? .06 : .15);
  const dirOf = t => t === 0 ? 1 : -1;
  const spd = p => (p === me ? P_SPEED() : p.base * (p.t === 1 ? (training ? .86 : .93) * D.aggr : 1)) * (p.t === 0 && p !== me ? .97 : 1);
  function say2(t){ M.msg = t; M.msgT = 1.6; }
  function placeKickoff(team){
    for (const tt of teams) for (const p of tt){ const d = dirOf(p.t); if (p.role === 'GK'){ Object.assign(p, newKeeper(p.g)); continue; }
      p.x = d * Math.min(p.t === team ? -1.5 : -9.6, p.fx * 46 * .55 - 2); p.z = p.fz * .9; p.vx = p.vz = 0; p.down = 0; p.slideT = 0; p.wind = 0; p.yaw = p.t ? Math.PI : 0; }
    const k = teams[team][ME]; k.x = -dirOf(team) * .6; k.z = 0; B.x = 0; B.z = 0; B.y = BR; B.vx = B.vy = B.vz = 0; B.flight = null; B.held = false; give(k);
    M.state = 'kick'; M.stT = 1.4; M.shot = null; M.charging = false; passRecv = null;
  }
  function give(p){ B.owner = p; B.last = p.t; B.flight = null; B.held = false; passRecv = null; if (p.t === 0 && p.role !== 'GK'){ ctrl = p; } p.wind = 0; }
  placeKickoff(def.score && def.score[1] > def.score[0] ? 0 : 0);
  function restartM(){ stats.retries++; crowdAmb(false); cur = Match3D(def); }
  function lose(msg){ M.lost = true; M.lostT = 0; M.loseMsg = msg; showControls(null); SFX.lose(); crowdLevel(.06); }

  /* ---------- top hareketleri ---------- */
  function kickBall(p, tx, tz, kind, recv){
    const dx = tx - B.x, dz = tz - B.z, d = Math.hypot(dx, dz) || 1;
    let v, vy;
    if (kind === 'lob'){ const T = .55 + d / 19; v = d / T; vy = 9.8 * T / 2; }
    else { v = clamp(d * 1.05 + 6, 9, 24); vy = kind === 'clear' ? 7 : 0; if (kind === 'clear') v = 22; }
    B.owner = null; B.vx = dx / d * v; B.vz = dz / d * v; B.vy = vy; B.y = BR + .02; B.last = p.t; B.flight = { kind, by:p, t:0, tried:new Set([p]) };
    passRecv = recv || null; if (recv){ recv.runTo = { x:tx, z:tz }; }
    p.kick = .42; (kind === 'lob' ? SFX.lobKick : kind === 'clear' ? SFX.ballKick : SFX.pass)();
  }
  function bestMate(p, ux, uz, ahead){
    let best = null, bs = -1e9;
    for (const q of teams[p.t]){ if (q === p || q.down > 0) continue; if (q.role === 'GK' && !ahead && p.role !== 'DF') continue;
      const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d < 4 || d > 42) continue;
      const cos = (dx * ux + dz * uz) / d; if (cos < .2) continue;
      let open = 0; for (const o of teams[1 - p.t]){ const od = Math.hypot(o.x - q.x, o.z - q.z); if (od < 4) open -= (4 - od) * 2; }
      const s = cos * 12 - d * .12 + open + (ahead ? dirOf(p.t) * dx * .15 : 0); if (s > bs){ bs = s; best = q; } }
    return best;
  }
  function inDir(p){ const I = f3Input(); if (I.m > .2){ const l = Math.hypot(I.iy, I.ix); return [I.iy / l, I.ix / l]; } return [Math.cos(p.yaw), -Math.sin(p.yaw)]; }
  function doPass(p, kind){
    const [ux, uz] = inDir(p);
    if (kind === 'lob' && p.t === 0 && p.x > GL - 30 && Math.abs(p.z) > 10){ // orta: ceza sahasındaki arkadaşa
      const box = teams[0].filter(q => q !== p && q.x > GL - 20 && Math.abs(q.z) < 12); const q = box.sort((a, b) => Math.abs(a.z) - Math.abs(b.z))[0];
      if (q){ kickBall(p, q.x + 1.5, q.z * .6, 'lob', q); say2('ORTA!'); return; } }
    const q = bestMate(p, ux, uz, kind === 'thru');
    if (!q){ const d = kind === 'lob' ? 22 : 14; kickBall(p, p.x + ux * d, p.z + uz * d, kind === 'lob' ? 'lob' : 'ground', null); return; }
    if (kind === 'thru'){ const d = dirOf(p.t); const tx = clamp(q.x + d * 9, -GL + 3, GL - 3), tz = clamp(q.z + uz * 3, -32, 32); kickBall(p, tx, tz, 'ground', q); if (p.t === 0) say2('ARA PAS!'); }
    else kickBall(p, q.x + q.vx * .35, q.z + q.vz * .35, kind, q);
  }
  /* ---------- şut ---------- */
  function shootUs(){
    const p = ctrl; B.x = p.x + Math.cos(p.yaw) * .5; B.z = p.z - Math.sin(p.yaw) * .5;
    M.shot = f3Shot(B, M.aim, M.power, { curl:.35, acc:p === me ? PST('sut') : .5 }); const K = teams[1][0];
    f3Resolve(M.shot, K, { keeperMul:training ? .8 : 1 }); keeperDive(K, M.shot.dive || { z:K.z, y:1, react:.3 }, M.shot); setTimeout(() => SFX.dive(), 380); SFX.anticip();
    B.owner = null; B.last = 0; M.state = 'shot'; p.kick = .42; SFX.ballKick(); vib(30); M.charging = false; M.shooter = p;
  }
  function shootThem(p){
    const aim = { tz:(Math.random() < .5 ? -1 : 1) * rand(1.2, 3.2), th:rand(.3, 1.9) };
    M.shot = f3Shot({ x:B.x, z:B.z }, aim, rand(.55, .85), { side:-1, acc:.42 + D.aggr * .08, curl:.3 }); const K = teams[0][0];
    f3Resolve(M.shot, K, { keeperMul:1.25 / D.aggr }); keeperDive(K, M.shot.dive || { z:K.z, y:1, react:.3 }, M.shot);
    B.owner = null; B.last = 1; M.state = 'shot'; p.kick = .42; SFX.ballKick(); M.shooter = p; say2('RAKİP ŞUT!');
  }
  function shotEvent(){
    const Sh = M.shot, q = shotPos(Sh, Sh.kev), q0 = shotPos(Sh, Math.max(0, Sh.kev - .02)), k = 1 / (.02 * Sh.dur), ev = Sh.ev, ours = Sh.side > 0;
    B.x = q.x; B.y = q.y; B.z = q.z; B.vx = (q.x - q0.x) * k; B.vy = (q.y - q0.y) * k; B.vz = (q.z - q0.z) * k; B.flight = { kind:'shot', t:0, tried:new Set(all) };
    const K = teams[ours ? 1 : 0][0];
    if (ev === 'goal'){ M.state = 'goal'; M.stT = ours ? 3.6 : 2.4; f3Net(M, Sh.side); M.inNet = Sh.side; SFX.net(); M.shake = 9;
      if (ours){ M.goals++; M.score[0]++; SFX.goal(); SFX.airhorn(); crowdLevel(.38); vib([80, 60, 200]); M.cheer = true; wtext(M, 'GOOOOL!', GL - 3, 3.4, B.z * .4, '#f2c230', 88);
        say(M.shooter === me ? nm(pick(['Gol! Gol! Issem!', 'Muhteşem bir gol! Issem!'])) : pick(['Gol! Harika bir takım golü!', 'Ağlar havalandı!']), 'Spiker'); confetti(M, 120);
        M.scorer = M.shooter; M.cx = clamp(M.shooter.x + 3, -40, GL - 6); M.cz = clamp(M.shooter.z, -20, 20); M.ct = 0; }
      else { M.score[1]++; SFX.boo(); wtext(M, 'RAKİP GOL ATTI!', -GL + 3, 3.2, B.z * .4, '#ff6b6b', 50); say('Rakip gol attı!', 'Spiker'); crowdLevel(.06); }
      return; }
    M.state = 'play'; M.inNet = 0; SFX.ooh(); let msg = 'AUT!';
    if (ev === 'catch'){ B.vx = B.vy = B.vz = 0; K.hold = true; give(K); K.holdT = .35; SFX.gloveCatch(); if (ours) SFX.ooh(); else SFX.applause(); msg = 'KALECİ YAKALADI!'; }
    else if (ev === 'parry'){ B.vx = -Sh.side * 3.5; B.vy = 3.4; B.vz = (Math.sign(B.z - K.z) || 1) * 5.5; SFX.glovePunch(); if (!ours) SFX.applause(); msg = 'KALECİ ÇELDİ!'; }
    else if (ev === 'post' || ev === 'bar'){ B.vx = -Sh.side * 5.5; B.vy = ev === 'bar' ? 3 : 1.4; B.vz = -Math.sign(B.z) * 2.4; SFX.post(); msg = ev === 'bar' ? 'ÜST DİREK!' : 'DİREK!'; M.shake = 4; }
    else { msg = ev === 'over' ? 'ÜSTTEN AUT!' : 'AUT!'; goalKick(ours ? 1 : 0); }
    wtext(M, msg, Sh.side * (GL - 2), 3.2, B.z * .5, '#ffffff', 44);
    if (!ours && (ev === 'catch' || ev === 'parry')) wtext(M, 'KURTARIŞ!', -GL + 4, 2.6, 0, '#7dff9a', 34);
    say(ev === 'catch' || ev === 'parry' ? pick(['Kurtarış!', 'Kaleci gol vermiyor!']) : ev === 'post' || ev === 'bar' ? 'Direkten döndü!' : pick(['Az farkla dışarıda.', 'Aut.']), 'Spiker');
  }
  function goalKick(team){ SFX.shortWhistle(); const K = teams[team][0]; K.z = 0; K.x = K.g * (GL - 2); B.x = K.x - K.g * .5; B.z = 0; B.vx = B.vy = B.vz = 0; give(K); K.holdT = .5; say2('AUT ATIŞI'); SFX.whistle(); }
  /* ---------- taç / korner ---------- */
  function outOfPlay(){
    if (Math.abs(B.z) > 34.2){ const team = 1 - B.last; const z = Math.sign(B.z) * 33.4, x = clamp(B.x, -GL + 2, GL - 2);
      restartAt(team, x, z, 'TAÇ'); return true; }
    if (Math.abs(B.x) > GL + .2 && !(Math.abs(B.z) < GW && B.y < GH)){ const s = Math.sign(B.x), defTeam = s > 0 ? 1 : 0;
      if (B.last === defTeam) restartAt(1 - defTeam, s * (GL - .8), Math.sign(B.z || 1) * 33.2, 'KORNER'); else goalKick(defTeam); return true; }
    return false;
  }
  function restartAt(team, x, z, what){
    B.x = x; B.z = z; B.y = BR; B.vx = B.vy = B.vz = 0; B.flight = null;
    let best = null, bd = 1e9; for (const p of teams[team]) if (p.role !== 'GK'){ const d = Math.hypot(p.x - x, p.z - z); if (d < bd){ bd = d; best = p; } }
    best.x = x - Math.sign(z) * 0 - dirOf(team) * .4; best.z = z - Math.sign(z) * .5; give(best); best.holdT = .9; say2(what); SFX.shortWhistle(); if (what === 'KORNER' && team === 0) SFX.anticip(); say(what === 'KORNER' ? 'Korner.' : 'Taç.', 'Spiker');
  }
  /* ---------- güncelle ---------- */
  M.update = dt => {
    if (M.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ M.pauseM = false; ctrlUI(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restartM(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)){ crowdAmb(false); toCover(); } } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !M.lost){ M.pauseM = true; showControls(null); return; }
    if (tap && !M.lost) TACTICS.forEach(([k], i) => { if (inB({ x:376 + i * 74, y:8, w:68, h:42 }, tap)){ M.tactic = M.tactic === k ? null : k; M.tacT = 2; SFX.click(); say2(M.tactic ? TACTICS[i][2].toUpperCase() + '!' : 'NORMAL TAKTİK'); } });
    M.t += dt; if (M.hintT > 0) M.hintT -= dt; if (M.msgT > 0) M.msgT -= dt; M.shake *= Math.pow(.02, dt); if (switchLock > 0) switchLock -= dt;
    for (const t of M.texts) t.t += dt; M.texts = M.texts.filter(t => t.t < 1.8);
    if (M.lost){ M.lostT += dt; if (tap && M.lostT > .8) restartM(); return; }
    const live = M.state === 'play' || M.state === 'kick';
    if (def.time && live){ M.clock = Math.min(90, M.clock + dt * (90 - (def.startMin || 0)) / def.time);
      if (M.clock >= 90){ SFX.longWhistle(); if (M.goals >= def.need && M.score[0] > M.score[1]){ M.state = 'won'; M.stT = 2.4; confetti(M, 80); } else lose(M.score[0] > M.score[1] ? 'Yeterli gol yok!' : 'Maç bitti!'); return; } }
    for (const p of all){ p.animT += dt; if (p.kick > 0) p.kick -= dt; if (p.down > 0) p.down -= dt; if (p.burstCd > 0) p.burstCd -= dt; if (p.tackleCd > 0) p.tackleCd -= dt; if (p.holdT > 0) p.holdT -= dt; }
    keeperUpd(teams[0][0], dt); keeperUpd(teams[1][0], dt);
    // tuş etiketleri: hücum / savunma
    const attack = (B.owner && B.owner.t === 0) || (!B.owner && B.last === 0 && B.flight);
    const mode = attack ? 'att' : 'def'; if (mode !== M.lastMode){ M.lastMode = mode; fbLabels(attack ? FB_ATT : FB_DEF); }
    if (M.state === 'kick'){ M.stT -= dt; if (M.stT <= 0){ M.state = 'play'; SFX.whistle(); } }
    else if (M.state === 'play') play(dt);
    else if (M.state === 'shot'){ const Sh = M.shot; Sh.t += dt; const k = Sh.t / Sh.dur;
      if (k < Sh.kev){ const q = shotPos(Sh, k); B.x = q.x; B.y = q.y; B.z = q.z; B.yaw = yawTo(Sh.tx - Sh.x0, Sh.tz - Sh.z0); B.rot -= dt * 40; } else shotEvent();
      for (const p of all) if (p.role !== 'GK'){ p.vx *= .9; p.vz *= .9; p.sp = Math.hypot(p.vx, p.vz); p.x += p.vx * dt; p.z += p.vz * dt; } }
    else if (M.state === 'goal'){ M.stT -= dt; M.ct = (M.ct || 0) + dt; ballPhys(B, dt, M.inNet); if (M.stT < 1.2){ crowdLevel(.15); M.cheer = false; }
      if (M.stT <= 0){ const ours = M.inNet > 0; M.inNet = 0;
        if (training && M.goals >= def.need){ M.state = 'won'; M.stT = 2.2; SFX.longWhistle(); confetti(M, 80); } else placeKickoff(ours ? 1 : 0); } }
    else if (M.state === 'won'){ M.stT -= dt; if (M.stT <= 0){ stats.lvls++; stats.dmg += Math.min(1, M.tackles * .12); stats.tackles += M.tackles; crowdAmb(false); next(); return; } }
    if (B.owner && B.owner.role === 'GK' && M.state === 'play'){ const K = B.owner; B.x = K.x - K.g * .45; B.y = K.y + 1.1; B.z = K.z; }
    // kamera
    if (M.state === 'goal' && M.inNet > 0 && M.scorer){ const a = M.ct * .5 - 1.2, r = 7.5; camTo(M, M.cx + Math.cos(a) * r, 2.6, M.cz + Math.sin(a) * r, M.cx, 1.1, M.cz, Math.min(1, dt * 2.5)); }
    else { const fx = M.state === 'shot' && M.shooter ? lerp(M.shooter.x, B.x, .5) : B.x, fz = B.z, near = clamp((fx - (GL - 30)) / 30, 0, 1), nearO = clamp((-(GL - 24) - fx) / 24, 0, 1);
      camTo(M, Math.max(-GL + 1.5, fx - 9.5 + near * 1.5), 5.6 - near * .9 + nearO * 3.8, fz * .7, Math.min(GL + 2, fx + 7 * (1 - nearO) + near * 4), .3, fz * .85, Math.min(1, dt * 3.2)); }
    M.focus = { x:B.x, z:B.z };
  };
  function play(dt){
    const I = f3Input(), own = B.owner, myBall = own && own.t === 0, theirBall = own && own.t === 1;
    // kontrol edilen oyuncu seçimi
    if (myBall && own.role !== 'GK') ctrl = own;
    else if (!myBall && switchLock <= 0){ let best = null, bd = 1e9; const bx = B.x + B.vx * .3, bz = B.z + B.vz * .3;
      for (const p of teams[0]) if (p.role !== 'GK' && p.down <= 0){ const d = Math.hypot(p.x - bx, p.z - bz); if (d < bd){ bd = d; best = p; } }
      if (best && best !== ctrl && (!passRecv || passRecv.t !== 0)) { const cd = Math.hypot(ctrl.x - bx, ctrl.z - bz); if (bd < cd - 2.5) ctrl = best; }
      if (passRecv && passRecv.t === 0) ctrl = passRecv; }
    const c = ctrl;
    // kullanıcı girişi
    const sprint = !!keys.dash;
    if (took('dash') && c.burstCd <= 0){ c.burst = .28; c.burstCd = 1.0 - (c === me ? PST('calim') * .35 : 0); SFX.dash(); }
    if (c.burst > 0) c.burst -= dt;
    if (c.down <= 0 && !(c.role === 'GK')){
      let tvx, tvz; const s = spd(c) * (sprint ? 1.3 : 1) * (c.burst > 0 ? 1.45 : 1) * (myBall && own === c ? .93 : 1);
      if (!myBall && keys.thru && own){ const dx = own.x - c.x, dz = own.z - c.z, l = Math.hypot(dx, dz) || 1; tvx = dx / l * s; tvz = dz / l * s; }  // BASKI
      else if (M.charging){ tvx = Math.cos(c.yaw) * .9; tvz = -Math.sin(c.yaw) * .9; }
      else { tvx = I.iy * s; tvz = I.ix * s; }
      if (c.slideT > 0){ c.slideT -= dt; const v = 9 * Math.min(1, c.slideT * 3 + .25); tvx = Math.cos(c.yaw) * v; tvz = -Math.sin(c.yaw) * v; c.vx = tvx; c.vz = tvz; }
      else { c.vx = lerp(c.vx, tvx, Math.min(1, dt * 9)); c.vz = lerp(c.vz, tvz, Math.min(1, dt * 9)); }
      if (Math.hypot(c.vx, c.vz) > .8 && c.slideT <= 0 && !M.charging) c.yaw = angLerp(c.yaw, yawTo(c.vx, c.vz), Math.min(1, dt * 12));
      c.x = clamp(c.x + c.vx * dt, -GL - .5, GL + .5); c.z = clamp(c.z + c.vz * dt, -34.5, 34.5); c.sp = Math.hypot(c.vx, c.vz);
    }
    if (myBall && own === c && !(c.holdT > 0)){
      if (M.charging){ M.aim.tz = clamp(M.aim.tz + I.ix * dt * 4.2, -4.6, 4.6); M.aim.th = clamp(M.aim.th + I.iy * dt * 2.1, .12, 3.0); M.power = Math.min(1, M.power + dt * .95);
        c.yaw = angLerp(c.yaw, yawTo(GL - c.x, M.aim.tz - c.z), Math.min(1, dt * 8)); if (!keys.shoot){ shootUs(); return; } }
      else if (keys.shoot && took('shoot')){ M.charging = true; M.power = 0; M.aim = { tz:clamp(-c.z * .25, -2.6, 2.6) + (c.z > 0 ? -1.6 : 1.6), th:.7 }; }
      else if (took('pass')) doPass(c, 'ground');
      else if (took('thru')) doPass(c, 'thru');
      else if (took('lob')) doPass(c, 'lob');
    } else if (!myBall){
      if (took('pass')){ let best = null, bd = 1e9; for (const p of teams[0]) if (p !== c && p.role !== 'GK'){ const d = Math.hypot(p.x - B.x, p.z - B.z); if (d < bd){ bd = d; best = p; } } if (best){ ctrl = best; switchLock = 1.2; SFX.click(); } }
      if (took('lob') && c.slideT <= 0 && c.down <= 0){ c.slideT = .5; if (own) c.yaw = yawTo(own.x - c.x, own.z - c.z); SFX.slide(); }
      if (took('shoot') && own && own.t === 1 && c.tackleCd <= 0){ c.tackleCd = .6; c.kick = .35; const d = Math.hypot(own.x - c.x, own.z - c.z);
        if (d < 1.7 && Math.random() < (.38 + (c === me ? PST('guc') * .25 : .1)) / Math.sqrt(D.aggr)){ own.down = .5; give(c); SFX.tackleHit(); SFX.applause(); vib(30); wtext(M, 'TOPU KAPTIN!', c.x, 2.6, c.z, '#7dff9a', 30); } else SFX.whiff(); }
      if (c.slideT > 0 && own && own.t === 1 && Math.hypot(own.x - (c.x + Math.cos(c.yaw) * .7), own.z - (c.z - Math.sin(c.yaw) * .7)) < 1.2){ own.down = 1; give(c); SFX.tackleHit(); vib(40); SFX.applause(); wtext(M, 'KAYARAK ALDIN!', c.x, 2.6, c.z, '#7dff9a', 32); }
    }
    // yapay zekâ
    const poss = own ? own.t : B.last;
    for (const t of [0, 1]){ const d = dirOf(t), team = teams[t];
      const bf = B.x * d, mine = poss === t;
      let line = clamp(bf * .55 + (mine ? 9 : -5), -26, 30);
      const tac = t === 0 ? M.tactic : (D.aggr > 1.1 ? 'pres' : null);
      if (tac === 'pres') line += mine ? 2 : 8; if (tac === 'kapan') line -= 10; if (tac === 'kontra' && mine) line += 6;
      const tight = tac === 'tiki' && mine ? .7 : 1;
      // baskı yapanlar
      const chasers = []; if (!mine || !own){ const sorted = team.filter(p => p.role !== 'GK' && p !== ctrl && p.down <= 0).sort((a, b) => Math.hypot(a.x - B.x, a.z - B.z) - Math.hypot(b.x - B.x, b.z - B.z));
        chasers.push(...sorted.slice(0, (t === 0 ? 1 : 2 + (D.aggr > 1 ? 1 : 0) - (training ? 1 : 0)) + (tac === 'pres' ? 1 : 0) - (tac === 'kapan' ? 1 : 0) + (!own ? 1 : 0))); }
      for (const p of team){
        if (p.role === 'GK'){ gkAI(p, dt); continue; }
        if (p === ctrl && t === 0) continue;
        if (p.down > 0){ p.vx = p.vz = 0; p.sp = 0; continue; }
        if (own === p){ if (t === 1) carrierAI(p, dt); continue; }
        let tx, tz, sp = spd(p);
        if (p.runTo && passRecv === p && B.flight){ tx = p.runTo.x; tz = p.runTo.z; sp *= 1.1; }
        else if (chasers.includes(p)){ tx = B.x + B.vx * .3; tz = B.z + B.vz * .3; sp *= tac === 'pres' ? 1.05 : .98; }
        else { let fx = p.fx * 46 * .62 * tight + line, fz = p.fz * .95 * tight + B.z * .22;
          if (mine && p.role === 'FW'){ fx = Math.max(fx, bf + 6 + (tac === 'kontra' ? 8 : 0)); }
          if (mine && t === 0 && p.role === 'FW' && own === ctrl) fx += Math.sin(M.t * .7 + p.i) * 2;
          tx = d * clamp(fx, -48, 48); tz = clamp(fz, -31, 31); }
        const dx = tx - p.x, dz = tz - p.z, dl = Math.hypot(dx, dz);
        const v = dl < .5 ? 0 : Math.min(sp, dl * 2.2);
        p.vx = lerp(p.vx, dl ? dx / dl * v : 0, Math.min(1, dt * 5)); p.vz = lerp(p.vz, dl ? dz / dl * v : 0, Math.min(1, dt * 5));
        p.x += p.vx * dt; p.z += p.vz * dt; p.sp = Math.hypot(p.vx, p.vz);
        if (p.sp > .6) p.yaw = angLerp(p.yaw, yawTo(p.vx, p.vz), Math.min(1, dt * 8)); else p.yaw = angLerp(p.yaw, yawTo(B.x - p.x, B.z - p.z), Math.min(1, dt * 4));
        // rakip savunma: bizim topçuya müdahale (kırmızı halka uyarısı)
        if (t === 1 && own && own.t === 0 && chasers.includes(p)){ const od = Math.hypot(own.x - p.x, own.z - p.z);
          if (p.wind > 0){ p.wind -= dt; p.vx *= .3; p.vz *= .3; if (p.wind <= 0){ p.kick = .35; p.tackleCd = 1.2;
              if (Math.hypot(own.x - p.x, own.z - p.z) < 1.8 && own.burst <= 0){ M.tackles++; SFX.tackleHit(); SFX.ooh(); vib(90); M.shake = 6; wtext(M, 'TOP KAPTIRILDI!', own.x, 2.6, own.z, '#ff6b6b', 30); own.down = .45; M.charging = false; give(p); }
              else { SFX.whiff(); if (own.burst > 0) wtext(M, 'ÇALIM!', own.x, 2.6, own.z, '#7dff9a', 30); } } }
          else if (od < 2.6 && p.tackleCd <= 0 && M.state === 'play'){ p.wind = .42 / D.aggr * (training ? 1.35 : 1); } }
        // bizim yapay zekâ: rakip topçuya müdahale
        if (t === 0 && own && own.t === 1 && chasers.includes(p) && p.tackleCd <= 0 && Math.hypot(own.x - p.x, own.z - p.z) < 1.4){ p.tackleCd = 1.3; p.kick = .35;
          if (Math.random() < .3 / D.aggr){ own.down = .5; give(p); SFX.kick(); wtext(M, 'TOP BİZDE!', p.x, 2.6, p.z, '#7dff9a', 28); } }
      }
    }
    // top
    if (B.owner && B.owner.t === 0 && B.owner.sp > 1.5){ M.touchT = (M.touchT || 0) - dt; if (M.touchT <= 0){ SFX.touch(); M.touchT = B.owner.sp > 6.5 ? .28 : .4; } }
    M.chantT = (M.chantT || 18) - dt; if (M.chantT <= 0 && !training){ SFX.chant(); M.chantT = rand(18, 30); }
    if (B.owner && B.owner.t === 0 && B.owner.x > GL - 24 && !M.antic){ M.antic = true; SFX.anticip(); crowdLevel(.24); } else if (!(B.owner && B.owner.t === 0 && B.owner.x > GL - 24) && M.antic){ M.antic = false; crowdLevel(training ? .06 : .15); }
    if (B.owner && B.owner.role !== 'GK'){ const o = B.owner, lead = .5 + Math.abs(Math.sin(o.animT * 6)) * .22 * Math.min(1, o.sp / 5);
      B.x = o.x + Math.cos(o.yaw) * lead; B.z = o.z - Math.sin(o.yaw) * lead; B.y = BR; B.yaw = o.yaw; B.rot -= o.sp * dt / BR; B.vx = o.vx; B.vz = o.vz; B.vy = 0; }
    else if (!B.owner){ freeBall(dt); }
    if (!B.owner && outOfPlay()) return;
    if (B.owner) for (const p of all) if (p !== B.owner && p.role !== 'GK'){ const dx = p.x - B.owner.x, dz = p.z - B.owner.z, dl = Math.hypot(dx, dz); if (dl < .8 && dl > 0){ p.x += dx / dl * (.8 - dl) * .5; p.z += dz / dl * (.8 - dl) * .5; } }
  }
  function freeBall(dt){
    B.vy -= 9.8 * dt; B.x += B.vx * dt; B.y += B.vy * dt; B.z += B.vz * dt;
    if (B.y < BR){ B.y = BR; if (B.vy < -1.5){ SFX.bounce(Math.min(1, -B.vy / 8)); B.vy = -B.vy * .45; } else B.vy = 0; }
    if (B.y <= BR + .01){ const f = Math.pow(.42, dt); B.vx *= f; B.vz *= f; }
    const sp = Math.hypot(B.vx, B.vz); if (sp > .1){ B.yaw = yawTo(B.vx, B.vz); B.rot -= sp * dt / BR; }
    if (B.flight) B.flight.t += dt;
    // kim alır?
    for (const p of all){ if (p.down > 0 || p.role === 'GK') continue; const d = Math.hypot(p.x - B.x, p.z - B.z);
      const isRecv = p === passRecv, r = isRecv ? 1.1 : .8;
      if (d < r && B.y < (isRecv ? 2.3 : 1.2)){
        if (B.flight && B.flight.by && B.flight.by.t === p.t && !isRecv && B.flight.t < .25) continue;
        if (B.flight && B.flight.by && B.flight.by.t !== p.t && !isRecv){ if (B.flight.tried.has(p)) continue; B.flight.tried.add(p); const ch = (p.t === 0 ? (p === ctrl ? .75 : .45) : .38 * D.aggr) * (1 - Math.min(.6, sp / 40)); if (Math.random() > ch) continue; }
        give(p); (B.y > 1.3 ? SFX.header : SFX.trap)(); return; } }
  }
  function gkAI(K, dt){
    if (B.owner === K){ K.hold = true; if (!(K.holdT > 0) && K.st === 'ready'){ K.hold = false; const t = K.t, opp = teams[1 - t];
        // hızlı oyun: en açıktaki arkadaşa elle at / kısa pas
        let q = null, bs = -1e9; for (const m of teams[t]){ if (m.role === 'GK' || m.down > 0) continue; const d = Math.hypot(m.x - K.x, m.z - K.z); if (d > 38) continue;
          let open = 0; for (const o of opp){ const od = Math.hypot(o.x - m.x, o.z - m.z); if (od < 6) open -= (6 - od) * 2; } const sc = open - d * .08 + (m.role === 'MF' ? 1.5 : 0); if (sc > bs){ bs = sc; q = m; } }
        q = q || teams[t][2]; B.x = K.x + dirOf(t) * .8; B.y = 1.2; const d = Math.hypot(q.x - K.x, q.z - K.z);
        kickBall(K, q.x + q.vx * .3, q.z + q.vz * .3, d > 22 ? 'lob' : 'ground', q); K.kick = .4; say2(d > 22 ? 'KALECİ UZUN ATTI' : 'KALECİ HIZLI ATTI'); } return; }
    if (K.st !== 'ready' || M.state !== 'play') return;
    const bd = Math.hypot(K.g * GL - B.x, B.z);
    K.z = lerp(K.z, clamp(B.z * .28, -2.4, 2.4), Math.min(1, dt * 3)); K.x = lerp(K.x, K.g * (GL - .55 - (bd < 16 ? (16 - bd) * .14 : 0)), Math.min(1, dt * 2));
    if (!B.owner && bd < 7 && Math.hypot(K.x - B.x, K.z - B.z) < 2.2 && B.y < 2){ give(K); K.holdT = .35; SFX.punch(); say2('KALECİ ALDI'); }
    const o = B.owner; if (o && o.t !== K.t && Math.hypot(K.x - o.x, K.z - o.z) < 1.5){ give(K); K.holdT = .35; SFX.punch(); say2('KALECİ KAPTI!'); }
  }
  function carrierAI(p, dt){
    if (p.holdT > 0){ p.vx = p.vz = 0; p.sp = 0; p.yaw = yawTo(-1, -p.z * .02); if (p.holdT < .1){ p.holdT = 0; doPass(p, Math.random() < .4 ? 'lob' : 'ground'); } return; }
    const gx = -GL, s = spd(p) * .95;
    let tx = gx, tz = -p.z * .5; const press = teams[0].filter(q => Math.hypot(q.x - p.x, q.z - p.z) < 3.4).length;
    for (const q of teams[0]){ const dx = q.x - p.x, dz = q.z - p.z, dl = Math.hypot(dx, dz); if (dl < 5 && dx < 1){ tz -= Math.sign(dz || 1) * (5 - dl) * 3; } }
    const dx = tx - p.x, dz = tz - p.z, dl = Math.hypot(dx, dz) || 1;
    p.vx = lerp(p.vx, dx / dl * s, Math.min(1, dt * 5)); p.vz = lerp(p.vz, dz / dl * s, Math.min(1, dt * 5)); p.x += p.vx * dt; p.z = clamp(p.z + p.vz * dt, -33, 33); p.sp = Math.hypot(p.vx, p.vz); p.yaw = yawTo(p.vx, p.vz);
    decT -= dt; if (decT > 0) return; decT = rand(.45, .8);
    const distG = Math.hypot(-GL - p.x, p.z);
    if (distG < 23 && Math.abs(p.z) < 18 && Math.random() < .5){ shootThem(p); return; }
    if ((press && Math.random() < .7) || Math.random() < .2){ const q = bestMate(p, -1, 0, Math.random() < .4); if (q) kickBall(p, q.x + q.vx * .3, q.z + q.vz * .3, Math.hypot(q.x - p.x, q.z - p.z) > 26 ? 'lob' : 'ground', q); }
  }

  /* ---------- çizim ---------- */
  M.draw = c => {
    const dt = 1 / 60, teamsN = def.teams || ['ANL', 'RKP'];
    M.screen = [teamsN[0], M.score[0] + '-' + M.score[1], teamsN[1], def.time ? Math.floor(M.clock) + "'" : 'HAZIRLIK'];
    if (!f3Begin(M, dt)){ c.fillStyle = '#000'; c.fillRect(0, 0, W, H); txt(c, '3B grafik desteklenmiyor', 480, 270, 24, '#fff', 'center'); return; }
    for (const p of all){
      const id = (p.t ? 'a' : 'h') + p.i;
      if (p.role === 'GK'){ drawKeeper(p, M.state === 'goal' && M.inNet === -p.g ? 'sad' : 'angry', id, p.look); continue; }
      let P; const celebrating = M.state === 'goal' && M.inNet > 0;
      if (celebrating && p === M.scorer) P = celebPose(M, p, M.ct);
      else if (celebrating && p.t === 0 && Math.hypot(p.x - M.cx, p.z - M.cz) < 12) P = getPose({ animT:p.animT, pose:'cheer' });
      else if (M.state === 'won') P = getPose({ animT:p.animT, pose:p.t === 0 ? 'cheer' : 'sad' });
      else if (p.down > 0) P = getPose({ pose:'lie' });
      else if (p.slideT > 0) P = getPose({ slide:1 });
      else if (p.kick > 0) P = getPose({ animT:p.animT, atk:{ m:{ dur:.42, anim:'shoot' }, t:.42 - p.kick } });
      else if (p.wind > 0) P = getPose({ animT:p.animT, wind:1, T:{ kick:1 } });
      else if (p === ctrl && M.charging) P = Object.assign(getPose({ animT:M.t, pose:'stand' }), { lean:6, fl:[.3, .05], bl:[-.3, -.3] });
      else if (p.burst > 0) P = getPose({ dashing:1 });
      else if (p.sp > .6) P = getPose({ animT:p.animT, vx:p.sp * 100, run:true });
      else P = getPose({ animT:p.animT, pose:'stand' });
      const flash = p.wind > 0 && Math.floor(p.wind * 14) % 2 === 0;
      R3.charW(id, p.look, P, p.x, p.y || 0, p.z, p.yaw, 1, p.down > 0 ? 'pain' : (celebrating && p.t === 0) ? 'happy' : 'angry', false, null, { tint:flash ? '#ff3b3b' : null, face:p === me ? footFace() : 1 });
      if (p.wind > 0) f3Ring('ringW' + p.i, p.x, p.z, '#ff3b3b', 1.1 - p.wind, .85);
    }
    if (training) R3.charW('fl', LOOK.leo, getPose({ animT:M.t, pose:'arms' }), clamp(B.x, -40, 40), 0, -36.5, yawTo(0, 1), 1, M.goals ? 'happy' : 'neutral');
    f3Ball(B);
    const live = M.state === 'play' || M.state === 'kick';
    if (live){ f3Ring('ringP', ctrl.x, ctrl.z, '#f2c230', .62 + Math.sin(M.t * 6) * .04);
      if (B.owner === ctrl && !M.charging){ const [ux, uz] = inDir(ctrl); const q = bestMate(ctrl, ux, uz, false); if (q) f3Ring('ringT', q.x, q.z, '#ffffff', .5, .55); }
      if (passRecv && B.flight && passRecv.t === 0) f3Ring('ringR', passRecv.runTo ? passRecv.runTo.x : passRecv.x, passRecv.runTo ? passRecv.runTo.z : passRecv.z, '#7dff9a', .7, .6);
      if (B.owner && B.owner.t === 1) f3Ring('ringC', B.owner.x, B.owner.z, '#ff3b3b', .75, .9); }
    if (M.charging){ const tl = Math.hypot(GL - B.x, M.aim.tz - B.z), ay = yawTo(GL - B.x, M.aim.tz - B.z);
      f3Arrow(B.x, B.z, ay, 1.2 + M.power * Math.min(9, tl * .45), M.power > .85 ? '#ff4a3a' : '#f2c230');
      const err = (1 - PST('sut')) * .5 + tl * .011 + Math.max(0, M.power - .85) * 3.2; f3Reticle(M.aim.th + Math.max(0, M.power - .85) * 2, M.aim.tz, .32 + err * .9, M.power > .85 ? '#ff4a3a' : '#f2c230'); }
    R3.render();
    // 2B üst katman
    if (live) nameTag(c, ctrl.x, 2.25, ctrl.z, ctrl === me ? PNAME : (ctrl.role === 'DF' ? 'Defans' : ctrl.role === 'MF' ? 'Orta saha' : 'Forvet'), ctrl.num);
    drawWTexts(c, M); drawConf(c, M, dt);
    scoreBug(c, teamsN, M.score, def.time ? Math.floor(M.clock) + "'" : 'HAZ.');
    if (def.obj) pill(c, nm(def.obj), 14, 62, 15, 'rgba(0,0,0,.6)', '#f2c230', { align:'left', maxW:340 });
    txt(c, 'Gol: ' + M.goals + ' / ' + def.need + (def.time ? ' · önde bitir!' : ''), 22, 100, 16, '#ffffff', 'left', 'bold', 4);
    // hızlı taktikler (üst)
    TACTICS.forEach(([k, ic, name], i) => { const x = 376 + i * 74, on = M.tactic === k; c.fillStyle = on ? 'rgba(242,194,48,.92)' : 'rgba(8,12,30,.72)'; rr(c, x, 8, 68, 42, 21); c.fill();
      c.strokeStyle = on ? '#fff3b0' : ['#5aa0ff', '#ff6b6b', '#2ecc71', '#c39bff'][i]; c.lineWidth = 2; c.stroke();
      txt(c, ic, x + 34, 27, 15, '#ffffff', 'center'); txt(c, name.toUpperCase(), x + 34, 44, 9, on ? '#14306b' : '#ffffff', 'center', '900', 0, 62); });
    radar(c, [...teams[1].map(p => ({ x:p.x, z:p.z, col:p.role === 'GK' ? '#f39c12' : '#e74c3c', r:2.4 })), ...teams[0].map(p => ({ x:p.x, z:p.z, col:p.role === 'GK' ? '#2ecc71' : prof.shirt === '#111111' ? '#9aa0a8' : prof.shirt, r:2.4 })),
      { x:ctrl.x, z:ctrl.z, col:'#f2c230', me:1, r:3.6 }, { x:B.x, z:B.z, col:'#ffffff', r:2 }]);
    if (M.hintT > 0){ c.globalAlpha = Math.min(1, M.hintT); pill(c, M.hint, 480, 136, 14, 'rgba(20,48,107,.92)', '#ffffff', { maxW:900 }); c.globalAlpha = 1; }
    if (M.msgT > 0){ c.globalAlpha = Math.min(1, M.msgT * 2); txt(c, M.msg, 480, 172, 26, '#ffffff', 'center', 'italic 900', 6); c.globalAlpha = 1; }
    if (M.charging) powerHud(c, M.power, 'GÜÇ — bırakınca vurur · joystick: hedef');
    if (M.state === 'kick') txt(c, M.clock < 1 ? (training ? 'Hazırlık maçı başlıyor' : 'Maç başlıyor') : 'Santra', 480, 240, 40, '#ffffff', 'center', 'italic 900', 6);
    pauseBtn(c);
    if (M.state === 'won'){ c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(0, 0, W, H); txt(c, training ? 'HAZIRLIK MAÇI TAMAM!' : 'MAÇ BİTTİ — KAZANDIK!', 480, 260, 54, '#f2c230', 'center', 'italic 900', 8, 900); txt(c, 'Skor: ' + M.score[0] + ' - ' + M.score[1], 480, 306, 26, '#ffffff', 'center', 'bold', 5); }
    if (M.pauseM) drawPause(c);
    if (M.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H); txt(c, M.loseMsg.toUpperCase(), 480, 230, 52, '#ff6b6b', 'center', '900');
      txt(c, 'Skor: ' + M.score[0] + ' - ' + M.score[1] + ' · ' + def.need + ' gol atıp önde bitirmeliyiz. Tekrar!', 480, 280, 20, '#ffffff', 'center', 'normal', 0, 900); tapHint(c, 480, 340, M.lostT > .8, 'Tekrar dene ▶'); }
  };
  return M;
}
