import React, { useEffect } from "react";
import { probeBackend } from "../utils/backend";
import "./DemoBanner.css";

/**
 * Safety notice shown on every interior page.
 *
 * The live/demo connection state is deliberately NOT surfaced here — the
 * fallback in utils/backend.js is silent by design, so the site behaves
 * identically to the visitor whether or not the API is reachable.
 */
export default function DemoBanner() {
  // Still warm the backend on mount; just don't report on it.
  useEffect(() => { probeBackend(); }, []);

  return (
    <div className="demo-banner">
      <p className="demo-banner-text">
        Sample data for demonstration — <strong>not a medical device</strong>.
        Never use it for real treatment decisions.
      </p>
    </div>
  );
}
