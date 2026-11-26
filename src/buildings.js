import * as THREE from 'three';
import { getTerrainHeight, STAIR_LINE, roadPoint } from './terrain.js?v=20261127c';

/**
 * 1996 歷史地標資料庫（1:1 對齊 1996年義守大學平面圖.png 與校友歷史考據）
 */
export const LANDMARKS_1996 = [
  {
    id: 'panorama',
    name: '1996 校園全景（老照片視角）',
    tag: '全景',
    pos: [0, 32, -85],
    camPos: [-10, 88, -175],
    lookAt: [6, 16, 68],
    era: '1996 高雄工學院時期 • 歷史全景',
    desc: '對應 1996 年老照片「更早時期的義守大學全景」角度：北側校門口進入後，左側（東側）依序為北側球場、泳池、活動中心、口字型教學大樓、科技大樓與圖書館；中央為紅色舊水塔與行政大樓；右側（西側）為高層男宿與低層女宿；後方最高平台即為操場。'
  },
  {
    id: 'topdown',
    name: '1996 平面圖俯視對照',
    tag: '平面圖',
    pos: [4, 25, 48],
    camPos: [4, 315, 58],
    lookAt: [4, 14, 52],
    era: '1:1 對照「1996年義守大學平面圖」',
    desc: '正北朝上俯視全區配置：依平面圖精準還原校門口、泳池、活動中心、口字型教學大樓、科技大樓、圖書館、行政大樓、男宿（1996 高層）、女宿（1996 低層）及後方操場；當時尚未開發的東北側與遠東側保持原始山林。'
  },
  {
    id: 'gate',
    name: '校門口（警衛塔與高雄客運校車）',
    tag: '校門',
    pos: [-6, 6, -78],
    camPos: [-26, 14, -108],
    lookAt: [-4, 6, -74],
    era: '1996 校門入口',
    desc: '位於校園最北端入口，西側矗立紅磚「高雄工學院」直書校門塔樓，搭配紅色伸縮大門、銀色雙環精神指標及北側網球／籃球場；馬路旁停靠承租自高雄客運的黃紅雙色校車。'
  },
  {
    id: 'pool',
    name: '泳池（1995 露天標準池）',
    tag: '體育',
    pos: [38, 11, 4],
    camPos: [14, 24, -22],
    lookAt: [38, 10, 4],
    era: '1995 年啟用',
    desc: '位於校門口進入後東側（平面圖標示「泳池」處），緊鄰活動中心西側。設有馬賽克磁磚池畔、8 條紅白水道線、萬國旗與南側紅頂遮陽看台。'
  },
  {
    id: 'activity',
    name: '活動中心',
    tag: '核心',
    pos: [68, 14, -10],
    camPos: [40, 26, -40],
    lookAt: [68, 13, -10],
    era: '1996 學生活動中樞',
    desc: '緊鄰泳池東側（平面圖標示「活動中心」處），採三層紅磚外牆搭配白柱平頂雨遮門廳、玻璃三角採光罩、屋頂天窗與側邊雙圓塔樓梯塔，門前設有圓形噴水池。當年大一新生入學典禮即在此頂樓禮堂舉辦。'
  },
  {
    id: 'gym',
    name: '體育館（1996 施工中 → 2001 完工）',
    tag: '4D 演進',
    pos: [78, 15, -36],
    camPos: [46, 28, -68],
    lookAt: [78, 11, -36],
    era: '1996 施工紀實 → 1999 完工啟用',
    desc: '1993 年尚未動工；1996–1997 年正處於鋼筋混凝土柱樑、鷹架護網與黃色塔吊施工階段；至 1999–2001 年完工為宏偉的紅磚紅瓦大屋頂體育館，一樓並設有學生餐廳。切換下方 4D 時間軸即可親眼見證興建過程！'
  },
  {
    id: 'old-teaching',
    name: '教學大樓（口字型四合院建築）',
    tag: '教學',
    pos: [92, 19, 48],
    camPos: [56, 30, 22],
    lookAt: [92, 17, 48],
    era: '創校早期核心教學建築',
    desc: '位於東側山坡（平面圖標示「教學大樓」處），為經典「口字型」四面圍合紅磚建築，中央擁有綠意中庭，四角設八角轉角塔樓，前方有圓環花圃與車道，校車常在前方道路讓學生上下車。'
  },
  {
    id: 'water-tower',
    name: '紅色舊水塔（山坡地標）',
    tag: '消失地標',
    pos: [26, 25, 86],
    camPos: [10, 28, 46],
    lookAt: [26, 23, 86],
    era: '1996 經典記憶 • 八角校徽高架水塔',
    desc: '矗立於行政大樓（綜合大樓）東北側綠坡上的八角校徽高架水塔，採用四支斜向 X 型交叉鋼構塔架，頂端設有紅色尖塔鋼架與夜間航空警示燈，為早期校園天際線經典地標。'
  },
  {
    id: 'hundred-steps',
    name: '125 階長樓梯（行政大樓／綜合大樓前百階）',
    tag: '地標',
    pos: [10.5, 18, 84],
    camPos: [12.3, 16.5, 62],
    lookAt: [8.0, 29, 120],
    era: '校園經典百階（共 125 階）',
    desc: '連接下方校園主幹道與上方行政大樓（綜合大樓）前廣場的筆直花崗岩大階梯，共分 5 段、總計 125 階，兩側設有暖色石材階梯護欄、南洋杉與路燈，是師生每日上下課必經的經典坡道。'
  },
  {
    id: 'admin',
    name: '行政大樓（綜合大樓）',
    tag: '地標',
    pos: [8, 39, 120],
    camPos: [14, 38, 68],
    lookAt: [8, 26, 120],
    era: '校園核心地標 • 中央弧形玻璃帷幕與白色尖塔',
    desc: '坐落於操場正北側、125 階長樓梯頂端的宏偉對稱地標建築（行政大樓即綜合大樓）：正面中央為貫穿全棟的半圓弧形藍色玻璃帷幕塔身，頂部冠以白色斜拉鋼構圓頂與高聳尖塔，左右雙翼為 11 層紅磚搭配白色立柱與紅瓦端塔，夜間頂樓照明格外醒目。'
  },
  {
    id: 'engineering',
    name: '科技大樓（1995 圓柱轉角塔樓）',
    tag: '教學',
    pos: [56, 33, 118],
    camPos: [34, 36, 74],
    lookAt: [56, 28, 118],
    era: '1995 年落成',
    desc: '位於行政大樓東側（平面圖標示「科技大樓」處），雙翼紅磚高樓東角附有辨識度極高的 8 層圓柱形紅磚轉角塔樓與圓錐紅瓦頂，前方栽種整排圓錐柏樹。'
  },
  {
    id: 'library',
    name: '義守大學圖書館',
    tag: '圖書',
    pos: [78, 32, 148],
    camPos: [44, 38, 112],
    lookAt: [78, 28, 148],
    era: '東南側重要館舍',
    desc: '位於校園東南側（平面圖標示「義守大學圖書館」處），為多層紅磚建築搭配轉角圓形大廳與橘紅色圓錐屋頂，與科技大樓、教學大樓構成東側軸線。'
  },
  {
    id: 'sports-field',
    name: '操場與升旗台（升旗台位於南側）',
    tag: '運動',
    pos: [6, 36, 177],
    camPos: [-28, 52, 134],
    lookAt: [6, 34, 182],
    era: '1996 後方最高平台運動場（與男宿六樓同高）',
    desc: '位於校園最南側後方高地（平面圖標示「操場」處），地勢高度正好對齊男宿六樓（兩者之間為一至六樓高的山坡，由六樓連結橋水平直通操場邊）。東西向 8 跑道紅土田徑場與中央草皮足球場，升旗台、三支旗桿、紅頂司令台與五層階梯觀眾席位於操場南側，面向北方操場。'
  },
  {
    id: 'tug-of-war',
    name: '1996 校慶拔河活動（後面操場）',
    tag: '活動',
    pos: [6, 35, 177],
    camPos: [24, 44, 148],
    lookAt: [6, 34, 177],
    era: '1996/10/16 高雄工學院校慶紀實',
    desc: '重現 1996 年 10 月 16 日高雄工學院校慶在後方操場草皮舉辦的拔河比賽：兩隊各 8 名穿著白色系服的學生奮力拉繩，中央有裁判執旗、兩旁有同學圍觀加油與攝影師紀錄。'
  },
  {
    id: 'dorm-male',
    name: '男宿（1996 高層宿舍、六樓操場連結橋與機車陣）',
    tag: '1996 男宿',
    pos: [-39, 36, 127],
    camPos: [-12, 43, 95],
    lookAt: [-39, 29, 134],
    era: '1996 高層雙棟為男宿（1997 年與女宿對調）',
    desc: '位於平面圖「男宿」位置（操場西北側）。因男宿與操場之間隔著一至六樓高的自然山坡，操場地勢正好與男宿六樓同高，六樓設有水平連結橋跨過山坡直通操場！1996 年當時這棟 11 層雙翼紅磚大樓為男生宿舍，直到 1997 年才與低層女宿對調；前方環湖道路路邊停滿 26 輛學生機車。'
  },
  {
    id: 'dorm-female',
    name: '女宿（1996 低層紅瓦宿舍與餐廳）',
    tag: '1996 女宿',
    pos: [-76, 24, 112],
    camPos: [-42, 32, 74],
    lookAt: [-76, 22, 112],
    era: '1996 低層四合院為女宿（1997 年對調）',
    desc: '位於平面圖「女宿」位置（男宿西側）。1996 年當時這棟 4 層低層紅磚紅瓦斜頂宿舍為女生宿舍（附設白色拱形老虎窗、庭園與一樓學生餐廳遮雨棚），於 1997 年改名義守大學後才與高層男宿對調。'
  }
];

