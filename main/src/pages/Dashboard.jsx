import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from "recharts";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const HYPO_THRESHOLD = 70;
const WARN_THRESHOLD = 80;

// ─── ALERT MANAGER ───────────────────────────────────────────────────────────
function sendPushNotification(riskLevel, confidence) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("Glucera Alert", {
      body:
        riskLevel === "high"
          ? `DANGER: Glucose crash predicted. Confidence ${confidence}%. Eat something NOW.`
          : `Caution: Glucose dropping. Confidence ${confidence}%. Consider a snack.`,
      icon: "/favicon.png",
      vibrate: [200, 100, 200],
    });
  }
}

function speakAlert(riskLevel) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg =
    riskLevel === "high"
      ? "Warning. Your glucose is dropping dangerously. Please eat something immediately."
      : "Caution. Your glucose is getting low. Consider having a small snack.";
  const utterance = new SpeechSynthesisUtterance(msg);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

async function sendSOSToBackend(trigger, coords) {
  try {
    await fetch("http://localhost:5000/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        mapsLink: coords
          ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
          : null,
        time: new Date().toISOString(),
        message: "EMERGENCY: Patient needs help. Glucose crash suspected.",
      }),
    });
  } catch {
    console.warn("SOS backend unreachable — logged locally.");
  }
}

function triggerSOS(trigger = "manual") {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => sendSOSToBackend(trigger, pos.coords),
      () => sendSOSToBackend(trigger, null)
    );
  } else {
    sendSOSToBackend(trigger, null);
  }
}

async function notifyCaregiver(riskLevel, confidence) {
  try {
    await fetch("http://localhost:5000/alert-caregiver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        risk: riskLevel,
        confidence,
        time: new Date().toLocaleTimeString(),
      }),
    });
  } catch {
    console.warn("Caregiver alert backend unreachable — logged locally.");
  }
}

function triggerAllAlerts(riskLevel, confidence) {
  if (riskLevel === "food_spike" || riskLevel === "low") return;
  if (riskLevel === "medium") {
    sendPushNotification(riskLevel, confidence);
    speakAlert(riskLevel);
  }
  if (riskLevel === "high") {
    sendPushNotification(riskLevel, confidence);
    speakAlert(riskLevel);
    notifyCaregiver(riskLevel, confidence);
    triggerSOS("auto");
  }
}

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    const obj = {};
    headers.forEach((h, i) => (obj[h] = vals[i]?.trim() ?? ""));
    return obj;
  });
}

// ─── CLINICAL RISK SCORE ──────────────────────────────────────────────────────
// Returns 0–100. Higher = more dangerous.
function computeClinicalScore(analysis, ctx) {
  let score = 0;
  const drivers = [];

  // 1. Glucose rate of change (slope per reading × 4 = per hour)
  const ratePerHour = analysis.slope * 4;
  if (ratePerHour < -3) { score += 25; drivers.push({ label: "Rapid glucose drop", pts: 25 }); }
  else if (ratePerHour < -1.5) { score += 12; drivers.push({ label: "Moderate drop rate", pts: 12 }); }

  // 2. Absolute glucose level
  if (analysis.glucose < HYPO_THRESHOLD) { score += 20; drivers.push({ label: "Below hypo threshold", pts: 20 }); }
  else if (analysis.glucose < WARN_THRESHOLD) { score += 10; drivers.push({ label: "Near warning threshold", pts: 10 }); }

  // 3. Heart rate (from CSV last row already in analysis)
  if (ctx.heartRate && ctx.heartRate > 100) { score += 10; drivers.push({ label: "Elevated heart rate", pts: 10 }); }

  // 4. Hypo episodes last 7 days
  if (ctx.hypoEpisodes >= 3) { score += 15; drivers.push({ label: "3+ hypos this week", pts: 15 }); }
  else if (ctx.hypoEpisodes >= 1) { score += 8; drivers.push({ label: "Recent hypo history", pts: 8 }); }

  // 5. Insulin on board
  if (ctx.insulinOnBoard > 0) { score += 10; drivers.push({ label: "Active insulin on board", pts: 10 }); }

  // 6. Hours since exercise — peak hypo risk at 4–8 hrs post-exercise
  if (ctx.hoursSinceExercise >= 4 && ctx.hoursSinceExercise <= 8) {
    score += 10; drivers.push({ label: "Post-exercise danger window (4–8h)", pts: 10 });
  }

  // 7. Skipped meal after insulin
  if (ctx.skippedMeal) { score += 15; drivers.push({ label: "Insulin taken, no meal followed", pts: 15 }); }

  // 8. Sleep deprivation
  if (ctx.sleepHours < 6) { score += 8; drivers.push({ label: "Sleep deprivation (↑ insulin sensitivity)", pts: 8 }); }

  // 9. Alcohol consumed
  if (ctx.alcoholConsumed) { score += 12; drivers.push({ label: "Alcohol blocks liver glucose release", pts: 12 }); }

  // 10. Stress level
  if (ctx.stressLevel >= 8) { score += 8; drivers.push({ label: "High stress (post-spike crash risk)", pts: 8 }); }
  else if (ctx.stressLevel >= 5) { score += 4; drivers.push({ label: "Moderate stress", pts: 4 }); }

  // 11. Glucose variability
  const glucoseVals = analysis.recent.map(r => parseFloat(r.glucose_mg_dl)).filter(Boolean);
  const variability = Math.max(...glucoseVals) - Math.min(...glucoseVals);
  if (variability > 80) { score += 10; drivers.push({ label: "High glucose variability (>80 swing)", pts: 10 }); }
  else if (variability > 50) { score += 5; drivers.push({ label: "Moderate glucose variability", pts: 5 }); }

  score = Math.min(100, score);

  // Derive final risk level from score
  let risk = "low";
  if (score >= 60) risk = "high";
  else if (score >= 30) risk = "medium";
  if (analysis.foodSpike) risk = "food_spike";

  // Sort drivers by impact
  drivers.sort((a, b) => b.pts - a.pts);

  return { score, risk, drivers };
}

