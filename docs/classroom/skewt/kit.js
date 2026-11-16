/* CCRL Classroom kit — shared pieces for teaching interactives (copy this file into each material).
 * CK.T('한국어','English')  language, CK.info()  ⓘ tooltips, CK.lever()  input sliders / segmented switches,
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

  /* ---- input control: a slider for numbers, a segmented switch for categories ----
   * Inputs look like controls, outputs look like instruments: values the student SETS use these;
   * computed results stay in the dark stat tiles and the scenes.
   * L: {label, min, max, step, dec, unit, fmt(v), tip, seg (categories → buttons),
   *     marks: [{v, label}] or function () → marks   (reference values: observed, scenario, policy targets)} */
  function lever(wrap, L, get, set) {
    var box = document.createElement('div'); box.className = 'ck-ctl';
    var head = document.createElement('div'); head.className = 'ck-ctl-head'; box.appendChild(head);
    var lab = document.createElement('span'); lab.className = 'ck-ctl-label'; lab.textContent = L.label; head.appendChild(lab);
    if (L.tip) info(lab, L.tip, L.label);
    function fmt(v) { return L.fmt ? L.fmt(v) : (+v).toFixed(L.dec || 0) + (L.unit ? ' ' + L.unit : ''); }
    function put(v) { v = Math.round(clamp(v, L.min, L.max) / L.step) * L.step; set(+v.toFixed(4)); }
    wrap.appendChild(box);

    if (L.seg) {                                    // categories: one button per value
      box.classList.add('seg'); if ((L.max - L.min) / L.step >= 3) box.classList.add('wide');
      var grp = document.createElement('div'); grp.className = 'ck-seg'; grp.setAttribute('role', 'radiogroup'); grp.setAttribute('aria-label', L.label); box.appendChild(grp);
      var btns = [];
      for (var v = L.min; v <= L.max + 1e-9; v += L.step) (function (val) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.textContent = fmt(val);
        b.addEventListener('click', function () { put(val); });
        b.addEventListener('keydown', function (e) {
          var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
          if (d) { e.preventDefault(); put(get() + d * L.step); setTimeout(function () { var on = grp.querySelector('[aria-checked="true"]'); if (on) on.focus(); }, 0); }
        });
        grp.appendChild(b); btns.push([val, b]);
      })(+v.toFixed(4));
      return { sync: function () {
        var cur = get();
        btns.forEach(function (p) { var on = Math.abs(p[0] - cur) < 1e-6; p[1].setAttribute('aria-checked', on); p[1].tabIndex = on ? 0 : -1; p[1].textContent = fmt(p[0]); });
      } };
    }

    var out = document.createElement('output'); out.className = 'ck-ctl-val'; head.appendChild(out);
    var tr = document.createElement('div'); tr.className = 'ck-sl'; tr.tabIndex = 0;
    tr.setAttribute('role', 'slider'); tr.setAttribute('aria-label', L.label); tr.setAttribute('aria-valuemin', L.min); tr.setAttribute('aria-valuemax', L.max);
    tr.innerHTML = '<div class="ck-sl-rail"><div class="ck-sl-fill"></div></div><div class="ck-sl-marks"></div><div class="ck-sl-thumb"></div>';
    box.appendChild(tr);
    var scale = document.createElement('div'); scale.className = 'ck-sl-scale'; box.appendChild(scale);
    var fill = tr.querySelector('.ck-sl-fill'), thumb = tr.querySelector('.ck-sl-thumb'), mk = tr.querySelector('.ck-sl-marks');
    function pct(v) { return (clamp(v, L.min, L.max) - L.min) / (L.max - L.min) * 100; }
    var markKey = null;
    function drawMarks() {
      var ms = (typeof L.marks === 'function' ? L.marks() : L.marks) || [];
      var key = JSON.stringify(ms); if (key === markKey) return; markKey = key;
      mk.innerHTML = ''; scale.innerHTML = '';
      var ends = [[L.min, 'l'], [L.max, 'r']].filter(function (e) { return !ms.some(function (m) { return Math.abs(pct(m.v) - pct(e[0])) < 30; }); });
      ends.forEach(function (e) { var s = document.createElement('span'); s.className = 'end ' + e[1]; s.textContent = fmt(e[0]); scale.appendChild(s); });
      ms.forEach(function (m) {
        var p = pct(m.v), t = document.createElement('i'); t.style.left = p + '%'; mk.appendChild(t);
        var s = document.createElement('span'); s.className = 'mark'; s.style.left = p + '%'; s.textContent = m.label;
        if (p < 12) s.classList.add('l'); else if (p > 88) s.classList.add('r');
        scale.appendChild(s);
      });
    }
    function fromPointer(ev) { var r = tr.getBoundingClientRect(); put(L.min + clamp((ev.clientX - r.left) / r.width, 0, 1) * (L.max - L.min)); }
    tr.addEventListener('pointerdown', function (e) {
      e.preventDefault(); tr.focus(); tr.setPointerCapture(e.pointerId); tr.classList.add('drag'); fromPointer(e);
      function mv(ev) { fromPointer(ev); }
      function up() { tr.classList.remove('drag'); tr.removeEventListener('pointermove', mv); tr.removeEventListener('pointerup', up); tr.removeEventListener('pointercancel', up); }
      tr.addEventListener('pointermove', mv); tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up);
    });
    tr.addEventListener('keydown', function (e) {
      var st = L.step * (e.shiftKey ? 10 : 1);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { put(get() + st); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { put(get() - st); e.preventDefault(); }
      if (e.key === 'Home') { put(L.min); e.preventDefault(); }
      if (e.key === 'End') { put(L.max); e.preventDefault(); }
    });
    return {
      sync: function () {
        var v = get(), p = pct(v), txt = fmt(v);
        fill.style.width = p + '%'; thumb.style.left = p + '%';
        out.textContent = txt; tr.setAttribute('aria-valuenow', v); tr.setAttribute('aria-valuetext', txt);
        drawMarks();
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
