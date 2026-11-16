/* CCRL Classroom — carbon budget simulator: Seoul skyline + carbon budget "bathtub" (canvas).
 * Decorative: the sky colour, haze and shimmer only reflect the warming level of the selected year. */
(function (root) {
  'use strict';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  /* Photo: "Han River and Lotte World Tower" (Jamsil), mauveine.kim via Wikimedia Commons, CC0. The sky mask was traced by CCRL. */
  var PHOTO = { img: new Image(), mask: new Image(), ok: 0, W: 1920, H: 1080, bank: 0.545, sky: 0.47, cx: 0.5, top: 0.06 };
  PHOTO.img.onload = PHOTO.mask.onload = function () { PHOTO.ok++; if (PHOTO.ok === 2) PHOTO.listeners.forEach(function (f) { f(); }); };
  PHOTO.listeners = [];
  PHOTO.img.src = 'media/seoul-jamsil.jpg'; PHOTO.mask.src = 'media/seoul-jamsil-sky.png';

  function create() {
    var S = { w: 0, h: 0, dpr: 1, city: null, people: [] };
    S.layout = function (w, h, dpr) {
      S.w = w; S.h = h; S.dpr = dpr || 1;
      S.cw = Math.max(200, w - Math.min(170, w * 0.2));   // city width; the tank uses the rest
      S.g = h * 0.74;                                      // river bank line
      if (PHOTO.ok === 2) fitPhoto(); else PHOTO.listeners.push(fitPhoto);
    };
    function fitPhoto() {
      var w = S.cw, h = S.h, s = Math.max(w / PHOTO.W, h / PHOTO.H), pw = PHOTO.W * s, ph = PHOTO.H * s;
      S.ps = s; S.pw = pw; S.ph = ph;
      S.px = clamp(w / 2 - PHOTO.cx * pw, w - pw, 0);
      S.py = clamp(-PHOTO.top * ph, h - ph, 0);
      S.g = S.py + PHOTO.sky * ph;                         // skyline base in canvas coordinates
      S.horizon = S.py + PHOTO.bank * ph;
      // sky mask and a scratch canvas for the tint, in device pixels
      var mk = document.createElement('canvas'); mk.width = Math.ceil(w * S.dpr); mk.height = Math.ceil(h * S.dpr);
      var c = mk.getContext('2d'); c.scale(S.dpr, S.dpr); c.drawImage(PHOTO.mask, S.px, S.py, pw, ph);
      S.maskCv = mk; S.tintCv = document.createElement('canvas'); S.tintCv.width = mk.width; S.tintCv.height = mk.height;
      S.city = true;
    }
    function drawPhoto(c, heat, t) {
      var w = S.cw, h = S.h;
      c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
      c.drawImage(PHOTO.img, S.px, S.py, S.pw, S.ph);
      // heat shimmer just above the skyline: re-draw thin photo slices with a small sideways wobble
      if (heat > 0.45) {
        var amp = 0.9 * (heat - 0.45) / 0.55, y0 = S.horizon - 0.07 * S.ph, y1 = S.horizon - 0.005 * S.ph, s = S.ps;
        for (var y = y0; y < y1; y += 2) {
          var off = Math.sin(y * 0.22 + t * 4) * amp * ((y - y0) / (y1 - y0));
          c.drawImage(PHOTO.img, 0, (y - S.py) / s, PHOTO.W, 2 / s, S.px + off, y, S.pw, 2);
        }
      }
      // sky turns from blue to a hot, milky amber (only inside the traced sky)
      if (heat > 0) {
        var tc = S.tintCv.getContext('2d'); tc.setTransform(1, 0, 0, 1, 0, 0);
        tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, S.tintCv.width, S.tintCv.height);
        tc.drawImage(S.maskCv, 0, 0); tc.globalCompositeOperation = 'source-in';
        var g = tc.createLinearGradient(0, 0, 0, S.g * S.dpr);
        g.addColorStop(0, '#c98f55'); g.addColorStop(0.55, '#e9b77c'); g.addColorStop(1, '#fbe0b4');
        tc.fillStyle = g; tc.fillRect(0, 0, S.tintCv.width, S.tintCv.height);
        c.globalCompositeOperation = 'color'; c.globalAlpha = 0.72 * Math.min(1, heat * 1.3); c.drawImage(S.tintCv, 0, 0, w, h);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.38 * heat; c.drawImage(S.tintCv, 0, 0, w, h);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        // the whole city loses colour and contrast in the heat haze
        c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,' + (0.2 * heat) + ')'; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'source-over';
        var hz = c.createLinearGradient(0, S.g - 0.35 * S.ph, 0, h);
        hz.addColorStop(0, 'rgba(240,196,140,0)'); hz.addColorStop(0.55, 'rgba(240,196,140,' + (0.34 * heat) + ')'); hz.addColorStop(0.75, 'rgba(236,190,135,' + (0.24 * heat) + ')'); hz.addColorStop(1, 'rgba(180,130,90,' + (0.12 * heat) + ')');
        c.fillStyle = hz; c.fillRect(0, 0, w, h);
        // a harsh sun burning through
        var sx = w * 0.82, sy = Math.max(h * 0.14, S.py + 0.12 * S.ph), sg = c.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.45);
        sg.addColorStop(0, 'rgba(255,236,190,' + (0.85 * heat) + ')'); sg.addColorStop(0.08, 'rgba(255,214,150,' + (0.45 * heat) + ')'); sg.addColorStop(1, 'rgba(255,200,130,0)');
        c.globalCompositeOperation = 'screen'; c.fillStyle = sg; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
      }
      // gentle vignette so the scene sits in the panel
      var vg = c.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.4, w / 2, h * 0.55, Math.max(w, h) * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,16,22,.28)');
      c.fillStyle = vg; c.fillRect(0, 0, w, h);
      c.restore();
    }
    // o: {T, year, cum, budgets:[{deg,val}], top, title, t, dt, motion, cumLabel}
    S.draw = function (c, o) {
      var w = S.w, h = S.h, cw = S.cw, heat = clamp((o.T - 1.45) / 1.4, 0, 1);   // today (~1.4 °C) shows the photo as taken
      if (S.city && PHOTO.ok === 2) drawPhoto(c, heat, o.t);
      else { c.fillStyle = '#9fb7c6'; c.fillRect(0, 0, cw, h); }
      // temperature label: dark glass pill
      var big = h > 500 ? 1.25 : 1, lw = 176 * big, lh = 46 * big;
      c.fillStyle = 'rgba(14,22,28,.62)'; rrect(c, 12, 12, lw, lh, 8); c.fill();
      c.fillStyle = heat > 0.5 ? '#ffc58a' : '#ffffff'; c.font = '700 ' + Math.round(23 * big) + 'px Pretendard Variable, Pretendard, sans-serif'; c.textAlign = 'left';
      c.fillText((o.T >= 0 ? '+' : '') + o.T.toFixed(2) + ' °C', 24 * big, 12 + lh * 0.66);
      c.font = '600 ' + Math.round(12 * big) + 'px Pretendard Variable, Pretendard, sans-serif'; c.fillStyle = 'rgba(255,255,255,.75)'; c.textAlign = 'right';
      c.fillText(o.year + '', 12 + lw - 12 * big, 12 + lh * 0.64);
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
