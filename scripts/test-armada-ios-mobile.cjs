#!/usr/bin/env node
/* Verify smartphone layout and contact UI in WebKit, the engine behind iOS Safari.
 * Emulates device dimensions/input, not a real hardware iPhone.
 * Run in CI after installing playwright webkit and its Linux dependencies.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { webkit, devices } = require('playwright');
const base = process.env.UI_AUDIT_BASE || 'http://127.0.0.1:8099';
const paths = ['/for/armada-2026.html',...[
 'thermal-test','power-grids','industrial-heat','mechanical-structures',
 'software-research','engineering-consulting'
].map(x=>'/for/armada-2026/'+x+'.html')];
const expected={
 email:'mailto:abhijithsivaprasadan@gmail.com',
 linkedin:'https://www.linkedin.com/in/abhijith-sivaprasadan/',
 github:'https://github.com/abhijith-sivaprasadan'
};
async function main(){
  const browser=await webkit.launch({headless:true});
  const profiles=[
    {name:'iPhone-small-320',viewport:{width:320,height:568}},
    {name:'iPhone-SE-375',viewport:{width:375,height:667}},
    {name:'iPhone-13-390',viewport:{width:390,height:844}},
    {name:'iPhone-Pro-Max-430',viewport:{width:430,height:932}},
  ];
  fs.mkdirSync('ui-audit-snapshots',{recursive:true});
  let cases=0;
  try{
    for(const profile of profiles){
      const device=devices['iPhone 13'];
      const context=await browser.newContext({...device,viewport:profile.viewport,reducedMotion:'reduce'});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      for(const path of paths){
        const response=await page.goto(base+path,{waitUntil:'load',timeout:30000});
        assert.equal(response?.status(),200,profile.name+' '+path+' returned non-200');
        await page.locator('.armada-contact-grid').waitFor();
        const stats=await page.evaluate(()=>({
          inner:window.innerWidth,
          documentWidth:document.documentElement.scrollWidth,
          bodyWidth:document.body.scrollWidth,
          meta:document.querySelector('meta[name="viewport"]')?.content,
          fontSize:(()=>{
            const input=document.querySelector('#armada-company-search, #armada-sector-search');
            return input?Number.parseFloat(getComputedStyle(input).fontSize):null;
          })(),
          footerBottom:Number.parseFloat(getComputedStyle(document.querySelector('.armada-footer')).paddingBottom),
        }));
        assert.ok(stats.documentWidth <= stats.inner+2,
          'document overflows phone: '+profile.name+' '+path+' '+JSON.stringify(stats));
        assert.ok(stats.bodyWidth <= stats.inner+2,
          'body overflows phone: '+profile.name+' '+path+' '+JSON.stringify(stats));
        assert.ok(stats.meta.includes('viewport-fit=cover'), 'missing safe-area aware viewport '+path);
        assert.ok(stats.fontSize >= 16, 'iOS input focus would zoom page '+profile.name+' '+path);
        assert.ok(stats.footerBottom>=44,'Footer has inadequate bottom padding near iPhone home indicator: '+profile.name+' '+path);
        const prefix=path.endsWith('/armada-2026.html')?'../':'../../';
        const footerDestinations=[prefix+'index.html',prefix+'about.html',prefix+'projects.html','#contact'];
        const actualFooter=await page.locator('.armada-footer-nav a').evaluateAll(items=>items.map(x=>x.getAttribute('href')));
        assert.deepEqual(actualFooter,footerDestinations,'Invalid footer navigation destinations '+path);

        const links=page.locator('.armada-contact-grid .armada-contact-link');
        assert.equal(await links.count(),3,'Missing email/LinkedIn/GitHub contact '+path);
        for(const [key,href] of Object.entries(expected)){
          const link=page.locator('.armada-contact-grid a[href="'+href+'"]');
          assert.equal(await link.count(),1,key+' link missing '+path);
          await link.scrollIntoViewIfNeeded();
          const rect=await link.boundingBox();
          assert.ok(rect && rect.width>=44 && rect.height>=44,
            'Touch target too small '+key+' '+profile.name+' '+JSON.stringify(rect));
          assert.ok(rect.x>=-2 && rect.x+rect.width<=stats.inner+2,
            'Contact link clipped '+key+' '+profile.name+' '+JSON.stringify(rect));
        }
        assert.ok(await page.locator('.armada-footer-nav a').count()>=3,
          'Missing navigation at end '+path);
        const header=page.locator('.topbar nav');
        const h=await header.evaluate(el=>({
          clientWidth:el.clientWidth, scrollWidth:el.scrollWidth,
          overflow:getComputedStyle(el).overflowX
        }));
        assert.ok(h.clientWidth<=stats.inner && h.overflow==='auto',
          'Phone navigation not in its own swipe area '+path+' '+JSON.stringify(h));
        if(path.endsWith('/thermal-test.html')){
          const tabs=page.locator('.subnav');
          assert.ok(await tabs.count(), 'Sector navigation missing');
          const nav=await tabs.evaluate(el=>({
            width:el.clientWidth,all:el.scrollWidth,overflow:getComputedStyle(el).overflowX
          }));
          assert.equal(nav.overflow,'auto','specialisation links do not scroll independently');
          assert.ok(nav.width<=stats.inner && nav.all>=nav.width,'sector nav is wider than phone '+JSON.stringify(nav));
          const input=page.locator('#armada-probe-x');
          const touch=await input.evaluate(el=>getComputedStyle(el).height);
          assert.ok(parseFloat(touch)>=44,'Engineering slider has insufficient touch height: '+touch);
          await page.locator('button[data-stage="2"]').click();
          assert.equal(await page.locator('button[data-stage="2"]').getAttribute('aria-pressed'),'true',
            'Engineering workbench does not respond to iPhone touch');
        }else if(path.endsWith('/armada-2026.html')){
          const find=page.locator('#armada-company-search');
          await find.fill('Hitachi');
          assert.equal(await page.locator('#armada-company-index a:not([hidden])').count(),1,
            'Company search fails in mobile WebKit');
          await find.fill('');
        }
        if(profile.viewport.width===390 && (path.endsWith('/armada-2026.html')||path.endsWith('/thermal-test.html'))){
          await page.evaluate(()=>scrollTo(0,0));
          await page.screenshot({path:'ui-audit-snapshots/armada-ios-'+
            (path.endsWith('thermal-test.html')?'thermal':'hub')+'-firstfold-390.png'});
          await page.locator('#contact').scrollIntoViewIfNeeded();
          await page.screenshot({path:'ui-audit-snapshots/armada-ios-'+
            (path.endsWith('thermal-test.html')?'thermal':'hub')+'-contact-390.png'});
        }
        cases++;
      }
      assert.deepEqual(errors,[],'WebKit page errors at '+profile.name);
      await context.close();
    }
    console.log('PASS: '+cases+' simulated iPhone/WebKit page-width cases; all contact links, Safari input sizes, navigation, scroll overflow and touch controls');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
