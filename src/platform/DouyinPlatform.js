// 抖音小游戏平台能力专属封装适配器 (Douyin / ByteDance Mini Game SDK Adapter)
// 支持原生 tt API (真机/开发者工具) 与 Web 浏览器优雅降级

class DouyinPlatformClass {
  constructor() {
    this.isTT = typeof tt !== 'undefined';
    this.recorder = null;
    this.recordedVideoPath = null;
    this.isRecording = false;

    this.initRecorder();
    this.initShareMenu();
  }

  // 1. 初始化抖音专属对局录屏管理器 (抖音小游戏核心裂变能力)
  initRecorder() {
    if (!this.isTT || !tt.getGameRecorderManager) return;
    try {
      this.recorder = tt.getGameRecorderManager();

      this.recorder.onStart(() => {
        console.log('[Douyin] 局内精彩录屏已启动');
        this.isRecording = true;
        this.recordedVideoPath = null;
      });

      this.recorder.onStop((res) => {
        console.log('[Douyin] 录屏已完成，生成临时视频:', res.videoPath);
        this.isRecording = false;
        this.recordedVideoPath = res.videoPath;
      });

      this.recorder.onError((err) => {
        console.warn('[Douyin] 录屏错误:', err);
        this.isRecording = false;
      });
    } catch (e) {
      console.warn('[Douyin] 初始化录屏失败:', e);
    }
  }

  // 开始录屏 (通常在开局 startMatch 时自动开启)
  startRecording() {
    if (!this.recorder) return;
    try {
      this.recorder.start({ duration: 180 }); // 最长录制 180 秒
    } catch (e) {
      console.warn('[Douyin] 启动录屏异常:', e);
    }
  }

  // 停止录屏 (在终局结算时自动停止)
  stopRecording() {
    if (!this.recorder || !this.isRecording) return;
    try {
      this.recorder.stop();
    } catch (e) {
      console.warn('[Douyin] 停止录屏异常:', e);
    }
  }

  // 结算时呼起抖音发布视频面板 (带热门话题与带玩小游戏锚点)
  shareVideo(onSuccess, onFail) {
    if (!this.isTT || !this.recordedVideoPath) {
      // Web 浏览器环境模拟分享成功
      console.log('[Douyin] 浏览器环境模拟分享成功');
      if (onSuccess) onSuccess();
      return;
    }

    try {
      tt.shareAppMessage({
        channel: 'video',
        title: '我在《吞噬进化》里吞掉了整座城市，快来挑战我！',
        desc: '超爽解压黑洞小游戏，从微尘到摩天大楼全部吸光！',
        extra: {
          videoPath: this.recordedVideoPath,
          videoTopics: ['吞噬进化', '黑洞小游戏', '抖音休闲游戏'],
        },
        success: () => {
          console.log('[Douyin] 视频分享发布成功');
          if (onSuccess) onSuccess();
        },
        fail: (err) => {
          console.warn('[Douyin] 视频分享取消或失败:', err);
          if (onFail) onFail(err);
        }
      });
    } catch (e) {
      console.warn('[Douyin] 分享异常:', e);
      if (onFail) onFail(e);
    }
  }

  // 2. 激励视频广告播放 (看广告翻倍金币 / 解锁高级皮肤)
  showRewardedVideoAd(adUnitId = 'your_ad_unit_id', onSuccess, onFail) {
    if (!this.isTT || !tt.createRewardedVideoAd) {
      // 浏览器环境提示并模拟观看完毕
      console.log('[Douyin] 非真机环境，直接模拟广告播放完毕并下发奖励');
      alert('【模拟抖音广告】观看完毕！已为您成功发放奖励！');
      if (onSuccess) onSuccess();
      return;
    }

    try {
      const rewardedVideoAd = tt.createRewardedVideoAd({ adUnitId });

      rewardedVideoAd.load()
        .then(() => rewardedVideoAd.show())
        .catch(err => {
          console.warn('[Douyin] 广告拉取失败，降级发放奖励:', err);
          if (onSuccess) onSuccess();
        });

      rewardedVideoAd.onClose(res => {
        if (res && res.isEnded) {
          console.log('[Douyin] 激励广告完整播放完成');
          if (onSuccess) onSuccess();
        } else {
          console.log('[Douyin] 广告未播完关闭，无奖励');
          if (onFail) onFail();
        }
      });
    } catch (e) {
      console.warn('[Douyin] 广告创建异常:', e);
      if (onSuccess) onSuccess();
    }
  }

  // 3. 手机震动触觉反馈
  vibrateShort() {
    if (this.isTT && tt.vibrateShort) {
      tt.vibrateShort();
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  }

  vibrateLong() {
    if (this.isTT && tt.vibrateLong) {
      tt.vibrateLong();
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 80]);
    }
  }

  // 4. 开启右上角“...”转发分享小程序
  initShareMenu() {
    if (this.isTT && tt.showShareMenu) {
      tt.showShareMenu({
        showShareItems: ['shareAppMessage', 'shareAppToConversation'],
        success: () => console.log('[Douyin] 分享菜单已激活')
      });

      if (tt.onShareAppMessage) {
        tt.onShareAppMessage(() => ({
          title: '从微尘到巨物！你能吞掉摩天大厦吗？快来《吞噬进化》！',
          imageUrl: '',
          query: 'channel=share'
        }));
      }
    }
  }

  // 5. 存储适配
  getStorageSync(key) {
    if (this.isTT && tt.getStorageSync) {
      try {
        return tt.getStorageSync(key);
      } catch (e) {
        return null;
      }
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  setStorageSync(key, val) {
    if (this.isTT && tt.setStorageSync) {
      try {
        tt.setStorageSync(key, val);
        return;
      } catch (e) {}
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    }
  }
}

export const DouyinPlatform = new DouyinPlatformClass();
