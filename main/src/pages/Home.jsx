import { useState, useEffect, useCallback } from "react";
import nameLogo from "../assets/name_logo.png";

/* ─── BEAT LOADER ────────────────────────────────────────────────── */
function BeatLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 1.5;
      });
    }, 28);
    const t1 = setTimeout(() => setFadeOut(true), 2400);
    const t2 = setTimeout(onComplete, 3000);
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes heartbeat {
          0%,100% { transform: scale(1); }
          14%     { transform: scale(1.18); }
          28%     { transform: scale(1); }
          42%     { transform: scale(1.09); }
          56%     { transform: scale(1); }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#fff",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "1.8rem",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.55s ease",
      }}>
        <img
          src="/favicon.png"
          alt="Glucera"
          style={{
            width: 72, height: 72,
            borderRadius: "50%",
            objectFit: "cover",
            animation: "heartbeat 0.75s ease-in-out infinite",
          }}
        />

        <div style={{
          width: 140, height: 2,
          background: "#F0EAEB",
          borderRadius: 99, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #C4ADAF, #76575D)",
            borderRadius: 99,
            transition: "width 0.028s linear",
          }} />
        </div>
      </div>
    </>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────── */
function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #fff; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.3; }
        }

        .a1 { animation: fadeUp 0.55s ease both 0.1s; }
        .a2 { animation: fadeUp 0.55s ease both 0.22s; }
        .a3 { animation: fadeUp 0.55s ease both 0.34s; }
        .a4 { animation: fadeUp 0.55s ease both 0.46s; }
      `}</style>

      <div style={{
        minHeight: "100dvh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
        textAlign: "center",
        gap: "1.2rem",
      }}>

        {/* Logo */}
        <div className="a1">
          <img
            src={nameLogo}
            alt="Glucera"
            style={{ height: 80, objectFit: "contain" }}
          />
        </div>

        <p className="a2" style={{
          fontSize: "0.72rem",
          fontWeight: 500,
          color: "#C4ADAF",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}>
          Coming Soon
        </p>

        <h1 className="a3" style={{
          fontSize: "clamp(2rem, 6vw, 3.6rem)",
          fontWeight: 700,
          color: "#76575D",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
        }}>
          April 6 · 18:00 IST
        </h1>

        <p className="a3" style={{
          fontSize: "clamp(0.88rem, 2vw, 1rem)",
          fontWeight: 400,
          color: "#B8A0A4",
        }}>
          Mark your calendar. Something good is on the way.
        </p>

        <div className="a4" style={{
          width: 40, height: 1.5,
          background: "linear-gradient(90deg, #fff, #76575D, #fff)",
          borderRadius: 99,
          marginTop: "0.8rem",
        }} />

        <div className="a4" style={{ display: "flex", gap: "0.35rem" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: "50%",
              background: "#76575D",
              animation: `blink 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>

      </div>
    </>
  );
}

/* ─── DEFAULT EXPORT ─────────────────────────────────────────────── */
export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <BeatLoader onComplete={handleComplete} />}
      {loaded && <Hero />}
    </>
  );
}