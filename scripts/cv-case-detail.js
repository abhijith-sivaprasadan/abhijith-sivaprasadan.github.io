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
  const ctx=canvas.getContext('2d');if(!ctx)return;
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

/* Viewport-size-aware evidence-ledger navigation preserves the current location. */
})();