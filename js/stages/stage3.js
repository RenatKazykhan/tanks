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
    stage3HairpinFound = false;
    stage3HairpinEffect = 0;
    stage3Hairpin = null;
}

// --- Обновление этапа 3 (вызывается из gameLoop) ---
function updateStage3(deltaTime) {
    // Обновляем эффект свечения заколки
    stage3HairpinEffect += deltaTime * 3;

    // Обновляем заколку — пульсация и свечение
    if (stage3Hairpin && !stage3HairpinFound) {
        // Проверяем, подобрал ли игрок заколку
        const dx = player.x - stage3Hairpin.x;
        const dy = player.y - stage3Hairpin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
            stage3HairpinFound = true;
            // Показываем сообщение
            showHairpinFoundMessage();
        }
    }
}

// --- Отрисовка заколки ---
function drawStage3Hairpin() {
    if (!stage3Hairpin || stage3HairpinFound) return;

    // Проверяем видимость через туман войны
    if (!fogOfWar.isVisible(stage3Hairpin.x, stage3Hairpin.y, player.x, player.y)) return;

    const x = stage3Hairpin.x;
    const y = stage3Hairpin.y;
    const pulse = Math.sin(stage3HairpinEffect) * 0.3 + 0.7;
    const glow = Math.sin(stage3HairpinEffect * 1.5) * 0.2 + 0.5;

    ctx.save();
    ctx.translate(x, y);

    // Свечение вокруг заколки
    const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 30 * pulse);
    gradient.addColorStop(0, `rgba(255, 215, 0, ${glow})`);
    gradient.addColorStop(0.5, `rgba(255, 180, 50, ${glow * 0.4})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 30 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Лёгкая левитация
    const floatY = Math.sin(stage3HairpinEffect * 0.8) * 3;

    ctx.translate(0, floatY);

    // === Сама заколка (шпилька для волос) ===
    ctx.rotate(-Math.PI / 4); // Наклон

    // Основной стержень
    const stickGrad = ctx.createLinearGradient(-2, -18, 2, 18);
    stickGrad.addColorStop(0, '#ffd700');
    stickGrad.addColorStop(0.3, '#ffec80');
    stickGrad.addColorStop(0.7, '#daa520');
    stickGrad.addColorStop(1, '#b8860b');
    ctx.fillStyle = stickGrad;
    ctx.beginPath();
    ctx.roundRect(-1.5, -18, 3, 36, 1.5);
    ctx.fill();

    // Декоративная часть сверху — цветок
    // Лепестки
    ctx.fillStyle = '#ff69b4'; // Розовые лепестки
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(
            Math.cos(angle) * 5,
            -18 + Math.sin(angle) * 5,
            4, 2.5,
            angle,
            0, Math.PI * 2
        );
        ctx.fill();
    }

    // Сердцевина цветка
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, -18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Камушек в центре
    ctx.fillStyle = '#ff1493';
    ctx.beginPath();
    ctx.arc(0, -18, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Блик на камушке
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-0.5, -18.5, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Нижний конец заколки — заострённый
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.moveTo(-1.5, 18);
    ctx.lineTo(0, 22);
    ctx.lineTo(1.5, 18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Подсказка "?" над заколкой (если игрок близко)
    const distToPlayer = Math.sqrt(
        Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2)
    );
    if (distToPlayer < 150) {
        ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(stage3HairpinEffect * 2) * 0.3})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💍 Подобрать!', x, y - 35 + floatY);
    }
}

// --- Показ сообщения о находке заколки ---
function showHairpinFoundMessage() {
    // Создаём эффект частиц подбора
    for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 * i) / 40;
        visualEffects.particles.push(new Particle(
            stage3Hairpin.x + Math.cos(angle) * 10,
            stage3Hairpin.y + Math.sin(angle) * 10,
            '#ffd700'
        ));
    }

    // Показываем выход
    visualEffects.createExitEffect();
}

// --- Проверка выхода на этапе 3 ---
function checkStage3Exit() {
    if (currentStage !== 3) return;
    if (!stage3HairpinFound) return; // Выход открывается только после нахождения заколки

    const playerRect = {
        x: player.x - player.width / 2,
        y: player.y - player.height / 2,
        width: player.width,
        height: player.height
    };

    if (checkRectCollision(playerRect, stage3Exit)) {
        showVictory();
    }
}

// --- Условие победы на этапе 3 ---
function checkStage3Victory() {
    if (stage3HairpinFound) {
        checkStage3Exit();
    }
}

// --- Отрисовка выхода на этапе 3 ---
function drawStage3Exit() {
    if (!stage3HairpinFound) return;

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

// --- Отрисовка индикатора направления к заколке ---
function drawHairpinIndicator() {
    if (!stage3Hairpin || stage3HairpinFound) return;

    const dx = stage3Hairpin.x - player.x;
    const dy = stage3Hairpin.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Показываем индикатор только если заколка далеко
    if (dist < 300) return;

    const angle = Math.atan2(dy, dx);
    const indicatorDist = 100; // Расстояние от центра экрана

    // Экранные координаты (не мировые!)
    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;
    const indicatorX = screenCenterX + Math.cos(angle) * indicatorDist;
    const indicatorY = screenCenterY + Math.sin(angle) * indicatorDist;

    ctx.save();
    // Отменяем камеру
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Стрелка-индикатор
    ctx.translate(indicatorX, indicatorY);
    ctx.rotate(angle);

    // Стрелка
    const alpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-5, -8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();

    // Иконка рядом
    ctx.rotate(-angle);
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha + 0.2})`;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📌', 0, -15);

    // Расстояние
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = '10px Arial';
    ctx.fillText(`${Math.floor(dist)}m`, 0, 18);

    ctx.restore();
}
