class LaserExplosion {
    constructor(owner) {
        this.owner = owner;
        this.name = 'Цепной лазер';
        this.description = 'Активно: лазерные лучи вокруг игрока. Пассивно: лазер отскакивает между врагами';
        this.hasChainLaser = false;
        this.level = 0;

        // === Passive chain laser stats ===
        this.chainMaxBounces = 0;       // Количество отскоков (пассивка)
        this.chainBounceRange = 250;    // Дальность поиска следующей цели
        this.chainDamageReduction = 0.4; // Уменьшение урона при каждом отскоке (40%)

        // === Active ability stats ===
        this.activeDamage = 80;         // Урон каждого луча активной способности
        this.activeRayCount = 3;        // Количество лучей вокруг игрока
        this.activeRange = 350;         // Дальность лучей активной способности
        this.cooldown = 8000;           // Перезарядка активной способности
        this.lastUseTime = -Infinity;   // Время последнего использования

        // === Runtime state ===
        this.chainLasers = [];          // Массив активных цепных лазеров (пассивка)
        this.activeBeams = [];          // Массив лучей активной способности
        this.activeExplosionEffects = []; // Визуальные эффекты активной способности

        this.upgradeSkillButton = new UpgradeSkillButton(400, 0);
    }

    canUpdate() {
        return this.level < 5;
    }

    /**
     * Updates the skill stats based on current level.
     */
    updateLevel() {
        this.level++;
        this.level = Math.min(5, Math.max(1, this.level));

        // === Пассивные бонусы (цепной отскок) ===
        // Количество отскоков: ур1=1, ур2=1, ур3=2, ур4=2, ур5=3
        this.chainMaxBounces = Math.floor((this.level + 1) / 2);

        // Дальность поиска цели для отскока
        this.chainBounceRange = 250 + (this.level - 1) * 30;

        // Уменьшение потери урона при отскоке: 40% -> 35% -> 30% -> 25% -> 20%
        this.chainDamageReduction = Math.max(0.2, 0.4 - (this.level - 1) * 0.05);

        // === Активные бонусы (лучи вокруг игрока) ===
        // Количество лучей: ур1=3, ур2=4, ур3=5, ур4=6, ур5=8
        const rayCountMap = [0, 3, 4, 5, 6, 8];
        this.activeRayCount = rayCountMap[this.level] || 3;

        // Урон каждого луча
        this.activeDamage = 60 + this.level * 20;

        // Дальность лучей
        this.activeRange = 300 + this.level * 50;

        // Перезарядка: 8с -> 7с -> 6с -> 5.5с -> 5с
        const cooldownMap = [0, 8000, 7000, 6000, 5500, 5000];
        this.cooldown = cooldownMap[this.level] || 8000;
    }

    // ==========================================
    //  ACTIVE ABILITY: Лазерные лучи вокруг игрока
    // ==========================================

    /**
     * Checks if the active ability is ready to use.
     * @returns {boolean}
     */
    isActiveReady() {
        return this.level > 0 && (Date.now() - this.lastUseTime) >= this.cooldown;
    }

