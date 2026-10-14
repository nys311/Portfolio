// Renders each page's main section from SITE_DATA (assets/data/*.js).
(function () {
const icon = LN.icon;

// ---------- helpers ----------
const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Allow http(s) and mailto; site-relative paths (assets/...) are prefixed with the page's root.
const safeUrl = (u = '') => {
  u = String(u || '').trim();
  if (/^(https?:|mailto:)/i.test(u)) return esc(u);
  if (/^assets\//i.test(u)) return esc(LN.root + u);
  return '';
};
const nav = (page) => `href="${LN.href(page)}" data-nav="${page}"`;
const pad = (n) => String(n).padStart(2, '0');
const filled = (arr) => (arr || []).filter((l) => l && l.url);

let i = 0; // stagger index for .reveal elements, reset per panel
let ioMode = false; // below-the-fold sections reveal on scroll (IntersectionObserver) instead of on page load
const rv = () => (ioMode ? 'io' : `reveal" style="--i:${i++}`);

const head = (eyebrow, title, sub) => `
  <header class="section-head">
    <p class="eyebrow ${rv()}">${eyebrow}</p>
    <h2 class="section-title ${rv()}">${title}</h2>
    ${sub ? `<p class="section-sub ${rv()}">${sub}</p>` : ''}
  </header>`;

const tags = (list) => (list?.length ? `<div class="tags">${list.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '');

const links = (list, primaryFirst = true) => {
  const items = filled(list);
  if (!items.length) return '';
  return `<div class="links">${items.map((l, k) => `
    <a class="btn ${primaryFirst && k === 0 ? 'btn--primary' : 'btn--ghost'} btn--sm" href="${safeUrl(l.url)}" target="_blank" rel="noopener">
      ${esc(l.label || 'Open')} ${icon('external')}
    </a>`).join('')}</div>`;
};

const imgTag = (src, alt, cls = '') => `<img class="${cls}" src="${safeUrl(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.closest('[data-fallback]')?.classList.add('img-missing'); this.remove()">`;

// ---------- HOME ----------
// Keyword pills spread evenly around an orbit ring; each pill counter-rotates so the text stays upright.
const PILL_COLORS = ['var(--cyan)', 'var(--pink)', 'var(--violet)', 'var(--amber)', '#34d399'];
let pillN = 0;
const orbitRing = (inset, dur, words, extra, offsetDeg = 0, dashed = false) => `
  <div class="orbit-system__ring${dashed ? ' orbit-system__ring--dashed' : ''}" style="--inset:${inset}%;--dur:${dur}s">${extra}
    ${words.map((w, k) => {
      const a = ((offsetDeg + (360 / words.length) * k) * Math.PI) / 180;
      return `<i class="label" style="left:${(50 + 50 * Math.sin(a)).toFixed(2)}%;top:${(50 - 50 * Math.cos(a)).toFixed(2)}%;--c:${PILL_COLORS[pillN++ % PILL_COLORS.length]}"><span>${esc(w)}</span></i>`;
    }).join('')}
  </div>`;

function renderHome(d) {
  i = 0;
  pillN = 0;
  const p = d.profile;
  const kw = { orbit: p.keywords?.orbit || [] };
  const stats = [
    { n: d.publications.length, l: 'Publications' },
    { n: d.research.length, l: 'Research' },
    { n: d.talks.length, l: 'Talks' },
    { n: d.awards.length, l: 'Awards' },
  ];
  return `
  <div class="hero">
    <div class="hero__copy">
      <p class="eyebrow ${rv()}">Mission control // ${esc(p.location || 'Earth')}</p>
      <p class="hero__hello ${rv()}">Hello, universe — I'm</p>
      <h1 class="hero__name ${rv()}"><span class="grad">${esc(p.name)}</span></h1>
      <div class="hero__alias ${rv()}">aka <span class="glitch" data-text="${esc(p.alias)}">${esc(p.alias)}</span></div>
      <div class="${rv()}"><span class="hero__role"><span class="pulse"></span>${esc(p.role)}</span></div>
      <p class="typer ${rv()}" id="typer"><span class="typer__text"></span><span class="typer__caret"></span></p>
      <div class="hero__ctas ${rv()}">
        <a class="btn btn--primary" ${nav('research')}>Explore my work ${icon('arrow')}</a>
        <a class="btn btn--ghost" ${nav('contact')}>Get in touch</a>
      </div>
      <div class="stats ${rv()}">
        ${stats.map((s) => `<div class="stat"><div class="stat__value grad" data-count="${s.n}">0</div><div class="stat__label">${s.l}</div></div>`).join('')}
      </div>
    </div>

    <div class="${rv()}">
      <div class="orbit-system">
        ${orbitRing(0, 48, kw.orbit, '<i style="--c:var(--cyan)"></i>', 20)}
        <div class="orbit-system__ring orbit-system__ring--dashed" style="--inset:5%;--dur:26s"><i style="--c:var(--pink)"></i><i class="sm" style="--c:var(--amber)"></i></div>
        <div class="orbit-system__ring" style="--inset:10%;--dur:18s"><i class="sm" style="--c:var(--violet)"></i></div>
        <div class="avatar" data-fallback>${imgTag(p.avatar, p.name)}</div>
        <span class="planet"></span>
      </div>
    </div>
  </div>

  ${belowFold(d)}`;
}

// About + crew sections shown under the hero on the home page.
// The home page is a single long scroll through every section; each id matches its page id
// so the tab bar can scroll to it (and /#research style deep links work).
function belowFold(d) {
  ioMode = true;
  const sections = [
    ['about', renderAbout],
    ['crew', d.about.team?.length ? renderCrew : null],
    ['research', renderResearch],
    ['publications', renderPublications],
    ['speaking', renderTalks],
    ['projects', renderProjects],
    ['awards', renderAwards],
    ['travel', d.travel?.trips?.length ? renderTravel : null],
    ['contact', renderContact],
  ];
  const html = sections.filter(([, fn]) => fn).map(([id, fn]) => `<section class="home-section" id="${id}">${fn(d)}</section>`).join('');
  ioMode = false;
  return html;
}

// ---------- CREW (AILAB team photos) ----------
function renderCrew(d) {
  const team = [...d.about.team].sort((a, b) => (b.year || 0) - (a.year || 0));
  return `
  ${head('Crew // AILAB', `The <span class="grad">AILAB</span> crew`, 'The people I research, break and ship AI with at Viettel Cyber Security.')}
  <div class="crew">
    ${team.map((t) => `
      <figure class="card crew__card ${rv()}">
        <button class="crew__photo" data-fallback data-lightbox="${safeUrl(t.photo)}" data-caption="${esc(`${t.title} — ${t.caption || ''}`)}">${imgTag(t.photo, t.title)}</button>
        <figcaption>
          <span class="crew__year grad">${esc(t.year)}</span>
          <span class="crew__text"><b>${esc(t.title)}</b>${t.caption ? `<small class="mono">${esc(t.caption)}</small>` : ''}</span>
        </figcaption>
      </figure>`).join('')}
  </div>`;
}

// ---------- ABOUT ----------
function renderAbout(d) {
  i = 0;
  const p = d.profile, a = d.about;
  return `
  ${head('01 // About', `Exploring where <span class="grad">AI meets security</span>`)}
  <div class="about-grid">
    <article class="card about-bio ${rv()}">
      ${p.bio.map((t) => `<p>${esc(t)}</p>`).join('')}
      <div class="about-meta">
        <div>${icon('briefcase')} ${esc(p.role)}</div>
        ${p.location ? `<div>${icon('map')} ${esc(p.location)}</div>` : ''}
      </div>
    </article>

    <div style="display:grid;gap:20px">
      <article class="card ${rv()}">
        <h3 class="card-title">${icon('grad')} Education</h3>
        ${a.education.map((e) => `
          <div class="edu">
            <h4>${esc(e.degree)}</h4>
            <p>${esc(e.school)}</p>
            ${e.period ? `<p class="mono">${esc(e.period)}</p>` : ''}
            ${e.desc ? `<p>${esc(e.desc)}</p>` : ''}
          </div>`).join('')}
      </article>
      <article class="card ${rv()}">
        <h3 class="card-title">${icon('briefcase')} Trajectory</h3>
        <div class="timeline">
          ${a.experience.map((x) => `
            <div class="timeline__item">
              <span class="timeline__dot ${x.current ? 'is-current' : ''}"></span>
              <h4>${esc(x.role)}${x.period ? `<span class="timeline__period">${esc(x.period)}</span>` : ''}</h4>
              <div class="timeline__org">${x.url ? `<a href="${safeUrl(x.url)}" target="_blank" rel="noopener">${esc(x.org)} ${icon('external')}</a>` : esc(x.org)}</div>
              ${x.desc ? `<p>${esc(x.desc)}</p>` : ''}
              ${filled(x.links).length ? `<div class="timeline__links">${filled(x.links).map((l) => `<a href="${safeUrl(l.url)}" target="_blank" rel="noopener">${icon('book')} ${esc(l.label)}</a>`).join('')}</div>` : ''}
            </div>`).join('')}
        </div>
      </article>
    </div>
  </div>

  <div class="focus-grid">
    ${p.focus.map((f) => `
      <article class="card ${rv()}" data-tilt>
        <div class="icon-wrap">${icon(f.icon)}</div>
        <div><h4>${esc(f.title)}</h4><p>${esc(f.desc)}</p></div>
      </article>`).join('')}
  </div>`;
}

// ---------- RESEARCH ----------
const terminalVisual = (r) => `
  <div class="term">
    <div class="term__bar"><span></span><span></span><span></span></div>
    <div class="term__body"><span class="p">$</span> redteam --model gpt-oss-20b
<span class="g">[+]</span> target loaded
<span class="p">$</span> probe --vector "simple prompt"
<span class="w">[!]</span> tool call issued without guardrail
<span class="r">[x]</span> inappropriate tool use detected
<span class="p">$</span> writeup --publish
<span class="g">[✓]</span> ${esc(r.venue)}</div>
  </div>`;

function renderResearch(d) {
  i = 0;
  const badges = (r) => `<span class="badge badge--cyan">${esc(r.type)}</span> ${r.year ? `<span class="badge">${esc(r.year)}</span>` : ''}`;
  // Small slide cover that downloads the PDF (same pattern as the Speaking page).
  const slidesThumb = (sl, title) => `
    <a class="thumb thumb--slides research-row__thumb" href="${safeUrl(sl.pdf)}" download="${esc(sl.pdf.split('/').pop())}" title="Download slides (PDF)">
      ${imgTag(sl.cover, `${title} — slides`)}
      <span class="thumb__badge mono">${icon('download')} PDF</span>
    </a>`;
  const slidesBtn = (sl) => `<a class="btn btn--primary btn--sm" href="${safeUrl(sl.pdf)}" download="${esc(sl.pdf.split('/').pop())}">${icon('download')} ${esc(sl.label || 'Slides (PDF)')}</a>`;

  const item = (r) => r.featured ? `
    <article class="card feature ${rv()}">
      <div class="feature__visual" data-fallback>${r.image ? imgTag(r.image, r.title) : terminalVisual(r)}</div>
      <div class="feature__body">
        ${badges(r)}
        <h3>${esc(r.title)}</h3>
        <div class="feature__venue">${esc(r.venue)}</div>
        <p>${esc(r.description)}</p>
        ${tags(r.tags)}
        ${links(r.links)}
      </div>
    </article>` : `
    <article class="card research-row ${rv()}">
      <div class="research-row__body">
        ${badges(r)}
        <h3>${esc(r.title)}</h3>
        <div class="feature__venue">${esc(r.venue)}</div>
        <p>${esc(r.description)}</p>
        ${tags(r.tags)}
        ${r.slides?.pdf || filled(r.links).length ? `<div class="links">${r.slides?.pdf ? slidesBtn(r.slides) : ''}${filled(r.links).map((l) => `<a class="btn btn--ghost btn--sm" href="${safeUrl(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ${icon('external')}</a>`).join('')}</div>` : ''}
      </div>
      ${r.slides?.pdf ? slidesThumb(r.slides, r.title) : ''}
    </article>`;

  return `
  ${head('02 // Research', `Breaking models <span class="grad">to make them safer</span>`, 'Red-teaming and AI-safety work on large language models and agentic systems.')}
  <div class="research-list">${d.research.map(item).join('')}</div>`;
}

// ---------- PUBLICATIONS ----------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Bold the site owner's name in author lists (matches "Thuy Hang Nguyen" / "Nguyen Thuy Hang").
const highlightMe = (authors) => esc(authors).replace(/(Thuy Hang Nguyen|Nguyen Thuy Hang|Thuy Hang)/, '<b class="me">$1</b>');
function renderPublications(d) {
  i = 0;
  // Newest first; numbered bottom-up so the oldest paper is 01 and new papers get the next number on top.
  const when = (x) => (x.year || 0) * 12 + (x.month || 0);
  const pubs = [...d.publications].sort((a, b) => when(b) - when(a));
  return `
  ${head('03 // Publications', `Peer-reviewed <span class="grad">papers</span>`, 'Research in computer vision and deep learning.')}
  <div class="pubs">
    <div class="slot ${rv()}">
      <span class="slot__orb"></span>
      <div><b>Paper ${pad(pubs.length + 1)} — next in orbit…</b></div>
    </div>
    ${pubs.map((p, k) => `
      <article class="card pub ${rv()}">
        <div class="pub__index">${pad(pubs.length - k)}</div>
        <div>
          <span class="badge badge--pink">${esc(p.type)}</span>${p.citations ? ` <span class="badge badge--amber">Cited by ${esc(p.citations)}</span>` : ''}
          <h3>${esc(p.title)}</h3>
          <div class="pub__venue">${esc(p.venue)}</div>
          ${p.authors ? `<div class="pub__authors">${highlightMe(p.authors)}</div>` : ''}
          <p>${esc(p.summary)}</p>
          ${tags(p.tags)}${links(p.links)}
        </div>
        <div class="pub__year">${p.year ? `${p.month ? `${MONTHS[p.month - 1]} ` : ''}${esc(p.year)}` : '—'}</div>
      </article>`).join('')}
  </div>`;
}

// ---------- TALKS ----------
function renderTalks(d) {
  i = 0;
  const talks = [...d.talks].sort((a, b) => (b.year || 0) - (a.year || 0));
  return `
  ${head('04 // Speaking', `On stage at <span class="grad">security conferences</span>`, 'Sharing research and hands-on experience with the security community.')}
  <div class="timeline talks">
    ${talks.map((t) => `
      <div class="timeline__item ${rv()}">
        <span class="timeline__dot"></span>
        <article class="card talk">
          <div>
            <span class="badge badge--amber">${icon('mic')} ${esc(t.role || 'Speaker')}</span>
            <h3>${esc(t.event)}</h3>
            <div class="talk__loc">${icon('map')} ${esc(t.location)}</div>
            <p class="talk__title ${t.title ? '' : 'is-empty'}">${t.title ? `“${esc(t.title)}”` : 'Talk title — add in talks.js'}</p>
            ${t.coSpeakers ? `<p class="talk__co mono">${esc(t.coSpeakers)}</p>` : ''}
            ${t.description ? `<p>${esc(t.description)}</p>` : ''}
            ${t.images?.length || !t.slides?.pdf ? `<div class="thumbs">
              ${t.images?.length
                ? t.images.map((src) => `<button class="thumb" data-lightbox="${safeUrl(src)}" data-caption="${esc(`${t.event} ${t.year} — ${t.location}`)}">${imgTag(src, t.event)}</button>`).join('')
                : '<span class="thumb thumb--empty">+ add photos<br>img/talks/</span>'}
            </div>` : ''}
            ${links(t.links)}
          </div>
          <div class="talk__side">
            <div class="talk__year grad">${esc(t.year)}</div>
            ${t.slides?.pdf ? `
              <a class="talk__slides" href="${safeUrl(t.slides.pdf)}" download="${esc(t.slides.pdf.split('/').pop())}" title="Download slides (PDF)">
                <span class="thumb thumb--slides">${imgTag(t.slides.cover, `${t.title || t.event} — slides`)}<span class="thumb__badge mono">${icon('download')} PDF</span></span>
                <span class="talk__slides-label mono">${esc(t.slides.label || 'Download slides')}</span>
              </a>` : ''}
          </div>
        </article>
      </div>`).join('')}
  </div>`;
}

// ---------- PROJECTS ----------
function renderProjects(d) {
  i = 0;
  return `
  ${head('05 // Projects', `Things I'm <span class="grad">building</span>`)}
  <div style="display:grid;gap:24px">
    ${d.projects.map((p, k) => {
      const shots = [p.cover, ...(p.gallery || [])].filter(Boolean);
      return `
      <article class="card project ${rv()}" data-project="${k}">
        <div>
          <div class="project__stage" data-fallback data-lightbox="${safeUrl(shots[0] || '')}" data-caption="${esc(p.name)}">
            ${shots[0] ? imgTag(shots[0], p.name) : ''}
          </div>
          ${shots.length > 1 ? `<div class="project__strip">${shots.map((s, n) => `
            <button class="${n === 0 ? 'is-active' : ''}" data-shot="${safeUrl(s)}" aria-label="Show image ${n + 1}">${imgTag(s, `${p.name} ${n + 1}`)}</button>`).join('')}</div>` : ''}
        </div>
        <div class="project__body">
          <div><span class="badge badge--cyan">${icon('dice')} ${esc(p.status)}</span></div>
          <h3 class="project__name grad">${esc(p.name)}</h3>
          <div class="project__sub">${esc(p.subtitle)}</div>
          <p>${esc(p.description)}</p>
          ${tags(p.tags)}${links(p.links)}
        </div>
      </article>`;
    }).join('')}
  </div>`;
}

// ---------- AWARDS ----------
function renderAwards(d) {
  i = 0;
  return `
  ${head('06 // Awards', `Milestones <span class="grad">along the way</span>`)}
  <div class="awards">
    ${d.awards.map((a) => `
      <article class="card award ${rv()}" data-tilt>
        ${a.image ? `<button class="award__photo" data-fallback data-lightbox="${safeUrl(a.image)}" data-caption="${esc(a.title)}">${imgTag(a.image, a.title)}</button>` : ''}
        <div class="award__icon">${icon(a.icon)}</div>
        <h3>${esc(a.title)}</h3>
        <div class="award__org">${esc(a.org)}${a.year ? ` · ${esc(a.year)}` : ''}</div>
        ${a.description ? `<p>${esc(a.description)}</p>` : ''}
        <div class="award__bg">${icon(a.icon)}</div>
      </article>`).join('')}
  </div>`;
}

// ---------- TRAVEL ----------
function renderTravel(d) {
  i = 0;
  const t = d.travel, s = LN.travel.stats(t);
  const stats = [
    { n: s.places, l: 'Destinations' },
    { n: s.countries, l: 'Countries / regions' },
    { n: Math.round(s.km), l: 'km from home' },
  ];
  return `
  ${head('07 // Travel', `Explorer <span class="grad">log</span>`, 'Beyond the lab — places I have landed. Tap a glowing point on the map or flip through the journal.')}
  <div class="travel-stats ${rv()}">
    ${stats.map((x) => `<div class="stat"><div class="stat__value grad" data-count="${x.n}">0</div><div class="stat__label">${x.l}</div></div>`).join('')}
    <div class="stat"><div class="stat__value stat__value--text">${esc(s.farthest)}</div><div class="stat__label">Farthest</div></div>
    ${s.top ? `<div class="stat"><div class="stat__value stat__value--text stat__value--hot">${esc(s.top)}</div><div class="stat__label">Most visited</div></div>` : ''}
  </div>
  <div class="card map-card ${rv()}">
    <div class="map-scroll">
      <div class="map">
        <canvas aria-hidden="true"></canvas>
        <svg role="img" aria-label="World map of visited places"></svg>
        <div class="map__scan" aria-hidden="true"></div>
        <div class="map__cross" aria-hidden="true"></div>
        <div class="map__readout mono" aria-hidden="true">LAT --.--  LON ---.--</div>
        <div class="map__tip mono"></div>
      </div>
    </div>
    <div class="map__legend mono">
      <span><i class="lg lg--home"></i>home · ${esc(t.home.place)}</span>
      <span><i class="lg lg--visit"></i>visited</span>
      <span><i class="lg lg--active"></i>on the page</span>
      <span><i class="lg lg--cluster">×n</i>cities grouped — click again to cycle</span>
    </div>
  </div>
  <div class="journal ${rv()}">
    <div class="book-stage" tabindex="0" aria-label="Travel journal — use arrow keys to flip"></div>
    <div class="book-pager">
      <button class="btn btn--ghost btn--sm" data-book="prev" aria-label="Previous page">‹ Prev</button>
      <span class="book-pager__label mono">COVER</span>
      <button class="btn btn--ghost btn--sm" data-book="next" aria-label="Next page">Next ›</button>
    </div>
    <div class="toc">
      <button class="toc__chip is-active" data-go="0">COVER</button>
      ${t.trips.map((tr, k) => `<button class="toc__chip" data-go="${k + 1}">${esc(tr.place)}</button>`).join('')}
    </div>
  </div>`;
}

// ---------- CONTACT ----------
function renderContact(d) {
  i = 0;
  const p = d.profile;
  const socials = [...(p.email ? [{ label: 'Email', url: `mailto:${p.email}`, icon: 'mail', handle: p.email }] : []), ...p.socials];
  return `
  ${head('08 // Contact', `Let's <span class="grad">connect</span>`)}
  <div class="contact">
    <article class="card ${rv()}">
      <p class="contact__big">Open to research collaborations, talks & <span class="grad">CTF chaos</span>.</p>
      <div class="socials">
        ${socials.map((s) => `
          <a class="social ${s.url ? '' : 'is-empty'}" href="${safeUrl(s.url) || '#'}" ${s.url?.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
            ${icon(s.icon)}<span>${esc(s.label)}</span><small>${s.url ? esc(s.handle || 'open') : 'add url'}</small>${icon('arrow')}
          </a>`).join('')}
      </div>
    </article>
    <article class="card contact__term ${rv()}">
      <div class="term">
        <div class="term__bar"><span></span><span></span><span></span></div>
        <div class="term__body"><span class="p">littlenys@ailab</span>:~$ whoami
${esc(p.name)} (${esc(p.alias)})
<span class="p">littlenys@ailab</span>:~$ cat role.txt
${esc(p.role)}
<span class="p">littlenys@ailab</span>:~$ ls interests/
${p.focus.map((f) => `<span class="g">${esc(f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}/</span>`).join('  ')}
<span class="p">littlenys@ailab</span>:~$ ping collaboration
<span class="w">PONG</span> — always happy to talk.
<span class="p">littlenys@ailab</span>:~$ <span class="typer__caret"></span></div>
      </div>
    </article>
  </div>`;
}

LN.renderers = {
  home: renderHome,
  research: renderResearch,
  publications: renderPublications,
  speaking: renderTalks,
  projects: renderProjects,
  awards: renderAwards,
  travel: renderTravel,
  contact: renderContact,
};
})();
