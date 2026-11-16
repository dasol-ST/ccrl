/* CCRL Classroom — GHG inventory calculator: factors and calculation (no DOM).
 * IPCC 2006 Guidelines Tier 1 defaults; Korean net calorific values (approx.); national grid factor 2023.
 * Emissions = activity data × emission factor × GWP. Teaching tool, not an official inventory. */
(function (root) {
  'use strict';
  // GWP sets: CH4 fossil / CH4 biogenic / N2O / HFC-134a
  var GWP = {
    sar: { name: 'IPCC SAR (1995), 100-yr', ch4f: 21, ch4b: 21, n2o: 310, hfc: 1300 },
    ar5: { name: 'IPCC AR5 (2014), 100-yr', ch4f: 28, ch4b: 28, n2o: 265, hfc: 1300 },
    ar6: { name: 'IPCC AR6 (2021), 100-yr', ch4f: 29.8, ch4b: 27.0, n2o: 273, hfc: 1530 },
    ar620: { name: 'IPCC AR6 (2021), 20-yr', ch4f: 82.5, ch4b: 79.7, n2o: 273, hfc: 4140 }
  };
  var GWP_KEYS = ['sar', 'ar5', 'ar6', 'ar620'];
  // fuel combustion: NCV (MJ per unit), EF (kg per TJ) for CO2 / CH4 / N2O
  var FUEL = {
    lng:   { ncv: 38.5, co2: 56100, ch4: 5, n2o: 0.1 },      // city gas (LNG), per Nm3, stationary (commercial/institutional)
    dsl_s: { ncv: 35.2, co2: 74100, ch4: 10, n2o: 0.6 },     // diesel, per L, stationary (commercial/institutional)
    gas_m: { ncv: 30.3, co2: 69300, ch4: 33, n2o: 3.2 },     // gasoline, per L, road transport (uncontrolled default)
    dsl_m: { ncv: 35.2, co2: 74100, ch4: 3.9, n2o: 3.9 }     // diesel, per L, road transport
  };
  var GRID = 0.4173;            // tCO2eq/MWh, Korea national power emission factor 2023
  var ENTERIC = { dairy: 68, beef: 47 };   // kg CH4 per head per year, IPCC 2006 Tier 1, Asia
  var EF1 = 0.01;               // kg N2O-N per kg N applied (IPCC 2006, direct)
  var PINE = 6.6;               // kg CO2 absorbed per year by one 30-year-old pine (Korea Forest Service / NIFOS)

  var ROWS = [
    { id: 'elec', scope: 2, unit: 'MWh', kind: 'elec' },
    { id: 'lng', scope: 1, unit: 'Nm³', kind: 'fuel', fuel: 'lng' },
    { id: 'dsl_s', scope: 1, unit: 'L', kind: 'fuel', fuel: 'dsl_s' },
    { id: 'gas_m', scope: 1, unit: 'L', kind: 'fuel', fuel: 'gas_m' },
    { id: 'dsl_m', scope: 1, unit: 'L', kind: 'fuel', fuel: 'dsl_m' },
    { id: 'hfc', scope: 1, unit: 'kg', kind: 'hfc' },
    { id: 'fert', scope: 1, unit: 'kg N', kind: 'fert' },
    { id: 'dairy', scope: 1, unit: T_('head'), kind: 'cattle', cattle: 'dairy' },
    { id: 'beef', scope: 1, unit: T_('head'), kind: 'cattle', cattle: 'beef' }
  ];
  function T_(u) { return u; }

  // returns tonnes of each gas and tCO2eq contribution, plus calculation steps (numbers only)
  function calcRow(row, amount, g, opt) {
    opt = opt || {};
    var r = { co2: 0, ch4: 0, n2o: 0, hfc: 0, eq: { co2: 0, ch4: 0, n2o: 0, hfc: 0 }, steps: null };
    if (!(amount > 0)) return r;
    if (row.kind === 'elec') {
      var green = opt.green || 0, mwh = amount * (1 - green);
      r.co2 = mwh * GRID; r.eq.co2 = r.co2;
      r.steps = { type: 'elec', amount: amount, green: green, mwh: mwh, ef: GRID, total: r.co2 };
    } else if (row.kind === 'fuel') {
      var f = FUEL[row.fuel], tj = amount * f.ncv / 1e6;
      r.co2 = tj * f.co2 / 1000; r.ch4 = tj * f.ch4 / 1000; r.n2o = tj * f.n2o / 1000;
      r.eq.co2 = r.co2; r.eq.ch4 = r.ch4 * g.ch4f; r.eq.n2o = r.n2o * g.n2o;
      r.steps = { type: 'fuel', amount: amount, ncv: f.ncv, tj: tj, ef: f, gwp: g };
    } else if (row.kind === 'hfc') {
      var cut = opt.leakCut || 0, kg = amount * (1 - cut);
      r.hfc = kg / 1000; r.eq.hfc = r.hfc * g.hfc;
      r.steps = { type: 'hfc', amount: amount, cut: cut, kg: kg, gwp: g.hfc };
    } else if (row.kind === 'fert') {
      r.n2o = amount * EF1 * 44 / 28 / 1000; r.eq.n2o = r.n2o * g.n2o;
      r.steps = { type: 'fert', amount: amount, ef: EF1, gwp: g.n2o };
    } else if (row.kind === 'cattle') {
      var ef = ENTERIC[row.cattle];
      r.ch4 = amount * ef / 1000; r.eq.ch4 = r.ch4 * g.ch4b;
      r.steps = { type: 'cattle', amount: amount, ef: ef, gwp: g.ch4b };
    }
    r.total = r.eq.co2 + r.eq.ch4 + r.eq.n2o + r.eq.hfc;
    return r;
  }
  function calc(amounts, gkey, opt) {
    var g = GWP[gkey], out = { rows: {}, total: 0, s1: 0, s2: 0, gas: { co2: 0, ch4: 0, n2o: 0, hfc: 0 } };
    ROWS.forEach(function (row) {
      var r = calcRow(row, amounts[row.id] || 0, g, opt);
      out.rows[row.id] = r; out.total += r.total || 0;
      if (row.scope === 1) out.s1 += r.total || 0; else out.s2 += r.total || 0;
      ['co2', 'ch4', 'n2o', 'hfc'].forEach(function (k) { out.gas[k] += r.eq[k]; });
    });
    return out;
  }
  var api = { GWP: GWP, GWP_KEYS: GWP_KEYS, FUEL: FUEL, GRID: GRID, ENTERIC: ENTERIC, EF1: EF1, PINE: PINE, ROWS: ROWS, calcRow: calcRow, calc: calc };
  if (typeof module !== 'undefined') module.exports = api; else root.GhgCore = api;
})(this);
