class Teleport {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Телепортация';
        this.description = 'Мгновенное перемещение в сторону курсора';

        this.level = 0;
        this.maxLevel = 5;
        this.canTeleport = false;

        // Runtime state
        this.lastTeleportTime = 0;
        this.isTeleporting = false;
        this.teleportAnimationTime = 0;
        this.teleportParticles = [];
        this.teleportTrail = [];
        this.teleportKeyPressed = false;

        // Stats
        this.cooldown = 10000;
        this.teleportDistance = 200;

        // UI
        this.indicatorX = 100;
        this.upgradeButton = new UpgradeSkillButton(this.indicatorX, 0);
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        // Характеристики зависят от уровня
        const distanceMap = [0, 200, 250, 300, 350, 400];
        this.teleportDistance = distanceMap[this.level] || 200;

        const cooldownMap = [0, 10000, 9000, 8000, 7000, 5000];
        this.cooldown = cooldownMap[this.level] || 10000;
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.level = 1;
                this.canTeleport = true;
                this.lastTeleportTime = 0; // Możno dat nebol'shuju zaderzhku ili dat srazu
            } else {
                this.level++;
                this.updateLevel();
                this.lastTeleportTime = 0;
            }

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    checkUpgradeClick(clickX, clickY) {
        if (typeof canvas === 'undefined') return false;
        // Кнопка находится на this.indicatorX, y = canvas.height - 110 (задается в draw)
        if (this.upgradeButton.checkClick(clickX, clickY, this.level, this.maxLevel, this.owner.skillPoints)) {
            this.upgrade();
            return true;
        }
        return false;
    }

    activate(mouseX, mouseY) {
        if (!this.canTeleport) return;
        const now = Date.now();
        if (now - this.lastTeleportTime < this.cooldown) return;

        // Сохраняем старую позицию
        const oldX = this.owner.x;
        const oldY = this.owner.y;

        // Мировые координаты мыши
        const worldMouseX = mouseX + camera.x;
        const worldMouseY = mouseY + camera.y;

        const dx = worldMouseX - this.owner.x;
        const dy = worldMouseY - this.owner.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) return;

        const teleportDist = Math.min(distance, this.teleportDistance);
        const dirX = dx / distance;
        const dirY = dy / distance;

        let newX = this.owner.x + dirX * teleportDist;
        let newY = this.owner.y + dirY * teleportDist;

        if (typeof WORLD_WIDTH !== 'undefined' && typeof WORLD_HEIGHT !== 'undefined') {
            newX = Math.max(this.owner.width / 2, Math.min(WORLD_WIDTH - this.owner.width / 2, newX));
            newY = Math.max(this.owner.height / 2, Math.min(WORLD_HEIGHT - this.owner.height / 2, newY));
        }

        this.createTeleportEffect(oldX, oldY, 'departure');

        this.owner.x = newX;
        this.owner.y = newY;

        this.createTeleportEffect(this.owner.x, this.owner.y, 'arrival');
        this.createTeleportTrail(oldX, oldY, this.owner.x, this.owner.y);

        this.lastTeleportTime = now;
        this.isTeleporting = true;
        this.teleportAnimationTime = 300;

        if (typeof soundManager !== 'undefined' && soundManager.playTeleport) {
            soundManager.playTeleport();
        }
    }

    update(deltaTime) {
        if (this.teleportAnimationTime > 0) {
            this.teleportAnimationTime -= deltaTime * 1000;
            if (this.teleportAnimationTime <= 0) {
                this.isTeleporting = false;
            }
        }

        this.teleportParticles = this.teleportParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.life -= deltaTime * 2;
            return particle.life > 0;
        });

        this.teleportTrail = this.teleportTrail.filter(trail => {
            trail.life -= deltaTime * 3;
            return trail.life > 0;
        });
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

    drawEffects() {
        // След телепортации
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

        // Частицы телепортации
        this.teleportParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, particle.life);
            ctx.fillStyle = particle.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    applyTeleportBlink(ctx) {
        if (this.isTeleporting) {
            ctx.globalAlpha = 0.5 + Math.sin(this.teleportAnimationTime * 0.05) * 0.5;
        }
    }

    draw() {
        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        if (typeof canvas !== 'undefined') {
            this.upgradeButton.y = canvas.height - 110;
            this.upgradeButton.draw(this.level, this.maxLevel, this.owner.skillPoints);
        }
    }

    drawCooldownIndicator() {
        const cooldownProgress = Math.min(1, (Date.now() - this.lastTeleportTime) / this.cooldown);
        const isReady = cooldownProgress >= 1;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const indicatorY = typeof canvas !== 'undefined' ? canvas.height - 60 : 560;
        ctx.translate(this.indicatorX, indicatorY);

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
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Прогресс перезарядки
        if (cooldownProgress < 1) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownProgress);
            ctx.stroke();

            // Текст таймера
            const remainingTime = Math.ceil((this.cooldown - (Date.now() - this.lastTeleportTime)) / 1000);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(remainingTime + 's', 0, 28);
        }

        // Клавиша активации [E] внутри индикатора
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[E]', 0, -25);

        ctx.restore();
    }
}
