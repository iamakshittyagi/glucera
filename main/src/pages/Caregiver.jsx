import React, { useState, useEffect } from "react";
import { requestNotificationPermission } from "../utils/firebase-config";

export default function Caregiver() {
  const [status, setStatus] = useState("idle"); // idle | registered | denied

  // Check if already registered
  useEffect(() => {
    const saved = localStorage.getItem("caregiver_token");
    if (saved) setStatus("registered");
  }, []);

  
  async function handleRegister() {
  const token = await requestNotificationPermission();
  if (token) {
    setStatus("registered");
  } else {
    setStatus("denied");
  }
}

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
      fontFamily: "sans-serif"
    }}>

      {status === "idle" && <>
        <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>Glucera Caregiver</h1>
        <p style={{ color: "#666", marginBottom: "32px" }}>
          Register this device to receive emergency alerts<br/>
          when your patient's glucose drops dangerously.
        </p>
        <button onClick={handleRegister} style={{
          background: "#76575D",
          color: "white",
          border: "none",
          borderRadius: "12px",
          padding: "16px 40px",
          fontSize: "18px",
          fontWeight: "600",
          cursor: "pointer"
        }}>
          Register as Caregiver
        </button>
      </>}

      {status === "registered" && <>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
        <h1 style={{ fontSize: "28px", color: "#27ae60" }}>You're registered!</h1>
        <p style={{ color: "#666", marginTop: "8px" }}>
          This device will receive an alert automatically<br/>
          if the patient's glucose drops dangerously.
        </p>
        <p style={{ color: "#aaa", fontSize: "13px", marginTop: "24px" }}>
          Keep this page open or allow notifications when prompted.
        </p>
      </>}

      {status === "denied" && <>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>⚠️</div>
        <h1 style={{ fontSize: "22px", color: "#e67e22" }}>Notifications blocked</h1>
        <p style={{ color: "#666", marginTop: "8px" }}>
          Please enable notifications in your browser settings<br/>
          then refresh this page and try again.
        </p>
      </>}

    </div>
  );
}