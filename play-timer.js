/**
 * TradeHax Games - Play Timer & Monetization System
 * Free 15 minutes per day, then requires Clover Coins or L2 token
 */

class PlayTimerSystem {
    constructor(rewards) {
        this.rewards = rewards;
        this.freeMinutesPerDay = 15;
        this.coinCostPerMinute = 5; // 5 clover coins = 1 minute of play
        this.storageKey = 'tradehax_play_timer';
        this.dailyResetHour = 0; // Reset at midnight
        
        this.totalPlayedToday = 0;
        this.sessionStartTime = null;
        this.isPlaying = false;
        this.timerInterval = null;
        
        this.loadPlayData();
        this.checkDailyReset();
    }

    loadPlayData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                // Check if data is from today
                const today = this.getTodayKey();
                if (data.date === today) {
                    this.totalPlayedToday = data.minutesPlayed || 0;
                } else {
                    // New day, reset
                    this.totalPlayedToday = 0;
                    this.savePlayData();
                }
            }
        } catch (e) {
            console.error('Failed to load play data:', e);
        }
    }

    savePlayData() {
        try {
            const data = {
                date: this.getTodayKey(),
                minutesPlayed: this.totalPlayedToday
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save play data:', e);
        }
    }

    getTodayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    checkDailyReset() {
        // Check if we've crossed midnight
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            const data = JSON.parse(stored);
            const today = this.getTodayKey();
            if (data.date !== today) {
                this.totalPlayedToday = 0;
                this.savePlayData();
            }
        }
    }

    getRemainingFreeMinutes() {
        return Math.max(0, this.freeMinutesPerDay - this.totalPlayedToday);
    }

    canPlayForFree() {
        return this.getRemainingFreeMinutes() > 0;
    }

    getAvailableMinutes() {
        const stats = this.rewards.getStats();
        const coinsAvailable = stats.totalCoins || 0;
        const paidMinutes = Math.floor(coinsAvailable / this.coinCostPerMinute);
        return this.getRemainingFreeMinutes() + paidMinutes;
    }

    startSession() {
        if (this.isPlaying) return;

        const available = this.getAvailableMinutes();
        if (available <= 0) {
            this.showPaymentPrompt();
            return false;
        }

        this.isPlaying = true;
        this.sessionStartTime = Date.now();
        
        // Update UI every second
        this.timerInterval = setInterval(() => {
            this.updatePlayTime();
        }, 1000);

        this.updateTimerDisplay();
        return true;
    }

    updatePlayTime() {
        if (!this.isPlaying || !this.sessionStartTime) return;

        const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 60000); // Minutes
        const previousTotal = this.totalPlayedToday;
        this.totalPlayedToday = Math.floor(elapsed);

        // Check if we need to deduct coins
        if (elapsed > this.freeMinutesPerDay) {
            const paidMinutes = elapsed - this.freeMinutesPerDay;
            const previousPaidMinutes = Math.max(0, previousTotal - this.freeMinutesPerDay);
            
            if (paidMinutes > previousPaidMinutes) {
                // Deduct coins for the new minute
                const coinCost = this.coinCostPerMinute;
                const stats = this.rewards.getStats();
                
                if (stats.totalCoins >= coinCost) {
                    // Deduct coins (simulate spending)
                    this.rewards.totalCoins = Math.max(0, this.rewards.totalCoins - coinCost);
                    this.rewards.saveState();
                    this.updateTimerDisplay();
                } else {
                    // Out of coins, stop playing
                    this.stopSession();
                    this.showPaymentPrompt();
                    return;
                }
            }
        }

        this.updateTimerDisplay();
    }

    stopSession() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        
        if (this.sessionStartTime) {
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 60000);
            this.totalPlayedToday += elapsed;
            this.savePlayData();
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.sessionStartTime = null;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const freeRemaining = this.getRemainingFreeMinutes();
        const stats = this.rewards.getStats();
        const coinsAvailable = stats.totalCoins || 0;
        const paidMinutesAvailable = Math.floor(coinsAvailable / this.coinCostPerMinute);

        const timerEl = document.getElementById('play-timer-display');
        if (!timerEl) return;

        if (freeRemaining > 0) {
            timerEl.innerHTML = `
                <div class="text-green-400 font-bold">
                    🎮 Free Play: ${freeRemaining} min remaining today
                </div>
            `;
        } else if (paidMinutesAvailable > 0) {
            timerEl.innerHTML = `
                <div class="text-yellow-400 font-bold">
                    ☘️ Playing with Clover Coins: ${paidMinutesAvailable} min available
                </div>
                <div class="text-xs text-gray-400">
                    (${this.coinCostPerMinute} coins per minute)
                </div>
            `;
        } else {
            timerEl.innerHTML = `
                <div class="text-red-400 font-bold">
                    ⏰ Free time expired! Get Clover Coins to continue.
                </div>
            `;
        }
    }

    showPaymentPrompt() {
        const modal = document.createElement('div');
        modal.id = 'play-timer-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-900 border-2 border-green-500 rounded-lg p-8 max-w-lg mx-4 text-center">
                <div class="text-6xl mb-4">⏰</div>
                <h2 class="text-2xl font-bold text-white mb-4">Time's Up!</h2>
                <p class="text-gray-300 mb-2">You've used your <span class="text-green-400 font-bold">15 free minutes</span> today.</p>
                <p class="text-gray-400 mb-6 text-sm">Resets at midnight</p>
                
                <div class="bg-black bg-opacity-40 rounded-lg p-4 mb-6">
                    <div class="text-lg font-semibold text-white mb-2">Continue Playing?</div>
                    <div class="text-yellow-300 text-xl font-bold">☘️ ${this.coinCostPerMinute} Clover Coins = 1 minute</div>
                    <div class="text-xs text-gray-400 mt-1">or use our upcoming L2 Solana token</div>
                </div>

                <div class="space-y-3">
                    <button id="topup-coins-btn" class="w-full px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all">
                        💰 Top Up Clover Coins
                    </button>
                    <button id="play-games-btn" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-all">
                        🎮 Play Games to Earn Coins
                    </button>
                    <button id="close-timer-modal" class="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all">
                        Maybe Later
                    </button>
                </div>

                <p class="text-xs text-gray-500 mt-4">
                    💡 Tip: Play Snake, Tetris, Memory, or Spades to earn free coins!
                </p>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        document.getElementById('close-timer-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('topup-coins-btn').addEventListener('click', () => {
            modal.remove();
            this.showTopUpPage();
        });

        document.getElementById('play-games-btn').addEventListener('click', () => {
            modal.remove();
            window.location.href = '/games/';
        });
    }

    showTopUpPage() {
        // For now, redirect to convert page (will be replaced with payment integration)
        window.location.href = '/games/topup.html';
    }

    createTimerUI() {
        // Create a persistent timer display at the top of the game
        const container = document.createElement('div');
        container.id = 'play-timer-display';
        container.className = 'fixed top-0 left-0 right-0 bg-black bg-opacity-80 text-center py-2 z-40';
        container.style.backdropFilter = 'blur(10px)';
        
        document.body.appendChild(container);
        this.updateTimerDisplay();
    }
}

// Global instance
let playTimer = null;

function initPlayTimer(rewardsSystem) {
    if (!rewardsSystem) {
        console.error('Play timer requires rewards system');
        return null;
    }
    
    playTimer = new PlayTimerSystem(rewardsSystem);
    playTimer.createTimerUI();
    return playTimer;
}
