// ===== SCREEN MANAGEMENT SYSTEM =====
class ScreenManager {
    constructor() {
        this.currentScreen = 'loading';
        this.screens = {
            loading: document.getElementById('loading-screen'),
            title: document.getElementById('title-screen'),
            levelSelect: document.getElementById('level-select-screen'),
            settings: document.getElementById('settings-screen'),
            credits: document.getElementById('credits-screen'),
            game: document.getElementById('game-screen')
        };
        this.modals = {
            pause: {
                overlay: document.getElementById('pause-overlay'),
                modal: document.getElementById('pause-modal')
            },
            gameOver: {
                overlay: document.getElementById('game-over-overlay'),
                modal: document.getElementById('game-over-modal')
            },
            levelComplete: {
                overlay: document.getElementById('level-complete-overlay'),
                modal: document.getElementById('level-complete-modal')
            }
        };
        this.transitionOverlay = document.getElementById('transition-overlay');
        this.setupScreenManager();
    }

    setupScreenManager() {
        // Initialize all screens as hidden
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
                screen.classList.add('hidden');
            }
        });

        // Show loading screen initially
        this.showScreen('loading');
    }

    showScreen(screenName, transition = 'fade') {
        if (!this.screens[screenName]) {
            console.error(`Screen ${screenName} not found`);
            return;
        }

        // Check if we're transitioning from a non-game screen to another non-game screen
        const nonGameScreens = ['loading', 'title', 'levelSelect', 'settings', 'credits'];
        const isFromNonGame = nonGameScreens.includes(this.currentScreen);
        const isToNonGame = nonGameScreens.includes(screenName);
        
        // Use transition overlay for non-game screen transitions
        if (isFromNonGame && isToNonGame && this.currentScreen !== screenName) {
            this.showTransitionOverlay(() => {
                this.performScreenChange(screenName, transition);
            });
        } else if (this.currentScreen === 'game' && isToNonGame) {
            // Special case: transitioning from game to non-game screen
            this.showTransitionOverlay(() => {
                this.performScreenChange(screenName, transition);
            });
        } else {
            // Direct screen change for game screen or same screen
            this.performScreenChange(screenName, transition);
        }
    }

    performScreenChange(screenName, transition) {
        // Hide current screen
        if (this.screens[this.currentScreen]) {
            this.screens[this.currentScreen].classList.remove('active');
            this.screens[this.currentScreen].classList.add('hidden');
        }

        // Show new screen
        this.screens[screenName].classList.remove('hidden');
        this.screens[screenName].classList.add('active');

        // Add transition effect
        if (transition === 'slide-left') {
            this.screens[screenName].classList.add('slide-in-left');
        } else if (transition === 'slide-right') {
            this.screens[screenName].classList.add('slide-in-right');
        }

        this.currentScreen = screenName;
        console.log(`Switched to screen: ${screenName}`);

        // Trigger screen-specific events
        this.onScreenChange(screenName);
    }

    showTransitionOverlay(callback) {
        if (!this.transitionOverlay) return;
        
        // Show transition overlay immediately
        this.transitionOverlay.classList.remove('hidden');
        this.transitionOverlay.classList.add('active');
        
        // Force a reflow to ensure the overlay is visible before proceeding
        this.transitionOverlay.offsetHeight;
        
        // Perform transition immediately after overlay is visible
        setTimeout(() => {
            if (callback) callback();
            // Hide transition overlay after a brief moment
            setTimeout(() => {
                this.transitionOverlay.classList.remove('active');
                setTimeout(() => {
                    this.transitionOverlay.classList.add('hidden');
                }, 200); // Wait for fade out
            }, 100); // Brief pause before hiding
        }, 10); // Minimal delay to ensure overlay is visible
    }

    showModal(modalName) {
        const modal = this.modals[modalName];
        if (!modal) {
            console.error(`Modal ${modalName} not found`);
            return;
        }

        modal.overlay.classList.add('active');
        modal.modal.classList.add('active');
        console.log(`Showed modal: ${modalName}`);
    }

    hideModal(modalName) {
        const modal = this.modals[modalName];
        if (!modal) {
            console.error(`Modal ${modalName} not found`);
            return;
        }

        modal.overlay.classList.remove('active');
        modal.modal.classList.remove('active');
        console.log(`Hid modal: ${modalName}`);
    }

    onScreenChange(screenName) {
        switch (screenName) {
            case 'title':
                // Reset game state when returning to title screen
                if (gameState === 'playing' || gameState === 'paused') {
                    resetGame();
                    gameState = 'menu';
                    gamePaused = false;
                }
                break;
            case 'game':
                // Game screen specific logic
                if (gameState !== 'playing') {
                    startGame();
                }
                break;
            case 'settings':
                // Settings screen specific logic
                break;
            case 'levelSelect':
                // Level select specific logic
                break;
        }
    }

    // Utility methods
    isScreenVisible(screenName) {
        return this.screens[screenName] && 
               this.screens[screenName].classList.contains('active');
    }

    isModalVisible(modalName) {
        return this.modals[modalName] && 
               this.modals[modalName].overlay.classList.contains('active');
    }
}

// Initialize screen manager
let screenManager;

// Game state variables
let gameState = 'menu'; // 'menu', 'settings', 'playing', 'gameOver', 'levelComplete'
let gamePaused = false; // Track if game is paused
let currentLevel = 1;
let currentScreen = 0; // 0 = spikes, 1 = yellow enemies, 2 = blue enemies, 3 = white enemies
let player;
let obstacles = []; // Wall obstacles to dodge
let spikes = []; // Ground spikes that kill the player
let enemies = []; // Yellow enemies that launch the player
let flyingEnemies = []; // Flying enemies that move in patterns
let whiteEnemies = []; // White enemies that move in patterns
let goal;
let world;

// Screen system variables
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const SCREEN_TRANSITION_X = 1200; // When player reaches this X position, transition to next screen
let screenTransitioned = false; // Flag to prevent multiple transitions
let screenStartTime = null; // Time when current screen started

// Sound variables
let attackSound;
let jumpSound;
let killSound;
let soundsLoaded = false;
let masterVolume = 0.5; // Default volume 50%

// Player animation variables
let playerIdleFrames = [];
let playerLeftFrames = [];
let playerRightFrames = [];
let currentIdleFrame = 0;
let lastFrameChange = 0;
let frameInterval = 500; // 500ms = 0.5 seconds

// --- SINGLE SCREEN VARIABLES ---
let spawnTimer = 0;
let spawnInterval = 120; // Spawn every 2 seconds at 60fps
let timeSurvived = 0;
let gameStartTime = null;

// Ground level
const GROUND_Y = 650;
const GROUND_HEIGHT = 70;
const JUMP_HEIGHT = 80; // Approximate jump height for obstacle sizing
const LAUNCH_HEIGHT = 20; // Even weaker - about 1.5x normal jump



// --- KEY BINDINGS ---
const defaultKeyBindings = {
    left: ['a', 'ArrowLeft'],
    right: ['d', 'ArrowRight'],
    jump: [' '], // Only spacebar
    dash: ['e'],
    attack: ['Mouse0'], // Only left mouse click
    up: ['w', 'ArrowUp'],
    down: ['s', 'ArrowDown'],
    lookUp: ['w'], // New: Look Up (W)
    lookDown: ['s'], // New: Look Down (S)
};
let keyBindings = {...defaultKeyBindings}; // Always start with defaults, no localStorage
let bindingAction = null; // Which action is being rebound

// --- KEY STATE TRACKING ---
let attackKeyDown = false;
let attackMouseDown = false;
let bindingButtonClicked = false; // Flag to prevent button click from being registered as binding

// --- WHITE ENEMY CLASS ---

function preload() {
    // Load player idle animation frames
    try {
        playerIdleFrames[0] = loadImage('frame-r.png');
        playerIdleFrames[1] = loadImage('frame-r.png');
        playerLeftFrames[0] = loadImage('frame-l.png');
        playerLeftFrames[1] = loadImage('frame-l.png');
        playerRightFrames[0] = loadImage('frame-r.png');
        playerRightFrames[1] = loadImage('frame-r.png');
        console.log('Loading player animation frames...');
    } catch (error) {
        console.log('Some sprite files not found, using fallback character');
    }
    
    // Load audio files
    try {
        if (typeof loadSound === 'function') {
            attackSound = loadSound('Attack.mp3');
            jumpSound = loadSound('Jump.mp3');
            killSound = loadSound('Kill.ogg');
            console.log('Audio files loaded successfully');
            soundsLoaded = true;
        } else {
            console.log('p5.sound not available, sounds disabled');
        }
    } catch (error) {
        console.log('Some audio files not found:', error);
    }
}

function playSound(sound) {
    if (sound && soundsLoaded && typeof sound.play === 'function') {
        try {
            sound.setVolume(masterVolume);
            sound.play();
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }
}

function setup() {
    console.log('Setting up game...');
    let canvas = createCanvas(1280, 720);
    canvas.parent('game-container');
    
    // Ensure canvas is properly positioned and visible
    canvas.style('position', 'absolute');
    canvas.style('top', '0');
    canvas.style('left', '0');
    canvas.style('z-index', '1');
    canvas.style('display', 'block');
    
    console.log('Canvas created with size: 1280 x 720');
    console.log('Canvas element:', canvas.elt);
    
    // Initialize p5.play world with fallback
    try {
        world = new p5.play.World();
        console.log('p5.play world initialized successfully');
    } catch (error) {
        console.log('p5.play not available, using fallback physics');
        world = null;
    }
    
    console.log('Setup complete');
}

// Wait for DOM to be loaded before setting up event listeners
window.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing screen manager...');
    
    // Initialize screen manager
    screenManager = new ScreenManager();
    
    // Simulate loading time
    setTimeout(() => {
        screenManager.showScreen('title');
    }, 2000);
    
    // Set up event listeners
    setupEventListeners();
    console.log('Event listeners setup complete');
    
    // Set up key binding UI with a small delay to ensure DOM is fully ready
    setTimeout(() => {
        if (typeof setupKeyBindingUI === 'function') {
            console.log('Setting up key binding UI...');
            setupKeyBindingUI();
        }
    }, 100);
});

function windowResized() {
    resizeCanvas(1280, 720);
    if (gameState === 'playing') {
        loadLevel(currentLevel - 1);
    }
}

