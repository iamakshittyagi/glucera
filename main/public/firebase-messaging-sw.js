importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD24t9psjfV0z9LW2tTjilKkKD_CW8ecO8",
  authDomain: "glucera-ee54e.firebaseapp.com",
  projectId: "glucera-ee54e",
  storageBucket: "glucera-ee54e.firebasestorage.app",
  messagingSenderId: "692103685377",
  appId: "1:692103685377:web:a8bd3addf1393435aee700",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    vibrate: [200, 100, 200],
  });
});