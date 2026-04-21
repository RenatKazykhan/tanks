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
const WORLD_WIDTH = 3660;
const WORLD_HEIGHT = 3000;

// Камера
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

canvas.tabIndex = 1;
canvas.focus();

// Игровые переменные
let score = 0;
let recordScore = 0;
let gameRunning = false;
let points = 0;

// Инициализация игры
const player = new PlayerTank(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, gameOver);
const grassBackground = new GrassBackground();
const updateUIManager = new UpdateUIManager();
const statManager = new StatManager();
const bonusManager = new BonusManager();
const checkCollisionManager = new CheckCollisionManager();
const soundManager = new SoundManager();
const xpManager = new XPManager();
const biomeManager = new BiomeManager();
const enemySpawnManager = new EnemySpawnManager(WORLD_WIDTH, WORLD_HEIGHT);
const mapManager = new MapManager(WORLD_WIDTH, WORLD_HEIGHT);
const fogOfWar = new FogOfWar(canvas, 300);
const minimap = new Minimap();
const modules = new ModulesUpgrade();
const visualEffects = new VisualEffects();

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
let keys = {};
let mouseX = 0;
let mouseY = 0;
let powerUps = [];
let powerUpSpawnTimer = 0;
let walls = [];
// переменные для отслеживания времени
let lastTime = 0;
let deltaTime = 0;
let isVictory = false;


// Основной игровой цикл
function gameLoop() {
    if (!gameRunning) {
        if (isVictory) {
            // Если игра окончена победой, не продолжаем цикл
            return;
        }
        return;
    }

    const currentTime = performance.now();
    // Вычисляем дельта-время в секундах
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Ограничиваем дельта-время для предотвращения больших скачков
    deltaTime = Math.min(deltaTime, 0.1);

    // Обновление игрока
    player.update(keys, mouseX, mouseY, deltaTime);
    updateUIManager.updateHealthBar();

    // Обновление тряски камеры
    cameraShake.update(deltaTime);

    // Обновление тумана войны
    fogOfWar.update(player.x, player.y);

    // Обновление XP
    xpManager.update(deltaTime);
    if (xpManager.checkLevelUp()) {
        player.skillPoints++;
        xpManager.levelUp(player);
    }

    // Затухание красной вспышки
    if (damageFlash > 0) {
        damageFlash = Math.max(0, damageFlash - deltaTime * 4);
    }

    // Спавн врагов
    enemySpawnManager.update(deltaTime, currentStage, enemies, biomeManager, stage2Zones);

    // Обновление бонусов
    powerUps = powerUps.filter(powerUp => {
        if (Math.sqrt(Math.pow(player.x - powerUp.x, 2) + Math.pow(player.y - powerUp.y, 2)) < 30) {
            //bonusManager.showBonusSelection();
            xpManager.takeBonus(player);
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
                    player.takeDamage(bullet.damage, bullet.x, bullet.y, bullet.vx, bullet.vy);
                    bullet.active = false;
                    updateUIManager.updateScore();
                }
            });

            return true;
        }
        return false;
    });

    if (currentStage === 2) {
        // Обновляем турели
        stage2Turrets.forEach(turret => {
            if (turret.active == true) {
                if (turret.bullets.length > 0 || fogOfWar.isVisible(turret.x, turret.y, player.x, player.y)) {
                    turret.update(player.x, player.y, deltaTime);
                }
                

                turret.bullets = turret.bullets.filter(bullet => {
                    let hitWall = false;
                    walls.forEach(wall => {
                        if (wall.checkCollisionWithCircle(bullet.x, bullet.y, bullet.radius)) {
                            hitWall = true;
                        }
                    });
                    return bullet.active && !hitWall;
                });

                // Проверяем столкновения пуль турелей с игроком
                turret.bullets.forEach(bullet => {
                    if (bullet.active && checkCollisionManager.checkCollision(bullet, player, bullet.radius, player.width / 2)) {
                        player.takeDamage(bullet.damage, bullet.x, bullet.y, bullet.vx, bullet.vy);
                        bullet.active = false;
                    }
                });

                // Проверяем столкновения пуль игрока с турелями
                player.bullets.forEach(bullet => {
                    if (bullet.active && checkCollisionManager.checkCollision(bullet, turret, bullet.radius, turret.radius)) {
                        turret.takeDamage(bullet.damage);
                        bullet.active = false;
                    }
                });
            }
        });
    }

    // Проверка столкновений игрока со стенами
    walls.forEach(wall => {
        if (isInCameraView(wall)) {
            if (wall.checkCollisionWithRect(player.x, player.y, player.width, player.height)) {
                wall.pushOut(player, player.width, player.height);
            }
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

    // Обновление молний игрока
    if (player.lightningBullets) {
        player.lightningBullets = player.lightningBullets.filter(lightning => {
            if (lightning.active) {
                lightning.update(deltaTime);

                // Статистика засчитывается при попадании
                return true;
            }
            return false;
        });
    }

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
    // Рисуем только видимых врагов
    enemies.forEach(enemy => {
        if (fogOfWar.isVisible(enemy.x, enemy.y, player.x, player.y)) {
            enemy.draw();
        }

        // Снаряды рисуем всегда, если они в зоне видимости игрока
        if (enemy.bullets && enemy.bullets.length > 0) {
            enemy.bullets.forEach(bullet => {
                if (fogOfWar.isVisible(bullet.x, bullet.y, player.x, player.y)) {
                    bullet.draw();
                }
            });
        }
    });

    powerUps.forEach(powerUp => {
        if (fogOfWar.isVisible(powerUp.x, powerUp.y, player.x, player.y)) {
            powerUp.draw();
        }
    });

    walls.forEach(wall => {
        if (isInCameraView(wall)) {
            biomeManager.drawWall(wall);
        }
    });

    if (currentStage === 2) {
        stage2Turrets.forEach(turret => {
            if (turret.active && fogOfWar.isVisible(turret.x, turret.y, player.x, player.y)) {
                turret.draw();
            }

            // Снаряды рисуем всегда, если они в зоне видимости игрока
            if (turret.active && turret.bullets && turret.bullets.length > 0) {
                turret.bullets.forEach(bullet => {
                    if (fogOfWar.isVisible(bullet.x, bullet.y, player.x, player.y)) {
                        bullet.draw();
                    }
                });
            }
        });
    }

    // Рисование молний
    if (player.lightningBullets) {
        player.lightningBullets.forEach(lightning => {
            lightning.draw();
        });
    }

    // Обновление и отрисовка частиц
    visualEffects.particles = visualEffects.particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.life > 0;
    });

    // Атмосферные частицы (снег, песок, угольки)
    biomeManager.drawAmbientParticles();

    minimap.drawMinimap();

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

    // Отображаем туман войны
    fogOfWar.render();

    // Отрисовка игрока поверх тумана с учетом камеры
    ctx.save();
    ctx.translate(-camera.x + cameraShake.offsetX, -camera.y + cameraShake.offsetY);
    player.draw();
    ctx.restore();

    // XP-бар
    xpManager.draw();
    checkVictoryCondition();
    requestAnimationFrame(gameLoop);
}

