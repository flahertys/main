import { ServiceGrid } from '@/components/landing/ServiceGrid';
import { Roadmap } from '@/components/landing/Roadmap';
import { NeuralConsole } from '@/components/ui/NeuralConsole';
import { LiveActivity } from '@/components/ui/LiveActivity';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="h-[80vh] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-6 italic uppercase">
          TRADE<span className="text-cyan-500">HAX</span>
        </h1>
        <p className="text-zinc-500 max-w-xl text-lg mb-10 font-medium leading-relaxed">
          The cross-chain intersection of institutional-grade AI and decentralized gaming. One platform. Unlimited chains.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <button className="px-10 py-5 bg-white text-black font-black rounded-full hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-105">
            LAUNCH_APP
          </button>
          <Link href="/game">
            <button className="px-10 py-5 border border-zinc-700 text-white font-black rounded-full hover:bg-zinc-800 transition-all">
              PLAY_RUNNER
            </button>
          </Link>
        </div>
      </section>

      <LiveActivity />

      {/* Service Grid Section */}
      <ServiceGrid />

      <NeuralConsole />

      <Roadmap />
    </main>
  );
}
