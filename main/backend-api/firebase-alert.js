const admin = require("firebase-admin");

// ─── INIT ─────────────────────────────────────────────────────────────────────
// Make sure serviceAccountKey.json is in the same backend-api/ folder
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ─── SEND PUSH TO CAREGIVER ───────────────────────────────────────────────────
async function sendPushToCaregiver(caregiverToken, riskLevel, confidence, minsToHypo) {
  if (!caregiverToken) {
    console.warn("No caregiver token — skipping push");
    return;
  }

  const message = {
    token: caregiverToken,
    notification: {
      title: riskLevel === "high" ? " GLUCERA EMERGENCY" : " Glucera Warning",
      body:
        riskLevel === "high"
          ? `Glucose crash predicted in ${minsToHypo || "~20"} mins. Confidence: ${Math.round(confidence * 100)}%. Check on your patient NOW.`
          : `Glucose dropping. Confidence: ${Math.round(confidence * 100)}%. Patient may need a snack.`,
    },
    webpush: {
      notification: {
        icon: "https://glucera.vercel.app/favicon.png",
        badge: "https://glucera.vercel.app/favicon.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Push sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Push failed:", error.message);
  }
}

module.exports = { sendPushToCaregiver };