import * as THREE from '../../libs/three.module.js';

// 轻量高性能特效粒子系统
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = []; // 活跃粒子队列
    this.shockwaves = []; // 活跃光环扩散
    this.sparkMats = new Map(); // 材质复用池，杜绝频繁 GC
    this.initPool();
  }

  initPool() {
    // 基础几何与通用材质
    this.sparkGeo = new THREE.DodecahedronGeometry(0.12, 0);
    this.ringGeo = new THREE.RingGeometry(0.9, 1.15, 32);
    this.ringGeo.rotateX(-Math.PI / 2);
  }

  getSparkMaterial(color) {
    if (!this.sparkMats.has(color)) {
      this.sparkMats.set(color, new THREE.MeshBasicMaterial({ color }));
    }
    return this.sparkMats.get(color);
  }

  // 物体吞噬爆星特效
  emitSwallowBurst(x, y, z, color = 0x00ffcc, count = 8, scale = 1.0) {
    if (this.particles.length >= 120) return; // 移动端性能保护上限
    const burstCount = Math.min(count, 120 - this.particles.length);
    const mat = this.getSparkMaterial(color);

    for (let i = 0; i < burstCount; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, Math.max(0.1, y), z);

      const angle = Math.random() * Math.PI * 2;
      const speed = (2.5 + Math.random() * 4.0) * scale;
      const vy = (2.0 + Math.random() * 3.5) * scale;

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy,
        vz: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        scale: (0.8 + Math.random() * 0.6) * scale
      });
      this.scene.add(mesh);
    }
  }

  // 升级扩散冲击波光环
  emitLevelUpRing(x, z, startRadius, color = 0x00ffcc) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(x, 0.08, z);
    mesh.scale.set(startRadius, startRadius, startRadius);

    this.shockwaves.push({
      mesh,
      mat,
      radius: startRadius,
      maxRadius: startRadius * 2.8,
      speed: 12.0 + startRadius * 1.5,
      opacity: 0.95,
      life: 0.6
    });
    this.scene.add(mesh);
  }

  // 击杀对手黑洞大爆发
  emitKillExplosion(x, z, radius) {
    this.emitSwallowBurst(x, 0.5, z, 0xff0055, 24, radius * 0.6);
    this.emitLevelUpRing(x, z, radius, 0xff0077);
  }

  update(delta) {
    // 1. 更新飞散粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 9.8 * delta; // 重力下坠

      const progress = p.life / p.maxLife;
      const s = p.scale * progress;
      p.mesh.scale.set(s, s, s);
    }

    // 2. 更新扩散光环
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= delta;
      sw.radius += sw.speed * delta;
      const progress = sw.life / 0.6;
      sw.mat.opacity = Math.max(0, progress * 0.9);

      sw.mesh.scale.set(sw.radius, sw.radius, sw.radius);

      if (sw.life <= 0 || sw.mat.opacity <= 0.02) {
        this.scene.remove(sw.mesh);
        sw.mat.dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];

    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      sw.mat.dispose();
    }
    this.shockwaves = [];
  }
}
