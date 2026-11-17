// Validate public GitHub directory inventory, privacy and project navigation.
// Source-only checks; repository pages must remain usable without JS/API access.
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync('api/public-repositories.json','utf8'));
const html=fs.readFileSync('repositories.html','utf8');
const js=fs.readFileSync('scripts/repository-directory.js','utf8');
assert.equal(data.count,44,'Public repository count should match GitHub inventory on 17 November 2026');
assert.equal(data.repositories.length,data.count,'Repository count metadata mismatch');
assert.equal(new Set(data.repositories.map(x=>x.fullName.toLowerCase())).size,data.count,'Duplicate GitHub repository');
assert.deepEqual(data.owners,['abhijith-sivaprasadan','Open-Energy-Methods','kerala2040'],'Incorrect affiliated owners');
const categories=new Set(['engineering','website','learning','fork']);
for(const repo of data.repositories){
 assert.ok(categories.has(repo.kind),'Unclassified repo '+repo.fullName);
 assert.ok(repo.fullName===repo.owner+'/'+repo.name,'Repository owner/name mismatch '+repo.fullName);
 assert.ok(repo.url==='https://github.com/'+repo.fullName,'Noncanonical public repository '+repo.fullName);
 assert.ok(repo.description.length>=8,'Project description missing '+repo.fullName);
 assert.ok(!/private|job-search|engineerjobcopilot_poc|desktop-tutorial|source-archive/i.test(repo.fullName),'Private repo name accidentally published');
 assert.ok(html.includes('href="'+repo.url+'"'),'Public repo missing from HTML: '+repo.fullName);
 if(repo.caseUrl){
  assert.ok(fs.existsSync(repo.caseUrl),'Missing linked case study for '+repo.fullName);
  assert.ok(html.includes('href="'+repo.caseUrl+'"'),'Missing case-study link '+repo.fullName);
 }
}
assert.ok((html.match(/data-repository\b/g)||[]).length===data.count,'HTML repository-card count differs from inventory');
assert.ok((html.match(/class="repo-entry-source"/g)||[]).length===data.count,'Missing GitHub source links');
assert.ok(!/data-repository[^>]*data-kind="private"/.test(html),'Private items present');
assert.ok(!html.includes('Companies of interest'),'Repository directory should not disclose employer preferences');
assert.ok(html.includes('href="projects.html"'),'Missing engineering case library link');
assert.ok(html.includes('href="https://github.com/Open-Energy-Methods"'),'Missing organisation hub link');
for(const file of ['index.html','projects.html','research.html','energy-systems.html','industrial-rd.html','scripts/claude-exact.js']) {
 assert.ok(fs.readFileSync(file,'utf8').includes('repositories.html'),'Repository directory not discoverable in '+file);
}
assert.ok(js.includes('data-repository')||js.includes('[data-repository]'),'Missing repository-filter implementation');
console.log('PASS: '+data.count+' public GitHub repositories, source integrity, privacy, working local case links and sitewide navigation');
