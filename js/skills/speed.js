class SpeedSkill {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Ускорение';
        this.description = 'Временно увеличивает скорость движения и дает уклонение от снарядов';

        this.level = 0;
        this.maxLevel = 5;
        this.hasSpeed = false;

        // Runtime state
        this.isActive = false;
        this.endTime = 0;
        this.cooldownEndTime = 0;

        // Stats per level
        this.duration = [0, 3000, 4000, 5000, 6000, 7000]; // 3,4,5,6,7 секунд
        this.cooldown = [0, 20000, 18000, 16000, 14000, 12000]; // 20,18,16,14,12 секунд
        this.activeDodge = [0, 25, 30, 35, 40, 50]; // % уклонения при активации
        this.passiveDodge = [0, 5, 10, 15, 20, 25]; // % пассивного уклонения
        this.speedMultiplier = 2.0; // Движется в 2 раза быстрее

        // Current stats
        this.currentDuration = 0;
        this.currentCooldown = 0;
        this.currentActiveDodge = 0;
        this.currentPassiveDodge = 0;

        // Visual effects
        this.particles = [];
        this.trailEffects = [];

        // Инициализируем кнопку апгрейда
        this.indicatorX = 520; // Позиция справа от других способностей
        this.upgradeButton = new UpgradeSkillButton(this.indicatorX, 0);
    }

    updateLevel() {
        this.level = Math.min(this.maxLevel, Math.max(1, this.level));

        this.currentDuration = this.duration[this.level];
        this.currentCooldown = this.cooldown[this.level];
        this.currentActiveDodge = this.activeDodge[this.level];
        this.currentPassiveDodge = this.passiveDodge[this.level];
    }

    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < this.maxLevel) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.level = 1;
                this.hasSpeed = true;
                this.updateLevel();
                this.cooldownEndTime = 0;
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
        return this.hasSpeed && Date.now() >= this.cooldownEndTime;
    }

    activate() {
        if (this.canUse()) {
            this.isActive = true;
            this.endTime = Date.now() + this.currentDuration;
            this.cooldownEndTime = Date.now() + this.currentCooldown;
            
            // Применяем эффект ускорения
            this.owner.speed = this.owner.speed * this.speedMultiplier; // Обратный множитель для скорости
            
            // Создаем визуальные эффекты
            this.createActivationEffects();
            
            if (typeof soundManager !== 'undefined' && typeof soundManager.playSpeedBoost === 'function') {
                soundManager.playSpeedBoost();
            }
            
            return true;
        }
        return false;
    }

    deactivate() {
        this.isActive = false;
        // Восстанавливаем нормальную скорость
        this.owner.speed = this.owner.speed / this.speedMultiplier;
    }

    createActivationEffects() {
        // Создаем частицы активации
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 40 + 20;
            
            this.particles.push({
                x: this.owner.x + Math.cos(angle) * distance,
                y: this.owner.y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 100,
                vy: -Math.random() * 80 - 40,
                life: 0.5 + Math.random() * 0.5,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#00ffff' : '#0088ff'
            });
        }
    }

    addTrailParticle() {
        // Добавляем частицы следа при движении
        if (!this.isActive) return;
        
        const angle = this.owner.bodyAngle + Math.PI;
        const distance = this.owner.width / 2 + 5;
        
        this.trailEffects.push({
            x: this.owner.x + Math.cos(angle) * distance,
            y: this.owner.y + Math.sin(angle) * distance,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 0.3 + Math.random() * 0.3,
            size: Math.random() * 3 + 2,
            color: '#00ffff'
        });
    }

    update(deltaTime) {
        // Проверяем окончание действия способности
        if (this.isActive && Date.now() >= this.endTime) {
            this.deactivate();
        }
        
        // Добавляем частицы следа при движении во время активации
        if (this.isActive && (this.owner.isMoveForward || this.owner.isMoveBack)) {
            if (Math.random() < 0.5) {
                this.addTrailParticle();
            }
        }
        
        // Обновление частиц активации
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 50 * deltaTime; // Гравитация
            particle.life -= deltaTime;
            return particle.life > 0;
        });
        
        // Обновление частиц следа
        this.trailEffects = this.trailEffects.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime * 2;
            return particle.life > 0;
        });
    }

    getDodgeChance() {
        // Возвращает текущий шанс уклонения
        if (this.isActive) {
            return this.currentActiveDodge;
        }
        return this.currentPassiveDodge;
    }

    drawEffects() {
        // Рисуем частицы активации
        this.particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            
            const alpha = particle.life * 0.8;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            
            const size = particle.size * particle.life;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Рисуем частицы следа
        this.trailEffects.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            
            const alpha = particle.life * 0.6;
            ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
            
            const size = particle.size * particle.life;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Свечение вокруг танка при активации
        if (this.isActive) {
            ctx.save();
            ctx.translate(this.owner.x, this.owner.y);
            
            const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
            const glowRadius = 45 + pulse * 10;
            
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            glowGradient.addColorStop(0, `rgba(0, 200, 255, ${0.4 * pulse})`);
            glowGradient.addColorStop(0.5, `rgba(0, 150, 255, ${0.2 * pulse})`);
            glowGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Контурное свечение
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 * pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            
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
            const startTime = this.cooldownEndTime - this.currentCooldown;
            cooldownProgress = Math.min(1, (Date.now() - startTime) / this.currentCooldown);
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
        
        ctx.fillStyle = isReady ? '#2980b9' : '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        
       // Speed symbol (double chevrons / fast forward arrows)
        ctx.strokeStyle = isReady ? '#ffffff' : '#666';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // First chevron (left)
        ctx.beginPath();
        ctx.moveTo(-7, -7);
        ctx.lineTo(0, 0);
        ctx.lineTo(-7, 7);
        ctx.stroke();
        
        // Second chevron (right)
        ctx.beginPath();
        ctx.moveTo(1, -7);
        ctx.lineTo(8, 0);
        ctx.lineTo(1, 7);
        ctx.stroke();
        
        if (isReady) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(41, 128, 185, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Cooldown Progress
        if (cooldownProgress < 1) {
            ctx.strokeStyle = '#3498db';
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
        
        // Activation key [Z]
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = isReady ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText('[Z]', 0, -25);
        
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