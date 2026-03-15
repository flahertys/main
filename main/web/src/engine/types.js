export const SignalAction = Object.freeze({
  BUY: "BUY",
  SELL: "SELL",
  HOLD: "HOLD",
});

export function assertNumber(value, name) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${name} must be a valid number`);
  }
}

