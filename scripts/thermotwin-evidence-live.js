/* ThermoTwin-F case / authentic committed solver-CSV driven charts.
 * No guessed series and no actual-plant prediction claims. Images remain as
 * accessible fallback if a source bundle fails to load.
 */
(()=>{
 "use strict";
 const root=document.body;
 if(root?.dataset.projectSlug!=="thermotwin-f")return;
 const S="http://www.w3.org/2000/svg", prefix="https://github.com/abhijith-sivaprasadan/thermotwin/blob/bb8fabcba9e320c144d7981c7a2eb55a47724dac/";
 const $=(parent,q)=>parent.querySelector(q);
 const ALL=(parent,q)=>[...parent.querySelectorAll(q)];
 const n=(v,d=1)=>Number.isFinite(v)?v.toLocaleString("en-GB",{minimumFractionDigits:d,maximumFractionDigits:d}):"n/a";
 const svg=(tag,attrs={},val)=>{const e=document.createElementNS(S,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(val!==undefined)e.textContent=String(val);return e};
 const rowObjects=series=>series.rows.map(a=>Object.fromEntries(series.columns.map((key,i)=>[key,a[i]])));
 let source=null;
 const expected={design:1,degradation:4,ambient:14,pressureRatio:13,turbineEfficiency:13,firingTemperature:11,transient:1083};
 const metrics={
  net_power_MW:{label:"Net electric power",unit:"MW",digits:2},
  thermal_efficiency:{label:"Thermal efficiency",unit:"%",digits:2,mul:100},
  heat_rate_kJ_kWh:{label:"Heat rate",unit:"kJ/kWh",digits:0},
  exhaust_temperature_K:{label:"Exhaust temperature",unit:"K",digits:1}
 };
 const staticTrace=el=>$(el,".ttf-plot");
 function inspect(box,summary){const el=$(box,"[data-ttf-inspect]");if(el)el.textContent=summary}
 function paintAxes(el,xVals,yVals,xLabel,yLabel,yUnit,zeroBase=false){
  const minX=Math.min(...xVals),maxX=Math.max(...xVals),
   minY=Math.min(...yVals),maxY=Math.max(...yVals),spread=Math.max(1e-9,maxY-minY);
  // Bar magnitude comparisons must start at physical zero: a truncated
  // bar axis would exaggerate small fouling-induced performance changes.
  const lo=zeroBase?0:minY-Math.max(spread*.12,Math.abs(minY)*.015);
  const hi=zeroBase?maxY*1.08:maxY+Math.max(spread*.12,Math.abs(maxY)*.015);
  const left=83,right=740,top=31,bottom=285;
  const xp=x=>left+(x-minX)/(maxX-minX||1)*(right-left);
  const yp=y=>bottom-(y-lo)/(hi-lo)*(bottom-top);
  for(let i=0;i<=5;i++){
   let y=top+i*(bottom-top)/5;
   el.append(svg("line",{x1:left,y1:y,x2:right,y2:y,stroke:"#2c4637","stroke-width":1}));
   el.append(svg("text",{x:left-10,y:y+4,"text-anchor":"end",fill:"#c0d0c3","font-size":12},n(hi-i*(hi-lo)/5,hi-lo>300?0:1)));
   const x=left+i*(right-left)/5;
   el.append(svg("line",{x1:x,y1:top,x2:x,y2:bottom,stroke:"#263b2f","stroke-width":1}));
   el.append(svg("text",{x,y:bottom+22,"text-anchor":"middle",fill:"#c0d0c3","font-size":12},n(minX+(maxX-minX)*i/5,(maxX-minX)>15?0:2)));
  }
  el.append(svg("text",{x:(left+right)/2,y:337,"text-anchor":"middle",fill:"#c7d8ca","font-size":13},xLabel));
  el.append(svg("text",{x:left,y:16,fill:"#d7b46a","font-size":12},yLabel+" · "+yUnit));
  return {xp,yp,left,right,top,bottom,minX,maxX,lo,hi};
 }
 function makePlot(box,labels,items,opts={}){
  const el=staticTrace(box);if(!el)return;
  el.replaceChildren();el.setAttribute("viewBox","0 0 790 350");
  const ys=items.map(x=>x.value),xs=items.map(x=>x.x);
  if(items.some(x=>!Number.isFinite(x.x)||!Number.isFinite(x.value))||!items.length){throw Error("invalid archival model series");}
  const ax=paintAxes(el,xs,ys,opts.xLabel||"Operating parameter",opts.yLabel||"",opts.unit||"",opts.type==="bars");
  if(opts.type!=="bars"){
   const d=items.map((v,i)=>(i?"L":"M")+ax.xp(v.x).toFixed(2)+","+ax.yp(v.value).toFixed(2)).join(" ");
   el.append(svg("path",{d,fill:"none",stroke:"#65d6c9","stroke-width":3,"stroke-linejoin":"round"}));
  }
  items.forEach((item,i)=>{
    const x=ax.xp(item.x),y=ax.yp(item.value);
    let node;
    if(opts.type==="bars"){
      const width=Math.min(64,(ax.right-ax.left)/(items.length*1.6));
      node=svg("rect",{x:x-width/2,y,width,height:Math.max(0,ax.bottom-y),rx:3,fill:i===opts.highlight?"#d7b46a":"#65d6c9",opacity:.86});
    }else node=svg("circle",{cx:x,cy:y,r:6,fill:i===opts.highlight?"#d7b46a":"#65d6c9",stroke:"#0c1c13","stroke-width":2});
    node.setAttribute("role","button");node.setAttribute("tabindex","0");node.setAttribute("aria-label",item.name+" · "+n(item.value,opts.digits??2)+" "+(opts.unit||""));
    node.classList.add("ttf-chart-point");
    const tooltip=item.name+" — "+n(item.value,opts.digits??2)+" "+(opts.unit||"");
    node.append(svg("title",{},tooltip));
    const onSelect=()=>{inspect(box,tooltip+(item.extra?" · "+item.extra:""));ALL(el,".ttf-chart-point").forEach(x=>x.classList.remove("is-picked"));node.classList.add("is-picked")};
    node.addEventListener("focus",onSelect);node.addEventListener("click",onSelect);
    node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelect();}});
    el.append(node);
  });
  el.setAttribute("aria-label",opts.yLabel+" series: "+items.length+" archived numerical points, original committed solver CSV, not measured plant observations.");
  const active=items[opts.highlight]||items[0];inspect(box,(active?.name||"")+": "+n(active?.value,opts.digits??2)+" "+(opts.unit||"")+(active?.extra?" · "+active.extra:""));
 }
 function design(box){
  const row=rowObjects(source.series.design)[0];
  const mode=$(box,"[data-ttf-control=design-metric]")?.value||"temperature";
  const K={station1:row.T1_K,station2:row.T2_K,station3:row.T3_K,station4:row.T4_K};
  const P={station1:row.P1_Pa/1000,station2:row.P2_Pa/1000,station3:row.P3_Pa/1000,station4:row.P4_Pa/1000};
  const labels=["01 · compressor inlet","02 · compressor exit","03 · turbine inlet","04 · turbine exit"];
  let v,unit,yLabel;
  if(mode==="pressure"){v=Object.values(P);unit="kPa(a)";yLabel="Model station pressure";}
  else if(mode==="shaft"){
   v=[row.power_turbine_MW,row.power_compressor_MW,row.gross_power_MW,row.net_power_MW];unit="MW";yLabel="Model shaft/electric power";
  }else{v=Object.values(K);unit="K";yLabel="Model station temperature";}
  const items=v.map((val,i)=>({x:i+1,name:mode==="shaft"?["Turbine work","Compressor demand","Gross electric","Net electric"][i]:labels[i],value:val,
   extra:mode==="shaft"?"model power convention":"One archived Fortran output; model stations not plant sensor T5/T7"}));
  makePlot(box,null,items,{type:"bars",highlight:mode==="shaft"?3:2,unit,yLabel,xLabel:mode==="shaft"?"Turbine / compressor / generator balance (1–4)":"Thermodynamic model station index (1–4)",digits:2});
  const data=$(box,"[data-ttf-details]");
  if(data)data.textContent="Archived Fortran simple-cycle result · net="+n(row.net_power_MW,3)+" MW · heat rate="+n(row.heat_rate_kJ_kWh,0)+" kJ/kWh · fuel="+n(row.fuel_flow_kg_s,3)+" kg/s · η="+n(row.thermal_efficiency*100,2)+"%.";
 }
 function degradation(box){
  const metric=$(box,"[data-ttf-control=degradation-metric]")?.value||"net_power_MW",info=metrics[metric];
  const rows=rowObjects(source.series.degradation);
  const label={clean:"Clean",mild:"Mild fouling",severe:"Severe",washed:"Post-wash illustrative"};
  const items=rows.map((r,i)=>({x:i+1,name:label[r.degradation_mode]||r.degradation_mode,value:r[metric]*(info.mul||1),
    extra:"archived model case · "+n(r.net_power_MW,3)+" MW / "+n(r.heat_rate_kJ_kWh,0)+" kJ/kWh"}));
  makePlot(box,null,items,{type:"bars",highlight:0,unit:info.unit,yLabel:info.label,xLabel:"Modelled degradation case (1 clean; 2 mild; 3 severe; 4 washed)",digits:info.digits});
 }
 function sensitivity(box){
  const seriesKey=$(box,"[data-ttf-control=sensitivity-sweep]")?.value||"ambient";
  const metric=$(box,"[data-ttf-control=sensitivity-metric]")?.value||"net_power_MW";
  const info=metrics[metric],rows=rowObjects(source.series[seriesKey]);
  const xCfg={
   ambient:{label:"Model compressor inlet T1",unit:"°C",extract:r=>r.T1_K-273.15},
   pressureRatio:{label:"Compressor P2/P1",unit:"ratio",extract:r=>r.P2_Pa/r.P1_Pa},
   firingTemperature:{label:"Turbine firing temperature T3",unit:"K",extract:r=>r.T3_K},
   turbineEfficiency:{label:"Assumed turbine ηis",unit:"fraction",extract:r=>Number(String(r.case_name).replace(/^etaT_/,""))}
  }[seriesKey];
  if(!xCfg)throw Error("Unknown archival sensitivity axis");
  const items=rows.map(row=>({x:xCfg.extract(row),name:row.case_name,value:row[metric]*(info.mul||1),
   extra:"independent one-at-a-time archived solver case"})).sort((a,b)=>a.x-b.x);
  makePlot(box,null,items,{type:"line",unit:info.unit,yLabel:info.label,xLabel:xCfg.label+" · "+xCfg.unit,digits:info.digits});
 }
 function transient(box){
  const rows=rowObjects(source.series.transient);
  const sel=$(box,"[data-ttf-control=transient-schedule]")?.value||"startup";
  const points=rows.filter(x=>x.schedule===sel).sort((a,b)=>a.time_s-b.time_s);
  if(points.length<30)throw Error("Too few original transient points");
  const slider=$(box,"[data-ttf-control=transient-index]");
  const index=Math.max(0,Math.min(points.length-1,Number(slider?.value||0)));
  if(slider){slider.max=String(points.length-1);if(Number(slider.value)>points.length-1)slider.value=String(index);}
  const plot=staticTrace(box);plot.replaceChildren();plot.setAttribute("viewBox","0 0 790 350");
  const ymin=Math.min(...points.map(x=>Math.min(x.T_gas_K,x.T_metal_K)));
  const ymax=Math.max(...points.map(x=>Math.max(x.T_gas_K,x.T_metal_K)));
  const ax=paintAxes(plot,[0,...points.map(x=>x.time_s)], [ymin,ymax],"Simulation elapsed time · s","Lumped hot-section temperatures","K");
  for(const [key,color,name] of [["T_gas_K","#65d6c9","Gas-path drive"],["T_metal_K","#d7b46a","Lumped metal response"]]){
   const d=points.map((v,i)=>(i?"L":"M")+ax.xp(v.time_s).toFixed(2)+" "+ax.yp(v[key]).toFixed(2)).join(" ");
   plot.append(svg("path",{d,fill:"none",stroke:color,"stroke-width":2.5,"stroke-linejoin":"round"}));
  }
  const chosen=points[index];
  plot.append(svg("line",{x1:ax.xp(chosen.time_s),y1:ax.top,x2:ax.xp(chosen.time_s),y2:ax.bottom,stroke:"#f2f0e7","stroke-width":1.5,"stroke-dasharray":"5 5"}));
  for(const [key,color] of [["T_gas_K","#65d6c9"],["T_metal_K","#d7b46a"]]){
   plot.append(svg("circle",{cx:ax.xp(chosen.time_s),cy:ax.yp(chosen[key]),r:6,fill:color,stroke:"#112318","stroke-width":2}));
  }
  plot.setAttribute("aria-label",sel+" archived hot-section thermal response: time "+n(chosen.time_s,0)+" s, gas "+n(chosen.T_gas_K,1)+" K, metal "+n(chosen.T_metal_K,1)+" K.");
  inspect(box,sel.toUpperCase()+" · t="+n(chosen.time_s,0)+" s · Tgas="+n(chosen.T_gas_K,1)+" K · Tmetal="+n(chosen.T_metal_K,1)+" K · lag="+n(chosen.T_gas_K-chosen.T_metal_K,1)+" K. Source decimation: one in three original 10-second points.");
  const detail=$(box,"[data-ttf-details]");
  if(detail)detail.textContent="Lumped single-metal-node educational thermal response. Temperature evolution is calculated, not a turbine thermocouple history.";
 }
 const draw={design,degradation,sensitivity,transient};
 function markError(msg){ALL(document,"[data-ttf-view]").forEach(box=>{const st=$(box,"[data-ttf-status]");if(st)st.textContent="Interactive source unavailable: "+msg+". Original graphic retained."})}
 async function load(){
  try{
   const response=await fetch("../data/thermotwin-f/archival-model-outputs.json",{cache:"no-store"});
   if(!response.ok)throw Error("HTTP "+response.status);
   const obj=await response.json();
   if(obj.schema!=="portfolio.thermotwin_archival_model_output_v1"||
      obj.source_commit!=="bb8fabcba9e320c144d7981c7a2eb55a47724dac"||
      obj.evidence_class!=="archived committed Fortran-generated demonstration CSV; NOT rerun in this portfolio update, NOT measured operation")throw Error("Archive/commit/source contract does not match");
   // Conditions intentionally spelled out, with no tolerance for absent or
   // incorrect archival series and no chart fabrication on invalid data.
   for(const [name,count] of Object.entries(expected)){
    const series=obj.series?.[name];
    if(!series||series.original_rows!==count||!Array.isArray(series.rows)||!series.rows.length||
      series.columns.some(k=>typeof k!=="string"))throw Error("Source series count/columns changed: "+name);
   }
   source=obj;
   for(const box of ALL(document,"[data-ttf-view]")){
    const which=box.dataset.ttfView;
    if(!draw[which])continue;
    const area=$(box,".ttf-plot-ui"),fallback=$(box,".ttf-plot-fallback"),status=$(box,"[data-ttf-status]");
    const redraw=()=>draw[which](box);
    ALL(box,"[data-ttf-control]").forEach(control=>control.addEventListener("input",redraw));
    if(which==="transient")ALL(box,"[data-ttf-control=transient-schedule]").forEach(input=>input.addEventListener("change",()=>{$(box,"[data-ttf-control=transient-index]").value="0";redraw()}));
    redraw();area.hidden=false;fallback.hidden=true;
    if(status)status.textContent="INTERACTIVE SVG FROM PINNED COMMITTED FORTRAN CSV · NOT REGENERATED · NOT ENGINE TELEMETRY";
   }
  }catch(e){markError(e.message);}
 }
 load();
})();
