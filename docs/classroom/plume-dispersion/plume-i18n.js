/* CCRL Classroom — plume simulator: language (KO/EN).
 * Strings are written inline as T('한국어', 'English'). Switching language saves the current
 * simulator state in sessionStorage and reloads, so every label is rebuilt in the new language. */
(function () {
  'use strict';
  var lang = 'ko';
  try { lang = localStorage.getItem('ccrl-lang') || lang; } catch (e) {}
  var m = /[?&]lang=(ko|en)/.exec(location.search); if (m) lang = m[1];
  document.documentElement.lang = lang;
  window.PL = {
    lang: lang,
    T: function (ko, en) { return lang === 'en' ? en : ko; },
    setLang: function (l, state) {
      try { localStorage.setItem('ccrl-lang', l); if (state) sessionStorage.setItem('ccrl-plume-state', JSON.stringify(state)); } catch (e) {}
      var u = location.href.replace(/([?&])lang=(ko|en)&?/, '$1').replace(/[?&]$/, '');
      location.href = u;
    },
    takeState: function () {
      try { var s = sessionStorage.getItem('ccrl-plume-state'); sessionStorage.removeItem('ccrl-plume-state'); return s ? JSON.parse(s) : null; } catch (e) { return null; }
    }
  };
  // static page text: elements with data-en get their English text; the Korean stays in the HTML
  function apply() {
    if (lang !== 'en') return;
    document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en'); });
    document.querySelectorAll('[data-en-label]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-en-label')); });
    var t = document.querySelector('meta[name=description]'); if (t && t.dataset.en) t.content = t.dataset.en;
    if (document.body.dataset.enTitle) document.title = document.body.dataset.enTitle;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
