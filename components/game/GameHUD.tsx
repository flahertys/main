'use client';

import { Zap, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GameHUDProps {
  energy: number;
  cloversCollected: number;
  score: number;
  combo: number;
  walletConnected: boolean;
  activePowerUps?: Array<{ type: string; timeLeft: number }>;
}

const POWER_UP_META: Record<
  string,
  { label: string; icon: string; borderColor: string }
> = {
  odins_shield: { label: "Odin Shield", icon: "🛡️", borderColor: "#00ddff" },
  thors_magnet: { label: "Thor Magnet", icon: "🧲", borderColor: "#ff00ff" },
  freyas_double: { label: "Freyja Double", icon: "✨", borderColor: "#ff8800" },
  speed: { label: "Speed", icon: "⚡", borderColor: "#00ffff" },
  magnet: { label: "Magnet", icon: "🧲", borderColor: "#ffff00" },
  double: { label: "Double", icon: "✨", borderColor: "#ff8800" },
};

export function GameHUD({ energy, cloversCollected, score, combo, walletConnected, activePowerUps = [] }: GameHUDProps) {
  const energyPercentage = Math.min((energy / 100) * 100, 100);
  const portalUnlocked = energy >= 100;
  const cloversNeeded = Math.ceil((100 - energy) / 5);
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

  return (
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 pointer-events-none z-10">
      <div className="max-w-7xl mx-auto">
        {/* Top HUD - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-2 sm:gap-4">
          {/* Energy Bar */}
          <div className={`bg-black/90 backdrop-blur-sm border rounded-lg p-3 sm:p-4 w-full sm:min-w-[300px] transition-all ${
            showEnergyPulse ? 'scale-105 border-yellow-400' : 'border-purple-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${showEnergyPulse ? 'text-yellow-300 animate-pulse' : 'text-yellow-400'}`} />
              <span className="text-white font-bold text-sm sm:text-base">Energy</span>
              <span className="text-purple-400 ml-auto text-sm sm:text-base font-bold">{energy}/100</span>
            </div>
            <div className="w-full h-3 sm:h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-300 ${
                  portalUnlocked
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse shadow-lg shadow-cyan-500/50'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                style={{ width: `${energyPercentage}%` }}
              />
            </div>
            {portalUnlocked && (
              <div className="mt-2 text-center">
                <span className="text-cyan-400 text-xs sm:text-sm font-bold animate-pulse">
                  🌀 PORTAL UNLOCKED!
                </span>
              </div>
            )}
          </div>

          {/* Clover Counter */}
          <div className={`bg-black/90 backdrop-blur-sm border rounded-lg p-3 sm:p-4 transition-all ${
            showCloverPulse ? 'scale-105 border-pink-400' : 'border-purple-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-2xl sm:text-3xl transition-transform ${showCloverPulse ? 'scale-125' : ''}`}>🍀</span>
              <div>
                <div className="text-white font-bold text-sm sm:text-base">Clovers</div>
                <div className="text-purple-400 text-xs sm:text-sm">{cloversCollected} collected</div>
              </div>
            </div>
          </div>

          {/* Score & Combo */}
          <div className="bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 sm:p-4">
            <div className="text-center">
              <div className="text-white font-bold text-lg sm:text-xl">{score.toLocaleString()}</div>
              <div className="text-purple-400 text-xs sm:text-sm">Score</div>
              {combo > 1 && (
                <div className="mt-1 text-yellow-400 text-xs sm:text-sm font-bold animate-pulse">
                  {combo}x Combo!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {energy < 100 && (
          <div className="mt-2 sm:mt-4 bg-black/80 backdrop-blur-sm border border-blue-500/30 rounded-lg p-2 sm:p-3 max-w-md">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="text-blue-300 text-xs sm:text-sm">
                <span className="font-bold">Objective:</span> Collect {cloversNeeded} more clover{cloversNeeded !== 1 ? 's' : ''} to unlock the portal!
              </div>
            </div>
          </div>
        )}

        {/* Controls Info - Collapsible on Mobile */}
        <div className="mt-2 sm:mt-4 bg-black/70 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 max-w-md">
          <div className="text-gray-300 text-xs sm:text-sm space-y-1">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-purple-400 font-mono font-bold">WASD / ARROWS</span>
              <span>Lane Switch</span>
            </div>
            <div className="sm:hidden flex items-center gap-2">
              <span className="text-purple-400 font-bold">👆 Swipe</span>
              <span>to Move</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-purple-400 font-mono font-bold">W/SPACE + S</span>
              <span>Jump / Slide</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-pink-400 text-base">🍀</span>
              <span>+5 energy each</span>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {!walletConnected && (
          <div className="mt-2 sm:mt-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 sm:p-3 max-w-md">
            <div className="text-yellow-300 text-xs sm:text-sm">
              <strong>💰 Connect Wallet</strong> to unlock NFT minting and rewards!
            </div>
          </div>
        )}

        {/* Active Power-Ups */}
        {activePowerUps.length > 0 && (
          <div className="mt-2 sm:mt-4 flex flex-wrap gap-2 max-w-md">
            {activePowerUps.map((powerUp, index) => {
              const powerUpMeta = POWER_UP_META[powerUp.type] ?? {
                label: powerUp.type,
                icon: "✨",
                borderColor: "#ff8800",
              };

              return (
                <div
                  key={index}
                  className="bg-black/90 backdrop-blur-sm border rounded-lg p-2 flex items-center gap-2 animate-pulse"
                  style={{ borderColor: powerUpMeta.borderColor }}
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
