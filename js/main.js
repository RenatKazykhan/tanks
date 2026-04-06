const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const gameInfo = document.getElementById('gameInfo');
gameInfo.style.display = 'none';
gameContainer.style.display = 'none';

// Размеры окна
canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 115;

// Размеры мира
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

// Камера
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

// Мини-карта
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
minimapCanvas.width = 200;
minimapCanvas.height = 200;

// Масштаб мини-карты
const minimapScale = {
    x: minimapCanvas.width / WORLD_WIDTH,
    y: minimapCanvas.height / WORLD_HEIGHT
};


canvas.tabIndex = 1;
canvas.focus();
// Игровые переменные
let score = 0;
let recordScore = 0;
let gameRunning = false;
let points = 0;

// Характеристики танка
const tankStats = {
    health: 300,
    maxHealth: 300,
    speed: 120,
    damage: 30,
    fireRate: 500,
    bulletSpeed: 300,
    regen: 0,
    armor: 0,
    doubleShot: false,
    lifeSteal: 0
};

// Цены улучшений
const upgradeCosts = {
    health: 50,
    maxHealth: 50,
    speed: 50,
    damage: 50,
    fireRate: 50,
    bulletSpeed: 50,
    regen: 50,
    armor: 50,
    lifeSteal: 50
};

// Инициализация игры
const player = new PlayerTank(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, gameOver, tankStats, handleEnergyBlast);
const grassBackground = new GrassBackground();
const updateUIManager = new UpdateUIManager();
const statManager = new StatManager();
const bonusManager = new BonusManager();
const checkCollisionManager = new CheckCollisionManager();
const soundManager = new SoundManager();
const xpManager = new XPManager();
const biomeManager = new BiomeManager();

