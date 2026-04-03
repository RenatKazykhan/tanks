// Класс для бонусов
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.active = true;
        this.lifetime = 10000; // 10 секунд
        this.created = Date.now();
    }
    
    update() {
        if (Date.now() - this.created > this.lifetime) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Анимация пульсации
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1;
        ctx.scale(pulse, pulse);
        
        switch(this.type) {
            case 'health':
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(-10, -3, 20, 6);
                ctx.fillRect(-3, -10, 6, 20);
                break;
            case 'shield':
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
    
    apply(player) {
        switch(this.type) {
            case 'health':
                player.health = Math.min(player.maxHealth, player.health + 50);
                updateScore();
                break;
        }
    }
}
