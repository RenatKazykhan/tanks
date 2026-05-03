/**
 * Обработчик этапа «Защити базу».
 *
 * Правила:
 *  - В центре карты стоит база (PlayerBase) со своим HP.
 *  - Нужно продержаться N минут (зависит от сета: 10/15/20/25/30).
 *  - Каждую минуту враги становятся сильнее (multiplier++).
 *  - Каждые ~4 с спавнится новый враг с одного из 4 бортов.
 *  - Каждый враг нацелен на игрока ИЛИ базу — на того, кто ближе.
 *  - Поражение: база уничтожена ИЛИ игрок погиб.
 *  - Победа: пережили отведённое время при живой базе.
 *
 * Пул врагов (DEFENSE_ENEMY_POOL) легко расширяется:
 *  добавьте элемент { cls: ClassName, minMinute: N } — и враг начнёт
 *  появляться начиная с N-й минуты.
 */

// ============================================================
//  НАСТРОЙКИ, КОТОРЫЕ ЛЕГКО МЕНЯТЬ
// ============================================================

/** Таблица спавна: enemyClass + с какой минуты допускается. */
const DEFENSE_ENEMY_POOL = [
    { cls: () => Wave1, minMinute: 0 },
    { cls: () => EnemyTank, minMinute: 0 },
    { cls: () => SmokeTank, minMinute: 1 },
    { cls: () => IceTank, minMinute: 2 },
    { cls: () => VeerTank, minMinute: 2 },
    { cls: () => BerserkTank, minMinute: 3 },
    { cls: () => ShieldTank, minMinute: 3 },
    { cls: () => MinerTank, minMinute: 4 },
    { cls: () => TeleportTank, minMinute: 4 },
    { cls: () => SmartTank, minMinute: 5 },
    { cls: () => MachineGunTank, minMinute: 5 },
    { cls: () => HeavyTank, minMinute: 6 },
    { cls: () => RocketTank, minMinute: 6 },
    { cls: () => Sniper, minMinute: 7 },
    { cls: () => KamikazeTank, minMinute: 7 },
    { cls: () => StrongEnemyTank, minMinute: 8 },
    // { cls: () => Tiger1,         minMinute: 9  },  // добавьте когда нужно
    // { cls: () => Tiger2,         minMinute: 12 },
];

/** Продолжительность (минут) для каждого сета (индекс = setIndex 0..4). */
const DEFENSE_DURATION_MINUTES = [5, 10, 15, 20, 25];

/** Базовый интервал между спавнами (мс). */
const SPAWN_INTERVAL_BASE_MS = 4000;

/** Минимальный интервал — не реже одного раза в … */
const SPAWN_INTERVAL_MIN_MS = 1200;

/** HP базы (умножается на сложность сета). */
const BASE_HP = 2500;

// ============================================================

