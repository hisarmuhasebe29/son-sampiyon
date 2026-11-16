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
const FB_ASK = { shoot:['⚽', 'ŞUT ÇEK!'], pass:['➡️', 'PAS İSTE'], thru:['⤴️', 'ARA PAS İSTE'], lob:['🌙', 'ORTA İSTE'], dash:['💨', 'SPRİNT'] };
const FB_DEF_SOLO = { shoot:['🦶', 'MÜDAHALE'], pass:['🔥', 'TAKIM BASKISI'], thru:['🔥', 'BASKI'], lob:['🛝', 'KAYARAK'], dash:['💨', 'SPRİNT'] };
const CTL_BTN = { x:W - 148, y:10, w:42, h:36 };
const FB_DEF = { shoot:['🦶', 'MÜDAHALE'], pass:['🔄', 'DEĞİŞTİR'], thru:['🔥', 'BASKI'], lob:['🛝', 'KAYARAK'], dash:['💨', 'SPRİNT'] };
/* her futbolcuya ayrı görünüm: ten, saç, boy, kilo, sırtta isim + numara (takım koduna göre hep aynı) */
const SQ_NAMES = [['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Koç', 'Kurt', 'Polat', 'Erdem'],
  ['Silva', 'Costa', 'Moreno', 'Duran', 'Berg', 'Novak', 'Petit', 'Rossi', 'Lind', 'Okafor', 'Mendes', 'Varga', 'Ito', 'Kane']];
