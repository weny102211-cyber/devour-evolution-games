import * as THREE from '../../libs/three.module.js';
import { GameConfig } from '../config.js';
import { ModelFactory } from '../models/ModelFactory.js';

// 宏伟 3D 大都市构建器 (320m x 320m 超大地图，包含 6 大主题街区与 600+ 可破坏交互物体)
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
    this.createCityPlazasAndBlocks();
    this.createPerimeterWalls();

    // 1. 中央政务与景观环岛广场 (0, 0)
    this.populateCentralPlaza();

    // 2. 西北 CBD 摩天大楼与商务金融中心 (-85, -85)
    this.populateFinancialDistrict();

    // 3. 东北霓虹商业街与小吃夜市 (85, -85)
    this.populateCommercialMarket();

    // 4. 西南生态中央森林公园与步道 (-85, 85)
    this.populateEcoForestPark();

    // 5. 东南阳光独栋别墅居住社区 (85, 85)
    this.populateSuburbanCommunity();

    // 6. 全城交通环路网络、公交枢纽与干道巡游载具
    this.populateMetropolitanTransit();

    // 7. 联络街区致密化填充 (全城无缝繁华)
    this.populateNeighborhoodFillers();
  }

  // 1. 广袤城市地面与纵横多车道公路网
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

    const roadMat = this.factory.materials.asphalt;

    // 十字主干道大道 (宽 18 米，贯穿 320 米全城)
    const roadCrossH = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize, 18).rotateX(-Math.PI / 2), roadMat);
    roadCrossH.position.y = 0.01;
    roadCrossH.receiveShadow = true;
    roadCrossH.renderOrder = 2;

    const roadCrossV = new THREE.Mesh(new THREE.PlaneGeometry(18, this.mapSize).rotateX(-Math.PI / 2), roadMat);
    roadCrossV.position.y = 0.01;
    roadCrossV.receiveShadow = true;
    roadCrossV.renderOrder = 2;

    this.scene.add(roadCrossH, roadCrossV);

    // 次级外环大道 (位于 x = ±85, z = ±85，宽 12 米)
    const ringN = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 30, 12).rotateX(-Math.PI / 2), roadMat);
    ringN.position.set(0, 0.01, -85);
    ringN.renderOrder = 2;
    const ringS = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 30, 12).rotateX(-Math.PI / 2), roadMat);
    ringS.position.set(0, 0.01, 85);
    ringS.renderOrder = 2;
    const ringW = new THREE.Mesh(new THREE.PlaneGeometry(12, this.mapSize - 30).rotateX(-Math.PI / 2), roadMat);
    ringW.position.set(-85, 0.01, 0);
    ringW.renderOrder = 2;
    const ringE = new THREE.Mesh(new THREE.PlaneGeometry(12, this.mapSize - 30).rotateX(-Math.PI / 2), roadMat);
    ringE.position.set(85, 0.01, 0);
    ringE.renderOrder = 2;

    // 街区内联络支路 (位于 x = ±42, z = ±42，宽 9 米)
    const subN = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 60, 9).rotateX(-Math.PI / 2), roadMat);
    subN.position.set(0, 0.01, -42);
    subN.renderOrder = 2;
    const subS = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 60, 9).rotateX(-Math.PI / 2), roadMat);
    subS.position.set(0, 0.01, 42);
    subS.renderOrder = 2;
    const subW = new THREE.Mesh(new THREE.PlaneGeometry(9, this.mapSize - 60).rotateX(-Math.PI / 2), roadMat);
    subW.position.set(-42, 0.01, 0);
    subW.renderOrder = 2;
    const subE = new THREE.Mesh(new THREE.PlaneGeometry(9, this.mapSize - 60).rotateX(-Math.PI / 2), roadMat);
    subE.position.set(42, 0.01, 0);
    subE.renderOrder = 2;

    this.scene.add(ringN, ringS, ringW, ringE, subN, subS, subW, subE);

    // 绘制主干道双黄线与环路斑马线
    this.createRoadMarkings();

    // 沿所有道路两侧铺设精致人行道
    this.createSidewalks();
  }

  createRoadMarkings() {
    const yellowMat = this.factory.materials.markingYellow;
    const whiteMat = this.factory.materials.markingWhite;

    // 十字主干道双黄实线
    const lineH = new THREE.Mesh(new THREE.PlaneGeometry(this.mapSize - 30, 0.4).rotateX(-Math.PI / 2), yellowMat);
    lineH.position.set(0, 0.02, 0);
    lineH.renderOrder = 2;
    const lineV = new THREE.Mesh(new THREE.PlaneGeometry(0.4, this.mapSize - 30).rotateX(-Math.PI / 2), yellowMat);
    lineV.position.set(0, 0.02, 0);
    lineV.renderOrder = 2;
    this.scene.add(lineH, lineV);

    // 十字路口斑马线
    const addCrosswalk = (cx, cz, isHorizontal) => {
      for (let i = -5.5; i <= 5.5; i += 1.5) {
        const stripeGeo = isHorizontal
          ? new THREE.PlaneGeometry(4.2, 0.8).rotateX(-Math.PI / 2)
          : new THREE.PlaneGeometry(0.8, 4.2).rotateX(-Math.PI / 2);
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

    // 中心大十字路口斑马线
    addCrosswalk(-18, 0, false);
    addCrosswalk(18, 0, false);
    addCrosswalk(0, -18, true);
    addCrosswalk(0, 18, true);

    // 4个二级环路路口斑马线
    addCrosswalk(-85, -18, true);
    addCrosswalk(-85, 18, true);
    addCrosswalk(85, -18, true);
    addCrosswalk(85, 18, true);
    addCrosswalk(-18, -85, false);
    addCrosswalk(18, -85, false);
    addCrosswalk(-18, 85, false);
    addCrosswalk(18, 85, false);
  }

  createSidewalks() {
    const swMat = this.factory.materials.sidewalk;
    // 沿主十字干道两侧布置人行道
    const swConfigs = [
      { w: this.mapSize, d: 2.8, x: 0, z: 10.4 },
      { w: this.mapSize, d: 2.8, x: 0, z: -10.4 },
      { w: 2.8, d: this.mapSize, x: 10.4, z: 0 },
      { w: 2.8, d: this.mapSize, x: -10.4, z: 0 },
      // 外环道路人行道
      { w: this.mapSize - 30, d: 2.4, x: 0, z: -92.2 },
      { w: this.mapSize - 30, d: 2.4, x: 0, z: -77.8 },
      { w: this.mapSize - 30, d: 2.4, x: 0, z: 77.8 },
      { w: this.mapSize - 30, d: 2.4, x: 0, z: 92.2 },
      { w: 2.4, d: this.mapSize - 30, x: -92.2, z: 0 },
      { w: 2.4, d: this.mapSize - 30, x: -77.8, z: 0 },
      { w: 2.4, d: this.mapSize - 30, x: 77.8, z: 0 },
      { w: 2.4, d: this.mapSize - 30, x: 92.2, z: 0 },
    ];
    swConfigs.forEach(cfg => {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, cfg.d).rotateX(-Math.PI / 2), swMat);
      sw.position.set(cfg.x, 0.015, cfg.z);
      sw.renderOrder = 2;
      this.scene.add(sw);
    });
  }

  // 城市地块硬化基础、人行广场与规划停车场
  createCityPlazasAndBlocks() {
    const swMat = this.factory.materials.sidewalk;
    const roadMat = this.factory.materials.asphalt;
    const whiteMat = this.factory.materials.markingWhite;

    // 1. 中央政务广场硬化石材地台 (22m x 22m)
    const centerPlaza = new THREE.Mesh(new THREE.PlaneGeometry(22, 22).rotateX(-Math.PI / 2), swMat);
    centerPlaza.position.set(0, 0.018, 0);
    centerPlaza.renderOrder = 2;
    this.scene.add(centerPlaza);

    // 2. 西北 CBD 商务广场与露天停车场地面 (34m x 24m)
    const cbdLot = new THREE.Mesh(new THREE.PlaneGeometry(34, 24).rotateX(-Math.PI / 2), roadMat);
    cbdLot.position.set(-85, 0.016, -78);
    cbdLot.renderOrder = 2;
    this.scene.add(cbdLot);

    // 停车场白色车位标线 (10 个规整车位)
    for (let c = 0; c <= 5; c++) {
      const lineGeo = new THREE.PlaneGeometry(0.18, 5.5).rotateX(-Math.PI / 2);
      const line1 = new THREE.Mesh(lineGeo, whiteMat);
      line1.position.set(-97 + c * 5.0, 0.022, -82);
      line1.renderOrder = 2;
      const line2 = new THREE.Mesh(lineGeo, whiteMat);
      line2.position.set(-97 + c * 5.0, 0.022, -74);
      line2.renderOrder = 2;
      this.scene.add(line1, line2);
    }

    // 3. 东北商业步行街中心铺装步行大道 (宽 14m, 长 76m)
    const marketPave = new THREE.Mesh(new THREE.PlaneGeometry(76, 14).rotateX(-Math.PI / 2), swMat);
    marketPave.position.set(85, 0.018, -85);
    marketPave.renderOrder = 2;
    this.scene.add(marketPave);

    // 4. 加油站防滑混凝土硬化地坪 (18m x 18m)
    const gasPad = new THREE.Mesh(new THREE.PlaneGeometry(18, 18).rotateX(-Math.PI / 2), swMat);
    gasPad.position.set(43, 0.018, -65);
    gasPad.renderOrder = 2;
    this.scene.add(gasPad);

    // 5. 市政施工现场碎石硬化地面 (18m x 18m)
    const constrPad = new THREE.Mesh(new THREE.PlaneGeometry(18, 18).rotateX(-Math.PI / 2), this.factory.materials.curb);
    constrPad.position.set(-133, 0.018, -133);
    constrPad.renderOrder = 2;
    this.scene.add(constrPad);
  }

  // 城市外围防跌落装饰护栏与角楼
  createPerimeterWalls() {
    const wallGeoH = new THREE.BoxGeometry(this.mapSize, 1.8, 1.5);
    const wallGeoV = new THREE.BoxGeometry(1.5, 1.8, this.mapSize);
    const wallMat = this.factory.materials.curb;

    const wNorth = new THREE.Mesh(wallGeoH, wallMat);
    wNorth.position.set(0, 0.9, -this.half);
    const wSouth = new THREE.Mesh(wallGeoH, wallMat);
    wSouth.position.set(0, 0.9, this.half);
    const wWest = new THREE.Mesh(wallGeoV, wallMat);
    wWest.position.set(-this.half, 0.9, 0);
    const wEast = new THREE.Mesh(wallGeoV, wallMat);
    wEast.position.set(this.half, 0.9, 0);

    this.scene.add(wNorth, wSouth, wWest, wEast);

    // 四角观景小塔楼
    const cornerTowerGeo = new THREE.CylinderGeometry(2.5, 3.2, 5.0, 10);
    const corners = [
      [-this.half, -this.half],
      [this.half, -this.half],
      [-this.half, this.half],
      [this.half, this.half]
    ];
    corners.forEach(([cx, cz]) => {
      const tower = new THREE.Mesh(cornerTowerGeo, wallMat);
      tower.position.set(cx, 2.5, cz);
      this.scene.add(tower);
    });
  }

  // 注册并放置可吞噬物体
  addProp(mesh, x, z, rotY = 0) {
    mesh.position.x = x;
    mesh.position.z = z;
    if (rotY !== 0) mesh.rotation.y = rotY;
    this.scene.add(mesh);
    const ud = mesh.userData;
    this.consumables.registerObject(mesh, ud.name, ud.level, ud.score, ud.radius, ud.height);
  }

  // ====================================================
  // 地块 1：中央政务与景观环岛广场 ((0, 0) 周边)
  // ====================================================
  populateCentralPlaza() {
    // 广场中央宏伟喷泉 (Level 7)
    const fountain = this.factory.createCentralFountain();
    this.addProp(fountain, 0, 0);

    // 环岛周围花坛与长椅
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 7.5;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;

      if (i % 2 === 0) {
        this.addProp(this.factory.createParkBench(), px, pz, angle + Math.PI / 2);
      } else {
        this.addProp(this.factory.createFlowerPlanter(), px, pz);
      }
      this.addProp(this.factory.createSodaCan(), px + 0.9, pz + 0.9);
    }

    // 广场四角露天街头咖啡座 (Level 3 街景小品)
    this.addProp(this.factory.createOutdoorCafe(), 6.5, 6.5);
    this.addProp(this.factory.createOutdoorCafe(), -6.5, 6.5);
    this.addProp(this.factory.createOutdoorCafe(), 6.5, -6.5);
    this.addProp(this.factory.createOutdoorCafe(), -6.5, -6.5);

    // 广场边侧景观生态八角凉亭 (Level 6 核心景观)
    this.addProp(this.factory.createGazebo(), 14.5, -14.5);

    // 广场路边停泊的电光赛博超跑 (Level 5)
    this.addProp(this.factory.createSportsCar(), -11.0, 4.5, Math.PI / 2);

    // 主干道四角红绿灯 (Level 3)
    this.addProp(this.factory.createTrafficLight(), -10.5, 10.5, 0);
    this.addProp(this.factory.createTrafficLight(), 10.5, 10.5, -Math.PI / 2);
    this.addProp(this.factory.createTrafficLight(), -10.5, -10.5, Math.PI / 2);
    this.addProp(this.factory.createTrafficLight(), 10.5, -10.5, Math.PI);

    // 玩家出生点 (0, 18) 黄金极速发育糖果路线 (开局 3 秒连击爆爽)
    const starterItems = [
      { f: () => this.factory.createSodaCan(), x: 11, z: 14 },
      { f: () => this.factory.createSodaCan(), x: 11, z: 16 },
      { f: () => this.factory.createSodaCan(), x: 11, z: 18 },
      { f: () => this.factory.createSodaCan(), x: 11, z: 20 },
      { f: () => this.factory.createSodaCan(), x: 11, z: 22 },
      { f: () => this.factory.createCardboardBox(), x: -11, z: 13 },
      { f: () => this.factory.createCardboardBox(), x: -11, z: 15 },
      { f: () => this.factory.createCardboardBox(), x: -11, z: 17 },
      { f: () => this.factory.createCardboardBox(), x: -11, z: 19 },
      { f: () => this.factory.createCardboardBox(), x: -11, z: 21 },
      { f: () => this.factory.createTrafficCone(), x: 3.5, z: 20 },
      { f: () => this.factory.createTrafficCone(), x: -3.5, z: 20 },
      { f: () => this.factory.createTrafficCone(), x: 3.5, z: 15 },
      { f: () => this.factory.createTrafficCone(), x: -3.5, z: 15 },
      { f: () => this.factory.createTrafficCone(), x: 0, z: 23 },
      { f: () => this.factory.createTrashCan(), x: 11, z: 25 },
      { f: () => this.factory.createTrashCan(), x: -11, z: 25 },
      { f: () => this.factory.createFireHydrant(), x: 11, z: 27 },
      { f: () => this.factory.createFireHydrant(), x: -11, z: 27 },
      { f: () => this.factory.createParkBench(), x: 11, z: 29, rot: Math.PI / 2 },
      { f: () => this.factory.createParkBench(), x: -11, z: 29, rot: -Math.PI / 2 },
      { f: () => this.factory.createStreetLamp(), x: 11, z: 12 },
      { f: () => this.factory.createStreetLamp(), x: -11, z: 12 },
    ];
    starterItems.forEach(item => {
      this.addProp(item.f(), item.x, item.z, item.rot || 0);
    });

    // 漫步市民小分队 (Level 1 动态目标)
    const pedSpots = [
      [11, 10], [-11, 10], [10, -11], [-10, -11],
      [11, 24], [-11, 24], [5, 5], [-5, 5],
      [5, -5], [-5, -5], [15, 0], [-15, 0],
      [0, 26], [0, -26], [11, -18], [-11, -18]
    ];
    pedSpots.forEach(([px, pz]) => {
      this.addProp(this.factory.createPedestrian(), px, pz, Math.random() * Math.PI * 2);
    });
  }

  // ====================================================
  // 地块 2：西北 CBD 摩天大楼与商务金融区 ((-85, -85) 周边)
  // ====================================================
  populateFinancialDistrict() {
    const baseX = -85;
    const baseZ = -85;

    // 4 座霸主级超维双子星摩天大楼 (Level 10)
    this.addProp(this.factory.createMegaSkyscraper(), baseX - 30, baseZ - 30);
    this.addProp(this.factory.createMegaSkyscraper(), baseX + 30, baseZ - 30);
    this.addProp(this.factory.createMegaSkyscraper(), baseX - 30, baseZ + 30);
    this.addProp(this.factory.createMegaSkyscraper(), baseX + 30, baseZ + 30);

    // 摩天塔吊市政施工现场 (Level 9 标志性地标，带 17 米黄色塔吊与脚手架)
    this.addProp(this.factory.createConstructionSite(), baseX - 48, baseZ - 48);

    // 8 座现代高层商业写字楼 (Level 9)
    const officeOffsets = [
      [-12, -30], [12, -30], [-30, -12], [-30, 12],
      [30, -12], [30, 12], [-12, 30], [12, 30]
    ];
    officeOffsets.forEach(([ox, oz]) => {
      this.addProp(this.factory.createOfficeTower(), baseX + ox, baseZ + oz);
    });

    // 4 座古典钟楼 (Level 8)
    this.addProp(this.factory.createClockTower(), baseX - 15, baseZ - 15);
    this.addProp(this.factory.createClockTower(), baseX + 15, baseZ - 15);
    this.addProp(this.factory.createClockTower(), baseX - 15, baseZ + 15);
    this.addProp(this.factory.createClockTower(), baseX + 15, baseZ + 15);

    // 3 座中高层公寓楼 (Level 8)
    this.addProp(this.factory.createApartmentBlock(), baseX + 48, baseZ);
    this.addProp(this.factory.createApartmentBlock(), baseX, baseZ - 48);
    this.addProp(this.factory.createApartmentBlock(), baseX, baseZ + 48);

    // 商务区露天停车场：停靠多辆商务轿车、出租车、警车与赛博超跑 (Level 5)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const carX = baseX - 12 + c * 5.0;
        const carZ = baseZ + 7 + r * 8.0;
        let carMesh;
        if (c === 0 && r === 0) {
          carMesh = this.factory.createSportsCar(); // 总裁专属超跑
        } else if (c === 1 && r === 0) {
          carMesh = this.factory.createPoliceCar();
        } else if (c === 2) {
          carMesh = this.factory.createCar('taxi');
        } else {
          carMesh = this.factory.createCar('sedan');
        }
        this.addProp(carMesh, carX, carZ, Math.PI / 2);

        // 散落的易拉罐、快递盒
        if (Math.random() > 0.35) {
          this.addProp(this.factory.createSodaCan(), carX + 1.2, carZ + 1.0);
        }
      }
    }

    // 商务街区自动售货机、路灯与垃圾桶
    for (let i = 0; i < 18; i++) {
      const rx = baseX + (Math.random() - 0.5) * 85;
      const rz = baseZ + (Math.random() - 0.5) * 85;
      this.addProp(this.factory.createStreetLamp(), rx, rz);
      this.addProp(this.factory.createTrashCan(), rx + 1.5, rz);
      if (i % 3 === 0) {
        this.addProp(this.factory.createVendingMachine(), rx - 1.6, rz);
      }
    }
  }

  // ====================================================
  // 地块 3：东北霓虹商业步行街与小吃夜市 ((85, -85) 周边)
  // ====================================================
  populateCommercialMarket() {
    const baseX = 85;
    const baseZ = -85;

    // 标志性巨型甜甜圈烘焙工坊 (Level 7 特色标志地标)
    this.addProp(this.factory.createDonutShop(), baseX - 22, baseZ - 36, 0);
    this.addProp(this.factory.createDonutShop(), baseX + 22, baseZ + 36, Math.PI);

    // 快乐汉堡快餐厅 (Level 7 巨型汉堡屋顶标志)
    this.addProp(this.factory.createFastFood(), baseX + 18, baseZ - 36, 0);

    // 全服务公路加油站 (Level 8 独立油棚、加油岛与油价立牌)
    this.addProp(this.factory.createGasStation(), baseX - 42, baseZ + 20, Math.PI / 2);

    // 沿街排布便利店与快餐厅 (Level 7)
    this.addProp(this.factory.createCornerStore(), baseX - 40, baseZ - 36, 0);
    this.addProp(this.factory.createCornerStore(), baseX + 38, baseZ - 36, 0);
    this.addProp(this.factory.createCornerStore(), baseX - 35, baseZ + 36, Math.PI);
    this.addProp(this.factory.createCornerStore(), baseX - 48, baseZ - 14, Math.PI / 2);
    this.addProp(this.factory.createCornerStore(), baseX + 48, baseZ - 14, -Math.PI / 2);
    this.addProp(this.factory.createCornerStore(), baseX + 48, baseZ + 14, -Math.PI / 2);

    // 4 栋大型商业公寓楼 (Level 8)
    this.addProp(this.factory.createApartmentBlock(), baseX - 28, baseZ - 14);
    this.addProp(this.factory.createApartmentBlock(), baseX + 28, baseZ - 14);
    this.addProp(this.factory.createApartmentBlock(), baseX - 28, baseZ + 14);
    this.addProp(this.factory.createApartmentBlock(), baseX + 28, baseZ + 14);

    // 美食步行街：露天咖啡遮阳座 (Level 3 街景休闲)
    this.addProp(this.factory.createOutdoorCafe(), baseX - 22, baseZ - 28);
    this.addProp(this.factory.createOutdoorCafe(), baseX - 14, baseZ - 28);
    this.addProp(this.factory.createOutdoorCafe(), baseX + 18, baseZ - 28);
    this.addProp(this.factory.createOutdoorCafe(), baseX + 26, baseZ - 28);
    this.addProp(this.factory.createOutdoorCafe(), baseX - 8, baseZ + 28);
    this.addProp(this.factory.createOutdoorCafe(), baseX + 8, baseZ + 28);

    // 甜甜圈店旁停放的赛博超跑 (Level 5)
    this.addProp(this.factory.createSportsCar(), baseX - 30, baseZ - 28, Math.PI / 2);

    // 美食步行街：热狗餐车、自动售货机、摩托车队 (Level 3~4)
    for (let i = 0; i < 6; i++) {
      const hx = baseX - 25 + i * 10;
      this.addProp(this.factory.createHotDogCart(), hx, baseZ - 2);
      this.addProp(this.factory.createMotorcycle(), hx + 3.2, baseZ + 2, Math.PI / 4);
      this.addProp(this.factory.createVendingMachine(), hx - 3.2, baseZ + 2);
    }

    // 街头巨型霓虹广告牌 (Level 6)
    this.addProp(this.factory.createBillboard(), baseX - 22, baseZ - 46, 0);
    this.addProp(this.factory.createBillboard(), baseX + 22, baseZ - 46, 0);
    this.addProp(this.factory.createBillboard(), baseX - 22, baseZ + 46, Math.PI);
    this.addProp(this.factory.createBillboard(), baseX + 22, baseZ + 46, Math.PI);

    // 步行街长椅、路灯、消防栓与满地快餐垃圾 (Level 1~3 极高密度)
    for (let i = 0; i < 48; i++) {
      const rx = baseX + (Math.random() - 0.5) * 80;
      const rz = baseZ + (Math.random() - 0.5) * 80;
      const roll = Math.random();
      if (roll < 0.35) {
        this.addProp(this.factory.createSodaCan(), rx, rz);
      } else if (roll < 0.65) {
        this.addProp(this.factory.createCardboardBox(), rx, rz);
      } else if (roll < 0.85) {
        this.addProp(this.factory.createParkBench(), rx, rz, Math.random() * Math.PI * 2);
      } else {
        this.addProp(this.factory.createTrashCan(), rx, rz);
      }
    }

    // 商业街逛街市民
    for (let i = 0; i < 20; i++) {
      const rx = baseX + (Math.random() - 0.5) * 65;
      const rz = baseZ + (Math.random() - 0.5) * 65;
      this.addProp(this.factory.createPedestrian(), rx, rz, Math.random() * Math.PI * 2);
    }
  }

  // ====================================================
  // 地块 4：西南生态中央森林公园与步道 ((-85, 85) 周边)
  // ====================================================
  populateEcoForestPark() {
    const baseX = -85;
    const baseZ = 85;

    // 公园标志性生态八角景观亭 (Level 6 核心景观)
    this.addProp(this.factory.createGazebo(), baseX, baseZ);
    this.addProp(this.factory.createGazebo(), baseX + 32, baseZ - 30);

    // 密集景观森林 (超过 75 棵小树、中型树与高耸松树，Level 3~5 快速升级宝地)
    for (let x = baseX - 45; x <= baseX + 45; x += 11) {
      for (let z = baseZ - 45; z <= baseZ + 45; z += 11) {
        if (Math.abs(x - baseX) < 8 && Math.abs(z - baseZ) < 8) continue; // 给凉亭留出空地
        const jx = x + (Math.random() - 0.5) * 5.0;
        const jz = z + (Math.random() - 0.5) * 5.0;
        const roll = Math.random();
        if (roll < 0.45) {
          this.addProp(this.factory.createSmallTree(), jx, jz);
        } else if (roll < 0.8) {
          this.addProp(this.factory.createMediumTree(), jx, jz);
        } else {
          this.addProp(this.factory.createPineTree(), jx, jz);
        }
      }
    }

    // 森林公园步道长椅、景观石与花坛 (Level 2~3)
    for (let i = 0; i < 30; i++) {
      const rx = baseX + (Math.random() - 0.5) * 90;
      const rz = baseZ + (Math.random() - 0.5) * 90;
      this.addProp(this.factory.createParkBench(), rx, rz, Math.random() * Math.PI * 2);
      this.addProp(this.factory.createRock(), rx + 2.0, rz - 1.5);
      if (i % 2 === 0) {
        this.addProp(this.factory.createFlowerPlanter(), rx - 1.8, rz + 1.8);
      }
      this.addProp(this.factory.createStreetLamp(), rx + 1.2, rz + 1.2);
    }

    // 散落在林间的野餐垃圾、易拉罐、快递盒与路障
    for (let i = 0; i < 50; i++) {
      const rx = baseX + (Math.random() - 0.5) * 92;
      const rz = baseZ + (Math.random() - 0.5) * 92;
      if (Math.random() > 0.5) {
        this.addProp(this.factory.createSodaCan(), rx, rz);
      } else {
        this.addProp(this.factory.createTrafficCone(), rx, rz);
      }
    }
  }

  // ====================================================
  // 地块 5：东南阳光独栋别墅居住社区 ((85, 85) 周边)
  // ====================================================
  populateSuburbanCommunity() {
    const baseX = 85;
    const baseZ = 85;

    // 社区校车站停靠的经典黄色校车 (Level 6 标志性载具)
    this.addProp(this.factory.createSchoolBus(), baseX - 46, baseZ - 20, 0);
    this.addProp(this.factory.createSchoolBus(), baseX + 46, baseZ + 20, Math.PI);

    // 16 栋规整精致的独栋温馨别墅 (Level 7)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const hx = baseX - 36 + col * 24;
        const hz = baseZ - 36 + row * 24;

        this.addProp(this.factory.createSuburbanHouse(), hx, hz);

        // 每栋别墅车道停放私家轿车、警车或赛博超跑 (Level 5)
        let carMesh;
        if (row === 0 && col === 0) {
          carMesh = this.factory.createSportsCar(); // 豪宅配超跑
        } else if (row === 1 && col === 2) {
          carMesh = this.factory.createPoliceCar();
        } else {
          carMesh = this.factory.createCar('sedan');
        }
        this.addProp(carMesh, hx + 4.8, hz + 4.2, Math.PI / 2);

        // 门前邮箱、花坛、消防栓与垃圾桶
        this.addProp(this.factory.createMailbox(), hx - 3.5, hz + 3.8);
        this.addProp(this.factory.createFlowerPlanter(), hx + 1.8, hz + 3.8);
        this.addProp(this.factory.createTrashCan(), hx + 4.2, hz + 1.5);
        this.addProp(this.factory.createCardboardBox(), hx - 1.5, hz + 3.5);

        // 院角绿化小松树
        this.addProp(this.factory.createPineTree(), hx - 4.5, hz - 4.5);
      }
    }

    // 社区道路路灯与消防栓
    for (let col = 0; col < 4; col++) {
      const lx = baseX - 36 + col * 24;
      this.addProp(this.factory.createStreetLamp(), lx, baseZ - 48);
      this.addProp(this.factory.createStreetLamp(), lx, baseZ + 48);
      this.addProp(this.factory.createFireHydrant(), lx + 3.0, baseZ - 48);
    }
  }

  // ====================================================
  // 地块 6：全城交通环路网络、公交枢纽与干道巡游载具
  // ====================================================
  populateMetropolitanTransit() {
    // 城市公交大巴 (Level 7 巨物载具，环绕四方干道)
    const busStations = [
      { x: -85, z: 25, rot: 0 },
      { x: 85, z: 25, rot: 0 },
      { x: -85, z: -25, rot: Math.PI },
      { x: 85, z: -25, rot: Math.PI },
      { x: 25, z: -85, rot: Math.PI / 2 },
      { x: -25, z: -85, rot: -Math.PI / 2 },
      { x: 25, z: 85, rot: Math.PI / 2 },
      { x: -25, z: 85, rot: -Math.PI / 2 },
    ];
    busStations.forEach(b => {
      this.addProp(this.factory.createCityBus(), b.x, b.z, b.rot);
    });

    // 干道穿梭经典黄色校车 (Level 6)
    this.addProp(this.factory.createSchoolBus(), -85, -55, 0);
    this.addProp(this.factory.createSchoolBus(), 85, 55, Math.PI);

    // 重型厢式物流货车 (Level 6)
    const truckSpots = [
      { x: -45, z: 8.5, rot: 0 },
      { x: 45, z: -8.5, rot: Math.PI },
      { x: -8.5, z: -45, rot: Math.PI / 2 },
      { x: 8.5, z: 45, rot: -Math.PI / 2 },
      { x: -110, z: -85, rot: 0 },
      { x: 110, z: 85, rot: Math.PI },
    ];
    truckSpots.forEach(t => {
      this.addProp(this.factory.createBoxTruck(), t.x, t.z, t.rot);
    });

    // 主干道巡游电光赛博超跑 (Level 5 酷炫高速街车)
    const sportsSpots = [
      { x: -45, z: -4.5, rot: Math.PI },
      { x: 45, z: 4.5, rot: 0 },
      { x: 4.5, z: -45, rot: Math.PI / 2 },
      { x: -4.5, z: 45, rot: -Math.PI / 2 },
    ];
    sportsSpots.forEach(s => {
      this.addProp(this.factory.createSportsCar(), s.x, s.z, s.rot);
    });

    // 主干道与联络道路上巡游的轿车与出租车 (Level 5)
    const avenueCars = [
      { x: -60, z: 4.5, type: 'sedan', rot: 0 },
      { x: -30, z: -4.5, type: 'taxi', rot: Math.PI },
      { x: 30, z: 4.5, type: 'taxi', rot: 0 },
      { x: 60, z: -4.5, type: 'sedan', rot: Math.PI },
      { x: 4.5, z: -60, type: 'taxi', rot: Math.PI / 2 },
      { x: -4.5, z: -30, type: 'sedan', rot: -Math.PI / 2 },
      { x: 4.5, z: 30, type: 'sedan', rot: Math.PI / 2 },
      { x: -4.5, z: 60, type: 'taxi', rot: -Math.PI / 2 },
      { x: -100, z: 4.5, type: 'police', rot: 0 },
      { x: 100, z: -4.5, type: 'police', rot: Math.PI },
    ];
    avenueCars.forEach(c => {
      const m = c.type === 'police' ? this.factory.createPoliceCar() : this.factory.createCar(c.type);
      this.addProp(m, c.x, c.z, c.rot);
    });

    // 外环大道两侧密集排列路灯与垃圾桶
    for (let pos = -135; pos <= 135; pos += 30) {
      if (Math.abs(pos) < 15) continue;
      // 东西向外环
      this.addProp(this.factory.createStreetLamp(), pos, -92);
      this.addProp(this.factory.createStreetLamp(), pos, 92);
      this.addProp(this.factory.createTrashCan(), pos + 1.8, -92);
      this.addProp(this.factory.createTrashCan(), pos + 1.8, 92);

      // 南北向外环
      this.addProp(this.factory.createStreetLamp(), -92, pos);
      this.addProp(this.factory.createStreetLamp(), 92, pos);
      this.addProp(this.factory.createTrashCan(), -92, pos + 1.8);
      this.addProp(this.factory.createTrashCan(), 92, pos + 1.8);
    }
  }

  // 7. 联络街区致密化填充：内环四方过渡街区 (消除空旷感，全城无死角高密度互动)
  populateNeighborhoodFillers() {
    // A. 东北内环街区 (x: 20~40, z: -40~-20)
    this.addProp(this.factory.createSuburbanHouse(), 28, -28);
    this.addProp(this.factory.createCornerStore(), 32, -18, Math.PI);
    this.addProp(this.factory.createCar('sedan'), 24, -20, Math.PI / 2);
    this.addProp(this.factory.createMediumTree(), 20, -32);
    this.addProp(this.factory.createPineTree(), 36, -32);
    this.addProp(this.factory.createParkBench(), 24, -34);
    this.addProp(this.factory.createFlowerPlanter(), 32, -34);
    this.addProp(this.factory.createSodaCan(), 22, -26);
    this.addProp(this.factory.createCardboardBox(), 34, -22);

    // B. 西北内环街区 (x: -40~-20, z: -40~-20)
    this.addProp(this.factory.createOfficeTower(), -28, -28);
    this.addProp(this.factory.createApartmentBlock(), -30, -18);
    this.addProp(this.factory.createPoliceCar(), -20, -22, 0);
    this.addProp(this.factory.createMediumTree(), -36, -34);
    this.addProp(this.factory.createVendingMachine(), -22, -32);
    this.addProp(this.factory.createTrashCan(), -20, -32);
    this.addProp(this.factory.createTrafficCone(), -24, -18);
    this.addProp(this.factory.createSodaCan(), -26, -18);

    // C. 西南内环生态过渡区 (x: -40~-20, z: 20~40)
    this.addProp(this.factory.createSmallTree(), -24, 24);
    this.addProp(this.factory.createMediumTree(), -34, 24);
    this.addProp(this.factory.createPineTree(), -24, 34);
    this.addProp(this.factory.createPineTree(), -34, 34);
    this.addProp(this.factory.createFlowerPlanter(), -28, 28);
    this.addProp(this.factory.createParkBench(), -28, 32, Math.PI / 2);
    this.addProp(this.factory.createRock(), -30, 26);
    this.addProp(this.factory.createSodaCan(), -25, 27);
    this.addProp(this.factory.createCardboardBox(), -33, 29);

    // D. 东南内环生活街区 (x: 20~40, z: 20~40)
    this.addProp(this.factory.createSuburbanHouse(), 28, 28);
    this.addProp(this.factory.createCornerStore(), 32, 18);
    this.addProp(this.factory.createCar('taxi'), 24, 20, -Math.PI / 2);
    this.addProp(this.factory.createPineTree(), 20, 34);
    this.addProp(this.factory.createMediumTree(), 36, 34);
    this.addProp(this.factory.createMailbox(), 25, 23);
    this.addProp(this.factory.createFireHydrant(), 35, 23);
    this.addProp(this.factory.createCardboardBox(), 23, 27);
    this.addProp(this.factory.createSodaCan(), 31, 25);

    // E. 沿主十字干道铺设等距行道树与路灯 (避免大道中间荒凉)
    for (let pos = -130; pos <= 130; pos += 22) {
      if (Math.abs(pos) < 18) continue;
      // 东西主干道两侧绿化
      this.addProp(this.factory.createSmallTree(), pos, 12);
      this.addProp(this.factory.createSmallTree(), pos, -12);
      // 南北主干道两侧绿化
      this.addProp(this.factory.createSmallTree(), 12, pos);
      this.addProp(this.factory.createSmallTree(), -12, pos);
    }
  }
}
