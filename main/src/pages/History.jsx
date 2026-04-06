import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "./History.css";

// Synced with: glucera_dummy_data.csv + large_cgm_data.csv + glucera_critical_data.csv
// Risk labels computed using to_risk() model logic — glucose, hour, meal, insulin, exercise
const dummyData = [
  { timestamp: "2024-01-15 06:00", glucose: 98,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 06:45", glucose: 89,  meal: "—",               insulin: 2, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 07:15", glucose: 82,  meal: "Breakfast",        insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 09:00", glucose: 100, meal: "—",               insulin: 0, exercise: 20, risk: "low"    },
  { timestamp: "2024-01-15 10:30", glucose: 74,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 10:45", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 11:15", glucose: 62,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 11:30", glucose: 58,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 11:45", glucose: 72,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 12:30", glucose: 105, meal: "Lunch",            insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 13:00", glucose: 122, meal: "—",               insulin: 2, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 15:30", glucose: 70,  meal: "—",               insulin: 0, exercise: 30, risk: "medium" },
  { timestamp: "2024-01-15 16:30", glucose: 51,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 16:45", glucose: 48,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 17:00", glucose: 52,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-15 18:30", glucose: 98,  meal: "Dinner",           insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-15 19:00", glucose: 118, meal: "—",               insulin: 2, exercise: 0,  risk: "low"    },
  { timestamp: "2024-01-15 22:00", glucose: 80,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-16 01:00", glucose: 56,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 02:00", glucose: 49,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 04:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 05:00", glucose: 58,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 05:30", glucose: 88,  meal: "Glucose tablets",  insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-16 06:00", glucose: 86,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-16 20:00", glucose: 65,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 20:30", glucose: 57,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-16 21:00", glucose: 91,  meal: "Glucose tablets",  insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-17 02:45", glucose: 67,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-17 03:30", glucose: 55,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-17 04:00", glucose: 84,  meal: "Glucose tablets",  insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-17 11:15", glucose: 67,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-17 12:00", glucose: 55,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-17 12:15", glucose: 93,  meal: "Lunch",            insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-17 17:45", glucose: 68,  meal: "—",               insulin: 0, exercise: 30, risk: "high"   },
  { timestamp: "2024-01-17 18:30", glucose: 97,  meal: "Glucose gel",      insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-18 02:00", glucose: 67,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-18 03:00", glucose: 55,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-18 03:30", glucose: 86,  meal: "Glucose tablets",  insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-18 09:15", glucose: 69,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-18 10:30", glucose: 49,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-18 10:45", glucose: 87,  meal: "Juice",            insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-18 16:45", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-18 17:45", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-18 18:00", glucose: 90,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-18 23:45", glucose: 65,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-19 00:30", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-19 00:45", glucose: 89,  meal: "Glucose tablets",  insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-19 06:45", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-19 07:30", glucose: 56,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-19 08:00", glucose: 88,  meal: "Breakfast",        insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-19 18:00", glucose: 69,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-19 19:00", glucose: 53,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-19 19:15", glucose: 93,  meal: "Dinner",           insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-20 01:00", glucose: 67,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-20 02:00", glucose: 51,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-20 02:15", glucose: 88,  meal: "Glucose tablets",  insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-01-20 08:30", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-20 09:00", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-01-20 09:30", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 02:00", glucose: 78,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 02:15", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 02:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 02:45", glucose: 55,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 03:00", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 03:15", glucose: 49,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 03:30", glucose: 47,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 03:45", glucose: 44,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 04:00", glucose: 46,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 04:15", glucose: 48,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 04:30", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 04:45", glucose: 57,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 05:00", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 05:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 05:30", glucose: 72,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-01 05:45", glucose: 77,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 02:00", glucose: 78,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 02:15", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 02:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 02:45", glucose: 55,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 03:00", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 03:15", glucose: 49,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 03:30", glucose: 47,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 03:45", glucose: 44,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 04:00", glucose: 46,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 04:15", glucose: 48,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 04:30", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 04:45", glucose: 57,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 05:00", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 05:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 05:30", glucose: 72,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-02 05:45", glucose: 77,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 02:00", glucose: 78,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 02:15", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 02:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 02:45", glucose: 55,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 03:00", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 03:15", glucose: 49,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 03:30", glucose: 47,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 03:45", glucose: 44,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 04:00", glucose: 46,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 04:15", glucose: 48,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 04:30", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 04:45", glucose: 57,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 05:00", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 05:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 05:30", glucose: 72,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-03 05:45", glucose: 77,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 02:00", glucose: 78,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 02:15", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 02:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 02:45", glucose: 55,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 03:00", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 03:15", glucose: 49,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 03:30", glucose: 47,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 03:45", glucose: 44,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 04:00", glucose: 46,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 04:15", glucose: 48,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 04:30", glucose: 52,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 04:45", glucose: 57,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 05:00", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 05:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 05:30", glucose: 72,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-04 05:45", glucose: 77,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-05 16:15", glucose: 75,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-05 16:30", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-05 16:45", glucose: 65,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-05 17:00", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-05 17:15", glucose: 55,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-05 17:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-05 17:45", glucose: 71,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-07 16:15", glucose: 75,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-07 16:30", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-07 16:45", glucose: 65,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-07 17:00", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-07 17:15", glucose: 55,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-07 17:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-07 17:45", glucose: 71,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-09 16:15", glucose: 75,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-09 16:30", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-09 16:45", glucose: 65,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-09 17:00", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-09 17:15", glucose: 55,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-09 17:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-09 17:45", glucose: 71,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-10 09:30", glucose: 76,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-10 09:45", glucose: 71,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-10 10:00", glucose: 67,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-10 10:15", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-10 10:30", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-10 10:45", glucose: 58,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-10 11:00", glucose: 62,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-10 11:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-10 11:30", glucose: 75,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-11 09:30", glucose: 76,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-11 09:45", glucose: 71,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-11 10:00", glucose: 67,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 10:15", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 10:30", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 10:45", glucose: 58,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 11:00", glucose: 62,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 11:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 11:30", glucose: 75,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-11 16:15", glucose: 75,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-11 16:30", glucose: 70,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-11 16:45", glucose: 65,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 17:00", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 17:15", glucose: 55,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 17:30", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-11 17:45", glucose: 71,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-12 09:30", glucose: 76,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-12 09:45", glucose: 71,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-12 10:00", glucose: 67,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-12 10:15", glucose: 63,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-12 10:30", glucose: 60,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-12 10:45", glucose: 58,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-12 11:00", glucose: 62,  meal: "Snack",            insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-12 11:15", glucose: 68,  meal: "—",               insulin: 0, exercise: 0,  risk: "high"   },
  { timestamp: "2024-03-12 11:30", glucose: 75,  meal: "—",               insulin: 0, exercise: 0,  risk: "medium" },
  { timestamp: "2024-03-15 07:15", glucose: 112, meal: "Breakfast",        insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-03-15 11:30", glucose: 115, meal: "Lunch",            insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-03-15 17:00", glucose: 135, meal: "Snack",            insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-03-16 07:15", glucose: 112, meal: "Breakfast",        insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-03-16 11:30", glucose: 115, meal: "Lunch",            insulin: 0, exercise: 0,  risk: "low"    },
  { timestamp: "2024-03-16 17:00", glucose: 135, meal: "Snack",            insulin: 0, exercise: 0,  risk: "low"    },
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
                  <td>
                    <strong style={{ color: row.risk === "high" ? "#c0392b" : row.risk === "medium" ? "#e67e22" : "#333" }}>
                      {row.glucose}
                    </strong>
                  </td>
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