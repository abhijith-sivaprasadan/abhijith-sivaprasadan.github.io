// Dependency-free checks for files served by GitHub Pages.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const listing = spawnSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' });
if (listing.status !== 0) throw new Error(listing.stderr || listing.error);
const files = [...new Set(listing.stdout.split('\0').filter(Boolean))].map(file => path.join(root, file)).filter(file => fs.existsSync(file));
const errors = [];
let pages = 0, scripts = 0, json = 0;
for (const file of files) {
  const relative = path.relative(root, file);
  if (file.endsWith('.html')) {
    pages++;
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
      const value = match[1].split('#')[0].split('?')[0];
      if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) continue;
      const target = path.resolve(value.startsWith('/') ? root : path.dirname(file), '.' + (value.startsWith('/') ? value : '/' + value));
      const rel = path.relative(root, target);
      if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(target)) errors.push(`${relative}: missing ${match[1]}`);
    }
  }
  if (/\.(?:js|mjs|cjs)$/.test(file)) {
    scripts++;
    const source = fs.readFileSync(file, 'utf8');
    const module = /(?:^|\n)\s*(?:import\s|export\s)/m.test(source) || relative.replaceAll('\\', '/') === 'scripts/admin.js';
    const result = spawnSync(process.execPath, ['--check', ...(module ? ['--input-type=module'] : [])], { input: source, encoding: 'utf8' });
    if (result.status !== 0) errors.push(`${relative}: ${result.stderr || result.error}`);
  }
  if (file.endsWith('.json')) {
    json++;
    try { JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { errors.push(`${relative}: ${error.message}`); }
  }
}
const projectData = JSON.parse(fs.readFileSync(path.join(root, 'api/projects.json'), 'utf8'));
for (const project of projectData.projects) {
  for (const asset of [project.caseStudyUrl, project.image].filter(Boolean)) {
    if (!/^(?:https?:|\/\/)/.test(asset) && !fs.existsSync(path.resolve(root, asset))) errors.push(`${project.id}: missing ${asset}`);
  }
}
if (!projectData.projects.some(project => project.id === 'thermotwin-f')) errors.push('ThermoTwin must be discoverable in the project search index.');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const featuredIds = ['gb-flexabm', 'pypsa-nl-grid-flexibility', 'pynexus-green-hydrogen', 'industrial-energy-kpi-toolkit', 'eu-ets-exposure-calculator', 'thermotwin-f'];
const cards = [...home.matchAll(/<article\b[^>]*data-project-id="([^"]+)"/g)].map(match => match[1]);
const indexedFeatured = projectData.projects.filter(project => project.featured).map(project => project.id);
if (JSON.stringify(cards) !== JSON.stringify(featuredIds)) errors.push('Homepage must show the six curated research projects in the agreed order.');
if (indexedFeatured.length !== 6 || featuredIds.some(id => !indexedFeatured.includes(id))) errors.push('Project index must agree with the six featured homepage projects.');
const shortcuts = [...home.matchAll(/<a\b[^>]*class="thermotwin-shortcut"[^>]*>/g)];
if (shortcuts.length !== 1 || /\b(?:hidden|data-home-mode-target)\b/.test(shortcuts[0]?.[0] || '') || !shortcuts[0]?.[0].includes('href="projects/thermotwin-f.html"')) {
  errors.push('Homepage must have one unfiltered, direct ThermoTwin shortcut.');
}
if ((home.match(/data-project-id="thermotwin-f"/g) || []).length !== 1) errors.push('Homepage must have exactly one ThermoTwin featured card.');
const library = fs.readFileSync(path.join(root, 'projects.html'), 'utf8');
if (!library.includes('data-project-id="gb-flexabm"')) errors.push('GB-FLEXABM must appear in the static project library.');
const gb = projectData.projects.find(project => project.id === 'gb-flexabm');
if (gb?.caseStudyUrl !== 'projects/gb-flexabm.html') errors.push('GB-FLEXABM search must open its portfolio case study.');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Passed: ${pages} HTML pages (local links), ${scripts} JavaScript files (syntax), ${json} JSON files.`);
