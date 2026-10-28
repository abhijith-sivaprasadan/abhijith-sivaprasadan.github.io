/* Case dossier interactions: section map + real reading position, no fake controls. */
(()=>{'use strict';
const main=document.getElementById('main');if(!main||!document.body.classList.contains('cv-case-page'))return;
const toc=document.getElementById('cv-case-toc-links');
const headings=[...main.querySelectorAll('h2')].filter(h=>h.textContent.trim().length>1);
const used=new Set();
const slug=s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 -]/g,'').trim().replace(/\s+/g,'-').slice(0,48);
headings.forEach((h,i)=>{
 const name=h.textContent.replace(/\s+/g,' ').trim();let id=h.id||h.closest('[id]')?.id;
 if(!id||used.has(id)){id='case-section-'+(slug(name)||i);let n=2;while(document.getElementById(id))id='case-section-'+slug(name)+'-'+n++;h.id=id}
 used.add(id);
 if(!toc||i>=22)return;
 const a=document.createElement('a');a.href='#'+id;a.textContent=name;a.title=name;toc.append(a);
});
if(toc&&!toc.children.length){toc.parentElement.hidden=true}
const bar=document.querySelector('.cv-case-top-progress');
let queued=false;const draw=()=>{
 const total=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 if(bar)bar.style.transform='scaleX('+Math.min(1,Math.max(0,scrollY/total))+')';
 queued=false;
};
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(draw)}},{passive:true});
draw();
if('IntersectionObserver' in window&&toc&&toc.children.length){
 const links=[...toc.querySelectorAll('a')];const observer=new IntersectionObserver(entries=>{
  for(const e of entries){if(!e.isIntersecting)return;const a=links.find(l=>l.hash==='#'+e.target.id);if(a){links.forEach(l=>l.removeAttribute('aria-current'));a.setAttribute('aria-current','location')}}
 },{rootMargin:'-10% 0px -78% 0px',threshold:0});
 headings.forEach(h=>{const target=document.getElementById(h.id);if(target)observer.observe(target)});
}

/* Preserve the original thesis figure lightbox as an accessible native dialog. */
const dialog=document.querySelector('dialog.thesis-media-dialog');
if(dialog){
 const img=dialog.querySelector('[data-thesis-media-image]'),cap=dialog.querySelector('[data-thesis-media-caption]');
 const closer=dialog.querySelector('[data-thesis-media-close]');
 document.querySelectorAll('[data-thesis-media]').forEach(button=>button.addEventListener('click',()=>{
  const src=button.getAttribute('data-thesis-media');if(!src||!img)return;
  img.src=src;img.alt=button.querySelector('img')?.alt||'Thesis figure';
  if(cap)cap.textContent=button.getAttribute('data-thesis-caption')||'';
  if(!dialog.open)dialog.showModal();closer?.focus();
 }));
 closer?.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}

