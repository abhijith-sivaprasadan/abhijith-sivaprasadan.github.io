// Lightweight regression checks for the evidence-first Armada 2026 recruiter microsite.
// No runtime dependencies; companion scripts/validate-static.cjs checks local asset links.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const sectors = [
 'thermal-test',
 'power-grids',
 'industrial-heat',
 'mechanical-structures',
 'software-research',
 'engineering-consulting'
];
const hub = read('for/armada-2026.html');
const css = read('styles/armada-2026.css');
assert.ok(hub.includes('<h1>Abhijith Sivaprasadan</h1>'), 'Hub should introduce the engineer by name');
assert.ok(hub.includes('class="armada-profile-links"'), 'Hub should link to the wider professional profile');
assert.ok(hub.indexOf('id="credentials"')<hub.indexOf('id="choose"'), 'Industrial experience should precede specialisations');
assert.ok(!hub.includes('Different roles need different evidence'), 'Do not use abstract or instructive public headings');

assert.ok(css.includes('@media(max-width:630px)'), 'Missing responsive layout');
assert.ok(!hub.includes('id="armada-company-search"'), 'Public hub should not show a competing-employer list');
assert.ok(!hub.includes('Companies of interest'), 'Public portfolio should not name competing employers as personal preferences');
assert.ok(hub.includes('href="../repositories.html"'), 'Hub must link the complete public GitHub directory');
assert.ok(hub.includes('Official Armada 2026 exhibitor list'), 'Missing authoritative source label');
const titles = new Set();
for (const sector of sectors) {
 const route = 'for/armada-2026/' + sector + '.html';
 const html = read(route);
 assert.ok(hub.includes('href="armada-2026/' + sector + '.html"'), 'Hub missing route '+sector);
 const title = html.match(/<h1>([^<]+)<\/h1>/);
 assert.ok(title && !titles.has(title[1]), 'Missing/distinct sector headline: '+sector);
 titles.add(title[1]);
 for (const anchor of ['id="evidence"','id="contact"','id="contribution"']) {
  assert.ok(html.includes(anchor), 'Missing '+anchor+' in '+sector);
 }
 assert.ok(html.includes('href="../../styles/armada-2026.css') || html.includes('href="../styles/armada-2026.css'), 'Styles missing: '+sector);
 const evidenceCount = (html.match(/class="evidence-card"/g)||[]).length;
 assert.ok(evidenceCount >= 4, 'Sector lacks differentiated evidence '+sector);
 assert.ok(!html.includes('Companies of interest') && !html.includes('COMPANIES OF INTEREST') && !html.includes('class="company-card"'),'No employer consideration list should appear on public sector page '+sector);
 assert.ok(html.includes('href="../../repositories.html"'),'Missing complete GitHub directory link '+sector);
 assert.ok(html.includes('data-sector="'+sector+'"'),'Missing sector identity '+sector);
 assert.ok(html.includes('class="armada-profile-links"'), 'Missing links to about, experience and full projects '+sector);
 for(const item of ['../../about.html','../../experience.html','../../projects.html','../../story.html']) {
  assert.ok(html.includes('href="'+item+'"'), 'Missing personal background link '+item+' in '+sector);
 }
 assert.ok(html.indexOf('id="evidence"')<html.indexOf('id="approach"'), 'Projects should appear before educational methods '+sector);
 assert.ok(!/Question to ask:|Three questions for the engineering team|A useful 30-second introduction|How I approach this type of problem/.test(html),'Internal interview-preparation text leaked into '+sector);

 assert.ok(html.includes('styles/control-volume.css') && html.includes('styles/claude-exact.css') && html.includes('styles/flux-lab.css'),'Must reuse homepage theme '+sector);
 assert.ok(html.includes('scripts/control-volume.js') && html.includes('scripts/flux-lab.js') && html.includes('scripts/armada-control-volume.js') && html.includes('scripts/armada-engineering-lab.js'),'Missing dynamic shared/sector scripts '+sector);
 assert.ok(html.includes('source') || html.includes('limitations'), 'Missing evidence constraints '+sector);
}
assert.ok(!hub.includes('data-employer='),'Do not expose employer targeting metadata in public site');
const contactLinks=['mailto:abhijithsivaprasadan@gmail.com','https://github.com/abhijith-sivaprasadan','https://www.linkedin.com/in/abhijith-sivaprasadan/'];
for(const route of ['for/armada-2026.html',...sectors.map(x=>'for/armada-2026/'+x+'.html')]){
 const page=read(route);
 assert.ok(page.includes('viewport-fit=cover'),'Missing iOS safe area viewport: '+route);
 assert.ok(page.includes('class="armada-contact-grid"'),'Missing contact panel '+route);
 assert.ok(page.includes('class="armada-footer-nav"'),'Missing accessible footer links '+route);
 const prefix=route==='for/armada-2026.html'?'../':'../../';
 for(const dest of [prefix+'index.html',prefix+'about.html',prefix+'projects.html','#contact']){
  assert.ok(page.includes('href="'+dest+'"'), 'Footer navigation missing '+dest+' in '+route);
 }
 for(const link of contactLinks)assert.ok(page.includes('href="'+link+'"'),'Missing contact link '+link+' in '+route);
}
assert.match(css,/\.cv \.armada-footer\{[^}]*padding-bottom:calc\(44px \+ env\(safe-area-inset-bottom,0px\)\)/,'Footer must explicitly include iOS home-indicator safe area in its bottom padding');
console.log('Armada 2026: validated '+sectors.length+' employer-neutral specialist pages with project and GitHub navigation.');
