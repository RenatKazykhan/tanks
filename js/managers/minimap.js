class Minimap {
    constructor() {
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        // Сначала задаём размер, потом считаем масштаб
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 200;
        this.minimapScale = {
            x: this.minimapCanvas.width / WORLD_WIDTH,
            y: this.minimapCanvas.height / WORLD_HEIGHT
        };
    }

    drawMinimap() {
        // Очистка мини-карты (всегда первой)
        this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.minimapCtx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

        // Рамка мини-карты
        this.minimapCtx.strokeStyle = '#444';
        this.minimapCtx.strokeRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

        if (currentStage === 2) {
            // Отрисовка выхода (если активен)
            if (enemies.length === 0 && stageManager.handler.zones.every(zone => zone.activated === true)) {
                this.minimapCtx.fillStyle = '#00ff00';
                this.minimapCtx.fillRect(
                    stageManager.handler.x * this.minimapScale.x,
                    stageManager.handler.y * this.minimapScale.y,
                    stageManager.handler.width * this.minimapScale.x,
                    stageManager.handler.height * this.minimapScale.y
                );
            }

            // Отрисовка зон активации
            this.minimapCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.minimapCtx.lineWidth = 1;
            stageManager.handler.zones.forEach(zone => {
                if (!zone.activated) {
                    this.minimapCtx.beginPath();
                    this.minimapCtx.arc(
                        zone.x * this.minimapScale.x,
                        zone.y * this.minimapScale.y,
                        zone.radius * this.minimapScale.x,
                        0,
                        Math.PI * 2
                    );
                    this.minimapCtx.stroke();
                }
            });
        }

        if (currentStage === 3) {
            // Отрисовка выхода (если заколка найдена)
            this.minimapCtx.fillStyle = '#00ff00';
            this.minimapCtx.fillRect(
                stageManager.handler.exit.x * this.minimapScale.x,
                stageManager.handler.exit.y * this.minimapScale.y,
                stageManager.handler.exit.width * this.minimapScale.x,
                stageManager.handler.exit.height * this.minimapScale.y
            );
        }

        // Отрисовка игрока
        this.minimapCtx.fillStyle = '#00ff00';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(
            player.x * this.minimapScale.x,
            player.y * this.minimapScale.y,
            3,
            0,
            Math.PI * 2
        );
        this.minimapCtx.fill();

        // Отрисовка врагов
        this.minimapCtx.fillStyle = '#ff0000';
        enemies.forEach(enemy => {
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(
                enemy.x * this.minimapScale.x,
                enemy.y * this.minimapScale.y,
                2,
                0,
                Math.PI * 2
            );
            this.minimapCtx.fill();
        });

        // Отрисовка бонусов
        this.minimapCtx.fillStyle = '#ffff00';
        powerUps.forEach(powerUp => {
            this.minimapCtx.fillRect(
                powerUp.x * this.minimapScale.x - 1,
                powerUp.y * this.minimapScale.y - 1,
                2,
                2
            );
        });

        // Отрисовка области видимости камеры
        this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.minimapCtx.strokeRect(
            camera.x * this.minimapScale.x,
            camera.y * this.minimapScale.y,
            camera.width * this.minimapScale.x,
            camera.height * this.minimapScale.y
        );
    }
}