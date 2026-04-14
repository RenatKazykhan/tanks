// Класс для вражеского танка
class SmokeTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.speed = 50;
        this.health = 60;
        this.maxHealth = 60;
        this.damage = 10;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 2000;
        this.active = true;
        
        // Дымовая завеса
        this.smokeScreenActive = false;
        this.smokeScreenDuration = 3000;
        this.smokeScreenCooldown = 8000;
        this.lastSmokeScreen = 0;
        this.smokeScreenRadius = 80;
        this.smokeParticles = [];
    }
    
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Активация дымовой завесы при приближении игрока
        const now = Date.now();
        if (distance < 200 && !this.smokeScreenActive && 
            now - this.lastSmokeScreen > this.smokeScreenCooldown) {
            this.activateSmokeScreen();
        }
        
        // Движение (ускоряется в дымовой завесе)
        const currentSpeed = this.smokeScreenActive ? this.speed * 1.5 : this.speed;
        
        if (distance > 150) {
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * currentSpeed * deltaTime;
            this.y += Math.sin(this.angle) * currentSpeed * deltaTime;
        } else if (this.smokeScreenActive) {
            // Маневрирование в дыму
            this.angle += (Math.random() - 0.5) * 2 * deltaTime;
            this.x += Math.cos(this.angle) * currentSpeed * 0.5 * deltaTime;
            this.y += Math.sin(this.angle) * currentSpeed * 0.5 * deltaTime;
        }
        
        // Стрельба (чаще стреляет из дымовой завесы)
        const currentCooldown = this.smokeScreenActive ? this.shotCooldown * 0.6 : this.shotCooldown;
        if (now - this.lastShot > currentCooldown && distance < 300) {
            this.bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 30,
                this.y + Math.sin(this.angle) * 30,
                this.damage,
                this.angle,
                'enemy'
            ));
            this.lastShot = now;
        }
        
        // Обновление дымовой завесы
        this.updateSmokeScreen(deltaTime);
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }
    
    activateSmokeScreen() {
        this.smokeScreenActive = true;
        this.lastSmokeScreen = Date.now();
        
        // Создание частиц дыма
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = 30 + Math.random() * 20;
            this.smokeParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 20 + Math.random() * 15,
                alpha: 0.7,
                life: 1
            });
        }
        
        setTimeout(() => {
            this.smokeScreenActive = false;
        }, this.smokeScreenDuration);
    }
    
    updateSmokeScreen(deltaTime) {
        this.smokeParticles = this.smokeParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life -= deltaTime * 0.3;
            particle.alpha = particle.life * 0.7;
            particle.size += deltaTime * 10;
            
            return particle.life > 0;
        });
    }
    
    draw() {
    // Рисуем дым
    this.smokeParticles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Определяем видимость танка
    let tankVisibility = 1;
    if (this.smokeScreenActive) {
        // Танк становится невидимым в дыму
        tankVisibility = 0;
    }
    
    // Рисуем танк только если он видим
    if (tankVisibility > 0) {
        ctx.save();
        ctx.globalAlpha = tankVisibility;
        
        // Корпус танка (более детализированный)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Гусеницы
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-this.width/2 - 3, -this.height/2 - 2, this.width + 6, 8);
        ctx.fillRect(-this.width/2 - 3, this.height/2 - 6, this.width + 6, 8);
        
        // Основной корпус
        ctx.fillStyle = '#dc143c';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Детали корпуса
        ctx.fillStyle = '#b22222';
        ctx.fillRect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, this.height - 10);
        
        // Башня
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Люк
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(-5, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Дуло
        ctx.fillStyle = '#2f4f4f';
        ctx.fillRect(15, -3, 25, 6);
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(35, -2, 8, 4);
        
        ctx.restore();
        ctx.restore();
    }
    
    // Индикатор дымовой завесы (полупрозрачный круг)
    if (this.smokeScreenActive) {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.smokeScreenRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Полоска здоровья показывается всегда, но полупрозрачная в дыму
    ctx.save();
    ctx.globalAlpha = this.smokeScreenActive ? 0.3 : 1;
    
    const healthBarWidth = 45;
    const healthBarHeight = 6;
    const healthPercentage = this.health / this.maxHealth;
    
    // Фон полоски
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x - healthBarWidth/2 - 1, this.y - this.height/2 - 18, healthBarWidth + 2, healthBarHeight + 2);
    
    // Здоровье
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 17, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 17, healthBarWidth * healthPercentage, healthBarHeight);
    
    // Индикатор перезарядки дымовой завесы
    const smokeCooldownProgress = Math.min(1, (Date.now() - this.lastSmokeScreen) / this.smokeScreenCooldown);
    if (smokeCooldownProgress < 1 && !this.smokeScreenActive) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 25, healthBarWidth * smokeCooldownProgress, 3);
    }
    
    ctx.restore();
    
    // Рисуем пули (они видны всегда)
    //this.bullets.forEach(bullet => bullet.draw());
}
    
    takeDamage(damage) {
        // Уменьшенный урон в дымовой завесе
        const actualDamage = this.smokeScreenActive ? damage * 0.5 : damage;
        
        if (this.health - actualDamage <= 0) {
            this.active = false;
        }
        
        this.health -= actualDamage;

        if(isNaN(this.health)) {
            this.active = false;
        }
    }
    
    // Проверка, находится ли точка в дымовой завесе
    isInSmokeScreen(x, y) {
        if (!this.smokeScreenActive) return false;
        
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.smokeScreenRadius;
    }
}