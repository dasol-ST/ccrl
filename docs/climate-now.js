/* Homepage teaser for the climate monitor: a pre-projected world map coloured by disaster count.
   Data are loaded only when the section approaches the viewport. */
(() => {
  const section = document.getElementById('climate-now');
  if (!section) return;
  const mapBox = document.getElementById('now-map');
  const tip = document.getElementById('now-tooltip');
  const fmt = new Intl.NumberFormat('en-US');
  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const short = v => (v >= 100000 ? compact.format(v) : fmt.format(v));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const BINS = [1, 2, 3, 5, 10, 20];
  const STEPS = ['--now-1', '--now-2', '--now-3', '--now-4', '--now-5', '--now-6'];
  const NS = 'http://www.w3.org/2000/svg';
  const small = () => matchMedia('(max-width: 760px)').matches;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const step = n => { if (!n) return 'var(--now-none)'; let i = 0; while (i + 1 < BINS.length && n >= BINS[i + 1]) i++; return `var(${STEPS[i]})`; };
  let home;

  async function load() {
    const [h, world] = await Promise.all([
      fetch('monitor/data/home.json?v=20261105a').then(r => r.json()),
      fetch('monitor/data/world-paths.json?v=20261105a').then(r => r.json()),
    ]);
    home = h;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', world.viewBox.join(' '));
    svg.setAttribute('aria-hidden', 'true');
    const sphere = document.createElementNS(NS, 'path');
    sphere.setAttribute('d', world.sphere); sphere.setAttribute('class', 'now-sphere'); svg.append(sphere);
    const names = {};
    for (const c of world.countries) {
      names[c.id] = c.name;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', c.d); p.setAttribute('class', 'now-country'); p.dataset.iso = c.id;
      p.style.fill = step(home.countries[c.id]?.n);
      svg.append(p);
    }
    for (const d of world.dots) {
      if (!home.countries[d.id]) continue;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', d.xy[0]); c.setAttribute('cy', d.xy[1]); c.setAttribute('r', 3.4);
      c.setAttribute('class', 'now-dot'); c.dataset.iso = d.id; c.style.fill = step(home.countries[d.id].n);
      svg.append(c);
    }
    mapBox.replaceChildren(svg);

    const t = home.totals;
    const summary = document.getElementById('now-summary');
    summary.replaceChildren(el('strong', null, fmt.format(t.n)), document.createTextNode(` disasters in `), el('strong', null, fmt.format(t.countries)), document.createTextNode(` countries and territories ${home.provisional ? 'so far in' : 'in'} ${home.year}`));
    const asOf = new Date(home.latestEntry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const src = document.getElementById('now-source');
    src.replaceChildren(document.createTextNode('Data: '));
    const a = el('a', null, 'EM-DAT'); a.href = 'https://www.emdat.be/'; a.target = '_blank'; a.rel = 'noopener';
    src.append(a, document.createTextNode(`, CRED / UCLouvain, Brussels, Belgium (accessed ${home.accessed}). ${home.provisional ? `Provisional figures, events entered up to ${asOf}.` : ''}`));

    const show = (target, x, y) => {
      section.querySelectorAll('.now-active').forEach(n => n.classList.remove('now-active'));
      target.classList.add('now-active');
      const iso = target.dataset.iso, rec = home.countries[iso];
      tip.replaceChildren(el('h3', null, rec?.name || names[iso] || iso));
      const lead = el('p', 'now-lead', rec ? fmt.format(rec.n) : '0');
      lead.append(el('span', null, ` ${rec?.n === 1 ? 'disaster' : 'disasters'} in ${home.year}`));
      tip.append(lead);
      if (rec) {
        tip.append(el('p', 'now-meta', `${fmt.format(rec.d)} deaths · ${short(rec.a)} people affected`));
        if (rec.top) {
          const bits = [rec.top.name + (rec.top.m ? `, ${MONTHS[rec.top.m - 1]}` : '')];
          if (rec.top.d) bits.push(`${fmt.format(rec.top.d)} ${rec.top.d === 1 ? 'death' : 'deaths'}`);
          const ev = el('p', 'now-event'); ev.append(el('b', null, 'Most severe event'), document.createTextNode(bits.join(' · ')));
          tip.append(ev);
        }
      }
      tip.hidden = false;
      if (!small()) {
        const box = mapBox.getBoundingClientRect();
        let left = x - box.left + 16, top = y - box.top + 16;
        if (left + tip.offsetWidth > box.width) left = x - box.left - tip.offsetWidth - 16;
        if (top + tip.offsetHeight > box.height) top = Math.max(0, y - box.top - tip.offsetHeight - 16);
        tip.style.left = `${Math.max(0, left)}px`; tip.style.top = `${top}px`;
      } else { tip.style.left = ''; tip.style.top = ''; }
    };
    const hide = () => { tip.hidden = true; section.querySelectorAll('.now-active').forEach(n => n.classList.remove('now-active')); };
    svg.addEventListener('mousemove', e => { const t = e.target.closest('[data-iso]'); if (small()) return; if (t) show(t, e.clientX, e.clientY); else hide(); });
    svg.addEventListener('mouseleave', () => { if (!small()) hide(); });
    svg.addEventListener('click', e => { const t = e.target.closest('[data-iso]'); if (t) show(t, e.clientX, e.clientY); else hide(); });
  }

  const start = () => load().catch(err => { console.error(err); document.getElementById('now-summary').textContent = 'The latest figures could not be loaded.'; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '600px 0px' });
    io.observe(section);
  } else start();
})();
