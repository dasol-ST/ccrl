/* CCRL Classroom — Skew-T parcel lifting: thermodynamics (no DOM).
 * Surface parcel lifted dry-adiabatically to the LCL (Bolton 1980), then along a pseudo-adiabat
 * (numerical integration). CAPE/CIN from the parcel–environment temperature difference
 * (virtual-temperature correction omitted for simplicity). Teaching model. */
(function (root) {
  'use strict';
  var Rd = 287.04, cp = 1005.7, Lv = 2.501e6, eps = 0.622, g = 9.81, K0 = 273.15;
  var LEVELS = [1000, 925, 850, 700, 500, 300, 200, 100];
  var PTOP = 100;

  function es(Tc) { return 6.112 * Math.exp(17.67 * Tc / (Tc + 243.5)); }            // hPa
  function rs(Tc, p) { var e = es(Tc); return eps * e / (p - e); }                    // kg/kg
  function lcl(Tc, Tdc, p) {                                                          // Bolton (1980) eq. 15
    var T = Tc + K0, Td = Tdc + K0;
    var Tl = 1 / (1 / (Td - 56) + Math.log(T / Td) / 800) + 56;
    return { T: Tl - K0, p: p * Math.pow(Tl / T, cp / Rd) };
  }
  function moistLapse(Tc, p) {                                                       // dT/dp along a pseudo-adiabat (K/hPa)
    var T = Tc + K0, r = rs(Tc, p);
    return (1 / p) * (Rd * T + Lv * r) / (cp + Lv * Lv * r * eps / (Rd * T * T));
  }
  // environment value at pressure p (linear in ln p between levels)
  function envAt(arr, p) {
    if (p >= LEVELS[0]) return arr[0];
    for (var i = 1; i < LEVELS.length; i++) if (p >= LEVELS[i]) {
      var f = Math.log(LEVELS[i - 1] / p) / Math.log(LEVELS[i - 1] / LEVELS[i]);
      return arr[i - 1] + (arr[i] - arr[i - 1]) * f;
    }
    var n = LEVELS.length - 1, f2 = Math.log(LEVELS[n - 1] / p) / Math.log(LEVELS[n - 1] / LEVELS[n]);
    return arr[n - 1] + (arr[n] - arr[n - 1]) * f2;
  }
  function parcel(T, Td) {
    var p0 = LEVELS[0], L = lcl(T[0], Td[0], p0), prof = [], dp = 2;
    var theta = (T[0] + K0) * Math.pow(1000 / p0, Rd / cp);
    for (var p = p0; p > L.p; p -= dp) prof.push({ p: p, T: theta * Math.pow(p / 1000, Rd / cp) - K0 });
    prof.push({ p: L.p, T: L.T });
    var Tp = L.T;
    for (p = L.p; p > PTOP; ) {
      var pn = Math.max(PTOP, p - dp);
      var k1 = moistLapse(Tp, p), k2 = moistLapse(Tp - k1 * (p - pn), pn);          // Heun step
      Tp -= 0.5 * (k1 + k2) * (p - pn); p = pn;
      prof.push({ p: p, T: Tp });
    }
    return { lcl: L, prof: prof };
  }
  function heights(T) {                                                               // hypsometric heights (m) of p for the environment
    return function (p) {
      var z = 0, pp = LEVELS[0], steps = 60, lp0 = Math.log(pp), lp1 = Math.log(p);
      for (var i = 0; i < steps; i++) {
        var a = Math.exp(lp0 + (lp1 - lp0) * i / steps), b = Math.exp(lp0 + (lp1 - lp0) * (i + 1) / steps);
        var Tm = envAt(T, Math.sqrt(a * b)) + K0;
        z += Rd * Tm / g * Math.log(a / b);
      }
      return z;
    };
  }
  function analyse(T, Td) {
    var P = parcel(T, Td), prof = P.prof, cape = 0, cin = 0, lfc = null, el = null, inPos = false;
    for (var i = 1; i < prof.length; i++) {
      var a = prof[i - 1], b = prof[i];
      var da = a.T - envAt(T, a.p), db = b.T - envAt(T, b.p), d = 0.5 * (da + db);
      var dlnp = Math.log(a.p / b.p), contrib = Rd * d * dlnp;
      if (d > 0) {
        if (!inPos && b.p <= P.lcl.p + 1e-6) { inPos = true; if (lfc === null) lfc = b.p; }
        if (lfc !== null) cape += contrib;
      } else {
        if (inPos) { inPos = false; el = b.p; }
        if (lfc === null) cin += contrib;
      }
    }
    if (lfc !== null && el === null) el = PTOP;
    if (lfc === null) cin = 0;                                                        // no free convection: CIN undefined
    var t500 = envAt(T, 500), p500 = null;
    for (i = 0; i < prof.length; i++) if (prof[i].p <= 500) { p500 = prof[i].T; break; }
    var z = heights(T);
    return { prof: prof, lcl: P.lcl, lfc: lfc, el: el, cape: cape, cin: cin, li: t500 - p500, z: z,
      zl: z(P.lcl.p), zlfc: lfc ? z(lfc) : null, zel: el ? z(el) : null };
  }
  function lapse(T, i) {                                                              // environmental lapse rate between levels (°C/km)
    var z = heights(T); return -(T[i + 1] - T[i]) / ((z(LEVELS[i + 1]) - z(LEVELS[i])) / 1000);
  }
  var api = { LEVELS: LEVELS, PTOP: PTOP, es: es, rs: rs, lcl: lcl, envAt: envAt, parcel: parcel, analyse: analyse, heights: heights, lapse: lapse, moistLapse: moistLapse, K0: K0, Rd: Rd, cp: cp };
  if (typeof module !== 'undefined') module.exports = api; else root.SkewCore = api;
})(this);
