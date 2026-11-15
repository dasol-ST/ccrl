/* CCRL Classroom — Stack plume simulator: gloomy storybook scenery of a Victorian mill town.
 * Procedural canvas drawing only (no image files). Background objects are decorative and
 * not to scale: elongated silhouettes, crooked roofs, gas lamps, fog, moon and stars. */
(function (root) {
  'use strict';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mixc(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function rgb(c, al) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (al == null ? 1 : al) + ')'; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var INK = '#211e24';

  // muted, sooty sky moods
  var MOODS = {
    day:      { top: hex('#bcbfbb'), bot: hex('#e8e1d2'), far: hex('#8c8d89'), fog: hex('#e6e0d4'), sun: 1, sunY: 0.17, sunC: hex('#f6ead0'), lights: 0, stars: 0 },
    overcast: { top: hex('#b3b5b5'), bot: hex('#e2ded5'), far: hex('#8d8e8b'), fog: hex('#e4e0d7'), sun: 0, sunY: 0.2, sunC: hex('#eee8da'), lights: 0.35, stars: 0 },
    dawn:     { top: hex('#b2b5ba'), bot: hex('#ebd8bf'), far: hex('#918b85'), fog: hex('#e8dac6'), sun: 1, sunY: 0.6, sunC: hex('#f3c690'), lights: 0.4, stars: 0 },
    dusk:     { top: hex('#4d5262'), bot: hex('#a6958f'), far: hex('#6b6570'), fog: hex('#b3a5a0'), sun: 0, sunY: 0.8, sunC: hex('#f0c08a'), lights: 1, stars: 1 }
  };
  var KEYS = ['day', 'overcast', 'dawn', 'dusk'];

  function create() {
    var A = { w: 0, h: 0, g0: 0, SL: 0, SR: 0, weights: { day: 0, overcast: 1, dawn: 0, dusk: 0 }, mood: 'overcast',
      people: [], train: null, trainWait: 5, puffs: [], t: 0, stars: [], lamps: [] };

    A.setMood = function (ci) {
      var surf = ci[0], aloftStable = ci[1] >= 3.5 || ci[2] >= 3.5;
      A.mood = surf >= 3.5 ? 'dusk' : surf < 2.5 && aloftStable ? 'dawn' : surf < 2.5 ? 'day' : 'overcast';
    };
    A.update = function (dt) {
      A.t += dt;
      var k = 1 - Math.exp(-dt * 1.6);
      KEYS.forEach(function (m) { A.weights[m] += ((m === A.mood ? 1 : 0) - A.weights[m]) * k; });
    };
    function blend(field) {
      var out = null, sw = 0;
      KEYS.forEach(function (m) {
        var wv = A.weights[m]; if (wv < 1e-4) return;
        var v = MOODS[m][field];
        if (typeof v === 'number') out = (out || 0) + v * wv;
        else out = out ? [out[0] + v[0] * wv, out[1] + v[1] * wv, out[2] + v[2] * wv] : [v[0] * wv, v[1] * wv, v[2] * wv];
        sw += wv;
      });
      return typeof out === 'number' ? out / sw : [out[0] / sw, out[1] / sw, out[2] / sw];
    }
    A.darkness = function () { return A.weights.dusk; };
    A.lights = function () { return blend('lights'); };

    /* ---------- layout ---------- */
    A.layout = function (w, h, g0, SL, SR, dpr) {
      A.dpr = dpr || 1; A.layers = null;
      A.w = w; A.h = h; A.g0 = g0; A.SL = SL; A.SR = SR;
      var r = rng(18520101);
      A.far = town(r, SL + 64, w + 30, g0, 1.25, false);
      A.mid = town(r, SL + 96, w + 30, g0, 0.95, true);
      A.stars = []; for (var i = 0; i < 70; i++) A.stars.push([r() * w, r() * (g0 * 0.55), r() * 1.2 + 0.3, r() * 6.3]);
      A.lamps = []; for (var x = SL + 120 + r() * 40; x < w - SR; x += 130 + r() * 60) A.lamps.push(x);
      var target = Math.max(4, Math.round((w - SL) / 95));
      if (A.people.length > target) A.people.length = target;
      while (A.people.length < target) A.people.push(newPerson(r, true));
      A.people.forEach(function (p) { p.x = clamp(p.x, 0, w); });
    };
    // realistic Victorian townscape: terraced rows with slate roofs and chimney stacks,
    // multi-storey cotton mills with tall round chimneys, a church tower and spire, gas holders
    function town(r, x0, x1, g0, k, windows) {          // k = scale (far rows smaller)
      var p = new Path2D(), win = [], x = x0;
      while (x < x1) {
        var t = r();
        if (t < 0.52) {                                   // terraced row: uniform eaves, continuous ridge
          var n = 5 + (r() * 9 | 0), hw = 9.5 * k, eave = (13 + r() * 3) * k, ridge = eave + 4.6 * k, rw = n * hw;
          p.moveTo(x, g0); p.lineTo(x, g0 - eave); p.lineTo(x + 3.2 * k, g0 - ridge); p.lineTo(x + rw - 3.2 * k, g0 - ridge); p.lineTo(x + rw, g0 - eave); p.lineTo(x + rw, g0); p.closePath();
          for (var j = 0; j <= n; j += 2) {               // stacks on party walls with pots
            var sx0 = x + j * hw - 1.5 * k; if (sx0 < x + 1 || sx0 > x + rw - 3) continue;
            p.rect(sx0, g0 - ridge - 3.2 * k, 3 * k, 3.4 * k);
            p.rect(sx0 + 0.3 * k, g0 - ridge - 4.4 * k, 0.9 * k, 1.3 * k); p.rect(sx0 + 1.7 * k, g0 - ridge - 4.4 * k, 0.9 * k, 1.3 * k);
          }
          if (windows) for (j = 0; j < n; j++) { win.push([x + j * hw + 2.2 * k, g0 - eave + 2.5 * k]); win.push([x + j * hw + 5.8 * k, g0 - eave + 2.5 * k]); win.push([x + j * hw + 5.8 * k, g0 - eave + 8 * k]); }
          x += rw + (r() < 0.4 ? 3 + r() * 6 : 0.5);
        } else if (t < 0.72) {                            // multi-storey mill + round chimney with a cap
          var st = 4 + (r() * 2 | 0), mw = (44 + r() * 30) * k, mh = st * 5.6 * k;
          p.rect(x, g0 - mh, mw, mh);
          p.rect(x - 0.6 * k, g0 - mh - 1.2 * k, mw + 1.2 * k, 1.4 * k);                       // parapet
          var tw = 6 * k, tx = x + mw * (0.15 + r() * 0.15);
          p.rect(tx, g0 - mh - 5 * k, tw, 5 * k);                                                  // stair tower
          p.moveTo(tx - 0.4 * k, g0 - mh - 5 * k); p.lineTo(tx + tw / 2, g0 - mh - 8.5 * k); p.lineTo(tx + tw + 0.4 * k, g0 - mh - 5 * k); p.closePath();
          var cx = x + mw * (0.6 + r() * 0.3), ch = mh + (22 + r() * 14) * k, cb = 2.6 * k, ct = 1.6 * k;
          p.moveTo(cx - cb, g0 - mh); p.lineTo(cx - ct, g0 - ch); p.lineTo(cx + ct, g0 - ch); p.lineTo(cx + cb, g0 - mh); p.closePath();
          p.rect(cx - ct - 0.7 * k, g0 - ch - 1.6 * k, 2 * ct + 1.4 * k, 1.8 * k);
          if (windows) for (var s = 0; s < st; s++) for (var q = 0; q < mw / (4.6 * k) - 1; q++) win.push([x + 2.2 * k + q * 4.6 * k, g0 - mh + 1.8 * k + s * 5.6 * k]);
          x += mw + 3 + r() * 5;
        } else if (t < 0.8) {                             // church: nave + tower + spire
          var nw = 20 * k, nh = 11 * k;
          p.moveTo(x, g0); p.lineTo(x, g0 - nh); p.lineTo(x + nw / 2, g0 - nh - 6 * k); p.lineTo(x + nw, g0 - nh); p.lineTo(x + nw, g0); p.closePath();
          var twx = x + nw, th = 25 * k;
          p.rect(twx, g0 - th, 7 * k, th);
          for (var pn = 0; pn < 4; pn++) p.rect(twx + pn * 2 * k, g0 - th - 1.4 * k, 1 * k, 1.4 * k);  // pinnacles
          p.moveTo(twx + 0.8 * k, g0 - th); p.lineTo(twx + 3.5 * k, g0 - th - 17 * k); p.lineTo(twx + 6.2 * k, g0 - th); p.closePath();
          if (windows) { win.push([twx + 2.7 * k, g0 - th * 0.55]); win.push([x + 4 * k, g0 - nh * 0.6]); win.push([x + 10 * k, g0 - nh * 0.6]); }
          x += nw + 12 * k;
        } else if (t < 0.88) {                            // gas holder: guide frame columns + tank
          var gw = 26 * k, gh = 18 * k;
          p.rect(x + 2 * k, g0 - gh * 0.75, gw - 4 * k, gh * 0.75);
          p.moveTo(x + 2 * k, g0 - gh * 0.75); p.quadraticCurveTo(x + gw / 2, g0 - gh * 0.9, x + gw - 2 * k, g0 - gh * 0.75); p.closePath();
          for (var cl = 0; cl < 5; cl++) p.rect(x + cl * (gw - 1.2 * k) / 4, g0 - gh, 1.2 * k, gh);
          p.rect(x, g0 - gh, gw, 1 * k); p.rect(x, g0 - gh * 0.55, gw, 0.8 * k);
          x += gw + 4;
        } else x += 6 + r() * 14;
      }
      return { path: p, win: win };
    }

    /* ---------- sky: gradient, sun or crescent moon, stars ---------- */
    A.sky = function (c, PT) {
      var top = blend('top'), bot = blend('bot');
      var g = c.createLinearGradient(0, 0, 0, A.g0);
      g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
      c.fillStyle = g; c.fillRect(0, 0, A.w, A.g0);
      var st = blend('stars');
      if (st > 0.02) {
        A.stars.forEach(function (s) {
          c.fillStyle = 'rgba(240,232,210,' + (st * (0.35 + 0.35 * Math.sin(A.t * 1.3 + s[3]))) + ')';
          c.fillRect(s[0], s[1], s[2], s[2]);
        });
        var mx = A.SL + (A.w - A.SL - A.SR) * 0.8, my = PT + (A.g0 - PT) * 0.2;
        // crescent drawn on its own small canvas so the cut-out never shows against the glow
        if (!A.moonC) {
          A.moonC = document.createElement('canvas'); A.moonC.width = A.moonC.height = 30;
          var m = A.moonC.getContext('2d');
          m.fillStyle = '#f2e6c6'; m.beginPath(); m.arc(15, 15, 12, 0, 7); m.fill();
          m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(21, 11, 11, 0, 7); m.fill();
        }
        var rg = c.createRadialGradient(mx, my, 0, mx, my, 60);
        rg.addColorStop(0, 'rgba(240,226,190,' + 0.2 * st + ')'); rg.addColorStop(1, 'rgba(240,226,190,0)');
        c.fillStyle = rg; c.fillRect(mx - 60, my - 60, 120, 120);
        c.globalAlpha = st; c.drawImage(A.moonC, mx - 15, my - 15); c.globalAlpha = 1;
      }
      var sun = blend('sun');
      if (sun > 0.02) {
        var sy = PT + (A.g0 - PT) * blend('sunY'), sxp = A.SL + (A.w - A.SL - A.SR) * 0.72, sc = blend('sunC');
        var rg2 = c.createRadialGradient(sxp, sy, 0, sxp, sy, 80);
        rg2.addColorStop(0, rgb(sc, 0.5 * sun)); rg2.addColorStop(1, rgb(sc, 0));
        c.fillStyle = rg2; c.fillRect(sxp - 80, sy - 80, 160, 160);
        c.fillStyle = rgb(sc, 0.85 * sun); c.beginPath(); c.arc(sxp, sy, 12, 0, 7); c.fill();
      }
    };

    /* ---------- town in two depths with drifting fog between them ---------- */
    function fog(c, y, hgt, al, speed) {
      var fc = blend('fog');
      for (var i = 0; i < 3; i++) {
        var off = Math.sin(A.t * speed + i * 2.1) * 30;
        var g = c.createLinearGradient(0, y - hgt, 0, y);
        g.addColorStop(0, rgb(fc, 0)); g.addColorStop(1, rgb(fc, al * (0.7 + 0.3 * Math.sin(A.t * 0.2 + i))));
        c.fillStyle = g;
        c.fillRect(off - 40 + i * A.w / 3, y - hgt, A.w / 2 + 80, hgt);
      }
    }
    /* charcoal-sketch rendering: solid fill, clipped diagonal hatching, doubled wobbly outline */
    function hatch(c, x0, y0, x1, y1, gap, al, seed) {
      var r = rng(seed || 7);
      c.lineWidth = 0.6;
      for (var x = x0 - (y1 - y0); x < x1; x += gap * (0.8 + r() * 0.5)) {
        c.strokeStyle = 'rgba(15,13,14,' + al * (0.6 + r() * 0.7) + ')';
        c.beginPath(); c.moveTo(x, y1); c.lineTo(x + (y1 - y0), y0); c.stroke();
      }
    }
    function sketchOutline(c, path, col, al) {
      c.strokeStyle = col; c.lineWidth = 0.7; c.lineJoin = 'round';
      c.globalAlpha = al; c.save(); c.translate(0.45, -0.35); c.stroke(path); c.restore();
      c.globalAlpha = al * 0.7; c.save(); c.translate(-0.4, 0.3); c.stroke(path); c.restore();
      c.globalAlpha = 1;
    }
    function sketchLayer(path, fill, hatchAl, line, top) {
      var cv = document.createElement('canvas'), dp = A.dpr || 1;
      cv.width = Math.ceil(A.w * dp); cv.height = Math.ceil(A.g0 * dp);
      var c = cv.getContext('2d'); c.scale(dp, dp);
      c.fillStyle = fill; c.fill(path);
      c.save(); c.clip(path); hatch(c, 0, top, A.w, A.g0, 3.1, hatchAl, 11); c.restore();
      sketchOutline(c, path, line, 0.75);
      return cv;
    }
    function buildLayers() {
      var topF = A.g0 - 110, topM = A.g0 - 80;
      A.layers = {
        farDay: sketchLayer(A.far.path, 'rgba(126,126,121,.78)', 0.10, '#4b4a48', topF),
        farDusk: sketchLayer(A.far.path, 'rgba(82,78,86,.8)', 0.12, '#2b2930', topF),
        midDay: sketchLayer(A.mid.path, '#403c3b', 0.34, '#120f10', topM),
        midDusk: sketchLayer(A.mid.path, '#211e23', 0.2, '#0c0b0d', topM)
      };
      // film grain tile
      var gcv = document.createElement('canvas'); gcv.width = gcv.height = 160;
      var gc = gcv.getContext('2d'), img = gc.createImageData(160, 160), r = rng(99);
      for (var i = 0; i < img.data.length; i += 4) { var v = r() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 8; }
      gc.putImageData(img, 0, 0); A.grain = gcv;
    }
    function drawLayer(c, day, dusk, d) {
      var w = A.w, h = A.g0;
      if (d < 0.98) { c.globalAlpha = 1; c.drawImage(day, 0, 0, w, h); }
      if (d > 0.02) { c.globalAlpha = d; c.drawImage(dusk, 0, 0, w, h); }
      c.globalAlpha = 1;
    }
    // film grain + vignette over the whole illustration
    A.post = function (c) {
      if (!A.grain) return;
      var pat = c.createPattern(A.grain, 'repeat');
      if (!A.gOff || A.t - A.gOff.t > 0.12) A.gOff = { t: A.t, x: (Math.random() * 160) | 0, y: (Math.random() * 160) | 0 };
      c.save(); c.translate(A.gOff.x, A.gOff.y);
      c.fillStyle = pat; c.fillRect(-160, -160, A.w + 320, A.h + 320); c.restore();
      var vg = c.createRadialGradient(A.w / 2, A.h * 0.55, Math.min(A.w, A.h) * 0.35, A.w / 2, A.h * 0.55, Math.max(A.w, A.h) * 0.75);
      vg.addColorStop(0, 'rgba(20,16,14,0)'); vg.addColorStop(1, 'rgba(20,16,14,.13)');
      c.fillStyle = vg; c.fillRect(0, 0, A.w, A.h);
    };
    A.hatch = hatch; A.sketchOutline = sketchOutline;
    A.back = function (c) {
      var g0 = A.g0, L = A.lights(), d = A.darkness();
      if (!A.layers) buildLayers();
      drawLayer(c, A.layers.farDay, A.layers.farDusk, d);
      fog(c, g0, 34, 0.35, 0.05);
      drawLayer(c, A.layers.midDay, A.layers.midDusk, d);
      if (L > 0.05) {
        c.fillStyle = 'rgba(244,196,107,' + (0.9 * L) + ')';
        A.mid.win.forEach(function (p, i) { if ((i * 7) % 5 < 3) c.fillRect(p[0], p[1], 1.3, 1.8); });
      }
      fog(c, g0, 16, 0.45, 0.08);
    };

    /* ---------- the cotton mill and its chimney (realistic proportions, lit from the left) ---------- */
    function brickGrad(c, x0, x1, d, lift) {
      var g = c.createLinearGradient(x0, 0, x1, 0);
      var lit = mixc(hex('#9c5b43'), hex('#4e3030'), d), mid = mixc(hex('#7e4433'), hex('#3c2527'), d), sh = mixc(hex('#552d24'), hex('#26181b'), d);
      if (lift) { lit = mixc(lit, hex('#ffffff'), lift); mid = mixc(mid, hex('#ffffff'), lift); }
      g.addColorStop(0, rgb(lit)); g.addColorStop(0.55, rgb(mid)); g.addColorStop(1, rgb(sh));
      return g;
    }
    A.factory = function (c, bx, topY) {
      var g0 = A.g0, stackPx = g0 - topY, d = A.darkness(), L = A.lights();
      // --- chimney: square stone plinth, tapered round brick shaft, iron bands, oversailing cap
      var wb = clamp(stackPx * 0.1, 11, 20), wt = wb * 0.62, plH = Math.min(12, stackPx * 0.12);
      c.fillStyle = rgb(mixc(hex('#a99a82'), hex('#4f4848'), d));
      c.fillRect(bx - wb / 2 - 2.5, g0 - plH, wb + 5, plH);
      c.fillStyle = rgb(mixc(hex('#7f725f'), hex('#3a3436'), d));
      c.fillRect(bx - wb / 2 - 3.5, g0 - plH - 1.6, wb + 7, 1.8);
      c.beginPath(); c.moveTo(bx - wb / 2, g0 - plH); c.lineTo(bx - wt / 2, topY + 4); c.lineTo(bx + wt / 2, topY + 4); c.lineTo(bx + wb / 2, g0 - plH); c.closePath();
      c.fillStyle = brickGrad(c, bx - wb / 2, bx + wb / 2, d); c.fill();
      c.save(); c.clip();
      c.strokeStyle = 'rgba(25,12,10,.22)'; c.lineWidth = 0.5;
      for (var y = topY + 6; y < g0 - plH; y += 2.6) { c.beginPath(); c.moveTo(bx - wb, y); c.lineTo(bx + wb, y); c.stroke(); }
      c.restore();
      var wAt = function (yy) { return wt + (wb - wt) * (yy - topY) / Math.max(1, stackPx - plH); };
      c.fillStyle = 'rgba(28,22,24,.85)';
      for (var bnd = 1; bnd <= 3; bnd++) { var by = topY + 4 + (g0 - plH - topY - 4) * bnd / 4; c.fillRect(bx - wAt(by) / 2, by, wAt(by), 1); }
      // cap: three oversailing courses
      c.fillStyle = rgb(mixc(hex('#3b2a25'), hex('#1d1719'), d));
      c.fillRect(bx - wt / 2 - 1, topY + 2.6, wt + 2, 1.6);
      c.fillRect(bx - wt / 2 - 2, topY + 1.2, wt + 4, 1.6);
      c.fillRect(bx - wt / 2 - 1.4, topY, wt + 2.8, 1.4);
      var shaft = new Path2D(); shaft.moveTo(bx - wb / 2, g0 - plH); shaft.lineTo(bx - wt / 2, topY + 4); shaft.lineTo(bx + wt / 2, topY + 4); shaft.lineTo(bx + wb / 2, g0 - plH); shaft.closePath();
      c.save(); c.clip(shaft); c.beginPath(); c.rect(bx, topY, wb, g0 - topY); c.clip(); hatch(c, bx - 2, topY, bx + wb, g0, 2.4, 0.3, 3); c.restore();
      sketchOutline(c, shaft, "#140f0f", 0.8);
      // --- mill block: storeys, sash-window grid, stone cornice, slate hipped roof, stair tower, engine house
      var mh = Math.min(32, stackPx * 0.45);
      if (mh > 7) {
        var mw = 88, mx = bx - 30, storeys = Math.max(2, Math.round(mh / 7.5)), sh = mh / storeys;
        c.fillStyle = brickGrad(c, mx, mx + mw, d, 0.04); c.fillRect(mx, g0 - mh, mw, mh);
        c.fillStyle = rgb(mixc(hex('#cbbd9f'), hex('#5d5556'), d));
        c.fillRect(mx - 1, g0 - mh - 1.4, mw + 2, 1.6);                                  // cornice
        for (var sI = 1; sI < storeys; sI++) c.fillRect(mx, g0 - mh + sI * sh - 0.4, mw, 0.7); // string courses
        c.fillStyle = rgb(mixc(hex('#4c4a4f'), hex('#211e25'), d));                     // slate roof
        c.beginPath(); c.moveTo(mx - 1, g0 - mh - 1.4); c.lineTo(mx + 6, g0 - mh - 6); c.lineTo(mx + mw - 6, g0 - mh - 6); c.lineTo(mx + mw + 1, g0 - mh - 1.4); c.closePath(); c.fill();
        var cols = 13;
        for (var s = 0; s < storeys; s++) for (var q = 0; q < cols; q++) {
          var wx = mx + 3 + q * (mw - 6) / cols, wy = g0 - mh + s * sh + sh * 0.25;
          var lit = L > 0.05 && ((q * 3 + s * 5) % 7) !== 0;
          c.fillStyle = lit ? 'rgba(246,200,112,' + (0.3 + 0.65 * L) + ')' : 'rgba(28,24,28,.72)';
          c.fillRect(wx, wy, 3.2, sh * 0.55);
        }
        // stair tower with cupola
        var tx = mx + mw - 16;
        c.fillStyle = brickGrad(c, tx, tx + 9, d, 0.02); c.fillRect(tx, g0 - mh - 9, 9, 9);
        c.fillStyle = rgb(mixc(hex('#4c4a4f'), hex('#211e25'), d));
        c.beginPath(); c.moveTo(tx - 0.8, g0 - mh - 9); c.lineTo(tx + 4.5, g0 - mh - 14); c.lineTo(tx + 9.8, g0 - mh - 9); c.closePath(); c.fill();
        c.fillRect(tx + 4, g0 - mh - 17, 1, 3);
        c.fillStyle = L > 0.1 ? 'rgba(246,214,150,' + (0.5 + 0.5 * L) + ')' : '#d5c8ad';
        c.beginPath(); c.arc(tx + 4.5, g0 - mh - 5, 2, 0, 7); c.fill();                // clock
        // engine house (tall arched windows) on the left
        var ex = mx - 14, eh = mh * 0.7;
        c.fillStyle = brickGrad(c, ex, ex + 14, d); c.fillRect(ex, g0 - eh, 14, eh);
        c.fillStyle = rgb(mixc(hex('#4c4a4f'), hex('#211e25'), d));
        c.beginPath(); c.moveTo(ex - 1, g0 - eh); c.lineTo(ex + 7, g0 - eh - 5); c.lineTo(ex + 15, g0 - eh); c.closePath(); c.fill();
        c.fillStyle = L > 0.05 ? 'rgba(246,200,112,' + (0.3 + 0.6 * L) + ')' : 'rgba(28,24,28,.72)';
        [ex + 3, ex + 8.4].forEach(function (wx2) { c.beginPath(); c.moveTo(wx2, g0 - 2); c.lineTo(wx2, g0 - eh + 5); c.arc(wx2 + 1.3, g0 - eh + 5, 1.3, Math.PI, 0); c.lineTo(wx2 + 2.6, g0 - 2); c.fill(); });
        // charcoal shading: hatch the shadow side and give the block a sketchy outline
        var blk = new Path2D(); blk.rect(mx, g0 - mh, mw, mh); blk.rect(ex, g0 - eh, 14, eh); blk.rect(tx, g0 - mh - 9, 9, 9);
        c.save(); c.beginPath(); c.rect(mx + mw * 0.55, g0 - mh - 10, mw * 0.45 + 2, mh + 10); c.clip(); hatch(c, mx, g0 - mh - 10, mx + mw + 2, g0, 2.6, 0.32, 5); c.restore();
        sketchOutline(c, blk, "#140f0f", 0.8);
      }
    };
    /* ---------- ground: embankment + railway, street with gas lamps, people ---------- */
    function newPerson(r, anywhere) {
      var dir = r() < 0.5 ? -1 : 1, types = ['gent', 'gent', 'lady', 'worker', 'lady', 'child', 'umbrella'];
      return { x: anywhere ? A.SL + r() * (A.w - A.SL) : (dir > 0 ? -12 : A.w + 12), dir: dir,
        sp: 6 + r() * 7, type: types[r() * types.length | 0], ph: r() * 6.28, lane: r() < 0.5 ? 0 : 1, cough: 0, cphase: r() * 6.28,
        dog: r() < 0.12 };
    }
    var R0 = rng(1888);
    A.ground = function (c, dt, concAt, motion) {
      var g0 = A.g0, w = A.w, h = A.h, d = A.darkness(), L = A.lights();
      var eb = c.createLinearGradient(0, g0, 0, g0 + 17);
      eb.addColorStop(0, rgb(mixc(hex('#857a68'), hex('#6a5f6c'), d))); eb.addColorStop(1, rgb(mixc(hex('#5e554a'), hex('#3e3742'), d)));
      c.fillStyle = eb; c.fillRect(0, g0, w, 17);
      var sg = c.createLinearGradient(0, g0 + 17, 0, h);
      sg.addColorStop(0, rgb(mixc(hex('#988d7a'), hex('#6c6070'), d))); sg.addColorStop(1, rgb(mixc(hex('#766c5c'), hex('#463e4a'), d)));
      c.fillStyle = sg; c.fillRect(0, g0 + 17, w, h - g0 - 17);
      c.strokeStyle = 'rgba(30,26,30,.18)'; c.lineWidth = 0.6;
      for (var cx = 0; cx < w; cx += 7) { c.beginPath(); c.arc(cx + ((cx / 7) % 2) * 3.5, g0 + 27, 3.5, Math.PI, 0); c.stroke(); }
      var ry = g0 + 13;
      c.fillStyle = 'rgba(20,18,22,.55)'; for (var x = 0; x < w; x += 6) c.fillRect(x, ry, 3.4, 2);
      c.fillStyle = 'rgba(170,160,140,.55)'; c.fillRect(0, ry - 0.8, w, 1);
      if (motion) {
        if (!A.train) { A.trainWait -= dt; if (A.trainWait <= 0) A.train = { x: w + 40, sp: 34 + R0() * 10 }; }
        else { A.train.x -= A.train.sp * dt; if (A.train.x < -200) { A.train = null; A.trainWait = 22 + R0() * 18; } }
      }
      if (A.train) drawTrain(c, A.train.x, ry - 0.8, dt, motion, L);
      for (var i = A.puffs.length - 1; i >= 0; i--) {
        var p = A.puffs[i]; if (motion) { p.a += dt; p.y -= 9 * dt; p.x += 4 * dt; }
        var f = p.a / 1.3;
        if (f >= 1) { A.puffs.splice(i, 1); continue; }
        c.fillStyle = 'rgba(236,230,218,' + (0.6 * (1 - f)) + ')';
        var rr = 1.6 + f * 3.4;
        c.beginPath(); c.arc(p.x, p.y, rr, 0, 7); c.arc(p.x + rr * 0.9, p.y + rr * 0.3, rr * 0.7, 0, 7); c.arc(p.x - rr * 0.8, p.y + rr * 0.4, rr * 0.6, 0, 7); c.fill();
      }
      A.lamps.forEach(function (lx) {
        c.fillStyle = INK;
        c.fillRect(lx - 0.7, g0 + 8, 1.4, 22);
        c.beginPath(); c.moveTo(lx - 2.6, g0 + 8); c.lineTo(lx + 2.6, g0 + 8); c.lineTo(lx + 1.6, g0 + 2.5); c.lineTo(lx - 1.6, g0 + 2.5); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(lx - 2.4, g0 + 2.5); c.lineTo(lx, g0); c.lineTo(lx + 2.4, g0 + 2.5); c.fill();
        c.fillRect(lx - 2.2, g0 + 29, 4.4, 1.4);
        if (L > 0.05) {
          var gl = c.createRadialGradient(lx, g0 + 5.5, 0, lx, g0 + 5.5, 22);
          gl.addColorStop(0, 'rgba(250,206,120,' + 0.55 * L + ')'); gl.addColorStop(1, 'rgba(250,206,120,0)');
          c.fillStyle = gl; c.fillRect(lx - 22, g0 - 16, 44, 44);
          c.fillStyle = 'rgba(255,224,160,' + (0.5 + 0.5 * L) + ')'; c.fillRect(lx - 1.3, g0 + 3.5, 2.6, 3.8);
        }
      });
      A.people.forEach(function (pp) {
        var cc = concAt(pp.x);
        var want = cc > 80 ? 2 : cc > 35 ? 1 : 0;
        pp.cough += (want - pp.cough) * (1 - Math.exp(-dt * 2));
        if (motion) {
          var sp = pp.sp * (pp.cough > 1.4 ? 0 : pp.cough > 0.6 ? 0.5 : 1);
          pp.x += pp.dir * sp * dt; pp.ph += sp * dt * 0.5; pp.cphase += dt;
          if (pp.x < -16 || pp.x > w + 16) { var np = newPerson(R0, false); for (var k in np) pp[k] = np[k]; }
        }
        drawPerson(c, pp.x, g0 + 36 + pp.lane * 3, pp);
      });
    };

    /* ---------- Victorian 4-4-0 locomotive with tender and four-wheeled coaches (facing left) ---------- */
    function wheel(c, x, y, r, spokes) {
      c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      if (spokes && r > 3) {
        c.save(); c.strokeStyle = 'rgba(200,190,170,.35)'; c.lineWidth = 0.45;
        for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3 + A.t * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * (r - 0.8), y + Math.sin(a) * (r - 0.8)); c.stroke(); }
        c.beginPath(); c.arc(x, y, r - 0.7, 0, 7); c.stroke(); c.restore();
      }
    }
    function drawTrain(c, x, rail, dt, motion, L) {
      var lit = L > 0.05 ? 'rgba(246,200,112,' + (0.4 + 0.6 * L) + ')' : 'rgba(165,155,138,.55)';
      c.save(); c.translate(x, rail); c.fillStyle = INK;
      c.fillRect(0, -7, 2, 3.6); c.fillRect(-1, -6.4, 1.2, 0.8); c.fillRect(-1, -4.6, 1.2, 0.8);   // buffer beam + buffers
      c.fillRect(1, -6.6, 44, 2.4);                                                                   // frames
      c.fillRect(3, -16.5, 7, 10);                                                                    // smokebox
      c.beginPath(); c.moveTo(10, -16); c.lineTo(32, -16); c.lineTo(32, -7); c.lineTo(10, -7); c.closePath(); c.fill();  // boiler
      c.fillRect(4.8, -22, 3.4, 6); c.fillRect(4.2, -23, 4.6, 1.2);                                  // chimney with capuchon
      c.beginPath(); c.arc(20, -16, 2.6, Math.PI, 0); c.fill(); c.fillRect(19.4, -19.6, 1.2, 1.2);    // dome
      c.fillRect(28, -18.2, 2, 2.4);                                                                  // safety valves
      c.fillRect(32, -22, 11, 15.6); c.beginPath(); c.moveTo(31, -22); c.quadraticCurveTo(37.5, -24.6, 44, -22); c.lineTo(44, -21.2); c.lineTo(31, -21.2); c.fill();  // cab + roof
      c.fillStyle = lit; c.fillRect(34.4, -19.6, 3.4, 4.4); c.fillStyle = INK;
      c.beginPath(); c.arc(25, -7, 5.4, Math.PI, 0); c.arc(36, -7, 5.4, Math.PI, 0); c.fill();        // splashers
      wheel(c, 6, -2.2, 2.2); wheel(c, 12, -2.2, 2.2);                                                // bogie
      wheel(c, 25, -4.6, 4.6, true); wheel(c, 36, -4.6, 4.6, true);                                   // driving wheels
      c.strokeStyle = 'rgba(200,190,170,.4)'; c.lineWidth = 0.7;
      var ph = A.t * 3; c.beginPath(); c.moveTo(25 + Math.cos(ph) * 2.6, -4.6 + Math.sin(ph) * 2.6); c.lineTo(36 + Math.cos(ph) * 2.6, -4.6 + Math.sin(ph) * 2.6); c.stroke();
      // six-wheeled tender
      c.fillStyle = INK; c.fillRect(46, -14, 18, 9.4); c.fillRect(45.5, -14.8, 19, 1);
      wheel(c, 49, -2.4, 2.4); wheel(c, 55, -2.4, 2.4); wheel(c, 61, -2.4, 2.4);
      // four-wheeled compartment coaches
      for (var k = 0; k < 3; k++) {
        var cx = 67 + k * 33;
        c.fillStyle = INK;
        c.beginPath(); c.moveTo(cx, -5); c.lineTo(cx, -15.5); c.quadraticCurveTo(cx + 15, -17.6, cx + 30, -15.5); c.lineTo(cx + 30, -5); c.closePath(); c.fill();
        c.fillRect(cx + 1, -5, 28, 1.4);
        wheel(c, cx + 7, -2.4, 2.4); wheel(c, cx + 23, -2.4, 2.4);
        c.fillStyle = lit;
        for (var q = 0; q < 4; q++) c.fillRect(cx + 2.4 + q * 7, -13.4, 3, 3.4);
        c.fillStyle = 'rgba(200,190,170,.18)';
        for (q = 1; q < 4; q++) c.fillRect(cx + q * 7 + 0.4, -15, 0.5, 9.6);                          // compartment doors
      }
      c.restore();
      if (motion && Math.random() < dt * 5) A.puffs.push({ x: x + 6.5, y: rail - 24, a: 0 });
    }

    /* ---------- realistic pedestrians; colour + glow show how badly they are exposed ---------- */
    var EXPO = [hex('#1f1c20'), hex('#a8741c'), hex('#b3261b')];   // normal, uncomfortable, severe
    function expoColor(v) { return v <= 1 ? mixc(EXPO[0], EXPO[1], clamp(v, 0, 1)) : mixc(EXPO[1], EXPO[2], clamp(v - 1, 0, 1)); }
    function limb(c, x0, y0, a1, l1, a2, l2) {          // two-segment limb, angles from vertical (down)
      var x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1 + Math.sin(a2) * l2, y1 + Math.cos(a2) * l2); c.stroke();
    }
    function drawPerson(c, x, feet, p) {
      var s = (p.type === 'child' ? 0.66 : 1) * 1.15, v = p.cough, bend = v > 1.2 ? (v - 1.2) / 0.8 : 0;
      var col = expoColor(v), cs = rgb(col);
      // severe exposure: red haze around the figure + small warning mark
      if (v > 1.05) {
        var a = clamp((v - 1.05) / 0.6, 0, 1);
        var gl = c.createRadialGradient(x, feet - 12 * s, 0, x, feet - 12 * s, 17 * s);
        gl.addColorStop(0, 'rgba(225,60,40,' + 0.42 * a + ')'); gl.addColorStop(1, 'rgba(225,60,40,0)');
        c.fillStyle = gl; c.fillRect(x - 18 * s, feet - 30 * s, 36 * s, 34 * s);
      }
      var walk = v > 1.4 ? 0.15 : 1, sw = Math.sin(p.ph) * walk, bob = Math.abs(Math.cos(p.ph)) * 0.5 * walk;
      c.save(); c.translate(x, feet - bob); c.scale(p.dir * s, s);
      c.fillStyle = cs; c.strokeStyle = cs; c.lineCap = 'round'; c.lineJoin = 'round';
      var hipY = -11.5;
      // legs (thigh + shin with knee flex on the back leg)
      if (p.type !== 'lady') {
        c.lineWidth = 1.7;
        limb(c, 0, hipY, sw * 0.42, 6, sw * 0.42 - Math.max(0, -sw) * 0.5, 5.6);
        limb(c, 0, hipY, -sw * 0.42, 6, -sw * 0.42 - Math.max(0, sw) * 0.5, 5.6);
        c.lineWidth = 1.5; c.beginPath(); c.moveTo(Math.sin(sw * 0.42) * 6 + Math.sin(sw * 0.42 - Math.max(0, -sw) * 0.5) * 5.6, -0.3); c.lineTo(Math.sin(sw * 0.42) * 6 + Math.sin(sw * 0.42 - Math.max(0, -sw) * 0.5) * 5.6 + 1.4, -0.3); c.stroke();
      }
      // upper body (bends forward when coughing)
      c.save(); c.translate(0, hipY); c.rotate(bend * 0.42);
      if (p.type === 'lady') {
        c.restore(); c.save(); c.translate(0, hipY - 1.5); c.rotate(bend * 0.3);
        c.beginPath(); c.moveTo(-1.6, 0); c.quadraticCurveTo(-3.2, 6, -4.4 + sw * 0.4, 13); c.lineTo(4.6 + sw * 0.4, 13); c.quadraticCurveTo(4.4, 5, 2.8, 0.5); c.quadraticCurveTo(4.6, 2, 3.6, 4); c.closePath(); c.fill(); // skirt + bustle
        c.beginPath(); c.moveTo(-1.5, 0.5); c.lineTo(1.7, 0.5); c.lineTo(1.6, -7.5); c.lineTo(-1.2, -7.5); c.closePath(); c.fill();     // bodice
        c.beginPath(); c.moveTo(-2.2, -7.6); c.quadraticCurveTo(0.3, -8.6, 2.6, -7.6); c.lineTo(3, -4.6); c.quadraticCurveTo(0.2, -3.6, -2.6, -4.8); c.closePath(); c.fill(); // shawl
      } else {
        var coatLen = p.type === 'worker' || p.type === 'child' ? 1.2 : 5.2;
        c.beginPath(); c.moveTo(-1.9, -8.2); c.lineTo(2, -8.2); c.lineTo(2.3, -2); c.lineTo(2.6, coatLen); c.lineTo(-2.4, coatLen); c.lineTo(-2.2, -2); c.closePath(); c.fill();
      }
      // arms
      c.lineWidth = 1.25;
      if (v > 0.55) limb(c, 0.4, -7.2, 0.9, 3.8, -2.2, 3.6);                  // hand to mouth
      else if (p.type === 'umbrella') limb(c, 0.4, -7.2, 0.6, 3.6, -1.2, 3);
      else { limb(c, 0.2, -7.2, -sw * 0.5, 3.8, -sw * 0.5 + 0.25, 3.6); }
      if (p.type === 'gent' && v <= 0.55) { var hx = Math.sin(-sw * 0.5) * 3.8 + Math.sin(-sw * 0.5 + 0.25) * 3.6, hy = -7.2 + 7.2; c.lineWidth = 0.7; c.beginPath(); c.moveTo(hx + 0.2, hy - 0.3); c.lineTo(hx + 1.6 - sw, hy + 10.8); c.stroke(); }   // walking cane
      if (p.type === 'umbrella' && v <= 0.55) {                                // furled-to-open umbrella overhead
        c.lineWidth = 0.7; c.beginPath(); c.moveTo(3.4, -6); c.lineTo(3.4, -19); c.stroke();
        c.beginPath(); c.moveTo(-3.2, -17.6); c.quadraticCurveTo(3.4, -24.2, 10, -17.6); c.lineTo(3.4, -18.6); c.closePath(); c.fill();
      }
      if (p.type === 'worker') { c.fillRect(-3.4, -6, 1.6, 3.6); }            // tool bag
      // head, neck and hats
      c.fillRect(-0.5, -9.4, 1.3, 1.4);
      c.beginPath(); c.ellipse(0.35, -10.9, 1.45, 1.75, 0, 0, 7); c.fill();
      if (p.type === 'gent' || p.type === 'umbrella') { c.fillRect(-1.3, -16.2, 3.3, 4.2); c.fillRect(-2.4, -12.4, 5.5, 0.8); }   // top hat
      else if (p.type === 'worker' || p.type === 'child') { c.beginPath(); c.ellipse(0.3, -12.2, 2, 0.95, 0, Math.PI, 0); c.fill(); c.fillRect(1.4, -12.3, 2, 0.7); } // flat cap
      else if (p.type === 'lady') { c.beginPath(); c.moveTo(-1.7, -10.4); c.quadraticCurveTo(-1.8, -13.6, 0.8, -13.5); c.quadraticCurveTo(2.9, -13.2, 2.4, -11.2); c.closePath(); c.fill(); c.fillRect(-1.4, -13.9, 3.2, 0.6); } // bonnet
      c.restore();
      c.restore();
      if (p.dog && v < 1.4) {                       // terrier on a lead
        c.save(); c.translate(x - p.dir * 9, feet); c.scale(p.dir, 1); c.fillStyle = cs; c.strokeStyle = cs;
        c.beginPath(); c.ellipse(0, -3.2, 3, 1.4, 0, 0, 7); c.fill();
        c.beginPath(); c.moveTo(2.4, -3.8); c.lineTo(4.4, -5.6); c.lineTo(5.2, -4.4); c.lineTo(3.4, -2.8); c.fill();
        c.lineWidth = 0.8; [-2, -1, 1.6, 2.4].forEach(function (lx, i) { c.beginPath(); c.moveTo(lx, -2.4); c.lineTo(lx + (i % 2 ? -sw : sw) * 0.8, 0); c.stroke(); });
        c.beginPath(); c.moveTo(-3, -3.6); c.lineTo(-4.4, -5.2); c.stroke();
        c.lineWidth = 0.4; c.beginPath(); c.moveTo(4, -5); c.quadraticCurveTo(6.5, -4, 8.5, -6.5); c.stroke();
        c.restore();
      }
      if (v > 1.2) {                                 // cough puffs + warning mark
        var a2 = clamp((v - 1.2) / 0.6, 0, 1), mx = x + p.dir * 4.5 * s, my = feet - 21 * s;
        if (Math.sin(p.cphase * 5) > 0.2) { c.fillStyle = 'rgba(210,205,195,' + 0.7 * a2 + ')'; c.beginPath(); c.arc(mx + p.dir * 2, my + 4, 1.4, 0, 7); c.arc(mx + p.dir * 4, my + 3, 1, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(214,52,34,' + a2 + ')';
        c.beginPath(); c.moveTo(x, feet - 31 * s); c.lineTo(x - 3, feet - 26 * s); c.lineTo(x + 3, feet - 26 * s); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,240,220,' + a2 + ')'; c.fillRect(x - 0.4, feet - 29.6 * s, 0.8, 2); c.fillRect(x - 0.4, feet - 27.2 * s, 0.8, 0.6);
      }
    }
    return A;
  }
  root.PlumeArt = { create: create };
})(this);
