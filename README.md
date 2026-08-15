# Glucera

**Hypoglycaemia Risk Intelligence — a demonstration build.**

Glucera reads continuous glucose monitor (CGM) history and tries to answer one
question: *is this person about to crash, and how long do they have?* When the
answer is yes, it escalates — on-screen warning, spoken alert, browser
notification, a countdown, and an SOS to a caregiver watching a second screen.

> ### ⚠️ This is not a medical device
> Glucera is a student/demo project built around sample and synthetic data. It
> is **not** clinically validated, **not** regulated, and must **never** be used
> to make real treatment decisions. Every page carries a trial banner saying so.

---

## Table of contents

- [What problem it solves](#what-problem-it-solves)
- [How it works end to end](#how-it-works-end-to-end)
- [Repository layout](#repository-layout)
- [Running it locally](#running-it-locally)
- [Demo mode](#demo-mode)
- [The pages](#the-pages)
- [The API](#the-api)
- [The model](#the-model)
- [Known issue: the trained model over-predicts](#known-issue-the-trained-model-over-predicts)
- [CSV data format](#csv-data-format)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Security notes](#security-notes)

---

## What problem it solves

Hypoglycaemia — blood glucose falling below 70 mg/dL — is the acute danger of
insulin therapy. It is most dangerous overnight, when the person is asleep and
nobody is watching the numbers. A standard CGM alarms when you have *already*
crossed the threshold; by then the person may be too impaired to treat
themselves.

Glucera's premise is that the crash is visible in the trend before it is visible
in the value. Rather than alarming at 70 mg/dL, it projects the curve forward:

- **Rate of change** — how fast glucose is falling, in mg/dL per minute
- **Acceleration** — whether the fall is steepening or levelling off
- **Time to hypo** — minutes until the curve crosses 70 mg/dL at the current rate
- **Estimated floor** — where glucose lands if the trend holds for 30 more minutes

Around that it layers the context that makes a fall dangerous rather than
routine: insulin still active in the body, a skipped meal, alcohol, the 4–8 hour
post-exercise window, prior hypo episodes, short sleep, and the time of day.

---

## How it works end to end

```
CGM CSV ──▶ Dashboard ──▶ POST /predict ──▶ XGBoost model ──▶ risk + timing
                │                                                    │
                │                                    ┌───────────────┴──────────────┐
                │                                    ▼                              ▼
                │                              risk = low/medium              risk = high
                │                              show status only                     │
                │                                                                   ▼
                │                                              ┌────────────────────────────────┐
                │                                              │ • crash popup, 3s countdown    │
                │                                              │ • browser notification         │
                │                                              │ • spoken voice alert           │
                │                                              │ • auto-SOS timer starts        │
                │                                              └────────────────┬───────────────┘
                │                                                               │
                └──────────────────────────────────── POST /sos ────────────────┘
                                                          │
                                                          ▼
                                            WebSocket: alert_update
                                                          │
                                                          ▼
                                              Caregiver page lights up
```

The caregiver screen is the point of the whole thing. It holds an open
WebSocket, and when the patient's dashboard escalates, the caregiver's page
turns red, announces the emergency out loud, and shows the glucose value and a
Google Maps link to the patient's location.

---

## Repository layout

```
glucera/
└── main/
    ├── src/                      React 19 frontend (Vite)
    │   ├── pages/
    │   │   ├── Home.jsx            Landing page — full-bleed hero video
    │   │   ├── Dashboard.jsx       The core screen: upload, predict, alert, SOS
    │   │   ├── Caregiver.jsx       Live watch screen over WebSocket
    │   │   ├── History.jsx         Past readings, filterable by risk
    │   │   └── HowItWorks.jsx      Explainer + FAQ
    │   ├── components/
    │   │   ├── Navbar.jsx          Header — overlay + solid variants
    │   │   ├── DemoBanner.jsx      Trial notice + live/demo connection state
    │   │   └── SOSButton.jsx       Standalone geolocated SOS button
    │   ├── utils/
    │   │   ├── backend.js          API client — timeouts, demo-mode switching
    │   │   ├── demoEngine.js       Offline risk engine + glucose simulator
    │   │   ├── api.js              Prediction helpers
    │   │   ├── AlertManager.js     Notification / speech / caregiver alerts
    │   │   └── firebase-config.js  FCM push registration
    │   └── assets/demo/            Bundled sample CSV scenarios
    │
    ├── backend-api/              Flask + SocketIO + XGBoost
    │   ├── app.py                  Entry point, SOS + caregiver alert routes
    │   ├── glucose_stream.py       Background simulator, emits every 3s
    │   ├── routes/predict.py       POST /predict — features + model + rules
    │   ├── routes/glucose.py       GET /glucose — latest reading
    │   └── model.pkl, scaler.pkl, label_encoder.pkl, features.pkl
    │
    └── data-simulator/           Model training
        ├── train.py                Feature engineering + XGBoost + SMOTE
        ├── simulator.py            Synthetic CGM generator
        └── dataset/*.csv           Training and demo data
```

---

## Running it locally

### 1. Frontend (this is all you need for a demo)

```bash
cd main
npm install
npm run dev
```

Open **http://localhost:5173**. The frontend targets the deployed backend at
`https://glucera.onrender.com` by default and falls back to a local engine if it
can't reach it, so the site is fully usable on its own.

### 2. Backend (optional — for real model predictions)

```bash
cd main/backend-api
pip install -r requirements.txt
python app.py
```

Serves on **http://localhost:8000**. Point the frontend at it:

```bash
# main/.env.local
VITE_API_URL=http://localhost:8000
```

> The backend needs Python 3.11 per `.python-version`, though it runs on 3.9+.
> `firebase-admin` is listed in requirements but is not imported by `app.py`, so
> the server starts without it.

### 3. Retraining the model (optional)

```bash
cd main/data-simulator
pip install -r requirements.txt
python train.py
cp model.pkl scaler.pkl label_encoder.pkl features.pkl ../backend-api/
```

---

## Demo mode

Glucera is deployed as a public trial, so the UI is built never to hard-fail.
Every backend call goes through `src/utils/backend.js`, which gives each request
a deadline and flips the whole app into demo mode the moment one is missed.

| | Live | Demo |
|---|---|---|
| Predictions | XGBoost via `POST /predict` | `predictLocally()` in the browser |
| Glucose feed | WebSocket `glucose_update` | Local random-walk simulator |
| SOS / caregiver alerts | Delivered to the backend | No-ops, UI flow unchanged |
| Banner pill | 🟢 Live — real model predictions | 🔵 Demo mode — simulated locally |

The switch is automatic and needs no configuration. It triggers on timeout,
network error, or any non-2xx response. Render's free tier cold-starts in about
8 seconds, so the first health probe is given a 15-second budget and the
Dashboard warms the backend on mount rather than making the first prediction pay
for it.

`demoEngine.js` is a direct port of the backend's feature engineering — same
windows, same thresholds, same units — so the numbers line up with what the real
API would report. What it cannot do is run XGBoost in the browser, so
classification uses the same rule-based branch the backend itself falls back to
when `model.pkl` is missing, plus the identical medical safety overrides. Every
local result is tagged `engine: "local-heuristic"` so nothing pretends a trained
model produced it.

### Sample scenarios

The Dashboard ships with two bundled CSVs so it is usable with nothing to
upload:

| Scenario | What it shows |
|---|---|
| **Stable Day** | A normal day — meals, a post-meal peak, a walk, no hypo |
| **Overnight Crash** | Dinner, a bolus, an evening run, then a steady overnight decline that crosses 70 mg/dL while asleep. Fires the full alert chain. |

---

## The pages

| Route | What it does |
|---|---|
| `/` | Landing page. Full-bleed hero video with the header painted directly on top of it. |
| `/dashboard` | Upload a CGM CSV or load a sample. Shows risk badge, clinical risk score out of 100, prediction signals, glucose chart with hypo/warn threshold lines, food suggestion, and the SOS button. Adjustable clinical context (insulin on board, sleep, stress, heart rate, skipped meal, alcohol) re-runs the prediction live. |
| `/caregiver` | Open this on a second device. Holds a WebSocket, turns red on emergency, speaks the alert aloud, and offers "Mark Patient as Safe". |
| `/history` | Past readings filterable by risk level. |
| `/howitworks` | Six-step explainer and FAQ. |

### What happens at high risk

1. A modal appears with the current glucose, minutes to crash, and projected floor
2. A 3-second countdown starts; SOS fires automatically unless dismissed
3. A browser notification is sent
4. A voice alert speaks *"Your sugar level is getting low"*
5. The caregiver endpoint is notified
6. A longer auto-SOS timer runs, sized to the predicted minutes-to-crash

---

## The API

Base URL: `https://glucera.onrender.com` (or `http://localhost:8000`)

### `POST /predict`

```json
{ "glucose": [110, 115, 120, 90, 70], "heart_rate": 72, "insulin_on_board": 0 }
```

```json
{
  "risk": "high",
  "confidence": 0.99,
  "model_accuracy": 0.915,
  "class_probabilities": { "high": 0.994, "low": 0.004, "medium": 0.002 },
  "current_glucose": 70.0,
  "trend": -80.0,
  "crash_predicted": true,
  "crash_in_minutes": 0,
  "estimated_floor": 54,
  "time_to_hypo_min": 0,
  "rate_of_change": -1.333,
  "food_suggestion": "Eat 3 glucose tablets or drink 150ml of juice immediately."
}
```

Optional fields: `meal_array`, `exercise_array`, `hypo_episodes`, `sleep_hours`,
`stress_level`, `alcohol_consumed`, `skipped_meal`.

| Risk | Badge | Action |
|---|---|---|
| `low` | 🟢 All clear | None |
| `medium` | 🟡 Caution | Monitor |
| `high` | 🔴 Danger | Full alert chain |
| `food_spike` | 🔵 Food spike | Rise is a meal, suppress alerts |

### Other endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/glucose` | Latest simulated reading |
| `GET` | `/latest-alert` | Current caregiver alert state |
| `GET` | `/ping` | Health check |
| `POST` | `/alert-caregiver` | Raise a caregiver alert |
| `POST` | `/sos` | Emergency with geolocation |
| `POST` | `/reset-alert` | Mark the patient safe |

### WebSocket

| Event | Direction | Payload |
|---|---|---|
| `caregiver_join` | client → server | — |
| `alert_update` | server → client | `{ risk, glucose, timestamp, message }` |
| `glucose_update` | server → client | `{ glucose, timestamp, unit, history }` |

---

## The model

XGBoost multi-class classifier over 20 features, trained by
`data-simulator/train.py`:

- **Glucose** — value, rate of change, acceleration, 24h variability, 2h minimum
- **Projections** — time to hypo, estimated glucose floor
- **Clinical** — heart rate, insulin on board, hypo episodes in the last 7 days
- **Events** — hours since meal, hours since exercise, post-exercise danger window, food spike, skipped meal
- **Time** — hour of day, nighttime flag
- **Self-reported** — sleep hours, stress level, alcohol

Training labels come from `to_risk_predictive()`, a weighted clinical score
applied to *forward-shifted* glucose (t+30min and t+60min), so the model learns
to predict a crash rather than describe one. SMOTE balances the classes — the
`low` class had only 10 real rows. Reported accuracy is 91.5%.

Regardless of what the model returns, `predict.py` applies hard safety
overrides: below 54 mg/dL is always high risk at 0.99 confidence, below 70 is
always high, and below 85 is never low.

---

## Known issue: the trained model over-predicts

**The committed `model.pkl` classifies essentially every input as `high` risk.**
Verified against both the local backend and the deployed Render instance:

| Input | Model output |
|---|---|
| Flat 110 mg/dL × 10 readings | `high`, 98% confidence |
| Flat 100 mg/dL × 10 readings | `high`, 98% confidence |
| Rising 90 → 140 mg/dL | `high`, 75% confidence |
| Gentle fall 120 → 108 mg/dL | `high`, 98% confidence |
| Steep fall 120 → 75 mg/dL | `high`, 100% confidence |

A person sitting at a flat, healthy 110 mg/dL should be `low`. This means the
**Stable Day** sample scenario shows HIGH RISK and fires the alert chain
whenever the live backend is reachable — the local demo engine correctly reports
it as `low`.

The likely cause is in `train.py`: `to_risk_predictive()` scores nearly every
row above the `high` threshold of 10, leaving almost no genuine `low` examples
(the comment at line 365 notes the `low` class had only 10 rows), and SMOTE then
synthesises a minority class the model never learns to separate. Worth
re-checking the score thresholds at `train.py:286-288` and the class balance
printed before SMOTE.

**Workaround** — force the local engine, which behaves sensibly:

```bash
# main/.env.local
VITE_FORCE_DEMO=true
```

---

## CSV data format

```csv
timestamp,glucose_mg_dl,meal_taken,meal_type,insulin_dose_units,exercise_minutes,heart_rate,notes
2024-05-13 20:30:00,152,1,dinner,6,0,74,Dinner + bolus
2024-05-13 20:45:00,168,0,,0,0,77,Post-meal peak
```

| Column | Required | Notes |
|---|---|---|
| `timestamp` | yes | Any parseable datetime; readings assumed 15 min apart |
| `glucose_mg_dl` | yes | The only column the prediction strictly needs |
| `meal_taken` | no | `1` or `0` |
| `insulin_dose_units` | no | Units |
| `exercise_minutes` | no | Minutes; any value > 0 counts as exercise |
| `heart_rate` | no | bpm, defaults to 72 |
| `meal_type`, `notes` | no | Free text, display only |

At least 2 readings are required. The chart shows the most recent 20.

---

## Configuration

Create `main/.env.local`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://glucera.onrender.com` | Backend base URL |
| `VITE_FORCE_DEMO` | `false` | `true` bypasses the backend entirely |

---

## Deployment

**Frontend — Vercel.** `vercel.json` rewrites all routes to `/` so client-side
routing works on refresh. Build with `npm run build`, output in `dist/`.

**Backend — Render.** `render.yaml` is pre-configured:

```yaml
startCommand: gunicorn --worker-class eventlet -w 1 app:app
```

`model.pkl` and `scaler.pkl` must be committed for real predictions. On the free
tier the service sleeps after inactivity; `app.py` runs a self-ping every 10
minutes to mitigate this, and the frontend's demo fallback covers the gap
regardless.

---

## Security notes

Two things to address before this goes anywhere near real use:

1. **`backend-api/serviceAccountKey.json` is committed to the repository.** That
   is a Firebase private key in git history. It should be rotated, removed from
   history, and loaded from an environment variable instead.
2. **Every endpoint is unauthenticated.** `/sos`, `/alert-caregiver` and
   `/reset-alert` accept anonymous POSTs and broadcast to all connected
   caregivers. `CORS(app)` and `cors_allowed_origins="*"` allow any origin. Fine
   for a demo, unacceptable with real patient data.

The Firebase web config and VAPID key in `src/utils/firebase-config.js` are
public by design and are not a leak.

---

## Tech stack

**Frontend** React 19 · Vite 8 · React Router 7 · Recharts 3 · socket.io-client 4 · Firebase 12 · Aldrich (Google Fonts)
**Backend** Flask · Flask-SocketIO · Flask-CORS · gunicorn + eventlet
**ML** XGBoost 2.0.3 · scikit-learn 1.6.1 · imbalanced-learn (SMOTE) · pandas · numpy