function updateCamera() {
    const targetX = player.x - camera.width / 2;
    const targetY = player.y - camera.height / 2;

    // Плавное движение камеры (lerp)
    const lerpSpeed = 15;
    camera.x += (targetX - camera.x) * lerpSpeed * deltaTime;
    camera.y += (targetY - camera.y) * lerpSpeed * deltaTime;

    // Устраняем микро-дрожание при малых смещениях
    if (Math.abs(targetX - camera.x) < 0.5) camera.x = targetX;
    if (Math.abs(targetY - camera.y) < 0.5) camera.y = targetY;

    // Не даем камере выйти за границы мира
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - camera.height));
}

function isInCameraView(obj, padding = 50) {
    return obj.x + obj.width + padding > camera.x &&
           obj.x - padding < camera.x + camera.width &&
           obj.y + obj.height + padding > camera.y &&
           obj.y - padding < camera.y + camera.height;
}

function enemyDead(x, y) {
    visualEffects.createExplosion(x, y); // создает взрывы
    soundManager.playExplosion();
    score += 50;
    updateUIManager.updateScore(); // обновляет счет на экране
    statManager.kills++;

    // Добавляем XP за убийство
    xpManager.addXP(20 + Math.floor(xpManager.level * 2));

    // Шанс выпадения аптечки при убийстве врага
    if (Math.random() < 0.1) {
        powerUps.push(new PowerUp(x, y, 'health'));
    }
}

// Добавляем отдельную функцию проверки победы
function checkVictoryCondition() {
    // Проверяем, достигнут ли лимит врагов и нет ли активных врагов
    if (currentStage === 1 && enemySpawnManager.tankIndex >= enemySpawnManager.maxEnemies && enemies.length === 0 && !isVictory) {
        // Дополнительная проверка - длительная пауза без спавна
        setTimeout(() => {
            if (enemies.length === 0 && !isVictory) {
                showVictory();
            }
        }, 2000); // Ждем 2 секунды для уверенности
    }
    else if (currentStage === 2) {
        let allAcivated = stage2Zones.every(zone => zone.activated === true);
        if (enemies.length === 0 && stage2Zones.every(zone => zone.activated === true)) {
            // Показываем выход
            visualEffects.createExitEffect();
            checkStage2Exit();
        }
    }
}

