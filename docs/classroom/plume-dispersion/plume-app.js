/* CCRL Classroom — Stack plume & atmospheric stability: UI */
(function () {
  'use strict';
  var T = window.PL.T, EN = window.PL.lang === 'en';
  var P = window.PlumeCore, ZB = P.ZB, ZTOP = P.ZTOP, XMAX = P.XMAX;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var CLS_COL = ['#b04a3a', '#c4743a', '#c39a3e', '#86837d', '#5f86ad', '#34507e'];
  var CLS_NAME = EN ? ['Very unstable', 'Unstable', 'Slightly unstable', 'Neutral', 'Slightly stable', 'Stable'] : ['매우 불안정', '불안정', '약한 불안정', '중립', '약한 안정', '안정'];
  var TMIN = 0, TMAX = 20;
  var PT = 16, PB = 48;            // shared vertical padding (profile + scene)
  var SL = 44, SR = 58;            // scene / chart horizontal padding

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function fmt(v, d) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); }
  function fmtC(v) {
    if (v >= 100) return v.toFixed(0);
    if (v >= 10) return v.toFixed(1);
    if (v >= 0.1) return v.toFixed(2);
    return v < 0.005 ? '0' : v.toFixed(3);
  }

  /* ---------------- state ---------------- */
  var DEF = { T: [15, 14, 12.5, 11, 9], u10: 4, hs: 100, d: 2.5, Ts: 150, v: 12, Q: 100 };
  var S = clone(DEF), R = null, pinned = null, yLock = null;
  var activeScn = null, modified = false;

  var STACKS = [
    { id: 'boiler', label: T('소형 보일러', 'Boiler'), set: { hs: 30, d: 0.8, Ts: 120, v: 8, Q: 10 } },
    { id: 'incin', label: T('소각장', 'Incinerator'), set: { hs: 100, d: 2.5, Ts: 150, v: 12, Q: 100 } },
    { id: 'power', label: T('발전소', 'Power plant'), set: { hs: 150, d: 6, Ts: 130, v: 20, Q: 400 } }
  ];
  var INC = STACKS[1].set;
  function mix(a, b) { var o = clone(a); for (var k in b) o[k] = b[k]; return o; }

  var SCN = [
    { id: 'looping', group: 'plume', name: T('환상형', 'Looping'), en: T('Looping', 'all layers unstable'), set: mix(INC, { u10: 2, T: [15, 12.8, 9.5, 6.2, 1.8] }),
      title: T('환상형 (Looping) — 모든 층이 불안정', 'Looping: every layer is unstable'),
      text: T('맑은 날 낮, 햇볕에 데워진 지면 때문에 모든 층의 기온이 건조단열감률(−0.98 °C/100 m)보다 빠르게 낮아집니다. 큰 소용돌이가 연기를 위아래로 크게 흔들어, 굴뚝 가까운 곳에서도 순간적으로 높은 농도가 나타납니다.', 'On a sunny day the sun-warmed ground makes temperature fall faster with height than the dry adiabatic lapse rate (−0.98 °C/100 m) in every layer. Large eddies swing the plume up and down, so high concentrations can reach the ground even close to the stack.'),
      q: T('기온 분포에서 각 층의 기울기를 점선(건조단열선)과 비교해 보세요. 어느 쪽이 더 가파른가요?', 'Compare the slope of each layer in the temperature profile with the dashed dry adiabat. Which one is steeper?') },
    { id: 'coning', group: 'plume', name: T('원추형', 'Coning'), en: T('Coning', 'near neutral'), set: mix(INC, { u10: 7, T: [15, 14, 12.5, 11, 9] }),
      title: T('원추형 (Coning) — 중립에 가까운 대기', 'Coning: a near-neutral atmosphere'),
      text: T('흐리고 바람이 강한 날에는 기온감률이 건조단열감률과 비슷한 중립 상태가 됩니다. 연기는 원뿔 모양으로 고르게 퍼지고, 지표 최고 농도는 굴뚝에서 비교적 먼 곳에 나타납니다.', 'On an overcast, windy day the lapse rate is close to the dry adiabatic rate, so the atmosphere is neutral. The plume spreads evenly as a cone, and the ground-level maximum appears fairly far from the stack.'),
      q: T('풍속 레버를 올리면 지표 최고 농도와 그 위치가 어떻게 바뀌나요? 희석 효과와 연기 상승 감소 중 어느 쪽이 더 큰가요?', 'Raise the wind speed lever. How do the maximum ground-level concentration and its location change? Which wins: extra dilution or the lower plume rise?') },
    { id: 'fanning', group: 'plume', name: T('부채형', 'Fanning'), en: T('Fanning', 'strong inversion'), set: mix(INC, { u10: 2, T: [8, 9.6, 12, 12.8, 13.8] }),
      title: T('부채형 (Fanning) — 역전층으로 매우 안정', 'Fanning: a very stable inversion'),
      text: T('맑고 바람이 약한 밤, 지면이 식으면서 위로 갈수록 기온이 오르는 역전층이 생깁니다. 연직 방향의 섞임이 억제되어 연기는 얇은 띠처럼 수평으로만 퍼지고 지면에는 거의 닿지 않습니다.', 'On a clear, calm night the ground cools and temperature increases with height: an inversion. Vertical mixing is suppressed, so the plume spreads only sideways as a thin ribbon and hardly reaches the ground.'),
      q: T('이 상태에서 아침 해가 떠 아래층만 불안정해지면 어떤 일이 생길까요? 훈증형 버튼과 비교해 보세요.', 'What would happen if the morning sun made only the lowest layers unstable? Compare with the Fumigation button.') },
    { id: 'lofting', group: 'plume', name: T('지붕형', 'Lofting'), en: T('Lofting', 'stable below, neutral above'), set: mix(INC, { u10: 2, hs: 110, T: [10, 12.5, 10.7, 8.9, 6.5] }),
      title: T('지붕형 (Lofting) — 아래는 안정, 위는 중립', 'Lofting: stable below, neutral above'),
      text: T('해 질 무렵 지면 가까이에만 역전층이 생기고 그 위는 아직 중립입니다. 연기는 위쪽으로만 퍼지고, 아래의 역전층이 연기가 지면으로 내려오는 것을 막아 줍니다.', 'Around sunset an inversion forms only near the ground while the air above is still neutral. The plume spreads upward only, and the inversion below keeps it from coming down to the ground.'),
      q: T('굴뚝 높이를 60 m로 낮추면 지표 농도는 어떻게 변하나요? 연기(H)가 아래 역전층을 벗어나는지도 확인해 보세요.', 'Lower the stack to 60 m. How does the ground-level concentration change? Check whether the plume (H) is still above the inversion.') },
    { id: 'fumigation', group: 'plume', name: T('훈증형', 'Fumigation'), en: T('Fumigation', 'inversion above unstable air'), set: mix(INC, { u10: 3, T: [12, 10, 7, 10, 11] }),
      title: T('훈증형 (Fumigation) — 불안정층 위의 역전층', 'Fumigation: an inversion above unstable air'),
      text: T('아침에 지면이 데워지며 아래쪽 250 m는 불안정해졌지만, 그 위에는 밤사이 생긴 역전층이 남아 있습니다. 역전층이 뚜껑처럼 연기를 막아 오염물질이 지면으로 쏟아져 내립니다. 다섯 유형 가운데 지표 농도가 가장 높습니다.', 'In the morning the ground has warmed and the lowest 250 m have become unstable, but the night-time inversion is still in place above. It acts as a lid and the pollution is brought down to the ground. Of the five types this gives the highest ground-level concentration.'),
      q: T('250–400 m 층의 역전을 약하게 만들면(400 m 점을 왼쪽으로) 지표 농도는 어떻게 변하나요?', 'Weaken the inversion in the 250–400 m layer (drag the 400 m point to the left). How does the ground-level concentration change?') }
  ];

  var SUM = {
    looping: T('모든 층이 불안정 → 연기가 크게 굽이치고, 굴뚝 가까이에서 지표 농도가 높습니다.', 'Every layer unstable → the plume loops widely and ground-level concentration is high near the stack.'),
    coning: T('중립에 가까운 대기 → 연기가 원뿔 모양으로 고르게 퍼집니다.', 'Near-neutral air → the plume spreads evenly as a cone.'),
    fanning: T('역전층으로 매우 안정 → 연기가 얇은 띠처럼 수평으로만 퍼집니다.', 'Strong inversion → the plume spreads sideways as a thin ribbon.'),
    lofting: T('아래는 안정, 위는 중립 → 연기가 위로만 퍼져 지면에 거의 닿지 않습니다.', 'Stable below, neutral above → the plume spreads upward and barely touches the ground.'),
    fumigation: T('불안정층 위의 역전층 → 연기가 갇혀 지면으로 쏟아집니다.', 'Inversion above unstable air → the plume is trapped and brought down to the ground.')
  };
  var LEVERS = [
    { k: 'u10', label: T('풍속 (10 m)', 'Wind (10 m)'), unit: 'm/s', min: 1, max: 12, step: 0.1, dec: 1 },
    { k: 'hs', label: T('굴뚝 높이', 'Stack height'), unit: 'm', min: 20, max: 250, step: 5, dec: 0 },
    { k: 'Q', label: T('배출량', 'Emission'), unit: 'g/s', min: 5, max: 500, step: 5, dec: 0 },
    { k: 'Ts', label: T('배출가스 온도', 'Exit temp.'), unit: '°C', min: 20, max: 300, step: 5, dec: 0 },
    { k: 'v', label: T('배출 속도', 'Exit speed'), unit: 'm/s', min: 1, max: 30, step: 0.5, dec: 1 }
  ];

  /* ---------------- recompute ---------------- */
  var dirty = true;
  function recompute() {
    R = P.solve(S);
    drawProfile(); drawChart(); drawSummary(); syncLevers();
  }
  function userChanged() {
    if (activeScn && !modified) { modified = true; renderCard(); }
    recompute();
  }

  /* ---------------- tween ---------------- */
  var tw = null;
  function tweenTo(target, dur, done) {
    var from = clone(S), t0 = performance.now();
    if (tw) cancelAnimationFrame(tw);
    function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function step(now) {
      var f = ease(Math.min(1, (now - t0) / dur));
      for (var k in target) {
        if (k === 'T') for (var i = 0; i < 5; i++) S.T[i] = from.T[i] + (target.T[i] - from.T[i]) * f;
        else S[k] = from[k] + (target[k] - from[k]) * f;
      }
      recompute();
      if (f < 1) tw = requestAnimationFrame(step);
      else { tw = null; S = clone(target); recompute(); if (done) done(); }
    }
    tw = requestAnimationFrame(step);
  }

  /* ---------------- profile editor ---------------- */
  var prof = { svg: document.getElementById('profile') };
  function pz(z) { return PT + (1 - z / ZTOP) * (prof.h - PT - PB); }
  function pxT(tc) { return prof.l + (tc - TMIN) / (TMAX - TMIN) * (prof.w - prof.l - prof.r); }
  function Tpx(x) { return TMIN + (x - prof.l) / (prof.w - prof.l - prof.r) * (TMAX - TMIN); }
  function buildProfile() {
    var svg = prof.svg, r = svg.getBoundingClientRect();
    prof.w = r.width; prof.h = r.height; prof.l = 40; prof.r = 74;
    svg.setAttribute('viewBox', '0 0 ' + prof.w + ' ' + prof.h);
    svg.innerHTML = '';
    var g = el('g', {}, svg);
    // T grid + labels
    for (var t = TMIN; t <= TMAX; t += 5) {
      el('line', { x1: pxT(t), x2: pxT(t), y1: PT, y2: pz(0), 'class': 'p-grid' }, g);
      var tx = el('text', { x: pxT(t), y: pz(0) + 15, 'text-anchor': 'middle', 'class': 'p-axis' }, g);
      tx.textContent = fmt(t, 0);
    }
    el('text', { x: (prof.l + prof.w - prof.r) / 2, y: pz(0) + 31, 'text-anchor': 'middle', 'class': 'p-axis' }, g).textContent = T('기온 (°C)', 'Temperature (°C)');
    // dry adiabats (−9.8 °C/km)
    var cp = el('clipPath', { id: 'pclip' }, svg);
    el('rect', { x: prof.l, y: PT, width: prof.w - prof.l - prof.r, height: pz(0) - PT }, cp);
    var ga = el('g', { 'clip-path': 'url(#pclip)' }, g);
    for (var t0 = TMIN; t0 <= TMAX + 10; t0 += 5) {
      el('line', { x1: pxT(t0), y1: pz(0), x2: pxT(t0 - 9.8 * ZTOP / 1000), y2: pz(ZTOP), 'class': 'p-guide' }, ga);
    }
    // boundaries + height labels
    ZB.forEach(function (z) {
      el('line', { x1: prof.l, x2: prof.w - 4, y1: pz(z), y2: pz(z), 'class': z === 0 ? 'p-grid' : 'p-bound' }, g);
      var tl = el('text', { x: prof.l - 5, y: pz(z) + 4, 'text-anchor': 'end', 'class': 'p-axis' }, g);
      tl.textContent = z + (z === ZTOP ? ' m' : '');
    });
    el('text', { x: prof.w - prof.r + 8, y: PT + 11, 'class': 'p-label' }, g).textContent = '°C/100 m';
    prof.segs = []; prof.lapse = []; prof.chips = []; prof.chipR = [];
    for (var i = 0; i < 4; i++) {
      prof.segs.push(el('line', { 'class': 'p-seg' }, g));
      var ym = (pz(ZB[i]) + pz(ZB[i + 1])) / 2;
      prof.lapse.push(el('text', { x: prof.w - prof.r + 8, y: ym + 4, 'class': 'p-lapse' }, g));
      prof.chipR.push(el('rect', { x: prof.w - 26, y: ym - 9, width: 20, height: 18, rx: 4 }, g));
      prof.chips.push(el('text', { x: prof.w - 16, y: ym + 4, 'text-anchor': 'middle', 'class': 'p-chip' }, g));
    }
    // H marker
    prof.hLine = el('line', { x1: prof.l, x2: prof.w - prof.r, stroke: '#8a2d22', 'stroke-width': 1.2, 'stroke-dasharray': '2 3' }, g);
    prof.hLab = el('text', { x: prof.l + 4, 'class': 'p-label', fill: '#8a2d22' }, g);
    // points
    prof.pts = []; prof.tv = [];
    for (var j = 0; j < 5; j++) (function (j) {
      var hit = el('circle', { r: 18, 'class': 'p-pt-hit' }, svg);
      var c = el('circle', { r: 8, 'class': 'p-pt', tabindex: 0, role: 'slider',
        'aria-label': T(ZB[j] + ' m 높이의 기온', 'Temperature at ' + ZB[j] + ' m'), 'aria-valuemin': TMIN, 'aria-valuemax': TMAX }, svg);
      var tv = el('text', { 'class': 'p-tval' }, svg);
      prof.pts.push(c); prof.tv.push(tv);
      function start(e) {
        e.preventDefault(); c.focus();
        var tgt = e.currentTarget; tgt.setPointerCapture(e.pointerId);
        function mv(ev) {
          var rr = svg.getBoundingClientRect();
          setT(j, Tpx(ev.clientX - rr.left));
        }
        function up() { tgt.removeEventListener('pointermove', mv); tgt.removeEventListener('pointerup', up); tgt.removeEventListener('pointercancel', up); }
        tgt.addEventListener('pointermove', mv); tgt.addEventListener('pointerup', up); tgt.addEventListener('pointercancel', up);
      }
      hit.addEventListener('pointerdown', start); c.addEventListener('pointerdown', start);
      c.addEventListener('keydown', function (e) {
        var d = e.shiftKey ? 1 : 0.1;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setT(j, S.T[j] - d); e.preventDefault(); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setT(j, S.T[j] + d); e.preventDefault(); }
      });
      prof['hit' + j] = hit;
    })(j);
  }
  function setT(j, tv) {
    if (tw) { cancelAnimationFrame(tw); tw = null; }
    S.T[j] = Math.round(clamp(tv, TMIN, TMAX) * 10) / 10;
    userChanged();
  }
  function drawProfile() {
    if (!prof.segs || !R) return;
    for (var i = 0; i < 4; i++) {
      var c = Math.round(R.prof.ci[i]);
      var s = prof.segs[i];
      s.setAttribute('x1', pxT(S.T[i])); s.setAttribute('y1', pz(ZB[i]));
      s.setAttribute('x2', pxT(S.T[i + 1])); s.setAttribute('y2', pz(ZB[i + 1]));
      s.setAttribute('stroke', CLS_COL[c]);
      prof.lapse[i].textContent = fmt(R.prof.lapse[i], 2);
      prof.chipR[i].setAttribute('fill', CLS_COL[c]);
      prof.chips[i].textContent = P.LETTERS[c];
    }
    for (var j = 0; j < 5; j++) {
      var x = pxT(S.T[j]), y = pz(ZB[j]);
      prof.pts[j].setAttribute('cx', x); prof.pts[j].setAttribute('cy', y);
      prof['hit' + j].setAttribute('cx', x); prof['hit' + j].setAttribute('cy', y);
      prof.pts[j].setAttribute('aria-valuenow', S.T[j].toFixed(1));
      prof.pts[j].setAttribute('aria-valuetext', S.T[j].toFixed(1) + ' °C');
      var right = x < (prof.l + prof.w - prof.r) / 2;
      prof.tv[j].setAttribute('x', right ? x + 12 : x - 12);
      prof.tv[j].setAttribute('y', y + (j === 0 ? -6 : j === 4 ? 14 : 4));
      prof.tv[j].setAttribute('text-anchor', right ? 'start' : 'end');
      prof.tv[j].textContent = fmt(S.T[j], 1) + '°';
    }
    var yh = pz(R.H);
    prof.hLine.setAttribute('y1', yh); prof.hLine.setAttribute('y2', yh);
    prof.hLab.setAttribute('y', yh - 4); prof.hLab.textContent = 'H ' + R.H.toFixed(0) + ' m';
  }

  /* ---------------- chart ---------------- */
  var chart = { svg: document.getElementById('chart') };
  function buildChart() {
    var svg = chart.svg, r = svg.getBoundingClientRect();
    chart.w = r.width; chart.h = r.height; chart.t = 18; chart.b = 26;
    svg.setAttribute('viewBox', '0 0 ' + chart.w + ' ' + chart.h);
    svg.innerHTML = '';
    chart.grid = el('g', {}, svg);
    chart.area = el('path', { 'class': 'c-area' }, svg);
    chart.ghost = el('path', { 'class': 'c-ghost' }, svg);
    chart.line = el('path', { 'class': 'c-line' }, svg);
    chart.dot = el('circle', { r: 4, 'class': 'c-max' }, svg);
    chart.lab = el('text', { 'class': 'c-maxlab' }, svg);
    chart.glab = el('text', { 'class': 'c-axis' }, svg);
  }
  function cx(x) { return SL + x / XMAX * (chart.w - SL - SR); }
  function niceMax(v) {
    var e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e;
  }
  function curvePath(gl, ymax, close) {
    var d = '', y0 = chart.h - chart.b, hh = y0 - chart.t;
    for (var n = 0; n <= 200; n++) {
      var x = n / 200 * XMAX, v = P.glAt({ gl: gl }, x);
      d += (n ? 'L' : 'M') + cx(x).toFixed(1) + ',' + (y0 - Math.min(1.05, v / ymax) * hh).toFixed(1);
    }
    if (close) d += 'L' + cx(XMAX) + ',' + y0 + 'L' + cx(0) + ',' + y0 + 'Z';
    return d;
  }
  var curYmax = 10;
  function drawChart() {
    if (!chart.line || !R) return;
    var m = R.cmax;
    if (pinned) m = Math.max(m, pinned.cmax);
    var ymax = yLock || Math.max(5, niceMax(m * 1.12));
    curYmax = ymax;
    var y0 = chart.h - chart.b, hh = y0 - chart.t, g = chart.grid;
    g.innerHTML = '';
    for (var i = 0; i <= 5; i++) {
      var yy = y0 - i / 5 * hh;
      el('line', { x1: SL, x2: chart.w - SR, y1: yy, y2: yy, 'class': 'c-grid' }, g);
      el('text', { x: SL - 6, y: yy + 4, 'text-anchor': 'end', 'class': 'c-axis' }, g).textContent = fmtC(ymax * i / 5);
    }
    for (var k = 0; k <= 10; k += 2) {
      el('text', { x: cx(k * 1000), y: chart.h - 8, 'text-anchor': 'middle', 'class': 'c-axis' }, g).textContent = k + (k === 10 ? ' km' : '');
    }
    el('text', { x: chart.w - SR + 6, y: chart.t + 4, 'class': 'c-axis' }, g).textContent = 'µg/m³';
    el('text', { x: chart.w - SR + 6, y: y0 + 4, 'class': 'c-axis' }, g).textContent = '';
    chart.line.setAttribute('d', curvePath(R.gl, ymax));
    chart.area.setAttribute('d', curvePath(R.gl, ymax, true));
    chart.ghost.setAttribute('d', pinned ? curvePath(pinned.gl, ymax) : '');
    var mx = cx(R.xmax), my = y0 - Math.min(1.05, R.cmax / ymax) * hh;
    chart.dot.setAttribute('cx', mx); chart.dot.setAttribute('cy', my);
    chart.dot.style.display = R.cmax > 0.001 ? '' : 'none';
    var left = mx > chart.w * 0.7;
    chart.lab.setAttribute('x', left ? mx - 8 : mx + 8);
    chart.lab.setAttribute('y', Math.max(chart.t + 2, my - 6));
    chart.lab.setAttribute('text-anchor', left ? 'end' : 'start');
    chart.lab.textContent = T('최고 ', 'Peak ') + fmtC(R.cmax) + ' µg/m³';
    chart.glab.setAttribute('x', cx(XMAX) - 4); chart.glab.setAttribute('y', chart.t + 4);
    chart.glab.setAttribute('text-anchor', 'end');
    chart.glab.textContent = pinned ? T('점선: 고정한 곡선 (최고 ', 'Dashed: pinned curve (peak ') + fmtC(pinned.cmax) + ')' : '';
  }

  /* ---------------- summary ---------------- */
  var STATS = [
    { id: 'H', cls: '', label: T('유효 굴뚝 높이 H', 'Effective stack height H') },
    { id: 'stab', cls: '', label: T('연기 높이의 안정도', 'Stability at plume height') },
    { id: 'cmax', cls: 'hot', label: T('지표 최고 농도', 'Peak ground-level conc.') },
    { id: 'xmax', cls: '', label: T('최고 농도 지점', 'Distance to peak') }
  ];
  var statDD = {};
  function buildStats() {
    var dl = document.getElementById('stats');
    STATS.forEach(function (s) {
      var d = document.createElement('div'); d.className = 'stat ' + s.cls;
      var dt = document.createElement('dt'); dt.textContent = s.label;
      var dd = document.createElement('dd');
      d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
      info(dt, 'stat_' + s.id, s.label);
      statDD[s.id] = dd;
    });
  }
  function drawSummary() {
    var c = Math.round(R.ciH);
    statDD.H.textContent = R.H.toFixed(0) + ' m';
    statDD.stab.innerHTML = '<span class="chip" style="background:' + CLS_COL[c] + '">' + P.LETTERS[c] + '</span>' + CLS_NAME[c];
    statDD.cmax.textContent = fmtC(R.cmax) + ' µg/m³';
    statDD.xmax.textContent = R.cmax > 0.001 ? (R.xmax > 9500 ? T('10 km 이상', 'over 10 km') : (R.xmax / 1000).toFixed(1) + ' km') : '—';
  }

  /* ---------------- info tooltips (same behaviour as the radiative model) ---------------- */
  function TIPS(key) {
    var r = R || {}, rise = r.rise || {};
    var t = {
      inputs: ['조건 바꾸기', ['기온의 연직 분포와 레버로 기상 조건과 굴뚝 조건을 바꿉니다. 바꾸는 즉시 오른쪽 결과가 다시 계산됩니다.',
        '<b>굴뚝 종류</b> 버튼은 굴뚝 높이·지름·배출가스 온도·배출 속도·배출량을 그 시설의 대표값으로 한꺼번에 바꿉니다.']],
      profile: ['기온의 연직 분포', ['지면부터 600 m까지 다섯 지점의 기온으로 네 개 층을 만듭니다. 점을 좌우로 끌거나, 점을 선택한 뒤 방향키로 0.1 °C씩(Shift: 1 °C) 조절합니다.',
        '<b>점선</b>은 건조단열선(−0.98 °C/100 m)입니다. 층의 기울기가 이보다 가파르면(높이에 따라 더 빨리 식으면) 불안정, 비슷하면 중립, 덜 식거나 오히려 따뜻해지면(역전) 안정입니다.',
        '오른쪽 숫자는 각 층의 기온감률(°C/100 m), 글자는 Pasquill–Gifford 안정도 등급(A 매우 불안정 ~ F 안정)입니다. <b>H</b> 점선은 연기가 퍼지기 시작하는 높이입니다.']],
      levers: ['바람 · 굴뚝 · 배출', ['레버의 손잡이를 끌거나, 레버를 선택한 뒤 방향키로 조절합니다(Shift: 10배).',
        '굴뚝 지름은 굴뚝 종류에 따라 정해지며 지금은 <b>' + S.d.toFixed(1) + ' m</b>입니다.']],
      lever_u10: ['풍속 (지상 10 m)', ['지상 10 m 높이의 풍속입니다. 위로 갈수록 바람이 강해지며, 계산에는 굴뚝 높이의 풍속이 쓰입니다.',
        '풍속이 강하면 연기가 더 많이 희석되지만, 연기가 빨리 누워 연기 상승은 줄어듭니다.']],
      lever_hs: ['굴뚝 높이', ['지면에서 굴뚝 꼭대기까지의 높이입니다. 연기는 이 높이에서 나온 뒤 더 올라가(연기 상승) 퍼지기 시작합니다.']],
      lever_Q: ['배출량', ['1초에 배출되는 오염물질의 양입니다. 지표 농도는 배출량에 정비례하며, 연기 모양은 바뀌지 않습니다.']],
      lever_Ts: ['배출가스 온도', ['굴뚝에서 나오는 가스의 온도입니다. 주변 공기보다 뜨거울수록 부력이 커져 연기가 더 높이 올라갑니다(연기 상승).']],
      lever_v: ['배출 속도', ['굴뚝 출구에서 가스가 뿜어져 나오는 속도입니다. 빠를수록 연기가 더 높이 올라갑니다.']],
      results: ['결과', ['현재 조건으로 계산한 결과입니다.',
        '가우시안 플룸 개념(Pasquill–Gifford 안정도, Briggs 확산 계수·연기 상승식)을 네 개 층의 기온 분포로 확장한 교육용 단순화 모델입니다. 연기 모양과 경향을 이해하기 위한 것이며 실제 농도 예측이나 규제 평가에 쓰는 모델이 아닙니다.']],
      stat_H: ['유효 굴뚝 높이 H', ['굴뚝 높이에 연기 상승고를 더한 높이로, 연기가 실제로 퍼지기 시작하는 높이입니다.',
        '지금은 굴뚝 <b>' + S.hs.toFixed(0) + ' m</b> + 연기 상승 <b>' + (rise.dh || 0).toFixed(0) + ' m</b>입니다.']],
      stat_stab: ['연기 높이의 안정도', ['유효 굴뚝 높이 H가 속한 층의 대기 안정도입니다. 이 층의 안정도가 연기가 옆과 위아래로 퍼지는 정도를 정합니다.',
        '굴뚝 높이의 풍속은 <b>' + (r.us || 0).toFixed(1) + ' m/s</b>입니다.']],
      stat_cmax: ['지표 최고 농도', ['바람이 불어가는 방향 중심선의 지표 농도 가운데, 굴뚝에서 10 km 안의 가장 높은 값입니다. 배출량 <b>' + S.Q.toFixed(0) + ' g/s</b> 기준입니다.']],
      stat_xmax: ['최고 농도 지점', ['지표 최고 농도가 나타나는 곳까지 굴뚝에서 바람 방향으로 잰 거리입니다. 10 km보다 멀면 ‘10 km 이상’으로 표시합니다.']],
      scene: ['연기 확산', ['굴뚝 연기를 옆에서 본 모습입니다. 가로는 10 km, 세로는 600 m라서 <b>세로 방향이 크게 과장</b>되어 있습니다.',
        '층마다 옅게 칠한 색과 왼쪽 끝의 색 띠는 안정도, 붉은 점선은 유효 굴뚝 높이 H, 오른쪽 화살표는 높이별 풍속(m/s), 맨 아래 붉은 띠는 지표 농도입니다.',
        '<b>배경</b>(19세기 영국 산업도시)은 분위기를 위한 그림으로 <b>실제 크기와 무관</b>합니다. 하늘빛은 지면 근처 안정도에 따라 낮·흐림·아침·저녁으로 바뀌고, 행인들은 자기 위치의 지표 농도가 높아지면 입을 가리거나 멈춰 기침합니다.',
        '연기의 굽이침은 이해를 돕기 위한 표현이며, 농도 계산은 아래 그래프와 같습니다.']],
      pg: ['Pasquill–Gifford 안정도 등급', ['영국의 Pasquill(1961)이 만들고 미국의 Gifford가 보완한 대기 안정도 분류로, 대기오염 확산 교재와 규제 모델에서 널리 씁니다. 연기가 퍼지는 정도(확산 계수 σy, σz)가 이 등급별 공식으로 주어지기 때문에, 이 모델도 <b>기온감률 → 안정도 등급 → 확산 계수</b> 순서로 계산합니다.',
        '<table><tr><th>등급</th><th>의미</th><th>기온감률 (°C/100 m)</th></tr>' +
        [['A', '매우 불안정', '−1.9보다 빨리 식음'], ['B', '불안정', '−1.9 ~ −1.7'], ['C', '약한 불안정', '−1.7 ~ −1.5'],
         ['D', '중립', '−1.5 ~ −0.5'], ['E', '약한 안정', '−0.5 ~ +1.5'], ['F', '안정 (강한 역전)', '+1.5보다 큼']].map(function (rw, i) {
          return '<tr><td><span class="pg" style="background:' + CLS_COL[i] + '">' + rw[0] + '</span></td><td>' + rw[1] + '</td><td>' + rw[2] + '</td></tr>';
        }).join('') + '</table>',
        '기온감률 기준은 미국 환경청(EPA)의 ΔT/Δz 방법을 따랐습니다. 원래 Pasquill 방식은 지상 풍속, 낮의 일사량, 밤의 구름양으로 등급을 정합니다.']],
      chart: ['지표 농도', ['바람이 불어가는 방향 중심선에서 지표 농도(µg/m³)가 거리에 따라 어떻게 변하는지 보여 줍니다.',
        '<b>현재 곡선 고정</b>: 지금 곡선을 점선으로 남겨 다음 조건과 비교합니다. <b>세로축 고정</b>: 눈금을 고정해 시나리오끼리 크기를 비교합니다.']],
      scn: activeScn ? [activeScn.title, [activeScn.text]] : ['사용 방법', ['① 시나리오 버튼을 눌러 연기 모양이 어떻게 달라지는지 확인하고, ② 왼쪽에서 기온 분포의 점이나 레버를 움직여 조건을 바꾼 뒤, ③ 오른쪽 결과를 살펴보세요.',
        '층의 색은 대기 안정도입니다. <b style="color:#ff9d7e">빨강</b> 불안정, 회색 중립, <b style="color:#8fb8e8">파랑</b> 안정(역전).']]
    };
    if (EN) t = {
      inputs: ['Change the conditions', ['Set the weather and the stack with the temperature profile and the levers. The results on the right are recalculated immediately.',
        'The <b>stack type</b> buttons set stack height, diameter, exit temperature, exit velocity and emission rate to typical values for that kind of plant.']],
      profile: ['Temperature profile', ['Five temperatures from the ground to 600 m define four layers. Drag a point left or right, or select it and use the arrow keys (0.1 °C; Shift: 1 °C).',
        'The <b>dashed lines</b> are dry adiabats (−0.98 °C/100 m). A layer that cools faster with height than this is unstable, about the same is neutral, and one that cools more slowly or warms with height (an inversion) is stable.',
        'The numbers on the right are each layer’s lapse rate (°C/100 m) and the letters are Pasquill–Gifford stability classes (A very unstable to F stable). The <b>H</b> line is the height where the plume starts to spread.']],
      levers: ['Wind · stack · emission', ['Drag a lever handle, or select a lever and use the arrow keys (Shift: ×10).',
        'The stack diameter is set by the stack type and is now <b>' + S.d.toFixed(1) + ' m</b>.']],
      lever_u10: ['Wind speed (10 m above ground)', ['Wind speed 10 m above the ground. Wind increases with height; the calculation uses the wind at stack height.',
        'A stronger wind dilutes the plume more, but it also bends the plume over sooner, so plume rise is smaller.']],
      lever_hs: ['Stack height', ['Height of the stack top above the ground. The plume leaves here and then rises further (plume rise) before it spreads.']],
      lever_Q: ['Emission rate', ['Mass of pollutant released per second. Ground-level concentration is proportional to it; the plume shape does not change.']],
      lever_Ts: ['Exit temperature', ['Temperature of the gas leaving the stack. The hotter it is compared with the air, the more buoyant the plume and the higher it rises.']],
      lever_v: ['Exit velocity', ['Speed of the gas at the stack exit. Faster gas carries the plume higher.']],
      results: ['Results', ['Results calculated for the current conditions.',
        'A simplified teaching model: Gaussian plume ideas (Pasquill–Gifford stability, Briggs dispersion coefficients and plume rise) extended to a four-layer temperature profile. It shows plume shapes and trends; it is not for predicting real concentrations or for regulatory assessment.']],
      stat_H: ['Effective stack height H', ['Stack height plus plume rise: the height where the plume actually starts to spread.',
        'Now: stack <b>' + S.hs.toFixed(0) + ' m</b> + plume rise <b>' + (rise.dh || 0).toFixed(0) + ' m</b>.']],
      stat_stab: ['Stability at plume height', ['Stability of the layer that contains H. It controls how fast the plume spreads sideways and vertically.',
        'Wind at stack height: <b>' + (r.us || 0).toFixed(1) + ' m/s</b>.']],
      stat_cmax: ['Peak ground-level concentration', ['Highest ground-level concentration on the plume centreline within 10 km of the stack, for an emission rate of <b>' + S.Q.toFixed(0) + ' g/s</b>.']],
      stat_xmax: ['Distance to the peak', ['Downwind distance from the stack to the peak ground-level concentration. Shown as “over 10 km” if it is farther.']],
      scene: ['Plume', ['The plume seen from the side. The view is 10 km wide but only 600 m high, so the <b>vertical scale is strongly exaggerated</b>.',
        'Layer tints and the colour strip on the left show stability, the red dotted line is the effective stack height H, the arrows on the right are wind speed by height (m/s) and the red strip at the bottom is ground-level concentration.',
        'The <b>background</b> (a 19th-century British mill town) sets the mood and is <b>not to scale</b>. The sky changes between day, overcast, morning and evening with the near-surface stability, and passers-by cover their mouths or stop to cough when the concentration where they walk gets high.',
        'The plume’s looping is drawn to aid understanding; the concentrations are those in the chart below.']],
      pg: ['Pasquill–Gifford stability classes', ['A classification of atmospheric stability developed by Pasquill (1961) in the UK and refined by Gifford in the US, widely used in dispersion textbooks and regulatory models. Plume spread (the dispersion coefficients σy, σz) is given by formulas for each class, so this model works <b>lapse rate → stability class → dispersion</b>.',
        '<table><tr><th>Class</th><th>Meaning</th><th>Lapse rate (°C/100 m)</th></tr>' +
        [['A', 'Very unstable', 'cooler than −1.9'], ['B', 'Unstable', '−1.9 to −1.7'], ['C', 'Slightly unstable', '−1.7 to −1.5'],
         ['D', 'Neutral', '−1.5 to −0.5'], ['E', 'Slightly stable', '−0.5 to +1.5'], ['F', 'Stable (strong inversion)', 'above +1.5']].map(function (rw, i) {
          return '<tr><td><span class="pg" style="background:' + CLS_COL[i] + '">' + rw[0] + '</span></td><td>' + rw[1] + '</td><td>' + rw[2] + '</td></tr>';
        }).join('') + '</table>',
        'The lapse-rate limits follow the US EPA ΔT/Δz method. Pasquill’s original scheme uses surface wind speed, daytime sunshine and night-time cloud cover.']],
      chart: ['Ground-level concentration', ['How ground-level concentration (µg/m³) on the plume centreline changes with distance downwind.',
        '<b>Pin this curve</b> keeps the current curve as a dashed line for comparison. <b>Lock y-axis</b> fixes the scale so scenarios can be compared.']],
      scn: activeScn ? [activeScn.title, [activeScn.text]] : ['How to use', ['① Press a scenario button to see how the plume shape changes, ② change the temperature points or levers on the left, ③ read the results on the right.',
        'Layer colours show stability: <b style="color:#ff9d7e">red</b> unstable, grey neutral, <b style="color:#8fb8e8">blue</b> stable (inversion).']]
    };
    return t[key];
  }
  var tipEl = null, tipOwner = null, tipPinned = false, tipTimer = null;
  function closeTip() {
    if (tipEl) tipEl.hidden = true;
    if (tipOwner) tipOwner.setAttribute('aria-expanded', 'false');
    tipOwner = null; tipPinned = false;
  }
  function placeTip() {
    if (!tipOwner || tipEl.hidden) return;
    var b = tipOwner.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
    var x = clamp(b.left + b.width / 2 - t.width / 2, 8, window.innerWidth - t.width - 8);
    var y = b.bottom + 8;
    if (y + t.height > window.innerHeight - 8) y = Math.max(8, b.top - t.height - 8);
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  function showTip(btn) {
    clearTimeout(tipTimer);
    var c = TIPS(btn.dataset.tip);
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.id = 'tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
      tipEl.addEventListener('pointerenter', function () { clearTimeout(tipTimer); });
      tipEl.addEventListener('pointerleave', leaveTip); }
    tipEl.innerHTML = '<strong>' + c[0] + '</strong>' + c[1].map(function (p) { return p.indexOf('<table') === 0 ? p : '<p>' + p + '</p>'; }).join('');
    tipEl.className = 'tip' + (btn.dataset.tip === 'pg' || btn.dataset.tip === 'scene' ? ' wide' : '');
    tipEl.hidden = false;
    if (tipOwner && tipOwner !== btn) tipOwner.setAttribute('aria-expanded', 'false');
    tipOwner = btn; btn.setAttribute('aria-expanded', 'true');
    placeTip();
  }
  function leaveTip() { if (!tipPinned) tipTimer = setTimeout(closeTip, 160); }
  function info(host, key, name) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'info-button'; b.textContent = 'ⓘ'; b.dataset.tip = key;
    b.setAttribute('aria-label', T(name + ' 도움말', name + ' information')); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'tip');
    b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') showTip(b); });
    b.addEventListener('pointerleave', leaveTip);
    b.addEventListener('focus', function () { showTip(b); });
    b.addEventListener('blur', function () { if (tipOwner === b && !tipPinned) closeTip(); });
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    b.addEventListener('click', function () { if (tipOwner === b && tipPinned) closeTip(); else { showTip(b); tipPinned = true; } });
    host.appendChild(b);
    return b;
  }
  document.addEventListener('pointerdown', function (e) { if (tipOwner && !(tipEl && tipEl.contains(e.target))) closeTip(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTip(); });
  window.addEventListener('scroll', placeTip, { passive: true });
  function initStaticTips() {
    document.querySelectorAll('.ih[data-tip]').forEach(function (h) {
      var head = h.closest('.sub-head,.panel-head').querySelector('h2,h3');
      info(h, h.dataset.tip, h.dataset.name || (head ? head.textContent.replace(/^\d/, '') : ''));
    });
  }

  /* ---------------- levers ---------------- */
  var lev = {};
  function buildLevers() {
    var wrap = document.getElementById('levers');
    LEVERS.forEach(function (L) {
      var box = document.createElement('div'); box.className = 'lever';
      var lab = document.createElement('div'); lab.className = 'lever-label'; lab.textContent = L.label;
      box.appendChild(lab); info(lab, 'lever_' + L.k, L.label);
      var svg = el('svg', { viewBox: '0 0 130 96', tabindex: 0, role: 'slider', 'aria-label': L.label,
        'aria-valuemin': L.min, 'aria-valuemax': L.max }, box);
      var defs = el('defs', {}, svg);
      var gr = el('linearGradient', { id: 'br-' + L.k, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: 0, 'stop-color': '#e9cd8b' }, gr); el('stop', { offset: 1, 'stop-color': '#9c7128' }, gr);
      var px = 65, py = 84, R0 = 62;
      // base plate (half disc)
      el('path', { d: 'M' + (px - R0 - 4) + ',' + py + ' A' + (R0 + 4) + ',' + (R0 + 4) + ' 0 0 1 ' + (px + R0 + 4) + ',' + py + ' Z', fill: '#3a3530' }, svg);
      el('path', { d: 'M' + (px - R0) + ',' + py + ' A' + R0 + ',' + R0 + ' 0 0 1 ' + (px + R0) + ',' + py + ' Z', fill: 'url(#br-' + L.k + ')' }, svg);
      for (var a = -60; a <= 60; a += 10) {
        var rad = a * Math.PI / 180, r1 = R0 - 3, r2 = a % 30 === 0 ? R0 - 12 : R0 - 8;
        el('line', { x1: px + r1 * Math.sin(rad), y1: py - r1 * Math.cos(rad), x2: px + r2 * Math.sin(rad), y2: py - r2 * Math.cos(rad), stroke: '#4a3615', 'stroke-width': a % 30 === 0 ? 2 : 1 }, svg);
      }
      var arm = el('g', {}, svg);
      el('rect', { x: px - 3, y: py - 64, width: 6, height: 64, rx: 3, fill: '#2b2723' }, arm);
      el('circle', { cx: px, cy: py - 66, r: 9.5, fill: '#7a1f17', stroke: '#2b2723', 'stroke-width': 2 }, arm);
      el('circle', { cx: px - 3, cy: py - 69, r: 3, fill: '#ffffff55' }, arm);
      el('circle', { cx: px, cy: py, r: 8, fill: '#2b2723' }, svg);
      el('circle', { cx: px, cy: py, r: 3.5, fill: '#c9a259' }, svg);
      el('rect', { x: 0, y: py, width: 130, height: 12, fill: '#3a3530', rx: 2 }, svg);
      var read = document.createElement('div'); read.className = 'lever-read'; box.appendChild(read);
      wrap.appendChild(box);
      lev[L.k] = { L: L, arm: arm, svg: svg, read: read };
      function fromPointer(ev) {
        var r = svg.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width * 130, y = (ev.clientY - r.top) / r.height * 96;
        var ang = Math.atan2(x - px, py - y) * 180 / Math.PI;
        ang = clamp(ang, -60, 60);
        setLever(L, L.min + (ang + 60) / 120 * (L.max - L.min));
      }
      svg.addEventListener('pointerdown', function (e) {
        e.preventDefault(); svg.focus(); svg.setPointerCapture(e.pointerId); svg.classList.add('drag');
        fromPointer(e);
        function mv(ev) { fromPointer(ev); }
        function up() { svg.classList.remove('drag'); svg.removeEventListener('pointermove', mv); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); }
        svg.addEventListener('pointermove', mv); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
      });
      svg.addEventListener('keydown', function (e) {
        var st = L.step * (e.shiftKey ? 10 : 1);
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setLever(L, S[L.k] + st); e.preventDefault(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setLever(L, S[L.k] - st); e.preventDefault(); }
        if (e.key === 'Home') { setLever(L, L.min); e.preventDefault(); }
        if (e.key === 'End') { setLever(L, L.max); e.preventDefault(); }
      });
    });
  }
  function setLever(L, v) {
    if (tw) { cancelAnimationFrame(tw); tw = null; }
    v = Math.round(clamp(v, L.min, L.max) / L.step) * L.step;
    S[L.k] = +v.toFixed(3);
    userChanged();
  }
  function syncLevers() {
    LEVERS.forEach(function (L) {
      var o = lev[L.k]; if (!o) return;
      var v = clamp(S[L.k], L.min, L.max), ang = -60 + 120 * (v - L.min) / (L.max - L.min);
      o.arm.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ' 65 84)');
      o.read.textContent = S[L.k].toFixed(L.dec) + ' ' + L.unit;
      o.svg.setAttribute('aria-valuenow', S[L.k].toFixed(L.dec));
      o.svg.setAttribute('aria-valuetext', S[L.k].toFixed(L.dec) + ' ' + L.unit);
    });
  }

  /* ---------------- stack types / scenarios ---------------- */
  function buildButtons() {
    var st = document.getElementById('stackTypes');
    STACKS.forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tool'; b.textContent = s.label;
      b.addEventListener('click', function () { tweenTo(mix(S, s.set), 700); if (activeScn) { modified = true; renderCard(); } });
      st.appendChild(b);
    });
    document.getElementById('resetBtn').addEventListener('click', function () {
      activeScn = null; modified = false; pinned = null; setPressed(); renderCard(); updatePinBtn();
      tweenTo(clone(DEF), 900);
    });
    var list = document.getElementById('scnList'), lastGroup = null;
    SCN.forEach(function (sc) {
      if (lastGroup && lastGroup !== sc.group) { var sep = document.createElement('span'); sep.className = 'scn-sep'; list.appendChild(sep); }
      lastGroup = sc.group;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'scn-btn' + (sc.group === 'compare' ? ' cmp' : '');
      b.setAttribute('aria-pressed', 'false'); b.dataset.id = sc.id;
      b.innerHTML = '<b>' + sc.name + '</b><span>' + sc.en + '</span>';
      b.addEventListener('click', function () { runScenario(sc); });
      list.appendChild(b);
    });
    var pin = document.getElementById('pinBtn');
    pin.addEventListener('click', function () {
      pinned = pinned ? null : { gl: Float64Array.from(R.gl), cmax: R.cmax };
      updatePinBtn(); drawChart();
    });
    var lock = document.getElementById('lockBtn');
    lock.addEventListener('click', function () {
      yLock = yLock ? null : curYmax;
      lock.setAttribute('aria-pressed', yLock ? 'true' : 'false'); drawChart();
    });
  }
  function updatePinBtn() {
    var b = document.getElementById('pinBtn');
    b.setAttribute('aria-pressed', pinned ? 'true' : 'false');
    b.textContent = pinned ? T('고정 해제', 'Unpin') : T('현재 곡선 고정', 'Pin this curve');
  }
  function setPressed() {
    document.querySelectorAll('.scn-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', activeScn && b.dataset.id === activeScn.id ? 'true' : 'false');
    });
  }
  function runScenario(sc) {
    activeScn = sc; modified = false; setPressed(); renderCard();
    parts.forEach(function (p) { if (p.kill === undefined) p.kill = tSim; });   // old smoke fades out
    if (sc.from) {
      tweenTo(clone(sc.from), 700, function () {
        var r = P.solve(S); pinned = { gl: Float64Array.from(r.gl), cmax: r.cmax }; updatePinBtn();
        setTimeout(function () { if (activeScn === sc) tweenTo(clone(sc.set), 1800); }, 500);
      });
    } else {
      pinned = null; updatePinBtn();
      tweenTo(clone(sc.set), 1200);
    }
  }
  function renderCard() {
    var c = document.getElementById('scnCard');
    if (tipOwner && tipOwner.dataset.tip === 'scn') closeTip();
    var sc = activeScn;
    var title = sc ? (EN ? sc.name : sc.name + ' (' + sc.en + ')') : T('시나리오를 골라 보세요', 'Choose a scenario');
    if (sc && sc.group === 'compare') title = sc.name;
    var sum = sc ? SUM[sc.id] : T('버튼을 누르면 그 기상 조건으로 바뀌고, 설명과 질문이 나타납니다.', 'Each button sets up its weather conditions and shows an explanation and a question.');
    var q = sc ? sc.q : T('같은 굴뚝, 같은 배출량인데도 날씨에 따라 지표 농도가 몇 배나 달라질까요?', 'Same stack, same emissions: how many times can the ground-level concentration change with the weather alone?');
    c.innerHTML = '<div class="scn-main"><h3>' + title + '</h3><span class="dash">|</span><p>' + sum + '</p></div>' +
      '<div class="q"><b>' + T('질문', 'Question') + '</b><span>' + q + '</span></div>';
    var main = c.querySelector('.scn-main');
    info(main, 'scn', title);
    if (modified) { var bd = document.createElement('span'); bd.className = 'badge'; bd.textContent = T('직접 조절 중', 'Adjusted'); main.appendChild(bd); }
  }

  /* ---------------- scene (canvas animation) ---------------- */
  var cv = document.getElementById('scene'), ctx = cv.getContext('2d');
  var scn = { w: 0, h: 0, dpr: 1 };
  var parts = [], tSim = 0, lastNow = 0, emitAcc = 0;
  function makeSprite(r, g0, b) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    function col(d, a) { return 'rgba(' + (r + d) + ',' + (g0 + d) + ',' + (b + d) + ',' + a + ')'; }
    rg.addColorStop(0, col(0, 1)); rg.addColorStop(0.35, col(6, 0.75)); rg.addColorStop(0.7, col(13, 0.28)); rg.addColorStop(1, col(18, 0));
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return c;
  }
  var spriteDay = makeSprite(64, 60, 58), spriteNight = makeSprite(188, 180, 182);  // smoke reads lighter under a dusk sky
  var sprite = spriteDay;
  function resizeScene() {
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    scn.w = r.width; scn.h = r.height; scn.dpr = dpr;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    art.layout(scn.w, scn.h, sz(0), SL, SR, scn.dpr);
  }
  var art = window.PlumeArt.create();
  var motion = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  (function () {
    var b = document.getElementById('motionBtn');
    function sync() { b.setAttribute('aria-pressed', motion ? 'true' : 'false'); b.textContent = motion ? T('배경 움직임 켜짐', 'Background motion on') : T('배경 움직임 꺼짐', 'Background motion off'); }
    b.addEventListener('click', function () { motion = !motion; sync(); });
    sync();
  })();
  // label with a soft halo; at dusk the text turns light and the halo dark so it stays legible
  function haloText(c, txt, x, y, col) {
    var d = art.darkness();
    c.lineWidth = 3; c.lineJoin = 'round';
    c.strokeStyle = d > 0.5 ? 'rgba(30,26,30,' + (0.45 * d) + ')' : 'rgba(255,250,240,' + (0.75 * (1 - d * 2)) + ')';
    c.strokeText(txt, x, y);
    c.fillStyle = d > 0.5 ? (col === '#8a2d22' ? '#ffb39a' : '#f1e6d4') : col;
    c.fillText(txt, x, y);
  }
  function sx(x) { return SL + x / XMAX * (scn.w - SL - SR); }
  function sz(z) { return PT + (1 - z / ZTOP) * (scn.h - PT - PB); }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function stepParticles(dt) {
    if (!R) return;
    var us = R.us, crossing = 18 + 60 / us;          // seconds to cross 10 km on screen
    var vis = XMAX / crossing;                        // simulated metres per real second
    var ciz = R.prof.ci, ciH = R.ciH;
    // temporally correlated (smooth) turbulence: OU noise, rescaled so that the
    // long-term spread is the same as for an uncorrelated random walk
    var rho = Math.exp(-dt / 1.3), kfix = Math.sqrt((1 - rho) / (1 + rho)), knew = Math.sqrt(1 - rho * rho);
    // emission
    emitAcc += dt * 60;
    while (emitAcc >= 1) {
      emitAcc -= 1;
      parts.push({ x: 1 + Math.random() * 15, zs: R.H + gauss() * 2, n: gauss(), te: tSim });
    }
    // looping (visual only): in unstable air part of the spread is drawn as a coherent
    // meander of the whole plume, so the random-walk share is reduced accordingly
    var instab = Math.max(0, 2.5 - ciH) / 2.5;
    var amp0 = instab * 190;
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i], dx = vis * dt, x1 = p.x + dx;
      var li = P.layerAt(clamp(p.zs, 0, ZTOP - 1));
      var za = P.sigZ(p.x, ciz[li]), zb = P.sigZ(x1, ciz[li]);
      var D = 0.5 * (zb * zb - za * za);
      if (ciz[li] < 2.5) D *= 1 - 0.65 * Math.max(0, 2.5 - ciz[li]) / 2.5;
      p.n = rho * p.n + knew * gauss();
      var nz = p.zs + Math.sqrt(2 * Math.max(D, 0)) * p.n * kfix;
      // interface crossing: transmit with probability sqrt(Dlow/Dhigh)
      var lj = P.layerAt(clamp(nz, 0, ZTOP - 1));
      if (lj !== li) {
        var zc = P.sigZ(p.x, ciz[lj]), zd = P.sigZ(x1, ciz[lj]);
        var D2 = 0.5 * (zd * zd - zc * zc);
        if (ciz[lj] < 2.5) D2 *= 1 - 0.65 * Math.max(0, 2.5 - ciz[lj]) / 2.5;
        if (D2 < D && Math.random() > Math.sqrt(D2 / D)) {
          var bnd = lj > li ? ZB[li + 1] : ZB[li];
          nz = 2 * bnd - nz; p.n = -p.n;
        }
      }
      if (nz < 0) { nz = -nz; p.n = Math.abs(p.n); }
      if (nz > ZTOP) { nz = 2 * ZTOP - nz; p.n = -Math.abs(p.n); }
      p.zs = nz; p.x = x1;
      p.amp = amp0;
      if (p.x > XMAX * 1.03 || (p.kill !== undefined && tSim - p.kill > 1.6)) parts.splice(i, 1);
    }
    if (parts.length > 2600) parts.splice(0, parts.length - 2600);
  }

  function drawScene(dt) {
    var w = scn.w, h = scn.h, c = ctx;
    c.setTransform(scn.dpr, 0, 0, scn.dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    if (!R) return;
    // sky (mood follows near-surface stability) + distant industrial town
    art.setMood(R.prof.ci); art.update(dt);
    art.sky(c, PT);
    // layer tints (kept faint over the scenery) + colour key on the left edge
    for (var i = 0; i < 4; i++) {
      var ci = Math.round(R.prof.ci[i]), y1 = sz(ZB[i + 1]), hh = sz(ZB[i]) - y1;
      c.fillStyle = CLS_COL[ci]; c.globalAlpha = ci >= 4 ? 0.11 : ci === 3 ? 0.03 : 0.08;
      c.fillRect(0, y1, w, hh);
      c.globalAlpha = 0.9; c.fillRect(0, y1, 4, hh);
    }
    c.globalAlpha = 1;
    art.back(c);
    c.strokeStyle = 'rgba(90,80,66,.45)'; c.setLineDash([4, 3]); c.lineWidth = 1;
    for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(4, sz(ZB[i]) + .5); c.lineTo(w, sz(ZB[i]) + .5); c.stroke(); }
    c.setLineDash([]);
    // height labels
    c.font = '11px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'left';
    for (i = 1; i <= 4; i++) haloText(c, ZB[i] + ' m', 8, sz(ZB[i]) + 13, '#5f574b');
    // effective height line
    var yH = sz(R.H);
    c.strokeStyle = 'rgba(138,45,34,.6)'; c.setLineDash([2, 3]);
    c.beginPath(); c.moveTo(sx(0), yH + .5); c.lineTo(w - SR, yH + .5); c.stroke(); c.setLineDash([]);
    sprite = art.darkness() > 0.5 ? spriteNight : spriteDay;
    // mill and brick chimney (smoke is drawn in front of them)
    art.factory(c, sx(0), sz(S.hs));
    // particles
    var ciH = R.ciH;
    // contiguous non-stable region around each layer: the looping meander may not cross a stable layer
    var lo = [], hi = [];
    for (i = 0; i < 4; i++) {
      var a0 = i, b0 = i;
      if (R.prof.ci[i] < 3.5) {
        while (a0 > 0 && R.prof.ci[a0 - 1] < 3.5) a0--;
        while (b0 < 3 && R.prof.ci[b0 + 1] < 3.5) b0++;
      }
      lo[i] = ZB[a0]; hi[i] = ZB[b0 + 1];
    }
    for (var k = 0; k < parts.length; k++) {
      var p = parts[k];
      var zr = p.zs - (R.rise.dh - P.riseAt(p.x, R.rise));
      var li = P.layerAt(clamp(p.zs, 0, ZTOP - 1));
      if (R.prof.ci[li] < 3.5 && p.amp > 0) {
        var ramp = Math.min(1, p.x / 1800);
        var zl = lo[li], zh = hi[li];
        zr += Math.min(p.amp, 0.22 * (zh - zl)) * ramp * Math.sin(2 * Math.PI * p.te / 7.0);
        for (var rr = 0; rr < 3; rr++) { if (zr < zl) zr = 2 * zl - zr; if (zr > zh) zr = 2 * zh - zr; }
      }
      if (zr < 0) zr = -zr;
      var X = sx(p.x), Y = sz(Math.min(zr, ZTOP));
      var szm = P.sigZ(Math.max(p.x, 30), ciH), syy = P.sigY(Math.max(p.x, 30), ciH);
      var rad = clamp(szm * (scn.h - PT - PB) / ZTOP * 0.75, 3.5, 34) * (0.85 + 0.3 * ((k * 0.618) % 1));
      var a = clamp(0.36 * 30 / (30 + syy), 0.03, 0.36);
      if (p.x < 150) a *= 0.5 + p.x / 300;
      if (p.x > XMAX * 0.92) a *= Math.max(0, (XMAX * 1.03 - p.x) / (XMAX * 0.11));
      if (p.kill !== undefined) a *= Math.max(0, 1 - (tSim - p.kill) / 1.5);
      c.globalAlpha = a;
      c.drawImage(sprite, X - rad, Y - rad, rad * 2, rad * 2);
    }
    c.globalAlpha = 1;
    // ground: railway, steam train, pedestrians reacting to ground-level concentration
    var g0 = sz(0);
    art.ground(c, dt, function (px) { return P.glAt(R, (px - SL) / (w - SL - SR) * XMAX); }, motion);
    art.post(c);   // film grain + vignette
    // ground-level concentration strip (bottom of the scene)
    var ymax = curYmax, sy0 = h - 8;
    c.fillStyle = 'rgba(40,32,26,.35)'; c.fillRect(sx(0), sy0, w - SR - sx(0), 6);
    for (var gx = sx(0); gx < w - SR; gx += 2) {
      var xm = (gx - SL) / (w - SL - SR) * XMAX, v = P.glAt(R, xm) / ymax;
      if (v > 0.01) { c.fillStyle = 'rgba(196,52,36,' + clamp(v, 0, 1) * 0.95 + ')'; c.fillRect(gx, sy0, 2, 6); }
    }
    c.font = '10px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'left';
    c.fillStyle = 'rgba(255,248,235,.85)'; c.fillText(T('지표 농도', 'Ground conc.'), 4, h - 2);
    // wind arrows (right edge)
    c.lineWidth = 1.6; c.textAlign = 'right';
    var mids = [50, 175, 325, 500];
    for (i = 0; i < 4; i++) {
      var u = P.windAt(S.u10, R.prof.ci[0], mids[i]), len = clamp(u * 3, 6, 46), yy = sz(mids[i]), xe = w - 6;
      var dk = art.darkness() > 0.5, acol = dk ? '#f1e6d4' : '#3f382f';
      c.strokeStyle = dk ? 'rgba(30,26,30,.35)' : 'rgba(255,250,240,.7)'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(xe - len, yy); c.lineTo(xe - 3, yy); c.stroke();
      c.strokeStyle = acol; c.fillStyle = acol; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(xe - len, yy); c.lineTo(xe, yy); c.stroke();
      c.beginPath(); c.moveTo(xe, yy); c.lineTo(xe - 6, yy - 4); c.lineTo(xe - 6, yy + 4); c.closePath(); c.fill();
      c.font = '10px Pretendard Variable, Pretendard, sans-serif';
      haloText(c, u.toFixed(1), xe, yy - 6, '#3f382f');
    }
    haloText(c, T('바람 m/s', 'Wind m/s'), w - 4, PT + 4, '#3f382f');
    c.textAlign = 'left';
    c.font = '600 11px Pretendard Variable, Pretendard, sans-serif';
    haloText(c, 'H ' + R.H.toFixed(0) + ' m', sx(0) + 12, yH - 5, '#8a2d22');
  }

  function frame(now) {
    var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now; tSim += dt;
    stepParticles(dt);
    drawScene(dt);
    requestAnimationFrame(frame);
  }

  /* ---------------- init ---------------- */
  function layout() { buildProfile(); buildChart(); resizeScene(); recompute(); }
  // state carried over a language switch
  var saved = window.PL.takeState();
  if (saved && saved.S) {
    S = saved.S; modified = !!saved.modified;
    activeScn = SCN.filter(function (x) { return x.id === saved.scn; })[0] || null;
  }
  initStaticTips(); buildStats(); buildLevers(); buildButtons(); setPressed(); renderCard();
  layout();
  var langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.addEventListener('click', function () {
    window.PL.setLang(EN ? 'ko' : 'en', { S: S, scn: activeScn && activeScn.id, modified: modified });
  });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
  // warm up particles so the plume is already visible on first paint
  for (var i = 0; i < 900; i++) { tSim += 0.05; stepParticles(0.05); }
  requestAnimationFrame(frame);
  window.__plume = { S: S, run: function (id) { runScenario(SCN.filter(function (s) { return s.id === id; })[0]); }, get R() { return R; } };
})();
