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
assert.ok(css.includes('@media(max-width:630px)'), 'Missing responsive layout');
assert.ok(hub.includes('id="armada-company-search"'), 'Missing employer search input');
assert.ok(hub.includes('id="armada-search-status"'), 'Missing accessible search status');
assert.ok(hub.includes('Official Armada 2026 exhibitor list'), 'Missing authoritative source label');
const titles = new Set(),companyIds = new Map();
for (const sector of sectors) {
 const route = 'for/armada-2026/' + sector + '.html';
 const html = read(route);
 assert.ok(hub.includes('href="armada-2026/' + sector + '.html"'), 'Hub missing route '+sector);
 const title = html.match(/<h1>([^<]+)<\/h1>/);
 assert.ok(title && !titles.has(title[1]), 'Missing/distinct sector headline: '+sector);
 titles.add(title[1]);
 for (const anchor of ['id="evidence"','id="employers"','id="contact"','id="contribution"']) {
  assert.ok(html.includes(anchor), 'Missing '+anchor+' in '+sector);
 }
 assert.ok(html.includes('href="../../styles/armada-2026.css') || html.includes('href="../styles/armada-2026.css'), 'Styles missing: '+sector);
 const evidenceCount = (html.match(/class="evidence-card"/g)||[]).length;
 assert.ok(evidenceCount >= 4, 'Sector lacks differentiated evidence '+sector);
 const ids=[...html.matchAll(/class="company-card" id="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(ids.length>=4, 'Sector lacks employer focus: '+sector);
 assert.equal(new Set(ids).size,ids.length,'Duplicate employer anchor: '+sector);
 companyIds.set(sector,new Set(ids));
 assert.ok(html.includes('data-sector="'+sector+'"'),'Missing sector identity '+sector);
 assert.ok(html.includes('styles/control-volume.css') && html.includes('styles/claude-exact.css') && html.includes('styles/flux-lab.css'),'Must reuse homepage theme '+sector);
 assert.ok(html.includes('scripts/control-volume.js') && html.includes('scripts/flux-lab.js') && html.includes('scripts/armada-control-volume.js') && html.includes('scripts/armada-engineering-lab.js'),'Missing dynamic shared/sector scripts '+sector);
 assert.ok(html.includes('source') || html.includes('limitations'), 'Missing evidence constraints '+sector);
}
let n=0;
for (const m of hub.matchAll(/<a data-employer="[^"]+" data-sector="([^"]+)" href="armada-2026\/([^".]+)\.html#([^"]+)"/g)) {
 n++;
 assert.equal(m[1],m[2], 'Search entry/route mismatch');
 assert.ok(companyIds.get(m[1])?.has(m[3]), 'Company deep-link missing target '+m[3]);
}
assert.ok(n>=30, 'Too few employer deep-links');
assert.ok(hub.includes('aria-live="polite"') && hub.includes("input.addEventListener('input',update)"),'Lookup must work without backend calls');
console.log('Armada 2026: validated '+sectors.length+' unique specialist pages and '+n+' company deep-links.');
