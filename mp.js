'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   mp.js — ÇOK OYUNCULU (2 kişi)
   Bağlantı: hesapsız, ücretsiz halka açık MQTT sunucuları (WebSocket) — aynı anda üçüne bağlanır, ilk ulaşanı kullanır.
   Oda = şifre (şifrenin özeti konu adı olur). Ev sahibi hikâyeyi yönetir; kim hangi sahnenin sahibiyse onu oynar,
   diğeri canlı izler. İki karakterin birlikte olduğu dövüşlerde ikisi aynı anda oynar ve düşman sayısı iki katına çıkar.
   ========================================================= */
const MQTT_URLS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
const MP_LOCAL = /[?&]mp=local/.test(location.search);           // test: aynı tarayıcıdaki iki sekme
const MP_TEST_BROKER = (location.search.match(/[?&]broker=([^&]+)/) || [])[1];

/* ---------- MQTT 3.1.1 istemcisi (WebSocket üzerinden, kütüphanesiz) ---------- */
function mqttClient(url, sub, onMsg, onState){
  const C = { url, ws:null, ok:false, q:[], buf:new Uint8Array(0), pid:1, dead:false };
  const enc = new TextEncoder(), dec = new TextDecoder();
  const vlen = n => { const a = []; do { let b = n % 128; n = Math.floor(n / 128); if (n > 0) b |= 128; a.push(b); } while (n > 0); return a; };
  const str = s => { const b = enc.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
  const pkt = (h, body) => { const L = vlen(body.length), u = new Uint8Array(1 + L.length + body.length); u[0] = h; u.set(L, 1); u.set(body, 1 + L.length); return u; };
  const raw = u => { try { if (C.ws && C.ws.readyState === 1) C.ws.send(u); } catch(e){} };
  C.publish = (topic, text, retain) => { const t = str(topic), p = enc.encode(text), body = new Uint8Array(t.length + p.length); body.set(t); body.set(p, t.length);
    const u = pkt(0x30 | (retain ? 1 : 0), body); if (C.ok) raw(u); else if (C.q.length < 40) C.q.push(u); };
  function open(){
    if (C.dead) return;
    try { C.ws = new WebSocket(url, ['mqtt']); } catch(e){ onState(C, 'fail'); return; }
    C.ws.binaryType = 'arraybuffer';
    C.ws.onopen = () => raw(pkt(0x10, new Uint8Array([...str('MQTT'), 4, 2, 0, 30, ...str(('ss' + MP.id + Math.random().toString(36).slice(2, 7)).slice(0, 22))])));
    C.ws.onmessage = ev => feed(new Uint8Array(ev.data));
    C.ws.onclose = () => { C.ok = false; onState(C, 'closed'); if (!C.dead) setTimeout(open, 2500); };
    C.ws.onerror = () => {};
  }
  function feed(d){
    const b = new Uint8Array(C.buf.length + d.length); b.set(C.buf); b.set(d, C.buf.length); C.buf = b;
    while (C.buf.length >= 2){
      let mul = 1, len = 0, i = 1, byte;
      do { if (i >= C.buf.length) return; byte = C.buf[i++]; len += (byte & 127) * mul; mul *= 128; } while (byte & 128);
      if (C.buf.length < i + len) return;
      handle(C.buf[0] >> 4, C.buf[0] & 15, C.buf.subarray(i, i + len)); C.buf = C.buf.slice(i + len);
    }
  }
  function handle(type, flags, b){
    if (type === 2){ if (b[1] === 0){ C.ok = true; const s = str(sub); raw(pkt(0x82, new Uint8Array([C.pid >> 8, C.pid & 255, ...s, 0]))); C.pid++; for (const u of C.q) raw(u); C.q = []; onState(C, 'ok'); } else onState(C, 'fail'); }
    else if (type === 3){ const tl = (b[0] << 8) | b[1], topic = dec.decode(b.subarray(2, 2 + tl)); let o = 2 + tl; if ((flags >> 1) & 3) o += 2; onMsg(C, topic, dec.decode(b.subarray(o)), !!(flags & 1)); }
  }
  C.ping = setInterval(() => { if (C.ok) raw(new Uint8Array([0xC0, 0])); }, 15000);
  C.close = () => { C.dead = true; clearInterval(C.ping); try { if (C.ok) raw(new Uint8Array([0xE0, 0])); C.ws && C.ws.close(); } catch(e){} };
  open(); return C;
}
/* test için yerel taşıyıcı (BroadcastChannel) */
function localClient(sub, onMsg, onState){
  const bc = new BroadcastChannel('ss-mp-local'), C = { url:'local', ok:true, dead:false }, base = sub.replace('/#', '');
  bc.onmessage = e => { const m = e.data; if (m.topic.startsWith(base)) onMsg(C, m.topic, m.text, m.retain); };
  C.publish = (topic, text, retain) => { bc.postMessage({ topic, text, retain }); if (retain) try { localStorage.setItem('ssmp:' + topic, text); } catch(e){} };
  setTimeout(() => { onState(C, 'ok'); try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k.startsWith('ssmp:' + base)) onMsg(C, k.slice(5), localStorage.getItem(k), true); } } catch(e){} }, 30);
  C.close = () => { C.dead = true; bc.close(); };
  return C;
}

