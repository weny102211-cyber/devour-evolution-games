import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';

export class PowerUpManager {
  constructor(scene) {
    this.scene = scene;
    this.items = []; // 现存地图上的道具
    this.maxItems = 5;
    this.spawnTimer = 2.0; // 开局2秒后产生第一批道具
    this.spawnInterval = 12.0;

    this.initGeometries();
  }

  initGeometries() {
    this.geoOcta = new THREE.OctahedronGeometry(0.75, 0);
    this.geoTorus = new THREE.TorusGeometry(1.05, 0.08, 8, 24);
    this.geoTorus.rotateX(Math.PI / 2);

    this.materials = {
      speed: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00c8e0,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      }),
      magnet: new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xd6006a,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      }),
      double_exp: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xcca000,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      }),
      time_warp: new THREE.MeshStandardMaterial({
        color: 0x39ff14,
        emissive: 0x20cc00,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      }),
    };
  }

  // 重置清理所有道具
  reset() {
    for (const item of this.items) {
      if (item.mesh && item.mesh.parent) {
        item.mesh.parent.remove(item.mesh);
      }
    }
    this.items = [];
    this.spawnTimer = 2.0;
  }

  // 随机在主要马路或广场空地上生成一个道具
  spawnOne() {
    if (this.items.length >= this.maxItems) return;

    const types = ['speed', 'magnet', 'double_exp', 'time_warp'];
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const def = GameConfig.POWER_UPS[typeKey.toUpperCase()];

    const group = new THREE.Group();

    // 悬浮晶石
    const crystalMat = this.materials[typeKey] || this.materials.speed;
    const crystal = new THREE.Mesh(this.geoOcta, crystalMat);
    crystal.castShadow = true;
    group.add(crystal);

    // 外围旋转光环
    const ringMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.75,
      wireframe: true,
    });
    const ring = new THREE.Mesh(this.geoTorus, ringMat);
    group.add(ring);

    // 随机空地位置 (避开太靠近原点广场喷泉中心)
    let x = (Math.random() - 0.5) * 110;
    let z = (Math.random() - 0.5) * 110;
    if (Math.hypot(x, z) < 14) {
      x += 18;
      z += 18;
    }

    group.position.set(x, 1.25, z);
    this.scene.add(group);

    this.items.push({
      type: typeKey,
      def,
      mesh: group,
      crystal,
      ring,
      x,
      z,
      baseY: 1.25,
      timeOffset: Math.random() * 10,
    });
  }

  update(delta, playerHole, aiHoles = [], onCollectCallback) {
    // 道具悬浮与旋转动画
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.timeOffset += delta;
      item.crystal.rotation.y += delta * 2.2;
      item.crystal.rotation.x += delta * 1.4;
      item.ring.rotation.z += delta * 3.0;
      item.ring.rotation.x = Math.sin(item.timeOffset * 2.5) * 0.4;
      item.mesh.position.y = item.baseY + Math.sin(item.timeOffset * 3.0) * 0.35;

      // 玩家拾取碰撞判定
      let collected = false;
      let collector = null;

      if (playerHole && playerHole.isAlive) {
        const dist = Math.hypot(playerHole.x - item.x, playerHole.z - item.z);
        if (dist <= playerHole.radius + 1.1) {
          collected = true;
          collector = playerHole;
        }
      }

      // AI 对手拾取
      if (!collected) {
        for (const ai of aiHoles) {
          if (!ai.isAlive) continue;
          const dist = Math.hypot(ai.x - item.x, ai.z - item.z);
          if (dist <= ai.radius + 1.1) {
            collected = true;
            collector = ai;
            break;
          }
        }
      }

      if (collected && collector) {
        // 拾取成功，触发回调
        if (onCollectCallback) {
          onCollectCallback(collector, item);
        }
        // 移除该道具
        this.scene.remove(item.mesh);
        this.items.splice(i, 1);
      }
    }

    // 道具刷新计时器
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval;
      this.spawnOne();
    }
  }
}
