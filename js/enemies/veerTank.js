/**
 * Продвинутый вражеский танк с тактическим AI
 */
class VeerTank {
    /**
     * Создает экземпляр вражеского танка
     * @param {number} x - Начальная позиция по X
     * @param {number} y - Начальная позиция по Y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speed = 80;
        this.health = 75;
        this.maxHealth = 75;
        this.damage = 20;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 1800;
        this.active = true;

        // Новые параметры для усовершенствованного AI
        this.dodgeAngle = 0;
        this.lastDodge = 0;
        this.dodgeCooldown = 500;
        this.isBerserk = false;
        this.berserkThreshold = 0.3;
        this.strafeDirection = 1;
        this.lastStrafe = 0;
        this.strafeInterval = 2000;
        this.predictedPlayerPos = { x: 0, y: 0 };
    }

    // для способностей
    takeDamageBySkill(damage) {
        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }

    /**
     * Обновляет состояние танка
     * @param {number} playerX - Позиция игрока по X
     * @param {number} playerY - Позиция игрока по Y
     * @param {number} deltaTime - Время между кадрами
     * @param {Array} playerBullets - Массив пуль игрока
     * @param {Array} walls - Массив стен
     */
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        const now = Date.now();
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Предсказание позиции игрока для упреждения выстрела
        this.predictedPlayerPos = this.predictPlayerPosition(playerX, playerY, deltaTime);

        // Проверка на режим берсерка
        if (!this.isBerserk && this.health / this.maxHealth < this.berserkThreshold) {
            this.activateBerserk();
        }

        // Уклонение от пуль
        if (now - this.lastDodge > this.dodgeCooldown) {
            this.tryDodge(playerBullets);
            this.lastDodge = now;
        }

        // Тактическое движение
        this.tacticalMovement(playerX, playerY, distance, deltaTime, now);

        // Стрельба с учетом режима берсерка
        const effectiveCooldown = this.isBerserk ? this.shotCooldown * 0.5 : this.shotCooldown;
        if (now - this.lastShot > effectiveCooldown && distance < 350) {
            this.shoot();
            this.lastShot = now;
        }

