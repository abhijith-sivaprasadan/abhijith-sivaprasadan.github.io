/* Control volume: opt-in motion and interaction layer.
 * Activate on any page with <body class="cv"> plus styles/control-volume.css.
 * Physics-true motion only. Everything respects prefers-reduced-motion,
 * sound is opt-in, and every preference is remembered per visitor.
 * No dependencies, no audio files, no network calls.
 */
(function () {
  'use strict';

  var doc = document;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MALAYALAM = '൦൧൨൩൪൫൬൭൮൯';

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }
    return value;
  }
  function session(key, value) {
    try {
      if (value === undefined) return window.sessionStorage.getItem(key);
      window.sessionStorage.setItem(key, value);
    } catch (e) { return null; }
    return value;
  }
  function el(tag, attrs, html) {
    var node = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  /* ---------------- sound (Web Audio synthesis, opt-in) ---------------- */
  var ctx = null;
  var soundOn = store('cv-sound') === '1';
  function audio() {
    if (!soundOn) return null;
    try {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!ctx) ctx = new A();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(freq, dur, type, vol) {
    var ac = audio(); if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    dur = dur || 0.12;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function whoosh() {
    var ac = audio(); if (!ac) return;
    var n = Math.floor(ac.sampleRate * 0.9), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    s.buffer = b; f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(240, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.8);
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t);
  }

  /* ---------------- numerals ---------------- */
  var malayalam = store('cv-ml') === '1';
  function num(value) {
    var text = String(value);
    return malayalam ? text.replace(/[0-9]/g, function (d) { return MALAYALAM[+d]; }) : text;
  }

  /* ---------------- shell overlays ---------------- */
  var ui = {};
  function buildShell(body) {
    ui.rail = el('div', { 'class': 'rail', 'aria-hidden': 'true' },
      '<svg viewBox="0 0 1000 12" preserveAspectRatio="none"><line x1="0" y1="10.5" x2="1000" y2="10.5"></line>' +
      '<path class="rp" pathLength="1000" d="M0 1.5 C110 1.5 150 9 290 9.8 S700 10.4 1000 10.5"></path></svg>');
    ui.heat = el('div', { 'class': 'heat', 'aria-hidden': 'true' });
    ui.probe = el('div', { 'class': 'probe', 'aria-hidden': 'true' }, '<i></i><span></span>');
    ui.sound = el('button', { type: 'button', 'class': 'snd', 'aria-label': 'Toggle sound', 'aria-pressed': String(soundOn) },
      '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M2 7h3l4-3v10l-4-3H2z"></path><path class="sw" d="M12 6.5c1 1.4 1 3.6 0 5M14.5 4.5c2 2.6 2 6.4 0 9"></path></svg><span></span>');
    ui.theme = el('button', { type: 'button', 'class': 'thm', 'aria-label': 'Toggle cold or hot theme' },
      '<svg class="gl gl-therm" viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px"><path d="M10 4a2 2 0 0 1 4 0v10.3a4 4 0 1 1-4 0z"></path><path class="hg" d="M12 9v8" stroke-width="2.4"></path></svg><span></span>');
    ui.cmdBtn = el('button', { type: 'button', 'class': 'cmdbtn', 'aria-label': 'Open the solver console' }, '<span>⌘K</span>CONSOLE');
    ui.frost = el('div', { 'class': 'frost', 'aria-hidden': 'true' });
    [ui.rail, ui.heat, ui.probe, ui.sound, ui.theme, ui.cmdBtn, ui.frost].forEach(function (n) { body.appendChild(n); });
    if (!reduced && !body.hasAttribute('data-cv-no-sweep')) {
      var sweep = el('div', { 'class': 'sweep', 'aria-hidden': 'true' }, '<span></span>');
      sweep.querySelector('span').textContent = body.getAttribute('data-cv-label') || doc.title.split('|')[0].trim().toUpperCase();
      body.appendChild(sweep);
      setTimeout(function () { sweep.remove(); }, 1400);
    }
  }

  /* ---------------- probe cursor + heat blob ---------------- */
  function bindProbe() {
    var x = -999, y = -999, label = '', raf = 0;
    function paint() {
      raf = 0;
      ui.heat.style.transform = 'translate(' + (x - 130) + 'px,' + (y - 130) + 'px)';
      ui.probe.style.transform = 'translate(' + (x + 18) + 'px,' + (y + 20) + 'px)';
      ui.probe.style.opacity = x < 0 ? '0' : '1';
      ui.probe.querySelector('span').textContent = label || ('PROBE · x ' + num(x) + ' · y ' + num(y));
    }
    doc.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      var target = e.target && e.target.closest ? e.target.closest('[data-probe]') : null;
      label = target ? target.getAttribute('data-probe') : '';
      if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { x = y = -999; paint(); });
    doc.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('a,button')) tone(1320, 0.05, 'triangle', 0.03);
    });
  }

  /* ---------------- sound, theme, monsoon ---------------- */
  function setSound(v) {
    soundOn = v; store('cv-sound', v ? '1' : '0');
    ui.sound.setAttribute('aria-pressed', String(v));
    ui.sound.querySelector('span').textContent = v ? 'SOUND ON' : 'SOUND OFF';
    if (v) { tone(523, 0.12); setTimeout(function () { tone(784, 0.18); }, 110); }
    return 'sound ' + (v ? 'on' : 'off');
  }
  var cold = store('cv-theme') === 'cold';
  function setTheme(v) {
    cold = v; store('cv-theme', v ? 'cold' : 'hot');
    ui.frost.classList.toggle('on', v);
    ui.theme.setAttribute('aria-pressed', String(v));
    ui.theme.querySelector('span').textContent = v ? 'COLD' : 'HOT';
    tone(v ? 1568 : 196, 0.5, 'sine', 0.035);
    return 'theme ' + (v ? 'cold' : 'hot');
  }
  function monsoonDefault() { var m = new Date().getMonth(); return m >= 5 && m <= 8; }
  function setRain(v, remember) {
    if (remember) store('cv-rain', v ? '1' : '0');
    if (v && !ui.rain) {
      ui.rain = el('div', { 'class': 'rain', 'aria-hidden': 'true' }, '<i></i><i></i><span>MONSOON · ഇടവപ്പാതി</span>');
      doc.body.appendChild(ui.rain);
      if (remember) whoosh();
    } else if (!v && ui.rain) { ui.rain.remove(); ui.rain = null; }
    return 'monsoon ' + (v ? 'on' : 'off');
  }
  function setMalayalam(v) {
    malayalam = v; store('cv-ml', v ? '1' : '0');
    doc.querySelectorAll('[data-cv-num]').forEach(function (n) { n.textContent = num(n.getAttribute('data-cv-num')); });
    toys.forEach(function (t) { if (t.refresh) t.refresh(); });
    tone(v ? 740 : 494, 0.25);
    return v ? 'malayalam numerals · ൧൨൩' : 'arabic numerals · 123';
  }

  /* ---------------- solver console ---------------- */
  var NAV = [
    ['run thesis', 'projects/siemens-thesis.html', 'the Siemens thesis case'],
    ['open home', 'index.html', 'heat · power · code'],
    ['open cases', 'projects.html', 'project library'],
    ['open lens research', 'research.html', 'research statement'],
    ['open lens energy', 'energy-systems.html', 'energy systems lens'],
    ['open lens industrial', 'industrial-rd.html', 'industrial R&D lens'],
    ['open record', 'experience.html', 'roles'],
    ['open about', 'about.html', 'about'],
    ['open courses', 'courses.html', 'academic record'],
    ['open ideas', 'ideas.html', 'next boundaries'],
    ['open interests', 'interests.html', 'questions I keep returning to'],
    ['open hobbies', 'hobbies.html', 'outside the boundary'],
    ['open demo', 'labs/control-volume.html', 'the control volume layer']
  ];
  var extra = [];
  var base = (doc.body && doc.body.getAttribute('data-cv-root')) || '';
  function commands() {
    var acts = extra.concat([
      ['theme cold', 'frost the page', function () { return setTheme(true); }],
      ['theme hot', 'back to inferno', function () { return setTheme(false); }],
      ['monsoon on', 'Kerala rain · default June to September', function () { return setRain(true, true); }],
      ['monsoon off', 'dry season', function () { return setRain(false, true); }],
      ['sound on', 'opt in to sound', function () { return setSound(true); }],
      ['sound off', 'silence', function () { return setSound(false); }],
      ['malayalam', 'Malayalam numerals · ൧൨൩', function () { return setMalayalam(!malayalam); }],
      ['residual', 'what is never quite done', function () { return 'always > 0'; }]
    ]).map(function (a) { return { cmd: a[0], desc: a[1], run: a[2] }; });
    return acts.concat(NAV.map(function (n) { return { cmd: n[0], desc: n[2], href: base + n[1] }; }));
  }
  function openConsole() {
    if (ui.cmdk) { closeConsole(); return; }
    tone(880, 0.06, 'square', 0.02);
    ui.cmdk = el('div', { 'class': 'cmdk', role: 'dialog', 'aria-label': 'Solver console' },
      '<div class="cmdbox"><div class="cmdhd"><span>SOLVER CONSOLE</span><button type="button" aria-label="Close console">ESC</button></div>' +
      '<label class="cmdin"><span>&gt;</span><input type="text" aria-label="Command" placeholder="run thesis · open lens energy · theme cold"></label>' +
      '<div class="cmdlist"></div><div class="cmdlog">&gt; type a command, or pick one below</div></div>');
    doc.body.appendChild(ui.cmdk);
    var input = ui.cmdk.querySelector('input'), list = ui.cmdk.querySelector('.cmdlist'), log = ui.cmdk.querySelector('.cmdlog');
    function render() {
      var q = input.value.trim().toLowerCase();
      var all = commands().filter(function (c) { return !q || (c.cmd + ' ' + c.desc).toLowerCase().indexOf(q) >= 0; }).slice(0, 9);
      list.innerHTML = '';
      all.forEach(function (c) {
        var item = c.href ? el('a', { 'class': 'cmdit', href: c.href }) : el('button', { 'class': 'cmdit', type: 'button' });
        item.appendChild(el('b')).textContent = c.cmd;
        item.appendChild(el('span')).textContent = c.desc;
        if (c.run) item.addEventListener('click', function () {
          log.textContent = '> ' + c.cmd + ' · ' + c.run() + ' · ok';
          input.value = ''; render(); tone(988, 0.08, 'triangle', 0.03);
        });
        list.appendChild(item);
      });
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var first = list.querySelector('.cmdit'); if (first) first.click(); }
      if (e.key === 'Escape') closeConsole();
    });
    ui.cmdk.addEventListener('click', function (e) { if (e.target === ui.cmdk) closeConsole(); });
    ui.cmdk.querySelector('.cmdhd button').addEventListener('click', closeConsole);
    render();
    input.focus();
  }
  function closeConsole() { if (ui.cmdk) { ui.cmdk.remove(); ui.cmdk = null; ui.cmdBtn.focus(); } }

  /* ---------------- boot sequence (opt-in per page) ---------------- */
  function boot(force) {
    if (reduced) return;
    if (!force && session('cv-boot') === '1') return;
    var overlay = el('div', { 'class': 'boot', role: 'status', 'aria-label': 'Loading' },
      '<div style="width:min(620px,100%);display:flex;flex-direction:column;gap:22px">' +
      '<div style="font-size:12px;letter-spacing:.16em;color:#65d6c9">CONTROL VOLUME · SOLVER v1</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.6;color:#c9cfc6">' +
      '<span class="ln">&gt; mesh loaded · 3 refinement levels</span><span class="ln">&gt; boundary · T = 673 K · P_gauge = 100 kPa</span>' +
      '<span class="ln">&gt; turbulence · k-omega SST</span><span class="ln">&gt; coupling · conjugate heat transfer</span>' +
      '<span class="ln" style="color:#d7b46a">&gt; iterating …</span><span class="ln" style="color:#65d6c9">&gt; residual below tolerance · page converged</span></div>' +
      '<svg viewBox="0 0 520 150" style="width:100%;height:auto;display:block" aria-hidden="true"><line x1="0" y1="140" x2="520" y2="140" stroke="#2d3a31"></line>' +
      '<line x1="0" y1="112" x2="520" y2="112" stroke="#d7b46a" stroke-dasharray="5 5"></line>' +
      '<polyline points="0,8 30,30 60,26 90,52 120,48 150,70 180,74 210,88 240,92 270,104 300,108 330,113 380,117 440,119 520,120" fill="none" stroke="#65d6c9" stroke-width="2"></polyline></svg>' +
      '<button type="button" style="align-self:flex-start;min-height:44px;padding:0 16px;border-radius:6px;border:1px solid #2d3a31;background:transparent;color:#a9b3a8;font:inherit;font-size:11px;letter-spacing:.14em">SKIP →</button></div>');
    doc.body.appendChild(overlay);
    tone(110, 1.6, 'sawtooth', 0.012);
    var done = function () {
      if (!overlay.isConnected) return;
      overlay.classList.add('done'); session('cv-boot', '1');
      tone(659, 0.2); setTimeout(function () { tone(988, 0.35); }, 140);
      setTimeout(function () { overlay.remove(); }, 850);
    };
    var timer = setTimeout(done, 3300);
    overlay.querySelector('button').addEventListener('click', function () { clearTimeout(timer); done(); });
  }

  /* ---------------- toys ---------------- */
  var toys = [];
  function out(root, name) { return root.querySelector('[data-out="' + name + '"]'); }

  function biot(root) {
    var inputs = root.querySelectorAll('input[data-k]');
    function refresh() {
      var v = {};
      inputs.forEach(function (i) { v[i.getAttribute('data-k')] = parseFloat(i.value); var lab = out(root, i.getAttribute('data-k')); if (lab) lab.textContent = num(i.value); });
      var bi = v.h * (v.L / 1000) / v.k, frac = bi / (1 + bi);
      var verdict = 'LUMPED · WALL GRADIENTS NEGLIGIBLE', col = '#65d6c9';
      if (bi >= 0.1 && bi < 1) { verdict = 'GRADIENTS MATTER · RESOLVE THE WALL'; col = '#f98e09'; }
      if (bi >= 1) { verdict = 'CONDUCTION DOMINATES · WALL IS THE STORY'; col = '#bc3754'; }
      var text = bi < 0.01 ? bi.toFixed(4) : bi < 1 ? bi.toFixed(3) : bi.toFixed(2);
      out(root, 'bi').textContent = 'Bi = ' + num(text);
      out(root, 'verdict').textContent = verdict;
      out(root, 'verdict').style.color = col;
      out(root, 'conv').style.flex = String(1 - frac);
      out(root, 'wall').style.flex = String(Math.max(0.006, frac));
      out(root, 'wall').style.background = col;
      out(root, 'needle').style.left = Math.min(100, Math.max(0, (Math.log10(bi) + 4) / 5 * 100)) + '%';
      root.setAttribute('data-probe', 'Bi = ' + text + ' · h = ' + v.h + ' · L = ' + v.L + ' mm · k = ' + v.k);
      return bi;
    }
    inputs.forEach(function (i) { i.addEventListener('input', function () { var bi = refresh(); tone(220 + Math.min(900, Math.log10(bi * 1000 + 1) * 260), 0.06, 'sine', 0.025); }); });
    refresh();
    return { refresh: refresh };
  }

  function heatField(root) {
    var src = el('div', { 'class': 'src' });
    var rings = [0, 1, 2].map(function () { return el('div', { 'class': 'iso' }); });
    rings.forEach(function (r) { root.appendChild(r); });
    root.appendChild(src);
    var readout = doc.querySelector(root.getAttribute('data-readout')) || out(root, 'field');
    var fx = 300, fy = 180, drag = false, px = -1, py = -1;
    function paint() {
      var hot = 'radial-gradient(circle at ' + fx + 'px ' + fy + 'px,rgba(252,255,164,.75) 0,rgba(249,142,9,.5) 50px,rgba(188,55,84,.32) 120px,rgba(87,16,110,.18) 210px,rgba(7,8,7,0) 330px)';
      root.style.backgroundImage = hot + ',linear-gradient(to right,rgba(45,58,49,.6) 1px,transparent 1px),linear-gradient(to bottom,rgba(45,58,49,.6) 1px,transparent 1px)';
      root.style.backgroundSize = 'auto,24px 24px,24px 24px';
      [src].concat(rings).forEach(function (n) { n.style.left = fx + 'px'; n.style.top = fy + 'px'; });
      if (readout) {
        if (px < 0) readout.textContent = 'PROBE · MOVE INTO THE FIELD';
        else { var r = Math.hypot(px - fx, py - fy); readout.textContent = 'PROBE · T = ' + num((293 + 380 * Math.exp(-r / 140)).toFixed(0)) + ' K · r = ' + num((r / 2).toFixed(0)) + ' mm'; }
      }
    }
    function local(e) { var b = root.getBoundingClientRect(); return [Math.round(e.clientX - b.left), Math.round(e.clientY - b.top)]; }
    root.addEventListener('pointerdown', function (e) { var p = local(e); drag = true; fx = px = p[0]; fy = py = p[1]; try { root.setPointerCapture(e.pointerId); } catch (x) {} tone(330, 0.15); paint(); });
    root.addEventListener('pointermove', function (e) { var p = local(e); px = p[0]; py = p[1]; if (drag) { fx = px; fy = py; } paint(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { root.addEventListener(t, function () { drag = false; }); });
    paint();
    return { refresh: paint };
  }

  function mesh(root) {
    var level = 1;
    var names = ['', 'L1 · COARSE', 'L2 · MEDIUM', 'L3 · FINE'];
    var verdicts = ['', 'COARSE · Δ TO NEXT LEVEL STILL LARGE', 'MEDIUM · Δ SHRINKING', 'FINE · DISCRETISATION ERROR BELOW 2 % ON PRESSURE-LOSS COEFFICIENT AND PEAK MACH (THESIS)'];
    var colours = ['', '#f98e09', '#d7b46a', '#65d6c9'];
    function refresh() {
      var sp = [0, 24, 12, 6][level], d = '', inf = '';
      for (var x = 20; x <= 540; x += sp) d += 'M' + x + ' 20V200';
      for (var y = 20; y <= 200; y += sp) d += 'M20 ' + y + 'H540';
      var n = [0, 0, 3, 6][level], g = level === 3 ? 1.6 : 2.6;
      for (var k = 1; k <= n; k++) {
        var o = k * g;
        inf += 'M20 ' + (30 + o) + 'L200 ' + (30 + o) + 'C280 ' + (30 + o) + ' 300 ' + (85 + o) + ' 360 ' + (85 + o) + 'L540 ' + (85 + o);
        inf += 'M20 ' + (190 - o) + 'L200 ' + (190 - o) + 'C280 ' + (190 - o) + ' 300 ' + (135 - o) + ' 360 ' + (135 - o) + 'L540 ' + (135 - o);
      }
      var cells = Math.round(54600 / (sp * sp)) + n * 2 * Math.round(560 / sp);
      out(root, 'mesh').setAttribute('d', d);
      out(root, 'infl').setAttribute('d', inf || 'M0 0');
      out(root, 'cells').textContent = num(cells) + ' SCHEMATIC CELLS';
      out(root, 'verdict').textContent = verdicts[level];
      out(root, 'verdict').style.color = colours[level];
      root.setAttribute('data-probe', names[level] + ' · ' + num(cells) + ' CELLS · ' + num(n) + ' WALL LAYERS');
      root.querySelectorAll('[data-level]').forEach(function (b) {
        var on = +b.getAttribute('data-level') === level;
        b.setAttribute('aria-pressed', String(on));
        b.style.background = on ? '#65d6c9' : 'transparent';
        b.style.color = on ? '#071007' : '#c9cfc6';
        b.style.borderColor = on ? '#65d6c9' : '#2d3a31';
      });
    }
    root.querySelectorAll('[data-level]').forEach(function (b) {
      b.addEventListener('click', function () { level = +b.getAttribute('data-level'); tone([0, 330, 440, 587][level], 0.15, 'triangle', 0.04); refresh(); });
    });
    refresh();
    return { refresh: refresh };
  }

  function year(root) {
    function refresh() {
      var now = new Date(), y0 = new Date(now.getFullYear(), 0, 1);
      var nd = new Date(now.getFullYear(), 1, 29).getMonth() === 1 ? 366 : 365;
      var day = function (dt) { return Math.floor((dt - y0) / 86400000) + 1; };
      var doy = day(now), jun1 = day(new Date(now.getFullYear(), 5, 1)), sep30 = day(new Date(now.getFullYear(), 8, 30));
      var pt = function (dd) { var ph = Math.PI / 2 + 2 * Math.PI * (dd / nd - 0.04); return [270 + 200 * Math.cos(ph), 150 + 105 * Math.sin(ph)]; };
      var arc = function (a, b) { var p = []; for (var dd = a; dd <= b; dd += 2) { var q = pt(dd); p.push(q[0].toFixed(1) + ',' + q[1].toFixed(1)); } return p.join(' '); };
      var here = pt(doy), mid = pt(Math.round((jun1 + sep30) / 2));
      out(root, 'monsoon').setAttribute('points', arc(jun1, sep30));
      out(root, 'done').setAttribute('points', arc(1, doy));
      root.querySelectorAll('[data-out="dot"]').forEach(function (c) { c.setAttribute('cx', here[0].toFixed(1)); c.setAttribute('cy', here[1].toFixed(1)); });
      out(root, 'monlabel').setAttribute('x', (mid[0] - 110).toFixed(0));
      out(root, 'monlabel').setAttribute('y', (mid[1] - 18).toFixed(0));
      var mon;
      if (doy < jun1) mon = 'KERALA MONSOON IN ' + num(jun1 - doy) + ' DAYS';
      else if (doy <= sep30) mon = 'KERALA MONSOON · IN PROGRESS · DAY ' + num(doy - jun1 + 1);
      else mon = 'KERALA MONSOON · NEXT IN ' + num(Math.ceil((new Date(now.getFullYear() + 1, 5, 1) - now) / 86400000)) + ' DAYS';
      out(root, 'day').textContent = 'DAY ' + num(doy) + ' / ' + num(nd);
      out(root, 'pct').textContent = num(Math.round(doy / nd * 100)) + ' % ROUND THE CYCLE · ' + num(now.getFullYear());
      out(root, 'montext').textContent = mon;
      root.setAttribute('data-probe', 'DAY ' + num(doy) + ' · ' + mon);
    }
    refresh();
    setInterval(refresh, 60000);
    return { refresh: refresh };
  }

  function cycle(root) {
    var input = root.querySelector('input[type=range]');
    var pts = [[60, 50], [340, 50], [340, 210], [60, 210], [60, 50]];
    var stages = (root.getAttribute('data-stages') || '').split('|');
    var names = (root.getAttribute('data-names') || '').split('|');
    function refresh() {
      var v = +input.value, seg = Math.min(3, Math.floor(v / 100)), f = (v - seg * 100) / 100;
      var a = pts[seg], b = pts[seg + 1];
      root.querySelectorAll('[data-out="dot"]').forEach(function (c) { c.setAttribute('cx', (a[0] + (b[0] - a[0]) * f).toFixed(1)); c.setAttribute('cy', (a[1] + (b[1] - a[1]) * f).toFixed(1)); });
      out(root, 'title').textContent = v % 100 === 0 ? names[v / 100] : names[seg] + ' → ' + names[seg + 1];
      out(root, 'text').textContent = stages[seg] || '';
    }
    input.addEventListener('input', function () { if (+input.value % 100 === 0) tone([523, 587, 659, 698, 784][+input.value / 100], 0.18); refresh(); });
    refresh();
    return { refresh: refresh };
  }

  function lamp(button) {
    var tpl = doc.getElementById(button.getAttribute('data-cv-lamp') || 'cv-night');
    if (!tpl) return null;
    button.addEventListener('click', function () {
      var node = tpl.content.firstElementChild.cloneNode(true);
      doc.body.appendChild(node);
      tone(196, 2.2, 'sine', 0.03); setTimeout(function () { tone(1175, 1.4, 'sine', 0.025); }, 400);
      var close = node.querySelector('[data-cv-close]');
      var shut = function () { node.remove(); tone(392, 0.3, 'sine', 0.03); button.focus(); };
      if (close) { close.addEventListener('click', shut); close.focus(); }
      node.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    });
    extra.push(['lamp', 'light the nilavilakku', function () { closeConsole(); button.click(); return 'lamp lit'; }]);
    return null;
  }

  function pluck(button) {
    button.addEventListener('click', function () {
      var f = parseFloat(button.getAttribute('data-note'));
      tone(f, 0.9, 'triangle', 0.05); tone(f * 1.5, 0.7, 'sine', 0.025);
    });
  }

  /* ---------------- start ---------------- */
  function start() {
    var body = doc.body;
    if (!body || !body.classList.contains('cv')) return;
    buildShell(body);
    bindProbe();
    setSound(soundOn);
    ui.frost.classList.toggle('on', cold);
    ui.theme.setAttribute('aria-pressed', String(cold));
    ui.theme.querySelector('span').textContent = cold ? 'COLD' : 'HOT';
    var rainPref = store('cv-rain');
    setRain(rainPref === null ? monsoonDefault() : rainPref === '1', false);
    ui.sound.addEventListener('click', function () { setSound(!soundOn); });
    ui.theme.addEventListener('click', function () { setTheme(!cold); });
    ui.cmdBtn.addEventListener('click', openConsole);
    doc.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openConsole(); }
      else if (e.key === 'Escape' && ui.cmdk) closeConsole();
    });
    var map = { biot: biot, 'heat-field': heatField, mesh: mesh, year: year, cycle: cycle };
    doc.querySelectorAll('[data-cv-toy]').forEach(function (n) {
      var fn = map[n.getAttribute('data-cv-toy')];
      if (fn) { var t = fn(n); if (t) toys.push(t); }
    });
    doc.querySelectorAll('[data-cv-lamp]').forEach(lamp);
    doc.querySelectorAll('[data-note]').forEach(pluck);
    doc.querySelectorAll('[data-cv-num]').forEach(function (n) { n.textContent = num(n.getAttribute('data-cv-num')); });
    if (body.hasAttribute('data-cv-boot')) {
      extra.push(['boot', 'rerun the solver', function () { closeConsole(); boot(true); return 'solver restarted'; }]);
      doc.querySelectorAll('[data-cv-reboot]').forEach(function (b) { b.addEventListener('click', function () { boot(true); }); });
      boot(false);
    } else {
      whoosh();
    }
  }

  window.ControlVolume = {
    register: function (cmd, desc, fn) { extra.push([cmd, desc, fn]); },
    theme: setTheme, sound: setSound, monsoon: function (v) { return setRain(v, true); }, malayalam: setMalayalam, boot: function () { boot(true); }
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
