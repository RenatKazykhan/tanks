// Обработчики событий для игры

// Инициализация обработчиков событий
function initEventHandlers() {
    // Сохранение прогресса в localStorage
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('tankGamePoints', points);
        localStorage.setItem('tankGameRecord', recordScore);
        localStorage.setItem('tankGameStats', JSON.stringify(tankStats));
        localStorage.setItem('tankGameCosts', JSON.stringify(upgradeCosts));
    });

    // Обработчики клавиатуры
    window.addEventListener('keydown', (e) => {
        // Прокачка способностей через Ctrl
        if (e.ctrlKey) {
            if (e.key.toLowerCase() === 'f' && player.chainLightningSkill) {
                player.chainLightningSkill.upgrade();
                e.preventDefault();
                return;
            }
            if (e.key.toLowerCase() === 'r' && player.regenerationSkill) {
                player.regenerationSkill.upgrade();
                e.preventDefault();
                return;
            }
            if (e.key.toLowerCase() === 'e' && player.teleportSkill) {
                player.teleportSkill.upgrade();
                e.preventDefault();
                return;
            }
            if (e.key.toLowerCase() === 'q' && player.blastSkill) {
                player.blastSkill.upgrade();
                e.preventDefault();
                return;
            }
            if (e.key.toLowerCase() === 'g' && player.shieldSkill) {
                player.shieldSkill.upgrade();
                e.preventDefault();
                return;
            }
            if (e.key.toLowerCase() === 'v' && player.lifestealSkill) {
                player.lifestealSkill.upgrade();
                e.preventDefault();
                return;
            }
            if (e.key.toLowerCase() === 'c' && player.doubleShootSkill) {
                player.doubleShootSkill.upgrade();
                e.preventDefault();
                return;
            }
            if (e.key.toLowerCase() === 'x' && player.droneSkill) {
                player.droneSkill.upgrade();
                e.preventDefault();
                return;
            }
        }

        keys[e.key] = true;
        if (e.key === ' ' && gameRunning) {
            player.shoot();
        }
        // Дополнительные клавиши для управления
        if (e.key === 'Escape') {
            togglePause();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Обработчики мыши
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('click', (e) => {
        if (gameRunning) {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Проверяем клик по кнопке улучшения цепной молнии
            if (player.chainLightningSkill && player.chainLightningSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }
            // Проверяем клик по кнопке улучшения регенерации
            if (player.regenerationSkill && player.regenerationSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }
            // Проверяем клик по кнопке улучшения телепорта
            if (player.teleportSkill && player.teleportSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }
            if (player.blastSkill && player.blastSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }
            // Проверяем клик по кнопке улучшения щита
            if (player.shieldSkill && player.shieldSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }
            // Проверяем клик по кнопке улучшения вампиризма
            if (player.lifestealSkill && player.lifestealSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }
            // Проверяем клик по кнопке улучшения двойного выстрела
            if (player.doubleShootSkill && player.doubleShootSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }
            // Проверяем клик по кнопке улучшения дрона
            if (player.droneSkill && player.droneSkill.checkUpgradeClick(clickX, clickY)) {
                return;
            }

            player.shoot();
        }
    });

    // Предотвращение контекстного меню на холсте
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Обработчики для предотвращения потери фокуса
    window.addEventListener('blur', () => {
        // Приостанавливаем игру при потере фокуса
        if (gameRunning) {
            togglePause();
        }
    });

    // Обработчики изменения размера окна
    window.addEventListener('resize', () => {
        // При необходимости можно добавить логику масштабирования
        console.log('Window resized');
    });
}