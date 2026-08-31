// Dependency-free regression checks for the static academic experience.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('./data/skill-evidence.cjs');
const tracks = require('./data/portfolio-tracks.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const home = read('index.html');
const projects = [...JSON.parse(read('api/projects.json')).projects, ...data.additionalProjects];
const courses = JSON.parse(read('api/courses.json')).courses;
const experiences = JSON.parse(read('api/linkedin-experience.json')).experience;
const certifications = JSON.parse(read('api/certifications.json')).certifications;
const skills = new Set(data.skills.map(s => s.id));
assert.equal(skills.size, 8);
const keyFor = p => /^https?:/.test(p.caseStudyUrl) ? p.id : path.basename(p.caseStudyUrl, '.html');
const projectKeys = new Set(projects.filter(p => p.status === 'published').map(keyFor));
for (const key of projectKeys) assert.ok(data.projectSkills[key]?.length, `Unmapped public project: ${key}`);
for (const [key, tags] of Object.entries(data.projectSkills)) {
  assert.ok(projectKeys.has(key), `Unknown project: ${key}`);
  for (const tag of tags) assert.ok(skills.has(tag), `Unknown skill: ${tag}`);
}
for (const [skill, order] of Object.entries(data.projectOrder)) {
  assert.ok(skills.has(skill));
  for (const project of order) assert.ok(data.projectSkills[project]?.includes(skill), `Invalid ordering: ${skill} / ${project}`);
}
for (const file of fs.readdirSync(path.join(root, 'projects')).filter(f => f.endsWith('.html'))) {
  assert.ok(projectKeys.has(path.basename(file, '.html')), `Case study absent from dossiers: ${file}`);
}
for (const key of Object.keys(data.experienceSkills)) assert.ok(experiences.some(e => e.id === key), `Unknown experience: ${key}`);
for (const title of Object.keys(data.certificationSkills)) assert.ok(certifications.some(c => c.title === title), `Unknown certification: ${title}`);
const requiredSections = ['projects', 'experience', 'education', 'learning', 'resources', 'scope'];
const files = ['index.html', 'skills/index.html', ...data.skills.map(s => `skills/${s.id}.html`), 'tracks/index.html', ...tracks.map(t => `tracks/${t.id}.html`)];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
assert.deepEqual(tracks.map(t => t.id), ['general', 'thermal', 'energy-modelling', 'software', 'research']);
assert.equal(new Set(tracks.map(t => t.title)).size, 5, 'Track introductions must be distinct.');
assert.equal(new Set(tracks.map(t => t.projects.join(','))).size, 5, 'Tracks must not repeat the same project selection.');
for (const track of tracks) {
  const file = `tracks/${track.id}.html`;
  const html = read(file);
  assert.ok(home.includes(`href="${file}"`), `Homepage missing track ${track.id}`);
  assert.ok(read('tracks/index.html').includes(`href="../${file}"`), `Track directory missing ${track.id}`);
  assert.ok(read('sitemap.xml').includes(`/${file}</loc>`), `Sitemap missing ${file}`);
  assert.ok(html.includes(`<h1>${escape(track.title)}</h1>`));
  assert.ok(html.includes(escape(track.intro)) && html.includes(escape(track.scope)), `Missing track-specific introduction or limitations: ${track.id}`);
  for (const meta of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    assert.ok(html.includes(`<meta ${meta} content="${escape(track.description)}"`), `${file}: metadata does not match track`);
  }
  assert.ok(!html.includes('og:image') && !html.includes('twitter:image'), `${file}: no inherited generic social image`);
  for (const section of ['projects', 'experience', 'skills', 'education', 'resources', 'scope', 'contact']) {
    assert.ok(html.includes(`id="${section}"`), `${file}: missing ${section}`);
  }
  const nav = html.split('aria-label="Portfolio tracks"')[1].split('</nav>')[0];
  assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, `${file}: exactly one selected track`);
  assert.ok(nav.includes(`href="${track.id}.html" aria-current="page"`));
  for (const other of tracks) assert.ok(nav.includes(`href="${other.id}.html"`), `${file}: missing sibling navigation`);
  const renderedProjects = [...html.matchAll(/data-project-id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(renderedProjects, track.projects, `${file}: project selection/order mismatch`);
  for (const property of ['projects', 'experiences', 'skills', 'education']) {
    assert.equal(track[property].length, new Set(track[property]).size, `${file}: duplicate ${property}`);
  }
  for (const key of track.projects) {
    assert.ok(projectKeys.has(key), `${file}: unknown project ${key}`);
    assert.ok(data.projectSkills[key].some(id => track.skills.includes(id)), `${file}: project unrelated to track skills: ${key}`);
  }
  const roleSection = html.split('<section id="experience"')[1].split('<section id="skills"')[0];
  const roleHeadings = [...roleSection.matchAll(/<h3><a[^>]*>(.*?)<\/a><\/h3>/g)].map(m => m[1]);
  assert.deepEqual(roleHeadings, track.experiences.map(id => {
    const e = experiences.find(e => e.id === id && e.status === 'published');
    assert.ok(e, `${file}: unknown/unpublished experience ${id}`);
    return escape(`${e.role} · ${e.company}`);
  }));
  for (const id of track.skills) assert.ok(skills.has(id) && html.includes(`href="../skills/${id}.html"`), `${file}: missing skill ${id}`);
  for (const id of track.education) assert.ok(data.education[id] && html.includes(escape(data.education[id].title)), `${file}: missing education ${id}`);
  assert.ok(html.includes(`class="share-url" href="https://abhijith-sivaprasadan.github.io/${file}"`));
  assert.ok(!/data-track-filter|data-mode|localStorage|<form\b/.test(html), `${file}: direct navigation must not need saved state`);
}
for (const skill of data.skills) {
  for (const code of skill.courses) assert.ok(courses.some(c => c.code === code), `Unknown course: ${code}`);
  for (const id of skill.education) assert.ok(data.education[id], `Unknown education: ${id}`);
  const html = read(`skills/${skill.id}.html`);
  for (const id of requiredSections) assert.ok(html.includes(`id="${id}"`), `${skill.id}: missing ${id}`);
  assert.ok(home.includes(`href="skills/${skill.id}.html"`), `Homepage missing ${skill.id}`);
  const section = html.split('<section id="projects"')[1].split('<section id="experience"')[0];
  const projectHeadings = [...section.matchAll(/<h3><a href="([^"]+)"/g)].map(m => m[1]);
  assert.equal(projectHeadings.length, new Set(projectHeadings).size, `Duplicate project in ${skill.id}`);
}
for (const file of files) {
  const html = read(file);
  assert.ok(!/[ \t]+\r?$/m.test(html), `${file}: trailing whitespace`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate IDs`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: expected one h1`);
  assert.equal((html.match(/<script\b/g) || []).length, 1, `${file}: only the theme script should load`);
  assert.ok(!/<(?:canvas|iframe)\b|data-home-mode|data-skill-radar|scripts\/(?:site|motion\/)|styles\/(?:motion|v4)\.css/.test(html), `${file}: legacy runtime leaked`);
  assert.ok(!/\b(?:href|src)="(?:undefined|null|#)"/.test(html), `${file}: placeholder link`);
  // Follow every local fragment, not only same-page links.
  for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
    if (/^[a-z]+:/i.test(href)) continue;
    const [pathWithQuery, fragment] = href.split('#');
    const pathname = pathWithQuery.split('?')[0];
    const target = path.resolve(path.dirname(path.join(root, file)), pathname || path.basename(file));
    assert.ok(fs.existsSync(target), `${file}: missing ${href}`);
    if (fragment) assert.ok(fs.readFileSync(target, 'utf8').includes(`id="${fragment}"`), `${file}: missing fragment ${href}`);
  }
  const expectedUrl = `https://abhijith-sivaprasadan.github.io/${file === 'index.html' ? '' : file}`;
  assert.ok(html.includes(`<link rel="canonical" href="${expectedUrl}"`));
  assert.ok(html.includes(`<meta property="og:url" content="${expectedUrl}"`));
}
// The optional theme remains usable even when storage is blocked.
for (const blocked of [false, true]) {
  const button = { hidden: true, textContent: '', setAttribute(name, value) { this[name] = value; }, addEventListener(name, callback) { this[name] = callback; } };
  const document = { documentElement: { dataset: {} }, querySelector: () => button };
  const localStorage = { getItem() { if (blocked) throw Error('blocked'); return 'dark'; }, setItem() { if (blocked) throw Error('blocked'); } };
  vm.runInNewContext(read('scripts/academic.js'), { document, localStorage });
  assert.equal(button.hidden, false);
  const first = document.documentElement.dataset.theme;
  button.click();
  assert.notEqual(document.documentElement.dataset.theme, first);
  assert.equal(button['aria-pressed'], String(document.documentElement.dataset.theme === 'dark'));
}
// Entrance motion is progressive: once per element, cancellable, never a loop.
for (const reduce of [false, true]) {
  let observerCallback, preferenceCallback, animationCount = 0, cancelled = 0, observed = 0, unobserved = 0;
  const element = { animate() { animationCount++; return { finished: new Promise(() => {}), cancel() { cancelled++; } }; } };
  const button = { setAttribute() {}, addEventListener() {} };
  const document = { documentElement: { dataset: {} }, querySelector: () => button, querySelectorAll: () => [element] };
  const preference = { matches: reduce, addEventListener(_, callback) { preferenceCallback = callback; } };
  class IntersectionObserver {
    constructor(callback) { observerCallback = callback; }
    observe() { observed++; }
    unobserve() { unobserved++; }
    disconnect() {}
  }
  vm.runInNewContext(read('scripts/academic.js'), { document, matchMedia: () => preference, IntersectionObserver, window: { addEventListener() {} } });
  if (reduce) { assert.equal(animationCount, 0); assert.equal(observed, 0); }
  else {
    assert.equal(animationCount, 1);
    assert.equal(observed, 1);
    observerCallback([{ isIntersecting: true, target: element }]);
    assert.equal(animationCount, 2);
    assert.equal(unobserved, 1);
    preferenceCallback({ matches: true });
    assert.equal(cancelled, 2);
  }
}
assert.ok(Buffer.byteLength(read('scripts/academic.js')) < 5000, 'Keep the homepage script small.');
assert.ok(!/requestAnimationFrame|addEventListener\(['"]scroll/.test(read('scripts/academic.js')), 'No continuous animation or scroll loop.');
assert.ok(read('styles/academic.css').includes('@media (prefers-reduced-motion: reduce)'), 'Respect reduced motion in CSS.');
console.log(`Passed: ${files.length} academic pages, ${tracks.length} shareable tracks, ${skills.size} skill dossiers, ${projectKeys.size} distinct projects, local fragments, static navigation, metadata and theme behavior.`);
