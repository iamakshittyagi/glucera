/**
 * Central backend client.
 *
 * Glucera is deployed as a public trial, so the UI must never hard-fail when the
 * API is asleep, slow or gone. Every call goes through here, every call has a
 * deadline, and the app is told to switch to demo mode the moment one is missed.
 *
 * Connection modes:
 *   "checking" — probe in flight, nothing decided yet
 *   "live"     — backend answered, real XGBoost predictions in use
 *   "demo"     — backend unreachable, local simulation in use
 */

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://glucera.onrender.com";

// Render's free tier cold-starts in ~8s, so the first probe gets a long leash.
const PROBE_TIMEOUT_MS = 15000;
const CALL_TIMEOUT_MS  = 12000;

/**
 * Set VITE_FORCE_DEMO=true to bypass the backend entirely and always use the
 * local engine. Useful when the deployed model is misbehaving and you need a
 * predictable demo — see the "Known issue" section of the README.
 */
export const FORCE_DEMO = import.meta.env.VITE_FORCE_DEMO === "true";

let mode = FORCE_DEMO ? "demo" : "checking";
const listeners = new Set();

export function getMode() {
  return mode;
}

export function isDemo() {
  return mode === "demo";
}

function setMode(next) {
  if (next === mode) return;
  mode = next;
  listeners.forEach((fn) => fn(mode));
}

/** Subscribe to mode changes. Returns an unsubscribe function. */
export function onModeChange(fn) {
  listeners.add(fn);
  fn(mode); // fire immediately with current state
  return () => listeners.delete(fn);
}

/** Force demo mode — used by the "Demo Mode" toggle in the UI. */
export function forceDemoMode(on) {
  setMode(on ? "demo" : "checking");
  if (!on) probeBackend();
}

/** fetch() with a hard deadline. Rejects on timeout, network error or non-2xx. */
export async function apiFetch(path, options = {}, timeoutMs = CALL_TIMEOUT_MS) {
  if (FORCE_DEMO) throw new Error("Demo mode forced via VITE_FORCE_DEMO");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    setMode("live");
    return res;
  } catch (err) {
    setMode("demo");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Convenience: apiFetch + JSON parse. */
export async function apiJson(path, options, timeoutMs) {
  const res = await apiFetch(path, options, timeoutMs);
  return res.json();
}

/**
 * One-shot health check. Cached, so every page can call it freely on mount.
 * Never throws — it resolves to true/false and updates the mode.
 */
let probePromise = null;
export function probeBackend() {
  if (FORCE_DEMO) return Promise.resolve(false);
  if (probePromise) return probePromise;
  probePromise = apiFetch("/ping", { method: "GET" }, PROBE_TIMEOUT_MS)
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      // Allow a fresh probe after 30s so a backend that wakes up is picked up.
      setTimeout(() => { probePromise = null; }, 30000);
    });
  return probePromise;
}

/**
 * POST that is allowed to fail silently — SOS, caregiver alerts, reset.
 * In demo mode these are no-ops that still resolve, so the UI flow is identical.
 */
export async function apiPostQuiet(path, body) {
  try {
    await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }, 6000);
    return true;
  } catch {
    return false;
  }
}
