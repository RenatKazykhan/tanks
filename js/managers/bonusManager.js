class BonusManager {
    constructor() {
        this.shuffleCount = 3; // Количество доступных перетасовок
        this.maxShuffles = 3; // Максимальное количество перетасовок за игру
        this.currentBonuses = []; // Текущие отображаемые бонусы
    }

    // Определение всех возможных бонусов
    bonusTypes = {
        // Обычные бонусы
        health: {
            name: "Восстановление",
            icon: "⚙️",
            description: "Восстанавливает <span class='bonus-value'>25%</span> здоровья и увеличивает пассивную регенрецию на <span class='bonus-value'>1 hp/сек</span>",
            rarity: "common",
            maxValue: 25,
            apply: (player) => {
                player.health = Math.min(player.health + player.maxHealth * 0.25, player.maxHealth);
                player.regen += 1;
                updateUIManager.updateHealthBar();
            }
        },
        maxHealth: {
            name: "Крепкая броня",
            icon: "❤️",
            description: "Увеличивает максимальное здоровье на <span class='bonus-value'>25</span>",
            rarity: "common",
            maxValue: 3000,
            apply: (player) => {
                player.maxHealth += 25;
                player.health += 25;
                updateUIManager.updateHealthBar();
            }
        },
        reRoll: {
            name: "Перетасовка",
            icon: "🔄",
            description: "Дает возможность перетасовать бонусы <span class='bonus-value'>3 раза</span>",
            rarity: "common",
            maxValue: 3000,
            apply: (player) => {
                this.shuffleCount += 3;
            }
        },
        doubleShot1: {
            name: "Двойной выстрел",
            icon: "🔥",
            description: "Увеличивает вероятность двойного выстрела на <span class='bonus-value'>5%</span>",
            rarity: "common",
            apply: (player) => {
                player.doubleShotChance += 0.05;
            }
        },
        speed: {
            name: "Турбо двигатель",
            icon: "⚡",
            description: "Увеличивает скорость на <span class='bonus-value'>10</span>",
            rarity: "common",
            maxValue: 400,
            apply: (player) => {
                player.speed += 10;
            }
        },
        damage: {
            name: "Усиленные снаряды",
            icon: "💥",
            description: "Увеличивает урон на <span class='bonus-value'>15</span>",
            rarity: "common",
            apply: (player) => {
                player.damage += 15;
            }
        },
        fireRate: {
            name: "Скорострельность",
            icon: "🔫",
            description: "Уменьшает перезарядку на <span class='bonus-value'>15 ms</span>",
            rarity: "common",
            maxValue: 150,
            apply: (player) => {
                player.shotCooldown -= 15;
            }
        },
        bulletSpeed: {
            name: "Быстрые снаряды",
            icon: "🚀",
            description: "Увеличивает скорость снарядов на <span class='bonus-value'>25</span>",
            rarity: "common",
            maxValue: 1500,
            apply: (player) => {
                player.bulletSpeed += 25;
            }
        },
        armor: {
            name: "Реактивная броня",
            icon: "🛡️",
            description: "Увеличивает шанс срабатывания блока на <span class='bonus-value'>3%</span>",
            rarity: "common",
            maxValue: 50,
            apply: (player) => {
                player.armor += 3;
            }
        },
        lightning1: {
            name: "Цепная молния",
            icon: "⚡",
            description: "Увеличвает количество прыжков на <span class='bonus-value'>1</span>.",
            rarity: "common",
            apply: (player) => {
                player.maxChainTargets += 1;
            }
        },
        // Редкие бонусы
        lucky: {
            name: "Удача",
            icon: "🍀",
            description: "Увеличвает удачу на <span class='bonus-value'>5%</span>. Тем самым увеличвается вероятность выпадения легендарных и редких бонусов",
            rarity: "rare",
            apply: (player) => {
                player.lucky += 5;
            }
        },
        speed2: {
            name: "Турбо двигатель",
            icon: "⚡",
            description: "Увеличивает скорость на <span class='bonus-value'>20</span>",
            rarity: "rare",
            apply: (player) => {
                player.speed += 20;
            }
        },
        damage2: {
            name: "Усиленные снаряды",
            icon: "💥",
            description: "Увеличивает урон на <span class='bonus-value'>30</span>",
            rarity: "rare",
            apply: (player) => {
                player.damage += 30;
            }
        },
        fireRate2: {
            name: "Скорострельность",
            icon: "🔫",
            description: "Уменьшает перезарядку на <span class='bonus-value'>25 ms</span>",
            rarity: "rare",
            apply: (player) => {
                player.shotCooldown -= 25;
            }
        },
        bulletSpeed2: {
            name: "Быстрые снаряды",
            icon: "🚀",
            description: "Увеличивает скорость снарядов на <span class='bonus-value'>50</span>",
            rarity: "rare",
            apply: (player) => {
                player.bulletSpeed += 50;
            }
        },
        health2: {
            name: "Восстановление",
            icon: "⚙️",
            description: "Восстанавливает <span class='bonus-value'>50%</span> здоровья и увеличивает пассивную регенрецию на <span class='bonus-value'>3 hp/сек</span>",
            rarity: "rare",
            apply: (player) => {
                player.health = Math.min(player.health + player.maxHealth * 0.5, player.maxHealth);
                player.regen += 3;
                updateUIManager.updateHealthBar();
            }
        },
        maxHealth2: {
            name: "Крепкая броня",
            icon: "❤️",
            description: "Увеличивает максимальное здоровье на <span class='bonus-value'>50</span>",
            rarity: "rare",
            apply: (player) => {
                player.maxHealth += 50;
                player.health += 50;
                updateUIManager.updateHealthBar();
            }
        },
        doubleShot2: {
            name: "Двойной выстрел",
            icon: "🔥",
            description: "Увеличивает вероятность двойного выстрела на <span class='bonus-value'>10%</span>",
            rarity: "rare",
            apply: (player) => {
                player.doubleShotChance += 0.1;
            }
        },
        lifeSteal2: {
            name: "Вампиризм",
            icon: "🩸",
            description: "Увеличивает вампиризм на <span class='bonus-value'>1%</span>",
            rarity: "rare",
            apply: (player) => {
                player.lifeSteal += 0.01;
            }
        },
        regen2: {
            name: "Быстрая регенерация",
            icon: "💚",
            description: "Увеличвает восстановление от способности на <span class='bonus-value'>5 HP/секунду</span>.",
            rarity: "rare",
            apply: (player) => {
                player.rapidRegenAmount += 5;
            }
        },
        lightning2: {
            name: "Цепная молния",
            icon: "⚡",
            description: "Увеличвает урон на <span class='bonus-value'>20</span>, количество прыжков на <span class='bonus-value'>1</span>.",
            rarity: "rare",
            apply: (player) => {
                player.chainLightningDamage += 20;
                player.maxChainTargets += 1;
            }
        },
        // Эпические бонусы
        maxHealth3: {
            name: "Крепкая броня",
            icon: "❤️",
            description: "Увеличивает максимальное здоровье на <span class='bonus-value'>100</span>",
            rarity: "epic",
            apply: (player) => {
                player.maxHealth += 100;
                player.health += 100;
                updateUIManager.updateHealthBar();
            }
        },
        doubleShot: {
            name: "Двойной выстрел",
            icon: "🔥",
            description: "С вероятностью 25% выпускает <span class='bonus-value'>2 снаряда</span> за выстрел",
            rarity: "epic",
            apply: (player) => {
                player.doubleShot = true;
            }
        },
        doubleShot3: {
            name: "Двойной выстрел",
            icon: "🔥",
            description: "Увеличивает вероятность двойного выстрела на <span class='bonus-value'>25%</span>",
            rarity: "epic",
            apply: (player) => {
                player.doubleShotChance += 0.25;
            }
        },
        lifeSteal: {
            name: "Вампиризм",
            icon: "🩸",
            description: "Увеличивает вампиризм на <span class='bonus-value'>2%</span>",
            rarity: "epic",
            apply: (player) => {
                player.lifeSteal += 0.02;
            }
        },
        shield: {
            name: "Аура щита",
            icon: "🛡️",
            description: "Дает ауру щита поглощающий урон. Поглащает <span class='bonus-value'>30 урона</span>. Восстанавливается <span class='bonus-value'>1 ед/сек</span>, задержка перед регенерацией <span class='bonus-value'>3 секунды</span>",
            rarity: "epic",
            apply: (player) => {
                player.hasShield = true;
            }
        },
        shield3: {
            name: "Аура щита",
            icon: "🛡️",
            description: "Увеличивает поглощающий урон на <span class='bonus-value'>20</span>. Восстановление на <span class='bonus-value'>1 ед/сек</span>",
            rarity: "epic",
            apply: (player) => {
                player.shield += 20;
                player.maxShield += 20;
                player.shieldRegenRate += 1;
            }
        },
        teleport: {
            name: "Телепорт",
            icon: "⚡",
            description: "Добавляет способность телепорт по нажатию кнопки <span class='bonus-value'>E</span> на расстояние <span class='bonus-value'>200</span>. Перезарядка <span class='bonus-value'>10 секунд</span>",
            rarity: "epic",
            apply: (player) => {
                player.canTeleport = true;
            }
        },
        teleport3: {
            name: "Телепорт",
            icon: "⚡",
            description: "Увеличивает дальность телепортации на <span class='bonus-value'>100</span>. Перезарядку на <span class='bonus-value'>1 секунду</span>",
            rarity: "epic",
            apply: (player) => {
                player.teleportDistance += 100;
                player.teleportCooldown -= 1000;
            }
        },
        explode: {
            name: "Взрыв",
            icon: "💥",
            description: "Добавляет способность взрыв по нажатию кнопку <span class='bonus-value'>Q</span>. Урон от взрыва  <span class='bonus-value'>50</span> и радиус <span class='bonus-value'>150</span>. Перезарядка <span class='bonus-value'>10 секунд</span>",
            rarity: "epic",
            apply: (player) => {
                player.hasEnergyBlast  = true;
            }
        },
        explode3: {
            name: "Взрыв",
            icon: "💥",
            description: "Увеличвает урон от взрыва на <span class='bonus-value'>25</span> и радиус на <span class='bonus-value'>25</span>. Перезарядку на <span class='bonus-value'>1 секунду</span>",
            rarity: "epic",
            apply: (player) => {
                player.energyBlastCooldown -= 1000;
                player.energyBlastRadius += 25;
                player.energyBlastDamage += 25;
            }
        },
        regen: {
            name: "Быстрая регенерация",
            icon: "💚",
            description: "Дает способность восстанавливать <span class='bonus-value'>15 HP/секунду</span> в течении <span class='bonus-value'>3 секунд</span>. Перезарядка <span class='bonus-value'>15 секунд</span>.",
            rarity: "epic",
            apply: (player) => {
                player.hasRegen = true;
            }
        },
        regen3: {
            name: "Быстрая регенерация",
            icon: "💚",
            description: "Увеличвает восстановление от способности на <span class='bonus-value'>5 HP/секунду</span>, длителность на <span class='bonus-value'>1 секунду</span>. Перезарядка уменьшает на <span class='bonus-value'>1 секунду</span>.",
            rarity: "epic",
            apply: (player) => {
                player.rapidRegenDuration += 1000;
                player.rapidRegenCooldown -= 1000;
                player.rapidRegenAmount += 5;
            }
        },
        lightning: {
            name: "Цепная молния",
            icon: "⚡",
            description: "Дает способность наносить цепную молнию, урон: <span class='bonus-value'>40</span>, количество прыжков: <span class='bonus-value'>4</span>, радиус прыжка: <span class='bonus-value'>200</span> перезарядка: <span class='bonus-value'>10 секунд</span>.",
            rarity: "epic",
            apply: (player) => {
                player.hasChainLightning = true;
                player.chainLightningDamage = 40;
                player.chainLightningCooldown = 10000;
                player.maxChainTargets = 4;
                player.chainLightningBounceRange = 200;
            }
        },
        lightning3: {
            name: "Цепная молния",
            icon: "⚡",
            description: "Увеличвает урон на <span class='bonus-value'>40</span>, количество прыжков на <span class='bonus-value'>2</span>, радиус прыжка на <span class='bonus-value'>50</span> перезарядку: <span class='bonus-value'>1 секунду</span>.",
            rarity: "epic",
            apply: (player) => {
                player.chainLightningDamage += 40;
                player.chainLightningCooldown -= 1000;
                player.maxChainTargets += 2;
                player.chainLightningBounceRange += 50;
            }
        },
        // Оружие - дрон камикадзе
        droneKamikaze: {
            name: "Дрон-камикадзе",
            icon: "🛸",
            description: "Автоматически запускает дрон-камикадзе каждые <span class='bonus-value'>3 секунды</span>. Дрон летит к ближайшему врагу и взрывается, нанося урон по области.",
            rarity: "rare",
            apply: (player) => {
                player.hasDroneKamikaze = true;
                player.droneDamage = 50;
                player.droneCooldown = 3000;
                player.droneExplosionRadius = 60;
            }
        },
        droneKamikaze2: {
            name: "Улучшенный дрон",
            icon: "🛸",
            description: "Увеличивает урон дрона на <span class='bonus-value'>25</span> и уменьшает перезарядку на <span class='bonus-value'>0.5 секунды</span>.",
            rarity: "epic",
            apply: (player) => {
                player.droneDamage += 25;
                player.droneCooldown = Math.max(1000, player.droneCooldown - 500);
                player.droneExplosionRadius += 15;
            }
        }
    };

        // Функция показа экрана выбора бонусов
    // Обновите метод showBonusSelection
    showBonusSelection() {
        gameRunning = false;
        
        const bonusScreen = document.getElementById('bonusScreen');
        
        // Генерируем и показываем бонусы
        this.displayNewBonuses();
        
        // Обновляем счетчик перетасовок
        this.updateShuffleButton();
        
        bonusScreen.style.display = 'flex';
    }

    // Новый метод для отображения бонусов
    displayNewBonuses() {
        const bonusOptions = document.getElementById('bonusOptions');
        
        // Очищаем предыдущие опции
        bonusOptions.innerHTML = '';
        
        // Генерируем 3 случайных бонуса
        this.currentBonuses = this.generateRandomBonuses();
        
        this.currentBonuses.forEach((bonus, index) => {
            let bonusRarityText = bonus.rarity === 'common' ? 'обычный' : bonus.rarity === 'rare' ? 'редкий' : 'эпический';

            const card = document.createElement('div');
            card.className = `bonus-card ${bonus.rarity}`;
            card.innerHTML = `
                <div class="bonus-rarity">${bonusRarityText}</div>
                <div class="bonus-icon">${bonus.icon}</div>
                <div class="bonus-name">${bonus.name}</div>
                <div class="bonus-description">${bonus.description}</div>
            `;
            
            card.addEventListener('click', () => this.selectBonus(bonus.key));
            bonusOptions.appendChild(card);
        });
    }

      // Новый метод для перетасовки бонусов
    shuffleBonuses() {
        if (this.shuffleCount > 0) {
            this.shuffleCount--;
            
            // Анимация перетасовки
            const bonusOptions = document.getElementById('bonusOptions');
            bonusOptions.style.opacity = '0';
            
            setTimeout(() => {
                this.displayNewBonuses();
                bonusOptions.style.opacity = '1';
            }, 300);
            
            // Обновляем кнопку
            this.updateShuffleButton();
            
            // Звуковой эффект (если есть)
            // playSound('shuffle');
        }
    }

        // Метод для обновления состояния кнопки перетасовки
    updateShuffleButton() {
        const shuffleButton = document.getElementById('shuffleButton');
        const shuffleCountSpan = document.getElementById('shuffleCount');
        
        if (shuffleButton) {
            if(shuffleCountSpan) {
                shuffleCountSpan.textContent = this.shuffleCount;
            }
            
            if (this.shuffleCount <= 0) {
                shuffleButton.disabled = true;
            }
            else {
                shuffleButton.disabled = false;
            }
        }
    }
    

    // Метод для сброса счетчика перетасовок (вызывается при начале новой игры)
    resetShuffles() {
        this.shuffleCount = this.maxShuffles;
        document.getElementById('bonusScreen').style.display = 'none';
    }

    // Функция генерации случайных бонусов
    generateRandomBonuses() {
        const allBonuses = Object.keys(this.bonusTypes);
        const selected = [];
        const usedBonuses = new Set();

        // исключаем из выбора те, которые еще не актвирированы
        if(!player.doubleShot || player.doubleShotChance >= 1) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot1'));
        if(!player.doubleShot || player.doubleShotChance >= 1) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot2'));
        if(!player.doubleShot || player.doubleShotChance >= 1) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot3'));
        if(!player.canTeleport || player.teleportCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'teleport1'));
        if(!player.canTeleport || player.teleportCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'teleport2'));
        if(!player.canTeleport || player.teleportCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'teleport3'));
        if(!player.hasEnergyBlast || player.energyBlastCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'explode1'));
        if(!player.hasEnergyBlast || player.energyBlastCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'explode2'));
        if(!player.hasEnergyBlast || player.energyBlastCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'explode3'));
        if(!player.hasShield) usedBonuses.add(allBonuses.find(bonus => bonus === 'shield1'));
        if(!player.hasShield) usedBonuses.add(allBonuses.find(bonus => bonus === 'shield2'));
        if(!player.hasShield) usedBonuses.add(allBonuses.find(bonus => bonus === 'shield3'));
        if(!player.hasRegen || player.rapidRegenCooldown <= 7000) usedBonuses.add(allBonuses.find(bonus => bonus === 'regen2'));
        if(!player.hasRegen || player.rapidRegenCooldown <= 7000) usedBonuses.add(allBonuses.find(bonus => bonus === 'regen3'));
        if(!player.hasChainLightning || player.chainLightningCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'lightning1'));
        if(!player.hasChainLightning || player.chainLightningCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'lightning2'));
        if(!player.hasChainLightning || player.chainLightningCooldown <= 2200) usedBonuses.add(allBonuses.find(bonus => bonus === 'lightning3'));
        if(!player.hasDroneKamikaze || player.droneCooldown <= 500) usedBonuses.add(allBonuses.find(bonus => bonus === 'droneKamikaze2'));

        // исключаем из выбора те, которые дают активацию
        if(player.doubleShot) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot'));
        if(player.canTeleport) usedBonuses.add(allBonuses.find(bonus => bonus === 'teleport'));
        if(player.hasEnergyBlast) usedBonuses.add(allBonuses.find(bonus => bonus === 'explode'));
        if(player.hasShield) usedBonuses.add(allBonuses.find(bonus => bonus === 'shield'));
        if(player.hasRegen) usedBonuses.add(allBonuses.find(bonus => bonus === 'regen'));
        if(player.hasChainLightning) usedBonuses.add(allBonuses.find(bonus => bonus === 'lightning'));
        if(player.hasDroneKamikaze) usedBonuses.add(allBonuses.find(bonus => bonus === 'droneKamikaze'));

        if(player.lucky == 40) usedBonuses.add(allBonuses.find(bonus => bonus === 'lucky'));

        // Выбираем 3 уникальных бонуса
        while (selected.length < 4) {
            const randomBonus = this.getRandomBonus(allBonuses, usedBonuses);
            
            if (!usedBonuses.has(randomBonus)) {
                const bonus = this.bonusTypes[randomBonus];
                
                usedBonuses.add(randomBonus);
                selected.push({ key: randomBonus, ...bonus });
            }
        }
        
        return selected;
    }

    getRandomBonus(allBonuses, usedBonuses) {
        let randomBonus = null;

        while (!randomBonus || usedBonuses.has(randomBonus)) {
            const rarityRoll = Math.floor(Math.random() * 100) + 1;

            let rarity = null;
            if (rarityRoll <= 60 - player.lucky) {
                rarity = 'common';
            } else if (rarityRoll <= 90 - player.lucky) {
                rarity = 'rare';
            } else {
                rarity = 'epic';
            }

            const bonusesOfRarity = allBonuses.filter(bonus => this.bonusTypes[bonus].rarity === rarity);

            randomBonus = bonusesOfRarity[Math.floor(Math.random() * bonusesOfRarity.length)];
        }

        return randomBonus;
    }

    // Обновите метод selectBonus
    selectBonus(bonusKey) {
        const bonus = this.bonusTypes[bonusKey];
        bonus.apply(player);
        
        // Очищаем текущие бонусы
        this.currentBonuses = [];
        
        // Скрываем экран выбора
        document.getElementById('bonusScreen').style.display = 'none';
        gameRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        
        // Показываем уведомление о получении бонуса
        this.showBonusNotification(bonus);
        statManager.bonusesCollect++;
    }

    // Функция показа уведомления
    showBonusNotification(bonus) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 255, 0.9);
            color: #000;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 20px;
            font-weight: bold;
            z-index: 1001;
            animation: fadeInOut 2s ease-in-out;
        `;
        notification.textContent = `${bonus.icon} ${bonus.name} получен!`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 1000);
    }
}