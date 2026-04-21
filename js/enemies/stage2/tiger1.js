// Класс для тяжёлого вражеского танка
class Tiger1 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 45;
        this.speed = 50; // Медленнее обычного
        this.health = 250;
        this.maxHealth = 250;
        this.damage = 50; // Больше урона
        this.angle = Math.random() * Math.PI * 2;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 1000; // Стреляет реже
        this.active = true;
        this.attackRange = 300;
        this.trackOffset = 0; // Для анимации гусениц
    }

    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Анимация гусениц
        if (distance > this.attackRange) {
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
            this.trackOffset += this.speed * deltaTime;
        }

        // Стрельба
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown && distance < 350) {
            this.bullets.push(new Bullet(
                this.x + Math.cos(this.angle) * 35,
                this.y + Math.sin(this.angle) * 35,
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
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // === Гусеницы (две широкие полосы по бокам) ===
        ctx.fillStyle = '#2c2c2c';
        // Верхняя гусеница
        ctx.fillRect(-this.width / 2 - 2, -this.height / 2 - 4, this.width + 4, 10);
        // Нижняя гусеница
        ctx.fillRect(-this.width / 2 - 2, this.height / 2 - 6, this.width + 4, 10);

        // Насечки на гусеницах (анимированные)
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        const trackStep = 8;
        const offset = this.trackOffset % trackStep;
        for (let i = -this.width / 2 - 2 + offset; i < this.width / 2 + 2; i += trackStep) {
            // Верхняя гусеница
            ctx.beginPath();
            ctx.moveTo(i, -this.height / 2 - 4);
            ctx.lineTo(i, -this.height / 2 + 6);
            ctx.stroke();
            // Нижняя гусеница
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

        // Обводка корпуса
        ctx.strokeStyle = '#7a1a1a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // === Броневые пластины на корпусе (декоративные линии) ===
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
        // Верхний ствол
        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(turretSize - 2, -5, 28, 4);
        // Нижний ствол
        ctx.fillRect(turretSize - 2, 1, 28, 4);

        // Дульный тормоз (утолщение на конце)
        ctx.fillStyle = '#2a0505';
        ctx.fillRect(turretSize + 22, -7, 6, 14);

        // Соединительная планка между стволами
        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(turretSize + 10, -2, 4, 4);

        // === Антенна на башне ===
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(-18, -20);
        ctx.stroke();
        // Шарик на антенне
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(-18, -20, 2, 0, Math.PI * 2);
        ctx.fill();

        // === Выхлопные трубы сзади ===
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.width / 2 - 6, -8, 8, 5);
        ctx.fillRect(-this.width / 2 - 6, 3, 8, 5);

        ctx.restore();

        // === Полоска здоровья (шире, с рамкой) ===
        const healthBarWidth = 55;
        const healthBarHeight = 7;
        const healthPercentage = this.health / this.maxHealth;
        const barX = this.x - healthBarWidth / 2;
        const barY = this.y - this.height / 2 - 18;

        // Рамка
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, healthBarWidth + 2, healthBarHeight + 2);

        // Фон
        ctx.fillStyle = '#4a0000';
        ctx.fillRect(barX, barY, healthBarWidth, healthBarHeight);

        // Здоровье (цвет меняется)
        if (healthPercentage > 0.5) {
            ctx.fillStyle = '#e67e22'; // Оранжевый
        } else if (healthPercentage > 0.25) {
            ctx.fillStyle = '#e74c3c'; // Красный
        } else {
            ctx.fillStyle = '#ff0000'; // Ярко-красный
        }
        ctx.fillRect(barX, barY, healthBarWidth * healthPercentage, healthBarHeight);

        // Иконка черепа/звезды рядом с HP баром
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('★', this.x, barY - 2);
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }
}