// Функция проверки столкновения прямоугольников
function checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

function checkStage2Exit() {
    if (currentStage !== 2) return;

    const playerRect = {
        x: player.x - player.width / 2,
        y: player.y - player.height / 2,
        width: player.width,
        height: player.height
    };

    if (checkRectCollision(playerRect, stage2Exit)) {
        showVictory();
    }
}

// Упрвление этапами
let currentStage = 1;
let stageRecords = {
    1: 0,
    2: 0
};
let stageUnlocked = {
    1: true,
    2: false
};

// Добавляем новые переменные для этапа 2
let stage2Enemies = [];
let stage2Turrets = [];
let stage2Exit = { x: 0, y: 0, width: 60, height: 60 };
let stage2Zones = []; // Зоны появления врагов

// Функция выбора этапа (теперь работает с dropdown)
function selectStage(stageId) {
    if (!stageUnlocked[stageId]) {
        // Вернуть dropdown на предыдущее значение
        document.getElementById('stageSelect').value = currentStage;
        return;
    }

    currentStage = stageId;

    if (stageId === 2) {
        stage2Enemies = [];
        stage2Turrets = [];
        stage2Zones = [];
    }

    // Обновляем рекорд
    updateStageRecordDisplay();

    // Сохраняем выбор
    localStorage.setItem('currentStage', currentStage);
}

function updateStageRecordDisplay() {
    const recordEl = document.getElementById('stage1-record');
    if (recordEl) {
        recordEl.textContent = stageRecords[currentStage] || '0';
    }
}

// Функция обновления статусов этапов
function updateStagesUI() {
    stageRecords = JSON.parse(localStorage.getItem('stageRecords')) || stageRecords;
    stageUnlocked = JSON.parse(localStorage.getItem('stageUnlocked')) || stageUnlocked;
    currentStage = parseInt(localStorage.getItem('currentStage')) || 1;

    // Обновляем dropdown
    const stageSelect = document.getElementById('stageSelect');
    if (stageSelect) {
        stageSelect.value = currentStage;

        // Обновляем доступность опций
        for (let i = 1; i <= 2; i++) {
            const option = stageSelect.querySelector(`option[value="${i}"]`);
            if (option) {
                if (stageUnlocked[i]) {
                    option.disabled = false;
                    if (stageRecords[i] > 0) {
                        option.textContent = `${i === 1 ? '🌍' : '🏭'} ${i === 1 ? 'Лесные территории' : 'Промышленная зона'} ✅`;
                    } else {
                        option.textContent = `${i === 1 ? '🌍' : '🏭'} ${i === 1 ? 'Лесные территории' : 'Промышленная зона'}`;
                    }
                } else {
                    option.disabled = true;
                    option.textContent = `🔒 ${i === 1 ? 'Лесные территории' : 'Промышленная зона'}`;
                }
            }
        }
    }

    updateStageRecordDisplay();

    // Сохраняем обновленные данные
    localStorage.setItem('stageRecords', JSON.stringify(stageRecords));
    localStorage.setItem('stageUnlocked', JSON.stringify(stageUnlocked));
}

function startGame() {
    minimap.minimapCanvas.style.display = 'block';
    mainMenu.style.display = 'none';
    canvas.style.display = 'block';
    gameContainer.style.display = 'block';
    gameInfo.style.display = 'flex';

    modules.loadModules();            
    modules.recalcTankStats();

    resetGame();
}