function draw() {
    // Only draw background for game states that need it
    if (gameState === 'playing') {
        background(255, 255, 255); // White background only for gameplay
    } else if (gameState === 'menu') {
        // Draw a dark background for menu
        background(0, 0, 0);
        drawTitleScreen();
        return;
    } else if (gameState === 'settings') {
        // Settings overlay is handled by HTML
        return;
    } else if (gameState === 'gameOver') {
        background(0, 0, 0); // Black background for game over
        drawGameOverScreen();
        return;
    } else if (gameState === 'levelComplete') {
        console.log('Drawing level complete screen');
        background(0, 0, 0); // Black background for level complete
        drawLevelCompleteScreen();
        return;
    }
    
    if (gameState === 'playing') {
        if (gameStartTime === null) {
            gameStartTime = millis(); // Start timer on first frame
        }
        if (screenStartTime === null) {
            screenStartTime = millis(); // Start timer for current screen
        }
        
        // Check if game is paused
        if (gamePaused) {
            // Only draw background when paused, don't update game objects
            drawGround();
            drawObstacles();
            drawSpikes();
            drawEnemies();
            drawFlyingEnemies();
            drawWhiteEnemies();
            if (player) player.draw();
            return;
        }
        
        // Spawn timer for screen-specific enemies
        spawnTimer++;
        console.log('Spawn timer:', spawnTimer, '/', spawnInterval); // Debug spawn timer
        if (spawnTimer >= spawnInterval) {
            console.log('Spawning screen-specific enemy!'); // Debug spawn trigger
            spawnScreenSpecificEnemy();
            spawnTimer = 0;
        }
        
        // Update all moving objects
        enemies.forEach(enemy => enemy.update());
        obstacles.forEach(obstacle => obstacle.update());
        spikes.forEach(spike => spike.update());
        flyingEnemies.forEach(flyingEnemy => { 
            flyingEnemy.update(); // Update vertical movement
        });
        whiteEnemies.forEach(enemy => enemy.update());
        
        // Remove enemies that go off screen
        while (enemies.length && (enemies[0].x + enemies[0].w < 0 || enemies[0].x > width)) {
            enemies.shift();
        }
        while (flyingEnemies.length && (flyingEnemies[0].x + flyingEnemies[0].w < 0 || flyingEnemies[0].x > width)) {
            flyingEnemies.shift();
        }
        while (obstacles.length && (obstacles[0].x + obstacles[0].w < 0 || obstacles[0].x > width)) {
            obstacles.shift();
        }
        while (spikes.length && (spikes[0].x + spikes[0].w < 0 || spikes[0].x > width)) {
            spikes.shift();
        }
        while (whiteEnemies.length && (whiteEnemies[0].x + whiteEnemies[0].w < 0 || whiteEnemies[0].x > width)) {
            whiteEnemies.shift();
        }
        
        if (player) {
            player.update();
            checkCollisions();
            
            // Check for screen transition
            checkScreenTransition();
            
            // Game over if player falls below the screen
            if (player.sprite.y > height) {
                showGameOver();
                return;
            }
            // Game over if player moves off the left side (but allow right side for transitions)
            if (player.sprite.x + player.sprite.w < 0) {
                showGameOver();
                return;
            }
            player.draw();
            console.log('Player position:', player.sprite.x, player.sprite.y, 'Screen:', currentScreen, 'Screen name:', getScreenInfo().name);
        } else {
            console.log('No player object!');
        }
        
        // Draw ground, obstacles, spikes, enemies, and flying enemies
        drawGround();
        drawObstacles();
        drawSpikes();
        drawEnemies();
        drawFlyingEnemies();
        drawWhiteEnemies();
        
        timeSurvived = ((millis() - gameStartTime) / 1000) || 0;
        updateUIScore();
        updateUIHearts();
    }
}

function drawTitleScreen() {
    // Title screen is now handled by HTML, no need for canvas drawing
    // Removed clouds to prevent them from appearing on other screens
}

function drawLevelSelectScreen() {
    // Level select screen is now handled by HTML
}

function drawGameOverScreen() {
    // Game over screen is handled by HTML
}

function drawLevelCompleteScreen() {
    // Level complete screen is now handled by HTML
    // Just draw a background
    background(0, 0, 0); // Black background
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Title screen buttons
    const startBtn = document.getElementById('start-btn');
    const levelSelectBtn = document.getElementById('level-select-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const creditsBtn = document.getElementById('credits-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            console.log('Start button clicked');
            screenManager.showScreen('game');
        });
    }
    
    if (levelSelectBtn) {
        levelSelectBtn.addEventListener('click', function() {
            console.log('Level select button clicked');
            screenManager.showScreen('levelSelect');
        });
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            console.log('Settings button clicked');
            screenManager.showScreen('settings');
        });
    }
    
    if (creditsBtn) {
        creditsBtn.addEventListener('click', function() {
            console.log('Credits button clicked');
            screenManager.showScreen('credits');
        });
    }
    
    // Level select buttons
    const backToTitleBtn = document.getElementById('back-to-title');
    const levelBtns = document.querySelectorAll('.level-btn');
    
    if (backToTitleBtn) {
        backToTitleBtn.addEventListener('click', function() {
            console.log('Back to title button clicked');
            screenManager.showScreen('title');
        });
    }
    
    levelBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            console.log(`Level ${level} selected`);
            currentLevel = level;
            screenManager.showScreen('game');
        });
    });
    
    // Settings screen buttons
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const resetToDefaultBtn = document.getElementById('reset-to-default-btn');
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', function() {
            console.log('Back to menu button clicked');
            screenManager.showScreen('title');
        });
    }
    
    if (resetToDefaultBtn) {
        resetToDefaultBtn.addEventListener('click', function() {
            console.log('Reset to default button clicked');
            resetToDefaultKeyBindings();
        });
    }
    
    // Credits screen button
    const creditsBackBtn = document.getElementById('credits-back-btn');
    if (creditsBackBtn) {
        creditsBackBtn.addEventListener('click', function() {
            console.log('Credits back button clicked');
            screenManager.showScreen('title');
        });
    }
    
    // Game screen buttons
    const pauseBtn = document.getElementById('pause-btn');
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            console.log('Pause button clicked');
            togglePause();
        });
    }
    
    // Modal buttons
    const resumeBtn = document.getElementById('resume-btn');
    const pauseSettingsBtn = document.getElementById('pause-settings-btn');
    const pauseBackMenuBtn = document.getElementById('pause-back-menu-btn');
    
    if (resumeBtn) {
        resumeBtn.addEventListener('click', function() {
            console.log('Resume button clicked');
            togglePause();
        });
    }
    
    if (pauseSettingsBtn) {
        pauseSettingsBtn.addEventListener('click', function() {
            console.log('Pause settings button clicked');
            screenManager.hideModal('pause');
            screenManager.showScreen('settings');
        });
    }
    
    if (pauseBackMenuBtn) {
        pauseBackMenuBtn.addEventListener('click', function() {
            console.log('Pause back menu button clicked');
            screenManager.hideModal('pause');
            // Reset game state before going to title
            if (gameState === 'playing' || gamePaused) {
                resetGame();
                gameState = 'menu';
                gamePaused = false;
            }
            screenManager.showScreen('title');
        });
    }
    
    // Game over buttons
    const restartBtn = document.getElementById('restart-btn');
    const gameOverMenuBtn = document.getElementById('game-over-menu-btn');
    
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            console.log('Restart button clicked');
            screenManager.hideModal('gameOver');
            resetGame();
        });
    }
    
    if (gameOverMenuBtn) {
        gameOverMenuBtn.addEventListener('click', function() {
            console.log('Game over menu button clicked');
            screenManager.hideModal('gameOver');
            // Reset game state before going to title
            if (gameState === 'gameOver') {
                resetGame();
                gameState = 'menu';
            }
            screenManager.showScreen('title');
        });
    }
    
    // Level complete buttons
    const levelRestartBtn = document.getElementById('level-restart-btn');
    const levelMenuBtn = document.getElementById('level-menu-btn');
    
    if (levelRestartBtn) {
        levelRestartBtn.addEventListener('click', function() {
            console.log('Level restart button clicked');
            screenManager.hideModal('levelComplete');
            resetGame();
        });
    }
    
    if (levelMenuBtn) {
        levelMenuBtn.addEventListener('click', function() {
            console.log('Level menu button clicked');
            screenManager.hideModal('levelComplete');
            // Reset game state before going to title
            if (gameState === 'levelComplete') {
                resetGame();
                gameState = 'menu';
            }
            screenManager.showScreen('title');
        });
    }
    
    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    if (volumeSlider && volumeValue) {
        // Set initial volume
        volumeSlider.value = masterVolume * 100;
        volumeValue.textContent = Math.round(masterVolume * 100) + '%';
        
        // Add event listener for volume changes
        volumeSlider.addEventListener('input', function() {
            masterVolume = this.value / 100;
            volumeValue.textContent = this.value + '%';
            console.log('Volume changed to:', masterVolume);
        });
        console.log('Volume slider listener added');
    } else {
        console.log('Volume slider not found:', {volumeSlider: !!volumeSlider, volumeValue: !!volumeValue});
    }
    
    // Game menu button and dropdown
    const menuBtn = document.getElementById('menu-btn');
    const resetLevelBtn = document.getElementById('reset-level-btn');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleGameMenu);
        console.log('Menu button listener added');
    }
    
    if (resetLevelBtn) {
        resetLevelBtn.addEventListener('click', resetLevel);
        console.log('Reset level button listener added');
    }
    
    // Keyboard and mouse event listeners
    document.addEventListener('keydown', function(event) {
        if (bindingAction) {
            event.preventDefault();
            setKeyBinding(bindingAction, event.key.toLowerCase());
            bindingAction = null;
            bindingButtonClicked = false;
            updateKeyBindingButtons();
            return;
        }
        
        if (gameState === 'playing' && !gamePaused) {
            handleGameKeyDown(event);
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (gameState === 'playing' && !gamePaused) {
            handleGameKeyUp(event);
        }
    });
    
    // Mouse event listeners for attack
    document.addEventListener('mousedown', function(event) {
        if (event.button === 0 && gameState === 'playing' && !gamePaused) { // Left mouse button
            attackMouseDown = true;
            if (player && !player.isAttacking) {
                player.startAttack();
            }
        }
    });
    
    document.addEventListener('mouseup', function(event) {
        if (event.button === 0) { // Left mouse button
            attackMouseDown = false;
        }
    });
    
    // Escape key for pause
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && gameState === 'playing') {
            togglePause();
        }
    });
    
    console.log('Event listeners setup complete');
}

