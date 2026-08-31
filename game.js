// ===== КЛАСС ПИТОМЦА =====
class Tamagotchi {
    constructor(name, species) {
        this.name = name;
        this.species = species;
        this.age = 0;
        this.weight = 10;
        this.hunger = 100;
        this.happiness = 100;
        this.energy = 100;
        this.health = 100;
        this.cleanliness = 100;
        this.alive = true;
        this.sleeping = false;
        this.sick = false;
        this.createdAt = Date.now();
        this.lastUpdate = Date.now();
    }

    isAlive() {
        return this.alive && this.health > 0;
    }

    getState() {
        if (this.hunger > 80) return 'hungry';
        if (this.happiness < 30) return 'sad';
        if (this.sleeping) return 'sleeping';
        if (this.sick) return 'sick';
        if (this.happiness > 80) return 'happy';
        return 'normal';
    }

    getEmoji() {
        const emojis = {
            cat: {
                hungry: '😻',
                sad: '😿',
                happy: '😸',
                sleeping: '😴',
                sick: '🤒',
                normal: '🐱'
            },
            dog: {
                hungry: '🐶',
                sad: '😢',
                happy: '😄',
                sleeping: '😴',
                sick: '🤒',
                normal: '🐕'
            },
            rabbit: {
                hungry: '🐰',
                sad: '😢',
                happy: '😄',
                sleeping: '😴',
                sick: '🤒',
                normal: '🐰'
            }
        };
        const state = this.getState();
        return emojis[this.species]?.[state] || '🐾';
    }

    updateStats() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // в секундах
        this.lastUpdate = now;

        if (!this.alive) return;

        // Увеличение голода
        this.hunger = Math.max(0, this.hunger - (deltaTime * 2));

        // Снижение счастья если голодный
        if (this.hunger > 60) {
            this.happiness = Math.max(0, this.happiness - (deltaTime * 1));
        }

        // Энергия восстанавливается во время сна
        if (this.sleeping) {
            this.energy = Math.min(100, this.energy + (deltaTime * 3));
            if (this.energy >= 90) {
                this.sleeping = false;
            }
        } else {
            this.energy = Math.max(0, this.energy - (deltaTime * 0.5));
        }

        // Здоровье падает если голодный или не счастлив
        let healthDrain = 0;
        if (this.hunger > 80) healthDrain += 1;
        if (this.happiness < 20) healthDrain += 1;
        if (this.energy < 20) healthDrain += 0.5;

        this.health = Math.max(0, this.health - (healthDrain * deltaTime));

        // Болезнь случайна при плохом здоровье
        if (this.health < 30 && !this.sick && Math.random() < 0.001) {
            this.sick = true;
        }

        if (this.sick) {
            this.health = Math.max(0, this.health - (deltaTime * 1.5));
        }

        // Вес зависит от кормления
        this.weight = 10 + Math.floor((100 - this.hunger) / 10);

        // Возраст в минутах
        this.age = Math.floor((now - this.createdAt) / 60000);

        // Смерть
        if (this.health <= 0) {
            this.alive = false;
        }
    }

    feed() {
        if (!this.alive) return false;
        this.hunger = Math.max(0, this.hunger - 30);
        this.happiness = Math.min(100, this.happiness + 5);
        this.weight = Math.min(20, this.weight + 1);
        return true;
    }

    play() {
        if (!this.alive) return false;
        if (this.energy < 20) {
            return 'tired';
        }
        if (this.hunger > 80) {
            return 'hungry';
        }
        this.happiness = Math.min(100, this.happiness + 15);
        this.energy = Math.max(0, this.energy - 15);
        this.hunger = Math.min(100, this.hunger + 10);
        return true;
    }

    sleep() {
        if (!this.alive) return false;
        this.sleeping = true;
        return true;
    }

    heal() {
        if (!this.alive) return false;
        this.sick = false;
        this.health = Math.min(100, this.health + 40);
        return true;
    }

    clean() {
        if (!this.alive) return false;
        this.cleanliness = 100;
        this.happiness = Math.min(100, this.happiness + 3);
        return true;
    }
}

// ===== ИГРОВОЙ ДВИЖОК =====
let game = null;
let gameLoopInterval = null;
let updateInterval = null;
let selectedCharacter = 'cat';

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showScreen('startScreen');
    updateTime();
    setInterval(updateTime, 1000);
});

