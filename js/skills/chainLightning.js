class ChainLightning {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Цепная молния';
        this.description = 'Выпускает молнию, прыгающую между врагами';
        this.hasChainLightning = false;
        this.level = 0;

        // Runtime state
        this.lastUseTime = 0;
        this.lightningEffects = [];
        this.lightningBullets = [];

        // Цепная молния
        this.damage = 10;
        this.cooldown = 10000;
        this.lastTimeUse = 0;
        this.jumps = 4;
        this.bounceRange = 100;
        this.lightningEffects = [];

        this.upgradeSkillButton = new UpgradeSkillButton(220, 0);
    }

    canUpdate() {
        if (this.level === 5) return false;
        else return true;
    }

    /**
     * Updates the skill stats based on current level
     */
    updateLevel() {
        this.level++;
        this.level = Math.min(5, Math.max(1, this.level));

        // Calculate stats based on level
        this.damage = this.damage + (this.level * 10);
        this.bounceRange = this.bounceRange + (this.level * 25);

        // Jump progression: 2, 3, 3, 4, 5
        const jumpMap = [0, 2, 3, 3, 4, 5];
        this.jumps = jumpMap[this.level] || 2;

        const cooldownMap = [0, 12000, 10000, 8000, 6000, 4000];
        this.cooldown = cooldownMap[this.level] || 12000;
    }

    // активная молния
    activate(enemies, mouseX, mouseY) {
        if (!this.hasChainLightning) return false;
        if (Date.now() - this.lastUseTime < this.cooldown) return false;

        // Find enemy under cursor
        let targetEnemy = null;
        const clickRadius = 30;
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

        // If target found, execute chain lightning
        if (targetEnemy) {
            this.lastUseTime = Date.now();
            this.executeChainLightning(targetEnemy, enemies);
            this.playActivationEffects();
            return true;
        }

        return false;
    }

    executeChainLightning(firstTarget, enemies) {
        const hitTargets = new Set();
        let currentTarget = firstTarget;
        let previousX = this.owner.x;
        let previousY = this.owner.y;

        for (let i = 0; i < this.jumps && currentTarget; i++) {
            // Deal damage
            currentTarget.takeDamage(this.damage);
            if (!currentTarget.active) {
                enemyDead(currentTarget.x, currentTarget.y);
            }

            if (typeof statManager !== 'undefined') {
                statManager.damageByLightning += this.damage;
            }

            hitTargets.add(currentTarget);

            // Create visual effect
            this.createLightningEffect(previousX, previousY, currentTarget.x, currentTarget.y);

            // Find next target
            previousX = currentTarget.x;
            previousY = currentTarget.y;
            currentTarget = null;
            let nearestDist = this.bounceRange;

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

    playActivationEffects() {
        if (typeof soundManager !== 'undefined') {
            soundManager.playLightning();
        }

        // Create particles around owner
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const particleX = this.owner.x + Math.cos(angle) * 30;
                const particleY = this.owner.y + Math.sin(angle) * 30;

                particles.push(new Particle(particleX, particleY, '#ffff00', {
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    life: 500,
                    size: 3
                }));
            }
        }
    }

    updateVisualEffects(deltaTime) {
        // Update lightning effects
        this.lightningEffects = this.lightningEffects.filter(effect => {
            effect.life -= deltaTime * 4;
            effect.width = 3 * effect.life;
            return effect.life > 0;
        });

        // Update lightning bullets
        if (this.lightningBullets) {
            this.lightningBullets = this.lightningBullets.filter(bullet => {
                bullet.update(deltaTime);
                return bullet.active;
            });
        }
    }

    drawLightningEffects() {
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

            // Brightness layer
            ctx.strokeStyle = `rgba(255, 255, 255, ${effect.life * 0.5})`;
            ctx.lineWidth = effect.width * 0.5;
            ctx.stroke();

            ctx.restore();
        });
    }

    drawCooldownIndicator() {
        const cooldownProgress = Math.min(1, (Date.now() - this.lastUseTime) / this.cooldown);
        const isReady = cooldownProgress >= 1;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Position indicator (third in row)
        const indicatorX = 220;
        const indicatorY = canvas.height - 60;
        ctx.translate(indicatorX, indicatorY);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Main ability circle
        ctx.fillStyle = isReady ? '#4a9eff' : '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Lightning symbol
        ctx.strokeStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.shadowBlur = 10 + pulse * 5;
            ctx.shadowColor = '#4a9eff';
        }

        // Draw lightning bolt
        ctx.beginPath();
        ctx.moveTo(-5, -8);
        ctx.lineTo(3, -2);
        ctx.lineTo(-1, 2);
        ctx.lineTo(5, 8);
        ctx.stroke();

        // Ready effects
        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = 'rgba(74, 158, 255, ' + (0.3 + pulse * 0.3) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Cooldown progress
        if (cooldownProgress < 1) {
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.8;

            ctx.beginPath();
            ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cooldownProgress));
            ctx.stroke();

            // Remaining time
            const remainingTime = Math.ceil((this.cooldown - (Date.now() - this.lastUseTime)) / 1000);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1;
            ctx.fillText(remainingTime + 's', 0, 28);
        }

        // Activation key
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('[F]', 0, -25);

        ctx.restore();
    }

    // пассивная молния
    shootChainLightning(playerX, playerY) {
        if (!this.hasChainLightning) return;

        // Создаем молнию от позиции игрока
        const lightning = new LightningBullet(
            playerX,
            playerY,
            this.damage,
            'player',
            this.jumps,
            this.bounceRange
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
        this.createPassiveActivationParticles(playerX, playerY);
    }

    // Проверка наличия врагов в радиусе действия молнии
    checkEnemiesInRange(playerX, playerY) {
        if (!enemies || enemies.length === 0) return false;

        for (let enemy of enemies) {
            if (enemy.active) {
                const distance = Math.sqrt(Math.pow(enemy.x - playerX, 2) + Math.pow(enemy.y - playerY, 2));
                if (distance <= this.bounceRange) {
                    return true;
                }
            }
        }
        return false;
    }

    // Визуальный эффект при активации молнии
    createPassiveActivationParticles(playerX, playerY) {
        // Создаем частицы вокруг игрока
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particleX = playerX + Math.cos(angle) * 30;
            const particleY = playerY + Math.sin(angle) * 30;

            particles.push(new Particle(particleX, particleY, '#ffff00', {
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 500,
                size: 3
            }));
        }
    }

    updateChainLightning(playerX, playerY) {
        if (!this.hasChainLightning) return;

        const now = Date.now();

        // Проверяем, прошло ли время перезарядки
        if (!this.lastLightningTime || now - this.lastLightningTime >= this.cooldown) {
            // Проверяем, есть ли враги в радиусе
            if (this.checkEnemiesInRange(playerX, playerY)) {
                this.shootChainLightning(playerX, playerY);
                this.lastLightningTime = now;
            }
        }
    }

    draw() {
        this.drawLightningEffects();//активная
        // Draw lightning bullets
        if (this.lightningBullets) {
            this.lightningBullets.forEach(bullet => bullet.draw());
        }

        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        if (typeof canvas !== 'undefined') {
            this.upgradeSkillButton.y = canvas.height - 110;
            this.upgradeSkillButton.draw(this.level, 5, this.owner.skillPoints);
        }
    }

    checkUpgradeClick(clickX, clickY) {
        if (this.upgradeSkillButton.checkClick(clickX, clickY, this.level, 5, this.owner.skillPoints)) {
            this.upgrade();
            return true;
        }
        return false;
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < 5) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.hasChainLightning = true;
                this.level = 1;
                // Базовые статы
                this.damage = 40;
                this.jumps = 2;
                this.bounceRange = 200;
                this.cooldown = 5000;
                this.lastUseTime = 0;
                this.lastLightningTime = 0;
            } else {
                this.updateLevel();
                this.lastUseTime = 0;
                this.lastLightningTime = 0;
            }

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    canUse() {
        return this.hasChainLightning && Date.now() - this.lastUseTime >= this.cooldown;
    }

    getCooldownRemaining() {
        return Math.max(0, this.cooldown - (Date.now() - this.lastUseTime));
    }
}