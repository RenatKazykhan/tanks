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
        this.health = 50;
        this.maxHealth = 50;
        this.active = true;
        this.bullets = [];
        this.lastShot = Date.now();
        this.shotCooldown = 2000;
        this.damage = 10;
        this.bulletSpeed = 200;
        this.detectionRange = 300;
        this.rotationMode = 'rotating'; // 'rotating' или 'tracking'
    }

    update(playerX, playerY, deltaTime) {
        if (!this.active) return;

        const distance = Math.sqrt(Math.pow(playerX - this.x, 2) + Math.pow(playerY - this.y, 2));

        if (distance <= this.detectionRange) {
            this.rotationMode = 'tracking';
            const targetAngle = Math.atan2(playerY - this.y, playerX - this.x);
            
            // Плавный поворот к цели
            let angleDiff = targetAngle - this.currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.currentAngle += angleDiff * 0.05;

            // Стрельба при наведении на цель
            if (Math.abs(angleDiff) < 0.1 && Date.now() - this.lastShot > this.shotCooldown) {
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

    shoot() {
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

        // Рисуем пули
        this.bullets.forEach(bullet => bullet.draw());
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