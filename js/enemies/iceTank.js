// Класс для ледяного вражеского танка
class IceTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speed = 100;
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 15; // Уменьшен урон, так как есть эффект замедления
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 2000;
        this.active = true;
        this.iceParticles = []; // Частицы льда для визуального эффекта
    }
    
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        // Простой AI - движение к игроку
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 150) {
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        }
        
        // Стрельба ледяными снарядами
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown && distance < 300) {
            this.bullets.push(new IceBullet(
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25,
                this.damage,
                this.angle,
                'enemy'
            ));
            this.lastShot = now;
        }
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
        
        // Обновление частиц льда
        this.updateIceParticles(deltaTime);
    }
    
    updateIceParticles(deltaTime) {
        // Добавляем новые частицы
        if (Math.random() < 0.3) {
            this.iceParticles.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                life: 1,
                size: Math.random() * 3 + 1
            });
        }
        
        // Обновляем существующие частицы
        this.iceParticles = this.iceParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime * 2;
            return particle.life > 0;
        });
    }
    
    draw() {
        // Рисуем частицы льда
        this.iceParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = '#E0F7FA';
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            ctx.restore();
        });
        
        // Корпус
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Ледяной корпус с градиентом
        const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        gradient.addColorStop(0, '#B3E5FC');
        gradient.addColorStop(0.5, '#81D4FA');
        gradient.addColorStop(1, '#4FC3F7');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Ледяные кристаллы на корпусе
        ctx.strokeStyle = '#E1F5FE';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + 5, 0);
        ctx.lineTo(-this.width/2 + 10, -5);
        ctx.lineTo(-this.width/2 + 15, 0);
        ctx.lineTo(-this.width/2 + 10, 5);
        ctx.closePath();
        ctx.stroke();
        
        // Башня (ледяная сфера)
        const turretGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
        turretGradient.addColorStop(0, '#E3F2FD');
        turretGradient.addColorStop(0.7, '#64B5F6');
        turretGradient.addColorStop(1, '#2196F3');
        
        ctx.fillStyle = turretGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Блик на башне
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-4, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Ледяное дуло
        const barrelGradient = ctx.createLinearGradient(12, -2, 32, 2);
        barrelGradient.addColorStop(0, '#90CAF9');
        barrelGradient.addColorStop(1, '#42A5F5');
        
        ctx.fillStyle = barrelGradient;
        ctx.fillRect(12, -2, 20, 4);
        
        // Ледяные шипы на дуле
        ctx.fillStyle = '#B3E5FC';
        ctx.beginPath();
        ctx.moveTo(32, 0);
        ctx.lineTo(35, -2);
        ctx.lineTo(35, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Полоска здоровья с ледяной темой
        const healthBarWidth = 40;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.maxHealth;
        
        // Фон полоски здоровья
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth, healthBarHeight);
        
        // Здоровье
        ctx.fillStyle = '#64B5F6';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Рамка
        ctx.strokeStyle = '#E3F2FD';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth, healthBarHeight);
        
        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
    }
    
    takeDamage(damage) {
        if (this.health - damage <= 0) {
            this.active = false;
        }
        else {
            this.health -= damage;
        }

        if(isNaN(this.health)) {
            this.active = false;
        }
    }
}