function resetGame() {
    isVictory = false;
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('pauseBtn').disabled = false;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.bullets = [];
    player.bodyAngle = 0;
    player.turretAngle = 0;
    player.doubleShot = false;

    camera.x = player.x - camera.width / 2;
    camera.y = player.y - camera.height / 2;

    fogOfWar.setWalls(walls);
    player.resetSkills();

    statManager.reset();
    keys.length = 0;

    document.getElementById('waveValue').textContent = 1;
    enemySpawnManager.reset();
    enemies = [];
    powerUps = [];
    score = 0;
    powerUpSpawnTimer = 0;
    gameRunning = true;
    damageFlash = 0;

    biomeManager.currentBiome = 'grass';
    biomeManager.init();

    bonusManager.resetShuffles();
    xpManager.reset();

    updateUIManager.updateScore();
    updateUIManager.updateStatsDisplayMainMenu();
    document.getElementById('gameOver').style.display = 'none';
    // Скрываем экран победы
    document.getElementById('victory').style.display = 'none';
    lastTime = performance.now();
    soundManager.resume();

    // Сбрасываем состояние этапа 2
    if (currentStage === 2) {
        stage2Enemies = [];
        stage2Turrets = [];
        stage2Zones = [];
    }

    // Используем соответствующую карту
    let mapKey = mapManager.getMapKey(currentStage);
    stage2Exit = mapManager.createMapFromLayout(mapKey, player, walls, powerUps, stage2Zones, stage2Turrets, stage2Enemies);

    // Устанавливаем биом для этапа 2
    if (currentStage === 2) {
        biomeManager.currentBiome = 'lava';
        biomeManager.init();
    } else {
        biomeManager.currentBiome = 'grass';
        biomeManager.init();
    }

    // Инициализация тумана войны
    fogOfWar.reset();
    fogOfWar.setWorldSize(WORLD_WIDTH, WORLD_HEIGHT);
    fogOfWar.init();
    fogOfWar.setWalls(walls);
    // Убедитесь что стены имеют формат:
    console.log(walls[0]);
    // Должно быть: {x: число, y: число, width: число, height: число}

    gameLoop();
}

function gameOver() {
    document.getElementById('pauseBtn').disabled = true;
    gameRunning = false;
    points += Math.floor(score / 10);
    statManager.update();
}

function backToMenu() {
    minimap.minimapCanvas.style.display = 'none';
    modules.loadModules();
    modules.recalcTankStats();

    points += Math.floor(score / 20);
    localStorage.setItem('tankGamePoints', points);
    gameRunning = false;
    canvas.style.display = 'none';
    gameContainer.style.display = 'none';
    gameInfo.style.display = 'none';
    mainMenu.style.display = 'flex';

    updateStagesUI();
    updateUIManager.updateUpgradeUI(modules);
    modules.updateAllModuleBadges();
    document.getElementById('pointsValue').textContent = points;

    if (modules.selectedModuleName) {
        modules.updateModulePanel(modules.selectedModuleName);
    }
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

    keys.length = 0;
}

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

    // Загружаем модули
    modules.loadModules();

    // Инициализируем этапы
    updateStagesUI();

    updateUIManager.updateUpgradeUI(modules);
    soundManager.init();

    // Инициализируем обработчики событий
    initEventHandlers();
}

function toggleSound() {
    soundManager.enabled = !soundManager.enabled;
    document.getElementById('soundBtn').textContent = soundManager.enabled ? '🔊' : '🔇';
}

function showVictory() {
    isVictory = true;
    gameRunning = false;

    console.log('Показываем экран победы для этапа', currentStage);

    // Сохраняем рекорд этапа
    if (score > stageRecords[currentStage]) {
        stageRecords[currentStage] = score;
        localStorage.setItem('stageRecords', JSON.stringify(stageRecords));
    }

    // Разблокируем следующий этап
    if (currentStage === 1 && stageRecords[1] > 0) {
        stageUnlocked[2] = true;
        localStorage.setItem('stageUnlocked', JSON.stringify(stageUnlocked));
    }

    // Скрываем игровые элементы
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('bonusScreen').style.display = 'none';

    // Показываем экран победы
    const victoryScreen = document.getElementById('victory');
    victoryScreen.style.display = 'block';
    document.getElementById('victoryScore').textContent = score;

    // Добавляем информацию об этапе
    const stageInfo = document.createElement('div');
    stageInfo.className = 'stage-info';
    stageInfo.style.cssText = `
        color: #fff;
        font-size: 18px;
        margin: 10px 0;
        text-align: center;
    `;
    stageInfo.textContent = `Этап ${currentStage} завершен!`;
    victoryScreen.querySelector('.victory-subtitle').after(stageInfo);

    // Обновляем статистику
    statManager.update();

    localStorage.setItem('tankGamePoints', points);

    // Обновляем рекорд если нужно
    if (score > recordScore) {
        recordScore = score;
        document.getElementById('recordScoreValue').textContent = recordScore;
    }
}

// Запуск инициализации после загрузки страницы
document.addEventListener('DOMContentLoaded', init);

    // Функция сброса всех характеристик
function resetAllStats() {
    modules.resetAllStats();
}

function upgradeModule() {
    modules.upgradeModule();
}

function selectModuleBtn(moduleName) {
    modules.selectModuleBtn(moduleName);
}


