from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
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

# ── PING ROUTE — keeps Render awake ──────────────────────────────
@app.route("/ping")
def ping():
    return "ok", 200

# ── SELF PINGER — hits /ping every 10 min so Render never sleeps ─
def keep_alive():
    while True:
        time.sleep(600)   # 10 minutes
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