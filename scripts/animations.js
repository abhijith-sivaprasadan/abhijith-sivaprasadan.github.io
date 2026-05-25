(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Scroll reveal ──────────────────────────────────────────── */
  function initReveal() {
    if (!window.IntersectionObserver) return;
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var delay = el.getAttribute('data-reveal-delay') || '0';
        if (!reduced) el.style.transitionDelay = delay + 'ms';
        el.classList.add('is-revealed');
        obs.unobserve(el);
      });
    }, { threshold: 0.09, rootMargin: '0px 0px -36px 0px' });

    items.forEach(function (el) { obs.observe(el); });
  }

  /* ── Animated counters ──────────────────────────────────────── */
  function countUp(el) {
    var raw = el.getAttribute('data-count');
    if (!raw) return;
    var parts = raw.match(/^([^0-9\-]*)([\-0-9.]+)([^0-9.]*)$/);
    if (!parts) return;
    var prefix = parts[1] || '';
    var target = parseFloat(parts[2]);
    var suffix = parts[3] || '';
    var decimals = (parts[2].split('.')[1] || '').length;
    var duration = 2200;
    var start = performance.now();

    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * ease).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    if (!window.IntersectionObserver) return;
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (!reduced) countUp(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── Typed text cycling ─────────────────────────────────────── */
  function initTyped() {
    var el = document.querySelector('[data-typed-cycle]');
    if (!el || reduced) return;
    var texts = el.getAttribute('data-typed-cycle').split('||');
    if (texts.length < 2) return;

    var idx = 0, charIdx = 0, deleting = false;

    function tick() {
      var cur = texts[idx];
      if (!deleting) {
        el.textContent = cur.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx >= cur.length) { deleting = true; setTimeout(tick, 2400); return; }
      } else {
        el.textContent = cur.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx <= 0) {
          deleting = false;
          idx = (idx + 1) % texts.length;
          setTimeout(tick, 380);
          return;
        }
      }
      setTimeout(tick, deleting ? 32 : 62);
    }
    setTimeout(tick, 1200);
  }

  /* ── Image comparison slider ────────────────────────────────── */
  function initComparisonSliders() {
    var sliders = document.querySelectorAll('.img-compare');
    sliders.forEach(function (wrap) {
      var range = wrap.querySelector('.img-compare-range');
      var after = wrap.querySelector('.img-compare-after');
      var handle = wrap.querySelector('.img-compare-handle');
      if (!range || !after) return;

      function update() {
        var v = range.value;
        after.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
        if (handle) handle.style.left = v + '%';
      }

      range.addEventListener('input', update);

      /* Touch support */
      wrap.addEventListener('touchmove', function (e) {
        e.preventDefault();
        var rect = wrap.getBoundingClientRect();
        var x = e.touches[0].clientX - rect.left;
        range.value = Math.min(100, Math.max(0, (x / rect.width) * 100));
        update();
      }, { passive: false });

      update();
    });
  }

  /* ── Stagger grids on reveal ─────────────────────────────────── */
  function initStagger() {
    if (!window.IntersectionObserver || reduced) return;
    var grids = document.querySelectorAll('[data-stagger]');
    grids.forEach(function (grid) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var children = grid.querySelectorAll('[data-stagger-item]');
          children.forEach(function (child, i) {
            child.style.transitionDelay = (i * 75) + 'ms';
            child.classList.add('is-revealed');
          });
          obs.unobserve(grid);
        });
      }, { threshold: 0.05 });
      obs.observe(grid);
    });
  }

  function init() {
    initReveal();
    initCounters();
    initTyped();
    initComparisonSliders();
    initStagger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
