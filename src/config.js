// 游戏模式定义
export const GameModes = {
  BATTLE: 'battle',   // 竞技对战模式 (限时 3 分钟，含 6 位 AI 对手角逐争霸)
  ENDLESS: 'endless', // 休闲无尽模式 (不限时，零 AI 干扰，纯享单人推平全城)
};

// 游戏核心配置与数值体系
export const GameConfig = {
  // 比赛时长 (秒，仅对战模式)
  MATCH_DURATION: 180, // 3分钟一局

  // 地图边界尺寸 (米) - 翻倍超大地图 (320m x 320m)，容纳 6 大主题城市街区
  MAP_SIZE: 320,
  MAP_HALF: 160,

  // 相机设置
  CAMERA: {
    FOV: 48,
    OFFSET_Y: 26,
    OFFSET_Z: 22,
    LOOK_OFFSET_Z: -3,
    FOLLOW_LERP: 0.14,
  },

  // 基础移动速度
  BASE_SPEED: 13.8,
  // 随着体型变大微调速度（略微减缓增加压迫感，但保持爽快）
  SPEED_DECAY_PER_LEVEL: 0.16,
  MIN_SPEED: 9.8,

  // 黑洞吸力作用范围倍率 (强化强力磁吸引力感)
  SUCTION_RADIUS_FACTOR: 1.88,
  // 吞噬吸入速度
  SUCTION_SPEED: 24.0,

  // 连击时间窗口 (秒)
  COMBO_TIMEOUT: 2.0,

  // 等级配置表 (10 阶极致阶梯成长体系)
  LEVELS: [
    { level: 1,  minExp: 0,     radius: 0.95, name: '初生微洞', maxSwallowRadius: 0.45 },
    { level: 2,  minExp: 90,    radius: 1.45, name: '街道游荡者', maxSwallowRadius: 0.75 },
    { level: 3,  minExp: 280,   radius: 2.15, name: '街区吞噬者', maxSwallowRadius: 1.15 },
    { level: 4,  minExp: 680,   radius: 3.00, name: '暴食漩涡', maxSwallowRadius: 1.65 },
    { level: 5,  minExp: 1400,  radius: 4.10, name: '载具收割者', maxSwallowRadius: 2.35 },
    { level: 6,  minExp: 2600,  radius: 5.50, name: '重装粉碎机', maxSwallowRadius: 3.25 },
    { level: 7,  minExp: 4500,  radius: 7.20, name: '巨物捕食者', maxSwallowRadius: 4.60 },
    { level: 8,  minExp: 7500,  radius: 9.80, name: '城镇瓦解者', maxSwallowRadius: 6.80 },
    { level: 9,  minExp: 12000, radius: 13.5, name: '摩天灾变', maxSwallowRadius: 10.5 },
    { level: 10, minExp: 18500, radius: 18.0, name: '星云吞噬者', maxSwallowRadius: 16.0 },
  ],

  // AI 性格配置
  AI_PROFILES: [
    { id: 'ai_1', name: '暗影漩涡', color: 0x9b59b6, rimColor: 0xaf7ac5, personality: 'aggressive', title: '凶猛猎手' },
    { id: 'ai_2', name: '暴食魔王', color: 0xe67e22, rimColor: 0xf39c12, personality: 'farmer',     title: '农夫发育' },
    { id: 'ai_3', name: '深渊领主', color: 0x1abc9c, rimColor: 0x48c9b0, personality: 'balanced',   title: '战术大师' },
    { id: 'ai_4', name: '迅捷行者', color: 0x3498db, rimColor: 0x5dade2, personality: 'cautious',   title: '逃逸专家' },
    { id: 'ai_5', name: '虚空破坏神', color: 0xe74c3c, rimColor: 0xec7063, personality: 'aggressive', title: '街区霸主' },
    { id: 'ai_6', name: '吞噬萌新', color: 0xf1c40f, rimColor: 0xf7dc6f, personality: 'novice',     title: '路痴新手' },
  ],

  // 玩家基础配置
  PLAYER: {
    name: '超级黑洞 (你)',
    color: 0x111116,
    rimColor: 0x00ffcc, // 醒目薄荷霓虹绿边缘
    pulseColor: 0x00e1ff,
  },

  // 皮肤个性化定制系统
  SKINS: [
    {
      id: 'neon_cyan',
      name: '未来深蓝',
      desc: '经典赛博科技，视界边缘泛着霓虹青辉',
      price: 0,
      icon: '💠',
      rimColor: 0x00ffcc,
      pulseColor: 0x00e1ff,
      glowColor: 0x00b4d8,
      particleColor: 0x00f5d4,
      nameplateColor: '#00f5d4'
    },
    {
      id: 'inferno_crimson',
      name: '地狱熔岩',
      desc: '灼热星核熔浆，所过之处万物焚为灰烬',
      price: 300,
      icon: '🔥',
      rimColor: 0xff3b30,
      pulseColor: 0xff9500,
      glowColor: 0xff4500,
      particleColor: 0xffa07a,
      nameplateColor: '#ff4500'
    },
    {
      id: 'void_violet',
      name: '虚空暗紫',
      desc: '异次元裂隙能量，折叠时空的暗夜霸主',
      price: 600,
      icon: '🌌',
      rimColor: 0xaf52de,
      pulseColor: 0xd946ef,
      glowColor: 0x8b5cf6,
      particleColor: 0xc084fc,
      nameplateColor: '#c084fc'
    },
    {
      id: 'solar_gold',
      name: '日耀炽金',
      desc: '恒星耀斑冠冕，纯金粒子环绕的霸道威仪',
      price: 1000,
      icon: '👑',
      rimColor: 0xffd60a,
      pulseColor: 0xffaa00,
      glowColor: 0xffc107,
      particleColor: 0xffea00,
      nameplateColor: '#ffd700'
    },
    {
      id: 'chroma_aurora',
      name: '幻彩极光',
      desc: '梦幻霓虹流光，在不同光谱间永恒流转',
      price: 1500,
      icon: '🌈',
      rimColor: 0x00f5d4,
      pulseColor: 0x7b2cbf,
      glowColor: 0xf72585,
      particleColor: 0x4cc9f0,
      nameplateColor: '#00f5d4'
    },
    {
      id: 'cyber_god',
      name: '赛博神明·终极奇点',
      desc: '赞助者专属尊荣！极光电弧矩阵，全场速度永久额外加成 +20%',
      price: 99999,
      icon: '⚡',
      exclusive: true,
      speedBonus: 1.2,
      rimColor: 0x00ffff,
      pulseColor: 0xff00ff,
      glowColor: 0xffff00,
      particleColor: 0x00ffea,
      nameplateColor: '#ff00ff'
    }
  ],

  // 局外天赋强化体系
  UPGRADES: {
    magnet: {
      id: 'magnet',
      name: '引力场强化',
      icon: '🧲',
      desc: '提升黑洞基础吸引范围',
      baseCost: 150,
      costMultiplier: 1.6,
      maxLevel: 5,
      boostPerLevel: 0.08 // 每级 +8% 磁吸力
    },
    speed: {
      id: 'speed',
      name: '超维曲速引擎',
      icon: '⚡',
      desc: '提升黑洞基础移动速度',
      baseCost: 180,
      costMultiplier: 1.6,
      maxLevel: 5,
      boostPerLevel: 0.06 // 每级 +6% 移速
    },
    exp: {
      id: 'exp',
      name: '黑洞消化吸收率',
      icon: '🌀',
      desc: '提升吞噬获得的积分与成长经验',
      baseCost: 200,
      costMultiplier: 1.65,
      maxLevel: 5,
      boostPerLevel: 0.10 // 每级 +10% 经验
    }
  },

  // 局内动态掉落增益道具
  POWER_UPS: {
    SPEED: {
      type: 'speed',
      name: '极速冲刺',
      icon: '⚡',
      color: 0x00f0ff,
      duration: 6.0,
      boost: 1.5,
      desc: '移动速度飙升 50%'
    },
    MAGNET: {
      type: 'magnet',
      name: '超维强磁',
      icon: '🧲',
      color: 0xff007f,
      duration: 7.0,
      boost: 1.75,
      desc: '吸引范围扩大 75%'
    },
    DOUBLE_EXP: {
      type: 'double_exp',
      name: '双倍能量',
      icon: '💎',
      color: 0xffd700,
      duration: 8.0,
      boost: 2.0,
      desc: '吞噬得分与经验翻倍'
    },
    TIME_WARP: {
      type: 'time_warp',
      name: '时间沙漏',
      icon: '⏰',
      color: 0x39ff14,
      duration: 0,
      boost: 15,
      desc: '比赛时间立即延长 +15 秒'
    }
  },

  // 颜色调色板 (清新现代卡通)
  PALETTE: {
    sky: 0x8fd5ff,
    groundGrass: 0x76c857,
    groundDirt: 0x8b6f4e,
    roadAsphalt: 0x3d434a,
    roadMarkingYellow: 0xf4c430,
    roadMarkingWhite: 0xf0f3f4,
    sidewalk: 0xd5dbdb,
    curb: 0x95a5a6,
    roofs: [0xe74c3c, 0x3498db, 0xe67e22, 0x2ecc71, 0x9b59b6, 0x34495e],
    walls: [0xffffff, 0xfcf3cf, 0xe8f8f5, 0xebf5fb, 0xfef9e7, 0xf4f6f6],
    carColors: [0xff3b30, 0x007aff, 0xffcc00, 0x4cd964, 0xff9500, 0x5856d6, 0xffffff, 0x1c1c1e],
    treeTrunk: 0x5d4037,
    treeLeaves: [0x2e7d32, 0x388e3c, 0x43a047, 0x4caf50, 0x66bb6a],
  }
};
