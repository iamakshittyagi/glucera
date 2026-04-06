import React, { useState } from "react";

export default function SOSButton() {
  const [status, setStatus] = useState("idle"); // idle | locating | sent | error

  async function handleSOS() {
    setStatus("locating");

    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

        // Send to backend → backend notifies caregiver
        await fetch("http://localhost:5000/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude,
            longitude,
            mapsLink,
            time: new Date().toISOString(),
            message: "EMERGENCY: Patient needs help. Glucose crash suspected."
          })
        });

        setStatus("sent");
        setTimeout(() => setStatus("idle"), 5000); // reset after 5s
      },
      () => setStatus("error")
    );
  }

  const styles = {
    idle:      { background: "#991b1b", color: "white" },
    locating:  { background: "#92400e", color: "white" },
    sent:      { background: "#14532d", color: "white" },
    error:     { background: "#4b1c1c", color: "white" }
  };

  const labels = {
    idle:     "SOS — Send My Location",
    locating: "Getting location...",
    sent:     "Help is on the way",
    error:    "Location failed — call 112"
  };

  return (
    <button
      onClick={handleSOS}
      disabled={status === "locating" || status === "sent"}
      style={{
        ...styles[status],
        padding: "14px 28px",
        borderRadius: "12px",
        border: "none",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        width: "100%",
        marginTop: "16px"
      }}
    >
      {labels[status]}
    </button>
  );
}