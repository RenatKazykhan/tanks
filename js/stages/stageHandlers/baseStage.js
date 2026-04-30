/**
 * Обработчик этапа "Уничтожить базу врага".
 * Игрок должен уничтожить вражескую базу и все здания-производители.
 */

window.BaseStage = class BaseStage {
  constructor(config) {
    this.config = config;
    this.bases = [];
    this.exit = null;
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
    console.log(`Инициализация этапа "Уничтожить базу": ${this.config.baseCount} баз`);
    
    // Очищаем стены
    walls.length = 0;
    
    // Создаём лабиринт/карту
    this.generateMaze(walls);
    
    // Создаём базы врага
    this.createBases(enemies);
    
    // Создаём здания-производители
    this.createBuildings(enemies);
    
    // Устанавливаем игрока в начальную позицию
    player.x = WORLD_WIDTH/2;
    player.y = WORLD_HEIGHT/2;
    
    this.initialized = true;
  }
  
  generateMaze(walls) {
    // Случайные стены для укрытия игрока
    const numWalls = 18;
    const minX = 750;
    const maxX = WORLD_WIDTH - 750;
    const minY = 750;
    const maxY = WORLD_HEIGHT - 750;
    const minSize = 20;
    const maxSize = 120;

    for (let i = 0; i < numWalls; i++) {
        const width = minSize + Math.random() * (maxSize - minSize);
        const height = minSize + Math.random() * (maxSize - minSize);
        const x = minX + Math.random() * (maxX - minX - width);
        const y = minY + Math.random() * (maxY - minY - height);

        // Проверяем, чтобы стена не перекрывала критически важные зоны (старт игрока и базы)
        const playerStartX = WORLD_WIDTH/2;
        const playerStartY = WORLD_HEIGHT/2;

        // Если стена слишком близко к этим точкам, пропускаем
        const distanceToPlayer = Math.sqrt((x - playerStartX) ** 2 + (y - playerStartY) ** 2);

        if (distanceToPlayer < 200) {
            continue;
        }

        walls.push(new Wall(x, y, width, height));
    }
}

  /**
   * Создание вражеских баз.
   * @param {Array} enemies 
   */
  createBases(enemies) {
    this.bases = [];
    const baseCount = this.config.baseCount;
    
    for (let i = 0; i < baseCount; i++) {
      // Распределяем базы по углам карты
      let x, y;
      switch (i % 4) {
        case 0: x = WORLD_WIDTH - 200; y = WORLD_HEIGHT - 200; break;
        case 1: x = WORLD_WIDTH - 200; y = 200; break;
        case 2: x = 200; y = WORLD_HEIGHT - 200; break;
        case 3: x = 200; y = 200; break;
      }
      
      const base = new EnemyBase(x, y);
      this.bases.push(base);
      enemies.push(base);
    }
  }
  
  /**
   * Создание зданий-производителей.
   * @param {Array} enemies 
   */
  createBuildings(enemies) {
    const types = ['fast', 'heavy', 'standard'];
    
    // Для каждой базы создаём здания вокруг неё
    for (let baseIndex = 0; baseIndex < this.bases.length; baseIndex++) {
      const base = this.bases[baseIndex];
      
      // Позиции зданий относительно базы:
      // слева, справа, по диагонали (лево-верх, право-верх, лево-низ, право-низ)
      const offsets = [
        { dx: -120, dy:    0 },  // слева
        { dx:  120, dy:    0 },  // справа
        { dx: 0, dy: -120 },  // сверху
        { dx: 0, dy:  120 },  // снизу
      ];
      
      // Берём нужное количество зданий на базу (например, 2)
      const buildingsPerBase = 4;
      
      for (let i = 0; i < buildingsPerBase; i++) {
        const offset = offsets[i % offsets.length];
        
        // Вычисляем позицию и ограничиваем границами мира
        const x = Math.max(50, Math.min(WORLD_WIDTH - 50, base.x + offset.dx));
        const y = Math.max(50, Math.min(WORLD_HEIGHT - 50, base.y + offset.dy));
        
        const type = types[(baseIndex * buildingsPerBase + i) % types.length];
        
        const building = new EnemyBuilding(x, y, type);
        enemies.push(building);
      }
    }
  }
  
  update(deltaTime, player, enemies, walls) {
    
  }
  
  /**
   * Проверка победы на этапе.
   * @param {PlayerTank} player 
   * @param {Array} enemies 
   * @returns {boolean}
   */
  checkVictory(player, enemies) {   
    return enemies.length === 0;
  }
  
  /**
   * Сброс состояния этапа.
   */
  reset() {
    this.bases = [];
    this.initialized = false;
  }
  
  /**
   * Отрисовка специфики этапа (базы, здания, выход).
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
  }
}