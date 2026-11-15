'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   creator.js
   kendi futbolcunu oluştur · futbolcu kartı · yetenekler oyunu etkiler
   ========================================================= */
const PDEF = { name:'Issem', num:10, pos:'Forvet', age:24, nat:'Türkiye', foot:'Sağ', skin:'#e8b48a', face:'oval', eye:'#3b2a1a', hs:'curly', hair:'#3a2414', bs:'',
  band:'#f2c230', hgt:180, wt:75, shirt:'#14306b', stripe:'#f2c230', shorts:'#14306b', socks:'#f2c230', boots:'#ffffff', stats:{ hiz:80, sut:78, calim:82, guc:70, day:75 }, sup:'ates', celeb:'ucak' };
const STAT_NAMES = { hiz:'Hız', sut:'Şut', calim:'Çalım', guc:'Güç', day:'Dayanıklılık' };
const STAT_BUDGET = 385;
let PNAME = 'Issem';
function playerProfile(){ const p = Object.assign({}, PDEF, SAVE.player || {}); p.stats = Object.assign({}, PDEF.stats, (SAVE.player || {}).stats || {}); return p; }
const PST = k => (playerProfile().stats[k] - 40) / 59;              // 0..1
function applyPlayer(){
  const p = playerProfile();
  LOOK.issem = { skin:p.skin, hair:p.hair, hs:p.hs, headband:p.band || null, eye:p.eye, face:p.face, beard:p.bs ? (p.hs === 'bald' ? '#3a2414' : p.hair) : null, bs:p.bs || null,
    shirt:p.shirt, stripe:p.stripe, shorts:p.shorts, socks:p.socks, shoes:p.boots, sh:1, num:String(p.num), hgt:p.hgt / 180, wt:.82 + (p.wt - 55) / 45 * .42 };
  PNAME = (p.name || 'Issem').trim() || 'Issem'; NAMES.issem = PNAME.toLocaleUpperCase('tr-TR');
}
const nm = s => s == null ? s : String(s).replace(/Issem/g, PNAME);
function overall(p){ const s = p.stats; const w = { Forvet:[.3, .3, .2, .1, .1], 'Orta Saha':[.2, .2, .3, .1, .2], Defans:[.2, .1, .1, .35, .25], Kaleci:[.1, .1, .1, .35, .35] }[p.pos] || [.2, .2, .2, .2, .2];
  return Math.round(s.hiz * w[0] + s.sut * w[1] + s.calim * w[2] + s.guc * w[3] + s.day * w[4]); }

/* ---------- seçenekler ---------- */
const OPT = {
  skin:['#f5d0b0', '#e8b48a', '#d9a27a', '#c48d68', '#a0694a', '#7a4a32', '#55321f'],
  face:[['oval', 'Oval'], ['round', 'Yuvarlak'], ['square', 'Köşeli']],
  eye:['#3b2a1a', '#1a1a1a', '#2e6b9e', '#3f7a3a', '#7a5a2a'],
  hs:[['short', 'Kısa'], ['curly', 'Kıvırcık'], ['bun', 'Topuz'], ['spiky', 'Dikenli'], ['long', 'Uzun'], ['mohawk', 'Mohikan'], ['bald', 'Kel']],
  hair:['#111111', '#3a2414', '#6b4a2b', '#a0662a', '#d9b25a', '#c0392b', '#d9d9d9', '#2e6bd6'],
  bs:[['', 'Yok'], ['stubble', 'Kirli'], ['goatee', 'Keçi'], ['full', 'Tam'], ['long', 'Uzun']],
  band:[null, '#f2c230', '#ffffff', '#c0392b', '#2ecc71', '#111111'],
  kit:['#14306b', '#ff6a00', '#c0392b', '#ffffff', '#111111', '#27ae60', '#8e44ad', '#16a085', '#f2c230', '#2e86de', '#ec407a'],
  pos:['Forvet', 'Orta Saha', 'Defans', 'Kaleci'],
  nat:['Türkiye', 'Almanya', 'Brezilya', 'Arjantin', 'Fransa', 'İspanya', 'İngiltere', 'İtalya', 'Fas', 'Japonya', 'Nijerya', 'Hollanda', 'Portekiz', 'Azerbaycan'],
  foot:['Sağ', 'Sol'],
  sup:[['ates', 'Ateş Şutu'], ['yildirim', 'Yıldırım Şutu'], ['kasirga', 'Kasırga Tekmesi']],
  celeb:[['ucak', 'Uçak'], ['takla', 'Takla'], ['diz', 'Diz Kayması'], ['kalp', 'Kupa Selamı']],
};
const FLAG = { 'Türkiye':['#e30a17', '#ffffff', '#e30a17'], 'Almanya':['#111111', '#dd0000', '#ffce00'], 'Brezilya':['#009c3b', '#ffdf00', '#002776'], 'Arjantin':['#74acdf', '#ffffff', '#74acdf'],
  'Fransa':['#0055a4', '#ffffff', '#ef4135'], 'İspanya':['#aa151b', '#f1bf00', '#aa151b'], 'İngiltere':['#ffffff', '#ce1124', '#ffffff'], 'İtalya':['#009246', '#ffffff', '#ce2b37'],
  'Fas':['#c1272d', '#006233', '#c1272d'], 'Japonya':['#ffffff', '#bc002d', '#ffffff'], 'Nijerya':['#008751', '#ffffff', '#008751'], 'Hollanda':['#ae1c28', '#ffffff', '#21468b'],
  'Portekiz':['#006600', '#ff0000', '#ff0000'], 'Azerbaycan':['#0092bc', '#e4002b', '#00af66'] };
