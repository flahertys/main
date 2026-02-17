/**
 * Hyporborea Quest: Wormhole Awakening
 * Web3 Astral Adventure Game
 */

// Game State
const gameState = {
    currentDimension: 1,
    energy: 0,
    collectedClovers: 0,
    walletConnected: false,
    walletAddress: '',
    walletConnecting: false,
    gameStarted: false,
    clovers: [],
    keys: {}
};

// Three.js Variables
let scene, camera, renderer, controls, clock;
let player, floor, fogParticles = [];
let mazePieces = [];
let portalMeshes = [];
let ribbonParticles = [];
let portalSparks = [];
let portalPulseTime = 0;
let activeBursts = [];
let keys = {};

// Full main.js content pasted here
