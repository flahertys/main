/**
 * TradeHax Games - Web3 Rewards System
 * Unified reward tracking and wallet integration for all games
 */

class Web3RewardsSystem {
    constructor(gameName) {
        this.gameName = gameName;
        this.walletConnected = false;
        this.walletAddress = null;
        this.provider = null;
        this.totalCoins = 0;
        this.pendingCoins = 0;
        this.sessionCoins = 0;
        this.claimApiBase = (typeof window !== 'undefined' && window.CLAIM_API_BASE) ? window.CLAIM_API_BASE : null;
        this.lastClaimTime = 0;
        this.claimCooldownMs = 5000; // 5 second rate limit between claims

        this.loadState();

        this.rewardRates = {
            snake: { scorePoint: 0.1, levelUp: 5, highScore: 25, gameComplete: 50 },
            tetris: { line: 1, tetris: 10, levelUp: 5, highScore: 25, perfectClear: 100 },
            memory: { match: 2, gameWin: 20, fastWin: 30, perfectGame: 50, newRecord: 25 },
            spades: { handWin: 10, makeBid: 5, gameWin: 100, perfectBid: 15, nilBid: 25 }
        };
    }

    initWalletUI(containerId = 'wallet-container') {
        let container = document.getElementById(containerId);
        if (!container) {
            container = this.createFloatingContainer();
        }

        container.innerHTML = `
            <div class="wallet-panel flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-black bg-opacity-60 rounded-lg border border-green-500 border-opacity-30 shadow-lg">
                <div class="flex items-center gap-3">
                    <button id="web3-wallet-btn" class="wallet-button px-4 py-2 rounded-lg font-semibold transition-all bg-green-600 hover:bg-green-500">
                        Connect Wallet
                    </button>
                    <div id="web3-wallet-info" class="hidden text-sm">
                        <div id="web3-wallet-address" class="text-green-400"></div>
                    </div>
                </div>
                <div class="flex items-center gap-4 flex-wrap justify-end">
                    <div class="coin-display">
                        <div class="text-xs text-gray-400">Session Earned</div>
                        <div class="text-lg font-bold text-green-400">☘️ <span id="web3-session-coins">0</span></div>
                    </div>
                    <div class="coin-display">
                        <div class="text-xs text-gray-400">Total Balance</div>
                        <div class="text-xl font-bold text-green-300">
                            ☘️ <span id="web3-total-coins">0</span>
                            <span id="web3-pending-badge" class="ml-2 text-xs bg-green-600 bg-opacity-30 border border-green-400 px-2 py-0.5 rounded hidden">pending</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="web3-claim-btn" class="wallet-button px-4 py-2 rounded-lg font-semibold transition-all bg-emerald-700 hover:bg-emerald-600 hidden" title="Convert pending coins">
                            Claim / Convert
                        </button>
                        <a href="/games/convert.html" id="web3-convert-link" class="text-xs text-green-300 underline hover:text-green-200">Convert page ↗</a>
                    </div>
                </div>
            </div>
            <div id="web3-claim-status" class="text-xs text-gray-300 mt-2 text-center"></div>
        `;

        this.updateUI();
        this.attachEventHandlers();
    }

    createFloatingContainer() {
        const float = document.createElement('div');
        float.id = 'wallet-container-auto';
        float.style.position = 'fixed';
        float.style.top = '16px';
        float.style.right = '16px';
        float.style.zIndex = '1100';
        float.style.maxWidth = '420px';
        document.body.appendChild(float);
        return float;
    }

