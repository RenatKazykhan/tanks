class MachineGunTank extends EnemyTank {
    constructor(x, y) {
        super(x, y);
        this.health = 40;
        this.maxHealth = 40;
        this.damage = 8;
        this.speed = 250;
        this.width = 35;
        this.height = 35;
        
        // Параметры стрельбы очередями
        this.burstSize = 5; // Количество пуль в очереди
        this.burstCount = 0; // Текущее количество выстрелов в очереди
        this.burstCooldown = 100; // Задержка между выстрелами в очереди
        this.burstTimer = 0;
        this.reloadTime = 2000; // Время перезарядки после очереди
        this.lastReloadStart = 0; // Время начала перезарядки
        
        // Состояния танка
        this.isBursting = false; // Ведет ли огонь очередью
        this.isReloading = false; // Перезаряжается ли
        this.retreating = false; // Отступает ли
        
        // Параметры отступления
        this.retreatDistance = 150;
        this.originalSpeed = this.speed;
        this.retreatSpeed = 3.5;
        
        this.fireRange = 300; // Дальность стрельбы
        this.detectRange = 250; // Дальность обнаружения игрока
        
        // Для предсказания движения игрока
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        this.playerVelX = 0;
        this.playerVelY = 0;
    }
    
    update(playerX, playerY, deltaTime, playerBullets) {
        if (!this.active) return;
        
        // Вычисляем скорость игрока для предсказания
        this.playerVelX = playerX - this.lastPlayerX;
        this.playerVelY = playerY - this.lastPlayerY;
        this.lastPlayerX = playerX;
        this.lastPlayerY = playerY;
        
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Направление к игроку
        const dirToPlayerX = dx / distanceToPlayer;
        const dirToPlayerY = dy / distanceToPlayer;
        
        // Поворот корпуса к игроку
        this.angle = Math.atan2(dy, dx);
        
        // Логика поведения
        if (this.isReloading) {
            this.handleReloading(dirToPlayerX, dirToPlayerY, distanceToPlayer);
        } else if (this.isBursting) {
            this.handleBursting(playerX, playerY);
        } else if (distanceToPlayer <= this.detectRange) {
            this.handleCombat(playerX, playerY, distanceToPlayer, dirToPlayerX, dirToPlayerY);
        } else {
            // Патрулирование или поиск игрока
            this.handlePatrol(dirToPlayerX, dirToPlayerY);
        }
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.active;
        });
        
        // Обновление таймеров
        this.updateTimers();
    }
    
    handleCombat(playerX, playerY, distance, dirToPlayerX, dirToPlayerY) {
        if (distance <= this.fireRange && !this.isBursting) {
            // Начинаем стрельбу очередью
            this.startBurst();
        } else if (distance > this.fireRange) {
            // Приближаемся к игроку
            this.x += dirToPlayerX * this.speed * deltaTime;
            this.y += dirToPlayerY * this.speed * deltaTime;
        }
    }
    
    handleBursting(playerX, playerY) {
        // Во время стрельбы танк остается на месте или медленно движется
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Медленное движение для корректировки позиции
        if (distance > this.fireRange * 0.8) {
            this.x += (dx / distance) * this.speed * deltaTime * 0.3;
            this.y += (dy / distance) * this.speed * deltaTime * 0.3;
        }
        
        // Стрельба очередью
        if (this.burstTimer <= 0 && this.burstCount < this.burstSize) {
            this.shootBurst(playerX, playerY);
            this.burstTimer = this.burstCooldown;
            this.burstCount++;
            
            if (this.burstCount >= this.burstSize) {
                // Очередь закончена, начинаем перезарядку
                this.isBursting = false;
                this.isReloading = true;
                this.retreating = true;
                this.lastReloadStart = Date.now();
                this.burstCount = 0;
                this.speed = this.retreatSpeed;
            }
        }
    }
    
    handleReloading(dirToPlayerX, dirToPlayerY, distance) {
        if (this.retreating) {
            // Отступаем от игрока
            this.x -= dirToPlayerX * this.speed * deltaTime;
            this.y -= dirToPlayerY * this.speed * deltaTime;
            
            // Прекращаем отступление, если достигли безопасного расстояния
            if (distance >= this.retreatDistance) {
                this.retreating = false;
                this.speed = this.originalSpeed;
            }
        } else {
            // Во время перезарядки занимаем оборонительную позицию
            // Можем немного маневрировать
            const maneuverAngle = this.angle + Math.PI/2;
            this.x += Math.cos(maneuverAngle) * this.speed * deltaTime * 0.5 * (Math.random() - 0.5);
            this.y += Math.sin(maneuverAngle) * this.speed * deltaTime * 0.5 * (Math.random() - 0.5);
        }
        
        // Проверяем окончание перезарядки
        if (Date.now() - this.lastReloadStart > this.reloadTime) {
            this.isReloading = false;
            this.retreating = false;
            this.speed = this.originalSpeed;
        }
    }
    
    handlePatrol(dirToPlayerX, dirToPlayerY) {
        // Медленное движение в направлении игрока
        this.x += dirToPlayerX * this.speed * deltaTime * 0.5;
        this.y += dirToPlayerY * this.speed * deltaTime * 0.5;
    }
    
    startBurst() {
        this.isBursting = true;
        this.burstCount = 0;
        this.burstTimer = 0;
    }
    
    shootBurst(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const targetAngle = Math.atan2(dy, dx);
        this.angle = targetAngle;
                  
        // Создаем пулю с позиции дула танка
        const muzzleX = this.x + Math.cos(this.angle) * (this.width/2);
        const muzzleY = this.y + Math.sin(this.angle) * (this.height/2);
        
        this.bullets.push(new Bullet(muzzleX, muzzleY, this.damage, targetAngle, 'enemy'));
    }
    
    updateTimers() {
        if (this.burstTimer > 0) {
            this.burstTimer -= 16; // Примерно 60 FPS
        }
    }
    
    draw() {
        ctx.save();
        
        // Рисуем танк
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Корпус танка (темно-зеленый основной цвет)
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Полосы камуфляжа
        ctx.fillStyle = '#1a3009';
        ctx.fillRect(-this.width/2, -this.height/3, this.width, this.height/6);
        ctx.fillRect(-this.width/2, this.height/6, this.width, this.height/6);
        
        // Башня танка
        ctx.fillStyle = '#1e3a0f';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Дуло пулемета (длиннее и тоньше)
        ctx.fillStyle = '#0d1a06';
        ctx.fillRect(this.width/2 - 2, -2, 28, 4);
        
        // Дульный тормоз
        ctx.fillStyle = '#000';
        ctx.fillRect(this.width/2 + 22, -3, 4, 6);
        
        // Прицел
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Индикатор перезарядки (как в ракетном танке)
        if (this.isReloading) {
            const reloadProgress = Math.min((Date.now() - this.lastReloadStart) / this.reloadTime, 1);
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 18, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * reloadProgress));
            ctx.stroke();
        }
        
        // Индикатор очереди
        if (this.isBursting) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const burstProgress = this.burstCount / this.burstSize;
            ctx.arc(0, 0, 15, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * burstProgress));
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Полоска здоровья
        this.drawHealthBar();
        
        // Рисуем пули
        //this.bullets.forEach(bullet => bullet.draw());
    }
    
    drawHealthBar() {
        const barWidth = this.width + 5;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        // Фон полоски здоровья
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 15, barWidth, barHeight);
        
        // Полоска здоровья
        ctx.fillStyle = healthPercent > 0.6 ? '#4CAF50' : healthPercent > 0.3 ? '#FFA500' : '#ff4444';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 15, barWidth * healthPercent, barHeight);
        
        // Рамка полоски здоровья
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, this.y - this.height/2 - 15, barWidth, barHeight);
    }
}