class PlayerTank {
    constructor(x, y, onGameOver, tankStats, onEnergyBlast) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.speed = tankStats.speed;
        this.health = tankStats.maxHealth;
        this.maxHealth = tankStats.maxHealth;
        this.damage = tankStats.damage;
        this.bodyAngle = 0;
        this.turretAngle = 0;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = tankStats.fireRate;
        this.bulletSpeed = tankStats.bulletSpeed;
        this.regen = tankStats.regen;
        this.armor = tankStats.armor;
        this.armorTimer = 0;
        this.lifeSteal = 0;
        this.onGameOver = onGameOver;
        this.accuracy = 0.95; // Точность стрельбы

        // Двойной выстрел
        this.doubleShot = false;
        this.doubleShotChance = 0.25;

        // Энергетический щит
        this.hasShield = false;
        this.shield = 30;
        this.maxShield = 30;
        this.shieldRegenRate = 1; // восстановление в секунду
        this.shieldBroken = false;
        this.shieldRegenDelay = 3000; // задержка перед регенерацией после поломки
        this.lastShieldBreak = 0;

        // Эффекты заморозки
        this.isFrozen = false;
        this.frozenEndTime = 0;
        this.slowEffect = 1; // Множитель скорости (1 = нормальная скорость)
        this.frostParticles = [];
        this.frostIntensity = 0; // Интенсивность заморозки для визуального эффекта

        // Телепортация
        this.canTeleport = true;
        this.teleportCooldown = 10000; // 5 секунд перезарядка
        this.lastTeleportTime = 0;
        this.teleportDistance = 200;

        // Визуальные эффекты телепортации
        this.teleportParticles = [];
        this.teleportTrail = [];
        this.isTeleporting = false;
        this.teleportAnimationTime = 0;

        // Энергетический взрыв
        this.onEnergyBlast = onEnergyBlast;
        this.hasEnergyBlast = true;
        this.energyBlastCooldown = 10000; // 8 секунд перезарядка
        this.lastEnergyBlastTime = 0;
        this.energyBlastRadius = 150;
        this.energyBlastDamage = 100;
        this.energyBlastForce = 300; // Сила отталкивания

        // Визуальные эффекты взрыва
        this.energyBlastActive = false;
        this.energyBlastAnimation = 0;
        this.shockwaveRadius = 0;
        this.energyParticles = [];
        this.lightningBolts = [];

        // Накопление энергии
        this.isChargingBlast = false;
        this.blastChargeTime = 0;
        this.maxChargeTime = 0; // 0 секунда для полной зарядки

        // Способность быстрой регенерации
        this.hasRegen = true;
        this.rapidRegenActive = false;
        this.rapidRegenDuration = 3000; // 3 секунды
        this.rapidRegenCooldown = 15000; // 15 секунд перезарядка
        this.rapidRegenAmount = 15; // HP в секунду
        this.rapidRegenEndTime = 0;
        this.rapidRegenCooldownEndTime = 0;
        this.healParticles = [];

        // Цепная молния
        this.hasChainLightning = true;
        this.chainLightningDamage = 40;
        this.chainLightningCooldown = 10000;
        this.lastChainLightningTime = 0;
        this.maxChainTargets = 4;
        this.chainLightningBounceRange = 200;
        this.lightningEffects = [];

        // Дрон-камикадзе
        this.hasDroneKamikaze = false;
        this.droneDamage = 50;
        this.droneCooldown = 3000;
        this.lastDroneTime = 0;
        this.droneExplosionRadius = 60;
        this.drones = [];

        // Удача
        this.lucky = 0;

