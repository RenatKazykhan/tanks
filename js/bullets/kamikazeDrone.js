// Класс для дрона-камикадзе
class KamikazeDrone {
    constructor(x, y, damage, owner) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = 250; // пикселей в секунду
        this.radius = 8;
        this.active = true;
        this.owner = owner; // 'player' или 'enemy'
        this.trail = [];
        this.maxTrailLength = 15;
        this.lifetime = 5000; // 5 секунд жизни
        this.createdAt = Date.now();
        this.targetX = null;
        this.targetY = null;
        this.angle = 0;
        this.explosionRadius = 60;
    }
    
    update(enemies, player, deltaTime) {
        // Проверка времени жизни
        if (Date.now() - this.createdAt > this.lifetime) {
            this.explode(enemies, player);
            return;
        }
        
        // Поиск ближайшей цели
        this.findNearestTarget(enemies, player);
        
        if (this.targetX !== null && this.targetY !== null) {
            // Вычисляем угол к цели
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // Плавный поворот к цели
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            this.angle = targetAngle;
            
            // Движение к цели
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
            
            // След от дрона
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
            
            // Проверка столкновения с целью
            const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
            if (distanceToTarget < this.radius + 20) { // 20 - примерный радиус цели
                this.explode(enemies, player);
            }
        }
        
        // Проверка выхода за границы
        if (this.x < -50 || this.x > WORLD_WIDTH + 50 || 
            this.y < -50 || this.y > WORLD_HEIGHT + 50) {
            this.active = false;
        }
    }
    
    findNearestTarget(enemies, player) {
        let nearestDistance = Infinity;
        let nearestX = null;
        let nearestY = null;
        
        if (this.owner === 'player') {
            // Ищем ближайшего врага
            enemies.forEach(enemy => {
                if (enemy.active) {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestX = enemy.x;
                        nearestY = enemy.y;
                    }
                }
            });
        } else {
            // Ищем игрока
            nearestX = player.x;
            nearestY = player.y;
        }
        
        this.targetX = nearestX;
        this.targetY = nearestY;
    }
    
    explode(enemies, player) {
        this.active = false;
        
        // Создаем взрыв
        createExplosion(this.x, this.y, this.explosionRadius);
        
        // Наносим урон по области
        if (this.owner === 'player') {
            enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.explosionRadius) {
                    enemy.takeDamage(this.damage);
                    if (!enemy.active) {
                        enemyDead(enemy.x, enemy.y); // создает взрывы
                    }
                }
            });
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                player.takeDamage(this.damage, this.x, this.y);
            }
        }
    }
    
    draw() {
        // Рисуем след
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.trail.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        
        // Рисуем дрон
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Корпус дрона
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Пропеллеры
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-4, -8, 8, 3);
        ctx.fillRect(-4, 5, 8, 3);
        
        // Светящийся центр
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Пульсирующее свечение
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 200, 0, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}
