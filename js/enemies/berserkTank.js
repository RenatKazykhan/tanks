// Класс для вражеского танка
class BerserkTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 60;
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 10;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 2000;
        this.active = true;
        this.secondLife = false;

        // Берсерк режим - активируется при низком здоровье
        this.berserkMode = false;
        this.berserkThreshold = 0.3; // 30% здоровья
        this.pulseAnimation = 0;
    }
    
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        // Проверка на активацию берсерк режима
        if (this.health / this.maxHealth <= this.berserkThreshold && !this.berserkMode) {
            this.berserkMode = true;
            this.speed *= 1.5; // Увеличение скорости
            this.shotCooldown = 800; // Быстрее стреляет
            this.damage *= 1.5; // Больше урона
        }
        
        // Анимация пульсации в берсерк режиме
        if (this.berserkMode) {
            this.pulseAnimation += deltaTime * 10;
        }
        
        // AI движение
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // В берсерк режиме танк более агрессивен
        const attackDistance = this.berserkMode ? 100 : 150;
        
        if (distance > attackDistance) {
            this.angle = Math.atan2(dy, dx);
            
            // Зигзагообразное движение в берсерк режиме
            if (this.berserkMode) {
                const zigzag = Math.sin(Date.now() * 0.005) * 0.5;
                this.x += Math.cos(this.angle + zigzag) * this.speed * deltaTime;
                this.y += Math.sin(this.angle + zigzag) * this.speed * deltaTime;
            } else {
                this.x += Math.cos(this.angle) * this.speed * deltaTime;
                this.y += Math.sin(this.angle) * this.speed * deltaTime;
            }
        }
        
        // Стрельба
        const now = Date.now();
        const shootDistance = this.berserkMode ? 400 : 300;
        
        if (now - this.lastShot > this.shotCooldown && distance < shootDistance) {
            // В берсерк режиме стреляет тройными выстрелами
            if (this.berserkMode) {
                for (let i = -1; i <= 1; i++) {
                    const spreadAngle = this.angle + (i * 0.2);
                    this.bullets.push(new Bullet(
                        this.x + Math.cos(spreadAngle) * 30,
                        this.y + Math.sin(spreadAngle) * 30,
                        this.damage,
                        spreadAngle,
                        'enemy'
                    ));
                }
            } else {
                this.bullets.push(new Bullet(
                    this.x + Math.cos(this.angle) * 30,
                    this.y + Math.sin(this.angle) * 30,
                    this.damage,
                    this.angle,
                    'enemy'
                ));
            }
            this.lastShot = now;
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
        
        // Эффект берсерк режима
        if (this.berserkMode) {
            // Красная аура
            const pulseSize = Math.sin(this.pulseAnimation) * 5 + 5;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20 + pulseSize;
            
            // Огненные частицы
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2 + pulseSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Корпус танка (шестиугольная форма)
        ctx.fillStyle = this.berserkMode ? '#ff4444' : '#e74c3c';
        ctx.strokeStyle = this.berserkMode ? '#ff0000' : '#c0392b';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * (this.width/2);
            const y = Math.sin(angle) * (this.height/2);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Башня (треугольная)
        ctx.fillStyle = this.berserkMode ? '#cc0000' : '#c0392b';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -8);
        ctx.lineTo(-5, 8);
        ctx.closePath();
        ctx.fill();
        
        // Дуло (двойное в берсерк режиме)
        ctx.fillStyle = this.berserkMode ? '#990000' : '#a93226';
        if (this.berserkMode) {
            ctx.fillRect(15, -5, 25, 3);
            ctx.fillRect(15, 2, 25, 3);
        } else {
            ctx.fillRect(15, -2, 25, 4);
        }
        
        // Декоративные элементы
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-10, -10, 3, 0, Math.PI * 2);
        ctx.arc(-10, 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Полоска здоровья
        const healthBarWidth = 50;
        const healthBarHeight = 6;
        const healthPercentage = this.health / this.maxHealth;
        
        // Фон полоски
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - healthBarWidth/2 - 1, this.y - this.height/2 - 16, healthBarWidth + 2, healthBarHeight + 2);
        
        // Полоска здоровья
        const healthColor = this.berserkMode ? '#ff6600' : (healthPercentage > 0.5 ? '#00ff00' : '#ffff00');
        ctx.fillStyle = healthColor;
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 15, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Индикатор берсерк режима
        if (this.berserkMode) {
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.fillText('BERSERK!', this.x, this.y - this.height/2 - 25);
        }
        
        // Рисуем пули
        this.bullets.forEach(bullet => bullet.draw());
    }
    
    takeDamage(damage) {
        if (this.health - damage <= 0) {
            if(!this.secondLife){
                this.secondLife = true;
                this.health = 1;
            }
            else{
                this.active = false;
            }
        }
        else this.health -= damage;
    }
}