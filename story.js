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
  antrenman: { bg:'saha', chars:['issem'], width:W, start:140, maxX:840,
    init(L){ L.stepN = 0; L.goals = 0; L.obj = '▶ tuşuyla turuncu koniye koş'; L.hint = 'Soldaki ◀ ▶ tuşları ile hareket et'; L.hintT = 6; },
    update(L){ const p = L.p;
      if (L.stepN === 0 && p.x > 500){ L.stepN = 1; L.jumped = false; L.obj = '⤒ tuşuyla zıpla'; SFX.ok(); }
      else if (L.stepN === 1 && L.jumped){ L.stepN = 2; L.obj = '⚽ ile kaleye 3 gol at (0/3)'; L.hint = 'Kaleye dönükken ⚽ tuşuna bas'; L.hintT = 5; SFX.ok(); } },
    ball(L, b){ if (L.stepN === 2 && b.live && b.x > 888){ b.live = false; b.life = .5; b.vx *= .1; L.goals++; SFX.goal(); vib(90);
        floatText(L, 900, GROUND - 160, 'GOL!', '#f2c230'); spawnSparks(L, 900, GROUND - 60, '#f2c230', 14, 'star');
        L.obj = '⚽ ile kaleye 3 gol at (' + L.goals + '/3)'; if (L.goals >= 3){ L.obj = 'Antrenman tamam! 👏'; L.done = 1; } } },
    drawWorld(L, c){
      drawHuman(c, 80, GROUND - 6, LOOK.coach, getPose({ animT:L.time, pose:'arms' }), 1, .9, 1, null, L.goals ? 'happy' : 'neutral');
      if (L.stepN === 0){ c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(520, GROUND - 40); c.lineTo(506, GROUND); c.lineTo(534, GROUND); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(509, GROUND - 22, 22, 5); }
      c.strokeStyle = '#ffffff'; c.lineWidth = 7; c.beginPath(); c.moveTo(890, GROUND); c.lineTo(890, GROUND - 120); c.lineTo(W + 10, GROUND - 120); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5;
      for (let y = GROUND - 110; y < GROUND; y += 14){ c.beginPath(); c.moveTo(893, y); c.lineTo(W, y + 6); c.stroke(); }
      for (let x = 900; x < W; x += 14){ c.beginPath(); c.moveTo(x, GROUND - 118); c.lineTo(x + 8, GROUND); c.stroke(); } } },
  dojo: { bg:'dojo', chars:['ufis'], width:W, start:150,
    init(L){ [430, 620, 800].forEach(x => L.ents.push(makeEnemy('dummy', x))); L.obj = '👊 ve 🦵 ile 3 kuklayı devir (0/3)'; L.hint = '👊 tuşuna arka arkaya 3 kez bas: KOMBO!'; L.hintT = 7; },
    update(L){ if (L.done) return; const left = L.ents.filter(e => !e.dead).length;
      L.obj = '👊 ve 🦵 ile 3 kuklayı devir (' + (3 - left) + '/3)'; if (left === 0){ L.obj = 'Usta işi! 🥋'; L.done = 1; SFX.ok(); } } },
  tunel: { bg:'tunel', chars:['issem'], width:2700, start:120, exit:true, obj:'Çetecileri geç, tünelden çık!', hint:'Düşman KIRMIZI yanınca vuracak → 🛡️ ile blokla!',
    waves:[ { at:300, list:['thug', 'thug'] }, { at:1000, list:[['thug', 1], ['thug', -1], ['thug', 1]] },
            { at:1700, list:[['brute', 1], ['thug', -1]], hint:'İri Koruma! Uzaktan ⚽ şut çek, yakında blokla.' }, { at:2250, list:[['brute', 1], ['thug', 1], ['thug', -1]] } ] },
  /* --- Bölüm 2 --- */
  depoHayatta: { bg:'depo', chars:['issem'], width:W, start:420, survive:32, pool:['masked', 'masked', 'thug'], obj:'Kaçış yok! Dayan!', hint:'Etrafın sarıldı. Blokla, vur, yere düşme!', doneMsg:'Biri geliyor…' },
  depoKacis: { bg:'depo', chars:['issem', 'ufis'], width:2400, start:150, exit:true, obj:'Ufis ile depodan çık!', hint:'⇄ tuşu ile Issem ve Ufis arasında geçiş yap!',
    waves:[ { at:250, list:['masked', 'masked', 'masked'] }, { at:1000, list:[['kicker', 1], ['masked', -1], ['masked', 1]], hint:'Mor giyimli tekmeci çok hızlı: blokla, sonra karşılık ver!' },
            { at:1700, list:[['brute', 1], ['masked', -1], ['kicker', 1]] } ] },
  /* --- Bölüm 3 --- */
  fabrikaGiris: { bg:'fabrikaDis', chars:['issem', 'ufis'], width:2600, start:120, exit:true, obj:'Nöbetçileri geç, fabrikaya gir!',
    waves:[ { at:250, list:['guard', 'guard'] }, { at:900, list:[['shield', 1], ['guard', -1]], hint:'Kalkanlı koruma! Önden yumruk işlemez: 🦵 tekme ya da ⚽ şut!' },
            { at:1600, list:[['kicker', 1], ['guard', 1], ['guard', -1]] }, { at:2150, list:[['shield', 1], ['shield', -1], ['kicker', 1]] } ] },
  fabrikaIc: { bg:'fabrika', chars:['issem', 'ufis'], width:2800, start:120, exit:true, alarm:true, obj:'Alarm! Koridorun sonundaki kapıya ulaş!',
    waves:[ { at:250, list:['guard', 'guard', 'kicker'] }, { at:950, list:[['shield', 1], ['guard', -1], ['guard', 1]] },
            { at:1650, list:[['brute', 1], ['kicker', -1], ['guard', 1]] }, { at:2300, list:[['shield', 1], ['brute', -1], ['kicker', 1], ['guard', 1]] } ] },
  /* --- Bölüm 4 --- */
  gecmis: { bg:'dojo', sepia:true, chars:['ufisGenc'], width:W, start:480, survive:28, pool:['masked', 'thug', 'masked'], obj:'Geçmiş: Okulu koru!', hint:'Yıllar önce… Genç Ufis, okulunu savunuyor.', doneMsg:'Ama çok kalabalıklar…' },
  bossYardimci: { bg:'eskiOkul', chars:['ufis'], width:W, start:200, obj:'Yardımcıyı yen!', noHeal:true,
    waves:[ { at:0, list:[['yardimci', 1]] } ], barks:[ { at:2.5, who:'Issem', t:'Dikkat et Ufis, çok hızlı!' }, { at:20, who:'Yardımcı', t:'Ustan seni böyle mi eğitti?', e:'smirk' } ] },
  /* --- Bölüm 5 --- */
  /* (maç: aşağıda akış içinde) */
  /* --- Bölüm 6 --- */
  karargahGiris: { bg:'karargah', chars:['issem', 'ufis'], width:2600, start:120, exit:true, obj:'Karargâha sız!',
    waves:[ { at:250, list:['guard', 'shield', 'guard'] }, { at:950, list:[['kicker', 1], ['kicker', -1], ['guard', 1]] },
            { at:1700, list:[['brute', 1], ['shield', -1], ['guard', 1]] } ] },
  karargahKacis: { bg:'karargah', chars:['issem', 'ufis'], width:3000, start:120, exit:true, alarm:true, limit:95, loseMsg:'Yakalandınız!', obj:'Alarm! Binadan kaç!',
    hint:'Süre bitmeden çıkışa ulaşın! Hızlı ve kombolu dövüşün.',
    waves:[ { at:300, list:['guard', 'guard'] }, { at:900, list:[['kicker', 1], ['shield', -1]] }, { at:1500, list:[['guard', 1], ['guard', -1], ['kicker', 1]] },
            { at:2100, list:[['brute', 1], ['guard', -1]] }, { at:2550, list:[['shield', 1], ['kicker', 1], ['kicker', -1]] } ] },
  /* --- Bölüm 7 --- */
  bossNarak: { bg:'salon', chars:['ufis'], width:W, start:200, obj:'Narak ile hesaplaş!', noHeal:true,
    waves:[ { at:0, list:[['narak', 1]] } ], barks:[ { at:3, who:'Issem', t:'Ufis, dikkat et!' }, { at:16, who:'Narak', t:'Yıllar seni yavaşlatmış, ihtiyar!', e:'smirk' }, { at:32, who:'Leo', t:'Hareketlerini izle, açık veriyor!' } ] },
  /* --- Bölüm 8 --- */
  stadArka: { bg:'stadArka', chars:['ufis'], width:2700, start:120, exit:true, obj:'Stadyumun altına in!',
    waves:[ { at:250, list:['guard', 'guard'] }, { at:900, list:[['shield', 1], ['kicker', -1]] }, { at:1600, list:[['guard', 1], ['guard', -1], ['shield', 1]] },
            { at:2200, list:[['brute', 1], ['kicker', 1], ['guard', -1]] } ] },
  gizliOda: { bg:'gizli', chars:['ufis'], width:W, start:600, survive:30, alarm:true, pool:['guard', 'masked', 'kicker', 'shield'], obj:'Ustanın kapısını koru!', hint:'Alarm çaldı! Kapı açılana kadar dayan.', doneMsg:'Kilit çözülüyor…' },
  /* --- Bölüm 9 --- */
  bossDovuscu: { bg:'stad', chars:['ufis'], width:W, start:200, obj:'Yeni dövüşçüyü yen!', noHeal:true,
    waves:[ { at:0, list:[['dovuscu', 1]] } ], hint:'Yere vurduğunda şok dalgası gelir: ⤒ ZIPLA!',
    barks:[ { at:4, who:'Usta', t:'Sabırlı ol Ufis. Güç her şey değildir.', e:'neutral' }, { at:24, who:'Dövüşçü', t:'Ezeceğim seni!', e:'angry' } ] },
  bossLider: { bg:'stad', chars:['issem', 'ufis'], width:W, start:200, obj:'Lideri durdur!', noHeal:true,
    waves:[ { at:0, list:[['lider', 1]] } ], hint:'⇄ ile ikisini de kullanın! Issem uzaktan şut, Ufis yakından dövüş.',
    barks:[ { at:5, who:'Lider', t:'İkiniz de benim oyunumdaki piyonlarsınız!', e:'smirk' }, { at:22, who:'Issem', t:'Arkadaşlarım için, Ufis!' }, { at:40, who:'Ufis', t:'Ustam için!' } ] },
};

