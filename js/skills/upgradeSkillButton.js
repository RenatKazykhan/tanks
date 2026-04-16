class UpgradeSkillButton {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 14;
    }

    draw(level, maxLevel, skillPoints) {
        if (skillPoints > 0 && level < maxLevel) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Фон кнопки
            ctx.fillStyle = '#ffb020';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Обводка
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Иконка "+"
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', this.x, this.y + 1);

            ctx.restore();
        }
        if (level > 0) {
            // Показываем уровень просто клеточками
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            const cellWidth = 8;
            const cellHeight = 8;
            const cellSpacing = 3;
            const totalWidth = maxLevel * cellWidth + (maxLevel - 1) * cellSpacing;
            const startX = this.x - totalWidth / 2;
            const startY = this.y + 90;

            for (let i = 0; i < maxLevel; i++) {
                ctx.beginPath();
                ctx.rect(startX + i * (cellWidth + cellSpacing), startY, cellWidth, cellHeight);
                if (i < level) {
                    ctx.fillStyle = '#a855f7';
                    ctx.fill();
                } else {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fill();
                }
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    checkClick(clickX, clickY, level, maxLevel, skillPoints) {
        if (skillPoints > 0 && level < maxLevel) {
            const dist = Math.sqrt((clickX - this.x) ** 2 + (clickY - this.y) ** 2);
            if (dist <= this.radius) {
                return true;
            }
        }
        return false;
    }
}
