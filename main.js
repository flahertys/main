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

// Initialize Game
function init() {
    setupLoadingScreen();
    setupThreeJS();
    setupWeb3();
    setupEventListeners();
    setupHUD();
    animate();
}

// Loading Screen
function setupLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.querySelector('.loading-progress');

    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    gameState.gameStarted = true;
                    generateDimension(1);
                }, 1000);
            }, 500);
        }
        progressBar.style.width = progress + '%';
    }, 200);
}

// Three.js Setup
function setupThreeJS() {
    clock = new THREE.Clock();
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000022, 10, 100);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Player Avatar
    const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const playerMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        emissive: 0x002211,
        transparent: true,
        opacity: 0.8,
        wireframe: true
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 1, 0);
    scene.add(player);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);
    const floorMaterial = new THREE.MeshPhongMaterial({
        color: 0x111111,
        wireframe: true
    });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Fog Particles
    createFogParticles();
}

// Create Mystical Fog
function createFogParticles() {
    for (let i = 0; i < 30; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: Math.random() * 0.5
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        particle.position.set(
            (Math.random() - 0.5) * 40,
            Math.random() * 8,
            (Math.random() - 0.5) * 40
        );

        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
        );

        scene.add(particle);
        fogParticles.push(particle);
    }
}

// Generate Dimension
function generateDimension(dimension) {
    clearDimensionGeometry();
    // Clear existing clovers
    gameState.clovers.forEach(clover => {
        scene.remove(clover);
    });
    gameState.clovers = [];

    // Optional: tweak fog density per dimension (subtle variation)
    const fogNear = 10 - Math.min(dimension, 5) * 0.5;
    const fogFar = 100 - Math.min(dimension, 5) * 2;
    scene.fog.near = Math.max(5, fogNear);
    scene.fog.far = Math.max(40, fogFar);

    createMaze(dimension);
    createPortalPad();
    createPortalRibbons();

    // Create new clovers for this dimension
    const cloverCount = 5 + dimension * 2; // More clovers in higher dimensions

    for (let i = 0; i < cloverCount; i++) {
        createClover();
    }

    updateHUD();
}

// Create Clover
function createClover() {
    const cloverGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 100);
    const cloverMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        emissive: 0x002211,
        transparent: true,
        opacity: 0.9
    });

    const clover = new THREE.Mesh(cloverGeometry, cloverMaterial);

    // Random position (slight elevation jitter for depth)
    clover.position.set(
        (Math.random() - 0.5) * 30,
        0.5 + Math.random() * 1.0,
        (Math.random() - 0.5) * 30
    );

    clover.castShadow = true;
    scene.add(clover);
    gameState.clovers.push(clover);
}

// --- Dimensional Geometry Helpers ---
function clearDimensionGeometry() {
    mazePieces.forEach(m => scene.remove(m));
    portalMeshes.forEach(m => scene.remove(m));
    ribbonParticles.forEach(m => scene.remove(m));
    portalSparks.forEach(m => scene.remove(m));
    activeBursts.forEach(m => scene.remove(m));
    mazePieces = [];
    portalMeshes = [];
    ribbonParticles = [];
    portalSparks = [];
    portalPulseTime = 0;
    activeBursts = [];
}

function createMaze(dimension) {
    // Simple Escher-ish scaffolding: skewed planes and vertical stairs
    const baseSize = 40;
    const layerCount = 3 + Math.min(dimension, 3);
    const material = new THREE.MeshPhongMaterial({
        color: 0x111133,
        emissive: 0x050515,
        wireframe: true,
        transparent: true,
        opacity: 0.35
    });

    for (let i = 0; i < layerCount; i++) {
        const size = baseSize - i * 6;
        const planeGeo = new THREE.PlaneGeometry(size, size, 4, 4);
        const plane = new THREE.Mesh(planeGeo, material.clone());
        plane.rotation.x = -Math.PI / 2;
        plane.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.2 * Math.random();
        plane.position.y = 0.2 * i;
        scene.add(plane);
        mazePieces.push(plane);

        // Stairs segment
        const boxGeo = new THREE.BoxGeometry(2, 0.5, size * 0.6);
        const box = new THREE.Mesh(boxGeo, material.clone());
        box.position.set((i % 2 === 0 ? 1 : -1) * size * 0.15, 0.5 + 0.2 * i, 0);
        box.rotation.y = 0.25 * (i % 2 === 0 ? 1 : -1);
        scene.add(box);
        mazePieces.push(box);
    }
}

