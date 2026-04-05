import pickle
import numpy as np
import pandas as pd
import os
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))

model    = pickle.load(open(os.path.join(BASE, "model.pkl"),         "rb"))
scaler   = pickle.load(open(os.path.join(BASE, "scaler.pkl"),        "rb"))
le       = pickle.load(open(os.path.join(BASE, "label_encoder.pkl"), "rb"))
features = pickle.load(open(os.path.join(BASE, "features.pkl"),      "rb"))

def predict_risk(
    glucose,
    hour=None,
    hours_since_meal=3,
    hours_since_medication=2,
    activity_level=1,
    blood_pressure=72,
    bmi=27.5,
    age=34,
    insulin=115,
    dpf=0.42,
    pregnancies=1,
    skin_thickness=20
):
    if hour is None:
        hour = datetime.now().hour

    row = pd.DataFrame([[
        glucose, blood_pressure, bmi, age, insulin,
        dpf, pregnancies, skin_thickness,
        hour, hours_since_meal,
        hours_since_medication, activity_level
    ]], columns=features)

    scaled     = scaler.transform(row)
    risk_enc   = model.predict(scaled)[0]
    risk       = le.inverse_transform([risk_enc])[0]
    confidence = round(float(model.predict_proba(scaled).max()), 2)

    return {
        "risk":       risk,
        "confidence": confidence,
        "alert":      risk == "high",
        "cause":      get_cause(glucose, hour, hours_since_meal, hours_since_medication, activity_level),
        "suggestion": get_suggestion(risk),
    }

def get_cause(glucose, hour, meal, med, activity):
    causes = []
    if glucose < 70:        causes.append("critically low glucose")
    if 2 <= hour <= 5:      causes.append("nighttime sleeping")
    if meal > 5:            causes.append("skipped meal")
    if med < 2:             causes.append("recent insulin dose")
    if activity == 2:       causes.append("intense exercise")
    if not causes:          causes.append("gradual glucose decline")
    return "Likely caused by: " + " + ".join(causes)

def get_suggestion(risk):
    if risk == "high":
        return "Have juice or 3 glucose tablets immediately"
    if risk == "medium":
        return "Eat a small snack within 30 minutes"
    return "Glucose stable — no action needed"

if __name__ == "__main__":
    print("Patient A — Normal:")
    print(predict_risk(glucose=95, hour=10, hours_since_meal=2))

    print("\nPatient B — At Risk:")
    print(predict_risk(glucose=75, hour=14, hours_since_meal=5, activity_level=2))

    print("\nPatient C — Critical:")
    print(predict_risk(glucose=52, hour=3, hours_since_meal=7))