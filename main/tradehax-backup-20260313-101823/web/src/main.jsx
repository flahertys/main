import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import RootBoundaryProvider from "./shared/providers/RootBoundaryProvider.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootBoundaryProvider>
      <App />
    </RootBoundaryProvider>
  </React.StrictMode>
);
