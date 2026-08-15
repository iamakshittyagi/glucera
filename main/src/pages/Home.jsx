import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

import SOSIcon from "../assets/Icons/GLUCERASOS.png";
import ReminderIcon from "../assets/Icons/GLUCERAREMINDER.png";
import FoodIcon from "../assets/Icons/GLUCERAFOOD.png";
import GraphIcon from "../assets/Icons/GLUCERAGRAPH.png";
import HeroVideo from "../assets/Videos/GLUCERA1.mp4";

const features = [
  { icon: SOSIcon,      title: "Hypoglycemia Risk Alert", desc: "Our AI detects glucose crashes before they happen and immediately alerts." },
  { icon: ReminderIcon, title: "Smart Reminders",          desc: "Glucera timely nudges for meals & medication." },
  { icon: FoodIcon,     title: "Food Suggestions",         desc: "Instant advice when glucose drops." },
  { icon: GraphIcon,    title: "Graphical Reports",        desc: "Weekly summaries for your doctor" },
];

export default function Home() {
  return (
    <div className="home">
      {/* One full-bleed hero. The video runs edge to edge behind the header —
          there is no seam or panel dividing the two. */}
      <section className="hero">
        <video className="hero-bg" autoPlay muted loop playsInline>
          <source src={HeroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay" />

        <Navbar variant="overlay" />

        <div className="hero-content">
          <h1 className="hero-heading">Know Your Risk,<br />Know Your Response.</h1>
          <p className="hero-sub">
            Glucera monitors your glucose in real time, predicts crashes
            before they happen and alerts the people who matter most.
          </p>
          <div className="hero-buttons">
            <Link to="/dashboard" className="btn-primary">Try the Demo →</Link>
            <Link to="/howitworks" className="btn-outline">How It Works</Link>
          </div>
          <p className="hero-disclaimer">
            Demonstration build with sample data — not a medical device.
          </p>
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
      </section>
    </div>
  );
}
