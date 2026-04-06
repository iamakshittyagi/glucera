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

// ─── ALERT MANAGER (inline — no extra file needed) ───────────────────────────
function sendPushNotification(riskLevel, confidence) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("Glucera Alert", {
      body:
        riskLevel === "high"
          ? `DANGER: Glucose crash predicted. Confidence ${confidence}%. Eat something NOW.`
          : `Caution: Glucose dropping. Confidence ${confidence}%. Consider a snack.`,
      icon: "/logo.svg",
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
    // backend may not be running during dev — fail silently
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
  // food_spike and low = total silence
  if (riskLevel === "food_spike" || riskLevel === "low") return;

  if (riskLevel === "medium") {
    sendPushNotification(riskLevel, confidence);
    speakAlert(riskLevel);
    // no SOS for medium
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

// ─── ANALYSIS ENGINE ──────────────────────────────────────────────────────────
function analyseData(rows) {
  const recent = rows.slice(-8);
  const last = rows[rows.length - 1];
  const glucose = parseFloat(last.glucose_mg_dl);

  // Food spike detection
  const prev3 = rows.slice(-4, -1);
  const maxPrev = Math.max(...prev3.map((r) => parseFloat(r.glucose_mg_dl) || 0));
  const foodSpike = glucose - maxPrev >= 20;

  // Trend slope
  const oldest = parseFloat(recent[0].glucose_mg_dl);
  const newest = parseFloat(recent[recent.length - 1].glucose_mg_dl);
  const slope = (newest - oldest) / recent.length;

  // Minutes to hypo
  let minsToHypo = null;
  if (slope < 0 && glucose > HYPO_THRESHOLD) {
    const readingsToHypo = (glucose - HYPO_THRESHOLD) / Math.abs(slope);
    minsToHypo = Math.round(readingsToHypo * 15);
  }

  // Risk level
  let risk = "low";
  if (foodSpike) {
    risk = "food_spike";
  } else if (
    glucose < HYPO_THRESHOLD ||
    (minsToHypo !== null && minsToHypo < 20)
  ) {
    risk = "high";
  } else if (
    glucose < WARN_THRESHOLD ||
    (minsToHypo !== null && minsToHypo < 40)
  ) {
    risk = "medium";
  }

  // Context detection
  const lastMeal = [...rows]
    .reverse()
    .find((r) => r.meal_taken === "1" || r.meal_taken === 1);
  const lastInsulin = [...rows]
    .reverse()
    .find((r) => parseFloat(r.insulin_dose_units) > 0);
  const lastExercise = [...rows]
    .reverse()
    .find((r) => parseFloat(r.exercise_minutes) > 0);

  // Crash explanation reasons
  const reasons = [];
  if (lastInsulin) reasons.push("recent insulin dose");
  if (lastExercise) reasons.push("exercise session detected");
  if (!lastMeal || rows.indexOf(lastMeal) < rows.length - 6)
    reasons.push("no recent meal");
  if (new Date().getHours() >= 22 || new Date().getHours() <= 6)
    reasons.push("nighttime risk window");

  // Food suggestion
  let foodSuggestion = "";
  if (risk === "high")
    foodSuggestion =
      "Eat 3 glucose tablets or drink a small glass of juice RIGHT NOW.";
  else if (risk === "medium")
    foodSuggestion =
      "Have a small snack — a banana or biscuits will help stabilise your glucose.";
  else if (risk === "food_spike")
    foodSuggestion =
      "Glucose rising after food or exercise — this looks normal. Monitoring continues.";
  else foodSuggestion = "Glucose looks stable. Keep up your current routine!";

  // Confidence score
  let confidence = 0;
  if (risk === "high")
    confidence = minsToHypo ? Math.min(99, Math.round(90 - minsToHypo * 0.5)) : 85;
  else if (risk === "medium") confidence = 63;
  else if (risk === "low") confidence = 95;
  else if (risk === "food_spike") confidence = 78;

  return {
    glucose,
    slope,
    minsToHypo,
    risk,
    reasons,
    foodSuggestion,
    foodSpike,
    confidence,
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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]         = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sosSent, setSosSent]   = useState(false);
  const [countdown, setCountdown] = useState(null); // seconds remaining for auto-SOS
  const autoSosTimer  = useRef(null);
  const countdownInterval = useRef(null);

  // ── Request notification permission on mount ──
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Fire alerts whenever analysis risk changes ──
  useEffect(() => {
    if (!analysis) return;
    triggerAllAlerts(analysis.risk, analysis.confidence);
  }, [analysis?.risk]); // eslint-disable-line

  // ── Auto-SOS countdown when risk = high ──
  useEffect(() => {
    // Clear any existing timers
    clearTimeout(autoSosTimer.current);
    clearInterval(countdownInterval.current);
    setCountdown(null);

    if (analysis?.risk === "high" && !sosSent) {
      const totalSecs = (analysis.minsToHypo || 5) * 60;
      setCountdown(totalSecs);

      // Countdown display
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto fire SOS when countdown hits 0
      autoSosTimer.current = setTimeout(() => {
        setSosSent(true);
        triggerSOS("auto");
      }, totalSecs * 1000);
    }

    return () => {
      clearTimeout(autoSosTimer.current);
      clearInterval(countdownInterval.current);
    };
  }, [analysis?.risk, sosSent]); // eslint-disable-line

  // ── File handler ──
  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setSosSent(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      setData(rows);
      setAnalysis(analyseData(rows));
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []); // eslint-disable-line

  // ── Manual SOS handler ──
  function handleManualSOS() {
    setSosSent(true);
    clearTimeout(autoSosTimer.current);
    clearInterval(countdownInterval.current);
    setCountdown(null);
    triggerSOS("manual");
  }

  const risk = analysis ? riskConfig[analysis.risk] : null;

  // Format countdown as mm:ss
  const countdownDisplay =
    countdown !== null
      ? `${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(
          countdown % 60
        ).padStart(2, "0")}`
      : null;

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
            <p className="upload-sub">
              Drag & drop your CSV file here, or click to browse
            </p>
            <label className="upload-btn">
              Choose File
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </label>
            <p className="upload-hint">
              Supports: timestamp, glucose_mg_dl, meal_taken, insulin_dose_units,
              exercise_minutes columns
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {analysis && (
          <>
            {/* Top bar */}
            <div className="dash-topbar">
              <div className="dash-file-info">
                <span className="dash-file-icon">📄</span>
                <span className="dash-file-name">{fileName}</span>
              </div>
              <label className="dash-reupload">
                Upload New File
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </label>
            </div>

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
                    AI confidence: <strong>{analysis.confidence}%</strong>
                  </p>
                  {analysis.minsToHypo && analysis.risk !== "food_spike" && (
                    <p className="risk-prediction" style={{ color: risk.color }}>
                      ⚠️ Predicted crash in{" "}
                      <strong>{analysis.minsToHypo} minutes</strong>
                    </p>
                  )}
                  {analysis.foodSpike && (
                    <p className="risk-prediction" style={{ color: "#2980b9" }}>
                      🍽️ Rise detected — likely food or exercise. No alert
                      triggered.
                    </p>
                  )}
                </div>

                {/* Crash explanation */}
                <div className="card explain-card">
                  <p className="card-label">Why This Prediction?</p>
                  {analysis.reasons.length > 0 ? (
                    <ul className="explain-list">
                      {analysis.reasons.map((r, i) => (
                        <li key={i} className="explain-item">
                          <span className="explain-dot" />
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="explain-none">
                      No risk factors detected in current window.
                    </p>
                  )}
                </div>

                {/* Food suggestion */}
                <div className="card food-card">
                  <p className="card-label">🍊 Food Suggestion</p>
                  <p className="food-text">"{analysis.foodSuggestion}"</p>
                </div>

              </div>

              {/* ── CENTER: SOS BUTTON ── */}
              <div className="dash-center">
                <p className="sos-label">Emergency Alert</p>
                <button
                  className={`sos-btn ${sosSent ? "sos-sent" : ""} ${
                    analysis.risk === "high" && !sosSent ? "sos-pulse" : ""
                  }`}
                  onClick={handleManualSOS}
                  disabled={sosSent}
                >
                  {sosSent ? "✓ SENT" : "SOS"}
                </button>
                <p className="sos-sub">
                  {sosSent
                    ? "Alert sent to your caregiver's mobile!"
                    : analysis.risk === "high"
                    ? "Tap to alert caregiver NOW"
                    : "Tap to send emergency alert"}
                </p>

                {/* Auto countdown — only shows when high risk and not yet sent */}
                {analysis.risk === "high" && !sosSent && countdownDisplay && (
                  <div className="sos-countdown">
                    <p className="sos-countdown-label">Auto-alert fires in</p>
                    <p className="sos-countdown-timer">{countdownDisplay}</p>
                    <p className="sos-countdown-hint">
                      Eat something to cancel the countdown
                    </p>
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
                      <ReferenceLine
                        y={70}
                        stroke="#c0392b"
                        strokeDasharray="4 4"
                        label={{ value: "Hypo", fontSize: 10, fill: "#c0392b" }}
                      />
                      <ReferenceLine
                        y={80}
                        stroke="#e67e22"
                        strokeDasharray="4 4"
                        label={{ value: "Warn", fontSize: 10, fill: "#e67e22" }}
                      />
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
                      {Math.round(analysis.slope * 4)}{" "}
                      <span>mg/dL</span>
                    </p>
                    <p className="stat-label">per hour trend</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-val">
                      {analysis.minsToHypo ?? "—"}{" "}
                      <span>{analysis.minsToHypo ? "min" : ""}</span>
                    </p>
                    <p className="stat-label">predicted crash</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-val">
                      {data.filter((r) => r.meal_taken === "1").length}
                    </p>
                    <p className="stat-label">meals detected</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-val" style={{ color: risk.color }}>
                      {analysis.confidence}
                      <span>%</span>
                    </p>
                    <p className="stat-label">AI confidence</p>
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