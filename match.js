'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   match.js
   maç (çalım · kayarak top kapma · güç + yön oku) · şut / frikik / penaltı antrenmanı
   ========================================================= */

/* ---------- ortak: şut fiziği ve kaleci ---------- */
const BAR_H = 128;               // üst direk yüksekliği
function aimInput(S, dt){
  const v = (keys.up || JOY.y < -.3 ? 1 : 0) - (keys.down || JOY.y > .3 ? 1 : 0);
  if (v) S.aim = clamp(S.aim + v * dt * .9, 0, 1);
}
function chargePower(S, dt){ S.pt += dt; const k = (S.pt * .95) % 2; S.power = k < 1 ? k : 2 - k; }
/* şut yolu: yön (aim) yüksekliği, güç hızı belirler; top bir yay çizerek kaleye gider */
function shotPath(x0, aim, power, gx, wallX){
  const dist = gx - x0;
  let hG = (aim * 1.25 + power * .55 - .25) * BAR_H + rand(-1, 1) * Math.max(0, dist - 500) / 40;
  hG = Math.max(4, hG);
  const hWall = wallX ? 40 + aim * 95 + power * 20 : null, tw = wallX ? (wallX - x0) / dist : null;
  const C = wallX ? Math.max(hG * .5, (hWall - tw * tw * hG) / (2 * (1 - tw) * tw)) : hG * .5 + 40 * aim + 20;
  return { hG, hWall, tw, C, dur: (.45 + (1 - power) * .35) * Math.max(.7, dist / 650), hGoal:hG };
}
const pathH = (P, k) => 2 * (1 - k) * k * P.C + k * k * P.hG;
function keeperDecide(path, power, dist, skillMul){
  const D = DIFF(), h = path.hG;
  if (h > BAR_H - 6) return { res:'over', guess:rand(20, 100) };
  const corner = Math.min(1, Math.abs(h - 60) / 55);       // 0 orta, 1 köşe
  const read = clamp(.42 * D.keeper * skillMul * (1 - power * .4) * (1 - corner * .6) + Math.max(0, dist - 700) / 3000, .04, .85);
  const isRead = Math.random() < read;
  const guess = isRead ? h + rand(-10, 10) : pick([22, 64, 106]) + rand(-8, 8);
  const reach = isRead ? 30 + (power < .4 ? 14 : 0) : 14;
  return { res: Math.abs(guess - h) < reach ? 'save' : 'goal', guess };
}
function drawGoal(c, gx, side = 1){
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5;
  for (let y = GROUND - BAR_H + 4; y < GROUND; y += 12){ c.beginPath(); c.moveTo(gx + 4 * side, y); c.lineTo(gx + 72 * side, y + 8); c.stroke(); }
  for (let x = 10; x < 74; x += 12){ c.beginPath(); c.moveTo(gx + x * side, GROUND - BAR_H); c.lineTo(gx + (x + 6) * side, GROUND); c.stroke(); }
  c.strokeStyle = '#ffffff'; c.lineWidth = 8; c.beginPath(); c.moveTo(gx, GROUND + 2); c.lineTo(gx, GROUND - BAR_H); c.lineTo(gx + 76 * side, GROUND - BAR_H + 8); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(gx - 4, GROUND); c.lineTo(gx - 4, GROUND - BAR_H - 4); c.stroke();
}
function drawAim(c, x0, y0, aim, power, charging){
  const th = (4 + aim * 44) * Math.PI / 180, L = 60 + power * 70;
  c.save(); c.translate(x0, y0); c.rotate(-th);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, -5, L + 18, 10);
  const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, '#2ecc71'); g.addColorStop(.6, '#f1c40f'); g.addColorStop(1, '#e74c3c');
  c.fillStyle = charging ? g : 'rgba(255,255,255,.85)'; c.fillRect(0, -4, L, 8);
  c.beginPath(); c.moveTo(L, -12); c.lineTo(L + 22, 0); c.lineTo(L, 12); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.restore();
}
function drawPowerBar(c, power, charging){
  const x = 330, y = 470, w = 300;
  c.fillStyle = 'rgba(0,0,0,.7)'; rr(c, x - 12, y - 30, w + 24, 56, 10); c.fill();
  txt(c, charging ? 'GÜÇ — bırakınca vurur' : '⚽ basılı tut: güç · ⬆⬇ yön', 480, y - 10, 14, '#ffffff', 'center', 'bold', 0, w);
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#2ecc71'); g.addColorStop(.7, '#f1c40f'); g.addColorStop(.92, '#e74c3c'); g.addColorStop(1, '#7a0000');
  c.fillStyle = '#222222'; c.fillRect(x, y, w, 14); c.fillStyle = g; c.fillRect(x, y, w * power, 14);
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + w * .92, y - 3, 2, 20);
}

