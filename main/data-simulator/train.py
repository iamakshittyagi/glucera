import pandas as pd
import numpy as np
import os
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier

BASE = os.path.dirname(os.path.abspath(__file__))

# ── Load Pima Indians ──────────────────────────────────
df1 = pd.read_csv(os.path.join(BASE, "dataset", "diabetes.csv"))
print(f"Pima Indians: {len(df1)} rows")

zero_cols = ["Glucose", "BloodPressure", "BMI", "Insulin"]
df1[zero_cols] = df1[zero_cols].replace(0, np.nan)
df1.fillna(df1.median(numeric_only=True), inplace=True)

np.random.seed(42)
n1 = len(df1)
df1["hour_of_day"]            = np.random.randint(0, 24, n1)
df1["hours_since_meal"]       = np.random.randint(1, 8, n1)
df1["hours_since_medication"] = np.random.randint(0, 6, n1)
df1["activity_level"]         = np.random.randint(0, 3, n1)
df1["Glucose"]                = df1["Glucose"] + np.random.normal(0, 8, n1)

# ── Load Glucera dummy data ────────────────────────────
df2_raw = pd.read_csv(os.path.join(BASE, "dataset", "glucera_dummy_data.csv"))
df2_raw["timestamp"] = pd.to_datetime(df2_raw["timestamp"])
df2_raw["hour_of_day"] = df2_raw["timestamp"].dt.hour
print(f"Glucera dummy: {len(df2_raw)} rows")

df2 = pd.DataFrame()
df2["Glucose"]                  = df2_raw["glucose_mg_dl"].astype(float)
df2["BloodPressure"]            = 72.0
df2["BMI"]                      = 27.5
df2["Age"]                      = 34.0
df2["Insulin"]                  = df2_raw["insulin_dose_units"] * 10 + 80
df2["DiabetesPedigreeFunction"] = 0.42
df2["Pregnancies"]              = 1.0
df2["SkinThickness"]            = 20.0
df2["hour_of_day"]              = df2_raw["hour_of_day"]
df2["hours_since_meal"]         = df2_raw["meal_taken"].apply(
    lambda x: 0 if x == 1 else np.random.randint(1, 6))
df2["hours_since_medication"]   = df2_raw["insulin_dose_units"].apply(
    lambda x: 0 if x > 0 else np.random.randint(1, 5))
df2["activity_level"]           = df2_raw["exercise_minutes"].apply(
    lambda x: 2 if x > 20 else (1 if x > 0 else 0))
df2["Outcome"]                  = df2_raw["glucose_mg_dl"].apply(
    lambda x: 1 if x < 100 else 0)

# ── Combine ────────────────────────────────────────────
df = pd.concat([df1, df2], ignore_index=True)
print(f"Combined: {len(df)} rows total")

# ── Risk labels ────────────────────────────────────────
def to_risk(row):
    g    = row["Glucose"]
    h    = row["hour_of_day"]
    m    = row["hours_since_meal"]
    med  = row["hours_since_medication"]
    act  = row["activity_level"]
    out  = row["Outcome"]

    score = 0
    if g < 54:   score += 5
    elif g < 70: score += 4
    elif g < 85: score += 2
    elif g < 100: score += 1

    if out == 1: score += 2
    if 2 <= h <= 5: score += 2
    if m > 5:       score += 2
    if med < 2:     score += 1
    if act == 2:    score += 1

    if score >= 6:  return "high"
    if score >= 3:  return "medium"
    return "low"

df["risk"] = df.apply(to_risk, axis=1)

print("\nRisk distribution:")
print(df["risk"].value_counts())

# ── Features ───────────────────────────────────────────
features = [
    "Glucose", "BloodPressure", "BMI", "Age",
    "Insulin", "DiabetesPedigreeFunction",
    "Pregnancies", "SkinThickness",
    "hour_of_day", "hours_since_meal",
    "hours_since_medication", "activity_level",
]

X = df[features]
y = df["risk"]

le = LabelEncoder()
y_encoded = le.fit_transform(y)
print(f"Classes: {le.classes_}")

# ── Split ──────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)

# ── Scale ──────────────────────────────────────────────
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# ── Train XGBoost ──────────────────────────────────────
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

# ── Evaluate ───────────────────────────────────────────
y_pred = model.predict(X_test_s)
acc = accuracy_score(y_test, y_pred)
print(f"\nTest accuracy: {acc:.2f} ({acc*100:.1f}%)")
print(classification_report(y_test, y_pred, target_names=le.classes_))

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, scaler.transform(X), y_encoded, cv=cv)
print(f"Cross-val: {cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")
print(f"All folds: {[round(s,2) for s in cv_scores]}")

# ── Feature importance ─────────────────────────────────
print("\nTop features:")
imp = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
for feat, val in imp.items():
    bar = "█" * int(val * 40)
    print(f"  {feat:<30} {bar} {val:.3f}")

# ── Save ───────────────────────────────────────────────
pickle.dump(model,    open(os.path.join(BASE, "model.pkl"),         "wb"))
pickle.dump(scaler,   open(os.path.join(BASE, "scaler.pkl"),        "wb"))
pickle.dump(le,       open(os.path.join(BASE, "label_encoder.pkl"), "wb"))
pickle.dump(features, open(os.path.join(BASE, "features.pkl"),      "wb"))

print(f"\n✅ Trained on {len(df)} rows (Pima + Glucera)")
print(f"✅ Accuracy: {acc*100:.1f}%")
print(f"✅ Cross-val: {cv_scores.mean()*100:.1f}%")
print("✅ Saved: model.pkl, scaler.pkl, label_encoder.pkl, features.pkl")