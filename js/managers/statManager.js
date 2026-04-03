// Класс для вражеского танка
class StatManager {
    constructor() {
        this.kills = 0; // уничтожено врагов
        this.damageDone = 0; // нанесено урона
        this.damageByExplode = 0; // урон от взрыва
        this.damageByBullet = 0; // урон от снарядов
        this.damageByLightning = 0; // урон от пилы
        this.shootsFired = 0; // выстрелов
        this.takeDamages = 0; // получено урона
        this.aim = 0; // точность
        this.hits = 0; // попдания
        this.bonusesCollect = 0; // собрано бонусов
        this.healthRestored = 0; // восстановлено здоровья
        this.healthRestoredLifeSteal = 0; // восстановлено здоровья от LifeSteal
        this.healtRestoredRegen = 0; // восстановлено здоровья от пассивной регенерации
        this.healtRestoredActiveRegen = 0; // восстановлено здоровья от способности регенерации
        this.blockedByArmor = 0; // блокировано урона от брони
        this.blockedByShield = 0; // ослаблено урона от ауры щита
    }

    update() {
        // Обновляем общее количество восстановленного здоровья
        this.healthRestored = this.healthRestoredLifeSteal + this.healtRestoredRegen + this.healtRestoredActiveRegen;
        
        // Обновляем общий нанесённый урон
        this.damageDone = this.damageByBullet + this.damageByExplode + this.damageByLightning;
        
        // Рассчитываем точность
        if (this.shootsFired > 0) {
            this.aim = Math.round((this.hits / this.shootsFired) * 100);
        } else {
            this.aim = 0;
        }
        
        // Обновляем отображение в HTML
        document.getElementById('kills').textContent = this.kills;
        document.getElementById('damageDone').textContent = this.damageDone.toFixed();
        document.getElementById('damageByExplode').textContent = this.damageByExplode.toFixed();
        document.getElementById('damageByBullet').textContent = this.damageByBullet.toFixed();
        document.getElementById('damageByLightning').textContent = this.damageByLightning.toFixed();
        document.getElementById('shootsFired').textContent = this.shootsFired;
        document.getElementById('hits').textContent = this.hits;
        document.getElementById('aim').textContent = this.aim;
        document.getElementById('takeDamages').textContent = this.takeDamages.toFixed();
        document.getElementById('bonusesCollect').textContent = this.bonusesCollect;
        document.getElementById('healthRestored').textContent = this.healthRestored.toFixed();
        document.getElementById('healthRestoredLifeSteal').textContent = this.healthRestoredLifeSteal.toFixed();
        document.getElementById('healtRestoredRegen').textContent = this.healtRestoredRegen;
        document.getElementById('healtRestoredActiveRegen').textContent = this.healtRestoredActiveRegen.toFixed();
        document.getElementById('blockedByArmor').textContent = this.blockedByArmor.toFixed();
        document.getElementById('blockedByShield').textContent = this.blockedByShield.toFixed();
    }

    reset() {
        // Сбрасываем все значения на 0
        this.kills = 0;
        this.damageDone = 0;
        this.damageByExplode = 0;
        this.damageByBullet = 0;
        this.shootsFired = 0;
        this.takeDamages = 0;
        this.aim = 0;
        this.hits = 0;
        this.bonusesCollect = 0;
        this.healthRestored = 0;
        this.healthRestoredLifeSteal = 0;
        this.healtRestoredRegen = 0;
        this.blockedByArmor = 0;
        this.blockedByShield = 0;
        
        // Обновляем отображение
        this.update();
    }
}