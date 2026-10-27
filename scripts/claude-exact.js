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
function initAccessibility(){
 $$('[data-cv-toy="heat-field"]').forEach(field=>{
  if(!field.hasAttribute('tabindex'))field.tabIndex=0;
  field.setAttribute('aria-label','Illustrative temperature field; drag the source with a pointer or use arrow keys.');
  field.addEventListener('keydown',event=>{
   if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
   event.preventDefault();
   const rect=field.getBoundingClientRect();const dx=event.key==='ArrowRight'?16:event.key==='ArrowLeft'?-16:0;
   const dy=event.key==='ArrowDown'?16:event.key==='ArrowUp'?-16:0;
   const center=field.dataset.keyPos?JSON.parse(field.dataset.keyPos):[rect.width/2,rect.height/2];
   const next=[Math.min(rect.width,Math.max(0,center[0]+dx)),Math.min(rect.height,Math.max(0,center[1]+dy))];field.dataset.keyPos=JSON.stringify(next);
   field.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:rect.left+next[0],clientY:rect.top+next[1],pointerId:1}));
   field.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:rect.left+next[0],clientY:rect.top+next[1],pointerId:1}));
  });
 });
}
function init(){initCases();initEnergy();initAccessibility();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
