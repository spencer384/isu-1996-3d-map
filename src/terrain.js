import * as THREE from 'three';

/**
 * 125 階長樓梯（行政大樓／綜合大樓前百階）斜面基準線
 * 地形與階梯模型共用，確保草坡不會穿出階梯。
 */
export const STAIR_LINE = { x1: 2.0, z1: 60.5, x2: 8.5, z2: 102.0, y1: 13.8, y2: 33.5 };

/**
 * 1996 義守大學（高雄工學院）觀音山東麓地形高度函數
 * 對齊空拍實景地圖與 1996 平面圖：
 *   X: 東西向 (東為正 +X: 泳池/活動中心/教學大樓/科技大樓/圖書館, 西為負 -X: 男宿/女宿)
 *   Z: 南北向 (北為負 -Z: 校門口/北側球場, 南為正 +Z: 行政大樓/操場/後山)
 *   Y: 海拔高度 (黃色圈選區：行政大樓、科技大樓、圖書館、操場皆位於同一高程平台 33.5m，正對男宿 6 樓)
 */
export function getTerrainHeight(x, z) {
  // 基礎山坡：由北(-Z)向南(+Z)緩升
  let h = 2.5 + Math.max(0, (z + 80) * 0.095);

  // 觀音山東西兩側與後方主峰抬升
  const southRidge = Math.max(0, z - 195) * 0.28;
  const eastHill = Math.max(0, x - 125) * 0.24;
  const westHill = Math.max(0, -x - 115) * 0.22;
  h += southRidge + eastHill + westHill;

  // 自然山丘起伏
  h += Math.sin(x * 0.025) * Math.cos(z * 0.022) * 1.4;
  h += Math.sin(x * 0.06 + z * 0.05) * 0.45;

  const smoothstep = (e0, e1, v) => {
    const k = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
    return k * k * (3 - 2 * k);
  };

  // 橢圓形建築平台
  const flatten = (cx, cz, rx, rz, targetH, feather = 20) => {
    const dx = Math.abs(x - cx) / rx;
    const dz = Math.abs(z - cz) / rz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 1.0) {
      h = targetH;
    } else if (d < 1.0 + feather / Math.min(rx, rz)) {
      const t = (d - 1.0) / (feather / Math.min(rx, rz));
      const smooth = t * t * (3 - 2 * t);
      h = THREE.MathUtils.lerp(targetH, h, smooth);
    }
  };

  // 矩形平台（確保上層同高度建築群與操場四角皆平整貼地、不懸空）
  const flattenRect = (cx, cz, hx, hz, targetH, feather = 14) => {
    const dx = Math.max(0, Math.abs(x - cx) - hx);
    const dz = Math.max(0, Math.abs(z - cz) - hz);
    const d = Math.hypot(dx, dz);
    if (d <= 0) {
      h = targetH;
    } else if (d < feather) {
      h = THREE.MathUtils.lerp(targetH, h, smoothstep(0, feather, d));
    }
  };

  // 旋轉矩形平台（貼合斜向排列建築如男宿 1F 地坪）
  const flattenRotatedRect = (cx, cz, hx, hz, yaw, targetH, feather = 12) => {
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const dx0 = x - cx;
    const dz0 = z - cz;
    const lx = dx0 * cosY - dz0 * sinY;
    const lz = dx0 * sinY + dz0 * cosY;
    const dx = Math.max(0, Math.abs(lx) - hx);
    const dz = Math.max(0, Math.abs(lz) - hz);
    const d = Math.hypot(dx, dz);
    if (d <= 0) {
      h = targetH;
    } else if (d < feather) {
      h = THREE.MathUtils.lerp(targetH, h, smoothstep(0, feather, d));
    }
  };

  flatten(-6, -70, 30, 30, 3.0, 20);       // 1. 校門口 & 警衛室
  flatten(56, 4, 48, 26, 9.5, 18);         // 2. 泳池 & 活動中心 & 前廣場
  flatten(52, -22, 22, 16, 8.2, 14);       // 2b. 體育館平台（位於活動中心西北側／泳池北側）
  flatten(28, -48, 24, 22, 5.5, 16);       // 3. 北側網球／籃球場
  flatten(104, 48, 28, 24, 15.5, 18);      // 4. 教學大樓 (口字型四合院)
  flatten(18, 50, 14, 12, 13.5, 14);       // 5. 紅色舊水塔草坡（泳池附屬棟南方山坡）
  flatten(2, 58, 16, 10, 13.8, 14);        // 6. 百階樓梯起點道路彎道平台
  flatten(-92, 106, 28, 24, 18.0, 18);     // 11. 女宿（1996 低層，男宿西側道路對面）
  flattenRotatedRect(-50, 128, 21.0, 8.0, 1.05, 19.5, 13); // 10a. 男宿 1F 基地（19.5m，東北—西南走向）

  // 7–9 & 12. 黃色圈選上層同高程平台區（海拔統一為 33.5m，正對男宿 6 樓高度）：
  // 包含：行政大樓與前廣場、科技大樓、義守大學圖書館、操場與南側升旗台
  flattenRect(10, 121, 26, 19, 33.5, 12);  // 7. 行政大樓（綜合大樓）與前廣場 (33.5m)
  flattenRect(66, 118, 22, 16, 33.5, 12);  // 8. 科技大樓 (33.5m)
  flattenRect(94, 154, 22, 20, 33.5, 12);  // 9. 義守大學圖書館 (33.5m)
  flattenRect(6, 174, 49, 32, 33.5, 12);   // 12. 操場與南側升旗台 (33.5m)

  // 10b. 確保男宿雙棟四角平整落於 19.5m，使男宿與操場之間形成真實的 1F→6F 山坡
  flattenRotatedRect(-50, 128, 20.5, 7.0, 1.05, 19.5, 4);

  // 13. 百階樓梯（125 階）坡道：地面沿階梯斜面下切，避免草坡穿出階梯
  {
    const { x1, z1, x2, z2, y1, y2 } = STAIR_LINE;
    const sdx = x2 - x1;
    const sdz = z2 - z1;
    const len = Math.hypot(sdx, sdz);
    const ux = sdx / len;
    const uz = sdz / len;
    const vx = x - x1;
    const vz = z - z1;
    const t = (vx * ux + vz * uz) / len;
    const perp = Math.abs(vx * uz - vz * ux);
    const w = (1 - smoothstep(4.6, 10, perp)) * smoothstep(-0.10, 0.02, t) * (1 - smoothstep(0.98, 1.08, t));
    if (w > 0) {
      const tc = Math.min(1, Math.max(0, t));
      const target = y1 + (y2 - y1) * tc - 0.14;
      h = THREE.MathUtils.lerp(h, target, w);
    }
  }

  return h;
}