/* Project-specific evidence tabs. These formerly relied on the retired site.js. */
document.querySelectorAll('[data-evidence-tabs]').forEach(group=>{
 const buttons=[...group.querySelectorAll('[data-evidence-tab]')];
 const panels=[...group.querySelectorAll('[data-evidence-panel]')];
 if(!buttons.length||!panels.length)return;
 group.setAttribute('role','group');
 const activate=(id)=>{
  buttons.forEach(btn=>{
   const yes=btn.dataset.evidenceTab===id;
   btn.classList.toggle('is-active',yes);btn.setAttribute('aria-pressed',String(yes));
  });
  panels.forEach(panel=>{panel.hidden=panel.dataset.evidencePanel!==id});
  window.dispatchEvent(new Event('resize'));
 };
 buttons.forEach((button,i)=>{
  button.addEventListener('click',()=>activate(button.dataset.evidenceTab));
  button.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();
   const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:
    (i+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length;
   buttons[next].focus();activate(buttons[next].dataset.evidenceTab);
  });
 });
 activate(buttons.find(b=>b.classList.contains('is-active'))?.dataset.evidenceTab||buttons[0].dataset.evidenceTab);
});
/* Verified data-only charts: no simulated or invented readings. */
document.querySelectorAll('canvas[data-evidence-chart]').forEach(canvas=>{
 const ident=canvas.dataset.evidenceChart;
 const source=[...document.querySelectorAll('script[data-evidence-chart-data]')].find(el=>el.dataset.evidenceChartData===ident);
 if(!source)return;
 let data;try{data=JSON.parse(source.textContent)}catch{return}
 const series=Array.isArray(data.series)?data.series.filter(d=>Number.isFinite(Number(d.value))):[];
 if(!series.length)return;
 canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label',data.title||'Project evidence chart');
 const frame=canvas.closest('.evidence-chart-shell')||canvas.parentElement;
 const readout=document.createElement('div');readout.className='cv-chart-readout';
 readout.setAttribute('role','status');readout.setAttribute('aria-live','polite');
 frame.append(readout);
 const colors=['#65d6c9','#d7b46a','#92acda','#87bb97','#e1a577','#b99ed8'];
 let hits=[];
 const render=()=>{
  if(canvas.closest('[hidden]'))return;
  const w=Math.max(280,Math.round(canvas.getBoundingClientRect().width)||600),h=Math.max(260,Math.round(canvas.getBoundingClientRect().height)||320);
  const scale=Math.min(2,devicePixelRatio||1);canvas.width=w*scale;canvas.height=h*scale;
  const ctx=canvas.getContext('2d');if(!ctx)return;canvas._cvHasData=true;
  ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,w,h);
  const pad={left:48,right:20,top:25,bottom:68},sw=w-pad.left-pad.right,sh=h-pad.top-pad.bottom;
  const top=Math.max(1,...series.map(d=>Number(d.value)))*1.12;
  ctx.strokeStyle='#30483a';ctx.fillStyle='#a9b3a8';ctx.lineWidth=1;
  ctx.font='11px JetBrains Mono,monospace';ctx.textAlign='left';
  for(let n=0;n<=4;n++){const y=pad.top+n*sh/4;ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();ctx.fillText((top*(1-n/4)).toFixed(1),4,y+4)}
  hits=[];const step=sw/series.length,bw=Math.min(60,step*.62);
  series.forEach((point,i)=>{
   const val=Math.max(0,Number(point.value));const bh=val/top*sh;
   const x=pad.left+(i+.5)*step-bw/2,y=pad.top+sh-bh;
   ctx.fillStyle=colors[i%colors.length];ctx.fillRect(x,y,bw,bh);
   ctx.textAlign='center';ctx.fillStyle='#d8e3d8';ctx.font='11px Inter,sans-serif';
   const label=String(point.label||'Record '+(i+1));
   const abbreviated=label.length>15?label.slice(0,13)+'…':label;
   ctx.fillText(abbreviated,x+bw/2,h-36);
   hits.push({x,y,w:bw,h:Math.max(bh,8),label,value:point.value,unit:point.unit||data.unit||'',note:point.note||''});
  });
 };
 const inspect=event=>{
  const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left),y=(event.clientY-bounds.top);
  const hit=hits.find(item=>x>=item.x&&x<=item.x+item.w&&y>=item.y&&y<=item.y+item.h);
  if(hit)readout.textContent=hit.label+' — '+hit.value+' '+hit.unit+(hit.note?' · '+hit.note:'');
 };
 canvas.addEventListener('pointermove',inspect);canvas.addEventListener('click',inspect);
 window.addEventListener('resize',render,{passive:true});render();
});
/* Photographs and diagrams open a genuine zoom viewer.
   Do not wrap project figures that already own clicks or links. */
