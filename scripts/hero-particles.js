(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var hero = document.querySelector('.signal-hero');
  if (!hero) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'hero-particles-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  var mouseX = -9999, mouseY = -9999;
  var particles = [];
  var COUNT = 90;
  var running = true;

  /* Heat palette: blue → cyan → orange → amber */
  var PALETTE = [
    [37, 99, 168, 0.7],
    [101, 214, 201, 0.65],
    [208, 98, 44, 0.6],
    [246, 200, 95, 0.55],
    [143, 127, 255, 0.5],
  ];

  function resize() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function pickColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }

  function spawn(randomX) {
    var c = pickColor();
    return {
      x: randomX ? Math.random() * W : -8,
      y: Math.random() * H,
      vx: 0.25 + Math.random() * 0.55,
      vy: (Math.random() - 0.5) * 0.28,
      r: 1.4 + Math.random() * 2.2,
      cr: c[0], cg: c[1], cb: c[2], ca: c[3],
      age: randomX ? Math.floor(Math.random() * 300) : 0,
      maxAge: 280 + Math.floor(Math.random() * 380),
    };
  }

  function init() {
    resize();
    for (var i = 0; i < COUNT; i++) particles.push(spawn(true));

    window.addEventListener('resize', function () {
      resize();
    });

    hero.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
      mouseX = -9999; mouseY = -9999;
    });

    /* Pause when tab is hidden */
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) loop();
    });

    loop();
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      /* gentle turbulence */
      p.vx += (Math.random() - 0.5) * 0.012;
      p.vy += (Math.random() - 0.5) * 0.022;
      p.vx = p.vx < 0.08 ? 0.08 : p.vx > 1.6 ? 1.6 : p.vx;
      p.vy = p.vy < -0.9 ? -0.9 : p.vy > 0.9 ? 0.9 : p.vy;

      /* mouse repulsion */
      var dx = p.x - mouseX, dy = p.y - mouseY;
      var d2 = dx * dx + dy * dy;
      if (d2 < 8100 && d2 > 0) {
        var d = Math.sqrt(d2);
        var f = (90 - d) / 90 * 0.55;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      if (p.x > W + 20 || p.age > p.maxAge) {
        particles[i] = spawn(false);
        particles[i].y = Math.random() * H;
        continue;
      }

      var t = p.age / p.maxAge;
      var alpha = (t < 0.12 ? t / 0.12 : t > 0.82 ? (1 - t) / 0.18 : 1) * p.ca * 0.6;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + p.cr + ',' + p.cg + ',' + p.cb + ',' + alpha + ')';
      ctx.fill();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