/* ---------------- BÖLÜMLER ---------------- */
const MATES_STAD = [A('m1', 'mate', 150, 1, { y:470, s:.6, tag:'mate' }), A('m2', 'mate2', 300, 1, { y:440, s:.52, tag:'mate' }), A('m3', 'mate', 640, -1, { y:440, s:.52, tag:'mate' }),
  A('m4', 'mate2', 800, -1, { y:470, s:.6, tag:'mate' }), A('m5', 'mate', 400, 1, { y:405, s:.44, tag:'mate' }), A('m6', 'mate2', 570, -1, { y:400, s:.44, tag:'mate' })];

const CHAPTERS = [
/* ================= BÖLÜM 1 ================= */
{ title:'Şampiyonun Hayatı', teaser:['2. Bölüm – Gizemli Saldırı', 'Issem, kaybolan takım arkadaşlarının izini sürmeye başlıyor.'], flow:[
  { cut:{ bg:'saha', actors:[ A('coach', 'coach', 300, 1, { pose:'arms' }), A('issem', 'issem', 560, -1) ], lines:[
    CARD('Bölüm 1', 'Şampiyonun Hayatı'), CARD('Sahne 1', 'Büyük Yıldız'), N('Yıl 2014.'),
    N('Anolecrab, sezonun en önemli maçlarından birine hazırlanmaktadır. Takımın yıldızı Issem, antrenman sahasında çalışmalarını sürdürür.') ] } },
  { lvl:'antrenman' },
  { cut:{ bg:'saha', actors:[ A('coach', 'coach', 360, 1, { pose:'arms' }), A('issem', 'issem', 560, -1) ], lines:[
    S('Teknik Direktör', 'Issem, yarınki maç bizim için çok önemli. Hazır mısın?'), S('Issem', 'Her zamankinden daha hazırım!', { e:'happy' }),
    N('Antrenman sona erer. Futbolcular soyunma odasına giderken Issem, telefonuna gelen gizemli bir mesajı fark eder.', { set:{ issem:{ pose:'phone' }, coach:{ tx:-80 } } }),
    { msg:'Yarınki maçta her şey değişecek. Takım arkadaşlarını koruyabilecek misin?' }, N('Issem şaşırır.', { set:{ issem:{ pose:'shock', e:'shock' } } }) ] } },
  { cut:{ bg:'dojo', actors:[ A('ufis', 'ufis', 520, 1, { pose:'guard' }) ], lines:[ CARD('Sahne 2', 'Gizemli Adam'), N('Şehrin başka bir yerinde, dövüş ustası Ufis bir dövüş salonunda antrenman yapmaktadır.') ] } },
  { lvl:'dojo' },
  { cut:{ bg:'dojo', actors:[ A('ufis', 'ufis', 620, -1), A('lider', 'lider', 140, 1, { pose:'stand', hidden:true }) ], lines:[
    N('Bir anda kapı açılır. İçeri siyah giyimli bir adam girer.', { fx:'door', show:['lider'], set:{ lider:{ tx:340 } } }),
    S('Gizemli Adam', 'Seni bulmam biraz zaman aldı.', { e:'smirk' }), S('Ufis', 'Ne istiyorsun?', { e:'angry' }), S('Gizemli Adam', 'Yakında öğreneceksin.', { e:'smirk' }),
    N('Adam salondan ayrılır. Ufis, bu olayın sıradan olmadığını anlar.', { set:{ lider:{ tx:140, hideAt:true } } }) ] } },
  { cut:{ bg:'stad', minute:"0'", actors:[ ...MATES_STAD, A('issem', 'issem', 480, 1, { y:485, s:.7 }) ], ball:[520, 478], lines:[
    CARD('Sahne 3', 'Maç Günü'), N('Ertesi gün Uon Pmac Stadı tamamen dolmuştur.', { sfx:'crowd' }),
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
    N('Stadın güvenlik odasına gider. Güvenlik kameralarını açar.', { screen:'masked' }),
    N('Görüntülerde siyah kıyafetli, yüzleri maskeli birkaç kişi görünmektedir. Bu kişiler maç başlamadan önce stada girmiştir.'),
    N('Issem görüntüyü durdurur.'), S('Issem', 'Bunlar kim? Takım arkadaşlarımı nereye götürdüler?', { e:'angry' }),
    N('Tam o sırada arkasından bir ses gelir.', { show:['guard'], set:{ guard:{ tx:220 } } }),
    S('Güvenlik Görevlisi', 'Burada ne arıyorsun?'), S('Issem', 'Takım arkadaşlarımı bulmaya çalışıyorum.', { set:{ issem:{ face:-1 } } }),
    S('Güvenlik Görevlisi', 'O zaman dikkatli ol. Bu kişiler oldukça tehlikeli.', { e:'sad' }) ] } },
  { cut:{ bg:'depo', actors:[ A('issem', 'issem', 300, 1), A('k1', 'masked', -60, 1, { hidden:true }), A('k2', 'masked', -140, 1, { hidden:true }), A('k3', 'masked', 1020, -1, { hidden:true }) ], lines:[
    CARD('Sahne 2', 'İlk Karşılaşma'), N('Issem, kameralarda gördüğü aracın plakasını takip ederek eski bir depoya ulaşır.'),
    N('İçeriden konuşma sesleri gelmektedir. Issem kapının aralığından içeri bakar.'),
    N('Takım arkadaşlarının fotoğraflarının bulunduğu bir masa görür.', { set:{ issem:{ tx:390, e:'shock' } } }),
    N('Bir anda arkasından üç maskeli adam çıkar!', { fx:'shake', show:['k1', 'k2', 'k3'], set:{ k1:{ tx:180 }, k2:{ tx:100 }, k3:{ tx:640 } } }),
    S('Maskeli Adam', 'Yanlış yere geldin, futbolcu!'), N('Issem kaçmaya çalışır ancak adamlardan biri önünü keser…', { set:{ issem:{ face:-1, pose:'guard', e:'angry' } } }) ] } },
  { lvl:'depoHayatta' },
  { cut:{ bg:'depo', actors:[ A('issem', 'issem', 430, 1, { pose:'guard' }), A('ufis', 'ufis', 1020, -1, { hidden:true }), A('k1', 'masked', 600, -1, { pose:'lie' }), A('k2', 'masked', 250, 1, { pose:'lie' }), A('k3', 'masked', 700, -1, { pose:'lie' }) ], lines:[
    N('Tam yakalanacağı sırada bir adam ortaya çıkar ve saldırganları etkisiz hâle getirir!', { fx:'flash', show:['ufis'], set:{ ufis:{ tx:620, speed:400 } } }),
    N("Bu kişi dövüş ustası Ufis'tir."), S('Issem', 'Sen de kimsin?', { e:'shock' }), S('Ufis', 'Ben de bu adamların peşindeyim.'),
    N('Ama dışarıdan yeni adamlar gelmektedir. İkili birlikte depodan çıkmak zorundadır!', { fx:'shake' }) ] } },
  { lvl:'depoKacis' },
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 580, -1) ], lines:[
    CARD('Sahne 3', 'Ortak Düşman'), N('İkili depodan uzaklaşarak güvenli bir yere gider.'),
    S('Issem', 'Takım arkadaşlarımı kaçırdılar. Onları bulmam gerekiyor.', { e:'sad' }),
    S('Ufis', 'Benim de peşinde olduğum bir örgüt var. Sanırım aynı kişilerden bahsediyoruz.'),
    S('Issem', 'Peki onları nerede bulabiliriz?'), S('Ufis', 'Henüz bilmiyorum. Ama bir iz buldum.'),
    N('Ufis cebinden üzerinde bir sembol bulunan küçük bir kâğıt çıkarır. Kâğıtta bir adres yazmaktadır.', { item:'paper' }) ] } },
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1, { pose:'phone' }), A('ufis', 'ufis', 580, -1) ], lines:[
    CARD('Sahne 4', 'Beklenmedik Mesaj'), N("İkili adresi araştırmaya karar verir. Ancak Issem'in telefonu çalar.", { sfx:'ring' }),
    N('Bilinmeyen bir numaradan görüntülü arama gelmektedir. Issem telefonu açar.'),
    { call:'mate', who:'Futbolcu', t:'Issem! Bizi bulmalısın! Burada yalnız değiliz!' },
    N('Görüntü aniden kesilir.', { fx:'flash' }), { msg:'Bir sonraki hamlenizi biliyoruz.', red:true },
    N('Issem ve Ufis birbirlerine bakar.', { set:{ issem:{ pose:null } } }), S('Ufis', 'Bizi izliyorlar.', { e:'angry' }),
    S('Issem', 'O zaman onları bulmadan durmayacağız.', { e:'angry' }) ] } },
  { cut:{ bg:'liderOda', screen:'watch', actors:[ A('lider', 'lider', 300, 1, { pose:'stand' }) ], lines:[
    CARD('Bölüm Sonu'), N("Karanlık bir odada gizemli bir adam bilgisayar ekranından Issem ve Ufis'i izlemektedir."),
    S('Gizemli Adam', 'İkisi de bir araya geldi. Planı değiştirme zamanı.', { e:'smirk' }),
    N('Adam telefonunu eline alır.', { set:{ lider:{ pose:'phone' } } }), S('Gizemli Adam', 'Üçüncü aşamayı başlatın.', { e:'angry' }) ] } },
] },
/* ================= BÖLÜM 3 ================= */
{ title:'Kaçırılan Futbolcular', teaser:['4. Bölüm – Dövüş Ustasının Dönüşü', "Ufis'in geçmişindeki sırlar ortaya çıkacak!"], flow:[
  { cut:{ bg:'fabrikaDis', actors:[ A('issem', 'issem', 200, 1), A('ufis', 'ufis', 320, 1) ], lines:[
    CARD('Bölüm 3', 'Kaçırılan Futbolcular'), CARD('Sahne 1', 'Gizli Tesis'),
    N('Issem ve Ufis, kâğıtta yazan adresi takip ederek şehrin dışındaki terk edilmiş bir fabrikaya ulaşır.'),
    N('Fabrikanın etrafında güvenlik kameraları ve nöbetçiler vardır.'),
    S('Issem', 'Takım arkadaşlarımın burada olduğuna emin misin?', { set:{ issem:{ face:1 } } }),
    S('Ufis', 'Tam emin değilim ama başka ipucumuz yok.', { set:{ ufis:{ face:-1 } } }), N('İkili içeri girmek için uygun bir yol aramaya başlar.') ] } },
  { lvl:'fabrikaGiris' },
  { cut:{ bg:'fabrika', actors:[ A('issem', 'issem', 260, 1), A('ufis', 'ufis', 140, 1), A('guard', 'guard', 1020, -1, { hidden:true }) ], lines:[
    CARD('Sahne 2', 'Fabrikaya Giriş'), N('Issem ve Ufis fabrikaya girer. İçeride çok sayıda bilgisayar ve güvenlik ekranı bulunmaktadır.'),
    N('Issem ekranlardan birine yaklaşır. Bir anda tanıdık yüzler görür.', { screen:'players', set:{ issem:{ tx:360 } } }),
    S('Issem', 'İşte onlar! Takım arkadaşlarım!', { e:'shock' }), N('Ekranda Anolecrab futbolcuları bir odada tutulmaktadır.'),
    S('Ufis', 'Onları bulduk. Şimdi buradan çıkarmamız gerekiyor.'),
    N('Tam o sırada alarm çalmaya başlar!', { fx:'alarm' }),
    S('Güvenlik Görevlisi', 'Yabancılar var! Herkesi durdurun!', { e:'angry', show:['guard'], set:{ guard:{ tx:780 } } }) ] } },
  { lvl:'fabrikaIc' },
  { cut:{ bg:'kapi', alarm:true, actors:[ A('issem', 'issem', 480, 1) ], lines:[
    CARD('Sahne 3', 'Büyük Mücadele'), N('Ufis, karşılarına çıkan saldırganlarla dövüşürken Issem, takım arkadaşlarının bulunduğu odaya ulaşmaya çalışır.'),
    N('Koridorun sonunda büyük bir kapı görür. Kapının üzerinde elektronik bir kilit vardır.'),
    N('Issem bilgisayarın başına geçer ancak şifreyi bilmemektedir.', { set:{ issem:{ tx:520, pose:'point' } } }),
    N('Tam o sırada hoparlörden bir ses duyulur.'),
    S('Gizemli Adam', 'Issem! Seni burada görmek güzel.', { e:'smirk' }), S('Issem', 'Sen kimsin? Arkadaşlarımı neden kaçırdın?', { e:'angry', set:{ issem:{ pose:null, face:-1 } } }),
    S('Gizemli Adam', 'Çünkü seninle özel olarak ilgileniyoruz.', { e:'smirk' }) ] } },
  { cut:{ bg:'fabrika', actors:[ A('issem', 'issem', 420, 1), A('ufis', 'ufis', -60, 1, { tx:250 }) ], lines:[
    CARD('Sahne 4', 'Liderin Mesajı'), N('Issem kapının açılmasını beklerken Ufis yanına gelir.', { set:{ issem:{ face:-1 } } }),
    S('Ufis', 'Burada fazla kalamayız. Daha büyük bir sorun var.'), S('Issem', 'Ne oldu?'),
    S('Ufis', 'Bu fabrika sadece bir merkez. Örgütün asıl karargâhı başka bir yerde.'),
    N('Bir anda fabrikanın bütün ekranları açılır. Gizemli adam yeniden görünür.', { fx:'flash', screen:'lider', set:{ issem:{ face:1, e:'shock' }, ufis:{ face:1 } } }),
    S('Gizemli Adam', 'Futbolcularınızı istiyorsanız benimle anlaşma yapacaksınız.', { e:'smirk' }), S('Issem', 'Ne istiyorsun?', { e:'angry' }),
    S('Gizemli Adam', 'Yakında öğreneceksin.', { e:'smirk' }), N('Ekranlar kapanır.', { screen:'off' }) ] } },
  { cut:{ bg:'fabrika', actors:[ A('issem', 'issem', 420, 1), A('ufis', 'ufis', 560, -1) ], lines:[
    CARD('Sahne 5', 'Beklenmedik Keşif'), N("Ufis, fabrikada bulduğu bir dosyayı Issem'e gösterir.", { item:'file' }),
    N('Dosyada kaçırılan futbolcuların isimleri ve başka futbol takımlarına ait bilgiler bulunmaktadır.', { item:'file' }),
    S('Issem', "Demek ki sadece Anolecrab'ın peşinde değiller.", { e:'shock' }), S('Ufis', 'Evet. Bütün futbol dünyasını kontrol etmek istiyorlar.', { e:'angry' }),
    N('İkili artık karşılarındaki düşmanın düşündüklerinden çok daha büyük olduğunu anlamıştır.') ] } },
  { cut:{ bg:'liderOda', screen:'off', actors:[ A('lider', 'lider', 300, 1, { pose:'sit' }), A('yard', 'yardimci', 160, 1, { pose:'stand' }) ], lines:[
    CARD('Bölüm Sonu'), N('Gizemli adam, karargâhındaki koltuğuna oturur. Yanındaki yardımcısına döner.', { set:{ lider:{ face:-1 } } }),
    S('Gizemli Adam', 'Issem ve Ufis beklediğimden daha hızlı ilerliyor.', { e:'angry' }), S('Yardımcı', 'Ne yapacağız?'),
    S('Gizemli Adam', 'Onları birbirinden ayıracağız.', { e:'smirk' }),
    N("Kamera yavaşça arkadaki büyük ekrana yaklaşır. Ekranda Ufis'in eski bir fotoğrafı görünmektedir.", { screen:'ufisPhoto', set:{ lider:{ face:1 } } }) ] } },
] },
/* ================= BÖLÜM 4 ================= */
{ title:'Dövüş Ustasının Dönüşü', teaser:['5. Bölüm – Beklenmedik Ortaklık', 'Issem ve Ufis, örgüte karşı mücadele etmek için yeni müttefiklerle tanışacak!'], flow:[
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 600, 1, { e:'sad' }) ], lines:[
    CARD('Bölüm 4', 'Dövüş Ustasının Dönüşü'), CARD('Sahne 1', 'Eski Defterler'),
    N('Issem ve Ufis, fabrikadan ayrıldıktan sonra güvenli bir yere gider. Ufis oldukça sessizdir.'), N('Issem onun bir şey düşündüğünü fark eder.'),
    S('Issem', 'Bir sorun mu var?'), S('Ufis', 'Evet. Az önce gördüğümüz fotoğraf benim geçmişimle ilgili.', { e:'sad', set:{ ufis:{ face:-1 } } }),
    S('Issem', 'Ne demek istiyorsun?'), S('Ufis', 'Bu örgütün liderini yıllardır tanıyorum. Geçmişimde onunla yarım kalan bir hesabım var.', { e:'angry' }),
    N('Issem şaşırır.', { set:{ issem:{ e:'shock' } } }), S('Issem', 'Peki neden daha önce söylemedin?', { e:'shock' }),
    S('Ufis', 'Çünkü bu hikâyenin nasıl biteceğini bilmiyorum.', { e:'sad' }) ] } },
  { cut:{ bg:'dojo', sepia:true, actors:[ A('genc', 'ufisGenc', 430, 1, { pose:'guard' }), A('usta', 'usta', 620, -1, { pose:'arms' }) ], lines:[
    CARD('Sahne 2', 'Geçmişin Sırrı'), N('Ufis, yıllar önce yaşananları anlatmaya başlar…'),
    N('Gençlik döneminde dövüş sanatları eğitimi almıştır. Ustasıyla birlikte büyük bir dövüş okulunda yaşamaktadır.'),
    N('Ancak bir gün okul, gizemli bir grup tarafından basılır!', { fx:['door', 'shake'], set:{ genc:{ face:-1 } } }) ] } },
  { lvl:'gecmis' },
  { cut:{ bg:'dojo', sepia:true, door:true, actors:[ A('genc', 'ufisGenc', 480, -1, { pose:'kneel', e:'pain' }), A('usta', 'usta', 640, -1, { pose:'guard' }), A('lider', 'lider', 150, 1, { pose:'stand' }), A('k1', 'masked', 260, 1), A('k2', 'masked', 760, -1) ], lines:[
    N('Grubun başında bugün Issem ve Ufis\'in peşinde olduğu adam vardır.', { e:'smirk' }),
    N("Ufis'in ustası, okulu korumaya çalışırken örgüt tarafından kaçırılır.", { set:{ usta:{ tx:150, speed:120 }, k2:{ tx:220 } } }),
    N('O günden sonra Ufis, ustasını bulmak için yıllarca araştırma yapmıştır.', { hide:['usta', 'lider', 'k1', 'k2'], set:{ genc:{ e:'sad' } } }) ] } },
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 580, -1) ], lines:[
    S('Issem', 'Yani bu örgütün peşinde olmanın sebebi ustanı bulmak mı?'), S('Ufis', 'Evet. Onu bulmadan bu iş bitmeyecek.', { e:'angry' }),
    CARD('Sahne 3', 'Yeni Bir İz'), N("Ufis'in telefonuna bilinmeyen bir numaradan mesaj gelir. Mesajda bir fotoğraf ve adres bulunmaktadır.", { sfx:'msg', set:{ ufis:{ pose:'phone' } } }),
    { msg:'Onu görmek istiyorsan eski dövüş okuluna gel.', photo:'usta' },
    N("Fotoğrafta Ufis'in yıllardır aradığı ustası görünmektedir."), S('Ufis', 'Bu imkânsız...', { e:'shock' }), S('Issem', 'Ne oldu?'),
    S('Ufis', 'Ustam hâlâ hayatta!', { e:'shock', set:{ ufis:{ pose:null } } }) ] } },
  { cut:{ bg:'eskiOkul', actors:[ A('issem', 'issem', 520, 1), A('ufis', 'ufis', 400, 1), A('yard', 'yardimci', -60, 1, { hidden:true }) ], lines:[
    CARD('Sahne 4', 'Eski Dövüş Okulu'), N('Issem ve Ufis, eski dövüş okuluna ulaşır. Bina yıllardır kullanılmamaktadır.'),
    N('İçeri girdiklerinde duvarlarda eski fotoğraflar ve dövüş madalyaları görürler.'),
    N('Bir anda arkalarından alkış sesi gelir.', { sfx:'clap', show:['yard'], set:{ yard:{ tx:180 } } }),
    S('Yardımcı', 'Sonunda geldin, Ufis.', { e:'smirk' }),
    N('Ufis arkasını döner. Karşısında örgütün liderinin yardımcısı durmaktadır.', { set:{ ufis:{ face:-1 }, issem:{ face:-1 } } }),
    S('Ufis', 'Ustam nerede?', { e:'angry' }), S('Yardımcı', 'Onu bulmak istiyorsan önce beni geçmelisin.', { e:'smirk' }),
    N('Ufis dövüş pozisyonunu alır. Issem ise etrafı kontrol eder.', { set:{ ufis:{ pose:'guard' } } }) ] } },
  { lvl:'bossYardimci' },
  { cut:{ bg:'eskiOkul', actors:[ A('issem', 'issem', 560, -1), A('ufis', 'ufis', 400, -1), A('yard', 'yardimci', 220, 1, { pose:'kneel', e:'pain' }) ], lines:[
    CARD('Sahne 5', 'Büyük Sürpriz'), N('Yaşanan mücadelenin ardından yardımcı kaçar.', { set:{ yard:{ pose:null, tx:-80, speed:300 } } }),
    N('Kaçarken arkasında küçük bir kart bırakır. Issem kartı yerden alır.'),
    { item:'card', t:'Büyük turnuvada görüşeceğiz.', n:'Kartta bir konum ve şu cümle yazmaktadır:' },
    S('Issem', 'Sanırım artık onların oyununa katılmamız gerekiyor.'), S('Ufis', 'Evet. Ama bu kez hazırlıklı olacağız.', { e:'angry' }) ] } },
  { cut:{ bg:'liderOda', screen:'off', actors:[ A('lider', 'lider', 300, 1, { pose:'stand' }), A('m1', 'masked', 120, 1), A('m2', 'masked', 820, -1) ], lines:[
    CARD('Bölüm Sonu'), N('Örgütün karargâhında lider, ekibine emir verir.'),
    S('Lider', "Turnuva hazırlıklarını tamamlayın. Issem'i ve Ufis'i orada bekliyorum.", { e:'smirk' }),
    N('Kamera, büyük bir futbol stadyumuna doğru yaklaşır. Stadyumun üzerinde dev bir pankart vardır:', { screen:'stadium' }),
    { big:'DÜNYA ŞAMPİYONLAR TURNUVASI', size:46 } ] } },
] },
/* ================= BÖLÜM 5 ================= */
{ title:'Beklenmedik Ortaklık', teaser:['6. Bölüm – Çetenin İzinde', 'Issem ve Ufis, örgütün gerçek karargâhını keşfedecek.'], flow:[
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 580, -1) ], lines:[
    CARD('Bölüm 5', 'Beklenmedik Ortaklık'), CARD('Sahne 1', 'Yeni Bir Plan'),
    N('Issem ve Ufis, örgütün düzenleyeceği büyük turnuvayı araştırmaktadır. Issem, turnuvaya katılan takımların listesini inceler.'),
    S('Issem', 'Burada dünyanın en iyi takımları var. Anolecrab da listede.'),
    S('Ufis', 'Bu turnuva normal bir futbol organizasyonu değil. Örgüt herkesi tek bir yerde toplamak istiyor.'),
    S('Issem', 'Peki neden?'), S('Ufis', 'Bunu öğrenmek için turnuvaya katılmalıyız.') ] } },
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 700, -1), A('issem', 'issem', -60, 1, { tx:330 }), A('ufis', 'ufis', -160, 1, { tx:200 }) ], lines:[
    CARD('Sahne 2', 'Eski Dost'), N("Issem ve Ufis, yardım isteyebilecekleri eski bir dostu ziyaret eder. Dostlarının adı Leo'dur."),
    N('Kendisi eski bir futbolcu ve başarılı bir antrenördür.'), S('Leo', 'Sizi burada görmek şaşırtıcı. Ne oldu?', { e:'happy' }),
    N('Issem yaşananları anlatır.'), S('Leo', 'Demek futbolcuları kaçıran örgüt hâlâ faaliyet gösteriyor.', { e:'angry' }),
    S('Ufis', 'Onları durdurmamız gerekiyor.'), S('Leo', 'O zaman ben de sizinle geliyorum.', { e:'happy' }) ] } },
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 640, -1), A('issem', 'issem', 330, 1), A('ufis', 'ufis', 200, 1) ], lines:[
    CARD('Sahne 3', 'Takım Kuruluyor'), N('Üçlü, örgüte karşı mücadele etmek için bir plan hazırlar.', { roster:true }),
    S('Issem', 'Artık tek başımıza değiliz.', { e:'happy' }), S('Ufis', 'Ama dikkatli olmalıyız. Düşmanımız bizi izliyor.'),
    S('Leo', 'Turnuvadan önce seni sahada bir deneyeyim, Issem. Bakalım çalımların hâlâ keskin mi!', { e:'happy' }) ] } },
  { match:{ need:2, training:true, defs:[900, 1450, 1950], teams:['ANL', 'LEO'], obj:"Leo'nun antrenmanı: savunmayı geç, 2 gol at",
    hint:'Kırmızı yanan rakip kayacak: ⤒ zıpla ya da 💨 çalımla! Ceza sahasında ⚽ ile nişan al.' } },
  { cut:{ bg:'leo', actors:[ A('leo', 'leo', 620, -1), A('issem', 'issem', 330, 1), A('ufis', 'ufis', 200, 1) ], lines:[
    CARD('Sahne 4', 'Turnuva Daveti'), N("Leo'nun bilgisayarına bir e-posta gelir. E-postada turnuvanın resmî davetiyesi bulunmaktadır.", { item:'invite', sfx:'msg' }),
    N('Turnuva üç gün sonra başlayacaktır.', { item:'invite' }), S('Leo', 'İşte fırsatımız!', { e:'happy' }), S('Issem', 'Turnuvaya katılacağız.'),
    S('Ufis', 'Ben de sizinle geleceğim.'), N('Tam o sırada bilgisayar ekranında yeni bir mesaj belirir:'),
    { msg:'Sizi bekliyoruz. Bu turnuvadan kimse eskisi gibi ayrılmayacak.', red:true, from:'💻  Bilinmeyen gönderici' } ] } },
  { cut:{ bg:'sehir', car:300, actors:[ A('yard', 'yardimci', 470, 1, { hidden:true }) ], lines:[
    CARD('Sahne 5', 'Gizli Misafir'), N('Üçlü hazırlıklarını sürdürürken binanın dışında siyah bir araç durur.'),
    N('Araçtan örgütün yardımcısı iner. Telefonunu çıkarır.', { show:['yard'], set:{ yard:{ pose:'phone' } } }),
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
  { cut:{ bg:'fabrikaDis', actors:[ A('issem', 'issem', 260, 1), A('ufis', 'ufis', 150, 1), A('leo', 'leo', 370, 1) ], lines:[
    CARD('Sahne 2', 'Gizli Karargâh'), N('Leo, şirketin kullandığı gizli bir iletişim adresini tespit eder. Adres, şehrin dışında bulunan büyük bir binaya aittir.'),
    N('Üçlü binaya ulaştığında çevrede güvenlik görevlileri olduğunu fark eder.'), S('Issem', 'Burası gerçekten büyük bir yer.'),
    S('Ufis', 'Dikkatli olmalıyız. Burada önemli bilgiler olabilir.') ] } },
  { lvl:'karargahGiris' },
  { cut:{ bg:'karargah', screen:'players', actors:[ A('issem', 'issem', 300, 1), A('ufis', 'ufis', 180, 1), A('leo', 'leo', 680, -1) ], lines:[
    N('İçeri girdiklerinde duvarda dev bir ekran görürler. Ekranda kaçırılan futbolcuların fotoğrafları bulunmaktadır.', { set:{ issem:{ e:'shock' } } }),
    CARD('Sahne 3', 'Şok Edici Gerçek'), N('Leo bilgisayardaki dosyaları inceler. Bir anda önemli bir belge bulur.'),
    S('Leo', 'Issem! Buraya bak!', { e:'shock' }), S('Issem', 'Ne oldu?'), S('Leo', 'Örgütün amacı sadece futbolcuları kaçırmak değilmiş.'),
    N('Belgelerde, dünya futbolunun en büyük kulüplerini kontrol etmek için hazırlanan bir plan vardır.', { item:'file' }),
    N('Örgüt, futbol kulüplerinin yönetimlerini ele geçirerek bütün futbol organizasyonlarını kontrol etmek istemektedir.'),
    S('Issem', 'Buna izin vermeyeceğiz!', { e:'angry' }) ] } },
  { cut:{ bg:'karargah', screen:'off', actors:[ A('ufis', 'ufis', 480, 1), A('issem', 'issem', -60, 1, { hidden:true }) ], lines:[
    CARD('Sahne 4', "Ufis'in Ustası"), N('Ufis başka bir odada araştırma yaparken eski ustasının fotoğrafını bulur.', { item:'photoUsta', t:'Ustan hâlâ bizim kontrolümüzde. Turnuvada onu görebilirsin.' }),
    N('Fotoğrafın arkasında bir not vardır.', { item:'photoUsta', t:'Ustan hâlâ bizim kontrolümüzde. Turnuvada onu görebilirsin.' }),
    N('Ufis öfkelenir.', { set:{ ufis:{ e:'angry', pose:'guard' } } }), S('Ufis', 'Yıllardır onu arıyorum. Artık bu iş bitecek!', { e:'angry' }),
    N('Issem yanına gelir.', { show:['issem'], set:{ issem:{ tx:330 } } }), S('Issem', 'Onu birlikte kurtaracağız.') ] } },
  { cut:{ bg:'karargah', alarm:false, actors:[ A('issem', 'issem', 330, 1), A('ufis', 'ufis', 470, -1), A('leo', 'leo', 200, 1), A('guard', 'guard', 1020, -1, { hidden:true }) ], lines:[
    CARD('Sahne 5', 'Yakalanma Tehlikesi'), N('Tam binadan ayrılacakları sırada alarm çalmaya başlar!', { fx:'alarm' }),
    S('Güvenlik Görevlisi', 'Güvenlik ihlali! Binada yabancılar var!', { e:'angry', show:['guard'], set:{ guard:{ tx:780 } } }) ] } },
  { lvl:'karargahKacis' },
  { cut:{ bg:'sehir', actors:[ A('issem', 'issem', 420, 1), A('ufis', 'ufis', 300, 1), A('leo', 'leo', 560, -1) ], lines:[
    N('Ufis, Issem ve Leo binadan çıkmayı başarır.'), N('Ancak ayrılmadan önce Leo önemli bir belgeyi yanında götürür. Belgede turnuvanın gerçek amacını açıklayan bilgiler vardır.', { item:'file' }) ] } },
  { cut:{ bg:'liderOda', screen:'watch', actors:[ A('lider', 'lider', 300, 1, { pose:'sit' }), A('yard', 'yardimci', 150, 1) ], lines:[
    CARD('Bölüm Sonu'), N('Örgütün lideri güvenlik kameralarını izlemektedir.'), S('Yardımcı', 'Belgelerden birini almışlar.'),
    S('Lider', 'Sorun değil. Zaten onları turnuvada bekliyoruz.', { e:'smirk' }),
    N("Lider ayağa kalkar ve arkasındaki büyük ekrana bakar. Ekranda Ufis'in ustasının görüntüsü belirir.", { screen:'usta', set:{ lider:{ pose:'stand' } } }),
    S('Lider', 'Artık son hazırlıklara başlayabiliriz.', { e:'smirk' }) ] } },
] },
/* ================= BÖLÜM 7 ================= */
{ title:'Büyük Hesaplaşma', teaser:['8. Bölüm – Turnuvaya Giriş', 'Issem futbol sahasına çıkacak. Ufis ise stadyumun altındaki gizli bölüme ulaşmaya çalışacak.'], flow:[
  { cut:{ bg:'safe', actors:[ A('issem', 'issem', 330, 1), A('ufis', 'ufis', 560, -1), A('leo', 'leo', 200, 1) ], lines:[
    CARD('Bölüm 7', 'Büyük Hesaplaşma'), CARD('Sahne 1', 'Tehlikeli Karşılaşma'),
    N('Issem, Ufis ve Leo, örgütün karargâhından aldıkları belgeleri inceler. Belgelerde örgütün en güçlü dövüşçüsünün fotoğrafı vardır.', { item:'narak' }),
    N('Narak, yıllardır örgütün lideri için çalışan ve karşısına çıkan herkesi yenebilen bir dövüş ustasıdır.', { item:'narak' }),
    S('Ufis', 'Bu adamı tanıyorum. Çok tehlikeli biri.', { e:'angry' }), S('Issem', 'Onunla daha önce karşılaştın mı?'),
    S('Ufis', 'Evet. Geçmişimde onunla yarım kalan bir mücadelem var.', { e:'sad' }) ] } },
  { cut:{ bg:'salon', actors:[ A('issem', 'issem', -60, 1, { tx:200 }), A('ufis', 'ufis', -160, 1, { tx:340 }), A('leo', 'leo', -260, 1, { tx:90 }), A('narak', 'narak', 780, -1, { hidden:true, pose:'arms' }) ], lines:[
    CARD('Sahne 2', 'Narak Ortaya Çıkıyor'), N('Gece vakti üçlü, karargâhtan aldıkları yeni bir adresi takip eder. Terk edilmiş bir spor salonuna ulaşırlar.'),
    N('Kapı açılır. İçeride Narak beklemektedir.', { sfx:'door', show:['narak'] }), S('Narak', 'Sonunda geldiniz.', { e:'smirk' }),
    S('Ufis', 'Bu kez kaçmana izin vermeyeceğim.', { e:'angry', set:{ ufis:{ pose:'guard' } } }), S('Narak', 'Önce beni yenmen gerekiyor!', { e:'angry' }),
    N('Narak dövüş pozisyonunu alır.', { set:{ narak:{ pose:'guard' } } }),
    CARD('Sahne 3', 'Büyük Dövüş'), N('Ufis ve Narak arasında zorlu bir mücadele başlar. Narak oldukça hızlıdır.') ] } },
  { lvl:'bossNarak' },
  { cut:{ bg:'salon', actors:[ A('issem', 'issem', 200, 1), A('ufis', 'ufis', 420, 1), A('leo', 'leo', 90, 1), A('narak', 'narak', 640, -1, { pose:'kneel', e:'pain' }) ], lines:[
    N("Ufis bir süre sonra Narak'ın hareketlerini çözmeye başlar. Mücadelenin sonunda Narak yenilir."),
    S('Narak', 'Beni yenmiş olabilirsin ama liderimizi asla durduramazsın!', { e:'pain' }),
    CARD('Sahne 4', 'Büyük Sır'), N("Issem, Narak'ın yanındaki masada bir dosya bulur. Dosyanın üzerinde Ufis'in ustasının adı yazmaktadır.", { hide:['narak'], item:'file' }),
    N('Ufis dosyayı açar. İçerisinde ustasının tutulduğu yerin bilgileri vardır.'), S('Ufis', 'Sonunda onu buldum!', { e:'happy' }), S('Issem', 'Peki nerede?'),
    S('Ufis', 'Turnuvanın düzenleneceği stadyumun altında gizli bir bölüm var.'), S('Leo', 'Demek ki turnuva boyunca ustanı orada tutacaklar!', { e:'shock' }),
    CARD('Sahne 5', 'Son Hazırlıklar'), N("Üçlü, turnuva başlamadan önce ustayı kurtarmaya karar verir. Ancak Issem'in telefonuna yeni bir mesaj gelir.", { sfx:'msg' }),
    { msg:'Büyük gün geldi. Stadyumda görüşürüz.' }, N('Issem telefonu kapatır.'), S('Issem', 'Bu işi bitiriyoruz.', { e:'angry' }),
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
    N("Dünya Şampiyonlar Turnuvası'nın başlamasına saatler kalmıştır. Stadyum binlerce taraftarla dolmuştur.", { sfx:'crowd' }),
    N('Dünyanın farklı ülkelerinden takımlar turnuvaya katılmak için gelmiştir.'), N('Issem, Anolecrab formasıyla soyunma odasında hazırlanmaktadır.'),
    N('Leo yanına gelir.', { show:['leo'], set:{ leo:{ tx:240 }, issem:{ face:-1 } } }), S('Leo', 'Hazır mısın?'), S('Issem', 'Her zamankinden daha hazırım.', { e:'happy' }),
    S('Leo', 'Unutma, bugün sadece futbol oynamıyoruz. Arkadaşlarımızı da kurtaracağız.'), S('Issem', 'Bunu başaracağız.', { e:'angry' }) ] } },
  { cut:{ bg:'stadArka', actors:[ A('ufis', 'ufis', 300, 1), A('guard', 'guard', 640, -1) ], lines:[
    CARD('Sahne 2', "Ufis'in Görevi"), N('Bu sırada Ufis, stadyumun arka tarafına ulaşır. Amacı, stadyumun altındaki gizli bölümü bulmak ve ustasını kurtarmaktır.'),
    N('Bir görevli karşısına çıkar.'), S('Görevli', 'Burada ne arıyorsun?'), S('Ufis', 'Sadece yanlış yerde bulunan birini arıyorum.'),
    N('Görevli şüphelenir.'), S('Görevli', 'Buradan geçemezsin!', { e:'angry' }), N('Ufis, görevliyi etkisiz hâle getirerek yoluna devam eder… ama başkaları da var!', { fx:'flash', set:{ guard:{ pose:'lie' } } }) ] } },
  { lvl:'stadArka' },
  { cut:{ bg:'stad', minute:"0'", teams:['ANL', 'DKR'], cheer:true, actors:[ ...MATES_STAD, A('issem', 'issem', 480, 1, { y:485, s:.7 }) ], ball:[520, 478], lines:[
    CARD('Sahne 3', 'İlk Maç'), S('Spiker', "Dünya Şampiyonlar Turnuvası'na hoş geldiniz! İlk maç Anolecrab ile Demir Kartallar arasında oynanacak!", { sfx:'crowd' }),
    N('Issem ve takım arkadaşları sahaya çıkar. Maç başlar.', { sfx:'whistle', min:"1'" }) ] } },
  { match:{ need:1, time:65, startMin:0, teams:['ANL', 'DKR'], obj:'İlk maç: Gol at!', defs:[820, 1180, 1520, 1860, 2120] } },
  { cut:{ bg:'stad', minute:"34'", score:'1 - 0', teams:['ANL', 'DKR'], cheer:true, actors:[ A('issem', 'issem', 480, 1, { y:485, s:.7, pose:'cheer', e:'happy' }), ...MATES_STAD.slice(0, 4) ], lines:[
    { big:'GOOOOOOL!', sfx:'goal', fx:'confetti' }, N('Anolecrab 1-0 öne geçer. Taraftarlar büyük bir sevinç yaşar.', { fx:'cheer' }) ] } },
  { cut:{ bg:'gizli', actors:[ A('ufis', 'ufis', 380, 1) ], lines:[
    CARD('Sahne 4', 'Gizli Oda'), N('Ufis sonunda stadyumun altındaki gizli bölümü bulur. Koridorun sonunda kilitli bir oda vardır.', { set:{ ufis:{ tx:560 } } }),
    N('Kapının arkasından bir ses gelir.'), S('Usta', 'Orada kim var?'), N('Ufis sesi tanır.', { set:{ ufis:{ e:'shock' } } }),
    S('Ufis', 'Usta! Benim, Ufis!', { e:'shock' }), S('Usta', 'Ufis? Gerçekten sen misin?', { e:'shock' }), S('Ufis', 'Seni buradan çıkaracağım!', { e:'angry' }),
    N('Tam o sırada alarm çalmaya başlar!', { fx:'alarm' }) ] } },
  { lvl:'gizliOda' },
  { cut:{ bg:'liderOda', screen:'split', actors:[ A('lider', 'lider', 300, 1, { pose:'stand' }), A('yard', 'yardimci', 150, 1) ], lines:[
    CARD('Sahne 5', 'Liderin Oyunu'), N("Örgütün lideri güvenlik odasında iki farklı ekrandan Issem ve Ufis'i izlemektedir."),
    N("Bir ekranda futbol maçı, diğerinde Ufis'in bulunduğu koridor görünür."), S('Yardımcı', 'İkisi de stadyumda.'),
    S('Lider', 'Güzel. Şimdi planın son aşamasını başlatın.', { e:'smirk' }), S('Yardımcı', 'Ya futbolcular?'),
    S('Lider', 'Birazdan bütün stadyum bizim kontrolümüzde olacak.', { e:'smirk' }) ] } },
  { cut:{ bg:'stad', minute:"52'", score:'1 - 0', teams:['ANL', 'DKR'], actors:[ ...MATES_STAD.slice(0, 4), A('issem', 'issem', 480, 1, { y:485, s:.7 }) ], lines:[
    N('Stadyumun ışıkları aniden kapanır!', { fx:'dark' }), N('Taraftarlar korkuyla bağırmaya başlar. Issem sahada etrafına bakar.', { sfx:'crowd' }),
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
    N('Bu sırada Ufis, ustasının tutulduğu odanın kapısını açmayı başarır.', { fx:'door', show:['usta'], set:{ usta:{ tx:680 } } }),
    S('Usta', 'Yıllar sonra yeniden karşılaştık!', { e:'happy' }), S('Ufis', 'Seni buradan çıkaracağız. Ama önce bu örgütü durdurmalıyız.', { e:'happy' }) ] } },
  { cut:{ bg:'stad', bigscreen:'lider', crowdOn:false, actors:[ A('issem', 'issem', 420, 1), A('m1', 'masked', 140, 1), A('m2', 'masked', 860, -1), A('lider', 'lider', 1020, -1, { hidden:true }), A('dov', 'dovuscu', 1100, -1, { hidden:true }) ], lines:[
    CARD('Sahne 2', 'Lider Ortaya Çıkıyor'), N('Issem, stadyumun ortasına gelir. Dev ekranda örgütün lideri belirir.'),
    S('Lider', 'Issem! Sonunda karşı karşıyayız.', { e:'smirk' }), S('Issem', 'Arkadaşlarımı serbest bırak!', { e:'angry' }),
    S('Lider', 'Önce beni yenmen gerekiyor.', { e:'smirk' }),
    N("Lider stadyumun VIP bölümünden aşağı iner. Yanında Narak'ın yerine gönderdiği yeni dövüşçü vardır.", { bigscreen:'off', show:['lider', 'dov'], set:{ lider:{ tx:720 }, dov:{ tx:600 } } }),
    S('Lider', 'Bu gece her şey sona erecek!', { e:'angry' }) ] } },
  { cut:{ bg:'stad', bigscreen:'off', crowdOn:false, actors:[ A('dov', 'dovuscu', 640, -1, { pose:'guard' }), A('ufis', 'ufis', -60, 1, { tx:330 }), A('usta', 'usta', -160, 1, { tx:150 }) ], lines:[
    CARD('Sahne 3', 'Son Mücadele'), N('Ufis, ustasıyla birlikte stadyuma ulaşır. Yeni dövüşçü Ufis\'in karşısına çıkar.'),
    S('Dövüşçü', 'Beni yenebileceğini mi sanıyorsun?', { e:'angry' }), S('Ufis', 'Bunu birazdan göreceğiz.', { e:'angry', set:{ ufis:{ pose:'guard' } } }) ] } },
  { lvl:'bossDovuscu' },
  { cut:{ bg:'stad', bigscreen:'off', crowdOn:false, actors:[ A('dov', 'dovuscu', 660, -1, { pose:'lie' }), A('ufis', 'ufis', 420, 1), A('usta', 'usta', 200, 1) ], lines:[
    N('Ufis, rakibinin hareketlerini dikkatle takip eder ve sonunda onu yenmeyi başarır.', { set:{ ufis:{ pose:'bow' } } }),
    N('Bu sırada Issem, örgütün liderinin peşine düşer.') ] } },
  { cut:{ bg:'stad', bigscreen:'off', crowdOn:false, actors:[ A('issem', 'issem', 360, 1, { pose:'guard' }), A('lider', 'lider', 620, -1), A('ufis', 'ufis', -60, 1, { hidden:true }) ], lines:[
    CARD('Sahne 4', 'Issem ve Lider'), N('Issem ile lider stadyumun ortasında karşı karşıya gelir.'),
    S('Lider', 'Sen sadece bir futbolcusun. Bu mücadeleyi kazanamazsın.', { e:'smirk' }),
    S('Issem', 'Futbolcu olabilirim ama arkadaşlarımı asla yarı yolda bırakmam!', { e:'angry' }),
    N("Lider, Issem'e doğru ilerler.", { set:{ lider:{ tx:520 } } }), N('Tam o sırada Ufis yetişir!', { show:['ufis'], set:{ ufis:{ tx:240, speed:380 } } }),
    S('Ufis', 'Bu iş burada bitiyor!', { e:'angry' }) ] } },
  { lvl:'bossLider' },
  { cut:{ bg:'stad', crowdOn:false, actors:[ A('issem', 'issem', 360, 1), A('ufis', 'ufis', 260, 1), A('lider', 'lider', 600, -1, { pose:'kneel', e:'pain' }), A('g1', 'guard', 760, -1), A('g2', 'guard', 840, -1) ], lines:[
    N('İkili birlikte lideri köşeye sıkıştırır. Liderin adamları da güvenlik güçleri tarafından yakalanır.') ] } },
  { cut:{ bg:'stad', minute:'', cheer:true, actors:[ ...MATES_STAD.slice(0, 4), A('issem', 'issem', 480, 1, { y:485, s:.7, pose:'cheer', e:'happy' }), A('ufis', 'ufis', 250, 1, { y:480 }), A('usta', 'usta', 140, 1, { y:480 }) ], lines:[
    CARD('Sahne 5', 'Büyük Kurtuluş'), N('Örgütün karargâhı ele geçirilir. Kaçırılan futbolcular serbest bırakılır.', { fx:'cheer' }),
    N('Ufis, yıllardır aradığı ustasına kavuşur.', { set:{ ufis:{ face:-1 }, usta:{ face:1, e:'happy' } } }), S('Usta', 'Seninle gurur duyuyorum.', { e:'happy' }),
    S('Ufis', 'Bunca yıl seni aradım. Sonunda başardık.', { e:'happy' }), N('Issem de takım arkadaşlarıyla yeniden buluşur.'),
    S('Issem', 'Artık futbolumuza geri dönebiliriz!', { e:'happy' }),
    CARD('Bölüm Sonu'), N('Stadyumda taraftarlar yeniden toplanır. Spiker mikrofonu eline alır.'),
    S('Spiker', 'Yaşanan olayların ardından turnuva kaldığı yerden devam edecek! Anolecrab finale çıkmaya hak kazandı!', { fx:'confetti', sfx:'crowd' }),
    N('Issem sahaya çıkar. Ufis ve ustası tribünden onu izlemektedir.') ] } },
  { cut:{ bg:'sehir', actors:[ A('golge', 'golge', 520, -1, { pose:'stand' }) ], lines:[
    N('Ancak uzakta, yüksek bir binanın penceresinde başka biri onları takip etmektedir.'),
    N('Bu kişi telefonunu çıkarır.', { set:{ golge:{ pose:'phone' } } }), S('Gizemli Kişi', 'İlk plan başarısız oldu. Ama henüz bitmedi.'),
    N('Telefonunu kapatır.', { set:{ golge:{ pose:'stand' } } }) ] } },
] },
/* ================= BÖLÜM 10 ================= */
{ title:'Son Şampiyon', teaser:null, flow:[
  { cut:{ bg:'soyunma', actors:[ A('issem', 'issem', 480, -1), A('t1', 'mate', 300, 1), A('t2', 'mate2', 180, 1), A('t3', 'mate', 680, -1) ], lines:[
    CARD('Bölüm 10', 'Son Şampiyon'), CARD('FİNAL BÖLÜMÜ'), CARD('Sahne 1', 'Final Heyecanı'),
    N('Örgütün planı bozulmuş, kaçırılan futbolcular kurtarılmıştır. Ancak turnuva henüz bitmemiştir.'),
    N('Anolecrab, final maçına çıkmak üzeredir. Issem soyunma odasında takım arkadaşlarıyla konuşur.'),
    S('Issem', 'Arkadaşlar, çok şey yaşadık. Ama bugün buraya futbol oynamak için geldik. Bu kupayı kazanacağız!', { e:'angry' }),
    S('Takım Arkadaşı', 'Seninle aynı sahada olmak büyük bir şans. Hadi kupayı alalım!', { e:'happy' }), N('Takım sahaya çıkar.'),
    S('Spiker', 'İşte beklenen an! Dünya Şampiyonlar Turnuvası finali başlıyor!', { sfx:'crowd' }) ] } },
  { cut:{ bg:'stad', minute:"0'", teams:['ANL', 'KŞM'], score:'0 - 0', actors:[ ...MATES_STAD, A('issem', 'issem', 480, 1, { y:485, s:.7 }) ], ball:[520, 478], lines:[
    CARD('Sahne 2', 'Büyük Final'), N('Maç başlar. Rakip takım Kızıl Şimşekler oldukça güçlüdür. Anolecrab ilk yarıda istediği oyunu sergileyemez.', { sfx:'whistle', min:"12'" }),
    N("Dakikalar 40'ı gösterirken rakip takım gol atar.", { min:"40'", score:'0 - 1', sfx:'hurt', fx:'shake' }),
    S('Issem', 'Pes etmek yok! Daha bitmedi!', { e:'angry' }), N('İkinci yarı başlar.', { sfx:'whistle', min:"46'" }) ] } },
  { match:{ need:2, time:95, startMin:46, score:[0, 1], teams:['ANL', 'KŞM'], obj:'FİNAL: 2 gol at, maçı çevir!', defs:[760, 1060, 1360, 1660, 1960, 2160],
    hint:'0-1 gerideyiz! Süre bitmeden 2 gol lazım. Çalımla geç, ceza sahasında ⚽!' } },
  { cut:{ bg:'stad', minute:"90'", teams:['ANL', 'KŞM'], score:'2 - 1', cheer:true, actors:[ ...MATES_STAD, A('issem', 'issem', 480, 1, { y:485, s:.7, pose:'cheer', e:'happy' }) ], lines:[
    CARD('Sahne 3', 'Son Dakikalar'), { big:'GOOOOOOOOOOL!', sfx:'goal' }, N('Anolecrab 2-1 öne geçer!', { fx:'cheer' }),
    N('Hakem son düdüğü çalar.', { sfx:'longWhistle' }), { big:'ANOLECRAB ŞAMPİYON!', size:58, fx:'confetti', sfx:'win' },
    N('Issem ve takım arkadaşları büyük sevinç yaşar.', { set:{ issem:{ trophy:true, pose:'trophy' } } }) ] } },
  { cut:{ bg:'stad', cheer:true, minute:'BİTTİ', teams:['ANL', 'KŞM'], score:'2 - 1', actors:[ A('issem', 'issem', 560, -1, { trophy:true, pose:'trophy', e:'happy' }), A('ufis', 'ufis', 380, 1), A('usta', 'usta', 250, 1) ], lines:[
    CARD('Sahne 4', 'Son Buluşma'), N('Maçtan sonra Issem, Ufis ve ustasıyla buluşur.', { set:{ issem:{ pose:null, trophy:false } } }),
    S('Issem', 'Her şey için teşekkür ederim. Sen olmasaydın bunların hiçbirini başaramazdık.', { e:'happy' }),
    S('Ufis', 'Sen de benim için çok şey yaptın. Sonunda ustamı buldum.', { e:'happy' }), S('Usta', 'Artık herkes kendi yoluna devam edebilir.', { e:'happy' }),
    S('Issem', 'Belki bir gün tekrar karşılaşırız.', { e:'happy' }), N('Üçü birbirleriyle vedalaşır.', { set:{ ufis:{ pose:'bow' }, usta:{ pose:'bow' } } }) ] } },
  { cut:{ bg:'sehir', car:260, actors:[ A('golge', 'golge', 420, 1, { hidden:true }) ], lines:[
    CARD('Sahne 5', 'Gizemli Kişi'), N('Gece vakti… Şehrin başka bir yerinde siyah bir araç durur.'),
    N('Araçtan takım elbiseli gizemli bir kişi iner.', { show:['golge'], set:{ golge:{ tx:760 } } }) ] } },
  { cut:{ bg:'liderOda', screen:'watch', actors:[ A('golge', 'golge', 300, 1, { pose:'stand' }), A('yard', 'yardimci', 140, 1) ], lines:[
    N("Bir binaya girer ve karanlık bir odaya geçer. Masasının üzerinde Issem ve Ufis'in fotoğrafları bulunmaktadır."),
    S('Yardımcı', 'Efendim, ilk planımız başarısız oldu.'), S('Gizemli Kişi', 'Biliyorum.'), S('Yardımcı', 'Şimdi ne yapacağız?'),
    N('Gizemli kişi ayağa kalkar ve pencereye yaklaşır.', { set:{ golge:{ tx:480 } } }),
    S('Gizemli Kişi', 'Issem ve Ufis kazandıklarını düşünüyorlar. Ama asıl mücadele şimdi başlayacak.'),
    N('Telefonunu çıkarır.', { set:{ golge:{ pose:'phone' } } }), S('Gizemli Kişi', 'İkinci aşamayı başlatın.'),
    N('Kamera yavaşça masadaki gizemli dosyaya yaklaşır. Dosyanın üzerinde şu yazmaktadır:', { screen:'off' }),
    { big:'PROJE: YENİ DÜNYA', col:'#ff3030', size:64, sfx:'boss' }, CARD('SON', 'İlk Film Tamamlandı!') ] } },
] },
];
