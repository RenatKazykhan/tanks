/**
 * Обработчик этапа "Убить босса".
 * Игрок сражается с одним мощным боссом.
 */

window.BossStage = class BossStage {
  constructor(config) {
    this.config = config;
    this.boss = null;
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
    console.log('Инициализация этапа "Убить босса"');
    
    // Очищаем стены
    walls.length = 0;
    
    // Создаём арену для боя с боссом
    this.createArena(walls);
    
    // Создаём босса
    this.createBoss(enemies);
    
    // Выход появится после победы
    this.exit = null;
    
    // Устанавливаем игрока в начальную позицию
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;
    player.x = centerX - 200;
    player.y = centerY - 200;
    
    // Даём игроку дополнительные очки навыков
    player.skillPoints += 10 * this.config.difficulty;
    
    this.initialized = true;
  }
  
  /**
   * Создание арены для боя.
   * @param {Array} walls 
   */
  createArena(walls) {
    const arenaRadius = 400;
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;
    
    // Внешнее кольцо (непроходимая стена)
    let ringSegments = 16;
    for (let i = 0; i < ringSegments; i++) {
      const angle = (i / ringSegments) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * arenaRadius;
      const y = centerY + Math.sin(angle) * arenaRadius;
      walls.push(new Wall(x, y, 30, 30));
    }
    
    // Второе кольцо (больше)
    ringSegments += 18;
    for (let i = 0; i < ringSegments; i++) {
      const angle = (i / ringSegments) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * arenaRadius * 2;
      const y = centerY + Math.sin(angle) * arenaRadius * 2;
      walls.push(new Wall(x, y, 30, 30));
    }
    
    // Несколько препятствий на арене
    const obstacles = [
      { x: centerX - 150, y: centerY - 150, w: 40, h: 40 },
      { x: centerX + 150, y: centerY - 150, w: 40, h: 40 },
      { x: centerX - 150, y: centerY + 150, w: 40, h: 40 },
      { x: centerX + 150, y: centerY + 150, w: 40, h: 40 },
    ];
    
    obstacles.forEach(obs => {
      walls.push(new Wall(obs.x, obs.y, obs.w, obs.h));
    });
  }
  
  /**
   * Создание босса.
   * @param {Array} enemies 
   */
  createBoss(enemies) {
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;
    
    // Используем существующий класс FinalBoss или создаём обычного босса
    if (typeof FinalBoss !== 'undefined') {
      this.boss = new FinalBoss(centerX, centerY);
    } else {
      // Резервный вариант: создаём усиленного врага
      this.boss = new BossTank(centerX, centerY);
    }
    
    // Увеличиваем здоровье босса в зависимости от сложности
    const healthMultiplier = this.config.bossHealthMultiplier;
    this.boss.maxHealth *= healthMultiplier;
    this.boss.health = this.boss.maxHealth;
    
    // Увеличиваем урон босса
    this.boss.damage *= healthMultiplier;
    
    enemies.push(this.boss);
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
    
    // Проверяем, жив ли босс
    if (this.boss && !this.boss.active) {
      // Босс побеждён
      console.log('Босс побеждён!');
      
      // Создаём выход
      if (!this.exit) {
        this.exit = {
          x: WORLD_WIDTH / 2,
          y: WORLD_HEIGHT / 2,
          radius: 80
        };
      }
    }
  }
  
  /**
   * Проверка победы на этапе.
   * @param {PlayerTank} player 
   * @param {Array} enemies 
   * @returns {boolean}
   */
  checkVictory(player, enemies) {
    if (!this.initialized) return false;
    
    // Босс побеждён
    return this.boss && !this.boss.active;
  }
  
  /**
   * Сброс состояния этапа.
   */
  reset() {
    this.boss = null;
    this.exit = null;
    this.initialized = false;
  }
  
  /**
   * Отрисовка специфики этапа (выход после победы).
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.initialized) return;
    
    // Отрисовка выхода (если босс побеждён)
    if (this.exit && this.boss && !this.boss.active) {
      const x = this.exit.x;
      const y = this.exit.y;
      const radius = this.exit.radius;
      
      // Пульсирующее свечение
      const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
      
      ctx.save();
      
      // Свечение
      const glow = ctx.createRadialGradient(x, y, 20, x, y, radius);
      glow.addColorStop(0, `rgba(255, 215, 0, ${pulse * 0.6})`);
      glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Кольцо
      ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Иконка
      ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏆', x, y + 10);
      
      ctx.restore();
    }
  }
  
  /**
   * Получить текст статуса для UI.
   * @returns {string}
   */
  getStatusText() {
    if (!this.boss) return 'Босс не создан';
    
    const healthPercent = Math.floor((this.boss.health / this.boss.maxHealth) * 100);
    return `Босс: ${healthPercent}% HP`;
  }
}