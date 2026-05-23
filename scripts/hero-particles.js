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
  var COUNT = 140;
  var running = true;

  var REPEL_RADIUS = 130;
  var CONNECT_DIST = 90;

  /* Heat palette: blue → cyan → orange → amber → purple */
  var PALETTE = [
    [37,  99, 168, 0.75],
    [56, 189, 248, 0.70],
    [101, 214, 201, 0.70],
    [208,  98,  44, 0.65],
    [246, 200,  95, 0.60],
    [143, 127, 255, 0.55],
    [255, 140,  80, 0.60],
  ];

  function resize() {
    var rect = hero.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pickColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }

  function spawn(mode) {
    var c = pickColor();
    var direction = Math.random() < 0.5 ? -1 : 1;
    var edgeSpawn = mode === 'edge';
    return {
      x: edgeSpawn ? (direction > 0 ? -12 : W + 12) : Math.random() * W,
      y: Math.random() * H,
      vx: direction * (0.16 + Math.random() * 0.46),
      vy: (Math.random() - 0.5) * 0.26,
      r:  1.4 + Math.random() * 2.4,
      cr: c[0], cg: c[1], cb: c[2], ca: c[3],
      age: edgeSpawn ? 0 : Math.floor(Math.random() * 320),
      maxAge: 260 + Math.floor(Math.random() * 400),
      burst: false,
    };
  }

  function spawnBurst(x, y) {
    for (var i = 0; i < 14; i++) {
      var angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      var speed = 0.9 + Math.random() * 2.8;
      var c = pickColor();
      particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r:  1.6 + Math.random() * 2.8,
        cr: c[0], cg: c[1], cb: c[2], ca: c[3],
        age: 0,
        maxAge: 55 + Math.floor(Math.random() * 70),
        burst: true,
      });
    }
  }

  function init() {
    resize();
    for (var i = 0; i < COUNT; i++) particles.push(spawn('field'));

    window.addEventListener('resize', resize);

    hero.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
      mouseX = -9999; mouseY = -9999;
    });
    hero.addEventListener('click', function (e) {
      var rect = canvas.getBoundingClientRect();
      spawnBurst(e.clientX - rect.left, e.clientY - rect.top);
    });

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) loop();
    });

    loop();
  }

  function drawCursorGlow() {
    if (mouseX === -9999) return;
    var g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 100);
    g.addColorStop(0,   'rgba(101,214,201,0.10)');
    g.addColorStop(0.4, 'rgba(37,99,168,0.05)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 100, 0, 6.2832);
    ctx.fill();
  }

  function drawConnections() {
    var cd2 = CONNECT_DIST * CONNECT_DIST;
    for (var i = 0; i < particles.length - 1; i++) {
      var a = particles[i];
      var ta = a.age / a.maxAge;
      var aa = ta < 0.12 ? ta / 0.12 : ta > 0.82 ? (1 - ta) / 0.18 : 1;
      if (aa < 0.15) continue;

      for (var j = i + 1; j < particles.length; j++) {
        var b = particles[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > cd2) continue;

        var tb = b.age / b.maxAge;
        var ab = tb < 0.12 ? tb / 0.12 : tb > 0.82 ? (1 - tb) / 0.18 : 1;
        var d = Math.sqrt(d2);
        var lineAlpha = (1 - d / CONNECT_DIST) * Math.min(aa, ab) * 0.22;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(' + a.cr + ',' + a.cg + ',' + a.cb + ',' + lineAlpha + ')';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);

    drawCursorGlow();
    drawConnections();

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];

      /* turbulence */
      p.vx += (Math.random() - 0.5) * 0.013;
      p.vy += (Math.random() - 0.5) * 0.023;

      if (!p.burst) {
        p.vx = p.vx < -1.6 ? -1.6 : p.vx > 1.6 ? 1.6 : p.vx;
        if (Math.abs(p.vx) < 0.08) p.vx = p.vx < 0 ? -0.08 : 0.08;
        p.vy = p.vy < -0.9  ? -0.9  : p.vy > 0.9 ? 0.9 : p.vy;
      }

      /* cursor repulsion */
      var dx = p.x - mouseX, dy = p.y - mouseY;
      var d2 = dx * dx + dy * dy;
      if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 0) {
        var d = Math.sqrt(d2);
        var f = (REPEL_RADIUS - d) / REPEL_RADIUS * 0.92;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      /* retire particles */
      var expired = p.burst
        ? (p.age > p.maxAge)
        : (p.x > W + 30 || p.x < -30 || p.age > p.maxAge);

      if (expired) {
        if (p.burst) {
          particles.splice(i, 1);
        } else {
          particles[i] = spawn(Math.random() < 0.35 ? 'edge' : 'field');
        }
        continue;
      }

      var t = p.age / p.maxAge;
      var alpha = (t < 0.12 ? t / 0.12 : t > 0.82 ? (1 - t) / 0.18 : 1) * p.ca * 0.62;

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
