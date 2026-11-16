/* CCRL Classroom — carbon budget simulator: Seoul photo + warming impacts + carbon budget "bathtub" (canvas).
 * The photo is shown as taken (no colour effects). Warming is shown with data only: the warming stripes along
 * the bottom and the IPCC AR6 change in how often 10-year heat and rain extremes occur at the selected warming. */
(function (root) {
  'use strict';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function T(ko, en) { return root.CK && root.CK.T ? root.CK.T(ko, en) : ko; }

  /* Photo: "Han River and Lotte World Tower" (Jamsil), mauveine.kim via Wikimedia Commons, CC0. */
  var PHOTO = { img: new Image(), ok: 0, W: 1920, H: 1080, cx: 0.5, top: 0.06 };
  PHOTO.img.onload = function () { PHOTO.ok = 1; PHOTO.listeners.forEach(function (f) { f(); }); };
  PHOTO.listeners = [];
  PHOTO.img.src = 'media/seoul-jamsil.jpg';

  /* IPCC AR6 WGI SPM Figure SPM.6: how many times more often a 10-year event of the 1850–1900 climate occurs
   * (global land), at 1, 1.5, 2 and 4 °C of global warming. Linear in between; 1× at 0 °C. */
  var AR6 = { w: [0, 1, 1.5, 2, 4], heat: [1, 2.8, 4.1, 5.6, 9.4], rain: [1, 1.3, 1.5, 1.7, 2.7] };
  function ar6(key, t) {
    var w = AR6.w, v = AR6[key]; if (t <= 0) return 1; if (t >= 4) return v[4];
    for (var i = 1; i < w.length; i++) if (t <= w[i]) return v[i - 1] + (v[i] - v[i - 1]) * (t - w[i - 1]) / (w[i] - w[i - 1]);
    return v[4];
  }
  // warming-stripes colours (blue → white → red): a symbolic data band, kept off the photo itself
  var STR = [[8, 48, 107], [33, 102, 172], [67, 147, 195], [146, 197, 222], [209, 229, 240], [253, 219, 199], [244, 165, 130], [214, 96, 77], [178, 24, 43], [103, 0, 13]];
  function stripe(t) {
    var f = clamp((t + 0.35) / 2.9, 0, 0.999) * (STR.length - 1), i = Math.floor(f), k = f - i, a = STR[i], b = STR[i + 1];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
  }

  function create() {
    var S = { w: 0, h: 0, dpr: 1, city: null };
    S.layout = function (w, h, dpr) {
      S.w = w; S.h = h; S.dpr = dpr || 1;
      S.cw = Math.max(200, w - Math.min(170, w * 0.2));   // photo width; the tank uses the rest
      if (PHOTO.ok) fitPhoto(); else PHOTO.listeners.push(fitPhoto);
    };
    function fitPhoto() {
      var w = S.cw, h = S.h, s = Math.max(w / PHOTO.W, h / PHOTO.H), pw = PHOTO.W * s, ph = PHOTO.H * s;
      S.pw = pw; S.ph = ph;
      S.px = clamp(w / 2 - PHOTO.cx * pw, w - pw, 0);
      S.py = clamp(-PHOTO.top * ph, h - ph, 0);
      S.city = true;
    }
    function drawPhoto(c) {
      var w = S.cw, h = S.h;
      c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
      c.drawImage(PHOTO.img, S.px, S.py, S.pw, S.ph);
      var vg = c.createLinearGradient(0, h * 0.45, 0, h);           // darken the lower part so the cards stay legible
      vg.addColorStop(0, 'rgba(8,14,20,0)'); vg.addColorStop(1, 'rgba(8,14,20,.45)');
      c.fillStyle = vg; c.fillRect(0, 0, w, h);
      c.restore();
    }
    // warming stripes 1850 → 2100 along the bottom of the photo, with a marker on the selected year
    function drawStripes(c, o, y0, hh) {
      var w = S.cw, g = root.GMST || {}, y1 = 1850, y2 = 2100, n = y2 - y1 + 1, bw = w / n;
      for (var y = y1; y <= y2; y++) {
        var t = y < o.serY0 ? g[y] : o.ser[y - o.serY0];
        if (t == null) continue;
        c.fillStyle = stripe(t); c.globalAlpha = y > o.year ? 0.35 : 1;
        c.fillRect((y - y1) * bw, y0, bw + 0.6, hh);
      }
      c.globalAlpha = 1;
      var mx = (o.year - y1 + 0.5) * bw;
      c.fillStyle = '#fff'; c.fillRect(mx - 1, y0 - 3, 2, hh + 3);
      c.beginPath(); c.moveTo(mx - 5, y0 - 8); c.lineTo(mx + 5, y0 - 8); c.lineTo(mx, y0 - 2); c.closePath(); c.fill();
      c.font = '600 10px Pretendard Variable, Pretendard, sans-serif'; c.fillStyle = 'rgba(255,255,255,.85)';
      c.textAlign = 'left'; if (mx > 44) c.fillText('1850', 6, y0 - 4); c.textAlign = 'right'; if (mx < w - 44) c.fillText('2100', w - 6, y0 - 4);
    }
    // impact card: IPCC AR6 change in frequency of 10-year hot and wet extremes at this warming level
    function drawImpacts(c, o, bottom) {
      if (S.h < 230) return;
      var big = S.h > 500 ? 1.15 : 1, cw = Math.min(300 * big, S.cw - 24), ch = 104 * big, x = 12, y = bottom - ch;
      c.fillStyle = 'rgba(14,22,28,.66)'; rrect(c, x, y, cw, ch, 8); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1; c.stroke();
      var F = 'px Pretendard Variable, Pretendard, sans-serif', pad = 12 * big;
      c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.72)'; c.font = '600 ' + Math.round(11 * big) + F;
      c.fillText(T('산업화 이전에 10년에 한 번 오던 극한 현상', 'A 10-year extreme of the pre-industrial climate'), x + pad, y + 20 * big);
      var rows = [[T('폭염', 'Heat extreme'), ar6('heat', o.T)], [T('폭우', 'Heavy rain'), ar6('rain', o.T)]];
      rows.forEach(function (r, i) {
        var yy = y + (46 + i * 26) * big;
        c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.88)'; c.font = '600 ' + Math.round(13 * big) + F; c.fillText(r[0], x + pad, yy);
        c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = '700 ' + Math.round(17 * big) + F;
        c.fillText(T('약 ' + r[1].toFixed(1) + '배' + (o.T >= 4 ? ' 이상' : ''), (o.T >= 4 ? '≥ ' : '') + r[1].toFixed(1) + '× as often'), x + cw - pad, yy);
      });
      c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '500 ' + Math.round(10 * big) + F;
      c.fillText(T('얼마나 자주 오는지 · 전 지구 육지 · IPCC AR6', 'How often · global land · IPCC AR6'), x + pad, y + ch - 10 * big);
    }
    // o: {T, year, cum, budgets:[{deg,val}], top, t, ser (model warming from serY0, optional), serY0, tankTitle, cumLabel, cumSub}
    S.draw = function (c, o) {
      var w = S.w, h = S.h, cw = S.cw;
      if (S.city && PHOTO.ok) drawPhoto(c);
      else { c.fillStyle = '#9fb7c6'; c.fillRect(0, 0, cw, h); }
      // temperature label: dark glass pill
      var big = h > 500 ? 1.25 : 1, lw = 176 * big, lh = 46 * big;
      c.fillStyle = 'rgba(14,22,28,.62)'; rrect(c, 12, 12, lw, lh, 8); c.fill();
      c.fillStyle = '#ffffff'; c.font = '700 ' + Math.round(23 * big) + 'px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'left';
      c.fillText((o.T >= 0 ? '+' : '') + o.T.toFixed(2) + ' °C', 24 * big, 12 + lh * 0.66);
      c.font = '600 ' + Math.round(12 * big) + 'px Pretendard Variable, Pretendard, sans-serif'; c.fillStyle = 'rgba(255,255,255,.75)'; c.textAlign = 'right';
      c.fillText(o.year + '', 12 + lw - 12 * big, 12 + lh * 0.64);
      var sh = o.ser ? 12 : 0;
      if (o.ser) drawStripes(c, o, h - sh, sh);
      if (o.impacts !== false) drawImpacts(c, o, h - sh - (o.ser ? 16 : 12));
      // ---- bathtub (tank) ----
      var tx0 = cw + 16, tw = w - cw - 32, ty0 = 28, th = h - 64;
      var bg = c.createLinearGradient(cw, 0, w, 0); bg.addColorStop(0, '#e9eff1'); bg.addColorStop(1, '#f6f9fa');
      c.fillStyle = bg; c.fillRect(cw, 0, w - cw, h);
      c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(cw, 0, 1, h);
      c.fillStyle = '#18232b'; c.font = '700 12px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'center';
      c.fillText(o.tankTitle, tx0 + tw / 2, 18);
      var glass = c.createLinearGradient(tx0, 0, tx0 + tw, 0); glass.addColorStop(0, 'rgba(255,255,255,.9)'); glass.addColorStop(0.5, 'rgba(232,241,244,.7)'); glass.addColorStop(1, 'rgba(210,224,230,.8)');
      c.fillStyle = glass; rrect(c, tx0, ty0, tw, th, 6); c.fill();
      c.save(); rrect(c, tx0, ty0, tw, th, 6); c.clip();
      var frac = clamp(o.cum / o.top, 0, 1), over = o.cum > o.top;
      var lev = ty0 + th * (1 - frac), first = o.budgets[0].val, waterCol = o.cum > o.budgets[o.budgets.length - 1].val ? '#c4462d' : o.cum > first ? '#d98a3a' : '#2f97a0';
      if (o.cum > 0) {
        var wg = c.createLinearGradient(0, lev, 0, ty0 + th); wg.addColorStop(0, waterCol); wg.addColorStop(1, '#1b5f66');
        c.fillStyle = wg; c.fillRect(tx0 + 1, lev, tw - 2, ty0 + th - lev);
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.beginPath();
        for (var x = tx0 + 1; x < tx0 + tw - 1; x += 3) c.lineTo(x, lev + Math.sin(x / 6 + o.t * 2) * 1.2); c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(tx0 + 5, ty0 + 4, 4, th - 8);   // glass highlight
      c.restore();
      if (over) {                                       // overflowing down the outside wall
        c.fillStyle = waterCol; c.globalAlpha = 0.85;
        c.fillRect(tx0 + tw - 1, ty0 - 2, 4, th + 4); c.globalAlpha = 1;
      }
      c.strokeStyle = '#6f848e'; c.lineWidth = 2; rrect(c, tx0, ty0, tw, th, 6); c.stroke();
      o.budgets.forEach(function (b) {
        var y = ty0 + th * (1 - clamp(b.val / o.top, 0, 1));
        var used = o.cum >= b.val;
        c.strokeStyle = used ? '#c4462d' : '#18232b'; c.setLineDash([4, 3]); c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(tx0 - 6, y); c.lineTo(tx0 + tw + 6, y); c.stroke(); c.setLineDash([]);
        c.font = '700 11px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'left';
        var lw = c.measureText(b.label).width + 8;
        c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(tx0 + 3, y - 15, lw, 13);
        c.fillStyle = used ? '#c4462d' : '#18232b'; c.fillText(b.label, tx0 + 7, y - 5);
      });
      c.fillStyle = '#18232b'; c.font = '700 13px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'center';
      c.fillText(o.cumLabel, tx0 + tw / 2, h - 18);
      c.fillStyle = '#6a7983'; c.font = '11px Pretendard Variable, Pretendard, sans-serif';
      c.fillText(o.cumSub, tx0 + tw / 2, h - 4);
    };
    return S;
  }
  root.CarbonScene = { create: create };
})(this);
