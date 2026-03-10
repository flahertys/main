'use client';

import { CheckCircle2, Lock, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface Achievement {
    id: 'discover' | 'analyze' | 'create' | 'connect';
    title: string;
    description: string;
    reward: string;
    icon: React.ReactNode;
    unlocked: boolean;
    progress: number;
    actionLabel: string;
    actionHref: string;
}

interface AchievementPanelProps {
    achievements?: Achievement[];
    onComplete?: (achievementId: string) => void;
}

export function GamifiedOnboarding({ achievements = [], onComplete }: AchievementPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [completed, setCompleted] = useState<Set<string>>(new Set());

    const defaultAchievements: Achievement[] = [
        {
            id: 'discover',
            title: 'Discover',
            description: 'Explore one of the three platforms',
            reward: '+250 XP • Discoverer Badge',
            icon: <Sparkles className="w-5 h-5" />,
            unlocked: false,
            progress: 0,
            actionLabel: 'Pick a platform →',
            actionHref: '/intelligence',
        },
        {
            id: 'analyze',
            title: 'Analyze',
            description: 'Run your first AI scan or analysis',
            reward: '+500 XP • Analyst Badge',
            icon: <Trophy className="w-5 h-5" />,
            unlocked: false,
            progress: 0,
            actionLabel: 'Run a scan →',
            actionHref: '/intelligence',
        },
        {
            id: 'create',
            title: 'Create',
            description: 'Generate your first asset (signal, track, service)',
            reward: '+750 XP • Creator Badge',
            icon: <Sparkles className="w-5 h-5" />,
            unlocked: false,
            progress: 0,
            actionLabel: 'Create something →',
            actionHref: '/music',
        },
        {
            id: 'connect',
            title: 'Connect',
            description: 'Link your wallet for live execution',
            reward: '+1000 XP + $100 credits • Executor Badge',
            icon: <Trophy className="w-5 h-5" />,
            unlocked: false,
            progress: 0,
            actionLabel: 'Connect wallet →',
            actionHref: '/account',
        },
    ];

    const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements;

    useEffect(() => {
        // Load from localStorage
        const stored = localStorage.getItem('achievements');
        if (stored) {
            setCompleted(new Set(JSON.parse(stored)));
        }
        // Show modal on first visit (optional)
        const hasSeenModal = localStorage.getItem('onboarding-modal-viewed');
        if (!hasSeenModal) {
            setIsOpen(true);
            localStorage.setItem('onboarding-modal-viewed', 'true');
        }
    }, []);

    const handleAchievementClick = (id: string) => {
        if (!completed.has(id)) {
            const newCompleted = new Set(completed);
            newCompleted.add(id);
            setCompleted(newCompleted);
            localStorage.setItem('achievements', JSON.stringify([...newCompleted]));
            onComplete?.(id);
        }
    };

    const allCompleted = completed.size === displayAchievements.length;

    if (!isOpen && !allCompleted) return null;

    return (
        <>
            {!isOpen && allCompleted && (
                <div className="fixed bottom-4 right-4 z-30 animate-pulse">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transition"
                    >
                        ✓ All achievements unlocked!
                    </button>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="max-w-2xl w-full bg-zinc-950 rounded-2xl border border-white/10 p-8 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                                <h2 className="text-3xl font-black text-white">Onboarding Path</h2>
                            </div>
                            <p className="text-zinc-400 text-sm">
                                Complete 4 achievements to unlock Discord role + $100 credits
                            </p>
                        </div>

                        {/* Achievements Grid */}
                        <div className="space-y-4 mb-8">
                            {displayAchievements.map((achievement, idx) => {
                                const isCompleted = completed.has(achievement.id);
                                return (
                                    <div
                                        key={achievement.id}
                                        className={`p-4 rounded-xl border transition ${isCompleted
                                                ? 'border-green-500/50 bg-green-500/10'
                                                : 'border-white/10 bg-white/5 hover:border-cyan-500/30'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-4 flex-1">
                                                <div
                                                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isCompleted
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-cyan-500/20 text-cyan-400'
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    ) : achievement.icon ? (
                                                        achievement.icon
                                                    ) : (
                                                        <Lock className="w-6 h-6" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-white">
                                                            {idx + 1}. {achievement.title}
                                                        </h3>
                                                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                                    </div>
                                                    <p className="text-sm text-zinc-400 mb-2">
                                                        {achievement.description}
                                                    </p>
                                                    <p className="text-xs text-yellow-400 font-semibold">
                                                        {achievement.reward}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    handleAchievementClick(achievement.id);
                                                    if (achievement.actionHref) {
                                                        window.location.href = achievement.actionHref;
                                                    }
                                                }}
                                                disabled={isCompleted}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${isCompleted
                                                        ? 'bg-green-500/20 text-green-400 cursor-default'
                                                        : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                                    }`}
                                            >
                                                {isCompleted ? '✓ Done' : 'Go →'}
                                            </button>
                                        </div>

                                        {/* Progress bar */}
                                        {achievement.progress > 0 && achievement.progress < 100 && (
                                            <div className="mt-3 w-full h-2 bg-white/10 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                                                    style={{ width: `${achievement.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Completion Stats */}
                        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center mb-6">
                            <p className="text-sm font-semibold text-cyan-100">
                                {completed.size} / {displayAchievements.length} Achievements
                            </p>
                            {allCompleted && (
                                <p className="text-xs text-green-400 mt-2">
                                    🎉 You've unlocked your Discord role and $100 credits!
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition"
                            >
                                Close
                            </button>
                            {!allCompleted && (
                                <button
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg font-semibold transition"
                                >
                                    Go to Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
