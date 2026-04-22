class Blast {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Энергетический взрыв';
        this.description = 'Накапливает и высвобождает мощный взрыв вокруг танка';
        this.hasEnergyBlast = false;
        this.level = 0;
        this.maxLevel = 5;

        // Характеристики
        this.cooldown = 10000;
        this.radius = 150;
        this.damage = 100;
        this.force = 300;

        // Runtime state
        this.lastUseTime = 0;
        this.isCharging = false;
        this.chargeTime = 0;
        this.maxChargeTime = 0; // Для возможного долгого каста, сейчас 0 для мгновенной зарядки

        // Визуальные эффекты взрыва
        this.isActive = false;
        this.animationTime = 0;
        this.shockwaveRadius = 0;
        this.energyParticles = [];
        this.lightningBolts = [];

        this.indicatorX = 40;
        this.upgradeSkillButton = new UpgradeSkillButton(this.indicatorX, 0);
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        const damageMap = [0, 100, 150, 200, 250, 300];
        this.damage = damageMap[this.level] || 100;

        const radiusMap = [0, 150, 200, 250, 300, 400];
        this.radius = radiusMap[this.level] || 150;

        const forceMap = [0, 300, 350, 400, 450, 500];
        this.force = forceMap[this.level] || 300;

        const cooldownMap = [0, 10000, 9000, 8000, 7000, 5000];
        this.cooldown = cooldownMap[this.level] || 10000;
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.hasEnergyBlast = true;
                this.level = 1;
                this.lastUseTime = 0;
                this.updateLevel();
            } else {
                this.level++;
                this.updateLevel();
                this.lastUseTime = 0;
            }

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    checkUpgradeClick(clickX, clickY) {
        if (typeof canvas === 'undefined') return false;
        if (this.upgradeSkillButton.checkClick(clickX, clickY, this.level, this.maxLevel, this.owner.skillPoints)) {
            this.upgrade();
            return true;
        }
        return false;
    }

    startCharging() {
        if (!this.hasEnergyBlast) return;
        if (Date.now() - this.lastUseTime < this.cooldown) return;

        this.isCharging = true;
        this.chargeTime = 0;
    }

    releaseBlast() {
        if (!this.isCharging) return null;

        // Минимальная зарядка для активации
        const chargePercent = this.maxChargeTime > 0 ? Math.min(1, this.chargeTime / this.maxChargeTime) : 1;
        if (chargePercent < 0.3 && this.maxChargeTime > 0) {
            this.isCharging = false;
            this.chargeTime = 0;
            return null;
        }

        // Активируем взрыв
        this.isActive = true;
        this.animationTime = 500; // 500мс анимация
        this.shockwaveRadius = 0;
        this.lastUseTime = Date.now();
        this.isCharging = false;

        // Создаем визуальные эффекты
        this.createEffects(chargePercent);

        if (typeof soundManager !== 'undefined' && soundManager.playEnergyBlast) {
            soundManager.playEnergyBlast();
        }
        if (typeof cameraShake !== 'undefined') {
            cameraShake.trigger(12);
        }

        // Возвращаем данные для обработки урона врагам
        return {
            x: this.owner.x,
            y: this.owner.y,
            radius: this.radius * chargePercent,
            damage: this.damage * chargePercent,
            force: this.force * chargePercent
        };
    }

    createEffects(chargePercent) {
        // Создаем молнии
        const lightningCount = Math.floor(8 * chargePercent);
        for (let i = 0; i < lightningCount; i++) {
            const angle = (Math.PI * 2 * i) / lightningCount;
            this.lightningBolts.push({
                angle: angle,
                length: this.radius * chargePercent,
                segments: this.generateLightningPath(this.radius * chargePercent),
                life: 1,
                thickness: 3 + chargePercent * 2
            });
        }

        // Создаем энергетические частицы
        const particleCount = Math.floor(30 * chargePercent);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.radius * chargePercent;
            const speed = Math.random() * 200 + 100;

            this.energyParticles.push({
                x: this.owner.x + Math.cos(angle) * distance,
                y: this.owner.y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: Math.random() * 8 + 4,
                color: Math.random() > 0.5 ? '#ffff00' : '#ff8800',
                glow: true
            });
        }
    }

    generateLightningPath(length) {
        const segments = [];
        const segmentCount = 8;
        const segmentLength = length / segmentCount;

        let currentDistance = 0;
        for (let i = 0; i <= segmentCount; i++) {
            const offset = i === 0 || i === segmentCount ? 0 : (Math.random() - 0.5) * 30;
            segments.push({
                distance: currentDistance,
                offset: offset
            });
            currentDistance += segmentLength;
        }

        return segments;
    }

    handleEnergyBlast(blastData) {
        // Проверяем попадание по всем врагам
        enemies.forEach(enemy => {
            const dx = enemy.x - blastData.x;
            const dy = enemy.y - blastData.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= blastData.radius) {
                // Наносим урон
                enemy.takeDamageBySkill(blastData.damage);
                statManager.damageByExplode += blastData.damage;

                if (!enemy.active) {
                    enemyDead(enemy.x, enemy.y); // создает взрывы
                }
            }

            // Уничтожаем вражеские пули в радиусе взрыва
            enemy.bullets.forEach(bullet => {
                const dx = bullet.x - blastData.x;
                const dy = bullet.y - blastData.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance > blastData.radius;
            });
        });
    }

    update(deltaTime) {
        // Обновляем зарядку
        if (this.isCharging) {
            this.chargeTime += deltaTime * 1000;

            // Создаем частицы зарядки
            if (Math.random() < 0.8) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 30;

                this.energyParticles.push({
                    x: this.owner.x + Math.cos(angle) * distance,
                    y: this.owner.y + Math.sin(angle) * distance,
                    vx: -Math.cos(angle) * 100,
                    vy: -Math.sin(angle) * 100,
                    life: 0.5,
                    size: Math.random() * 4 + 2,
                    color: '#00ffff',
                    glow: false,
                    isCharging: true
                });
            }
        }

        // Обновляем анимацию взрыва
        if (this.animationTime > 0) {
            this.animationTime -= deltaTime * 1000;
            this.shockwaveRadius += deltaTime * 500; // Скорость расширения волны

            if (this.animationTime <= 0) {
                this.isActive = false;
                this.shockwaveRadius = 0;
            }
        }

        // Обновляем молнии
        this.lightningBolts = this.lightningBolts.filter(bolt => {
            bolt.life -= deltaTime * 3;
            return bolt.life > 0;
        });

        // Обновляем частицы
        this.energyParticles = this.energyParticles.filter(particle => {
            if (particle.isCharging) {
                // Частицы зарядки движутся к центру
                const dx = this.owner.x - particle.x;
                const dy = this.owner.y - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 5) {
                    particle.x += (dx / dist) * 200 * deltaTime;
                    particle.y += (dy / dist) * 200 * deltaTime;
                }
            } else {
                // Обычные частицы разлетаются
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.vx *= 0.95;
                particle.vy *= 0.95;
            }

            particle.life -= deltaTime * 2;
            return particle.life > 0;
        });
    }

    drawEffects() {
        if (typeof ctx === 'undefined') return;

        // Эффект зарядки взрыва
        if (this.isCharging) {
            ctx.save();
            const chargePercent = this.maxChargeTime > 0 ? Math.min(1, this.chargeTime / this.maxChargeTime) : 1;

            // Аура зарядки
            const gradient = ctx.createRadialGradient(this.owner.x, this.owner.y, 0, this.owner.x, this.owner.y, 50 + chargePercent * 30);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${0.3 * chargePercent})`);
            gradient.addColorStop(0.5, `rgba(0, 200, 255, ${0.2 * chargePercent})`);
            gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.owner.x, this.owner.y, 50 + chargePercent * 30, 0, Math.PI * 2);
            ctx.fill();

            // Кольца зарядки
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 * chargePercent})`;
            ctx.lineWidth = 2;
            const time = Date.now() * 0.001;
            for (let i = 0; i < 3; i++) {
                const radius = 30 + i * 15 + Math.sin(time * 3 + i) * 5;
                ctx.beginPath();
                ctx.arc(this.owner.x, this.owner.y, radius * chargePercent, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Рисуем молнии
        this.lightningBolts.forEach(bolt => {
            ctx.save();
            ctx.translate(this.owner.x, this.owner.y);
            ctx.rotate(bolt.angle);

            ctx.strokeStyle = `rgba(255, 255, 0, ${bolt.life})`;
            ctx.lineWidth = bolt.thickness;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';

            ctx.beginPath();
            bolt.segments.forEach((segment, index) => {
                const x = segment.distance;
                const y = segment.offset;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Дополнительная тонкая линия для свечения
            ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.life})`;
            ctx.lineWidth = bolt.thickness * 0.3;
            ctx.stroke();

            ctx.restore();
        });

        // Ударная волна
        if (this.isActive && this.shockwaveRadius > 0) {
            ctx.save();

            // Внешнее кольцо
            const gradient = ctx.createRadialGradient(
                this.owner.x, this.owner.y, this.shockwaveRadius * 0.8,
                this.owner.x, this.owner.y, this.shockwaveRadius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
            gradient.addColorStop(0.7, `rgba(255, 200, 0, ${0.3 * (1 - this.shockwaveRadius / this.radius)})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, ${0.5 * (1 - this.shockwaveRadius / this.radius)})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(this.owner.x, this.owner.y, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // Рисуем энергетические частицы
        this.energyParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;

            if (particle.glow) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = particle.color;
            }

            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    draw() {
        this.drawEffects(); // Эффекты рисуются прямо здесь в draw

        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        if (typeof canvas !== 'undefined') {
            this.upgradeSkillButton.y = canvas.height - 110;
            this.upgradeSkillButton.draw(this.level, this.maxLevel, this.owner.skillPoints);
        }
    }

    drawCooldownIndicator() {
        if (typeof ctx === 'undefined' || typeof canvas === 'undefined') return;

        const cooldownProgress = Math.min(1, (Date.now() - this.lastUseTime) / this.cooldown);
        const isReady = cooldownProgress >= 1;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const indicatorY = canvas.height - 60;
        ctx.translate(this.indicatorX, indicatorY);

        // Фоновая подложка с градиентом
        const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        bgGradient.addColorStop(0, isReady ? 'rgba(255, 200, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = bgGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Основной круг способности
        const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
        if (isReady) {
            mainGradient.addColorStop(0, '#ffaa00');
            mainGradient.addColorStop(0.5, '#ff8800');
            mainGradient.addColorStop(1, '#ff6600');
        } else {
            mainGradient.addColorStop(0, '#444');
            mainGradient.addColorStop(1, '#222');
        }
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Символ энергии (молния)
        ctx.save();
        ctx.rotate(isReady ? Math.sin(Date.now() * 0.003) * 0.1 : 0);

        // Рисуем молнию
        ctx.strokeStyle = isReady ? '#ffff00' : '#666';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(2, -2);
        ctx.lineTo(-2, 2);
        ctx.lineTo(6, 8);
        ctx.stroke();

        // Свечение молнии
        if (isReady) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(2, -2);
            ctx.lineTo(-2, 2);
            ctx.lineTo(6, 8);
            ctx.stroke();
        }

        ctx.restore();

        // Эффекты готовности
        if (isReady) {
            // Пульсирующее свечение
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(255, 170, 0, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Прогресс перезарядки
        if (cooldownProgress < 1) {
            // Полоса прогресса
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownProgress);
            ctx.stroke();

            // Светящийся конец полосы
            const endAngle = -Math.PI / 2 + Math.PI * 2 * cooldownProgress;
            const endX = Math.cos(endAngle) * 16;
            const endY = Math.sin(endAngle) * 16;

            const glowGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, 8);
            glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            glowGradient.addColorStop(1, 'rgba(255, 136, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(endX, endY, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Текст готовности или процент
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;

        if (!isReady) {
            const remainingTime = Math.ceil((this.cooldown - (Date.now() - this.lastUseTime)) / 1000);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(remainingTime + 's', 0, 28);
        }

        // Клавиша активации
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[Q]', 0, -23);

        ctx.restore();
    }
}
