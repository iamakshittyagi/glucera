import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "./History.css";

const dummyData = [
  { timestamp: "2024-01-15 06:00", glucose: 98,  meal: "—",         insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 06:45", glucose: 89,  meal: "—",         insulin: 2, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 07:15", glucose: 82,  meal: "Breakfast",  insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 09:00", glucose: 96,  meal: "—",         insulin: 0, exercise: 20, risk: "low"    },
  { timestamp: "2024-01-15 10:30", glucose: 74,  meal: "—",         insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 10:45", glucose: 70,  meal: "—",         insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 11:15", glucose: 62,  meal: "—",         insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 11:30", glucose: 58,  meal: "Snack",      insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 11:45", glucose: 72,  meal: "—",         insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 12:30", glucose: 105, meal: "Lunch",      insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 13:00", glucose: 122, meal: "—",         insulin: 2, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 15:30", glucose: 70,  meal: "—",         insulin: 0, exercise: 30, risk: "medium" },
  { timestamp: "2024-01-15 16:30", glucose: 51,  meal: "—",         insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 16:45", glucose: 48,  meal: "—",         insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 17:00", glucose: 52,  meal: "Chocolate",  insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 18:30", glucose: 98,  meal: "Dinner",     insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 19:00", glucose: 118, meal: "—",         insulin: 2, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 22:00", glucose: 80,  meal: "—",         insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-16 01:00", glucose: 56,  meal: "—",         insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 02:00", glucose: 49,  meal: "—",         insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 06:00", glucose: 86,  meal: "—",         insulin: 0, exercise: 0,  risk: "low"    },
];

const riskBadge = {
  low:    { label: "Low",    color: "#27ae60", bg: "#eafaf1" },
  medium: { label: "Medium", color: "#e67e22", bg: "#fef9f0" },
  high:   { label: "High",   color: "#c0392b", bg: "#fdf0ef" },
};

const stats = [
  { label: "Total Readings",   value: dummyData.length },
  { label: "High Risk Events", value: dummyData.filter(d => d.risk === "high").length },
  { label: "Meals Detected",   value: dummyData.filter(d => d.meal !== "—").length },
  { label: "Insulin Doses",    value: dummyData.filter(d => d.insulin > 0).length },
];

export default function History() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? dummyData : dummyData.filter(d => d.risk === filter);

  return (
    <div className="history-page">
      <Navbar />
      <div className="history-container">

        {/* Header */}
        <div className="history-header">
          <div>
            <h1 className="history-title">Reading History</h1>
            <p className="history-sub">Past glucose readings, meals, insulin doses and risk events</p>
          </div>
          <div className="history-filters">
            {["all", "low", "medium", "high"].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="history-stats">
          {stats.map(s => (
            <div className="history-stat-card" key={s.label}>
              <p className="history-stat-val">{s.value}</p>
              <p className="history-stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Glucose (mg/dL)</th>
                <th>Meal</th>
                <th>Insulin</th>
                <th>Exercise</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i}>
                  <td className="td-time">{row.timestamp}</td>
                  <td><strong style={{ color: row.risk === "high" ? "#c0392b" : row.risk === "medium" ? "#e67e22" : "#333" }}>{row.glucose}</strong></td>
                  <td>{row.meal}</td>
                  <td>{row.insulin > 0 ? `${row.insulin}u` : "—"}</td>
                  <td>{row.exercise > 0 ? `${row.exercise} min` : "—"}</td>
                  <td>
                    <span className="risk-pill" style={{ color: riskBadge[row.risk].color, background: riskBadge[row.risk].bg }}>
                      {riskBadge[row.risk].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}