import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from "recharts";
import Navbar from "../components/Navbar";
import "./Dashboard.css";
import FileIcon from "../assets/Icons/GLUCERAFILE.png";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const API_URL        = "https://glucera.onrender.com";
const HYPO_THRESHOLD = 70;
const WARN_THRESHOLD = 80;

// ─── ALERT MANAGER ───────────────────────────────────────────────────────────
function sendPushNotification(riskLevel, confidence) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("Glucera Alert", {
      body:
        riskLevel === "high"
          ? `DANGER: Glucose crash predicted. Confidence ${Math.round(confidence * 100)}%. Eat something NOW.`
          : `Caution: Glucose dropping. Confidence ${Math.round(confidence * 100)}%. Consider a snack.`,
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
  utterance.rate  = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

async function sendSOSToBackend(trigger, coords) {
  try {
    await fetch(`${API_URL}/sos`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger,
        latitude:  coords?.latitude  ?? null,
        longitude: coords?.longitude ?? null,
        mapsLink:  coords
          ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
          : null,
        time:    new Date().toISOString(),
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
      ()    => sendSOSToBackend(trigger, null)
    );
  } else {
    sendSOSToBackend(trigger, null);
  }
}

async function notifyCaregiver(riskLevel, confidence) {
  try {
    await fetch(`${API_URL}/alert-caregiver`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        risk:       riskLevel,
        confidence,
        time:       new Date().toLocaleTimeString(),
      }),
    });
  } catch {
    console.warn("Caregiver alert backend unreachable.");
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
  }
}

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines   = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    const obj  = {};
    headers.forEach((h, i) => (obj[h] = vals[i]?.trim() ?? ""));
    return obj;
  });
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
  hypoEpisodes:    0,
  insulinOnBoard:  0,
  sleepHours:      7,
  stressLevel:     3,
  heartRate:       null,
  skippedMeal:     false,
  alcoholConsumed: false,
};

