import numpy as np
from datetime import datetime

def simulate_full_reading(prev_glucose=95):
    hour = datetime.now().hour

    # Time of day risk multiplier
    if 2 <= hour <= 5:
        time_risk = 1.8    # nighttime = most dangerous
    elif 12 <= hour <= 14:
        time_risk = 1.3    # post lunch dip
    elif 18 <= hour <= 20:
        time_risk = 1.2    # post exercise
    else:
        time_risk = 1.0    # normal

    # Simulate glucose with time factor
    delta = (np.random.random() - 0.48) * 8 * time_risk
    glucose = round(max(40, min(220, prev_glucose + delta)), 1)

    return {
        "glucose": glucose,
        "hour_of_day": hour,
        "hours_since_meal": np.random.randint(1, 6),
        "hours_since_medication": np.random.randint(0, 4),
        "activity_level": np.random.choice([0, 1, 2]),  # rest/walk/exercise
        "bmi": 27.5,
        "age": 34,
        "insulin": 115,
    }

def get_glucose_stream(n=5):
    readings = []
    val = 95
    for _ in range(n):
        val = simulate_glucose(val)
        readings.append(val)
    return readings

if __name__ == "__main__":
    while True:
        stream = get_glucose_stream()
        print("Glucose readings:", stream)
        time.sleep(2)