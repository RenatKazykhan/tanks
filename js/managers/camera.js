// ===== CANVAS И РАЗМЕРЫ МИРА =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры окна
canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 115;

// Размеры мира
const WORLD_WIDTH = 3660;
const WORLD_HEIGHT = 3000;

// ===== КАМЕРА =====
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

// ===== ТРЯСКА КАМЕРЫ =====
const cameraShake = {
    intensity: 0,
    decay: 8,
    offsetX: 0,
    offsetY: 0,
    trigger(intensity) {
        this.intensity = Math.max(this.intensity, intensity);
    },
    update(dt) {
        if (this.intensity > 0.1) {
            this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
            this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
            this.intensity *= Math.max(0, 1 - this.decay * dt);
        } else {
            this.intensity = 0;
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }
};

// ===== ОБНОВЛЕНИЕ КАМЕРЫ =====
function updateCamera() {
    const targetX = player.x - camera.width / 2;
    const targetY = player.y - camera.height / 2;

    // Плавное движение камеры (lerp)
    const lerpSpeed = 15;
    camera.x += (targetX - camera.x) * lerpSpeed * deltaTime;
    camera.y += (targetY - camera.y) * lerpSpeed * deltaTime;

    // Устраняем микро-дрожание при малых смещениях
    if (Math.abs(targetX - camera.x) < 0.5) camera.x = targetX;
    if (Math.abs(targetY - camera.y) < 0.5) camera.y = targetY;

    // Не даем камере выйти за границы мира
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - camera.height));
}

// ===== ПРОВЕРКА ВИДИМОСТИ В КАМЕРЕ =====
function isInCameraView(obj, padding = 50) {
    return obj.x + obj.width + padding > camera.x &&
           obj.x - padding < camera.x + camera.width &&
           obj.y + obj.height + padding > camera.y &&
           obj.y - padding < camera.y + camera.height;
}
