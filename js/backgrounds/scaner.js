// Глобальные переменные для анимации
let animationTime = 0;
let particles = [];

// Инициализация частиц
function initParticles() {
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
}

// Улучшенная функция для рисования эффектов
function drawEffects() {
    animationTime += 0.01;
    
    // 1. Градиентный фон
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(10, 25, 10, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Анимированная сетка с перспективой
    drawAnimatedGrid();
    
    // 3. Летающие частицы
    drawParticles();
    
    // 4. Сканирующая линия
    drawScanLine();
    
    // 5. Угловые индикаторы
    drawCornerIndicators();
    
    // 6. Помехи/шум
    drawNoise();
}

// Анимированная сетка
function drawAnimatedGrid() {
    ctx.save();
    
    // Основная сетка
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    const offset = (animationTime * 10) % gridSize;
    
    // Вертикальные линии с эффектом движения
    for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, canvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        
        // Пульсирующая яркость
        const brightness = Math.sin(animationTime + y / 100) * 0.1 + 0.15;
        ctx.strokeStyle = `rgba(0, 255, 0, ${brightness})`;
        ctx.stroke();
    }
    
    // Диагональные акценты
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
    for (let i = -canvas.height; i < canvas.width + canvas.height; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - canvas.height, canvas.height);
        ctx.stroke();
    }
    
    ctx.restore();
}

// Летающие частицы
function drawParticles() {
    ctx.save();
    
    particles.forEach(particle => {
        // Обновление позиции
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Переход через границы
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Рисование частицы
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 0, ${particle.opacity})`;
        ctx.fill();
        
        // Свечение
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        ctx.fill();
    });
    
    ctx.restore();
}

// Сканирующая линия
function drawScanLine() {
    ctx.save();
    
    const scanY = (animationTime * 100) % (canvas.height + 100) - 50;
    
    // Градиент для линии сканирования
    const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    scanGradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
    scanGradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)');
    scanGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    
    ctx.fillStyle = scanGradient;
    ctx.fillRect(0, scanY - 20, canvas.width, 40);
    
    // Яркая центральная линия
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(canvas.width, scanY);
    ctx.stroke();
    
    ctx.restore();
}

// Угловые индикаторы
function drawCornerIndicators() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    ctx.lineWidth = 2;
    
    const cornerSize = 30;
    const margin = 20;
    
    // Верхний левый
    ctx.beginPath();
    ctx.moveTo(margin, margin + cornerSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + cornerSize, margin);
    ctx.stroke();
    
    // Верхний правый
    ctx.beginPath();
    ctx.moveTo(canvas.width - margin - cornerSize, margin);
    ctx.lineTo(canvas.width - margin, margin);
    ctx.lineTo(canvas.width - margin, margin + cornerSize);
    ctx.stroke();
    
    // Нижний левый
    ctx.beginPath();
    ctx.moveTo(margin, canvas.height - margin - cornerSize);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(margin + cornerSize, canvas.height - margin);
    ctx.stroke();
    
    // Нижний правый
    ctx.beginPath();
    ctx.moveTo(canvas.width - margin - cornerSize, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin - cornerSize);
    ctx.stroke();
    
    // Мигающие точки в углах
    const blinkOpacity = Math.sin(animationTime * 5) * 0.3 + 0.5;
    ctx.fillStyle = `rgba(0, 255, 0, ${blinkOpacity})`;
    
    [
        [margin, margin],
        [canvas.width - margin, margin],
        [margin, canvas.height - margin],
        [canvas.width - margin, canvas.height - margin]
    ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.restore();
}

// Эффект помех
function drawNoise() {
    ctx.save();
    
    // Случайные линии помех
    for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.98) {
            const y = Math.random() * canvas.height;
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.lineWidth = Math.random() * 3 + 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Статичный шум
    if (Math.random() > 0.95) {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.3})`;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    ctx.restore();
}

// Не забудьте вызвать initParticles() при инициализации игры
initParticles();