function drawFlag(c, nat, x, y, w, h){
  if (nat === 'Türkiye'){ c.fillStyle = '#e30a17'; c.fillRect(x, y, w, h); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + w * .38, y + h / 2, h * .3, 0, 7); c.fill(); c.fillStyle = '#e30a17'; c.beginPath(); c.arc(x + w * .44, y + h / 2, h * .24, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.save(); c.translate(x + w * .66, y + h / 2); c.beginPath(); for (let k = 0; k < 10; k++){ const r = k % 2 ? h * .07 : h * .16, a = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.restore(); }
  else if (nat === 'Japonya'){ c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h); c.fillStyle = '#bc002d'; c.beginPath(); c.arc(x + w / 2, y + h / 2, h * .3, 0, 7); c.fill(); }
  else { const f = FLAG[nat] || ['#888', '#aaa', '#888']; for (let i = 0; i < 3; i++){ c.fillStyle = f[i]; c.fillRect(x, y + i * h / 3, w, h / 3 + .5); } } c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.strokeRect(x, y, w, h); }

/* ---------- futbolcu kartı ---------- */
function drawCard(c, p, x, y, sc = 1){
  c.save(); c.translate(x, y); c.scale(sc, sc);
  const g = c.createLinearGradient(0, 0, 220, 320); g.addColorStop(0, '#fff3c0'); g.addColorStop(.45, '#e8c35a'); g.addColorStop(1, '#a8781e');
  c.beginPath(); c.moveTo(20, 0); c.lineTo(200, 0); c.lineTo(220, 30); c.lineTo(220, 270); c.lineTo(110, 320); c.lineTo(0, 270); c.lineTo(0, 30); c.closePath();
  c.fillStyle = g; c.fill(); c.strokeStyle = '#7a5410'; c.lineWidth = 3; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(20, 4); c.lineTo(120, 4); c.lineTo(40, 150); c.lineTo(4, 150); c.lineTo(4, 30); c.fill();
  txt(c, String(overall(p)), 40, 62, 44, '#3a2a00', 'center', '900');
  const ab = { Forvet:'FV', 'Orta Saha':'OS', Defans:'DF', Kaleci:'KL' }[p.pos] || 'FV';
  txt(c, ab, 40, 90, 20, '#3a2a00', 'center', '900'); drawFlag(c, p.nat, 24, 100, 32, 20);
  txt(c, '#' + p.num, 40, 146, 18, '#3a2a00', 'center', '900');
  c.save(); c.beginPath(); c.rect(70, 14, 140, 150); c.clip(); drawPortrait(c, 140, 90, 48, 'issem', 'happy'); c.restore();
  c.fillStyle = '#7a5410'; c.fillRect(20, 168, 180, 2);
  txt(c, (p.name || 'Issem').toLocaleUpperCase('tr-TR'), 110, 196, 22, '#2a1a00', 'center', '900', 0, 190);
  const S = p.stats, rows = [['HIZ', S.hiz], ['ŞUT', S.sut], ['ÇAL', S.calim], ['GÜÇ', S.guc], ['DAY', S.day], ['YAŞ', p.age]];
  rows.forEach((r, i) => { const cx = i < 3 ? 34 : 124, cy = 224 + (i % 3) * 22; txt(c, String(r[1]), cx, cy, 17, '#2a1a00', 'left', '900'); txt(c, r[0], cx + 30, cy, 15, '#3a2a00', 'left', 'bold'); });
  txt(c, (p.foot === 'Sol' ? 'Sol ayak' : 'Sağ ayak') + ' · ' + p.nat, 110, 296, 11, '#3a2a00', 'center', 'bold', 0, 170);
  c.restore();
}

