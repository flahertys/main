'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';

interface NFTMintPanelProps {
  walletConnected: boolean;
  onMintNFT?: (skinId: number) => Promise<void>;
}

const NFT_SKINS = [
  {
    id: 1,
    name: "Odin's Raven Cape",
    element: "Air",
    rarity: "Legendary",
    cost: 10,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    name: "Brigid's Knot Cloak",
    element: "Fire",
    rarity: "Legendary",
    cost: 10,
    color: "from-orange-500 to-red-500",
  },
  {
    id: 3,
    name: "Freya's Ice Veil",
    element: "Ice",
    rarity: "Legendary",
    cost: 10,
    color: "from-cyan-300 to-blue-400",
  },
  {
    id: 4,
    name: "Thor's Storm Mantle",
    element: "Lightning",
    rarity: "Epic",
    cost: 10,
    color: "from-yellow-400 to-purple-500",
  },
  {
    id: 5,
    name: "Loki's Shadow Weave",
    element: "Shadow",
    rarity: "Epic",
    cost: 10,
    color: "from-purple-600 to-gray-900",
  },
];

export function NFTMintPanel({ walletConnected, onMintNFT }: NFTMintPanelProps) {
  const [selectedSkin, setSelectedSkin] = useState<number | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintedSkins, setMintedSkins] = useState<Set<number>>(new Set());

  const handleMint = async (skinId: number) => {
    if (!walletConnected || minting) return;

    setMinting(true);
    try {
      await onMintNFT?.(skinId);
      setMintedSkins(prev => new Set(prev).add(skinId));
      setSelectedSkin(null);
    } catch (error) {
      console.error('Minting failed:', error);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-xl overflow-hidden flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          NFT Skins
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Mint legendary skins with SHAMROCK
        </p>
      </div>

      {/* Skin List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {NFT_SKINS.map((skin) => {
          const isMinted = mintedSkins.has(skin.id);
          const isSelected = selectedSkin === skin.id;

          return (
            <div
              key={skin.id}
              className={`relative border-2 rounded-lg p-3 transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/20'
                  : isMinted
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-purple-500/50'
              }`}
              onClick={() => !isMinted && setSelectedSkin(isSelected ? null : skin.id)}
            >
              {/* Rarity Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                skin.rarity === 'Legendary' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {skin.rarity}
              </div>

              {/* Skin Preview */}
              <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${skin.color} mb-3 flex items-center justify-center`}>
                {isMinted ? (
                  <div className="text-white text-4xl">✓</div>
                ) : (
                  <div className="text-white text-4xl">🎭</div>
                )}
              </div>

              {/* Skin Info */}
              <div>
                <h3 className="text-white font-bold text-sm">{skin.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{skin.element}</span>
                  <span className="text-xs text-purple-400 font-bold">
                    {skin.cost} SHAMROCK
                  </span>
                </div>
              </div>

              {isMinted && (
                <div className="mt-2 text-green-400 text-xs font-bold text-center">
                  ✓ MINTED
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mint Button */}
      <div className="p-4 border-t border-purple-500/30 bg-gray-900/50">
        {!walletConnected ? (
          <div className="text-center text-sm text-gray-400">
            Connect wallet to mint NFTs
          </div>
        ) : selectedSkin === null ? (
          <div className="text-center text-sm text-gray-400">
            Select a skin to mint
          </div>
        ) : (
          <button
            onClick={() => selectedSkin && handleMint(selectedSkin)}
            disabled={minting}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {minting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Minting...
              </>
            ) : (
              <>Mint Selected Skin</>
            )}
          </button>
        )}

        <div className="mt-3 text-xs text-gray-500 text-center">
          Minting requires 10 SHAMROCK + gas fees
        </div>
      </div>
    </div>
  );
}
