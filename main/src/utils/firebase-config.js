import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Get permission + token from user's browser
export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY"
    });
    console.log("FCM Token:", token); // save this to your backend
    return token;
  }
}

// Listen for incoming messages while app is open
export function listenForAlerts(callback) {
  onMessage(messaging, (payload) => {
    callback(payload.notification);
  });
}

export { messaging };