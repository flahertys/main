// Spades Game Logic with Solana Wallet Integration
// TradeHax Games - Earn Clover Coins

class SpadesGame {
    constructor() {
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.deck = [];
        this.players = {
            south: { hand: [], bid: 0, tricks: 0, name: 'You' },
            north: { hand: [], bid: 0, tricks: 0, name: 'North' }
        };
        this.teamScore = 0;
        this.oppScore = 0;
        this.teamBags = 0;
        this.oppBags = 0;
        this.currentTrick = [];
        this.leadSuit = null;
        this.currentPlayer = 'south';
        this.round = 0;
        this.handsPlayed = 0;
        this.spadesBroken = false;
        this.rewards = null;
        
        this.initRewards();
        this.setupEventListeners();
        this.newGame();
    }

    // Unified rewards / wallet
    initRewards() {
        this.rewards = new Web3RewardsSystem('spades');
        this.rewards.initWalletUI('wallet-container');
        this.updateCoinDisplay();
    }

    // Coin Management
    awardCoins(amount, reason) {
        if (!this.rewards) return;
        this.rewards.awardCoins(amount, reason);
        this.updateCoinDisplay();
        this.showMessage(`+${amount} ☘️ ${reason}`, 2000);
        console.log(`💰 Awarded ${amount} coins: ${reason}`);
    }

    updateCoinDisplay() {
        const coinsEl = document.getElementById('coinsEarned');
        if (!coinsEl || !this.rewards) return;
        const stats = this.rewards.getStats ? this.rewards.getStats() : { totalCoins: 0 };
        coinsEl.textContent = stats.totalCoins || 0;
    }

