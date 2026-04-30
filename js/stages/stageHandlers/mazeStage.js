/**
 * Обработчик этапа "Лабиринт".
 * Игрок должен найти выход из лабиринта, активируя зоны.
 */

window.MazeStage = class MazeStage {
  constructor(config) {
    this.config = config;
    this.exit = { x: 0, y: 0, width: 60, height: 60 };
    this.zones = [];
    this.initialized = false;
  }
  
  /**
   * Инициализация этапа.
   * @param {PlayerTank} player 
   * @param {Array} walls 
   * @param {Array} enemies 
   * @param {Array} powerUps 
   */
  init(player, walls, enemies, powerUps) {
    console.log('Инициализация этапа лабиринта');
    
    // Очищаем стены
    walls.length = 0;
    
    // Используем mapManager для создания лабиринта
    const mapKey = mapManager.getMapKey(this.config.id);
    this.zones = [];
    this.exit = mapManager.createMapFromLayout(mapKey, player, walls, powerUps, this.zones);
    
    // Устанавливаем игрока в начальную позицию
    player.x = 100;
    player.y = WORLD_HEIGHT - 100;
    
    this.initialized = true;
  }
  
  /**
   * Обновление логики этапа.
   * @param {number} deltaTime 
   * @param {PlayerTank} player 
   * @param {Array} enemies 
   * @param {Array} walls 
   */
  update(deltaTime, player, enemies, walls) {
    if (!this.initialized) return;
    
    // Проверяем активацию зон
    this.checkZonesActivation(player);
    
    // Проверяем достижение выхода
    this.checkExit(player);
  }
  
  /**
   * Проверка активации зон.
   * @param {PlayerTank} player 
   */
  checkZonesActivation(player) {
    this.zones.forEach(zone => {
      if (zone.activated) return;
      
      const dx = player.x - zone.x;
      const dy = player.y - zone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < zone.radius) {
        zone.activated = true;
        console.log(`Зона активирована: ${zone.id}`);
        
        enemies.push(...zone.enemies);

        // Визуальный эффект
        if (window.visualEffects) {
          window.visualEffects.createZoneActivationEffect(zone.x, zone.y);
        }
      }
    });
  }
  
  /**
   * Проверка достижения выхода.
   * @param {PlayerTank} player 
   */
  checkExit(player) {
    const playerRect = {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height
    };
    
    if (this.checkRectCollision(playerRect, this.exit)) {
      // Выход достигнут, но победа только если все зоны активированы
      const allZonesActivated = this.zones.every(zone => zone.activated);
      const noEnemies = window.enemies && window.enemies.length === 0;
      
      if (allZonesActivated && noEnemies) {
        // Победа будет обработана в checkVictory
        console.log('Игрок достиг выхода!');
      }
    }
  }
  
  /**
   * Проверка столкновения прямоугольников.
   * @param {Object} rect1
   * @param {Object} rect2
   * @returns {boolean}
   */
  checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  /**
   * Проверка победы на этапе.
   * @param {PlayerTank} player
   * @param {Array} enemies
   * @returns {boolean}
   */
  checkVictory(player, enemies) {
    if (!this.initialized) return false;
    
    // Все зоны активированы, врагов нет, игрок у выхода
    const allZonesActivated = this.zones.every(zone => zone.activated);
    
    if (allZonesActivated) {
      const playerRect = {
        x: player.x - player.width / 2,
        y: player.y - player.height / 2,
        width: player.width,
        height: player.height
      };

      visualEffects.createExitEffect();

      return this.checkRectCollision(playerRect, this.exit);
    }
    
    return false;
  }
  
  /**
   * Сброс состояния этапа.
   */
  reset() {
    this.zones = [];
    this.initialized = false;
  }
  
  /**
   * Отрисовка специфики этапа (зоны, выход).
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffb020';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#000';
    ctx.textAlign = 'left';
    const activatedCount = this.zones.filter(zone => zone.activated).length;
    ctx.fillText("Нужно активировать все зоны и найти выход", 25, 20);
    ctx.fillText(`Активированных зон ${activatedCount}/${this.zones.length}`, 25, 40);
    ctx.restore();
  }
  
  /**
   * Получить текст статуса для UI.
   * @returns {string}
   */
  getStatusText() {
    const activated = this.zones.filter(z => z.activated).length;
    return `Зоны: ${activated}/${this.zones.length}`;
  }
}