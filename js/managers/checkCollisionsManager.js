class CheckCollisionManager {
    constructor() {

    }

    // Функция проверки столкновений
    checkCollision(obj1, obj2, radius1, radius2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < radius1 + radius2;
    }
}