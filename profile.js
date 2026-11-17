'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   profile.js
   profil adı (aileye uygun filtre) · oyun parası · avatar mağazası
   ========================================================= */
/* ---------- isim filtresi ---------- */
const BAD_EXACT = ['amk', 'amq', 'aq', 'oc', 'mal', 'got', 'sex', 'seks', 'ibne', 'pic', 'sik', 'yarak', 'am'];
const BAD_ROOT = ['orospu', 'orosbu', 'pezevenk', 'yarrak', 'siktir', 'sikerim', 'sikik', 'sikim', 'amina', 'amcik', 'gavat', 'kahpe', 'gotveren', 'gerizekali',
  'dangalak', 'kaltak', 'fahise', 'fuck', 'shit', 'bitch', 'porno', 'nazi', 'hitler', 'salak', 'aptal', 'serefsiz', 'pust', 'yavsak', 'puşt'];
function normName(s){ return String(s || '').toLocaleLowerCase('tr-TR').replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/@/g, 'a').replace(/\$/g, 's').replace(/(.)\1+/g, '$1'); }
function nameOk(s){
  const n = normName(s); if (!n.trim()) return false;
  const toks = n.split(/[^a-z]+/).filter(Boolean), flat = n.replace(/[^a-z]/g, '');
  for (const t of toks){ if (BAD_EXACT.includes(t)) return false; for (const r of BAD_ROOT) if (t.startsWith(r)) return false; }
  for (const r of BAD_ROOT) if (r.length >= 5 && flat.includes(r)) return false;
  return true;
}
function cleanName(s, def){ s = String(s || '').replace(/[<>]/g, '').trim().slice(0, 14); return s && nameOk(s) ? s : def; }

/* ---------- para ---------- */
const COIN_3STAR = 60, COIN_3STAR_AGAIN = 15, COIN_MUL = [1, 2, 3.5];          // para yalnız 3 yıldızla: kolay az · normal orta · zor çok
function prof(){ if (!SAVE.prof) SAVE.prof = { name:'', avatar:'top', owned:['top', 'issem'], coins:0 }; return SAVE.prof; }
function awardCoins(ch, st, before){
  const P = prof(); let c = 0;
  if (st >= 3) c = Math.round((before >= 3 ? COIN_3STAR_AGAIN : COIN_3STAR) * (COIN_MUL[SAVE.diff] || 1));
  P.coins += c; persist(); return c;
}

/* ---------- avatarlar (oyuna özel, çizimle) ---------- */
const AV = [
  { id:'top', n:'Top', p:0, bg:'#14306b' }, { id:'issem', n:'Kahraman', p:0, bg:'#f2c230' },
  { id:'yildiz', n:'Yıldız', p:50, bg:'#2e86de' }, { id:'krampon', n:'Krampon', p:60, bg:'#27ae60' }, { id:'duduk', n:'Düdük', p:60, bg:'#16a085' }, { id:'kalkan', n:'Kalkan', p:80, bg:'#7f8c8d' },
  { id:'kedi', n:'Kedi', p:120, bg:'#f39c12' }, { id:'kopek', n:'Köpek', p:120, bg:'#a0662a' }, { id:'tilki', n:'Tilki', p:160, bg:'#d35400' }, { id:'baykus', n:'Baykuş', p:160, bg:'#5d4037' },
  { id:'panda', n:'Panda', p:200, bg:'#9ad7ff' }, { id:'ninja', n:'Ninja', p:260, bg:'#2c3e50' }, { id:'robot', n:'Robot', p:280, bg:'#95a5a6' }, { id:'aslan', n:'Aslan', p:320, bg:'#e67e22' },
  { id:'ufis', n:'Usta', p:350, bg:'#8a1c1c' }, { id:'kupa', n:'Altın Kupa', p:400, bg:'#111111' } ];
