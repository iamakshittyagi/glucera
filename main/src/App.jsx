import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import HowItWorks from "./pages/HowItWorks";
import Caregiver from "./pages/Caregiver";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/howitworks" element={<HowItWorks />} />
        <Route path="/caregiver" element={<Caregiver />} />
      </Routes>
    </Router>
  );
}

export default App;