import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';

// 空间哈希网格与可吞噬物体管理器
export class ConsumableManager {
  constructor(scene) {
    this.scene = scene;
    this.objects = []; // 所有物体数组
    this.activeObjects = []; // 未被吞噬的活跃物体
    this.suckingObjects = []; // 正在被吸入/下沉动画过程中的物体
    this.cellSize = 8.0; // 空间网格单元大小
    this.grid = new Map(); // key: "cx,cz" -> Set<object>
  }

  // 计算空间网格 Key
  getGridKey(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  // 注册新物体
  registerObject(mesh, type, level, score, radius, height) {
    mesh.userData = {
      ...mesh.userData,
      type,
      level,
      score,
      radius,
      height,
      initialPos: mesh.position.clone(),
      initialRot: mesh.rotation.clone(),
      initialScale: mesh.scale.clone(),
      isSwallowed: false,
      isSucking: false,
      suckingHole: null,
      wobbleTimer: 0,
      wobbleDir: new THREE.Vector3(),
    };

    this.objects.push(mesh);
    this.activeObjects.push(mesh);
    this.addToGrid(mesh);
  }

  addToGrid(obj) {
    const key = this.getGridKey(obj.position.x, obj.position.z);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key).add(obj);
    obj.userData.gridKey = key;
  }

  removeFromGrid(obj) {
    const key = obj.userData.gridKey;
    if (key && this.grid.has(key)) {
      this.grid.get(key).delete(obj);
    }
    obj.userData.gridKey = null;
  }

