// Experience.jsx — horizontal timeline rail with selectable role detail
const ROLES = [
  { id: "siemens", time: "2025", org: "Siemens Energy", role: "Thesis / Test Engineering", color: "var(--i-teal)",
    body: "Embedded at Finspång running compressible CFD/CHT, commissioning NI-DAQ chains, modifying LabVIEW VIs and completing formal root-cause analysis after a heater failure." },
  { id: "alleima", time: "2024", org: "Alleima", role: "Energy Performance", color: "var(--i-amber)",
    body: "Industrial energy-performance mapping: load-driver regression, metering-gap assessment and KPI/EnPI framing for electrification decision-support." },
  { id: "kth", time: "2023–26", org: "KTH", role: "M.Sc. Sustainable Energy", color: "var(--green)",
    body: "Heat & Power Technology track — numerical heat transfer, energy storage, optimisation, energy management and modelling coursework (115 hp)." },
  { id: "qburst", time: "2021–22", org: "QBurst", role: "Engineering", color: "var(--i-orange)",
    body: "Early software and systems engineering experience prior to graduate study in sustainable energy." },
];

function Experience() {
  const [active, setActive] = useState("siemens");
  const role = ROLES.find((r) => r.id === active);
  return (
    <section className="section" id="experience-section">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Track record</p>
          <h2>Experience</h2>
        </div>
        <div className="exp-rail">
          {ROLES.map((r) => (
            <button key={r.id} className={"exp-stop" + (active === r.id ? " on" : "")} onClick={() => setActive(r.id)}
              style={{ "--stop": r.color }}>
              <time>{r.time}</time>
              <strong>{r.org}</strong>
              <span>{r.role}</span>
            </button>
          ))}
        </div>
        <div className="card exp-detail" key={active}>
          <p className="eyebrow" style={{ margin: 0, color: role.color }}>{role.org} · {role.time}</p>
          <h3 style={{ margin: "8px 0 10px" }}>{role.role}</h3>
          <p>{role.body}</p>
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { Experience, ROLES });
