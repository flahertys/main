/**
 * Clover Goals System - Achievement & Goal Tracking
 * Tracks player activities and awards clover coins for achievements
 */

class CloverGoalsSystem {
    constructor() {
        this.walletAddress = null;
        this.goals = this.initializeGoals();
        this.stats = this.loadStats();
        
        // Listen for wallet connection
        window.addEventListener('walletConnected', (e) => {
            this.walletAddress = e.detail?.address || 'unknown';
            console.log('🎮 Clover Goals System initialized for wallet:', this.walletAddress);
        });

        // Make globally available
        window.cloverGoals = this;
    }

    /**
     * Initialize all available goals/achievements
     */
    initializeGoals() {
        return {
            'FIRST_GAME': {
                id: 'FIRST_GAME',
                name: '🎮 First Game',
                description: 'Play your first game',
                condition: { type: 'gamesPlayed', value: 1 },
                reward: 10,
                completed: false
            },
            'RETRO_COLLECTOR': {
                id: 'RETRO_COLLECTOR',
                name: '🕹️ Retro Collector',
                description: 'Play games on 5 different systems',
                condition: { type: 'systemsPlayed', value: 5 },
                reward: 50,
                completed: false
            },
            'PLAYTIME_HOUR': {
                id: 'PLAYTIME_HOUR',
                name: '⏱️ First Hour',
                description: 'Play for 1 cumulative hour',
                condition: { type: 'totalPlaytime', value: 60 },
                reward: 25,
                completed: false
            },
            'PLAYTIME_FIVE_HOURS': {
                id: 'PLAYTIME_FIVE_HOURS',
                name: '⏰ Five Hour Marathon',
                description: 'Play for 5 cumulative hours',
                condition: { type: 'totalPlaytime', value: 300 },
                reward: 100,
                completed: false
            },
            'PLAYTIME_TWENTY_HOURS': {
                id: 'PLAYTIME_TWENTY_HOURS',
                name: '🏆 Twenty Hour Veteran',
                description: 'Play for 20 cumulative hours',
                condition: { type: 'totalPlaytime', value: 1200 },
                reward: 500,
                completed: false
            },
            'STREAK_3_DAYS': {
                id: 'STREAK_3_DAYS',
                name: '🔥 3-Day Streak',
                description: 'Play on 3 consecutive days',
                condition: { type: 'playStreak', value: 3 },
                reward: 30,
                completed: false
            },
            'STREAK_7_DAYS': {
                id: 'STREAK_7_DAYS',
                name: '🌟 Week Warrior',
                description: 'Play on 7 consecutive days',
                condition: { type: 'playStreak', value: 7 },
                reward: 100,
                completed: false
            },
            'SAVE_STATE_MASTER': {
                id: 'SAVE_STATE_MASTER',
                name: '💾 Save State Master',
                description: 'Create 50 save states',
                condition: { type: 'saveStates', value: 50 },
                reward: 40,
                completed: false
            },
            'COIN_ACCUMULATOR': {
                id: 'COIN_ACCUMULATOR',
                name: '💰 Coin Accumulator',
                description: 'Earn 100 coins',
                condition: { type: 'totalCoinsEarned', value: 100 },
                reward: 50,
                completed: false
            },
            'COIN_500': {
                id: 'COIN_500',
                name: '💎 Wealthy Gamer',
                description: 'Earn 500 coins',
                condition: { type: 'totalCoinsEarned', value: 500 },
                reward: 250,
                completed: false
            },
            'NES_MASTER': {
                id: 'NES_MASTER',
                name: '👾 NES Master',
                description: 'Play 10 different NES games',
                condition: { type: 'systemGames', value: { system: 'NES', count: 10 } },
                reward: 75,
                completed: false
            },
            'SNES_MASTER': {
                id: 'SNES_MASTER',
                name: '🎮 SNES Legend',
                description: 'Play 10 different SNES games',
                condition: { type: 'systemGames', value: { system: 'SNES', count: 10 } },
                reward: 75,
                completed: false
            }
        };
    }

