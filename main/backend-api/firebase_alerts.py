import firebase_admin
from firebase_admin import credentials, messaging

# ─── INIT ─────────────────────────────────────────────────────────────────────
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# ─── SEND PUSH TO CAREGIVER ───────────────────────────────────────────────────
def send_push_to_caregiver(caregiver_token, risk_level, confidence, mins_to_hypo=None):
    if not caregiver_token:
        print("No caregiver token — skipping push")
        return

    if risk_level == "high":
        title = " GLUCERA EMERGENCY"
        body  = f"Glucose crash predicted in {mins_to_hypo or '~20'} mins. Confidence: {round(confidence * 100)}%. Check on your patient NOW."
    else:
        title = " Glucera Warning"
        body  = f"Glucose dropping. Confidence: {round(confidence * 100)}%. Patient may need a snack."

    message = messaging.Message(
        token=caregiver_token,
        notification=messaging.Notification(title=title, body=body),
        webpush=messaging.WebpushConfig(
            notification=messaging.WebpushNotification(
                icon="https://glucera.vercel.app/favicon.png",
                badge="https://glucera.vercel.app/favicon.png",
                require_interaction=True,
            )
        ),
    )

    try:
        response = messaging.send(message)
        print(f"Push sent successfully: {response}")
        return response
    except Exception as e:
        print(f"Push failed: {e}")