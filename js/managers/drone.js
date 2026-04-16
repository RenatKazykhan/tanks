class DroneSkill {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Дрон-камикадзе';
        this.description = 'Пассивно запускает дронов, активно создаёт волну дронов';
        this.hasDrone = false;
        this.level = 0;
        this.maxLevel = 5;

        // Пассивный — автоматический запуск дрона
        this.passiveCooldown = 4000; // мс между пассивными дронами
        this.lastPassiveTime = 0;
        this.droneDamage = 50;
        this.droneExplosionRadius = 60;
        this.drones = [];

        // Активная способность — залп дронов
        this.burstCount = 3;
        this.cooldown = 15000;
        this.lastUseTime = 0;

        this.indicatorX = 460;
        this.upgradeButton = new UpgradeSkillButton(this.indicatorX, 0);
    }

    canUpdate() {
        return this.level < this.maxLevel;
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        // Урон дрона: 50, 65, 80, 100, 130
        const dmgMap = [0, 50, 65, 80, 100, 130];
        this.droneDamage = dmgMap[this.level] || 50;

        // Радиус взрыва: 60, 70, 80, 90, 110
        const radiusMap = [0, 60, 70, 80, 90, 110];
        this.droneExplosionRadius = radiusMap[this.level] || 60;

        // Пассивный кулдаун: 4, 3.5, 3, 2.5, 2 секунды
        const passiveCdMap = [0, 20000, 17500, 15000, 12500, 10000];
        this.passiveCooldown = passiveCdMap[this.level] || 4000;

        // Количество дронов при активации: 3, 4, 5, 6, 8
        const burstMap = [0, 1, 2, 3, 4, 5];
        this.burstCount = burstMap[this.level] || 3;

        // Активный кулдаун: 15, 14, 13, 11, 9 секунд
        const cdMap = [0, 15000, 14000, 13000, 11000, 9000];
        this.cooldown = cdMap[this.level] || 15000;
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.level = 1;
                this.hasDrone = true;
                this.droneDamage = 50;
                this.droneExplosionRadius = 60;
                this.passiveCooldown = 4000;
                this.burstCount = 3;
                this.cooldown = 15000;
                this.lastUseTime = 0;
                this.lastPassiveTime = Date.now();
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

    // Пассивное создание дронов
    updatePassive(enemies, deltaTime) {
        if (!this.hasDrone) return;

        const now = Date.now();
        if (now - this.lastPassiveTime >= this.passiveCooldown) {
            // Проверяем есть ли враги
            let hasTarget = false;
            if (typeof enemies !== 'undefined' && enemies.length > 0) {
                for (let e of enemies) {
                    if (e.active) { hasTarget = true; break; }
                }
            }

            if (hasTarget) {
                this.spawnDrone();
                this.lastPassiveTime = now;
            }
        }
    }

    spawnDrone() {
        const drone = new KamikazeDrone(
            this.owner.x,
            this.owner.y,
            this.droneDamage,
            'player'
        );
        drone.explosionRadius = this.droneExplosionRadius;
        this.drones.push(drone);
    }

    // Активная способность — залп дронов
    activate() {
        if (!this.hasDrone) return false;
        if (Date.now() - this.lastUseTime < this.cooldown) return false;

        this.lastUseTime = Date.now();

        for (let i = 0; i < this.burstCount; i++) {
            // Создаём дроны с небольшим разбросом
            const angle = (Math.PI * 2 / this.burstCount) * i;
            const offsetX = Math.cos(angle) * 20;
            const offsetY = Math.sin(angle) * 20;

            const drone = new KamikazeDrone(
                this.owner.x + offsetX,
                this.owner.y + offsetY,
                this.droneDamage,
                'player'
            );
            drone.explosionRadius = this.droneExplosionRadius;
            this.drones.push(drone);
        }

        this.playActivationSound();
        this.createActivationEffect();

        return true;
    }

    createActivationEffect() {
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 / 10) * i;
                const px = this.owner.x + Math.cos(angle) * 25;
                const py = this.owner.y + Math.sin(angle) * 25;

                particles.push(new Particle(px, py, '#ffaa00', {
                    vx: Math.cos(angle) * 60,
                    vy: Math.sin(angle) * 60,
                    life: 500,
                    size: 4
                }));
            }
        }
    }

    playActivationSound() {
        if (typeof soundManager !== 'undefined' && typeof soundManager.playShoot === 'function') {
            soundManager.playShoot();
        }
    }

    update(enemies, deltaTime) {
        // Пассивный спавн
        this.updatePassive(enemies, deltaTime);

        // Обновляем все дроны
        this.drones = this.drones.filter(drone => {
            drone.update(enemies, this.owner, deltaTime);
            return drone.active;
        });
    }

    canUse() {
        return this.hasDrone && Date.now() - this.lastUseTime >= this.cooldown;
    }

    getCooldownRemaining() {
        return Math.max(0, this.cooldown - (Date.now() - this.lastUseTime));
    }

    // ======================== ОТРИСОВКА ========================

    draw() {
        // Рисуем дронов в мировых координатах
        this.drones.forEach(drone => drone.draw());

        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
        }

        if (typeof canvas !== 'undefined') {
            this.upgradeButton.y = canvas.height - 110;
            this.upgradeButton.draw(this.level, this.maxLevel, this.owner.skillPoints);
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
        ctx.fillStyle = isReady ? '#ff8c00' : '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Drone symbol
        ctx.fillStyle = isReady ? '#ffffff' : '#666';

        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.shadowBlur = 10 + pulse * 5;
            ctx.shadowColor = '#ff8c00';
        }

        // Рисуем дрон (упрощённый)
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Пропеллеры
        ctx.strokeStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -3);
        ctx.lineTo(-3, -3);
        ctx.moveTo(3, -3);
        ctx.lineTo(8, -3);
        ctx.moveTo(-8, 3);
        ctx.lineTo(-3, 3);
        ctx.moveTo(3, 3);
        ctx.lineTo(8, 3);
        ctx.stroke();

        // Взрыв
        ctx.strokeStyle = isReady ? '#ffcc00' : '#555';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(2, -6);
        ctx.lineTo(-1, -7);
        ctx.moveTo(0, 9);
        ctx.lineTo(-2, 6);
        ctx.lineTo(1, 7);
        ctx.stroke();

        // Ready pulse
        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(255, 140, 0, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Cooldown Progress
        if (cooldownProgress < 1) {
            ctx.strokeStyle = '#ff8c00';
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

        // Key label [X]
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[X]', 0, -25);

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
