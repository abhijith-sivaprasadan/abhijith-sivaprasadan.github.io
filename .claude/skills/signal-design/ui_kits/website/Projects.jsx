// Projects.jsx — bento grid of project cards + click-through detail drawer
const PROJECTS = [
  { id: "siemens-thesis", featured: true, cat: "CFD & Testing", title: "Siemens Energy Thesis — High-Temperature Reducer CFD/CHT",
    summary: "Seven months embedded at Siemens Energy Finspång: compressible CFD/CHT, high-temperature instrumentation and root-cause analysis for the Pulsatorn calibration rig.",
    img: "../../assets/thumb-siemens-validation.svg", tools: ["ANSYS Fluent", "k-omega SST", "NI-DAQ", "LabVIEW"], period: "Apr–Nov 2025", org: "Siemens Energy", status: "Published · TRITA 2026:14" },
  { id: "pypsa-nl", cat: "Energy Systems", title: "Exploratory PyPSA-NL Grid & BESS Study",
    summary: "Netherlands-inspired constrained-grid learning project: renewable growth, congestion, BESS siting and flexible connection contracts.",
    img: "../../assets/thumb-pypsa-grid.svg", tools: ["PyPSA", "Linopy", "HiGHS"], period: "2026", org: "Portfolio project" },
  { id: "heating-forecast", cat: "Data & AI", title: "Heating Demand Forecasting",
    summary: "Two-step scikit-learn pipeline forecasting district heating load from weather and calendar drivers.",
    img: "../../assets/thumb-heating-forecast.svg", tools: ["scikit-learn", "Python"], period: "2025", org: "KTH" },
  { id: "district-heating", cat: "Energy Systems", title: "District Heating Dispatch Optimisation",
    summary: "MILP dispatch of a multi-unit district heating system minimising fuel and start-up cost under demand constraints.",
    img: "../../assets/thumb-district-heating.svg", tools: ["Python", "PuLP"], period: "2025", org: "KTH" },
  { id: "energy-kpi", cat: "Sustainability", title: "Industrial Energy KPI Toolkit",
    summary: "Reusable KPI/EnPI toolkit for ISO 50001 reporting: load-driver regression, metering-gap checks and deviation detection.",
    img: "../../assets/thumb-energy-kpi.svg", tools: ["Python", "Pandas", "ISO 50001"], period: "2024", org: "Alleima" },
  { id: "numerical-heat-transfer", cat: "Assignments", title: "Numerical Heat Transfer Schemes",
    summary: "Finite-difference, time-stepping and advection schemes benchmarked for stability and accuracy.",
    img: "../../assets/thumb-numerical-heat-transfer.svg", tools: ["MATLAB", "FDM"], period: "2024", org: "KTH" },
];

function ProjectCard({ p, onOpen }) {
  return (
    <article className={"card project-card" + (p.featured ? " featured" : "")} onClick={() => onOpen(p)}>
      <div className="proj-sweep"></div>
      <div className="project-thumb">
        <img src={p.img} alt="" loading="lazy" />
        {p.status && <span className="proj-status"><i></i>{p.status}</span>}
        <span className="proj-tick tr"></span><span className="proj-tick bl"></span>
      </div>
      <div className="project-body">
        <div className="proj-metatop">
          <p className="eyebrow" style={{ margin: 0 }}>{p.cat}</p>
          <time>{p.period}</time>
        </div>
        <h3>{p.title}</h3>
        <p className="project-summary">{p.summary}</p>
        <div className="project-tags">{p.tools.slice(0, p.featured ? 4 : 3).map((t) => <Tag key={t}>{t}</Tag>)}</div>
        <div className="proj-foot"><span>{p.org}</span><span className="go">Open case study →</span></div>
      </div>
    </article>
  );
}

function ProjectDrawer({ p, onClose }) {
  if (!p) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Close">×</button>
        <div className="project-thumb" style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "18px" }}>
          <img src={p.img} alt="" style={{ width: "100%", display: "block" }} />
        </div>
        <p className="eyebrow">{p.cat} · {p.period}</p>
        <h2 style={{ marginBottom: "12px" }}>{p.title}</h2>
        <p className="lead">{p.summary}</p>
        <div className="project-tags" style={{ margin: "18px 0" }}>{p.tools.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        <Button variant="primary" size="sm">Open case study →</Button>
      </aside>
    </div>
  );
}

function Projects() {
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState("All");
  const cats = ["All", "CFD & Testing", "Energy Systems", "Data & AI", "Sustainability", "Assignments"];
  const shown = filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.cat === filter);
  return (
    <section className="section" id="projects-section">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Selected work</p>
          <h2>Projects &amp; case studies</h2>
        </div>
        <div className="filter-bar">
          {cats.map((c) => (
            <button key={c} className={"chip" + (filter === c ? " on" : "")} onClick={() => setFilter(c)}>{c}</button>
          ))}
          <span className="filter-count">{shown.length} / {PROJECTS.length}</span>
        </div>
        <div className="project-grid">
          {shown.map((p) => <ProjectCard key={p.id} p={p} onOpen={setOpen} />)}
        </div>
      </div>
      <ProjectDrawer p={open} onClose={() => setOpen(null)} />
    </section>
  );
}

Object.assign(window, { Projects, PROJECTS });