// Тряска камеры
const cameraShake = {
    intensity: 0,
    decay: 8,
    offsetX: 0,
    offsetY: 0,
    trigger(intensity) {
        this.intensity = Math.max(this.intensity, intensity);
    },
    update(dt) {
        if (this.intensity > 0.1) {
            this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
            this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
            this.intensity *= Math.max(0, 1 - this.decay * dt);
        } else {
            this.intensity = 0;
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }
};

// Красная вспышка при получении урона
let damageFlash = 0;

let enemies = [];
let particles = [];
let keys = {};
let mouseX = 0;
let mouseY = 0;
let enemySpawnTimer = 0;
let enemySpawnInterval = 5000;
let powerUps = [];
let powerUpSpawnTimer = 0;
let walls = [];
let tankIndex = 0;
let regenTimer = 0;
// переменные для отслеживания времени
let lastTime = 0;
let deltaTime = 0;
let isVictory = false;


// Основной игровой цикл
function gameLoop() {
    if (!gameRunning) return;
    const currentTime = performance.now();
    // Вычисляем дельта-время в секундах
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Ограничиваем дельта-время для предотвращения больших скачков
    deltaTime = Math.min(deltaTime, 0.1);

    //ctx.drawImage(grassBackground.backgroundCanvas, 0, 0);

    // Обновление игрока
    player.update(keys, mouseX, mouseY, deltaTime);
    updateUIManager.updateHealthBar();

    // Обновление тряски камеры
    cameraShake.update(deltaTime);

    // Обновление XP
    xpManager.update(deltaTime);
    if (xpManager.checkLevelUp()) {
        bonusManager.showBonusSelection();
    }

    // Затухание красной вспышки
    if (damageFlash > 0) {
        damageFlash = Math.max(0, damageFlash - deltaTime * 4);
    }

    // Спавн врагов
    enemySpawnTimer += deltaTime * 1000;
    if (enemySpawnTimer > enemySpawnInterval) {
        spawnEnemy();
        enemySpawnTimer = 0;
        enemySpawnInterval = Math.max(1000, enemySpawnInterval - 50);
    }

    // Регенерация здоровья игрока
    regenTimer += deltaTime * 1000;
    if (regenTimer > 1000 && player.health < player.maxHealth) {
        player.health += player.regen;
        statManager.healtRestoredRegen += player.regen;
        if (player.health > player.maxHealth) {
            player.health = player.maxHealth;
        }
        regenTimer = 0;
    }

    // Обновление бонусов
    powerUps = powerUps.filter(powerUp => {
        if (Math.sqrt(Math.pow(player.x - powerUp.x, 2) + Math.pow(player.y - powerUp.y, 2)) < 30) {
            // Вместо прямого применения эффекта показываем выбор
            bonusManager.showBonusSelection();
            return false;
        }
        return true;
    });

    // Обновление врагов
    enemies = enemies.filter(enemy => {
        if (enemy.active) {
            enemy.update(player.x, player.y, deltaTime, player.bullets, walls);

            // Проверка столкновений пуль игрока с врагами
            player.bullets.forEach(bullet => {
                if (bullet.active && checkCollisionManager.checkCollision(bullet, enemy, bullet.radius, enemy.width / 2)) {
                    enemy.takeDamage(bullet.damage);

                    if (player.lifeSteal > 0) {
                        player.health = Math.min(player.maxHealth, player.health + bullet.damage * player.lifeSteal);
                    }
                    statManager.healthRestoredLifeSteal += bullet.damage * player.lifeSteal;
                    statManager.damageByBullet += bullet.damage;
                    statManager.hits++;
                    bullet.active = false;

                    if (!enemy.active) {
                        enemyDead(enemy.x, enemy.y);
                    }
                }
            });

            // Проверка столкновений пуль врагов с игроком
            enemy.bullets.forEach(bullet => {
                if (bullet.active && checkCollisionManager.checkCollision(bullet, player, bullet.radius, player.width / 2)) {
                    player.takeDamage(bullet.damage, bullet.x, bullet.y);
                    if (bullet.isIceBullet) {
                        player.freeze(1000);
                    }
                    if (bullet.isPoisonous) {
                        player.applyPoison(bullet.poisonDamage, bullet.poisonDuration, bullet.poisonTickRate)
                    }
                    bullet.active = false;
                    updateUIManager.updateScore();
                }
            });

            return true;
        }
        return false;
    });

    // Проверка столкновений игрока со стенами
    walls.forEach(wall => {
        if (wall.checkCollisionWithRect(player.x, player.y, player.width, player.height)) {
            wall.pushOut(player, player.width, player.height);
        }
    });

    // Проверка столкновений врагов со стенами
    enemies.forEach(enemy => {
        walls.forEach(wall => {
            if (wall.checkCollisionWithRect(enemy.x, enemy.y, enemy.width, enemy.height)) {
                wall.pushOut(enemy, enemy.width, enemy.height);
            }
        });
    });

    // Проверка столкновений пуль игрока со стенами
    player.bullets = player.bullets.filter(bullet => {
        let hitWall = false;
        walls.forEach(wall => {
            if (wall.checkCollisionWithCircle(bullet.x, bullet.y, bullet.radius)) {
                hitWall = true;
            }
        });
        return bullet.active && !hitWall;
    });

    // Проверка столкновений пуль врагов со стенами
    enemies.forEach(enemy => {
        enemy.bullets = enemy.bullets.filter(bullet => {
            let hitWall = false;
            walls.forEach(wall => {
                if (wall.checkCollisionWithCircle(bullet.x, bullet.y, bullet.radius)) {
                    hitWall = true;
                }
            });
            return bullet.active && !hitWall;
        });
    });

    updateCamera();

    // Очистка canvas
    const biome = biomeManager.biomes[biomeManager.currentBiome];
    ctx.fillStyle = biome.baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сохранение контекста для камеры (с тряской)
    ctx.save();
    ctx.translate(-camera.x + cameraShake.offsetX, -camera.y + cameraShake.offsetY);

    // Текстурированный фон биома
    biomeManager.drawBackground();

    // Декорации (под юнитами)
    biomeManager.drawDecorations();

    // Рисование
    enemies.forEach(enemy => enemy.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    walls.forEach(wall => biomeManager.drawWall(wall));
    player.draw();

    // Обновление и отрисовка частиц
    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.life > 0;
    });

    // Атмосферные частицы (снег, песок, угольки)
    biomeManager.drawAmbientParticles();

    drawMinimap();

    ctx.restore();

    // === POST-PROCESSING EFFECTS (поверх мира, в экранных координатах) ===

    // Красная вспышка при уроне
    if (damageFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash * 0.35})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Красная виньетка при низком HP
    const hpRatio = player.health / player.maxHealth;
    if (hpRatio < 0.3 && hpRatio > 0) {
        ctx.save();
        const pulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.15;
        const vignetteAlpha = (1 - hpRatio / 0.3) * pulse;
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(180, 0, 0, ${vignetteAlpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // XP-бар
    xpManager.draw();

    requestAnimationFrame(gameLoop);
}

function updateCamera() {
    // Камера центрируется на игроке
    camera.x = player.x - camera.width / 2;
    camera.y = player.y - camera.height / 2;

    // Не даем камере выйти за границы мира
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - camera.height));
}