function toggleGameMenu() {
    const dropdown = document.getElementById('game-menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function resetLevel() {
    console.log('Resetting level...');
    loadLevel(currentLevel - 1);
    toggleGameMenu(); // Close the dropdown
}

function togglePause() {
    if (gamePaused) {
        // Resume game
        gamePaused = false;
        screenManager.hideModal('pause');
    } else {
        // Pause game
        gamePaused = true;
        screenManager.showModal('pause');
    }
}

function showMenu() {
    console.log('Showing menu...');
    gameState = 'menu';
    screenManager.showScreen('title');
}

function showSettings() {
    console.log('Showing settings...');
    gameState = 'settings';
    screenManager.showScreen('settings');
}

function startGame() {
    console.log('Starting game...');
    gameState = 'playing';
    screenManager.showScreen('game');
    resetGame();
    console.log('Game started');
}

function showGameOver() {
    gameState = 'gameOver';
    screenManager.showModal('gameOver');
}

function showLevelComplete() {
    gameState = 'levelComplete';
    // Update the level complete header
    const levelCompleteHeader = document.querySelector('#level-complete-modal h2');
    if (levelCompleteHeader) {
        levelCompleteHeader.textContent = `LEVEL ${currentLevel} COMPLETE!`;
    }
    // Update the completion time
    const completionTimeElem = document.getElementById('completion-time');
    if (completionTimeElem) {
        completionTimeElem.textContent = `Total Time: ${timeSurvived.toFixed(2)} seconds`;
    }
    screenManager.showModal('levelComplete');
}

function drawGround() {
    // Draw continuous ground
    fill(255, 255, 255); // White ground
    stroke(200, 200, 200); // Light gray border
    strokeWeight(3);
    rect(0, GROUND_Y, width, GROUND_HEIGHT);
    
    // Add some ground texture (white lines)
    fill(240, 240, 240); // Very light gray for subtle lines
    for (let i = 0; i < width; i += 40) {
        rect(i, GROUND_Y + 10, 20, 5);
    }
}

function drawObstacles() {
    console.log('Drawing obstacles:', obstacles.length);
    obstacles.forEach(obstacle => {
        obstacle.draw();
    });
}

function drawSpikes() {
    spikes.forEach(spike => {
        spike.draw();
    });
}

function drawEnemies() {
            console.log('Drawing enemies:', enemies.length, 'white enemies:', whiteEnemies.length, 'Screen:', currentScreen, 'Screen name:', getScreenInfo().name);
        if (enemies.length === 0 && currentScreen === 0) {
            console.log('TIP: Move to the right edge of the screen to find enemies on the next screen!');
        }
    enemies.forEach(enemy => {
        enemy.draw();
    });
}

function drawFlyingEnemies() {
    console.log('Drawing flying enemies:', flyingEnemies.length);
    flyingEnemies.forEach(flyingEnemy => {
        flyingEnemy.draw();
    });
}

function drawWhiteEnemies() {
    whiteEnemies.forEach(enemy => enemy.draw());
}

// --- IMPROVED COLLISION LOGIC FOR GROUND RUNNER ---
function checkCollisions() {
    if (!player) return;
    
    // Ground collision - player always stays on ground
    if (player.sprite.y + player.sprite.h > GROUND_Y) {
        player.sprite.y = GROUND_Y - player.sprite.h;
        player.sprite.velocity.y = 0;
        player.onGround = true;
        player.justLanded = true; // Mark that player just landed
    } else {
        player.onGround = false;
    }
    
    // Obstacle collisions - treat as platforms that player can land on
    obstacles.forEach((obstacle, index) => {
        if (
            player.sprite.x < obstacle.x + obstacle.w &&
            player.sprite.x + player.sprite.w > obstacle.x &&
            player.sprite.y < obstacle.y + obstacle.h &&
            player.sprite.y + player.sprite.h > obstacle.y
        ) {
            // Check if player is landing on top of obstacle
            if (player.sprite.y + player.sprite.h > obstacle.y && player.sprite.y < obstacle.y) {
                player.sprite.y = obstacle.y - player.sprite.h;
                player.sprite.velocity.y = 0;
                player.onGround = true; // Mark that player is on a platform
                player.justLanded = true; // Mark that player just landed
            } else {
                // Player hit obstacle from the side - block movement
                if (player.sprite.x < obstacle.x) {
                    // Player hit obstacle from left side - block movement
                    player.sprite.x = obstacle.x - player.sprite.w;
                    player.sprite.velocity.x = 0;
                } else {
                    // Player hit obstacle from right side - block movement
                    player.sprite.x = obstacle.x + obstacle.w;
                    player.sprite.velocity.x = 0;
                }
            }
        }
    });
    
    // Spike collisions - treat exactly like platforms but with damage
    let onAnySpike = false; // Track if player is on any spike
    spikes.forEach((spike, index) => {
        if (
            player.sprite.x < spike.x + spike.w &&
            player.sprite.x + player.sprite.w > spike.x &&
            player.sprite.y < spike.y + spike.h &&
            player.sprite.y + player.sprite.h > spike.y
        ) {
            // Check if player is landing on top of spike
            if (player.sprite.y + player.sprite.h > spike.y && player.sprite.y < spike.y) {
                player.sprite.y = spike.y - player.sprite.h;
                player.sprite.velocity.y = 0;
                player.onSpike = true; // Mark that player is on a spike
                player.justLanded = true; // Mark that player just landed
                onAnySpike = true;
                
                // Reset screen when player hits spike
                console.log('Player stepped on spike! Resetting screen...');
                resetCurrentScreen();
            } else {
                // Player hit spike from the side - block movement but no damage if invulnerable
                if (player.sprite.x < spike.x) {
                    // Player hit spike from left side - block movement
                    player.sprite.x = spike.x - player.sprite.w;
                    player.sprite.velocity.x = 0;
                } else {
                    // Player hit spike from right side - block movement
                    player.sprite.x = spike.x + spike.w;
                    player.sprite.velocity.x = 0;
                }
                
                // Reset screen when player hits spike from side
                console.log('Player hit spike side! Resetting screen...');
                resetCurrentScreen();
            }
        }
    });
    
    // Reset onSpike flag if not on any spike
    if (!onAnySpike) {
        player.onSpike = false;
    }
    
    // Yellow enemy collisions - treat as instant death for player
    enemies.forEach((enemy, index) => {
        if (
            player.sprite.x < enemy.x + enemy.w &&
            player.sprite.x + player.sprite.w > enemy.x &&
            player.sprite.y < enemy.y + enemy.h &&
            player.sprite.y + player.sprite.h > enemy.y
        ) {
            // Player dies instantly on contact
            console.log('Player touched yellow enemy! Resetting screen...');
            resetCurrentScreen();
        }
    });
    
    // Flying enemy collisions - always apply knockback and blocking, damage only when not invulnerable
    flyingEnemies.forEach((flyingEnemy, index) => {
        if (
            player.sprite.x < flyingEnemy.x + flyingEnemy.w &&
            player.sprite.x + player.sprite.w > flyingEnemy.x &&
            player.sprite.y < flyingEnemy.y + flyingEnemy.h &&
            player.sprite.y + player.sprite.h > flyingEnemy.y
        ) {
            // Player hit flying enemy - always apply knockback and physical blocking
            let knockbackForce = 6; // Slightly less knockback for flying enemies
            if (player.sprite.x < flyingEnemy.x) {
                // Player hit enemy from left side - knockback left and block movement
                player.sprite.velocity.x = -knockbackForce;
                player.sprite.x = flyingEnemy.x - player.sprite.w; // Block movement
            } else {
                // Player hit enemy from right side - knockback right and block movement
                player.sprite.velocity.x = knockbackForce;
                player.sprite.x = flyingEnemy.x + flyingEnemy.w; // Block movement
            }
            
            // Small upward knockback
            player.sprite.velocity.y = -2;
            
            // Reset screen when player hits flying enemy
            console.log('Player hit flying enemy! Resetting screen...');
            resetCurrentScreen();
        }
    });
    
    // White enemy collisions - treat as instant death for player
    whiteEnemies.forEach((whiteEnemy, index) => {
        if (
            player.sprite.x < whiteEnemy.x + whiteEnemy.w &&
            player.sprite.x + player.sprite.w > whiteEnemy.x &&
            player.sprite.y < whiteEnemy.y + whiteEnemy.h &&
            player.sprite.y + player.sprite.h > whiteEnemy.y
        ) {
            // Player dies instantly on contact
            console.log('Player touched white enemy! Resetting screen...');
            resetCurrentScreen();
        }
    });
    
    // Attack collision detection
    if (player.isAttacking) {
        // Check attack collision with yellow enemies
        enemies.forEach((enemy, index) => {
            if (player.checkAttackCollision(enemy)) {
                enemy.takeDamage(1);
                console.log('Yellow enemy hit by attack!');
                // Play kill sound
                playSound(killSound);
                // Downward attack jump effect
                if (player.attackDirection === 3) {
                    player.sprite.velocity.y = -player.jumpPower;
                }
            }
        });
        
        // Check attack collision with white enemies
        whiteEnemies.forEach((whiteEnemy, index) => {
            if (player.checkAttackCollision(whiteEnemy)) {
                whiteEnemy.takeDamage(1);
                console.log('White enemy hit by attack!');
                // Play kill sound
                playSound(killSound);
                // Downward attack jump effect
                if (player.attackDirection === 3) {
                    player.sprite.velocity.y = -player.jumpPower;
                }
            }
        });
        
        // Check attack collision with flying enemies
        flyingEnemies.forEach((flyingEnemy, index) => {
            if (player.checkAttackCollision(flyingEnemy)) {
                // Remove flying enemy when hit by attack
                flyingEnemies.splice(index, 1);
                console.log('Flying enemy defeated by attack!');
                // Play kill sound
                playSound(killSound);
                // Downward attack jump effect
                if (player.attackDirection === 3) {
                    player.sprite.velocity.y = -player.jumpPower;
                }
            }
        });
    }
    
    // Reset dash when landing on ground
    if (player.onGround && !player.wasOnGround) {
        player.canDash = true;
    }
    player.wasOnGround = player.onGround;
}

function updateUI() {
    // Update level display
    document.getElementById('level-value').textContent = timeSurvived.toFixed(2);
}

function updateUIHearts() {
    // Hearts system removed - function kept for compatibility
}

// Player class with improved physics
class Player {
    constructor(x, y) {
        console.log('Creating player at:', x, y);
        // Create sprite with fallback if p5.play is not available
        if (typeof p5.play !== 'undefined' && p5.play.Sprite) {
            this.sprite = new p5.play.Sprite(x, y, 60, 75);
            this.sprite.velocity.x = 0;
            this.sprite.velocity.y = 0;
            this.sprite.friction = 0.85;
            this.sprite.mass = 1;
        } else {
            // Fallback sprite object with improved physics
            this.sprite = {
                x: x,
                y: y,
                w: 60,
                h: 75,
                velocity: {x: 0, y: 0},
                friction: 0.85,
                mass: 1
            };
        }
        
        this.acceleration = 3.2; // Much higher ground acceleration
        this.maxSpeed = 12; // Slightly slower top ground speed
        this.jumpPower = 18; // Increased jump height for higher jumps
        this.onGround = false;
        this.onSpike = false; // Track if player is on a spike
        this.justLanded = false; // Track if player just landed on a platform
        this.color = [100, 150, 255];
        this.isMoving = false;
        this.facingDirection = 1; // 1 for right, -1 for left
        
        // Hollow Knight-style physics variables
        this.coyoteTime = 0; // Frames after leaving ground where you can still jump
        this.coyoteTimeMax = 6; // 6 frames of coyote time (0.1 seconds at 60fps)
        this.jumpBufferTime = 0; // Frames to buffer jump input
        this.jumpBufferMax = 3; // 3 frames of jump buffering
        this.airAcceleration = 0.4; // Much lower air acceleration for less control in air
        this.airMaxSpeed = 12; // Slightly slower top air speed
        this.jumpCutoff = 0.6; // Jump height multiplier when releasing jump early
        this.isJumping = false; // Track if currently jumping
        this.jumpStartVelocity = 0; // Store initial jump velocity
        
        // Double jump variables
        this.hasDoubleJump = true; // Can perform double jump
        this.hasUsedDoubleJump = false; // Track if double jump was used
        this.doubleJumpPower = 16; // Slightly less powerful than first jump
        
        // Dash variables - redesigned as teleport
        this.dashDistance = 300; // 5 character widths (60 * 5 = 300 pixels)
        this.isDashing = false;
        this.dashDirection = 0;
        this.canDash = true; // Can dash once per landing
        this.dashKeyPressed = false; // Track if dash key was pressed to prevent holding
        this.dashCooldown = 0; // Brief cooldown after dash
        this.dashCooldownMax = 5; // 5 frames of cooldown
        

        
        // Attack system variables
        this.isAttacking = false;
        this.attackFrameCount = 0;
        this.attackDuration = 8; // Frames the attack lasts
        this.attackCooldown = 0;
        this.attackCooldownMax = 10; // Frames between attacks
        this.attackRange = 60; // Attack range in pixels (increased)
        this.attackKeyPressed = false; // Prevent holding attack key
        
        this.dashTrailStart = null;
        this.dashTrailEnd = null;
        this.dashTrailTimer = 0;
        this.dashTrailDuration = 12; // frames to show the line
        
        this.justBounced = false;
        
        this.dashStartX = 0;
        this.dashTargetX = 0;
        this.dashElapsed = 0;
        this.dashDuration = 0.2; // seconds (was 0.3)
        
        console.log('Player created successfully:', this.sprite);
        console.log('Dash frames calculated:', this.dashFrames, 'frames');
    }
    
    update() {
        let currentTime = millis();
        
        // Check if player is moving
        this.isMoving = isKeyDownFor('left') || isKeyDownFor('right');
        
        // Handle dash input (E key) - teleport activation
        if (isKeyDownFor('dash')) {
            if (!this.dashKeyPressed && !this.isDashing && this.canDash && this.dashCooldown <= 0) {
                this.startDash();
                this.dashKeyPressed = true;
            }
        } else {
            this.dashKeyPressed = false; // Reset when key is released
        }
        
        // Handle attack input (J key) - 4 directional attacks
        if (isKeyDownFor('attack') && !gamePaused) {
            if (!this.attackKeyPressed && !this.isAttacking && this.attackCooldown <= 0) {
                this.startAttack();
                this.attackKeyPressed = true;
            }
        } else {
            this.attackKeyPressed = false; // Reset when key is released
        }
        
        // Update dash state - smooth
        if (this.isDashing) {
            // Calculate dash progress
            let dashSpeed = this.dashDistance / (this.dashDuration * 60); // px per frame at 60fps
            let nextX = this.sprite.x + this.dashDirection * dashSpeed;
            // If overshooting, clamp to target
            if ((this.dashDirection > 0 && nextX >= this.dashTargetX) || (this.dashDirection < 0 && nextX <= this.dashTargetX)) {
                this.sprite.x = this.dashTargetX;
                this.isDashing = false;
                this.dashCooldown = this.dashCooldownMax;
                this.canDash = false;
                // Record dash end position and start timer for trail
                this.dashTrailEnd = { x: this.sprite.x, y: this.sprite.y + this.sprite.h / 2 };
                this.dashTrailTimer = this.dashTrailDuration;
                this.dashTrailStart = this.dashTrailStart; // keep for effect
                return;
            } else {
                this.sprite.x = nextX;
                // Record dash trail start if not set
                if (!this.dashTrailStart) {
                    this.dashTrailStart = { x: this.dashStartX, y: this.sprite.y + this.sprite.h / 2 };
                }
                // No other movement during dash
                return;
            }
        }
        
        // Update dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }
        
        // Update attack state
        if (this.isAttacking) {
            this.attackFrameCount++;
            if (this.attackFrameCount >= this.attackDuration) {
                this.isAttacking = false;
                this.attackCooldown = this.attackCooldownMax;
            }
        } else {
            // Update attack cooldown
            if (this.attackCooldown > 0) {
                this.attackCooldown--;
            }
        }
        

        
        // Update coyote time
        if (this.onGround || this.onSpike) {
            this.coyoteTime = this.coyoteTimeMax;
            // Reset double jump when touching ground
            this.hasDoubleJump = true;
            this.hasUsedDoubleJump = false;
        } else {
            this.coyoteTime = Math.max(0, this.coyoteTime - 1);
        }
        
        // Update jump buffer
        if (isKeyDownFor('jump')) {
            this.jumpBufferTime = this.jumpBufferMax;
        } else {
            this.jumpBufferTime = Math.max(0, this.jumpBufferTime - 1);
        }
        
        // Hollow Knight-style jumping with double jump
        let canJump = (this.onGround || this.onSpike || this.coyoteTime > 0);
        let canDoubleJump = !this.onGround && !this.onSpike && this.hasDoubleJump && !this.hasUsedDoubleJump;
        
        // First jump (ground jump)
        if (this.jumpBufferTime > 0 && canJump && !this.isDashing) {
            this.sprite.velocity.y = -this.jumpPower;
            this.jumpStartVelocity = this.sprite.velocity.y;
            this.onGround = false;
            this.onSpike = false;
            this.coyoteTime = 0; // Use up coyote time
            this.jumpBufferTime = 0; // Use up jump buffer
            this.isJumping = true;
            // Play jump sound
            playSound(jumpSound);
        }
        // Double jump (air jump)
        else if (this.jumpBufferTime > 0 && canDoubleJump && !this.isDashing) {
            this.sprite.velocity.y = -this.doubleJumpPower;
            this.jumpStartVelocity = this.sprite.velocity.y;
            this.jumpBufferTime = 0; // Use up jump buffer
            this.isJumping = true;
            this.hasUsedDoubleJump = true; // Mark double jump as used
            // Play jump sound
            playSound(jumpSound);
        }
        
        // Variable jump height (cut jump short if button released)
        if (this.isJumping && this.sprite.velocity.y < 0) {
            if (!isKeyDownFor('jump')) {
                this.sprite.velocity.y *= this.jumpCutoff;
                this.isJumping = false;
            }
        }
        
        // Apply gravity
        if (!this.onGround) {
            this.sprite.velocity.y += 0.8; // Slightly stronger gravity for snappier feel
        }
        
        // Hollow Knight-style movement with different air/ground physics
        let currentAcceleration = this.onGround ? this.acceleration : this.airAcceleration;
        let currentMaxSpeed = this.maxSpeed; // Cap air speed to ground speed
        
        // Reset horizontal momentum when just landed on a platform
        if (this.justLanded) {
            // this.sprite.velocity.x = 0; // Do not reset horizontal speed on landing
            this.justLanded = false;
        }
        
        if (isKeyDownFor('left')) {
            this.sprite.velocity.x -= currentAcceleration;
            if (this.sprite.velocity.x < -currentMaxSpeed) {
                this.sprite.velocity.x = -currentMaxSpeed;
            }
            this.facingDirection = -1;
        } else if (isKeyDownFor('right')) {
            this.sprite.velocity.x += currentAcceleration;
            if (this.sprite.velocity.x > currentMaxSpeed) {
                this.sprite.velocity.x = currentMaxSpeed;
            }
            this.facingDirection = 1;
        } else {
            // Apply friction when no keys are pressed
            this.sprite.velocity.x *= this.sprite.friction;
            // Stop completely if velocity is very small
            if (Math.abs(this.sprite.velocity.x) < 0.1) {
                this.sprite.velocity.x = 0;
            }
        }
        // Clamp horizontal velocity to maxSpeed in all cases
        if (this.sprite.velocity.x > this.maxSpeed) this.sprite.velocity.x = this.maxSpeed;
        if (this.sprite.velocity.x < -this.maxSpeed) this.sprite.velocity.x = -this.maxSpeed;
        
        // Update position manually if not using p5.play
        if (!this.sprite.update) {
            this.sprite.x += this.sprite.velocity.x;
            this.sprite.y += this.sprite.velocity.y;
        }
        
        // Keep player in bounds
        if (this.sprite.x < 0) {
            this.sprite.x = 0;
            this.sprite.velocity.x = 0;
        }
        if (this.sprite.x + this.sprite.w > width) {
            this.sprite.x = width - this.sprite.w;
            this.sprite.velocity.x = 0;
        }
        
        // Decrement dash trail timer
        if (this.dashTrailTimer > 0) {
            this.dashTrailTimer--;
            if (this.dashTrailTimer === 0) {
                this.dashTrailStart = null;
                this.dashTrailEnd = null;
            }
        }
    }
    
    startDash() {
        // Determine dash direction based on current input or facing direction
        if (isKeyDownFor('left')) {
            this.dashDirection = -1;
        } else if (isKeyDownFor('right')) {
            this.dashDirection = 1;
        } else {
            this.dashDirection = this.facingDirection;
        }
        this.isDashing = true;
        this.dashStartX = this.sprite.x;
        this.dashTargetX = this.sprite.x + this.dashDirection * this.dashDistance;
        // Clamp target to screen bounds
        if (this.dashTargetX < 0) this.dashTargetX = 0;
        if (this.dashTargetX + this.sprite.w > width) this.dashTargetX = width - this.sprite.w;
        this.dashElapsed = 0;
        console.log('Smooth dash started! Direction:', this.dashDirection, 'Distance:', this.dashDistance);
    }
    

    
    startAttack() {
        this.isAttacking = true;
        this.attackFrameCount = 0;
        // Directional attack logic
        if (isKeyDownFor('up')) {
            this.attackDirection = 2; // Up
        } else if (isKeyDownFor('down')) {
            this.attackDirection = 3; // Down
        } else {
            this.attackDirection = this.facingDirection > 0 ? 0 : 1; // 0=right, 1=left
        }
        // Play attack sound
        playSound(attackSound);
        console.log('Attack started! Direction:', this.attackDirection);
    }
    
    checkAttackCollision(enemy) {
        let centerX = this.sprite.x + this.sprite.w / 2;
        let centerY = this.sprite.y + this.sprite.h / 2;
        let attackRange = this.attackRange;
        
        // Calculate attack area based on direction
        let attackX, attackY, attackW, attackH;
        
        switch (this.attackDirection) {
            case 0: // Right
                attackX = centerX + this.sprite.w/2;
                attackY = centerY - attackRange/2;
                attackW = attackRange;
                attackH = attackRange;
                break;
            case 1: // Left
                attackX = centerX - this.sprite.w/2 - attackRange;
                attackY = centerY - attackRange/2;
                attackW = attackRange;
                attackH = attackRange;
                break;
            case 2: // Up
                attackX = centerX - attackRange/2;
                attackY = centerY - this.sprite.h/2 - attackRange;
                attackW = attackRange;
                attackH = attackRange;
                break;
            case 3: // Down
                attackX = centerX - attackRange/2;
                attackY = centerY + this.sprite.h/2;
                attackW = attackRange;
                attackH = attackRange;
                break;
        }
        
        // Check if enemy is in attack area
        return (
            enemy.x < attackX + attackW &&
            enemy.x + enemy.w > attackX &&
            enemy.y < attackY + attackH &&
            enemy.y + enemy.h > attackY
        );
    }
    
    draw() {
        console.log('Drawing player at:', this.sprite.x, this.sprite.y);
        
        // Check if we have any sprites loaded
        let hasSprites = playerIdleFrames[0] && playerLeftFrames[0] && playerRightFrames[0];
        console.log('Has sprites loaded:', hasSprites);
        console.log('Sprite arrays:', {idle: playerIdleFrames, left: playerLeftFrames, right: playerRightFrames});
        
        if (!hasSprites) {
            // Use fallback if no sprites are loaded
            console.log('Using fallback character drawing');
            this.drawFallback();
            return;
        }
        
        // Determine which sprite to use based on movement and direction
        let currentFrame = 0;
        let spriteToUse = null;
        
        // Update idle animation if player is not moving and on ground
        if (!this.isMoving && this.onGround && Math.abs(this.sprite.velocity.x) < 0.1 && !this.isDashing) {
            let currentTime = millis();
            if (currentTime - lastFrameChange > frameInterval) {
                currentIdleFrame = (currentIdleFrame + 1) % 2;
                lastFrameChange = currentTime;
            }
            spriteToUse = playerIdleFrames[currentIdleFrame];
            console.log('Using idle sprite');
        } else if (this.isMoving || Math.abs(this.sprite.velocity.x) > 0.1) {
            // Use directional sprites when moving
            if (this.facingDirection > 0) {
                spriteToUse = playerRightFrames[0]; // Use first right frame for movement
                console.log('Using right sprite');
            } else {
                spriteToUse = playerLeftFrames[0]; // Use first left frame for movement
                console.log('Using left sprite');
            }
        } else {
            // Use idle frame when not moving
            spriteToUse = playerIdleFrames[0];
            console.log('Using default idle sprite');
        }
        
        // Draw the appropriate sprite
        if (spriteToUse) {
            console.log('Drawing sprite at:', this.sprite.x, this.sprite.y, 'size:', this.sprite.w, this.sprite.h);
            image(spriteToUse, this.sprite.x, this.sprite.y, this.sprite.w, this.sprite.h);
        } else {
            // Fallback to geometric shape if image not loaded
            console.log('Sprite not loaded, using fallback');
            this.drawFallback();
        }
        
        // Draw dash effect
        if (this.isDashing) {
            this.drawDashEffect();
        }
        
        // Draw attack effect
        if (this.isAttacking) {
            this.drawAttackEffect();
        }
    }
    
    drawDashEffect() {
        // Draw dash trail effect (old ellipses)
        push();
        stroke(255, 255, 255, 100);
        strokeWeight(3);
        noFill();
        for (let i = 0; i < 3; i++) {
            let trailX = this.sprite.x - (i * 10 * this.dashDirection);
            let trailY = this.sprite.y + this.sprite.h/2;
            ellipse(trailX, trailY, 20 - i * 5, 20 - i * 5);
        }
        pop();
        // Draw dash line effect
        if (this.dashTrailTimer > 0 && this.dashTrailStart && this.dashTrailEnd) {
            push();
            stroke(0, 200, 255, map(this.dashTrailTimer, 0, this.dashTrailDuration, 0, 180));
            strokeWeight(8);
            line(this.dashTrailStart.x, this.dashTrailStart.y, this.dashTrailEnd.x, this.dashTrailEnd.y);
            pop();
        }
    }
    
    drawAttackEffect() {
        // Draw arc attack effect based on direction
        push();
        stroke(255, 0, 0); // Red attack color
        strokeWeight(4);
        noFill();
        let centerX = this.sprite.x + this.sprite.w / 2;
        let centerY = this.sprite.y + this.sprite.h / 2;
        let attackSize = 40;
        // Calculate swipe progress (0 to 1) based on attack frame
        let swipeProgress = this.attackFrameCount / this.attackDuration;
        
        if (this.attackDirection === 0) { // Right
            let arcRadius = attackSize * swipeProgress;
            arc(centerX + this.sprite.w/2, centerY, arcRadius, arcRadius, -PI/3, PI/3);
        } else if (this.attackDirection === 1) { // Left
            let arcRadius = attackSize * swipeProgress;
            arc(centerX - this.sprite.w/2, centerY, arcRadius, arcRadius, 2*PI/3, 4*PI/3);
        } else if (this.attackDirection === 2) { // Up
            let arcRadius = attackSize * swipeProgress;
            arc(centerX, this.sprite.y, arcRadius, arcRadius, -PI, 0);
        } else if (this.attackDirection === 3) { // Down
            let arcRadius = attackSize * swipeProgress;
            arc(centerX, this.sprite.y + this.sprite.h, arcRadius, arcRadius, 0, PI);
        }
        pop();
    }
    
    drawFallback() {
        // Fallback drawing method if images aren't loaded
        fill(this.color[0], this.color[1], this.color[2]);
        stroke(0);
        strokeWeight(3);
        rect(this.sprite.x, this.sprite.y, this.sprite.w, this.sprite.h);
        
        // Draw eyes
        fill(255);
        ellipse(this.sprite.x + 12, this.sprite.y + 15, 8, 8);
        ellipse(this.sprite.x + 28, this.sprite.y + 15, 8, 8);
        fill(0);
        ellipse(this.sprite.x + 12, this.sprite.y + 15, 4, 4);
        ellipse(this.sprite.x + 28, this.sprite.y + 15, 4, 4);
    }
}

// Platform class
class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = 0; // Will be set when spawned
        this.health = 1; // Health points (set to 1)
        this.attackCooldown = 0;
        this.attackCooldownMax = 60; // Frames between attacks
        this.attackRange = 40; // Attack range
        this.attackDamage = 1; // Damage dealt to other enemies
    }
    
    update() {
        this.x += this.speed;
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        // Attack white enemies if cooldown is ready
        if (this.attackCooldown <= 0) {
            for (let i = whiteEnemies.length - 1; i >= 0; i--) {
                let whiteEnemy = whiteEnemies[i];
                let distance = Math.abs(this.x - whiteEnemy.x);
                if (distance < this.attackRange) {
                    whiteEnemy.takeDamage(this.attackDamage);
                    this.attackCooldown = this.attackCooldownMax;
                    console.log('Yellow enemy attacked white enemy! Distance:', distance, 'Range:', this.attackRange);
                    break;
                }
            }
        }
        // Debug: log enemy positions and attack attempts
        if (this.attackCooldown <= 0 && whiteEnemies.length > 0) {
            let closestWhiteEnemy = whiteEnemies[0];
            let closestDistance = Math.abs(this.x - closestWhiteEnemy.x);
            console.log('Yellow enemy at', this.x, 'closest white enemy at', closestWhiteEnemy.x, 'distance:', closestDistance, 'attack range:', this.attackRange);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        console.log('Yellow enemy took damage! Health:', this.health);
        if (this.health <= 0) {
            let index = enemies.indexOf(this);
            if (index > -1) {
                enemies.splice(index, 1);
                console.log('Yellow enemy defeated!');
            }
        }
    }
    
    draw() {
        // Draw yellow square enemy
        fill(255, 255, 0); // Yellow color
        stroke(255, 165, 0); // Orange border
        strokeWeight(2);
        rect(this.x, this.y, this.w, this.h);
        
        // Draw bigger eyes for larger enemy
        fill(0); // Black eyes
        noStroke();
        ellipse(this.x + 10, this.y + 12, 6, 6); // Left eye
        ellipse(this.x + this.w - 10, this.y + 12, 6, 6); // Right eye
        
        // Add a bigger mouth
        fill(0);
        rect(this.x + 12, this.y + 22, this.w - 24, 3);
    }
}

