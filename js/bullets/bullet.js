// Класс для пули
class Bullet {
    constructor(x, y, damage, angle, owner, speed = 600) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = 4;
        this.damage = damage;
        this.owner = owner;
        this.active = true;
        this.isIceBullet = false;
    }
    
    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
        
        // Деактивация пули за пределами экрана
        if (this.x < 0 || this.x > WORLD_WIDTH || this.y < 0 || this.y > WORLD_HEIGHT) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.fillStyle = this.owner === 'player' ? '#f34312ff' : '#e67e22';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
