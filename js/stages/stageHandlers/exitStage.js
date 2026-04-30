/**
 * Обработчик этапа "Найти выход".
 * Игрок должен найти и достичь выхода, возможно с дополнительными условиями.
 */

window.ExitStage = class ExitStage {
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
    console.log('Инициализация этапа "Найти выход"');
    
    // Очищаем стены
    walls.length = 0;
    
    // Используем mapManager для создания карты
    const mapKey = mapManager.getMapKey(this.config.id);
    this.zones = [];
    this.exit = mapManager.createMapFromLayout(mapKey, player, walls, powerUps, this.zones);
    
    // Устанавливаем игрока в начальную позицию
    player.x = 200;
    player.y = 200;
    
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
    
    this.checkZonesActivation(player);
  }
  
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
    
    // Выход достигнут и врагов нет
    const playerRect = {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height
    };
    
    const exitReached = this.checkRectCollision(playerRect, this.exit);
    
    return exitReached;
  }
  
  /**
   * Сброс состояния этапа.
   */
  reset() {
    this.zones = [];
    this.initialized = false;
  }
  
  /**
   * Отрисовка специфики этапа (выход).
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.initialized || !this.exit) return;
    
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffb020';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#000';
    ctx.textAlign = 'left';
    ctx.fillText("Нужно добраться до выхода", 25, 20);
    ctx.restore();

    this.drawExit();
  }
  
  /**
   * Получить текст статуса для UI.
   * @returns {string}
   */
  getStatusText() {
    return 'Найдите выход';
  }

  drawExit() {
    const x = this.exit.x;
    const y = this.exit.y;
    const w = this.exit.width;
    const h = this.exit.height;

    // Пульсирующее свечение
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

    ctx.save();

    // Свечение
    const glow = ctx.createRadialGradient(
        x + w / 2, y + h / 2, 10,
        x + w / 2, y + h / 2, 50
    );
    glow.addColorStop(0, `rgba(0, 255, 100, ${pulse * 0.5})`);
    glow.addColorStop(1, 'rgba(0, 255, 100, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 20, y - 20, w + 40, h + 40);

    // Рамка выхода
    ctx.strokeStyle = `rgba(0, 255, 100, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Стрелка вверх
    ctx.fillStyle = `rgba(0, 255, 100, ${pulse})`;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🚪', x + w / 2, y + h / 2 + 8);

    ctx.restore();
  }
}