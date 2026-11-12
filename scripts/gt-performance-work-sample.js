/* Gas turbine performance field desk.
 * Two strictly separate evidence streams:
 *  A. Independent, browser-only idealised fixed-hardware Brayton sensitivity calculation.
 *  B. Source-hashed publisher-measured 5.68 MW generator data, no fitted prediction.
 * No hosted Fortran solver, Siemens equipment model or pass-off decision is implied.
 */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const S = "http://www.w3.org/2000/svg";
  const f = (n, d=2) => Number.isFinite(n) ? n.toLocaleString("en-GB",{minimumFractionDigits:d, maximumFractionDigits:d}) : "Unavailable";
  const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent=value; };
  const limits = {temp:[-10,45],pressure:[85,105],intake:[0,5],exhaust:[0,5]};
  const defaults = {temp:15,pressure:101.325,intake:0,exhaust:0};
  const state = {...defaults};
  const physical = {
    // Fixed educational hardware/operating-point assumptions; these are NOT
    // identified Siemens or Esan OEM map/performance coefficients.
    pi:12, etaC:.84, etaT:.87, T3:1350, cpAir:1005,
    cpGas:1140, gammaAir:1.4, gammaGas:1.33, LHV:50e6,
    etaBurn:.985, etaMechanical:.985, etaGenerator:.975,
    auxFraction:.015, combustorDrop:.045,
    maReference:135, tReference:288.15, pReference:101325
  };
  function evaluate(input) {
    const a={...state,...input};
    const o=physical;
    const T1=a.temp+273.15;
    const pAmb=a.pressure*1000;
    const P1=pAmb*(1-a.intake/100);
    const P2=P1*o.pi;
    const P3=P2*(1-o.combustorDrop);
    const P4=pAmb*(1+a.exhaust/100);
    const compressorExponent=(o.gammaAir-1)/o.gammaAir;
    const turbineExponent=(o.gammaGas-1)/o.gammaGas;
    if (![T1,P1,P2,P3,P4].every(Number.isFinite) || P3<=P4 || T1<=0) return null;
    const T2=T1*(1+(Math.pow(o.pi,compressorExponent)-1)/o.etaC);
    const T4=o.T3*(1-o.etaT*(1-Math.pow(P4/P3,turbineExponent)));
    const ma=o.maReference*(P1/o.pReference)*Math.sqrt(o.tReference/T1);
    // Simplified burner balance with declared constant-property approximation.
    // No air-fuel combustion stoichiometry and no composition-dependent c_p.
    const mf=ma*o.cpGas*(o.T3-T2)/(o.etaBurn*o.LHV);
    const compressorW=ma*o.cpAir*(T2-T1);
    const turbineW=(ma+mf)*o.cpGas*(o.T3-T4);
    const netW=(turbineW-compressorW)*o.etaMechanical*o.etaGenerator*(1-o.auxFraction);
    const powerMW=netW/1e6;
    const fuelMW=mf*o.LHV/1e6;
    const heatRate=3600*fuelMW/powerMW;
    if (![T2,T4,ma,mf,powerMW,heatRate].every(Number.isFinite)||powerMW<=0||mf<=0)return null;
    return {T1,T2,T3:o.T3,T4,P1,P2,P3,P4,ma,mf,powerMW,heatRate,fuelMW,exhaustFlow:ma+mf,
      thermalEfficiency:powerMW/fuelMW};
  }
  const ref=evaluate(defaults);
  const el=(name,attrs={},textContent) => {
    const node=document.createElementNS(S,name);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
    if(textContent!==undefined)node.textContent=String(textContent);
    return node;
  };
  function axes(svg,{left,right,top,bottom,xMax,yMin,yMax,xLabel,yLabel,xTicks=5,yTicks=5}) {
    const plotWidth=right-left,plotHeight=bottom-top;
    for(let i=0;i<=yTicks;i++){
      const y=top+plotHeight*i/yTicks;
      const value=yMax-(yMax-yMin)*i/yTicks;
      svg.append(el("line",{x1:left,y1:y,x2:right,y2:y,class:"pe-grid"}));
      svg.append(el("text",{x:left-9,y:y+4,"text-anchor":"end"},Math.round(value)));
    }
    for(let i=0;i<=xTicks;i++){
      const x=left+plotWidth*i/xTicks;
      svg.append(el("line",{x1:x,y1:top,x2:x,y2:bottom,class:"pe-grid"}));
      svg.append(el("text",{x,y:bottom+19,"text-anchor":"middle"},Math.round(xMax*i/xTicks)));
    }
    svg.append(el("line",{x1:left,y1:bottom,x2:right,y2:bottom,class:"pe-axis"}));
    svg.append(el("line",{x1:left,y1:top,x2:left,y2:bottom,class:"pe-axis"}));
    svg.append(el("text",{x:(left+right)/2,y:bottom+42,"text-anchor":"middle"},xLabel));
    svg.append(el("text",{x:left,y:top-11},yLabel));
  }
  function renderSweep() {
    const svg=$("#pe-sweep-chart");
    if(!svg)return;
    svg.replaceChildren();
    svg.setAttribute("viewBox","0 0 760 325");
    const mode=$("#pe-sweep-mode")?.value||"temp";
    const parameter=mode==="pressure"?"pressure":"temp";
    const domain=limits[parameter],num=60;
    const points=Array.from({length:num+1},(_,i)=>{
      const x=domain[0]+(domain[1]-domain[0])*i/num;
      const r=evaluate({[parameter]:x});
      return {x,p:r?.powerMW||NaN,h:r?.heatRate||NaN};
    }).filter(v=>Number.isFinite(v.p));
    const left=67,right=733,top=34,bottom=260;
    const pAll=points.map(v=>v.p);
    const min=Math.floor((Math.min(...pAll)-1)/5)*5;
    const max=Math.ceil((Math.max(...pAll)+1)/5)*5;
    const yScale=v=>bottom-(v-min)/(max-min)*(bottom-top);
    const xScale=v=>left+(v-domain[0])/(domain[1]-domain[0])*(right-left);
    const xStep=(domain[1]-domain[0])/5;
    for(let i=0;i<=5;i++){
      const yy=top+(bottom-top)*i/5;
      svg.append(el("line",{x1:left,y1:yy,x2:right,y2:yy,class:"pe-grid"}));
      svg.append(el("text",{x:left-8,y:yy+4,"text-anchor":"end"},f(max-i*(max-min)/5,0)));
      const xx=left+(right-left)*i/5;
      svg.append(el("line",{x1:xx,y1:top,x2:xx,y2:bottom,class:"pe-grid"}));
      svg.append(el("text",{x:xx,y:bottom+20,"text-anchor":"middle"},f(domain[0]+xStep*i,mode==="pressure"?1:0)));
    }
    svg.append(el("text",{x:left,y:18},"NET ELECTRIC POWER · MW / BROWSER-ONLY MODEL"));
    svg.append(el("text",{x:(left+right)/2,y:bottom+45,"text-anchor":"middle"},parameter==="temp"?"Ambient temperature · °C":"Absolute ambient pressure · kPa"));
    const path=points.map((v,i)=>(i?"L":"M")+f(xScale(v.x),3)+","+f(yScale(v.p),3)).join(" ");
    svg.append(el("path",{d:path,fill:"none",stroke:"#65d6c9","stroke-width":2.8,"stroke-linejoin":"round"}));
    const at=state[parameter], current=evaluate();
    if(current){
      const x=xScale(at),y=yScale(current.powerMW);
      svg.append(el("line",{x1:x,y1:top,x2:x,y2:bottom,stroke:"#d7b46a","stroke-width":1.5,"stroke-dasharray":"5 5"}));
      svg.append(el("circle",{cx:x,cy:y,r:7,fill:"#d7b46a",stroke:"#0b110d","stroke-width":2}));
      svg.append(el("text",{x:Math.max(left+6,Math.min(right-6,x)),y:Math.max(30,y-17),"text-anchor":"middle",fill:"#f2f0e7"},f(current.powerMW,2)+" MW"));
    }
    svg.setAttribute("role","img");
    svg.setAttribute("aria-label","Calculated simplified constant-property gas turbine net power against "+
      (parameter==="temp"?"temperature":"ambient pressure")+
      "; reference power "+f(ref.powerMW,2)+" MW; current "+f(current?.powerMW,2)+" MW. This is not the actual Fortran model.");
  }
  function updateModel() {
    for(const [key,[min,max]] of Object.entries(limits)){
      const input=document.getElementById("pe-input-"+key);
      if(!input)continue;
      const v=Number(input.value);
      state[key]=Math.max(min,Math.min(max,Number.isFinite(v)?v:defaults[key]));
      text("pe-value-"+key, f(state[key],key==="pressure"?1:0)+(key==="temp"?" °C":key==="pressure"?" kPa":" %"));
    }
    const v=evaluate();
    if(!v){text("pe-power","OUTSIDE MODEL DOMAIN");return;}
    const cp=ref.powerMW/v.powerMW;
    const chr=ref.heatRate/v.heatRate;
    text("pe-power",f(v.powerMW,2)+" MW");
    text("pe-power-delta",f((v.powerMW/ref.powerMW-1)*100,2)+" % vs reference");
    text("pe-heat-rate",f(v.heatRate,0)+" kJ/kWh");
    text("pe-heat-rate-delta",f((v.heatRate/ref.heatRate-1)*100,2)+" % vs reference");
    text("pe-cp",f(cp,4));
    text("pe-chr",f(chr,4));
    text("pe-reconstruction",f(cp*v.powerMW,3)+" MW");
    text("pe-ma",f(v.ma,2)+" kg/s");
    text("pe-mf",f(v.mf,3)+" kg/s");
    text("pe-t2",f(v.T2,1)+" K");
    text("pe-t4",f(v.T4,1)+" K");
    text("pe-eta",f(v.thermalEfficiency*100,2)+" %");
    text("pe-ratio",f(v.P2/v.P1,2));
    text("pe-p1",f(v.P1/1000,2)+" kPa(a)");
    text("pe-p4",f(v.P4/1000,2)+" kPa(a)");
    text("pe-sweep-status","Recomputed "+new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"})+" · independent browser equation; not Fortran output");
    renderSweep();
    // Deliberately expose only the current educational equation outputs via
    // a data-only browser event. Pass-off demonstration must not call these
    // genuine measurements or invoke a Fortran/OEM correction service.
    window.dispatchEvent(new CustomEvent("thermotwin:educational-site-update",{
      detail:{source_class:"browser_constant_property_illustration",state:{...state},
        prediction:{...v},reference:{...ref},LHV_J_kg:physical.LHV}
    }));
  }
  document.addEventListener("thermotwin:request-educational-site-update",updateModel);
  $("[data-pe-physical-input]").forEach(input=>input.addEventListener("input",updateModel));
  $("#pe-reset")?.addEventListener("click",()=>{
    for(const [key,value] of Object.entries(defaults)){const el=document.getElementById("pe-input-"+key);if(el)el.value=String(value);}
    updateModel();
  });
  $("#pe-sweep-mode")?.addEventListener("change",renderSweep);
  // Real original-source data, never fabricated if fetch or source validation fails.
  const dataState={rows:[],sample:[],selected:-1,highOnly:false,ready:false};
  const num=n=>Number(n);
  const identity=r=>Math.sqrt(3)*r[4]*(r[5]+r[6]+r[7])/3*r[8]/1000;
  function metrics(rows) {
    if(!rows.length)return null;
    const diffs=rows.map(r=>r[3]-identity(r));
    const n=diffs.length;
    return {n,rmse:Math.sqrt(diffs.reduce((s,d)=>s+d*d,0)/n),
      mae:diffs.reduce((s,d)=>s+Math.abs(d),0)/n,
      bias:diffs.reduce((s,d)=>s+d,0)/n,
      exceed:diffs.filter(d=>Math.abs(d)>250).length};
  }
  function sourceStatus(message,error=false){
    const node=$("#pe-source-status");
    if(!node)return;
    node.textContent=message;
    node.dataset.state=error?"error":"ready";
  }
  function inspectReal(r) {
    const node=$("#pe-point-inspector");
    if(!node||!r)return;
    const [sheet,label,column,p,voltage,ia,ib,ic,pf,t1,pcd,t7,fuel]=r;
    const est=identity(r),residual=p-est;
    node.replaceChildren();
    const a=document.createElement("p");
    a.textContent="SOURCE: worksheet "+sheet+" ("+label+"), cell column "+column+
      " · reported P "+f(p,1)+" kW · recomputed "+f(est,1)+" kW · residual "+f(residual,1)+" kW";
    const b=document.createElement("p");
    b.textContent="Recorded: V="+f(voltage,0)+" V · IA/B/C="+f(ia,1)+"/"+f(ib,1)+"/"+f(ic,1)+
      " A · PF="+f(pf,3)+" · T1="+f(t1,1)+" °C · PCD="+f(pcd,2)+" barg · T7="+f(t7,1)+
      " °C · gas fuel="+f(fuel,1)+" kg/h";
    const c=document.createElement("p");
    c.textContent="Source positions are audit anchors; this is not an equipment trip label, independently metered truth or direct GT physics prediction.";
    node.append(a,b,c);
  }
  function renderMeasured() {
    const svg=$("#pe-real-chart");
    if(!svg)return;
    svg.replaceChildren();
    svg.setAttribute("viewBox","0 0 760 360");
    const left=70,right=724,top=35,bottom=292,max=5680;
    axes(svg,{left,right,top,bottom,xMax:max,yMin:0,yMax:max,xLabel:"Measured real electrical power · kW",yLabel:"Electrical identity reconstruction · kW"});
    const xScale=v=>left+v/max*(right-left);
    const yScale=v=>bottom-v/max*(bottom-top);
    svg.append(el("line",{x1:left,y1:bottom,x2:right,y2:top,stroke:"#d7b46a","stroke-width":1.6,"stroke-dasharray":"5 5"}));
    const list=dataState.highOnly?dataState.rows.filter(r=>Math.abs(r[3]-identity(r))>250):dataState.rows;
    const m=metrics(list);
    text("pe-source-count",String(list.length)+" / "+dataState.rows.length+" sampled");
    text("pe-sample-rmse",m?f(m.rmse,1)+" kW":"—");
    text("pe-sample-mae",m?f(m.mae,1)+" kW":"—");
    text("pe-sample-bias",m?f(m.bias,1)+" kW":"—");
    text("pe-outlier-count",m?String(m.exceed):"0");
    if(!list.length){
      svg.append(el("text",{x:370,y:160,"text-anchor":"middle"},"No source measurements match this view."));
      return;
    }
    list.forEach(r=>{
      const pred=identity(r),y=Math.min(max,Math.max(0,pred)),res=r[3]-pred;
      const high=Math.abs(res)>250;
      const circ=el("circle",{
        cx:xScale(r[3]),cy:yScale(y),r:high?5.3:3.3,
        fill:high?"#eda28a":"#65d6c9",opacity:high?.92:.72,
        class:"pe-measured-point",tabindex:"0",role:"button",
        "aria-label":"Source worksheet "+r[0]+" "+r[1]+" cell "+r[2]+", measured power "+
          f(r[3],1)+" kW; reconstructed "+f(pred,1)+" kW; residual "+f(res,1)+" kW"
      });
      circ.append(el("title",{},"Worksheet "+r[0]+" "+r[1]+" "+r[2]+"; measured "+f(r[3],1)+
        " kW; electrical identity "+f(pred,1)+" kW"));
      circ.addEventListener("click",()=>inspectReal(r));
      circ.addEventListener("focus",()=>inspectReal(r));
      circ.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();inspectReal(r);}});
      svg.append(circ);
    });
    const v="Measured original-source electrical comparison: "+list.length+
       " publisher rows from a deterministic one-in-13 audited subsample; sample RMSE "+
       f(m.rmse,1)+" kilowatts. Red points have absolute electrical identity residual above 250 kilowatts.";
    svg.setAttribute("role","img");svg.setAttribute("aria-label",v);
    inspectReal(list[0]);
  }
  $("#pe-outliers")?.addEventListener("change",e=>{dataState.highOnly=e.target.checked;renderMeasured();});
  async function loadMeasured(){
    try{
      const response=await fetch("../data/performance-engineering/esan2017-measured-sample.json",{cache:"no-store"});
      if(!response.ok)throw Error("HTTP "+response.status);
      const dataset=await response.json();
      if(dataset.schema!=="portfolio.gt-real-source-sample.v1"||dataset.originalSHA256!==
        "09b8ba80991998a370b6f8124450792a5150103383c0eff41f8f00b54d3e3bf9"||
        dataset.electricalValidCount!==2966||dataset.excludedSlotCount!==838||
        dataset.sourceSlots!==3804||dataset.sampleStride!==13||
        !Array.isArray(dataset.rows)||dataset.rows.length!==229||
        dataset.rows.some(r=>!Array.isArray(r)||r.length!==13||![r[3],r[4],r[5],r[6],r[7],r[8]].every(Number.isFinite)))
          throw Error("Source integrity contract mismatch");
      dataState.rows=dataset.rows;dataState.ready=true;
      text("pe-raw-count",f(dataset.electricalValidCount,0));
      text("pe-excluded",f(dataset.excludedSlotCount,0));
      sourceStatus("Source-loaded · 229 deterministic measured records · pinned 2019 publisher XLSX SHA-256 · 317 original worksheets.");
      renderMeasured();
    }catch(err){
      dataState.rows=[];dataState.ready=false;
      sourceStatus("NO MEASURED DATA — "+err.message+". No synthetic fallbacks are used.",true);
      text("pe-sample-rmse","Unavailable");text("pe-sample-mae","Unavailable");
      text("pe-sample-bias","Unavailable");text("pe-source-count","0 loaded");
      const svg=$("#pe-real-chart");
      if(svg){svg.replaceChildren();svg.setAttribute("role","img");svg.setAttribute("aria-label","Original-source measurements unavailable");}
      const inspector=$("#pe-point-inspector");
      if(inspector)inspector.textContent="Original source could not be verified or loaded. Consult the publisher and the reproducibility script.";
    }
  }
  $("#pe-export")?.addEventListener("click",()=>{
    const v=evaluate();if(!v)return;
    const output={
      schema:"portfolio.educational_brayton_browser_sensitivity.v1",
      timestamp:new Date().toISOString(),
      evidence_class:"illustrative constant-property algebra; not actual Fortran or measured turbine prediction",
      operating_reference:"same generic fixed hardware, simple-cycle full-load assumption",
      inputs:state, fixed_equation_assumptions:physical,
      computed:{...v,powerReferenceMW:ref.powerMW,heatRateReferenceKJkWh:ref.heatRate,
        correctionPower:ref.powerMW/v.powerMW,correctionHeatRate:ref.heatRate/v.heatRate},
      full_scale_industrial_validation:false
    };
    const blob=new Blob([JSON.stringify(output,null,2)+"\n"],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="gas-turbine-educational-sensitivity.json";document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  // Accessible menu, source-verified chart, deterministic controls.
  updateModel();
  loadMeasured();
  if("IntersectionObserver" in window){
    const anchor=$$(".pe-aside a[href^='#']");
    const observer=new IntersectionObserver(entries=>{
      const seen=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if(!seen.length)return;
      const id=seen[0].target.id;
      for(const link of anchor)link.setAttribute("aria-current",link.getAttribute("href")==="#"+id?"location":"false");
    },{rootMargin:"-15% 0px -60% 0px",threshold:[0,.1,.3]});
    for(const section of $$(".pe-section[id]"))observer.observe(section);
  }
})();
