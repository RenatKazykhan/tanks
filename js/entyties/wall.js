// wall.js
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#34495e';
        this.borderColor = '#2c3e50';
    }
    
    draw() {
        // Основная стена
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Граница стены
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Добавляем текстуру
        ctx.fillStyle = '#2c3e50';
        for(let i = 0; i < this.width; i += 20) {
            for(let j = 0; j < this.height; j += 10) {
                if((i/20 + j/10) % 2 === 0) {
                    ctx.fillRect(this.x - this.width/2 + i, this.y - this.height/2 + j, 18, 8);
                }
            }
        }
    }
    
    // Проверка столкновения с прямоугольником
    checkCollisionWithRect(objX, objY, objWidth, objHeight) {
        return objX - objWidth/2 < this.x + this.width/2 &&
               objX + objWidth/2 > this.x - this.width/2 &&
               objY - objHeight/2 < this.y + this.height/2 &&
               objY + objHeight/2 > this.y - this.height/2;
    }
    
    // Проверка столкновения с кругом (для пуль)
    checkCollisionWithCircle(objX, objY, radius) {
        // Находим ближайшую точку на прямоугольнике к центру круга
        const closestX = Math.max(this.x - this.width/2, Math.min(objX, this.x + this.width/2));
        const closestY = Math.max(this.y - this.height/2, Math.min(objY, this.y + this.height/2));
        
        // Вычисляем расстояние от этой точки до центра круга
        const distanceX = objX - closestX;
        const distanceY = objY - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        
        return distanceSquared < (radius * radius);
    }
    
    // Отталкивание объекта от стены
    pushOut(obj, objWidth, objHeight) {
        const objLeft = obj.x - objWidth/2;
        const objRight = obj.x + objWidth/2;
        const objTop = obj.y - objHeight/2;
        const objBottom = obj.y + objHeight/2;
        
        const wallLeft = this.x - this.width/2;
        const wallRight = this.x + this.width/2;
        const wallTop = this.y - this.height/2;
        const wallBottom = this.y + this.height/2;
        
        // Вычисляем перекрытия
        const overlapLeft = objRight - wallLeft;
        const overlapRight = wallRight - objLeft;
        const overlapTop = objBottom - wallTop;
        const overlapBottom = wallBottom - objTop;
        
        // Находим минимальное перекрытие
        let minOverlap = overlapLeft;
        let pushX = -overlapLeft;
        let pushY = 0;
        
        if (overlapRight < minOverlap) {
            minOverlap = overlapRight;
            pushX = overlapRight;
            pushY = 0;
        }
        
        if (overlapTop < minOverlap) {
            minOverlap = overlapTop;
            pushX = 0;
            pushY = -overlapTop;
        }
        
        if (overlapBottom < minOverlap) {
            minOverlap = overlapBottom;
            pushX = 0;
            pushY = overlapBottom;
        }
        
        // Применяем отталкивание
        obj.x += pushX;
        obj.y += pushY;
    }
}