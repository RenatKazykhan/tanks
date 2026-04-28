// ===== ЭТАП 3: Пустынные лабиринты — Поиск заколки жены =====

// --- Переменные ---
let stage3Enemies = [];
let stage3Exit = { x: 0, y: 0, width: 60, height: 60 };
let stage3Zones = [];
let stage3Hairpin = null;       // Объект заколки
let stage3HairpinFound = false; // Нашли ли заколку
let stage3HairpinEffect = 0;   // Эффект свечения заколки

// --- Инициализация / Сброс ---
function resetStage3() {
    stage3Enemies = [];
    stage3Zones = [];
}

// --- Проверка выхода на этапе 3 ---
function checkStage3Exit() {
    if (enemies.length === 0 && stage3Zones.every(zone => zone.activated === true)) {
        const playerRect = {
            x: player.x - player.width / 2,
            y: player.y - player.height / 2,
            width: player.width,
            height: player.height
        };

        if (checkRectCollision(playerRect, stage3Exit)) {
            showVictory();
        }
        visualEffects.createExitEffect();
    }
}

// --- Отрисовка выхода на этапе 3 ---
function drawStage3Exit() {
    const x = stage3Exit.x;
    const y = stage3Exit.y;
    const w = stage3Exit.width;
    const h = stage3Exit.height;

    // Пульсирующее свечение
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

    ctx.save();

    // Свечение
    const glow = ctx.createRadialGradient(
        x + w / 2, y + h / 2, 10,
        x + w / 2, y + h / 2, 50
    );
    glow.addColorStop(0, `rgba(0, 255, 100, ${pulse * 0.5})`);
    glow.addColorStop(1, 'rgba(0, 255, 100, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 20, y - 20, w + 40, h + 40);

    // Рамка выхода
    ctx.strokeStyle = `rgba(0, 255, 100, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Стрелка вверх
    ctx.fillStyle = `rgba(0, 255, 100, ${pulse})`;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🚪', x + w / 2, y + h / 2 + 8);

    ctx.restore();
}

