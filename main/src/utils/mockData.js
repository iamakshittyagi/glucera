export const mockGlucoseReadings = [
  { time: "08:00", glucose: 110 },
  { time: "08:15", glucose: 105 },
  { time: "08:30", glucose: 98 },
  { time: "08:45", glucose: 90 },
  { time: "09:00", glucose: 82 },
  { time: "09:15", glucose: 74 },
  { time: "09:30", glucose: 68 },
  { time: "09:45", glucose: 61 },
  { time: "10:00", glucose: 55 },
  { time: "10:15", glucose: 50 },
];

export const mockRiskData = {
  risk: "high",
  confidence: 0.87,
};

export const mockAlerts = [
  { id: 1, time: "10:15 AM", message: "High risk detected — glucose dropping fast", level: "high" },
  { id: 2, time: "09:45 AM", message: "Medium risk — monitor closely", level: "medium" },
  { id: 3, time: "08:00 AM", message: "All clear — glucose stable", level: "low" },
];