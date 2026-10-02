import * as THREE from '../libs/three.module.js';
import { GameConfig, GameModes } from './config.js';
import { AudioManager } from './audio/AudioManager.js';
import { CityBuilder } from './world/CityBuilder.js';
import { ConsumableManager } from './world/ConsumableManager.js';
import { PowerUpManager } from './world/PowerUpManager.js';
import { BlackHole } from './entities/BlackHole.js';
import { PlayerController } from './entities/PlayerController.js';
import { AIController } from './entities/AIController.js';
import { ParticleSystem } from './vfx/ParticleSystem.js';
import { UIManager } from './ui/UIManager.js';
import { StorageManager } from './services/StorageManager.js';
import { AchievementManager } from './services/AchievementManager.js';
import { DouyinPlatform } from './platform/DouyinPlatform.js';

// 游戏总控枢纽 (支持对战/无尽双模式自适应、皮肤衣橱、天赋升级、掉落道具、雷达与战报结算)
export class GameManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.isRunning = false;
    this.isPaused = false;
    this.mode = GameModes.BATTLE;
    this.matchTime = GameConfig.MATCH_DURATION;
    this.elapsedTime = 0;
    this.maxRadiusReached = GameConfig.LEVELS[0].radius;
    this.lastTickSoundTime = 0;

    this.initScene();
    this.initSystems();
    this.bindEvents();

    // 初始渲染一帧，呈现精美的 3D 卡通城景作为主菜单背景
    this.renderer.render(this.scene, this.camera);
  }

  initScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(GameConfig.PALETTE.sky);
    this.scene.fog = new THREE.FogExp2(GameConfig.PALETTE.sky, 0.0075);

    const C = GameConfig.CAMERA;
    this.camera = new THREE.PerspectiveCamera(C.FOV, width / height, 0.5, 600);
    this.camera.position.set(0, C.OFFSET_Y, C.OFFSET_Z);
    this.camera.lookAt(0, 0, C.LOOK_OFFSET_Z);

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        stencil: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('[GameManager] High-performance WebGL context failed, falling back:', e);
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        stencil: true
      });
    }
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e5, 0.95);
    sunLight.position.set(50, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    const shadowDist = 65;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    this.scene.add(sunLight);
  }

  initSystems() {
    this.audio = new AudioManager();
    this.ui = new UIManager();
    this.particles = new ParticleSystem(this.scene);
    this.consumables = new ConsumableManager(this.scene);
    this.powerUpMgr = new PowerUpManager(this.scene);

    // 构建现代卡通城市地图
    this.cityBuilder = new CityBuilder(this.scene, this.consumables);
    this.cityBuilder.buildCity();

    // 创建玩家黑洞并装配已保存的皮肤与天赋
    this.player = new BlackHole(this.scene, GameConfig.PLAYER, true);
    this.player.setPosition(0, 14);

    const skinId = StorageManager.getCurrentSkin();
    const skinDef = GameConfig.SKINS.find(s => s.id === skinId) || GameConfig.SKINS[0];
    this.player.applySkin(skinDef);
    this.player.applyUpgrades(StorageManager.data.upgrades);

    // 玩家控制器 (手游摇杆与键鼠)
    this.playerCtrl = new PlayerController(this.player, this.camera, this.renderer.domElement);

    // AI 群体控制器
    this.aiCtrl = new AIController(this.scene, this.consumables);

    this.lastFrameTime = performance.now();

    // 绑定开始菜单模式选择与局外衣橱、天赋、成就
    this.ui.initStartScreen(
      (mode) => this.startMatch(mode),
      () => this.returnToHome(),
      (newSkinDef) => this.player.applySkin(newSkinDef),
      this.audio
    );

    // 绑定局内暂停模态框
    this.ui.initPauseModal(
      () => { this.isPaused = false; },
      () => { this.isPaused = false; this.startMatch(this.mode); },
      () => { this.isPaused = false; this.returnToHome(); },
      this.audio
    );
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    const startAudioOnFirstTouch = () => {
      this.audio.ensureContext();
      this.audio.startBGM();
      window.removeEventListener('pointerdown', startAudioOnFirstTouch);
    };
    window.addEventListener('pointerdown', startAudioOnFirstTouch);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // 启动对局 (依选择模式执行初始化)
  startMatch(mode = GameModes.BATTLE) {
    this.mode = mode;
    this.isRunning = true;
    this.isPaused = false;
    this.matchTime = GameConfig.MATCH_DURATION;
    this.elapsedTime = 0;
    this.maxRadiusReached = GameConfig.LEVELS[0].radius;
    this.particles.clear();
    this.consumables.resetAll();
    this.powerUpMgr.reset();

    // 重置玩家并重新拉取可能已更新的天赋
    this.player.reset(0, 14);
    const skinId = StorageManager.getCurrentSkin();
    const skinDef = GameConfig.SKINS.find(s => s.id === skinId) || GameConfig.SKINS[0];
    this.player.applySkin(skinDef);
    this.player.applyUpgrades(StorageManager.data.upgrades);

    if (this.mode === GameModes.ENDLESS) {
      // 休闲无尽模式：彻底隐藏且停用所有 AI 对手 (纯单人清图)
      this.aiCtrl.getAllHoles().forEach(h => {
        h.root.visible = false;
        h.isAlive = false;
      });
      this.ui.showAlert('♾️ 休闲无尽模式已启动', '无 AI 干扰，尽情将整座城市吞噬殆尽！', 'info');
    } else {
      // 对战模式：激活全部 6 位 AI 对手
      this.aiCtrl.resetAll();
      this.aiCtrl.getAllHoles().forEach(h => {
        h.root.visible = true;
        h.isAlive = true;
      });
      this.ui.showAlert('⚔️ 竞技对战模式已启动', '3 分钟限时排位，大洞吞小洞！', 'info');
    }

    this.lastFrameTime = performance.now();
    this.audio.ensureContext();
    this.audio.startBGM();

    DouyinPlatform.gameplayStart();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop() {
    if (!this.isRunning) return;
    requestAnimationFrame((t) => this.loop(t));

    const now = performance.now();
    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;

    if (!this.isPaused && !this.ui.isPaused) {
      this.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  update(delta) {
    const isEndless = (this.mode === GameModes.ENDLESS);

    // 1. 计时与局况推进
    if (isEndless) {
      this.elapsedTime += delta;
      this.ui.updateTimer(this.elapsedTime, true);
      this.ui.updateEndlessStats(this.player.swallowCount, this.consumables.objects.length, this.player.score);
    } else {
      this.matchTime -= delta;
      this.ui.updateTimer(this.matchTime, false);

      if (this.matchTime <= 10 && this.matchTime > 0) {
        const curSec = Math.floor(this.matchTime);
        if (curSec !== this.lastTickSoundTime) {
          this.lastTickSoundTime = curSec;
          this.audio.playCountdownTick();
        }
      }

      if (this.matchTime <= 0) {
        this.onMatchComplete();
        return;
      }
    }

    // 2. 玩家控制器与黑洞更新
    this.playerCtrl.update(delta);
    this.player.update(delta);

    if (this.player.radius > this.maxRadiusReached) {
      this.maxRadiusReached = this.player.radius;
    }

    // 3. AI 群体更新与吞噬对抗 (仅对战模式执行)
    let activeHoles = [this.player];
    if (!isEndless) {
      const allHoles = [this.player, ...this.aiCtrl.getAllHoles()];
      activeHoles = allHoles;
      this.aiCtrl.update(delta, this.player, allHoles);
      for (const aiHole of this.aiCtrl.getAllHoles()) {
        aiHole.update(delta);
      }
      this.checkHoleVsHoleCollisions(allHoles);
      this.ui.updateLeaderboard(allHoles, this.player);
    }

    // 4. 物体物理吸附与吞噬检测
    this.consumables.update(
      delta,
      activeHoles,
      (hole, obj) => this.onObjectSwallowed(hole, obj),
      (blockedObj) => this.onPlayerBlocked(blockedObj)
    );

    // 5. 局内掉落道具更新与拾取判定
    this.powerUpMgr.update(
      delta,
      this.player,
      isEndless ? [] : this.aiCtrl.getAllHoles(),
      (collector, item) => this.onPowerUpCollected(collector, item)
    );

    // 6. 特效粒子更新
    this.particles.update(delta);

    // 7. HUD 经验条与雷达小地图实时刷新
    this.ui.updatePlayerGrowth(this.player, GameConfig.LEVELS);
    this.ui.updateRadar(
      this.player,
      isEndless ? [] : this.aiCtrl.getAllHoles(),
      this.powerUpMgr.items
    );
  }

  // 拾取局内道具
  onPowerUpCollected(collector, item) {
    const type = item.type;
    const def = item.def;

    if (collector.isPlayer) {
      this.audio.playPowerUp();
      if (navigator.vibrate) navigator.vibrate([40, 25, 40]);

      if (type === 'time_warp') {
        if (this.mode === GameModes.BATTLE) {
          this.matchTime = Math.min(GameConfig.MATCH_DURATION, this.matchTime + def.boost);
          this.ui.showAlert('⏰ 时空回溯！', `比赛时间延长 +${def.boost} 秒！`, 'info');
        } else {
          this.player.score += 250;
          this.ui.showAlert('⏰ 时光胶囊！', '额外获得 +250 积分奖励！', 'info');
        }
      } else {
        collector.applyBuff(type, def.duration);
        this.ui.showAlert(`${def.icon} ${def.name}！`, def.desc, 'info');
      }

      this.particles.emitSwallowBurst(item.x, 1.2, item.z, def.color, 16, 1.2);
    } else {
      if (type !== 'time_warp') {
        collector.applyBuff(type, def.duration);
      }
      this.particles.emitSwallowBurst(item.x, 1.2, item.z, def.color, 8, 0.7);
    }
  }

  // 黑洞吞噬黑洞对决 (对战模式)
  checkHoleVsHoleCollisions(allHoles) {
    for (let i = 0; i < allHoles.length; i++) {
      const hA = allHoles[i];
      if (!hA.isAlive) continue;

      for (let j = i + 1; j < allHoles.length; j++) {
        const hB = allHoles[j];
        if (!hB.isAlive) continue;

        const dx = hA.x - hB.x;
        const dz = hA.z - hB.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (hA.radius >= hB.radius * 1.25 && dist <= hA.radius * 0.72 && hB.invulnerableTimer <= 0) {
          this.executeHoleSwallowHole(hA, hB);
        } else if (hB.radius >= hA.radius * 1.25 && dist <= hB.radius * 0.72 && hA.invulnerableTimer <= 0) {
          this.executeHoleSwallowHole(hB, hA);
        }
      }
    }
  }

  executeHoleSwallowHole(predator, prey) {
    prey.die();
    predator.killCount++;
    const bonus = 450 + Math.floor(prey.score * 0.35);
    predator.score += bonus;
    predator.addExp(bonus);

    this.particles.emitKillExplosion(prey.x, prey.z, prey.radius);

    if (predator.isPlayer) {
      this.audio.playKill();
      this.playerCtrl.triggerScreenShake(1.0, 0.35);
      if (navigator.vibrate) navigator.vibrate([60, 40, 80]);
      AchievementManager.onKillAI();
      this.ui.showAlert('⚔️ 击破对手！', `吞噬了 ${prey.name} (+${bonus}分)`, 'success');
      this.spawnFloatingScore(`+${bonus} 击溃对手!`, predator.x, predator.z, true);
    } else if (prey.isPlayer) {
      this.audio.playSwallowed();
      this.playerCtrl.triggerScreenShake(0.8, 0.4);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      this.ui.showAlert('⚠️ 你被吞噬了！', `被 ${predator.name} 吞下，3秒后复活...`, 'danger');
    }
  }

  // 物体吞噬完成回调
  onObjectSwallowed(hole, obj) {
    const { addedScore, combo } = hole.onSwallow(obj);
    const lv = obj.userData.level;

    if (hole.isPlayer) {
      // 触觉与震屏反馈
      if (lv >= 7) {
        this.playerCtrl.triggerScreenShake(0.9, 0.32);
        if (navigator.vibrate) navigator.vibrate(60);
      } else if (lv >= 5) {
        this.playerCtrl.triggerScreenShake(0.4, 0.18);
        if (navigator.vibrate) navigator.vibrate(35);
      } else {
        if (navigator.vibrate) navigator.vibrate(18);
      }

      if (lv <= 2) {
        this.audio.playSwallowSmall();
      } else if (lv <= 5) {
        this.audio.playSwallowMedium();
      } else {
        this.audio.playSwallowLarge();
      }

      const pColor = hole.currentSkinDef ? (hole.currentSkinDef.particleColor || hole.rimColor) : 0x00ffcc;
      this.particles.emitSwallowBurst(obj.position.x, 0.2, obj.position.z, pColor, lv <= 3 ? 6 : 14, 1.0);

      if (combo > 1) {
        this.audio.playCombo(combo);
        this.spawnFloatingScore(`+${addedScore} COMBO x${combo}!`, hole.x, hole.z, combo >= 5);
      }

      // 成就事件判定
      AchievementManager.onSwallow(this.player.swallowCount, this.player.combo, this.player.level);

      const curLvCfg = GameConfig.LEVELS[this.player.level - 1];
      if (this.player.addExp(0)) {
        this.audio.playLevelUp();
        this.playerCtrl.triggerScreenShake(0.65, 0.25);
        this.particles.emitLevelUpRing(this.player.x, this.player.z, this.player.radius, pColor);
        this.ui.showAlert('🌟 体型进化！', `晋升为 [${curLvCfg.name}]，已可吞噬更庞大物体！`, 'levelup');
      }
    } else {
      if (Math.random() > 0.6) {
        this.particles.emitSwallowBurst(obj.position.x, 0.2, obj.position.z, 0xf39c12, 4, 0.6);
      }
    }
  }

  onPlayerBlocked(obj) {
    this.playerCtrl.triggerScreenShake(0.2, 0.1);
  }

  spawnFloatingScore(text, wx, wz, isBig = false) {
    const v = new THREE.Vector3(wx, 1.2, wz);
    v.project(this.camera);

    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight;

    this.ui.showFloatingScore(text, x, y, isBig);
  }

  onMatchComplete() {
    this.isRunning = false;
    this.audio.playGameOver();

    DouyinPlatform.gameplayStop();
    DouyinPlatform.showMidgameAd();

    let rank = 1;
    if (this.mode === GameModes.BATTLE) {
      const allHoles = [this.player, ...this.aiCtrl.getAllHoles()];
      allHoles.sort((a, b) => b.score - a.score);
      rank = allHoles.findIndex(h => h === this.player) + 1;
    }

    const cleanPercent = Math.min(100, Math.floor((this.player.swallowCount / Math.max(1, this.consumables.objects.length)) * 100));

    const stats = {
      rank,
      score: this.player.score,
      maxRadius: this.maxRadiusReached,
      swallowed: this.player.swallowCount,
      kills: this.player.killCount,
      cleanPercent,
    };

    this.ui.showSettlement(stats, this.mode, () => this.startMatch(this.mode));
  }

  returnToHome() {
    this.isRunning = false;
    this.isPaused = false;
    this.player.reset(0, 14);
    this.consumables.resetAll();
    this.powerUpMgr.reset();
    this.aiCtrl.resetAll();
    this.particles.clear();
    this.renderer.render(this.scene, this.camera);
  }
}