const photos=[...main.querySelectorAll('.cv-case-record img')].filter(img=>
 !img.closest('button,a,dialog,[data-thesis-media],.cv-case-photo-control') &&
 !!(img.currentSrc||img.getAttribute('src')) && !img.closest('[hidden]')
);
if(photos.length){
 const viewer=document.createElement('dialog');viewer.className='cv-photo-viewer';
 viewer.setAttribute('aria-label','Project photograph and diagram viewer');
 const close=document.createElement('button');close.type='button';close.className='cv-photo-close';close.textContent='CLOSE ×';
 const figure=document.createElement('figure');
 const photograph=document.createElement('img');photograph.alt='';
 const caption=document.createElement('figcaption');
 const prev=document.createElement('button'),next=document.createElement('button');
 prev.type=next.type='button';prev.textContent='← PREVIOUS';next.textContent='NEXT →';
 const row=document.createElement('div');row.className='cv-photo-controls';row.append(prev,next);
 figure.append(photograph,caption);viewer.append(close,figure,row);document.body.append(viewer);
 let active=0,lastFocus=null;
 const show=index=>{
  active=(index+photos.length)%photos.length;const img=photos[active];
  photograph.src=img.currentSrc||img.src;photograph.alt=img.alt||'Project figure';
  const explanation=img.closest('figure')?.querySelector('figcaption')?.textContent.trim();
  caption.textContent=(explanation||img.alt||'Project figure')+' · '+(active+1)+' / '+photos.length;
 };
 const open=(i)=>{lastFocus=document.activeElement;show(i);if(!viewer.open)viewer.showModal();close.focus()};
 photos.forEach((img,i)=>{
  img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','Enlarge figure: '+(img.alt||'Project image'));
  img.classList.add('cv-case-photo-control');img.addEventListener('click',()=>open(i));
  img.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(i)}});
 });
 close.addEventListener('click',()=>viewer.close());
 prev.addEventListener('click',()=>show(active-1));next.addEventListener('click',()=>show(active+1));
 viewer.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();show(active+1)}
  if(event.key==='ArrowLeft'){event.preventDefault();show(active-1)}});
 viewer.addEventListener('click',event=>{if(event.target===viewer)viewer.close()});
 viewer.addEventListener('close',()=>{lastFocus?.focus()});
}


/* Evidence-linked navigation uses published catalogue records, never a fake card.
   See also the user's actual industrial experience and methods dossiers. */
