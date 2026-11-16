/* CCRL Classroom — Skew-T parcel lifting: UI */
(function () {
  'use strict';
  var CK = window.CK, T = CK.T, EN = CK.EN, C = window.SkewCore, clamp = CK.clamp, el = CK.svg, LV = C.LEVELS;
  var STATE_KEY = 'ccrl-skewt-state';

  var SCN = [
    { id: 'winter', name: T('겨울 아침', 'Winter morning'), sub: T('지면 역전층', 'surface inversion'),
      T: [-2, 2, 0, -8, -24, -50, -58, -60], Td: [-4, -12, -16, -24, -40, -60, -70, -80],
      sum: T('지면 근처가 위보다 차가운 역전층 → 공기덩어리가 금방 주변보다 차가워져 올라가지 못합니다.', 'Cold air under warmer air (an inversion) → the parcel soon becomes colder than its surroundings and cannot rise.'),
      text: T('맑고 바람 없는 겨울밤, 지면이 식어 아래쪽 공기가 위보다 차가워졌습니다. 들어 올린 공기덩어리는 곧 주변보다 차가워져 다시 가라앉습니다. 대류가 없어 안개나 낮은 층운, 대기오염 정체가 생기기 쉽습니다.', 'After a clear, calm winter night the ground has cooled the air near it below the air above. A lifted parcel soon becomes colder than its surroundings and sinks back. With no convection, fog, low stratus and trapped pollution are common.'),
      q: T('925 hPa 기온을 지상보다 높게 만든 것이 역전층입니다. 굴뚝 연기 시뮬레이터의 어떤 연기 모양과 연결될까요?', 'The 925 hPa temperature is warmer than the surface: an inversion. Which plume shape in the stack plume simulator does this match?') },
    { id: 'storm', name: T('여름 오후 뇌우', 'Summer thunderstorm'), sub: T('강한 불안정', 'strongly unstable'),
      T: [31, 25, 19, 7, -9, -38, -56, -62], Td: [22, 19, 14, -1, -20, -48, -66, -80],
      sum: T('덥고 습한 하층 + 차가운 상층 → 큰 CAPE, 적란운이 대류권계면까지 솟습니다.', 'Hot, humid low levels under cold air aloft → large CAPE; a cumulonimbus towers to the tropopause.'),
      text: T('한여름 오후, 햇볕에 데워진 습한 공기 위에 차가운 공기가 놓였습니다. 자유대류고도(LFC)를 지난 공기덩어리는 주변보다 계속 따뜻해 12 km 넘게 솟아오르고, 소나기·번개·우박을 동반한 적란운이 만들어집니다.', 'On a summer afternoon, sun-warmed humid air lies beneath cold air. Past the level of free convection (LFC) the parcel stays warmer than its surroundings and rises above 12 km, building a cumulonimbus with showers, lightning and hail.'),
      q: T('지상 이슬점 레버를 낮추면 CAPE와 구름 밑면 높이는 어떻게 변하나요? 수증기가 왜 중요할까요?', 'Lower the surface dew point lever. How do CAPE and cloud base change? Why does water vapour matter?') },
    { id: 'monsoon', name: T('장마', 'Changma (monsoon)'), sub: T('습윤·약한 불안정', 'moist, weakly unstable'),
      T: [24, 21, 17, 8, -6, -34, -54, -62], Td: [23, 20, 16, 7, -8, -38, -60, -80],
      sum: T('기온과 이슬점이 거의 붙어 있음 → 구름 밑면이 매우 낮고 두꺼운 구름이 생깁니다.', 'Temperature and dew point almost touch → a very low cloud base and deep cloud.'),
      text: T('장마철에는 하층부터 중층까지 공기가 거의 포화되어 있습니다. 조금만 올라가도 응결하므로 구름 밑면이 100 m 남짓으로 낮고, 층이 두꺼운 구름에서 많은 비가 내립니다.', 'In the Changma (East Asian monsoon) season the air is nearly saturated from the surface to mid-levels. It condenses almost immediately, so the cloud base is only about 100 m and deep clouds bring heavy rain.'),
      q: T('기온선과 이슬점선 사이의 간격(기온−이슬점)과 구름 밑면 높이는 어떤 관계가 있을까요?', 'How is the gap between the temperature and dew-point lines related to cloud-base height?') },
    { id: 'high', name: T('맑은 고기압', 'Fair-weather high'), sub: T('침강 역전', 'subsidence inversion'),
      T: [20, 17, 15, 12, -8, -37, -55, -60], Td: [10, 6, 0, -20, -35, -55, -70, -80],
      sum: T('상공에서 내려오며 데워진 건조한 공기층 → 대류가 막혀 맑은 날씨가 이어집니다.', 'A dry layer warmed by sinking air aloft → convection is capped and the weather stays fine.'),
      text: T('고기압 안에서는 공기가 천천히 가라앉으며 압축되어 데워집니다. 850–700 hPa 부근에 기온이 거의 떨어지지 않는 안정층(침강 역전)이 생겨 공기덩어리가 그 위로 올라가지 못하고, 작고 납작한 적운만 생깁니다.', 'In a high-pressure system air sinks slowly and warms by compression. A stable layer (subsidence inversion) forms near 850–700 hPa, capping the parcel, so only small flat cumulus form.'),
      q: T('700 hPa 기온을 낮춰 안정층을 없애면 어떤 일이 생기나요?', 'Cool the 700 hPa temperature to remove the stable layer. What happens?') },
    { id: 'dry', name: T('건조한 폭염', 'Hot and dry'), sub: T('높은 구름 밑면', 'high cloud base'),
      T: [35, 27, 20, 4, -16, -44, -58, -62], Td: [5, 2, -2, -10, -30, -56, -70, -80],
      sum: T('매우 덥지만 건조함 → 구름 밑면이 3.7 km로 높고 비가 땅에 닿기 전에 증발하기 쉽습니다.', 'Very hot but dry → the cloud base is high (3.7 km), and rain often evaporates before reaching the ground.'),
      text: T('지면은 뜨겁지만 공기가 건조해 공기덩어리가 한참 올라가서야 응결합니다. 하층 기온감률이 건조단열감률에 가까워 높이 섞이며, 구름이 생겨도 밑면이 높아 비가 증발(꼬리구름)하고 돌풍만 부는 “마른 뇌우”가 생기기도 합니다.', 'The ground is hot but the air is dry, so the parcel rises a long way before condensing. The low-level lapse rate is close to dry adiabatic; any cloud has a high base, rain evaporates on the way down (virga), and “dry thunderstorms” with gusts can occur.'),
      q: T('지상 기온과 이슬점의 차이를 줄여 보세요. 구름 밑면은 몇 m씩 낮아지나요? (대략 1 °C당 125 m)', 'Narrow the gap between surface temperature and dew point. How much lower does the cloud base get? (about 125 m per °C)') }
  ];
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var DEF = { Tb: SCN[1].T.slice(), Tdb: SCN[1].Td.slice(), su: 0, mo: 0 };
  var S = clone(DEF), A = null, active = SCN[1], modified = false, guides = true;
  var saved = CK.takeState(STATE_KEY);
  if (saved && saved.S) { S = saved.S; active = SCN.filter(function (x) { return x.id === saved.scn; })[0] || null; modified = !!saved.modified; }

  function Teff() { return S.Tb.map(function (v, i) { return LV[i] <= 500 ? v + S.su : v; }); }
  function Tdeff() { var t = Teff(); return S.Tdb.map(function (v, i) { var w = LV[i] <= 925 && LV[i] >= 700 ? v + S.mo : v; return Math.min(w, t[i]); }); }
  function recompute() { A = C.analyse(Teff(), Tdeff()); drawDiag(); drawStats(); syncLevers(); }
  function userChanged() { if (active && !modified) { modified = true; renderCard(); } recompute(); }

  /* ---------------- diagram ---------------- */
  var D = { svg: document.getElementById('diagram'), l: 40, r: 64, t: 10, b: 28, p0: 1050, pt: 100, Tmin: -40, Tmax: 45, skew: 75 };
  function yf(p) { return Math.log(D.p0 / p) / Math.log(D.p0 / D.pt); }
  function py(p) { return D.h - D.b - yf(p) * (D.h - D.t - D.b); }
  function tx(t, p) { return D.l + ((t - D.Tmin) + D.skew * yf(p)) / (D.Tmax - D.Tmin) * (D.w - D.l - D.r); }
  function txInv(x, p) { return (x - D.l) / (D.w - D.l - D.r) * (D.Tmax - D.Tmin) + D.Tmin - D.skew * yf(p); }
  function line(fn, p1, p2, n, cls, parent) { var d = ''; for (var i = 0; i <= n; i++) { var p = Math.exp(Math.log(p1) + (Math.log(p2) - Math.log(p1)) * i / n), t = fn(p); d += (i ? 'L' : 'M') + tx(t, p).toFixed(1) + ',' + py(p).toFixed(1); } return el('path', { d: d, 'class': cls }, parent); }
  function buildDiag() {
    var s = D.svg, r = s.getBoundingClientRect(); D.w = r.width; D.h = r.height;
    s.setAttribute('viewBox', '0 0 ' + D.w + ' ' + D.h); s.innerHTML = '';
    var cp = el('clipPath', { id: 'dclip' }, s); el('rect', { x: D.l, y: D.t, width: D.w - D.l - D.r, height: D.h - D.t - D.b }, cp);
    var g = el('g', { 'clip-path': 'url(#dclip)' }, s); D.g = g;
    for (var t = -120; t <= 50; t += 10) line(function () { return t; }, 1050, 100, 2, t === 0 ? 'iso0' : 'iso', g);
    var gd = el('g', { 'class': 'guides' }, g); D.guides = gd;
    for (var th = 250; th <= 460; th += 10) (function (th) { line(function (p) { return th * Math.pow(p / 1000, C.Rd / C.cp) - C.K0; }, 1050, 100, 24, 'dry', gd); })(th);
    for (var t0 = -12; t0 <= 36; t0 += 4) (function (t0) {
      var pts = [], Tp = t0, d = '';
      for (var p = 1050; p >= 150; p -= 5) { pts.push([p, Tp]); Tp -= C.moistLapse(Tp, p) * 5; }
      pts.forEach(function (q, i) { d += (i ? 'L' : 'M') + tx(q[1], q[0]).toFixed(1) + ',' + py(q[0]).toFixed(1); });
      el('path', { d: d, 'class': 'moist' }, gd);
    })(t0);
    [1, 2, 4, 8, 16].forEach(function (w) {        // mixing-ratio lines (g/kg), lower troposphere
      line(function (p) { var e = w / 1000 * p / (0.622 + w / 1000), lnr = Math.log(e / 6.112); return 243.5 * lnr / (17.67 - lnr); }, 1050, 600, 8, 'mix', gd);
    });
    LV.concat([400, 250, 150]).forEach(function (p) {
      el('line', { x1: D.l, x2: D.w - D.r, y1: py(p), y2: py(p), 'class': 'isob' }, s);
      el('text', { x: D.l - 5, y: py(p) + 4, 'text-anchor': 'end', 'class': LV.indexOf(p) >= 0 ? 'axb' : 'ax' }, s).textContent = p;
    });
    for (var tt = -30; tt <= 40; tt += 10) el('text', { x: tx(tt, 1050), y: D.h - 9, 'text-anchor': 'middle', 'class': 'ax' }, s).textContent = tt + '°';
    el('text', { x: D.l - 5, y: D.h - 9, 'text-anchor': 'end', 'class': 'ax' }, s).textContent = 'hPa';
    D.cin = el('path', { 'class': 'cin' }, g); D.cape = el('path', { 'class': 'cape' }, g);
    D.envT = el('path', { 'class': 'envT' }, g); D.envD = el('path', { 'class': 'envD' }, g); D.parc = el('path', { 'class': 'parc' }, g);
    D.km = el('g', {}, s); D.mk = el('g', {}, s);
    D.ptsT = []; D.ptsD = [];
    LV.forEach(function (p, j) {
      [['T', 'ptT'], ['D', 'ptD']].forEach(function (kind) {
        var hit = el('circle', { r: 14, 'class': 'hit' }, s);
        var c = el('circle', { r: 6.5, 'class': kind[1], tabindex: 0, role: 'slider', 'aria-label': (kind[0] === 'T' ? T('기온', 'Temperature') : T('이슬점', 'Dew point')) + ' ' + p + ' hPa' }, s);
        (kind[0] === 'T' ? D.ptsT : D.ptsD).push([c, hit]);
        function start(e) {
          e.preventDefault(); c.focus(); var tg = e.currentTarget; tg.setPointerCapture(e.pointerId);
          function mv(ev) { var rr = s.getBoundingClientRect(); setPoint(kind[0], j, txInv(ev.clientX - rr.left, p)); }
          function up() { tg.removeEventListener('pointermove', mv); tg.removeEventListener('pointerup', up); }
          tg.addEventListener('pointermove', mv); tg.addEventListener('pointerup', up); tg.addEventListener('pointercancel', up);
        }
        hit.addEventListener('pointerdown', start); c.addEventListener('pointerdown', start);
        c.addEventListener('keydown', function (e) {
          var cur = kind[0] === 'T' ? Teff()[j] : Tdeff()[j], d = e.shiftKey ? 5 : 0.5;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setPoint(kind[0], j, cur + d); e.preventDefault(); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setPoint(kind[0], j, cur - d); e.preventDefault(); }
        });
      });
    });
    D.svg.classList.toggle('guides-off', !guides);
  }
  function setPoint(kind, j, v) {
    v = Math.round(v * 2) / 2;
    if (kind === 'T') {
      var shift = LV[j] <= 500 ? S.su : 0;
      S.Tb[j] = clamp(v, -95, 45) - shift;
      if (S.Tdb[j] > S.Tb[j] + shift) S.Tdb[j] = S.Tb[j] + shift;
    } else {
      var m = LV[j] <= 925 && LV[j] >= 700 ? S.mo : 0;
      S.Tdb[j] = Math.min(clamp(v, -100, 40), Teff()[j]) - m;
    }
    userChanged(); kickLift();
  }
  function drawDiag() {
    if (!D.envT || !A) return;
    var Tt = Teff(), Td = Tdeff(), dT = '', dD = '';
    LV.forEach(function (p, j) { dT += (j ? 'L' : 'M') + tx(Tt[j], p).toFixed(1) + ',' + py(p).toFixed(1); dD += (j ? 'L' : 'M') + tx(Td[j], p).toFixed(1) + ',' + py(p).toFixed(1); });
    D.envT.setAttribute('d', dT); D.envD.setAttribute('d', dD);
    var dp = '';
    A.prof.forEach(function (q, i) { dp += (i ? 'L' : 'M') + tx(q.T, q.p).toFixed(1) + ',' + py(q.p).toFixed(1); });
    D.parc.setAttribute('d', dp);
    function fill(pa, pb) {                  // polygon between parcel and environment for pa >= p >= pb
      var fw = '', bk = [];
      A.prof.forEach(function (q) { if (q.p <= pa && q.p >= pb) { fw += (fw ? 'L' : 'M') + tx(q.T, q.p).toFixed(1) + ',' + py(q.p).toFixed(1); bk.push(q.p); } });
      for (var i = bk.length - 1; i >= 0; i--) fw += 'L' + tx(C.envAt(Tt, bk[i]), bk[i]).toFixed(1) + ',' + py(bk[i]).toFixed(1);
      return fw ? fw + 'Z' : '';
    }
    D.cape.setAttribute('d', A.lfc ? fill(A.lfc, A.el) : '');
    D.cin.setAttribute('d', A.lfc ? fill(LV[0], A.lfc) : '');
    D.mk.innerHTML = ''; var lastY = 1e9;
    [[A.lcl.p, 'LCL'], [A.lfc, 'LFC'], [A.el, 'EL']].forEach(function (m) {
      if (!m[0]) return;
      var y = py(m[0]); var ly = y > lastY - 12 ? lastY - 12 : y; lastY = ly;
      el('line', { x1: D.w - D.r, x2: D.w - D.r + 8, y1: y, y2: y, 'class': 'mk' }, D.mk);
      el('text', { x: D.w - D.r + 11, y: ly + 4, 'class': 'mklab' }, D.mk).textContent = m[1];
    });
    D.km.innerHTML = '';
    for (var km = 0; km <= 16; km += 2) {
      var p = pAtZ(km * 1000); if (!p || p < D.pt) continue;
      el('text', { x: D.w - 2, y: py(p) + 4, 'text-anchor': 'end', 'class': 'ax' }, D.km).textContent = km + ' km';
    }
    LV.forEach(function (p, j) {
      [[D.ptsT[j], Tt[j]], [D.ptsD[j], Td[j]]].forEach(function (pp) {
        var x = tx(pp[1], p), y = py(p); pp[0].forEach(function (c) { c.setAttribute('cx', x); c.setAttribute('cy', y); });
        pp[0][0].setAttribute('aria-valuenow', pp[1].toFixed(1)); pp[0][0].setAttribute('aria-valuetext', pp[1].toFixed(1) + ' °C');
      });
    });
  }
  function pAtZ(z) { var lo = 100, hi = 1000; for (var k = 0; k < 40; k++) { var mid = Math.sqrt(lo * hi); if (A.z(mid) > z) lo = mid; else hi = mid; } return Math.sqrt(lo * hi); }

  /* ---------------- stats + verdict ---------------- */
  var statDD = {};
  function buildStats() {
    var defs = [['lcl', '', T('구름 밑면 (LCL)', 'Cloud base (LCL)')], ['el', '', T('구름 꼭대기 (EL)', 'Cloud top (EL)')], ['cape', 'hot', 'CAPE'], ['cin', '', 'CIN']];
    var dl = document.getElementById('stats');
    defs.forEach(function (d) {
      var box = document.createElement('div'); box.className = 'ck-stat ' + d[1];
      var dt = document.createElement('dt'); dt.textContent = d[2]; var dd = document.createElement('dd');
      box.appendChild(dt); box.appendChild(dd); dl.appendChild(box); CK.info(dt, 'stat_' + d[0], d[2]); statDD[d[0]] = dd;
    });
  }
  function verdictOf() {
    if (!A.lfc) return [T('안정', 'Stable'), '#2457a6', T('공기덩어리가 스스로 올라가지 못합니다 (자유대류고도 없음).', 'The parcel cannot rise on its own (no level of free convection).')];
    if (A.cape < 1000) return [T('약한 불안정', 'Weakly unstable'), '#c99a2e', T('적운이 자랄 수 있습니다.', 'Cumulus can grow.')];
    if (A.cape < 2500) return [T('불안정', 'Unstable'), '#d9772f', T('소나기와 뇌우가 생길 수 있습니다.', 'Showers and thunderstorms are possible.')];
    return [T('강한 불안정', 'Strongly unstable'), '#c8452f', T('강한 뇌우·우박 가능성이 큽니다.', 'Severe thunderstorms and hail are likely.')];
  }
  function drawStats() {
    if (!A) return;
    statDD.lcl.textContent = fmtZ(A.zl);
    statDD.el.textContent = A.el ? fmtZ(A.zel) : '—';
    statDD.cape.textContent = Math.round(A.cape) + ' J/kg';
    statDD.cin.textContent = A.lfc ? Math.round(A.cin) + ' J/kg' : '—';
    var v = verdictOf();
    document.getElementById('verdict').innerHTML = '<span class="chip" style="background:' + v[1] + '">' + v[0] + '</span><span>' + v[2] + '</span><span class="ck-right ck-hint">' + T('상승지수 LI', 'Lifted index LI') + ' <b>' + (A.li > 0 ? '+' : '') + A.li.toFixed(1) + '</b></span>';
  }
  function fmtZ(z) { return z >= 1000 ? (z / 1000).toFixed(1) + ' km' : Math.round(z) + ' m'; }

  /* ---------------- levers ---------------- */
  var LEV = [
    { k: 'ts', label: T('지상 기온', 'Surface temp.'), min: -10, max: 40, step: 0.5, dec: 1, unit: '°C', tip: 'lev_ts', get: function () { return Teff()[0]; },
      set: function (v) { S.Tb[0] = v; if (S.Tdb[0] > v) S.Tdb[0] = v; } },
    { k: 'td', label: T('지상 이슬점', 'Surface dew point'), min: -20, max: 30, step: 0.5, dec: 1, unit: '°C', tip: 'lev_td', get: function () { return Tdeff()[0]; },
      set: function (v) { S.Tdb[0] = Math.min(v, Teff()[0]); } },
    { k: 'mo', label: T('하층 습도', 'Low-level moisture'), min: -10, max: 10, step: 0.5, dec: 1, tip: 'lev_mo', fmt: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1) + ' °C'; }, get: function () { return S.mo; }, set: function (v) { S.mo = v; } },
    { k: 'su', label: T('상층 기온', 'Upper-air temp.'), min: -10, max: 10, step: 0.5, dec: 1, tip: 'lev_su', fmt: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1) + ' °C'; }, get: function () { return S.su; }, set: function (v) { S.su = v; } }
  ];
  var levs = [];
  function buildLevers() {
    var wrap = document.getElementById('levers');
    LEV.forEach(function (L) { levs.push(CK.lever(wrap, L, L.get, function (v) { L.set(v); userChanged(); kickLift(); })); });
  }
  function syncLevers() { levs.forEach(function (l) { l.sync(); }); }

  /* ---------------- scenarios ---------------- */
  function buildScenarios() {
    var list = document.getElementById('scnList');
    SCN.forEach(function (sc) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ck-scn'; b.dataset.id = sc.id; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<b>' + sc.name + '</b><span>' + sc.sub + '</span>';
      b.addEventListener('click', function () { active = sc; modified = false; S.Tb = sc.T.slice(); S.Tdb = sc.Td.slice(); S.su = 0; S.mo = 0; setPressed(); renderCard(); recompute(); kickLift(true); });
      list.appendChild(b);
    });
    document.getElementById('resetBtn').addEventListener('click', function () { S = clone(DEF); active = SCN[1]; modified = false; setPressed(); renderCard(); recompute(); kickLift(true); });
    var lb = document.getElementById('linesBtn');
    lb.addEventListener('click', function () { guides = !guides; lb.setAttribute('aria-pressed', guides); lb.textContent = guides ? T('보조선 켜짐', 'Guide lines on') : T('보조선 꺼짐', 'Guide lines off'); D.svg.classList.toggle('guides-off', !guides); });
  }
  function setPressed() { document.querySelectorAll('#scnList .ck-scn').forEach(function (b) { b.setAttribute('aria-pressed', active && b.dataset.id === active.id ? 'true' : 'false'); }); }
  function renderCard() {
    var c = document.getElementById('scnCard'), sc = active;
    var title = sc ? sc.name : T('사례를 골라 보세요', 'Choose a sounding');
    var sum = sc ? sc.sum : '', q = sc ? sc.q : '';
    c.innerHTML = '<div class="ck-card-main"><h3>' + title + '</h3><span class="dash">|</span><p>' + sum + '</p></div><div class="ck-q"><b>' + T('질문', 'Question') + '</b><span>' + q + '</span></div>';
    var main = c.querySelector('.ck-card-main'); CK.info(main, 'scn', title);
    if (modified) { var bd = document.createElement('span'); bd.className = 'ck-badge'; bd.textContent = T('직접 조절 중', 'Adjusted'); main.appendChild(bd); }
  }

  /* ---------------- scene: station, cloud, rising parcel ---------------- */
  var cv = document.getElementById('scene'), ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, ZTOP = 16000;
  function resizeScene() { var r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  function zy(z) { return H - 34 - z / ZTOP * (H - 50); }
  var lift = { z: 0, v: 0, state: 'rise', t: 0 }, tAnim = 0, last = 0, liftTimer = null;
  function kickLift(now) { clearTimeout(liftTimer); liftTimer = setTimeout(function () { lift = { z: 0, v: 0, state: 'rise', t: 0 }; }, now ? 0 : 400); }
  document.getElementById('liftBtn').addEventListener('click', function () { kickLift(true); });
  function envTz(z) { return C.envAt(Teff(), pAtZ(z)); }
  function parcelTz(z) { var p = pAtZ(z), pr = A.prof; for (var i = 1; i < pr.length; i++) if (pr[i].p <= p) return pr[i].T; return pr[pr.length - 1].T; }
  function puff(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  function drawCloud(c, cx0, zb, zt, cape, t) {
    var yb = zy(zb), yt = zy(zt), hgt = yb - yt, wB = Math.min(W * 0.2, 36 + hgt * 0.28);
    var anvil = zt > 9000 && cape > 1000;
    var cg = c.createLinearGradient(0, yt, 0, yb); cg.addColorStop(0, 'rgba(255,255,255,.97)'); cg.addColorStop(0.6, 'rgba(236,240,245,.95)'); cg.addColorStop(1, 'rgba(176,188,202,.95)');
    c.fillStyle = cg;
    for (var k = 0; k < 26; k++) {
      var f = k / 25, y = yb - f * hgt, wid = wB * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, f * 1.2)));
      if (anvil && f > 0.84) wid = wB * (0.9 + (f - 0.84) * 9);
      for (var j = -2; j <= 2; j++) puff(c, cx0 + j * wid * 0.2 + Math.sin(k * 1.7 + t * 0.4) * 3, y, Math.max(7, wid * 0.19));
    }
    c.fillStyle = 'rgba(120,135,155,.55)'; c.fillRect(cx0 - wB * 0.5, yb - 3, wB, 6);
    if (cape > 800) {                                          // rain shafts
      c.strokeStyle = 'rgba(110,130,160,.55)'; c.lineWidth = 1.2;
      for (var r = -3; r <= 3; r++) { var rx = cx0 + r * wB * 0.12; c.beginPath(); c.moveTo(rx, yb + 4); c.lineTo(rx - 6, zy(0)); c.stroke(); }
    } else if (zb > 2500) {                                    // virga
      c.strokeStyle = 'rgba(140,150,170,.45)'; c.lineWidth = 1;
      for (var v = -2; v <= 2; v++) { var vx = cx0 + v * wB * 0.14; c.beginPath(); c.moveTo(vx, yb + 4); c.quadraticCurveTo(vx - 4, yb + 40, vx - 10, yb + 70); c.stroke(); }
    }
    if (cape > 2000 && Math.sin(t * 7.3) > 0.985) {            // lightning flash
      c.strokeStyle = '#fff7b0'; c.lineWidth = 2.2; c.beginPath(); var lx = cx0 + 10, ly = yb + 2;
      c.moveTo(lx, ly); for (var s = 0; s < 6; s++) { lx += (s % 2 ? -10 : 8); ly += (zy(0) - yb) / 6; c.lineTo(lx, ly); } c.stroke();
    }
  }
  /* real sky photographs, chosen from the computed sounding (Wikimedia Commons; credits in the footer and media/CREDITS.txt) */
  var SKY = {
    cb: { src: 'cumulonimbus.jpg', fx: 0.36, fy: 0.42, name: T('적란운 (모루구름)', 'Cumulonimbus with an anvil'), note: T('강한 불안정: 구름이 대류권계면까지 솟아 뇌우가 됩니다.', 'Strongly unstable: the cloud towers to the tropopause and becomes a thunderstorm.'), cr: 'Kamil Nowacki · CC BY-SA 4.0' },
    tcu: { src: 'congestus.jpg', fx: 0.5, fy: 0.5, name: T('탑상적운 (봉우리 적운)', 'Towering cumulus (congestus)'), note: T('불안정하지만 뇌우까지 자라기엔 에너지가 부족합니다.', 'Unstable, but without enough energy to grow into a thunderstorm.'), cr: 'Jacek Halicki · CC BY-SA 4.0' },
    virga: { src: 'virga.jpg', fx: 0.5, fy: 0.45, name: T('꼬리구름 (비가 증발하는 구름)', 'Virga: rain that evaporates'), note: T('구름 밑면이 높고 아래 공기가 건조해 비가 땅에 닿기 전에 증발합니다.', 'A high cloud base over dry air: rain evaporates before it reaches the ground.'), cr: 'Rivervictorlauramarie · CC0' },
    rain: { src: 'rain.jpg', fx: 0.4, fy: 0.35, name: T('낮고 두꺼운 비구름', 'Low, thick rain clouds'), note: T('거의 포화된 공기: 구름 밑면이 매우 낮고 많은 비가 내립니다.', 'Nearly saturated air: a very low cloud base and heavy rain.'), cr: 'W.carter · CC BY-SA 4.0' },
    inversion: { src: 'inversion.jpg', fx: 0.6, fy: 0.5, name: T('역전층 아래 갇힌 연기', 'Smoke trapped under an inversion'), note: T('지면 근처가 위보다 차가워 공기가 섞이지 않고 연기가 낮게 퍼집니다(서울).', 'Cold air under warmer air does not mix, so smoke spreads out low (Seoul).'), cr: 'Jimmy McIntyre · CC BY-SA 2.0' },
    fair: { src: 'humilis.jpg', fx: 0.5, fy: 0.4, name: T('맑은 날의 납작한 뭉게구름', 'Fair-weather cumulus (humilis)'), note: T('안정한 대기: 구름이 생겨도 위로 자라지 못하고 납작합니다.', 'Stable air: clouds form but cannot grow upward and stay flat.'), cr: 'Toby Hudson · CC BY-SA 3.0' },
    clear: { src: 'clear.jpg', fx: 0.5, fy: 0.3, name: T('구름 없는 맑은 하늘', 'Clear blue sky'), note: T('공기가 건조하고 안정해 구름이 생기지 않습니다(경주 첨성대).', 'Dry, stable air: no cloud forms (Cheomseongdae, Gyeongju).'), cr: 'Basile Morin · CC BY-SA 4.0' }
  };
  Object.keys(SKY).forEach(function (k) { var p = SKY[k]; p.img = new Image(); p.img.src = 'media/' + p.src; });
  function regime() {
    var t = Teff(), d = Tdeff();
    if (A.lfc) { if (A.zl < 500) return 'rain'; if (A.zl > 2500) return 'virga'; return A.cape > 1000 && A.zel > 8000 ? 'cb' : 'tcu'; }
    if (t[1] > t[0]) return 'inversion';
    if (t[0] - d[0] < 2 || A.zl < 500) return 'rain';
    return A.zl < 3000 ? 'fair' : 'clear';
  }
  var skyCur = null, skyPrev = null, skyT = 0;
  function coverPhoto(c, p, x0, w, h, alpha) {
    if (!p.img.complete || !p.img.naturalWidth) return;
    var iw = p.img.naturalWidth, ih = p.img.naturalHeight, s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
    var x = Math.max(x0 + w - dw, Math.min(x0, x0 + w / 2 - p.fx * dw)), y = Math.max(h - dh, Math.min(0, h / 2 - p.fy * dh));
    c.globalAlpha = alpha; c.drawImage(p.img, x, y, dw, dh); c.globalAlpha = 1;
  }
  function wrapText(c, s, x, y, maxW, lh) {
    var words = s.split(' '), line = '';
    for (var i = 0; i < words.length; i++) { var test = line ? line + ' ' + words[i] : words[i]; if (c.measureText(test).width > maxW && line) { c.fillText(line, x, y); line = words[i]; y += lh; } else line = test; }
    c.fillText(line, x, y); return y;
  }
  function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; tAnim += dt;
    if (A && W) {
      var c = ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      var unstable = !!A.lfc, Wfull = W, colW = Math.round(Math.min(330, Math.max(240, Wfull * 0.42)));
      // photograph of a real sky like the computed one, filling the scene
      var rg = regime(); if (rg !== skyCur) { skyPrev = skyCur; skyCur = rg; skyT = tAnim; }
      var k = Math.min(1, (tAnim - skyT) / 0.6);
      c.fillStyle = '#1d2b3a'; c.fillRect(0, 0, Wfull, H);
      if (skyPrev && k < 1) coverPhoto(c, SKY[skyPrev], colW, Wfull - colW, H, 1);
      coverPhoto(c, SKY[skyCur], colW, Wfull - colW, H, skyPrev ? k : 1);
      // caption on the photo
      var P = SKY[skyCur], px = colW + 14, pw = Wfull - colW - 28, kick = T('이런 하늘이 됩니다 · 실제 사진', 'A sky like this · real photo');
      c.textAlign = 'left'; c.font = '12px Pretendard Variable, Pretendard, sans-serif';
      var lines = Math.max(1, Math.min(3, Math.ceil(c.measureText(P.note).width / (pw - 30)))), boxH = 58 + lines * 16, by0 = H - boxH - 28;
      c.fillStyle = 'rgba(12,20,30,.62)'; c.beginPath(); if (c.roundRect) c.roundRect(px, by0, pw, boxH, 8); else c.rect(px, by0, pw, boxH); c.fill();
      c.fillStyle = '#9fd0ff'; c.font = '700 10.5px Pretendard Variable, Pretendard, sans-serif'; c.fillText(kick, px + 12, by0 + 17);
      c.fillStyle = '#fff'; c.font = '700 14px Pretendard Variable, Pretendard, sans-serif'; c.fillText(P.name, px + 12, by0 + 36);
      c.fillStyle = 'rgba(255,255,255,.86)'; c.font = '12px Pretendard Variable, Pretendard, sans-serif'; wrapText(c, P.note, px + 12, by0 + 54, pw - 24, 16);
      c.textAlign = 'right'; c.font = '10.5px Pretendard Variable, Pretendard, sans-serif'; c.fillStyle = 'rgba(255,255,255,.8)';
      c.fillText(T('사진: ', 'Photo: ') + P.cr, Wfull - 10, H - 8);
      // left: the computed column (heights to scale) on a dark glass panel
      c.fillStyle = 'rgba(14,24,36,.78)'; c.fillRect(0, 0, colW, H);
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(colW - 1, 0, 1, H);
      W = colW;
      // height ruler
      c.font = '11px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'left';
      for (var km = 2; km <= 16; km += 2) { var y = zy(km * 1000); c.strokeStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(km + ' km', 6, y - 3); }
      // tropopause hint (EL of a deep storm)
      var cx0 = W * 0.6;
      if (unstable) drawCloud(c, cx0, A.zl, A.zel, A.cape, tAnim);
      else if (A.zl < 3000) {                                  // flat cloud at the condensation level
        var close = Teff()[0] - Tdeff()[0] < 3;
        c.fillStyle = 'rgba(255,255,255,' + (close ? 0.85 : 0.75) + ')';
        if (close) c.fillRect(0, Math.min(zy(A.zl + 250), zy(0) - 16), W, Math.max(zy(A.zl) - zy(A.zl + 250), 14));
        else for (var k = 0; k < 5; k++) { var px = W * (0.18 + k * 0.17); for (var j = -1; j <= 1; j++) puff(c, px + j * 12, zy(A.zl) - 6, 12); c.fillRect(px - 24, zy(A.zl) - 6, 48, 6); }
      }
      // markers
      var lastY2 = 1e9;
      [[A.zl, 'LCL'], [A.zlfc, 'LFC'], [A.zel, 'EL']].forEach(function (m) {
        if (m[0] == null) return; var y2 = zy(m[0]), ly2 = y2 > lastY2 - 12 ? lastY2 - 12 : y2; lastY2 = ly2;
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(W - 70, y2); c.lineTo(W - 8, y2); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#ffffff'; c.font = '700 11px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'right'; c.fillText(m[1], W - 10, ly2 - 4);
      });
      // ground + station
      var g0 = zy(0);
      c.fillStyle = '#6d8f5e'; c.fillRect(0, g0, W, H - g0);
      c.fillStyle = '#5b7a4e'; c.beginPath(); c.moveTo(0, g0); for (var x = 0; x <= W; x += 20) c.lineTo(x, g0 - 6 - 6 * Math.sin(x / 40)); c.lineTo(W, g0); c.fill();
      var sx = W * 0.2;
      c.fillStyle = '#e9edf2'; c.fillRect(sx - 18, g0 - 22, 36, 22); c.fillStyle = '#c8452f'; c.fillRect(sx - 20, g0 - 26, 40, 5);
      c.fillStyle = '#e9edf2'; c.fillRect(sx + 26, g0 - 40, 3, 40); c.fillStyle = '#9aa7b6'; c.fillRect(sx + 22, g0 - 44, 11, 5);
      c.fillStyle = '#172433'; c.font = '600 11px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'center';
      c.fillText(T('고층기상관측소', 'Upper-air station'), sx, g0 + 16);
      // rising parcel
      var top = unstable ? A.zel : A.zl, zNow = lift.z;
      if (lift.state === 'rise') {
        var buoy = zNow > 50 ? parcelTz(zNow) - envTz(zNow) : 0.5, speed = 2600 + (unstable && zNow > (A.zlfc || 1e9) ? 1800 + A.cape : 0);
        lift.z += speed * dt;
        if (!unstable && lift.z >= A.zl) { lift.z = A.zl; lift.state = 'hold'; lift.t = 0; }
        if (unstable && lift.z >= A.zel) { lift.z = A.zel; lift.state = 'hold'; lift.t = 0; }
      } else if (lift.state === 'hold') { lift.t += dt; if (lift.t > 1.6) { lift.state = unstable ? 'done' : 'sink'; lift.t = 0; } }
      else if (lift.state === 'sink') { lift.z -= 2400 * dt; if (lift.z <= 0) { lift.z = 0; lift.state = 'done'; lift.t = 0; } }
      else if (lift.state === 'done') { lift.t += dt; if (lift.t > 1.2) lift = { z: 0, v: 0, state: 'rise', t: 0 }; }   // auto-repeat
      var by = zy(lift.z), bx = Math.min(W * 0.3, W - 222), cond = lift.z >= A.zl;
      if (lift.state !== 'done') {
        c.fillStyle = cond ? 'rgba(255,255,255,.95)' : 'rgba(255,190,120,.85)'; c.strokeStyle = '#172433'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(bx, by - 12, 11, 0, 7); c.fill(); c.stroke();
        var tp = lift.z > 30 ? parcelTz(lift.z) : Teff()[0], te = lift.z > 30 ? envTz(lift.z) : Teff()[0];
        var warmer = tp > te + 0.05;
        c.textAlign = 'left'; c.font = '700 12px Pretendard Variable, Pretendard, sans-serif';
        var lab1 = T('공기덩어리 ', 'Parcel ') + tp.toFixed(1) + ' °C', lab2 = T('주변 ', 'Around ') + te.toFixed(1) + ' °C';
        var lab3 = lift.state === 'sink' ? T('↓ 주변보다 차가워 가라앉음', '↓ colder than its surroundings: sinks') : cond ? T('응결 → 구름', 'condensing → cloud') : T('↑ 들어 올려지는 중', '↑ being lifted');
        if (unstable && lift.z > (A.zlfc || 1e9)) lab3 = warmer ? T('↑ 주변보다 따뜻해 스스로 상승', '↑ warmer than its surroundings: rises freely') : lab3;
        c.fillStyle = 'rgba(255,255,255,.88)'; c.fillRect(bx + 16, by - 40, 190, 50);
        c.fillStyle = '#172433'; c.fillText(lab1, bx + 22, by - 24); c.font = '12px Pretendard Variable, Pretendard, sans-serif'; c.fillText(lab2, bx + 22, by - 9);
        c.fillStyle = lift.state === 'sink' ? '#2457a6' : '#c8452f'; c.font = '600 11px Pretendard Variable, Pretendard, sans-serif'; c.fillText(lab3, bx + 22, by + 5);
      }
      W = Wfull;
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- tooltips ---------------- */
  function tips(key) {
    var t = {
      diagram: [T('단열선도 (Skew-T log-P)', 'Skew-T log-P diagram'), [T('세로축은 기압(로그 눈금, 위로 갈수록 높은 곳), 가로축은 기온입니다. 등온선이 오른쪽 위로 <b>기울어져</b> 있어 “Skew-T”라고 부릅니다.', 'Pressure on the vertical axis (log scale, higher up = lower pressure), temperature across. Isotherms <b>slant</b> up to the right, hence “Skew-T”.'),
        T('<b>빨간 선</b>은 관측된 기온, <b>초록 선</b>은 이슬점, <b>검은 점선</b>은 지상에서 들어 올린 공기덩어리의 기온입니다. 점을 좌우로 끌어 관측값을 바꿀 수 있습니다(방향키 0.5 °C, Shift 5 °C).', '<b>Red</b>: observed temperature; <b>green</b>: dew point; <b>black dashed</b>: temperature of a parcel lifted from the surface. Drag the points left or right (arrow keys 0.5 °C, Shift 5 °C).'),
        T('보조선: 주황 실선 = 건조단열선, 초록 점선 = 습윤단열선, 보라 점선 = 혼합비선(1·2·4·8·16 g/kg). 주황 영역은 CAPE, 파란 영역은 CIN입니다.', 'Guides: orange = dry adiabats, green dashed = moist adiabats, purple dotted = mixing-ratio lines (1, 2, 4, 8, 16 g/kg). Orange area = CAPE, blue area = CIN.')]],
      levers: [T('조절 장치', 'Levers'), [T('지상 기온과 이슬점은 공기덩어리의 출발 조건입니다. “하층 습도”는 925–700 hPa 이슬점을, “상층 기온”은 500 hPa 위의 기온을 한꺼번에 올리거나 내립니다.', 'Surface temperature and dew point set the parcel’s starting point. “Low-level moisture” shifts the 925–700 hPa dew points; “upper-air temperature” shifts temperatures above 500 hPa.')]],
      lev_ts: [T('지상 기온', 'Surface temperature'), [T('햇볕으로 지면이 데워지면 공기덩어리가 더 따뜻하게 출발해 더 쉽게 떠오릅니다.', 'Sun-warmed ground starts the parcel warmer, so it rises more easily.')]],
      lev_td: [T('지상 이슬점', 'Surface dew point'), [T('공기 속 수증기량을 나타냅니다. 기온과 이슬점의 차이가 클수록 구름 밑면(LCL)이 높습니다(대략 1 °C당 125 m).', 'How much water vapour the air holds. The bigger the temperature–dew point gap, the higher the cloud base (about 125 m per °C).')]],
      lev_mo: [T('하층 습도', 'Low-level moisture'), [T('925–700 hPa 이슬점을 함께 바꿉니다. 이 층이 건조하면 구름 주변으로 건조한 공기가 섞여 들어 실제 대류가 약해지는데, 이 모델은 섞임을 계산하지 않으므로 그림의 이슬점선만 바뀝니다.', 'Shifts the 925–700 hPa dew points. Dry air here weakens real convection by mixing (entrainment); this model ignores mixing, so only the dew-point line changes.')]],
      lev_su: [T('상층 기온', 'Upper-air temperature'), [T('500 hPa 위의 기온을 바꿉니다. 상층이 차가워지면(한기 남하) 공기덩어리와의 기온 차가 커져 CAPE가 커집니다.', 'Shifts temperatures above 500 hPa. Colder air aloft (an upper-level cold pool) increases the parcel’s temperature excess and CAPE.')]],
      results: [T('결과', 'Results'), [T('지상 공기덩어리를 LCL까지 건조단열선(약 9.8 °C/km)을 따라, 그 위로는 습윤단열선을 따라 올렸을 때의 결과입니다.', 'The surface parcel is lifted along a dry adiabat (about 9.8 °C/km) to the LCL and along a moist adiabat above.'),
        T('교육용 단순화: 가온도 보정과 주변 공기의 섞임(유입)을 계산하지 않아 실제 CAPE보다 크게 나올 수 있습니다.', 'Simplified: no virtual-temperature correction and no entrainment, so CAPE can be larger than in reality.')]],
      stat_lcl: [T('구름 밑면 (LCL)', 'Cloud base (LCL)'), [T('상승응결고도: 공기덩어리가 들어 올려져 포화되는 높이, 곧 적운의 밑면입니다. Bolton(1980) 식으로 계산합니다.', 'Lifting condensation level: where a lifted parcel becomes saturated — the base of cumulus. Bolton (1980) formula.'), T('지금은 <b>' + Math.round(A.lcl.p) + ' hPa</b>, 기온 <b>' + A.lcl.T.toFixed(1) + ' °C</b>입니다.', 'Now <b>' + Math.round(A.lcl.p) + ' hPa</b> at <b>' + A.lcl.T.toFixed(1) + ' °C</b>.')]],
      stat_el: [T('구름 꼭대기 (EL)', 'Cloud top (EL)'), [T('평형고도: 공기덩어리가 다시 주변과 같은 기온이 되는 높이로, 대류운이 자랄 수 있는 대략의 꼭대기입니다. 자유대류고도가 없으면 “—”입니다.', 'Equilibrium level: where the parcel is again as cold as its surroundings — roughly how high convective cloud can grow. “—” if there is no free convection.')]],
      stat_cape: [T('CAPE', 'CAPE'), [T('대류가용잠재에너지: 자유대류고도(LFC)부터 평형고도(EL)까지 공기덩어리가 주변보다 따뜻한 정도를 합한 값으로, 단열선도의 주황 영역 넓이에 비례합니다.', 'Convective available potential energy: the parcel’s warmth relative to its surroundings summed from the LFC to the EL — proportional to the orange area.'),
        '<table><tr><th>CAPE (J/kg)</th><th>' + T('의미', 'Meaning') + '</th></tr><tr><td>0</td><td>' + T('안정', 'stable') + '</td></tr><tr><td>&lt; 1000</td><td>' + T('약한 불안정', 'weak') + '</td></tr><tr><td>1000–2500</td><td>' + T('불안정', 'moderate') + '</td></tr><tr><td>&gt; 2500</td><td>' + T('강한 불안정', 'strong') + '</td></tr></table>']],
      stat_cin: [T('CIN', 'CIN'), [T('대류억제에너지: 자유대류고도에 닿기 전까지 공기덩어리가 주변보다 차가워 이겨 내야 하는 에너지입니다(파란 영역). 클수록 대류가 시작되기 어렵습니다.', 'Convective inhibition: the energy needed to push the parcel through the layer where it is colder than its surroundings, below the LFC (blue area). The larger it is, the harder convection starts.')]],
      scene: [T('관측소 위의 하늘', 'The sky above the station'), [T('왼쪽 기둥은 계산된 LCL·LFC·EL 높이에 맞춰 구름을 그린 단면입니다(높이는 실제 비율). 공기덩어리가 자동으로 반복해 떠오르며 주변 공기와의 기온 차를 보여 줍니다. “처음부터”를 누르면 바로 다시 시작합니다.', 'The left column draws cloud at the computed LCL, LFC and EL, with heights to scale. The parcel rises again and again, comparing its temperature with the air around it; “Restart” starts it over at once.'),
        T('오른쪽은 계산 결과와 비슷한 하늘의 <b>실제 사진</b>입니다. 안정도·CAPE·구름 밑면 높이로 적란운, 탑상적운, 꼬리구름, 비구름, 역전층, 납작한 뭉게구름, 맑은 하늘 중 하나를 고릅니다. 사진 속 구름의 높이는 계산값과 다를 수 있습니다.', 'The right side is a <b>real photograph</b> of a similar sky, chosen from the stability, CAPE and cloud-base height: cumulonimbus, towering cumulus, virga, rain cloud, inversion, fair-weather cumulus or clear sky. Cloud heights in the photo may differ from the computed values.')]],
      scn: active ? [active.name, [active.text]] : [T('사용 방법', 'How to use'), [T('사례를 고르고 단열선도의 점을 움직여 보세요.', 'Choose a sounding and move the points.')]]
    };
    var v = t[key]; if (v && (key === 'diagram' || key === 'stat_cape')) v.wide = true; return v;
  }

  /* ---------------- intro: full-bleed photographs (Wikimedia Commons; credits in the footer and media/CREDITS.txt) ---------------- */
  var SND = SCN[1];
  var IPH = [
    { src: 'launch.jpg', fx: 0.6, fy: 0.35, cr: 'Launching a weather balloon · Yellowstone National Park (NPS) · public domain' },
    { src: 'radiosonde.jpg', fx: 0.5, fy: 0.5, cr: 'Vaisala RS92 and RS41 radiosondes · FW · CC BY-SA 4.0' },
    { src: 'congestus.jpg', fx: 0.55, fy: 0.45, cr: 'Cumulus congestus · Jacek Halicki · CC BY-SA 4.0' },
    { src: 'cumulonimbus.jpg', fx: 0.35, fy: 0.4, cr: 'Cumulonimbus incus over Warsaw · Kamil Nowacki · CC BY-SA 4.0' }
  ].map(function (p) { p.img = new Image(); p.img.src = 'media/' + p.src; return p; });
  var iPrev = -1, iCur = 0, iSwitch = 0;
  function iPhoto(c, w, h, p, age, alpha) {
    if (!p.img.complete || !p.img.naturalWidth) return;
    var iw = p.img.naturalWidth, ih = p.img.naturalHeight, z = 1.04 + Math.min(age, 14) * 0.006;
    var s2 = Math.max(w / iw, h / ih) * z, dw = iw * s2, dh = ih * s2;
    var x = Math.max(w - dw, Math.min(0, w / 2 - p.fx * dw)), y = Math.max(h - dh, Math.min(0, h / 2 - p.fy * dh));
    c.globalAlpha = alpha; c.drawImage(p.img, x, y, dw, dh); c.globalAlpha = 1;
  }
  var intro = CK.intro({
    key: 'ccrl-skewt-intro-seen',
    pages: [
      { kicker: T('매일 오전 9시', 'Every day at 9 a.m. (KST)'), title: T('풍선이 떠오릅니다', 'A balloon goes up'),
        text: T('전 세계 수백 곳의 고층기상관측소에서 같은 시각(협정세계시 0시와 12시)에 기상관측 풍선을 띄웁니다. 우리나라 시각으로 오전 9시와 밤 9시입니다.', 'At hundreds of upper-air stations around the world, weather balloons are launched at the same moments — 00 and 12 UTC, which is 9 a.m. and 9 p.m. in Korea.') },
      { kicker: T('라디오존데', 'Radiosonde'), title: T('하늘의 단면을 재다', 'Measuring a slice of the sky'),
        text: T('풍선에 매단 라디오존데가 20 km 넘게 올라가며 높이마다 <b>기온</b>과 <b>습도(이슬점)</b>, 바람을 무선으로 보내옵니다.', 'The radiosonde under the balloon climbs beyond 20 km, radioing back <b>temperature</b>, <b>humidity (dew point)</b> and wind at every height.') },
      { kicker: T('단열선도', 'The Skew-T diagram'), title: T('기울어진 그래프 위에', 'On a slanted chart'),
        text: T('예보관은 이 관측값을 단열선도에 그립니다. 그리고 지상의 공기덩어리를 들어 올리면 어디서 구름이 생기고, 얼마나 높이 솟을지 읽어 냅니다.', 'Forecasters plot these values on a Skew-T diagram, then imagine lifting a surface air parcel to read where cloud forms and how high it can grow.') },
      { kicker: 'CCRL Classroom', title: T('공기덩어리를 들어 올려 보세요', 'Lift an air parcel'),
        text: T('같은 지상 기온이라도 위쪽 공기의 상태에 따라 하늘은 맑기도, 뇌우가 치기도 합니다. 관측값을 바꿔 가며 그 차이를 직접 확인해 보세요.', 'With the same surface temperature, the air above decides between clear skies and thunderstorms. Change the sounding and see for yourself.') }
    ],
    draw: function (c, w, h, t, dt, page) {
      if (page !== iCur) { iPrev = iCur; iCur = page; iSwitch = t; }
      var k = Math.min(1, (t - iSwitch) / 0.9), age = t - iSwitch;
      c.fillStyle = '#0d1826'; c.fillRect(0, 0, w, h);
      if (iPrev >= 0 && k < 1) iPhoto(c, w, h, IPH[iPrev], age + 6, 1);
      iPhoto(c, w, h, IPH[iCur], age, iPrev >= 0 ? k : 1);
      var g = c.createLinearGradient(0, h * 0.35, 0, h); g.addColorStop(0, 'rgba(6,12,20,0)'); g.addColorStop(1, 'rgba(6,12,20,.6)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      var g2 = c.createLinearGradient(0, 0, w * 0.6, 0); g2.addColorStop(0, 'rgba(6,12,20,.32)'); g2.addColorStop(1, 'rgba(6,12,20,0)');
      c.fillStyle = g2; c.fillRect(0, 0, w, h);
      // one quiet readout per page, on a glass card at the upper right
      var fa = Math.min(1, Math.max(0, (age - 0.5) / 0.6)), cw = Math.min(400, w * 0.32), cx = w - cw - Math.max(16, w * 0.06), cy = Math.max(16, h * 0.1), u = cw / 400;
      var F = 'Pretendard Variable, Pretendard, sans-serif';
      function card(hh) { c.fillStyle = 'rgba(8,16,28,.66)'; c.beginPath(); if (c.roundRect) c.roundRect(cx, cy, cw, hh, 12); else c.rect(cx, cy, cw, hh); c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.stroke(); }
      c.globalAlpha = fa; c.textAlign = 'left';
      if (page === 0) {
        card(96 * u);
        c.fillStyle = 'rgba(220,232,245,.8)'; c.font = '600 ' + Math.round(14 * u) + 'px ' + F; c.fillText(T('관측 시각 (협정세계시)', 'Launch times (UTC)'), cx + 24 * u, cy + 34 * u);
        c.fillStyle = '#fff'; c.font = '700 ' + Math.round(28 * u) + 'px ' + F; c.fillText('00 · 12 UTC', cx + 24 * u, cy + 72 * u);
      } else if (page === 1) {                                   // live readout of a rising sonde
        var rise = Math.min(1, ((age * 0.09) % 1.15)), zkm = rise * 16, p = Math.round(1000 * Math.exp(-zkm / 7.4));
        var Tt = C.envAt(SND.T, p), Td = C.envAt(SND.Td, p);
        card(150 * u);
        c.fillStyle = 'rgba(220,232,245,.8)'; c.font = '600 ' + Math.round(14 * u) + 'px ' + F; c.fillText(T('라디오존데 수신값', 'Radiosonde data'), cx + 24 * u, cy + 34 * u);
        c.fillStyle = '#fff'; c.font = '700 ' + Math.round(24 * u) + 'px ' + F; c.fillText(zkm.toFixed(1) + ' km · ' + p + ' hPa', cx + 24 * u, cy + 70 * u);
        c.font = '700 ' + Math.round(20 * u) + 'px ' + F;
        c.fillStyle = '#ff9b85'; c.fillText(T('기온 ', 'Temp ') + Tt.toFixed(1) + ' °C', cx + 24 * u, cy + 104 * u);
        c.fillStyle = '#8fe0a5'; c.fillText(T('이슬점 ', 'Dew point ') + Td.toFixed(1) + ' °C', cx + 24 * u, cy + 134 * u);
      } else if (page === 2) {
        card(150 * u);
        c.fillStyle = 'rgba(220,232,245,.8)'; c.font = '600 ' + Math.round(14 * u) + 'px ' + F; c.fillText(T('단열선도에서 읽어 내는 것', 'Read from the diagram'), cx + 24 * u, cy + 34 * u);
        [[T('구름 밑면', 'Cloud base'), '1.1 km'], [T('구름 꼭대기', 'Cloud top'), '13.0 km'], ['CAPE', '3524 J/kg']].forEach(function (r, i) {
          var yy = cy + (70 + i * 30) * u;
          c.textAlign = 'left'; c.fillStyle = 'rgba(220,232,245,.85)'; c.font = '600 ' + Math.round(16 * u) + 'px ' + F; c.fillText(r[0], cx + 24 * u, yy);
          c.textAlign = 'right'; c.fillStyle = i === 2 ? '#f2a46a' : '#fff'; c.font = '700 ' + Math.round(20 * u) + 'px ' + F; c.fillText(r[1], cx + cw - 24 * u, yy);
        });
      }
      c.globalAlpha = 1;
      c.font = '500 11px ' + F; c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.75)';
      c.fillText(T('사진: ', 'Photo: ') + IPH[iCur].cr, w - 14, h - 12);
    },
    onClose: function () { tour.maybeStart(); }
  });
  var tour = CK.tour({
    key: 'ccrl-skewt-tour-seen',
    steps: [
      { sel: '#pScn', title: T('① 관측 사례', '① Soundings'), text: T('겨울 역전층부터 여름 뇌우까지 다섯 가지 대표 사례입니다. 누르면 그 날의 관측값이 단열선도에 그려집니다.', 'Five typical cases, from a winter inversion to a summer thunderstorm. Each one plots that day’s sounding.') },
      { sel: '#pDiag', title: T('② 단열선도', '② Skew-T diagram'), text: T('빨간 점(기온)과 초록 점(이슬점)을 좌우로 끌어 관측값을 바꿔 보세요. 검은 점선이 들어 올린 공기덩어리, 주황 영역이 CAPE입니다.', 'Drag the red (temperature) and green (dew point) points. The black dashed line is the lifted parcel; the orange area is CAPE.') },
      { sel: '#pLev', title: T('레버', 'Levers'), text: T('지상 기온·이슬점, 하층 습도, 상층 기온을 한 번에 바꿉니다. 보조선 버튼으로 단열선을 숨길 수 있습니다.', 'Change surface temperature and dew point, low-level moisture and upper-air temperature. The guide-line button hides the adiabats.') },
      { sel: '#pStats', title: T('③ 결과', '③ Results'), text: T('구름 밑면(LCL), 구름 꼭대기(EL), CAPE, CIN과 안정도 판정이 바로 계산됩니다. ⓘ에 자세한 설명이 있습니다.', 'Cloud base (LCL), cloud top (EL), CAPE, CIN and a stability verdict update instantly. See ⓘ for details.') },
      { sel: '#pScene', title: T('관측소 위의 하늘', 'The sky above the station'), text: T('계산한 높이에 구름이 그려지고, 공기덩어리가 떠오르며 주변보다 따뜻한지 차가운지 보여 줍니다.', 'Clouds appear at the computed heights, and the rising parcel shows whether it is warmer or colder than its surroundings.') },
      { sel: '.ck-top-tools', title: T('언제든 다시', 'Any time'), text: T('사용법과 인트로를 다시 보거나 언어를 바꿀 수 있습니다.', 'Replay the guide or intro, or switch language.') }
    ]
  });

  /* ---------------- init ---------------- */
  CK.initTips(tips);
  buildScenarios(); buildLevers(); buildStats();
  document.getElementById('tourBtn').addEventListener('click', function () { tour.start(); });
  document.getElementById('introBtn').addEventListener('click', function () { intro.open(); });
  document.getElementById('langBtn').addEventListener('click', function () { CK.setLang(EN ? 'ko' : 'en', { S: S, scn: active && active.id, modified: modified }, STATE_KEY); });
  function layout() { buildDiag(); resizeScene(); recompute(); }
  setPressed(); renderCard();
  layout();
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
  requestAnimationFrame(frame);
  intro.start();
  window.__skewt = { get A() { return A; }, get S() { return S; }, pick: function (id) { document.querySelector('#scnList [data-id="' + id + '"]').click(); }, intro: intro, tour: tour };
})();
