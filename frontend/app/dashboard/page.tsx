import Link from "next/link";
import { Navbar } from "@/components/dashboard/Navbar";
import { StatCard } from "@/components/dashboard/StatCard";
import { CounterCard } from "@/components/counter/CounterCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet, Activity, Target, Plus, BarChart3, Link as LinkIcon } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-2">
            Welcome to TradeHax AI Dashboard
          </h1>
          <p className="text-gray-400">
            Monitor your trading performance and manage your strategies
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Trades"
            value="0"
            change="+0% from last month"
            trend="neutral"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard
            title="Portfolio Value"
            value="$0.00"
            change="+0.00%"
            trend="neutral"
            icon={<Wallet className="w-6 h-6" />}
          />
          <StatCard
            title="Active Strategies"
            value="0"
            icon={<Activity className="w-6 h-6" />}
          />
          <StatCard
            title="24h P/L"
            value="+0%"
            change="$0.00"
            trend="neutral"
            icon={<Target className="w-6 h-6" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Demo Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Demo Trading Counter</h2>
              <p className="text-gray-400 text-sm">
                Interact with the Solana blockchain to test trading functionality
              </p>
            </div>
            
            <div className="flex items-center justify-center p-8 bg-gradient-to-b from-gray-900/50 to-gray-950/50 rounded-xl border border-gray-800">
              <CounterCard />
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
            
            <div className="space-y-4">
              <Button
                className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Strategy
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                size="lg"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Analytics
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                size="lg"
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                Connect Exchange
              </Button>
            </div>

            {/* Info Card */}
            <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <h3 className="text-white font-semibold mb-2">Getting Started</h3>
              <p className="text-sm text-gray-400 mb-3">
                Connect your wallet to start trading on the Solana blockchain. Use the demo counter above to test blockchain interactions.
              </p>
              <Link href="/" className="text-sm text-purple-400 hover:text-purple-300">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