  // 获取以 (x, z) 为中心、半径 searchRadius 内的所有候选物体
  getNearbyObjects(x, z, searchRadius) {
    const minCx = Math.floor((x - searchRadius) / this.cellSize);
    const maxCx = Math.floor((x + searchRadius) / this.cellSize);
    const minCz = Math.floor((z - searchRadius) / this.cellSize);
    const maxCz = Math.floor((z + searchRadius) / this.cellSize);

    const candidates = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = `${cx},${cz}`;
        const cell = this.grid.get(key);
        if (cell && cell.size > 0) {
          for (const obj of cell) {
            candidates.push(obj);
          }
        }
      }
    }
    return candidates;
  }

  // 每帧更新：处理所有黑洞对附近物体的引力、尺寸碰撞与下沉吞噬动画
  update(delta, holes, onSwallowedCallback, onBlockedCallback) {
    // 1. 处理所有活跃黑洞对周围物体的引力检测
    for (const hole of holes) {
      if (!hole.isAlive) continue;

      const suctionRange = hole.getEffectiveSuctionRadius ? hole.getEffectiveSuctionRadius() : (hole.radius * GameConfig.SUCTION_RADIUS_FACTOR);
      const candidates = this.getNearbyObjects(hole.x, hole.z, suctionRange + 4);

      for (const obj of candidates) {
        if (obj.userData.isSwallowed || obj.userData.isSucking) continue;

        const dx = hole.x - obj.position.x;
        const dz = hole.z - obj.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const objRadius = obj.userData.radius;

        // 尺寸足够判定
        const canSwallow = (hole.level >= obj.userData.level);

        // 强力磁吸吞噬触发 (只要物体碰到黑洞边缘即被捕获入洞)
        if (dist <= hole.radius + objRadius * 0.45 && canSwallow) {
          obj.userData.isSucking = true;
          obj.userData.suckingHole = hole;
          obj.userData.sinkProgress = 0;
          obj.userData.fallSpeed = 1.0 + Math.random() * 0.5;
          this.removeFromGrid(obj);
          this.suckingObjects.push(obj);
        } else if (dist <= suctionRange && canSwallow) {
          // 强化向心强力吸附拉扯
          const factor = Math.max(0, 1.0 - dist / suctionRange);
          const pullForce = Math.pow(factor, 1.2) * delta * 24.0;
          obj.position.x += (dx / dist) * pullForce;
          obj.position.z += (dz / dist) * pullForce;
          // 朝黑洞中心自然倾斜翻滚
          obj.rotation.x += (dz / dist) * delta * 4.0;
          obj.rotation.z -= (dx / dist) * delta * 4.0;
        } else if (dist < hole.radius + objRadius * 0.65 && !canSwallow) {
          // 尺寸不足！产生微弱弹性回弹反馈
          if (obj.userData.wobbleTimer <= 0) {
            obj.userData.wobbleTimer = 0.28;
            obj.userData.wobbleDir.set(-dx / dist, 0, -dz / dist);
            if (hole.isPlayer && onBlockedCallback) {
              onBlockedCallback(obj);
            }
          }
        }
      }
    }

    // 2. 更新被阻挡物体的轻微抖动动画
    for (let i = 0; i < this.activeObjects.length; i++) {
      const obj = this.activeObjects[i];
      if (obj.userData.wobbleTimer > 0) {
        obj.userData.wobbleTimer -= delta;
        const wobble = Math.sin(obj.userData.wobbleTimer * 30) * 0.12 * (obj.userData.wobbleTimer / 0.35);
        obj.position.x = obj.userData.initialPos.x + obj.userData.wobbleDir.x * wobble;
        obj.position.z = obj.userData.initialPos.z + obj.userData.wobbleDir.z * wobble;
        if (obj.userData.wobbleTimer <= 0) {
          obj.position.copy(obj.userData.initialPos);
        }
      }
    }

    // 3. 更新正在被吸入/掉落/缩小的物体动画
    for (let i = this.suckingObjects.length - 1; i >= 0; i--) {
      const obj = this.suckingObjects[i];
      const hole = obj.userData.suckingHole;

      if (!hole || !hole.isAlive) {
        // 如果黑洞在吸入过程中被消灭，恢复原状并重新入网格
        obj.userData.isSucking = false;
        obj.userData.suckingHole = null;
        obj.position.y = obj.userData.initialPos.y;
        obj.scale.copy(obj.userData.initialScale);
        this.addToGrid(obj);
        this.suckingObjects.splice(i, 1);
        continue;
      }

      obj.userData.sinkProgress += delta * 4.6;
      const t = Math.min(obj.userData.sinkProgress, 1.0);

      // 向黑洞中心平滑加速吸附
      obj.position.x = THREE.MathUtils.lerp(obj.position.x, hole.x, delta * 18.0);
      obj.position.z = THREE.MathUtils.lerp(obj.position.z, hole.z, delta * 18.0);

      // 旋转翻滚倾倒下陷
      const fallRotSpeed = obj.userData.level <= 3 ? 16.0 : 8.0;
      obj.rotation.x += delta * fallRotSpeed;
      obj.rotation.z += delta * (fallRotSpeed * 0.7);

      // 坠落入地下深渊漏斗中
      obj.position.y -= delta * (obj.userData.height * 2.8 + 3.8);

      // 缩放压扁缩小消失
      const currentScale = Math.max(0.01, 1.0 - t * 0.98);
      obj.scale.set(
        obj.userData.initialScale.x * currentScale,
        obj.userData.initialScale.y * currentScale,
        obj.userData.initialScale.z * currentScale
      );

      // 完全掉入并吞噬完毕
      if (t >= 0.92 || obj.scale.x <= 0.05 || obj.position.y <= -3.2) {
        obj.userData.isSwallowed = true;
        obj.userData.isSucking = false;
        obj.visible = false;
        this.suckingObjects.splice(i, 1);

        // 回调黑洞成长和分数结算
        if (onSwallowedCallback) {
          onSwallowedCallback(hole, obj);
        }
      }
    }
  }

  // 重置所有物体 (用于再来一局)
  resetAll() {
    this.suckingObjects = [];
    this.activeObjects = [];
    this.grid.clear();

    for (const obj of this.objects) {
      obj.visible = true;
      obj.position.copy(obj.userData.initialPos);
      obj.rotation.copy(obj.userData.initialRot);
      obj.scale.copy(obj.userData.initialScale);
      obj.userData.isSwallowed = false;
      obj.userData.isSucking = false;
      obj.userData.suckingHole = null;
      obj.userData.wobbleTimer = 0;
      this.activeObjects.push(obj);
      this.addToGrid(obj);
    }
  }
}