    /**
     * Activates the ability: creates laser rays around the player hitting enemies.
     * Called when the player presses the ability key.
     */
    activate() {
        if (!this.isActiveReady()) return false;

        this.lastUseTime = Date.now();

        const playerX = this.owner.x;
        const playerY = this.owner.y;

        // Собираем врагов в радиусе действия
        const enemiesInRange = this.getEnemiesInRange(playerX, playerY, this.activeRange);

        // Определяем углы для лучей
        const rayAngles = [];
        const targetedEnemies = [];

        // Сначала нацеливаемся на ближайших врагов
        // Сортируем врагов по расстоянию
        enemiesInRange.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - playerX, 2) + Math.pow(a.y - playerY, 2));
            const distB = Math.sqrt(Math.pow(b.x - playerX, 2) + Math.pow(b.y - playerY, 2));
            return distA - distB;
        });

        // Назначаем лучи на врагов (сколько можем)
        for (let i = 0; i < Math.min(this.activeRayCount, enemiesInRange.length); i++) {
            const enemy = enemiesInRange[i];
            const angle = Math.atan2(enemy.y - playerY, enemy.x - playerX);
            rayAngles.push({ angle: angle, targeted: true, enemy: enemy });
            targetedEnemies.push(enemy);
        }

        // Оставшиеся лучи распределяем равномерно
        const remainingRays = this.activeRayCount - rayAngles.length;
        if (remainingRays > 0) {
            const baseAngle = this.owner.angle || 0;
            const totalSlots = remainingRays;
            for (let i = 0; i < totalSlots; i++) {
                const angle = baseAngle + (Math.PI * 2 / totalSlots) * i +
                    (Math.PI * 2 / (totalSlots * 2)); // Смещение чтобы не совпадать с целевыми
                rayAngles.push({ angle: angle, targeted: false, enemy: null });
            }
        }

        // Создаём лучи
        for (const rayInfo of rayAngles) {
            const beam = new ActiveLaserBeam(
                playerX, playerY,
                rayInfo.angle,
                this.activeDamage,
                this.activeRange,
                rayInfo.targeted ? rayInfo.enemy : null,
                this
            );
            this.activeBeams.push(beam);
        }

        // Создаём центральный визуальный эффект
        this.createActivationEffect(playerX, playerY);

        // Звук активации
        if (typeof soundManager !== 'undefined' && typeof soundManager.playSound === 'function') {
            soundManager.playSound('laserAbility');
        }

        return true;
    }

    /**
     * Gets all active enemies within a given range.
     * @param {number} x - Center x.
     * @param {number} y - Center y.
     * @param {number} range - Search radius.
     * @returns {Array} Array of enemies in range.
     */
    getEnemiesInRange(x, y, range) {
        const result = [];
        if (typeof enemies === 'undefined') return result;

        enemies.forEach(enemy => {
            if (enemy.active) {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2)
                );
                if (dist <= range) {
                    result.push(enemy);
                }
            }
        });

        return result;
    }

    /**
     * Creates a visual burst effect at the player's position when ability activates.
     * @param {number} x - Player x.
     * @param {number} y - Player y.
     */
    createActivationEffect(x, y) {
        this.activeExplosionEffects.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: 60,
            alpha: 1.0,
            expansionSpeed: 200,
            life: 1.0,
            color: '#00ffff'
        });

        // Второе кольцо с задержкой
        this.activeExplosionEffects.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 40,
            alpha: 0.8,
            expansionSpeed: 150,
            life: 0.8,
            delay: 0.05,
            color: '#ffffff'
        });

        // Частицы
        if (typeof visualEffects !== 'undefined' && visualEffects.particles) {
            for (let i = 0; i < this.activeRayCount * 3; i++) {
                const angle = (Math.PI * 2 / (this.activeRayCount * 3)) * i;
                visualEffects.particles.push(new Particle(x, y, '#00ffff', {
                    vx: Math.cos(angle) * (80 + Math.random() * 60),
                    vy: Math.sin(angle) * (80 + Math.random() * 60),
                    life: 500 + Math.random() * 300,
                    size: 2 + Math.random() * 3
                }));
            }
        }
    }

    // ==========================================
    //  PASSIVE ABILITY: Цепной отскок лазера
    // ==========================================

    /**
     * Called from PlayerTank when the laser hits an enemy.
     * Creates a chain bounce to the nearest enemy.
     * @param {number} hitX - The x-coordinate where the laser hit.
     * @param {number} hitY - The y-coordinate where the laser hit.
     * @param {number} initialDamage - The damage of the initial laser hit.
     * @param {number} originalAngle - The angle of the initial laser beam.
     * @param {Array} alreadyHitEnemies - Array of enemies already hit in this chain.
     * @returns {ChainLaserBeam|null} The new chain laser beam, or null if no target found.
     */
    onLaserHit(hitX, hitY, initialDamage, originalAngle, alreadyHitEnemies = []) {
        if (!this.hasChainLaser || this.chainMaxBounces <= 0) return null;

        return this.createChainBounce(
            hitX, hitY,
            initialDamage,
            originalAngle,
            1, // Первый отскок
            alreadyHitEnemies
        );
    }

    /**
     * Creates a chain bounce from a hit position.
     * @param {number} fromX - Origin x.
     * @param {number} fromY - Origin y.
     * @param {number} previousDamage - Damage of the previous hit.
     * @param {number} previousAngle - Angle of the previous beam.
     * @param {number} bounceNumber - Current bounce number (1-based).
     * @param {Array} alreadyHitEnemies - Enemies already hit in this chain.
     * @returns {ChainLaserBeam|null}
     */
    createChainBounce(fromX, fromY, previousDamage, previousAngle, bounceNumber, alreadyHitEnemies) {
        if (bounceNumber > this.chainMaxBounces) return null;

        // Находим ближайшего врага, исключая уже поражённых
        const nearestEnemy = this.findNearestEnemy(fromX, fromY, alreadyHitEnemies);

        if (!nearestEnemy) return null;

        // Вычисляем угол к следующей цели
        const angle = Math.atan2(
            nearestEnemy.y - fromY,
            nearestEnemy.x - fromX
        );

        // Рассчитываем уменьшенный урон
        const bounceDamage = previousDamage * (1 - this.chainDamageReduction);

        // Создаём цепной луч
        const chainLaser = new ChainLaserBeam(
            fromX, fromY,
            angle,
            bounceDamage,
            bounceNumber,
            this.chainMaxBounces,
            this,
            [...alreadyHitEnemies] // Копируем массив уже поражённых
        );

        this.chainLasers.push(chainLaser);
        return chainLaser;
    }

    /**
     * Finds the nearest active enemy within bounce range, excluding already hit enemies.
     * @param {number} x - The center x-coordinate.
     * @param {number} y - The center y-coordinate.
     * @param {Array} excludeEnemies - Enemies to exclude from search.
     * @returns {Enemy|null} The nearest enemy or null.
     */
    findNearestEnemy(x, y, excludeEnemies = []) {
        let nearestEnemy = null;
        let nearestDist = Infinity;

        if (typeof enemies === 'undefined') return null;

        enemies.forEach(enemy => {
            if (!enemy.active) return;

            // Проверяем, не был ли враг уже поражён в этой цепочке
            if (excludeEnemies.includes(enemy)) return;

            const dist = Math.sqrt(
                Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2)
            );

            if (dist < this.chainBounceRange && dist < nearestDist && dist > 10) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });

        return nearestEnemy;
    }

    // ==========================================
    //  UPDATE & DRAW
    // ==========================================

    /**
     * Updates all visual effects and beams.
     * @param {number} deltaTime - The time since the last frame in seconds.
     */
    updateVisualEffects(deltaTime) {
        // Обновляем цепные лазеры (пассивка)
        if (this.chainLasers) {
            this.chainLasers = this.chainLasers.filter(laser => {
                laser.update(deltaTime);
                return laser.active;
            });
        }

        // Обновляем активные лучи (активная способность)
        // Обновляем активные лучи (активная способность)
        if (this.activeBeams) {
            this.activeBeams = this.activeBeams.filter(beam => {
                beam.update(deltaTime);
                return beam.active;
            });
        }

        // Обновляем визуальные эффекты активации
        if (this.activeExplosionEffects) {
            this.activeExplosionEffects = this.activeExplosionEffects.filter(effect => {
                if (effect.delay && effect.delay > 0) {
                    effect.delay -= deltaTime;
                    return true;
                }

                effect.radius += effect.expansionSpeed * deltaTime;
                effect.life -= deltaTime * 2.5;
                effect.alpha = Math.max(0, effect.life);

                return effect.life > 0;
            });
        }
    }

   drawCooldownIndicator() {
    const now = Date.now();
    const elapsed = now - this.lastUseTime;
    const cooldownProgress = Math.min(1, elapsed / this.cooldown);
    const isReady = cooldownProgress >= 1;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const indicatorX = 400;
    const indicatorY = typeof canvas !== 'undefined' ? canvas.height - 60 : 560;
    ctx.translate(indicatorX, indicatorY);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isReady ? '#00666a' : '#333';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Icon — лучи из центра
    ctx.strokeStyle = isReady ? '#ffffff' : '#666';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const iconRays = Math.min(this.activeRayCount, 6);
    for (let i = 0; i < iconRays; i++) {
        const angle = (Math.PI * 2 / iconRays) * i - Math.PI / 2;
        const innerR = 4;
        const outerR = 12;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.stroke();
    }

    // Центральная точка
    ctx.fillStyle = isReady ? '#ffffff' : '#666';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    if (isReady) {
        const pulse = Math.sin(now * 0.003) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Cooldown Progress
    if (cooldownProgress < 1) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cooldownProgress));
        ctx.stroke();

        const remainingTime = Math.ceil((this.cooldown - elapsed) / 1000);
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        ctx.fillText(remainingTime + 's', 0, 28);
    }

    // Activation key [C]
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = isReady ? '#fff' : '#888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#000';
    ctx.fillText('[C]', 0, -25);

    ctx.restore();
}

    /**
     * Draws activation explosion effects.
     */
    drawActivationEffects() {
        if (!this.activeExplosionEffects) return;

        ctx.save();
        this.activeExplosionEffects.forEach(effect => {
            if (effect.delay && effect.delay > 0) return;

            // Кольцо расширения
            ctx.strokeStyle = effect.color || '#00ffff';
            ctx.globalAlpha = effect.alpha * 0.6;
            ctx.lineWidth = 3 * effect.alpha;
            ctx.shadowBlur = 15;
            ctx.shadowColor = effect.color || '#00ffff';
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Внутреннее свечение
            const gradient = ctx.createRadialGradient(
                effect.x, effect.y, 0,
                effect.x, effect.y, effect.radius
            );
            gradient.addColorStop(0, `rgba(0, 255, 255, ${effect.alpha * 0.3})`);
            gradient.addColorStop(0.7, `rgba(0, 255, 255, ${effect.alpha * 0.1})`);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    /**
     * Main draw function for the skill.
     */
    draw() {
        // Рисуем эффекты активации
        this.drawActivationEffects();

        // Рисуем активные лучи способности
        if (this.activeBeams) {
            this.activeBeams.forEach(beam => beam.draw());
        }

        // Рисуем цепные лазеры (пассивка)
        if (this.chainLasers) {
            this.chainLasers.forEach(laser => laser.draw());
        }

        // Рисуем UI
        if (this.level > 0 || this.owner.skillPoints > 0) {
            this.drawCooldownIndicator();
            this.upgradeSkillButton.y = canvas.height - 110;
            this.upgradeSkillButton.draw(this.level, 5, this.owner.skillPoints);
        }
    }

    /**
     * Checks if the upgrade button was clicked.
     * @param {number} clickX - The x-coordinate of the click.
     * @param {number} clickY - The y-coordinate of the click.
     * @returns {boolean} True if the upgrade was successful.
     */
    checkUpgradeClick(clickX, clickY) {
        if (this.upgradeSkillButton.checkClick(clickX, clickY, this.level, 5, this.owner.skillPoints)) {
            this.upgrade();
            return true;
        }
        return false;
    }

    /**
     * Upgrades the skill to the next level.
     */
    upgrade() {
        if (this.owner.skillPoints > 0 && this.level < 5) {
            this.owner.skillPoints--;

            if (this.level === 0) {
                this.hasChainLaser = true;
                this.level = 1;

                // Начальные значения пассивки
                this.chainMaxBounces = 1;
                this.chainBounceRange = 250;
                this.chainDamageReduction = 0.4;

                // Начальные значения активной способности
                this.activeRayCount = 3;
                this.activeDamage = 80;
                this.activeRange = 350;
                this.cooldown = 8000;
                this.lastUseTime = -Infinity;
            } else {
                this.updateLevel();
            }

            if (typeof soundManager !== 'undefined' && typeof soundManager.playLevelUp === 'function') {
                soundManager.playLevelUp();
            }
        }
    }

    /**
     * Returns a description of the current and next level stats.
     * @returns {Object} Object with current and next level info.
     */
    getStatsDescription() {
        const current = {
            level: this.level,
            activeRayCount: this.activeRayCount,
            activeDamage: this.activeDamage,
            activeRange: this.activeRange,
            cooldown: this.cooldown / 1000,
            chainBounces: this.chainMaxBounces,
            chainDamageReduction: Math.round(this.chainDamageReduction * 100),
            chainRange: this.chainBounceRange
        };

        let next = null;
        if (this.level < 5) {
            const nextLevel = this.level + 1;
            const rayCountMap = [0, 3, 4, 5, 6, 8];
            const cooldownMap = [0, 8000, 7000, 6000, 5500, 5000];
            next = {
                level: nextLevel,
                activeRayCount: rayCountMap[nextLevel],
                activeDamage: 60 + nextLevel * 20,
                activeRange: 300 + nextLevel * 50,
                cooldown: cooldownMap[nextLevel] / 1000,
                chainBounces: Math.floor((nextLevel + 1) / 2),
                chainDamageReduction: Math.round(Math.max(0.2, 0.4 - (nextLevel - 1) * 0.05) * 100),
                chainRange: 250 + (nextLevel - 1) * 30
            };
        }

        return { current, next };
    }
}

// ==========================================
//  ActiveLaserBeam — луч активной способности
// ==========================================

/**
 * Represents a laser beam fired by the active ability (radial burst around player).
 */
class ActiveLaserBeam {
    constructor(startX, startY, angle, damage, range, targetEnemy, skill) {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.angle = angle;
        this.damage = damage;
        this.range = range;
        this.targetEnemy = targetEnemy; // Может быть null если луч ненаправленный
        this.skill = skill;

        this.speed = 1200;
        this.currentDistance = 0;
        this.active = true;
        this.life = 1.0;
        this.hasHitTarget = false;

        // Если есть цель, корректируем угол к ней
        if (this.targetEnemy && this.targetEnemy.active) {
            this.angle = Math.atan2(
                this.targetEnemy.y - startY,
                this.targetEnemy.x - startX
            );
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        // Визуальный след
        this.trail = [{ x: startX, y: startY }];
        this.maxTrailLength = 15;

        // Ширина луча (визуально толще чем цепной)
        this.beamWidth = 6;

        // Цвет (слегка отличается от цепного для различения)
        this.coreColor = '#ffffff';
        this.glowColor = '#00ffff';
        this.outerGlowColor = '#0088ff';

        // Время жизни луча
        this.maxLifeTime = 0.6; // секунды
        this.elapsedTime = 0;

        // Флаг — луч уже нанёс весь урон при касании (instant hit)
        this.instantHit = false;

        // Для мгновенного попадания: рассчитываем конечную точку
        this.endX = startX + Math.cos(this.angle) * range;
        this.endY = startY + Math.sin(this.angle) * range;

        // Проверяем стены на пути
        this.calculateEndPoint();

        // Мгновенно наносим урон
        this.performInstantHit();
    }

    /**
     * Calculates the actual end point considering walls.
     */
    calculateEndPoint() {
        if (typeof walls === 'undefined') return;

        const steps = 50;
        const dx = (this.endX - this.startX) / steps;
        const dy = (this.endY - this.startY) / steps;

        for (let i = 1; i <= steps; i++) {
            const checkX = this.startX + dx * i;
            const checkY = this.startY + dy * i;

            for (const wall of walls) {
                if (wall.checkCollisionWithCircle(checkX, checkY, 3)) {
                    this.endX = this.startX + dx * (i - 1);
                    this.endY = this.startY + dy * (i - 1);
                    this.range = Math.sqrt(
                        Math.pow(this.endX - this.startX, 2) +
                        Math.pow(this.endY - this.startY, 2)
                    );
                    return;
                }
            }
        }
    }

    /**
     * Performs instant hit detection along the beam path.
     */
    performInstantHit() {
        if (typeof enemies === 'undefined') return;

        const hitEnemies = [];

        // Проверяем всех врагов на пути луча
        enemies.forEach(enemy => {
            if (!enemy.active) return;

            // Проверяем расстояние от врага до линии луча
            const dist = this.pointToLineDistance(
                enemy.x, enemy.y,
                this.startX, this.startY,
                this.endX, this.endY
            );

            // Проверяем что враг находится между начальной и конечной точкой
            const enemyDist = Math.sqrt(
                Math.pow(enemy.x - this.startX, 2) + Math.pow(enemy.y - this.startY, 2)
            );

            const hitRadius = (enemy.width || 30) / 2 + this.beamWidth;

            if (dist < hitRadius && enemyDist <= this.range + hitRadius) {
                // Проверяем что враг находится "впереди" луча, а не позади
                const dotProduct =
                    (enemy.x - this.startX) * Math.cos(this.angle) +
                    (enemy.y - this.startY) * Math.sin(this.angle);

                if (dotProduct > 0) {
                    hitEnemies.push({ enemy: enemy, dist: enemyDist });
                }
            }
        });

        // Сортируем по расстоянию (ближайшие первые)
        hitEnemies.sort((a, b) => a.dist - b.dist);

        // Наносим урон первому врагу на пути (или всем, в зависимости от дизайна)
        // Здесь бьём первого врага на пути луча
        if (hitEnemies.length > 0) {
            const hitInfo = hitEnemies[0];
            const enemy = hitInfo.enemy;

            enemy.takeDamageBySkill(this.damage);

            if (typeof statManager !== 'undefined') {
                statManager.damageByLaser = (statManager.damageByLaser || 0) + this.damage;
            }

            if (!enemy.active && typeof enemyDead === 'function') {
                enemyDead(enemy.x, enemy.y);
            }

            // Создаём эффект попадания
            this.createHitEffect(enemy.x, enemy.y);

            // Обрезаем луч до точки попадания
            this.endX = enemy.x;
            this.endY = enemy.y;

            this.hasHitTarget = true;
            this.instantHit = true;
        }
    }

    /**
     * Calculates the distance from a point to a line segment.
     * @param {number} px - Point x.
     * @param {number} py - Point y.
     * @param {number} x1 - Line start x.
     * @param {number} y1 - Line start y.
     * @param {number} x2 - Line end x.
     * @param {number} y2 - Line end y.
     * @returns {number} Distance from point to line segment.
     */
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            return Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2));
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;

        return Math.sqrt(Math.pow(px - nearestX, 2) + Math.pow(py - nearestY, 2));
    }

    /**
     * Creates a visual effect at the hit location.
     * @param {number} x - Hit x.
     * @param {number} y - Hit y.
     */
    createHitEffect(x, y) {
        if (typeof visualEffects === 'undefined') return;

        if (visualEffects.particles) {
            // Искры при попадании
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.3;
                const speed = 60 + Math.random() * 80;
                visualEffects.particles.push(new Particle(x, y, '#00ffff', {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 300 + Math.random() * 200,
                    size: 2 + Math.random() * 3
                }));
            }

            // Кольцо попадания
            visualEffects.particles.push(new Particle(x, y, '#00ffff', {
                life: 250,
                size: 25,
                isRing: true,
                expansionSpeed: 120
            }));

            // Яркая вспышка
            visualEffects.particles.push(new Particle(x, y, '#ffffff', {
                life: 150,
                size: 15,
                isRing: false,
                shrink: true
            }));
        }
    }

    /**
     * Updates the beam state (mostly visual fade).
     * @param {number} deltaTime - Time since last frame in seconds.
     */
    update(deltaTime) {
        if (!this.active) return;

        this.elapsedTime += deltaTime;

        // Анимация "роста" луча в первые кадры
        this.life = 1.0 - (this.elapsedTime / this.maxLifeTime);

        if (this.life <= 0) {
            this.active = false;
            return;
        }
    }

    /**
     * Draws the active ability laser beam.
     */
    draw() {
        if (!this.active) return;

        ctx.save();

        const progress = Math.min(1, this.elapsedTime / 0.08); // Быстрое появление за 80мс
        const fadeOut = Math.max(0, this.life);

        // Рассчитываем текущую видимую конечную точку (анимация роста)
        const currentEndX = this.startX + (this.endX - this.startX) * progress;
        const currentEndY = this.startY + (this.endY - this.startY) * progress;

        // Внешнее свечение (широкое)
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.strokeStyle = `rgba(0, 136, 255, ${fadeOut * 0.3})`;
        ctx.lineWidth = (this.beamWidth * 4) * fadeOut;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.outerGlowColor;
        ctx.stroke();

        // Среднее свечение
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.strokeStyle = `rgba(0, 255, 255, ${fadeOut * 0.6})`;
        ctx.lineWidth = (this.beamWidth * 2) * fadeOut;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.glowColor;
        ctx.stroke();

        // Ядро луча (яркое белое)
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${fadeOut * 0.9})`;
        ctx.lineWidth = this.beamWidth * fadeOut;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();

        // Точка в конце луча
        if (progress >= 1) {
            ctx.beginPath();
            ctx.arc(currentEndX, currentEndY, (this.beamWidth + 2) * fadeOut, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${fadeOut * 0.8})`;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ffff';
            ctx.fill();
        }

        // Точка в начале луча (у игрока)
        ctx.beginPath();
        ctx.arc(this.startX, this.startY, (this.beamWidth * 0.8) * fadeOut, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${fadeOut * 0.5})`;
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
//  ChainLaserBeam — цепной луч (пассивная способность)
// ==========================================

/**
 * Represents a single beam in the chain laser effect (passive ability).
 */
class ChainLaserBeam {
    constructor(x, y, angle, damage, currentBounce, maxBounces, skill, alreadyHitEnemies) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.currentBounce = currentBounce;
        this.maxBounces = maxBounces;
        this.skill = skill;
        this.alreadyHitEnemies = alreadyHitEnemies || [];

        this.speed = 1000;
        this.range = skill.chainBounceRange + 50;
        this.currentDistance = 0;
        this.active = true;
        this.life = 1.0;
        this.hasHitTarget = false;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.trail = [{ x: x, y: y }];
        this.maxTrailLength = 12;

        // Цвет зависит от номера отскока (становится более тусклым)
        this.alphaMultiplier = Math.pow(0.8, currentBounce - 1);
    }

    /**
     * Updates the laser beam's position and state.
     * @param {number} deltaTime - The time since the last frame in seconds.
     */
    update(deltaTime) {
        if (!this.active) return;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.currentDistance += this.speed * deltaTime;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Проверка столкновения со стенами
        if (this.checkWallCollision()) {
            this.active = false;
            return;
        }

        // Проверка столкновения с врагами
        if (!this.hasHitTarget) {
            this.checkEnemyCollision();
        }

        // Проверка границ и дальности
        if (this.isOutOfBounds() || this.currentDistance > this.range) {
            this.active = false;
            return;
        }

        this.life -= deltaTime * 2;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    /**
     * Checks for collision with walls.
     * @returns {boolean} True if hit a wall.
     */
    checkWallCollision() {
        if (typeof walls === 'undefined') return false;
        for (const wall of walls) {
            if (wall.checkCollisionWithCircle(this.x, this.y, 3)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks for collision with enemies.
     */
    checkEnemyCollision() {
        if (typeof enemies === 'undefined') return;
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            // Пропускаем уже поражённых врагов
            if (this.alreadyHitEnemies.includes(enemy)) continue;

            const dist = Math.sqrt(
                Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2)
            );

            const hitRadius = (enemy.width || 30) / 2;

            if (dist < hitRadius) {
                this.hitEnemy(enemy);
                break;
            }
        }
    }

    /**
     * Checks if the laser is out of world bounds.
     * @returns {boolean} True if out of bounds.
     */
    isOutOfBounds() {
        return this.x < 0 || this.x > WORLD_WIDTH || this.y < 0 || this.y > WORLD_HEIGHT;
    }

    /**
     * Handles hitting an enemy.
     * @param {Enemy} enemy - The enemy that was hit.
     */
    hitEnemy(enemy) {
        this.hasHitTarget = true;

        enemy.takeDamageBySkill(this.damage);

        if (typeof statManager !== 'undefined') {
            statManager.damageByLaser = (statManager.damageByLaser || 0) + this.damage;
        }

        if (!enemy.active && typeof enemyDead === 'function') {
            enemyDead(enemy.x, enemy.y);
        }

        this.createHitEffect(enemy.x, enemy.y);

        // Добавляем врага в список поражённых
        this.alreadyHitEnemies.push(enemy);

        // Создаём следующий отскок если возможно
        if (this.currentBounce < this.maxBounces) {
            this.skill.createChainBounce(
                enemy.x, enemy.y,
                this.damage,
                this.angle,
                this.currentBounce + 1,
                this.alreadyHitEnemies
            );
        }

        this.active = false;
    }

    /**
     * Creates a visual effect at the hit location.
     * @param {number} x - The x-coordinate of the hit.
     * @param {number} y - The y-coordinate of the hit.
     */
    createHitEffect(x, y) {
        if (typeof visualEffects === 'undefined') return;

        if (visualEffects.particles) {
            // Искры
            const sparkCount = Math.max(3, 6 - this.currentBounce);
            for (let i = 0; i < sparkCount; i++) {
                const angle = (Math.PI * 2 / sparkCount) * i;
                const speed = 40 + Math.random() * 50;
                visualEffects.particles.push(new Particle(x, y, '#00ffff', {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 250 + Math.random() * 150,
                    size: 2 + Math.random() * 2
                }));
            }

            // Кольцо (уменьшается с каждым отскоком)
            const ringSize = Math.max(10, 25 - this.currentBounce * 5);
            visualEffects.particles.push(new Particle(x, y, '#00ffff', {
                life: 200,
                size: ringSize,
                isRing: true,
                expansionSpeed: 100
            }));
        }
    }

    /**
     * Draws the chain laser beam.
     */
    draw() {
        if (!this.active || this.trail.length < 2) return;

        ctx.save();

        const alpha = this.life * this.alphaMultiplier;

        // Рисуем след
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);

        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }

        // Внешнее свечение следа
        const gradient = ctx.createLinearGradient(
            this.startX, this.startY,
            this.x, this.y
        );
        gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha * 0.2})`);
        gradient.addColorStop(1, `rgba(0, 255, 255, ${alpha * 0.7})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6 * alpha;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Ядро следа (белое яркое)
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 2.5 * alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();

        // Голова луча (яркая точка на конце)
        const headGlowSize = 8 * alpha;
        const headGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, headGlowSize
        );
        headGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        headGradient.addColorStop(0.4, `rgba(0, 255, 255, ${alpha * 0.7})`);
        headGradient.addColorStop(1, `rgba(0, 255, 255, 0)`);

        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, headGlowSize, 0, Math.PI * 2);
        ctx.fill();

        // Маленькая яркая точка в центре головы
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2 * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Линия от начальной точки к текущей позиции (основной луч)
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.x, this.y);

        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.15})`;
        ctx.lineWidth = 10 * alpha;
        ctx.shadowBlur = 25;
        ctx.shadowColor = `rgba(0, 200, 255, ${alpha * 0.4})`;
        ctx.stroke();

        // Точка начала (откуда отскочил)
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.startX, this.startY, 4 * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Номер отскока (маленький индикатор для отладки — можно убрать)
        // ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        // ctx.font = '10px Arial';
        // ctx.fillText(`#${this.currentBounce}`, this.startX + 10, this.startY - 10);

        ctx.restore();
    }
}

