import { GameModes, GameConfig } from '../config.js';
import { StorageManager } from '../services/StorageManager.js';
import { AchievementManager } from '../services/AchievementManager.js';
import { DouyinPlatform } from '../platform/DouyinPlatform.js';

// 现代高完成度游戏 UI 管理器 (包含模式选择、皮肤衣橱、天赋研究所、成就殿堂、雷达小地图、暂停设置与战报结算)
export class UIManager {
  constructor() {
    this.startScreen = document.getElementById('start-screen');
    this.hud = document.getElementById('hud');
    this.timerEl = document.getElementById('match-timer');
    this.rankEl = document.getElementById('player-rank-badge');
    this.levelBadgeEl = document.getElementById('level-badge');
    this.levelNameEl = document.getElementById('level-name');
    this.expProgressEl = document.getElementById('exp-progress-bar');
    this.diameterEl = document.getElementById('hole-diameter');
    this.leaderboardEl = document.getElementById('leaderboard-list');
    this.hudRightTitle = document.getElementById('hud-right-title');
    this.comboContainerEl = document.getElementById('combo-container');
    this.alertBannerEl = document.getElementById('alert-banner');
    this.gameoverModal = document.getElementById('gameover-modal');

    // 新增模态框与组件
    this.skinsModal = document.getElementById('skins-modal');
    this.upgradesModal = document.getElementById('upgrades-modal');
    this.achievementsModal = document.getElementById('achievements-modal');
    this.sponsorModal = document.getElementById('sponsor-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;
    this.activeBuffsEl = document.getElementById('active-buffs');
    this.toastEl = document.getElementById('achievement-toast');

    this.currentMode = GameModes.BATTLE;
    this.alertTimeout = null;
    this.toastTimeout = null;
    this.isPaused = false;
  }

  // 初始化开始界面与所有局外功能模块
  initStartScreen(onStartCallback, onHomeCallback, onSkinChangedCallback, audioManager) {
    const cardBattle = document.getElementById('card-battle');
    const cardEndless = document.getElementById('card-endless');
    const btnStart = document.getElementById('btn-start-game');
    const menuBest = document.getElementById('menu-best-score');
    const menuCoins = document.getElementById('menu-coins');
    const btnHome = document.getElementById('btn-home');
    const btnBackMenu = document.getElementById('btn-back-menu');

    // 渲染资产与最高分
    const refreshMenuAssets = () => {
      if (menuBest) menuBest.textContent = StorageManager.getBestScore();
      if (menuCoins) menuCoins.textContent = StorageManager.getCoins();
    };
    refreshMenuAssets();

    // 模式切换
    if (cardBattle && cardEndless) {
      cardBattle.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.currentMode = GameModes.BATTLE;
        cardBattle.classList.add('selected');
        cardEndless.classList.remove('selected');
      };

      cardEndless.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.currentMode = GameModes.ENDLESS;
        cardEndless.classList.add('selected');
        cardBattle.classList.remove('selected');
      };
    }

