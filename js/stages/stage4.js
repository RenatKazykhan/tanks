/**
 * Stage 4: Enemy Base Assault
 * Игрок должен уничтожить базу врага и все здания-производители
 * Враги становятся сильнее с каждой волной
 */

// Глобальные переменные для этапа 4
let stage4Base = null;
let stage4Base2 = null;
let stage4Buildings = [];
let stage4Exit = null;
let stage4Initialized = false;

/**
 * Инициализация этапа 4
 * @param {PlayerTank} player
 * @param {Array} walls
 * @param {Array} powerUps
 */
function initStage4(player, walls, powerUps) {
    // Очищаем стены
    walls.length = 0;
    // Создаем лабиринт
    generateStage4Maze(walls);
    
    // Создаем базу врага в дальнем углу

    // база 1
    stage4Base = new EnemyBase(WORLD_WIDTH - 100, WORLD_HEIGHT - 100);
    // Создаем здания-производители
    stage4Buildings = [];
    stage4Buildings.push(new EnemyBuilding(WORLD_WIDTH - 300, WORLD_HEIGHT - 100, 'fast'));
    stage4Buildings.push(new EnemyBuilding(WORLD_WIDTH - 100, WORLD_HEIGHT - 300, 'heavy'));
    stage4Buildings.push(new EnemyBuilding(WORLD_WIDTH - 300, WORLD_HEIGHT - 300, 'standard'));
    
    // Создаем турели для защиты базы
    enemies.push(new Turret(WORLD_WIDTH - 400, WORLD_HEIGHT - 100));
    enemies.push(new Turret(WORLD_WIDTH - 400, WORLD_HEIGHT - 200));
    enemies.push(new Turret(WORLD_WIDTH - 400, WORLD_HEIGHT - 300));
    enemies.push(new Turret(WORLD_WIDTH - 400, WORLD_HEIGHT - 400));
    enemies.push(new Turret(WORLD_WIDTH - 300, WORLD_HEIGHT - 200));
    enemies.push(new Turret(WORLD_WIDTH - 300, WORLD_HEIGHT - 400));
    enemies.push(new Turret(WORLD_WIDTH - 200, WORLD_HEIGHT - 300));
    enemies.push(new Turret(WORLD_WIDTH - 200, WORLD_HEIGHT - 200));
    enemies.push(new Turret(WORLD_WIDTH - 200, WORLD_HEIGHT - 400));
    enemies.push(new Turret(WORLD_WIDTH - 100, WORLD_HEIGHT - 400));
    
    // база 2
    stage4Base2 = new EnemyBase(WORLD_WIDTH - 100, 100);
    // Создаем здания-производители
    stage4Buildings.push(new EnemyBuilding(WORLD_WIDTH - 300, 100, 'fast'));
    stage4Buildings.push(new EnemyBuilding(WORLD_WIDTH - 100, 300, 'heavy'));
    stage4Buildings.push(new EnemyBuilding(WORLD_WIDTH - 300, 300, 'standard'));
    
    // Создаем турели для защиты базы
    enemies.push(new Turret(WORLD_WIDTH - 400,  100));
    enemies.push(new Turret(WORLD_WIDTH - 400,  200));
    enemies.push(new Turret(WORLD_WIDTH - 400,  300));
    enemies.push(new Turret(WORLD_WIDTH - 400,  400));
    enemies.push(new Turret(WORLD_WIDTH - 300,  200));
    enemies.push(new Turret(WORLD_WIDTH - 300,  400));
    enemies.push(new Turret(WORLD_WIDTH - 200,  300));
    enemies.push(new Turret(WORLD_WIDTH - 200,  200));
    enemies.push(new Turret(WORLD_WIDTH - 200,  400));
    enemies.push(new Turret(WORLD_WIDTH - 100,  400));

    // Устанавливаем позицию выхода (после уничтожения базы)
    stage4Exit = {
        x: WORLD_WIDTH - 250,
        y: WORLD_HEIGHT - 250,
        radius: 100
    };
    
    // Устанавливаем игрока в начальной позиции
    player.x = WORLD_WIDTH - 450;
    player.y = WORLD_HEIGHT - 450;
    
    stage4Initialized = true;
    
    // Устанавливаем туман войны
    if (typeof fogOfWar !== 'undefined') {
        fogOfWar.setWalls(walls);
    }
}

