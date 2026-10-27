/* Exact Claude portfolio interaction adapters. Layout remains from source pages. */
(()=>{'use strict';
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
function initCases(){
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
 const group=$('[aria-label="Choose modelling lens"]');if(!group)return;
 const buttons=$$('button',group);
 const panel=group.nextElementSibling;
 if(!panel)return;
 const byName={
  'BUILDINGS':{title:'IDA ICE, HOMER Pro and SAM: from building load to system economics',detail:'Hylkysaari island and a Stockholm housing cooperative. Model building demand, renewable supply, storage, heat pumps and scenario economics.',method:'IDA ICE · HOMER Pro · SAM · Excel',link:'projects/hylkysaari-sustainable-tourism.html'},
  'DISPATCH':{title:'Heat-source dispatch under cost and emissions constraints',detail:'Compare CHP, heat pumps, geothermal, thermal storage and electricity-price scenarios.',method:'Python · PuLP · MILP',link:'projects/district-heating-optimisation.html'},
  'SCENARIO':{title:'Energy scenarios with explicit source assumptions',detail:'Demand growth, technology mix, policy assumptions and techno-economic scenario boundaries.',method:'LEAP · OSeMOSYS · PyPSA',link:'projects/germany-energy-economy-analysis.html'},
  'FORECAST':{title:'Heating demand forecasts and chronological evaluation',detail:'Weather and calendar predictors, historical demand evidence and out-of-sample evaluation.',method:'Python · scikit-learn · LightGBM · XGBoost',link:'projects/heating-demand-forecasting.html'},
  'GRID':{title:'Grid-flexibility and contingency screening',detail:'Representative distribution-grid scenarios, power flows and bounded N-1 studies.',method:'PyPSA · Python · network constraints',link:'projects/distribution-grid-study.html'}
 };
 buttons.forEach(btn=>{const key=(btn.textContent||'').trim().toUpperCase();btn.addEventListener('click',()=>{
  buttons.forEach(b=>{const active=b===btn;b.setAttribute('aria-pressed',String(active));b.style.background=active?'#65d6c9':'transparent';b.style.color=active?'#071007':'#c9cfc6';});
  const d=byName[key];if(!d)return;const headings=$$('h3,h2',panel),paragraphs=$$('p',panel),links=$$('a',panel);
  if(headings.length)headings[0].textContent=d.title;
  if(paragraphs.length)paragraphs[0].textContent=d.detail;
  const target=links.find(a=>a.href.includes('projects/'));if(target)target.href=d.link;
  panel.dataset.activeLens=key.toLowerCase();
  // Method is named for readers even when source card has a separate method row.
  const method=$('[data-cv-current-method]',panel);if(method)method.textContent=d.method;
 });});
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