const connections=document.createElement('section');
connections.className='cv-case-connections';connections.id='related-evidence';
const label=document.createElement('p');label.className='cv-case-kicker';label.textContent='CONNECTED METHODS / WORK';
const h=document.createElement('h2');h.textContent='Follow the evidence.';
const intro=document.createElement('p');intro.textContent='Related work is linked by documented subject, tools and methods—not by arbitrary recommendation order.';
const items=document.createElement('div');items.className='cv-case-connections-list';
const status=document.createElement('p');status.className='cv-case-connections-status';status.textContent='Reading published case relationships…';
connections.append(label,h,intro,items,status);
const anchor=main.querySelector('.cv-case-appendix');
if(anchor)anchor.before(connections);
const currentSlug=document.body.dataset.projectSlug;
const publicCases=async()=>{
 const response=await fetch('../api/projects.json',{cache:'no-cache'});
 if(!response.ok)throw Error('Index unavailable');
 const payload=await response.json(),all=(payload.projects||[]).filter(x=>x.status==='published'&&x.caseStudyUrl&&/^projects\/[a-z\d-]+\.html$/.test(x.caseStudyUrl));
 const own=all.find(x=>x.id===currentSlug||x.caseStudyUrl.endsWith('/'+currentSlug+'.html'));
 if(!own)throw Error('Current work missing from catalogue');
 const keyset=v=>new Set((v||[]).map(x=>String(x).toLowerCase()));
 const ownTools=keyset(own.tools),ownTags=keyset(own.audienceTags),ownSkills=keyset(own.skills);
 const overlap=(a,b)=>[...a].filter(x=>b.has(x)).length;
 const scored=all.filter(x=>x!==own&&x.id!=='gridflex-energy-optimizer')
 .map(x=>({p:x,score:3*overlap(ownSkills,keyset(x.skills))+2*overlap(ownTools,keyset(x.tools))+2*overlap(ownTags,keyset(x.audienceTags))+(own.category===x.category?2:0)}))
 .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(a.p.order??100)-(b.p.order??100));
 const unique=new Set();const chosen=scored.filter(x=>{if(unique.has(x.p.id))return false;unique.add(x.p.id);return true}).slice(0,4);
 for(const {p,score} of chosen){
  const card=document.createElement('a');card.className='cv-case-connection-card';card.href='../'+p.caseStudyUrl;
  const caption=document.createElement('span');caption.className='cv-connection-tag';caption.textContent=p.category||'CASE STUDY';
  const title=document.createElement('strong');title.textContent=p.title||p.id;
  const description=document.createElement('span');description.className='cv-connection-description';description.textContent=p.summary||'Open the published evidence record.';
  const more=document.createElement('span');more.className='cv-connection-open';more.textContent='OPEN CASE ↗';
  card.append(caption,title,description,more);items.append(card);
 }
 status.textContent=chosen.length?chosen.length+' related case records available.':'No related published cases indexed.';
 const paths=[];
 const org=String(own.associatedWith||'').toLowerCase();
 if(/siemens/.test(org)||/siemens/.test(currentSlug))paths.push(['SIEMENS ENERGY LAB','../experience/siemens-energy.html']);
 if(/alleima/.test(org)||/alleima/.test(currentSlug))paths.push(['ALLEIMA INDUSTRIAL AUDITS','../experience/alleima.html']);
 if(/kth|university/.test(org)||/numerical|heating|district/.test(currentSlug))paths.push(['KTH COURSE RECORD','../courses.html']);
 if((own.audienceTags||[]).some(x=>/thermal|fluid/i.test(x)))paths.push(['THERMAL ENGINEERING METHODS','../skills/cfd-heat-transfer.html']);
 if((own.audienceTags||[]).some(x=>/energy systems/i.test(x)))paths.push(['ENERGY SYSTEMS METHODS','../skills/energy-systems.html']);
 if((own.audienceTags||[]).some(x=>/research/i.test(x)))paths.push(['RESEARCH PRACTICE','../research.html']);
 if(paths.length){
  const row=document.createElement('div');row.className='cv-case-connected-paths';
  for(const [title,path] of paths){
   if(row.querySelector('a[href="'+path+'"]'))continue;
   const link=document.createElement('a');link.href=path;link.textContent=title+' ↗';row.append(link);
  }
  connections.append(row);
 }
};
publicCases().catch(()=>{status.textContent='Case catalogue is temporarily unavailable. Browse the full cases library.';const link=document.createElement('a');link.href='../projects.html';link.textContent='ALL CASES ↗';status.append(' ',link)});


/* Source-anchored interactive case probes for compact scientific dossiers.
   Descriptions are editorial lenses on already documented case facts.
   These are not simulated experiments or fabricated new results. */
