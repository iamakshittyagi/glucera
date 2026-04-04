import { useState } from "react";
import "./App.css";

export default function App() {
  const [hovered, setHovered] = useState(null);

  const games = [
    { id: 1, title: "VALORANT", genre: "5v5 Tactical Shooter", color: "#ff4655" },
    { id: 2, title: "LEAGUE OF LEGENDS", genre: "Strategy MOBA", color: "#c89b3c" },
    { id: 3, title: "TEAMFIGHT TACTICS", genre: "Auto Battler", color: "#0bc4c4" },
  ];

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.logo}>RIOT GAMES</span>
        <div style={styles.navLinks}>
          {["Games", "News", "Careers", "About"].map((item) => (
            <a key={item} href="#" style={styles.navItem}>{item}</a>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <p style={styles.eyebrow}>WELCOME TO</p>
        <h1 style={styles.heroTitle}>RIOT GAMES</h1>
        <p style={styles.heroSub}>
          We are dedicated players and developers who want to make the most player-focused games in the world.
        </p>
        <button style={styles.cta}>EXPLORE OUR GAMES</button>
      </section>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Games Grid */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>OUR GAMES</h2>
        <div style={styles.grid}>
          {games.map((game) => (
            <div
              key={game.id}
              style={{
                ...styles.card,
                borderColor: hovered === game.id ? game.color : "#222",
                transform: hovered === game.id ? "translateY(-6px)" : "translateY(0)",
              }}
              onMouseEnter={() => setHovered(game.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ ...styles.cardAccent, background: game.color }} />
              <h3 style={styles.cardTitle}>{game.title}</h3>
              <p style={styles.cardGenre}>{game.genre}</p>
              <a href="#" style={{ ...styles.cardLink, color: game.color }}>
                PLAY NOW →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <span style={styles.footerLogo}>RIOT GAMES</span>
        <p style={styles.footerText}>© 2026 Riot Games, Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles = {
  page: { background: "#0a0a0a", color: "#fff", minHeight: "100vh", fontFamily: "'Arial', sans-serif" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 60px", borderBottom: "1px solid #1a1a1a" },
  logo: { fontWeight: 900, fontSize: "18px", letterSpacing: "4px", color: "#fff" },
  navLinks: { display: "flex", gap: "36px" },
  navItem: { color: "#aaa", textDecoration: "none", fontSize: "13px", letterSpacing: "2px", fontWeight: 600 },
  hero: { textAlign: "center", padding: "100px 20px 80px" },
  eyebrow: { fontSize: "12px", letterSpacing: "6px", color: "#ff4655", marginBottom: "12px", fontWeight: 700 },
  heroTitle: { fontSize: "72px", fontWeight: 900, letterSpacing: "8px", margin: "0 0 24px", lineHeight: 1 },
  heroSub: { fontSize: "16px", color: "#888", maxWidth: "500px", margin: "0 auto 40px", lineHeight: 1.7 },
  cta: { background: "#ff4655", color: "#fff", border: "none", padding: "14px 40px", fontSize: "13px", fontWeight: 700, letterSpacing: "3px", cursor: "pointer" },
  divider: { height: "1px", background: "#1a1a1a", margin: "0 60px" },
  section: { padding: "80px 60px" },
  sectionTitle: { fontSize: "13px", letterSpacing: "6px", color: "#555", marginBottom: "40px", fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" },
  card: { background: "#111", border: "1px solid #222", padding: "36px 28px", transition: "all 0.25s ease", cursor: "pointer" },
  cardAccent: { width: "32px", height: "3px", marginBottom: "20px" },
  cardTitle: { fontSize: "18px", fontWeight: 900, letterSpacing: "3px", marginBottom: "8px" },
  cardGenre: { fontSize: "12px", color: "#555", letterSpacing: "2px", marginBottom: "28px" },
  cardLink: { fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textDecoration: "none" },
  footer: { borderTop: "1px solid #1a1a1a", padding: "40px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  footerLogo: { fontWeight: 900, letterSpacing: "4px", fontSize: "14px" },
  footerText: { color: "#444", fontSize: "12px" },
};