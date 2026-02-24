export type SignalCadenceWindow = "premarket" | "open" | "midday" | "close" | "offhours";

function parseHourMinute(input: string) {
  const [h, m] = input.split(":").map((value) => Number.parseInt(value, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return { hour: 0, minute: 0 };
  }
  return {
    hour: Math.max(0, Math.min(23, h)),
    minute: Math.max(0, Math.min(59, m)),
  };
}

function resolveWindowsConfig() {
  return {
    premarket: parseHourMinute(process.env.TRADEHAX_SIGNAL_CADENCE_PREMARKET || "08:15"),
    open: parseHourMinute(process.env.TRADEHAX_SIGNAL_CADENCE_OPEN || "09:35"),
    midday: parseHourMinute(process.env.TRADEHAX_SIGNAL_CADENCE_MIDDAY || "12:15"),
    close: parseHourMinute(process.env.TRADEHAX_SIGNAL_CADENCE_CLOSE || "15:50"),
  };
}

function getTimezoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return {
    weekday: part("weekday").toLowerCase(),
    hour: Number.parseInt(part("hour"), 10),
    minute: Number.parseInt(part("minute"), 10),
    dateKey: `${part("year")}-${part("month")}-${part("day")}`,
  };
}

function minuteDistance(a: { hour: number; minute: number }, b: { hour: number; minute: number }) {
  return Math.abs(a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

function isWeekday(weekday: string) {
  return ["mon", "tue", "wed", "thu", "fri"].includes(weekday.slice(0, 3));
}

export function resolveSignalCadenceWindow(input?: {
  now?: Date;
  timeZone?: string;
  toleranceMinutes?: number;
  forcedWindow?: string;
}) {
  const forcedWindow = String(input?.forcedWindow || "").trim().toLowerCase();
  if (forcedWindow === "premarket" || forcedWindow === "open" || forcedWindow === "midday" || forcedWindow === "close") {
    return {
      window: forcedWindow as SignalCadenceWindow,
      dateKey: getTimezoneParts(input?.now || new Date(), input?.timeZone || process.env.TRADEHAX_SIGNAL_TIMEZONE || "America/New_York").dateKey,
      timeZone: input?.timeZone || process.env.TRADEHAX_SIGNAL_TIMEZONE || "America/New_York",
      matchedBy: "forced",
    };
  }

  const now = input?.now || new Date();
  const timeZone = input?.timeZone || process.env.TRADEHAX_SIGNAL_TIMEZONE || "America/New_York";
  const toleranceMinutes = typeof input?.toleranceMinutes === "number"
    ? Math.max(0, Math.min(45, input.toleranceMinutes))
    : Math.max(0, Math.min(45, Number.parseInt(String(process.env.TRADEHAX_SIGNAL_CADENCE_TOLERANCE_MIN || "20"), 10) || 20));

  const parts = getTimezoneParts(now, timeZone);
  if (!isWeekday(parts.weekday)) {
    return { window: "offhours" as SignalCadenceWindow, dateKey: parts.dateKey, timeZone, matchedBy: "weekday-filter" };
  }

  const config = resolveWindowsConfig();
  const current = { hour: parts.hour, minute: parts.minute };
  const distances = {
    premarket: minuteDistance(current, config.premarket),
    open: minuteDistance(current, config.open),
    midday: minuteDistance(current, config.midday),
    close: minuteDistance(current, config.close),
  };

  const nearest = Object.entries(distances).sort((a, b) => a[1] - b[1])[0];
  if (!nearest || nearest[1] > toleranceMinutes) {
    return { window: "offhours" as SignalCadenceWindow, dateKey: parts.dateKey, timeZone, matchedBy: "tolerance" };
  }

  return {
    window: nearest[0] as SignalCadenceWindow,
    dateKey: parts.dateKey,
    timeZone,
    matchedBy: "schedule",
    distanceMinutes: nearest[1],
  };
}
