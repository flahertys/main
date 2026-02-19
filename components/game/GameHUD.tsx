'use client';

import { Info, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GameHUDProps {
  energy: number;
  cloversCollected: number;
  score: number;
  combo: number;
  walletConnected: boolean;
  utilityPoints?: number;
  projectedTokenUnits?: number;
  tokenSymbol?: string;
  elapsedSeconds?: number;
  objectiveProgress?: number;
  activePowerUps?: Array<{ type: string; timeLeft: number }>;
}

const POWER_UP_META: Record<
  string,
  { label: string; icon: string; borderClass: string }
> = {
  odins_shield: { label: "Odin Shield", icon: "🛡️", borderClass: "border-cyan-400" },
  thors_magnet: { label: "Thor Magnet", icon: "🧲", borderClass: "border-fuchsia-400" },
  freyas_double: { label: "Freyja Double", icon: "✨", borderClass: "border-orange-400" },
  speed: { label: "Speed", icon: "⚡", borderClass: "border-cyan-300" },
  magnet: { label: "Magnet", icon: "🧲", borderClass: "border-yellow-300" },
  double: { label: "Double", icon: "✨", borderClass: "border-orange-400" },
};

const UTILITY_POINTS_PER_TOKEN_UNIT = 25;

const WIDTH_CLASS_BY_STEP: Record<number, string> = {
  0: "w-0",
  5: "w-[5%]",
  10: "w-[10%]",
  15: "w-[15%]",
  20: "w-1/5",
  25: "w-1/4",
  30: "w-[30%]",
  35: "w-[35%]",
  40: "w-2/5",
  45: "w-[45%]",
  50: "w-1/2",
  55: "w-[55%]",
  60: "w-3/5",
  65: "w-[65%]",
  70: "w-[70%]",
  75: "w-3/4",
  80: "w-4/5",
  85: "w-[85%]",
  90: "w-[90%]",
  95: "w-[95%]",
  100: "w-full",
};

function getWidthClass(percent: number) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const step = Math.round(clamped / 5) * 5;
  return WIDTH_CLASS_BY_STEP[step] ?? "w-0";
}

