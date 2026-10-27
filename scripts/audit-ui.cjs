#!/usr/bin/env node
/**
 * Browser layout & interaction audit for Control Volume PR.
 * Run with NODE_PATH=<...>/node_modules node scripts/audit-ui.cjs
 * Reads every public HTML endpoint and samples critical ones at five widths.
 * Fails only on actionable viewport bleed / JavaScript exceptions / broken toys.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.UI_AUDIT_BASE || 'http://127.0.0.1:8099';
const REPORT = path.join(root, 'ui-audit-report.json');
const highlight = ['index.html','story.html','404.html','admin.html','projects.html','research.html','reports.html',
  'experience.html','about.html','energy-systems.html','industrial-rd.html','interests.html',
  'hobbies.html','ideas.html','courses.html','cet2026/index.html','labs/control-volume.html',
  'for/siemens-feed.html','tracks/research.html','tracks/index.html','skills/research.html',
  'projects/siemens-thesis.html','projects/kerala2040.html','projects/thermotwin-f.html'];
const excludedDirs = new Set(['node_modules','backend','.github','.git','.claude','scripts','docs','dist','coverage','design-legacy']);
const pages = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, {withFileTypes:true})) {
    if (item.isDirectory()) {
      if (!excludedDirs.has(item.name)) walk(path.join(dir,item.name));
    } else if (item.name.endsWith('.html')) {
      pages.push(path.relative(root,path.join(dir,item.name)).replaceAll(path.sep,'/'));
    }
  }
}
walk(root);
pages.sort();
const debugRoutes = new Set(['projects/residual-pathways.html','skills/research.html','skills/test-instrumentation.html','tracks/general.html','tracks/research.html','tracks/software.html','for/siemens-feed.html','courses.html']);
const debug = process.env.UI_AUDIT_TARGETED === '1';
const tests = (debug ? pages.filter(p => debugRoutes.has(p)) : pages).map(name => ({name,width:390}));
for (const name of highlight) if (pages.includes(name) && !debug) for (const width of [320,673,1024,1440]) tests.push({name,width});
if (debug) for (const name of debugRoutes) if (pages.includes(name)) tests.push({name,width:320});
const failures=[], warnings=[], summaries=[];
const severity = (where, issue, value) => {
  const info = {page:where, issue, detail:value};
  if (/DOCUMENT BLEED|PAGE ERROR|YEAR CONTROL|PROBE CLIPPED|DIALOG ERROR|ENERGY LENS|CASE FILTER|HEAT CONTROL|MESH CONTROL|BIOT CONTROL|STORY CYCLE/.test(issue)) failures.push(info);
  else warnings.push(info);
};
(async () => {
  const browser = await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},
      reducedMotion:'reduce', deviceScaleFactor:1, ignoreHTTPSErrors:true});
    // Dynamic local code is audited, external tracker/fonts/CDN endpoints are irrelevant.
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    let exceptions=[];
    page.on('pageerror', error => exceptions.push(error.message));
    for (const [i,test] of tests.entries()) {
      exceptions=[];
      await page.setViewportSize({width:test.width,height:844});
      const url=base+'/'+test.name;
      try {await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});}
      catch(err) {severity(test.name+'@'+test.width,'PAGE ERROR',err.message);continue;}
      await page.waitForTimeout(170);
      const data=await page.evaluate(() => {
        const doc=document.documentElement;
        const width=innerWidth;
        const text=[];
        function visibly(el) {
          const st=getComputedStyle(el);
          const r=el.getBoundingClientRect();
          return st.display!=='none'&&st.visibility!=='hidden'&&parseFloat(st.opacity)>0&&r.width>1&&r.height>1;
        }
        function scrollable(el) {
          let p=el.parentElement;
          while(p&&p!==document.body) {
            const st=getComputedStyle(p);
            if (/(auto|scroll)/.test(st.overflowX) && p.scrollWidth>p.clientWidth+3) return true;
            p=p.parentElement;
          }
          return false;
        }
        for(const el of document.querySelectorAll('h1,h2,h3,h4,p,button,a,label,summary,output,[data-out],.cvfx-clue')) {
          if(!visibly(el)||scrollable(el)||el.closest('.admin-sidebar:not(.is-open)'))continue;
          const r=el.getBoundingClientRect(), st=getComputedStyle(el);
          // Positioning out of the viewport is a defect for visible, meaningful text.
          if(r.left<-5||r.right>width+5) {
            const t=(el.textContent||'').trim().slice(0,65);
            if(t&&text.length<12) text.push({tag:el.tagName,text:t,x:+r.left.toFixed(1),right:+r.right.toFixed(1)});
          }
          if(st.overflowX==='hidden' && el.scrollWidth>el.clientWidth+8 && text.length<12)
            text.push({tag:el.tagName,text:(el.textContent||'').trim().slice(0,65),clipped:el.scrollWidth-el.clientWidth});
        }
        const year=document.querySelector('[data-cv-toy="year"]');
        const yr=year&&{size:year.getBoundingClientRect().width,svg:year.querySelector('svg')?.getBoundingClientRect().width,monsoon:year.querySelector('[data-out="montext"]')?.textContent||'',
          monlabelPresent:!!year.querySelector('[data-out="monlabel"]'),slider:!!year.querySelector('[data-cv-year-day]')};
        return {scroll:Math.round(doc.scrollWidth-width),bodyScroll:Math.round(document.body.scrollWidth-width),text,
          year:yr,heading:document.querySelector('h1')?.textContent?.trim().slice(0,90),body:document.body.className,
          dialog:!!document.querySelector('.cvfx-dialog')};
      });
      const where=test.name+'@'+test.width;
      if(data.scroll>5) {
        const offenders=await page.evaluate(() => {
          const vw=innerWidth;
          return [...document.querySelectorAll('body *')].map(el => {
            const st=getComputedStyle(el),r=el.getBoundingClientRect();
            if (st.display==='none'||st.visibility==='hidden'||r.width<2||r.height<2) return null;
            // Hidden offscreen menus are documented as such in diagnostics.
            if (r.right<=vw+2) return null;
            const family=[];
            for (let p=el.parentElement;p&&family.length<4;p=p.parentElement) {
              const s=getComputedStyle(p);
              family.push({name:(p.tagName.toLowerCase()+'.'+String(p.className?.baseVal||p.className||'').slice(0,35)),
                overflow:s.overflowX,scroll:p.scrollWidth,client:p.clientWidth});
            }
            return {tag:el.tagName,cls:String(el.className?.baseVal||el.className||'').slice(0,75),
              content:(el.textContent||'').trim().slice(0,50),left:+r.left.toFixed(1),right:+r.right.toFixed(1),
              width:+r.width.toFixed(1),position:st.position,overflow:st.overflowX,family};
          }).filter(Boolean).sort((a,b)=>Math.abs(a.right-(vw+10))-Math.abs(b.right-(vw+10))).slice(0,18);
        });
        const scrollOrigins=await page.evaluate(() => [...document.querySelectorAll('html,body,body *')]
          .map(el=>{
            const client=el.clientWidth, scroll=el.scrollWidth, r=el.getBoundingClientRect();
            if(client<2||scroll-client<9)return null;
            const st=getComputedStyle(el);
            return {tag:el.tagName,cls:String(el.className?.baseVal||el.className||'').slice(0,70),
              id:el.id,extra:scroll-client,client,scroll,rect:[Math.round(r.left),Math.round(r.right)],
              overflow:st.overflowX,ws:st.whiteSpace,wordBreak:st.wordBreak,text:(el.textContent||'').trim().slice(0,85)};
          }).filter(Boolean).sort((a,b)=>b.extra-a.extra).slice(0,25));
        console.log('UI AUDIT OVERFLOW '+JSON.stringify({where,px:data.scroll,offenders,scrollOrigins}));
        severity(where,'DOCUMENT BLEED',data.scroll);
      }
      if(data.text.length)severity(where,'TEXT BLEED',data.text);
      if(exceptions.length)severity(where,'PAGE ERROR',exceptions.slice(0,8));
      if(data.year) {
        if(data.year.monlabelPresent||!data.year.slider)severity(where,'YEAR CONTROL',data.year);
        if(data.year.svg > data.year.size+6)severity(where,'DOCUMENT BLEED',data.year);
      }
      if(test.name==='index.html') {
        const testYear=await page.evaluate(() => {
          const root=document.querySelector('[data-cv-toy="year"]');
          const slider=root?.querySelector('[data-cv-year-day]');
          const reset=root?.querySelector('[data-cv-year-reset]');
          if(!slider||!reset) return {missing:true};
          const dot=root.querySelector('[data-out="dot"]').getAttribute('cx');
          slider.value='120';slider.dispatchEvent(new Event('input',{bubbles:true}));
          const newDot=root.querySelector('[data-out="dot"]').getAttribute('cx');
          const changed=dot!==newDot;
          reset.click();
          return {missing:false,changed,reset:reset.disabled};
        });
        if(testYear.missing||!testYear.changed||!testYear.reset)severity(where,'YEAR CONTROL',testYear);
        const probe=await page.evaluate(() => {
          const el=document.querySelector('.probe');
          if(!el)return {missing:true};
          el.querySelector('span').textContent='PROBE · VERY LONG INTERACTIVE LABEL '.repeat(10);
          el.style.transform='translate(9999px, 0px)';
          const st=getComputedStyle(el);
          return {maxWidth:st.maxWidth,width:el.getBoundingClientRect().width};
        });
        if(probe.missing||probe.width>test.width-10)severity(where,'PROBE CLIPPED',probe);
      }
      if((i+1)%20===0)console.log('UI AUDIT: '+(i+1)+' / '+tests.length+' page-width cases');
      summaries.push({where,scroll:data.scroll,text:data.text.length,exceptions:exceptions.length,year:!!data.year});
    }
    // Explicit keyboard-only smoke tests in both motion settings.
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
    await page.keyboard.press('Control+k');
    const modal=await page.locator('.cmdk[aria-modal="true"]').count();
    if(!modal)severity('index.html@390','DIALOG ERROR','Solver console not open by Ctrl+K');
    await page.keyboard.press('Escape');
    if(await page.locator('.cmdk').count())severity('index.html@390','DIALOG ERROR','Solver console fails Escape');
    await page.evaluate(() => window.scrollTo(0,600));
    await page.waitForTimeout(250);
    const button=page.locator('.cvfx-opener');
    if(await button.count()) {
      await button.evaluate(b=>b.click());
      if(!(await page.locator('dialog.cvfx-dialog[open]').count()))
        severity('index.html@390','DIALOG ERROR','Flux Lab panel does not open');
      await page.keyboard.press('Escape');
      if(await page.locator('dialog.cvfx-dialog[open]').count())
        severity('index.html@390','DIALOG ERROR','Flux Lab panel fails Escape');
    } else if (!(await page.locator('body[data-design-source="claude-control-volume-v1"]').count())) severity('index.html@390','DIALOG ERROR','Flux Lab entry missing');

    await page.setViewportSize({width:320,height:844});
    await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
    const heatField=page.locator('[data-cv-toy="heat-field"]');
    const heatBefore=await heatField.evaluate(el=>{
      const s=el.querySelector('.src');
      return {x:parseFloat(s?.style.left),y:parseFloat(s?.style.top),width:el.clientWidth,height:el.clientHeight};
    });
    await heatField.focus();
    await page.keyboard.press('ArrowRight');
    const heatAfter=await heatField.evaluate(el=>parseFloat(el.querySelector('.src')?.style.left));
    if(!(heatBefore.x>=0&&heatBefore.x<heatBefore.width&&heatBefore.y>=0&&heatBefore.y<heatBefore.height)
      ||Math.abs((heatAfter-heatBefore.x)-8)>0.1)
      severity('index.html@320','HEAT CONTROL',{heatBefore,heatAfter});
    const mesh=await page.evaluate(()=>{
      const root=document.querySelector('[data-cv-toy="mesh"]');
      const cells=root?.querySelector('[data-out="cells"]');
      const before=cells?.textContent||'';
      root?.querySelector('[data-level="3"]')?.click();
      const after=cells?.textContent||'';
      return {before,after,pressed:root?.querySelector('[data-level="3"]')?.getAttribute('aria-pressed')};
    });
    if(!mesh.before||mesh.before===mesh.after||mesh.pressed!=='true')
      severity('index.html@320','MESH CONTROL',mesh);
    await page.goto(base+'/research.html',{waitUntil:'domcontentloaded'});
    const biot=await page.evaluate(()=>{
      const root=document.querySelector('[data-cv-toy="biot"]');
      const result=root?.querySelector('[data-out="bi"]');
      const before=result?.textContent||'';
      const slider=root?.querySelector('input[data-k="h"]');
      if(slider){slider.value=String(Number(slider.max)||1000);slider.dispatchEvent(new Event('input',{bubbles:true}));}
      return {before,after:result?.textContent||'',inputs:root?.querySelectorAll('input[data-k]').length};
    });
    if(biot.inputs!==3||!biot.before||biot.before===biot.after)
      severity('research.html@320','BIOT CONTROL',biot);
    await page.goto(base+'/story.html',{waitUntil:'domcontentloaded'});
    const story=await page.evaluate(()=>{
      const root=document.querySelector('[data-cv-toy="cycle"]');
      const slider=root?.querySelector('input[type="range"]');
      const title=root?.querySelector('[data-out="title"]');
      const dot=root?.querySelector('[data-out="dot"]');
      if(!slider||!title||!dot)return {missing:true};
      const original=dot.getAttribute('cx');
      slider.value='200';slider.dispatchEvent(new Event('input',{bubbles:true}));
      const midTitle=title.textContent,midDot=dot.getAttribute('cx');
      slider.value='400';slider.dispatchEvent(new Event('input',{bubbles:true}));
      return {missing:false,original,midTitle,midDot,finalTitle:title.textContent,finalDot:dot.getAttribute('cx'),columns:getComputedStyle(document.querySelector('.cyc-grid')).gridTemplateColumns.split(' ').length};
    });
    if(story.missing||story.midTitle!=='S3 · KTH'||story.midDot===story.original||
       !story.finalTitle.includes('BACK TO CODE')||story.finalDot!==story.original||story.columns!==1)
      severity('story.html@390','STORY CYCLE',story);
    // Dynamic interactions on the actual authored pages, not only DOM presence.
    await page.goto(base+'/energy-systems.html',{waitUntil:'domcontentloaded'});
    const lens=await page.evaluate(()=>{
      const group=document.querySelector('[aria-label="Modelling lens"]');
      const card=group?.nextElementSibling;
      const buttons=[...(group?.querySelectorAll('button')||[])];
      const read=()=>{
        const title=card?.querySelector('h3')?.textContent||'';
        const rows=[...(card?.querySelectorAll('div')||[])]
          .filter(e=>/^(01 · BOUNDARY|02 · METHOD|03 · EVIDENCE|04 · RESIDUAL)$/.test(e.firstElementChild?.textContent?.trim()||'')&&e.children.length===2)
          .map(e=>e.lastElementChild.textContent.trim());
        return {title,rows,href:card?.querySelector('a[href]')?.getAttribute('href')||''};
      };
      const first=read(),states={};
      for(const button of buttons){
        button.click();
        const label=button.textContent.trim().toUpperCase();
        states[label]={...read(),pressed:button.getAttribute('aria-pressed')};
      }
      buttons[0]?.click();
      return {first,states,buttonCount:buttons.length,restored:read()};
    });
    const energyStates=['BUILDINGS','DISPATCH','SCENARIO','FORECAST','GRID'];
    if(lens.buttonCount!==5||lens.first.rows.length!==4||
       energyStates.some(key=>!lens.states[key]||lens.states[key].rows.length!==4||lens.states[key].pressed!=='true')||
       energyStates.slice(1).some(key=>lens.states[key].rows.some((s,i)=>s===lens.first.rows[i])||lens.states[key].href===lens.first.href)||
       JSON.stringify(lens.first)!==JSON.stringify(lens.restored)){
      severity('energy-systems.html@390','ENERGY LENS',lens);
    }
    await page.goto(base+'/projects.html',{waitUntil:'domcontentloaded'});
    try{await page.waitForFunction(()=>document.querySelectorAll('#cv-case-list article').length>=30,null,{timeout:12000});}
    catch(e){severity('projects.html@390','CASE FILTER','Source-driven cases did not load');}
    const caseFilter=await page.evaluate(()=>{
      const rows=[...document.querySelectorAll('#cv-case-list article')];
      const initial=rows.filter(r=>!r.hidden).length;
      const flagship=rows[0]?.querySelector('a[href]')?.getAttribute('href');
      const button=[...document.querySelectorAll('[data-cv-filter]')]
        .find(b=>b.dataset.cvFilter.toUpperCase()==='SOFTWARE');
      const softwareTotal=rows.filter(r=>r.dataset.cvCaseCategory==='SOFTWARE').length;
      button?.click();
      const selected=rows.filter(r=>!r.hidden).length;
      const pressed=button?.getAttribute('aria-pressed');
      document.querySelector('[data-cv-filter="All"]')?.click();
      const restored=rows.filter(r=>!r.hidden).length;
      const more=document.querySelector('[data-cv-load-more]');
      const offered=!!more&&!more.hidden;
      more?.click();
      const expanded=rows.filter(r=>!r.hidden).length;
      return {total:rows.length,initial,flagship,selected,softwareTotal,pressed,restored,offered,expanded};
    });
    if(caseFilter.total<30||caseFilter.flagship!=='projects/siemens-thesis.html'||
       caseFilter.initial!==8||caseFilter.softwareTotal<1||
       caseFilter.selected!==Math.min(8,caseFilter.softwareTotal)||
       caseFilter.pressed!=='true'||caseFilter.restored!==8||
       !caseFilter.offered||caseFilter.expanded!==16){
      severity('projects.html@390','CASE FILTER',caseFilter);
    }
    await context.close();
    // Full motion-on render checks: the reduced-motion pass is not enough to
    // detect pointer overlays, animated motifs or first-visit obstructions.
    if (!debug) {
      const screenRoot=path.join(root,'ui-audit-snapshots');
      fs.mkdirSync(screenRoot,{recursive:true});
      const motion=await browser.newContext({viewport:{width:673,height:844},
        reducedMotion:'no-preference', deviceScaleFactor:1});
      await motion.route('**/*', route=>{
        const url=new URL(route.request().url());
        if (url.hostname==='127.0.0.1'||url.hostname==='localhost') return route.continue();
        return route.abort();
      });
      const visual=await motion.newPage();
      const visualErrors=[];
      visual.on('pageerror',err=>visualErrors.push(err.message));
      const shots=[
        {name:'index.html',width:1440,selector:'body',file:'canonical-index-1440.png'},
        {name:'projects.html',width:1440,selector:'body',file:'canonical-projects-1440.png'},
        {name:'research.html',width:1440,selector:'body',file:'canonical-research-1440.png'},
        {name:'energy-systems.html',width:1440,selector:'body',file:'canonical-energy-systems-1440.png'},
        {name:'industrial-rd.html',width:1440,selector:'body',file:'canonical-industrial-rd-1440.png'},
        {name:'experience.html',width:1440,selector:'body',file:'canonical-experience-1440.png'},
        {name:'about.html',width:1440,selector:'body',file:'canonical-about-1440.png'},
        {name:'courses.html',width:1440,selector:'body',file:'canonical-courses-1440.png'},
        {name:'ideas.html',width:1440,selector:'body',file:'canonical-ideas-1440.png'},
        {name:'interests.html',width:1440,selector:'body',file:'canonical-interests-1440.png'},
        {name:'hobbies.html',width:1440,selector:'body',file:'canonical-hobbies-1440.png'},
        {name:'story.html',width:1440,selector:'body',file:'canonical-story-1440.png'},
        {name:'story.html',width:390,selector:'body',file:'canonical-story-390.png'},
        {name:'404.html',width:1440,selector:'body',file:'canonical-404-1440.png'},
        {name:'index.html',width:390,selector:'body',file:'canonical-index-390.png'},
        {name:'projects.html',width:390,selector:'body',file:'canonical-projects-390.png'},
        {name:'research.html',width:390,selector:'body',file:'canonical-research-390.png'},
        {name:'energy-systems.html',width:390,selector:'body',file:'canonical-energy-systems-390.png'},
        {name:'industrial-rd.html',width:390,selector:'body',file:'canonical-industrial-rd-390.png'},
        {name:'experience.html',width:390,selector:'body',file:'canonical-experience-390.png'},
        {name:'about.html',width:390,selector:'body',file:'canonical-about-390.png'},
        {name:'hobbies.html',width:390,selector:'body',file:'canonical-hobbies-390.png'},
        {name:'404.html',width:390,selector:'body',file:'canonical-404-390.png'},
        {name:'index.html',width:320,selector:'[data-cv-toy="year"]',file:'year-320.png'},
        {name:'index.html',width:673,selector:'[data-cv-toy="year"]',file:'year-673.png'},
        {name:'index.html',width:1440,selector:'[data-cv-toy="year"]',file:'year-1440.png'},
        {name:'research.html',width:390,selector:'[data-cv-toy="biot"]',file:'research-biot-390.png'},
        {name:'tracks/research.html',width:320,selector:'.track-hero',file:'research-track-320.png'},
        {name:'skills/research.html',width:320,selector:'.dossier-hero',file:'research-skill-320.png'},
        {name:'projects/residual-pathways.html',width:320,selector:'.dossier-hero',file:'residual-320.png'},
        {name:'for/siemens-feed.html',width:320,selector:'.track-hero',file:'feed-320.png'},
        {name:'admin.html',width:320,selector:'#panel-connection',file:'admin-320.png'}
      ];
      for(const shot of shots) {
        visualErrors.length=0;
        await visual.setViewportSize({width:shot.width,height:844});
        await visual.goto(base+'/'+shot.name,{waitUntil:'domcontentloaded'});
        await visual.waitForTimeout(200);
        const locus=visual.locator(shot.selector).first();
        if(!(await locus.count())) {
          severity(shot.name+'@'+shot.width,'PAGE ERROR','Visual sample target missing: '+shot.selector);
          continue;
        }
        await locus.scrollIntoViewIfNeeded();
        // Allow entry effects to settle, then verify the running layout.
        await visual.waitForTimeout(220);
        const bleed=await visual.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        if(bleed>5)severity(shot.name+'@'+shot.width,'DOCUMENT BLEED','Full motion: '+bleed+'px');
        if(shot.name==='index.html' && shot.selector==='[data-cv-toy="year"]') {
          const yearState=await visual.evaluate(()=>{
            const root=document.querySelector('[data-cv-toy="year"]');
            const svg=root.querySelector('svg');
            const rect=svg.getBoundingClientRect();
            const labels=[...svg.querySelectorAll('text')].filter(e=>getComputedStyle(e).visibility!=='hidden')
              .map(e=>({text:e.textContent,rect:e.getBoundingClientRect()}));
            const collisions=[];
            for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
              const a=labels[i].rect,b=labels[j].rect;
              if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>3 &&
                 Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3)
                  collisions.push([labels[i].text,labels[j].text]);
            }
            return {collisions,svgRight:Math.round(rect.right),vp:innerWidth};
          });
          if(yearState.collisions.length)severity(shot.name+'@'+shot.width,'YEAR CONTROL','SVG text collision: '+JSON.stringify(yearState.collisions));
          // The custom probe must disappear over the year-card's live readout.
          await locus.hover({force:true});
          await visual.waitForTimeout(320);
          const probe=await visual.evaluate(()=>{
            const el=document.querySelector('.probe');
            if(!el)return {visible:false};
            return {visible:parseFloat(getComputedStyle(el).opacity)>.05};
          });
          if(probe.visible)severity(shot.name+'@'+shot.width,'PROBE CLIPPED','Probe obscures year motif');
          const hoverMesh=await locus.evaluate(el=>parseFloat(getComputedStyle(el,'::after').opacity)||0);
          if(hoverMesh>0.3)severity(shot.name+'@'+shot.width,'PROBE CLIPPED','Hover mesh is too opaque over diagram: '+hoverMesh);

        }
        try {
          await locus.screenshot({path:path.join(screenRoot,shot.file),animations:'disabled',timeout:8000});
        } catch(err){warnings.push({page:shot.name,issue:'Screenshot unavailable',detail:err.message.slice(0,120)});}
        if(visualErrors.length)severity(shot.name+'@'+shot.width,'PAGE ERROR',visualErrors.slice(0,5));
      }
      await motion.close();
    }
  } finally {await browser.close();}
  const report={timestamp:new Date().toISOString(),pageCount:pages.length,testCount:tests.length,
    failures, warnings: warnings.slice(0,150), summaries};
  fs.writeFileSync(REPORT,JSON.stringify(report,null,2));
  console.log('UI AUDIT SUMMARY '+JSON.stringify({pageCount:pages.length,testCount:tests.length,failures:failures.length,warnings:warnings.length}));
  for(const item of failures.slice(0,65))console.log('UI AUDIT FAIL '+JSON.stringify(item));
  for(const item of warnings.slice(0,65))console.log('UI AUDIT WARN '+JSON.stringify(item));
  if(failures.length)process.exitCode=1;
})().catch(err=>{console.error('UI AUDIT INTERNAL ERROR',err);process.exitCode=1;});