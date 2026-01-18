'use client';

import { Zap, Trophy } from 'lucide-react';

interface GameHUDProps {
  energy: number;
  cloversCollected: number;
  walletConnected: boolean;
}

export function GameHUD({ energy, cloversCollected, walletConnected }: GameHUDProps) {
  const energyPercentage = Math.min((energy / 100) * 100, 100);
  const portalUnlocked = energy >= 100;

  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
      <div className="max-w-7xl mx-auto">
        {/* Top HUD */}
        <div className="flex items-start justify-between gap-4">
          {/* Energy Bar */}
          <div className="bg-black/80 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 min-w-[300px]">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-bold">Energy</span>
              <span className="text-purple-400 ml-auto">{energy}/100</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  portalUnlocked
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                style={{ width: `${energyPercentage}%` }}
              />
            </div>
            {portalUnlocked && (
              <div className="mt-2 text-center">
                <span className="text-cyan-400 text-sm font-bold animate-pulse">
                  🌀 PORTAL UNLOCKED!
                </span>
              </div>
            )}
          </div>

          {/* Clover Counter */}
          <div className="bg-black/80 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍀</span>
              <div>
                <div className="text-white font-bold">Clovers</div>
                <div className="text-purple-400 text-sm">{cloversCollected} collected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Info */}
        <div className="mt-4 bg-black/60 backdrop-blur-sm border border-gray-700 rounded-lg p-3 max-w-md">
          <div className="text-gray-300 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-mono font-bold">WASD</span>
              <span>Move</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-mono font-bold">MOUSE</span>
              <span>Look Around</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-pink-400">🍀</span>
              <span>Collect clovers for +20 energy</span>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {!walletConnected && (
          <div className="mt-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 max-w-md">
            <div className="text-yellow-300 text-sm">
              <strong>💰 Connect Wallet</strong> to unlock NFT minting and rewards!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
