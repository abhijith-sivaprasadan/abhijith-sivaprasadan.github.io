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

  const lab = document.querySelector('.hero-lab');
  const labDomains = [...document.querySelectorAll('[data-lab-domain]')];
  const labFocus = document.querySelector('[data-lab-focus]');
  const labDetail = document.querySelector('[data-lab-detail]');
  let labIndex = 0;
  let labTimer = 0;
  const activateDomain = domain => {
    if (!domain) return;
    labIndex = Math.max(0, labDomains.indexOf(domain));
    labDomains.forEach(item => item.classList.toggle('is-active', item === domain));
    if (labFocus) labFocus.textContent = domain.dataset.title || '';
    if (labDetail) labDetail.textContent = domain.dataset.detail || '';
  };
  const stopLabCycle = () => {
    if (labTimer) window.clearInterval(labTimer);
    labTimer = 0;
  };
  const startLabCycle = () => {
    stopLabCycle();
    if (reducedMotion.matches || labDomains.length < 2) return;
    labTimer = window.setInterval(() => activateDomain(labDomains[(labIndex + 1) % labDomains.length]), 4200);
  };
  labDomains.forEach(domain => {
    domain.addEventListener('pointerenter', () => { stopLabCycle(); activateDomain(domain); });
    domain.addEventListener('focus', () => { stopLabCycle(); activateDomain(domain); });
    domain.addEventListener('blur', startLabCycle);
  });
  if (lab) {
    lab.addEventListener('pointerleave', startLabCycle);
    const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
    if (finePointer && !reducedMotion.matches) {
      lab.addEventListener('pointermove', event => {
        const box = lab.getBoundingClientRect();
        lab.style.setProperty('--lab-x', `${((event.clientX - box.left) / box.width) * 100}%`);
        lab.style.setProperty('--lab-y', `${((event.clientY - box.top) / box.height) * 100}%`);
      });
    }
    startLabCycle();
  }

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
  document.querySelectorAll('.hero-identity, .hero-kicker, .hero-intro h1, .hero-intro .lead, .hero-links, .hero-proof, .hero-lab, .thesis-feature, .dossier-hero, .signal-band')
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
    stopLabCycle();
    observer.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  reducedMotion.addEventListener('change', event => { if (event.matches) stopMotion(); });
  window.addEventListener('pagehide', stopMotion, { once: true });
})();
