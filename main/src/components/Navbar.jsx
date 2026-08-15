import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/Icons/LOGO.png";

const navLinks = [
  { to: "/",           label: "Home" },
  { to: "/dashboard",  label: "Dashboard" },
  { to: "/history",    label: "History" },
  { to: "/howitworks", label: "How It Works" },
  { to: "/caregiver",  label: "Caregiver" },
];

/**
 * @param {"solid"|"overlay"} variant
 *   "overlay" — transparent, sits directly on top of the hero video (Home).
 *   "solid"   — glass panel for the interior pages, which have no video behind.
 */
export default function Navbar({ variant = "solid" }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // The overlay nav fades in a backdrop once the hero starts scrolling away,
  // so the links stay readable against whatever ends up behind them.
  useEffect(() => {
    if (variant !== "overlay") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const closeDrawer = () => setOpen(false);

  return (
    <header
      className={`gl-nav gl-nav--${variant} ${scrolled ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}
    >
      <Link to="/" className="gl-nav-logo" aria-label="Glucera home">
        <img src={logo} alt="Glucera" className="gl-nav-logo-img" />
      </Link>

      <nav className="gl-nav-links" aria-label="Primary">
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`gl-nav-link ${location.pathname === l.to ? "active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="gl-nav-right">
        <Link to="/dashboard" className="gl-nav-cta">
          Try the Demo
        </Link>
        <button
          className="gl-nav-burger"
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile drawer — the old header simply hid its links below 600px,
          which left the interior pages with no navigation at all. */}
      <div className="gl-nav-drawer" role="dialog" aria-hidden={!open}>
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={closeDrawer}
            className={`gl-nav-drawer-link ${location.pathname === l.to ? "active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
        <Link to="/dashboard" onClick={closeDrawer} className="gl-nav-drawer-cta">
          Try the Demo
        </Link>
      </div>
    </header>
  );
}
