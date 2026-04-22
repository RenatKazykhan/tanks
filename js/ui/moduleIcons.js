// === Иконки модулей танка (рисуются на canvas) ===
// Вызывается один раз при загрузке страницы

function drawModuleIcons() {
    drawTracksIcon();
    drawEngineIcon();
    drawHullIcon();
    drawGunIcon();
    drawTurretIcon();
    drawShellsIcon();
}

// ────────────────────────────────────────────────
// 🛤️ ГУСЕНИЦЫ — реальные траки с катками
// ────────────────────────────────────────────────
function drawTracksIcon() {
    const canvas = document.getElementById('iconTracks');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = 64, H = 64;
    c.clearRect(0, 0, W, H);

    // Цвета
    const trackColor = '#4a5568';
    const trackHighlight = '#718096';
    const wheelColor = '#2d3748';
    const wheelRim = '#4a9eff';
    const linkColor = '#2b4a2b';
    const linkBorder = '#3d6b3d';

    // Фоновое свечение
    const glow = c.createRadialGradient(32, 40, 5, 32, 40, 30);
    glow.addColorStop(0, 'rgba(74,158,255,0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // === НИЖНЯЯ ГУСЕНИЦА (основная) ===
    const trackY = 40;
    const trackH = 14;
    const trackX1 = 6, trackX2 = 58;
    const cornerR = 7;

    // Тень гусеницы
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.roundRect(trackX1 + 2, trackY + 2, trackX2 - trackX1, trackH, cornerR);
    c.fill();

    // Основной трак (корпус)
    const trackGrad = c.createLinearGradient(0, trackY, 0, trackY + trackH);
    trackGrad.addColorStop(0, '#5a6a5a');
    trackGrad.addColorStop(0.4, '#3a4a3a');
    trackGrad.addColorStop(1, '#1a2a1a');
    c.fillStyle = trackGrad;
    c.beginPath();
    c.roundRect(trackX1, trackY, trackX2 - trackX1, trackH, cornerR);
    c.fill();

    // Обводка трака
    c.strokeStyle = '#2d4a2d';
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(trackX1, trackY, trackX2 - trackX1, trackH, cornerR);
    c.stroke();

    // === ЗВЕНЬЯ ГУСЕНИЦЫ (траки) ===
    const linkCount = 9;
    const linkW = (trackX2 - trackX1 - 8) / linkCount;
    c.fillStyle = '#4a8a4a';
    c.strokeStyle = '#2d5a2d';
    c.lineWidth = 1;

    for (let i = 0; i < linkCount; i++) {
        const lx = trackX1 + 4 + i * linkW;
        const ly = trackY + 3;
        const lh = trackH - 6;

        // Звено
        c.fillStyle = i % 2 === 0 ? '#4a7a4a' : '#3a6a3a';
        c.beginPath();
        c.roundRect(lx + 1, ly, linkW - 2, lh, 2);
        c.fill();
        c.stroke();

        // Засечки (рёбра трака)
        c.strokeStyle = '#5a9a5a';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(lx + linkW / 2, ly + 1);
        c.lineTo(lx + linkW / 2, ly + lh - 1);
        c.stroke();
        c.strokeStyle = '#2d5a2d';
        c.lineWidth = 1;
    }

    // === ОПОРНЫЕ КАТКИ ===
    const wheelY = trackY + trackH / 2;
    const wheelPositions = [12, 24, 36, 48, 58]; // Нечётное = больший каток (передний/задний)
    const wheelSizes    = [7,  6,  6,  6,  7];

    wheelPositions.forEach((wx, i) => {
        const wr = wheelSizes[i];

        // Тень катка
        c.fillStyle = 'rgba(0,0,0,0.4)';
        c.beginPath();
        c.arc(wx + 1, wheelY + 1, wr, 0, Math.PI * 2);
        c.fill();

        // Резина катка
        const wheelGrad = c.createRadialGradient(wx - 2, wheelY - 2, 1, wx, wheelY, wr);
        wheelGrad.addColorStop(0, '#6a7a8a');
        wheelGrad.addColorStop(0.6, '#2d3748');
        wheelGrad.addColorStop(1, '#1a2030');
        c.fillStyle = wheelGrad;
        c.beginPath();
        c.arc(wx, wheelY, wr, 0, Math.PI * 2);
        c.fill();

        // Обод (голубая полоска)
        c.strokeStyle = wheelRim;
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(wx, wheelY, wr - 1.5, 0, Math.PI * 2);
        c.stroke();

        // Ступица (центр)
        c.fillStyle = '#4a9eff';
        c.beginPath();
        c.arc(wx, wheelY, 2, 0, Math.PI * 2);
        c.fill();
    });

    // === ВЕРХНЯЯ ГУСЕНИЦА (сверху катится) ===
    const topTrackY = 22;
    const topGrad = c.createLinearGradient(0, topTrackY, 0, topTrackY + 6);
    topGrad.addColorStop(0, '#4a6a4a');
    topGrad.addColorStop(1, '#2d4a2d');
    c.fillStyle = topGrad;
    c.beginPath();
    c.roundRect(trackX1 + 5, topTrackY, trackX2 - trackX1 - 10, 6, 3);
    c.fill();

    // Звенья верхней гусеницы
    for (let i = 0; i < 6; i++) {
        const lx = trackX1 + 7 + i * 8;
        c.fillStyle = i % 2 === 0 ? '#5a7a5a' : '#3d5a3d';
        c.beginPath();
        c.roundRect(lx, topTrackY + 1, 6, 4, 1.5);
        c.fill();
    }

    // Блик сверху
    c.strokeStyle = 'rgba(100,200,100,0.15)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(trackX1 + 8, topTrackY + 1);
    c.lineTo(trackX2 - 8, topTrackY + 1);
    c.stroke();

    // === ТЕКСТОВАЯ ПОДСКАЗКА (зубцы трака сбоку) ===
    // Стрелка движения
    c.strokeStyle = 'rgba(74,222,128,0.4)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(20, 14); c.lineTo(32, 10); c.lineTo(44, 14);
    c.stroke();
}

// ────────────────────────────────────────────────
// ⚙️ МОТОР — двигатель с поршнями и шестернями
// ────────────────────────────────────────────────
function drawEngineIcon() {
    const canvas = document.getElementById('iconEngine');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = 64, H = 64;
    c.clearRect(0, 0, W, H);

    // Фон (тепловое свечение)
    const glow = c.createRadialGradient(32, 32, 4, 32, 32, 28);
    glow.addColorStop(0, 'rgba(255, 120, 30, 0.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // === КОРПУС ДВИГАТЕЛЯ ===
    const engineGrad = c.createLinearGradient(10, 18, 54, 52);
    engineGrad.addColorStop(0, '#6b7280');
    engineGrad.addColorStop(0.4, '#4b5563');
    engineGrad.addColorStop(1, '#1f2937');
    c.fillStyle = engineGrad;
    c.beginPath();
    c.roundRect(14, 22, 36, 26, 5);
    c.fill();

    c.strokeStyle = '#374151';
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(14, 22, 36, 26, 5);
    c.stroke();

    // Блик сверху двигателя
    c.fillStyle = 'rgba(255,255,255,0.08)';
    c.beginPath();
    c.roundRect(15, 23, 34, 6, 3);
    c.fill();

    // === ПОРШНИ (3 штуки) ===
    const pistonColors = ['#e67e22', '#f39c12', '#e67e22'];
    const pistonX = [20, 32, 44];
    for (let i = 0; i < 3; i++) {
        const px = pistonX[i];
        const offset = Math.sin((i * Math.PI * 2) / 3) * 2; // Фазовый сдвиг

        // Шток поршня
        c.fillStyle = '#9ca3af';
        c.fillRect(px - 2, 10 + offset, 4, 14);

        // Поршень
        const pGrad = c.createLinearGradient(px - 5, 0, px + 5, 0);
        pGrad.addColorStop(0, pistonColors[i]);
        pGrad.addColorStop(0.5, '#fbbf24');
        pGrad.addColorStop(1, '#d97706');
        c.fillStyle = pGrad;
        c.beginPath();
        c.roundRect(px - 6, 10 + offset, 12, 8, 2);
        c.fill();
        c.strokeStyle = '#92400e';
        c.lineWidth = 1;
        c.stroke();

        // Цилиндр (отверстие в блоке)
        c.fillStyle = '#111827';
        c.beginPath();
        c.roundRect(px - 5, 22, 10, 8, 1);
        c.fill();
    }

    // === БОЛЬШАЯ ШЕСТЕРНЯ (справа) ===
    drawGear(c, 50, 32, 10, 8, '#4a9eff', '#1d4ed8');

    // === МАЛЕНЬКАЯ ШЕСТЕРНЯ (левее) ===
    drawGear(c, 14, 44, 7, 6, '#60a5fa', '#2563eb');

    // === ВЫХЛОПНЫЕ ТРУБЫ ===
    c.fillStyle = '#374151';
    c.beginPath(); c.roundRect(6, 28, 8, 5, 2); c.fill();
    c.beginPath(); c.roundRect(6, 36, 8, 5, 2); c.fill();
    c.strokeStyle = '#4b5563'; c.lineWidth = 1;
    c.stroke();

    // Дым
    for (let i = 0; i < 2; i++) {
        c.strokeStyle = `rgba(150,150,150,${0.3 - i * 0.1})`;
        c.lineWidth = 2 - i * 0.5;
        c.beginPath();
        c.moveTo(6, 30 + i * 8);
        c.bezierCurveTo(2, 28 + i * 8, 0, 24 + i * 8, 4, 20 + i * 8);
        c.stroke();
    }

    // === ИЗМЕРИТЕЛЬНАЯ ШКАЛА (спидометр) ===
    c.strokeStyle = 'rgba(74,222,128,0.5)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(32, 44, 8, Math.PI * 0.8, Math.PI * 2.2);
    c.stroke();
    // Стрелка
    c.strokeStyle = '#4ade80';
    c.lineWidth = 1.5;
    c.save();
    c.translate(32, 44);
    c.rotate(Math.PI * 1.6);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -6); c.stroke();
    c.restore();
}

function drawGear(c, cx, cy, outerR, innerR, colorOuter, colorInner) {
    const teeth = 8;
    c.save();
    c.translate(cx, cy);

    // Зубья шестерни
    const gearGrad = c.createRadialGradient(0, -2, 1, 0, 0, outerR);
    gearGrad.addColorStop(0, colorOuter);
    gearGrad.addColorStop(1, colorInner);

    c.beginPath();
    for (let i = 0; i < teeth; i++) {
        const a1 = (i / teeth) * Math.PI * 2 - Math.PI / (teeth * 2);
        const a2 = ((i + 0.4) / teeth) * Math.PI * 2 - Math.PI / (teeth * 2);
        const a3 = ((i + 0.6) / teeth) * Math.PI * 2 - Math.PI / (teeth * 2);
        const a4 = ((i + 1) / teeth) * Math.PI * 2 - Math.PI / (teeth * 2);

        if (i === 0) c.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
        c.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
        c.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
        c.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
    }
    c.closePath();
    c.fillStyle = gearGrad;
    c.fill();
    c.strokeStyle = colorInner;
    c.lineWidth = 0.8;
    c.stroke();

    // Центральный круг
    c.fillStyle = '#1e293b';
    c.beginPath();
    c.arc(0, 0, innerR * 0.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = colorOuter;
    c.lineWidth = 1;
    c.stroke();

    c.restore();
}

// ────────────────────────────────────────────────
// 🛡️ КОРПУС — бронеплита с заклёпками
// ────────────────────────────────────────────────
function drawHullIcon() {
    const canvas = document.getElementById('iconHull');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = 64, H = 64;
    c.clearRect(0, 0, W, H);

    // Свечение
    const glow = c.createRadialGradient(32, 32, 5, 32, 32, 28);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // === КОРПУС ТАНКА (вид сверху, упрощённый) ===
    // Тень
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.moveTo(13, 17); c.lineTo(51, 17);
    c.lineTo(55, 32); c.lineTo(51, 47);
    c.lineTo(13, 47); c.lineTo(9, 32);
    c.closePath();
    c.fill();

    // Основной корпус — броня
    const armorGrad = c.createLinearGradient(9, 15, 55, 49);
    armorGrad.addColorStop(0, '#78716c');
    armorGrad.addColorStop(0.3, '#57534e');
    armorGrad.addColorStop(0.7, '#44403c');
    armorGrad.addColorStop(1, '#292524');
    c.fillStyle = armorGrad;
    c.beginPath();
    c.moveTo(11, 15); c.lineTo(53, 15);
    c.lineTo(57, 32); c.lineTo(53, 49);
    c.lineTo(11, 49); c.lineTo(7, 32);
    c.closePath();
    c.fill();

    // Линии броневых пластин
    c.strokeStyle = 'rgba(120,110,100,0.5)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(11, 15); c.lineTo(53, 15); c.stroke();
    c.beginPath(); c.moveTo(11, 49); c.lineTo(53, 49); c.stroke();
    c.beginPath(); c.moveTo(20, 15); c.lineTo(20, 49); c.stroke();
    c.beginPath(); c.moveTo(44, 15); c.lineTo(44, 49); c.stroke();

    // Обводка корпуса
    c.strokeStyle = '#a8a29e';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(11, 15); c.lineTo(53, 15);
    c.lineTo(57, 32); c.lineTo(53, 49);
    c.lineTo(11, 49); c.lineTo(7, 32);
    c.closePath();
    c.stroke();

    // === ЗАКЛЁПКИ ===
    const rivets = [
        [15, 20], [25, 20], [39, 20], [49, 20],
        [15, 44], [25, 44], [39, 44], [49, 44],
        [10, 32], [54, 32],
        [20, 32], [32, 20], [32, 44],
    ];
    rivets.forEach(([rx, ry]) => {
        const rGrad = c.createRadialGradient(rx - 1, ry - 1, 0, rx, ry, 2.5);
        rGrad.addColorStop(0, '#d6d3d1');
        rGrad.addColorStop(0.5, '#78716c');
        rGrad.addColorStop(1, '#1c1917');
        c.fillStyle = rGrad;
        c.beginPath();
        c.arc(rx, ry, 2.5, 0, Math.PI * 2);
        c.fill();
    });

    // === СЕРДЕЧКО БРОНИ (иконка HP) ===
    c.fillStyle = 'rgba(239,68,68,0.8)';
    c.font = 'bold 14px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('♥', 32, 32);

    // Блик
    c.fillStyle = 'rgba(255,255,255,0.07)';
    c.beginPath();
    c.moveTo(11, 15); c.lineTo(53, 15);
    c.lineTo(53, 25); c.lineTo(11, 25);
    c.closePath();
    c.fill();
}

// ────────────────────────────────────────────────
// 🔫 ОРУДИЕ — пушечный ствол с дульным тормозом
// ────────────────────────────────────────────────
function drawGunIcon() {
    const canvas = document.getElementById('iconGun');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = 64, H = 64;
    c.clearRect(0, 0, W, H);

    // Свечение (выстрел)
    const glow = c.createRadialGradient(56, 32, 2, 56, 32, 20);
    glow.addColorStop(0, 'rgba(255, 200, 50, 0.2)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // === КАЗЁННАЯ ЧАСТЬ (задняя) ===
    const breechGrad = c.createLinearGradient(0, 24, 0, 42);
    breechGrad.addColorStop(0, '#9ca3af');
    breechGrad.addColorStop(0.5, '#4b5563');
    breechGrad.addColorStop(1, '#1f2937');
    c.fillStyle = breechGrad;
    c.beginPath();
    c.roundRect(5, 24, 22, 18, 4);
    c.fill();
    c.strokeStyle = '#374151'; c.lineWidth = 1.5; c.stroke();

    // === СТВОЛ ===
    const barrelGrad = c.createLinearGradient(0, 28, 0, 38);
    barrelGrad.addColorStop(0, '#6b7280');
    barrelGrad.addColorStop(0.5, '#374151');
    barrelGrad.addColorStop(1, '#111827');
    c.fillStyle = barrelGrad;
    c.beginPath();
    c.roundRect(26, 28, 28, 10, 3);
    c.fill();
    c.strokeStyle = '#4b5563'; c.lineWidth = 1;
    c.beginPath();
    c.roundRect(26, 28, 28, 10, 3);
    c.stroke();

    // Ребро жёсткости ствола
    c.strokeStyle = 'rgba(100,110,120,0.4)';
    c.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const rx = 28 + i * 7;
        c.beginPath(); c.moveTo(rx, 28); c.lineTo(rx, 38); c.stroke();
    }

    // === ДУЛЬНЫЙ ТОРМОЗ ===
    const muzzleGrad = c.createLinearGradient(0, 26, 0, 40);
    muzzleGrad.addColorStop(0, '#9ca3af');
    muzzleGrad.addColorStop(1, '#374151');
    c.fillStyle = muzzleGrad;
    c.beginPath();
    c.roundRect(52, 26, 8, 14, 3);
    c.fill();
    c.strokeStyle = '#6b7280'; c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(52, 26, 8, 14, 3);
    c.stroke();

    // Щели дульного тормоза
    c.strokeStyle = '#1f2937'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(53, 29); c.lineTo(59, 29); c.stroke();
    c.beginPath(); c.moveTo(53, 33); c.lineTo(59, 33); c.stroke();
    c.beginPath(); c.moveTo(53, 37); c.lineTo(59, 37); c.stroke();

    // Ствол (блик сверху)
    c.fillStyle = 'rgba(255,255,255,0.08)';
    c.beginPath();
    c.roundRect(26, 28, 28, 3, 2);
    c.fill();

    // === ВСПЫШКА ВЫСТРЕЛА ===
    const flashGrad = c.createRadialGradient(61, 33, 1, 61, 33, 8);
    flashGrad.addColorStop(0, 'rgba(255,240,100,0.9)');
    flashGrad.addColorStop(0.4, 'rgba(255,150,30,0.5)');
    flashGrad.addColorStop(1, 'rgba(255,80,0,0)');
    c.fillStyle = flashGrad;
    c.beginPath();
    c.arc(61, 33, 8, 0, Math.PI * 2);
    c.fill();

    // Лучи вспышки
    const flashRays = [[-0.3, 1], [0.3, 1], [0, 0.7]];
    flashRays.forEach(([da, scale]) => {
        c.strokeStyle = 'rgba(255,220,80,0.6)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(61, 33);
        c.lineTo(61 + Math.cos(da) * 10 * scale, 33 + Math.sin(da) * 6 * scale);
        c.stroke();
    });

    // === МАСКА ОРУДИЯ (mantlet) ===
    c.fillStyle = '#4b5563';
    c.beginPath();
    c.arc(26, 33, 7, -Math.PI / 2, Math.PI / 2);
    c.fill();
    c.strokeStyle = '#6b7280'; c.lineWidth = 1;
    c.stroke();

    // Болт на казённике
    c.fillStyle = '#d1d5db';
    c.beginPath(); c.arc(16, 33, 3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#6b7280'; c.lineWidth = 0.8; c.stroke();
}

// ────────────────────────────────────────────────
// 🗼 БАШНЯ — купол башни с перископом
// ────────────────────────────────────────────────
function drawTurretIcon() {
    const canvas = document.getElementById('iconTurret');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = 64, H = 64;
    c.clearRect(0, 0, W, H);

    // Свечение
    const glow = c.createRadialGradient(32, 34, 5, 32, 34, 26);
    glow.addColorStop(0, 'rgba(34,211,238,0.1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // === ОСНОВАНИЕ БАШНИ (кольцо) ===
    const baseGrad = c.createLinearGradient(8, 44, 56, 54);
    baseGrad.addColorStop(0, '#6b7280');
    baseGrad.addColorStop(1, '#374151');
    c.fillStyle = baseGrad;
    c.beginPath();
    c.ellipse(32, 50, 22, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#4b5563'; c.lineWidth = 1.5; c.stroke();

    // === КУПОЛ БАШНИ ===
    const domeGrad = c.createRadialGradient(26, 28, 4, 32, 36, 22);
    domeGrad.addColorStop(0, '#9ca3af');
    domeGrad.addColorStop(0.4, '#6b7280');
    domeGrad.addColorStop(0.8, '#374151');
    domeGrad.addColorStop(1, '#1f2937');
    c.fillStyle = domeGrad;
    c.beginPath();
    c.ellipse(32, 50, 20, 6, 0, Math.PI, Math.PI * 2); // Нижняя полуэллипс
    c.lineTo(52, 35);
    c.bezierCurveTo(52, 14, 12, 14, 12, 35);
    c.closePath();
    c.fill();

    // Обводка купола
    c.strokeStyle = '#6b7280'; c.lineWidth = 2;
    c.beginPath();
    c.bezierCurveTo(12, 50, 12, 14, 32, 14);
    c.bezierCurveTo(52, 14, 52, 50, 52, 50);
    c.stroke();

    // === СКОСЫ (ugol броня) ===
    c.strokeStyle = 'rgba(130,140,150,0.3)';
    c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.ellipse(32, 40 + i * 4, 18 - i * 3, 4 - i, 0, 0, Math.PI * 2);
        c.stroke();
    }

    // === КОМАНДИРСКИЙ ЛЮОК ===
    const hatchGrad = c.createRadialGradient(32, 26, 2, 32, 26, 8);
    hatchGrad.addColorStop(0, '#9ca3af');
    hatchGrad.addColorStop(1, '#374151');
    c.fillStyle = hatchGrad;
    c.beginPath(); c.arc(32, 26, 8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#4b5563'; c.lineWidth = 2; c.stroke();

    // Ручка люка
    c.strokeStyle = '#d1d5db'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(28, 26); c.lineTo(36, 26); c.stroke();

    // === ПЕРИСКОП ===
    c.fillStyle = '#4b5563';
    c.beginPath(); c.roundRect(29, 14, 6, 9, 2); c.fill();
    c.strokeStyle = '#6b7280'; c.lineWidth = 1; c.stroke();

    // Линза перископа
    c.fillStyle = '#22d3ee';
    c.beginPath(); c.arc(32, 18, 2.5, 0, Math.PI * 2); c.fill();
    // Блик линзы
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath(); c.arc(31, 17, 1, 0, Math.PI * 2); c.fill();

    // === АНТЕННА ===
    c.strokeStyle = '#9ca3af'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(44, 30); c.lineTo(50, 10); c.stroke();
    c.fillStyle = '#ef4444';
    c.beginPath(); c.arc(50, 10, 2, 0, Math.PI * 2); c.fill();

    // Блик купола
    c.fillStyle = 'rgba(255,255,255,0.06)';
    c.beginPath();
    c.moveTo(15, 35); c.bezierCurveTo(14, 18, 32, 14, 42, 17);
    c.bezierCurveTo(35, 14, 20, 17, 15, 35);
    c.fill();
}

// ────────────────────────────────────────────────
// 💥 СНАРЯДЫ — бронебойный снаряд в полёте
// ────────────────────────────────────────────────
function drawShellsIcon() {
    const canvas = document.getElementById('iconShells');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = 64, H = 64;
    c.clearRect(0, 0, W, H);

    // Свечение трассера
    const glow = c.createLinearGradient(0, 32, 64, 32);
    glow.addColorStop(0, 'rgba(0,0,0,0)');
    glow.addColorStop(0.6, 'rgba(255,100,30,0.12)');
    glow.addColorStop(1, 'rgba(255,220,50,0.25)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // === ТРАССЕР (дымный след) ===
    const trailGrad = c.createLinearGradient(4, 32, 44, 32);
    trailGrad.addColorStop(0, 'rgba(150,120,80,0)');
    trailGrad.addColorStop(0.3, 'rgba(200,150,100,0.3)');
    trailGrad.addColorStop(0.7, 'rgba(255,150,30,0.5)');
    trailGrad.addColorStop(1, 'rgba(255,100,0,0)');

    c.fillStyle = trailGrad;
    c.beginPath();
    c.moveTo(5, 32);
    c.lineTo(42, 27);
    c.lineTo(42, 37);
    c.closePath();
    c.fill();

    // Дымовые облачка
    for (let i = 0; i < 4; i++) {
        const sx = 8 + i * 9;
        const sy = 30 + (i % 2 === 0 ? -3 : 3);
        const sr = 4 + i * 1.5;
        c.fillStyle = `rgba(180,130,80,${0.08 + i * 0.04})`;
        c.beginPath();
        c.arc(sx, sy, sr, 0, Math.PI * 2);
        c.fill();
    }

    // === КОРПУС СНАРЯДА ===
    const shellGrad = c.createLinearGradient(0, 27, 0, 39);
    shellGrad.addColorStop(0, '#d1d5db');
    shellGrad.addColorStop(0.3, '#9ca3af');
    shellGrad.addColorStop(0.7, '#6b7280');
    shellGrad.addColorStop(1, '#374151');
    c.fillStyle = shellGrad;
    c.beginPath();
    c.moveTo(58, 32); // Острый нос
    c.lineTo(44, 27);
    c.lineTo(24, 27);
    c.lineTo(24, 37);
    c.lineTo(44, 37);
    c.closePath();
    c.fill();
    c.strokeStyle = '#4b5563'; c.lineWidth = 1;
    c.stroke();

    // === МЕДНЫЙ ПОЯСОК (ведущий) ===
    const bandGrad = c.createLinearGradient(0, 27, 0, 37);
    bandGrad.addColorStop(0, '#fcd34d');
    bandGrad.addColorStop(0.5, '#d97706');
    bandGrad.addColorStop(1, '#92400e');
    c.fillStyle = bandGrad;
    c.fillRect(33,27,5,10);
    c.strokeStyle = '#92400e'; c.lineWidth = 0.8;
    c.strokeRect(33,27,5,10);

    // === ГИЛЬЗА ===
    const caseGrad = c.createLinearGradient(0, 28, 0, 36);
    caseGrad.addColorStop(0, '#fbbf24');
    caseGrad.addColorStop(0.4, '#d97706');
    caseGrad.addColorStop(1, '#78350f');
    c.fillStyle = caseGrad;
    c.beginPath();
    c.roundRect(22, 28, 13, 8, 1);
    c.fill();
    c.strokeStyle = '#92400e'; c.lineWidth = 1; c.stroke();

    // === КАПСЮЛЬ ===
    c.fillStyle = '#374151';
    c.beginPath();
    c.roundRect(22, 29.5, 4, 5, 1);
    c.fill();
    c.fillStyle = '#fbbf24';
    c.beginPath();
    c.arc(24, 32, 1.5, 0, Math.PI * 2);
    c.fill();

    // === КОНЧИК СНАРЯДА (AP cap) ===
    c.fillStyle = '#1f2937';
    c.beginPath();
    c.moveTo(58, 32);
    c.lineTo(51, 28);
    c.lineTo(49, 32);
    c.lineTo(51, 36);
    c.closePath();
    c.fill();
    c.strokeStyle = '#374151'; c.lineWidth = 0.8; c.stroke();

    // Блик на снаряде
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.beginPath();
    c.moveTo(56, 31); c.lineTo(44, 28); c.lineTo(35, 28); c.lineTo(35, 30); c.lineTo(44, 30); c.lineTo(56, 33);
    c.closePath();
    c.fill();

    // Скорость (стрелки)
    c.strokeStyle = 'rgba(74,222,128,0.4)';
    c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
        const sx = 58 + i * 5, sy = 32;
        c.beginPath();
        c.moveTo(sx, sy - 3); c.lineTo(sx + 3, sy); c.lineTo(sx, sy + 3);
        c.stroke();
    }
}

// Вызываем после загрузки DOM
document.addEventListener('DOMContentLoaded', drawModuleIcons);
