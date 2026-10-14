// 3D starfield with mouse parallax, shooting stars and a "warp" boost used on tab switch.
LN.createStarfield = function (canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ffffff', '#c4b5fd', '#a5f3fc', '#f5d0fe'];

  let w = 0, h = 0, dpr = 1, stars = [], shooting = [];
  let speed = 0.6, targetSpeed = 0.6;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25); // stars are tiny — a full 2x canvas costs ~3x the raster work for no visible gain
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(520, (w * h) / 3000));
    stars = Array.from({ length: count }, () => spawn(true));
  }

  function spawn(randomZ) {
    return {
      x: (Math.random() - 0.5) * w * 2,
      y: (Math.random() - 0.5) * h * 2,
      z: randomZ ? Math.random() * w : w,
      pz: 0,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      tw: Math.random() * Math.PI * 2,
    };
  }

  function addShootingStar() {
    shooting.push({
      x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.4,
      vx: -(6 + Math.random() * 6), vy: 3 + Math.random() * 3, life: 1,
    });
  }

  function frame(t) {
    speed += (targetSpeed - speed) * 0.06;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    ctx.clearRect(0, 0, w, h);
    const cx = w / 2 + mouse.x * 40, cy = h / 2 + mouse.y * 40;
    const warp = speed > 3;

    for (const s of stars) {
      s.pz = s.z;
      s.z -= speed;
      if (s.z < 1) { Object.assign(s, spawn(false)); s.pz = s.z; continue; }
      const k = 128 / s.z;
      const x = s.x * k * 0.5 + cx, y = s.y * k * 0.5 + cy;
      if (x < -50 || x > w + 50 || y < -50 || y > h + 50) { Object.assign(s, spawn(false)); s.pz = s.z; continue; }
      const size = Math.max(0.3, (1 - s.z / w) * 2.2);
      const twinkle = 0.65 + Math.sin(t * 0.002 + s.tw) * 0.35;
      ctx.globalAlpha = Math.min(1, (1 - s.z / w) * 1.4) * twinkle;
      if (warp) {
        const pk = 128 / s.pz;
        ctx.strokeStyle = s.c; ctx.lineWidth = size;
        ctx.beginPath(); ctx.moveTo(s.x * pk * 0.5 + cx, s.y * pk * 0.5 + cy); ctx.lineTo(x, y); ctx.stroke();
      } else {
        ctx.fillStyle = s.c;
        if (size < 1.3) ctx.fillRect(x - size, y - size, size * 2, size * 2);
        else { ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill(); }
      }
    }

    if (!reduced && Math.random() < 0.004) addShootingStar();
    for (const m of shooting) {
      m.x += m.vx; m.y += m.vy; m.life -= 0.012;
      const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14);
      g.addColorStop(0, `rgba(255,255,255,${m.life})`); g.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 14, m.y - m.vy * 14); ctx.stroke();
    }
    shooting = shooting.filter((m) => m.life > 0);
    ctx.globalAlpha = 1;

    if (!reduced && !document.hidden) requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduced) requestAnimationFrame(frame); });
  addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / innerWidth - 0.5;
    mouse.ty = e.clientY / innerHeight - 0.5;
  });

  resize();
  requestAnimationFrame(frame);

  return {
    warp(duration = 700) {
      if (reduced) return;
      targetSpeed = 22;
      setTimeout(() => { targetSpeed = 0.6; }, duration);
    },
    // Called on the newly loaded page: start at warp speed and ease back down.
    arrive() {
      if (reduced) return;
      speed = 22;
    },
  };
};
