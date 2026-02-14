"use client";

import { GameAudio } from "@/components/game/GameAudio";
import { GameHUD } from "@/components/game/GameHUD";
import { HyperboreaGame } from "@/components/game/HyperboreaGame";
import { NFTMintPanel } from "@/components/game/NFTMintPanel";
import { AdSenseBlock } from "@/components/monetization/AdSenseBlock";
import { PremiumUpgrade } from "@/components/monetization/PremiumUpgrade";
import { generateDefaultLevel001 } from "@/lib/game/level-generator";
import type {
  ArtifactCollectionEvent,
  HyperboreaLevelDefinition,
} from "@/lib/game/level-types";
import { isHyperboreaLevelDefinition } from "@/lib/game/level-types";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { trackEvent } from "@/lib/analytics";
import {
    Gamepad2,
    HelpCircle,
    Pause,
    Play,
    RotateCcw,
    Star,
    Trophy,
    X,
    Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ControlAction = "forward" | "backward" | "turn_left" | "turn_right" | "use";

function createSessionId() {
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function GamePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameSession, setGameSession] = useState(0);
  const [sessionId, setSessionId] = useState(createSessionId);
  const [showTutorial, setShowTutorial] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [cloversCollected, setCloversCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<
    Array<{ type: string; timeLeft: number }>
  >([]);
  const [walletConnected] = useState(false);
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
  const pressedControlsRef = useRef<Set<Exclude<ControlAction, "use">>>(new Set());

  const topArtifacts = useMemo(() => artifactFeed.slice(0, 3), [artifactFeed]);

  // Check localStorage after mount to avoid SSR/hydration issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      const played = localStorage.getItem("hyperborea_played") === "true";
      setHasPlayedBefore(played);
    }
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

  useEffect(
    () => () => {
      releaseAllMovementControls();
    },
    [releaseAllMovementControls],
  );

  const handleArtifactCollected = useCallback(
    async (event: ArtifactCollectionEvent) => {
      setArtifactFeed((previous) => [event, ...previous].slice(0, 8));

      const tokenConfig = activeLevel?.tokenConfig;
      if (!tokenConfig?.enabled) return;

      try {
        const response = await fetch(tokenConfig.claimEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || "Claim queue failed");
        }

        setClaimFeedback(
          `Relic claim queued: ${event.artifactName} (+${event.tokenRewardUnits} ${tokenConfig.l2TokenSymbol})`,
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
    setIsPlaying(true);
    setIsPaused(false);
    setGameSession((value) => value + 1);
    setSessionId(createSessionId());
    setArtifactFeed([]);
    setClaimFeedback("");
    setGameHint("W/S move, A/D turn, E interact. Recover relics to unlock the portal.");
    setInteractionHint("Align crosshair with a nearby rune or relic, then press Use.");
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
    setIsPaused(false);
    setGameSession((value) => value + 1);
    setSessionId(createSessionId());
    setArtifactFeed([]);
    setClaimFeedback("");
    setGameHint("Level restarted. Follow rune hints and use E to interact.");
    setInteractionHint("Level restarted. Re-orient and follow the nearest rune hint.");
    setIsInteractionReady(false);
    setShowControlCoach(true);
  };

  const handleExit = () => {
    releaseAllMovementControls();
    setIsPlaying(false);
    setIsPaused(false);
    setShowTutorial(false);
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

  if (isPlaying) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
        {/* Game Canvas */}
        <div className="w-full h-full">
          <HyperboreaGame
            key={gameSession}
            onEnergyChange={setEnergy}
            onCloverCollect={setCloversCollected}
            onScoreChange={(newScore, newCombo) => {
              setScore(newScore);
              setCombo(newCombo);
            }}
            onPowerUpChange={setActivePowerUps}
            onArtifactCollected={handleArtifactCollected}
            onStatusChange={setGameHint}
            onInteractionHintChange={(hint, actionable) => {
              setInteractionHint(hint);
              setIsInteractionReady(actionable);
            }}
            levelDefinition={activeLevel}
            sessionId={sessionId}
            isPaused={isPaused}
          />
        </div>

        {/* Game HUD Overlay */}
        <GameHUD
          energy={energy}
          cloversCollected={cloversCollected}
          score={score}
          combo={combo}
          activePowerUps={activePowerUps}
          walletConnected={walletConnected}
        />

        {/* NFT Minting Panel - Hidden on mobile */}
        <div className="hidden lg:block">
          <NFTMintPanel
            walletConnected={walletConnected}
            onMintNFT={handleMintNFT}
          />
        </div>

        {/* Audio Control */}
        <div className="absolute bottom-4 right-4 pointer-events-auto z-20">
          <GameAudio audioUrl="/hyperborea-ambient.mp3" autoPlay />
        </div>

        {/* Session + Level Status */}
        <div className="absolute top-4 right-4 z-20 w-80 max-w-[calc(100vw-1.5rem)] space-y-2 pointer-events-none">
          {activeLevel && (
            <div className="rounded-lg border border-emerald-400/40 bg-black/75 p-3 text-xs sm:text-sm text-emerald-200 backdrop-blur">
              <div className="font-bold text-emerald-300">{activeLevel.name}</div>
              <div className="text-emerald-100/80">
                Zelda-like puzzle route: {activeLevel.puzzleNodes.length} nodes | Relics:{" "}
                {activeLevel.artifacts.length}
              </div>
              <div className="text-emerald-100/70">
                L2/Web5 queue: {activeLevel.tokenConfig.l2TokenSymbol} on {activeLevel.tokenConfig.l2Network}
              </div>
            </div>
          )}

          {topArtifacts.map((artifact) => (
            <div
              key={artifact.eventId}
              className="rounded-lg border border-cyan-400/40 bg-black/80 p-2 text-xs text-cyan-100 backdrop-blur"
            >
              <div className="font-semibold">{artifact.artifactName}</div>
              <div>
                {artifact.pantheon.toUpperCase()} | +{artifact.tokenRewardUnits}{" "}
                {activeLevel?.tokenConfig.l2TokenSymbol ?? "THX"}
              </div>
            </div>
          ))}

          {claimFeedback && (
            <div className="rounded-lg border border-yellow-400/40 bg-black/80 p-2 text-xs text-yellow-200 backdrop-blur">
              {claimFeedback}
            </div>
          )}

          {gameHint && (
            <div className="rounded-lg border border-blue-400/40 bg-black/80 p-2 text-xs text-blue-100 backdrop-blur">
              {gameHint}
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto z-20">
          <button
            onClick={togglePause}
            className="px-4 py-2 bg-blue-600/90 hover:bg-blue-700 text-white rounded-lg font-bold transition-all backdrop-blur-sm flex items-center gap-2"
            title="Pause Game"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Pause</span>
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="px-4 py-2 bg-purple-600/90 hover:bg-purple-700 text-white rounded-lg font-bold transition-all backdrop-blur-sm flex items-center gap-2"
            title="Show Help"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </button>
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-lg font-bold transition-all backdrop-blur-sm flex items-center gap-2"
            title="Exit Game"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>

        {/* Always-visible controls primer */}
        <div className="absolute top-4 left-4 z-20 hidden sm:block pointer-events-none">
          <div className="rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-xs text-gray-100 backdrop-blur">
            <div className="font-bold text-emerald-300">Controls</div>
            <div>Move: W/S or ↑/↓</div>
            <div>Turn: A/D or ←/→</div>
            <div>Use/Interact: E, ENTER, or SPACE</div>
            <div className="text-emerald-200">Mobile: hold a movement button 1s or swipe up/down to step, then tap Use</div>
          </div>
        </div>

        {/* Quick onboarding coach */}
        {showControlCoach && !isPaused && (
          <div className="absolute top-20 inset-x-0 z-20 pointer-events-none flex justify-center px-3">
            <div className="max-w-xl rounded-xl border border-emerald-300/40 bg-black/75 px-4 py-3 text-xs sm:text-sm text-emerald-100 backdrop-blur">
              <div className="font-bold text-emerald-300">Quick Start</div>
              <div>1) Move with W/S and turn with A/D.</div>
              <div>2) Center crosshair on glowing node or relic.</div>
              <div>3) Press E (or tap Use) to interact.</div>
            </div>
          </div>
        )}

        {/* Center crosshair + contextual interaction prompt */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center px-3">
          <div
            className={`h-5 w-5 rounded-full border bg-cyan-100/10 transition-all ${
              isInteractionReady
                ? "border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.8)]"
                : "border-cyan-300/70"
            }`}
          />
          {interactionHint && (
            <div
              className={`mt-3 max-w-sm rounded-md border px-3 py-1.5 text-center text-[11px] sm:text-xs backdrop-blur ${
                isInteractionReady
                  ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100"
                  : "border-cyan-300/40 bg-black/55 text-cyan-100"
              }`}
            >
              {interactionHint}
            </div>
          )}
        </div>

        {/* Mobile touch buttons: explicit first-person controls */}
        <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center px-3 sm:hidden pointer-events-none">
          <div className="pointer-events-auto grid grid-cols-3 gap-2 rounded-xl border border-white/20 bg-black/70 p-3 backdrop-blur-md">
            <button
              type="button"
              {...getHoldButtonHandlers("turn_left")}
              aria-label="Turn left"
              className="rounded-lg bg-indigo-600/90 px-3 py-3 text-white font-semibold [touch-action:manipulation]"
            >
              Turn L
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("forward")}
              aria-label="Move forward"
              className="rounded-lg bg-emerald-600/90 px-3 py-3 text-white font-semibold [touch-action:manipulation]"
            >
              Forward
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("turn_right")}
              aria-label="Turn right"
              className="rounded-lg bg-indigo-600/90 px-3 py-3 text-white font-semibold [touch-action:manipulation]"
            >
              Turn R
            </button>
            <button
              type="button"
              {...getHoldButtonHandlers("backward")}
              aria-label="Move backward"
              className="col-span-2 rounded-lg bg-slate-600/90 px-3 py-3 text-white font-semibold [touch-action:manipulation]"
            >
              Back
            </button>
            <button
              type="button"
              aria-label="Use or interact"
              onClick={() => emitControlAction("use", true)}
              className={`rounded-lg px-3 py-3 text-white font-semibold transition-all ${
                isInteractionReady
                  ? "bg-emerald-500/95 shadow-[0_0_14px_rgba(16,185,129,0.8)] animate-pulse"
                  : "bg-pink-600/90"
              } [touch-action:manipulation]`}
            >
              Use
            </button>
          </div>
        </div>

        {/* Tutorial Overlay */}
        {showTutorial && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-auto">
            <div className="bg-gray-900 border-2 border-purple-500 rounded-xl p-6 sm:p-8 max-w-2xl mx-4 sm:mx-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  How to Play
                </h2>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">
                    🎯 Objective
                  </h3>
                  <p className="text-sm sm:text-base">
                    Explore the fortress, solve shrine puzzles, and recover
                    Norse/Celtic relics to unlock the portal.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">
                    🎮 Controls
                  </h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">
                        W / ↑
                      </span>
                      <span>Move forward</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">
                        S / ↓
                      </span>
                      <span>Move backward</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">
                        A / D or ← / →
                      </span>
                      <span>Turn left or right</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold text-sm sm:text-base">
                        E / ENTER / SPACE
                      </span>
                      <span>Use/interact with relics and puzzle nodes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold text-sm sm:text-base">
                        MOBILE
                      </span>
                      <span>Hold a direction button ~1 second (or swipe up/down) then tap Use near the crosshair target</span>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-pink-400 mb-3">
                    ✨ Tips
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base list-disc list-inside">
                    <li>Stay near the center crosshair before pressing Use.</li>
                    <li>Purple/red gate nodes block corridors until activated.</li>
                    <li>Pressure plates activate when you stand directly on them.</li>
                    <li>Relics boost energy and queue token claim events.</li>
                    <li>Portal unlocks after relic and pedestal requirements are met.</li>
                    <li>Connect your wallet to mint NFT skins with rewards</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all text-base sm:text-lg"
                >
                  Got it! Let&apos;s Play
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Menu */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-auto">
            <div className="bg-gray-900 border-2 border-purple-500 rounded-xl p-6 sm:p-8 max-w-md mx-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-6">
                Game Paused
              </h2>

              <div className="space-y-3">
                <button
                  onClick={togglePause}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <Play className="w-5 h-5" />
                  Resume Game
                </button>

                <button
                  onClick={handleRestart}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart Game
                </button>

                <button
                  onClick={() => setShowTutorial(true)}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <HelpCircle className="w-5 h-5" />
                  View Tutorial
                </button>

                <button
                  onClick={handleExit}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  <X className="w-5 h-5" />
                  Exit to Menu
                </button>
              </div>

              {/* Stats Display */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-white font-bold mb-3 text-center">
                  Current Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-purple-500/20 rounded-lg p-3">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-white font-bold">{energy}</div>
                    <div className="text-xs text-gray-400">Energy</div>
                  </div>
                  <div className="bg-pink-500/20 rounded-lg p-3">
                    <div className="text-2xl mb-1">🍀</div>
                    <div className="text-white font-bold">
                      {cloversCollected}
                    </div>
                    <div className="text-xs text-gray-400">Relics</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-lg p-3">
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="text-white font-bold">
                      {score.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                  <div className="bg-yellow-500/20 rounded-lg p-3">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-white font-bold">{combo}x</div>
                    <div className="text-xs text-gray-400">Combo</div>
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
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star className="w-4 h-4" />
            BETA VERSION - PLAY NOW!
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text mb-6">
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
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#00D100] to-[#00FF41] text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-500 transition-all shadow-lg hover:shadow-green-500/50 hover:scale-105 inline-flex items-center justify-center gap-3"
            >
              <Gamepad2 className="w-6 h-6" />
              Quick Play (Free)
            </button>

            <button
              onClick={() => setShowTutorial(true)}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600/20 border-2 border-purple-500 text-purple-300 rounded-xl font-bold hover:bg-purple-600/30 transition-all inline-flex items-center justify-center gap-2"
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

          <div className="mt-6 mx-auto max-w-3xl rounded-xl border border-emerald-500/30 bg-black/40 p-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-emerald-300 font-bold">Level Blueprint Status</div>
                <div className="text-sm text-gray-300">
                  {levelLoadState === "loading"
                    ? "Loading puzzle level..."
                    : levelLoadMessage}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {activeLevel
                  ? `${activeLevel.puzzleNodes.length} puzzle nodes | ${activeLevel.artifacts.length} artifacts`
                  : "Preparing level data"}
              </div>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-gray-200">
              <div className="rounded-md border border-white/15 bg-black/40 p-2">
                Desktop: W/S move, A/D turn, E/Space to interact with nodes and relics.
              </div>
              <div className="rounded-md border border-white/15 bg-black/40 p-2">
                Mobile: hold Forward/Back/Turn for ~1 second or swipe up/down, then tap Use near a target.
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Modal (when not playing) */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-2 border-purple-500 rounded-xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  How to Play
                </h2>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">
                    🎯 Objective
                  </h3>
                  <p className="text-sm sm:text-base">
                    Navigate the Escher-inspired impossible maze and collect
                    relic artifacts while solving shrine gates and pedestal logic.
                    Activate the final portal path to complete the level.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">
                    🎮 Controls
                  </h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">
                        W / ↑
                      </span>
                      <span>Move forward</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">
                        S / ↓
                      </span>
                      <span>Move backward</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">
                        A / D or ← / →
                      </span>
                      <span>Turn left or right</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold text-sm sm:text-base">
                        E / ENTER / SPACE
                      </span>
                      <span>Use/interact with relics and puzzle nodes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold text-sm sm:text-base">
                        MOBILE
                      </span>
                      <span>Hold a direction button ~1 second (or swipe up/down) and tap Use near the crosshair target</span>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-pink-400 mb-3">
                    ✨ Tips
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base list-disc list-inside">
                    <li>Stay near the center crosshair before pressing Use.</li>
                    <li>Purple/red gate nodes block corridors until activated.</li>
                    <li>Pressure plates activate when you stand directly on them.</li>
                    <li>Relics boost energy and queue token claim events.</li>
                    <li>Portal unlocks after relic and pedestal requirements are met.</li>
                    <li>Connect your wallet to mint NFT skins with rewards</li>
                    <li>Use the pause button anytime to take a break</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    handlePlayClick();
                  }}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all text-base sm:text-lg"
                >
                  Start Playing Now!
                </button>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
                >
                  Close
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
        <div className="bg-gray-900/50 border-2 border-purple-500/30 rounded-xl p-8 mb-12 min-h-[600px] flex items-center justify-center relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 animate-pulse"></div>

          <div className="text-center relative z-10">
            <Gamepad2 className="w-24 h-24 text-purple-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Enter Hyperborea?
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Explore a first-person mythic fortress, solve Zelda-style lock and
              pedestal puzzles, recover pantheon relics, and unlock the astral
              portal.
            </p>
            <button
              onClick={handlePlayClick}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all inline-flex items-center gap-2"
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
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            About Hyperborea
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Free Tier
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>3 lives per session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Access to basic levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Standard achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">✗</span>
                  <span className="text-gray-500">Ad-supported gameplay</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Premium ($4.99)
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Unlimited lives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>All levels + bonus content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Exclusive NFT achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
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
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center hover:border-purple-500/30 transition-all">
      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

