// Regression checks for the shared UI shell on legacy public endpoints.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const htmlIn = dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.html')).map(name => path.join(dir, name));
const legacyPages = [
  ...fs.readdirSync(root).filter(name => name.endsWith('.html') && name !== 'index.html'),
  ...htmlIn('projects'),
  ...htmlIn('experience'),
];

assert.equal(legacyPages.length, 50, 'Review the unified-shell inventory when public endpoints change.');
for (const file of legacyPages) {
  const html = read(file);
  assert.ok(html.includes('styles/portfolio.css?v=20261007-engineering-index'), `${file}: missing shared portfolio art direction`);
  if (file === '404.html') {
    assert.ok(html.includes('styles/unified.css?v=20261007-engineering-index'));
    assert.ok(html.includes('scripts/unified-shell.js?v=20261007-engineering-index'));
  } else {
    assert.ok(html.includes('scripts/public-config.js?v=20261007-engineering-index'), `${file}: stale shared shell loader`);
  }
  assert.ok(html.includes('class="signal-rebuild"') || /<body[^>]*class="[^"]*signal-rebuild/.test(html), `${file}: missing unified body hook`);
}

const shell = read('scripts/unified-shell.js');
const stylesheet = read('styles/unified.css');
for (const destination of ['index.html#research', 'projects.html', 'skills/index.html', 'tracks/index.html', 'index.html#contact']) {
  assert.ok(shell.includes(destination), `Shared navigation missing ${destination}`);
}
for (const selector of ['.unified-header-inner', '.unified-nav', '.page-hero', '.case-hero', '.case-panel', '.unified-footer-inner']) {
  assert.ok(stylesheet.includes(selector), `Shared CSS missing ${selector}`);
}
assert.ok(stylesheet.includes('@view-transition'), 'Shared pages must retain progressive cross-page transitions.');
assert.ok(stylesheet.includes('--unified-accent-2'), 'Shared pages must retain the research-spectrum depth system.');
assert.ok(stylesheet.includes('--unified-shadow-strong'), 'Shared pages must retain the elevated depth system.');
assert.ok(stylesheet.includes('@keyframes unified-ambient-shift'), 'Shared pages must retain bounded ambient motion.');
assert.ok(stylesheet.includes('scroll-snap-type'), 'Shared navigation must remain touch friendly.');
assert.ok(stylesheet.includes('animation-timeline: scroll(root block)'), 'Shared long-form pages must retain progressive reading position.');
assert.ok(/\.site-header\s*\{[\s\S]{0,160}?display:\s*block\s*!important/.test(stylesheet), 'Shared header must override paper-page hiding rules.');
assert.ok(stylesheet.includes('@media (max-width: 760px)'));
assert.ok(stylesheet.includes('@media (prefers-reduced-motion: reduce)'));
assert.ok(stylesheet.includes("html[data-theme='dark']"));
for (const token of ['--paper-page', '--paper-sheet', '--paper-panel-strong', '--paper-ink', '--paper-muted', '--paper-rule', '--paper-accent']) {
  assert.ok(stylesheet.includes(token), `Dual-theme research papers missing ${token}`);
}
const paperPages = legacyPages.filter(file => read(file).includes('data-paper'));
assert.equal(paperPages.length, 11, 'Review the paper-theme inventory when research pages change.');
for (const file of paperPages) {
  const html = read(file);
  assert.ok(html.includes('class="paper-doc'), `${file}: missing shared paper document surface`);
  assert.ok(html.includes('scripts/public-config.js?v=20261007-engineering-index'), `${file}: stale shared loader cache key`);
}
assert.ok(stylesheet.includes("html[data-theme='dark'] body.signal-rebuild:is([data-paper], [data-mode='paper'])"), 'Research papers need an explicit dark-paper palette.');
for (const surface of ['.method-flow span', '.gb-callout', '.os-callout', '.os-metrics span']) {
  assert.ok(stylesheet.includes(surface), `Paper theme missing custom surface ${surface}`);
}
assert.ok(stylesheet.includes("@media print") && stylesheet.includes("--paper-sheet: #fff"), 'Dark papers must print with a light high-contrast palette.');
assert.ok(read('projects/siemens-thesis.html').includes('scripts/thesis-charts.js?v=20261005-paper-themes'), 'Thesis chart cache key is stale.');
assert.ok(read('scripts/thesis-charts.js').includes('light ? "#2563a8" : "#72b7ff"'), 'Thesis charts need a high-contrast dark blue series.');
assert.ok(read('scripts/thesis-charts.js').includes('light ? "#b84b19" : "#ff9a66"'), 'Thesis charts need a high-contrast dark orange series.');
assert.ok(!/requestAnimationFrame|addEventListener\(['"]scroll/.test(shell), 'Unified shell must not add continuous scroll work.');
assert.ok(!/\.innerHTML\s*=/.test(shell), 'Shared shell must construct static UI without innerHTML.');
assert.ok(Buffer.byteLength(shell) < 8000, 'Keep the shared shell small.');

const motion = read('scripts/motion/index.js');
const autoload = motion.split('const autoload = [')[1].split('];')[0];
for (const retired of ['fluid-sim', 'field-bg', 'skill-radar', 'evidence-graph', 'audio', 'cms-hydrate']) {
  assert.ok(!autoload.includes(`name: "${retired}"`), `Retired runtime was re-enabled: ${retired}`);
}
const site = read('scripts/site.js');
assert.ok(site.includes('Intentionally retired: the former Field/Evidence Lens'), 'Field Lens retirement must stay documented.');
assert.ok(!site.includes('initializeFieldRouteRail'), 'Retired Field Lens implementation must not return as dead code.');

const overviewCorrection = 'commissioned the measurement chain for a planned validation campaign at up to 700&deg;C';
const detailCorrection = 'During preparation for high-temperature testing, a heater failure occurred before the campaign could begin;';
assert.ok(read('experience.html').includes(overviewCorrection));
assert.ok(read('experience/siemens-energy.html').includes(detailCorrection));
for (const file of ['experience.html', 'experience/siemens-energy.html', 'api/linkedin-experience.json', 'backend/data/experience.json', ...htmlIn('skills'), ...htmlIn('tracks')]) {
  const content = read(file);
  assert.ok(!content.includes('ran independent test campaigns at up to 700'), `${file}: obsolete campaign claim`);
  assert.ok(!content.includes('During high-temperature preparation, a heater failure interrupted sustained testing'), `${file}: obsolete heater chronology`);
}
for (const file of ['api/linkedin-experience.json', 'backend/data/experience.json']) {
  assert.ok(read(file).includes('commissioned the measurement chain for a planned validation campaign at up to 700 C'));
}

const chronologyFiles = [
  'index.html',
  'about.html',
  'cet2026/index.html',
  'experience.html',
  'experience/siemens-energy.html',
  'projects.html',
  'projects/automatic-sanitizer-dispenser.html',
  'projects/siemens-thesis.html',
  'api/projects.json',
  'api/linkedin-projects.json',
  'backend/data/projects.json',
  'assets/portfolio-preview.svg',
  'scripts/build-academic.cjs',
  'scripts/data/portfolio-tracks.cjs',
  'scripts/data/skill-evidence.cjs',
  'scripts/site.js',
  ...htmlIn('skills'),
  ...htmlIn('tracks'),
];
const misleadingChronology = [
  'limited sustained experimental comparison',
  'limited sustained high-temperature comparison',
  'The Siemens campaign was limited by a heater failure',
  'during high-temperature validation work',
  'NI-DAQ instrumentation and high-temperature validation',
  'high-temperature test campaigns',
  'preparation for independent test campaigns',
  'Designed and commissioned a 700°C-class high-temperature calibration rig',
  'Test-Rig Validation',
  'dynamic pressure sensor validation',
  'experimental-numerical validation',
  'validation experience visual',
  'test validation workflow visual',
  'NI-DAQ/LabVIEW validation',
  'instrumentation-chain validation',
  'test-rig validation visual',
  'Test-rig validation',
];
for (const file of chronologyFiles) {
  const content = read(file);
  for (const phrase of misleadingChronology) {
    assert.ok(!content.includes(phrase), `${file}: ambiguous Siemens chronology: ${phrase}`);
  }
}
assert.ok(read('index.html').includes('heater failure occurred before high-temperature testing began'));
assert.ok(read('cet2026/index.html').includes('heater failure occurred before high-temperature testing began'));
assert.ok(read('projects/siemens-thesis.html').includes('before high-temperature testing could begin'));
assert.ok(read('tracks/thermal.html').includes('no experimental validation campaign was completed'));
assert.ok(read('skills/cfd-heat-transfer.html').toLowerCase().includes('heater failure occurred before high-temperature testing could begin'));
for (const file of ['api/projects.json', 'api/linkedin-projects.json', 'backend/data/projects.json']) {
  assert.ok(read(file).includes('High-Temperature Reducer CFD/CHT and Measurement-Chain Commissioning'));
}

console.log(`Passed: ${legacyPages.length} legacy endpoints share the modern shell; retired lens runtime stays disabled; Siemens chronology is source-aligned.`);
