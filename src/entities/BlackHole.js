import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';

// 黑洞核心实体类 (包含视觉表现、物理吸力中心、成长与竞技属性)
export class BlackHole {
  constructor(scene, config, isPlayer = false) {
    this.scene = scene;
    this.id = config.id || 'player';
    this.name = config.name;
    this.color = config.color || 0x111116;
    this.rimColor = config.rimColor || 0x00ffcc;
    this.isPlayer = isPlayer;

    this.level = 1;
    this.exp = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.killCount = 0;
    this.swallowCount = 0;

    this.radius = GameConfig.LEVELS[0].radius;
    this.targetRadius = this.radius;
    this.displayScale = 1.0;
    this.punchScale = 1.0; // 吞噬弹跳冲量

    this.x = 0;
    this.z = 0;
    this.vx = 0;
    this.vz = 0;

    this.isAlive = true;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0; // 无敌闪烁保护

    // 局外天赋强化与局内时效道具 Buff
    this.upgrades = { magnet: 0, speed: 0, exp: 0 };
    this.buffs = { speed: 0, magnet: 0, double_exp: 0 };
    this.currentSkinDef = null;

    this.initVisuals();
  }

  // 装配个性化皮肤
  applySkin(skinDef) {
    if (!skinDef) return;
    this.currentSkinDef = skinDef;
    this.rimColor = skinDef.rimColor;
    if (this.rimMat) this.rimMat.color.setHex(skinDef.rimColor);
    if (this.outerGlowMat) this.outerGlowMat.color.setHex(skinDef.glowColor || skinDef.rimColor);
    if (this.orbitSwirls) {
      const pColor = skinDef.particleColor || skinDef.rimColor;
      for (const s of this.orbitSwirls) {
        if (s.material) s.material.color.setHex(pColor);
      }
    }
    this.renderNameplate();
  }

  // 装配天赋升级
  applyUpgrades(upgrades) {
    if (!upgrades) return;
    this.upgrades = { ...this.upgrades, ...upgrades };
  }

  // 激活局内限时 Buff
  applyBuff(type, duration) {
    if (this.buffs[type] !== undefined) {
      this.buffs[type] = Math.max(this.buffs[type], duration);
    }
  }

  // 获取当前实际移动速度 (融入等级衰减、天赋升级与极速冲刺 Buff)
  getEffectiveSpeed() {
    let spd = Math.max(GameConfig.MIN_SPEED, GameConfig.BASE_SPEED - (this.level - 1) * GameConfig.SPEED_DECAY_PER_LEVEL);
    if (this.upgrades.speed) {
      spd *= (1.0 + this.upgrades.speed * 0.06);
    }
    if (this.currentSkinDef && this.currentSkinDef.speedBonus) {
      spd *= this.currentSkinDef.speedBonus;
    }
    if (this.buffs.speed > 0) {
      spd *= 1.5;
    }
    return spd;
  }

  // 获取当前实际吸力范围 (融入基础半径、天赋强化与超维强磁 Buff)
  getEffectiveSuctionRadius() {
    let rad = this.radius * GameConfig.SUCTION_RADIUS_FACTOR;
    if (this.upgrades.magnet) {
      rad *= (1.0 + this.upgrades.magnet * 0.08);
    }
    if (this.buffs.magnet > 0) {
      rad *= 1.75;
    }
    return rad;
  }

