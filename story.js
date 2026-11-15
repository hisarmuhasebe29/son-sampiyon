'use strict';
/* =========================================================
   SON ŞAMPİYON — ARAÇ   ·   story.js
   Senaryo: ARAÇ  ·  10 bölüm (İlk Film)
   ========================================================= */
const N = (t, o) => Object.assign({ n:t }, o || {});
const S = (who, t, o) => Object.assign({ who, t }, o || {});
const CARD = (card, sub) => ({ card, sub: sub || '' });
const A = (id, look, x, face, o) => Object.assign({ id, look, x, face }, o || {});

/* ---------------- OYNANABİLİR BÖLÜMLER ---------------- */
const LEVELS = {
  /* --- Bölüm 1 --- */
  dojo: { bg:'dojo', chars:['ufis'], width:W, start:150, custom:true, objects:[['koli', 860], ['kutu', 900], ['sise', 300]],
    init(L){ [430, 620, 780].forEach(x => L.ents.push(makeEnemy('dummy', x))); L.obj = '👊 ve 🦵 ile 3 kuklayı devir (0/3)'; L.hint = '👊 tuşuna arka arkaya 3 kez bas: KOMBO! ⬇+🦵 süpürme, 💨 kayarak tekme'; L.hintT = 8; },
    update(L){ if (L.done) return; const left = L.ents.filter(e => !e.dead).length;
      L.obj = '👊 ve 🦵 ile 3 kuklayı devir (' + (3 - left) + '/3)'; if (left === 0){ L.obj = 'Usta işi! 🥋'; L.done = 1; SFX.ok(); } } },
  tunel: { bg:'tunel', chars:['issem'], width:2700, start:120, exit:true, gate:{ kind:'door', room:'sokak1' }, platforms:[{ x1:1500, x2:1840, y:320, style:'scaffold' }], obj:'Çetecileri geç, tünelden çık!', hint:'Düşman KIRMIZI yanınca vuracak → 🛡️ blokla ya da ⬇ eğil!',
    preset:[['thug', 600, { weapon:null }], ['thug', 720, { weapon:'sopa' }]],
    objects:[['koli', 430], ['koli', 470], ['kutu', 1180], ['sise', 900], ['kutu', 1950], ['koli', 2000], ['varil', 2380]],
    waves:[ { at:1000, list:[['thug', 1], ['thug', -1], ['thug', 1]], hint:'Sopası düşerse ✋ ile al! Kolileri kır, içinden can çıkabilir.' },
            { at:1700, list:[['brute', 1], ['thug', -1]], hint:'İri Koruma! Uzaktan ⚽ şut, sersemleyince kombo!' }, { at:2250, list:[['brute', 1], ['thug', 1], ['thug', -1]] } ] },
  sokak1: { bg:'sokak', weather:'snow', chars:['issem'], width:2300, start:150, exit:true, obj:'Karlı sokak: çeteyi dağıt, yola devam!', hint:'Çöp kutusunu ✋ ile kaldır, düşmana fırlat!',
    preset:[['thug', 620, { face:-1 }], ['thug', 740, { face:-1, weapon:'sopa' }]], objects:[['cop', 380], ['cop', 1250], ['koli', 1300], ['cop', 1900], ['sise', 1050]],
    platforms:[{ x1:1280, x2:1600, y:300, style:'balcony' }],
    crowd:[['civ1', 260, 'arms', 1], ['civ2', 520, 'shock', -1], ['civ3', 980, 'arms', -1], ['civ4', 1380, 'arms', 1], ['civ5', 1760, 'arms', -1], ['civ2', 2100, 'shock', -1]],
    waves:[ { at:950, list:[['thug', 1], ['masked', -1], ['thug', 1]], hint:'Koşarken 🦵 = UÇAN TEKME · ⬇ + 👊 = APARKAT!' }, { at:1650, list:[['brute', 1], ['thug', -1], ['thug', 1], ['masked', 1, { y:300 }]], hint:'Balkonda biri var! Yangın merdiveninden 🪜 ⬆ tırman.' } ] },
  /* --- Bölüm 2 --- */
  depoHayatta: { bg:'depo', chars:['issem'], width:W, start:470, startFace:-1, survive:32, pool:['masked', 'masked', 'thug'], obj:'Kaçış yok! Dayan!', hint:'Etrafın sarıldı. Blokla, vur, üst kata zıpla!', doneMsg:'Biri geliyor…',
    preset:[['masked', 200, { face:1 }], ['masked', 290, { face:1, weapon:'sise' }], ['masked', 640, { face:-1 }]],
    platforms:[{ x1:640, x2:930, y:330 }], objects:[['kutu', 60], ['koli', 110], ['varil', 880, 330], ['sise', 760, 330]] },
  depoKacis: { bg:'depo', chars:['issem', 'ufis'], width:2400, start:470, exit:true, gate:{ kind:'ladder', room:'depoCati' }, obj:'Ufis ile depodan çık!', hint:'⇄ ile Issem ve Ufis arasında geçiş yap! Varili ✋ ile kaldırıp fırlat!',
    preset:[['masked', 200, { face:1 }], ['masked', 760, { face:-1, weapon:'sopa' }], ['kicker', 850, { face:-1 }]],
    platforms:[{ x1:1100, x2:1500, y:330 }], objects:[['varil', 560], ['kutu', 1000], ['kutu', 1050], ['dolap', 1650], ['koli', 1900], ['koli', 1945], ['kutu', 2150]],
    waves:[ { at:1000, list:[['kicker', 1], ['masked', -1], ['masked', 1, { y:330 }]], hint:'Biri üst katta! ⬆ zıpla, ⬇+⬆ ile aşağı in.' },
            { at:1700, list:[['brute', 1], ['masked', -1], ['kicker', 1]] } ] },
  depoCati: { bg:'depo', chars:['issem', 'ufis'], width:W, start:170, obj:'Çatı katı: yolu aç, camdan kaç!', hint:'Merdivenle üst kata ⬆ tırman! İş bitince camı kır.',
    preset:[['masked', 560, { face:-1 }], ['kicker', 700, { face:-1 }], ['masked', 640, { face:-1, weapon:'sopa', y:330 }]],
    platforms:[{ x1:520, x2:780, y:330 }], objects:[['koli', 380], ['kutu', 425], ['sise', 700, 330]], gate:{ kind:'window', x:880, room:'arkaSokak' } },
  arkaSokak: { bg:'arkaSokak', weather:'rain', chars:['issem', 'ufis'], width:2000, start:160, exit:true, platforms:[{ x1:1180, x2:1460, y:300, style:'balcony', ladder:false }], stairs:[[970, 300, 6, 1]], obj:'Arka sokak: yağmurda kaç!', hint:'Sersemleyen düşmanı ✋ ile KALDIR, 👊 ile fırlat!',
    preset:[['masked', 620, { face:-1 }], ['thug', 760, { face:-1, weapon:'boru' }]], objects:[['cop', 420], ['cop', 470], ['varil', 780], ['cop', 1560], ['koli', 1610]],
    waves:[ { at:900, list:[['masked', 1], ['kicker', -1], ['thug', 1]], hint:'Koşarken 🦵 = UÇAN TEKME · ⬇ + 👊 = APARKAT!' }, { at:1500, list:[['brute', 1], ['masked', -1]] } ] },
  /* --- Bölüm 3 --- */
  fabrikaGiris: { bg:'fabrikaDis', chars:['issem', 'ufis'], width:W, start:300, gate:{ kind:'door', x:640 }, obj:'Nöbetçileri sustur!',
    preset:[['guard', 520, { face:-1 }], ['guard', 700, { face:-1, weapon:'sopa' }], ['shield', 820, { face:-1 }]],
    objects:[['varil', 120], ['kutu', 440], ['koli', 900]], doneMsg:'Avlu temiz!',
    waves:[ { at:-1, list:[['kicker', 1], ['guard', -1]], hint:'Kalkanlı koruma! Önden yumruk işlemez: 🦵, 💨 ya da silah!' } ] },
  fabrikaIc: { bg:'fabrika', chars:['issem', 'ufis'], width:2800, start:300, exit:true, gate:{ kind:'door' }, alarm:true, obj:'Alarm! Koridorun sonundaki kapıya ulaş!',
    preset:[['guard', 700, { face:-1 }], ['guard', 820, { face:-1, weapon:'sopa' }]],
    platforms:[{ x1:1250, x2:1750, y:320 }], stairs:[[1978, 320, 6, -1]], objects:[['dolap', 560], ['koli', 980], ['kutu', 1150], ['varil', 1500, 320], ['dolap', 2050], ['kutu', 2400], ['sise', 2460]],
    waves:[ { at:950, list:[['shield', 1], ['guard', -1], ['guard', 1, { y:320 }]] },
            { at:1650, list:[['brute', 1], ['kicker', -1], ['guard', 1]] }, { at:2300, list:[['shield', 1], ['brute', -1], ['kicker', 1], ['guard', 1]] } ] },
  /* --- Bölüm 4 --- */
  gecmis: { bg:'dojo', sepia:true, chars:['ufisGenc'], width:W, start:480, survive:28, pool:['masked', 'thug', 'masked'], obj:'Geçmiş: Okulu koru!', hint:'Yıllar önce… Genç Ufis, okulunu savunuyor.', doneMsg:'Ama çok kalabalıklar…',
    preset:[['masked', 250, { face:1 }], ['thug', 760, { face:-1, weapon:'sopa' }]], objects:[['kutu', 880], ['koli', 60]] },
  bossYardimci: { bg:'eskiOkul', chars:['ufis'], width:W, start:330, startFace:-1, obj:'Yardımcıyı yen!', noHeal:true,
    preset:[['yardimci', 150, { face:1 }]], objects:[['kutu', 820], ['koli', 870], ['dolap', 600]], weapons:[['sopa', 700]],
    barks:[ { at:3, who:'Issem', t:'Dikkat et Ufis, çok hızlı!' }, { at:22, who:'Yardımcı', t:'Ustan seni böyle mi eğitti?', e:'smirk' } ] },
  /* --- Bölüm 6 --- */
  karargahGiris: { bg:'karargah', chars:['issem', 'ufis'], width:2600, start:200, exit:true, gate:{ kind:'window', room:'karargahOfis' }, obj:'Karargâha sız!',
    preset:[['guard', 640, { face:-1 }], ['shield', 760, { face:-1 }]],
    platforms:[{ x1:1100, x2:1600, y:320 }], objects:[['dolap', 420], ['kutu', 980], ['koli', 1030], ['dolap', 1850], ['varil', 2200]],
    waves:[ { at:1000, list:[['kicker', 1], ['kicker', -1], ['guard', 1, { y:320 }]] }, { at:1700, list:[['brute', 1], ['shield', -1], ['guard', 1]] } ] },
  karargahKacis: { bg:'karargah', chars:['issem', 'ufis'], width:3000, start:300, exit:true, gate:{ kind:'window' }, alarm:true, limit:95, loseMsg:'Yakalandınız!', obj:'Alarm! Binadan kaç!',
    hint:'Süre bitmeden çıkışa ulaşın! Hızlı ve kombolu dövüşün.', preset:[['guard', 780, { face:-1 }]],
    platforms:[{ x1:1400, x2:1900, y:320 }], stairs:[[1172, 320, 6, 1]], objects:[['koli', 520], ['dolap', 1050], ['kutu', 1700, 320], ['varil', 2300], ['koli', 2600]],
    waves:[ { at:900, list:[['kicker', 1], ['shield', -1]] }, { at:1500, list:[['guard', 1], ['guard', -1, { y:320 }], ['kicker', 1]] },
            { at:2100, list:[['brute', 1], ['guard', -1]] }, { at:2550, list:[['shield', 1], ['kicker', 1], ['kicker', -1]] } ] },
  karargahOfis: { bg:'guvenlik', chars:['issem', 'ufis'], width:W, start:170, obj:'Güvenlik odası: korumaları sustur!', screen:'masked',
    preset:[['guard', 560, { face:-1 }], ['shield', 690, { face:-1 }], ['guard', 800, { face:-1, weapon:'sopa' }]], objects:[['dolap', 380], ['koli', 450]],
    waves:[ { at:0, list:[['kicker', 1], ['guard', -1]] } ], gate:{ kind:'door', x:850 } },
  /* --- Bölüm 7 --- */
  bossNarak: { bg:'salon', chars:['ufis'], width:W, start:340, obj:'Narak ile hesaplaş!', noHeal:true,
    preset:[['narak', 640, { face:-1 }]], platforms:[{ x1:40, x2:260, y:330, ladder:false }, { x1:720, x2:930, y:330, ladder:false }], objects:[['koli', 480]],
    barks:[ { at:3, who:'Issem', t:'Ufis, dikkat et!' }, { at:16, who:'Narak', t:'Yıllar seni yavaşlatmış, ihtiyar!', e:'smirk' }, { at:32, who:'Leo', t:'Hareketlerini izle, açık veriyor!' } ] },
  /* --- Bölüm 8 --- */
  stadArka: { bg:'stadArka', chars:['ufis'], width:2700, start:380, exit:true, gate:{ kind:'hatch' }, platforms:[{ x1:1350, x2:1700, y:320, style:'scaffold' }], obj:'Stadyumun altına in!',
    preset:[['guard', 700, { face:-1 }]], objects:[['dolap', 560], ['koli', 1150], ['kutu', 1200], ['varil', 1900], ['dolap', 2350]],
    waves:[ { at:900, list:[['shield', 1], ['kicker', -1]] }, { at:1600, list:[['guard', 1], ['guard', -1, { y:320 }], ['shield', 1]] },
            { at:2200, list:[['brute', 1], ['kicker', 1], ['guard', -1]] } ] },
  gizliOda: { bg:'gizli', chars:['ufis'], width:W, start:560, survive:30, alarm:true, pool:['guard', 'masked', 'kicker', 'shield'], obj:'Ustanın kapısını koru!', hint:'Alarm çaldı! Kapı açılana kadar dayan.', doneMsg:'Kilit çözülüyor…',
    preset:[['guard', 200, { face:1 }]], objects:[['kutu', 420], ['koli', 470]] },
  /* --- Bölüm 9 --- */
  bossDovuscu: { bg:'stad', chars:['ufis'], width:W, start:330, obj:'Yeni dövüşçüyü yen!', noHeal:true,
    preset:[['dovuscu', 640, { face:-1 }]], hint:'Yere vurduğunda şok dalgası gelir: ⬆ ZIPLA!',
    barks:[ { at:4, who:'Usta', t:'Sabırlı ol Ufis. Güç her şey değildir.', e:'neutral' }, { at:24, who:'Dövüşçü', t:'Ezeceğim seni!', e:'angry' } ] },
  bossLider: { bg:'stad', chars:['issem', 'ufis'], width:W, start:360, obj:'Lideri durdur!', noHeal:true,
    preset:[['lider', 620, { face:-1 }]], hint:'⇄ ile ikisini de kullanın! Süper bar dolunca ⭐!',
    barks:[ { at:5, who:'Lider', t:'İkiniz de benim oyunumdaki piyonlarsınız!', e:'smirk' }, { at:22, who:'Issem', t:'Arkadaşlarım için, Ufis!' }, { at:40, who:'Ufis', t:'Ustam için!' } ] },
};
/* merdiven basamakları: stairs:[[x, üstY, basamak, yön]] → basamak platformlarına dönüşür (yürüyerek çıkılır) */
for (const k in LEVELS){ const L = LEVELS[k]; for (const st of L.stairs || []){ const [x, top, n, dir] = st, h = (GROUND - top) / n, w = 38;
  L.platforms = L.platforms || []; for (let i = 0; i < n; i++){ const x1 = dir > 0 ? x + i * w : x - (i + 1) * w; L.platforms.push({ x1, x2:x1 + w + (i === n - 1 ? 0 : 0), y:Math.round(GROUND - (i + 1) * h), ladder:false, step:true }); } } }
