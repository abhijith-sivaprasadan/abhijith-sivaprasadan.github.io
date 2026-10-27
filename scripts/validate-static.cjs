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
  if (relative.replaceAll('\\', '/').startsWith('design-legacy/')) continue;
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
if (!projectData.projects.some(project => project.id === 'opensteamopt')) errors.push('OpenSteamOpt must be discoverable in the project search index.');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const featuredIds = ["siemens-thesis","tes-discharge-screen","opensteamopt","kerala2040","pynexus-green-hydrogen"];
const isClaudeDesign = home.includes('data-design-source="claude-control-volume-v1"');
const cards = [...home.matchAll(/<article\b[^>]*data-project-id="([^"]+)"/g)].map(match => match[1]);
const indexedFeatured = projectData.projects.filter(project => project.featured).map(project => project.id);
if (!isClaudeDesign && JSON.stringify(cards) !== JSON.stringify(featuredIds)) errors.push('Homepage must show the five curated engineering projects in the agreed order.');
if (isClaudeDesign && !home.includes('data-cv-toy="heat-field"')) errors.push('Claude homepage must retain interactive control-volume hero.');
if (indexedFeatured.length !== featuredIds.length || featuredIds.some(id => !indexedFeatured.includes(id))) errors.push('Project index must agree with the five featured homepage projects.');
const shortcuts = [...home.matchAll(/<a\b[^>]*class="thermotwin-shortcut"[^>]*>/g)];
if (!isClaudeDesign && (shortcuts.length !== 1 || /\b(?:hidden|data-home-mode-target)\b/.test(shortcuts[0]?.[0] || '') || !shortcuts[0]?.[0].includes('href="projects/thermotwin-f.html"'))) {
  errors.push('Homepage must have one unfiltered, direct ThermoTwin shortcut.');
}
if ((home.match(/data-project-id="thermotwin-f"/g) || []).length !== 0) errors.push('ThermoTwin remains in the library and shortcut, but is not a featured project.');
const library = fs.readFileSync(path.join(root, 'projects.html'), 'utf8');
if (isClaudeDesign && (!library.includes('data-cv-case') || !library.includes('projects/thermotwin-f.html'))) errors.push('Claude case library must expose actual cases and ThermoTwin-F.');
if (!library.includes('data-project-id="gb-flexabm"') && !library.includes('href="projects/gb-flexabm.html"')) errors.push('GB-FLEXABM must appear in the static project library.');
if (!library.includes('data-project-id="opensteamopt"') && !library.includes('href="projects/opensteamopt.html"')) errors.push('OpenSteamOpt must appear in the static project library.');
if (!library.includes('data-project-id="kerala2040"') && !library.includes('href="projects/kerala2040.html"')) errors.push('Kerala2040 must appear in the static project library.');
if (!library.includes('data-project-id="tes-discharge-screen"') && !library.includes('href="projects/tes-discharge-screen.html"')) errors.push('TES Discharge Screen must appear in the static project library.');
const gb = projectData.projects.find(project => project.id === 'gb-flexabm');
if (gb?.caseStudyUrl !== 'projects/gb-flexabm.html') errors.push('GB-FLEXABM search must open its portfolio case study.');
const opensteamopt = projectData.projects.find(project => project.id === 'opensteamopt');
if (opensteamopt?.caseStudyUrl !== 'projects/opensteamopt.html') errors.push('OpenSteamOpt search must open its portfolio case study.');
// Original October 2026 repository contributions must remain visible, cited and supporting.
for (const [id, repoName, requiredLimit] of [
  ['gridguardpinn', 'GridGuardPINN', 'not certified grid-control'],
  ['finnish-grid-connection-evidence', 'finnish-grid-connection-evidence', 'not guaranteed grid headroom'],
  ['synthsift', 'SynthSift', 'not a completed systematic review'],
]) {
  const p = projectData.projects.find(x => x.id === id);
  if (!p || p.repoUrl !== 'https://github.com/abhijith-sivaprasadan/' + repoName || p.featured || p.status !== 'published') errors.push('Missing or wrongly promoted original contribution: ' + id);
  if (!library.includes('data-project-id="' + id + '"') && !library.includes('href="' + p.caseStudyUrl + '"')) errors.push('Project library missing ' + id);
  if (!p?.caseStudyUrl || !fs.existsSync(path.join(root, p.caseStudyUrl))) {
    errors.push('Missing case study for ' + id);
  } else {
    const detail = fs.readFileSync(path.join(root, p.caseStudyUrl), 'utf8');
    if (!detail.includes('github.com/abhijith-sivaprasadan/' + repoName) || !detail.toLowerCase().includes(requiredLimit)) errors.push('Uncited or unqualified contribution case study: ' + id);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Passed: ${pages} HTML pages (local links), ${scripts} JavaScript files (syntax), ${json} JSON files.`);
