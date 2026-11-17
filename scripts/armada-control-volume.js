/* Armada employer-specific Control Volume instruments.
 * Reuses site-wide Control Volume / Flux Lab; this layer adds semantic,
 * stateful evidence routing, not fabricated engineering performance data.
 * No backend, telemetry, or tracking. Works with keyboard and reduced motion.
 */
(() => {
  'use strict';
  const doc=document;
  const $$=(selector,scope=doc)=>[...scope.querySelectorAll(selector)];
  const one=(selector,scope=doc)=>scope.querySelector(selector);
  const make=(tag,cls,txt)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const esc=s=>String(s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const stageNames=['BOUNDARY','METHOD','CHECK','DECISION'];
  const sectorMeta={
    'thermal-test': {symbols:['T','p','Ma','Δp'],headline:'CALIBRATION-RIG TO PERFORMANCE EVIDENCE',unit:'THERMAL / TEST',
      notes:[
        'Identify a physical test objective, the calibration rig, operating envelope and instrumentation before applying the CFD model.',
        'Build compressible-flow/thermal models and assess geometry, numerical mesh, heat loss and measurement-chain constraints.',
        'Separate commissioning observations, numerical checks and physical verification. Heater failure limited the completed high-temperature test.',
        'A result can guide further testing or redesign, but the revised reducer was not experimentally validated.'
      ]},
    'power-grids': {symbols:['MW','MWh','N','f'],headline:'SOURCE DATA TO FEASIBLE FLEXIBILITY',unit:'POWER / GRID',
      notes:[
        'Separate real source data, topology assumptions, annual service demands and time-resolution choices.',
        'Represent power flows, generation, BESS state and dispatch with constrained optimisation or power-flow analysis.',
        'Check conservation, power/energy constraints, infeasibility, held-out cases and source-year coverage.',
        'Produce a conditional screening conclusion; no TSO-authorised power-system or connection-capacity claim.'
      ]},
    'industrial-heat': {symbols:['T','Q','COP','EnPI'],headline:'METER BOUNDARY TO QUALIFIED HEAT',unit:'PROCESS HEAT',
      notes:[
        'Define metering boundaries and qualified delivered process heat with its temperature and delivery-time requirement.',
        'Model HTHP, steam, heat recovery or TES with physically credible compressor/HX/flow constraints.',
        'Reconcile energy/exergy, metering readiness, storage temperature and equipment feasibility.',
        'Show only matched-service comparisons; plant savings and CarnotBatteryLab architecture rankings are not validated.'
      ]},
    'mechanical-structures': {symbols:['σ','ε','F','ΔT'],headline:'LOAD CASE TO MECHANICAL VERIFICATION',unit:'MECHANICAL',
      notes:[
        'Define functional requirements, simplified geometry, material properties and defensible load cases.',
        'Solve preliminary FEA/thermal models and inspect stress, displacement and deformation output.',
        'Evaluate mesh convergence, reaction closure, geometry idealisations and missing test measurements.',
        'A screening result informs design review; it does not constitute safety-critical or certified component acceptance.'
      ]},
    'software-research': {symbols:['API','CI','Δ','OOD'],headline:'INPUT CONTRACT TO REPRODUCIBLE SCIENCE',unit:'SOFTWARE',
      notes:[
        'Declare units, physical constraints, schema and input provenance; keep employer code separate from independent projects.',
        'Implement numerical algorithms, APIs, tests and reproducible runner/analysis tooling.',
        'Run known-answer, negative-control, regression and out-of-distribution tests; inspect intentional failures.',
        'Report scope-limited evidence; unit tests and synthetic benchmarks do not establish external physical validation.'
      ]},
    'engineering-consulting': {symbols:['Ω','KPI','QA','Δ'],headline:'CLIENT QUESTION TO INSPECTABLE DELIVERABLE',unit:'CONSULTING',
      notes:[
        'Turn a client brief into clear boundaries, data requests, acceptance criteria and a work package.',
        'Create simple, traceable thermo-fluid, energy or software calculation and document assumptions.',
        'Independently verify balances, assess input quality and record feasibility/uncertainty.',
        'Deliver options with scope and validation limits, not a black-box number presented as a guarantee.'
      ]}
  };
  function icon(type){
    const shapes={
      flame:'<path class="fp" d="M12 22c-4 0-7-2.8-7-6.6 0-3.4 2.4-5.2 3.6-8.4.4 1.8 1.4 3 2.6 3.4C11 6.8 12.6 4 15.4 2c-.4 3 .8 4.8 2 6.6 1.2 1.8 1.6 3.4 1.6 5.2C19 18.6 16 22 12 22z"/><path class="fi" d="M12 21c-1.8 0-3-1.2-3-2.8 0-1.6 1.2-2.6 1.8-4 .6 1 1.4 2 1.4.2-1.2.8-2 1.6-2.6 0 1.6 1.6 2.6 1.6 4.4 0 2.2-1.8 3.4-3.4 3.4z"/>',
      gear:'<circle cx="12" cy="12" r="4"/><path class="gg" d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1m0-14.2L17 7m-10 10-2.1 2.1"/>' ,
      therm:'<path d="M10 4a2 2 0 0 1 4 0v10.3a4 4 0 1 1-4 0z"/><path class="hg" d="M12 9v8" stroke-width="2.4"/><circle cx="12" cy="17.5" r="1.6" fill="currentColor"/>',
      mesh:'<rect x="2.5" y="2.5" width="19" height="19"/><path d="M12 2.5v19M2.5 12h19"/><path class="mr" d="M7.25 2.5v19M16.75 2.5v19M2.5 7.25h19M2.5 16.75h19" stroke-width="0.8"/>',
      wave:'<path class="wv" d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 8 0"/>' ,
      check:'<circle cx="12" cy="12" r="9"/><path class="ck" d="m7 12 3.3 3.5 6.8-7.4"/>'
    };
    const key=shapes[type]?type:'check';
    return '<svg class="gl gl-'+key+'" viewBox="0 0 24 24" aria-hidden="true">'+shapes[key]+'</svg>';
  }
  function decorate(){
    const routeGlyphs=['therm','wave','flame','mesh','gear','check'];
    doc.querySelectorAll('.route-card').forEach((el,i)=>{
      if(el.querySelector('.armada-glyph'))return;
      const wrap=make('span','armada-glyph emo');
      wrap.innerHTML=icon(routeGlyphs[i%routeGlyphs.length]);
      el.prepend(wrap);
      el.dataset.probe='SECTOR '+String(i+1).padStart(2,'0')+' / '+(one('h3',el)?.textContent||'ENGINEERING');
    });
    const sectorGlyphs={'thermal-test':'therm','power-grids':'wave','industrial-heat':'flame','mechanical-structures':'mesh','software-research':'gear','engineering-consulting':'check'};
    const picks=[
      ['.evidence-card','check'],['.company-card','wave'],
      ['.hero-note',sectorGlyphs[doc.body.dataset.sector]||'therm'],['.section-head','mesh']
    ];
    for(const [selector,kind] of picks){
      for(const el of $$(selector)){
        if(el.querySelector('.armada-glyph'))continue;
        const wrap=make('span','armada-glyph emo');
        wrap.innerHTML=icon(kind);
        el.prepend(wrap);
        if(!el.hasAttribute('data-probe'))el.dataset.probe=(el.querySelector('h3,h2')?.textContent || 'INSPECT EVIDENCE').trim().slice(0,48);
      }
    }
    $$('.topbar .brand').forEach(n=>n.dataset.probe='CONTROL VOLUME / ENGINEERING WORK');
  }
  function methodDesk(){
    const sector=doc.body.dataset.sector;
    if(!sector||!sectorMeta[sector])return;
    const meta=sectorMeta[sector];
    const target=one('#approach .method-list');
    if(!target)return;
    const desk=make('section','armada-workbench cs');
    desk.id='method-console';
    desk.setAttribute('aria-label','Interactive engineering method workbench');
    desk.innerHTML=`
      <div class="armada-workbench-title"><span class="emo">${icon('gear')}</span>
        <div><span class="armada-console-kicker">CONTROL VOLUME / ${esc(meta.unit)}</span>
        <h3>Follow the engineering evidence chain.</h3></div>
        <span class="armada-console-live"><span class="dot"></span> REPRESENTATIVE METHOD · NOT A LIVE PLANT</span>
      </div>
      <div class="armada-method-viz">
      <svg class="armada-method-svg" viewBox="0 0 740 180" role="img" aria-label="Conceptual four-step workflow from boundary to decision. The current selection is shown in the readout below.">
        <defs><marker id="armada-flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#65d6c9"/></marker></defs>
        <path class="armada-flow-baseline" d="M90 85 H652" stroke-dasharray="8 9"/>
        <path class="armada-flow-active" d="M90 85 H90" marker-end="url(#armada-flow-arrow)"/>
        ${[0,1,2,3].map((i)=>`<g class="armada-node" data-node="${i}" transform="translate(${90+i*187.3},85)">
          <circle class="armada-node-halo" r="34"/><circle class="armada-node-core" r="24"/>
          <text class="armada-node-symbol" y="5" text-anchor="middle">${esc(meta.symbols[i])}</text>
          <text class="armada-node-title" y="56" text-anchor="middle">${esc(stageNames[i])}</text></g>`).join('')}
      </svg></div>
      <div class="armada-stage-choices" role="group" aria-label="Inspect a stage">
        ${stageNames.map((x,i)=>`<button type="button" data-stage="${i}" aria-pressed="${i===0}"><span class="mono">0${i+1}</span> ${x}</button>`).join('')}
      </div>
      <div class="armada-method-readout" aria-live="polite">
        <span class="micro">INSPECTION CHANNEL / <span data-current-stage>01 BOUNDARY</span></span>
        <p data-stage-note></p>
        <div class="armada-telemetry"><span data-stage-counter></span><span>STATE: SELECT A STAGE</span><span>STATUS: INTERPRETATION ONLY</span></div>
      </div>`;
    target.insertAdjacentElement('afterend',desk);
    const buttons=$$('[data-stage]',desk),notes=meta.notes,bar=one('.armada-flow-active',desk),nodes=$$('.armada-node',desk);
    function choose(i){
      buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
      nodes.forEach((n,j)=>n.classList.toggle('on',j===i));
      one('[data-current-stage]',desk).textContent='0'+(i+1)+' / '+stageNames[i];
      one('[data-stage-note]',desk).textContent=notes[i];
      one('[data-stage-counter]',desk).textContent=meta.headline;
      bar.setAttribute('d','M90 85 H'+(90+(187.3*i)));
      desk.dataset.stage=String(i);
    }
    buttons.forEach((b,i)=>b.addEventListener('click',()=>choose(i)));
    choose(0);
    if(window.ControlVolume)window.ControlVolume.register('stage','show engineering-method stage 1–4',args=>{const idx=Math.max(0,Math.min(3,Number(args||1)-1));choose(idx);return stageNames[idx]+' · '+notes[idx];});
  }
  function evidenceDesk(){
    const container=one('#evidence .evidence-grid');
    if(!container)return;
    const cards=$$('.evidence-card',container);
    if(cards.length<2)return;
    for(const c of cards){
      const tag=one('.tag',c)?.textContent||'';
      c.dataset.evidenceClass=/INDUSTRIAL|PROFESSIONAL/.test(tag)?'industrial':/ACADEMIC|EDUCATIONAL/.test(tag)?'academic':'independent';
    }
    const present=new Set(cards.map(c=>c.dataset.evidenceClass));
    const labels=[['all','ALL EVIDENCE'],['industrial','PROFESSIONAL / INDUSTRIAL'],['independent','INDEPENDENT RESEARCH'],['academic','ACADEMIC']].filter(([key])=>key==='all'||present.has(key));
    const nav=make('div','armada-evidence-switch');
    nav.setAttribute('role','group');nav.setAttribute('aria-label','Filter evidence by provenance');
    nav.innerHTML=labels.map(([val,name])=>'<button type="button" data-class="'+val+'" aria-pressed="'+(val==='all')+'">'+name+'</button>').join('');
    const out=make('p','armada-evidence-count');
    out.setAttribute('aria-live','polite');
    container.before(nav,out);
    function update(type){
      let n=0;
      cards.forEach(card=>{const show=type==='all'||card.dataset.evidenceClass===type;card.hidden=!show;if(show)n++;});
      $$('button',nav).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.class===type)));
      out.textContent=n+' / '+cards.length+' CASES IN THIS VIEW · SOURCE / LIMITS LINKED';
    }
    $$('button',nav).forEach(button=>button.addEventListener('click',()=>update(button.dataset.class)));
    update('all');
  }
  function employerDesk(){
    const grid=one('#employers .companies');
    if(!grid)return;
    const cards=$$('.company-card',grid);
    const label=make('label','armada-find-label','FIND AN EMPLOYER ON THIS PAGE');
    const search=make('input','armada-find-input');
    search.type='search';search.autocomplete='off';search.placeholder='Filter company name or engineering topic…';
    search.id='armada-sector-search';
    label.htmlFor=search.id;
    const status=make('p','armada-evidence-count');
    status.setAttribute('aria-live','polite');
    grid.before(label,search,status);
    let selected=null;
    function filter(){
      const q=search.value.toLocaleLowerCase().trim();
      let n=0;cards.forEach(card=>{
        const show=!q||card.textContent.toLocaleLowerCase().includes(q);
        card.hidden=!show;if(show)n++;
      });status.textContent=n+' / '+cards.length+' EMPLOYERS MATCHING · NOT OPEN-VACANCY DATA';
      if(selected&&!selected.hidden)selected.scrollIntoView({behavior:'instant',block:'nearest'});
    }
    search.addEventListener('input',filter);filter();
    // Deep-link highlights are genuine company/role links, never invented vacancies.
    const hash=decodeURIComponent(location.hash.slice(1));
    const current=hash&&doc.getElementById(hash);
    if(current&&current.classList.contains('company-card')){selected=current;current.classList.add('armada-selected');}
  }
  function hubDesk(){
    const grid=one('#choose .route-grid');
    if(!grid)return;
    const cards=$$('.route-card',grid);
    if(!cards.length)return;
    const desk=make('section','armada-route-desk cs');
    desk.id='route-console';
    desk.setAttribute('aria-label','Interactive recruiter routing console');
    desk.innerHTML=`<div class="armada-workbench-title"><span class="emo">${icon('mesh')}</span>
      <div><span class="armada-console-kicker">RECRUITER ROUTING / SIX ENGINEERING VIEWS</span><h3>Switch technical perspectives.</h3></div>
      <span class="armada-console-live"><span class="dot"></span> CURATED EVIDENCE, NOT AN ALGORITHM-BASED JOB MATCH</span></div>
      <div class="armada-route-layout">
      <div class="armada-route-pick" role="group" aria-label="Choose employer sector"></div>
      <div class="armada-route-inspector" aria-live="polite"><span class="armada-console-kicker">ACTIVE ENGINEERING LENS</span><h4></h4><p></p><p class="armada-route-proof"></p><a class="armada-route-open" href="#">OPEN TECHNICAL BRIEF →</a></div></div>`;
    grid.before(desk);
    const group=one('.armada-route-pick',desk);
    const colors=['thermal','power','heat','mechanical','software','consulting'];
    cards.forEach((card,i)=>{
      const btn=make('button','armada-route-option');
      btn.type='button';btn.dataset.index=String(i);
      btn.dataset.probe='ROUTE '+String(i+1).padStart(2,'0')+' · '+one('h3',card).textContent;
      btn.innerHTML='<span class="armada-route-index">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(one('h3',card).textContent)+'</span><span class="armada-route-indicator" aria-hidden="true">↗</span>';
      group.append(btn);btn.addEventListener('click',()=>choose(i));
    });
    function choose(i){
      const card=cards[i],link=one('a[href^="armada-2026/"]',card);
      $$('button',group).forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
      one('h4',desk).textContent=one('h3',card).textContent;
      one('.armada-route-inspector>p',desk).textContent=one('h3',card)?.nextElementSibling?.textContent||'';
      one('.armada-route-proof',desk).textContent=card.querySelector('p:nth-of-type(2)')?.textContent||'';
      const go=one('.armada-route-open',desk);go.href=link.href;
      desk.dataset.selected=colors[i];
    }
    choose(0);
    if(window.ControlVolume)window.ControlVolume.register('route','inspect recruiter route 1–6',args=>{const idx=Math.max(0,Math.min(5,Number(args||1)-1));choose(idx);return 'route '+(idx+1)+' / '+one('h4',desk).textContent;});
  }
  function start(){
    if(!doc.body?.classList.contains('cv'))return;
    decorate();
    methodDesk();evidenceDesk();employerDesk();hubDesk();
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
