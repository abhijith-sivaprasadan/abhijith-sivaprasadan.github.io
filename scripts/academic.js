// Lightweight presentation only: theme + one-shot native entrance transitions.
// No lens, animation framework, canvas, CMS, API hydration or scroll-event loop.
(() => {
  const button = document.querySelector('[data-academic-theme]');
  if (!button) return;
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
    setTheme(theme);
    try { localStorage.setItem('portfolioTheme', theme); } catch { /* Keep the current page usable. */ }
  });

  const reducedMotion = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: true };
  if (reducedMotion.matches || typeof IntersectionObserver !== 'function') return;

  const animations = new Set();
  const reveal = (element, delay = 0) => {
    if (typeof element.animate !== 'function' || reducedMotion.matches) return;
    const animation = element.animate(
      [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 650, delay, easing: 'cubic-bezier(.22, 1, .36, 1)' }
    );
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  };
  // Content is visible in source/CSS. A failed or blocked script cannot hide it.
  document.querySelectorAll('.hero-identity, .hero-intro h1, .hero-intro .lead, .hero-links, .thesis-feature, .dossier-hero')
    .forEach((element, index) => reveal(element, Math.min(index * 60, 180)));
  const observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
      observer.unobserve(entry.target);
      reveal(entry.target, Math.min(index * 55, 165));
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.research-grid article, .work-row, .skill-directory li, .timeline article, .education-list article, .evidence-item')
    .forEach(element => observer.observe(element));
  const stopMotion = () => {
    observer.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  reducedMotion.addEventListener('change', event => { if (event.matches) stopMotion(); });
  window.addEventListener('pagehide', stopMotion, { once: true });
})();
