// ===== ЭТАП 2: переменные =====
let stage2Exit = { x: 0, y: 0, width: 60, height: 60 };
let stage2Zones = []; // Зоны появления врагов

// ===== ЭТАП 2: инициализация / сброс =====
function resetStage2() {
    stage2Zones = [];
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
