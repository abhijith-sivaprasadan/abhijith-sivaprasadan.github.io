/* Six self-contained, educational engineering probes for Armada 2026.
 * Original analytical examples with transparent formulas, no external or industrial measurements.
 * Not simulations of any employer plant, product or project. Accessible ranges + SVG output.
 */
(()=>{
'use strict';
const configs={
 'thermal-test':{
   title:'Flow loss under a fixed geometry',kind:'QUADRATIC FLOW SCALING',symbol:'Δp / Δp₀',
   x:{name:'Flow ratio',unit:'× reference',min:0.30,max:2,step:0.05,value:1},
   y:{name:'Resistance ratio',unit:'× reference K',min:0.50,max:2.50,step:0.10,value:1},
   xLabel:'Flow ratio (ṁ/ṁ₀)',formula:'Δp/Δp₀ = (K/K₀) × (ṁ/ṁ₀)²',suffix:'×',
   calculate:(x,y)=>({value:y*x*x,details:['Fixed density and effective flow area','Turbulent-flow quadratic-loss approximation','Relative index only; no measured pressure drop']}),
   caution:'This is a dimensionless constant-density loss-scaling illustration, not a compressible CFD result or calibrated reducer prediction. K may change with Reynolds number, geometry, temperature and choking.'
 },
 'power-grids':{
   title:'One-hour grid power balance',kind:'GENERATION / STORAGE / IMPORT',symbol:'Pimport',
   x:{name:'Available renewable power',unit:'MW',min:0,max:140,step:5,value:55},
   y:{name:'Available stored energy',unit:'MWh',min:0,max:50,step:5,value:20},
   xLabel:'Available renewable (MW)',formula:'Pimport = max[0, 100 − Prenew − min(Estored/1h, max(0, 100 − Prenew))]',suffix:'MW',
   calculate:(r,e)=>{const demand=100,deliver=Math.min(e,Math.max(0,demand-r)),imp=Math.max(0,demand-r-deliver),spill=Math.max(0,r-demand);return {value:imp,details:[`Illustrative demand: 100 MW for one hour`,`Battery delivers: ${deliver.toFixed(1)} MW`,`Curtailment: ${spill.toFixed(1)} MW; idealised battery`]};},
   caution:'One-hour ideal lossless dispatch arithmetic at a fixed 100 MW demand, with no network constraints, efficiency loss, charging, power limits beyond energy/1h, or operational validation. Not a grid planning forecast.'
 },
 'industrial-heat':{
   title:'Reversible heat-pump COP bound',kind:'THERMODYNAMIC UPPER LIMIT',symbol:'COPCarnot',
   x:{name:'Source temperature',unit:'°C',min:10,max:65,step:1,value:35},
   y:{name:'Heat-delivery temperature',unit:'°C',min:80,max:180,step:5,value:120},
   xLabel:'Source temperature (°C)',formula:'COPCarnot = (Th + 273.15) / (Th − Tc)',suffix:'COP',
   calculate:(tc,th)=>({value:(th+273.15)/(th-tc),details:[`Temperature lift: ${(th-tc).toFixed(0)} K`,'Reversible ideal heat-pump limit','Real machines require compressor, HX and operating-envelope checks']}),
   caution:'A theoretical maximum COP, not measured or predicted HTHP performance. No losses, finite heat exchanger approach, pressure drop, compressor map, refrigerant constraints or electricity auxiliaries are included.'
 },
 'mechanical-structures':{
   title:'Nominal axial stress check',kind:'IDEALISED STRUCTURAL CALCULATION',symbol:'σnom',
   x:{name:'Axial force',unit:'kN',min:10,max:160,step:5,value:50},
   y:{name:'Gross cross-section',unit:'mm²',min:200,max:1000,step:50,value:500},
   xLabel:'Axial force (kN)',formula:'σnom [MPa] = 1000 × F [kN] / A [mm²]',suffix:'MPa',
   calculate:(force,area)=>({value:1000*force/area,details:[`Cross-section: ${area.toFixed(0)} mm²`,'Uniform axial force and net-section approximation','No hole, bending, buckling, plasticity or stress concentrations']}),
   caution:'Idealised uniaxial bar arithmetic only. It is not the ANSYS support-plate result, a certified stress design, a code check or qualification of any nuclear/aerospace component.'
 },
 'software-research':{
   title:'Conservation-test fault injection',kind:'CAN A ZERO RESIDUAL HIDE A FAULT?',symbol:'|R|',
   x:{name:'Injected error amplitude',unit:'MWh',min:0,max:20,step:1,value:10},
   y:{name:'Compensating error fraction',unit:'%',min:0,max:100,step:5,value:0},
   xLabel:'Injected fault amplitude (MWh)',formula:'|R| = |Ein − (Eout + compensating error)|',suffix:'MWh',
   calculate:(error,comp)=>{const residual=error*(1-comp/100);return{value:residual,details:[`True input: 100 MWh; observable output: ${(100-residual).toFixed(1)} MWh`,`One absolute-balance threshold: 1 MWh → ${residual<=1?'PASSES':'FLAGS'}`,comp>=99?'Compensating errors hide the injected fault':'A nonzero residual can reveal an unbalanced fault']};},
   caution:'Purpose-built analytical negative control, not an externally validated EnerLint benchmark or a certification claim. Passing a single balance check cannot establish a correct internal model.'
 },
 'engineering-consulting':{
   title:'Simple energy project economics',kind:'SCREENING, NOT INVESTMENT APPROVAL',symbol:'€ / yr',
   x:{name:'Annual baseline energy',unit:'MWh/yr',min:100,max:1200,step:50,value:500},
   y:{name:'Assumed energy reduction',unit:'%',min:1,max:20,step:1,value:10},
   xLabel:'Baseline energy (MWh/year)',formula:'Annual gross saving = Ebaseline × reduction × €100/MWh',suffix:'€/yr',
   calculate:(baseline,reduction)=>{const saving=baseline*reduction/100*100,payback=saving>0?50000/saving:NaN;return{value:saving,details:['Assumed flat energy price: €100/MWh',`Illustrative installed CAPEX: €50,000; simple payback: ${payback.toFixed(1)} years`,'No OPEX, degradation, discounting, taxes or uncertainty model']};},
   caution:'Hypothetical simple-payback example using fixed illustrative €50,000 CAPEX and €100/MWh price. It is not manufacturer-backed cost evidence, an industrial case or a discounted-cash-flow investment conclusion.'
 }
};
const ns='http://www.w3.org/2000/svg';
const fmt=(v,suffix)=>suffix==='€/yr'?Math.round(v).toLocaleString('en-US'):(Math.abs(v)<10?v.toFixed(2):v.toFixed(1));
function create(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function run(){
 const s=document.body.dataset.sector,conf=configs[s];
 if(!conf)return;
 const anchor=document.querySelector('#approach #method-console');
 if(!anchor)return;
 const section=create('div','armada-physics cs');
 section.id='armada-live-probe';section.dataset.probe='LIVE EDUCATIONAL PROBE / NOT A FIELD MEASUREMENT';
 section.innerHTML=`
  <div class="armada-physics-header">
    <span class="armada-console-kicker">NUMERICAL INSTRUMENT / ORIGINAL ANALYTICAL EXAMPLE</span>
    <h3>${conf.title}</h3>
    <p class="armada-physics-small">${conf.kind} · deterministic arithmetic only</p>
  </div>
  <div class="armada-physics-layout">
   <div class="armada-physics-controls">
     <label for="armada-probe-x">${conf.x.name} <output data-xvalue></output></label>
     <input type="range" id="armada-probe-x" min="${conf.x.min}" max="${conf.x.max}" step="${conf.x.step}" value="${conf.x.value}">
     <label for="armada-probe-y">${conf.y.name} <output data-yvalue></output></label>
     <input type="range" id="armada-probe-y" min="${conf.y.min}" max="${conf.y.max}" step="${conf.y.step}" value="${conf.y.value}">
     <button class="armada-probe-reset" type="button">RESET REFERENCE CASE ↻</button>
     <div class="armada-physics-formula"><strong>Analytical relation</strong><code></code></div>
   </div>
   <div class="armada-physics-display">
     <div class="armada-physics-metric"><span class="armada-console-kicker">${conf.symbol} / RESPONSE</span><strong data-result>–</strong><span data-units></span></div>
     <svg data-chart viewBox="0 0 620 215" role="img" aria-label="Calculated response curve as the first input changes with the second input fixed.">
       <g class="armada-chart-grid">
         <line x1="52" y1="20" x2="52" y2="171"/><line x1="52" y1="171" x2="599" y2="171"/>
         <line x1="52" y1="96" x2="599" y2="96" stroke-dasharray="3 6"/>
         <line x1="52" y1="20" x2="599" y2="20" stroke-dasharray="3 6"/>
       </g>
       <path class="armada-physics-curve" d=""/>
       <line class="armada-physics-cursor" x1="52" y1="20" x2="52" y2="171"/>
       <circle class="armada-physics-dot" cx="52" cy="171" r="6"/>
       <text data-plot-start x="54" y="195"></text>
       <text data-plot-end x="596" y="195" text-anchor="end"></text>
       <text data-plot-label x="325" y="212" text-anchor="middle"></text>
       <text data-max-label x="45" y="28" text-anchor="end"></text>
       <text data-min-label x="45" y="170" text-anchor="end">0</text>
     </svg>
     <p class="armada-physics-reading" data-calculation-details></p>
   </div>
  </div>
  <p class="armada-physics-boundary"><strong>Boundary / validity:</strong> ${conf.caution}</p>`;
 anchor.insertAdjacentElement('afterend',section);
 const a=section.querySelector('#armada-probe-x'),b=section.querySelector('#armada-probe-y');
 section.querySelector('.armada-physics-formula code').textContent=conf.formula;
 section.querySelector('[data-plot-start]').textContent=conf.x.min;
 section.querySelector('[data-plot-end]').textContent=conf.x.max;
 section.querySelector('[data-plot-label]').textContent=conf.xLabel;
 const result=section.querySelector('[data-result]'),dot=section.querySelector('.armada-physics-dot'),cursor=section.querySelector('.armada-physics-cursor'),curve=section.querySelector('.armada-physics-curve');
 function paint(){
   const x=Number(a.value),y=Number(b.value),value=conf.calculate(x,y);
   section.querySelector('[data-xvalue]').textContent=x+' '+conf.x.unit;
   section.querySelector('[data-yvalue]').textContent=y+' '+conf.y.unit;
   result.textContent=fmt(value.value,conf.suffix);
   section.querySelector('[data-units]').textContent=conf.suffix;
   section.querySelector('[data-calculation-details]').replaceChildren(...value.details.map((v,i)=>{
      const line=create('span','armada-detail',v);line.dataset.probe='MODEL ASSUMPTION / '+(i+1);return line;
   }));
   const points=Array.from({length:55},(_,i)=>{const px=conf.x.min+(conf.x.max-conf.x.min)*(i/54);return [px,conf.calculate(px,y).value];});
   const max=Math.max(0.001,...points.map(p=>p[1]))*1.08;
   const scaledX=v=>52+(v-conf.x.min)/(conf.x.max-conf.x.min)*547;
   const scaledY=v=>171-Math.min(1,Math.max(0,v/max))*151;
   curve.setAttribute('d',points.map((p,i)=>(i?'L':'M')+scaledX(p[0]).toFixed(2)+' '+scaledY(p[1]).toFixed(2)).join(' '));
   const cx=scaledX(x),cy=scaledY(value.value);
   dot.setAttribute('cx',cx.toFixed(2));dot.setAttribute('cy',cy.toFixed(2));cursor.setAttribute('x1',cx.toFixed(2));cursor.setAttribute('x2',cx.toFixed(2));
   section.querySelector('[data-max-label]').textContent=fmt(max,conf.suffix);
 }
 a.addEventListener('input',paint);b.addEventListener('input',paint);
 section.querySelector('.armada-probe-reset').addEventListener('click',()=>{a.value=conf.x.value;b.value=conf.y.value;paint();a.focus();});
 paint();
 if(window.ControlVolume)window.ControlVolume.register('probe','reset analytical engineering probe',()=>{a.value=conf.x.value;b.value=conf.y.value;paint();return 'analytical probe reset to reference case';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
