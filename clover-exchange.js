/**
 * Clover Coin Exchange System - Convert coins to USD
 * Handles redemption packages and blockchain transactions
 */

class CloverCoinExchange {
    constructor() {
        this.walletAddress = null;
        this.exchangeRate = 0.01; // 100 coins = $1
        this.exchangeHistory = this.loadExchangeHistory();
        
        // Listen for wallet connection
        window.addEventListener('walletConnected', (e) => {
            this.walletAddress = e.detail?.address || 'unknown';
            console.log('💱 Clover Exchange initialized for wallet:', this.walletAddress);
        });

        // Make globally available
        window.cloverExchange = this;
    }

    /**
     * Get all available exchange packages
     */
    getExchangePackages() {
        return [
            {
                id: 'tier1',
                coins: 100,
                usd: 1,
                bonus: 0,
                label: '$1 Package',
                popular: false
            },
            {
                id: 'tier2',
                coins: 500,
                usd: 5,
                bonus: 50,
                label: '$5 Package',
                popular: false
            },
            {
                id: 'tier3',
                coins: 1000,
                usd: 10,
                bonus: 150,
                label: '$10 Package',
                popular: true
            },
            {
                id: 'tier4',
                coins: 5000,
                usd: 50,
                bonus: 500,
                label: '$50 Package',
                popular: false
            },
            {
                id: 'tier5',
                coins: 10000,
                usd: 100,
                bonus: 2000,
                label: '$100 Package',
                popular: false
            },
            {
                id: 'tier6',
                coins: 50000,
                usd: 500,
                bonus: 15000,
                label: '$500 Package',
                popular: false
            }
        ];
    }

    /**
     * Calculate USD value for coin amount
     */
    calculateUSDValue(coins, token = 'USDC') {
        return coins * this.exchangeRate;
    }

    /**
     * Find matching package or calculate custom value
     */
    findPackageForCoins(coins) {
        const packages = this.getExchangePackages();
        return packages.find(p => p.coins === coins) || {
            coins,
            usd: this.calculateUSDValue(coins),
            bonus: 0,
            label: `Custom (${coins} coins)`,
            popular: false
        };
    }

    /**
     * Process a coin exchange transaction
     */
    async processExchange(coinAmount, destinationToken = 'USDC', walletAddress = null) {
        if (!walletAddress) {
            walletAddress = this.walletAddress;
        }

        if (!walletAddress) {
            throw new Error('❌ Wallet not connected. Please connect Phantom wallet first.');
        }

        // Check if clover goals system is available to verify coin balance
        let hasEnoughCoins = true;
        if (typeof window.cloverGoals !== 'undefined') {
            const stats = window.cloverGoals.getStats();
            if (stats.totalCoinsEarned < coinAmount) {
                throw new Error(`❌ Insufficient coins. You have ${stats.totalCoinsEarned}, need ${coinAmount}`);
            }
        }

        const usdValue = this.calculateUSDValue(coinAmount, destinationToken);
        const transactionId = this.generateTransactionId();
        
        const transaction = {
            id: transactionId,
            timestamp: new Date().toISOString(),
            coinAmount,
            usdValue,
            destinationToken,
            walletAddress,
            status: 'pending', // pending -> processing -> completed/failed
            transactionHash: null,
            error: null,
            affiliateCommission: usdValue * 0.05 // 5% referral
        };

        // Add to history
        this.exchangeHistory.push(transaction);
        this.saveExchangeHistory();

        console.log(`💱 Exchange initiated: ${coinAmount} coins → $${usdValue.toFixed(2)} ${destinationToken}`);

        // Simulate blockchain transaction
        await this.simulateBlockchainTransaction(transaction);

        return transaction;
    }

    /**
     * Simulate blockchain transaction (mock)
     */
    async simulateBlockchainTransaction(transaction) {
        return new Promise((resolve) => {
            // Change to processing
            transaction.status = 'processing';
            transaction.transactionHash = this.generateTransactionHash();
            this.saveExchangeHistory();

            console.log(`⏳ Processing: ${transaction.transactionHash}`);

            // Simulate 3 second processing time
            setTimeout(() => {
                transaction.status = 'completed';
                this.saveExchangeHistory();
                
                console.log(`✅ Exchange completed: ${transaction.transactionHash}`);
                console.log(`💰 ${transaction.usdValue.toFixed(2)} ${transaction.destinationToken} sent to ${transaction.walletAddress}`);

                // Emit completion event
                window.dispatchEvent(new CustomEvent('exchangeCompleted', { 
                    detail: transaction
                }));

                resolve(transaction);
            }, 3000);
        });
    }

    /**
     * Get exchange history
     */
    getHistory(limit = 50) {
        return this.exchangeHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Get total USD exchanged
     */
    getTotalExchanged() {
        return this.exchangeHistory
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.usdValue, 0);
    }

    /**
     * Get pending transactions
     */
    getPending() {
        return this.exchangeHistory.filter(t => 
            t.status === 'pending' || t.status === 'processing'
        );
    }

    /**
     * Estimate affiliate rewards
     */
    estimateAffiliateRewards(exchangeAmount) {
        // 5% commission on exchanges
        return exchangeAmount * 0.05;
    }

    /**
     * Load exchange history from localStorage
     */
    loadExchangeHistory() {
        const key = `clover_exchange_${this.walletAddress || 'default'}_history`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Save exchange history to localStorage
     */
    saveExchangeHistory() {
        const key = `clover_exchange_${this.walletAddress || 'default'}_history`;
        localStorage.setItem(key, JSON.stringify(this.exchangeHistory));
    }

    /**
     * Generate unique transaction ID
     */
    generateTransactionId() {
        return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate mock transaction hash
     */
    generateTransactionHash() {
        return '0x' + Math.random().toString(16).substr(2) + 
               Math.random().toString(16).substr(2) + 
               Math.random().toString(16).substr(2);
    }

    /**
     * Get exchange statistics
     */
    getStats() {
        const completed = this.exchangeHistory.filter(t => t.status === 'completed');
        return {
            totalTransactions: this.exchangeHistory.length,
            completedTransactions: completed.length,
            totalUsdExchanged: this.getTotalExchanged(),
            averageExchange: completed.length > 0 
                ? this.getTotalExchanged() / completed.length 
                : 0,
            totalAffiliateEarnings: completed.reduce((sum, t) => sum + t.affiliateCommission, 0)
        };
    }

    /**
     * Reset exchange history (for testing)
     */
    resetHistory() {
        if (confirm('⚠️ This will clear all exchange history. Are you sure?')) {
            const key = `clover_exchange_${this.walletAddress || 'default'}_history`;
            localStorage.removeItem(key);
            this.exchangeHistory = [];
            console.log('✅ Exchange history cleared');
            return true;
        }
        return false;
    }
}

// Initialize globally if not already done
if (typeof window.cloverExchange === 'undefined') {
    console.log('💱 Initializing Clover Exchange System...');
    const cloverExchange = new CloverCoinExchange();
}
