class HeavyTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 40;
        this.angle = 0;
        this.turretAngle = 0;
        this.speed = 30;
        this.rotationSpeed = 0.05;
        this.health = 500;
        this.maxHealth = 500;
        this.damage = 50;
        this.active = true;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 1500;
        this.minDistance = 250;
        this.armor = 0.7; // Поглощает 30% урона
        this.lastDamageTime = null;
        this.bulletSpeed = 500;
        
        // Для тактического ИИ
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        this.patrolAngle = Math.random() * Math.PI * 2;
    }
    
    update(playerX, playerY, deltaTime) {
        if (!this.active) return;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Запоминаем последнее известное положение игрока
        this.lastPlayerX = playerX;
        this.lastPlayerY = playerY;
        
        // Движение - держим оптимальную дистанцию
        if (distance > 250) {
            // Приближаемся к игроку
            const targetAngle = Math.atan2(dy, dx);
            this.angle = this.lerp(this.angle, targetAngle, this.rotationSpeed);
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        } else if (distance < this.minDistance) {
            // Отступаем от игрока
            const targetAngle = Math.atan2(-dy, -dx);
            this.angle = this.lerp(this.angle, targetAngle, this.rotationSpeed);
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        } else {
            // Движемся по кругу вокруг игрока
            const circleAngle = Math.atan2(dy, dx) + Math.PI / 2;
            this.angle = this.lerp(this.angle, circleAngle, this.rotationSpeed);
            this.x += Math.cos(this.angle) * this.speed * deltaTime * 0.5;
            this.y += Math.sin(this.angle) * this.speed * deltaTime * 0.5;
        }
        
        // Наводим башню на игрока с упреждением
        const predictedX = playerX + (Math.random() - 0.5) * 50; // Добавляем немного неточности
        const predictedY = playerY + (Math.random() - 0.5) * 50;
        const turretDx = predictedX - this.x;
        const turretDy = predictedY - this.y;
        this.turretAngle = Math.atan2(turretDy, turretDx);
        
        // Стрельба
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown && distance < 400) {
            // Двойной выстрел с небольшой задержкой
            this.shoot();
            setTimeout(() => {
                if (this.active) {
                    this.shoot();
                }
            }, 100);
            this.lastShot = now;
        }
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }
    
    shoot() {
        const bulletX = this.x + Math.cos(this.turretAngle) * 35;
        const bulletY = this.y + Math.sin(this.turretAngle) * 35;
        
        this.bullets.push(new Bullet(
            bulletX,
            bulletY,
            this.damage,
            this.turretAngle,
            'enemy',
            this.bulletSpeed
        ));
    }
    
    lerp(current, target, speed) {
        let diff = target - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return current + diff * speed;
    }
    
    draw() {
        ctx.save();
        
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.translate(this.x + 3, this.y + 3);
        ctx.rotate(this.angle);
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
        
        // Корпус танка
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Основной корпус
        ctx.fillStyle = '#8B4513'; // Коричневый цвет
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Броневые пластины
        ctx.fillStyle = '#654321';
        ctx.fillRect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, 8);
        ctx.fillRect(-this.width/2 + 5, this.height/2 - 13, this.width - 10, 8);
        
        // Гусеницы (по бокам)
        ctx.fillStyle = '#2C1810';
        ctx.fillRect(-this.width/2 - 6, -this.height/2 - 3, this.width + 12, 6);  // Верхняя гусеница
        ctx.fillRect(-this.width/2 - 6, this.height/2 - 3, this.width + 12, 6);    // Нижняя гусеница
        
        // Детали гусениц (звенья)
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = '#1A0F08';
            const x = -this.width/2 - 3 + i * 9;
            // Верхняя гусеница
            ctx.fillRect(x, -this.height/2 - 1, 4, 2);
            // Нижняя гусеница  
            ctx.fillRect(x, this.height/2 - 1, 4, 2);
        }
        
        ctx.restore();
        
        // Башня
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        
        // Основание башни
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Дуло (более толстое и длинное)
        ctx.fillStyle = '#2C1810';
        ctx.fillRect(15, -4, 30, 8);
        
        // Дульный тормоз
        ctx.fillStyle = '#1A0F08';
        ctx.fillRect(42, -6, 3, 12);
        
        // Прицел на башне
        ctx.fillStyle = '#333';
        ctx.fillRect(-3, -8, 6, 3);
        
        ctx.restore();
        
        // Полоска здоровья
        const healthBarWidth = 50;
        const healthBarHeight = 6;
        const healthPercentage = this.health / this.maxHealth;
        
        // Фон полоски здоровья
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - healthBarWidth/2 - 1, this.y - this.height/2 - 16, healthBarWidth + 2, healthBarHeight + 2);
        
        // Красная полоска (потерянное здоровье)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 15, healthBarWidth, healthBarHeight);
        
        // Зеленая полоска (текущее здоровье)
        if (healthPercentage > 0.6) {
            ctx.fillStyle = '#2ecc71';
        } else if (healthPercentage > 0.3) {
            ctx.fillStyle = '#f39c12';
        } else {
            ctx.fillStyle = '#e74c3c';
        }
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 15, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
        
        // Эффект брони (мерцание при получении урона)
        if (this.lastDamageTime && Date.now() - this.lastDamageTime < 200) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    takeDamage(damage) {
        // Броня поглощает часть урона
        const actualDamage = Math.floor(damage * this.armor);
        this.health -= actualDamage;
        this.lastDamageTime = Date.now();
        
        if (this.health <= 0) {
            this.active = false;
            score += 50; // Больше очков за тяжелый танк
        }
    }
}