class DoubleShoot {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Двойной выстрел';
        this.description = 'Пассивно даёт шанс двойного выстрела, активно выпускает снаряды вокруг себя';
        this.hasDoubleShoot = false;
        this.level = 0;
        this.maxLevel = 5;

        // Пассивный — шанс двойного выстрела
        this.doubleChance = 0.2; // 20%

        // Активная способность — залп вокруг себя
        this.burstCount = 8; // количество снарядов
        this.burstDamageMultiplier = 1.0; // множитель урона
        this.cooldown = 12000;
        this.lastUseTime = 0;

        // Визуальные эффекты
        this.burstEffects = [];

        this.indicatorX = 400;
        this.upgradeButton = new UpgradeSkillButton(this.indicatorX, 0);
    }

    canUpdate() {
        return this.level < this.maxLevel;
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        // Шанс двойного выстрела: 20%, 25%, 30%, 35%, 45%
        const chanceMap = [0, 0.20, 0.25, 0.30, 0.35, 0.45];
        this.doubleChance = chanceMap[this.level] || 0.20;

        // Количество снарядов залпа: 8, 10, 12, 14, 16
        const countMap = [0, 8, 10, 12, 14, 16];
        this.burstCount = countMap[this.level] || 8;

        // Множитель урона залпа: 1.0, 1.1, 1.2, 1.3, 1.5
        const dmgMap = [0, 1.0, 1.1, 1.2, 1.3, 1.5];
        this.burstDamageMultiplier = dmgMap[this.level] || 1.0;

        // Cooldown: 12, 11, 10, 9, 8 секунд
        const cdMap = [0, 12000, 11000, 10000, 9000, 8000];
        this.cooldown = cdMap[this.level] || 12000;

        // Синхронизируем пассив с PlayerTank
        this.syncPassive();
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.level = 1;
                this.hasDoubleShoot = true;
                this.doubleChance = 0.20;
                this.burstCount = 8;
                this.burstDamageMultiplier = 1.0;
                this.cooldown = 12000;
                this.lastUseTime = 0;
            } else {
                this.level++;
                this.updateLevel();
                this.lastUseTime = 0;
            }

            this.syncPassive();

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    syncPassive() {
        this.owner.doubleShot = true;
        this.owner.doubleShotChance = this.doubleChance;
    }

    // Активная способность — залп снарядами вокруг
    activate() {
        if (!this.hasDoubleShoot) return false;
        if (Date.now() - this.lastUseTime < this.cooldown) return false;

        this.lastUseTime = Date.now();

        const damage = Math.floor(this.owner.damage * this.burstDamageMultiplier);
        const bulletSpeed = this.owner.bulletSpeed;

        for (let i = 0; i < this.burstCount; i++) {
            const angle = (Math.PI * 2 / this.burstCount) * i;
            const bulletX = this.owner.x + Math.cos(angle) * 35;
            const bulletY = this.owner.y + Math.sin(angle) * 35;

            // Создаём настоящие снаряды (Bullet2), чтобы вампиризм работал
            this.owner.bullets.push(new Bullet2(
                bulletX,
                bulletY,
                damage,
                angle,
                'enemy',
                bulletSpeed
            ));
        }

        // Визуальный эффект
        this.createBurstEffect();
        this.playBurstSound();

        if (typeof statManager !== 'undefined') {
            statManager.shootsFired += this.burstCount;
        }

        return true;
    }

    createBurstEffect() {
        this.burstEffects.push({
            x: this.owner.x,
            y: this.owner.y,
            radius: 15,
            maxRadius: 60,
            life: 1.0
        });

        // Частицы вспышек
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < this.burstCount; i++) {
                const angle = (Math.PI * 2 / this.burstCount) * i;
                const px = this.owner.x + Math.cos(angle) * 30;
                const py = this.owner.y + Math.sin(angle) * 30;

                particles.push(new Particle(px, py, '#ffaa00', {
                    vx: Math.cos(angle) * 80,
                    vy: Math.sin(angle) * 80,
                    life: 400,
                    size: 4
                }));
            }
        }
    }

    playBurstSound() {
        if (typeof soundManager !== 'undefined' && typeof soundManager.playShoot === 'function') {
            soundManager.playShoot();
        }
    }

    update(deltaTime) {
        // Обновляем визуальные эффекты
        this.burstEffects = this.burstEffects.filter(e => {
            e.radius += deltaTime * 400;
            e.life -= deltaTime * 3;
            return e.life > 0;
        });
    }

    canUse() {
        return this.hasDoubleShoot && Date.now() - this.lastUseTime >= this.cooldown;
    }

    getCooldownRemaining() {
        return Math.max(0, this.cooldown - (Date.now() - this.lastUseTime));
    }

    // ======================== ОТРИСОВКА ========================

    draw() {
        this.drawBurstEffects();

        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        if (typeof canvas !== 'undefined') {
            this.upgradeButton.y = canvas.height - 110;
            this.upgradeButton.draw(this.level, this.maxLevel, this.owner.skillPoints);
        }
    }

    drawBurstEffects() {
        this.burstEffects.forEach(e => {
            ctx.save();

            const alpha = e.life * 0.6;

            // Кольцо расширения
            ctx.strokeStyle = `rgba(255, 170, 0, ${alpha})`;
            ctx.lineWidth = 3 * e.life;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 170, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Внутреннее свечение
            ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.5})`;
            ctx.lineWidth = 1.5 * e.life;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();

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
        ctx.fillStyle = isReady ? '#e67e22' : '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Double bullet symbol
        ctx.fillStyle = isReady ? '#ffffff' : '#666';

        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.shadowBlur = 10 + pulse * 5;
            ctx.shadowColor = '#e67e22';
        }

        // Два снаряда
        ctx.beginPath();
        ctx.arc(-4, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Линии-лучи для «разлета»
        ctx.strokeStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, -3);
        ctx.lineTo(-9, -7);
        ctx.moveTo(4, 3);
        ctx.lineTo(9, 7);
        ctx.stroke();

        // Ready pulse
        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(230, 126, 34, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Cooldown Progress
        if (cooldownProgress < 1) {
            ctx.strokeStyle = '#e67e22';
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

        // Key label [C]
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[C]', 0, -25);

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
