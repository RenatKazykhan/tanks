class ModulesUpgrade {
    constructor() {
        this.selectedModuleName = null;
        // Базовые характеристики танка (константы, никогда не меняются)
        this.BASE_TANK_STATS = {
            health: 200,
            maxHealth: 200,
            speed: 100,
            damage: 30,
            fireRate: 1100,
            bulletSpeed: 300,
            regen: 0,
            armor: 0,
            doubleShot: false,
            lifeSteal: 0,
            turretRotationSpeed: 1,
            bodyRotationSpeed: 1,
            visibilityRadius: 300
        };

        const BASE = this.BASE_TANK_STATS;

        // Система модулей танка
        this.tankModules = {
            gun: {
                name: 'Орудие',
                icon: '🔫',
                level: 0,
                maxLevel: 20,
                baseCost: 50,
                costMultiplier: 1.6,
                description: 'Увеличивает урон и уменьшает перезарядку',
                getEffects(level) {
                    return {
                        damage: BASE.damage + level * 5,
                        fireRate: Math.max(200, BASE.fireRate - level * 10)
                    };
                },
                getStatsDisplay(level) {
                    const e = this.getEffects(level);
                    const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
                    return [
                        { label: '🔫 Урон', value: e.damage, next: next ? next.damage : null },
                        { label: '🚀 Перезарядка', value: e.fireRate + 'мс', next: next ? next.fireRate + 'мс' : null }
                    ];
                }
            },
            turret: {
                name: 'Башня',
                icon: '🗼',
                level: 0,
                maxLevel: 20,
                baseCost: 60,
                costMultiplier: 1.5,
                description: 'Увеличивает дальность обзора и скорость поворота башни',
                getEffects(level) {
                    return {
                        visibilityRadius: BASE.visibilityRadius + level * 10,
                        turretRotationSpeed: BASE.turretRotationSpeed + level * 0.5
                    };
                },
                getStatsDisplay(level) {
                    const e = this.getEffects(level);
                    const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
                    return [
                        { label: '👁️ Обзор', value: e.visibilityRadius, next: next ? next.visibilityRadius : null },
                        { label: '🔄 Поворот башни', value: e.turretRotationSpeed.toFixed(1), next: next ? next.turretRotationSpeed.toFixed(1) : null }
                    ];
                }
            },
            engine: {
                name: 'Мотор',
                icon: '⚙️',
                level: 0,
                maxLevel: 20,
                baseCost: 60,
                costMultiplier: 1.8,
                description: 'Увеличивает скорость движения танка',
                getEffects(level) {
                    return {
                        speed: BASE.speed + level * 10
                    };
                },
                getStatsDisplay(level) {
                    const e = this.getEffects(level);
                    const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
                    return [
                        { label: '⚡ Скорость', value: e.speed, next: next ? next.speed : null }
                    ];
                }
            },
            tracks: {
                name: 'Гусеницы',
                icon: '🛞',
                level: 0,
                maxLevel: 20,
                baseCost: 40,
                costMultiplier: 1.6,
                description: 'Увеличивает скорость поворота танка',
                getEffects(level) {
                    return {
                        bodyRotationSpeed: BASE.bodyRotationSpeed + level * 0.1
                    };
                },
                getStatsDisplay(level) {
                    const e = this.getEffects(level);
                    const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
                    return [
                        { label: '🔄 Поворот корпуса', value: e.bodyRotationSpeed.toFixed(1), next: next ? next.bodyRotationSpeed.toFixed(1) : null }
                    ];
                }
            },
            shells: {
                name: 'Снаряды',
                icon: '🎯',
                level: 0,
                maxLevel: 20,
                baseCost: 50,
                costMultiplier: 1.4,
                description: 'Увеличивает скорость снаряда',
                getEffects(level) {
                    return {
                        bulletSpeed: BASE.bulletSpeed + level * 10
                    };
                },
                getStatsDisplay(level) {
                    const e = this.getEffects(level);
                    const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
                    return [
                        { label: '💨 Скорость снаряда', value: e.bulletSpeed, next: next ? next.bulletSpeed : null }
                    ];
                }
            },
            hull: {
                name: 'Корпус',
                icon: '🛡️',
                level: 0,
                maxLevel: 20,
                baseCost: 80,
                costMultiplier: 1.9,
                description: 'Увеличивает прочность, броню и регенерацию',
                getEffects(level) {
                    return {
                        maxHealth: BASE.maxHealth + level * 20,
                        armor: Math.min(70, BASE.armor + level * 1),
                        regen: BASE.regen + level * 1
                    };
                },
                getStatsDisplay(level) {
                    const e = this.getEffects(level);
                    const next = level < this.maxLevel ? this.getEffects(level + 1) : null;
                    return [
                        { label: '❤️ Прочность', value: e.maxHealth, next: next ? next.maxHealth : null },
                        { label: '🛡️ Броня', value: e.armor + '%', next: next ? next.armor + '%' : null },
                        { label: '♻️ Регенерация', value: e.regen + ' hp/с', next: next ? next.regen + ' hp/с' : null }
                    ];
                }
            }
        };
    }

    // Вычисление стоимости улучшения модуля
    getModuleCost(moduleName) {
        const mod = this.tankModules[moduleName];
        if (!mod || mod.level >= mod.maxLevel) return Infinity;
        return Math.floor(mod.baseCost * Math.pow(mod.costMultiplier, mod.level));
    }

    // Пересчёт характеристик player из уровней модулей
    recalcTankStats() {
        const gunEff = this.tankModules.gun.getEffects(this.tankModules.gun.level);
        const turretEff = this.tankModules.turret.getEffects(this.tankModules.turret.level);
        const tracksEff = this.tankModules.tracks.getEffects(this.tankModules.tracks.level);
        const engineEff = this.tankModules.engine.getEffects(this.tankModules.engine.level);
        const shellsEff = this.tankModules.shells.getEffects(this.tankModules.shells.level);
        const hullEff = this.tankModules.hull.getEffects(this.tankModules.hull.level);

        player.damage = gunEff.damage;

        // Складываем бонусы перезарядки от орудия и башни
        const gunFireRateBonus = this.BASE_TANK_STATS.fireRate - gunEff.fireRate;
        player.shotCooldown = Math.max(200, this.BASE_TANK_STATS.fireRate - gunFireRateBonus);

        // Складываем бонусы здоровья от башни и корпуса;
        const hullHealthBonus = hullEff.maxHealth - this.BASE_TANK_STATS.maxHealth;
        player.maxHealth = this.BASE_TANK_STATS.maxHealth + hullHealthBonus;
        player.health = player.maxHealth;

        player.visibilityRadius = turretEff.visibilityRadius;
        player.turretRotationSpeed = turretEff.turretRotationSpeed;
        player.speed = engineEff.speed;
        player.bodyRotationSpeed = tracksEff.bodyRotationSpeed;
        player.bulletSpeed = shellsEff.bulletSpeed;
        player.armor = hullEff.armor;
        player.regen = hullEff.regen;
    }

    // Обновление панели модуля
    updateModulePanel(moduleName) {
        this.selectedModuleName = moduleName;
        const mod = this.tankModules[moduleName];
        if (!mod) return;

        // Подсветка активной кнопки
        document.querySelectorAll('.module-btn').forEach(btn => {
            btn.classList.toggle('module-btn-active', btn.dataset.module === moduleName);
        });

        document.getElementById('moduleDetailIcon').textContent = mod.icon;
        document.getElementById('moduleDetailName').textContent = mod.name;
        document.getElementById('moduleDetailLevel').textContent =
            mod.level >= mod.maxLevel
                ? `Уровень ${mod.level} / ${mod.maxLevel} — МАКСИМУМ`
                : `Уровень ${mod.level} / ${mod.maxLevel}`;

        // Статы
        const statsContainer = document.getElementById('moduleDetailStats');
        const stats = mod.getStatsDisplay(mod.level);
        statsContainer.innerHTML = stats.map(s => {
            const upgradeHint = s.next !== null ? `<span class="module-stat-upgrade">→ ${s.next}</span>` : '';
            return `<div class="module-stat-row">
                <span class="module-stat-label">${s.label}</span>
                <span><span class="module-stat-value">${s.value}</span>${upgradeHint}</span>
            </div>`;
        }).join('');

        // Кнопка улучшения
        const actionsDiv = document.getElementById('moduleDetailActions');
        const upgradeBtn = document.getElementById('moduleUpgradeBtn');
        const costSpan = document.getElementById('moduleUpgradeCost');

        if (mod.level >= mod.maxLevel) {
            actionsDiv.style.display = 'flex';
            upgradeBtn.disabled = true;
            costSpan.textContent = 'МАКСИМУМ';
        } else {
            const cost = this.getModuleCost(moduleName);
            actionsDiv.style.display = 'flex';
            upgradeBtn.disabled = points < cost;
            costSpan.textContent = `Улучшить (${cost})`;
        }
    }

    selectModuleBtn(moduleName) {
        this.updateModulePanel(moduleName);
    }

    // Улучшение модуля
    upgradeModule() {
        if (!this.selectedModuleName) return;
        const mod = this.tankModules[this.selectedModuleName];
        if (!mod || mod.level >= mod.maxLevel) return;

        const cost = this.getModuleCost(this.selectedModuleName);
        if (points < cost) return;

        points -= cost;
        mod.level++;          
        this.recalcTankStats();   
        this.saveModules();

        // Обновляем UI
        this.updateModulePanel(this.selectedModuleName);
        this.updateAllModuleBadges();
        document.getElementById('pointsValue').textContent = points;
        localStorage.setItem('tankGamePoints', points);
    }

    updateAllModuleBadges() {
        for (const [key, mod] of Object.entries(this.tankModules)) {
            const badge = document.getElementById(key + 'LevelBadge');
            if (badge) {
                badge.textContent = `Ур. ${mod.level}`;
            }
            const miniFill = document.getElementById(key + 'MiniFill');
            if (miniFill) {
                miniFill.style.width = (mod.level / mod.maxLevel * 100) + '%';
            }
        }
    }

    saveModules() {
        const levels = {};
        for (const [key, mod] of Object.entries(this.tankModules)) {
            levels[key] = mod.level;
        }
        localStorage.setItem('tankModuleLevels', JSON.stringify(levels));
    }

    loadModules() {
        const saved = localStorage.getItem('tankModuleLevels');
        if (saved) {
            const levels = JSON.parse(saved);
            for (const [key, level] of Object.entries(levels)) {
                if (this.tankModules[key]) {
                    this.tankModules[key].level = level;
                }
            }
            this.recalcTankStats();
        }
    }

    // Функция сброса всех характеристик
   resetAllStats() {
        for (const key in this.tankModules) {
            this.tankModules[key].level = 0;
        }
        this.recalcTankStats();    // ✅ Пересчёт вернёт к базовым значениям
        this.saveModules();

        recordScore = 0;
        localStorage.setItem('tankGameRecord', recordScore);
        updateUIManager.updateUpgradeUI(this);
        this.updateAllModuleBadges();

        if (this.selectedModuleName) {
            this.updateModulePanel(this.selectedModuleName);
        }
    }
}