#!/usr/bin/env node
/* Real-browser smoke and mobile WebKit coverage of public repository directory.
 * WebKit is an iOS Safari engine simulation, not a physical iPhone.
 */
'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const base=process.env.UI_AUDIT_BASE||'http://127.0.0.1:8099';
(async()=>{
 for(const [name,engine,settings] of [
  ['desktop-Chromium',chromium,{viewport:{width:1280,height:880},reducedMotion:'reduce'}],
  ['iPhone-320-WebKit',webkit,{...devices['iPhone 13'],viewport:{width:320,height:568},reducedMotion:'reduce'}],
  ['iPhone-390-WebKit',webkit,{...devices['iPhone 13'],viewport:{width:390,height:844},reducedMotion:'reduce'}],
  ['iPhone-430-WebKit',webkit,{...devices['iPhone 13'],viewport:{width:430,height:932},reducedMotion:'reduce'}],
 ]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(settings);
   const errors=[];
   page.on('pageerror',err=>errors.push(String(err)));
   const response=await page.goto(base+'/repositories.html',{waitUntil:'load'});
   assert.equal(response?.status(),200,name+' directory must load');
   const entries=page.locator('.repo-entry');
   assert.equal(await entries.count(),44,name+' must render all 44 public repositories');
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),44,name+' all entries initially visible');
   assert.equal(await page.locator('a.repo-entry-source').count(),44,name+' every repository must link to public source');
   assert.equal(await page.locator('.repo-entry[data-kind="fork"]').count(),8,name+' upstream forks labelled');
   assert.equal(await page.locator('.repo-entry[data-kind="engineering"]').count(),26,name+' engineering projects labelled');
   assert.equal(await page.locator('.repo-entry[data-kind="website"]').count(),4,name+' website code labelled');
   assert.equal(await page.locator('.repo-entry[data-kind="learning"]').count(),6,name+' learning repos labelled');
   const sizes=await page.evaluate(()=>{
    const root=document.documentElement;
    const q=document.querySelector('#repo-search');
    return {scroll:root.scrollWidth,inner:window.innerWidth,body:document.body.scrollWidth,font:Number.parseFloat(getComputedStyle(q).fontSize)};
   });
   assert.ok(sizes.scroll<=sizes.inner+2&&sizes.body<=sizes.inner+2,name+' viewport overflow '+JSON.stringify(sizes));
   assert.ok(sizes.font>=16,name+' iOS input focus zoom risk');
   await page.locator('#repo-search').fill('PtX');
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),2,name+' PtXFlex and PtXLens search missing');
   await page.locator('#repo-search').fill('thisnamewillnevermatch');
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),0,name+' nonexistent search returned items');
   assert.equal(await page.locator('#repo-no-results:not([hidden])').count(),1,name+' empty-search state missing');
   await page.locator('#repo-empty-reset').click();
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),44,name+' empty state reset broken');
   await page.locator('button[data-repo-filter="engineering"]').click();
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),26,name+' engineering only selection broken');
   await page.locator('#repo-owner').selectOption('Open-Energy-Methods');
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),8,name+' organisation engineering subset broken');
   await page.locator('#repo-reset').click();
   await page.locator('#repo-owner').selectOption('Open-Energy-Methods');
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),10,name+' organisation ownership filter broken');
   await page.locator('#repo-reset').click();
   await page.locator('#repo-category').selectOption('Energy systems & grids');
   assert.ok(await page.locator('.repo-entry:not([hidden])').count()>5,name+' technical area filter unexpectedly empty');
   await page.locator('#repo-reset').click();
   assert.equal(await page.locator('.repo-entry:not([hidden])').count(),44,name+' final reset failed');
   const contacts=['mailto:abhijithsivaprasadan@gmail.com','https://www.linkedin.com/in/abhijith-sivaprasadan/','https://github.com/abhijith-sivaprasadan'];
   for(const href of contacts)assert.equal(await page.locator('.repo-contact-links a[href="'+href+'"]').count(),1,name+' missing contact '+href);
   assert.deepEqual(errors,[],name+' JavaScript errors: '+errors.join('; '));
   console.log('PASS '+name+': search, filters, overflow, all public links and contacts');
  } finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
