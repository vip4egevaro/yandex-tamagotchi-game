// Game State
const gameState = {
    character: null,
    petName: 'Питомец',
    hunger: 100,
    happiness: 100,
    energy: 100,
    cleanliness: 100,
    health: 100,
    level: 1,
    experience: 0,
    coins: 0,
    outfit: 'normal',
    isSleeping: false,
    lastEmotion: null,
    gameTime: 0
};

// Constants
const STAT_DECREASE_RATE = {
    hunger: 0.15,
    happiness: 0.1,
    energy: 0.12,
    cleanliness: 0.08
};

const ACTION_EFFECTS = {
    feed: { hunger: 30, cleanliness: -10, coins: -5, exp: 10 },
    play: { happiness: 20, hunger: -15, energy: -20, exp: 15 },
    walk: { happiness: 15, energy: -25, coins: 5, cleanliness: -15, exp: 10 },
    sleep: { energy: 40, hunger: -10 },
    clean: { cleanliness: 40, energy: -10, coins: -3, exp: 8 },
    medicine: { health: 40, coins: -10, exp: 5 }
};

// DOM Elements
const characterSelectScreen = document.getElementById('characterSelectScreen');
const gameScreen = document.getElementById('gameScreen');
const characterCards = document.querySelectorAll('.character-card');
const petSprite = document.getElementById('petSprite');
const emotionDisplay = document.getElementById('emotionDisplay');
const logContainer = document.getElementById('logContainer');
const petNameInput = document.getElementById('petNameInput');
const setNameBtn = document.getElementById('setNameBtn');
const backBtn = document.getElementById('backToCharacterSelect');
const actionButtons = {
    feed: document.getElementById('feedBtn'),
    play: document.getElementById('playBtn'),
    walk: document.getElementById('walkBtn'),
    sleep: document.getElementById('sleepBtn'),
    clean: document.getElementById('cleanBtn'),
    medicine: document.getElementById('medicineBtn')
};

// Event Listeners
characterCards.forEach(card => {
    card.addEventListener('click', selectCharacter);
});

Object.entries(actionButtons).forEach(([action, btn]) => {
    btn.addEventListener('click', () => performAction(action));
});

setNameBtn.addEventListener('click', setPetName);
backBtn.addEventListener('click', backToCharacterSelect);

document.querySelectorAll('.outfit-btn').forEach(btn => {
    btn.addEventListener('click', changeOutfit);
});

petNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setPetName();
});

// Character Selection
function selectCharacter(e) {
    const characterKey = e.currentTarget.getAttribute('data-character');
    gameState.character = characterKey;
    gameState.petName = CHARACTERS[characterKey].name;
    
    characterSelectScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    petNameInput.value = gameState.petName;
    startGameLoop();
}

function backToCharacterSelect() {
    gameState.character = null;
    gameState.hunger = 100;
    gameState.happiness = 100;
    gameState.energy = 100;
    gameState.cleanliness = 100;
    gameState.level = 1;
    gameState.experience = 0;
    gameState.coins = 0;
    gameState.isSleeping = false;
    
    gameScreen.classList.remove('active');
    characterSelectScreen.classList.add('active');
    logContainer.innerHTML = '';
}

// Pet Name
function setPetName() {
    const newName = petNameInput.value.trim();
    if (newName) {
        gameState.petName = newName;
        addLog(`Питомец получил имя: ${newName}! 🎉`);
    }
}

// Main Game Loop
function startGameLoop() {
    setInterval(() => {
        if (gameState.character && !gameState.isSleeping) {
            updateStats();
            updateUI();
            checkGameEvents();
        } else if (gameState.isSleeping) {
            if (gameState.energy < 100) {
                gameState.energy = Math.min(100, gameState.energy + 2);
            } else {
                gameState.isSleeping = false;
                addLog(`${gameState.petName} проснулся! ☀️`);
                updateUI();
            }
        }
    }, 1000);

    updateUI();
}

