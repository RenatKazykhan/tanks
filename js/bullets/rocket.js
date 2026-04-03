// Класс для самонаводящейся ракеты
class Rocket {
    constructor(x, y, damage, angle, targetX, targetY, owner) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.angle = angle;
        this.speed = 3;
        this.radius = 2;
        this.maxSpeed = 6;
        this.turnSpeed = 0.05;
        this.active = true;
        this.owner = owner;
        this.trail = [];
        this.maxTrailLength = 10;
        this.lifetime = 5000; // 5 секунд жизни
        this.createdAt = Date.now();
        this.isIceBullet = false; // Флаг для льда
    }
    
    update(targetX, targetY) {
        // Проверка времени жизни
        if (Date.now() - this.createdAt > this.lifetime) {
            this.active = false;
            return;
        }
        
        // Самонаведение
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Плавный поворот к цели
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        this.angle += angleDiff * this.turnSpeed;
        
        // Ускорение
        if (this.speed < this.maxSpeed) {
            this.speed += 0.1;
        }
        
        // Движение
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // След от ракеты
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Проверка выхода за границы
        if (this.x < -50 || this.x > WORLD_WIDTH + 50 || 
            this.y < -50 || this.y > WORLD_HEIGHT + 50) {
            this.active = false;
        }
    }
    
    draw() {
        // Рисуем след
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.trail.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        
        // Рисуем ракету
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Корпус ракеты
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-8, -3, 16, 6);
        
        // Наконечник
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(12, -3);
        ctx.lineTo(12, 3);
        ctx.closePath();
        ctx.fill();
        
        // Огонь из сопла
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(-12 - Math.random() * 4, 0);
        ctx.lineTo(-8, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}