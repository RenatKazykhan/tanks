/**
 * Обработчик этапа "Выживание".
 * Игрок должен продержаться N волн врагов.
 */

window.SurvivalStage = class SurvivalStage {
  constructor(config) {
    this.config = config;
    this.waves = config.waves || 15;
    this.currentWave = 1;
    this.enemiesSpawned = 0;
    this.initialized = false;

    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 2000;
    this.tankIndex = 0;

    this.worldWidth = WORLD_WIDTH;
    this.worldHeight = WORLD_HEIGHT;
  }
  
  /**
   * Инициализация этапа.
   * @param {PlayerTank} player 
   * @param {Array} walls 
   * @param {Array} enemies 
   * @param {Array} powerUps 
   */
  init(player, walls, enemies, powerUps) {
    console.log(`Инициализация этапа выживания: ${this.waves} волн`);
    
    // Очищаем стены
    walls.length = 0;
    
    // Создаём простую карту (можно использовать mapManager)
    this.createSimpleMap(walls);
    
    // Устанавливаем игрока в центр
    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    
    // Сбрасываем счётчики
    this.currentWave = 1;
    this.enemiesSpawned = 0;
    this.initialized = true;
  }
  
  /**
   * Создание простой карты с препятствиями.
   * @param {Array} walls 
   */
  createSimpleMap(walls) {
    // Внешние стены
    const wallThickness = 40;
    //walls.push(new Wall(wallThickness / 2, WORLD_HEIGHT / 2, wallThickness, WORLD_HEIGHT));
    //walls.push(new Wall(WORLD_WIDTH - wallThickness / 2, WORLD_HEIGHT / 2, wallThickness, WORLD_HEIGHT));
    //walls.push(new Wall(WORLD_WIDTH / 2, wallThickness / 2, WORLD_WIDTH, wallThickness));
    //walls.push(new Wall(WORLD_WIDTH / 2, WORLD_HEIGHT - wallThickness / 2, WORLD_WIDTH, wallThickness));
    
    // Несколько внутренних препятствий
    const obstacles = [
      { x: 300, y: 300, w: 80, h: 80 },
      { x: 600, y: 400, w: 100, h: 40 },
      { x: 400, y: 600, w: 40, h: 100 },
      { x: 800, y: 300, w: 60, h: 60 },
      { x: 200, y: 700, w: 120, h: 40 }
    ];
    
    obstacles.forEach(obs => {
      walls.push(new Wall(obs.x, obs.y, obs.w, obs.h));
    });
  }
  
  /**
   * Получить количество врагов в текущей волне.
   * @returns {number}
   */
  getEnemiesPerWave(wave) {
    const base = 1;
    //const waveBonus = (wave - 1) * 2;
    const waveBonus = 1;
    const difficultyBonus = Math.floor((this.config.difficulty - 1) * 5);
    return base + waveBonus + difficultyBonus;
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

    let perWave = this.getEnemiesPerWave(this.currentWave);
    if(this.currentWave == this.waves && this.enemiesSpawned >= perWave) return;

    // Проверяем завершение волны
    if (this.enemiesSpawned >= perWave) {
      this.enemiesSpawned = 0;
      
      // Переход к следующей волне
      if (this.currentWave < this.waves) {
        this.currentWave++;    
        console.log(`Начата волна ${this.currentWave}/${this.waves}`);
        console.log(`Врагов  ${perWave}`);
      }
    }

    this.enemySpawn(deltaTime);
  }
  
  /**
   * Проверка победы на этапе.
   * @param {PlayerTank} player 
   * @param {Array} enemies 
   * @returns {boolean}
   */
  checkVictory(player, enemies) {
    if (!this.initialized) return false;
    
    // Победа, если пройдены все волны и нет врагов
    const wavesCompleted = this.currentWave >= this.waves;
    const noEnemies = enemies.length === 0;
    
    return wavesCompleted && noEnemies;
  }
  
  /**
   * Сброс состояния этапа.
   */
  reset() {
    this.currentWave = 1;
    this.enemiesSpawned = 0;
    this.initialized = false;
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 2000;
  }
  
  /**
   * Отрисовка специфики этапа (например, счётчик волн).
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
    ctx.fillText(`Волна ${this.currentWave}/${this.waves}`, 25, 20);
    ctx.fillText(`Врагов убито: ${statManager.kills}/${this.tankIndex}`, 25, 40);
    ctx.restore();
  }
  
  /**
   * Получить прогресс этапа в процентах.
   * @returns {number}
   */
  getProgress() {
    return Math.min(100, (this.currentWave / this.waves) * 100);
  }
  
  /**
   * Получить текст статуса для UI.
   * @returns {string}
   */
  getStatusText() {
    return `Волна ${this.currentWave}/${this.waves}`;
  }

  enemySpawn(deltaTime) {
    this.enemySpawnTimer += deltaTime * 1000;
    if (this.enemySpawnTimer > this.enemySpawnInterval) {
        let enemy = this.getEnemy();
        if (enemy) {
            enemies.push(enemy);
            this.enemiesSpawned++;
        }
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = Math.max(1000, this.enemySpawnInterval - 50);
    }
  }

  getEnemy() {
      // Определяем позицию спавна за границей карты
      const side = Math.floor(Math.random() * 4);
      let x, y;

      switch (side) {
          case 0: // сверху
              x = Math.random() * this.worldWidth;
              y = -50;
              break;
          case 1: // справа
              x = this.worldWidth + 50;
              y = Math.random() * this.worldHeight;
              break;
          case 2: // снизу
              x = Math.random() * this.worldWidth;
              y = this.worldHeight + 50;
              break;
          case 3: // слева
              x = -50;
              y = Math.random() * this.worldHeight;
              break;
      }

      // Карта: волна → массив конструкторов врагов для этой волны
      const waveEnemies = {
          1:  [Wave1],
          2:  [IceTank],
          3:  [SmokeTank],
          4:  [BerserkTank],
          5:  [VeerTank],
          6:  [MinerTank],
          7:  [TeleportTank],
          8:  [ShieldTank],
          9:  [SmartTank],
          10: [MachineGunTank],
          11: [HeavyTank],
          12: [RocketTank],
          13: [Sniper],
          14: [StrongEnemyTank],
          15: [KamikazeTank],
          16: [Wave1],
          17: [IceTank],
          18: [SmokeTank],
          19: [BerserkTank],
          20: [VeerTank],
          21: [MinerTank],
          22: [TeleportTank],
          23: [ShieldTank],
          24: [SmartTank],
          25: [MachineGunTank],
          26: [HeavyTank],
          27: [RocketTank],
          28: [Sniper],
          29: [StrongEnemyTank],
          30: [KamikazeTank],
      };

      // Получаем список врагов для текущей волны
      const available = waveEnemies[this.currentWave];

      // Если волна не описана — fallback на Wave1
      if (!available || available.length === 0) {
          this.tankIndex++;
          return new Wave1(x, y);
      }

      // Случайный выбор из врагов этой волны
      const EnemyClass = available[Math.floor(Math.random() * available.length)];

      this.tankIndex++;
      return new EnemyClass(x, y);
  }
}