    // 点击开始游戏
    if (btnStart) {
      btnStart.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.startScreen.style.display = 'none';
        this.hud.style.display = 'flex';
        this.applyModeHUD(this.currentMode);
        if (onStartCallback) onStartCallback(this.currentMode);
      };
    }

    // 返回主菜单
    const doHome = () => {
      if (audioManager) audioManager.playClick();
      this.gameoverModal.style.display = 'none';
      this.hud.style.display = 'none';
      if (this.pauseModal) this.pauseModal.style.display = 'none';
      this.startScreen.style.display = 'flex';
      this.isPaused = false;
      refreshMenuAssets();
      if (onHomeCallback) onHomeCallback();
    };

    if (btnHome) btnHome.onclick = doHome;
    if (btnBackMenu) btnBackMenu.onclick = doHome;

    // 皮肤衣橱弹窗交互
    const btnOpenSkins = document.getElementById('btn-open-skins');
    const btnCloseSkins = document.getElementById('btn-close-skins');
    if (btnOpenSkins) {
      btnOpenSkins.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.renderSkinsModal(onSkinChangedCallback, audioManager);
        this.skinsModal.style.display = 'flex';
      };
    }
    if (btnCloseSkins) {
      btnCloseSkins.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.skinsModal.style.display = 'none';
        refreshMenuAssets();
      };
    }

    // 天赋研究所弹窗交互
    const btnOpenUpgrades = document.getElementById('btn-open-upgrades');
    const btnCloseUpgrades = document.getElementById('btn-close-upgrades');
    if (btnOpenUpgrades) {
      btnOpenUpgrades.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.renderUpgradesModal(audioManager);
        this.upgradesModal.style.display = 'flex';
      };
    }
    if (btnCloseUpgrades) {
      btnCloseUpgrades.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.upgradesModal.style.display = 'none';
        refreshMenuAssets();
      };
    }

    // 成就荣耀弹窗交互
    const btnOpenAchievements = document.getElementById('btn-open-achievements');
    const btnCloseAchievements = document.getElementById('btn-close-achievements');
    if (btnOpenAchievements) {
      btnOpenAchievements.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.renderAchievementsModal();
        this.achievementsModal.style.display = 'flex';
      };
    }
    if (btnCloseAchievements) {
      btnCloseAchievements.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.achievementsModal.style.display = 'none';
        refreshMenuAssets();
      };
    }

    // 赞助作者与特权兑换弹窗绑定
    this.initSponsorModal(onSkinChangedCallback, audioManager, refreshMenuAssets);

    // 成就触发横幅绑定
    AchievementManager.setToastHandler((achDef) => {
      this.showAchievementToast(achDef, audioManager);
      refreshMenuAssets();
    });
  }

  // 初始化赞助与特权兑换系统
  initSponsorModal(onSkinChangedCallback, audioManager, refreshMenuAssets) {
    const btnOpenSponsor = document.getElementById('btn-open-sponsor');
    const btnCloseSponsor = document.getElementById('btn-close-sponsor');
    const tabVip = document.getElementById('tab-btn-vip');
    const tabDonate = document.getElementById('tab-btn-donate');
    const panelVip = document.getElementById('tab-panel-vip');
    const panelDonate = document.getElementById('tab-panel-donate');
    const btnSubmit = document.getElementById('btn-submit-redeem');
    const inputRedeem = document.getElementById('redeem-input');
    const msgRedeem = document.getElementById('redeem-msg');

    if (btnOpenSponsor) {
      btnOpenSponsor.onclick = () => {
        if (audioManager) audioManager.playClick();
        if (this.sponsorModal) this.sponsorModal.style.display = 'flex';
        if (msgRedeem) msgRedeem.textContent = '';
      };
    }

    if (btnCloseSponsor) {
      btnCloseSponsor.onclick = () => {
        if (audioManager) audioManager.playClick();
        if (this.sponsorModal) this.sponsorModal.style.display = 'none';
        if (refreshMenuAssets) refreshMenuAssets();
      };
    }

    if (tabVip && tabDonate) {
      tabVip.onclick = () => {
        if (audioManager) audioManager.playClick();
        tabVip.classList.add('active');
        tabDonate.classList.remove('active');
        if (panelVip) panelVip.style.display = 'block';
        if (panelDonate) panelDonate.style.display = 'none';
      };

      tabDonate.onclick = () => {
        if (audioManager) audioManager.playClick();
        tabDonate.classList.add('active');
        tabVip.classList.remove('active');
        if (panelDonate) panelDonate.style.display = 'block';
        if (panelVip) panelVip.style.display = 'none';
      };
    }

    if (btnSubmit && inputRedeem) {
      btnSubmit.onclick = () => {
        const code = inputRedeem.value.trim();
        const res = StorageManager.redeemCode(code);
        if (msgRedeem) {
          msgRedeem.textContent = res.message;
          msgRedeem.className = res.success ? 'redeem-msg success' : 'redeem-msg error';
        }
        if (res.success) {
          if (audioManager) audioManager.playAchievement();
          inputRedeem.value = '';
          if (refreshMenuAssets) refreshMenuAssets();
          const currentSkinId = StorageManager.getCurrentSkin();
          const skinDef = GameConfig.SKINS.find(s => s.id === currentSkinId);
          if (skinDef && onSkinChangedCallback) onSkinChangedCallback(skinDef);
        } else {
          if (audioManager) audioManager.playBlocked();
        }
      };

      inputRedeem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          btnSubmit.click();
        }
      });
    }
  }

  // 渲染皮肤商店弹窗
  renderSkinsModal(onSkinChangedCallback, audioManager) {
    const listEl = document.getElementById('skins-list');
    if (!listEl) return;
    const currentSkin = StorageManager.getCurrentSkin();
    let html = '';

    GameConfig.SKINS.forEach(skin => {
      const isUnlocked = StorageManager.isSkinUnlocked(skin.id);
      const isEquipped = currentSkin === skin.id;
      const hexColor = '#' + skin.rimColor.toString(16).padStart(6, '0');

      let btnClass = 'skin-action-btn ';
      let btnText = '';

      if (isEquipped) {
        btnClass += 'btn-equipped';
        btnText = '✓ 已装配';
      } else if (isUnlocked) {
        btnClass += 'btn-equip';
        btnText = '装配';
      } else {
        btnClass += 'btn-buy';
        btnText = `解锁 (${skin.price}🪙)`;
      }

      html += `
        <div class="skin-card ${isEquipped ? 'selected' : ''}" data-skin-id="${skin.id}">
          <div class="skin-circle" style="background: radial-gradient(circle, #05050f 40%, ${hexColor} 100%); border: 2px solid ${hexColor};">
            ${skin.icon}
          </div>
          <div class="skin-name">${skin.name}</div>
          <div class="skin-desc">${skin.desc}</div>
          <button class="${btnClass}" data-skin-id="${skin.id}">${btnText}</button>
        </div>
      `;
    });

    listEl.innerHTML = html;

    // 绑定点击事件
    listEl.querySelectorAll('.skin-action-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const skinId = btn.dataset.skinId;
        const skinDef = GameConfig.SKINS.find(s => s.id === skinId);
        if (!skinDef) return;

        if (StorageManager.isSkinUnlocked(skinId)) {
          StorageManager.setSkin(skinId);
          if (audioManager) audioManager.playClick();
          if (onSkinChangedCallback) onSkinChangedCallback(skinDef);
          this.renderSkinsModal(onSkinChangedCallback, audioManager);
        } else {
          if (StorageManager.unlockSkin(skinId, skinDef.price)) {
            if (audioManager) audioManager.playAchievement();
            if (onSkinChangedCallback) onSkinChangedCallback(skinDef);
            this.renderSkinsModal(onSkinChangedCallback, audioManager);
            const menuCoins = document.getElementById('menu-coins');
            if (menuCoins) menuCoins.textContent = StorageManager.getCoins();
          } else {
            alert('金币不足！快去游戏中吞噬物资赚取更多金币吧！');
          }
        }
      };
    });
  }

  // 渲染天赋研究所弹窗
  renderUpgradesModal(audioManager) {
    const listEl = document.getElementById('upgrades-list');
    if (!listEl) return;
    const playerCoins = StorageManager.getCoins();
    let html = '';

    Object.values(GameConfig.UPGRADES).forEach(upg => {
      const curLvl = StorageManager.getUpgradeLevel(upg.id);
      const isMax = curLvl >= upg.maxLevel;
      const cost = Math.round(upg.baseCost * Math.pow(upg.costMultiplier, curLvl));
      const canAfford = playerCoins >= cost && !isMax;

      let meterHtml = '';
      for (let i = 0; i < upg.maxLevel; i++) {
        meterHtml += `<div class="meter-block ${i < curLvl ? 'filled' : ''}"></div>`;
      }

      html += `
        <div class="upgrade-card">
          <div class="upgrade-icon">${upg.icon}</div>
          <div class="upgrade-info">
            <div class="upgrade-title-row">
              <span class="upgrade-name">${upg.name}</span>
              <span class="upgrade-level-tag">${isMax ? '已满级' : `Lv.${curLvl} / ${upg.maxLevel}`}</span>
            </div>
            <div class="upgrade-desc">${upg.desc} (+${Math.round(upg.boostPerLevel * 100)}% / 级)</div>
            <div class="upgrade-meter">${meterHtml}</div>
          </div>
          <button class="upgrade-btn" data-upg-id="${upg.id}" ${canAfford ? '' : 'disabled'}>
            ${isMax ? 'MAX' : `${cost} 🪙 升级`}
          </button>
        </div>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.upgrade-btn').forEach(btn => {
      btn.onclick = () => {
        const upgId = btn.dataset.upgId;
        const upg = GameConfig.UPGRADES[upgId];
        if (!upg) return;
        const curLvl = StorageManager.getUpgradeLevel(upg.id);
        const cost = Math.round(upg.baseCost * Math.pow(upg.costMultiplier, curLvl));

        if (StorageManager.upgradeLevel(upgId, cost)) {
          if (audioManager) audioManager.playPowerUp();
          this.renderUpgradesModal(audioManager);
          const menuCoins = document.getElementById('menu-coins');
          if (menuCoins) menuCoins.textContent = StorageManager.getCoins();
        }
      };
    });
  }

  // 渲染成就徽章弹窗
  renderAchievementsModal() {
    const listEl = document.getElementById('achievements-list');
    if (!listEl) return;
    const allAchs = AchievementManager.getAll();
    let html = '';

    allAchs.forEach(ach => {
      html += `
        <div class="ach-card ${ach.unlocked ? 'unlocked' : ''}">
          <div class="ach-icon-box">${ach.icon}</div>
          <div class="ach-info">
            <div class="ach-title">${ach.title} ${ach.unlocked ? '🏅' : '🔒'}</div>
            <div class="ach-desc">${ach.desc}</div>
          </div>
          <div class="ach-reward">+${ach.reward} 🪙</div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  // 弹出成就横幅
  showAchievementToast(achDef, audioManager) {
    if (!this.toastEl) return;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    document.getElementById('toast-icon').textContent = achDef.icon;
    document.getElementById('toast-title').textContent = `成就达成：${achDef.title}！`;
    document.getElementById('toast-sub').textContent = achDef.desc;
    document.getElementById('toast-reward').textContent = `+${achDef.reward} 🪙`;

    this.toastEl.style.display = 'flex';
    if (audioManager) audioManager.playAchievement();

    this.toastTimeout = setTimeout(() => {
      this.toastEl.style.display = 'none';
    }, 3600);
  }

  // 初始化暂停面板
  initPauseModal(onResumeCallback, onRestartCallback, onQuitCallback, audioManager) {
    const btnPause = document.getElementById('btn-pause');
    const btnResume = document.getElementById('btn-resume-game');
    const btnRestart = document.getElementById('btn-restart-game');
    const btnQuit = document.getElementById('btn-quit-game');
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const btnToggleMusic = document.getElementById('btn-toggle-music');

    if (btnPause) {
      btnPause.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.isPaused = true;
        this.pauseModal.style.display = 'flex';
      };
    }

    if (btnResume) {
      btnResume.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.isPaused = false;
        this.pauseModal.style.display = 'none';
        if (onResumeCallback) onResumeCallback();
      };
    }

    const btnPauseSponsor = document.getElementById('btn-pause-sponsor');
    if (btnPauseSponsor) {
      btnPauseSponsor.onclick = () => {
        if (audioManager) audioManager.playClick();
        if (this.sponsorModal) this.sponsorModal.style.display = 'flex';
      };
    }

    if (btnRestart) {
      btnRestart.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.isPaused = false;
        this.pauseModal.style.display = 'none';
        if (onRestartCallback) onRestartCallback();
      };
    }

    if (btnQuit) {
      btnQuit.onclick = () => {
        if (audioManager) audioManager.playClick();
        this.isPaused = false;
        this.pauseModal.style.display = 'none';
        this.hud.style.display = 'none';
        this.startScreen.style.display = 'flex';
        if (onQuitCallback) onQuitCallback();
      };
    }

    // 音效开关切换
    if (btnToggleSound && audioManager) {
      btnToggleSound.onclick = () => {
        const isMuted = audioManager.toggleMute();
        btnToggleSound.textContent = isMuted ? '静音' : '开启';
        btnToggleSound.className = `toggle-pill ${isMuted ? '' : 'active'}`;
      };
    }
  }

  // 依据当前模式定制 HUD 呈现
  applyModeHUD(mode) {
    this.currentMode = mode;
    if (mode === GameModes.ENDLESS) {
      this.rankEl.innerHTML = `<span class="rank-num" style="font-size:15px; color:#34c759;">纯净无尽</span>`;
      this.hudRightTitle.textContent = '全城吞噬进度';
      this.timerEl.classList.remove('urgent');
    } else {
      this.hudRightTitle.textContent = '实时对决榜';
    }
  }

  // 格式化时间为 mm:ss
  updateTimer(seconds, isEndless = false) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}`;
    this.timerEl.textContent = isEndless ? `⏱️ ${timeStr}` : timeStr;

    if (!isEndless && s <= 10) {
      this.timerEl.classList.add('urgent');
    } else {
      this.timerEl.classList.remove('urgent');
    }
  }

  // 更新玩家体型、等级与经验条
  updatePlayerGrowth(player, configLevels) {
    this.levelBadgeEl.textContent = `Lv.${player.level}`;
    const curCfg = configLevels[player.level - 1];
    const nextCfg = configLevels[player.level] || curCfg;
    this.levelNameEl.textContent = curCfg.name;

    const expRange = nextCfg.minExp - curCfg.minExp;
    const expInLevel = player.exp - curCfg.minExp;
    const pct = expRange > 0 ? Math.min(100, Math.floor((expInLevel / expRange) * 100)) : 100;
    this.expProgressEl.style.width = `${pct}%`;

    const diameter = (player.radius * 2).toFixed(1);
    this.diameterEl.textContent = `黑洞直径: ${diameter}m`;

    // 局内 Buff 状态胶囊展示
    if (this.activeBuffsEl && player.buffs) {
      let bHtml = '';
      if (player.buffs.speed > 0) {
        bHtml += `<div class="buff-pill" style="border-color:#00f0ff;">⚡ 极速冲刺 ${player.buffs.speed.toFixed(1)}s</div>`;
      }
      if (player.buffs.magnet > 0) {
        bHtml += `<div class="buff-pill" style="border-color:#ff007f;">🧲 超维强磁 ${player.buffs.magnet.toFixed(1)}s</div>`;
      }
      if (player.buffs.double_exp > 0) {
        bHtml += `<div class="buff-pill" style="border-color:#ffd700;">💎 双倍能量 ${player.buffs.double_exp.toFixed(1)}s</div>`;
      }
      this.activeBuffsEl.innerHTML = bHtml;
    }
  }

  // 绘制右上角微型雷达小地图
  updateRadar(player, aiHoles = [], powerUpItems = []) {
    if (!this.radarCtx) return;
    const ctx = this.radarCtx;
    const w = 84;
    const h = 84;
    const mapHalf = GameConfig.MAP_HALF;

    ctx.clearRect(0, 0, w, h);

    // 背景深色网格
    ctx.fillStyle = 'rgba(12, 16, 26, 0.85)';
    ctx.fillRect(0, 0, w, h);

    // 绘制十字主干道与环路路网
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);

    const ringOff = (85 / (mapHalf * 2)) * w;
    ctx.strokeRect(w / 2 - ringOff, h / 2 - ringOff, ringOff * 2, ringOff * 2);
    ctx.stroke();

    const toRadar = (x, z) => {
      const rx = ((x + mapHalf) / (mapHalf * 2)) * w;
      const ry = ((z + mapHalf) / (mapHalf * 2)) * h;
      return { x: rx, y: ry };
    };

    // 1. 道具位置点 (金黄色小菱形)
    ctx.fillStyle = '#ffd700';
    for (const item of powerUpItems) {
      const pt = toRadar(item.x, item.z);
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }

    // 2. AI 对手位置点
    for (const ai of aiHoles) {
      if (!ai.isAlive) continue;
      const pt = toRadar(ai.x, ai.z);
      const isBigger = ai.radius > player.radius;
      ctx.fillStyle = isBigger ? '#ff3b30' : '#af52de';
      const aiRad = Math.max(2.0, (ai.radius / (mapHalf * 2)) * w * 2.0);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, aiRad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 玩家自身点 (高亮霓虹青圆圈)
    if (player && player.isAlive) {
      const p = toRadar(player.x, player.z);
      ctx.fillStyle = '#00ffcc';
      const pRad = Math.max(2.5, (player.radius / (mapHalf * 2)) * w * 2.0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, pRad, 0, Math.PI * 2);
      ctx.fill();

      // 外围脉冲光圈
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pRad + 2.0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 实时排行榜更新 (对战模式)
  updateLeaderboard(allHoles, playerHole) {
    const sorted = [...allHoles].sort((a, b) => b.score - a.score);
    const playerIndex = sorted.findIndex(h => h === playerHole);
    const playerRank = playerIndex >= 0 ? playerIndex + 1 : 1;

    this.rankEl.innerHTML = `<span class="rank-num">#${playerRank}</span> / ${allHoles.length}`;

    let html = '';
    const topHoles = sorted.slice(0, 5);
    topHoles.forEach((h, idx) => {
      const isMe = h === playerHole;
      const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `${idx + 1}. `;
      html += `
        <div class="lb-row ${isMe ? 'lb-me' : ''}">
          <span class="lb-name">${medal}${h.name}</span>
          <span class="lb-score">${h.score}</span>
        </div>
      `;
    });
    this.leaderboardEl.innerHTML = html;
  }

  // 无尽模式统计更新 (展示全城清空率与已吞噬统计)
  updateEndlessStats(swallowedCount, totalCount, score) {
    const pct = Math.min(100, Math.floor((swallowedCount / Math.max(1, totalCount)) * 100));
    this.leaderboardEl.innerHTML = `
      <div class="lb-row" style="padding: 4px 0;">
        <span class="lb-name">清空进度:</span>
        <span class="lb-score" style="color:#00ffcc;">${pct}%</span>
      </div>
      <div class="lb-row" style="padding: 4px 0;">
        <span class="lb-name">吞噬统计:</span>
        <span class="lb-score">${swallowedCount} / ${totalCount}</span>
      </div>
      <div class="lb-row" style="padding: 4px 0;">
        <span class="lb-name">当前得分:</span>
        <span class="lb-score" style="color:#f1c40f;">${score}</span>
      </div>
    `;
  }

  // 飘浮连击与得分字体
  showFloatingScore(text, x, y, isBig = false) {
    const el = document.createElement('div');
    el.className = `floating-score ${isBig ? 'score-big' : ''}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    this.comboContainerEl.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 900);
  }

  // 中央警报提示栏 (升级、被吞、击杀)
  showAlert(title, subtitle, type = 'info') {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertBannerEl.className = `alert-banner show alert-${type}`;
    this.alertBannerEl.innerHTML = `
      <div class="alert-title">${title}</div>
      <div class="alert-sub">${subtitle}</div>
    `;

    this.alertTimeout = setTimeout(() => {
      this.alertBannerEl.className = 'alert-banner';
    }, 2200);
  }

  // 显示结算界面 (对战模式与无尽模式自适应，带金币奖赏与战报存储)
  showSettlement(stats, mode, onRestartCallback) {
    const isEndless = mode === GameModes.ENDLESS;
    const rankBox = document.getElementById('settle-rank-box');
    const killsBox = document.getElementById('settle-kills-box');

    // 结算金币计算公式
    const earnedCoins = Math.round(stats.score * 0.12) + (stats.kills * 60) + (stats.rank === 1 ? 120 : 0);
    StorageManager.addCoins(earnedCoins);
    StorageManager.updateBestScore(stats.score);
    StorageManager.recordMatch({
      swallowed: stats.swallowed,
      kills: stats.kills,
      combo: stats.combo || 0,
      diameter: stats.maxRadius * 2,
      rank: stats.rank,
    });

    // 触发局末成就判定
    AchievementManager.onMatchEnd(mode, stats.rank, stats.cleanPercent || 0);

    if (isEndless) {
      document.getElementById('settle-title').textContent = '🎉 城市吞噬成果结算';
      document.getElementById('settle-sub').textContent = '无尽模式 · 自由吞噬战报';
      if (rankBox) rankBox.style.display = 'none';
      if (killsBox) killsBox.style.display = 'none';
    } else {
      const isFirst = stats.rank === 1;
      document.getElementById('settle-title').textContent = isFirst ? '🏆 绝杀第一名 · 城市霸主' : `第 ${stats.rank} 名 · 激斗终局`;
      document.getElementById('settle-sub').textContent = '吞噬进化 · 城市竞技对决结果';
      if (rankBox) {
        rankBox.style.display = 'block';
        document.getElementById('settle-rank').textContent = `#${stats.rank}`;
      }
      if (killsBox) {
        killsBox.style.display = 'block';
        document.getElementById('settle-kills').textContent = stats.kills;
      }
    }

    document.getElementById('settle-score').textContent = stats.score;
    document.getElementById('settle-max-radius').textContent = `${(stats.maxRadius * 2).toFixed(1)}m`;
    document.getElementById('settle-swallowed').textContent = stats.swallowed;
    document.getElementById('settle-best').textContent = StorageManager.getBestScore();
    const settleCoinsEl = document.getElementById('settle-coins');
    if (settleCoinsEl) settleCoinsEl.textContent = `+${earnedCoins}`;

    this.gameoverModal.style.display = 'flex';

    // 抖音原生录屏发布与激励视频绑定
    const btnShare = document.getElementById('btn-douyin-share');
    if (btnShare) {
      btnShare.disabled = false;
      btnShare.textContent = '🎬 发布对局录屏至抖音 (领 3 倍金币)';
      btnShare.onclick = () => {
        DouyinPlatform.shareVideo(() => {
          const bonus = earnedCoins * 2;
          StorageManager.addCoins(bonus);
          if (settleCoinsEl) settleCoinsEl.textContent = `+${earnedCoins + bonus} (已翻3倍!)`;
          btnShare.disabled = true;
          btnShare.textContent = '✓ 已分享至抖音，3倍奖励已到账！';
        });
      };
    }

    const btnAd = document.getElementById('btn-douyin-ad');
    if (btnAd) {
      btnAd.disabled = false;
      btnAd.textContent = '📺 观看视频广告领 300 🪙';
      btnAd.onclick = () => {
        DouyinPlatform.showRewardedVideoAd('ad_settle_coins', () => {
          StorageManager.addCoins(300);
          btnAd.disabled = true;
          btnAd.textContent = '✓ 观看完毕，+300 🪙 已入账！';
        });
      };
    }

    const btnGameOverSponsor = document.getElementById('btn-gameover-sponsor');
    if (btnGameOverSponsor) {
      btnGameOverSponsor.onclick = () => {
        if (this.sponsorModal) this.sponsorModal.style.display = 'flex';
      };
    }

    const restartBtn = document.getElementById('btn-restart');
    restartBtn.onclick = () => {
      this.gameoverModal.style.display = 'none';
      if (onRestartCallback) onRestartCallback();
    };
  }
}
