// AlertManager.js
// One function to rule all alerts

import { apiPostQuiet } from "./backend";

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

  // Goes to the Flask backend, which forwards to the caregiver via Firebase.
  // Resolves either way — an unreachable backend must not break the alert chain.
  await apiPostQuiet("/alert-caregiver", payload);
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