// Header.jsx — status banner + sticky console header (matches design-system spec)
const NAV = ["Signal", "Research", "Energy Systems", "Industrial R&D", "Projects", "Contact"];

function StatusBanner() {
  return (
    <div className="banner">
      <span className="dot" aria-hidden="true"></span>
      <span>Currently targeting <a href="#">PhD positions</a> and <a href="#">industrial R&amp;D roles</a> in Sweden &amp; the EU.</span>
    </div>
  );
}

function SiteHeader({ active, onNav }) {
  return (
    <header className="header">
      <div className="container nav">
        <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); onNav("Signal"); }}>
          <span className="logo-idx">//</span><span className="logo-name">Abhijith Sivaprasadan</span>
        </a>
        <nav className="nav-links">
          {NAV.map((n) => (
            <a key={n} className={active === n ? "on" : ""} onClick={() => onNav(n)}>{n}</a>
          ))}
        </nav>
        <div className="nav-right">
          <div className="lang" role="group" aria-label="Language">
            <svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1"/><path d="M1.5 7h11M7 1.5c1.6 1.5 1.6 9.5 0 11M7 1.5c-1.6 1.5-1.6 9.5 0 11" stroke="currentColor" strokeWidth="1.1"/></svg>
            <button className="on">EN</button><button>SV</button>
          </div>
          <button className="menu-btn" aria-label="Menu">
            <span className="burger"><i></i><i></i><i></i></span>Menu
          </button>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { StatusBanner, SiteHeader, NAV });
