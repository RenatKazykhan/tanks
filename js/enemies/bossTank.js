// Класс для танка-босса
class BossTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.speed = 90;
        this.health = 3000;
        this.maxHealth = 3000;
        this.damage = 100;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 500;
        this.active = true;
        
        // Состояние босса
        this.phase = 1; // Фазы боя: 1, 2, 3
        this.lastPhaseChange = 0;
        this.phaseChangeCooldown = 5000;
        
        // Способности
        this.abilities = {
            tripleShot: { cooldown: 4000, lastUsed: 0 },
            circleShot: { cooldown: 8000, lastUsed: 0 },
            charge: { cooldown: 10000, lastUsed: 0, active: false, duration: 2000, startTime: 0 },
            shield: { cooldown: 15000, lastUsed: 0, active: false, duration: 3000, startTime: 0 }
        };
        
        // AI состояние
        this.aiState = 'hunting'; // hunting, circling, charging, retreating
        this.stateChangeTime = 0;
        this.targetX = x;
        this.targetY = y;
        this.circleRadius = 200;
        this.circleAngle = 0;
        
        // Эффекты
        this.stunned = false;
        this.stunnedUntil = 0;
        
        // Визуальные эффекты
        this.chargeParticles = [];
        this.shieldEffect = 0;
    }
    
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        if (!this.active || this.stunned) {
            if (this.stunned && Date.now() > this.stunnedUntil) {
                this.stunned = false;
            }
            return;
        }
        
        const now = Date.now();
        
        // Проверка смены фазы
        this.checkPhaseChange();
        
        // Обновление ИИ
        this.updateAI(playerX, playerY, now);
        
        // Использование способностей
        this.useAbilities(playerX, playerY, now, deltaTime);
        
        // Движение
        this.move(deltaTime);
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
        
        // Обновление частиц
        this.updateParticles(deltaTime);
    }

    move(deltaTime) {
        if (this.abilities.charge.active) {
            // Быстрое движение во время атаки
            const chargeSpeed = this.speed * 4;
            this.x += Math.cos(this.angle) * chargeSpeed * deltaTime;
            this.y += Math.sin(this.angle) * chargeSpeed * deltaTime;
        } else {
            // Обычное движение к цели
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                this.x += (dx / distance) * this.speed * deltaTime;
                this.y += (dy / distance) * this.speed * deltaTime;
            }
        }
    }
    
    checkPhaseChange() {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent <= 0.3 && this.phase !== 3) {
            this.phase = 3;
            this.speed = 50;
            this.shotCooldown = 1000;
            this.abilities.shield.cooldown = 8000;
        } else if (healthPercent <= 0.6 && this.phase !== 2) {
            this.phase = 2;
            this.speed = 80;
            this.shotCooldown = 1200;
            this.abilities.tripleShot.cooldown = 3000;
        }
    }
    
    updateAI(playerX, playerY, now) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Смена состояния ИИ
        if (now - this.stateChangeTime > 3000) {
            const rand = Math.random();
            if (distance < 300) {
                this.aiState = 'retreating';
            } else if (distance > 700) {
                this.aiState = 'hunting';
            } else if (rand < 0.8) {
                this.aiState = 'circling';
                this.circleAngle = Math.atan2(dy, dx) + Math.PI / 2;
            } else {
                this.aiState = 'hunting';
            }
            this.stateChangeTime = now;
        }
        
        // Выполнение действий ИИ`
        switch (this.aiState) {
            case 'hunting':
                this.targetX = playerX;
                this.targetY = playerY;
                this.angle = Math.atan2(dy, dx);
                break;
                
            case 'circling':
                this.circleAngle += 0.02 * deltaTime * 60; // Нормализация для 60 FPS
                this.targetX = playerX + Math.cos(this.circleAngle) * this.circleRadius;
                this.targetY = playerY + Math.sin(this.circleAngle) * this.circleRadius;
                this.angle = Math.atan2(dy, dx);
                break;
                
            case 'retreating':
                this.targetX = this.x - dx * 0.5;
                this.targetY = this.y - dy * 0.5;
                this.angle = Math.atan2(dy, dx);
                break;
                
            case 'charging':
                this.targetX = playerX;
                this.targetY = playerY;
                this.angle = Math.atan2(dy, dx);
                break;
        }
    }
    
    useAbilities(playerX, playerY, now, deltaTime) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Обычная стрельба
        if (now - this.lastShot > this.shotCooldown && distance < 400) {
            this.shoot(this.angle);
            this.lastShot = now;
        }
        
        // Тройной выстрел
        if (this.phase >= 2 && now - this.abilities.tripleShot.lastUse > this.abilities.tripleShot.cooldown) {
            this.tripleShot();
            this.abilities.tripleShot.lastUse = now;
        }
        
        // Щит
        if (this.phase >= 3 && now - this.abilities.shield.lastUse > this.abilities.shield.cooldown && this.health < this.maxHealth * 0.3) {
            this.activateShield();
            this.abilities.shield.lastUse = now;
        }
        
        // Обновление щита
        if (this.abilities.shield.active && now - this.abilities.shield.lastUse > this.abilities.shield.duration) {
            this.abilities.shield.active = false;
        }
        
        // Атака рывком
        if (distance < 200 && now - this.abilities.charge.lastUse > this.abilities.charge.cooldown) {
            this.chargeAttack();
            this.abilities.charge.lastUse = now;
        }
        
        // Обновление атаки рывком
        if (this.abilities.charge.active && now - this.abilities.charge.lastUse > this.abilities.charge.duration) {
            this.abilities.charge.active = false;
            this.aiState = 'hunting';
        }
    }
    
    updateAbilities(now) {
        // Обновление атаки рывком
        if (this.abilities.charge.active) {
            if (now - this.abilities.charge.startTime > this.abilities.charge.duration) {
                this.abilities.charge.active = false;
                this.aiState = 'retreating';
                this.stateChangeTime = now;
            }
            // Добавление частиц
            this.addChargeParticles();
        }
        
        // Обновление щита
        if (this.abilities.shield.active) {
            if (now - this.abilities.shield.startTime > this.abilities.shield.duration) {
                this.abilities.shield.active = false;
            }
            this.shieldEffect = Math.sin(now * 0.01) * 0.5 + 0.5;
        }
    }
    
    shoot(angle) {
        const bulletX = this.x + Math.cos(angle) * (this.width/2 + 10);
        const bulletY = this.y + Math.sin(angle) * (this.width/2 + 10);
        
        this.bullets.push(new Bullet2(bulletX, bulletY, this.damage, angle, 'enemy'));
    }
    
    tripleShot() {
        const spread = Math.PI / 6; // 30 градусов
        this.shoot(this.angle - spread);
        this.shoot(this.angle);
        this.shoot(this.angle + spread);
    }
    
    circleShot() {
        const bulletCount = 12;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 / bulletCount) * i;
            this.shoot(angle);
        }
    }
    
    startCharge(now) {
        this.abilities.charge.active = true;
        this.abilities.charge.startTime = now;
        this.aiState = 'charging';
        this.stateChangeTime = now;
    }
    
    activateShield(now) {
        this.abilities.shield.active = true;
        this.abilities.shield.startTime = now;
    }
    
    addChargeParticles() {
        for (let i = 0; i < 3; i++) {
            this.chargeParticles.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.05
            });
        }
    }
    
    updateParticles(deltaTime) {
        this.chargeParticles = this.chargeParticles.filter(particle => {
            particle.x += particle.vx * deltaTime * 60;
            particle.y += particle.vy * deltaTime * 60;
            particle.life -= particle.decay * deltaTime * 60;
            return particle.life > 0;
        });
    }
    
    draw() {
        // Частицы атаки
        this.drawChargeParticles();
        
        // Корпус
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Основной корпус
        const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        gradient.addColorStop(0, '#8b0000');
        gradient.addColorStop(1, '#dc143c');
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Декоративные элементы
        ctx.fillStyle = '#660000';
        ctx.fillRect(-this.width/2 + 10, -this.height/2 + 10, this.width - 20, 8);
        ctx.fillRect(-this.width/2 + 10, this.height/2 - 18, this.width - 20, 8);
        
        // Башня
        ctx.fillStyle = '#a00000';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Детали башни
        ctx.fillStyle = '#660000';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Дуло
        ctx.fillStyle = '#330000';
        ctx.fillRect(20, -4, 30, 8);
        
        // Дополнительные дула для фазы 2+
        if (this.phase >= 2) {
            ctx.fillRect(18, -8, 25, 4);
            ctx.fillRect(18, 4, 25, 4);
        }
        
        ctx.restore();
        
        // Эффект щита
        if (this.abilities.shield.active) {
            ctx.save();
            ctx.globalAlpha = 0.3 + this.shieldEffect * 0.4;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2 + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Полоска здоровья (больше для босса)
        const healthBarWidth = 80;
        const healthBarHeight = 8;
        const healthPercentage = this.health / this.maxHealth;
        
        // Фон полоски здоровья
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - healthBarWidth/2 - 2, this.y - this.height/2 - 20, healthBarWidth + 4, healthBarHeight + 4);
        
        // Красная полоска (урон)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 18, healthBarWidth, healthBarHeight);
        
        // Цветная полоска здоровья
        let healthColor = '#00ff00';
        if (healthPercentage < 0.3) healthColor = '#ff4444';
        else if (healthPercentage < 0.6) healthColor = '#ffaa00';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 18, healthBarWidth * healthPercentage, healthBarHeight);
        
        // надпись
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`BOSS`, this.x, this.y - this.height/2 - 30);
        
        // Рисуем пули
        this.bullets.forEach(bullet => bullet.draw());
    }
    
    drawChargeParticles() {
        this.chargeParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    takeDamage(damage) {
        // Уменьшенный урон во время щита
        if (this.abilities.shield.active) {
            damage *= 0.3;
        }
        
        this.health -= damage;
        
        // Эффект попадания
        this.hitEffect = 10;
        
        if (this.health <= 0) {
            this.active = false;
            
            // Эффект взрыва
            this.createDeathExplosion();
        }
    }
    
    createDeathExplosion() {
        // Создаем частицы взрыва
        for (let i = 0; i < 20; i++) {
            this.chargeParticles.push({
                x: this.x + (Math.random() - 0.5) * this.width * 2,
                y: this.y + (Math.random() - 0.5) * this.height * 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 2.0,
                decay: 0.02
            });
        }
    }
    
    // Проверка столкновения с игроком (для атаки рывком)
    checkPlayerCollision(playerX, playerY, playerSize) {
        if (!this.abilities.charge.active) return false;
        
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.width/2 + playerSize/2);
    }
    
    // Оглушение босса (например, от особых атак игрока)
    stun(duration = 2000) {
        this.stunned = true;
        this.stunnedUntil = Date.now() + duration;
        
        // Сброс активных способностей
        this.abilities.charge.active = false;
    }
    
    // Получение информации о текущем состоянии босса
    getStatus() {
        return {
            phase: this.phase,
            health: this.health,
            maxHealth: this.maxHealth,
            healthPercent: this.health / this.maxHealth,
            aiState: this.aiState,
            shieldActive: this.abilities.shield.active,
            charging: this.abilities.charge.active,
            stunned: this.stunned
        };
    }
}