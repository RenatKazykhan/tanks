/**
 * Универсальный менеджер этапов.
 * Управляет инициализацией, обновлением и проверкой победы для любого из 25 этапов.
 */

// Используем глобальные переменные из stageConfig.js
const STAGES_CONFIG = window.STAGES_CONFIG;
const getStageConfig = window.getStageConfig;
const getNextStageId = window.getNextStageId;
const unlockStage = window.unlockStage;
const updateStageRecord = window.updateStageRecord;
const saveStagesToStorage = window.saveStagesToStorage;

// Обработчики этапов будут доступны глобально после загрузки соответствующих файлов
// (survivalStage.js, mazeStage.js и т.д. должны присвоить свои классы в window)

class StageManager {
  constructor() {
    this.currentStageId = 1;
    this.currentStage = null;
    this.stageHandlers = new Map();
    this.initialized = false;
    
    // Регистрация обработчиков по типам
    this.registerHandlers();
  }
  
  /**
   * Регистрация обработчиков для каждого типа этапа.
   */
  registerHandlers() {
    // Используем глобальные классы, которые должны быть определены
    this.stageHandlers.set('survival', window.SurvivalStage);
    this.stageHandlers.set('maze', window.MazeStage);
    this.stageHandlers.set('exit', window.ExitStage);
    this.stageHandlers.set('base', window.BaseStage);
    this.stageHandlers.set('boss', window.BossStage);
  }
  
  /**
   * Установить текущий этап.
   * @param {number} stageId 
   */
  setStage(stageId) {
    if (stageId < 1 || stageId > 25) {
      console.error(`Некорректный ID этапа: ${stageId}`);
      return;
    }
    
    const config = getStageConfig(stageId);
    if (!config.unlocked) {
      console.warn(`Этап ${stageId} заблокирован!`);
      return;
    }

    this.currentStageId = stageId;
    this.currentStage = config;
    
    // Создаём экземпляр обработчика для этого этапа
    const HandlerClass = this.stageHandlers.get(config.type);
    if (!HandlerClass) {
      console.error(`Не найден обработчик для типа этапа: ${config.type}`);
      return;
    }
    
    this.handler = new HandlerClass(config);
    this.initialized = true;
    
    console.log(`Установлен этап ${stageId}: ${config.name}`);
  }
  
  /**
   * Инициализация текущего этапа.
   * @param {PlayerTank} player 
   * @param {Array} walls 
   * @param {Array} enemies 
   * @param {Array} powerUps 
   */
  init(player, walls, enemies, powerUps) {
    if (!this.initialized) {
      //this.setStage(this.currentStageId);
      currentStage = parseInt(localStorage.getItem('currentStage')) || 1;
      this.setStage(currentStage);
    }
    
    if (!this.handler) {
      console.error('Обработчик этапа не создан');
      return;
    }
    
    this.handler.init(player, walls, enemies, powerUps);
  }
  
  /**
   * Обновление логики текущего этапа.
   * @param {number} deltaTime 
   * @param {PlayerTank} player 
   * @param {Array} enemies 
   * @param {Array} walls 
   */
  update(deltaTime, player, enemies, walls) {
    if (!this.handler) return;
    
    this.handler.update(deltaTime, player, enemies, walls);
  }
  
  /**
   * Проверка условия победы на текущем этапе.
   * @param {PlayerTank} player 
   * @param {Array} enemies 
   * @returns {boolean} true если победа достигнута
   */
  checkVictory(player, enemies) {
    if (!this.handler) return false;
    
    return this.handler.checkVictory(player, enemies);
  }
  
  /**
   * Сброс состояния текущего этапа.
   */
  reset() {
    if (this.handler && this.handler.reset) {
      this.handler.reset();
    }
  }
  
  /**
   * Отрисовка специфики этапа (выход, базы и т.д.).
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (this.handler && this.handler.draw) {
      this.handler.draw(ctx);
    }
  }
  
  /**
   * Получить ID следующего этапа.
   * @returns {number|null}
   */
  getNextStageId() {
    return getNextStageId(this.currentStageId);
  }
  
  /**
   * Разблокировать следующий этап.
   */
  unlockNext() {
    const nextId = this.getNextStageId();
    if (nextId) {
      unlockStage(nextId);
      saveStagesToStorage();
      console.log(`Этап ${nextId} разблокирован!`);
    }
  }
  
  /**
   * Обновить рекорд текущего этапа.
   * @param {number} score 
   */
  updateRecord(score) {
    updateStageRecord(this.currentStageId, score);
    saveStagesToStorage();
  }
  
  /**
   * Получить конфигурацию текущего этапа.
   * @returns {Object}
   */
  getCurrentConfig() {
    return this.currentStage;
  }
  
  /**
   * Получить все этапы для UI.
   * @returns {Array<Object>}
   */
  getAllStages() {
    return STAGES_CONFIG;
  }
  
  /**
   * Получить разблокированные этапы.
   * @returns {Array<Object>}
   */
  getUnlockedStages() {
    return STAGES_CONFIG.filter(stage => stage.unlocked);
  }
  
  /**
   * Проверить, разблокирован ли этап.
   * @param {number} stageId 
   * @returns {boolean}
   */
  isStageUnlocked(stageId) {
    const config = getStageConfig(stageId);
    return config ? config.unlocked : false;
  }
  
  /**
   * Получить конфигурацию этапа по ID.
   * @param {number} stageId 
   * @returns {Object|null}
   */
  getStageConfig(stageId) {
    return getStageConfig(stageId);
  }
  
  /**
   * Получить тип текущего этапа.
   * @returns {string}
   */
  getCurrentType() {
    return this.currentStage ? this.currentStage.type : null;
  }
  
  /**
   * Получить сложность текущего этапа.
   * @returns {number}
   */
  getCurrentDifficulty() {
    return this.currentStage ? this.currentStage.difficulty : 1.0;
  }
  
  /**
   * Применить множитель сложности к значению.
   * @param {number} baseValue 
   * @returns {number}
   */
  applyDifficulty(baseValue) {
    return baseValue * this.getCurrentDifficulty();
  }
}

// Создаём глобальный экземпляр менеджера
//window.stageManager = new StageManager();