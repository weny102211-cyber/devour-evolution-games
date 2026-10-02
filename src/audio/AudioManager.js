// 纯原生 Web Audio API 音效与合成音乐管理器 (零外部文件依赖，保证极速启动与零报错)
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isMuted = false;
    this.bgmInterval = null;
    this.step = 0;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 吞噬小物体：轻快水泡泡弹射音
  playSwallowSmall() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = 300 + Math.random() * 80;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 吞噬中型物体（长椅、小树、路灯、小车）：沉稳下陷音
  playSwallowMedium() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.23);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // 吞噬大型物体（卡车、公交、建筑）：重低音轰鸣震撼
  playSwallowLarge() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // 低频震鸣
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);

    // 噪声质感
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.45);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // 连击提示音：根据连击数音调节节攀升
  playCombo(comboCount) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const semitones = Math.min(comboCount, 15);
    const baseFreq = 440 * Math.pow(2, semitones / 12);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 升级音效：清亮大调上行和弦
  playLevelUp() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // 击杀对手黑洞：激昂双重重击
  playKill() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const freqs = [180, 280, 480];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(f * 0.4, t + i * 0.05 + 0.3);

      gain.gain.setValueAtTime(0.5, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.38);
    });
  }

  // 玩家被吞噬：悲鸣滑音
  playSwallowed() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.6);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.7);
  }

  // 倒计时最后滴答音
  playCountdownTick() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // 结算终场音效
  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const chords = [
      [392.00, 493.88, 587.33], // G major
      [440.00, 554.37, 659.25], // A major
      [523.25, 659.25, 783.99, 1046.50] // C major finish
    ];

    chords.forEach((chord, step) => {
      const t = this.ctx.currentTime + step * 0.22;
      chord.forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (step === 2 ? 0.8 : 0.25));

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + (step === 2 ? 0.85 : 0.28));
      });
    });
  }

  // 拾取局内增益道具：清脆上升光环音
  playPowerUp() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.24, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.2);
    });
  }

  // 解锁成就提示音：宏伟三连音
  playAchievement() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const chords = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.3, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.4);
    });
  }

  // UI 点击音
  playClick() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // 音量调整
  setSoundVolume(val) {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(Math.max(0, Math.min(1, val * 0.5)), this.ctx.currentTime);
    }
  }

  // 轻快动感循环 BGM (合成和弦与贝斯步进，听感舒适不噪)
  startBGM() {
    if (this.bgmInterval || !this.ctx) return;
    this.ensureContext();

    const bassLine = [
      130.81, 130.81, 146.83, 164.81,
      174.61, 174.61, 164.81, 146.83,
      130.81, 130.81, 196.00, 164.81,
      174.61, 196.00, 220.00, 196.00
    ];

    const chordTones = [
      [261.63, 329.63, 392.00], // C
      [293.66, 349.23, 440.00], // Dm
      [349.23, 440.00, 523.25], // F
      [392.00, 493.88, 587.33]  // G
    ];

    this.step = 0;
    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      // 贝斯低音拍
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      const bFreq = bassLine[this.step % bassLine.length];
      bassOsc.frequency.setValueAtTime(bFreq, t);

      bassGain.gain.setValueAtTime(0.18, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      bassOsc.connect(bassGain);
      bassGain.connect(this.bgmGain);

      bassOsc.start(t);
      bassOsc.stop(t + 0.26);

      // 每 4 拍和弦垫音
      if (this.step % 4 === 0) {
        const chord = chordTones[(this.step / 4) % chordTones.length];
        chord.forEach(f => {
          const cOsc = this.ctx.createOscillator();
          const cGain = this.ctx.createGain();
          cOsc.type = 'sine';
          cOsc.frequency.setValueAtTime(f, t);

          cGain.gain.setValueAtTime(0.08, t);
          cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

          cOsc.connect(cGain);
          cGain.connect(this.bgmGain);

          cOsc.start(t);
          cOsc.stop(t + 0.9);
        });
      }

      this.step++;
    }, 240); // 125 BPM 左右
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}
