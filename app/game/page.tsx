import { HaxRunnerGame } from '@/components/game/HaxRunnerGame';
import { GameContainer } from '@/components/game/GameContainer';
import { HaxHub } from '@/components/game/HaxHub';
import Link from 'next/link';

export default function GamePage() {
  return (
    <main className="min-h-screen bg-black py-20 px-6">
      <div className="container mx-auto">
        <Link href="/" className="text-zinc-500 hover:text-white font-mono mb-8 inline-block transition-colors">
          &lt; RETURN_TO_DASHBOARD
        </Link>
        
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter uppercase">HAX_RUNNER</h1>
          <p className="text-zinc-400 font-mono text-sm">STATUS: ENCRYPTED_BETA // REWARD: CUSTOM_TOKEN_POOL</p>
        </div>

        <div className="w-full max-w-5xl mx-auto aspect-video bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10 flex items-center justify-center">
          <HaxRunnerGame />
        </div>

        <HaxHub />
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <h4 className="text-cyan-500 font-mono text-xs mb-2 uppercase">How to Play</h4>
            <p className="text-zinc-400 text-sm">Navigate the grid with arrow keys. Collect purple data packets. Avoid high-latency zones.</p>
          </div>
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <h4 className="text-cyan-500 font-mono text-xs mb-2 uppercase">Rewards</h4>
            <p className="text-zinc-400 text-sm">Top players earn whitelist spots for the upcoming $HAX token launch and multi-chain airdrops.</p>
          </div>
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <h4 className="text-cyan-500 font-mono text-xs mb-2 uppercase">Multi-Chain</h4>
            <p className="text-zinc-400 text-sm">Integrated across major EVM chains and Solana. Your rewards, your choice of network.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