/* boss ve ön yerleşimli düşmanlar baştan "aktif dalga" sayılır; at:-1 dalgası da hemen gelir */
for (const k in LEVELS){ const L = LEVELS[k]; if (L.waves && L.waves[0] && L.waves[0].at < 0){ L.waves[0].at = 0; } }

/* ---------------- yardımcı sahne parçaları ---------------- */
const MATES = (n = 6) => [A('m1', 'mate', 130, 1), A('m2', 'mate2', 250, 1), A('m3', 'mate', 370, 1), A('m4', 'mate2', 600, -1), A('m5', 'mate', 720, -1), A('m6', 'mate2', 840, -1)].slice(0, n);
const STAD_INTRO = (title, sub) => [
  { cut:{ bg:'stadDis', zoom:1, music:'football', lines:[ CARD(title, sub), N('Uon Pmac Stadı ışıl ışıl. Binlerce taraftar kapılarda, tezahüratlar şehrin her yerinden duyuluyor.', { zoom:1.3, sfx:'roar' }) ] } },
  { cut:{ bg:'tunelCikis', zoom:1, music:'football', actors:[ A('issem', 'issem', 420, 1, { s:1.15, y:520 }), A('t1', 'mate', 300, 1, { s:1.15, y:520 }), A('t2', 'mate2', 560, 1, { s:1.15, y:520 }) ],
    lines:[ N('Oyuncular tünelden sahaya çıkıyor…', { zoom:1.35, fx:'cheer', set:{ issem:{ tx:700, speed:120 }, t1:{ tx:580, speed:120 }, t2:{ tx:840, speed:120 } } }) ] } } ];

