import pandas as pd
import numpy as np
import os
import pickle
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

BASE = os.path.dirname(os.path.abspath(__file__))
np.random.seed(42)

# ─────────────────────────────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────────────────────────────
csv_path = os.path.join(BASE, "dataset", "glucera_critical_dummy.csv")
if not os.path.exists(csv_path):
    csv_path = "/mnt/user-data/uploads/glucera_critical_dummy.csv"
df_raw = pd.read_csv(csv_path)
df_raw["timestamp"] = pd.to_datetime(df_raw["timestamp"])
df_raw = df_raw.sort_values("timestamp").reset_index(drop=True)
print(f"Loaded: {len(df_raw)} rows")
print(f"Columns: {list(df_raw.columns)}")

# ─────────────────────────────────────────────────────────────────
# 2. AUTO MEAL DETECTION
#    A glucose rise of ≥20 mg/dL over 30 min (2 readings) = meal
#    A glucose rise of ≥10 mg/dL over 15 min (1 reading)  = snack
# ─────────────────────────────────────────────────────────────────
df_raw["glucose_rise_30min"] = df_raw["glucose_mg_dl"].diff(2)
df_raw["glucose_rise_15min"] = df_raw["glucose_mg_dl"].diff(1)

df_raw["meal_auto_detected"]  = (df_raw["glucose_rise_30min"] >= 20).astype(int)
df_raw["snack_auto_detected"] = (df_raw["glucose_rise_15min"] >= 10).astype(int)

if "meal_taken" in df_raw.columns:
    df_raw["meal_taken"] = df_raw["meal_taken"].fillna(0).astype(int)
    df_raw["meal_signal"] = np.maximum(df_raw["meal_taken"], df_raw["meal_auto_detected"])
    print("Using combined meal signal (logged + auto-detected)")
else:
    df_raw["meal_signal"] = df_raw["meal_auto_detected"]
    print("No meal_taken column — using auto-detected meals only")

if "meal_taken" in df_raw.columns:
    print(f"  Logged meals:        {int(df_raw['meal_taken'].sum())}")
    print(f"  Auto-detected meals: {int(df_raw['meal_auto_detected'].sum())}")
    print(f"  Combined (union):    {int(df_raw['meal_signal'].sum())}")

# ─────────────────────────────────────────────────────────────────
# 2b. AUTO EXERCISE DETECTION
#     Sustained glucose drop ≥15 mg/dL over 45 min (3 readings)
#     WITHOUT a recent meal = likely exercise
# ─────────────────────────────────────────────────────────────────
df_raw["glucose_drop_45min"] = -(df_raw["glucose_mg_dl"].diff(3))
df_raw["recent_meal_window"] = df_raw["meal_signal"].rolling(window=4, min_periods=1).sum()

df_raw["exercise_auto_detected"] = (
    (df_raw["glucose_drop_45min"] >= 15) &
    (df_raw["recent_meal_window"] == 0)
).astype(int)

if "exercise_minutes" in df_raw.columns:
    df_raw["exercise_minutes"] = df_raw["exercise_minutes"].fillna(0)
    df_raw["exercise_signal"] = np.maximum(
        (df_raw["exercise_minutes"] > 0).astype(int),
        df_raw["exercise_auto_detected"]
    )
    print("Using combined exercise signal (logged + auto-detected)")
else:
    df_raw["exercise_signal"] = df_raw["exercise_auto_detected"]
    print("No exercise_minutes column — using auto-detected exercise only")

print(f"  Auto-detected exercise events: {int(df_raw['exercise_auto_detected'].sum())}")

# ─────────────────────────────────────────────────────────────────
# 3. FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────────

# ── 3a. Glucose rate of change (mg/dL per minute) ────────────────
df_raw["glucose_rate_of_change"] = (df_raw["glucose_mg_dl"].diff() / 15.0).fillna(0)

# ── 3b. Glucose acceleration (is the drop speeding up?) ──────────
df_raw["glucose_acceleration"] = df_raw["glucose_rate_of_change"].diff().fillna(0)

# ── 3c. Glucose variability over last 24 hrs ─────────────────────
df_raw["glucose_variability_24hr"] = (
    df_raw["glucose_mg_dl"].rolling(window=96, min_periods=4).std().fillna(0)
)

# ── 3d. Glucose min in last 2 hrs ────────────────────────────────
df_raw["glucose_min_2hr"] = (
    df_raw["glucose_mg_dl"].rolling(window=8, min_periods=1).min()
)

