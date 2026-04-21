class PlayerTank {
    constructor(x, y, onGameOver) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.bodyAngle = 0;
        this.turretAngle = 0;
        this.bullets = [];
        this.lastShot = 0;
        this.armorTimer = 0;
        this.lifeSteal = 0;
        this.onGameOver = onGameOver;

        // характеристики
        this.speed = 0;
        this.health = 1;
        this.maxHealth = 1;
        this.damage = 1;
        this.shotCooldown = 1000;
        this.bulletSpeed = 10;
        this.regen = 1;
        this.armor = 1;
        this.visibilityRadius =  300;
        this.turretRotationSpeed = 5;
        this.bodyRotationSpeed = 3;

        this.accuracy = 0.95; // Точность стрельбы

        // Эффекты заморозки
        this.slowEffect = 1; // Множитель скорости (1 = нормальная скорость)

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
        this.blastSkill = new Blast(this);

        this.isMoveForward = false;
        this.isMoveBack = false;
        
           // Рикошет
        this.ricochetAngle = 15; // Угол рикошета в градусах
        this.ricochetEffects = []; // Визуальные эффекты рикошета
        this.ricochetIndicator = null; // Индикатор рикошета (текст/иконка)
    }

    update(keys, mouseX, mouseY, deltaTime) {
        // Применяем замедление к скорости
        const currentSpeed = this.speed * this.slowEffect;

        // Движение танка с учетом замедления
        if (keys['w'] || keys['W']) {
            this.x += Math.cos(this.bodyAngle) * currentSpeed * deltaTime;
            this.y += Math.sin(this.bodyAngle) * currentSpeed * deltaTime;
            this.isMoveForward = true
        }
        else this.isMoveForward = false;
        if (keys['s'] || keys['S']) {
            this.x -= Math.cos(this.bodyAngle) * currentSpeed * deltaTime;
            this.y -= Math.sin(this.bodyAngle) * currentSpeed * deltaTime;
            this.isMoveBack = true;
        }
        else this.isMoveBack = false;
        if (keys['a'] || keys['A']) {
            this.bodyAngle -= this.bodyRotationSpeed * this.slowEffect * deltaTime;
        }
        if (keys['d'] || keys['D']) {
            this.bodyAngle += this.bodyRotationSpeed * this.slowEffect * deltaTime;
        }

        if (keys[' ']) {
            this.shoot(); // внутри shoot() должен быть кулдаун!
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
                this.blastSkill.handleEnergyBlast(blastData);
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
        
        const turnStep = currentTurretSpeed * this.slowEffect * deltaTime;
        
        if (Math.abs(angleDiff) <= turnStep) {
            this.turretAngle = targetAngle;
        } else {
            this.turretAngle += Math.sign(angleDiff) * turnStep;
        }

        this.droneSkill.update(enemies, deltaTime);

        // Ограничение движения в пределах мира
        this.x = Math.max(player.width / 2, Math.min(WORLD_WIDTH - player.width / 2, player.x));
        this.y = Math.max(player.height / 2, Math.min(WORLD_HEIGHT - player.height / 2, player.y));

        //пассивное восстановление
        const passiveRegenAmount = this.regen * deltaTime;
        this.heal(passiveRegenAmount);

        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });

        this.updateRicochetEffects(deltaTime);
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

        if (now - this.lastShot > this.shotCooldown) {
            this.newBullet();
            soundManager.playShoot();
            if (this.doubleShootSkill.hasDoubleShoot) {
                const probability = Math.random();
                if (probability < this.doubleShootSkill.doubleChance) {
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
            this.bulletSpeed 
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

        // ==================== КОРПУС ТАНКА ====================
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.bodyAngle);

        // === ТЕНЬ ПОД ТАНКОМ ===
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(2, 2, this.width / 2 + 4, this.height / 2 + 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === ЛЕВАЯ ГУСЕНИЦА (верхняя) ===
        const trackY_top = -this.height / 2 - 8;
        const trackH = 10;
        const trackW = this.width + 6;
        const trackX = -this.width / 2 - 3;

        // Основа гусеницы
        ctx.fillStyle = '#2c3e2c';
        this._roundRect(trackX, trackY_top, trackW, trackH, 4);
        ctx.fill();

        // Внутренняя часть гусеницы (более светлая)
        ctx.fillStyle = '#3d5c3d';
        this._roundRect(trackX + 2, trackY_top + 2, trackW - 4, trackH - 4, 2);
        ctx.fill();

        let trackOffset = 0;
        if (this.isMoveForward) {
            // Вперёд — траки бегут в одну сторону
            trackOffset = (Date.now() * 0.05) % 7.5;
        } else if (this.isMoveBack) {
            // Назад — траки бегут в обратную сторону (минус)
            trackOffset = 7.5 - (Date.now() * 0.05) % 7.5;
        } else {
            // Стоим на месте — траки неподвижны
            trackOffset = 0;
        }

        // Левая гусеница — траки
        ctx.fillStyle = '#1a2e1a';
        for (let i = -1; i < 8; i++) {
            const tx = trackX + 3 + i * 7.5 + trackOffset;
            if (tx > trackX + 1 && tx < trackX + trackW - 3) {
                ctx.fillRect(tx, trackY_top + 1, 2, trackH - 2);
            }
        }

        // Обводка гусеницы
        ctx.strokeStyle = '#1a2e1a';
        ctx.lineWidth = 1.5;
        this._roundRect(trackX, trackY_top, trackW, trackH, 4);
        ctx.stroke();

        // === ПРАВАЯ ГУСЕНИЦА (нижняя) ===
        const trackY_bot = this.height / 2 - 2;

        ctx.fillStyle = '#2c3e2c';
        this._roundRect(trackX, trackY_bot, trackW, trackH, 4);
        ctx.fill();

        ctx.fillStyle = '#3d5c3d';
        this._roundRect(trackX + 2, trackY_bot + 2, trackW - 4, trackH - 4, 2);
        ctx.fill();

        // Правая гусеница — траки (то же смещение)
        ctx.fillStyle = '#1a2e1a';
        for (let i = -1; i < 8; i++) {
            const tx = trackX + 3 + i * 7.5 + trackOffset;
            if (tx > trackX + 1 && tx < trackX + trackW - 3) {
                ctx.fillRect(tx, trackY_bot + 1, 2, trackH - 2);
            }
        }

        ctx.strokeStyle = '#1a2e1a';
        ctx.lineWidth = 1.5;
        this._roundRect(trackX, trackY_bot, trackW, trackH, 4);
        ctx.stroke();

        // === ОСНОВНОЙ КОРПУС ===
        const bodyGradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        bodyGradient.addColorStop(0, '#3dd977');
        bodyGradient.addColorStop(0.3, '#2ecc71');
        bodyGradient.addColorStop(0.7, '#27ae60');
        bodyGradient.addColorStop(1, '#1e8449');

        ctx.fillStyle = bodyGradient;
        this._roundRect(-this.width / 2 + 1, -this.height / 2 + 1, this.width - 2, this.height - 2, 3);
        ctx.fill();

        // Верхний блик на корпусе
        ctx.save();
        ctx.globalAlpha = 0.2;
        const highlightGrad = ctx.createLinearGradient(0, -this.height / 2, 0, 0);
        highlightGrad.addColorStop(0, '#ffffff');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        this._roundRect(-this.width / 2 + 3, -this.height / 2 + 2, this.width - 6, this.height / 2 - 2, 2);
        ctx.fill();
        ctx.restore();

        // Обводка корпуса
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 2;
        this._roundRect(-this.width / 2 + 1, -this.height / 2 + 1, this.width - 2, this.height - 2, 3);
        ctx.stroke();

        // === ДЕТАЛИ КОРПУСА ===

        // Передняя бронепластина (скошенная)
        const frontPlateGrad = ctx.createLinearGradient(this.width / 2 - 10, 0, this.width / 2, 0);
        frontPlateGrad.addColorStop(0, '#239954');
        frontPlateGrad.addColorStop(1, '#1a7a40');
        ctx.fillStyle = frontPlateGrad;
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 8, -this.height / 2 + 2);
        ctx.lineTo(this.width / 2 - 1, -this.height / 2 + 5);
        ctx.lineTo(this.width / 2 - 1, this.height / 2 - 5);
        ctx.lineTo(this.width / 2 - 8, this.height / 2 - 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Задний моторный отсек
        const engineGrad = ctx.createLinearGradient(-this.width / 2, 0, -this.width / 2 + 14, 0);
        engineGrad.addColorStop(0, '#1a7a40');
        engineGrad.addColorStop(1, '#239954');
        ctx.fillStyle = engineGrad;
        this._roundRect(-this.width / 2 + 2, -this.height / 2 + 3, 14, this.height - 6, 2);
        ctx.fill();
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 1;
        this._roundRect(-this.width / 2 + 2, -this.height / 2 + 3, 14, this.height - 6, 2);
        ctx.stroke();

        // Решётка моторного отсека
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) {
            const ly = -this.height / 2 + 6 + i * 5;
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 4, ly);
            ctx.lineTo(-this.width / 2 + 14, ly);
            ctx.stroke();
        }

        // Боковые панели с заклёпками
        const rivetColor = '#5dbd85';
        ctx.fillStyle = rivetColor;

        // Верхний ряд заклёпок
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-this.width / 2 + 18 + i * 7, -this.height / 2 + 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Нижний ряд заклёпок
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-this.width / 2 + 18 + i * 7, this.height / 2 - 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Центральная линия корпуса
        ctx.strokeStyle = '#1e8449';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 16, 0);
        ctx.lineTo(this.width / 2 - 10, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Люк водителя (маленький прямоугольник спереди)
        ctx.fillStyle = '#1e8449';
        this._roundRect(this.width / 2 - 18, -5, 8, 10, 2);
        ctx.fill();
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 1;
        this._roundRect(this.width / 2 - 18, -5, 8, 10, 2);
        ctx.stroke();

        // Перископ водителя
        ctx.fillStyle = '#a8e6cf';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 14, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Блик на перископе
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 14.5, -0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // ==================== БАШНЯ ТАНКА ====================
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);

        // === СТВОЛ ОРУДИЯ ===

        // Тень ствола
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#000';
        ctx.fillRect(10, -2, 30, 9);
        ctx.restore();

        // Основа ствола (внешняя труба)
        const barrelOuterGrad = ctx.createLinearGradient(0, -5, 0, 5);
        barrelOuterGrad.addColorStop(0, '#3dd977');
        barrelOuterGrad.addColorStop(0.3, '#27ae60');
        barrelOuterGrad.addColorStop(0.7, '#1e8449');
        barrelOuterGrad.addColorStop(1, '#145a32');
        ctx.fillStyle = barrelOuterGrad;
        this._roundRect(8, -5, 30, 10, 2);
        ctx.fill();

        // Внутренний канал ствола (тёмная полоса)
        ctx.fillStyle = '#0d3d1f';
        ctx.fillRect(10, -2, 28, 4);

        // Блик на стволе
        ctx.save();
        ctx.globalAlpha = 0.25;
        const barrelHighlight = ctx.createLinearGradient(0, -5, 0, 0);
        barrelHighlight.addColorStop(0, '#ffffff');
        barrelHighlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = barrelHighlight;
        ctx.fillRect(8, -5, 30, 5);
        ctx.restore();

        // Обводка ствола
        ctx.strokeStyle = '#0d3d1f';
        ctx.lineWidth = 1.5;
        this._roundRect(8, -5, 30, 10, 2);
        ctx.stroke();

        // Кольца усиления на стволе
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 2;
        [16, 26].forEach(rx => {
            ctx.beginPath();
            ctx.moveTo(rx, -5);
            ctx.lineTo(rx, 5);
            ctx.stroke();
        });

        // === ДУЛЬНЫЙ ТОРМОЗ ===
        const muzzleGrad = ctx.createLinearGradient(0, -7, 0, 7);
        muzzleGrad.addColorStop(0, '#2ecc71');
        muzzleGrad.addColorStop(0.5, '#1e8449');
        muzzleGrad.addColorStop(1, '#145a32');
        ctx.fillStyle = muzzleGrad;
        this._roundRect(36, -7, 7, 14, 2);
        ctx.fill();

        ctx.strokeStyle = '#0d3d1f';
        ctx.lineWidth = 1.5;
        this._roundRect(36, -7, 7, 14, 2);
        ctx.stroke();

        // Щели дульного тормоза
        ctx.strokeStyle = '#0d3d1f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(38, -6);
        ctx.lineTo(41, -4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(38, 6);
        ctx.lineTo(41, 4);
        ctx.stroke();

        // === ОСНОВАНИЕ БАШНИ (многоугольная форма) ===

        // Тень башни
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(1, 1, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Основная форма башни — скруглённый многоугольник
        const turretGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, 16);
        turretGrad.addColorStop(0, '#4ae08a');
        turretGrad.addColorStop(0.5, '#2ecc71');
        turretGrad.addColorStop(1, '#239954');
        ctx.fillStyle = turretGrad;
        ctx.beginPath();
        // Шестиугольная башня
        const turretRadius = 14;
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI * 2) / 6 - Math.PI / 6;
            const r = i % 2 === 0 ? turretRadius : turretRadius - 1;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();

        // Обводка башни
        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Верхний блик на башне
        ctx.save();
        ctx.globalAlpha = 0.3;
        const turretHighlight = ctx.createRadialGradient(-4, -4, 0, 0, 0, 14);
        turretHighlight.addColorStop(0, '#ffffff');
        turretHighlight.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        turretHighlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = turretHighlight;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Командирский люк (центральный круг)
        const hatchGrad = ctx.createRadialGradient(-1, -1, 0, 0, 0, 7);
        hatchGrad.addColorStop(0, '#27ae60');
        hatchGrad.addColorStop(1, '#1e8449');
        ctx.fillStyle = hatchGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#145a32';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Ручка люка
        ctx.strokeStyle =  '#5dbd85';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(3, 0);
        ctx.stroke();

        // Перископ командира
        ctx.fillStyle = '#145a32';
        this._roundRect(-2, -12, 4, 5, 1);
        ctx.fill();
        ctx.strokeStyle =  '#0d3d1f';
        ctx.lineWidth = 0.8;
        this._roundRect(-2, -12, 4, 5, 1);
        ctx.stroke();

        // Линза перископа
        ctx.fillStyle = '#a8e6cf';
        ctx.beginPath();
        ctx.arc(0, -10, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Дополнительные приборы наблюдения по бокам башни
        [-8, 8].forEach(sy => {
            ctx.fillStyle = '#1a7a40';
            this._roundRect(4, sy - 2, 5, 4, 1);
            ctx.fill();
            ctx.fillStyle = '#a8e6cf';
            ctx.beginPath();
            ctx.arc(6.5, sy, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Антенна на башне
        ctx.strokeStyle = '#5dbd85';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8, -5);
        ctx.lineTo(-14, -18);
        ctx.stroke();

        // Шарик на конце антенны
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(-14, -18, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // ==================== ЩИТ ====================
        if (this.shieldSkill.hasShield && this.shieldSkill.shieldAmount > 0 && !this.shieldSkill.shieldBroken) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const shieldPulse = Math.sin(Date.now() * 0.004) * 0.05 + 0.95;
            const shieldRadius = 48 * shieldPulse;

            const shieldGradient = ctx.createRadialGradient(0, 0, shieldRadius * 0.3, 0, 0, shieldRadius);
            shieldGradient.addColorStop(0, 'rgba(52, 152, 219, 0.05)');
            shieldGradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.15)');
            shieldGradient.addColorStop(0.8, 'rgba(52, 152, 219, 0.25)');
            shieldGradient.addColorStop(1, 'rgba(52, 152, 219, 0.08)');

            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            ctx.fill();

            // Внешнее свечение щита
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Внутреннее тонкое кольцо
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)' ;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius - 5, 0, Math.PI * 2);
            ctx.stroke();

            // Гексагональный узор на щите (улучшенный)
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.2)';
            ctx.lineWidth = 1;

            // Внешний гексагон
            const hexSize1 = shieldRadius * 0.7;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI * 2) / 6 + Date.now() * 0.0005;
                const px = Math.cos(a) * hexSize1;
                const py = Math.sin(a) * hexSize1;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Внутренний гексагон (вращается в другую сторону)
            const hexSize2 = shieldRadius * 0.4;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI * 2) / 6 - Date.now() * 0.0008;
                const px = Math.cos(a) * hexSize2;
                const py = Math.sin(a) * hexSize2;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Соединительные линии между гексагонами
            ctx.globalAlpha = 0.15;
            for (let i = 0; i < 6; i++) {
                const a1 = (i * Math.PI * 2) / 6 + Date.now() * 0.0005;
                const a2 = (i * Math.PI * 2) / 6 - Date.now() * 0.0008;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a1) * hexSize1, Math.sin(a1) * hexSize1);
                ctx.lineTo(Math.cos(a2) * hexSize2, Math.sin(a2) * hexSize2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // Бегущие энергетические точки по контуру щита
            for (let i = 0; i < 8; i++) {
                const dotAngle = Date.now() * 0.002 + (i * Math.PI * 2) / 8;
                const dx = Math.cos(dotAngle) * shieldRadius;
                const dy = Math.sin(dotAngle) * shieldRadius;

                const dotGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, 4);
                dotGrad.addColorStop(0, 'rgba(52, 152, 219, 0.8)');
                dotGrad.addColorStop(1, 'rgba(52, 152, 219, 0)');
                ctx.fillStyle = dotGrad;
                ctx.beginPath();
                ctx.arc(dx, dy, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // ==================== БРОНЯ ====================
        if (this.armor > 0 && this.armorTimer > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const pulseEffect = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
            const armorAlpha = this.armorTimer * pulseEffect;

            // Внешнее свечение брони
            ctx.save();
            ctx.globalAlpha = armorAlpha * 0.3;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Основная линия брони
            ctx.strokeStyle = `rgba(255, 215, 0, ${armorAlpha})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = Date.now() * 0.015;

            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Искры брони
            for (let i = 0; i < 4; i++) {
                const sparkAngle = Date.now() * 0.003 + (i * Math.PI / 2);
                const sparkDist = this.width / 2 + 5;
                const sx = Math.cos(sparkAngle) * sparkDist;
                const sy = Math.sin(sparkAngle) * sparkDist;

                ctx.save();
                ctx.globalAlpha = armorAlpha * (0.5 + Math.sin(Date.now() * 0.01 + i) * 0.5);
                const sparkGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5);
                sparkGrad.addColorStop(0, '#fff8dc');
                sparkGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = sparkGrad;
                ctx.beginPath();
                ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.restore();
        }

        // ==================== НАВЫКИ И ЭФФЕКТЫ ====================
        this.chainLightningSkill.draw();
        this.regenerationSkill.draw();
        this.teleportSkill.draw();
        this.blastSkill.draw();
        this.shieldSkill.draw(enemies);
        this.lifestealSkill.draw();
        this.doubleShootSkill.draw();
        this.drawRicochetEffects();

        // ==================== UI ТЕКСТ ====================
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffb020';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        ctx.textAlign = 'left';
        ctx.fillText(`⚡ Очки навыков: ${this.skillPoints}`, 25, typeof canvas !== 'undefined' ? canvas.height - 140 : 500);
        ctx.restore();

        // ==================== ПОЛОСКА ЗДОРОВЬЯ ====================
        this.drawHealthBar();

        const barY = this.y - this.height / 2 - 25;

        // Полоска щита
        if (this.shieldSkill.hasShield && (this.shieldSkill.shieldAmount > 0 || this.shieldSkill.shieldBroken)) {
            const shieldBarWidth = 55;
            const shieldBarHeight = 6;
            const shieldPercentage = this.shieldSkill.shieldAmount / this.shieldSkill.maxShield;

            // Фон полоски щита
            ctx.fillStyle = 'rgba(0, 100, 100, 0.5)';
            this._roundRect(this.x - shieldBarWidth / 2, barY, shieldBarWidth, shieldBarHeight, 2);
            ctx.fill();

            // Заполнение щита
            if (!this.shieldSkill.shieldBroken) {
                const shieldFillGrad = ctx.createLinearGradient(this.x - shieldBarWidth / 2, 0, this.x + shieldBarWidth / 2, 0);
                shieldFillGrad.addColorStop(0, '#00e5ff');
                shieldFillGrad.addColorStop(1, '#00bcd4');
                ctx.fillStyle = shieldFillGrad;
            } else {
                ctx.fillStyle = '#ff6666';
            }
            if (shieldPercentage > 0) {
                this._roundRect(this.x - shieldBarWidth / 2, barY, shieldBarWidth * shieldPercentage, shieldBarHeight, 2);
                ctx.fill();
            }

            // Обводка полоски щита
            ctx.strokeStyle = 'rgba(0, 200, 200, 0.6)';
            ctx.lineWidth = 1;
            this._roundRect(this.x - shieldBarWidth / 2, barY, shieldBarWidth, shieldBarHeight, 2);
            ctx.stroke();
        }

        // Надпись "🛡️"
        if (this.blockTimer > 0) {
            ctx.save();
            ctx.font = '20px Arial';
            ctx.fillStyle = 'red';
            ctx.globalAlpha = Math.min(1, this.blockTimer / 10);
            ctx.fillText('🛡️', this.x - 10, this.y - 40);
            ctx.restore();
            this.blockTimer--;
        }

        // ==================== ПУЛИ ====================
        this.bullets.forEach(bullet => bullet.draw());

        // ==================== ДРОНЫ ====================
        this.droneSkill.draw();
    }

    // Вспомогательный метод для скруглённых прямоугольников
    _roundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        return ctx;
    }

    checkBlock(blockProbability) {
        var randomNum = Math.random() * 100;
        if (randomNum < blockProbability) {
            return true;
        } else {
            return false;
        }
    }

    takeDamage(damage, bulletX, bulletY, bulletVX, bulletVY) {
        // ==================== ПРОВЕРКА РИКОШЕТА ====================
        
        // Вычисляем направление полёта снаряда
        let bulletFlightAngle;
        if (bulletVX !== undefined && bulletVY !== undefined) {
            bulletFlightAngle = Math.atan2(bulletVY, bulletVX);
        } else {
            bulletFlightAngle = Math.atan2(bulletY - this.y, bulletX - this.x);
        }
        
        // Вычисляем нормаль поверхности танка в точке попадания
        const hitAngle = Math.atan2(bulletY - this.y, bulletX - this.x);
        
        // Определяем к какой грани корпуса ближе всего точка попадания
        const relativeHitAngle = hitAngle - this.bodyAngle;
        const normalizedHitAngle = Math.atan2(Math.sin(relativeHitAngle), Math.cos(relativeHitAngle));
        
        // Определяем нормаль ближайшей грани
        let surfaceNormal;
        if (Math.abs(normalizedHitAngle) <= Math.PI / 4) {
            // Передняя грань
            surfaceNormal = this.bodyAngle;
        } else if (Math.abs(normalizedHitAngle) >= 3 * Math.PI / 4) {
            // Задняя грань
            surfaceNormal = this.bodyAngle + Math.PI;
        } else if (normalizedHitAngle > 0) {
            // Правая грань
            surfaceNormal = this.bodyAngle + Math.PI / 2;
        } else {
            // Левая грань
            surfaceNormal = this.bodyAngle - Math.PI / 2;
        }
        
        // Вычисляем угол между направлением снаряда и нормалью поверхности
        // Снаряд летит К танку, поэтому берём обратное направление полёта
        const incomingAngle = bulletFlightAngle + Math.PI;
        let impactAngle = incomingAngle - surfaceNormal;
        impactAngle = Math.atan2(Math.sin(impactAngle), Math.cos(impactAngle));
        
        // Угол от касательной (0° = скользящий удар, 90° = прямое попадание)
        const angleFromSurface = 90 - Math.abs(impactAngle * 180 / Math.PI);
        
        // Если угол от поверхности меньше порога — рикошет!
        if (angleFromSurface < this.ricochetAngle) {
            this.triggerRicochet(bulletX, bulletY, surfaceNormal, angleFromSurface);
            return; // Урон не проходит
        }
        
        // ==================== СУЩЕСТВУЮЩАЯ ЛОГИКА УРОНА ====================
        
        // Рассчитываем угол попадания снаряда
        const bulletAngle = Math.atan2(bulletY - this.y, bulletX - this.x);

        // Нормализуем углы в диапазон от -π до π
        let angleDiff = bulletAngle - this.bodyAngle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Проверяем, попал ли снаряд в переднюю часть танка
        const frontArcRange = Math.PI / 4;
        const isFrontalHit = Math.abs(angleDiff) <= frontArcRange;

        // Проверка на блок
        const blockProbability = this.armor + 25;
        if (this.checkBlock(blockProbability)) {
            this.blockTimer = 25;
            statManager.blockedByArmor += damage;
            return;
        }

        if (isFrontalHit) {
            damage = Math.floor(damage / 2);
        }

        // Сначала урон идёт по щиту
        if (this.shieldSkill.hasShield && this.shield > 0) {
            const shieldDamage = Math.min(this.shield, damage);
            this.shield -= shieldDamage;
            damage -= shieldDamage;

            if (this.shieldSkill) {
                this.shieldSkill.onShieldDamaged(shieldDamage);
            }

            if (this.shield <= 0) {
                this.shield = 0;
            }
        }

        this.health -= damage;
        statManager.takeDamages += damage;

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

    triggerRicochet(bulletX, bulletY, surfaceNormal, angle) {
    // Звуковой эффект рикошета (если есть)
    if (typeof soundManager !== 'undefined' && soundManager.playRicochet) {
        soundManager.playRicochet();
    }
    
    // Статистика рикошетов
    if (typeof statManager !== 'undefined') {
        if (!statManager.ricochets) statManager.ricochets = 0;
        statManager.ricochets++;
    }
    
    // Создаём визуальный эффект рикошета
    const sparkCount = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < sparkCount; i++) {
        const sparkAngle = surfaceNormal + (Math.random() - 0.5) * Math.PI * 0.6;
        const sparkSpeed = 80 + Math.random() * 150;
        this.ricochetEffects.push({
            x: bulletX,
            y: bulletY,
            vx: Math.cos(sparkAngle) * sparkSpeed,
            vy: Math.sin(sparkAngle) * sparkSpeed,
            life: 0.3 + Math.random() * 0.3,
            maxLife: 0.3 + Math.random() * 0.3,
            size: 1.5 + Math.random() * 2.5,
            type: 'spark',
            color: Math.random() > 0.5 ? '#ffdd44' : '#ffaa00'
        });
    }
    
    // Вспышка в точке рикошета
    this.ricochetEffects.push({
        x: bulletX,
        y: bulletY,
        vx: 0,
        vy: 0,
        life: 0.4,
        maxLife: 0.4,
        size: 20,
        type: 'flash'
    });
    
    // Индикатор текста "РИКОШЕТ"
    this.ricochetEffects.push({
        x: bulletX,
        y: bulletY - 15,
        vx: 0,
        vy: -40,
        life: 1.2,
        maxLife: 1.2,
        size: 14,
        type: 'text',
        text: `РИКОШЕТ! (${angle.toFixed(1)}°)`
    });
    
    // Кольцо ударной волны
    this.ricochetEffects.push({
        x: bulletX,
        y: bulletY,
        vx: 0,
        vy: 0,
        life: 0.5,
        maxLife: 0.5,
        size: 5,
        type: 'ring'
    });
    
    // Линия отскока (показывает направление рикошета)
    const reflectAngle = surfaceNormal + (surfaceNormal - (Math.atan2(bulletY - this.y, bulletX - this.x) + Math.PI));
    this.ricochetEffects.push({
        x: bulletX,
        y: bulletY,
        vx: Math.cos(reflectAngle) * 120,
        vy: Math.sin(reflectAngle) * 120,
        life: 0.3,
        maxLife: 0.3,
        size: 3,
        type: 'trail',
        startX: bulletX,
        startY: bulletY
    });
}

updateRicochetEffects(deltaTime) {
    this.ricochetEffects = this.ricochetEffects.filter(effect => {
        effect.life -= deltaTime;
        effect.x += effect.vx * deltaTime;
        effect.y += effect.vy * deltaTime;
        
        // Гравитация для искр
        if (effect.type === 'spark') {
            effect.vy += 200 * deltaTime;
        }
        
        return effect.life > 0;
    });
}

    drawRicochetEffects() {
        this.ricochetEffects.forEach(effect => {
            const alpha = Math.max(0, effect.life / effect.maxLife);
            
            ctx.save();
            
            switch (effect.type) {
                case 'spark': {
                    // Яркие искры
                    ctx.globalAlpha = alpha;
                    
                    // Свечение вокруг искры
                    const glowGrad = ctx.createRadialGradient(
                        effect.x, effect.y, 0,
                        effect.x, effect.y, effect.size * 3
                    );
                    glowGrad.addColorStop(0, effect.color);
                    glowGrad.addColorStop(1, 'rgba(255, 200, 0, 0)');
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.size * 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Ядро искры
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Хвост искры
                    ctx.strokeStyle = effect.color;
                    ctx.lineWidth = effect.size * 0.4;
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(effect.x, effect.y);
                    ctx.lineTo(
                        effect.x - effect.vx * 0.02,
                        effect.y - effect.vy * 0.02
                    );
                    ctx.stroke();
                    break;
                }
                
                case 'flash': {
                    // Яркая вспышка в точке удара
                    const flashSize = effect.size * (1 - alpha * 0.3);
                    ctx.globalAlpha = alpha * 0.8;
                    
                    const flashGrad = ctx.createRadialGradient(
                        effect.x, effect.y, 0,
                        effect.x, effect.y, flashSize
                    );
                    flashGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                    flashGrad.addColorStop(0.2, 'rgba(255, 255, 100, 0.8)');
                    flashGrad.addColorStop(0.5, 'rgba(255, 180, 0, 0.4)');
                    flashGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
                    ctx.fillStyle = flashGrad;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, flashSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Крестообразные лучи
                    ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.6})`;
                    ctx.lineWidth = 2;
                    const rayLen = flashSize * 1.5 * alpha;
                    for (let i = 0; i < 4; i++) {
                        const a = i * Math.PI / 2 + Math.PI / 4;
                        ctx.beginPath();
                        ctx.moveTo(effect.x, effect.y);
                        ctx.lineTo(
                            effect.x + Math.cos(a) * rayLen,
                            effect.y + Math.sin(a) * rayLen
                        );
                        ctx.stroke();
                    }
                    break;
                }
                
                case 'text': {
                    // Текстовый индикатор
                    ctx.globalAlpha = alpha;
                    ctx.font = `bold ${effect.size}px Arial`;
                    ctx.textAlign = 'center';
                    
                    // Тень текста
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillText(effect.text, effect.x + 1, effect.y + 1);
                    
                    // Основной текст с градиентом
                    const textGrad = ctx.createLinearGradient(
                        effect.x - 40, effect.y - 10,
                        effect.x + 40, effect.y + 10
                    );
                    textGrad.addColorStop(0, '#ffdd00');
                    textGrad.addColorStop(0.5, '#ffffff');
                    textGrad.addColorStop(1, '#ffdd00');
                    ctx.fillStyle = textGrad;
                    ctx.fillText(effect.text, effect.x, effect.y);
                    
                    // Обводка текста
                    ctx.strokeStyle = '#cc8800';
                    ctx.lineWidth = 0.5;
                    ctx.strokeText(effect.text, effect.x, effect.y);
                    break;
                }
                
                case 'ring': {
                    // Расширяющееся кольцо
                    const ringRadius = effect.size + (1 - alpha) * 35;
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.strokeStyle = '#ffcc00';
                    ctx.lineWidth = 2 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Второе внутреннее кольцо
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, ringRadius * 0.6, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                }
                
                case 'trail': {
                    // Линия отскока (показывает траекторию рикошета)
                    ctx.globalAlpha = alpha * 0.7;
                    
                    // Пунктирная линия направления отскока
                    ctx.strokeStyle = '#ffaa00';
                    ctx.lineWidth = 2 * alpha;
                    ctx.setLineDash([4, 3]);
                    ctx.beginPath();
                    ctx.moveTo(effect.startX, effect.startY);
                    ctx.lineTo(effect.x, effect.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Стрелка на конце
                    const trailAngle = Math.atan2(
                        effect.y - effect.startY,
                        effect.x - effect.startX
                    );
                    const arrowSize = 6 * alpha;
                    ctx.fillStyle = '#ffaa00';
                    ctx.beginPath();
                    ctx.moveTo(effect.x, effect.y);
                    ctx.lineTo(
                        effect.x - Math.cos(trailAngle - 0.4) * arrowSize,
                        effect.y - Math.sin(trailAngle - 0.4) * arrowSize
                    );
                    ctx.lineTo(
                        effect.x - Math.cos(trailAngle + 0.4) * arrowSize,
                        effect.y - Math.sin(trailAngle + 0.4) * arrowSize
                    );
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
            }
            
            ctx.restore();
        });
    }
    resetSkills() {
        player.skillPoints = 1;

        // телепорт
        player.teleportSkill.level = 0;
        player.teleportSkill.canTeleport = false;

        // взрыв
        player.blastSkill.level = 0;
        player.blastSkill.hasEnergyBlast = false;

        // быстрая регенерация
        player.regenerationSkill.level = 0;
        player.regenerationSkill.hasRegen = false;
        player.regenerationSkill.isActive = false;

        // цепная молния
        player.chainLightningSkill.level = 0;
        player.chainLightningSkill.hasChainLightning = false;

        // щит-заморозка
        player.shieldSkill.level = 0;
        player.shieldSkill.hasShield = false;
        player.shieldSkill.isActive = false;

        // вампиризм
        player.lifestealSkill.level = 0;
        player.lifestealSkill.hasLifesteal = false;
        player.lifestealSkill.isActive = false;
        player.lifeSteal = 0;

        // двойной выстрел
        player.doubleShootSkill.level = 0;
        player.doubleShootSkill.hasDoubleShoot = false;
        player.doubleShot = false;
        player.doubleShotChance = 0.25;

        // Дрон-камикадзе
        player.droneSkill.level = 0;
        player.droneSkill.hasDrone = false;
        player.droneSkill.drones = [];
    }
}