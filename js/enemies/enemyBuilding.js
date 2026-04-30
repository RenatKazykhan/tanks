/**
 * EnemyBuilding - Здание-производитель врагов
 * Дополнительные здания на базе которые спавнят врагов быстрее чем основная база
 */
class EnemyBuilding {
    constructor(x, y, type = 'standard') {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.type = type;
        this.active = true;
        this.aliveTime = 0;
        this.setupByType();
        
        this.health = this.maxHealth;
        this.spawnTimer = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        // Анимации
        this.glowIntensity = 0;
        this.smokeParticles = [];
        this.sparks = [];
        this.gearRotation = 0;
        this.doorOpenAmount = 0;
        this.shakeAmount = 0;
        this.damageFlash = 0;
        this.crackLines = [];
        this.windowFlicker = Math.random() * Math.PI * 2;
        this.chimneyTimer = 0;
        this.ambientParticles = [];
        this.bullets = [];
        // Генерируем случайные трещины для повреждённого состояния
        this.generateCracks();
    }

    setupByType() {
        switch (this.type) {
            case 'standard':
                this.maxHealth = 300;
                this.spawnInterval = 4000;
                this.primaryColor = '#8B4513';
                this.secondaryColor = '#A0522D';
                this.accentColor = '#D2691E';
                this.glowColor = '#FF6B35';
                this.roofColor = '#654321';
                this.iconSymbol = '⚔';
                break;
            case 'fast':
                this.maxHealth = 200;
                this.spawnInterval = 2500;
                this.primaryColor = '#4B0082';
                this.secondaryColor = '#6A0DAD';
                this.accentColor = '#9B30FF';
                this.glowColor = '#BF5FFF';
                this.roofColor = '#3A006F';
                this.iconSymbol = '⚡';
                break;
            case 'heavy':
                this.maxHealth = 500;
                this.spawnInterval = 6000;
                this.primaryColor = '#2F4F4F';
                this.secondaryColor = '#4A7070';
                this.accentColor = '#6B9E9E';
                this.glowColor = '#00CED1';
                this.roofColor = '#1C3333';
                this.iconSymbol = '🛡';
                break;
        }
    }

