"use client";

import { WalletButton } from "@/components/counter/WalletButton";
import { GameAudio } from "@/components/game/GameAudio";
import { GameHUD } from "@/components/game/GameHUD";
import { HyperboreaGame } from "@/components/game/HyperboreaGame";
import { NFTMintPanel } from "@/components/game/NFTMintPanel";
import { AdSenseBlock } from "@/components/monetization/AdSenseBlock";
import { PremiumUpgrade } from "@/components/monetization/PremiumUpgrade";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { trackEvent } from "@/lib/analytics";
import type { LeaderboardEntry, LeaderboardSubmission } from "@/lib/game/leaderboard-types";
import { generateDefaultLevel001 } from "@/lib/game/level-generator";
import type {
    ArtifactCollectionEvent,
    GameRunSummary,
    GameScoreSnapshot,
    HyperboreaLevelDefinition,
} from "@/lib/game/level-types";
import { isHyperboreaLevelDefinition } from "@/lib/game/level-types";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Gamepad2,
    HelpCircle,
    LogIn,
    LogOut,
    Medal,
    Pause,
    Play,
    RotateCcw,
    Star,
    Trophy,
    X,
    Zap,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ControlAction = "forward" | "backward" | "turn_left" | "turn_right" | "use";

const stripSensitiveLeaderboardFields = (entry: LeaderboardEntry): LeaderboardEntry => {
  const { oauthProvider, oauthUserId, ...rest } = entry;
  return {
    ...(rest as LeaderboardEntry),
    oauthProvider: undefined,
    oauthUserId: undefined,
  };
};

