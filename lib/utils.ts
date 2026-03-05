import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random URL-safe ID (21 characters).
 * Drop-in replacement for the `nanoid` package that avoids an extra dependency.
 */
export function nanoid(size = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = "";
  const array = new Uint8Array(size);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(array);
  } else {
    // crypto.getRandomValues is unavailable (non-standard environment).
    // IDs in this context are only used as non-security-sensitive identifiers
    // (UI keys, backtest run IDs). Proceed with Math.random as a last resort.
    for (let i = 0; i < size; i++) array[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < size; i++) {
    id += chars[array[i] & 63];
  }
  return id;
}
