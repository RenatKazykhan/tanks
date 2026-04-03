class PoisonTank extends SmartTank {
    constructor(x, y) {
        super(x, y);
        
        // Переопределяем характеристики
        this.health = 120;
        this.maxHealth = 120;
        this.damage = 25;
        this.speed = 90;
        this.shotCooldown = 1500;
        
        // Уникальные свойства для ядовитого танка
        this.poisonDamage = 5;
        this.poisonDuration = 3000;
        this.poisonTickRate = 500;
        
        // Визуальные эффекты - зеленая цветовая схема
        this.tankColor = '#2e7d32'; // Темно-зеленый
        this.tankAccentColor = '#388e3c'; // Средне-зеленый
        this.bulletSpeed = 400;
        
        // Анимация
        this.bubbleAnimation = 0;
        this.glowPulse = 0;
    }
    
    draw() {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Тень танка
        ctx.save();
        ctx.scale(1.1, 0.6);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Рисуем корпус
        ctx.save();
        ctx.rotate(this.bodyAngle);
        
        // Гусеницы
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(-this.width/2 - 3, -this.height/2 - 2, this.width + 6, 8);
        ctx.fillRect(-this.width/2 - 3, this.height/2 - 6, this.width + 6, 8);
        
        // Детали гусениц
        ctx.fillStyle = '#263238';
        for (let i = 0; i < 5; i++) {
            const x = -this.width/2 + i * (this.width/4);
            ctx.fillRect(x, -this.height/2 - 1, 3, 6);
            ctx.fillRect(x, this.height/2 - 5, 3, 6);
        }
        
        // Основной корпус с градиентом
        const bodyGradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        bodyGradient.addColorStop(0, '#4caf50');
        bodyGradient.addColorStop(0.5, this.tankColor);
        bodyGradient.addColorStop(1, '#1b5e20');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + 5, -this.height/2);
        ctx.lineTo(this.width/2 - 5, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/2 + 5);
        ctx.lineTo(this.width/2, this.height/2 - 5);
        ctx.lineTo(this.width/2 - 5, this.height/2);
        ctx.lineTo(-this.width/2 + 5, this.height/2);
        ctx.lineTo(-this.width/2, this.height/2 - 5);
        ctx.lineTo(-this.width/2, -this.height/2 + 5);
        ctx.closePath();
        ctx.fill();
        
        // Обводка корпуса
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Декоративные элементы на корпусе
        ctx.fillStyle = '#388e3c';
        ctx.fillRect(-this.width/2 + 8, -this.height/2 + 3, this.width - 16, 2);
        ctx.fillRect(-this.width/2 + 8, this.height/2 - 5, this.width - 16, 2);
        
        // Вентиляционные отверстия
        ctx.fillStyle = '#1b5e20';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-this.width/4 + i * 10, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Рисуем башню
        ctx.save();
        ctx.rotate(this.angle);
        
        // Основание башни
        const turretGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        turretGradient.addColorStop(0, '#66bb6a');
        turretGradient.addColorStop(0.7, '#4caf50');
        turretGradient.addColorStop(1, '#388e3c');
        
        ctx.fillStyle = turretGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка башни
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Дуло
        const barrelLength = 25;
        const barrelGradient = ctx.createLinearGradient(15, -5, 15 + barrelLength, -5);
        barrelGradient.addColorStop(0, '#388e3c');
        barrelGradient.addColorStop(0.5, '#4caf50');
        barrelGradient.addColorStop(1, '#66bb6a');
        
        ctx.fillStyle = barrelGradient;
        ctx.fillRect(15, -5, barrelLength, 10);
        
        // Детали дула
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(15 + barrelLength - 8, -6, 8, 12);
        ctx.fillRect(15 + barrelLength - 6, -7, 6, 14);
        
        // Отверстия на дуле для выпуска газа
        ctx.fillStyle = '#1b5e20';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(20 + i * 6, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Токсичные пары из дула
        const vaporAlpha = 0.3 + Math.sin(this.glowPulse) * 0.1;
        ctx.strokeStyle = `rgba(76, 175, 80, ${vaporAlpha})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(15 + barrelLength, 0, 10 + Math.sin(this.bubbleAnimation) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Символ биологической опасности на башне
        ctx.save();
        ctx.fillStyle = '#81c784';
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☣', 0, 0);
        ctx.restore();
        
        // Светящиеся точки на башне
        const glowIntensity = 0.5 + Math.sin(this.glowPulse) * 0.3;
        ctx.fillStyle = `rgba(129, 199, 132, ${glowIntensity})`;
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Токсичные пузыри вокруг танка
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 3; i++) {
            const bubblePhase = this.bubbleAnimation + i * 2;
            const x = Math.cos(bubblePhase) * 25;
            const y = Math.sin(bubblePhase * 1.5) * 15;
            const size = 3 + Math.sin(bubblePhase * 2) * 2;
            
            const bubbleGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            bubbleGradient.addColorStop(0, '#81c784');
            bubbleGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = bubbleGradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        ctx.restore();
        
        // Полоска здоровья
        this.drawHealthBar();
        
        // Рисуем снаряды
        this.bullets.forEach(bullet => {
            if (bullet.active) {
                bullet.draw();
            }
        });
    }
    
    drawHealthBar() {
        const healthBarWidth = 40;
        const healthBarHeight = 6;
        const healthPercentage = this.health / this.maxHealth;
        
        // Фон полоски здоровья
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - healthBarWidth/2 - 1, this.y - this.height/2 - 13, healthBarWidth + 2, healthBarHeight + 2);
        
        // Полоска здоровья - темный фон
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth, healthBarHeight);
        
        // Зеленые оттенки для здоровья
        if (healthPercentage > 0.6) {
            ctx.fillStyle = '#4caf50';
        } else if (healthPercentage > 0.3) {
            ctx.fillStyle = '#66bb6a';
        } else {
            ctx.fillStyle = '#81c784';
        }
        
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Рамка полоски здоровья
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - healthBarWidth/2, this.y - this.height/2 - 12, healthBarWidth, healthBarHeight);
    }
    
    smartShooting(distance) {
        const now = Date.now();
        
         // Проверяем кулдаун
        if (now - this.lastShot < this.shotCooldown) return;

        if (distance < 350) {            
            // Создаем ядовитую пулю
            const bullet = new PoisonBullet(
                this.x + Math.cos(this.angle) * (this.width/2 + 10),
                this.y + Math.sin(this.angle) * (this.width/2 + 10),
                this.damage,
                this.angle,
                'enemy',
                this.bulletSpeed
            );
        
            this.bullets.push(bullet);
            this.lastShot = now;
        }
    }
}