function resetGame() {
    obstacles = [];
    spikes = [];
    enemies = [];
    flyingEnemies = [];
    whiteEnemies = [];
    timeSurvived = 0;
    spawnTimer = 0;
    currentScreen = 0; // Start with spikes screen
    screenTransitioned = false;
    screenStartTime = null;

    // Place player on the ground
    player = new Player(80, GROUND_Y - 75); // 75 = player height
    // Reset dash state
    player.isDashing = false;
    player.canDash = true;
    player.dashCooldown = 0;
    player.dashTrailTimer = 0;
    player.dashTrailStart = null;
    player.dashTrailEnd = null;
    gameStartTime = null; // Will be set on first frame of playing
    
    // Add initial enemies for the first screen
    addInitialEnemiesForScreen();
}

function resetCurrentScreen() {
    // Clear all enemies and obstacles for current screen
    enemies = [];
    flyingEnemies = [];
    whiteEnemies = [];
    obstacles = [];
    spikes = [];
    
    // Reset player position to left side of current screen
    if (player) {
        player.sprite.x = 80;
        player.sprite.y = GROUND_Y - 75;
        player.sprite.velocity.x = 0;
        player.sprite.velocity.y = 0;
        // Reset dash state
        player.isDashing = false;
        player.canDash = true;
        player.dashCooldown = 0;
        player.dashTrailTimer = 0;
        player.dashTrailStart = null;
        player.dashTrailEnd = null;
    }
    
    // Reset spawn timer
    spawnTimer = 0;
    
    // Add initial enemies for the current screen
    addInitialEnemiesForScreen();
    
    console.log('Screen reset for screen:', currentScreen);
}