/* =========================================================
   DURAN TOP: şut · frikik · penaltı
   ========================================================= */
function SetPiece(def){
  const S = { kind:'setpiece', def, t:0, shots:0, goals:0, aim:.35, power:0, pt:0, charging:false, state:'ready', stT:0, ball:null, texts:[], parts:[], keeper:null, pauseM:false, lost:false, lostT:0 };
  const GX = 860, X0 = def.mode === 'penalty' ? 600 : def.mode === 'freekick' ? 340 : 430, WALLX = def.mode === 'freekick' ? 560 : null;
  const dist = def.mode === 'penalty' ? 550 : def.mode === 'freekick' ? 1100 : 820;
  S.keeper = { x:GX - 26, y:GROUND, vy:0, dive:0, look:LOOK.keeper, animT:0, ty:0 };
  const ctrl = () => showControls('shot', { noJoy:false }); ctrl(); playMusic('football'); crowdAmb(true, .1);
  const mates = def.mode === 'penalty' ? [] : [];
  function reset(){ S.state = 'ready'; S.power = 0; S.pt = 0; S.charging = false; S.ball = null; S.keeper.y = GROUND; S.keeper.vy = 0; S.keeper.dive = 0; S.keeper.ty = 0; }
  function shoot(){
    const path = shotPath(X0, S.aim, S.power, GX, WALLX);
    let res;
    if (S.power > .93 || path.hG > BAR_H - 4){ res = 'over'; }
    else if (WALLX && path.hWall < 105){ res = 'wall'; }
    else { const k = keeperDecide(path, S.power, dist, def.mode === 'penalty' ? .8 : 1); res = k.res; S.keeper.ty = k.guess; }
    S.ball = { x:X0, y:GROUND - 10, t:0, path, res, spin:0 }; S.state = 'flight'; SFX.ballKick(); vib(25); S.shots++;
  }
  S.update = dt => {
    if (S.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ S.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)){ stats.retries++; cur = SetPiece(def); } else if (inB({ x:330, y:328, w:300, h:50 }, tap)) toCover(); } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause)){ S.pauseM = true; showControls(null); return; }
    S.t += dt; S.keeper.animT += dt;
    if (S.lost){ S.lostT += dt; if (tap && S.lostT > .8){ stats.retries++; cur = SetPiece(def); } return; }
    if (S.state === 'ready'){
      aimInput(S, dt);
      if (keys.shoot){ S.charging = true; chargePower(S, dt); }
      else if (S.charging){ S.charging = false; shoot(); }
      S.keeper.x = GX - 26 + Math.sin(S.t * 2) * 6;
    } else if (S.state === 'flight'){
      const b = S.ball; b.t += dt; const P = b.path; b.spin += dt * 20;
      const k = Math.min(1.08, b.t / P.dur); const x = lerp(X0, GX, k), h = Math.max(0, pathH(P, Math.min(1, k)));
      if (!S.keeper.dive && k > .35){ S.keeper.dive = 1; S.keeper.vy = -Math.sqrt(Math.max(0, S.keeper.ty) * 2 * 2200) - 120; }
      if (b.res === 'wall' && k >= P.tw){ S.state = 'result'; S.stT = 1.4; SFX.punch(); floatText(S, WALLX, GROUND - 160, 'BARAJ!', '#ffffff', 40); b.x = WALLX - 10; b.y = GROUND - 10 - P.hWall; return; }
      if (k >= (b.res === 'save' ? .93 : 1)){
        if (b.res === 'goal'){ S.goals++; SFX.net(); SFX.goal(); vib([60, 50, 160]); floatText(S, GX - 140, GROUND - 230, 'GOOOL!', '#f2c230', 70); say('Gol!', 'Spiker'); for (let i = 0; i < 60; i++) S.parts.push({ x:rand(500, 900), y:rand(-40, 120), vx:rand(-40, 40), vy:rand(80, 200), life:2.5, col:pick(['#f2c230', '#14306b', '#ffffff']) }); }
        else if (b.res === 'save'){ SFX.punch(); SFX.ooh(); floatText(S, GX - 140, GROUND - 200, 'KALECİ KURTARDI!', '#ffffff', 36); }
        else { SFX.ooh(); floatText(S, GX - 140, GROUND - 200, 'ÜSTTEN AUT!', '#ffffff', 36); }
        S.state = 'result'; S.stT = 1.6;
      }
      b.x = x; b.y = GROUND - 10 - h;
    } else if (S.state === 'result'){
      S.stT -= dt;
      if (S.stT <= 0){
        if (S.goals >= def.need){ S.state = 'won'; S.stT = 1.6; SFX.win(); say('Harika! Antrenman tamam.', 'Leo'); }
        else if (S.shots >= def.shots){ S.lost = true; S.lostT = 0; showControls(null); SFX.lose(); }
        else reset();
      }
    } else if (S.state === 'won'){ S.stT -= dt; if (S.stT <= 0){ stats.lvls++; stats.dmg += (S.shots - S.goals) / Math.max(1, S.shots) * .6; crowdAmb(false); next(); return; } }
    const k = S.keeper; k.vy += 2200 * dt; k.y += k.vy * dt; if (k.y >= GROUND){ k.y = GROUND; k.vy = 0; }
    for (const q of S.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; } S.parts = S.parts.filter(q => q.life > 0);
    for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 1.6);
  };
  S.draw = c => {
    if (def.bg === 'saha') bgSaha(c); else bgStad(c, S.t, { noBoard:true, camX:0 });
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(GX, 318); c.lineTo(GX - 260, 318); c.lineTo(GX - 300, H); c.stroke();
    if (def.mode === 'penalty'){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(X0, GROUND + 4, 6, 2, 0, 0, 7); c.fill(); }
    if (def.bg === 'saha' && def.coach !== false) drawHuman(c, 90, GROUND - 6, LOOK.leo, getPose({ animT:S.t, pose:'arms' }), 1, .95, 1, null, S.goals ? 'happy' : 'neutral');
    if (WALLX){ for (let i = 0; i < 3; i++) drawHuman(c, WALLX + i * 16, GROUND, LOOK[i % 2 ? 'rival2' : 'rival'], getPose({ animT:S.t + i, pose:S.state === 'flight' ? 'shock' : 'stand' }), -1, 1, 1, null, 'angry'); }
    drawGoal(c, GX);
    const k = S.keeper; drawHuman(c, k.x, k.y, k.look, getPose({ animT:k.animT, pose:k.y < GROUND - 5 ? 'cheer' : 'guard' }), -1, 1, 1, null, 'angry');
    const pl = S.state === 'ready' ? { animT:S.t, pose:S.charging ? 'guard' : 'stand' } : { animT:S.t, atk:{ m:{ dur:.42, anim:'shoot' }, t:Math.min(.42, (S.ball ? S.ball.t : 0) + .2) } };
    drawHuman(c, X0 - 26, GROUND, LOOK.issem, getPose(pl), 1, 1, 1, null, S.state === 'ready' ? 'angry' : 'shout');
    if (S.ball) drawBall(c, S.ball.x, S.ball.y, S.ball.spin); else drawBall(c, X0, GROUND - 10, 0);
    if (S.state === 'ready') drawAim(c, X0, GROUND - 10, S.aim, S.power, S.charging);
    for (const q of S.parts){ c.fillStyle = q.col; c.fillRect(q.x, q.y, 6, 4); }
    for (const t of S.texts){ c.globalAlpha = Math.max(0, 1 - t.t / 1.6); txt(c, t.text, t.x, t.y - t.t * 30, t.size || 30, t.col, 'center', 'italic 900', 6); } c.globalAlpha = 1;
    vignette(c, .3);
    pill(c, def.title || 'Şut antrenmanı', 220, 30, 18, 'rgba(0,0,0,.65)', '#f2c230', { maxW:400 });
    pill(c, 'Gol ' + S.goals + '/' + def.need + ' · Atış ' + S.shots + '/' + def.shots, 740, 30, 17, 'rgba(0,0,0,.65)', '#ffffff', { maxW:300 });
    if (S.state === 'ready') drawPowerBar(c, S.power, S.charging);
    if (S.t < 5 && S.state === 'ready' && def.hint) pill(c, def.hint, 480, 80, 16, 'rgba(20,48,107,.9)', '#ffffff');
    c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 9, 5, 18); c.fillRect(PAUSE_BTN.x + 23, PAUSE_BTN.y + 9, 5, 18);
    if (S.state === 'won'){ c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H); txt(c, 'BAŞARILI!', 480, 270, 60, '#f2c230', 'center', 'italic 900', 8); }
    if (S.pauseM) drawPause(c);
    if (S.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H); txt(c, 'OLMADI!', 480, 230, 52, '#ff6b6b', 'center', '900');
      txt(c, S.goals + ' gol attın, ' + def.need + ' gerekiyordu. İpucu: köşelere ve orta güçte vur.', 480, 280, 20, '#ffffff', 'center', 'normal', 0, 880); tapHint(c, 480, 340, S.lostT > .8, 'Tekrar dene ▶'); }
  };
  return S;
}

