import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';

// 精美 Low-Poly 原创 3D 模型生成工厂
export class ModelFactory {
  constructor() {
    this.cache = new Map();
    this.initSharedMaterials();
  }

  initSharedMaterials() {
    // 共享基础材质，降低 DrawCall 并保证统一美术色调
    const P = GameConfig.PALETTE;
    const applyGroundStencil = (mat) => {
      mat.stencilWrite = true;
      mat.stencilRef = 1;
      mat.stencilFunc = THREE.NotEqualStencilFunc;
      mat.stencilFail = THREE.KeepStencilOp;
      mat.stencilZFail = THREE.KeepStencilOp;
      mat.stencilZPass = THREE.KeepStencilOp;
      return mat;
    };

    this.materials = {
      asphalt: applyGroundStencil(new THREE.MeshLambertMaterial({ color: P.roadAsphalt })),
      curb: applyGroundStencil(new THREE.MeshLambertMaterial({ color: P.curb })),
      sidewalk: applyGroundStencil(new THREE.MeshLambertMaterial({ color: P.sidewalk })),
      markingYellow: applyGroundStencil(new THREE.MeshLambertMaterial({ color: P.roadMarkingYellow })),
      markingWhite: applyGroundStencil(new THREE.MeshLambertMaterial({ color: P.roadMarkingWhite })),
      grass: applyGroundStencil(new THREE.MeshLambertMaterial({ color: P.groundGrass })),
      woodTrunk: new THREE.MeshLambertMaterial({ color: P.treeTrunk }),
      leavesDark: new THREE.MeshLambertMaterial({ color: P.treeLeaves[0], flatShading: true }),
      leavesMid: new THREE.MeshLambertMaterial({ color: P.treeLeaves[1], flatShading: true }),
      leavesBright: new THREE.MeshLambertMaterial({ color: P.treeLeaves[3], flatShading: true }),
      metalDark: new THREE.MeshLambertMaterial({ color: 0x2c3e50 }),
      metalSilver: new THREE.MeshLambertMaterial({ color: 0xbdc3c7 }),
      glass: new THREE.MeshLambertMaterial({ color: 0x85c1e9, transparent: true, opacity: 0.85 }),
      tire: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
      wheelRim: new THREE.MeshLambertMaterial({ color: 0xecf0f1 }),
      water: new THREE.MeshLambertMaterial({ color: 0x3498db, transparent: true, opacity: 0.8 }),
      gold: new THREE.MeshLambertMaterial({ color: 0xf39c12 }),
    };
  }

  // 获取带颜色的新材质或克隆
  getColoredMat(color, flatShading = true) {
    return new THREE.MeshLambertMaterial({ color, flatShading });
  }

  // ==========================================
  // 等级 1 物体：易拉罐、快递盒、交通锥、垃圾袋
  // ==========================================

