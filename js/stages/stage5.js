/**
 * Stage 5: Финальный босс
 * Игрок сражается с одним мощным боссом, который стреляет веером, самонаводящимися ракетами и имеет пулемётную механику.
 * Босс уязвим только во время перезарядки.
 */

// Глобальные переменные для этапа 5
let finalBoss = null;
let stage5Initialized = false;
let stage5Exit = null;
let bossReloadTimer = 0;
let bossReloadDuration = 3.0; // секунды уязвимости
let bossAttackPattern = 0; // 0 - веер, 1 - ракеты, 2 - пулемёт
let bossAttackTimer = 0;
let bossAttackCooldown = 2.0;

// Константы
const BOSS_WIDTH = 100;
const BOSS_HEIGHT = 100;
const BOSS_MAX_HEALTH = 10000;
const BOSS_SPEED = 120;

/**
 * Инициализация этапа 5
 * @param {PlayerTank} player
 * @param {Array} walls
 * @param {Array} powerUps
 */
function initStage5(player, walls, powerUps) {
    player.skillPoints += 20;
    // Очищаем стены
    walls.length = 0;
    // Создаём арену - круглую площадку с внешним кольцом стен
    const arenaRadius = 400;
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;

    // Внешнее кольцо (непроходимая стена)
    let ringSegments = 16;
    for (let i = 0; i < ringSegments; i++) {
        const angle = (i / ringSegments) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * arenaRadius;
        const y = centerY + Math.sin(angle) * arenaRadius;
        walls.push(new Wall(x, y, 30, 30));
    }

    ringSegments += 18;
    for (let i = 0; i < ringSegments; i++) {
        const angle = (i / ringSegments) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * arenaRadius*2;
        const y = centerY + Math.sin(angle) * arenaRadius*2;
        walls.push(new Wall(x, y, 30, 30));
    }

    // Создаём босса в центре
    finalBoss = new FinalBoss(centerX, centerY);
    enemies.push(finalBoss);
    stage5Exit = null; // Выход появится после победы
    stage5Initialized = true;
    bossReloadTimer = 0;

    // Устанавливаем игрока в начальную позицию (рядом с центром)
    player.x = centerX - 200;
    player.y = centerY - 200;

    // Устанавливаем туман войны
    if (typeof fogOfWar !== 'undefined') {
        fogOfWar.setWalls(walls);
    }
}

/**
 * Обновление логики этапа 5
 * @param {number} deltaTime
 * @param {Array} enemies
 * @param {PlayerTank} player
 */

/**
 * Сброс этапа 5
 */
function resetStage5() {
    finalBoss = null;
    stage5Initialized = false;
    stage5Exit = null;
    bossReloadTimer = 0;
}

/**
 * Проверка победы на этапе 5
 * @returns {boolean} true если босс побеждён
 */
function checkStage5Victory() {
    return finalBoss && !finalBoss.active;
}

/**
 * Обработка столкновений пуль босса с игроком (вызывается из main.js)
 * @param {PlayerTank} player
 */
function checkStage5BulletCollisions(player) {
    if (!finalBoss || !finalBoss.active) return;

    // Проверка пуль
    finalBoss.bullets.forEach(bullet => {
        if (bullet.active && checkCollisionManager.checkCollision(bullet, player, bullet.radius, player.width / 2)) {
            player.takeDamage(bullet.damage, bullet.x, bullet.y, bullet.vx, bullet.vy);
            bullet.active = false;
        }
    });
}

/**
 * Обработка столкновений пуль игрока с боссом (вызывается из main.js)
 * @param {PlayerTank} player
 */
function checkStage5PlayerBulletCollisions(player) {
    if (!finalBoss || !finalBoss.active) return;
    player.bullets.forEach(bullet => {
        if (bullet.active && checkCollisionManager.checkCollision(bullet, finalBoss, bullet.radius, finalBoss.width / 2)) {
            // Наносим урон только если босс уязвим (в перезарядке)
            finalBoss.takeDamage(bullet.damage, bullet.x, bullet.y, bullet.vx, bullet.vy);
            bullet.active = false;
        }
    });
}