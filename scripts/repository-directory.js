/* Public GitHub repository directory: static-first, no remote request required.
 * Search and filters enhance all 44 server-rendered links; fallback works without JS.
 */
(()=>{'use strict';
 const doc=document;
 const list=doc.getElementById('repo-list');
 if(!list)return;
 const cards=[...list.querySelectorAll('[data-repository]')];
 const search=doc.getElementById('repo-search');
 const owner=doc.getElementById('repo-owner');
 const category=doc.getElementById('repo-category');
 const buttons=[...doc.querySelectorAll('[data-repo-filter]')];
 const count=doc.getElementById('repo-count');
 const reset=doc.getElementById('repo-reset');
 const clear=doc.getElementById('repo-search-clear');
 const noResults=doc.getElementById('repo-no-results');
 const emptyReset=doc.getElementById('repo-empty-reset');
 let kind='all';
 const normalize=s=>String(s||'').trim().toLocaleLowerCase().normalize('NFKD');
 function filter(){
   const q=normalize(search.value),person=owner.value,area=category.value;
   let visible=0;
   for(const card of cards){
     const ok=(!q||normalize(card.dataset.search).includes(q))
       &&(person==='all'||card.dataset.owner===person)
       &&(area==='all'||card.dataset.category===area)
       &&(kind==='all'||card.dataset.kind===kind);
     card.hidden=!ok;
     if(ok)visible++;
   }
   count.textContent=visible+' of '+cards.length+' public repositories';
   noResults.hidden=visible!==0;
   clear.hidden=!search.value;
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.repoFilter===kind)));
 }
 function resetAll(){
   search.value='';owner.value='all';category.value='all';kind='all';filter();
 }
 search.addEventListener('input',filter);
 clear.addEventListener('click',()=>{search.value='';filter();search.focus();});
 owner.addEventListener('change',filter);
 category.addEventListener('change',filter);
 buttons.forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.repoFilter;filter();}));
 reset.addEventListener('click',resetAll);
 emptyReset.addEventListener('click',resetAll);
 filter();
})();
