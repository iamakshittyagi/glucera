import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD24t9psjfV0z9LW2tTjilKkKD_CW8ecO8",
  authDomain: "glucera-ee54e.firebaseapp.com",
  projectId: "glucera-ee54e",
  storageBucket: "glucera-ee54e.firebasestorage.app",
  messagingSenderId: "692103685377",
  appId: "1:692103685377:web:a8bd3addf1393435aee700",
  measurementId: "G-CGKGMM46XZ",
};

const VAPID_KEY = "BNlBCMrBhiOY5R6fNgERyhQeEFaI_WgEuLVFE-QkO1WBvtGAJvWKoa-ymTvvTDpF_k8zb9TDt3dv2U17NGVl6jk";
const API_URL   = "https://glucera.onrender.com";

// Initialize Firebase app only — NOT messaging (that needs a service worker)
const app = initializeApp(firebaseConfig);

// Lazy getter — only initializes messaging when actually called
let _messaging = null;
function getMessagingInstance() {
  if (!_messaging) {
    _messaging = getMessaging(app);
  }
  return _messaging;
}

// ─── REQUEST PERMISSION + GET FCM TOKEN + REGISTER WITH BACKEND ──
export async function requestNotificationPermission() {
  try {
    // 1. Check if browser supports notifications
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return null;
    }

    // 2. Check if service worker is supported (required for FCM)
    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers not supported");
      return null;
    }

    // 3. Request permission — only NOW, not at import time
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    // 4. Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // 5. Get FCM token
    const token = await getToken(getMessagingInstance(), { vapidKey: VAPID_KEY });

    if (token) {
      console.log("FCM Token:", token);
      localStorage.setItem("caregiver_token", token);

      // 6. Send to backend
      try {
        const res = await fetch(`${API_URL}/register-caregiver`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ token }),
        });
        const data = await res.json();
        console.log("Caregiver registered on backend:", data);
      } catch (err) {
        console.warn("Could not register token with backend:", err);
      }

      return token;
    } else {
      console.warn("No FCM token received — check VAPID key and service worker");
      return null;
    }
  } catch (err) {
    console.error("FCM token error:", err);
    return null;
  }
}

// ─── LISTEN FOR FOREGROUND MESSAGES ──────────────────────────────
export function onForegroundMessage(callback) {
  return onMessage(getMessagingInstance(), (payload) => {
    console.log("Foreground message:", payload);
    callback(payload);
  });
}

export { app };