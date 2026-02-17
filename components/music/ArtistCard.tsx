'use client';

import { Heart, Share2, Play } from 'lucide-react';
import { useState } from 'react';

interface ArtistCardProps {
  name: string;
  instrument: string;
  bio: string;
  followers?: number;
}

/**
 * Artist profile card with tip jar and social features
 * Integrates with Solana for tipping functionality
 */
export function ArtistCard({
  name,
  instrument,
  bio,
  followers = 0,
}: ArtistCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleTip = () => {
    // This would integrate with Solana wallet in production
    alert('Solana tip jar integration coming soon!');
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#FF6B35]/50 transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {name.charAt(0)}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
          <p className="text-gray-400 text-sm mb-2">{instrument}</p>
          <p className="text-gray-500 text-xs">{followers} followers</p>
        </div>
        
        <button 
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label={`Share ${name}'s profile`}
        >
          <Share2 className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      <p className="text-gray-300 text-sm mb-4 line-clamp-3">{bio}</p>
      
      <div className="flex gap-2">
        <button
          onClick={handleFollow}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            isFollowing
              ? 'bg-gray-800 text-gray-300'
              : 'bg-gradient-to-r from-[#00D100] to-[#00FF41] text-white'
          }`}
        >
          {isFollowing ? (
            <span className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 fill-current" />
              Following
            </span>
          ) : (
            'Follow'
          )}
        </button>
        
        <button
          onClick={handleTip}
          className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-all font-semibold"
        >
          Tip SOL
        </button>
        
        <button 
          className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
          aria-label={`Play ${name}'s music`}
        >
          <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
