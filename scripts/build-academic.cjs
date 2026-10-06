// Generate the homepage, application tracks and skill dossiers from public data.
// Run with --check in CI to reject stale generated pages.
const fs = require('node:fs');
const path = require('node:path');
const data = require('./data/skill-evidence.cjs');
const tracks = require('./data/portfolio-tracks.cjs');
const radarExamples = require('./data/track-radar.cjs');
const radarDevelopment = require('./data/radar-development.cjs');
const art = require('./data/portfolio-art.cjs');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'api', name), 'utf8'));
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const external = href => /^https?:/.test(href);
const projectKey = project => external(project.caseStudyUrl) ? project.id : path.basename(project.caseStudyUrl, '.html');
// Prefer the first canonical entry when the imported index repeats a case study.
const canonicalProjects = new Map();
for (const project of [...read('projects.json').projects, ...data.additionalProjects]) {
  if (project.status === 'published' && project.caseStudyUrl && !canonicalProjects.has(project.caseStudyUrl)) {
    canonicalProjects.set(project.caseStudyUrl, project);
  }
}
const projects = [...canonicalProjects.values()];
const experiences = read('linkedin-experience.json').experience.filter(e => e.status === 'published');
const courses = read('courses.json').courses.filter(c => c.status === 'published');
const certifications = read('certifications.json').certifications;
const featured = ['kerala2040', 'tes-discharge-screen', 'opensteamopt', 'gb-flexabm', 'thermotwin-f', 'pypsa-nl-grid-flexibility'];
const github = 'https://github.com/abhijith-sivaprasadan';
const linkedin = 'https://www.linkedin.com/in/abhijith-sivaprasadan/';
const origin = 'https://abhijith-sivaprasadan.github.io';
const version = '20261007-engineering-index';
const arrow = '<span aria-hidden="true">↗</span>';
const cvs = {
  modelling: ['downloads/Abhijith_Sivaprasadan_CV_Generic_Modelling.pdf', 'Modelling CV (PDF)'],
  thermal: ['downloads/Abhijith_Sivaprasadan_CV_Generic_Thermal_Process.pdf', 'Thermal & process CV (PDF)'],
  research: ['downloads/Abhijith_Sivaprasadan_CV_Generic_Research.pdf', 'Research CV (PDF)'],
};
function link(href, label, prefix = '', cls = '') {
  return `<a${cls ? ` class="${cls}"` : ''} href="${escape(external(href) || href.startsWith('mailto:') || href.startsWith('#') ? href : prefix + href)}">${escape(label)}</a>`;
}
function projectMedia(project, prefix = '', compact = false) {
  const image = art.coverFor(project);
  if (!image || !project.caseStudyUrl) return '';
  const href = external(project.caseStudyUrl) ? project.caseStudyUrl : prefix + project.caseStudyUrl;
  const src = external(image) ? image : prefix + image;
  const action = external(project.caseStudyUrl) ? 'Open source ↗' : 'View case study →';
  return `<a class="${compact ? 'evidence-media' : 'work-media'}" href="${escape(href)}" aria-label="View ${escape(project.title || project.role || 'project')} details"><img src="${escape(src)}" alt="" width="960" height="540" loading="lazy" decoding="async" /><span aria-hidden="true">${action}</span></a>`;
}
function skillCV(skill) {
  if (['cfd-heat-transfer', 'test-instrumentation', 'cad-fea'].includes(skill.id)) return cvs.thermal;
  if (skill.id === 'research') return cvs.research;
  return cvs.modelling;
}
const trackSkillLinks = {
  general: ['cfd-heat-transfer', 'energy-systems', 'data-software', 'test-instrumentation', 'cad-fea'],
  thermal: ['cfd-heat-transfer', 'cfd-heat-transfer', 'energy-systems', 'test-instrumentation', 'cfd-heat-transfer'],
  'energy-modelling': ['optimisation', 'energy-systems', 'energy-systems', 'optimisation', 'data-software'],
  software: ['data-software', 'data-software', 'data-software', 'data-software', 'data-software'],
  research: ['research', 'cfd-heat-transfer', 'research', 'test-instrumentation', 'research'],
};
function matrixPanel(track, index) {
  const cv = track.resources.find(resource => /CV \(PDF\)$/.test(resource.label));
  const axes = radarExamples[track.id].map(ids => ids.map(id => {
    if (id.startsWith('experience:')) {
      const key = id.slice('experience:'.length), role = experiences.find(e => e.id === key);
      const url = role?.detailUrl || data.experienceUrls[key];
      if (!role || !url) throw new Error(`Unknown radar role: ${id}`);
      return { title: `${role.role} · ${role.company}`, caseStudyUrl: url };
    }
    const project = projects.find(p => p.id === id || projectKey(p) === id);
    if (!project) throw new Error(`Unknown radar project: ${id}`);
    return project;
  }));
  const levels = radarDevelopment.tracks[track.id];
  if (levels?.length !== 5 || levels.some(level => !Number.isInteger(level) || level < 1 || level > 4) || radarDevelopment.rationale[track.id]?.length !== 5) {
    throw new Error(`Radar must retain conservative early-career assessments: ${track.id}`);
  }
  const maximum = radarDevelopment.stages.length;
  const point = (axis, radius) => {
    const angle = -Math.PI / 2 + axis * 2 * Math.PI / 5;
    return [260 + Math.cos(angle) * radius, 212 + Math.sin(angle) * radius].map(n => Number(n.toFixed(2)));
  };
  const polygon = radius => Array.from({ length: 5 }, (_, i) => point(i, radius).join(',')).join(' ');
  const label = (title, i) => {
    const [x, y] = point(i, 165);
    const words = title.split(' '), split = Math.ceil(words.length / 2);
    const lines = title.length > 14 ? [words.slice(0, split).join(' '), words.slice(split).join(' ')] : [title];
return `<a href="skills/${trackSkillLinks[track.id][i]}.html" aria-label="Explore ${escape(title)}"><rect x="${x - 85}" y="${y - 27}" width="170" height="76" fill="transparent" pointer-events="all" /><text x="${x}" y="${y}" text-anchor="middle">${lines.map((line, row) => `<tspan x="${x}" dy="${row ? '1.3em' : 0}">${escape(line)}</tspan>`).join('')}</text></a>`;
  };
  return `<section class="matrix-panel" id="matrix-panel-${track.id}" role="tabpanel" aria-labelledby="matrix-tab-${track.id}"${index ? ' hidden' : ''}>
    <p class="radar-track-detail">${escape(track.detail)}</p>
    <svg class="portfolio-radar-chart" viewBox="0 0 520 400" role="group" aria-label="${escape(track.label)} early-career development radar">
      <title>${escape(track.label)} — qualitative portfolio assessment</title>
      <desc>${track.matrix.map(([title], i) => escape(`${title}: ${radarDevelopment.stages[levels[i] - 1]}`)).join('; ')}. Expert is not claimed.</desc>
      <g class="radar-grid">${radarDevelopment.stages.map((stage, i) => `<polygon points="${polygon(122 * (i + 1) / maximum)}"><title>${stage}</title></polygon>`).join('')}${axes.map((_, i) => `<line x1="260" y1="212" x2="${point(i, 122)[0]}" y2="${point(i, 122)[1]}" />`).join('')}</g>
      <polygon class="radar-coverage" points="${levels.map((level, i) => point(i, 122 * level / maximum).join(',')).join(' ')}" />
      ${levels.map((level, i) => `<circle class="radar-node" cx="${point(i, 122 * level / maximum)[0]}" cy="${point(i, 122 * level / maximum)[1]}" r="5"><title>${escape(track.matrix[i][0])}: ${radarDevelopment.stages[level - 1]}</title></circle>`).join('')}
      <g class="radar-labels">${track.matrix.map(([title], i) => label(title, i)).join('')}</g>
    </svg>
    <details class="radar-notes"><summary>Evidence &amp; assessment <span>5 skills</span></summary><div class="radar-notes-body">
    <p class="radar-explanation">Select a chart label for its skill dossier, or expand a skill below for the assessment and supporting work.</p>
    ${['software', 'general'].includes(track.id) ? '<p class="radar-context"><strong>QBurst · 21 months in backend engineering</strong><span>Go · JavaScript/TypeScript · NestJS · API testing · Git &amp; Docker</span></p>' : ''}
<div class="radar-evidence">${track.matrix.map(([title, description], i) => `<details><summary><span>${escape(title)}</span><span>${radarDevelopment.stages[levels[i] - 1]} <span aria-hidden="true">+</span></span></summary><div><p>${escape(radarDevelopment.rationale[track.id][i])}</p><p>${escape(description)}. Related work:</p>${axes[i].map(project => link(project.caseStudyUrl, project.title + ' ↗')).join('')}${link(`skills/${trackSkillLinks[track.id][i]}.html`, 'All related work & education ↗', '', 'radar-skill-link')}</div></details>`).join('')}</div>
    <details class="radar-method"><summary>How to read this radar</summary><p class="radar-explanation">Inner → outer: Exposure · Applied · Established practice · Focused strength · Expert. Qualitative portfolio assessments, not measured skill ratings. Expert is intentionally unclaimed.</p><p class="radar-explanation">Established practice means repeated application; Focused strength means sustained depth in a bounded area. Each skill includes its assessment and supporting work.</p></details>
    </div></details>
    <div class="radar-actions">${link(`tracks/${track.id}.html`, 'Explore this track ↗', '', 'primary-link')}${cv ? `<a href="${escape(cv.url)}" aria-label="${escape(cv.label)}">CV (PDF)</a>` : ''}</div>
  </section>`;
}
function radar() {
  const labels = [['Overview', 'All disciplines'], ['Thermal', 'CFD & heat transfer'], ['Energy', 'Systems & optimisation'], ['Software', 'Backend & scientific tools'], ['Research', 'Thesis & PhD interests']];
  return `<aside id="practice" class="portfolio-radar skill-matrix" data-skill-matrix aria-label="Interactive skill and project radar"><header><p class="overline">01 / Skills &amp; experience</p><h2>Choose your<br />perspective.</h2><p class="radar-guide">Five routes through my work. Select a track, then a skill to explore the evidence behind it.</p></header><div class="matrix-tabs" role="tablist" aria-label="Portfolio application tracks">${tracks.map((track, index) => `<button type="button" role="tab" id="matrix-tab-${track.id}" aria-label="${escape(track.label)}" aria-controls="matrix-panel-${track.id}" aria-selected="${index === 0}" tabindex="${index ? '-1' : '0'}" data-matrix-tab><strong>${labels[index][0]}</strong><small>${escape(labels[index][1])}</small></button>`).join('')}</div><div class="matrix-panels">${tracks.map(matrixPanel).join('')}</div></aside>`;
}
function page(file, title, description, content, isHome = false) {
  const prefix = isHome ? '' : '../';
  return `<!DOCTYPE html>
<!-- Generated by scripts/build-academic.cjs. Edit its template/data, then rebuild. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)} | Abhijith Sivaprasadan</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${origin}/${file === 'index.html' ? '' : file}" />
  <meta property="og:title" content="${escape(title)} | Abhijith Sivaprasadan" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${origin}/${file === 'index.html' ? '' : file}" />
  <meta name="twitter:card" content="${isHome ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escape(title)} | Abhijith Sivaprasadan" />
  <meta name="twitter:description" content="${escape(description)}" />${isHome ? `
  <meta property="og:image" content="${origin}/assets/portfolio-preview.png" />
  <meta name="twitter:image" content="${origin}/assets/portfolio-preview.png" />` : ''}
  <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="${prefix}styles/academic.css?v=${version}" />
  <link rel="stylesheet" href="${prefix}styles/portfolio.css?v=${version}" />
  <script src="${prefix}scripts/academic.js?v=${version}" defer></script>
</head>
<body class="academic-site" data-page-key="${isHome ? 'home' : file.startsWith('tracks/') ? 'application-track' : 'skill-evidence'}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="academic-header">
    <div class="wrap header-inner">
      <a class="wordmark" href="${prefix}index.html">Abhijith Sivaprasadan<span>Thermal engineering &amp; energy systems</span></a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="${prefix}projects.html">Work</a>
        <a href="${prefix}index.html#research">Research</a>
        <a href="${prefix}experience.html">Experience</a>
        <a href="${prefix}skills/index.html"${file.startsWith('skills/') ? ' aria-current="page"' : ''}>Skills</a>
        <a href="${prefix}tracks/index.html"${file.startsWith('tracks/') ? ' aria-current="page"' : ''}>Tracks</a>
        <a href="${prefix}index.html#contact">Contact</a>
      </nav>
      <button class="theme-switch" type="button" data-academic-theme aria-label="Switch to dark mode" aria-pressed="false" hidden>Dark mode</button>
    </div>
  </header>
  <main id="main" class="wrap" tabindex="-1">
${content.trimEnd()}
  </main>
  <footer class="academic-footer"><div class="wrap footer-inner"><p>© 2026 Abhijith Sivaprasadan</p><div>${link(github, 'GitHub')}${link(linkedin, 'LinkedIn')}${link('mailto:abhijithsivaprasadan@gmail.com', 'Email')}<a href="${prefix}tracks/index.html">All tracks</a><a href="${prefix}skills/index.html">Skill index</a></div><p>Methods, evidence, and their limits.</p></div></footer>
</body>
</html>
`;
}
function skillLinks(prefix = '', selection = data.skills) {
  return `<ul class="skill-directory">${selection.map(skill => `
    <li><a href="${prefix}skills/${skill.id}.html"><span><strong>${escape(skill.short)}</strong><small>${escape(skill.detail)}</small></span>${arrow}</a></li>`).join('')}
  </ul>`;
}
function evidenceCard(item, kind, prefix = '../') {
  const href = item.caseStudyUrl || item.detailUrl || item.url;
  const title = item.title || `${item.role} · ${item.company}`;
  const meta = [kind, item.period, item.associatedWith || item.context || item.institution].filter(Boolean).join(' · ');
  return `<article class="evidence-item">
    ${projectMedia({ ...item, caseStudyUrl: item.caseStudyUrl || item.detailUrl }, prefix, true)}
    <p class="item-meta">${escape(meta)}</p>
    <h3>${link(href, title, prefix)}</h3>
    ${item.summary ? `<p>${escape(item.summary)}</p>` : ''}
    ${item.tools?.length ? `<p class="tools-line">${item.tools.map(escape).join(' · ')}</p>` : ''}
    <div class="text-links">${link(href, external(href) ? 'Open source' : 'Read the evidence', prefix)}${item.githubUrl && item.githubUrl !== href ? link(item.githubUrl, 'Source code') : ''}</div>
  </article>`;
}
function projectKind(p) {
  if (p.id === 'siemens-thesis') return 'Master’s thesis';
  if (p.id === 'alleima-energy-efficiency') return 'Internship methodology';
  if (/KTH|University|coursework|assignment/.test(p.associatedWith || '')) return 'Academic project';
  if (/SAE/.test(p.associatedWith || '')) return 'Student design competition';
  return 'Independent project';
}
function trackCards(prefix = '', compact = false) {
  return `<ul class="track-directory${compact ? ' track-directory-compact' : ''}">${tracks.map((track, index) => `
    <li data-track-card="${track.id}"><a href="${prefix}tracks/${track.id}.html"><span class="track-visual" aria-hidden="true"><i></i><i></i><i></i><b></b></span><span class="track-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><strong>${escape(track.label)}</strong><span class="track-detail">${escape(track.detail)}</span><span class="track-open">Explore track <span aria-hidden="true">→</span></span></a></li>`).join('')}
  </ul>`;
}
function trackNavigation(current) {
  return `<nav class="track-navigation" aria-label="Portfolio tracks"><span>Choose a track</span><ul>${tracks.map(track => `<li><a href="${track.id}.html"${current === track.id ? ' aria-current="page"' : ''}>${escape(track.label)}</a></li>`).join('')}</ul></nav>`;
}
function trackPage(track) {
  const selectedProjects = track.projects.map(key => projects.find(p => projectKey(p) === key));
  const selectedRoles = track.experiences.map(id => experiences.find(e => e.id === id));
  const selectedSkills = track.skills.map(id => data.skills.find(s => s.id === id));
  const trackUrl = `${origin}/tracks/${track.id}.html`;
  return page(`tracks/${track.id}.html`, `${track.label} Portfolio`, track.description, `
    <!-- Track content is intentionally static. The URL is the selection: no
         saved mode, filtering runtime, Live Lens or Evidence Lens is required. -->
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="index.html">Tracks</a><span aria-hidden="true">/</span><span aria-current="page">${escape(track.label)}</span></nav>
    ${trackNavigation(track.id)}
    <section class="academic-hero track-hero" data-track="${track.id}">
      <div class="hero-intro">
        <div class="hero-identity"><img src="../assets/headshot.webp" alt="Abhijith Sivaprasadan" width="56" height="56" fetchpriority="high" /><p><strong>Abhijith Sivaprasadan</strong><span>M.Sc. Sustainable Energy Engineering · KTH · Stockholm, Sweden</span></p></div>
        <p class="overline">${escape(track.label)} / Portfolio</p>
        <h1>${escape(track.title)}</h1>
        <p class="lead">${escape(track.intro)}</p>
        <div class="hero-links">${link(track.primary.url, track.primary.label, '../', 'primary-link')}${track.primary.url !== github ? link(github, 'GitHub ↗') : ''}${link(linkedin, 'LinkedIn ↗')}${link('#contact', 'Contact')}</div>
      </div>
      <aside class="thesis-feature track-focus" aria-labelledby="focus-heading"><p class="overline">Areas of focus</p><h2 id="focus-heading">${escape(track.label)}</h2><dl>${track.focus.map(([title, summary]) => `<div><dt>${escape(title)}</dt><dd>${escape(summary)}</dd></div>`).join('')}</dl><p class="scope-caption">${escape(track.audience)}</p></aside>
    </section>
    <nav class="section-index" aria-label="Track sections"><a href="#projects">Selected work</a><a href="#experience">Relevant experience</a><a href="#skills">Skills &amp; evidence</a><a href="#education">Education</a><a href="#resources">${track.id === 'research' ? 'Publications &amp; documents' : 'Supporting resources'}</a></nav>
    <section id="projects" class="page-section"><div class="section-heading"><div><p class="overline">01 / Selected work</p><h2>${track.id === 'research' ? 'Research &amp; written work.' : 'Work behind this track.'}</h2></div>${link('projects.html', 'Complete project library →', '../')}</div><p class="section-intro">A focused selection. Open a case study for methods, results and limitations, or follow the skill dossiers below for the complete related record.</p>
      <div class="selected-work">${selectedProjects.map(p => `<article class="work-row" data-project-id="${escape(projectKey(p))}">${projectMedia(p, '../')}<div><p class="item-meta">${escape(projectKind(p))}${p.period ? ` · ${escape(p.period)}` : ''}</p><h3>${link(p.caseStudyUrl, p.title, '../')}</h3><p>${escape(p.summary)}</p>${p.tools?.length ? `<p class="tools-line">${p.tools.map(escape).join(' · ')}</p>` : ''}</div><div class="work-links">${link(p.caseStudyUrl, external(p.caseStudyUrl) ? 'Repository →' : 'Case study →', '../')}${p.githubUrl && p.githubUrl !== p.caseStudyUrl ? link(p.githubUrl, 'GitHub ↗') : ''}</div></article>`).join('\n')}</div>
    </section>
    <section id="experience" class="page-section"><div class="section-heading"><div><p class="overline">02 / Experience</p><h2>Relevant professional practice.</h2></div>${link('experience.html', 'Full experience record →', '../')}</div><div class="track-experience">${selectedRoles.map(e => evidenceCard({ ...e, detailUrl: e.detailUrl || data.experienceUrls[e.id] || 'experience.html' }, e.type)).join('\n')}</div></section>
    <section id="skills" class="page-section"><div class="section-heading"><div><p class="overline">03 / Skills &amp; evidence</p><h2>Go deeper into each area.</h2></div></div><p class="section-intro">Each skill opens its own page with all related public projects, roles, coursework, training and supporting material.</p>${skillLinks('../', selectedSkills)}</section>
    <section id="education" class="page-section"><div class="section-heading"><div><p class="overline">04 / Education</p><h2>Academic foundation.</h2></div>${link('courses.html', 'Coursework &amp; descriptions →', '../')}</div><div class="track-education">${track.education.map(id => { const e = data.education[id]; return evidenceCard(e, id === 'aalto' ? 'Exchange elective' : 'Academic foundation'); }).join('\n')}</div></section>
    <section id="resources" class="page-section"><div class="section-heading"><div><p class="overline">05 / Supporting material</p><h2>${track.id === 'research' ? 'Publications &amp; documents.' : 'Profiles &amp; further reading.'}</h2></div></div><ul class="resource-links">${track.resources.map(r => `<li>${link(r.url, r.label, '../')}</li>`).join('')}<li>${link(github, 'GitHub — repositories ↗')}</li><li>${link(linkedin, 'LinkedIn — professional profile ↗')}</li></ul></section>
    <section id="scope" class="scope-note"><h2>Scope &amp; scientific limitations</h2><p>${escape(track.scope)}</p><p>Source case studies remain authoritative. Private inputs and restricted project details are not published.</p></section>
    <section id="contact" class="contact-section"><div><p class="overline">Let’s connect</p><h2>Continue the conversation.</h2><p>For ${escape(track.audience.charAt(0).toLowerCase() + track.audience.slice(1))}.</p><a class="contact-email" href="mailto:abhijithsivaprasadan@gmail.com">abhijithsivaprasadan@gmail.com</a></div><div class="contact-resources"><h3>Share this track</h3><p class="share-note">Use this direct link for an application or introduction. It always opens the ${escape(track.label)} view.</p><a class="share-url" href="${trackUrl}">${escape(trackUrl)}</a><a href="index.html">← Choose another track</a><a href="../index.html">Explore the complete portfolio →</a></div></section>`);
}
function matching(skill) {
  const order = data.projectOrder[skill.id] || [];
  const rank = project => order.includes(projectKey(project)) ? order.indexOf(projectKey(project)) : order.length;
  return {
    projects: projects.filter(p => data.projectSkills[projectKey(p)]?.includes(skill.id)).sort((a, b) => rank(a) - rank(b)),
    experiences: experiences.filter(e => data.experienceSkills[e.id]?.includes(skill.id)),
    courses: courses.filter(c => skill.courses.includes(c.code)),
    certifications: certifications.filter(c => data.certificationSkills[c.title]?.includes(skill.id)),
    resources: data.resources.filter(r => r.skills.includes(skill.id)),
  };
}
function skillPage(skill) {
  const matched = matching(skill);
  const education = skill.education.map(id => data.education[id]);
  return page(`skills/${skill.id}.html`, skill.short, skill.summary, `
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="index.html">Expertise</a><span aria-hidden="true">/</span><span aria-current="page">${escape(skill.short)}</span></nav>
    <header class="dossier-hero">
      <p class="overline">Expertise / evidence dossier</p>
      <h1>${escape(skill.short)}</h1>
      <p class="lead">${escape(skill.summary)}</p>
      <p class="tools-line">${skill.tools.map(escape).join(' · ')}</p>
      <p class="dossier-counts">${matched.projects.length} projects <span>·</span> ${matched.experiences.length} related roles <span>·</span> ${matched.courses.length} courses</p>
    </header>
    <div class="dossier-layout">
      <aside class="dossier-nav"><p class="overline">On this page</p><nav aria-label="Evidence sections"><a href="#projects">Projects &amp; studies</a><a href="#experience">Work &amp; related roles</a><a href="#education">Education &amp; courses</a><a href="#learning">Further learning</a><a href="#resources">Publications &amp; resources</a><a href="#scope">Scope &amp; limitations</a></nav><a class="back-to-skills" href="index.html">← All skill areas</a></aside>
      <div class="dossier-content">
        <section id="projects" class="dossier-section"><h2>Projects &amp; studies</h2><p class="section-intro">Relevant work from the public portfolio, with each case study listed once.</p>${matched.projects.map(p => evidenceCard(p, projectKind(p))).join('\n')}</section>
        <section id="experience" class="dossier-section"><h2>Work &amp; related roles</h2><p class="section-intro">Professional experience, internships and relevant student responsibilities are labelled separately.</p>${matched.experiences.map(e => evidenceCard({ ...e, detailUrl: e.detailUrl || data.experienceUrls[e.id] || 'experience.html' }, e.type === 'Part-time' && /SAE/.test(e.company) ? 'Student responsibility' : e.type)).join('\n') || '<p>No directly related role is currently documented in the public portfolio.</p>'}</section>
        <section id="education" class="dossier-section"><h2>Education &amp; coursework</h2>${education.map(e => evidenceCard(e, e.title.startsWith('Circular') ? 'Exchange elective' : 'Academic foundation')).join('\n')}
          <h3 class="subheading">Relevant courses</h3><ul class="course-list">${matched.courses.map(c => `<li><span class="course-code">${escape(c.code)}</span><span><strong>${escape(c.name)}</strong><small>${escape(c.institution)}</small></span></li>`).join('')}</ul><p>${link('courses.html', 'Full course descriptions and project connections', '../')}</p>
        </section>
        <section id="learning" class="dossier-section"><h2>Further learning &amp; certifications</h2><p class="section-intro">Training records support the work above; they are not substitutes for project evidence. Issuer links are not credential-verification links.</p>${matched.certifications.length ? `<ul class="learning-list">${matched.certifications.map(c => `<li><div><strong>${escape(c.title)}</strong><small>${escape(c.issuer)} · ${escape(c.issued)}${c.expires ? ` · Expires ${escape(c.expires)}` : ''}</small></div>${link(c.link.url, c.link.label === 'Credential' ? 'Credential ↗' : 'Issuer ↗')}</li>`).join('')}</ul>` : '<p>No directly related certification is currently listed. The coursework and project evidence above are the relevant record.</p>'}</section>
        <section id="resources" class="dossier-section"><h2>Publications &amp; supporting resources</h2>${matched.resources.map(r => evidenceCard(r, 'Supporting material')).join('\n') || '<p>Reports, code, datasets and technical notes are linked from the project case studies above.</p>'}<p>${link(...skillCV(skill), '../')}</p></section>
        <section id="scope" class="scope-note"><h2>Scope &amp; limitations</h2><p>${escape(skill.scope)}</p><p>This dossier groups related public records. It does not imply equal depth across every tool or independent validation of every result. Source case studies remain authoritative; restricted inputs and private documents are not included.</p></section>
      </div>
    </div>
    <section class="page-section"><div class="section-heading"><p class="overline">Continue exploring</p><h2>Related areas of practice</h2></div>${skillLinks('../')}</section>`);
}
function home() {
  const featuredProjects = featured.map(id => projects.find(p => p.id === id));
  const roles = ['test-engineer-master-thesis-student', 'energy-efficiency-intern', 'student-intern-pyrolysis', 'engineer-backend-developer-typescript-nestjs'].map(id => experiences.find(e => e.id === id));
  return page('index.html', 'Thermal Engineering & Energy Systems Research', 'Academic portfolio of Abhijith Sivaprasadan: thermal-fluid engineering, energy-system resilience, thermal storage, research software, published thesis and emerging nuclear-energy interests.', `
    <!-- The former Live/Evidence Lens, capability radar and decorative field atlas
         remain intentionally retired. This homepage uses a bounded, evidence-based
         track matrix: no canvas simulation, CMS hydration or scroll loop. -->
    <section id="signal" class="academic-hero">
      <div id="person" class="hero-intro">
        <div class="hero-identity"><img src="assets/headshot.webp" alt="Abhijith Sivaprasadan" width="56" height="56" fetchpriority="high" /><p><strong>Abhijith Sivaprasadan</strong><span>M.Sc. Sustainable Energy Engineering · KTH · Stockholm, Sweden</span></p></div>
        <p class="overline hero-kicker">Abhijith Sivaprasadan / Engineering portfolio</p>
        <h1>Heat. Power.<br /><em>Code.</em></h1>
      </div>
      <div class="hero-summary">
        <p class="hero-specialism">Thermal engineering<br />&amp; energy systems modelling</p>
        <p class="lead">I connect thermal-fluid engineering, energy-system modelling and professional software delivery. I have completed the M.Sc. in Sustainable Energy Engineering at KTH, including my 30 ECTS thesis; my degree certificate is in process.</p>
        <p class="hero-interest">Interested in research-engineer and PhD opportunities in thermal-fluid engineering, energy systems and nuclear-energy applications.</p>
        <div class="hero-links">${link('#projects', 'Selected work ↓', '', 'primary-link')}${link('#practice', 'Skills & tracks ↓')}${link(github, 'GitHub ↗')}${link(linkedin, 'LinkedIn ↗')}${link(...cvs.research)}</div>
      </div>
    </section>
    <nav class="work-entrypoints" aria-label="Start exploring my work">
      <a href="projects/siemens-thesis.html"><span>01 / Published thesis</span><strong>Inside a thermal rig <span aria-hidden="true">↗</span></strong><small>CFD / CHT · Siemens Energy</small></a>
      <a href="projects/kerala2040.html"><span>02 / Independent research</span><strong>Power-system resilience <span aria-hidden="true">↗</span></strong><small>Energy modelling · Kerala2040</small></a>
      <a href="experience/qburst.html"><span>03 / Professional experience</span><strong>Backend engineering <span aria-hidden="true">↗</span></strong><small>APIs &amp; automated testing · QBurst</small></a>
    </nav>
    ${radar()}
    <div class="portfolio-credentials"><span>M.Sc. Sustainable Energy Engineering <strong>KTH</strong></span><span>Thesis <strong>Siemens Energy</strong></span><span>Industrial energy <strong>Alleima</strong></span><span>Software engineering <strong>QBurst</strong></span></div>
    <nav class="section-index" aria-label="Page sections"><a href="#tracks">Choose a track</a><a href="#research">Research interests</a><a href="#projects">Selected work</a><a href="#skills">Expertise</a><a href="#experience">Experience</a><a href="#education">Education</a></nav>
    <section id="projects" class="page-section">
      <div class="section-heading"><div><p class="overline">Selected work</p><h2>Ideas, built and investigated.</h2></div>${link('projects.html', 'Complete project library →')}</div>
      <p class="section-intro">Open methods, inspectable code, and explicit limits. The case studies distinguish numerical verification, coursework and exploratory modelling from real-system validation.</p>
      <div class="selected-work">${featuredProjects.map((p, index) => `<article class="work-row" data-project-id="${p.id}">${projectMedia(p)}<span class="work-number">${String(index + 1).padStart(2, '0')}</span><div><p class="item-meta">${escape(p.category)} · ${escape(p.period || 'Independent project')}</p><h3>${link(p.caseStudyUrl, p.title)}</h3><p>${escape(p.summary)}</p><p class="tools-line">${p.tools.map(escape).join(' · ')}</p></div><div class="work-links">${link(p.caseStudyUrl, 'Case study →')}${p.githubUrl ? link(p.githubUrl, 'GitHub ↗') : ''}</div></article>`).join('\n')}</div>
      <p class="project-footnote">Also: ${link('projects/siemens-thesis.html', 'Siemens thesis')} · ${link('projects/structural-fea-reactor-internals.html', 'Structural FEA')} · ${link('https://github.com/abhijith-sivaprasadan/non-gray-radiation-modeling', 'Non-gray radiation modelling')} · ${link('projects/thermotwin-f.html', 'Explore ThermoTwin-F →', '', 'thermotwin-shortcut')}</p>
    </section>
    <section id="tracks" class="track-layer"><div class="section-heading"><div><p class="overline">Your interests. A focused view.</p><h2>Find the work that matters to you.</h2></div>${link('tracks/index.html', 'All application tracks ↗')}</div><p class="section-intro">Choose a perspective to explore relevant projects, experience and skills. Each track has a dedicated page to share.</p>
      ${trackCards('', true)}
    </section>
    <section id="research" class="page-section">
      <div class="section-heading"><div><p class="overline">Research direction</p><h2>Questions that connect the work.</h2></div>${link('research.html', 'Full research statement →')}</div>
      <div class="research-grid">
        <article><span class="discipline-number">I</span><h3>Thermal engineering</h3><p>How do geometry, surface condition and thermal resistance affect high-temperature heat transfer? I’m interested in transient CHT and carefully bounded experimental–numerical comparison.</p>${link('skills/cfd-heat-transfer.html', 'Thermal methods & evidence →')}</article>
        <article><span class="discipline-number">II</span><h3>Energy systems modelling</h3><p>How do demand, network limits and storage change system decisions? My work explores heat and power dispatch, grid flexibility, hydrogen and electricity investment.</p>${link('energy-systems.html', 'Energy systems work →')}</article>
        <article><span class="discipline-number">III</span><h3>Industrial decarbonisation</h3><p>How can operational data support defensible energy decisions? My focus includes energy-performance indicators, load drivers, metering gaps and transparent emissions calculations.</p>${link('industrial-rd.html', 'Industrial methodology →')}</article>
        <article><span class="discipline-number">IV</span><h3>Nuclear-energy applications</h3><p>How can existing thermal-fluid, systems and computational engineering skills transfer into nuclear R&amp;D? I’m exploring nuclear thermal-hydraulics and reactor systems while building the nuclear-specific foundation needed for credible work.</p>${link('research.html', 'Research direction →')}</article>
      </div>
    </section>
    <section id="skills" class="page-section">
      <div class="section-heading"><div><p class="overline">03 / Expertise &amp; evidence</p><h2>Explore the work behind each skill.</h2></div>${link('skills/index.html', 'All skill areas →')}</div>
      <p class="section-intro">Each area brings together related projects, professional experience, education, coursework and supporting material. Select an area to see the work behind it.</p>
      ${skillLinks()}
    </section>
    <section id="profile" class="page-section background-grid">
<div id="experience"><div class="section-heading"><div><p class="overline">04 / Experience</p><h2>Research &amp; engineering practice.</h2></div></div><div class="timeline">${roles.map(e => `<article><p class="item-meta">${escape(e.period)} · ${escape(e.type)}</p><h3>${escape(e.company)}</h3><p class="role-title">${escape(e.role)}</p><p>${escape(e.id === 'test-engineer-master-thesis-student' ? 'CFD/CHT modelling and measurement-chain commissioning in the Fluid Dynamic Lab; heater failure occurred before high-temperature testing began.' : e.id === 'energy-efficiency-intern' ? 'Desk-based industrial energy-performance methodology, EnPI design and metering-readiness assessment; no plant-savings claim.' : e.id === 'student-intern-pyrolysis' ? 'Reactor-concept literature review and cost-analysis drivers for polymer-waste pyrolysis.' : 'Approximately 21 months of professional backend engineering: Go, then JavaScript/TypeScript and NestJS; production APIs, automated tests, Git and Docker.')}</p>${link(e.detailUrl || data.experienceUrls[e.id], 'Role details →')}</article>`).join('')}</div><p>${link('experience.html', 'Full experience record →')}</p></div>
      <div id="education"><div class="section-heading"><div><p class="overline">05 / Education</p><h2>Academic foundation.</h2></div></div><div class="education-list">${['kth', 'aalto', 'btech'].map(id => { const e = data.education[id]; return `<article><p class="item-meta">${escape(e.period)}</p><h3>${escape(e.title)}</h3><p class="role-title">${escape(e.institution)}</p><p>${escape(e.summary)}</p>${link(e.url, 'Education & coursework →')}</article>`; }).join('')}</div><div class="publication-note"><p class="overline">Publications &amp; written work</p><h3>From thesis to technical record.</h3><p>${link('https://urn.kb.se/resolve?urn=urn:nbn:se:kth:diva-381965', 'Published KTH thesis')} and ${link('projects/robotic-frame-locomotion.html', 'undergraduate robot publications')}, alongside reproducible reports and source-linked case studies.</p>${link('skills/research.html', 'Research & communication dossier →')}</div></div>
    </section>
    <section id="contact" class="contact-section"><div><p class="overline">06 / Contact</p><h2>Let’s discuss the research.</h2><p>I welcome conversations about research-engineer and doctoral opportunities in thermal engineering, energy-system modelling and nuclear-energy applications in Sweden and the EU.</p><a class="contact-email" href="mailto:abhijithsivaprasadan@gmail.com">abhijithsivaprasadan@gmail.com</a></div><div id="cv" class="contact-resources"><h3>Profiles &amp; documents</h3>${link(github, 'GitHub — code & repositories ↗')}${link(linkedin, 'LinkedIn — professional profile ↗')}${link(...cvs.modelling)}${link(...cvs.thermal)}${link(...cvs.research)}${link('https://orcid.org/0009-0009-8429-1266', 'ORCID ↗')}</div></section>
  `, true);
}

const outputs = new Map([['index.html', home()]]);
for (const track of tracks) outputs.set(`tracks/${track.id}.html`, trackPage(track));
outputs.set('tracks/index.html', page('tracks/index.html', 'Choose a Portfolio Track', 'Five focused, shareable portfolios: general engineering, thermal engineering, energy modelling, software, and research or PhD applications.', `
  <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Tracks</span></nav>
  <header class="dossier-hero"><p class="overline">One portfolio / Five perspectives</p><h1>Choose a track.</h1><p class="lead">Explore the work most relevant to your interests. Each track brings together a focused introduction, projects, experience, skills, education and supporting resources.</p><p class="section-intro">Each page has a direct link you can share. No filters to set, no sign-in required.</p></header>
  ${trackCards('../')}
  <section class="scope-note index-scope"><h2>The same work, with a different focus.</h2><p>Tracks are curated entry points, not separate claims or qualifications. They link to the same public case studies and skill dossiers, with the same scientific limitations. For an unfiltered overview, ${link('index.html', 'visit the full portfolio', '../')}.</p></section>`));
for (const skill of data.skills) outputs.set(`skills/${skill.id}.html`, skillPage(skill));
outputs.set('skills/index.html', page('skills/index.html', 'Expertise & Evidence', 'Browse eight evidence dossiers connecting engineering skills to projects, experience, education and supporting work.', `
  <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Expertise</span></nav>
  <header class="dossier-hero"><p class="overline">Areas of practice</p><h1>Expertise, with evidence.</h1><p class="lead">Choose a skill to explore the projects, work experience, education, coursework and supporting material behind it.</p></header>
  ${skillLinks('../')}
  <section class="scope-note index-scope"><h2>How to read these dossiers</h2><p>Each dossier is a curated view of the public portfolio—not a proficiency score. Projects can support more than one skill. Repeated imported records are consolidated, while coursework, professional roles and independent projects remain distinct.</p><p>Limitations are stated on each page. Reports, source code and further evidence remain linked through the original case studies; private documents are not published.</p></section>`));

let stale = false;
for (const [file, rawContent] of outputs) {
  const content = rawContent.replace(/[ \t]+\n/g, '\n');
  const target = path.join(root, file);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content) { console.error(`Stale generated page: ${file}`); stale = true; }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}
if (stale) process.exit(1);
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${outputs.size} academic pages from public portfolio records.`);
