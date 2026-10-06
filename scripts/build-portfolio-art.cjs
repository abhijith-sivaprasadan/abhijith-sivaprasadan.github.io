// Reproducible, lightweight vector covers. These are labelled concept artwork,
// not photos, measured result figures or representations of proprietary sites.
const fs = require('node:fs');
const path = require('node:path');
const art = require('./data/portfolio-art.cjs');
const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const publicProjects = [...JSON.parse(fs.readFileSync(path.join(root,'api/projects.json'),'utf8')).projects, ...require('./data/skill-evidence.cjs').additionalProjects];
for (const project of publicProjects) if (project.status === 'published' && !art.projects[art.keyFor(project)]) throw new Error(`Missing project cover specification: ${project.id}`);
for (const role of JSON.parse(fs.readFileSync(path.join(root,'api/linkedin-experience.json'),'utf8')).experience) if (!art.roleKeys[role.id]) throw new Error(`Missing experience cover specification: ${role.id}`);
const C = { ink: '#24443f', green: '#8eafa0', pale: '#dce6da', rust: '#b6623c', gold: '#d6ab68', blue: '#789eae', white: '#fffcf6' };
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const line = (x1, y1, x2, y2, color = C.ink, width = 3) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const circle = (x, y, r, fill, stroke = 'none', width = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const rect = (x, y, w, h, fill, radius = 5, stroke = 'none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const pipe = (d, color = C.rust) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${C.white}" stroke-opacity=".35" stroke-width="2"/>`;
const box = (x, y, w, h, d = 22, fill = C.green) => `<path d="M${x} ${y}l${d} -${d/2}h${w}l-${d} ${d/2}z" fill="${C.pale}" stroke="${C.ink}" stroke-width="2"/><path d="M${x+w} ${y}l${d} -${d/2}v${h}l-${d} ${d/2}z" fill="${C.ink}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${C.ink}" stroke-width="2"/>`;
const tank = (x, y, w, h, fill = C.green) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${C.ink}" stroke-width="2"/><ellipse cx="${x+w/2}" cy="${y}" rx="${w/2}" ry="14" fill="${C.pale}" stroke="${C.ink}" stroke-width="2"/><path d="M${x} ${y+h}a${w/2} 14 0 0 0 ${w} 0" fill="${fill}" stroke="${C.ink}" stroke-width="2"/>`;
const turbine = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">${line(0,0,0,100,C.ink,5)}${[-90,30,150].map(angle=>`<path d="M0 0L-8 -14L3 -70L10 -12Z" transform="rotate(${angle})" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/>`).join('')}${circle(0,0,7,C.rust)}</g>`;
const building = (x, y, w = 70, h = 100) => `${box(x,y,w,h,26,C.white)}${[0,1,2].flatMap(row=>[0,1,2].map(col=>rect(x+11+col*17,y+15+row*22,10,12,C.blue,1))).join('')}${rect(x+30,y+h-23,16,23,C.ink,0)}`;
const solar = (x,y) => `<path d="M${x} ${y}l90 -32 48 35 -90 32Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="2"/>${[1,2,3].map(i=>line(x+i*22.5,y-i*8,x+i*22.5+48,y-i*8+35,C.pale,1)).join('')}${line(x+24,y+17,x+114,y-15,C.pale,1)}${line(x+18,y+13,x+18,y+42)}${line(x+111,y-9,x+111,y+30)}`;
function scene(kind, variant) {
  const offset = variant * 12;
  if (kind === 'grid' || kind === 'island' || kind === 'hydrogen') {
    if (kind === 'grid' && variant === 0) return `<path d="M212 247Q270 190 360 220L417 380 233 419Z" fill="${C.blue}" opacity=".6"/><path d="M246 264Q317 215 404 251L392 362Q319 332 248 379Z" fill="${C.pale}" stroke="${C.ink}" stroke-width="3"/>${[0,1,2,3].map(i=>line(267+i*35,257-i*4,267+i*35,362-i*4,C.green,4)).join('')}${pipe('M362 355H464V305H571',C.blue)}${box(451,260,103,107,26,C.green)}${building(645,257,74,115)}${pipe('M555 332H644',C.rust)}${[0,1,2].map(i=>`<path d="M231 ${391+i*16}q27 -12 54 0t54 0" fill="none" stroke="${C.white}" stroke-width="2"/>`).join('')}`;
    if (kind === 'grid' && variant === 2) return `<path d="M330 208L272 390M330 208L388 390M290 330H370M304 280H356M315 242H345M282 369L374 330M290 330L364 281" fill="none" stroke="${C.ink}" stroke-width="4"/>${line(257,249,404,249,C.ink,5)}${line(273,289,388,289,C.ink,5)}${[280,325,370].map(x=>`${circle(x,249,6,C.rust)}<path d="M${x} 254Q470 284 671 259" fill="none" stroke="${C.blue}" stroke-width="2"/>`).join('')}${building(635,280,82,109)}${box(445,322,97,65,25,C.green)}`;
    const base = kind === 'island' ? `<path d="M200 354Q245 258 356 270Q420 278 540 240Q654 213 766 320Q805 402 650 430L360 442Q222 432 200 354Z" fill="${C.pale}" stroke="${C.green}" stroke-width="2"/>` : '';
    const nodes = [[290,360],[468,290],[672,364],[570,410]];
    const network = nodes.slice(1).map(([x,y])=>pipe(`M${nodes[0][0]} ${nodes[0][1]}L${x} ${y}`,C.green)).join('');
    return base + network + turbine(280+offset,226,.85) + solar(385,366) + building(628,274,65,92) + (kind === 'hydrogen' ? `${tank(488,243,72,103,C.blue)}<text x="524" y="310" text-anchor="middle" fill="${C.white}" font-size="28">H₂</text>` : box(486,230,72,83,22,C.rust)) + nodes.map(([x,y])=>circle(x,y,6,C.white,C.ink)).join('');
  }
  if (kind === 'thermal') {
    if (variant === 1) return `<path d="M213 295H766" stroke="${C.blue}" stroke-width="12"/><path d="M259 232H382L420 271H575L613 237H723V353H613L575 322H420L382 361H259Z" fill="${C.pale}" stroke="${C.ink}" stroke-width="3"/>${[0,1,2,3,4].map(i=>`<path d="M${275+i*20} 244l14 45 -14 58Z" fill="${i%2?C.blue:C.green}" stroke="${C.ink}" stroke-width="1.5"/>`).join('')}${[0,1,2,3].map(i=>`<path d="M${624+i*22} 250l14 40 -14 87Z" fill="${C.rust}" stroke="${C.ink}" stroke-width="1.5"/>`).join('')}${pipe('M490 215V274',C.rust)}<path d="M485 276Q457 305 491 318Q537 308 510 278Q510 300 497 301Z" fill="${C.gold}"/>${line(215,295,768,295,C.ink,3)}`;
    if (variant === 2 || variant === 3) return `<g transform="translate(285 208)">${Array.from({length:7},(_,i)=>Array.from({length:10},(_,j)=>rect(j*32,i*24,29,21,(i+j+variant)%4===0?C.rust:(i+j)%3===0?C.gold:C.pale,2)).join('')).join('')}${variant===3 ? [0,1,2].map(i=>`<path d="M340 ${40+i*52}q30 -28 60 0t60 0" fill="none" stroke="${C.rust}" stroke-width="3"/>`).join('') : ''}</g>`;
    return `<path d="M214 237H374Q432 237 460 265H728V340H460Q432 368 374 368H214Z" fill="${C.pale}" stroke="${C.ink}" stroke-width="3"/><path d="M214 254H369Q424 254 450 284H728V320H450Q424 350 369 350H214Z" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/>${[0,1,2,3,4].map(i=>`<path d="M180 ${260+i*19}H356Q414 ${260+i*19} 464 ${287+i*6}H769" fill="none" stroke="${i<2?C.blue:C.rust}" stroke-width="2.5"/>`).join('')}${[0,1,2,3].map(i=>line(505+i*51,230,505+i*51,261,C.rust)).join('')}${rect(583,174,52,44,C.ink)}${line(610,218,610,271)}${circle(610,297,8,C.gold)}`;
  }
  if (kind === 'storage' || kind === 'steam') {
    return pipe('M260 339H347V270H449') + pipe('M529 270H650V355H739',C.blue) + tank(400,220,125,170,variant===2?C.gold:C.green) + box(238,279,86,112,22,C.white) + box(658,291,78,100,22,C.ink) + [0,1,2].map(i=>line(414,270+i*35,511,270+i*35,variant===1?C.rust:C.white,3)).join('') + (kind==='steam' ? `${tank(290,217,67,64,C.rust)}${circle(697,339,23,C.white,C.blue,3)}${[0,45,90,135].map(a=>`<path d="M697 316v46" transform="rotate(${a} 697 339)" stroke="${C.blue}" stroke-width="2"/>`).join('')}` : circle(280,322,15,C.white,C.rust,3));
  }
  if (kind === 'building') return pipe('M252 388H741',variant===1?C.rust:C.green)+building(255,254,95,130)+building(435,207,120,170)+building(646,282,68,96)+ (variant===0 ? tank(577,304,42,73,C.rust) : solar(343,397));
  if (kind === 'industry' || kind === 'reactor') return pipe('M245 379H374V296H570V379H728')+box(222,277,104,114,22,C.white)+tank(405,214,114,171,kind==='reactor'?C.rust:C.green)+box(596,263,117,122,25,C.ink)+rect(612,282,78,49,C.pale)+[0,1,2].map(i=>line(625+i*23,316,625+i*23,297-i*4,C.rust,5)).join('')+ (kind==='reactor'?`${pipe('M462 211V169H615V221',C.blue)}${tank(590,225,55,91,C.gold)}`:`${rect(246,210,180,38,C.pale)}${[0,1,2,3].map(i=>circle(263+i*43,229,6,i%2?C.rust:C.green)).join('')}`);
  if (kind === 'software' || kind === 'market') {
    const panels = [[238,246,126,116],[426,192,155,165],[650,279,95,101]];
    return pipe('M365 304H402V273H425',C.green)+pipe('M582 275H617V321H650',C.rust)+panels.map(([x,y,w,h],i)=>`${box(x,y,w,h,22,i===1?C.ink:C.white)}${rect(x+13,y+14,w-27,15,i===1?C.green:C.pale,3)}${kind==='market' ? Array.from({length:4},(_,n)=>rect(x+15+n*(w-25)/4,y+h-20-(n+i+variant)%4*16,(w-35)/5,16+(n+i+variant)%4*16,i===1?C.gold:C.green,2)).join('') : `${line(x+17,y+52,x+w-25,y+52,i===1?C.pale:C.green,4)}${line(x+17,y+70,x+w-44,y+70,i===1?C.pale:C.blue,4)}${circle(x+w-27,y+h-23,8,C.rust)}`}`).join('');
  }
  if (kind === 'battery' || kind === 'prototype') return `${box(305,223,150,172,28,C.white)}${rect(326,248,103,113,variant===1?C.blue:C.pale,6,C.ink)}${kind==='battery' ? `${rect(345,283,63,44,C.green,3,C.ink)}${rect(408,296,6,18,C.ink,1)}${[0,1,2].map(i=>rect(352+i*17,291,11,28,C.white,1)).join('')}${variant===1 ? [0,1,2].map(i=>`<ellipse cx="591" cy="337" rx="${40+i*22}" ry="${12+i*8}" fill="none" stroke="${C.blue}" stroke-width="3"/>`).join('') : `${pipe('M455 296H565V335H646',C.rust)}${box(584,270,90,105,22,C.ink)}${circle(618,315,15,C.gold)}`}` : `${variant===0 ? `${rect(346,254,60,83,C.white,8,C.rust)}${rect(365,247,20,12,C.ink,2)}${circle(376,356,5,C.blue)}` : Array.from({length:6},(_,i)=>line(335,269+i*13,420,269+i*13,C.white,3)).join('')}${pipe('M455 310H620',C.blue)}${box(613,268,74,123,22,C.ink)}`}`;
  if (kind === 'machine') return `${box(284,310,344,66,35,C.pale)}${circle(450,281,84,C.green,C.ink,3)}${circle(450,281,54,C.white,C.ink,3)}${circle(450,281,17,C.rust)}${[0,60,120].map(a=>`<path d="M450 227v108" transform="rotate(${a} 450 281)" stroke="${C.blue}" stroke-width="5"/>`).join('')}${pipe('M536 281H695',C.blue)}${rect(629,218,86,37,C.ink)}${line(671,255,671,281)}`;
  if (kind === 'coordination') return `${box(411,211,150,190,24,C.white)}${rect(432,193,104,32,C.green,6,C.ink)}${[0,1,2,3].map(i=>`${circle(444,254+i*31,5,C.rust)}${line(462,254+i*31,535,254+i*31,C.green,3)}`).join('')}${[0,1,2].map(i=>`<g transform="translate(${[285,670,722][i]} ${[296,250,365][i]})">${circle(0,0,20,C.green,C.ink)}<path d="M-30 70V44Q-30 20 0 20Q30 20 30 44V70Z" fill="${i===variant?C.rust:C.ink}"/>${line(-15,68,-15,98)}${line(15,68,15,98)}</g>`).join('')}`;
  if (kind === 'fea') return `<path d="M361 215L516 187 632 242 632 370 479 414 361 344Z" fill="${C.pale}" stroke="${C.ink}" stroke-width="3"/>${Array.from({length:8},(_,i)=>line(361+i*19,215-i*3.5,361+i*19,344+i*8.75,i%3===0?C.rust:C.green,2)).join('')}${[0,1,2,3,4].map(i=>`<path d="M361 ${238+i*22}L516 ${210+i*29}L632 ${266+i*23}" fill="none" stroke="${C.blue}" stroke-width="2"/>`).join('')}${[0,1,2].map(i=>line(297,259+i*27,349,259+i*27,C.rust,5)).join('')}${line(444,423,592,380,C.ink,5)}`;
  if (kind === 'bicycle' || kind === 'vehicle') {
    const wheel = (x,y,r)=>`${circle(x,y,r,C.ink)}${circle(x,y,r-9,C.white)}${circle(x,y,7,C.rust)}${[0,45,90,135].map(a=>`<path d="M${x-r+11} ${y}h${2*r-22}" transform="rotate(${a} ${x} ${y})" stroke="${C.green}" stroke-width="2"/>`).join('')}`;
    return wheel(318,355,kind==='bicycle'?63:57)+wheel(659,355,variant===0&&kind==='vehicle'?79:63)+ (kind==='bicycle' ? `<path d="M318 355L414 247L514 355H318L414 247H604L514 355L604 247L659 355" fill="none" stroke="${C.rust}" stroke-width="7" stroke-linejoin="round"/>${line(395,240,438,240,C.ink,7)}${line(604,247,589,220,C.ink,5)}${line(570,220,609,220,C.ink,5)}` : `${box(350,273,230,84,24,C.green)}<path d="M404 271L446 215H541L576 270Z" fill="${C.white}" stroke="${C.ink}" stroke-width="4"/>${line(447,215,447,270,C.ink,3)}${rect(592,264,50,67,C.rust)}`);
  }
  if (kind === 'robot') return `${box(336,306,226,62,38,C.green)}${[327,553].map(x=>circle(x,367,32,C.ink)+circle(x,367,14,C.white)).join('')}${pipe('M445 302V253L532 216L610 266',C.rust)}${[445,532,610].map((x,i)=>circle(x,[253,216,266][i],12,C.white,C.ink,3)).join('')}${line(610,266,638,255,C.ink,4)}${line(610,266,635,284,C.ink,4)}${rect(375,274,71,28,C.ink)}`;
  throw new Error(`No illustration for ${kind}`);
}
function render([title, category, kind, variant]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">Concept illustration for ${esc(category)}. Decorative navigation artwork; not a measured result or site photograph.</desc><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#fffcf6"/><stop offset="1" stop-color="#e9eee4"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#24443f" flood-opacity=".1"/></filter></defs><rect width="960" height="540" fill="url(#bg)"/><circle cx="780" cy="110" r="160" fill="#dce6da" opacity=".6"/><path d="M170 406L487 488L807 373L486 287Z" fill="#cedbcf" opacity=".38"/><path d="M110 460H850" stroke="#b9cbbb" stroke-width="1"/><text x="48" y="48" fill="#496359" font-family="Arial,sans-serif" font-size="14" letter-spacing="2">${esc(category.toUpperCase())}</text><text x="48" y="90" fill="#24443f" font-family="Georgia,serif" font-size="31">${esc(title)}</text><g filter="url(#shadow)">${scene(kind,variant)}</g><text x="48" y="509" fill="#597067" font-family="Arial,sans-serif" font-size="11" letter-spacing="1.6">ENGINEERING PORTFOLIO / CONCEPT ILLUSTRATION</text><path d="M816 498H908" stroke="#b6623c" stroke-width="3"/></svg>\n`;
}
let count = 0;
function output(file, content) {
  const target = path.join(root,file);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n') !== content) throw new Error(`Stale illustration: ${file}`);
  } else { fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,content); }
  count++;
}
for (const [key, spec] of Object.entries(art.projects)) output(`assets/illustrations/${key}.svg`,render(spec));
for (const [key, spec] of Object.entries(art.experiences)) {
  output(`assets/illustrations/experience-${key}.svg`,render(spec));
  output(`assets/thumb-experience-${key}.svg`,render(spec));
}
for (const [alias, key] of Object.entries(art.aliases)) output(`assets/thumb-${alias}.svg`,render(art.projects[key]));
console.log(`${check?'Verified':'Generated'} ${count} project, experience and compatibility illustrations.`);
// One-time mechanical migration; never run in --check mode. Text, ordering,
// dates, status and scientific figures are preserved.
if (process.argv.includes('--sync-covers') && !check) {
  for (const name of ['api/projects.json', 'api/linkedin-projects.json', 'backend/data/projects.json']) {
    const file = path.join(root,name);
    if (!fs.existsSync(file)) continue;
    const source = JSON.parse(fs.readFileSync(file,'utf8'));
    for (const project of source.projects) project.image = art.coverFor(project);
    fs.writeFileSync(file, JSON.stringify(source,null,2)+'\n');
  }
  for (const name of ['api/linkedin-experience.json', 'backend/data/experience.json']) {
    const file = path.join(root,name), source = JSON.parse(fs.readFileSync(file,'utf8'));
    for (const role of source.experience) if (art.roleKeys[role.id]) role.image = `assets/illustrations/experience-${art.roleKeys[role.id]}.svg`;
    fs.writeFileSync(file, JSON.stringify(source,null,2)+'\n');
  }
  const records = JSON.parse(fs.readFileSync(path.join(root,'api/projects.json'),'utf8')).projects;
  const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const library = path.join(root,'projects.html');
  let html = fs.readFileSync(library,'utf8');
  for (const project of records) {
    const cover = art.coverFor(project);
    if (!cover || !art.projects[art.keyFor(project)]) continue;
    const pattern = new RegExp(`(<details[^>]*data-project-id="${escapeRegex(project.id)}"[\\s\\S]*?<img[^>]*src=")[^"]*(")`);
    html = html.replace(pattern, (_, before, after) => before+cover+after);
    if (!/^https?:/.test(project.caseStudyUrl)) {
      const detail = path.join(root,project.caseStudyUrl);
      if (fs.existsSync(detail)) {
        const content = fs.readFileSync(detail,'utf8').replace(/(<img[^>]*src=")\.\.\/assets\/thumb-[^"]+("[^>]*>)/g, (_, before, after) => before+'../'+cover+after);
        fs.writeFileSync(detail,content);
      }
    }
  }
  fs.writeFileSync(library,html);
  for (const name of ['experience.html', ...fs.readdirSync(path.join(root,'experience')).filter(name=>name.endsWith('.html')).map(name=>'experience/'+name)]) {
    const file = path.join(root,name);
    let content = fs.readFileSync(file,'utf8');
    for (const key of Object.keys(art.experiences)) content = content.replaceAll(`assets/thumb-experience-${key}.svg`, `assets/illustrations/experience-${key}.svg`);
    fs.writeFileSync(file,content);
  }
  console.log('Synchronized project and experience covers across public records and static project cards.');
}