    generateCracks() {
        this.crackLines = [];
        for (let i = 0; i < 5; i++) {
            const crack = {
                x: (Math.random() - 0.5) * this.width * 0.8,
                y: (Math.random() - 0.5) * this.height * 0.8,
                segments: []
            };
            let cx = crack.x, cy = crack.y;
            const numSegments = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numSegments; j++) {
                const nx = cx + (Math.random() - 0.5) * 12;
                const ny = cy + (Math.random() - 0.5) * 12;
                crack.segments.push({ x: nx, y: ny });
                cx = nx;
                cy = ny;
            }
            this.crackLines.push(crack);
        }
    }

    takeDamageBySkill(damage) {
        this.health -= damage;
        this.damageFlash = 1;
        this.shakeAmount = 3;
        this.addSparks(5);
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
            this.spawnDestructionParticles();
        }
    }

    update() {
        if (!this.active) return;

        this.pulsePhase += deltaTime * 3;
        this.gearRotation += deltaTime * 1.5;
        this.windowFlicker += deltaTime * 5;
        this.chimneyTimer += deltaTime;
        this.spawnTimer += deltaTime * 1000;

        // Плавная пульсация свечения
        const spawnProgress = this.spawnTimer / this.spawnInterval;
        this.glowIntensity = Math.max(0, (spawnProgress - 0.5) * 2);
        
        // Открытие ворот при готовности
        const targetDoor = spawnProgress > 0.85 ? 1 : 0;
        this.doorOpenAmount += (targetDoor - this.doorOpenAmount) * deltaTime * 5;

        // Затухание тряски
        this.shakeAmount *= Math.max(0, 1 - deltaTime * 10);
        this.damageFlash *= Math.max(0, 1 - deltaTime * 5);

        // Дым из трубы
        if (this.chimneyTimer > 0.15) {
            this.chimneyTimer = 0;
            this.smokeParticles.push({
                x: this.x + this.width * 0.25,
                y: this.y - this.height / 2 - 10,
                vx: (Math.random() - 0.5) * 8,
                vy: -15 - Math.random() * 20,
                life: 1,
                size: 3 + Math.random() * 4,
                alpha: 0.4 + Math.random() * 0.2
            });
        }

        // Амбиентные частицы (искры, энергия)
        if (Math.random() < deltaTime * 3 * this.glowIntensity) {
            this.ambientParticles.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 30,
                vy: -20 - Math.random() * 40,
                life: 1,
                size: 1 + Math.random() * 2,
                color: this.glowColor
            });
        }

        // Обновление частиц дыма
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 0.98;
            p.vy *= 0.99;
            p.life -= deltaTime * 0.8;
            p.size += deltaTime * 3;
            if (p.life <= 0) this.smokeParticles.splice(i, 1);
        }

        // Обновление искр
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += s.vx * deltaTime;
            s.y += s.vy * deltaTime;
            s.vy += 80 * deltaTime;
            s.life -= deltaTime * 2;
            if (s.life <= 0) this.sparks.splice(i, 1);
        }

        // Обновление амбиентных частиц
        for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
            const p = this.ambientParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 1.5;
            if (p.life <= 0) this.ambientParticles.splice(i, 1);
        }

        this.aliveTime += deltaTime;

        // Спавн врага
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.shakeAmount = 2;
            this.addSparks(3);
            this.spawnEnemy();
        }
    }

    addSparks(count) {
        for (let i = 0; i < count; i++) {
            this.sparks.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 100,
                vy: -50 - Math.random() * 80,
                life: 1,
                color: this.accentColor
            });
        }
    }

    spawnDestructionParticles() {
        for (let i = 0; i < 15; i++) {
            this.sparks.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 200,
                vy: -80 - Math.random() * 120,
                life: 1,
                color: '#FF4500'
            });
        }
    }

    spawnEnemy() {
        if (!this.active) return;

        let EnemyClass;
        
        switch (this.type) {
            case 'standard':
                EnemyClass = EnemyTank;
                break;
            case 'fast':
                const fastTypes = [EnemyTank, MachineGunTank];
                EnemyClass = fastTypes[Math.floor(Math.random() * fastTypes.length)];
                break;
            case 'heavy':
                const heavyTypes = [HeavyTank, StrongEnemyTank];
                EnemyClass = heavyTypes[Math.floor(Math.random() * heavyTypes.length)];
                break;
            default:
                EnemyClass = EnemyTank;
        }

        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 30;
        const spawnX = this.x + Math.cos(angle) * distance;
        const spawnY = this.y + Math.sin(angle) * distance;

        const enemy = new EnemyClass(spawnX, spawnY);
        const minutesAlive = this.aliveTime / 30;
        const multiplier = 1 + minutesAlive * 0.15;
        enemy.health = Math.floor(enemy.health * multiplier);
        enemy.maxHealth = enemy.health;
        enemy.damage = Math.floor(enemy.damage * multiplier);

        enemies.push(enemy);
    }

    takeDamage(damage) {
        if (!this.active) return;
        
        this.health -= damage;
        this.damageFlash = 1;
        this.shakeAmount = 3;
        this.addSparks(4);
        
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            this.spawnDestructionParticles();
            score += 100;
        }
    }

    draw() {
        if (!this.active) {
            // Рисуем оставшиеся частицы даже после уничтожения
            this.drawParticles();
            return;
        }

        ctx.save();
        
        // Тряска
        const shakeX = (Math.random() - 0.5) * this.shakeAmount;
        const shakeY = (Math.random() - 0.5) * this.shakeAmount;
        ctx.translate(this.x + shakeX, this.y + shakeY);

        const healthPercent = this.health / this.maxHealth;
        const spawnReady = this.spawnTimer >= this.spawnInterval * 0.8;
        const w = this.width;
        const h = this.height;

        // === СВЕЧЕНИЕ ЗЕМЛИ (аура) ===
        if (this.glowIntensity > 0) {
            const glowRadius = w * 0.8 + this.glowIntensity * 15;
            const groundGlow = ctx.createRadialGradient(0, h / 2, 0, 0, h / 2, glowRadius);
            groundGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.3 * this.glowIntensity));
            groundGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = groundGlow;
            ctx.beginPath();
            ctx.ellipse(0, h / 2, glowRadius, glowRadius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // === ТЕНЬ ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(3, h / 2 + 3, w / 2 + 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ОСНОВАНИЕ (ФУНДАМЕНТ) ===
        const baseGrad = ctx.createLinearGradient(-w / 2, h / 2 - 8, -w / 2, h / 2);
        baseGrad.addColorStop(0, '#555');
        baseGrad.addColorStop(1, '#333');
        ctx.fillStyle = baseGrad;
        this.roundRect(-w / 2 - 3, h / 2 - 8, w + 6, 10, 2);
        ctx.fill();

        // === СТЕНЫ ===
        const wallGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        wallGrad.addColorStop(0, this.lightenColor(this.primaryColor, 30));
        wallGrad.addColorStop(0.3, this.primaryColor);
        wallGrad.addColorStop(0.7, this.secondaryColor);
        wallGrad.addColorStop(1, this.darkenColor(this.primaryColor, 30));
        
        ctx.fillStyle = wallGrad;
        this.roundRect(-w / 2, -h / 2, w, h, 3);
        ctx.fill();

        // Вспышка при получении урона
        if (this.damageFlash > 0) {
            ctx.fillStyle = `rgba(255, 100, 100, ${this.damageFlash * 0.5})`;
            this.roundRect(-w / 2, -h / 2, w, h, 3);
            ctx.fill();
        }

        // === КИРПИЧНАЯ ТЕКСТУРА ===
        ctx.strokeStyle = this.hexToRGBA(this.darkenColor(this.primaryColor, 40), 0.3);
        ctx.lineWidth = 0.5;
        const brickH = 8;
        const brickW = 12;
        for (let row = 0; row < Math.floor(h / brickH); row++) {
            const by = -h / 2 + row * brickH;
            const offset = (row % 2) * (brickW / 2);
            for (let col = 0; col < Math.ceil(w / brickW) + 1; col++) {
                const bx = -w / 2 + col * brickW + offset;
                if (bx < w / 2 && bx + brickW > -w / 2) {
                    ctx.strokeRect(
                        Math.max(-w / 2, bx),
                        by,
                        Math.min(brickW, w / 2 - bx),
                        brickH
                    );
                }
            }
        }

        // === УГЛОВЫЕ УКРЕПЛЕНИЯ ===
        const cornerSize = 7;
        const corners = [
            [-w / 2, -h / 2],
            [w / 2 - cornerSize, -h / 2],
            [-w / 2, h / 2 - cornerSize],
            [w / 2 - cornerSize, h / 2 - cornerSize]
        ];
        
        const cornerGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        cornerGrad.addColorStop(0, '#777');
        cornerGrad.addColorStop(1, '#444');
        ctx.fillStyle = cornerGrad;
        
        corners.forEach(([cx, cy]) => {
            this.roundRect(cx, cy, cornerSize, cornerSize, 1);
            ctx.fill();
        });

        // Заклёпки на углах
        ctx.fillStyle = '#999';
        corners.forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx + cornerSize / 2, cy + cornerSize / 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // === ОКНА ===
        const windowFlickerVal = Math.sin(this.windowFlicker) * 0.3 + 0.7;
        const windowGlow = this.hexToRGBA(this.glowColor, windowFlickerVal * 0.8);
        const windowDark = 'rgba(0, 0, 0, 0.8)';
        
        // Левое окно
        this.drawWindow(-w / 4 - 2, -h / 4, 8, 10, windowGlow, windowDark);
        // Правое окно
        this.drawWindow(w / 4 - 6, -h / 4, 8, 10, windowGlow, windowDark);
        
        // Верхнее маленькое окно (круглое)
        ctx.fillStyle = windowDark;
        ctx.beginPath();
        ctx.arc(0, -h / 4 + 2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        const windowInnerGlow = ctx.createRadialGradient(0, -h / 4 + 2, 0, 0, -h / 4 + 2, 3.5);
        windowInnerGlow.addColorStop(0, this.hexToRGBA(this.glowColor, windowFlickerVal * 0.6));
        windowInnerGlow.addColorStop(1, this.hexToRGBA(this.glowColor, 0.1));
        ctx.fillStyle = windowInnerGlow;
        ctx.beginPath();
        ctx.arc(0, -h / 4 + 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // === КРЫША ===
        const roofGrad = ctx.createLinearGradient(0, -h / 2 - 15, 0, -h / 2);
        roofGrad.addColorStop(0, this.lightenColor(this.roofColor, 20));
        roofGrad.addColorStop(1, this.roofColor);
        
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 4, -h / 2 + 2);
        ctx.lineTo(0, -h / 2 - 15);
        ctx.lineTo(w / 2 + 4, -h / 2 + 2);
        ctx.closePath();
        ctx.fill();
        
        // Контур крыши
        ctx.strokeStyle = this.darkenColor(this.roofColor, 20);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Черепица на крыше
        ctx.strokeStyle = this.hexToRGBA(this.darkenColor(this.roofColor, 30), 0.4);
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            const ty = -h / 2 - 11 + i * 5;
            const roofWidth = (w + 8) * (1 - (i * 0.25));
            ctx.beginPath();
            ctx.moveTo(-roofWidth / 2 + i * 4, ty);
            ctx.lineTo(roofWidth / 2 - i * 4, ty);
            ctx.stroke();
        }

        // === ТРУБА ===
        const chimneyX = w * 0.2;
        const chimneyW = 8;
        const chimneyH = 14;
        
        const chimneyGrad = ctx.createLinearGradient(
            chimneyX - chimneyW / 2, -h / 2 - chimneyH,
            chimneyX + chimneyW / 2, -h / 2 - chimneyH
        );
        chimneyGrad.addColorStop(0, '#666');
        chimneyGrad.addColorStop(0.5, '#888');
        chimneyGrad.addColorStop(1, '#555');
        
        ctx.fillStyle = chimneyGrad;
        ctx.fillRect(chimneyX - chimneyW / 2, -h / 2 - chimneyH, chimneyW, chimneyH + 2);
        
        // Верх трубы
        ctx.fillStyle = '#777';
        ctx.fillRect(chimneyX - chimneyW / 2 - 2, -h / 2 - chimneyH - 2, chimneyW + 4, 4);
        
        // Свечение из трубы
        if (this.glowIntensity > 0.3) {
            const smokeGlow = ctx.createRadialGradient(
                chimneyX, -h / 2 - chimneyH - 2, 0,
                chimneyX, -h / 2 - chimneyH - 2, 8
            );
            smokeGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.3 * this.glowIntensity));
            smokeGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = smokeGlow;
            ctx.beginPath();
            ctx.arc(chimneyX, -h / 2 - chimneyH - 2, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // === ВОРОТА ===
        const gateW = 16;
        const gateH = 18;
        const gateY = h / 2 - gateH;
        
        // Арка ворот
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(-gateW / 2, h / 2);
        ctx.lineTo(-gateW / 2, gateY + 5);
        ctx.arc(0, gateY + 5, gateW / 2, Math.PI, 0, false);
        ctx.lineTo(gateW / 2, h / 2);
        ctx.closePath();
        ctx.fill();
        
        // Свечение внутри ворот
        const gateGlow = ctx.createRadialGradient(0, h / 2 - gateH / 2, 0, 0, h / 2 - gateH / 2, gateW);
        gateGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.5 * this.glowIntensity));
        gateGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gateGlow;
        ctx.beginPath();
        ctx.moveTo(-gateW / 2, h / 2);
        ctx.lineTo(-gateW / 2, gateY + 5);
        ctx.arc(0, gateY + 5, gateW / 2, Math.PI, 0, false);
        ctx.lineTo(gateW / 2, h / 2);
        ctx.closePath();
        ctx.fill();

        // Створки ворот
        const doorOffset = this.doorOpenAmount * gateW / 2 * 0.7;
        ctx.fillStyle = '#4a3728';
        ctx.strokeStyle = '#2a1f18';
        ctx.lineWidth = 1;
        
        // Левая створка
        if (doorOffset < gateW / 2) {
            ctx.fillRect(-gateW / 2, gateY + 5, gateW / 2 - doorOffset, gateH - 5);
            ctx.strokeRect(-gateW / 2, gateY + 5, gateW / 2 - doorOffset, gateH - 5);
        }
        // Правая створка
        if (doorOffset < gateW / 2) {
            ctx.fillRect(doorOffset, gateY + 5, gateW / 2 - doorOffset, gateH - 5);
            ctx.strokeRect(doorOffset, gateY + 5, gateW / 2 - doorOffset, gateH - 5);
        }

        // Обрамление ворот
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-gateW / 2 - 2, h / 2);
        ctx.lineTo(-gateW / 2 - 2, gateY + 5);
        ctx.arc(0, gateY + 5, gateW / 2 + 2, Math.PI, 0, false);
        ctx.lineTo(gateW / 2 + 2, h / 2);
        ctx.stroke();

        // === ШЕСТЕРЁНКИ (декоративные) ===
        this.drawGear(-w / 2 + 5, 0, 4, 6, this.gearRotation);
        this.drawGear(w / 2 - 5, 0, 4, 6, -this.gearRotation);

        // === ТРЕЩИНЫ ПРИ ПОВРЕЖДЕНИИ ===
        if (healthPercent < 0.7) {
            const cracksToShow = Math.floor((1 - healthPercent) * this.crackLines.length);
            ctx.strokeStyle = `rgba(0, 0, 0, ${(1 - healthPercent) * 0.6})`;
            ctx.lineWidth = 1;
            
            for (let i = 0; i < cracksToShow; i++) {
                const crack = this.crackLines[i];
                ctx.beginPath();
                ctx.moveTo(crack.x, crack.y);
                crack.segments.forEach(seg => {
                    ctx.lineTo(seg.x, seg.y);
                });
                ctx.stroke();
            }
        }

        // === ПОВРЕЖДЁННЫЕ ПЯТНА ===
        if (healthPercent < 0.5) {
            const numScorch = Math.floor((1 - healthPercent) * 4);
            for (let i = 0; i < numScorch; i++) {
                const sx = Math.sin(i * 2.7) * w * 0.3;
                const sy = Math.cos(i * 3.1) * h * 0.3;
                const scorchGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
                scorchGrad.addColorStop(0, 'rgba(30, 20, 10, 0.4)');
                scorchGrad.addColorStop(1, 'rgba(30, 20, 10, 0)');
                ctx.fillStyle = scorchGrad;
                ctx.beginPath();
                ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // === ОБВОДКА ЗДАНИЯ ===
        ctx.strokeStyle = spawnReady ? 
            this.hexToRGBA('#ff4444', 0.6 + Math.sin(this.pulsePhase) * 0.4) : 
            this.darkenColor(this.secondaryColor, 20);
        ctx.lineWidth = spawnReady ? 2.5 : 1.5;
        this.roundRect(-w / 2, -h / 2, w, h, 3);
        ctx.stroke();

        // === ВНЕШНЕЕ СВЕЧЕНИЕ ПРИ ГОТОВНОСТИ ===
        if (spawnReady) {
            const outerGlow = ctx.createRadialGradient(0, 0, w / 2, 0, 0, w);
            outerGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.15));
            outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(0, 0, w, 0, Math.PI * 2);
            ctx.fill();
        }

        // === ИНДИКАТОР ГОТОВНОСТИ (маяк на крыше) ===
        const beaconY = -h / 2 - 15;
        const beaconPulse = Math.sin(this.pulsePhase * 2) * 0.5 + 0.5;
        
        // Столбик маяка
        ctx.fillStyle = '#666';
        ctx.fillRect(-1.5, beaconY, 3, 5);
        
        // Сам маяк
        const beaconColor = spawnReady ? '#ff4444' : this.accentColor;
        const beaconAlpha = spawnReady ? 0.5 + beaconPulse * 0.5 : 0.3 + beaconPulse * 0.2;
        
        ctx.fillStyle = this.hexToRGBA(beaconColor, beaconAlpha);
        ctx.beginPath();
        ctx.arc(0, beaconY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Свечение маяка
        if (spawnReady) {
            const beaconGlow = ctx.createRadialGradient(0, beaconY - 2, 0, 0, beaconY - 2, 12);
            beaconGlow.addColorStop(0, this.hexToRGBA(beaconColor, 0.4 * beaconPulse));
            beaconGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = beaconGlow;
            ctx.beginPath();
            ctx.arc(0, beaconY - 2, 12, 0, Math.PI * 2);
            ctx.fill();
        }

        // === ПРОГРЕСС-БАР СПАВНА (кольцевой) ===
        const spawnProgress = this.spawnTimer / this.spawnInterval;
        if (spawnProgress > 0) {
            ctx.strokeStyle = this.hexToRGBA(this.glowColor, 0.6);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, w / 2 + 6, -Math.PI / 2, -Math.PI / 2 + spawnProgress * Math.PI * 2);
            ctx.stroke();
            
            // Точка на конце прогресса
            const progressAngle = -Math.PI / 2 + spawnProgress * Math.PI * 2;
            const dotX = Math.cos(progressAngle) * (w / 2 + 6);
            const dotY = Math.sin(progressAngle) * (w / 2 + 6);
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // === СИМВОЛ ТИПА ЗДАНИЯ ===
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.hexToRGBA(this.accentColor, 0.7);
        ctx.fillText(this.iconSymbol, 0, h / 4 - gateH + 2);

        ctx.restore();

        // Частицы рисуются в мировых координатах
        this.drawParticles();

        // Полоска здоровья
        this.drawHealthBar();
    }

    /**
     * Отрисовка окна
     */
    drawWindow(x, y, w, h, glowColor, darkColor) {
        // Рама
        ctx.fillStyle = '#555';
        this.roundRect(x - 1, y - 1, w + 2, h + 2, 1);
        ctx.fill();
        
        // Тёмный фон
        ctx.fillStyle = darkColor;
        ctx.fillRect(x, y, w, h);
        
        // Свечение изнутри
        const winGlow = ctx.createRadialGradient(
            x + w / 2, y + h / 2, 0,
            x + w / 2, y + h / 2, Math.max(w, h)
        );
        winGlow.addColorStop(0, glowColor);
        winGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = winGlow;
        ctx.fillRect(x, y, w, h);
        
        // Перекрестие окна
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();
    }

    /**
     * Отрисовка шестерёнки
     */
    drawGear(x, y, innerR, outerR, rotation) {
        const teeth = 6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = '#777';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < teeth * 2; i++) {
            const angle = (i / (teeth * 2)) * Math.PI * 2;
            const r = i % 2 === 0 ? outerR : innerR;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Центральное отверстие
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, innerR * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Отрисовка всех частиц
     */
    drawParticles() {
        // Дым
        this.smokeParticles.forEach(p => {
            ctx.globalAlpha = p.life * p.alpha;
            const smokeGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            smokeGrad.addColorStop(0, 'rgba(120, 120, 120, 0.5)');
            smokeGrad.addColorStop(0.6, 'rgba(80, 80, 80, 0.2)');
            smokeGrad.addColorStop(1, 'rgba(60, 60, 60, 0)');
            ctx.fillStyle = smokeGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Искры
        this.sparks.forEach(s => {
            ctx.globalAlpha = s.life;
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 1.5 * s.life, 0, Math.PI * 2);
            ctx.fill();
            
            // Хвост искры
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 0.02, s.y - s.vy * 0.02);
            ctx.stroke();
        });
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Амбиентные частицы
        this.ambientParticles.forEach(p => {
            ctx.globalAlpha = p.life * 0.7;
            const apGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            apGlow.addColorStop(0, p.color);
            apGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = apGlow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    /**
     * Отрисовка полоски здоровья (улучшенная)
     */
    drawHealthBar() {
        if (!this.active) return;
        
        const barWidth = 60;
        const barHeight = 7;
        const barY = this.y - this.height / 2 - 25;
        const healthPercent = this.health / this.maxHealth;

        // Тень полоски
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.roundRectAbs(this.x - barWidth / 2 + 1, barY + 1, barWidth, barHeight, 3);
        ctx.fill();

        // Фон полоски
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRectAbs(this.x - barWidth / 2, barY, barWidth, barHeight, 3);
        ctx.fill();

        // Градиент здоровья
        const healthGrad = ctx.createLinearGradient(
            this.x - barWidth / 2, barY,
            this.x - barWidth / 2, barY + barHeight
        );
        
        if (healthPercent > 0.6) {
            healthGrad.addColorStop(0, '#4eff4e');
            healthGrad.addColorStop(0.5, '#00cc00');
            healthGrad.addColorStop(1, '#009900');
        } else if (healthPercent > 0.3) {
            healthGrad.addColorStop(0, '#ffff4e');
            healthGrad.addColorStop(0.5, '#cccc00');
            healthGrad.addColorStop(1, '#999900');
        } else {
            healthGrad.addColorStop(0, '#ff4e4e');
            healthGrad.addColorStop(0.5, '#cc0000');
            healthGrad.addColorStop(1, '#990000');
        }
        
        ctx.fillStyle = healthGrad;
        if (healthPercent > 0) {
            this.roundRectAbs(
                this.x - barWidth / 2 + 1,
                barY + 1,
                (barWidth - 2) * healthPercent,
                barHeight - 2,
                2
            );
            ctx.fill();
        }

        // Блик на полоске
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        if (healthPercent > 0) {
            this.roundRectAbs(
                this.x - barWidth / 2 + 1,
                barY + 1,
                (barWidth - 2) * healthPercent,
                barHeight / 2 - 1,
                2
            );
            ctx.fill();
        }

        // Обводка
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        this.roundRectAbs(this.x - barWidth / 2, barY, barWidth, barHeight, 3);
        ctx.stroke();

        // Текст здоровья
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.fillText(
            `${Math.ceil(this.health)}/${this.maxHealth}`,
            this.x,
            barY + barHeight / 2
        );
        ctx.shadowBlur = 0;
    }

    /**
     * Скруглённый прямоугольник (относительные координаты, используется с translate)
     */
    roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * Скруглённый прямоугольник (абсолютные координаты)
     */
    roundRectAbs(x, y, w, h, r) {
        this.roundRect(x, y, w, h, r);
    }

    // === УТИЛИТЫ ДЛЯ ЦВЕТОВ ===

    /**
     * HEX в RGBA
     */
    hexToRGBA(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Осветлить цвет
     */
    lightenColor(hex, amount) {
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        r = Math.min(255, r + amount);
        g = Math.min(255, g + amount);
        b = Math.min(255, b + amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Затемнить цвет
     */
    darkenColor(hex, amount) {
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        r = Math.max(0, r - amount);
        g = Math.max(0, g - amount);
        b = Math.max(0, b - amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Проверка уничтожения
     */
    isDestroyed() {
        return !this.active || this.health <= 0;
    }
}