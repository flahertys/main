/**
 * Play Timer Integration for RetroArcade
 * Hooks EmulatorJS game lifecycle events to start/stop play timer
 * Enforces 15-minute daily free tier and coin deduction
 */

class PlayTimerIntegration {
  constructor(web3Rewards) {
    this.web3Rewards = web3Rewards;
    this.playTimer = null;
    this.gameActive = false;
    this.sessionStartTime = null;
    this.coinsPerMinute = 5;
    
    console.log('🎮 PlayTimerIntegration initialized');
  }

  /**
   * Initialize play timer when game loads
   */
  initPlayTimer() {
    if (typeof initPlayTimer === 'undefined') {
      console.error('⚠️ play-timer.js not loaded!');
      return false;
    }

    this.playTimer = initPlayTimer(this.web3Rewards);
    console.log('✅ Play timer initialized');
    return true;
  }

  /**
   * Start session when user loads a ROM
   * Called from loadROM() in retro.html
   */
  startGameSession(gameName, system) {
    if (!this.playTimer) {
      if (!this.initPlayTimer()) return false;
    }

    console.log(`🎮 Starting game session: ${gameName} (${system})`);

    // Check if user has free time remaining
    const remainingMinutes = this.playTimer.getRemainingFreeMinutes();
    if (remainingMinutes <= 0) {
      console.warn('⏰ No free play time remaining');
      this.playTimer.showPaymentPrompt();
      return false;
    }

    // Award starting coins
    if (this.web3Rewards && this.web3Rewards.addCoins) {
      const startingReward = 5;
      this.web3Rewards.addCoins(startingReward);
      console.log(`🪙 +${startingReward} coins for starting game`);
    }

    // Start play session
    this.gameActive = true;
    this.sessionStartTime = Date.now();
    this.playTimer.startSession();

    // Setup play time rewards every 5 minutes
    this.setupPlayRewards(gameName);

    console.log(`✅ Game session started - ${remainingMinutes} min free play remaining`);
    return true;
  }

  /**
   * Award coins for continuous play (every 5 minutes)
   */
  setupPlayRewards(gameName) {
    if (this.rewardInterval) {
      clearInterval(this.rewardInterval);
    }

    const REWARD_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const REWARD_COINS = 10;

    this.rewardInterval = setInterval(() => {
      if (!this.gameActive) return;

      console.log(`⏱️ 5-minute milestone reached in ${gameName}`);

      // Check if still have free time
      const remaining = this.playTimer.getRemainingFreeMinutes();
      if (remaining <= 0) {
        this.playTimer.showPaymentPrompt();
        this.endGameSession();
        return;
      }

      // Award coins for 5-minute achievement
      if (this.web3Rewards && this.web3Rewards.addCoins) {
        this.web3Rewards.addCoins(REWARD_COINS);
        console.log(`🪙 +${REWARD_COINS} coins for 5-minute playtime`);
      }
    }, REWARD_INTERVAL);
  }

  /**
   * End game session and persist playtime
   * Called from stopGame() or beforeunload handler
   */
  endGameSession() {
    if (!this.gameActive) return;

    console.log('🎮 Ending game session');

    this.gameActive = false;

    // Clear reward interval
    if (this.rewardInterval) {
      clearInterval(this.rewardInterval);
      this.rewardInterval = null;
    }

    // Calculate session duration
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const sessionMinutes = Math.floor(sessionDuration / 60);

    console.log(`⏱️ Session duration: ${sessionMinutes} minutes`);

    // Stop play timer (persists to localStorage)
    if (this.playTimer) {
      this.playTimer.stopSession();
    }

    // Update user stats
    this.logGameSession(sessionMinutes);
  }

  /**
   * Log game session for analytics
   */
  logGameSession(minutes) {
    const sessionLog = {
      timestamp: new Date().toISOString(),
      duration_minutes: minutes,
      coins_earned: 0, // Already tracked in web3Rewards
      date: new Date().toLocaleDateString()
    };

    // Store in localStorage for analytics
    const logKey = 'game_sessions_' + new Date().toISOString().split('T')[0];
    let sessions = JSON.parse(localStorage.getItem(logKey) || '[]');
    sessions.push(sessionLog);
    localStorage.setItem(logKey, JSON.stringify(sessions));

    console.log(`📊 Session logged: ${minutes} min play time`);
  }

  /**
   * Display timer status in game header
   */
  updateTimerDisplay() {
    if (!this.playTimer) return;

    const remaining = this.playTimer.getRemainingFreeMinutes();
    const timerEl = document.getElementById('play-timer-display');

    if (timerEl) {
      if (remaining > 0) {
        timerEl.innerHTML = `⏰ ${remaining} min free play remaining`;
        timerEl.style.color = remaining > 5 ? '#34d399' : '#f59e0b';
      } else {
        timerEl.innerHTML = '⏰ Free play expired - Purchase coins to continue';
        timerEl.style.color = '#ff4757';
      }
    }
  }

  /**
   * Setup global beforeunload handler
   * Ensures playtime is saved when user leaves
   */
  setupGlobalHandlers() {
    window.addEventListener('beforeunload', (e) => {
      if (this.gameActive) {
        this.endGameSession();
        // Don't prevent default - let page unload normally
      }
    });

    // Also handle visibility change (tab switched)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.gameActive) {
        console.log('📱 Game paused (tab switched)');
        // Could pause here, but for now just let it run
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create integration instance (requires web3Rewards to be initialized first)
  if (typeof Web3RewardsSystem !== 'undefined') {
    window.playTimerIntegration = new PlayTimerIntegration(window.web3Rewards);
    window.playTimerIntegration.setupGlobalHandlers();
    console.log('✅ PlayTimerIntegration ready');
  }
});
