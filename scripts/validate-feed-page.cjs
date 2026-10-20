// Dependency-free assertions for the focused FEED share page.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'for/siemens-feed.html');
const html = fs.readFileSync(file, 'utf8');
const expected = [
  ['siemens-thesis', null],
  ['tes-discharge-screen', 'tes-discharge-screen'],
  ['opensteamopt', 'opensteamopt'],
  ['pynexus-green-hydrogen', 'PyNEXUS'],
  ['industrial-energy-kpi-toolkit', 'Energy-KPI-Toolkit'],
];
assert.equal((html.match(/<article class="work-row"/g) || []).length, 5, 'Exactly five work entries');
const articleBlocks = [...html.matchAll(/<article class="work-row">([\s\S]*?)<\/article>/g)].map(m => m[1]);
assert.equal(articleBlocks.length, expected.length);
for (let i = 0; i < expected.length; i++) {
  const [slug, repo] = expected[i];
  const article = articleBlocks[i];
  assert.ok(article.includes(`href="../projects/${slug}.html"`), `Missing case study ${slug}`);
  if (repo) assert.ok(article.includes(`href="https://github.com/abhijith-sivaprasadan/${repo}"`), `Missing specific source repository: ${repo}`);
  else assert.ok(!article.includes('github.com/'), 'Industrial thesis must not suggest a public code repository');
}
const requiredCaveats = [
  "The numerical findings were not experimentally validated after the heater failure.",
  "This is not a design tool or a model validated against a real installation.",
  "It is neither a commissioned plant twin nor an operational control system.",
  "Annual wind-only cases were infeasible for the specified demand; results are not project-specific design predictions.",
  "Its regression is a screening baseline, not an IPMVP Option C measurement-and-verification protocol or evidence of savings at an operating plant."
];
for (let i = 0; i < articleBlocks.length; i++) {
  const text = articleBlocks[i].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const idx = text.indexOf(requiredCaveats[i]);
  assert.ok(idx >= 0, 'Preserve original hedge for project '+(i+1));
  assert.ok(/(?:This work demonstrates|It demonstrates)/.test(text.slice(idx + requiredCaveats[i].length)), 'Keep competency statement after caveat for project '+(i+1));
}
assert.ok(!/href="https:\/\/github\.com\/abhijith-sivaprasadan\/?"|href="\.\.\/(?:projects\.html|tracks\/|skills\/)/.test(html), 'No links to public repo profile or site archive/track/skill pages');
assert.ok(html.includes('styles/academic.css') && html.includes('styles/portfolio.css') && html.includes('scripts/academic.js'), 'Use actual shared design system');
assert.ok(html.includes('class="academic-header"') && html.includes('class="academic-footer"'), 'Use site header and footer');
assert.ok(html.includes('class="theme-switch"'), 'Preserve theme switch');
assert.ok(html.includes('href="#main"') && html.includes('id="main"'), 'Keyboard skip link and main landmark required');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Exactly one h1');
for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const pathname = value.split(/[?#]/)[0];
  if (!pathname || /^(?:https?:|mailto:|tel:)/.test(pathname)) continue;
  const target = path.resolve(path.dirname(file), pathname);
  assert.ok(target.startsWith(root) && fs.existsSync(target), `Missing local target: ${value}`);
}
console.log('FEED share page: 5 ordered projects, source links, no forbidden navigation, assets and landmarks OK');
