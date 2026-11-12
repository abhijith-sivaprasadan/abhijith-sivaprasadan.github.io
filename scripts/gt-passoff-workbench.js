/* Performance pass-off demonstrator: source-classed illustrative arithmetic.
 * Formulas follow ThermoTwin-F scripts/passoff_correction.py (conditional
 * instrument covariance, fixed correction factors). No operator measurements,
 * OEM maps, certified test windows, guarantees or actual acceptance decisions.
 */
(() => {
 "use strict";
 const $=id=>document.getElementById(id);
 if(!$("pe-passoff-desk"))return;
 const NS="http://www.w3.org/2000/svg";
 const f=(n,d=2)=>Number.isFinite(n)?n.toLocaleString("en-GB",{minimumFractionDigits:d,maximumFractionDigits:d}):"unavailable";
 const set=(id,value)=>{const node=$(id);if(node)node.textContent=value};
 const sourceLabel="SYNTHETIC / EDUCATIONAL ARITHMETIC · no operator data";
 const store={site:null,reference:null,siteInputs:null,LHV:50e6};
 const defaultCtl={powerBias:-1.5,fuelBias:1,lhv:50,precisionP:0.25,precisionF:0.45,precisionL:0.70,
  calibrationP:0.35,calibrationF:0.60,calibrationL:0.90,rho:-0.35,powerThreshold:98,hrThreshold:105};
 const num=(id)=>Number($(id)?.value);
 const cfg=[
  ["powerBias","pe-po-power-bias","%","1"],
  ["fuelBias","pe-po-fuel-bias","%","1"],
  ["lhv","pe-po-lhv","MJ/kg","1"],
  ["precisionP","pe-po-precision-p","%","2"],
  ["precisionF","pe-po-precision-f","%","2"],
  ["precisionL","pe-po-precision-l","%","2"],
  ["calibrationP","pe-po-calibration-p","%","2"],
  ["calibrationF","pe-po-calibration-f","%","2"],
  ["calibrationL","pe-po-calibration-l","%","2"],
  ["rho","pe-po-rho","","2"],
  ["powerThreshold","pe-po-power-threshold","%","1"],
  ["hrThreshold","pe-po-hr-threshold","%","1"]
 ];
 const scenarios={
  reference:{temp:15,pressure:101.325,intake:0,exhaust:0},
  hot:{temp:35,pressure:101.325,intake:0,exhaust:0},
  pressure:{temp:15,pressure:90,intake:0,exhaust:0},
  inlet:{temp:15,pressure:101.325,intake:3,exhaust:0},
  combined:{temp:35,pressure:94,intake:2,exhaust:3},
 };
 const svgNode=(tag,attrs={},txt)=>{const v=document.createElementNS(NS,tag);for(const [key,val] of Object.entries(attrs))v.setAttribute(key,String(val));if(txt!==undefined)v.textContent=String(txt);return v};
 function sum(a,b){return a.map((row,i)=>row.map((v,j)=>v+b[i][j]))}
 function covariance(std,rho=0){let c=[[std[0]**2,0,0],[0,std[1]**2,0],[0,0,std[2]**2]];c[0][1]=std[0]*std[1]*rho;c[1][0]=c[0][1];return c}
 function dot(a,c,b){return a.reduce((sum,v,i)=>sum+v*c[i].reduce((s,x,j)=>s+x*b[j],0),0)}
 const square=x=>x*x;
 function compute(){
  const {site,reference,LHV}=store;
  if(!site||!reference)return null;
  const vals=Object.fromEntries(cfg.map(([key,id])=>[key,num(id)]));
  if(Object.values(vals).some(x=>!Number.isFinite(x)))return null;
  const p=site.powerMW*(1+vals.powerBias/100);
  const mf=site.mf*(1+vals.fuelBias/100);
  const lhv=vals.lhv*1e6;
  if(p<=0||mf<=0||lhv<=0||site.powerMW<=0||site.heatRate<=0)return null;
  // Source-locked method: factors are fixed in the 3-channel instrument Jacobian.
  const cp=reference.powerMW/site.powerMW;
  const chr=reference.heatRate/site.heatRate;
  const siteHr=3600*(mf*lhv/1e6)/p;
  const correctedP=cp*p,correctedHr=chr*siteHr;
  const jp=[cp,0,0],jh=[-correctedHr/p,correctedHr/mf,correctedHr/lhv];
  const precision=covariance([p*vals.precisionP/100,mf*vals.precisionF/100,lhv*vals.precisionL/100]);
  const calibration=covariance([p*vals.calibrationP/100,mf*vals.calibrationF/100,lhv*vals.calibrationL/100],vals.rho);
  const total=sum(precision,calibration);
  const vpP=Math.max(0,dot(jp,precision,jp)),vpH=Math.max(0,dot(jh,precision,jh));
  const vcP=Math.max(0,dot(jp,calibration,jp)),vcH=Math.max(0,dot(jh,calibration,jh));
  const vP=Math.max(0,dot(jp,total,jp)),vH=Math.max(0,dot(jh,total,jh));
  const uP=Math.sqrt(vP),uH=Math.sqrt(vH);
  const cv=dot(jp,total,jh);
  const corr=uP*uH>0?cv/(uP*uH):null;
  return {vals,p,mf,lhv,cp,chr,siteHr,correctedP,correctedHr,jp,jh,
   precision,calibration,combined:total,uP,uH,vpP,vpH,vcP,vcH,covariancePH:cv,corr,
   nominalPowerThreshold:reference.powerMW*vals.powerThreshold/100,
   nominalHeatRateThreshold:reference.heatRate*vals.hrThreshold/100};
 }
 // Deterministic, synthetic 16-point site-power window: illustrative QC only.
 function windowPoints(power,kind){
  return Array.from({length:16},(_,i)=>{
   const t=i*10;
   if(kind==="dropout"&&i===7)return {time:t,power:null};
   const noise=(Math.sin(i*1.7)+Math.cos(i*1.1)*.3)*0.0013;
   const disturbance=kind==="oscillation"?0.021*Math.sin(i*2.3):
    kind==="drift"?(i/15)*0.032:0;
   return {time:t,power:power*(1+noise+disturbance)};
  });
 }
 function qc(points){
  const actual=points.filter(x=>Number.isFinite(x.power)).map(x=>x.power);
  if(actual.length<points.length)return {status:"DATA HOLD",reason:"Missing recording / unreconciled channel gap",cv:null,slope:null,healthy:false};
  const mean=actual.reduce((x,y)=>x+y,0)/actual.length;
  const sd=Math.sqrt(actual.reduce((s,x)=>s+(x-mean)**2,0)/actual.length);
  const cv=100*sd/mean;
  const slope=100*(actual.at(-1)-actual[0])/mean;
  const stable=cv<0.8 && Math.abs(slope)<1.0;
  return {status:stable?"ILLUSTRATIVE SCREEN / STABLE":"DATA HOLD",reason:stable?
   "Illustrative window below declared CV and endpoint-drift thresholds":
   "Illustrative CV > 0.8% or endpoint drift > 1.0%; revise interval",cv,slope,healthy:stable};
 }
 function drawTrace(points,status){
  const svg=$("pe-po-window-chart");
  if(!svg)return;
  svg.replaceChildren();svg.setAttribute("viewBox","0 0 730 220");
  const valid=points.filter(x=>x.power!==null);
  const pvalues=valid.map(x=>x.power);
  const min=Math.min(...pvalues),max=Math.max(...pvalues);
  const pad=Math.max(.15,(max-min)*.2),lo=min-pad,hi=max+pad;
  const l=65,r=709,t=24,b=171;
  const xp=x=>l+(r-l)*x/150;
  const yp=y=>b-(b-t)*(y-lo)/(hi-lo);
  for(let i=0;i<=4;i++){
   const yy=t+(b-t)*i/4,tt=hi-(hi-lo)*i/4;
   svg.append(svgNode("line",{x1:l,y1:yy,x2:r,y2:yy,stroke:"#304438","stroke-width":1}));
   svg.append(svgNode("text",{x:l-9,y:yy+4,"text-anchor":"end",fill:"#c3d0c1","font-size":11},f(tt,1)));
  }
  svg.append(svgNode("text",{x:l,y:14,fill:"#d7b46a","font-size":11},"SYNTHETIC 16-POINT POWER TRACE · MW"));
  svg.append(svgNode("text",{x:(l+r)/2,y:210,fill:"#c3d0c1","font-size":11,"text-anchor":"middle"},"Relative sample time · seconds"));
  let d="";
  points.forEach((v,i)=>{if(v.power===null)return;
    const segmentStart=i===0||points[i-1].power===null;
    d+=(segmentStart?"M":"L")+xp(v.time).toFixed(2)+" "+yp(v.power).toFixed(2)+" ";
  });
  svg.append(svgNode("path",{d,fill:"none",stroke:status.healthy?"#65d6c9":"#eda28a","stroke-width":2.6}));
  points.forEach(x=>{
   if(x.power===null){
    svg.append(svgNode("circle",{cx:xp(x.time),cy:(t+b)/2,r:5,fill:"#eda28a"}));
    svg.append(svgNode("title",{},"Source-simulation gap at "+x.time+" s"));
    return;
   }
   const dot=svgNode("circle",{cx:xp(x.time),cy:yp(x.power),r:3.5,fill:"#65d6c9"});
   dot.append(svgNode("title",{},x.time+" s · "+f(x.power,3)+" MW · synthetic"));
   svg.append(dot);
  });
  for(let i=0;i<=3;i++){svg.append(svgNode("text",{x:xp(i*50),y:b+20,"text-anchor":"middle",fill:"#c3d0c1","font-size":11},i*50))}
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label","Synthetic 16-point generator-power trace. "+status.status+". "+
   (status.cv===null?"Missing sample.":"Coefficient of variation "+f(status.cv,2)+" percent; endpoint drift "+f(status.slope,2)+" percent."));
 }
 function drawBudget(out){
  const svg=$("pe-po-budget-chart");if(!svg)return;
  svg.replaceChildren();svg.setAttribute("viewBox","0 0 730 198");
  const data=[
   ["Corrected power",out.vpP,out.vcP,"MW²"],
   ["Corrected heat rate",out.vpH,out.vcH,"(kJ/kWh)²"]
  ];
  for(const [i,row] of data.entries()){
   const [label,p,c,unit]=row,base=i*94;
   const total=p+c,offset=180,barMax=390;
   const width=total>0?barMax:0;
   const px=total>0?width*(p/total):0,cx=total>0?width*(c/total):0;
   svg.append(svgNode("text",{x:13,y:26+base,fill:"#dfeee3","font-size":12},label));
   svg.append(svgNode("rect",{x:offset,y:13+base,width:px,height:20,fill:"#65d6c9",rx:2}));
   svg.append(svgNode("rect",{x:offset+px,y:13+base,width:cx,height:20,fill:"#d7b46a",rx:2}));
   svg.append(svgNode("text",{x:offset,y:53+base,fill:"#c0d0c2","font-size":11},"Precision "+f(total>0?100*p/total:0,1)+"% · calibration "+f(total>0?100*c/total:0,1)+"% of instrument variance"));
   svg.append(svgNode("text",{x:offset,y:70+base,fill:"#a8bbae","font-size":10},"Variance basis: "+unit+" · magnitude not comparable between rows"));
  }
  svg.setAttribute("role","img");svg.setAttribute("aria-label","Within-output precision/calibration instrument variance attribution, not full test uncertainty");
 }
 function render(){
  if(!store.site)return;
  const out=compute();if(!out){set("pe-po-screen","INVALID ILLUSTRATIVE INPUTS");return;}
  const selected=$("pe-po-anomaly")?.value||"steady";
  const points=windowPoints(out.p,selected);
  const check=qc(points);
  set("pe-po-site-case",(store.siteInputs?.temp??15)+" °C · "+f(store.siteInputs?.pressure??101.325,2)+" kPa(a) · "+
    f(store.siteInputs?.intake??0,1)+"% inlet · "+f(store.siteInputs?.exhaust??0,1)+"% exhaust");
  set("pe-po-observed",f(out.p,3)+" MW");
  set("pe-po-flow",f(out.mf,4)+" kg/s");
  set("pe-po-fuel-input",f(out.mf*out.lhv/1e6,3)+" MW");
  set("pe-po-site-hr",f(out.siteHr,1)+" kJ/kWh");
  set("pe-po-cp",f(out.cp,5));
  set("pe-po-chr",f(out.chr,5));
  set("pe-po-corrected-power",f(out.correctedP,3)+" MW");
  set("pe-po-corrected-hr",f(out.correctedHr,1)+" kJ/kWh");
  set("pe-po-up",f(out.uP,4)+" MW");
  set("pe-po-uhr",f(out.uH,2)+" kJ/kWh");
  set("pe-po-cov",f(out.covariancePH,4)+" MW·kJ/kWh");
  set("pe-po-corr",out.corr===null?"undefined":f(out.corr,3));
  set("pe-po-jp","["+out.jp.map(x=>f(x,5)).join(", ")+"]");
  set("pe-po-jh","["+out.jh.map((x,i)=>f(x,i===2?10:4)).join(", ")+"]");
  set("pe-po-window-status",check.status);
  set("pe-po-window-qc",check.reason+"; "+(check.cv===null?"a source channel is missing.":"CV "+f(check.cv,2)+"% · endpoint drift "+f(check.slope,2)+"%."));
  const exampleScreen=out.correctedP>=out.nominalPowerThreshold && out.correctedHr<=out.nominalHeatRateThreshold;
  set("pe-po-hypothetical","ILLUSTRATIVE ONLY · "+(check.healthy?(exampleScreen?"both toy thresholds met":"one or more toy thresholds not met"):"not screenable: synthetic interval QC hold"));
  set("pe-po-targets","Toy power floor "+f(out.nominalPowerThreshold,3)+" MW ("+f(out.vals.powerThreshold,1)+"% of model reference); "+
    "toy heat-rate ceiling "+f(out.nominalHeatRateThreshold,0)+" kJ/kWh ("+f(out.vals.hrThreshold,1)+"% of reference).");
  set("pe-po-screen","INDUSTRIAL PASS-OFF: NOT ASSESSED");
  set("pe-po-source",sourceLabel);
  drawTrace(points,check);drawBudget(out);
  $("pe-po-export").disabled=false;
  store.latest={out,check,points};
 }
 for(const [key,id,unit,precision] of cfg){
  const node=$(id);if(!node)continue;
  node.addEventListener("input",()=>{
   const n=Number(node.value),formatted=f(n,Number(precision));
   set("pe-po-show-"+key,formatted+(unit?" "+unit:""));
   render();
  });
  set("pe-po-show-"+key,f(Number(node.value),Number(precision))+(unit?" "+unit:""));
 }
 $("pe-po-scenario")?.addEventListener("change",()=>{
  const scene=scenarios[$("pe-po-scenario").value];
  if(!scene)return;
  for(const [name,value] of Object.entries(scene)){
   const input=$("pe-input-"+name);if(input)input.value=String(value);
  }
  $("pe-input-temp")?.dispatchEvent(new Event("input",{bubbles:true}));
 });
 $("pe-po-anomaly")?.addEventListener("change",render);
 $("pe-po-reset")?.addEventListener("click",()=>{
  for(const [key,id] of cfg){$(id).value=String(defaultCtl[key]);$(id).dispatchEvent(new Event("input",{bubbles:true}));}
  $("pe-po-anomaly").value="steady";
  $("pe-po-scenario").value="reference";$("pe-po-scenario").dispatchEvent(new Event("change"));
 });
 $("pe-po-export")?.addEventListener("click",()=>{
  if(!store.latest)return;
  const {out,check,points}=store.latest;
  const report={
   schema:"portfolio.gt_passoff_synthetic_instrument_propagation.v1",
   source_class:"illustrative synthetic test-stand inputs inferred from educational browser site model",
   measurement_record_available:false,
   real_instrument_calibrations_available:false,
   OEM_correction_model_validated:false,
   time_series_synthetic:true,
   source_reference:"thermotwin/scripts/passoff_correction.py analytical method",
   timestamp_utc:new Date().toISOString(),
   site_model_state:store.siteInputs,
   selected_illustrative_inputs:{powerMW:out.p,fuelFlowKgS:out.mf,LHV_J_kg:out.lhv,
    powerBiasPct:out.vals.powerBias,fuelBiasPct:out.vals.fuelBias},
   factors:{cp:out.cp,chr:out.chr},
   outputs:{siteHeatRateKJkWh:out.siteHr,correctedPowerMW:out.correctedP,correctedHeatRateKJkWh:out.correctedHr},
   conditional_instrument_covariance:{
    variable_order:["powerMW","fuelFlowKgS","LHV_J_kg"],precision:out.precision,calibration:out.calibration,
    corrected_power_and_heat_rate_jacobians:[out.jp,out.jh],
    corrected_power_std_uncertainty_MW:out.uP,
    corrected_heat_rate_std_uncertainty_KJkWh:out.uH,
    covariance_power_heat_rate:out.covariancePH,
    output_correlation:out.corr,
    excludes_map_model_factor_ambient_guarantee_uncertainty:true
   },
   illustrative_window_QC:check,
   illustrative_window:points,
   industrial_acceptance:"NOT ASSESSED",
   guarantee_from_contract:false
  };
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+"\n"],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="synthetic-passoff-instrument-method.json";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 window.addEventListener("thermotwin:educational-site-update",event=>{
  const item=event.detail;
  if(item?.source_class!=="browser_constant_property_illustration")return;
  if(!item?.prediction?.powerMW||!item?.reference?.powerMW)return;
  store.site=item.prediction;store.reference=item.reference;store.siteInputs=item.state;store.LHV=item.LHV_J_kg;
  render();
 });
 document.dispatchEvent(new Event("thermotwin:request-educational-site-update"));
})();
