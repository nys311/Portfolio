// Travel page: cyberpunk pixel world map (canvas + SVG overlay) linked to a 3D page-flip journal.
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const asset = (u = '') => (/^https?:/i.test(u) ? esc(u) : /^assets\//i.test(u) ? esc(LN.root + u) : '');

  // ---------- geo helpers ----------
  const rad = (d) => (d * Math.PI) / 180;
  function km(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  function heading(a, b) {
    const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
    const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    return `${String(Math.round(deg)).padStart(3, '0')}° ${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8]}`;
  }
  const flight = (d) => { const h = d / 780 + 0.5; return `~${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, '0')}`; };
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const coord = (lat, lon) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  const pad = (n) => String(n).padStart(2, '0');
  // ISO 3166 alpha-3 codes (never derive codes from the first letters — e.g. Japan must be JPN).
  const ISO = {
    'Vietnam': 'VNM', 'China': 'CHN', 'Hong Kong': 'HKG', 'Macao': 'MAC', 'Taiwan': 'TWN', 'Japan': 'JPN', 'South Korea': 'KOR',
    'Thailand': 'THA', 'Singapore': 'SGP', 'Malaysia': 'MYS', 'Indonesia': 'IDN', 'Philippines': 'PHL', 'Cambodia': 'KHM', 'Laos': 'LAO',
    'India': 'IND', 'Australia': 'AUS', 'United States of America': 'USA', 'United Kingdom': 'GBR', 'France': 'FRA', 'Germany': 'DEU',
  };
  const code = (s) => ISO[s] || String(s).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();

  function stats(t) {
    const trips = t.trips || [];
    const dists = trips.map((x) => km(t.home, x));
    const far = trips[dists.indexOf(Math.max(...dists))];
    const visits = Object.entries(t.visits || {}).sort((a, b) => b[1] - a[1])[0];
    return {
      places: trips.length,
      countries: new Set(trips.map((x) => x.country)).size,
      km: dists.reduce((a, b) => a + b, 0),
      farthest: far ? far.place : '—',
      top: visits ? `${visits[0]} ×${visits[1]}` : null,
    };
  }

  LN.travel = { km, fmt, coord, stats };

  // Group cities that would overlap on the map into one pin.
  function clusters(t, proj, minDist) {
    const out = [];
    t.trips.forEach((tr, i) => {
      const [x, y] = proj(tr.lat, tr.lon);
      const c = out.find((k) => Math.hypot(k.x - x, k.y - y) < minDist);
      if (c) { c.items.push(i); c.x = (c.x * (c.items.length - 1) + x) / c.items.length; c.y = (c.y * (c.items.length - 1) + y) / c.items.length; }
      else out.push({ x, y, items: [i] });
    });
    return out;
  }

  // ==========================================================================
  // Map — auto-fits to home + trips, square "pixel" dots
  // ==========================================================================
  function createMap(wrap, t, onSelect) {
    const W = LN.WORLD;
    const pts = [t.home, ...t.trips];
    let lon0 = Math.min(...pts.map((p) => p.lon)) - 14, lon1 = Math.max(...pts.map((p) => p.lon)) + 14;
    let lat1 = Math.min(...pts.map((p) => p.lat)) - 10, lat0 = Math.max(...pts.map((p) => p.lat)) + 10;
    const ASPECT = 2.1; // keep the map wide (degrees lon / degrees lat)
    if ((lon1 - lon0) / (lat0 - lat1) < ASPECT) { const c = (lon0 + lon1) / 2, half = ((lat0 - lat1) * ASPECT) / 2; lon0 = c - half; lon1 = c + half; }
    else { const c = (lat0 + lat1) / 2, half = (lon1 - lon0) / ASPECT / 2; lat0 = c + half; lat1 = c - half; }
    const VW = 1000, VH = (VW * (lat0 - lat1)) / (lon1 - lon0);
    const proj = (lat, lon) => [((lon - lon0) / (lon1 - lon0)) * VW, ((lat0 - lat) / (lat0 - lat1)) * VH];
    const cell = (W.step / (lon1 - lon0)) * VW;

    const visited = new Set(t.trips.map((x) => x.country));
    const canvas = wrap.querySelector('canvas');
    const svg = wrap.querySelector('svg');
    const tip = wrap.querySelector('.map__tip');
    const readout = wrap.querySelector('.map__readout');
    const ctx = canvas.getContext('2d');
    wrap.style.aspectRatio = `${VW} / ${VH}`;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

    // Decode runs → dots inside the view
    const dots = [];
    for (let i = 0; i < W.runs.length; i += 4) {
      const r = W.runs[i], c = W.runs[i + 1], len = W.runs[i + 2], name = W.countries[W.runs[i + 3]];
      const lat = W.top - r * W.step;
      if (lat > lat0 + 1 || lat < lat1 - 1) continue;
      for (let k = 0; k < len; k++) {
        const lon = -180 + W.step / 2 + (c + k) * W.step;
        if (lon < lon0 - 1 || lon > lon1 + 1) continue;
        const [x, y] = proj(lat, lon);
        dots.push([x, y, name, Math.random()]);
      }
    }

    let active = -1, reveal = reduced ? 1 : 0;
    const clist = clusters(t, proj, 26);
    const clusterOf = (i) => clist.findIndex((c) => c.items.includes(i));

    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      const s = (w / VW) * dpr;
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.clearRect(0, 0, VW, VH);
      const activeCountry = active >= 0 ? t.trips[active].country : null;
      const edge = reveal * (VW + 200) - 100;
      const size = cell * 0.62;
      for (const [x, y, name, rnd] of dots) {
        if (x > edge) continue;
        const fade = Math.min(1, (edge - x) / 100);
        // Country fills stay dim (no glow) so the bright pins on top remain readable.
        if (name === activeCountry) { ctx.fillStyle = `rgba(255,0,170,${0.58 * fade})`; ctx.shadowBlur = 0; }
        else if (visited.has(name)) { ctx.fillStyle = `rgba(0,240,255,${0.42 * fade})`; ctx.shadowBlur = 0; }
        else if (name === t.home.country) { ctx.fillStyle = `rgba(255,214,0,${0.58 * fade})`; ctx.shadowBlur = 0; }
        else { ctx.fillStyle = `rgba(120,110,200,${(0.16 + rnd * 0.14) * fade})`; ctx.shadowBlur = 0; }
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
      ctx.shadowBlur = 0;
    }

    // Arcs + pins (SVG overlay), one per cluster
    const [hx, hy] = proj(t.home.lat, t.home.lon);
    const arcs = clist.map((c, ci) => {
      const dx = c.x - hx, dy = c.y - hy, len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len, ny = dx / len;
      if (ny > 0) { nx = -nx; ny = -ny; }
      const lift = Math.min(len * 0.28, 120);
      return { ci, d: `M${hx},${hy} Q${(hx + c.x) / 2 + nx * lift},${(hy + c.y) / 2 + ny * lift} ${c.x},${c.y}` };
    });
    const names = (c) => c.items.map((i) => t.trips[i].place);

    svg.innerHTML = `
      <defs>
        <linearGradient id="arcGrad" x1="0" x2="1"><stop offset="0" stop-color="#ffd600"/><stop offset=".5" stop-color="#ff00aa"/><stop offset="1" stop-color="#00f0ff"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g class="map__arcs">${arcs.map((a) => `<path class="arc" data-c="${a.ci}" d="${a.d}" pathLength="1" style="--d:${0.5 + a.ci * 0.18}s"/>`).join('')}</g>
      <rect class="comet" width="6" height="6" x="-3" y="-3" filter="url(#glow)"/>
      <g class="pin pin--home" transform="translate(${hx},${hy})"><rect x="-6" y="-6" width="12" height="12" transform="rotate(45)"/><rect class="pin__pulse" x="-8" y="-8" width="16" height="16"/></g>
      ${clist.map((c, ci) => `
        <g class="pin" data-c="${ci}" transform="translate(${c.x},${c.y})" tabindex="0" role="button" aria-label="${esc(names(c).join(', '))}">
          <rect class="pin__pulse" x="-8" y="-8" width="16" height="16" style="animation-delay:${ci * 0.3}s"/>
          <rect class="pin__dot" x="-5" y="-5" width="10" height="10"/>
          ${c.items.length > 1 ? `<text class="pin__count" y="-12" text-anchor="middle">×${c.items.length}</text>` : ''}
          <circle class="pin__hit" r="18"/>
        </g>`).join('')}`;

    const comet = svg.querySelector('.comet');
    const tipAt = (x, y, html, home) => {
      tip.innerHTML = html;
      tip.style.left = `${(x / VW) * 100}%`;
      tip.style.top = `${(y / VH) * 100}%`;
      tip.classList.toggle('is-right', x > VW * 0.78);
      tip.classList.toggle('is-left', x < VW * 0.22);
      tip.classList.toggle('is-home', !!home);
      tip.classList.add('is-on');
    };
    const showCluster = (ci, focus) => {
      const c = clist[ci];
      const tr = t.trips[focus ?? c.items[0]];
      const list = names(c).map((n) => (n === tr.place && c.items.length > 1 ? `<b>${esc(n)}</b>` : esc(n))).join(' · ');
      tipAt(c.x, c.y, `<span class="tip__code">${code(tr.country)}</span>${c.items.length > 1 ? list : `<b>${esc(tr.place)}</b>`}<small>${fmt(km(t.home, tr))} km</small>`);
    };

    svg.addEventListener('pointerover', (e) => {
      const pin = e.target.closest('.pin');
      if (!pin) return;
      if (pin.classList.contains('pin--home')) tipAt(hx, hy, `<span class="tip__code">HOME</span><b>${esc(t.home.place)}</b>`, true);
      else showCluster(+pin.dataset.c);
    });
    svg.addEventListener('pointerout', (e) => {
      if (!e.target.closest('.pin')) return;
      if (active >= 0) showCluster(clusterOf(active), active); else tip.classList.remove('is-on');
    });
    const pick = (pin) => {
      const c = clist[+pin.dataset.c];
      // Clicking a cluster that is already open cycles through its cities.
      const k = c.items.indexOf(active);
      onSelect(k >= 0 ? c.items[(k + 1) % c.items.length] : c.items[0]);
    };
    svg.addEventListener('click', (e) => { const pin = e.target.closest('.pin[data-c]'); if (pin) pick(pin); });
    svg.addEventListener('keydown', (e) => {
      const pin = e.target.closest('.pin[data-c]');
      if (pin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(pin); }
    });

    // HUD readout: live coordinates under the cursor
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const lon = lon0 + ((e.clientX - r.left) / r.width) * (lon1 - lon0);
      const lat = lat0 - ((e.clientY - r.top) / r.height) * (lat0 - lat1);
      readout.textContent = `LAT ${lat.toFixed(2)}  LON ${lon.toFixed(2)}`;
      wrap.style.setProperty('--cx', `${e.clientX - r.left}px`);
      wrap.style.setProperty('--cy', `${e.clientY - r.top}px`);
    });

    let cometStart = 0, onScreen = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(wrap);
    function loop(now) {
      if (!onScreen) { requestAnimationFrame(loop); return; }
      if (reveal < 1) { reveal = Math.min(1, reveal + 0.015); draw(); }
      const path = active >= 0 && svg.querySelector(`.arc[data-c="${clusterOf(active)}"]`);
      if (path && !reduced) {
        const L = path.getTotalLength();
        const p = ((now - cometStart) % 2000) / 2000;
        const pt = path.getPointAtLength(L * (1 - Math.pow(1 - p, 2)));
        comet.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(45)`);
        comet.style.opacity = p < 0.85 ? 1 : (1 - p) / 0.15;
      } else comet.style.opacity = 0;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    addEventListener('resize', draw);
    draw();

    const scroller = wrap.parentElement;
    if (scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = (hx / VW) * scroller.scrollWidth - scroller.clientWidth * 0.35;

    return {
      setActive(i) {
        if (i === active) return;
        active = i;
        cometStart = performance.now();
        const ci = i >= 0 ? clusterOf(i) : -1;
        svg.querySelectorAll('.arc').forEach((p) => p.classList.toggle('is-active', +p.dataset.c === ci));
        svg.querySelectorAll('.pin[data-c]').forEach((p) => p.classList.toggle('is-active', +p.dataset.c === ci));
        if (i >= 0) showCluster(ci, i); else tip.classList.remove('is-on');
        draw();
      },
    };
  }

  // ==========================================================================
  // Page-flip journal (cyberpunk HUD pages)
  // ==========================================================================
  function pages(t, mode) {
    const n = t.trips.length, s = stats(t);
    const yr = (tr) => (tr.year ? ` · ${esc(tr.year)}` : '');
    const corners = '<i class="hud-c hud-c--tl"></i><i class="hud-c hud-c--tr"></i><i class="hud-c hud-c--bl"></i><i class="hud-c hud-c--br"></i>';
    const cover = `
      <div class="pg pg--cover">
        ${corners}
        <div class="cover__top mono"><span>// SYS.TRAVEL</span><span>v2.0</span></div>
        <div class="cover__mid">
          <p class="cover__kicker mono">${esc(LN.data.profile.alias)} presents</p>
          <h3 class="cover__title glitch-text" data-text="EXPLORER.LOG">EXPLORER<span>.LOG</span></h3>
          <div class="cover__bar"><span style="width:${Math.min(100, s.countries * 12)}%"></span></div>
          <p class="cover__meta mono">DEST <b>${pad(s.places)}</b> · REGIONS <b>${pad(s.countries)}</b> · ${fmt(s.km)} KM</p>
        </div>
        <div class="cover__bottom mono"><span class="cover__barcode" aria-hidden="true"></span><span class="cover__hint">[ OPEN &gt; ]</span></div>
      </div>`;
    const stamp = (tr) => `
      <div class="stamp mono" aria-hidden="true"><span>ENTRY</span><b>${esc(code(tr.country))}</b><span>APPROVED</span></div>`;
    const photo = (tr, i) => `
      <div class="pg pg--photo">
        ${corners}
        <div class="pg__bar mono"><span>IMG_${pad(i + 1)}</span><span>${esc(tr.photo.split('/').pop())}</span></div>
        <figure class="holo${tr.photoFit === 'contain' ? ' holo--contain' : ''}">
          <img src="${asset(tr.photo)}" alt="${esc(tr.place)}" loading="lazy" onerror="this.style.visibility='hidden'">
          <figcaption class="mono">${esc(tr.place)}${yr(tr)}</figcaption>
        </figure>
        ${stamp(tr)}
        <span class="pg__num mono">${pad(i * 2 + 1)}</span>
      </div>`;
    const readout = (tr) => {
      const d = km(t.home, tr), v = t.visits?.[tr.country];
      return `
        <dl class="pg__log mono">
          <div><dt>COORD</dt><dd>${coord(tr.lat, tr.lon)}</dd></div>
          <div><dt>DIST</dt><dd>${fmt(d)} km <small>from ${esc(t.home.place)}</small></dd></div>
          <div><dt>HEADING</dt><dd>${heading(t.home, tr)}</dd></div>
          <div><dt>FLIGHT</dt><dd>${flight(d)} <small>est.</small></dd></div>
          ${v ? `<div><dt>VISITS</dt><dd class="hot">×${v} ${esc(tr.country)}</dd></div>` : ''}
        </dl>`;
    };
    const text = (tr, i, withPhoto) => `
      <div class="pg pg--text ${withPhoto ? 'pg--combo' : ''}">
        ${corners}
        ${withPhoto ? `<img class="pg__photo${tr.photoFit === 'contain' ? ' pg__photo--contain' : ''}" src="${asset(tr.photo)}" alt="${esc(tr.place)}" loading="lazy" onerror="this.style.visibility='hidden'">` : ''}
        <div class="pg__bar mono"><span>ENTRY ${pad(i + 1)}/${pad(n)}</span><span class="pg__tag">${esc(code(tr.country))}</span></div>
        <h3 class="pg__place glitch-text" data-text="${esc(tr.place)}">${esc(tr.place)}</h3>
        <div class="pg__country mono">&gt; ${esc(tr.country)}${yr(tr)}</div>
        ${readout(tr)}
        ${tr.title ? `<p class="pg__title">“${esc(tr.title)}”</p>` : ''}
        ${tr.note ? `<p class="pg__note">${esc(tr.note)}</p>` : ''}
        ${tr.tags?.length ? `<div class="tags">${tr.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
        <span class="pg__num mono">${pad(i * 2 + 2)}</span>
      </div>`;
    const end = `
      <div class="pg pg--end">
        ${corners}
        <p class="mono end__sys">&gt; scanning for next destination<span class="end__dots"></span></p>
        <p class="end__title glitch-text" data-text="TO BE CONTINUED">TO BE CONTINUED</p>
        <p class="mono end__sub">NEXT_DEST = <span>???</span></p>
      </div>`;
    const blank = '<div class="pg pg--blank"></div>';

    if (mode === 'spread') {
      const P = [cover];
      t.trips.forEach((tr, i) => P.push(photo(tr, i), text(tr, i, false)));
      P.push(end);
      const leaves = [];
      for (let k = 0; k < P.length; k += 2) leaves.push([P[k], P[k + 1] || blank]);
      return leaves;
    }
    return [cover, ...t.trips.map((tr, i) => text(tr, i, true)), end].map((p) => [p, blank]);
  }

  function createBook(stage, t, onChange) {
    const n = t.trips.length, MAX = n + 1;
    let mode, leaves = [], f = 0, target = 0, stepping = false, zc = 0;

    function build() {
      mode = innerWidth < 760 ? 'single' : 'spread';
      const data = pages(t, mode);
      stage.className = `book-stage book-stage--${mode}`;
      stage.innerHTML = `<div class="book">${data.map(([front, back], k) => `
        <div class="leaf" data-k="${k}">
          <div class="leaf__face leaf__face--front">${front}</div>
          <div class="leaf__face leaf__face--back">${back}</div>
        </div>`).join('')}</div>`;
      leaves = [...stage.querySelectorAll('.leaf')];
      leaves.forEach((l, k) => { l.classList.toggle('is-flipped', k < f); settle(l); });
      position();
    }
    function settle(l) {
      const k = +l.dataset.k;
      l.style.zIndex = l.classList.contains('is-flipped') ? k + 1 : leaves.length - k;
    }
    function position() {
      const book = stage.querySelector('.book');
      book.classList.toggle('is-closed', mode === 'spread' && f === 0);
      book.classList.toggle('is-end', mode === 'spread' && f === MAX);
    }
    function flip(k, on) {
      const l = leaves[k];
      if (!l) return;
      l.style.zIndex = 1000 + ++zc;
      l.classList.add('is-turning');
      l.classList.toggle('is-flipped', on);
      clearTimeout(l._t);
      l._t = setTimeout(() => { l.classList.remove('is-turning'); settle(l); }, reduced ? 0 : 950);
    }
    function step() {
      if (f === target) { stepping = false; return; }
      stepping = true;
      if (target > f) { flip(f, true); f++; } else { f--; flip(f, false); }
      position();
      onChange(f);
      setTimeout(step, reduced ? 0 : 120);
    }
    function go(x) {
      target = Math.max(0, Math.min(MAX, x));
      if (!stepping) step();
    }

    let downX = null, swiped = false;
    stage.addEventListener('pointerdown', (e) => { downX = e.clientX; swiped = false; });
    stage.addEventListener('pointerup', (e) => {
      if (downX === null) return;
      const dx = e.clientX - downX; downX = null;
      if (Math.abs(dx) > 40) { swiped = true; go(target + (dx < 0 ? 1 : -1)); }
    });
    stage.addEventListener('click', (e) => {
      if (swiped) return;
      const r = stage.getBoundingClientRect();
      go(target + ((e.clientX - r.left) / r.width < (mode === 'spread' ? 0.5 : 0.3) ? -1 : 1));
    });
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(target + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(target - 1); }
    });

    let lastMode = null;
    addEventListener('resize', () => {
      const m = innerWidth < 760 ? 'single' : 'spread';
      if (m !== lastMode) { lastMode = m; build(); }
    });
    build(); lastMode = mode;

    return { go, get page() { return target; }, max: MAX };
  }

  // ==========================================================================
  // Mount
  // ==========================================================================
  LN.mountTravel = function (panel, t) {
    LN.data = LN.data || window.SITE_DATA;
    const pager = panel.querySelector('.book-pager__label');
    const chips = [...panel.querySelectorAll('.toc__chip')];

    const map = createMap(panel.querySelector('.map'), t, (i) => {
      book.go(i + 1);
      const stage = panel.querySelector('.book-stage');
      if (stage.getBoundingClientRect().top > innerHeight * 0.6) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const book = createBook(panel.querySelector('.book-stage'), t, (f) => {
      const i = f >= 1 && f <= t.trips.length ? f - 1 : -1;
      map.setActive(i);
      chips.forEach((c) => c.classList.toggle('is-active', +c.dataset.go === f));
      pager.textContent = f === 0 ? 'COVER' : i >= 0 ? `${pad(f)}/${pad(t.trips.length)} · ${t.trips[i].place.toUpperCase()}` : 'END';
    });

    panel.querySelector('[data-book="prev"]').addEventListener('click', () => book.go(book.page - 1));
    panel.querySelector('[data-book="next"]').addEventListener('click', () => book.go(book.page + 1));
    chips.forEach((c) => c.addEventListener('click', () => book.go(+c.dataset.go)));
  };
})();
