/* CCRL Classroom kit — shared pieces for teaching interactives (copy this file into each material).
 * CK.T('한국어','English')  language, CK.info()  ⓘ tooltips, CK.lever()  brass levers,
 * CK.intro()  story intro (every visit), CK.tour()  spotlight guide (after the intro, every visit). */
(function () {
  'use strict';
  var lang = 'ko';
  try { lang = localStorage.getItem('ccrl-lang') || lang; } catch (e) {}
  var m = /[?&]lang=(ko|en)/.exec(location.search); if (m) lang = m[1];
  document.documentElement.lang = lang;
  var EN = lang === 'en';
  function T(ko, en) { return EN ? en : ko; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, parent) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  /* ---- language ---- */
  function applyStatic() {
    if (!EN) return;
    document.querySelectorAll('[data-en]').forEach(function (el) { if (el.tagName !== 'META') el.textContent = el.getAttribute('data-en'); });
    document.querySelectorAll('[data-en-label]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-en-label')); });
    var d = document.querySelector('meta[name=description]'); if (d && d.dataset.en) d.content = d.dataset.en;
    if (document.body.dataset.enTitle) document.title = document.body.dataset.enTitle;
  }
  function setLang(l, state, key) {
    try { localStorage.setItem('ccrl-lang', l); if (state) sessionStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
    location.href = location.href.replace(/([?&])lang=(ko|en)&?/, '$1').replace(/[?&]$/, '');
  }
  function takeState(key) {
    try { var s = sessionStorage.getItem(key); sessionStorage.removeItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }

  /* ---- ⓘ tooltips: hover shows, click pins, Esc / outside click closes ---- */
  var tipEl = null, owner = null, pinned = false, timer = null, provider = null;
  function closeTip() { if (tipEl) tipEl.hidden = true; if (owner) owner.setAttribute('aria-expanded', 'false'); owner = null; pinned = false; }
  function placeTip() {
    if (!owner || !tipEl || tipEl.hidden) return;
    var b = owner.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
    var x = clamp(b.left + b.width / 2 - t.width / 2, 8, innerWidth - t.width - 8), y = b.bottom + 8;
    if (y + t.height > innerHeight - 8) y = Math.max(8, b.top - t.height - 8);
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  function showTip(btn) {
    clearTimeout(timer);
    var c = provider ? provider(btn.dataset.tip) : null; if (!c) return;
    if (!tipEl) {
      tipEl = document.createElement('div'); tipEl.className = 'ck-tip'; tipEl.id = 'ck-tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
      tipEl.addEventListener('pointerenter', function () { clearTimeout(timer); });
      tipEl.addEventListener('pointerleave', leaveTip);
    }
    tipEl.className = 'ck-tip' + (c.wide ? ' wide' : '');
    tipEl.innerHTML = '<strong>' + c[0] + '</strong>' + c[1].map(function (p) { return /^<(table|ul)/.test(p) ? p : '<p>' + p + '</p>'; }).join('');
    tipEl.hidden = false;
    if (owner && owner !== btn) owner.setAttribute('aria-expanded', 'false');
    owner = btn; btn.setAttribute('aria-expanded', 'true'); placeTip();
  }
  function leaveTip() { if (!pinned) timer = setTimeout(closeTip, 160); }
  function info(host, key, name) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ck-info'; b.dataset.tip = key;
    b.setAttribute('aria-label', T(name + ' 도움말', name + ' information')); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'ck-tip');
    b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') showTip(b); });
    b.addEventListener('pointerleave', leaveTip);
    b.addEventListener('focus', function () { showTip(b); });
    b.addEventListener('blur', function () { if (owner === b && !pinned) closeTip(); });
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    b.addEventListener('click', function () { if (owner === b && pinned) closeTip(); else { showTip(b); pinned = true; } });
    host.appendChild(b); return b;
  }
  document.addEventListener('pointerdown', function (e) { if (owner && !(tipEl && tipEl.contains(e.target))) closeTip(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTip(); });
  addEventListener('scroll', placeTip, { passive: true });
  function initTips(fn) {
    provider = fn;
    document.querySelectorAll('.ck-ih[data-tip]').forEach(function (h) {
      var head = h.closest('[data-head]') || h.parentNode, t = head.querySelector('h2,h3');
      info(h, h.dataset.tip, h.dataset.name || (t ? t.textContent.replace(/^\d/, '') : ''));
    });
  }

  /* ---- brass lever (semicircular dial with a handle) ---- */
  function lever(wrap, L, get, set) {
    var box = document.createElement('div'); box.className = 'ck-lever';
    var lab = document.createElement('div'); lab.className = 'ck-lever-label'; lab.textContent = L.label; box.appendChild(lab);
    if (L.tip) info(lab, L.tip, L.label);
    var s = svg('svg', { viewBox: '0 0 130 96', tabindex: 0, role: 'slider', 'aria-label': L.label, 'aria-valuemin': L.min, 'aria-valuemax': L.max }, box);
    var id = 'g' + Math.random().toString(36).slice(2, 8), defs = svg('defs', {}, s), gr = svg('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svg('stop', { offset: 0, 'stop-color': 'var(--ck-dial-hi)' }, gr); svg('stop', { offset: 1, 'stop-color': 'var(--ck-dial-lo)' }, gr);
    var px = 65, py = 84, R0 = 62;
    svg('path', { d: 'M' + (px - R0 - 4) + ',' + py + ' A' + (R0 + 4) + ',' + (R0 + 4) + ' 0 0 1 ' + (px + R0 + 4) + ',' + py + ' Z', fill: 'var(--ck-dial-rim)' }, s);
    svg('path', { d: 'M' + (px - R0) + ',' + py + ' A' + R0 + ',' + R0 + ' 0 0 1 ' + (px + R0) + ',' + py + ' Z', fill: 'url(#' + id + ')' }, s);
    for (var a = -60; a <= 60; a += 10) {
      var rad = a * Math.PI / 180, r1 = R0 - 3, r2 = a % 30 === 0 ? R0 - 12 : R0 - 8;
      svg('line', { x1: px + r1 * Math.sin(rad), y1: py - r1 * Math.cos(rad), x2: px + r2 * Math.sin(rad), y2: py - r2 * Math.cos(rad), stroke: 'var(--ck-dial-tick)', 'stroke-width': a % 30 === 0 ? 2 : 1 }, s);
    }
    var arm = svg('g', {}, s);
    svg('rect', { x: px - 3, y: py - 64, width: 6, height: 64, rx: 3, fill: 'var(--ck-dial-arm)' }, arm);
    svg('circle', { cx: px, cy: py - 66, r: 9.5, fill: 'var(--ck-knob)', stroke: 'var(--ck-dial-arm)', 'stroke-width': 2 }, arm);
    svg('circle', { cx: px, cy: py, r: 8, fill: 'var(--ck-dial-arm)' }, s);
    svg('rect', { x: 0, y: py, width: 130, height: 12, fill: 'var(--ck-dial-rim)', rx: 2 }, s);
    var read = document.createElement('div'); read.className = 'ck-lever-read'; box.appendChild(read);
    wrap.appendChild(box);
    function put(v) { v = Math.round(clamp(v, L.min, L.max) / L.step) * L.step; set(+v.toFixed(4)); }
    function fromPointer(ev) {
      var r = s.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 130, y = (ev.clientY - r.top) / r.height * 96;
      var ang = clamp(Math.atan2(x - px, py - y) * 180 / Math.PI, -60, 60);
      put(L.min + (ang + 60) / 120 * (L.max - L.min));
    }
    s.addEventListener('pointerdown', function (e) {
      e.preventDefault(); s.focus(); s.setPointerCapture(e.pointerId); fromPointer(e);
      function mv(ev) { fromPointer(ev); }
      function up() { s.removeEventListener('pointermove', mv); s.removeEventListener('pointerup', up); s.removeEventListener('pointercancel', up); }
      s.addEventListener('pointermove', mv); s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
    });
    s.addEventListener('keydown', function (e) {
      var st = L.step * (e.shiftKey ? 10 : 1);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { put(get() + st); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { put(get() - st); e.preventDefault(); }
      if (e.key === 'Home') { put(L.min); e.preventDefault(); }
      if (e.key === 'End') { put(L.max); e.preventDefault(); }
    });
    return {
      sync: function () {
        var v = clamp(get(), L.min, L.max), ang = -60 + 120 * (v - L.min) / (L.max - L.min);
        arm.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ' 65 84)');
        var txt = L.fmt ? L.fmt(get()) : get().toFixed(L.dec || 0) + (L.unit ? ' ' + L.unit : '');
        read.textContent = txt; s.setAttribute('aria-valuenow', get()); s.setAttribute('aria-valuetext', txt);
      }
    };
  }

  /* ---- intro (every new visit; not repeated within a tab session) ---- */
  function intro(opt) {
    var KEY = opt.key, pages = opt.pages, page = 0, running = false, last = 0, t = 0;
    var box = document.createElement('div'); box.className = 'ck-intro'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ckIntroTitle');
    box.innerHTML = '<canvas aria-hidden="true"></canvas><figure class="ck-intro-photo" hidden><img alt=""><figcaption></figcaption></figure>' +
      '<div class="ck-intro-card"><p class="ck-intro-kicker"></p><h2 id="ckIntroTitle"></h2><p class="ck-intro-text"></p>' +
      '<div class="ck-intro-ctl"><div class="ck-intro-dots" role="group" aria-label="' + T('장면', 'Scenes') + '"></div>' +
      '<button type="button" class="ck-intro-skip">' + T('건너뛰기', 'Skip') + '</button><button type="button" class="ck-intro-next"></button></div></div>';
    document.body.appendChild(box);
    var cv = box.querySelector('canvas'), ctx = cv.getContext('2d'), dots = box.querySelector('.ck-intro-dots');
    var next = box.querySelector('.ck-intro-next'), skip = box.querySelector('.ck-intro-skip'), dpr = 1, W = 0, H = 0;
    pages.forEach(function (_, i) {
      var d = document.createElement('button'); d.type = 'button'; d.className = 'ck-intro-dot'; d.setAttribute('aria-label', T((i + 1) + '번째 장면', 'Scene ' + (i + 1)));
      d.addEventListener('click', function () { page = i; render(true); }); dots.appendChild(d);
    });
    function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); if (opt.resize) opt.resize(W, H); }
    function render(fade) {
      var p = pages[page];
      function apply() {
        box.querySelector('.ck-intro-kicker').textContent = p.kicker || '';
        box.querySelector('#ckIntroTitle').textContent = p.title;
        box.querySelector('.ck-intro-text').innerHTML = p.text;
        next.textContent = page === pages.length - 1 ? T('시작하기', 'Start') : T('다음', 'Next');
        skip.hidden = page === pages.length - 1;
        var fig = box.querySelector('.ck-intro-photo');
        if (p.photo) { fig.querySelector('img').src = p.photo.src; fig.querySelector('img').alt = p.photo.alt; fig.querySelector('figcaption').innerHTML = p.photo.cap; fig.hidden = false; } else fig.hidden = true;
        [].forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === page); });
        box.classList.remove('fading');
      }
      if (fade) { box.classList.add('fading'); setTimeout(apply, 240); } else apply();
    }
    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      opt.draw(ctx, W, H, t, dt, page);
      requestAnimationFrame(frame);
    }
    function open() { box.hidden = false; document.body.classList.add('ck-modal'); page = 0; resize(); render(false); running = true; last = 0; requestAnimationFrame(frame); setTimeout(function () { next.focus(); }, 50); }
    function close() {
      running = false; box.hidden = true; document.body.classList.remove('ck-modal');
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      if (opt.onClose) opt.onClose();
    }
    next.addEventListener('click', function () { if (page === pages.length - 1) close(); else { page++; render(true); } });
    skip.addEventListener('click', close);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft' && page > 0) { e.preventDefault(); page--; render(true); }
    });
    addEventListener('resize', function () { if (running) resize(); });
    var seen = false; try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
    if (/[?&]intro=0/.test(location.search)) seen = true;
    if (/[?&]intro=1/.test(location.search)) seen = false;
    return { open: open, close: close, page: function () { return page; }, start: function () { if (!seen) open(); else if (opt.onClose) opt.onClose(); } };
  }

  /* ---- spotlight tour ---- */
  function tour(opt) {
    var KEY = opt.key, STEPS = opt.steps, ov, hole, card, idx = 0, open = false;
    function build() {
      ov = document.createElement('div'); ov.className = 'ck-tour'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'ckTourTitle');
      ov.innerHTML = '<div class="ck-tour-hole"></div><div class="ck-tour-card"><p class="ck-tour-step"></p><h2 id="ckTourTitle"></h2><p class="ck-tour-text"></p>' +
        '<div class="ck-tour-ctl"><button type="button" class="ck-tour-skip">' + T('건너뛰기', 'Skip') + '</button><button type="button" class="ck-tour-prev">' + T('이전', 'Back') + '</button><button type="button" class="ck-tour-next"></button></div></div>';
      document.body.appendChild(ov);
      hole = ov.querySelector('.ck-tour-hole'); card = ov.querySelector('.ck-tour-card');
      ov.querySelector('.ck-tour-skip').addEventListener('click', close);
      ov.querySelector('.ck-tour-prev').addEventListener('click', function () { if (idx > 0) go(idx - 1); });
      ov.querySelector('.ck-tour-next').addEventListener('click', function () { if (idx < STEPS.length - 1) go(idx + 1); else close(); });
      ov.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); ov.querySelector('.ck-tour-next').click(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); ov.querySelector('.ck-tour-prev').click(); }
      });
      addEventListener('resize', function () { if (open) place(); });
      addEventListener('scroll', function () { if (open) place(); }, { passive: true });
    }
    function place() {
      var el = document.querySelector(STEPS[idx].sel); if (!el) return;
      var r = el.getBoundingClientRect(), pad = 8;
      hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px'; hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = (r.height + pad * 2) + 'px';
      var cw = Math.min(380, innerWidth - 24), ch = card.offsetHeight, x, y;
      if (innerHeight - r.bottom - pad > ch + 16) { y = r.bottom + pad + 12; x = r.left; }
      else if (r.top - pad > ch + 16) { y = r.top - pad - 12 - ch; x = r.left; }
      else if (innerWidth - r.right > cw + 24) { x = r.right + pad + 12; y = r.top; }
      else if (r.left > cw + 24) { x = r.left - pad - 12 - cw; y = r.top; }
      else { x = (innerWidth - cw) / 2; y = innerHeight - ch - 16; }
      card.style.width = cw + 'px';
      card.style.left = clamp(x, 12, innerWidth - cw - 12) + 'px'; card.style.top = clamp(y, 12, innerHeight - ch - 12) + 'px';
    }
    function go(i) {
      idx = i; var s = STEPS[i];
      ov.querySelector('.ck-tour-step').textContent = (i + 1) + ' / ' + STEPS.length;
      ov.querySelector('#ckTourTitle').textContent = s.title; ov.querySelector('.ck-tour-text').textContent = s.text;
      ov.querySelector('.ck-tour-prev').hidden = i === 0;
      ov.querySelector('.ck-tour-next').textContent = i === STEPS.length - 1 ? T('시작하기', 'Start') : T('다음', 'Next');
      var el = document.querySelector(s.sel);
      if (el) { var r = el.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: r.height > innerHeight * 0.6 ? 'start' : 'center' }); }
      requestAnimationFrame(function () { place(); requestAnimationFrame(place); });
      ov.querySelector('.ck-tour-next').focus();
    }
    function start() { if (!ov) build(); ov.hidden = false; open = true; document.body.classList.add('ck-modal'); go(0); }
    function close() { if (!ov) return; ov.hidden = true; open = false; document.body.classList.remove('ck-modal'); try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
    function maybeStart() {
      var seen = false; try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
      if (/[?&]tour=0/.test(location.search)) seen = true;
      if (!seen) setTimeout(start, 350);
    }
    return { start: start, close: close, maybeStart: maybeStart };
  }

  window.CK = { lang: lang, EN: EN, T: T, clamp: clamp, svg: svg, setLang: setLang, takeState: takeState, applyStatic: applyStatic,
    info: info, initTips: initTips, closeTip: closeTip, lever: lever, intro: intro, tour: tour };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyStatic); else applyStatic();
})();
