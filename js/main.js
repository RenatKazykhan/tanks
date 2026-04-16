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
    health: 200,
    maxHealth: 200,
    speed: 100,
    damage: 30,
    fireRate: 1100,
    bulletSpeed: 300,
    regen: 0,
    armor: 0,
    doubleShot: false,
    lifeSteal: 0,
    turretRotationSpeed: 1,
    bodyRotationSpeed: 1,
    visibilityRadius: 300
};

// Базовые характеристики танка (константы, никогда не меняются)
const BASE_TANK_STATS = {
    health: 200,
    maxHealth: 200,
    speed: 100,
    damage: 30,
    fireRate: 1100,
    bulletSpeed: 300,
    regen: 0,
    armor: 0,
    doubleShot: false,
    lifeSteal: 0,
    turretRotationSpeed: 1,
    bodyRotationSpeed: 1,
    visibilityRadius: 300
};

// Система модулей танка
const tankModules = {
    gun: {
        name: 'Орудие',
        icon: '🔫',
        level: 0,
        maxLevel: 10,
        baseCost: 50,
        costMultiplier: 1.4,
        description: 'Увеличивает урон и уменьшает перезарядку',
        getEffects(level) {
            return {
                damage: BASE_TANK_STATS.damage + level * 5,
                fireRate: Math.max(200, BASE_TANK_STATS.fireRate - level * 20)
            };
        },
        getStatsDisplay(level) {
            const e = this.getEffects(level);
            const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
            return [
                { label: '🔫 Урон', value: e.damage, next: next ? next.damage : null },
                { label: '🚀 Перезарядка', value: e.fireRate + 'мс', next: next ? next.fireRate + 'мс' : null }
            ];
        }
    },
    turret: {
        name: 'Башня',
        icon: '🗼',
        level: 0,
        maxLevel: 10,
        baseCost: 60,
        costMultiplier: 1.4,
        description: 'Увеличивает прочность, дальность обзора, скорость перезарядки и скорость поворота башни',
        getEffects(level) {
            return {
                maxHealth: BASE_TANK_STATS.maxHealth + level * 30,
                visibilityRadius: BASE_TANK_STATS.visibilityRadius + level * 20,
                fireRate: Math.max(200, BASE_TANK_STATS.fireRate - level * 15),
                turretRotationSpeed: BASE_TANK_STATS.turretRotationSpeed + level * 0.5
            };
        },
        getStatsDisplay(level) {
            const e = this.getEffects(level);
            const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
            return [
                { label: '❤️ Прочность', value: e.maxHealth, next: next ? next.maxHealth : null },
                { label: '👁️ Обзор', value: e.visibilityRadius, next: next ? next.visibilityRadius : null },
                { label: '🚀 Перезарядка', value: e.fireRate + 'мс', next: next ? next.fireRate + 'мс' : null },
                { label: '🔄 Поворот башни', value: e.turretRotationSpeed.toFixed(1), next: next ? next.turretRotationSpeed.toFixed(1) : null }
            ];
        }
    },
    engine: {
        name: 'Мотор',
        icon: '⚙️',
        level: 0,
        maxLevel: 10,
        baseCost: 1,
        costMultiplier: 1.4,
        description: 'Увеличивает скорость движения танка',
        getEffects(level) {
            return {
                speed: BASE_TANK_STATS.speed + level * 12
            };
        },
        getStatsDisplay(level) {
            const e = this.getEffects(level);
            const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
            return [
                { label: '⚡ Скорость', value: e.speed, next: next ? next.speed : null }
            ];
        }
    },
    tracks: {
        name: 'Гусеницы',
        icon: '🛞',
        level: 0,
        maxLevel: 10,
        baseCost: 1,
        costMultiplier: 1.4,
        description: 'Увеличивает скорость поворота танка',
        getEffects(level) {
            return {
                bodyRotationSpeed: BASE_TANK_STATS.bodyRotationSpeed + level * 0.3
            };
        },
        getStatsDisplay(level) {
            const e = this.getEffects(level);
            const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
            return [
                { label: '🔄 Поворот корпуса', value: e.bodyRotationSpeed.toFixed(1), next: next ? next.bodyRotationSpeed.toFixed(1) : null }
            ];
        }
    },
    shells: {
        name: 'Снаряды',
        icon: '🎯',
        level: 0,
        maxLevel: 10,
        baseCost: 50,
        costMultiplier: 1.4,
        description: 'Увеличивает скорость снаряда',
        getEffects(level) {
            return {
                bulletSpeed: BASE_TANK_STATS.bulletSpeed + level * 30
            };
        },
        getStatsDisplay(level) {
            const e = this.getEffects(level);
            const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
            return [
                { label: '💨 Скорость снаряда', value: e.bulletSpeed, next: next ? next.bulletSpeed : null }
            ];
        }
    },
    hull: {
        name: 'Корпус',
        icon: '🛡️',
        level: 0,
        maxLevel: 10,
        baseCost: 60,
        costMultiplier: 1.4,
        description: 'Увеличивает прочность, броню и регенерацию',
        getEffects(level) {
            return {
                maxHealth: BASE_TANK_STATS.maxHealth + level * 25,
                armor: Math.min(70, BASE_TANK_STATS.armor + level * 1),
                regen: BASE_TANK_STATS.regen + level * 1
            };
        },
        getStatsDisplay(level) {
            const e = this.getEffects(level);
            const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
            return [
                { label: '❤️ Прочность', value: e.maxHealth, next: next ? next.maxHealth : null },
                { label: '🛡️ Броня', value: e.armor + '%', next: next ? next.armor + '%' : null },
                { label: '♻️ Регенерация', value: e.regen + ' hp/с', next: next ? next.regen + ' hp/с' : null }
            ];
        }
    }
};