// ==========================================
//  Пример интеграции с PlayerTank
// ==========================================

/*
 * В классе PlayerTank нужно добавить следующее:
 *
 * 1. Создание способности:
 *    this.laserAbility = new LaserExplosion(this);
 *
 * 2. В методе обработки клавиш (например, keydown):
 *    if (key === 'e' || key === 'E' || key === 'у' || key === 'У') {
 *        if (this.currentWeapon === 'laser' && this.laserAbility) {
 *            this.laserAbility.activate();
 *        }
 *    }
 *
 * 3. В методе update:
 *    if (this.laserAbility) {
 *        this.laserAbility.updateVisualEffects(deltaTime);
 *    }
 *
 * 4. В методе draw:
 *    if (this.laserAbility) {
 *        this.laserAbility.draw();
 *    }
 *
 * 5. При попадании лазера по врагу (в методе стрельбы лазером):
 *    if (this.laserAbility && this.laserAbility.hasChainLaser) {
 *        this.laserAbility.onLaserHit(
 *            enemy.x, enemy.y,
 *            laserDamage,
 *            this.angle,
 *            [enemy] // массив уже поражённых врагов
 *        );
 *    }
 *
 * 6. В обработке кликов мыши:
 *    if (this.laserAbility) {
 *        this.laserAbility.checkUpgradeClick(clickX, clickY);
 *    }
 */