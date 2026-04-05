import { useState } from "react";

const data = [
  {
    id: "H001",
    title: "Context-Aware Hypoglycaemia Risk Intelligence System",
    color: "#f59e0b",
    light: "#fffbf0",
    border: "#fde68a",
    tag: "🏆 Hackathon Favourite",
    tagColor: "#065f46",
    tagBg: "#f0fdf4",
    sdg: "SDG-3.4",
    sdgDesc: "Reduce premature mortality from non-communicable diseases",
    irl: "422 million people have diabetes worldwide. A hypoglycaemic episode (blood sugar crash) can cause unconsciousness, seizures, or death — often within 10–15 minutes. Most patients only find out AFTER it happens.",
    pitch: "\"1 in 10 people have diabetes. Our AI predicts a dangerous blood sugar crash before it happens — and alerts them in time.\"",
    howItWorks: [
      { step: "1", title: "Data collection", desc: "App/wearable continuously collects glucose readings, medication logs, meal timings, sleep data, activity levels" },
      { step: "2", title: "Context engine", desc: "AI analyses patterns across ALL inputs together — not just glucose in isolation. Considers time of day, last meal, recent activity" },
      { step: "3", title: "Risk scoring", desc: "ML model assigns a risk score every 15 minutes. Score > threshold → alert triggered immediately" },
      { step: "4", title: "Early alert", desc: "Push notification sent to patient AND caregiver 20–30 mins before predicted episode. Patient can eat something to prevent it" },
      { step: "5", title: "Feedback loop", desc: "Model improves over time by learning whether the prediction was correct or not" },
    ],
    techStack: ["React Native / Flutter (mobile)", "Python + scikit-learn / TensorFlow (ML model)", "Node.js + Express (backend API)", "Firebase (real-time alerts)", "CGM device API (e.g. Dexcom, Libre)"],
    pros: [
      "Extremely high impact — literally saves lives",
      "Very specific problem = focused solution",
      "Strong emotional pitch for judges",
      "Clear demo: show a glucose drop being predicted",
      "Unique — no mainstream app does this with context",
      "Directly maps to SDG-3.4",
    ],
    cons: [
      "Needs real or simulated glucose data",
      "Integrating CGM device API can be tricky",
      "Medical accuracy pressure — wrong alerts lose trust",
      "Harder to build in a short hackathon window",
    ],
    difficulty: 4,
    impact: 5,
    feasibility: 3,
    demoability: 5,
    winChance: 5,
  },
  {
    id: "H002",
    title: "Context-Aware Daily Health Decision Assistant",
    color: "#3b82f6",
    light: "#eff6ff",
    border: "#93c5fd",
    tag: "💡 Good but Common",
    tagColor: "#1e40af",
    tagBg: "#eff6ff",
    sdg: "SDG-3.4 + 3.8",
    sdgDesc: "Prevention of NCDs + Universal health coverage",
    irl: "Over 80% of lifestyle diseases (type 2 diabetes, obesity, heart disease) are preventable through daily behaviour change. But people don't change because generic advice doesn't fit their routine.",
    pitch: "\"Most health apps give you the same tips. Ours watches how you actually live — and nudges you at exactly the right moment.\"",
    howItWorks: [
      { step: "1", title: "Habit tracking", desc: "User logs meals, sleep, activity — or app pulls from Apple Health / Google Fit automatically" },
      { step: "2", title: "Pattern analysis", desc: "AI identifies patterns: skips breakfast on Mondays, sleeps late after weekends, misses walks when it rains" },
      { step: "3", title: "Context matching", desc: "System checks current time, weather, calendar, recent behaviour to find the best moment for a nudge" },
      { step: "4", title: "Personalised nudge", desc: "Sends a short, specific, non-generic tip: 'You usually skip lunch on Tuesdays — have a snack now to avoid energy crash'" },
      { step: "5", title: "Outcome tracking", desc: "Tracks whether user acted on the nudge and adjusts future recommendations accordingly" },
    ],
    techStack: ["React Native (mobile app)", "Python + pandas (habit analysis)", "OpenAI API (natural language nudges)", "Apple Health / Google Fit API", "PostgreSQL (user history)"],
    pros: [
      "Large addressable audience — everyone can use it",
      "Easy to demo with a simple flow",
      "Integrates well with existing health APIs",
      "Low data sensitivity compared to medical apps",
      "Can prototype quickly in a hackathon",
    ],
    cons: [
      "Crowded space — Apple Health, Google Fit, Noom exist",
      "Hard to differentiate from existing wellness apps",
      "Behaviour change is slow — hard to show impact in demo",
      "Less dramatic pitch than H001 or H003",
      "Judges may feel 'we've seen this before'",
    ],
    difficulty: 2,
    impact: 3,
    feasibility: 5,
    demoability: 3,
    winChance: 2,
  },
  {
    id: "H003",
    title: "AI-Native Clinical Trial Data Management System",
    color: "#10b981",
    light: "#ecfdf5",
    border: "#6ee7b7",
    tag: "🔬 High Impact, Hard Demo",
    tagColor: "#065f46",
    tagBg: "#ecfdf5",
    sdg: "SDG-3.b",
    sdgDesc: "Support R&D for new medicines and vaccines",
    irl: "Clinical trials take an average of 12 years and cost $2.6 billion. 50% of trial delays are caused by data entry errors and manual processing. Every year of delay = thousands of patients waiting for life-saving treatments.",
    pitch: "\"Every year a trial is delayed, patients die waiting. We eliminate the #1 cause of that delay — manual data entry errors.\"",
    howItWorks: [
      { step: "1", title: "Document ingestion", desc: "System ingests raw trial documents — scans, lab reports, patient records, protocol PDFs using OCR + NLP" },
      { step: "2", title: "Auto-structuring", desc: "AI extracts and structures data into standardised tables — CDISC SDTM format used in FDA submissions" },
      { step: "3", title: "Real-time validation", desc: "System checks for inconsistencies, missing values, protocol deviations as data comes in — not at end of trial" },
      { step: "4", title: "Compliance check", desc: "Automated GCP (Good Clinical Practice) and 21 CFR Part 11 compliance verification before submission" },
      { step: "5", title: "Dashboard output", desc: "Clean, submission-ready dataset with audit trail, anomaly flags, and quality score for regulators" },
    ],
    techStack: ["React (web dashboard)", "Python + spaCy / Tesseract (NLP + OCR)", "FastAPI (backend)", "PostgreSQL + audit logging", "CDISC SDTM schema (data standard)"],
    pros: [
      "Massive real-world impact — accelerates drug development",
      "Very technical = impressive to judges",
      "Clear B2B market — pharma companies pay big",
      "Strong SDG-3.b alignment",
      "Nobody else is likely building this at a hackathon",
    ],
    cons: [
      "Very niche — judges may not relate personally",
      "Hard to demo without real clinical trial data",
      "Requires understanding of pharma compliance standards",
      "Most complex to build in a short time",
      "Emotional impact harder to convey than H001",
    ],
    difficulty: 5,
    impact: 5,
    feasibility: 2,
    demoability: 2,
    winChance: 3,
  },
  {
    id: "H004",
    title: "Personal Health Data Visualizer & Insight Generator",
    color: "#8b5cf6",
    light: "#f5f3ff",
    border: "#c4b5fd",
    tag: "🎨 Best for Frontend",
    tagColor: "#4c1d95",
    tagBg: "#f5f3ff",
    sdg: "SDG-3.4",
    sdgDesc: "Reduce premature mortality from non-communicable diseases",
    irl: "Wearables and health apps generate massive amounts of data — but 70% of users don't understand what the numbers mean. Data without insight doesn't change behaviour.",
    pitch: "\"Your smartwatch knows more about your health than you do. We make that data actually understandable — and actionable.\"",
    howItWorks: [
      { step: "1", title: "Data ingestion", desc: "Connects to Apple Health, Google Fit, Fitbit, Garmin — or user manually uploads CSV from lab reports" },
      { step: "2", title: "Normalisation", desc: "Raw data cleaned and normalised — handles different units, timestamps, missing values across devices" },
      { step: "3", title: "Insight engine", desc: "AI identifies trends, anomalies, correlations: 'Your resting heart rate spikes every Sunday night — linked to sleep debt'" },
      { step: "4", title: "Visual generation", desc: "Generates interactive charts, heatmaps, timelines. Plain English summaries alongside every chart" },
      { step: "5", title: "Action recommendations", desc: "Suggests specific actions: 'Your HRV has dropped 18% this week — consider reducing caffeine or increasing sleep'" },
    ],
    techStack: ["React + Recharts / D3.js (visualisations)", "Python + pandas (data processing)", "OpenAI API (plain English insights)", "Apple Health / Google Fit / Fitbit API", "Supabase (data storage)"],
    pros: [
      "Visually impressive — great for live demo",
      "Everyone has health data — very relatable",
      "Frontend-heavy = plays to your React skills",
      "Easy to show in 2 minutes to judges",
      "Can use dummy data for demo — no real patient data needed",
      "OpenAI makes insight generation easy",
    ],
    cons: [
      "Less urgent than H001 — no life-or-death stakes",
      "Several apps like this exist (Apple Health summaries, Whoop)",
      "Impact harder to quantify than H001 or H003",
      "Requires multiple API integrations",
    ],
    difficulty: 3,
    impact: 3,
    feasibility: 4,
    demoability: 5,
    winChance: 3,
  },
];