# ── 3e. Hypo episodes in last 7 days ─────────────────────────────
df_raw["hypo_flag"] = (df_raw["glucose_mg_dl"] < 70).astype(int)
df_raw["hypo_episodes_last_7days"] = (
    df_raw["hypo_flag"].rolling(window=672, min_periods=1).sum()
)

# ── 3f. Insulin on board (exponential decay, tau = 4 hrs) ────────
def iob_decay(x):
    arr = np.array(x)
    return sum(v * np.exp(-i * 15 / 240) for i, v in enumerate(reversed(arr)))

if "insulin_dose_units" in df_raw.columns:
    df_raw["insulin_dose_units"] = df_raw["insulin_dose_units"].fillna(0)
    df_raw["insulin_on_board"] = (
        df_raw["insulin_dose_units"]
        .rolling(window=16, min_periods=1)
        .apply(iob_decay, raw=True)
        .fillna(0)
    )
else:
    df_raw["insulin_dose_units"] = 0
    df_raw["insulin_on_board"]   = 0

# ── 3g. Hours since last exercise ────────────────────────────────
def hours_since_last_event(series, threshold=0):
    result = []
    count  = 999
    for v in series:
        if v > threshold:
            count = 0
        else:
            count += 1
        result.append(count * 0.25)
    return result

df_raw["hours_since_exercise"] = hours_since_last_event(df_raw["exercise_signal"])

# ── 3h. Post-exercise danger window (4–8 hrs after exercise) ─────
df_raw["post_exercise_danger"] = (
    (df_raw["hours_since_exercise"] >= 4) &
    (df_raw["hours_since_exercise"] <= 8)
).astype(int)

# ── 3i. Hours since last meal ────────────────────────────────────
df_raw["hours_since_meal"] = hours_since_last_event(df_raw["meal_signal"])

# ── 3j. Skipped meal — insulin taken, no meal in last 3 hrs ──────
df_raw["recent_insulin"] = df_raw["insulin_dose_units"].rolling(window=12, min_periods=1).sum()
df_raw["recent_meal"]    = df_raw["meal_signal"].rolling(window=12, min_periods=1).sum()
df_raw["skipped_meal"]   = (
    (df_raw["recent_insulin"] > 0) & (df_raw["recent_meal"] == 0)
).astype(int)

# ── 3k. Heart rate ────────────────────────────────────────────────
if "heart_rate" in df_raw.columns:
    df_raw["heart_rate"] = df_raw["heart_rate"].fillna(df_raw["heart_rate"].median())
else:
    df_raw["heart_rate"] = 72.0

# ── 3l. Time features ────────────────────────────────────────────
df_raw["hour_of_day"] = df_raw["timestamp"].dt.hour
df_raw["nighttime"]   = (
    (df_raw["hour_of_day"] >= 22) | (df_raw["hour_of_day"] <= 6)
).astype(int)

# ── 3m. Clinical context fields ──────────────────────────────────
n = len(df_raw)
df_raw["sleep_hours"]      = np.clip(np.random.normal(6.5, 1.5, n), 0, 12)
df_raw["stress_level"]     = np.clip(np.random.normal(4, 2.5, n), 1, 10).astype(int)
df_raw["alcohol_consumed"] = np.random.choice([0, 1], n, p=[0.85, 0.15])

# ── 3n. Food spike detection ──────────────────────────────────────
df_raw["food_spike"] = (df_raw["glucose_mg_dl"].diff(4) >= 20).astype(int).fillna(0)

# ── 3o. PREDICTIVE: Future glucose at t+30min and t+60min ────────
df_raw["glucose_future_30min"] = df_raw["glucose_mg_dl"].shift(-2)
df_raw["glucose_future_60min"] = df_raw["glucose_mg_dl"].shift(-4)

# ── 3p. Estimated time to hypo (minutes) ─────────────────────────
def time_to_hypo(glucose, rate):
    if rate >= 0:
        return 999.0
    minutes = (glucose - 70.0) / abs(rate)
    return float(np.clip(minutes, 0, 120))

df_raw["time_to_hypo_min"] = df_raw.apply(
    lambda r: time_to_hypo(r["glucose_mg_dl"], r["glucose_rate_of_change"]), axis=1
)

