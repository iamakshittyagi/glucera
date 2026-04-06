import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Home.css";

import LOGO from "../assets/Icons/LOGO.png";
import SOSIcon from "../assets/Icons/GLUCERASOS.png";
import ReminderIcon from "../assets/Icons/GLUCERAREMINDER.png";
import FoodIcon from "../assets/Icons/GLUCERAFOOD.png";
import GraphIcon from "../assets/Icons/GLUCERAGRAPH.png";
import HeroVideo from "../assets/Videos/GLUCERA1.mp4";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/howitworks", label: "How It Works" },
];

const features = [
  { icon: SOSIcon,      title: "Hypoglycemia Risk Alert", desc: "Our AI detects glucose crashes before they happen and immediately alerts." },
  { icon: ReminderIcon, title: "Smart Reminders",          desc: "Glucera timely nudges for meals & medication." },
  { icon: FoodIcon,     title: "Food Suggestions",         desc: "Instant advice when glucose drops." },
  { icon: GraphIcon,    title: "Graphical Reports",        desc: "Weekly summaries for your doctor" },
];

const team = [
  { name: "Akshit Tyagi",   github: "iamakshittyagi" },
  { name: "Zuha Fathima",   github: "Zoo57"           },
  { name: "Allada Jayanth", github: "A-Jayanth-03"   },
  { name: "Jhanvi Chandran",github: "Jhanvi0610"      },
];

export default function Home() {
  const location = useLocation();

  return (
    <div className="home">

      {/* ── FLOATING NAVBAR ── */}
      <nav className="top-nav">
        <Link to="/" className="top-nav-logo">
          <img src={LOGO} alt="Glucera" className="nav-logo-img" />
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
        <video className="hero-bg" autoPlay muted loop playsInline>
          <source src={HeroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay" />

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

      {/* ── TRANSPARENT FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-inner">

          <Link to="/" className="footer-logo">
            <img src={LOGO} alt="Glucera" className="footer-logo-img" />
          </Link>

          <div className="footer-team">
            {team.map(m => (
              <a
                key={m.github}
                href={`https://github.com/${m.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-member"
              >
                <img
                  src={`https://github.com/${m.github}.png?size=56`}
                  alt={m.name}
                  className="footer-avatar"
                />
                <span className="footer-member-name">{m.name}</span>
              </a>
            ))}
          </div>

          <p className="footer-copy">© {new Date().getFullYear()} Glucera</p>

        </div>
      </footer>

    </div>
  );
}