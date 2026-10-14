// Page controller: renders the current page and animates navigation between page paths
// (warp-speed stars + sliding tab indicator carried across page loads).
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TITLES = Object.fromEntries(LN.pages.map(([id, label]) => [id, label]));

  function placeIndicator(tab, animate) {
    const ind = $('.tabs__indicator');
    if (!tab || !ind) return;
    if (!animate) ind.style.transition = 'none';
    ind.style.width = `${tab.offsetWidth}px`;
    ind.style.transform = `translateX(${tab.offsetLeft}px)`;
    if (!animate) { void ind.offsetWidth; ind.style.transition = ''; }
  }

  function centerActiveTab(tab) {
    const tabs = $('#tabs');
    if (tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2;
  }

  // Leave the page with a warp jump, then load the target URL.
  // (The home page also shows every section, but tabs always open the dedicated page.)
  function go(link, starfield) {
    const target = link.dataset.nav;
    if (target === LN.page) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
    LN.store('ln-from', LN.page);
    LN.store('ln-warp', '1');
    placeIndicator($(`.tab[data-nav="${target}"]`), true);
    document.body.classList.add('is-leaving');
    starfield.warp(900);
    setTimeout(() => { location.href = link.href; }, reduced ? 0 : 420);
  }

  function bindGallery() {
    document.addEventListener('click', (e) => {
      const shot = e.target.closest('[data-shot]');
      if (!shot) return;
      const card = shot.closest('.project');
      const stage = $('.project__stage', card);
      const img = $('img', stage);
      stage.dataset.lightbox = shot.dataset.shot;
      $$('[data-shot]', card).forEach((b) => b.classList.toggle('is-active', b === shot));
      if (img) {
        img.style.opacity = 0;
        setTimeout(() => { img.src = shot.dataset.shot; img.style.opacity = 1; }, 200);
      }
    });
  }

  function startClock() {
    const el = $('#clock');
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 1000);
  }

  LN.start = function () {
    const data = window.SITE_DATA;
    LN.data = data;
    const page = LN.renderers[LN.page] ? LN.page : 'home';
    const panel = $('.panel');

    panel.innerHTML = LN.renderers[page](data);
    panel.classList.add('is-active');
    document.title = page === 'home' ? `${data.profile.name} · ${data.profile.alias}` : `${TITLES[page]} · ${data.profile.alias}`;

    const starfield = LN.createStarfield($('#starfield'));

    // Arrival: continue the warp from the previous page and slide the indicator from the old tab.
    const active = $('.tab.is-active');
    const from = LN.store('ln-from');
    centerActiveTab(active);
    placeIndicator(from && $(`.tab[data-nav="${from}"]`) || active, false);
    requestAnimationFrame(() => requestAnimationFrame(() => placeIndicator(active, true)));
    if (LN.store('ln-warp')) starfield.arrive();
    LN.store('ln-warp', null);
    LN.store('ln-from', null);

    // Internal navigation (tabs, brand, CTAs, quick cards).
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-nav]');
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go(link, starfield);
    });
    // Coming back via the back button (bfcache) — undo the leaving state.
    addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      document.body.classList.remove('is-leaving');
      placeIndicator($('.tab.is-active'), false);
    });
    addEventListener('resize', () => placeIndicator($('.tab.is-active'), false));

    // ← / → keys move between pages while focus is in the tab bar.
    $('#tabs').addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const ids = LN.pages.map((p) => p[0]);
      const next = ids[(ids.indexOf(page) + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
      go($(`.tab[data-nav="${next}"]`), starfield);
    });

    // Flag scrolling so CSS can suspend hover effects (see html.is-scrolling).
    let scrollTimer;
    addEventListener('scroll', () => {
      document.documentElement.classList.add('is-scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 160);
    }, { passive: true });

    // Reveal below-the-fold sections as they scroll into view.
    const io = 'IntersectionObserver' in window && !reduced && new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('.io', panel).forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
    // Deep links like /#about scroll to that section once rendered.
    const target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));

    LN.initCursorGlow();
    LN.initLightbox();
    LN.initCards(panel);
    LN.initMagnetic(document.body);
    bindGallery();
    startClock();
    if (page === 'home') LN.typer($('#typer'), data.profile.taglines);
    if ((page === 'travel' || page === 'home') && $('.map', panel)) LN.mountTravel(panel, data.travel);
    LN.countUp(panel);
  };
})();
