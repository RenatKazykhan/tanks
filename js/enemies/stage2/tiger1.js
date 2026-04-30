// Класс для тяжёлого вражеского танка
class Tiger1 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 45;
        this.speed = 50;
        this.health = 750;
        this.maxHealth = 750;
        this.damage = 50;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 1000;
        this.active = true;
        this.attackRange = 400;
        this.trackOffset = 0;

        // === ПАТРУЛИРОВАНИЕ ===
        this.state = 'patrol'; // 'patrol' или 'attack'
        this.detectionRange = 450; // Дистанция обнаружения игрока
        this.loseTargetRange = 500; // Дистанция потери цели (возврат к патрулю)

        // Точки патрулирования — генерируем вокруг стартовой позиции
        this.patrolCenter = { x: x, y: y };
        this.patrolRadius = 150; // Радиус зоны патрулирования
        this.patrolPoints = this._generatePatrolPoints(x, y);
        this.currentPatrolIndex = 0;
        this.patrolWaitTime = 0; // Таймер ожидания в точке
        this.patrolWaitDuration = 1.5; // Сколько секунд стоять в точке
        this.isWaiting = false;

        // Плавный поворот
        this.turnSpeed = 2.5; // Радиан в секунду
    }

    // Генерация точек патрулирования вокруг начальной позиции
    _generatePatrolPoints(cx, cy) {
        const points = [];
        const count = 4; // 4 точки — прямоугольный маршрут
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            points.push({
                x: cx + Math.cos(angle) * this.patrolRadius,
                y: cy + Math.sin(angle) * this.patrolRadius
            });
        }
        return points;
    }

    // Плавный поворот к целевому углу
    _rotateTowards(targetAngle, deltaTime) {
        let diff = targetAngle - this.angle;

        // Нормализуем разницу в диапазон [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const maxRotation = this.turnSpeed * deltaTime;

        if (Math.abs(diff) < maxRotation) {
            this.angle = targetAngle;
            return true; // Поворот завершён
        } else {
            this.angle += Math.sign(diff) * maxRotation;
            return false; // Ещё поворачиваемся
        }
    }

    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

        // === ПЕРЕКЛЮЧЕНИЕ СОСТОЯНИЙ ===
        if (this.state === 'patrol' && distanceToPlayer < this.detectionRange) {
            // Игрок обнаружен — переходим в атаку
            this.state = 'attack';
            this.isWaiting = false;
            this.patrolWaitTime = 0;
        } else if (this.state === 'attack' && distanceToPlayer > this.loseTargetRange) {
            // Игрок далеко — возвращаемся к патрулированию
            this.state = 'patrol';
            // Находим ближайшую точку патруля для возврата
            this._findNearestPatrolPoint();
        }

        // === ЛОГИКА В ЗАВИСИМОСТИ ОТ СОСТОЯНИЯ ===
        if (this.state === 'patrol') {
            this._updatePatrol(deltaTime);
        } else if (this.state === 'attack') {
            this._updateAttack(playerX, playerY, distanceToPlayer, deltaTime);
        }

        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }

    // === ПАТРУЛИРОВАНИЕ ===
    _updatePatrol(deltaTime) {
        const target = this.patrolPoints[this.currentPatrolIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Если ждём в точке
        if (this.isWaiting) {
            this.patrolWaitTime += deltaTime;
            if (this.patrolWaitTime >= this.patrolWaitDuration) {
                this.isWaiting = false;
                this.patrolWaitTime = 0;
                // Переходим к следующей точке
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            }
            return;
        }

        // Достигли точки патрулирования
        if (distance < 10) {
            this.isWaiting = true;
            this.patrolWaitTime = 0;
            return;
        }

        // Поворачиваемся к точке и двигаемся
        const targetAngle = Math.atan2(dy, dx);
        const aligned = this._rotateTowards(targetAngle, deltaTime);

        // Двигаемся только если примерно смотрим в нужную сторону
        if (aligned || Math.abs(targetAngle - this.angle) < 0.3) {
            const patrolSpeed = this.speed * 0.6; // Патрулируем медленнее
            this.x += Math.cos(this.angle) * patrolSpeed * deltaTime;
            this.y += Math.sin(this.angle) * patrolSpeed * deltaTime;
            this.trackOffset += patrolSpeed * deltaTime;
        }
    }

    // === АТАКА ===
    _updateAttack(playerX, playerY, distanceToPlayer, deltaTime) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const targetAngle = Math.atan2(dy, dx);

        // Плавно поворачиваемся к игроку
        this._rotateTowards(targetAngle, deltaTime);

        // Сближаемся, если далеко; держим дистанцию, если слишком близко
        const preferredDistance = 250; // Предпочтительная дистанция боя
        const approachThreshold = 280;
        const retreatThreshold = 150;

        if (distanceToPlayer > approachThreshold) {
            // Приближаемся к игроку
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
            this.trackOffset += this.speed * deltaTime;
        } else if (distanceToPlayer < retreatThreshold) {
            // Слишком близко — отступаем
            const retreatSpeed = this.speed * 0.4;
            this.x -= Math.cos(this.angle) * retreatSpeed * deltaTime;
            this.y -= Math.sin(this.angle) * retreatSpeed * deltaTime;
            this.trackOffset += retreatSpeed * deltaTime;
        }

        // Стрельба — стреляем только если примерно смотрим на игрока
        const now = Date.now();
        const angleDiff = Math.abs(targetAngle - this.angle);
        const normalizedDiff = angleDiff > Math.PI ? Math.PI * 2 - angleDiff : angleDiff;

        if (now - this.lastShot > this.shotCooldown &&
            distanceToPlayer < this.attackRange &&
            normalizedDiff < 0.3) { // Стреляем только при прицеливании
            this.bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 35,
                this.y + Math.sin(this.angle) * 35,
                this.damage,
                this.angle,
                'enemy'
            ));
            this.lastShot = now;
        }
    }

    // Найти ближайшую точку патруля для возврата
    _findNearestPatrolPoint() {
        let minDist = Infinity;
        let nearestIndex = 0;
        for (let i = 0; i < this.patrolPoints.length; i++) {
            const p = this.patrolPoints[i];
            const d = Math.sqrt((p.x - this.x) ** 2 + (p.y - this.y) ** 2);
            if (d < minDist) {
                minDist = d;
                nearestIndex = i;
            }
        }
        this.currentPatrolIndex = nearestIndex;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // === Гусеницы (две широкие полосы по бокам) ===
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(-this.width / 2 - 2, -this.height / 2 - 4, this.width + 4, 10);
        ctx.fillRect(-this.width / 2 - 2, this.height / 2 - 6, this.width + 4, 10);

        // Насечки на гусеницах (анимированные)
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        const trackStep = 8;
        const offset = this.trackOffset % trackStep;
        for (let i = -this.width / 2 - 2 + offset; i < this.width / 2 + 2; i += trackStep) {
            ctx.beginPath();
            ctx.moveTo(i, -this.height / 2 - 4);
            ctx.lineTo(i, -this.height / 2 + 6);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(i, this.height / 2 - 6);
            ctx.lineTo(i, this.height / 2 + 4);
            ctx.stroke();
        }

        // === Корпус — шестиугольная бронеплита ===
        ctx.fillStyle = '#4a0e0e';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 8, -this.height / 2 + 2);
        ctx.lineTo(this.width / 2 - 4, -this.height / 2 + 2);
        ctx.lineTo(this.width / 2 + 4, 0);
        ctx.lineTo(this.width / 2 - 4, this.height / 2 - 2);
        ctx.lineTo(-this.width / 2 + 8, this.height / 2 - 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#7a1a1a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // === Броневые пластины на корпусе ===
        ctx.strokeStyle = '#5c1515';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, -this.height / 2 + 4);
        ctx.lineTo(-10, this.height / 2 - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -this.height / 2 + 4);
        ctx.lineTo(8, this.height / 2 - 4);
        ctx.stroke();

        // === Башня — большой восьмиугольник ===
        const turretSize = 16;
        ctx.fillStyle = '#6b1a1a';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 / 8) * i - Math.PI / 8;
            const px = Math.cos(a) * turretSize;
            const py = Math.sin(a) * turretSize;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8b2a2a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Люк на башне
        ctx.fillStyle = '#551111';
        ctx.beginPath();
        ctx.arc(-3, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a1a1a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // === Дуло — толстое двуствольное орудие ===
        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(turretSize - 2, -5, 28, 4);
        ctx.fillRect(turretSize - 2, 1, 28, 4);

        ctx.fillStyle = '#2a0505';
        ctx.fillRect(turretSize + 22, -7, 6, 14);

        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(turretSize + 10, -2, 4, 4);

        // === Антенна на башне ===
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(-18, -20);
        ctx.stroke();
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(-18, -20, 2, 0, Math.PI * 2);
        ctx.fill();

        // === Выхлопные трубы сзади ===
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.width / 2 - 6, -8, 8, 5);
        ctx.fillRect(-this.width / 2 - 6, 3, 8, 5);

        ctx.restore();

        // === Полоска здоровья ===
        const healthBarWidth = 55;
        const healthBarHeight = 7;
        const healthPercentage = this.health / this.maxHealth;
        const barX = this.x - healthBarWidth / 2;
        const barY = this.y - this.height / 2 - 18;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, healthBarWidth + 2, healthBarHeight + 2);

        ctx.fillStyle = '#4a0000';
        ctx.fillRect(barX, barY, healthBarWidth, healthBarHeight);

        if (healthPercentage > 0.5) {
            ctx.fillStyle = '#e67e22';
        } else if (healthPercentage > 0.25) {
            ctx.fillStyle = '#e74c3c';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        ctx.fillRect(barX, barY, healthBarWidth * healthPercentage, healthBarHeight);

        // Иконка звезды рядом с HP баром
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('★', this.x, barY - 2);

        // === Индикатор состояния (для отладки, можно убрать) ===
        
        ctx.fillStyle = this.state === 'patrol' ? '#00ff00' : '#ff0000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.state.toUpperCase(), this.x, barY - 12);
        

        // === Отрисовка точек патруля (для отладки, можно убрать) ===
        
        if (this.state === 'patrol') {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            for (let i = 0; i < this.patrolPoints.length; i++) {
                const p = this.patrolPoints[i];
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
                if (i === this.currentPatrolIndex) {
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
        
    }

    takeDamage(damage) {
        this.health -= damage;
        // Если танк получает урон во время патруля — сразу переключаемся в атаку
        if (this.state === 'patrol') {
            this.state = 'attack';
            this.isWaiting = false;
            this.patrolWaitTime = 0;
        }
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }

    takeDamageBySkill(damage) {
        this.takeDamage(damage);
    }
}