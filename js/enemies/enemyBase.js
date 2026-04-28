/**
 * EnemyBase - Главное здание базы врага
 * Является основным источником врагов и целью игрока для уничтожения
 */
class EnemyBase {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.health = 1000;
        this.maxHealth = 1000;
        this.active = true;
        this.spawnTimer = 0;
        this.spawnInterval = 5000;
        this.waveNumber = 0;
        this.maxWaves = 20;
        this.enemiesPerWave = 3;
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.damageMultiplier = 1.0;
        this.healthMultiplier = 1.0;
        this.speedMultiplier = 1.0;
        this.isSpawning = false;
        this.spawnCooldown = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;

        // === ВИЗУАЛЬНЫЕ ПАРАМЕТРЫ ===
        this.glowIntensity = 0;
        this.shakeAmount = 0;
        this.damageFlash = 0;
        this.gearRotation = 0;
        this.portalRotation = 0;
        this.doorOpenAmount = 0;
        this.windowFlicker = Math.random() * Math.PI * 2;
        this.chimneyTimer = 0;
        this.energyPhase = 0;
        this.flagWave = 0;

        // Частицы
        this.smokeParticles = [];
        this.sparks = [];
        this.portalParticles = [];
        this.ambientParticles = [];
        this.fireParticles = [];

        // Трещины
        this.crackLines = [];
        this.generateCracks();

        // Башенки (4 угловые)
        this.towers = [
            { x: -this.width / 2, y: -this.height / 2, firePhase: Math.random() * Math.PI * 2 },
            { x: this.width / 2, y: -this.height / 2, firePhase: Math.random() * Math.PI * 2 },
            { x: -this.width / 2, y: this.height / 2, firePhase: Math.random() * Math.PI * 2 },
            { x: this.width / 2, y: this.height / 2, firePhase: Math.random() * Math.PI * 2 }
        ];