function updateUIScore() {
    let scoreElem = document.getElementById('level-value');
    if (scoreElem) {
        scoreElem.textContent = timeSurvived.toFixed(2);
    }
    
    // Update screen information in UI
    const screenInfo = getScreenInfo();
    let levelElem = document.getElementById('level');
    if (levelElem) {
        levelElem.innerHTML = `Level ${currentLevel} - Screen ${screenInfo.current + 1}/4: ${screenInfo.name} | Time: <span id="level-value">${timeSurvived.toFixed(2)}</span>`;
    }
}

// --- SPIKE CLASS ---
class Spike {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = 0; // Will be set when spawned
    }
    
    update() {
        this.x += this.speed;
    }
    
    draw() {
        // Draw triangle spike
        fill(255, 0, 0); // Red color
        stroke(139, 0, 0); // Dark red border
        strokeWeight(2);
        
        // Draw triangle pointing up
        triangle(
            this.x + this.w/2, this.y, // Top point
            this.x, this.y + this.h, // Bottom left
            this.x + this.w, this.y + this.h // Bottom right
        );
    }
}

// --- OBSTACLE CLASS ---
class Obstacle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = 0; // Will be set when spawned
    }
    
    update() {
        this.x += this.speed;
    }
    
    draw() {
        // Draw visible gray platform
        fill(120, 120, 120); // Gray color
        stroke(60, 60, 60); // Darker gray border
        strokeWeight(2);
        rect(this.x, this.y, this.w, this.h);
        // Add subtle shadow for depth
        fill(180, 180, 180);
        rect(this.x + 2, this.y + 2, this.w - 4, this.h - 4);
    }
}

