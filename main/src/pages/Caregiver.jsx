import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import DemoBanner from "../components/DemoBanner";
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
  const [connected, setConnected] = useState(false);
  const [demoFeed,  setDemoFeed]  = useState(false);
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
      setDemoFeed(true);
      stopDemo = startDemoStream((reading) => applyAlert(readingToAlert(reading)), 4000);
    };

    const stopDemoFeed = () => {
      if (!stopDemo) return;
      stopDemo();
      stopDemo = null;
      setDemoFeed(false);
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
      setConnected(true);
      stopDemoFeed();          // real data wins the moment it arrives
      socket.emit("caregiver_join");
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
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
    watching: { color: "#76575D", bg: "#f9f5f5", icon: "", label: "Monitoring Patient"  },
    safe:     { color: "#27ae60", bg: "#f0faf4", icon: "", label: "Patient is Safe"      },
    medium:   { color: "#e67e22", bg: "#fef9f0", icon: "", label: "Caution"             },
    alert:    { color: "#c0392b", bg: "#fdf0ef", icon: "", label: "EMERGENCY"           },
  };
  const cfg = cfgMap[status] || cfgMap.watching;

  return (
    <div style={{ minHeight: "100vh", background: "#f0eaeb", fontFamily: "'Aldrich', sans-serif" }}>
      <Navbar />
      <DemoBanner />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 20px 32px" }}>

        {/* ── STATUS CARD ── */}
        <div style={{
          background: cfg.bg,
          border: `2px solid ${cfg.color}`,
          borderRadius: 24,
          padding: "40px 32px",
          textAlign: "center",
          marginBottom: 20,
          transition: "all 0.4s ease",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{cfg.icon}</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: cfg.color, marginBottom: 8 }}>
            {cfg.label}
          </h1>

          {alert?.glucose && (
            <p style={{ fontSize: 40, fontWeight: 800, color: cfg.color, margin: "16px 0 4px" }}>
              {alert.glucose} <span style={{ fontSize: 16, color: "#aaa" }}>mg/dL</span>
            </p>
          )}

          {alert?.message && (
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
              border: `1px solid ${cfg.color}33`,
            }}>
              <p style={{ color: cfg.color, fontWeight: 600, fontSize: 14, margin: 0 }}>
                {alert.message}
              </p>
              {alert.timestamp && (
                <p style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>at {alert.timestamp}</p>
              )}
            </div>
          )}

          {/* ── Mark as safe button (shown after alert) ── */}
          {(status === "alert" || status === "medium") && (
            <button
              onClick={handleReset}
              style={{
                marginTop: 20,
                background: "#27ae60",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✓ Mark Patient as Safe
            </button>
          )}
        </div>

        {/* ── CONNECTION STATUS ── */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: 12,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: connected ? "#27ae60" : demoFeed ? "#2980b9" : "#e74c3c",
            boxShadow: connected ? "0 0 6px #27ae60" : "none",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, color: "#555" }}>
            {connected
              ? "Live — connected via WebSocket"
              : demoFeed
              ? "Demo feed — simulated patient, backend offline"
              : "Connecting to the patient's monitor..."}
          </span>
        </div>

        <p style={{ textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 8 }}>
          {demoFeed
            ? "Simulated readings every 4s so the alert flow can be demonstrated end to end."
            : "Alerts arrive instantly · No refresh needed · Keep this tab open"}
        </p>
      </div>
    </div>
  );
}