// Вычисление стоимости улучшения модуля
function getModuleCost(moduleName) {
    const mod = tankModules[moduleName];
    if (!mod || mod.level >= mod.maxLevel) return Infinity;
    return Math.floor(mod.baseCost * Math.pow(mod.costMultiplier, mod.level));
}

// Пересчёт tankStats из уровней модулей
function recalcTankStats() {
    // Сначала сбрасываем к базовым значениям
    Object.assign(tankStats, { ...BASE_TANK_STATS });

    const gunEff = tankModules.gun.getEffects(tankModules.gun.level);
    const turretEff = tankModules.turret.getEffects(tankModules.turret.level);
    const tracksEff = tankModules.tracks.getEffects(tankModules.tracks.level);
    const engineEff = tankModules.engine.getEffects(tankModules.engine.level);
    const shellsEff = tankModules.shells.getEffects(tankModules.shells.level);
    const hullEff = tankModules.hull.getEffects(tankModules.hull.level);

    tankStats.damage = gunEff.damage;

    // Складываем бонусы перезарядки от орудия и башни
    const gunFireRateBonus = BASE_TANK_STATS.fireRate - gunEff.fireRate;
    const turretFireRateBonus = BASE_TANK_STATS.fireRate - turretEff.fireRate;
    tankStats.fireRate = Math.max(200, BASE_TANK_STATS.fireRate - gunFireRateBonus - turretFireRateBonus);

    // Складываем бонусы здоровья от башни и корпуса
    const turretHealthBonus = turretEff.maxHealth - BASE_TANK_STATS.maxHealth;
    const hullHealthBonus = hullEff.maxHealth - BASE_TANK_STATS.maxHealth;
    tankStats.maxHealth = BASE_TANK_STATS.maxHealth + turretHealthBonus + hullHealthBonus;
    tankStats.health = tankStats.maxHealth;

    tankStats.visibilityRadius = turretEff.visibilityRadius;
    tankStats.turretRotationSpeed = turretEff.turretRotationSpeed;
    tankStats.speed = engineEff.speed;
    tankStats.bodyRotationSpeed = tracksEff.bodyRotationSpeed;
    tankStats.bulletSpeed = shellsEff.bulletSpeed;
    tankStats.armor = hullEff.armor;
    tankStats.regen = hullEff.regen;
}

// Текущий выбранный модуль
let selectedModuleName = null;