/* ---------- ağ katmanı: tekrar gönderim (ack), çift mesaj ayıklama ---------- */
const NET = { cl:[], base:null, seq:0, seen:new Set(), pend:new Map(), best:null, last:0, okN:0 };
function netOpen(base){
  netClose(); NET.base = base; NET.seen = new Set(); NET.pend = new Map(); NET.best = null; NET.okN = 0;
  const onState = (C, s) => { NET.okN = NET.cl.filter(x => x.ok).length; };
  const urls = MP_TEST_BROKER ? [decodeURIComponent(MP_TEST_BROKER)] : MQTT_URLS;
  NET.cl = MP_LOCAL ? [localClient(base + '/#', netRaw, onState)] : urls.map(u => mqttClient(u, base + '/#', netRaw, onState));
}
function netClose(){ for (const C of NET.cl) try { C.close(); } catch(e){} NET.cl = []; }
function netRaw(C, topic, payload, retained){
  let m; try { m = JSON.parse(payload); } catch(e){ return; }
  if (!m || m.f === MP.id || (m.to && m.to !== MP.id)) return;
  if (m.r) netSend({ t:'ack', a:m.s, to:m.f });
  const key = m.f + ':' + m.s; if (NET.seen.has(key)) return; NET.seen.add(key); if (NET.seen.size > 4000) NET.seen = new Set([...NET.seen].slice(-2000));
  if (m.f === MP.peerId){ NET.last = performance.now(); if (!NET.best || !NET.best.ok) NET.best = C; }
  if (m.t === 'ack'){ NET.pend.delete(m.a); return; }
  mpOnMsg(m, topic, retained);
}
function netSend(m, opt = {}){
  m.f = MP.id; m.s = ++NET.seq;
  const text = JSON.stringify(m), topic = NET.base + (opt.room ? '/room' : '/m');
  const targets = opt.fast && NET.best && NET.best.ok ? [NET.best] : NET.cl;
  for (const C of targets) C.publish(topic, text, !!opt.retain);
  if (m.r) NET.pend.set(m.s, { text, topic, n:0, t:performance.now() });
}
function netTick(){ const now = performance.now(); for (const [s, p] of NET.pend){ if (now - p.t > 450){ p.t = now; if (++p.n > 24){ NET.pend.delete(s); continue; } for (const C of NET.cl) C.publish(p.topic, p.text); } } }
async function roomTopic(pass){
  const s = 'son-sampiyon:' + pass.trim().toLocaleLowerCase('tr-TR');
  try { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return 'arac-ss1/' + [...new Uint8Array(h)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join(''); }
  catch(e){ let h = 2166136261; for (const ch of s){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return 'arac-ss1/x' + h.toString(16); }
}

/* ---------- çok oyunculu durum ---------- */
const MP = { on:false, inRoom:false, role:null, id:Math.random().toString(36).slice(2, 10), peerId:null, peer:null, pass:'',
  pick:null, peerPick:null, rand:false, peerRand:false, play:false, peerPlay:false, ch:1, hostChar:null, char:null,
  rin:{ keys:{}, pressedAt:{}, jx:0, jy:0, any:false }, ev:[], rec:false, watch:true, snap:null, snapT:0, sendT:0, inT:0, lastIn:'', remoteTaps:[], status:'', hbT:0, lostT:0 };
const MP_KEYS = ['left', 'right', 'up', 'down', 'jump', 'punch', 'kick', 'block', 'slide', 'grab', 'super', 'shoot', 'dash', 'tackle', 'pass', 'thru', 'lob'];
function mpReset(){ Object.assign(MP, { on:false, inRoom:false, role:null, peerId:null, peer:null, pick:null, peerPick:null, rand:false, peerRand:false, play:false, peerPlay:false, hostChar:null, char:null, snap:null, status:'', ev:[], rec:false, remoteTaps:[], credits:false, peerStats:null, pendGoto:null, remoteIssem:null, remoteUfis:null }); }
function mpLeave(msg){
  if (MP.inRoom){ netSend({ t:'bye' }); if (MP.role === 'host') netSend({ t:'room', gone:1 }, { room:true, retain:true }); }
  setTimeout(netClose, 300); const was = MP.on; mpReset(); applyPlayer(); applyUfis(); hush();
  if (msg){ toCover(); cur.msg = msg; MP.lastMsg = msg; MP.lastMsgT = 4; } else if (was) toCover();
}
const peerName = () => (MP.peer && MP.peer.name) || 'Arkadaşın';
const myName = () => (prof().name || (SAVE.player && SAVE.player.name) || 'Oyuncu').slice(0, 14);

/* ---------- gelen mesajlar ---------- */
function mpOnMsg(m, topic, retained){
  if (topic.endsWith('/room')){ if (MP.role === 'host' && m.host && m.host !== MP.id && !m.gone && Date.now() - m.at < 25000 && !MP.peerId){ MP.roomTaken = true; } if (MP.role === 'guest' && m.host && !m.gone) MP.hostSeen = m.host; return; }
  switch (m.t){
    case 'join':
      if (MP.role !== 'host') return;
      if (MP.peerId && MP.peerId !== m.f){ netSend({ t:'full', to:m.f }); return; }
      MP.peerId = m.f; MP.peer = { name:m.name, av:m.av }; MP.peerPick = null; MP.peerRand = false; MP.peerPlay = false; NET.last = performance.now(); SFX.pickup();
      netSend({ t:'welcome', r:1, to:m.f, name:myName(), av:prof().avatar, ch:MP.ch, pick:MP.pick }); return;
    case 'welcome': if (MP.role !== 'guest' || MP.peerId) return; MP.peerId = m.f; MP.peer = { name:m.name, av:m.av }; MP.ch = m.ch; MP.peerPick = m.pick; MP.joined = true; NET.last = performance.now(); SFX.ok(); return;
    case 'full': if (MP.role === 'guest' && !MP.peerId) MP.status = 'Bu oda dolu (iki kişi oynuyor).'; return;
    case 'pick': MP.peerPick = m.who; SFX.click(); return;
    case 'rand': MP.peerRand = !!m.on; mpCheckRand(); return;
    case 'play': MP.peerPlay = !!m.on; mpCheckStart(); return;
    case 'ch': MP.ch = m.ch; return;
    case 'roles': MP.pick = m.guest === undefined ? MP.pick : (MP.role === 'host' ? m.host : m.guest); MP.peerPick = MP.role === 'host' ? m.guest : m.host; MP.rand = MP.peerRand = false; SFX.dizzy(); return;
    case 'start': if (MP.role === 'guest') mpBegin(m.hostChar, m.ch, m.i || 0); return;
    case 'goto': if (MP.role === 'guest'){ if (m.ch !== curCh || m.i === 0) stats = newStats(); if (!MP.on){ MP.pendGoto = m; return; } if (cur && cur.mpNode && curCh === m.ch && curI === m.i) return; curCh = m.ch; curI = m.i; mpRunNode(); } return;
    case 'sync': if (MP.role === 'host' && MP.on) netSend({ t:'goto', r:1, ch:curCh, i:curI }); return;
    case 'done': if (MP.role === 'host' && MP.on && m.ch === curCh && m.i === curI){ if (m.st) MP.peerStats = m.st; next(); } return;
    case 'end': if (MP.role === 'guest' && MP.on){ curCh = m.ch; const before = SAVE.stars[m.ch] || 0, coins = awardCoins(m.ch, m.st, before); SAVE.stars[m.ch] = Math.max(before, m.st); SAVE.maxCh = Math.max(SAVE.maxCh, Math.min(10, m.ch + 1)); persist(); showControls(null); hush(); cur = ChapterEnd(m.ch, m.st, m.reasons, m.ranks, coins); } return;
    case 'credits': if (MP.role === 'guest' && MP.on){ hush(); showControls(null); cur = Credits(); MP.credits = true; } return;
    case 'line': if (MP.on && cur && cur.mpLine && m.ch === curCh && m.i === curI) cur.mpLine(m.li); return;
    case 'tap': if (MP.role === 'host') MP.remoteTaps.push(m); return;
    case 'snap': if (MP.on && m.ch === curCh && m.i === curI){ MP.snap = m.d; MP.snapK = m.k; MP.snapT = performance.now(); } return;
    case 'in': if (MP.role === 'host'){ const R = MP.rin; R.keys = {}; for (const k of m.h || []) R.keys[k] = 1; for (const k of m.p || []){ R.pressedAt[k] = gameTime; R.any = true; } R.jx = m.jx || 0; R.jy = m.jy || 0; R.mv = m.wm != null ? { x:m.wx || 0, z:m.wz || 0, m:m.wm } : null; } return;
    case 'bye': if (MP.inRoom){ if (MP.credits){ mpLeave(); return; } SFX.lose(); if (MP.on) mpLeave(peerName() + ' oyundan ayrıldı.'); else { MP.peerId = null; MP.peer = null; MP.peerPick = null; MP.peerPlay = false; if (MP.role === 'guest') mpLeave('Ev sahibi odayı kapattı.'); } } return;
    case 'look': if (m.d){ if (m.who === 'issem'){ MP.remoteIssem = m.d; applyPlayer(); } else { MP.remoteUfis = m.d; applyUfis(); } } return;
    case 'hb': return;
  }
}
function mpCheckRand(){
  if (MP.role !== 'host' || !(MP.rand && MP.peerRand)) return;
  const h = Math.random() < .5 ? 'issem' : 'ufis', g = h === 'issem' ? 'ufis' : 'issem';
  MP.pick = h; MP.peerPick = g; MP.rand = MP.peerRand = false; SFX.dizzy(); netSend({ t:'roles', r:1, host:h, guest:g });
}
function mpCheckStart(){
  if (MP.role !== 'host') return;
  if (MP.play && MP.peerPlay && MP.pick && MP.peerPick && MP.pick !== MP.peerPick){ netSend({ t:'start', r:1, hostChar:MP.pick, ch:MP.ch, i:0 }); mpBegin(MP.pick, MP.ch, 0); }
}
function mpBegin(hostChar, ch, i){
  MP.on = true; MP.hostChar = hostChar; MP.char = MP.role === 'host' ? hostChar : (hostChar === 'issem' ? 'ufis' : 'issem'); MP.play = MP.peerPlay = false;
  if (MP.lobbyInput){ MP.lobbyInput.remove(); MP.lobbyInput = null; }
  applyPlayer(); applyUfis();
  netSend({ t:'look', r:1, who:MP.char, d:MP.char === 'issem' ? (SAVE.player || null) : (SAVE.ufisLook || null) });
  stats = newStats(); curCh = ch; curI = i; SFX.whistle(); if (MP.role === 'host') mpRunNode(); else if (MP.pendGoto){ const g = MP.pendGoto; MP.pendGoto = null; curCh = g.ch; curI = g.i; mpRunNode(); } else cur = MPWait('Oyun başlıyor…');
}

/* ---------- sahne sahipliği ---------- */
function mpNodeInfo(n){
  if (n.cut) return { kind:'cut', owner:'host' };
  if (n.lvl){ const ch = LEVELS[n.lvl].chars || ['issem']; if (ch.includes('issem') && ch.includes('ufis')) return { kind:'lvl', owner:'host', duo:true };
    return { kind:'lvl', owner:ch[0] === MP.hostChar ? 'host' : 'guest', solo:ch[0] }; }
  return { kind:n.match ? 'match' : 'set', owner:MP.hostChar === 'issem' ? 'host' : 'guest' };
}
function mpRunNode(){
  const C = CHAPTERS[curCh - 1];
  if (curI >= C.flow.length){ endChapter(); return; }
  const n = C.flow[curI], info = mpNodeInfo(n); FX.ts = 1; FX.zoom = 1; FX.flash = 0; hush(); MP.snap = null; MP.remoteTaps = [];
  MP.node = info; MP.owner = info.owner === MP.role; MP.rec = MP.owner && info.kind !== 'cut'; MP.ev = [];
  if (info.kind === 'cut'){ cur = Cut(n.cut); showControls(null); }
  else if (MP.owner){
    if (info.kind === 'lvl') cur = Level(n.lvl, null, info.duo ? { duo:true } : null);
    else if (info.kind === 'match') cur = R3.init() ? Match3D(n.match) : Match(n.match);
    else cur = R3.init() ? SetPiece3D(n.set) : SetPiece(n.set);
  } else cur = NodeView(n, info);
  if (cur) cur.mpNode = curCh + ':' + curI;
  if (MP.role === 'host') netSend({ t:'goto', r:1, ch:curCh, i:curI });
}
/* sahne bitti: ev sahibi ilerletir; misafir sahibiyse ev sahibine haber verir */
function mpNext(){
  if (MP.role === 'host'){ curI++; mpRunNode(); return; }
  if (MP.owner || MP.allowNext){ MP.allowNext = false; MP.rec = false; netSend({ t:'done', r:1, ch:curCh, i:curI, st:{ retries:stats.retries, dmg:stats.dmg, lvls:stats.lvls, tackles:stats.tackles, ranks:stats.ranks } }); cur = MPWait('Sahne bitti — ' + peerName() + ' bekleniyor…'); }
}
function MPWait(msg){ const S = { t:0, sy:2.5 }; showControls(null);
  S.update = dt => { S.t += dt; S.sy -= dt; if (S.sy <= 0 && MP.on && MP.role === 'guest'){ S.sy = 3; netSend({ t:'sync' }); } }; S.draw = c => { c.fillStyle = '#070b18'; c.fillRect(0, 0, W, H); txt(c, msg, 480, 270, 24, '#f2c230', 'center', 'bold', 0, 860); txt(c, '•'.repeat(1 + Math.floor(S.t * 3) % 3), 480, 310, 30, '#ffffff', 'center'); }; return S; }

/* ---------- kayıt (sahibi) → izleyicide aynı ses ve efektler ---------- */
(function wrapRecorders(){
  let depth = 0;
  for (const k of Object.keys(SFX)){ const f = SFX[k]; SFX[k] = function(...a){ if (MP.rec && depth === 0 && MP.ev.length < 80) MP.ev.push(['s', k]); depth++; try { return f.apply(this, a); } finally { depth--; } }; }
  const say0 = say; window.say = say = function(text, who, onend){ if (MP.rec && MP.ev.length < 80) MP.ev.push(['v', String(text), who || 'narr']); return say0(text, who, onend); };
  const ft0 = floatText; window.floatText = floatText = function(L, x, y, text, col, size, z){ if (MP.rec && MP.ev.length < 80) MP.ev.push(['t', Math.round(x), Math.round(y), text, col, size || 0, Math.round(z != null ? z : (L && L.p ? L.p.z || 0 : 0))]); return ft0(L, x, y, text, col, size, z); };
  const sp0 = spawnParts; window.spawnParts = spawnParts = function(L, x, y, col, n, type, sp, z){ if (MP.rec && MP.ev.length < 80) MP.ev.push(['p', Math.round(x), Math.round(y), col, n, type || 'spark', sp || 260, Math.round(z || 0)]); return sp0(L, x, y, col, n, type, sp, z); };
  const cf0 = confetti; window.confetti = confetti = function(G, n){ if (MP.rec && MP.ev.length < 80) MP.ev.push(['c', n]); return cf0(G, n); };
})();
function mpPlayEv(ev, L){
  MP.rec = false;
  for (const e of ev || []){
    if (e[0] === 's' && SFX[e[1]]) SFX[e[1]]();
    else if (e[0] === 'v') say(e[1], e[2]);
    else if (e[0] === 't' && L && L.texts) floatText(L, e[1], e[2], e[3], e[4], e[5] || undefined, e[6]);
    else if (e[0] === 'p' && L && L.parts) spawnParts(L, e[1], e[2], e[3], e[4], e[5], e[6], e[7]);
    else if (e[0] === 'c' && L && L.conf) confetti(L, e[1]);
  }
}

/* ---------- dövüş anlık görüntüsü ---------- */
const r2 = v => Math.round((v || 0) * 100) / 100, r0 = v => Math.round(v || 0);
const poseArr = f => { const p = getPose(f); return [r2(p.lean), r2(p.bob), r2(p.fl[0]), r2(p.fl[1]), r2(p.bl[0]), r2(p.bl[1]), r2(p.fa[0]), r2(p.fa[1]), r2(p.ba[0]), r2(p.ba[1]), p.lie ? 1 : 0, r2(p.rot), r2(p.spread), p.back ? 1 : 0]; };
const arrPose = a => ({ lean:a[0], bob:a[1], fl:[a[2], a[3]], bl:[a[4], a[5]], fa:[a[6], a[7]], ba:[a[8], a[9]], lie:!!a[10], rot:a[11], spread:a[12], back:!!a[13] });
function levelSnap(L){
  return { key:L.key, cam:r0(L.camX), tm:r2(L.time), sh:r0(shake), fl:r2(FX.flash), z:[r2(FX.zoom), r0(FX.zx), r0(FX.zy)], pi:L.team.indexOf(L.p), ri:L.rp ? L.team.indexOf(L.rp) : -1,
    team:L.team.map(f => [f.kind, r0(f.x), r0(f.y), f.face, r0(f.hp), f.maxhp, r0(f.sup), f.dead ? 1 : 0, poseArr(f), fHold(f, true) || 0, exprOf(f), f.inv > 0 && f.down <= 0 ? 1 : 0, f.hideG ? 1 : 0, f.dizzy > 0 ? 1 : 0, f.down > 0 ? 1 : 0, f.weapon ? [f.weapon.t, f.weapon.uses] : 0, r0(f.z), r2(f.yaw), L.d3 ? st3(f) : 0]),
    en:L.ents.map(e => [e.uid, e.type, r0(e.x), r0(e.y), e.face, r0(e.hp), e.maxhp, e.dummy ? 0 : poseArr(e), e.dummy ? '' : exprOf(e), e.flash > 0 ? 1 : 0, r2(e.wind), e.move || '', e.weapon ? e.weapon.t : 0,
      e.dizzy > 0 ? 1 : 0, e.down > 0 ? 1 : 0, e.dead ? 1 : 0, r2(e.deadT), e.dummy ? [r2(e.wob), r2(e.fall), e.fallDir || 1] : 0, e.dashing > 0 ? 1 : 0, r0(e.z), r2(e.yaw), L.d3 && !e.dummy ? st3(e) : 0]),
    ob:L.objs.map(o => [o.uid == null ? -1 : o.uid, o.t, r0(o.x), r0(o.y), o.broken ? 1 : 0, o.held ? 1 : 0, o.shakeT > 0 ? 1 : 0, o.w, o.h, r0(o.z), r2(o.rot || 0), o.d || o.w]),
    pk:L.pickups.map(k => [k.kind, r0(k.x), r0(k.y), k.w || 0, r0(k.z)]), pr:L.proj.map(b => [b.kind, r0(b.x), r0(b.y), r2(b.spin), b.w || b.obj || 0, Math.sign(b.vx), r0(b.z), r0(b.vx), r0(b.vz)]),
    sk:L.shocks.map(s => [r0(s.x), r0(s.y), r0(s.r), r2(s.life), r0(s.z)]), bu:L.bursts.map(b => [r0(b.x), r0(b.y), r2(b.t), b.big ? 1 : 0, r0(b.z)]),
    st:[L.frozen ? 1 : 0, L.lost ? 1 : 0, L.done ? 1 : 0, L.rank || '', r2(L.doneT), r2(L.lostT)], g:L.gate ? [L.gate.kind, r0(L.gate.x), L.gate.st, L.gate.hits, r2(L.gate.open)] : 0, fd:[r2(L.fade), r2(L.fadeIn)],
    hud:[L.obj || '', L.hint || '', r2(L.hintT), L.combo || 0, r2(L.comboT), L.superBanner ? [L.superBanner.name, r2(L.superBanner.t), L.superBanner.kind] : 0, L.bark ? [L.bark.who, L.bark.t] : 0, r2(L.barkT),
      L.surviveT != null ? r2(L.surviveT) : null, L.limitT != null ? r2(L.limitT) : null, r2(L.bossIntro), L.score || 0, L.pauseM ? 1 : 0, r2(L.finT || 0), L.sty ? r0(L.sty.v) : 0] };
}
function levelApply(L, s){
  L.camX = s.cam; L.time = s.tm; shake = s.sh; FX.flash = s.fl; FX.zoom = s.z[0]; FX.zx = s.z[1]; FX.zy = s.z[2];
  for (const a of s.team){ const f = L.team.find(x => x.kind === a[0]); if (!f) continue;
    f.tx = a[1]; f.ty = a[2]; f.tz = a[16] || 0; f.tyaw = a[17] || 0; if (f.x == null || Math.abs(f.x - a[1]) > 200) { f.x = a[1]; f.y = a[2]; f.z = f.tz; setYaw(f, f.tyaw); } if (a[18]) st3apply(f, a[18]);
    f.face = a[3]; f.hp = a[4]; f.maxhp = a[5]; f.sup = a[6]; f.dead = !!a[7]; f.__P = arrPose(a[8]); f.__hold = a[9]; f.__ex = a[10]; f.inv = a[11] ? .3 : 0; f.hideG = !!a[12]; f.dizzy = a[13] ? 1 : 0; f.down = a[14] ? 1 : 0; f.getup = 0;
    f.weapon = a[15] ? { t:a[15][0], uses:a[15][1] } : null; f.carry = null; }
  L.p = L.team[s.pi] || L.team[0]; L.rp = s.ri >= 0 ? L.team[s.ri] : null; L.duo = s.ri >= 0;
  if (L.duo && MP.char){ const me = L.team.find(f => f.kind === MP.char); if (me && me !== L.p){ L.rp = L.p; L.p = me; } }
  const old = new Map(L.ents.map(e => [e.uid, e])); L.ents = [];
  for (const a of s.en){ let e = old.get(a[0]); if (!e){ e = makeEnemy(a[1], a[2], {}); e.uid = a[0]; e.x = a[2]; e.y = a[3]; if (typeof enemyLook === 'function' && e.T && e.T.look) e.look = enemyLook(e.type, e.uid) || e.look; }
    e.tx = a[2]; e.ty = a[3]; e.tz = a[19] || 0; e.tyaw = a[20] || 0; if (e.z == null || Math.abs(e.x - a[2]) > 200){ e.z = e.tz; setYaw(e, e.tyaw); } if (a[21]) st3apply(e, a[21]); e.face = a[4]; e.hp = a[5]; e.maxhp = a[6]; if (a[7]) e.__P = arrPose(a[7]); e.__ex = a[8] || undefined; e.flash = a[9] ? .1 : 0; e.wind = a[10]; e.move = a[11];
    e.weapon = a[12] ? { t:a[12], uses:1 } : null; e.dizzy = a[13] ? 1 : 0; e.down = a[14] ? 1 : 0; e.dead = !!a[15]; e.deadT = a[16]; if (a[17]){ e.wob = a[17][0]; e.fall = a[17][1]; e.fallDir = a[17][2]; } e.dashing = a[18] ? 1 : 0; e.inv = 0; e.hop = 0;
    L.ents.push(e); }
  const oldO = new Map(L.objs.map(o => [o.uid, o])); L.objs = s.ob.map(a => { const o = oldO.get(a[0]) || { uid:a[0], hp:1 }; Object.assign(o, { t:a[1], x:a[2], y:a[3], broken:!!a[4], held:!!a[5], shakeT:a[6] ? .1 : 0, w:a[7], h:a[8], z:a[9] || 0, rot:a[10] || 0, d:a[11] || a[7] }); return o; });
  L.pickups = s.pk.map(a => ({ kind:a[0], x:a[1], y:a[2], w:a[3] || undefined, t:gameTime, z:a[4] || 0 }));
  L.proj = s.pr.map(a => ({ kind:a[0], x:a[1], y:a[2], spin:a[3], w:a[4] || undefined, obj:a[4] || undefined, vx:a[7] != null ? a[7] : a[5], z:a[6] || 0, vz:a[8] || 0 }));
  L.shocks = s.sk.map(a => ({ x:a[0], y:a[1], r:a[2], life:a[3], z:a[4] || 0 })); L.bursts = s.bu.map(a => ({ x:a[0], y:a[1], t:a[2], big:!!a[3], z:a[4] || 0 }));
  [L.frozen, L.lost, L.done, L.rank, L.doneT, L.lostT] = [!!s.st[0], !!s.st[1], s.st[2], s.st[3] || null, s.st[4], s.st[5]];
  L.gate = s.g ? { kind:s.g[0], x:s.g[1], st:s.g[2], hits:s.g[3], open:s.g[4] } : null; L.fade = s.fd[0]; L.fadeIn = s.fd[1];
  const h = s.hud; L.obj = h[0]; L.hint = h[1]; L.hintT = h[2]; L.combo = h[3]; L.comboT = h[4]; L.superBanner = h[5] ? { name:h[5][0], t:h[5][1], kind:h[5][2] } : null;
  L.bark = h[6] ? { who:h[6][0], t:h[6][1] } : null; L.barkT = h[7]; L.surviveT = h[8]; L.limitT = h[9]; L.bossIntro = h[10]; L.score = h[11]; L.remotePause = !!h[12];
  L.finT = h[13] || 0; L.sty = Object.assign(L.sty || { last:[], pop:0 }, { v:h[14] || 0, hold:1 }); L.fx = L.fx || { rings:[], lines:0, bars:0 }; L.fx.bars = L.finT > 0 ? 1 : Math.max(0, (L.fx.bars || 0) - .1);
}
function levelViewTick(L, dt){
  const k = Math.min(1, dt * 14);
  const ly = (f, k2) => { if (f.tyaw != null) turnTo(f, f.tyaw, k2); };
  for (const f of L.team){ if (f.tx != null){ f.x = lerp(f.x, f.tx, k); f.y = lerp(f.y, f.ty, k); f.z = lerp(f.z || 0, f.tz || 0, k); ly(f, k); } f.animT += dt; }
  for (const e of L.ents){ if (e.tx != null){ e.x = lerp(e.x, e.tx, k); e.y = lerp(e.y, e.ty, k); e.z = lerp(e.z || 0, e.tz || 0, k); ly(e, k); } e.animT += dt; }
  for (const q of L.parts){ q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z = (q.z || 0) + (q.vz || 0) * dt; q.vy += (q.type === 'dust' ? 100 : 900) * dt; q.r += dt * 8; } L.parts = L.parts.filter(q => q.life > 0);
  for (const t of L.texts) t.t += dt; L.texts = L.texts.filter(t => t.t < 1.2);
  for (const pk of L.pickups) pk.t += dt;
}
/* misafirin karakteri ev sahibinde: girişleri onunkiyle değiştirip güncelle */
function mpRemoteUpdate(L, dt, surf){
  const R = MP.rin, sk = Object.assign({}, keys), sp = Object.assign({}, pressedAt), sj = [JOY.x, JOY.y, JOY.active];
  for (const k in keys) keys[k] = R.keys[k] ? 1 : 0; for (const k in pressedAt) pressedAt[k] = null; Object.assign(pressedAt, R.pressedAt); JOY.x = R.jx; JOY.y = R.jy; JOY.active = !!(R.jx || R.jy);
  const P0 = L.p, B0 = L.botDir; L.p = L.rp; if (R.mv) L.botDir = R.mv;
  try { if (!L.rp.dead) updPlayer(L, dt, surf); }
  finally { L.p = P0; L.botDir = B0; R.pressedAt = {}; for (const k in pressedAt) if (pressedAt[k] != null && gameTime - pressedAt[k] < .22) R.pressedAt[k] = pressedAt[k];
    for (const k in keys) keys[k] = sk[k]; for (const k in pressedAt) pressedAt[k] = null; Object.assign(pressedAt, sp); [JOY.x, JOY.y, JOY.active] = sj; }
}
function mpTarget(L, e){ const a = [L.p, L.rp].filter(f => f && !f.dead); if (!a.length) return L.p; return a.reduce((b, f) => pdist(f, e) + Math.abs(f.y - e.y) * 2 < pdist(b, e) + Math.abs(b.y - e.y) * 2 ? f : b); }
function mpDupDef(def){
  const d = Object.assign({}, def);
  if (def.preset) d.preset = def.preset.flatMap(p => ETYPES[p[0]] && ETYPES[p[0]].boss ? [p] : [p, [p[0], p[1] + 70, Object.assign({}, p[2] || {})]]);
  if (def.waves) d.waves = def.waves.map(w => Object.assign({}, w, { list:w.list.concat(w.list.filter(e => !(ETYPES[e[0]] && ETYPES[e[0]].boss))) }));
  if (def.pool) d.survive = def.survive;
  return d;
}

/* ---------- izleme / ortak dövüş ekranı (sahibi olmayan taraf) ---------- */
function NodeView(n, info){
  const V = { t:0, inner:null, got:false, info, key:null, lastSend:0 };
  function build(key){
    MP.rec = false;
    if (info.kind === 'lvl'){ V.inner = Level(key || n.lvl, null, { view:true, duo:info.duo }); V.inner.update = null; V.key = key || n.lvl; }
    else if (info.kind === 'match'){ V.inner = Match3D(n.match); }
    else V.inner = SetPiece3D(n.set);
    if (!(info.kind === 'lvl' && info.duo)) showControls(null);
  }
  build();
  V.update = dt => {
    V.t += dt; const s = MP.snap;
    if (s && s !== V.lastSnap){ V.lastSnap = s; V.got = true;
      if (info.kind === 'lvl'){ if (s.key && s.key !== V.key) build(s.key); levelApply(V.inner, s); mpPlayEv(s.ev, V.inner); }
      else if (V.inner.mpApply){ V.inner.mpApply(s); mpPlayEv(s.ev, V.inner); } }
    if (info.kind === 'lvl') levelViewTick(V.inner, dt); else if (V.inner.viewTick) V.inner.viewTick(dt);
    // ortak dövüş: girişleri ev sahibine gönder
    if (info.duo){ const held = MP_KEYS.filter(k => keys[k]), pr = MP_KEYS.filter(k => pressedAt[k] != null && gameTime - pressedAt[k] < .22 && pressedAt[k] > V.lastSend);
      const sig = held.join(',') + '|' + Math.round(JOY.x * 10) + ',' + Math.round(JOY.y * 10);
      if (pr.length || sig !== V.sig || gameTime - V.lastSend > .25){ V.sig = sig; const mv = V.inner && V.inner.d3 ? moveIn(V.inner) : null; netSend(Object.assign({ t:'in', h:held, p:pr, jx:r2(JOY.x), jy:r2(JOY.y) }, mv ? { wx:r2(mv.x), wz:r2(mv.z), wm:r2(mv.m) } : {}), { fast:true }); V.lastSend = gameTime; }
      if (tap && !V.got) netSend({ t:'in', h:[], p:['punch'] }, { fast:true }); }
    else if (tap && inB({ x:W - 182, y:56, w:170, h:34 }, tap)){ MP.watch = !MP.watch; SFX.click(); }
  };
  V.draw = c => {
    if (!V.got){ c.fillStyle = '#070b18'; c.fillRect(0, 0, W, H); txt(c, info.duo ? 'Ortak dövüş hazırlanıyor… ' + peerName() + ' bekleniyor' : peerName() + ' oynuyor — görüntü bekleniyor…', 480, 260, 22, '#f2c230', 'center', 'bold', 0, 880);
      txt(c, '•'.repeat(1 + Math.floor(V.t * 3) % 3), 480, 300, 30, '#ffffff', 'center'); return; }
    if (!info.duo && !MP.watch){ c.fillStyle = '#070b18'; c.fillRect(0, 0, W, H); drawAvatar(c, MP.peer && MP.peer.av || 'top', 480, 210, 60);
      txt(c, peerName() + ' kendi sahnesini oynuyor', 480, 310, 24, '#ffffff', 'center', 'bold', 0, 880); txt(c, 'Sıra sana gelince oyun otomatik devam eder.', 480, 344, 17, '#c8d3ff', 'center', 'normal'); }
    else V.inner.draw(c);
    if (!info.duo){ pill(c, '👁 ' + (MP.watch ? 'İZLİYORSUN · ' + peerName() + ' oynuyor' : 'Bekliyorsun'), 480, 72, 15, 'rgba(10,16,40,.88)', '#7dff9a', { maxW:520 });
      button(c, { x:W - 182, y:56, w:170, h:34, size:14 }, MP.watch ? '👁 İzlemeyi kapat' : '👁 İzle'); }
    if (V.inner && V.inner.remotePause) pill(c, peerName() + ' oyunu duraklattı', 480, 270, 20, 'rgba(0,0,0,.8)', '#ffffff');
  };
  return V;
}

/* ---------- döngü kancası: anlık görüntü gönder, kalp atışı, kopma kontrolü ---------- */
function mpTick(dt){
  if (!NET.cl.length) return;
  netTick();
  MP.hbT -= dt; if (MP.hbT <= 0 && MP.peerId){ MP.hbT = 2; netSend({ t:'hb' }, { fast:true }); }
  if (MP.on && MP.owner && cur && MP.node && MP.node.kind !== 'cut'){
    MP.sendT -= dt;
    if (MP.sendT <= 0){ MP.sendT = MP.node.duo ? 1 / 18 : 1 / 14;
      let d = null; if (cur.kind === 'fight') d = levelSnap(cur); else if (cur.mpSnap) d = cur.mpSnap();
      if (d){ d.ev = MP.ev; MP.ev = []; netSend({ t:'snap', ch:curCh, i:curI, k:MP.node.kind, d }, { fast:true }); } } }
  if (MP.on && MP.peerId){ const gap = performance.now() - NET.last; MP.lostT = gap > 12000 ? MP.lostT + dt : 0; }
}
function mpOverlay(c){
  if (MP.lastMsgT > 0){ MP.lastMsgT -= 1 / 60; pill(c, MP.lastMsg, 480, 500, 17, 'rgba(10,16,40,.92)', '#ffcc66', { maxW:900 }); }
  if (!MP.on) return;
  pill(c, '👥 ' + (MP.char === 'issem' ? NAMES.issem : 'UFİS') + ' · ' + myName() + '  ⇄  ' + peerName(), 480, H - 14, 11, 'rgba(10,16,40,.75)', '#c8d3ff', { maxW:520 });
  if (MP.lostT > 0){ c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(0, 0, W, H); txt(c, 'Bağlantı zayıf — ' + peerName() + ' bekleniyor…', 480, 250, 26, '#ffcc66', 'center', 'bold', 0, 860);
    button(c, MP_QUIT, 'Menüye dön'); }
}
const MP_QUIT = { x:380, y:300, w:200, h:48, size:18 };

/* =========================================================
   LOBİ: oda kur / katıl / karakter seç / oyna
   ========================================================= */
function Lobby(){
  const S = { t:0, mode:'menu', msg:'', busy:false };
  showControls(null); playMusic('menu');
  const input = document.createElement('input'); input.maxLength = 20; input.placeholder = 'Oda şifresi'; input.setAttribute('aria-label', 'Oda şifresi'); input.autocomplete = 'off';
  Object.assign(input.style, { position:'absolute', zIndex:5, display:'none', font:'bold 20px system-ui', padding:'6px 12px', borderRadius:'10px', border:'2px solid #f2c230', background:'#0b1020', color:'#fff', textAlign:'center' });
  document.getElementById('app').appendChild(input); MP.lobbyInput = input;
  const bBack = { x:16, y:12, w:110, h:38, size:16 }, bHost = { x:250, y:220, w:220, h:110, size:22 }, bJoin = { x:490, y:220, w:220, h:110, size:22 }, bGo = { x:380, y:330, w:200, h:52, size:20 };
  const bIs = { x:250, y:300, w:150, h:52, size:20 }, bUf = { x:410, y:300, w:150, h:52, size:20 }, bRnd = { x:570, y:300, w:140, h:52, size:18 }, bPlay = { x:330, y:400, w:300, h:58, size:22 };
  const bChL = { x:330, y:250, w:40, h:36 }, bChR = { x:590, y:250, w:40, h:36 };
  function posInput(){ const o = cvOff(); Object.assign(input.style, { display:S.mode === 'host' || S.mode === 'join' ? 'block' : 'none', left:(o.left + 330 * scale) + 'px', top:(o.top + 262 * scale) + 'px', width:(300 * scale - 28) + 'px', fontSize:Math.max(14, 20 * scale) + 'px' }); }
  function close(){ input.remove(); MP.lobbyInput = null; }
  async function create(){
    const pass = input.value.trim(); if (pass.length < 4){ S.msg = 'Şifre en az 4 karakter olmalı.'; SFX.keyErr(); return; }
    S.busy = true; S.msg = 'Oda kuruluyor…'; mpReset(); MP.role = 'host'; MP.pass = pass; MP.ch = SAVE.cur && SAVE.cur.ch ? Math.min(SAVE.maxCh, SAVE.cur.ch) : 1;
    netOpen(await roomTopic(pass)); MP.roomTaken = false;
    setTimeout(() => {
      if (MP.roomTaken){ S.msg = 'Bu şifreyle açık bir oda var. Başka şifre seç.'; netClose(); mpReset(); S.busy = false; SFX.keyErr(); return; }
      MP.inRoom = true; S.mode = 'room'; S.busy = false; S.msg = ''; netSend({ t:'room', host:MP.id, at:Date.now() }, { room:true, retain:true }); SFX.ok(); }, 1800);
  }
  async function join(){
    const pass = input.value.trim(); if (pass.length < 4){ S.msg = 'Şifreyi yaz (en az 4 karakter).'; SFX.keyErr(); return; }
    S.busy = true; S.msg = 'Odaya bağlanılıyor…'; mpReset(); MP.role = 'guest'; MP.pass = pass; MP.joined = false; netOpen(await roomTopic(pass));
    let n = 0; const tryJoin = () => { if (MP.joined || MP.role !== 'guest' || S.mode !== 'join'){ return; } if (++n > 12){ S.msg = MP.status || 'Oda bulunamadı. Şifreyi ve arkadaşının odayı kurduğunu kontrol et.'; S.busy = false; netClose(); SFX.keyErr(); return; }
      netSend({ t:'join', name:myName(), av:prof().avatar }); setTimeout(tryJoin, 1000); };
    setTimeout(tryJoin, 600);
  }
  S.update = dt => {
    S.t += dt; posInput();
    if (MP.role === 'guest' && MP.joined && S.mode === 'join'){ S.mode = 'room'; MP.inRoom = true; S.busy = false; S.msg = ''; }
    if (MP.role === 'host' && MP.inRoom){ S.annT = (S.annT || 0) - dt; if (S.annT <= 0){ S.annT = 8; netSend({ t:'room', host:MP.id, at:Date.now() }, { room:true, retain:true }); } }
    if (!tap) return;
    if (inB(bBack, tap)){ SFX.back(); if (S.mode === 'menu'){ close(); mpLeave(); toCover(); } else { if (MP.inRoom || NET.cl.length) mpLeave(); S.mode = 'menu'; S.msg = ''; S.busy = false; MP.lobbyInput = input; } return; }
    if (S.mode === 'menu'){ if (inB(bHost, tap)){ S.mode = 'host'; SFX.click(); input.value = ''; } else if (inB(bJoin, tap)){ S.mode = 'join'; SFX.click(); input.value = ''; } return; }
    if ((S.mode === 'host' || S.mode === 'join') && inB(bGo, tap) && !S.busy){ SFX.click(); if (S.mode === 'host') create(); else join(); return; }
    if (S.mode === 'room'){
      if (inB(bIs, tap) || inB(bUf, tap)){ MP.pick = inB(bIs, tap) ? 'issem' : 'ufis'; MP.play = false; netSend({ t:'pick', r:1, who:MP.pick }); netSend({ t:'play', r:1, on:0 }); SFX.click(); }
      else if (inB(bRnd, tap)){ MP.rand = !MP.rand; netSend({ t:'rand', r:1, on:MP.rand ? 1 : 0 }); SFX.click(); mpCheckRand(); }
      else if (inB(bPlay, tap)){ if (!MP.pick || !MP.peerPick || MP.pick === MP.peerPick){ SFX.keyErr(); S.msg = !MP.peerId ? 'Arkadaşın henüz odada değil.' : MP.pick === MP.peerPick ? 'İkiniz aynı karakteri seçtiniz.' : 'Önce karakter seçin.'; return; }
        MP.play = !MP.play; netSend({ t:'play', r:1, on:MP.play ? 1 : 0 }); SFX.ok(); mpCheckStart(); }
      else if (MP.role === 'host' && (inB(bChL, tap) || inB(bChR, tap))){ MP.ch = clamp(MP.ch + (inB(bChR, tap) ? 1 : -1), 1, SAVE.maxCh); netSend({ t:'ch', r:1, ch:MP.ch }); SFX.click(); }
    }
  };
  function card(c, x, name, av, pk, rnd, ready, me){
    c.fillStyle = me ? 'rgba(242,194,48,.14)' : 'rgba(90,160,255,.12)'; rr(c, x, 96, 220, 140, 16); c.fill(); c.strokeStyle = me ? '#f2c230' : '#5aa0ff'; c.lineWidth = 2; c.stroke();
    if (name == null){ txt(c, 'Bekleniyor…', x + 110, 172, 18, '#c8d3ff', 'center', 'bold'); return; }
    drawAvatar(c, av || 'top', x + 44, 150, 30); txt(c, name, x + 84, 136, 17, '#ffffff', 'left', '900', 0, 130); txt(c, me ? '(sen)' : '(arkadaşın)', x + 84, 158, 12, '#c8d3ff', 'left', 'normal');
    if (pk){ c.save(); c.beginPath(); c.arc(x + 178, 142, 26, 0, 7); c.fillStyle = '#1b2a48'; c.fill(); c.clip(); drawPortrait(c, x + 178, 147, 19, pk, 'happy'); c.restore(); }
    txt(c, pk ? (pk === 'issem' ? 'ISSEM' : 'UFİS') + ' seçti' : 'Karakter seçmedi', x + 110, 200, 15, pk ? '#7dff9a' : '#ffcc66', 'center', 'bold', 0, 200);
    txt(c, (rnd ? '🎲 Rastgele ' : '') + (ready ? '▶ Hazır' : ''), x + 110, 224, 14, '#f2c230', 'center', 'bold');
  }
  S.draw = c => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1a3a'); g.addColorStop(1, '#050a18'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    button(c, bBack, '◀ Geri'); txt(c, '👥 ÇOK OYUNCULU', 480, 40, 30, '#f2c230', 'center', 'italic 900', 5);
    if (S.mode === 'menu'){
      txt(c, 'İki kişi: biri Issem, biri Ufis. Her biri kendi telefonundan.', 480, 120, 17, '#c8d3ff', 'center', 'normal', 0, 860);
      button(c, bHost, '🏠 ODA KUR', true, S.t); button(c, bJoin, '🔑 ODAYA KATIL', true, S.t + 1);
      txt(c, 'Odayı kuran şifreyi belirler, arkadaşın aynı şifreyle katılır.', 480, 380, 15, '#ffffff', 'center', 'normal', 0, 860);
      txt(c, 'Not: internet bağlantısı gerekir. Şifreyi sadece arkadaşınla paylaş.', 480, 406, 13, '#8fa0c8', 'center', 'normal', 0, 860); }
    else if (S.mode === 'host' || S.mode === 'join'){
      txt(c, S.mode === 'host' ? 'Oda için bir şifre belirle' : 'Arkadaşının oda şifresini yaz', 480, 232, 20, '#ffffff', 'center', 'bold');
      button(c, bGo, S.busy ? 'Bekle…' : S.mode === 'host' ? '✓ ODAYI KUR' : '✓ KATIL', !S.busy, S.t);
      if (NET.cl.length) txt(c, 'Sunucu bağlantısı: ' + NET.cl.filter(x => x.ok).length + ' / ' + NET.cl.length, 480, 410, 13, '#8fa0c8', 'center', 'normal'); }
    else {
      const me = { name:myName(), av:prof().avatar }, other = MP.peerId ? MP.peer : null;
      const L = MP.role === 'host' ? [me, other, true] : [other, me, false];
      card(c, 250, L[0] && L[0].name, L[0] && L[0].av, L[2] ? MP.pick : MP.peerPick, L[2] ? MP.rand : MP.peerRand, L[2] ? MP.play : MP.peerPlay, L[2]);
      card(c, 490, L[1] && L[1].name, L[1] && L[1].av, L[2] ? MP.peerPick : MP.pick, L[2] ? MP.peerRand : MP.rand, L[2] ? MP.peerPlay : MP.play, !L[2]);
      txt(c, 'ODA: ' + '•'.repeat(MP.pass.length) + (MP.role === 'host' ? '  (sen kurdun)' : ''), 480, 82, 14, '#8fa0c8', 'center', 'bold');
      if (MP.role === 'host'){ button(c, bChL, '◀'); button(c, bChR, '▶'); txt(c, 'Bölüm ' + MP.ch + ' · ' + CHAPTERS[MP.ch - 1].title, 480, 274, 15, '#ffffff', 'center', 'bold', 0, 210); }
      else txt(c, 'Bölüm ' + MP.ch + ' · ' + CHAPTERS[MP.ch - 1].title, 480, 274, 15, '#ffffff', 'center', 'bold', 0, 300);
      button(c, bIs, '⚽ ISSEM', MP.pick === 'issem'); button(c, bUf, '🥋 UFİS', MP.pick === 'ufis'); button(c, bRnd, '🎲 Rastgele', MP.rand);
      const can = MP.peerId && MP.pick && MP.peerPick && MP.pick !== MP.peerPick;
      button(c, bPlay, MP.play ? '✓ HAZIRSIN — arkadaşın bekleniyor' : '▶ OYNA', can, S.t);
      txt(c, !MP.peerId ? 'Arkadaşın şifreyle katılınca burada görünecek.' : MP.pick && MP.pick === MP.peerPick ? 'İkiniz aynı karakteri seçtiniz — biriniz değiştirin.' : 'İkiniz de OYNA\'ya basınca oyun başlar. İkiniz de Rastgele\'ye basarsanız karakterler rastgele dağıtılır.', 480, 488, 14, '#c8d3ff', 'center', 'normal', 0, 900); }
    if (S.msg) pill(c, S.msg, 480, 520, 16, 'rgba(10,16,40,.95)', '#ffcc66', { maxW:900 });
  };
  return S;
}