// ─── BASE ANALYSIS ENGINE ─────────────────────────────────────────────────────
function analyseData(rows) {
  const recent = rows.slice(-8);
  const last = rows[rows.length - 1];
  const glucose = parseFloat(last.glucose_mg_dl);

  const prev3 = rows.slice(-4, -1);
  const maxPrev = Math.max(...prev3.map((r) => parseFloat(r.glucose_mg_dl) || 0));
  const foodSpike = glucose - maxPrev >= 20;

  const oldest = parseFloat(recent[0].glucose_mg_dl);
  const newest = parseFloat(recent[recent.length - 1].glucose_mg_dl);
  const slope = (newest - oldest) / recent.length;

  let minsToHypo = null;
  if (slope < 0 && glucose > HYPO_THRESHOLD) {
    const readingsToHypo = (glucose - HYPO_THRESHOLD) / Math.abs(slope);
    minsToHypo = Math.round(readingsToHypo * 15);
  }

  let risk = "low";
  if (foodSpike) risk = "food_spike";
  else if (glucose < HYPO_THRESHOLD || (minsToHypo !== null && minsToHypo < 20)) risk = "high";
  else if (glucose < WARN_THRESHOLD || (minsToHypo !== null && minsToHypo < 40)) risk = "medium";

  const lastMeal = [...rows].reverse().find((r) => r.meal_taken === "1" || r.meal_taken === 1);
  const lastInsulin = [...rows].reverse().find((r) => parseFloat(r.insulin_dose_units) > 0);
  const lastExercise = [...rows].reverse().find((r) => parseFloat(r.exercise_minutes) > 0);
  const lastHR = parseFloat(last.heart_rate) || null;

  const reasons = [];
  if (lastInsulin) reasons.push("recent insulin dose");
  if (lastExercise) reasons.push("exercise session detected");
  if (!lastMeal || rows.indexOf(lastMeal) < rows.length - 6) reasons.push("no recent meal");
  if (new Date().getHours() >= 22 || new Date().getHours() <= 6) reasons.push("nighttime risk window");

  let foodSuggestion = "";
  if (risk === "high") foodSuggestion = "Eat 3 glucose tablets or drink a small glass of juice RIGHT NOW.";
  else if (risk === "medium") foodSuggestion = "Have a small snack — a banana or biscuits will help stabilise your glucose.";
  else if (risk === "food_spike") foodSuggestion = "Glucose rising after food or exercise — this looks normal. Monitoring continues.";
  else foodSuggestion = "Glucose looks stable. Keep up your current routine!";

  let confidence = 0;
  if (risk === "high") confidence = minsToHypo ? Math.min(99, Math.round(90 - minsToHypo * 0.5)) : 85;
  else if (risk === "medium") confidence = 63;
  else if (risk === "low") confidence = 95;
  else if (risk === "food_spike") confidence = 78;

  return {
    glucose, slope, minsToHypo, risk, reasons, foodSuggestion,
    foodSpike, confidence, lastHR,
    recent: rows.slice(-20),
  };
}

