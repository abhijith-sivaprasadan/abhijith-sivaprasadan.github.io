/* Exact Claude portfolio interaction adapters. Layout remains from source pages. */
(()=>{'use strict';
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
function initCases(){
 if(document.getElementById('cv-case-list'))return; // Complete API catalogue owns its filters.
 const group=$('[aria-label="Filter cases by method"]'); if(!group)return;
 const buttons=$$('button',group),rows=$$('[data-cv-case]'),readout=$('[data-cv-case-count]');
 const classify=el=>(el.getAttribute('data-cv-case-category')||el.getAttribute('data-probe')||'').toUpperCase();
 buttons.forEach(button=>{const value=(button.textContent||'').trim().toUpperCase();button.dataset.cvFilter=value;
  button.setAttribute('aria-pressed',String(value==='ALL'));
  button.addEventListener('click',()=>{let shown=0;
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   rows.forEach(row=>{const actual=classify(row);const alias=value==='ENERGY MANAGEMENT'&&actual.includes('INDUSTRIAL');
      const visible=value==='ALL'||actual.includes(value)||alias;row.hidden=!visible;if(visible)shown++;});
   if(readout)readout.textContent=shown+' OF '+rows.length+' CASES · EVIDENCE & LIMITS LINKED';
  });
 });
 if(readout)readout.textContent=rows.length+' OF '+rows.length+' CASES · EVIDENCE & LIMITS LINKED';
}
function initEnergy(){
 // The authored Claude board uses aria-label="Modelling lens".
 const group=$('[aria-label="Modelling lens"],[aria-label="Choose modelling lens"]');
 if(!group)return;
 const panel=group.nextElementSibling;
 if(!panel||!panel.matches('article'))return;
 const buttons=$$('button',group);
 const head=$('h3',panel),link=$('a[href]',panel);
 const labels=['01 · BOUNDARY','02 · METHOD','03 · EVIDENCE','04 · RESIDUAL'];
 const rows=[...panel.querySelectorAll('div')].filter(el=>labels.includes(el.firstElementChild?.textContent?.trim()) && el.children.length===2);
 if(rows.length!==4||!head||!link)return;
 const elements=Object.fromEntries(rows.map(row=>[row.firstElementChild.textContent.trim(),row.lastElementChild]));
 // Keep the approved Buildings copy, and restore it if a visitor reselects it.
 const initial={
  title:head.textContent,boundary:elements[labels[0]].textContent,
  method:elements[labels[1]].textContent,evidence:elements[labels[2]].textContent,
  residual:elements[labels[3]].textContent,url:link.getAttribute('href'),cta:link.textContent
 };
 const byName={
  BUILDINGS:initial,
  DISPATCH:{
   title:'Heat-source dispatch under cost and emissions constraints',
   boundary:'District-heating load and heat-source allocation under technology capacity, price and storage assumptions.',
   method:'Python · PuLP · linear dispatch modelling · constrained scenario optimisation',
   evidence:'Dispatch, cost and emissions comparisons from the documented optimisation scenarios.',
   residual:'Modelled scenarios, not measured plant operation or a commissioned dispatch controller.',
   url:'projects/district-heating-optimisation.html',cta:'OPEN THE DISTRICT HEATING CASE →'
  },
  SCENARIO:{
   title:'Energy-system scenarios with explicit source assumptions',
   boundary:'Comparative energy-system pathways conditioned on demand, technology and policy assumptions.',
   method:'LEAP · OSeMOSYS · PyPSA · scenario modelling',
   evidence:'Modelled scenario comparisons for documented assumptions and system boundaries.',
   residual:'Scenarios are conditional model results, not forecasts of realised energy-system outcomes.',
   url:'projects/germany-energy-economy-analysis.html',cta:'OPEN THE SCENARIO CASE →'
  },
  FORECAST:{
   title:'Heating demand forecasting and out-of-sample evaluation',
   boundary:'Building heating demand and its relationship to weather, calendar and historical-load predictors.',
   method:'Python · machine-learning modelling · holdout evaluation as described in the case',
   evidence:'Training and test comparisons within the documented forecasting exercise.',
   residual:'Dataset-bounded academic evaluation; no real-world forecasting deployment is claimed.',
   url:'projects/heating-demand-forecasting.html',cta:'OPEN THE FORECAST CASE →'
  },
  GRID:{
   title:'Distribution-grid scenarios and contingency screening',
   boundary:'Representative distribution-network loading, electric-vehicle scenarios and N-1 contingency cases.',
   method:'Python · power-flow modelling · time-series cases · N-1 screening',
   evidence:'Power-flow and contingency results under the stated representative network assumptions.',
   residual:'Representative network study, not a validation against an operational utility network.',
   url:'projects/distribution-grid-study.html',cta:'OPEN THE GRID CASE →'
  }
 };
 function activate(key,animate){
  const data=byName[key];if(!data)return;
  for(const b of buttons){
   const selected=b.textContent.trim().toUpperCase()===key;
   b.setAttribute('aria-pressed',String(selected));
   b.style.background=selected?'#9bd69f':'transparent';
   b.style.color=selected?'#071007':'#c9cfc6';
   b.style.borderColor=selected?'#9bd69f':'#2d3a31';
  }
  head.textContent=data.title;
  for(const [index,field] of ['boundary','method','evidence','residual'].entries()){
   elements[labels[index]].textContent=data[field];
  }
  link.href=data.url;link.textContent=data.cta;
  panel.dataset.activeLens=key.toLowerCase();
  panel.dataset.probe='LENS · '+key;
  panel.setAttribute('aria-live','polite');
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   panel.classList.remove('swap0','swap1');
   void panel.offsetWidth;
   panel.classList.add('swap1');
  }
 }
 for(const b of buttons)b.addEventListener('click',()=>activate(b.textContent.trim().toUpperCase(),true));
 activate('BUILDINGS',false);
}
function init(){initCases();initEnergy();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* Site-wide Control Volume discovery: real links, in normal document flow.
   Same map on every primary page and all 40 project dossiers. */
(()=>{
'use strict';
const page=document.body;
if(!page||!page.classList.contains('cv'))return;
const root=location.pathname.includes('/projects/')?'../':'';
const url=path=>root+path;
const groups=[
 {title:'The engineering work',items:[['Applied to the site','index.html'],['Cases · full project library','projects.html'],['Research','research.html'],['Energy systems','energy-systems.html'],['Industrial R&D','industrial-rd.html'],['Professional record','experience.html']]},
 {title:'Beyond the boundary',items:[['About','about.html'],['The path · story','story.html'],['Courses','courses.html'],['Ideas','ideas.html'],['Interests','interests.html'],['Hobbies','hobbies.html']]},
 {title:'Evidence & tools',items:[['Skills & methods','skills/index.html'],['Research tracks','tracks/index.html'],['Reports & PDFs','reports.html'],['Control-volume laboratory','labs/control-volume.html'],['CET 2026','cet2026/'],['Contact card','tap/']]}
];
const a=(label,path,cls)=>{const e=document.createElement('a');e.textContent=label;e.href=url(path);if(cls)e.className=cls;return e};
const header=document.querySelector('.pg>header');
if(header&&!document.querySelector('.cv-discovery')){
 const details=document.createElement('details');details.className='cv-discovery';
 const summary=document.createElement('summary');summary.textContent='EXPLORE THE WHOLE SITE';details.append(summary);
 const content=document.createElement('div');content.className='cv-discovery-content';
 groups.forEach(g=>{const column=document.createElement('section');column.className='cv-discovery-column';const heading=document.createElement('h2');heading.textContent=g.title;column.append(heading);g.items.forEach(([name,path])=>column.append(a(name,path)));content.append(column)});
 details.append(content);
 header.insertAdjacentElement('afterend',details);
}
if(page.dataset.pageKey==='applied'&&!document.getElementById('cv-site-directory')){
 const main=document.querySelector('.pg main');
 if(main){
 const section=document.createElement('section');section.id='cv-site-directory';section.className='cv-site-directory';
 const kicker=document.createElement('p');kicker.className='cv-directory-eyebrow';kicker.textContent='S8 · DISCOVERY / THE OPEN BOUNDARY';section.append(kicker);
 const head=document.createElement('div');head.className='cv-directory-head';
 const title=document.createElement('h2');title.textContent='Keep exploring.';const desc=document.createElement('p');desc.textContent='The case studies are only one part of the control volume. Follow an interest, inspect the methods, or step outside the engineering boundary.';head.append(title,desc);section.append(head);
 const cols=document.createElement('div');cols.className='cv-directory-grid';
 for(const group of groups){const col=document.createElement('div');col.className='cv-directory-column';const h=document.createElement('h3');h.textContent=group.title;col.append(h);
  for(const [label,path] of group.items){const link=a(label,path);const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');link.append(arrow);col.append(link)}cols.append(col)}
 section.append(cols);main.append(section);
 }
}
const here=location.pathname.replace(/\/index\.html$/,'/').split('/').filter(Boolean).pop()||'index.html';
document.querySelectorAll('.cv-discovery a,.cv-site-directory a').forEach(link=>{
 if(link.getAttribute('href').split('/').pop()===here)link.setAttribute('aria-current','page')
});
})();


/* Reconnect contextual references on the original Claude pages to the real evidence.
   Target explicit proper names and project titles; never auto-link ordinary science text. */
(()=>{
'use strict';
if(!document.body?.classList.contains('cv')||document.body.classList.contains('cv-case-page'))return;
const refs=[
 ['Siemens Energy thesis','projects/siemens-thesis.html'],
 ['Siemens thesis','projects/siemens-thesis.html'],
 ['Kerala2040','projects/kerala2040.html'],
 ['ThermoTwin-F','projects/thermotwin-f.html'],
 ['GridGuardPINN','projects/gridguardpinn.html'],
 ['SynthSift','projects/synthsift.html'],
 ['EnerLint','projects/enerlint.html'],
 ['ResidualPathways','projects/residual-pathways.html'],
 ['PathwaysHub','projects/pathways-hub.html'],
 ['OpenSteamOpt','projects/opensteamopt.html'],
 ['GB-FLEXABM','projects/gb-flexabm.html'],
 ['Industrial energy KPI toolkit','projects/industrial-energy-kpi-toolkit.html'],
 ['Industrial energy performance mapping','projects/alleima-energy-efficiency.html'],
 ['District heating dispatch optimisation','projects/district-heating-optimisation.html'],
 ['Heating demand forecasting','projects/heating-demand-forecasting.html'],
 ['Distribution grid study','projects/distribution-grid-study.html'],
 ['Structural FEA','projects/structural-fea-reactor-internals.html'],
 ['Battery cell discharge','projects/battery-cell-discharge-lab.html'],
 ['Research engagement, pyrolysis','experience/kth-pyrolysis.html'],
 ['Energy efficiency intern','experience/alleima.html'],
 ['Backend engineer','experience/qburst.html'],
 ["Master's thesis researcher",'experience/siemens-energy.html'],
];
function linkMentions(){
 const main=document.querySelector('.pg main');if(!main)return;
 const used=new Set();
 for(const box of main.querySelectorAll('h2,h3,p,li')){
  if(box.closest('a,button,[data-cv-toy],svg,[aria-live],.cv-site-directory'))continue;
  const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   if(!node.isConnected||node.parentElement?.closest('a,button,code,pre,svg'))continue;
   const text=node.nodeValue||'';
   const pick=refs.find(([label])=>!used.has(label)&&text.toLowerCase().includes(label.toLowerCase()));
   if(!pick)continue;
   const [label,target]=pick;const pos=text.toLowerCase().indexOf(label.toLowerCase());
   const element=document.createElement('a');element.className='cv-context-link';element.href=target;
   element.title='Open published evidence: '+label;element.textContent=text.slice(pos,pos+label.length);
   const frag=document.createDocumentFragment();
   frag.append(document.createTextNode(text.slice(0,pos)),element,document.createTextNode(text.slice(pos+label.length)));
   node.replaceWith(frag);used.add(label);
  }
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',linkMentions,{once:true});else linkMentions();
})();
