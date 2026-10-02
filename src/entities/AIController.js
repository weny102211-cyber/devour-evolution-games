import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';
import { BlackHole } from './BlackHole.js';

// AI 竞争对手群体控制器 (分时决策、多元性格、自主觅食、猎杀与避战)
export class AIController {
  constructor(scene, consumableManager) {
    this.scene = scene;
    this.consumables = consumableManager;
    this.aiList = [];
    this.decisionInterval = 0.18; // 分时决策周期 (约 5~6Hz)
    this.frameCounter = 0;

    this.initAIHoles();
  }

  initAIHoles() {
    // 依据配置初始化 6 位不同性格的 AI
    const spawnPositions = [
      [-85, -85], // 西北 CBD 摩天楼区
      [85, -85],  // 东北商业街区
      [-85, 85],  // 西南森林公园区
      [85, 85],   // 东南别墅社区
      [-35, 45],  // 环路大道旁
      [45, -35],  // 次级交通干道旁
    ];

    GameConfig.AI_PROFILES.forEach((profile, idx) => {
      const hole = new BlackHole(this.scene, profile, false);
      const pos = spawnPositions[idx] || [0, 0];
      hole.setPosition(pos[0], pos[1]);

      this.aiList.push({
        hole,
        profile,
        targetPos: new THREE.Vector2(pos[0], pos[1]),
        moveDir: new THREE.Vector2(0, 0),
        state: 'FORAGE', // FLEE, CHASE, FORAGE, WANDER
        decisionTimer: (idx * 0.03), // 错峰分时更新
        targetObj: null,
      });
    });
  }

  getAllHoles() {
    return this.aiList.map(item => item.hole);
  }

  // 分时更新 AI 决策逻辑
  update(delta, playerHole, allHoles) {
    this.frameCounter++;

    for (let i = 0; i < this.aiList.length; i++) {
      const ai = this.aiList[i];
      const hole = ai.hole;

      // 1. 处理复活倒计时
      if (!hole.isAlive) {
        if (hole.respawnTimer <= 0) {
          // 在远离玩家和巨型黑洞的相对安全区域复活 (大地图自适应)
          const range = GameConfig.MAP_HALF * 1.5;
          const rx = (Math.random() - 0.5) * range;
          const rz = (Math.random() - 0.5) * range;
          hole.respawn(rx, rz);
        }
        continue;
      }

      // 2. 分时决策思考 (非每帧计算，大幅节约 CPU)
      ai.decisionTimer -= delta;
      if (ai.decisionTimer <= 0) {
        ai.decisionTimer = this.decisionInterval + (Math.random() * 0.04);
        this.makeDecision(ai, playerHole, allHoles);
      }

      // 3. 每帧平滑执行位移
      this.executeMovement(ai, delta);
    }
  }

