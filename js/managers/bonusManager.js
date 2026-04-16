class BonusManager {
    constructor() {
        this.shuffleCount = 3; // Количество доступных перетасовок
        this.maxShuffles = 3; // Максимальное количество перетасовок за игру
        this.currentBonuses = []; // Текущие отображаемые бонусы
    }

    // Определение всех возможных бонусов
    bonusTypes = {
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
            description: "Увеличивает вероятность двойного выстрела на <span class='bonus-value'>15%</span>",
            rarity: "rare",
            apply: (player) => {
                player.doubleShotChance += 0.15;
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
            if (shuffleCountSpan) {
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

        if (!player.doubleShot || player.doubleShotChance >= 1) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot1'));
        if (!player.doubleShot || player.doubleShotChance >= 1) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot2'));
        if (!player.doubleShot || player.doubleShotChance >= 1) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot3'));

        // исключаем из выбора те, которые дают активацию
        if (player.doubleShot) usedBonuses.add(allBonuses.find(bonus => bonus === 'doubleShot'));

        // Выбираем 3 уникальных бонуса
        while (selected.length < 2) {
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
        soundManager.playBonus();
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