function handleEnergyBlast(blastData) {
    // Проверяем попадание по всем врагам
    enemies.forEach(enemy => {
        const dx = enemy.x - blastData.x;
        const dy = enemy.y - blastData.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= blastData.radius) {
            // Наносим урон
            enemy.takeDamage(blastData.damage);
            statManager.damageByExplode += blastData.damage;

            if (!enemy.active) {
                enemyDead(enemy.x, enemy.y); // создает взрывы
            }
        }

        // Уничтожаем вражеские пули в радиусе взрыва
        enemy.bullets.forEach(bullet => {
            const dx = bullet.x - blastData.x;
            const dy = bullet.y - blastData.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance > blastData.radius;
        });
    });
}

function createMapFromLayout(layout) {
    walls = [];
    const cellSize = 60
    // Можно добавить другие типы объектов
    const objects = {
        walls: []
    };

    // Проходим по каждой строке макета
    for (let y = 0; y < layout.length; y++) {
        for (let x = 0; x < layout[y].length; x++) {
            const cell = layout[y][x];
            const posX = x * cellSize;
            const posY = y * cellSize;

            switch (cell) {
                case '#': // Стена
                    walls.push(new Wall(posX + cellSize / 2, posY + cellSize / 2, cellSize, cellSize));
                    break;

                case '-': // Горизонтальная стена
                    walls.push(new Wall(posX + cellSize / 2, posY + cellSize / 2, cellSize * 1.5, cellSize * 0.5));
                    break;

                case '|': // Вертикальная стена
                    walls.push(new Wall(posX + cellSize / 2, posY + cellSize / 2, cellSize * 0.5, cellSize * 1.5));
                    break;

                case 'P': // Начальная позиция игрока
                    player.x = posX + cellSize / 2;
                    player.y = posY + cellSize / 2;
                    break;

                case 'H': // Аптечка
                    powerUps.push(new PowerUp(posX + cellSize / 2, posY + cellSize / 2, 'health'));
                    break;

                case '+': // Маленькая стена (декорация)
                    walls.push(new Wall(posX + cellSize / 2, posY + cellSize / 2, cellSize * 0.6, cellSize * 0.6));
                    break;

                // Можно добавить больше типов объектов
                case ' ': // Пустое пространство
                default:
                    break;
            }
        }
    }

    return objects;
}