/* =========================================================
   MAÇ — çalım, kayarak top kapma, güç + yön oku ile şut
   ========================================================= */
function Match(def){
  const PITCH = 2760, GOALX = 2640, BOXX = 2230, MID = 1350, D = DIFF();
  const M = { kind:'match', def, t:0, camX:0, clock:def.startMin || 0, goals:0, score:(def.score || [0, 0]).slice(), state:'play', stT:0, parts:[], texts:[], pauseM:false,
    tackles:0, shot:null, lost:false, lostT:0, defs:[], extra:0, hintT:7, aim:.3, power:0, pt:0, charging:false, carrier:null,
    hint:def.hint || 'Kırmızı yanan rakip kayacak: ⬆ zıpla ya da 💨 çalım! Top kaparsa 🦶 ile kayarak geri al.' };
  const p = { x:300, y:GROUND, vy:0, vx:0, face:1, animT:0, onGround:true, dash:0, dashCd:0, run:true, slideT:0, slideCd:0 };
  const keeper = { x:GOALX - 34, y:GROUND, vy:0, animT:0, look:LOOK.keeper, ty:0, dive:0 };
  const mates = [{ off:-180, look:LOOK.mate, animT:0 }, { off:-320, look:LOOK.mate2, animT:.5 }];
  M.p = p;
  const ctrl = () => showControls('match'); ctrl(); playMusic('football'); crowdAmb(true, .14);
  const base = def.defs || [820, 1180, 1520, 1860, 2120];
  function makeDef(x){ return { x, y:GROUND, vx:0, face:-1, st:'wait', t:0, animT:Math.random() * 3, look:pick([LOOK.rival, LOOK.rival2]), onGround:true, speed:(def.training ? 150 : 205) * D.aggr, vy:0 }; }
  function resetAttack(fromX, full){
    p.x = fromX; p.y = GROUND; p.vy = 0; p.face = 1; p.dash = 0; p.slideT = 0; M.state = 'play'; M.shot = null; M.carrier = null; keeper.y = GROUND; keeper.vy = 0; keeper.dive = 0; M.charging = false; M.power = 0;
    if (full){ M.defs = base.map(makeDef); for (let i = 0; i < M.extra; i++) M.defs.push(makeDef(1000 + i * 520 + 260)); }
    else { M.defs = M.defs.filter(d => d.x > fromX + 320); for (const d of M.defs){ d.st = 'wait'; d.vx = 0; d.ball = false; }
      if (M.defs.length < 2) M.defs.push(makeDef(Math.min(BOXX - 80, fromX + 700)), makeDef(Math.min(BOXX + 60, fromX + 1050))); }
  }
  resetAttack(300, true);
  function lose(msg){ M.lost = true; M.lostT = 0; M.loseMsg = msg; showControls(null); SFX.lose(); crowdLevel(.06); }
  function restart(){ stats.retries++; crowdAmb(false); cur = Match(def); }
  function shoot(){
    const dist = GOALX - p.x, path = shotPath(p.x + 18, M.aim, M.power, GOALX, null);
    let res; if (M.power > .93 || path.hG > BAR_H - 4) res = 'over'; else if (dist > 1500) res = Math.random() < .85 ? 'save' : 'goal'; else { const k = keeperDecide(path, M.power, dist, def.training ? .75 : 1); res = k.res; keeper.ty = k.guess; }
    M.shot = { t:0, path, res, x0:p.x + 18 }; M.state = 'shot'; SFX.ballKick(); vib(30); p.atk = { m:{ dur:.42, anim:'shoot' }, t:0 }; M.charging = false;
  }
  M.update = dt => {
    if (M.pauseM){ if (tap){ if (inB({ x:330, y:200, w:300, h:54 }, tap)){ M.pauseM = false; ctrl(); } else if (inB({ x:330, y:266, w:300, h:50 }, tap)) restart(); else if (inB({ x:330, y:328, w:300, h:50 }, tap)){ crowdAmb(false); toCover(); } } return; }
    if (tap && (inB(PAUSE_BTN, tap) || tap.pause) && !M.lost){ M.pauseM = true; showControls(null); return; }
    M.t += dt; if (M.hintT > 0) M.hintT -= dt;
    if (M.lost){ M.lostT += dt; if (tap && M.lostT > .8) restart(); return; }
    if (def.time && M.state !== 'won'){ M.clock = Math.min(90, M.clock + dt * (90 - (def.startMin || 0)) / def.time);
      if (M.clock >= 90 && (M.state === 'play' || M.state === 'steal')){ SFX.longWhistle(); lose('Süre bitti!'); return; } }
    p.animT += dt; keeper.animT += dt; for (const m of mates) m.animT += dt;
    if (p.atk){ p.atk.t += dt; if (p.atk.t > p.atk.m.dur) p.atk = null; }
    if (M.state === 'play' || M.state === 'steal'){
      const slow = M.charging ? .3 : 1;
      if (p.dashCd > 0) p.dashCd -= dt; if (p.slideCd > 0) p.slideCd -= dt;
      if (p.slideT > 0){ p.slideT -= dt; p.vx = p.face * 600 * Math.min(1, p.slideT * 4 + .3); }
      else if (p.dash > 0){ p.dash -= dt; p.vx = p.face * 650; }
      else { const mv = (keys.right ? 1 : 0) - (keys.left ? 1 : 0); p.vx = mv * (M.charging ? 90 : 295); if (mv) p.face = mv; }
      if (took('dash') && p.dashCd <= 0 && p.slideT <= 0){ p.dash = .28; p.dashCd = .85; SFX.dash(); }
      if (took('tackle') && p.slideCd <= 0 && p.onGround){ p.slideT = .42; p.slideCd = .9; SFX.slide(); }
      if (took('jump') && p.onGround && p.slideT <= 0 && !M.charging){ p.vy = -760; p.onGround = false; SFX.jump(); }
      if (M.state === 'play'){
        if (M.charging){ aimInput(M, dt); chargePower(M, dt); if (!keys.shoot) shoot(); }
        else if (keys.shoot && p.onGround && p.slideT <= 0){ if (p.x > GOALX - 1700){ M.charging = true; M.pt = 0; M.power = 0; } else if (took('shoot')) floatText(M, p.x, GROUND - 150, 'Kaleye çok uzak!', '#ffffff', 22); }
      }
      p.vy += 2200 * dt; p.y += p.vy * dt; if (p.y >= GROUND){ p.y = GROUND; p.vy = 0; p.onGround = true; }
      p.x = clamp(p.x + p.vx * dt, 60, GOALX - 120);
      for (const d of M.defs){ d.animT += dt;
        const dx = p.x - d.x, dist = Math.abs(dx);
        if (d.ball){ // top rakipte: kendi kalemize koşuyor
          d.face = -1; d.vx = -d.speed * .95; d.x += d.vx * dt; d.st = 'carry';
          if (p.slideT > 0 && Math.abs(p.x + p.face * 26 - d.x) < 40){ d.ball = false; d.st = 'down'; d.t = 1; M.state = 'play'; M.carrier = null; SFX.kick(); vib(40); floatText(M, d.x, GROUND - 150, 'TOPU GERİ ALDIN!', '#7dff9a', 30); SFX.crowd(); }
          else if (d.x < 120){ if (def.training){ d.ball = false; d.st = 'down'; d.t = .5; M.state = 'play'; resetAttack(Math.max(300, p.x - 200), false); }
            else { M.score[1]++; SFX.ooh(); floatText(M, p.x, GROUND - 200, 'RAKİP GOL ATTI!', '#ff6b6b', 40); say('Rakip gol attı!', 'Spiker'); d.ball = false; M.carrier = null; M.extra++; resetAttack(300, true); return; } }
          continue; }
        if (d.st === 'wait'){ if (dist < 520) d.st = 'chase'; d.vx = 0; }
        else if (d.st === 'chase'){ d.face = dx > 0 ? 1 : -1; d.vx = d.face * d.speed * (dx > 0 ? 1.12 : 1); d.x += d.vx * dt * slow;
          if (dist < 125 && p.onGround !== false && M.state === 'play'){ d.st = 'wind'; d.t = .42 / D.aggr * (def.training ? 1.3 : 1); d.vx = 0; } }
        else if (d.st === 'wind'){ d.t -= dt * slow; d.face = dx > 0 ? 1 : -1; if (d.t <= 0){ d.st = 'slide'; d.t = .42; d.vx = d.face * 610; d.hit = false; SFX.slide(); } }
        else if (d.st === 'slide'){ d.x += d.vx * dt * slow; d.vx *= Math.pow(.3, dt); d.t -= dt * slow;
          if (!d.hit && M.state === 'play' && Math.abs(p.x - d.x) < 36 && p.y > GROUND - 24 && p.dash <= 0){ d.hit = true;
            M.tackles++; M.charging = false; SFX.hurt(); SFX.whistle(); vib(120); shake = 8; floatText(M, p.x, GROUND - 150, 'TOP KAPTIRILDI!', '#ff6b6b', 30);
            if (def.time) M.clock = Math.min(89.5, M.clock + 2);
            d.ball = true; d.st = 'carry'; M.state = 'steal'; M.carrier = d; p.stunT = .5;
            if (!M.stealHint){ M.stealHint = true; M.hint = 'Rakip topu kaptı! Peşinden koş ve 🦶 ile kayarak geri al!'; M.hintT = 5; } }
          if (d.t <= 0){ d.st = 'down'; d.t = .9; } }
        else if (d.st === 'down'){ d.t -= dt * slow; if (d.t <= 0) d.st = 'chase'; }
      }
      M.defs = M.defs.filter(d => d.ball || p.x - d.x < 900);
    }
    else if (M.state === 'shot'){
      const s = M.shot; s.t += dt; const P = s.path;
      const k = Math.min(1, s.t / P.dur); const h = Math.max(0, pathH(P, k));
      M.ballX = lerp(s.x0, GOALX + 30, k); M.ballY = GROUND - 10 - h;
      if (!keeper.dive && k > .35){ keeper.dive = 1; keeper.vy = -Math.sqrt(Math.max(0, keeper.ty) * 2 * 2200) - 120; }
      const kt = s.res === 'save' ? P.dur * .93 : P.dur;
      if (s.t >= kt){
        if (s.res === 'goal'){ M.goals++; M.score[0]++; M.state = 'goal'; M.stT = 3; SFX.net(); SFX.goal(); crowdLevel(.35); vib([80, 60, 200]); shake = 10;
          floatText(M, GOALX - 200, GROUND - 230, 'GOOOOOL!', '#f2c230', 80); say(pick(['Gol! Gol! Issem!', 'Muhteşem bir gol!', 'Ağlar havalandı!']), 'Spiker');
          for (let i = 0; i < 90; i++) M.parts.push({ x:GOALX - rand(0, 700), y:rand(-50, 200), vx:rand(-40, 40), vy:rand(80, 200), life:3, col:pick(['#f2c230', '#14306b', '#ffffff']) }); }
        else { M.state = 'nogoal'; M.stT = 1.8; SFX.ooh(); floatText(M, GOALX - 200, GROUND - 200, s.res === 'save' ? 'KALECİ KURTARDI!' : 'AUT!', '#ffffff', 44); }
      }
    }
    else if (M.state === 'goal' || M.state === 'nogoal'){
      M.stT -= dt; if (M.stT < 1) crowdLevel(.14);
      if (M.stT <= 0){
        if (M.state === 'goal'){ if (M.goals >= def.need){ M.state = 'won'; M.stT = 1.8; SFX.longWhistle(); } else { M.extra++; resetAttack(300, true); } }
        else resetAttack(Math.max(300, BOXX - 1250), false);
      }
    }
    else if (M.state === 'won'){ M.stT -= dt; if (M.stT <= 0){ stats.lvls++; stats.dmg += Math.min(1, M.tackles * .15); stats.tackles += M.tackles; crowdAmb(false); next(); return; } }
    keeper.vy += 2200 * dt; keeper.y += keeper.vy * dt; if (keeper.y >= GROUND){ keeper.y = GROUND; keeper.vy = 0; }
    keeper.x = GOALX - 34 + Math.sin(M.t * 1.5) * 8;
    for (const q of M.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; } M.parts = M.parts.filter(q => q.life > 0);
    for (const t of M.texts) t.t += dt; M.texts = M.texts.filter(t => t.t < 1.6);
    const target = M.state === 'shot' || M.state === 'goal' || M.state === 'nogoal' ? GOALX - W + 160 : M.state === 'steal' && M.carrier ? (p.x + M.carrier.x) / 2 - 480 : p.x - 300;
    M.camX = lerp(M.camX, clamp(target, 0, PITCH - W), Math.min(1, dt * 6));
  };
  M.draw = c => {
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    c.save(); c.translate(sx, sy);
    bgStad(c, M.t, { camX:M.camX, score:M.score[0] + ' - ' + M.score[1], minute:def.time ? Math.floor(M.clock) + "'" : 'ANTRENMAN', teams:def.teams || ['ANL', 'RKP'], cheer:M.state === 'goal' });
    c.translate(-Math.round(M.camX), 0);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(MID, 302); c.lineTo(MID - 60, H); c.stroke(); c.beginPath(); c.ellipse(MID - 30, 410, 140, 46, 0, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(BOXX, 302); c.lineTo(BOXX - 60, H); c.stroke(); c.beginPath(); c.moveTo(BOXX, 302); c.lineTo(GOALX + 100, 302); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(BOXX + 200, 420, 4, 0, 7); c.fill();
    drawGoal(c, GOALX);
    if (def.training) drawHuman(c, 200, GROUND - 4, LOOK.leo, getPose({ animT:M.t, pose:'arms' }), 1, .95, 1, null, 'happy');
    for (const m of mates){ const mx = p.x + m.off + Math.sin(M.t + m.off) * 30; drawHuman(c, mx, GROUND - 10, m.look, getPose({ animT:m.animT, vx:200, run:true }), 1, .9, .92); }
    drawHuman(c, keeper.x, keeper.y, keeper.look, getPose({ animT:keeper.animT, pose: keeper.y < GROUND - 5 ? 'cheer' : 'guard' }), -1, 1, 1, null, M.state === 'goal' ? 'sad' : 'angry');
    for (const d of M.defs){ const tint = d.st === 'wind' && Math.floor(d.t * 14) % 2 === 0 ? '#ff3b3b' : null;
      const pose = d.st === 'slide' ? { slide:1, animT:d.animT } : d.st === 'down' ? { pose:'lie', animT:d.animT } : { animT:d.animT, vx:d.vx || (d.ball ? -1 : 0), run:true, wind:d.st === 'wind' ? 1 : 0 };
      drawHuman(c, d.x, d.y, d.look, getPose(pose), d.face, 1, 1, tint, d.st === 'down' ? 'pain' : 'angry');
      if (d.ball) drawBall(c, d.x + d.face * 18, GROUND - 10 - Math.abs(Math.sin(d.animT * 12)) * 5, d.x / 10); }
    if (p.dash > 0 || p.slideT > 0) for (let i = 1; i < 4; i++) drawHuman(c, p.x - p.face * i * 24, p.y, LOOK.issem, getPose(Object.assign({}, p, { dashing:p.dash, slide:p.slideT })), p.face, 1, .2, '#9ad7ff');
    const pp = Object.assign({}, p, { vx:(M.state === 'play' || M.state === 'steal') ? p.vx : 0, dashing:p.dash, slide:p.slideT, pose:M.charging ? 'guard' : null });
    drawHuman(c, p.x, p.y, LOOK.issem, getPose(M.state === 'goal' ? { animT:p.animT, pose:'cheer' } : pp), p.face, 1, 1, null,
      M.state === 'goal' || M.state === 'won' ? 'happy' : M.charging ? 'angry' : M.state === 'steal' ? 'angry' : 'neutral');
    if (M.state === 'shot') drawBall(c, M.ballX, M.ballY, M.t * 20);
    else if (M.state === 'goal') drawBall(c, GOALX + 40, GROUND - 10, 0);
    else if (M.state === 'play') drawBall(c, p.x + p.face * 18, GROUND - 10 + (p.y - GROUND) * .6 - Math.abs(Math.sin(p.animT * 12)) * 5, p.x / 10);
    if (M.charging) drawAim(c, p.x + 18, GROUND - 10, M.aim, M.power, true);
    for (const q of M.parts){ c.fillStyle = q.col; c.fillRect(q.x, q.y, 6, 4); }
    for (const t of M.texts){ c.globalAlpha = Math.max(0, 1 - t.t / 1.6); txt(c, t.text, t.x, t.y - t.t * 30, t.size || 30, t.col, 'center', 'italic 900', 6); }
    c.globalAlpha = 1; c.restore();
    vignette(c, .3);
    if (def.obj) pill(c, def.obj, 12, 30, 17, 'rgba(0,0,0,.65)', '#f2c230', { align:'left', maxW:310 });
    txt(c, 'Gol: ' + M.goals + ' / ' + def.need, 24, 76, 18, '#ffffff', 'left', 'bold', 4);
    if (M.hintT > 0){ c.globalAlpha = Math.min(1, M.hintT); pill(c, M.hint, 480, 112, 16, 'rgba(20,48,107,.9)', '#ffffff'); c.globalAlpha = 1; }
    if (p.x > GOALX - 1700 && M.state === 'play' && !M.charging && Math.sin(gameTime * 6) > -.4) txt(c, '⚽ basılı tut: ŞUT!', 480, 170, 26, '#f2c230', 'center', '900', 5);
    if (M.charging) drawPowerBar(c, M.power, true);
    if (M.state === 'steal') txt(c, '🦶 KAYARAK TOPU AL!', 480, 170, 28, '#ff6b6b', 'center', '900', 5);
    c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(PAUSE_BTN.x + 13, PAUSE_BTN.y + 9, 5, 18); c.fillRect(PAUSE_BTN.x + 23, PAUSE_BTN.y + 9, 5, 18);
    if (M.state === 'won'){ c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, W, H); txt(c, def.training ? 'ANTRENMAN TAMAM!' : 'MAÇ BİTTİ!', 480, 260, 60, '#f2c230', 'center', 'italic 900', 8); }
    if (M.pauseM) drawPause(c);
    if (M.lost){ c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, 0, W, H); txt(c, M.loseMsg.toUpperCase(), 480, 230, 52, '#ff6b6b', 'center', '900');
      txt(c, 'Skor: ' + M.score[0] + ' - ' + M.score[1] + ' · Tekrar dene, bu maçı alırız!', 480, 280, 22, '#ffffff', 'center', 'normal'); tapHint(c, 480, 340, M.lostT > .8, 'Tekrar dene ▶'); }
  };
  return M;
}
