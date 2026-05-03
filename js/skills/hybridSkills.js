/**
 * HybridSkillManager — управляет гибридными способностями.
 * Способность разблокируется когда оба указанных навыка на уровне 5.
 */
class HybridSkillManager {
    constructor(owner) {
        this.owner = owner;

        // Внутренние таймеры / состояния
        this._sprintLightningTimer = 0;       // электрический спринт
        this._shieldAutoBlastCooldown = 0;    // щитовой резонанс
        this._phaseTrailTimer = 0;            // фазовый рывок
        this._phaseTrailActive = false;
        this._phaseTrailEnd = 0;
        this._healZones = [];                 // зоны исцеления (прыжок исцеления)
        this._hybridParticles = [];
        this._counterLightningCooldown = 0;   // грозовой барьер
        this._lastOnHitBoostTime = 0;         // кровавая регенерация — буст при ударе
        this._onHitBoostActive = false;
        this._onHitBoostEnd = 0;
    }

    // ───── утилиты ──────────────────────────────────────────
    _has(id) {
        const o = this.owner;
        const map = {
            blast:        () => o.blastSkill?.level >= 5,
            shield:       () => o.shieldSkill?.level >= 5,
            chainLightning: () => o.chainLightningSkill?.level >= 5,
            teleport:     () => o.teleportSkill?.level >= 5,
            regeneration: () => o.regenerationSkill?.level >= 5,
            doubleShoot:  () => o.doubleShootSkill?.level >= 5,
            speed:        () => o.speedSkill?.level >= 5,
            lifesteal:    () => o.lifestealSkill?.level >= 5,
        };
        return map[id] ? map[id]() : false;
    }

    /** Список разблокированных гибридов для UI */
    getUnlocked() {
        return HYBRID_DEFS.filter(h => h.requires.every(r => this._has(r)));
    }

    // ───── хуки, вызываемые из других мест ──────────────────

    /** Вызывается при каждом попадании снаряда в врага */
    onBulletHit(enemy, damage) {
        // 1. Разрывные снаряды (blast + doubleShoot)
        if (this._has('blast') && this._has('doubleShoot')) {
            if (Math.random() < 0.40) {
                this._miniBlast(enemy.x, enemy.y, 80, 100);
            }
        }
        // 2. Жадный стрелок: убийство — burst heal (doubleShoot + lifesteal)
        if (this._has('doubleShoot') && this._has('lifesteal')) {
            if (!enemy.active) {
                this.owner.heal(40);
                this._spawnParticles(enemy.x, enemy.y, '#ff4444', 8);
            }
        }
    }

    /** Вызывается сразу после телепорта */
    onTeleport(oldX, oldY) {
        // 3. Прыжок исцеления (teleport + regeneration)
        if (this._has('teleport') && this._has('regeneration')) {
            this.owner.heal(120);
            this._spawnParticles(this.owner.x, this.owner.y, '#00ff88', 16);
            this._healZones.push({
                x: this.owner.x, y: this.owner.y,
                radius: 150, life: 3.0, maxLife: 3.0,
                healPerSec: 20
            });
        }
        // 4. Молниеносный прыжок (teleport + chainLightning)
        if (this._has('teleport') && this._has('chainLightning')) {
            this._ballLightning(oldX, oldY, 150, 5, 300);
        }
        // 5. Фазовый рывок (teleport + speed): +1.5с фазовой ауры при след. спринте
        if (this._has('teleport') && this._has('speed')) {
            this._phaseTrailActive = true;
            this._phaseTrailEnd = Date.now() + 1500;
        }
    }

    /** Вызывается когда щит полностью уничтожен */
    onShieldBroken() {
        // 6. Щитовой резонанс (shield + blast)
        if (this._has('shield') && this._has('blast')) {
            const now = Date.now();
            if (now - this._shieldAutoBlastCooldown > 8000) {
                this._shieldAutoBlastCooldown = now;
                this._doAutoBlast(0.6);
            }
        }
    }

