/* CCRL Classroom — carbon budget simulator: model (no DOM).
 * Warming follows cumulative CO2 (TCRE). Calibrated so that the remaining carbon budgets of
 * Forster et al. (2026), Indicators of Global Climate Change 2025, Table 8 (from the start of 2026)
 * are reproduced exactly: T(peak) = T0_p + s_p * cumulative CO2 since 2026, for avoidance
 * probability p, with medium non-CO2 mitigation. Teaching model, not a climate projection. */
(function (root) {
  'use strict';
  var Y0 = 2025, Y1 = 2100;
  var E2025 = 42;                       // GtCO2/yr, total CO2 incl. land use (IGCC 2025 / GCB 2025)
  var T2025 = 1.37;                     // human-induced warming in 2025, °C above 1850–1900 (IGCC 2025)
  // Table 8 remaining budgets from the start of 2026 (GtCO2), TCRE uncertainty only
  var RCB = {
    17: { 1.5: 340, 1.6: 630, 1.7: 930, 2.0: 1800 },
    33: { 1.5: 210, 1.6: 430, 1.7: 650, 2.0: 1310 },
    50: { 1.5: 130, 1.6: 320, 1.7: 500, 2.0: 1050 },
    67: { 1.5: 80, 1.6: 240, 1.7: 390, 2.0: 860 },
    83: { 1.5: 30, 1.6: 170, 1.7: 300, 2.0: 690 }
  };
  // linear fit through the 1.5 and 2.0 °C budgets for each probability column
  var FIT = {};
  Object.keys(RCB).forEach(function (p) {
    var b = RCB[p], s = 0.5 / (b[2.0] - b[1.5]) * 1000;   // °C per 1000 GtCO2
    FIT[p] = { s: s, T0: 1.5 - s * b[1.5] / 1000 };
  });
  // future non-CO2 warming relative to the medium assumption behind the budgets
  var NONCO2 = [0.12, 0, -0.06];        // weak / medium / strong methane & N2O cuts (illustrative)
  var PTS = [2030, 2040, 2050, 2060, 2080, 2100];

  function pathFromLevers(o) {          // o: start (year cuts begin), nz (net-zero year), cdr (GtCO2/yr removal)
    var out = [];
    PTS.forEach(function (y) { out.push(emitLever(o, y)); });
    return out;
  }
  function emitLever(o, y) {
    if (y <= o.start) return E2025;
    if (y <= o.nz) return E2025 * (1 - (y - o.start) / Math.max(1, o.nz - o.start));
    return -o.cdr * Math.min(1, (y - o.nz) / 10);
  }
  function annual(points) {             // yearly series 2025..2100 by linear interpolation of points
    var xs = [Y0].concat(PTS), ys = [E2025].concat(points), e = [];
    for (var y = Y0; y <= Y1; y++) {
      var i = 1; while (i < xs.length - 1 && xs[i] < y) i++;
      var f = (y - xs[i - 1]) / (xs[i] - xs[i - 1]);
      e.push(ys[i - 1] + (ys[i] - ys[i - 1]) * Math.max(0, Math.min(1, f)));
    }
    return e;
  }
  function run(points, nonco2) {
    var e = annual(points), cum = [], T = { 17: [], 50: [], 83: [] }, c = 0, years = [];
    var dN = NONCO2[nonco2 == null ? 1 : nonco2];
    for (var k = 0; k < e.length; k++) {
      var y = Y0 + k; years.push(y);
      if (y > Y0) c += e[k];
      cum.push(c);
      var ramp = Math.min(1, (y - Y0) / 25);
      ['17', '50', '83'].forEach(function (p) {
        var F = FIT[p];
        T[p].push(T2025 + (F.T0 - T2025) * ramp + F.s * c / 1000 + dN * ramp);
      });
    }
    var peak = -9, peakY = Y0;
    T['50'].forEach(function (v, i) { if (v > peak) { peak = v; peakY = years[i]; } });
    return { years: years, e: e, cum: cum, T: T, peak: peak, peakY: peakY, T2100: T['50'][T['50'].length - 1],
      T2100lo: T['17'][T['17'].length - 1], T2100hi: T['83'][T['83'].length - 1], total: c };
  }
  function exhaust(res, deg, p) {        // first year the remaining budget for deg at probability p is used up
    var b = RCB[p][deg];
    for (var i = 0; i < res.cum.length; i++) if (res.cum[i] >= b) return res.years[i];
    return null;
  }
  root.CarbonModel = { Y0: Y0, Y1: Y1, E2025: E2025, T2025: T2025, RCB: RCB, FIT: FIT, PTS: PTS, NONCO2: NONCO2,
    pathFromLevers: pathFromLevers, annual: annual, run: run, exhaust: exhaust };
  if (typeof module !== 'undefined') module.exports = root.CarbonModel;
})(this);