// Пример использования с разными макетами
const maps = {
    level1: [
        '                                                           ',
        ' E                                                        E',
        '                      #                                    ',
        '                                                           ',
        '                                                           ',
        '     #   #  #         ####        #        #         ##    ',
        '              #                                            ',
        '       #      #       #   ###               #      #       ',
        '       #      #                     #       #      #       ',
        '                                                           ',
        '   ##                               #      #    #          ',
        '          #    #                           #               ',
        '     E                ###   #### #                   E     ',
        '          #    #                                #          ',
        '                                             #             ',
        '                                                           ',
        '      ###  ##                                   #    ###   ',
        '    #         #                               #        #   ',
        '              #                                        #   ',
        '              #          #      #             #            ',
        '    #         #                                        #   ',
        '      ###  ##                                 ##           ',
        '                                                           ',
        '                                                           ',
        '      ####        ### #                             # ## ##',
        '                         #      #                          ',
        '                                                           ',
        '                         #      #                          ',
        '                                                           ',
        '                            P                              ',
        '                                                           ',
        '                         #      #                          ',
        '                                                           ',
        '                         #      #                          ',
        '  # # # # # ##  ###                 ###  #  #     # ## # ##',
        '                                                           ',
        '                         #      #                          ',
        '    ###      ##                 #             ##      ##   ',
        '                                                           ',
        '                         #                  #              ',
        '                                                       #   ',
        '                                                       #   ',
        '    ####    ###                                ##   #  #   ',
        '                                                           ',
        ' ####                                                ##  ##',
        '          #    #                         #    #            ',
        '     E                #           #                 E      ',
        '          #    #      #           #      #    #            ',
        ' ####     #    #                         #    #      ##  ##',
        '                     #           #                         ',
        '       #      #      #             #       #       #       ',
        '       #      #                             #      #       ',
        '       #      #                             #      #       ',
        '       #      #                                          ##',
        '                                 #                         ',
        '                                                           ',
        '                     ####        ####                      ',
        ' E                                                        E',
        '                                                           '
    ]
};

// Обновленная функция createWalls для использования макетов
function createWalls() {
    // Используем макет вместо ручного создания стен
    const currentMap = maps.level1; // Можно менять на другие карты
    createMapFromLayout(currentMap);
}

// Функция улучшения характеристик
function upgrade(stat) {
    if (points >= upgradeCosts[stat]) {
        points -= upgradeCosts[stat];

        switch (stat) {
            case 'health':
                tankStats.maxHealth += 25;
                tankStats.health = tankStats.maxHealth;
                document.getElementById('healthValue').textContent = tankStats.maxHealth;
                upgradeCosts.health += 50;
                break;
            case 'speed':
                tankStats.speed += 10;
                document.getElementById('speedValue').textContent = tankStats.speed.toFixed(1);
                upgradeCosts.speed += 50;
                break;
            case 'damage':
                tankStats.damage += 5;
                document.getElementById('damageValue').textContent = tankStats.damage;
                upgradeCosts.damage += 50;
                break;
            case 'fireRate':
                tankStats.fireRate = Math.max(100, tankStats.fireRate - 25);
                document.getElementById('fireRateValue').textContent = tankStats.fireRate + 'ms';
                upgradeCosts.fireRate += 50;
                break;
            case 'bulletSpeed':
                tankStats.bulletSpeed += 25;
                document.getElementById('bulletSpeedValue').textContent = tankStats.bulletSpeed;
                upgradeCosts.bulletSpeed += 50;
                break;
            case 'regen':
                tankStats.regen += 1;
                document.getElementById('regenValue').textContent = tankStats.regen;
                upgradeCosts.regen += 50;
                break;
            case 'armor':
                tankStats.armor = Math.min(70, tankStats.armor + 2);;
                document.getElementById('armorValue').textContent = tankStats.armor;
                upgradeCosts.armor += 50;
                break;
            case 'lifeSteal':
                tankStats.lifeSteal = tankStats.lifeSteal + 0.01;
                document.getElementById('lifeStealValue').textContent = tankStats.lifeSteal.toFixed(2) * 100 + '%';
                upgradeCosts.lifeSteal += 50;
                break;
        }

        localStorage.setItem('tankGameStats', JSON.stringify(tankStats));

        updateUIManager.updateUpgradeUI();
    }
}