    /** Вызывается когда щит получает урон */
    onShieldDamaged() {
        // 7. Грозовой барьер (shield + chainLightning)
        if (this._has('shield') && this._has('chainLightning')) {
            const now = Date.now();
            if (now - this._counterLightningCooldown > 1000) {
                this._counterLightningCooldown = now;
                const shieldVal = this.owner.shieldSkill?.shieldAmount || 0;
                this._counterLightning(shieldVal * 0.4, 2, 250);
            }
        }
        // 8. Кровавая регенерация: буст вампиризма на 3с (lifesteal + regeneration)
        if (this._has('lifesteal') && this._has('regeneration')) {
            this._onHitBoostActive = true;
            this._onHitBoostEnd = Date.now() + 3000;
        }
    }

    /** Вызывается при нанесении урона молнией (из chainLightning.executeChainLightning) */
    onLightningDamage(damage) {
        // 9. Молниеносный вампир (chainLightning + lifesteal)
        if (this._has('chainLightning') && this._has('lifesteal')) {
            const heal = damage * 0.20;
            this.owner.heal(heal);
            if (typeof statManager !== 'undefined') statManager.healthRestoredLifeSteal += heal;
        }
    }

    // ───── основной update ───────────────────────────────────
    update(deltaTime) {
        const now = Date.now();

        // 10. Электрический спринт (chainLightning + speed)
        if (this._has('chainLightning') && this._has('speed')) {
            if (this.owner.speedSkill?.isActive) {
                this._sprintLightningTimer -= deltaTime;
                if (this._sprintLightningTimer <= 0) {
                    this._sprintLightningTimer = 0.5;
                    this._sprintLightning(90, 3, 280);
                }
            } else {
                this._sprintLightningTimer = 0;
            }
        }

        // 11. Реактивная броня (speed + shield): иммунитет щита во время спринта
        if (this._has('speed') && this._has('shield')) {
            const sk = this.owner.speedSkill;
            const sh = this.owner.shieldSkill;
            if (sk?.isActive && sh) {
                sh.shieldRegenRate = (sh.shieldRegenRate < 75) ? 75 : sh.shieldRegenRate;
                sh._reactiveArmorActive = true;
            } else if (sh) {
                sh._reactiveArmorActive = false;
            }
        }

        // 12. Кровавая регенерация (lifesteal + regeneration): +50% реген, буст вампиризма
        if (this._has('lifesteal') && this._has('regeneration')) {
            const rsk = this.owner.regenerationSkill;
            if (rsk) rsk._hybridRegenBoost = rsk.passiveRegen * 0.5;

            if (this._onHitBoostActive) {
                if (now >= this._onHitBoostEnd) {
                    this._onHitBoostActive = false;
                    this.owner.lifeSteal = this.owner.lifestealSkill?.passiveAmount || 0;
                } else {
                    const base = this.owner.lifestealSkill?.passiveAmount || 0;
                    this.owner.lifeSteal = base * 2.0;
                }
            }
        }

        // 13. Взрыв жизни (blast + regeneration): исцеление при взрыве — обрабатывается в onBlast

        // 14. Фазовый рывок — уклонение 70% первые 1.5с спринта
        if (this._has('teleport') && this._has('speed')) {
            if (this._phaseTrailActive && now >= this._phaseTrailEnd) {
                this._phaseTrailActive = false;
            }
        }

        // Зоны исцеления
        this._healZones = this._healZones.filter(z => {
            z.life -= deltaTime;
            if (this.owner.x !== undefined) {
                const dx = this.owner.x - z.x, dy = this.owner.y - z.y;
                if (Math.sqrt(dx * dx + dy * dy) < z.radius) {
                    this.owner.heal(z.healPerSec * deltaTime);
                }
            }
            return z.life > 0;
        });

        // Частицы
        this._hybridParticles = this._hybridParticles.filter(p => {
            p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
            p.vx *= 0.95; p.vy *= 0.95;
            p.life -= deltaTime * 2;
            return p.life > 0;
        });
    }

