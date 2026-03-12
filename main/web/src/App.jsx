import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NeuralHub from "./NeuralHub.jsx";
import Dashboard from "./components/Dashboard.jsx";
import GamifiedOnboarding from "./components/GamifiedOnboarding.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<GamifiedOnboarding />} />
        <Route path="/trading" element={<NeuralHub />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