export const ROAD_PATHS = {
  main: [[-95, -130], [-22, -102], [-6, -86], [-5, -52], [-10, -14], [-8, 28], [2, 58], [34, 72], [68, 82], [108, 108]],
  teaching: [[68, 82], [84, 68]],
  dormWest: [[-5, -50], [-20, -14], [-34, 28], [-48, 68], [-62, 108], [-74, 142]],
  adminWest: [[-8, 28], [-19, 60], [-27, 94], [-29, 124], [-24, 138]],
  crossLink: [[-48, 68], [-24, 58], [-8, 44]],
  techLane: [[57, 174], [57, 142], [41, 124]],
};

const ROAD_HALF_WIDTH = { main: 5.2, teaching: 3.8, dormWest: 4.4, adminWest: 3.8, crossLink: 3.4, techLane: 3.0 };

export function isOnRoad(x, z, margin = 0) {
  for (const [name, pts] of Object.entries(ROAD_PATHS)) {
    const halfW = ROAD_HALF_WIDTH[name] + margin;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      if (distToSegment(x, z, x1, z1, x2, z2) < halfW) return true;
    }
  }
  return false;
}

/**
 * 取得道路中心線上某段的點，並可沿道路法線偏移（正值為道路行進方向右側）。
 * 用於路燈與路邊機車，確保它們位於路肩而非壓在車道或路緣石上。
 */
