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
})();