#!/usr/bin/env node
/**
 * Browser acceptance for interactive field engineering work sample.
 * Requires local static server: python3 -m http.server 8099
 * Requires Playwright/Chromium in NODE_PATH (used by existing UI audit).
 */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const base=process.env.UI_AUDIT_BASE||"http://127.0.0.1:8099";
const endpoint="/projects/gas-turbine-performance-work-sample.html";
const root=path.resolve(__dirname,"..");

(async()=>{
 const original=JSON.parse(fs.readFileSync(path.join(root,"data/performance-engineering/esan2017-measured-sample.json"),"utf8"));
 assert.equal(original.electricalValidCount,2966);
 assert.equal(original.excludedSlotCount,838);
 assert.equal(original.rows.length,229);
 assert.equal(original.sampleStride,13);
 assert.equal(original.sourceSlots,3804);
 assert.equal(original.originalSHA256,"09b8ba80991998a370b6f8124450792a5150103383c0eff41f8f00b54d3e3bf9");
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
 try{
  const c=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:"reduce"});
  const page=await c.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const res=await page.goto(base+endpoint,{waitUntil:"load",timeout:25000});
  assert.equal(res.status(),200);
  await page.waitForFunction(()=>document.querySelector("#pe-source-status")?.dataset.state==="ready",{timeout:10000});
  const summary=await page.evaluate(()=>{
   const t=id=>document.getElementById(id)?.textContent?.trim();
   return {source:t("pe-source-status"),count:t("pe-source-count"),power:t("pe-power"),
    delta:t("pe-power-delta"),heat:t("pe-heat-rate"),cp:t("pe-cp"),
    points:document.querySelectorAll("#pe-real-chart .pe-measured-point").length,
    sourceName:document.getElementById("pe-point-inspector")?.textContent||"",
    link:!!document.querySelector('a[href="thermotwin-f.html"]')};
  });
  assert.ok(summary.source.includes("229 deterministic measured records"),JSON.stringify(summary));
  assert.equal(summary.count,"229 / 229 sampled");
  assert.equal(summary.points,229);
  assert.ok(summary.delta.includes("0.00 %"),"ISO reference slider must match fixed ISO reference exactly");
  assert.ok(summary.cp.startsWith("1.0000"),"Reference correction must equal 1");
  assert.ok(summary.sourceName.includes("SOURCE: worksheet"));
  assert.ok(summary.link);
  const initial=summary.power;
  const current=await page.evaluate(()=>{
   const slider=document.querySelector("#pe-input-temp");
   slider.value="35";slider.dispatchEvent(new Event("input",{bubbles:true}));
   return {power:document.getElementById("pe-power").textContent,
    heat:document.getElementById("pe-heat-rate").textContent,
    cp:document.getElementById("pe-cp").textContent,
    path:document.querySelector("#pe-sweep-chart path")?.getAttribute("d"),
    iso:document.getElementById("pe-value-temp").textContent};
  });
  assert.notEqual(current.power,initial,"Temperature slider must recompute actual calculated power");
  assert.equal(current.iso,"35 °C");
  assert.notEqual(current.cp,"1.0000");
  assert.ok(current.path?.includes("M"));
  await page.locator("#pe-sweep-mode").selectOption("pressure");
  assert.ok((await page.locator("#pe-sweep-chart").getAttribute("aria-label")).includes("ambient pressure"));
  await page.locator("#pe-reset").click();
  assert.equal(await page.locator("#pe-power").textContent(),initial,"Reset must restore identical ISO power");
  const inspectedBefore=await page.locator("#pe-point-inspector").textContent();
  const points=page.locator("#pe-real-chart .pe-measured-point");
  await points.nth(4).focus();
  const inspectedAfter=await page.locator("#pe-point-inspector").textContent();
  assert.notEqual(inspectedAfter,inspectedBefore,"Keyboard focus on plotted data must update source inspector");
  await page.locator("#pe-outliers").check();
  const subset=Number((await page.locator("#pe-source-count").textContent()).split(" ")[0]);
  assert.ok(subset>=1&&subset<229,"Outlier filter must operate on actual sample and update metrics");
  assert.equal(await page.locator("#pe-real-chart .pe-measured-point").count(),subset);
  await page.locator("#pe-outliers").uncheck();
  assert.equal(await page.locator("#pe-real-chart .pe-measured-point").count(),229);
  for(const width of [320,390,673,1024,1440]){
   await page.setViewportSize({width,height:900});
   await page.waitForTimeout(120);
   const bleed=await page.evaluate(()=>({bleed:document.documentElement.scrollWidth-innerWidth,
      scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(bleed.bleed<=5,"Horizontal document overflow at "+width+"px: "+JSON.stringify(bleed));
  }
  assert.deepEqual(errors,[],"Page JavaScript exception");
  await page.setViewportSize({width:1440,height:900});
  const folder=path.join(root,"ui-audit-snapshots");fs.mkdirSync(folder,{recursive:true});
  await page.screenshot({path:path.join(folder,"gt-performance-work-sample-1440.png"),fullPage:true,animations:"disabled"});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(folder,"gt-performance-work-sample-390.png"),fullPage:true,animations:"disabled"});
  console.log(JSON.stringify({accepted:true,realDataSamples:229,highResidualSampleCount:subset,
    referencePower:initial,temp35Power:current.power,viewportTests:[320,390,673,1024,1440],
    checked:["Original source contract","ISO reset","Thermal slider","Pressure chart","Keyboard source drill-down","High residual source subset","Document overflow","JS errors","Screenshots"]},null,2));
  await c.close();
 }finally{await browser.close();}
})().catch(e=>{console.error("GT performance browser acceptance FAILED",e);process.exitCode=1;});
