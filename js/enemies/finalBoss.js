/**
 * Класс FinalBoss — улучшенный визуал
 */
class FinalBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = BOSS_WIDTH;
        this.height = BOSS_HEIGHT;
        this.speed = BOSS_SPEED;
        this.health = BOSS_MAX_HEALTH;
        this.maxHealth = BOSS_MAX_HEALTH;
        this.damage = 50;
        this.angle = 0;
        this.bullets = [];
        this.active = true;
        this.lastShot = 0;
        this.shotCooldown = 100;
        this.isReloading = false;
        this.reloadEndTime = 0;
        this.attackPhase = 0;
        this.phaseTimer = 0;
        this.phaseDuration = 10000;
        this.targetX = x;
        this.targetY = y;
        this.circleRadius = 300;
        this.circleAngle = 0;

        // --- Визуальные параметры ---
        this.trackOffset = 0;          // анимация гусениц
        this.glowPulse = 0;            // пульсация свечения
        this.damageFlash = 0;          // вспышка при получении урона
        this.exhaustParticles = [];    // частицы выхлопа
        this.shieldRotation = 0;       // вращение щита перезарядки
        this.phaseTransitionAlpha = 0; // анимация смены фазы
        this.engineVibration = 0;      // вибрация двигателя

        // Цвета для каждой фазы атаки
        this.phaseColors = [
            { primary: '#ff4444', secondary: '#cc0000', glow: '#ff6666', name: 'ВЕЕР', icon: '◈' },
            { primary: '#ff8800', secondary: '#cc6600', glow: '#ffaa44', name: 'РАКЕТЫ', icon: '◆' },
            { primary: '#ffcc00', secondary: '#cc9900', glow: '#ffdd44', name: 'ПУЛЕМЁТ', icon: '◉' }
        ];
    }

    takeDamage(damage, sourceX, sourceY, vx, vy) {
        this.health -= damage;
        this.damageFlash = 1.0; // запускаем вспышку
        if (this.health <= 0) {
            this.active = false;
        }
    }

    takeDamageBySkill(damage) {
        this.takeDamage(damage, this.x, this.y, 0, 0);
    }

    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        if (!this.active) return;

        const now = Date.now();
        this.phaseTimer += deltaTime * 1000;
        if (this.phaseTimer >= this.phaseDuration) {
            this.phaseTimer = 0;
            this.attackPhase = (this.attackPhase + 1) % 3;
            this.phaseTransitionAlpha = 1.0;
            this.startReload();
        }

        // Движение по кругу вокруг игрока
        this.circleAngle += deltaTime * 0.5;
        this.targetX = playerX + Math.cos(this.circleAngle) * this.circleRadius;
        this.targetY = playerY + Math.sin(this.circleAngle) * this.circleRadius;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }

        this.angle = Math.atan2(playerY - this.y, playerX - this.x);

        if (!this.isReloading && now - this.lastShot > this.getCurrentCooldown()) {
            this.shoot(playerX, playerY);
            this.lastShot = now;
        }

        this.bullets = this.bullets.filter(bullet => {
            if(bullet.isRocket) {
                bullet.update(player.x, player.y, deltaTime);
            }
            else {
                bullet.update(deltaTime);
            }
            return bullet.active;
        });

        // --- Обновление визуальных эффектов ---
        this.trackOffset += deltaTime * 120;
        if (this.trackOffset > 20) this.trackOffset -= 20;

        this.glowPulse += deltaTime * 3;
        this.shieldRotation += deltaTime * 2;
        this.engineVibration = Math.sin(now * 0.02) * 1.5;

        // Затухание вспышки урона
        if (this.damageFlash > 0) {
            this.damageFlash = Math.max(0, this.damageFlash - deltaTime * 5);
        }

        // Затухание анимации смены фазы
        if (this.phaseTransitionAlpha > 0) {
            this.phaseTransitionAlpha = Math.max(0, this.phaseTransitionAlpha - deltaTime * 2);
        }

        // Обновление частиц выхлопа
        this.updateExhaustParticles(deltaTime);
    }

    getCurrentCooldown() {
        switch (this.attackPhase) {
            case 0: return 1500;  // Веер — раз в 1.5 секунды
            case 1: return 2000;  // Ракеты — раз в 2 секунды
            case 2: return 150;   // Пулемёт — очень быстро
            default: return 1000;
        }
    }

    updateExhaustParticles(deltaTime) {
        // Генерация новых частиц из выхлопа
        const exhaustX = this.x - Math.cos(this.angle) * (this.width / 2 + 5);
        const exhaustY = this.y - Math.sin(this.angle) * (this.height / 2 + 5);
        if (Math.random() < 0.3) {
            this.exhaustParticles.push({
                x: exhaustX + (Math.random() - 0.5) * 10,
                y: exhaustY + (Math.random() - 0.5) * 10,
                vx: -Math.cos(this.angle) * (30 + Math.random() * 20),
                vy: -Math.sin(this.angle) * (30 + Math.random() * 20),
                life: 1.0,
                size: 3 + Math.random() * 4
            });
        }

        // Обновление частиц
        this.exhaustParticles = this.exhaustParticles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 2.5;
            p.size *= 0.98;
            return p.life > 0;
        });
    }

    startReload() {
        this.isReloading = true;
        this.reloadEndTime = Date.now() + bossReloadDuration * 1000;
        bossReloadTimer = bossReloadDuration;
    }

    shoot(playerX, playerY) {
        if (this.isReloading) return;
        switch (this.attackPhase) {
            case 0:
                this.shootFan(playerX, playerY);
                break;
            case 1:
                this.shootHomingRockets(playerX, playerY);
                break;
            case 2:
                this.shootMachineGun(playerX, playerY);
                break;
        }
    }

    shootFan(playerX, playerY) {
        const numBullets = 9;
        const spread = Math.PI / 3;
        const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);
        for (let i = 0; i < numBullets; i++) {
            const angle = baseAngle - spread / 2 + (spread / (numBullets - 1)) * i;
            this.bullets.push(new Bullet(
                this.x + Math.cos(angle) * 25,
                this.y + Math.sin(angle) * 25,
                this.damage, angle, 'enemy'
            ));
        }
    }

    shootHomingRockets(playerX, playerY) {
        const numRockets = 4;
        for (let i = 0; i < numRockets; i++) {
            const angle = this.angle + (Math.random() - 0.5) * 0.5;
            this.bullets.push(new Rocket(
                this.x + Math.cos(this.angle) * 30,
                this.y + Math.sin(this.angle) * 30,
                this.damage, angle, playerX, playerY, 'enemy'
            ));
        }
    }

    shootMachineGun(playerX, playerY) {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.bullets.push(new Bullet(
            this.x + Math.cos(angle) * 25,
            this.y + Math.sin(angle) * 25,
            this.damage, angle, 'enemy'
        ));
        this.shotCooldown = 150;
    }

    // =============================================
    //           ОТРИСОВКА
    // =============================================
    draw() {
        if (!this.active) return;

        const phase = this.phaseColors[this.attackPhase];
        const glowIntensity = 0.5 + Math.sin(this.glowPulse) * 0.3;
        const healthRatio = this.health / this.maxHealth;

        // --- Частицы выхлопа (за танком) ---
        this.drawExhaustParticles(ctx);

        // --- Тень под танком ---
        this.drawShadow(ctx);

        ctx.save();
        ctx.translate(this.x + this.engineVibration, this.y + this.engineVibration * 0.7);
        ctx.rotate(this.angle);

        // --- Свечение вокруг танка (аура фазы) ---
        this.drawPhaseAura(ctx, phase, glowIntensity);

        // --- Гусеницы ---
        this.drawTracks(ctx);

        // --- Основной корпус ---
        this.drawHull(ctx, phase, healthRatio);

        // --- Детали корпуса (броневые пластины, заклёпки) ---
        this.drawHullDetails(ctx, phase);

        // --- Башня ---
        this.drawTurret(ctx, phase);

        // --- Дуло ---
        this.drawBarrel(ctx, phase);

        // --- Индикатор перезарядки (щит) ---
        if (this.isReloading) {
            this.drawReloadShield(ctx);
        }

        // --- Вспышка урона ---
        if (this.damageFlash > 0) {
            this.drawDamageFlash(ctx);
        }

        ctx.restore();

        // --- Полоска здоровья (над танком, без вращения) ---
        this.drawHealthBar(ctx, healthRatio);

        // --- Индикатор фазы атаки ---
        this.drawPhaseIndicator(ctx, phase);

        // --- Таймер фазы ---
        this.drawPhaseTimer(ctx, phase);

        // --- Индикатор перезарядки (текст) ---
        if (this.isReloading) {
            this.drawReloadIndicator(ctx);
        }

        // --- Анимация смены фазы ---
        if (this.phaseTransitionAlpha > 0) {
            this.drawPhaseTransition(ctx, phase);
        }

        // --- Пули ---
        this.bullets.forEach(bullet => bullet.draw());
    }

    // ----- Тень -----
    drawShadow(ctx) {
        ctx.save();
        ctx.translate(this.x + 8, this.y + 8);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 + 5, this.height / 2 + 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ----- Частицы выхлопа -----
    drawExhaustParticles(ctx) {
        this.exhaustParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life * 0.6;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, 'rgba(100, 100, 100, 0.8)');
            gradient.addColorStop(0.5, 'rgba(60, 60, 60, 0.4)');
            gradient.addColorStop(1, 'rgba(30, 30, 30, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // ----- Аура фазы -----
    drawPhaseAura(ctx, phase, glowIntensity) {
        ctx.save();
        ctx.globalAlpha = glowIntensity * 0.15;
        const auraGrad = ctx.createRadialGradient(0, 0, this.width / 2, 0, 0, this.width);
        auraGrad.addColorStop(0, phase.glow);
        auraGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ----- Гусеницы -----
    drawTracks(ctx) {
        const trackWidth = 12;
        const hw = this.width / 2;
        const hh = this.height / 2;

        // Левая гусеница
        this.drawSingleTrack(ctx, -hw - trackWidth / 2, -hh - 4, trackWidth, this.height + 8);
        // Правая гусеница
        this.drawSingleTrack(ctx, hw - trackWidth / 2, -hh - 4, trackWidth, this.height + 8);
    }

    drawSingleTrack(ctx, x, y, w, h) {
        // Основа гусеницы
        ctx.fillStyle = '#2a2a2a';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;

        // Скруглённая форма гусеницы
        const radius = w / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.arc(x + w - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(x + w - radius, y + h);
        ctx.arc(x + w - radius, y + h - radius, radius, Math.PI / 2, -Math.PI / 2, true);
        // Упрощаем — прямоугольник со скруглением
        ctx.beginPath();
        this.roundRect(ctx, x, y, w, h, radius);
        ctx.fill();
        ctx.stroke();

        // Сегменты гусеницы (анимированные)
        ctx.fillStyle = '#3a3a3a';
        const segmentHeight = 10;
        const numSegments = Math.floor(h / segmentHeight);
        for (let i = 0; i < numSegments; i++) {
            const segY = y + ((i * segmentHeight + this.trackOffset) % h);
            if (segY + 2 > y && segY + 2 < y + h - 2) {
                ctx.fillRect(x + 1, segY, w - 2, 3);
            }
        }

        // Болты на гусенице
        ctx.fillStyle = '#555';
        const boltSpacing = 20;
        const numBolts = Math.floor(h / boltSpacing);
        for (let i = 0; i < numBolts; i++) {
            const boltY = y + 10 + i * boltSpacing;
            ctx.beginPath();
            ctx.arc(x + w / 2, boltY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ----- Корпус -----
    drawHull(ctx, phase, healthRatio) {
        const hw = this.width / 2;
        const hh = this.height / 2;

        // Основной градиент корпуса — меняется от здоровья
        const hullGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
        if (this.isReloading) {
            hullGrad.addColorStop(0, '#777');
            hullGrad.addColorStop(0.5, '#999');
            hullGrad.addColorStop(1, '#666');
        } else {
            // Интерполяция от цвета фазы к тёмному при низком здоровье
            hullGrad.addColorStop(0, this.lerpColor(phase.primary, '#330000', 1 - healthRatio));
            hullGrad.addColorStop(0.3, this.lerpColor(phase.secondary, '#220000', 1 - healthRatio));
            hullGrad.addColorStop(0.7, phase.primary);
            hullGrad.addColorStop(1, this.lerpColor(phase.secondary, '#440000', 1 - healthRatio));
        }

        ctx.fillStyle = hullGrad;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;

        // Форма корпуса (скошенная броня)
        ctx.beginPath();
        ctx.moveTo(-hw + 8, -hh);
        ctx.lineTo(hw - 5, -hh);
        ctx.lineTo(hw, -hh + 8);
        ctx.lineTo(hw, hh - 8);
        ctx.lineTo(hw - 5, hh);
        ctx.lineTo(-hw + 8, hh);
        ctx.lineTo(-hw, hh - 5);
        ctx.lineTo(-hw, -hh + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Передняя скошенная броня
        ctx.fillStyle = this.isReloading ? '#888' : this.darkenColor(phase.primary, 0.3);
        ctx.beginPath();
        ctx.moveTo(hw - 5, -hh);
        ctx.lineTo(hw + 8, -hh + 10);
        ctx.lineTo(hw + 8, hh - 10);
        ctx.lineTo(hw - 5, hh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // ----- Детали корпуса -----
    drawHullDetails(ctx, phase) {
        const hw = this.width / 2;
        const hh = this.height / 2;

        // Броневые пластины
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;

        // Горизонтальные линии брони
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-hw + 12, i * (hh / 3));
            ctx.lineTo(hw - 10, i * (hh / 3));
            ctx.stroke();
        }

        // Заклёпки по периметру
        ctx.fillStyle = '#888';
        const rivetPositions = [
            [-hw + 12, -hh + 6], [0, -hh + 6], [hw - 12, -hh + 6],
            [-hw + 12, hh - 6], [0, hh - 6], [hw - 12, hh - 6],
            [-hw + 6, 0], [hw - 6, 0]
        ];
        rivetPositions.forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 2, 0, Math.PI * 2);
            ctx.fill();
            // Блик на заклёпке
            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.arc(rx - 0.5, ry - 0.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#888';
        });

        // Выхлопные трубы (сзади)
        ctx.fillStyle = '#444';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.arc(-hw - 3, i * 8, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Внутренность трубы
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(-hw - 3, i * 8, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#444';
        }

        // Антенна
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-hw + 15, -hh + 3);
        ctx.lineTo(-hw + 15, -hh - 15);
        ctx.stroke();
        // Шарик на антенне
        ctx.fillStyle = phase.glow;
        ctx.beginPath();
        ctx.arc(-hw + 15, -hh - 15, 2, 0, Math.PI * 2);
        ctx.fill();

        // Люк на корпусе
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-hw / 3, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        // Ручка люка
        ctx.beginPath();
        ctx.moveTo(-hw / 3 - 3, 0);
        ctx.lineTo(-hw / 3 + 3, 0);
        ctx.stroke();
    }

    // ----- Башня -----
    drawTurret(ctx, phase) {
        const tw = this.width / 2.2;
        const th = this.height / 2.2;

        // Тень башни
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(3, 3, tw / 2 + 2, th / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Основание башни (круглое)
        const turretGrad = ctx.createRadialGradient(-5, -5, 0, 0, 0, tw / 2 + 5);
        if (this.isReloading) {
            turretGrad.addColorStop(0, '#aaa');
            turretGrad.addColorStop(1, '#555');
        } else {
            turretGrad.addColorStop(0, this.lightenColor(phase.secondary, 0.3));
            turretGrad.addColorStop(0.6, phase.secondary);
            turretGrad.addColorStop(1, this.darkenColor(phase.secondary, 0.4));
        }

        ctx.fillStyle = turretGrad;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, tw / 2, th / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Кольцо башни
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, tw / 2 - 4, th / 2 - 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Смотровые приборы на башне
        ctx.fillStyle = '#0af';
        ctx.globalAlpha = 0.7 + Math.sin(this.glowPulse * 2) * 0.3;
        const viewPorts = [
            { angle: -0.6, dist: tw / 2 - 5 },
            { angle: 0.6, dist: tw / 2 - 5 },
            { angle: Math.PI, dist: tw / 2 - 5 }
        ];
        viewPorts.forEach(vp => {
            ctx.beginPath();
            ctx.arc(
                Math.cos(vp.angle) * vp.dist,
                Math.sin(vp.angle) * vp.dist,
                2.5, 0, Math.PI * 2
            );
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Символ фазы на башне
        ctx.fillStyle = phase.glow;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.6 + Math.sin(this.glowPulse) * 0.4;
        ctx.fillText(phase.icon, 0, 0);
        ctx.globalAlpha = 1;
    }

    // ----- Дуло -----
    drawBarrel(ctx, phase) {
        const barrelLength = 40;
        const barrelWidth = 8;
        const muzzleWidth = 12;

        // Тень дула
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(this.width / 4 - 2, -barrelWidth / 2 + 3, barrelLength + 5, barrelWidth);

        // Основа дула
        const barrelGrad = ctx.createLinearGradient(this.width / 4, -barrelWidth / 2, this.width / 4, barrelWidth / 2);
        barrelGrad.addColorStop(0, '#555');
        barrelGrad.addColorStop(0.3, '#777');
        barrelGrad.addColorStop(0.7, '#555');
        barrelGrad.addColorStop(1, '#333');
        ctx.fillStyle = barrelGrad;
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.fillRect(this.width / 4, -barrelWidth / 2, barrelLength, barrelWidth);
        ctx.strokeRect(this.width / 4, -barrelWidth / 2, barrelLength, barrelWidth);

        // Кольца на дуле
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const ringX = this.width / 4 + 8 + i * 12;
            ctx.beginPath();
            ctx.moveTo(ringX, -barrelWidth / 2 - 1);
            ctx.lineTo(ringX, barrelWidth / 2 + 1);
            ctx.stroke();
        }

        // Дульный тормоз (расширение на конце)
        ctx.fillStyle = '#444';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        const muzzleX = this.width / 4 + barrelLength;
        ctx.fillRect(muzzleX, -muzzleWidth / 2, 8, muzzleWidth);
        ctx.strokeRect(muzzleX, -muzzleWidth / 2, 8, muzzleWidth);

        // Отверстия дульного тормоза
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(muzzleX + 4, -muzzleWidth / 2 + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(muzzleX + 4, muzzleWidth / 2 - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Свечение дула при стрельбе (мигающее)
        if (!this.isReloading) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(this.glowPulse * 5) * 0.2;
            const muzzleGlow = ctx.createRadialGradient(muzzleX + 8, 0, 0, muzzleX + 8, 0, 15);
            muzzleGlow.addColorStop(0, phase.glow);
            muzzleGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = muzzleGlow;
            ctx.beginPath();
            ctx.arc(muzzleX + 8, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ----- Щит перезарядки -----
    drawReloadShield(ctx) {
        const now = Date.now();
        const reloadProgress = 1 - Math.max(0, (this.reloadEndTime - now) / (bossReloadDuration * 1000));

        // Вращающийся пунктирный щит
        ctx.save();
        ctx.rotate(this.shieldRotation);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(this.glowPulse * 3) * 0.3;

        const shieldRadius = Math.max(this.width, this.height) / 2 + 12;
        const segments = 8;
        const segmentAngle = (Math.PI * 2) / segments;
        const gapAngle = segmentAngle * 0.3;

        for (let i = 0; i < segments; i++) {
            const startAngle = i * segmentAngle + gapAngle / 2;
            const endAngle = (i + 1) * segmentAngle - gapAngle / 2;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, startAngle, endAngle);
            ctx.stroke();
        }

        // Внутреннее кольцо прогресса перезарядки
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius - 6, -Math.PI / 2, -Math.PI / 2 + reloadProgress * Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Мерцающие точки на щите
        for (let i = 0; i < 6; i++) {
            const dotAngle = this.shieldRotation * 1.5 + (i / 6) * Math.PI * 2;
            const dotX = Math.cos(dotAngle) * (shieldRadius + 5);
            const dotY = Math.sin(dotAngle) * (shieldRadius + 5);
            ctx.fillStyle = '#0ff';
            ctx.globalAlpha = 0.4 + Math.sin(this.glowPulse * 4 + i) * 0.4;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ----- Вспышка урона -----
    drawDamageFlash(ctx) {
        ctx.save();
        ctx.globalAlpha = this.damageFlash * 0.6;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        this.roundRect(ctx, -this.width / 2 - 2, -this.height / 2 - 2, this.width + 4, this.height + 4, 5);
        ctx.fill();

        // Красные искры
        ctx.globalAlpha = this.damageFlash;
        for (let i = 0; i < 8; i++) {
            const sparkAngle = (i / 8) * Math.PI * 2 + this.glowPulse;
            const sparkDist = this.width / 2 + 10 + Math.random() * 15;
            const sparkX = Math.cos(sparkAngle) * sparkDist;
            const sparkY = Math.sin(sparkAngle) * sparkDist;
            ctx.fillStyle = Math.random() > 0.5 ? '#ff4444' : '#ffaa00';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.5 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // =============================================
    //     HUD ЭЛЕМЕНТЫ (без вращения)
    // =============================================

    // ----- Полоска здоровья -----
    drawHealthBar(ctx, healthRatio) {
        const barWidth = this.width + 30;
        const barHeight = 10;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 35;
        const cornerRadius = 4;

        // Фон полоски
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.roundRect(ctx, barX - 2, barY - 2, barWidth + 4, barHeight + 4, cornerRadius + 1);
        ctx.fill();
        ctx.stroke();

        // Фон (тёмно-красный)
        ctx.fillStyle = '#330000';
        ctx.beginPath();
        this.roundRect(ctx, barX, barY, barWidth, barHeight, cornerRadius);
        ctx.fill();

        // Градиент здоровья
        if (healthRatio > 0) {
            const healthWidth = barWidth * healthRatio;
            const healthGrad = ctx.createLinearGradient(barX, barY, barX + healthWidth, barY);

            if (healthRatio > 0.6) {
                healthGrad.addColorStop(0, '#ff2222');
                healthGrad.addColorStop(0.5, '#ff4444');
                healthGrad.addColorStop(1, '#cc0000');
            } else if (healthRatio > 0.3) {
                healthGrad.addColorStop(0, '#ff6600');
                healthGrad.addColorStop(0.5, '#ff8800');
                healthGrad.addColorStop(1, '#cc5500');
            } else {
                // Мигание при низком здоровье
                const flash = Math.sin(this.glowPulse * 5) > 0;
                healthGrad.addColorStop(0, flash ? '#ff0000' : '#aa0000');
                healthGrad.addColorStop(1, flash ? '#cc0000' : '#660000');
            }

            ctx.fillStyle = healthGrad;
            ctx.beginPath();
            this.roundRect(ctx, barX, barY, healthWidth, barHeight, cornerRadius);
            ctx.fill();

            // Блик на полоске здоровья
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            this.roundRect(ctx, barX, barY, healthWidth, barHeight / 2, cornerRadius);
            ctx.fill();
        }

        // Разделители (каждые 10%)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const divX = barX + (barWidth / 10) * i;
            ctx.beginPath();
            ctx.moveTo(divX, barY);
            ctx.lineTo(divX, barY + barHeight);
            ctx.stroke();
        }

        // Текст здоровья
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const healthText = `$${Math.ceil(this.health)} / $${this.maxHealth}`;
        ctx.strokeText(healthText, barX + barWidth / 2, barY + barHeight / 2);
        ctx.fillText(healthText, barX + barWidth / 2, barY + barHeight / 2);

        // Название босса
        ctx.fillStyle = '#ff4444';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText('★ ФИНАЛЬНЫЙ БОСС ★', this.x, barY - 10);
        ctx.fillText('★ ФИНАЛЬНЫЙ БОСС ★', this.x, barY - 10);

        ctx.restore();
    }

    // ----- Индикатор фазы атаки -----
    drawPhaseIndicator(ctx, phase) {
        const indicatorX = this.x;
        const indicatorY = this.y + this.height / 2 + 25;
        const boxWidth = 90;
        const boxHeight = 20;

        ctx.save();

        // Фон индикатора
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = phase.glow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        this.roundRect(ctx, indicatorX - boxWidth / 2, indicatorY - boxHeight / 2, boxWidth, boxHeight, 6);
        ctx.fill();
        ctx.stroke();

        // Иконки всех трёх фаз
        const phaseSpacing = 22;
        const startX = indicatorX - phaseSpacing;

        for (let i = 0; i < 3; i++) {
            const px = startX + i * phaseSpacing;
            const py = indicatorY;
            const isActive = (i === this.attackPhase);
            const pc = this.phaseColors[i];

            // Фон иконки
            if (isActive) {
                ctx.fillStyle = pc.glow;
                ctx.globalAlpha = 0.3 + Math.sin(this.glowPulse * 3) * 0.2;
                ctx.beginPath();
                ctx.arc(px, py, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Иконка
            ctx.fillStyle = isActive ? pc.glow : '#555';
            ctx.font = isActive ? 'bold 12px Arial' : '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pc.icon, px, py);

            // Подчёркивание активной фазы
            if (isActive) {
                ctx.strokeStyle = pc.glow;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px - 6, py + 9);
                ctx.lineTo(px + 6, py + 9);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ----- Таймер фазы -----
    drawPhaseTimer(ctx, phase) {
        const timerX = this.x;
        const timerY = this.y + this.height / 2 + 45;
        const timerWidth = 60;
        const timerHeight = 4;
        const progress = this.phaseTimer / this.phaseDuration;

        ctx.save();

        // Фон таймера
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        this.roundRect(ctx, timerX - timerWidth / 2, timerY, timerWidth, timerHeight, 2);
        ctx.fill();

        // Прогресс
        const progWidth = timerWidth * progress;
        const timerGrad = ctx.createLinearGradient(
            timerX - timerWidth / 2, timerY,
            timerX - timerWidth / 2 + progWidth, timerY
        );
        timerGrad.addColorStop(0, phase.primary);
        timerGrad.addColorStop(1, phase.glow);
        ctx.fillStyle = timerGrad;
        ctx.beginPath();
        this.roundRect(ctx, timerX - timerWidth / 2, timerY, progWidth, timerHeight, 2);
        ctx.fill();

        // Текст фазы
        ctx.fillStyle = phase.glow;
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.globalAlpha = 0.8;
        ctx.fillText(phase.name, timerX, timerY + 6);
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    // ----- Индикатор перезарядки (текст) -----
    drawReloadIndicator(ctx) {
        const now = Date.now();
        const remaining = Math.max(0, (this.reloadEndTime - now) / 1000);

        if (remaining <= 0) {
            this.isReloading = false;
            return;
        }

        const reloadX = this.x;
        const reloadY = this.y - this.height / 2 - 55;

        ctx.save();

        // Мигающий фон
        const flashAlpha = 0.6 + Math.sin(this.glowPulse * 6) * 0.3;
        ctx.globalAlpha = flashAlpha;

        // Фон
        ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.roundRect(ctx, reloadX - 55, reloadY - 10, 110, 20, 5);
        ctx.fill();
        ctx.stroke();

        // Текст
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0ff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const reloadText = `⚡ УЯЗВИМ ${remaining.toFixed(1)}с ⚡`;
        ctx.strokeText(reloadText, reloadX, reloadY);
        ctx.fillText(reloadText, reloadX, reloadY);

        // Стрелки, указывающие на босса
        ctx.fillStyle = '#0ff';
        ctx.globalAlpha = flashAlpha;
        const arrowY = reloadY + 12;
        ctx.beginPath();
        ctx.moveTo(reloadX - 5, arrowY);
        ctx.lineTo(reloadX + 5, arrowY);
        ctx.lineTo(reloadX, arrowY + 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // ----- Анимация смены фазы -----
    drawPhaseTransition(ctx, phase) {
        ctx.save();

        // Расширяющееся кольцо
        const ringRadius = (1 - this.phaseTransitionAlpha) * 150;
        ctx.strokeStyle = phase.glow;
        ctx.lineWidth = 3 * this.phaseTransitionAlpha;
        ctx.globalAlpha = this.phaseTransitionAlpha * 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Второе кольцо (поменьше)
        const ringRadius2 = (1 - this.phaseTransitionAlpha) * 100;
        ctx.lineWidth = 2 * this.phaseTransitionAlpha;
        ctx.globalAlpha = this.phaseTransitionAlpha * 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, ringRadius2, 0, Math.PI * 2);
        ctx.stroke();

        // Текст новой фазы
        ctx.globalAlpha = this.phaseTransitionAlpha;
        ctx.fillStyle = phase.glow;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textY = this.y - this.height / 2 - 70 - (1 - this.phaseTransitionAlpha) * 20;
        ctx.strokeText(`$${phase.icon} $${phase.name} ${phase.icon}`, this.x, textY);
        ctx.fillText(`$${phase.icon} $${phase.name} ${phase.icon}`, this.x, textY);
        ctx.restore();
    }

    // =============================================
    //     УТИЛИТЫ
    // =============================================

    // Скруглённый прямоугольник
    roundRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        return ctx;
    }

    // Парсинг hex-цвета в RGB
    hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    // RGB в hex
    rgbToHex(r, g, b) {
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Линейная интерполяция цветов
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        t = Math.max(0, Math.min(1, t));
        return this.rgbToHex(
            c1.r + (c2.r - c1.r) * t,
            c1.g + (c2.g - c1.g) * t,
            c1.b + (c2.b - c1.b) * t
        );
    }

    // Затемнение цвета
    darkenColor(hex, amount) {
        const c = this.hexToRgb(hex);
        return this.rgbToHex(
            c.r * (1 - amount),
            c.g * (1 - amount),
            c.b * (1 - amount)
        );
    }

    // Осветление цвета
    lightenColor(hex, amount) {
        const c = this.hexToRgb(hex);
        return this.rgbToHex(
            c.r + (255 - c.r) * amount,
            c.g + (255 - c.g) * amount,
            c.b + (255 - c.b) * amount
        );
    }

    // =============================================
    //     КОЛЛИЗИИ
    // =============================================

    // Проверка столкновения с точкой
    containsPoint(px, py) {
        return (
            px >= this.x - this.width / 2 &&
            px <= this.x + this.width / 2 &&
            py >= this.y - this.height / 2 &&
            py <= this.y + this.height / 2
        );
    }

    // Проверка столкновения с прямоугольником
    intersectsRect(rx, ry, rw, rh) {
        return !(
            this.x + this.width / 2 < rx ||
            this.x - this.width / 2 > rx + rw ||
            this.y + this.height / 2 < ry ||
            this.y - this.height / 2 > ry + rh
        );
    }

    // Получить AABB
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}