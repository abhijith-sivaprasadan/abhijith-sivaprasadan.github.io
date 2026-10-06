// Lightweight presentation only: theme + one-shot native entrance transitions.
// No lens, animation framework, canvas, CMS, API hydration or scroll-event loop.
(() => {
  const button = document.querySelector('[data-academic-theme]');
  if (!button) return;
  const reducedMotion = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: true, addEventListener() {} };
  const setTheme = theme => {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    button.textContent = dark ? 'Light mode' : 'Dark mode';
    button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    button.setAttribute('aria-pressed', String(dark));
  };
  let saved = 'light';
  try { saved = localStorage.getItem('portfolioTheme') || 'light'; } catch { /* Preferences are optional. */ }
  setTheme(saved);
  button.hidden = false;
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const applyTheme = () => {
      setTheme(theme);
      try { localStorage.setItem('portfolioTheme', theme); } catch { /* Keep the current page usable. */ }
    };
    if (!reducedMotion.matches && typeof document.startViewTransition === 'function') document.startViewTransition(applyTheme);
    else applyTheme();
  });

  const matrixTabs = [...document.querySelectorAll('[data-matrix-tab]')];
  const matrixPanels = [...document.querySelectorAll('.matrix-panel')];
  const matrixAnimations = new Set();
  const trackAnimation = animation => {
    if (!animation) return;
    matrixAnimations.add(animation);
    animation.finished.then(() => matrixAnimations.delete(animation), () => matrixAnimations.delete(animation));
  };
  const activateMatrix = (tab, moveFocus = false) => {
    if (!tab) return;
    matrixTabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    matrixPanels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (moveFocus) tab.focus();
    if (!panel || reducedMotion.matches || typeof panel.animate !== 'function') return;
    matrixAnimations.forEach(animation => animation.cancel());
    matrixAnimations.clear();
    trackAnimation(panel.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 340, easing: 'cubic-bezier(.22, 1, .36, 1)' }
    ));
    panel.querySelectorAll('.track-skill-links li').forEach((element, index) => trackAnimation(element.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 280, delay: 90 + index * 24, easing: 'ease-out', fill: 'backwards' }
    )));
  };
  matrixTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateMatrix(tab));
    tab.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = matrixTabs[(index + 1) % matrixTabs.length];
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = matrixTabs[(index - 1 + matrixTabs.length) % matrixTabs.length];
      if (event.key === 'Home') next = matrixTabs[0];
      if (event.key === 'End') next = matrixTabs[matrixTabs.length - 1];
      if (next) { event.preventDefault(); activateMatrix(next, true); }
    });
  });

  const showcaseTabs = [...document.querySelectorAll('[data-showcase-tab]')];
  const selectShowcase = tab => {
    matrixAnimations.forEach(animation => animation.cancel());
    matrixAnimations.clear();
    showcaseTabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !active;
      if (active && !reducedMotion.matches && typeof panel.animate === 'function') {
        trackAnimation(panel.animate([{ opacity: 0, transform: 'translateX(14px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 450, easing: 'cubic-bezier(.22, 1, .36, 1)' }));
      }
    });
  };
  showcaseTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectShowcase(tab));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? showcaseTabs[(index + 1) % showcaseTabs.length]
        : event.key === 'ArrowLeft' ? showcaseTabs[(index + showcaseTabs.length - 1) % showcaseTabs.length]
        : event.key === 'Home' ? showcaseTabs[0] : event.key === 'End' ? showcaseTabs[showcaseTabs.length - 1] : null;
      if (next) { event.preventDefault(); selectShowcase(next); next.focus(); }
    });
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { matrixAnimations.forEach(animation => animation.cancel()); matrixAnimations.clear(); }
  });

  const sectionLinks = [...document.querySelectorAll('.section-index a[href^="#"]')];
  if (typeof IntersectionObserver === 'function' && sectionLinks.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach(link => link.classList.toggle('is-current', link.hash === `#${visible.target.id}`));
    }, { rootMargin: '-28% 0px -58%', threshold: [0, .15, .4] });
    sectionLinks.forEach(link => {
      const section = document.querySelector(link.hash);
      if (section) sectionObserver.observe(section);
    });
    window.addEventListener('pagehide', () => sectionObserver.disconnect(), { once: true });
  }

  if (reducedMotion.matches || typeof IntersectionObserver !== 'function') return;

  const animations = new Set();
  const reveal = (element, delay = 0) => {
    if (typeof element.animate !== 'function' || reducedMotion.matches) return;
    const animation = element.animate(
      [{ opacity: 0, transform: 'translateY(22px) scale(.99)', filter: 'blur(5px)' }, { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }],
      { duration: 720, delay, easing: 'cubic-bezier(.22, 1, .36, 1)' }
    );
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  };
  // Content is visible in source/CSS. A failed or blocked script cannot hide it.
  document.querySelectorAll('.hero-identity, .hero-kicker, .hero-intro h1, .hero-intro .lead, .hero-links, .project-showcase, .skill-matrix, .thesis-feature, .dossier-hero')
    .forEach((element, index) => reveal(element, Math.min(index * 60, 180)));
  const observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
      observer.unobserve(entry.target);
      reveal(entry.target, Math.min(index * 55, 165));
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.research-grid article, .work-row, .skill-directory li, .track-directory li, .timeline article, .education-list article, .evidence-item')
    .forEach(element => observer.observe(element));
  if (typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.research-grid article, .work-row').forEach(card => {
      card.addEventListener('pointermove', event => {
        const box = card.getBoundingClientRect();
        card.style.setProperty('--card-x', `${((event.clientX - box.left) / box.width) * 100}%`);
        card.style.setProperty('--card-y', `${((event.clientY - box.top) / box.height) * 100}%`);
      });
    });
  }
  const stopMotion = () => {
    observer.disconnect();
    matrixAnimations.forEach(animation => animation.cancel());
    matrixAnimations.clear();
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  reducedMotion.addEventListener('change', event => { if (event.matches) stopMotion(); });
  window.addEventListener('pagehide', stopMotion, { once: true });
})();
