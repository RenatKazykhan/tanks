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

    canvas.addEventListener('click', () => {
        if (gameRunning) {
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