function Stars({ count, max = 5, color }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[...Array(max)].map((_, i) => (
        <div key={i} style={{
          width: "14px", height: "14px", borderRadius: "3px",
          background: i < count ? color : "#fde68a",
          transition: "background 0.2s",
        }} />
      ))}
    </div>
  );
}

function Meter({ label, value, color }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "12px", color: "#78450a", fontWeight: 600 }}>{label}</span>
        <Stars count={value} color={color} />
      </div>
      <div style={{ height: "6px", background: "#fde68a", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${(value / 5) * 100}%`,
          background: color, borderRadius: "4px",
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

function FlowStep({ step, title, desc, color, isLast }) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: color, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: "13px", flexShrink: 0,
        }}>{step}</div>
        {!isLast && <div style={{ width: "2px", flex: 1, minHeight: "24px", background: "#fde68a", marginTop: "4px" }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : "20px", flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a0e00", marginBottom: "4px" }}>{title}</div>
        <div style={{ fontSize: "13px", color: "#78450a", lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  );
}

function Card({ d, expanded, onToggle }) {
  return (
    <div style={{
      background: "#fff",
      border: `2px solid ${expanded ? d.color : "#fde68a"}`,
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: expanded ? `0 8px 40px ${d.color}25` : "0 2px 12px rgba(245,196,0,0.07)",
      marginBottom: "20px",
      transition: "border-color 0.2s, box-shadow 0.3s",
    }}>

      {/* Header */}
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "20px 24px", cursor: "pointer",
        background: expanded ? d.light : "#fff",
        transition: "background 0.2s",
      }}>
        <div style={{
          background: d.color, color: "#fff",
          fontWeight: 800, fontSize: "13px",
          padding: "6px 14px", borderRadius: "50px",
          letterSpacing: "1px", flexShrink: 0,
        }}>{d.id}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#1a0e00", lineHeight: 1.3 }}>{d.title}</div>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
            <span style={{
              background: d.tagBg, color: d.tagColor,
              fontSize: "11px", fontWeight: 700,
              padding: "3px 10px", borderRadius: "50px",
              border: `1px solid ${d.border}`,
            }}>{d.tag}</span>
            <span style={{
              background: "#f0fdf4", color: "#065f46",
              fontSize: "11px", fontWeight: 700,
              padding: "3px 10px", borderRadius: "50px",
              border: "1px solid #6ee7b7",
            }}>{d.sdg}</span>
          </div>
        </div>
        <div style={{
          fontSize: "18px", color: d.color,
          transform: expanded ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.3s", flexShrink: 0,
        }}>▼</div>
      </div>

      {expanded && (
        <div style={{ padding: "4px 24px 28px" }}>

          {/* SDG connection */}
          <div style={{
            background: "#f0fdf4", border: "1.5px solid #6ee7b7",
            borderRadius: "12px", padding: "12px 16px",
            marginBottom: "16px",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", letterSpacing: "2px", marginBottom: "4px" }}>SDG-3 CONNECTION</div>
            <div style={{ fontSize: "13px", color: "#065f46" }}>{d.sdgDesc}</div>
          </div>

          {/* IRL Problem */}
          <div style={s.label}>Real-world problem</div>
          <div style={{ ...s.box, borderColor: d.border, background: d.light, marginBottom: "16px" }}>
            {d.irl}
          </div>

          {/* Pitch */}
          <div style={s.label}>Hackathon pitch</div>
          <div style={{
            ...s.box, borderColor: d.color,
            background: "#fff", marginBottom: "20px",
            fontStyle: "italic", fontWeight: 600,
            fontSize: "15px", color: "#1a0e00",
            borderWidth: "2px",
          }}>
            {d.pitch}
          </div>

          {/* Two column layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

            {/* Pros */}
            <div>
              <div style={s.label}>Pros</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {d.pros.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "#10b981", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: "13px", color: "#1a0e00", lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div>
              <div style={s.label}>Cons</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {d.cons.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>✗</span>
                    <span style={{ fontSize: "13px", color: "#1a0e00", lineHeight: 1.5 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How it works flow */}
          <div style={s.label}>How it works — step by step</div>
          <div style={{
            background: d.light, border: `1.5px solid ${d.border}`,
            borderRadius: "14px", padding: "20px",
            marginBottom: "20px",
          }}>
            {d.howItWorks.map((step, i) => (
              <FlowStep
                key={i}
                step={step.step}
                title={step.title}
                desc={step.desc}
                color={d.color}
                isLast={i === d.howItWorks.length - 1}
              />
            ))}
          </div>

          {/* Tech stack */}
          <div style={s.label}>Tech stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
            {d.techStack.map((t, i) => (
              <div key={i} style={{
                background: "#fff", border: `1.5px solid ${d.border}`,
                borderRadius: "8px", padding: "6px 14px",
                fontSize: "12px", fontWeight: 600, color: "#1a0e00",
              }}>{t}</div>
            ))}
          </div>

          {/* Scores */}
          <div style={s.label}>Hackathon scorecard</div>
          <div style={{
            background: "#fff", border: `1.5px solid ${d.border}`,
            borderRadius: "14px", padding: "18px 20px",
          }}>
            <Meter label="Difficulty to build" value={d.difficulty} color={d.color} />
            <Meter label="Real-world impact" value={d.impact} color={d.color} />
            <Meter label="Feasibility in 24–48 hrs" value={d.feasibility} color={d.color} />
            <Meter label="Demo-ability" value={d.demoability} color={d.color} />
            <Meter label="Win potential" value={d.winChance} color={d.color} />
          </div>

        </div>
      )}
    </div>
  );
}

export default function Explainer() {
  const [expanded, setExpanded] = useState("H001");
  const toggle = id => setExpanded(p => p === id ? null : id);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fffbf0; }
        @keyframes up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .up { animation: up 0.6s cubic-bezier(.22,1,.36,1) both; }
        @media (max-width: 580px) {
          .grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero */}
      <div className="up" style={s.hero}>
        <div style={s.badge}>SDG-3 · AI in Healthcare · Full Breakdown</div>
        <h1 style={s.h1}>Pick Your Problem Statement</h1>
        <p style={s.sub}>
          Full breakdown of all 4 — how it works, pros, cons,
          tech stack and hackathon win potential. Click any card to explore.
        </p>

        {/* SDG Root */}
        <div style={s.sdgRoot}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#065f46", letterSpacing: "2px", marginBottom: "6px" }}>ROOT GOAL</div>
          <div style={{ fontWeight: 800, fontSize: "18px", color: "#065f46" }}>SDG-3 — Good Health & Well-being</div>
          <div style={{ fontSize: "13px", color: "#059669", marginTop: "4px" }}>Ensure healthy lives and promote well-being for all at all ages</div>
        </div>

        {/* Arrow down */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "12px 0 4px" }}>
          <div style={{ width: "2px", height: "24px", background: "#fde68a" }} />
          <div style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "12px solid #f5c400" }} />
        </div>

        {/* 4 branch pills */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "8px" }}>
          {data.map(d => (
            <div
              key={d.id}
              onClick={() => toggle(d.id)}
              style={{
                background: expanded === d.id ? d.color : "#fff",
                border: `2px solid ${d.color}`,
                color: expanded === d.id ? "#fff" : d.color,
                padding: "8px 20px", borderRadius: "50px",
                fontWeight: 700, fontSize: "14px",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >{d.id}</div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="up" style={s.cards}>
        {data.map(d => (
          <Card
            key={d.id}
            d={d}
            expanded={expanded === d.id}
            onToggle={() => toggle(d.id)}
          />
        ))}
      </div>



      <div style={{ textAlign: "center", fontSize: "12px", color: "#c49a20", marginTop: "20px", paddingBottom: "40px" }}>
        LET'S COOK!
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#fffbf0",
    fontFamily: "'Inter', sans-serif",
    padding: "0 20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  hero: {
    textAlign: "center",
    padding: "48px 0 24px",
  },
  badge: {
    display: "inline-block",
    background: "#fef9c3",
    border: "1.5px solid #f5c400",
    borderRadius: "50px",
    padding: "6px 18px",
    fontSize: "12px", fontWeight: 700,
    color: "#92620a", letterSpacing: "1px",
    marginBottom: "16px",
  },
  h1: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 900,
    fontSize: "clamp(28px, 6vw, 50px)",
    color: "#1a0e00",
    letterSpacing: "-1px",
    marginBottom: "14px",
  },
  sub: {
    fontSize: "15px", color: "#78450a",
    lineHeight: 1.8, maxWidth: "520px",
    margin: "0 auto 28px",
  },
  sdgRoot: {
    display: "inline-block",
    background: "#f0fdf4",
    border: "2px solid #10b981",
    borderRadius: "16px",
    padding: "16px 32px",
    textAlign: "center",
  },
  cards: { marginTop: "8px" },
  label: {
    fontSize: "11px", fontWeight: 700,
    letterSpacing: "2px", color: "#92620a",
    textTransform: "uppercase",
    marginBottom: "8px", marginTop: "16px",
  },
  box: {
    border: "1.5px solid #fde68a",
    borderRadius: "12px",
    padding: "14px 18px",
    fontSize: "13px", color: "#1a0e00",
    lineHeight: 1.7,
  },
  rec: {
    background: "#fff",
    border: "2px solid #f5c400",
    borderRadius: "20px",
    padding: "24px 28px",
    marginTop: "8px",
    textAlign: "center",
  },
};