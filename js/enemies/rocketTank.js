// Класс для танка-ракетоносца
class RocketTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 50; // Медленнее обычного танка
        this.health = 150;
        this.maxHealth = 150;
        this.damage = 50; // Больше урона
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 3500; // Стреляет реже
        this.active = true;
        this.attackRange = 500; // Дальность атаки
        this.keepDistance = 350; // Держится на расстоянии
    }

    // для способностей
    takeDamageBySkill(damage) {
        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }

    update(playerX, playerY, deltaTime, playerBullets = []) {
        // AI - держится на расстоянии и стреляет
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Поворот к игроку
        this.angle = Math.atan2(dy, dx);

        // Движение - держится на оптимальной дистанции
        if (distance > this.keepDistance + 50) {
            // Приближается если слишком далеко
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        } else if (distance < this.keepDistance - 50) {
            // Отступает если слишком близко
            this.x -= Math.cos(this.angle) * this.speed * deltaTime;
            this.y -= Math.sin(this.angle) * this.speed * deltaTime;
        }

        // Стрельба ракетами
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown && distance < this.attackRange) {
            this.bullets.push(new Rocket(
                this.x + Math.cos(this.angle) * 30,
                this.y + Math.sin(this.angle) * 30,
                this.damage,
                this.angle,
                playerX,
                playerY,
                'enemy'
            ));
            this.lastShot = now;
        }

        // Обновление ракет
        this.bullets = this.bullets.filter(rocket => {
            rocket.update(playerX, playerY, deltaTime);
            return rocket.active;
        });
    }

    draw() {
        // Корпус
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Основной корпус
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Башня с ракетной установкой
        ctx.fillStyle = '#663399';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Ракетные пусковые установки
        ctx.fillStyle = '#4a235a';
        ctx.fillRect(10, -8, 25, 5);
        ctx.fillRect(10, 3, 25, 5);

        // Индикатор перезарядки
        const reloadProgress = Math.min((Date.now() - this.lastShot) / this.shotCooldown, 1);
        if (reloadProgress < 1) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * reloadProgress));
            ctx.stroke();
        }

        ctx.restore();

        // Полоска здоровья
        const healthBarWidth = 45;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.maxHealth;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 15, healthBarWidth, healthBarHeight);

        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.height / 2 - 15, healthBarWidth * healthPercentage, healthBarHeight);

        // Рисуем ракеты
        //this.bullets.forEach(rocket => rocket.draw());
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            score += 50; // Больше очков за уничтожение
        }
    }
}

