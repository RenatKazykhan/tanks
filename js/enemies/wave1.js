// Класс для вражеского танка
class Wave1 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speed = 50;
        this.health = 30;
        this.maxHealth = 30;
        this.damage = 10;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 2000;
        this.active = true;
        this.bulletSpeed = 300;
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
        
        // Стрельба
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown && distance < 300) {
            this.bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25,
                this.damage,
                this.angle,
                'enemy',
                this.bulletSpeed
            ));
            this.lastShot = now;
        }
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }
    
    draw() {
        // Корпус
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Башня
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Дуло
        ctx.fillStyle = '#a93226';
        ctx.fillRect(12, -2, 20, 4);
        
        ctx.restore();
        
        // Полоска здоровья
        const healthBarWidth = 40;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
    }
    
    takeDamage(damage) {
        if (this.health - damage <= 0) {
            this.active = false;
        }
        this.health -= damage;

        if(isNaN(this.health)) {
            this.active = false;
        }
    }
}