export function createCampusBuildings(scene, texLib) {
  const clickableObjects = [];
  const nightEmissiveMaterials = [];
  const animatedParts = {
    flags: [],
    tugGroup: null,
    poolMat: null,
    fountainJet: null,
    beaconMat: null,
    beaconLight: null,
  };

  const registerClickable = (mesh, landmarkId) => {
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.userData.landmarkId = landmarkId;
        child.castShadow = true;
        child.receiveShadow = true;
        clickableObjects.push(child);
      }
    });
  };

  const concreteTex = texLib.facadeFactory('concrete');
  const concreteMat = new THREE.MeshStandardMaterial({
    map: concreteTex.map,
    bumpMap: concreteTex.bumpMap,
    bumpScale: 0.15,
    roughness: 0.84,
  });

  const flatRoofMat = new THREE.MeshStandardMaterial({
    map: texLib.flatRoof.map,
    bumpMap: texLib.flatRoof.bumpMap,
    bumpScale: 0.16,
    roughness: 0.9,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    map: texLib.roofTile.map,
    bumpMap: texLib.roofTile.bumpMap,
    bumpScale: 0.25,
    roughness: 0.68,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    map: texLib.wood.map,
    bumpMap: texLib.wood.bumpMap,
    bumpScale: 0.18,
    roughness: 0.78,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x353c44,
    metalness: 0.6,
    roughness: 0.42,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x2f5373,
    metalness: 0.35,
    roughness: 0.12,
  });

  const makeFacadeMat = (style, repX, repY) => {
    const base = texLib.facadeFactory(style);
    const cloneTex = (t) => {
      const c = t.clone();
      c.needsUpdate = true;
      c.repeat.set(repX, repY);
      return c;
    };
    const mat = new THREE.MeshStandardMaterial({
      map: cloneTex(base.map),
      bumpMap: cloneTex(base.bumpMap),
      bumpScale: 0.2,
      roughnessMap: cloneTex(base.roughnessMap),
      roughness: 0.85,
      emissive: new THREE.Color(0xffcf78),
      emissiveMap: cloneTex(base.emissiveMap),
      emissiveIntensity: 0.0,
    });
    nightEmissiveMaterials.push(mat);
    return mat;
  };

  const buildRedBrickBlock = (w, h, d, {
    style = 'academic',
    repX = 3,
    repY = 2,
    hasPitchedRoof = true,
    hasDormers = false,
    roofScale = 1.0,
  } = {}) => {
    const g = new THREE.Group();
    const wallMatLR = makeFacadeMat(style, Math.max(1, Math.round(repX * (d / w))), repY);
    const wallMatFB = makeFacadeMat(style, repX, repY);

    const boxMats = [wallMatLR, wallMatLR, flatRoofMat, concreteMat, wallMatFB, wallMatFB];
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMats);
    body.position.y = h / 2;
    g.add(body);

    // 地基台座：向下延伸 4m，建築位於坡地邊緣時不會出現懸空縫隙
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 4.0, d + 0.1), concreteMat);
    plinth.position.y = -2.0;
    g.add(plinth);

    const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.55, 0.45, d + 0.55), concreteMat);
    cornice.position.y = h + 0.15;
    g.add(cornice);

    const pillarCount = Math.max(2, Math.floor(w / 6.8));
    for (let i = 0; i <= pillarCount; i++) {
      const px = -w / 2 + (i / pillarCount) * w;
      const pFront = new THREE.Mesh(new THREE.BoxGeometry(0.65, h, 0.45), concreteMat);
      pFront.position.set(px, h / 2, d / 2 + 0.12);
      const pBack = pFront.clone();
      pBack.position.z = -d / 2 - 0.12;
      g.add(pFront, pBack);
    }

    if (hasPitchedRoof) {
      const roofH = Math.min(4.8, Math.max(2.6, Math.min(w, d) * 0.24)) * roofScale;
      const maxDim = Math.max(w, d) + 1.4;
      const roofGeo = new THREE.ConeGeometry(maxDim * 0.72, roofH, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.scale.set((w + 1.4) / maxDim, 1, (d + 1.4) / maxDim);
      roof.position.y = h + 0.3 + roofH / 2;
      g.add(roof);

      if (hasDormers) {
        const dormerOffsets = [-w * 0.25, w * 0.25];
        for (const dx of dormerOffsets) {
          for (const side of [-1, 1]) {
            const dg = new THREE.Group();
            const dBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 2.2), concreteMat);
            const dWin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 0.2), glassMat);
            dWin.position.z = 1.05;
            const dRoof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.1, 4), roofMat);
            dRoof.rotation.y = Math.PI / 4;
            dRoof.position.y = 1.25;
            dg.add(dBody, dWin, dRoof);
            dg.position.set(dx, h + roofH * 0.35, side * (d * 0.3));
            if (side < 0) dg.rotation.y = Math.PI;
            g.add(dg);
          }
        }
      }
    }
    return g;
  };

  // =========================================================================
  // 1. 校門口（警衛塔、精神指標、高雄客運校車、北側網球／籃球場）
  // =========================================================================
  {
    const gateGroup = new THREE.Group();
    const gy = getTerrainHeight(-6, -78);
    gateGroup.position.set(-6, gy, -78);

    const signMat = new THREE.MeshStandardMaterial({ map: texLib.gateTowerSign, roughness: 0.72 });
    const towerBrick = makeFacadeMat('academic', 1, 2);
    const towerMats = [towerBrick, towerBrick, flatRoofMat, concreteMat, towerBrick, signMat];
    const westTower = new THREE.Mesh(new THREE.BoxGeometry(5.2, 8.8, 4.8), towerMats);
    westTower.position.set(-7.8, 4.4, 0);
    gateGroup.add(westTower);
    animatedParts.gateSignMat = signMat;

    const westEaves = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.55, 6.4), concreteMat);
    westEaves.position.set(-7.8, 8.95, 0);
    const westRoof = new THREE.Mesh(new THREE.ConeGeometry(4.9, 2.8, 4), roofMat);
    westRoof.rotation.y = Math.PI / 4;
    westRoof.position.set(-7.8, 10.6, 0);
    const westSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.4, 6), darkSteelMat);
    westSpire.position.set(-7.8, 12.6, 0);
    gateGroup.add(westEaves, westRoof, westSpire);

    const guardBox = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.5, 1.4), glassMat);
    guardBox.position.set(-7.8, 1.25, -2.5);
    gateGroup.add(guardBox);

    const eastTower = buildRedBrickBlock(3.8, 5.4, 3.8, {
      style: 'academic', repX: 1, repY: 1, hasPitchedRoof: false
    });
    // 東側門柱外移，避免壓到主幹道路緣石
    eastTower.position.set(7.6, 0, 0);
    const eastEaves = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.45, 5.0), concreteMat);
    eastEaves.position.set(7.6, 5.55, 0);
    const eastRoof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.1, 4), roofMat);
    eastRoof.rotation.y = Math.PI / 4;
    eastRoof.position.set(7.6, 6.8, 0);
    gateGroup.add(eastTower, eastEaves, eastRoof);

    // 紅色伸縮大門（橫跨兩門柱之間）
    const gateRedMat = new THREE.MeshStandardMaterial({ color: 0xb52b23, metalness: 0.35, roughness: 0.55 });
    for (let gx = -4.8; gx <= 5.4; gx += 0.48) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.65, 0.14), gateRedMat);
      slat.position.set(gx, 0.85, 0);
      gateGroup.add(slat);
    }
    const gateTopRail = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.12, 0.18), gateRedMat);
    gateTopRail.position.set(0.3, 1.62, 0);
    gateGroup.add(gateTopRail);

    // 校門內側紅瓦警衛／收發室附屬小屋 (-14, -54)，退離道路
    const innerBooth = buildRedBrickBlock(6.2, 4.2, 5.2, {
      style: 'academic', repX: 1, repY: 1, hasPitchedRoof: true
    });
    innerBooth.position.set(-8.0, getTerrainHeight(-14, -54) - gy, 24);
    gateGroup.add(innerBooth);

    // 精神指標（移至進校大道西側草地，不立於車道）
    const monument = new THREE.Group();
    monument.position.set(-14, getTerrainHeight(-20, -84) - gy, -6);
    const monPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 7.6, 12),
      new THREE.MeshStandardMaterial({ color: 0xd0d5dc, metalness: 0.78, roughness: 0.25 })
    );
    monPole.position.y = 3.8;
    const monRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.12, 10, 28),
      new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.75, roughness: 0.28 })
    );
    monRing.position.y = 8.4;
    const monDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.42, 1.42, 0.18, 24),
      new THREE.MeshStandardMaterial({ map: texLib.spiritEmblem, roughness: 0.35, metalness: 0.2 })
    );
    monDisc.rotation.x = Math.PI / 2;
    monDisc.position.y = 8.4;
    monument.add(monPole, monRing, monDisc);
    gateGroup.add(monument);

    // 1996 高雄客運校車
    const bus = new THREE.Group();
    const busSideMat = new THREE.MeshStandardMaterial({ map: texLib.busSide, roughness: 0.42 });
    const busFrontMat = new THREE.MeshStandardMaterial({ map: texLib.busFront, roughness: 0.42 });
    const busRoofMat = new THREE.MeshStandardMaterial({ color: 0xefece4, roughness: 0.45 });
    const busMats = [busSideMat, busSideMat, busRoofMat, darkSteelMat, busFrontMat, busFrontMat];
    const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.65, 2.75, 9.6), busMats);
    busBody.position.y = 1.82;
    const acUnit = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.38, 3.6), concreteMat);
    acUnit.position.set(0, 3.38, -0.5);
    bus.add(busBody, acUnit);
    const tireGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.36, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1d21, roughness: 0.85 });
    [[-1.24, 3.0], [1.24, 3.0], [-1.24, -2.9], [1.24, -2.9]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(wx, 0.48, wz);
      bus.add(tire);
    });
    bus.position.set(6.4, getTerrainHeight(0.4, -64) - gy, 14);
    bus.rotation.y = 0.08;
    gateGroup.add(bus);

    // 北側 2x2 網球／籃球場 (26, -42)
    const courtMat = new THREE.MeshStandardMaterial({ map: texLib.courtBlue, roughness: 0.82 });
    const courtsGroup = new THREE.Group();
    courtsGroup.position.set(32, getTerrainHeight(26, -42) - gy, 36);
    courtsGroup.rotation.y = -0.25;
    for (const cx of [-7, 7]) {
      for (const cz of [-9, 9]) {
        const court = new THREE.Mesh(new THREE.BoxGeometry(12, 0.24, 16), courtMat);
        court.position.set(cx, 0.12, cz);
        courtsGroup.add(court);
      }
    }
    gateGroup.add(courtsGroup);

    scene.add(gateGroup);
    registerClickable(gateGroup, 'gate');
  }

  // =========================================================================
  // 2. 泳池（1995 露天標準池 + 萬國旗 + 看台 + 西側附屬棟）
  // =========================================================================
  {
    const poolGroup = new THREE.Group();
    const py = getTerrainHeight(38, 4);
    poolGroup.position.set(38, py + 0.1, 4);
    poolGroup.rotation.y = -0.32;

    const mosaicDeckMat = new THREE.MeshStandardMaterial({
      map: texLib.poolDeckMosaic.map,
      bumpMap: texLib.poolDeckMosaic.bumpMap,
      bumpScale: 0.12,
      roughness: 0.72,
    });
    // 池畔加厚向下延伸，坡地邊緣不懸空
    const deck = new THREE.Mesh(new THREE.BoxGeometry(27, 1.65, 18), mosaicDeckMat);
    deck.position.y = -0.275;
    poolGroup.add(deck);

    const poolWaterMat = new THREE.MeshStandardMaterial({
      map: texLib.poolWater,
      roughness: 0.12,
      metalness: 0.18,
    });
    animatedParts.poolMat = poolWaterMat;

    const water = new THREE.Mesh(new THREE.BoxGeometry(22, 0.25, 13), poolWaterMat);
    water.position.y = 0.48;
    poolGroup.add(water);

    const laneMatRed = new THREE.MeshStandardMaterial({ color: 0xd94432, roughness: 0.5 });
    const laneMatWhite = new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.5 });
    [-4.2, -1.4, 1.4, 4.2].forEach((lz, i) => {
      const lane = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 21.6, 6),
        i % 2 === 0 ? laneMatRed : laneMatWhite
      );
      lane.rotation.z = Math.PI / 2;
      lane.position.set(0, 0.62, lz);
      poolGroup.add(lane);
    });

    for (let i = 0; i < 6; i++) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.65), concreteMat);
      block.position.set(-11.4, 0.8, -5.0 + i * 2.0);
      poolGroup.add(block);
    }

    // 南側紅頂遮陽看台
    // 看台階梯實心落地（不再一階一階懸空）
    for (let s = 0; s < 4; s++) {
      const topY = 1.0 + s * 0.45;
      const stepH = topY + 1.0;
      const step = new THREE.Mesh(new THREE.BoxGeometry(17, stepH, 0.8), concreteMat);
      step.position.set(0, topY - stepH / 2, 10.2 + s * 0.75);
      poolGroup.add(step);
    }
    const standRoof = new THREE.Mesh(new THREE.BoxGeometry(18, 0.25, 4.4), roofMat);
    standRoof.position.set(0, 4.6, 11.8);
    standRoof.rotation.x = -0.1;
    poolGroup.add(standRoof);
    // 遮陽棚支撐柱（原本屋頂懸空）
    for (const cx of [-7.5, 0, 7.5]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.75, 8), darkSteelMat);
      col.position.set(cx, 1.875, 13.6);
      poolGroup.add(col);
    }

    // 萬國旗：掛在兩端旗桿之間的繩索上（原本漂浮空中）
    const buntingColors = [0xd93829, 0x2665a6, 0xf0c52c, 0x2f8a4b, 0xf4f4f2];
    for (let f = 0; f < 14; f++) {
      const fx = -10 + f * 1.5;
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.45, 0.04),
        new THREE.MeshStandardMaterial({ color: buntingColors[f % buntingColors.length] })
      );
      flag.position.set(fx, 3.92, 0);
      poolGroup.add(flag);
    }
    const buntingRope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 22.4, 6), darkSteelMat);
    buntingRope.rotation.z = Math.PI / 2;
    buntingRope.position.set(0, 4.17, 0);
    poolGroup.add(buntingRope);
    for (const px of [-11.2, 11.2]) {
      const bPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.8, 8), darkSteelMat);
      bPole.position.set(px, 0.55 + 1.9, 0);
      poolGroup.add(bPole);
    }

    // 泳池西側紅瓦斜頂附屬棟 (對應平面圖泳池旁紅屋頂建築)
    const poolAnnex = buildRedBrickBlock(13.5, 9.2, 10.5, {
      style: 'academic', repX: 2, repY: 2, hasPitchedRoof: true
    });
    poolAnnex.position.set(-21.5, 0, 2.0);
    poolGroup.add(poolAnnex);

    scene.add(poolGroup);
    registerClickable(poolGroup, 'pool');
    animatedParts.eraPool = poolGroup;
  }

  // =========================================================================
  // 3. 活動中心 (位於泳池東側 62, -4：平頂雨遮 + 玻璃三角採光罩 + 噴水池)
  // =========================================================================
  {
    const actGroup = new THREE.Group();
    // 東移避開泳池池畔與水面（原本主體穿入泳池東北角）
    const ay = getTerrainHeight(68, -10);
    actGroup.position.set(68, ay, -10);
    actGroup.rotation.y = -0.32;

    const main = buildRedBrickBlock(26, 13.0, 20.0, {
      style: 'academic', repX: 4, repY: 2, hasPitchedRoof: true, hasDormers: true
    });
    actGroup.add(main);

    // 屋脊採光天窗：抬高至屋頂上方，避免被斜屋頂吞沒或屋頂尖端穿出
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(8.0, 2.0, 3.4), concreteMat);
    skylight.position.set(0, 17.4, 0);
    const skyGlass = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.7, 3.5), glassMat);
    skyGlass.position.set(0, 17.75, 0);
    actGroup.add(skylight, skyGlass);

    // 面向北側道路的門廳階梯、雙柱平頂雨遮與玻璃三角採光罩
    const stairs = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.75, 5.2), concreteMat);
    stairs.position.set(0, 0.37, -12.4);
    actGroup.add(stairs);

    for (const cx of [-4.6, -3.6, 3.6, 4.6]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 6.4, 12), concreteMat);
      col.position.set(cx, 3.9, -12.6);
      actGroup.add(col);
    }
    const flatCanopy = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.65, 4.6), concreteMat);
    flatCanopy.position.set(0, 7.3, -12.0);
    actGroup.add(flatCanopy);

    const gableShape = new THREE.Shape();
    gableShape.moveTo(-4.6, 0);
    gableShape.lineTo(0, 2.35);
    gableShape.lineTo(4.6, 0);
    gableShape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 3.4, bevelEnabled: false });
    const gableMesh = new THREE.Mesh(gableGeo, glassMat);
    gableMesh.position.set(0, 7.62, -13.6);
    actGroup.add(gableMesh);

    // 圓形噴水池
    const fountain = new THREE.Group();
    fountain.position.set(0, 0, -19.5);
    const basinWall = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 5.3, 0.7, 32, 1, true),
      concreteMat
    );
    basinWall.position.y = 0.35;
    const basinRim = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.22, 8, 32), concreteMat);
    basinRim.rotation.x = Math.PI / 2;
    basinRim.position.y = 0.7;
    const fWater = new THREE.Mesh(
      new THREE.CylinderGeometry(5.05, 5.05, 0.15, 32),
      new THREE.MeshStandardMaterial({ map: texLib.poolWater, roughness: 0.12, metalness: 0.18 })
    );
    fWater.position.y = 0.45;
    const rockery = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1, 1),
      new THREE.MeshStandardMaterial({ color: 0x4b4e52, roughness: 0.9 })
    );
    rockery.position.y = 0.75;
    const fJet = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 2.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xdff7ff, transparent: true, opacity: 0.65, roughness: 0.1 })
    );
    fJet.rotation.x = Math.PI;
    fJet.position.y = 2.4;
    animatedParts.fountainJet = fJet;
    fountain.add(basinWall, basinRim, fWater, rockery, fJet);
    actGroup.add(fountain);
    animatedParts.eraFountain = fountain;

    // 側邊樓梯電梯塔與雙圓塔
    const sideTower = buildRedBrickBlock(6.8, 16.0, 7.5, {
      style: 'academic', repX: 1, repY: 3, hasPitchedRoof: false
    });
    sideTower.position.set(-15.2, 0, 2.0);
    actGroup.add(sideTower);
    for (const tx of [-16.7, -13.7]) {
      const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 1.8, 12), concreteMat);
      turretBase.position.set(tx, 16.9, 2.0);
      const turretRoof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.4, 12), roofMat);
      turretRoof.position.set(tx, 18.5, 2.0);
      actGroup.add(turretBase, turretRoof);
    }

    scene.add(actGroup);
    registerClickable(actGroup, 'activity');
  }

  // =========================================================================
  // 4. 教學大樓（東側口字型四合院建築 92, 48）
  // =========================================================================
  {
    const teachGroup = new THREE.Group();
    const ty = getTerrainHeight(92, 48);
    teachGroup.position.set(92, ty, 48);
    teachGroup.rotation.y = -0.62;

    // 四面圍合「口字型」四合院
    const backWing = buildRedBrickBlock(28, 12.0, 8.2, {
      style: 'academic', repX: 4, repY: 2, hasPitchedRoof: true, hasDormers: true
    });
    backWing.position.set(0, 0, 9.2);

    const frontWing = buildRedBrickBlock(28, 12.0, 8.2, {
      style: 'academic', repX: 4, repY: 2, hasPitchedRoof: true, hasDormers: true
    });
    frontWing.position.set(0, 0, -9.2);

    const leftWing = buildRedBrickBlock(8.2, 11.8, 10.2, {
      style: 'academic', repX: 2, repY: 2, hasPitchedRoof: true
    });
    leftWing.position.set(-9.9, 0, 0);

    const rightWing = leftWing.clone();
    rightWing.position.set(9.9, 0, 0);

    teachGroup.add(backWing, frontWing, leftWing, rightWing);

    // 兩側八角轉角小塔
    const octBrick = makeFacadeMat('academic', 1, 2);
    for (const ox of [-14.2, 14.2]) {
      // 塔身加高至翼樓屋簷之上，塔頂不再與翼樓屋頂互相穿插
      const octBody = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 15.0, 8), octBrick);
      octBody.position.set(ox, 7.5, -9.2);
      const octRoof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 8), roofMat);
      octRoof.position.set(ox, 16.2, -9.2);
      teachGroup.add(octBody, octRoof);
    }

    // 中央突出門廳
    const portal = new THREE.Mesh(new THREE.BoxGeometry(9.5, 9.2, 3.8), concreteMat);
    portal.position.set(0, 4.6, -14.5);
    const portalRoof = new THREE.Mesh(new THREE.ConeGeometry(7.0, 2.5, 4), roofMat);
    portalRoof.rotation.y = Math.PI / 4;
    portalRoof.scale.set(1.04, 1, 0.465); // 屋頂深度貼合門廳，不再插入前翼樓牆面
    portalRoof.position.set(0, 10.4, -14.5);
    teachGroup.add(portal, portalRoof);

    // 口字型中央綠意中庭
    const innerCourt = new THREE.Mesh(
      new THREE.BoxGeometry(11.4, 0.25, 10.0),
      new THREE.MeshStandardMaterial({ color: 0x4b8742, roughness: 0.92 })
    );
    innerCourt.position.set(0, 0.15, 0);
    teachGroup.add(innerCourt);

    // 前方半圓形圓環花圃
    const gardenRing = new THREE.Mesh(
      new THREE.CylinderGeometry(6.2, 6.5, 0.45, 24),
      new THREE.MeshStandardMaterial({ color: 0x457d3d, roughness: 0.9 })
    );
    gardenRing.position.set(0, 0.22, -23.5);
    const curbRing = new THREE.Mesh(new THREE.TorusGeometry(6.3, 0.22, 6, 24), concreteMat);
    curbRing.rotation.x = Math.PI / 2;
    curbRing.position.set(0, 0.4, -23.5);
    teachGroup.add(gardenRing, curbRing);

    scene.add(teachGroup);
    registerClickable(teachGroup, 'old-teaching');
  }

  // =========================================================================
  // 5. 紅色舊水塔 (26, 86：八角校徽槽體 + X交叉鋼構 + 紅色尖塔鋼架)
  // =========================================================================
  {
    const wtGroup = new THREE.Group();
    const wy = getTerrainHeight(26, 86);
    wtGroup.position.set(26, wy, 86);

    const redSteelMat = new THREE.MeshStandardMaterial({ color: 0xc83929, metalness: 0.35, roughness: 0.45 });
    const octTankMat = new THREE.MeshStandardMaterial({ map: texLib.waterTowerEmblem, roughness: 0.42, metalness: 0.18 });

    const pad = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.8, 6.8), concreteMat);
    pad.position.y = 0.4;
    wtGroup.add(pad);

    const fenceMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 2.2, 5.6),
      new THREE.MeshStandardMaterial({ color: 0x9aa2aa, wireframe: true })
    );
    fenceMesh.position.y = 1.8;
    wtGroup.add(fenceMesh);

    const legGeo = new THREE.CylinderGeometry(0.24, 0.32, 12.6, 8);
    [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, redSteelMat);
      leg.position.set(lx * 0.8, 6.2, lz * 0.8);
      leg.rotation.z = lx > 0 ? 0.095 : -0.095;
      leg.rotation.x = lz > 0 ? -0.095 : 0.095;
      wtGroup.add(leg);
    });

    const tiers = [2.2, 5.6, 9.0, 11.4];
    tiers.forEach((ry, idx) => {
      const span = 4.2 - idx * 0.25;
      const ring = new THREE.Mesh(new THREE.BoxGeometry(span, 0.22, span), redSteelMat);
      ring.position.y = ry;
      wtGroup.add(ring);

      if (idx < tiers.length - 1) {
        const nextY = tiers[idx + 1];
        const midY = (ry + nextY) / 2;
        const braceLen = Math.hypot(span, nextY - ry);
        const angle = Math.atan2(nextY - ry, span);
        for (const sideZ of [-span / 2, span / 2]) {
          for (const dir of [-1, 1]) {
            const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, braceLen, 6), redSteelMat);
            brace.position.set(0, midY, sideZ);
            brace.rotation.z = dir * (Math.PI / 2 - angle);
            wtGroup.add(brace);
          }
        }
      }
    });

    const catwalk = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.85, 0.22, 8), redSteelMat);
    catwalk.position.y = 11.7;
    const rail = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.07, 6, 8), redSteelMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = 12.6;
    wtGroup.add(catwalk, rail);

    const tankBottom = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 2.2, 1.3, 8), redSteelMat);
    tankBottom.position.y = 12.4;
    const tankMid = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.65, 2.8, 8), octTankMat);
    tankMid.position.y = 14.4;
    const tankTopCap = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.65, 0.9, 8), redSteelMat);
    tankTopCap.position.y = 16.25;

    const spireLattice = new THREE.Mesh(
      new THREE.ConeGeometry(1.9, 4.4, 4),
      new THREE.MeshStandardMaterial({ color: 0xc83929, wireframe: true })
    );
    spireLattice.position.y = 18.8;

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff3b2f,
      emissive: 0xff2200,
      emissiveIntensity: 0.4,
    });
    animatedParts.beaconMat = beaconMat;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), beaconMat);
    beacon.position.y = 21.1;

    const beaconLight = new THREE.PointLight(0xff3311, 0, 28, 1.5);
    beaconLight.position.set(26, wy + 21.4, 86);
    scene.add(beaconLight);
    animatedParts.beaconLight = beaconLight;

    wtGroup.add(tankBottom, tankMid, tankTopCap, spireLattice, beacon);
    scene.add(wtGroup);
    registerClickable(wtGroup, 'water-tower');
  }

  // =========================================================================
  // 5b. 125 階長樓梯（行政大樓／綜合大樓前百階：5段×25階 = 125階）
  // =========================================================================
  {
    // 與地形共用同一條斜面基準線，草坡不會穿出階梯
    const { x1, z1, x2, z2, y1, y2 } = STAIR_LINE;

    const dx = x2 - x1;
    const dz = z2 - z1;
    const L = Math.hypot(dx, dz);
    const H = y2 - y1;
    const yaw = Math.atan2(dx, dz);
    const slopePitch = -Math.atan2(H, L);

    const stairsGroup = new THREE.Group();
    stairsGroup.position.set(x1, y1, z1);
    stairsGroup.rotation.y = yaw;

    // 底部實心混凝土斜坡結構支撐
    const rampLen = Math.hypot(L, H);
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.4, rampLen), concreteMat);
    ramp.position.set(0, H / 2 - 0.72, L / 2);
    ramp.rotation.x = slopePitch;
    stairsGroup.add(ramp);

    // 125 階花崗岩階梯（5 段 × 25 階）+ 4 個中間休息平台
    const graniteMat = new THREE.MeshStandardMaterial({
      map: texLib.graniteSteps.map,
      bumpMap: texLib.graniteSteps.bumpMap,
      bumpScale: 0.12,
      roughness: 0.76,
    });

    const numFlights = 5;
    const stepsPerFlight = 25;
    const totalSteps = numFlights * stepsPerFlight;
    const landingDepth = 1.1;
    const stepD = (L - (numFlights - 1) * landingDepth) / totalSteps;
    const stepH = H / totalSteps;

    const treadGeo = new THREE.BoxGeometry(7.2, stepH + 0.08, stepD + 0.06);
    const treadsInst = new THREE.InstancedMesh(treadGeo, graniteMat, totalSteps);
    treadsInst.castShadow = true;
    treadsInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let curZ = 0;
    let curY = 0;
    let stepIdx = 0;

    for (let f = 0; f < numFlights; f++) {
      for (let s = 0; s < stepsPerFlight; s++) {
        dummy.position.set(0, curY + stepH / 2, curZ + stepD / 2);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        treadsInst.setMatrixAt(stepIdx++, dummy.matrix);
        curZ += stepD;
        curY += stepH;
      }
      if (f < numFlights - 1) {
        const landing = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, landingDepth + 0.08), graniteMat);
        landing.position.set(0, curY - 0.1, curZ + landingDepth / 2);
        stairsGroup.add(landing);
        curZ += landingDepth;
      }
    }
    stairsGroup.add(treadsInst);

    // 兩側暖砂岩斜坡護欄牆 + 壓頂石 + 6 對平台石柱
    const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xd6c3a5, roughness: 0.82 });
    const copingMat = new THREE.MeshStandardMaterial({ color: 0xbfa886, roughness: 0.78 });

    for (const sideX of [-3.85, 3.85]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.35, rampLen + 0.4), sandstoneMat);
      wall.position.set(sideX, H / 2 + 0.35, L / 2);
      wall.rotation.x = slopePitch;

      const coping = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, rampLen + 0.45), copingMat);
      coping.position.set(sideX, H / 2 + 1.05, L / 2);
      coping.rotation.x = slopePitch;
      stairsGroup.add(wall, coping);

      for (let p = 0; p <= numFlights; p++) {
        const t = p / numFlights;
        const pz = t * L;
        const py = t * H;
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.65, 0.68), copingMat);
        pier.position.set(sideX, py + 0.65, pz);
        stairsGroup.add(pier);
      }
    }

    // 頂部廣場邊緣 6 支短石柱 (Bollards)
    for (let b = 0; b < 6; b++) {
      const bx = -2.75 + b * 1.1;
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.72, 10), copingMat);
      bollard.position.set(bx, H + 0.36, L + 0.4);
      stairsGroup.add(bollard);
    }

    // 兩側 5 對直立南洋杉 + 2 對經典深綠公園燈
    const pineBarkMat = new THREE.MeshStandardMaterial({ color: 0x5c4330, roughness: 0.9 });
    const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x2e5e2e, roughness: 0.85 });
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5;
      const pz = t * L;
      const py = t * H;
      for (const sideX of [-4.85, 4.85]) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6), pineBarkMat);
        trunk.position.set(sideX, py + 1.0, pz);
        const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.2, 8), pineLeafMat);
        tier1.position.set(sideX, py + 3.1, pz);
        const tier2 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.6, 8), pineLeafMat);
        tier2.position.set(sideX, py + 4.8, pz);
        stairsGroup.add(trunk, tier1, tier2);
      }
    }

    const parkPoleMat = new THREE.MeshStandardMaterial({ color: 0x2c3c34, metalness: 0.4, roughness: 0.55 });
    const parkBulbMat = new THREE.MeshStandardMaterial({ color: 0xf4f2e8, emissive: 0xffd27d, emissiveIntensity: 0.2 });
    for (const t of [0.28, 0.72]) {
      const lz = t * L;
      const ly = t * H;
      for (const sideX of [-4.45, 4.45]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 3.4, 8), parkPoleMat);
        pole.position.set(sideX, ly + 1.7, lz);
        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), parkBulbMat);
        globe.position.set(sideX, ly + 3.55, lz);
        stairsGroup.add(pole, globe);
      }
    }

    scene.add(stairsGroup);
    registerClickable(stairsGroup, 'hundred-steps');
  }

  // =========================================================================
  // 6. 行政大樓（綜合大樓）(8, 120：操場正北側 11 層對稱弧形玻璃帷幕地標)
  // =========================================================================
  {
    const adminGroup = new THREE.Group();
    const ay = getTerrainHeight(8, 120);
    adminGroup.position.set(8, ay, 120);
    adminGroup.rotation.y = -0.10;

    // 主體 11 層對稱紅磚主樓 + 連續紅瓦女兒牆簷口
    const mainBody = buildRedBrickBlock(44, 28.5, 15.0, {
      style: 'academic', repX: 7, repY: 5, hasPitchedRoof: false
    });
    const parapetTrim = new THREE.Mesh(new THREE.BoxGeometry(44.8, 0.75, 15.8), roofMat);
    parapetTrim.position.y = 29.1;
    adminGroup.add(mainBody, parapetTrim);

    // 左右對稱突出端翼塔樓
    const leftWing = buildRedBrickBlock(8.6, 29.8, 16.8, {
      style: 'academic', repX: 2, repY: 5, hasPitchedRoof: true
    });
    leftWing.position.set(-19.2, 0, -0.4);
    const rightWing = leftWing.clone();
    rightWing.position.set(19.2, 0, -0.4);
    adminGroup.add(leftWing, rightWing);

    // 中央半圓弧形藍色玻璃帷幕塔身 (對照 215905.png & 222344.png)
    const curtainMat = new THREE.MeshStandardMaterial({
      map: texLib.curtainTower.map,
      roughnessMap: texLib.curtainTower.roughnessMap,
      roughness: 0.45,
      metalness: 0.28,
      emissive: new THREE.Color(0xffe4a8),
      emissiveMap: texLib.curtainTower.emissiveMap,
      emissiveIntensity: 0.0,
    });
    nightEmissiveMaterials.push(curtainMat);

    const centralTower = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 30.5, 24), curtainMat);
    centralTower.position.set(0, 15.25, -6.2);
    const centralPlinth = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.55, 4.0, 24), concreteMat);
    centralPlinth.position.set(0, -2.0, -6.2);
    adminGroup.add(centralTower, centralPlinth);

    // 塔頂階梯圓鼓與紅瓦錐頂（與中央玻璃圓塔同軸 z = -6.2）
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.9, 4.9, 1.6, 24), concreteMat);
    drum.position.set(0, 31.2, -6.2);
    const drumCone = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.5, 24), roofMat);
    drumCone.position.set(0, 32.7, -6.2);
    adminGroup.add(drum, drumCone);

    // 經典白色斜拉鋼構桁架 (White Diagonal Truss Struts)
    const strutLen = Math.hypot(9.5, 4.0);
    const strutAngle = Math.atan2(4.0, 9.5);
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(strutLen, 0.36, 0.42), concreteMat);
    strutL.position.set(-4.75, 31.4, -6.2);
    strutL.rotation.z = strutAngle;
    const strutR = new THREE.Mesh(new THREE.BoxGeometry(strutLen, 0.36, 0.42), concreteMat);
    strutR.position.set(4.75, 31.4, -6.2);
    strutR.rotation.z = -strutAngle;
    adminGroup.add(strutL, strutR);

    // 中央白色高聳尖塔與夜間頂樓照明燈帶 (215846.png)
    const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 2.4, 12), concreteMat);
    spireBase.position.set(0, 34.4, -6.2);
    const spireTop = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.35, 4.2, 8), concreteMat);
    spireTop.position.set(0, 37.6, -6.2);
    adminGroup.add(spireBase, spireTop);

    const roofLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xfff2cc),
      emissiveIntensity: 0.0,
    });
    nightEmissiveMaterials.push(roofLightMat);
    const roofLightStrip = new THREE.Mesh(new THREE.BoxGeometry(22, 0.32, 0.4), roofLightMat);
    roofLightStrip.position.set(0, 29.6, -7.8);
    adminGroup.add(roofLightStrip);

    // 一樓正面挑高迎賓門廊 (直對 125 階長樓梯頂端)
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.65, 4.0), concreteMat);
    porchRoof.position.set(0, 4.2, -9.6);
    adminGroup.add(porchRoof);
    for (const cx of [-5.6, -2.4, 2.4, 5.6]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 4.2, 12), concreteMat);
      col.position.set(cx, 2.1, -11.0);
      adminGroup.add(col);
    }

    scene.add(adminGroup);
    registerClickable(adminGroup, 'admin');
  }

  // =========================================================================
  // 7. 科技大樓 (56, 118：與行政大樓保持淨距 + 1995 經典圓柱轉角塔樓 + 柏樹排)
  // =========================================================================
  {
    const engGroup = new THREE.Group();
    const ey = getTerrainHeight(56, 118);
    engGroup.position.set(56, ey, 118);
    engGroup.rotation.y = -0.35;

    const main = buildRedBrickBlock(25, 22, 14.0, {
      style: 'academic', repX: 4, repY: 4, hasPitchedRoof: true, hasDormers: true
    });
    const wing = buildRedBrickBlock(11.5, 19.5, 13, {
      style: 'academic', repX: 2, repY: 3, hasPitchedRoof: true
    });
    wing.position.set(-13.5, 0, 2.0);
    const arcade = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 2.8), concreteMat);
    arcade.position.set(0, 2.1, -8.0);
    engGroup.add(main, wing, arcade);

    // 1995 圓柱形紅磚轉角塔樓
    const cylMat = makeFacadeMat('academic', 3, 4);
    const cylTower = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 23.0, 20), cylMat);
    cylTower.position.set(14.0, 11.5, -3.5);
    const cylPlinth = new THREE.Mesh(new THREE.CylinderGeometry(5.55, 5.55, 4.0, 20), concreteMat);
    cylPlinth.position.set(14.0, -2.0, -3.5);
    const cylCornice = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 0.5, 20), concreteMat);
    cylCornice.position.set(14.0, 23.1, -3.5);
    const cylRoof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 3.2, 20), roofMat);
    cylRoof.position.set(14.0, 24.9, -3.5);
    engGroup.add(cylTower, cylPlinth, cylCornice, cylRoof);

    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.45, 23.0, 0.45), concreteMat);
      rib.position.set(14.0 + Math.cos(ang) * 5.55, 11.5, -3.5 + Math.sin(ang) * 5.55);
      engGroup.add(rib);
    }

    const cypressMat = new THREE.MeshStandardMaterial({ color: 0x264d24, roughness: 0.88 });
    for (let i = 0; i < 6; i++) {
      const cyTree = new THREE.Mesh(new THREE.ConeGeometry(1.15, 4.6, 10), cypressMat);
      cyTree.position.set(-8 + i * 3.8, 2.3, -15);
      engGroup.add(cyTree);
    }

    scene.add(engGroup);
    registerClickable(engGroup, 'engineering');
    animatedParts.eraTech = engGroup;
  }

  // =========================================================================
  // 8. 義守大學圖書館 (78, 148：東南側多層紅磚大樓 + 圓柱紅頂圓廳)
  // =========================================================================
  {
    const libGroup = new THREE.Group();
    const ly = getTerrainHeight(78, 148);
    libGroup.position.set(78, ly, 148);
    libGroup.rotation.y = -0.42;

    const main = buildRedBrickBlock(22, 18.5, 13.5, {
      style: 'academic', repX: 3, repY: 3, hasPitchedRoof: true, hasDormers: true
    });
    libGroup.add(main);

    // 經典圓形轉角閱讀廳與橘紅錐頂
    const rotMat = makeFacadeMat('academic', 2, 3);
    const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 19.5, 18), rotMat);
    rotunda.position.set(-10.5, 9.75, -5.5);
    const rotPlinth = new THREE.Mesh(new THREE.CylinderGeometry(5.25, 5.25, 4.0, 18), concreteMat);
    rotPlinth.position.set(-10.5, -2.0, -5.5);
    const rotCornice = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.5, 18), concreteMat);
    rotCornice.position.set(-10.5, 19.6, -5.5);
    const rotDome = new THREE.Mesh(new THREE.ConeGeometry(5.9, 3.6, 18), roofMat);
    rotDome.position.set(-10.5, 21.6, -5.5);
    libGroup.add(rotunda, rotPlinth, rotCornice, rotDome);

    scene.add(libGroup);
    registerClickable(libGroup, 'library');
  }

  // =========================================================================
  // 9. 操場與升旗台 (6, 177：海拔 33.5m 與男宿六樓等高；升旗台與觀眾席位在操場南側 +Z)
  // =========================================================================
  {
    const fieldGroup = new THREE.Group();
    const fy = getTerrainHeight(6, 177);
    fieldGroup.position.set(6, fy + 0.16, 177);

    const fieldPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(98, 56),
      new THREE.MeshStandardMaterial({
        map: texLib.sportsField,
        roughness: 0.88,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      })
    );
    fieldPlate.rotation.x = -Math.PI / 2;
    fieldPlate.position.y = 0.08;
    fieldGroup.add(fieldPlate);

    const goalMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 });
    for (const gx of [-22, 22]) {
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), goalMat);
      postL.position.set(gx, 1.1, -3.2);
      const postR = postL.clone();
      postR.position.z = 3.2;
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.4, 6), goalMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(gx, 2.2, 0);
      fieldGroup.add(postL, postR, crossbar);
    }

    // 升旗台、三支旗桿、紅頂司令台與 5 層實心落地觀眾席：位於操場南側 (+Z)，朝北 (-Z) 面向操場
    const southStand = new THREE.Group();
    southStand.position.set(0, 0, 29.2);

    // 突出於看台前方的升旗台基座（實心下延接地，不懸空）
    const podium = new THREE.Mesh(new THREE.BoxGeometry(9.0, 2.2, 3.0), concreteMat);
    podium.position.set(0, -0.1, -0.3);
    southStand.add(podium);

    // 5 層實心落地階梯觀眾席（向南逐層升高，面向北側跑道）
    for (let step = 0; step < 5; step++) {
      const topY = (step + 1) * 0.72;
      const h = topY + 1.2;
      const bench = new THREE.Mesh(new THREE.BoxGeometry(36, h, 1.5), concreteMat);
      bench.position.set(0, topY - h / 2, 1.8 + step * 1.45);
      southStand.add(bench);
    }

    // 後方高處紅頂司令台遮陽棚與支撐柱
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.32, 4.6), roofMat);
    canopy.position.set(0, 6.6, 6.4);
    canopy.rotation.x = 0.08;
    southStand.add(canopy);
    for (const cx of [-6.2, -2.2, 2.2, 6.2]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 8), concreteMat);
      col.position.set(cx, 4.9, 6.6);
      southStand.add(col);
    }

    // 三支旗桿與飄揚旗幟
    [[-2.5, 0xc92c2c], [0, 0xd63628], [2.5, 0x26549a]].forEach(([fx, col], idx) => {
      const hPole = idx === 1 ? 11.8 : 10.2;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.13, hPole, 8),
        new THREE.MeshStandardMaterial({ color: 0xe6e8eb, metalness: 0.7, roughness: 0.25 })
      );
      pole.position.set(fx, 1.0 + hPole / 2, -0.4);
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.5, 8, 4),
        new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.7 })
      );
      flag.position.set(fx + 1.2, 1.0 + hPole - 1.1, -0.4);
      animatedParts.flags.push(flag);
      southStand.add(pole, flag);
    });

    fieldGroup.add(southStand);
    scene.add(fieldGroup);
    registerClickable(fieldGroup, 'sports-field');
  }

  // =========================================================================
  // 10. 1996 校慶拔河活動（位於後面操場草皮中央 6, 177）
  // =========================================================================
  {
    const tugGroup = new THREE.Group();
    const ty = getTerrainHeight(6, 177);
    tugGroup.position.set(6, ty + 0.28, 177);
    animatedParts.tugGroup = tugGroup;

    // 22 公尺拔河麻繩
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 23, 8),
      new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.9 })
    );
    rope.rotation.z = Math.PI / 2;
    rope.position.y = 0.95;
    tugGroup.add(rope);

    // 中線紅布標記
    const centerRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.5, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xd92b2b })
    );
    centerRibbon.position.set(0, 0.75, 0);
    tugGroup.add(centerRibbon);

    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.7 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x365070, roughness: 0.8 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xe6b89c, roughness: 0.65 });

    const makeStudent = (leanDir, customShirt = shirtMat) => {
      const p = new THREE.Group();
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.35), jeansMat);
      legs.position.y = 0.4;
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), customShirt);
      torso.position.y = 1.15;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), headMat);
      head.position.y = 1.7;
      p.add(legs, torso, head);
      p.rotation.z = leanDir * -0.24;
      return p;
    };

    // 兩隊各 8 位學生全力拉繩
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const person = makeStudent(side);
        person.position.set(side * (2.2 + i * 1.15), 0, (i % 2 === 0 ? 0.38 : -0.38));
        tugGroup.add(person);
      }
    }

    // 中央裁判
    const refShirt = new THREE.MeshStandardMaterial({ color: 0xe8a838, roughness: 0.7 });
    const referee = makeStudent(0, refShirt);
    referee.position.set(0, 0, -2.2);
    tugGroup.add(referee);

    // 兩旁加油圍觀同學 (10位)
    for (let s = 0; s < 10; s++) {
      const spec = makeStudent(0);
      spec.position.set(-9 + s * 2.0, 0, s % 2 === 0 ? -4.8 : 4.8);
      tugGroup.add(spec);
    }

    scene.add(tugGroup);
    registerClickable(tugGroup, 'tug-of-war');
  }

  // =========================================================================
  // 11. 男宿（1996 高層 11 樓雙翼宿舍 + 6 樓通往操場連結橋 + 26 輛路邊機車陣）
  //     註：1996 年高層為男宿，1997 年始與低層女宿對調
  // =========================================================================
  {
    const dormMaleGroup = new THREE.Group();
    const dy = getTerrainHeight(-39, 127);
    dormMaleGroup.position.set(-39, dy, 127);
    dormMaleGroup.rotation.y = 0.52;

    const wingA = buildRedBrickBlock(18.5, 28.5, 12.5, {
      style: 'dorm', repX: 4, repY: 6, hasPitchedRoof: false
    });
    wingA.position.set(-10.2, 0, 0);

    const wingB = buildRedBrickBlock(18.5, 28.5, 12.5, {
      style: 'dorm', repX: 4, repY: 6, hasPitchedRoof: false
    });
    wingB.position.set(10.2, 0, 0);
    dormMaleGroup.add(wingA, wingB);

    // 屋頂環繞紅瓦斜邊簷口 + 階梯機房 + 雙藍色圓柱水塔
    const blueTankMat = new THREE.MeshStandardMaterial({ color: 0x2665a6, roughness: 0.4 });
    for (const bx of [-10.2, 10.2]) {
      const mansardF = new THREE.Mesh(new THREE.BoxGeometry(19.6, 1.4, 1.2), roofMat);
      mansardF.position.set(bx, 29.2, -6.2);
      mansardF.rotation.x = 0.35;
      const mansardB = mansardF.clone();
      mansardB.position.z = 6.2;
      mansardB.rotation.x = -0.35;
      const mansardL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 13.4), roofMat);
      mansardL.position.set(bx - 9.2, 29.2, 0);
      mansardL.rotation.z = -0.35;
      const mansardR = mansardL.clone();
      mansardR.position.x = bx + 9.2;
      mansardR.rotation.z = 0.35;
      dormMaleGroup.add(mansardF, mansardB, mansardL, mansardR);

      const penthouse = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.4, 6.0), concreteMat);
      penthouse.position.set(bx, 30.2, 0);
      const pentTrim = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.6, 6.4), roofMat);
      pentTrim.position.set(bx, 32.0, 0);
      dormMaleGroup.add(penthouse, pentTrim);

      for (const tx of [-2.0, 2.0]) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.4, 14), blueTankMat);
        tank.position.set(bx + tx, 29.7, 4.2);
        dormMaleGroup.add(tank);
      }
    }

    // 男宿 6 樓與操場之間的水平連結橋：
    // 男宿 1F 地坪 19.5m，6 樓樓板高約 +14.1m（海拔 33.6m），正對海拔 33.5m 的操場草地邊緣，跨越中間 1F→6F 的山坡
    const skybridge = new THREE.Group();
    const bridgeLen = 15.8;
    const bridgeW = 3.6;
    const sDeck = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, 0.46, bridgeLen), concreteMat);
    const sRailL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.05, bridgeLen - 0.3), concreteMat);
    sRailL.position.set(-bridgeW / 2 + 0.14, 0.72, 0);
    const sRailR = sRailL.clone();
    sRailR.position.x = bridgeW / 2 - 0.14;

    const sRoof = new THREE.Mesh(new THREE.BoxGeometry(bridgeW + 0.6, 0.36, bridgeLen + 0.4), roofMat);
    sRoof.position.y = 2.85;
    for (let pz = -6.2; pz <= 6.2; pz += 4.1) {
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.65, 0.24), concreteMat);
      postL.position.set(-bridgeW / 2 + 0.2, 1.45, pz);
      const postR = postL.clone();
      postR.position.x = bridgeW / 2 - 0.2;
      skybridge.add(postL, postR);
    }

    // 山坡中段支撐橋墩（由 6 樓橋底向下落入 1F→6F 的斜坡）
    for (const [pierZ, pierH] of [[-3.5, 12.5], [1.8, 7.5]]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.9, pierH, 0.9), concreteMat);
      pier.position.set(0, -pierH / 2, pierZ);
      skybridge.add(pier);
    }

    // 操場端橋台（平順銜接操場外圍綠地，不壓入跑道）
    const abutment = new THREE.Mesh(new THREE.BoxGeometry(bridgeW + 0.8, 1.8, 2.2), concreteMat);
    abutment.position.set(0, -0.75, bridgeLen / 2 - 0.8);
    // 男宿 6 樓端門廳接口
    const portal = new THREE.Mesh(new THREE.BoxGeometry(bridgeW + 0.5, 3.3, 0.7), concreteMat);
    portal.position.set(0, 1.45, -bridgeLen / 2 + 0.35);

    skybridge.add(sDeck, sRailL, sRailR, sRoof, abutment, portal);
    // 位於男宿後側（面向操場側 +Z），由 wingA 六樓（y = 14.1m）垂直跨越山坡接上操場西側草地
    skybridge.position.set(-9.8, 14.1, 6.0 + bridgeLen / 2);
    dormMaleGroup.add(skybridge);

    // 環湖道路路邊 26 輛機車陣（透過 roadPoint 精準停放於道路西側路肩，避開路緣石與路口）
    const scooterBodyColors = [0x263547, 0xa82e26, 0xe2e2dc, 0x2b6e56, 0x33383e];
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.8 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    for (let i = 0; i < 26; i++) {
      const seg = i < 13 ? 2 : 3;
      const idxInSeg = i < 13 ? i : i - 13;
      const frac = seg === 2
        ? THREE.MathUtils.lerp(0.18, 0.86, idxInSeg / 12)
        : THREE.MathUtils.lerp(0.22, 0.92, idxInSeg / 12);
      const rp = roadPoint('dormWest', seg, frac, -4.7);
      const sy = getTerrainHeight(rp.x, rp.z);

      const s = new THREE.Group();
      const paint = new THREE.MeshStandardMaterial({
        color: scooterBodyColors[i % scooterBodyColors.length],
        metalness: 0.25,
        roughness: 0.4,
      });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.45, 1.55), paint);
      deck.position.y = 0.48;
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.35), paint);
      shield.position.set(0, 0.78, 0.55);
      shield.rotation.x = -0.22;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.85), seatMat);
      seat.position.set(0, 0.82, -0.22);
      const wheelF = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 10), tireMat);
      wheelF.rotation.z = Math.PI / 2;
      wheelF.position.set(0, 0.22, 0.56);
      const wheelB = wheelF.clone();
      wheelB.position.z = -0.56;
      s.add(deck, shield, seat, wheelF, wheelB);
      s.position.set(rp.x, sy, rp.z);
      s.rotation.y = rp.yaw + 1.2;
      scene.add(s);
    }

    scene.add(dormMaleGroup);
    registerClickable(dormMaleGroup, 'dorm-male');
  }

  // =========================================================================
  // 12. 女宿（1996 低層 4 樓紅瓦斜頂宿舍 + 老虎窗 + 一樓學生餐廳遮雨棚）
  //     註：1996 年低層為女宿，1997 年始與高層男宿對調
  // =========================================================================
  {
    const dormFemaleGroup = new THREE.Group();
    const fy = getTerrainHeight(-76, 112);
    dormFemaleGroup.position.set(-76, fy, 112);
    dormFemaleGroup.rotation.y = 0.42;

    const mainWing = buildRedBrickBlock(24, 11.5, 11.5, {
      style: 'dorm', repX: 4, repY: 2, hasPitchedRoof: true, hasDormers: true
    });
    const westWing = buildRedBrickBlock(11.0, 11.0, 16.0, {
      style: 'dorm', repX: 2, repY: 2, hasPitchedRoof: true, hasDormers: true
    });
    westWing.position.set(-9.5, 0, -13.8);

    const eastWing = buildRedBrickBlock(11.0, 11.0, 12.5, {
      style: 'dorm', repX: 2, repY: 2, hasPitchedRoof: true
    });
    eastWing.position.set(9.5, 0, -12.0);
    dormFemaleGroup.add(mainWing, westWing, eastWing);

    // 一樓學生餐廳遮雨棚
    const canteenAwning = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.28, 3.2), roofMat);
    canteenAwning.position.set(0, 3.3, -7.2);
    canteenAwning.rotation.x = 0.2;
    dormFemaleGroup.add(canteenAwning);

    // 中庭綠地
    const courtGarden = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.2, 10),
      new THREE.MeshStandardMaterial({ color: 0x4b8742, roughness: 0.9 })
    );
    courtGarden.position.set(0, 0.1, -9);
    dormFemaleGroup.add(courtGarden);

    scene.add(dormFemaleGroup);
    registerClickable(dormFemaleGroup, 'dorm-female');
  }

  // =========================================================================
  // 13. 紅瓦木造雙涼亭與九重葛花架 (行政大樓前草坡)
  // =========================================================================
  {
    const pavGroup = new THREE.Group();
    const py = getTerrainHeight(2, 74);
    pavGroup.position.set(2, py, 74);

    const bougainvilleaMat = new THREE.MeshStandardMaterial({ color: 0xc83a7d, roughness: 0.8 });

    [[-3.6, 0], [3.6, 0.6]].forEach(([px, pz]) => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 4.2), concreteMat);
      base.position.set(px, 0.12, pz);
      pavGroup.add(base);

      for (const cx of [-1.5, 1.5]) {
        for (const cz of [-1.5, 1.5]) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.8, 10), concreteMat);
          col.position.set(px + cx, 1.4, pz + cz);
          pavGroup.add(col);
        }
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 3.4), woodMat);
      beam.position.set(px, 2.85, pz);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.6, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(px, 3.7, pz);
      pavGroup.add(beam, roof);
    });

    for (let b = 0; b < 5; b++) {
      const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), bougainvilleaMat);
      bloom.position.set(-1.5 + b * 0.9, 2.9 + (b % 2) * 0.4, 0.9);
      pavGroup.add(bloom);
    }

    scene.add(pavGroup);
  }

  // =========================================================================
  // 14. 體育館 4D 演進組 (78, -36：1996-1997 施工中結構 ↔ 2001 完工紅瓦體育館)
  // =========================================================================
  {
    const gy = getTerrainHeight(78, -36);

    // 1996–1997 施工中體育館（裸露鋼筋混凝土柱樑、綠色護網、黃色塔吊）
    const gymBuildGroup = new THREE.Group();
    gymBuildGroup.position.set(78, gy, -36);
    gymBuildGroup.rotation.y = -0.32;

    const slab1 = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 18), concreteMat);
    slab1.position.y = 0.2;
    const slab2 = new THREE.Mesh(new THREE.BoxGeometry(23.5, 0.55, 17.5), concreteMat);
    slab2.position.y = 5.2;
    gymBuildGroup.add(slab1, slab2);

    const rebarMat = new THREE.MeshStandardMaterial({ color: 0x5c4338, metalness: 0.65, roughness: 0.6 });
    for (let ix = -9; ix <= 9; ix += 4.5) {
      for (let iz = -7; iz <= 7; iz += 7) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.75, 9.6, 0.75), concreteMat);
        col.position.set(ix, 4.8, iz);
        gymBuildGroup.add(col);
        const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 5), rebarMat);
        rebar.position.set(ix, 10.2, iz);
        gymBuildGroup.add(rebar);
      }
    }

    const netMat = new THREE.MeshStandardMaterial({
      color: 0x2f7d4d,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      roughness: 0.85,
    });
    const scafNet = new THREE.Mesh(new THREE.PlaneGeometry(21, 9.0), netMat);
    scafNet.position.set(0, 4.8, -9.2);
    gymBuildGroup.add(scafNet);

    const craneMat = new THREE.MeshStandardMaterial({ color: 0xe2a024, roughness: 0.52, metalness: 0.3 });
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.15, 21, 1.15), craneMat);
    mast.position.set(13.5, 10.5, -6);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(22, 0.85, 0.9), craneMat);
    jib.position.set(4.5, 20.5, -6);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.0, 6), darkSteelMat);
    cable.position.set(-2.5, 16.8, -6);
    gymBuildGroup.add(mast, jib, cable);

    scene.add(gymBuildGroup);
    registerClickable(gymBuildGroup, 'gym');
    animatedParts.eraGymBuild = gymBuildGroup;

    // 1999–2001 完工版紅磚紅瓦大屋頂體育館 (對照 體育館2001 222340.png)
    const gymDoneGroup = new THREE.Group();
    gymDoneGroup.position.set(78, gy, -36);
    gymDoneGroup.rotation.y = -0.32;
    const gymBody = buildRedBrickBlock(24, 12.5, 18, {
      style: 'academic', repX: 4, repY: 2, hasPitchedRoof: true, roofScale: 1.15
    });
    gymDoneGroup.add(gymBody);
    const gymSkylight1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 2.2), glassMat);
    gymSkylight1.position.set(-4.5, 15.6, 0);
    const gymSkylight2 = gymSkylight1.clone();
    gymSkylight2.position.set(4.5, 15.6, 0);
    gymDoneGroup.add(gymSkylight1, gymSkylight2);
    gymDoneGroup.visible = false;

    scene.add(gymDoneGroup);
    registerClickable(gymDoneGroup, 'gym');
    animatedParts.eraGymDone = gymDoneGroup;
  }

  return { clickableObjects, animatedParts, nightEmissiveMaterials };
}
