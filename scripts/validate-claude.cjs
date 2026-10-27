const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','projects.html','research.html','energy-systems.html','industrial-rd.html','experience.html','about.html','courses.html','ideas.html','interests.html','hobbies.html','404.html','story.html'];
for(const p of pages){
 const s=read(p);
 assert.ok(s.includes('data-design-source="claude-control-volume-v1"'),p+' missing approved page');
 assert.ok(s.includes('class="pg"'),p+' missing authored composition');
 for(const asset of ['styles/claude-exact.css','scripts/claude-exact.js','scripts/control-volume.js'])assert.ok(s.includes(asset),p+' missing '+asset);
 assert.ok(!s.includes('styles/v4.css')&&!s.includes('styles/portfolio.css'),p+' still wraps old site');
}
const home=read('index.html');
for(const x of ['Heat.','Power.','Code.','data-cv-toy="heat-field"','data-cv-toy="mesh"','data-cv-toy="year"','data-cv-year-day','https://orcid.org/0009-0009-8429-1266'])assert.ok(home.includes(x),'S1 missing '+x);
const projects=read('projects.html'),api=JSON.parse(read('api/projects.json'));
assert.ok(projects.includes('id="cv-case-list"')&&projects.includes('scripts/claude-cases.js'),'S3 missing live cases');
for(const x of ['CFD / CHT','STRUCTURAL','ENERGY SYSTEMS','GRID','SOFTWARE'])assert.ok(projects.includes(x),'S3 missing '+x);
const cases=api.projects.filter(p=>p.status==='published'&&/^projects\/[a-z\d-]+\.html$/.test(p.caseStudyUrl||''));
assert.ok(cases.length>=30,'Published case index unexpectedly small');
for(const p of cases)assert.ok(fs.existsSync(path.join(root,p.caseStudyUrl)),p.id+' missing case URL');
assert.ok(read('scripts/claude-cases.js').includes("fetch('api/projects.json'"),'Cases must be source-driven');
assert.ok(read('research.html').includes('data-cv-toy="biot"'),'Research Biot toy missing');
assert.ok(!read('scripts/control-volume.js').includes("out(root, 'monlabel').setAttribute"),'Overlapping annual diagram regression');
const story=read('story.html');
for(const hook of ['data-cv-toy="cycle"','data-out="title"','data-out="text"','data-stages='])
 assert.ok(story.includes(hook),'Story cycle missing '+hook);
assert.equal((story.match(/data-out="dot"/g)||[]).length,2,'Both story-cycle markers must move');
console.log('Claude documents:',pages.length,'pages and',cases.length,'published project cases');
