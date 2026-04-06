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

# ── IN-MEMORY CAREGIVER TOKEN ─────────────────────────────────────
caregiver_fcm_token = None

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
    data       = request.get_json()
    risk       = data.get("risk")
    confidence = data.get("confidence", 0)
    mins       = data.get("minsToHypo")
    send_push_to_caregiver(caregiver_fcm_token, risk, confidence, mins)
    return jsonify({"status": "Caregiver alerted", "risk": risk})

# ── ROUTE 3: SOS button ───────────────────────────────────────────
@app.route("/sos", methods=["POST"])
def sos():
    data      = request.get_json()
    trigger   = data.get("trigger")
    maps_link = data.get("mapsLink")
    time_val  = data.get("time")
    print(f"SOS RECEIVED [{trigger}]: {maps_link} at {time_val}")
    if caregiver_fcm_token:
        send_push_to_caregiver(caregiver_fcm_token, "high", 1.0)
    return jsonify({"status": "SOS received", "trigger": trigger})

# ── PING ROUTE — keeps Render awake ──────────────────────────────
@app.route("/ping")
def ping():
    return "ok", 200

# ── SELF PINGER — hits /ping every 10 min so Render never sleeps ─
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