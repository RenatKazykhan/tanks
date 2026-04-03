// Класс для ледяной пули
class IceBullet extends Bullet {
    constructor(x, y, damage, angle, owner) {
        super(x, y, damage, angle, owner);
        this.slowEffect = 0.5; // Замедление на 50%
        this.slowDuration = 2000; // Длительность замедления в миллисекундах
        this.iceTrail = [];
        this.isIceBullet = true;
    }
    
    update(deltaTime) {
        // Сохраняем предыдущую позицию для следа
        this.iceTrail.push({ x: this.x, y: this.y, life: 1 });
        
        // Обновляем след
        this.iceTrail = this.iceTrail.filter(trail => {
            trail.life -= deltaTime * 3;
            return trail.life > 0;
        });
        
        super.update(deltaTime);
    }
    
    draw() {
        // Рисуем ледяной след
        this.iceTrail.forEach(trail => {
            ctx.save();
            ctx.globalAlpha = trail.life * 0.5;
            ctx.fillStyle = '#B3E5FC';
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Рисуем ледяную пулю
        ctx.save();
        
        // Свечение
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#64B5F6';
        
        // Градиент для пули
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#E3F2FD');
        gradient.addColorStop(0.7, '#81D4FA');
        gradient.addColorStop(1, '#29B6F6');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Блик
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 1, this.y - 1, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Метод для применения эффекта замедления к игроку
    applySlowEffect() {
        player.applySlowEffect(this.slowEffect, this.slowDuration);
    }
}