// --- FLYING ENEMY CLASS ---
class FlyingEnemy {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.startY = y;
        this.time = 0;
        this.amplitude = 50; // How far up/down it moves
        this.frequency = 0.02; // How fast it moves
        this.speed = 0; // Horizontal speed
    }
    
    update() {
        this.time += 1;
        // Move in a sine wave pattern vertically
        this.y = this.startY + Math.sin(this.time * this.frequency) * this.amplitude;
        // Move horizontally
        this.x += this.speed;
    }
    
    draw() {
        // Draw flying enemy (light blue square with face)
        fill(135, 206, 235); // Light blue color
        stroke(70, 130, 180); // Steel blue border
        strokeWeight(2);
        rect(this.x, this.y, this.w, this.h);
        
        // Draw bigger eyes for larger flying enemy
        fill(0); // Black eyes
        noStroke();
        ellipse(this.x + 12, this.y + 12, 6, 6); // Left eye
        ellipse(this.x + this.w - 12, this.y + 12, 6, 6); // Right eye
        
        // Draw bigger mouth
        fill(0);
        rect(this.x + 12, this.y + this.h - 18, this.w - 24, 3);
    }
}

// --- WHITE ENEMY CLASS ---
class WhiteEnemy {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = 0; // Will be set when spawned
        this.baseSpeed = 1.5; // Base movement speed
        this.followSpeed = 0.8; // Speed when following player
        this.health = 1; // Health points (set to 1)
        this.attackCooldown = 0;
        this.attackCooldownMax = 60; // Frames between attacks
        this.attackRange = 40; // Attack range
        this.attackDamage = 1; // Damage dealt to other enemies
    }
    
    update() {
        if (!player) return;
        // Always detect player from anywhere and move towards them
        if (this.x < player.sprite.x) {
            this.x += this.followSpeed;
        } else if (this.x > player.sprite.x) {
            this.x -= this.followSpeed;
        }
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        // Attack yellow enemies if cooldown is ready
        if (this.attackCooldown <= 0) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                let yellowEnemy = enemies[i];
                let distance = Math.abs(this.x - yellowEnemy.x);
                if (distance < this.attackRange) {
                    yellowEnemy.takeDamage(this.attackDamage);
                    this.attackCooldown = this.attackCooldownMax;
                    console.log('White enemy attacked yellow enemy! Distance:', distance, 'Range:', this.attackRange);
                    break;
                }
            }
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        console.log('White enemy took damage! Health:', this.health);
        if (this.health <= 0) {
            let index = whiteEnemies.indexOf(this);
            if (index > -1) {
                whiteEnemies.splice(index, 1);
                console.log('White enemy defeated!');
            }
        }
    }
    
    draw() {
        // Draw white square enemy
        fill(255);
        stroke(180, 180, 180);
        strokeWeight(2);
        rect(this.x, this.y, this.w, this.h);
        // Eyes
        fill(0);
        ellipse(this.x + 10, this.y + 12, 6, 6);
        ellipse(this.x + this.w - 10, this.y + 12, 6, 6);
        // Mouth
        rect(this.x + 12, this.y + 22, this.w - 24, 3);
    }
}

function setKeyBinding(action, key) {
    keyBindings[action] = [key];
    updateKeyBindingButtons();
}

function resetToDefaultKeyBindings() {
    console.log('Resetting key bindings to default...');
    keyBindings = {...defaultKeyBindings};
    updateKeyBindingButtons();
    console.log('Key bindings reset to default');
}

function updateKeyBindingButtons() {
    const keyToActions = {};
    // Build a map of key -> [actions]
    Object.entries(keyBindings).forEach(([action, keys]) => {
        keys.forEach(key => {
            if (!keyToActions[key]) keyToActions[key] = [];
            keyToActions[key].push(action);
        });
    });
    // Update button text and color
    const btns = [
        {id: 'bind-move-left', action: 'left'},
        {id: 'bind-move-right', action: 'right'},
        {id: 'bind-jump', action: 'jump'},
        {id: 'bind-dash', action: 'dash'},
        {id: 'bind-attack', action: 'attack'},
        {id: 'bind-look-up', action: 'lookUp'},
        {id: 'bind-look-down', action: 'lookDown'},
    ];
    btns.forEach(({id, action}) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        let key = keyBindings[action] ? keyBindings[action][0] : 'A'; // Fallback to 'A' if not set
        let label;
        if (key === ' ') {
            label = 'Space';
        } else if (key === 'Mouse0') {
            label = 'LMB';
        } else if (key === 'Mouse1') {
            label = 'RMB';
        } else if (key === 'Mouse2') {
            label = 'MMB';
        } else if (key.startsWith('Mouse')) {
            label = 'Mouse' + key.slice(5);
        } else {
            label = key;
        }
        btn.textContent = label.toUpperCase();
        // Check for duplicate, but allow up/lookUp and down/lookDown to share keys
        let isDuplicate = false;
        if (keyToActions[key] && keyToActions[key].length > 1) {
            // Allow up/lookUp and down/lookDown to share keys
            const allowedPairs = [
                ['up', 'lookUp'],
                ['lookUp', 'up'],
                ['down', 'lookDown'],
                ['lookDown', 'down'],
            ];
            const actionsForKey = keyToActions[key];
            if (!(
                actionsForKey.length === 2 &&
                allowedPairs.some(([a, b]) => actionsForKey.includes(a) && actionsForKey.includes(b))
            )) {
                isDuplicate = true;
            }
        }
        btn.style.color = isDuplicate ? 'red' : 'white';
    });
}

function setupKeyBindingUI() {
    console.log('Setting up key binding UI...');
    const actions = [
        {id: 'bind-move-left', action: 'left'},
        {id: 'bind-move-right', action: 'right'},
        {id: 'bind-jump', action: 'jump'},
        {id: 'bind-dash', action: 'dash'},
        {id: 'bind-attack', action: 'attack'},
        {id: 'bind-look-up', action: 'lookUp'},
        {id: 'bind-look-down', action: 'lookDown'},
    ];
    actions.forEach(({id, action}) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                if (bindingAction && bindingAction === action) {
                    // If this button is already active, register the click as the binding
                    let mouseBtn = 'Mouse0'; // Left mouse button
                    setKeyBinding(bindingAction, mouseBtn);
                    document.querySelectorAll('.key-bind-btn').forEach(btn => btn.classList.remove('active'));
                    bindingAction = null;
                    updateKeyBindingButtons();
                    return;
                }
                
                bindingAction = action;
                bindingButtonClicked = true; // Set flag to prevent this click from being registered
                btn.classList.add('active');
                btn.textContent = 'Press any key';
                // Reset the flag after a short delay
                setTimeout(() => {
                    bindingButtonClicked = false;
                }, 100);
            };
        } else {
            console.warn('Button not found:', id);
        }
    });
    updateKeyBindingButtons();
    
    // Ensure settings screen is still hidden after setup
    const settingsScreen = document.getElementById('settings-screen');
    if (settingsScreen && !settingsScreen.classList.contains('hidden')) {
        console.warn('Settings screen was visible after setup, hiding it...');
        settingsScreen.classList.add('hidden');
    }
    
    console.log('Key binding UI setup complete');
}

document.addEventListener('keydown', function(e) {
    if (bindingAction) {
        let key = e.key;
        if (key === ' ') key = ' ';
        setKeyBinding(bindingAction, key);
        document.querySelectorAll('.key-bind-btn').forEach(btn => btn.classList.remove('active'));
        bindingAction = null;
        updateKeyBindingButtons();
        e.preventDefault();
        return;
    }
    // Track attack key down (only when not paused)
    if (keyBindings.attack && keyBindings.attack.includes(e.key) && !attackKeyDown && !gamePaused) {
        attackKeyDown = true;
    }
});

document.addEventListener('keyup', function(e) {
    // Only trigger attack on keyup
    if (keyBindings.attack && keyBindings.attack.includes(e.key)) {
        attackKeyDown = false;
    }
});

document.addEventListener('mousedown', function(e) {
    // Don't trigger attack if clicking on UI elements
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
        e.target.closest('#pause-button') || e.target.closest('#pause-modal') || 
        e.target.closest('#settings-modal') || e.target.closest('#ui-overlay')) {
        return;
    }
    
    // Track attack mouse down (only when not paused)
    if (keyBindings.attack && keyBindings.attack.includes('Mouse' + e.button) && !attackMouseDown && !gamePaused) {
        attackMouseDown = true;
    }
});

