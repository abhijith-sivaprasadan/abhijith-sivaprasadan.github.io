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
  if (relative.startsWith('design-legacy/')) continue;
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
const featuredIds=["siemens-thesis","tes-discharge-screen","opensteamopt","kerala2040","pynexus-green-hydrogen"];
const featured=projectData.projects.filter(p=>p.featured).map(p=>p.id);
if(featured.length!==featuredIds.length||featuredIds.some(id=>!featured.includes(id)))errors.push('Featured data unexpectedly changed');
if(!home.includes('data-design-source="claude-control-volume-v1"')||!home.includes('data-cv-toy="mesh"')||!home.includes('data-cv-toy="year"'))errors.push('Homepage must use approved Claude S1');
const library=fs.readFileSync(path.join(root,'projects.html'),'utf8');
if(!library.includes('data-design-source="claude-control-volume-v1"')||!library.includes('id="cv-case-list"'))errors.push('Cases must use Claude S3 source-driven page');
if(!fs.readFileSync(path.join(root,'scripts/claude-cases.js'),'utf8').includes("fetch('api/projects.json'"))errors.push('Case data source missing');
for(const id of ['gb-flexabm','opensteamopt','kerala2040','tes-discharge-screen']){
 const p=projectData.projects.find(x=>x.id===id&&x.status==='published');
 if(!p?.caseStudyUrl||!fs.existsSync(path.join(root,p.caseStudyUrl)))errors.push('Source-backed case missing '+id);
}
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
  if (!projectData.projects.some(p => p.id === id && p.status === 'published')) errors.push('Project data missing ' + id);
  if (!p?.caseStudyUrl || !fs.existsSync(path.join(root, p.caseStudyUrl))) {
    errors.push('Missing case study for ' + id);
  } else {
    const detail = fs.readFileSync(path.join(root, p.caseStudyUrl), 'utf8');
    if (!detail.includes('github.com/abhijith-sivaprasadan/' + repoName) || !detail.toLowerCase().includes(requiredLimit)) errors.push('Uncited or unqualified contribution case study: ' + id);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Passed: ${pages} HTML pages (local links), ${scripts} JavaScript files (syntax), ${json} JSON files.`);
