// Класс для пули
class Bullet2 {
    constructor(x, y, damage, angle, owner, speed = 600) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = 5;
        this.damage = damage;
        this.owner = owner;
        this.active = true;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Визуальные эффекты
        this.trail = [];
        this.maxTrailLength = 8;
        this.glowIntensity = 1;
        this.rotationSpeed = 15;
        this.currentRotation = 0;
        
        // Цвета в зависимости от владельца
        if (this.owner === 'player') {
            this.coreColor = '#ffeb3b';
            this.glowColor = '#ff9800';
            this.trailColor = '#ff5722';
        } else {
            this.coreColor = '#ff1744';
            this.glowColor = '#d50000';
            this.trailColor = '#b71c1c';
        }
        
        // Искры при выстреле
        this.sparks = [];
        this.createSparks();
    }
    
    createSparks() {
        for (let i = 0; i < 5; i++) {
            const sparkAngle = this.angle + (Math.random() - 0.5) * 0.5;
            const sparkSpeed = 100 + Math.random() * 100;
            this.sparks.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(sparkAngle) * sparkSpeed,
                vy: Math.sin(sparkAngle) * sparkSpeed,
                life: 1,
                size: 2 + Math.random() * 2
            });
        }
    }
    
    update(deltaTime) {
        // Сохранение предыдущей позиции для следа
        this.trail.push({ x: this.x, y: this.y, life: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Обновление позиции
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
        
        // Вращение
        this.currentRotation += this.rotationSpeed * deltaTime;
        
        // Пульсация свечения
        this.glowIntensity = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        
        // Обновление следа
        this.trail.forEach(point => {
            point.life -= deltaTime * 3;
        });
        this.trail = this.trail.filter(point => point.life > 0);
        
        // Обновление искр
        this.sparks = this.sparks.filter(spark => {
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.vx *= 0.95;
            spark.vy *= 0.95;
            spark.life -= deltaTime * 2;
            return spark.life > 0;
        });
        
        // Деактивация пули за пределами экрана
        if (this.x < -50 || this.x > WORLD_WIDTH + 50 || 
            this.y < -50 || this.y > WORLD_HEIGHT + 50) {
            this.active = false;
        }
    }
    
    draw() {
        // Рисуем искры
        this.sparks.forEach(spark => {
            ctx.save();
            ctx.globalAlpha = spark.life;
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Рисуем след
        this.trail.forEach((point, index) => {
            ctx.save();
            ctx.globalAlpha = point.life * 0.6;
            
            const trailRadius = this.radius * 0.8 * (index / this.trail.length);
            
            // Градиент для следа
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, trailRadius * 2
            );
            gradient.addColorStop(0, this.trailColor);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, trailRadius * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Внешнее свечение
        ctx.save();
        ctx.shadowBlur = 20 * this.glowIntensity;
        ctx.shadowColor = this.glowColor;
        
        // Основное тело пули
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Внутреннее ядро
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.coreColor;
        ctx.fillStyle = this.coreColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Центральная точка
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Вращающиеся частицы вокруг пули
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.currentRotation);
        
        for (let i = 0; i < 3; i++) {
            const particleAngle = (Math.PI * 2 / 3) * i;
            const particleX = Math.cos(particleAngle) * this.radius * 2;
            const particleY = Math.sin(particleAngle) * this.radius * 2;
            
            ctx.globalAlpha = 0.6 * this.glowIntensity;
            ctx.fillStyle = this.coreColor;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Метод для создания эффекта взрыва при попадании
    createImpactEffect() {
        const particles = [];
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.5;
            const speed = 150 + Math.random() * 100;
            particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 3 + Math.random() * 3,
                color: this.glowColor
            });
        }
        return particles;
    }
}