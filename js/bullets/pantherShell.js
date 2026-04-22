class PantherShell {
    constructor(x, y, damage, angle, owner, speed = 1000) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = 4;
        this.damage = damage;
        this.owner = owner;
        this.active = true;
        this.isIceBullet = false;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.trail = [];
    }
    
    update(deltaTime) {
        // Оставляем трассерный дымный след
        this.trail.unshift({x: this.x, y: this.y, life: 0.15, maxLife: 0.15});
        if (this.trail.length > 8) this.trail.pop();
        
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= deltaTime;
            if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        if (this.x < 0 || this.x > WORLD_WIDTH || this.y < 0 || this.y > WORLD_HEIGHT) {
            this.active = false;
        }
    }
    
    draw() {
        // Отрисовка трассерного следа
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)'; // Серый дым
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.lineCap = 'butt';
        }

        // Рисовка самого бронебойного снаряда (PzGr 39)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Красный трассирующий огонек сзади снаряда
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff2200';
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-6, -1.5, 3, 3);
        ctx.shadowBlur = 0; // отключаем тень

        // Тело снаряда (тёмно-серая сталь)
        ctx.fillStyle = '#333333'; 
        ctx.fillRect(-4, -2.5, 7, 5);
        
        // Медный ведущий поясок
        ctx.fillStyle = '#b87333';
        ctx.fillRect(-1, -3, 2, 6);
        
        // Баллистический наконечник (светло-серая сталь)
        ctx.fillStyle = '#999999';
        ctx.beginPath();
        ctx.moveTo(3, -2.5);
        ctx.lineTo(8, 0); // Острие
        ctx.lineTo(3, 2.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}
