from flask import Blueprint, request, jsonify
import pickle
import numpy as np
import pandas as pd
import os
from datetime import datetime

predict_bp = Blueprint("predict", __name__)

BASE         = os.path.dirname(__file__)
MODEL_PATH   = os.path.join(BASE, "..", "model.pkl")
SCALER_PATH  = os.path.join(BASE, "..", "scaler.pkl")
LE_PATH      = os.path.join(BASE, "..", "label_encoder.pkl")
FEAT_PATH    = os.path.join(BASE, "..", "features.pkl")

model    = None
scaler   = None
le       = None
features = None

def load_model():
    global model, scaler, le, features
    try:
        with open(MODEL_PATH,  "rb") as f: model    = pickle.load(f)
        with open(SCALER_PATH, "rb") as f: scaler   = pickle.load(f)
        with open(LE_PATH,     "rb") as f: le       = pickle.load(f)
        with open(FEAT_PATH,   "rb") as f: features = pickle.load(f)
        print(f"✅ Model loaded. Expects {len(features)} features: {features}")
    except FileNotFoundError as e:
        print(f"⚠️  File not found: {e}")

load_model()

# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────

def compute_rate_of_change(glucose_array):
    """mg/dL per minute between last two readings (15-min intervals)"""
    if len(glucose_array) < 2:
        return 0.0
    return (glucose_array[-1] - glucose_array[-2]) / 15.0

def compute_acceleration(glucose_array):
    """Second derivative of glucose — is the drop speeding up?"""
    if len(glucose_array) < 3:
        return 0.0
    r1 = (glucose_array[-2] - glucose_array[-3]) / 15.0
    r2 = (glucose_array[-1] - glucose_array[-2]) / 15.0
    return r2 - r1

def compute_variability(glucose_array):
    """Rolling std of last 24 hrs — use all available readings"""
    if len(glucose_array) < 2:
        return 0.0
    return float(np.std(glucose_array))

def time_to_hypo(glucose, rate):
    """Estimated minutes until glucose hits 70 mg/dL"""
    if rate >= 0:
        return 999.0
    minutes = (glucose - 70.0) / abs(rate)
    return float(np.clip(minutes, 0, 120))

def estimated_floor(glucose, rate, accel):
    """Project where glucose will bottom out over 30 min"""
    floor = glucose + (rate * 30) + (0.5 * accel * 30 * 30)
    return float(max(30, floor))

def hours_since_last(arr, threshold=0):
    """How many hours since the last non-zero event in array"""
    for i, v in enumerate(reversed(arr)):
        if v > threshold:
            return i * 0.25   # each reading = 15 min
    return 999.0

def food_suggestion(risk, glucose):
    if risk == "high" or glucose < 70:
        return "Eat 3 glucose tablets or drink 150ml of juice IMMEDIATELY."
    elif risk == "medium" or glucose < 90:
        return "Have a small snack — a banana or handful of crackers."
    return "Glucose looks stable. Keep up your current routine!"

def safe_to_sleep(risk, glucose):
    hour = datetime.now().hour
    if 21 <= hour or hour < 6:
        if risk == "low" and glucose >= 108:
            return "✅ Stable. Safe to sleep."
        return "⚠️ Eat a slow-release snack before bed (e.g. peanut butter on toast)."
    return None