class PlayerBase {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} hp
     */
    constructor(x, y, hp) {
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = hp;
        this.width = 80;
        this.height = 80;
        this.active = true;
        this.damageFlash = 0;
        this.pulsePhase = 0;
        this.shieldRing = 0;  // визуальное кольцо при ударе
        this.bullets = []; // нужен для совместимости с системой коллизий пуль
    }

    takeDamage(damage) {
        if (!this.active) return;
        this.hp -= damage;
        this.damageFlash = 1.0;
        this.shieldRing = 1.0;
        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
        }
    }

    // Совместимость со скиллами игрока
    takeDamageBySkill(damage) { this.takeDamage(damage); }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 2.5;
        this.damageFlash = Math.max(0, this.damageFlash - deltaTime * 3);
        this.shieldRing = Math.max(0, this.shieldRing - deltaTime * 1.5);
    }

    draw() {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;
        const hp = this.hp / this.maxHp;

        ctx.save();
        ctx.translate(x, y);

        // --- аура ---
        const pulse = Math.sin(this.pulsePhase) * 0.15 + 0.55;
        const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 75);
        aura.addColorStop(0, `rgba(0,200,255,${pulse * 0.35})`);
        aura.addColorStop(1, 'rgba(0,200,255,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();

        // --- тень ---
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(3, h / 2 + 4, w / 2 + 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- корпус ---
        const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        grad.addColorStop(0, '#1a6b8a');
        grad.addColorStop(0.5, '#1d4e6e');
        grad.addColorStop(1, '#0d2d40');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();

        // --- вспышка при ударе ---
        if (this.damageFlash > 0) {
            ctx.fillStyle = `rgba(255,60,60,${this.damageFlash * 0.55})`;
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, 6);
            ctx.fill();
        }

        // --- иконка «звезда» (символ базы) ---
        ctx.fillStyle = `rgba(0,220,255,${0.7 + Math.sin(this.pulsePhase * 1.5) * 0.3})`;
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏠', 0, 0);

        // --- обводка ---
        ctx.strokeStyle = `rgba(0,200,255,${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.stroke();

        // --- защитное кольцо при ударе ---
        if (this.shieldRing > 0) {
            ctx.strokeStyle = `rgba(255,100,100,${this.shieldRing * 0.8})`;
            ctx.lineWidth = 3 * this.shieldRing;
            ctx.beginPath();
            ctx.arc(0, 0, 55 * (1 + (1 - this.shieldRing) * 0.3), 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // --- полоска HP ---
        const bw = 90;
        const bh = 8;
        const bx = x - bw / 2;
        const by = y - h / 2 - 20;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

        const hpColor = hp > 0.5 ? '#00e5ff' : hp > 0.25 ? '#ffb300' : '#f44336';
        ctx.fillStyle = '#1a2a33';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = hpColor;
        ctx.fillRect(bx, by, bw * hp, bh);

        ctx.fillStyle = '#1d0b0bff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`База: ${Math.ceil(this.hp)} / ${this.maxHp}`, x, by + bh / 2);
    }
}

// ============================================================

window.DefenseStage = class DefenseStage {
    constructor(config) {
        this.config = config;

        // Вычисляем продолжительность по индексу сета (set 1..5 → index 0..4)
        const setIndex = (config.set || 1) - 1;
        this.durationSec = DEFENSE_DURATION_MINUTES[setIndex] * 60;
        this.elapsedSec = 0;

        this.base = null;
        this.spawnTimer = 0;
        this.spawnInterval = SPAWN_INTERVAL_BASE_MS / 1000;
        this.minutePassed = 0;   // сколько минут прошло
        this.diffMult = 1.0; // текущий множитель сложности

        this.initialized = false;
        this.victory = false;
        this.defeatReason = null;

        // Ссылки на глобальные массивы (будут заданы в init)
        this._enemies = null;
        this._walls = null;
        this._powerUps = null;
        this._player = null;
    }

    // ----------------------------------------------------------
    //  ИНИЦИАЛИЗАЦИЯ
    // ----------------------------------------------------------
    init(player, walls, enemies, powerUps) {
        console.log(`[DefenseStage] Инициализация. Сет ${this.config.set}, ${this.durationSec / 60} мин`);

        this._player = player;
        this._walls = walls;
        this._enemies = enemies;
        this._powerUps = powerUps;

        walls.length = 0;
        enemies.length = 0;
        powerUps.length = 0;

        // Генерация карты
        this.generateMap(walls);

        // Создаём базу игрока в центре
        const cx = WORLD_WIDTH / 2;
        const cy = WORLD_HEIGHT / 2;
        const hp = BASE_HP * this.config.difficulty;
        this.base = new PlayerBase(cx, cy, Math.round(hp));

        // Игрок чуть севернее базы
        player.x = cx;
        player.y = cy - 150;
        player.skillPoints = 20;
        // Сброс счётчиков
        this.elapsedSec = 0;
        this.spawnTimer = 0;
        this.spawnInterval = SPAWN_INTERVAL_BASE_MS / 1000;
        this.minutePassed = 0;
        this.diffMult = 1.0;
        this.victory = false;
        this.defeatReason = null;

        this.initialized = true;
    }

    // ----------------------------------------------------------
    //  ГЕНЕРАЦИЯ КАРТЫ (случайные укрытия)
    // ----------------------------------------------------------
    generateMap(walls) {
        const cx = WORLD_WIDTH / 2;
        const cy = WORLD_HEIGHT / 2;
        const safeRadius = 200; // зона вокруг базы без стен

        // --- внешние бордюры (тонкие, чтобы не мешали спавну) ---
        // (опционально — закомментируйте если мешают)
        // const t = 30;
        // walls.push(new Wall(WORLD_WIDTH/2,  t/2,        WORLD_WIDTH, t));
        // walls.push(new Wall(WORLD_WIDTH/2,  WORLD_HEIGHT - t/2, WORLD_WIDTH, t));
        // walls.push(new Wall(t/2,            WORLD_HEIGHT/2,     t, WORLD_HEIGHT));
        // walls.push(new Wall(WORLD_WIDTH - t/2, WORLD_HEIGHT/2,  t, WORLD_HEIGHT));

        // --- случайные прямоугольные укрытия ---
        const count = 16 + Math.floor(this.config.difficulty * 4);

        for (let attempt = 0; attempt < count * 4 && walls.length < count; attempt++) {
            const minSize = 40, maxSize = 130;
            const w = minSize + Math.random() * (maxSize - minSize);
            const h = minSize + Math.random() * (maxSize - minSize);

            const margin = 120;
            const x = margin + Math.random() * (WORLD_WIDTH - 2 * margin - w);
            const y = margin + Math.random() * (WORLD_HEIGHT - 2 * margin - h);

            const wx = x + w / 2;
            const wy = y + h / 2;

            // Не слишком близко к центру
            if (Math.hypot(wx - cx, wy - cy) < safeRadius + Math.max(w, h) / 2) continue;

            walls.push(new Wall(wx, wy, w, h));
        }

        // --- L/T-образные укрытия в углах ---
        const segments = [
            // Верхний левый
            { x: 250, y: 200, w: 120, h: 20 },
            { x: 200, y: 250, w: 20, h: 100 },
            // Верхний правый
            { x: WORLD_WIDTH - 250, y: 200, w: 120, h: 20 },
            { x: WORLD_WIDTH - 200, y: 250, w: 20, h: 100 },
            // Нижний левый
            { x: 250, y: WORLD_HEIGHT - 200, w: 120, h: 20 },
            { x: 200, y: WORLD_HEIGHT - 250, w: 20, h: 100 },
            // Нижний правый
            { x: WORLD_WIDTH - 250, y: WORLD_HEIGHT - 200, w: 120, h: 20 },
            { x: WORLD_WIDTH - 200, y: WORLD_HEIGHT - 250, w: 20, h: 100 },
        ];
        segments.forEach(s => walls.push(new Wall(s.x, s.y, s.w, s.h)));
    }

    // ----------------------------------------------------------
    //  ОБНОВЛЕНИЕ
    // ----------------------------------------------------------
    update(deltaTime, player, enemies, walls) {
        if (!this.initialized || this.victory) return;

        // Проверяем гибель базы
        if (this.base && !this.base.active) {
            this.defeatReason = 'base';
            gameOver();
            return;
        }

        this.elapsedSec += deltaTime;
        this.base.update(deltaTime);

        // Проверяем коллизии пуль врагов с базой
        this._checkEnemyBulletsVsBase(enemies);

        // Усиление каждую минуту
        const currentMinute = Math.floor(this.elapsedSec / 60);
        if (currentMinute > this.minutePassed) {
            this.minutePassed = currentMinute;
            this._escalate();
        }

        // Спавн врагов
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnEnemy(enemies, player);
            // Постепенно учащаем спавн
            this.spawnInterval = Math.max(
                SPAWN_INTERVAL_MIN_MS / 1000,
                this.spawnInterval - 0.05
            );
        }

        // Победа
        if (this.elapsedSec >= this.durationSec && this.base.active) {
            this.victory = true;
        }
    }

    // ----------------------------------------------------------
    //  КОЛЛИЗИИ ПУЛЬ ВРАГОВ С БАЗОЙ
    // ----------------------------------------------------------
    _checkEnemyBulletsVsBase(enemies) {
        if (!this.base || !this.base.active) return;
        const b = this.base;
        const hw = b.width / 2;
        const hh = b.height / 2;

        enemies.forEach(enemy => {
            if (!enemy.bullets || enemy.bullets.length === 0) return;
            enemy.bullets = enemy.bullets.filter(bullet => {
                if (!bullet.active) return false;
                // AABB + радиус пули
                if (bullet.x + bullet.radius > b.x - hw &&
                    bullet.x - bullet.radius < b.x + hw &&
                    bullet.y + bullet.radius > b.y - hh &&
                    bullet.y - bullet.radius < b.y + hh) {
                    b.takeDamage(bullet.damage);
                    bullet.active = false;
                    return false;
                }
                return true;
            });
        });
    }

    // ----------------------------------------------------------
    //  УСИЛЕНИЕ ВРАГОВ
    // ----------------------------------------------------------
    _escalate() {
        this.diffMult += 0.2;
        // Уменьшаем интервал спавна
        this.spawnInterval = Math.max(
            SPAWN_INTERVAL_MIN_MS / 1000,
            this.spawnInterval - 0.3
        );
        console.log(`[DefenseStage] Минута ${this.minutePassed}: diffMult=${this.diffMult.toFixed(1)}, interval=${this.spawnInterval.toFixed(1)}s`);
    }

    // ----------------------------------------------------------
    //  СПАВН ВРАГОВ
    // ----------------------------------------------------------
    _spawnEnemy(enemies, player) {
        const EnemyClass = this._pickEnemyClass();
        if (!EnemyClass) return;

        const { x, y } = this._getSpawnPos();
        const enemy = new EnemyClass(x, y);

        // Применяем множитель сложности
        enemy.health = Math.ceil((enemy.health || 50) * this.diffMult);
        enemy.maxHealth = enemy.health;
        enemy.damage = Math.ceil((enemy.damage || 10) * this.diffMult);

        // Сохраняем ссылки на базу и игрока, переопределяем update
        this._patchEnemyAI(enemy, player);

        enemies.push(enemy);
    }

    /** Выбирает случайный класс врага, подходящий для текущей минуты. */
    _pickEnemyClass() {
        const minute = this.minutePassed;
        const available = DEFENSE_ENEMY_POOL.filter(e => e.minMinute <= minute);
        if (available.length === 0) return Wave1;
        const entry = available[Math.floor(Math.random() * available.length)];
        // cls — геттер, чтобы избежать проблем с hoisting классов
        return entry.cls();
    }

    /** Случайная позиция на одном из 4 краёв карты. */
    _getSpawnPos() {
        const margin = 60;
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: return { x: Math.random() * WORLD_WIDTH, y: -margin };
            case 1: return { x: WORLD_WIDTH + margin, y: Math.random() * WORLD_HEIGHT };
            case 2: return { x: Math.random() * WORLD_WIDTH, y: WORLD_HEIGHT + margin };
            default: return { x: -margin, y: Math.random() * WORLD_HEIGHT };
        }
    }

    /**
     * Патчим AI врага: при каждом update он смотрит, кто ближе —
     * игрок или база — и атакует ближайшего.
     */
    _patchEnemyAI(enemy, player) {
        const base = this.base;
        const origUpdate = enemy.update.bind(enemy);

        enemy.update = function (playerX, playerY, deltaTime, playerBullets, walls) {
            if (!base.active) {
                // База уничтожена — атакуем только игрока
                origUpdate(playerX, playerY, deltaTime, playerBullets, walls);
                return;
            }

            const dPlayer = Math.hypot(this.x - playerX, this.y - playerY);
            const dBase = Math.hypot(this.x - base.x, this.y - base.y);

            if (dBase < dPlayer) {
                // Атакуем базу: передаём координаты базы как «игрока»
                origUpdate(base.x, base.y, deltaTime, playerBullets, walls);
            } else {
                origUpdate(playerX, playerY, deltaTime, playerBullets, walls);
            }
        };
    }

    // ----------------------------------------------------------
    //  ПРОВЕРКА ПОБЕДЫ
    // ----------------------------------------------------------
    checkVictory(player, enemies) {
        if (!this.initialized) return false;
        return this.victory && this.base && this.base.active;
    }

    // ----------------------------------------------------------
    //  СБРОС
    // ----------------------------------------------------------
    reset() {
        this.base = null;
        this.elapsedSec = 0;
        this.spawnTimer = 0;
        this.minutePassed = 0;
        this.diffMult = 1.0;
        this.victory = false;
        this.defeatReason = null;
        this.initialized = false;
    }

    // ----------------------------------------------------------
    //  ОТРИСОВКА HUD (экранные координаты — вызывается из main.js)
    // ----------------------------------------------------------
    drawHUD(ctx) {
        if (!this.initialized) return;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // --- таймер-бар ---
        const remaining = Math.max(0, this.durationSec - this.elapsedSec);
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        const progress = Math.min(1, this.elapsedSec / this.durationSec);

        const bw = 260, bh = 20;
        const bx = canvas.width / 2 - bw / 2;
        const by = 44;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);

        ctx.fillStyle = '#1a2a33';
        ctx.fillRect(bx, by, bw, bh);

        const barGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        barGrad.addColorStop(0, '#00bcd4');
        barGrad.addColorStop(1, '#1de9b6');
        ctx.fillStyle = barGrad;
        ctx.fillRect(bx, by, bw * progress, bh);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            `⏱ ${mins}:${String(secs).padStart(2, '0')} / ${Math.floor(this.durationSec / 60)}:00`,
            bx + bw / 2, by + bh / 2
        );

        // --- строка статуса ---
        const baseHpPct = this.base ? Math.ceil(this.base.hp / this.base.maxHp * 100) : 0;

        ctx.font = 'bold 14px "Segoe UI", Arial';
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('🏠 Защити базу!', 20, 25);

        ctx.font = 'bold 12px "Segoe UI", Arial';
        const hpColor = baseHpPct > 50 ? '#00e5ff' : baseHpPct > 25 ? '#ffb300' : '#f44336';
        ctx.fillStyle = hpColor;
        ctx.fillText(`HP базы: ${baseHpPct}%  |  Сложность: ×${this.diffMult.toFixed(1)}  |  Мин: ${this.minutePassed}`, 20, 44);

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /** draw() — база рисуется отдельно в main.js в мировых координатах. */
    draw(ctx) { /* намеренно пусто */ }

    getStatusText() {
        const remaining = Math.max(0, this.durationSec - this.elapsedSec);
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        return `⏱ ${mins}:${String(secs).padStart(2, '0')}`;
    }
};
