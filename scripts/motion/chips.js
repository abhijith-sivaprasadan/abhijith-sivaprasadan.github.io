/**
 * Skill chip classifier.
 *
 * Inspects every chip-like span in `.tag-row`, `.audience-chip-row`,
 * `.skill-pill` etc. and tags it with `data-chip-type`:
 *   - "tool"   → software / language (ANSYS, MATLAB, Python, …)  → blue
 *   - "method" → analytical method (CHT, MILP, k-omega, …)        → orange
 *   - "domain" → domain area (Thermal-fluid, Energy systems, …)   → teal
 *   - "cert"   → standard / certification (ISO 50001, EED, …)     → amber
 * Unmatched chips get no data attribute and keep their default styling.
 */

const PATTERNS = [
  // Tools (software, languages, packages)
  { type: "tool", rx: /\b(ansys|fluent|matlab|python|numpy|pandas|matplotlib|scipy|jupyter|labview|ni[- ]?max|teamcenter|simulink|pyomo|pulp|cplex|gurobi|nx |solidworks|catia|abaqus|comsol|paraview|homer|sam|leap|ida ice|pypsa|github|git|docker|excel|power ?bi|tableau|scikit[- ]?learn)\b/i },
  // Methods (CFD/numerical/optimization techniques)
  { type: "method", rx: /\b(cfd|cht|conjugate heat transfer|k[- ]?omega|sst|rans|les|dns|mesh independence|biot|nusselt|reynolds|prandtl|finite volume|finite element|milp|nlp|qp|monte ?carlo|forecasting|regression|optimisation|optimization|dispatch|scenario analysis|techno[- ]?economic|life ?cycle|sensitivity)\b/i },
  // Standards / regulations / certifications
  { type: "cert", rx: /\b(iso ?50001|iso ?17025|eu ?ets|ee?d|ekl|en ?16001|ipmvp|leed|breeam|asme|ashrae|api ?\d|en ?\d|ce ?mark|atex)\b/i },
  // Domain areas
  { type: "domain", rx: /\b(thermal[- ]?fluid|energy ?systems|industrial|decarbonisation|decarbonization|district heating|electrification|hydrogen|tes|storage|chp|geothermal|heat pump|combustion|gas turbine|pyrolysis|grid|microgrid|building|hvac|propulsion|aerospace|automotive|process)\b/i },
];

function classify(text) {
  if (!text) return null;
  for (const { type, rx } of PATTERNS) {
    if (rx.test(text)) return type;
  }
  return null;
}

function tag(root = document) {
  const selector = [
    ".tag-row span",
    ".audience-chip-row span",
    ".skill-pill",
    ".chip",
    ".pill",
    ".thesis-kpis .result-metric-card",
    ".project-card .tag-row span",
  ].join(",");
  root.querySelectorAll(selector).forEach((el) => {
    if (el.dataset.chipType) return;
    const t = classify((el.textContent || "").trim());
    if (t) el.dataset.chipType = t;
  });
}

export async function init() {
  tag();
  // Re-tag when new content is added (project cards may render later)
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => { if (n.nodeType === 1) tag(n); });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  return { tag, destroy() { obs.disconnect(); } };
}

export function destroy(inst) { inst?.destroy?.(); }
