class Regeneration {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Быстрая регенерация';
        this.description = 'Временно ускоряет регенерацию здоровья';

        this.level = 0;
        this.maxLevel = 5;
        this.hasRegen = false;

        // Runtime state
        this.isActive = false;
        this.endTime = 0;
        this.cooldownEndTime = 0;

        // Stats
        this.duration = 3000; // 3 секунды
        this.cooldown = 15000;
        this.regenAmount = 15; // HP в секунду
        this.passiveRegen = 0;
        this.particles = [];

        // Инициализируем кнопку апгрейда
        // Поместим ее слева от цепной молнии (220), например, на 160
        this.indicatorX = 160;
        this.upgradeButton = new UpgradeSkillButton(this.indicatorX, 0); // y будет обновляться в draw
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        this.passiveRegen = this.level * 3; // 3, 6, 9, 12, 15
        this.regenAmount = 15 + (this.level - 1) * 10; // 15, 25, 35, 45, 55

        const cooldownMap = [0, 15000, 12000, 10000, 8000, 6000];
        this.cooldown = cooldownMap[this.level] || 15000;
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.level = 1;
                this.hasRegen = true;
                this.regenAmount = 15;
                this.cooldown = 15000;
                this.duration = 3000;
                this.cooldownEndTime = 0;
                this.passiveRegen = 3;
            } else {
                this.level++;
                this.updateLevel();
                this.cooldownEndTime = 0;
            }

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    canUse() {
        return this.hasRegen && Date.now() >= this.cooldownEndTime;
    }

    activate() {
        if (this.canUse()) {
            this.isActive = true;
            this.endTime = Date.now() + this.duration;
            this.cooldownEndTime = Date.now() + this.cooldown;
            return true;
        }
        return false;
    }

    addParticle() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 30 + 20;

        this.particles.push({
            x: this.owner.x + Math.cos(angle) * distance,
            y: this.owner.y + Math.sin(angle) * distance,
            vx: (Math.random() - 0.5) * 50,
            vy: -Math.random() * 100 - 50,
            life: 1,
            size: Math.random() * 6 + 4,
            angle: Math.random() * Math.PI * 2
        });
    }

    update(deltaTime) {
        if (this.isActive) {
            if (Date.now() < this.endTime) {
                const healAmount = this.regenAmount * deltaTime;
                this.owner.heal(healAmount);

                // Добавляем частицы
                if (Math.random() < 0.8) {
                    this.addParticle();
                }
            } else {
                this.isActive = false;
            }
        }

        const passiveRegenAmount = this.passiveRegen * deltaTime;
        this.owner.heal(passiveRegenAmount);

        // Обновление частиц
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 100 * deltaTime;
            particle.life -= deltaTime * 2;
            particle.angle += deltaTime * 5;
            return particle.life > 0;
        });
    }

    drawEffects() {
        // Рисуем частицы (в мировых координатах)
        this.particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.angle);

            const alpha = particle.life * 0.8;
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;

            const size = particle.size * particle.life;
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(size, 0);
            ctx.moveTo(0, -size);
            ctx.lineTo(0, size);
            ctx.stroke();

            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.restore();
        });

        // Свечение вокруг танка
        if (this.isActive) {
            ctx.save();
            ctx.translate(this.owner.x, this.owner.y);

            const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
            const glowRadius = 40 + pulse * 10;

            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            glowGradient.addColorStop(0, `rgba(0, 255, 0, ${0.3 * pulse})`);
            glowGradient.addColorStop(0.5, `rgba(0, 255, 0, ${0.2 * pulse})`);
            glowGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    draw() {
        this.drawEffects();

        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        if (typeof canvas !== 'undefined') {
            this.upgradeButton.y = canvas.height - 110;
            const indicatorY = canvas.height - 60;
            this.upgradeButton.draw(this.level, this.maxLevel, this.owner.skillPoints);
        }
    }

    drawCooldownIndicator() {
        let cooldownProgress = 1;
        if (this.level > 0 && Date.now() < this.cooldownEndTime) {
            const startTime = this.cooldownEndTime - this.cooldown;
            cooldownProgress = Math.min(1, (Date.now() - startTime) / this.cooldown);
        }

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

        ctx.fillStyle = isReady ? '#27ae60' : '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Cross symbol for heal
        ctx.strokeStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(46, 204, 113, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Cooldown Progress
        if (cooldownProgress < 1) {
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cooldownProgress));
            ctx.stroke();

            const remainingTime = Math.ceil((this.cooldownEndTime - Date.now()) / 1000);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1;
            ctx.fillText(remainingTime + 's', 0, 28);
        }

        // Activation key [R]
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[R]', 0, -25);

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
