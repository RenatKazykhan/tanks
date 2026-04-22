// Класс для танка-минера
class MinerTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 45;
        this.height = 35;
        this.speed = 60; // Медленнее обычного
        this.health = 75;
        this.maxHealth = 75;
        this.damage = 10;
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 3000;
        this.active = true;

        // Мины
        this.mines = [];
        this.maxMines = 3;
        this.lastMinePlace = 0;
        this.minePlaceCooldown = 3000;
        this.mineDetectionRadius = 80;
        this.mineExplosionRadius = 100;
        this.mineDamage = 40;
    }

    // для способностей
    takeDamageBySkill(damage) {
        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }

    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        // AI - держится на средней дистанции
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.angle = Math.atan2(dy, dx);

        // Движение - держится на расстоянии
        if (distance > 500) {
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        } else if (distance < 450) {
            this.x -= Math.cos(this.angle) * this.speed * deltaTime;
            this.y -= Math.sin(this.angle) * this.speed * deltaTime;
        }

        // Установка мин
        const now = Date.now();
        if (this.mines.length < this.maxMines && now - this.lastMinePlace > this.minePlaceCooldown && distance < 250) {
            this.placeMine();
            this.lastMinePlace = now;
        }

        // Стрельба
        if (now - this.lastShot > this.shotCooldown && distance < 500) {
            this.bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25,
                this.damage,
                this.angle,
                'enemy'
            ));
            this.lastShot = now;
        }

        // Обновление мин
        this.mines = this.mines.filter(mine => {
            // Проверка активации мины
            if (mine.armed && !mine.triggered) {
                const mdx = playerX - mine.x;
                const mdy = playerY - mine.y;
                const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);

                if (mDistance < this.mineDetectionRadius) {
                    mine.triggered = true;
                    mine.triggerTime = now;
                }
            }

            // Анимация мины
            if (!mine.armed && now - mine.placedTime > 1000) {
                mine.armed = true;
            }

            // Взрыв мины
            if (mine.triggered && now - mine.triggerTime > 500) {
                this.explodeMine(mine, playerX, playerY);
                return false;
            }

            // Пульсация для активной мины
            if (mine.armed && !mine.triggered) {
                mine.pulse = Math.sin(now * 0.005) * 0.2 + 0.8;
            }

            return mine.active;
        });

        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
    }

    placeMine() {
        // Размещаем мину позади танка
        const mineX = this.x - Math.cos(this.angle) * 40;
        const mineY = this.y - Math.sin(this.angle) * 40;

        this.mines.push({
            x: mineX,
            y: mineY,
            armed: false,
            triggered: false,
            active: true,
            placedTime: Date.now(),
            triggerTime: 0,
            pulse: 1,
            particles: []
        });
    }

    explodeMine(mine, playerX, playerY) {
        // Проверяем урон по игроку
        const dx = playerX - mine.x;
        const dy = playerY - mine.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mineExplosionRadius) {
            const damageMultiplier = 1 - (distance / this.mineExplosionRadius);
            player.takeDamage(this.mineDamage * damageMultiplier);
        }

        // Создаем частицы взрыва
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const speed = Math.random() * 300 + 100;
            mine.particles.push({
                x: mine.x,
                y: mine.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                size: Math.random() * 5 + 3
            });
        }

        mine.active = false;
    }

    draw() {
        // Рисуем мины
        this.mines.forEach(mine => {
            if (mine.active) {
                // Тень мины
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(mine.x + 2, mine.y + 2, 12, 0, Math.PI * 2);
                ctx.fill();

                // Корпус мины
                if (mine.triggered) {
                    // Мигание при активации
                    ctx.fillStyle = Date.now() % 200 < 100 ? '#e74c3c' : '#f39c12';
                } else if (mine.armed) {
                    ctx.fillStyle = '#e74c3c';
                } else {
                    ctx.fillStyle = '#95a5a6';
                }

                ctx.beginPath();
                ctx.arc(mine.x, mine.y, 10 * (mine.pulse || 1), 0, Math.PI * 2);
                ctx.fill();

                // Индикаторы на мине
                ctx.fillStyle = mine.armed ? '#fff' : '#7f8c8d';
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    const x = mine.x + Math.cos(angle) * 6;
                    const y = mine.y + Math.sin(angle) * 6;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Радиус обнаружения (только для активных мин)
                if (mine.armed && !mine.triggered) {
                    ctx.strokeStyle = 'rgba(231, 76, 60, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(mine.x, mine.y, this.mineDetectionRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Частицы взрыва
            mine.particles?.forEach(particle => {
                ctx.fillStyle = `rgba(255, ${Math.random() * 100 + 100}, 0, ${particle.life * 2})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                particle.x += particle.vx * 0.016;
                particle.y += particle.vy * 0.016;
                particle.life -= 0.016;
                particle.vx *= 0.98;
                particle.vy *= 0.98;
            });
        });

        // Корпус танка - прямоугольный с закругленными углами
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 2, -this.height / 2 + 2, this.width, this.height, 5);
        ctx.fill();

        // Основной корпус
        const gradient = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0);
        gradient.addColorStop(0, '#34495e');
        gradient.addColorStop(0.5, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
        ctx.fill();

        // Полосы на корпусе
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(-this.width / 2, -2, this.width, 4);

        // Башня - восьмиугольник
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const radius = 15;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Дуло
        ctx.fillStyle = '#1a252f';
        ctx.fillRect(15, -3, 20, 6);

        // Контейнер для мин сзади
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-this.width / 2 - 5, -8, 10, 16);

        // Индикатор количества мин
        for (let i = 0; i < this.maxMines; i++) {
            ctx.fillStyle = i < this.mines.length ? '#e74c3c' : '#34495e';
            ctx.beginPath();
            ctx.arc(-this.width / 2, -5 + i * 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Полоска здоровья
        const healthBarWidth = 50;
        const healthBarHeight = 6;
        const healthPercentage = this.health / this.maxHealth;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - healthBarWidth / 2 - 1, this.y - this.height / 2 - 13, healthBarWidth + 2, healthBarHeight + 2);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 12, healthBarWidth, healthBarHeight);

        ctx.fillStyle = '#f39c12';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 12, healthBarWidth * healthPercentage, healthBarHeight);

        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
    }

    takeDamage(damage) {
        if (this.health - damage <= 0) {
            this.active = false;
            // При смерти взрываем все мины
            this.mines.forEach(mine => {
                if (mine.active && mine.armed) {
                    mine.triggered = true;
                    mine.triggerTime = Date.now() - 500;
                }
            });
        }

        this.health -= damage;
    }
}