// Обновление панели модуля
function updateModulePanel(moduleName) {
    selectedModuleName = moduleName;
    const mod = tankModules[moduleName];
    if (!mod) return;

    // Подсветка активной кнопки
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.toggle('module-btn-active', btn.dataset.module === moduleName);
    });

    document.getElementById('moduleDetailIcon').textContent = mod.icon;
    document.getElementById('moduleDetailName').textContent = mod.name;
    document.getElementById('moduleDetailLevel').textContent =
        mod.level >= mod.maxLevel
            ? `Уровень ${mod.level} / ${mod.maxLevel} — МАКСИМУМ`
            : `Уровень ${mod.level} / ${mod.maxLevel}`;

    // Статы
    const statsContainer = document.getElementById('moduleDetailStats');
    const stats = mod.getStatsDisplay(mod.level);
    statsContainer.innerHTML = stats.map(s => {
        const upgradeHint = s.next !== null ? `<span class="module-stat-upgrade">→ ${s.next}</span>` : '';
        return `<div class="module-stat-row">
            <span class="module-stat-label">${s.label}</span>
            <span><span class="module-stat-value">${s.value}</span>${upgradeHint}</span>
        </div>`;
    }).join('');

    // Кнопка улучшения
    const actionsDiv = document.getElementById('moduleDetailActions');
    const upgradeBtn = document.getElementById('moduleUpgradeBtn');
    const costSpan = document.getElementById('moduleUpgradeCost');

    if (mod.level >= mod.maxLevel) {
        actionsDiv.style.display = 'flex';
        upgradeBtn.disabled = true;
        costSpan.textContent = 'МАКСИМУМ';
    } else {
        const cost = getModuleCost(moduleName);
        actionsDiv.style.display = 'flex';
        upgradeBtn.disabled = points < cost;
        costSpan.textContent = `Улучшить (${cost})`;
    }
}

function selectModuleBtn(moduleName) {
    updateModulePanel(moduleName);
}

function selectTank(index) {
    // Пока один танк, ничего не делаем
}

// Улучшение модуля
function upgradeModule() {
    if (!selectedModuleName) return;
    const mod = tankModules[selectedModuleName];
    if (!mod || mod.level >= mod.maxLevel) return;

    const cost = getModuleCost(selectedModuleName);
    if (points < cost) return;

    points -= cost;
    mod.level++;          
    recalcTankStats();   
    saveModules();

    // Обновляем UI
    updateModulePanel(selectedModuleName);
    updateAllModuleBadges();
    document.getElementById('pointsValue').textContent = points;
    localStorage.setItem('tankGamePoints', points);
}

function updateAllModuleBadges() {
    for (const [key, mod] of Object.entries(tankModules)) {
        const badge = document.getElementById(key + 'LevelBadge');
        if (badge) {
            badge.textContent = `Ур. ${mod.level}`;
        }
        const miniFill = document.getElementById(key + 'MiniFill');
        if (miniFill) {
            miniFill.style.width = (mod.level / mod.maxLevel * 100) + '%';
        }
    }
}

function saveModules() {
    const levels = {};
    for (const [key, mod] of Object.entries(tankModules)) {
        levels[key] = mod.level;
    }
    localStorage.setItem('tankModuleLevels', JSON.stringify(levels));
    localStorage.setItem('tankGameStats', JSON.stringify(tankStats));
}

function loadModules() {
    const saved = localStorage.getItem('tankModuleLevels');
    if (saved) {
        const levels = JSON.parse(saved);
        for (const [key, level] of Object.entries(levels)) {
            if (tankModules[key]) {
                tankModules[key].level = level;
            }
        }
        recalcTankStats();
    }
}