document.addEventListener('mouseup', function(e) {
    // Handle key binding setup on mouseup instead of mousedown
    if (bindingAction && !bindingButtonClicked) {
        let mouseBtn = 'Mouse' + e.button;
        setKeyBinding(bindingAction, mouseBtn);
        document.querySelectorAll('.key-bind-btn').forEach(btn => btn.classList.remove('active'));
        bindingAction = null;
        updateKeyBindingButtons();
        e.preventDefault();
        return;
    }
    // Only trigger attack on mouseup
    if (keyBindings.attack && keyBindings.attack.includes('Mouse' + e.button)) {
        attackMouseDown = false;
    }
});

// --- KEY CHECKING UTILITY ---
function isKeyDownFor(action) {
    if (!keyBindings[action]) return false;
    for (const k of keyBindings[action]) {
        if (k.startsWith('Mouse')) {
            // Mouse buttons handled separately below
            if (k === 'Mouse0' && attackMouseDown) return true;
            continue;
        }
        if (typeof window.keyIsDown === 'function' && window.keyIsDown(k.length === 1 ? k.toUpperCase().charCodeAt(0) : k)) {
            return true;
        }
        // Fallback for space
        if (k === ' ' && (typeof window.keyIsDown === 'function' && window.keyIsDown(32))) {
            return true;
        }
        // Track attack key state
        if (action === 'attack' && attackKeyDown) return true;
    }
    return false;
}

// Helper function to check if a position is too close to existing enemies
function isPositionTooClose(x, y, w, h, minDistance = 60) {
    // Check against yellow enemies
    for (let enemy of enemies) {
        let distance = Math.abs(x - enemy.x);
        if (distance < minDistance) return true;
    }
    
    // Check against white enemies
    for (let whiteEnemy of whiteEnemies) {
        let distance = Math.abs(x - whiteEnemy.x);
        if (distance < minDistance) return true;
    }
    
    // Check against flying enemies (only if they're at similar Y positions)
    for (let flyingEnemy of flyingEnemies) {
        let xDistance = Math.abs(x - flyingEnemy.x);
        let yDistance = Math.abs(y - flyingEnemy.y);
        if (xDistance < minDistance && yDistance < 80) return true;
    }
    
    return false;
}

function spawnRandomEnemy() {
    let spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    let spawnType = Math.floor(Math.random() * 5); // 0-4: enemy, flying enemy, obstacle, spike, white enemy
    
    console.log('Spawning:', {spawnType, spawnSide}); // Debug log
    
    if (spawnType === 0) {
        // Spawn ground enemy
        let w = 40;
        // Spawn on the ground
        let y = GROUND_Y - w;
        let x = spawnSide === 'left' ? 0 : width - w;
        
        // Check if position is too close to existing enemies
        if (!isPositionTooClose(x, y, w, w)) {
            let speed = spawnSide === 'left' ? 2 : -2;
            let enemy = new Enemy(x, y, w, w);
            enemy.speed = speed;
            enemies.push(enemy);
            console.log('Spawned ground enemy at:', x, 'y:', y, 'speed:', speed);
        } else {
            console.log('Skipped spawning ground enemy - too close to existing enemies');
        }
    } else if (spawnType === 1) {
        // Spawn flying enemy
        let w = 45;
        // Fly lower than player's jump height
        let minY = GROUND_Y - JUMP_HEIGHT + 10;
        let maxY = GROUND_Y - w;
        let y = Math.random() * (maxY - minY) + minY;
        let x = spawnSide === 'left' ? 0 : width - w;
        
        // Check if position is too close to existing enemies
        if (!isPositionTooClose(x, y, w, w)) {
            let speed = spawnSide === 'left' ? 1.5 : -1.5;
            let flyingEnemy = new FlyingEnemy(x, y, w, w);
            flyingEnemy.speed = speed;
            flyingEnemies.push(flyingEnemy);
            console.log('Spawned flying enemy at:', x, y, 'speed:', speed);
        } else {
            console.log('Skipped spawning flying enemy - too close to existing enemies');
        }
    } else if (spawnType === 2) {
        // Spawn obstacle
        let w = 50;
        let x = spawnSide === 'left' ? 0 : width - w;
        let height = Math.random() * 60 + 40; // Random height 40-100
        let obstacle = new Obstacle(x, GROUND_Y - height, w, height);
        obstacle.speed = spawnSide === 'left' ? 1 : -1;
        obstacles.push(obstacle);
        console.log('Spawned obstacle at:', x, 'height:', height, 'speed:', obstacle.speed);
    } else if (spawnType === 3) {
        // Spawn spike
        let x = spawnSide === 'left' ? -30 : width + 30;
        let spike = new Spike(x, GROUND_Y - 30, 30, 30);
        spike.speed = spawnSide === 'left' ? 1.5 : -1.5;
        spikes.push(spike);
        console.log('Spawned spike at:', x, 'speed:', spike.speed);
    } else if (spawnType === 4) {
        // Spawn white enemy
        let w = 40;
        let y = GROUND_Y - w;
        let x = spawnSide === 'left' ? 0 : width - w;
        
        // Check if position is too close to existing enemies
        if (!isPositionTooClose(x, y, w, w)) {
            let speed = spawnSide === 'left' ? 2 : -2;
            let enemy = new WhiteEnemy(x, y, w, w);
            enemy.speed = speed;
            whiteEnemies.push(enemy);
            console.log('Spawned white enemy at:', x, 'y:', y, 'speed:', speed);
        } else {
            console.log('Skipped spawning white enemy - too close to existing enemies');
        }
    }
    
    // Debug: log current counts
    console.log('Current objects:', {
        enemies: enemies.length,
        flyingEnemies: flyingEnemies.length,
        obstacles: obstacles.length,
        spikes: spikes.length
    });
}

// --- SCREEN SYSTEM FUNCTIONS ---

// --- LEVEL SYSTEM ---
const LEVEL_CONFIGS = {
    1: {
        name: "Tutorial",
        screens: {
            0: { name: "Spikes", spawnFunction: spawnLevel1Screen0 },
            1: { name: "Yellow Enemies", spawnFunction: spawnLevel1Screen1 },
            2: { name: "Blue Enemies", spawnFunction: spawnLevel1Screen2 },
            3: { name: "White Enemies", spawnFunction: spawnLevel1Screen3 }
        }
    },
    2: {
        name: "Beginner",
        screens: {
            0: { name: "Empty", spawnFunction: spawnLevel2Screen0 },
            1: { name: "Empty", spawnFunction: spawnLevel2Screen1 },
            2: { name: "Empty", spawnFunction: spawnLevel2Screen2 },
            3: { name: "Empty", spawnFunction: spawnLevel2Screen3 }
        }
    },
    3: {
        name: "Intermediate",
        screens: {
            0: { name: "Empty", spawnFunction: spawnLevel3Screen0 },
            1: { name: "Empty", spawnFunction: spawnLevel3Screen1 },
            2: { name: "Empty", spawnFunction: spawnLevel3Screen2 },
            3: { name: "Empty", spawnFunction: spawnLevel3Screen3 }
        }
    },
    4: {
        name: "Advanced",
        screens: {
            0: { name: "Empty", spawnFunction: spawnLevel4Screen0 },
            1: { name: "Empty", spawnFunction: spawnLevel4Screen1 },
            2: { name: "Empty", spawnFunction: spawnLevel4Screen2 },
            3: { name: "Empty", spawnFunction: spawnLevel4Screen3 }
        }
    },
    5: {
        name: "Expert",
        screens: {
            0: { name: "Empty", spawnFunction: spawnLevel5Screen0 },
            1: { name: "Empty", spawnFunction: spawnLevel5Screen1 },
            2: { name: "Empty", spawnFunction: spawnLevel5Screen2 },
            3: { name: "Empty", spawnFunction: spawnLevel5Screen3 }
        }
    },
    6: {
        name: "Master",
        screens: {
            0: { name: "Empty", spawnFunction: spawnLevel6Screen0 },
            1: { name: "Empty", spawnFunction: spawnLevel6Screen1 },
            2: { name: "Empty", spawnFunction: spawnLevel6Screen2 },
            3: { name: "Empty", spawnFunction: spawnLevel6Screen3 }
        }
    }
};

function spawnScreenSpecificEnemy() {
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    if (!levelConfig || !levelConfig.screens[currentScreen]) {
        return; // No configuration for this level/screen
    }
    
    // Call the specific spawn function for this level and screen
    const spawnFunction = levelConfig.screens[currentScreen].spawnFunction;
    if (spawnFunction) {
        spawnFunction();
    }
}

// --- LEVEL 1 SPAWN FUNCTIONS ---
function spawnLevel1Screen0() {
    let spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    let spikeX = spawnSide === 'left' ? -30 : width + 30;
    let spike = new Spike(spikeX, GROUND_Y - 30, 30, 30);
    spike.speed = spawnSide === 'left' ? 1.5 : -1.5;
    spikes.push(spike);
    console.log('Level 1 Screen 0: Spawned spike at:', spikeX);
}

function spawnLevel1Screen1() {
    let spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    let w = 40;
    let y = GROUND_Y - w;
    let x = spawnSide === 'left' ? 0 : width - w;
    
    if (!isPositionTooClose(x, y, w, w)) {
        let speed = spawnSide === 'left' ? 2 : -2;
        let enemy = new Enemy(x, y, w, w);
        enemy.speed = speed;
        enemies.push(enemy);
        console.log('Level 1 Screen 1: Spawned yellow enemy at:', x, 'y:', y, 'speed:', speed);
    }
    
    // Also spawn white enemies (50% chance)
    if (Math.random() < 0.5) {
        let whiteX = spawnSide === 'left' ? 50 : width - w - 50;
        if (!isPositionTooClose(whiteX, y, w, w)) {
            let whiteSpeed = spawnSide === 'left' ? 1.5 : -1.5;
            let whiteEnemy = new WhiteEnemy(whiteX, y, w, w);
            whiteEnemy.speed = whiteSpeed;
            whiteEnemies.push(whiteEnemy);
            console.log('Level 1 Screen 1: Spawned white enemy at:', whiteX, 'y:', y, 'speed:', whiteSpeed);
        }
    }
}

