// Класс для вражеского танка с энергетическим щитом
class ShieldTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 50;
        this.health = 75;
        this.maxHealth = 75;
        this.damage = 35;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 2000;
        this.active = true;
        
        // Фишка: энергетический щит
        this.shield = 50;
        this.maxShield = 50;
        this.shieldRegenRate = 10; // восстановление в секунду
        this.shieldBroken = false;
        this.shieldRegenDelay = 3000; // задержка перед регенерацией после поломки
        this.lastShieldBreak = 0;
        
        // Анимация
        this.trackOffset = 0;
        this.turretRecoil = 0;
        this.shieldPulse = 0;
    }
    
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        // Обновление анимаций
        this.trackOffset += this.speed * deltaTime * 10;
        this.turretRecoil = Math.max(0, this.turretRecoil - deltaTime * 10);
        this.shieldPulse += deltaTime * 3;
        
        // Регенерация щита
        if (this.shield < this.maxShield && !this.shieldBroken) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * deltaTime);
        } else if (this.shieldBroken && Date.now() - this.lastShieldBreak > this.shieldRegenDelay) {
            this.shieldBroken = false;
        }
        
        // Простой AI - движение к игроку
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 150) {
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        }
        
        // Стрельба
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown && distance < 300) {
            this.bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 30,
                this.y + Math.sin(this.angle) * 30,
                this.damage,
                this.angle,
                'enemy'
            ));
            this.lastShot = now;
            this.turretRecoil = 5; // отдача при выстреле
        }
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Энергетический щит (если активен)
        if (this.shield > 0 && !this.shieldBroken) {
            ctx.save();
            const shieldOpacity = 0.3 + Math.sin(this.shieldPulse) * 0.1;
            ctx.globalAlpha = shieldOpacity * (this.shield / this.maxShield);
            
            // Внешний контур щита
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.stroke();
            
            // Внутреннее свечение
            const gradient = ctx.createRadialGradient(0, 0, 20, 0, 0, 35);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0.5)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.rotate(this.angle);
        
        // Гусеницы (по бокам)
        ctx.fillStyle = '#2c3e50';
        // Левая гусеница
        ctx.fillRect(-this.width/2, -this.height/2 - 5, this.width, 5);
        // Правая гусеница
        ctx.fillRect(-this.width/2, this.height/2, this.width, 5);
        
        // Детали гусениц
        ctx.fillStyle = '#1a252f';
        for (let i = 0; i < 4; i++) {
            const x = -this.width/2 + (i * 10) + (this.trackOffset % 10);
            // Детали левой гусеницы
            ctx.fillRect(x, -this.height/2 - 5, 3, 5);
            // Детали правой гусеницы
            ctx.fillRect(x, this.height/2, 3, 5);
        }
        
        // Корпус с градиентом
        const bodyGradient = ctx.createLinearGradient(-this.width/2, 0, this.width/2, 0);
        bodyGradient.addColorStop(0, '#c0392b');
        bodyGradient.addColorStop(0.5, '#e74c3c');
        bodyGradient.addColorStop(1, '#c0392b');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Декоративные элементы на корпусе
        ctx.fillStyle = '#a93226';
        ctx.fillRect(-this.width/2 + 5, -this.height/2 + 5, 10, 5);
        ctx.fillRect(-this.width/2 + 5, this.height/2 - 10, 10, 5);
        
        // Башня
        ctx.save();
        ctx.translate(-this.turretRecoil, 0); // отдача башни
        
        // Основание башни
        ctx.fillStyle = '#7f1e17';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Верхняя часть башни
        ctx.fillStyle = '#a93226';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Дуло с деталями
        ctx.fillStyle = '#5d1210';
        ctx.fillRect(15, -3, 25, 6);
        
        // Дульный тормоз
        ctx.fillStyle = '#7f1e17';
        ctx.fillRect(35, -4, 8, 8);
        
        // Блик на башне
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(-3, -3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        ctx.restore();
        
        // UI элементы
        const barY = this.y - this.height/2 - 20;
        
        // Полоска щита
        if (this.shield > 0 || this.shieldBroken) {
            const shieldBarWidth = 40;
            const shieldBarHeight = 4;
            const shieldPercentage = this.shield / this.maxShield;
            
            // Фон полоски щита
            ctx.fillStyle = 'rgba(0, 100, 100, 0.5)';
            ctx.fillRect(this.x - shieldBarWidth/2, barY, shieldBarWidth, shieldBarHeight);
            
            // Заполнение щита
            if (!this.shieldBroken) {
                ctx.fillStyle = '#00ffff';
            } else {
                ctx.fillStyle = '#ff6666';
            }
            ctx.fillRect(this.x - shieldBarWidth/2, barY, shieldBarWidth * shieldPercentage, shieldBarHeight);
        }
        
        // Полоска здоровья
        const healthBarWidth = 40;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x - healthBarWidth/2, barY + 6, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - healthBarWidth/2, barY + 6, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
    }
    
    takeDamage(damage) {
        // Сначала урон идёт по щиту
        if (this.shield > 0 && !this.shieldBroken) {
            const shieldDamage = Math.min(damage, this.shield);
            this.shield -= shieldDamage;
            damage -= shieldDamage;
            
            if (this.shield <= 0) {
                this.shieldBroken = true;
                this.lastShieldBreak = Date.now();
                this.shield = 0;
            }
        }
        
        // Оставшийся урон идёт по здоровью
        if (damage > 0) {
            this.health -= damage;
            
            if (this.health <= 0) {
                this.active = false;
            }
        }
    }
}