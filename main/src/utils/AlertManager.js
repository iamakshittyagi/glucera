// AlertManager.js
// One function to rule all alerts

// ---------- PUSH NOTIFICATION ----------
export function sendPushNotification(riskLevel, confidence) {
  if (Notification.permission === "granted") {
    new Notification("HypoGuard Alert", {
      body: `Risk level: ${riskLevel.toUpperCase()} — ${Math.round(confidence * 100)}% confidence. Eat something now.`,
      icon: "/logo.svg",
      badge: "/logo.svg",
      vibrate: [200, 100, 200]  // vibration pattern
    });
  }
}

// ---------- VOICE ALERT ----------
export function speakAlert(riskLevel) {
  if ("speechSynthesis" in window) {
    const message = riskLevel === "high"
      ? "Warning. Your glucose is dropping dangerously. Please eat something immediately."
      : "Caution. Your glucose is getting low. Consider having a snack.";

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;    // slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// ---------- CAREGIVER ALERT (Firebase) ----------
export async function notifyCaregiver(riskLevel, confidence, location = null) {
  const payload = {
    risk: riskLevel,
    confidence,
    time: new Date().toLocaleTimeString(),
    location: location || "location not available"
  };

  // Send to your Node.js backend which forwards via Firebase
  await fetch("http://localhost:5000/alert-caregiver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

// ---------- MASTER TRIGGER ----------
// Call this ONE function from Dashboard — it handles everything
export async function triggerAllAlerts(riskLevel, confidence) {
  if (riskLevel === "high" || riskLevel === "medium") {
    sendPushNotification(riskLevel, confidence);
    speakAlert(riskLevel);

    if (riskLevel === "high") {
      await notifyCaregiver(riskLevel, confidence);
    }
  }
}