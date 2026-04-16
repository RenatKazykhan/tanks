class Shield {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Аура щита';
        this.description = 'Пассивно даёт ауру щита, активно замораживает ближайших врагов';
        this.hasShield = false;
        this.level = 0;
        this.maxLevel = 5;

        // Пассивная аура щита
        this.shieldAmount = 100;
        this.maxShield = 100;
        this.shieldRegenRate = 5; // единиц в секунду
        this.shieldBroken = false;
        this.shieldRegenDelay = 3000; // мс задержка перед регенерацией
        this.lastShieldBreak = 0;

        // Активная способность — заморозка
        this.freezeRadius = 200;
        this.freezeDuration = 2000; // мс
        this.freezeSlowAmount = 0.3; // множитель скорости
        this.cooldown = 12000;
        this.lastUseTime = 0;

        // Визуальные эффекты
        this.freezeWaveEffects = [];
        this.frozenEnemyEffects = [];

        this.indicatorX = 280;
        this.upgradeButton = new UpgradeSkillButton(this.indicatorX, 0);
    }

    canUpdate() {
        return this.level < this.maxLevel;
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        const shieldMap = [0, 100, 130, 160, 200, 250];
        this.maxShield = shieldMap[this.level] || 100;
        this.shieldAmount = Math.min(this.shieldAmount, this.maxShield);

        const regenMap = [0, 5, 10, 15, 20, 25];
        this.shieldRegenRate = regenMap[this.level] || 5;

        const radiusMap = [0, 200, 230, 260, 300, 350];
        this.freezeRadius = radiusMap[this.level] || 200;

        const durationMap = [0, 2000, 2500, 3000, 3500, 4000];
        this.freezeDuration = durationMap[this.level] || 2000;

        const cooldownMap = [0, 12000, 11000, 10000, 9000, 8000];
        this.cooldown = cooldownMap[this.level] || 12000;

        const delayMap = [0, 3000, 2800, 2500, 2200, 2000];
        this.shieldRegenDelay = delayMap[this.level] || 3000;
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.level = 1;
                this.hasShield = true;
                this.maxShield = 100;
                this.shieldAmount = 100;
                this.shieldRegenRate = 5;
                this.freezeRadius = 200;
                this.freezeDuration = 2000;
                this.cooldown = 12000;
                this.shieldRegenDelay = 3000;
                this.lastUseTime = 0;

                // Синхронизируем с PlayerTank
                this.owner.hasShield = true;
                this.owner.shield = this.shieldAmount;
                this.owner.maxShield = this.maxShield;
                this.owner.shieldRegenRate = this.shieldRegenRate;
                this.owner.shieldRegenDelay = this.shieldRegenDelay;
            } else {
                this.level++;
                this.updateLevel();
                this.lastUseTime = 0;

                // Синхронизируем с PlayerTank
                this.owner.maxShield = this.maxShield;
                this.owner.shield = Math.min(this.owner.shield, this.maxShield);
                this.owner.shieldRegenRate = this.shieldRegenRate;
                this.owner.shieldRegenDelay = this.shieldRegenDelay;
            }

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    // Активная способность — заморозка ближайших врагов
    activate(enemies) {
        if (!this.hasShield) return false;
        if (Date.now() - this.lastUseTime < this.cooldown) return false;

        this.lastUseTime = Date.now();

        let frozenCount = 0;

        enemies.forEach(enemy => {
            if (enemy.active) {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - this.owner.x, 2) +
                    Math.pow(enemy.y - this.owner.y, 2)
                );

                if (dist <= this.freezeRadius) {
                    // Замораживаем врага
                    this.applyFreezeToEnemy(enemy);
                    frozenCount++;

                    // Визуальный эффект на замороженном враге
                    this.frozenEnemyEffects.push({
                        x: enemy.x,
                        y: enemy.y,
                        life: 1.0,
                        radius: 25
                    });
                }
            }
        });

        if (frozenCount > 0) {
            // Создаём волну заморозки
            this.createFreezeWave();
            this.playFreezeSound();
            return true;
        }

        return false;
    }

    applyFreezeToEnemy(enemy) {
        // Сохраняем оригинальную скорость если ещё не заморожен
        if (!enemy._originalSpeed) {
            enemy._originalSpeed = enemy.speed;
        }
        if (!enemy._originalShotCooldown) {
            enemy._originalShotCooldown = enemy.shotCooldown;
        }

        // Замедляем врага
        enemy.speed = enemy._originalSpeed * this.freezeSlowAmount;
        enemy.shotCooldown = enemy._originalShotCooldown * 2;
        enemy._isFrozenByShield = true;
        enemy._frozenEndTime = Date.now() + this.freezeDuration;
    }

    // Обновление эффектов заморозки на врагах (вызывается каждый кадр)
    updateFrozenEnemies(enemies) {
        if (!this.hasShield) return;

        const now = Date.now();
        enemies.forEach(enemy => {
            if (enemy._isFrozenByShield && now >= enemy._frozenEndTime) {
                // Размораживаем
                if (enemy._originalSpeed) {
                    enemy.speed = enemy._originalSpeed;
                    delete enemy._originalSpeed;
                }
                if (enemy._originalShotCooldown) {
                    enemy.shotCooldown = enemy._originalShotCooldown;
                    delete enemy._originalShotCooldown;
                }
                enemy._isFrozenByShield = false;
            }
        });
    }

    createFreezeWave() {
        this.freezeWaveEffects.push({
            x: this.owner.x,
            y: this.owner.y,
            radius: 10,
            maxRadius: this.freezeRadius,
            life: 1.0
        });
    }

    playFreezeSound() {
        if (typeof soundManager !== 'undefined') {
            // Используем имеющийся звук
            if (typeof soundManager.playHit === 'function') {
                soundManager.playHit();
            }
        }
    }

    update(deltaTime, enemies) {
        // Обновляем визуальные эффекты
        this.freezeWaveEffects = this.freezeWaveEffects.filter(effect => {
            effect.radius += deltaTime * 600; // скорость расширения волны
            effect.life -= deltaTime * 2;
            return effect.life > 0 && effect.radius < effect.maxRadius;
        });

        this.frozenEnemyEffects = this.frozenEnemyEffects.filter(effect => {
            effect.life -= deltaTime * 1.5;
            return effect.life > 0;
        });

        // Обновляем состояние заморозки на врагах
        if (enemies) {
            this.updateFrozenEnemies(enemies);
        }
    }

    canUse() {
        return this.hasShield && Date.now() - this.lastUseTime >= this.cooldown;
    }

    getCooldownRemaining() {
        return Math.max(0, this.cooldown - (Date.now() - this.lastUseTime));
    }

    // ======================== ОТРИСОВКА ========================

    draw(enemies) {
        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        // Рисуем волну заморозки
        this.drawFreezeWaveEffects();

        // Рисуем эффекты на замороженных врагах
        this.drawFrozenEnemyEffects(enemies);

        // Кнопка апгрейда
        if (typeof canvas !== 'undefined') {
            this.upgradeButton.y = canvas.height - 110;
            this.upgradeButton.draw(this.level, this.maxLevel, this.owner.skillPoints);
        }
    }

    drawFreezeWaveEffects() {
        this.freezeWaveEffects.forEach(effect => {
            ctx.save();

            // Ледяная волна
            const alpha = effect.life * 0.6;
            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
            ctx.lineWidth = 3 * effect.life;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';

            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Внутренне свечение
            ctx.strokeStyle = `rgba(200, 240, 255, ${alpha * 0.5})`;
            ctx.lineWidth = 1.5 * effect.life;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * 0.8, 0, Math.PI * 2);
            ctx.stroke();

            // Снежинки на волне
            const numFlakes = 8;
            for (let i = 0; i < numFlakes; i++) {
                const angle = (Math.PI * 2 / numFlakes) * i + Date.now() * 0.002;
                const fx = effect.x + Math.cos(angle) * effect.radius;
                const fy = effect.y + Math.sin(angle) * effect.radius;

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(fx, fy, 3 * effect.life, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    drawFrozenEnemyEffects(enemies) {
        if (!enemies) return;

        // Рисуем ледяной эффект на замороженных врагах
        enemies.forEach(enemy => {
            if (enemy._isFrozenByShield && enemy.active) {
                ctx.save();
                ctx.translate(enemy.x, enemy.y);

                // Ледяная аура вокруг врага
                const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                const auraGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 35);
                auraGradient.addColorStop(0, `rgba(100, 200, 255, ${0.3 * pulse})`);
                auraGradient.addColorStop(0.6, `rgba(150, 220, 255, ${0.15 * pulse})`);
                auraGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

                ctx.fillStyle = auraGradient;
                ctx.beginPath();
                ctx.arc(0, 0, 35, 0, Math.PI * 2);
                ctx.fill();

                // Снежинки вокруг врага
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * pulse})`;
                ctx.lineWidth = 1;
                for (let i = 0; i < 4; i++) {
                    const angle = (i * 90 + Date.now() * 0.03) * Math.PI / 180;
                    const dist = 20 + Math.sin(Date.now() * 0.002 + i) * 5;
                    const sx = Math.cos(angle) * dist;
                    const sy = Math.sin(angle) * dist;

                    ctx.save();
                    ctx.translate(sx, sy);
                    ctx.rotate(Date.now() * 0.002);

                    for (let j = 0; j < 6; j++) {
                        ctx.save();
                        ctx.rotate(j * Math.PI / 3);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(0, -5);
                        ctx.stroke();
                        ctx.restore();
                    }

                    ctx.restore();
                }

                // Текст "❄️" над врагом
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('❄️', 0, -30);

                ctx.restore();
            }
        });

        // Рисуем эффекты взрыва заморозки (одноразовые)
        this.frozenEnemyEffects.forEach(effect => {
            ctx.save();
            ctx.translate(effect.x, effect.y);

            const alpha = effect.life * 0.8;
            // Ледяные осколки
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const dist = effect.radius * (1 - effect.life) * 2;
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;

                ctx.fillStyle = `rgba(180, 230, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, 3 * effect.life, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    drawCooldownIndicator() {
        const cooldownProgress = Math.min(1, (Date.now() - this.lastUseTime) / this.cooldown);
        const isReady = cooldownProgress >= 1;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const indicatorY = typeof canvas !== 'undefined' ? canvas.height - 60 : 560;
        ctx.translate(this.indicatorX, indicatorY);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Main circle
        ctx.fillStyle = isReady ? '#00bcd4' : '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Shield + snowflake symbol
        ctx.strokeStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.shadowBlur = 10 + pulse * 5;
            ctx.shadowColor = '#00bcd4';
        }

        // Рисуем щит
        ctx.beginPath();
        ctx.moveTo(-7, -6);
        ctx.lineTo(0, -10);
        ctx.lineTo(7, -6);
        ctx.lineTo(7, 2);
        ctx.lineTo(0, 8);
        ctx.lineTo(-7, 2);
        ctx.closePath();
        ctx.stroke();

        // Снежинка внутри щита
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.moveTo(-3, -2);
        ctx.lineTo(3, 2);
        ctx.moveTo(3, -2);
        ctx.lineTo(-3, 2);
        ctx.stroke();

        // Ready pulse
        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(0, 188, 212, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Cooldown Progress
        if (cooldownProgress < 1) {
            ctx.strokeStyle = '#00bcd4';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.8;

            ctx.beginPath();
            ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cooldownProgress));
            ctx.stroke();

            const remainingTime = Math.ceil((this.cooldown - (Date.now() - this.lastUseTime)) / 1000);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1;
            ctx.fillText(remainingTime + 's', 0, 28);
        }

        // Key label [T]
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[G]', 0, -25);

        ctx.restore();
    }

    checkUpgradeClick(clickX, clickY) {
        if (this.upgradeButton.checkClick(clickX, clickY, this.level, this.maxLevel, this.owner.skillPoints)) {
            this.upgrade();
            return true;
        }
        return false;
    }
}
