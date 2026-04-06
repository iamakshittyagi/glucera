from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from routes.predict import predict_bp
from routes.glucose import glucose_bp
from glucose_stream import start_glucose_stream
from firebase_alerts import send_push_to_caregiver
import threading
import requests
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

app.register_blueprint(predict_bp)
app.register_blueprint(glucose_bp)

# ── IN-MEMORY STATE ───────────────────────────────────────────────
caregiver_fcm_token = None

latest_alert = {
    "risk":      "low",
    "glucose":   None,
    "timestamp": None,
    "message":   None,
}

# ── ROUTE 1: Caregiver registers their device ─────────────────────
@app.route("/register-caregiver", methods=["POST"])
def register_caregiver():
    global caregiver_fcm_token
    data  = request.get_json()
    token = data.get("token")
    if not token:
        return jsonify({"error": "No token provided"}), 400
    caregiver_fcm_token = token
    print(f"Caregiver registered: {token[:20]}...")
    return jsonify({"status": "Caregiver registered successfully"})

# ── ROUTE 2: Dashboard calls this when risk = high ────────────────
@app.route("/alert-caregiver", methods=["POST"])
def alert_caregiver():
    global latest_alert
    data       = request.get_json()
    risk       = data.get("risk")
    confidence = data.get("confidence", 0)
    mins       = data.get("minsToHypo")
    glucose    = data.get("glucose")

    # Update latest alert so caregiver polling picks it up
    latest_alert = {
        "risk":      risk,
        "glucose":   glucose,
        "timestamp": time.strftime("%H:%M:%S"),
        "message":   f"Glucose crash predicted. Confidence {confidence}%."
                     + (f" Estimated {mins} min to hypo." if mins else ""),
    }

    send_push_to_caregiver(caregiver_fcm_token, risk, confidence, mins)
    return jsonify({"status": "Caregiver alerted", "risk": risk})

# ── ROUTE 3: SOS button ───────────────────────────────────────────
@app.route("/sos", methods=["POST"])
def sos():
    global latest_alert
    data      = request.get_json()
    trigger   = data.get("trigger")
    maps_link = data.get("mapsLink")
    time_val  = data.get("time")
    glucose   = data.get("glucose")

    print(f"SOS RECEIVED [{trigger}]: {maps_link} at {time_val}")

    # Update latest alert for caregiver polling
    latest_alert = {
        "risk":      "high",
        "glucose":   glucose,
        "timestamp": time_val or time.strftime("%H:%M:%S"),
        "message":   f"SOS triggered ({trigger}). Patient needs immediate help."
                     + (f" Location: {maps_link}" if maps_link else ""),
    }

    if caregiver_fcm_token:
        send_push_to_caregiver(caregiver_fcm_token, "high", 1.0)

    return jsonify({"status": "SOS received", "trigger": trigger})

# ── ROUTE 4: Caregiver page polls this every 30 seconds ──────────
@app.route("/latest-alert", methods=["GET"])
def get_latest_alert():
    return jsonify(latest_alert)

# ── ROUTE 5: Reset alert (call after patient recovers) ───────────
@app.route("/reset-alert", methods=["POST"])
def reset_alert():
    global latest_alert
    latest_alert = {
        "risk":      "low",
        "glucose":   None,
        "timestamp": time.strftime("%H:%M:%S"),
        "message":   "Patient glucose stabilised.",
    }
    return jsonify({"status": "Alert reset"})

# ── PING ROUTE — keeps Render awake ──────────────────────────────
@app.route("/ping")
def ping():
    return "ok", 200

# ── SELF PINGER ───────────────────────────────────────────────────
def keep_alive():
    while True:
        time.sleep(600)
        try:
            requests.get("https://glucera.onrender.com/ping", timeout=10)
            print("Keep-alive ping sent.")
        except Exception as e:
            print(f"Keep-alive ping failed: {e}")

def start_stream():
    start_glucose_stream(socketio)

stream_thread = threading.Thread(target=start_stream, daemon=True)
stream_thread.start()

pinger_thread = threading.Thread(target=keep_alive, daemon=True)
pinger_thread.start()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)