function enemyDead(x, y) {
    createExplosion(x, y); // создает взрывы
    soundManager.playExplosion();
    score += 50;
    updateUIManager.updateScore(); // обновляет счет на экране
    statManager.kills++;

    // Добавляем XP за убийство
    xpManager.addXP(20 + Math.floor(xpManager.level * 2));

    // Шанс выпадения аптечки при убийстве врага
    if (Math.random() < 0.15) {
        powerUps.push(new PowerUp(x, y, 'health'));
    }
}

// Спавн врагов
function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
        case 0: // сверху
            x = Math.random() * WORLD_WIDTH;
            y = -50;
            break;
        case 1: // справа
            x = WORLD_WIDTH + 50;
            y = Math.random() * WORLD_HEIGHT;
            break;
        case 2: // снизу
            x = Math.random() * WORLD_WIDTH;
            y = WORLD_HEIGHT + 50;
            break;
        case 3: // слева
            x = 50;
            y = Math.random() * WORLD_HEIGHT;
            break;
    }

    // Автоматическая смена биома
    const newBiome = biomeManager.getBiomeForWave(tankIndex);
    biomeManager.setBiome(newBiome);

    if (tankIndex <= 15) {
        document.getElementById('waveValue').textContent = 1;
        enemies.push(new Wave1(x, y));
    }
    else if (tankIndex <= 30) {
        document.getElementById('waveValue').textContent = 2;
        enemies.push(new IceTank(x, y));
    }
    else if (tankIndex <= 45) {
        document.getElementById('waveValue').textContent = 2;
        enemies.push(new SmokeTank(x, y));
    }
    else if (tankIndex <= 60) {
        document.getElementById('waveValue').textContent = 3;
        enemies.push(new BerserkTank(x, y));
    }
    else if (tankIndex <= 75) {
        document.getElementById('waveValue').textContent = 4;
        enemies.push(new KamikazeTank(x, y));
    }
    else if (tankIndex <= 90) {
        document.getElementById('waveValue').textContent = 5;
        enemies.push(new MinerTank(x, y));
    }
    else if (tankIndex <= 105) {
        document.getElementById('waveValue').textContent = 6;
        enemies.push(new TeleportTank(x, y));
    }
    else if (tankIndex <= 120) {
        document.getElementById('waveValue').textContent = 7;
        enemies.push(new ShieldTank(x, y));
    }
    else if (tankIndex <= 135) {
        document.getElementById('waveValue').textContent = 8;
        enemies.push(new SmartTank(x, y));
    }
    else if (tankIndex <= 150) {
        document.getElementById('waveValue').textContent = 9;
        enemies.push(new MachineGunTank(x, y));
    }
    else if (tankIndex <= 170) {
        document.getElementById('waveValue').textContent = 10;
        enemies.push(new HeavyTank(x, y));
        //enemies.push(new PoisonTank(x, y));
    }
    else if (tankIndex <= 190) {
        document.getElementById('waveValue').textContent = 11;
        enemies.push(new RocketTank(x, y));
    }
    else if (tankIndex <= 210) {
        document.getElementById('waveValue').textContent = 12;
        enemies.push(new StrongEnemyTank(x, y));
    }
    else if (tankIndex <= 230) {
        document.getElementById('waveValue').textContent = 13;
        enemies.push(new Sniper(x, y));
    }
    else if (tankIndex <= 240) {
        document.getElementById('waveValue').textContent = 14;
        // пазуа
    }
    else if (tankIndex <= 250) {
        document.getElementById('waveValue').textContent = 15;
        enemies.push(new BossTank(x, y));
    }
    else if (tankIndex > 270 && enemies.length === 0) {
        showVictory();
        gameRunning = false;
    }
    tankIndex++;
}

