import React from 'react';

interface GameContainerProps {
  gameUrl?: string;
  title: string;
}

export const GameContainer: React.FC<GameContainerProps> = ({ gameUrl, title }) => {
  return (
    <div className="w-full max-w-5xl mx-auto aspect-video bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10">
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-800/50 border-b border-zinc-700">
        <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest">{title}</h3>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
      </div>
      <div className="relative w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black">
        {gameUrl ? (
          <iframe 
            src={gameUrl} 
            className="w-full h-full border-none"
            title={title}
          />
        ) : (
          <div className="text-center">
            <p className="text-zinc-500 font-mono mb-4">INITIALIZING SYSTEM_BOOT...</p>
            <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-cyan-500 animate-loading" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
