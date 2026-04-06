import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(99)

records = []
start = datetime(2024, 2, 10, 2, 0)  # 2am — highest risk window

glucose = 95.0

for i in range(60):
    timestamp = start + timedelta(minutes=i * 15)
    hour = timestamp.hour

    # Simulate nighttime crash
    if i < 10:
        glucose = glucose - np.random.uniform(1, 3)   # slow drop
    elif i < 20:
        glucose = glucose - np.random.uniform(3, 6)   # faster drop
    elif i < 30:
        glucose = glucose - np.random.uniform(5, 10)  # crash zone
    elif i < 35:
        glucose = max(38, glucose - np.random.uniform(1, 4))  # critical
    elif i < 40:
        glucose = glucose + np.random.uniform(5, 12)  # recovery after SOS
    else:
        glucose = glucose + np.random.uniform(1, 4)   # stable recovery
        glucose = min(glucose, 140)

    glucose = round(glucose, 1)

    # Determine alert level
    if glucose < 54:
        alert = "CRITICAL"
        notes = "SOS TRIGGERED — Caregiver alerted"
    elif glucose < 70:
        alert = "HIGH"
        notes = "Alert fired — nighttime drop"
    elif glucose < 85:
        alert = "MEDIUM"
        notes = "Monitor closely"
    else:
        alert = "LOW"
        notes = "Stable"

    # Meal taken only during recovery
    meal_taken = 1 if (35 <= i < 38) else 0
    meal_type  = "glucose tablets" if meal_taken else ""

    records.append({
        "timestamp":          timestamp.strftime("%Y-%m-%d %H:%M"),
        "glucose_mg_dl":      glucose,
        "alert_level":        alert,
        "meal_taken":         meal_taken,
        "meal_type":          meal_type,
        "insulin_dose_units": 0,
        "exercise_minutes":   0,
        "heart_rate":         round(55 + np.random.uniform(-3, 3), 0),
        "hour_of_day":        hour,
        "notes":              notes,
    })

df = pd.DataFrame(records)
df.to_csv("dataset/sos_dummy_data.csv", index=False)

print(df.to_string())
print(f"\n✅ SOS dummy data saved!")
print(f"Critical readings (< 54): {(df['glucose_mg_dl'] < 54).sum()}")
print(f"High risk readings (< 70): {(df['glucose_mg_dl'] < 70).sum()}")
print(f"Total rows: {len(df)}")