    /**
     * Load or initialize player stats
     */
    loadStats() {
        const key = `clover_goals_${this.walletAddress || 'default'}_stats`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            totalPlaytime: 0, // in minutes
            gamesPlayed: [],
            systemsPlayed: new Set(),
            saveStatesCreated: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastPlayDate: null,
            totalCoinsEarned: 0,
            goalsCompleted: 0,
            systemGameCounts: {}
        };
    }

    /**
     * Save stats to localStorage
     */
    saveStats() {
        const key = `clover_goals_${this.walletAddress || 'default'}_stats`;
        const toSave = {
            ...this.stats,
            systemsPlayed: Array.from(this.stats.systemsPlayed)
        };
        localStorage.setItem(key, JSON.stringify(toSave));
    }

    /**
     * Record a game session
     */
    recordGamePlayed(gameName, system, durationMinutes = 0) {
        this.stats.gamesPlayed.push({
            name: gameName,
            system: system,
            playedAt: new Date().toISOString(),
            duration: durationMinutes
        });

        this.stats.systemsPlayed.add(system);
        
        // Track system-specific game counts
        if (!this.stats.systemGameCounts[system]) {
            this.stats.systemGameCounts[system] = new Set();
        }
        this.stats.systemGameCounts[system].add(gameName);

        console.log(`📝 Recorded: ${gameName} (${system})`);
        this.checkGoalProgress('FIRST_GAME');
        this.checkGoalProgress('RETRO_COLLECTOR');
        this.saveStats();
    }

    /**
     * Record playtime accumulation
     */
    recordPlaytime(minutes) {
        this.stats.totalPlaytime += minutes;
        
        // Update streak
        this.updatePlayStreak();
        
        // Check playtime goals
        this.checkGoalProgress('PLAYTIME_HOUR');
        this.checkGoalProgress('PLAYTIME_FIVE_HOURS');
        this.checkGoalProgress('PLAYTIME_TWENTY_HOURS');
        
        console.log(`⏱️ Playtime updated: ${this.stats.totalPlaytime} minutes total`);
        this.saveStats();
    }

    /**
     * Record save state creation
     */
    recordSaveState() {
        this.stats.saveStatesCreated++;
        this.checkGoalProgress('SAVE_STATE_MASTER');
        console.log(`💾 Save states created: ${this.stats.saveStatesCreated}`);
        this.saveStats();
    }

    /**
     * Update play streak (consecutive days)
     */
    updatePlayStreak() {
        const today = new Date().toDateString();
        
        if (this.stats.lastPlayDate !== today) {
            const lastDate = this.stats.lastPlayDate ? new Date(this.stats.lastPlayDate) : null;
            const currentDate = new Date();
            
            if (lastDate) {
                const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 1) {
                    // Consecutive day
                    this.stats.currentStreak++;
                } else if (daysDiff > 1) {
                    // Streak broken
                    this.stats.currentStreak = 1;
                }
            } else {
                // First day
                this.stats.currentStreak = 1;
            }
            
            this.stats.lastPlayDate = today;
            
            // Update longest streak
            if (this.stats.currentStreak > this.stats.longestStreak) {
                this.stats.longestStreak = this.stats.currentStreak;
            }
            
            this.checkGoalProgress('STREAK_3_DAYS');
            this.checkGoalProgress('STREAK_7_DAYS');
        }
    }

    /**
     * Award coins and track earnings
     */
    awardCoins(amount, reason = 'Unknown') {
        this.stats.totalCoinsEarned += amount;
        console.log(`🍀 +${amount} coins: ${reason}`);
        
        this.checkGoalProgress('COIN_ACCUMULATOR');
        this.checkGoalProgress('COIN_500');
        this.saveStats();
        
        // Emit event for UI updates
        window.dispatchEvent(new CustomEvent('coinsEarned', { 
            detail: { amount, reason, total: this.stats.totalCoinsEarned }
        }));
    }

    /**
     * Check if a specific goal is completed
     */
    checkGoalProgress(goalId) {
        const goal = this.goals[goalId];
        if (!goal || goal.completed) return;

        let isCompleted = false;

        switch (goal.condition.type) {
            case 'gamesPlayed':
                isCompleted = this.stats.gamesPlayed.length >= goal.condition.value;
                break;
            case 'systemsPlayed':
                isCompleted = this.stats.systemsPlayed.size >= goal.condition.value;
                break;
            case 'totalPlaytime':
                isCompleted = this.stats.totalPlaytime >= goal.condition.value;
                break;
            case 'playStreak':
                isCompleted = this.stats.currentStreak >= goal.condition.value;
                break;
            case 'saveStates':
                isCompleted = this.stats.saveStatesCreated >= goal.condition.value;
                break;
            case 'totalCoinsEarned':
                isCompleted = this.stats.totalCoinsEarned >= goal.condition.value;
                break;
            case 'systemGames':
                const { system, count } = goal.condition.value;
                const gameCount = this.stats.systemGameCounts[system]?.size || 0;
                isCompleted = gameCount >= count;
                break;
        }

        if (isCompleted) {
            goal.completed = true;
            this.stats.goalsCompleted++;
            this.awardCoins(goal.reward, `Goal: ${goal.name}`);
            console.log(`🏆 Goal Completed: ${goal.name} (+${goal.reward} coins)`);
            
            // Emit goal completion event
            window.dispatchEvent(new CustomEvent('goalCompleted', { 
                detail: { goal, coinsAwarded: goal.reward }
            }));
            
            this.saveStats();
        }
    }

    /**
     * Get progress for a specific goal
     */
    getGoalProgress(goalId) {
        const goal = this.goals[goalId];
        if (!goal) return null;

        let current = 0;
        const target = goal.condition.value;

        switch (goal.condition.type) {
            case 'gamesPlayed':
                current = this.stats.gamesPlayed.length;
                break;
            case 'systemsPlayed':
                current = this.stats.systemsPlayed.size;
                break;
            case 'totalPlaytime':
                current = this.stats.totalPlaytime;
                break;
            case 'playStreak':
                current = this.stats.currentStreak;
                break;
            case 'saveStates':
                current = this.stats.saveStatesCreated;
                break;
            case 'totalCoinsEarned':
                current = this.stats.totalCoinsEarned;
                break;
            case 'systemGames':
                const { system, count } = target;
                current = this.stats.systemGameCounts[system]?.size || 0;
                break;
        }

        const percentage = Math.min(100, Math.floor((current / target) * 100));

        return {
            goal,
            current,
            target,
            percentage,
            completed: goal.completed
        };
    }

    /**
     * Get all goals with progress
     */
    getAllGoalsProgress() {
        return Object.keys(this.goals).map(goalId => this.getGoalProgress(goalId));
    }

    /**
     * Get summary statistics
     */
    getStats() {
        return {
            totalPlaytime: this.stats.totalPlaytime,
            playtimeHours: Math.floor(this.stats.totalPlaytime / 60),
            gamesPlayed: this.stats.gamesPlayed.length,
            systemsPlayed: this.stats.systemsPlayed.size,
            saveStatesCreated: this.stats.saveStatesCreated,
            currentStreak: this.stats.currentStreak,
            longestStreak: this.stats.longestStreak,
            totalCoinsEarned: this.stats.totalCoinsEarned,
            goalsCompleted: this.stats.goalsCompleted,
            totalGoals: Object.keys(this.goals).length
        };
    }

    /**
     * Reset all stats (for testing)
     */
    resetStats() {
        if (confirm('⚠️ This will reset all your stats. Are you sure?')) {
            const key = `clover_goals_${this.walletAddress || 'default'}_stats`;
            localStorage.removeItem(key);
            this.stats = this.loadStats();
            this.saveStats();
            console.log('✅ Stats reset');
            return true;
        }
        return false;
    }
}

// Initialize globally if not already done
if (typeof window.cloverGoals === 'undefined') {
    console.log('🍀 Initializing Clover Goals System...');
    const cloverGoals = new CloverGoalsSystem();
}
