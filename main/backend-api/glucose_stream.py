import time
import random
import threading
from datetime import datetime

# Shared state — latest reading + history buffer
_latest_reading = {
    "glucose": 110,
    "timestamp": datetime.utcnow().isoformat(),
    "unit": "mg/dL",
}
_reading_history = []  # last 20 readings
_lock = threading.Lock()


def get_latest_reading():
    with _lock:
        return dict(_latest_reading)


def _simulate_next(current_glucose):
    """
    Simulate a realistic glucose reading.
    Drifts ±5 per tick, with occasional crash/spike events.
    """
    # Random walk with mean-reversion toward 100
    drift = random.gauss(0, 4)
    reversion = (100 - current_glucose) * 0.05

    # ~10% chance of a larger drop (exercise / missed meal scenario)
    crash_event = random.random() < 0.10
    crash = -random.uniform(8, 18) if crash_event else 0

    new_value = current_glucose + drift + reversion + crash
    # Clamp to physiologically plausible range
    return round(max(40, min(300, new_value)), 1)


def start_glucose_stream(socketio, interval_seconds=3):
    """
    Background thread: generates a new glucose reading every `interval_seconds`,
    stores it, and emits it via SocketIO to all connected clients.
    """
    current = 110.0

    while True:
        current = _simulate_next(current)
        timestamp = datetime.utcnow().isoformat()

        reading = {
            "glucose": current,
            "timestamp": timestamp,
            "unit": "mg/dL",
        }

        with _lock:
            _latest_reading.update(reading)
            _reading_history.append(current)
            if len(_reading_history) > 20:
                _reading_history.pop(0)

        # Emit to all connected WebSocket clients
        socketio.emit("glucose_update", {
            **reading,
            "history": list(_reading_history),
        })

        time.sleep(interval_seconds)