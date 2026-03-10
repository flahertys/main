import { TrackedCtaLink } from '@/components/monetization/TrackedCtaLink';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { ArrowRight, BarChart3, BookOpen, Lightbulb, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trading Assistant Tutorial | TradeHax AI',
    description: 'Learn how to use TradeHax AI trading assistant in 5 minutes. Step-by-step video guide covering signals, backtesting, and live execution.',
};

const tutorialChapters = [
    { time: 0, title: 'Introduction & Dashboard Overview' },
    { time: 45, title: 'Understanding AI Signals' },
    { time: 120, title: 'Running Your First Scan' },
    { time: 180, title: 'Paper Trading (Risk-Free Practice)' },
    { time: 240, title: 'Setting Up Live Mode' },
    { time: 300, title: 'Managing Positions & Risk' },
];

export default function TradingAssistantTutorial() {
    return (
        <main className="min-h-screen bg-black">
            {/* Header */}
            <section className="border-b border-white/10 bg-zinc-900/30 backdrop-blur">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-widest text-cyan-400">
                            📚 Video Tutorial
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-black text-white">
                            Master the Trading Assistant
                        </h1>
                        <p className="text-lg text-zinc-300 max-w-2xl">
                            Learn how to use AI-powered signals, paper trading, and live execution in 5
                            minutes
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-12">
                {/* Video Player */}
                <div>
                    <VideoPlayer
                        src="/videos/trading-assistant-tutorial.mp4"
                        poster="/videos/trading-assistant-poster.jpg"
                        title="TradeHax Trading Assistant - Complete Tutorial"
                        description="A comprehensive guide to using TradeHax AI trading assistant. Learn to scan markets, interpret signals, practice with paper trading, and execute live trades safely."
                        chapters={tutorialChapters}
                    />
                </div>

                {/* Transcript & Resources */}
                <Tabs defaultValue="transcript" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                        <TabsTrigger value="transcript">Transcript</TabsTrigger>
                        <TabsTrigger value="cheatsheet">Cheat Sheet</TabsTrigger>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
                    </TabsList>

                    {/* Transcript Tab */}
                    <TabsContent value="transcript" className="space-y-6 mt-6">
                        <div className="prose prose-invert max-w-none space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-cyan-400" />
                                    Section 1: Dashboard Overview (0:00 - 0:45)
                                </h3>
                                <p className="text-zinc-300 leading-relaxed">
                                    When you first open TradeHax, you&apos;ll see the main trading dashboard. The
                                    left sidebar shows your account summary with current P&L, account balance, and
                                    active positions. The central chart displays real-time price action with OHLC
                                    data. The right panel shows AI signals and recommended trades based on your
                                    selected market pair.
                                </p>
                                <p className="text-zinc-300 leading-relaxed">
                                    At the top, you&apos;ll find the market selector (click to switch between stocks,
                                    crypto, options). Below that is the timeframe toggle (1min, 5min, 15min, 1h, 4h,
                                    1d) which affects signal frequency and signal strength.
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-purple-400" />
                                    Section 2: Understanding AI Signals (0:45 - 2:00)
                                </h3>
                                <p className="text-zinc-300 leading-relaxed">
                                    TradeHax uses a proprietary AI model trained on institutional trading patterns.
                                    Each signal comes with three key metrics:
                                </p>
                                <ul className="space-y-2 text-zinc-300">
                                    <li className="flex gap-3">
                                        <span className="text-cyan-400 font-bold">Confidence:</span>
                                        <span>0-100% probability the trade will hit 2R profit (2x risk)</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-cyan-400 font-bold">Risk/Reward:</span>
                                        <span>The ratio of potential profit to potential loss (e.g., 2:1)</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-cyan-400 font-bold">Holding Period:</span>
                                        <span>Expected duration before exit (5min - 4h typical)</span>
                                    </li>
                                </ul>
                                <p className="text-zinc-300 leading-relaxed mt-4">
                                    A green signal means bullish (BUY), red means bearish (SELL). The size of the
                                    signal indicator shows confidence strength. Larger signals = higher confidence.
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                                    Section 3: Running Your First Scan (2:00 - 3:00)
                                </h3>
                                <p className="text-zinc-300 leading-relaxed">
                                    Click the &quot;SCAN&quot; button (top right) to analyze multiple markets at once. This
                                    takes 10-15 seconds and shows you the top 10 opportunities across your selected
                                    universe (e.g., S&P 500 stocks, top 50 crypto pairs).
                                </p>
                                <p className="text-zinc-300 leading-relaxed">
                                    Each scan result shows the market, entry price, confidence %, and risk/reward
                                    ratio. Click any result to jump to that chart and see the detailed signal.
                                </p>
                                <div className="bg-black/30 border border-cyan-500/30 rounded p-4 mt-4">
                                    <p className="text-xs text-cyan-400 font-semibold mb-2">PRO TIP:</p>
                                    <p className="text-sm text-zinc-300">
                                        Filter by confidence &gt; 75% to see only high-probability setups. This
                                        reduces noise and increases win rate.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    Section 4: Paper Trading (3:00 - 4:00)
                                </h3>
                                <p className="text-zinc-300 leading-relaxed">
                                    Paper trading lets you practice with fake money so you can test the AI signals
                                    without risking real capital. Click the &quot;PAPER MODE&quot; toggle (top left) to
                                    enable it.
                                </p>
                                <p className="text-zinc-300 leading-relaxed">
                                    You get $100,000 in fake capital. When you see a signal, click it and select
                                    your position size (% of account or fixed amount). The AI will automatically
                                    place your stop-loss and take-profit based on the signal&apos;s R:R ratio.
                                </p>
                                <p className="text-zinc-300 leading-relaxed">
                                    Watch your positions in the &quot;Open Trades&quot; panel. You&apos;ll see real-time
                                    P&L as price moves. When the signal hits its target or your stop, the position
                                    closes automatically. Check your &quot;Trade Log&quot; to see historical P&L.
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-emerald-400" />
                                    Section 5: Live Mode Setup (4:00 - 5:00)
                                </h3>
                                <p className="text-zinc-300 leading-relaxed">
                                    Once you&apos;ve practiced and gained confidence, you can enable live trading. Click
                                    the &quot;LIVE MODE&quot; button. This will ask you to connect your wallet (Polygon
                                    network).
                                </p>
                                <ol className="space-y-3 text-zinc-300 list-decimal list-inside">
                                    <li>Click &quot;Connect Wallet&quot; and approve the connection in your wallet app</li>
                                    <li>Set your position size (usually 1-5% of account per trade)</li>
                                    <li>Set your max risk per trade (protects against outlier losses)</li>
                                    <li>Review available margin in your account</li>
                                    <li>Approve the trading permission contract (one-time)</li>
                                </ol>
                                <p className="text-zinc-300 leading-relaxed mt-4">
                                    Once live, every signal trades automatically using the Kelly Criterion algorithm
                                    to size positions optimally. Your stop-loss and take-profit are placed instantly.
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-emerald-500/10 border border-white/10 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-3">Key Takeaways</h3>
                                <ul className="space-y-2 text-zinc-300 text-sm">
                                    <li>✓ Start in PAPER MODE to test signals risk-free</li>
                                    <li>✓ Look for signals with 75%+ confidence</li>
                                    <li>✓ Let the AI manage your stop-loss and take-profit</li>
                                    <li>✓ Monitor your trade log to understand what&apos;s working</li>
                                    <li>✓ Switch to LIVE only after 30+ profitable paper trades</li>
                                    <li>✓ Risk only 1-2% per trade to survive drawdowns</li>
                                </ul>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Cheat Sheet Tab */}
                    <TabsContent value="cheatsheet" className="space-y-6 mt-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            {/* Quick Start */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-cyan-400" />
                                    Quick Start (5 min)
                                </h4>
                                <ol className="space-y-2 text-sm text-zinc-300 list-decimal list-inside">
                                    <li>Open TradeHax dashboard</li>
                                    <li>Select your market (AAPL, BTC, etc.)</li>
                                    <li>Toggle PAPER MODE on</li>
                                    <li>Click SCAN button</li>
                                    <li>Click first high-confidence signal</li>
                                    <li>Set position size (e.g., 2%)</li>
                                    <li>Watch trade execute live</li>
                                </ol>
                            </div>

                            {/* Signal Legend */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                                    Signal Meanings
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-cyan-400 font-semibold">🟢 Green (BUY)</p>
                                        <p className="text-zinc-400">Price expected to go up</p>
                                    </div>
                                    <div>
                                        <p className="text-red-400 font-semibold">🔴 Red (SELL)</p>
                                        <p className="text-zinc-400">Price expected to go down</p>
                                    </div>
                                    <div>
                                        <p className="text-yellow-400 font-semibold">⚠️ 75%+ Confidence</p>
                                        <p className="text-zinc-400">High probability signal</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-semibold">⚡ 2:1 R:R</p>
                                        <p className="text-zinc-400">2x profit potential vs risk</p>
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                    Recommended Settings
                                </h4>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    <li>
                                        <span className="text-purple-400 font-semibold">Min Confidence:</span> 75%
                                    </li>
                                    <li>
                                        <span className="text-purple-400 font-semibold">Min R:R Ratio:</span> 1.5:1
                                    </li>
                                    <li>
                                        <span className="text-purple-400 font-semibold">Position Size:</span> 1-3% of
                                        account
                                    </li>
                                    <li>
                                        <span className="text-purple-400 font-semibold">Max Risk/Trade:</span> 2% of
                                        account
                                    </li>
                                    <li>
                                        <span className="text-purple-400 font-semibold">Preferred Timeframe:</span>{' '}
                                        15min-1h
                                    </li>
                                </ul>
                            </div>

                            {/* Hotkeys */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                                    Keyboard Shortcuts
                                </h4>
                                <ul className="space-y-2 text-sm text-zinc-300 font-mono">
                                    <li>
                                        <span className="text-emerald-400">S</span> - Run SCAN
                                    </li>
                                    <li>
                                        <span className="text-emerald-400">P</span> - Toggle PAPER MODE
                                    </li>
                                    <li>
                                        <span className="text-emerald-400">L</span> - Toggle LIVE MODE
                                    </li>
                                    <li>
                                        <span className="text-emerald-400">T</span> - Open TRADE LOG
                                    </li>
                                    <li>
                                        <span className="text-emerald-400">?</span> - Show help
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </TabsContent>

                    {/* FAQ Tab */}
                    <TabsContent value="faq" className="space-y-6 mt-6">
                        <div className="space-y-4">
                            {[
                                {
                                    q: 'Can I turn off automatic stop-loss?',
                                    a: 'No. Risk management is core to TradeHax. All live trades must have a stop-loss. However, you can adjust the % distance in settings.',
                                },
                                {
                                    q: 'What if a signal fails?',
                                    a: 'The AI signals have a 65-75% win rate depending on your settings. Failed signals hit your stop-loss automatically. This minimizes losses.',
                                },
                                {
                                    q: 'Do I need technical analysis knowledge?',
                                    a: 'No. TradeHax is designed for beginners. The AI handles all analysis. You just follow the signals.',
                                },
                                {
                                    q: 'How often do signals appear?',
                                    a: 'On average, 5-10 signals per symbol per day (15min timeframe). On 1h timeframe, 2-4 signals per day.',
                                },
                                {
                                    q: 'Can I set custom risk per trade?',
                                    a: 'Yes. In settings, set "Max Risk Per Trade" (e.g., 2% of account). The AI will size each position accordingly.',
                                },
                                {
                                    q: 'What if I run out of paper trading capital?',
                                    a: 'You can reset your paper account from the dashboard. You get another $100,000 to practice with.',
                                },
                                {
                                    q: 'Is there a minimum account size for live trading?',
                                    a: 'Recommended minimum is $1,000 to avoid being over-leveraged. You can trade with less, but risk is higher.',
                                },
                                {
                                    q: 'Can I withdraw my live profits?',
                                    a: 'Yes. Any profits from live trading can be withdrawn to your wallet anytime. There is a 24h settlement period.',
                                },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3"
                                >
                                    <h4 className="font-bold text-white text-sm">{item.q}</h4>
                                    <p className="text-sm text-zinc-300 leading-relaxed">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* CTAs */}
                <div className="grid sm:grid-cols-3 gap-4 pt-8 border-t border-white/10">
                    <TrackedCtaLink
                        href="/intelligence"
                        conversionId="start_trading"
                        surface="tutorial:cta"
                        className="p-4 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition text-center font-semibold"
                    >
                        Start Trading Now <ArrowRight className="w-4 h-4 inline ml-2" />
                    </TrackedCtaLink>

                    <TrackedCtaLink
                        href="/ai-hub"
                        conversionId="chat_with_ai"
                        surface="tutorial:cta"
                        className="p-4 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-center font-semibold"
                    >
                        Chat with AI Coach <ArrowRight className="w-4 h-4 inline ml-2" />
                    </TrackedCtaLink>

                    <TrackedCtaLink
                        href="/account"
                        conversionId="view_account"
                        surface="tutorial:cta"
                        className="p-4 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition text-center font-semibold"
                    >
                        Account Settings <ArrowRight className="w-4 h-4 inline ml-2" />
                    </TrackedCtaLink>
                </div>
            </section>
        </main>
    );
}
