// Класс для вражеского танка
class TeleportTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 100;
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 25;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 2000;
        this.active = true;
        this.secondLife = false;

        // Телепортация
        this.canTeleport = true;
        this.teleportCooldown = 4000;
        this.lastTeleport = 0;
        this.teleportRange = 150;
        this.teleportParticles = [];
    }

    // для способностей
    takeDamageBySkill(damage) {
        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }

    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        // Простой AI - движение к игроку
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const now = Date.now();

        // Проверка приближающихся пуль для уклонения
        if (this.canTeleport && now - this.lastTeleport > this.teleportCooldown) {
            let shouldDodge = false;
            let closestBulletDistance = Infinity;

            for (const bullet of playerBullets) {
                // Расстояние от пули до танка
                const bulletDx = bullet.x - this.x;
                const bulletDy = bullet.y - this.y;
                const bulletDistance = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);

                // Проверяем, летит ли пуля в нашу сторону
                const bulletVx = Math.cos(bullet.angle) * bullet.speed;
                const bulletVy = Math.sin(bullet.angle) * bullet.speed;

                // Скалярное произведение для определения направления
                const dotProduct = (bulletDx * bulletVx + bulletDy * bulletVy);

                // Если пуля летит в нашу сторону и достаточно близко
                if (dotProduct < 0 && bulletDistance < 150) {
                    // Прогнозируем, где будет пуля через небольшое время
                    const timeToImpact = bulletDistance / bullet.speed;
                    const futureBulletX = bullet.x + bulletVx * timeToImpact;
                    const futureBulletY = bullet.y + bulletVy * timeToImpact;

                    // Расстояние от прогнозируемой позиции пули до танка
                    const futureDx = futureBulletX - this.x;
                    const futureDy = futureBulletY - this.y;
                    const futureDistance = Math.sqrt(futureDx * futureDx + futureDy * futureDy);

                    // Если пуля пролетит слишком близко, нужно уклониться
                    if (futureDistance < 40) {
                        shouldDodge = true;
                        closestBulletDistance = Math.min(closestBulletDistance, bulletDistance);
                    }
                }
            }

            // Выполняем телепортацию для уклонения
            if (shouldDodge) {
                // Телепортируемся в случайную сторону от текущей позиции
                const dodgeAngle = Math.random() * Math.PI * 2;
                const dodgeDistance = 100 + Math.random() * 50;
                const teleportX = this.x + Math.cos(dodgeAngle) * dodgeDistance;
                const teleportY = this.y + Math.sin(dodgeAngle) * dodgeDistance;

                this.teleport(teleportX, teleportY);
                this.lastTeleport = now;
            }
            // Телепортация за спину игрока когда он близко (оригинальная логика)
            else if (distance < 200) {
                this.teleport(playerX, playerY);
                this.lastTeleport = now;
            }
        }

        if (distance > 150) {
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        }

        // Стрельба
        if (now - this.lastShot > this.shotCooldown && distance < 300) {
            this.bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25,
                this.damage,
                this.angle,
                'enemy'
            ));
            this.lastShot = now;
        }

        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });

        // Обновление частиц телепортации
        this.teleportParticles = this.teleportParticles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.alpha = particle.life / 0.5;
            return particle.life > 0;
        });
    }

    teleport(playerX, playerY) {
        // Создаем частицы в старой позиции
        for (let i = 0; i < 20; i++) {
            this.teleportParticles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5,
                alpha: 1
            });
        }

        // Телепортируемся за спину игрока
        const angleOffset = Math.PI + (Math.random() - 0.5) * Math.PI / 2;
        this.x = playerX + Math.cos(angleOffset) * this.teleportRange;
        this.y = playerY + Math.sin(angleOffset) * this.teleportRange;

        // Создаем частицы в новой позиции
        for (let i = 0; i < 20; i++) {
            this.teleportParticles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5,
                alpha: 1
            });
        }
    }

    draw() {
        // Рисуем частицы телепортации
        this.teleportParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Корпус - шестиугольник
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * (this.width / 2 + 2) + 2;
            const y = Math.sin(angle) * (this.height / 2 + 2) + 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Основной корпус
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#8e44ad');
        gradient.addColorStop(1, '#6c3483');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * this.width / 2;
            const y = Math.sin(angle) * this.height / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Обводка
        ctx.strokeStyle = '#5b2c6f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Башня - треугольник
        ctx.fillStyle = '#7d3c98';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-8, 8);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();

        // Дуло - двойное
        ctx.fillStyle = '#5b2c6f';
        ctx.fillRect(15, -6, 18, 3);
        ctx.fillRect(15, 3, 18, 3);

        // Индикатор телепортации
        if (Date.now() - this.lastTeleport < this.teleportCooldown) {
            const cooldownProgress = (Date.now() - this.lastTeleport) / this.teleportCooldown;
            ctx.strokeStyle = `rgba(155, 89, 182, ${1 - cooldownProgress})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2 * cooldownProgress);
            ctx.stroke();
        }

        ctx.restore();

        // Полоска здоровья
        const healthBarWidth = 40;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.maxHealth;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - healthBarWidth / 2 - 1, this.y - this.height / 2 - 13, healthBarWidth + 2, healthBarHeight + 2);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 12, healthBarWidth, healthBarHeight);

        ctx.fillStyle = '#27ae60';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 12, healthBarWidth * healthPercentage, healthBarHeight);

        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
    }

    takeDamage(damage) {
        if (this.health - damage <= 0) {
            this.active = false;
        }

        this.health -= damage;
    }
}