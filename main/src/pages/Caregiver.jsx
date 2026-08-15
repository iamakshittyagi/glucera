import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import DemoBanner from "../components/DemoBanner";
import "./Caregiver.css";
import { API_URL, apiJson, apiPostQuiet } from "../utils/backend";
import { startDemoStream, readingToAlert } from "../utils/demoEngine";

// How long to wait for the live socket before running the local simulation.
const SOCKET_GRACE_MS = 10000;

// Fires the browser notification + spoken alert. Depends on no component
// state, so it lives at module scope and is safe to call from any callback.
function fireAlerts(data) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🚨 Glucera Emergency", {
      body: `Patient glucose: ${data.glucose} mg/dL — CRITICAL. Immediate action needed.`,
      icon: "/favicon.png",
      requireInteraction: true,
    });
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
      `Emergency. Patient glucose is critically low at ${data.glucose} milligrams per deciliter. Immediate response required.`
    );
    msg.rate = 0.9;
    msg.volume = 1.0;
    window.speechSynthesis.speak(msg);
  }
}

export default function Caregiver() {
  const [status,    setStatus]    = useState("watching");
  const [alert,     setAlert]     = useState(null);
  const socketRef = useRef(null);
  const prevRisk  = useRef(null);

  const applyAlert = useCallback((data) => {
    if (!data) return;
    setAlert(data);

    if (data.risk === "high") {
      setStatus("alert");
      // Only announce on the transition into high — otherwise a 3s feed would
      // restart the siren and the speech on every single tick.
      if (prevRisk.current !== "high") fireAlerts(data);
    } else if (data.risk === "medium") {
      setStatus("medium");
    } else {
      // low or null — patient is safe / recovered
      setStatus(data.glucose ? "safe" : "watching");
    }
    prevRisk.current = data.risk;
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    let stopDemo = null;

    const startDemo = () => {
      if (stopDemo) return;
      stopDemo = startDemoStream((reading) => applyAlert(readingToAlert(reading)), 4000);
    };

    const stopDemoFeed = () => {
      if (!stopDemo) return;
      stopDemo();
      stopDemo = null;
    };

    // ── Snapshot of current state (REST) ──────────────────────────
    apiJson("/latest-alert").then(applyAlert).catch(() => {});

    // ── Live WebSocket ────────────────────────────────────────────
    const socket = io(API_URL, {
      transports: ["websocket"],
      timeout: 8000,
      reconnectionAttempts: 4,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      stopDemoFeed();          // real data wins the moment it arrives
      socket.emit("caregiver_join");
    });
    socket.on("alert_update", applyAlert);

    // ── Demo fallback if the socket never comes up ────────────────
    const graceTimer = setTimeout(() => {
      if (!socket.connected) startDemo();
    }, SOCKET_GRACE_MS);

    return () => {
      clearTimeout(graceTimer);
      socket.disconnect();
      if (stopDemo) stopDemo();
    };
  }, [applyAlert]);

  // ── Manual reset button ───────────────────────────────────────
  async function handleReset() {
    await apiPostQuiet("/reset-alert");   // optimistic — never blocks the UI
    setStatus("safe");
    prevRisk.current = "low";
    setAlert({ risk: "low", glucose: null, timestamp: new Date().toLocaleTimeString(), message: "Manually marked as safe." });
  }

  const cfgMap = {
    watching: { color: "#76575D", bg: "#f9f5f5", label: "Monitoring Patient" },
    safe:     { color: "#27ae60", bg: "#f0faf4", label: "Patient is Safe"    },
    medium:   { color: "#e67e22", bg: "#fef9f0", label: "Caution"            },
    alert:    { color: "#c0392b", bg: "#fdf0ef", label: "EMERGENCY"          },
  };
  const cfg = cfgMap[status] || cfgMap.watching;

  return (
    <div className="cg-page">
      <Navbar />
      <DemoBanner />
      <div className="cg-container">

        {/* ── STATUS CARD ── */}
        <div className="cg-status-card" style={{ background: cfg.bg, borderColor: cfg.color }}>
          <h1 className="cg-status-label" style={{ color: cfg.color }}>{cfg.label}</h1>

          {alert?.glucose && (
            <p className="cg-glucose" style={{ color: cfg.color }}>
              {alert.glucose} <span>mg/dL</span>
            </p>
          )}

          {alert?.message && (
            <div className="cg-message" style={{ borderColor: `${cfg.color}33` }}>
              <p className="cg-message-text" style={{ color: cfg.color }}>{alert.message}</p>
              {alert.timestamp && <p className="cg-message-time">at {alert.timestamp}</p>}
            </div>
          )}

          {/* ── Mark as safe button (shown after alert) ── */}
          {(status === "alert" || status === "medium") && (
            <button className="cg-safe-btn" onClick={handleReset}>
              &#10003; Mark Patient as Safe
            </button>
          )}
        </div>

        <p className="cg-hint">
          Alerts arrive instantly &middot; No refresh needed &middot; Keep this tab open
        </p>
      </div>
    </div>
  );
}
