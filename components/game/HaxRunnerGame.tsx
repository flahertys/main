"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 12;
const INITIAL_SPEED = 200;
const MIN_SPEED = 70;

type PowerUpType = 'SHIELD' | 'OVERCLOCK' | 'MAGNET';
type Entity = { x: number, y: number, type?: PowerUpType };

export const HaxRunnerGame = () => {
  const [position, setPosition] = useState({ x: 6, y: 6 });
  const [packets, setPackets] = useState<Entity[]>([]);
  const [threats, setThreats] = useState<Entity[]>([]);
  const [powerUp, setPowerUp] = useState<Entity | null>(null);
  const [activeEffect, setActiveEffect] = useState<PowerUpType | null>(null);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(["INITIALIZING_KERNEL..."]);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const spawnEntity = useCallback(() => ({
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE)
  }), []);

  const startGame = () => {
    setScore(0);
    setMultiplier(1);
    setSpeed(INITIAL_SPEED);
    setPosition({ x: 6, y: 6 });
    setPackets([spawnEntity(), spawnEntity()]);
    setThreats([spawnEntity()]);
    setPowerUp(null);
    setActiveEffect(null);
    setGameState('PLAYING');
    addLog("BREACH_STARTED: NODE_0x42");
  };

  const movePlayer = useCallback((dx: number, dy: number) => {
    setPosition(prev => ({
      x: Math.min(Math.max(0, prev.x + dx), GRID_SIZE - 1),
      y: Math.min(Math.max(0, prev.y + dy), GRID_SIZE - 1)
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowUp') movePlayer(0, -1);
      if (e.key === 'ArrowDown') movePlayer(0, 1);
      if (e.key === 'ArrowLeft') movePlayer(-1, 0);
      if (e.key === 'ArrowRight') movePlayer(1, 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  // Game Loop
  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = setInterval(() => {
        setThreats(prev => {
          const moved = prev.map(t => ({
            ...t,
            x: (t.x + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0) + GRID_SIZE) % GRID_SIZE,
            y: (t.y + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0) + GRID_SIZE) % GRID_SIZE,
          }));
          return moved.length < 4 ? [...moved, spawnEntity()] : moved;
        });

        // Rare Power-up Spawn
        if (Math.random() > 0.98 && !powerUp) {
          const types: PowerUpType[] = ['SHIELD', 'OVERCLOCK', 'MAGNET'];
          setPowerUp({ ...spawnEntity(), type: types[Math.floor(Math.random() * types.length)] });
          addLog("RARE_PACKET_DETECTED");
        }
        
        setSpeed(prev => Math.max(MIN_SPEED, prev - 0.3));
      }, speed);
    } else {
      clearInterval(gameLoopRef.current);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, speed, spawnEntity, powerUp]);

  // Collision Logic
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Packet Collection
    const caughtIndex = packets.findIndex(p => p.x === position.x && p.y === position.y);
    if (caughtIndex !== -1) {
      const bonus = activeEffect === 'OVERCLOCK' ? 200 : 100;
      setScore(s => s + (bonus * multiplier));
      setMultiplier(m => Math.min(m + 0.1, 10));
      const newPackets = [...packets];
      newPackets[caughtIndex] = spawnEntity();
      setPackets(newPackets);
      if (Math.random() > 0.8) addLog("DATA_DECRYPTED...");
    }

    // Power-up Collection
    if (powerUp && powerUp.x === position.x && powerUp.y === position.y) {
      setActiveEffect(powerUp.type!);
      addLog(`BUFF_ENABLED: ${powerUp.type}`);
      setPowerUp(null);
      setTimeout(() => {
        setActiveEffect(null);
        addLog(`BUFF_EXPIRED: ${powerUp.type}`);
      }, 5000);
    }

    // Threat Collision
    const hitThreat = threats.some(t => t.x === position.x && t.y === position.y);
    if (hitThreat && activeEffect !== 'SHIELD') {
      setGameState('GAMEOVER');
      addLog("CRITICAL_FAILURE: IP_EXPOSED");
    }
  }, [position, packets, threats, powerUp, activeEffect, gameState, multiplier, spawnEntity]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full font-mono bg-black p-4 select-none relative overflow-hidden">
      {/* Dynamic Background Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      {gameState === 'IDLE' && (
        <div className="text-center z-10">
          <h2 className="text-cyan-500 mb-8 animate-pulse text-xs tracking-[0.5em]">AUTH_REQUIRED</h2>
          <button 
            onClick={startGame}
            className="group relative px-12 py-6 bg-transparent border border-cyan-500 text-cyan-500 font-black text-2xl hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <span className="relative z-10 italic uppercase">Login_to_Mainframe</span>
            <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-4 gap-4 z-10">
          {/* Side Logs */}
          <div className="hidden md:flex flex-col gap-2 bg-zinc-900/50 p-4 border border-white/5 rounded-xl h-[400px]">
            <p className="text-[10px] text-zinc-600 border-b border-white/5 pb-2 mb-2 uppercase tracking-tighter">System_Log</p>
            {terminalLogs.map((log, i) => (
              <p key={i} className="text-[9px] text-cyan-500/70 lowercase leading-tight truncate">
                {`> ${log}`}
              </p>
            ))}
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-between items-end mb-4 px-2">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Decrypted_Value</p>
                <p className="text-3xl font-black text-white italic">{Math.floor(score).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Link_Quality</p>
                <p className={`text-xl font-black italic ${activeEffect ? 'text-yellow-500 animate-pulse' : 'text-cyan-500'}`}>
                  x{multiplier.toFixed(1)} {activeEffect && `[${activeEffect}]`}
                </p>
              </div>
            </div>
            
            <div className={`relative border p-1 bg-zinc-900/20 backdrop-blur-md transition-colors duration-500 ${activeEffect === 'SHIELD' ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'border-white/10'}`}>
              <div 
                className="grid gap-px" 
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, aspectRatio: '1/1' }}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isPlayer = position.x === x && position.y === y;
                  const isPacket = packets.some(p => p.x === x && p.y === y);
                  const isThreat = threats.some(t => t.x === x && t.y === y);
                  const isPower = powerUp?.x === x && powerUp?.y === y;

                  return (
                    <div 
                      key={i} 
                      className={`relative w-full h-full border border-white/[0.02] flex items-center justify-center
                        ${isPlayer ? (activeEffect === 'SHIELD' ? 'bg-yellow-500' : 'bg-white shadow-[0_0_20px_white]') : ''}
                      `}
                    >
                      {isPacket && <div className="w-1.5 h-1.5 bg-cyan-400 rotate-45 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
                      {isThreat && <div className="w-full h-full bg-red-500/20 animate-pulse border border-red-500/40" />}
                      {isPower && (
                        <div className="w-3 h-3 bg-yellow-500 animate-bounce flex items-center justify-center text-[8px] text-black font-bold">
                          !
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="text-center z-10">
          <h2 className="text-red-600 text-6xl font-black italic mb-2 tracking-tighter">BREACH_DETECTED</h2>
          <p className="text-zinc-500 font-mono text-xs mb-8 uppercase tracking-widest">Node_Recovery_Score: {Math.floor(score)}</p>
          <button 
            onClick={startGame}
            className="px-10 py-5 border-2 border-red-600/50 text-red-500 font-black hover:bg-red-600 hover:text-white transition-all italic uppercase"
          >
            Reconnect_Mainframe
          </button>
        </div>
      )}
    </div>
  );
};
