class Turret {
    constructor(x, y, rotationSpeed = 0.02) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.radius = this.width / 2;
        this.baseAngle = Math.random() * Math.PI * 2;
        this.currentAngle = this.baseAngle;
        this.rotationSpeed = rotationSpeed;
        this.health = 500;
        this.maxHealth = 500;
        this.active = true;
        this.bullets = [];
        this.lastShot = Date.now();
        this.shotCooldown = 1000;
        this.damage = 100;
        this.bulletSpeed = 500;
        this.detectionRange = 500;
        this.rotationMode = 'rotating'; // 'rotating' или 'tracking'
    }

    update(playerX, playerY, deltaTime) {
        if (!this.active) return;

        const distance = Math.sqrt(Math.pow(playerX - this.x, 2) + Math.pow(playerY - this.y, 2));

        if (distance <= this.detectionRange) {
            this.rotationMode = 'tracking';
            
            // Расчитываем скорость игрока на основе последней позиции
            if (!this.lastPlayerPos) {
                this.lastPlayerPos = { x: playerX, y: playerY, time: Date.now() };
            }
            
            const now = Date.now();
            const timeDiff = (now - this.lastPlayerPos.time) / 1000; // в секундах
            
            if (timeDiff > 0.016) { // Обновляем не чаще чем 60 FPS
                const playerVelocityX = (playerX - this.lastPlayerPos.x) / timeDiff;
                const playerVelocityY = (playerY - this.lastPlayerPos.y) / timeDiff;
                
                // Расчет упреждения
                const bulletTravelTime = distance / this.bulletSpeed;
                const predictedX = playerX + playerVelocityX * bulletTravelTime;
                const predictedY = playerY + playerVelocityY * bulletTravelTime;
                
                const targetAngle = Math.atan2(predictedY - this.y, predictedX - this.x);
                
                // Обновляем последнюю позицию
                this.lastPlayerPos = { x: playerX, y: playerY, time: now };
                
                this.currentAngle = targetAngle; // Резкий поворот для точного упреждения
            }

            // Стрельба при наведении на цель
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const currentTargetAngle = Math.atan2(dy, dx);
            let angleDiff = currentTargetAngle - this.currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < 0.2 && Date.now() - this.lastShot > this.shotCooldown) {
                this.shoot();
                this.lastShot = Date.now();
            }
        } else {
            this.rotationMode = 'rotating';
            this.currentAngle += this.rotationSpeed;
        }

        // Обновляем пули
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }

    shoot(targetX = null, targetY = null) {
        const bulletX = this.x + Math.cos(this.currentAngle) * 30;
        const bulletY = this.y + Math.sin(this.currentAngle) * 30;
        
        this.bullets.push(new Bullet(
            bulletX,
            bulletY,
            this.damage,
            this.currentAngle,
            'enemy',
            this.bulletSpeed
        ));
    }

    draw() {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Пьедестал турели
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#4a4a4a');
        gradient.addColorStop(0.7, '#2a2a2a');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Отметка о режиме работы
        ctx.strokeStyle = this.rotationMode === 'tracking' ? '#ff0000' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
        ctx.stroke();

        // Башня турели
        ctx.rotate(this.currentAngle);
        
        const turretGradient = ctx.createLinearGradient(0, -8, 40, 8);
        turretGradient.addColorStop(0, '#666666');
        turretGradient.addColorStop(0.5, '#888888');
        turretGradient.addColorStop(1, '#444444');
        
        ctx.fillStyle = turretGradient;
        ctx.fillRect(0, -8, 40, 16);
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -8, 40, 16);

        // Дульный тормоз
        ctx.fillStyle = '#333333';
        ctx.fillRect(40, -10, 5, 20);

        ctx.restore();

        // Полоска здоровья
        const healthBarWidth = 50;
        const healthBarHeight = 6;
        const healthBarY = this.y - this.radius - 15;
        
        // Фон полоски здоровья
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);
        
        // Полоска здоровья
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        const healthColor = healthPercent > 0.6 ? '#00ff00' : 
                           healthPercent > 0.3 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(this.x - healthBarWidth/2, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        
        // Граница полоски здоровья
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);

        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            createExplosion(this.x, this.y, '#666666');
            score += 30;
            xpManager.addXP(15);
        }
    }
}