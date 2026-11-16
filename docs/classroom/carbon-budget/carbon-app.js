/* CCRL Classroom — carbon budget simulator: UI */
(function () {
  'use strict';
  var CK = window.CK, T = CK.T, EN = CK.EN, M = window.CarbonModel, clamp = CK.clamp, el = CK.svg;
  var STATE_KEY = 'ccrl-carbon-state';
  var PROBS = [50, 67, 83], NC_NAMES = [T('약함', 'weak'), T('중간', 'medium'), T('강함', 'strong')];

  /* ---------------- scenarios ---------------- */
  var SCN = [
    { id: 'current', name: T('현행 정책', 'Current policies'), sub: T('지금 정책 그대로', 'policies as they are'), pts: [40, 37, 34, 31, 26, 20], lev: { start: 2025, nz: 2100, cdr: 0, nc: 0 },
      sum: T('배출이 천천히만 줄어듭니다 → 1.5 °C 예산은 몇 년 안에, 2 °C 예산도 2050년대에 바닥납니다.', 'Emissions fall only slowly → the 1.5 °C budget is gone within a few years and the 2 °C budget in the 2050s.'),
      text: T('각국이 이미 시행 중인 정책만 유지하는 경우입니다. 배출이 2100년까지 천천히 줄지만 0에 이르지 못해 누적 배출이 계속 늘고, 기온도 2100년까지 계속 오릅니다.', 'Only the policies already in place. Emissions decline slowly but never reach zero, so cumulative emissions — and warming — keep rising to 2100.'),
      q: T('기온이 멈추지 않고 계속 오르는 이유는 무엇일까요? 욕조의 수도꼭지를 떠올려 보세요.', 'Why does warming never stop in this pathway? Think of the bathtub tap.') },
    { id: 'nz2050', name: T('2050 탄소중립', 'Net zero 2050'), sub: T('지금부터 일정하게 감축', 'steady cuts from now'), lev: { start: 2025, nz: 2050, cdr: 0, nc: 1 },
      sum: T('지금부터 직선으로 줄여 2050년 순배출 0 → 기온은 약 1.7 °C에서 멈춥니다.', 'Straight-line cuts to net zero in 2050 → warming stops at about 1.7 °C.'),
      text: T('2025년부터 매년 같은 양을 줄여 2050년에 순배출 0에 도달합니다. 순배출이 0이 되면 누적 배출이 더 늘지 않으므로 기온 상승도 거의 멈춥니다.', 'Emissions fall by the same amount every year from 2025 and reach net zero in 2050. Once net emissions are zero, cumulative emissions stop growing and so does warming.'),
      q: T('기온이 멈추는 해와 순배출 0에 도달하는 해를 비교해 보세요. 왜 같을까요?', 'Compare the year warming stops with the year of net zero. Why are they the same?') },
    { id: 'halve', name: T('2030년 절반', 'Halve by 2030'), sub: T('빠른 초기 감축', 'deep early cuts'), pts: [21, 10.5, 0, 0, 0, 0], lev: { start: 2025, nz: 2050, cdr: 0, nc: 2 },
      sum: T('2030년까지 배출을 절반으로 → 같은 2050 탄소중립이라도 기온이 더 낮게 멈춥니다.', 'Halve emissions by 2030 → with the same 2050 net zero, warming stops lower.'),
      text: T('2030년까지 배출을 절반으로 줄이고 2050년에 탄소중립에 도달합니다. 도착 연도는 같아도 초기에 많이 줄일수록 누적 배출이 작아져 기온이 낮게 멈춥니다.', 'Emissions are halved by 2030 and reach net zero in 2050. The end date is the same, but early cuts keep cumulative emissions smaller, so warming stops lower.'),
      q: T('“2050 탄소중립” 시나리오와 누적 배출, 2100년 기온을 비교해 보세요. 어느 시기의 감축이 더 중요할까요?', 'Compare cumulative emissions and 2100 warming with “Net zero 2050”. When do cuts matter most?') },
    { id: 'delay', name: T('10년 지연', '10-year delay'), sub: T('2035년부터 감축', 'cuts start in 2035'), lev: { start: 2035, nz: 2060, cdr: 0, nc: 1 },
      sum: T('2035년까지 그대로 배출한 뒤 감축 → 2 °C 가까이 오릅니다.', 'Emit as now until 2035, then cut → warming approaches 2 °C.'),
      text: T('감축을 10년 미루고 2035년부터 줄여 2060년에 순배출 0에 도달합니다. 미룬 10년 동안의 배출만으로 1.5 °C 예산을 몇 배나 넘깁니다.', 'Cuts are delayed by ten years, starting in 2035 and reaching net zero in 2060. The delayed decade alone uses the 1.5 °C budget several times over.'),
      q: T('지연된 10년 동안 배출한 양은 1.5 °C 예산의 몇 배일까요? 욕조 눈금으로 확인해 보세요.', 'How many times the 1.5 °C budget is emitted during the delayed decade? Check the bathtub marks.') },
    { id: 'return', name: T('1.5 °C 복귀', 'Back to 1.5 °C'), sub: T('초과 후 CO₂ 제거', 'overshoot, then removal'), pts: [21, 0, -3, -5, -5, -5], lev: { start: 2025, nz: 2040, cdr: 5, nc: 2 },
      sum: T('2040년 탄소중립 + 이후 CO₂ 제거 → 1.5 °C를 잠시 넘었다가 다시 내려옵니다.', 'Net zero by 2040 plus CO₂ removal afterwards → warming briefly passes 1.5 °C, then comes back down.'),
      text: T('매우 빠르게 줄여 2040년에 탄소중립에 도달하고, 이후 대기에서 CO₂를 매년 제거(음의 배출)합니다. 누적 배출이 줄어들면 기온도 천천히 내려갑니다. 다만 대규모 CO₂ 제거는 아직 검증되지 않은 기술입니다.', 'Very fast cuts reach net zero in 2040, then CO₂ is removed from the air every year (negative emissions). As cumulative emissions shrink, warming slowly declines. Large-scale CO₂ removal is not yet proven at this scale.'),
      q: T('CO₂ 제거 슬라이더를 0으로 내리면 기온이 어떻게 달라지나요? 제거에 기대는 전략의 위험은 무엇일까요?', 'Set the CO₂ removal slider to 0. How does warming change? What is the risk of relying on removal?') }
  ];

  /* ---------------- state ---------------- */
  var DEF = { pts: M.pathFromLevers({ start: 2025, nz: 2050, cdr: 0 }), start: 2025, nz: 2050, cdr: 0, nc: 1, prob: 50, year: 2050 };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var S = clone(DEF), R = null, pinned = null, active = null, modified = false;
  var saved = CK.takeState(STATE_KEY);
  if (saved && saved.S) { S = saved.S; delete S.mode; delete S.kr; active = SCN.filter(function (x) { return x.id === saved.scn; })[0] || null; modified = !!saved.modified; }

  function recompute() {
    R = M.run(S.pts, S.nc);
    drawEmis(); drawT(); drawStats(); syncSliders();
  }
  function userChanged() { if (active && !modified) { modified = true; renderCard(); } recompute(); }

  /* ---------------- emission chart ---------------- */
  var E = { svg: document.getElementById('emisChart'), l: 40, r: 14, t: 12, b: 26, ymin: -15, ymax: 50 };
  function ex(y) { return E.l + (y - M.Y0) / (M.Y1 - M.Y0) * (E.w - E.l - E.r); }
  function ey(v) { return E.t + (E.ymax - v) / (E.ymax - E.ymin) * (E.h - E.t - E.b); }
  function buildEmis() {
    var s = E.svg, r = s.getBoundingClientRect(); E.w = r.width; E.h = r.height;
    s.setAttribute('viewBox', '0 0 ' + E.w + ' ' + E.h); s.innerHTML = '';
    for (var v = -10; v <= 50; v += 10) {
      el('line', { x1: E.l, x2: E.w - E.r, y1: ey(v), y2: ey(v), 'class': v === 0 ? 'zero' : 'grid' }, s);
      el('text', { x: E.l - 6, y: ey(v) + 4, 'text-anchor': 'end', 'class': 'ax' }, s).textContent = v;
    }
    [2025, 2040, 2060, 2080, 2100].forEach(function (y) { el('text', { x: ex(y), y: E.h - 8, 'text-anchor': 'middle', 'class': 'ax' }, s).textContent = y; });
    E.neg = el('path', { 'class': 'eneg' }, s); E.area = el('path', { 'class': 'earea' }, s); E.line = el('path', { 'class': 'epath' }, s);
    el('circle', { cx: ex(2025), cy: ey(M.E2025), r: 4, fill: '#55656e' }, s);
    E.pts = []; E.hits = []; E.vals = [];
    M.PTS.forEach(function (yr, j) {
      var hit = el('circle', { r: 18, 'class': 'ept-hit' }, s);
      var c = el('circle', { r: 7, 'class': 'ept', tabindex: 0, role: 'slider', 'aria-label': T(yr + '년 배출량', 'Emissions in ' + yr) }, s);
      var tv = el('text', { 'class': 'eval', 'text-anchor': 'middle' }, s);
      E.pts.push(c); E.hits.push(hit); E.vals.push(tv);
      function start(e) {
        e.preventDefault(); c.focus(); var tg = e.currentTarget; tg.setPointerCapture(e.pointerId);
        function mv(ev) { var rr = s.getBoundingClientRect(); setPt(j, E.ymax - (ev.clientY - rr.top - E.t) / (E.h - E.t - E.b) * (E.ymax - E.ymin)); }
        function up() { tg.removeEventListener('pointermove', mv); tg.removeEventListener('pointerup', up); }
        tg.addEventListener('pointermove', mv); tg.addEventListener('pointerup', up); tg.addEventListener('pointercancel', up);
      }
      hit.addEventListener('pointerdown', start); c.addEventListener('pointerdown', start);
      c.addEventListener('keydown', function (e) {
        var d = e.shiftKey ? 5 : 0.5;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { setPt(j, S.pts[j] + d); e.preventDefault(); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { setPt(j, S.pts[j] - d); e.preventDefault(); }
      });
    });
  }
  function setPt(j, v) { S.pts[j] = Math.round(clamp(v, -15, 50) * 2) / 2; userChanged(); }
  function drawEmis() {
    if (!E.line || !R) return;
    var d = '', a = 'M' + ex(M.Y0) + ',' + ey(0), n = 'M' + ex(M.Y0) + ',' + ey(0);
    R.e.forEach(function (v, i) {
      var x = ex(M.Y0 + i).toFixed(1);
      d += (i ? 'L' : 'M') + x + ',' + ey(v).toFixed(1);
      a += 'L' + x + ',' + ey(Math.max(0, v)).toFixed(1); n += 'L' + x + ',' + ey(Math.min(0, v)).toFixed(1);
    });
    a += 'L' + ex(M.Y1) + ',' + ey(0) + 'Z'; n += 'L' + ex(M.Y1) + ',' + ey(0) + 'Z';
    E.line.setAttribute('d', d); E.area.setAttribute('d', a); E.neg.setAttribute('d', n);
    M.PTS.forEach(function (yr, j) {
      var x = ex(yr), y = ey(S.pts[j]);
      E.pts[j].setAttribute('cx', x); E.pts[j].setAttribute('cy', y); E.hits[j].setAttribute('cx', x); E.hits[j].setAttribute('cy', y);
      E.pts[j].setAttribute('aria-valuenow', S.pts[j]); E.pts[j].setAttribute('aria-valuetext', S.pts[j] + ' GtCO2');
      E.vals[j].setAttribute('x', x); E.vals[j].setAttribute('y', y - 11); E.vals[j].textContent = S.pts[j];
    });
  }

  /* ---------------- temperature chart ---------------- */
  var C = { svg: document.getElementById('tChart'), l: 40, r: 56, t: 10, b: 24, y0: 1850, y1: 2100, vmin: -0.3, vmax: 3.4 };
  function cx(y) { return C.l + (y - C.y0) / (C.y1 - C.y0) * (C.w - C.l - C.r); }
  function cy(v) { return C.t + (C.vmax - v) / (C.vmax - C.vmin) * (C.h - C.t - C.b); }
  function buildT() {
    var s = C.svg, r = s.getBoundingClientRect(); C.w = r.width; C.h = r.height;
    s.setAttribute('viewBox', '0 0 ' + C.w + ' ' + C.h); s.innerHTML = '';
    for (var v = 0; v <= 3; v += 1) { el('line', { x1: C.l, x2: C.w - C.r, y1: cy(v), y2: cy(v), 'class': v ? 'grid' : 'zero' }, s); el('text', { x: C.l - 6, y: cy(v) + 4, 'text-anchor': 'end', 'class': 'ax' }, s).textContent = v; }
    [1850, 1900, 1950, 2000, 2050, 2100].forEach(function (y) { el('text', { x: cx(y), y: C.h - 7, 'text-anchor': 'middle', 'class': 'ax' }, s).textContent = y; });
    [[1.5, '#d98a3a'], [2.0, '#c4462d']].forEach(function (l) {
      el('line', { x1: C.l, x2: C.w - C.r, y1: cy(l[0]), y2: cy(l[0]), 'class': 'lim', stroke: l[1] }, s);
      el('text', { x: C.w - C.r + 4, y: cy(l[0]) + 4, 'class': 'limlab', fill: l[1] }, s).textContent = l[0].toFixed(1) + ' °C';
    });
    var g = window.GMST || {}, d = '';
    Object.keys(g).forEach(function (y, i) { d += (i ? 'L' : 'M') + cx(+y).toFixed(1) + ',' + cy(g[y]).toFixed(1); });
    el('path', { d: d, 'class': 'obs' }, s);
    el('text', { x: cx(1860), y: cy(1.2), 'class': 'ax' }, s).textContent = T('관측 (Berkeley Earth)', 'Observed (Berkeley Earth)');
    C.band = el('path', { 'class': 'tband' }, s); C.ghost = el('path', { 'class': 'tghost' }, s); C.line = el('path', { 'class': 'tline' }, s);
    C.play = el('line', { 'class': 'play' }, s); C.playLab = el('text', { 'class': 'playlab', 'text-anchor': 'middle' }, s);
    C.hit = el('rect', { x: cx(2025), y: 0, width: cx(2100) - cx(2025), height: C.h, fill: 'transparent', style: 'cursor:ew-resize', tabindex: 0, role: 'slider',
      'aria-label': T('보고 있는 연도', 'Year shown'), 'aria-valuemin': 2025, 'aria-valuemax': 2100 }, s);
    function setFrom(ev) { var rr = s.getBoundingClientRect(); setYear(Math.round(C.y0 + (ev.clientX - rr.left - C.l) / (C.w - C.l - C.r) * (C.y1 - C.y0))); }
    C.hit.addEventListener('pointerdown', function (e) {
      e.preventDefault(); C.hit.setPointerCapture(e.pointerId); stopPlay(); setFrom(e);
      function mv(ev) { setFrom(ev); }
      function up() { C.hit.removeEventListener('pointermove', mv); C.hit.removeEventListener('pointerup', up); }
      C.hit.addEventListener('pointermove', mv); C.hit.addEventListener('pointerup', up);
    });
    C.hit.addEventListener('keydown', function (e) {
      var d2 = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowRight') { stopPlay(); setYear(S.year + d2); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { stopPlay(); setYear(S.year - d2); e.preventDefault(); }
    });
  }
  function setYear(y) { S.year = clamp(Math.round(y), 2025, 2100); drawT(); drawStats(); }
  function tPath(arr) { var d = ''; arr.forEach(function (v, i) { d += (i ? 'L' : 'M') + cx(M.Y0 + i).toFixed(1) + ',' + cy(v).toFixed(1); }); return d; }
  function drawT() {
    if (!C.line || !R) return;
    C.line.setAttribute('d', tPath(R.T['50']));
    var b = tPath(R.T['83']); for (var i = R.T['17'].length - 1; i >= 0; i--) b += 'L' + cx(M.Y0 + i).toFixed(1) + ',' + cy(R.T['17'][i]).toFixed(1);
    C.band.setAttribute('d', b + 'Z');
    C.ghost.setAttribute('d', pinned ? tPath(pinned) : '');
    var x = cx(S.year), tv = R.T['50'][S.year - M.Y0];
    C.play.setAttribute('x1', x); C.play.setAttribute('x2', x); C.play.setAttribute('y1', C.t); C.play.setAttribute('y2', C.h - C.b);
    C.playLab.setAttribute('x', clamp(x, C.l + 30, C.w - C.r - 30)); C.playLab.setAttribute('y', C.t + 10);
    C.playLab.textContent = S.year + ' · +' + tv.toFixed(2) + ' °C';
    C.hit.setAttribute('aria-valuenow', S.year);
  }

  /* ---------------- stats ---------------- */
  var statDD = {};
  function buildStats() {
    var defs = [
      ['t2100', 'hot', T('2100년 기온 상승', 'Warming in 2100')], ['peak', '', T('최고 기온 (연도)', 'Peak warming (year)')],
      ['ex15', '', T('1.5 °C 예산 소진', '1.5 °C budget used up')], ['cum', '', T('누적 배출 2026–2100', 'Cumulative 2026–2100')]
    ];
    var dl = document.getElementById('stats'); dl.innerHTML = ''; statDD = {};
    defs.forEach(function (d) {
      var box = document.createElement('div'); box.className = 'ck-stat ' + d[1];
      var dt = document.createElement('dt'); dt.textContent = d[2]; var dd = document.createElement('dd');
      box.appendChild(dt); box.appendChild(dd); dl.appendChild(box); CK.info(dt, 'stat_' + d[0], d[2]); statDD[d[0]] = dd;
    });
    document.getElementById('sceneTitle').textContent = T('온난화 수준과 탄소예산 욕조', 'Warming level and the carbon budget bathtub');
  }
  function drawStats() {
    if (!R) return;
    statDD.t2100.textContent = '+' + R.T2100.toFixed(1) + ' °C (' + R.T2100lo.toFixed(1) + '–' + R.T2100hi.toFixed(1) + ')';
    statDD.peak.textContent = '+' + R.peak.toFixed(1) + ' °C (' + R.peakY + ')';
    var ex15 = M.exhaust(R, 1.5, S.prob);
    statDD.ex15.textContent = ex15 ? T(ex15 + '년', String(ex15)) : T('남음', 'not used up');
    statDD.cum.textContent = Math.round(R.total) + ' GtCO₂';
  }

  /* ---------------- sliders ---------------- */
  var LEV = [
    { k: 'start', label: T('감축 시작 연도', 'Cuts begin'), min: 2025, max: 2045, step: 1, dec: 0, tip: 'lev_start' },
    { k: 'nz', label: T('순배출 0 연도', 'Net-zero year'), min: 2035, max: 2100, step: 1, dec: 0, tip: 'lev_nz', marks: [{ v: 2050, label: T('1.5 °C 경로', '1.5 °C paths') }, { v: 2070, label: T('2 °C 경로', '2 °C paths') }] },
    { k: 'cdr', label: T('CO₂ 제거', 'CO₂ removal'), min: 0, max: 15, step: 0.5, dec: 1, unit: 'Gt/yr', tip: 'lev_cdr', marks: [{ v: 2, label: T('현재 약 2', 'today ≈2') }] },
    { k: 'nc', label: T('비CO₂ 감축', 'Non-CO₂ cuts'), min: 0, max: 2, step: 1, seg: true, fmt: function (v) { return NC_NAMES[v]; }, tip: 'lev_nc' },
    { k: 'prob', label: T('예산 확률', 'Budget likelihood'), min: 0, max: 2, step: 1, seg: true, fmt: function (v) { return PROBS[v] + '%'; }, tip: 'lev_prob' }
  ];
  var levs = [];
  function buildSliders() {
    var wrap = document.getElementById('levers');
    LEV.forEach(function (L) {
      var get = L.k === 'prob' ? function () { return PROBS.indexOf(S.prob); } : function () { return S[L.k]; };
      levs.push(CK.lever(wrap, L, get, function (v) {
        if (L.k === 'prob') { S.prob = PROBS[v]; recompute(); return; }
        S[L.k] = v;
        if (L.k === 'nc') { userChanged(); return; }
        if (S.nz < S.start + 3) S.nz = Math.min(2100, S.start + 3);
        S.pts = M.pathFromLevers(S); userChanged();
      }));
    });
  }
  function syncSliders() { levs.forEach(function (l) { l.sync(); }); }

  /* ---------------- scenarios ---------------- */
  function buildScenarios() {
    var list = document.getElementById('scnList');
    SCN.forEach(function (sc) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ck-scn'; b.dataset.id = sc.id; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<b>' + sc.name + '</b><span>' + sc.sub + '</span>';
      b.addEventListener('click', function () { runScenario(sc); }); list.appendChild(b);
    });
    document.getElementById('resetBtn').addEventListener('click', function () { S = clone(DEF); active = null; modified = false; pinned = null; setPressed(); renderCard(); updatePin(); recompute(); });
    var pin = document.getElementById('pinBtn');
    pin.addEventListener('click', function () { pinned = pinned ? null : R.T['50'].slice(); updatePin(); drawT(); });
  }
  function updatePin() { var b = document.getElementById('pinBtn'); b.setAttribute('aria-pressed', pinned ? 'true' : 'false'); b.textContent = pinned ? T('고정 해제', 'Unpin') : T('현재 곡선 고정', 'Pin this curve'); }
  function setPressed() { document.querySelectorAll('#scnList .ck-scn').forEach(function (b) { b.setAttribute('aria-pressed', active && b.dataset.id === active.id ? 'true' : 'false'); }); }
  function runScenario(sc) {
    active = sc; modified = false;
    S.start = sc.lev.start; S.nz = sc.lev.nz; S.cdr = sc.lev.cdr; S.nc = sc.lev.nc;
    S.pts = sc.pts ? sc.pts.slice() : M.pathFromLevers(S);
    setPressed(); renderCard(); recompute();
    startPlay();
  }
  function renderCard() {
    var c = document.getElementById('scnCard'), sc = active;
    var title = sc ? sc.name : T('시나리오를 골라 보세요', 'Choose a scenario');
    var sum = sc ? sc.sum : T('버튼을 누르면 그 배출 경로로 바뀌고 2025–2100년이 재생됩니다.', 'Each button loads a pathway and plays 2025–2100.');
    var q = sc ? sc.q : T('지금 속도로 배출하면 1.5 °C 예산은 몇 년 만에 바닥날까요?', 'At today’s rate, how many years until the 1.5 °C budget is used up?');
    c.innerHTML = '<div class="ck-card-main"><h3>' + title + '</h3><span class="dash">|</span><p>' + sum + '</p></div><div class="ck-q"><b>' + T('질문', 'Question') + '</b><span>' + q + '</span></div>';
    var main = c.querySelector('.ck-card-main'); CK.info(main, 'scn', title);
    if (modified) { var bd = document.createElement('span'); bd.className = 'ck-badge'; bd.textContent = T('직접 조절 중', 'Adjusted'); main.appendChild(bd); }
  }

  /* ---------------- scene ---------------- */
  var cv = document.getElementById('scene'), ctx = cv.getContext('2d'), scene = window.CarbonScene.create(), dpr = 1;
  function resizeScene() { var r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); scene.layout(r.width, r.height, dpr); }
  var play = null, tAnim = 0, last = 0;
  function startPlay() { S.year = 2025; play = { t0: performance.now() }; document.getElementById('playBtn').textContent = T('■ 정지', '■ Stop'); }
  function stopPlay() { play = null; document.getElementById('playBtn').textContent = T('▶ 2025–2100 재생', '▶ Play 2025–2100'); }
  document.getElementById('playBtn').addEventListener('click', function () { if (play) stopPlay(); else startPlay(); });
  function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; tAnim += dt;
    if (play) { var y = 2025 + Math.floor((now - play.t0) / 1000 * 6); if (y >= 2100) { setYear(2100); stopPlay(); } else if (y !== S.year) setYear(y); }
    if (R) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var i = S.year - M.Y0, p = S.prob;
      var budgets = [1.5, 1.7, 2.0].map(function (d) { var v = M.RCB[p][d]; return { deg: d, val: v, label: d.toFixed(1) + ' °C' }; });
      var cum = R.cum[i];
      scene.draw(ctx, { T: R.T['50'][i], year: S.year, ser: R.T['50'], serY0: M.Y0, cum: cum, budgets: budgets, top: budgets[2].val * 1.25, t: tAnim, dt: dt, motion: true,
        tankTitle: T('남은 탄소예산', 'Remaining budget'),
        cumLabel: Math.round(cum) + ' GtCO₂', cumSub: T('2026년부터 누적 (' + p + '%)', 'cumulative since 2026 (' + p + '%)') });
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- tooltips ---------------- */
  function tips(key) {
    var r = R || {};
    var tbl = '<table><tr><th>' + T('목표', 'Target') + '</th><th>50%</th><th>67%</th><th>83%</th></tr>' + [1.5, 1.6, 1.7, 2.0].map(function (d) {
      return '<tr><td>' + d.toFixed(1) + ' °C</td><td>' + M.RCB[50][d] + '</td><td>' + M.RCB[67][d] + '</td><td>' + M.RCB[83][d] + '</td></tr>'; }).join('') + '</table>';
    var t = {
      inputs: [T('배출 경로', 'Emission pathway'), [T('세계 CO₂ 배출이 2025년부터 2100년까지 어떻게 변할지 정합니다. 그래프의 점을 끌거나 아래 슬라이더로 경로를 만들 수 있습니다.', 'Set how global CO₂ emissions change from 2025 to 2100. Drag the points or use the sliders below.')]],
      emis: [T('세계 CO₂ 배출량', 'Global CO₂ emissions'), [T('화석연료와 토지이용을 합친 세계 CO₂ 배출량입니다. 2025년 값은 약 <b>42 GtCO₂</b>(420억 톤)입니다. 0 아래는 대기에서 CO₂를 제거하는 <b>음의 배출</b>입니다.', 'Total global CO₂ from fossil fuels and land use. 2025: about <b>42 GtCO₂</b>. Below zero means <b>negative emissions</b> (CO₂ removed from the air).'),
        T('점은 2030·2040·2050·2060·2080·2100년 값이며 그 사이는 직선으로 잇습니다. 방향키로 0.5씩(Shift: 5) 조절할 수 있습니다.', 'Points are 2030, 2040, 2050, 2060, 2080 and 2100, joined by straight lines. Arrow keys move them by 0.5 (Shift: 5).')]],
      levers: [T('조절 장치', 'Controls'), [T('앞의 세 슬라이더는 배출 경로를 자동으로 그립니다: 감축 시작 연도까지 지금 수준을 유지하고, 순배출 0 연도까지 직선으로 줄인 뒤, 그 후 CO₂ 제거량만큼 음의 배출을 합니다.', 'The first three sliders draw the pathway: emissions stay at today’s level until cuts begin, fall in a straight line to net zero, then go negative by the CO₂ removal amount.')]],
      lev_start: [T('감축 시작 연도', 'Cuts begin'), [T('이 해까지는 지금(42 GtCO₂/년) 수준으로 배출합니다.', 'Emissions stay at today’s 42 GtCO₂ per year until this year.')]],
      lev_nz: [T('순배출 0 연도', 'Net-zero year'), [T('배출량과 흡수·제거량이 같아져 <b>순배출이 0</b>이 되는 해입니다. 이때부터 누적 배출이 늘지 않아 기온 상승이 거의 멈춥니다.', 'The year emissions and removals balance (<b>net zero</b>). From then on cumulative emissions stop growing and warming nearly stops.')]],
      lev_cdr: [T('CO₂ 제거', 'CO₂ removal'), [T('순배출 0 이후 대기에서 매년 제거하는 CO₂ 양입니다(조림, 직접공기포집 등). 10년에 걸쳐 이 값까지 늘어납니다. 대규모 제거는 아직 실현되지 않은 기술입니다.', 'CO₂ removed from the air each year after net zero (forests, direct air capture…), ramping up over ten years. Removal at this scale does not exist yet.')]],
      lev_nc: [T('비CO₂ 감축', 'Non-CO₂ cuts'), [T('메탄(CH₄)·아산화질소(N₂O) 등 CO₂ 외 온실가스를 얼마나 줄이는지입니다. 탄소예산은 “중간” 감축을 가정하고 계산되었습니다. 약하면 같은 CO₂로도 약 0.1 °C 더, 강하면 약 0.06 °C 덜 오릅니다(교육용 근사).', 'How strongly methane, nitrous oxide and other non-CO₂ gases are cut. The budgets assume “medium” cuts; weak adds about 0.1 °C, strong removes about 0.06 °C for the same CO₂ (teaching approximation).')]],
      lev_prob: [T('예산 확률', 'Budget likelihood'), [T('목표 기온을 넘지 않을 확률입니다. 확률을 높게 잡을수록 남은 예산이 작아집니다. 욕조 눈금과 “예산 소진” 연도에 쓰입니다.', 'The chance of staying below the target. A higher likelihood means a smaller budget. Used for the bathtub marks and the “budget used up” year.'), tbl]],
      results: [T('결과', 'Results'), [T('기온은 <b>누적 CO₂ 배출량에 비례</b>한다는 관계(TCRE)로 계산합니다. IGCC 2025의 탄소예산 표를 정확히 재현하도록 맞춘 교육용 모델이며, 기후 전망이 아닙니다.', 'Warming is computed from the <b>proportionality to cumulative CO₂</b> (TCRE), tuned to reproduce the IGCC 2025 budget table exactly. A teaching model, not a climate projection.'),
        T('괄호 안 범위는 TCRE 불확실성(17–83% 범위)입니다.', 'Ranges show TCRE uncertainty (17–83%).')]],
      stat_t2100: [T('2100년 기온 상승', 'Warming in 2100'), [T('1850–1900년 대비 2100년의 지구 기온 상승입니다(중앙값, 괄호는 범위).', 'Global warming in 2100 relative to 1850–1900 (central value, range in brackets).')]],
      stat_peak: [T('최고 기온', 'Peak warming'), [T('2025–2100년 중 가장 높은 기온과 그 연도입니다. 순배출 0에 도달하면 그 무렵이 최고점이 됩니다.', 'The highest warming between 2025 and 2100 and its year; it peaks around net zero.')]],
      stat_ex15: [T('1.5 °C 예산 소진', '1.5 °C budget used up'), [T('2026년부터의 누적 배출이 1.5 °C 예산(' + S.prob + '% 확률: <b>' + M.RCB[S.prob][1.5] + ' GtCO₂</b>)을 넘는 해입니다.', 'The year cumulative emissions since 2026 exceed the 1.5 °C budget (' + S.prob + '%: <b>' + M.RCB[S.prob][1.5] + ' GtCO₂</b>).')]],
      stat_cum: [T('누적 배출', 'Cumulative emissions'), [T('2026–2100년 세계 CO₂ 배출의 합입니다. 기온을 결정하는 것은 이 값입니다.', 'Sum of global CO₂ emissions 2026–2100 — the number that sets warming.')]],
      scene: [T('온난화 수준과 욕조', 'Warming level and the bathtub'), [T('배경은 잠실과 롯데월드타워의 실제 사진이며 색을 바꾸지 않습니다. 고른 연도의 지구 기온 상승에 따라 <b>산업화 이전에 10년에 한 번 오던 폭염·폭우가 몇 배 자주 오는지</b>를 IPCC 제6차 평가보고서(2021, 전 지구 육지 평균; 1·1.5·2·4 °C 값 사이는 직선 보간)로 보여 줍니다. 서울만의 예측은 아닙니다.', 'The background is an unaltered photo of Jamsil and Lotte World Tower. For the global warming of the selected year it shows <b>how many times more often a 10-year heat or heavy-rain extreme of the pre-industrial climate occurs</b>, from the IPCC Sixth Assessment Report (2021; global land; linear between the 1, 1.5, 2 and 4 °C values). It is not a forecast for Seoul.'),
        T('사진 아래 <b>줄무늬</b>는 1850–2100년 지구 기온(2024년까지 Berkeley Earth 관측, 이후 선택한 경로)을 파랑(낮음)–빨강(높음)으로 칠한 온난화 줄무늬이고, 흰 표시가 고른 연도입니다.', 'The <b>stripes</b> under the photo colour global temperature from 1850 to 2100 (Berkeley Earth observations to 2024, then the selected pathway) from blue (cool) to red (warm); the white mark is the selected year.'),
        T('오른쪽 <b>욕조</b>는 2026년부터의 누적 배출입니다. 눈금은 1.5·1.7·2.0 °C의 남은 예산으로, 물이 눈금을 넘으면 그 목표의 예산을 다 쓴 것입니다. 배출을 멈추지 않는 한 물은 계속 차오릅니다.', 'The <b>bathtub</b> fills with cumulative emissions since 2026. Marks are the remaining budgets for 1.5, 1.7 and 2.0 °C; when the water passes a mark, that budget is used up. It keeps filling until emissions stop.')]],
      tchart: [T('지구 기온 상승', 'Global warming'), [T('회색 선은 Berkeley Earth 관측(1850–2024), 붉은 선은 선택한 경로의 기온(중앙값), 옅은 띠는 불확실성 범위입니다.', 'Grey: observed (Berkeley Earth, 1850–2024). Red: warming for the selected pathway (central). Shaded: uncertainty range.'),
        T('그래프를 끌거나 방향키로 <b>보고 있는 연도</b>를 바꾸면 서울 풍경과 욕조가 그 해 상태로 바뀝니다. 2025년 출발값은 인간 활동에 의한 온난화 1.37 °C입니다.', 'Drag the chart or use the arrow keys to change the <b>year shown</b>; the scene and bathtub follow. The 2025 start is the human-induced warming of 1.37 °C.')]],
    };
    var v = t[key]; if (v && (key === 'lev_prob' || key === 'scene')) v.wide = true;
    return v;
  }

  /* ---------------- intro ---------------- */
  var iScene = window.CarbonScene.create(), iDpr = 1;
  var intro = CK.intro({
    key: 'ccrl-carbon-intro-seen',
    pages: [
      { kicker: T('2015년 12월 · 파리', 'December 2015 · Paris'), title: T('1.5 °C라는 약속', 'A promise of 1.5 °C'),
        text: T('195개국이 지구 기온 상승을 산업화 이전보다 2 °C보다 훨씬 낮게, 가능하면 <b>1.5 °C</b>로 억제하자고 약속했습니다. 파리협정입니다.', '195 countries agreed to keep global warming well below 2 °C above pre-industrial levels and to pursue <b>1.5 °C</b>: the Paris Agreement.') },
      { kicker: T('대기는 욕조와 같습니다', 'The atmosphere is a bathtub'), title: T('쌓이는 CO₂', 'CO₂ builds up'),
        text: T('CO₂는 대기에 수백 년 동안 남아 계속 쌓입니다. 그래서 기온은 해마다의 배출량이 아니라 <b>지금까지 쌓인 총량</b>에 비례해 오릅니다. 수도꼭지를 잠그기 전까지 물은 계속 차오릅니다.', 'CO₂ stays in the air for centuries and keeps accumulating, so warming follows the <b>total amount emitted</b>, not one year’s emissions. Until the tap is closed, the water keeps rising.') },
      { kicker: T('2026년 1월 기준', 'As of January 2026'), title: T('남은 예산, 약 3년', 'About three years left'),
        text: T('1.5 °C(50% 확률)까지 남은 CO₂는 약 <b>1,300억 톤</b>입니다. 세계는 1년에 약 420억 톤을 배출하므로, 지금 속도라면 약 3년 만에 바닥납니다.', 'The CO₂ left for 1.5 °C (50% likelihood) is about <b>130 billion tonnes</b>. The world emits about 42 billion tonnes a year, so at today’s rate it runs out in about three years.') },
      { kicker: 'CCRL Classroom', title: T('탄소예산과 배출 경로', 'Carbon budget and emission pathways'),
        text: T('언제부터, 얼마나 빨리 줄이느냐에 따라 우리가 맞을 기온이 달라집니다. 배출 경로를 직접 그려 보고 폭염과 폭우가 얼마나 잦아지는지 확인해 보세요.', 'When and how fast we cut decides how warm the world becomes. Draw a pathway and see how much more often heatwaves and downpours come.') }
    ],
    resize: function (w, h) { iDpr = Math.min(2, devicePixelRatio || 1); iScene.layout(w, h, iDpr); },
    draw: function (c, w, h, t, dt, page) {
      var p = M.RCB[50], budgets = [1.5, 1.7, 2.0].map(function (d) { return { deg: d, val: p[d], label: d.toFixed(1) + ' °C' }; });
      var cum = page === 0 ? 0 : page === 1 ? (t * 60) % 1300 : page === 2 ? Math.min(130, (t % 6) * 42) : 0;
      var temp = page === 0 ? 1.1 : page === 3 ? 1.4 : 1.37 + 0.5434 * cum / 1000;
      iScene.draw(c, { impacts: w >= 700, T: temp, year: page === 0 ? 2015 : 2026 + Math.floor(cum / 42), cum: cum, budgets: budgets, top: 1300, t: t, dt: dt, motion: true,
        tankTitle: T('남은 탄소예산', 'Remaining budget'), cumLabel: Math.round(cum) + ' GtCO₂', cumSub: T('2026년부터 누적', 'cumulative since 2026') });
      c.fillStyle = 'rgba(8,16,22,.18)'; c.fillRect(0, 0, w, h);
    },
    onClose: function () { tour.maybeStart(); }
  });
  var tour = CK.tour({
    key: 'ccrl-carbon-tour-seen',
    steps: [
      { sel: '#pScn', title: T('① 시나리오', '① Scenarios'), text: T('대표적인 배출 경로 다섯 가지입니다. 누르면 그 경로로 바뀌고 2025–2100년이 재생됩니다.', 'Five typical pathways. Each one loads and plays 2025–2100.') },
      { sel: '#pEmis', title: T('② 배출 경로 그리기', '② Draw the pathway'), text: T('점을 위아래로 끌어 연도별 세계 CO₂ 배출량을 바꿔 보세요. 0 아래로 내리면 CO₂ 제거(음의 배출)입니다.', 'Drag the points up or down to set global CO₂ emissions. Below zero means CO₂ removal.') },
      { sel: '#pLev', title: T('조절 장치', 'Controls'), text: T('감축 시작 연도, 순배출 0 연도, CO₂ 제거량으로 경로를 한 번에 만들고, 비CO₂ 감축과 예산 확률도 바꿀 수 있습니다.', 'Build a pathway from the start of cuts, the net-zero year and CO₂ removal; also set non-CO₂ cuts and the budget likelihood.') },
      { sel: '#pStats', title: T('③ 결과', '③ Results'), text: T('2100년 기온, 최고 기온, 1.5 °C 예산 소진 연도, 누적 배출이 바로 계산됩니다. ⓘ에 자세한 설명이 있습니다.', 'Warming in 2100, peak warming, the year the 1.5 °C budget runs out and cumulative emissions update instantly. See ⓘ for details.') },
      { sel: '#pScene', title: T('서울과 탄소예산 욕조', 'Seoul and the bathtub'), text: T('왼쪽 카드는 그 해의 온난화에서 폭염·폭우가 몇 배 잦아지는지, 아래 줄무늬는 1850–2100년 기온 변화를, 욕조는 쌓인 배출량을 보여 줍니다. 물이 눈금을 넘으면 그 목표의 예산을 다 쓴 것입니다.', 'The card shows how much more often heat and rain extremes come at that year’s warming, the stripes show 1850–2100 warming, and the bathtub shows accumulated emissions. Passing a mark means that budget is gone.') },
      { sel: '#pTemp', title: T('기온 그래프', 'Temperature chart'), text: T('관측 기온 위에 선택한 경로의 기온이 이어집니다. 그래프를 끌면 보고 싶은 연도로 이동합니다.', 'Your pathway continues the observed record. Drag the chart to move to any year.') },
      { sel: '.ck-top-tools', title: T('언제든 다시', 'Any time'), text: T('사용법과 인트로를 다시 보거나 언어를 바꿀 수 있습니다.', 'Replay the guide or intro, or switch language.') }
    ]
  });

  /* ---------------- init ---------------- */
  CK.initTips(tips);
  buildScenarios(); buildSliders();
  document.getElementById('tourBtn').addEventListener('click', function () { tour.start(); });
  document.getElementById('introBtn').addEventListener('click', function () { intro.open(); });
  document.getElementById('langBtn').addEventListener('click', function () { CK.setLang(EN ? 'ko' : 'en', { S: S, scn: active && active.id, modified: modified }, STATE_KEY); });
  function layout() { buildEmis(); buildT(); resizeScene(); recompute(); }
  setPressed(); renderCard(); updatePin();
  buildStats();
  layout();
  var rt; addEventListener('resize', function () { rt && clearTimeout(rt); rt = setTimeout(function () { layout(); }, 120); });
  requestAnimationFrame(frame);
  intro.start();
  window.__carbon = { get S() { return S; }, get R() { return R; }, run: function (id) { runScenario(SCN.filter(function (s) { return s.id === id; })[0]); }, intro: intro, tour: tour };
})();