function spawnLevel1Screen2() {
    let spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    let flyingW = 45;
    let minY = GROUND_Y - JUMP_HEIGHT + 10;
    let maxY = GROUND_Y - flyingW;
    let flyingY = Math.random() * (maxY - minY) + minY;
    let flyingX = spawnSide === 'left' ? 0 : width - flyingW;
    
    if (!isPositionTooClose(flyingX, flyingY, flyingW, flyingW)) {
        let flyingSpeed = spawnSide === 'left' ? 1.5 : -1.5;
        let flyingEnemy = new FlyingEnemy(flyingX, flyingY, flyingW, flyingW);
        flyingEnemy.speed = flyingSpeed;
        flyingEnemies.push(flyingEnemy);
        console.log('Level 1 Screen 2: Spawned blue enemy at:', flyingX, flyingY, 'speed:', flyingSpeed);
    }
}

function spawnLevel1Screen3() {
    let spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    let whiteW = 40;
    let whiteY = GROUND_Y - whiteW;
    let whiteX = spawnSide === 'left' ? 0 : width - whiteW;
    
    if (!isPositionTooClose(whiteX, whiteY, whiteW, whiteW)) {
        let whiteSpeed = spawnSide === 'left' ? 2 : -2;
        let whiteEnemy = new WhiteEnemy(whiteX, whiteY, whiteW, whiteW);
        whiteEnemy.speed = whiteSpeed;
        whiteEnemies.push(whiteEnemy);
        console.log('Level 1 Screen 3: Spawned white enemy at:', whiteX, 'y:', whiteY, 'speed:', whiteSpeed);
    }
    
    // Also spawn yellow enemies (50% chance)
    if (Math.random() < 0.5) {
        let yellowX = spawnSide === 'left' ? 50 : width - whiteW - 50;
        if (!isPositionTooClose(yellowX, whiteY, whiteW, whiteW)) {
            let yellowSpeed = spawnSide === 'left' ? 1.5 : -1.5;
            let yellowEnemy = new Enemy(yellowX, whiteY, whiteW, whiteW);
            yellowEnemy.speed = yellowSpeed;
            enemies.push(yellowEnemy);
            console.log('Level 1 Screen 3: Spawned yellow enemy at:', yellowX, 'y:', whiteY, 'speed:', yellowSpeed);
        }
    }
}

// --- LEVEL 2-6 SPAWN FUNCTIONS (EMPTY FOR NOW) ---
function spawnLevel2Screen0() { /* Empty screen */ }
function spawnLevel2Screen1() { /* Empty screen */ }
function spawnLevel2Screen2() { /* Empty screen */ }
function spawnLevel2Screen3() { /* Empty screen */ }

function spawnLevel3Screen0() { /* Empty screen */ }
function spawnLevel3Screen1() { /* Empty screen */ }
function spawnLevel3Screen2() { /* Empty screen */ }
function spawnLevel3Screen3() { /* Empty screen */ }

function spawnLevel4Screen0() { /* Empty screen */ }
function spawnLevel4Screen1() { /* Empty screen */ }
function spawnLevel4Screen2() { /* Empty screen */ }
function spawnLevel4Screen3() { /* Empty screen */ }

function spawnLevel5Screen0() { /* Empty screen */ }
function spawnLevel5Screen1() { /* Empty screen */ }
function spawnLevel5Screen2() { /* Empty screen */ }
function spawnLevel5Screen3() { /* Empty screen */ }

function spawnLevel6Screen0() { /* Empty screen */ }
function spawnLevel6Screen1() { /* Empty screen */ }
function spawnLevel6Screen2() { /* Empty screen */ }
function spawnLevel6Screen3() { /* Empty screen */ }

function transitionToNextScreen() {
    if (screenTransitioned) return; // Prevent multiple transitions
    
    screenTransitioned = true;
    currentScreen++;
    
    // Clear all enemies and obstacles for new screen
    enemies = [];
    flyingEnemies = [];
    whiteEnemies = [];
    obstacles = [];
    spikes = [];
    
    // Reset player position to left side of screen and stop any active dash
    if (player) {
        player.sprite.x = 80;
        player.sprite.y = GROUND_Y - 75;
        player.sprite.velocity.x = 0;
        player.sprite.velocity.y = 0;
        
        // Stop any active dash
        if (player.isDashing) {
            player.isDashing = false;
            player.dashCooldown = player.dashCooldownMax;
            player.canDash = false;
            // Clear dash trail
            player.dashTrailStart = null;
            player.dashTrailEnd = null;
            player.dashTrailTimer = 0;
        }
    }
    
    // Reset spawn timer
    spawnTimer = 0;
    screenStartTime = millis();
    
    console.log('Transitioned to screen:', currentScreen);
    
    // Add initial enemies for the new screen
    addInitialEnemiesForScreen();
    
    // Check if game is complete (all screens finished)
    if (currentScreen >= 4) {
        console.log('All screens completed!');
        showLevelComplete();
        return;
    }
    
    // Reset transition flag after a short delay
    setTimeout(() => {
        screenTransitioned = false;
    }, 1000);
}

function checkScreenTransition() {
    if (!player || screenTransitioned) return;
    
    // Check if player has reached the right edge of the screen
    if (player.sprite.x >= SCREEN_TRANSITION_X) {
        transitionToNextScreen();
    }
}

function getScreenInfo() {
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    if (!levelConfig || !levelConfig.screens[currentScreen]) {
        return {
            current: currentScreen,
            name: 'Unknown',
            total: 4
        };
    }
    
    return {
        current: currentScreen,
        name: levelConfig.screens[currentScreen].name,
        total: 4
    };
}

// --- INITIAL ENEMY PLACEMENT SYSTEM ---
const INITIAL_ENEMY_CONFIGS = {
    1: {
        0: addInitialLevel1Screen0,
        1: addInitialLevel1Screen1,
        2: addInitialLevel1Screen2,
        3: addInitialLevel1Screen3
    },
    2: {
        0: addInitialLevel2Screen0,
        1: addInitialLevel2Screen1,
        2: addInitialLevel2Screen2,
        3: addInitialLevel2Screen3
    },
    3: {
        0: addInitialLevel3Screen0,
        1: addInitialLevel3Screen1,
        2: addInitialLevel3Screen2,
        3: addInitialLevel3Screen3
    },
    4: {
        0: addInitialLevel4Screen0,
        1: addInitialLevel4Screen1,
        2: addInitialLevel4Screen2,
        3: addInitialLevel4Screen3
    },
    5: {
        0: addInitialLevel5Screen0,
        1: addInitialLevel5Screen1,
        2: addInitialLevel5Screen2,
        3: addInitialLevel5Screen3
    },
    6: {
        0: addInitialLevel6Screen0,
        1: addInitialLevel6Screen1,
        2: addInitialLevel6Screen2,
        3: addInitialLevel6Screen3
    }
};

function addInitialEnemiesForScreen() {
    const levelConfig = INITIAL_ENEMY_CONFIGS[currentLevel];
    if (!levelConfig || !levelConfig[currentScreen]) {
        return; // No configuration for this level/screen
    }
    
    // Call the specific initial enemy function for this level and screen
    const initialFunction = levelConfig[currentScreen];
    if (initialFunction) {
        initialFunction();
    }
}

// --- LEVEL 1 INITIAL ENEMY FUNCTIONS ---
function addInitialLevel1Screen0() {
    // Add 2-3 spikes at different positions
    for (let i = 0; i < 3; i++) {
        let x = 300 + i * 200; // Spread spikes across the screen
        let spike = new Spike(x, GROUND_Y - 30, 30, 30);
        spike.speed = 0; // Stationary spikes
        spikes.push(spike);
    }
}

function addInitialLevel1Screen1() {
    // Add 2-3 yellow enemies
    for (let i = 0; i < 3; i++) {
        let x = 400 + i * 150;
        let y = GROUND_Y - 40;
        let enemy = new Enemy(x, y, 40, 40);
        enemy.speed = -1; // Move left
        enemies.push(enemy);
    }
    // Add 2-3 white enemies, spaced further to the right
    for (let i = 0; i < 3; i++) {
        let x = 700 + i * 120; // Start further right than yellow enemies
        let y = GROUND_Y - 40;
        let whiteEnemy = new WhiteEnemy(x, y, 40, 40);
        whiteEnemy.speed = -1.5; // Move left slightly faster
        whiteEnemies.push(whiteEnemy);
    }
}

function addInitialLevel1Screen2() {
    // Add 2-3 blue flying enemies
    for (let i = 0; i < 3; i++) {
        let x = 350 + i * 180;
        let y = GROUND_Y - 120 - (i * 20); // Different heights
        let flyingEnemy = new FlyingEnemy(x, y, 45, 45);
        flyingEnemy.speed = -1.5; // Move left
        flyingEnemies.push(flyingEnemy);
    }
}

function addInitialLevel1Screen3() {
    // Add 2-3 white enemies
    for (let i = 0; i < 3; i++) {
        let x = 450 + i * 160;
        let y = GROUND_Y - 40;
        let whiteEnemy = new WhiteEnemy(x, y, 40, 40);
        whiteEnemy.speed = -2; // Move left faster
        whiteEnemies.push(whiteEnemy);
    }
    // Add 2-3 yellow enemies
    for (let i = 0; i < 3; i++) {
        let x = 500 + i * 140;
        let y = GROUND_Y - 40;
        let yellowEnemy = new Enemy(x, y, 40, 40);
        yellowEnemy.speed = -1.5; // Move left
        enemies.push(yellowEnemy);
    }
}

// --- LEVEL 2-6 INITIAL ENEMY FUNCTIONS (EMPTY FOR NOW) ---
function addInitialLevel2Screen0() { /* Empty screen */ }
function addInitialLevel2Screen1() { /* Empty screen */ }
function addInitialLevel2Screen2() { /* Empty screen */ }
function addInitialLevel2Screen3() { /* Empty screen */ }

function addInitialLevel3Screen0() { /* Empty screen */ }
function addInitialLevel3Screen1() { /* Empty screen */ }
function addInitialLevel3Screen2() { /* Empty screen */ }
function addInitialLevel3Screen3() { /* Empty screen */ }

function addInitialLevel4Screen0() { /* Empty screen */ }
function addInitialLevel4Screen1() { /* Empty screen */ }
function addInitialLevel4Screen2() { /* Empty screen */ }
function addInitialLevel4Screen3() { /* Empty screen */ }

function addInitialLevel5Screen0() { /* Empty screen */ }
function addInitialLevel5Screen1() { /* Empty screen */ }
function addInitialLevel5Screen2() { /* Empty screen */ }
function addInitialLevel5Screen3() { /* Empty screen */ }

function addInitialLevel6Screen0() { /* Empty screen */ }
function addInitialLevel6Screen1() { /* Empty screen */ }
function addInitialLevel6Screen2() { /* Empty screen */ }
function addInitialLevel6Screen3() { /* Empty screen */ } 