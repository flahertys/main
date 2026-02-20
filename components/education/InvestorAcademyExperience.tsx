/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AcademyModule } from "@/lib/investor-academy/modules";
import {
    ACADEMY_PROGRESS_STORAGE_KEY,
    AcademyProgressSnapshot,
    createDefaultProgress,
    mergeProgressSnapshots,
    normalizeProgressSnapshot,
} from "@/lib/investor-academy/progress";
import { cn } from "@/lib/utils";
import { BookOpen, Brain, CheckCircle2, Clock3, Coins, Flame, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InvestorAcademyExperienceProps = {
  modules: AcademyModule[];
};

type QuizState = {
  questionIndex: number;
  selectedIndex: number | null;
  submitted: boolean;
  score: number;
};

type AcademyStorageStatus = {
  mode: "memory" | "supabase";
  configured: boolean;
  progressTable: string;
  generatedAt: string;
  fallbackActive: boolean;
  lastError?: string;
};

type AcademyScoreBreakdown = {
  completedModules: number;
  moduleXp: number;
  moduleHax: number;
  bonusXp: number;
  bonusHax: number;
  totalXp: number;
  totalHax: number;
  streakScore: number;
  questScore: number;
  taskCompletionScore: number;
  compositeScore: number;
};

type AcademyLeaderboardEntry = {
  rank: number;
  userId: string;
  score: AcademyScoreBreakdown;
  streakDays: number;
  dailyQuestCompleted: boolean;
  updatedAt: string;
};

type AcademyLeaderboardSeason = "daily" | "weekly" | "all_time";

type AcademyFeatureSpendQuote = {
  feature: "ai_chat" | "hax_runner" | "signal_alert" | "bot_create";
  label: string;
  unitCostHax: number;
  usedToday: number;
  dailyLimit: number;
  projectedCostHax: number;
};

type AcademyEconomySnapshot = {
  userId: string;
  score: AcademyScoreBreakdown;
  walletHaxEarned: number;
  walletHaxCreditTotal: number;
  walletHaxSpentTotal: number;
  walletHaxSpentToday: number;
  walletHaxAvailable: number;
  featureSpendQuotes: AcademyFeatureSpendQuote[];
  generatedAt: string;
};

const difficultyClassMap: Record<AcademyModule["difficulty"], string> = {
  beginner: "border-emerald-400/40 text-emerald-200 bg-emerald-500/10",
  intermediate: "border-cyan-400/40 text-cyan-200 bg-cyan-500/10",
  advanced: "border-fuchsia-400/40 text-fuchsia-200 bg-fuchsia-500/10",
};

export function InvestorAcademyExperience({ modules }: InvestorAcademyExperienceProps) {
  const showAdminDiagnosticsLink =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_ACADEMY_ADMIN_LINK === "true";

  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id ?? "");
  const [completedModules, setCompletedModules] = useState<Record<string, true>>({});
  const [progress, setProgress] = useState<AcademyProgressSnapshot>(() => createDefaultProgress(modules));
  const [storageStatus, setStorageStatus] = useState<AcademyStorageStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<AcademyLeaderboardEntry[]>([]);
  const [leaderboardSeason, setLeaderboardSeason] = useState<AcademyLeaderboardSeason>("all_time");
  const [economy, setEconomy] = useState<AcademyEconomySnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    questionIndex: 0,
    selectedIndex: null,
    submitted: false,
    score: 0,
  });

  const activeModule = useMemo(
    () => modules.find((module) => module.id === activeModuleId) ?? modules[0],
    [activeModuleId, modules],
  );

  const totalXp = useMemo(
    () =>
      modules.reduce((total, module) => total + (completedModules[module.id] ? module.xpReward : 0), 0) +
      progress.bonusXp,
    [completedModules, modules, progress.bonusXp],
  );
  const totalHax = useMemo(
    () =>
      modules.reduce((total, module) => total + (completedModules[module.id] ? module.haxReward : 0), 0) +
      progress.bonusHax,
    [completedModules, modules, progress.bonusHax],
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrateProgress() {
      let localSnapshot = createDefaultProgress(modules);

      try {
        const raw = window.localStorage.getItem(ACADEMY_PROGRESS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        localSnapshot = normalizeProgressSnapshot(parsed, modules);
      } catch {
        localSnapshot = createDefaultProgress(modules);
      }

      if (cancelled) {
        return;
      }

      setProgress(localSnapshot);
      setCompletedModules(
        localSnapshot.completedModuleIds.reduce<Record<string, true>>((accumulator, moduleId) => {
          accumulator[moduleId] = true;
          return accumulator;
        }, {}),
      );
      setHydrated(true);

      try {
        const response = await fetch(
          `/api/investor-academy/progress?userId=${encodeURIComponent(localSnapshot.userId)}`,
          { method: "GET", headers: { Accept: "application/json" } },
        );
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { ok?: boolean; snapshot?: unknown };
        if (!data.ok || !data.snapshot) {
          return;
        }

        const remoteSnapshot = normalizeProgressSnapshot(data.snapshot, modules);
        const mergedSnapshot = mergeProgressSnapshots(localSnapshot, remoteSnapshot, modules);

        if (cancelled) {
          return;
        }

        setProgress(mergedSnapshot);
        setCompletedModules(
          mergedSnapshot.completedModuleIds.reduce<Record<string, true>>((accumulator, moduleId) => {
            accumulator[moduleId] = true;
            return accumulator;
          }, {}),
        );
      } catch {
        // network failures should silently fall back to local-only mode
      }
    }

    hydrateProgress();

    void fetch("/api/investor-academy/status", {
      method: "GET",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as {
          ok?: boolean;
          status?: AcademyStorageStatus;
        };
        return data.ok && data.status ? data.status : null;
      })
      .then((status) => {
        if (cancelled || !status) {
          return;
        }
        setStorageStatus(status);
      })
      .catch(() => {
        // keep UI functional without status endpoint
      });

    return () => {
      cancelled = true;
    };
  }, [modules]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const payload: AcademyProgressSnapshot = {
      ...progress,
      completedModuleIds: Object.keys(completedModules),
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(ACADEMY_PROGRESS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // intentionally ignored for environments with disabled storage
    }

    const timer = window.setTimeout(() => {
      void fetch("/api/investor-academy/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: payload.userId,
          snapshot: payload,
        }),
      }).catch(() => {
        // non-blocking sync
      });
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [completedModules, hydrated, progress]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    void fetch(
      `/api/investor-academy/leaderboard?limit=8&season=${encodeURIComponent(leaderboardSeason)}&userId=${encodeURIComponent(progress.userId)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          leaderboard?: AcademyLeaderboardEntry[];
          economy?: AcademyEconomySnapshot;
        };
        return payload.ok ? payload : null;
      })
      .then((payload) => {
        if (cancelled || !payload) {
          return;
        }
        setLeaderboard(Array.isArray(payload.leaderboard) ? payload.leaderboard : []);
        setEconomy(payload.economy ?? null);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setLeaderboard([]);
        setEconomy(null);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, progress.userId, leaderboardSeason]);

  if (!activeModule) {
    return null;
  }

  const question = activeModule.quiz[quizState.questionIndex];
  const moduleCompleted = Boolean(completedModules[activeModule.id]);

  function resetQuiz() {
    setQuizState({
      questionIndex: 0,
      selectedIndex: null,
      submitted: false,
      score: 0,
    });
  }

  function changeModule(moduleId: string) {
    setActiveModuleId(moduleId);
    resetQuiz();
  }

  function submitAnswer() {
    if (quizState.selectedIndex === null) {
      return;
    }

    const isCorrect = quizState.selectedIndex === question.answerIndex;
    setQuizState((current) => ({
      ...current,
      submitted: true,
      score: isCorrect ? current.score + 1 : current.score,
    }));
  }

  function nextQuestion() {
    const isLastQuestion = quizState.questionIndex >= activeModule.quiz.length - 1;

    if (isLastQuestion) {
      const passRate = activeModule.quiz.length > 0 ? quizState.score / activeModule.quiz.length : 0;
      if (passRate >= 0.6) {
        setCompletedModules((current) => ({ ...current, [activeModule.id]: true }));

        const shouldCompleteQuest =
          !progress.dailyQuest.completed &&
          progress.dailyQuest.moduleId === activeModule.id &&
          passRate >= progress.dailyQuest.targetScorePct;

        if (shouldCompleteQuest) {
          setProgress((current) => ({
            ...current,
            dailyQuest: {
              ...current.dailyQuest,
              completed: true,
            },
            bonusXp: current.bonusXp + 40,
            bonusHax: current.bonusHax + 5,
            updatedAt: new Date().toISOString(),
          }));
        }
      }
      return;
    }

    setQuizState((current) => ({
      ...current,
      questionIndex: current.questionIndex + 1,
      selectedIndex: null,
      submitted: false,
    }));
  }

  const passRate = activeModule.quiz.length > 0 ? quizState.score / activeModule.quiz.length : 0;
  const quizFinished = quizState.questionIndex === activeModule.quiz.length - 1 && quizState.submitted;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <Card className="border-[#355070] bg-[#07111f]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-300" />
              Progress Wallet
            </CardTitle>
            <CardDescription>Simulation rewards for education and engagement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {storageStatus && (
              <div className="rounded-lg border border-[#405879] bg-[#0b1f37] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#9fb4d0]">Storage</p>
                <p className="text-xs mt-1 text-[#d7e5f7]">
                  Mode: <span className="font-semibold">{storageStatus.mode}</span>
                  {storageStatus.fallbackActive ? " (fallback active)" : ""}
                </p>
                {storageStatus.lastError && (
                  <p className="text-[11px] mt-1 text-amber-200">Last sync warning: {storageStatus.lastError}</p>
                )}
                {showAdminDiagnosticsLink && (
                  <Link
                    href="/admin/investor-academy"
                    className="inline-flex mt-2 text-[11px] text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                  >
                    Open Admin Diagnostics
                  </Link>
                )}
              </div>
            )}
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
              <p className="text-cyan-100/80 text-xs uppercase tracking-[0.18em]">Academy XP</p>
              <p className="text-2xl font-black text-cyan-200">{totalXp}</p>
            </div>
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="text-emerald-100/80 text-xs uppercase tracking-[0.18em]">$HAX Rewarded</p>
              <p className="text-2xl font-black text-emerald-200">{totalHax}</p>
            </div>
            {economy && (
              <div className="rounded-lg border border-violet-400/30 bg-violet-500/10 p-3">
                <p className="text-violet-100/80 text-xs uppercase tracking-[0.18em]">Spendable $HAX</p>
                <p className="text-2xl font-black text-violet-200">{economy.walletHaxAvailable}</p>
                <p className="mt-1 text-[11px] text-violet-100/80">
                  Earned {economy.walletHaxEarned} · Season credits {economy.walletHaxCreditTotal} · Spent total {economy.walletHaxSpentTotal} · Today spend {economy.walletHaxSpentToday}
                </p>
              </div>
            )}
            <div className="rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
              <p className="text-orange-100/80 text-xs uppercase tracking-[0.18em]">Learning Streak</p>
              <p className="text-2xl font-black text-orange-200 inline-flex items-center gap-2">
                <Flame className="h-5 w-5" /> {progress.streakDays} day{progress.streakDays === 1 ? "" : "s"}
              </p>
            </div>
            <p className="text-xs text-[#9db2cc] leading-relaxed">
              Educational simulation only. No brokerage execution, no custody, and not financial advice.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#355070] bg-[#07111f]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-fuchsia-300" />
              Daily Quest
            </CardTitle>
            <CardDescription>{progress.dailyQuest.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#c6d7ec]">
            <p>
              Complete <span className="font-semibold">{progress.dailyQuest.moduleId.replaceAll("-", " ")}</span> with at
              least <span className="font-semibold">{Math.round(progress.dailyQuest.targetScorePct * 100)}%</span> score.
            </p>
            <p className="text-xs text-[#9db2cc]">Bonus reward: +40 XP and +5 $HAX</p>
            <p className={cn("text-xs font-semibold", progress.dailyQuest.completed ? "text-emerald-200" : "text-cyan-200")}>
              {progress.dailyQuest.completed ? "Quest complete for today" : "Quest active"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#355070] bg-[#07111f]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-300" />
              Leaderboard + Feature Costs
            </CardTitle>
            <CardDescription>Ranking is derived from XP, $HAX, streak consistency, and completed tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {([
                { id: "daily", label: "Daily" },
                { id: "weekly", label: "Weekly" },
                { id: "all_time", label: "All-Time" },
              ] as const).map((seasonOption) => (
                <button
                  key={seasonOption.id}
                  type="button"
                  onClick={() => setLeaderboardSeason(seasonOption.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]",
                    leaderboardSeason === seasonOption.id
                      ? "border-cyan-400/55 bg-cyan-500/20 text-cyan-100"
                      : "border-[#334766] bg-[#0a182b] text-[#9fb4d0] hover:border-cyan-400/35",
                  )}
                >
                  {seasonOption.label}
                </button>
              ))}
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-[#9db2cc]">No leaderboard entries yet. Complete modules to get ranked.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => {
                  const isYou = entry.userId === progress.userId;
                  return (
                    <div
                      key={`${entry.rank}-${entry.userId}`}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs",
                        isYou ? "border-cyan-400/50 bg-cyan-500/10" : "border-[#334766] bg-[#0a182b]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-semibold">#{entry.rank} {entry.userId}{isYou ? " (you)" : ""}</p>
                        <p className="text-cyan-200">{entry.score.compositeScore} pts</p>
                      </div>
                      <p className="mt-1 text-[#9db2cc]">
                        {entry.score.totalXp} XP · {entry.score.totalHax} HAX · {entry.streakDays} day streak
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {economy ? (
              <div className="rounded-lg border border-[#334766] bg-[#0a182b] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#9fb4d0]">Feature cost schedule ($HAX)</p>
                <ul className="mt-2 space-y-1.5 text-xs text-[#d7e5f7]">
                  {economy.featureSpendQuotes.map((quote) => (
                    <li key={quote.feature} className="flex items-center justify-between gap-2">
                      <span>{quote.label}</span>
                      <span className="text-[#9db2cc]">
                        {quote.unitCostHax}/use · today {quote.usedToday}/{quote.dailyLimit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[#355070] bg-[#07111f]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-300" />
              Modules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modules.map((module) => {
              const isActive = module.id === activeModule.id;
              const isCompleted = Boolean(completedModules[module.id]);
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => changeModule(module.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-all",
                    isActive
                      ? "border-cyan-400/60 bg-cyan-500/15"
                      : "border-[#334766] bg-[#0a182b] hover:border-cyan-400/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white text-sm">{module.title}</p>
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                  </div>
                  <p className="mt-1 text-xs text-[#9fb4d0]">{module.summary}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </aside>

      <section className="space-y-5">
        <Card className="border-[#355070] bg-[#07111f]">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
              <span className={cn("rounded-full border px-2 py-1", difficultyClassMap[activeModule.difficulty])}>
                {activeModule.difficulty}
              </span>
              <span className="rounded-full border border-[#405879] bg-[#0b1f37] px-2 py-1 text-[#a6bdd8] inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" /> {activeModule.estimatedMinutes} min
              </span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-emerald-200 inline-flex items-center gap-1">
                <Coins className="h-3 w-3" /> +{activeModule.haxReward} $HAX
              </span>
            </div>
            <CardTitle className="text-white text-2xl">{activeModule.title}</CardTitle>
            <CardDescription>{activeModule.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-300/80 mb-3">Lesson objectives</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {activeModule.lessons.map((lesson) => (
                <li
                  key={lesson}
                  className="rounded-lg border border-[#355070] bg-[#0b1a2c] p-3 text-sm text-[#c6d7ec]"
                >
                  {lesson}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-[#355070] bg-[#07111f]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-fuchsia-300" />
              Module Challenge
            </CardTitle>
            <CardDescription>
              Score at least 60% to lock completion and claim rewards for this module.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[#355070] bg-[#0b1a2c] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-300/80">
                Question {quizState.questionIndex + 1} / {activeModule.quiz.length}
              </p>
              <p className="mt-2 text-white font-semibold">{question.prompt}</p>
              <div className="mt-4 space-y-2">
                {question.choices.map((choice, index) => {
                  const isSelected = quizState.selectedIndex === index;
                  const isCorrectChoice = quizState.submitted && index === question.answerIndex;
                  const isWrongSelected = quizState.submitted && isSelected && index !== question.answerIndex;

                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={quizState.submitted}
                      onClick={() => setQuizState((current) => ({ ...current, selectedIndex: index }))}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                        isSelected ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-100" : "border-[#355070] bg-[#0a182b] text-[#c5d7ec]",
                        isCorrectChoice && "border-emerald-400/70 bg-emerald-500/20 text-emerald-100",
                        isWrongSelected && "border-rose-400/70 bg-rose-500/20 text-rose-100",
                      )}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {quizState.submitted && (
                <p className="mt-3 text-sm text-[#b8cbe2]">{question.explanation}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!quizState.submitted ? (
                <Button onClick={submitAnswer} disabled={quizState.selectedIndex === null}>
                  Submit answer
                </Button>
              ) : (
                <Button onClick={nextQuestion}>{quizFinished ? "Finalize module" : "Next question"}</Button>
              )}

              <Button variant="outline" onClick={resetQuiz}>
                Reset challenge
              </Button>
            </div>

            {quizFinished && (
              <div className="rounded-lg border border-[#355070] bg-[#0b1a2c] p-4 text-sm">
                <p className="text-white font-semibold">Final score: {quizState.score} / {activeModule.quiz.length}</p>
                <p className="mt-1 text-[#b8cbe2]">
                  {passRate >= 0.6
                    ? "Module completed. Rewards are now added to your academy progress wallet."
                    : "Pass threshold not met yet. Reset and retry to claim rewards."}
                </p>
                {moduleCompleted && (
                  <p className="mt-2 text-emerald-200">
                    Claimed: +{activeModule.xpReward} XP and +{activeModule.haxReward} $HAX
                  </p>
                )}
                {progress.dailyQuest.completed && progress.dailyQuest.moduleId === activeModule.id && (
                  <p className="mt-1 text-fuchsia-200">Daily quest bonus claimed: +40 XP and +5 $HAX</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-[#8da4c0]">
            Rewards shown are in-platform utility points and token credits for engagement mechanics.
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