        // Цвета
        this.primaryColor = '#8B0000';
        this.secondaryColor = '#654321';
        this.accentColor = '#FF4500';
        this.glowColor = '#FF2200';
        this.portalColor = '#FF0044';
        this.roofColor = '#4A0000';
        this.stoneColor = '#5C4033';
    }

    generateCracks() {
        this.crackLines = [];
        for (let i = 0; i < 8; i++) {
            const crack = {
                x: (Math.random() - 0.5) * this.width * 0.8,
                y: (Math.random() - 0.5) * this.height * 0.8,
                segments: []
            };
            let cx = crack.x, cy = crack.y;
            const numSegments = 3 + Math.floor(Math.random() * 4);
            for (let j = 0; j < numSegments; j++) {
                const nx = cx + (Math.random() - 0.5) * 15;
                const ny = cy + (Math.random() - 0.5) * 15;
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
        this.shakeAmount = 5;
        this.addSparks(8);
        if (this.health <= 0 || isNaN(this.health)) {
            this.active = false;
            this.spawnDestructionEffect();
        }
    }

    addSparks(count) {
        for (let i = 0; i < count; i++) {
            this.sparks.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 150,
                vy: -60 - Math.random() * 100,
                life: 1,
                color: Math.random() > 0.5 ? this.accentColor : '#FFD700'
            });
        }
    }

    spawnDestructionEffect() {
        for (let i = 0; i < 30; i++) {
            this.sparks.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 300,
                vy: -100 - Math.random() * 150,
                life: 1,
                color: ['#FF4500', '#FFD700', '#FF0000', '#FF6347'][Math.floor(Math.random() * 4)]
            });
        }
        for (let i = 0; i < 20; i++) {
            this.smokeParticles.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 40,
                vy: -30 - Math.random() * 50,
                life: 1.5,
                size: 8 + Math.random() * 12,
                alpha: 0.6
            });
        }
    }

    update(deltaTime, enemies, player) {
        this.enemiesAlive = enemies.filter(e => e.active).length;
        this.pulsePhase += deltaTime * 2;
        this.gearRotation += deltaTime * (this.isSpawning ? 3 : 0.5);
        this.portalRotation += deltaTime * (this.isSpawning ? 4 : 1);
        this.windowFlicker += deltaTime * 6;
        this.chimneyTimer += deltaTime;
        this.energyPhase += deltaTime * 3;
        this.flagWave += deltaTime * 4;

        // Затухание эффектов
        this.shakeAmount *= Math.max(0, 1 - deltaTime * 8);
        this.damageFlash *= Math.max(0, 1 - deltaTime * 4);

        // Свечение при спавне
        const targetGlow = this.isSpawning ? 1 : 0.2;
        this.glowIntensity += (targetGlow - this.glowIntensity) * deltaTime * 3;

        // Открытие ворот
        const targetDoor = this.isSpawning ? 1 : 0;
        this.doorOpenAmount += (targetDoor - this.doorOpenAmount) * deltaTime * 4;

        // Дым из труб
        if (this.chimneyTimer > 0.1) {
            this.chimneyTimer = 0;
            // Левая труба
            this.smokeParticles.push({
                x: this.x - this.width * 0.25,
                y: this.y - this.height / 2 - 20,
                vx: (Math.random() - 0.5) * 10,
                vy: -20 - Math.random() * 25,
                life: 1,
                size: 4 + Math.random() * 5,
                alpha: 0.35
            });
            // Правая труба
            this.smokeParticles.push({
                x: this.x + this.width * 0.25,
                y: this.y - this.height / 2 - 18,
                vx: (Math.random() - 0.5) * 10,
                vy: -18 - Math.random() * 22,
                life: 1,
                size: 3 + Math.random() * 4,
                alpha: 0.3
            });
        }

        // Портальные частицы при спавне
        if (this.isSpawning && Math.random() < deltaTime * 15) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 10;
            this.portalParticles.push({
                x: this.x + Math.cos(angle) * dist,
                y: this.y + this.height / 2 - 15 + Math.sin(angle) * dist * 0.5,
                vx: Math.cos(angle) * -30,
                vy: Math.sin(angle) * -15 - 10,
                life: 1,
                size: 2 + Math.random() * 3,
                color: this.portalColor
            });
        }

        // Огонь на башенках при спавне
        if (this.isSpawning) {
            this.towers.forEach(t => {
                t.firePhase += deltaTime * 10;
                if (Math.random() < deltaTime * 8) {
                    this.fireParticles.push({
                        x: this.x + t.x,
                        y: this.y + t.y - 12,
                        vx: (Math.random() - 0.5) * 15,
                        vy: -25 - Math.random() * 35,
                        life: 1,
                        size: 2 + Math.random() * 3,
                        color: Math.random() > 0.3 ? '#FF4500' : '#FFD700'
                    });
                }
            });
        }

        // Амбиентные частицы энергии
        if (Math.random() < deltaTime * 2 * this.glowIntensity) {
            this.ambientParticles.push({
                x: this.x + (Math.random() - 0.5) * this.width * 1.2,
                y: this.y + (Math.random() - 0.5) * this.height * 1.2,
                vx: (Math.random() - 0.5) * 20,
                vy: -15 - Math.random() * 30,
                life: 1,
                size: 1 + Math.random() * 2,
                color: this.glowColor
            });
        }

        this.updateParticles(deltaTime);

        // Логика спавна волн
        if (this.waveNumber < this.maxWaves && this.enemiesAlive < 5) {
            this.spawnTimer += deltaTime * 1000;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.startNewWave(enemies);
            }
        }

        this.updateDifficulty();
    }

    updateParticles(deltaTime) {
        // Дым
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 0.97;
            p.life -= deltaTime * 0.7;
            p.size += deltaTime * 4;
            if (p.life <= 0) this.smokeParticles.splice(i, 1);
        }

        // Искры
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += s.vx * deltaTime;
            s.y += s.vy * deltaTime;
            s.vy += 100 * deltaTime;
            s.life -= deltaTime * 1.8;
            if (s.life <= 0) this.sparks.splice(i, 1);
        }

        // Портальные частицы
        for (let i = this.portalParticles.length - 1; i >= 0; i--) {
            const p = this.portalParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 2;
            if (p.life <= 0) this.portalParticles.splice(i, 1);
        }

        // Амбиентные
        for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
            const p = this.ambientParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 1.5;
            if (p.life <= 0) this.ambientParticles.splice(i, 1);
        }

        // Огонь
        for (let i = this.fireParticles.length - 1; i >= 0; i--) {
            const p = this.fireParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 2.5;
            p.size *= 0.97;
            if (p.life <= 0) this.fireParticles.splice(i, 1);
        }
    }

    startNewWave(enemies) {
        this.waveNumber++;
        this.isSpawning = true;
        this.enemiesSpawned = 0;
        this.shakeAmount = 3;
        this.addSparks(5);

        const enemiesInThisWave = Math.min(this.enemiesPerWave + Math.floor(this.waveNumber / 2), 8);

        for (let i = 0; i < enemiesInThisWave; i++) {
            setTimeout(() => {
                if (this.active) {
                    this.spawnEnemy(enemies);
                    this.enemiesSpawned++;
                    this.shakeAmount = 2;
                    if (this.enemiesSpawned >= enemiesInThisWave) {
                        this.isSpawning = false;
                    }
                }
            }, i * 500);
        }
    }

    spawnEnemy(enemies) {
        if (!this.active) return;

        const EnemyClass = this.getEnemyTypeForWave();

        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 40;
        const spawnX = this.x + Math.cos(angle) * distance;
        const spawnY = this.y + Math.sin(angle) * distance;

        const enemy = new EnemyClass(spawnX, spawnY);

        enemy.health = Math.floor(enemy.health * this.healthMultiplier);
        enemy.maxHealth = enemy.health;
        enemy.damage = Math.floor(enemy.damage * this.damageMultiplier);
        enemy.speed = Math.floor(enemy.speed * this.speedMultiplier);

        if (this.waveNumber > 5) {
            enemy.shotCooldown = Math.max(500, enemy.shotCooldown - this.waveNumber * 30);
        }

        enemies.push(enemy);
    }

    getEnemyTypeForWave() {
        const wave = this.waveNumber;

        if (wave <= 3) {
            return EnemyTank;
        } else if (wave <= 6) {
            const types = [EnemyTank, StrongEnemyTank];
            return types[Math.floor(Math.random() * types.length)];
        } else if (wave <= 10) {
            const types = [EnemyTank, StrongEnemyTank, MachineGunTank, HeavyTank];
            return types[Math.floor(Math.random() * types.length)];
        } else if (wave <= 15) {
            const types = [StrongEnemyTank, MachineGunTank, HeavyTank, RocketTank, Sniper];
            return types[Math.floor(Math.random() * types.length)];
        } else {
            const types = [HeavyTank, RocketTank, Sniper, BossTank, StrongEnemyTank];
            return types[Math.floor(Math.random() * types.length)];
        }
    }

    updateDifficulty() {
        const waveFactor = this.waveNumber * 0.15;
        this.healthMultiplier = 1 + waveFactor;
        this.damageMultiplier = 1 + waveFactor * 0.8;
        this.speedMultiplier = 1 + Math.min(waveFactor * 0.3, 0.5);
        this.spawnInterval = Math.max(2000, 5000 - this.waveNumber * 150);
    }

    takeDamage(damage) {
        if (!this.active) return;

        this.health -= damage;
        this.damageFlash = 1;
        this.shakeAmount = 4;
        this.addSparks(6);

        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            this.spawnDestructionEffect();
            score += 500;
        }
    }

    draw() {
        ctx.save();

        const shakeX = (Math.random() - 0.5) * this.shakeAmount;
        const shakeY = (Math.random() - 0.5) * this.shakeAmount;
        ctx.translate(this.x + shakeX, this.y + shakeY);

        const w = this.width;
        const h = this.height;
        const healthPercent = this.health / this.maxHealth;

        // === АУРА ЗЕМЛИ ===
        const auraRadius = w * 0.9 + this.glowIntensity * 25;
        const aura = ctx.createRadialGradient(0, h / 2, 0, 0, h / 2, auraRadius);
        aura.addColorStop(0, this.hexToRGBA(this.glowColor, 0.25 * this.glowIntensity));
        aura.addColorStop(0.5, this.hexToRGBA(this.portalColor, 0.1 * this.glowIntensity));
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.ellipse(0, h / 2, auraRadius, auraRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ТЕНЬ ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(4, h / 2 + 5, w / 2 + 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ФУНДАМЕНТ ===
        const foundGrad = ctx.createLinearGradient(-w / 2 - 6, h / 2 - 10, -w / 2 - 6, h / 2 + 4);
        foundGrad.addColorStop(0, '#666');
        foundGrad.addColorStop(0.5, '#444');
        foundGrad.addColorStop(1, '#333');
        ctx.fillStyle = foundGrad;
        this.roundRect(-w / 2 - 6, h / 2 - 10, w + 12, 14, 3);
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        this.roundRect(-w / 2 - 6, h / 2 - 10, w + 12, 14, 3);
        ctx.stroke();

        // Каменная текстура фундамента
        ctx.fillStyle = 'rgba(100,100,100,0.3)';
        for (let i = 0; i < 6; i++) {
            const bx = -w / 2 - 4 + i * ((w + 10) / 6);
            ctx.fillRect(bx, h / 2 - 8, (w + 10) / 6 - 2, 10);
            ctx.strokeStyle = 'rgba(50,50,50,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(bx, h / 2 - 8, (w + 10) / 6 - 2, 10);
        }

        // === ОСНОВНЫЕ СТЕНЫ ===
        const wallGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        wallGrad.addColorStop(0, this.lightenColor(this.primaryColor, 40));
        wallGrad.addColorStop(0.2, this.primaryColor);
        wallGrad.addColorStop(0.5, this.secondaryColor);
        wallGrad.addColorStop(0.8, this.primaryColor);
        wallGrad.addColorStop(1, this.darkenColor(this.primaryColor, 40));
        ctx.fillStyle = wallGrad;
        this.roundRect(-w / 2, -h / 2, w, h, 4);
        ctx.fill();

        // Вспышка при ударе
        if (this.damageFlash > 0) {
            ctx.fillStyle = `rgba(255, 80, 80, ${this.damageFlash * 0.5})`;
            this.roundRect(-w / 2, -h / 2, w, h, 4);
            ctx.fill();
        }

        // === КИРПИЧНАЯ КЛАДКА ===
        ctx.strokeStyle = this.hexToRGBA(this.darkenColor(this.primaryColor, 50), 0.25);
        ctx.lineWidth = 0.5;
        const brickH = 9;
        const brickW = 14;
        for (let row = 0; row < Math.floor(h / brickH); row++) {
            const by = -h / 2 + row * brickH;
            const offset = (row % 2) * (brickW / 2);
            for (let col = 0; col < Math.ceil(w / brickW) + 1; col++) {
                const bx = -w / 2 + col * brickW + offset;
                if (bx < w / 2 && bx + brickW > -w / 2) {
                    ctx.strokeRect(
                        Math.max(-w / 2, bx), by,
                        Math.min(brickW, w / 2 - bx), brickH
                    );
                }
            }
        }

        // === ДЕКОРАТИВНЫЙ ПОЯС (горизонтальная полоса) ===
        const beltY = -h / 6;
        const beltGrad = ctx.createLinearGradient(0, beltY - 4, 0, beltY + 4);
        beltGrad.addColorStop(0, '#777');
        beltGrad.addColorStop(0.5, '#999');
        beltGrad.addColorStop(1, '#666');
        ctx.fillStyle = beltGrad;
        ctx.fillRect(-w / 2 + 2, beltY - 3, w - 4, 6);

        // Заклёпки на поясе
        ctx.fillStyle = '#aaa';
        for (let i = 0; i < 7; i++) {
            const rx = -w / 2 + 8 + i * ((w - 16) / 6);
            ctx.beginPath();
            ctx.arc(rx, beltY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // === УГЛОВЫЕ БАШЕНКИ ===
        this.towers.forEach((tower, idx) => {
            this.drawTower(tower.x, tower.y, tower, idx);
        });

        // === ОКНА (ряд) ===
        const windowY = -h / 4 - 5;
        for (let i = 0; i < 3; i++) {
            const wx = -w / 3 + i * (w / 3);
            this.drawFancyWindow(wx, windowY, 10, 14);
        }

        // === ЦЕНТРАЛЬНЫЙ ПОРТАЛ / СИМВОЛ ===
        this.drawCentralPortal(0, 5);

        // === КРЫША ===
        this.drawRoof(w, h);

        // === ДВОЙНЫЕ ТРУБЫ ===
        this.drawChimney(-w * 0.25, -h / 2, 10, 20);
        this.drawChimney(w * 0.25, -h / 2, 8, 16);

        // === ФЛАГ ===
        this.drawFlag(0, -h / 2 - 28);

        // === ГЛАВНЫЕ ВОРОТА ===
        this.drawMainGate(0, h / 2);

        // === ШЕСТЕРЁНКИ ===
        this.drawGear(-w / 2 - 2, -5, 5, 8, this.gearRotation);
        this.drawGear(w / 2 + 2, -5, 5, 8, -this.gearRotation);
        this.drawGear(-w / 2 - 2, 15, 4, 6, -this.gearRotation * 1.5);
        this.drawGear(w / 2 + 2, 15, 4, 6, this.gearRotation * 1.5);

        // === ТРЕЩИНЫ ===
        if (healthPercent < 0.7) {
            const cracksToShow = Math.floor((1 - healthPercent) * this.crackLines.length);
            ctx.strokeStyle = `rgba(0, 0, 0, ${(1 - healthPercent) * 0.7})`;
            ctx.lineWidth = 1.2;
            for (let i = 0; i < cracksToShow; i++) {
                const crack = this.crackLines[i];
                ctx.beginPath();
                ctx.moveTo(crack.x, crack.y);
                crack.segments.forEach(seg => ctx.lineTo(seg.x, seg.y));
                ctx.stroke();
            }
        }

        // === ПОВРЕЖДЁННЫЕ ПЯТНА ===
        if (healthPercent < 0.5) {
            const numScorch = Math.floor((1 - healthPercent) * 6);
            for (let i = 0; i < numScorch; i++) {
                const sx = Math.sin(i * 2.3) * w * 0.35;
                const sy = Math.cos(i * 3.7) * h * 0.35;
                const scorchGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
                scorchGrad.addColorStop(0, 'rgba(20, 10, 5, 0.5)');
                scorchGrad.addColorStop(1, 'rgba(20, 10, 5, 0)');
                ctx.fillStyle = scorchGrad;
                ctx.beginPath();
                ctx.arc(sx, sy, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Огонь при критическом здоровье
        if (healthPercent < 0.3) {
            this.drawDamageFireEffect();
        }

        // === ОБВОДКА ЗДАНИЯ ===
        const borderPulse = this.isSpawning ? Math.sin(this.pulsePhase * 3) * 0.4 + 0.6 : 0;
        ctx.strokeStyle = this.isSpawning ?
            this.hexToRGBA('#ff2222', 0.5 + borderPulse) :
            this.darkenColor(this.primaryColor, 30);
        ctx.lineWidth = this.isSpawning ? 3 : 2;
        this.roundRect(-w / 2, -h / 2, w, h, 4);
        ctx.stroke();

        // === ВНЕШНЕЕ СВЕЧЕНИЕ ===
        if (this.isSpawning) {
            const outerGlow = ctx.createRadialGradient(0, 0, w / 2, 0, 0, w * 1.2);
            outerGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.2));
            outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(0, 0, w * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // === КОЛЬЦЕВОЙ ПРОГРЕСС СПАВНА ===
        const spawnProgress = this.spawnTimer / this.spawnInterval;
        if (spawnProgress > 0 && !this.isSpawning) {
            ctx.strokeStyle = this.hexToRGBA(this.glowColor, 0.5);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, w / 2 + 10, -Math.PI / 2, -Math.PI / 2 + spawnProgress * Math.PI * 2);
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Точка прогресса
            const pAngle = -Math.PI / 2 + spawnProgress * Math.PI * 2;
            const pdx = Math.cos(pAngle) * (w / 2 + 10);
            const pdy = Math.sin(pAngle) * (w / 2 + 10);
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.arc(pdx, pdy, 3, 0, Math.PI * 2);
            ctx.fill();

            // Свечение точки
            const dotGlow = ctx.createRadialGradient(pdx, pdy, 0, pdx, pdy, 8);
            dotGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.4));
            dotGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = dotGlow;
            ctx.beginPath();
            ctx.arc(pdx, pdy, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Частицы в мировых координатах
        this.drawParticles();

        // Полоска здоровья
        this.drawHealthBar();

        // Индикатор волны
        this.drawWaveIndicator();
    }

    /**
     * Отрисовка крыши
     */
    drawRoof(w, h) {
        // Основной скат
        const roofGrad = ctx.createLinearGradient(0, -h / 2 - 22, 0, -h / 2);
        roofGrad.addColorStop(0, this.lightenColor(this.roofColor, 30));
        roofGrad.addColorStop(0.5, this.roofColor);
        roofGrad.addColorStop(1, this.darkenColor(this.roofColor, 20));

        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 6, -h / 2 + 3);
        ctx.lineTo(-w / 4, -h / 2 - 22);
        ctx.lineTo(w / 4, -h / 2 - 22);
        ctx.lineTo(w / 2 + 6, -h / 2 + 3);
        ctx.closePath();
        ctx.fill();

        // Контур крыши
        ctx.strokeStyle = this.darkenColor(this.roofColor, 30);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Черепица
        ctx.strokeStyle = this.hexToRGBA(this.darkenColor(this.roofColor, 40), 0.35);
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            const ty = -h / 2 - 18 + i * 6;
            const leftX = -w / 2 - 6 + (i + 1) * 4;
            const rightX = w / 2 + 6 - (i + 1) * 4;
            // Горизонтальные линии
            ctx.beginPath();
            ctx.moveTo(leftX + 5, ty);
            ctx.lineTo(rightX - 5, ty);
            ctx.stroke();
        }

        // Зубцы (мерлоны) по краю крыши
        const merlonW = 8;
        const merlonH = 6;
        ctx.fillStyle = this.darkenColor(this.secondaryColor, 20);
        for (let i = 0; i < Math.floor(w / merlonW); i++) {
            if (i % 2 === 0) {
                const mx = -w / 2 + i * merlonW + 2;
                ctx.fillRect(mx, -h / 2 - merlonH + 2, merlonW - 2, merlonH);
                ctx.strokeStyle = this.hexToRGBA('#000', 0.3);
                ctx.lineWidth = 0.5;
                ctx.strokeRect(mx, -h / 2 - merlonH + 2, merlonW - 2, merlonH);
            }
        }
    }

    /**
     * Отрисовка угловой башенки
     */
    drawTower(tx, ty, tower, idx) {
        const tw = 14;
        const th = 18;

        // Тело башни
        const towerGrad = ctx.createLinearGradient(tx - tw / 2, ty - th, tx + tw / 2, ty);
        towerGrad.addColorStop(0, this.lightenColor(this.stoneColor, 20));
        towerGrad.addColorStop(0.5, this.stoneColor);
        towerGrad.addColorStop(1, this.darkenColor(this.stoneColor, 30));
        ctx.fillStyle = towerGrad;
        this.roundRect(tx - tw / 2, ty - th, tw, th, 2);
        ctx.fill();

        // Обводка башни
        ctx.strokeStyle = this.darkenColor(this.stoneColor, 40);
        ctx.lineWidth = 1;
        this.roundRect(tx - tw / 2, ty - th, tw, th, 2);
        ctx.stroke();

        // Кирпичики на башне
        ctx.strokeStyle = this.hexToRGBA(this.darkenColor(this.stoneColor, 50), 0.2);
        ctx.lineWidth = 0.3;
        for (let r = 0; r < 3; r++) {
            const by = ty - th + 3 + r * 5;
            ctx.beginPath();
            ctx.moveTo(tx - tw / 2 + 1, by);
            ctx.lineTo(tx + tw / 2 - 1, by);
            ctx.stroke();
        }

        // Конус крыши башни
        ctx.fillStyle = this.darkenColor(this.roofColor, 10);
        ctx.beginPath();
        ctx.moveTo(tx - tw / 2 - 2, ty - th + 1);
        ctx.lineTo(tx, ty - th - 10);
        ctx.lineTo(tx + tw / 2 + 2, ty - th + 1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this.darkenColor(this.roofColor, 30);
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Огонёк на вершине башни
        const fireIntensity = this.isSpawning ?
            0.6 + Math.sin(tower.firePhase) * 0.4 :
            0.2 + Math.sin(tower.firePhase * 0.3) * 0.15;

        const fireGlow = ctx.createRadialGradient(tx, ty - th - 10, 0, tx, ty - th - 10, 8);
        fireGlow.addColorStop(0, this.hexToRGBA('#FF4500', fireIntensity));
        fireGlow.addColorStop(0.4, this.hexToRGBA('#FF6600', fireIntensity * 0.5));
        fireGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fireGlow;
        ctx.beginPath();
        ctx.arc(tx, ty - th - 10, 8, 0, Math.PI * 2);
        ctx.fill();

        // Ядро огня
        ctx.fillStyle = this.hexToRGBA('#FFD700', fireIntensity);
        ctx.beginPath();
        ctx.arc(tx, ty - th - 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Маленькое окошко-бойница
        ctx.fillStyle = '#222';
        ctx.fillRect(tx - 2, ty - th + 7, 4, 6);
        const slitGlow = ctx.createRadialGradient(tx, ty - th + 10, 0, tx, ty - th + 10, 4);
        slitGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.4 * this.glowIntensity));
        slitGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = slitGlow;
        ctx.fillRect(tx - 2, ty - th + 7, 4, 6);
    }

    /**
     * Отрисовка красивого окна
     */
    drawFancyWindow(x, y, w, h) {
        const flickerVal = Math.sin(this.windowFlicker + x * 0.5) * 0.3 + 0.7;

        // Рама
        ctx.fillStyle = '#555';
        this.roundRect(x - w / 2 - 1.5, y - 1.5, w + 3, h + 3, 2);
        ctx.fill();

        // Тёмный фон
        ctx.fillStyle = '#111';
        this.roundRect(x - w / 2, y, w, h, 1);
        ctx.fill();

        // Арка сверху
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(x, y + 1, w / 2 + 1, Math.PI, 0, false);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(x, y + 1, w / 2 - 0.5, Math.PI, 0, false);
        ctx.fill();

        // Свечение изнутри
        const winGlow = ctx.createRadialGradient(x, y + h / 2, 0, x, y + h / 2, Math.max(w, h));
        winGlow.addColorStop(0, this.hexToRGBA(this.glowColor, flickerVal * 0.5 * this.glowIntensity + 0.1));
        winGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = winGlow;
        ctx.fillRect(x - w / 2, y, w, h);

        // Перекрестие
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.moveTo(x - w / 2, y + h / 2);
        ctx.lineTo(x + w / 2, y + h / 2);
        ctx.stroke();
    }

    /**
     * Центральный портал / магический символ
     */
    drawCentralPortal(cx, cy) {
        const radius = 14;

        // Тёмный круг портала
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.fill();

        // Металлическое кольцо
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Заклёпки на кольце
        ctx.fillStyle = '#aaa';
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const rx = cx + Math.cos(a) * (radius + 2);
            const ry = cy + Math.sin(a) * (radius + 2);
            ctx.beginPath();
            ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Вращающийся магический круг внутри
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.portalRotation);

        // Внутренние руны / символы
        ctx.strokeStyle = this.hexToRGBA(this.portalColor, 0.4 + this.glowIntensity * 0.4);
        ctx.lineWidth = 1;

        // Пентаграмма
        for (let i = 0; i < 5; i++) {
            const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const a2 = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a1) * radius * 0.8, Math.sin(a1) * radius * 0.8);
            ctx.lineTo(Math.cos(a2) * radius * 0.8, Math.sin(a2) * radius * 0.8);
            ctx.stroke();
        }

        // Внутренний круг
        ctx.strokeStyle = this.hexToRGBA(this.portalColor, 0.3 + this.glowIntensity * 0.3);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Точки энергии на вершинах
        ctx.fillStyle = this.hexToRGBA(this.portalColor, 0.6 + this.glowIntensity * 0.4);
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * radius * 0.8, Math.sin(a) * radius * 0.8, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Свечение портала
        const portalGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.5);
        portalGlow.addColorStop(0, this.hexToRGBA(this.portalColor, 0.3 * this.glowIntensity));
        portalGlow.addColorStop(0.5, this.hexToRGBA(this.portalColor, 0.1 * this.glowIntensity));
        portalGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = portalGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Пульсирующее ядро
        const coreSize = 3 + Math.sin(this.energyPhase) * 1.5;
        const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 2);
        coreGlow.addColorStop(0, this.hexToRGBA('#fff', 0.6 * this.glowIntensity));
        coreGlow.addColorStop(0.5, this.hexToRGBA(this.portalColor, 0.3 * this.glowIntensity));
        coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, coreSize * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Отрисовка трубы
     */
    drawChimney(cx, baseY, cw, ch) {
        // Тело трубы
        const chimGrad = ctx.createLinearGradient(cx - cw / 2, baseY - ch, cx + cw / 2, baseY - ch);
        chimGrad.addColorStop(0, '#555');
        chimGrad.addColorStop(0.3, '#777');
        chimGrad.addColorStop(0.7, '#666');
        chimGrad.addColorStop(1, '#444');
        ctx.fillStyle = chimGrad;
        ctx.fillRect(cx - cw / 2, baseY - ch, cw, ch + 2);

        // Кольца на трубе
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const ry = baseY - ch + 3 + i * (ch / 3);
            ctx.beginPath();
            ctx.moveTo(cx - cw / 2, ry);
            ctx.lineTo(cx + cw / 2, ry);
            ctx.stroke();
        }

        // Верхний обод
        ctx.fillStyle = '#888';
        ctx.fillRect(cx - cw / 2 - 2, baseY - ch - 3, cw + 4, 5);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx - cw / 2 - 2, baseY - ch - 3, cw + 4, 5);

        // Свечение из трубы
        if (this.glowIntensity > 0.2) {
            const smokeGlow = ctx.createRadialGradient(
                cx, baseY - ch - 3, 0,
                cx, baseY - ch - 3, 10
            );
            smokeGlow.addColorStop(0, this.hexToRGBA(this.glowColor, 0.3 * this.glowIntensity));
            smokeGlow.addColorStop(0.5, this.hexToRGBA('#FF6600', 0.15 * this.glowIntensity));
            smokeGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = smokeGlow;
            ctx.beginPath();
            ctx.arc(cx, baseY - ch - 3, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Отрисовка флага
     */
    drawFlag(fx, fy) {
        // Древко
        const poleGrad = ctx.createLinearGradient(fx - 1, fy, fx + 1, fy);
        poleGrad.addColorStop(0, '#999');
        poleGrad.addColorStop(0.5, '#ccc');
        poleGrad.addColorStop(1, '#888');
        ctx.fillStyle = poleGrad;
        ctx.fillRect(fx - 1.5, fy, 3, 18);

        // Шар на вершине
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Полотно флага (волнистое)
        const flagW = 18;
        const flagH = 10;
        const wave1 = Math.sin(this.flagWave) * 2;
        const wave2 = Math.sin(this.flagWave + 1) * 2.5;
        const wave3 = Math.sin(this.flagWave + 2) * 2;

        ctx.fillStyle = this.primaryColor;
        ctx.beginPath();
        ctx.moveTo(fx + 1.5, fy + 2);
        ctx.quadraticCurveTo(fx + flagW * 0.33, fy + 2 + wave1, fx + flagW * 0.66, fy + 2 + wave2);
        ctx.quadraticCurveTo(fx + flagW, fy + 2 + wave3, fx + flagW, fy + 2 + wave3);
        ctx.lineTo(fx + flagW, fy + 2 + flagH + wave3);
        ctx.quadraticCurveTo(fx + flagW * 0.66, fy + 2 + flagH + wave2, fx + flagW * 0.33, fy + 2 + flagH + wave1);
        ctx.quadraticCurveTo(fx + 1.5, fy + 2 + flagH, fx + 1.5, fy + 2 + flagH);
        ctx.closePath();
        ctx.fill();

        // Контур флага
        ctx.strokeStyle = this.darkenColor(this.primaryColor, 30);
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Символ на флаге (череп)
        ctx.fillStyle = this.hexToRGBA('#fff', 0.7);
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', fx + flagW * 0.5, fy + 2 + flagH / 2 + wave2 * 0.5);
    }

    /**
     * Отрисовка главных ворот
     */
    drawMainGate(gx, baseY) {
        const gateW = 22;
        const gateH = 24;
        const gateY = baseY - gateH;

        // Арка ворот (каменная)
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(gx - gateW / 2 - 3, baseY);
        ctx.lineTo(gx - gateW / 2 - 3, gateY + 6);
        ctx.arc(gx, gateY + 6, gateW / 2 + 3, Math.PI, 0, false);
        ctx.lineTo(gx + gateW / 2 + 3, baseY);
        ctx.closePath();
        ctx.fill();

        // Внутренняя тьма
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(gx - gateW / 2, baseY);
        ctx.lineTo(gx - gateW / 2, gateY + 8);
        ctx.arc(gx, gateY + 8, gateW / 2, Math.PI, 0, false);
        ctx.lineTo(gx + gateW / 2, baseY);
        ctx.closePath();
        ctx.fill();

        // Свечение портала внутри ворот
        const gateGlow = ctx.createRadialGradient(gx, baseY - gateH / 2, 0, gx, baseY - gateH / 2, gateW);
        gateGlow.addColorStop(0, this.hexToRGBA(this.portalColor, 0.6 * this.glowIntensity));
        gateGlow.addColorStop(0.5, this.hexToRGBA(this.glowColor, 0.3 * this.glowIntensity));
        gateGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gateGlow;
        ctx.beginPath();
        ctx.moveTo(gx - gateW / 2, baseY);
        ctx.lineTo(gx - gateW / 2, gateY + 8);
        ctx.arc(gx, gateY + 8, gateW / 2, Math.PI, 0, false);
        ctx.lineTo(gx + gateW / 2, baseY);
        ctx.closePath();
        ctx.fill();

        // Створки ворот
        const doorOffset = this.doorOpenAmount * gateW / 2 * 0.8;

        // Левая створка
        if (doorOffset < gateW / 2) {
            const leftW = gateW / 2 - doorOffset;
            ctx.fillStyle = '#3a2518';
            ctx.fillRect(gx - gateW / 2, gateY + 8, leftW, gateH - 8);

            // Доски на створке
            ctx.strokeStyle = '#2a1a10';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 3; i++) {
                const dx = gx - gateW / 2 + i * (leftW / 3);
                if (dx < gx - gateW / 2 + leftW) {
                    ctx.beginPath();
                    ctx.moveTo(dx, gateY + 8);
                    ctx.lineTo(dx, baseY);
                    ctx.stroke();
                }
            }

            // Петля
            ctx.fillStyle = '#666';
            ctx.fillRect(gx - gateW / 2, gateY + 12, 3, 4);
            ctx.fillRect(gx - gateW / 2, baseY - 8, 3, 4);
        }

        // Правая створка
        if (doorOffset < gateW / 2) {
            const rightW = gateW / 2 - doorOffset;
            ctx.fillStyle = '#3a2518';
            ctx.fillRect(gx + doorOffset, gateY + 8, rightW, gateH - 8);

            ctx.strokeStyle = '#2a1a10';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 3; i++) {
                const dx = gx + doorOffset + i * (rightW / 3);
                if (dx < gx + gateW / 2) {
                    ctx.beginPath();
                    ctx.moveTo(dx, gateY + 8);
                    ctx.lineTo(dx, baseY);
                    ctx.stroke();
                }
            }

            ctx.fillStyle = '#666';
            ctx.fillRect(gx + gateW / 2 - 3, gateY + 12, 3, 4);
            ctx.fillRect(gx + gateW / 2 - 3, baseY - 8, 3, 4);
        }

        // Каменное обрамление арки
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gx - gateW / 2 - 3, baseY);
        ctx.lineTo(gx - gateW / 2 - 3, gateY + 6);
        ctx.arc(gx, gateY + 6, gateW / 2 + 3, Math.PI, 0, false);
        ctx.lineTo(gx + gateW / 2 + 3, baseY);
        ctx.stroke();

        // Замковый камень (keystone)
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(gx - 5, gateY + 3);
        ctx.lineTo(gx, gateY - 2);
        ctx.lineTo(gx + 5, gateY + 3);
        ctx.lineTo(gx + 4, gateY + 8);
        ctx.lineTo(gx - 4, gateY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Символ на замковом камне
        ctx.fillStyle = this.hexToRGBA(this.portalColor, 0.6);
        ctx.font = 'bold 6px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔', gx, gateY + 4);
    }

    /**
     * Эффект огня при критическом здоровье
     */
    drawDamageFireEffect() {
        const w = this.width;
        const h = this.height;

        for (let i = 0; i < 3; i++) {
            const fx = (Math.sin(this.pulsePhase * 2 + i * 2.5)) * w * 0.3;
            const fy = (Math.cos(this.pulsePhase * 1.5 + i * 1.8)) * h * 0.2;
            const fSize = 6 + Math.sin(this.pulsePhase * 3 + i) * 3;

            const fireGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fSize);
            fireGrad.addColorStop(0, 'rgba(255, 200, 50, 0.6)');
            fireGrad.addColorStop(0.3, 'rgba(255, 100, 20, 0.4)');
            fireGrad.addColorStop(0.7, 'rgba(200, 50, 0, 0.2)');
            fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = fireGrad;
            ctx.beginPath();
            ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Отрисовка шестерёнки
     */
    drawGear(x, y, innerR, outerR, rotation) {
        const teeth = 7;
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
        ctx.arc(0, 0, innerR * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Спицы
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * innerR * 0.8, Math.sin(a) * innerR * 0.8);
            ctx.stroke();
        }

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
            smokeGrad.addColorStop(0, 'rgba(100, 100, 100, 0.5)');
            smokeGrad.addColorStop(0.5, 'rgba(70, 70, 70, 0.25)');
            smokeGrad.addColorStop(1, 'rgba(50, 50, 50, 0)');
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
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2 * s.life, 0, Math.PI * 2);
            ctx.fill();

            // Хвост искры
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025);
            ctx.stroke();
        });
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Портальные частицы
        this.portalParticles.forEach(p => {
            ctx.globalAlpha = p.life * 0.8;
            const ppGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            ppGlow.addColorStop(0, p.color);
            ppGlow.addColorStop(0.5, this.hexToRGBA(p.color, 0.3));
            ppGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = ppGlow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Амбиентные частицы
        this.ambientParticles.forEach(p => {
            ctx.globalAlpha = p.life * 0.6;
            const apGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
            apGlow.addColorStop(0, p.color);
            apGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = apGlow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Огненные частицы
        this.fireParticles.forEach(p => {
            ctx.globalAlpha = p.life;
            const fpGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            fpGlow.addColorStop(0, this.hexToRGBA(p.color, 0.8));
            fpGlow.addColorStop(0.4, this.hexToRGBA(p.color, 0.4));
            fpGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = fpGlow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Яркое ядро
            ctx.fillStyle = this.hexToRGBA('#fff', p.life * 0.5);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    /**
     * Улучшенная полоска здоровья
     */
    drawHealthBar() {
        if (!this.active) return;

        const barWidth = 100;
        const barHeight = 10;
        const barY = this.y - this.height / 2 - 35;
        const healthPercent = this.health / this.maxHealth;

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.roundRectAbs(this.x - barWidth / 2 + 2, barY + 2, barWidth, barHeight, 4);
        ctx.fill();

        // Фон
        const bgGrad = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
        bgGrad.addColorStop(0, 'rgba(30, 30, 30, 0.9)');
        bgGrad.addColorStop(1, 'rgba(10, 10, 10, 0.9)');
        ctx.fillStyle = bgGrad;
        this.roundRectAbs(this.x - barWidth / 2, barY, barWidth, barHeight, 4);
        ctx.fill();

        // Градиент здоровья
        if (healthPercent > 0) {
            const healthGrad = ctx.createLinearGradient(
                this.x - barWidth / 2, barY,
                this.x - barWidth / 2, barY + barHeight
            );

            if (healthPercent > 0.6) {
                healthGrad.addColorStop(0, '#5fff5f');
                healthGrad.addColorStop(0.4, '#00dd00');
                healthGrad.addColorStop(1, '#009900');
            } else if (healthPercent > 0.3) {
                healthGrad.addColorStop(0, '#ffff5f');
                healthGrad.addColorStop(0.4, '#dddd00');
                healthGrad.addColorStop(1, '#999900');
            } else {
                healthGrad.addColorStop(0, '#ff5f5f');
                healthGrad.addColorStop(0.4, '#dd0000');
                healthGrad.addColorStop(1, '#990000');

                // Пульсация при критическом здоровье
                const critPulse = Math.sin(this.pulsePhase * 4) * 0.3 + 0.7;
                ctx.globalAlpha = critPulse;
            }

            ctx.fillStyle = healthGrad;
            this.roundRectAbs(
                this.x - barWidth / 2 + 2,
                barY + 2,
                (barWidth - 4) * healthPercent,
                barHeight - 4,
                3
            );
            ctx.fill();
            ctx.globalAlpha = 1;

            // Блик
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.roundRectAbs(
                this.x - barWidth / 2 + 2,
                barY + 2,
                (barWidth - 4) * healthPercent,
                (barHeight - 4) / 2,
                3
            );
            ctx.fill();
        }

        // Разделители (сегменты)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const sx = this.x - barWidth / 2 + (barWidth / 10) * i;
            ctx.beginPath();
            ctx.moveTo(sx, barY + 2);
            ctx.lineTo(sx, barY + barHeight - 2);
            ctx.stroke();
        }

        // Обводка
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        this.roundRectAbs(this.x - barWidth / 2, barY, barWidth, barHeight, 4);
        ctx.stroke();

        // Текст здоровья
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#fff';
        ctx.fillText(
            `${Math.ceil(this.health)} / ${this.maxHealth}`,
            this.x,
            barY + barHeight / 2
        );
        ctx.shadowBlur = 0;
    }

    /**
     * Улучшенный индикатор волны
     */
    drawWaveIndicator() {
        if (!this.active) return;

        ctx.save();

        const indicatorY = this.y + this.height / 2 + 18;

        // Фон индикатора
        const bgW = 120;
        const bgH = 22;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.roundRectAbs(this.x - bgW / 2, indicatorY - 2, bgW, bgH, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        this.roundRectAbs(this.x - bgW / 2, indicatorY - 2, bgW, bgH, 6);
        ctx.stroke();

        // Текст волны
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;

        // Градиент текста
        const textGrad = ctx.createLinearGradient(
            this.x - 40, indicatorY + bgH / 2,
            this.x + 40, indicatorY + bgH / 2
        );
        textGrad.addColorStop(0, '#FFD700');
        textGrad.addColorStop(0.5, '#FFF');
        textGrad.addColorStop(1, '#FFD700');
        ctx.fillStyle = textGrad;
        ctx.fillText(`Волна ${this.waveNumber}/${this.maxWaves}`, this.x, indicatorY + bgH / 2 - 1);
        ctx.shadowBlur = 0;

        // Мини-прогресс волн
        const progressW = bgW - 10;
        const progressH = 3;
        const progressY = indicatorY + bgH - 5;
        const waveProgress = this.waveNumber / this.maxWaves;

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        this.roundRectAbs(this.x - progressW / 2, progressY, progressW, progressH, 1);
        ctx.fill();

        if (waveProgress > 0) {
            const wpGrad = ctx.createLinearGradient(
                this.x - progressW / 2, progressY,
                this.x - progressW / 2 + progressW * waveProgress, progressY
            );
            wpGrad.addColorStop(0, '#FF4444');
            wpGrad.addColorStop(1, '#FFD700');
            ctx.fillStyle = wpGrad;
            this.roundRectAbs(
                this.x - progressW / 2, progressY,
                progressW * waveProgress, progressH, 1
            );
            ctx.fill();
        }

        // Индикатор спавна
        if (this.isSpawning) {
            const spawnAlpha = Math.sin(this.pulsePhase * 4) * 0.4 + 0.6;
            ctx.fillStyle = this.hexToRGBA('#FF2222', spawnAlpha);
            ctx.font = 'bold 10px Arial';
            ctx.fillText('⚠ АТАКА ⚠', this.x, indicatorY + bgH + 12);

            // Мигающие точки
            for (let i = 0; i < 3; i++) {
                const dotAlpha = Math.sin(this.pulsePhase * 3 + i * 1.2) * 0.5 + 0.5;
                ctx.fillStyle = this.hexToRGBA('#FF4444', dotAlpha);
                ctx.beginPath();
                ctx.arc(this.x - 20 + i * 20, indicatorY + bgH + 22, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // === УТИЛИТЫ ===

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

    roundRectAbs(x, y, w, h, r) {
        this.roundRect(x, y, w, h, r);
    }

    hexToRGBA(hex, alpha) {
        // Защита от некорректных значений
        if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
        
        // Если уже rgba/rgb формат - извлекаем значения
        if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
            const match = hex.match(/[\d.]+/g);
            if (match && match.length >= 3) {
                return `rgba(${parseInt(match[0])}, ${parseInt(match[1])}, ${parseInt(match[2])}, ${alpha})`;
            }
            return `rgba(0, 0, 0, ${alpha})`;
        }

        // Убираем # если есть
        hex = hex.replace('#', '');

        let r = 0, g = 0, b = 0;

        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }

        // Защита от NaN
        r = isNaN(r) ? 0 : Math.max(0, Math.min(255, r));
        g = isNaN(g) ? 0 : Math.max(0, Math.min(255, g));
        b = isNaN(b) ? 0 : Math.max(0, Math.min(255, b));
        alpha = isNaN(alpha) ? 1 : Math.max(0, Math.min(1, alpha));

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    lightenColor(hex, amount) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#ffffff';
        try {
            let r = parseInt(hex.substring(1, 3), 16);
            let g = parseInt(hex.substring(3, 5), 16);
            let b = parseInt(hex.substring(5, 7), 16);
            r = Math.min(255, Math.max(0, (isNaN(r) ? 0 : r) + amount));
            g = Math.min(255, Math.max(0, (isNaN(g) ? 0 : g) + amount));
            b = Math.min(255, Math.max(0, (isNaN(b) ? 0 : b) + amount));
            return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
        } catch (e) {
            return '#ffffff';
        }
    }

    darkenColor(hex, amount) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#000000';
        try {
            let r = parseInt(hex.substring(1, 3), 16);
            let g = parseInt(hex.substring(3, 5), 16);
            let b = parseInt(hex.substring(5, 7), 16);
            r = Math.max(0, Math.min(255, (isNaN(r) ? 0 : r) - amount));
            g = Math.max(0, Math.min(255, (isNaN(g) ? 0 : g) - amount));
            b = Math.max(0, Math.min(255, (isNaN(b) ? 0 : b) - amount));
            return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
        } catch (e) {
            return '#000000';
        }
    }

    isDestroyed() {
        return !this.active || this.health <= 0;
    }
}