  // AI 状态机思考核心
  makeDecision(ai, playerHole, allHoles) {
    const hole = ai.hole;
    const personality = ai.profile.personality;

    // ----------------------------------------------------
    // 第一优先级：感知天敌威胁 (FLEE 避战)
    // ----------------------------------------------------
    let closestThreat = null;
    let minThreatDist = Infinity;
    const threatSenseRadius = 14.0 + hole.radius * 1.2;

    for (const other of allHoles) {
      if (other === hole || !other.isAlive) continue;

      const dx = other.x - hole.x;
      const dz = other.z - hole.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // 对手比我大且具有吞噬可能
      if (other.radius >= hole.radius * 1.15 && dist < threatSenseRadius) {
        if (dist < minThreatDist) {
          minThreatDist = dist;
          closestThreat = other;
        }
      }
    }

    if (closestThreat) {
      ai.state = 'FLEE';
      // 计算背离天敌的反向矢量
      const fleeX = hole.x - closestThreat.x;
      const fleeZ = hole.z - closestThreat.z;
      const len = Math.sqrt(fleeX * fleeX + fleeZ * fleeZ) || 1;
      ai.moveDir.set(fleeX / len, fleeZ / len);
      return;
    }

    // ----------------------------------------------------
    // 第二优先级：猎杀弱小对手 (CHASE 捕食)
    // ----------------------------------------------------
    if (personality === 'aggressive' || (personality === 'balanced' && Math.random() > 0.4)) {
      let bestPrey = null;
      let minPreyDist = Infinity;
      const huntRadius = 18.0 + hole.radius;

      for (const other of allHoles) {
        if (other === hole || !other.isAlive || other.invulnerableTimer > 0) continue;

        const dx = other.x - hole.x;
        const dz = other.z - hole.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // 我明显大于对手 (> 1.25x)
        if (hole.radius >= other.radius * 1.25 && dist < huntRadius) {
          if (dist < minPreyDist) {
            minPreyDist = dist;
            bestPrey = other;
          }
        }
      }

      if (bestPrey) {
        ai.state = 'CHASE';
        const chaseX = bestPrey.x - hole.x;
        const chaseZ = bestPrey.z - hole.z;
        const len = Math.sqrt(chaseX * chaseX + chaseZ * chaseZ) || 1;
        ai.moveDir.set(chaseX / len, chaseZ / len);
        return;
      }
    }

    // ----------------------------------------------------
    // 第三优先级：高效搜寻食物 (FORAGE 觅食)
    // ----------------------------------------------------
    ai.state = 'FORAGE';
    const searchRange = Math.min(26.0, 12.0 + hole.radius * 2.0);
    const nearby = this.consumables.getNearbyObjects(hole.x, hole.z, searchRange);

    let bestObj = null;
    let bestScore = -Infinity;

    for (const obj of nearby) {
      if (obj.userData.isSwallowed || obj.userData.isSucking) continue;
      if (obj.userData.level > hole.level) continue; // 尺寸不够，不自讨没趣
      if (obj.userData.radius > hole.radius * 0.9) continue;

      const dx = obj.position.x - hole.x;
      const dz = obj.position.z - hole.z;
      const dist = Math.sqrt(dx * dx + dz * dz) + 0.1;

      // 评估物体价值得分
      let objValue = obj.userData.score;
      if (personality === 'farmer') {
        // 发育型偏好密集的低级小物体
        if (obj.userData.level <= 3) objValue *= 2.0;
      }

      const utility = objValue / (dist * 1.2);
      if (utility > bestScore) {
        bestScore = utility;
        bestObj = obj;
      }
    }

    if (bestObj) {
      ai.targetObj = bestObj;
      const tx = bestObj.position.x - hole.x;
      const tz = bestObj.position.z - hole.z;
      const len = Math.sqrt(tx * tx + tz * tz) || 1;
      ai.moveDir.set(tx / len, tz / len);
    } else {
      // ----------------------------------------------------
      // 第四优先级：周边巡逻探索 (WANDER)
      // ----------------------------------------------------
      ai.state = 'WANDER';
      if (Math.random() < 0.25 || ai.moveDir.lengthSq() < 0.01) {
        const randAngle = Math.random() * Math.PI * 2;
        ai.moveDir.set(Math.cos(randAngle), Math.sin(randAngle));
      }
    }

    // 边界斥力避障：靠近城市外墙自动回弹
    const bound = GameConfig.MAP_HALF - 8;
    if (hole.x > bound) ai.moveDir.x -= 1.8;
    if (hole.x < -bound) ai.moveDir.x += 1.8;
    if (hole.z > bound) ai.moveDir.y -= 1.8;
    if (hole.z < -bound) ai.moveDir.y += 1.8;
    ai.moveDir.normalize();
  }

  // 执行 AI 物理移动
  executeMovement(ai, delta) {
    const hole = ai.hole;
    const curSpeed = Math.max(
      GameConfig.MIN_SPEED * 0.9,
      GameConfig.BASE_SPEED * 0.92 - (hole.level - 1) * GameConfig.SPEED_DECAY_PER_LEVEL
    );

    const mx = ai.moveDir.x * curSpeed * delta;
    const mz = ai.moveDir.y * curSpeed * delta;

    hole.setPosition(hole.x + mx, hole.z + mz);
  }

  resetAll() {
    const spawnPositions = [
      [-85, -85], [85, -85], [-85, 85], [85, 85], [-35, 45], [45, -35],
    ];
    this.aiList.forEach((item, idx) => {
      const pos = spawnPositions[idx] || [0, 0];
      item.hole.reset(pos[0], pos[1]);
      item.moveDir.set(0, 0);
      item.state = 'FORAGE';
      item.decisionTimer = idx * 0.03;
    });
  }
}
