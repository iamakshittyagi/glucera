const API_URL = "https://glucera.onrender.com"

export const getPrediction = async (glucoseArray) => {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ glucose: glucoseArray })
  })
  return res.json()
}

export const getLatestGlucose = async () => {
  const res = await fetch(`${API_URL}/glucose`)
  return res.json()
}