  initVisuals() {
    this.root = new THREE.Group();
    this.root.position.set(this.x, 0, this.z);

    // 1. 隐形 Stencil 镂空面 (将地面、马路在该区域内直接裁切挖空，透出真实地下深渊)
    const stencilGeo = new THREE.CircleGeometry(0.96, 36);
    stencilGeo.rotateX(-Math.PI / 2);
    const stencilMat = new THREE.MeshBasicMaterial({
      colorWrite: false, // 隐形不输出颜色
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
    });
    this.stencilMesh = new THREE.Mesh(stencilGeo, stencilMat);
    this.stencilMesh.position.y = 0.02;
    this.stencilMesh.renderOrder = 1;
    this.root.add(this.stencilMesh);

    // 2. 地下立体无底洞深渊圆筒 (向下延伸 6 米，真实三维坑洞)
    const funnelGeo = new THREE.CylinderGeometry(0.96, 0.2, 5.5, 32, 1, true);
    const funnelMat = new THREE.MeshBasicMaterial({
      color: 0x020208,
      side: THREE.BackSide,
    });
    this.funnelMesh = new THREE.Mesh(funnelGeo, funnelMat);
    this.funnelMesh.position.y = -2.75;
    this.funnelMesh.renderOrder = 3;
    this.root.add(this.funnelMesh);

    // 深渊底盘
    const bottomGeo = new THREE.CircleGeometry(0.25, 24);
    bottomGeo.rotateX(-Math.PI / 2);
    const bottomMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
    this.bottomMesh.position.y = -5.45;
    this.bottomMesh.renderOrder = 3;
    this.root.add(this.bottomMesh);

    // 3. 边缘发光霓虹吸积吸力光环
    const rimGeo = new THREE.RingGeometry(0.96, 1.15, 36);
    rimGeo.rotateX(-Math.PI / 2);
    this.rimMat = new THREE.MeshBasicMaterial({
      color: this.rimColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    this.rimMesh = new THREE.Mesh(rimGeo, this.rimMat);
    this.rimMesh.position.y = 0.035;
    this.root.add(this.rimMesh);

    // 4. 旋转外层微光粒子环 (增添科幻动态质感)
    const particleRingGeo = new THREE.RingGeometry(1.12, 1.28, 24);
    particleRingGeo.rotateX(-Math.PI / 2);
    this.outerGlowMat = new THREE.MeshBasicMaterial({
      color: this.rimColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    this.outerGlowMesh = new THREE.Mesh(particleRingGeo, this.outerGlowMat);
    this.outerGlowMesh.position.y = 0.04;
    this.root.add(this.outerGlowMesh);

    // 5. 环绕吸入微光螺旋粒子群 (增添活体漩涡引力流动感)
    this.orbitSwirls = [];
    const swirlGeo = new THREE.DodecahedronGeometry(0.09, 0);
    const swirlMat = new THREE.MeshBasicMaterial({ color: this.rimColor });
    for (let i = 0; i < 6; i++) {
      const swirl = new THREE.Mesh(swirlGeo, swirlMat);
      const angle = (i / 6) * Math.PI * 2;
      swirl.userData = { angle, dist: 0.98 + (i % 3) * 0.14, speed: 2.8 + i * 0.4 };
      this.root.add(swirl);
      this.orbitSwirls.push(swirl);
    }

    // 6. 头顶姓名与等级浮动看板
    this.createNameplate();

    this.scene.add(this.root);
    this.updateMeshTransform();
  }

  createNameplate() {
    // Canvas 绘制高清晰度发光铭牌
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    this.plateCtx = canvas.getContext('2d');
    this.plateTexture = new THREE.CanvasTexture(canvas);
    this.plateTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.plateTexture,
      transparent: true,
      depthTest: false,
    });
    this.nameplate = new THREE.Sprite(spriteMat);
    this.nameplate.scale.set(3.6, 0.9, 1);
    this.nameplate.position.y = 2.4;
    this.root.add(this.nameplate);

    this.renderNameplate();
  }

  renderNameplate() {
    if (!this.plateCtx) return;
    const ctx = this.plateCtx;
    ctx.clearRect(0, 0, 256, 64);

    // 背景圆角胶囊
    ctx.fillStyle = this.isPlayer ? 'rgba(0, 200, 160, 0.82)' : 'rgba(20, 25, 35, 0.78)';
    ctx.beginPath();
    ctx.roundRect(10, 8, 236, 48, 24);
    ctx.fill();

    // 边框高亮
    ctx.strokeStyle = this.isPlayer ? '#ffffff' : '#48c9b0';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 文本内容：Lv.X 名字
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    const txt = `Lv.${this.level} ${this.name}`;
    ctx.fillText(txt, 128, 32);

    this.plateTexture.needsUpdate = true;
  }

  // 位置与几何体缩放应用
  updateMeshTransform() {
    this.root.position.set(this.x, 0, this.z);
    const s = this.radius * (this.punchScale || 1.0);
    this.stencilMesh.scale.set(s, 1, s);

    // 严密贴合地面的深渊漏斗 (保证漏斗顶部永远与地面平齐，杜绝深渊圆柱伸入空中 Bug)
    const sy = Math.max(1.0, s * 0.75);
    this.funnelMesh.scale.set(s, sy, s);
    this.funnelMesh.position.y = -2.75 * sy;

    this.bottomMesh.scale.set(s, 1, s);
    this.bottomMesh.position.y = -5.5 * sy + 0.05;

    this.rimMesh.scale.set(s, 1, s);
    this.outerGlowMesh.scale.set(s, 1, s);

    // 浮动看板根据体型高度自适应向上偏移
    if (this.nameplate) {
      this.nameplate.position.y = Math.max(2.4, this.radius * 1.35 + 1.2);
      const plateSize = Math.max(3.6, this.radius * 0.9 + 2.0);
      this.nameplate.scale.set(plateSize, plateSize * 0.25, 1);
    }
  }

  // 吞噬物体结算：增加 EXP、分数、连击及弹性放大脉冲
  onSwallow(obj) {
    this.swallowCount++;
    const baseScore = obj.userData.score || 10;

    // 连击加成
    this.combo++;
    this.comboTimer = GameConfig.COMBO_TIMEOUT;
    let multiplier = 1.0 + Math.min(this.combo * 0.15, 3.0);

    // 天赋额外吸收率与双倍 Buff 加成
    if (this.upgrades.exp) {
      multiplier *= (1.0 + this.upgrades.exp * 0.10);
    }
    if (this.buffs.double_exp > 0) {
      multiplier *= 2.0;
    }

    const addedScore = Math.round(baseScore * multiplier);

    this.score += addedScore;
    const isLeveledUp = this.addExp(addedScore);

    // 弹性冲量反馈 (Punch Scale)
    this.punchScale = Math.min(1.22, this.punchScale + 0.08);

    return { addedScore, combo: this.combo, isLeveledUp };
  }

  // 经验与等级成长公式
  addExp(amount) {
    this.exp += amount;
    const levels = GameConfig.LEVELS;
    let newLevel = this.level;

    for (let i = levels.length - 1; i >= 0; i--) {
      if (this.exp >= levels[i].minExp) {
        newLevel = levels[i].level;
        break;
      }
    }

    const isLeveledUp = newLevel > this.level;
    this.level = newLevel;

    // 平滑线性插值计算当前等级内部的平滑半径增长
    const curCfg = levels[this.level - 1];
    const nextCfg = levels[this.level] || curCfg;
    const expRange = nextCfg.minExp - curCfg.minExp;
    const expInLevel = this.exp - curCfg.minExp;
    const fraction = expRange > 0 ? Math.min(1.0, expInLevel / expRange) : 1.0;

    this.targetRadius = curCfg.radius + (nextCfg.radius - curCfg.radius) * fraction;

    if (isLeveledUp) {
      this.renderNameplate();
    }
    return isLeveledUp;
  }

  // 被其他更大黑洞吞噬消灭
  die() {
    this.isAlive = false;
    this.root.visible = false;
    this.respawnTimer = this.isPlayer ? 3.0 : 4.2;

    // 损失 20% 分数
    this.score = Math.floor(this.score * 0.8);
    this.combo = 0;
  }

  // 在安全坐标复活
  respawn(x, z) {
    this.x = x;
    this.z = z;
    this.vx = 0;
    this.vz = 0;
    this.isAlive = true;
    this.root.visible = true;
    this.invulnerableTimer = 3.5; // 3.5秒免伤

    // 略微降低等级
    if (this.level > 2) {
      this.level = Math.max(2, this.level - 1);
      this.exp = GameConfig.LEVELS[this.level - 1].minExp;
      this.targetRadius = GameConfig.LEVELS[this.level - 1].radius;
      this.radius = this.targetRadius;
    }
    this.renderNameplate();
    this.updateMeshTransform();
  }

  update(delta) {
    if (!this.isAlive) {
      this.respawnTimer -= delta;
      return;
    }

    // 局内 Buff 计时器更新
    if (this.buffs.speed > 0) this.buffs.speed -= delta;
    if (this.buffs.magnet > 0) this.buffs.magnet -= delta;
    if (this.buffs.double_exp > 0) this.buffs.double_exp -= delta;

    // 1. 无敌保护闪烁
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      const flash = Math.sin(this.invulnerableTimer * 22) > 0;
      this.rimMat.opacity = flash ? 0.95 : 0.2;
    } else {
      this.rimMat.opacity = 0.92;
    }

    // 2. 连击计时器衰减
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // 3. 弹性缩放回弹平滑阻尼
    this.punchScale = THREE.MathUtils.lerp(this.punchScale, 1.0, delta * 9.0);

    // 4. 半径成长平滑逼近
    this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, delta * 5.0);

    // 5. 边缘吸积盘与外发光环旋转动效
    const rotSpeed = this.buffs.speed > 0 ? 4.2 : 1.8;
    this.rimMesh.rotation.z += delta * rotSpeed;
    this.outerGlowMesh.rotation.z -= delta * (rotSpeed * 1.33);

    // 6. 环绕吸力粒子螺旋流动动效
    if (this.orbitSwirls) {
      for (const swirl of this.orbitSwirls) {
        swirl.userData.angle += delta * swirl.userData.speed;
        const d = swirl.userData.dist * this.radius * this.punchScale;
        swirl.position.x = Math.cos(swirl.userData.angle) * d;
        swirl.position.z = Math.sin(swirl.userData.angle) * d;
        swirl.position.y = 0.055 + Math.sin(swirl.userData.angle * 3) * 0.03;
        swirl.scale.set(this.radius * 0.5, this.radius * 0.5, this.radius * 0.5);
      }
    }

    this.updateMeshTransform();
  }

  setPosition(x, z) {
    const bound = GameConfig.MAP_HALF - this.radius;
    this.x = Math.max(-bound, Math.min(bound, x));
    this.z = Math.max(-bound, Math.min(bound, z));
    this.updateMeshTransform();
  }

  reset(x, z) {
    this.x = x;
    this.z = z;
    this.vx = 0;
    this.vz = 0;
    this.level = 1;
    this.exp = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.killCount = 0;
    this.swallowCount = 0;
    this.radius = GameConfig.LEVELS[0].radius;
    this.targetRadius = this.radius;
    this.punchScale = 1.0;
    this.isAlive = true;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.root.visible = true;
    this.renderNameplate();
    this.updateMeshTransform();
  }
}
