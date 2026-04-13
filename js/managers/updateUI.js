class UpdateUIManager {
    constructor() {

    }

    // Обновление интерфейса
    updateUpgradeUI() {
        document.getElementById('points').textContent = `💰 Очки: ${points}`;
        
        // Обновляем кнопки улучшений
        const buttons = document.querySelectorAll('.upgrade-btn');
       // buttons[0].textContent = `Улучшить (${upgradeCosts.health})`;
        //buttons[1].textContent = `Улучшить (${upgradeCosts.speed})`;
        //buttons[2].textContent = `Улучшить (${upgradeCosts.damage})`;
        //buttons[3].textContent = `Улучшить (${upgradeCosts.fireRate})`;
        //buttons[4].textContent = `Улучшить (${upgradeCosts.bulletSpeed})`;
        //buttons[5].textContent = `Улучшить (${upgradeCosts.regen})`;
        //buttons[6].textContent = `Улучшить (${upgradeCosts.armor})`;
        //buttons[7].textContent = `Улучшить (${upgradeCosts.lifeSteal})`;
        // Блокируем кнопки, если не хватает очков
        buttons.forEach((btn, index) => {
            const stats = ['health', 'speed', 'damage', 'fireRate', 'bulletSpeed', 'regen', 'armor', 'lifeSteal'];
            btn.disabled = points < upgradeCosts[stats[index]];
        });
    }

    // Обновление счета
    updateScore() {
        document.getElementById('scoreValue').textContent = score;

        if(score > recordScore) {
            recordScore = score;
            document.getElementById('recordScoreValue').textContent = recordScore;
        }
    }

    // Обновление полоски здоровья
    updateHealthBar() {
        document.getElementById('currentHealth').innerText = Math.max(0, Math.floor(player.health));
        document.getElementById('MaxHealth').textContent = player.maxHealth.toFixed();
    }

    // Функция для обновления отображения характеристик в главном меню
    updateStatsDisplayMainMenu() {
        //document.getElementById('healthValue').textContent = tankStats.maxHealth;
        //document.getElementById('speedValue').textContent = tankStats.speed.toFixed(1);
        //document.getElementById('damageValue').textContent = tankStats.damage.toFixed();
        //document.getElementById('fireRateValue').textContent = tankStats.fireRate + 'ms';
        //document.getElementById('bulletSpeedValue').textContent = tankStats.bulletSpeed.toFixed();
        //document.getElementById('regenValue').textContent = tankStats.regen;
        //document.getElementById('armorValue').textContent = tankStats.armor + '%';
        //document.getElementById('lifeStealValue').textContent = (tankStats.lifeSteal * 100).toFixed() + '%';
    }

    // Функция для обновления отображения характеристик в паузе
    updateStatsDisplayInGame() {
        document.getElementById('speedIngame').textContent = player.speed.toFixed();
        document.getElementById('damageIngame').textContent = player.damage.toFixed();
        document.getElementById('fireRateIngame').textContent = Math.floor(player.shotCooldown) + 'ms';
        document.getElementById('bulletSpeedIngame').textContent = player.bulletSpeed.toFixed();
        document.getElementById('regenIngame').textContent = player.regen + ' hp/сек';
        document.getElementById('armorIngame').textContent = player.armor;
        document.getElementById('lifeStealIngame').textContent = (player.lifeSteal.toFixed(2) * 100) + '%';

        document.getElementById('maxShieldIngame').textContent = player.maxShield;
        document.getElementById('shieldRegenRateIngame').textContent = player.shieldRegenRate + ' ед/сек';
        document.getElementById('energyBlastDamageIngame').textContent = player.energyBlastDamage;
        document.getElementById('energyBlastRadiusIngame').textContent = player.energyBlastRadius;
        document.getElementById('energyBlastCooldownIngame').textContent = player.energyBlastCooldown / 1000 + ' сек';
        document.getElementById('teleportDistanceIngame').textContent = player.teleportDistance;
        document.getElementById('teleportCooldownIngame').textContent = player.teleportCooldown / 1000 + ' сек';

        document.getElementById('lightningDamageIngame').textContent = player.chainLightningDamage;
        document.getElementById('lightningCountIngame').textContent = player.maxChainTargets;
        document.getElementById('lightningRadiusIngame').textContent = player.chainLightningBounceRange;
        document.getElementById('lightningCooldownIngame').textContent = player.chainLightningCooldown / 1000 + ' сек';
    }
}