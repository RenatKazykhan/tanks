// Класс для ядовитой пули с улучшенным следом
class PoisonBullet extends Bullet {
    constructor(x, y, damage, angle, owner, speed = 400) {
        super(x, y, damage, angle, owner, speed);
        
        // Свойства яда
        this.isPoisonous = true;
        this.poisonDamage = 5;
        this.poisonDuration = 3000;
        this.poisonTickRate = 500;
        
        // Визуальные эффекты
        this.radius = 5;
        this.trail = []; // История позиций для следа
        this.maxTrailLength = 20;
        this.trailParticles = [];
        this.particleLifetime = 1000;
        this.lastParticleSpawn = Date.now();
    }
    
    update(deltaTime) {
        // Сохраняем предыдущую позицию для следа
        this.trail.push({ x: this.x, y: this.y, time: Date.now() });
        
        // Обновляем позицию
        super.update(deltaTime);
        
        // Ограничиваем длину следа
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Создаем частицы следа
        const now = Date.now();
        if (now - this.lastParticleSpawn > 20) { // Каждые 20мс
            // Основные частицы
            for (let i = 0; i < 2; i++) {
                this.trailParticles.push({
                    x: this.x + (Math.random() - 0.5) * 6,
                    y: this.y + (Math.random() - 0.5) * 6,
                    vx: (Math.random() - 0.5) * 30,
                    vy: (Math.random() - 0.5) * 30,
                    size: Math.random() * 4 + 2,
                    alpha: 0.8,
                    color: Math.random() > 0.5 ? '#4caf50' : '#66bb6a',
                    createdAt: now
                });
            }
            
            // Дополнительные мелкие частицы
            if (Math.random() < 0.7) {
                this.trailParticles.push({
                    x: this.x,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    size: Math.random() * 2 + 1,
                    alpha: 0.6,
                    color: '#81c784',
                    createdAt: now
                });
            }
            
            this.lastParticleSpawn = now;
        }
        
        // Обновляем частицы
        this.trailParticles = this.trailParticles.filter(particle => {
            const age = now - particle.createdAt;
            const lifeProgress = age / this.particleLifetime;
            
            // Обновляем позицию частицы
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Замедляем частицу
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // Уменьшаем размер и прозрачность
            particle.alpha = 0.8 * (1 - lifeProgress);
            particle.size *= 0.98;
            
            return age < this.particleLifetime && particle.size > 0.3;
        });
    }
    
    draw() {
        // Рисуем основной след
        if (this.trail.length > 1) {
            ctx.save();
            
            // Градиентный след
            for (let i = 1; i < this.trail.length; i++) {
                const segment = this.trail[i];
                const prevSegment = this.trail[i - 1];
                const progress = i / this.trail.length;
                
                // Толщина следа уменьшается к концу
                const width = (1 - progress) * 8;
                
                // Цвет следа с градиентом
                const alpha = (1 - progress) * 0.4;
                ctx.strokeStyle = `rgba(76, 175, 80, ${alpha})`;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(prevSegment.x, prevSegment.y);
                ctx.lineTo(segment.x, segment.y);
                ctx.stroke();
            }
            
            // Дополнительный яркий центральный след
            for (let i = 1; i < this.trail.length; i++) {
                const segment = this.trail[i];
                const prevSegment = this.trail[i - 1];
                const progress = i / this.trail.length;
                
                const width = (1 - progress) * 3;
                const alpha = (1 - progress) * 0.6;
                ctx.strokeStyle = `rgba(129, 199, 132, ${alpha})`;
                ctx.lineWidth = width;
                
                ctx.beginPath();
                ctx.moveTo(prevSegment.x, prevSegment.y);
                ctx.lineTo(segment.x, segment.y);
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Рисуем частицы следа
        this.trailParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            
            // Свечение частицы
            const glowGradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            glowGradient.addColorStop(0, particle.color);
            glowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Основная частица
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Ядовитая аура вокруг снаряда
        ctx.save();
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Пульсирующая аура
        const pulseSize = Math.sin(Date.now() * 0.005) * 2 + 8;
        ctx.strokeStyle = 'rgba(129, 199, 132, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Основной снаряд
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#a5d6a7');
        gradient.addColorStop(0.5, '#66bb6a');
        gradient.addColorStop(0.8, '#4caf50');
        gradient.addColorStop(1, '#2e7d32');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка снаряда
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Блики на снаряде
        ctx.fillStyle = 'rgba(200, 230, 201, 0.7)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius/3, this.y - this.radius/3, this.radius/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Маленький блик
        ctx.fillStyle = 'rgba(220, 237, 200, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius/2, this.y - this.radius/2, this.radius/5, 0, Math.PI * 2);
        ctx.fill();
    }
}