export function roadPoint(name, seg, frac, offset = 0) {
  const pts = ROAD_PATHS[name];
  const [x1, z1] = pts[seg];
  const [x2, z2] = pts[seg + 1];
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const nx = dz / len;
  const nz = -dx / len;
  return {
    x: x1 + dx * frac + nx * offset,
    z: z1 + dz * frac + nz * offset,
    yaw: Math.atan2(dx, dz),
  };
}

function distToSegment(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len2 = dx * dx + dz * dz;
  if (len2 === 0) return Math.hypot(px - x1, pz - z1);
  let t = ((px - x1) * dx + (pz - z1) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
}

export function createTerrainAndRoads(scene, texLib) {
  const size = 440;
  const segments = 220;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const brightGrassTint = new THREE.Color(0xdcf0d4);
  const forestTint = new THREE.Color(0x94bd8a);
  const roadTint = new THREE.Color(0x7c8288);
  const plazaTint = new THREE.Color(0xeadacb);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = getTerrainHeight(x, z);
    pos.setY(i, y);

    const c = brightGrassTint.clone();

    if (isOnRoad(x, z)) {
      c.copy(roadTint);
    } else if (
      (Math.abs(x - 10) < 26 && Math.abs(z - 108) < 11) ||
      (Math.abs(x - 82) < 17 && Math.abs(z + 18) < 11) ||
      (Math.abs(x - 86) < 16 && Math.abs(z - 64) < 12)
    ) {
      c.copy(plazaTint);
    } else if (y > 36.5 || x > 128 || x < -118 || z > 212 || (x > 26 && z < -68)) {
      // 觀音山深綠樹林區 (包含 1996 年尚未開發之東北側、東側與西側山坡)
      c.copy(forestTint);
    } else {
      const n = (Math.sin(x * 0.11) + Math.cos(z * 0.11)) * 0.04;
      c.offsetHSL(0, 0, n);
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: texLib.grass.map,
    bumpMap: texLib.grass.bumpMap,
    bumpScale: 0.32,
    roughnessMap: texLib.grass.roughnessMap,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
  });

  const terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  addRoadRibbons(scene, texLib);
  addPlazas(scene, texLib);
  addCampusFoliage(scene, texLib);
  const { streetLampEmissiveMat, streetLampLights } = addStreetLamps(scene);

  return { terrainMesh, streetLampEmissiveMat, streetLampLights };
}

