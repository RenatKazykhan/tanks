class GrassBackground {
    constructor() {
        // Создаем канвас для статичного фона (один раз при инициализации)
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = canvas.width;
        this.backgroundCanvas.height = canvas.height;
        this.bgCtx = this.backgroundCanvas.getContext('2d');
    }

    // Функция для создания текстуры травы (вызывается один раз)
    createGrassBackground() {
        // Базовый цвет травы
        this.bgCtx.fillStyle = '#4a7c4e';
        this.bgCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
                
        // Легкая сетка для ориентации
        this.bgCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        this.bgCtx.lineWidth = 1;
        for (let x = 0; x < this.backgroundCanvas.width; x += 50) {
            this.bgCtx.beginPath();
            this.bgCtx.moveTo(x, 0);
            this.bgCtx.lineTo(x, this.backgroundCanvas.height);
            this.bgCtx.stroke();
        }
        
        for (let y = 0; y < this.backgroundCanvas.height; y += 50) {
            this.bgCtx.beginPath();
            this.bgCtx.moveTo(0, y);
            this.bgCtx.lineTo(this.backgroundCanvas.width, y);
            this.bgCtx.stroke();
        }
    }
}