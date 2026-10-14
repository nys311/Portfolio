// Interactive micro-effects: cursor glow, card spotlight + tilt, magnetic buttons, typer, counters, lightbox.
(function () {
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow || !finePointer) return;
  let x = -999, y = -999, cx = x, cy = y, running = false;
  // Only animate while the glow is catching up with the pointer.
  function loop() {
    cx += (x - cx) * 0.12; cy += (y - cy) * 0.12;
    glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    running = Math.abs(x - cx) + Math.abs(y - cy) > 0.5;
    if (running) requestAnimationFrame(loop);
  }
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!running) { running = true; requestAnimationFrame(loop); }
  });
}

// Spotlight + subtle 3D tilt for every .card inside root (delegated, so re-renders are free).
function initCards(root) {
  if (!finePointer) return;
  root.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    if (!reduced && card.dataset.tilt !== undefined) {
      card.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg)`;
    }
  });
  root.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.card');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}

function initMagnetic(root) {
  if (!finePointer || reduced) return;
  root.addEventListener('pointermove', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
  });
  root.addEventListener('pointerout', (e) => {
    const btn = e.target.closest('.btn');
    if (btn && !btn.contains(e.relatedTarget)) btn.style.transform = '';
  });
}

function typer(el, phrases) {
  if (!el || !phrases?.length) return;
  const text = el.querySelector('.typer__text');
  if (reduced) { text.textContent = phrases[0]; return; }
  let i = 0, j = 0, deleting = false;
  (function tick() {
    const word = phrases[i];
    j += deleting ? -1 : 1;
    text.textContent = word.slice(0, j);
    let delay = deleting ? 28 : 55 + Math.random() * 40;
    if (!deleting && j === word.length) { deleting = true; delay = 1800; }
    else if (deleting && j === 0) { deleting = false; i = (i + 1) % phrases.length; delay = 350; }
    setTimeout(tick, delay);
  })();
}

function countUp(root) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    if (reduced || !target) { el.textContent = target.toLocaleString('en-US'); return; }
    const start = performance.now(), dur = 1400;
    (function step(now) {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
    })(start);
  });
}

function initLightbox() {
  const box = document.getElementById('lightbox');
  const img = box.querySelector('img');
  const cap = box.querySelector('.lightbox__caption');
  const close = () => { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); };
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) {
      img.src = trigger.dataset.lightbox;
      cap.textContent = trigger.dataset.caption || '';
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
    } else if (e.target === box || e.target.closest('.lightbox__close')) close();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

Object.assign(LN, { initCursorGlow, initCards, initMagnetic, typer, countUp, initLightbox });
})();
