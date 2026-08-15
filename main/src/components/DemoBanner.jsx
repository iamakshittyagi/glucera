import React, { useEffect, useState } from "react";
import { onModeChange, probeBackend, getMode } from "../utils/backend";
import "./DemoBanner.css";

/**
 * Trial notice + live/demo connection state.
 *
 * Always visible, because Glucera is a demo build and must never be mistaken
 * for a medical device. The right-hand pill reports whether the numbers on
 * screen came from the real backend or the local simulator.
 */
export default function DemoBanner() {
  const [mode, setMode] = useState(getMode());

  useEffect(() => {
    const unsub = onModeChange(setMode);
    probeBackend();
    return unsub;
  }, []);

  const state = {
    checking: { cls: "checking", label: "Connecting to AI backend…" },
    live:     { cls: "live",     label: "Live — real model predictions" },
    demo:     { cls: "demo",     label: "Demo mode — simulated locally" },
  }[mode];

  return (
    <div className="demo-banner">
      <span className="demo-banner-tag">TRIAL</span>
      <p className="demo-banner-text">
        Demonstration build with sample data — <strong>not a medical device</strong>.
        Never use it for real treatment decisions.
      </p>
      <span className={`demo-banner-pill ${state.cls}`}>
        <span className="demo-banner-dot" />
        {state.label}
      </span>
    </div>
  );
}
