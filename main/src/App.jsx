import { useState, useEffect } from "react";

function useCountdown(target) {
  const [time, setTime] = useState({});
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) return setTime({ d: 0, h: 0, m: 0, s: 0 });
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

const LAUNCH = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export default function App() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const time = useCountdown(LAUNCH);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        @keyframes up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.6; }
          70%  { transform: scale(1.1);  opacity: 0; }
          100% { transform: scale(1.1);  opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        .a1 { animation: up 0.7s 0.0s cubic-bezier(.22,1,.36,1) both; }
        .a2 { animation: up 0.7s 0.1s cubic-bezier(.22,1,.36,1) both; }
        .a3 { animation: up 0.7s 0.2s cubic-bezier(.22,1,.36,1) both; }
        .a4 { animation: up 0.7s 0.3s cubic-bezier(.22,1,.36,1) both; }
        .a5 { animation: up 0.7s 0.4s cubic-bezier(.22,1,.36,1) both; }
        .a6 { animation: up 0.7s 0.5s cubic-bezier(.22,1,.36,1) both; }

        .float-icon { animation: float 5s ease-in-out infinite; }

        .spin { animation: spin-slow 14s linear infinite; transform-origin: center; }
        .spin-rev { animation: spin-slow 20s linear infinite reverse; transform-origin: center; }

        .pulse-dot::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #f5c400;
          animation: pulse-ring 2s ease-out infinite;
        }

        .notify-btn {
          background: linear-gradient(135deg, #f5c400, #f59e0b);
          color: #1a0e00;
          border: none;
          padding: 15px 36px;
          font-size: 15px;
          font-weight: 700;
          border-radius: 50px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 24px rgba(245,196,0,0.4);
          white-space: nowrap;
        }
        .notify-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(245,196,0,0.55);
        }
        .notify-btn:active { transform: scale(0.97); }

        .email-input {
          background: rgba(255,255,255,0.9);
          border: 2px solid #fde68a;
          border-radius: 50px;
          padding: 14px 24px;
          font-size: 14px;
          color: #1a0e00;
          font-family: 'Inter', sans-serif;
          outline: none;
          width: 260px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .email-input::placeholder { color: #c49a20; }
        .email-input:focus {
          border-color: #f5c400;
          box-shadow: 0 0 0 4px rgba(245,196,0,0.2);
        }

        .tick-card {
          background: rgba(255,255,255,0.85);
          border: 1.5px solid #fde68a;
          border-radius: 20px;
          padding: 20px 28px 16px;
          min-width: 80px;
          text-align: center;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 20px rgba(245,196,0,0.12);
          transition: transform 0.2s;
        }
        .tick-card:hover { transform: translateY(-4px); }

        .feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.85);
          border: 1.5px solid #fde68a;
          border-radius: 50px;
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 500;
          color: #78450a;
          backdrop-filter: blur(6px);
          transition: background 0.2s, transform 0.2s;
        }
        .feature-pill:hover {
          background: #fff;
          transform: translateY(-2px);
        }

        @media (max-width: 520px) {
          .cta-row { flex-direction: column !important; align-items: center !important; }
          .email-input { width: 100% !important; max-width: 300px; }
          .tick-row { gap: 10px !important; }
          .tick-card { min-width: 64px; padding: 14px 16px 12px; }
        }
      `}</style>

      {/* Background blobs */}
      <div style={styles.blobTR} />
      <div style={styles.blobBL} />
      <div style={styles.blobCenter} />

      {/* Floating dots */}
      {[...Array(16)].map((_, i) => (
        <div key={i} style={{
          position: "fixed",
          borderRadius: "50%",
          background: i % 2 === 0 ? "#f5c400" : "#fde68a",
          width: `${Math.random() * 10 + 4}px`,
          height: `${Math.random() * 10 + 4}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          opacity: 0.2,
          pointerEvents: "none",
          animation: `float ${3 + Math.random() * 4}s ${Math.random() * 3}s ease-in-out infinite`,
        }} />
      ))}

      {/* Nav */}
      <nav style={styles.nav} className="a1">
        <div style={styles.logo}>
          <div style={styles.logoIcon}>✚</div>
          <span style={styles.logoText}>HealthCo</span>
        </div>
        <div style={styles.navBadge}>
          <span style={{ ...styles.navDot, animation: "blink 1.5s infinite" }} />
          Launching Soon
        </div>
      </nav>

      {/* Hero */}
      <main style={styles.main}>

        {/* Floating illustration */}
        <div className="float-icon a2" style={styles.illusWrap}>
          <svg viewBox="0 0 280 260" width="220">
            <defs>
              <radialGradient id="yg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f5c400" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fffbf0" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glow */}
            <ellipse cx="140" cy="130" rx="120" ry="110" fill="url(#yg)" />

            {/* Spinning rings */}
            <circle cx="140" cy="130" r="115" fill="none" stroke="#f5c400"
              strokeWidth="1" strokeDasharray="6 12" opacity="0.3" className="spin" />
            <circle cx="140" cy="130" r="95" fill="none" stroke="#fde68a"
              strokeWidth="0.8" strokeDasharray="4 16" opacity="0.2" className="spin-rev" />

            {/* Heart shape */}
            <path d="M140 195 C100 165 60 140 60 105 C60 80 80 65 100 65 C115 65 130 75 140 88 C150 75 165 65 180 65 C200 65 220 80 220 105 C220 140 180 165 140 195Z"
              fill="#f5c400" opacity="0.95" />
            <path d="M140 185 C108 158 72 136 72 105 C72 86 88 74 103 74 C117 74 130 83 140 95 C150 83 163 74 177 74 C192 74 208 86 208 105 C208 136 172 158 140 185Z"
              fill="#fff8e1" />

            {/* ECG inside heart */}
            <polyline
              points="95,110 108,110 115,95 122,128 130,102 138,110 152,110 158,95 165,128 172,102 180,110 193,110"
              fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />

            {/* Stethoscope */}
            <circle cx="60" cy="190" r="12" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            <path d="M60 178 Q52 160 44 150 Q36 140 36 128"
              fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="36" cy="124" r="5" fill="#f5c400" />

            {/* Pills */}
            <g transform="translate(16,80) rotate(-40)">
              <rect x="0" y="0" width="40" height="18" rx="9" fill="#fff" stroke="#f5c400" strokeWidth="1.5" />
              <rect x="0" y="0" width="20" height="18" rx="9" fill="#fde68a" />
              <line x1="20" y1="0" x2="20" y2="18" stroke="#f5c400" strokeWidth="1.5" />
            </g>
            <g transform="translate(220,70) rotate(40)">
              <rect x="0" y="0" width="40" height="18" rx="9" fill="#fff" stroke="#f59e0b" strokeWidth="1.5" />
              <rect x="0" y="0" width="20" height="18" rx="9" fill="#fde68a" />
              <line x1="20" y1="0" x2="20" y2="18" stroke="#f59e0b" strokeWidth="1.5" />
            </g>

            {/* Stars */}
            {[[25,30],[255,25],[18,200],[262,195],[140,12]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="2.5" fill="#f5c400" opacity="0.5" />
            ))}

            {/* Shadow */}
            <ellipse cx="140" cy="242" rx="70" ry="10" fill="#f5c400" opacity="0.1" />
          </svg>
        </div>

        {/* Badge */}
        <div className="a3" style={styles.badge}>
          <span style={{ ...styles.pulseDot }} className="pulse-dot" />
          We're almost ready
        </div>

        {/* Headline */}
        <h1 className="a3" style={styles.heading}>
          Healthcare,{" "}
          <span style={styles.headingAccent}>Reimagined.</span>
        </h1>

        {/* Subtext */}
        <p className="a4" style={styles.sub}>
          A smarter way to book appointments, consult doctors, and manage your
          health — all in one beautiful platform. Launching very soon.
        </p>

        {/* Countdown */}
        <div className="tick-row a4" style={styles.tickRow}>
          {[
            { val: time.d, label: "Days" },
            { val: time.h, label: "Hours" },
            { val: time.m, label: "Mins" },
            { val: time.s, label: "Secs" },
          ].map(({ val, label }) => (
            <div key={label} className="tick-card">
              <div style={styles.tickNum}>{String(val ?? 0).padStart(2, "0")}</div>
              <div style={styles.tickLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Email CTA */}
        <div className="cta-row a5" style={styles.ctaRow}>
          {submitted ? (
            <div style={styles.successMsg}>🎉 You're on the list! We'll notify you.</div>
          ) : (
            <>
              <input
                className="email-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button className="notify-btn" onClick={() => email && setSubmitted(true)}>
                Notify Me →
              </button>
            </>
          )}
        </div>

        {/* Feature pills */}
        <div className="a6" style={styles.pillsRow}>
          {["🩺 Online Consult", "💊 e-Prescriptions", "📋 Health Records", "🚑 Emergency Care"].map(f => (
            <div key={f} className="feature-pill">{f}</div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="a6" style={styles.footer}>
        © 2026 HealthCo · Brand name coming soon · All rights reserved
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fffbf0",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "0 24px 32px",
  },
  blobTR: {
    position: "fixed", top: "-140px", right: "-140px",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, #fde68a 0%, transparent 70%)",
    opacity: 0.5, pointerEvents: "none",
  },
  blobBL: {
    position: "fixed", bottom: "-120px", left: "-120px",
    width: "420px", height: "420px", borderRadius: "50%",
    background: "radial-gradient(circle, #fef08a 0%, transparent 70%)",
    opacity: 0.4, pointerEvents: "none",
  },
  blobCenter: {
    position: "fixed", top: "35%", left: "50%", transform: "translateX(-50%)",
    width: "600px", height: "300px", borderRadius: "50%",
    background: "radial-gradient(circle, #fefce8 0%, transparent 70%)",
    opacity: 0.6, pointerEvents: "none",
  },
  nav: {
    width: "100%", maxWidth: "900px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "24px 0", zIndex: 2,
  },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcon: {
    width: "38px", height: "38px",
    background: "linear-gradient(135deg, #f5c400, #f59e0b)",
    borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "20px", color: "#fff", fontWeight: 900,
    boxShadow: "0 4px 16px rgba(245,196,0,0.4)",
  },
  logoText: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800, fontSize: "20px",
    color: "#1a0e00", letterSpacing: "-0.3px",
  },
  navBadge: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "#fef9c3", border: "1.5px solid #f5c400",
    borderRadius: "50px", padding: "7px 16px",
    fontSize: "13px", fontWeight: 600, color: "#92620a",
  },
  navDot: {
    width: "7px", height: "7px",
    borderRadius: "50%", background: "#f59e0b", display: "inline-block",
  },
  main: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center", gap: "0px",
    maxWidth: "700px", width: "100%", zIndex: 1,
    paddingTop: "10px",
  },
  illusWrap: { marginBottom: "8px" },
  badge: {
    display: "inline-flex", alignItems: "center", gap: "10px",
    background: "#fef9c3", border: "1.5px solid #f5c400",
    borderRadius: "50px", padding: "8px 20px",
    fontSize: "13px", fontWeight: 600, color: "#92620a",
    marginBottom: "20px", position: "relative",
  },
  pulseDot: {
    width: "8px", height: "8px",
    borderRadius: "50%", background: "#f59e0b",
    display: "inline-block", position: "relative",
  },
  heading: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 900,
    fontSize: "clamp(36px, 7vw, 72px)",
    color: "#1a0e00",
    lineHeight: 1.05,
    letterSpacing: "-2px",
    marginBottom: "20px",
  },
  headingAccent: {
    background: "linear-gradient(135deg, #f5c400, #f59e0b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sub: {
    fontSize: "clamp(14px, 2vw, 17px)",
    color: "#78450a", lineHeight: 1.8,
    maxWidth: "500px", marginBottom: "32px",
  },
  tickRow: {
    display: "flex", gap: "14px",
    marginBottom: "32px", flexWrap: "wrap",
    justifyContent: "center",
  },
  tickNum: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800, fontSize: "32px",
    color: "#1a0e00", lineHeight: 1,
    marginBottom: "6px",
  },
  tickLabel: {
    fontSize: "11px", fontWeight: 600,
    color: "#92620a", letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
  ctaRow: {
    display: "flex", gap: "12px",
    marginBottom: "28px", flexWrap: "wrap",
    justifyContent: "center",
  },
  successMsg: {
    background: "#fef9c3", border: "1.5px solid #f5c400",
    borderRadius: "50px", padding: "14px 28px",
    fontSize: "15px", fontWeight: 600, color: "#92620a",
  },
  pillsRow: {
    display: "flex", flexWrap: "wrap",
    gap: "10px", justifyContent: "center",
  },
  footer: {
    marginTop: "32px", zIndex: 1,
    fontSize: "12px", color: "#c49a20",
  },
};