# ── 3q. Estimated glucose floor ──────────────────────────────────
df_raw["estimated_glucose_floor"] = (
    df_raw["glucose_mg_dl"] +
    (df_raw["glucose_rate_of_change"] * 30) +
    (0.5 * df_raw["glucose_acceleration"] * 30 * 30)
).clip(lower=30)

# ─────────────────────────────────────────────────────────────────
# 4. PREDICTIVE RISK LABEL
# ─────────────────────────────────────────────────────────────────
def to_risk_predictive(row):
    g       = row["glucose_mg_dl"]
    g_30    = row["glucose_future_30min"]
    g_60    = row["glucose_future_60min"]
    rate    = row["glucose_rate_of_change"]
    accel   = row["glucose_acceleration"]
    hr      = row["heart_rate"]
    iob     = row["insulin_on_board"]
    hypo    = row["hypo_episodes_last_7days"]
    ped     = row["post_exercise_danger"]
    skip    = row["skipped_meal"]
    slp     = row["sleep_hours"]
    alc     = row["alcohol_consumed"]
    strs    = row["stress_level"]
    var     = row["glucose_variability_24hr"]
    night   = row["nighttime"]
    hsm     = row["hours_since_meal"]
    spike   = row["food_spike"]
    hse     = row["hours_since_exercise"]
    exdet   = row["exercise_auto_detected"]
    tth     = row["time_to_hypo_min"]
    floor   = row["estimated_glucose_floor"]

    if pd.isna(g_30): g_30 = g
    if pd.isna(g_60): g_60 = g

    score = 0

    # ── PRIMARY PREDICTIVE SIGNALS ────────────────────────────────
    if g_30 < 54:    score += 6
    elif g_30 < 70:  score += 5
    elif g_30 < 85:  score += 2

    if g_60 < 54:    score += 4
    elif g_60 < 70:  score += 3

    if tth < 15:     score += 5
    elif tth < 30:   score += 4
    elif tth < 60:   score += 2

    if floor < 54:   score += 3
    elif floor < 70: score += 2

    if spike:
        score = max(0, score - 4)

    # ── SUPPORTING RISK FACTORS ───────────────────────────────────
    if g < 54:    score += 3
    elif g < 70:  score += 2
    elif g < 85:  score += 1

    if rate < -2:      score += 3
    elif rate < -1:    score += 2
    elif rate < -0.5:  score += 1

    if accel < -0.5:   score += 2
    elif accel < -0.2: score += 1

    if hr > 100:  score += 2
    elif hr > 90: score += 1

    if iob > 3:   score += 3
    elif iob > 1: score += 1

    if hypo >= 3:   score += 3
    elif hypo >= 1: score += 2

    if ped: score += 2

    if exdet and g < 100: score += 2

    if skip: score += 3

    if slp < 5:   score += 2
    elif slp < 6: score += 1

    if alc: score += 2

    if strs >= 8:   score += 2
    elif strs >= 5: score += 1

    if var > 30:   score += 2
    elif var > 15: score += 1

    if night: score += 1

    if hsm > 6:   score += 2
    elif hsm > 3: score += 1

    if hse < 999 and hse > 12: score += 1

    if score >= 10: return "high"
    if score >= 5:  return "medium"
    return "low"

df_raw["risk"] = df_raw.apply(to_risk_predictive, axis=1)

df_raw["crash_in_30min"] = (df_raw["glucose_future_30min"] < 70).astype(int)
df_raw["crash_in_60min"] = (df_raw["glucose_future_60min"] < 70).astype(int)

print("\nRisk distribution BEFORE balancing:")
print(df_raw["risk"].value_counts())
print(f"\nRows predicting crash in 30 min: {int(df_raw['crash_in_30min'].sum())}")
print(f"Rows predicting crash in 60 min: {int(df_raw['crash_in_60min'].sum())}")
print(f"Auto-detected meal events:       {int(df_raw['meal_auto_detected'].sum())}")
print(f"Auto-detected exercise events:   {int(df_raw['exercise_auto_detected'].sum())}")
print(f"Food spikes detected:            {int(df_raw['food_spike'].sum())}")

