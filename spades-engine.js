/**
 * Spades Card Game Engine
 * 4-player partnership game with AI and Web3 integration
 */

class SpadesEngine {
  constructor(players = []) {
    // Players: [North, East, South, West] (positions around table)
    // Partners: North+South vs East+West
    this.players = players.length === 4 ? players : this.createDefaultPlayers();
    this.teams = {
      1: { players: [0, 2], bid: 0, tricks: 0, score: 0 }, // N+S
      2: { players: [1, 3], bid: 0, tricks: 0, score: 0 }   // E+W
    };
    
    this.gameScore = { 1: 0, 2: 0 };
    this.roundNum = 0;
    this.phase = 'deal'; // deal -> bid -> play -> score
    this.currentPlayer = 0; // 0=N, 1=E, 2=S, 3=W
    this.dealer = 0;
    this.deck = [];
    this.played = {}; // { playerIdx: card }
    this.leader = null; // player who led the trick
    this.trickWinner = null;
    this.tricksSoFar = { 1: [], 2: [] }; // arrays of won trick indices
    this.bids = [0, 0, 0, 0];
    this.tricks = [0, 0, 0, 0]; // tricks won by each player
    this.spadesBreak = false;
    this.gameLog = [];

    this.init();
  }

  createDefaultPlayers() {
    return [
      { idx: 0, name: 'North', type: 'human', hand: [], avatar: '👤' },
      { idx: 1, name: 'East', type: 'ai', hand: [], avatar: '🤖' },
      { idx: 2, name: 'South', type: 'ai', hand: [], avatar: '🤖' },
      { idx: 3, name: 'West', type: 'ai', hand: [], avatar: '🤖' }
    ];
  }

  init() {
    this.dealCards();
    this.phase = 'bid';
    this.currentPlayer = (this.dealer + 1) % 4;
    this.gameLog.push(`Round ${this.roundNum + 1}: Dealer is ${this.players[this.dealer].name}`);
  }

  dealCards() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.deck = [];
    
    // Create full deck
    for (let suit of suits) {
      for (let rank of ranks) {
        this.deck.push({ rank, suit });
      }
    }
    
    // Shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    
    // Deal 13 to each player
    for (let i = 0; i < 4; i++) {
      this.players[i].hand = this.deck.slice(i * 13, (i + 1) * 13);
      this.players[i].hand.sort((a, b) => this.cardRank(a) - this.cardRank(b));
    }
  }

  cardValue(card) {
    const ranks = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return ranks[card.rank] || 0;
  }

  cardRank(card) {
    // Sort spades last, then by suit (♥♦♣), then by value
    const suitOrder = { '♥': 0, '♦': 1, '♣': 2, '♠': 3 };
    return suitOrder[card.suit] * 100 + this.cardValue(card);
  }

  canPlayCard(card, hand, trick = {}) {
    if (!hand.includes(card)) return false;
    
    const ledSuit = trick.suit || null;
    const hasLedSuit = hand.some(c => c.suit === ledSuit);
    const hasNonSpade = hand.some(c => c.suit !== '♠');
    
    // First trick of game: can't lead with spade (unless no other choice or spades broken)
    if (!ledSuit && Object.keys(trick).length === 0 && card.suit === '♠' && !this.spadesBreak && hasNonSpade) {
      return false;
    }
    
    // Must follow suit if possible
    if (ledSuit && card.suit !== ledSuit && hasLedSuit) {
      return false;
    }
    
    return true;
  }

  playCard(playerIdx, card) {
    const hand = this.players[playerIdx].hand;
    if (!this.canPlayCard(card, hand, this.currentTrick())) {
      return false; // Invalid play
    }
    
    hand.splice(hand.indexOf(card), 1);
    this.played[playerIdx] = card;
    
    if (!this.leader) {
      this.leader = playerIdx;
    }
    
    if (card.suit === '♠') {
      this.spadesBreak = true;
    }
    
    return true;
  }

  currentTrick() {
    const trick = {};
    for (let pIdx in this.played) {
      const card = this.played[pIdx];
      trick[pIdx] = card;
      if (!trick.suit) trick.suit = card.suit;
    }
    return trick;
  }

  evaluateTrick() {
    const trick = this.currentTrick();
    let winner = this.leader;
    let winCard = this.played[this.leader];
    
    // Check for spade win
    for (let pIdx in this.played) {
      if (this.played[pIdx].suit === '♠' && this.cardValue(this.played[pIdx]) > this.cardValue(winCard)) {
        winner = parseInt(pIdx);
        winCard = this.played[pIdx];
      }
    }
    
    // Check for high card in led suit
    if (winCard.suit !== '♠') {
      for (let pIdx in this.played) {
        if (this.played[pIdx].suit === trick.suit && this.cardValue(this.played[pIdx]) > this.cardValue(winCard)) {
          winner = parseInt(pIdx);
          winCard = this.played[pIdx];
        }
      }
    }
    
    this.trickWinner = winner;
    this.tricks[winner]++;
    const teamId = winner % 2 === 0 ? 1 : 2;
    this.tricksSoFar[teamId].push(this.roundNum);
    
    this.played = {};
    this.leader = null;
    this.currentPlayer = winner;
    
    this.gameLog.push(`${this.players[winner].name} won the trick.`);
    return winner;
  }

  recordBid(playerIdx, bidAmount) {
    if (playerIdx !== this.currentPlayer || this.phase !== 'bid') return false;
    if (bidAmount < 0 || bidAmount > 13) return false;
    
    this.bids[playerIdx] = bidAmount;
    const teamId = playerIdx % 2 === 0 ? 1 : 2;
    this.gameLog.push(`${this.players[playerIdx].name} bids ${bidAmount}.`);
    
    this.currentPlayer = (this.currentPlayer + 1) % 4;
    
    // All 4 bids recorded?
    if (this.bids.every(b => b !== undefined && b >= 0)) {
      this.phase = 'play';
      this.currentPlayer = (this.dealer + 1) % 4;
      this.teams[1].bid = this.bids[0] + this.bids[2];
      this.teams[2].bid = this.bids[1] + this.bids[3];
      this.gameLog.push(`Team 1 bid: ${this.teams[1].bid}, Team 2 bid: ${this.teams[2].bid}`);
    }
    
    return true;
  }

  endRound() {
    // Score the round
    for (let teamId of [1, 2]) {
      const teamBid = this.teams[teamId].bid;
      const teamTricks = this.tricks[teamId === 1 ? 0 : 1] + this.tricks[teamId === 1 ? 2 : 3];
      
      if (teamTricks >= teamBid) {
        this.teams[teamId].score += teamBid * 10 + (teamTricks - teamBid);
      } else {
        this.teams[teamId].score -= teamBid * 10;
      }
    }
    
    this.gameScore[1] += this.teams[1].score;
    this.gameScore[2] += this.teams[2].score;
    
    this.gameLog.push(`Round ${this.roundNum + 1} end. Team 1: ${this.gameScore[1]}, Team 2: ${this.gameScore[2]}`);
    
    // Check for win
    if (this.gameScore[1] >= 500) return 1;
    if (this.gameScore[2] >= 500) return 2;
    
    // Reset for next round
    this.roundNum++;
    this.dealer = (this.dealer + 1) % 4;
    this.bids = [0, 0, 0, 0];
    this.tricks = [0, 0, 0, 0];
    this.tricksSoFar = { 1: [], 2: [] };
    this.spadesBreak = false;
    this.played = {};
    this.leader = null;
    this.phase = 'deal';
    
    if (this.roundNum < 20) { // Arbitrary max rounds
      this.init();
    }
    
    return null; // Game continues
  }

  getState() {
    return {
      players: this.players,
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      bids: this.bids,
      tricks: this.tricks,
      gameScore: this.gameScore,
      teamScore: { 1: this.teams[1].score, 2: this.teams[2].score },
      roundNum: this.roundNum,
      played: this.played,
      leader: this.leader,
      spadesBreak: this.spadesBreak,
      gameLog: this.gameLog.slice(-5)
    };
  }

  getAIMove(playerIdx) {
    const player = this.players[playerIdx];
    const hand = player.hand;
    
    if (this.phase === 'bid') {
      // Simple bid strategy: count high cards
      let bid = 0;
      for (let card of hand) {
        if (card.suit === '♠') bid += 1;
        if (this.cardValue(card) >= 12) bid += 1;
      }
      return Math.min(bid, hand.length);
    }
    
    // Play phase: follow suit, play low, or play spade
    const trick = this.currentTrick();
    const ledSuit = trick.suit || null;
    const validCards = hand.filter(c => this.canPlayCard(c, hand, trick));
    
    if (!ledSuit) {
      // Leading: play low non-spade if possible
      const nonSpades = validCards.filter(c => c.suit !== '♠');
      if (nonSpades.length) return nonSpades[0];
      return validCards[0];
    }
    
    // Following: play lowest if losing, else highest
    const suitCards = validCards.filter(c => c.suit === ledSuit);
    const spades = validCards.filter(c => c.suit === '♠');
    
    if (suitCards.length) {
      return suitCards[0]; // Play low following suit
    }
    
    if (spades.length) {
      return spades[0]; // Play low trump
    }
    
    return validCards[0]; // Play low overall
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpadesEngine;
}