function addRoadRibbons(scene, texLib) {
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xc2beb6, roughness: 0.85 });
  // 道路高於地形網格 0.2m，避免地形三角面在彎道或坡地穿出路面
  const ROAD_LIFT = 0.2;

  const buildRibbon = (pts, width = 7.8, withCurbs = true) => {
    const curve = new THREE.CatmullRomCurve3(
      pts.map(([x, z]) => new THREE.Vector3(x, getTerrainHeight(x, z) + ROAD_LIFT, z))
    );
    const totalLen = curve.getLength();
    const divisions = pts.length * 18;
    const frames = curve.computeFrenetFrames(divisions, false);

    const positions = [];
    const uvs = [];
    const indices = [];

    const curbLeftPos = [];
    const curbRightPos = [];

    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      const p = curve.getPointAt(t);
      const side = new THREE.Vector3().crossVectors(frames.tangents[i], new THREE.Vector3(0, 1, 0)).normalize();

      const left = p.clone().addScaledVector(side, -width / 2);
      const right = p.clone().addScaledVector(side, width / 2);
      left.y = getTerrainHeight(left.x, left.z) + ROAD_LIFT;
      right.y = getTerrainHeight(right.x, right.z) + ROAD_LIFT;

      positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
      const vCoord = (t * totalLen) / 14;
      uvs.push(0, vCoord, 1, vCoord);

      if (withCurbs) {
        const clOut = p.clone().addScaledVector(side, -(width / 2 + 0.45));
        clOut.y = getTerrainHeight(clOut.x, clOut.z) + ROAD_LIFT + 0.14;
        curbLeftPos.push(left.x, left.y + 0.18, left.z, clOut.x, clOut.y, clOut.z);

        const crOut = p.clone().addScaledVector(side, width / 2 + 0.45);
        crOut.y = getTerrainHeight(crOut.x, crOut.z) + ROAD_LIFT + 0.14;
        curbRightPos.push(right.x, right.y + 0.18, right.z, crOut.x, crOut.y, crOut.z);
      }

      if (i < divisions) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();

    const m = new THREE.MeshStandardMaterial({
      map: texLib.asphaltRoad.map,
      bumpMap: texLib.asphaltRoad.bumpMap,
      bumpScale: 0.18,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.receiveShadow = true;
    scene.add(mesh);

    if (withCurbs) {
      for (const cPos of [curbLeftPos, curbRightPos]) {
        const cg = new THREE.BufferGeometry();
        cg.setAttribute('position', new THREE.Float32BufferAttribute(cPos, 3));
        cg.setIndex(indices);
        cg.computeVertexNormals();
        const cm = new THREE.Mesh(cg, curbMat);
        cm.receiveShadow = true;
        scene.add(cm);
      }
    }
  };

  buildRibbon(ROAD_PATHS.main, 8.6, true);
  buildRibbon(ROAD_PATHS.teaching, 6.2, false);
  buildRibbon(ROAD_PATHS.dormWest, 7.2, true);
  buildRibbon(ROAD_PATHS.adminWest, 6.6, true);
  buildRibbon(ROAD_PATHS.crossLink, 6.0, false);
  buildRibbon(ROAD_PATHS.techLane, 5.4, false);
}

function addPlazas(scene, texLib) {
  const plazaMat = new THREE.MeshStandardMaterial({
    map: texLib.plazaTile.map,
    bumpMap: texLib.plazaTile.bumpMap,
    bumpScale: 0.15,
    roughness: 0.82,
  });
  const stoneSideMat = new THREE.MeshStandardMaterial({ color: 0xc9bfae, roughness: 0.85 });
  const plazaMats = [stoneSideMat, stoneSideMat, plazaMat, stoneSideMat, stoneSideMat, stoneSideMat];

  // 行政大樓（綜合大樓）前廣場：加厚為石砌平台，頂面對齊百階樓梯頂端（海拔 33.5m）
  const adminTop = STAIR_LINE.y2 + 0.02;
  const adminPlaza = new THREE.Mesh(new THREE.BoxGeometry(46, 5, 14), plazaMats);
  adminPlaza.position.set(9.5, adminTop - 2.5, 108.5);
  adminPlaza.rotation.y = -0.10;
  adminPlaza.receiveShadow = true;
  scene.add(adminPlaza);

  // 活動中心前廣場（含噴水池），頂面對齊活動中心地坪
  const actTop = getTerrainHeight(76, -2) + 0.17;
  const actPlaza = new THREE.Mesh(new THREE.BoxGeometry(30, 1.2, 18), plazaMats);
  actPlaza.position.set(82, actTop - 0.6, -18);
  actPlaza.rotation.y = -0.35;
  actPlaza.receiveShadow = true;
  scene.add(actPlaza);
}

function addCampusFoliage(scene, texLib) {
  let seed = 1996;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const isOccupiedByBuilding = (x, z) => {
    if (Math.abs(x + 6) < 22 && Math.abs(z + 70) < 24) return true;     // 校門口、警衛塔、精神指標
    if (Math.abs(x - 28) < 22 && Math.abs(z + 48) < 24) return true;    // 北側網球／籃球場
    if (Math.abs(x - 44) < 32 && Math.abs(z - 12) < 20) return true;    // 泳池、看台與附屬棟
    if (Math.abs(x - 52) < 18 && Math.abs(z + 22) < 16) return true;    // 體育館（泳池北側／活動中心西北側）
    if (Math.abs(x - 76) < 24 && Math.abs(z + 6) < 26) return true;     // 活動中心、噴水池與前廣場
    if (Math.abs(x - 104) < 26 && Math.abs(z - 52) < 28) return true;   // 教學大樓 (口字型) 與圓環
    if (Math.abs(x - 18) < 11 && Math.abs(z - 50) < 11) return true;    // 紅色舊水塔
    if (Math.abs(x + 9) < 8 && Math.abs(z - 80) < 7) return true;       // 紅瓦雙涼亭
    if (Math.abs(x - 5.5) < 10 && z > 56 && z < 105) return true;       // 百階樓梯（125 階）
    if (Math.abs(x - 10) < 28 && z > 99 && z < 140) return true;        // 行政大樓（綜合大樓）與前廣場
    if (Math.abs(x - 66) < 24 && Math.abs(z - 118) < 19) return true;   // 科技大樓
    if (Math.abs(x - 94) < 22 && Math.abs(z - 154) < 22) return true;   // 圖書館
    if (Math.abs(x - 6) < 55 && Math.abs(z - 174) < 38) return true;    // 操場、南側升旗台與拔河
    if (Math.abs(x + 50) < 24 && Math.abs(z - 128) < 25) return true;   // 男宿 (1996 高層)
    if (x > -58 && x < -32 && z > 136 && z < 156) return true;          // 男宿 6F 至操場連結橋廊道
    if (Math.abs(x + 92) < 26 && Math.abs(z - 106) < 26) return true;   // 女宿 (1996 低層)
    return false;
  };

  // A. Subtropical Broadleaf Trees（樹幹與道路保持 2.2m 以上距離，樹冠不壓路肩設施）
  const treePositions = [];
  for (let i = 0; i < 660; i++) {
    const x = (rand() - 0.5) * 395;
    const z = (rand() - 0.5) * 395 + 30;
    if (isOnRoad(x, z, 2.2) || isOccupiedByBuilding(x, z)) continue;
    treePositions.push({
      x,
      y: getTerrainHeight(x, z),
      z,
      scale: 0.78 + rand() * 0.92,
      rot: rand() * Math.PI * 2,
    });
  }

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.36, 3.1, 7);
  trunkGeo.translate(0, 1.55, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    map: texLib.bark.map,
    bumpMap: texLib.bark.bumpMap,
    bumpScale: 0.25,
    roughness: 0.92,
  });

  const clusterGeo = new THREE.IcosahedronGeometry(1.75, 1);
  const clusterMat = new THREE.MeshStandardMaterial({
    map: texLib.leafCluster.map,
    bumpMap: texLib.leafCluster.bumpMap,
    bumpScale: 0.35,
    roughness: 0.85,
  });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
  const clusters = new THREE.InstancedMesh(clusterGeo, clusterMat, treePositions.length * 3);
  trunks.castShadow = true;
  clusters.castShadow = true;
  clusters.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const cTmp = new THREE.Color();
  const offsets = [
    [0, 3.9, 0, 1.15],
    [-0.85, 3.25, 0.65, 0.88],
    [0.85, 3.35, -0.55, 0.92],
  ];

  treePositions.forEach((t, idx) => {
    dummy.position.set(t.x, t.y - 0.2, t.z);
    dummy.scale.set(t.scale, t.scale, t.scale);
    dummy.rotation.set(0, t.rot, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(idx, dummy.matrix);

    offsets.forEach(([ox, oy, oz, os], cIdx) => {
      const cosR = Math.cos(t.rot);
      const sinR = Math.sin(t.rot);
      const wx = t.x + (ox * cosR - oz * sinR) * t.scale;
      const wz = t.z + (ox * sinR + oz * cosR) * t.scale;
      dummy.position.set(wx, t.y - 0.2 + oy * t.scale, wz);
      dummy.scale.set(t.scale * os, t.scale * os * 0.82, t.scale * os);
      dummy.rotation.set((cIdx - 1) * 0.2, t.rot + cIdx * 1.4, 0);
      dummy.updateMatrix();
      const flatIdx = idx * 3 + cIdx;
      clusters.setMatrixAt(flatIdx, dummy.matrix);

      cTmp.setHSL(0.28 + (idx % 7) * 0.014, 0.38, 0.72 + (cIdx * 0.06) + ((idx % 4) * 0.04));
      clusters.setColorAt(flatIdx, cTmp);
    });
  });

  scene.add(trunks, clusters);

  // B. Taiwanese Royal / Coconut Palms (大王椰子) — 位置已避開校門塔樓、道路與階梯
  const palmSpots = [
    [-17, -66], [6, -68], [-12, -46], [4, -44],
    [28, -28], [40, -34], [66, -24],
    [-8, 102], [26, 102], [44, 104]
  ];

  const palmTrunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 7.6, 8);
  palmTrunkGeo.translate(0, 3.8, 0);
  const palmTrunkMat = new THREE.MeshStandardMaterial({
    map: texLib.bark.map,
    color: 0xa89f92,
    roughness: 0.9,
  });

  const frondGeo = new THREE.BoxGeometry(0.45, 0.08, 3.4);
  frondGeo.translate(0, 0, 1.65);
  const frondMat = new THREE.MeshStandardMaterial({
    map: texLib.leafCluster.map,
    color: 0x6ea854,
    roughness: 0.75,
  });

  const palmTrunks = new THREE.InstancedMesh(palmTrunkGeo, palmTrunkMat, palmSpots.length);
  const palmFronds = new THREE.InstancedMesh(frondGeo, frondMat, palmSpots.length * 7);
  palmTrunks.castShadow = true;
  palmFronds.castShadow = true;

  palmSpots.forEach(([px, pz], idx) => {
    const py = getTerrainHeight(px, pz);
    const scale = 0.88 + (idx % 3) * 0.14;
    dummy.position.set(px, py - 0.1, pz);
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.set(0, idx * 0.9, 0);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(idx, dummy.matrix);

    for (let f = 0; f < 7; f++) {
      const ang = (f / 7) * Math.PI * 2 + idx * 0.4;
      dummy.position.set(px, py - 0.1 + 7.4 * scale, pz);
      dummy.rotation.set(0.38, ang, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      palmFronds.setMatrixAt(idx * 7 + f, dummy.matrix);
    }
  });

  scene.add(palmTrunks, palmFronds);
}

