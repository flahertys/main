import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import RootErrorBoundary from "./RootErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
