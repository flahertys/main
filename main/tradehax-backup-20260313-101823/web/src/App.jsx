import React from "react";
import AppShell from "./app/AppShell.jsx";
import { ThemeProvider } from './ThemeProvider.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