        // Обновление пуль с учетом режима берсерка
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            if (this.isBerserk) {
                bullet.speed *= 1.2; // Ускоренные пули в режиме берсерка
            }
            return bullet.active;
        });
    }

    /**
     * Предсказывает позицию игрока для прицеливания с упреждением
     * @private
     */
    predictPlayerPosition(playerX, playerY, deltaTime) {
        // Простое предсказание скорости игрока (принимаем среднюю скорость)
        const predictedSpeed = 150;
        const timeToImpact = deltaTime * 20; // Предсказание на 20 кадров вперед

        return {
            x: playerX + (Math.random() - 0.5) * predictedSpeed * timeToImpact,
            y: playerY + (Math.random() - 0.5) * predictedSpeed * timeToImpact
        };
    }

    /**
     * Пытается уклониться от приближающихся пуль
     * @private
     */
    tryDodge(playerBullets) {
        for (let bullet of playerBullets) {
            const bulletDx = bullet.x - this.x;
            const bulletDy = bullet.y - this.y;
            const bulletDistance = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);

            if (bulletDistance < 100 && bulletDistance > 20) {
                // Перпендикулярное уклонение
                this.dodgeAngle = Math.atan2(bulletDy, bulletDx) + Math.PI / 2;
                this.x += Math.cos(this.dodgeAngle) * this.speed * 0.5;
                this.y += Math.sin(this.dodgeAngle) * this.speed * 0.5;
                return;
            }
        }
    }

    /**
     * Выполняет тактическое движение
     * @private
     */
    tacticalMovement(playerX, playerY, distance, deltaTime, now) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;

        if (this.isBerserk) {
            // Агрессивное нападение в режиме берсерка
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed * 1.5 * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * 1.5 * deltaTime;
        } else {
            // Стратегическое движение с уклонением
            const optimalDistance = 200;

            if (distance > optimalDistance + 50) {
                // Приближение к игроку
                this.angle = Math.atan2(dy, dx);
                this.x += Math.cos(this.angle) * this.speed * deltaTime;
                this.y += Math.sin(this.angle) * this.speed * deltaTime;
            } else if (distance < optimalDistance - 50) {
                // Отступление если слишком близко
                this.angle = Math.atan2(dy, dx) + Math.PI;
                this.x += Math.cos(this.angle) * this.speed * deltaTime;
                this.y += Math.sin(this.angle) * this.speed * deltaTime;
            } else {
                // Стрейфинг вокруг игрока
                if (now - this.lastStrafe > this.strafeInterval) {
                    this.strafeDirection *= -1;
                    this.lastStrafe = now;
                }

                const strafeAngle = Math.atan2(dy, dx) + (Math.PI / 2) * this.strafeDirection;
                this.x += Math.cos(strafeAngle) * this.speed * 0.3 * deltaTime;
                this.y += Math.sin(strafeAngle) * this.speed * 0.3 * deltaTime;
            }
        }
    }

    /**
     * Активирует режим берсерка
     * @private
     */
    activateBerserk() {
        this.isBerserk = true;
        this.shotCooldown = 1000;
        this.damage *= 1.5;
    }

    /**
     * Выполняет выстрел с предсказанием
     * @private
     */
    shoot() {
        const targetDx = this.predictedPlayerPos.x - this.x;
        const targetDy = this.predictedPlayerPos.y - this.y;
        const shootAngle = Math.atan2(targetDy, targetDx);

        // В режиме берсерка стреляет веером
        if (this.isBerserk) {
            for (let i = -1; i <= 1; i++) {
                const angleOffset = (i * 0.2);
                this.bullets.push(new Bullet(
                    this.x + Math.cos(shootAngle + angleOffset) * 25,
                    this.y + Math.sin(shootAngle + angleOffset) * 25,
                    this.damage,
                    shootAngle + angleOffset,
                    'enemy'
                ));
            }
        } else {
            this.bullets.push(new Bullet(
                this.x + Math.cos(shootAngle) * 25,
                this.y + Math.sin(shootAngle) * 25,
                this.damage,
                shootAngle,
                'enemy'
            ));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Эффект пульсации в режиме берсерка
        if (this.isBerserk) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 1;
            ctx.scale(pulse, pulse);

            // Красное свечение в режиме берсерка
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 20;
        }

        // Основной корпус с градиентом
        const gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
        if (this.isBerserk) {
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#c92a2a');
        } else {
            gradient.addColorStop(0, '#868e96');
            gradient.addColorStop(1, '#495057');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Броневые пластины
        ctx.fillStyle = this.isBerserk ? '#a61e1e' : '#343a40';
        ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 2, 8, this.height - 4);
        ctx.fillRect(this.width / 2 - 10, -this.height / 2 + 2, 8, this.height - 4);

        // 武器 (оружие)
        ctx.fillStyle = this.isBerserk ? '#ff8787' : '#212529';
        ctx.fillRect(12, -3, 25, 6);

        // Дуло с эффектом нагрева
        if (this.isBerserk) {
            const heatGradient = ctx.createLinearGradient(12, -3, 37, -3);
            heatGradient.addColorStop(0, '#ffa8a8');
            heatGradient.addColorStop(1, '#ff6b6b');
            ctx.fillStyle = heatGradient;
            ctx.fillRect(12, -3, 25, 6);
        }

        // Башня с детализацией
        ctx.fillStyle = this.isBerserk ? '#e03131' : '#495057';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Внутренняя часть башни
        ctx.fillStyle = this.isBerserk ? '#c92a2a' : '#343a40';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Полоска здоровья с улучшенным дизайном
        const healthBarWidth = 45;
        const healthBarHeight = 6;
        const healthPercentage = Math.max(0, this.health / this.maxHealth);

        // Фон полоски здоровья
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - healthBarWidth / 2 - 1, this.y - this.height / 2 - 15, healthBarWidth + 2, healthBarHeight + 2);

        // Красная основа
        ctx.fillStyle = '#4c4c4c';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 14, healthBarWidth, healthBarHeight);

        // Зеленая полоска здоровья
        const healthColor = healthPercentage > 0.5 ? '#51cf66' :
            healthPercentage > 0.25 ? '#ffd43b' : '#ff6b6b';
        ctx.fillStyle = healthColor;
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 14, healthBarWidth * healthPercentage, healthBarHeight);

        // Индикатор режима берсерка
        if (this.isBerserk) {
            ctx.save();
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 5;
            ctx.fillText('BERSERK', this.x, this.y - this.height / 2 - 20);
            ctx.restore();
        }
    }

    takeDamage(damage) {
        if (this.health - damage <= 0) {
            this.active = false;
            return;
        }

        this.health -= damage;
    }
}