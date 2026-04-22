class UpdateUIManager {
    constructor() {

    }

    // Обновление интерфейса ангара
    updateUpgradeUI(modules) {
        const pointsEl = document.getElementById('pointsValue');
        if (pointsEl) {
            pointsEl.textContent = points;
        }
        // Также обновляем бэйджи модулей
        modules.updateAllModuleBadges();
        // Обновляем панель текущего модуля
        if (modules.selectedModuleName) {
            modules.updateModulePanel(modules.selectedModuleName);
        }
    }

    // Обновление счета
    updateScore() {
        document.getElementById('scoreValue').textContent = score;

        if (score > recordScore) {
            recordScore = score;
            document.getElementById('recordScoreValue').textContent = recordScore;
        }
    }

    // Обновление полоски здоровья
    updateHealthBar() {
        document.getElementById('currentHealth').innerText = Math.max(0, Math.floor(player.health));
        document.getElementById('MaxHealth').textContent = player.maxHealth.toFixed();
    }
    // Функция для обновления отображения характеристик в главном меню (устаревшая, для совместимости)
    updateStatsDisplayMainMenu() {
        // Новая система использует модули, так что обновим бэйджи
        if (typeof updateAllModuleBadges === 'function') {
            updateAllModuleBadges();
        }
    }

    // Функция для обновления отображения характеристик в паузе
    updateStatsDisplayInGame() {
        document.getElementById('speedIngame').textContent = player.speed.toFixed();
        if (player.equippedWeapon === 'gun') {
            document.getElementById('damageIngame').textContent = player.damage.toFixed();
        }
        else if (player.equippedWeapon === 'laser') {
            document.getElementById('damageIngame').textContent = player.laserDamage.toFixed();
        }
        document.getElementById('fireRateIngame').textContent = Math.floor(player.shotCooldown) + 'ms';
        document.getElementById('bulletSpeedIngame').textContent = player.bulletSpeed.toFixed();
        document.getElementById('regenIngame').textContent = player.regen + ' hp/сек';
        document.getElementById('armorIngame').textContent = player.armor;
        document.getElementById('lifeStealIngame').textContent = (player.lifeSteal.toFixed(2) * 100) + '%';

        document.getElementById('maxShieldIngame').textContent = player.shieldSkill.maxShield;
        document.getElementById('shieldRegenRateIngame').textContent = player.shieldSkill.shieldRegenRate + ' ед/сек';

        // === Генерируем иконки способностей ===
        const grid = document.getElementById('skillsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        // Helper: builds "v1 / v2 / v3 / v4 / v5" with current level highlighted
        function prog(values, currentLevel, suffix) {
            suffix = suffix || '';
            return values.map((v, i) => {
                const cls = (i + 1 === currentLevel) ? 'tt-val-current' : 'tt-val';
                return `<span class="${cls}">${v}${suffix}</span>`;
            }).join(' / ');
        }

        const skills = [
            {
                icon: '💥', name: 'Взрыв', key: 'Q',
                level: player.blastSkill.level, maxLevel: 5,
                desc: 'Заряжаемый взрыв по области вокруг игрока',
                stats: [
                    ['Урон', prog([100, 150, 200, 250, 300], player.blastSkill.level)],
                    ['Радиус', prog([150, 200, 250, 300, 400], player.blastSkill.level)],
                    ['Перезарядка', prog([10, 9, 8, 7, 5], player.blastSkill.level, 'с')],
                ]
            },
            {
                icon: '🌀', name: 'Телепорт', key: 'E',
                level: player.teleportSkill.level, maxLevel: 5,
                desc: 'Мгновенное перемещение к курсору',
                stats: [
                    ['Дистанция', prog([200, 300, 400, 500, 600], player.teleportSkill.level)],
                    ['Перезарядка', prog([12, 10, 8, 6, 4], player.teleportSkill.level, 'с')],
                ]
            },
            {
                icon: '💚', name: 'Регенерация', key: 'R',
                level: player.regenerationSkill.level, maxLevel: 5,
                desc: 'Активная быстрая регенерация HP',
                stats: [
                    ['Пассивно hp/с', prog([3, 6, 9, 12, 15], player.regenerationSkill.level)],
                    ['Восст. hp/с', prog([15, 25, 35, 45, 55], player.regenerationSkill.level)],
                    ['Перезарядка', prog([15, 12, 10, 8, 6], player.regenerationSkill.level, 'с')],
                ]
            },
            {
                icon: '⚡', name: 'Цепная молния', key: 'F',
                level: player.chainLightningSkill.level, maxLevel: 5,
                desc: 'Пассивная молния + активный удар по врагу',
                stats: [
                    ['Урон', prog([10, 15, 20, 25, 30], player.chainLightningSkill.level)],
                    ['Прыжки', prog([2, 3, 3, 4, 5], player.chainLightningSkill.level)],
                    ['Перезарядка', prog([12, 10, 8, 6, 4], player.chainLightningSkill.level, 'с')],
                ]
            },
            {
                icon: '🛡️', name: 'Щит', key: 'G',
                level: player.shieldSkill.level, maxLevel: 5,
                desc: 'Пассивный щит + активная заморозка врагов',
                stats: [
                    ['Щит', prog([100, 130, 160, 200, 250], player.shieldSkill.level)],
                    ['Реген щита', prog([5, 10, 15, 20, 25], player.shieldSkill.level, '/с')],
                    ['Заморозка', prog([2, 2.5, 3, 3.5, 4], player.shieldSkill.level, 'с')],
                    ['Радиус', prog([200, 230, 260, 300, 350], player.shieldSkill.level)],
                    ['Перезарядка', prog([12, 11, 10, 9, 8], player.shieldSkill.level, 'с')],
                ]
            },
            {
                icon: '🩸', name: 'Вампиризм', key: 'V',
                level: player.lifestealSkill.level, maxLevel: 5,
                desc: 'Пассивный вампиризм + активное усиление',
                stats: [
                    ['Вампиризм', prog(['5%', '7%', '9%', '12%', '15%'], player.lifestealSkill.level)],
                    ['Множитель', prog(['x2', 'x2.2', 'x2.5', 'x2.8', 'x3'], player.lifestealSkill.level)],
                    ['Длительность', prog([5, 5.5, 6, 7, 8], player.lifestealSkill.level, 'с')],
                    ['Перезарядка', prog([15, 14, 13, 12, 10], player.lifestealSkill.level, 'с')],
                ]
            },
            {
                icon: '🔥', name: 'Двойной выстрел', key: 'C',
                level: player.doubleShootSkill.level, maxLevel: 5,
                desc: 'Шанс двойного выстрела + залп вокруг себя',
                stats: [
                    ['Шанс', prog(['20%', '25%', '30%', '35%', '45%'], player.doubleShootSkill.level)],
                    ['Снарядов', prog([8, 10, 12, 14, 16], player.doubleShootSkill.level)],
                    ['Перезарядка', prog([12, 11, 10, 9, 8], player.doubleShootSkill.level, 'с')],
                ]
            },
            {
                icon: '🛸', name: 'Дрон-камикадзе', key: 'X',
                level: player.droneSkill.level, maxLevel: 5,
                desc: 'Пассивный дрон + активный залп дронов',
                stats: [
                    ['Урон', prog([50, 65, 80, 100, 130], player.droneSkill.level)],
                    ['Радиус взрыва', prog([60, 70, 80, 90, 110], player.droneSkill.level)],
                    ['Дроны (акт.)', prog([1, 2, 3, 4, 5], player.droneSkill.level)],
                    ['Перезарядка', prog([15, 14, 13, 11, 9], player.droneSkill.level, 'с')],
                ]
            },
        ];

        skills.forEach(s => {
            const card = document.createElement('div');
            card.className = 'skill-icon-card' + (s.level > 0 ? ' skill-active' : ' skill-locked');

            let statsHtml = '';
            s.stats.forEach(([label, valHtml]) => {
                statsHtml += `<div class="tt-stat"><span class="tt-stat-label">${label}</span><span class="tt-progression">${valHtml}</span></div>`;
            });

            card.innerHTML = `
                <span class="skill-icon-emoji">${s.icon}</span>
                ${s.level > 0 ? `<span class="skill-lvl">${s.level}</span>` : ''}
                <div class="skill-tooltip">
                    <div class="tt-name">${s.name}</div>
                    <span class="tt-key">[${s.key}]</span>
                    <div class="tt-desc">${s.desc}</div>
                    <div class="tt-stats">
                        <div class="tt-stat"><span class="tt-stat-label">Уровень</span><span class="tt-stat-value">${s.level}/${s.maxLevel}</span></div>
                        ${statsHtml}
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });
    }
}