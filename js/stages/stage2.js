// ===== ЭТАП 2: переменные =====
let stage2Enemies = [];
let stage2Turrets = [];
let stage2Exit = { x: 0, y: 0, width: 60, height: 60 };
let stage2Zones = []; // Зоны появления врагов

// ===== ЭТАП 2: инициализация / сброс =====
function resetStage2() {
    stage2Enemies = [];
    stage2Turrets = [];
    stage2Zones = [];
}

// ===== ЭТАП 2: обновление турелей (вызывается из gameLoop) =====
function updateStage2Turrets(deltaTime) {
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

// ===== ЭТАП 2: отрисовка турелей (вызывается из gameLoop) =====
function drawStage2Turrets() {
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

// ===== ЭТАП 2: проверка выхода =====
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

// ===== ЭТАП 2: условие победы (вызывается из checkVictoryCondition) =====
function checkStage2Victory() {
    if (enemies.length === 0 && stage2Zones.every(zone => zone.activated === true)) {
        // Показываем выход
        visualEffects.createExitEffect();
        checkStage2Exit();
    }
}
