// Tiger II (Königstiger) — элитный вражеский танк для этапа 3
// Оптимизированная версия с рикошетом и тактическим позиционированием
class Tiger2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 55;
        this.height = 48;
        this.speed = 65;
        this.health = 400;
        this.maxHealth = 400;
        this.damage = 60;
        this.angle = Math.random() * Math.PI * 2;
        this.bodyAngle = this.angle;
        this.targetBodyAngle = this.bodyAngle;
        this.bullets = [];
        this.lastShot = 0;
        this.shotCooldown = 1800;
        this.active = true;
        this.bulletSpeed = 500;
        this.accuracy = 0.92;
        this.trackOffset = 0;

        // === Рикошет ===
        this.ricochetAngle = 45; // Щедрый угол рикошета (25°)
        this.ricochetEffects = [];

        // === AI параметры (упрощённые) ===
        this.aiState = 'patrol';
        this.lastStateChange = Date.now();
        this.stateMinDuration = 1500;

        // Укрытие (кэшированное)
        this.coverPosition = null;
        this.currentCover = null;
        this.coverCheckTimer = 0;
        this.coverCheckInterval = 2.0; // Реже проверяем (2 сек вместо 0.8)
        this._cachedNearbyWalls = []; // Кэш ближайших стен
        this._wallCacheTimer = 0;
        this._wallCacheInterval = 1.5;

        // Уклонение
        this.dodgeDirection = 1;
        this.lastDodge = 0;
        this.dodgeCooldown = 400;

        // Патрулирование
        this.patrolTarget = null;
        this.patrolRadius = 200;

        // Обнаружение
        this.detectionRange = 500;
        this.attackRange = 400;
        this.retreatHealthThreshold = 0.25;

        // Стены
        this.wallDetectionRange = 70;
        this.avoidanceForce = { x: 0, y: 0 };

        // Повороты
        this.turnSpeed = 3.0;
        this.turretTurnSpeed = 4.0;

        // Фланг
        this.flankSide = Math.random() > 0.5 ? 1 : -1;

        // Рикошетное позиционирование — целевой угол корпуса для рикошета
        this.ricochetBodyAngle = 0;
        this.useRicochetAngling = false;

        // Вспышка
        this.muzzleFlashTimer = 0;
    }

    // === ПРОВЕРКА ПРЯМОЙ ВИДИМОСТИ ===
    hasLineOfSight(fromX, fromY, toX, toY, walls) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Значительно увеличиваем количество шагов для точной проверки
        const steps = Math.min(Math.ceil(dist / 20), 40); 

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const cx = fromX + dx * t;
            const cy = fromY + dy * t;

            // Проверяем прямое пересечение луча со всеми препятствиями
            for (let wall of walls) {
                const wHW = wall.width / 2;
                const wHH = wall.height / 2;
                if (cx >= wall.x - wHW && cx <= wall.x + wHW &&
                    cy >= wall.y - wHH && cy <= wall.y + wHH) {
                    return false;
                }
            }
        }
        return true;
    }

    // === КЭШ БЛИЖАЙШИХ СТЕН ===
    updateWallCache(walls, deltaTime) {
        // Мы используем кэш только для поиска укрытий, для стрельбы берем полный массив 
        // для предотвращения выстрелов "сквозь" стены.
        this._wallCacheTimer += deltaTime;
        if (this._wallCacheTimer < this._wallCacheInterval && this._cachedNearbyWalls.length > 0) return;
        this._wallCacheTimer = 0;

        this._cachedNearbyWalls = [];
        const range = 600;
        for (let wall of walls) {
            const dx = wall.x - this.x;
            const dy = wall.y - this.y;
            if (dx * dx + dy * dy < range * range) {
                this._cachedNearbyWalls.push(wall);
            }
        }
    }

    // === ПОИСК УКРЫТИЯ (оптимизированный — только ближайшие стены) ===
    findCoverPosition(playerX, playerY) {
        const walls = this._cachedNearbyWalls;
        if (walls.length === 0) return null;

        let bestCover = null;
        let bestScore = -Infinity;

        // Ограничиваем до 20 ближайших стен, т.к. многие будут отброшены
        const maxWalls = Math.min(walls.length, 20);
        for (let wi = 0; wi < maxWalls; wi++) {
            const wall = walls[wi];

            // Проверка на то, что это одиночная стена или небольшой кусок. 
            // Если это огромная глухая стена (например, граница карты), ИИ застрянет.
            let clusterSize = 0;
            for (let w of walls) {
                if ((w.x - wall.x)**2 + (w.y - wall.y)**2 < 22500) { // радиус 150px
                    clusterSize++;
                }
            }
            if (clusterSize > 4) continue; // Отбрасываем длинные массивы стен

            // Только 4 позиции вместо 8
            const offsets = [
                { dx: 0, dy: -(wall.height / 2 + 35) },
                { dx: 0, dy: (wall.height / 2 + 35) },
                { dx: -(wall.width / 2 + 35), dy: 0 },
                { dx: (wall.width / 2 + 35), dy: 0 },
            ];

            for (let offset of offsets) {
                const coverX = wall.x + offset.dx;
                const coverY = wall.y + offset.dy;

                const distToCover = Math.sqrt(
                    (coverX - this.x) ** 2 + (coverY - this.y) ** 2
                );
                const distCoverToPlayer = Math.sqrt(
                    (coverX - playerX) ** 2 + (coverY - playerY) ** 2
                );

                if (distToCover > 400 || distCoverToPlayer > 500 || distCoverToPlayer < 80) continue;

                // Быстрая проверка: не внутри стены
                let insideWall = false;
                for (let w of walls) {
                    if (coverX >= w.x - w.width / 2 && coverX <= w.x + w.width / 2 &&
                        coverY >= w.y - w.height / 2 && coverY <= w.y + w.height / 2) {
                        insideWall = true;
                        break;
                    }
                }
                if (insideWall) continue;

                // Простая оценка без hasLineOfSight (дорого)
                let score = -distToCover * 0.3 - Math.abs(distCoverToPlayer - 280) * 0.2;

                // Бонус если стена между нами и игроком
                const angleToPlayer = Math.atan2(playerY - wall.y, playerX - wall.x);
                const angleToCover = Math.atan2(offset.dy, offset.dx);
                const angleDiff = Math.abs(angleToPlayer - angleToCover);
                if (angleDiff > Math.PI * 0.5 && angleDiff < Math.PI * 1.5) {
                    score += 150; // Мы по другую сторону стены от игрока
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestCover = { x: coverX, y: coverY, wall: wall };
                }
            }
        }
        return bestCover;
    }

    // === ОБНАРУЖЕНИЕ СТЕН (простое) ===
    detectNearbyWalls(walls) {
        this.avoidanceForce.x = 0;
        this.avoidanceForce.y = 0;

        for (let wall of this._cachedNearbyWalls) {
            const closestX = Math.max(wall.x - wall.width / 2, Math.min(this.x, wall.x + wall.width / 2));
            const closestY = Math.max(wall.y - wall.height / 2, Math.min(this.y, wall.y + wall.height / 2));

            const edgeDx = this.x - closestX;
            const edgeDy = this.y - closestY;
            const edgeDist = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);

            if (edgeDist < this.wallDetectionRange && edgeDist > 0.1) {
                const force = (this.wallDetectionRange - edgeDist) / this.wallDetectionRange;
                this.avoidanceForce.x += (edgeDx / edgeDist) * force * 50;
                this.avoidanceForce.y += (edgeDy / edgeDist) * force * 50;
            }
        }
    }

    // === УКЛОНЕНИЕ ОТ ПУЛЬ (оптимизированное для танкового шасси) ===
    dodgeBullets(playerBullets, deltaTime, walls) {
        const now = Date.now();
        if (now - this.lastDodge < this.dodgeCooldown) return false;

        for (let bullet of playerBullets) {
            if (!bullet.active) continue;

            const bDx = bullet.x - this.x;
            const bDy = bullet.y - this.y;
            const bulletDistSq = bDx * bDx + bDy * bDy;

            if (bulletDistSq > 22500) continue; // > 150px

            // Летит ли к нам?
            const bvx = Math.cos(bullet.angle) * bullet.speed;
            const bvy = Math.sin(bullet.angle) * bullet.speed;
            const dot = -bDx * bvx + -bDy * bvy;
            if (dot <= 0) continue;

            // Расстояние пролёта
            const cross = Math.abs(-bDx * bvy - -bDy * bvx) / Math.sqrt(bvx * bvx + bvy * bvy);
            if (cross > 35) continue;

            // Настоящий танк не может стрейфиться боком!
            // Идеальное направление уклонения (перпендикулярно пуле)
            const dodgeAngle = bullet.angle + (Math.PI / 2) * this.dodgeDirection;
            
            // Смотрим, как летит пуля относительно нашего корпуса
            const moveX = Math.cos(this.bodyAngle);
            const moveY = Math.sin(this.bodyAngle);
            const dodgeDirX = Math.cos(dodgeAngle);
            const dodgeDirY = Math.sin(dodgeAngle);
            
            const projection = moveX * dodgeDirX + moveY * dodgeDirY;
            const movementDirection = projection >= 0 ? 1 : -1;
            
            const dodgeSpeed = movementDirection * this.speed * 2.5;

            this.x += moveX * dodgeSpeed * deltaTime;
            this.y += moveY * dodgeSpeed * deltaTime;
            this.trackOffset += Math.abs(dodgeSpeed) * deltaTime;

            this.dodgeDirection *= -1;
            this.lastDodge = now;
            return true;
        }
        return false;
    }

    // === РИКОШЕТНОЕ ПОЗИЦИОНИРОВАНИЕ ===
    // Tiger2 поворачивает корпус под углом к игроку, чтобы максимизировать рикошет
    calculateRicochetAngle(playerX, playerY) {
        const angleToPlayer = Math.atan2(playerY - this.y, playerX - this.x);
        // Ставим корпус под углом ~30-40° к линии огня игрока
        // Это делает лобовую броню наклонной → рикошет
        const ricochetOffset = (Math.PI / 5) * this.flankSide; // ~36°
        this.ricochetBodyAngle = angleToPlayer + ricochetOffset;
    }

    // === ДВИЖЕНИЕ ===
    moveTowards(targetX, targetY, deltaTime, walls, speedMul = 1.0) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) return;

        this.detectNearbyWalls(walls);

        // Идеальное направление движения (куда нам реально нужно попасть)
        let idealMoveX = (dx / dist) + this.avoidanceForce.x / this.speed;
        let idealMoveY = (dy / dist) + this.avoidanceForce.y / this.speed;
        let moveDirAngle = Math.atan2(idealMoveY, idealMoveX);

        // Танк всегда поворачивает корпус туда, куда едет
        this.targetBodyAngle = moveDirAngle;

        // Проверяем разницу между углом корпуса и направлением движения
        let angleDiff = moveDirAngle - this.bodyAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        let absAngleDiff = Math.abs(angleDiff);
        
        let speedFactor = 0;
        // Настоящий танк не может плавать боком. Он едет вперед.
        // Если угол расхождения маленький (< 75 градусов), мы едем вперед,
        // причем чем идеальнее смотрим - тем быстрее едем.
        // Иначе танк просто стоит и доварачивает корпус на месте.
        if (absAngleDiff < Math.PI * 0.42) {
            speedFactor = Math.cos(angleDiff);
        }

        const maxSpeed = this.speed * speedMul;
        const currentSpeed = maxSpeed * speedFactor;

        // ДВИЖЕНИЕ СТРОГО ПО ВЕКТОРУ КОРПУСА! Никакого "дрифта" или езды боком.
        let moveX = Math.cos(this.bodyAngle) * currentSpeed;
        let moveY = Math.sin(this.bodyAngle) * currentSpeed;

        this.x += moveX * deltaTime;
        this.y += moveY * deltaTime;
        
        // Вращение гусениц
        this.trackOffset += currentSpeed * deltaTime;
    }

    // === ПОВОРОТЫ ===
    updateBodyRotation(deltaTime) {
        let diff = this.targetBodyAngle - this.bodyAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        this.bodyAngle += diff * this.turnSpeed * deltaTime;
    }

    updateTurretRotation(targetX, targetY, deltaTime) {
        const target = Math.atan2(targetY - this.y, targetX - this.x);
        let diff = target - this.angle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        this.angle += diff * this.turretTurnSpeed * deltaTime;
    }

    // === СТРЕЛЬБА ===
    shoot(playerX, playerY, walls) {
        const now = Date.now();
        if (now - this.lastShot < this.shotCooldown) return;

        if (!this.hasLineOfSight(this.x, this.y, playerX, playerY, walls)) return;

        const dist = Math.sqrt((playerX - this.x) ** 2 + (playerY - this.y) ** 2);
        if (dist > this.attackRange) return;

        const shootAngle = Math.atan2(playerY - this.y, playerX - this.x);
        const spread = (1 - this.accuracy) * 0.15;
        const finalAngle = shootAngle + (Math.random() - 0.5) * spread;

        this.bullets.push(new Bullet(
            this.x + Math.cos(finalAngle) * 40,
            this.y + Math.sin(finalAngle) * 40,
            this.damage,
            finalAngle,
            'enemy',
            this.bulletSpeed
        ));

        this.lastShot = now;
        this.muzzleFlashTimer = 0.15;
    }

    // для способностей
    takeDamageBySkill(damage) {
        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }


    // === РИКОШЕТ (takeDamage) ===
    takeDamage(damage, bulletX, bulletY, bulletVX, bulletVY) {
        // Вычисляем угол попадания для рикошета
        let bulletFlightAngle;
        if (bulletVX !== undefined && bulletVY !== undefined) {
            bulletFlightAngle = Math.atan2(bulletVY, bulletVX);
        } else {
            bulletFlightAngle = Math.atan2(
                (bulletY || this.y) - this.y,
                (bulletX || this.x) - this.x
            );
        }

        const hitAngle = Math.atan2((bulletY || this.y) - this.y, (bulletX || this.x) - this.x);
        const relativeHitAngle = hitAngle - this.bodyAngle;
        const normalizedHitAngle = Math.atan2(Math.sin(relativeHitAngle), Math.cos(relativeHitAngle));

        // Определяем нормаль грани
        let surfaceNormal;
        if (Math.abs(normalizedHitAngle) <= Math.PI / 4) {
            surfaceNormal = this.bodyAngle;
        } else if (Math.abs(normalizedHitAngle) >= 3 * Math.PI / 4) {
            surfaceNormal = this.bodyAngle + Math.PI;
        } else if (normalizedHitAngle > 0) {
            surfaceNormal = this.bodyAngle + Math.PI / 2;
        } else {
            surfaceNormal = this.bodyAngle - Math.PI / 2;
        }

        // Угол от поверхности
        const incomingAngle = bulletFlightAngle + Math.PI;
        let impactAngle = incomingAngle - surfaceNormal;
        impactAngle = Math.atan2(Math.sin(impactAngle), Math.cos(impactAngle));
        const angleFromSurface = 90 - Math.abs(impactAngle * 180 / Math.PI);

        // Рикошет!
        if (angleFromSurface < this.ricochetAngle) {
            this.triggerRicochet(bulletX || this.x, bulletY || this.y, surfaceNormal);
            return; // Урон не проходит
        }

        // При получении урона — ищем укрытие
        if (this.aiState === 'patrol' || this.aiState === 'flank') {
            this.changeState('seek_cover');
        }

        this.health -= damage;
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
        }
    }

    // === ВИЗУАЛЬНЫЙ ЭФФЕКТ РИКОШЕТА ===
    triggerRicochet(bulletX, bulletY, surfaceNormal) {
        // Искры (меньше чем у игрока для производительности)
        for (let i = 0; i < 4; i++) {
            const sparkAngle = surfaceNormal + (Math.random() - 0.5) * Math.PI * 0.5;
            const sparkSpeed = 80 + Math.random() * 120;
            this.ricochetEffects.push({
                x: bulletX, y: bulletY,
                vx: Math.cos(sparkAngle) * sparkSpeed,
                vy: Math.sin(sparkAngle) * sparkSpeed,
                life: 0.25, maxLife: 0.25,
                size: 1.5 + Math.random() * 2,
                type: 'spark',
                color: Math.random() > 0.5 ? '#ffdd44' : '#ffaa00'
            });
        }

        // Вспышка
        this.ricochetEffects.push({
            x: bulletX, y: bulletY, vx: 0, vy: 0,
            life: 0.3, maxLife: 0.3, size: 15, type: 'flash'
        });

        // Текст
        this.ricochetEffects.push({
            x: bulletX, y: bulletY - 15, vx: 0, vy: -35,
            life: 0.8, maxLife: 0.8, size: 12,
            type: 'text', text: 'РИКОШЕТ!'
        });
    }

    updateRicochetEffects(deltaTime) {
        this.ricochetEffects = this.ricochetEffects.filter(e => {
            e.life -= deltaTime;
            e.x += e.vx * deltaTime;
            e.y += e.vy * deltaTime;
            if (e.type === 'spark') e.vy += 200 * deltaTime;
            return e.life > 0;
        });
    }

    // === AI ===
    updateAI(playerX, playerY, deltaTime, playerBullets, walls) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const now = Date.now();
        const timeSinceChange = now - this.lastStateChange;
        const healthRatio = this.health / this.maxHealth;

        // Кэш стен
        this.updateWallCache(walls, deltaTime);

        // Уклонение от пуль (приоритет)
        if (this.dodgeBullets(playerBullets, deltaTime, walls)) return;

        // Рикошетное позиционирование
        if (distance < this.attackRange) {
            this.calculateRicochetAngle(playerX, playerY);
            this.useRicochetAngling = true;
        } else {
            this.useRicochetAngling = false;
        }

        // Таймер укрытий
        this.coverCheckTimer += deltaTime;

        // Состояния
        switch (this.aiState) {
            case 'patrol': this.handlePatrol(playerX, playerY, distance, deltaTime, walls); break;
            case 'seek_cover': this.handleSeekCover(playerX, playerY, distance, deltaTime, walls); break;
            case 'attack_from_cover': this.handleAttackFromCover(playerX, playerY, distance, deltaTime, walls); break;
            case 'flank': this.handleFlank(playerX, playerY, distance, deltaTime, walls); break;
            case 'retreat': this.handleRetreat(playerX, playerY, distance, deltaTime, walls); break;
        }

        // Смена состояний
        if (timeSinceChange > this.stateMinDuration) {
            if (healthRatio < this.retreatHealthThreshold && this.aiState !== 'retreat') {
                this.changeState('retreat');
            } else if (distance < this.detectionRange && this.aiState === 'patrol') {
                this.changeState('seek_cover');
            } else if (this.aiState === 'seek_cover' && this.coverPosition &&
                Math.sqrt((this.x - this.coverPosition.x) ** 2 + (this.y - this.coverPosition.y) ** 2) < 30) {
                this.changeState(Math.random() > 0.4 ? 'attack_from_cover' : 'flank');
            } else if (this.aiState === 'attack_from_cover' && timeSinceChange > 3000) {
                this.changeState(Math.random() > 0.5 ? 'seek_cover' : 'flank');
            } else if (this.aiState === 'flank' && timeSinceChange > 2500) {
                this.changeState('seek_cover');
            } else if (this.aiState === 'retreat' && healthRatio > this.retreatHealthThreshold) {
                this.changeState('seek_cover');
            }
        }
    }

    changeState(newState) {
        this.aiState = newState;
        this.lastStateChange = Date.now();
        if (newState === 'seek_cover') this.coverPosition = null;
        if (newState === 'flank') this.flankSide = Math.random() > 0.5 ? 1 : -1;
    }

    handlePatrol(playerX, playerY, distance, deltaTime, walls) {
        if (!this.patrolTarget || Math.sqrt(
            (this.x - this.patrolTarget.x) ** 2 + (this.y - this.patrolTarget.y) ** 2) < 20) {
            const angle = Math.random() * Math.PI * 2;
            this.patrolTarget = {
                x: Math.max(60, Math.min(WORLD_WIDTH - 60, this.x + Math.cos(angle) * this.patrolRadius)),
                y: Math.max(60, Math.min(WORLD_HEIGHT - 60, this.y + Math.sin(angle) * this.patrolRadius))
            };
        }
        this.moveTowards(this.patrolTarget.x, this.patrolTarget.y, deltaTime, walls, 0.5);
    }

    handleSeekCover(playerX, playerY, distance, deltaTime, walls) {
        if (this.coverCheckTimer >= this.coverCheckInterval || !this.coverPosition) {
            this.coverCheckTimer = 0;
            const cover = this.findCoverPosition(playerX, playerY);
            if (cover) {
                this.coverPosition = cover;
                this.currentCover = cover.wall;
            } else {
                this.coverPosition = null;
            }
        }

        if (this.coverPosition) {
            this.moveTowards(this.coverPosition.x, this.coverPosition.y, deltaTime, walls, 1.2);
            this.shoot(playerX, playerY, walls);
        } else {
            // Если одиночного подходящего укрытия нет, танк сразу переходит в позиционную борьбу (ромбом)
            this.changeState('attack_from_cover');
        }
    }

    handleAttackFromCover(playerX, playerY, distance, deltaTime, walls) {
        const canSee = this.hasLineOfSight(this.x, this.y, playerX, playerY, walls);
        if (!canSee) {
            // Тигр тяжелый, он не бросается в атаку, а аккуратно выезжает из-за укрытия
            const angleToPlayer = Math.atan2(playerY - this.y, playerX - this.x);
            // Пытаемся выстроить вектор так, чтобы немного объехать препятствие
            const peekX = this.x + Math.cos(angleToPlayer) * 60;
            const peekY = this.y + Math.sin(angleToPlayer) * 60;
            this.moveTowards(peekX, peekY, deltaTime, walls, 0.7);
        } else {
            this.shoot(playerX, playerY, walls);
            // Стоим и танкуем "ромбом"
            this.calculateRicochetAngle(playerX, playerY);
            this.targetBodyAngle = this.ricochetBodyAngle;

            // Покачиваемся вперед-назад по направлению корпуса
            const wobble = Math.sin(Date.now() * 0.004) * 15;
            this.x += Math.cos(this.bodyAngle) * wobble * deltaTime;
            this.y += Math.sin(this.bodyAngle) * wobble * deltaTime;
        }
    }

    handleFlank(playerX, playerY, distance, deltaTime, walls) {
        const angleToPlayer = Math.atan2(playerY - this.y, playerX - this.x);
        const optDist = 300;
        let moveAngle;

        if (distance > optDist + 50) {
            moveAngle = angleToPlayer + 0.5 * this.flankSide;
        } else if (distance < optDist - 50) {
            moveAngle = angleToPlayer + Math.PI - 0.5 * this.flankSide;
        } else {
            moveAngle = angleToPlayer + (Math.PI / 2) * this.flankSide;
        }

        this.moveTowards(this.x + Math.cos(moveAngle) * 100, this.y + Math.sin(moveAngle) * 100, deltaTime, walls);
        this.shoot(playerX, playerY, walls);
    }

    handleRetreat(playerX, playerY, distance, deltaTime, walls) {
        if (this.coverCheckTimer >= this.coverCheckInterval || !this.coverPosition) {
            this.coverCheckTimer = 0;
            const cover = this.findCoverPosition(playerX, playerY);
            if (cover) { this.coverPosition = cover; this.currentCover = cover.wall; }
        }

        if (this.coverPosition) {
            this.moveTowards(this.coverPosition.x, this.coverPosition.y, deltaTime, walls, 1.4);
        } else {
            const away = Math.atan2(this.y - playerY, this.x - playerX);
            this.moveTowards(this.x + Math.cos(away) * 200, this.y + Math.sin(away) * 200, deltaTime, walls, 1.3);
        }
        this.shoot(playerX, playerY, walls);
    }

    // === UPDATE ===
    update(playerX, playerY, deltaTime, playerBullets = [], walls = []) {
        if (!this.active) return;
        if (isNaN(this.x)) { this.active = false; return; }

        this.updateAI(playerX, playerY, deltaTime, playerBullets, walls);
        this.updateBodyRotation(deltaTime);
        this.updateTurretRotation(playerX, playerY, deltaTime);
        this.updateRicochetEffects(deltaTime);

        if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer -= deltaTime;

        this.bullets = this.bullets.filter(b => { b.update(deltaTime); return b.active; });
    }

    // === ОТРИСОВКА (оптимизированная) ===
    draw() {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // ========== КОРПУС ==========
        ctx.save();
        ctx.rotate(this.bodyAngle);

        // Гусеницы
        const trackW = this.width + 4;
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(-trackW / 2, -this.height / 2 - 5, trackW, 10);
        ctx.fillRect(-trackW / 2, this.height / 2 - 5, trackW, 10);

        // Насечки на гусеницах
        ctx.strokeStyle = '#5a5550';
        ctx.lineWidth = 1.5;
        const trackStep = 8;
        const offset = this.trackOffset % trackStep;
        for (let i = -trackW / 2 + offset; i < trackW / 2; i += trackStep) {
            ctx.beginPath(); ctx.moveTo(i, -this.height / 2 - 5); ctx.lineTo(i, -this.height / 2 + 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i, this.height / 2 - 5); ctx.lineTo(i, this.height / 2 + 5); ctx.stroke();
        }

        // Корпус — Tiger II форма
        ctx.fillStyle = '#b8a050';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 12, -this.height / 2 + 4);
        ctx.lineTo(this.width / 2 - 2, -this.height / 2 + 4);
        ctx.lineTo(this.width / 2 + 5, 0);
        ctx.lineTo(this.width / 2 - 2, this.height / 2 - 4);
        ctx.lineTo(-this.width / 2 + 12, this.height / 2 - 4);
        ctx.lineTo(-this.width / 2 + 2, 0);
        ctx.closePath();
        ctx.fill();

        // Камуфляж
        ctx.fillStyle = 'rgba(90, 95, 50, 0.3)';
        ctx.beginPath(); ctx.ellipse(-5, -8, 12, 6, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(100, 70, 40, 0.25)';
        ctx.beginPath(); ctx.ellipse(10, 6, 10, 5, -0.2, 0, Math.PI * 2); ctx.fill();

        // Обводка
        ctx.strokeStyle = '#8a7a40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 12, -this.height / 2 + 4);
        ctx.lineTo(this.width / 2 - 2, -this.height / 2 + 4);
        ctx.lineTo(this.width / 2 + 5, 0);
        ctx.lineTo(this.width / 2 - 2, this.height / 2 - 4);
        ctx.lineTo(-this.width / 2 + 12, this.height / 2 - 4);
        ctx.lineTo(-this.width / 2 + 2, 0);
        ctx.closePath();
        ctx.stroke();

        // Болты
        ctx.fillStyle = '#7a6a38';
        const bolts = [[-20, -12], [-20, 12], [15, -12], [15, 12]];
        for (let [bx, by] of bolts) {
            ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI * 2); ctx.fill();
        }

        // Балкенкройц
        ctx.strokeStyle = 'rgba(220, 220, 220, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();

        ctx.restore(); // Конец корпуса

        // ========== БАШНЯ ==========
        ctx.save();
        ctx.rotate(this.angle);

        const tW = 22, tH = 16;
        ctx.fillStyle = '#b8a050';
        ctx.beginPath();
        ctx.moveTo(-tW / 2 + 4, -tH / 2);
        ctx.lineTo(tW / 2, -tH / 2 + 2);
        ctx.lineTo(tW / 2 + 3, 0);
        ctx.lineTo(tW / 2, tH / 2 - 2);
        ctx.lineTo(-tW / 2 + 4, tH / 2);
        ctx.lineTo(-tW / 2, tH / 2 - 3);
        ctx.lineTo(-tW / 2, -tH / 2 + 3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#8a7a40';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Люк
        ctx.fillStyle = '#9a8a42';
        ctx.beginPath(); ctx.arc(-5, -2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7a6a32'; ctx.lineWidth = 1; ctx.stroke();

        // Дуло
        const barrelLen = 38;
        if (this.muzzleFlashTimer > 0) {
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath(); ctx.arc(tW / 2 + barrelLen + 5, 0, 7, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = '#5a5040';
        ctx.fillRect(tW / 2, -3, barrelLen, 6);
        ctx.fillStyle = '#4a4030';
        ctx.fillRect(tW / 2 + barrelLen - 4, -5, 6, 10);

        // Маска орудия
        ctx.fillStyle = '#a09040';
        ctx.beginPath(); ctx.arc(tW / 2 + 2, 0, 7, -Math.PI / 2, Math.PI / 2); ctx.fill();

        // Антенна
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-16, -22); ctx.stroke();
        ctx.fillStyle = '#aaa';
        ctx.beginPath(); ctx.arc(-16, -22, 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.restore(); // Конец башни
        ctx.restore(); // Конец танка

        // ========== ЭФФЕКТЫ РИКОШЕТА ==========
        this.drawRicochetEffects();

        // ========== HP БАР ==========
        const hpW = 60, hpH = 7;
        const hpPct = this.health / this.maxHealth;
        const barX = this.x - hpW / 2;
        const barY = this.y - this.height / 2 - 22;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 1, barY - 1, hpW + 2, hpH + 2);
        ctx.fillStyle = '#3a2020';
        ctx.fillRect(barX, barY, hpW, hpH);

        ctx.fillStyle = hpPct > 0.6 ? '#e67e22' : hpPct > 0.3 ? '#e74c3c' : '#ff3333';
        ctx.fillRect(barX, barY, hpW * hpPct, hpH);

        ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, hpW, hpH);

        // Звёзды
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('★★', this.x, barY - 3);
    }

    drawRicochetEffects() {
        this.ricochetEffects.forEach(e => {
            const alpha = Math.max(0, e.life / e.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;

            if (e.type === 'spark') {
                ctx.fillStyle = e.color;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.4, 0, Math.PI * 2); ctx.fill();
            } else if (e.type === 'flash') {
                const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size);
                g.addColorStop(0, 'rgba(255,255,255,1)');
                g.addColorStop(0.3, 'rgba(255,255,100,0.6)');
                g.addColorStop(1, 'rgba(255,100,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
            } else if (e.type === 'text') {
                ctx.font = `bold ${e.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillText(e.text, e.x + 1, e.y + 1);
                ctx.fillStyle = '#ffdd00';
                ctx.fillText(e.text, e.x, e.y);
            }

            ctx.restore();
        });
    }
}
