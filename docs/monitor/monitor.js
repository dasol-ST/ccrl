/* Climate monitor: EM-DAT country-year aggregates on a world map (D3 + TopoJSON). */
(() => {
  const $ = s => document.querySelector(s);
  const MEASURES = {
    n: { label: 'Disasters', unit: n => (n === 1 ? 'disaster' : 'disasters'), bins: [1, 2, 3, 5, 10, 20] },
    d: { label: 'Deaths', unit: n => (n === 1 ? 'death' : 'deaths'), bins: [1, 10, 100, 1000, 10000] },
    a: { label: 'People affected', unit: () => 'people affected', bins: [1, 10000, 100000, 1000000, 10000000] },
  };
  const RAMP6 = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const fmt = new Intl.NumberFormat('en-US');
  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const short = v => (v >= 100000 ? compact.format(v) : fmt.format(v));

  const params = new URLSearchParams(location.search);
  const state = { year: null, measure: params.get('measure') in MEASURES ? params.get('measure') : 'n', hazard: params.get('hazard') || 'all', showAll: false, active: null };
  let data, world, byIso = new Map(), paths, dots, svg;

  const el = (tag, attrs = {}, text) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text != null) e.textContent = text; return e; };
  const val = (rec, m = state.measure) => {
    if (!rec) return 0;
    if (state.hazard === 'all') return rec[m];
    const t = rec.t[state.hazard];
    return t ? t[{ n: 0, d: 1, a: 2 }[m]] : 0;
  };
  const hazardLabel = id => (data.meta.categories.find(c => c.id === id) || {}).label || id;
  const singular = { storm: 'Storm', flood: 'Flood', drought: 'Drought', heat: 'Heatwave', cold: 'Cold wave', wildfire: 'Wildfire', landslide: 'Landslide' };

  function bins() {
    const b = MEASURES[state.measure].bins;
    const colors = (b.length === 6 ? RAMP6 : RAMP6.slice(1)).map(css);
    const labels = b.map((lo, i) => {
      const hi = b[i + 1];
      if (hi == null) return `${short(lo)}+`;
      if (hi - lo === 1) return short(lo);
      return `${short(lo)}–${short(hi - 1)}`;
    });
    return { b, colors, labels };
  }
  function color(v) {
    if (!v) return css('--none');
    const { b, colors } = bins();
    let i = 0; while (i + 1 < b.length && v >= b[i + 1]) i++;
    return colors[i];
  }

  async function init() {
    [data, world] = await Promise.all([
      fetch('data/emdat-summary.json?v=20261105a').then(r => r.json()),
      fetch('data/world-110m.json?v=20261105a').then(r => r.json()),
    ]);
    const { firstYear, lastYear, provisionalYear } = data.meta;
    const requested = Number(params.get('year'));
    const defaultYear = provisionalYear ? lastYear - 1 : lastYear;
    state.year = requested >= firstYear && requested <= lastYear ? requested : defaultYear;
    const range = $('#year-range');
    range.min = firstYear; range.max = lastYear; range.value = state.year;
    $('#citation').textContent = data.meta.citation;
    $('#current-year').textContent = new Date().getFullYear();

    const chips = $('#hazards');
    [{ id: 'all', label: 'All hazards' }, ...data.meta.categories].forEach(c => {
      const b = el('button', { type: 'button', role: 'radio', 'data-hazard': c.id, 'aria-checked': String(c.id === state.hazard) }, c.label);
      chips.append(b);
    });
    if (!chips.querySelector('[aria-checked="true"]')) { state.hazard = 'all'; chips.firstChild.setAttribute('aria-checked', 'true'); }

    drawMap();
    bind();
    render();
  }

  function drawMap() {
    const W = 960, H = 470;
    const projection = d3.geoEqualEarth().fitExtent([[4, 4], [W - 4, H - 4]], { type: 'Sphere' });
    const path = d3.geoPath(projection);
    svg = d3.select('#map').append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('aria-hidden', 'true');
    svg.append('path').attr('class', 'sphere').attr('d', path({ type: 'Sphere' }));
    const features = topojson.feature(world, world.objects.countries).features;
    paths = svg.append('g').selectAll('path').data(features).join('path')
      .attr('class', 'country').attr('d', path);
    const markers = Object.entries(data.meta.markers || {}).map(([iso, lonlat]) => ({ id: iso, xy: projection(lonlat) })).filter(m => m.xy);
    dots = svg.append('g').selectAll('circle').data(markers).join('circle')
      .attr('class', 'dot').attr('cx', d => d.xy[0]).attr('cy', d => d.xy[1]).attr('r', 3.2);
    const names = new Map(features.map(f => [f.id, f.properties.name]));
    const show = (event, d) => showTooltip(event, d.id, names.get(d.id));
    for (const sel of [paths, dots]) {
      sel.on('mousemove', (e, d) => { if (e.pointerType !== 'touch' && !isSmall()) show(e, d); })
        .on('mouseleave', () => { if (!isSmall()) hideTooltip(); })
        .on('click', (e, d) => show(e, d));
    }
  }
  const isSmall = () => matchMedia('(max-width: 640px)').matches;

  function bind() {
    const setYear = y => { state.year = Math.max(data.meta.firstYear, Math.min(data.meta.lastYear, y)); render(); };
    $('#year-range').addEventListener('input', e => setYear(Number(e.target.value)));
    $('#year-prev').addEventListener('click', () => setYear(state.year - 1));
    $('#year-next').addEventListener('click', () => setYear(state.year + 1));
    $('#measure').addEventListener('click', e => { const b = e.target.closest('[data-measure]'); if (!b) return; state.measure = b.dataset.measure; render(); });
    $('#hazards').addEventListener('click', e => { const b = e.target.closest('[data-hazard]'); if (!b) return; state.hazard = b.dataset.hazard; render(); });
    $('#table-more').addEventListener('click', () => { state.showAll = !state.showAll; renderTable(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTooltip(); });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderTrend, 150); });
    document.addEventListener('click', e => { if (!e.target.closest('#map') && !e.target.closest('#tooltip')) hideTooltip(); });
  }

  function render() {
    const y = state.year;
    byIso = new Map((data.years[y] || []).map(r => [r.iso, r]));
    $('#year-value').textContent = y;
    $('#year-range').value = y;
    $('#year-prev').disabled = y <= data.meta.firstYear;
    $('#year-next').disabled = y >= data.meta.lastYear;
    document.querySelectorAll('[data-measure]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.measure === state.measure)));
    document.querySelectorAll('[data-hazard]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.hazard === state.hazard)));
    const q = new URLSearchParams({ year: y, measure: state.measure }); if (state.hazard !== 'all') q.set('hazard', state.hazard);
    history.replaceState(null, '', `?${q}`);

    const prov = $('#provisional');
    if (y === data.meta.provisionalYear) {
      prov.hidden = false;
      prov.textContent = `${y} is provisional: events entered in EM-DAT up to ${new Date(data.meta.latestEntry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    } else prov.hidden = true;

    paths.attr('fill', d => color(val(byIso.get(d.id))));
    dots.attr('fill', d => color(val(byIso.get(d.id)))).attr('display', d => (byIso.has(d.id) ? null : 'none'));
    renderStats(); renderLegend(); renderTable(); renderTrend();
    if (state.active) refreshTooltip();
  }

  function totals() {
    const t = data.totals[state.year];
    if (!t) return { n: 0, d: 0, a: 0, countries: 0 };
    if (state.hazard === 'all') return t;
    const [n, d, a] = t.t[state.hazard];
    const countries = (data.years[state.year] || []).filter(r => r.t[state.hazard]).length;
    return { n, d, a, countries };
  }
  function renderStats() {
    const t = totals();
    const items = [[fmt.format(t.n), state.hazard === 'all' ? 'disasters recorded' : `${hazardLabel(state.hazard).toLowerCase()} recorded`], [fmt.format(t.countries), 'countries and territories affected'], [fmt.format(t.d), 'deaths'], [short(t.a), 'people affected']];
    const box = $('#stats'); box.replaceChildren();
    for (const [v, l] of items) { const d = el('div', { class: 'm-stat' }); d.append(el('strong', {}, v), el('span', {}, l)); box.append(d); }
  }
  function renderLegend() {
    const box = $('#legend'); box.replaceChildren();
    box.append(el('span', { class: 'title' }, MEASURES[state.measure].label));
    const { colors, labels } = bins();
    const none = el('span', { class: 'key' }); const ni = el('i'); ni.style.background = css('--none'); none.append(ni, document.createTextNode('None recorded')); box.append(none);
    labels.forEach((l, i) => { const k = el('span', { class: 'key' }); const s = el('i'); s.style.background = colors[i]; k.append(s, document.createTextNode(l)); box.append(k); });
  }

  function rows() {
    return (data.years[state.year] || []).filter(r => val(r, 'n') > 0)
      .sort((a, b) => val(b) - val(a) || val(b, 'n') - val(a, 'n'));
  }
  function eventText(rec) {
    const top = rec.top;
    if (!top || (state.hazard !== 'all' && top.c !== state.hazard)) return '';
    const bits = [top.name + (top.m ? `, ${MONTHS[top.m - 1]}` : '')];
    if (top.d) bits.push(`${fmt.format(top.d)} ${top.d === 1 ? 'death' : 'deaths'}`);
    if (top.a) bits.push(`${short(top.a)} affected`);
    return bits.join(' · ');
  }
  function renderTable() {
    const list = rows();
    const shown = state.showAll ? list : list.slice(0, 10);
    $('#table-title').textContent = `Most affected countries, ${state.year}`;
    const idx = { n: 1, d: 2, a: 3 }[state.measure];
    document.querySelectorAll('#table th').forEach((th, i) => th.classList.toggle('sorted', i === idx));
    const tb = $('#table tbody'); tb.replaceChildren();
    for (const r of shown) {
      const tr = el('tr');
      tr.append(el('td', {}, data.meta.countries[r.iso] || r.iso), el('td', { class: 'num' }, fmt.format(val(r, 'n'))), el('td', { class: 'num' }, fmt.format(val(r, 'd'))), el('td', { class: 'num' }, short(val(r, 'a'))), el('td', { class: 'event' }, eventText(r) || '–'));
      tb.append(tr);
    }
    if (!list.length) { const tr = el('tr'); tr.append(el('td', { colspan: 5 }, 'No events recorded for this selection.')); tb.append(tr); }
    const more = $('#table-more');
    more.hidden = list.length <= 10;
    more.textContent = state.showAll ? 'Show top 10' : `Show all ${list.length} countries`;
  }

  function renderTrend() {
    const box = $('#trend'); box.replaceChildren();
    const m = state.measure;
    $('#trend-title').textContent = `${MEASURES[m].label} per year${state.hazard === 'all' ? '' : ` · ${hazardLabel(state.hazard)}`}`;
    const years = d3.range(data.meta.firstYear, data.meta.lastYear + 1);
    const series = years.map(y => {
      const t = data.totals[y]; if (!t) return { y, v: 0 };
      return { y, v: state.hazard === 'all' ? t[m] : t.t[state.hazard][{ n: 0, d: 1, a: 2 }[m]] };
    });
    const W = Math.max(300, Math.round(box.clientWidth || 520)), H = W < 420 ? 220 : 250, M = { t: 16, r: 4, b: 26, l: 44 };
    const x = d3.scaleBand().domain(years).range([M.l, W - M.r]).paddingInner(0.18);
    const y = d3.scaleLinear().domain([0, d3.max(series, d => d.v) || 1]).nice(4).range([H - M.b, M.t]);
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `${MEASURES[m].label} per year, ${years[0]} to ${years.at(-1)}`);
    const defs = s.append('defs');
    const pat = defs.append('pattern').attr('id', 'prov').attr('width', 5).attr('height', 5).attr('patternUnits', 'userSpaceOnUse').attr('patternTransform', 'rotate(45)');
    pat.append('rect').attr('width', 5).attr('height', 5).attr('fill', css('--s2'));
    pat.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 5).attr('stroke', css('--s4')).attr('stroke-width', 2);
    s.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(4)).join('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', d => y(d)).attr('y2', d => y(d));
    s.append('g').attr('class', 'axis').attr('transform', `translate(${M.l - 6},0)`).call(d3.axisLeft(y).ticks(4).tickSize(0).tickFormat(v => short(v)));
    s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - M.b + 6})`).call(d3.axisBottom(x).tickSize(0).tickValues(years.filter(v => (v % 5 === 0 && years.at(-1) - v >= 3) || v === years.at(-1))));
    const r = 3;
    const barPath = d => { const x0 = x(d.y), w = x.bandwidth(), y0 = y(d.v), h = y(0) - y0; if (h <= 0) return ''; const rr = Math.min(r, h, w / 2); return `M${x0},${y(0)}V${y0 + rr}Q${x0},${y0} ${x0 + rr},${y0}H${x0 + w - rr}Q${x0 + w},${y0} ${x0 + w},${y0 + rr}V${y(0)}Z`; };
    s.append('g').selectAll('path').data(series).join('path')
      .attr('class', 'bar').attr('d', barPath)
      .attr('fill', d => (d.y === data.meta.provisionalYear ? 'url(#prov)' : d.y === state.year ? css('--s6') : css('--s3')))
      .attr('stroke', d => (d.y === state.year && d.y === data.meta.provisionalYear ? css('--s6') : 'none')).attr('stroke-width', 1.5);
    // Hit areas cover the full column, bigger than the bar itself.
    s.append('g').selectAll('rect').data(series).join('rect')
      .attr('x', d => x(d.y) - x.step() * x.paddingInner() / 2).attr('width', x.step()).attr('y', M.t).attr('height', H - M.b - M.t)
      .attr('fill', 'transparent').style('cursor', 'pointer')
      .on('click', (e, d) => { state.year = d.y; render(); })
      .append('title').text(d => `${d.y}${d.y === data.meta.provisionalYear ? ' (provisional)' : ''}: ${fmt.format(d.v)} ${MEASURES[m].unit(d.v)}`);
    const sel = series.find(d => d.y === state.year);
    if (sel) s.append('text').attr('class', 'label').attr('x', x(sel.y) + x.bandwidth() / 2).attr('y', y(sel.v) - 5).attr('text-anchor', 'middle').text(short(sel.v));
  }

  function showTooltip(event, iso, mapName) {
    state.active = { iso, name: mapName, x: event.clientX, y: event.clientY };
    document.querySelectorAll('.m-map .active').forEach(n => n.classList.remove('active'));
    if (event.currentTarget) event.currentTarget.classList.add('active');
    refreshTooltip();
  }
  function refreshTooltip() {
    const { iso, name, x, y } = state.active;
    const rec = byIso.get(iso);
    const tip = $('#tooltip'); tip.replaceChildren(); tip.hidden = false;
    tip.append(el('h3', {}, data.meta.countries[iso] || name || iso));
    const v = val(rec);
    const lead = el('div', { class: 'lead' }, v ? short(v) : '0');
    lead.append(el('small', {}, `${MEASURES[state.measure].unit(v)} in ${state.year}`));
    tip.append(lead);
    if (rec && val(rec, 'n')) {
      const dl = el('dl');
      const add = (k, value) => dl.append(el('dt', {}, k), el('dd', {}, value));
      if (state.measure !== 'n') add('Disasters', fmt.format(val(rec, 'n')));
      if (state.measure !== 'd') add('Deaths', fmt.format(val(rec, 'd')));
      if (state.measure !== 'a') add('People affected', short(val(rec, 'a')));
      if (state.hazard === 'all') {
        const parts = Object.entries(rec.t).sort((a, b) => b[1][0] - a[1][0]).map(([k, t]) => `${singular[k] || k} ${t[0]}`);
        add('By hazard', parts.join(', '));
      }
      tip.append(dl);
      const ev = eventText(rec);
      if (ev) { const box = el('div', { class: 'event' }); box.append(el('b', {}, 'Most severe event'), document.createTextNode(ev)); tip.append(box); }
    } else {
      tip.append(el('p', { style: 'margin:6px 0 0;color:var(--muted)' }, 'No disasters recorded for this selection.'));
    }
    const close = el('button', { type: 'button', class: 'close', 'aria-label': 'Close' }, '×');
    close.addEventListener('click', hideTooltip);
    tip.append(close);
    if (!isSmall()) {
      const card = $('.m-map-card').getBoundingClientRect();
      let left = x - card.left + 16, top = y - card.top + 16;
      if (left + tip.offsetWidth > card.width - 8) left = x - card.left - tip.offsetWidth - 16;
      if (top + tip.offsetHeight > card.height - 8) top = Math.max(8, y - card.top - tip.offsetHeight - 16);
      tip.style.left = `${Math.max(8, left)}px`; tip.style.top = `${top}px`;
    }
  }
  function hideTooltip() {
    state.active = null; $('#tooltip').hidden = true;
    document.querySelectorAll('.m-map .active').forEach(n => n.classList.remove('active'));
  }

  init().catch(err => { console.error(err); $('#map').textContent = 'The map could not be loaded. Please refresh the page.'; });
})();
