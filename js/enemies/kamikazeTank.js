// Класс для вражеского танка
class KamikazeTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.speed = 80;
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 15;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 2000;
        this.active = true;
        
        // Параметры для камикадзе
        this.kamikazeMode = false;
        this.kamikazeSpeed = 250;
        this.explosionRadius = 100;
        this.explosionDamage = 75;
        this.kamikazeActivationHealth = 30; // Активируется при низком здоровье
        
        // Визуальные эффекты
        this.pulseAnimation = 0;
        this.trackOffset = 0;
    }
    
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        // Проверка активации режима камикадзе
        if (!this.kamikazeMode && this.health <= this.kamikazeActivationHealth) {
            this.kamikazeMode = true;
        }
        
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Обновление анимации
        this.pulseAnimation += deltaTime * 10;
        this.trackOffset += this.speed * deltaTime;
        
        if (this.kamikazeMode) {
            // Режим камикадзе - быстрое движение к игроку
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.kamikazeSpeed * deltaTime;
            this.y += Math.sin(this.angle) * this.kamikazeSpeed * deltaTime;
            
            // Взрыв при близком контакте
            if (distance < 40) {
                this.explode(playerX, playerY);
            }
        } else {
            // Обычное поведение
            if (distance > 250) {
                this.angle = Math.atan2(dy, dx);
                this.x += Math.cos(this.angle) * this.speed * deltaTime;
                this.y += Math.sin(this.angle) * this.speed * deltaTime;
            }
            
            // Стрельба
            const now = Date.now();
            if (now - this.lastShot > this.shotCooldown && distance < 300) {
                this.bullets.push(new Bullet(
                    this.x + Math.cos(this.angle) * 25,
                    this.y + Math.sin(this.angle) * 25,
                    this.damage,
                    this.angle,
                    'enemy'
                ));
                this.lastShot = now;
            }
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
        ctx.rotate(this.angle);
        
        if (this.kamikazeMode) {
            // Мигающий эффект в режиме камикадзе
            const pulse = Math.sin(this.pulseAnimation) * 0.5 + 0.5;
            ctx.shadowBlur = 20 * pulse;
            ctx.shadowColor = '#ff0000';
        }
        
        // Гусеницы
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-this.width/2, -this.height/2 - 5, this.width, 8);
        ctx.fillRect(-this.width/2, this.height/2 - 3, this.width, 8);
        
        // Детали гусениц
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = -this.width/2 + (i * this.width/4) + (this.trackOffset % (this.width/4));
            ctx.beginPath();
            ctx.moveTo(x, -this.height/2 - 5);
            ctx.lineTo(x, -this.height/2 + 3);
            ctx.moveTo(x, this.height/2 - 3);
            ctx.lineTo(x, this.height/2 + 5);
            ctx.stroke();
        }
        
        // Корпус с угловатым дизайном
        ctx.fillStyle = this.kamikazeMode ? '#ff4444' : '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + 5, -this.height/2);
        ctx.lineTo(this.width/2 - 5, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/2 + 5);
        ctx.lineTo(this.width/2, this.height/2 - 5);
        ctx.lineTo(this.width/2 - 5, this.height/2);
        ctx.lineTo(-this.width/2 + 5, this.height/2);
        ctx.lineTo(-this.width/2, this.height/2 - 5);
        ctx.lineTo(-this.width/2, -this.height/2 + 5);
        ctx.closePath();
        ctx.fill();
        
        // Башня шестиугольная
        ctx.fillStyle = this.kamikazeMode ? '#cc0000' : '#c0392b';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        if (!this.kamikazeMode) {
            // Дуло (только в обычном режиме)
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(10, -3, 22, 6);
            ctx.fillStyle = '#660000';
            ctx.fillRect(28, -2, 8, 4);
        } else {
            // Символ опасности в режиме камикадзе
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', 0, 0);
        }
        
        ctx.restore();
        
        // Полоска здоровья
        const healthBarWidth = 40;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 15, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = this.kamikazeMode ? 'orange' : 'green';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 15, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Рисуем пули
        this.bullets.forEach(bullet => bullet.draw());
    }
    
    explode(playerX, playerY) {
        // Визуальный эффект взрыва
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.explosionRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Проверка урона игроку
        const distance = Math.sqrt(Math.pow(playerX - this.x, 2) + Math.pow(playerY - this.y, 2));
        if (distance < this.explosionRadius) {
            // Урон уменьшается с расстоянием
            const damageMultiplier = 1 - (distance / this.explosionRadius);
            const finalDamage = Math.floor(this.explosionDamage * damageMultiplier);
            // Здесь должен быть вызов метода получения урона игроком
            // player.takeDamage(finalDamage);
        }
        
        this.active = false;
    }
    
    takeDamage(damage) {
        if (this.health - damage <= 0) {
            if (this.kamikazeMode) {
                // Взрыв при смерти в режиме камикадзе
                this.explode(player.x, player.y);
            }
            this.active = false;
        }
        
        this.health -= damage;
    }
}