/**
 * Генерация лабиринта для этапа 4
 * @param {Array} walls
 */
function generateStage4Maze(walls) {
    const wallThickness = 20;
    
    // Внешние стены
    walls.push(new Wall(
        wallThickness / 2,
        WORLD_HEIGHT / 2,
        wallThickness,
        WORLD_HEIGHT
    ));
    walls.push(new Wall(
        WORLD_WIDTH - wallThickness / 2,
        WORLD_HEIGHT / 2,
        wallThickness,
        WORLD_HEIGHT
    ));
    walls.push(new Wall(
        WORLD_WIDTH / 2,
        wallThickness / 2,
        WORLD_WIDTH,
        wallThickness
    ));
    walls.push(new Wall(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT - wallThickness / 2,
        WORLD_WIDTH,
        wallThickness
    ));

    // Случайные стены для укрытия игрока
    const numWalls = 12;
    const minX = 150;
    const maxX = WORLD_WIDTH - 150;
    const minY = 150;
    const maxY = WORLD_HEIGHT - 150;
    const minSize = 40;
    const maxSize = 120;

    for (let i = 0; i < numWalls; i++) {
        const width = minSize + Math.random() * (maxSize - minSize);
        const height = minSize + Math.random() * (maxSize - minSize);
        const x = minX + Math.random() * (maxX - minX - width);
        const y = minY + Math.random() * (maxY - minY - height);

        // Проверяем, чтобы стена не перекрывала критически важные зоны (старт игрока и базы)
        const playerStartX = WORLD_WIDTH - 450;
        const playerStartY = WORLD_HEIGHT - 450;
        const base1X = WORLD_WIDTH - 100;
        const base1Y = WORLD_HEIGHT - 100;
        const base2X = WORLD_WIDTH - 100;
        const base2Y = 100;

        // Если стена слишком близко к этим точкам, пропускаем
        const distanceToPlayer = Math.sqrt((x - playerStartX) ** 2 + (y - playerStartY) ** 2);
        const distanceToBase1 = Math.sqrt((x - base1X) ** 2 + (y - base1Y) ** 2);
        const distanceToBase2 = Math.sqrt((x - base2X) ** 2 + (y - base2Y) ** 2);

        if (distanceToPlayer < 200 || distanceToBase1 < 200 || distanceToBase2 < 200) {
            continue;
        }

        walls.push(new Wall(x, y, width, height));
    }
}

/**
 * Обновление этапа 4
 * @param {number} deltaTime
 * @param {Array} enemies
 * @param {PlayerTank} player
 */
function updateStage4(deltaTime, enemies, player) {
    if (!stage4Initialized) return;
    
    // Обновляем базу
    if (stage4Base && stage4Base.active) {
        stage4Base.update(deltaTime, enemies, player);
    }
    
    // Обновляем базу 2
    if (stage4Base2 && stage4Base2.active) {
        stage4Base2.update(deltaTime, enemies, player);
    }
    

    // Обновляем здания
    stage4Buildings.forEach(building => {
        if (building.active) {
            building.update(deltaTime, enemies, stage4Base ? stage4Base.waveNumber : 1);
        }
    });
}

/**
 * Отрисовка этапа 4
 */
function drawStage4() {
    if (!stage4Initialized) return;
    
    // Рисуем базу
    if (stage4Base && stage4Base.active) {
        stage4Base.draw();
    }

    // Рисуем базу
    if (stage4Base2 && stage4Base2.active) {
        stage4Base2.draw();
    }
    
    // Рисуем здания
    stage4Buildings.forEach(building => {
        if (building.active) {
            building.draw();
        }
    });
}

/**
 * Проверка победы на этапе 4
 * @returns {boolean}
 */
function checkStage4Victory() {
    if (!stage4Initialized) return false;
    
    // Победа если база уничтожена и нет живых врагов
    if (stage4Base && stage4Base.isDestroyed() && stage4Base2 && stage4Base2.isDestroyed() && enemies.length === 0) {
        setTimeout(() => {
            if (enemies.length === 0 && !isVictory) {
                showVictory();
            }
        }, 2000);
    }
}

/**
 * Сброс этапа 4
 */
function resetStage4() {
    stage4Base = null;
    stage4Base2 = null;
    stage4Buildings = [];
    stage4Exit = null;
    stage4Initialized = false;
}
