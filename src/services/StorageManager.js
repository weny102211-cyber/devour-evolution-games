// 本地持久化数据管理服务 (支持 Web LocalStorage 与抖音小游戏 tt.getStorageSync 兼容)
const STORAGE_KEY = 'devour_evolution_save_v1';

const DEFAULT_DATA = {
  coins: 200, // 初始赠送启动启动资金
  bestScore: 0,
  currentSkin: 'neon_cyan',
  unlockedSkins: ['neon_cyan'],
  upgrades: {
    magnet: 0,
    speed: 0,
    exp: 0,
  },
  settings: {
    sound: true,
    music: true,
    sensitivity: 1.0,
  },
  achievements: {},
  stats: {
    totalGames: 0,
    totalSwallowed: 0,
    totalKills: 0,
    maxCombo: 0,
    maxDiameter: 1.9,
    wins: 0,
  }
};

import { DouyinPlatform } from '../platform/DouyinPlatform.js';

class StorageManagerClass {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = DouyinPlatform.getStorageSync(STORAGE_KEY);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          ...DEFAULT_DATA,
          ...parsed,
          upgrades: { ...DEFAULT_DATA.upgrades, ...(parsed.upgrades || {}) },
          settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
          achievements: { ...DEFAULT_DATA.achievements, ...(parsed.achievements || {}) },
          stats: { ...DEFAULT_DATA.stats, ...(parsed.stats || {}) },
        };
      }
    } catch (e) {
      console.warn('[StorageManager] 读取存档失败，使用默认配置:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  save() {
    try {
      DouyinPlatform.setStorageSync(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('[StorageManager] 保存存档失败:', e);
    }
  }

  // 金币操作
  getCoins() {
    return this.data.coins || 0;
  }

  addCoins(amount) {
    if (amount <= 0) return this.data.coins;
    this.data.coins = (this.data.coins || 0) + Math.round(amount);
    this.save();
    return this.data.coins;
  }

  spendCoins(amount) {
    if (this.data.coins >= amount) {
      this.data.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  // 皮肤相关
  getCurrentSkin() {
    return this.data.currentSkin || 'neon_cyan';
  }

  setSkin(skinId) {
    if (this.data.unlockedSkins.includes(skinId)) {
      this.data.currentSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  isSkinUnlocked(skinId) {
    return this.data.unlockedSkins.includes(skinId);
  }

  unlockSkin(skinId, cost = 0) {
    if (cost > 0 && !this.spendCoins(cost)) {
      return false;
    }
    if (!this.data.unlockedSkins.includes(skinId)) {
      this.data.unlockedSkins.push(skinId);
    }
    this.data.currentSkin = skinId;
    this.save();
    return true;
  }

  // 天赋强化相关
  getUpgradeLevel(upgradeId) {
    return this.data.upgrades[upgradeId] || 0;
  }

  upgradeLevel(upgradeId, cost) {
    if (this.spendCoins(cost)) {
      this.data.upgrades[upgradeId] = (this.data.upgrades[upgradeId] || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  // 设置相关
  getSettings() {
    return this.data.settings;
  }

  setSetting(key, val) {
    this.data.settings[key] = val;
    this.save();
  }

  // 历史最高分
  getBestScore() {
    return this.data.bestScore || 0;
  }

  updateBestScore(score) {
    if (score > (this.data.bestScore || 0)) {
      this.data.bestScore = score;
      this.save();
      return true;
    }
    return false;
  }

  // 成就解锁
  isAchievementUnlocked(achId) {
    return !!this.data.achievements[achId];
  }

  unlockAchievement(achId) {
    if (!this.data.achievements[achId]) {
      this.data.achievements[achId] = Date.now();
      this.save();
      return true;
    }
    return false;
  }

  // 统计数据
  recordMatch(stats) {
    this.data.stats.totalGames = (this.data.stats.totalGames || 0) + 1;
    this.data.stats.totalSwallowed = (this.data.stats.totalSwallowed || 0) + (stats.swallowed || 0);
    this.data.stats.totalKills = (this.data.stats.totalKills || 0) + (stats.kills || 0);
    if (stats.combo > (this.data.stats.maxCombo || 0)) {
      this.data.stats.maxCombo = stats.combo;
    }
    if (stats.diameter > (this.data.stats.maxDiameter || 0)) {
      this.data.stats.maxDiameter = stats.diameter;
    }
    if (stats.rank === 1) {
      this.data.stats.wins = (this.data.stats.wins || 0) + 1;
    }
    this.save();
  }
}

export const StorageManager = new StorageManagerClass();
