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
  // Pass-off module: hypothetical signal values never become actual test data.
  assert.equal((await page.locator("#pe-po-screen").textContent()).trim(),
    "INDUSTRIAL PASS-OFF: NOT ASSESSED");
  assert.ok((await page.locator("#pe-po-source").textContent()).includes("SYNTHETIC"));
  const passoffAtReference=await page.evaluate(()=>{
    const read=id=>document.getElementById(id)?.textContent?.trim();
    return {cp:read("pe-po-cp"),chr:read("pe-po-chr"),
      p:read("pe-po-corrected-power"),hr:read("pe-po-corrected-hr"),
      uP:read("pe-po-up"),uHR:read("pe-po-uhr"),
      rho:read("pe-po-corr"),status:read("pe-po-window-status")};
  });
  assert.equal(passoffAtReference.cp,"1.00000");
  assert.equal(passoffAtReference.chr,"1.00000");
  assert.ok(passoffAtReference.p.includes("MW"));
  assert.ok(passoffAtReference.uP.includes("MW"));
  assert.equal(passoffAtReference.status,"ILLUSTRATIVE SCREEN / STABLE");
  const originalU=parseFloat(passoffAtReference.uP.replaceAll(",",""));
  assert.ok(originalU>0);
  await page.locator("#pe-po-anomaly").selectOption("oscillation");
  assert.equal((await page.locator("#pe-po-window-status").textContent()).trim(),"DATA HOLD");
  await page.locator("#pe-po-anomaly").selectOption("drift");
  assert.equal((await page.locator("#pe-po-window-status").textContent()).trim(),"DATA HOLD");
  await page.locator("#pe-po-anomaly").selectOption("dropout");
  assert.equal((await page.locator("#pe-po-window-status").textContent()).trim(),"DATA HOLD");
  await page.locator("#pe-po-anomaly").selectOption("steady");
  assert.equal((await page.locator("#pe-po-window-status").textContent()).trim(),"ILLUSTRATIVE SCREEN / STABLE");
  await page.locator("#pe-po-scenario").selectOption("hot");
  assert.notEqual((await page.locator("#pe-po-cp").textContent()).trim(),"1.00000",
    "Hot-ambient hypothetical site condition must recompute actual correction ratios");
  const changedUA=await page.evaluate(()=>{
    const el=document.getElementById("pe-po-calibration-p");el.value="1.2";
    el.dispatchEvent(new Event("input",{bubbles:true}));
    return document.getElementById("pe-po-up").textContent;
  });
  assert.ok(parseFloat(changedUA.replaceAll(",",""))>originalU,
    "Increasing assumed power calibration uncertainty must increase propagated u(power)");
  const oldCorrelation=(await page.locator("#pe-po-corr").textContent()).trim();
  const newCorrelation=await page.evaluate(()=>{
    const el=document.getElementById("pe-po-rho");el.value="0.55";
    el.dispatchEvent(new Event("input",{bubbles:true}));
    return document.getElementById("pe-po-corr").textContent.trim();
  });
  assert.notEqual(newCorrelation,oldCorrelation,
    "Changing P/fuel-flow instrument covariance must alter propagated output correlation");
  assert.ok((await page.locator("#pe-po-hypothetical").textContent()).includes("ILLUSTRATIVE ONLY"));
  assert.equal((await page.locator("#pe-po-screen").textContent()).trim(),
    "INDUSTRIAL PASS-OFF: NOT ASSESSED");
  await page.locator("#pe-po-reset").click();
  assert.equal((await page.locator("#pe-po-cp").textContent()).trim(),"1.00000");
  assert.equal((await page.locator("#pe-po-screen").textContent()).trim(),
    "INDUSTRIAL PASS-OFF: NOT ASSESSED");
  assert.ok(await page.locator("#pe-po-window-chart path").count()>0);
  assert.ok(await page.locator("#pe-po-budget-chart rect").count()>=4);
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
  // Main ThermoTwin case: original committed-model numbers drive all four SVGs.
  await page.goto(base+"/projects/thermotwin-f.html",{waitUntil:"load"});
  await page.waitForFunction(()=>document.querySelectorAll(".ttf-plot-ui:not([hidden])").length===4,{timeout:10000});
  assert.equal(await page.locator(".ttf-plot-ui:not([hidden])").count(),4);
  assert.equal(await page.locator(".ttf-plot-fallback:not([hidden])").count(),0);
  assert.equal(await page.locator('[data-ttf-view="design"] .ttf-chart-point').count(),4);
  const beforeTemp=(await page.locator('[data-ttf-view="design"] [data-ttf-inspect]').textContent()).trim();
  await page.locator('[data-ttf-control="design-metric"]').selectOption("pressure");
  const afterTemp=(await page.locator('[data-ttf-view="design"] [data-ttf-inspect]').textContent()).trim();
  assert.notEqual(beforeTemp,afterTemp,"Station chart must switch to archived pressure measurements");
  const degradationBefore=(await page.locator('[data-ttf-view="degradation"] [data-ttf-inspect]').textContent()).trim();
  await page.locator('[data-ttf-control="degradation-metric"]').selectOption("heat_rate_kJ_kWh");
  const degradationAfter=(await page.locator('[data-ttf-view="degradation"] [data-ttf-inspect]').textContent()).trim();
  assert.notEqual(degradationBefore,degradationAfter);
  await page.locator('[data-ttf-control="sensitivity-sweep"]').selectOption("pressureRatio");
  assert.equal(await page.locator('[data-ttf-view="sensitivity"] .ttf-chart-point').count(),13);
  await page.locator('[data-ttf-control="sensitivity-metric"]').selectOption("thermal_efficiency");
  const sig=(await page.locator('[data-ttf-view="sensitivity"] .ttf-plot').getAttribute("aria-label"));
  assert.ok(sig.includes("Thermal efficiency"));
  const startupBefore=(await page.locator('[data-ttf-view="transient"] [data-ttf-inspect]').textContent()).trim();
  await page.locator('[data-ttf-control="transient-index"]').evaluate(el=>{el.value="30";el.dispatchEvent(new Event("input",{bubbles:true}));});
  const startupAfter=(await page.locator('[data-ttf-view="transient"] [data-ttf-inspect]').textContent()).trim();
  assert.notEqual(startupBefore,startupAfter,"Scrubbing original Fortran transient must update actual source time and temperatures");
  await page.locator('[data-ttf-control="transient-schedule"]').selectOption("shutdown");
  assert.ok((await page.locator('[data-ttf-view="transient"] [data-ttf-inspect]').textContent()).includes("SHUTDOWN"));
  assert.equal(await page.locator('img[src*="hmi_f1_overview.png"]').count(),1,
    "Actual native GUI evidence screenshot must remain");
  assert.equal(await page.locator('img[src*="uncertainty.png"]').count(),1,
    "Original Monte Carlo distribution should remain a true image unless raw draws are supplied");
  assert.ok((await page.locator('img[src*="diagnostics.png"]').count())>=1,
    "Original inverse-diagnostics source imagery must remain available");
  for(const width of [320,390,673,1024,1440]){
    await page.setViewportSize({width,height:900});
    await page.waitForTimeout(70);
    const bleed=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(bleed<=5,"ThermoTwin main case document overflow at "+width+": "+bleed);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:path.join(folder,"thermotwin-embedded-charts-1440.png"),fullPage:true,animations:"disabled"});
  await page.setViewportSize({width:390,height:900});
  await page.screenshot({path:path.join(folder,"thermotwin-embedded-charts-390.png"),fullPage:true,animations:"disabled"});
  assert.deepEqual(errors,[],"Unexpected portfolio page JS exception");
  await c.close();
 }finally{await browser.close();}
})().catch(e=>{console.error("GT performance browser acceptance FAILED",e);process.exitCode=1;});
