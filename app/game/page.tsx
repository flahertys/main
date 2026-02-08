'use client';

import { useState } from 'react';
import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { PremiumUpgrade } from '@/components/monetization/PremiumUpgrade';
import { HyperboreaGame } from '@/components/game/HyperboreaGame';
import { GameHUD } from '@/components/game/GameHUD';
import { NFTMintPanel } from '@/components/game/NFTMintPanel';
import { GameAudio } from '@/components/game/GameAudio';
import { Gamepad2, Trophy, Star, Zap, Play, RotateCcw, X, Pause, HelpCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function GamePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [cloversCollected, setCloversCollected] = useState(0);
  const [walletConnected] = useState(false);
  const [hasPlayedBefore, setHasPlayedBefore] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hyperborea_played') === 'true';
    }
    return false;
  });

  const handlePlayClick = () => {
    trackEvent.gameStart();
    setIsPlaying(true);
    setIsPaused(false);
    
    // Show tutorial for first-time players
    if (!hasPlayedBefore) {
      setShowTutorial(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hyperborea_played', 'true');
      }
      setHasPlayedBefore(true);
    }
  };

  const handleRestart = () => {
    setEnergy(0);
    setCloversCollected(0);
    setIsPaused(false);
    // Game will restart automatically due to state reset
  };

  const handleExit = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setShowTutorial(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleMintNFT = async (skinId: number) => {
    // NFT minting logic will be implemented when backend is ready
    console.log('Minting NFT skin:', skinId);
    // This would call the backend API for NFT minting
  };

  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-black">
        {/* Game Canvas */}
        <HyperboreaGame
          onEnergyChange={setEnergy}
          onCloverCollect={setCloversCollected}
        />
        
        {/* Game HUD Overlay */}
        <GameHUD
          energy={energy}
          cloversCollected={cloversCollected}
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
                  <h3 className="text-xl font-bold text-purple-400 mb-3">🎯 Objective</h3>
                  <p className="text-sm sm:text-base">
                    Collect magical clovers (🍀) to gain energy. Reach 100 energy to unlock the mysterious wormhole portal!
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">🎮 Controls</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">W A S D</span>
                      <span className="sm:hidden font-mono bg-gray-800 px-2 py-1 rounded text-purple-400 text-xs font-bold">WASD</span>
                      <span>or</span>
                      <span className="hidden sm:inline font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">ARROWS</span>
                      <span className="sm:hidden font-mono bg-gray-800 px-2 py-1 rounded text-purple-400 text-xs font-bold">↑↓←→</span>
                      <span>Move your character</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">MOUSE</span>
                      <span className="sm:hidden font-mono bg-gray-800 px-2 py-1 rounded text-purple-400 text-xs font-bold">MOUSE</span>
                      <span>Move mouse to look around</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold text-sm sm:text-base">👆 TOUCH</span>
                      <span>Tap & drag to move (mobile)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-pink-400 mb-3">✨ Tips</h3>
                  <ul className="space-y-2 text-sm sm:text-base list-disc list-inside">
                    <li>Each clover gives you +20 energy</li>
                    <li>Clovers respawn after 1 second in a new location</li>
                    <li>The portal unlocks at 100 energy</li>
                    <li>Connect your wallet to mint NFT skins with rewards</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all text-base sm:text-lg"
                >
                  Got it! Let's Play
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
                <h3 className="text-white font-bold mb-3 text-center">Current Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-purple-500/20 rounded-lg p-3">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-white font-bold">{energy}</div>
                    <div className="text-xs text-gray-400">Energy</div>
                  </div>
                  <div className="bg-pink-500/20 rounded-lg p-3">
                    <div className="text-2xl mb-1">🍀</div>
                    <div className="text-white font-bold">{cloversCollected}</div>
                    <div className="text-xs text-gray-400">Clovers</div>
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
            Experience the ultimate browser-based adventure game with blockchain integration.
            Play, compete, and earn exclusive NFT rewards!
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
                  <h3 className="text-xl font-bold text-purple-400 mb-3">🎯 Objective</h3>
                  <p className="text-sm sm:text-base">
                    Navigate the Escher-inspired impossible maze and collect magical clovers (🍀) to gain energy. 
                    Reach 100 energy to unlock the mysterious wormhole portal!
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">🎮 Controls</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">W A S D</span>
                      <span className="sm:hidden font-mono bg-gray-800 px-2 py-1 rounded text-purple-400 text-xs font-bold">WASD</span>
                      <span>or</span>
                      <span className="hidden sm:inline font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">ARROWS</span>
                      <span className="sm:hidden font-mono bg-gray-800 px-2 py-1 rounded text-purple-400 text-xs font-bold">↑↓←→</span>
                      <span>Move your character</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold">MOUSE</span>
                      <span className="sm:hidden font-mono bg-gray-800 px-2 py-1 rounded text-purple-400 text-xs font-bold">MOUSE</span>
                      <span>Move mouse to look around</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-gray-800 px-3 py-1 rounded text-purple-400 font-bold text-sm sm:text-base">👆 TOUCH</span>
                      <span>Tap & drag to move (mobile)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-pink-400 mb-3">✨ Tips</h3>
                  <ul className="space-y-2 text-sm sm:text-base list-disc list-inside">
                    <li>Each clover gives you +20 energy</li>
                    <li>Clovers respawn after 1 second in a new location</li>
                    <li>The portal unlocks at 100 energy</li>
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
              Navigate the Escher-inspired impossible maze, collect magical clovers, 
              and unlock the wormhole portal. Mint legendary NFT skins with your earned rewards!
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
          <h2 className="text-2xl font-bold text-white mb-6">About Hyperborea</h2>
          <div className="grid md:grid-cols-2 gap-8 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Free Tier</h3>
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
              <h3 className="text-lg font-semibold text-white mb-3">Premium ($4.99)</h3>
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

function FeatureCard({ icon, title, description }: {
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
