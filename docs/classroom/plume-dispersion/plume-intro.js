/* CCRL Classroom — plume simulator intro: the Great Smog of London, December 1952.
 * Four storybook pages over an animated canvas: chimneys smoke, a temperature inversion
 * caps the city, smog thickens, then a wind clears it and the simulator begins. */
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
  var KEY = 'ccrl-plume-intro-seen';
  var box = document.getElementById('intro'), cv = document.getElementById('introCanvas'), ctx = cv.getContext('2d');
  var elK = document.getElementById('introKicker'), elT = document.getElementById('introTitle'), elX = document.getElementById('introText');
  var dots = document.getElementById('introDots'), next = document.getElementById('introNext'), skip = document.getElementById('introSkip');
  var page = 0, running = false, last = 0, t = 0, W = 0, H = 0, dpr = 1;
  var cur = { smog: 0.2, lid: 0, clear: 0 }, parts = [], scene = null, walkers = [];

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    build();
  }
  // London silhouette: terraces with chimney pots, St Paul's-like dome, a Gothic clock tower, a power station
  function build() {
    var r = rng(1952), U = Math.max(0.75, H / 620), g = H * 0.8, p = new Path2D(), far = new Path2D(), chim = [], x = -10;
    while (x < W + 20) {                                   // far row
      var fw = (30 + r() * 60) * U, fh = (40 + r() * 50) * U;
      far.rect(x, g - fh, fw, fh); x += fw + r() * 8 * U;
    }
    var dome = W * 0.5, tower = W * 0.69, power = W * 0.87;
    far.rect(dome - 34 * U, g - 92 * U, 68 * U, 92 * U);          // cathedral drum + dome + lantern
    far.moveTo(dome - 28 * U, g - 92 * U); far.bezierCurveTo(dome - 28 * U, g - 152 * U, dome + 28 * U, g - 152 * U, dome + 28 * U, g - 92 * U); far.closePath();
    far.rect(dome - 4 * U, g - 152 * U, 8 * U, 14 * U); far.moveTo(dome - 3 * U, g - 152 * U); far.lineTo(dome, g - 166 * U); far.lineTo(dome + 3 * U, g - 152 * U); far.closePath();
    p.rect(tower - 10 * U, g - 170 * U, 20 * U, 170 * U);         // clock tower
    p.moveTo(tower - 12 * U, g - 170 * U); p.lineTo(tower, g - 210 * U); p.lineTo(tower + 12 * U, g - 170 * U); p.closePath();
    p.rect(tower - 1, g - 222 * U, 2, 14 * U);
    p.rect(power - 64 * U, g - 70 * U, 128 * U, 70 * U);          // power station with two chimneys
    [power - 44 * U, power + 44 * U].forEach(function (cx) { p.moveTo(cx - 9 * U, g - 70 * U); p.lineTo(cx - 6.5 * U, g - 175 * U); p.lineTo(cx + 6.5 * U, g - 175 * U); p.lineTo(cx + 9 * U, g - 70 * U); p.closePath(); chim.push([cx, g - 175 * U, 3]); });
    x = -6;
    while (x < W + 10) {                                    // near terraces
      if (Math.abs(x - tower) < 40 * U || Math.abs(x - power) < 90 * U) { x += 12; continue; }
      var n = 4 + (r() * 6 | 0), hw = (17 + r() * 4) * U, eave = (40 + r() * 16) * U, rw = n * hw;
      p.moveTo(x, g); p.lineTo(x, g - eave); p.lineTo(x + 6 * U, g - eave - 9 * U); p.lineTo(x + rw - 6 * U, g - eave - 9 * U); p.lineTo(x + rw, g - eave); p.lineTo(x + rw, g); p.closePath();
      for (var j = 1; j < n; j += 2) { var sx = x + j * hw - 3 * U; p.rect(sx, g - eave - 17 * U, 6 * U, 9 * U); p.rect(sx + 0.5 * U, g - eave - 20 * U, 2 * U, 3 * U); p.rect(sx + 3.5 * U, g - eave - 20 * U, 2 * U, 3 * U); chim.push([sx + 3 * U, g - eave - 20 * U, 1]); }
      x += rw + (2 + r() * 10) * U;
    }
    scene = { g: g, near: p, far: far, chim: chim, tower: tower, clockY: g - 150 * U, U: U, lamps: [] };
    // charcoal-sketch rendering of the near city, done once: fill, clipped hatching, doubled outline
    var nc = document.createElement('canvas'); nc.width = Math.ceil(W * dpr); nc.height = Math.ceil(H * dpr);
    var c2 = nc.getContext('2d'); c2.scale(dpr, dpr);
    c2.fillStyle = '#19171b'; c2.fill(p);
    c2.save(); c2.clip(p); c2.lineWidth = 0.8;
    for (var hx = -H; hx < W; hx += 3.4 + r() * 1.6) { c2.strokeStyle = 'rgba(120,108,90,' + (0.05 + r() * 0.07) + ')'; c2.beginPath(); c2.moveTo(hx, g); c2.lineTo(hx + 260 * U, g - 260 * U); c2.stroke(); }
    c2.restore();
    c2.strokeStyle = 'rgba(150,135,110,.25)'; c2.lineWidth = 0.9;
    c2.save(); c2.translate(0.7, -0.5); c2.stroke(p); c2.restore(); c2.save(); c2.translate(-0.5, 0.4); c2.stroke(p); c2.restore();
    scene.nearCv = nc;
    var gcv = document.createElement('canvas'); gcv.width = gcv.height = 180;
    var gc = gcv.getContext('2d'), img = gc.createImageData(180, 180);
    for (var gi = 0; gi < img.data.length; gi += 4) { var gv = r() * 255 | 0; img.data[gi] = img.data[gi + 1] = img.data[gi + 2] = gv; img.data[gi + 3] = 18; }
    gc.putImageData(img, 0, 0); scene.grain = gcv;
    for (var lx = 40; lx < W; lx += (160 + r() * 80) * U) scene.lamps.push(lx);
    walkers = [];
    for (var k = 0; k < Math.max(3, W / 260 | 0); k++) walkers.push({ x: r() * W, dir: r() < 0.5 ? -1 : 1, sp: 8 + r() * 8, ph: r() * 6 });
  }
  function drawSky() {
    var c = ctx, k = cur.clear;
    var g = c.createLinearGradient(0, 0, 0, scene.g);
    g.addColorStop(0, mix([36, 33, 30], [104, 114, 126], k)); g.addColorStop(1, mix([88, 76, 56], [212, 196, 165], k));
    c.fillStyle = g; c.fillRect(0, 0, W, scene.g);
  }
  function mix(a, b, f) { return 'rgb(' + (a[0] + (b[0] - a[0]) * f | 0) + ',' + (a[1] + (b[1] - a[1]) * f | 0) + ',' + (a[2] + (b[2] - a[2]) * f | 0) + ')'; }

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += dt;
    var tg = PAGES[page], kk = 1 - Math.exp(-dt * 1.2);
    cur.smog += (tg.smog - cur.smog) * kk; cur.lid += (tg.lid - cur.lid) * kk; cur.clear += (tg.clear - cur.clear) * kk * 0.8;
    var c = ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSky();
    var lidY = H * 0.5, wind = cur.clear * 90;
    // far city
    c.fillStyle = 'rgba(30,27,26,.55)'; c.fill(scene.far);
    // smoke from every chimney; trapped below the inversion unless the wind clears it
    scene.chim.forEach(function (ch) { if (Math.random() < dt * (ch[2] > 1 ? 14 : 2.2)) parts.push({ x: ch[0], y: ch[1], vx: (Math.random() - 0.5) * 4, vy: -(ch[2] > 1 ? 26 : 14), a: 0, s: (ch[2] > 1 ? 10 : 6) * scene.U }); });
    for (var i = parts.length - 1; i >= 0; i--) {
      var q = parts[i]; q.a += dt;
      if (q.y < lidY + 20 && cur.clear < 0.5) { q.vy *= 0.94; q.vx += (Math.random() - 0.5) * 6 * dt; }
      q.vx += wind * dt * 0.6;
      q.x += q.vx * dt; q.y += q.vy * dt; q.s += dt * 4.5 * scene.U;
      if (q.y < lidY - 10 && cur.clear < 0.5) q.y = lidY - 10;
      var life = cur.clear > 0.5 ? 6 : 22;
      if (q.a > life || q.x > W + 60) { parts.splice(i, 1); continue; }
      var al = Math.min(1, q.a * 1.5) * (1 - q.a / life) * 0.34;
      var gr = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.s);
      gr.addColorStop(0, 'rgba(48,42,34,' + al + ')'); gr.addColorStop(1, 'rgba(48,42,34,0)');
      c.fillStyle = gr; c.fillRect(q.x - q.s, q.y - q.s, q.s * 2, q.s * 2);
    }
    if (parts.length > 900) parts.splice(0, parts.length - 900);
    // near city + clock face + lit windows
    c.drawImage(scene.nearCv, 0, 0, W, H);
    c.fillStyle = 'rgba(240,214,150,.75)'; c.beginPath(); c.arc(scene.tower, scene.clockY, 5.5 * scene.U, 0, 7); c.fill();
    // inversion lid
    if (cur.lid > 0.02) {
      var lg = c.createLinearGradient(0, lidY - 26, 0, lidY + 6);
      lg.addColorStop(0, 'rgba(214,150,96,0)'); lg.addColorStop(1, 'rgba(214,150,96,' + 0.32 * cur.lid + ')');
      c.fillStyle = lg; c.fillRect(0, lidY - 26, W, 32);
      c.strokeStyle = 'rgba(232,170,110,' + 0.8 * cur.lid + ')'; c.setLineDash([8, 6]); c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(0, lidY + 6); c.lineTo(W, lidY + 6); c.stroke(); c.setLineDash([]);
      c.font = '600 14px "Gowun Batang", Georgia, serif'; c.textAlign = 'left';
      c.fillStyle = 'rgba(245,205,150,' + cur.lid + ')';
      c.fillText(T('역전층 — 따뜻한 공기의 뚜껑', 'Inversion: a lid of warm air'), 24, lidY - 4);
      c.textAlign = 'left';
    }
    // smog veil, densest near the ground
    var sg = c.createLinearGradient(0, lidY - 30, 0, H);
    sg.addColorStop(0, 'rgba(150,128,78,0)'); sg.addColorStop(0.25, 'rgba(150,128,78,' + 0.55 * cur.smog + ')'); sg.addColorStop(1, 'rgba(120,102,62,' + 0.9 * cur.smog + ')');
    c.fillStyle = sg; c.fillRect(0, lidY - 30, W, H);
    // street, gas lamps, walkers with handkerchiefs
    var g0 = scene.g;
    c.fillStyle = '#1b1917'; c.fillRect(0, g0, W, H - g0);
    scene.lamps.forEach(function (lx) {
      var gl = c.createRadialGradient(lx, g0 - 34, 0, lx, g0 - 34, 70);
      gl.addColorStop(0, 'rgba(250,206,120,' + (0.35 + 0.3 * cur.smog) + ')'); gl.addColorStop(1, 'rgba(250,206,120,0)');
      c.fillStyle = gl; c.fillRect(lx - 70, g0 - 104, 140, 140);
      c.fillStyle = '#121014'; c.fillRect(lx - 1.5, g0 - 34, 3, 34); c.fillRect(lx - 5, g0 - 42, 10, 8);
      c.fillStyle = 'rgba(255,224,160,.9)'; c.fillRect(lx - 3, g0 - 40, 6, 5);
    });
    walkers.forEach(function (w) {
      w.x += w.dir * w.sp * dt; w.ph += w.sp * dt * 0.25;
      if (w.x < -20) w.x = W + 20; if (w.x > W + 20) w.x = -20;
      person(c, w.x, g0 + 2, w.dir, w.ph, cur.smog > 0.45, scene.U);
    });
    // film grain + vignette
    if (!scene.gOff || t - scene.gOff.t > 0.12) scene.gOff = { t: t, x: Math.random() * 180 | 0, y: Math.random() * 180 | 0 };
    c.save(); c.translate(scene.gOff.x, scene.gOff.y); c.fillStyle = c.createPattern(scene.grain, 'repeat'); c.fillRect(-180, -180, W + 360, H + 360); c.restore();
    var vg = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(10,8,6,0)'); vg.addColorStop(1, 'rgba(10,8,6,.55)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    requestAnimationFrame(frame);
  }
  function person(c, x, feet, dir, ph, mask, U) {
    var sw = Math.sin(ph);
    c.save(); c.translate(x, feet); c.scale(dir * 2 * U, 2 * U); c.fillStyle = '#0f0e11'; c.strokeStyle = '#0f0e11'; c.lineCap = 'round';
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -11); c.lineTo(sw * 2.6, 0); c.moveTo(0, -11); c.lineTo(-sw * 2.6, 0); c.stroke();
    c.beginPath(); c.moveTo(-2, -20); c.lineTo(2, -20); c.lineTo(2.6, -6); c.lineTo(-2.6, -6); c.closePath(); c.fill();
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(0.5, -19); if (mask) { c.lineTo(2.8, -16); c.lineTo(2.6, -21.5); } else c.lineTo(0.5 - sw * 2, -12); c.stroke();
    c.beginPath(); c.arc(0.4, -22.5, 1.7, 0, 7); c.fill(); c.fillRect(-1.3, -28, 3.4, 4.2); c.fillRect(-2.4, -24.2, 5.6, 0.8);
    c.restore();
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
    page = 0; cur = { smog: 0.15, lid: 0, clear: 0 }; parts = [];
    resize(); renderPage(false);
    running = true; last = 0; requestAnimationFrame(frame);
    setTimeout(function () { next.focus(); }, 50);
  }
  function close() {
    running = false; box.hidden = true; document.body.classList.remove('intro-open');
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
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
  try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (/[?&]intro=0/.test(location.search)) seen = true;
  if (/[?&]intro=1/.test(location.search)) seen = false;
  if (!seen) open(); else if (window.__plumeTour && !/[?&]tour=0/.test(location.search)) window.__plumeTour.maybeStart();
  window.__plumeIntro = { open: open, close: close };
})();
