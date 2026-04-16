class LightningBullet {
    constructor(x, y, damage, owner, maxTargets = 4, bounceRange = 300) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.owner = owner;
        this.maxTargets = maxTargets;
        this.bounceRange = bounceRange;
        this.active = true;
        this.targetsHit = [];
        this.lightningChain = [];
        this.animationTime = 0;
        this.maxAnimationTime = 400; // 0.4 секунды анимации
        this.created = Date.now();
        
        // Сразу ищем цели при создании
        if (typeof enemies !== 'undefined') {
            this.findTargets(enemies);
        }
    }

    update(deltaTime) {
        this.animationTime += deltaTime * 1000;
        
        if (this.animationTime >= this.maxAnimationTime) {
            this.active = false;
        }
    }

    findTargets(enemies) {
        if (!enemies || enemies.length === 0) return;

        let lastTarget = {x: this.x, y: this.y};
        let remainingDamage = this.damage;
        
        // Находим первую цель (ближайшего врага)
        let nearestEnemy = null;
        let minDistance = this.bounceRange;
        
        enemies.forEach(enemy => {
            if (enemy.active) {
                const distance = Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });

        if (nearestEnemy) {
            this.targetsHit.push(nearestEnemy);
            this.lightningChain.push({x: this.x, y: this.y});
            this.lightningChain.push({x: nearestEnemy.x, y: nearestEnemy.y});
            lastTarget = nearestEnemy;
            nearestEnemy.takeDamage(remainingDamage);
            if (!nearestEnemy.active) {
                enemyDead(nearestEnemy.x, nearestEnemy.y);
            }
            
            // Уменьшаем урон для следующих целей (на 20% каждый прыжок)
            remainingDamage *= 0.8;

            // Ищем следующие цели
            while (this.targetsHit.length < this.maxTargets && remainingDamage > 10) {
                let nextTarget = null;
                let nextMinDistance = this.bounceRange;
                
                enemies.forEach(enemy => {
                    if (enemy.active && !this.targetsHit.includes(enemy)) {
                        const distance = Math.sqrt(Math.pow(enemy.x - lastTarget.x, 2) + Math.pow(enemy.y - lastTarget.y, 2));
                        if (distance < nextMinDistance) {
                            nextMinDistance = distance;
                            nextTarget = enemy;
                        }
                    }
                });

                if (nextTarget) {
                    this.targetsHit.push(nextTarget);
                    this.lightningChain.push({x: nextTarget.x, y: nextTarget.y});
                    lastTarget = nextTarget;
                    nextTarget.takeDamage(remainingDamage);
                    if (!nextTarget.active) {
                        enemyDead(nextTarget.x, nextTarget.y);
                    }
                    remainingDamage *= 0.8;
                } else {
                    break;
                }
            }
        }
    }

    draw() {
        if (this.lightningChain.length < 2) return;

        ctx.save();
        
        // Рисуем молнию с анимацией
        const progress = this.animationTime / this.maxAnimationTime;
        const opacity = Math.max(0, 1 - progress);
        
        // Основная молния
        ctx.strokeStyle = `rgba(255, 255, 100, ${opacity})`;
        ctx.lineWidth = 4 + Math.sin(Date.now() * 0.03) * 2;
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 25;
        
        for (let i = 0; i < this.lightningChain.length - 1; i++) {
            const start = this.lightningChain[i];
            const end = this.lightningChain[i + 1];
            
            // Рисуем несколько линий для эффекта молнии
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                
                const segments = 4 + Math.floor(Math.random() * 3);
                for (let k = 1; k <= segments; k++) {
                    const t = k / segments;
                    const baseX = start.x + (end.x - start.x) * t;
                    const baseY = start.y + (end.y - start.y) * t;
                    
                    const offsetX = (Math.random() - 0.5) * 30 * (1 - opacity);
                    const offsetY = (Math.random() - 0.5) * 30 * (1 - opacity);
                    
                    ctx.lineTo(baseX + offsetX, baseY + offsetY);
                }
                
                ctx.stroke();
            }
        }
        
        // Вспышки на точках попадания
        const flashSize = 10 + Math.sin(Date.now() * 0.01) * 5;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.lightningChain.forEach((point, index) => {
            if (index > 0) { // Не рисуем вспышку в начальной точке
                ctx.beginPath();
                ctx.arc(point.x, point.y, flashSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
}