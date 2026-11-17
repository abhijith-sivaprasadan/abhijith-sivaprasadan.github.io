#!/usr/bin/env node
/* Real-browser regression checks for six Armada Control Volume pages.
 * Run under the repository's existing Playwright UI audit environment.
 */
'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.UI_AUDIT_BASE || 'http://127.0.0.1:8099';
const sectors = ['thermal-test','power-grids','industrial-heat','mechanical-structures','software-research','engineering-consulting'];
(async()=>{
 const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
 const errors=[];
 const page=await browser.newPage({viewport:{width:1280,height:880},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'/for/armada-2026.html',{waitUntil:'networkidle'});
  await assert.equal(await page.locator('body.cv').count(),1,'Hub does not use Control Volume shell');
  for(const shell of ['.rail','.snd','.thm','.cmdbtn','.cv-discovery','.cvfx-opener']){
    assert.ok(await page.locator(shell).count(), 'Missing homepage feature on hub: '+shell);
  }
  assert.ok(await page.locator('.armada-route-desk').count(), 'Missing sector routing desk');
  const initial=await page.locator('.armada-route-inspector h4').innerText();
  await page.locator('.armada-route-option[data-index="1"]').click();
  const next=await page.locator('.armada-route-inspector h4').innerText();
  assert.notEqual(next,initial,'Selecting another sector must change inspectable content');
  assert.ok((await page.locator('.armada-route-open').getAttribute('href')).includes('power-grids.html'),'Sector inspector has wrong destination');
  const nav=await page.locator('.cv-discovery a').first().getAttribute('href');
  assert.ok(new URL(nav,base).pathname.endsWith('/index.html'),'Discovery links must lead to site root');
  const input=page.locator('#armada-company-search');
  await input.fill('Hitachi');
  assert.equal(await page.locator('#armada-company-index a:not([hidden])').count(),1,'Company lookup must filter actual choices');
  assert.ok((await page.locator('#armada-company-index a:not([hidden])').getAttribute('href')).includes('power-grids.html#hitachi-energy'));
  await input.fill('');

  const snapshots=[];
  for(const slug of sectors){
    await page.goto(base+'/for/armada-2026/'+slug+'.html',{waitUntil:'networkidle'});
    assert.equal(await page.locator('body.cv').count(),1,'Missing shared shell '+slug);
    assert.ok(await page.locator('.cv-discovery').count(),'Missing global discovery navigation '+slug);
    assert.ok(await page.locator('.cvfx-opener').count(),'Missing Flux Lab '+slug);
    assert.ok(await page.locator('#method-console').count(),'Missing method workbench '+slug);
    assert.ok(await page.locator('[data-stage-note]').count(),'Missing live stage readout '+slug);
    const first=await page.locator('[data-stage-note]').innerText();
    await page.locator('[data-stage="2"]').click();
    const third=await page.locator('[data-stage-note]').innerText();
    assert.notEqual(first,third,'Stage controls are inert '+slug);
    assert.equal(await page.locator('[data-stage="2"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#method-console').getAttribute('data-stage'),'2');
    assert.ok((await page.locator('.armada-flow-active').getAttribute('d')).includes('464.6'),'Animated method chain did not advance '+slug);
    assert.ok(await page.locator('.armada-evidence-switch button').count(),'Missing evidence provenance filter '+slug);
    await page.locator('.armada-evidence-switch button[data-class="independent"]').click();
    assert.ok(await page.locator('#evidence .evidence-card:not([hidden])').count()>0,'Missing independent evidence '+slug);
    await page.locator('.armada-evidence-switch button[data-class="all"]').click();
    assert.ok(await page.locator('#evidence .evidence-card:not([hidden])').count()>=4,'Unable to restore all evidence '+slug);
    await page.locator('#armada-sector-search').fill('unlikely-search-string-zzzz');
    assert.equal(await page.locator('.company-card:not([hidden])').count(),0,'Company search not reactive '+slug);
    await page.locator('#armada-sector-search').fill('');
    assert.ok(await page.locator('.company-card:not([hidden])').count()>=4,'Employer search reset broken '+slug);
    const topNav=await page.locator('.cv-discovery a').first().getAttribute('href');
    assert.ok(new URL(topNav,base).pathname.endsWith('/index.html'),'Nested discovery link wrong '+slug);
    snapshots.push({slug,first,third});
  }
  assert.equal(new Set(snapshots.map(s=>s.third)).size,sectors.length,'Stage 3 needs sector-specific technical content');

  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/for/armada-2026/thermal-test.html',{waitUntil:'networkidle'});
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(width.scroll-width.client<=5,'Mobile layout overflows viewport: '+JSON.stringify(width));
  const tickerAnimation=await page.locator('.armada-ticker-track').evaluate(el=>getComputedStyle(el).animationName);
  assert.equal(tickerAnimation,'none','Reduced-motion visitor should not see moving telemetry ticker');
  assert.deepEqual(errors,[],'Runtime JavaScript errors: '+errors.join('\n'));
  console.log('PASS: six sector workbenches, real Control Volume shell/Flux Lab, routing, deep links, evidence and employer controls, reduced-motion/mobile');
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
