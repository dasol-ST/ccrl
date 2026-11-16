/* CCRL Classroom — plume simulator: game-style guided tour (spotlight + card). */
(function () {
  'use strict';
  var T = window.PL.T, KEY = 'ccrl-plume-tour-seen';
  var STEPS = [
    { sel: '#pScn', title: T('① 시나리오', '① Scenarios'),
      text: T('연기 모양의 대표 유형 다섯 가지입니다. 버튼을 누르면 그 날씨로 조건이 바뀌고, 설명과 생각해 볼 질문이 나타납니다.',
        'The five classic plume types. Each button sets up its weather and shows an explanation and a question to think about.') },
    { sel: '#pProf', title: T('② 기온의 연직 분포', '② Temperature profile'),
      text: T('점 다섯 개를 좌우로 끌어 각 높이의 기온을 바꿔 보세요. 층마다 기온감률과 안정도 등급(A–F)이 바로 계산되고, 점선(건조단열선)과 비교하면 안정·불안정을 읽을 수 있습니다.',
        'Drag the five points left or right to change the temperature at each height. Each layer’s lapse rate and stability class (A–F) update at once; compare the slope with the dashed dry adiabats.') },
    { sel: '#pLev', title: T('슬라이더와 굴뚝 종류', 'Sliders and stack type'),
      text: T('풍속, 굴뚝 높이, 배출량, 배출가스 온도, 배출 속도를 슬라이더로 조절합니다. 위의 굴뚝 종류 버튼은 시설별 대표값을 한꺼번에 넣어 줍니다.',
        'Set wind speed, stack height, emission rate, exit temperature and exit velocity with the sliders. The stack-type buttons above load typical values for a kind of plant.'), extra: '.stack-types' },
    { sel: '#pStats', title: T('③ 결과 숫자', '③ Results'),
      text: T('유효 굴뚝 높이, 연기 높이의 안정도, 지표 최고 농도와 그 거리가 조건을 바꿀 때마다 다시 계산됩니다. ⓘ에 마우스를 올리면 자세한 설명이 나옵니다.',
        'Effective stack height, stability at plume height, peak ground-level concentration and its distance are recalculated with every change. Hover over ⓘ for details.') },
    { sel: '#pScene', title: T('연기 확산', 'The plume'),
      text: T('옆에서 본 굴뚝 연기입니다(세로는 크게 과장). 행인들은 자기 위치의 지표 농도가 높아지면 호박색, 아주 높으면 진홍색으로 바뀌며 기침합니다. 설명에 집중할 때는 배경 움직임을 꺼 두세요.',
        'The plume seen from the side (vertical scale exaggerated). Passers-by turn amber where ground-level concentration is high and crimson, coughing, where it is very high. Turn background motion off when you want to focus.') },
    { sel: '#pChart', title: T('지표 농도 그래프', 'Ground-level concentration'),
      text: T('굴뚝에서 10 km까지 지표 농도가 어떻게 변하는지 보여 줍니다. “현재 곡선 고정”을 누르고 조건을 바꾸면 두 곡선을 비교할 수 있습니다.',
        'How ground-level concentration changes out to 10 km. Press “Pin this curve”, then change something to compare the two curves.') },
    { sel: '.top-tools', title: T('언제든 다시', 'Any time'),
      text: T('사용법과 인트로는 여기서 다시 볼 수 있고, EN 버튼으로 영어 화면으로 바꿀 수 있습니다. 이제 시나리오 버튼부터 눌러 보세요.',
        'Replay this guide or the intro here, and switch language with the language button. Now try the scenario buttons.') }
  ];
  var ov, hole, card, idx = 0, open = false;
  function build() {
    ov = document.createElement('div'); ov.className = 'tour'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'tourTitle');
    ov.innerHTML = '<div class="tour-hole"></div><div class="tour-card"><p class="tour-step" id="tourStep"></p><h2 id="tourTitle"></h2><p id="tourText"></p>' +
      '<div class="tour-ctl"><button type="button" class="tour-skip">' + T('건너뛰기', 'Skip') + '</button><button type="button" class="tour-prev">' + T('이전', 'Back') + '</button><button type="button" class="tour-next"></button></div></div>';
    document.body.appendChild(ov);
    hole = ov.querySelector('.tour-hole'); card = ov.querySelector('.tour-card');
    ov.querySelector('.tour-skip').addEventListener('click', close);
    ov.querySelector('.tour-prev').addEventListener('click', function () { if (idx > 0) go(idx - 1); });
    ov.querySelector('.tour-next').addEventListener('click', function () { if (idx < STEPS.length - 1) go(idx + 1); else close(); });
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); ov.querySelector('.tour-next').click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ov.querySelector('.tour-prev').click(); }
    });
    window.addEventListener('resize', function () { if (open) place(); });
    window.addEventListener('scroll', function () { if (open) place(); }, { passive: true });
  }
  function target() { return document.querySelector(STEPS[idx].sel); }
  function place() {
    var el = target(); if (!el) return;
    var r = el.getBoundingClientRect(), pad = 8;
    hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px';
    hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = (r.height + pad * 2) + 'px';
    var cw = Math.min(380, window.innerWidth - 24), ch = card.offsetHeight, vw = window.innerWidth, vh = window.innerHeight, x, y;
    if (vh - r.bottom - pad > ch + 16) { y = r.bottom + pad + 12; x = r.left; }
    else if (r.top - pad > ch + 16) { y = r.top - pad - 12 - ch; x = r.left; }
    else if (vw - r.right > cw + 24) { x = r.right + pad + 12; y = r.top; }
    else if (r.left > cw + 24) { x = r.left - pad - 12 - cw; y = r.top; }
    else { x = (vw - cw) / 2; y = vh - ch - 16; }
    card.style.width = cw + 'px';
    card.style.left = Math.max(12, Math.min(vw - cw - 12, x)) + 'px';
    card.style.top = Math.max(12, Math.min(vh - ch - 12, y)) + 'px';
  }
  function go(i) {
    idx = i;
    var s = STEPS[i];
    ov.querySelector('#tourStep').textContent = (i + 1) + ' / ' + STEPS.length;
    ov.querySelector('#tourTitle').textContent = s.title;
    ov.querySelector('#tourText').textContent = s.text;
    ov.querySelector('.tour-prev').hidden = i === 0;
    ov.querySelector('.tour-next').textContent = i === STEPS.length - 1 ? T('시작하기', 'Start') : T('다음', 'Next');
    var el = target();
    if (el) {
      var r = el.getBoundingClientRect();
      if (r.top < 60 || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? 'start' : 'center' });
    }
    requestAnimationFrame(function () { place(); requestAnimationFrame(place); });
    ov.querySelector('.tour-next').focus();
  }
  function start() {
    if (!ov) build();
    ov.hidden = false; open = true; document.body.classList.add('tour-open');
    go(0);
  }
  function close() {
    if (!ov) return;
    ov.hidden = true; open = false; document.body.classList.remove('tour-open');
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    var b = document.getElementById('tourBtn'); if (b) b.focus();
  }
  function maybeStart() {
    var seen = false; try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
    if (!seen) setTimeout(start, 400);
  }
  var btn = document.getElementById('tourBtn'); if (btn) btn.addEventListener('click', start);
  window.__plumeTour = { start: start, close: close, maybeStart: maybeStart };
})();
