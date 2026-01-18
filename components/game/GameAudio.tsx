'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface GameAudioProps {
  audioUrl: string;
  autoPlay?: boolean;
}

export function GameAudio({ audioUrl, autoPlay = false }: GameAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.3);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    if (autoPlay) {
      audioRef.current.play().catch(err => {
        console.log('Auto-play prevented:', err);
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, autoPlay]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-gray-700 rounded-lg p-2">
      <button
        onClick={togglePlay}
        className="p-2 hover:bg-white/10 rounded transition-colors"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <Volume2 className="w-5 h-5 text-purple-400" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      <input
        type="range"
        min="0"
        max="100"
        value={volume * 100}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        className="w-24 accent-purple-500"
        aria-label="Volume"
      />
      
      <span className="text-xs text-gray-400 min-w-[3ch]">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}
