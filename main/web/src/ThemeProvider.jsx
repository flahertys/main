import React, { createContext, useContext, useState, useMemo } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const toggleMode = () => setMode(m => (m === 'light' ? 'dark' : 'light'));
  const value = useMemo(() => ({ mode, toggleMode }), [mode]);
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

