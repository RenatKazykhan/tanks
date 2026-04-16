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
        this.visibilityRadius = tankStats.visibilityRadius || 300;
        this.turretRotationSpeed = tankStats.turretRotationSpeed || 5;
        this.bodyRotationSpeed = tankStats.bodyRotationSpeed || 3;
        this.accuracy = 0.95; // Точность стрельбы

        // Двойной выстрел
        this.doubleShot = false;
        this.doubleShotChance = 0.25;

        // Эффекты заморозки
        this.isFrozen = false;
        this.frozenEndTime = 0;
        this.slowEffect = 1; // Множитель скорости (1 = нормальная скорость)
        this.frostParticles = [];
        this.frostIntensity = 0; // Интенсивность заморозки для визуального эффекта

        this.skillPoints = 1;
        this.regenerationSkill = new Regeneration(this);
        this.chainLightningSkill = new ChainLightning(this);
        this.shieldSkill = new Shield(this);
        this.lifestealSkill = new Lifesteal(this);
        this.doubleShootSkill = new DoubleShoot(this);
        this.droneSkill = new DroneSkill(this);
        // Телепортация
        this.teleportSkill = new Teleport(this);

        // Энергетический взрыв 
        this.onEnergyBlast = onEnergyBlast;
        this.blastSkill = new Blast(this);

        // Удача
        this.lucky = 0;
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
            this.bodyAngle -= this.bodyRotationSpeed * this.slowEffect * deltaTime;
        }
        if (keys['d'] || keys['D']) {
            this.bodyAngle += this.bodyRotationSpeed * this.slowEffect * deltaTime;
        }

        // Обновляем эффекты телепортации
        this.teleportSkill.update(deltaTime);
        // Автоматическая активация цепной молнии
        this.chainLightningSkill.updateChainLightning(this.x, this.y);
        this.chainLightningSkill.updateVisualEffects(deltaTime);

        if (keys['e'] || keys['E']) {
            if (!this.teleportSkill.teleportKeyPressed) {
                this.teleportSkill.activate(mouseX, mouseY);
                this.teleportSkill.teleportKeyPressed = true;
            }
        } else {
            this.teleportSkill.teleportKeyPressed = false;
        }

        // В обработчике нажатия клавиш
        if (keys['f'] || keys['F']) {
            this.chainLightningSkill.activate(enemies, mouseX, mouseY); // enemies - массив врагов
        }

        // Энергетический взрыв
        if (keys['q'] || keys['Q']) {
            if (!this.blastKeyPressed) {
                this.blastSkill.startCharging();
                this.blastKeyPressed = true;
            }
        } else {
            if (this.blastKeyPressed && this.blastSkill.isCharging) {
                const blastData = this.blastSkill.releaseBlast();
                if (blastData) {
                    this.onEnergyBlast && this.onEnergyBlast(blastData);
                }
            }
            this.blastKeyPressed = false;
        }

        // Активация быстрой регенерации
        if ((keys['r'] || keys['R'])) {
            this.regenerationSkill.activate();
        }

        // Активация заморозки щита
        if (keys['g'] || keys['G']) {
            if (!this.shieldFreezeKeyPressed) {
                this.shieldSkill.activate(enemies);
                this.shieldFreezeKeyPressed = true;
            }
        } else {
            this.shieldFreezeKeyPressed = false;
        }

        // Активация вампиризма
        if (keys['v'] || keys['V']) {
            if (!this.lifestealKeyPressed) {
                this.lifestealSkill.activate();
                this.lifestealKeyPressed = true;
            }
        } else {
            this.lifestealKeyPressed = false;
        }

        // Активация залпа двойного выстрела
        if (keys['c'] || keys['C']) {
            if (!this.doubleShootKeyPressed) {
                this.doubleShootSkill.activate();
                this.doubleShootKeyPressed = true;
            }
        } else {
            this.doubleShootKeyPressed = false;
        }

        // Активация залпа дронов
        if (keys['x'] || keys['X']) {
            if (!this.droneKeyPressed) {
                this.droneSkill.activate();
                this.droneKeyPressed = true;
            }
        } else {
            this.droneKeyPressed = false;
        }

        // Обработка быстрой регенерации
        this.regenerationSkill.update(deltaTime);

        // Обновляем эффекты щита/заморозки
        this.shieldSkill.update(deltaTime, enemies);

        // Обновляем эффекты взрыва
        this.blastSkill.update(deltaTime);

        // Обновляем вампиризм
        this.lifestealSkill.update(deltaTime);

        // Обновляем двойной выстрел
        this.doubleShootSkill.update(deltaTime);

        // Регенерация щита
        if (this.shieldSkill.shield < this.shieldSkill.maxShield && !this.shieldSkill.shieldBroken) {
            this.shieldSkill.shield = Math.min(this.shieldSkill.maxShield, this.shieldSkill.shield + this.shieldSkill.shieldRegenRate * deltaTime);
        } else if (this.shieldSkill.shieldBroken && Date.now() - this.shieldSkill.lastShieldBreak > this.shieldSkill.shieldRegenDelay) {
            this.shieldSkill.shieldBroken = false;
        }

        // Поворот башни к мыши (также замедлен при заморозке)
        const dx = mouseX - this.x + camera.x;
        const dy = mouseY - this.y + camera.y;
        const targetAngle = Math.atan2(dy, dx);

        let angleDiff = targetAngle - this.turretAngle;
        // Нормализуем разницу углов от -PI до PI
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        let currentTurretSpeed = this.turretRotationSpeed;
        if (this.isFrozen) {
            currentTurretSpeed *= 0.2; // Сильное замедление башни при заморозке
        }
        
        const turnStep = currentTurretSpeed * this.slowEffect * deltaTime;
        
        if (Math.abs(angleDiff) <= turnStep) {
            this.turretAngle = targetAngle;
        } else {
            this.turretAngle += Math.sign(angleDiff) * turnStep;
        }

        this.updateFrostParticles(deltaTime);
        this.droneSkill.update(enemies, deltaTime);

        // Ограничение движения в пределах мира
        this.x = Math.max(player.width / 2, Math.min(WORLD_WIDTH - player.width / 2, player.x));
        this.y = Math.max(player.height / 2, Math.min(WORLD_HEIGHT - player.height / 2, player.y));

        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        if (this.health <= this.maxHealth) {
            if (typeof statManager !== 'undefined') {
                statManager.healtRestoredActiveRegen += amount;
            }
        }
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
        this.regenerationSkill.drawEffects();

        // Рисуем след телепортации
        this.teleportSkill.drawEffects();

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
        if (this.shieldSkill.hasShield && this.shieldSkill.shieldAmount > 0 && !this.shieldSkill.shieldBroken) {
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

        // Effect blinking should be properly handled inside tank rendering block if needed,
        // but here it crashes with context underflow. Removed dangling logic.
        this.chainLightningSkill.draw();
        this.regenerationSkill.draw();
        this.teleportSkill.draw();
        this.blastSkill.draw();
        this.shieldSkill.draw(enemies);
        this.lifestealSkill.draw();
        this.doubleShootSkill.draw();

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffb020';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        ctx.textAlign = 'left';
        ctx.fillText(`⚡ Очки навыков: ${this.skillPoints}`, 25, typeof canvas !== 'undefined' ? canvas.height - 140 : 500);
        ctx.restore();

        this.drawHealthBar();

        const barY = this.y - this.height / 2 - 25;
        // Полоска щита
        if (this.shieldSkill.hasShield && (this.shieldSkill.shieldAmount > 0 || this.shieldSkill.shieldBroken)) {
            const shieldBarWidth = 55;
            const shieldBarHeight = 6;
            const shieldPercentage = this.shieldSkill.shieldAmount / this.shieldSkill.maxShield;

            // Фон полоски щита
            ctx.fillStyle = 'rgba(0, 100, 100, 0.5)';
            ctx.fillRect(this.x - shieldBarWidth / 2, barY, shieldBarWidth, shieldBarHeight);

            // Заполнение щита
            if (!this.shieldSkill.shieldBroken) {
                ctx.fillStyle = '#00ffff';
            } else {
                ctx.fillStyle = '#ff6666';
            }
            ctx.fillRect(this.x - shieldBarWidth / 2, barY, shieldBarWidth * shieldPercentage, shieldBarHeight);
        }

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
        this.droneSkill.draw();
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
        if (this.shieldSkill.hasShield && this.shieldSkill.shieldAmount > 0 && !this.shieldSkill.shieldBroken) {
            const shieldDamage = Math.min(damage, this.shieldSkill.shieldAmount);
            this.shieldSkill.shieldAmount -= shieldDamage;
            damage -= shieldDamage;
            statManager.blockedByShield += shieldDamage;

            if (this.shieldSkill.shieldAmount <= 0) {
                this.shieldSkill.shieldBroken = true;
                this.shieldSkill.lastShieldBreak = Date.now();
                this.shieldSkill.shieldAmount = 0;
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
}