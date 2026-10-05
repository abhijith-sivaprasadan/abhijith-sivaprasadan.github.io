// A single, dependency-free shell for legacy public endpoints.
// The content stays authored in each page; navigation, theme and motion align
// with the modern homepage without loading its old lens/radar runtime.
(() => {
  const localPath = new URL(location.href).pathname;
  const nested = /\/(?:projects|experience)\//.test(localPath);
  const prefix = nested ? '../' : '';
  const isWork = /\/projects(?:\/|\.html)/.test(localPath);
  const isResearch = /\/research\.html$/.test(localPath);
  const isExpertise = /\/skills(?:\/|\.html)/.test(localPath);
  const isTracks = /\/tracks(?:\/|\.html)/.test(localPath);
  const current = label => ({ Research: isResearch, Work: isWork, Expertise: isExpertise, Tracks: isTracks })[label];
  const makeLink = (href, label, className = '') => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    if (className) link.className = className;
    return link;
  };
  const navLink = (href, label) => {
    const link = makeLink(`${prefix}${href}`, label);
    if (current(label)) link.setAttribute('aria-current', 'page');
    return link;
  };

  const setTheme = theme => {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const button = document.querySelector('[data-unified-theme]');
    if (!button) return;
    button.textContent = dark ? 'Light mode' : 'Dark mode';
    button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    button.setAttribute('aria-pressed', String(dark));
  };

  const mount = () => {
    document.body.classList.add('unified-site');
    let saved = document.documentElement.dataset.theme || 'light';
    try { saved = localStorage.getItem('portfolioTheme') || saved; } catch { /* Theme storage is optional. */ }

    const header = document.querySelector('.site-header');
    if (header) {
      const inner = document.createElement('div');
      inner.className = 'unified-header-inner';
      const wordmark = makeLink(`${prefix}index.html`, 'Abhijith Sivaprasadan', 'unified-wordmark');
      const discipline = document.createElement('span');
      discipline.textContent = 'Thermal engineering & energy systems';
      wordmark.append(discipline);
      const nav = document.createElement('nav');
      nav.className = 'unified-nav';
      nav.setAttribute('aria-label', 'Main navigation');
      nav.append(
        navLink('index.html#research', 'Research'),
        navLink('projects.html', 'Work'),
        navLink('skills/index.html', 'Expertise'),
        navLink('tracks/index.html', 'Tracks'),
        makeLink(`${prefix}index.html#contact`, 'Contact')
      );
      const themeSwitch = document.createElement('button');
      themeSwitch.className = 'unified-theme-switch';
      themeSwitch.type = 'button';
      themeSwitch.dataset.unifiedTheme = '';
      themeSwitch.textContent = 'Dark mode';
      themeSwitch.setAttribute('aria-label', 'Switch to dark mode');
      themeSwitch.setAttribute('aria-pressed', 'false');
      inner.append(wordmark, nav, themeSwitch);
      header.replaceChildren(inner);
      themeSwitch.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        const applyTheme = () => {
          setTheme(next);
          try { localStorage.setItem('portfolioTheme', next); } catch { /* Keep the page usable. */ }
        };
        const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduce && typeof document.startViewTransition === 'function') document.startViewTransition(applyTheme);
        else applyTheme();
      });
    }
    setTheme(saved);

    const footer = document.querySelector('.footer');
    if (footer) {
      const inner = document.createElement('div');
      inner.className = 'unified-footer-inner';
      const copyright = document.createElement('p');
      copyright.textContent = '© 2026 Abhijith Sivaprasadan';
      const nav = document.createElement('nav');
      nav.className = 'unified-footer-links';
      nav.setAttribute('aria-label', 'Footer navigation');
      nav.append(
        makeLink(`${prefix}projects.html`, 'Projects'),
        makeLink(`${prefix}experience.html`, 'Experience'),
        makeLink(`${prefix}tracks/index.html`, 'Tracks'),
        makeLink(`${prefix}skills/index.html`, 'Skills'),
        makeLink('https://github.com/abhijith-sivaprasadan', 'GitHub'),
        makeLink('https://www.linkedin.com/in/abhijith-sivaprasadan/', 'LinkedIn')
      );
      const note = document.createElement('p');
      note.textContent = 'Methods, evidence, and their limits.';
      inner.append(copyright, nav, note);
      footer.replaceChildren(inner);
    }

    document.querySelectorAll('.lens-dev-toggle, [data-field-route-rail], .motion-audio-toggle, .motion-cursor, .motion-ambient-canvas').forEach(element => element.remove());

    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    if (!preference.matches && matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.card, .project-card, .case-panel, .page-panel, .skill-block, .timeline-item, .entry-card, .project-browser-item').forEach(card => {
        card.addEventListener('pointermove', event => {
          const box = card.getBoundingClientRect();
          card.style.setProperty('--unified-card-x', `${((event.clientX - box.left) / box.width) * 100}%`);
          card.style.setProperty('--unified-card-y', `${((event.clientY - box.top) / box.height) * 100}%`);
        });
      });
    }
    if (preference.matches || typeof IntersectionObserver !== 'function') return;
    const animations = new Set();
    const reveal = element => {
      if (preference.matches || typeof element.animate !== 'function') return;
      const animation = element.animate(
        [{ opacity: 0, transform: 'translateY(20px) scale(.992)', filter: 'blur(5px)' }, { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }],
        { duration: 700, easing: 'cubic-bezier(.22, 1, .36, 1)' }
      );
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    };
    document.querySelectorAll('.page-hero > .container, .case-hero > .container').forEach(reveal);
    const observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => {
        observer.unobserve(entry.target);
        reveal(entry.target);
      });
    }, { threshold: .08 });
    document.querySelectorAll('.section > .container, .project-card, .timeline-item, .case-panel, .page-panel, .skill-block, .entry-card, details').forEach(element => observer.observe(element));
    const stop = () => {
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    preference.addEventListener('change', event => { if (event.matches) stop(); });
    window.addEventListener('pagehide', stop, { once: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