  createSodaCan() {
    const group = new THREE.Group();
    const canColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12];
    const color = canColors[Math.floor(Math.random() * canColors.length)];

    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.32, 10);
    const bodyMat = this.getColoredMat(color);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.16;
    group.add(body);

    const rimGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.04, 10);
    const rim = new THREE.Mesh(rimGeo, this.materials.metalSilver);
    rim.position.y = 0.32;
    group.add(rim);

    group.userData = { radius: 0.22, height: 0.34, level: 1, score: 12, name: '饮料罐' };
    return group;
  }

  createCardboardBox() {
    const group = new THREE.Group();
    const w = 0.35 + Math.random() * 0.15;
    const h = 0.3 + Math.random() * 0.1;
    const d = 0.35 + Math.random() * 0.15;

    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const boxMat = this.getColoredMat(0xd4ac0d); // 牛皮纸黄色
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = h / 2;
    group.add(box);

    // 胶带纹理条
    const tapeGeo = new THREE.BoxGeometry(w * 0.3, h + 0.01, d + 0.01);
    const tapeMat = this.getColoredMat(0xb7950b);
    const tape = new THREE.Mesh(tapeGeo, tapeMat);
    tape.position.y = h / 2;
    group.add(tape);

    group.userData = { radius: 0.32, height: h, level: 1, score: 15, name: '快递纸箱' };
    return group;
  }

  createTrafficCone() {
    const group = new THREE.Group();
    // 黑色底座
    const baseGeo = new THREE.BoxGeometry(0.42, 0.06, 0.42);
    const base = new THREE.Mesh(baseGeo, this.materials.metalDark);
    base.position.y = 0.03;
    group.add(base);

    // 橙色锥体
    const coneGeo = new THREE.ConeGeometry(0.18, 0.55, 10);
    const coneMat = this.getColoredMat(0xff6600);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.06 + 0.55 / 2;
    group.add(cone);

    // 反光白色条纹
    const ringGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.12, 10);
    const ring = new THREE.Mesh(ringGeo, this.materials.markingWhite);
    ring.position.y = 0.28;
    group.add(ring);

    group.userData = { radius: 0.3, height: 0.6, level: 1, score: 18, name: '路障锥' };
    return group;
  }

  // ==========================================
  // 等级 2 物体：垃圾桶、消防栓、花盆、邮筒
  // ==========================================

  createTrashCan() {
    const group = new THREE.Group();
    const canColor = Math.random() > 0.5 ? 0x27ae60 : 0x2980b9;
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.75, 10);
    const body = new THREE.Mesh(bodyGeo, this.getColoredMat(canColor));
    body.position.y = 0.38;
    group.add(body);

    const lidGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 10);
    const lid = new THREE.Mesh(lidGeo, this.materials.metalDark);
    lid.position.y = 0.8;
    group.add(lid);

    group.userData = { radius: 0.48, height: 0.85, level: 2, score: 35, name: '市政垃圾桶' };
    return group;
  }

  createFireHydrant() {
    const group = new THREE.Group();
    // 红色主体
    const redMat = this.getColoredMat(0xc0392b);
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.6, 10);
    const body = new THREE.Mesh(bodyGeo, redMat);
    body.position.y = 0.3;
    group.add(body);

    // 顶部半球/帽子
    const capGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.18, 10);
    const cap = new THREE.Mesh(capGeo, redMat);
    cap.position.y = 0.68;
    group.add(cap);

    // 左右出水口
    const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.52, 8);
    const nozzle = new THREE.Mesh(nozzleGeo, this.materials.metalSilver);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.y = 0.4;
    group.add(nozzle);

    group.userData = { radius: 0.42, height: 0.78, level: 2, score: 40, name: '消防栓' };
    return group;
  }

  createFlowerPlanter() {
    const group = new THREE.Group();
    // 陶土方形花槽
    const potGeo = new THREE.BoxGeometry(0.7, 0.4, 0.7);
    const pot = new THREE.Mesh(potGeo, this.getColoredMat(0xb9770e));
    pot.position.y = 0.2;
    group.add(pot);

    // 绿植簇
    const bushGeo = new THREE.DodecahedronGeometry(0.35, 1);
    const bush = new THREE.Mesh(bushGeo, this.materials.leavesBright);
    bush.position.y = 0.48;
    group.add(bush);

    // 小花点缀
    const flowerColors = [0xe91e63, 0xf1c40f, 0x9b59b6];
    for (let i = 0; i < 3; i++) {
      const flGeo = new THREE.SphereGeometry(0.07, 4, 4);
      const fl = new THREE.Mesh(flGeo, this.getColoredMat(flowerColors[i]));
      const angle = (i / 3) * Math.PI * 2;
      fl.position.set(Math.cos(angle) * 0.22, 0.55 + Math.random() * 0.08, Math.sin(angle) * 0.22);
      group.add(fl);
    }

    group.userData = { radius: 0.55, height: 0.75, level: 2, score: 45, name: '街心花坛' };
    return group;
  }

  createMailbox() {
    const group = new THREE.Group();
    const standGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8);
    const stand = new THREE.Mesh(standGeo, this.materials.metalDark);
    stand.position.y = 0.32;
    group.add(stand);

    const boxGeo = new THREE.BoxGeometry(0.42, 0.35, 0.55);
    const box = new THREE.Mesh(boxGeo, this.getColoredMat(0x1e88e5));
    box.position.y = 0.72;
    group.add(box);

    group.userData = { radius: 0.5, height: 0.9, level: 2, score: 40, name: '邮筒' };
    return group;
  }

  // ==========================================
  // 等级 3 物体：公园长椅、路灯、小树、自动售货机
  // ==========================================

  createParkBench() {
    const group = new THREE.Group();
    const woodMat = this.getColoredMat(0x8d6e63);

    // 木条座面
    const seatGeo = new THREE.BoxGeometry(1.4, 0.08, 0.5);
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.y = 0.42;
    group.add(seat);

    // 木条靠背
    const backGeo = new THREE.BoxGeometry(1.4, 0.35, 0.06);
    const back = new THREE.Mesh(backGeo, woodMat);
    back.position.set(0, 0.68, -0.22);
    group.add(back);

    // 铁艺支架腿
    const legGeo = new THREE.BoxGeometry(0.08, 0.42, 0.46);
    const legL = new THREE.Mesh(legGeo, this.materials.metalDark);
    legL.position.set(-0.55, 0.21, 0);
    const legR = legL.clone();
    legR.position.x = 0.55;
    group.add(legL, legR);

    group.userData = { radius: 0.85, height: 0.9, level: 3, score: 70, name: '公园长椅' };
    return group;
  }

  createStreetLamp() {
    const group = new THREE.Group();
    // 灯杆
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8);
    const pole = new THREE.Mesh(poleGeo, this.materials.metalDark);
    pole.position.y = 1.6;
    group.add(pole);

    // 顶端弯臂
    const armGeo = new THREE.BoxGeometry(0.65, 0.08, 0.08);
    const arm = new THREE.Mesh(armGeo, this.materials.metalDark);
    arm.position.set(0.28, 3.15, 0);
    group.add(arm);

    // 发光灯头
    const lampGeo = new THREE.ConeGeometry(0.2, 0.16, 6);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.rotation.x = Math.PI;
    lamp.position.set(0.55, 3.05, 0);
    group.add(lamp);

    group.userData = { radius: 0.9, height: 3.3, level: 3, score: 80, name: '街道路灯' };
    return group;
  }

  createSmallTree() {
    const group = new THREE.Group();
    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 1.4, 6);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.woodTrunk);
    trunk.position.y = 0.7;
    group.add(trunk);

    // 树冠 (多面体几何)
    const crownGeo = new THREE.IcosahedronGeometry(0.9, 1);
    const crown = new THREE.Mesh(crownGeo, this.materials.leavesMid);
    crown.position.y = 1.85;
    crown.scale.set(1.0, 1.25, 1.0);
    group.add(crown);

    group.userData = { radius: 0.95, height: 2.7, level: 3, score: 90, name: '绿化景观树' };
    return group;
  }

  createVendingMachine() {
    const group = new THREE.Group();
    // 主机身
    const bodyGeo = new THREE.BoxGeometry(0.85, 1.6, 0.75);
    const bodyMat = this.getColoredMat(Math.random() > 0.5 ? 0xe74c3c : 0x2980b9);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    group.add(body);

    // 玻璃展示柜
    const glassGeo = new THREE.BoxGeometry(0.72, 0.85, 0.05);
    const glass = new THREE.Mesh(glassGeo, this.materials.glass);
    glass.position.set(0, 0.95, 0.38);
    group.add(glass);

    // 取货口
    const slotGeo = new THREE.BoxGeometry(0.65, 0.28, 0.05);
    const slot = new THREE.Mesh(slotGeo, this.materials.metalDark);
    slot.position.set(0, 0.28, 0.38);
    group.add(slot);

    group.userData = { radius: 0.95, height: 1.65, level: 3, score: 95, name: '自动售货机' };
    return group;
  }

  // ==========================================
  // 等级 4 物体：摩托车、热狗摊、中型树木、报亭
  // ==========================================

  createMotorcycle() {
    const group = new THREE.Group();
    // 车身框架
    const frameGeo = new THREE.BoxGeometry(1.3, 0.45, 0.35);
    const frame = new THREE.Mesh(frameGeo, this.getColoredMat(0xe74c3c));
    frame.position.y = 0.55;
    group.add(frame);

    // 座垫
    const seatGeo = new THREE.BoxGeometry(0.65, 0.12, 0.32);
    const seat = new THREE.Mesh(seatGeo, this.materials.tire);
    seat.position.set(-0.15, 0.8, 0);
    group.add(seat);

    // 车轮
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelF = new THREE.Mesh(wheelGeo, this.materials.tire);
    wheelF.position.set(0.6, 0.28, 0);
    const wheelR = new THREE.Mesh(wheelGeo, this.materials.tire);
    wheelR.position.set(-0.6, 0.28, 0);
    group.add(wheelF, wheelR);

    // 车头手把
    const barGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
    barGeo.rotateX(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, this.materials.metalSilver);
    bar.position.set(0.48, 0.95, 0);
    group.add(bar);

    group.userData = { radius: 1.25, height: 1.05, level: 4, score: 140, name: '摩托车' };
    return group;
  }

  createHotDogCart() {
    const group = new THREE.Group();
    // 餐车底柜
    const cartGeo = new THREE.BoxGeometry(1.2, 0.75, 0.8);
    const cart = new THREE.Mesh(cartGeo, this.materials.metalSilver);
    cart.position.y = 0.58;
    group.add(cart);

    // 车轮
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const w1 = new THREE.Mesh(wheelGeo, this.materials.tire);
    w1.position.set(0.4, 0.22, 0.42);
    const w2 = w1.clone();
    w2.position.z = -0.42;
    group.add(w1, w2);

    // 遮阳伞
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8);
    const pole = new THREE.Mesh(poleGeo, this.materials.metalSilver);
    pole.position.set(0.2, 1.45, 0);
    group.add(pole);

    const umbrellaGeo = new THREE.ConeGeometry(0.85, 0.45, 8);
    const umbrella = new THREE.Mesh(umbrellaGeo, this.getColoredMat(0xf39c12));
    umbrella.position.set(0.2, 2.15, 0);
    group.add(umbrella);

    group.userData = { radius: 1.35, height: 2.3, level: 4, score: 160, name: '热狗餐车' };
    return group;
  }

  createMediumTree() {
    const group = new THREE.Group();
    // 粗壮树干
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.0, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.woodTrunk);
    trunk.position.y = 1.0;
    group.add(trunk);

    // 组合树冠 (3个相融球体)
    const crownMat = this.materials.leavesBright;
    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), crownMat);
    c1.position.set(0, 2.6, 0);
    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), this.materials.leavesMid);
    c2.position.set(0.5, 2.2, 0.3);
    const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), this.materials.leavesDark);
    c3.position.set(-0.4, 2.3, -0.3);
    group.add(c1, c2, c3);

    group.userData = { radius: 1.45, height: 3.5, level: 4, score: 180, name: '茂密绿荫树' };
    return group;
  }

  // ==========================================
  // 等级 5 物体：轿车、出租车、SUV
  // ==========================================

  createCar(type = 'sedan') {
    const group = new THREE.Group();
    const P = GameConfig.PALETTE;
    let bodyColor = P.carColors[Math.floor(Math.random() * P.carColors.length)];
    if (type === 'taxi') bodyColor = 0xf1c40f; // 明黄出租车

    const carMat = this.getColoredMat(bodyColor);

    // 底盘 & 车身下部
    const baseGeo = new THREE.BoxGeometry(2.8, 0.55, 1.4);
    const base = new THREE.Mesh(baseGeo, carMat);
    base.position.y = 0.48;
    group.add(base);

    // 驾驶舱上部
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.55, 1.25);
    const cabin = new THREE.Mesh(cabinGeo, carMat);
    cabin.position.set(-0.15, 0.98, 0);
    group.add(cabin);

    // 车窗玻璃
    const glassGeo = new THREE.BoxGeometry(1.45, 0.42, 1.28);
    const glass = new THREE.Mesh(glassGeo, this.materials.glass);
    glass.position.set(-0.15, 0.98, 0);
    group.add(glass);

    // 车灯
    const headLightGeo = new THREE.BoxGeometry(0.08, 0.15, 0.3);
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlL = new THREE.Mesh(headLightGeo, headLightMat);
    hlL.position.set(1.38, 0.52, 0.45);
    const hlR = hlL.clone();
    hlR.position.z = -0.45;

    const tailLightGeo = new THREE.BoxGeometry(0.08, 0.15, 0.3);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const tlL = new THREE.Mesh(tailLightGeo, tailLightMat);
    tlL.position.set(-1.38, 0.52, 0.45);
    const tlR = tlL.clone();
    tlR.position.z = -0.45;
    group.add(hlL, hlR, tlL, tlR);

    // 4个车轮
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelPositions = [
      [0.85, 0.32, 0.72],
      [0.85, 0.32, -0.72],
      [-0.85, 0.32, 0.72],
      [-0.85, 0.32, -0.72]
    ];
    wheelPositions.forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, this.materials.tire);
      w.position.set(pos[0], pos[1], pos[2]);
      group.add(w);
    });

    if (type === 'taxi') {
      // 出租车顶灯
      const taxiSignGeo = new THREE.BoxGeometry(0.4, 0.18, 0.2);
      const taxiSignMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sign = new THREE.Mesh(taxiSignGeo, taxiSignMat);
      sign.position.set(-0.15, 1.34, 0);
      group.add(sign);
    }

    group.userData = { radius: 1.85, height: 1.35, level: 5, score: 260, name: type === 'taxi' ? '出租车' : '家用小轿车' };
    return group;
  }

  // ==========================================
  // 等级 6 物体：箱式货车、大型古松树
  // ==========================================

  createBoxTruck() {
    const group = new THREE.Group();
    // 车头驾驶室
    const cabGeo = new THREE.BoxGeometry(1.2, 1.3, 1.6);
    const cabMat = this.getColoredMat(0xe74c3c);
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(1.4, 0.95, 0);
    group.add(cab);

    // 货箱
    const boxGeo = new THREE.BoxGeometry(2.6, 1.7, 1.7);
    const boxMat = this.getColoredMat(0xecf0f1);
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(-0.45, 1.25, 0);
    group.add(box);

    // 车轮 (6轮)
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    wheelGeo.rotateX(Math.PI / 2);
    const wPositions = [
      [1.4, 0.38, 0.85],
      [1.4, 0.38, -0.85],
      [-0.1, 0.38, 0.88],
      [-0.1, 0.38, -0.88],
      [-1.1, 0.38, 0.88],
      [-1.1, 0.38, -0.88]
    ];
    wPositions.forEach(p => {
      const w = new THREE.Mesh(wheelGeo, this.materials.tire);
      w.position.set(p[0], p[1], p[2]);
      group.add(w);
    });

    group.userData = { radius: 2.4, height: 2.2, level: 6, score: 480, name: '箱式货车' };
    return group;
  }

  createPineTree() {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.5, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.woodTrunk);
    trunk.position.y = 1.25;
    group.add(trunk);

    // 3层松针锥体
    const levels = [
      { r: 2.0, h: 1.8, y: 2.4 },
      { r: 1.6, h: 1.6, y: 3.4 },
      { r: 1.1, h: 1.4, y: 4.3 }
    ];
    levels.forEach(lv => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(lv.r, lv.h, 8), this.materials.leavesDark);
      cone.position.y = lv.y;
      group.add(cone);
    });

    group.userData = { radius: 2.3, height: 5.2, level: 6, score: 500, name: '参天松树' };
    return group;
  }

  // ==========================================
  // 等级 7 物体：城市大公交车、中心喷泉
  // ==========================================

  createCityBus() {
    const group = new THREE.Group();
    const busMat = this.getColoredMat(0x3498db); // 活力海蓝色公交

    // 公交车身
    const bodyGeo = new THREE.BoxGeometry(5.8, 2.0, 1.9);
    const body = new THREE.Mesh(bodyGeo, busMat);
    body.position.y = 1.35;
    group.add(body);

    // 大视窗玻璃环
    const windowGeo = new THREE.BoxGeometry(5.5, 0.75, 1.95);
    const win = new THREE.Mesh(windowGeo, this.materials.glass);
    win.position.y = 1.65;
    group.add(win);

    // 前顶路线看板
    const signGeo = new THREE.BoxGeometry(0.1, 0.28, 1.2);
    const sign = new THREE.Mesh(signGeo, new THREE.MeshBasicMaterial({ color: 0xf1c40f }));
    sign.position.set(2.88, 2.05, 0);
    group.add(sign);

    // 车轮
    const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 14);
    wheelGeo.rotateX(Math.PI / 2);
    const wPositions = [
      [2.0, 0.44, 1.0],
      [2.0, 0.44, -1.0],
      [-1.8, 0.44, 1.0],
      [-1.8, 0.44, -1.0]
    ];
    wPositions.forEach(p => {
      const w = new THREE.Mesh(wheelGeo, this.materials.tire);
      w.position.set(p[0], p[1], p[2]);
      group.add(w);
    });

    group.userData = { radius: 3.3, height: 2.5, level: 7, score: 850, name: '城市公交客车' };
    return group;
  }

  createCentralFountain() {
    const group = new THREE.Group();
    // 大水池基座
    const baseGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.6, 16);
    const base = new THREE.Mesh(baseGeo, this.materials.curb);
    base.position.y = 0.3;
    group.add(base);

    // 水面
    const waterGeo = new THREE.CylinderGeometry(3.0, 3.0, 0.1, 16);
    const water = new THREE.Mesh(waterGeo, this.materials.water);
    water.position.y = 0.58;
    group.add(water);

    // 中间立柱
    const pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.8, 10);
    const pillar = new THREE.Mesh(pillarGeo, this.materials.curb);
    pillar.position.y = 1.4;
    group.add(pillar);

    // 上层小水盘
    const tierGeo = new THREE.CylinderGeometry(1.4, 1.2, 0.3, 12);
    const tier = new THREE.Mesh(tierGeo, this.materials.curb);
    tier.position.y = 2.2;
    group.add(tier);

    // 喷水雕塑
    const jetGeo = new THREE.ConeGeometry(0.2, 0.9, 8);
    const jet = new THREE.Mesh(jetGeo, this.materials.water);
    jet.position.y = 2.75;
    group.add(jet);

    group.userData = { radius: 3.5, height: 3.2, level: 7, score: 1100, name: '中心大喷泉' };
    return group;
  }

  // ==========================================
  // 等级 8 物体：独栋别墅、街区便利店、快餐餐厅
  // ==========================================

  createSuburbanHouse() {
    const group = new THREE.Group();
    const P = GameConfig.PALETTE;
    const roofColor = P.roofs[Math.floor(Math.random() * P.roofs.length)];
    const wallColor = P.walls[Math.floor(Math.random() * P.walls.length)];

    // 房屋墙体
    const wallGeo = new THREE.BoxGeometry(5.2, 3.2, 4.4);
    const wall = new THREE.Mesh(wallGeo, this.getColoredMat(wallColor));
    wall.position.y = 1.6;
    group.add(wall);

    // 坡面屋顶 (三棱柱)
    const roofGeo = new THREE.ConeGeometry(3.8, 2.0, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.getColoredMat(roofColor));
    roof.position.y = 4.1;
    roof.scale.set(1.2, 1.0, 1.0);
    group.add(roof);

    // 砖砌烟囱
    const chimneyGeo = new THREE.BoxGeometry(0.6, 1.4, 0.6);
    const chimney = new THREE.Mesh(chimneyGeo, this.getColoredMat(0xa93226));
    chimney.position.set(1.4, 4.4, 0.8);
    group.add(chimney);

    // 窗户和门
    const doorGeo = new THREE.BoxGeometry(0.9, 1.6, 0.1);
    const door = new THREE.Mesh(doorGeo, this.materials.woodTrunk);
    door.position.set(0, 0.8, 2.22);
    group.add(door);

    const winGeo = new THREE.BoxGeometry(0.9, 0.9, 0.1);
    const win1 = new THREE.Mesh(winGeo, this.materials.glass);
    win1.position.set(1.5, 1.8, 2.22);
    const win2 = win1.clone();
    win2.position.x = -1.5;
    group.add(win1, win2);

    group.userData = { radius: 4.6, height: 5.2, level: 8, score: 1800, name: '独栋温馨别墅' };
    return group;
  }

  createCornerStore() {
    const group = new THREE.Group();
    // 商业建筑主体
    const bodyGeo = new THREE.BoxGeometry(6.2, 3.6, 5.0);
    const body = new THREE.Mesh(bodyGeo, this.getColoredMat(0xfdfefe));
    body.position.y = 1.8;
    group.add(body);

    // 醒目招牌
    const signGeo = new THREE.BoxGeometry(5.6, 0.7, 0.15);
    const sign = new THREE.Mesh(signGeo, this.getColoredMat(0xe67e22));
    sign.position.set(0, 3.1, 2.55);
    group.add(sign);

    // 落地展示大玻璃橱窗
    const glassGeo = new THREE.BoxGeometry(4.8, 1.8, 0.1);
    const glass = new THREE.Mesh(glassGeo, this.materials.glass);
    glass.position.set(0, 1.2, 2.52);
    group.add(glass);

    // 屋顶空调外机
    const acGeo = new THREE.BoxGeometry(0.9, 0.6, 0.6);
    const ac = new THREE.Mesh(acGeo, this.materials.metalSilver);
    ac.position.set(1.6, 3.9, 0);
    group.add(ac);

    group.userData = { radius: 5.2, height: 4.2, level: 8, score: 2200, name: '街区便利店' };
    return group;
  }

  // ==========================================
  // 等级 9 物体：摩天办公大厦、历史钟楼、综合商厦
  // ==========================================

  createOfficeTower() {
    const group = new THREE.Group();
    // 现代写字楼主体
    const towerGeo = new THREE.BoxGeometry(7.5, 16.0, 7.5);
    const towerMat = this.getColoredMat(0x34495e);
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 8.0;
    group.add(tower);

    // 垂直玻璃幕墙条带装饰
    for (let i = 0; i < 4; i++) {
      const stripeGeo = new THREE.BoxGeometry(1.1, 14.5, 7.6);
      const stripe = new THREE.Mesh(stripeGeo, this.materials.glass);
      stripe.position.set(-2.4 + i * 1.6, 8.0, 0);
      group.add(stripe);
    }

    // 楼顶停机坪/天线尖塔
    const roofBaseGeo = new THREE.BoxGeometry(4.0, 0.6, 4.0);
    const roofBase = new THREE.Mesh(roofBaseGeo, this.materials.curb);
    roofBase.position.y = 16.3;
    group.add(roofBase);

    const spireGeo = new THREE.CylinderGeometry(0.08, 0.3, 4.0, 8);
    const spire = new THREE.Mesh(spireGeo, this.materials.metalSilver);
    spire.position.y = 18.3;
    group.add(spire);

    group.userData = { radius: 6.8, height: 20.0, level: 9, score: 4500, name: '时代金融大厦' };
    return group;
  }

  createClockTower() {
    const group = new THREE.Group();
    // 塔身
    const towerGeo = new THREE.BoxGeometry(5.8, 14.0, 5.8);
    const tower = new THREE.Mesh(towerGeo, this.getColoredMat(0x7f8c8d));
    tower.position.y = 7.0;
    group.add(tower);

    // 钟楼表盘凸台
    const clockBoxGeo = new THREE.BoxGeometry(6.4, 2.4, 6.4);
    const clockBox = new THREE.Mesh(clockBoxGeo, this.getColoredMat(0x95a5a6));
    clockBox.position.y = 14.2;
    group.add(clockBox);

    // 4面时钟表盘
    for (let a = 0; a < 4; a++) {
      const dialGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16);
      dialGeo.rotateX(Math.PI / 2);
      const dial = new THREE.Mesh(dialGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const rad = a * Math.PI / 2;
      dial.position.set(Math.sin(rad) * 3.25, 14.2, Math.cos(rad) * 3.25);
      dial.rotation.y = rad;
      group.add(dial);
    }

    // 铜质尖顶
    const roofGeo = new THREE.ConeGeometry(4.2, 4.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.getColoredMat(0x16a085));
    roof.position.y = 17.65;
    group.add(roof);

    group.userData = { radius: 7.2, height: 20.0, level: 9, score: 5500, name: '市政复古钟楼' };
    return group;
  }

  // 交通信号灯杆 (Level 3 物体)
  createTrafficLight() {
    const group = new THREE.Group();
    // 黑色立杆
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 4.2, 8);
    const pole = new THREE.Mesh(poleGeo, this.materials.metalDark);
    pole.position.y = 2.1;
    group.add(pole);

    // 横臂
    const armGeo = new THREE.BoxGeometry(2.0, 0.12, 0.12);
    const arm = new THREE.Mesh(armGeo, this.materials.metalDark);
    arm.position.set(0.9, 4.0, 0);
    group.add(arm);

    // 信号灯箱
    const boxGeo = new THREE.BoxGeometry(0.45, 1.1, 0.35);
    const box = new THREE.Mesh(boxGeo, this.materials.metalDark);
    box.position.set(1.6, 3.8, 0);
    group.add(box);

    // 红黄绿三色信号灯珠
    const colors = [0xff3b30, 0xffcc00, 0x34c759];
    colors.forEach((col, idx) => {
      const lampGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const lampMat = new THREE.MeshBasicMaterial({ color: col });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(1.6, 4.15 - idx * 0.35, 0.18);
      group.add(lamp);
    });

    group.userData = { radius: 0.95, height: 4.3, level: 3, score: 85, name: '交通信号灯' };
    return group;
  }

  // 生态公园景观石 (Level 2 物体)
  createRock() {
    const group = new THREE.Group();
    const rockGeo = new THREE.DodecahedronGeometry(0.55, 0);
    const rockMat = this.getColoredMat(0x95a5a6);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = 0.35;
    rock.scale.set(1.2, 0.8, 1.0);
    group.add(rock);

    group.userData = { radius: 0.55, height: 0.7, level: 2, score: 35, name: '园林景观石' };
    return group;
  }

  // 散步市民 (Level 1 物体，极具街头生活气息)
  createPedestrian() {
    const group = new THREE.Group();
    const shirtColors = [0xe74c3c, 0x3498db, 0xf39c12, 0x9b59b6, 0x1abc9c];
    const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];

    // 身体 (衣服)
    const bodyGeo = new THREE.BoxGeometry(0.32, 0.45, 0.22);
    const body = new THREE.Mesh(bodyGeo, this.getColoredMat(shirtColor));
    body.position.y = 0.58;
    group.add(body);

    // 头部
    const headGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const head = new THREE.Mesh(headGeo, this.getColoredMat(0xfedbb4));
    head.position.y = 0.95;
    group.add(head);

    // 头发 / 帽子
    const hairGeo = new THREE.ConeGeometry(0.16, 0.14, 6);
    const hair = new THREE.Mesh(hairGeo, this.materials.metalDark);
    hair.position.y = 1.05;
    group.add(hair);

    // 双腿
    const legGeo = new THREE.BoxGeometry(0.1, 0.36, 0.1);
    const legL = new THREE.Mesh(legGeo, this.materials.metalDark);
    legL.position.set(-0.08, 0.18, 0);
    const legR = legL.clone();
    legR.position.x = 0.08;
    group.add(legL, legR);

    group.userData = { radius: 0.32, height: 1.1, level: 1, score: 25, name: '散步市民', isPedestrian: true };
    return group;
  }
}