function createPortalPad() {
    const ringGeo = new THREE.RingGeometry(1.2, 2.2, 48);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e0ff,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);
    portalMeshes.push(ring);

    const coreGeo = new THREE.CircleGeometry(1.0, 32);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x9945ff,
        transparent: true,
        opacity: 0.35
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = -Math.PI / 2;
    core.position.y = 0.02;
    scene.add(core);
    portalMeshes.push(core);

    // Spark sprites around portal
    const sparkCount = 24;
    for (let i = 0; i < sparkCount; i++) {
        const spriteMat = new THREE.SpriteMaterial({
            color: Math.random() > 0.5 ? 0x00e0ff : 0x9945ff,
            transparent: true,
            opacity: 0.6 + Math.random() * 0.3
        });
        const sprite = new THREE.Sprite(spriteMat);
        const angle = (Math.PI * 2 * i) / sparkCount;
        const radius = 2.0 + Math.random() * 0.5;
        sprite.scale.set(0.15, 0.15, 0.15);
        sprite.position.set(Math.cos(angle) * radius, 0.2 + Math.random() * 0.4, Math.sin(angle) * radius);
        scene.add(sprite);
        portalSparks.push(sprite);
    }
}

function createPortalRibbons() {
    const ribbonCount = 18;
    for (let i = 0; i < ribbonCount; i++) {
        const boxGeo = new THREE.BoxGeometry(0.06, 0.06, 1.4 + Math.random());
        const boxMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0x00e0ff : 0x9945ff,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.3
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        const angle = (Math.PI * 2 * i) / ribbonCount;
        const radius = 2.6 + Math.random() * 0.4;
        box.position.set(Math.cos(angle) * radius, 0.4 + Math.random() * 0.3, Math.sin(angle) * radius);
        box.rotation.y = angle;
        scene.add(box);
        ribbonParticles.push(box);
    }
}

// Web3 Setup
function setupWeb3() {
    const connectButton = document.getElementById('connect-wallet');
    connectButton.addEventListener('click', async () => {
        if (gameState.walletConnecting) return;
        gameState.walletConnecting = true;
        connectButton.textContent = 'Connecting...';

        try {
            const provider = window?.solana;

            if (!provider || !provider.isPhantom) {
                showSuccessMessage('Phantom wallet not found. Install Phantom to connect.', true);
                connectButton.textContent = 'Get Phantom';
                connectButton.onclick = () => window.open('https://phantom.app/', '_blank');
                gameState.walletConnecting = false;
                return;
            }

            const resp = await provider.connect({ onlyIfTrusted: false });
            const pubkey = resp?.publicKey?.toString?.();

            if (!pubkey) throw new Error('No public key returned');

            gameState.walletConnected = true;
            gameState.walletAddress = pubkey;
            connectButton.textContent = 'Wallet Connected';
            connectButton.classList.add('secondary');
            updateHUD();
            showSuccessMessage('Wallet Connected Successfully!');
        } catch (error) {
            console.error('Wallet connection failed', error);
            showSuccessMessage('Wallet Connection Failed', true);
            connectButton.textContent = 'Connect Wallet';
        } finally {
            gameState.walletConnecting = false;
        }
    });
}

// Event Listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        keys[event.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (event) => {
        keys[event.key.toLowerCase()] = false;
    });

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    });

    // Puzzle overlay
    document.getElementById('submit-puzzle').addEventListener('click', () => {
        const answer = document.getElementById('puzzle-input').value;
        if (answer.toLowerCase() === 'portal') {
            document.getElementById('puzzle-overlay').classList.add('hidden');
            showWormholePortal();
        } else {
            showSuccessMessage('Incorrect answer. Try again.', true);
        }
    });

    document.getElementById('close-puzzle').addEventListener('click', () => {
        document.getElementById('puzzle-overlay').classList.add('hidden');
    });

    // Wormhole overlay
    document.getElementById('summon-portal').addEventListener('click', () => {
        document.getElementById('wormhole-overlay').classList.add('hidden');
        advanceDimension();
    });

    document.getElementById('cancel-portal').addEventListener('click', () => {
        document.getElementById('wormhole-overlay').classList.add('hidden');
    });
}

// HUD Setup
function setupHUD() {
    updateHUD();
}

// Update HUD
function updateHUD() {
    document.getElementById('dimension-display').textContent = gameState.currentDimension;
    document.getElementById('energy-display').textContent = gameState.energy;
    document.getElementById('clovers-display').textContent = gameState.collectedClovers;

    const walletChip = document.getElementById('wallet-address');
    if (walletChip) {
        if (gameState.walletConnected && gameState.walletAddress) {
            const shortAddr = `${gameState.walletAddress.slice(0, 4)}...${gameState.walletAddress.slice(-4)}`;
            walletChip.textContent = `Connected: ${shortAddr}`;
            walletChip.classList.remove('hidden');
        } else {
            walletChip.classList.add('hidden');
        }
    }
}

// Show Success Message
function showSuccessMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    if (isError) {
        messageDiv.style.background = 'rgba(255, 0, 0, 0.95)';
        messageDiv.style.color = '#fff';
    }
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Show Puzzle
function showPuzzle() {
    document.getElementById('puzzle-text').textContent = 'What has keys but opens no locks? A: _____';
    document.getElementById('puzzle-input').value = '';
    document.getElementById('puzzle-overlay').classList.remove('hidden');
}

// Show Wormhole Portal
function showWormholePortal() {
    document.getElementById('wormhole-overlay').classList.remove('hidden');
}

