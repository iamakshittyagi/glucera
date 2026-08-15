/**
 * Local demo engine — the offline stand-in for the Flask/XGBoost backend.
 *
 * The feature engineering here is a direct port of `backend-api/routes/predict.py`
 * (same windows, same thresholds, same units), so the numbers on screen line up
 * with what the real API would report. What it CANNOT do is run the trained
 * XGBoost model in the browser, so classification falls back to the same
 * rule-based branch the backend itself uses when `model.pkl` is missing,
 * plus the backend's medical safety overrides.
 *
 * Every result is tagged `engine: "local-heuristic"` so the UI can be honest
 * about the fact that no trained model produced it.
 */

const HYPO = 70;

// ── Feature helpers (ported 1:1 from predict.py) ──────────────────
export function rateOfChange(g) {
  if (g.length < 2) return 0;
  return (g[g.length - 1] - g[g.length - 2]) / 15;
}

export function acceleration(g) {
  if (g.length < 3) return 0;
  const r1 = (g[g.length - 2] - g[g.length - 3]) / 15;
  const r2 = (g[g.length - 1] - g[g.length - 2]) / 15;
  return r2 - r1;
}

export function variability(g) {
  if (g.length < 2) return 0;
  const mean = g.reduce((a, b) => a + b, 0) / g.length;
  return Math.sqrt(g.reduce((a, b) => a + (b - mean) ** 2, 0) / g.length);
}

export function timeToHypo(glucose, rate) {
  if (glucose <= HYPO) return 0;
  if (rate >= 0) return 999;
  return Math.min(120, Math.max(0, (glucose - HYPO) / Math.abs(rate)));
}

export function glucoseFloor(glucose, rate, accel) {
  return Math.max(20, glucose + rate * 30 + 0.5 * accel * 30 * 30);
}

function hoursSinceLast(arr, threshold = 0) {
  for (let i = arr.length - 1, n = 0; i >= 0; i--, n++) {
    if (arr[i] > threshold) return n * 0.25;
  }
  return 999;
}

export function foodSuggestion(risk, glucose) {
  if (risk === "high" || glucose < 70)
    return "Eat 3 glucose tablets or drink 150ml of juice immediately.";
  if (risk === "medium" || glucose < 90)
    return "Have a small snack — a banana or handful of crackers.";
  return "Glucose looks stable. Keep up your current routine.";
}

export function safeToSleep(risk, glucose) {
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) {
    if (risk === "low" && glucose >= 108) return "Stable. Safe to sleep.";
    return "Eat a slow-release snack before bed (e.g. peanut butter on toast).";
  }
  return null;
}

/**
 * Offline prediction. Same request shape as POST /predict, same response shape.
 *
 * @param {object} payload  { glucose, meal_array, exercise_array, heart_rate,
 *                            insulin_on_board, hypo_episodes, sleep_hours,
 *                            stress_level, alcohol_consumed, skipped_meal }
 */
