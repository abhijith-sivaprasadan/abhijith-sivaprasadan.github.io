// A single, dependency-free shell for legacy public endpoints.
// The content stays authored in each page; navigation, theme and motion align
// with the modern homepage without loading its old lens/radar runtime.
(() => {
  const localPath = new URL(location.href).pathname;
  const nested = /\/(?:projects|experience)\//.test(localPath);
  // 404 is served at any depth, so it links from the site root.
  const prefix = document.body?.dataset.pageKey === 'not-found' ? '/' : nested ? '../' : '';
  const isWork = /\/projects(?:\/|\.html)/.test(localPath);
  const isResearch = /\/research\.html$/.test(localPath);
  const isHome = /\/(?:index\.html)?$/.test(localPath) && !nested;
  const isExpertise = /\/skills(?:\/|\.html)/.test(localPath);
  const isTracks = /\/tracks(?:\/|\.html)/.test(localPath);
  const current = label => ({ System: isHome, Research: isResearch, Cases: isWork, Record: /\/experience(?:\/|\.html)/.test(localPath), Skills: isExpertise, Tracks: isTracks })[label];
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
    // Control volume is dark by design; the runtime's cold/hot toggle replaces the old switch.
    const saved = 'dark';

    const header = document.querySelector('.site-header');
    if (header) {
      const inner = document.createElement('div');
      inner.className = 'unified-header-inner';
      const wordmark = makeLink(`${prefix}index.html`, 'Abhijith Sivaprasadan', 'unified-wordmark');
      const discipline = document.createElement('span');
      discipline.textContent = 'Heat · Power · Code';
      wordmark.append(discipline);
      const nav = document.createElement('nav');
      nav.className = 'unified-nav';
      nav.setAttribute('aria-label', 'Main navigation');
      nav.append(
        navLink('index.html', 'System'),
        navLink('projects.html', 'Cases'),
        navLink('research.html', 'Research'),
        navLink('experience.html', 'Record'),
        navLink('skills/index.html', 'Skills'),
        navLink('tracks/index.html', 'Tracks'),
        makeLink(`${prefix}index.html#contact`, 'Contact')
      );
      inner.append(wordmark, nav);
      header.replaceChildren(inner);
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
      const outside = document.createElement('span');
      outside.textContent = 'Outside the boundary';
      nav.append(
        outside,
        makeLink(`${prefix}index.html#research`, 'Open questions'),
        makeLink(`${prefix}courses.html`, 'Courses'),
        makeLink(`${prefix}ideas.html`, 'Ideas'),
        makeLink(`${prefix}interests.html`, 'Interests'),
        makeLink(`${prefix}hobbies.html`, 'Hobbies'),
        makeLink(`${prefix}reports.html`, 'Reports'),
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
        [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 440, easing: 'cubic-bezier(.22, 1, .36, 1)' }
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
