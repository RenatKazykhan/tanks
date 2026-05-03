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
    createExitEffect(exit) {
        const exitX = exit.x + exit.width / 2;
        const exitY = exit.y + exit.height / 2;

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