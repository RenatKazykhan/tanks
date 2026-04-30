/**
 * Конфигурация всех 25 этапов игры.
 * Цикл из 5 типов этапов повторяется 5 раз с возрастающей сложностью.
 */

window.STAGE_TYPES = {
  SURVIVAL: 'survival',  // выживание — продержаться N волн
  MAZE:     'maze',      // лабиринт
  EXIT:     'exit',      // найти выход
  BASE:     'base',      // уничтожить базу врага
  BOSS:     'boss'       // убить босса
};

// Порядок типов этапов в цикле
window.STAGE_CYCLE = [
  window.STAGE_TYPES.SURVIVAL,
  window.STAGE_TYPES.MAZE,
  window.STAGE_TYPES.EXIT,
  window.STAGE_TYPES.BASE,
  window.STAGE_TYPES.BOSS
];

// Биомы для каждого сета (5 сетов)
const BIOMES = ['grass', 'lava', 'desert', 'ice', 'volcano'];

// Названия этапов для UI
const STAGE_NAMES = {
  [window.STAGE_TYPES.SURVIVAL]: 'Выживание',
  [window.STAGE_TYPES.MAZE]: 'Лабиринт',
  [window.STAGE_TYPES.EXIT]: 'Найти выход',
  [window.STAGE_TYPES.BASE]: 'Уничтожить базу',
  [window.STAGE_TYPES.BOSS]: 'Убить босса'
};

// Иконки для UI
const STAGE_ICONS = {
  [window.STAGE_TYPES.SURVIVAL]: '🌍',
  [window.STAGE_TYPES.MAZE]: '🏭',
  [window.STAGE_TYPES.EXIT]: '🏜️',
  [window.STAGE_TYPES.BASE]: '🧊',
  [window.STAGE_TYPES.BOSS]: '👑'
};

/**
 * Генерация конфигурации для 25 этапов.
 * @returns {Array<Object>} Массив объектов конфигурации этапов
 */
function generateStagesConfig() {
  const stages = [];
  
  for (let i = 0; i < 25; i++) {
    const stageNum = i + 1;
    const setIndex = Math.floor(i / 5);         // 0..4
    const typeIndex = i % 5;                    // 0..4
    const difficulty = 1.0 + setIndex * 0.5;    // 1.0, 1.5, 2.0, 2.5, 3.0
    
    const type = window.STAGE_CYCLE[typeIndex];
    const set = setIndex + 1;
    const biome = BIOMES[setIndex];
    
    // Параметры в зависимости от типа этапа
    let waves = null;
    let baseCount = 1;
    let bossHealthMultiplier = 1.0;
    
    switch (type) {
      case window.STAGE_TYPES.SURVIVAL:
        waves = 15 + setIndex * 5; // 15, 20, 25, 30, 35
        break;
      case window.STAGE_TYPES.BASE:
        baseCount = 1 + setIndex; // 1, 2, 3, 4, 5 баз
        break;
      case window.STAGE_TYPES.BOSS:
        bossHealthMultiplier = difficulty;
        break;
    }
    
    stages.push({
      id: stageNum,
      type,
      set,
      difficulty,
      waves,
      baseCount,
      bossHealthMultiplier,
      biome,
      name: `${STAGE_NAMES[type]} (Сет ${set})`,
      icon: STAGE_ICONS[type],
      unlocked: stageNum === 1, // по умолчанию только первый этап разблокирован
      record: 0,
      // Ссылки на функции для инициализации (будут заполнены в stageManager)
      initFn: null,
      updateFn: null,
      checkVictoryFn: null,
      resetFn: null,
      drawFn: null
    });
  }
  
  return stages;
}

// Экспорт готовой конфигурации
window.STAGES_CONFIG = generateStagesConfig();

/**
 * Получить конфигурацию этапа по ID.
 * @param {number} stageId 
 * @returns {Object|null}
 */
window.getStageConfig = function(stageId) {
  if (stageId < 1 || stageId > 25) return null;
  return window.STAGES_CONFIG[stageId - 1];
};

/**
 * Получить следующий этап после текущего.
 * @param {number} currentStageId 
 * @returns {number|null} ID следующего этапа или null если это последний
 */
window.getNextStageId = function(currentStageId) {
  if (currentStageId >= 25) return null;
  return currentStageId + 1;
};

/**
 * Получить все этапы определённого типа.
 * @param {string} type 
 * @returns {Array<Object>}
 */
window.getStagesByType = function(type) {
  return window.STAGES_CONFIG.filter(stage => stage.type === type);
};

/**
 * Получить все этапы определённого сета.
 * @param {number} set 
 * @returns {Array<Object>}
 */
window.getStagesBySet = function(set) {
  return window.STAGES_CONFIG.filter(stage => stage.set === set);
};

/**
 * Обновить рекорд этапа.
 * @param {number} stageId 
 * @param {number} score 
 */
window.updateStageRecord = function(stageId, score) {
  const stage = window.getStageConfig(stageId);
  if (!stage) return;
  
  if (score > stage.record) {
    stage.record = score;
  }
};

/**
 * Разблокировать этап.
 * @param {number} stageId 
 */
window.unlockStage = function(stageId) {
  const stage = window.getStageConfig(stageId);
  if (stage) {
    stage.unlocked = true;
  }
};

/**
 * Получить все разблокированные этапы.
 * @returns {Array<Object>}
 */
window.getUnlockedStages = function() {
  return window.STAGES_CONFIG.filter(stage => stage.unlocked);
};

/**
 * Сохранить состояние этапов в localStorage.
 */
window.saveStagesToStorage = function() {
  const data = window.STAGES_CONFIG.map(stage => ({
    id: stage.id,
    unlocked: stage.unlocked,
    record: stage.record
  }));
  localStorage.setItem('tankGameStages', JSON.stringify(data));
};

/**
 * Загрузить состояние этапов из localStorage.
 */
window.loadStagesFromStorage = function() {
  try {
    const saved = localStorage.getItem('tankGameStages');
    if (!saved) return;
    
    const data = JSON.parse(saved);
    data.forEach(item => {
      const stage = window.getStageConfig(item.id);
      if (stage) {
        stage.unlocked = item.unlocked;
        stage.record = item.record;
      }
    });
  } catch (e) {
    console.warn('Не удалось загрузить сохранённые этапы:', e);
  }
};