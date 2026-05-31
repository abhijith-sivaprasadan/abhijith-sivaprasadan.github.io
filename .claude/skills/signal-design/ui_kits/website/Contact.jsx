// Contact.jsx — scholar links + welcoming contact form + footer
const SCHOLAR = [
  { id: "orcid", label: "ORCID", handle: "0009-0009-8429-1266", bg: "#a6ce39", fg: "#0a0" },
  { id: "scholar", label: "Google Scholar", handle: "o2nI60MAAAAJ", bg: "#4285f4", fg: "#fff" },
  { id: "diva", label: "DiVA / KTH", handle: "diva-381965", bg: "#1954a6", fg: "#fff" },
  { id: "linkedin", label: "LinkedIn", handle: "abhijith-sivaprasadan", bg: "#0a66c2", fg: "#fff" },
  { id: "github", label: "GitHub", handle: "abhijith-sivaprasadan", bg: "#181717", fg: "#fff" },
];

const TRACKS = [
  { id: "thermal", label: "Thermal & Fluid", c: "#65d6c9" },
  { id: "energy", label: "Energy Systems", c: "#9bd69f" },
  { id: "decarbonisation", label: "Industrial R&D", c: "#d7b46a" },
  { id: "research", label: "Research", c: "#8fb7ff" },
];

const REASONS = ["Just saying hello", "A question", "Collaboration", "Industrial R&D", "Doctoral / recruiting"];

function ScholarCard({ s }) {
  return (
    <a className="card scholar" href="#">
      <span className="scholar-icon" style={{ background: s.bg, color: s.fg }}>{s.label.slice(0, 2)}</span>
      <span className="scholar-body">
        <strong>{s.label}</strong>
        <span>{s.handle}</span>
      </span>
    </a>
  );
}

function ContactForm() {
  const [reason, setReason] = useState(REASONS[0]);
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState("thermal");
  const [notify, setNotify] = useState(true);
  const [sent, setSent] = useState(false);
  return (
    <div className="card contact-card">
      <div className="contact-accent"></div>
      <p className="eyebrow">Direct message</p>
      <p className="contact-intro">Students, peers, collaborators and teams — all welcome.</p>

      <label className="field"><span>Name</span><input placeholder="Your name" /></label>
      <label className="field"><span>Email</span><input placeholder="you@email.com" /></label>

      <div className="field sel">
        <span className="field-lbl">Reason for reaching out</span>
        <button className="selbox" onClick={() => setOpen(!open)}>
          {reason}
          <svg viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {open && (
          <div className="selmenu">
            {REASONS.map((r) => (
              <div key={r} className={r === reason ? "on" : ""} onClick={() => { setReason(r); setOpen(false); }}>{r}</div>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <span className="field-lbl">Which thread interests you <em>optional</em></span>
        <div className="seg">
          {TRACKS.map((t) => (
            <button key={t.id} className={track === t.id ? "on" : ""} style={{ "--c": t.c }} onClick={() => setTrack(t.id)}>
              <i></i>{t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field"><span>Message</span><textarea rows="2" placeholder="What's on your mind?"></textarea></label>

      <button className={"toggle-row" + (notify ? " on" : "")} onClick={() => setNotify(!notify)}>
        <span className="switch"><i></i></span><span>Notify me when new work is published</span>
      </button>

      <div className="contact-foot">
        <span className="contact-hint">Replies in a few days · <b>asiv@kth.se</b></span>
        <Button variant="primary" onClick={(e) => { e.preventDefault(); setSent(true); }}>
          {sent ? "Queued ✓" : "Send →"}
        </Button>
      </div>
    </div>
  );
}

function Contact() {
  return (
    <section className="section" id="contact-section">
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">Get in touch</p>
          <h2>Open to PhD &amp; industrial R&amp;D roles</h2>
          <p className="lead" style={{ marginTop: "14px", maxWidth: "34rem" }}>
            Based in Solna, Sweden. Targeting doctoral research, thermal/CFD engineering, energy-systems modelling and Associate Scientist positions across Sweden and the EU.
          </p>
          <div className="scholar-grid">{SCHOLAR.map((s) => <ScholarCard key={s.id} s={s} />)}</div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="logo"><span className="logo-idx">//</span><span className="logo-name">Abhijith Sivaprasadan</span></span>
        <span className="footer-meta">M.Sc. Sustainable Energy Engineering · KTH 2026 · Stockholm / Solna, SE</span>
        <span className="footer-meta">© 2026 · Built with the Signal system</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Contact, Footer, ScholarCard, ContactForm, SCHOLAR });
