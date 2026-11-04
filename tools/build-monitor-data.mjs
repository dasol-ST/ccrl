// Build the aggregated data files for the "The climate crisis, right now" monitor page.
//
// Usage:  node tools/build-monitor-data.mjs <EM-DAT export .xlsx> [access date YYYY-MM-DD]
//
// The raw EM-DAT export must NOT be committed to the repository: EM-DAT's terms of use forbid
// redistributing the database or creating substitute databases. This script only publishes
// country-year aggregates plus a minimal description of each country-year's most severe event.
//
// Output:
//   docs/monitor/data/emdat-summary.json   aggregated statistics
//   docs/monitor/data/world-110m.json      Natural Earth 1:110m countries (via world-atlas), ids = ISO alpha-3

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import XLSX from 'xlsx';
import { geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const iso = require('i18n-iso-countries');
XLSX.set_fs(fs);

const [input, accessArg] = process.argv.slice(2);
if (!input) { console.error('Usage: node tools/build-monitor-data.mjs <emdat.xlsx> [YYYY-MM-DD]'); process.exit(1); }
const accessed = accessArg || (path.basename(input).match(/\d{4}-\d{2}-\d{2}/) || [new Date().toISOString().slice(0, 10)])[0];

const FIRST_YEAR = 2000;
const CATEGORIES = [
  { id: 'storm', label: 'Storms' },
  { id: 'flood', label: 'Floods' },
  { id: 'drought', label: 'Droughts' },
  { id: 'heat', label: 'Heatwaves' },
  { id: 'cold', label: 'Cold waves' },
  { id: 'wildfire', label: 'Wildfires' },
  { id: 'landslide', label: 'Landslides' },
];
function category(type, subtype) {
  switch (type) {
    case 'Storm': return 'storm';
    case 'Flood': case 'Glacial lake outburst flood': return 'flood';
    case 'Drought': return 'drought';
    case 'Extreme temperature': return subtype === 'Heat wave' ? 'heat' : 'cold';
    case 'Wildfire': return 'wildfire';
    case 'Mass movement (wet)': return 'landslide';
    default: return null; // geophysical, biological, etc. are out of scope
  }
}
const cleanName = s => String(s || '').replace(/'([^']+)'/g, '$1').replace(/\s*\((General|wet)\)/g, '').replace(/\s+/g, ' ').trim();
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

const wb = XLSX.readFile(input);
const rows = XLSX.utils.sheet_to_json(wb.Sheets['EM-DAT Data'], { defval: null });

const years = {};      // year -> ISO -> aggregate
const countries = {};  // ISO -> name
let latestEntry = '';
let used = 0;
for (const r of rows) {
  const cat = category(r['Disaster Type'], r['Disaster Subtype']);
  const year = num(r['Start Year']);
  if (!cat || year < FIRST_YEAR || !r.ISO) continue;
  used++;
  const isoCode = r.ISO;
  countries[isoCode] = r.Country;
  const deaths = num(r['Total Deaths']);
  const affected = num(r['Total Affected']);
  const y = (years[year] ??= {});
  const c = (y[isoCode] ??= { n: 0, d: 0, a: 0, t: {}, top: null });
  c.n += 1; c.d += deaths; c.a += affected;
  const tc = (c.t[cat] ??= [0, 0, 0]); tc[0] += 1; tc[1] += deaths; tc[2] += affected; // [events, deaths, affected] per hazard
  const name = (r['Event Name'] || '').trim();
  const candidate = { c: cat, name: cleanName(name || r['Disaster Subtype'] || r['Disaster Type']), m: num(r['Start Month']) || null, d: deaths, a: affected };
  if (!c.top || deaths > c.top.d || (deaths === c.top.d && affected > c.top.a)) c.top = candidate;
  if (r['Entry Date'] && String(r['Entry Date']) > latestEntry) latestEntry = String(r['Entry Date']);
}

