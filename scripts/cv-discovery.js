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
