import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Home.css";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/howitworks", label: "How It Works" },
];

const features = [
  { icon: require("../assets/Icons/GLUCERASOS.png"), title: "Hypoglycemia Risk Alert", desc: "Our AI detects glucose crashes before they happen and immediatly it." },
  { icon: require("../assets/Icons/GLUCERAREMINDER.png"), title: "Smart Reminders", desc: "Glucera timely nudges for meals & medication." },
  { icon: require("../assets/Icons/GLUCERAFOOD.png"), title: "Food Suggestions", desc: "Instant advice when glucose drops." },
  { icon: require("../assets/Icons/GLUCERAGRAPH.png"), title: "Graphical Reports", desc: "Weekly summaries for your doctor" },
];

export default function Home() {
  const location = useLocation();

  return (
    <div className="home">

      {/* ── FLOATING NAVBAR ── */}
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

      {/* ── HERO FRAME ── */}
      <div className="hero">
        <video
          className="hero-bg"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={require("../assets/Videos/GLUCERA1.mp4")} type="video/mp4" />
        </video>
        <div className="hero-overlay" />

        {/* Hero text */}
        <div className="hero-content">
          <p className="hero-eyebrow">· Healthcare ·</p>
          <h1 className="hero-heading">Know Your Risk,<br />Know Your Response.</h1>
          <p className="hero-sub">
            Glucera monitors your glucose in real time, predicts crashes
            before they happen and alerts the people who matter most.
          </p>
          <div className="hero-buttons">
            <Link to="/dashboard" className="btn-primary">Get Started →</Link>
            <Link to="/howitworks" className="btn-outline">How It Works</Link>
          </div>
        </div>

        {/* ── FEATURE CARDS ── */}
        <div className="hero-features">
          {features.map(f => (
            <div className="hero-feature-card" key={f.title}>
              <img src={f.icon} alt={f.title} className="hero-feature-icon" />
              <div>
                <p className="hero-feature-title">{f.title}</p>
                <p className="hero-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}