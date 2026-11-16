/* CCRL Classroom — GHG inventory calculator: UI */
(function () {
  'use strict';
  var CK = window.CK, T = CK.T, EN = CK.EN, G = window.GhgCore, clamp = CK.clamp, el = CK.svg;
  var STATE_KEY = 'ccrl-ghg-state';
  var GAS = [['co2', 'CO₂'], ['ch4', 'CH₄'], ['n2o', 'N₂O'], ['hfc', 'HFC-134a']];
  var GAS_COL = { co2: '#4b5d6b', ch4: '#c9822f', n2o: '#8a5aa8', hfc: '#2f8fb0' };
  var META = {
    elec: { name: T('전력 사용', 'Electricity'), sub: T('외부에서 산 전기 (Scope 2)', 'purchased electricity (Scope 2)'), max: 40000, group: 2 },
    lng: { name: T('도시가스 (LNG)', 'City gas (LNG)'), sub: T('난방·급탕 보일러', 'heating boilers'), max: 3000000, group: 1 },
    dsl_s: { name: T('경유 (고정연소)', 'Diesel (stationary)'), sub: T('보일러·비상발전기', 'boilers, generators'), max: 100000, group: 1 },
    gas_m: { name: T('휘발유 (차량)', 'Gasoline (vehicles)'), sub: T('승용차', 'cars'), max: 50000, group: 1 },
    dsl_m: { name: T('경유 (차량·농기계)', 'Diesel (vehicles, machinery)'), sub: T('버스·트럭·트랙터', 'buses, trucks, tractors'), max: 50000, group: 1 },
    hfc: { name: T('냉매 누출 (HFC-134a)', 'Refrigerant leaks (HFC-134a)'), sub: T('에어컨·냉장 설비 보충량', 'top-up of AC and chillers'), max: 300, group: 1 },
    fert: { name: T('질소 비료', 'Nitrogen fertiliser'), sub: T('뿌린 질소량', 'nitrogen applied'), max: 10000, group: 1 },
    dairy: { name: T('젖소', 'Dairy cattle'), sub: T('장내 발효 메탄', 'enteric methane'), max: 500, group: 1 },
    beef: { name: T('한우·육우', 'Beef cattle'), sub: T('장내 발효 메탄', 'enteric methane'), max: 500, group: 1 }
  };
  var UNIT = { elec: 'MWh', lng: 'Nm³', dsl_s: 'L', gas_m: 'L', dsl_m: 'L', hfc: 'kg', fert: 'kg N', dairy: T('마리', 'head'), beef: T('마리', 'head') };
  var SCN = [
    { id: 'campus', name: T('대학 캠퍼스', 'University campus'), sub: T('학생 1만 명 규모', 'about 10,000 students'),
      a: { elec: 30000, lng: 2500000, dsl_s: 20000, gas_m: 30000, dsl_m: 25000, hfc: 150, fert: 500 },
      sum: T('전력(Scope 2)이 전체의 약 3분의 2 → 캠퍼스 감축은 전력에서 시작합니다.', 'Electricity (Scope 2) is about two thirds of the total → campus cuts start with power.'),
      text: T('강의동·연구실·기숙사를 가진 중형 대학을 가정한 연간 활동자료입니다. 냉난방과 실험 장비 때문에 전력 비중이 큽니다.', 'Annual activity data for a mid-sized university with lecture halls, labs and dormitories. Heating, cooling and lab equipment make electricity dominant.'),
      q: T('재생에너지 전력 비율 슬라이더를 50%로 올리면 총배출은 몇 % 줄어드나요? 왜 그만큼일까요?', 'Raise renewable electricity to 50%. By what percentage does the total fall, and why?') },
    { id: 'home', name: T('4인 가정', 'Family of four'), sub: T('아파트 한 가구', 'one apartment'),
      a: { elec: 4, lng: 1000, gas_m: 1200, hfc: 0.2 },
      sum: T('자동차 휘발유와 난방 가스가 전기보다 큰 몫 → 한 가구 약 7 tCO₂eq/년.', 'Car fuel and heating gas outweigh electricity → about 7 tCO₂eq a year.'),
      text: T('월 330 kWh 정도의 전기, 겨울 난방용 도시가스, 승용차 한 대(연 약 1만 5천 km)를 가정했습니다. 에어컨 냉매가 조금씩 새는 것도 포함했습니다.', 'About 330 kWh of electricity a month, city gas for winter heating and one car (about 15,000 km a year), plus a small refrigerant leak from the air conditioner.'),
      q: T('가장 큰 배출원은 무엇인가요? 우리 집이라면 무엇부터 줄일 수 있을까요?', 'What is the largest source? What could your household cut first?') },
    { id: 'factory', name: T('소규모 공장', 'Small factory'), sub: T('금속 가공', 'metal processing'),
      a: { elec: 5000, lng: 800000, dsl_s: 50000, gas_m: 5000, dsl_m: 30000, hfc: 80 },
      sum: T('연료 직접 연소(Scope 1)와 전력(Scope 2)이 비슷 → 둘 다 관리해야 합니다.', 'Direct fuel use (Scope 1) and electricity (Scope 2) are similar → both need managing.'),
      text: T('열처리로에 도시가스를, 지게차·트럭에 경유를 쓰는 소규모 금속 가공 공장입니다. 냉동 설비의 냉매 누출도 무시하기 어렵습니다.', 'A small metal-processing plant using city gas in furnaces and diesel in forklifts and trucks. Refrigerant leaks from chillers also matter.'),
      q: T('GWP 기준을 AR5 100년에서 AR6 20년으로 바꾸면 냉매 누출의 몫은 어떻게 변하나요?', 'Switch GWP from AR5 100-year to AR6 20-year. How does the share of refrigerant leaks change?') },
    { id: 'farm', name: T('한우 농가', 'Beef farm'), sub: T('한우 200마리', '200 cattle'),
      a: { elec: 150, dsl_m: 8000, fert: 5000, beef: 200 },
      sum: T('배출의 대부분이 소의 메탄 → GWP 기준(20년/100년)에 따라 총량이 크게 달라집니다.', 'Most emissions are cattle methane → the total depends strongly on the GWP time horizon (20 vs 100 years).'),
      text: T('한우 200마리를 키우고 사료 작물에 질소 비료를 주는 농가입니다. 소의 장내 발효로 생기는 메탄이 가장 큰 배출원입니다.', 'A farm with 200 beef cattle that fertilises its feed crops. Enteric methane from the cattle is the largest source.'),
      q: T('GWP를 100년 기준에서 20년 기준으로 바꾸면 총배출이 몇 배가 되나요? 메탄에 왜 이런 차이가 날까요?', 'Switch from the 100-year to the 20-year GWP. How many times larger is the total? Why does methane behave like this?') },
    { id: 'blank', name: T('직접 입력', 'Your own'), sub: T('빈 계산표', 'empty sheet'), a: {},
      sum: T('모든 값을 0에서 시작합니다. 우리 학과나 동아리의 연간 사용량을 넣어 보세요.', 'Everything starts at zero. Enter your department’s or club’s annual use.'),
      text: T('고지서나 관리 자료에서 연간 사용량을 찾아 입력해 보세요. 전기는 kWh를 1,000으로 나누면 MWh입니다.', 'Find annual use from bills or facility records. Divide kWh by 1,000 to get MWh.'),
      q: T('입력한 자료 가운데 가장 불확실한 값은 무엇인가요? 그 값이 결과에 얼마나 영향을 주나요?', 'Which of your inputs is the most uncertain, and how much does it affect the result?') }
  ];
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var DEF = { a: clone(SCN[0].a), g: 1, green: 0, cut: 0, sel: 'elec' };
  var S = clone(DEF), R = null, active = SCN[0], modified = false;
  var saved = CK.takeState(STATE_KEY);
  if (saved && saved.S) { S = saved.S; active = SCN.filter(function (x) { return x.id === saved.scn; })[0] || null; modified = !!saved.modified; }
  function gkey() { return G.GWP_KEYS[S.g]; }
  function recompute() { R = G.calc(S.a, gkey(), { green: S.green, leakCut: S.cut }); syncRows(); drawBars(); drawStats(); drawTrace(); drawPine(); syncSliders(); }
  function userChanged() { if (active && !modified) { modified = true; renderCard(); } recompute(); }
  function fmt(v, d) { if (d == null) d = v >= 100 ? 0 : v >= 10 ? 1 : v >= 1 ? 2 : 3; return v.toLocaleString(EN ? 'en-US' : 'ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* ---------------- activity rows ---------------- */
  var rowEls = {};
  function buildRows() {
    var wrap = document.getElementById('pRows'), lastG = null;
    G.ROWS.forEach(function (row) {
      var m = META[row.id];
      if (m.group !== lastG) { var h = document.createElement('div'); h.className = 'gh-group'; h.textContent = m.group === 2 ? T('간접 배출 (Scope 2)', 'Indirect (Scope 2)') : T('직접 배출 (Scope 1)', 'Direct (Scope 1)'); wrap.appendChild(h); lastG = m.group; }
      var d = document.createElement('div'); d.className = 'gh-row'; d.dataset.id = row.id;
      d.innerHTML = '<div class="nm"><span class="sc' + (row.scope === 2 ? ' s2' : '') + '">S' + row.scope + '</span><span>' + m.name + '<small>' + m.sub + '</small></span></div>' +
        '<input type="range" min="0" max="1000" step="1" aria-label="' + m.name + '">' +
        '<div class="num"><input type="number" min="0" step="any" aria-label="' + m.name + ' (' + UNIT[row.id] + ')"><span class="u">' + UNIT[row.id] + '</span></div>';
      CK.info(d.querySelector('.nm'), 'row_' + row.id, m.name);
      var rg = d.querySelector('input[type=range]'), nb = d.querySelector('input[type=number]');
      rg.addEventListener('input', function () { S.a[row.id] = sliderToVal(row.id, +rg.value); S.sel = row.id; userChanged(); });
      nb.addEventListener('change', function () { S.a[row.id] = Math.max(0, +nb.value || 0); S.sel = row.id; userChanged(); });
      d.addEventListener('click', function (e) { if (e.target.closest('button')) return; S.sel = row.id; syncRows(); drawBars(); drawTrace(); });
      wrap.appendChild(d); rowEls[row.id] = { row: d, rg: rg, nb: nb };
    });
  }
  // slider is logarithmic so small and large facilities both fit
  function sliderToVal(id, s) { if (s <= 0) return 0; var mx = META[id].max, v = Math.pow(10, Math.log10(mx) * s / 1000 - 0) ; v = v * (1 + 0) ; return roundNice(Math.min(mx, v)); }
  function valToSlider(id, v) { if (!(v > 0)) return 0; return clamp(Math.round(Math.log10(Math.max(1, v)) / Math.log10(META[id].max) * 1000), 0, 1000); }
  function roundNice(v) { if (v < 1) return Math.round(v * 10) / 10; var e = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / e) * e; }
  function syncRows() {
    G.ROWS.forEach(function (row) {
      var o = rowEls[row.id], v = S.a[row.id] || 0;
      if (document.activeElement !== o.nb) o.nb.value = v;
      if (document.activeElement !== o.rg) o.rg.value = valToSlider(row.id, v);
      o.row.classList.toggle('sel', S.sel === row.id);
    });
  }

  /* ---------------- bars ---------------- */
  var B = { svg: document.getElementById('bars') };
  function drawBars() {
    if (!R) return;
    var s = B.svg, r = s.getBoundingClientRect(); B.w = r.width; B.h = r.height;
    s.setAttribute('viewBox', '0 0 ' + B.w + ' ' + B.h); s.innerHTML = '';
    var rows = G.ROWS.filter(function (row) { return (R.rows[row.id].total || 0) > 0; }).sort(function (a, b) { return R.rows[b.id].total - R.rows[a.id].total; });
    if (!rows.length) { el('text', { x: B.w / 2, y: B.h / 2, 'text-anchor': 'middle', 'class': 'ax' }, s).textContent = T('활동자료를 입력하면 막대가 나타납니다.', 'Enter activity data to see the bars.'); return; }
    var L = 170, Rm = 70, top = 6, rowH = Math.min(30, (B.h - top - 22) / rows.length), mx = R.rows[rows[0].id].total;
    var nice = niceMax(mx);
    for (var k = 0; k <= 4; k++) { var x = L + k / 4 * (B.w - L - Rm); el('line', { x1: x, x2: x, y1: top, y2: top + rowH * rows.length, 'class': 'grid' }, s); el('text', { x: x, y: B.h - 6, 'text-anchor': 'middle', 'class': 'ax' }, s).textContent = fmt(nice * k / 4, 0); }
    rows.forEach(function (row, i) {
      var y = top + i * rowH, rr = R.rows[row.id], x0 = L;
      if (S.sel === row.id) el('rect', { x: 0, y: y, width: B.w, height: rowH, 'class': 'bar-sel' }, s);
      el('text', { x: L - 8, y: y + rowH / 2 + 4, 'text-anchor': 'end', 'class': 'bar-lab' }, s).textContent = META[row.id].name;
      GAS.forEach(function (gs) {
        var v = rr.eq[gs[0]]; if (!(v > 0)) return;
        var wpx = v / nice * (B.w - L - Rm);
        el('rect', { x: x0, y: y + rowH * 0.18, width: Math.max(0.5, wpx), height: rowH * 0.64, fill: GAS_COL[gs[0]], rx: 2 }, s);
        x0 += wpx;
      });
      el('text', { x: x0 + 6, y: y + rowH / 2 + 4, 'class': 'bar-val' }, s).textContent = fmt(rr.total) + ' (' + Math.round(rr.total / R.total * 100) + '%)';
      var hit = el('rect', { x: 0, y: y, width: B.w, height: rowH, 'class': 'bar-hit' }, s);
      hit.addEventListener('click', function () { S.sel = row.id; syncRows(); drawBars(); drawTrace(); });
    });
  }
  function niceMax(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; }

  /* ---------------- stats ---------------- */
  var statDD = {};
  function buildStats() {
    var defs = [['total', 'hot', T('총배출량', 'Total')], ['s1', '', T('직접 (Scope 1)', 'Direct (Scope 1)')], ['s2', '', T('간접 (Scope 2)', 'Indirect (Scope 2)')], ['top', '', T('가장 큰 배출원', 'Largest source')]];
    var dl = document.getElementById('stats');
    defs.forEach(function (d) {
      var box = document.createElement('div'); box.className = 'ck-stat ' + d[1];
      var dt = document.createElement('dt'); dt.textContent = d[2]; var dd = document.createElement('dd');
      box.appendChild(dt); box.appendChild(dd); dl.appendChild(box); CK.info(dt, 'stat_' + d[0], d[2]); statDD[d[0]] = dd;
    });
    document.getElementById('legend').innerHTML = GAS.map(function (gs) { return '<span><i style="background:' + GAS_COL[gs[0]] + '"></i>' + gs[1] + '</span>'; }).join('');
  }
  function drawStats() {
    statDD.total.textContent = fmt(R.total) + ' t';
    statDD.s1.textContent = fmt(R.s1) + ' t';
    statDD.s2.textContent = fmt(R.s2) + ' t';
    var best = null; G.ROWS.forEach(function (row) { if (!best || R.rows[row.id].total > R.rows[best].total) best = row.id; });
    statDD.top.textContent = R.total > 0 ? META[best].name : '—';
  }

  /* ---------------- calculation trace ---------------- */
  function drawTrace() {
    var row = G.ROWS.filter(function (x) { return x.id === S.sel; })[0], rr = R.rows[row.id], st = rr.steps, m = META[row.id], g = G.GWP[gkey()];
    var h = '<h4>' + m.name + '</h4>';
    if (!st) { document.getElementById('trace').innerHTML = h + '<p>' + T('이 항목의 활동자료가 0입니다. 값을 넣으면 계산 과정이 나타납니다.', 'This item is zero. Enter a value to see the calculation.') + '</p>'; return; }
    function line(lab, mid, val) { return '<span>' + lab + '</span><span>' + mid + '</span><span>' + val + '</span>'; }
    var rows = '';
    if (st.type === 'elec') {
      rows += line(T('사용량', 'Use'), fmt(st.amount) + ' MWh' + (st.green ? ' × (1 − ' + Math.round(st.green * 100) + '% ' + T('재생', 'renewable') + ')' : ''), fmt(st.mwh) + ' MWh');
      rows += line('<i class="g" style="background:' + GAS_COL.co2 + '"></i>' + T('배출', 'Emissions'), '× ' + st.ef + ' tCO₂eq/MWh', fmt(st.total) + ' t');
    } else if (st.type === 'fuel') {
      rows += line(T('에너지', 'Energy'), fmt(st.amount) + ' ' + UNIT[row.id] + ' × ' + st.ncv + ' MJ', fmt(st.tj, 3) + ' TJ');
      rows += line('<i class="g" style="background:' + GAS_COL.co2 + '"></i>CO₂', '× ' + fmt(st.ef.co2, 0) + ' kg/TJ', fmt(rr.eq.co2) + ' t');
      rows += line('<i class="g" style="background:' + GAS_COL.ch4 + '"></i>CH₄', '× ' + st.ef.ch4 + ' kg/TJ × GWP ' + g.ch4f, fmt(rr.eq.ch4) + ' t');
      rows += line('<i class="g" style="background:' + GAS_COL.n2o + '"></i>N₂O', '× ' + st.ef.n2o + ' kg/TJ × GWP ' + g.n2o, fmt(rr.eq.n2o) + ' t');
    } else if (st.type === 'hfc') {
      rows += line(T('누출량', 'Leak'), fmt(st.amount) + ' kg' + (st.cut ? ' × (1 − ' + Math.round(st.cut * 100) + '%)' : ''), fmt(st.kg) + ' kg');
      rows += line('<i class="g" style="background:' + GAS_COL.hfc + '"></i>HFC-134a', '× GWP ' + st.gwp, fmt(rr.eq.hfc) + ' t');
    } else if (st.type === 'fert') {
      rows += line('N₂O-N', fmt(st.amount) + ' kg N × ' + st.ef, fmt(st.amount * st.ef) + ' kg');
      rows += line('N₂O', '× 44/28', fmt(rr.n2o * 1000) + ' kg');
      rows += line('<i class="g" style="background:' + GAS_COL.n2o + '"></i>CO₂eq', '× GWP ' + st.gwp, fmt(rr.eq.n2o) + ' t');
    } else if (st.type === 'cattle') {
      rows += line('CH₄', fmt(st.amount, 0) + ' ' + UNIT[row.id] + ' × ' + st.ef + ' kg', fmt(rr.ch4 * 1000) + ' kg');
      rows += line('<i class="g" style="background:' + GAS_COL.ch4 + '"></i>CO₂eq', '× GWP ' + st.gwp + (g.ch4f !== g.ch4b ? T(' (생물기원)', ' (biogenic)') : ''), fmt(rr.eq.ch4) + ' t');
    }
    h += '<div class="eq">' + rows + '</div><div class="tot"><span>' + T('합계', 'Total') + '</span><span>' + fmt(rr.total) + ' tCO₂eq</span></div>';
    document.getElementById('trace').innerHTML = h;
  }

  /* ---------------- pine trees ---------------- */
  var pc = document.getElementById('pine'), pctx = pc.getContext('2d');
  function drawPine() {
    var r = pc.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); if (!r.width) return;
    pc.width = Math.round(r.width * dpr); pc.height = Math.round(r.height * dpr);
    var c = pctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var w = r.width, h = r.height, trees = R.total * 1000 / G.PINE;
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e6efe2'); g.addColorStop(1, '#cfdcc6'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    var per = 1; while (trees / per > 60) per *= 10;
    var n = Math.min(60, Math.round(trees / per)), cols = 15, sz = Math.min((w - 20) / cols, (h - 16) / 4);
    for (var i = 0; i < n; i++) {
      var x = 10 + (i % cols) * sz + sz / 2, y = 8 + Math.floor(i / cols) * sz + sz;
      c.fillStyle = '#6b4b2e'; c.fillRect(x - sz * 0.05, y - sz * 0.22, sz * 0.1, sz * 0.22);
      c.fillStyle = '#2f6b45';
      for (var k = 0; k < 3; k++) { var yy = y - sz * 0.2 - k * sz * 0.22, ww = sz * (0.42 - k * 0.1); c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x, yy - sz * 0.34); c.lineTo(x + ww, yy); c.closePath(); c.fill(); }
    }
    document.getElementById('pineText').innerHTML = R.total > 0 ? T('30년생 소나무 <b>' + fmt(trees, 0) + '그루</b>가 1년 동안 흡수하는 양입니다. (그림 1그루 = ' + fmt(per, 0) + '그루)',
      'What <b>' + fmt(trees, 0) + ' thirty-year-old pine trees</b> absorb in a year. (1 icon = ' + fmt(per, 0) + ' trees)') : '';
  }

  /* ---------------- sliders ---------------- */
  var GWP_SHORT = ['SAR 100', 'AR5 100', 'AR6 100', T('AR6 20년', 'AR6 20-yr')];
  var LEV = [
    { label: T('GWP 기준', 'GWP basis'), min: 0, max: 3, step: 1, seg: true, tip: 'lev_gwp', fmt: function (v) { return GWP_SHORT[v]; }, get: function () { return S.g; }, set: function (v) { S.g = v; } },
    { label: T('재생에너지 전력', 'Renewable power'), min: 0, max: 100, step: 5, tip: 'lev_green', marks: [{ v: 10, label: T('한국 2023 ≈10%', 'Korea 2023 ≈10%') }], fmt: function (v) { return v + '%'; }, get: function () { return Math.round(S.green * 100); }, set: function (v) { S.green = v / 100; } },
    { label: T('냉매 누출 저감', 'Leak reduction'), min: 0, max: 100, step: 10, tip: 'lev_cut', fmt: function (v) { return v + '%'; }, get: function () { return Math.round(S.cut * 100); }, set: function (v) { S.cut = v / 100; } }
  ];
  var levs = [];
  function buildSliders() { var wrap = document.getElementById('levers'); LEV.forEach(function (L) { levs.push(CK.lever(wrap, L, L.get, function (v) { L.set(v); userChanged(); })); }); }
  function syncSliders() { levs.forEach(function (l) { l.sync(); }); }

  /* ---------------- scenarios ---------------- */
  function buildScenarios() {
    var list = document.getElementById('scnList');
    SCN.forEach(function (sc) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ck-scn'; b.dataset.id = sc.id; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<b>' + sc.name + '</b><span>' + sc.sub + '</span>';
      b.addEventListener('click', function () { active = sc; modified = false; S.a = clone(sc.a); S.green = 0; S.cut = 0; S.sel = topSource(); setPressed(); renderCard(); recompute(); });
      list.appendChild(b);
    });
    document.getElementById('resetBtn').addEventListener('click', function () { S = clone(DEF); active = SCN[0]; modified = false; setPressed(); renderCard(); recompute(); });
  }
  function topSource() { var r = G.calc(S.a, gkey(), {}), best = 'elec'; G.ROWS.forEach(function (row) { if (r.rows[row.id].total > r.rows[best].total) best = row.id; }); return best; }
  function setPressed() { document.querySelectorAll('#scnList .ck-scn').forEach(function (b) { b.setAttribute('aria-pressed', active && b.dataset.id === active.id ? 'true' : 'false'); }); }
  function renderCard() {
    var c = document.getElementById('scnCard'), sc = active;
    c.innerHTML = '<div class="ck-card-main"><h3>' + (sc ? sc.name : '') + '</h3><span class="dash">|</span><p>' + (sc ? sc.sum : '') + '</p></div><div class="ck-q"><b>' + T('질문', 'Question') + '</b><span>' + (sc ? sc.q : '') + '</span></div>';
    var main = c.querySelector('.ck-card-main'); CK.info(main, 'scn', sc ? sc.name : '');
    if (modified) { var bd = document.createElement('span'); bd.className = 'ck-badge'; bd.textContent = T('직접 조절 중', 'Adjusted'); main.appendChild(bd); }
  }

  /* ---------------- tooltips ---------------- */
  function tips(key) {
    var g = G.GWP[gkey()];
    var gwpTbl = '<table><tr><th></th><th>CH₄</th><th>N₂O</th><th>HFC-134a</th></tr>' + G.GWP_KEYS.map(function (k, i) { var x = G.GWP[k]; return '<tr><td>' + GWP_SHORT[i] + '</td><td>' + (x.ch4f === x.ch4b ? x.ch4f : x.ch4f + ' / ' + x.ch4b) + '</td><td>' + x.n2o + '</td><td>' + x.hfc + '</td></tr>'; }).join('') + '</table>';
    var t = {
      inputs: [T('활동자료', 'Activity data'), [T('1년 동안 사용하거나 배출한 양입니다. 숫자를 직접 입력하거나 막대를 움직이세요(막대는 로그 눈금이라 작은 값과 큰 값을 모두 맞출 수 있습니다). 항목을 누르면 오른쪽 “계산 따라가기”에 계산 과정이 나타납니다.', 'What was used or released in one year. Type a number or move the slider (logarithmic, so small and large values both fit). Click an item to see its calculation on the right.'),
        T('<b>Scope 1</b>은 조직이 직접 태우거나 내보낸 배출, <b>Scope 2</b>는 사 온 전기를 만들 때 발전소에서 나온 간접 배출입니다.', '<b>Scope 1</b>: emissions the organisation releases directly. <b>Scope 2</b>: indirect emissions from generating the electricity it buys.')]],
      row_elec: [META.elec.name, [T('국가 전력 배출계수 <b>' + G.GRID + ' tCO₂eq/MWh</b>(2023년)를 곱합니다. 발전원 구성에 따라 매년 바뀝니다.', 'Multiplied by the national power emission factor <b>' + G.GRID + ' tCO₂eq/MWh</b> (2023), which changes each year with the generation mix.')]],
      row_lng: [META.lng.name, [T('순발열량 38.5 MJ/Nm³로 에너지(TJ)를 구한 뒤 IPCC 기본 배출계수(CO₂ 56,100, CH₄ 5, N₂O 0.1 kg/TJ)를 곱합니다.', 'Energy (TJ) from a net calorific value of 38.5 MJ/Nm³, times IPCC defaults (CO₂ 56,100, CH₄ 5, N₂O 0.1 kg/TJ).')]],
      row_dsl_s: [META.dsl_s.name, [T('35.2 MJ/L, IPCC 기본값 CO₂ 74,100, CH₄ 10, N₂O 0.6 kg/TJ(상업·공공 고정연소).', '35.2 MJ/L; IPCC defaults CO₂ 74,100, CH₄ 10, N₂O 0.6 kg/TJ (commercial stationary).')]],
      row_gas_m: [META.gas_m.name, [T('30.3 MJ/L, IPCC 도로수송 기본값 CO₂ 69,300, CH₄ 33, N₂O 3.2 kg/TJ.', '30.3 MJ/L; IPCC road transport defaults CO₂ 69,300, CH₄ 33, N₂O 3.2 kg/TJ.')]],
      row_dsl_m: [META.dsl_m.name, [T('35.2 MJ/L, IPCC 도로수송 기본값 CO₂ 74,100, CH₄ 3.9, N₂O 3.9 kg/TJ.', '35.2 MJ/L; IPCC road transport defaults CO₂ 74,100, CH₄ 3.9, N₂O 3.9 kg/TJ.')]],
      row_hfc: [META.hfc.name, [T('설비에 새로 보충한 냉매량을 누출량으로 봅니다. 1 kg이 CO₂ 약 1,300–4,100 kg과 같은 온난화 효과를 냅니다(GWP 기준에 따라).', 'Refrigerant topped up is taken as the leak. One kilogram warms like about 1,300–4,100 kg of CO₂, depending on the GWP basis.')]],
      row_fert: [META.fert.name, [T('뿌린 질소의 1%가 N₂O-N으로 직접 배출된다고 봅니다(IPCC EF1 = 0.01). N₂O 질량은 ×44/28로 환산합니다.', '1% of the nitrogen applied is emitted directly as N₂O-N (IPCC EF1 = 0.01); converted to N₂O mass by ×44/28.')]],
      row_dairy: [META.dairy.name, [T('IPCC Tier 1 아시아 기본값: 젖소 1마리당 연 68 kg CH₄(장내 발효).', 'IPCC Tier 1 default for Asia: 68 kg CH₄ per dairy cow per year (enteric).')]],
      row_beef: [META.beef.name, [T('IPCC Tier 1 아시아 기본값: 기타 소 1마리당 연 47 kg CH₄(장내 발효). 분뇨 관리 배출은 포함하지 않았습니다.', 'IPCC Tier 1 default for Asia: 47 kg CH₄ per head per year (enteric). Manure emissions are not included.')]],
      levers: [T('기준과 감축 조치', 'Settings and reductions'), [T('GWP 기준을 바꾸면 같은 활동자료라도 CO₂ 환산량이 달라집니다. 재생에너지 전력과 냉매 누출 저감은 대표적인 감축 조치입니다.', 'Changing the GWP basis changes the CO₂-equivalent of the same activity. Renewable power and leak reduction are two common mitigation measures.')]],
      lev_gwp: [T('지구온난화지수 (GWP)', 'Global warming potential (GWP)'), [T('같은 질량의 CO₂와 비교한 온난화 효과입니다. 메탄은 대기 중에 약 12년만 머물러, 20년 기준으로 보면 100년 기준보다 훨씬 큽니다. 현재 <b>' + g.name + '</b>.', 'Warming effect relative to the same mass of CO₂. Methane lasts only about 12 years, so its 20-year GWP is much larger than its 100-year GWP. Now: <b>' + g.name + '</b>.'), gwpTbl,
        T('AR6는 화석 기원 메탄(연료 연소)과 생물 기원 메탄(소)을 구분합니다. 한국 국가 인벤토리는 AR5 100년 값을 씁니다.', 'AR6 separates fossil methane (fuel combustion) from biogenic methane (cattle). Korea’s national inventory uses AR5 100-year values.')]],
      lev_green: [T('재생에너지 전력', 'Renewable power'), [T('사용 전력 가운데 재생에너지(태양광 자가발전, 재생에너지 구매 등)로 바꾼 비율만큼 Scope 2 배출이 줄어든다고 단순화했습니다.', 'Scope 2 falls in proportion to the share of electricity switched to renewables (on-site solar, renewable purchases) — a simplification.')]],
      lev_cut: [T('냉매 누출 저감', 'Leak reduction'), [T('정기 점검과 누출 수리로 냉매 보충량을 줄이는 비율입니다.', 'Reduction in refrigerant top-up through inspection and leak repair.')]],
      results: [T('결과', 'Results'), [T('모든 가스를 CO₂ 환산량(tCO₂eq)으로 합한 연간 배출량입니다. 배출량 = 활동자료 × 배출계수 × GWP.', 'Annual emissions of all gases in CO₂-equivalents (tCO₂eq). Emissions = activity data × emission factor × GWP.')]],
      stat_total: [T('총배출량', 'Total'), [T('Scope 1과 Scope 2의 합(tCO₂eq/년)입니다.', 'Scope 1 plus Scope 2 (tCO₂eq per year).')]],
      stat_s1: [T('직접 배출 (Scope 1)', 'Scope 1'), [T('연료 연소, 냉매 누출, 비료, 가축처럼 조직의 경계 안에서 직접 나오는 배출입니다.', 'Emissions released directly within the organisation: fuels, refrigerants, fertiliser, livestock.')]],
      stat_s2: [T('간접 배출 (Scope 2)', 'Scope 2'), [T('사 온 전기를 생산할 때 발전소에서 나온 배출입니다.', 'Emissions from power plants generating the electricity bought.')]],
      stat_top: [T('가장 큰 배출원', 'Largest source'), [T('감축 계획은 보통 가장 큰 배출원부터 세웁니다.', 'Reduction plans usually start with the largest source.')]],
      bars: [T('배출원·가스별 배출량', 'By source and gas'), [T('막대 길이는 배출원별 CO₂ 환산량이고, 색은 가스별 몫입니다. 막대를 누르면 그 항목의 계산 과정을 볼 수 있습니다.', 'Bar length is each source’s CO₂-equivalent; colours show each gas. Click a bar to see its calculation.')]],
      trace: [T('계산 따라가기', 'Follow the calculation'), [T('선택한 항목의 활동자료가 배출계수와 GWP를 거쳐 tCO₂eq가 되는 과정을 한 줄씩 보여 줍니다.', 'Shows, line by line, how the selected activity becomes tCO₂eq through emission factors and GWP.')]],
      pine: [T('소나무로 따지면', 'In pine trees'), [T('30년생 소나무 1그루가 1년에 흡수하는 CO₂ 약 6.6 kg(국립산림과학원)으로 나눈 값입니다. 규모를 체감하기 위한 비교입니다.', 'Total divided by about 6.6 kg CO₂ absorbed per year by a 30-year-old pine (National Institute of Forest Science) — a comparison to feel the scale.')]],
      scn: active ? [active.name, [active.text]] : [T('사용 방법', 'How to use'), ['']]
    };
    var v = t[key]; if (v && key === 'lev_gwp') v.wide = true; return v;
  }

  /* ---------------- intro: full-bleed photographs (Wikimedia Commons; credits in the footer and media/CREDITS.txt) ---------------- */
  var PH = [
    { src: 'media/plant.jpg', fx: 0.55, fy: 0.5, cr: 'Dangjin Thermal Power Plant · Rik Schuiling / TropCrop-TCS · CC BY-SA 4.0' },
    { src: 'media/diesel.jpg', fx: 0.55, fy: 0.5, cr: 'Refuelling a diesel vehicle · Shixart1985 · CC BY 2.0' },
    { src: 'media/hanu.jpg', fx: 0.6, fy: 0.35, cr: 'Hanu (Korean native cattle) · mycrefun · CC0' },
    { src: 'media/seoul-city.jpg', fx: 0.5, fy: 0.5, cr: 'Seoul from Inwangsan · Arturbraun · CC BY-SA 4.0' }
  ].map(function (p) { p.img = new Image(); p.img.src = p.src; return p; });
  var iPrev = -1, iCur = 0, iSwitch = 0, iFont = 'Pretendard Variable, Pretendard, sans-serif';
  // phones: fit the photo into the space above the story card, so the card does not hide the subject
  function photoH(w, h) { if (w >= 700) return h; var el = document.querySelector('.ck-intro-card'), t = el ? el.getBoundingClientRect().top : h * 0.55; return Math.max(h * 0.35, Math.min(h, t - 8)); }
  function drawPhoto(c, w, h, p, age, alpha) {
    if (!p.img.complete || !p.img.naturalWidth) return;
    h = photoH(w, h);
    var iw = p.img.naturalWidth, ih = p.img.naturalHeight, z = 1.04 + Math.min(age, 14) * 0.006;   // slow push-in
    var s = Math.max(w / iw, h / ih) * z, dw = iw * s, dh = ih * s;
    var x = Math.max(w - dw, Math.min(0, w / 2 - p.fx * dw)), y = Math.max(h - dh, Math.min(0, h / 2 - p.fy * dh));
    c.globalAlpha = alpha; c.drawImage(p.img, x, y, dw, dh); c.globalAlpha = 1;
  }
  function glassCard(c, x, y, w, h) {
    c.fillStyle = 'rgba(12,22,16,.66)'; c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, 12); else c.rect(x, y, w, h); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.stroke();
  }
  var intro = CK.intro({
    key: 'ccrl-ghg-intro-seen',
    pages: [
      { kicker: T('탄소 가계부', 'A carbon ledger'), title: T('온실가스 인벤토리', 'The greenhouse gas inventory'),
        text: T('가계부에 수입과 지출을 적듯, 나라와 기업은 해마다 어디서 온실가스가 얼마나 나왔는지 장부에 적습니다. 모든 나라가 같은 방법(IPCC 지침)으로 계산해 유엔에 보고합니다.', 'Just as a household keeps a ledger, countries and companies record every year how much greenhouse gas came from where — calculated the same way everywhere (IPCC Guidelines) and reported to the UN.') },
      { kicker: T('기본 공식', 'The basic formula'), title: T('활동자료 × 배출계수', 'Activity × emission factor'),
        text: T('경유 1 L를 태우면 CO₂ 약 <b>2.6 kg</b>이 나옵니다. 1년에 쓴 양(활동자료)에 단위당 배출량(배출계수)을 곱하면 배출량이 됩니다.', 'Burning 1 litre of diesel releases about <b>2.6 kg</b> of CO₂. Multiply what you used in a year (activity data) by the emission per unit (emission factor).') },
      { kicker: T('같은 1 kg, 다른 무게', 'Same kilogram, different weight'), title: T('지구온난화지수 (GWP)', 'Global warming potential'),
        text: T('메탄 1 kg은 100년 동안 CO₂ 약 <b>28 kg</b>, 20년만 보면 약 <b>80 kg</b>만큼 지구를 데웁니다. 그래서 모든 가스를 CO₂로 환산해 더합니다.', 'Over 100 years, 1 kg of methane warms like about <b>28 kg</b> of CO₂ — over 20 years, about <b>80 kg</b>. So every gas is converted to CO₂-equivalents and added up.') },
      { kicker: 'CCRL Classroom', title: T('직접 계산해 보세요', 'Calculate it yourself'),
        text: T('캠퍼스, 가정, 공장, 농가의 장부를 펼쳐 어디서 가장 많이 나오는지, 어떤 조치가 가장 효과적인지 찾아보세요.', 'Open the ledgers of a campus, a home, a factory and a farm. Find the biggest sources and the most effective measures.') }
    ],
    draw: function (c, w, h, t, dt, page) {
      if (page !== iCur) { iPrev = iCur; iCur = page; iSwitch = t; }
      var k = Math.min(1, (t - iSwitch) / 0.9);
      c.fillStyle = '#0f1a13'; c.fillRect(0, 0, w, h);
      if (iPrev >= 0 && k < 1) drawPhoto(c, w, h, PH[iPrev], t - iSwitch + 6, 1);
      drawPhoto(c, w, h, PH[iCur], t - iSwitch, iPrev >= 0 ? k : 1);
      // shade the lower left so the card reads
      var g = c.createLinearGradient(0, h * 0.35, 0, h); g.addColorStop(0, 'rgba(8,14,10,0)'); g.addColorStop(1, 'rgba(8,14,10,.62)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      var g2 = c.createLinearGradient(0, 0, w * 0.6, 0); g2.addColorStop(0, 'rgba(8,14,10,.35)'); g2.addColorStop(1, 'rgba(8,14,10,0)');
      c.fillStyle = g2; c.fillRect(0, 0, w, h);
      // one quiet number per page, on a glass card at the upper right
      var fa = Math.min(1, Math.max(0, (t - iSwitch - 0.5) / 0.6)), narrow = w < 700, cw = narrow ? Math.min(380, w - 32) : Math.min(460, w * 0.36), cx = narrow ? 16 : w - cw - Math.max(16, w * 0.06), cy = narrow ? 16 : Math.max(16, h * 0.1), u = cw / 460;
      c.globalAlpha = fa; c.textAlign = 'left';
      if (page === 1) {
        glassCard(c, cx, cy, cw, 150 * u);
        c.fillStyle = 'rgba(220,236,224,.8)'; c.font = '600 ' + Math.round(15 * u) + 'px ' + iFont;
        c.fillText(T('활동자료 × 배출계수 = 배출량', 'activity data × emission factor = emissions'), cx + 26 * u, cy + 40 * u);
        c.fillStyle = '#fff'; c.font = '700 ' + Math.round(30 * u) + 'px ' + iFont;
        c.fillText('1,000 L × 2.6 kg/L', cx + 26 * u, cy + 88 * u);
        c.fillStyle = '#f2c27a'; c.fillText('= 2.6 t CO₂', cx + 26 * u, cy + 128 * u);
      } else if (page === 2) {
        glassCard(c, cx, cy, cw, 176 * u);
        c.fillStyle = '#fff'; c.font = '700 ' + Math.round(30 * u) + 'px ' + iFont;
        c.fillText(T('메탄 1 kg은', '1 kg of methane'), cx + 26 * u, cy + 52 * u);
        [[T('100년 기준', 'over 100 years'), '≈ 28 kg CO₂'], [T('20년 기준', 'over 20 years'), '≈ 80 kg CO₂']].forEach(function (r, i) {
          var yy = cy + (98 + i * 44) * u;
          c.textAlign = 'left'; c.fillStyle = 'rgba(220,236,224,.8)'; c.font = '600 ' + Math.round(16 * u) + 'px ' + iFont; c.fillText(r[0], cx + 26 * u, yy);
          c.textAlign = 'right'; c.fillStyle = i ? '#f29a6a' : '#f2c27a'; c.font = '700 ' + Math.round(26 * u) + 'px ' + iFont; c.fillText(r[1], cx + cw - 26 * u, yy + 2 * u);
        });
      }
      c.globalAlpha = 1;
      // photo credit
      c.font = '500 11px ' + iFont; c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.75)';
      var crT = T('사진: ', 'Photo: ') + PH[iCur].cr;
      if (c.measureText(crT).width > w - 28) {          // phones: break the credit at its last ' · ' onto two lines
        var cut = crT.lastIndexOf(' · ', crT.length - 6); c.fillText(crT.slice(cut + 3), w - 14, h - 10); c.fillText(crT.slice(0, cut), w - 14, h - 24);
      } else c.fillText(crT, w - 14, h - 12);
    },
    onClose: function () { tour.maybeStart(); }
  });
  var tour = CK.tour({
    key: 'ccrl-ghg-tour-seen',
    steps: [
      { sel: '#pScn', title: T('① 사례', '① Cases'), text: T('캠퍼스, 가정, 공장, 농가의 연간 활동자료가 들어 있습니다. “직접 입력”으로 우리 기관의 값을 넣어 볼 수도 있습니다.', 'Annual data for a campus, a home, a factory and a farm. “Your own” starts an empty sheet.') },
      { sel: '#pRows', title: T('② 활동자료', '② Activity data'), text: T('숫자를 입력하거나 막대를 움직여 사용량을 바꿔 보세요. 항목을 누르면 계산 과정이 오른쪽에 나타납니다.', 'Type numbers or move the sliders. Click an item to see its calculation on the right.') },
      { sel: '#pLev', title: T('기준과 감축 조치', 'Settings and reductions'), text: T('GWP 기준(100년/20년)을 바꾸거나 재생에너지 전력, 냉매 누출 저감 같은 조치를 적용해 보세요.', 'Change the GWP basis (100 or 20 years) or apply renewable power and leak reduction.') },
      { sel: '#pStats', title: T('③ 결과', '③ Results'), text: T('총배출량과 Scope 1·2, 가장 큰 배출원이 바로 계산됩니다.', 'Total, Scope 1 and 2 and the largest source update instantly.') },
      { sel: '#pBars', title: T('배출원·가스별 막대', 'Bars by source and gas'), text: T('어느 배출원이, 어떤 가스로 얼마나 배출하는지 한눈에 비교합니다. 막대를 눌러 보세요.', 'Compare which sources emit how much of which gas. Click a bar.') },
      { sel: '#pTrace', title: T('계산 따라가기', 'Follow the calculation'), text: T('활동자료 × 배출계수 × GWP가 실제로 어떻게 계산되는지 한 줄씩 확인할 수 있습니다.', 'See exactly how activity × emission factor × GWP is worked out.') },
      { sel: '.ck-top-tools', title: T('언제든 다시', 'Any time'), text: T('사용법과 인트로를 다시 보거나 언어를 바꿀 수 있습니다.', 'Replay the guide or intro, or switch language.') }
    ]
  });

  /* ---------------- init ---------------- */
  CK.initTips(tips);
  buildRows(); buildSliders(); buildStats(); buildScenarios();
  document.getElementById('tourBtn').addEventListener('click', function () { tour.start(); });
  document.getElementById('introBtn').addEventListener('click', function () { intro.open(); });
  document.getElementById('langBtn').addEventListener('click', function () { CK.setLang(EN ? 'ko' : 'en', { S: S, scn: active && active.id, modified: modified }, STATE_KEY); });
  setPressed(); renderCard(); recompute();
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(recompute, 120); });
  intro.start();
  window.__ghg = { get R() { return R; }, get S() { return S; }, pick: function (id) { document.querySelector('#scnList [data-id="' + id + '"]').click(); }, setG: function (g) { S.g = g; recompute(); }, intro: intro, tour: tour };
})();