function setupEventListeners() {
    // Выбор персонажа
    document.querySelectorAll('.char-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCharacter = card.dataset.char;
        });
    });

    // Начало игры
    document.getElementById('startGameBtn').addEventListener('click', startGame);

    // Кнопки управления
    document.getElementById('feedBtn').addEventListener('click', () => {
        if (game.feed()) {
            showMessage('😋 Nomnom!');
        } else {
            showMessage('❌ Dead');
        }
    });

    document.getElementById('playBtn').addEventListener('click', () => {
        const result = game.play();
        if (result === 'tired') {
            showMessage('😴 Too tired');
        } else if (result === 'hungry') {
            showMessage('😵 Starving!');
        } else if (result) {
            showMessage('😄 Fun!');
        }
    });

    document.getElementById('sleepBtn').addEventListener('click', () => {
        if (game.sleeping) {
            game.sleeping = false;
            showMessage('👀 Awake!');
        } else {
            game.sleep();
            showMessage('💤 Zzz...');
        }
    });

    document.getElementById('healBtn').addEventListener('click', () => {
        if (game.sick) {
            game.heal();
            showMessage('💊 Better!');
        } else if (game.health < 100) {
            game.health = Math.min(100, game.health + 20);
            showMessage('⚕️ Healthy');
        } else {
            showMessage('Already healthy');
        }
    });

    document.getElementById('cleanBtn').addEventListener('click', () => {
        game.clean();
        showMessage('🚿 Clean!');
    });

    document.getElementById('infoBtn').addEventListener('click', () => {
        const stats = `
            NAME: ${game.name}
            AGE: ${game.age}m
            WEIGHT: ${game.weight}
            HEALTH: ${Math.floor(game.health)}%
        `;
        showMessage('Stats shown');
    });

    // Перезапуск после смерти
    document.getElementById('restartBtn').addEventListener('click', () => {
        showScreen('startScreen');
        document.getElementById('petNameInput').value = '';
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    });
}

function startGame() {
    const petName = document.getElementById('petNameInput').value.trim() || 'TAMA';
    
    if (!petName) {
        showMessage('❌ Enter name');
        return;
    }

    game = new Tamagotchi(petName, selectedCharacter);
    showScreen('mainScreen');
    
    // Главный игровой цикл
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(() => {
        if (game && game.alive) {
            game.updateStats();
            updateDisplay();
            checkGameState();
        }
    }, 500);
}

function updateDisplay() {
    if (!game) return;

    // Имя питомца
    document.getElementById('petName').textContent = game.name;
    document.getElementById('petAge').textContent = game.age;
    document.getElementById('petWeight').textContent = game.weight;

    // Статус бары
    document.getElementById('hungerBar').style.width = Math.max(0, 100 - game.hunger) + '%';
    document.getElementById('happyBar').style.width = game.happiness + '%';
    document.getElementById('energyBar').style.width = game.energy + '%';

    // Эмодзи питомца
    const petElement = document.getElementById('petAnimation');
    petElement.innerHTML = `<div class="pet-sprite">${game.getEmoji()}</div>`;
    
    // Классы для анимаций
    petElement.classList.remove('hungry', 'sad', 'sleeping', 'sick');
    if (game.sleeping) petElement.classList.add('sleeping');
    if (game.sick) petElement.classList.add('sick');
    if (game.hunger > 80) petElement.classList.add('hungry');
    if (game.happiness < 30) petElement.classList.add('sad');

    // Сообщение статуса
    const messages = [];
    
    if (game.hunger > 80) {
        messages.push('HUNGRY!');
    }
    if (game.happiness < 30) {
        messages.push('SAD');
    }
    if (game.energy < 20) {
        messages.push('TIRED');
    }
    if (game.sick) {
        messages.push('SICK!!!');
    }
    if (game.sleeping) {
        messages.push('SLEEPING');
    }
    
    document.getElementById('statusMessage').textContent = messages.join(' / ') || 'Healthy';
}

function checkGameState() {
    if (!game.alive) {
        const deathReason = game.health <= 0 
            ? (game.hunger > 80 ? 'Starved to death' : 'Died of illness')
            : 'Unknown cause';
        
        document.getElementById('deathName').textContent = game.name;
        document.getElementById('deathAge').textContent = `${game.age}m`;
        document.getElementById('deathMessage').textContent = deathReason;
        
        showScreen('deathScreen');
        if (gameLoopInterval) clearInterval(gameLoopInterval);
    }
}

function showMessage(msg) {
    const msgEl = document.getElementById('statusMessage');
    msgEl.textContent = msg;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('timeDisplay').textContent = `${hours}:${minutes}`;
}

// Сохранение при закрытии
window.addEventListener('beforeunload', () => {
    if (game) {
        localStorage.setItem('tamagotchi_save', JSON.stringify({
            name: game.name,
            species: game.species,
            age: game.age,
            hunger: game.hunger,
            happiness: game.happiness,
            energy: game.energy,
            health: game.health,
            sick: game.sick
        }));
    }
});
