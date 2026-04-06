import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";

const API_URL = "https://glucera.onrender.com";
const POLL_INTERVAL = 30000; // 30 seconds

export default function Caregiver() {
  const [status, setStatus]       = useState("watching"); // watching | alert | safe
  const [lastAlert, setLastAlert] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [connected, setConnected] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Request notification permission for browser alerts
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Start polling
  useEffect(() => {
    checkStatus(); // immediate first check
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch(`${API_URL}/latest-alert`);
      if (!res.ok) throw new Error("Backend unreachable");
      const data = await res.json();

      setConnected(true);
      setLastChecked(new Date().toLocaleTimeString());
      setPatientData(data);

      if (data.risk === "high") {
        setStatus("alert");
        setLastAlert(data);
        triggerAlerts(data);
      } else if (data.risk === "medium") {
        setStatus("medium");
      } else {
        setStatus("safe");
      }
    } catch (err) {
      setConnected(false);
      console.warn("Polling error:", err);
    }
  }

  function triggerAlerts(data) {
    // Browser notification
    if (Notification.permission === "granted") {
      new Notification("🚨 Glucera Emergency", {
        body: `Patient glucose: ${data.glucose} mg/dL — CRITICAL. Immediate action needed.`,
        icon: "/favicon.png",
        requireInteraction: true,
      });
    }

    // Voice alert
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(
        `Emergency alert. Patient glucose is critically low at ${data.glucose} milligrams per deciliter. Immediate response required.`
      );
      msg.rate = 0.9;
      msg.volume = 1.0;
      window.speechSynthesis.speak(msg);
    }
  }

  const statusConfig = {
    watching: { color: "#76575D", bg: "#f9f5f5", icon: "👁️", label: "Monitoring Patient" },
    safe:     { color: "#27ae60", bg: "#f0faf4", icon: "✅", label: "Patient is Safe"    },
    medium:   { color: "#e67e22", bg: "#fef9f0", icon: "⚠️", label: "Caution"           },
    alert:    { color: "#c0392b", bg: "#fdf0ef", icon: "🚨", label: "EMERGENCY"         },
  };

  const cfg = statusConfig[status] || statusConfig.watching;

  return (
    <div style={{ minHeight: "100vh", background: "#f0eaeb", fontFamily: "DM Sans, sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>

        {/* Status card */}
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

          {patientData && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 40, fontWeight: 800, color: cfg.color }}>
                {patientData.glucose} <span style={{ fontSize: 16, color: "#aaa" }}>mg/dL</span>
              </p>
              <p style={{ color: "#666", fontSize: 14 }}>
                Last reading: {patientData.timestamp || lastChecked}
              </p>
            </div>
          )}

          {status === "alert" && lastAlert && (
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: "16px",
              marginTop: 20,
              border: "1px solid #f5c6c6",
            }}>
              <p style={{ color: "#c0392b", fontWeight: 700, fontSize: 16 }}>
                ⚠️ Glucose dropped to {lastAlert.glucose} mg/dL
              </p>
              <p style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                {lastAlert.message || "Patient may need immediate assistance."}
              </p>
            </div>
          )}
        </div>

        {/* Connection status */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: connected ? "#27ae60" : "#e74c3c",
              boxShadow: connected ? "0 0 6px #27ae60" : "none",
            }} />
            <span style={{ fontSize: 14, color: "#555" }}>
              {connected ? "Connected to backend" : "Backend unreachable"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#aaa" }}>
            {lastChecked ? `Checked ${lastChecked}` : "Connecting..."}
          </span>
        </div>

        {/* Manual check button */}
        <button
          onClick={checkStatus}
          style={{
            width: "100%",
            background: "#76575D",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          Check Now
        </button>

        <p style={{ textAlign: "center", color: "#aaa", fontSize: 12 }}>
          Auto-checks every 30 seconds · Keep this tab open
        </p>

      </div>
    </div>
  );
}