/* ---------- oluşturma ekranı ---------- */
function Creator(after){
  const C = { t:0, tab:0, yaw:-.4, drag:null, p:playerProfile(), msg:'' };
  showControls(null); playMusic('menu'); applyTemp();
  const TABS = ['Görünüş', 'Kıyafet', 'Profil', 'Yetenek', 'Kart'];
  const input = document.createElement('input'); input.maxLength = 14; input.value = C.p.name; input.setAttribute('aria-label', 'Oyuncu adı');
  Object.assign(input.style, { position:'fixed', display:'none', zIndex:5, font:'bold 18px system-ui', padding:'4px 10px', borderRadius:'8px', border:'2px solid #f2c230', background:'#0b1020', color:'#fff' });
  document.body.appendChild(input);
  input.addEventListener('input', () => { C.p.name = input.value; applyTemp(); });
  function applyTemp(){ const keep = SAVE.player; SAVE.player = C.p; applyPlayer(); SAVE.player = keep; }
  function set(k, v){ C.p[k] = v; SFX.click(); applyTemp(); }
  function rows(){
    const p = C.p;
    if (C.tab === 0) return [
      { l:'Ten', sw:OPT.skin, v:p.skin, f:v => set('skin', v) }, { l:'Yüz', ch:OPT.face, v:p.face, f:v => set('face', v) },
      { l:'Göz', sw:OPT.eye, v:p.eye, f:v => set('eye', v) }, { l:'Saç', ch:OPT.hs, v:p.hs, f:v => set('hs', v) },
      { l:'Saç rengi', sw:OPT.hair, v:p.hair, f:v => set('hair', v) }, { l:'Sakal', ch:OPT.bs, v:p.bs, f:v => set('bs', v) },
      { l:'Saç bandı', sw:OPT.band, v:p.band, f:v => set('band', v) } ];
    if (C.tab === 1) return [
      { l:'Forma', sw:OPT.kit, v:p.shirt, f:v => set('shirt', v) }, { l:'Şerit', sw:OPT.kit, v:p.stripe, f:v => set('stripe', v) },
      { l:'Şort', sw:OPT.kit, v:p.shorts, f:v => set('shorts', v) }, { l:'Çorap', sw:OPT.kit, v:p.socks, f:v => set('socks', v) },
      { l:'Krampon', sw:OPT.kit, v:p.boots, f:v => set('boots', v) },
      { l:'Boy', num:[160, 200, 2, ' cm'], v:p.hgt, f:v => set('hgt', v) }, { l:'Kilo', num:[55, 100, 1, ' kg'], v:p.wt, f:v => set('wt', v) } ];
    if (C.tab === 2) return [
      { l:'Ad', input:true }, { l:'Numara', num:[1, 99, 1, ''], v:p.num, f:v => set('num', v) },
      { l:'Mevki', ch:OPT.pos.map(x => [x, x]), v:p.pos, f:v => set('pos', v) }, { l:'Yaş', num:[16, 40, 1, ''], v:p.age, f:v => set('age', v) },
      { l:'Uyruk', cyc:OPT.nat, v:p.nat, f:v => set('nat', v) }, { l:'Ayak', ch:OPT.foot.map(x => [x, x]), v:p.foot, f:v => set('foot', v) },
      { l:'Süper', ch:OPT.sup, v:p.sup, f:v => set('sup', v) }, { l:'Gol sevinci', ch:OPT.celeb, v:p.celeb, f:v => set('celeb', v) } ];
    if (C.tab === 3) return Object.keys(STAT_NAMES).map(k => ({ l:STAT_NAMES[k], stat:k, v:p.stats[k] }));
    return [];
  }
  const used = () => Object.values(C.p.stats).reduce((a, b) => a + b, 0);
  const bBack = { x:16, y:12, w:110, h:38, size:16 }, bSave = { x:596, y:478, w:350, h:52, size:20 }, bRand = { x:440, y:478, w:146, h:52, size:17 };
  let hits = [];
  function layout(c){
    hits = []; const rs = rows(); const x0 = 22, y0 = 96, rh = C.tab === 2 ? 48 : 54;
    rs.forEach((r, i) => {
      const y = y0 + i * rh;
      txt(c, r.l, x0, y + 24, 15, '#c8d3ff', 'left', 'bold', 0, 110);
      let x = x0 + 112;
      if (r.sw){ r.sw.forEach(v => { const b = { x, y, w:34, h:34 }; c.fillStyle = v || 'rgba(255,255,255,.08)'; rr(c, x, y, 34, 34, 8); c.fill();
          if (!v) txt(c, '✕', x + 17, y + 23, 16, '#ffffff', 'center');
          c.strokeStyle = v === r.v ? '#f2c230' : 'rgba(255,255,255,.35)'; c.lineWidth = v === r.v ? 4 : 1.5; c.stroke(); hits.push([b, () => r.f(v)]); x += 40; }); }
      else if (r.ch){ r.ch.forEach(([v, lab]) => { c.font = fnt(14); const w = Math.max(54, c.measureText(lab).width + 22); const b = { x, y:y + 2, w, h:32 };
          c.fillStyle = v === r.v ? '#f2c230' : 'rgba(255,255,255,.1)'; rr(c, b.x, b.y, w, 32, 9); c.fill(); txt(c, lab, x + w / 2, y + 23, 14, v === r.v ? '#14306b' : '#ffffff', 'center');
          hits.push([b, () => r.f(v)]); x += w + 6; }); }
      else if (r.num){ const [mn, mx, st, un] = r.num; const bm = { x, y, w:40, h:34 }, bp = { x:x + 150, y, w:40, h:34 };
        button(c, bm, '−'); button(c, bp, '+'); txt(c, r.v + un, x + 95, y + 24, 20, '#ffffff', 'center', '900');
        hits.push([bm, () => r.f(Math.max(mn, r.v - st))], [bp, () => r.f(Math.min(mx, r.v + st))]); }
      else if (r.cyc){ const i0 = r.cyc.indexOf(r.v), bm = { x, y, w:40, h:34 }, bp = { x:x + 230, y, w:40, h:34 };
        button(c, bm, '◀'); button(c, bp, '▶'); drawFlag(c, r.v, x + 52, y + 6, 32, 22); txt(c, r.v, x + 160, y + 24, 17, '#ffffff', 'center', 'bold', 0, 130);
        hits.push([bm, () => r.f(r.cyc[(i0 - 1 + r.cyc.length) % r.cyc.length])], [bp, () => r.f(r.cyc[(i0 + 1) % r.cyc.length])]); }
      else if (r.input){ const rect = cv.getBoundingClientRect(); Object.assign(input.style, { display:'block', left:(rect.left + (x) * scale) + 'px', top:(rect.top + (y) * scale) + 'px', width:(230 * scale) + 'px', fontSize:Math.max(12, 18 * scale) + 'px' }); }
      else if (r.stat){ const v = r.v, bw = 220; c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, x, y + 8, bw, 18, 6); c.fill();
        c.fillStyle = v >= 85 ? '#2ecc71' : v >= 70 ? '#f1c40f' : '#e67e22'; rr(c, x, y + 8, bw * (v - 40) / 59, 18, 6); c.fill();
        txt(c, String(v), x + bw + 14, y + 25, 20, '#ffffff', 'left', '900');
        const bm = { x:x + bw + 56, y, w:40, h:34 }, bp = { x:x + bw + 102, y, w:40, h:34 }; button(c, bm, '−'); button(c, bp, '+');
        hits.push([bm, () => { if (v > 40){ C.p.stats[r.stat]--; SFX.click(); } }], [bp, () => { if (v < 99 && used() < STAT_BUDGET){ C.p.stats[r.stat]++; SFX.click(); } else SFX.block(); }]); }
    });
    if (C.tab !== 2) input.style.display = 'none';
    if (C.tab === 3){ const left = STAT_BUDGET - used(); pill(c, 'Kalan puan: ' + left + ' · Genel: ' + overall(C.p), 290, 400, 17, left ? 'rgba(242,194,48,.9)' : 'rgba(46,204,113,.9)', '#14306b');
      txt(c, 'Hız: koşu · Şut: isabet ve güç · Çalım: çalım/kayma · Güç: vuruş hasarı · Dayanıklılık: can', 290, 440, 12, '#c8d3ff', 'center', 'normal', 0, 540); }
  }
  C.update = dt => {
    C.t += dt; if (!C.drag) C.yaw += dt * .35;
    if (tap){
      if (inB(bBack, tap)){ finish(false); return; }
      if (inB(bSave, tap)){ finish(true); return; }
      if (inB(bRand, tap)){ randomize(); return; }
      TABS.forEach((n, i) => { if (inB({ x:20 + i * 106, y:52, w:100, h:34 }, tap)){ C.tab = i; SFX.click(); } });
      for (const [b, f] of hits) if (inB(b, tap)){ f(); break; }
    }
  };
  cv.addEventListener('pointerdown', C.pd = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / scale; if (x > 600) C.drag = { x:e.clientX, yaw:C.yaw }; });
  addEventListener('pointermove', C.pm = e => { if (C.drag) C.yaw = C.drag.yaw + (e.clientX - C.drag.x) * .012; });
  addEventListener('pointerup', C.pu = () => { C.drag = null; });
  function randomize(){ const p = C.p; p.skin = pick(OPT.skin); p.face = pick(OPT.face)[0]; p.eye = pick(OPT.eye); p.hs = pick(OPT.hs)[0]; p.hair = pick(OPT.hair); p.bs = pick(OPT.bs)[0];
    p.band = pick(OPT.band); p.shirt = pick(OPT.kit); p.stripe = pick(OPT.kit); p.shorts = pick(OPT.kit); p.socks = pick(OPT.kit); p.boots = pick(OPT.kit);
    p.hgt = 166 + Math.round(Math.random() * 28); p.wt = 62 + Math.round(Math.random() * 25); SFX.ok(); applyTemp(); }
  function finish(saveIt){
    input.remove(); cv.removeEventListener('pointerdown', C.pd); removeEventListener('pointermove', C.pm); removeEventListener('pointerup', C.pu);
    if (saveIt){ C.p.name = (C.p.name || '').trim() || 'Issem'; SAVE.player = C.p; persist(); SFX.win(); say('Hoş geldin, ' + C.p.name + '!', 'Spiker'); }
    applyPlayer(); if (after && saveIt) after(); else toCover();
  }
  C.draw = c => {
    // 3B önizleme
    const D3 = R3.side(GROUND), b = D3 ? R3.bgFrom(c) : c;
    bgStad(b, C.t, { cheer:true, noBoard:true }); const g = b.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(5,8,25,.92)'); g.addColorStop(.55, 'rgba(5,8,25,.75)'); g.addColorStop(1, 'rgba(5,8,25,.2)'); b.fillStyle = g; b.fillRect(0, 0, W, H);
    b.fillStyle = 'rgba(242,194,48,.18)'; b.beginPath(); b.ellipse(775, 474, 120, 22, 0, 0, 7); b.fill();
    { const P = getPose({ animT:C.t, pose:C.tab === 3 ? 'guard' : C.tab === 4 ? 'arms' : null });
      if (D3) R3.charW('creator', LOOK.issem, P, 7.75, .7, 0, C.yaw, 2.1, C.tab === 3 ? 'angry' : 'happy');
      else drawHuman(c, 775, 470, LOOK.issem, P, 1, 2.3, 1, null, 'happy'); }
    if (D3) R3.render();
    // panel
    c.fillStyle = 'rgba(8,12,30,.55)'; rr(c, 10, 46, 580, 422, 14); c.fill();
    button(c, bBack, '◀ Geri');
    txt(c, 'OYUNCUNU OLUŞTUR', 360, 36, 26, '#f2c230', 'center', 'italic 900', 5);
    TABS.forEach((n, i) => { const b = { x:20 + i * 106, y:52, w:100, h:34 }; c.fillStyle = i === C.tab ? '#f2c230' : 'rgba(255,255,255,.1)'; rr(c, b.x, b.y, b.w, b.h, 9); c.fill(); txt(c, n, b.x + 50, b.y + 23, 15, i === C.tab ? '#14306b' : '#ffffff', 'center'); });
    if (C.tab === 4){ input.style.display = 'none'; drawCard(c, C.p, 150, 96, 1.1);
      txt(c, 'Kartın hazır! Yetenekler oyunda gerçekten işe yarar.', 300, 455, 14, '#c8d3ff', 'center', 'normal'); }
    else layout(c);
    if (C.tab !== 4){ txt(c, '↔ Döndürmek için sürükle', 775, 470, 13, 'rgba(255,255,255,.6)', 'center', 'normal');
      pill(c, (C.p.name || 'Issem') + ' · #' + C.p.num + ' · ' + C.p.pos + ' · ' + overall(C.p), 775, 70, 16, 'rgba(0,0,0,.6)', '#f2c230', { maxW:340 }); }
    button(c, bRand, '🎲 Rastgele'); button(c, bSave, '✓ KAYDET VE DEVAM ET', true, C.t);
  };
  return C;
}
applyPlayer();