# ─────────────────────────────────────────────────────────────────
# 5. FEATURES
#    Removed: meal_auto_detected, exercise_auto_detected
#    (both showed 0.000 importance — redundant with hours_since_* features)
# ─────────────────────────────────────────────────────────────────
features = [
    # Core glucose signals
    "glucose_mg_dl",
    "glucose_rate_of_change",
    "glucose_acceleration",
    "glucose_variability_24hr",
    "glucose_min_2hr",

    # Predictive projections
    "time_to_hypo_min",
    "estimated_glucose_floor",

    # Clinical signals
    "heart_rate",
    "insulin_on_board",
    "hypo_episodes_last_7days",

    # Auto-detected events (richer time-based encodings kept)
    "hours_since_exercise",
    "post_exercise_danger",
    "hours_since_meal",
    "food_spike",
    "skipped_meal",

    # Time context
    "hour_of_day",
    "nighttime",

    # User-input context (dashboard sliders)
    "sleep_hours",
    "stress_level",
    "alcohol_consumed",
]

X = df_raw[features].fillna(0)
y = df_raw["risk"]

le = LabelEncoder()
y_encoded = le.fit_transform(y)
print(f"\nClasses: {le.classes_}")

# ─────────────────────────────────────────────────────────────────
# 6. TRAIN / TEST SPLIT
# ─────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# ─────────────────────────────────────────────────────────────────
# 7. SMOTE — fix class imbalance
#    "low" class had only 10 rows → model never predicted it
#    SMOTE synthetically generates minority class samples
#    Applied ONLY to training data, never test data
# ─────────────────────────────────────────────────────────────────
print(f"\nClass distribution BEFORE SMOTE: {dict(zip(le.classes_, np.bincount(y_train)))}")

sm = SMOTE(random_state=42, k_neighbors=min(5, np.bincount(y_train).min() - 1))
X_train_s, y_train = sm.fit_resample(X_train_s, y_train)

print(f"Class distribution AFTER SMOTE:  {dict(zip(le.classes_, np.bincount(y_train)))}")

# ─────────────────────────────────────────────────────────────────
# 8. TRAIN XGBOOST
# ─────────────────────────────────────────────────────────────────
model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    eval_metric="mlogloss",
    verbosity=0,
)
model.fit(X_train_s, y_train)

# ─────────────────────────────────────────────────────────────────
# 9. EVALUATE
# ─────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test_s)
acc    = accuracy_score(y_test, y_pred)

print(f"\nTest accuracy: {acc:.2f} ({acc*100:.1f}%)")
print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

# Cross-val on SMOTE-balanced data
X_all_s = scaler.transform(X)
cv        = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Apply SMOTE per fold for honest cross-val
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.pipeline import Pipeline
smote_pipeline = ImbPipeline([
    ("smote", SMOTE(random_state=42, k_neighbors=2)),
    ("model", XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, min_child_weight=3,
        gamma=0.1, reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, eval_metric="mlogloss", verbosity=0,
    ))
])
cv_scores = cross_val_score(smote_pipeline, X_all_s, y_encoded, cv=cv, scoring="accuracy")
print(f"Cross-val (with SMOTE per fold): {cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")
print(f"All folds: {[round(s, 2) for s in cv_scores]}")

# ─────────────────────────────────────────────────────────────────
# 10. FEATURE IMPORTANCE
# ─────────────────────────────────────────────────────────────────
print("\nFeature importances:")
imp = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
for feat, val in imp.items():
    bar = "█" * int(val * 50)
    print(f"  {feat:<35} {bar} {val:.3f}")

# ─────────────────────────────────────────────────────────────────
# 11. SAVE
# ─────────────────────────────────────────────────────────────────
pickle.dump(model,    open(os.path.join(BASE, "model.pkl"),         "wb"))
pickle.dump(scaler,   open(os.path.join(BASE, "scaler.pkl"),        "wb"))
pickle.dump(le,       open(os.path.join(BASE, "label_encoder.pkl"), "wb"))
pickle.dump(features, open(os.path.join(BASE, "features.pkl"),      "wb"))

print(f"\n✅ Trained on {len(df_raw)} rows")
print(f"✅ Accuracy:   {acc*100:.1f}%")
print(f"✅ Cross-val:  {cv_scores.mean()*100:.1f}%")
print(f"✅ Features:   {len(features)} total (removed 2 zero-importance features)")
print(f"✅ SMOTE:               ON — low class balanced")
print(f"✅ Auto meal detection:     ON")
print(f"✅ Auto exercise detection: ON")
print(f"✅ Predictive labels:       ON (t+30min, t+60min forward shift)")
print(f"✅ Time-to-hypo estimate:   ON")
print(f"✅ Glucose floor estimate:  ON")
print("✅ Saved: model.pkl, scaler.pkl, label_encoder.pkl, features.pkl")