import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';

// 抖音小游戏手游级虚拟摇杆控制器 (常驻发光底盘、全屏动态跟随、手势/鼠标/WASD无缝联动)
export class PlayerController {
  constructor(hole, camera, domElement) {
    this.hole = hole;
    this.camera = camera;
    this.domElement = domElement;

    this.inputDir = new THREE.Vector2(0, 0);
    this.currentVelocity = new THREE.Vector2(0, 0);
    this.maxJoystickRadius = 48;

    // 摇杆 DOM 元素
    this.joyBase = document.getElementById('joystick-base');
    this.joyKnob = document.getElementById('joystick-knob');

    // 交互状态
    this.isDragging = false;
    this.dragOrigin = new THREE.Vector2();
    this.dragCurrent = new THREE.Vector2();

    this.keys = { up: false, down: false, left: false, right: false };

    this.initEventListeners();
  }

  initEventListeners() {
    // 1. 键盘监听 (PC 调试与多模式操作)
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.up = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.down = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.up = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.down = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
      }
    });

    // 辅助检查是否点击在菜单/弹窗/按钮上
    const isInteractive = (target) => {
      if (!target || typeof target.closest !== 'function') return false;
      return !!target.closest('#start-screen, #pause-modal, #gameover-modal, #skins-modal, #upgrades-modal, #achievements-modal, #sponsor-modal, .overlay-modal, .interactive-btn, button, input, a');
    };

    // 2. 触屏交互 (手机端全屏拖拽 + 虚拟摇杆无缝同步)
    const onTouchStart = (e) => {
      if (!this.hole.isAlive) return;
      if (isInteractive(e.target)) return;
      const touch = e.touches[0];
      if (touch) this.handleDragStart(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e) => {
      if (!this.isDragging) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      if (touch) this.handleDragMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = () => {
      if (this.isDragging) this.handleDragEnd();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    // 3. 鼠标交互 (PC 端拖拽或点击推杆)
    const onMouseDown = (e) => {
      if (!this.hole.isAlive) return;
      if (isInteractive(e.target)) return;
      this.handleDragStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      this.handleDragMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      if (this.isDragging) this.handleDragEnd();
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  handleDragStart(clientX, clientY) {
    this.isDragging = true;
    this.dragOrigin.set(clientX, clientY);
    this.dragCurrent.set(clientX, clientY);

    if (this.joyBase) {
      this.joyBase.classList.add('active');
    }
  }

  handleDragMove(clientX, clientY) {
    this.dragCurrent.set(clientX, clientY);
    const delta = new THREE.Vector2().subVectors(this.dragCurrent, this.dragOrigin);
    const dist = delta.length();

    if (dist > 3) {
      const clamped = Math.min(dist, this.maxJoystickRadius);
      const norm = delta.clone().normalize();
      this.inputDir.copy(norm).multiplyScalar(clamped / this.maxJoystickRadius);

      // 更新虚拟摇杆中心操纵钮位置
      if (this.joyKnob) {
        const knobX = norm.x * clamped;
        const knobY = norm.y * clamped;
        this.joyKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
      }
    } else {
      this.inputDir.set(0, 0);
      if (this.joyKnob) {
        this.joyKnob.style.transform = 'translate(0px, 0px)';
      }
    }
  }

  handleDragEnd() {
    this.isDragging = false;
    this.inputDir.set(0, 0);

    if (this.joyBase) {
      this.joyBase.classList.remove('active');
    }
    if (this.joyKnob) {
      this.joyKnob.style.transform = 'translate(0px, 0px)';
    }
  }

  hasKeyboardInput() {
    return this.keys.up || this.keys.down || this.keys.left || this.keys.right;
  }

  update(delta) {
    if (!this.hole.isAlive) {
      this.inputDir.set(0, 0);
      return;
    }

    // 键盘输入优先响应，并让虚拟摇杆同步动画
    if (this.hasKeyboardInput()) {
      let kx = 0;
      let kz = 0;
      if (this.keys.left) kx -= 1;
      if (this.keys.right) kx += 1;
      if (this.keys.up) kz -= 1;
      if (this.keys.down) kz += 1;

      const len = Math.sqrt(kx * kx + kz * kz);
      if (len > 0) {
        this.inputDir.set(kx / len, kz / len);
        // 让摇杆操纵球随键盘偏移
        if (this.joyKnob) {
          this.joyKnob.style.transform = `translate(${this.inputDir.x * 35}px, ${this.inputDir.y * 35}px)`;
        }
      } else {
        this.inputDir.set(0, 0);
        if (this.joyKnob && !this.isDragging) {
          this.joyKnob.style.transform = 'translate(0px, 0px)';
        }
      }
    } else if (!this.isDragging) {
      this.inputDir.set(0, 0);
      if (this.joyKnob) {
        this.joyKnob.style.transform = 'translate(0px, 0px)';
      }
    }

    // 动态移动速度计算 (融入等级、局外天赋与局内极速 Buff)
    const curSpeed = this.hole.getEffectiveSpeed ? this.hole.getEffectiveSpeed() : Math.max(
      GameConfig.MIN_SPEED,
      GameConfig.BASE_SPEED - (this.hole.level - 1) * GameConfig.SPEED_DECAY_PER_LEVEL
    );

    // 平滑速度插值 (增加水流质感与灵敏响应)
    const targetVx = this.inputDir.x * curSpeed;
    const targetVz = this.inputDir.y * curSpeed;

    this.currentVelocity.x = THREE.MathUtils.lerp(this.currentVelocity.x, targetVx, delta * 15.0);
    this.currentVelocity.y = THREE.MathUtils.lerp(this.currentVelocity.y, targetVz, delta * 15.0);

    if (this.currentVelocity.lengthSq() > 0.001) {
      const moveX = this.currentVelocity.x * delta;
      const moveZ = this.currentVelocity.y * delta;
      this.hole.setPosition(this.hole.x + moveX, this.hole.z + moveZ);
    }

    // 相机智能自适应跟随追踪与屏幕震颤
    this.updateCameraFollow(delta);
  }

  // 震屏打击感反馈
  triggerScreenShake(intensity = 0.6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  updateCameraFollow(delta) {
    const C = GameConfig.CAMERA;
    const zoomFactor = 1.0 + (this.hole.radius - 1.0) * 0.45;

    const targetCamX = this.hole.x;
    const targetCamY = C.OFFSET_Y * zoomFactor;
    const targetCamZ = this.hole.z + C.OFFSET_Z * zoomFactor;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, C.FOLLOW_LERP);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, C.FOLLOW_LERP);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, C.FOLLOW_LERP);

    // 震屏偏移叠加
    if (this.shakeDuration > 0) {
      this.shakeDuration -= delta;
      const progress = this.shakeDuration;
      const curIntensity = this.shakeIntensity * (progress > 0 ? progress : 0);
      this.camera.position.x += (Math.random() - 0.5) * curIntensity;
      this.camera.position.z += (Math.random() - 0.5) * curIntensity;
    }

    this.camera.lookAt(this.hole.x, 0, this.hole.z + C.LOOK_OFFSET_Z);
  }
}
