// Система опыта и уровней
class XPManager {
    constructor() {
        this.xp = 0;
        this.level = 1;
        this.xpToNext = 100;  // XP до следующего уровня
        this.baseXP = 100;
        this.xpGrowth = 1.4; // множитель роста XP
        this.pendingLevelUp = false;
        
        // Анимация XP-бара
        this.displayXP = 0;  // плавно догоняет реальный xp
        this.flashTimer = 0; // мигание при получении XP
        this.levelUpAnimation = 0; // анимация левел-апа
    }

    reset() {
        this.xp = 0;
        this.level = 1;
        this.xpToNext = this.baseXP;
        this.displayXP = 0;
        this.flashTimer = 0;
        this.pendingLevelUp = false;
        this.levelUpAnimation = 0;
    }

    addXP(amount) {
        this.xp += amount;
        this.flashTimer = 1;

        // Проверка уровня
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(this.baseXP * Math.pow(this.xpGrowth, this.level - 1));
            this.pendingLevelUp = true;
            this.levelUpAnimation = 1;
            this.displayXP = 0;  // Сброс для плавной анимации

            // Звук
            if (typeof soundManager !== 'undefined') {
                soundManager.playLevelUp();
            }
        }
    }

    // Проверяем, нужно ли показать экран выбора бонуса
    checkLevelUp() {
        if (this.pendingLevelUp) {
            this.pendingLevelUp = false;
            return true;
        }
        return false;
    }

    update(deltaTime) {
        // Плавная анимация XP-бара
        const diff = this.xp - this.displayXP;
        this.displayXP += diff * Math.min(1, deltaTime * 8);

        // Затухание вспышки
        if (this.flashTimer > 0) {
            this.flashTimer = Math.max(0, this.flashTimer - deltaTime * 3);
        }

        // Затухание анимации левел-апа
        if (this.levelUpAnimation > 0) {
            this.levelUpAnimation = Math.max(0, this.levelUpAnimation - deltaTime * 1.5);
        }
    }

    // Рисование XP-бара внизу экрана
    draw() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const barWidth = canvas.width * 0.6;
        const barHeight = 16;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 24;
        const progress = Math.min(1, this.displayXP / this.xpToNext);

        // Фон бара
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 6);
        ctx.fill();

        // Рамка
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 6);
        ctx.stroke();

        // Заполнение XP (градиент)
        if (progress > 0) {
            const fillWidth = barWidth * progress;
            const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(0.5, '#8b5cf6');
            gradient.addColorStop(1, '#a855f7');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillWidth, barHeight, 4);
            ctx.fill();

            // Блик сверху
            const shineGrad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
            shineGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
            shineGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
            ctx.fillStyle = shineGrad;
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillWidth, barHeight, 4);
            ctx.fill();
        }

        // Вспышка при получении XP
        if (this.flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer * 0.3})`;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth, barHeight, 4);
            ctx.fill();
        }

        // Текст уровня (слева от бара)
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#a855f7';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#7c3aed';
        ctx.fillText(`LV ${this.level}`, barX - 10, barY + barHeight / 2);

        // XP текст (справа от бара)
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 0;
        ctx.font = '11px Arial';
        ctx.fillText(`${Math.floor(this.displayXP)} / ${this.xpToNext}`, barX + barWidth + 10, barY + barHeight / 2);

        // Анимация уровня вверх
        if (this.levelUpAnimation > 0) {
            const alpha = this.levelUpAnimation;
            const scale = 1 + (1 - this.levelUpAnimation) * 0.5;
            const yOffset = (1 - this.levelUpAnimation) * 40;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${Math.floor(28 * scale)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f59e0b';
            ctx.fillText(`LEVEL UP! LV${this.level}`, canvas.width / 2, barY - 20 - yOffset);
            ctx.restore();
        }

        ctx.restore();
    }

    levelUp(player) {
        player.damage += 13;
        player.health += 35;
        player.maxHealth += 35;
        player.bulletSpeed = +30;
    }

     abilities = {
        lightning: {
            name: "Цепная молния",
            description: "Увеличвает количество прыжков на <span class='bonus-value'>1</span>.",
            apply: (player) => {
                player.maxChainTargets += 1;
            }
        },
        regen: {
            name: "Быстрая регенерация",
            description: "Увеличвает восстановление от способности на <span class='bonus-value'>5 HP/секунду</span>.",
            apply: (player) => {
                player.rapidRegenAmount += 5;
            }
        },
        doubleShot: {
            name: "Двойной выстрел",
            description: "С вероятностью 25% выпускает <span class='bonus-value'>2 снаряда</span> за выстрел",
            apply: (player) => {
                player.doubleShot = true;
            }
        },
        lifeSteal: {
            name: "Вампиризм",
            description: "Увеличивает вампиризм на <span class='bonus-value'>2%</span>",
            apply: (player) => {
                player.lifeSteal += 0.02;
            }
        },
        shield: {
            name: "Аура щита",
            description: "Дает ауру щита поглощающий урон. Поглащает <span class='bonus-value'>100 урона</span>. Восстанавливается <span class='bonus-value'>5 ед/сек</span>, задержка перед регенерацией <span class='bonus-value'>3 секунды</span>",
            apply: (player) => {
                player.hasShield = true;
                player.shield = 100;
                player.maxShield = 100;
                player.shieldRegenRate = 5;
            }
        },
        teleport: {
            name: "Телепорт",
            description: "Добавляет способность телепорт по нажатию кнопки <span class='bonus-value'>E</span> на расстояние <span class='bonus-value'>200</span>. Перезарядка <span class='bonus-value'>10 секунд</span>",
            apply: (player) => {
                player.canTeleport = true;
            }
        },
        explode: {
            name: "Взрыв",
            description: "Добавляет способность взрыв по нажатию кнопку <span class='bonus-value'>Q</span>. Урон от взрыва  <span class='bonus-value'>50</span> и радиус <span class='bonus-value'>150</span>. Перезарядка <span class='bonus-value'>10 секунд</span>",
            apply: (player) => {
                player.hasEnergyBlast = true;
            }
        },
        droneKamikaze: {
            name: "Дрон-камикадзе",
            description: "Автоматически запускает дрон-камикадзе каждые <span class='bonus-value'>3 секунды</span>. Дрон летит к ближайшему врагу и взрывается, нанося урон по области.",
            apply: (player) => {
                player.hasDroneKamikaze = true;
                player.droneDamage = 50;
                player.droneCooldown = 3000;
                player.droneExplosionRadius = 60;
            }
        }
    };
}