// Устаревшая функция, оставлена для обратной совместимости
const upgradeCosts = {
    health: 50, maxHealth: 50, speed: 50, damage: 50,
    fireRate: 50, bulletSpeed: 50, regen: 50, armor: 50
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
const enemySpawnManager = new EnemySpawnManager(WORLD_WIDTH, WORLD_HEIGHT);
const mapManager = new MapManager(WORLD_WIDTH, WORLD_HEIGHT);
const fogOfWar = new FogOfWar(canvas, 300);


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
let powerUps = [];
let powerUpSpawnTimer = 0;
let walls = [];
let regenTimer = 0;
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

    //ctx.drawImage(grassBackground.backgroundCanvas, 0, 0);

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
    enemySpawnManager.update(deltaTime, currentStage, enemies, biomeManager, stage2Zones, () => {
        showVictory();
        isVictory = true;
        gameRunning = false;
    });

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
                    player.takeDamage(bullet.damage, bullet.x, bullet.y);
                    if (bullet.isIceBullet) {
                        player.freeze(1000);
                    }
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
                turret.update(player.x, player.y, deltaTime);

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
                        player.takeDamage(bullet.damage, bullet.x, bullet.y);
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

    walls.forEach(wall => biomeManager.drawWall(wall));

    if (currentStage === 2) {
        stage2Turrets.forEach(turret => {
            if (turret.active && fogOfWar.isVisible(turret.x, turret.y, player.x, player.y)) {
                turret.draw();
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

function createWalls() {
    const mapKey = mapManager.getMapKey(currentStage);
    return mapManager.createMapFromLayout(mapKey, player, walls, powerUps, stage2Zones, stage2Turrets, stage2Enemies);
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
                isVictory = true;
                gameRunning = false;
            }
        }, 2000); // Ждем 2 секунды для уверенности
    }
    else if (currentStage === 2) {
        // Проверяем, فعال ли босс
        const bossActive = stage2Enemies.some(enemy => enemy instanceof BossTank && enemy.active);

        if (!bossActive && !stage2BossDefeated) {
            stage2BossDefeated = true;
            // Показываем выход
            createExitEffect();
        }

        checkStage2Exit();
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
    if (currentStage !== 2 || stage2BossDefeated === false) return;

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

// Эффект для выхода
function createExitEffect() {
    const exitX = stage2Exit.x + stage2Exit.width / 2;
    const exitY = stage2Exit.y + stage2Exit.height / 2;

    // Создаем частицы для выхода
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        particles.push(new Particle(
            exitX + Math.cos(angle) * 30,
            exitY + Math.sin(angle) * 30,
            '#00ff00',
            {
                vx: Math.cos(angle) * 50,
                vy: Math.sin(angle) * 50,
                life: 2000,
                size: 5
            }
        ));
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
let stage2Progress = 0;
let stage2Enemies = [];
let stage2Turrets = [];
let stage2BossDefeated = false;
let stage2Exit = { x: 0, y: 0, width: 60, height: 60 };
let stage2Zones = []; // Зоны появления врагов
let lastZoneActivation = 0;

// Функция выбора этапа (теперь работает с dropdown)
function selectStage(stageId) {
    if (!stageUnlocked[stageId]) {
        // Вернуть dropdown на предыдущее значение
        document.getElementById('stageSelect').value = currentStage;
        return;
    }

    currentStage = stageId;

    if (stageId === 2) {
        stage2Progress = 0;
        stage2Enemies = [];
        stage2Turrets = [];
        stage2BossDefeated = false;
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
    minimapCanvas.style.display = 'block';
    mainMenu.style.display = 'none';
    canvas.style.display = 'block';
    gameContainer.style.display = 'block';
    gameInfo.style.display = 'flex';

    loadModules();            
    recalcTankStats();         
    player.setStat(tankStats); 

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

    // Убедитесь что setWalls вызван:
    fogOfWar.setWalls(walls);
    console.log('Segments:', fogOfWar.wallSegments.length);
    // Должно быть walls.length * 4
    // щит
    player.hasShield = false;
    player.shield = 30;
    player.maxShield = 30;
    player.shieldRegenRate = 1; // восстановление в секунду

    // телепорт
    player.teleportSkill.level = 0;
    player.teleportSkill.canTeleport = false;

    // взрыв
    player.blastSkill.level = 0;
    player.blastSkill.hasEnergyBlast = false;

    // быстрая регенерация
    player.regenerationSkill.level = 0;
    player.regenerationSkill.hasRegen = false;
    player.regenerationSkill.isActive = false;

    // цепная молния
    player.chainLightningSkill.level = 0;
    player.chainLightningSkill.hasChainLightning = false;

    // щит-заморозка
    player.shieldSkill.level = 0;
    player.shieldSkill.hasShield = false;
    player.shieldSkill.isActive = false;

    // вампиризм
    player.lifestealSkill.level = 0;
    player.lifestealSkill.hasLifesteal = false;
    player.lifestealSkill.isActive = false;
    player.lifeSteal = 0;

    // двойной выстрел
    player.doubleShootSkill.level = 0;
    player.doubleShootSkill.hasDoubleShoot = false;
    player.doubleShot = false;
    player.doubleShotChance = 0.25;

    player.skillPoints = 4;

    // Дрон-камикадзе
    player.droneSkill.level = 0;
    player.droneSkill.hasDrone = false;
    player.droneSkill.drones = [];

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
    createWalls();

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
        stage2Progress = 0;
        stage2Enemies = [];
        stage2Turrets = [];
        stage2BossDefeated = false;
        stage2Zones = [];
    }

    // Используем соответствующую карту
    const mapKey = currentStage === 2 ? 'level2' : 'level1';
    mapManager.createMapFromLayout(mapKey, player, walls, powerUps, stage2Zones, stage2Turrets, stage2Enemies);

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
    minimapCanvas.style.display = 'none';
    loadModules();
    recalcTankStats();

    points += Math.floor(score / 20);
    localStorage.setItem('tankGamePoints', points);
    gameRunning = false;
    canvas.style.display = 'none';
    gameContainer.style.display = 'none';
    gameInfo.style.display = 'none';
    mainMenu.style.display = 'flex';

    updateStagesUI();
    updateUIManager.updateUpgradeUI();
    updateAllModuleBadges();
    document.getElementById('pointsValue').textContent = points;

    if (selectedModuleName) {
        updateModulePanel(selectedModuleName);
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

    // Загружаем модули
    loadModules();

    // Инициализируем этапы
    updateStagesUI();

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
    for (const key in tankModules) {
        tankModules[key].level = 0;
    }
    recalcTankStats();    // ✅ Пересчёт вернёт к базовым значениям
    saveModules();

    recordScore = 0;
    localStorage.setItem('tankGameRecord', recordScore);
    updateUIManager.updateUpgradeUI();
    updateAllModuleBadges();

    if (selectedModuleName) {
        updateModulePanel(selectedModuleName);
    }
}

function drawMinimap() {

    if (currentStage === 2) {
        // Отрисовка турелей
        minimapCtx.fillStyle = '#ff00ff';
        stage2Turrets.forEach(turret => {
            if (turret.active) {
                minimapCtx.fillRect(
                    turret.x * minimapScale.x - 2,
                    turret.y * minimapScale.y - 2,
                    4,
                    4
                );
            }
        });

        // Отрисовка выхода (если активен)
        if (stage2BossDefeated) {
            minimapCtx.fillStyle = '#00ff00';
            minimapCtx.fillRect(
                stage2Exit.x * minimapScale.x,
                stage2Exit.y * minimapScale.y,
                stage2Exit.width * minimapScale.x,
                stage2Exit.height * minimapScale.y
            );
        }

        // Отрисовка зон активации
        minimapCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        minimapCtx.lineWidth = 1;
        stage2Zones.forEach(zone => {
            if (!zone.activated) {
                minimapCtx.beginPath();
                minimapCtx.arc(
                    zone.x * minimapScale.x,
                    zone.y * minimapScale.y,
                    zone.radius * minimapScale.x,
                    0,
                    Math.PI * 2
                );
                minimapCtx.stroke();
            }
        });
    }

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
    if (isVictory) return;

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

    // Создаем эффект конфетти
    createConfetti();

    // Обновляем статистику
    statManager.update();

    // Добавляем очки за победу
    points += 1000;
    localStorage.setItem('tankGamePoints', points);

    // Обновляем рекорд если нужно
    if (score > recordScore) {
        recordScore = score;
        localStorage.setItem('tankGameRecord', recordScore);
        document.getElementById('recordScoreValue').textContent = recordScore;
    }
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
