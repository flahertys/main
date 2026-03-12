import React from "react";
import RootErrorBoundary from "../../RootErrorBoundary.jsx";

export default function RootBoundaryProvider({ children }) {
  return <RootErrorBoundary>{children}</RootErrorBoundary>;
}

