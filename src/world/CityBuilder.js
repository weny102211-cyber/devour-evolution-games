import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';
import { ModelFactory } from '../models/ModelFactory.js';

// 精品现代卡通城市地图构建器
export class CityBuilder {
  constructor(scene, consumableManager) {
    this.scene = scene;
    this.consumables = consumableManager;
    this.factory = new ModelFactory();
    this.mapSize = GameConfig.MAP_SIZE;
    this.half = GameConfig.MAP_HALF;
  }

  buildCity() {
    this.createGroundAndRoads();
    this.createPerimeterWalls();
    this.populateCentralPlaza();
    this.populateEcoPark();
    this.populateResidentialDistrict();
    this.populateCommercialMarket();
    this.populateDowntownAndParking();
    this.populateRoadTrafficAndProps();
  }

  // 1. 地面与道路网络
  createGroundAndRoads() {
    // 整体绿色草坪基底 (启用 Stencil 镂空，黑洞下方真实穿透挖洞)
    const groundGeo = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = this.factory.materials.grass;
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.position.y = -0.01;
    ground.renderOrder = 2;
    this.scene.add(ground);

    // 主干道路宽 12 米，十字交叉贯穿城市
    const roadMat = this.factory.materials.asphalt;
    const roadCrossH = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize, 12).rotateX(-Math.PI / 2), roadMat);
    roadCrossH.position.y = 0.01;
    roadCrossH.receiveShadow = true;
    roadCrossH.renderOrder = 2;

    const roadCrossV = new THREE.Mesh(new THREE.PlaneGeometry(12, this.mapSize).rotateX(-Math.PI / 2), roadMat);
    roadCrossV.position.y = 0.01;
    roadCrossV.receiveShadow = true;
    roadCrossV.renderOrder = 2;

    // 次级环路 (距离中心 42 米处的环形道路)
    const ringRoadN = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 20, 8).rotateX(-Math.PI / 2), roadMat);
    ringRoadN.position.set(0, 0.01, -42);
    ringRoadN.renderOrder = 2;
    const ringRoadS = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 20, 8).rotateX(-Math.PI / 2), roadMat);
    ringRoadS.position.set(0, 0.01, 42);
    ringRoadS.renderOrder = 2;
    const ringRoadW = new THREE.Mesh(new THREE.PlaneGeometry(8, this.mapSize - 20).rotateX(-Math.PI / 2), roadMat);
    ringRoadW.position.set(-42, 0.01, 0);
    ringRoadW.renderOrder = 2;
    const ringRoadE = new THREE.Mesh(new THREE.PlaneGeometry(8, this.mapSize - 20).rotateX(-Math.PI / 2), roadMat);
    ringRoadE.position.set(42, 0.01, 0);
    ringRoadE.renderOrder = 2;

    this.scene.add(roadCrossH, roadCrossV, ringRoadN, ringRoadS, ringRoadW, ringRoadE);

    // 绘制道路标线 (黄色双黄线与斑马线)
    this.createRoadMarkings();

    // 人行道铺设
    this.createSidewalks();
  }

  createRoadMarkings() {
    const yellowMat = this.factory.materials.markingYellow;
    const whiteMat = this.factory.materials.markingWhite;

    // 十字主干道的双黄实线
    const lineH = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 20, 0.35).rotateX(-Math.PI / 2), yellowMat);
    lineH.position.set(0, 0.02, 0);
    lineH.renderOrder = 2;
    const lineV = new THREE.Mesh(new THREE.PlaneGeometry(0.35, this.mapSize - 20).rotateX(-Math.PI / 2), yellowMat);
    lineV.position.set(0, 0.02, 0);
    lineV.renderOrder = 2;
    this.scene.add(lineH, lineV);

    // 十字路口斑马线
    const addCrosswalk = (cx, cz, isHorizontal) => {
      for (let i = -4; i <= 4; i += 1.4) {
        const stripeGeo = isHorizontal
          ? new THREE.PlaneGeometry(3.5, 0.65).rotateX(-Math.PI / 2)
          : new THREE.PlaneGeometry(0.65, 3.5).rotateX(-Math.PI / 2);
        const stripe = new THREE.Mesh(stripeGeo, whiteMat);
        stripe.renderOrder = 2;
        if (isHorizontal) {
          stripe.position.set(cx, 0.02, cz + i);
        } else {
          stripe.position.set(cx + i, 0.02, cz);
        }
        this.scene.add(stripe);
      }
    };

    // 4个主十字路口斑马线
    addCrosswalk(-14, 0, false);
    addCrosswalk(14, 0, false);
    addCrosswalk(0, -14, true);
    addCrosswalk(0, 14, true);
  }

  createSidewalks() {
    const swMat = this.factory.materials.sidewalk;
    // 沿道路两侧布置淡灰色人行道条块
    const swConfigs = [
      { w: this.mapSize, d: 2.2, x: 0, z: 7.1 },
      { w: this.mapSize, d: 2.2, x: 0, z: -7.1 },
      { w: 2.2, d: this.mapSize, x: 7.1, z: 0 },
      { w: 2.2, d: this.mapSize, x: -7.1, z: 0 },
    ];
    swConfigs.forEach(cfg => {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, cfg.d).rotateX(-Math.PI / 2), swMat);
      sw.position.set(cfg.x, 0.015, cfg.z);
      sw.renderOrder = 2;
      this.scene.add(sw);
    });
  }

  // 城市外围防跌落装饰护栏与围墙
  createPerimeterWalls() {
    const wallGeo = new THREE.BoxGeometry(this.mapSize, 1.4, 1.2);
    const wallMat = this.factory.materials.curb;

    const wNorth = new THREE.Mesh(wallGeo, wallMat);
    wNorth.position.set(0, 0.7, -this.half);
    const wSouth = new THREE.Mesh(wallGeo, wallMat);
    wSouth.position.set(0, 0.7, this.half);

    const wallSideGeo = new THREE.BoxGeometry(1.2, 1.4, this.mapSize);
    const wWest = new THREE.Mesh(wallSideGeo, wallMat);
    wWest.position.set(-this.half, 0.7, 0);
    const wEast = new THREE.Mesh(wallSideGeo, wallMat);
    wEast.position.set(this.half, 0.7, 0);

    this.scene.add(wNorth, wSouth, wWest, wEast);

    // 四角观景小塔楼
    const cornerTowerGeo = new THREE.CylinderGeometry(1.8, 2.2, 3.5, 8);
    const towerMat = this.factory.materials.curb;
    const corners = [
      [-this.half, -this.half],
      [this.half, -this.half],
      [-this.half, this.half],
      [this.half, this.half]
    ];
    corners.forEach(([cx, cz]) => {
      const tower = new THREE.Mesh(cornerTowerGeo, towerMat);
      tower.position.set(cx, 1.75, cz);
      this.scene.add(tower);
    });
  }

  // 辅助添加可吞噬物体
  addProp(mesh, x, z, rotY = 0) {
    mesh.position.x = x;
    mesh.position.z = z;
    if (rotY !== 0) mesh.rotation.y = rotY;
    this.scene.add(mesh);
    const ud = mesh.userData;
    this.consumables.registerObject(mesh, ud.name, ud.level, ud.score, ud.radius, ud.height);
  }

  // ====================================================
  // 核心地块 1：中心城市广场 (Level 7~9 巨物地标与周边微观设施)
  // ====================================================
  populateCentralPlaza() {
    // 中央大喷泉 (Level 7)
    const fountain = this.factory.createCentralFountain();
    this.addProp(fountain, 0, 0);

    // 广场环绕花坛与长椅
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 6.2;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;

      if (i % 2 === 0) {
        const bench = this.factory.createParkBench();
        this.addProp(bench, px, pz, angle + Math.PI / 2);
      } else {
        const planter = this.factory.createFlowerPlanter();
        this.addProp(planter, px, pz);
      }

      // 散落一些易拉罐和路障锥
      if (Math.random() > 0.3) {
        const can = this.factory.createSodaCan();
        this.addProp(can, px + (Math.random() - 0.5) * 1.5, pz + (Math.random() - 0.5) * 1.5);
      }
    }

    // 广场四角地标性摩天大楼 (Level 9) 与钟楼
    const office1 = this.factory.createOfficeTower();
    this.addProp(office1, -22, -22);

    const office2 = this.factory.createOfficeTower();
    this.addProp(office2, 22, -22);

    const clockTower = this.factory.createClockTower();
    this.addProp(clockTower, -22, 22);

    const store = this.factory.createCornerStore();
    this.addProp(store, 22, 22);

    // 4座主要十字路口红绿灯杆 (Level 3)
    this.addProp(this.factory.createTrafficLight(), -7.6, 7.6, 0);
    this.addProp(this.factory.createTrafficLight(), 7.6, 7.6, -Math.PI / 2);
    this.addProp(this.factory.createTrafficLight(), -7.6, -7.6, Math.PI / 2);
    this.addProp(this.factory.createTrafficLight(), 7.6, -7.6, Math.PI);

    // 玩家出生点 (0, 14) 周边人行道极速启动资源群 (开局 3 秒爽快体验)
    const starterItems = [
      { f: () => this.factory.createSodaCan(), x: 7.5, z: 12 },
      { f: () => this.factory.createSodaCan(), x: 7.5, z: 14 },
      { f: () => this.factory.createSodaCan(), x: 7.5, z: 16 },
      { f: () => this.factory.createSodaCan(), x: 7.5, z: 18 },
      { f: () => this.factory.createCardboardBox(), x: -7.5, z: 11 },
      { f: () => this.factory.createCardboardBox(), x: -7.5, z: 13 },
      { f: () => this.factory.createCardboardBox(), x: -7.5, z: 15 },
      { f: () => this.factory.createCardboardBox(), x: -7.5, z: 17 },
      { f: () => this.factory.createTrafficCone(), x: 2.2, z: 16 },
      { f: () => this.factory.createTrafficCone(), x: -2.2, z: 16 },
      { f: () => this.factory.createTrafficCone(), x: 2.2, z: 12 },
      { f: () => this.factory.createTrafficCone(), x: -2.2, z: 12 },
      { f: () => this.factory.createTrashCan(), x: 7.5, z: 20 },
      { f: () => this.factory.createTrashCan(), x: -7.5, z: 20 },
      { f: () => this.factory.createParkBench(), x: 7.5, z: 22, rot: Math.PI / 2 },
      { f: () => this.factory.createParkBench(), x: -7.5, z: 22, rot: -Math.PI / 2 },
      { f: () => this.factory.createStreetLamp(), x: 7.5, z: 10 },
      { f: () => this.factory.createStreetLamp(), x: -7.5, z: 10 },
    ];
    starterItems.forEach(item => {
      this.addProp(item.f(), item.x, item.z, item.rot || 0);
    });

    // 中心广场与周边街道漫步市民 (Level 1 动态趣味目标)
    const pedCoords = [
      [7.5, 8], [-7.5, 8], [8, -7.5], [-8, -7.5],
      [14, 2], [-14, -2], [2, 14], [-2, -14],
      [4, 4], [-4, 4], [4, -4], [-4, -4],
      [7.5, 26], [-7.5, 26], [26, 7.5], [-26, 7.5]
    ];
    pedCoords.forEach(([px, pz]) => {
      const ped = this.factory.createPedestrian();
      this.addProp(ped, px, pz, Math.random() * Math.PI * 2);
    });
  }

  // ====================================================
  // 核心地块 2：西北生态公园 (Level 1~3 极速起步刷分圣地)
  // ====================================================
  populateEcoPark() {
    const minX = -72, maxX = -16;
    const minZ = -72, maxZ = -16;

    // 大量密集的景观小树与中型树 (Level 3~4)
    for (let x = minX + 6; x <= maxX - 6; x += 9) {
      for (let z = minZ + 6; z <= maxZ - 6; z += 9) {
        const jitterX = x + (Math.random() - 0.5) * 3.5;
        const jitterZ = z + (Math.random() - 0.5) * 3.5;
        const tree = Math.random() > 0.4 ? this.factory.createSmallTree() : this.factory.createMediumTree();
        this.addProp(tree, jitterX, jitterZ);
      }
    }

    // 大量公园长椅、路灯、垃圾桶 (Level 2~3)
    for (let i = 0; i < 18; i++) {
      const rx = minX + 5 + Math.random() * (maxX - minX - 10);
      const rz = minZ + 5 + Math.random() * (maxZ - minZ - 10);
      const bench = this.factory.createParkBench();
      this.addProp(bench, rx, rz, Math.random() * Math.PI * 2);

      const lamp = this.factory.createStreetLamp();
      this.addProp(lamp, rx + 1.8, rz + 1.8);

      const bin = this.factory.createTrashCan();
      this.addProp(bin, rx - 1.5, rz);
    }

    // 遍地丰富密集的 Level 1 启动资源 (易拉罐、快递纸箱、路障锥)
    for (let i = 0; i < 45; i++) {
      const rx = minX + 4 + Math.random() * (maxX - minX - 8);
      const rz = minZ + 4 + Math.random() * (maxZ - minZ - 8);
      const roll = Math.random();
      if (roll < 0.4) {
        this.addProp(this.factory.createSodaCan(), rx, rz);
      } else if (roll < 0.7) {
        this.addProp(this.factory.createCardboardBox(), rx, rz);
      } else {
        this.addProp(this.factory.createTrafficCone(), rx, rz);
      }
    }
  }

  // ====================================================
  // 核心地块 3：东北宁静住宅区 (Level 1~8 阶梯式成长路线)
  // ====================================================
  populateResidentialDistrict() {
    const minX = 16, maxX = 72;
    const minZ = -72, maxZ = -16;

    // 两排整齐的独栋温馨别墅 (Level 8)
    const houseCoords = [
      [26, -26], [42, -26], [58, -26],
      [26, -56], [42, -56], [58, -56]
    ];

    houseCoords.forEach(([hx, hz]) => {
      const house = this.factory.createSuburbanHouse();
      this.addProp(house, hx, hz);

      // 每栋房前停放私家车 (Level 5)
      const car = this.factory.createCar('sedan');
      this.addProp(car, hx + 3.8, hz + 3.8, Math.PI / 2);

      // 房前邮箱、消防栓、花盆
      this.addProp(this.factory.createMailbox(), hx - 2.8, hz + 3.2);
      this.addProp(this.factory.createFlowerPlanter(), hx + 1.5, hz + 3.2);
      this.addProp(this.factory.createTrashCan(), hx + 3.2, hz + 1.5);

      // 院落前的小包裹
      this.addProp(this.factory.createCardboardBox(), hx - 1.2, hz + 3.0);
    });

    // 住宅区间街道松树与路灯
    for (let x = 20; x <= 65; x += 12) {
      const pine = this.factory.createPineTree();
      this.addProp(pine, x, -41);
      const lamp = this.factory.createStreetLamp();
      this.addProp(lamp, x + 3.5, -39);
    }
  }

  // ====================================================
  // 核心地块 4：西南物流与餐饮商业街 (Level 1~6 丰富载具与小吃摊)
  // ====================================================
  populateCommercialMarket() {
    const minX = -72, maxX = -16;
    const minZ = 16, maxZ = 72;

    // 沿街商业便利店与快餐厅 (Level 8)
    const shop1 = this.factory.createCornerStore();
    this.addProp(shop1, -28, 28);
    const shop2 = this.factory.createCornerStore();
    this.addProp(shop2, -54, 28);

    // 自动售货机排 (Level 3)
    for (let i = 0; i < 4; i++) {
      const vm = this.factory.createVendingMachine();
      this.addProp(vm, -20 - i * 2.2, 33);
    }

    // 热狗摊与摩托车队 (Level 4)
    for (let i = 0; i < 3; i++) {
      const cart = this.factory.createHotDogCart();
      this.addProp(cart, -35 - i * 7, 45);

      const moto = this.factory.createMotorcycle();
      this.addProp(moto, -32 - i * 7, 48, Math.PI / 4);
    }

    // 物流货车 (Level 6)
    const truck1 = this.factory.createBoxTruck();
    this.addProp(truck1, -38, 60, Math.PI / 2);
    const truck2 = this.factory.createBoxTruck();
    this.addProp(truck2, -56, 60, Math.PI / 2);

    // 街边消防栓、垃圾桶、大量易拉罐与纸箱 (Level 1~2)
    for (let i = 0; i < 28; i++) {
      const rx = minX + 5 + Math.random() * (maxX - minX - 10);
      const rz = minZ + 5 + Math.random() * (maxZ - minZ - 10);
      this.addProp(Math.random() > 0.5 ? this.factory.createSodaCan() : this.factory.createCardboardBox(), rx, rz);
      if (i % 4 === 0) {
        this.addProp(this.factory.createFireHydrant(), rx + 1.2, rz);
      }
    }
  }

  // ====================================================
  // 核心地块 5：东南闹市中心与公交枢纽 (Level 5~7 车辆聚集区)
  // ====================================================
  populateDowntownAndParking() {
    const minX = 16, maxX = 72;
    const minZ = 16, maxZ = 72;

    // 两辆大型城市公共巴士 (Level 7)
    const bus1 = this.factory.createCityBus();
    this.addProp(bus1, 35, 30, 0);
    const bus2 = this.factory.createCityBus();
    this.addProp(bus2, 55, 30, 0);

    // 繁忙大停车场：排列整齐的轿车、出租车、SUV (Level 5)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = 25 + col * 5.2;
        const cz = 46 + row * 8.5;
        const isTaxi = col === 1 || col === 4;
        const car = this.factory.createCar(isTaxi ? 'taxi' : 'sedan');
        this.addProp(car, cx, cz, Math.PI / 2);

        // 车位旁常有被丢弃的易拉罐和路障
        if (Math.random() > 0.4) {
          this.addProp(this.factory.createSodaCan(), cx + 1.6, cz + 1.2);
        }
      }
    }

    // 东南角现代高层商业楼 (Level 9)
    const officeEast = this.factory.createOfficeTower();
    this.addProp(officeEast, 58, 58);
  }

  // ====================================================
  // 主干道巡游车辆、路边路灯与行道树
  // ====================================================
  populateRoadTrafficAndProps() {
    // 沿环路两侧布置路灯与垃圾桶
    const ringCoords = [
      { x: -42, z: -20 }, { x: -42, z: 20 },
      { x: 42, z: -20 }, { x: 42, z: 20 },
      { x: -20, z: -42 }, { x: 20, z: -42 },
      { x: -20, z: 42 }, { x: 20, z: 42 }
    ];
    ringCoords.forEach(pos => {
      const lamp = this.factory.createStreetLamp();
      this.addProp(lamp, pos.x, pos.z);

      const trash = this.factory.createTrashCan();
      this.addProp(trash, pos.x + 1.4, pos.z);
    });

    // 主干道旁停靠的巡游出租车与摩托车
    const roadCars = [
      { x: -25, z: 3.5, type: 'taxi', rot: 0 },
      { x: 30, z: -3.5, type: 'sedan', rot: Math.PI },
      { x: 3.5, z: -30, type: 'sedan', rot: Math.PI / 2 },
      { x: -3.5, z: 28, type: 'taxi', rot: -Math.PI / 2 },
    ];
    roadCars.forEach(rc => {
      const car = this.factory.createCar(rc.type);
      this.addProp(car, rc.x, rc.z, rc.rot);
    });
  }
}