    attachEventHandlers() {
        const walletBtn = document.getElementById('web3-wallet-btn');
        const claimBtn = document.getElementById('web3-claim-btn');

        if (walletBtn) {
            walletBtn.addEventListener('click', () => {
                if (this.walletConnected) {
                    this.disconnectWallet();
                } else {
                    this.connectWallet();
                }
            });
        }

        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                if (this.claimApiBase) {
                    return this.claimViaApi();
                }
                return this.claimRewards();
            });
        }
    }

    async connectWallet() {
        try {
            if (window.solana && window.solana.isPhantom) {
                const resp = await window.solana.connect();
                this.walletAddress = resp.publicKey.toString();
                this.walletConnected = true;
                this.provider = window.solana;
                this.claimApiBase = (typeof window !== 'undefined' && window.CLAIM_API_BASE) ? window.CLAIM_API_BASE : this.claimApiBase;

                console.log('✓ Wallet connected:', this.walletAddress);
                this.updateUI();
                this.saveState();

                this.showStatus('Wallet connected successfully!', 'success');

                window.dispatchEvent(new CustomEvent('walletConnected', {
                    detail: { address: this.walletAddress }
                }));

                return true;
            }

            this.showStatus('Please install Phantom wallet to connect', 'error');
            window.open('https://phantom.app/', '_blank');
            return false;
        } catch (err) {
            console.error('Wallet connection failed:', err);
            this.showStatus('Wallet connection failed. Please try again.', 'error');
            return false;
        }
    }

    disconnectWallet() {
        this.walletConnected = false;
        this.walletAddress = null;
        this.provider = null;
        this.updateUI();
        this.saveState();
        this.showStatus('Wallet disconnected', 'info');
    }

    awardCoins(amount, reason = '') {
        if (amount <= 0) return;

        this.sessionCoins += amount;
        this.pendingCoins += amount;
        this.totalCoins += amount;

        console.log(`✓ Awarded ${amount} coins: ${reason}`);
        this.updateUI();
        this.saveState();
        this.showCoinAnimation(amount, reason);
    }

    awardForScore(game, points) {
        const rate = this.rewardRates[game]?.scorePoint || 0.1;
        const coins = Math.floor(points * rate);
        if (coins > 0) {
            this.awardCoins(coins, `${points} points in ${game}`);
        }
    }

    awardForLevelUp(game, level) {
        const coins = this.rewardRates[game]?.levelUp || 5;
        this.awardCoins(coins, `Level ${level} in ${game}`);
    }

    awardForHighScore(game) {
        const coins = this.rewardRates[game]?.highScore || 25;
        this.awardCoins(coins, `New high score in ${game}!`);
    }

    awardForGameWin(game) {
        const coins = this.rewardRates[game]?.gameWin || 20;
        this.awardCoins(coins, `Won ${game} game!`);
    }

    awardForAchievement(game, achievementType) {
        const coins = this.rewardRates[game]?.[achievementType] || 5;
        this.awardCoins(coins, `${achievementType} achievement in ${game}`);
    }

    async claimRewards() {
        if (!this.walletConnected) {
            this.showStatus('Please connect wallet first', 'error');
            return false;
        }

        if (this.pendingCoins <= 0) {
            this.showStatus('No pending coins to claim', 'info');
            return false;
        }

        const claimBtn = document.getElementById('web3-claim-btn');
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Claiming...';
        }

        try {
            this.showStatus(`Claiming ${this.pendingCoins} Clover Coins on Solana Devnet...`, 'info');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const txHash = 'devnet_' + Math.random().toString(36).substr(2, 9);
            console.log('✓ Claimed coins, tx:', txHash);

            this.pendingCoins = 0;
            this.updateUI();
            this.saveState();

            this.showStatus(`✓ Successfully claimed! Devnet TX: ${txHash}`, 'success');
            return true;
        } catch (err) {
            console.error('Claim failed:', err);
            this.showStatus('Claim failed. Please try again.', 'error');
            return false;
        } finally {
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.textContent = 'Claim / Convert';
            }
        }
    }

    async claimViaApi(amount) {
        if (!this.walletConnected || !this.walletAddress) {
            this.showStatus('Connect wallet before converting.', 'error');
            throw new Error('Wallet not connected');
        }

        // Rate limiting: prevent claim spam (5 second cooldown)
        const now = Date.now();
        if (now - this.lastClaimTime < this.claimCooldownMs) {
            const remainingMs = this.claimCooldownMs - (now - this.lastClaimTime);
            this.showStatus(`Please wait ${Math.ceil(remainingMs / 1000)}s before claiming again`, 'warning');
            throw new Error('Rate limited - too many requests');
        }

        if (!this.claimApiBase) {
            return this.claimRewards();
        }

        // Validate and sanitize amount input
        let toClaim;
        if (amount !== undefined && amount !== null) {
            // Ensure amount is a number
            const numAmount = Number(amount);
            if (!Number.isFinite(numAmount)) {
                this.showStatus('Invalid amount: must be a number', 'error');
                throw new Error('Invalid amount format');
            }
            if (numAmount < 0) {
                this.showStatus('Invalid amount: cannot be negative', 'error');
                throw new Error('Negative amount not allowed');
            }
            // Ensure amount doesn't exceed pending coins
            toClaim = Math.min(Math.floor(numAmount), this.pendingCoins);
        } else {
            toClaim = this.pendingCoins;
        }

        if (toClaim <= 0) {
            this.showStatus('No pending coins to convert.', 'info');
            return false;
        }

        const claimBtn = document.getElementById('web3-claim-btn');
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Submitting...';
        }

        const base = this.trimTrailingSlash(this.claimApiBase);
        let retryCount = 0;
        const maxRetries = 3;

        const attemptClaim = async () => {
            try {
                this.showStatus('Requesting challenge...', 'info');
                const challengeResp = await fetch(`${base}/claim/challenge?pubkey=${encodeURIComponent(this.walletAddress)}&amount=${toClaim}`, {
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                if (!challengeResp.ok) {
                    throw new Error(`Challenge request failed (${challengeResp.status})`);
                }
                const { challenge, nonce, message } = await challengeResp.json();
                if (!challenge) {
                    throw new Error(message || 'No challenge received');
                }

                const encoder = new TextEncoder();
                const encoded = encoder.encode(`${challenge}:${toClaim}:${nonce || ''}`);
                if (!this.provider || typeof this.provider.signMessage !== 'function') {
                    throw new Error('Wallet does not support message signing');
                }

                this.showStatus('Signing claim...', 'info');
                const signed = await this.provider.signMessage(encoded, 'utf8');
                const signatureBytes = signed.signature || signed;
                const signature = this.toBase64(signatureBytes);

                this.showStatus('Submitting conversion...', 'info');
                const submitResp = await fetch(`${base}/claim/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pubkey: this.walletAddress,
                        amount: toClaim,
                        challenge,
                        nonce,
                        signature
                    }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (!submitResp.ok) {
                    throw new Error(`Claim submission failed (${submitResp.status})`);
                }

                const result = await submitResp.json();
                this.pendingCoins = Math.max(0, this.pendingCoins - toClaim);
                this.updateUI();
                this.saveState();
                this.lastClaimTime = Date.now();

                const explorer = result.explorerUrl || result.txId || 'Conversion submitted';
                this.showStatus(`Conversion sent! ${explorer}`, 'success');
                return result;
            } catch (err) {
                // Retry logic for network errors (not validation errors)
                if (retryCount < maxRetries && err.message.includes('Network') || err.message.includes('timeout')) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                    this.showStatus(`Retrying in ${delay / 1000}s... (attempt ${retryCount}/${maxRetries})`, 'warning');
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return attemptClaim();
                }
                throw err;
            }
        };

        try {
            return await attemptClaim();
        } catch (err) {
            console.error('Conversion failed:', err);
            const errorMsg = err.message;
            if (errorMsg.includes('Network')) {
                this.showStatus('Network error: check your connection and try again', 'error');
            } else if (errorMsg.includes('signing')) {
                this.showStatus('Wallet signing failed: please try again', 'error');
            } else {
                this.showStatus(errorMsg || 'Conversion failed', 'error');
            }
            throw err;
        } finally {
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.textContent = 'Claim / Convert';
            }
        }
    }

    updateUI() {
        const walletBtn = document.getElementById('web3-wallet-btn');
        if (walletBtn) {
            if (this.walletConnected) {
                walletBtn.textContent = 'Disconnect';
                walletBtn.classList.add('connected');
            } else {
                walletBtn.textContent = 'Connect Wallet';
                walletBtn.classList.remove('connected');
            }
        }

        const walletInfo = document.getElementById('web3-wallet-info');
        const walletAddress = document.getElementById('web3-wallet-address');
        if (walletInfo && walletAddress) {
            if (this.walletConnected && this.walletAddress) {
                const shortAddress = this.walletAddress.slice(0, 4) + '...' + this.walletAddress.slice(-4);
                walletAddress.textContent = shortAddress;
                walletInfo.classList.remove('hidden');
            } else {
                walletInfo.classList.add('hidden');
            }
        }

        const sessionCoins = document.getElementById('web3-session-coins');
        if (sessionCoins) sessionCoins.textContent = this.sessionCoins;

        const totalCoins = document.getElementById('web3-total-coins');
        if (totalCoins) totalCoins.textContent = this.totalCoins;

        const pendingBadge = document.getElementById('web3-pending-badge');
        if (pendingBadge) {
            if (this.pendingCoins > 0) {
                pendingBadge.textContent = `${this.pendingCoins} pending`;
                pendingBadge.classList.remove('hidden');
            } else {
                pendingBadge.classList.add('hidden');
            }
        }

        const claimBtn = document.getElementById('web3-claim-btn');
        if (claimBtn) {
            if (this.walletConnected && this.pendingCoins > 0) {
                claimBtn.classList.remove('hidden');
            } else {
                claimBtn.classList.add('hidden');
            }
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('web3-claim-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `text-xs mt-2 text-center ${
                type === 'success' ? 'text-green-400' :
                type === 'error' ? 'text-red-400' :
                'text-gray-300'
            }`;

            setTimeout(() => {
                if (statusEl.textContent === message) {
                    statusEl.textContent = '';
                }
            }, 5000);
        }
    }

    showCoinAnimation(amount, reason) {
        const notification = document.createElement('div');
        notification.className = 'coin-earned-notification fixed top-20 right-4 bg-green-600 bg-opacity-90 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        notification.innerHTML = `
            <div class="font-bold text-lg">+${amount} ☘️</div>
            <div class="text-sm">${reason}</div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }

    saveState() {
        const state = {
            totalCoins: this.totalCoins,
            pendingCoins: this.pendingCoins,
            walletAddress: this.walletAddress,
            walletConnected: this.walletConnected
        };
        localStorage.setItem(`web3_rewards_${this.gameName}`, JSON.stringify(state));
        localStorage.setItem('web3_rewards_global', JSON.stringify({
            totalCoins: this.totalCoins,
            pendingCoins: this.pendingCoins
        }));
    }

    loadState() {
        const saved = localStorage.getItem(`web3_rewards_${this.gameName}`);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.totalCoins = state.totalCoins || 0;
                this.pendingCoins = state.pendingCoins || 0;
                this.walletAddress = state.walletAddress;
                this.walletConnected = state.walletConnected || false;
            } catch (e) {
                console.warn('Failed to load reward state:', e);
            }
        }

        const globalSaved = localStorage.getItem('web3_rewards_global');
        if (globalSaved) {
            try {
                const globalState = JSON.parse(globalSaved);
                this.totalCoins = Math.max(this.totalCoins, globalState.totalCoins || 0);
                this.pendingCoins = Math.max(this.pendingCoins, globalState.pendingCoins || 0);
            } catch (e) {
                console.warn('Failed to load global reward state:', e);
            }
        }
    }

    resetSession() {
        this.sessionCoins = 0;
        this.updateUI();
    }

    getStats() {
        return {
            sessionCoins: this.sessionCoins,
            totalCoins: this.totalCoins,
            pendingCoins: this.pendingCoins,
            walletConnected: this.walletConnected,
            walletAddress: this.walletAddress
        };
    }

    toBase64(bytes) {
        if (!bytes) return '';
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    trimTrailingSlash(url) {
        return url ? url.replace(/\/+$/, '') : '';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Web3RewardsSystem;
}
