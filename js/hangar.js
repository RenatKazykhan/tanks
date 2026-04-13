// ===== СИСТЕМА АНГАРА =====
const HangarSystem = {
    // Максимальные уровни
    MAX_LEVEL: 10,
    MAX_AMMO_LEVEL: 8,

    // Конфигурация модулей
    modules: {
        gun: {
            level: 0,
            baseCost: 50,
            costMultiplier: 1.4,
            effects: {
                damage: { base: 0, perLevel: 3, label: 'Урон' },
                fireRate: { base: 0, perLevel: -25, label: 'Перезарядка (мс)' }
            }
        },
        turret: {
            level: 0,
            baseCost: 40,
            costMultiplier: 1.35,
            effects: {
                turretRotation: { base: 0, perLevel: 0.3, label: 'Скор. поворота башни' },
                health: { base: 0, perLevel: 15, label: 'HP' },
                vision: { base: 0, perLevel: 20, label: 'Дальность обзора' }
            }
        },
        engine: {
            level: 0,
            baseCost: 30,
            costMultiplier: 1.3,
            effects: {
                speed: { base: 0, perLevel: 5, label: 'Скорость движения' }
            }
        },
        tracks: {
            level: 0,
            baseCost: 35,
            costMultiplier: 1.35,
            effects: {
                speed: { base: 0, perLevel: 3, label: 'Скорость движения' },
                bodyRotation: { base: 0, perLevel: 0.2, label: 'Скор. поворота корпуса' }
            }
        },
        ammo: {
            level: 0,
            baseCost: 45,
            costMultiplier: 1.4,
            effects: {
                damage: { base: 0, perLevel: 2, label: 'Общий урон' }
            }
        },
        armor: {
            level: 0,
            baseCost: 70,
            costMultiplier: 1.5,
            effects: {
                armor: { base: 0, perLevel: 2, label: 'Броня' }
            }
        },
        regen: {
            level: 0,
            baseCost: 60,
            costMultiplier: 1.4,
            effects: {
                regen: { base: 0, perLevel: 0.5, label: 'HP/сек' }
            }
        },
        lifeSteal: {
            level: 0,
            baseCost: 60,
            costMultiplier: 1.45,
            effects: {
                lifeSteal: { base: 0, perLevel: 2, label: 'Вампиризм (%)' }
            }
        }
    },

    // Подтипы снарядов
    ammoTypes: {
        ap: {
            level: 0,
            baseCost: 30,
            costMultiplier: 1.35,
            name: 'Бронебойные',
            effects: {
                armorPen: { base: 0, perLevel: 5, label: 'Пробитие (%)' },
                heavyDamage: { base: 0, perLevel: 3, label: 'Урон по тяжёлым' }
            }
        },
        heat: {
            level: 0,
            baseCost: 35,
            costMultiplier: 1.4,
            name: 'Кумулятивные',
            effects: {
                aoeDamage: { base: 0, perLevel: 4, label: 'Урон по площади (%)' },
                burnChance: { base: 0, perLevel: 5, label: 'Шанс поджога (%)' }
            }
        },
        he: {
            level: 0,
            baseCost: 40,
            costMultiplier: 1.45,
            name: 'Фугасные',
            effects: {
                blastRadius: { base: 0, perLevel: 8, label: 'Радиус взрыва (%)' },
                stunChance: { base: 0, perLevel: 4, label: 'Шанс оглушения (%)' }
            }
        }
    },

    // Инициализация
    init() {
        this.loadFromStorage();
        this.drawTank();
        this.updateAllUI();
        this.updateAffordability();
        this.drawArrows();
    },

    // ===== РИСОВАНИЕ ТАНКА НА CANVAS =====
    drawTank() {
        const canvas = document.getElementById('hangarTankCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Фоновая сетка
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        for (let i = 0; i < h; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }

        const cx = w / 2;
        const cy = h / 2;

        // Подсветка под танком
        const glow = ctx.createRadialGradient(cx, cy + 20, 10, cx, cy + 20, 120);
        glow.addColorStop(0, 'rgba(100, 200, 255, 0.15)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // === ГУСЕНИЦЫ ===
        const trackColor = this.getModuleColor('tracks');
        const trackWidth = 22;
        const trackLength = 100;

        // Левая гусеница
        ctx.save();
        ctx.fillStyle = trackColor.dark;
        ctx.strokeStyle = trackColor.main;
        ctx.lineWidth = 2;
        this.roundRect(ctx, cx - 55, cy - trackLength / 2, trackWidth, trackLength, 6);
        ctx.fill();
        ctx.stroke();

        // Детали гусеницы — траки
        ctx.strokeStyle = trackColor.light;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const y = cy - trackLength / 2 + 8 + i * 12;
            ctx.beginPath();
            ctx.moveTo(cx - 55 + 3, y);
            ctx.lineTo(cx - 55 + trackWidth - 3, y);
            ctx.stroke();
        }
        ctx.restore();

        // Правая гусеница
        ctx.save();
        ctx.fillStyle = trackColor.dark;
        ctx.strokeStyle = trackColor.main;
        ctx.lineWidth = 2;
        this.roundRect(ctx, cx + 33, cy - trackLength / 2, trackWidth, trackLength, 6);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = trackColor.light;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const y = cy - trackLength / 2 + 8 + i * 12;
            ctx.beginPath();
            ctx.moveTo(cx + 33 + 3, y);
            ctx.lineTo(cx + 33 + trackWidth - 3, y);
            ctx.stroke();
        }
        ctx.restore();

        // === КОРПУС ===
        const bodyColor = this.getModuleColor('engine');
        ctx.save();
        ctx.fillStyle = bodyColor.dark;
        ctx.strokeStyle = bodyColor.main;
        ctx.lineWidth = 2;
        this.roundRect(ctx, cx - 35, cy - 45, 70, 90, 8);
        ctx.fill();
        ctx.stroke();

        // Детали корпуса — решётка двигателя
        ctx.fillStyle = bodyColor.light;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(cx - 20 + i * 12, cy + 20, 8, 18);
        }
        ctx.globalAlpha = 1;

        // Люк мехвода
        ctx.fillStyle = bodyColor.main;
        ctx.beginPath();
        ctx.arc(cx, cy - 25, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bodyColor.light;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // === БАШНЯ ===
        const turretColor = this.getModuleColor('turret');
        ctx.save();
        ctx.fillStyle = turretColor.dark;
        ctx.strokeStyle = turretColor.main;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Внутренний круг башни
        ctx.fillStyle = turretColor.main;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Командирская башенка
        ctx.fillStyle = turretColor.light;
        ctx.beginPath();
        ctx.arc(cx + 8, cy - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = turretColor.main;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // === ОРУДИЕ ===
        const gunColor = this.getModuleColor('gun');
        const gunLength = 65 + this.modules.gun.level * 3;
        const gunWidth = 8 + this.modules.gun.level * 0.5;

        ctx.save();
        ctx.fillStyle = gunColor.dark;
        ctx.strokeStyle = gunColor.main;
        ctx.lineWidth = 2;

        // Ствол
        this.roundRect(ctx, cx - gunWidth / 2, cy - 5 - gunLength, gunWidth, gunLength, 3);
        ctx.fill();
        ctx.stroke();

        // Дульный тормоз
        ctx.fillStyle = gunColor.main;
        this.roundRect(ctx, cx - gunWidth / 2 - 3, cy - 5 - gunLength - 2, gunWidth + 6, 10, 2);
        ctx.fill();
        ctx.strokeStyle = gunColor.light;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // === МЕТКИ МОДУЛЕЙ (точки-индикаторы) ===
        this.drawModuleIndicator(ctx, cx, cy - 70, gunColor.main, 'gun');      // Орудие — сверху
        this.drawModuleIndicator(ctx, cx + 30, cy - 5, turretColor.main, 'turret'); // Башня — справа
        this.drawModuleIndicator(ctx, cx, cy + 35, bodyColor.main, 'engine');   // Двигатель — снизу
        this.drawModuleIndicator(ctx, cx - 50, cy + 10, trackColor.main, 'tracks'); // Гусеницы — слева
        this.drawModuleIndicator(ctx, cx, cy - 90, '#ff55ff', 'ammo');          // Снаряды — на конце ствола

        // === ПОДПИСИ УРОВНЕЙ ===
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';

        this.drawLevelBadge(ctx, cx - 70, cy - 60, this.modules.gun.level, gunColor.main, '🔫');
        this.drawLevelBadge(ctx, cx + 70, cy - 20, this.modules.turret.level, turretColor.main, '🏗️');
        this.drawLevelBadge(ctx, cx + 70, cy + 30, this.modules.engine.level, bodyColor.main, '🔧');
        this.drawLevelBadge(ctx, cx - 70, cy + 30, this.modules.tracks.level, trackColor.main, '⛓️');
        this.drawLevelBadge(ctx, cx, cy - 110, this.modules.ammo.level, '#ff55ff', '💥');
    },

    // Рисование индикатора модуля
    drawModuleIndicator(ctx, x, y, color, moduleKey) {
        const level = this.modules[moduleKey] ? this.modules[moduleKey].level : 0;
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 4 + level * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = pulse;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    },

    // Рисование бейджа уровня
    drawLevelBadge(ctx, x, y, level, color, icon) {
        ctx.save();

        // Фон бейджа
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x - 22, y - 10, 44, 22, 6);
        ctx.fill();
        ctx.stroke();

        // Текст
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`$${icon} $${level}`, x, y + 1);

        ctx.restore();
    },

    // Вспомогательная функция — скруглённый прямоугольник
    roundRect(ctx, x, y, w, h, r) {
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
    },

    // Цвета модулей по уровню
    getModuleColor(moduleKey) {
        const level = this.modules[moduleKey] ? this.modules[moduleKey].level : 0;
        const intensity = Math.min(level / this.MAX_LEVEL, 1);

        const colors = {
            gun: {
                dark: this.lerpColor('#3a3020', '#5a4a20', intensity),
                main: this.lerpColor('#886600', '#ffaa00', intensity),
                light: this.lerpColor('#aa8833', '#ffcc44', intensity)
            },
            turret: {
                dark: this.lerpColor('#203040', '#204060', intensity),
                main: this.lerpColor('#336699', '#00aaff', intensity),
                light: this.lerpColor('#5588aa', '#66ccff', intensity)
            },
            engine: {
                dark: this.lerpColor('#302020', '#4a2020', intensity),
                main: this.lerpColor('#884444', '#ff5555', intensity),
                light: this.lerpColor('#aa6666', '#ff8888', intensity)
            },
            tracks: {
                dark: this.lerpColor('#203020', '#204020', intensity),
                main: this.lerpColor('#448844', '#55ff55', intensity),
                light: this.lerpColor('#66aa66', '#88ff88', intensity)
            }
        };

        return colors[moduleKey] || { dark: '#333', main: '#666', light: '#999' };
    },

    // Интерполяция цвета
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        return `rgb($${r},$${g},${b})`;
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },

    // ===== СТРЕЛКИ SVG (динамические) =====
    drawArrows() {
        const svg = document.querySelector('.hangar-arrows');
        if (!svg) return;

        const moduleColors = {
            gun: '#ffaa00',
            turret: '#00aaff',
            engine: '#ff5555',
            tracks: '#55ff55',
            ammo: '#ff55ff'
        };

        // Позиции Y для каждого модуля (соответствуют карточкам)
        const cards = document.querySelectorAll('.modules-tree > .module-card');
        if (cards.length === 0) return;

        // Обновляем яркость стрелок по уровню
        const paths = svg.querySelectorAll('path');
        const moduleKeys = ['gun', 'turret', 'engine', 'tracks', 'ammo'];

        paths.forEach((path, i) => {
            const key = moduleKeys[i];
            if (!key) return;
            const level = this.modules[key] ? this.modules[key].level : 0;
            const opacity = 0.3 + (level / this.MAX_LEVEL) * 0.7;
            const width = 2 + (level / this.MAX_LEVEL) * 2;
            path.setAttribute('stroke', moduleColors[key]);
            path.setAttribute('stroke-opacity', opacity);
            path.setAttribute('stroke-width', width);
        });
    },

    // ===== УЛУЧШЕНИЕ МОДУЛЯ =====
    upgradeModule(moduleKey) {
        const mod = this.modules[moduleKey];
        if (!mod) return;

        if (mod.level >= this.MAX_LEVEL) {
            this.showNotification('Максимальный уровень!', '#ff8800');
            return;
        }

        const cost = this.getModuleCost(moduleKey);
        const points = this.getPoints();

        if (points < cost) {
            this.showNotification('Недостаточно очков!', '#ff4444');
            this.shakeElement(document.getElementById('points'));
            return;
        }

        // Списываем очки
        // Списываем очки
        this.setPoints(points - cost);

        // Повышаем уровень
        mod.level++;

        // Анимация
        const cardId = this.getCardId(moduleKey);
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.remove('module-upgraded');
            void card.offsetWidth; // force reflow
            card.classList.add('module-upgraded');
        }

        // Анимация уровня
        const levelSpan = document.getElementById(moduleKey + 'Level');
        if (levelSpan) {
            levelSpan.classList.remove('level-up-anim');
            void levelSpan.offsetWidth;
            levelSpan.classList.add('level-up-anim');
        }

        // Создаём частицы
        this.spawnUpgradeParticles(card);

        // Обновляем всё
        this.saveToStorage();
        this.updateAllUI();
        this.drawTank();
        this.drawArrows();
        this.updateAffordability();
        this.applyStatsToGame();

        this.showNotification(`$${this.getModuleName(moduleKey)} улучшено до ур. $${mod.level}!`, '#44ff44');
    },

    // ===== УЛУЧШЕНИЕ ТИПА СНАРЯДОВ =====
    upgradeAmmoType(typeKey) {
        const ammoType = this.ammoTypes[typeKey];
        if (!ammoType) return;

        if (ammoType.level >= this.MAX_AMMO_LEVEL) {
            this.showNotification('Максимальный уровень!', '#ff8800');
            return;
        }

        // Требуется хотя бы 1 уровень основного модуля снарядов
        if (this.modules.ammo.level < 1) {
            this.showNotification('Сначала улучшите модуль "Снаряды"!', '#ff4444');
            return;
        }

        const cost = this.getAmmoTypeCost(typeKey);
        const points = this.getPoints();

        if (points < cost) {
            this.showNotification('Недостаточно очков!', '#ff4444');
            this.shakeElement(document.getElementById('points'));
            return;
        }

        this.setPoints(points - cost);
        ammoType.level++;

        // Анимация
        const card = document.getElementById('ammo' + typeKey.toUpperCase());
        if (card) {
            card.classList.remove('module-upgraded');
            void card.offsetWidth;
            card.classList.add('module-upgraded');
        }

        this.saveToStorage();
        this.updateAllUI();
        this.updateAffordability();
        this.applyStatsToGame();

        this.showNotification(`$${ammoType.name} улучшены до ур. $${ammoType.level}!`, '#44ff44');
    },

    // ===== РАСЧЁТ СТОИМОСТИ =====
    getModuleCost(moduleKey) {
        const mod = this.modules[moduleKey];
        return Math.floor(mod.baseCost * Math.pow(mod.costMultiplier, mod.level));
    },

    getAmmoTypeCost(typeKey) {
        const ammo = this.ammoTypes[typeKey];
        return Math.floor(ammo.baseCost * Math.pow(ammo.costMultiplier, ammo.level));
    },

    // ===== РАСЧЁТ БОНУСОВ =====
    getModuleBonus(moduleKey, effectKey) {
        const mod = this.modules[moduleKey];
        if (!mod || !mod.effects[effectKey]) return 0;
        const effect = mod.effects[effectKey];
        return effect.base + effect.perLevel * mod.level;
    },

    getAmmoTypeBonus(typeKey, effectKey) {
        const ammo = this.ammoTypes[typeKey];
        if (!ammo || !ammo.effects[effectKey]) return 0;
        const effect = ammo.effects[effectKey];
        return effect.base + effect.perLevel * ammo.level;
    },

    // ===== СУММАРНЫЕ ХАРАКТЕРИСТИКИ =====
    getTotalStats() {
        const stats = {
            // Базовые значения
            health: 100,
            speed: 80,
            damage: 20,
            fireRate: 500,
            bulletSpeed: 400,
            armor: 0,
            regen: 0,
            lifeSteal: 5,
            turretRotation: 3,
            bodyRotation: 2.5,
            vision: 300,

            // Снаряды
            armorPen: 0,
            heavyDamage: 0,
            aoeDamage: 0,
            burnChance: 0,
            blastRadius: 0,
            stunChance: 0
        };

        // Орудие
        stats.damage += this.getModuleBonus('gun', 'damage');
        stats.fireRate += this.getModuleBonus('gun', 'fireRate');
        stats.fireRate = Math.max(stats.fireRate, 100); // минимум 100мс

        // Башня
        stats.turretRotation += this.getModuleBonus('turret', 'turretRotation');
        stats.health += this.getModuleBonus('turret', 'health');
        stats.vision += this.getModuleBonus('turret', 'vision');

        // Двигатель
        stats.speed += this.getModuleBonus('engine', 'speed');

        // Гусеницы
        stats.speed += this.getModuleBonus('tracks', 'speed');
        stats.bodyRotation += this.getModuleBonus('tracks', 'bodyRotation');

        // Снаряды (общий урон)
        stats.damage += this.getModuleBonus('ammo', 'damage');

        // Броня
        stats.armor += this.getModuleBonus('armor', 'armor');

        // Регенерация
        stats.regen += this.getModuleBonus('regen', 'regen');

        // Вампиризм
        stats.lifeSteal += this.getModuleBonus('lifeSteal', 'lifeSteal');

        // Подтипы снарядов
        stats.armorPen += this.getAmmoTypeBonus('ap', 'armorPen');
        stats.heavyDamage += this.getAmmoTypeBonus('ap', 'heavyDamage');
        stats.aoeDamage += this.getAmmoTypeBonus('heat', 'aoeDamage');
        stats.burnChance += this.getAmmoTypeBonus('heat', 'burnChance');
        stats.blastRadius += this.getAmmoTypeBonus('he', 'blastRadius');
        stats.stunChance += this.getAmmoTypeBonus('he', 'stunChance');

        return stats;
    },

    // ===== ПРИМЕНЕНИЕ ХАРАКТЕРИСТИК К ИГРЕ =====
    applyStatsToGame() {
        const stats = this.getTotalStats();

        // Обновляем глобальные переменные игры (совместимость со старой системой)
        if (typeof playerStats !== 'undefined') {
            playerStats.maxHealth = stats.health;
            playerStats.speed = stats.speed;
            playerStats.damage = stats.damage;
            playerStats.fireRate = stats.fireRate;
            playerStats.bulletSpeed = stats.bulletSpeed;
            playerStats.armor = stats.armor;
            playerStats.regen = stats.regen;
            playerStats.lifeSteal = stats.lifeSteal;
            playerStats.turretRotation = stats.turretRotation;
            playerStats.bodyRotation = stats.bodyRotation;
            playerStats.vision = stats.vision;

            // Снаряды
            playerStats.armorPen = stats.armorPen;
            playerStats.heavyDamage = stats.heavyDamage;
            playerStats.aoeDamage = stats.aoeDamage;
            playerStats.burnChance = stats.burnChance;
            playerStats.blastRadius = stats.blastRadius;
            playerStats.stunChance = stats.stunChance;
        }

        // Обновляем отображение в меню
        this.updateSummary(stats);
    },

    // ===== ОБНОВЛЕНИЕ UI =====
    updateAllUI() {
        // Модули
        Object.keys(this.modules).forEach(key => {
            this.updateModuleUI(key);
        });

        // Подтипы снарядов
        Object.keys(this.ammoTypes).forEach(key => {
            this.updateAmmoTypeUI(key);
        });

        // Сводка
        this.updateSummary(this.getTotalStats());

        // Очки
        this.updatePointsDisplay();
    },

    updateModuleUI(moduleKey) {
        const mod = this.modules[moduleKey];
        const maxLevel = this.MAX_LEVEL;

        // Уровень
        const levelEl = document.getElementById(moduleKey + 'Level');
        if (levelEl) {
            levelEl.textContent = mod.level >= maxLevel ? 'МАКС' : `Ур. ${mod.level}`;
        }

        // Стоимость
        const costEl = document.getElementById(moduleKey + 'Cost');
        if (costEl) {
            if (mod.level >= maxLevel) {
                costEl.parentElement.textContent = '✅ МАКСИМУМ';
                costEl.parentElement.disabled = true;
            } else {
                costEl.textContent = this.getModuleCost(moduleKey);
            }
        }

        // Прогресс-бар
        const progressEl = document.getElementById(moduleKey + 'Progress');
        if (progressEl) {
            progressEl.style.width = (mod.level / maxLevel * 100) + '%';
        }

        // Бонусы модулей
        this.updateModuleBonusDisplay(moduleKey);
    },

    updateModuleBonusDisplay(moduleKey) {
        switch (moduleKey) {
            case 'gun':
                this.setEl('gunDamageBonus', '+' + this.getModuleBonus('gun', 'damage'));
                this.setEl('gunReloadBonus', this.getModuleBonus('gun', 'fireRate') + 'мс');
                break;
            case 'turret':
                this.setEl('turretRotationBonus', '+' + this.getModuleBonus('turret', 'turretRotation').toFixed(1));
                this.setEl('turretHPBonus', '+' + this.getModuleBonus('turret', 'health'));
                this.setEl('turretVisionBonus', '+' + this.getModuleBonus('turret', 'vision'));
                break;
            case 'engine':
                this.setEl('engineSpeedBonus', '+' + this.getModuleBonus('engine', 'speed'));
                break;
            case 'tracks':
                this.setEl('tracksSpeedBonus', '+' + this.getModuleBonus('tracks', 'speed'));
                this.setEl('tracksRotationBonus', '+' + this.getModuleBonus('tracks', 'bodyRotation').toFixed(1));
                break;
            case 'ammo':
                this.setEl('ammoDamageBonus', '+' + this.getModuleBonus('ammo', 'damage'));
                break;
            case 'armor':
                this.setEl('armorBonus', this.getModuleBonus('armor', 'armor'));
                break;
            case 'regen':
                this.setEl('regenBonus', this.getModuleBonus('regen', 'regen').toFixed(1));
                break;
            case 'lifeSteal':
                this.setEl('lifeStealBonus', this.getModuleBonus('lifeSteal', 'lifeSteal') + '%');
                break;
        }
    },

    updateAmmoTypeUI(typeKey) {
        const ammo = this.ammoTypes[typeKey];
        const maxLevel = this.MAX_AMMO_LEVEL;

        // Уровень
        const levelEl = document.getElementById(typeKey + 'Level');
        if (levelEl) {
            levelEl.textContent = ammo.level >= maxLevel ? 'МАКС' : `Ур. ${ammo.level}`;
        }

        // Стоимость
        const costEl = document.getElementById(typeKey + 'Cost');
        if (costEl) {
            if (ammo.level >= maxLevel) {
                costEl.parentElement.textContent = '✅ МАКС';
                costEl.parentElement.disabled = true;
            } else {
                costEl.textContent = this.getAmmoTypeCost(typeKey);
            }
        }

        // Прогресс
        const progressEl = document.getElementById(typeKey + 'Progress');
        if (progressEl) {
            progressEl.style.width = (ammo.level / maxLevel * 100) + '%';
        }

        // Бонусы
        switch (typeKey) {
            case 'ap':
                this.setEl('apBonus', '+' + this.getAmmoTypeBonus('ap', 'armorPen') + '% пробития');
                break;
            case 'heat':
                this.setEl('heatBonus', '+' + this.getAmmoTypeBonus('heat', 'aoeDamage') + '% урона');
                break;
            case 'he':
                this.setEl('heBonus', '+' + this.getAmmoTypeBonus('he', 'blastRadius') + '% радиуса');
                break;
        }
    },

    updateSummary(stats) {
        this.setEl('summaryHP', stats.health);
        this.setEl('summaryDamage', stats.damage);
        this.setEl('summarySpeed', stats.speed);
        this.setEl('summaryReload', stats.fireRate + 'мс');
        this.setEl('summaryArmor', stats.armor);
        this.setEl('summaryVision', stats.vision);

        // Обратная совместимость со старым UI
        this.setEl('healthValue', stats.health);
        this.setEl('speedValue', stats.speed);
        this.setEl('damageValue', stats.damage);
        this.setEl('fireRateValue', stats.fireRate + 'мс');
        this.setEl('bulletSpeedValue', stats.bulletSpeed);
        this.setEl('regenValue', stats.regen.toFixed(1));
        this.setEl('armorValue', stats.armor);
        this.setEl('lifeStealValue', stats.lifeSteal + '%');
    },

    updatePointsDisplay() {
        const pointsEl = document.getElementById('points');
        if (pointsEl) {
            pointsEl.textContent = '💰 Очки: ' + this.getPoints();
        }
    },

     // ===== ДОСТУПНОСТЬ УЛУЧШЕНИЙ =====
    updateAffordability() {
        const points = this.getPoints();

        // Модули
        Object.keys(this.modules).forEach(key => {
            const cardId = this.getCardId(key);
            const card = document.getElementById(cardId);
            if (!card) return;

            const mod = this.modules[key];
            const cost = this.getModuleCost(key);
            const canAfford = points >= cost && mod.level < this.MAX_LEVEL;
card.classList.toggle('cannot-afford', !canAfford && mod.level < this.MAX_LEVEL);
            card.classList.toggle('max-level', mod.level >= this.MAX_LEVEL);

            const btn = card.querySelector('.upgrade-module-btn');
            if (btn) {
                btn.disabled = !canAfford;
            }
        });

        // Подтипы снарядов
        Object.keys(this.ammoTypes).forEach(key => {
            const cardId = 'ammo' + key.toUpperCase();
            const card = document.getElementById(cardId);
            if (!card) return;

            const ammo = this.ammoTypes[key];
            const cost = this.getAmmoTypeCost(key);
            const canAfford = points >= cost && ammo.level < this.MAX_AMMO_LEVEL && this.modules.ammo.level >= 1;

            card.classList.toggle('cannot-afford', !canAfford && ammo.level < this.MAX_AMMO_LEVEL);
            card.classList.toggle('max-level', ammo.level >= this.MAX_AMMO_LEVEL);

            const btn = card.querySelector('.upgrade-ammo-btn');
            if (btn) {
                btn.disabled = !canAfford;
            }
        });
    },

    // ===== СБРОС ВСЕХ УЛУЧШЕНИЙ =====
    resetAll() {
        // Считаем потраченные очки
        let refund = 0;

        Object.keys(this.modules).forEach(key => {
            const mod = this.modules[key];
            for (let i = 0; i < mod.level; i++) {
                refund += Math.floor(mod.baseCost * Math.pow(mod.costMultiplier, i));
            }
            mod.level = 0;
        });

        Object.keys(this.ammoTypes).forEach(key => {
            const ammo = this.ammoTypes[key];
            for (let i = 0; i < ammo.level; i++) {
                refund += Math.floor(ammo.baseCost * Math.pow(ammo.costMultiplier, i));
            }
            ammo.level = 0;
        });

        // Возвращаем очки
        this.setPoints(this.getPoints() + refund);

        this.saveToStorage();
        this.updateAllUI();
        this.drawTank();
        this.drawArrows();
        this.updateAffordability();
        this.applyStatsToGame();

        this.showNotification(`Улучшения сброшены! Возвращено ${refund} 💰`, '#ffaa00');
    },

    // ===== ХРАНИЛИЩЕ =====
    saveToStorage() {
        const data = {
            modules: {},
            ammoTypes: {}
        };

        Object.keys(this.modules).forEach(key => {
            data.modules[key] = this.modules[key].level;
        });

        Object.keys(this.ammoTypes).forEach(key => {
            data.ammoTypes[key] = this.ammoTypes[key].level;
        });

        localStorage.setItem('hangarData', JSON.stringify(data));
    },

    loadFromStorage() {
        try {
            const raw = localStorage.getItem('hangarData');
            if (!raw) return;

            const data = JSON.parse(raw);

            if (data.modules) {
                Object.keys(data.modules).forEach(key => {
                    if (this.modules[key]) {
                        this.modules[key].level = data.modules[key] || 0;
                    }
                });
            }

            if (data.ammoTypes) {
                Object.keys(data.ammoTypes).forEach(key => {
                    if (this.ammoTypes[key]) {
                        this.ammoTypes[key].level = data.ammoTypes[key] || 0;
                    }
                });
            }
        } catch (e) {
            console.warn('Ошибка загрузки данных ангара:', e);
        }
    },

    // ===== ОЧКИ (интеграция с основной игрой) =====
    getPoints() {
        // Совместимость с существующей системой очков
        if (typeof totalPoints !== 'undefined') {
            return totalPoints;
        }
        return parseInt(localStorage.getItem('tankPoints') || '0');
    },

    setPoints(value) {
        value = Math.max(0, Math.floor(value));

        if (typeof totalPoints !== 'undefined') {
            totalPoints = value;
        }

        localStorage.setItem('tankPoints', value);
        this.updatePointsDisplay();
    },

    // ===== УТИЛИТЫ =====
    setEl(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    getCardId(moduleKey) {
        const map = {
            gun: 'moduleGun',
            turret: 'moduleTurret',
            engine: 'moduleEngine',
            tracks: 'moduleTracks',
            ammo: 'moduleAmmo',
            armor: 'moduleArmor',
            regen: 'moduleRegen',
            lifeSteal: 'moduleLifeSteal'
        };
        return map[moduleKey] || '';
    },

    getModuleName(moduleKey) {
        const names = {
            gun: '🔫 Орудие',
            turret: '🏗️ Башня',
            engine: '🔧 Двигатель',
            tracks: '⛓️ Гусеницы',
            ammo: '💥 Снаряды',
            armor: '🛡️ Броня',
            regen: '♻️ Регенерация',
            lifeSteal: '🩸 Вампиризм'
        };
        return names[moduleKey] || moduleKey;
    },

    // ===== УВЕДОМЛЕНИЯ =====
    showNotification(text, color) {
        // Удаляем предыдущее уведомление
        const existing = document.querySelector('.hangar-notification');
        if (existing) existing.remove();

        const notif = document.createElement('div');
        notif.className = 'hangar-notification';
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(10, 10, 30, 0.95);
            border: 2px solid ${color};
            color: ${color};
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 0 20px ${color}44;
            animation: notifSlide 0.3s ease;
            pointer-events: none;
        `;
        notif.textContent = text;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.5s';
            setTimeout(() => notif.remove(), 500);
        }, 2000);
    },

    // Тряска элемента
    shakeElement(el) {
        if (!el) return;
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
    },

    // Частицы при улучшении
    spawnUpgradeParticles(element) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 / 12) * i;
            const distance = 40 + Math.random() * 30;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const size = 3 + Math.random() * 4;
            const hue = 40 + Math.random() * 20; // золотистый

            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                background: hsl(${hue}, 100%, 60%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10001;
                box-shadow: 0 0 6px hsl(${hue}, 100%, 60%);
                transition: all 0.6s ease-out;
            `;

            document.body.appendChild(particle);

            requestAnimationFrame(() => {
                particle.style.left = (centerX + dx) + 'px';
                particle.style.top = (centerY + dy) + 'px';
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0)';
            });

            setTimeout(() => particle.remove(), 700);
        }
    },

    // ===== АНИМАЦИЯ ТАНКА =====
    startTankAnimation() {
        const animate = () => {
            this.drawTank();
            this._animFrame = requestAnimationFrame(animate);
        };
        animate();
    },

    stopTankAnimation() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
    }
};

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ (для onclick в HTML) =====

function switchTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показываем нужную
    const tabEl = document.getElementById(tabName + 'Tab');
    if (tabEl) tabEl.classList.add('active');

    // Активируем кнопку
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName === 'hangar' ? 'ангар' : 'этап')) {
            btn.classList.add('active');
        }
    });

    // Запускаем/останавливаем анимацию танка
    if (tabName === 'hangar') {
        HangarSystem.startTankAnimation();
        HangarSystem.updateAffordability();
    } else {
        HangarSystem.stopTankAnimation();
    }
}

function upgradeModule(moduleKey) {
    HangarSystem.upgradeModule(moduleKey);
}

function upgradeAmmoType(typeKey) {
    HangarSystem.upgradeAmmoType(typeKey);
}

function resetAllStats() {
    if (confirm('Сбросить все улучшения? Очки будут возвращены.')) {
        HangarSystem.resetAll();
    }
}

// ===== СТАРАЯ ФУНКЦИЯ upgrade ДЛЯ СОВМЕСТИМОСТИ =====
function upgrade(stat) {
    // Маппинг старых стат на новые модули
    const mapping = {
        'health': 'turret',
        'speed': 'engine',
        'damage': 'gun',
        'fireRate': 'gun',
        'bulletSpeed': 'gun',
        'regen': 'regen',
        'armor': 'armor',
        'lifeSteal': 'lifeSteal'
    };

    const moduleKey = mapping[stat];
    if (moduleKey) {
        HangarSystem.upgradeModule(moduleKey);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', () => {
    HangarSystem.init();
    HangarSystem.startTankAnimation();
    HangarSystem.applyStatsToGame();
});

// ===== CSS АНИМАЦИИ (добавляем динамически) =====
const hangarStyles = document.createElement('style');
hangarStyles.textContent = `
    @keyframes notifSlide {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
    }

    @keyframes floatUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-30px);
        }
    }

    .float-text {
        position: fixed;
        color: #ffd700;
        font-weight: bold;
        font-size: 16px;
        pointer-events: none;
        z-index: 10002;
        animation: floatUp 1s ease forwards;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }
`;
document.head.appendChild(hangarStyles);