/* ---------------- BÖLÜMLER ---------------- */
const CHAPTERS = [
/* ================= BÖLÜM 1 ================= */
{ title:'Şampiyonun Hayatı', teaser:['2. Bölüm – Gizemli Saldırı', 'Issem, kaybolan takım arkadaşlarının izini sürmeye başlıyor.'], flow:[
  { cut:{ bg:'tesisDis', zoom:1, music:'football', lines:[ CARD('Bölüm 1', 'Şampiyonun Hayatı'), CARD('Sahne 1', 'Büyük Yıldız'), N('Yıl 2014. Anolecrab Antrenman Tesisi.', { zoom:1.35 }) ] } },
  { cut:{ bg:'saha', actors:[ A('coach', 'coach', 300, 1, { pose:'arms' }), A('issem', 'issem', 560, -1) ], lines:[
    N('Anolecrab, sezonun en önemli maçlarından birine hazırlanmaktadır. Takımın yıldızı Issem, antrenman sahasında çalışmalarını sürdürür.'),
    S('Teknik Direktör', 'Önce şut, sonra frikik. Göster bakalım!', { e:'happy' }) ] } },
  { set:{ mode:'shot', shots:5, need:3, bg:'saha', title:'Şut antrenmanı', hint:'⬆⬇ ile yönü ayarla, ⚽ basılı tutup gücü doldur, bırak!' } },
  { set:{ mode:'freekick', shots:4, need:2, bg:'saha', title:'Frikik antrenmanı', hint:'Topu barajın ÜSTÜNDEN aşır ama üst direğin altından!' } },
  { cut:{ bg:'saha', actors:[ A('coach', 'coach', 360, 1, { pose:'arms' }), A('issem', 'issem', 560, -1) ], lines:[
    S('Teknik Direktör', 'Issem, yarınki maç bizim için çok önemli. Hazır mısın?'), S('Issem', 'Her zamankinden daha hazırım!', { e:'happy' }),
    N('Antrenman sona erer. Futbolcular soyunma odasına giderken Issem, telefonuna gelen gizemli bir mesajı fark eder.', { sfx:'msg', set:{ issem:{ takeout:'phone' }, coach:{ tx:-80 } } }),
    { msg:'Yarınki maçta her şey değişecek. Takım arkadaşlarını koruyabilecek misin?' }, N('Issem şaşırır.', { set:{ issem:{ pose:'shock', e:'shock', hold:null } } }) ] } },
  { cut:{ bg:'dojo', actors:[ A('ufis', 'ufis', 520, 1, { pose:'guard' }) ], lines:[ CARD('Sahne 2', 'Gizemli Adam'), N('Şehrin başka bir yerinde, dövüş ustası Ufis bir dövüş salonunda antrenman yapmaktadır.') ] } },
  { lvl:'dojo' },
  { cut:{ bg:'dojo', actors:[ A('ufis', 'ufis', 620, -1), A('lider', 'lider', 140, 1, { pose:'stand', hidden:true }) ], lines:[
    N('Bir anda kapı açılır. İçeri siyah giyimli bir adam girer.', { seq:[ [0, 'st', { door:true }], [.6, 'lider', { hidden:false, tx:340, speed:110 }] ] }),
    S('Gizemli Adam', 'Seni bulmam biraz zaman aldı.', { e:'smirk' }), S('Ufis', 'Ne istiyorsun?', { e:'angry', set:{ ufis:{ pose:'guard' } } }), S('Gizemli Adam', 'Yakında öğreneceksin.', { e:'smirk' }),
    N('Adam salondan ayrılır. Ufis, bu olayın sıradan olmadığını anlar.', { set:{ lider:{ tx:140, speed:110, hideAt:true, closeDoor:true }, ufis:{ pose:null } } }) ] } },
  { cut:{ bg:'stad', minute:"0'", actors:[ ...MATES(), A('issem', 'issem', 480, 1) ], ball:[520, 478], lines:[
    CARD('Sahne 3', 'Maç Günü'), N('Ertesi gün Uon Pmac Stadı tamamen dolmuştur.', { sfx:'roar' }),
    N('Issem ve takım arkadaşları sahaya çıkar. Taraftarlar tezahürat yapmaktadır.', { fx:'cheer' }), N('Maç başlar.', { sfx:'whistle', min:"1'" }),
    N('20. dakika…', { min:"20'" }), N('Stadın ışıkları aniden söner!', { fx:'dark' }),
    N('Birkaç saniye sonra ışıklar yeniden yanar…', { fx:'light', hide:['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] }),
    N('Fakat sahada büyük bir karmaşa vardır.', { set:{ issem:{ pose:'shock', e:'shock' } } }), S('Issem', 'Arkadaşlarım nerede?!', { e:'shock' }),
    { msg:'Onları istiyorsan bizi bul. Bu daha başlangıç.' }, N('Issem soyunma odası tüneline koşar… ama çetenin adamları yolunu keser!') ] } },
  { lvl:'tunel' },
  { cut:{ bg:'sehir', actors:[ A('issem', 'issem', -40, 1, { tx:230 }), A('ufis', 'ufis', 1000, -1, { tx:730 }) ], lines:[
    CARD('Bölüm Sonu'), N('Issem telefonunu cebine koyar ve stadın çıkışına doğru yürür.'), N('Aynı sırada Ufis de gizemli adamın bıraktığı bir adrese ulaşır.'),
    N('İki farklı insan, aynı düşmanın peşine düşmüştür.') ] } },
] },
/* ================= BÖLÜM 2 ================= */
{ title:'Gizemli Saldırı', teaser:['3. Bölüm – Kaçırılan Futbolcular', 'Issem ve Ufis, futbolcuların tutulduğu gizli tesisi bulmaya çalışacak.'], flow:[
  { cut:{ bg:'guvenlik', actors:[ A('issem', 'issem', 420, 1), A('guard', 'guard', -60, 1, { hidden:true }) ], lines:[
    CARD('Bölüm 2', 'Gizemli Saldırı'), CARD('Sahne 1', 'Kaybolan Futbolcular'),
    N("Issem, Uon Pmac'tan ayrıldıktan sonra takım arkadaşlarının kaybolduğu yeri araştırmaya başlar."),
    N('Stadın güvenlik odasına gider. Güvenlik kameralarını açar.', { screen:'masked', set:{ issem:{ tx:470 } } }),
    N('Görüntülerde siyah kıyafetli, yüzleri maskeli birkaç kişi görünmektedir. Bu kişiler maç başlamadan önce stada girmiştir.'),
    N('Issem görüntüyü durdurur.', { set:{ issem:{ act:{ pose:'point', dur:.6 } } } }), S('Issem', 'Bunlar kim? Takım arkadaşlarımı nereye götürdüler?', { e:'angry' }),
    N('Tam o sırada arkasından bir ses gelir.', { show:['guard'], set:{ guard:{ tx:250 } } }),
    S('Güvenlik Görevlisi', 'Burada ne arıyorsun?'), S('Issem', 'Takım arkadaşlarımı bulmaya çalışıyorum.', { set:{ issem:{ face:-1 } } }),
    S('Güvenlik Görevlisi', 'O zaman dikkatli ol. Bu kişiler oldukça tehlikeli.', { e:'sad' }) ] } },
  { cut:{ bg:'depo', actors:[ A('issem', 'issem', 300, 1), A('k1', 'masked', -80, 1, { hidden:true }), A('k2', 'masked', -170, 1, { hidden:true }), A('k3', 'masked', -260, 1, { hidden:true }) ], lines:[
    CARD('Sahne 2', 'İlk Karşılaşma'), N('Issem, kameralarda gördüğü aracın plakasını takip ederek eski bir depoya ulaşır.'),
    N('İçeriden konuşma sesleri gelmektedir. Issem kapının aralığından içeri bakar.', { set:{ issem:{ pose:'peek' } } }),
    N('Takım arkadaşlarının fotoğraflarının bulunduğu bir masa görür.', { set:{ issem:{ pose:null, tx:440, e:'shock' } } }),
    N('Bir anda arkasından üç maskeli adam çıkar!', { seq:[ [0, 'k1', { hidden:false, tx:200, speed:260 }], [.15, 'k2', { hidden:false, tx:290, speed:260 }], [.3, 'k3', { hidden:false, tx:120, speed:260 }], [.9, 'fx', 'shake'] ] }),
    S('Maskeli Adam', 'Yanlış yere geldin, futbolcu!', { set:{ issem:{ face:-1, e:'shock' } } }),
    N('Issem kaçmaya çalışır ancak adamlardan biri önünü keser…', { seq:[ [0, 'issem', { face:1, tx:520, speed:300 }], [.1, 'k3', { tx:640, speed:520 }], [.8, 'k3', { face:-1 }], [.8, 'issem', { pose:'guard', e:'angry' }] ] }) ] } },
  { lvl:'depoHayatta' },
  { cut:{ bg:'depo', actors:[ A('issem', 'issem', 520, -1, { pose:'grabbed', e:'pain' }), A('k1', 'masked', 450, 1, { pose:'grab' }), A('k3', 'masked', 380, 1, { pose:'arms' }), A('k2', 'masked', 600, -1, { pose:'grab' }), A('ufis', 'ufis', 1020, -1, { hidden:true }), A('n1', 'masked', -80, 1, { hidden:true }), A('n2', 'masked', 1040, -1, { hidden:true }), A('n3', 'kicker', 1120, -1, { hidden:true }) ], lines:[
    N('Issem yorulur. Maskeli adamlar onu iki yandan yakalar!', { fx:'shake' }),
    N('Tam yakalanacağı sırada bir adam ortaya çıkar ve saldırganları etkisiz hâle getirir!', { seq:[
      [0, 'ufis', { hidden:false, tx:690, speed:560 }], [.75, 'ufis', { act:{ pose:'kickA', dur:.35 } }], [.85, 'k2', { fall:.05, stars:true }],
      [1.3, 'ufis', { tx:300, speed:700 }], [2.0, 'ufis', { face:1, act:{ pose:'punchA', dur:.3 } }], [2.1, 'k3', { fall:.05, stars:true }],
      [2.5, 'ufis', { tx:370, speed:400 }], [2.75, 'ufis', { act:{ pose:'kickA', dur:.35 } }], [2.85, 'k1', { fall:.05, stars:true }],
      [3.3, 'issem', { pose:null, e:'shock' }] ] }),
    N("Bu kişi dövüş ustası Ufis'tir.", { set:{ ufis:{ face:1, pose:'guard' }, issem:{ face:-1 } } }),
    S('Issem', 'Sen de kimsin?', { e:'shock' }), S('Ufis', 'Ben de bu adamların peşindeyim.'),
    N('Ama dışarıdan yeni adamlar gelmektedir!', { seq:[ [0, 'fx', 'shake'], [0, 'n1', { hidden:false, tx:200, speed:420 }], [.2, 'n2', { hidden:false, tx:760, speed:420 }], [.35, 'n3', { hidden:false, tx:850, speed:420 }],
      [.4, 'ufis', { tx:470, face:1, pose:'guard' }], [.4, 'issem', { pose:'guard', e:'angry', tx:470 }] ] }) ],
    } },
  { lvl:'depoKacis' },
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 580, -1) ], lines:[
    CARD('Sahne 3', 'Ortak Düşman'), N('İkili depodan uzaklaşarak güvenli bir yere gider.'),
    S('Issem', 'Takım arkadaşlarımı kaçırdılar. Onları bulmam gerekiyor.', { e:'sad' }),
    S('Ufis', 'Benim de peşinde olduğum bir örgüt var. Sanırım aynı kişilerden bahsediyoruz.'),
    S('Issem', 'Peki onları nerede bulabiliriz?'), S('Ufis', 'Henüz bilmiyorum. Ama bir iz buldum.'),
    N('Ufis cebinden üzerinde bir sembol bulunan küçük bir kâğıt çıkarır.', { set:{ ufis:{ takeout:'paper' } } }),
    N('Kâğıtta bir adres yazmaktadır.', { item:'paper' }) ] } },
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 580, -1, { hold:'paper', pose:'show' }) ], lines:[
    CARD('Sahne 4', 'Beklenmedik Mesaj'), N("İkili adresi araştırmaya karar verir. Ancak Issem'in telefonu çalar.", { sfx:'ring', set:{ issem:{ takeout:'phone' }, ufis:{ hold:null, pose:null } } }),
    N('Bilinmeyen bir numaradan görüntülü arama gelmektedir. Issem telefonu açar.'),
    { call:'mate', who:'Futbolcu', t:'Issem! Bizi bulmalısın! Burada yalnız değiliz!' },
    { callCut:true, n:'Görüntü aniden kesilir.' }, { msg:'Bir sonraki hamlenizi biliyoruz.', red:true },
    N('Issem ve Ufis birbirlerine bakar.', { set:{ issem:{ pose:null, hold:null, e:'shock' } } }), S('Ufis', 'Bizi izliyorlar.', { e:'angry' }),
    S('Issem', 'O zaman onları bulmadan durmayacağız.', { e:'angry' }) ] } },
  { cut:{ bg:'liderOda', screen:'watch', actors:[ A('lider', 'lider', 300, 1, { pose:'stand' }) ], lines:[
    CARD('Bölüm Sonu'), N("Karanlık bir odada gizemli bir adam bilgisayar ekranından Issem ve Ufis'i izlemektedir."),
    S('Gizemli Adam', 'İkisi de bir araya geldi. Planı değiştirme zamanı.', { e:'smirk' }),
    N('Adam telefonunu eline alır.', { set:{ lider:{ takeout:'phone' } } }), S('Gizemli Adam', 'Üçüncü aşamayı başlatın.', { e:'angry' }) ] } },
] },
/* ================= BÖLÜM 3 ================= */
{ title:'Kaçırılan Futbolcular', teaser:['4. Bölüm – Dövüş Ustasının Dönüşü', "Ufis'in geçmişindeki sırlar ortaya çıkacak!"], flow:[
  { cut:{ bg:'fabrikaDis', actors:[ A('issem', 'issem', -80, 1, { tx:150, crouch:true }), A('ufis', 'ufis', -180, 1, { tx:60, crouch:true }), A('g1', 'guard', 520, -1, { patrol:[480, 640] }), A('g2', 'guard', 760, 1, { patrol:[700, 880] }) ], lines:[
    CARD('Bölüm 3', 'Kaçırılan Futbolcular'), CARD('Sahne 1', 'Gizli Tesis'),
    N('Issem ve Ufis, kâğıtta yazan adresi takip ederek şehrin dışındaki terk edilmiş bir fabrikaya ulaşır.'),
    N('Fabrikanın etrafında güvenlik kameraları ve nöbetçiler vardır.'),
    S('Issem', 'Takım arkadaşlarımın burada olduğuna emin misin?', { set:{ issem:{ pose:'peek' } } }),
    S('Ufis', 'Tam emin değilim ama başka ipucumuz yok.', { set:{ ufis:{ pose:'peek' } } }),
    N('İkili içeri girmek için uygun bir yol aramaya başlar. Çitteki açıklığa doğru eğilerek ilerlerler.', { seq:[ [0, 'issem', { pose:null, crouch:true, tx:330, speed:90 }], [.3, 'ufis', { pose:null, crouch:true, tx:260, speed:90 }] ] }),
    N('Ama bir nöbetçi onları fark eder!', { seq:[ [0, 'g1', { patrol:null, tx:null, face:-1, e:'shock' }], [0, 'sfx', 'whistle'], [.3, 'issem', { crouch:false, pose:'guard', e:'angry', face:1 }], [.3, 'ufis', { crouch:false, pose:'guard', face:1 }] ] }) ] } },
  { lvl:'fabrikaGiris' },
  { cut:{ bg:'fabrikaDis', actors:[ A('issem', 'issem', 330, 1), A('ufis', 'ufis', 250, 1), A('d1', 'guard', 640, -1, { pose:'lie', stars:true }), A('d2', 'guard', 760, -1, { pose:'lie', stars:true }) ], lines:[
    N('Nöbetçiler susturulur. İkili, fabrikanın yan kapısına koşar.', { seq:[ [0, 'issem', { tx:555, speed:240 }], [.2, 'ufis', { tx:525, speed:240 }], [1.2, 'st', { door:true }] ] }),
    N('Kapıyı açıp içeri süzülürler.', { seq:[ [0, 'st', { door:true }], [.4, 'issem', { tx:560, hideAt:true }], [.6, 'ufis', { tx:560, hideAt:true }], [1.4, 'st', { door:false }] ] }) ] } },
  { cut:{ bg:'fabrika', actors:[ A('issem', 'issem', 260, 1), A('ufis', 'ufis', 140, 1), A('guard', 'guard', 1020, -1, { hidden:true }) ], lines:[
    CARD('Sahne 2', 'Fabrikaya Giriş'), N('İçeride çok sayıda bilgisayar ve güvenlik ekranı bulunmaktadır.'),
    N('Issem ekranlardan birine yaklaşır. Bir anda tanıdık yüzler görür.', { screen:'players', set:{ issem:{ tx:420 } } }),
    S('Issem', 'İşte onlar! Takım arkadaşlarım!', { e:'shock', set:{ issem:{ act:{ pose:'point', dur:.8 } } } }), N('Ekranda Anolecrab futbolcuları bir odada tutulmaktadır. Bir ekranda hepsi bir arada görünüyor.'),
    S('Ufis', 'Onları bulduk. Şimdi buradan çıkarmamız gerekiyor.'),
    N('Tam o sırada alarm çalmaya başlar!', { fx:'alarm' }),
    S('Güvenlik Görevlisi', 'Yabancılar var! Herkesi durdurun!', { e:'angry', show:['guard'], set:{ guard:{ tx:780 }, issem:{ face:1, pose:'guard' }, ufis:{ pose:'guard' } } }) ] } },
  { lvl:'fabrikaIc' },
  { cut:{ bg:'fabrika', alarm:true, actors:[ A('ufis', 'ufis', 300, 1, { pose:'guard' }), A('a1', 'guard', 400, -1), A('a2', 'guard', 200, 1), A('issem', 'issem', 520, 1) ], lines:[
    CARD('Sahne 3', 'Büyük Mücadele'),
    N('Ufis, karşılarına çıkan saldırganlarla dövüşmeye başlar.', { seq:[ [.3, 'ufis', { act:{ pose:'punchA', dur:.3 } }], [.4, 'a1', { act:{ pose:'shock', dur:.3 } }], [.9, 'ufis', { act:{ pose:'kickA', dur:.35 } }], [1.0, 'a1', { fall:.3, stars:true }],
      [1.4, 'ufis', { face:-1 }], [1.6, 'ufis', { act:{ pose:'kickA', dur:.35 } }], [1.7, 'a2', { fall:-.3, stars:true }] ] }),
    N('Issem ise takım arkadaşlarının bulunduğu odaya ulaşmaya çalışır.', { set:{ issem:{ tx:1100, speed:330 } } }) ] } },
  { cut:{ bg:'kapi', alarm:true, zoom:1, actors:[ A('issem', 'issem', -60, 1) ], lines:[
    N('Koridorun sonunda büyük bir kapı görür.', { seq:[ [0, 'issem', { tx:480, speed:320 }], [1.2, 'zoom', 1.12] ] }),
    N('Kapının üzerinde elektronik bir kilit vardır.', { zoom:1 }),
    N('Issem kapının yanındaki duvarda asılı şifre makinesine yaklaşır. Şifreyi bilmemektedir ama yine de tuşlara basar…', { seq:[ [0, 'issem', { tx:548, speed:150 }],
      [.7, 'issem', { pose:'type' }], [.8, 'st', { keypad:'type' }], [1.1, 'sfx', 'keypad'], [1.35, 'sfx', 'keypad'], [1.6, 'sfx', 'keypad'], [1.85, 'sfx', 'keypad'], [2.2, 'st', { keypad:'err' }], [2.3, 'issem', { pose:null, e:'angry' }] ] }),
    N('Tam o sırada hoparlörden bir ses duyulur.', { fx:'speaker', set:{ issem:{ face:-1, e:'shock' } } }),
    S('Gizemli Adam', 'Issem! Seni burada görmek güzel.', { e:'smirk', fx:'speaker' }), S('Issem', 'Sen kimsin? Arkadaşlarımı neden kaçırdın?', { e:'angry' }),
    S('Gizemli Adam', 'Çünkü seninle özel olarak ilgileniyoruz.', { e:'smirk', fx:'speaker' }) ] } },
  { cut:{ bg:'fabrika', actors:[ A('issem', 'issem', 640, -1, { pose:'wait' }), A('ufis', 'ufis', -60, 1) ], lines:[
    CARD('Sahne 4', 'Liderin Mesajı'), N('Issem kapının açılmasını beklerken Ufis yanına gelir.', { set:{ ufis:{ tx:540, speed:380, faceTo:1 } } }),
    S('Ufis', 'Burada fazla kalamayız. Daha büyük bir sorun var.', { set:{ issem:{ pose:null } } }), S('Issem', 'Ne oldu?'),
    S('Ufis', 'Bu fabrika sadece bir merkez. Örgütün asıl karargâhı başka bir yerde.'),
    N('Bir anda fabrikanın bütün ekranları açılır. Gizemli adam yeniden görünür.', { fx:'flash', screen:'lider', set:{ issem:{ face:-1, e:'shock' }, ufis:{ face:-1, e:'shock' } } }),
    S('Gizemli Adam', 'Futbolcularınızı istiyorsanız benimle anlaşma yapacaksınız.', { e:'smirk' }), S('Issem', 'Ne istiyorsun?', { e:'angry' }),
    S('Gizemli Adam', 'Yakında öğreneceksin.', { e:'smirk' }), N('Ekranlar kapanır.', { screen:'off' }) ] } },
  { cut:{ bg:'fabrika', screen:'off', actors:[ A('issem', 'issem', 460, 1), A('ufis', 'ufis', 580, -1) ], lines:[
    CARD('Sahne 5', 'Beklenmedik Keşif'), N("Ufis, fabrikada bulduğu bir dosyayı Issem'e gösterir.", { seq:[ [0, 'ufis', { takeout:'file' }], [1.0, 'ufis', { pose:'give' }] ] }),
    N('Dosyada kaçırılan futbolcuların isimleri ve başka futbol takımlarına ait bilgiler bulunmaktadır.', { item:'file' }),
    S('Issem', "Demek ki sadece Anolecrab'ın peşinde değiller.", { e:'shock' }), S('Ufis', 'Evet. Bütün futbol dünyasını kontrol etmek istiyorlar.', { e:'angry', set:{ ufis:{ pose:null, hold:null } } }),
    N('İkili artık karşılarındaki düşmanın düşündüklerinden çok daha büyük olduğunu anlamıştır.') ] } },
  { cut:{ bg:'liderOda', screen:'off', actors:[ A('lider', 'lider', 300, 1, { pose:'sit' }), A('yard', 'yardimci', 160, 1, { pose:'stand' }) ], lines:[
    CARD('Bölüm Sonu'), N('Gizemli adam, karargâhındaki koltuğuna oturur. Yanındaki yardımcısına döner.', { set:{ lider:{ face:-1 } } }),
    S('Gizemli Adam', 'Issem ve Ufis beklediğimden daha hızlı ilerliyor.', { e:'angry' }), S('Yardımcı', 'Ne yapacağız?'),
    S('Gizemli Adam', 'Onları birbirinden ayıracağız.', { e:'smirk' }),
    N("Kamera yavaşça arkadaki büyük ekrana yaklaşır. Ekranda Ufis'in eski bir fotoğrafı görünmektedir.", { screen:'ufisPhoto', zoom:1.25, set:{ lider:{ face:1 } } }) ] } },
] },
/* ================= BÖLÜM 4 ================= */
{ title:'Dövüş Ustasının Dönüşü', teaser:['5. Bölüm – Beklenmedik Ortaklık', 'Issem ve Ufis, örgüte karşı mücadele etmek için yeni müttefiklerle tanışacak!'], flow:[
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 600, 1, { e:'sad', pose:'sad' }) ], lines:[
    CARD('Bölüm 4', 'Dövüş Ustasının Dönüşü'), CARD('Sahne 1', 'Eski Defterler'),
    N('Issem ve Ufis, fabrikadan ayrıldıktan sonra güvenli bir yere gider. Ufis oldukça sessizdir.'), N('Issem onun bir şey düşündüğünü fark eder.'),
    S('Issem', 'Bir sorun mu var?'), S('Ufis', 'Evet. Az önce gördüğümüz fotoğraf benim geçmişimle ilgili.', { e:'sad', set:{ ufis:{ face:-1, pose:null } } }),
    S('Issem', 'Ne demek istiyorsun?'), S('Ufis', 'Bu örgütün liderini yıllardır tanıyorum. Geçmişimde onunla yarım kalan bir hesabım var.', { e:'angry' }),
    N('Issem şaşırır.', { set:{ issem:{ e:'shock', pose:'shock' } } }), S('Issem', 'Peki neden daha önce söylemedin?', { e:'shock', set:{ issem:{ pose:null } } }),
    S('Ufis', 'Çünkü bu hikâyenin nasıl biteceğini bilmiyorum.', { e:'sad' }) ] } },
  { cut:{ bg:'dojo', sepia:true, actors:[ A('genc', 'ufisGenc', 430, 1, { pose:'guard' }), A('usta', 'usta', 620, -1, { pose:'arms' }) ], lines:[
    CARD('Sahne 2', 'Geçmişin Sırrı'), N('Ufis, yıllar önce yaşananları anlatmaya başlar…'),
    N('Gençlik döneminde dövüş sanatları eğitimi almıştır. Ustasıyla birlikte büyük bir dövüş okulunda yaşamaktadır.', { seq:[ [.3, 'genc', { act:{ pose:'punchA', dur:.3 } }], [.9, 'genc', { act:{ pose:'kickA', dur:.35 } }] ] }),
    N('Ancak bir gün okul, gizemli bir grup tarafından basılır!', { fx:'shake', seq:[ [0, 'st', { door:true }], [.2, 'genc', { face:-1 }] ] }) ] } },
  { lvl:'gecmis' },
  { cut:{ bg:'dojo', sepia:true, door:true, actors:[ A('genc', 'ufisGenc', 480, -1, { pose:'kneel', e:'pain' }), A('usta', 'usta', 640, -1, { pose:'guard' }), A('lider', 'lider', 150, 1, { pose:'stand' }), A('k1', 'masked', 260, 1), A('k2', 'masked', 760, -1) ], lines:[
    N("Grubun başında bugün Issem ve Ufis'in peşinde olduğu adam vardır."),
    N("Ufis'in ustası, okulu korumaya çalışırken örgüt tarafından kaçırılır.", { seq:[ [0, 'k2', { tx:680, act:{ pose:'grab', dur:2 } }], [.6, 'usta', { tx:140, speed:120 }], [.6, 'k2', { tx:200, speed:120 }], [1.0, 'lider', { tx:120, speed:120 }] ] }),
    N('O günden sonra Ufis, ustasını bulmak için yıllarca araştırma yapmıştır.', { hide:['usta', 'lider', 'k1', 'k2'], fx:'doorClose', set:{ genc:{ e:'sad' } } }) ] } },
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 580, -1) ], lines:[
    S('Issem', 'Yani bu örgütün peşinde olmanın sebebi ustanı bulmak mı?'), S('Ufis', 'Evet. Onu bulmadan bu iş bitmeyecek.', { e:'angry' }),
    CARD('Sahne 3', 'Yeni Bir İz'), N("Ufis'in telefonuna bilinmeyen bir numaradan mesaj gelir. Mesajda bir fotoğraf ve adres bulunmaktadır.", { sfx:'msg', set:{ ufis:{ takeout:'phone' } } }),
    { msg:'Onu görmek istiyorsan eski dövüş okuluna gel.', photo:'usta' },
    N("Fotoğrafta Ufis'in yıllardır aradığı ustası görünmektedir."), S('Ufis', 'Bu imkânsız...', { e:'shock' }), S('Issem', 'Ne oldu?'),
    S('Ufis', 'Ustam hâlâ hayatta!', { e:'shock', set:{ ufis:{ pose:null, hold:null } } }) ] } },
  { cut:{ bg:'eskiOkul', actors:[ A('issem', 'issem', 520, 1), A('ufis', 'ufis', 400, 1), A('yard', 'yardimci', -60, 1, { hidden:true }) ], lines:[
    CARD('Sahne 4', 'Eski Dövüş Okulu'), N('Issem ve Ufis, eski dövüş okuluna ulaşır. Bina yıllardır kullanılmamaktadır.'),
    N('İçeri girdiklerinde duvarlarda eski fotoğraflar ve dövüş madalyaları görürler.'),
    N('Bir anda arkalarından alkış sesi gelir.', { sfx:'clap', show:['yard'], set:{ yard:{ tx:150 } } }),
    S('Yardımcı', 'Sonunda geldin, Ufis.', { e:'smirk' }),
    N('Ufis arkasını döner. Karşısında örgütün liderinin yardımcısı durmaktadır.', { set:{ ufis:{ face:-1, tx:330 }, issem:{ face:-1 } } }),
    S('Ufis', 'Ustam nerede?', { e:'angry' }), S('Yardımcı', 'Onu bulmak istiyorsan önce beni geçmelisin.', { e:'smirk' }),
    N('Ufis dövüş pozisyonunu alır. Issem ise etrafı kontrol eder.', { set:{ ufis:{ pose:'guard' }, issem:{ tx:700 } } }) ] } },
  { lvl:'bossYardimci' },
  { cut:{ bg:'eskiOkul', actors:[ A('issem', 'issem', 560, -1), A('ufis', 'ufis', 400, -1), A('yard', 'yardimci', 220, 1, { pose:'kneel', e:'pain' }) ], lines:[
    CARD('Sahne 5', 'Büyük Sürpriz'), N('Yaşanan mücadelenin ardından yardımcı kaçar.', { set:{ yard:{ pose:null, tx:-80, speed:340 } } }),
    N('Kaçarken arkasında küçük bir kart bırakır. Issem kartı yerden alır.', { seq:[ [0, 'issem', { tx:300 }], [1.2, 'issem', { act:{ pose:'kneel', dur:.4, then:{ hold:'card', pose:'show' } } }] ] }),
    { item:'card', t:'Büyük turnuvada görüşeceğiz.', n:'Kartta bir konum ve şu cümle yazmaktadır:' },
    S('Issem', 'Sanırım artık onların oyununa katılmamız gerekiyor.'), S('Ufis', 'Evet. Ama bu kez hazırlıklı olacağız.', { e:'angry' }) ] } },
  { cut:{ bg:'liderOda', screen:'off', actors:[ A('lider', 'lider', 300, 1, { pose:'stand' }), A('m1', 'masked', 120, 1), A('m2', 'masked', 820, -1) ], lines:[
    CARD('Bölüm Sonu'), N('Örgütün karargâhında lider, ekibine emir verir.'),
    S('Lider', "Turnuva hazırlıklarını tamamlayın. Issem'i ve Ufis'i orada bekliyorum.", { e:'smirk', set:{ lider:{ act:{ pose:'point', dur:1.2 } } } }),
    N('Kamera, büyük bir futbol stadyumuna doğru yaklaşır. Stadyumun üzerinde dev bir pankart vardır:', { screen:'stadium', zoom:1.2 }),
    { big:'DÜNYA ŞAMPİYONLAR TURNUVASI', size:46 } ] } },
] },
/* ================= BÖLÜM 5 ================= */
{ title:'Beklenmedik Ortaklık', teaser:['6. Bölüm – Çetenin İzinde', 'Issem ve Ufis, örgütün gerçek karargâhını keşfedecek.'], flow:[
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 580, -1) ], lines:[
    CARD('Bölüm 5', 'Beklenmedik Ortaklık'), CARD('Sahne 1', 'Yeni Bir Plan'),
    N('Issem ve Ufis, örgütün düzenleyeceği büyük turnuvayı araştırmaktadır. Issem, turnuvaya katılan takımların listesini inceler.', { set:{ issem:{ takeout:'file' } } }),
    S('Issem', 'Burada dünyanın en iyi takımları var. Anolecrab da listede.'),
    S('Ufis', 'Bu turnuva normal bir futbol organizasyonu değil. Örgüt herkesi tek bir yerde toplamak istiyor.'),
    S('Issem', 'Peki neden?', { set:{ issem:{ hold:null, pose:null } } }), S('Ufis', 'Bunu öğrenmek için turnuvaya katılmalıyız.') ] } },
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 700, -1), A('issem', 'issem', -60, 1, { tx:330 }), A('ufis', 'ufis', -160, 1, { tx:200 }) ], lines:[
    CARD('Sahne 2', 'Eski Dost'), N("Issem ve Ufis, yardım isteyebilecekleri eski bir dostu ziyaret eder. Dostlarının adı Leo'dur."),
    N('Kendisi eski bir futbolcu ve başarılı bir antrenördür.'), S('Leo', 'Sizi burada görmek şaşırtıcı. Ne oldu?', { e:'happy' }),
    N('Issem yaşananları anlatır.'), S('Leo', 'Demek futbolcuları kaçıran örgüt hâlâ faaliyet gösteriyor.', { e:'angry' }),
    S('Ufis', 'Onları durdurmamız gerekiyor.'), S('Leo', 'O zaman ben de sizinle geliyorum.', { e:'happy' }) ] } },
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 640, -1), A('issem', 'issem', 330, 1), A('ufis', 'ufis', 200, 1) ], lines:[
    CARD('Sahne 3', 'Takım Kuruluyor'), N('Üçlü, örgüte karşı mücadele etmek için bir plan hazırlar.', { roster:true }),
    S('Issem', 'Artık tek başımıza değiliz.', { e:'happy' }), S('Ufis', 'Ama dikkatli olmalıyız. Düşmanımız bizi izliyor.'),
    S('Leo', 'Turnuvadan önce seni sahada bir deneyeyim, Issem. Penaltı, sonra çalım parkuru!', { e:'happy' }) ] } },
  { cut:{ bg:'tesisDis', zoom:1, music:'football', lines:[ N("Leo, Issem'i eski kulübünün antrenman tesisine götürür.", { zoom:1.35 }) ] } },
  { set:{ mode:'penalty', shots:5, need:3, bg:'saha', title:'Penaltı serisi', hint:'Köşeleri seç! Çok yüksek güç direğin üstünden gider.' } },
  { match:{ need:2, training:true, defs:[900, 1450, 1950], teams:['ANL', 'LEO'], obj:"Leo'nun parkuru: savunmayı geç, 2 gol at",
    hint:'Kırmızı yanan rakip kayacak: ⬆ zıpla ya da 💨 çalım! Top kaparsa 🦶 ile kayarak al.' } },
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 620, -1), A('issem', 'issem', 330, 1), A('ufis', 'ufis', 200, 1) ], lines:[
    CARD('Sahne 4', 'Turnuva Daveti'), N("Leo'nun bilgisayarına bir e-posta gelir. E-postada turnuvanın resmî davetiyesi bulunmaktadır.", { item:'invite', sfx:'msg' }),
    N('Turnuva üç gün sonra başlayacaktır.', { item:'invite' }), S('Leo', 'İşte fırsatımız!', { e:'happy' }), S('Issem', 'Turnuvaya katılacağız.'),
    S('Ufis', 'Ben de sizinle geleceğim.'), N('Tam o sırada bilgisayar ekranında yeni bir mesaj belirir:'),
    { msg:'Sizi bekliyoruz. Bu turnuvadan kimse eskisi gibi ayrılmayacak.', red:true, from:'💻  Bilinmeyen gönderici' } ] } },
  { cut:{ bg:'sehir', car:300, actors:[ A('yard', 'yardimci', 380, 1, { hidden:true }) ], lines:[
    CARD('Sahne 5', 'Gizli Misafir'), N('Üçlü hazırlıklarını sürdürürken binanın dışında siyah bir araç durur.'),
    N('Araçtan örgütün yardımcısı iner. Telefonunu çıkarır.', { seq:[ [0, 'yard', { hidden:false, tx:470 }], [.9, 'yard', { takeout:'phone' }] ] }),
    S('Yardımcı', 'Efendim, Issem ve Ufis turnuvaya katılmayı kabul etti.'), S('Gizemli Adam', 'Güzel. Tam istediğimiz gibi.', { e:'smirk' }),
    S('Yardımcı', 'Peki ya diğer adam?'), S('Gizemli Adam', 'Onu da hesaba kattık.', { e:'smirk' }) ] } },
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 620, -1), A('issem', 'issem', 330, 1), A('ufis', 'ufis', 200, 1) ], lines:[
    CARD('Bölüm Sonu'), N('Issem, Ufis ve Leo turnuva için hazırlıklara başlar.'),
    N('Ancak henüz bilmedikleri bir şey vardır: Turnuvanın organizatörü, onları bir araya getiren kişidir.') ] } },
] },
/* ================= BÖLÜM 6 ================= */
{ title:'Çetenin İzinde', teaser:['7. Bölüm – Büyük Hesaplaşma', 'Issem ve Ufis, örgütün en güçlü adamıyla karşı karşıya gelecek.'], flow:[
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 620, -1), A('issem', 'issem', 330, 1), A('ufis', 'ufis', 200, 1) ], lines:[
    CARD('Bölüm 6', 'Çetenin İzinde'), CARD('Sahne 1', 'Şüpheli Davet'),
    N('Issem, Ufis ve Leo turnuva hazırlıklarını sürdürmektedir. Leo, organizasyon hakkında araştırma yaparken önemli bir bilgiye ulaşır.'),
    S('Leo', 'Bir dakika! Turnuvanın düzenleyicisi hakkında garip bir şey buldum.', { e:'shock' }), S('Issem', 'Ne buldun?'),
    S('Leo', 'Organizasyonu yapan şirketin gerçek bir adresi yok. Şirketin bütün kayıtları birkaç ay önce oluşturulmuş.'),
    S('Ufis', 'Demek ki bu organizasyon tamamen bir tuzak olabilir.', { e:'angry' }), S('Issem', 'O zaman karargâhlarını bulmalıyız.', { e:'angry' }) ] } },
  { cut:{ bg:'fabrikaDis', actors:[ A('issem', 'issem', 260, 1, { crouch:true }), A('ufis', 'ufis', 150, 1, { crouch:true }), A('leo', 'leo', 370, 1, { crouch:true }), A('g1', 'guard', 640, -1, { patrol:[560, 760] }) ], lines:[
    CARD('Sahne 2', 'Gizli Karargâh'), N('Leo, şirketin kullandığı gizli bir iletişim adresini tespit eder. Adres, şehrin dışında bulunan büyük bir binaya aittir.'),
    N('Üçlü binaya ulaştığında çevrede güvenlik görevlileri olduğunu fark eder.'), S('Issem', 'Burası gerçekten büyük bir yer.'),
    S('Ufis', 'Dikkatli olmalıyız. Burada önemli bilgiler olabilir.') ] } },
  { lvl:'karargahGiris' },
  { cut:{ bg:'karargah', screen:'players', actors:[ A('issem', 'issem', 300, 1), A('ufis', 'ufis', 180, 1), A('leo', 'leo', 680, -1) ], lines:[
    N('İçeri girdiklerinde duvarda dev bir ekran görürler. Ekranda kaçırılan futbolcuların fotoğrafları bulunmaktadır.', { set:{ issem:{ e:'shock' } } }),
    CARD('Sahne 3', 'Şok Edici Gerçek'), N('Leo bilgisayardaki dosyaları inceler. Bir anda önemli bir belge bulur.', { set:{ leo:{ pose:'type' } } }),
    S('Leo', 'Issem! Buraya bak!', { e:'shock', set:{ leo:{ pose:null } } }), S('Issem', 'Ne oldu?'), S('Leo', 'Örgütün amacı sadece futbolcuları kaçırmak değilmiş.'),
    N('Belgelerde, dünya futbolunun en büyük kulüplerini kontrol etmek için hazırlanan bir plan vardır.', { item:'file' }),
    N('Örgüt, futbol kulüplerinin yönetimlerini ele geçirerek bütün futbol organizasyonlarını kontrol etmek istemektedir.'),
    S('Issem', 'Buna izin vermeyeceğiz!', { e:'angry' }) ] } },
  { cut:{ bg:'karargah', screen:'off', actors:[ A('ufis', 'ufis', 480, 1), A('issem', 'issem', -60, 1, { hidden:true }) ], lines:[
    CARD('Sahne 4', "Ufis'in Ustası"), N('Ufis başka bir odada araştırma yaparken eski ustasının fotoğrafını bulur.', { set:{ ufis:{ act:{ pose:'kneel', dur:.5, then:{ hold:'paper', pose:'show' } } } } }),
    N('Fotoğrafın arkasında bir not vardır.', { item:'photoUsta', t:'Ustan hâlâ bizim kontrolümüzde. Turnuvada onu görebilirsin.' }),
    N('Ufis öfkelenir.', { set:{ ufis:{ e:'angry', pose:'guard', hold:null } } }), S('Ufis', 'Yıllardır onu arıyorum. Artık bu iş bitecek!', { e:'angry' }),
    N('Issem yanına gelir.', { show:['issem'], set:{ issem:{ tx:330 } } }), S('Issem', 'Onu birlikte kurtaracağız.') ] } },
  { cut:{ bg:'karargah', actors:[ A('issem', 'issem', 330, 1), A('ufis', 'ufis', 470, -1), A('leo', 'leo', 200, 1), A('guard', 'guard', 1020, -1, { hidden:true }) ], lines:[
    CARD('Sahne 5', 'Yakalanma Tehlikesi'), N('Tam binadan ayrılacakları sırada alarm çalmaya başlar!', { fx:'alarm' }),
    S('Güvenlik Görevlisi', 'Güvenlik ihlali! Binada yabancılar var!', { e:'angry', show:['guard'], set:{ guard:{ tx:780 }, ufis:{ face:1, pose:'guard' }, issem:{ pose:'guard' } } }) ] } },
  { lvl:'karargahKacis' },
  { cut:{ bg:'sehir', actors:[ A('issem', 'issem', 420, 1), A('ufis', 'ufis', 300, 1), A('leo', 'leo', 560, -1) ], lines:[
    N('Ufis, Issem ve Leo binadan çıkmayı başarır.'), N('Ancak ayrılmadan önce Leo önemli bir belgeyi yanında götürür. Belgede turnuvanın gerçek amacını açıklayan bilgiler vardır.', { set:{ leo:{ takeout:'file' } } }),
    N('…', { item:'file', n:'Turnuvanın gerçek amacı bu belgede yazıyor.' }) ] } },
  { cut:{ bg:'liderOda', screen:'watch', actors:[ A('lider', 'lider', 300, 1, { pose:'sit' }), A('yard', 'yardimci', 150, 1) ], lines:[
    CARD('Bölüm Sonu'), N('Örgütün lideri güvenlik kameralarını izlemektedir.'), S('Yardımcı', 'Belgelerden birini almışlar.'),
    S('Lider', 'Sorun değil. Zaten onları turnuvada bekliyoruz.', { e:'smirk' }),
    N("Lider ayağa kalkar ve arkasındaki büyük ekrana bakar. Ekranda Ufis'in ustasının görüntüsü belirir.", { screen:'usta', set:{ lider:{ pose:'stand' } } }),
    S('Lider', 'Artık son hazırlıklara başlayabiliriz.', { e:'smirk' }) ] } },
] },
/* ================= BÖLÜM 7 ================= */
{ title:'Büyük Hesaplaşma', teaser:['8. Bölüm – Turnuvaya Giriş', 'Issem futbol sahasına çıkacak. Ufis ise stadyumun altındaki gizli bölüme ulaşmaya çalışacak.'], flow:[
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 330, 1), A('ufis', 'ufis', 560, -1), A('leo', 'leo', 200, 1, { hold:'file', pose:'show' }) ], lines:[
    CARD('Bölüm 7', 'Büyük Hesaplaşma'), CARD('Sahne 1', 'Tehlikeli Karşılaşma'),
    N('Issem, Ufis ve Leo, örgütün karargâhından aldıkları belgeleri inceler. Belgelerde örgütün en güçlü dövüşçüsünün fotoğrafı vardır.', { item:'narak' }),
    N('Narak, yıllardır örgütün lideri için çalışan ve karşısına çıkan herkesi yenebilen bir dövüş ustasıdır.', { item:'narak' }),
    S('Ufis', 'Bu adamı tanıyorum. Çok tehlikeli biri.', { e:'angry' }), S('Issem', 'Onunla daha önce karşılaştın mı?'),
    S('Ufis', 'Evet. Geçmişimde onunla yarım kalan bir mücadelem var.', { e:'sad' }) ] } },
  { cut:{ bg:'salon', actors:[ A('issem', 'issem', -60, 1, { tx:200 }), A('ufis', 'ufis', -160, 1, { tx:340 }), A('leo', 'leo', -260, 1, { tx:90 }), A('narak', 'narak', 640, -1, { hidden:true, pose:'arms' }) ], lines:[
    CARD('Sahne 2', 'Narak Ortaya Çıkıyor'), N('Gece vakti üçlü, karargâhtan aldıkları yeni bir adresi takip eder. Terk edilmiş bir spor salonuna ulaşırlar.'),
    N('Kapı açılır. İçeride Narak beklemektedir.', { sfx:'door', show:['narak'] }), S('Narak', 'Sonunda geldiniz.', { e:'smirk' }),
    S('Ufis', 'Bu kez kaçmana izin vermeyeceğim.', { e:'angry', set:{ ufis:{ pose:'guard' } } }), S('Narak', 'Önce beni yenmen gerekiyor!', { e:'angry' }),
    N('Narak dövüş pozisyonunu alır.', { set:{ narak:{ pose:'guard' } } }),
    CARD('Sahne 3', 'Büyük Dövüş'), N('Ufis ve Narak arasında zorlu bir mücadele başlar. Narak oldukça hızlıdır.') ] } },
  { lvl:'bossNarak' },
  { cut:{ bg:'salon', actors:[ A('issem', 'issem', 200, 1), A('ufis', 'ufis', 420, 1), A('leo', 'leo', 90, 1), A('narak', 'narak', 640, -1, { pose:'kneel', e:'pain' }) ], lines:[
    N("Ufis bir süre sonra Narak'ın hareketlerini çözmeye başlar. Mücadelenin sonunda Narak yenilir."),
    S('Narak', 'Beni yenmiş olabilirsin ama liderimizi asla durduramazsın!', { e:'pain' }),
    CARD('Sahne 4', 'Büyük Sır'), N("Issem, Narak'ın yanındaki masada bir dosya bulur. Dosyanın üzerinde Ufis'in ustasının adı yazmaktadır.", { hide:['narak'], seq:[ [0, 'issem', { tx:560 }], [1.1, 'issem', { act:{ pose:'kneel', dur:.4, then:{ hold:'file', pose:'show' } } }] ] }),
    N('Ufis dosyayı açar. İçerisinde ustasının tutulduğu yerin bilgileri vardır.', { item:'file', set:{ issem:{ hold:null, pose:null }, ufis:{ hold:'file', pose:'show' } } }), S('Ufis', 'Sonunda onu buldum!', { e:'happy' }), S('Issem', 'Peki nerede?'),
    S('Ufis', 'Turnuvanın düzenleneceği stadyumun altında gizli bir bölüm var.', { set:{ ufis:{ hold:null, pose:null } } }), S('Leo', 'Demek ki turnuva boyunca ustanı orada tutacaklar!', { e:'shock' }),
    CARD('Sahne 5', 'Son Hazırlıklar'), N("Üçlü, turnuva başlamadan önce ustayı kurtarmaya karar verir. Ancak Issem'in telefonuna yeni bir mesaj gelir.", { sfx:'msg', set:{ issem:{ takeout:'phone' } } }),
    { msg:'Büyük gün geldi. Stadyumda görüşürüz.' }, N('Issem telefonu kapatır.', { set:{ issem:{ act:{ pose:'pocket', dur:.4, then:{ hold:null, pose:null } } } } }), S('Issem', 'Bu işi bitiriyoruz.', { e:'angry' }),
    S('Ufis', 'Hem ustamı kurtaracağız hem de örgütü durduracağız.', { e:'angry' }) ] } },
  { cut:{ bg:'liderOda', screen:'stadium', actors:[ A('lider', 'lider', 300, 1, { pose:'stand' }), A('yard', 'yardimci', 150, 1) ], lines:[
    CARD('Bölüm Sonu'), N("Örgütün lideri, Narak'ın yenildiğini öğrenir."), S('Yardımcı', 'Narak başarısız oldu.', { e:'sad' }),
    S('Lider', 'Önemli değil. Artık turnuvayı başlatıyoruz.', { e:'smirk' }), N('Lider, büyük stadyumun görüntüsüne bakar.'),
    S('Lider', 'Herkes kendi sonunu hazırlıyor.', { e:'smirk' }) ] } },
] },
/* ================= BÖLÜM 8 ================= */
{ title:'Turnuvaya Giriş', teaser:['9. Bölüm – Final Maçı', 'Issem ve Ufis, örgütün liderine karşı son mücadelelerine hazırlanacak!'], flow:[
  { cut:{ bg:'soyunma', actors:[ A('issem', 'issem', 420, 1), A('leo', 'leo', -60, 1, { hidden:true }) ], lines:[
    CARD('Bölüm 8', 'Turnuvaya Giriş'), CARD('Sahne 1', 'Büyük Gün'),
    N("Dünya Şampiyonlar Turnuvası'nın başlamasına saatler kalmıştır. Stadyum binlerce taraftarla dolmuştur.", { sfx:'roar' }),
    N('Dünyanın farklı ülkelerinden takımlar turnuvaya katılmak için gelmiştir.'), N('Issem, Anolecrab formasıyla soyunma odasında hazırlanmaktadır.'),
    N('Leo yanına gelir.', { show:['leo'], set:{ leo:{ tx:240 }, issem:{ face:-1 } } }), S('Leo', 'Hazır mısın?'), S('Issem', 'Her zamankinden daha hazırım.', { e:'happy' }),
    S('Leo', 'Unutma, bugün sadece futbol oynamıyoruz. Arkadaşlarımızı da kurtaracağız.'), S('Issem', 'Bunu başaracağız.', { e:'angry' }) ] } },
  { cut:{ bg:'stadArka', actors:[ A('ufis', 'ufis', 300, 1), A('guard', 'guard', 640, -1) ], lines:[
    CARD('Sahne 2', "Ufis'in Görevi"), N('Bu sırada Ufis, stadyumun arka tarafına ulaşır. Amacı, stadyumun altındaki gizli bölümü bulmak ve ustasını kurtarmaktır.'),
    N('Bir görevli karşısına çıkar.', { set:{ guard:{ tx:480 } } }), S('Görevli', 'Burada ne arıyorsun?'), S('Ufis', 'Sadece yanlış yerde bulunan birini arıyorum.'),
    N('Görevli şüphelenir.'), S('Görevli', 'Buradan geçemezsin!', { e:'angry' }),
    N('Ufis, görevliyi etkisiz hâle getirerek yoluna devam eder… ama başkaları da var!', { seq:[ [0, 'ufis', { tx:400, speed:400 }], [.3, 'ufis', { act:{ pose:'kickA', dur:.35 } }], [.4, 'guard', { fall:.4, stars:true }] ] }) ] } },
  { lvl:'stadArka' },
  ...STAD_INTRO('Sahne 3', 'İlk Maç'),
  { cut:{ bg:'stad', minute:"0'", teams:['ANL', 'DKR'], cheer:true, actors:[ ...MATES(), A('issem', 'issem', 480, 1) ], ball:[520, 478], lines:[
    S('Spiker', "Dünya Şampiyonlar Turnuvası'na hoş geldiniz! İlk maç Anolecrab ile Demir Kartallar arasında oynanacak!", { sfx:'roar' }),
    N('Issem ve takım arkadaşları sahaya çıkar. Maç başlar.', { sfx:'whistle', min:"1'" }) ] } },
  { match:{ need:1, time:70, startMin:0, teams:['ANL', 'DKR'], obj:'İlk maç: Gol at!', defs:[820, 1180, 1520, 1860, 2120] } },
  { cut:{ bg:'stad', minute:"34'", score:'1 - 0', teams:['ANL', 'DKR'], cheer:true, actors:[ A('issem', 'issem', 480, 1, { pose:'cheer', e:'happy' }), ...MATES(4) ], lines:[
    { big:'GOOOOOOL!', sfx:'goal', fx:'confetti' }, N('Anolecrab 1-0 öne geçer. Taraftarlar büyük bir sevinç yaşar.', { fx:'cheer' }) ] } },
  { cut:{ bg:'gizli', actors:[ A('ufis', 'ufis', 380, 1) ], lines:[
    CARD('Sahne 4', 'Gizli Oda'), N('Ufis sonunda stadyumun altındaki gizli bölümü bulur. Koridorun sonunda kilitli bir oda vardır.', { set:{ ufis:{ tx:600 } } }),
    N('Kapının arkasından bir ses gelir.'), S('Usta', 'Orada kim var?'), N('Ufis sesi tanır.', { set:{ ufis:{ e:'shock' } } }),
    S('Ufis', 'Usta! Benim, Ufis!', { e:'shock' }), S('Usta', 'Ufis? Gerçekten sen misin?', { e:'shock' }), S('Ufis', 'Seni buradan çıkaracağım!', { e:'angry' }),
    N('Tam o sırada alarm çalmaya başlar!', { fx:'alarm', set:{ ufis:{ face:-1, pose:'guard' } } }) ] } },
  { lvl:'gizliOda' },
  { cut:{ bg:'liderOda', screen:'split', actors:[ A('lider', 'lider', 300, 1, { pose:'stand' }), A('yard', 'yardimci', 150, 1) ], lines:[
    CARD('Sahne 5', 'Liderin Oyunu'), N("Örgütün lideri güvenlik odasında iki farklı ekrandan Issem ve Ufis'i izlemektedir."),
    N("Bir ekranda futbol maçı, diğerinde Ufis'in bulunduğu koridor görünür."), S('Yardımcı', 'İkisi de stadyumda.'),
    S('Lider', 'Güzel. Şimdi planın son aşamasını başlatın.', { e:'smirk' }), S('Yardımcı', 'Ya futbolcular?'),
    S('Lider', 'Birazdan bütün stadyum bizim kontrolümüzde olacak.', { e:'smirk' }) ] } },
  { cut:{ bg:'stad', minute:"52'", score:'1 - 0', teams:['ANL', 'DKR'], actors:[ ...MATES(4), A('issem', 'issem', 480, 1) ], lines:[
    N('Stadyumun ışıkları aniden kapanır!', { fx:'dark' }), N('Taraftarlar korkuyla bağırmaya başlar. Issem sahada etrafına bakar.', { sfx:'roar' }),
    S('Issem', 'Yine mi?!', { e:'shock' }),
    CARD('Bölüm Sonu'), N('Stadyumun dev ekranında örgütün lideri belirir.', { fx:'light', bigscreen:'lider', set:{ issem:{ e:'angry' } } }),
    S('Lider', 'Bayanlar ve baylar! Turnuvaya hoş geldiniz. Ancak bu turnuvanın kazananını ben belirleyeceğim!', { e:'smirk' }),
    N('Issem yumruklarını sıkar. Ufis ise ustasının bulunduğu kapının önünde beklemektedir.', { set:{ issem:{ pose:'guard' } } }),
    N('İkisi de büyük mücadelenin başladığını anlamıştır.') ] } },
] },
/* ================= BÖLÜM 9 ================= */
{ title:'Final Maçı', teaser:['10. Bölüm – Son Şampiyon', 'Issem final maçına çıkacak. Ancak onları çok büyük bir sürpriz bekliyor!'], flow:[
  { cut:{ bg:'soyunma', actors:[ A('issem', 'issem', -60, 1, { tx:420 }), A('leo', 'leo', 600, -1) ], lines:[
    CARD('Bölüm 9', 'Final Maçı'), CARD('Sahne 1', 'Stadyumun Kontrolü'),
    N('Stadyumun ışıkları yeniden yanar. Ancak bu kez sahada güvenlik görevlileri yerine örgütün adamları bulunmaktadır.'),
    N("Issem, soyunma odasına giderek Leo'yu bulur."), S('Issem', 'Bu adamlar bütün stadyumu ele geçirdi!', { e:'angry' }),
    S('Leo', 'Biliyorum. Futbolcuları güvenli bir yere götürmeye çalışıyorum.'), S('Issem', 'Ufis nerede?'),
    S('Leo', 'En son stadyumun altına indiğini gördüm.') ] } },
  { cut:{ bg:'gizli', actors:[ A('ufis', 'ufis', 520, 1), A('usta', 'usta', 760, -1, { hidden:true }) ], lines:[
    N('Bu sırada Ufis, ustasının tutulduğu odanın kapısını açmayı başarır.', { seq:[ [0, 'st', { door:true }], [.8, 'usta', { hidden:false, tx:640 }] ] }),
    S('Usta', 'Yıllar sonra yeniden karşılaştık!', { e:'happy' }), S('Ufis', 'Seni buradan çıkaracağız. Ama önce bu örgütü durdurmalıyız.', { e:'happy', set:{ ufis:{ pose:'bow' } } }) ] } },
  { cut:{ bg:'stad', bigscreen:'lider', crowdOn:false, actors:[ A('issem', 'issem', 420, 1), A('m1', 'masked', 140, 1), A('m2', 'masked', 860, -1), A('lider', 'lider', 1020, -1, { hidden:true }), A('dov', 'dovuscu', 1100, -1, { hidden:true }) ], lines:[
    CARD('Sahne 2', 'Lider Ortaya Çıkıyor'), N('Issem, stadyumun ortasına gelir. Dev ekranda örgütün lideri belirir.'),
    S('Lider', 'Issem! Sonunda karşı karşıyayız.', { e:'smirk' }), S('Issem', 'Arkadaşlarımı serbest bırak!', { e:'angry' }),
    S('Lider', 'Önce beni yenmen gerekiyor.', { e:'smirk' }),
    N("Lider stadyumun VIP bölümünden aşağı iner. Yanında Narak'ın yerine gönderdiği yeni dövüşçü vardır.", { bigscreen:'off', show:['lider', 'dov'], set:{ lider:{ tx:720 }, dov:{ tx:600 } } }),
    S('Lider', 'Bu gece her şey sona erecek!', { e:'angry' }) ] } },
  { cut:{ bg:'stad', bigscreen:'off', crowdOn:false, actors:[ A('dov', 'dovuscu', 640, -1, { pose:'guard' }), A('ufis', 'ufis', -60, 1, { tx:330 }), A('usta', 'usta', -160, 1, { tx:150 }) ], lines:[
    CARD('Sahne 3', 'Son Mücadele'), N("Ufis, ustasıyla birlikte stadyuma ulaşır. Yeni dövüşçü Ufis'in karşısına çıkar."),
    S('Dövüşçü', 'Beni yenebileceğini mi sanıyorsun?', { e:'angry' }), S('Ufis', 'Bunu birazdan göreceğiz.', { e:'angry', set:{ ufis:{ pose:'guard' } } }) ] } },
  { lvl:'bossDovuscu' },
  { cut:{ bg:'stad', bigscreen:'off', crowdOn:false, actors:[ A('dov', 'dovuscu', 660, -1, { pose:'lie', stars:true }), A('ufis', 'ufis', 420, 1), A('usta', 'usta', 200, 1) ], lines:[
    N('Ufis, rakibinin hareketlerini dikkatle takip eder ve sonunda onu yenmeyi başarır.', { set:{ ufis:{ pose:'bow' } } }),
    N('Bu sırada Issem, örgütün liderinin peşine düşer.') ] } },
  { cut:{ bg:'stad', bigscreen:'off', crowdOn:false, actors:[ A('issem', 'issem', 360, 1, { pose:'guard' }), A('lider', 'lider', 620, -1), A('ufis', 'ufis', -60, 1, { hidden:true }) ], lines:[
    CARD('Sahne 4', 'Issem ve Lider'), N('Issem ile lider stadyumun ortasında karşı karşıya gelir.'),
    S('Lider', 'Sen sadece bir futbolcusun. Bu mücadeleyi kazanamazsın.', { e:'smirk' }),
    S('Issem', 'Futbolcu olabilirim ama arkadaşlarımı asla yarı yolda bırakmam!', { e:'angry' }),
    N("Lider, Issem'e doğru ilerler.", { set:{ lider:{ tx:520 } } }), N('Tam o sırada Ufis yetişir!', { show:['ufis'], set:{ ufis:{ tx:240, speed:420 } } }),
    S('Ufis', 'Bu iş burada bitiyor!', { e:'angry' }) ] } },
  { lvl:'bossLider' },
  { cut:{ bg:'stad', crowdOn:false, actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 260, 1), A('lider', 'lider', 600, -1, { pose:'kneel', e:'pain' }), A('g1', 'guard', 760, -1), A('g2', 'guard', 840, -1) ], lines:[
    N('İkili birlikte lideri köşeye sıkıştırır. Liderin adamları da güvenlik güçleri tarafından yakalanır.', { set:{ g1:{ tx:660 } } }) ] } },
  { cut:{ bg:'stad', minute:'', cheer:true, actors:[ ...MATES(4), A('issem', 'issem', 480, 1, { pose:'cheer', e:'happy' }), A('ufis', 'ufis', 250, 1), A('usta', 'usta', 140, 1) ], lines:[
    CARD('Sahne 5', 'Büyük Kurtuluş'), N('Örgütün karargâhı ele geçirilir. Kaçırılan futbolcular serbest bırakılır.', { fx:'cheer' }),
    N('Ufis, yıllardır aradığı ustasına kavuşur.', { set:{ ufis:{ face:-1 }, usta:{ face:1, e:'happy' } } }), S('Usta', 'Seninle gurur duyuyorum.', { e:'happy' }),
    S('Ufis', 'Bunca yıl seni aradım. Sonunda başardık.', { e:'happy' }), N('Issem de takım arkadaşlarıyla yeniden buluşur.'),
    S('Issem', 'Artık futbolumuza geri dönebiliriz!', { e:'happy' }),
    CARD('Bölüm Sonu'), N('Stadyumda taraftarlar yeniden toplanır. Spiker mikrofonu eline alır.'),
    S('Spiker', 'Yaşanan olayların ardından turnuva kaldığı yerden devam edecek! Anolecrab finale çıkmaya hak kazandı!', { fx:'confetti', sfx:'roar' }),
    N('Issem sahaya çıkar. Ufis ve ustası tribünden onu izlemektedir.') ] } },
  { cut:{ bg:'sehir', actors:[ A('golge', 'golge', 520, -1, { pose:'stand' }) ], lines:[
    N('Ancak uzakta, yüksek bir binanın penceresinde başka biri onları takip etmektedir.'),
    N('Bu kişi telefonunu çıkarır.', { set:{ golge:{ takeout:'phone' } } }), S('Gizemli Kişi', 'İlk plan başarısız oldu. Ama henüz bitmedi.'),
    N('Telefonunu kapatır.', { set:{ golge:{ act:{ pose:'pocket', dur:.4, then:{ hold:null, pose:'stand' } } } } }) ] } },
] },
/* ================= BÖLÜM 10 ================= */
{ title:'Son Şampiyon', teaser:null, flow:[
  { cut:{ bg:'soyunma', actors:[ A('issem', 'issem', 480, -1), A('t1', 'mate', 300, 1), A('t2', 'mate2', 180, 1), A('t3', 'mate', 680, -1) ], lines:[
    CARD('Bölüm 10', 'Son Şampiyon'), CARD('FİNAL BÖLÜMÜ'), CARD('Sahne 1', 'Final Heyecanı'),
    N('Örgütün planı bozulmuş, kaçırılan futbolcular kurtarılmıştır. Ancak turnuva henüz bitmemiştir.'),
    N('Anolecrab, final maçına çıkmak üzeredir. Issem soyunma odasında takım arkadaşlarıyla konuşur.'),
    S('Issem', 'Arkadaşlar, çok şey yaşadık. Ama bugün buraya futbol oynamak için geldik. Bu kupayı kazanacağız!', { e:'angry' }),
    S('Takım Arkadaşı', 'Seninle aynı sahada olmak büyük bir şans. Hadi kupayı alalım!', { e:'happy' }), N('Takım sahaya çıkar.') ] } },
  ...STAD_INTRO('Sahne 2', 'Büyük Final'),
  { cut:{ bg:'stad', minute:"0'", teams:['ANL', 'KŞM'], score:'0 - 0', actors:[ ...MATES(), A('issem', 'issem', 480, 1) ], ball:[520, 478], lines:[
    S('Spiker', 'İşte beklenen an! Dünya Şampiyonlar Turnuvası finali başlıyor!', { sfx:'roar' }),
    N('Maç başlar. Rakip takım Kızıl Şimşekler oldukça güçlüdür. Anolecrab ilk yarıda istediği oyunu sergileyemez.', { sfx:'whistle', min:"12'" }),
    N("Dakikalar 40'ı gösterirken rakip takım gol atar.", { min:"40'", score:'0 - 1', sfx:'ooh', fx:'shake' }),
    S('Issem', 'Pes etmek yok! Daha bitmedi!', { e:'angry' }), N('İkinci yarı başlar.', { sfx:'whistle', min:"46'" }) ] } },
  { match:{ need:2, time:95, startMin:46, score:[0, 1], teams:['ANL', 'KŞM'], obj:'FİNAL: 2 gol at, maçı çevir!', defs:[760, 1060, 1360, 1660, 1960, 2160],
    hint:'0-1 gerideyiz! Süre bitmeden 2 gol lazım. Çalımla geç, şutu güç + yön okuyla çek!' } },
  { cut:{ bg:'stad', music:'final', minute:"90'", teams:['ANL', 'KŞM'], score:'2 - 1', cheer:true, actors:[ ...MATES(), A('issem', 'issem', 480, 1, { pose:'cheer', e:'happy' }) ], lines:[
    CARD('Sahne 3', 'Son Dakikalar'), { big:'GOOOOOOOOOOL!', sfx:'goal' }, N('Anolecrab 2-1 öne geçer!', { fx:'cheer' }),
    N('Hakem son düdüğü çalar.', { sfx:'longWhistle' }), { big:'ANOLECRAB ŞAMPİYON!', size:58, fx:'confetti', sfx:'win' },
    N('Issem ve takım arkadaşları büyük sevinç yaşar.', { set:{ issem:{ trophy:true, pose:'trophy' }, m1:{ pose:'cheer' }, m2:{ pose:'cheer' }, m3:{ pose:'cheer' }, m4:{ pose:'cheer' }, m5:{ pose:'cheer' }, m6:{ pose:'cheer' } } }) ] } },
  { cut:{ bg:'stad', music:'final', cheer:true, minute:'BİTTİ', teams:['ANL', 'KŞM'], score:'2 - 1', actors:[ A('issem', 'issem', 560, -1, { trophy:true, pose:'trophy', e:'happy' }), A('ufis', 'ufis', 380, 1), A('usta', 'usta', 250, 1), A('t1', 'mate', 700, -1), A('t2', 'mate2', 800, -1) ], lines:[
    CARD('Sahne 4', 'Son Buluşma'), N('Maçtan sonra Issem, Ufis ve ustasıyla buluşur.', { set:{ issem:{ pose:null, trophy:false } } }),
    S('Issem', 'Her şey için teşekkür ederim. Sen olmasaydın bunların hiçbirini başaramazdık.', { e:'happy' }),
    S('Ufis', 'Sen de benim için çok şey yaptın. Sonunda ustamı buldum.', { e:'happy' }), S('Usta', 'Artık herkes kendi yoluna devam edebilir.', { e:'happy' }),
    S('Issem', 'Belki bir gün tekrar karşılaşırız.', { e:'happy' }), N('Üçü birbirleriyle vedalaşır.', { set:{ ufis:{ pose:'bow' }, usta:{ pose:'bow' }, issem:{ pose:'bow' } } }) ] } },
  { cut:{ bg:'sehir', car:260, actors:[ A('golge', 'golge', 330, 1, { hidden:true }) ], lines:[
    CARD('Sahne 5', 'Gizemli Kişi'), N('Gece vakti… Şehrin başka bir yerinde siyah bir araç durur.'),
    N('Araçtan takım elbiseli gizemli bir kişi iner.', { seq:[ [0, 'sfx', 'doorClose'], [.3, 'golge', { hidden:false, tx:760 }] ] }) ] } },
  { cut:{ bg:'liderOda', screen:'watch', actors:[ A('golge', 'golge', 300, 1, { pose:'stand' }), A('yard', 'yardimci', 140, 1) ], lines:[
    N("Bir binaya girer ve karanlık bir odaya geçer. Masasının üzerinde Issem ve Ufis'in fotoğrafları bulunmaktadır."),
    S('Yardımcı', 'Efendim, ilk planımız başarısız oldu.'), S('Gizemli Kişi', 'Biliyorum.'), S('Yardımcı', 'Şimdi ne yapacağız?'),
    N('Gizemli kişi ayağa kalkar ve pencereye yaklaşır.', { set:{ golge:{ tx:480 } } }),
    S('Gizemli Kişi', 'Issem ve Ufis kazandıklarını düşünüyorlar. Ama asıl mücadele şimdi başlayacak.'),
    N('Telefonunu çıkarır.', { set:{ golge:{ takeout:'phone' } } }), S('Gizemli Kişi', 'İkinci aşamayı başlatın.'),
    N('Kamera yavaşça masadaki gizemli dosyaya yaklaşır. Dosyanın üzerinde şu yazmaktadır:', { screen:'off', zoom:1.2 }),
    { big:'PROJE: YENİ DÜNYA', col:'#ff3030', size:64, sfx:'boss' }, CARD('SON', 'İlk Film Tamamlandı!') ] } },
] },
];