function squadLook(base, t, i, num, code, gk, nameSet){
  let s = 0; for (const ch of code + ':' + t + ':' + i) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const R = () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const P = a => a[Math.floor(R() * a.length)];
  const skin = P(['#f1c9a5', '#e8b98f', '#d8a47f', '#c48d68', '#a86f4c', '#8d5a3b', '#6b4329', '#4f3020']);
  const dark = parseInt(skin.slice(1, 3), 16) < 0xb0;
  const hair = dark ? P(['#111111', '#1a1410', '#2a1a10']) : P(['#111111', '#3a2414', '#5a3a1a', '#8a5a2a', '#c9a35a', '#2a1a10']);
  const hs = P(dark ? ['curly', 'short', 'bald', 'curly', 'spiky', 'bun'] : ['short', 'spiky', 'short', 'long', 'bun', 'mohawk', 'curly', 'bald']);
  const names = SQ_NAMES[nameSet != null ? nameSet : t], nm = names[(i + (code.charCodeAt(0) || 0) + (nameSet != null ? 5 : 0)) % names.length];
  return Object.assign({}, base, { skin, hair, hs, face:P(['oval', 'round', 'square', 'oval']), beard:R() < .3 ? hair : null, bs:R() < .5 ? 'stubble' : 'goatee',
    hgt:(gk ? 1.04 : .95) + R() * .09, wt:.92 + R() * .2, num:String(num), nm, ls:gk ? 1 : 0, __sig:null });
}
const CAMS = [['arka', 'Arkadan'], ['yayin', 'Yayın (yandan)'], ['tepe', 'Tepeden'], ['kale', 'Kale arkası']];
const CAM_BTN = { x:W - 100, y:10, w:42, h:36 };
const camName = k => (CAMS.find(c => c[0] === k) || CAMS[0])[1];
function nextCam(k){ const i = CAMS.findIndex(c => c[0] === k); return CAMS[(i + 1) % CAMS.length][0]; }
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
  const bib = def.bibs ? { shirt:'#c6f000', stripe:'#1b1b1b', shorts:prof.shorts, socks:prof.socks } : null;
  const rivA = bib ? Object.assign({}, LOOK.mate, bib, { __sig:null }) : clash ? Match3D.away[0] : LOOK.rival, rivB = bib ? Object.assign({}, LOOK.mate2, bib, { __sig:null }) : clash ? Match3D.away[1] : LOOK.rival2;
  const looks = [[LOOK.keeper, mateA, mateB], [LOOK.keeper2, rivA, rivB]];
  const sqKey = kk + '|' + clash + '|' + (def.teams || []).join(',') + (def.bibs ? '|bib' : '');
  if (!Match3D.sq || Match3D.sq.k !== sqKey) Match3D.sq = { k:sqKey, L:[[], []] };
  for (let t = 0; t < 2; t++) FORM.forEach(([role, fx, fz], i) => {
    const num0 = t === 0 ? ([1, 2, 4, 5, 3, 6, 8, 14, 7, 9, 11][i] === prof.num ? 99 - i : [1, 2, 4, 5, 3, 6, 8, 14, 7, 9, 11][i]) : [1, 2, 4, 5, 3, 6, 8, 10, 7, 9, 11][i];
    const look = t === 0 && i === ME ? LOOK.issem : (Match3D.sq.L[t][i] || (Match3D.sq.L[t][i] = squadLook(role === 'GK' ? looks[t][0] : looks[t][1 + (i % 2)], t, i, num0, (def.teams || ['ANL', 'RAK'])[t], role === 'GK', def.bibs && t === 1 ? 0 : null)));
    const p = { t, i, role, fx, fz, look, x:0, z:0, y:0, vx:0, vz:0, yaw:t ? Math.PI : 0, animT:Math.random() * 3, sp:0, down:0, slideT:0, kick:0, burst:0, burstCd:0,
      num:t === 0 && i === ME ? prof.num : num0, nm:look.nm, wind:0, tackleCd:0, base:role === 'FW' ? 6.1 : role === 'MF' ? 5.8 : 5.5 };
    if (role === 'GK') Object.assign(p, newKeeper(t === 0 ? -1 : 1));
    teams[t].push(p); });
  const all = [...teams[0], ...teams[1]], me = teams[0][ME];
  let ctrl = me, switchLock = 0, passRecv = null, decT = 0;
  const ctrlUI = () => { showControls('foot'); M.lastMode = ''; }; ctrlUI(); playMusic('football'); crowdAmb(true, training ? .06 : .15);
  const dirOf = t => t === 0 ? 1 : -1;
  const spd = p => (p === me ? P_SPEED() : p.base * (p.t === 1 ? (training && !def.free ? .86 : .94) * D.aggr : 1)) * (p.t === 0 && p !== me ? .97 : 1);
  function say2(t){ M.msg = t; M.msgT = 1.6; }
  function comm(t, force){ if (!force && M.commT > 1.2) return; M.comm = t; M.commT = 3; say(t, 'Spiker'); }
  M.intro = { t:0, dur:training ? 3.6 : 6.2 }; showControls(null); M.rec = []; M.recT = 0; M.replay = null; M.commT = 0;
  setTimeout(() => { if (cur === M && M.intro) comm(training ? 'Anolecrab tesislerinde hazırlık maçı başlıyor!' : pick(['Uon Pmac Stadyumu tıklım tıklım dolu! Büyük maç başlıyor!', 'Hoş geldiniz! Tribünler coşkulu, maç birazdan başlıyor!']), true); }, 600);
  function placeKickoff(team){
    for (const tt of teams) for (const p of tt){ const d = dirOf(p.t); if (p.role === 'GK'){ Object.assign(p, newKeeper(p.g)); continue; }
      p.x = d * Math.min(p.t === team ? -1.5 : -9.6, p.fx * 46 * .55 - 2); p.z = p.fz * .9; p.vx = p.vz = 0; p.down = 0; p.slideT = 0; p.wind = 0; p.yaw = p.t ? Math.PI : 0; }
    const k = teams[team][ME]; k.x = -dirOf(team) * .6; k.z = 0; B.x = 0; B.z = 0; B.y = BR; B.vx = B.vy = B.vz = 0; B.flight = null; B.held = false; give(k);
    M.state = 'kick'; M.stT = 1.4; M.shot = null; M.charging = false; passRecv = null;
  }
  function give(p){ const fromPass = !!(B.flight && B.flight.by && B.flight.by.t === p.t); B.owner = p; B.last = p.t; B.flight = null; B.held = false; passRecv = null;
    if (p.t === 0 && p.role !== 'GK' && !M.solo){ ctrl = p; } if (fromPass) p.autoT = .85; p.wind = 0; }
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
  M.cam = def.cam || 'yayin'; M.solo = SAVE.ctl === 'solo'; M.req = null; M.corner = null; M.fw = []; M.goalT = 0; M.wipeT = 0;
  const camSide = () => M.cam === 'yayin' || M.cam === 'tepe';
  const mapI = I => camSide() ? { fx:I.ix, fz:-I.iy } : { fx:I.iy, fz:I.ix };
  function setCam(k){ M.cam = k; say2('KAMERA: ' + camName(k).toUpperCase()); SFX.click(); }
  function setSolo(v){ M.solo = v; SAVE.ctl = v ? 'solo' : 'team'; persist(); if (v) ctrl = me; M.lastMode = ''; say2(v ? 'SADECE SEN: ARKADAŞLARIN OTOMATİK' : 'TAKIM KONTROLÜ: OYUNCU DEĞİŞTİR'); SFX.click(); }
  function inDir(p){ const I = f3Input(); if (I.m > .2){ const d = mapI(I), l = Math.hypot(d.fx, d.fz); return [d.fx / l, d.fz / l]; } return [Math.cos(p.yaw), -Math.sin(p.yaw)]; }
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
  function shootUs(p0, aim0, pw0, extra){
    const p = p0 || ctrl; B.x = p.x + Math.cos(p.yaw) * .5; B.z = p.z - Math.sin(p.yaw) * .5;
    M.shot = f3Shot(B, aim0 || M.aim, pw0 != null ? pw0 : M.power, Object.assign({ curl:.35, acc:p === me ? PST('sut') : .5 }, extra || {})); const K = teams[1][0];
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
    if (ev === 'goal'){ M.state = 'goal'; M.stT = ours ? 5.4 : 3.0; f3Net(M, Sh.side); M.inNet = Sh.side; SFX.net(); M.shake = 9; M.slowT = .85; M.goalT = 0; M.goalOurs = ours; M.goalMin = Math.max(1, Math.floor(M.clock)); M.goalBy = (M.shooter === me ? PNAME : (M.shooter && M.shooter.nm) || ''); M.fwT = 0;
      if (ours){ M.goals++; M.score[0]++; SFX.goal(); SFX.airhorn(); crowdLevel(.38); vib([80, 60, 200]); M.cheer = true;
        comm(M.shooter === me ? nm(pick(['GOOOL! Gol! Issem!', 'Muhteşem bir gol! Issem fileleri havalandırıyor!', 'İnanılmaz! Issem köşeye bıraktı!'])) : pick(['Gol! Harika bir takım golü!', 'Ağlar havalandı! Gol!']), true); confetti(M, 120); M.cheerSide = 0; M.goalIdx = M.rec.length;
        M.scorer = M.shooter; M.cx = M.shooter.x; M.cz = M.shooter.z; M.ct = 0; M.celebRun = true; M.cfx = GL - 3.5; M.cfz = (M.shooter.z >= 0 ? 1 : -1) * 29; }
      else { M.score[1]++; SFX.boo(); wtext(M, 'RAKİP GOL ATTI!', -GL + 3, 3.2, B.z * .4, '#ff6b6b', 50); comm(pick(['Rakip gol attı! Tribünler sessiz.', 'Eyvah! Rakip skoru değiştirdi.']), true); crowdLevel(.06); M.cheer = true; M.cheerSide = 1; M.goalIdx = M.rec.length; M.scorerThem = M.shooter; }
      return; }
    M.state = 'play'; M.inNet = 0; SFX.ooh(); let msg = 'AUT!';
    if (ev === 'catch'){ B.vx = B.vy = B.vz = 0; K.hold = true; give(K); K.holdT = .35; SFX.gloveCatch(); if (ours) SFX.ooh(); else SFX.applause(); msg = 'KALECİ YAKALADI!'; }
    else if (ev === 'parry'){ B.vx = -Sh.side * 3.5; B.vy = 3.4; B.vz = (Math.sign(B.z - K.z) || 1) * 5.5; SFX.glovePunch(); if (!ours) SFX.applause(); msg = 'KALECİ ÇELDİ!'; }
    else if (ev === 'post' || ev === 'bar'){ B.vx = -Sh.side * 5.5; B.vy = ev === 'bar' ? 3 : 1.4; B.vz = -Math.sign(B.z) * 2.4; SFX.post(); msg = ev === 'bar' ? 'ÜST DİREK!' : 'DİREK!'; M.shake = 4; }
    else { msg = ev === 'over' ? 'ÜSTTEN AUT!' : 'AUT!'; goalKick(ours ? 1 : 0, true); }
    wtext(M, msg, Sh.side * (GL - 2), 3.2, B.z * .5, '#ffffff', 44);
    if (!ours && (ev === 'catch' || ev === 'parry')) wtext(M, 'KURTARIŞ!', -GL + 4, 2.6, 0, '#7dff9a', 34);
    comm(ev === 'catch' || ev === 'parry' ? pick(['Kurtarış! Kaleci gol vermiyor!', 'Müthiş refleks!', 'Kaleci son anda çeldi!']) : ev === 'post' || ev === 'bar' ? pick(['Direkten döndü!', 'Ah! Direk!']) : pick(['Az farkla dışarıda.', 'Aut. Fırsat kaçtı.', 'Top auta gidiyor.']), true);
  }
  function goalKick(team, quiet){ SFX.shortWhistle(); const K = teams[team][0]; K.z = 0; K.x = K.g * (GL - 2); B.x = K.x - K.g * .5; B.z = 0; B.vx = B.vy = B.vz = 0; give(K); K.holdT = .5; if (!quiet) say2('AUT ATIŞI'); SFX.whistle(); }
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
    best.x = x - Math.sign(z) * 0 - dirOf(team) * .4; best.z = z - Math.sign(z) * .5; give(best); best.holdT = .9; say2(what);
    if (team === 0 && what === 'KORNER'){ if (!M.solo) ctrl = best; best.holdT = 99; M.corner = { p:best, x, z, tx:GL - 7, tz:-Math.sign(z) * 1.5, curl:0, power:0, charging:false }; M.hintT = 0; M.curlSel = Math.sign(z) * -.5; } SFX.shortWhistle(); if (what === 'KORNER' && team === 0) SFX.anticip(); comm(what === 'KORNER' ? pick(['Korner.', 'Köşe vuruşu kazanıldı.']) : 'Taç.');
  }
  /* ---------- güncelle ---------- */
  M.update = dt0 => { let dt = dt0;
    if (M.goalT != null) M.goalT += dt0; if (M.wipeT > 0) M.wipeT -= dt0; if (M.slowT > 0){ M.slowT -= dt0; dt = dt0 * .35; }
    if (M.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ M.pauseM = false; ctrlUI(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restartM(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)){ crowdAmb(false); toCover(); } } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !M.lost){ M.pauseM = true; showControls(null); return; }
    if (M.intro){ M.intro.t += dt; M.t += dt; const I = M.intro, k = Math.min(1, I.t / I.dur), a = Math.PI * (.62 + k * .78), e = easeOut(Math.min(1, k / .82)), r = lerp(58, 30, Math.sqrt(e)), y = lerp(training ? 45 : 95, 10, e);
      if (k < .82) camTo(M, Math.cos(a) * r, y, Math.sin(a) * r * .8, lerp(0, -4, k), 0, 0, 1); else camTo(M, -22, 8, 0, 0, 0, 0, Math.min(1, dt * 3));
      M.excite = .55; if (tap && inB(INTRO_CAM, tap)){ setCam(nextCam(M.cam)); tap = null; return; } if (tap && inB(INTRO_CTL, tap)){ setSolo(!M.solo); tap = null; return; }
      if (I.t > I.dur || (tap && I.t > .5)){ M.intro = null; M.excite = null; ctrlUI(); SFX.whistle(); comm(pick(['Ve hakem düdüğü çaldı, maç başladı!', 'Santra yapıldı, top oyunda!']), true); } tap = null; return; }
    if (M.replay){ const R = M.replay; M.t += dt; R.t += dt * (R.t > R.slowAt ? .42 : .85) ; R.real += dt;
      const fi = Math.floor(R.t / .05), f = R.frames[Math.min(fi, R.frames.length - 1)];
      if (f){ M.mpApply(f); M.score = R.score.slice(); M.clock = R.clock; M.hintT = 0;
        const bx = B.x, bz = B.z, sd = R.side, k = Math.min(1, dt * 4);
        if (R.cam === 'behind') camTo(M, sd * (GL + 9), 3.2, bz * .35, bx, Math.max(.6, B.y), bz, k);
        else if (R.cam === 'side') camTo(M, bx - sd * 4, 4.2, bz + (bz > 0 ? -16 : 16), bx + sd * 2, .8, bz, k);
        else camTo(M, bx - sd * 7, 1.6, bz * .8 - 2.5, bx + sd * 3, .6, bz, k); }
      if (fi >= R.frames.length || (tap && R.real > .6)){ M.replay = null; M.cheer = false; M.inNet = 0; tap = null; ctrlUI(); M.wipeT = .55; M.goalT = null;
        if (training && !def.free && M.goals >= def.need){ M.state = 'won'; M.stT = 2.2; SFX.longWhistle(); confetti(M, 80); } else placeKickoff(R.ours ? 1 : 0);
        M.camPos.set(-22, 8, 0); M.camLook.set(0, 0, 0); }
      return; }
    if (tap && !M.lost && inB(CAM_BTN, tap)){ setCam(nextCam(M.cam)); tap = null; return; }
    if (tap && !M.lost && inB(CTL_BTN, tap)){ setSolo(!M.solo); tap = null; return; }
    if (M.corner) curlTap(M);
    if (M.teamPress > 0) M.teamPress -= dt;
    if (tap && !M.lost) TACTICS.forEach(([k], i) => { if (inB({ x:376 + i * 74, y:8, w:68, h:42 }, tap)){ M.tactic = M.tactic === k ? null : k; M.tacT = 2; SFX.click(); say2(M.tactic ? TACTICS[i][2].toUpperCase() + '!' : 'NORMAL TAKTİK'); } });
    M.t += dt; if (M.hintT > 0) M.hintT -= dt; if (M.msgT > 0) M.msgT -= dt; M.shake *= Math.pow(.02, dt); if (switchLock > 0) switchLock -= dt;
    for (const t of M.texts) t.t += dt; M.texts = M.texts.filter(t => t.t < 1.8);
    if (M.lost){ M.lostT += dt; if (tap && M.lostT > .8) restartM(); return; }
    if (M.state === 'play' || M.state === 'shot' || M.state === 'goal'){ M.recT -= dt; if (M.recT <= 0){ M.recT = .05; M.rec.push(M.mpSnap()); if (M.rec.length > 170){ M.rec.shift(); if (M.goalIdx) M.goalIdx--; } } }
    if (M.commT > 0) M.commT -= dt;
    const live = M.state === 'play' || M.state === 'kick';
    if (def.time && live){ M.clock = Math.min(90, M.clock + dt * (90 - (def.startMin || 0)) / def.time);
      if (M.clock >= 90){ SFX.longWhistle(); if (def.free){ M.state = 'won'; M.stT = 4.2; M.res = M.score[0] > M.score[1] ? 'w' : M.score[0] === M.score[1] ? 'd' : 'l'; M.coins = M.res === 'w' ? 20 : M.res === 'd' ? 5 : 0; if (M.coins){ const pr = window.prof(); pr.coins = (pr.coins || 0) + M.coins; persist(); } if (M.res === 'w') confetti(M, 80); showControls(null); comm(M.res === 'w' ? 'Antrenman maçını kazandın!' : M.res === 'd' ? 'Maç berabere bitti.' : 'Yedekler bugün kazandı!', true); return; }
        if (M.goals >= def.need && M.score[0] > M.score[1]){ M.state = 'won'; M.stT = 2.4; confetti(M, 80); } else lose(M.score[0] > M.score[1] ? 'Yeterli gol yok!' : 'Maç bitti!'); return; } }
    for (const p of all){ p.animT += dt; if (p.kick > 0) p.kick -= dt; if (p.down > 0) p.down -= dt; if (p.burstCd > 0) p.burstCd -= dt; if (p.tackleCd > 0) p.tackleCd -= dt; if (p.holdT > 0) p.holdT -= dt; }
    keeperUpd(teams[0][0], dt); keeperUpd(teams[1][0], dt);
    // tuş etiketleri: hücum / savunma
    const attack = (B.owner && B.owner.t === 0) || (!B.owner && B.last === 0 && B.flight);
    const ask = M.solo && B.owner && B.owner.t === 0 && B.owner !== me && !M.corner;
    const mode = ask ? 'ask' : attack ? 'att' : M.solo ? 'dsolo' : 'def'; if (mode !== M.lastMode){ M.lastMode = mode; fbLabels(ask ? FB_ASK : attack ? FB_ATT : M.solo ? FB_DEF_SOLO : FB_DEF); }
    if (M.state === 'kick'){ M.stT -= dt; if (M.stT <= 0){ M.state = 'play'; SFX.whistle(); } }
    else if (M.state === 'play') play(dt);
    else if (M.state === 'shot'){ const Sh = M.shot; Sh.t += dt; const k = Sh.t / Sh.dur;
      if (k < Sh.kev){ const q = shotPos(Sh, k); B.x = q.x; B.y = q.y; B.z = q.z; B.yaw = yawTo(Sh.tx - Sh.x0, Sh.tz - Sh.z0); B.rot -= dt * 40; } else shotEvent();
      for (const p of all) if (p.role !== 'GK'){ p.vx *= .9; p.vz *= .9; p.sp = Math.hypot(p.vx, p.vz); p.x += p.vx * dt; p.z += p.vz * dt; } }
    else if (M.state === 'goal'){ M.stT -= dt; M.ct = (M.ct || 0) + dt; ballPhys(B, dt, M.inNet); if (M.stT < 1.2){ crowdLevel(.15); M.cheer = false; }
      if (M.inNet > 0 && M.scorer && M.celebRun){ const s = M.scorer, dx = M.cfx - s.x, dz = M.cfz - s.z, dl = Math.hypot(dx, dz); if (dl < 1.6 || M.ct > 2.6){ M.celebRun = false; M.ct = 0; } else { const v = Math.min(7.6, dl * 2); s.vx = dx / dl * v; s.vz = dz / dl * v; s.x += s.vx * dt; s.z += s.vz * dt; s.sp = v; s.yaw = yawTo(dx, dz); } M.cx = s.x; M.cz = s.z; }
      const ours0 = M.inNet > 0, team = teams[ours0 ? 0 : 1], cx = ours0 ? M.cx : (M.scorerThem ? M.scorerThem.x : -GL + 12), cz = ours0 ? M.cz : (M.scorerThem ? M.scorerThem.z : 0);
      team.forEach((p, i) => { if (p.role === 'GK' || p === (ours0 ? M.scorer : M.scorerThem)) return; const tx = cx + Math.cos(i * 1.3) * 1.8, tz = cz + Math.sin(i * 1.3) * 1.8, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
        if (d > .6 && d < 40){ const s = Math.min(7, d * 1.5); p.vx = dx / d * s; p.vz = dz / d * s; p.x += p.vx * dt; p.z += p.vz * dt; p.sp = s; p.yaw = yawTo(dx, dz); } else { p.sp = 0; } });
      if (M.stT <= 0){ const ours = M.inNet > 0;
        const gi = M.goalIdx != null ? M.goalIdx : M.rec.length, from = Math.max(0, gi - 80), frames = M.rec.slice(from, Math.min(M.rec.length, gi + 18));
        if (frames.length > 30){ M.replay = { frames, t:0, real:0, slowAt:Math.max(0, (gi - from - 26) * .05), side:ours ? 1 : -1, ours, cam:pick(['behind', 'side', 'low']), score:M.score.slice(), clock:M.clock }; M.rec = []; M.goalIdx = null; showControls(null); SFX.whoosh ? SFX.whoosh() : SFX.dash(); if (Math.random() < .6) comm(pick(['Bir kez daha izleyelim...', 'Tekrar görüntülere bakalım.', 'Şu güzelliğe bakın!']), true); return; }
        M.inNet = 0;
        if (training && !def.free && M.goals >= def.need){ M.state = 'won'; M.stT = 2.2; SFX.longWhistle(); confetti(M, 80); } else placeKickoff(ours ? 1 : 0); } }
    else if (M.state === 'won'){ M.stT -= dt; if (def.free){ if (M.stT <= 0 || (tap && M.stT < 3.2)){ crowdAmb(false); cur = SkillMenu(); } return; } if (M.stT <= 0){ stats.lvls++; stats.dmg += Math.min(1, M.tackles * .12); stats.tackles += M.tackles; crowdAmb(false); next(); return; } }
    if (B.owner && B.owner.role === 'GK' && M.state === 'play'){ const K = B.owner; B.x = K.x - K.g * .45; B.y = K.y + 1.1; B.z = K.z; }
    // kamera
    if (M.state === 'goal' && M.inNet > 0 && M.scorer){ M.fov = 38; const a = M.celebRun ? Math.atan2(M.cz, M.cx - GL) + .9 : M.ct * .45 - 1.2, r = M.celebRun ? 9 : 6.5; camTo(M, M.cx + Math.cos(a) * r, M.celebRun ? 3.2 : 2.2, M.cz + Math.sin(a) * r, M.cx, 1.15, M.cz, Math.min(1, dt * (M.celebRun ? 3 : 2.4))); }
    else { const fx = M.state === 'shot' && M.shooter ? lerp(M.shooter.x, B.x, .5) : B.x, fz = B.z, near = clamp((fx - (GL - 30)) / 30, 0, 1), nearO = clamp((-(GL - 24) - fx) / 24, 0, 1);
      const kk = Math.min(1, dt * 3.2);
      if (M.cam === 'yayin'){ M.fov = 30; camTo(M, clamp(fx * .9, -GL + 6, GL - 6), 19, 50, clamp(fx, -GL + 3, GL - 3), 0, fz * .4, kk); }
      else if (M.cam === 'tepe'){ M.fov = 40; camTo(M, clamp(fx, -GL + 8, GL - 8), 36, clamp(fz, -26, 26) + 19, clamp(fx, -GL + 8, GL - 8), 0, clamp(fz, -26, 26) + 2.5, kk); }
      else if (M.cam === 'kale'){ M.fov = 40; camTo(M, Math.max(-GL - 8, fx - 24), 15, fz * .45, Math.min(GL, fx + 9), 0, fz * .75, kk); }
      else { M.fov = 44; camTo(M, Math.max(-GL + 1.5, fx - 9.5 + near * 1.5), 5.6 - near * .9 + nearO * 3.8, fz * .7, Math.min(GL + 2, fx + 7 * (1 - nearO) + near * 4), .3, fz * .85, kk); } }
    M.focus = { x:B.x, z:B.z };
  };
  function play(dt){
    const I = f3Input(), own = B.owner, myBall = own && own.t === 0, theirBall = own && own.t === 1;
    // kontrol edilen oyuncu seçimi
    if (M.solo){ ctrl = me; }
    else if (myBall && own.role !== 'GK') ctrl = own;
    else if (!myBall && switchLock <= 0){ let best = null, bd = 1e9; const bx = B.x + B.vx * .3, bz = B.z + B.vz * .3;
      for (const p of teams[0]) if (p.role !== 'GK' && p.down <= 0){ const d = Math.hypot(p.x - bx, p.z - bz); if (d < bd){ bd = d; best = p; } }
      if (best && best !== ctrl && (!passRecv || passRecv.t !== 0)) { const cd = Math.hypot(ctrl.x - bx, ctrl.z - bz); if (bd < cd - 2.5) ctrl = best; }
      if (passRecv && passRecv.t === 0) ctrl = passRecv; }
    const c = ctrl;
    // kullanıcı girişi
    const sprint = !!keys.dash;
    if (took('dash') && c.burstCd <= 0){ c.burst = .28; c.burstCd = 1.0 - (c === me ? PST('calim') * .35 : 0); SFX.dash(); }
    if (c.burst > 0) c.burst -= dt;
    if (c.down <= 0 && !(c.role === 'GK') && !M.corner){
      let tvx, tvz; const s = spd(c) * (sprint ? 1.3 : 1) * (c.burst > 0 ? 1.45 : 1) * (myBall && own === c ? .93 : 1);
      if (!myBall && keys.thru && own){ const dx = own.x - c.x, dz = own.z - c.z, l = Math.hypot(dx, dz) || 1; tvx = dx / l * s; tvz = dz / l * s; }  // BASKI
      else if (M.charging){ tvx = Math.cos(c.yaw) * .9; tvz = -Math.sin(c.yaw) * .9; }
      else { const d = mapI(I); tvx = d.fx * s; tvz = d.fz * s;
        if (c.autoT > 0){ c.autoT -= dt; if (I.m < .15){ const vl = Math.hypot(c.vx, c.vz); const ux = vl > 1 ? c.vx / vl : 1, uz = vl > 1 ? c.vz / vl : 0; tvx = ux * s * .82; tvz = uz * s * .82; } else c.autoT = 0; } }
      if (c.slideT > 0){ c.slideT -= dt; const v = 9 * Math.min(1, c.slideT * 3 + .25); tvx = Math.cos(c.yaw) * v; tvz = -Math.sin(c.yaw) * v; c.vx = tvx; c.vz = tvz; }
      else { c.vx = lerp(c.vx, tvx, Math.min(1, dt * 9)); c.vz = lerp(c.vz, tvz, Math.min(1, dt * 9)); }
      if (Math.hypot(c.vx, c.vz) > .8 && c.slideT <= 0 && !M.charging) c.yaw = angLerp(c.yaw, yawTo(c.vx, c.vz), Math.min(1, dt * 12));
      c.x = clamp(c.x + c.vx * dt, -GL - .5, GL + .5); c.z = clamp(c.z + c.vz * dt, -34.5, 34.5); c.sp = Math.hypot(c.vx, c.vz);
    }
    if (M.corner && B.owner === M.corner.p){ cornerUpd(dt, I); }
    else if (myBall && M.solo && own !== c){ if (took('pass')) M.req = 'pass'; else if (took('thru')) M.req = 'thru'; else if (took('lob')) M.req = 'lob'; else if (took('shoot')) M.req = 'shoot'; }
    else if (myBall && own === c && !(c.holdT > 0)){
      if (M.charging){ const ax = camSide() ? -I.iy : I.ix, ay = camSide() ? I.ix : I.iy; M.aim.tz = clamp(M.aim.tz + ax * dt * 4.2, -4.6, 4.6); M.aim.th = clamp(M.aim.th + ay * dt * 2.1, .12, 3.0); M.power = Math.min(1, M.power + dt * .95);
        c.yaw = angLerp(c.yaw, yawTo(GL - c.x, M.aim.tz - c.z), Math.min(1, dt * 8)); if (!keys.shoot){ shootUs(); return; } }
      else if (keys.shoot && took('shoot')){ M.charging = true; M.power = 0; M.aim = { tz:clamp(-c.z * .25, -2.6, 2.6) + (c.z > 0 ? -1.6 : 1.6), th:.7 }; }
      else if (took('pass')) doPass(c, 'ground');
      else if (took('thru')) doPass(c, 'thru');
      else if (took('lob')) doPass(c, 'lob');
    } else if (!myBall){
      if (took('pass')){ if (M.solo){ M.teamPress = 2.5; say2('TAKIM BASKISI!'); SFX.click(); } else { let best = null, bd = 1e9; for (const p of teams[0]) if (p !== c && p.role !== 'GK'){ const d = Math.hypot(p.x - B.x, p.z - B.z); if (d < bd){ bd = d; best = p; } } if (best){ ctrl = best; switchLock = 1.2; SFX.click(); } } }
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
        chasers.push(...sorted.slice(0, (t === 0 ? 1 + (M.solo ? 1 : 0) + (M.teamPress > 0 ? 1 : 0) : 2 + (D.aggr > 1 ? 1 : 0) - (training ? 1 : 0)) + (tac === 'pres' ? 1 : 0) - (tac === 'kapan' ? 1 : 0) + (!own ? 1 : 0))); }
      for (const p of team){
        if (p.role === 'GK'){ gkAI(p, dt); continue; }
        if (p === ctrl && t === 0) continue;
        if (p.down > 0){ p.vx = p.vz = 0; p.sp = 0; continue; }
        if (own === p){ if (t === 1) carrierAI(p, dt); else if (M.solo && !M.corner) mateAI(p, dt); continue; }
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
    if (B.flight){ B.flight.t += dt; if (B.flight.curl && B.y > .4){ const v = Math.hypot(B.vx, B.vz) || 1; B.vx += (-B.vz / v) * B.flight.curl * dt; B.vz += (B.vx / v) * B.flight.curl * dt; } }
    // kim alır?
    for (const p of all){ if (p.down > 0 || p.role === 'GK') continue; const d = Math.hypot(p.x - B.x, p.z - B.z);
      const isRecv = p === passRecv, r = isRecv ? 1.1 : .8;
      if (d < r && B.y < (isRecv ? 2.3 : 1.2)){
        if (B.flight && B.flight.by && B.flight.by.t === p.t && !isRecv && B.flight.t < .25) continue;
        if (B.flight && B.flight.by && B.flight.by.t !== p.t && !isRecv){ if (B.flight.tried.has(p)) continue; B.flight.tried.add(p); const ch = (p.t === 0 ? (p === ctrl ? .75 : .45) : .38 * D.aggr) * (1 - Math.min(.6, sp / 40)); if (Math.random() > ch) continue; }
        const high = B.y > 1.25; give(p); (high ? SFX.header : SFX.trap)();
        if (p.t === 0 && high && p.x > GL - 15 && Math.abs(p.z) < 11 && M.state === 'play') headerShot(p);
        return; } }
  }
  function gkAI(K, dt){
    if (B.owner === K){ K.hold = true; if (!(K.holdT > 0) && K.st === 'ready'){ K.hold = false; const t = K.t, opp = teams[1 - t];
        // hızlı oyun: en açıktaki arkadaşa elle at / kısa pas
        let q = null, bs = -1e9; for (const m of teams[t]){ if (m.role === 'GK' || m.down > 0) continue; const d = Math.hypot(m.x - K.x, m.z - K.z); if (d > 38) continue;
          let open = 0; for (const o of opp){ const od = Math.hypot(o.x - m.x, o.z - m.z); if (od < 6) open -= (6 - od) * 2; } const sc = open - d * .08 + (m.role === 'MF' ? 1.5 : 0); if (sc > bs){ bs = sc; q = m; } }
        q = q || teams[t][2]; B.x = K.x + dirOf(t) * .8; B.y = 1.2; const d = Math.hypot(q.x - K.x, q.z - K.z);
        kickBall(K, q.x + q.vx * .3, q.z + q.vz * .3, d > 22 ? 'lob' : 'ground', q); K.kick = .4; say2(d > 22 ? 'KALECİ UZUN ATTI' : 'KALECİ HIZLI ATTI'); } return; }
    if (K.rushCd > 0) K.rushCd -= dt;
    if (K.st !== 'ready' || (M.state !== 'play' && M.state !== 'kick')){ K.yaw = null; return; }
    // açı kapatma: kale ortası → top doğrultusunda, topun uzaklığına göre öne çıkar (top bizdeyse libero gibi daha da çıkar)
    const gx = K.g * GL, dx = B.x - gx, dz = B.z, bd = Math.hypot(dx, dz) || 1, ux = dx / bd, uz = dz / bd, own = B.owner;
    const danger = own ? own.t !== K.t : B.last !== K.t;
    let out = bd > 48 ? 8.5 : bd > 30 ? 4.5 + (bd - 30) * .22 : bd > 16 ? 1.8 + (bd - 16) * .19 : clamp(bd * .11, .5, 1.8);
    if (!danger) out = Math.min(15, out + 4);
    let tx = gx + ux * out, tz = clamp(uz * out, -GW - .9, GW + .9), top = 4.6;
    // serbest top ceza sahasında, kaleci rakipten önce ulaşabiliyorsa üstüne gider
    if (!own && Math.sign(B.x) === K.g && Math.abs(B.x) > GL - 16.5 && Math.abs(B.z) < 20 && B.y < 1.6 && Math.hypot(B.vx, B.vz) < 9){
      const kb0 = Math.hypot(K.x - B.x, K.z - B.z), opp = Math.min(...teams[1 - K.t].map(o => Math.hypot(o.x - B.x, o.z - B.z)));
      if (kb0 < opp + 3){ tx = B.x + B.vx * .25; tz = B.z + B.vz * .25; top = 6.8; K.mode = 'run'; } }
    if (K.mode !== 'run' || top < 6) K.mode = bd > 34 && !danger ? 'relax' : 'set';
    // bire bir: rakip topla ceza sahasına girdiyse üstüne çıkar
    if (danger && own && own.role !== 'GK' && bd < 15.5 && Math.abs(B.z) < 13 && !(K.rushCd > 0)){ tx = own.x - ux * .7; tz = own.z - uz * .7; top = 7.2; K.mode = 'run'; K.rushing = true; }
    else K.rushing = false;
    tx = K.g > 0 ? clamp(tx, GL - 17, GL - .3) : clamp(tx, -GL + .3, -GL + 17);
    const ddx = tx - K.x, ddz = tz - K.z, dl = Math.hypot(ddx, ddz), want = Math.min(top, dl * 3.2);
    K.kvx = lerp(K.kvx || 0, dl > .02 ? ddx / dl * want : 0, Math.min(1, dt * 6)); K.kvz = lerp(K.kvz || 0, dl > .02 ? ddz / dl * want : 0, Math.min(1, dt * 6));
    K.x += K.kvx * dt; K.z += K.kvz * dt;
    { const fy = yawTo(B.x - K.x, B.z - K.z), base = K.g > 0 ? Math.PI : 0; let d = fy - base; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; K.yaw = base + clamp(d, -1.25, 1.25); }
    const kb = Math.hypot(K.x - B.x, K.z - B.z);
    if (!B.owner && kb < 1.7 && B.y < 2.3 && Math.abs(B.x) > GL - 18){ give(K); K.holdT = .35; SFX.gloveCatch ? SFX.gloveCatch() : SFX.punch(); say2('KALECİ ALDI'); K.rushCd = 1.5; }
    const o = B.owner; if (o && o.t !== K.t && Math.hypot(K.x - o.x, K.z - o.z) < 1.4){ K.rushCd = 2.2;
      if (Math.random() < (K.rushing ? .62 : .45) * DIFF().keeper){ give(K); K.holdT = .4; SFX.gloveCatch ? SFX.gloveCatch() : SFX.punch(); say2('KALECİ KAPTI!'); comm(pick(['Kaleci çıktı ve aldı!', 'Kaleci ayağından topu kaptı!']), true); }
      else { K.st = 'dive'; K.kt = 0; K.dd = .25; K.z0 = K.z; K.tz = K.z + (o.z > K.z ? 1 : -1) * 2; K.ty = .3; SFX.dive && SFX.dive(); say2('KALECİ AYAKLARA YATTI!'); } }
  }
  /* takım arkadaşı topta (sadece-sen modu): kaleye sürer, sana pas verir, isteğine uyar, şut çeker */
  function mateAI(p, dt){
    if (p.holdT > 0){ p.vx = p.vz = 0; p.sp = 0; return; }
    const s = spd(p) * .95; let tx = GL, tz = p.z * .55;
    for (const q of teams[1]){ const dx = q.x - p.x, dz = q.z - p.z, dl = Math.hypot(dx, dz); if (dl < 5 && dx > -1) tz -= Math.sign(dz || 1) * (5 - dl) * 3; }
    const dx = tx - p.x, dz = tz - p.z, dl = Math.hypot(dx, dz) || 1;
    p.vx = lerp(p.vx, dx / dl * s, Math.min(1, dt * 5)); p.vz = lerp(p.vz, dz / dl * s, Math.min(1, dt * 5)); p.x += p.vx * dt; p.z = clamp(p.z + p.vz * dt, -33, 33); p.sp = Math.hypot(p.vx, p.vz); p.yaw = yawTo(p.vx, p.vz);
    p.mdec = (p.mdec || .4) - dt; const req = M.req;
    const press = teams[1].filter(q => Math.hypot(q.x - p.x, q.z - p.z) < 2.6).length;
    if (!req && p.mdec > 0 && !(press && p.mdec < .25)) return;
    p.mdec = rand(.55, 1.0); M.req = null;
    const dG = Math.hypot(GL - p.x, p.z), meFree = me.down <= 0 && !teams[1].some(q => Math.hypot(q.x - me.x, q.z - me.z) < 2.8);
    if (req === 'shoot' || (!req && dG < 22 && Math.abs(p.z) < 15 && Math.random() < .5)){ p.yaw = yawTo(GL - p.x, -p.z);
      shootUs(p, { tz:(p.z > 0 ? -1 : 1) * rand(1.4, 3.1), th:rand(.35, 1.7) }, rand(.6, .82), { acc:.55 }); comm(pick(['Arkadaşın şut çekiyor!', 'Uzaktan deniyor!'])); return; }
    if (req || (meFree && Math.random() < .55) || (press && Math.random() < .6)){
      const k = req || (Math.hypot(me.x - p.x, me.z - p.z) > 26 ? 'lob' : 'pass');
      const lead = k === 'thru' ? 8 : 1.2, ax = clamp(me.x + me.vx * .45 + lead, -GL + 2, GL - 2), az = clamp(me.z + me.vz * .45, -32, 32);
      kickBall(p, ax, az, k === 'lob' ? 'lob' : 'ground', me); say2(req ? (k === 'thru' ? 'ARA PAS GELDİ!' : 'PAS GELDİ!') : 'PAS SANA!'); return; }
    if (Math.random() < .35){ const q = bestMate(p, 1, 0, Math.random() < .4); if (q) kickBall(p, q.x + q.vx * .3, q.z + q.vz * .3, Math.hypot(q.x - p.x, q.z - p.z) > 26 ? 'lob' : 'ground', q); }
  }
  /* bizim korner: hedef halkası joystickle ceza sahasında gezer, falso seç, ORTA/ŞUT basılı tut = güç */
  function cornerUpd(dt, I){
    const C = M.corner, p = C.p; p.vx = p.vz = 0; p.sp = 0; p.yaw = yawTo(C.tx - p.x, C.tz - p.z);
    const d = mapI(I); C.tx = clamp(C.tx + d.fx * dt * 9, GL - 18, GL - 3); C.tz = clamp(C.tz + d.fz * dt * 9, -17, 17);
    if (keys.lob || keys.shoot){ if (!C.charging){ C.charging = true; C.power = 0; } C.power = Math.min(1, C.power + dt * .9); }
    else if (C.charging){ C.charging = false;
      const err = (1 - PST('sut')) * 2.2 + Math.max(0, C.power - .85) * 6, tx = C.tx + rand(-1, 1) * err + (C.power - .6) * 5, tz = C.tz + rand(-1, 1) * err;
      let recv = null, rd = 1e9; for (const q of teams[0]) if (q !== p && q.role !== 'GK'){ const dd = Math.hypot(q.x - tx, q.z - tz); if (dd < rd){ rd = dd; recv = q; } }
      p.holdT = 0; M.corner = null; kickBall(p, tx, tz, 'lob', recv); B.flight.curl = (M.curlSel || 0) * 7; B.flight.side = Math.sign(p.z) || 1;
      const runners = teams[0].filter(q => q !== p && q !== recv && q.role !== 'GK').sort((a, b) => Math.hypot(a.x - tx, a.z - tz) - Math.hypot(b.x - tx, b.z - tz)).slice(0, 3);
      runners.forEach((q, i) => q.runTo = { x:tx - 2 + i * 2, z:tz + (i - 1) * 3 }); say2('ORTA!'); comm(pick(['Korner kullanıldı, ceza sahasına geliyor!', 'Ortaya çevirdi!']), true); }
  }
  function headerShot(p){ p.yaw = yawTo(GL - p.x, -p.z); shootUs(p, { tz:(Math.random() < .5 ? -1 : 1) * rand(.8, 3.0), th:rand(.25, 1.9) }, rand(.45, .62), { acc:.6, arcMul:.4 }); SFX.header(); wtext(M, 'KAFA!', p.x, 2.8, p.z, '#f2c230', 40); comm(pick(['Kafa vuruşu!', 'Kafayı vurdu!']), true); }
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

  /* ---------- çok oyunculu: anlık görüntü gönder / uygula ---------- */
  const r2 = v => Math.round(v * 100) / 100;
  M.mpSnap = () => ({ tm:all.map(p => [r2(p.x), r2(p.z), r2(p.yaw), r2(p.sp), r2(Math.max(0, p.kick)), r2(Math.max(0, p.down)), r2(Math.max(0, p.slideT)), r2(Math.max(0, p.wind)), r2(Math.max(0, p.burst)),
      p.role === 'GK' ? [p.st, r2(p.y), r2(p.roll), p.hold ? 1 : 0, r2(p.kt || 0), p.mode || 'set', p.yaw == null ? null : r2(p.yaw)] : 0]),
    B:[r2(B.x), r2(B.y), r2(B.z), r2(B.yaw), r2(B.rot)], sc:M.score.slice(), cl:r2(M.clock), st:M.state, g:M.goals, ci:all.indexOf(ctrl), pr:passRecv ? all.indexOf(passRecv) : -1,
    ch:M.charging ? 1 : 0, pw:r2(M.power), aim:[r2(M.aim.tz), r2(M.aim.th)], cam:[r2(M.camPos.x), r2(M.camPos.y), r2(M.camPos.z), r2(M.camLook.x), r2(M.camLook.y), r2(M.camLook.z)],
    msg:M.msgT > 0 ? [M.msg, r2(M.msgT)] : 0, tac:M.tactic, ch2:M.cheer ? 1 : 0, nt:M.inNet || 0, sco:M.scorer ? all.indexOf(M.scorer) : -1, cx:[r2(M.cx || 0), r2(M.cz || 0), r2(M.ct || 0)],
    tx:M.texts.map(t => [t.text, r2(t.x), r2(t.y), r2(t.z), t.col, t.size, r2(t.t)]), lost:M.lost ? [M.loseMsg, r2(M.lostT)] : 0, sh:r2(M.shake), stT:r2(M.stT || 0), rp:M.replay ? [M.replay.cam, r2(M.replay.real), M.replay.t > M.replay.slowAt ? 1 : 0] : 0, it:M.intro ? r2(M.intro.t / M.intro.dur) : -1, cm:M.commT > 0 ? [M.comm, r2(M.commT)] : 0, gt:M.goalT != null ? [r2(M.goalT), M.goalOurs ? 1 : 0, M.goalBy || '', M.goalMin || 0] : 0, cr:M.celebRun ? 1 : 0 });
  M.mpApply = s => {
    s.tm.forEach((a, i) => { const p = all[i]; if (!p) return; p.x = a[0]; p.z = a[1]; p.yaw = a[2]; p.sp = a[3]; p.kick = a[4]; p.down = a[5]; p.slideT = a[6]; p.wind = a[7]; p.burst = a[8];
      if (a[9]){ p.st = a[9][0]; p.y = a[9][1]; p.roll = a[9][2]; p.hold = !!a[9][3]; p.kt = a[9][4]; p.mode = a[9][5]; p.yaw = a[9][6]; } });
    [B.x, B.y, B.z, B.yaw, B.rot] = s.B; M.score = s.sc; M.clock = s.cl; M.state = s.st; M.goals = s.g; if (all[s.ci]) ctrl = all[s.ci]; passRecv = s.pr >= 0 ? all[s.pr] : null;
    M.charging = !!s.ch; M.power = s.pw; M.aim.tz = s.aim[0]; M.aim.th = s.aim[1]; M.camPos.set(s.cam[0], s.cam[1], s.cam[2]); M.camLook.set(s.cam[3], s.cam[4], s.cam[5]);
    if (s.msg){ M.msg = s.msg[0]; M.msgT = s.msg[1]; } else M.msgT = 0; M.tactic = s.tac; M.cheer = !!s.ch2; M.inNet = s.nt; M.scorer = s.sco >= 0 ? all[s.sco] : null; [M.cx, M.cz, M.ct] = s.cx;
    M.texts = s.tx.map(t => ({ text:t[0], x:t[1], y:t[2], z:t[3], col:t[4], size:t[5], t:t[6] })); M.lost = !!s.lost; if (s.lost){ M.loseMsg = s.lost[0]; M.lostT = s.lost[1]; } M.shake = s.sh; M.stT = s.stT;
    M.hintT = 0; if (!M.replay) M.intro = null; M.rpView = s.rp || null; M.itView = s.it != null ? s.it : -1; if (s.cm){ M.comm = s.cm[0]; M.commT = s.cm[1]; } else M.commT = 0; if (s.gt){ M.goalT = s.gt[0]; M.goalOurs = !!s.gt[1]; M.goalBy = s.gt[2]; M.goalMin = s.gt[3]; } else M.goalT = null; M.celebRun = !!s.cr; };
  M.viewTick = dt => { M.t += dt; for (const p of all) p.animT += dt; };
  /* ---------- çizim ---------- */
  M.draw = c => {
    const dt = 1 / 60, teamsN = def.teams || ['ANL', 'RKP'];
    M.screen = [teamsN[0], M.score[0] + '-' + M.score[1], teamsN[1], def.time ? Math.floor(M.clock) + "'" : 'HAZIRLIK'];
    const cine = !!(M.intro || M.replay || M.rpView || (M.itView != null && M.itView >= 0));
    if (!f3Begin(M, dt)){ c.fillStyle = '#000'; c.fillRect(0, 0, W, H); txt(c, '3B grafik desteklenmiyor', 480, 270, 24, '#fff', 'center'); return; }
    for (const p of all){
      const id = (p.t ? 'a' : 'h') + p.i;
      if (p.role === 'GK'){ drawKeeper(p, M.state === 'goal' && M.inNet === -p.g ? 'sad' : 'angry', id, p.look); continue; }
      let P; const celebrating = M.state === 'goal' && M.inNet > 0;
      if (celebrating && p === M.scorer) P = M.celebRun ? fbMove(p, dt) : celebPose(M, p, M.ct);
      else if (celebrating && p.t === 0 && Math.hypot(p.x - M.cx, p.z - M.cz) < 12) P = p.sp > .8 ? fbMove(p, dt) : getPose({ animT:p.animT, pose:'cheer' });
      else if (M.state === 'goal' && M.inNet < 0 && p.t === 1) P = p.sp > .8 ? fbMove(p, dt) : getPose({ animT:p.animT, pose:'cheer' });
      else if (M.state === 'goal' && M.inNet < 0 && p.t === 0 && p.sp < .5) P = getPose({ animT:p.animT, pose:'sad' });
      else if (M.state === 'won') P = getPose({ animT:p.animT, pose:p.t === 0 ? 'cheer' : 'sad' });
      else if (p.down > 0) P = getPose({ pose:'lie' });
      else if (p.slideT > 0) P = getPose({ slide:1 });
      else if (p.kick > 0) P = getPose({ animT:p.animT, atk:{ m:{ dur:.42, anim:'shoot' }, t:.42 - p.kick } });
      else if (p.wind > 0) P = getPose({ animT:p.animT, wind:1, T:{ kick:1 } });
      else if (p === ctrl && M.charging) P = Object.assign(getPose({ animT:M.t, pose:'stand' }), { lean:6, fl:[.3, .05], bl:[-.3, -.3] });
      else if (p.burst > 0){ const q = { sp:9.5, gph:p.gph, animT:p.animT, i:p.i }; P = fbMove(q, dt); p.gph = q.gph; }
      else P = fbMove(p, dt);
      const flash = p.wind > 0 && Math.floor(p.wind * 14) % 2 === 0;
      R3.charW(id, p.look, P, p.x, p.y || 0, p.z, p.yaw, 1, p.down > 0 ? 'pain' : (celebrating && p.t === 0) ? 'happy' : 'angry', false, null, { tint:flash ? '#ff3b3b' : null, face:p === me ? footFace() : 1 });
      if (p.wind > 0) f3Ring('ringW' + p.i, p.x, p.z, '#ff3b3b', 1.1 - p.wind, .85);
    }
    if (training) R3.charW('fl', LOOK.leo, getPose({ animT:M.t, pose:'arms' }), clamp(B.x, -40, 40), 0, -36.5, yawTo(0, 1), 1, M.goals ? 'happy' : 'neutral');
    f3Ball(B);
    M.kitH = [prof.shirt, prof.stripe]; M.kitA = [rivA.shirt, rivA.stripe];
    if (!M.intro && !M.replay){ const want = M.state === 'goal' ? .2 : .16 + .55 * clamp((B.x - 12) / 36, 0, 1); M.excite = want; M.allowWave = M.state === 'play' && B.x < 0 && !training; }
    if (!training) f3NightShadows(all);
    const live = M.state === 'play' || M.state === 'kick';
    if (live && !cine){ f3Ring('ringP', ctrl.x, ctrl.z, '#f2c230', .62 + Math.sin(M.t * 6) * .04);
      if (B.owner === ctrl && !M.charging){ const [ux, uz] = inDir(ctrl); const q = bestMate(ctrl, ux, uz, false); if (q) f3Ring('ringT', q.x, q.z, '#ffffff', .5, .55); }
      if (passRecv && B.flight && passRecv.t === 0) f3Ring('ringR', passRecv.runTo ? passRecv.runTo.x : passRecv.x, passRecv.runTo ? passRecv.runTo.z : passRecv.z, '#7dff9a', .7, .6);
      if (B.owner && B.owner.t === 1) f3Ring('ringC', B.owner.x, B.owner.z, '#ff3b3b', .75, .9); }
    if (M.corner && !cine){ const C = M.corner; f3Ring('cornerT', C.tx, C.tz, '#f2c230', 1.3 + Math.sin(M.t * 6) * .08); f3Ring('cornerT2', C.tx, C.tz, '#ffffff', .35, .8); }
    if (M.charging && !cine){ const tl = Math.hypot(GL - B.x, M.aim.tz - B.z), ay = yawTo(GL - B.x, M.aim.tz - B.z);
      f3Arrow(B.x, B.z, ay, 1.2 + M.power * Math.min(9, tl * .45), M.power > .85 ? '#ff4a3a' : '#f2c230');
      const err = (1 - PST('sut')) * .5 + tl * .011 + Math.max(0, M.power - .85) * 3.2; f3Reticle(M.aim.th + Math.max(0, M.power - .85) * 2, M.aim.tz, .32 + err * .9, M.power > .85 ? '#ff4a3a' : '#f2c230'); }
    R3.render();
    // 2B üst katman
    if (live && !cine) nameTag(c, ctrl.x, 2.25, ctrl.z, ctrl === me ? PNAME : (ctrl.role === 'DF' ? 'Defans' : ctrl.role === 'MF' ? 'Orta saha' : 'Forvet'), ctrl.num);
    drawWTexts(c, M); drawConf(c, M, dt);
    scoreBug(c, teamsN, M.score, def.time ? Math.floor(M.clock) + "'" : 'HAZ.');
    if (def.obj && !cine) pill(c, nm(def.obj), 14, 62, 15, 'rgba(0,0,0,.6)', '#f2c230', { align:'left', maxW:340 });
    if (!cine) txt(c, 'Gol: ' + M.goals + ' / ' + def.need + (def.time ? ' · önde bitir!' : ''), 22, 100, 16, '#ffffff', 'left', 'bold', 4);
    // hızlı taktikler (üst)
    if (!cine) TACTICS.forEach(([k, ic, name], i) => { const x = 376 + i * 74, on = M.tactic === k; c.fillStyle = on ? 'rgba(242,194,48,.92)' : 'rgba(8,12,30,.72)'; rr(c, x, 8, 68, 42, 21); c.fill();
      c.strokeStyle = on ? '#fff3b0' : ['#5aa0ff', '#ff6b6b', '#2ecc71', '#c39bff'][i]; c.lineWidth = 2; c.stroke();
      txt(c, ic, x + 34, 27, 15, '#ffffff', 'center'); txt(c, name.toUpperCase(), x + 34, 44, 9, on ? '#14306b' : '#ffffff', 'center', '900', 0, 62); });
    if (!cine) radar(c, [...teams[1].map(p => ({ x:p.x, z:p.z, col:p.role === 'GK' ? '#f39c12' : '#e74c3c', r:2.4 })), ...teams[0].map(p => ({ x:p.x, z:p.z, col:p.role === 'GK' ? '#2ecc71' : prof.shirt === '#111111' ? '#9aa0a8' : prof.shirt, r:2.4 })),
      { x:ctrl.x, z:ctrl.z, col:'#f2c230', me:1, r:3.6 }, { x:B.x, z:B.z, col:'#ffffff', r:2 }]);
    if (M.hintT > 0 && !cine){ c.globalAlpha = Math.min(1, M.hintT); pill(c, M.hint, 480, 136, 14, 'rgba(20,48,107,.92)', '#ffffff', { maxW:900 }); c.globalAlpha = 1; }
    if (M.msgT > 0){ c.globalAlpha = Math.min(1, M.msgT * 2); txt(c, M.msg, 480, 172, 26, '#ffffff', 'center', 'italic 900', 6); c.globalAlpha = 1; }
    if (M.corner && !cine){ const C = M.corner, dx = C.tx - B.x, dz = C.tz - B.z, d = Math.hypot(dx, dz) || 1, Tt = .55 + d / 19; let x = B.x, y = BR, z = B.z, vx = dx / Tt, vz = dz / Tt, vy = 9.8 * Tt / 2; const cu = (M.curlSel || 0) * 7;
      for (let i = 0; i < 28 && y >= BR; i++){ const h = Tt / 24; vy -= 9.8 * h; const v = Math.hypot(vx, vz) || 1; vx += (-vz / v) * cu * h; vz += (vx / v) * cu * h; x += vx * h; y += vy * h; z += vz * h; const pr = R3.project(x, Math.max(BR, y), z); if (pr.behind) continue; c.globalAlpha = .4 + i / 40; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(pr.x, pr.y, 2.4, 0, 7); c.fill(); } c.globalAlpha = 1; }
    if (M.charging && !cine){ shotPreview(c, B, M.aim, M.power, { curl:.35 }); aimMarker(c, M.aim.th, M.aim.tz, .45); }
    if (M.charging && !cine) powerHud(c, M.power, 'GÜÇ — bırakınca vurur · joystick: hedef');
    if (M.state === 'kick' && !cine) txt(c, M.clock < 1 ? (training ? 'Hazırlık maçı başlıyor' : 'Maç başlıyor') : 'Santra', 480, 240, 40, '#ffffff', 'center', 'italic 900', 6);
    pauseBtn(c);
    if (!cine && !M.lost){ c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, CAM_BTN.x, CAM_BTN.y, CAM_BTN.w, CAM_BTN.h, 8); c.fill(); txt(c, '📹', CAM_BTN.x + 21, CAM_BTN.y + 25, 18, '#ffffff', 'center');
      c.fillStyle = M.solo ? 'rgba(242,194,48,.85)' : 'rgba(0,0,0,.5)'; rr(c, CTL_BTN.x, CTL_BTN.y, CTL_BTN.w, CTL_BTN.h, 8); c.fill(); txt(c, M.solo ? '👤' : '👥', CTL_BTN.x + 21, CTL_BTN.y + 25, 18, M.solo ? '#14306b' : '#ffffff', 'center'); }
    if (M.corner && !cine){ const C = M.corner; curlDraw(c, M); powerHud(c, C.power, C.charging ? 'GÜÇ — bırakınca orta' : 'Joystick: hedef · 🌙 ORTA basılı tut: güç');
      pill(c, 'KORNER: hedefi seç, falso ver, ortala!', 480, 140, 16, 'rgba(20,48,107,.92)', '#f2c230'); }
    if (M.state === 'won' && def.free){ c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, 0, W, H); txt(c, M.res === 'w' ? 'KAZANDIN!' : M.res === 'd' ? 'BERABERE' : 'YEDEKLER KAZANDI', 480, 250, 56, M.res === 'w' ? '#f2c230' : M.res === 'd' ? '#ffffff' : '#ff6b6b', 'center', 'italic 900', 8, 900);
      txt(c, teamsN[0] + '  ' + M.score[0] + ' - ' + M.score[1] + '  ' + teamsN[1], 480, 300, 28, '#ffffff', 'center', '900', 5); if (M.coins) txt(c, '+' + M.coins + ' 🪙 jeton', 480, 338, 20, '#f2c230', 'center', '900'); tapHint(c, 480, 380, M.stT < 3.2, 'Menüye dön ▶'); }
    else if (M.state === 'won'){ c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(0, 0, W, H); txt(c, training ? 'HAZIRLIK MAÇI TAMAM!' : 'MAÇ BİTTİ — KAZANDIK!', 480, 260, 54, '#f2c230', 'center', 'italic 900', 8, 900); txt(c, 'Skor: ' + M.score[0] + ' - ' + M.score[1], 480, 306, 26, '#ffffff', 'center', 'bold', 5); }
    if (M.commT > 0 && M.comm){ c.globalAlpha = Math.min(1, M.commT * 1.5); pill(c, '🎙 ' + nm(M.comm), 450, cine ? 470 : 522, 14, 'rgba(6,10,26,.82)', '#ffffff', { maxW:430 }); c.globalAlpha = 1; }
    const rp = M.replay ? [M.replay.cam, M.replay.real, M.replay.t > M.replay.slowAt ? 1 : 0] : M.rpView;
    if (rp) drawReplayHud(c, rp[1], rp[2], M.t);
    if (M.state === 'goal' && M.goalT != null && !rp) drawGoalBanner(c, M, M.goalOurs, M.goalBy, M.goalMin, teamsN, prof, training);
    if (M.wipeT > 0){ const w = M.wipeT / .55; c.fillStyle = 'rgba(20,48,107,' + w + ')'; c.fillRect(W * (1 - w), 0, W * w, H); aracBadge(c, 480, 270, 10 + 60 * w); }
    const it = M.intro ? M.intro.t / M.intro.dur : M.itView;
    if (it != null && it >= 0) drawLineups(c, it, teams, teamsN, training, M.t, M.cam, M.solo);
    if (M.pauseM) drawPause(c);
    if (M.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H); txt(c, M.loseMsg.toUpperCase(), 480, 230, 52, '#ff6b6b', 'center', '900');
      txt(c, 'Skor: ' + M.score[0] + ' - ' + M.score[1] + ' · ' + def.need + ' gol atıp önde bitirmeliyiz. Tekrar!', 480, 280, 20, '#ffffff', 'center', 'normal', 0, 900); tapHint(c, 480, 340, M.lostT > .8, 'Tekrar dene ▶'); }
  };
  M._t = { restartAt, shootUs, teams:() => teams, me:() => me };
  return M;
}