// Update Stats Over Time
function updateStats() {
    if (!gameState.isSleeping) {
        gameState.hunger = Math.max(0, gameState.hunger - STAT_DECREASE_RATE.hunger);
        gameState.happiness = Math.max(0, gameState.happiness - STAT_DECREASE_RATE.happiness);
        gameState.energy = Math.max(0, gameState.energy - STAT_DECREASE_RATE.energy);
        gameState.cleanliness = Math.max(0, gameState.cleanliness - STAT_DECREASE_RATE.cleanliness);
    }

    // Health decreases if hunger or cleanliness is too low
    if (gameState.hunger < 20 || gameState.cleanliness < 20) {
        gameState.health = Math.max(0, gameState.health - 0.5);
    } else if (gameState.health < 100) {
        gameState.health = Math.min(100, gameState.health + 0.2);
    }
}

// Perform Actions
function performAction(action) {
    if (gameState.isSleeping && action !== 'sleep') {
        addLog(`${gameState.petName} спит... 😴`);
        return;
    }

    const effects = ACTION_EFFECTS[action];
    let canPerform = true;
    let reason = '';

    // Check requirements
    if (action === 'feed' && gameState.hunger > 90) {
        reason = 'Питомец не голоден';
        canPerform = false;
    } else if (action === 'play' && gameState.energy < 30) {
        reason = 'Питомец слишком устал';
        canPerform = false;
    } else if (action === 'walk' && gameState.energy < 40) {
        reason = 'Питомец нуждается в отдыхе';
        canPerform = false;
    } else if (action === 'clean' && gameState.cleanliness > 80) {
        reason = 'Питомец уже чистый';
        canPerform = false;
    } else if (action === 'medicine' && gameState.health > 80) {
        reason = 'Питомец здоров';
        canPerform = false;
    } else if ((action === 'feed' || action === 'clean' || action === 'medicine') && gameState.coins + (effects.coins || 0) < 0) {
        reason = 'Недостаточно монет';
        canPerform = false;
    }

    if (!canPerform) {
        addLog(`❌ ${reason}`);
        return;
    }

    // Apply effects
    Object.entries(effects).forEach(([stat, value]) => {
        if (stat in gameState) {
            gameState[stat] = Math.max(0, Math.min(100, gameState[stat] + value));
        }
    });

    // Add experience and check for level up
    if (effects.exp) {
        gameState.experience += effects.exp;
        if (gameState.experience >= 100) {
            gameState.level++;
            gameState.experience -= 100;
            gameState.coins += 50;
            addLog(`🎉 ${gameState.petName} повысился на уровень ${gameState.level}!`);
        }
    }

    // Show emotion and log
    showEmotion(action);
    showActionMessage(action);
    updateUI();
}

// Show Emotion
function showEmotion(action) {
    const emotions = {
        feed: '😋',
        play: '😄',
        walk: '🌟',
        sleep: '😴',
        clean: '✨',
        medicine: '💚'
    };
    
    emotionDisplay.textContent = emotions[action] || '😊';
    
    setTimeout(() => {
        emotionDisplay.textContent = '';
    }, 2000);
}

// Action Messages
function showActionMessage(action) {
    const messages = {
        feed: `${gameState.petName} с удовольствием поел! 🍖`,
        play: `${gameState.petName} весело играет! 🎮`,
        walk: `${gameState.petName} вернулся с прогулки 🚶`,
        sleep: `${gameState.petName} заснул 😴`,
        clean: `${gameState.petName} чистый и свежий! ✨`,
        medicine: `${gameState.petName} чувствует себя лучше! 💊`
    };
    
    addLog(messages[action]);
}

