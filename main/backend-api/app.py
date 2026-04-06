from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from routes.predict import predict_bp
from routes.glucose import glucose_bp
from glucose_stream import start_glucose_stream
import threading
import requests
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

app.register_blueprint(predict_bp)
app.register_blueprint(glucose_bp)

# ── IN-MEMORY STATE ───────────────────────────────────────────────
latest_alert = {
    "risk":      "low",
    "glucose":   None,
    "timestamp": None,
    "message":   None,
}

# ── WEBSOCKET: Caregiver connects ────────────────────────────────
@socketio.on("caregiver_join")
def handle_caregiver_join():
    print("Caregiver connected via WebSocket")
    emit("alert_update", latest_alert)

# ── ROUTE 1: Dashboard calls when risk = high ─────────────────────
@app.route("/alert-caregiver", methods=["POST"])
def alert_caregiver():
    global latest_alert
    data       = request.get_json()
    risk       = data.get("risk")
    confidence = data.get("confidence", 0)
    mins       = data.get("minsToHypo")
    glucose    = data.get("glucose")

    latest_alert = {
        "risk":      risk,
        "glucose":   glucose,
        "timestamp": time.strftime("%H:%M:%S"),
        "message":   f"Glucose crash predicted. Confidence {int(confidence*100) if confidence <= 1 else int(confidence)}%."
                     + (f" Estimated {mins} min to hypo." if mins else ""),
    }

    socketio.emit("alert_update", latest_alert)
    return jsonify({"status": "Caregiver alerted", "risk": risk})

# ── ROUTE 2: SOS button ───────────────────────────────────────────
@app.route("/sos", methods=["POST"])
def sos():
    global latest_alert
    data      = request.get_json()
    trigger   = data.get("trigger")
    maps_link = data.get("mapsLink")
    time_val  = data.get("time")
    glucose   = data.get("glucose")

    print(f"SOS RECEIVED [{trigger}]: {maps_link} at {time_val}")

    latest_alert = {
        "risk":      "high",
        "glucose":   glucose,
        "timestamp": time_val or time.strftime("%H:%M:%S"),
        "message":   f"SOS triggered ({trigger}). Patient needs immediate help."
                     + (f" Location: {maps_link}" if maps_link else ""),
    }

    socketio.emit("alert_update", latest_alert)
    return jsonify({"status": "SOS received", "trigger": trigger})

# ── ROUTE 3: Reset after patient recovers ────────────────────────
@app.route("/reset-alert", methods=["POST"])
def reset_alert():
    global latest_alert
    latest_alert = {
        "risk":      "low",
        "glucose":   None,
        "timestamp": time.strftime("%H:%M:%S"),
        "message":   "Patient glucose stabilised.",
    }
    socketio.emit("alert_update", latest_alert)
    return jsonify({"status": "Alert reset"})

# ── ROUTE 4: Fallback REST for initial load ───────────────────────
@app.route("/latest-alert", methods=["GET"])
def get_latest_alert():
    return jsonify(latest_alert)

# ── PING ──────────────────────────────────────────────────────────
@app.route("/ping")
def ping():
    return "ok", 200

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