# ─────────────────────────────────────────────────────────────────
# PREDICT ROUTE
# ─────────────────────────────────────────────────────────────────
@predict_bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    # ── Required: glucose readings array ─────────────────────────
    glucose_array = data.get("glucose", [])
    if not glucose_array or len(glucose_array) < 2:
        return jsonify({"error": "Provide at least 2 glucose readings."}), 400

    current = float(glucose_array[-1])
    hour    = datetime.now().hour
    night   = 1 if (hour >= 22 or hour <= 6) else 0

    # ── Optional context from dashboard ──────────────────────────
    # These match exactly the dashboard context panel inputs
    heart_rate           = float(data.get("heart_rate",           72))
    insulin_on_board     = float(data.get("insulin_on_board",      0))
    hypo_episodes        = float(data.get("hypo_episodes",         0))
    sleep_hours          = float(data.get("sleep_hours",           7))
    stress_level         = float(data.get("stress_level",          3))
    alcohol_consumed     = float(data.get("alcohol_consumed",      0))
    skipped_meal         = float(data.get("skipped_meal",          0))

    # ── Meal/exercise signals (arrays or counts) ──────────────────
    meal_array     = data.get("meal_array",     [0] * len(glucose_array))
    exercise_array = data.get("exercise_array", [0] * len(glucose_array))

    # ── Compute all features ──────────────────────────────────────
    rate    = compute_rate_of_change(glucose_array)
    accel   = compute_acceleration(glucose_array)
    var     = compute_variability(glucose_array)
    g_min   = float(min(glucose_array[-8:]))   # min in last 2 hrs
    tth     = time_to_hypo(current, rate)
    floor   = estimated_floor(current, rate, accel)

    # Hours since last meal / exercise from arrays
    hsm = hours_since_last(meal_array)
    hse = hours_since_last(exercise_array)

    # Post-exercise danger window (4–8 hrs after exercise)
    post_ex_danger = 1.0 if (4 <= hse <= 8) else 0.0

    # Food spike detection — rise ≥20 mg/dL over last 4 readings
    food_spike = 0.0
    if len(glucose_array) >= 5:
        food_spike = 1.0 if (glucose_array[-1] - glucose_array[-5]) >= 20 else 0.0

    # ── Build feature row — ORDER MUST MATCH features.pkl ─────────
    # Features (20 total, matching train.py exactly):
    # glucose_mg_dl, glucose_rate_of_change, glucose_acceleration,
    # glucose_variability_24hr, glucose_min_2hr,
    # time_to_hypo_min, estimated_glucose_floor,
    # heart_rate, insulin_on_board, hypo_episodes_last_7days,
    # hours_since_exercise, post_exercise_danger,
    # hours_since_meal, food_spike, skipped_meal,
    # hour_of_day, nighttime,
    # sleep_hours, stress_level, alcohol_consumed

    feature_values = {
        "glucose_mg_dl":             current,
        "glucose_rate_of_change":    rate,
        "glucose_acceleration":      accel,
        "glucose_variability_24hr":  var,
        "glucose_min_2hr":           g_min,
        "time_to_hypo_min":          tth,
        "estimated_glucose_floor":   floor,
        "heart_rate":                heart_rate,
        "insulin_on_board":          insulin_on_board,
        "hypo_episodes_last_7days":  hypo_episodes,
        "hours_since_exercise":      hse,
        "post_exercise_danger":      post_ex_danger,
        "hours_since_meal":          hsm,
        "food_spike":                food_spike,
        "skipped_meal":              skipped_meal,
        "hour_of_day":               float(hour),
        "nighttime":                 float(night),
        "sleep_hours":               sleep_hours,
        "stress_level":              stress_level,
        "alcohol_consumed":          alcohol_consumed,
    }

    if model and scaler and le and features:
        # Build DataFrame in exact feature order from features.pkl
        row    = pd.DataFrame([[feature_values[f] for f in features]], columns=features)
        scaled = scaler.transform(row)
        proba  = model.predict_proba(scaled)[0]

        confidence    = float(max(proba))
        predicted_enc = model.predict(scaled)[0]
        risk          = le.inverse_transform([predicted_enc])[0]

        # All class probabilities
        class_probs = {le.inverse_transform([i])[0]: round(float(p), 3)
                       for i, p in enumerate(proba)}

        # ── Medical safety overrides — thresholds always win ──────
        if current < 54:
            risk       = "high"
            confidence = 0.99
        elif current < 70:
            risk       = "high"
            confidence = max(confidence, 0.85)
        elif current < 85 and risk == "low":
            risk       = "medium"
            confidence = max(confidence, 0.70)

    else:
        # Fallback if model not loaded
        if current < 70:    risk, confidence = "high",   0.90
        elif current < 90:  risk, confidence = "medium", 0.65
        else:               risk, confidence = "low",    0.20
        class_probs = {}

    # ── Build response ────────────────────────────────────────────
    crash_predicted   = tth < 60 and rate < 0
    crash_in_minutes  = round(tth) if crash_predicted else None
    glucose_floor     = round(floor) if crash_predicted else None

    response = {
        # Core prediction
        "risk":                risk,
        "confidence":          round(confidence, 2),
        "class_probabilities": class_probs,

        # Current state
        "current_glucose":     current,
        "trend":               round(rate * 60, 1),   # mg/dL per hour

        # Predictive crash info
        "crash_predicted":     crash_predicted,
        "crash_in_minutes":    crash_in_minutes,
        "estimated_floor":     glucose_floor,

        # Computed signals (useful for dashboard display)
        "time_to_hypo_min":    round(tth) if tth < 999 else None,
        "rate_of_change":      round(rate, 3),         # mg/dL per min
        "acceleration":        round(accel, 3),

        # Suggestions
        "food_suggestion":     food_suggestion(risk, current),
    }

    sleep = safe_to_sleep(risk, current)
    if sleep:
        response["safe_to_sleep"] = sleep

    return jsonify(response)