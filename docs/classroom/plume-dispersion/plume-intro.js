/* CCRL Classroom — plume simulator intro: the Great Smog of London, December 1952.
 * Four storybook pages over real photographs (Wikimedia Commons, credits on screen and in media/CREDITS.txt):
 * London in fog, smoke trapped under an inversion, Tower Bridge in fog, then clean plumes on a clear day. */
(function () {
  'use strict';
  var T = window.PL.T;
  var PAGES = [
    { kicker: T('1952년 12월 5일 · 런던', '5 December 1952 · London'), title: T('안개가 내려앉은 도시', 'A city under fog'),
      text: T('차갑고 바람 한 점 없는 겨울이었습니다. 집집마다 석탄 난로를 피웠고, 발전소와 공장 굴뚝에서도 연기가 쉬지 않고 솟아올랐습니다.',
        'It was a cold winter with no wind at all. Every house burned coal on its fires, and power stations and factories kept their chimneys smoking day and night.'), smog: 0.28, lid: 0, clear: 0 },
    { kicker: T('보이지 않는 뚜껑', 'An invisible lid'), title: T('연기가 갇히다', 'The smoke is trapped'),
      text: T('차가운 지면 공기 위를 따뜻한 공기층, 곧 역전층이 뚜껑처럼 덮었습니다. 위로 흩어지지 못한 연기는 안개와 뒤섞여 누런 스모그가 되었고, 몇 m 앞도 보이지 않을 만큼 도시를 뒤덮었습니다.',
        'A layer of warm air settled over the cold air at the ground like a lid: a temperature inversion. Unable to rise and spread, the smoke mixed with the fog into a yellow smog so thick that people could not see a few metres ahead.'), smog: 0.6, lid: 1, clear: 0,
      photo: { src: 'media/smog-nelson-1952.jpg', alt: T('짙은 스모그 속에 희미하게 보이는 트래펄가 광장의 넬슨 기념탑과 가스등', "Nelson's Column and a gas lamp in Trafalgar Square, faint in thick smog"),
        cap: T('1952년 12월, 스모그에 잠긴 트래펄가 광장의 넬슨 기념탑. 사진 N T Stobbs (Geograph), <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener">CC BY-SA 2.0</a>', 'Nelson’s Column in Trafalgar Square during the smog, December 1952. Photo: N T Stobbs (Geograph), <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener">CC BY-SA 2.0</a>') } },
    { kicker: T('12월 9일, 바람이 불어오기까지', 'Until the wind returned on 9 December'), title: T('런던 대스모그', 'The Great Smog of London'),
      text: T('당시 약 4,000명, 이후 연구에서는 1만 명이 넘는 사람이 이 스모그로 목숨을 잃은 것으로 추정됩니다. 이 사건은 1956년 영국 대기청정법(Clean Air Act)이 만들어지는 계기가 되었습니다.',
        'About 4,000 deaths were counted at the time; later studies put the toll at more than 10,000. The disaster led to the UK Clean Air Act of 1956.'), smog: 0.82, lid: 1, clear: 0,
      photo: { src: 'media/smog-mortality-1952.jpg', alt: T('1952년 12월 스모그 기간에 런던의 주간 사망자 수가 평소 약 2,000명에서 4,700명 가까이 치솟은 그래프', 'Chart: weekly deaths in London jumped from about 2,000 to nearly 4,700 during the December 1952 smog'),
        cap: T('런던의 주간 사망자 수(실선 1952/53년, 점선 전년). 스모그 직후 약 4,000명, 이후 몇 달 동안 약 8,000명이 더 늘었습니다. 영국 대기오염위원회 중간 보고서(1953), 퍼블릭 도메인',
          'Weekly deaths in Greater London (solid 1952/53, dashed the year before): about 4,000 extra deaths right after the smog and about 8,000 more over the following months. Committee on Air Pollution, Interim Report (1953), public domain'), wide: true } },
    { kicker: 'CCRL Classroom', title: T('굴뚝 연기와 대기 안정도', 'Stack plumes and atmospheric stability'),
      text: T('같은 굴뚝이라도 대기의 상태에 따라 연기는 하늘로 흩어지기도, 사람들 곁으로 내려오기도 합니다. 기온의 연직 분포를 바꿔 가며 그 차이를 직접 확인해 보세요.',
        'From the same chimney, smoke can scatter into the sky or come down among people, depending on the state of the atmosphere. Change the temperature profile and see the difference for yourself.'), smog: 0.12, lid: 0, clear: 1, last: true }
  ];
  // shown on every new visit; not repeated within the same tab session (reloads, language switch)
  var KEY = 'ccrl-plume-intro-seen';
  var box = document.getElementById('intro'), cv = document.getElementById('introCanvas'), ctx = cv.getContext('2d');
  var elK = document.getElementById('introKicker'), elT = document.getElementById('introTitle'), elX = document.getElementById('introText');
  var dots = document.getElementById('introDots'), next = document.getElementById('introNext'), skip = document.getElementById('introSkip');
  var page = 0, running = false, last = 0, t = 0, W = 0, H = 0, dpr = 1;
  var cur = { smog: 0.2, lid: 0, clear: 0 }, grain = null, gOff = null;
  // one real photograph per page (Wikimedia Commons), slow push-in, crossfade on page change
  var PH = [
    { src: 'media/london-victoria-fog.jpg', fx: 0.5, fy: 0.42, tint: 1,
      s: 'Willem van de Poll · CC0', cr: T('안개 낀 런던 빅토리아 거리(연도 미상) · Willem van de Poll / Nationaal Archief · CC0', 'Fog in Victoria, London (undated) · Willem van de Poll / Nationaal Archief · CC0') },
    { src: 'media/lochcarron-inversion.jpg', fx: 0.56, fy: 0.5, tint: 0, lidY: 0.43,
      s: 'JohanTheGhost · CC BY-SA 3.0', cr: T('역전층 아래 갇힌 연기, 스코틀랜드 로카론의 1월 오후 · JohanTheGhost · CC BY-SA 3.0', 'Smoke trapped under an inversion, Lochcarron, Scotland, a January afternoon · JohanTheGhost · CC BY-SA 3.0') },
    { src: 'media/tower-bridge-fog.jpg', fx: 0.36, fy: 0.36, tint: 1,
      s: 'Willem van de Poll · CC0', cr: T('안개에 잠긴 런던 타워브리지(연도 미상) · Willem van de Poll / Nationaal Archief · CC0', 'Tower Bridge in fog, London (undated) · Willem van de Poll / Nationaal Archief · CC0') },
    { src: 'media/tomakomai-plume.jpg', fx: 0.42, fy: 0.55, tint: 0,
      s: 'ejstanz · CC BY 2.0', cr: T('맑은 날 굴뚝 연기, 일본 도마코마이 제지공장 · ejstanz · CC BY 2.0', 'Chimney plumes on a clear day, Tomakomai paper mill, Japan · ejstanz · CC BY 2.0') }
  ];
  PH.forEach(function (p) { p.img = new Image(); p.img.src = p.src; });
  var iCur = -1, iPrev = -1, iSwitch = 0, cardEl = document.querySelector('.intro-card');

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (!grain) {
      var r = rng(1952), gcv = document.createElement('canvas'); gcv.width = gcv.height = 180;
      var gc = gcv.getContext('2d'), img = gc.createImageData(180, 180);
      for (var gi = 0; gi < img.data.length; gi += 4) { var gv = r() * 255 | 0; img.data[gi] = img.data[gi + 1] = img.data[gi + 2] = gv; img.data[gi + 3] = 16; }
      gc.putImageData(img, 0, 0); grain = gcv;
    }
  }
  // cover-fit with a slow push-in around the focus point; returns the mapping so overlays can follow the photo
  function photo(c, p, age, alpha) {
    var im = p.img; if (!im.complete || !im.naturalWidth) return null;
    var s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * (1.04 + Math.min(age, 20) * 0.006);
    var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    var x = Math.min(0, Math.max(W - dw, W / 2 - p.fx * dw)), y = Math.min(0, Math.max(H - dh, H / 2 - p.fy * dh));
    c.globalAlpha = alpha; c.drawImage(im, x, y, dw, dh); c.globalAlpha = 1;
    return { x: x, y: y, w: dw, h: dh };
  }

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += dt;
    var tg = PAGES[page], kk = 1 - Math.exp(-dt * 1.2);
    cur.smog += (tg.smog - cur.smog) * kk; cur.lid += (tg.lid - cur.lid) * kk; cur.clear += (tg.clear - cur.clear) * kk * 0.8;
    if (page !== iCur) { iPrev = iCur; iCur = page; iSwitch = t; }
    var age = t - iSwitch, k = Math.min(1, age / 0.9);
    var c = ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#17151a'; c.fillRect(0, 0, W, H);
    if (iPrev >= 0 && k < 1) photo(c, PH[iPrev], age + 6, 1);
    var m = photo(c, PH[iCur], age, iPrev >= 0 ? k : 1), P = PH[iCur];
    // old London prints: warm sepia-yellow smog cast that thickens with the story
    if (P.tint) {
      c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(214,184,128,' + (0.55 + 0.35 * cur.smog) * k + ')'; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      var sg = c.createLinearGradient(0, H * 0.3, 0, H);
      sg.addColorStop(0, 'rgba(150,128,78,0)'); sg.addColorStop(1, 'rgba(120,102,62,' + 0.45 * cur.smog * k + ')');
      c.fillStyle = sg; c.fillRect(0, 0, W, H);
    }
    // inversion lid traced on the real smoke ceiling
    if (P.lidY && m && cur.lid > 0.02) {
      var ly = m.y + P.lidY * m.h, la = cur.lid * Math.min(1, Math.max(0, (age - 0.8) / 0.8));
      var lg = c.createLinearGradient(0, ly - 40, 0, ly);
      lg.addColorStop(0, 'rgba(214,150,96,0)'); lg.addColorStop(1, 'rgba(214,150,96,' + 0.3 * la + ')');
      c.fillStyle = lg; c.fillRect(0, ly - 40, W, 40);
      c.strokeStyle = 'rgba(240,180,115,' + 0.9 * la + ')'; c.setLineDash([8, 6]); c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(0, ly); c.lineTo(W, ly); c.stroke(); c.setLineDash([]);
      c.font = '700 15px "Gowun Batang", Georgia, serif'; c.textAlign = 'left';
      var lw = c.measureText(T('역전층 — 따뜻한 공기의 뚜껑', 'Inversion: a lid of warm air')).width;
      c.fillStyle = 'rgba(28,20,14,' + 0.62 * la + ')'; c.beginPath(); if (c.roundRect) c.roundRect(14, ly - 32, lw + 20, 26, 4); else c.rect(14, ly - 32, lw + 20, 26); c.fill();
      c.fillStyle = 'rgba(255,214,160,' + la + ')'; c.fillText(T('역전층 — 따뜻한 공기의 뚜껑', 'Inversion: a lid of warm air'), 24, ly - 10);
    }
    // keep the card legible: darken the lower left, then grain + vignette
    var dg = c.createLinearGradient(0, H * 0.4, 0, H); dg.addColorStop(0, 'rgba(10,8,6,0)'); dg.addColorStop(1, 'rgba(10,8,6,.45)');
    c.fillStyle = dg; c.fillRect(0, 0, W, H);
    if (!gOff || t - gOff.t > 0.12) gOff = { t: t, x: Math.random() * 180 | 0, y: Math.random() * 180 | 0 };
    c.save(); c.translate(gOff.x, gOff.y); c.fillStyle = c.createPattern(grain, 'repeat'); c.fillRect(-180, -180, W + 360, H + 360); c.restore();
    var vg = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(10,8,6,0)'); vg.addColorStop(1, 'rgba(10,8,6,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // photo credit, bottom right
    var narrow = W < 760, crT = T('사진: ', 'Photo: ') + (narrow ? P.s : P.cr), cy = narrow ? Math.max(8, cardEl.getBoundingClientRect().top - 18) : H - 12;   // phones: short credit just above the card
    c.font = '500 ' + (narrow ? 10 : 11) + 'px "Pretendard Variable", Pretendard, sans-serif'; c.textAlign = 'right'; c.textBaseline = narrow ? 'top' : 'alphabetic';
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillText(crT, W - 13, cy + 1);
    c.fillStyle = 'rgba(255,248,235,.8)'; c.fillText(crT, W - 14, cy); c.textBaseline = 'alphabetic';
    requestAnimationFrame(frame);
  }

  function renderPage(fade) {
    var p = PAGES[page];
    function apply() {
      elK.textContent = p.kicker; elT.textContent = p.title; elX.textContent = p.text;
      next.textContent = p.last ? T('시작하기', 'Start') : T('다음', 'Next');
      skip.hidden = !!p.last;
      var fig = document.getElementById('introPhoto');
      if (p.photo) { var im = document.getElementById('introImg'); im.src = p.photo.src; im.alt = p.photo.alt; document.getElementById('introCap').innerHTML = p.photo.cap; fig.classList.toggle('wide', !!p.photo.wide); fig.hidden = false; }
      else fig.hidden = true;
      [].forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === page); d.setAttribute('aria-current', i === page ? 'step' : 'false'); });
      box.classList.remove('fading');
    }
    if (fade) { box.classList.add('fading'); setTimeout(apply, 260); } else apply();
  }
  function open() {
    box.hidden = false; document.body.classList.add('intro-open');
    page = 0; cur = { smog: 0.15, lid: 0, clear: 0 }; iCur = -1; iPrev = -1;
    resize(); renderPage(false);
    running = true; last = 0; requestAnimationFrame(frame);
    setTimeout(function () { next.focus(); }, 50);
  }
  function close() {
    running = false; box.hidden = true; document.body.classList.remove('intro-open');
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    var rp = document.getElementById('introReplay'); if (rp) rp.focus();
    if (window.__plumeTour) window.__plumeTour.maybeStart();
  }
  PAGES.forEach(function (_, i) {
    var d = document.createElement('button'); d.type = 'button'; d.className = 'intro-dot'; d.setAttribute('aria-label', T((i + 1) + '번째 장면', 'Scene ' + (i + 1)));
    d.addEventListener('click', function () { page = i; renderPage(true); });
    dots.appendChild(d);
  });
  next.addEventListener('click', function () { if (PAGES[page].last) close(); else { page++; renderPage(true); } });
  skip.addEventListener('click', close);
  box.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft' && page > 0) { e.preventDefault(); page--; renderPage(true); }
  });
  window.addEventListener('resize', function () { if (running) resize(); });
  var rp = document.getElementById('introReplay'); if (rp) rp.addEventListener('click', open);

  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  if (/[?&]intro=0/.test(location.search)) seen = true;
  if (/[?&]intro=1/.test(location.search)) seen = false;
  if (!seen) open(); else if (window.__plumeTour && !/[?&]tour=0/.test(location.search)) window.__plumeTour.maybeStart();
  window.__plumeIntro = { open: open, close: close };
})();