function startGame() {
    minimapCanvas.style.display = 'block';
    mainMenu.style.display = 'none';
    canvas.style.display = 'block';
    gameContainer.style.display = 'block';
    gameInfo.style.display = 'flex';

    resetGame();
}

function resetGame() {
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('pauseBtn').disabled = false;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.maxHealth = tankStats.maxHealth;
    player.health = tankStats.maxHealth;
    player.speed = tankStats.speed;
    player.damage = tankStats.damage;
    player.shotCooldown = tankStats.fireRate;
    player.bulletSpeed = tankStats.bulletSpeed;
    player.regen = tankStats.regen;
    player.armor = tankStats.armor;
    player.timberSawDamage = tankStats.timberSawDamage;
    player.lifeSteal = tankStats.lifeSteal;
    player.bullets = [];
    player.bodyAngle = 0;
    player.turretAngle = 0;
    player.doubleShot = false;

    // щит
    player.hasShield = false;
    player.shield = 30;
    player.maxShield = 30;
    player.shieldRegenRate = 1; // восстановление в секунду

    // телепорт
    player.canTeleport = false;
    player.teleportCooldown = 10000;
    player.teleportDistance = 200;

    // взрыв
    player.hasEnergyBlast = false;
    player.energyBlastCooldown = 10000;
    player.energyBlastRadius = 150;
    player.energyBlastDamage = 100;

    // быстрая регенерация
    player.hasRegen = false;
    player.rapidRegenDuration = 3000; // 3 секунды
    player.rapidRegenCooldown = 15000; // 15 секунд перезарядка
    player.rapidRegenAmount = 15; // HP в секунду

    // цепная молния
    player.hasChainLightning = false;
    player.chainLightningDamage = 40;
    player.chainLightningCooldown = 10000;
    player.maxChainTargets = 4;
    player.chainLightningBounceRange = 200;

    statManager.reset();
    keys.length = 0;

    document.getElementById('waveValue').textContent = 1;

    enemies = [];
    powerUps = [];
    score = 0;
    enemySpawnTimer = 0;
    enemySpawnInterval = 3000;
    powerUpSpawnTimer = 0;
    tankIndex = 0;
    gameRunning = true;
    damageFlash = 0;
    createWalls();

    biomeManager.currentBiome = 'grass';
    biomeManager.init();

    bonusManager.resetShuffles();
    xpManager.reset();

    updateUIManager.updateScore();
    updateUIManager.updateStatsDisplayMainMenu();
    document.getElementById('gameOver').style.display = 'none';
    lastTime = performance.now();
    soundManager.resume();
    gameLoop();
}

function gameOver() {
    document.getElementById('pauseBtn').disabled = true;
    gameRunning = false;
    points += Math.floor(score / 10);
    statManager.update();
}

function backToMenu() {
    const savedStats = localStorage.getItem('tankGameStats');
    minimapCanvas.style.display = 'none';
    if (savedStats) {
        Object.assign(tankStats, JSON.parse(savedStats));
        updateUIManager.updateStatsDisplayMainMenu();
    }
    // Добавляем очки за текущую игру
    points += Math.floor(score / 20);

    gameRunning = false;
    canvas.style.display = 'none';
    gameContainer.style.display = 'none';
    gameInfo.style.display = 'none';
    mainMenu.style.display = 'block';

    updateUIManager.updateUpgradeUI();;
}

function togglePause() {
    gameRunning = !gameRunning;

    if (!gameRunning) {
        document.getElementById('pauseScreen').style.display = 'flex';
        updateUIManager.updateStatsDisplayInGame();
    } else {
        document.getElementById('pauseScreen').style.display = 'none';
        lastTime = performance.now(); // Сбрасываем время для корректного deltaTime
        requestAnimationFrame(gameLoop); // Возобновляем игровой цикл
    }
}