function addStreetLamps(scene) {
  const lampGroup = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x304238, metalness: 0.45, roughness: 0.55 });
  const streetLampEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2e8,
    emissive: 0xffd27d,
    emissiveIntensity: 0.0,
    roughness: 0.3,
  });

  // 依道路中心線自動計算路肩位置（車道半寬 + 路緣石 + 1m），路燈不再立於車道或路緣石上
  const lampDefs = [
    ['main', 1, 0.5, 5.8], ['main', 2, 0.5, -5.8], ['main', 3, 0.5, 5.8], ['main', 4, 0.45, -5.8],
    ['main', 5, 0.5, 5.8], ['main', 6, 0.4, -5.8], ['main', 7, 0.5, 5.8], ['main', 8, 0.5, 5.8],
    ['dormWest', 0, 0.5, 5.2], ['dormWest', 1, 0.5, 5.2], ['dormWest', 2, 0.5, 5.2], ['dormWest', 3, 0.5, 5.2],
    ['adminWest', 1, 0.5, -4.8], ['adminWest', 2, 0.5, -4.8],
    ['crossLink', 0, 0.5, 4.6], ['teaching', 0, 0.5, 4.8],
  ];

  const streetLampLights = [];

  lampDefs.forEach(([name, seg, frac, offset], idx) => {
    const p = roadPoint(name, seg, frac, offset);
    const ly = getTerrainHeight(p.x, p.z);
    const g = new THREE.Group();
    g.position.set(p.x, ly, p.z);
    g.rotation.y = p.yaw;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 6.2, 8), poleMat);
    pole.position.y = 3.1;
    pole.castShadow = true;

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), poleMat);
    arm.position.set(0, 6.1, 0);

    const bulbL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), streetLampEmissiveMat);
    bulbL.position.set(-0.85, 5.95, 0);
    const bulbR = bulbL.clone();
    bulbR.position.set(0.85, 5.95, 0);

    g.add(pole, arm, bulbL, bulbR);
    lampGroup.add(g);

    if (idx === 1 || idx === 4 || idx === 8) {
      const pt = new THREE.PointLight(0xffcb78, 0, 44, 1.5);
      pt.position.set(p.x, ly + 6.0, p.z);
      scene.add(pt);
      streetLampLights.push(pt);
    }
  });

  scene.add(lampGroup);
  return { streetLampEmissiveMat, streetLampLights };
}
