import { apiJson } from "./backend";
import { predictLocally } from "./demoEngine";

/**
 * Thin helpers over the backend. Both fall back to the local demo engine
 * rather than throwing, so callers always get a usable result.
 */

export const getPrediction = async (glucoseArray) => {
  try {
    return await apiJson("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ glucose: glucoseArray }),
    });
  } catch {
    return predictLocally({ glucose: glucoseArray });
  }
};

export const getLatestGlucose = async () => {
  try {
    return await apiJson("/glucose");
  } catch {
    // No live stream available — hand back a plausible resting reading.
    return {
      glucose: 100 + Math.round((Math.random() - 0.5) * 20),
      timestamp: new Date().toISOString(),
      unit: "mg/dL",
      demo: true,
    };
  }
};