// ─────────────────────────────────────────────────────────────────
// CRASH WARNING POPUP
// Shows when risk = high. Counts down 3 seconds, then fires SOS.
// Patient can hit "I'm OK" to dismiss and cancel SOS.
// ─────────────────────────────────────────────────────────────────
function CrashPopup({ prediction, onDismiss, onSOS }) {
  const [tick, setTick] = useState(3);

  useEffect(() => {
    if (tick <= 0) {
      onSOS();
      return;
    }
    const t = setTimeout(() => setTick((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [tick]); // eslint-disable-line

  return (
    <div className="popup-overlay">
      <div className="popup-box">

        {/* Pulsing danger icon */}
        <div className="popup-icon-ring">
          <span className="popup-icon">⚠️</span>
        </div>

        <h2 className="popup-title">Glucose Crash Predicted</h2>

        <div className="popup-stats">
          <div className="popup-stat">
            <span className="popup-stat-val" style={{ color: "#c0392b" }}>
              {prediction.current_glucose}
            </span>
            <span className="popup-stat-label">mg/dL now</span>
          </div>
          {prediction.crash_in_minutes && (
            <div className="popup-stat">
              <span className="popup-stat-val" style={{ color: "#c0392b" }}>
                ~{prediction.crash_in_minutes}
              </span>
              <span className="popup-stat-label">min to crash</span>
            </div>
          )}
          {prediction.estimated_floor && (
            <div className="popup-stat">
              <span className="popup-stat-val" style={{ color: "#e67e22" }}>
                {prediction.estimated_floor}
              </span>
              <span className="popup-stat-label">est. floor mg/dL</span>
            </div>
          )}
        </div>

        <p className="popup-suggestion">{prediction.food_suggestion}</p>

        {/* Countdown ring */}
        <div className="popup-countdown-wrap">
          <svg className="popup-countdown-svg" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#f0e8e8" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#c0392b"
              strokeWidth="6"
              strokeDasharray={`${(tick / 3) * 213.6} 213.6`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dasharray 0.9s linear" }}
            />
          </svg>
          <span className="popup-countdown-num">{tick}</span>
        </div>
        <p className="popup-countdown-label">SOS fires in {tick} second{tick !== 1 ? "s" : ""}</p>

        {/* Action buttons */}
        <div className="popup-actions">
          <button className="popup-btn-dismiss" onClick={onDismiss}>
            ✓ I'm OK — Cancel SOS
          </button>
          <button className="popup-btn-sos" onClick={onSOS}>
            🚨 Send SOS Now
          </button>
        </div>

        <p className="popup-confidence">
          AI confidence: <strong>{Math.round(prediction.confidence * 100)}%</strong>
        </p>
      </div>
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data,        setData]        = useState(null);
  const [rows,        setRows]        = useState([]);
  const [fileName,    setFileName]    = useState("");
  const [prediction,  setPrediction]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [sosSent,     setSosSent]     = useState(false);
  const [countdown,   setCountdown]   = useState(null);
  const [ctx,         setCtx]         = useState(defaultCtx);
  const [showPanel,   setShowPanel]   = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const [apiError,    setApiError]    = useState(null);
  const [showPopup,   setShowPopup]   = useState(false);
  const [popupShown,  setPopupShown]  = useState(false); // only show once per risk event

  const autoSosTimer      = useRef(null);
  const countdownInterval = useRef(null);
  const prevRisk          = useRef(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ─── CALL BACKEND ──────────────────────────────────────────────
  const callBackend = useCallback(async (csvRows, context) => {
    if (!csvRows || csvRows.length < 2) return;
    setLoading(true);
    setApiError(null);

    try {
      const glucoseArray   = csvRows.map((r) => parseFloat(r.glucose_mg_dl)).filter((v) => !isNaN(v));
      const mealArray      = csvRows.map((r) => (r.meal_taken === "1" || r.meal_taken === 1 ? 1 : 0));
      const exerciseArray  = csvRows.map((r) => (parseFloat(r.exercise_minutes) > 0 ? 1 : 0));
      const lastRow        = csvRows[csvRows.length - 1];
      const csvHeartRate   = parseFloat(lastRow?.heart_rate);
      const heartRate      = context.heartRate ?? (isNaN(csvHeartRate) ? 72 : csvHeartRate);

      const payload = {
        glucose:          glucoseArray,
        meal_array:       mealArray,
        exercise_array:   exerciseArray,
        heart_rate:       heartRate,
        insulin_on_board: context.insulinOnBoard,
        hypo_episodes:    context.hypoEpisodes,
        sleep_hours:      context.sleepHours,
        stress_level:     context.stressLevel,
        alcohol_consumed: context.alcoholConsumed ? 1 : 0,
        skipped_meal:     context.skippedMeal     ? 1 : 0,
      };

      const res = await fetch(`${API_URL}/predict`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const result = await res.json();
      setPrediction(result);

      // Show popup ONLY when risk transitions to high for the first time
      if (result.risk === "high" && prevRisk.current !== "high") {
        setShowPopup(true);
        setPopupShown(true);
        triggerAllAlerts(result.risk, result.confidence);
      } else if (result.risk !== "high") {
        setShowPopup(false);
        setPopupShown(false);
      }
      prevRisk.current = result.risk;

    } catch (err) {
      console.error("Predict error:", err);
      setApiError("Could not reach backend. Showing local analysis.");

      const glucoseArray = csvRows.map((r) => parseFloat(r.glucose_mg_dl)).filter((v) => !isNaN(v));
      const current      = glucoseArray[glucoseArray.length - 1];
      const rate         = glucoseArray.length >= 2
        ? (glucoseArray[glucoseArray.length - 1] - glucoseArray[glucoseArray.length - 2]) / 15
        : 0;
      const tth = rate < 0 ? Math.min(120, (current - 70) / Math.abs(rate)) : null;
      const risk = current < 70 ? "high" : current < 85 ? "medium" : "low";

      const fallback = {
        risk,
        confidence:         current < 70 ? 0.88 : 0.65,
        current_glucose:    current,
        trend:              Math.round(rate * 60),
        crash_predicted:    tth !== null && tth < 60,
        crash_in_minutes:   tth ? Math.round(tth) : null,
        estimated_floor:    Math.round(current + rate * 30),
        food_suggestion:    current < 70
          ? "Eat 3 glucose tablets or drink 150ml of juice IMMEDIATELY."
          : current < 90
          ? "Have a small snack — a banana or handful of crackers."
          : "Glucose looks stable. Keep up your current routine!",
        class_probabilities: {},
      };
      setPrediction(fallback);

      if (risk === "high" && prevRisk.current !== "high") {
        setShowPopup(true);
        triggerAllAlerts(risk, fallback.confidence);
      }
      prevRisk.current = risk;
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-call backend when context changes
  useEffect(() => {
    if (rows.length >= 2) callBackend(rows, ctx);
  }, [ctx]); // eslint-disable-line

  // ─── SOS COUNTDOWN (post-popup, after patient dismisses) ───────
  useEffect(() => {
    clearTimeout(autoSosTimer.current);
    clearInterval(countdownInterval.current);
    setCountdown(null);

    if (prediction?.risk === "high" && !sosSent && !showPopup) {
      const totalSecs = (prediction.crash_in_minutes || 5) * 60;
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
  }, [prediction?.risk, sosSent, showPopup]); // eslint-disable-line

  // ─── FILE HANDLER ───────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    setSosSent(false);
    setPrediction(null);
    setApiError(null);
    setShowPopup(false);
    setPopupShown(false);
    prevRisk.current = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      setData(parsed);
      setRows(parsed);
      setShowPanel(true);
      callBackend(parsed, ctx);
    };
    reader.readAsText(file);
  }, [ctx, callBackend]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ─── POPUP HANDLERS ────────────────────────────────────────────
  function handlePopupDismiss() {
    // Patient says they're OK — close popup, don't fire SOS
    setShowPopup(false);
    setSosSent(false); // reset so the dashboard SOS button still works
  }

  function handlePopupSOS() {
    setShowPopup(false);
    setSosSent(true);
    clearTimeout(autoSosTimer.current);
    clearInterval(countdownInterval.current);
    setCountdown(null);
    triggerSOS("popup_auto");
    notifyCaregiver(prediction?.risk, prediction?.confidence);
  }

  function handleManualSOS() {
    setSosSent(true);
    setShowPopup(false);
    clearTimeout(autoSosTimer.current);
    clearInterval(countdownInterval.current);
    setCountdown(null);
    triggerSOS("manual");
  }

  const updateCtx = (key, val) => setCtx((prev) => ({ ...prev, [key]: val }));

  // ─── DERIVED VALUES ─────────────────────────────────────────────
  const risk          = prediction ? (riskConfig[prediction.risk] ?? riskConfig.low) : null;
  const confidencePct = prediction ? Math.round(prediction.confidence * 100) : null;
  const recentReadings = rows.slice(-20);
  const countdownDisplay = countdown !== null
    ? `${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`
    : null;
  const clinicalScore = prediction
    ? prediction.risk === "high"
      ? Math.round(60 + prediction.confidence * 40)
      : prediction.risk === "medium"
      ? Math.round(30 + prediction.confidence * 30)
      : Math.round(prediction.confidence * 30)
    : 0;

  return (
    <div className="dash-page">
      <Navbar />

      {/* ── CRASH WARNING POPUP ── */}
      {showPopup && prediction && (
        <CrashPopup
          prediction={prediction}
          onDismiss={handlePopupDismiss}
          onSOS={handlePopupSOS}
        />
      )}

      <div className="dash-container">

        {/* ── UPLOAD ZONE ── */}
        {!data && (
          <div
            className={`upload-zone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="upload-icon">
  <img src={FileIcon} alt="file" style={{ width: 100, height: 100, objectFit: "contain" }} />
</div>
            <h2 className="upload-title">Upload Your CGM Data</h2>
            <p className="upload-sub">Drag & drop your CSV file here, or click to browse</p>
            <label className="upload-btn">
              Choose File
              <input type="file" accept=".csv" hidden onChange={(e) => handleFile(e.target.files[0])} />
            </label>
            <p className="upload-hint">
              Supports: timestamp, glucose_mg_dl, meal_taken, insulin_dose_units, exercise_minutes, heart_rate columns
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {data && (
          <>
            {/* Top bar */}
            <div className="dash-topbar">
              <div className="dash-file-info">
                <img src={FileIcon} alt="file" className="dash-file-icon" style={{ width: 20, height: 20, objectFit: "contain" }} />
                <span className="dash-file-name">{fileName}</span>
                {loading && <span className="dash-loading-pill">⏳ Analysing…</span>}
                {apiError && <span className="dash-error-pill">⚠️ {apiError}</span>}
              </div>
              <label className="dash-reupload">
                Upload New File
                <input type="file" accept=".csv" hidden onChange={(e) => handleFile(e.target.files[0])} />
              </label>
            </div>

            {prediction && (
              <>
                {/* ── CLINICAL RISK SCORE BAR ── */}
                <div className="clinical-bar">
                  <div className="clinical-bar-left">
                    <span className="clinical-score-label">Clinical Risk Score</span>
                    <span className="clinical-score-val" style={{ color: risk.color }}>
                      {clinicalScore}<span>/100</span>
                    </span>
                  </div>
                  <div className="clinical-track">
                    <div
                      className="clinical-fill"
                      style={{
                        width:      `${clinicalScore}%`,
                        background: clinicalScore >= 60 ? "#c0392b" : clinicalScore >= 30 ? "#e67e22" : "#27ae60",
                      }}
                    />
                  </div>
                  <button className="context-toggle" onClick={() => setShowPanel((p) => !p)}>
                    {showPanel ? "Hide Context Panel ↑" : "Add Clinical Context ↓"}
                  </button>
                </div>

                {/* ── CONTEXT INPUT PANEL ── */}
                {showPanel && (
                  <div className="context-panel">
                    <p className="context-panel-title">Clinical Context — fills your risk score</p>
                    <div className="context-grid">

                      <div className="ctx-item">
                        <label className="ctx-label">🔴 Hypo Episodes (last 7 days)</label>
                        <div className="ctx-stepper">
                          <button onClick={() => updateCtx("hypoEpisodes", Math.max(0, ctx.hypoEpisodes - 1))}>−</button>
                          <span>{ctx.hypoEpisodes}</span>
                          <button onClick={() => updateCtx("hypoEpisodes", Math.min(10, ctx.hypoEpisodes + 1))}>+</button>
                        </div>
                      </div>

                      <div className="ctx-item">
                        <label className="ctx-label">💉 Insulin on Board (units)</label>
                        <div className="ctx-stepper">
                          <button onClick={() => updateCtx("insulinOnBoard", Math.max(0, ctx.insulinOnBoard - 1))}>−</button>
                          <span>{ctx.insulinOnBoard}u</span>
                          <button onClick={() => updateCtx("insulinOnBoard", Math.min(20, ctx.insulinOnBoard + 1))}>+</button>
                        </div>
                      </div>

                      <div className="ctx-item">
                        <label className="ctx-label">😴 Sleep Last Night (hours)</label>
                        <input
                          className="ctx-slider" type="range" min="0" max="12" step="0.5"
                          value={ctx.sleepHours}
                          onChange={(e) => updateCtx("sleepHours", parseFloat(e.target.value))}
                        />
                        <span className="ctx-slider-val">{ctx.sleepHours}h {ctx.sleepHours < 6 ? "⚠️" : "✓"}</span>
                      </div>

                      <div className="ctx-item">
                        <label className="ctx-label">🧠 Stress Level</label>
                        <input
                          className="ctx-slider" type="range" min="1" max="10" step="1"
                          value={ctx.stressLevel}
                          onChange={(e) => updateCtx("stressLevel", parseInt(e.target.value))}
                        />
                        <span className="ctx-slider-val">{ctx.stressLevel}/10 {ctx.stressLevel >= 8 ? "⚠️" : ""}</span>
                      </div>

                      <div className="ctx-item">
                        <label className="ctx-label">❤️ Heart Rate (bpm)</label>
                        <input
                          className="ctx-number" type="number" min="40" max="200"
                          placeholder={`Auto: ${rows[rows.length - 1]?.heart_rate ?? 72}`}
                          value={ctx.heartRate ?? ""}
                          onChange={(e) => updateCtx("heartRate", e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>

                      <div className="ctx-item ctx-toggle-item">
                        <label className="ctx-label">💊 Insulin taken, no meal followed?</label>
                        <button
                          className={`ctx-toggle-btn ${ctx.skippedMeal ? "active" : ""}`}
                          onClick={() => updateCtx("skippedMeal", !ctx.skippedMeal)}
                        >
                          {ctx.skippedMeal ? "YES ⚠️" : "NO"}
                        </button>
                      </div>

                      <div className="ctx-item ctx-toggle-item">
                        <label className="ctx-label">🍺 Alcohol consumed today?</label>
                        <button
                          className={`ctx-toggle-btn ${ctx.alcoholConsumed ? "active" : ""}`}
                          onClick={() => updateCtx("alcoholConsumed", !ctx.alcoholConsumed)}
                        >
                          {ctx.alcoholConsumed ? "YES ⚠️" : "NO"}
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* ── MAIN GRID ── */}
                <div className="dash-grid">

                  {/* ── LEFT COLUMN ── */}
                  <div className="dash-left">

                    <div className="card risk-card" style={{ background: risk.bg }}>
                      <p className="card-label">Current Risk Level</p>
                      <div
                        className={`risk-badge ${risk.pulse ? "risk-pulse" : ""}`}
                        style={{ color: risk.color, borderColor: risk.color }}
                      >
                        {risk.label}
                      </div>
                      <p className="risk-glucose">
                        Last reading: <strong>{prediction.current_glucose} mg/dL</strong>
                      </p>
                      <p className="risk-confidence" style={{ color: risk.color }}>
                        AI confidence: <strong>{confidencePct}%</strong>
                      </p>

                      {prediction.crash_predicted && prediction.crash_in_minutes && (
                        <div className="crash-prediction-box" style={{ borderColor: risk.color }}>
                          <p className="crash-prediction-label" style={{ color: risk.color }}>
                            ⚠️ Crash predicted in
                          </p>
                          <p className="crash-prediction-time" style={{ color: risk.color }}>
                            ~{prediction.crash_in_minutes} min
                          </p>
                          {prediction.estimated_floor && (
                            <p className="crash-prediction-floor">
                              Estimated floor: <strong>{prediction.estimated_floor} mg/dL</strong>
                            </p>
                          )}
                        </div>
                      )}

                      {prediction.risk === "high" && !showPopup && (
                        <button
                          className="popup-reopen-btn"
                          onClick={() => setShowPopup(true)}
                        >
                          ⚠️ View Warning Again
                        </button>
                      )}

                      {prediction.risk === "food_spike" && (
                        <p className="risk-prediction" style={{ color: "#2980b9" }}>
                          🍽️ Rise detected — likely food or exercise. No alert triggered.
                        </p>
                      )}
                    </div>

                    <div className="card explain-card">
                      <p className="card-label">Prediction Signals</p>
                      <ul className="explain-list">
                        <li className="explain-item">
                          <span className="explain-dot" />
                          Glucose trend:
                          <strong style={{ marginLeft: 4 }}>
                            {prediction.trend > 0 ? "+" : ""}{prediction.trend} mg/dL/hr
                          </strong>
                        </li>
                        <li className="explain-item">
                          <span className="explain-dot" />
                          Rate of change:
                          <strong style={{ marginLeft: 4 }}>
                            {prediction.rate_of_change > 0 ? "+" : ""}
                            {(prediction.rate_of_change * 60).toFixed(1)} mg/dL/hr
                          </strong>
                        </li>
                        {prediction.time_to_hypo_min && (
                          <li className="explain-item">
                            <span className="explain-dot" style={{ background: "#c0392b" }} />
                            Time to hypo threshold:
                            <strong style={{ marginLeft: 4, color: "#c0392b" }}>
                              ~{prediction.time_to_hypo_min} min
                            </strong>
                          </li>
                        )}
                        {prediction.estimated_floor && (
                          <li className="explain-item">
                            <span className="explain-dot" style={{ background: "#e67e22" }} />
                            Projected glucose floor:
                            <strong style={{ marginLeft: 4, color: "#e67e22" }}>
                              {prediction.estimated_floor} mg/dL
                            </strong>
                          </li>
                        )}
                        {prediction.class_probabilities &&
                          Object.entries(prediction.class_probabilities).map(([cls, prob]) => (
                            <li key={cls} className="explain-item">
                              <span className="explain-dot" style={{
                                background: cls === "high" ? "#c0392b" : cls === "medium" ? "#e67e22" : "#27ae60",
                              }} />
                              {cls.charAt(0).toUpperCase() + cls.slice(1)} risk probability:
                              <span className="driver-pts" style={{
                                color: cls === "high" ? "#c0392b" : cls === "medium" ? "#e67e22" : "#27ae60",
                              }}>
                                {Math.round(prob * 100)}%
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div className="card food-card">
                      <p className="card-label">🍎 Food Suggestion</p>
                      <p className="food-text">"{prediction.food_suggestion}"</p>
                      {prediction.safe_to_sleep && (
                        <p className="food-text" style={{ marginTop: 10, fontStyle: "normal", fontSize: "0.85rem", color: "#666" }}>
                          {prediction.safe_to_sleep}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* ── CENTER: SOS BUTTON ── */}
                  <div className="dash-center">
                    <p className="sos-label">Emergency Alert</p>
                    <button
                      className={`sos-btn ${sosSent ? "sos-sent" : ""} ${
                        prediction.risk === "high" && !sosSent ? "sos-pulse" : ""
                      }`}
                      onClick={handleManualSOS}
                      disabled={sosSent}
                    >
                      {sosSent ? "✓ SENT" : "SOS"}
                    </button>
                    <p className="sos-sub">
                      {sosSent
                        ? "Alert sent to your caregiver's mobile!"
                        : prediction.risk === "high"
                        ? "Tap to alert caregiver NOW"
                        : "Tap to send emergency alert"}
                    </p>
                    {prediction.risk === "high" && !sosSent && countdownDisplay && (
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
                          data={recentReadings}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e8" />
                          <XAxis
                            dataKey="timestamp"
                            tick={{ fontSize: 9 }}
                            tickFormatter={(v) => v.slice(11, 16)}
                            interval={3}
                          />
                          <YAxis domain={[40, 220]} tick={{ fontSize: 10 }} />
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

                    <div className="stats-row">
                      <div className="stat-card">
                        <p className="stat-val">
                          {prediction.trend > 0 ? "+" : ""}{prediction.trend}
                          <span> mg/hr</span>
                        </p>
                        <p className="stat-label">per hour trend</p>
                      </div>
                      <div className="stat-card">
                        <p className="stat-val" style={{ color: prediction.crash_predicted ? "#c0392b" : undefined }}>
                          {prediction.crash_in_minutes ?? "—"}
                          <span>{prediction.crash_in_minutes ? " min" : ""}</span>
                        </p>
                        <p className="stat-label">crash prediction</p>
                      </div>
                      <div className="stat-card">
                        <p className="stat-val">
                          {prediction.estimated_floor ?? "—"}
                          <span>{prediction.estimated_floor ? " mg" : ""}</span>
                        </p>
                        <p className="stat-label">glucose floor</p>
                      </div>
                      <div className="stat-card">
                        <p className="stat-val" style={{ color: risk.color }}>
                          {clinicalScore}<span>/100</span>
                        </p>
                        <p className="stat-label">risk score</p>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}

            {loading && !prediction && (
              <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
                <p style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</p>
                <p style={{ color: "#76575D", fontWeight: 600 }}>Analysing your glucose data…</p>
                <p style={{ color: "#aaa", fontSize: "0.85rem" }}>Connecting to Glucera AI backend</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}