// Bootstrapper shared by every page.
// Each page's HTML only includes this script with data-page / data-root;
// it builds the common shell (background, header, footer), then loads data + app scripts.
// Uses classic <script> tags (not ES modules / fetch) so the site also works when opened via file://.
(function () {
  var me = document.currentScript;
  var ROOT = me.getAttribute('data-root') || './';
  var PAGE = me.getAttribute('data-page') || 'home';
  var isFile = location.protocol === 'file:';

  // [id, label, path]  → URL = ROOT + path
  var PAGES = [
    ['home', 'Home', ''],
    ['research', 'Research', 'research/'],
    ['publications', 'Publications', 'publications/'],
    ['speaking', 'Speaking', 'speaking/'],
    ['projects', 'Projects', 'projects/'],
    ['awards', 'Awards', 'awards/'],
    ['travel', 'Travel', 'travel/'],
    ['contact', 'Contact', 'contact/'],
  ];

  var DATA = ['profile', 'about', 'research', 'publications', 'talks', 'projects', 'awards', 'travel'];
  var LIBS = ['icons', 'starfield', 'effects', 'render']
    .concat(PAGE === 'travel' || PAGE === 'home' ? ['worldmap-data', 'travel'] : [])
    .concat(['app']);

  function href(id) {
    var p = PAGES.filter(function (x) { return x[0] === id; })[0];
    // On file:// a folder URL shows a directory listing, so point at index.html explicitly.
    return ROOT + (p ? p[2] : '') + (isFile ? 'index.html' : '');
  }

  function store(key, val) {
    try {
      if (val === undefined) return sessionStorage.getItem(key);
      if (val === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  window.LN = { root: ROOT, page: PAGE, pages: PAGES, href: href, store: store, isFile: isFile };

  // About now lives on the home page; keep /about/ working as a redirect.
  if (PAGE === 'about') { location.replace(href('home') + '#about'); return; }

  var firstVisit = !store('ln-booted');

  var shell =
    '<canvas id="starfield" aria-hidden="true"></canvas>' +
    '<div class="nebula" aria-hidden="true"><span class="nebula__blob nebula__blob--1"></span><span class="nebula__blob nebula__blob--2"></span><span class="nebula__blob nebula__blob--3"></span></div>' +
    '<div class="grain" aria-hidden="true"></div><div class="cursor-glow" aria-hidden="true"></div>' +
    (firstVisit
      ? '<div class="loader" id="loader" role="status"><div class="loader__orbit"><span></span></div><p class="loader__text mono">initializing<span class="loader__dots"></span></p></div>'
      : '') +
    '<header class="topbar">' +
      '<a class="brand" href="' + href('home') + '" data-nav="home" aria-label="Home"><span class="brand__mark">LN</span>' +
      '<span class="brand__text"><b>LittleNys</b><small class="mono">/ thuy hang</small></span></a>' +
      '<nav class="tabs" id="tabs" aria-label="Pages">' +
        PAGES.map(function (p) {
          return '<a class="tab' + (p[0] === PAGE ? ' is-active' : '') + '" href="' + href(p[0]) + '" data-nav="' + p[0] + '"' +
            (p[0] === PAGE ? ' aria-current="page"' : '') + '>' + p[1] + '</a>';
        }).join('') +
        '<span class="tabs__indicator" aria-hidden="true"></span>' +
      '</nav>' +
      '<div class="topbar__status mono" aria-hidden="true"><span class="pulse"></span><span id="clock">--:--</span> ICT</div>' +
    '</header>' +
    '<main id="app"><section class="panel" data-panel="' + PAGE + '"></section></main>' +
    '<footer class="footer mono"><span>© ' + new Date().getFullYear() + ' Thuy Hang · LittleNys</span><span class="footer__sep">//</span><span>crafted among the stars ✦</span></footer>' +
    '<div class="lightbox" id="lightbox" aria-hidden="true"><button class="lightbox__close" aria-label="Close">✕</button><img alt=""><p class="lightbox__caption mono"></p></div>';

  document.body.insertAdjacentHTML('afterbegin', shell);

  function hideLoader() {
    var l = document.getElementById('loader');
    if (l) l.classList.add('is-done');
    store('ln-booted', '1');
  }
  // Fail-safe: never leave the loader spinning.
  setTimeout(hideLoader, 4000);

  function fail(msg) {
    hideLoader();
    document.querySelector('.panel').innerHTML =
      '<div class="card error-box"><p class="eyebrow">signal lost</p><h2 class="section-title">Something went <span class="grad">wrong</span></h2>' +
      '<p class="section-sub" style="margin-inline:auto">' + String(msg).replace(/</g, '&lt;') + '</p></div>';
  }
  window.addEventListener('error', function (e) {
    if (!document.querySelector('.panel').children.length) fail(e.message || 'Script error');
  });

  // Load all scripts; async=false keeps execution order (data → libs → app).
  var srcs = DATA.map(function (n) { return 'assets/data/' + n + '.js'; })
    .concat(LIBS.map(function (n) { return 'assets/js/' + n + '.js'; }));
  var left = srcs.length;
  srcs.forEach(function (src) {
    var s = document.createElement('script');
    s.src = ROOT + src;
    s.async = false;
    s.onload = function () {
      if (--left) return;
      try { LN.start(); } catch (e) { console.error(e); fail(e.message); }
      setTimeout(hideLoader, firstVisit ? 500 : 0);
    };
    s.onerror = function () { fail('Could not load ' + src); };
    document.head.appendChild(s);
  });
})();
