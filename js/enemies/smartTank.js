class SmartTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 25;
        this.health = 150;
        this.maxHealth = 150;
        this.speed = 80;
        this.damage = 40;
        this.angle = 0;
        this.targetAngle = 0;
        this.bullets = [];
        this.shotCooldown = 1200;
        this.lastShot = 0;
        this.active = true;
        this.bulletSpeed = 400;
        this.accuracy = 0.95; // Точность стрельбы

        // AI состояния
        this.lastStateChange = Date.now();
        this.optimalDistance = 350;

        // Уклонение
        this.dodgeDirection = 1;
        this.lastDodge = 0;

        // Обнаружение стен
        this.wallDetectionRange = 50;
        this.avoidanceForce = { x: 0, y: 0 };

        this.bodyAngle = 0; // Угол поворота корпуса
        this.targetBodyAngle = 0; // Целевой угол поворота корпуса
        this.turnSpeed = 0.05; // Скорость поворота корпуса
    }

    // для способностей
    takeDamageBySkill(damage) {
        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }

    // Проверка видимости цели через стены
    hasLineOfSight(targetX, targetY, walls) {
        const steps = 20;
        const dx = (targetX - this.x) / steps;
        const dy = (targetY - this.y) / steps;

        for (let i = 1; i <= steps; i++) {
            const checkX = this.x + dx * i;
            const checkY = this.y + dy * i;

            for (let wall of walls) {
                if (checkX >= wall.x && checkX <= wall.x + wall.width &&
                    checkY >= wall.y && checkY <= wall.y + wall.height) {
                    return false;
                }
            }
        }
        return true;
    }

    // Обнаружение ближайших стен
    detectNearbyWalls(walls) {
        this.avoidanceForce = { x: 0, y: 0 };

        for (let wall of walls) {
            // Центр стены
            const wallCenterX = wall.x + wall.width / 2;
            const wallCenterY = wall.y + wall.height / 2;

            // Расстояние до стены
            const dx = this.x - wallCenterX;
            const dy = this.y - wallCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Если стена близко, добавляем силу отталкивания
            if (distance < this.wallDetectionRange) {
                const force = (this.wallDetectionRange - distance) / this.wallDetectionRange;
                this.avoidanceForce.x += (dx / distance) * force * 100;
                this.avoidanceForce.y += (dy / distance) * force * 100;
            }
        }
    }

    // Поиск пути в обход стен
    findPathAroundWalls(targetX, targetY, walls) {
        // Если прямой путь свободен, двигаемся прямо
        if (this.hasLineOfSight(targetX, targetY, walls)) {
            return { x: targetX, y: targetY };
        }

        // Иначе ищем обходной путь
        const angles = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2];
        const checkDistance = 200;

        for (let angle of angles) {
            const checkX = this.x + Math.cos(this.angle + angle) * checkDistance;
            const checkY = this.y + Math.sin(this.angle + angle) * checkDistance;

            if (this.hasLineOfSight(checkX, checkY, walls)) {
                return { x: checkX, y: checkY };
            }
        }

        // Если не нашли путь, двигаемся в сторону с учетом отталкивания от стен
        return {
            x: this.x + this.avoidanceForce.x,
            y: this.y + this.avoidanceForce.y
        };
    }

    update(playerX, playerY, deltaTime, playerBullets, walls) {
        if (!this.active) return;

        if (isNaN(this.x)) this.active = false;


        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Сохраняем предыдущую позицию для расчета направления движения
        const prevX = this.x;
        const prevY = this.y;

        this.chase(distance, deltaTime, playerX, playerY, walls);

        // Обновляем угол корпуса на основе направления движения
        const moveX = this.x - prevX;
        const moveY = this.y - prevY;
        if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
            this.targetBodyAngle = Math.atan2(moveY, moveX);
        }

        // Плавный поворот корпуса
        this.updateBodyRotation();

        // Уклонение от пуль
        this.dodgeBullets(playerBullets, deltaTime);

        // Плавный поворот башни
        this.smoothRotation(playerX, playerY);

        // Умная стрельба
        this.smartShooting(distance);

        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }

    // Добавьте новый метод для плавного поворота корпуса
    updateBodyRotation() {
        // Рассчитываем разницу углов
        let angleDiff = this.targetBodyAngle - this.bodyAngle;

        // Нормализуем угол в диапазон [-π, π]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Плавно поворачиваем корпус
        this.bodyAngle += angleDiff * this.turnSpeed;
    }

    chase(distance, deltaTime, playerX, playerY, walls) {
        // Преследование с учетом стен
        const waypoint = this.findPathAroundWalls(playerX, playerY, walls);
        const dx = waypoint.x - this.x;
        const dy = waypoint.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.optimalDistance) {
            // Зигзагообразное движение
            const zigzag = Math.sin(Date.now() * 0.003) * 0.5;
            this.x += (dx / dist) * this.speed * deltaTime +
                Math.cos(this.angle + Math.PI / 2) * zigzag * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime +
                Math.sin(this.angle + Math.PI / 2) * zigzag * this.speed * deltaTime;
        }
    }

    // Остальные методы (dodgeBullets, predictPlayerMovement, smoothRotation, smartShooting, draw, takeDamage) 
    // остаются без изменений...
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
                const dodgeAngle = bullet.angle + Math.PI / 2 * this.dodgeDirection;
                this.x += Math.cos(dodgeAngle) * this.speed * deltaTime * 2;
                this.y += Math.sin(dodgeAngle) * this.speed * deltaTime * 2;
                this.dodgeDirection *= -1;
                this.lastDodge = now;
                break;
            }
        }
    }

    smoothRotation(playerX, playerY) {
        // Плавный поворот к цели
        const targetX = playerX - this.x;
        const targetY = playerY - this.y;
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
            const burstCount = 2;
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
        if (!this.active) return;

        // Отрисовка пуль
        //this.bullets.forEach(bullet => bullet.draw());

        ctx.save();
        ctx.translate(this.x, this.y);

        // Поворачиваем корпус
        ctx.save();
        ctx.rotate(this.bodyAngle);

        // Тень для корпуса
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Корпус танка с градиентом
        const bodyGradient = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0);
        bodyGradient.addColorStop(0, '#c0392b');
        bodyGradient.addColorStop(0.5, '#e74c3c');
        bodyGradient.addColorStop(1, '#c0392b');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Убираем тень для деталей
        ctx.shadowColor = 'transparent';

        // Детали корпуса
        ctx.strokeStyle = '#8e1a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2 + 3, this.width, this.height - 6);

        // Декоративные элементы на корпусе
        ctx.fillStyle = '#a93226';
        ctx.fillRect(-this.width / 4, -this.height / 4 + 3, this.width / 2, 2);
        ctx.fillRect(-2, -this.height / 2 + 3, 4, this.height - 6);

        ctx.restore(); // Восстанавливаем контекст после поворота корпуса

        // Поворачиваем только башню
        ctx.rotate(this.angle);

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

        // Полоска здоровья (остается без изменений)
        const healthBarWidth = 40;
        const healthBarHeight = 6;
        const healthPercentage = this.health / this.maxHealth;

        // Фон полоски здоровья
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - healthBarWidth / 2 - 1, this.y - this.height / 2 - 13, healthBarWidth + 2, healthBarHeight + 2);

        // Полоска здоровья
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 12, healthBarWidth, healthBarHeight);

        // Цвет в зависимости от здоровья
        if (healthPercentage > 0.6) {
            ctx.fillStyle = '#27ae60';
        } else if (healthPercentage > 0.3) {
            ctx.fillStyle = '#f39c12';
        } else {
            ctx.fillStyle = '#e74c3c';
        }

        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 12, healthBarWidth * healthPercentage, healthBarHeight);

        // Рамка полоски здоровья
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 12, healthBarWidth, healthBarHeight);
    }

    takeDamage(damage) {
        if (this.health - damage <= 0) {
            this.active = false;
            return;
        }

        this.health -= damage;
    }
}