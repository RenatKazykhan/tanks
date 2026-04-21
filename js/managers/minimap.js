class Minimap {
    constructor() {
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.minimapScale = {
            x: this.minimapCanvas.width / WORLD_WIDTH,
            y: this.minimapCanvas.height / WORLD_HEIGHT
        };
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 200;
    }

    drawMinimap() {
        if (currentStage === 2) {
            // Отрисовка турелей
            this.minimapCtx.fillStyle = '#ff00ff';
            stage2Turrets.forEach(turret => {
                if (turret.active) {
                    this.minimapCtx.fillRect(
                        turret.x * this.minimapScale.x - 2,
                        turret.y * this.minimapScale.y - 2,
                        4,
                        4
                    );
                }
            });

            // Отрисовка выхода (если активен)
            if (enemies.length === 0 && stage2Zones.every(zone => zone.activated === true)) {
                this.minimapCtx.fillStyle = '#00ff00';
                this.minimapCtx.fillRect(
                    stage2Exit.x * this.minimapScale.x,
                    stage2Exit.y * this.minimapScale.y,
                    stage2Exit.width * this.minimapScale.x,
                    stage2Exit.height * this.minimapScale.y
                );
            }

            // Отрисовка зон активации
            this.minimapCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.minimapCtx.lineWidth = 1;
            stage2Zones.forEach(zone => {
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

        // Очистка мини-карты
        this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.minimapCtx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

        // Рамка мини-карты
        this.minimapCtx.strokeStyle = '#444';
        this.minimapCtx.strokeRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

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