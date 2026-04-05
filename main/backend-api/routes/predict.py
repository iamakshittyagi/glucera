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

model  = None
scaler = None
le     = None

def load_model():
    global model, scaler, le
    try:
        with open(MODEL_PATH,  "rb") as f: model  = pickle.load(f)
        with open(SCALER_PATH, "rb") as f: scaler = pickle.load(f)
        with open(LE_PATH,     "rb") as f: le     = pickle.load(f)
        print("✅ Model, scaler and label encoder loaded.")
    except FileNotFoundError as e:
        print(f"⚠️  File not found: {e}")

load_model()

def explain_crash(glucose_array):
    reasons = []
    trend   = glucose_array[-1] - glucose_array[0]
    current = glucose_array[-1]
    hour    = datetime.now().hour

    if trend < -20:
        reasons.append("rapid glucose drop detected")
    if current < 70:
        reasons.append("reading below safe threshold (70 mg/dL)")
    if 2 <= hour <= 5:
        reasons.append("nighttime — highest risk window")
    if len(glucose_array) >= 3 and all(
        glucose_array[i] > glucose_array[i + 1]
        for i in range(len(glucose_array) - 1)
    ):
        reasons.append("consistent downward trend across all readings")
    if not reasons:
        reasons.append("elevated risk pattern detected by ML model")

    return "Likely caused by: " + ", ".join(reasons) + "."

def suggest_food(risk, current_glucose):
    if risk == "high" or current_glucose < 70:
        return "Eat 3 glucose tablets OR drink 150 ml of orange juice immediately."
    elif risk == "medium" or current_glucose < 90:
        return "Have a small snack — a banana or handful of crackers."
    else:
        return "No immediate action needed. Monitor closely."

def safe_to_sleep(risk, current_glucose):
    hour = datetime.now().hour
    if 21 <= hour or hour < 6:
        if risk == "low" and current_glucose >= 108:
            return "✅ Stable. Safe to sleep."
        else:
            return "⚠️ Eat a slow-release snack before bed (e.g. peanut butter on toast)."
    return None

@predict_bp.route("/predict", methods=["POST"])
def predict():
    data    = request.get_json()
    glucose = data.get("glucose", [])

    if not glucose or len(glucose) < 2:
        return jsonify({"error": "Provide at least 2 glucose readings."}), 400

    current = glucose[-1]
    hour    = datetime.now().hour

    if model and scaler and le:
        row = pd.DataFrame([[
            current,   # Glucose
            72,        # BloodPressure
            27.5,      # BMI
            34,        # Age
            115,       # Insulin
            0.42,      # DiabetesPedigreeFunction
            1,         # Pregnancies
            20,        # SkinThickness
            hour,      # hour_of_day
            3,         # hours_since_meal
            2,         # hours_since_medication
            1,         # activity_level
        ]], columns=[
            "Glucose", "BloodPressure", "BMI", "Age",
            "Insulin", "DiabetesPedigreeFunction",
            "Pregnancies", "SkinThickness",
            "hour_of_day", "hours_since_meal",
            "hours_since_medication", "activity_level"
        ])

        scaled        = scaler.transform(row)
        proba         = model.predict_proba(scaled)[0]
        confidence    = float(max(proba))
        predicted_enc = model.predict(scaled)[0]
        risk          = le.inverse_transform([predicted_enc])[0]

        # ── Safety override — medical thresholds always win ──
        if current < 54:
            risk       = "high"
            confidence = 0.99
        elif current < 70:
            risk       = "high"
            confidence = max(confidence, 0.85)
        elif current < 85:
            if risk == "low":
                risk       = "medium"
                confidence = max(confidence, 0.70)

    else:
        if current < 70:
            risk, confidence = "high", 0.90
        elif current < 90:
            risk, confidence = "medium", 0.65
        else:
            risk, confidence = "low", 0.20

    explanation = explain_crash(glucose) if risk in ["medium", "high"] else None
    food        = suggest_food(risk, current)
    sleep_check = safe_to_sleep(risk, current)

    response = {
        "risk":            risk,
        "confidence":      round(confidence, 2),
        "current_glucose": current,
        "trend":           round(glucose[-1] - glucose[0], 1),
        "explanation":     explanation,
        "food_suggestion": food,
    }
    if sleep_check:
        response["safe_to_sleep"] = sleep_check

    return jsonify(response)