    // Game Setup
    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
    }

    newGame() {
        if (this.rewards && this.rewards.resetSession) {
            this.rewards.resetSession();
        }
        this.teamScore = 0;
        this.oppScore = 0;
        this.teamBags = 0;
        this.oppBags = 0;
        this.handsPlayed = 0;
        this.updateScoreboard();
        this.newHand();
    }

    newHand() {
        this.deck = this.createDeck();
        this.shuffleDeck();
        this.dealCards();
        this.round = 0;
        this.spadesBroken = false;
        this.currentTrick = [];
        this.leadSuit = null;
        
        // Reset trick counts
        this.players.south.tricks = 0;
        this.players.north.tricks = 0;
        
        this.updateUI();
        this.startBidding();
    }

    createDeck() {
        const deck = [];
        for (let suit of this.suits) {
            for (let i = 0; i < this.values.length; i++) {
                deck.push({
                    suit: suit,
                    value: this.values[i],
                    rank: i + 2 // 2-14 for sorting
                });
            }
        }
        return deck;
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        this.players.south.hand = this.deck.slice(0, 13);
        this.players.north.hand = this.deck.slice(13, 26);
        
        // Sort hands
        this.sortHand(this.players.south.hand);
        this.sortHand(this.players.north.hand);
    }

    sortHand(hand) {
        const suitOrder = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };
        hand.sort((a, b) => {
            if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }
            return b.rank - a.rank;
        });
    }

    // Bidding
    startBidding() {
        // North bids first (AI)
        this.players.north.bid = this.calculateAIBid(this.players.north.hand);
        document.getElementById('northBid').textContent = this.players.north.bid;
        
        // Show bidding panel for player
        const spadeCount = this.players.south.hand.filter(c => c.suit === '♠').length;
        document.getElementById('spadeCount').textContent = spadeCount;
        
        const bidButtons = document.getElementById('bidButtons');
        bidButtons.innerHTML = '';
        
        for (let i = 0; i <= 13; i++) {
            const btn = document.createElement('button');
            btn.className = 'bid-button';
            btn.textContent = i;
            btn.addEventListener('click', () => this.placeBid(i));
            bidButtons.appendChild(btn);
        }
        
        document.getElementById('biddingPanel').classList.remove('hidden');
    }

    calculateAIBid(hand) {
        let bid = 0;
        const spades = hand.filter(c => c.suit === '♠');
        
        // Count high cards
        spades.forEach(card => {
            if (card.rank >= 11) bid += 1; // J, Q, K, A
            else if (card.rank >= 8) bid += 0.5; // 8, 9, 10
        });
        
        // Count high cards in other suits
        hand.forEach(card => {
            if (card.suit !== '♠' && card.rank === 14) bid += 0.5; // Aces
        });
        
        return Math.max(1, Math.min(13, Math.round(bid)));
    }

    placeBid(amount) {
        this.players.south.bid = amount;
        document.getElementById('playerBid').textContent = amount;
        document.getElementById('biddingPanel').classList.add('hidden');
        
        this.currentPlayer = 'south';
        this.round = 1;
        this.updateUI();
        this.showMessage('Play your card!', 1500);
    }

    // Card Playing
    playCard(card, player) {
        const hand = this.players[player].hand;
        const index = hand.findIndex(c => c.suit === card.suit && c.value === card.value);
        
        if (index === -1) return false;
        
        // Validate play
        if (!this.isValidPlay(card, hand)) {
            this.showMessage('Invalid play! Must follow suit.', 2000);
            return false;
        }
        
        // Remove from hand
        hand.splice(index, 1);
        
        // Add to trick
        this.currentTrick.push({ card, player });
        
        // Set lead suit if first card
        if (this.currentTrick.length === 1) {
            this.leadSuit = card.suit;
            document.getElementById('leadSuit').textContent = card.suit;
        }
        
        // Check if spades broken
        if (card.suit === '♠') {
            this.spadesBroken = true;
        }
        
        this.updateUI();
        
        // Check if trick complete
        if (this.currentTrick.length === 2) {
            setTimeout(() => this.evaluateTrick(), 1500);
        } else {
            // AI plays
            if (player === 'south') {
                setTimeout(() => this.playAICard(), 1000);
            }
        }
        
        return true;
    }

    isValidPlay(card, hand) {
        // If leading, can play anything except spades (unless broken or only have spades)
        if (this.currentTrick.length === 0) {
            if (card.suit === '♠' && !this.spadesBroken) {
                const hasOtherSuits = hand.some(c => c.suit !== '♠');
                return !hasOtherSuits;
            }
            return true;
        }
        
        // Must follow suit if possible
        const hasSuit = hand.some(c => c.suit === this.leadSuit);
        if (hasSuit && card.suit !== this.leadSuit) {
            return false;
        }
        
        return true;
    }

    playAICard() {
        const hand = this.players.north.hand;
        let playableCards = hand.filter(c => this.isValidPlay(c, hand));
        
        if (playableCards.length === 0) playableCards = hand;
        
        // Simple AI: play lowest valid card, or highest if winning
        let selectedCard;
        
        if (this.currentTrick.length === 0) {
            // Leading: play lowest non-spade, or lowest card
            const nonSpades = playableCards.filter(c => c.suit !== '♠');
            selectedCard = nonSpades.length > 0 ? 
                nonSpades[nonSpades.length - 1] : 
                playableCards[playableCards.length - 1];
        } else {
            // Following: try to win if possible, otherwise dump lowest
            const leadCard = this.currentTrick[0].card;
            const suitCards = playableCards.filter(c => c.suit === this.leadSuit);
            
            if (suitCards.length > 0) {
                const winningCards = suitCards.filter(c => c.rank > leadCard.rank);
                selectedCard = winningCards.length > 0 ? 
                    winningCards[0] : 
                    suitCards[suitCards.length - 1];
            } else {
                // Can't follow suit, play lowest card (or trump if needed)
                selectedCard = playableCards[playableCards.length - 1];
            }
        }
        
        this.playCard(selectedCard, 'north');
    }

    evaluateTrick() {
        const trick = this.currentTrick;
        let winner = trick[0];
        
        // Check for spades (trump)
        const spades = trick.filter(t => t.card.suit === '♠');
        if (spades.length > 0) {
            winner = spades.reduce((a, b) => a.card.rank > b.card.rank ? a : b);
        } else {
            // Highest card of lead suit wins
            const leadSuitCards = trick.filter(t => t.card.suit === this.leadSuit);
            winner = leadSuitCards.reduce((a, b) => a.card.rank > b.card.rank ? a : b);
        }
        
        this.players[winner.player].tricks++;
        this.updateUI();
        
        this.showMessage(`${this.players[winner.player].name} wins the trick!`, 2000);
        
        // Clear trick
        this.currentTrick = [];
        this.leadSuit = null;
        document.getElementById('leadSuit').textContent = '-';
        
        // Next round or end hand
        if (this.round >= 13) {
            setTimeout(() => this.endHand(), 2000);
        } else {
            this.round++;
            this.currentPlayer = winner.player;
            
            setTimeout(() => {
                this.updateUI();
                if (winner.player === 'north') {
                    this.playAICard();
                }
            }, 2000);
        }
    }

    endHand() {
        this.handsPlayed++;
        
        // Calculate scores
        const southTricks = this.players.south.tricks;
        const southBid = this.players.south.bid;
        const northTricks = this.players.north.tricks;
        const northBid = this.players.north.bid;
        
        // South's team (with North as dummy for simplicity)
        if (southTricks >= southBid) {
            const points = southBid * 10;
            const bags = southTricks - southBid;
            this.teamScore += points + bags;
            this.teamBags += bags;
            
            // Award coins for making bid
            this.awardCoins(5, 'Made your bid!');
        } else {
            this.teamScore -= southBid * 10;
        }
        
        // North's team
        if (northTricks >= northBid) {
            const points = northBid * 10;
            const bags = northTricks - northBid;
            this.oppScore += points + bags;
            this.oppBags += bags;
        } else {
            this.oppScore -= northBid * 10;
        }
        
        // Bag penalty
        if (this.teamBags >= 10) {
            this.teamScore -= 100;
            this.teamBags -= 10;
            this.showMessage('Bag penalty! -100 points', 3000);
        }
        
        if (this.oppBags >= 10) {
            this.oppScore -= 100;
            this.oppBags -= 10;
        }
        
        // Award coins for winning hand
        if (this.teamScore > this.oppScore) {
            this.awardCoins(10, 'Won the hand!');
        }
        
        this.updateScoreboard();
        
        // Check for game end
        if (this.teamScore >= 500 || this.oppScore >= 500) {
            this.endGame();
        } else {
            setTimeout(() => this.newHand(), 3000);
        }
    }

    endGame() {
        const winner = this.teamScore >= 500 ? 'You' : 'Opponents';
        
        if (winner === 'You') {
            this.awardCoins(100, 'WON THE GAME! 🎉');
        }
        
        this.showMessage(`${winner} won the game! ${this.teamScore} - ${this.oppScore}`, 5000);
        
        setTimeout(() => {
            if (confirm(`Game Over! ${winner} won!\n\nPlay again?`)) {
                this.newGame();
            }
        }, 5000);
    }

    // UI Updates
    updateUI() {
        this.renderHand('south');
        this.renderHand('north');
        this.renderTrick();
        this.updateRoundDisplay();
        
        document.getElementById('playerTricks').textContent = this.players.south.tricks;
        document.getElementById('northTricks').textContent = this.players.north.tricks;
    }

    renderHand(player) {
        const container = player === 'south' ? 
            document.getElementById('playerHand') : 
            document.getElementById('northHand');
        
        container.innerHTML = '';
        
        const hand = this.players[player].hand;
        
        hand.forEach(card => {
            const cardEl = this.createCardElement(card, player);
            container.appendChild(cardEl);
        });
    }

    createCardElement(card, player) {
        const div = document.createElement('div');
        div.className = 'card';
        
        if (player === 'north') {
            // Show card backs for opponent
            div.style.background = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)';
            div.innerHTML = '<div class="text-center text-4xl">🂠</div>';
            return div;
        }
        
        const suitClass = card.suit === '♠' || card.suit === '♣' ? 'spade' : 'heart';
        
        div.innerHTML = `
            <div class="card-value ${suitClass}">${card.value}</div>
            <div class="card-suit ${suitClass}">${card.suit}</div>
            <div class="card-value ${suitClass}" style="text-align: right;">${card.value}</div>
        `;
        
        // Make clickable for player
        const canPlay = this.currentPlayer === 'south' && 
                       this.currentTrick.length < 2 && 
                       this.round > 0;
        
        if (canPlay) {
            div.addEventListener('click', () => this.playCard(card, 'south'));
        } else {
            div.classList.add('disabled');
        }
        
        return div;
    }

    renderTrick() {
        const container = document.getElementById('trickCards');
        container.innerHTML = '';
        
        this.currentTrick.forEach(({ card, player }) => {
            const cardEl = this.createCardElement(card, 'south'); // Show all trick cards
            cardEl.classList.remove('disabled');
            cardEl.style.cursor = 'default';
            container.appendChild(cardEl);
        });
    }

    updateRoundDisplay() {
        document.getElementById('roundNum').textContent = this.round;
    }

    updateScoreboard() {
        document.getElementById('teamScore').textContent = this.teamScore;
        document.getElementById('oppScore').textContent = this.oppScore;
        document.getElementById('teamBags').textContent = this.teamBags;
        document.getElementById('oppBags').textContent = this.oppBags;
        document.getElementById('handsPlayed').textContent = this.handsPlayed;
        
        const winRate = this.handsPlayed > 0 ? 
            Math.round((this.teamScore / (this.teamScore + this.oppScore)) * 100) : 0;
        document.getElementById('winRate').textContent = winRate + '%';
    }

    showMessage(text, duration = 2000) {
        const msg = document.getElementById('gameMessage');
        msg.textContent = text;
        msg.style.opacity = '1';
        
        setTimeout(() => {
            msg.style.opacity = '0';
        }, duration);
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new SpadesGame();
    console.log('♠️ Spades game initialized');
});

// Rules modal functions
function closeRules() {
    document.getElementById('rulesModal').classList.add('hidden');
}