// Change Outfit
function changeOutfit(e) {
    const outfit = e.target.getAttribute('data-outfit');
    gameState.outfit = outfit;
    
    document.querySelectorAll('.outfit-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    document.getElementById('outfitName').textContent = OUTFIT_NAMES[outfit];
    addLog(`${gameState.petName} надел новый наряд! 👕`);
    updateUI();
}

// Check Game Events
function checkGameEvents() {
    if (gameState.hunger < 20 && Math.random() < 0.05) {
        addLog(`${gameState.petName} очень голоден! 😿`);
    }
    
    if (gameState.happiness < 30 && Math.random() < 0.03) {
        addLog(`${gameState.petName} грустит... 😢`);
    }
    
    if (gameState.energy < 20 && Math.random() < 0.04) {
        addLog(`${gameState.petName} хочет спать... 😴`);
    }
    
    if (gameState.cleanliness < 20 && Math.random() < 0.05) {
        addLog(`${gameState.petName} нуждается в ванне 🛁`);
    }
    
    if (gameState.health < 30 && Math.random() < 0.03) {
        addLog(`${gameState.petName} болен! 🤒`);
    }
}

// Update UI
function updateUI() {
    if (!gameState.character) return;

    // Update pet sprite
    const character = CHARACTERS[gameState.character];
    petSprite.textContent = character.outfits[gameState.outfit];
    petSprite.classList.add('pulse');
    setTimeout(() => petSprite.classList.remove('pulse'), 500);

    // Update stat bars
    updateStatBar('hunger', gameState.hunger);
    updateStatBar('happiness', gameState.happiness);
    updateStatBar('energy', gameState.energy);
    updateStatBar('cleanliness', gameState.cleanliness);

    // Update level and coins
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('expDisplay').textContent = Math.floor(gameState.experience);
    document.getElementById('coinsDisplay').textContent = gameState.coins;

    // Update button states
    updateButtonStates();

    // Show emotion based on stats
    updateCurrentEmotion();
}

function updateStatBar(stat, value) {
    const bar = document.getElementById(stat + 'Bar');
    const valueDisplay = document.getElementById(stat + 'Value');
    bar.style.width = value + '%';
    valueDisplay.textContent = Math.floor(value);
    
    // Change color based on value
    if (value > 60) {
        bar.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
    } else if (value > 30) {
        bar.style.background = 'linear-gradient(90deg, #f0ad4e 0%, #ec971f 100%)';
    } else {
        bar.style.background = 'linear-gradient(90deg, #d9534f 0%, #c9302c 100%)';
    }
}

function updateButtonStates() {
    // Disable buttons based on conditions
    actionButtons.feed.disabled = gameState.hunger > 90 || gameState.coins < 5;
    actionButtons.play.disabled = gameState.energy < 30;
    actionButtons.walk.disabled = gameState.energy < 40;
    actionButtons.clean.disabled = gameState.cleanliness > 80 || gameState.coins < 3;
    actionButtons.medicine.disabled = gameState.health > 80 || gameState.coins < 10;
    actionButtons.sleep.disabled = gameState.isSleeping;
}

function updateCurrentEmotion() {
    const character = CHARACTERS[gameState.character];
    let emotion = 'happy';

    if (gameState.isSleeping) {
        emotion = 'tired';
    } else if (gameState.health < 30) {
        emotion = 'sick';
    } else if (gameState.hunger < 30) {
        emotion = 'hungry';
    } else if (gameState.happiness < 30) {
        emotion = 'sad';
    } else if (gameState.cleanliness < 30) {
        emotion = 'dirty';
    }

    gameState.lastEmotion = emotion;
}

// Logging
function addLog(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    logContainer.insertBefore(logEntry, logContainer.firstChild);
    
    // Keep only last 10 entries
    while (logContainer.children.length > 10) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// Save/Load Game
function saveGame() {
    localStorage.setItem('tamagotchiGameState', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('tamagotchiGameState');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
    }
}

// Auto save
setInterval(saveGame, 5000);

// Load game on start
window.addEventListener('load', loadGame);