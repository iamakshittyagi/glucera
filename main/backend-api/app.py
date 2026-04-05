from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from routes.predict import predict_bp
from routes.glucose import glucose_bp
from glucose_stream import start_glucose_stream
import threading

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

app.register_blueprint(predict_bp)
app.register_blueprint(glucose_bp)

def start_stream():
    start_glucose_stream(socketio)

stream_thread = threading.Thread(target=start_stream, daemon=True)
stream_thread.start()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000, debug=False, use_reloader=False)