    // ───── hook: после активации взрыва ──────────────────────
    onBlast(totalDamage, hitCount) {
        // Взрыв жизни (blast + regeneration)
        if (this._has('blast') && this._has('regeneration')) {
            const heal = Math.min(totalDamage * 0.30, 300);
            this.owner.heal(heal);
            this._spawnParticles(this.owner.x, this.owner.y, '#00ff44', 12);
        }
    }

    // ───── приватные помощники ───────────────────────────────
    _miniBlast(x, y, damage, radius) {
        if (typeof enemies === 'undefined') return;
        enemies.forEach(e => {
            if (!e.active) return;
            const dx = e.x - x, dy = e.y - y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                e.takeDamageBySkill(damage);
                if (!e.active && typeof enemyDead === 'function') enemyDead(e.x, e.y);
            }
        });
        this._spawnParticles(x, y, '#ff8800', 10);
        if (typeof cameraShake !== 'undefined') cameraShake.trigger(4);
    }

    _doAutoBlast(power) {
        if (typeof enemies === 'undefined') return;
        const bs = this.owner.blastSkill;
        const r = (bs?.radius || 300) * power;
        const d = (bs?.damage || 200) * power;
        enemies.forEach(e => {
            if (!e.active) return;
            const dx = e.x - this.owner.x, dy = e.y - this.owner.y;
            if (Math.sqrt(dx * dx + dy * dy) <= r) {
                e.takeDamageBySkill(d);
                if (!e.active && typeof enemyDead === 'function') enemyDead(e.x, e.y);
            }
        });
        this._spawnParticles(this.owner.x, this.owner.y, '#ffaa00', 20);
        if (typeof cameraShake !== 'undefined') cameraShake.trigger(8);
    }

    _ballLightning(x, y, damage, maxTargets, range) {
        if (typeof enemies === 'undefined') return;
        const cl = this.owner.chainLightningSkill;
        const hit = new Set();
        let pool = enemies.filter(e => e.active);
        pool.sort((a, b) => {
            const da = Math.hypot(a.x - x, a.y - y);
            const db = Math.hypot(b.x - x, b.y - y);
            return da - db;
        });
        let prev = { x, y };
        for (let i = 0; i < Math.min(maxTargets, pool.length); i++) {
            const e = pool[i];
            if (Math.hypot(e.x - prev.x, e.y - prev.y) > range) break;
            e.takeDamageBySkill(damage);
            if (cl) cl.createLightningEffect(prev.x, prev.y, e.x, e.y);
            if (!e.active && typeof enemyDead === 'function') enemyDead(e.x, e.y);
            prev = e;
        }
        if (typeof soundManager !== 'undefined' && soundManager.playLightning) soundManager.playLightning();
    }

    _sprintLightning(damage, chains, range) {
        if (typeof enemies === 'undefined') return;
        const cl = this.owner.chainLightningSkill;
        const active = enemies.filter(e => e.active);
        if (!active.length) return;
        active.sort((a, b) => Math.hypot(a.x - this.owner.x, a.y - this.owner.y) - Math.hypot(b.x - this.owner.x, b.y - this.owner.y));
        const first = active[0];
        if (Math.hypot(first.x - this.owner.x, first.y - this.owner.y) > range) return;
        first.takeDamageBySkill(damage);
        if (cl) cl.createLightningEffect(this.owner.x, this.owner.y, first.x, first.y);
        if (!first.active && typeof enemyDead === 'function') enemyDead(first.x, first.y);
        let prev = first;
        for (let c = 1; c < chains; c++) {
            const next = active.find(e => e !== prev && e.active && Math.hypot(e.x - prev.x, e.y - prev.y) <= range);
            if (!next) break;
            next.takeDamageBySkill(damage * 0.7);
            if (cl) cl.createLightningEffect(prev.x, prev.y, next.x, next.y);
            if (!next.active && typeof enemyDead === 'function') enemyDead(next.x, next.y);
            prev = next;
        }
        if (typeof soundManager !== 'undefined' && soundManager.playLightning) soundManager.playLightning();
    }

    _counterLightning(damage, chains, range) {
        this._ballLightning(this.owner.x, this.owner.y, damage, chains, range);
    }

    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = Math.random() * 120 + 40;
            this._hybridParticles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, size: Math.random() * 5 + 2, color });
        }
    }

    // ───── draw ──────────────────────────────────────────────
    draw() {
        // Зоны исцеления
        this._healZones.forEach(z => {
            ctx.save();
            const a = (z.life / z.maxLife) * 0.25;
            const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
            g.addColorStop(0, `rgba(0,255,136,${a})`);
            g.addColorStop(1, 'rgba(0,255,136,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(0,255,136,${a * 2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });

        // Частицы
        this._hybridParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8; ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Аура фазового рывка
        if (this._phaseTrailActive) {
            ctx.save();
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(180,100,255,${0.5 * pulse})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15; ctx.shadowColor = '#aa44ff';
            ctx.beginPath();
            ctx.arc(this.owner.x, this.owner.y, 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    /** Шанс уклонения от фазового рывка */
    getPhaseTrailDodge() {
        if (this._has('teleport') && this._has('speed') && this._phaseTrailActive) return 70;
        return 0;
    }
}

// ───── Данные для UI ──────────────────────────────────────────
const HYBRID_DEFS = [
    { id: 'blast_doubleShoot',     requires: ['blast','doubleShoot'],     icon: '💥🔥', name: 'Разрывные снаряды',     desc: '40% шанс мини-взрыва (80 урона, р.100) при попадании снаряда' },
    { id: 'teleport_regeneration', requires: ['teleport','regeneration'], icon: '🌀💚', name: 'Прыжок исцеления',       desc: 'Телепорт восстанавливает 120 HP + зона регенерации 3с' },
    { id: 'chainLightning_speed',  requires: ['chainLightning','speed'],  icon: '⚡💨', name: 'Электрический спринт',  desc: 'Во время ускорения молния каждые 0.5с (90 урона, 3 цели)' },
    { id: 'shield_blast',          requires: ['shield','blast'],          icon: '🛡️💥', name: 'Щитовой резонанс',      desc: 'Разрушение щита — авто-взрыв 60% мощности (КД 8с)' },
    { id: 'lifesteal_regeneration',requires: ['lifesteal','regeneration'],icon: '🩸💚', name: 'Кровавая регенерация',   desc: '+50% реген, при получении урона вампиризм ×2 на 3с' },
    { id: 'teleport_chainLightning',requires: ['teleport','chainLightning'],icon: '🌀⚡', name: 'Молниеносный прыжок', desc: 'Шаровая молния 150 урона на 5 целей в точке вылета' },
    { id: 'doubleShoot_lifesteal', requires: ['doubleShoot','lifesteal'], icon: '🔥🩸', name: 'Жадный стрелок',        desc: 'Вампиризм с каждого снаряда + 40 HP при убийстве' },
    { id: 'speed_shield',          requires: ['speed','shield'],          icon: '💨🛡️', name: 'Реактивная броня',      desc: 'Во время ускорения реген щита ×3, иммунитет расхода щита' },
    { id: 'blast_regeneration',    requires: ['blast','regeneration'],    icon: '💥💚', name: 'Взрыв жизни',           desc: 'Взрыв восстанавливает 30% нанесённого урона (макс. 300)' },
    { id: 'chainLightning_lifesteal', requires: ['chainLightning','lifesteal'], icon: '⚡🩸', name: 'Молниеносный вампир', desc: '20% HP возвращается с каждого урона молнии' },
    { id: 'teleport_speed',        requires: ['teleport','speed'],        icon: '🌀💨', name: 'Фазовый рывок',         desc: 'После телепорта — 70% уклонение первые 1.5с следующего спринта' },
    { id: 'shield_chainLightning', requires: ['shield','chainLightning'], icon: '🛡️⚡', name: 'Грозовой барьер',       desc: 'Попадание по щиту — контрмолния (щит×0.4 урона, 2 цели, КД 1с)' },
];