// ─── RISK CONFIG ──────────────────────────────────────────────────────────────
const riskConfig = {
  high:       { label: "HIGH RISK",   color: "#c0392b", bg: "#fdf0ef", pulse: true  },
  medium:     { label: "MEDIUM RISK", color: "#e67e22", bg: "#fef9f0", pulse: false },
  low:        { label: "ALL CLEAR",   color: "#27ae60", bg: "#f0faf4", pulse: false },
  food_spike: { label: "FOOD SPIKE",  color: "#2980b9", bg: "#f0f6ff", pulse: false },
};

// ─── DEFAULT CONTEXT ──────────────────────────────────────────────────────────
const defaultCtx = {
  hypoEpisodes: 0,
  insulinOnBoard: 0,
  hoursSinceExercise: 0,
  skippedMeal: false,
  sleepHours: 7,
  alcoholConsumed: false,
  stressLevel: 3,
  heartRate: null,
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]           = useState(null);
  const [analysis, setAnalysis]   = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [fileName, setFileName]   = useState("");
  const [sosSent, setSosSent]     = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [ctx, setCtx]             = useState(defaultCtx);
  const [clinical, setClinical]   = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const autoSosTimer      = useRef(null);
  const countdownInterval = useRef(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Recompute clinical score whenever context or analysis changes
  useEffect(() => {
    if (!analysis) return;
    const result = computeClinicalScore(analysis, {
      ...ctx,
      heartRate: ctx.heartRate ?? analysis.lastHR,
    });
    setClinical(result);
  }, [analysis, ctx]);

  const effectiveRisk = clinical ? clinical.risk : analysis?.risk;
  const effectiveConf = clinical
    ? Math.min(99, Math.round(50 + clinical.score * 0.49))
    : analysis?.confidence;

  useEffect(() => {
    if (!analysis) return;
    triggerAllAlerts(effectiveRisk, effectiveConf);
  }, [effectiveRisk]); // eslint-disable-line

  useEffect(() => {
    clearTimeout(autoSosTimer.current);
    clearInterval(countdownInterval.current);
    setCountdown(null);

    if (effectiveRisk === "high" && !sosSent) {
      const totalSecs = (analysis?.minsToHypo || 5) * 60;
      setCountdown(totalSecs);
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(countdownInterval.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      autoSosTimer.current = setTimeout(() => {
        setSosSent(true);
        triggerSOS("auto");
      }, totalSecs * 1000);
    }
    return () => {
      clearTimeout(autoSosTimer.current);
      clearInterval(countdownInterval.current);
    };
  }, [effectiveRisk, sosSent]); // eslint-disable-line

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setSosSent(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      setData(rows);
      const a = analyseData(rows);
      setAnalysis(a);
      setShowPanel(true);
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []); // eslint-disable-line

  function handleManualSOS() {
    setSosSent(true);
    clearTimeout(autoSosTimer.current);
    clearInterval(countdownInterval.current);
    setCountdown(null);
    triggerSOS("manual");
  }

  const risk = effectiveRisk ? riskConfig[effectiveRisk] : null;

  const countdownDisplay =
    countdown !== null
      ? `${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`
      : null;

  const updateCtx = (key, val) => setCtx(prev => ({ ...prev, [key]: val }));

  return (
    <div className="dash-page">
      <Navbar />

      <div className="dash-container">

        {/* ── UPLOAD ZONE ── */}
        {!data && (
          <div
            className={`upload-zone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="upload-icon">📂</div>
            <h2 className="upload-title">Upload Your CGM Data</h2>
            <p className="upload-sub">Drag & drop your CSV file here, or click to browse</p>
            <label className="upload-btn">
              Choose File
              <input type="file" accept=".csv" hidden onChange={(e) => handleFile(e.target.files[0])} />
            </label>
            <p className="upload-hint">
              Supports: timestamp, glucose_mg_dl, meal_taken, insulin_dose_units, exercise_minutes columns
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {analysis && clinical && (
          <>
            {/* Top bar */}
            <div className="dash-topbar">
              <div className="dash-file-info">
                <span className="dash-file-icon">📄</span>
                <span className="dash-file-name">{fileName}</span>
              </div>
              <label className="dash-reupload">
                Upload New File
                <input type="file" accept=".csv" hidden onChange={(e) => handleFile(e.target.files[0])} />
              </label>
            </div>

            {/* ── CLINICAL RISK SCORE BAR ── */}
            <div className="clinical-bar">
              <div className="clinical-bar-left">
                <span className="clinical-score-label">Clinical Risk Score</span>
                <span className="clinical-score-val" style={{ color: risk.color }}>
                  {clinical.score}<span>/100</span>
                </span>
              </div>
              <div className="clinical-track">
                <div
                  className="clinical-fill"
                  style={{
                    width: `${clinical.score}%`,
                    background: clinical.score >= 60 ? "#c0392b" : clinical.score >= 30 ? "#e67e22" : "#27ae60"
                  }}
                />
              </div>
              <button className="context-toggle" onClick={() => setShowPanel(p => !p)}>
                {showPanel ? "Hide Context Panel ↑" : "Add Clinical Context ↓"}
              </button>
            </div>

            {/* ── CONTEXT INPUT PANEL ── */}
            {showPanel && (
              <div className="context-panel">
                <p className="context-panel-title">Clinical Context — fills your risk score</p>
                <div className="context-grid">

                  {/* Hypo episodes */}
                  <div className="ctx-item">
                    <label className="ctx-label">Hypo Episodes (last 7 days)</label>
                    <div className="ctx-stepper">
                      <button onClick={() => updateCtx("hypoEpisodes", Math.max(0, ctx.hypoEpisodes - 1))}>−</button>
                      <span>{ctx.hypoEpisodes}</span>
                      <button onClick={() => updateCtx("hypoEpisodes", Math.min(10, ctx.hypoEpisodes + 1))}>+</button>
                    </div>
                  </div>

                  {/* Insulin on board */}
                  <div className="ctx-item">
                    <label className="ctx-label">💉 Insulin on Board (units)</label>
                    <div className="ctx-stepper">
                      <button onClick={() => updateCtx("insulinOnBoard", Math.max(0, ctx.insulinOnBoard - 1))}>−</button>
                      <span>{ctx.insulinOnBoard}u</span>
                      <button onClick={() => updateCtx("insulinOnBoard", Math.min(20, ctx.insulinOnBoard + 1))}>+</button>
                    </div>
                  </div>


                  {/* Sleep hours */}
                  <div className="ctx-item">
                    <label className="ctx-label"> Sleep Last Night (hours)</label>
                    <input
                      className="ctx-slider"
                      type="range" min="0" max="12" step="0.5"
                      value={ctx.sleepHours}
                      onChange={e => updateCtx("sleepHours", parseFloat(e.target.value))}
                    />
                    <span className="ctx-slider-val">{ctx.sleepHours}h {ctx.sleepHours < 6 ? "⚠️" : "✓"}</span>
                  </div>

                  {/* Stress level */}
                  <div className="ctx-item">
                    <label className="ctx-label">Stress Level</label>
                    <input
                      className="ctx-slider"
                      type="range" min="1" max="10" step="1"
                      value={ctx.stressLevel}
                      onChange={e => updateCtx("stressLevel", parseInt(e.target.value))}
                    />
                    <span className="ctx-slider-val">{ctx.stressLevel}/10 {ctx.stressLevel >= 8 ? "⚠️" : ""}</span>
                  </div>

                  {/* Heart rate override */}
                  <div className="ctx-item">
                    <label className="ctx-label">Heart Rate (bpm)</label>
                    <input
                      className="ctx-number"
                      type="number" min="40" max="200"
                      placeholder={analysis.lastHR ? `Auto: ${analysis.lastHR}` : "Enter bpm"}
                      value={ctx.heartRate ?? ""}
                      onChange={e => updateCtx("heartRate", e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>

                  {/* Skipped meal toggle */}
                  <div className="ctx-item ctx-toggle-item">
                    <label className="ctx-label">Insulin taken, no meal followed?</label>
                    <button
                      className={`ctx-toggle-btn ${ctx.skippedMeal ? "active" : ""}`}
                      onClick={() => updateCtx("skippedMeal", !ctx.skippedMeal)}
                    >
                      {ctx.skippedMeal ? "YES ⚠️" : "NO"}
                    </button>
                  </div>

                  {/* Alcohol toggle */}
                  <div className="ctx-item ctx-toggle-item">
                    <label className="ctx-label">Alcohol consumed today?</label>
                    <button
                      className={`ctx-toggle-btn ${ctx.alcoholConsumed ? "active" : ""}`}
                      onClick={() => updateCtx("alcoholConsumed", !ctx.alcoholConsumed)}
                    >
                      {ctx.alcoholConsumed ? "YES " : "NO"}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Main grid */}
            <div className="dash-grid">

              {/* ── LEFT COLUMN ── */}
              <div className="dash-left">

                {/* Risk badge */}
                <div className="card risk-card" style={{ background: risk.bg }}>
                  <p className="card-label">Current Risk Level</p>
                  <div
                    className={`risk-badge ${risk.pulse ? "risk-pulse" : ""}`}
                    style={{ color: risk.color, borderColor: risk.color }}
                  >
                    {risk.label}
                  </div>
                  <p className="risk-glucose">
                    Last reading: <strong>{analysis.glucose} mg/dL</strong>
                  </p>
                  <p className="risk-confidence" style={{ color: risk.color }}>
                    AI confidence: <strong>{effectiveConf}%</strong>
                  </p>
                  {analysis.minsToHypo && effectiveRisk !== "food_spike" && (
                    <p className="risk-prediction" style={{ color: risk.color }}>
                      ⚠️ Predicted crash in <strong>{analysis.minsToHypo} minutes</strong>
                    </p>
                  )}
                  {analysis.foodSpike && (
                    <p className="risk-prediction" style={{ color: "#2980b9" }}>
                      🍽️ Rise detected — likely food or exercise. No alert triggered.
                    </p>
                  )}
                </div>

                {/* Top risk drivers */}
                <div className="card explain-card">
                  <p className="card-label">Top Risk Drivers</p>
                  {clinical.drivers.length > 0 ? (
                    <ul className="explain-list">
                      {clinical.drivers.slice(0, 5).map((d, i) => (
                        <li key={i} className="explain-item">
                          <span className="explain-dot" />
                          {d.label}
                          <span className="driver-pts" style={{ color: risk.color }}>+{d.pts}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="explain-none">No risk factors detected.</p>
                  )}
                </div>

                {/* Food suggestion */}
                <div className="card food-card">
                  <p className="card-label"> Food Suggestion</p>
                  <p className="food-text">"{analysis.foodSuggestion}"</p>
                </div>

              </div>

              {/* ── CENTER: SOS BUTTON ── */}
              <div className="dash-center">
                <p className="sos-label">Emergency Alert</p>
                <button
                  className={`sos-btn ${sosSent ? "sos-sent" : ""} ${
                    effectiveRisk === "high" && !sosSent ? "sos-pulse" : ""
                  }`}
                  onClick={handleManualSOS}
                  disabled={sosSent}
                >
                  {sosSent ? "✓ SENT" : "SOS"}
                </button>
                <p className="sos-sub">
                  {sosSent
                    ? "Alert sent to your caregiver's mobile!"
                    : effectiveRisk === "high"
                    ? "Tap to alert caregiver NOW"
                    : "Tap to send emergency alert"}
                </p>
                {effectiveRisk === "high" && !sosSent && countdownDisplay && (
                  <div className="sos-countdown">
                    <p className="sos-countdown-label">Auto-alert fires in</p>
                    <p className="sos-countdown-timer">{countdownDisplay}</p>
                    <p className="sos-countdown-hint">Eat something to cancel the countdown</p>
                  </div>
                )}
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="dash-right">
                <div className="card chart-card">
                  <p className="card-label">Glucose Trend (Last 20 Readings)</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={analysis.recent}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e8" />
                      <XAxis
                        dataKey="timestamp"
                        tick={{ fontSize: 9 }}
                        tickFormatter={(v) => v.slice(11, 16)}
                        interval={3}
                      />
                      <YAxis domain={[40, 160]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val) => [`${val} mg/dL`, "Glucose"]}
                        labelFormatter={(l) => l.slice(11, 16)}
                      />
                      <ReferenceLine y={70} stroke="#c0392b" strokeDasharray="4 4"
                        label={{ value: "Hypo", fontSize: 10, fill: "#c0392b" }} />
                      <ReferenceLine y={80} stroke="#e67e22" strokeDasharray="4 4"
                        label={{ value: "Warn", fontSize: 10, fill: "#e67e22" }} />
                      <Line
                        type="monotone"
                        dataKey="glucose_mg_dl"
                        stroke="#76575D"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#76575D" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats row */}
                <div className="stats-row">
                  <div className="stat-card">
                    <p className="stat-val">
                      {Math.round(analysis.slope * 4)} <span>mg/dL</span>
                    </p>
                    <p className="stat-label">per hour trend</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-val">
                      {analysis.minsToHypo ?? "—"} <span>{analysis.minsToHypo ? "min" : ""}</span>
                    </p>
                    <p className="stat-label">predicted crash</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-val">{data.filter((r) => r.meal_taken === "1").length}</p>
                    <p className="stat-label">meals detected</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-val" style={{ color: risk.color }}>
                      {clinical.score}<span>/100</span>
                    </p>
                    <p className="stat-label">risk score</p>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}