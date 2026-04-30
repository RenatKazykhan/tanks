class WallTurret {
    constructor(x, y, direction = 'right') {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.radius = this.width / 2;
        this.isWallTurret = true;

        this.direction = direction;
        switch (direction) {
            case 'left':
                this.currentAngle = Math.PI;
                break;
            case 'right':
                this.currentAngle = 0;
                break;
            case 'up':
                this.currentAngle = -Math.PI / 2;
                break;
            case 'down':
                this.currentAngle = Math.PI / 2;
                break;
            default:
                this.currentAngle = 0;
        }

        this.health = 30000;
        this.maxHealth = 30000;
        this.active = true;
        this.bullets = [];
        this.lastShot = Date.now();
        this.shotCooldownMin = 500;   // 0.5 секунды
        this.shotCooldownMax = 2000;  // 2 секунды
        this.shotCooldown = this._randomCooldown();
        this.damage = 100;
        this.bulletSpeed = 1000;
        this.activationRange = 800; // дальность обнаружения игрока

        // Анимация
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.muzzleFlash = 0;
        this.recoilOffset = 0;
        this.scannerAngle = 0;
        this.glowIntensity = 0;
        this.particleTime = 0;
    }

    _distanceToPlayer(playerX, playerY) {
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    _randomCooldown() {
        return this.shotCooldownMin + Math.random() * (this.shotCooldownMax - this.shotCooldownMin);
    }

    update(playerX, playerY, deltaTime) {
        if (!this.active) return;

        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });

        // Проверяем дальность до игрока
        const dist = this._distanceToPlayer(playerX, playerY);
        this.playerInRange = dist <= this.activationRange;

        if (!this.playerInRange) return;

        // Анимации
        this.pulsePhase += deltaTime * 3;
        this.scannerAngle += deltaTime * 2;
        this.particleTime += deltaTime;

        // Плавное затухание вспышки
        if (this.muzzleFlash > 0) {
            this.muzzleFlash -= deltaTime * 8;
            if (this.muzzleFlash < 0) this.muzzleFlash = 0;
        }

        // Плавный возврат отдачи
        if (this.recoilOffset > 0) {
            this.recoilOffset -= deltaTime * 40;
            if (this.recoilOffset < 0) this.recoilOffset = 0;
        }

        // Пульсация свечения
        this.glowIntensity = 0.3 + Math.sin(this.pulsePhase) * 0.15;

        // Стрельба со случайным интервалом
        if (Date.now() - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = Date.now();
            this.shotCooldown = this._randomCooldown(); // новый случайный интервал
        }
    }

    shoot(targetX = null, targetY = null) {
        const bulletX = this.x + Math.cos(this.currentAngle) * 20;
        const bulletY = this.y + Math.sin(this.currentAngle) * 20;

        this.bullets.push(new Bullet2(
            bulletX, bulletY,
            this.damage,
            this.currentAngle,
            'enemy',
            this.bulletSpeed
        ));

        // Эффекты выстрела
        this.muzzleFlash = 1.0;
        this.recoilOffset = 5;
    }

    draw() {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // ===== ТЕНЬ ПОД ТУРЕЛЬЮ =====
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 3, this.radius + 2, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ===== ВНЕШНЕЕ СВЕЧЕНИЕ (АУРА) =====
        const healthRatio = this.health / this.maxHealth;
        const auraColor = healthRatio > 0.5
            ? `rgba(255, 60, 60, ${this.glowIntensity * 0.3})`
            : `rgba(255, 30, 0, ${this.glowIntensity * 0.5})`;

        const auraGrad = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 2.2);
        auraGrad.addColorStop(0, auraColor);
        auraGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // ===== ОСНОВАНИЕ (БРОНЕПЛИТА) =====
        // Основная форма — скруглённый квадрат
        const r = this.radius;
        const cornerR = 5;
        this._roundRect(-r, -r, this.width, this.height, cornerR);

        // Градиент основания
        const baseGrad = ctx.createLinearGradient(-r, -r, r, r);
        baseGrad.addColorStop(0, '#4a4a52');
        baseGrad.addColorStop(0.3, '#5c5c66');
        baseGrad.addColorStop(0.5, '#6a6a75');
        baseGrad.addColorStop(0.7, '#5c5c66');
        baseGrad.addColorStop(1, '#3a3a42');
        ctx.fillStyle = baseGrad;
        ctx.fill();

        // Обводка основания
        ctx.strokeStyle = '#2a2a30';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Внутренний блик (металлический отсвет)
        this._roundRect(-r + 2, -r + 2, this.width - 4, this.height / 2 - 2, cornerR - 1);
        const shineGrad = ctx.createLinearGradient(0, -r + 2, 0, 0);
        shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGrad;
        ctx.fill();

        // ===== УГЛОВЫЕ БОЛТЫ =====
        const boltPositions = [
            [-r + 5, -r + 5],
            [r - 5, -r + 5],
            [-r + 5, r - 5],
            [r - 5, r - 5]
        ];
        boltPositions.forEach(([bx, by]) => {
            // Болт
            ctx.beginPath();
            ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
            const boltGrad = ctx.createRadialGradient(bx - 0.5, by - 0.5, 0, bx, by, 2.5);
            boltGrad.addColorStop(0, '#888890');
            boltGrad.addColorStop(1, '#44444a');
            ctx.fillStyle = boltGrad;
            ctx.fill();
            ctx.strokeStyle = '#333338';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Крестик на болте
            ctx.strokeStyle = '#555560';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(bx - 1.2, by);
            ctx.lineTo(bx + 1.2, by);
            ctx.moveTo(bx, by - 1.2);
            ctx.lineTo(bx, by + 1.2);
            ctx.stroke();
        });

        // ===== ДЕКОРАТИВНЫЕ ПОЛОСКИ НА ОСНОВАНИИ =====
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.15)';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-r + 8, i * 4);
            ctx.lineTo(-r + 12, i * 4);
            ctx.stroke();
        }

        // ===== ЦЕНТРАЛЬНЫЙ СКАНЕР (вращающийся) =====
        ctx.save();
        ctx.rotate(this.scannerAngle);
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        const scanGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
        const scanPulse = 0.6 + Math.sin(this.pulsePhase * 2) * 0.4;
        scanGrad.addColorStop(0, `rgba(255, 50, 50, ${scanPulse})`);
        scanGrad.addColorStop(0.6, `rgba(200, 30, 30, ${scanPulse * 0.5})`);
        scanGrad.addColorStop(1, 'rgba(150, 20, 20, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fill();

        // Линия сканера
        ctx.strokeStyle = `rgba(255, 80, 80, ${scanPulse * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * 0.8, 0);
        ctx.stroke();
        ctx.restore();

        // ===== СТВОЛ ТУРЕЛИ =====
        ctx.rotate(this.currentAngle);

        const recoil = -this.recoilOffset;

        // Тень ствола
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(recoil + 2, -5 + 2, 32, 10);
        ctx.restore();

        // Основной ствол — многослойный
        // Нижний слой (тёмный)
        ctx.fillStyle = '#3a3a40';
        this._roundRect(recoil - 2, -8, 36, 16, 2);
        ctx.fill();

        // Средний слой (основной ствол)
        const barrelGrad = ctx.createLinearGradient(0, -7, 0, 7);
        barrelGrad.addColorStop(0, '#8a8a95');
        barrelGrad.addColorStop(0.15, '#a0a0ab');
        barrelGrad.addColorStop(0.5, '#b0b0bb');
        barrelGrad.addColorStop(0.85, '#7a7a85');
        barrelGrad.addColorStop(1, '#5a5a65');
        ctx.fillStyle = barrelGrad;
        this._roundRect(recoil, -6, 32, 12, 1.5);
        ctx.fill();
        ctx.strokeStyle = '#44444a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Верхний блик на стволе
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(recoil + 2, -5, 28, 3);

        // Кольцевые насечки на стволе
        ctx.strokeStyle = '#55555e';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const nx = recoil + 8 + i * 8;
            ctx.beginPath();
            ctx.moveTo(nx, -6);
            ctx.lineTo(nx, 6);
            ctx.stroke();
        }

        // ===== ДУЛЬНЫЙ ТОРМОЗ =====
        const muzzleX = recoil + 30;
        const muzzleGrad = ctx.createLinearGradient(muzzleX, -9, muzzleX, 9);
        muzzleGrad.addColorStop(0, '#666670');
        muzzleGrad.addColorStop(0.3, '#7a7a85');
        muzzleGrad.addColorStop(0.7, '#7a7a85');
        muzzleGrad.addColorStop(1, '#4a4a55');
        ctx.fillStyle = muzzleGrad;
        this._roundRect(muzzleX, -9, 6, 18, 1);
        ctx.fill();
        ctx.strokeStyle = '#3a3a42';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Прорези дульного тормоза
        ctx.strokeStyle = '#333338';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(muzzleX + 2, -7);
        ctx.lineTo(muzzleX + 4, -5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(muzzleX + 2, 7);
        ctx.lineTo(muzzleX + 4, 5);
        ctx.stroke();

        // ===== ВСПЫШКА ВЫСТРЕЛА =====
        if (this.muzzleFlash > 0) {
            const flashX = muzzleX + 6;
            const flashAlpha = this.muzzleFlash;

            // Основная вспышка
            const flashGrad = ctx.createRadialGradient(flashX, 0, 0, flashX, 0, 18 * flashAlpha);
            flashGrad.addColorStop(0, `rgba(255, 255, 200, ${flashAlpha * 0.9})`);
            flashGrad.addColorStop(0.2, `rgba(255, 200, 80, ${flashAlpha * 0.7})`);
            flashGrad.addColorStop(0.5, `rgba(255, 120, 30, ${flashAlpha * 0.4})`);
            flashGrad.addColorStop(1, `rgba(255, 60, 0, 0)`);
            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.arc(flashX, 0, 18 * flashAlpha, 0, Math.PI * 2);
            ctx.fill();

            // Лучи вспышки
            ctx.strokeStyle = `rgba(255, 220, 100, ${flashAlpha * 0.6})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI - Math.PI / 2 + Math.random() * 0.3;
                const len = 12 + Math.random() * 8;
                ctx.beginPath();
                ctx.moveTo(flashX, 0);
                ctx.lineTo(
                    flashX + Math.cos(angle) * len * flashAlpha,
                    Math.sin(angle) * len * flashAlpha
                );
                ctx.stroke();
            }

            // Внутреннее белое ядро
            const coreGrad = ctx.createRadialGradient(flashX, 0, 0, flashX, 0, 5);
            coreGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
            coreGrad.addColorStop(1, `rgba(255, 255, 200, 0)`);
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(flashX, 0, 5 * flashAlpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Скруглённый прямоугольник (используется внутри save/restore с трансформацией)
    _roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // Скруглённый прямоугольник для статичных элементов (без трансформации)
    _roundRectStatic(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    takeDamage(damage) {
        player.takeDamageBySkill(damage/10);
    }

    takeDamageBySkill(damage) {
        player.takeDamageBySkill(damage/10);
    }
}