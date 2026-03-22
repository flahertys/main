import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NeuralHub from "../NeuralHub.jsx";
import IntelligencePage from "../features/intelligence/IntelligencePage.jsx";
import MusicHub from "../components/MusicHub.jsx";

export default function AppShell() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NeuralHub />} />
        <Route path="/intelligence" element={<IntelligencePage />} />
        <Route path="/neural-hub" element={<NeuralHub />} />
        <Route path="/music" element={<MusicHub />} />
      </Routes>
    </BrowserRouter>
  );
}
