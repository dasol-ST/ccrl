/* CCRL Classroom — Stack plume & atmospheric stability: physics core (no DOM).
 * Teaching model. Gaussian-plume ideas (Briggs rural sigmas, Pasquill–Gifford classes,
 * Briggs plume rise) extended to a 4-layer temperature profile by solving
 * crosswind-integrated vertical diffusion with layer-dependent eddy diffusivity:
 *   dC/dx = d/dz( 0.5 * d(sigma_z^2)/dx * dC/dz )
 * which reduces exactly to the Gaussian plume (with ground reflection) when all layers
 * share one stability class. Not a regulatory model.
 */
(function (root) {
  'use strict';
  var G = 9.81;
  var ZB = [0, 100, 250, 400, 600];           // layer boundaries (m)
  var ZTOP = 600;
  var XMAX = 10000;                             // displayed downwind range (m)
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var SY = [0.22, 0.16, 0.11, 0.08, 0.06, 0.04];
  var PEXP = [0.07, 0.07, 0.10, 0.15, 0.35, 0.55]; // rural wind-profile exponents

  function sigYc(x, c) { return SY[c] * x / Math.sqrt(1 + 0.0001 * x); }
  function sigZc(x, c) {
    switch (c) {
      case 0: return 0.20 * x;
      case 1: return 0.12 * x;
      case 2: return 0.08 * x / Math.sqrt(1 + 0.0002 * x);
      case 3: return 0.06 * x / Math.sqrt(1 + 0.0015 * x);
      case 4: return 0.03 * x / (1 + 0.0003 * x);
      default: return 0.016 * x / (1 + 0.0003 * x);
    }
  }
  // continuous class index ci in [0,5] -> blend neighbouring classes in log space
  function blend(fn, x, ci) {
    var a = Math.floor(ci), b = Math.min(5, a + 1), f = ci - a;
    if (f < 1e-6) return fn(x, a);
    return Math.exp((1 - f) * Math.log(fn(x, a)) + f * Math.log(fn(x, b)));
  }
  function sigY(x, ci) { return blend(sigYc, x, ci); }
  function sigZ(x, ci) { return blend(sigZc, x, ci); }

  // lapse (°C per 100 m, positive = warming with height) -> continuous class index.
  // Half-integer points sit exactly on the US EPA delta-T/delta-z class limits,
  // so Math.round(ci) gives the EPA letter.
  var LP = [[-2.0, 0], [-1.9, 0.5], [-1.7, 1.5], [-1.5, 2.5], [-0.5, 3.5], [1.5, 4.5], [2.5, 5]];
  function lapseToCi(L) {
    if (L <= LP[0][0]) return 0;
    for (var i = 1; i < LP.length; i++) {
      if (L <= LP[i][0]) {
        var a = LP[i - 1], b = LP[i];
        return a[1] + (b[1] - a[1]) * (L - a[0]) / (b[0] - a[0]);
      }
    }
    return 5;
  }
  function ciLetter(ci) { return LETTERS[Math.round(ci)]; }
  function layerAt(z) {
    for (var i = 0; i < 4; i++) if (z < ZB[i + 1]) return i;
    return 3;
  }

  function profileInfo(T) {
    var lapse = [], ci = [];
    for (var i = 0; i < 4; i++) {
      lapse[i] = (T[i + 1] - T[i]) / (ZB[i + 1] - ZB[i]) * 100;
      ci[i] = lapseToCi(lapse[i]);
    }
    return { lapse: lapse, ci: ci };
  }
  function tempAt(T, z) {
    var i = layerAt(z);
    return T[i] + (T[i + 1] - T[i]) * (Math.min(z, ZTOP) - ZB[i]) / (ZB[i + 1] - ZB[i]);
  }
  function clampZ(z) { return Math.min(Math.max(z, 10), 200); }
  function windAt(u10, ci0, z) {
    var p = PEXP[Math.floor(ci0)] + (PEXP[Math.min(5, Math.floor(ci0) + 1)] - PEXP[Math.floor(ci0)]) * (ci0 - Math.floor(ci0));
    // power law applied in the surface layer only (capped at 200 m)
    return u10 * Math.pow(clampZ(z) / 10, p);
  }

  /* Layered Briggs plume rise. In each layer the plume uses the neutral/unstable or the
   * stable final-rise formula; if it passes a layer top, the unused part of the rise is
   * converted back into a residual buoyancy flux and carried into the next layer.
   * A strong inversion therefore stops the plume; a weak one can be penetrated. */
  function plumeRise(s, prof) {
    var TaK = tempAt(s.T, s.hs) + 273.15, TsK = s.Ts + 273.15;
    var us = windAt(s.u10, prof.ci[0], s.hs);
    var F = TsK > TaK ? G * s.v * s.d * s.d / 4 * (TsK - TaK) / TsK : 0;
    var mom = 3 * s.d * s.v / us;               // momentum-rise cap
    var z = s.hs, Fc = F, i = layerAt(s.hs), first = true, n = 0;
    while (n++ < 8) {
      var top = ZB[i + 1], stable = prof.ci[i] >= 3.5, dh, expo;
      if (Fc <= 1e-9) dh = 0, expo = 1;
      else if (stable) {
        var sp = G / (tempAt(s.T, z) + 273.15) * (prof.lapse[i] / 100 + 0.0098);
        dh = 2.6 * Math.cbrt(Fc / (us * sp)); expo = 3;
      } else if (Fc < 55) { dh = 21.425 * Math.pow(Fc, 0.75) / us; expo = 1 / 0.75; }
      else { dh = 38.71 * Math.pow(Fc, 0.6) / us; expo = 1 / 0.6; }
      if (first) { dh = Math.max(dh, Math.min(mom, stable ? mom * 0.5 : mom)); first = false; }
      if (z + dh <= top || i === 3 || dh <= 0) {
        return { H: Math.min(z + dh, ZTOP - 20), dh: Math.min(z + dh, ZTOP - 20) - s.hs, F: F, us: us, TaK: TaK };
      }
      Fc = Fc * Math.pow((z + dh - top) / dh, expo);
      z = top; i++;
    }
    return { H: z, dh: z - s.hs, F: F, us: us, TaK: TaK };
  }

  // Briggs distance-dependent rise (2/3 law), for drawing the rising plume
  function riseAt(x, r) {
    if (r.F <= 0) return r.dh * Math.min(1, x / 60);
    var d = 1.6 * Math.cbrt(r.F) * Math.pow(Math.max(x, 0), 2 / 3) / r.us;
    return Math.min(d, r.dh);
  }

  var NZ = 200, DZ = ZTOP / NZ, NX = 320, X0 = 20, X1 = 12000;
  var XG = new Float64Array(NX + 1);
  for (var n = 0; n <= NX; n++) XG[n] = X0 * Math.pow(X1 / X0, n / NX);

  /* Full solve. Returns plume rise, per-layer info and ground-level centreline
   * concentration (µg/m³) along XG. */
  function solve(s) {
    var prof = profileInfo(s.T);
    var r = plumeRise(s, prof);
    var H = r.H, us = r.us;
    var ciH = prof.ci[layerAt(H)];
    var ciz = new Float64Array(NZ);
    for (var k = 0; k < NZ; k++) ciz[k] = prof.ci[layerAt((k + 0.5) * DZ)];

    // initial vertical profile at X0: Gaussian around H, integral = Q/us (g/m²·m)
    var C = new Float64Array(NZ), s0 = Math.max(sigZ(X0, ciH), 3), sum = 0;
    for (k = 0; k < NZ; k++) {
      var zc = (k + 0.5) * DZ;
      C[k] = Math.exp(-0.5 * Math.pow((zc - H) / s0, 2));
      sum += C[k] * DZ;
    }
    var norm = s.Q / us / sum;
    for (k = 0; k < NZ; k++) C[k] *= norm;

    var a = new Float64Array(NZ), b = new Float64Array(NZ), c = new Float64Array(NZ);
    var Dc = new Float64Array(NZ), Df = new Float64Array(NZ + 1), cp = new Float64Array(NZ), dp = new Float64Array(NZ);
    var gl = new Float64Array(NX + 1), sy = new Float64Array(NX + 1);
    var keep = [], keepEvery = 8;
    sy[0] = sigY(X0, ciH);
    gl[0] = C[0] / (Math.sqrt(2 * Math.PI) * sy[0]) * 1e6;
    for (n = 0; n < NX; n++) {
      var xa = XG[n], xb = XG[n + 1];
      for (k = 0; k < NZ; k++) {
        var za = sigZ(xa, ciz[k]), zb = sigZ(xb, ciz[k]);
        Dc[k] = 0.5 * (zb * zb - za * za);
      }
      Df[0] = 0; Df[NZ] = 0;
      for (k = 1; k < NZ; k++) Df[k] = 2 * Dc[k - 1] * Dc[k] / (Dc[k - 1] + Dc[k] + 1e-12);
      var r2 = 1 / (DZ * DZ);
      for (k = 0; k < NZ; k++) {
        a[k] = -Df[k] * r2; c[k] = -Df[k + 1] * r2; b[k] = 1 - a[k] - c[k];
      }
      // Thomas algorithm
      cp[0] = c[0] / b[0]; dp[0] = C[0] / b[0];
      for (k = 1; k < NZ; k++) {
        var m = b[k] - a[k] * cp[k - 1];
        cp[k] = c[k] / m; dp[k] = (C[k] - a[k] * dp[k - 1]) / m;
      }
      C[NZ - 1] = dp[NZ - 1];
      for (k = NZ - 2; k >= 0; k--) C[k] = dp[k] - cp[k] * C[k + 1];
      sy[n + 1] = sigY(xb, ciH);
      gl[n + 1] = C[0] / (Math.sqrt(2 * Math.PI) * sy[n + 1]) * 1e6;
      if (n % keepEvery === 0) keep.push({ x: xb, col: Float32Array.from(C) });
    }
    var cmax = 0, xmax = 0;
    for (n = 0; n <= NX; n++) if (XG[n] <= XMAX && gl[n] > cmax) { cmax = gl[n]; xmax = XG[n]; }
    return {
      prof: prof, rise: r, H: H, us: us, ciH: ciH, x: XG, gl: gl, sy: sy,
      cmax: cmax, xmax: xmax, columns: keep
    };
  }

  // ground-level concentration at arbitrary x (linear interpolation on XG)
  function glAt(res, x) {
    if (x <= XG[0]) return res.gl[0] * Math.max(0, x / XG[0]);
    for (var n = 1; n <= NX; n++) if (XG[n] >= x) {
      var f = (x - XG[n - 1]) / (XG[n] - XG[n - 1]);
      return res.gl[n - 1] + f * (res.gl[n] - res.gl[n - 1]);
    }
    return res.gl[NX];
  }

  var api = {
    ZB: ZB, ZTOP: ZTOP, XMAX: XMAX, LETTERS: LETTERS,
    sigY: sigY, sigZ: sigZ, lapseToCi: lapseToCi, ciLetter: ciLetter, layerAt: layerAt,
    profileInfo: profileInfo, tempAt: tempAt, windAt: windAt, plumeRise: plumeRise,
    riseAt: riseAt, solve: solve, glAt: glAt
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PlumeCore = api;
})(this);