function createSessionId() {
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const LEADERBOARD_STORAGE_KEY = "hyperborea_leaderboard_v1";
const UTILITY_POINTS_PER_TOKEN_UNIT = 25;

function formatElapsed(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function sortLeaderboard(entries: LeaderboardEntry[]) {
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
}

export default function GamePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameRuntimeError, setGameRuntimeError] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState(0);
  const [sessionId, setSessionId] = useState(createSessionId);
  const [showTutorial, setShowTutorial] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [cloversCollected, setCloversCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [utilityPoints, setUtilityPoints] = useState(0);
  const [projectedUtilityUnits, setProjectedUtilityUnits] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scoreSnapshot, setScoreSnapshot] = useState<GameScoreSnapshot | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [runCompleteSummary, setRunCompleteSummary] = useState<GameRunSummary | null>(null);
  const [showRunCompleteModal, setShowRunCompleteModal] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState<
    Array<{ type: string; timeLeft: number }>
  >([]);
  const [hasPlayedBefore, setHasPlayedBefore] = useState(false);
  const [activeLevel, setActiveLevel] = useState<HyperboreaLevelDefinition | null>(null);
  const [levelLoadState, setLevelLoadState] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const [levelLoadMessage, setLevelLoadMessage] = useState<string>("");
  const [artifactFeed, setArtifactFeed] = useState<ArtifactCollectionEvent[]>([]);
  const [claimFeedback, setClaimFeedback] = useState<string>("");
  const [gameHint, setGameHint] = useState("Loading controls...");
  const [interactionHint, setInteractionHint] = useState<string | null>(null);
  const [isInteractionReady, setIsInteractionReady] = useState(false);
  const [showControlCoach, setShowControlCoach] = useState(false);
  const [playerAlias, setPlayerAlias] = useState("Guest");
  const pressedControlsRef = useRef<Set<Exclude<ControlAction, "use">>>(new Set());
  const { connected: walletConnected, publicKey } = useWallet();
  const { data: session } = useSession();
  const walletAddress = publicKey?.toBase58();

  const topArtifacts = useMemo(() => artifactFeed.slice(0, 3), [artifactFeed]);
  const oauthProvider = useMemo(() => {
    const provider = (session?.user as { provider?: string } | undefined)?.provider;
    return provider === "google" || provider === "facebook" ? provider : "guest";
  }, [session]);
  const oauthIdentity = session?.user?.email ?? session?.user?.name ?? undefined;
  const utilityRemainder = useMemo(
    () =>
      ((utilityPoints % UTILITY_POINTS_PER_TOKEN_UNIT) + UTILITY_POINTS_PER_TOKEN_UNIT) %
      UTILITY_POINTS_PER_TOKEN_UNIT,
    [utilityPoints],
  );
  const utilityProgressPercent = useMemo(
    () => (utilityRemainder / UTILITY_POINTS_PER_TOKEN_UNIT) * 100,
    [utilityRemainder],
  );
  const pointsToNextToken = useMemo(
    () =>
      utilityRemainder === 0
        ? UTILITY_POINTS_PER_TOKEN_UNIT
        : UTILITY_POINTS_PER_TOKEN_UNIT - utilityRemainder,
    [utilityRemainder],
  );
  const objectiveProgress = useMemo(() => {
    if (!activeLevel) return 0;
    const requiredRelics = Math.max(1, Math.min(3, activeLevel.artifacts.length));
    const runeTarget = Math.max(1, activeLevel.puzzleNodes.length);
    const relicProgress = Math.min(cloversCollected / requiredRelics, 1);
    const runeProgress = Math.min((scoreSnapshot?.runesActivated ?? 0) / runeTarget, 1);
    return (relicProgress * 0.62 + runeProgress * 0.38) * 100;
  }, [activeLevel, cloversCollected, scoreSnapshot?.runesActivated]);

  // Check localStorage after mount to avoid SSR/hydration issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      const played = localStorage.getItem("hyperborea_played") === "true";
      setHasPlayedBefore(played);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const updateViewportVars = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      root.style.setProperty("--hyperborea-vh", `${Math.max(viewportHeight, 1) * 0.01}px`);
      root.style.setProperty("--hyperborea-vw", `${Math.max(viewportWidth, 1) * 0.01}px`);
    };

    updateViewportVars();
    window.addEventListener("resize", updateViewportVars);
    window.addEventListener("orientationchange", updateViewportVars);
    window.visualViewport?.addEventListener("resize", updateViewportVars);
    window.visualViewport?.addEventListener("scroll", updateViewportVars);

    return () => {
      window.removeEventListener("resize", updateViewportVars);
      window.removeEventListener("orientationchange", updateViewportVars);
      window.visualViewport?.removeEventListener("resize", updateViewportVars);
      window.visualViewport?.removeEventListener("scroll", updateViewportVars);
    };
  }, []);

  useEffect(() => {
    if (session?.user?.name && session.user.name.trim().length > 0) {
      setPlayerAlias(session.user.name.trim().slice(0, 32));
    }
  }, [session]);

  const refreshLeaderboard = useCallback(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/game/leaderboard?limit=10", {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as {
            ok?: boolean;
            entries?: LeaderboardEntry[];
          };
          if (payload.ok && Array.isArray(payload.entries)) {
            setLeaderboardEntries(payload.entries);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                LEADERBOARD_STORAGE_KEY,
                JSON.stringify(payload.entries.slice(0, 50)),
              );
            }
            return;
          }
        }
      } catch {
        // Fall through to local cache.
      }

      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
        if (!raw) {
          setLeaderboardEntries([]);
          return;
        }
        const parsed = JSON.parse(raw) as LeaderboardEntry[];
        const normalized = Array.isArray(parsed) ? parsed : [];
        sortLeaderboard(normalized);
        setLeaderboardEntries(normalized.slice(0, 10));
      } catch {
        setLeaderboardEntries([]);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadLevel = async () => {
      const candidateLevels = [
        "/levels/level-002-tutorial-astral-gate.json",
        "/levels/level-001.json",
      ];

      let loadedLevel: HyperboreaLevelDefinition | null = null;
      let loadedFrom = "";
      let lastErrorMessage = "Unknown load error";

      try {
        for (const levelPath of candidateLevels) {
          const response = await fetch(levelPath);
          if (!response.ok) {
            lastErrorMessage = `Level request failed (${response.status})`;
            continue;
          }

          const payload: unknown = await response.json();
          if (!isHyperboreaLevelDefinition(payload)) {
            lastErrorMessage = "Level format invalid";
            continue;
          }

          loadedLevel = payload;
          loadedFrom = levelPath.split("/").pop() ?? levelPath;
          break;
        }

        if (!loadedLevel) {
          throw new Error(lastErrorMessage);
        }

        if (!isCancelled) {
          setActiveLevel(loadedLevel);
          setLevelLoadState("ready");
          setLevelLoadMessage(`Loaded: ${loadedLevel.name} (${loadedFrom})`);
        }
      } catch (error) {
        if (!isCancelled) {
          const fallbackLevel = generateDefaultLevel001();
          setActiveLevel(fallbackLevel);
          setLevelLoadState("fallback");
          setLevelLoadMessage(
            `Using generated fallback level. ${
              error instanceof Error ? error.message : lastErrorMessage
            }`,
          );
        }
      }
    };

    loadLevel();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControlCoach(false);
      return;
    }

    setShowControlCoach(true);
    const timerId = window.setTimeout(() => {
      setShowControlCoach(false);
    }, 12000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isPlaying, gameSession]);

  const emitControlAction = useCallback((action: ControlAction, pressed?: boolean) => {
    if (typeof window === "undefined") return;
    if (pressed !== false && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
    window.dispatchEvent(
      new CustomEvent("hyperborea-control", {
        detail: { action, pressed },
      }),
    );
  }, []);

  const releaseMovementControl = useCallback(
    (action: Exclude<ControlAction, "use">) => {
      if (!pressedControlsRef.current.has(action)) {
        return;
      }
      pressedControlsRef.current.delete(action);
      emitControlAction(action, false);
    },
    [emitControlAction],
  );

  const releaseAllMovementControls = useCallback(() => {
    const actions = Array.from(pressedControlsRef.current);
    for (const action of actions) {
      emitControlAction(action, false);
    }
    pressedControlsRef.current.clear();
  }, [emitControlAction]);

  const getHoldButtonHandlers = useCallback(
    (action: Exclude<ControlAction, "use">) => ({
      onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        if (!pressedControlsRef.current.has(action)) {
          pressedControlsRef.current.add(action);
          emitControlAction(action, true);
        }
      },
      onPointerUp: () => releaseMovementControl(action),
      onPointerCancel: () => releaseMovementControl(action),
      onPointerLeave: () => releaseMovementControl(action),
      onLostPointerCapture: () => releaseMovementControl(action),
      onTouchStart: (event: React.TouchEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!pressedControlsRef.current.has(action)) {
          pressedControlsRef.current.add(action);
          emitControlAction(action, true);
        }
      },
      onTouchEnd: () => releaseMovementControl(action),
      onTouchCancel: () => releaseMovementControl(action),
      onClick: () => emitControlAction(action),
      onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
    }),
    [emitControlAction, releaseMovementControl],
  );

  useEffect(() => {
    if (!isPlaying || isPaused) {
      releaseAllMovementControls();
    }
  }, [isPaused, isPlaying, releaseAllMovementControls]);

  useEffect(() => {
    if (!isPlaying || isPaused || runCompleteSummary) {
      return;
    }
    const timerId = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [isPaused, isPlaying, runCompleteSummary]);

  useEffect(
    () => () => {
      releaseAllMovementControls();
    },
    [releaseAllMovementControls],
  );

  const handleArtifactCollected = useCallback(
    async (event: ArtifactCollectionEvent) => {
      setArtifactFeed((previous) => [event, ...previous].slice(0, 8));

      // Persistent Web5-style local storage for artifact collection
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("hyperborea_vault_v1") || "[]";
          const vault = JSON.parse(stored);
          vault.push({
            id: event.artifactId,
            name: event.artifactName,
            rarity: event.rarity,
            collectedAt: event.collectedAt
          });
          localStorage.setItem("hyperborea_vault_v1", JSON.stringify(vault.slice(-100)));
        } catch (e) {
          console.error("Web5 vault sync error", e);
        }
      }

      const tokenConfig = activeLevel?.tokenConfig;
      if (!tokenConfig?.enabled) return;

      try {
        const response = await fetch(tokenConfig.claimEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        if ("vibrate" in navigator) {
          navigator.vibrate(12);
        }

        const result = await response.json();
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || "Claim queue failed");
        }

        setClaimFeedback(
          `Relic ${event.lockedAtPickup ? "capture" : "claim"} queued: ${event.artifactName} (+${event.tokenRewardUnits} ${tokenConfig.l2TokenSymbol})${
            event.utilityTokenBonusUnits
              ? ` | Utility snapshot: ${event.utilityTokenBonusUnits} ${tokenConfig.l2TokenSymbol}`
              : ""
          }`,
        );
      } catch (error) {
        setClaimFeedback(
          `Relic captured locally. Queue retry pending (${
            error instanceof Error ? error.message : "claim queue unavailable"
          }).`,
        );
      }
    },
    [activeLevel],
  );

  const handlePlayClick = () => {
    releaseAllMovementControls();
    trackEvent.gameStart();
    setGameRuntimeError(null);
    setIsPlaying(true);
    setIsPaused(false);
    setGameSession((value) => value + 1);
    setSessionId(createSessionId());
    setArtifactFeed([]);
    setScoreSnapshot(null);
    setRunCompleteSummary(null);
    setShowRunCompleteModal(false);
    setUtilityPoints(0);
    setProjectedUtilityUnits(0);
    setElapsedSeconds(0);
    setClaimFeedback("");
    setGameHint("W/S move, A/D turn, E interact. Move close to relics for auto-pickup.");
    setInteractionHint("Move close to a relic to auto-pickup, or align with runes and press Use.");
    setIsInteractionReady(false);

    // Show tutorial for first-time players
    if (!hasPlayedBefore) {
      setShowTutorial(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("hyperborea_played", "true");
      }
      setHasPlayedBefore(true);
    }
  };

  const handleRestart = () => {
    releaseAllMovementControls();
    setEnergy(0);
    setCloversCollected(0);
    setScore(0);
    setCombo(0);
    setUtilityPoints(0);
    setProjectedUtilityUnits(0);
    setElapsedSeconds(0);
    setIsPaused(false);
    setGameSession((value) => value + 1);
    setSessionId(createSessionId());
    setArtifactFeed([]);
    setScoreSnapshot(null);
    setRunCompleteSummary(null);
    setShowRunCompleteModal(false);
    setClaimFeedback("");
    setGameHint("Level restarted. Follow rune hints and move close to relics to collect.");
    setInteractionHint("Level restarted. Move near relics to auto-pickup or tap Use at runes.");
    setIsInteractionReady(false);
    setShowControlCoach(true);
  };

  const handleExit = () => {
    releaseAllMovementControls();
    setIsPlaying(false);
    setIsPaused(false);
    setShowTutorial(false);
    setScoreSnapshot(null);
    setRunCompleteSummary(null);
    setShowRunCompleteModal(false);
    setUtilityPoints(0);
    setProjectedUtilityUnits(0);
    setElapsedSeconds(0);
    setInteractionHint(null);
    setIsInteractionReady(false);
  };

  const togglePause = () => {
    setIsPaused((value) => !value);
  };

  const handleMintNFT = async (skinId: number) => {
    // NFT minting logic will be implemented when backend is ready
    console.log("Minting NFT skin:", skinId);
    // This would call the backend API for NFT minting
  };

  const handleScoreChange = useCallback((newScore: number, newCombo: number) => {
    setScore(newScore);
    setCombo(newCombo);
  }, []);

  const handleUtilityPointsChange = useCallback((points: number, projectedTokenUnits: number) => {
    setUtilityPoints(points);
    setProjectedUtilityUnits(projectedTokenUnits);
  }, []);

  const handleStructuredScoreChange = useCallback((snapshot: GameScoreSnapshot) => {
    setScoreSnapshot(snapshot);
    setScore(snapshot.score);
    setCombo(snapshot.combo);
    setUtilityPoints(snapshot.utilityPoints);
    setProjectedUtilityUnits(snapshot.projectedTokenUnits);
  }, []);

  const handleRunComplete = useCallback(
    (summary: GameRunSummary) => {
      setRunCompleteSummary(summary);
      setShowRunCompleteModal(true);
      setGameHint(
        `Run complete. Final score: ${summary.score.toLocaleString()} | Utility: ${summary.utilityPoints.toLocaleString()} pts`,
      );

      const submission: LeaderboardSubmission = {
        run: summary,
        displayName: playerAlias.trim() || "Guest",
        oauthProvider,
        oauthUserId: oauthIdentity,
        walletAddress,
        web5Enabled: Boolean(walletAddress),
      };

      const entry: LeaderboardEntry = {
        id: `lb-${summary.sessionId}-${Date.now().toString(36)}`,
        displayName: submission.displayName,
        oauthProvider: submission.oauthProvider,
        oauthUserId: submission.oauthUserId,
        walletAddress: submission.walletAddress,
        web5Enabled: Boolean(submission.web5Enabled && submission.walletAddress),
        levelId: summary.levelId,
        score: Math.round(summary.score),
        combo: Math.round(summary.combo),
        coinsCollected: Math.round(summary.coinsCollected),
        runesActivated: Math.round(summary.runesActivated),
        relicsCollected: Math.round(summary.relicsCollected),
        coinPoints: Math.round(summary.coinPoints),
        runePoints: Math.round(summary.runePoints),
        relicPoints: Math.round(summary.relicPoints),
        explorationPoints: Math.round(summary.explorationPoints),
        utilityPoints: Math.round(summary.utilityPoints),
        projectedTokenUnits: Math.round(summary.projectedTokenUnits),
        completedAt: summary.completedAt,
      };

      const persistLocal = () => {
        if (typeof window === "undefined") return;
        const existing = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
        const parsed = existing ? ((JSON.parse(existing) as LeaderboardEntry[]) ?? []) : [];
        const merged = Array.isArray(parsed) ? [...parsed, entry] : [entry];
        sortLeaderboard(merged);
        const top = merged.slice(0, 50);
        const publicTop = top.map(stripSensitiveLeaderboardFields);
        window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(publicTop));
        setLeaderboardEntries(top.slice(0, 10));
      };

      const submit = async () => {
        try {
          const response = await fetch("/api/game/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submission),
          });
          if (response.ok) {
            const payload = (await response.json()) as {
              ok?: boolean;
              entries?: LeaderboardEntry[];
            };
            if (payload.ok && Array.isArray(payload.entries)) {
              setLeaderboardEntries(payload.entries);
              if (typeof window !== "undefined") {
                const topEntries = payload.entries.slice(0, 50);
                const publicTopEntries = topEntries.map(stripSensitiveLeaderboardFields);
                window.localStorage.setItem(
                  LEADERBOARD_STORAGE_KEY,
                  JSON.stringify(publicTopEntries),
                );
              }
              return;
            }
          }
        } catch {
          // Fall back to local persistence.
        }
        persistLocal();
      };

      void submit();
    },
    [oauthIdentity, oauthProvider, playerAlias, walletAddress],
  );

  const handleInteractionHintChange = useCallback(
    (hint: string | null, actionable: boolean) => {
      setInteractionHint(hint);
      setIsInteractionReady(actionable);
    },
    [],
  );

  if (isPlaying) {
    return (
      <div
        className="fixed inset-0 w-screen min-h-[100svh] h-[calc(var(--hyperborea-vh,1vh)*100)] bg-black overflow-hidden select-none touch-none"
      >
        {/* Initialization Overlay */}
        <AnimatePresence>
          {levelLoadState === "loading" && (
            <motion.div
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-[#0a1020] flex flex-col items-center justify-center"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-cyan-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-[0.3em] mb-2">Neural Syncing</h2>
              <p className="text-cyan-500/60 font-mono text-[10px] uppercase animate-pulse">Building_Hyperborean_Geometry_0x{sessionId.slice(-4)}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(rgba(18,16,16,0)_0,rgba(18,16,16,0.1)_50%,rgba(18,16,16,0)_100%)] bg-[length:100%_2px]" />
        </div>
        {/* Game Canvas */}
        <div className="w-full h-full relative z-0">
          <HyperboreaGame
            key={gameSession}
            onEnergyChange={setEnergy}
            onCloverCollect={setCloversCollected}
            onScoreChange={handleScoreChange}
            onUtilityPointsChange={handleUtilityPointsChange}
            onStructuredScoreChange={handleStructuredScoreChange}
            onRunComplete={handleRunComplete}
            onPowerUpChange={setActivePowerUps}
            onArtifactCollected={handleArtifactCollected}
            onStatusChange={setGameHint}
            onInteractionHintChange={handleInteractionHintChange}
            levelDefinition={activeLevel}
            sessionId={sessionId}
            isPaused={isPaused}
            onRuntimeError={(message) => {
              setGameRuntimeError(message);
              setIsPaused(true);
            }}
          />
        </div>

        {gameRuntimeError && (
          <div className="theme-overlay-shell absolute inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto">
            <div className="theme-panel max-w-xl w-full p-6 text-center">
              <h2 className="text-xl font-bold text-red-300 mb-3">Rendering Error Detected</h2>
              <p className="text-sm text-[#d7e2f3] mb-4">
                {gameRuntimeError}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="theme-cta theme-cta--loud theme-cta--compact px-4 py-2"
                >
                  Retry Level
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="theme-cta theme-cta--muted theme-cta--compact px-4 py-2"
                >
                  Exit to Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game HUD Overlay */}
        <GameHUD
          energy={energy}
          cloversCollected={cloversCollected}
          score={score}
          combo={combo}
          activePowerUps={activePowerUps}
          walletConnected={walletConnected}
          utilityPoints={utilityPoints}
          projectedTokenUnits={projectedUtilityUnits}
          tokenSymbol={activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"}
          elapsedSeconds={elapsedSeconds}
          objectiveProgress={objectiveProgress}
        />

        {/* Central score ribbon for instant readability on all devices */}
        <div className="absolute top-[max(0.4rem,env(safe-area-inset-top))] sm:top-4 left-1/2 z-20 w-[min(98vw,860px)] -translate-x-1/2 px-1 sm:px-2 pointer-events-none">
          <div className="theme-floating-panel theme-floating-panel--info px-2 py-1.5 sm:px-3 sm:py-2 bg-black/40 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-1 text-[9px] sm:grid-cols-6 sm:text-sm">
              <div className="rounded border border-cyan-500/30 bg-black/45 px-2 py-1 text-cyan-100">
                <div className="text-[10px] uppercase tracking-wide text-cyan-300/90">Score</div>
                <div className="font-bold">{score.toLocaleString()}</div>
              </div>
              <div className="rounded border border-blue-500/30 bg-black/45 px-2 py-1 text-blue-100">
                <div className="text-[10px] uppercase tracking-wide text-blue-300/90">Time</div>
                <div className="font-bold">{formatElapsed(elapsedSeconds)}</div>
              </div>
              <div className="rounded border border-emerald-500/30 bg-black/45 px-2 py-1 text-emerald-100">
                <div className="text-[10px] uppercase tracking-wide text-emerald-300/90">Utility</div>
                <div className="font-bold">
                  {utilityPoints.toLocaleString()} pts | {projectedUtilityUnits}{" "}
                  {activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"}
                </div>
              </div>
              <div className="rounded border border-yellow-500/30 bg-black/45 px-2 py-1 text-yellow-100">
                <div className="text-[10px] uppercase tracking-wide text-yellow-300/90">Combo</div>
                <div className="font-bold">{combo}x</div>
              </div>
              <div className="rounded border border-fuchsia-500/30 bg-black/45 px-2 py-1 text-fuchsia-100">
                <div className="text-[10px] uppercase tracking-wide text-fuchsia-300/90">Run Progress</div>
                <div className="font-bold">
                  {scoreSnapshot
                    ? `${scoreSnapshot.relicsCollected} relics | ${scoreSnapshot.runesActivated} runes`
                    : `${cloversCollected} relics`}
                </div>
              </div>
              <div className="rounded border border-indigo-500/30 bg-black/45 px-2 py-1 text-indigo-100">
                <div className="text-[10px] uppercase tracking-wide text-indigo-300/90">Objective</div>
                <div className="font-bold">{Math.round(objectiveProgress)}%</div>
              </div>
            </div>
            <div className="mt-2">
              <progress
                className="h-2 w-full overflow-hidden rounded-full bg-emerald-950/60 [&::-webkit-progress-bar]:bg-emerald-950/60 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-emerald-400 [&::-webkit-progress-value]:via-cyan-300 [&::-webkit-progress-value]:to-emerald-400 [&::-moz-progress-bar]:bg-emerald-400"
                value={Math.max(0, Math.min(utilityProgressPercent, 100))}
                max={100}
              />
              <div className="mt-1 text-[11px] text-emerald-200/90">
                {pointsToNextToken} utility pts to next projected{" "}
                {activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"} reward unit
              </div>
            </div>
          </div>
        </div>

        {/* NFT Minting Panel - Hidden on mobile */}
        <div className="hidden lg:block">
          <NFTMintPanel
            walletConnected={walletConnected}
            onMintNFT={handleMintNFT}
          />
        </div>

        {/* Audio Control */}
        <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-4 pointer-events-auto z-20">
          <GameAudio audioUrl="/hyperborea-ambient.mp3" autoPlay />
        </div>

        {/* Session + Level Status */}
        <div className="absolute top-[max(0.6rem,env(safe-area-inset-top))] right-4 z-20 hidden w-80 max-w-[calc(100vw-1.5rem)] space-y-2 pointer-events-none sm:block max-[900px]:hidden">
          {activeLevel && (
            <div className="theme-floating-panel theme-floating-panel--success p-3 text-xs sm:text-sm">
              <div className="font-bold text-emerald-300">{activeLevel.name}</div>
              <div className="text-emerald-100/80">
                Zelda-like puzzle route: {activeLevel.puzzleNodes.length} nodes | Relics:{" "}
                {activeLevel.artifacts.length}
              </div>
              <div className="text-emerald-100/70">
                Rewards network: {activeLevel.tokenConfig.l2TokenSymbol} on {activeLevel.tokenConfig.l2Network}
              </div>
              <div className="text-emerald-100">
                Score: {score.toLocaleString()} | Combo: {combo}x
              </div>
              {scoreSnapshot && (
                <div className="text-emerald-100/80">
                  Coins: {scoreSnapshot.coinsCollected} | Runes: {scoreSnapshot.runesActivated} | Relics:{" "}
                  {scoreSnapshot.relicsCollected}
                </div>
              )}
              <div className="text-emerald-100/80">
                Utility points: {utilityPoints.toLocaleString()} | Projected token units:{" "}
                {projectedUtilityUnits} {activeLevel.tokenConfig.l2TokenSymbol}
              </div>
            </div>
          )}

          {topArtifacts.map((artifact) => (
            <div
              key={artifact.eventId}
              className="theme-floating-panel theme-floating-panel--info p-2 text-xs text-cyan-100"
            >
              <div className="font-semibold">{artifact.artifactName}</div>
              <div>
                {artifact.pantheon.toUpperCase()} | +{artifact.tokenRewardUnits}{" "}
                {activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"}
                {artifact.lockedAtPickup ? " | Dormant" : ""}
              </div>
              {typeof artifact.utilityPointsAfterEvent === "number" && (
                <div>
                  Utility: {artifact.utilityPointsAfterEvent.toLocaleString()} pts
                  {artifact.utilityTokenBonusUnits
                    ? ` | ${artifact.utilityTokenBonusUnits} projected ${
                        activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"
                      }`
                    : ""}
                </div>
              )}
            </div>
          ))}

          {claimFeedback && (
            <div className="theme-floating-panel theme-floating-panel--warning p-2 text-xs text-yellow-200">
              {claimFeedback}
            </div>
          )}

          {gameHint && (
            <div className="theme-floating-panel theme-floating-panel--info p-2 text-xs text-blue-100">
              {gameHint}
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 flex gap-2 pointer-events-auto z-20">
          <button
            onClick={togglePause}
            className="theme-cta theme-cta--secondary theme-cta--compact px-4 py-2 backdrop-blur-sm flex items-center gap-2"
            title="Pause Game"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Pause</span>
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="theme-cta theme-cta--muted theme-cta--compact px-4 py-2 backdrop-blur-sm flex items-center gap-2"
            title="Show Help"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </button>
          <button
            onClick={handleExit}
            className="theme-cta theme-cta--loud theme-cta--compact px-4 py-2 backdrop-blur-sm flex items-center gap-2"
            title="Exit Game"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>

        {/* OAuth + Web5 Controls */}
        <div className="absolute top-[max(0.6rem,env(safe-area-inset-top))] left-4 sm:left-auto sm:right-[22rem] z-20 pointer-events-auto max-[900px]:hidden">
          <div className="theme-floating-panel theme-floating-panel--success px-3 py-2 text-xs text-emerald-100 space-y-2 min-w-[220px]">
            <div className="font-semibold text-emerald-300">Leaderboard Profile</div>
            <input
              value={playerAlias}
              onChange={(event) => setPlayerAlias(event.target.value.slice(0, 32))}
              className="w-full rounded border border-emerald-500/40 bg-black/45 px-2 py-1 text-emerald-100 outline-none"
              placeholder="Leaderboard name"
              aria-label="Leaderboard display name"
            />
            <div className="flex flex-wrap gap-2">
              {oauthProvider === "guest" ? (
                <>
                  <button
                    type="button"
                    onClick={() => signIn("google")}
                    className="theme-cta theme-cta--compact px-2 py-1 text-xs inline-flex items-center gap-1"
                  >
                    <LogIn className="h-3 w-3" />
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => signIn("facebook")}
                    className="theme-cta theme-cta--secondary theme-cta--compact px-2 py-1 text-xs inline-flex items-center gap-1"
                  >
                    <LogIn className="h-3 w-3" />
                    Facebook
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="theme-cta theme-cta--muted theme-cta--compact px-2 py-1 text-xs inline-flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out ({oauthProvider})
                </button>
              )}
            </div>
            <div className="text-[11px] text-emerald-200/80">
              Wallet-linked score submissions can unlock utility rewards when enabled.
            </div>
            <WalletButton />
          </div>
        </div>

        {/* Always-visible controls primer */}
        <div className="absolute top-4 left-4 z-20 hidden sm:block pointer-events-none">
          <div className="theme-floating-panel theme-floating-panel--info px-3 py-2 text-xs text-gray-100">
            <div className="font-bold text-emerald-300">Controls</div>
            <div>Move: W/S or ↑/↓</div>
            <div>Turn: A/D or ←/→</div>
            <div>Use/Interact: E, ENTER, or SPACE</div>
            <div className="text-cyan-200">If keyboard stalls, click the game view to re-focus.</div>
            <div className="text-emerald-200">Mobile: move close to relics to auto-pickup, then tap Use at rune gates/exit gate</div>
          </div>
        </div>

        {/* Quick onboarding coach */}
        {showControlCoach && !isPaused && (
          <div className="absolute top-20 inset-x-0 z-20 pointer-events-none flex justify-center px-3">
            <div className="theme-floating-panel theme-floating-panel--success max-w-xl px-4 py-3 text-xs sm:text-sm text-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-300">Quick Start</div>
                  <div>1) <span className="text-cyan-300 font-semibold">W/S</span> to move, <span className="text-cyan-300 font-semibold">Shift</span> to sprint | <span className="text-cyan-300 font-semibold">A/D</span> to turn.</div>
                  <div>2) Move close to relics to auto-pickup.</div>
                  <div>3) Center crosshair on glowing runes and press <span className="text-cyan-300 font-semibold">E</span> (or tap Use).</div>
                </div>
                <button
                  onClick={() => setShowControlCoach(false)}
                  className="pointer-events-auto text-emerald-300/70 hover:text-emerald-100 transition-colors ml-3"
                  aria-label="Close tips"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center crosshair + contextual interaction prompt */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center px-3">
          <div
            className={`h-5 w-5 rounded-full border bg-cyan-100/10 transition-all duration-200 ${
              isInteractionReady
                ? "border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.8)] scale-110"
                : "border-cyan-300/70"
            }`}
          />
          {interactionHint && (
            <div
              className={`mt-3 max-w-sm rounded-md border px-3 py-1.5 text-center text-[11px] sm:text-xs backdrop-blur transition-all duration-200 ${
                isInteractionReady
                  ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100 shadow-lg"
                  : "border-cyan-300/40 bg-black/55 text-cyan-100"
              }`}
            >
              {interactionHint}
            </div>
          )}
        </div>

        {/* Desktop fallback controls: helps when keyboard focus is lost */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 sm:flex">
          <div className="theme-floating-panel theme-floating-panel--info pointer-events-auto flex items-center gap-3 p-3">
            <button
              type="button"
              {...getHoldButtonHandlers("turn_left")}
              aria-label="Turn left"
              className="theme-cta theme-cta--secondary px-4 py-3 text-sm font-semibold"
            >
              Turn L
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("forward")}
              aria-label="Move forward"
              className="theme-cta theme-cta--loud px-4 py-3 text-sm font-semibold"
            >
              Forward
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("backward")}
              aria-label="Move backward"
              className="theme-cta theme-cta--muted px-4 py-3 text-sm font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("turn_right")}
              aria-label="Turn right"
              className="theme-cta theme-cta--secondary px-4 py-3 text-sm font-semibold"
            >
              Turn R
            </button>
            <button
              type="button"
              aria-label="Use or interact"
              onClick={() => emitControlAction("use", true)}
              className={`theme-cta px-4 py-3 text-sm font-semibold ${
                isInteractionReady ? "theme-cta--loud animate-pulse" : "theme-cta--secondary"
              }`}
            >
              Use
            </button>
          </div>
        </div>

        {/* Mobile touch controls: ergonomic layout */}
        <div className="absolute bottom-6 inset-x-0 z-20 flex justify-between items-end px-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:hidden pointer-events-none">
          {/* Movement Cluster (D-pad style) */}
          <div className="pointer-events-auto grid grid-cols-3 gap-2 p-3 bg-black/30 backdrop-blur-[1px] rounded-2xl border border-white/10 shadow-2xl opacity-75 active:opacity-100 transition-opacity">
            <div />
            <button
              type="button"
              {...getHoldButtonHandlers("forward")}
              aria-label="Move forward"
              className="theme-cta theme-cta--loud w-16 h-16 flex items-center justify-center rounded-xl bg-emerald-500/30 border-emerald-400/20 active:scale-90 transition-transform [touch-action:manipulation]"
            >
              <span className="text-2xl">↑</span>
            </button>
            <div />

            <button
              type="button"
              {...getHoldButtonHandlers("turn_left")}
              aria-label="Turn left"
              className="theme-cta theme-cta--secondary w-16 h-16 flex items-center justify-center rounded-xl bg-white/5 border-white/5 active:scale-90 transition-transform [touch-action:manipulation]"
            >
              <span className="text-2xl">←</span>
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("backward")}
              aria-label="Move backward"
              className="theme-cta theme-cta--muted w-16 h-16 flex items-center justify-center rounded-xl bg-white/10 border-white/10 active:scale-90 transition-transform [touch-action:manipulation]"
            >
              <span className="text-2xl">↓</span>
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("turn_right")}
              aria-label="Turn right"
              className="theme-cta theme-cta--secondary w-16 h-16 flex items-center justify-center rounded-xl bg-white/5 border-white/5 active:scale-90 transition-transform [touch-action:manipulation]"
            >
              <span className="text-2xl">→</span>
            </button>
          </div>

          {/* Action Button */}
          <div className="pointer-events-auto opacity-75 active:opacity-100 transition-opacity">
            <button
              type="button"
              aria-label="Use or interact"
              onClick={() => emitControlAction("use", true)}
              className={`w-24 h-24 rounded-full flex items-center justify-center text-xs font-black uppercase tracking-widest shadow-2xl transition-all [touch-action:manipulation] ${
                isInteractionReady
                  ? "bg-emerald-500 text-white border-4 border-emerald-300 animate-pulse scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  : "bg-white/15 text-white/60 border-2 border-white/15 active:scale-95"
              }`}
            >
              {isInteractionReady ? "USE" : "ACTION"}
            </button>
          </div>
        </div>

        {/* Final Score + Leaderboard */}
        {showRunCompleteModal && runCompleteSummary && (
          <div className="theme-overlay-shell absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto">
            <div className="theme-panel w-full max-w-3xl p-5 text-emerald-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-emerald-300">Run Complete</div>
                  <div className="text-sm text-emerald-100/80">
                    Final score submitted to leaderboard
                    {walletAddress ? ` | Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRunCompleteModal(false)}
                  className="theme-cta theme-cta--muted theme-cta--compact px-3 py-1"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
                <div className="theme-floating-panel theme-floating-panel--success p-2">
                  Score: {runCompleteSummary.score.toLocaleString()}
                </div>
                <div className="theme-floating-panel theme-floating-panel--success p-2">
                  Coins: {runCompleteSummary.coinsCollected} ({runCompleteSummary.coinPoints} pts)
                </div>
                <div className="theme-floating-panel theme-floating-panel--success p-2">
                  Runes: {runCompleteSummary.runesActivated} ({runCompleteSummary.runePoints} pts)
                </div>
                <div className="theme-floating-panel theme-floating-panel--success p-2">
                  Relics: {runCompleteSummary.relicsCollected} ({runCompleteSummary.relicPoints} pts)
                </div>
                <div className="theme-floating-panel theme-floating-panel--success p-2">
                  Explore: {runCompleteSummary.explorationPoints} pts
                </div>
                <div className="theme-floating-panel theme-floating-panel--success p-2">
                  Utility: {runCompleteSummary.utilityPoints} pts | {runCompleteSummary.projectedTokenUnits}{" "}
                  {activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"}
                </div>
              </div>

              <div className="theme-floating-panel theme-floating-panel--info mt-4 p-3">
                <div className="mb-2 flex items-center gap-2 text-cyan-200 font-semibold">
                  <Medal className="h-4 w-4" />
                  Leaderboard Top 10
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  {leaderboardEntries.length === 0 && <div>No leaderboard entries yet.</div>}
                  {leaderboardEntries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="theme-floating-panel theme-floating-panel--info flex items-center justify-between px-2 py-1"
                    >
                      <div>
                        #{index + 1} {entry.displayName} ({entry.oauthProvider})
                      </div>
                      <div>
                        {entry.score.toLocaleString()} pts | {entry.projectedTokenUnits}{" "}
                        {activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="theme-cta theme-cta--loud theme-cta--compact px-3 py-2"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="theme-cta theme-cta--muted theme-cta--compact px-3 py-2"
                >
                  Exit to Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Overlay */}
        {showTutorial && (
          <div className="theme-overlay-shell absolute inset-0 flex items-center justify-center z-30 pointer-events-auto">
            <div className="theme-panel p-6 sm:p-8 max-w-2xl mx-4 sm:mx-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-[#8fffb6]" />
                  How to Play
                </h2>
                <button
                  onClick={() => setShowTutorial(false)}
                  aria-label="Close tutorial"
                  title="Close tutorial"
                  className="text-[#99aebb] hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 text-[#d8e6ef]">
                <div className="theme-floating-panel theme-floating-panel--success p-4">
                  <h3 className="text-xl font-bold text-[#88ffc0] mb-3">
                    🎯 Objective
                  </h3>
                  <p className="text-sm sm:text-base">
                    Explore the fortress, solve shrine puzzles, and recover
                    Norse/Celtic relics to unlock the exit gate.
                  </p>
                </div>

                <div className="theme-floating-panel theme-floating-panel--info p-4">
                  <h3 className="text-xl font-bold text-[#99ecff] mb-3">
                    🎮 Controls
                  </h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold">
                        W / ↑
                      </span>
                      <span>Move forward (hold <span className="font-mono text-cyan-300">Shift</span> to sprint)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold">
                        S / ↓
                      </span>
                      <span>Move backward</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold">
                        A / D or ← / →
                      </span>
                      <span>Turn left or right</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold text-sm sm:text-base">
                        E / ENTER / SPACE
                      </span>
                      <span>Use/interact with puzzle nodes and gates (relics auto-pickup nearby)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold text-sm sm:text-base">
                        MOBILE
                      </span>
                      <span>Hold a direction button ~1 second (or swipe up/down), move close to relics, then tap Use at rune targets</span>
                    </div>
                  </div>
                </div>

                <div className="theme-floating-panel theme-floating-panel--warning p-4">
                  <h3 className="text-xl font-bold text-[#ffd188] mb-3">
                    ✨ Tips
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base list-disc list-inside">
                    <li>Relics auto-pickup when you move close enough.</li>
                    <li>Stay near the center crosshair before pressing Use.</li>
                    <li>Purple/red gate nodes block corridors until activated.</li>
                    <li>Pressure plates activate when you stand directly on them.</li>
                    <li>Relics boost energy and queue token claim events.</li>
                    <li>Utility points grow from movement, puzzle solves, and relic pickups.</li>
                    <li>The exit gate unlocks after relic and pedestal requirements are met.</li>
                    <li>Connect your wallet to mint NFT skins with rewards</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="theme-cta theme-cta--loud px-6 sm:px-8 py-3 text-base sm:text-lg"
                >
                  Got it! Let&apos;s Play
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Menu */}
        {isPaused && (
          <div className="theme-overlay-shell absolute inset-0 flex items-center justify-center z-30 pointer-events-auto">
            <div className="theme-panel p-6 sm:p-8 max-w-md mx-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-6">
                Game Paused
              </h2>

              <div className="space-y-3">
                <button
                  onClick={togglePause}
                  className="theme-cta theme-cta--loud w-full px-6 py-3 flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <Play className="w-5 h-5" />
                  Resume Game
                </button>

                <button
                  onClick={handleRestart}
                  className="theme-cta theme-cta--secondary w-full px-6 py-3 flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart Game
                </button>

                <button
                  onClick={() => setShowTutorial(true)}
                  className="theme-cta theme-cta--muted w-full px-6 py-3 flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <HelpCircle className="w-5 h-5" />
                  View Tutorial
                </button>

                <button
                  onClick={handleExit}
                  className="theme-cta theme-cta--loud w-full px-6 py-3 flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <X className="w-5 h-5" />
                  Exit to Menu
                </button>
              </div>

              {/* Stats Display */}
              <div className="mt-6 pt-6 border-t border-[#4f6b75]">
                <h3 className="text-white font-bold mb-3 text-center">
                  Current Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="theme-floating-panel theme-floating-panel--warning p-3">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-white font-bold">{energy}</div>
                    <div className="text-xs text-[#9eb4c2]">Energy</div>
                  </div>
                  <div className="theme-floating-panel theme-floating-panel--success p-3">
                    <div className="text-2xl mb-1">🍀</div>
                    <div className="text-white font-bold">
                      {cloversCollected}
                    </div>
                    <div className="text-xs text-[#9eb4c2]">Relics</div>
                  </div>
                  <div className="theme-floating-panel theme-floating-panel--info p-3">
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="text-white font-bold">
                      {score.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#9eb4c2]">Score</div>
                  </div>
                  <div className="theme-floating-panel theme-floating-panel--warning p-3">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-white font-bold">{combo}x</div>
                    <div className="text-xs text-[#9eb4c2]">Combo</div>
                  </div>
                  <div className="theme-floating-panel theme-floating-panel--success col-span-2 p-3">
                    <div className="text-2xl mb-1">🪙</div>
                    <div className="text-white font-bold">
                      {utilityPoints.toLocaleString()} pts | {projectedUtilityUnits}{" "}
                      {activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"} projected
                    </div>
                    <div className="text-xs text-[#9eb4c2]">Web5 Utility Rewards</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="theme-badge inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold mb-6">
            <Star className="w-4 h-4" />
            BETA VERSION - PLAY NOW!
          </div>

          <h1 className="theme-title text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Hyperborea
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto px-4">
            Experience the ultimate browser-based adventure game with blockchain
            integration. Play, compete, and earn exclusive NFT rewards!
          </p>

          {/* Prominent Quick Play Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={handlePlayClick}
              className="theme-cta theme-cta--loud w-full sm:w-auto px-8 py-4 text-lg inline-flex items-center justify-center gap-3"
            >
              <Gamepad2 className="w-6 h-6" />
              Quick Play (Free)
            </button>

            <button
              onClick={() => setShowTutorial(true)}
              className="theme-cta theme-cta--secondary w-full sm:w-auto px-6 py-3 inline-flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-5 h-5" />
              How to Play
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>No Download Required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Play Instantly</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Mobile & Desktop</span>
            </div>
          </div>

          <div className="mt-6 mx-auto max-w-3xl rounded-xl border border-cyan-500/30 bg-black/45 p-4 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-cyan-300 font-bold">Leaderboard Identity</div>
                <div className="text-xs text-gray-300">
                  Sign in with OAuth or play as guest. Optional wallet connection can enable wallet-based rewards.
                </div>
              </div>
              <WalletButton />
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={playerAlias}
                onChange={(event) => setPlayerAlias(event.target.value.slice(0, 32))}
                className="flex-1 rounded border border-cyan-500/30 bg-black/60 px-3 py-2 text-sm text-cyan-100 outline-none"
                placeholder="Display name"
                aria-label="Display name"
              />
              {oauthProvider === "guest" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => signIn("google")}
                    className="theme-cta theme-cta--compact px-3 py-2 text-sm inline-flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Google OAuth
                  </button>
                  <button
                    type="button"
                    onClick={() => signIn("facebook")}
                    className="theme-cta theme-cta--secondary theme-cta--compact px-3 py-2 text-sm inline-flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Facebook OAuth
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="theme-cta theme-cta--muted theme-cta--compact px-3 py-2 text-sm inline-flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out ({oauthProvider})
                </button>
              )}
            </div>
            {leaderboardEntries.length > 0 && (
              <div className="mt-3 rounded border border-cyan-500/20 bg-black/35 p-2 text-xs text-cyan-100">
                <div className="mb-1 font-semibold text-cyan-300">Current Top 5</div>
                {leaderboardEntries.slice(0, 5).map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between py-0.5">
                    <span>
                      #{index + 1} {entry.displayName}
                    </span>
                    <span>{entry.score.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="theme-floating-panel theme-floating-panel--success mt-6 mx-auto max-w-3xl p-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-emerald-300 font-bold">Level Blueprint Status</div>
                <div className="text-sm text-[#cfdeea]">
                  {levelLoadState === "loading"
                    ? "Loading puzzle level..."
                    : levelLoadMessage}
                </div>
              </div>
              <div className="text-xs text-[#93adbb]">
                {activeLevel
                  ? `${activeLevel.puzzleNodes.length} puzzle nodes | ${activeLevel.artifacts.length} artifacts`
                  : "Preparing level data"}
              </div>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-[#d5e7f3]">
              <div className="theme-floating-panel theme-floating-panel--info p-2">
                Desktop: W/S move, A/D turn, E/Space for runes/exit gate. Relics auto-pickup when close.
              </div>
              <div className="theme-floating-panel theme-floating-panel--info p-2">
                Mobile: hold Forward/Back/Turn for ~1 second or swipe up/down, move near relics, then tap Use at rune targets.
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Modal (when not playing) */}
        {showTutorial && (
          <div className="theme-overlay-shell fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="theme-panel p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-[#8fffb6]" />
                  How to Play
                </h2>
                <button
                  onClick={() => setShowTutorial(false)}
                  aria-label="Close tutorial"
                  title="Close tutorial"
                  className="text-[#9db2be] hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 text-[#d8e6ef]">
                <div className="theme-floating-panel theme-floating-panel--success p-4">
                  <h3 className="text-xl font-bold text-[#88ffc0] mb-3">
                    🎯 Objective
                  </h3>
                  <p className="text-sm sm:text-base">
                    Navigate the Escher-inspired impossible maze and collect
                    relic artifacts while solving shrine gates and pedestal logic.
                    Activate the final exit gate to complete the level.
                  </p>
                </div>

                <div className="theme-floating-panel theme-floating-panel--info p-4">
                  <h3 className="text-xl font-bold text-[#99ecff] mb-3">
                    🎮 Controls
                  </h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold">
                        W / ↑
                      </span>
                      <span>Move forward (hold <span className="font-mono text-cyan-300">Shift</span> to sprint)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold">
                        S / ↓
                      </span>
                      <span>Move backward</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold">
                        A / D or ← / →
                      </span>
                      <span>Turn left or right</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold text-sm sm:text-base">
                        E / ENTER / SPACE
                      </span>
                      <span>Use/interact with puzzle nodes and gates (relics auto-pickup nearby)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono rounded border border-[#5aa581]/45 bg-[#0b2219]/80 px-3 py-1 text-[#95ffc5] font-bold text-sm sm:text-base">
                        MOBILE
                      </span>
                      <span>Hold a direction button ~1 second (or swipe up/down), move close to relics, then tap Use at rune targets</span>
                    </div>
                  </div>
                </div>

                <div className="theme-floating-panel theme-floating-panel--warning p-4">
                  <h3 className="text-xl font-bold text-[#ffd188] mb-3">
                    ✨ Tips
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base list-disc list-inside">
                    <li>Relics auto-pickup when you move close enough.</li>
                    <li>Stay near the center crosshair before pressing Use.</li>
                    <li>Purple/red gate nodes block corridors until activated.</li>
                    <li>Pressure plates activate when you stand directly on them.</li>
                    <li>Relics boost energy and queue token claim events.</li>
                    <li>Utility points grow from movement, puzzle solves, and relic pickups.</li>
                    <li>The exit gate unlocks after relic and pedestal requirements are met.</li>
                    <li>Connect your wallet to mint NFT skins with rewards</li>
                    <li>Use the pause button anytime to take a break</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="theme-cta theme-cta--loud px-6 sm:px-8 py-3 text-base sm:text-lg"
                >
                  Got it! Let&apos;s Play
                </button>
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    setShowControlCoach(true);
                  }}
                  className="theme-cta theme-cta--secondary px-6 sm:px-8 py-3 text-base sm:text-lg"
                >
                  Show In-Game Tips
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ad Placement */}
        <div className="mb-12">
          <AdSenseBlock adSlot="game-top" adFormat="horizontal" />
        </div>

        {/* Game Preview */}
        <div className="theme-panel p-8 mb-12 min-h-[600px] flex items-center justify-center relative">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c1a14]/55 via-transparent to-[#0f2530]/40 animate-pulse"></div>

          <div className="text-center relative z-10">
            <Gamepad2 className="w-24 h-24 text-[#8fffb6] mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Enter Hyperborea?
            </h2>
            <p className="theme-subtitle mb-6 max-w-lg mx-auto">
              Explore a first-person mythic fortress, solve Zelda-style lock and
              pedestal puzzles, recover pantheon relics, and open the final
              astral gate.
            </p>
            <button
              onClick={handlePlayClick}
              className="theme-cta theme-cta--loud px-6 py-3 inline-flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Launch Game
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Compete & Win"
            description="Climb the leaderboards and compete with players worldwide for exclusive rewards."
          />
          <FeatureCard
            icon={<Star className="w-8 h-8" />}
            title="NFT Achievements"
            description="Earn unique NFT achievements that can be traded or showcased in your collection."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Power-Ups"
            description="Unlock powerful abilities and premium features to enhance your gameplay."
          />
        </div>

        {/* Premium Upgrade Section */}
        <div className="mb-12">
          <PremiumUpgrade />
        </div>

        {/* Game Info */}
        <div className="theme-panel p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            About Hyperborea
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-[#d8e6ef]">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Free Tier
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#8fffb6] mt-1">✓</span>
                  <span>3 lives per session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8fffb6] mt-1">✓</span>
                  <span>Access to basic levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8fffb6] mt-1">✓</span>
                  <span>Standard achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">✗</span>
                  <span className="text-[#8ca2b0]">Ad-supported gameplay</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Premium ($4.99)
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#8fffb6] mt-1">✓</span>
                  <span>Unlimited lives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8fffb6] mt-1">✓</span>
                  <span>All levels + bonus content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8fffb6] mt-1">✓</span>
                  <span>Exclusive NFT achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8fffb6] mt-1">✓</span>
                  <span>Ad-free experience</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="game-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="theme-panel p-6 text-center transition-all hover:shadow-[0_0_22px_rgba(95,255,175,0.16)]">
      <div className="w-16 h-16 rounded-full border border-[#79efb6]/45 bg-[#0d261c]/82 flex items-center justify-center mx-auto mb-4 text-[#8fffb6]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="theme-subtitle">{description}</p>
    </div>
  );
}

