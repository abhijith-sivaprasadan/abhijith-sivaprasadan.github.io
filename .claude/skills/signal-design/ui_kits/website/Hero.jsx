// Hero.jsx — asymmetric hero with audience-lens switch + instrument panel

const HERO_COPY = {
  thermal: {
    claim: "Thermal-fluid engineer translating high-temperature heat-transfer and compressible-flow problems into CFD/CHT evidence, instrumentation context and physical design decisions.",
    lead: "The technical anchor is the Siemens Energy thesis: compressible CFD/CHT, k-omega SST modelling, three-level mesh independence, Biot-number thermal decomposition and high-temperature test-rig interpretation.",
    cta: "Siemens Thesis Case Study",
  },
  energy: {
    claim: "Energy systems modeller connecting IDA ICE, HOMER Pro, LEAP, PuLP and forecasting workflows to heat-and-power technology decisions.",
    lead: "Grounded in hands-on modelling across IDA ICE, HOMER Pro, SAM, LEAP, Python/PuLP MILP optimisation, scikit-learn forecasting and distribution-grid studies.",
    cta: "Energy Systems Track",
  },
  decarbonisation: {
    claim: "Industrial energy and decarbonisation engineer building KPI/EnPI methods, metering logic, regulatory framing and reproducible tools for process-industry decisions.",
    lead: "Alleima, district-heating optimisation and Python tooling reframed as method development: quantified performance mapping, load-driver regression, metering-gap assessment and decision-support outputs.",
    cta: "Industrial R&D Fit",
  },
  research: {
    claim: "Early-stage researcher translating high-temperature flow problems into simulation, measurement and physically grounded thermal interpretation.",
    lead: "The research thread centres on the Siemens thesis as a bridge between simulation assumptions and physical hardware behaviour — conjugate heat transfer, deposit-driven thermal resistance and experimental-numerical methods.",
    cta: "Research Statement",
  },
};

function InstrumentPanel({ lens }) {
  // a compact CFD/CHT reducer schematic that animates its flow streams
  return (
    <figure className="instrument">
      <figcaption className="instrument-head">
        <span>PULSATORN RIG · CFD/CHT REDUCER</span>
        <strong>LIVE</strong>
      </figcaption>
      <div className="instrument-surface">
        <svg viewBox="0 0 480 360" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="hot" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#38bdf8"/><stop offset="0.55" stopColor="#f6c85f"/><stop offset="1" stopColor="#d0622c"/>
            </linearGradient>
          </defs>
          {/* duct walls */}
          <polyline points="40,108 150,108 250,150 450,150" fill="none" stroke="#38bdf8" strokeWidth="2"/>
          <polyline points="40,252 150,252 250,210 450,210" fill="none" stroke="#38bdf8" strokeWidth="2"/>
          <line x1="40" y1="108" x2="40" y2="252" stroke="#38bdf8" strokeWidth="1.6"/>
          {/* centerline */}
          <line x1="40" y1="180" x2="450" y2="180" stroke="#152540" strokeWidth="0.8" strokeDasharray="5 4"/>
          {/* flow streams (animated) */}
          {[124, 150, 180, 210, 236].map((y, i) => (
            <line key={i} x1="48" y1={y} x2="450" y2={y < 180 ? y + 38 : y - 38} stroke="url(#hot)" strokeWidth="2.2"
              strokeLinecap="round" strokeDasharray="14 26"
              style={{ animation: `advect 2.6s linear infinite`, animationDelay: `${i * 0.3}s` }} />
          ))}
          {/* labels */}
          <rect x="20" y="20" width="150" height="40" rx="4" fill="#0d1a2e" stroke="#2563a8"/>
          <text x="30" y="38" fontFamily="monospace" fontSize="12" fill="#f6c85f">T = 673 K</text>
          <text x="30" y="53" fontFamily="monospace" fontSize="11" fill="#65d6c9">p = 100 kPa</text>
          <rect x="300" y="300" width="160" height="40" rx="4" fill="#0d1a2e" stroke="#2563a8"/>
          <text x="310" y="318" fontFamily="monospace" fontSize="12" fill="#65d6c9">Bi = 0.003–0.004</text>
          <text x="310" y="333" fontFamily="monospace" fontSize="10" fill="#2a4060">k-omega SST · CHT</text>
        </svg>
      </div>
      <p className="instrument-cap">Steady-state thermo-fluid field of the legacy stepped reducer · adiabatic vs conjugate heat-transfer campaigns.</p>
    </figure>
  );
}

function Hero({ lens, setLens }) {
  const copy = HERO_COPY[lens];
  return (
    <section className="hero section" id="top">
      <div className="container hero-inner">
        <div className="hero-left">
          <div className="hero-identity">
            <picture>
              <source srcSet="../../assets/headshot.webp" type="image/webp" />
              <img className="avatar" src="../../assets/headshot.jpg" alt="Abhijith Sivaprasadan" width="96" height="96" />
            </picture>
            <div>
              <p className="eyebrow"><TypedCycle items={[
                "Siemens Energy Finspång / CFD / CHT / Test validation",
                "High-temperature flow / Conjugate heat transfer",
                "Energy process modelling / Python / Techno-economics",
                "Compressible flow / k-omega SST / Mesh independence",
              ]} /></p>
              <p className="kicker">M.Sc. Sustainable Energy Engineering · KTH 2026</p>
            </div>
          </div>

          <LensToggle lens={lens} setLens={setLens} />

          <h1 className="display">Abhijith Sivaprasadan</h1>
          <p className="hero-claim" key={"c" + lens}>{copy.claim}</p>
          <p className="lead hero-lead" key={"l" + lens}>{copy.lead}</p>

          <div className="hero-actions">
            <Button variant="primary" key={"b" + lens}>{copy.cta} →</Button>
            <Button variant="secondary">Download CV</Button>
          </div>
        </div>

        <InstrumentPanel lens={lens} />
      </div>
    </section>
  );
}

Object.assign(window, { Hero, InstrumentPanel, HERO_COPY });