function formatElapsed(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GameHUD({
  energy,
  cloversCollected,
  score,
  combo,
  walletConnected,
  utilityPoints,
  projectedTokenUnits,
  tokenSymbol = "THX",
  elapsedSeconds = 0,
  objectiveProgress,
  activePowerUps = [],
}: GameHUDProps) {
  const energyPercentage = Math.min((energy / 100) * 100, 100);
  const portalUnlocked = energy >= 100;
  const relicsLabel = cloversCollected === 1 ? "1 relic" : `${cloversCollected} relics`;
  const hasUtilityRewards =
    typeof utilityPoints === "number" && typeof projectedTokenUnits === "number";
  const utilityRemainder = hasUtilityRewards
    ? ((utilityPoints % UTILITY_POINTS_PER_TOKEN_UNIT) + UTILITY_POINTS_PER_TOKEN_UNIT) %
      UTILITY_POINTS_PER_TOKEN_UNIT
    : 0;
  const pointsToNextToken = hasUtilityRewards
    ? utilityRemainder === 0
      ? UTILITY_POINTS_PER_TOKEN_UNIT
      : UTILITY_POINTS_PER_TOKEN_UNIT - utilityRemainder
    : 0;
  const utilityProgressPercent = hasUtilityRewards
    ? Math.max(0, Math.min((utilityRemainder / UTILITY_POINTS_PER_TOKEN_UNIT) * 100, 100))
    : 0;
  const energyWidthClass = getWidthClass(energyPercentage);
  const utilityWidthClass = getWidthClass(utilityProgressPercent);
  const objectiveWidthClass = getWidthClass(
    typeof objectiveProgress === "number" ? Math.max(0, Math.min(objectiveProgress, 100)) : 0,
  );
  const [showEnergyPulse, setShowEnergyPulse] = useState(false);
  const [showCloverPulse, setShowCloverPulse] = useState(false);
  const [lastEnergy, setLastEnergy] = useState(energy);
  const [lastClovers, setLastClovers] = useState(cloversCollected);

  // Trigger pulse animations on value changes
  useEffect(() => {
    if (energy > lastEnergy) {
      setShowEnergyPulse(true);
      setTimeout(() => setShowEnergyPulse(false), 500);
    }
    setLastEnergy(energy);
  }, [energy, lastEnergy]);

  useEffect(() => {
    if (cloversCollected > lastClovers) {
      setShowCloverPulse(true);
      setTimeout(() => setShowCloverPulse(false), 500);
    }
    setLastClovers(cloversCollected);
  }, [cloversCollected, lastClovers]);

  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hyperborea_vault_v1") || "[]";
        const vault = JSON.parse(stored);
        setVaultCount(Array.isArray(vault) ? vault.length : 0);
      } catch {
        setVaultCount(0);
      }
    }
  }, [cloversCollected]);

  return (
    <div className="absolute top-[max(0.25rem,env(safe-area-inset-top))] left-0 right-0 p-1 sm:p-4 pointer-events-none z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-1.5 mb-1 sm:mb-2">
          {/* Web5 Vault Status - Compact on mobile */}
          <div className="bg-black/90 backdrop-blur-md border border-cyan-500/40 rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[8px] sm:text-[10px] font-mono text-cyan-400 uppercase tracking-widest whitespace-nowrap">
              Vault: {vaultCount}
            </span>
          </div>
          {combo >= 5 && (
            <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1.5 animate-bounce">
              <span className="text-[8px] sm:text-[10px] font-mono text-yellow-400 uppercase tracking-widest whitespace-nowrap">
                Overclock
              </span>
            </div>
          )}
        </div>
        {/* Top HUD - Mobile Optimized Grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-start justify-between gap-1.5 sm:gap-4">
          {/* Energy Bar - Spans 2 columns on mobile */}
          <div className={`col-span-2 bg-black/85 backdrop-blur-sm border rounded-lg p-2 sm:p-4 transition-all ${
            showEnergyPulse ? 'scale-[1.02] border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'border-purple-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${showEnergyPulse ? 'text-yellow-300 animate-pulse' : 'text-yellow-400'}`} />
              <span className="text-white font-bold text-xs sm:text-base">Energy</span>
              <span className="text-purple-400 ml-auto text-xs sm:text-base font-bold">{energy}/100</span>
            </div>
            <div className="w-full h-1.5 sm:h-3 bg-gray-900/80 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  portalUnlocked
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse shadow-lg shadow-cyan-500/50'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                } ${energyWidthClass}`}
              />
            </div>
          </div>

          {/* Relics & Score Row on Mobile */}
          <div className={`bg-black/85 backdrop-blur-sm border rounded-lg p-2 sm:p-4 transition-all ${
            showCloverPulse ? 'scale-[1.02] border-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.3)]' : 'border-purple-500/20'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`text-xl sm:text-3xl transition-transform ${showCloverPulse ? 'scale-125' : ''}`}>🍀</span>
              <div className="min-w-0">
                <div className="text-white font-bold text-[10px] sm:text-base uppercase tracking-tighter sm:tracking-normal">Relics</div>
                <div className="text-purple-400 text-[10px] sm:text-sm font-bold truncate">{cloversCollected}</div>
              </div>
            </div>
          </div>

          <div className="bg-black/85 backdrop-blur-sm border border-purple-500/20 rounded-lg p-2 sm:p-4">
            <div className="text-center flex flex-col justify-center h-full">
              <div className="text-white font-bold text-xs sm:text-xl truncate">{score.toLocaleString()}</div>
              <div className="text-purple-400 text-[8px] sm:text-sm uppercase tracking-widest font-medium">Score</div>
            </div>
          </div>

          {hasUtilityRewards && (
            <div className="col-span-2 sm:col-span-1 bg-black/85 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-2 sm:p-4 sm:min-w-[280px]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-white font-bold text-[10px] sm:text-base">Rewards</div>
                  <div className="text-emerald-300 text-[10px] sm:text-sm font-mono">
                    {utilityPoints.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-[10px] sm:text-base">
                    {projectedTokenUnits.toLocaleString()} {tokenSymbol}
                  </div>
                  <div className="text-emerald-300 text-[8px] sm:text-xs opacity-80">Projected</div>
                </div>
              </div>
              <div className="mt-1.5 h-1 sm:h-2 rounded-full bg-emerald-950/60 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.4)] ${utilityWidthClass}`}
                />
              </div>
            </div>
          )}

          <div className="col-span-2 sm:col-span-1 bg-black/85 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-2 sm:p-4">
            <div className="flex sm:block items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-cyan-200 text-[8px] sm:text-sm uppercase tracking-widest font-medium">Progress</div>
                <div className="text-white font-bold text-xs sm:text-lg">{formatElapsed(elapsedSeconds)}</div>
              </div>
              <div className="flex-1 max-w-[120px] sm:max-w-none">
                {typeof objectiveProgress === "number" && (
                  <>
                    <div className="h-1.5 sm:h-2 mt-1 overflow-hidden rounded-full bg-cyan-950/60">
                      <div
                        className={`h-full bg-gradient-to-r from-cyan-400 to-blue-300 transition-all duration-300 ${objectiveWidthClass}`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Progress Indicator */}
        {energy < 100 && (
          <div className="mt-2 sm:mt-4 bg-black/80 backdrop-blur-sm border border-blue-500/30 rounded-lg p-2 sm:p-3 max-w-md">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="text-blue-300 text-xs sm:text-sm">
                <span className="font-bold">Objective:</span> Solve gates, recover relics, and charge energy to unlock the exit gate.
              </div>
            </div>
          </div>
        )}

        {/* Controls Info - Collapsible on Mobile */}
        <div className="mt-2 sm:mt-4 bg-black/70 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 max-w-md max-[680px]:hidden">
          <div className="text-gray-300 text-xs sm:text-sm space-y-1">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-purple-400 font-mono font-bold">W/S + A/D</span>
              <span>Move and Turn</span>
            </div>
            <div className="sm:hidden flex items-center gap-2">
              <span className="text-purple-400 font-bold">📱 Hold Buttons</span>
              <span>for movement</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-purple-400 font-mono font-bold">E / ENTER</span>
              <span>Interact / Use</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-pink-400 text-base">🍀</span>
              <span>Collect relics to power puzzle progression</span>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {!walletConnected && (
          <div className="mt-2 sm:mt-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 sm:p-3 max-w-md max-[680px]:hidden">
            <div className="text-yellow-300 text-xs sm:text-sm">
              <strong>💰 Connect Wallet</strong> to unlock NFT minting and rewards!
            </div>
          </div>
        )}

        {/* Active Power-Ups */}
        {activePowerUps.length > 0 && (
          <div className="mt-2 sm:mt-4 flex flex-wrap gap-2 max-w-md max-[680px]:hidden">
            {activePowerUps.map((powerUp, index) => {
              const powerUpMeta = POWER_UP_META[powerUp.type] ?? {
                label: powerUp.type,
                icon: "✨",
                borderClass: "border-orange-400",
              };

              return (
                <div
                  key={index}
                  className={`bg-black/90 backdrop-blur-sm border rounded-lg p-2 flex items-center gap-2 animate-pulse ${powerUpMeta.borderClass}`}
                >
                  <span className="text-xl">{powerUpMeta.icon}</span>
                  <div className="text-white text-xs">
                    <div className="font-bold">{powerUpMeta.label}</div>
                    <div className="text-gray-400">
                      {(Math.max(powerUp.timeLeft, 0) / 60).toFixed(1)}s
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
