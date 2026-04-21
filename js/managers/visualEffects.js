class VisualEffects {
    constructor() {
        this.particles = [];
    }

    // Создание взрыва
    createExplosion(x, y, color = '#ff6600') {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    // Эффект для выхода
    createExitEffect() {
        const exitX = stage2Exit.x + stage2Exit.width / 2;
        const exitY = stage2Exit.y + stage2Exit.height / 2;

        // Создаем частицы для выхода
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            this.particles.push(new Particle(
                exitX + Math.cos(angle) * 30,
                exitY + Math.sin(angle) * 30,
                '#00ff00',
                {
                    vx: Math.cos(angle) * 50,
                    vy: Math.sin(angle) * 50,
                    life: 2000,
                    size: 5
                }
            ));
        }
    }
}