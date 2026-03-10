'use client';

import { useWallet } from '@/lib/wallet-provider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpadesTournamentResponse = {
  ok: boolean;
  roomId?: string;
  players?: Array<{ did: string; alias: string }>;
  potLamports?: number;
  count?: number;
  capacity?: number;
  error?: string;
};

const suits = ['♠', '♥', '♦', '♣'] as const;
const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const RANK_POWER: Record<(typeof ranks)[number], number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

const WAGER_BASE_UNITS = 10_000_000;
const BASE_UNITS_PER_NATIVE = 1_000_000_000;
const WAGER_NATIVE_UNITS = WAGER_BASE_UNITS / BASE_UNITS_PER_NATIVE;

type Suit = (typeof suits)[number];
type Rank = (typeof ranks)[number];
type TeamKey = 'neon' | 'shadow';

type Card = {
  suit: Suit;
  rank: Rank;
  label: string;
  power: number;
};

type TrickCard = {
  player: number;
  card: Card;
};

function buildDeck() {
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      suit,
      rank,
      label: `${rank}${suit}`,
      power: RANK_POWER[rank],
    })),
  );
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeDid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `did:dht:tradehax:${crypto.randomUUID()}`;
  }
  return `did:dht:tradehax:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function winnerOfTrick(cards: TrickCard[]) {
  const spades = cards.filter((item) => item.card.suit === '♠');
  const candidatePool = spades.length
    ? spades
    : cards.filter((item) => item.card.suit === cards[0].card.suit);
  return candidatePool.reduce((best, next) => (next.card.power > best.card.power ? next : best));
}

function estimateBid(hand: Card[]) {
  let bidScore = 0;
  let spadeCount = 0;

  hand.forEach((card) => {
    if (card.suit === '♠') {
      spadeCount += 1;
      if (card.power >= 12) {
        bidScore += 1;
      }
      if (card.power >= 10) {
        bidScore += 0.5;
      }
      return;
    }

    if (card.power >= 13) {
      bidScore += 1;
    } else if (card.power === 12) {
      bidScore += 0.5;
    }
  });

  if (spadeCount >= 5) {
    bidScore += 1;
  }

  return Math.min(8, Math.max(1, Math.round(bidScore)));
}

function settleTeamRound(team: TeamKey, tricksWon: number, teamBid: number, total: number, bags: number) {
  if (tricksWon < teamBid) {
    return {
      total: total - teamBid * 10,
      bags,
      text: `${team.toUpperCase()} set (-${teamBid * 10}).`,
    };
  }

  const overTricks = tricksWon - teamBid;
  let nextTotal = total + teamBid * 10 + overTricks;
  let nextBags = bags + overTricks;
  let penaltyText = '';

  if (nextBags >= 10) {
    nextBags -= 10;
    nextTotal -= 100;
    penaltyText = ` ${team.toUpperCase()} bag penalty -100 applied.`;
  }

  return {
    total: nextTotal,
    bags: nextBags,
    text: `${team.toUpperCase()} made bid (+${teamBid * 10}${overTricks ? ` +${overTricks} bags` : ''}).${penaltyText}`,
  };
}

export function SpadesGame() {
  const gameHostRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<{ disconnect: () => void; emit: (event: string, data: unknown) => void } | null>(null);
  const phaserRef = useRef<{ destroy: (removeCanvas?: boolean) => void } | null>(null);
  const timeoutRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const playerBidRef = useRef(3);
  const bidsLockedRef = useRef(false);

  const { address, status: walletStatus } = useWallet();

  const [did, setDid] = useState<string>('');
  const [alias, setAlias] = useState('NeuralSpadesPlayer');
  const [roomId, setRoomId] = useState('tradehax-spades-alpha');

  const [status, setStatus] = useState('Initializing Spades arena...');
  const [tournamentStatus, setTournamentStatus] = useState('Tournament idle');
  const [wagerStatus, setWagerStatus] = useState('No wager simulation yet');

  const [syncSource, setSyncSource] = useState<'socket' | 'polling' | 'offline'>('offline');
  const [socketConnected, setSocketConnected] = useState(false);

  const [turnLabel, setTurnLabel] = useState('Bidding');
  const [round, setRound] = useState(1);
  const [tricksPlayed, setTricksPlayed] = useState(0);
  const [teamNeon, setTeamNeon] = useState(0);
  const [teamShadow, setTeamShadow] = useState(0);
  const [neonTotalScore, setNeonTotalScore] = useState(0);
  const [shadowTotalScore, setShadowTotalScore] = useState(0);
  const [neonBags, setNeonBags] = useState(0);
  const [shadowBags, setShadowBags] = useState(0);

  const [playerBid, setPlayerBid] = useState(3);
  const [bidsLocked, setBidsLocked] = useState(false);
  const [roundNeonBid, setRoundNeonBid] = useState(0);
  const [roundShadowBid, setRoundShadowBid] = useState(0);
  const [aiBids, setAiBids] = useState<[number, number, number, number]>([0, 2, 2, 2]);

  const [cardsLeft, setCardsLeft] = useState(13);
  const [playersInRoom, setPlayersInRoom] = useState(0);
  const [roomCapacity, setRoomCapacity] = useState(4);
  const [roomPotNative, setRoomPotNative] = useState(0);

  const [joinBusy, setJoinBusy] = useState(false);
  const [wagerBusy, setWagerBusy] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    playerBidRef.current = playerBid;
  }, [playerBid]);

  useEffect(() => {
    bidsLockedRef.current = bidsLocked;
  }, [bidsLocked]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowCpu = (navigator.hardwareConcurrency || 8) <= 4;
    if (reducedMotion || lowCpu) {
      setPerformanceMode(true);
    }
  }, []);

  const connected = walletStatus === 'CONNECTED';
  const tournamentVault = useMemo(
    () => process.env.NEXT_PUBLIC_SPADES_TOURNAMENT_VAULT?.trim() || address || '',
    [address],
  );

  const fetchRoomSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`/api/spades/tournament?roomId=${encodeURIComponent(roomId)}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as SpadesTournamentResponse;
      if (!response.ok || !payload.ok) {
        return;
      }

      setPlayersInRoom(payload.count ?? payload.players?.length ?? 0);
      setRoomCapacity(payload.capacity ?? 4);
      setRoomPotNative((payload.potLamports ?? 0) / BASE_UNITS_PER_NATIVE);
      setSyncSource((prev) => (socketConnected ? 'socket' : prev === 'offline' ? 'polling' : prev));
    } catch {
      setSyncSource((prev) => (socketConnected ? prev : 'offline'));
    }
  }, [roomId, socketConnected]);

  useEffect(() => {
    if (socketConnected) {
      setSyncSource('socket');
      return;
    }

    setSyncSource('polling');
    fetchRoomSnapshot();
    const interval = setInterval(fetchRoomSnapshot, 10_000);
    return () => clearInterval(interval);
  }, [fetchRoomSnapshot, socketConnected]);

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      if (!gameHostRef.current) {
        return;
      }

      const [{ default: Phaser }, { io }] = await Promise.all([import('phaser'), import('socket.io-client')]);

      const socketUrl = process.env.NEXT_PUBLIC_SPADES_SOCKET_URL?.trim();
      if (socketUrl) {
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          if (!isMounted) {
            return;
          }
          setSocketConnected(true);
          setSyncSource('socket');
          setStatus('Multiplayer relay connected.');
        });

        socket.on('disconnect', () => {
          if (!isMounted) {
            return;
          }
          setSocketConnected(false);
          setSyncSource('polling');
          setStatus('Socket disconnected; using polling sync fallback.');
        });
      }

      let hands = [[], [], [], []] as Card[][];
      let trick: TrickCard[] = [];
      let currentTurn = 0;
      let leadSuit: Suit | null = null;
      let teamRoundTricks = { neon: 0, shadow: 0 };
      let aiBidsLocal: [number, number, number, number] = [0, 2, 2, 2];
      let cumulativeScore = { neon: 0, shadow: 0 };
      let bagScore = { neon: 0, shadow: 0 };
      let currentRound = 1;
      let trickCount = 0;

      function schedule(callback: () => void, delayMs: number) {
        const timer = setTimeout(callback, delayMs);
        timeoutRef.current.push(timer);
      }

      function refreshBidHud() {
        const neonBid = playerBidRef.current + aiBidsLocal[2];
        const shadowBid = aiBidsLocal[1] + aiBidsLocal[3];
        setRoundNeonBid(neonBid);
        setRoundShadowBid(shadowBid);
      }

      function dealHands() {
        const deck = shuffle(buildDeck());
        hands = [deck.slice(0, 13), deck.slice(13, 26), deck.slice(26, 39), deck.slice(39, 52)];

        trick = [];
        leadSuit = null;
        trickCount = 0;
        currentTurn = 0;
        teamRoundTricks = { neon: 0, shadow: 0 };

        aiBidsLocal = [0, estimateBid(hands[1]), estimateBid(hands[2]), estimateBid(hands[3])];
        setAiBids(aiBidsLocal);

        setBidsLocked(false);
        bidsLockedRef.current = false;

        setCardsLeft(hands[0].length);
        setTricksPlayed(0);
        setTeamNeon(0);
        setTeamShadow(0);
        setTurnLabel('Bidding');
        refreshBidHud();
        setStatus(`Round ${currentRound}: lock your bid to start play.`);
      }

      function chooseLeadCard(hand: Card[], playerIndex: number) {
        if (!hand.length) {
          return -1;
        }

        const partnerIndex = (playerIndex + 2) % 4;
        const partnerOnHumanTeam = partnerIndex % 2 === 0;

        const sortedHigh = [...hand].sort((a, b) => b.power - a.power);
        const sortedLow = [...hand].sort((a, b) => a.power - b.power);

        const powerSpade = sortedHigh.find((card) => card.suit === '♠' && card.power >= 11);
        if (powerSpade && !partnerOnHumanTeam) {
          return hand.findIndex((card) => card === powerSpade);
        }

        const safeLead = sortedLow.find((card) => card.suit !== '♠') || sortedLow[0];
        return hand.findIndex((card) => card === safeLead);
      }

      function chooseResponseCard(hand: Card[], playerIndex: number) {
        if (!hand.length || trick.length === 0) {
          return hand.length ? 0 : -1;
        }

        const mustFollow = Boolean(leadSuit && hand.some((card) => card.suit === leadSuit));
        const legal = hand
          .map((card, index) => ({ card, index }))
          .filter((item) => (mustFollow ? item.card.suit === leadSuit : true));

        const legalCards = legal.map((item) => item.card);
        const sorted = [...legalCards].sort((a, b) => a.power - b.power);

        const partnerIndex = (playerIndex + 2) % 4;
        const currentWinner = winnerOfTrick(trick);
        const partnerWinning = currentWinner.player === partnerIndex;

        if (partnerWinning) {
          const lowest = sorted[0];
          return hand.findIndex((card) => card === lowest);
        }

        const winningCandidates = sorted.filter((card) => {
          if (card.suit === '♠' && currentWinner.card.suit !== '♠') {
            return true;
          }
          if (card.suit === currentWinner.card.suit && card.power > currentWinner.card.power) {
            return true;
          }
          return false;
        });

        const selected = winningCandidates[0] || sorted[0];
        return hand.findIndex((card) => card === selected);
      }

      function chooseAiCardIndex(hand: Card[], playerIndex: number) {
        if (!leadSuit || trick.length === 0) {
          return chooseLeadCard(hand, playerIndex);
        }
        return chooseResponseCard(hand, playerIndex);
      }

      const config = {
        type: Phaser.AUTO,
        width: 980,
        height: 620,
        backgroundColor: '#030712',
        parent: gameHostRef.current,
        scene: {
          create(this: Phaser.Scene) {
            const g = this.add.graphics();
            g.fillGradientStyle(0x020617, 0x020617, 0x111827, 0x020617, 1);
            g.fillRect(0, 0, 980, 620);

            const rim = this.add.rectangle(490, 310, 940, 570).setStrokeStyle(2, 0x0ea5e9, 0.25);
            rim.setDepth(1);

            const pulse = this.add.rectangle(490, 310, 940, 570, 0x06b6d4, 0.03);
            pulse.setDepth(0);
            if (!performanceMode) {
              this.tweens.add({
                targets: pulse,
                alpha: { from: 0.05, to: 0.15 },
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });
            }

            this.add.text(28, 18, 'TRADEHAX SPADES // CYBER TABLE', {
              fontFamily: 'monospace',
              fontSize: '18px',
              color: '#67e8f9',
            });

            const scoreText = this.add.text(642, 18, 'TRICKS N 0 // S 0', {
              fontFamily: 'monospace',
              fontSize: '16px',
              color: '#a5f3fc',
            });

            const turnText = this.add.text(28, 44, 'TURN: BIDDING', {
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#c4b5fd',
            });

            const totalText = this.add.text(642, 44, 'TOTAL N 0 // S 0', {
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#99f6e4',
            });

            if (!performanceMode) {
              const particle = this.add.particles(0, 0, '__WHITE', {
                x: { min: 0, max: 980 },
                y: 0,
                lifespan: 4200,
                speedY: { min: 24, max: 72 },
                speedX: { min: -18, max: 18 },
                quantity: 1,
                scale: { start: 0.04, end: 0 },
                tint: 0x22d3ee,
                blendMode: 'ADD',
              });
              particle.setDepth(0);
            }

            const center = this.add
              .rectangle(490, 285, 290, 185, 0x0f172a, 0.8)
              .setStrokeStyle(2, 0x06b6d4, 0.7);
            center.setDepth(1);
            this.add.text(430, 270, 'TRICK PILE', {
              fontFamily: 'monospace',
              fontSize: '15px',
              color: '#93c5fd',
            });

            const handLayer = this.add.container(0, 0);
            const pileLayer = this.add.container(0, 0);
            const opponentLayer = this.add.container(0, 0);

            const renderOpponents = () => {
              opponentLayer.removeAll(true);

              const backCard = (x: number, y: number, count: number, name: string, bid: number) => {
                const card = this.add
                  .rectangle(x, y, 56, 78, 0x1e293b, 0.95)
                  .setStrokeStyle(2, 0x38bdf8, 0.5);
                const label = this.add.text(x - 40, y + 48, `${name}: ${count} / B${bid}`, {
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#93c5fd',
                });
                opponentLayer.add([card, label]);
              };

              backCard(490, 90, hands[2].length, 'North', aiBidsLocal[2]);
              backCard(850, 300, hands[1].length, 'East', aiBidsLocal[1]);
              backCard(130, 300, hands[3].length, 'West', aiBidsLocal[3]);
            };

            const renderPile = () => {
              pileLayer.removeAll(true);
              trick.forEach((entry) => {
                const posMap: Record<number, { x: number; y: number }> = {
                  0: { x: 490, y: 420 },
                  1: { x: 640, y: 290 },
                  2: { x: 490, y: 170 },
                  3: { x: 340, y: 290 },
                };
                const pos = posMap[entry.player];
                const cardRect = this.add
                  .rectangle(pos.x, pos.y, 82, 118, 0xffffff, 0.95)
                  .setStrokeStyle(2, 0x0f172a, 0.8);
                const label = this.add.text(cardRect.x - 24, cardRect.y - 8, entry.card.label, {
                  fontFamily: 'Arial Black',
                  fontSize: '22px',
                  color: entry.card.suit === '♥' || entry.card.suit === '♦' ? '#dc2626' : '#111827',
                });
                pileLayer.add([cardRect, label]);
              });
            };

            const refreshHud = () => {
              scoreText.setText(`TRICKS N ${teamRoundTricks.neon} // S ${teamRoundTricks.shadow}`);
              totalText.setText(`TOTAL N ${cumulativeScore.neon} // S ${cumulativeScore.shadow}`);

              const turnMap = ['PLAYER', 'EAST', 'NORTH', 'WEST'];
              turnText.setText(`TURN: ${bidsLockedRef.current ? turnMap[currentTurn] : 'BIDDING'}`);
              setTurnLabel(bidsLockedRef.current ? turnMap[currentTurn] : 'Bidding');

              setCardsLeft(hands[0].length);
              setTeamNeon(teamRoundTricks.neon);
              setTeamShadow(teamRoundTricks.shadow);
              setTricksPlayed(trickCount);
              setRound(currentRound);

              setNeonTotalScore(cumulativeScore.neon);
              setShadowTotalScore(cumulativeScore.shadow);
              setNeonBags(bagScore.neon);
              setShadowBags(bagScore.shadow);
              refreshBidHud();
            };

            const playCard = (playerIndex: number, explicitIndex?: number) => {
              if (!hands[playerIndex].length) {
                return;
              }

              const selectedIndex =
                typeof explicitIndex === 'number'
                  ? explicitIndex
                  : chooseAiCardIndex(hands[playerIndex], playerIndex);

              if (selectedIndex < 0) {
                return;
              }

              const [played] = hands[playerIndex].splice(selectedIndex, 1);
              trick.push({ player: playerIndex, card: played });

              if (!leadSuit) {
                leadSuit = played.suit;
              }

              socketRef.current?.emit('play-card', {
                roomId,
                card: played.label,
                playerIndex,
                trickSize: trick.length,
              });

              if (playerIndex === 0) {
                setStatus(`You played ${played.label}.`);
              }

              renderHand();
              renderPile();
              renderOpponents();

              if (trick.length < 4) {
                currentTurn = (currentTurn + 1) % 4;
                refreshHud();
                if (currentTurn !== 0) {
                  schedule(() => playCard(currentTurn), performanceMode ? 260 : 500);
                }
                return;
              }

              const winner = winnerOfTrick(trick);
              const winnerTeam: TeamKey = winner.player % 2 === 0 ? 'neon' : 'shadow';
              teamRoundTricks = {
                ...teamRoundTricks,
                [winnerTeam]: teamRoundTricks[winnerTeam] + 1,
              };

              trickCount += 1;
              currentTurn = winner.player;
              setStatus(
                `${winner.player === 0 ? 'You' : `Seat ${winner.player}`} won trick with ${winner.card.label}.`,
              );
              refreshHud();

              schedule(() => {
                trick = [];
                leadSuit = null;
                renderPile();

                if (hands[0].length === 0) {
                  const neonBid = playerBidRef.current + aiBidsLocal[2];
                  const shadowBid = aiBidsLocal[1] + aiBidsLocal[3];

                  const neonSettle = settleTeamRound(
                    'neon',
                    teamRoundTricks.neon,
                    neonBid,
                    cumulativeScore.neon,
                    bagScore.neon,
                  );
                  const shadowSettle = settleTeamRound(
                    'shadow',
                    teamRoundTricks.shadow,
                    shadowBid,
                    cumulativeScore.shadow,
                    bagScore.shadow,
                  );

                  cumulativeScore = {
                    neon: neonSettle.total,
                    shadow: shadowSettle.total,
                  };
                  bagScore = {
                    neon: neonSettle.bags,
                    shadow: shadowSettle.bags,
                  };

                  currentRound += 1;
                  setStatus(`${neonSettle.text} ${shadowSettle.text} Starting round ${currentRound}.`);
                  dealHands();
                  renderOpponents();
                  renderHand();
                  refreshHud();
                  return;
                }

                refreshHud();
                if (currentTurn !== 0) {
                  schedule(() => playCard(currentTurn), performanceMode ? 260 : 500);
                }
              }, performanceMode ? 420 : 840);
            };

            const renderHand = () => {
              handLayer.removeAll(true);
              hands[0].forEach((card, index) => {
                const x = 70 + index * 68;
                const y = 520;
                const cardBox = this.add
                  .rectangle(x, y, 82, 118, 0xffffff, 0.98)
                  .setStrokeStyle(2, 0x334155, 0.9)
                  .setInteractive({ useHandCursor: true });
                const text = this.add.text(x - 24, y - 8, card.label, {
                  fontFamily: 'Arial Black',
                  fontSize: '22px',
                  color: card.suit === '♥' || card.suit === '♦' ? '#dc2626' : '#111827',
                });

                if (!performanceMode) {
                  cardBox.on('pointerover', () => {
                    this.tweens.add({ targets: [cardBox, text], y: y - 10, duration: 120 });
                  });
                  cardBox.on('pointerout', () => {
                    this.tweens.add({ targets: [cardBox, text], y, duration: 120 });
                  });
                }

                cardBox.on('pointerdown', () => {
                  if (!bidsLockedRef.current) {
                    setStatus('Lock your bid first to begin trick play.');
                    return;
                  }
                  if (currentTurn !== 0) {
                    return;
                  }

                  if (leadSuit) {
                    const hasLeadSuit = hands[0].some((candidate) => candidate.suit === leadSuit);
                    if (hasLeadSuit && card.suit !== leadSuit) {
                      setStatus(`Follow suit (${leadSuit}) if possible.`);
                      return;
                    }
                  }

                  playCard(0, index);
                });

                handLayer.add([cardBox, text]);
              });
            };

            dealHands();
            renderOpponents();
            renderHand();
            renderPile();
            refreshHud();
          },
        },
      };

      phaserRef.current = new Phaser.Game(config) as unknown as { destroy: (removeCanvas?: boolean) => void };

      if (isMounted) {
        setStatus((prev) =>
          prev.includes('connected') ? prev : 'Spades arena loaded. Set your bid and lock it to start.',
        );
      }
    };

    boot().catch((error) => {
      console.error('Spades Phaser boot failed:', error);
      if (isMounted) {
        setStatus('Failed to initialize Spades renderer.');
      }
    });

    return () => {
      isMounted = false;
      timeoutRef.current.forEach((timer) => clearTimeout(timer));
      timeoutRef.current = [];
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
      phaserRef.current?.destroy(true);
      phaserRef.current = null;
    };
  }, [performanceMode, roomId]);

  function handleLockBid() {
    const clamped = Math.max(0, Math.min(13, Math.floor(playerBid)));
    setPlayerBid(clamped);
    playerBidRef.current = clamped;
    setBidsLocked(true);
    bidsLockedRef.current = true;
    setStatus(`Bid locked at ${clamped}. Play your lead card.`);
  }

  async function handleCreateDid() {
    const nextDid = makeDid();
    setDid(nextDid);
    setTournamentStatus(`Identity created: ${nextDid}`);
  }

  async function handleJoinTournament() {
    setJoinBusy(true);
    const identity = did || makeDid();
    if (!did) {
      setDid(identity);
    }

    try {
      const response = await fetch('/api/spades/tournament', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          did: identity,
          alias: alias.trim() || 'NeuralSpadesPlayer',
          roomId,
          wagerLamports: WAGER_BASE_UNITS,
          mode: 'simulation',
        }),
      });

      const payload = (await response.json()) as SpadesTournamentResponse;
      if (!response.ok || !payload.ok) {
        setTournamentStatus(payload.error || 'Failed to join tournament.');
        return;
      }

      setPlayersInRoom(payload.count ?? payload.players?.length ?? 1);
      setRoomCapacity(payload.capacity ?? 4);
      setRoomPotNative((payload.potLamports ?? WAGER_BASE_UNITS) / BASE_UNITS_PER_NATIVE);
      setTournamentStatus(
        `Joined room ${payload.roomId}. Players: ${payload.count ?? payload.players?.length ?? 1}/${payload.capacity ?? 4}. Sim pot: ${(
          (payload.potLamports ?? WAGER_BASE_UNITS) / BASE_UNITS_PER_NATIVE
        ).toFixed(3)} native units`,
      );

      if (!socketConnected) {
        setSyncSource('polling');
      }
    } catch (error) {
      console.error(error);
      setTournamentStatus('Unable to reach tournament API.');
    } finally {
      setJoinBusy(false);
    }
  }

  async function handleSimulateWager() {
    setWagerBusy(true);

    if (!connected || !address) {
      setWagerStatus('Connect your chain account first to simulate a signed wager transaction.');
      setWagerBusy(false);
      return;
    }

    if (!tournamentVault) {
      setWagerStatus('Set NEXT_PUBLIC_SPADES_TOURNAMENT_VAULT to simulate escrow destination.');
      setWagerBusy(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      const simulationRef = `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      setWagerStatus(
        `Optimized simulation signed. ${WAGER_NATIVE_UNITS.toFixed(4)} native units prepared (not broadcast). Ref: ${simulationRef}`,
      );
    } catch (error) {
      console.error(error);
      setWagerStatus('Wager simulation failed. Check chain account session and vault configuration.');
    } finally {
      setWagerBusy(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="theme-panel overflow-hidden p-2 sm:p-3">
        <div
          ref={gameHostRef}
          className="mx-auto min-h-[620px] w-full max-w-[980px] overflow-hidden rounded-2xl border border-cyan-500/25 bg-slate-950"
        />
      </div>

      <aside className="theme-panel p-5 space-y-4">
        <h2 className="theme-title text-2xl">Spades Control Node</h2>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-100">
            Round: <strong>{round}</strong>
          </div>
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-indigo-100">
            Turn: <strong>{turnLabel}</strong>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
            Tricks: <strong>{tricksPlayed}</strong>
          </div>
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-violet-100">
            Hand: <strong>{cardsLeft}</strong>
          </div>
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-teal-100 col-span-2">
            Round Bid — Neon: <strong>{roundNeonBid}</strong> | Shadow: <strong>{roundShadowBid}</strong>
          </div>
          <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 px-3 py-2 text-lime-100 col-span-2">
            Total Score — Neon: <strong>{neonTotalScore}</strong> (bags {neonBags}) | Shadow: <strong>{shadowTotalScore}</strong> (bags {shadowBags})
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-100 col-span-2">
            Round Tricks — Neon Team (You+North): <strong>{teamNeon}</strong> | Shadow Team (East+West): <strong>{teamShadow}</strong>
          </div>
        </div>

        <label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Alias
          <input
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            placeholder="NeuralSpadesPlayer"
          />
        </label>

        <label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Tournament Room
          <input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            placeholder="tradehax-spades-alpha"
          />
        </label>

        <label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Your Bid (Round)
          <input
            type="number"
            min={0}
            max={13}
            value={playerBid}
            onChange={(event) => setPlayerBid(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          />
        </label>

        <div className="grid gap-2">
          <button onClick={handleLockBid} className="theme-cta theme-cta--secondary w-full">
            {bidsLocked ? 'Bid Locked' : 'Lock Bid'}
          </button>
          <button onClick={handleCreateDid} className="theme-cta theme-cta--secondary w-full">
            Create DID Profile
          </button>
          <button
            onClick={handleJoinTournament}
            disabled={joinBusy}
            className="theme-cta theme-cta--loud w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joinBusy ? 'Joining...' : 'Join Tournament (Sim)'}
          </button>
          <button
            onClick={handleSimulateWager}
            disabled={wagerBusy}
            className="theme-cta w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {wagerBusy ? 'Simulating...' : `Simulate ${WAGER_NATIVE_UNITS.toFixed(4)} Native Wager`}
          </button>
          <label className="flex items-center justify-between rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs text-[#a5bdd1]">
            <span>Performance Mode</span>
            <input
              type="checkbox"
              checked={performanceMode}
              onChange={(event) => setPerformanceMode(event.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </div>

        <div className="space-y-2 text-xs">
          <p className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-cyan-100">
            {status}
          </p>
          <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-emerald-100">
            {tournamentStatus}
          </p>
          <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-violet-100">
            {wagerStatus}
          </p>
        </div>

        <div className="text-[11px] text-[#94adc0] leading-relaxed">
          <p>
            Sync mode: <strong>{syncSource}</strong> {socketConnected ? '(live socket)' : '(API polling fallback)'}.
          </p>
          <p className="mt-1">
            Room occupancy: <strong>{playersInRoom}</strong> / {roomCapacity} players.
          </p>
          <p className="mt-1">
            Simulated room pot: <strong>{roomPotNative.toFixed(3)} native units</strong>.
          </p>
          <p className="mt-1">
            Partner-aware AI active. Bidding + bag penalties enabled.
          </p>
          <p className="mt-1">
            Wager flow is simulation-only by default (no automatic transfer submission).
          </p>
          {did ? <p className="mt-2 break-all">DID: {did}</p> : null}
          <p className="mt-1 text-[10px] text-[#7da0b8]">
            AI bids — East: {aiBids[1]} | North: {aiBids[2]} | West: {aiBids[3]}
          </p>
        </div>
      </aside>
    </section>
  );
}
