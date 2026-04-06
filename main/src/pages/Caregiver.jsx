import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";

const API_URL = "https://glucera.onrender.com";

export default function Caregiver() {
  const [status, setStatus]       = useState("watching");
  const [alert, setAlert]         = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Connect to WebSocket
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("caregiver_join");
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("alert_update", (data) => {
      setAlert(data);
      setStatus(data.risk === "high" ? "alert" : data.risk === "medium" ? "medium" : "safe");

      if (data.risk === "high") {
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
            `Emergency. Patient glucose is critically low at ${data.glucose} milligrams per deciliter. Immediate response required.`
          );
          msg.rate = 0.9;
          msg.volume = 1.0;
          window.speechSynthesis.speak(msg);
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  const cfg = {
    watching: { color: "#76575D", bg: "#f9f5f5", icon: "", label: "Monitoring Patient"  },
    safe:     { color: "#27ae60", bg: "#f0faf4", icon: "✅", label: "Patient is Safe"      },
    medium:   { color: "#e67e22", bg: "#fef9f0", icon: "⚠️", label: "Caution"             },
    alert:    { color: "#c0392b", bg: "#fdf0ef", icon: "🚨", label: "EMERGENCY"           },
  }[status];

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
        </div>

        {/* Connection status */}
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
            background: connected ? "#27ae60" : "#e74c3c",
            boxShadow: connected ? "0 0 6px #27ae60" : "none",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, color: "#555" }}>
            {connected ? "Live — connected via WebSocket" : "Reconnecting..."}
          </span>
        </div>

        <p style={{ textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 8 }}>
          Alerts arrive instantly · No refresh needed · Keep this tab open
        </p>
      </div>
    </div>
  );
}