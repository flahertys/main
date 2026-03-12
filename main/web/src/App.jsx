import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NeuralHub from "./NeuralHub.jsx";
import Dashboard from "./components/Dashboard.jsx";
import GamifiedOnboarding from "./components/GamifiedOnboarding.jsx";
import MusicHub from "./components/MusicHub.jsx";
import ServicesHub from "./components/ServicesHub.jsx";

function DomainAwareHome() {
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const isTradingDomain = host === "tradehaxai.tech" || host === "www.tradehaxai.tech";
  return isTradingDomain ? <NeuralHub /> : <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DomainAwareHome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<GamifiedOnboarding />} />
        <Route path="/trading" element={<NeuralHub />} />
        <Route path="/music" element={<MusicHub />} />
        <Route path="/services" element={<ServicesHub />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
