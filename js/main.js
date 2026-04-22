const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const gameInfo = document.getElementById('gameInfo');
gameInfo.style.display = 'none';
gameContainer.style.display = 'none';

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
    enemySpawnManager.update(deltaTime, currentStage, enemies, biomeManager, currentStage === 3 ? stage3Zones : stage2Zones);

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
                    enemy.takeDamage(bullet.damage, bullet.x, bullet.y, bullet.vx, bullet.vy);

                    // Проверяем, не рикошет ли (если враг ещё жив и пуля всё ещё активна — значит не рикошетнуло)
                    // Для Tiger2: если рикошет, здоровье не изменилось, но пулю всё равно деактивируем
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
        updateStage2Turrets(deltaTime);
    }

    if (currentStage === 3) {
        updateStage3(deltaTime);
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
        drawStage2Turrets();
    }

    // Этап 3: заколка и выход
    if (currentStage === 3) {
        drawStage3Hairpin();
        drawStage3Exit();
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

    // Индикатор направления к заколке (этап 3)
    if (currentStage === 3) {
        drawHairpinIndicator();
    }

    checkVictoryCondition();
    requestAnimationFrame(gameLoop);
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
        checkStage2Victory();
    }
    else if (currentStage === 3) {
        checkStage3Victory();
    }
}



// Упрвление этапами
let currentStage = 1;
let stageRecords = {
    1: 0,
    2: 0,
    3: 0
};
let stageUnlocked = {
    1: true,
    2: false,
    3: false
};



// Функция выбора этапа (теперь работает с dropdown)
function selectStage(stageId) {
    if (!stageUnlocked[stageId]) {
        // Вернуть dropdown на предыдущее значение
        document.getElementById('stageSelect').value = currentStage;
        return;
    }

    currentStage = stageId;

    if (stageId === 2) {
        resetStage2();
    } else if (stageId === 3) {
        resetStage3();
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

        const stageNames = {
            1: { icon: '🌍', name: 'Лесные территории' },
            2: { icon: '🏭', name: 'Промышленная зона' },
            3: { icon: '🏜️', name: 'Пустынный лабиринт' }
        };

        // Обновляем доступность опций
        for (let i = 1; i <= 3; i++) {
            const option = stageSelect.querySelector(`option[value="${i}"]`);
            if (option) {
                const info = stageNames[i];
                if (stageUnlocked[i]) {
                    option.disabled = false;
                    if (stageRecords[i] > 0) {
                        option.textContent = `${info.icon} ${info.name} ✅`;
                    } else {
                        option.textContent = `${info.icon} ${info.name}`;
                    }
                } else {
                    option.disabled = true;
                    option.textContent = `🔒 ${info.name}`;
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
        resetStage2();
    } else if (currentStage === 3) {
        resetStage3();
    }

    // Используем соответствующую карту
    let mapKey = mapManager.getMapKey(currentStage);
    stage2Exit = mapManager.createMapFromLayout(mapKey, player, walls, powerUps, currentStage === 3 ? stage3Zones : stage2Zones, stage2Turrets, stage2Enemies);

    // Для этапа 3 сохраняем выход
    if (currentStage === 3) {
        stage3Exit = stage2Exit;
    }

    // Устанавливаем биом для этапов
    if (currentStage === 2) {
        biomeManager.currentBiome = 'lava';
        biomeManager.init();
    } else if (currentStage === 3) {
        biomeManager.currentBiome = 'desert';
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
    if (currentStage === 2 && stageRecords[2] > 0) {
        stageUnlocked[3] = true;
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

    // Очищаем старые динамические элементы (если экран открывался раньше)
    victoryScreen.querySelectorAll('.stage-info, .stage-reward').forEach(el => el.remove());

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

    // === НАЧИСЛЯЕМ ОЧКИ ЗА ПРОХОЖДЕНИЕ ЭТАПА ===
    const stagePointsReward = {
        1: 300,
        2: 600,
        3: 1000
    };
    const reward = stagePointsReward[currentStage] || 300;
    points += reward;
    document.getElementById('pointsValue').textContent = points;
    localStorage.setItem('tankGamePoints', points);

    // Показываем сообщение о награде
    const rewardDiv = document.createElement('div');
    rewardDiv.className = 'stage-reward';
    rewardDiv.style.cssText = `
        color: #ffd700;
        font-size: 20px;
        font-weight: bold;
        margin: 10px 0;
        text-align: center;
        text-shadow: 0 0 10px rgba(255,215,0,0.5);
    `;
    rewardDiv.textContent = `+${reward} очков за модули 🏆`;
    victoryScreen.querySelector('.victory-subtitle').after(rewardDiv);

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

function equipModule() {
    modules.equipModule(modules.selectedModuleName);
}

function selectModuleBtn(moduleName) {
    modules.selectModuleBtn(moduleName);
}


