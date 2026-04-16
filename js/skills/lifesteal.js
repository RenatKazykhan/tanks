class Lifesteal {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Вампиризм';
        this.description = 'Пассивно даёт вампиризм, активно удваивает его';
        this.hasLifesteal = false;
        this.level = 0;
        this.maxLevel = 5;

        // Пассивный вампиризм (процент от урона)
        this.passiveAmount = 0.05; // 5%

        // Активная способность — удвоение вампиризма
        this.activeDuration = 5000; // 5 секунд
        this.cooldown = 15000;
        this.lastUseTime = 0;
        this.isActive = false;
        this.activeEndTime = 0;
        this.bonusMultiplier = 1.0; // дополнительный множитель при активации (100% = x2)

        // Визуальные эффекты
        this.particles = [];
        this.pulseEffects = [];

        this.indicatorX = 340;
        this.upgradeButton = new UpgradeSkillButton(this.indicatorX, 0);
    }

    canUpdate() {
        return this.level < this.maxLevel;
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        // Пассивный вампиризм: 5%, 7%, 9%, 12%, 15%
        const passiveMap = [0, 0.05, 0.07, 0.09, 0.12, 0.15];
        this.passiveAmount = passiveMap[this.level] || 0.05;

        // Длительность активации: 5, 5.5, 6, 7, 8 секунд
        const durationMap = [0, 5000, 5500, 6000, 7000, 8000];
        this.activeDuration = durationMap[this.level] || 5000;

        // Cooldown: 15, 14, 13, 12, 10 секунд
        const cooldownMap = [0, 15000, 14000, 13000, 12000, 10000];
        this.cooldown = cooldownMap[this.level] || 15000;

        // Бонусный множитель: 1.0, 1.2, 1.5, 1.8, 2.0 (т.е. итого x2, x2.2, x2.5, x2.8, x3)
        const bonusMap = [0, 1.0, 1.2, 1.5, 1.8, 2.0];
        this.bonusMultiplier = bonusMap[this.level] || 1.0;

        // Обновляем вампиризм на владельце
        this.syncPassiveLifesteal();
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.level = 1;
                this.hasLifesteal = true;
                this.passiveAmount = 0.05;
                this.activeDuration = 5000;
                this.cooldown = 15000;
                this.bonusMultiplier = 1.0;
                this.lastUseTime = 0;
            } else {
                this.level++;
                this.updateLevel();
                this.lastUseTime = 0;
            }

            this.syncPassiveLifesteal();

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    // Синхронизируем пассивный вампиризм с PlayerTank
    syncPassiveLifesteal() {
        this.owner.lifeSteal = this.passiveAmount;
    }

    // Получить текущий множитель вампиризма (1x или 2x+)
    getLifestealMultiplier() {
        if (this.isActive) {
            return 1.0 + this.bonusMultiplier; // пассив + бонус
        }
        return 1.0;
    }

    // Активная способность — усиление вампиризма
    activate() {
        if (!this.hasLifesteal) return false;
        if (Date.now() - this.lastUseTime < this.cooldown) return false;

        this.lastUseTime = Date.now();
        this.isActive = true;
        this.activeEndTime = Date.now() + this.activeDuration;

        // Удваиваем (или больше) вампиризм
        this.owner.lifeSteal = this.passiveAmount * (1.0 + this.bonusMultiplier);

        // Визуальный эффект
        this.createActivationEffect();
        this.playActivationSound();

        return true;
    }

    update(deltaTime) {
        // Проверяем окончание активной способности
        if (this.isActive && Date.now() >= this.activeEndTime) {
            this.isActive = false;
            // Возвращаем нормальный вампиризм
            this.owner.lifeSteal = this.passiveAmount;
        }

        // Обновляем частицы
        this.particles = this.particles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 50 * deltaTime;
            p.life -= deltaTime * 2;
            p.angle += deltaTime * 5;
            return p.life > 0;
        });

        // Обновляем пульсирующие эффекты
        this.pulseEffects = this.pulseEffects.filter(e => {
            e.life -= deltaTime * 1.5;
            return e.life > 0;
        });

        // Добавляем частицы крови при активной способности
        if (this.isActive && Math.random() < 0.5) {
            this.addBloodParticle();
        }
    }

    createActivationEffect() {
        // Кровавая вспышка
        this.pulseEffects.push({
            x: this.owner.x,
            y: this.owner.y,
            life: 1.0
        });

        // Частицы крови при активации
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            this.particles.push({
                x: this.owner.x + Math.cos(angle) * 20,
                y: this.owner.y + Math.sin(angle) * 20,
                vx: Math.cos(angle) * 80,
                vy: Math.sin(angle) * 80 - 30,
                life: 1,
                size: Math.random() * 5 + 3,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    addBloodParticle() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 25 + 15;
        this.particles.push({
            x: this.owner.x + Math.cos(angle) * dist,
            y: this.owner.y + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 40,
            vy: -Math.random() * 60 - 20,
            life: 0.8,
            size: Math.random() * 4 + 2,
            angle: Math.random() * Math.PI * 2
        });
    }

    playActivationSound() {
        if (typeof soundManager !== 'undefined' && typeof soundManager.playHit === 'function') {
            soundManager.playHit();
        }
    }

    canUse() {
        return this.hasLifesteal && Date.now() - this.lastUseTime >= this.cooldown;
    }

    getCooldownRemaining() {
        return Math.max(0, this.cooldown - (Date.now() - this.lastUseTime));
    }

    // ======================== ОТРИСОВКА ========================

    draw() {
        // Рисуем эффекты в мировых координатах
        this.drawWorldEffects();

        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        // Кнопка апгрейда
        if (typeof canvas !== 'undefined') {
            this.upgradeButton.y = canvas.height - 110;
            this.upgradeButton.draw(this.level, this.maxLevel, this.owner.skillPoints);
        }
    }

    drawWorldEffects() {
        // Частицы крови
        this.particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            const alpha = p.life * 0.9;
            ctx.fillStyle = `rgba(200, 30, 30, ${alpha})`;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';

            const size = p.size * p.life;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Пульсирующие эффекты активации
        this.pulseEffects.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);

            const alpha = e.life * 0.5;
            const radius = 30 + (1 - e.life) * 40;

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, `rgba(200, 30, 30, ${alpha})`);
            gradient.addColorStop(0.6, `rgba(150, 0, 0, ${alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Кровавая аура при активной способности
        if (this.isActive) {
            ctx.save();
            ctx.translate(this.owner.x, this.owner.y);

            const pulse = Math.sin(Date.now() * 0.006) * 0.3 + 0.7;
            const glowRadius = 40 + pulse * 8;

            const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
            aura.addColorStop(0, `rgba(200, 30, 30, ${0.25 * pulse})`);
            aura.addColorStop(0.5, `rgba(150, 0, 0, ${0.15 * pulse})`);
            aura.addColorStop(1, 'rgba(100, 0, 0, 0)');

            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Капли крови, вращающиеся вокруг
            ctx.fillStyle = `rgba(220, 20, 20, ${0.7 * pulse})`;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 / 4) * i + Date.now() * 0.003;
                const dist = 28 + Math.sin(Date.now() * 0.004 + i) * 5;
                const dx = Math.cos(angle) * dist;
                const dy = Math.sin(angle) * dist;

                ctx.beginPath();
                // Форма капли
                ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
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
        const baseColor = this.isActive ? '#ff2222' : (isReady ? '#c62828' : '#333');
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Blood drop symbol
        ctx.fillStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 2;

        if (isReady || this.isActive) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.shadowBlur = 10 + pulse * 5;
            ctx.shadowColor = '#c62828';
        }

        // Рисуем каплю крови
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.bezierCurveTo(-6, -2, -7, 4, 0, 8);
        ctx.bezierCurveTo(7, 4, 6, -2, 0, -9);
        ctx.fill();

        // Ready pulse
        if (isReady && !this.isActive) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(198, 40, 40, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Active glow
        if (this.isActive) {
            const pulse = Math.sin(Date.now() * 0.005) * 0.4 + 0.6;
            ctx.strokeStyle = `rgba(255, 50, 50, ${pulse})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();

            // Remaining active time
            const remaining = Math.ceil((this.activeEndTime - Date.now()) / 1000);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1;
            ctx.fillText(remaining + 's', 0, 28);
        }

        // Cooldown Progress
        if (cooldownProgress < 1 && !this.isActive) {
            ctx.strokeStyle = '#c62828';
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

        // Key label [V]
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[V]', 0, -25);

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
