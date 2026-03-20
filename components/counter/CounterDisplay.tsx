"use client";


import { useProgram } from "./hooks/useProgram";

/**
 * CounterDisplay component that displays the current counter value
 * and handles its own data fetching logic.
 */
export function CounterDisplay() {
  const { counterValue } = useProgram();

  return (
    <div className="text-center w-full px-5">
      <p className="text-sm text-muted-foreground mb-2">Current Count:</p>
      <div className="h-14 flex items-center justify-center">
        <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">
          {counterValue}
        </p>
      </div>
    </div>
  );
}
