import { AcademyModule } from "@/lib/investor-academy/modules";

export const ACADEMY_PROGRESS_STORAGE_KEY = "tradehax.investorAcademy.progress.v1";

export type AcademyDailyQuest = {
  date: string;
  moduleId: string;
  title: string;
  targetScorePct: number;
  completed: boolean;
};

export type AcademyProgressSnapshot = {
  version: 1;
  userId: string;
  completedModuleIds: string[];
  streakDays: number;
  lastActiveDate: string;
  bonusXp: number;
  bonusHax: number;
  dailyQuest: AcademyDailyQuest;
  updatedAt: string;
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayNumberInYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function getYesterdayIsoDate(baseDate: Date): string {
  const yesterday = new Date(baseDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return toIsoDate(yesterday);
}

export function getCurrentIsoDate(): string {
  return toIsoDate(new Date());
}

export function pickDailyQuest(modules: AcademyModule[], dateIso = getCurrentIsoDate()): AcademyDailyQuest {
  const questDate = new Date(`${dateIso}T00:00:00.000Z`);
  const index = modules.length > 0 ? dayNumberInYear(questDate) % modules.length : 0;
  const selectedModule = modules[index];

  return {
    date: dateIso,
    moduleId: selectedModule?.id ?? "",
    title: selectedModule ? `Master ${selectedModule.title}` : "Complete a module",
    targetScorePct: 0.8,
    completed: false,
  };
}

export function computeUpdatedStreak(
  lastActiveDate: string | undefined,
  streakDays: number | undefined,
  todayIso = getCurrentIsoDate(),
): number {
  if (!lastActiveDate || !streakDays) {
    return 1;
  }

  if (lastActiveDate === todayIso) {
    return streakDays;
  }

  const yesterdayIso = getYesterdayIsoDate(new Date(`${todayIso}T00:00:00.000Z`));
  if (lastActiveDate === yesterdayIso) {
    return streakDays + 1;
  }

  return 1;
}

export function createDefaultProgress(modules: AcademyModule[]): AcademyProgressSnapshot {
  const todayIso = getCurrentIsoDate();
  return {
    version: 1,
    userId: "guest-local",
    completedModuleIds: [],
    streakDays: 1,
    lastActiveDate: todayIso,
    bonusXp: 0,
    bonusHax: 0,
    dailyQuest: pickDailyQuest(modules, todayIso),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeProgressSnapshot(
  input: unknown,
  modules: AcademyModule[],
): AcademyProgressSnapshot {
  const fallback = createDefaultProgress(modules);
  if (!input || typeof input !== "object") {
    return fallback;
  }

  const raw = input as Partial<AcademyProgressSnapshot>;
  const todayIso = getCurrentIsoDate();
  const normalizedQuest =
    raw.dailyQuest && raw.dailyQuest.date === todayIso
      ? raw.dailyQuest
      : pickDailyQuest(modules, todayIso);

  return {
    version: 1,
    userId: typeof raw.userId === "string" && raw.userId ? raw.userId : "guest-local",
    completedModuleIds: Array.isArray(raw.completedModuleIds)
      ? raw.completedModuleIds.filter((id): id is string => typeof id === "string")
      : [],
    streakDays: computeUpdatedStreak(raw.lastActiveDate, raw.streakDays, todayIso),
    lastActiveDate: todayIso,
    bonusXp: typeof raw.bonusXp === "number" ? raw.bonusXp : 0,
    bonusHax: typeof raw.bonusHax === "number" ? raw.bonusHax : 0,
    dailyQuest: normalizedQuest,
    updatedAt: new Date().toISOString(),
  };
}

function toEpoch(value: string | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getMoreRecentSnapshot(
  first: AcademyProgressSnapshot,
  second: AcademyProgressSnapshot,
) {
  return toEpoch(second.updatedAt) >= toEpoch(first.updatedAt) ? second : first;
}

export function mergeProgressSnapshots(
  primary: AcademyProgressSnapshot,
  secondary: AcademyProgressSnapshot,
  modules: AcademyModule[],
): AcademyProgressSnapshot {
  const dominant = getMoreRecentSnapshot(primary, secondary);
  const completedModuleIds = Array.from(
    new Set([...primary.completedModuleIds, ...secondary.completedModuleIds]),
  );

  const normalized = normalizeProgressSnapshot(
    {
      ...dominant,
      completedModuleIds,
      bonusXp: Math.max(primary.bonusXp, secondary.bonusXp),
      bonusHax: Math.max(primary.bonusHax, secondary.bonusHax),
      streakDays: Math.max(primary.streakDays, secondary.streakDays),
      dailyQuest: {
        ...dominant.dailyQuest,
        completed: primary.dailyQuest.completed || secondary.dailyQuest.completed,
      },
    },
    modules,
  );

  return normalized;
}
