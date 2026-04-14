// Класс для вражеского танка
class StrongEnemyTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speed = 90;
        this.health = 250;
        this.maxHealth = 250;
        this.damage = 40;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 1000;
        this.active = true;
        
        // Улучшенный AI
        this.state = 'patrol'; // 'patrol', 'chase', 'flank'
        this.patrolTarget = { x: this.x, y: this.y };
        this.lastStateChange = Date.now();
        this.dodgeDirection = 1;
        this.lastDodge = 0;
        this.accuracy = 0.85; // Точность стрельбы
        this.lastPlayerPosition = { x: 0, y: 0 };
        this.predictedPlayerPosition = { x: 0, y: 0 };
        
        // Тактические параметры
        this.optimalDistance = 300; // Оптимальная дистанция для боя
        this.retreatThreshold = 0.3; // Порог здоровья для отступления
        this.flankAngle = 0;
        this.zigzagPhase = 0;
    }
    
    update(playerX, playerY, deltaTime, playerBullets = []) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Предсказание позиции игрока
        this.predictPlayerMovement(playerX, playerY);
        
        // Определение состояния
        this.determineState(distance);
        
        // Выполнение действий в зависимости от состояния
        switch(this.state) {
            case 'patrol':
                this.patrol(deltaTime);
                break;
            case 'chase':
                this.chase(distance, deltaTime);
                break;
            case 'flank':
                this.flank(dx, dy, distance, deltaTime);
                break;
        }
        
        // Уклонение от пуль
        this.dodgeBullets(playerBullets, deltaTime);
        
        // Плавный поворот башни
        this.smoothRotation();
        
        // Умная стрельба
        this.smartShooting(distance);
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
        
        // Сохранение позиции игрока для предсказания
        this.lastPlayerPosition = { x: playerX, y: playerY };
    }
    
    determineState(distance) {
        const now = Date.now();
                
        // Выбор тактики в зависимости от дистанции
         if (distance > 300) {
            this.state = 'chase';
        } else if (Math.random() < 0.3 && now - this.lastStateChange > 3000) {
            this.state = 'flank';
            this.flankAngle = Math.random() < 0.5 ? -Math.PI/2 : Math.PI/2;
            this.lastStateChange = now;
        } else if (distance > this.optimalDistance - 50 && distance < this.optimalDistance + 50) {
            this.state = 'patrol';
        }
    }
    
    patrol(deltaTime) {
        // Движение по случайной траектории вокруг текущей позиции
        const now = Date.now();
        if (now - this.lastStateChange > 2000) {
            this.patrolTarget = {
                x: this.x + (Math.random() - 0.5) * 100,
                y: this.y + (Math.random() - 0.5) * 100
            };
            this.lastStateChange = now;
        }
        
        const dx = this.patrolTarget.x - this.x;
        const dy = this.patrolTarget.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
            this.x += (dx / dist) * this.speed * deltaTime * 0.7;
            this.y += (dy / dist) * this.speed * deltaTime * 0.7;
        }
    }
    
    chase(distance, deltaTime) {
        // Преследование с зигзагообразным движением
        this.zigzagPhase += 0.1;
        const zigzagOffset = Math.sin(this.zigzagPhase) * 30;
        
        const perpAngle = this.targetAngle + Math.PI/2;
        const offsetX = Math.cos(perpAngle) * zigzagOffset;
        const offsetY = Math.sin(perpAngle) * zigzagOffset;
        
        if (distance > this.optimalDistance) {
            this.x += Math.cos(this.targetAngle) * this.speed * deltaTime + offsetX * 0.02;
            this.y += Math.sin(this.targetAngle) * this.speed * deltaTime + offsetY * 0.02;
        }
    }
    
    flank(dx, dy, distance, deltaTime) {
        // Обход с фланга
        const baseAngle = Math.atan2(dy, dx);
        const flankTargetAngle = baseAngle + this.flankAngle;
        
        if (distance > this.optimalDistance - 50) {
            this.x += Math.cos(flankTargetAngle) * this.speed * deltaTime;
            this.y += Math.sin(flankTargetAngle) * this.speed * deltaTime;
        } else {
            // Движение по кругу вокруг игрока
            const circleAngle = baseAngle + Math.PI/2;
            this.x += Math.cos(circleAngle) * this.speed * deltaTime * 0.8;
            this.y += Math.sin(circleAngle) * this.speed * deltaTime * 0.8;
        }
    }
    
    dodgeBullets(playerBullets, deltaTime) {
        const now = Date.now();
        if (now - this.lastDodge < 500) return;
        
        for (let bullet of playerBullets) {
            const bulletDist = Math.sqrt(
                Math.pow(bullet.x - this.x, 2) + 
                Math.pow(bullet.y - this.y, 2)
            );
            
            if (bulletDist < 60) {
                // Уклонение перпендикулярно траектории пули
                const dodgeAngle = bullet.angle + Math.PI/2 * this.dodgeDirection;
                this.x += Math.cos(dodgeAngle) * this.speed * deltaTime * 2;
                this.y += Math.sin(dodgeAngle) * this.speed * deltaTime * 2;
                this.dodgeDirection *= -1;
                this.lastDodge = now;
                break;
            }
        }
    }
    
    predictPlayerMovement(playerX, playerY) {
        // Предсказание движения игрока
        const moveX = playerX - this.lastPlayerPosition.x;
        const moveY = playerY - this.lastPlayerPosition.y;
        
        // Предсказываем позицию на несколько кадров вперед
        this.predictedPlayerPosition = {
            x: playerX + moveX * 10,
            y: playerY + moveY * 10
        };
    }
    
    smoothRotation() {
        // Плавный поворот к цели
        const targetX = this.predictedPlayerPosition.x - this.x;
        const targetY = this.predictedPlayerPosition.y - this.y;
        this.targetAngle = Math.atan2(targetY, targetX);
        
        // Плавная интерполяция угла
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        this.angle += angleDiff * 0.1;
    }
    
    smartShooting(distance) {
        const now = Date.now();
        
         // Проверяем кулдаун
        if (now - this.lastShot < this.shotCooldown) return;

        if (distance < 350) {
            // Добавление случайного разброса для реалистичности
            const spread = (1 - this.accuracy) * 0.2;
            const shootAngle = this.angle + (Math.random() - 0.5) * spread;
            
            // Выстрел с очередью для подавления
            const burstCount = this.state === 'flank' ? 2 : 1;
            for (let i = 0; i < burstCount; i++) {
                setTimeout(() => {
                    if (this.active) {
                        this.bullets.push(new Bullet(
                            this.x + Math.cos(shootAngle) * 25,
                            this.y + Math.sin(shootAngle) * 25,
                            this.damage,
                            shootAngle + (Math.random() - 0.5) * 0.1,
                            'enemy'
                        ));
                    }
                }, i * 100);
            }
            
            this.lastShot = now;
        }
    }
    
    draw() {
    // Корпус с тенью
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Тень танка
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Гусеницы с текстурой (рисуем сначала, чтобы были под корпусом)
    ctx.fillStyle = '#2c3e50';
    // Верхняя гусеница
    ctx.fillRect(-this.width/2 + 2, -this.height/2 - 5, this.width - 4, 6);
    // Нижняя гусеница
    ctx.fillRect(-this.width/2 + 2, this.height/2 - 1, this.width - 4, 6);
        
    // Основной корпус с градиентом
    const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(0.5, '#c0392b');
    gradient.addColorStop(1, '#a93226');
    ctx.fillStyle = gradient;
    ctx.fillRect(-this.width/2, -this.height/2 + 3, this.width, this.height - 6);
    
    // Убираем тень для деталей
    ctx.shadowColor = 'transparent';
    
    // Детали корпуса
    ctx.strokeStyle = '#8e1a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width/2, -this.height/2 + 3, this.width, this.height - 6);
    
    // Декоративные элементы на корпусе
    ctx.fillStyle = '#a93226';
    ctx.fillRect(-this.width/4, -this.height/4 + 3, this.width/2, 2);
    ctx.fillRect(-2, -this.height/2 + 3, 4, this.height - 6);
    
    // Башня с градиентом
    const turretGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
    turretGradient.addColorStop(0, '#e74c3c');
    turretGradient.addColorStop(0.7, '#c0392b');
    turretGradient.addColorStop(1, '#8e1a1a');
    ctx.fillStyle = turretGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка башни
    ctx.strokeStyle = '#641e16';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Дуло с эффектом металла
    const muzzleFlash = Date.now() - this.lastShot < 100;
    if (muzzleFlash) {
        // Эффект выстрела
        ctx.fillStyle = '#f39c12';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 15;
    } else {
        ctx.fillStyle = '#7f8c8d';
        ctx.shadowColor = 'transparent';
    }
    ctx.fillRect(12, -3, 22, 6);
    
    // Детали дула
    ctx.fillStyle = '#34495e';
    ctx.fillRect(30, -2, 4, 4);
    
    // Центральная деталь башни
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Полоска здоровья с рамкой
    const healthBarWidth = 40;
    const healthBarHeight = 6;
    const healthPercentage = this.health / this.maxHealth;
    
    // Фон полоски здоровья
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x - healthBarWidth/2 - 1, this.y - this.height/2 - 13, healthBarWidth + 2, healthBarHeight + 2);
    
    // Полоска здоровья
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth, healthBarHeight);
    
    // Градиент здоровья
    const healthGradient = ctx.createLinearGradient(
        this.x - healthBarWidth/2, 0,
        this.x + healthBarWidth/2, 0
    );
    if (healthPercentage > 0.5) {
        healthGradient.addColorStop(0, '#27ae60');
        healthGradient.addColorStop(1, '#2ecc71');
    } else if (healthPercentage > 0.3) {
        healthGradient.addColorStop(0, '#f39c12');
        healthGradient.addColorStop(1, '#f1c40f');
    } else {
        healthGradient.addColorStop(0, '#c0392b');
        healthGradient.addColorStop(1, '#e74c3c');
    }
    ctx.fillStyle = healthGradient;
    ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth * healthPercentage, healthBarHeight);
    
    // Индикатор состояния (опционально)
    if (this.state === 'flank') {
        // Мигающий индикатор для агрессивного состояния
        if (Math.sin(Date.now() * 0.01) > 0) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Рисуем пули
    //this.bullets.forEach(bullet => bullet.draw());
}
    
    takeDamage(damage) {
        if(player.lifeSteal >0) {
            player.health = Math.min(player.maxHealth, player.health + damage * player.lifeSteal); // Увеличиваем здоровье игрока на часть урона
        }

        this.health -= damage;
        
        // Агрессивная реакция на урон
        if (this.health > 0) {
            this.state = 'flank';
            this.lastStateChange = Date.now();
        }
        
        if (this.health <= 0) {
            this.active = false;
            score += 50;
        }
    }
}