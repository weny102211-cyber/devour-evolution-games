import { StorageManager } from './StorageManager.js';

export const ACHIEVEMENT_DEFS = [
  {
    id: 'first_blood',
    title: '初窥深渊',
    desc: '首次成功吞噬一个城市微型物体',
    icon: '🌀',
    reward: 50,
  },
  {
    id: 'combo_spree',
    title: '狂暴吸力',
    desc: '达成 5 次以上连续极速吞噬 (Combo x5)',
    icon: '🔥',
    reward: 100,
  },
  {
    id: 'combo_god',
    title: '超维风暴',
    desc: '达成 12 次以上连续吞噬风暴 (Combo x12)',
    icon: '⚡',
    reward: 250,
  },
  {
    id: 'sweeper',
    title: '全城清道夫',
    desc: '单局吞噬物体总数突破 30 个',
    icon: '🧹',
    reward: 150,
  },
  {
    id: 'heavy_crush',
    title: '重装碎石机',
    desc: '首次吞噬大型车辆或公共设施 (Lv.5+)',
    icon: '🚗',
    reward: 200,
  },
  {
    id: 'skyscraper',
    title: '天际线瓦解',
    desc: '化身终极巨兽，成功吞下一整栋大厦',
    icon: '🏢',
    reward: 400,
  },
  {
    id: 'hole_hunter',
    title: '猎杀时刻',
    desc: '在对战中成功捕食消灭一个 AI 对手黑洞',
    icon: '⚔️',
    reward: 200,
  },
  {
    id: 'apex_predator',
    title: '绝对霸主',
    desc: '在竞技对战模式中终局勇夺第 1 名',
    icon: '👑',
    reward: 500,
  },
  {
    id: 'zen_master',
    title: '全城清空者',
    desc: '在无尽解压模式中清空全城 30% 以上的资产',
    icon: '🧘',
    reward: 300,
  },
];

class AchievementManagerClass {
  constructor() {
    this.toastCallback = null;
  }

  setToastHandler(cb) {
    this.toastCallback = cb;
  }

  getAll() {
    return ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: StorageManager.isAchievementUnlocked(def.id)
    }));
  }

  checkAndUnlock(achId) {
    if (StorageManager.isAchievementUnlocked(achId)) return false;

    const def = ACHIEVEMENT_DEFS.find(a => a.id === achId);
    if (!def) return false;

    if (StorageManager.unlockAchievement(achId)) {
      StorageManager.addCoins(def.reward);
      if (this.toastCallback) {
        this.toastCallback(def);
      }
      return true;
    }
    return false;
  }

  // 快捷触发判定钩子
  onSwallow(count, combo, level) {
    if (count >= 1) this.checkAndUnlock('first_blood');
    if (combo >= 5) this.checkAndUnlock('combo_spree');
    if (combo >= 12) this.checkAndUnlock('combo_god');
    if (count >= 30) this.checkAndUnlock('sweeper');
    if (level >= 5) this.checkAndUnlock('heavy_crush');
    if (level >= 8) this.checkAndUnlock('skyscraper');
  }

  onKillAI() {
    this.checkAndUnlock('hole_hunter');
  }

  onMatchEnd(mode, rank, cleanPercent) {
    if (mode === 'battle' && rank === 1) {
      this.checkAndUnlock('apex_predator');
    }
    if (mode === 'endless' && cleanPercent >= 30) {
      this.checkAndUnlock('zen_master');
    }
  }
}

export const AchievementManager = new AchievementManagerClass();
