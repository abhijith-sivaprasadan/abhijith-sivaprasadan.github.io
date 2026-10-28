// Published source of truth: KTH thesis TRITA-ITM-EX 2026:14 (Tables 4.2, 4.4, 4.6, 4.7).
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const html = fs.readFileSync("projects/siemens-thesis.html","utf8");
const crypto = require("node:crypto");
assert.equal(
 crypto.createHash("sha256").update(fs.readFileSync("assets/thesis/FULLTEXT01.pdf")).digest("hex"),
 "75bfe0db65c486eef2f8423b5f70dd9b51199bad43daaa2090aef13ccb080550",
 "Published KTH thesis PDF fingerprint has changed"
);
assert(html.includes('href="../assets/thesis/FULLTEXT01.pdf"'),"Direct thesis PDF link is missing");
assert(html.includes('name="citation_pdf_url" content="https://abhijith-sivaprasadan.github.io/assets/thesis/FULLTEXT01.pdf"'),
       "Scholarly PDF metadata does not reference the direct primary-source PDF");

const script = fs.readFileSync("scripts/thesis-charts.js","utf8");
const match = script.match(/  var chartDefinitions = \{[\s\S]*?\n  \};/);
assert(match, "Missing chart definitions");
const data = JSON.parse(JSON.stringify(vm.runInNewContext(
  "(function(){var axis={line:'line',bar:'bar'};"+match[0]+"return chartDefinitions;})()"
)));
const expected = {
 meshPressure:[[36214,36285,35797],[38810,39146,39387]],
 meshMach:[[1.0099,1.0148,1.0164],[0.9888,0.9903,0.9887]],
 chtPressure:[[8777,24752,36720],[9114,25319,37810]],
 chtMach:[[0.412,0.767,1.006],[0.352,0.674,0.990]],
 heatLoss:[[18.59,18.93,18.88],[53.36,56.58,57.21]],
 outletTemp:[[657.29,629.34,585.45],[649.49,624.59,582.10]],
 flux:[[3230,3288,3279],[2768,2935,2967]],
 outletGap:[[7.8,4.75,3.36,-1.24]]
};
assert.deepEqual(Object.keys(data).sort(),Object.keys(expected).sort());
for (const [name, series] of Object.entries(expected)){
 assert.deepEqual(data[name].datasets.map(d=>d.data),series,"Incorrect published data for "+name);
 assert(html.includes('data-chart-id="'+name+'"'),"Missing chart: "+name);
}
assert.equal([...html.matchAll(/data-chart-id="/g)].length,8);
for (const term of ["22x pressure-loss reduction","3,688 Pa","168 Pa","96,312 Pa","Ma 0.908","much lower total pressure loss","calibration confidence improves","pressure-drop reduction is simulation-indicated"]) {
 assert(!html.toLowerCase().includes(term.toLowerCase()),"Outdated HTML claim: "+term);
 assert(!script.toLowerCase().includes(term.toLowerCase()),"Outdated chart claim: "+term);
}
for (const filename of ["api/projects.json","api/linkedin-projects.json","backend/data/projects.json"]) {
 const obj=JSON.parse(fs.readFileSync(filename,"utf8"));
 const item=obj.projects.find(p=>p.id==="siemens-thesis");
 assert(item,"Siemens project missing in "+filename);
 assert(!item.highlights.join(" ").includes("thermal test work up to 700°C"),
        "Uncompleted experimental validation misrepresented: "+filename);
 assert(item.highlights.join(" ").includes("not completed"),
        "Missing lab-validation boundary in "+filename);
}

const overview=fs.readFileSync("projects.html","utf8");
assert(!overview.includes("during 700&deg;C testing"),
       "Projects overview must not claim the cancelled validation happened");
assert(!overview.includes("discretisation error below 2%"),
       "Mesh-refinement change is not a measured discretisation error bound");
assert(overview.includes('id="cv-case-list"') || overview.includes("baseline-to-fine changes below 2%"),
       "Projects overview must either be source-driven or state the numerical sensitivity correctly");
const detail=fs.readFileSync("experience/siemens-energy.html","utf8");
assert(detail.includes("guidance from industrial supervisor Jonas Deurell"),
       "RCA responsibility and supervisory guidance must be distinguishable");
const retired=[
 "biot_proof_and_insulation_effect.html",
 "legacy_reducer_flow_profiles.html",
 "mesh_independence_study.html",
 "reducer_comparison_flow_profiles.html",
 "solver_convergence_both_geometries.html",
 "thesis_charts_branded.html",
 "wall_temperature_comparison.html",
 "yplus_and_temperature_comparison.html"
];
for(const name of retired){
 assert(!fs.existsSync("assets/thesis/"+name),"Unverified, orphaned chart fragment republished: "+name);
}
const title=fs.readFileSync("experience.html","utf8");
assert(title.includes("Master's thesis researcher") || title.includes("Master's Thesis Researcher — Test Engineering &amp; CFD"),
       "Siemens thesis role must be distinguished from a formal Test Engineer appointment");

console.log("Verified eight charts, published thesis boundaries, Siemens portfolio pages and retired chart fragments.");