export function predictLocally(payload = {}) {
  const g = (payload.glucose || []).map(Number).filter((v) => !isNaN(v));
  if (g.length < 2) {
    return { error: "Provide at least 2 glucose readings." };
  }

  const current = g[g.length - 1];
  const hour    = new Date().getHours();
  const night   = hour >= 22 || hour <= 6;

  const heartRate      = Number(payload.heart_rate ?? 72);
  const insulinOnBoard = Number(payload.insulin_on_board ?? 0);
  const hypoEpisodes   = Number(payload.hypo_episodes ?? 0);
  const sleepHours     = Number(payload.sleep_hours ?? 7);
  const stressLevel    = Number(payload.stress_level ?? 3);
  const alcohol        = Number(payload.alcohol_consumed ?? 0);
  const skippedMeal    = Number(payload.skipped_meal ?? 0);

  const mealArray     = payload.meal_array     ?? new Array(g.length).fill(0);
  const exerciseArray = payload.exercise_array ?? new Array(g.length).fill(0);

  const rate  = rateOfChange(g);
  const accel = acceleration(g);
  const varia = variability(g);
  const tth   = timeToHypo(current, rate);
  const floor = glucoseFloor(current, rate, accel);

  const hoursSinceMeal     = hoursSinceLast(mealArray);
  const hoursSinceExercise = hoursSinceLast(exerciseArray);
  const postExerciseDanger = hoursSinceExercise >= 4 && hoursSinceExercise <= 8;
  // A long gap since the last meal is one of the strongest hypo predictors.
  const fasting = hoursSinceMeal >= 5;

  const foodSpike = g.length >= 5 && g[g.length - 1] - g[g.length - 5] >= 20;

  // ── Rule-based classification (mirrors the backend's no-model branch) ──
  let risk, confidence;
  if (current < HYPO)      { risk = "high";   confidence = 0.90; }
  else if (current < 90)   { risk = "medium"; confidence = 0.65; }
  else                     { risk = "low";    confidence = 0.20; }

  // A sustained fall that will cross 70 soon is a crash regardless of the
  // current value — this is the signal the trained model leans on hardest.
  if (rate < 0 && tth <= 30 && risk !== "high") {
    risk = "high";
    confidence = Math.max(confidence, 0.80);
  } else if (rate < 0 && tth <= 60 && risk === "low") {
    risk = "medium";
    confidence = Math.max(confidence, 0.70);
  }

  // Context that raises hypo probability in the clinical literature and in the
  // training data: active insulin, a skipped meal, alcohol, the post-exercise
  // window, prior hypos, short sleep, night-time.
  let contextLoad = 0;
  if (insulinOnBoard >= 3)   contextLoad += 0.10;
  if (insulinOnBoard >= 8)   contextLoad += 0.08;
  if (skippedMeal)           contextLoad += 0.10;
  if (fasting)               contextLoad += 0.06;
  if (alcohol)               contextLoad += 0.08;
  if (postExerciseDanger)    contextLoad += 0.07;
  if (hypoEpisodes >= 3)     contextLoad += 0.06;
  if (sleepHours < 6)        contextLoad += 0.04;
  if (stressLevel >= 8)      contextLoad += 0.03;
  if (night)                 contextLoad += 0.05;
  if (heartRate >= 100)      contextLoad += 0.04;

  if (contextLoad >= 0.25 && risk === "low")    { risk = "medium"; }
  if (contextLoad >= 0.30 && risk === "medium" && rate < 0) { risk = "high"; }
  confidence = Math.min(0.99, confidence + contextLoad * 0.5);

  // A clear rise is food or exercise recovery, not a crash — don't alarm.
  if (foodSpike && rate > 0 && current >= 90) {
    risk = "food_spike";
    confidence = Math.max(0.6, Math.min(0.9, confidence));
  }

  // ── Medical safety overrides (identical to the backend) ──
  if (current < 54)                          { risk = "high";   confidence = 0.99; }
  else if (current < 70)                     { risk = "high";   confidence = Math.max(confidence, 0.85); }
  else if (current < 85 && risk === "low")   { risk = "medium"; confidence = Math.max(confidence, 0.70); }

  // ── Pseudo class probabilities so the signals card still renders ──
  const classProbabilities = buildProbabilities(risk, confidence);

  // ── Crash projection ──
  let crashPredicted, crashInMinutes, estimatedFloor;
  if (risk === "high") {
    crashPredicted = true;
    crashInMinutes = tth > 0 ? Math.round(tth) : 0;
    estimatedFloor = Math.round(floor);
  } else if (rate < 0 && tth < 60) {
    crashPredicted = true;
    crashInMinutes = Math.round(tth);
    estimatedFloor = Math.round(floor);
  } else {
    crashPredicted = false;
    crashInMinutes = null;
    estimatedFloor = null;
  }

  const result = {
    risk,
    confidence: round(confidence, 2),
    class_probabilities: classProbabilities,

    current_glucose: current,
    trend: round(rate * 60, 1),

    crash_predicted: crashPredicted,
    crash_in_minutes: crashInMinutes,
    estimated_floor: estimatedFloor,

    time_to_hypo_min: tth >= 0 && tth < 999 ? Math.round(tth) : null,
    rate_of_change: round(rate, 3),
    acceleration: round(accel, 3),
    glucose_variability: round(varia, 2),
    hours_since_meal: hoursSinceMeal < 999 ? round(hoursSinceMeal, 2) : null,
    hours_since_exercise: hoursSinceExercise < 999 ? round(hoursSinceExercise, 2) : null,

    food_suggestion: foodSuggestion(risk, current),

    // Honest provenance: no trained model was involved.
    engine: "local-heuristic",
    demo: true,
  };

  const sleep = safeToSleep(risk, current);
  if (sleep) result.safe_to_sleep = sleep;

  return result;
}

function buildProbabilities(risk, confidence) {
  const c = Math.min(0.99, Math.max(0.34, confidence));
  const rest = (1 - c) / 2;
  const base = { low: rest, medium: rest, high: rest };
  if (risk === "food_spike") return { low: round(c, 3), medium: round(rest, 3), high: round(rest, 3) };
  base[risk] = c;
  return { low: round(base.low, 3), medium: round(base.medium, 3), high: round(base.high, 3) };
}

function round(v, dp) {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

// ─────────────────────────────────────────────────────────────────
// DEMO GLUCOSE STREAM — port of backend-api/glucose_stream.py
// Used by the Caregiver page when the WebSocket can't be reached.
// ─────────────────────────────────────────────────────────────────

function nextReading(current) {
  const drift     = gauss(0, 4);
  const reversion = (100 - current) * 0.05;
  const crash     = Math.random() < 0.1 ? -(8 + Math.random() * 10) : 0;
  const next      = current + drift + reversion + crash;
  return Math.round(Math.max(40, Math.min(300, next)) * 10) / 10;
}

function gauss(mean, sd) {
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Starts a simulated glucose stream. Calls `onReading({glucose, timestamp, history})`
 * every `intervalMs`. Returns a stop function.
 */
export function startDemoStream(onReading, intervalMs = 3000) {
  let current = 110;
  const history = [];

  const tick = () => {
    current = nextReading(current);
    history.push(current);
    if (history.length > 20) history.shift();
    onReading({
      glucose: current,
      timestamp: new Date().toISOString(),
      unit: "mg/dL",
      history: [...history],
    });
  };

  tick();
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}

/**
 * Turns a simulated reading into the alert shape the Caregiver page expects,
 * matching the payload `app.py` broadcasts over `alert_update`.
 */
export function readingToAlert(reading) {
  const g = reading.glucose;
  const risk = g < 70 ? "high" : g < 85 ? "medium" : "low";
  const time = new Date().toLocaleTimeString();

  if (risk === "high") {
    return {
      risk, glucose: g, timestamp: time,
      message: `Glucose crash detected at ${g} mg/dL. Patient needs assistance.`,
      demo: true,
    };
  }
  if (risk === "medium") {
    return {
      risk, glucose: g, timestamp: time,
      message: `Glucose drifting low (${g} mg/dL). Monitoring closely.`,
      demo: true,
    };
  }
  return {
    risk, glucose: g, timestamp: time,
    message: "Patient glucose is stable.",
    demo: true,
  };
}
