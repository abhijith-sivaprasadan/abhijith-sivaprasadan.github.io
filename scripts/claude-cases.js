/* Claude's exact S3 Cases page, hydrated from the complete public project catalogue.
   No invented evidence, no remote tracking and no separate design framework. */
(() => {
  'use strict';
  const list=document.getElementById('cv-case-list');
  if(!list)return;
  const count=document.querySelector('[data-cv-case-count]');
  const buttons=[...document.querySelectorAll('[data-cv-filter]')];
  let all=[],active='ALL',limit=8;
  const pageSize=8;
  const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
  const norm=s=>String(s||'').toUpperCase();
  const isCaseURL=u=>typeof u==='string' && /^projects\/[a-z\d-]+\.html$/.test(u);
  function classify(p){
    const t=norm([p.title,p.summary,...(p.tools||[]),...(p.audienceTags||[]),...(p.skills||[])].join(' '));
    if(/CFD|CHT|TURBULENCE|TURBINE|PRESSURE SENSOR|HEAT TRANSFER|THERMOTWIN/.test(t))return 'CFD / CHT';
    if(/STRUCTURAL|FEA|STRESS|MECHANICAL DESIGN|REACTOR INTERNAL/.test(t))return 'STRUCTURAL';
    if(/ENERGY AUDIT|ENERGY EFFICIENCY|INDUSTRIAL ENERGY|ENPI|ISO 50001/.test(t))return 'ENERGY MANAGEMENT';
    if(/GRID|POWER FLOW|ELECTRIC NETWORK|STATCOM|TRANSMISSION|PYPSA/.test(t))return 'GRID';
    if(/SOFTWARE|CLI|LIBRARY|FRAMEWORK|BACKEND|TOOLING|LINT|PYTHON PACKAGE|DATA CONTRACT/.test(t))return 'SOFTWARE';
    return 'ENERGY SYSTEMS';
  }
  function residual(p){
    const hs=p.highlights||[];
    const h=hs.find(x=>/\b(no |not |without |pending|unvalidated|prototype|alpha|beta|synthetic|not independently|limited|experimental|not a |verification|source.only)\b/i.test(x));
    return h || 'Scope, assumptions and unverified claims are stated in the linked case study.';
  }
  function display(p){
    const row=el('article','cv-dynamic-case');row.dataset.cvCase='';row.dataset.cvCaseCategory=classify(p);row.dataset.probe='CASE · '+classify(p);
    const name=el('div','cv-dynamic-case-name');const category=el('span','m cv-dynamic-case-category',classify(p));
    const a=el('a','cv-dynamic-case-link',p.title+' ↗');a.href=p.caseStudyUrl;
    const description=el('div','cv-dynamic-case-boundary',p.summary||'Scope is described in the linked case study.');
    const methods=el('div','m cv-dynamic-case-method',(p.tools||[]).slice(0,5).join(' · ')||'See linked case');
    const limits=el('div','rs cv-dynamic-case-residual',residual(p));
    name.append(category,a);row.append(name,description,methods,limits);
    return row;
  }
  const more=el('button','m cv-case-more','SHOW MORE CASES →');
  more.type='button';more.dataset.cvLoadMore='';
  more.hidden=true;
  list.after(more);
  function filter(){
    let matched=0,visible=0;
    for(const row of list.children){
      const accepted=active==='ALL'||norm(row.dataset.cvCaseCategory)===active;
      if(accepted)matched++;
      const show=accepted&&visible<limit;
      row.hidden=!show;
      if(show)visible++;
    }
    count.textContent=visible+' OF '+matched+' MATCHING CASES · '+all.length+' PUBLISHED · FOUR TERMS SOURCE-LINKED';
    more.hidden=matched<=limit;
    if(!more.hidden)more.textContent='SHOW NEXT '+Math.min(pageSize,matched-limit)+' CASES →';
  }
  more.addEventListener('click',()=>{limit+=pageSize;filter();});

  for(const b of buttons){b.setAttribute('aria-pressed',String(norm(b.dataset.cvFilter)==='ALL'));b.addEventListener('click',()=>{
    active=norm(b.dataset.cvFilter);
    limit=pageSize;
    for(const item of buttons)item.setAttribute('aria-pressed',String(item===b));
    filter();
  });}
  fetch('api/projects.json',{cache:'no-cache'})
   .then(r=>{if(!r.ok)throw new Error('source file unavailable');return r.json();})
   .then(data=>{
     const seen=new Set();all=(data.projects||[]).filter(p=>p.status==='published'&&isCaseURL(p.caseStudyUrl)&&!seen.has(p.caseStudyUrl)&&seen.add(p.caseStudyUrl));
     all.sort((a,b)=>{
      const priority=p=>p.caseStudyUrl==='projects/siemens-thesis.html'?-1:(Number(p.order)||999);
      return priority(a)-priority(b)||String(a.title).localeCompare(String(b.title));
    });
     const fragment=document.createDocumentFragment();for(const p of all)fragment.append(display(p));
     list.replaceChildren(fragment);filter();
   })
   .catch(()=>{more.hidden=true;count.textContent='CASE DATA UNAVAILABLE · EXPLORE SOURCE REPOSITORIES';const msg=el('p','cv-case-empty','The public case index could not be loaded. Individual case-study pages remain available through the main navigation.');list.append(msg);});
})();
