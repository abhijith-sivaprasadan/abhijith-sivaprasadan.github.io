// SignalRail.jsx — telemetry strip: headline KPIs + a live validation metric card
function SignalRail() {
  const metrics = [
    { value: "7 mo", label: "Embedded at Siemens" },
    { value: "700°C", label: "Rig test temperature", warm: true },
    { value: "115 hp", label: "KTH credits" },
    { value: "27", label: "Documented projects", warm: true },
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="rail">
          <div className="rail-head">
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--green)", letterSpacing: "0.04em" }}>
              Evidence signal
            </strong>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--muted)", textAlign: "right", maxWidth: "30rem" }}>
              One coherent profile across thermal-fluid, energy-systems and industrial decarbonisation work.
            </span>
          </div>
          <div className="rail-grid">
            <div className="rail-metrics">
              {metrics.map((m, i) => <KpiTile key={i} value={m.value} label={m.label} warm={m.warm} />)}
            </div>
            <div className="validation-card">
              <div className="vc-head">
                <span className="vc-title">Validation signal</span>
                <span className="vc-live"><i></i>Live</span>
              </div>
              <div className="vc-stats">
                <div className="vc-kpi"><b className="readout">0.003</b><span>Biot number</span></div>
                <div className="vc-kpi amber"><b className="readout">0.990</b><span>Mach · throat</span></div>
              </div>
              <svg className="vc-spark" viewBox="0 0 220 36" preserveAspectRatio="none" fill="none">
                <polyline className="vc-draw" points="0,30 30,24 60,27 90,15 120,19 150,9 180,13 220,4"
                  stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle className="vc-head-dot" cx="220" cy="4" r="3" fill="var(--i-amber)"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { SignalRail });
