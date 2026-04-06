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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission + get FCM token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      console.log("FCM Token:", token);
      localStorage.setItem("caregiver_token", token);
      return token;
    } else {
      console.warn("No FCM token received");
      return null;
    }
  } catch (err) {
    console.error("FCM token error:", err);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback) {
  return onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
    callback(payload);
  });
}

export { messaging };