function drawAvatar(c, id, cx, cy, R, locked){
  const a = AV.find(x => x.id === id) || AV[0];
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
  const g = c.createRadialGradient(cx - R * .3, cy - R * .4, R * .1, cx, cy, R * 1.1); g.addColorStop(0, shade(a.bg, 1.35)); g.addColorStop(1, shade(a.bg, .7)); c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  c.translate(cx, cy); const s = R / 40; c.scale(s, s); c.lineWidth = 3; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round';
  const circ = (x, y, r, f) => { c.beginPath(); c.arc(x, y, r, 0, 7); if (f){ c.fillStyle = f; c.fill(); } c.stroke(); };
  const tri = (pts, f) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = f; c.fill(); c.stroke(); };
  const eyes = (y, d = 9, r = 3.5) => { c.fillStyle = INK; for (const x of [-d, d]){ c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } c.fillStyle = '#fff'; for (const x of [-d, d]){ c.beginPath(); c.arc(x + 1, y - 1, 1.2, 0, 7); c.fill(); } };
  switch (id){
    case 'top': circ(0, 0, 26, '#ffffff'); tri([[0, -9], [9, -2], [6, 9], [-6, 9], [-9, -2]], INK); break;
    case 'issem': c.restore(); c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip(); drawPortrait(c, cx, cy + R * .15, R * .72, 'issem', 'happy'); c.restore(); c.save(); break;
    case 'ufis': c.restore(); c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip(); drawPortrait(c, cx, cy + R * .15, R * .72, 'ufis', 'neutral'); c.restore(); c.save(); break;
    case 'yildiz': c.beginPath(); for (let k = 0; k < 10; k++){ const r = k % 2 ? 11 : 26, an = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fillStyle = '#f2c230'; c.fill(); c.stroke(); break;
    case 'krampon': c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-24, 6); c.lineTo(-18, -14); c.lineTo(-2, -14); c.lineTo(2, -4); c.lineTo(22, 2); c.quadraticCurveTo(28, 8, 22, 12); c.lineTo(-24, 12); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = INK; for (let x = -20; x < 20; x += 9) c.fillRect(x, 12, 4, 6); c.strokeStyle = '#27ae60'; c.beginPath(); c.moveTo(-14, -4); c.lineTo(8, 4); c.stroke(); break;
    case 'duduk': c.fillStyle = '#c0c6cc'; c.beginPath(); c.ellipse(4, 4, 18, 13, 0, 0, 7); c.fill(); c.stroke(); c.fillRect(-26, -8, 20, 10); c.strokeRect(-26, -8, 20, 10); circ(4, 4, 5, INK); c.strokeStyle = '#e74c3c'; c.beginPath(); c.moveTo(18, -6); c.quadraticCurveTo(30, -20, 20, -28); c.stroke(); break;
    case 'kalkan': tri([[0, -26], [22, -16], [20, 6], [0, 26], [-20, 6], [-22, -16]], '#c9d6e3'); tri([[0, -18], [14, -11], [12, 4], [0, 17], [-12, 4], [-14, -11]], '#2e86de'); break;
    case 'kedi': tri([[-22, -8], [-18, -30], [-6, -16]], '#ffb35c'); tri([[22, -8], [18, -30], [6, -16]], '#ffb35c'); circ(0, 2, 22, '#ffb35c'); eyes(-2); c.beginPath(); c.moveTo(-3, 7); c.lineTo(3, 7); c.lineTo(0, 10); c.closePath(); c.fillStyle = '#e8786a'; c.fill();
      c.beginPath(); for (const sd of [-1, 1]){ c.moveTo(sd * 8, 10); c.lineTo(sd * 26, 6); c.moveTo(sd * 8, 13); c.lineTo(sd * 26, 15); } c.stroke(); break;
    case 'kopek': c.fillStyle = '#7a4a24'; c.beginPath(); c.ellipse(-20, -2, 7, 16, .3, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(20, -2, 7, 16, -.3, 0, 7); c.fill(); c.stroke();
      circ(0, 0, 20, '#d9a066'); c.fillStyle = '#f1d3a8'; c.beginPath(); c.ellipse(0, 9, 11, 8, 0, 0, 7); c.fill(); eyes(-4, 8); circ(0, 5, 4, INK); c.beginPath(); c.moveTo(0, 9); c.lineTo(0, 13); c.stroke(); break;
    case 'tilki': tri([[-22, -10], [-16, -32], [-4, -18]], '#e8671f'); tri([[22, -10], [16, -32], [4, -18]], '#e8671f'); tri([[-26, -10], [26, -10], [0, 22]], '#e8671f');
      tri([[-14, 4], [14, 4], [0, 22]], '#ffffff'); eyes(-4, 9, 3); circ(0, 20, 3.5, INK); break;
    case 'baykus': c.fillStyle = '#8d6e63'; c.beginPath(); c.ellipse(0, 4, 24, 26, 0, 0, 7); c.fill(); c.stroke(); tri([[-20, -18], [-12, -30], [-8, -16]], '#8d6e63'); tri([[20, -18], [12, -30], [8, -16]], '#8d6e63');
      circ(-10, -4, 9, '#fff3c0'); circ(10, -4, 9, '#fff3c0'); circ(-10, -4, 4, INK); circ(10, -4, 4, INK); tri([[-4, 4], [4, 4], [0, 12]], '#f2a33a'); break;
    case 'panda': circ(-17, -18, 8, INK); circ(17, -18, 8, INK); circ(0, 2, 23, '#ffffff'); c.fillStyle = INK; c.beginPath(); c.ellipse(-9, -1, 6, 8, .4, 0, 7); c.fill(); c.beginPath(); c.ellipse(9, -1, 6, 8, -.4, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-8, -2, 2, 0, 7); c.arc(8, -2, 2, 0, 7); c.fill(); circ(0, 10, 3.5, INK); break;
    case 'ninja': circ(0, 0, 24, '#1b1f27'); c.fillStyle = '#e8b48a'; c.fillRect(-18, -8, 36, 12); c.strokeRect(-18, -8, 36, 12); eyes(-2, 8, 3.2); c.fillStyle = '#c0392b'; c.fillRect(-26, -16, 52, 6); c.beginPath(); c.moveTo(22, -14); c.lineTo(32, -4); c.lineTo(30, -18); c.fill(); break;
    case 'robot': c.fillStyle = '#c9d0d6'; c.fillRect(-20, -18, 40, 36); c.strokeRect(-20, -18, 40, 36); c.beginPath(); c.moveTo(0, -18); c.lineTo(0, -28); c.stroke(); circ(0, -30, 3, '#e74c3c');
      circ(-9, -4, 6, '#5ab0ff'); circ(9, -4, 6, '#5ab0ff'); c.fillStyle = INK; for (let x = -10; x <= 10; x += 5) c.fillRect(x - 1.5, 8, 3, 5); break;
    case 'aslan': c.fillStyle = '#b5651d'; c.beginPath(); for (let k = 0; k < 16; k++){ const an = k / 16 * Math.PI * 2, r = k % 2 ? 24 : 31; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.stroke();
      circ(0, 2, 18, '#f2b25c'); eyes(-3, 7, 3); tri([[-4, 5], [4, 5], [0, 9]], '#5a3a26'); c.beginPath(); c.moveTo(0, 9); c.quadraticCurveTo(-5, 14, -8, 11); c.moveTo(0, 9); c.quadraticCurveTo(5, 14, 8, 11); c.stroke(); break;
    case 'kupa': { const gg = c.createLinearGradient(-20, -24, 20, 24); gg.addColorStop(0, '#fff3b0'); gg.addColorStop(.5, '#e8b923'); gg.addColorStop(1, '#a0721a'); c.fillStyle = gg;
      c.beginPath(); c.moveTo(-16, -22); c.lineTo(16, -22); c.quadraticCurveTo(16, 4, 0, 8); c.quadraticCurveTo(-16, 4, -16, -22); c.fill(); c.stroke();
      c.beginPath(); c.arc(-18, -12, 7, Math.PI * .5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(18, -12, 7, -Math.PI * .5, Math.PI * .5); c.stroke();
      c.fillRect(-4, 8, 8, 9); c.strokeRect(-4, 8, 8, 9); c.fillRect(-12, 17, 24, 6); c.strokeRect(-12, 17, 24, 6); } break;
  }
  c.restore();
  if (locked){ c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); txt(c, '🔒', cx, cy + R * .2, R * .55, '#ffffff', 'center'); }
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(2, R * .07); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
}

/* ---------- profil ekranı ---------- */
function ProfileScreen(){
  const P = prof(), S = { t:0, sel:P.avatar, msg:'', msgT:0 };
  showControls(null); playMusic('menu');
  const input = document.createElement('input'); input.maxLength = 14; input.value = P.name || ''; input.placeholder = 'Adını yaz'; input.setAttribute('aria-label', 'Profil adı');
  Object.assign(input.style, { position:'absolute', zIndex:5, font:'bold 18px system-ui', padding:'4px 10px', borderRadius:'8px', border:'2px solid #f2c230', background:'#0b1020', color:'#fff' });
  document.getElementById('app').appendChild(input);
  const bBack = { x:16, y:12, w:110, h:38, size:16 }, bSave = { x:40, y:470, w:250, h:52, size:19 }, bBuy = { x:40, y:404, w:250, h:52, size:18 };
  const cell = i => ({ x:330 + (i % 4) * 152, y:62 + Math.floor(i / 4) * 116, w:144, h:108 });
  function flash(m){ S.msg = m; S.msgT = 2.2; }
  function close(){ input.remove(); toCover(); }
  S.update = dt => {
    S.t += dt; if (S.msgT > 0) S.msgT -= dt;
    const o = cvOff(); Object.assign(input.style, { left:(o.left + 40 * scale) + 'px', top:(o.top + 300 * scale) + 'px', width:(230 * scale) + 'px', fontSize:Math.max(12, 18 * scale) + 'px' });
    if (!tap) return;
    if (inB(bBack, tap)){ SFX.back(); close(); return; }
    AV.forEach((a, i) => { if (inB(cell(i), tap)){ S.sel = a.id; SFX.flip(); if (P.owned.includes(a.id)){ P.avatar = a.id; persist(); } } });
    const a = AV.find(x => x.id === S.sel);
    if (inB(bBuy, tap) && a && !P.owned.includes(a.id)){
      if (P.coins >= a.p){ P.coins -= a.p; P.owned.push(a.id); P.avatar = a.id; persist(); SFX.buy(); flash(a.n + ' senin oldu!'); }
      else { SFX.keyErr(); flash('Yeterli paran yok: her bölümü 3 yıldızla bitir, para kazan!'); } }
    if (inB(bSave, tap)){ const n = input.value.trim();
      if (n && !nameOk(n)){ SFX.keyErr(); flash('Bu isim aileye uygun değil, başka bir isim yaz.'); return; }
      P.name = n.slice(0, 14); persist(); SFX.ok(); close(); }
  };
  S.draw = c => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1a3a'); g.addColorStop(1, '#050a18'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    button(c, bBack, '◀ Geri'); txt(c, 'PROFİL', 480, 38, 28, '#f2c230', 'center', 'italic 900', 5);
    pill(c, '🪙 ' + P.coins, 880, 32, 18, 'rgba(242,194,48,.95)', '#14306b');
    drawAvatar(c, S.sel, 165, 170, 92, !P.owned.includes(S.sel));
    const a = AV.find(x => x.id === S.sel);
    txt(c, a.n, 165, 286, 20, '#ffffff', 'center', '900');
    txt(c, 'Profil adı', 40, 296, 13, '#c8d3ff', 'left', 'bold');
    if (!P.owned.includes(S.sel)) button(c, bBuy, '🪙 ' + a.p + ' · Satın al', P.coins >= a.p, S.t);
    else txt(c, P.avatar === S.sel ? '✓ Kullanılıyor' : 'Dokun: kullan', 165, 434, 17, '#7dff9a', 'center', 'bold');
    button(c, bSave, '✓ Kaydet', true, S.t);
    AV.forEach((av, i) => { const b = cell(i), own = P.owned.includes(av.id);
      c.fillStyle = S.sel === av.id ? 'rgba(242,194,48,.25)' : 'rgba(255,255,255,.06)'; rr(c, b.x, b.y, b.w, b.h, 12); c.fill();
      if (P.avatar === av.id){ c.strokeStyle = '#7dff9a'; c.lineWidth = 3; c.stroke(); }
      drawAvatar(c, av.id, b.x + b.w / 2, b.y + 42, 32, !own);
      txt(c, own ? av.n : '🪙 ' + av.p, b.x + b.w / 2, b.y + 96, 14, own ? '#ffffff' : (P.coins >= av.p ? '#f2c230' : '#ff9a8a'), 'center', 'bold', 0, b.w - 8); });
    txt(c, 'Para yalnız 3 yıldızla: Kolay +' + COIN_3STAR * COIN_MUL[0] + ' · Normal +' + COIN_3STAR * COIN_MUL[1] + ' · Zor +' + COIN_3STAR * COIN_MUL[2] + ' 🪙  (1-2 yıldız para vermez)', 640, 532, 12, '#c8d3ff', 'center', 'normal', 0, 620);
    if (S.msgT > 0){ c.globalAlpha = Math.min(1, S.msgT * 2); pill(c, S.msg, 480, 500, 16, 'rgba(10,16,40,.95)', '#ffcc66', { maxW:900 }); c.globalAlpha = 1; }
  };
  return S;
}
/* kapakta küçük profil kartı */
function profileChip(c, x, y){
  const P = prof(); c.fillStyle = 'rgba(8,12,30,.8)'; rr(c, x, y, 220, 50, 25); c.fill(); c.strokeStyle = 'rgba(242,194,48,.8)'; c.lineWidth = 2; c.stroke();
  drawAvatar(c, P.avatar, x + 25, y + 25, 21);
  txt(c, P.name || 'Profil oluştur', x + 54, y + 22, 15, '#ffffff', 'left', '900', 0, 160); txt(c, '🪙 ' + P.coins, x + 54, y + 41, 13, '#f2c230', 'left', 'bold');
  return { x, y, w:220, h:50 };
}