const yearList = Object.keys(years).map(Number).sort((a, b) => a - b);
const lastYear = yearList.at(-1);
const out = {
  meta: {
    source: 'EM-DAT, CRED / UCLouvain, Brussels, Belgium',
    citation: `Emergency Events Database (EM-DAT), UCLouvain / CRED, Brussels, Belgium, accessed on ${accessed}, https://www.emdat.be/`,
    accessed,
    latestEntry: latestEntry.slice(0, 10),
    firstYear: FIRST_YEAR,
    lastYear,
    provisionalYear: Number(accessed.slice(0, 4)) === lastYear ? lastYear : null,
    categories: CATEGORIES,
    countries,
  },
  totals: {},
  years: {},
};
for (const year of yearList) {
  const list = Object.entries(years[year]).map(([code, v]) => ({ iso: code, ...v }));
  list.sort((a, b) => b.n - a.n || b.d - a.d);
  out.years[year] = list;
  out.totals[year] = {
    n: list.reduce((s, v) => s + v.n, 0),
    d: list.reduce((s, v) => s + v.d, 0),
    a: list.reduce((s, v) => s + v.a, 0),
    countries: list.length,
    t: Object.fromEntries(CATEGORIES.map(k => [k.id, [0, 1, 2].map(i => list.reduce((s, v) => s + ((v.t[k.id] || [0, 0, 0])[i]), 0))])),
  };
}

// World map: re-key world-atlas geometries from ISO numeric to ISO alpha-3, drop Antarctica.
const topo = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'));
const EXTRA = { Kosovo: 'XKX', 'N. Cyprus': 'CYP', Somaliland: 'SOM' }; // unnumbered shapes -> parent/EM-DAT code
topo.objects.countries.geometries = topo.objects.countries.geometries
  .map(g => ({ ...g, id: (g.id && iso.numericToAlpha3(g.id)) || EXTRA[g.properties.name] || null }))
  .filter(g => g.id !== 'ATA');
delete topo.objects.land;

const outDir = path.resolve('docs/monitor/data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'emdat-summary.json'), JSON.stringify(out));
fs.writeFileSync(path.join(outDir, 'world-110m.json'), JSON.stringify(topo));

const onMap = new Set(topo.objects.countries.geometries.map(g => g.id));
// Small states and territories missing from the 1:110m map are drawn as dots at their centroid.
const topo50 = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const centroids = {};
for (const g of topo50.objects.countries.geometries) {
  const a3 = g.id && iso.numericToAlpha3(g.id);
  if (a3) centroids[a3] = geoCentroid(feature(topo50, g)).map(v => +v.toFixed(2));
}
Object.assign(centroids, { MTQ: [-61.02, 14.64], GLP: [-61.58, 16.25], SPI: [-15.6, 28.3], REU: [55.53, -21.11], TKL: [-171.85, -9.2], TUV: [179.2, -8.52], GUF: [-53.1, 3.9], MYT: [45.15, -12.83], AZO: [-28.0, 38.6] });
out.meta.markers = Object.fromEntries(Object.keys(countries).filter(c => !onMap.has(c) && centroids[c]).map(c => [c, centroids[c]]));
fs.writeFileSync(path.join(outDir, 'emdat-summary.json'), JSON.stringify(out));
const missing = Object.keys(countries).filter(c => !onMap.has(c) && !out.meta.markers[c]).map(c => `${c} ${countries[c]}`);
console.log(`Used ${used} EM-DAT records, ${yearList[0]}-${lastYear}, ${Object.keys(countries).length} countries.`);
console.log(`Not drawn on the map at all (tables only): ${missing.join('; ') || 'none'}`);
console.log(`Unmatched map shapes: ${topo.objects.countries.geometries.filter(g => !g.id).map(g => g.properties.name).join(', ') || 'none'}`);
for (const f of ['emdat-summary.json', 'world-110m.json']) console.log(f, (fs.statSync(path.join(outDir, f)).size / 1024).toFixed(0), 'KB');
