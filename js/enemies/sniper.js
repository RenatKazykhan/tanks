// Класс для противотанковой САУ
class Sniper extends EnemyTank {
    constructor(x, y) {
        super(x, y);
        // Переопределяем характеристики
        this.width = 40;
        this.height = 30; // Более низкий профиль
        this.speed = 50; // Медленнее обычного танка
        this.health = 100; // Меньше брони
        this.maxHealth = 100;
        this.damage = 100; // Больше урона
        this.shotCooldown = 3000; // Медленнее перезарядка
        this.range = 600; // Дальность стрельбы
        this.minRange = 300; // Минимальная дистанция для стрельбы
        this.bulletSpeed = 900; // Быстрые снаряды
        this.aimTime = 0; // Время прицеливания
        this.isAiming = false;
        this.targetAngle = this.angle;
    }
    
    update(playerX, playerY, deltaTime, playerBullets = []) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(dy, dx);
        
        // САУ держится на расстоянии
        if (distance < this.minRange) {
            // Отступаем если слишком близко
            this.angle = targetAngle + Math.PI;
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
            this.isAiming = false;
        } else if (distance > this.range) {
            // Подходим ближе если слишком далеко
            this.angle = targetAngle;
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
            this.isAiming = false;
        } else {
            // В зоне поражения - прицеливаемся и стреляем
            this.isAiming = true;
            this.targetAngle = targetAngle;
            
            // Плавный поворот башни
            const angleDiff = this.targetAngle - this.angle;
            const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            this.angle += normalizedDiff * 0.05;
            
            // Стрельба только после прицеливания
            if (Math.abs(normalizedDiff) < 0.1) {
                this.aimTime++;
                const now = Date.now();
                if (now - this.lastShot > this.shotCooldown && this.aimTime > 30) {
                    // Создаем более быстрый снаряд
                    const bullet = new Bullet(
                        this.x + Math.cos(this.angle) * 35,
                        this.y + Math.sin(this.angle) * 35,
                        this.damage,
                        this.angle,
                        'enemy'
                    );
                    bullet.speed = this.bulletSpeed;
                    this.bullets.push(bullet);
                    this.lastShot = now;
                    this.aimTime = 0;
                }
            } else {
                this.aimTime = 0;
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
    
    // Тень под танком
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-this.width/2 - 2, -this.height/2 + 5, this.width + 4, this.height);
    
    // Левая гусеница
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-this.width/2 - 5, -this.height/2 - 5, this.width + 10, 8);
    
    // Правая гусеница
    ctx.fillRect(-this.width/2 - 5, this.height/2 - 3, this.width + 10, 8);
        
    // Нижняя часть корпуса
    ctx.fillStyle = '#4a5a3a';
    ctx.fillRect(-this.width/2 + 2, -this.height/2 + 5, this.width - 4, this.height - 10);
    
    // Верхняя бронеплита (наклонная)
    ctx.fillStyle = '#5a6a4a';
    ctx.beginPath();
    ctx.moveTo(-this.width/2 + 2, -this.height/2 + 5);
    ctx.lineTo(this.width/2 - 2, -this.height/2 + 5);
    ctx.lineTo(this.width/2, 0);
    ctx.lineTo(-this.width/2 + 5, 0);
    ctx.closePath();
    ctx.fill();
    
    // Низкопрофильная рубка
    ctx.fillStyle = '#4a5a3a';
    ctx.beginPath();
    ctx.moveTo(-this.width/3, -this.height/4 + 3);
    ctx.lineTo(-this.width/4, -this.height/3 + 3);
    ctx.lineTo(this.width/6, -this.height/3 + 3);
    ctx.lineTo(this.width/5, -this.height/4 + 3);
    ctx.closePath();
    ctx.fill();
    
    // Люк командира
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(-this.width/6, -this.height/4 + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Маска орудия
    ctx.fillStyle = '#3a4a3a';
    ctx.fillRect(this.width/2 - 8, -6, 12, 12);
    
    // Длинноствольное противотанковое орудие
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(this.width/2, -3, 45, 6);
    
    // Утолщение ствола
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(this.width/2 + 10, -4, 8, 8);
    
    // Дульный тормоз
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(this.width/2 + 42, -5, 10, 10);
    ctx.fillRect(this.width/2 + 50, -4, 4, 8);
    
    // Детали на корпусе
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-this.width/2 + 5, -this.height/2 + 8, this.width - 10, this.height - 16);
    
    // Выхлопная труба
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-this.width/2 + 5, 0, 6, 6);
    
    // Запасные траки на борту
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-this.width/2 + 15, -this.height/2 + 10, 3, 15);
    ctx.fillRect(-this.width/2 + 20, -this.height/2 + 10, 3, 15);
    
    // Камуфляжные пятна
    ctx.fillStyle = 'rgba(60, 50, 30, 0.3)';
    ctx.beginPath();
    ctx.arc(-this.width/4, 0, 8, 0, Math.PI * 2);
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.arc(this.width/6, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Полоска здоровья с рамкой
    const healthBarWidth = 40;
    const healthBarHeight = 5;
    const healthPercentage = this.health / this.maxHealth;
    
    // Рамка полоски здоровья
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - healthBarWidth/2 - 1, this.y - this.height/2 - 18, healthBarWidth + 2, healthBarHeight + 2);
    
    // Фон полоски здоровья
    ctx.fillStyle = '#4a0000';
    ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 17, healthBarWidth, healthBarHeight);
    
    // Здоровье (градиент от зеленого к красному)
    if (healthPercentage > 0.5) {
        ctx.fillStyle = '#00aa00';
    } else if (healthPercentage > 0.25) {
        ctx.fillStyle = '#aaaa00';
    } else {
        ctx.fillStyle = '#aa0000';
    }
    ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 17, healthBarWidth * healthPercentage, healthBarHeight);
    
    // Рисуем пули
    //this.bullets.forEach(bullet => bullet.draw());
  }
}