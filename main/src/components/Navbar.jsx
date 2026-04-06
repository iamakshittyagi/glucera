import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/howitworks", label: "How It Works" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav-logo">
        <img src={require("../assets/Icons/LOGO.png")} alt="Glucera" className="nav-logo-img" />
      </Link>
      <div className="top-nav-links">
        {navLinks.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`top-nav-link ${location.pathname === l.to ? "active" : ""}`}
          >{l.label}</Link>
        ))}
      </div>
      <Link to="/dashboard" className="top-nav-cta">Get Started</Link>
    </nav>
  );
}