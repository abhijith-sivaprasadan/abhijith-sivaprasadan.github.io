// Bits.jsx — small shared primitives for the Signal UI kit
const { useState, useEffect, useRef } = React;

function Button({ variant = "primary", size, children, onClick, href }) {
  const cls = `btn ${variant}${size ? " " + size : ""}`;
  if (href) return <a className={cls} href={href} onClick={onClick}>{children}</a>;
  return <button className={cls} onClick={onClick}>{children}</button>;
}

function Eyebrow({ children }) { return <p className="eyebrow">{children}</p>; }

function Tag({ children }) { return <span className="tag">{children}</span>; }

function KpiTile({ value, label, warm }) {
  return (
    <div className={"kpi" + (warm ? " warm" : "")}>
      <b className="readout">{value}</b>
      <span>{label}</span>
    </div>
  );
}

// Lens definitions — the four audience modes that re-tint the site
const LENSES = [
  { id: "thermal", label: "Thermal & Fluid", color: "#65d6c9",
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 7C3.5 2 10.5 2 13 7C10.5 12 3.5 12 1 7Z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg> },
  { id: "energy", label: "Energy Systems", color: "#9bd69f",
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><polyline points="1,11 4,6 7,8 10,3 13,5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: "decarbonisation", label: "Industrial R&D", color: "#d7b46a",
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="5" width="3" height="7" fill="currentColor" opacity="0.55"/><rect x="5.5" y="3" width="3" height="9" fill="currentColor" opacity="0.78"/><rect x="9" y="1" width="3" height="11" fill="currentColor"/></svg> },
  { id: "research", label: "Research", color: "#8fb7ff",
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M8.5 8.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
];

function LensToggle({ lens, setLens }) {
  return (
    <div className="lens-toggle" role="group" aria-label="Audience lens">
      {LENSES.map((l) => (
        <button key={l.id} className={"lens-btn" + (lens === l.id ? " on" : "")} onClick={() => setLens(l.id)}>
          {l.icon}<span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}

// typed-cycle eyebrow used in the hero
function TypedCycle({ items, speed = 2600 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % items.length), speed);
    return () => clearInterval(t);
  }, [items, speed]);
  return <span>{items[i]}</span>;
}

Object.assign(window, { Button, Eyebrow, Tag, KpiTile, LensToggle, TypedCycle, LENSES });