function createExplosion(x, y, color = '#ff6600') {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Инициализация обработчиков событий
function init() {
    // Загрузка сохраненного прогресса
    const savedPoints = localStorage.getItem('tankGamePoints');
    if (savedPoints) {
        points = parseInt(savedPoints);
    }

    const savedRecord = localStorage.getItem('tankGameRecord');
    if (savedRecord) {
        recordScore = parseInt(savedRecord);
        document.getElementById('recordScoreValue').textContent = recordScore;
    }

    const savedStats = localStorage.getItem('tankGameStats');
    if (savedStats) {
        Object.assign(tankStats, JSON.parse(savedStats));
        updateUIManager.updateStatsDisplayMainMenu();
    }

    const savedCosts = localStorage.getItem('tankGameCosts');
    if (savedCosts) {
        Object.assign(upgradeCosts, JSON.parse(savedCosts));
    }

    updateUIManager.updateUpgradeUI();
    soundManager.init();

    // Инициализируем обработчики событий
    initEventHandlers();
}

function toggleSound() {
    soundManager.enabled = !soundManager.enabled;
    document.getElementById('soundBtn').textContent = soundManager.enabled ? '🔊' : '🔇';
}

// Запуск инициализации после загрузки страницы
document.addEventListener('DOMContentLoaded', init);

// Функция сброса всех характеристик
function resetAllStats() {
    // Сбрасываем характеристики на начальные значения
    tankStats.health = 300;
    tankStats.maxHealth = 300;
    tankStats.speed = 120;
    tankStats.damage = 30;
    tankStats.fireRate = 400;
    tankStats.bulletSpeed = 350;
    tankStats.regen = 0;
    tankStats.armor = 0;
    tankStats.timberSawDamage = 0;
    tankStats.lifeSteal = 0;
    recordScore = 0;
    localStorage.setItem('tankGameRecord', recordScore);
    // сбрасываем цены на улучшения

    for (let key in upgradeCosts) {
        upgradeCosts[key] = 50;
    }
    localStorage.setItem('tankGameStats', JSON.stringify(tankStats));
    updateUIManager.updateUpgradeUI(); // Обновляем интерфейс пользователя
    updateUIManager.updateStatsDisplayMainMenu();
}

function drawMinimap() {
    // Очистка мини-карты
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Рамка мини-карты
    minimapCtx.strokeStyle = '#444';
    minimapCtx.strokeRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Отрисовка игрока
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.beginPath();
    minimapCtx.arc(
        player.x * minimapScale.x,
        player.y * minimapScale.y,
        3,
        0,
        Math.PI * 2
    );
    minimapCtx.fill();

    // Отрисовка врагов
    minimapCtx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        minimapCtx.beginPath();
        minimapCtx.arc(
            enemy.x * minimapScale.x,
            enemy.y * minimapScale.y,
            2,
            0,
            Math.PI * 2
        );
        minimapCtx.fill();
    });

    // Отрисовка бонусов
    minimapCtx.fillStyle = '#ffff00';
    powerUps.forEach(powerUp => {
        minimapCtx.fillRect(
            powerUp.x * minimapScale.x - 1,
            powerUp.y * minimapScale.y - 1,
            2,
            2
        );
    });

    // Отрисовка области видимости камеры
    minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    minimapCtx.strokeRect(
        camera.x * minimapScale.x,
        camera.y * minimapScale.y,
        camera.width * minimapScale.x,
        camera.height * minimapScale.y
    );
}

function showVictory() {
    // Скрываем игровые элементы
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';

    // Показываем экран победы
    document.getElementById('victory').style.display = 'block';
    document.getElementById('victoryScore').textContent = score;

    // Создаем эффект конфетти
    createConfetti();

    // Воспроизводим звук победы (если есть)
    // playVictorySound();
}

function createConfetti() {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    const victory = document.getElementById('victory');

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            victory.appendChild(confetti);

            // Удаляем конфетти после анимации
            setTimeout(() => confetti.remove(), 5000);
        }, i * 100);
    }
}