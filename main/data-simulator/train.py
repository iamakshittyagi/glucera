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

# ── Load ──────────────────────────────────────────────
df = pd.read_csv(os.path.join(BASE, "dataset", "diabetes.csv"))
print(f"Loaded: {df.shape[0]} rows")

# ── Fix zeros ─────────────────────────────────────────
zero_cols = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
df[zero_cols] = df[zero_cols].replace(0, np.nan)
df.fillna(df.median(numeric_only=True), inplace=True)

# ── Add time context features ─────────────────────────
np.random.seed(42)
n = len(df)
df["hour_of_day"]            = np.random.randint(0, 24, n)
df["hours_since_meal"]       = np.random.randint(1, 8, n)
df["hours_since_medication"] = np.random.randint(0, 6, n)
df["activity_level"]         = np.random.randint(0, 3, n)

# ── Add noise to make it realistic ────────────────────
df["Glucose"] = df["Glucose"] + np.random.normal(0, 8, n)
df["Insulin"] = df["Insulin"] + np.random.normal(0, 15, n)

# ── Risk labels using OUTCOME not just glucose ────────
# Use the actual medical Outcome column (0/1) + glucose
# This avoids the model just learning a glucose threshold
def to_risk(row):
    g       = row["Glucose"]
    outcome = row["Outcome"]   # real diabetic diagnosis
    meal    = row["hours_since_meal"]
    hour    = row["hour_of_day"]
    med     = row["hours_since_medication"]
    act     = row["activity_level"]

    score = 0

    # Glucose contribution
    if g < 70:   score += 4
    elif g < 85: score += 2
    elif g < 100: score += 1

    # Diabetic patient = higher base risk
    if outcome == 1: score += 2

    # Time factors
    if 2 <= hour <= 5: score += 2      # nighttime
    if meal > 5:       score += 2      # long since meal
    if med < 2:        score += 1      # recent medication
    if act == 2:       score += 1      # intense exercise

    # Convert score to risk
    if score >= 6:   return "high"
    if score >= 3:   return "medium"
    return "low"

df["risk"] = df.apply(to_risk, axis=1)

print("\nRisk distribution:")
print(df["risk"].value_counts())
print(f"High: {(df['risk']=='high').sum()} | Medium: {(df['risk']=='medium').sum()} | Low: {(df['risk']=='low').sum()}")

# ── Features ──────────────────────────────────────────
features = [
    "Glucose",
    "BloodPressure",
    "BMI",
    "Age",
    "Insulin",
    "DiabetesPedigreeFunction",
    "Pregnancies",
    "SkinThickness",
    "hour_of_day",
    "hours_since_meal",
    "hours_since_medication",
    "activity_level",
]

X = df[features]
y = df["risk"]

# ── Encode ────────────────────────────────────────────
le = LabelEncoder()
y_encoded = le.fit_transform(y)
print(f"\nClasses: {le.classes_}")

# ── Split ─────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.25,
    random_state=42,
    stratify=y_encoded
)

# ── Scale ─────────────────────────────────────────────
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# ── Train XGBoost ─────────────────────────────────────
model = XGBClassifier(
    n_estimators=200,
    max_depth=4,           # shallower = less overfit
    learning_rate=0.08,
    subsample=0.75,
    colsample_bytree=0.75,
    min_child_weight=5,    # needs 5 samples to split
    gamma=0.2,             # pruning
    reg_alpha=0.3,
    reg_lambda=1.5,
    random_state=42,
    eval_metric="mlogloss",
    verbosity=0,
)
model.fit(X_train_s, y_train)

# ── Evaluate ──────────────────────────────────────────
y_pred = model.predict(X_test_s)
acc = accuracy_score(y_test, y_pred)
print(f"\nTest accuracy: {acc:.2f} ({acc*100:.1f}%)")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ── Cross validation ──────────────────────────────────
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, scaler.transform(X), y_encoded, cv=cv)
print(f"Cross-val: {cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")
print(f"All folds: {[round(s,2) for s in cv_scores]}")

# ── Feature importance ────────────────────────────────
print("\nTop features:")
imp = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
for feat, val in imp.items():
    bar = "█" * int(val * 40)
    print(f"  {feat:<30} {bar} {val:.3f}")

# ── Save ──────────────────────────────────────────────
pickle.dump(model,    open(os.path.join(BASE, "model.pkl"),         "wb"))
pickle.dump(scaler,   open(os.path.join(BASE, "scaler.pkl"),        "wb"))
pickle.dump(le,       open(os.path.join(BASE, "label_encoder.pkl"), "wb"))
pickle.dump(features, open(os.path.join(BASE, "features.pkl"),      "wb"))

print(f"\n✅ Saved all files!")
print(f"✅ Realistic accuracy: {acc*100:.1f}%")
print(f"✅ Cross-val: {cv_scores.mean()*100:.1f}%")