const walkthroughs={
 'enerlint':{
  title:'Conservation is necessary. Not sufficient.',
  subtitle:'Inspect why a balance check can detect six faults yet still miss one compensating error.',
  stages:[
   ['INPUT CONTRACT','Four hand-constructed analytical demonstration cases declare the quantities, SI units and tolerances before any test. SHA-256 links inputs to machine-readable reports.','A balance test only evaluates the conservation statements provided to it.'],
   ['NEGATIVE CONTROL','Six deliberately inconsistent perturbations trigger the declared checks in the current alpha.','This demonstrates detection on constructed counterexamples, not external model validation.'],
   ['THE FALSE PASS','A compensating compressor error survives the same conservation checks. Two wrong components can cancel in the aggregate residual.','A passing residual is not evidence that every component is correctly modelled.'],
   ['RESEARCH BOUNDARY','EnerLint remains a review-stage v0.1.0a0 research alpha with no certified industrial or external scientific validation.','The next useful work is stronger independent physical checks, not prettier pass indicators.']
  ]},
 'residual-pathways':{
  title:'Coverage is not a carbon-flow identity.',
  subtitle:'Explore what the climate-scenario inventory proves, and what it does not.',
  stages:[
   ['COVERAGE AUDIT','The frozen candidate includes 1,202 climate-vetted scenarios and 352 reporting-presence aggregates across four milestone years.','A source variable being present is a reporting observation, not a validated physical decomposition.'],
   ['SOURCE SEPARATION','Audited AR6 IAMC reporting, historical CD-LINKS observations and hypothetical optimization cases are explicitly kept in separate evidence classes.','The numerical origin of a claim must remain attached to the claim.'],
   ['THE UNRESOLVED GATE','No I3 gross-emissions/removal partitions have passed independent physical verification.','Zero independently verified partitions means zero verified identities—not zero emissions or removals.'],
   ['THE PUBLIC ATLAS','The live atlas visualizes the reporting evidence and traceable source coverage, with human scientific review still pending.','The atlas is an exploration interface, not institutional endorsement or an IPCC-certified result.']
  ]},
 'pathways-hub':{
  title:'An auditable release needs a failing gate.',
  subtitle:'Follow the synthetic intake tests rather than mistaking a workflow prototype for a real consortium.',
  stages:[
   ['SOURCE CONTRACT','Submissions specify protocol, release identity, expected scenario years, compatible units and SHA-256 integrity before intake.','Validation is a stated input contract, not subjective dashboard approval.'],
   ['ACCEPTED DEMO','One of three deliberately synthetic submissions exercises a valid intake and produces a testable, versioned record.','A successful sample establishes implementation behavior, not scientific correctness of scenario values.'],
   ['REJECTION PATH','The other demonstrations exercise incompatible units and missing expected years; the intake rejects invalid sources.','Missing or incompatible evidence is not silently converted into an accepted scenario.'],
   ['HUMAN GATE','Review-state ledgers and release briefings are tested prototype software. No real partner approvals or external human review are claimed.','A testable review state is not the same as a genuine scientific sign-off.']
  ]},
 'synthsift':{
  title:'Recommendations are not reference labels.',
  subtitle:'Trace the frozen corpus into AI recommendations and the still-unfinished blinded human check.',
  stages:[
   ['ACQUISITION','Six frozen OpenAlex retrieval arms captured 600 raw records, resulting in 538 exact-deduplicated candidates.','The source snapshot is stable; OpenAlex relevance retrieval is not an exhaustive systematic search.'],
   ['EVIDENCE COVERAGE','Of the 538 candidates, 330 include abstracts and 208 are title-only records.','Title-only uncertainty must be visible instead of imitating a complete abstract review.'],
   ['AI FIRST PASS','The 538 AI-attributed recommendations are 144 include, 341 exclude and 53 uncertain, with 150 unique records prioritized for recheck.','These are model-assisted preliminary decisions, not validated independent human labels.'],
   ['HUMAN EVALUATION','The prespecified 240-record human screening set and 96-record blinded second-review subset are not yet completed and adjudicated.','Do not report screening accuracy or a completed systematic review before reference judgments exist.']
  ]},
 'gridguardpinn':{
  title:'A surrogate needs permission to predict.',
  subtitle:'Compare the accelerated route with the deterministic fallback that refuses unsupported faults.',
  stages:[
   ['REFERENCE MODEL','SMIB dynamics and an ANDES IEEE-14 multi-machine case provide numerical test environments with held-out splits.','These are controlled research benchmarks, not field protection systems.'],
   ['TRUST ROUTER','The acceptance router refuses unseen fault-bus locations by default and defers them to the full ANDES solver.','A neural surrogate cannot grant itself authority based only on a small physics residual.'],
   ['MEASURED WORKLOAD','A pre-registered, three-seed randomized comparison reports 1.57–1.95× end-to-end routed speedup on the fixed 50% in-envelope / 50% out-of-distribution benchmark.','The measurement includes real fallback paths; it does not measure arbitrary-grid acceleration or training cost.'],
   ['NEGATIVE RESULTS','Past false acceptances and a subsynchronous-oscillation extension with partially unresolved modal results remain documented.','The system is research software and is not certified for operational control.']
  ]},
 'finnish-grid-connection-evidence':{
  title:'Missing capacity is not zero capacity.',
  subtitle:'Separate published indicative connection estimates from national historical series and future model assumptions.',
  stages:[
   ['SOURCE CAPTURE','The original Fingrid Grid Scope snapshot records 18 source-transcribed values: 17 tooltip values and one panel-value match.','Each value needs its point, direction, year, units, timestamp and captured operator caveats.'],
   ['COVERAGE GAPS','The initial five-point / two-direction / three-year outline has 18 observed intersections and 12 absent from the compiled source capture.','An absent observation is missing evidence, not a calculated zero.'],
   ['HISTORICAL CONTEXT','Fingrid datasets 124 and 74 and ENTSO-E provide historical national operational series.','National energy histories do not establish substation-level future connection availability.'],
   ['SCENARIO BOUNDARY','Hypothetical future model scenarios are explicitly separate from operator-published indicative observations.','Do not add incompatible capacity estimates or interpolate unsourced years.']
  ]}
};
const walk=walkthroughs[currentSlug];
if(walk){
 const section=document.createElement('section');section.className='cv-case-walkthrough';
 const head=document.createElement('div');head.className='cv-case-walkthrough-head';
 const eyebrow=document.createElement('p');eyebrow.className='cv-case-kicker';eyebrow.textContent='PROJECT-SPECIFIC EVIDENCE / INTERACTIVE READING';
 const title=document.createElement('h2');title.textContent=walk.title;
 const subtitle=document.createElement('p');subtitle.textContent=walk.subtitle;
 head.append(eyebrow,title,subtitle);section.append(head);
 const selector=document.createElement('div');selector.className='cv-case-walkthrough-options';selector.setAttribute('role','group');selector.setAttribute('aria-label','Explore project evidence stages');
 const panel=document.createElement('div');panel.className='cv-case-walkthrough-panel';
 const name=document.createElement('h3'),story=document.createElement('p'),limit=document.createElement('p');limit.className='cv-case-walkthrough-limit';
 const counter=document.createElement('span');counter.className='cv-case-walkthrough-counter';
 const buttons=walk.stages.map(([label],i)=>{
  const btn=document.createElement('button');btn.type='button';btn.textContent=String(i+1).padStart(2,'0')+' / '+label;
  btn.addEventListener('click',()=>activate(i));
  btn.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
   const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+buttons.length+(e.key==='ArrowRight'?1:-1))%buttons.length;buttons[next].focus();activate(next)});
  selector.append(btn);return btn;
 });
 const activate=i=>{
  const [label,body,boundary]=walk.stages[i];name.textContent=label;story.textContent=body;limit.textContent='EVIDENCE BOUNDARY · '+boundary;
  counter.textContent=String(i+1).padStart(2,'0')+' / '+String(walk.stages.length).padStart(2,'0');
  buttons.forEach((b,j)=>{b.classList.toggle('is-active',j===i);b.setAttribute('aria-pressed',String(j===i))});
 };
 panel.setAttribute('aria-live','polite');panel.append(counter,name,story,limit);
 const note=document.createElement('p');note.className='cv-case-walkthrough-note';note.textContent='This is an interactive explanation of the published project record, not a live simulation or a new empirical result.';
 section.append(selector,panel,note);
 const introEnd=main.querySelector('.cv-case-hero');
 introEnd?.insertAdjacentElement('afterend',section);
 activate(0);
}

/* Viewport-size-aware evidence-ledger navigation preserves the current location. */
})();