// Advance Dimension
function advanceDimension() {
    gameState.currentDimension++;
    gameState.energy = 0;
    gameState.collectedClovers = 0;

    // Create portal effect
    createPortalEffect();

    setTimeout(() => {
        generateDimension(gameState.currentDimension);
        showSuccessMessage(`Welcome to Dimension ${gameState.currentDimension}!`);
    }, 2000);
}

// Create Portal Effect
function createPortalEffect() {
    const portalGeometry = new THREE.RingGeometry(2, 4, 32);
    const portalMaterial = new THREE.MeshBasicMaterial({
        color: 0x9945ff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(0, 2, 0);
    portal.rotation.x = -Math.PI / 2;
    scene.add(portal);

    // Animate portal
    let scale = 1;
    const portalAnimation = setInterval(() => {
        scale += 0.1;
        portal.scale.setScalar(scale);
        portal.material.opacity -= 0.02;

        if (portal.material.opacity <= 0) {
            clearInterval(portalAnimation);
            scene.remove(portal);
        }
    }, 50);
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    portalPulseTime += delta;

    // Update controls
    controls.update();

    // Move player (frame-rate independent)
    const moveSpeed = 6 * delta;
    const forward = keys['w'] ? 1 : keys['s'] ? -1 : 0;
    const strafe = keys['d'] ? 1 : keys['a'] ? -1 : 0;
    if (forward !== 0 || strafe !== 0) {
        player.position.x += strafe * moveSpeed;
        player.position.z -= forward * moveSpeed;
    }

    // Update camera to follow player
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 5;

    // Animate portal ribbons
    ribbonParticles.forEach(p => {
        p.rotation.y += delta * 0.6;
        const r = Math.hypot(p.position.x, p.position.z);
        const angle = Math.atan2(p.position.z, p.position.x) + delta * 0.4;
        p.position.x = Math.cos(angle) * r;
        p.position.z = Math.sin(angle) * r;
        p.position.y = 0.35 + Math.sin(portalPulseTime * 2 + r) * 0.12;
    });

    // Animate portal sparks and pad pulse
    portalSparks.forEach(s => {
        s.material.opacity = 0.4 + 0.35 * Math.sin(portalPulseTime * 3 + s.position.x * 2);
        s.position.y += (Math.random() - 0.5) * 0.01;
    });

    portalMeshes.forEach((m, idx) => {
        if (idx === 0) {
            m.material.opacity = 0.4 + 0.15 * Math.sin(portalPulseTime * 2.5);
            m.scale.setScalar(1 + 0.05 * Math.sin(portalPulseTime * 1.5));
        } else {
            m.material.opacity = 0.3 + 0.1 * Math.sin(portalPulseTime * 1.3);
        }
    });

    // Animate clover bursts
    activeBursts = activeBursts.filter(sprite => {
        sprite.userData.life -= delta;
        if (sprite.userData.life <= 0) {
            scene.remove(sprite);
            return false;
        }
        sprite.position.addScaledVector(sprite.userData.velocity, delta * 2.2);
        sprite.material.opacity = Math.max(0, sprite.userData.life / 0.8);
        sprite.scale.multiplyScalar(0.98);
        return true;
    });

    // Check clover collection
    checkCloverCollection();

    // Animate fog particles
    fogParticles.forEach(particle => {
        particle.position.add(particle.userData.velocity);

        // Wrap around boundaries
        if (particle.position.x > 25) particle.position.x = -25;
        if (particle.position.x < -25) particle.position.x = 25;
        if (particle.position.z > 25) particle.position.z = -25;
        if (particle.position.z < -25) particle.position.z = 25;
    });

    renderer.render(scene, camera);
}

// Check Clover Collection
function checkCloverCollection() {
    gameState.clovers.forEach((clover, index) => {
        const distance = player.position.distanceTo(clover.position);
        if (distance < 1.5) {
            // Collect clover
            scene.remove(clover);
            gameState.clovers.splice(index, 1);
            gameState.collectedClovers++;
            gameState.energy += 10;

            spawnCloverBurst(clover.position);
            flashHudEnergy();

            updateHUD();

            // Play collection sound (placeholder)
            console.log('Clover collected!');

            // Check if enough energy for portal
            if (gameState.energy >= 30) {
                setTimeout(() => {
                    showPuzzle();
                }, 1000);
            }
        }
    });
}

function spawnCloverBurst(pos) {
    const count = 18;
    for (let i = 0; i < count; i++) {
        const spriteMat = new THREE.SpriteMaterial({
            color: i % 2 === 0 ? 0x00ff88 : 0x3b82f6,
            transparent: true,
            opacity: 0.9
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(pos);
        sprite.scale.set(0.2, 0.2, 0.2);
        sprite.userData = {
            life: 0.8,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.6,
                Math.random() * 1.4,
                (Math.random() - 0.5) * 1.6
            )
        };
        scene.add(sprite);
        activeBursts.push(sprite);
    }
}

function flashHudEnergy() {
    const energyEl = document.getElementById('energy-display');
    if (!energyEl) return;
    energyEl.classList.add('hud-flash');
    setTimeout(() => energyEl.classList.remove('hud-flash'), 350);
}

// Start the game
init();
