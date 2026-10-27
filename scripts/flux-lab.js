/* Flux Lab — optional interactive layer over the Control Volume design.
 * No dependencies, telemetry services or remote data. Illustrative particles only.
 * Presets, native-dialog focus management, reduced-motion and performance limits.
 */
(() => {
  'use strict';
  if (window.__cvFluxLab) return;
  window.__cvFluxLab = true;
  const doc = document;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(pointer: fine)');
  const keys = ['calm', 'pulse', 'overdrive'];
  let mode = 'pulse';
  try { const saved = localStorage.getItem('cvfx-mode'); if (keys.includes(saved)) mode = saved; } catch (_) {}
  if (media.matches) mode = 'calm';
  let dialog, opener, status, stage, context, canvas, painter, particles = [];
  let active = false, frame = 0, last = 0, turbulence = 0.42, target = null;
  let tracer, lastTrail = 0;
  const root = () => doc.body;
  const $ = (tag, cls, text) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const persist = v => { try { localStorage.setItem('cvfx-mode', v); } catch (_) {} };
  const on = () => !media.matches && mode !== 'calm';
  function setMode(next, remember = true) {
    mode = media.matches ? 'calm' : next;
    if (remember && !media.matches) persist(mode);
    root().dataset.cvfx = mode;
    if (status) status.textContent = mode === 'calm' ? 'FIELD IDLE' : mode === 'pulse' ? 'FLUX NOMINAL' : 'FLUX OVERDRIVE';
    if (dialog) dialog.querySelectorAll('[data-flux-mode]').forEach(button => {
      const chosen = button.dataset.fluxMode === mode;
      button.setAttribute('aria-pressed', String(chosen));
    });
    if (tracer) tracer.style.display = mode === 'overdrive' && fine.matches ? '' : 'none';
    if (dialog?.open && painter) { cancelAnimationFrame(frame); last = 0; if (on()) { active = true; frame = requestAnimationFrame(draw); } else { draw(); } }
  }
  function setUpRail() {
    const sections = [...doc.querySelectorAll('main section[id], main [id="projects"], main [id="experience"], main [id="education"]')]
      .filter(n => n.id && !n.closest('details') && n.getBoundingClientRect().height > 100).slice(0, 18);
    if (!sections.length) return;
    const rail = $('aside', 'cvfx-route');
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<span class="cvfx-route-kicker">CONTROL SURFACES</span><span class="cvfx-route-current">01 · BOUNDARY</span><span class="cvfx-route-count"></span>';
    const current = rail.querySelector('.cvfx-route-current');
    const count = rail.querySelector('.cvfx-route-count');
    root().appendChild(rail);
    function update() {
      const h = Math.max(1, innerHeight);
      let closest = 0;
      let distance = Infinity;
      sections.forEach((s, i) => {
        const rect = s.getBoundingClientRect();
        const d = rect.bottom < 70 ? Infinity : Math.abs(rect.top - h * 0.24);
        if (d < distance) { distance = d; closest = i; }
      });
      const element = sections[closest];
      const name = element.querySelector('h2, h1')?.textContent?.trim() || element.id.replace(/-/g, ' ');
      current.textContent = (closest + 1).toString().padStart(2, '0') + ' · ' + name.toUpperCase().slice(0, 30);
      count.textContent = (closest + 1).toString().padStart(2, '0') + ' / ' + sections.length.toString().padStart(2, '0');
    }
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; update(); });
    };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    update();
  }
  function makeDialog() {
    dialog = $('dialog', 'cvfx-dialog');
    dialog.setAttribute('aria-labelledby', 'cvfx-dialog-title');
    dialog.innerHTML = '<div class="cvfx-head"><div><small>THE UNREASONABLY FUN SIDE OF THERMODYNAMICS · LAB 02</small><h2 id="cvfx-dialog-title">FLUX LAB<span aria-hidden="true">_</span></h2><p>Boundary conditions are real. This experiment is not.</p></div><button class="cvfx-close" type="button" aria-label="Close Flux Lab">×</button></div>' +
      '<fieldset class="cvfx-modes"><legend>CHOOSE YOUR TURBULENCE</legend><button type="button" data-flux-mode="calm">00 / STILL<small>No decorative motion</small></button><button type="button" data-flux-mode="pulse">01 / FLOW<small>Gentle kinetics</small></button><button type="button" data-flux-mode="overdrive">02 / CHAOS<small>Full spectacle</small></button></fieldset>' +
      '<div class="cvfx-sim-head"><span>PARTICLE TEST CHAMBER · SYNTHETIC</span><span class="cvfx-reynolds">Re* = illustrative</span></div>' +
      '<div class="cvfx-stage" tabindex="0" role="group" aria-label="Synthetic particle field. Pointer or arrow keys move the attractor. Space resets it."><canvas aria-hidden="true"></canvas><div class="cvfx-crosshair" aria-hidden="true">⊕</div><div class="cvfx-stage-note">DRAG OR USE ARROW KEYS · SPACE TO RESET</div></div>' +
      '<label class="cvfx-slider-label" for="cvfx-turbulence">SYNTHETIC TURBULENCE <output for="cvfx-turbulence">42%</output></label><input type="range" id="cvfx-turbulence" min="0" max="100" value="42" step="1">' +
      '<p class="cvfx-disclaimer">Conservation of spectacle ≠ conservation of energy. Particle trajectories, Re* and colours are purely illustrative — no simulation, measurements or scientific validation are claimed.</p>' +
      '<div class="cvfx-foot"><span>∂Ω / OPEN ENERGY METHODS / NO CLAIMS OUTSIDE THE BOUNDARY</span><button type="button" class="cvfx-reset">RESET FIELD ↻</button></div>';
    root().appendChild(dialog);
    dialog.querySelector('.cvfx-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.cvfx-reset').addEventListener('click', resetParticles);
    dialog.querySelectorAll('[data-flux-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.fluxMode)));
    const slider = dialog.querySelector('#cvfx-turbulence');
    slider.addEventListener('input', () => {
      turbulence = Number(slider.value) / 100;
      dialog.querySelector('output').value = slider.value + '%';
    });
    stage = dialog.querySelector('.cvfx-stage');
    canvas = dialog.querySelector('canvas');
    painter = canvas.getContext('2d', { alpha: false });
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
      moveCrosshair();
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { target = null; moveCrosshair(); });
    stage.addEventListener('keydown', e => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) return;
      e.preventDefault();
      if (e.key === ' ') { target = null; resetParticles(); return; }
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!target) target = { x: w / 2, y: h / 2 };
      const delta = e.shiftKey ? 38 : 15;
      if (e.key === 'ArrowUp') target.y -= delta;
      if (e.key === 'ArrowDown') target.y += delta;
      if (e.key === 'ArrowLeft') target.x -= delta;
      if (e.key === 'ArrowRight') target.x += delta;
      target.x = Math.max(0, Math.min(w, target.x));
      target.y = Math.max(0, Math.min(h, target.y));
      moveCrosshair();
    });
    dialog.addEventListener('close', () => {
      active = false;
      cancelAnimationFrame(frame);
      if (opener) opener.focus();
    });
    dialog.addEventListener('click', e => {
      if (e.target === dialog) dialog.close();
    });
    setMode(mode, false);
  }
  function moveCrosshair() {
    const cross = dialog?.querySelector('.cvfx-crosshair');
    if (!cross) return;
    cross.style.opacity = target ? '1' : '0';
    if (target) cross.style.transform = 'translate(' + target.x + 'px,' + target.y + 'px)';
  }
  function resetParticles() {
    if (!canvas || !stage) return;
    const w = Math.max(220, stage.clientWidth);
    const h = Math.max(180, stage.clientHeight);
    const ratio = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    painter.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: 108 }, (_, i) => {
      const angle = i * 2.39996;
      const radius = Math.sqrt((i + 1) / 108) * Math.min(w, h) * 0.47;
      return { x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius, vx: Math.cos(angle + Math.PI / 2) * .8,
        vy: Math.sin(angle + Math.PI / 2) * .8, phase: (i % 17) / 17 };
    });
    if (!active) draw();
  }
  function draw(timestamp = 0) {
    if (!dialog?.open || !painter) return;
    const w = canvas.width / Math.min(2, devicePixelRatio || 1);
    const h = canvas.height / Math.min(2, devicePixelRatio || 1);
    const dt = Math.min(1.8, Math.max(.3, (timestamp - last) / 16.7 || 1));
    last = timestamp;
    painter.fillStyle = '#070b0b';
    painter.fillRect(0, 0, w, h);
    painter.lineWidth = 1;
    painter.strokeStyle = 'rgba(84,128,119,.20)';
    for (let x = 0; x < w; x += 30) { painter.beginPath(); painter.moveTo(x, 0); painter.lineTo(x, h); painter.stroke(); }
    for (let y = 0; y < h; y += 30) { painter.beginPath(); painter.moveTo(0, y); painter.lineTo(w, y); painter.stroke(); }
    const cx = target ? target.x : w / 2;
    const cy = target ? target.y : h / 2;
    const oscillate = Math.sin(timestamp * .0003);
    if (on() && active) particles.forEach((p, i) => {
      const dx = cx - p.x, dy = cy - p.y;
      const d = Math.max(20, Math.hypot(dx, dy));
      const inv = (1.5 + turbulence * 2.5) / (d + 40);
      p.vx += (dx * inv / d - dy * .0009 * (1 + turbulence)) * dt;
      p.vy += (dy * inv / d + dx * .0009 * (1 + turbulence)) * dt;
      p.vx *= .995; p.vy *= .995;
      const velocity = Math.hypot(p.vx, p.vy);
      const max = mode === 'overdrive' ? 3.2 : 1.8;
      if (velocity > max) { p.vx *= max / velocity; p.vy *= max / velocity; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = Math.max(0, Math.min(w, p.x)); p.y = Math.max(0, Math.min(h, p.y));
    });
    particles.forEach((p, i) => {
      painter.beginPath();
      const speed = Math.hypot(p.vx, p.vy);
      const col = i % 9 === 0 ? '#f98e09' : speed > 1.9 ? '#d7b46a' : '#65d6c9';
      painter.fillStyle = col;
      painter.globalAlpha = .43 + p.phase * .43;
      painter.arc(p.x, p.y, (i % 6 === 0 ? 2.3 : 1.2) + Math.max(0, oscillate) * .25, 0, Math.PI * 2);
      painter.fill();
    });
    painter.globalAlpha = 1;
    painter.strokeStyle = 'rgba(249,142,9,.85)';
    painter.beginPath(); painter.arc(cx, cy, 16 + turbulence * 12, 0, 2 * Math.PI); painter.stroke();
    painter.beginPath(); painter.moveTo(cx - 6, cy); painter.lineTo(cx + 6, cy); painter.moveTo(cx, cy - 6); painter.lineTo(cx, cy + 6); painter.stroke();
    if (active && on() && !doc.hidden) frame = requestAnimationFrame(draw);
  }
  function open() {
    if (!dialog) return;
    if (dialog.open) return;
    dialog.showModal();
    last = 0; active = true; target = null; moveCrosshair();
    resetParticles();
    if (on()) frame = requestAnimationFrame(draw); else draw();
    stage.focus();
  }
  function installTracer() {
    if (!fine.matches || media.matches) return;
    tracer = $('div', 'cvfx-trail');
    tracer.setAttribute('aria-hidden', 'true');
    root().appendChild(tracer);
    tracer.style.display = 'none';
    addEventListener('pointermove', e => {
      if (mode !== 'overdrive' || doc.hidden || dialog?.open) return;
      const now = performance.now();
      if (now - lastTrail < 24) return;
      lastTrail = now;
      const dot = $('i', 'cvfx-trail-dot');
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      tracer.append(dot);
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
      if (tracer.childElementCount > 25) tracer.firstElementChild?.remove();
    }, { passive: true });
    doc.addEventListener('pointerdown', e => {
      if (mode !== 'overdrive' || dialog?.open || e.button !== 0) return;
      const ring = $('i', 'cvfx-shockwave');
      ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
      tracer.append(ring);
      ring.addEventListener('animationend', () => ring.remove(), { once: true });
    });
  }
  function installTransitions() {
    doc.addEventListener('click', e => {
      if (!on() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.download || (a.target && a.target !== '_self') || dialog?.open) return;
      const dest = new URL(a.href, location.href);
      if (dest.origin !== location.origin || !/^https?:$/.test(dest.protocol)) return;
      if (dest.pathname === location.pathname && dest.search === location.search) return;
      if (!/\/$|\.html$/.test(dest.pathname)) return;
      e.preventDefault();
      const portal = $('div', 'cvfx-portal');
      portal.setAttribute('aria-hidden', 'true');
      portal.innerHTML = '<span>CONTROL VOLUME / TRANSFERRING BOUNDARY CONDITIONS</span><b>∂Ω →</b>';
      root().append(portal);
      requestAnimationFrame(() => portal.classList.add('cvfx-portal-go'));
      setTimeout(() => { location.href = dest.href; }, mode === 'overdrive' ? 370 : 240);
    }, false);
  }
  /* Quiet cross-page signposts. This is not a guided tour or a progress gate.
     A visitor who has read one research demonstration sees a small next trace.
     The four surfaces are each backed by real existing work and preserve the main UI. */
  function installEvidenceTraces() {
    const path = location.pathname;
    const home = /\/(?:index\.html)?$/.test(path);
    const steps = [
      { id: 'mesh', when: home, at: '#mesh', href: 'research.html#biot-toy', caption: 'A temperature field meets a material boundary.', link: 'What changes inside the wall? ↗' },
      { id: 'biot', when: /\/research\.html$/.test(path), at: '#biot-toy', href: 'projects/siemens-thesis.html', caption: 'The ratio is a clue, not the whole result.', link: 'Trace it into the reducer study ↗' },
      { id: 'rig', when: /\/projects\/siemens-thesis\.html$/.test(path), at: '.case-hero, .paper-hero, main > section', href: 'reports.html', caption: 'Every model has a residual: what its evidence cannot establish.', link: 'Follow the written record ↗' },
      { id: 'reports', when: /\/reports\.html$/.test(path), at: '#external-contributions', href: 'projects.html', caption: 'One boundary closes. Others are still open.', link: 'Return to the full set of cases ↗' }
    ];
    for (const step of steps) {
      if (!step.when) continue;
      const anchor = doc.querySelector(step.at);
      if (!anchor || anchor.parentElement?.querySelector('.cvfx-clue[data-clue="' + step.id + '"]')) continue;
      const note = $('div', 'cvfx-clue');
      note.dataset.clue = step.id;
      const small = $('span', 'cvfx-clue-n');
      small.textContent = '∂Ω // ' + ['01','02','03','04'][steps.indexOf(step)];
      const content = $('div', 'cvfx-clue-copy');
      const text = $('span', 'cvfx-clue-text', step.caption);
      const link = $('a', 'cvfx-clue-link', step.link);
      link.href = new URL(step.href, siteRoot).href;
      link.addEventListener('click', () => {
        try {
          const stamps = JSON.parse(sessionStorage.getItem('cvfx-traces') || '[]');
          if (!stamps.includes(step.id)) sessionStorage.setItem('cvfx-traces', JSON.stringify([...stamps, step.id]));
        } catch (_) { /* optional */ }
      });
      content.append(text, link);
      note.append(small, content);
      anchor.insertAdjacentElement('afterend', note);
    }
  }
  // The laboratory is an Easter egg, not a fixed banner crowding first paint.
  function installDiscovery() {
    let discovered = false;
    const wake = () => {
      if (discovered || scrollY < Math.min(440, Math.max(150, innerHeight * .34))) return;
      discovered = true;
      root().classList.add('cvfx-awake');
      removeEventListener('scroll', wake);
    };
    addEventListener('scroll', wake, { passive: true });
    wake();
  }
  function main() {
    if (!root() || !root().classList.contains('cv')) return;
    opener = $('button', 'cvfx-opener');
    opener.type = 'button'; opener.setAttribute('aria-haspopup', 'dialog');
    opener.setAttribute('aria-label', 'Open the Flux Lab interactive experiment');
    opener.innerHTML = '<span class="cvfx-orbit" aria-hidden="true">◎</span><span>∂Ω / LAB</span>'; 
    root().appendChild(opener);
    status = $('div', 'cvfx-status', 'FLUX NOMINAL');
    status.setAttribute('aria-hidden', 'true'); root().appendChild(status);
    makeDialog();
    opener.addEventListener('click', open);
    addEventListener('keydown', e => {
      if (e.key.toLowerCase() !== 'f' || !e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey) return;
      e.preventDefault(); if (dialog.open) dialog.close(); else open();
    });
    installTracer(); installTransitions(); setUpRail();
    installEvidenceTraces(); installDiscovery();
    setMode(mode, false);
    media.addEventListener?.('change', e => {
      if (e.matches) { if (dialog?.open) { active = false; cancelAnimationFrame(frame); draw(); } setMode('calm', false); }
      else { let saved = 'pulse'; try { saved = localStorage.getItem('cvfx-mode') || 'pulse'; } catch (_) {} setMode(keys.includes(saved) ? saved : 'pulse', false); if (dialog?.open) { active = true; last = 0; frame = requestAnimationFrame(draw); } }
    });
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) { cancelAnimationFrame(frame); last = 0; }
      else if (dialog?.open && on()) { last = 0; frame = requestAnimationFrame(draw); }
    });
    addEventListener('resize', () => { if (dialog?.open) resetParticles(); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', main, { once: true }); else main();
})();