        // Состояние отравления
        this.isPoisoned = false;
        this.poisonEndTime = 0;
        this.poisonDamage = 0;
        this.poisonTickRate = 500;
        this.lastPoisonTick = 0;
        this.poisonBubbles = [];
    }

    update(keys, mouseX, mouseY, deltaTime) {
        // Проверяем эффект заморозки
        if (this.frozenEndTime && Date.now() < this.frozenEndTime) {
            this.isFrozen = true;
            this.frostIntensity = Math.min(1, (this.frozenEndTime - Date.now()) / 2000);
        } else {
            this.isFrozen = false;
            this.slowEffect = 1;
            this.frostIntensity = 0;
        }

        // Применяем замедление к скорости
        const currentSpeed = this.speed * this.slowEffect;

        // Движение танка с учетом замедления
        if (keys['w'] || keys['W']) {
            this.x += Math.cos(this.bodyAngle) * currentSpeed * deltaTime;
            this.y += Math.sin(this.bodyAngle) * currentSpeed * deltaTime;
        }
        if (keys['s'] || keys['S']) {
            this.x -= Math.cos(this.bodyAngle) * currentSpeed * deltaTime;
            this.y -= Math.sin(this.bodyAngle) * currentSpeed * deltaTime;
        }
        if (keys['a'] || keys['A']) {
            this.bodyAngle -= 3 * this.slowEffect * deltaTime; // Замедление поворота
        }
        if (keys['d'] || keys['D']) {
            this.bodyAngle += 3 * this.slowEffect * deltaTime; // Замедление поворота
        }

        // Обновляем эффекты телепортации
        this.updateTeleportEffects(deltaTime);
        // Автоматическая активация цепной молнии
        this.updateChainLightning();

        // Телепортация по нажатию клавиши (например, Space или E)
        if (keys['e'] || keys['E']) {
            if (!this.teleportKeyPressed) { // Предотвращаем множественные срабатывания
                this.teleport(mouseX, mouseY);
                this.teleportKeyPressed = true;
            }
        } else {
            this.teleportKeyPressed = false;
        }

        // В обработчике нажатия клавиш
        if (keys['f'] || keys['F']) {
            this.activateChainLightning(enemies, mouseX, mouseY); // enemies - массив врагов
        }

        // Энергетический взрыв
        if (keys['q'] || keys['Q']) {
            if (!this.blastKeyPressed) {
                this.startChargingBlast();
                this.blastKeyPressed = true;
            }
        } else {
            if (this.blastKeyPressed && this.isChargingBlast) {
                const blastData = this.releaseEnergyBlast();
                if (blastData) {
                    // Здесь нужно передать blastData в игровую логику
                    // для обработки урона и отталкивания врагов
                    this.onEnergyBlast && this.onEnergyBlast(blastData);
                }
            }
            this.blastKeyPressed = false;
        }

        // Активация быстрой регенерации
        if ((keys['r'] || keys['R']) && this.canUseRapidRegen()) {
            this.activateRapidRegen();
        }

        // Обработка быстрой регенерации
        if (this.rapidRegenActive && Date.now() < this.rapidRegenEndTime) {
            const healAmount = this.rapidRegenAmount * deltaTime;
            this.heal(healAmount);

            // Добавляем частицы исцеления
            if (Math.random() < 0.8) {
                this.addHealParticle();
            }
        } else if (this.rapidRegenActive && Date.now() >= this.rapidRegenEndTime) {
            this.rapidRegenActive = false;
        }

        // Обновляем эффекты взрыва
        this.updateEnergyBlast(deltaTime);

        // Регенерация щита
        if (this.shield < this.maxShield && !this.shieldBroken) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * deltaTime);
        } else if (this.shieldBroken && Date.now() - this.lastShieldBreak > this.shieldRegenDelay) {
            this.shieldBroken = false;
        }

        // Поворот башни к мыши (также замедлен при заморозке)
        const dx = mouseX - this.x + camera.x;
        const dy = mouseY - this.y + camera.y;
        const targetAngle = Math.atan2(dy, dx);

        if (this.isFrozen) {
            // Плавный поворот башни при заморозке
            const angleDiff = targetAngle - this.turretAngle;
            this.turretAngle += angleDiff * 0.05 * this.slowEffect;
        } else {
            this.turretAngle = targetAngle;
        }

        // Обновление частиц льда
        this.updateFrostParticles(deltaTime);
        this.updateHealParticles(deltaTime);
        this.updateDrones(enemies, deltaTime);

        // Ограничение движения в пределах мира
        this.x = Math.max(player.width / 2, Math.min(WORLD_WIDTH - player.width / 2, player.x));
        this.y = Math.max(player.height / 2, Math.min(WORLD_HEIGHT - player.height / 2, player.y));

        // Обновляем эффекты молнии
        this.lightningEffects = this.lightningEffects.filter(effect => {
            effect.life -= deltaTime * 4;
            effect.width = 3 * effect.life;
            return effect.life > 0;
        });

        // Обработка отравления
        if (this.isPoisoned) {
            const now = Date.now();

            // Проверяем, закончилось ли отравление
            if (now >= this.poisonEndTime) {
                this.isPoisoned = false;
                this.accuracy = 0.95;
                this.poisonBubbles = [];
            } else {
                // Наносим периодический урон
                if (now - this.lastPoisonTick >= this.poisonTickRate) {
                    this.takeDamage(this.poisonDamage);
                    this.accuracy = 0.4;
                    this.lastPoisonTick = now;

                    // Добавляем визуальный эффект при получении урона
                    for (let i = 0; i < 3; i++) {
                        this.poisonBubbles.push({
                            x: (Math.random() - 0.5) * this.width,
                            y: (Math.random() - 0.5) * this.height,
                            size: Math.random() * 4 + 2,
                            speed: Math.random() * 20 + 10,
                            life: 1
                        });
                    }
                }

                // Обновляем пузырьки
                this.poisonBubbles = this.poisonBubbles.filter(bubble => {
                    bubble.y -= bubble.speed * deltaTime;
                    bubble.life -= deltaTime * 2;
                    bubble.x += (Math.random() - 0.5) * 10 * deltaTime;
                    return bubble.life > 0;
                });

                // Добавляем новые пузырьки периодически
                if (Math.random() < 0.1) {
                    this.poisonBubbles.push({
                        x: (Math.random() - 0.5) * this.width,
                        y: (Math.random() - 0.5) * this.height,
                        size: Math.random() * 3 + 1,
                        speed: Math.random() * 15 + 5,
                        life: 1
                    });
                }
            }
        }

        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }

    // Метод для применения отравления
    applyPoison(damage, duration, tickRate) {
        this.isPoisoned = true;
        this.poisonEndTime = Date.now() + duration;
        this.poisonDamage = damage;
        this.poisonTickRate = tickRate;
        this.lastPoisonTick = Date.now();
    }

    canUseRapidRegen() {
        return Date.now() >= this.rapidRegenCooldownEndTime;
    }

    activateRapidRegen() {
        this.rapidRegenActive = true;
        this.rapidRegenEndTime = Date.now() + this.rapidRegenDuration;
        this.rapidRegenCooldownEndTime = Date.now() + this.rapidRegenCooldown;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        if (this.health <= this.maxHealth) statManager.healtRestoredActiveRegen += amount;
    }

    addHealParticle() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 30 + 20;

        this.healParticles.push({
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance,
            vx: (Math.random() - 0.5) * 50,
            vy: -Math.random() * 100 - 50,
            life: 1,
            size: Math.random() * 6 + 4,
            angle: Math.random() * Math.PI * 2
        });
    }

    updateHealParticles(deltaTime) {
        this.healParticles = this.healParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 100 * deltaTime;
            particle.life -= deltaTime * 2;
            particle.angle += deltaTime * 5;
            return particle.life > 0;
        });
    }

    shoot() {
        const now = Date.now();
        // Увеличиваем время перезарядки при заморозке
        const adjustedCooldown = this.shotCooldown * (this.isFrozen ? 1.5 : 1);

        if (now - this.lastShot > adjustedCooldown) {
            this.newBullet();
            soundManager.playShoot();
            if (this.doubleShot) {
                const probability = Math.random();
                if (probability < this.doubleShotChance) {
                    setTimeout(() => {
                        this.newBullet();
                    }, 100);
                }
            }
            this.lastShot = now;
        }
    }

    newBullet() {
        // Добавление случайного разброса для реалистичности
        const spread = (1 - this.accuracy) * 0.2;
        const shootAngle = this.turretAngle + (Math.random() - 0.5) * spread;

        const bulletX = this.x + Math.cos(shootAngle) * 35;
        const bulletY = this.y + Math.sin(shootAngle) * 35;

        this.bullets.push(new Bullet2(
            bulletX,
            bulletY,
            this.damage,
            shootAngle + (Math.random() - 0.5) * 0.1,
            'enemy',
            this.bulletSpeed * (this.isFrozen ? 0.7 : 1) // Замедление пуль при заморозке
        ));

        statManager.shootsFired++;
    }

    drawHealthBar() {
        const healthBarWidth = 55;
        const healthBarHeight = 8;
        const healthBarY = this.y - this.height / 2 - 18;

        const currentHealth = Math.max(0, Math.min(this.health, this.maxHealth));
        const healthPercentage = this.maxHealth > 0 ? currentHealth / this.maxHealth : 0;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x - healthBarWidth / 2 - 1, healthBarY - 1, healthBarWidth + 2, healthBarHeight + 2);

        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);

        if (healthPercentage > 0) {
            let healthColor;
            if (healthPercentage > 0.6) {
                healthColor = '#27ae60';
            } else if (healthPercentage > 0.3) {
                healthColor = '#f39c12';
            } else {
                healthColor = '#e74c3c';
            }

            ctx.fillStyle = healthColor;
            ctx.fillRect(this.x - healthBarWidth / 2, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
        }

        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    }

    draw() {
        // Рисуем частицы исцеления
        this.healParticles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.angle);

            const alpha = particle.life * 0.8;
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;

            // Рисуем крестик
            const size = particle.size * particle.life;
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(size, 0);
            ctx.moveTo(0, -size);
            ctx.lineTo(0, size);
            ctx.stroke();

            // Свечение
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.restore();
        });

        // Эффект свечения при активной регенерации
        if (this.rapidRegenActive) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Пульсирующее свечение
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

        // Рисуем след телепортации
        this.teleportTrail.forEach(trail => {
            ctx.save();
            const gradient = ctx.createRadialGradient(
                trail.x, trail.y, 0,
                trail.x, trail.y, trail.size
            );
            gradient.addColorStop(0, `rgba(150, 100, 255, ${trail.life * 0.5})`);
            gradient.addColorStop(1, 'rgba(150, 100, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Рисуем частицы льда
        this.frostParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life * 0.8;
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, '#E3F2FD');
            gradient.addColorStop(1, 'rgba(129, 212, 250, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
            ctx.restore();
        });

        // Эффект зарядки взрыва
        if (this.isChargingBlast) {
            ctx.save();
            const chargePercent = Math.min(1, this.blastChargeTime / this.maxChargeTime);

            // Аура зарядки
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 50 + chargePercent * 30);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${0.3 * chargePercent})`);
            gradient.addColorStop(0.5, `rgba(0, 200, 255, ${0.2 * chargePercent})`);
            gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 50 + chargePercent * 30, 0, Math.PI * 2);
            ctx.fill();

            // Кольца зарядки
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 * chargePercent})`;
            ctx.lineWidth = 2;
            const time = Date.now() * 0.001;
            for (let i = 0; i < 3; i++) {
                const radius = 30 + i * 15 + Math.sin(time * 3 + i) * 5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius * chargePercent, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Рисуем молнии
        this.lightningBolts.forEach(bolt => {
            ctx.save();
            ctx.translate(this.x, this.y);
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
        if (this.energyBlastActive && this.shockwaveRadius > 0) {
            ctx.save();

            // Внешнее кольцо
            const gradient = ctx.createRadialGradient(
                this.x, this.y, this.shockwaveRadius * 0.8,
                this.x, this.y, this.shockwaveRadius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
            gradient.addColorStop(0.7, `rgba(255, 200, 0, ${0.3 * (1 - this.shockwaveRadius / this.energyBlastRadius)})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, ${0.5 * (1 - this.shockwaveRadius / this.energyBlastRadius)})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
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

        // Рисуем корпус танка с эффектом заморозки
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.bodyAngle);

        // Применяем синеватый оттенок при заморозке
        if (this.isFrozen) {
            ctx.filter = `hue-rotate(180deg) brightness(${1.2 + this.frostIntensity * 0.3})`;
        }

        // Левая гусеница
        ctx.fillStyle = this.isFrozen ? '#1565C0' : '#1e8449';
        ctx.fillRect(-this.width / 2 - 3, -this.height / 2 - 6, this.width, 6);

        ctx.fillStyle = this.isFrozen ? '#0D47A1' : '#16703c';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(-this.width / 2 + 2 + i * 8, -this.height / 2 - 5, 4, 4);
        }

        // Правая гусеница
        ctx.fillStyle = this.isFrozen ? '#1565C0' : '#1e8449';
        ctx.fillRect(-this.width / 2 - 3, this.height / 2, this.width, 6);

        ctx.fillStyle = this.isFrozen ? '#0D47A1' : '#16703c';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(-this.width / 2 + 2 + i * 8, this.height / 2 + 1, 4, 4);
        }

        // Основной корпус с градиентом
        const gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
        if (this.isFrozen) {
            gradient.addColorStop(0, '#64B5F6');
            gradient.addColorStop(0.5, '#42A5F5');
            gradient.addColorStop(1, '#1E88E5');
        } else {
            gradient.addColorStop(0, '#27ae60');
            gradient.addColorStop(0.5, '#2ecc71');
            gradient.addColorStop(1, '#239954');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Ледяная корка при заморозке
        if (this.isFrozen) {
            ctx.fillStyle = `rgba(224, 247, 250, ${this.frostIntensity * 0.3})`;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

            // Ледяные кристаллы
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.frostIntensity * 0.7})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const x = -this.width / 2 + 10 + i * 15;
                const y = -5 + i * 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 5, y - 3);
                ctx.lineTo(x + 10, y);
                ctx.stroke();
            }
        }

        ctx.strokeStyle = this.isFrozen ? '#1565C0' : '#1e8449';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Задний люк и остальные детали
        ctx.fillStyle = this.isFrozen ? '#1976D2' : '#239954';
        ctx.fillRect(-this.width / 2 + 2, -8, 6, 16);
        ctx.strokeStyle = this.isFrozen ? '#1565C0' : '#1e8449';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width / 2 + 2, -8, 6, 16);

        ctx.restore();

        // Рисуем башню с эффектом заморозки
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);

        if (this.isFrozen) {
            ctx.filter = `hue-rotate(180deg) brightness(${1.2 + this.frostIntensity * 0.3})`;
        }

        // Основание башни
        ctx.fillStyle = this.isFrozen ? '#1E88E5' : '#239954';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Ледяной блеск на башне
        if (this.isFrozen) {
            const shimmerGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, 12);
            shimmerGradient.addColorStop(0, `rgba(255, 255, 255, ${this.frostIntensity * 0.4})`);
            shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shimmerGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = this.isFrozen ? '#1565C0' : '#1e8449';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ствол орудия
        const barrelGradient = ctx.createLinearGradient(0, -4, 35, 4);
        if (this.isFrozen) {
            barrelGradient.addColorStop(0, '#1976D2');
            barrelGradient.addColorStop(0.5, '#1E88E5');
            barrelGradient.addColorStop(1, '#1565C0');
        } else {
            barrelGradient.addColorStop(0, '#1e8449');
            barrelGradient.addColorStop(0.5, '#239954');
            barrelGradient.addColorStop(1, '#16703c');
        }

        ctx.fillStyle = barrelGradient;
        ctx.fillRect(0, -4, 35, 8);

        // Ледяные наросты на стволе
        if (this.isFrozen) {
            ctx.fillStyle = `rgba(224, 247, 250, ${this.frostIntensity * 0.5})`;
            ctx.fillRect(0, -4, 35, 8);

            // Сосульки на стволе
            ctx.fillStyle = `rgba(129, 212, 250, ${this.frostIntensity})`;
            for (let i = 0; i < 3; i++) {
                const x = 10 + i * 8;
                ctx.beginPath();
                ctx.moveTo(x, 4);
                ctx.lineTo(x - 2, 7);
                ctx.lineTo(x + 2, 7);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.strokeStyle = this.isFrozen ? '#0D47A1' : '#16703c';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, -4, 35, 8);

        // Дульный тормоз
        ctx.fillStyle = this.isFrozen ? '#0D47A1' : '#16703c';
        ctx.fillRect(35, -5, 5, 10);
        ctx.strokeStyle = this.isFrozen ? '#01579B' : '#145a32';
        ctx.strokeRect(35, -5, 5, 10);

        ctx.restore();

        // Рисуем щит
        if (this.hasShield && this.shield > 0 && !this.shieldBroken) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const shieldGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 45);
            if (this.isFrozen) {
                shieldGradient.addColorStop(0, `rgba(33, 150, 243, ${0.1 + this.frostIntensity * 0.1})`);
                shieldGradient.addColorStop(0.5, `rgba(30, 136, 229, ${0.2 + this.frostIntensity * 0.1})`);
                shieldGradient.addColorStop(1, `rgba(21, 101, 192, ${0.3 + this.frostIntensity * 0.1})`);
            } else {
                shieldGradient.addColorStop(0, 'rgba(52, 152, 219, 0.1)');
                shieldGradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.2)');
                shieldGradient.addColorStop(1, 'rgba(52, 152, 219, 0.3)');
            }

            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 45, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = this.isFrozen ? '#1976D2' : '#3498db';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Гексагональный узор на щите
            ctx.strokeStyle = this.isFrozen ? `rgba(129, 212, 250, ${0.3 + this.frostIntensity * 0.2})` : 'rgba(52, 152, 219, 0.3)';
            ctx.lineWidth = 1;
            const hexSize = 15;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * hexSize, Math.sin(angle) * hexSize);
                ctx.lineTo(Math.cos(angle + Math.PI / 3) * hexSize, Math.sin(angle + Math.PI / 3) * hexSize);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Рисуем броню
        if (this.armor > 0 && this.armorTimer > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const pulseEffect = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;

            ctx.strokeStyle = this.isFrozen ?
                `rgba(129, 212, 250, ${this.armorTimer * pulseEffect})` :
                `rgba(255, 215, 0, ${this.armorTimer * pulseEffect})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = Date.now() * 0.01;

            ctx.strokeRect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
            ctx.setLineDash([]);

            ctx.restore();
        }

        // Эффект заморозки вокруг танка
        if (this.isFrozen) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Ледяная аура
            const auraGradient = ctx.createRadialGradient(0, 0, 30, 0, 0, 60);
            auraGradient.addColorStop(0, `rgba(129, 212, 250, ${this.frostIntensity * 0.2})`);
            auraGradient.addColorStop(1, 'rgba(129, 212, 250, 0)');

            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, Math.PI * 2);
            ctx.fill();

            // Снежинки вокруг танка
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.frostIntensity * 0.8})`;
            ctx.lineWidth = 1;

            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 + Date.now() * 0.02) * Math.PI / 180;
                const distance = 40 + Math.sin(Date.now() * 0.001 + i) * 10;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;

                // Рисуем снежинку
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Date.now() * 0.001);

                for (let j = 0; j < 6; j++) {
                    ctx.save();
                    ctx.rotate(j * Math.PI / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -8);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(0, -3);
                    ctx.lineTo(-2, -5);
                    ctx.moveTo(0, -3);
                    ctx.lineTo(2, -5);
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.restore();
            }

            ctx.restore();
        }

        // Эффект мерцания при телепортации
        if (this.isTeleporting) {
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(this.teleportAnimationTime * 0.05) * 0.5;
        }

        if (this.isTeleporting) {
            ctx.restore();
        }

        this.drawlightningEffects();
        this.drawHealthBar();

        // Рисуем частицы телепортации
        this.teleportParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        this.drawAbilityTeleportCooldown();
        this.drawAbilityBlastCooldown()
        this.drawAbilityRegenCooldown();
        this.drawChainLightningCooldown();

        const barY = this.y - this.height / 2 - 25;
        // Полоска щита
        if (this.hasShield && (this.shield > 0 || this.shieldBroken)) {
            const shieldBarWidth = 55;
            const shieldBarHeight = 6;
            const shieldPercentage = this.shield / this.maxShield;

            // Фон полоски щита
            ctx.fillStyle = 'rgba(0, 100, 100, 0.5)';
            ctx.fillRect(this.x - shieldBarWidth / 2, barY, shieldBarWidth, shieldBarHeight);

            // Заполнение щита
            if (!this.shieldBroken) {
                ctx.fillStyle = '#00ffff';
            } else {
                ctx.fillStyle = '#ff6666';
            }
            ctx.fillRect(this.x - shieldBarWidth / 2, barY, shieldBarWidth * shieldPercentage, shieldBarHeight);
        }

        // Рисуем эффект отравления
        this.drawPoisonEffect();

        // Надпись "🛡️"
        if (this.blockTimer > 0) {
            ctx.font = '20px Arial';
            ctx.fillStyle = 'red';
            ctx.fillText('🛡️', this.x - 10, this.y - 40);
            this.blockTimer--;
        }

        // Рисуем пули
        this.bullets.forEach(bullet => bullet.draw());

        // Рисуем дроны
        this.drawDrones();
    }

    // Добавьте в метод draw после отрисовки танка
    drawPoisonEffect() {
        if (!this.isPoisoned) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Зеленая аура вокруг танка
        const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.2 + 0.3;
        ctx.strokeStyle = `rgba(76, 175, 80, ${pulseIntensity})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(this.width, this.height) * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Рисуем пузырьки яда
        this.poisonBubbles.forEach(bubble => {
            ctx.save();
            ctx.globalAlpha = bubble.life * 0.7;

            const bubbleGradient = ctx.createRadialGradient(
                bubble.x, bubble.y, 0,
                bubble.x, bubble.y, bubble.size
            );
            bubbleGradient.addColorStop(0, '#81c784');
            bubbleGradient.addColorStop(0.7, '#66bb6a');
            bubbleGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = bubbleGradient;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        ctx.restore();

        // Индикатор отравления над танком
        this.drawPoisonIndicator();
    }

    drawPoisonIndicator() {
        ctx.save();

        // Позиция индикатора
        const indicatorY = this.y - this.height / 2 - 25;

        // Фон индикатора
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - 20, indicatorY - 8, 40, 16);

        // Рамка
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 20, indicatorY - 8, 40, 16);

        // Иконка яда
        ctx.fillStyle = '#66bb6a';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', this.x - 10, indicatorY);

        // Таймер отравления
        const timeLeft = Math.max(0, (this.poisonEndTime - Date.now()) / 1000);
        ctx.fillStyle = '#81c784';
        ctx.font = '10px Arial';
        ctx.fillText(timeLeft.toFixed(1) + 's', this.x + 10, indicatorY);

        // Полоска прогресса отравления
        const progress = timeLeft / (this.poisonEndTime - (this.poisonEndTime - 3000)) * 1000;
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(this.x - 18, indicatorY + 5, 36, 2);
        ctx.fillStyle = '#66bb6a';
        ctx.fillRect(this.x - 18, indicatorY + 5, 36 * progress, 2);

        ctx.restore();
    }

    drawlightningEffects() {
        // Рисуем эффекты молнии
        this.lightningEffects.forEach(effect => {
            ctx.save();
            ctx.strokeStyle = `rgba(150, 200, 255, ${effect.life})`;
            ctx.lineWidth = effect.width;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(150, 200, 255, 0.8)';

            ctx.beginPath();
            ctx.moveTo(effect.points[0].x, effect.points[0].y);

            for (let i = 1; i < effect.points.length; i++) {
                ctx.lineTo(effect.points[i].x, effect.points[i].y);
            }

            ctx.stroke();

            // Дополнительный слой для яркости
            ctx.strokeStyle = `rgba(255, 255, 255, ${effect.life * 0.5})`;
            ctx.lineWidth = effect.width * 0.5;
            ctx.stroke();

            ctx.restore();
        });
    }

    drawAbilityTeleportCooldown() {
        // Индикатор перезарядки телепорта (фиксированная позиция)
        if (this.canTeleport) {
            const cooldownProgress = Math.min(1, (Date.now() - this.lastTeleportTime) / this.teleportCooldown);
            const isReady = cooldownProgress >= 1;

            ctx.save();
            // Сбрасываем трансформацию для UI
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            // Фиксированная позиция рядом с индикатором энергетического взрыва
            const indicatorX = 100;  // 100 пикселей от левого края (рядом с первым индикатором)
            const indicatorY = canvas.height - 40;  // 40 пикселей от нижнего края

            ctx.translate(indicatorX, indicatorY);

            // Фоновая подложка с градиентом
            const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            bgGradient.addColorStop(0, isReady ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
            bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = bgGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // Основной круг способности
            const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
            if (isReady) {
                mainGradient.addColorStop(0, '#00ffff');
                mainGradient.addColorStop(0.5, '#00ccff');
                mainGradient.addColorStop(1, '#0099ff');
            } else {
                mainGradient.addColorStop(0, '#444');
                mainGradient.addColorStop(1, '#222');
            }
            ctx.fillStyle = mainGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();

            // Символ телепорта (портал)
            ctx.save();
            ctx.rotate(isReady ? Date.now() * 0.003 : 0);

            // Внешний портал
            ctx.strokeStyle = isReady ? '#ffffff' : '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Внутренний портал
            ctx.strokeStyle = isReady ? '#00ffff' : '#555';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.stroke();

            // Центральная точка
            ctx.fillStyle = isReady ? '#ffffff' : '#666';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Эффекты готовности
            if (isReady) {
                // Пульсирующее свечение
                const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
                ctx.shadowBlur = 15 + pulse * 15;
                ctx.shadowColor = '#00ffff';
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
                ctx.stroke();

                // Частицы вокруг
                ctx.shadowBlur = 0;
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i - Date.now() * 0.002;
                    const particleRadius = 24 + Math.sin(Date.now() * 0.01 + i * 2) * 4;
                    const particleX = Math.cos(angle) * particleRadius;
                    const particleY = Math.sin(angle) * particleRadius;

                    // Эффект следа
                    ctx.strokeStyle = '#00ffff';
                    ctx.globalAlpha = 0.3;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    const trailAngle = angle - 0.3;
                    const trailX = Math.cos(trailAngle) * particleRadius;
                    const trailY = Math.sin(trailAngle) * particleRadius;
                    ctx.moveTo(trailX, trailY);
                    ctx.lineTo(particleX, particleY);
                    ctx.stroke();

                    // Сама частица
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 0.6 + pulse * 0.4;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // Прогресс перезарядки
            if (cooldownProgress < 1) {
                // Полоса прогресса
                ctx.strokeStyle = '#ff00ff';
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
                glowGradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
                glowGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(endX, endY, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Текст готовности или процент
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;

            if (isReady) {
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#0099ff';
                ctx.fillText('READY', 0, 35);
            } else {
                ctx.fillStyle = '#ff00ff';
                ctx.shadowColor = '#000';
                ctx.fillText(Math.floor(cooldownProgress * 100) + '%', 0, 35);
            }

            // Клавиша активации
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = isReady ? '#fff' : '#888';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#000';
            ctx.fillText('[E]', 0, -30);

            ctx.restore();
        }
    }

    drawAbilityBlastCooldown() {
        // Индикатор перезарядки энергетического взрыва
        if (this.hasEnergyBlast) {
            const cooldownProgress = Math.min(1, (Date.now() - this.lastEnergyBlastTime) / this.energyBlastCooldown);
            const isReady = cooldownProgress >= 1;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            // Фиксированная позиция рядом с индикатором энергетического взрыва
            const indicatorX = 40;  // 100 пикселей от левого края (рядом с первым индикатором)
            const indicatorY = canvas.height - 40;  // 40 пикселей от нижнего края
            ctx.translate(indicatorX, indicatorY);

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
                const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
                ctx.shadowBlur = 15 + pulse * 15;
                ctx.shadowColor = '#ffaa00';
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
                ctx.stroke();

                // Энергетические искры
                ctx.shadowBlur = 0;
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i + Date.now() * 0.004;
                    const sparkRadius = 24 + Math.sin(Date.now() * 0.01 + i * 1.5) * 4;
                    const sparkX = Math.cos(angle) * sparkRadius;
                    const sparkY = Math.sin(angle) * sparkRadius;

                    // Эффект энергетического следа
                    ctx.strokeStyle = '#ffaa00';
                    ctx.globalAlpha = 0.3;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    const trailAngle = angle - 0.4;
                    const trailX = Math.cos(trailAngle) * sparkRadius;
                    const trailY = Math.sin(trailAngle) * sparkRadius;
                    ctx.moveTo(trailX, trailY);
                    ctx.lineTo(sparkX, sparkY);
                    ctx.stroke();

                    // Энергетическая частица
                    const sparkGradient = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 3);
                    sparkGradient.addColorStop(0, '#ffffff');
                    sparkGradient.addColorStop(0.5, '#ffff00');
                    sparkGradient.addColorStop(1, '#ff8800');
                    ctx.fillStyle = sparkGradient;
                    ctx.globalAlpha = 0.6 + pulse * 0.4;
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
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

            if (isReady) {
                ctx.fillStyle = '#ffff00';
                ctx.shadowColor = '#ff8800';
                ctx.fillText('READY', 0, 35);
            } else {
                ctx.fillStyle = '#ff8800';
                ctx.shadowColor = '#000';
                ctx.fillText(Math.floor(cooldownProgress * 100) + '%', 0, 35);
            }

            // Клавиша активации
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = isReady ? '#fff' : '#888';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#000';
            ctx.fillText('[Q]', 0, -30);

            ctx.restore();
        }
    }

    drawAbilityRegenCooldown() {
        if (this.hasRegen) {
            const cooldownProgress = Math.min(1, (Date.now() - this.rapidRegenCooldownEndTime + this.rapidRegenCooldown) / this.rapidRegenCooldown);
            const isReady = cooldownProgress >= 1 && !this.rapidRegenActive;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            // Фиксированная позиция рядом с индикатором энергетического взрыва
            const indicatorX = 160;  // 100 пикселей от левого края (рядом с первым индикатором)
            const indicatorY = canvas.height - 40;  // 40 пикселей от нижнего края

            ctx.translate(indicatorX, indicatorY);

            // Фоновая подложка с градиентом
            const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            bgGradient.addColorStop(0, isReady ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)');
            bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = bgGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // Основной круг способности
            const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
            if (isReady) {
                mainGradient.addColorStop(0, '#4CAF50');
                mainGradient.addColorStop(0.5, '#66BB6A');
                mainGradient.addColorStop(1, '#388E3C');
            } else if (this.rapidRegenActive) {
                // Активная способность - яркий зеленый
                mainGradient.addColorStop(0, '#76FF03');
                mainGradient.addColorStop(0.5, '#64DD17');
                mainGradient.addColorStop(1, '#33691E');
            } else {
                mainGradient.addColorStop(0, '#444');
                mainGradient.addColorStop(1, '#222');
            }
            ctx.fillStyle = mainGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();

            // Символ регенерации (крест)
            ctx.save();
            if (this.rapidRegenActive) {
                ctx.rotate(Date.now() * 0.002);
            }

            ctx.strokeStyle = isReady || this.rapidRegenActive ? '#ffffff' : '#666';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            // Вертикальная линия креста
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(0, 8);
            ctx.stroke();

            // Горизонтальная линия креста
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();

            // Дополнительные элементы при активной способности
            if (this.rapidRegenActive) {
                ctx.strokeStyle = '#76FF03';
                ctx.lineWidth = 2;
                // Диагональные лучи
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 4) + (Math.PI / 2) * i;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
                    ctx.lineTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
                    ctx.stroke();
                }
            }

            ctx.restore();

            // Эффекты готовности или активности
            if (isReady || this.rapidRegenActive) {
                // Пульсирующее свечение
                const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
                ctx.shadowBlur = 15 + pulse * 15;
                ctx.shadowColor = this.rapidRegenActive ? '#76FF03' : '#4CAF50';
                ctx.strokeStyle = this.rapidRegenActive ? '#76FF03' : '#4CAF50';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
                ctx.stroke();

                // Частицы вокруг
                ctx.shadowBlur = 0;
                const particleCount = this.rapidRegenActive ? 12 : 8;
                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 / particleCount) * i + Date.now() * 0.003;
                    const particleRadius = 24 + Math.sin(Date.now() * 0.01 + i * 2) * 4;
                    const particleX = Math.cos(angle) * particleRadius;
                    const particleY = Math.sin(angle) * particleRadius;

                    // Эффект следа для активной способности
                    if (this.rapidRegenActive) {
                        ctx.strokeStyle = '#76FF03';
                        ctx.globalAlpha = 0.3;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        const trailAngle = angle - 0.5;
                        const trailX = Math.cos(trailAngle) * particleRadius;
                        const trailY = Math.sin(trailAngle) * particleRadius;
                        ctx.moveTo(trailX, trailY);
                        ctx.lineTo(particleX, particleY);
                        ctx.stroke();
                    }

                    // Сама частица
                    ctx.fillStyle = this.rapidRegenActive ? '#76FF03' : '#ffffff';
                    ctx.globalAlpha = 0.6 + pulse * 0.4;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, this.rapidRegenActive ? 3 : 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // Прогресс перезарядки
            if (cooldownProgress < 1 && !this.rapidRegenActive) {
                // Полоса прогресса
                ctx.strokeStyle = '#689F38';
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
                glowGradient.addColorStop(0, 'rgba(104, 159, 56, 0.8)');
                glowGradient.addColorStop(1, 'rgba(104, 159, 56, 0)');
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(endX, endY, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Прогресс активной способности
            if (this.rapidRegenActive) {
                const activeProgress = Math.max(0, (this.rapidRegenEndTime - Date.now()) / this.rapidRegenDuration);
                ctx.strokeStyle = '#76FF03';
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * activeProgress);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Текст готовности, активности или процент
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;

            if (this.rapidRegenActive) {
                const remainingTime = Math.max(0, (this.rapidRegenEndTime - Date.now()) / 1000).toFixed(1);
                ctx.fillStyle = '#76FF03';
                ctx.shadowColor = '#33691E';
                ctx.fillText(remainingTime + 's', 0, 35);
            } else if (isReady) {
                ctx.fillStyle = '#4CAF50';
                ctx.shadowColor = '#1B5E20';
                ctx.fillText('READY', 0, 35);
            } else {
                ctx.fillStyle = '#689F38';
                ctx.shadowColor = '#000';
                ctx.fillText(Math.floor(cooldownProgress * 100) + '%', 0, 35);
            }

            // Клавиша активации
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = isReady ? '#fff' : '#888';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#000';
            ctx.fillText('[R]', 0, -30);

            ctx.restore();
        }
    }

    drawChainLightningCooldown() {
        if (!this.hasChainLightning) return;

        const cooldownProgress = Math.min(1, (Date.now() - this.lastChainLightningTime) / this.chainLightningCooldown);
        const isReady = cooldownProgress >= 1;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Позиция индикатора (третий в ряду)
        const indicatorX = 220;
        const indicatorY = canvas.height - 40;
        ctx.translate(indicatorX, indicatorY);

        // Фон
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Основной круг способности
        ctx.fillStyle = isReady ? '#4a9eff' : '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Символ молнии
        ctx.strokeStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isReady) {
            // Анимированное свечение для готовой способности
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.shadowBlur = 10 + pulse * 5;
            ctx.shadowColor = '#4a9eff';
        }

        // Рисуем молнию
        ctx.beginPath();
        ctx.moveTo(-5, -8);
        ctx.lineTo(3, -2);
        ctx.lineTo(-1, 2);
        ctx.lineTo(5, 8);
        ctx.stroke();

        // Внешнее кольцо для готовой способности
        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = 'rgba(74, 158, 255, ' + (0.3 + pulse * 0.3) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();

            // Частицы вокруг
            ctx.shadowBlur = 0;
            const particleCount = 6;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 / particleCount) * i + Date.now() * 0.002;
                const particleRadius = 24 + Math.sin(Date.now() * 0.005 + i * 2) * 3;
                const particleX = Math.cos(angle) * particleRadius;
                const particleY = Math.sin(angle) * particleRadius;

                ctx.fillStyle = '#4a9eff';
                ctx.globalAlpha = 0.6 + pulse * 0.4;
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Прогресс перезарядки
        if (cooldownProgress < 1) {
            // Полоса прогресса
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.8;

            ctx.beginPath();
            ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cooldownProgress));
            ctx.stroke();

            // Текст оставшегося времени
            const remainingTime = Math.ceil((this.chainLightningCooldown - (Date.now() - this.lastChainLightningTime)) / 1000);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1;
            ctx.fillText(remainingTime + 's', 0, 28);
        }

        // Клавиша активации
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[F]', -5, -30);

        ctx.restore();
    }

    updateFrostParticles(deltaTime) {
        // Добавляем новые частицы если танк заморожен
        if (this.isFrozen && Math.random() < 0.3 * this.frostIntensity) {
            this.frostParticles.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 30,
                vy: -Math.random() * 50 - 20,
                life: 1,
                size: Math.random() * 4 + 2
            });
        }

        // Обновляем существующие частицы
        this.frostParticles = this.frostParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 50 * deltaTime;
            particle.life -= deltaTime * 1.5;
            return particle.life > 0;
        });
    }

    checkBlock(blockProbability) {
        var randomNum = Math.random() * 100;
        if (randomNum < blockProbability) {
            return true;
        } else {
            return false;
        }
    }

    takeDamage(damage, bulletX, bulletY) {
        // Рассчитываем угол попадания снаряда
        const bulletAngle = Math.atan2(bulletY - this.y, bulletX - this.x);

        // Нормализуем углы в диапазон от -π до π
        let angleDiff = bulletAngle - this.bodyAngle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Проверяем, попал ли снаряд в переднюю часть танка
        const frontArcRange = Math.PI / 4; // 45 градусов в радианах
        const isFrontalHit = Math.abs(angleDiff) <= frontArcRange;

        // Проверка на блок
        const blockProbability = this.armor + 25; // +25% на шанс блока
        if (this.checkBlock(blockProbability)) {
            this.blockTimer = 25;
            statManager.blockedByArmor += damage;
            return;
        }

        if (isFrontalHit) {
            // Лобовое попадание - урон уменьшается в 2 раза
            damage = Math.floor(damage / 2);
        }

        // Сначала урон идёт по щиту
        if (this.hasShield && this.shield > 0 && !this.shieldBroken) {
            const shieldDamage = Math.min(damage, this.shield);
            this.shield -= shieldDamage;
            damage -= shieldDamage;
            statManager.blockedByShield += shieldDamage;

            if (this.shield <= 0) {
                this.shieldBroken = true;
                this.lastShieldBreak = Date.now();
                this.shield = 0;
            }
        }

        this.health -= damage;
        statManager.takeDamages += damage;

        // Звук и эффекты при получении урона
        soundManager.playHit();
        cameraShake.trigger(4 + damage * 0.1);
        damageFlash = 1;

        if (this.health <= 0) {
            gameRunning = false;
            document.getElementById('gameOver').style.display = 'block';
            document.getElementById('finalScore').textContent = score;
            if (this.onGameOver) {
                this.onGameOver();
            }
        }
    }

    freeze(duration, slowAmount = 0.5) {
        // Применяем эффект заморозки
        this.frozenEndTime = Date.now() + duration;
        this.slowEffect = slowAmount;
        this.isFrozen = true;

        // Добавляем взрыв ледяных частиц при заморозке
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            this.frostParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 1,
                size: Math.random() * 6 + 3
            });
        }
    }

    teleport(mouseX, mouseY) {
        const now = Date.now();

        // Проверяем, можем ли телепортироваться
        if (!this.canTeleport) return;
        if (now - this.lastTeleportTime < this.teleportCooldown) return;

        // Сохраняем старую позицию для эффекта следа
        const oldX = this.x;
        const oldY = this.y;

        // Преобразуем координаты мыши из экранных в мировые
        const worldMouseX = mouseX + camera.x;
        const worldMouseY = mouseY + camera.y;

        // Вычисляем направление к курсору в мировых координатах
        const dx = worldMouseX - this.x;
        const dy = worldMouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Если расстояние слишком мало, не телепортируемся
        if (distance < 10) return;

        // Нормализуем направление и применяем максимальную дистанцию
        const teleportDist = Math.min(distance, this.teleportDistance);
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Новая позиция в мировых координатах
        let newX = this.x + dirX * teleportDist;
        let newY = this.y + dirY * teleportDist;

        // Ограничиваем позицию границами игрового мира (если они есть)
        // Предполагаем, что у вас есть worldWidth и worldHeight
        if (typeof worldWidth !== 'undefined' && typeof worldHeight !== 'undefined') {
            newX = Math.max(this.width / 2, Math.min(worldWidth - this.width / 2, newX));
            newY = Math.max(this.height / 2, Math.min(worldHeight - this.height / 2, newY));
        }

        // Создаем эффекты в старой позиции
        this.createTeleportEffect(oldX, oldY, 'departure');

        // Телепортируемся
        this.x = newX;
        this.y = newY;

        // Создаем эффекты в новой позиции
        this.createTeleportEffect(this.x, this.y, 'arrival');

        // Создаем след телепортации
        this.createTeleportTrail(oldX, oldY, this.x, this.y);

        // Обновляем состояние
        this.lastTeleportTime = now;
        this.isTeleporting = true;
        this.teleportAnimationTime = 300;

        soundManager.playTeleport();
    }

    // Обновление цепной молнии
    updateChainLightning() {
        if (!this.hasChainLightning) return;

        const now = Date.now();
        
        // Проверяем, прошло ли время перезарядки
        if (!this.lastLightningTime || now - this.lastLightningTime >= this.chainLightningCooldown) {
            // Проверяем, есть ли враги в радиусе
            if (this.checkEnemiesInRange()) {
                this.shootChainLightning();
                this.lastLightningTime = now;
            }
        }
    }

    // Проверка наличия врагов в радиусе действия молнии
    checkEnemiesInRange() {
        if (!enemies || enemies.length === 0) return false;

        for (let enemy of enemies) {
            if (enemy.active) {
                const distance = Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
                if (distance <= this.chainLightningBounceRange) {
                    return true;
                }
            }
        }
        return false;
    }

    // Метод для стрельбы цепной молнией
    shootChainLightning() {
        if (!this.hasChainLightning) return;

        // Создаем молнию от позиции игрока
        const lightning = new LightningBullet(
            this.x, 
            this.y, 
            this.chainLightningDamage, 
            'player',
            this.maxChainTargets,
            this.chainLightningBounceRange
        );

        // Добавляем в специальный массив для молний
        if (!this.lightningBullets) {
            this.lightningBullets = [];
        }
        this.lightningBullets.push(lightning);

        // Воспроизводим звук
        if (typeof soundManager !== 'undefined') {
            soundManager.playLightning();
        }

        // Добавляем визуальный эффект в месте игрока
        this.createLightningEffect();
    }

    // Визуальный эффект при активации молнии
    createLightningEffect() {
        // Создаем частицы вокруг игрока
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particleX = this.x + Math.cos(angle) * 30;
            const particleY = this.y + Math.sin(angle) * 30;
            
            particles.push(new Particle(particleX, particleY, '#ffff00', {
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 500,
                size: 3
            }));
        }
    }
    
    createTeleportEffect(x, y, type) {
        const particleCount = 20;
        const colors = type === 'departure' ?
            ['#ff00ff', '#ff66ff', '#ffaaff'] :
            ['#00ffff', '#66ffff', '#aaffff'];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 100 + 50;

            this.teleportParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 1,
                size: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: type
            });
        }
    }

    createTeleportTrail(startX, startY, endX, endY) {
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            this.teleportTrail.push({
                x: startX + (endX - startX) * t,
                y: startY + (endY - startY) * t,
                life: 1 - t * 0.5,
                size: 20 * (1 - t * 0.5)
            });
        }
    }

    updateTeleportEffects(deltaTime) {
        // Обновляем анимацию телепортации
        if (this.teleportAnimationTime > 0) {
            this.teleportAnimationTime -= deltaTime * 1000;
            if (this.teleportAnimationTime <= 0) {
                this.isTeleporting = false;
            }
        }

        // Обновляем частицы
        this.teleportParticles = this.teleportParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.95; // Замедление
            particle.vy *= 0.95;
            particle.life -= deltaTime * 2;
            return particle.life > 0;
        });

        // Обновляем след
        this.teleportTrail = this.teleportTrail.filter(trail => {
            trail.life -= deltaTime * 3;
            return trail.life > 0;
        });
    }

    startChargingBlast() {
        if (!this.hasEnergyBlast) return;
        if (Date.now() - this.lastEnergyBlastTime < this.energyBlastCooldown) return;
        if (this.isFrozen) return;

        this.isChargingBlast = true;
        this.blastChargeTime = 0;
    }

    releaseEnergyBlast() {
        if (!this.isChargingBlast) return;

        // Минимальная зарядка для активации
        const chargePercent = Math.min(1, this.blastChargeTime / this.maxChargeTime);
        if (chargePercent < 0.3) {
            this.isChargingBlast = false;
            this.blastChargeTime = 0;
            return;
        }

        // Активируем взрыв
        this.energyBlastActive = true;
        this.energyBlastAnimation = 500; // 500мс анимация
        this.shockwaveRadius = 0;
        this.lastEnergyBlastTime = Date.now();
        this.isChargingBlast = false;

        // Создаем визуальные эффекты
        this.createEnergyBlastEffects(chargePercent);

        soundManager.playEnergyBlast();
        cameraShake.trigger(12);

        // Возвращаем данные для обработки урона врагам
        return {
            x: this.x,
            y: this.y,
            radius: this.energyBlastRadius * chargePercent,
            damage: this.energyBlastDamage * chargePercent,
            force: this.energyBlastForce * chargePercent
        };
    }

    createEnergyBlastEffects(chargePercent) {
        // Создаем молнии
        const lightningCount = Math.floor(8 * chargePercent);
        for (let i = 0; i < lightningCount; i++) {
            const angle = (Math.PI * 2 * i) / lightningCount;
            this.lightningBolts.push({
                angle: angle,
                length: this.energyBlastRadius * chargePercent,
                segments: this.generateLightningPath(this.energyBlastRadius * chargePercent),
                life: 1,
                thickness: 3 + chargePercent * 2
            });
        }

        // Создаем энергетические частицы
        const particleCount = Math.floor(30 * chargePercent);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.energyBlastRadius * chargePercent;
            const speed = Math.random() * 200 + 100;

            this.energyParticles.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
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

    updateEnergyBlast(deltaTime) {
        // Обновляем зарядку
        if (this.isChargingBlast) {
            this.blastChargeTime += deltaTime * 1000;

            // Создаем частицы зарядки
            if (Math.random() < 0.8) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 30;

                this.energyParticles.push({
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance,
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
        if (this.energyBlastAnimation > 0) {
            this.energyBlastAnimation -= deltaTime * 1000;
            this.shockwaveRadius += deltaTime * 500; // Скорость расширения волны

            if (this.energyBlastAnimation <= 0) {
                this.energyBlastActive = false;
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
                const dx = this.x - particle.x;
                const dy = this.y - particle.y;
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

    activateChainLightning(enemies, mouseX, mouseY) {
        if (!this.hasChainLightning) return;
        if (Date.now() - this.lastChainLightningTime < this.chainLightningCooldown) return;

        // Находим врага под курсором
        let targetEnemy = null;
        const clickRadius = 30; // Радиус для определения врага под курсором

        // Преобразуем координаты мыши в мировые координаты
        const worldMouseX = mouseX + camera.x;
        const worldMouseY = mouseY + camera.y;

        enemies.forEach(enemy => {
            if (enemy.active) {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - worldMouseX, 2) +
                    Math.pow(enemy.y - worldMouseY, 2)
                );

                if (dist <= clickRadius) {
                    targetEnemy = enemy;
                }
            }
        });

        // Если под курсором есть враг, запускаем молнию
        if (targetEnemy) {
            this.lastChainLightningTime = Date.now();
            this.executeChainLightning(targetEnemy, enemies);
            soundManager.playLightning();
        }
    }

    executeChainLightning(firstTarget, enemies) {
        // Создаем цепь молний
        const hitTargets = new Set();
        let currentTarget = firstTarget;
        let previousX = this.x;
        let previousY = this.y;

        for (let i = 0; i < this.maxChainTargets && currentTarget; i++) {
            // Наносим урон
            currentTarget.takeDamage(this.chainLightningDamage);
            // Если цель уничтожена
            if (!currentTarget.active) {
                enemyDead(currentTarget.x, currentTarget.y);
            }

            statManager.damageByLightning += this.chainLightningDamage;

            hitTargets.add(currentTarget);

            // Создаем эффект молнии
            this.createLightningEffect(previousX, previousY, currentTarget.x, currentTarget.y);

            // Ищем следующую цель (ближайшего непораженного врага)
            previousX = currentTarget.x;
            previousY = currentTarget.y;
            currentTarget = null;
            let nearestDist = this.chainLightningBounceRange;

            enemies.forEach(enemy => {
                if (enemy.active && !hitTargets.has(enemy)) {
                    const dist = Math.sqrt(
                        Math.pow(enemy.x - previousX, 2) +
                        Math.pow(enemy.y - previousY, 2)
                    );
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        currentTarget = enemy;
                    }
                }
            });
        }
    }

    createLightningEffect(x1, y1, x2, y2) {
        const segments = 8;
        const points = [{ x: x1, y: y1 }];

        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
            points.push({ x, y });
        }
        points.push({ x: x2, y: y2 });

        this.lightningEffects.push({
            points: points,
            life: 1.0,
            width: 3
        });
    }

     // В методе Shooting или подобном
    shootChainLightning() {
        if (!this.hasChainLightning || this.lastLightningTime + this.chainLightningCooldown > Date.now()) {
            return;
        }

        // Создаем молнию от позиции игрока
        const lightning = new LightningBullet(
            this.x, 
            this.y, 
            this.chainLightningDamage, 
            'player',
            this.maxChainTargets,
            this.chainLightningBounceRange
        );

        // Добавляем в специальный массив для молний
        if (!this.lightningBullets) {
            this.lightningBullets = [];
        }
        this.lightningBullets.push(lightning);

        this.lastLightningTime = Date.now();
        
        // Воспроизводим звук
        if (typeof soundManager !== 'undefined') {
            soundManager.playLightning();
        }
    }

    // Обновление дронов-камикадзе
    updateDrones(enemies, deltaTime) {
        if (!this.hasDroneKamikaze) return;

        const currentTime = Date.now();

        // Спавн нового дрона
        if (currentTime - this.lastDroneTime >= this.droneCooldown) {
            // Создаем дрон в позиции игрока
            const drone = new KamikazeDrone(
                this.x,
                this.y,
                this.droneDamage,
                'player'
            );
            this.drones.push(drone);
            this.lastDroneTime = currentTime;
        }

        // Обновление существующих дронов
        this.drones = this.drones.filter(drone => {
            drone.update(enemies, this, deltaTime);
            return drone.active;
        });
    }

    // Отрисовка дронов
    drawDrones() {
        this.drones.forEach(drone => drone.draw());
    }
}