import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createTextureLibrary } from './textures.js?v=20261127g';
import { createTerrainAndRoads, getTerrainHeight, ROAD_PATHS } from './terrain.js?v=20261127g';
import { createCampusBuildings, LANDMARKS_1996 } from './buildings.js?v=20261127k';

const container = document.getElementById('canvas-container');
const labelsLayer = document.getElementById('labels-layer');
const landmarkListEl = document.getElementById('landmark-list');
const infoCard = document.getElementById('info-card');
const infoEra = document.getElementById('info-era');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');
const infoPhotoBox = document.getElementById('info-photo-box');
const infoPhoto = document.getElementById('info-photo');
const infoPhotoText = document.getElementById('info-photo-text');
const photoModal = document.getElementById('photo-modal');
const photoModalImg = document.getElementById('photo-modal-img');
const photoModalCaption = document.getElementById('photo-modal-caption');
const photoModalClose = document.getElementById('photo-modal-close');
const walkHint = document.getElementById('walk-hint');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
const coordsText = document.getElementById('coords-text');

// 1. Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa6cbe3, 0.0018);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 1200);
camera.position.set(-10, 88, -175);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
container.appendChild(renderer.domElement);

// 2. Procedural PBR Texture Library & Sky Environment Reflection (PMREM)
const texLib = createTextureLibrary(renderer);

const skyGeo = new THREE.SphereGeometry(480, 32, 20);
const skyMat = new THREE.MeshBasicMaterial({
  map: texLib.skyEquirect('day'),
  side: THREE.BackSide,
  fog: false,
});
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);

// Soft drifting 3D cloud puffs above Guanyin Mountain
const cloudsGroup = new THREE.Group();
const cloudMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1.0,
  metalness: 0.0,
  transparent: true,
  opacity: 0.72,
  fog: false,
});
const cloudClusters = [];
for (let i = 0; i < 14; i++) {
  const cg = new THREE.Group();
  const baseX = -220 + (i % 5) * 110 + Math.sin(i * 2.1) * 28;
  const baseZ = -160 + Math.floor(i / 5) * 165 + Math.cos(i * 1.7) * 35;
  const baseY = 128 + (i % 3) * 14;
  for (let p = 0; p < 4; p++) {
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(14 + p * 2.5, 1),
      cloudMat
    );
    puff.scale.set(1.8, 0.65, 1.3);
    puff.position.set((p - 1.5) * 13, (p % 2) * 3, (p % 3 - 1) * 5);
    cg.add(puff);
  }
  cg.position.set(baseX, baseY, baseZ);
  cloudsGroup.add(cg);
  cloudClusters.push(cg);
}
scene.add(cloudsGroup);

// Generate lightweight environment reflection map via PMREMGenerator
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(
  new THREE.SphereGeometry(20, 16, 12),
  new THREE.MeshBasicMaterial({ map: texLib.skyEquirect('day'), side: THREE.BackSide })
));
scene.environment = pmrem.fromScene(envScene).texture;
scene.environmentIntensity = 0.45;
pmrem.dispose();

// 3. Lights
const hemiLight = new THREE.HemisphereLight(0xdff2ff, 0x3b5234, 0.85);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.85);
sunLight.position.set(120, 160, -90);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 20;
sunLight.shadow.camera.far = 480;
const d = 195;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// 4. Build 1996 Campus Terrain & Detailed Multi-Part Buildings
const { streetLampEmissiveMat, streetLampLights } = createTerrainAndRoads(scene, texLib);
const { clickableObjects, animatedParts, nightEmissiveMaterials } = createCampusBuildings(scene, texLib);

// 5. Controls (Left-drag pan, Right-drag rotate, Wheel zoom)
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.06;
orbitControls.maxPolarAngle = Math.PI * 0.48;
orbitControls.minDistance = 12;
orbitControls.maxDistance = 380;
orbitControls.screenSpacePanning = false;
orbitControls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE
};
orbitControls.touches = {
  ONE: THREE.TOUCH.PAN,
  TWO: THREE.TOUCH.DOLLY_ROTATE
};
orbitControls.target.set(6, 16, 68);

const walkControls = new PointerLockControls(camera, document.body);
const isMobileQuery = window.matchMedia('(max-width: 900px)');
const isTouchDevice = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
let mode = 'orbit'; // 'orbit' | 'walk'
let showLabels = true;
let activeLandmarkId = 'panorama';
let flyAnim = null;

const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const mobileBackdrop = document.getElementById('mobile-backdrop');
const minimapBox = document.getElementById('minimap-box');
const btnMinimapToggle = document.getElementById('btn-minimap-toggle');
const titleCard = document.getElementById('title-card');
const btnMobileAbout = document.getElementById('btn-mobile-about');
const mobileWalkPad = document.getElementById('mobile-walk-pad');

function setSidebarCollapsed(collapsed) {
  sidebar.classList.toggle('collapsed', collapsed);
  toggleSidebarBtn.classList.toggle('collapsed', collapsed);
  infoCard.classList.toggle('sidebar-collapsed', collapsed);
  if (isMobileQuery.matches) {
    toggleSidebarBtn.textContent = '📍 地標導覽 (20)';
    mobileBackdrop.classList.toggle('visible', !collapsed);
  } else {
    toggleSidebarBtn.textContent = collapsed ? '▶ 導覽' : '◀ 導覽';
    mobileBackdrop.classList.remove('visible');
  }
}

function flyToLandmark(lm) {
  activeLandmarkId = lm.id;
  if (mode === 'walk') {
    setMode('orbit');
  }

  // 點選特定年代獨有地標時，自動平滑切換至對應年份
  const era2026Landmarks = ['management', 'international', 'zodiac-plaza', 'tourism', 'dorm-complex-2026'];
  if (era2026Landmarks.includes(lm.id) && currentEra !== 2026) {
    setEra(2026);
  } else if (lm.id === 'water-tower' && currentEra === 2026) {
    setEra(1996);
  } else if (lm.id === 'tug-of-war' && currentEra !== 1996) {
    setEra(1996);
  }

  flyAnim = {
    startPos: camera.position.clone(),
    endPos: new THREE.Vector3(...lm.camPos),
    startTarget: orbitControls.target.clone(),
    endTarget: new THREE.Vector3(...lm.lookAt),
    progress: 0
  };

  infoEra.textContent = lm.era;
  infoTitle.textContent = lm.name;
  infoDesc.textContent = lm.desc;

  if (infoPhotoBox && infoPhoto) {
    if (lm.photo) {
      infoPhoto.src = lm.photo;
      infoPhoto.alt = lm.name;
      if (infoPhotoText) infoPhotoText.textContent = lm.photoCaption || '建築實景照片';
      infoPhotoBox.style.display = 'block';
    } else {
      infoPhotoBox.style.display = 'none';
    }
  }

  infoCard.classList.remove('hidden');

  if (isMobileQuery.matches) {
    setSidebarCollapsed(true);
  }

  updateActiveUI();
}

// 實景照片放大檢視彈窗控制
if (infoPhotoBox && photoModal) {
  infoPhotoBox.addEventListener('click', () => {
    if (infoPhoto.src) {
      photoModalImg.src = infoPhoto.src;
      photoModalCaption.textContent = infoPhotoText.textContent || infoTitle.textContent;
      photoModal.classList.add('visible');
    }
  });
  if (photoModalClose) {
    photoModalClose.addEventListener('click', () => photoModal.classList.remove('visible'));
  }
  photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal || e.target === photoModalClose) {
      photoModal.classList.remove('visible');
    }
  });
}

// 6. Landmark Sidebar & 3D Projected Pins
const pinElements = new Map();

LANDMARKS_1996.forEach((lm) => {
  const item = document.createElement('button');
  item.className = 'landmark-item' + (lm.id === activeLandmarkId ? ' active' : '');
  item.dataset.id = lm.id;
  item.innerHTML = `
    <div class="landmark-item-title">
      <span>${lm.name}</span>
      <span class="landmark-tag">${lm.tag}</span>
    </div>
    <div class="landmark-item-sub">${lm.era}</div>
  `;
  item.addEventListener('click', () => flyToLandmark(lm));
  landmarkListEl.appendChild(item);

  if (lm.id === 'panorama' || lm.id === 'topdown') return;

  const pin = document.createElement('div');
  pin.className = 'landmark-pin' + (lm.id === activeLandmarkId ? ' active' : '');
  pin.dataset.id = lm.id;
  pin.innerHTML = `
    <div class="landmark-badge"><span class="dot"></span><span class="pin-text">${lm.name.split('（')[0]}</span></div>
    <div class="landmark-stem"></div>
  `;
  pin.addEventListener('click', (e) => {
    e.stopPropagation();
    flyToLandmark(lm);
  });
  labelsLayer.appendChild(pin);
  pinElements.set(lm.id, pin);
});

function updateActiveUI() {
  document.querySelectorAll('.landmark-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.id === activeLandmarkId);
  });
  pinElements.forEach((pin, id) => {
    pin.classList.toggle('active', id === activeLandmarkId);
  });
}

// 7. Raycasting Click on Buildings
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (mode === 'walk') return;
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 5) return;

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickableObjects, false);
  if (hits.length > 0) {
    const id = hits[0].object.userData.landmarkId;
    const lm = LANDMARKS_1996.find((l) => l.id === id);
    if (lm) flyToLandmark(lm);
  }
});

// 8. Mode & Time-of-Day Controls
const btnOrbit = document.getElementById('btn-orbit');
const btnWalk = document.getElementById('btn-walk');
const btnPanorama = document.getElementById('btn-panorama');
const btnTopdown = document.getElementById('btn-topdown');
const btnTime = document.getElementById('btn-time');
const btnLabels = document.getElementById('btn-labels');
const btnAuto = document.getElementById('btn-auto');

function setMode(newMode) {
  mode = newMode;
  btnOrbit.classList.toggle('active', mode === 'orbit');
  btnWalk.classList.toggle('active', mode === 'walk');

  if (mode === 'walk') {
    flyAnim = null;
    orbitControls.enabled = false;
    orbitControls.autoRotate = false;
    btnAuto.classList.remove('active');
    walkHint.style.display = 'block';
    if (isTouchDevice() || isMobileQuery.matches) {
      walkHint.innerHTML = '漫步模式：單指滑動畫面旋轉視角，左下角方向鍵移動';
      mobileWalkPad.style.display = 'grid';
      infoCard.classList.add('hidden');
      setSidebarCollapsed(true);
    } else {
      walkHint.innerHTML = '漫步模式：點擊畫面鎖定視角，使用 <b>W A S D</b> 移動、<b>Shift</b> 加速、<b>Esc</b> 解除滑鼠鎖定';
      mobileWalkPad.style.display = 'none';
    }
    if (camera.position.y > 40) {
      const y = getTerrainHeight(0, -60) + 2.0;
      camera.position.set(0, y, -60);
      camera.lookAt(10, y + 2, 20);
    }
  } else {
    if (document.pointerLockElement) document.exitPointerLock();
    orbitControls.enabled = true;
    walkHint.style.display = 'none';
    mobileWalkPad.style.display = 'none';
  }
}

btnOrbit.addEventListener('click', () => setMode('orbit'));
btnWalk.addEventListener('click', () => {
  setMode('walk');
  if (!isTouchDevice() && !isMobileQuery.matches) {
    walkControls.lock();
  }
});
renderer.domElement.addEventListener('click', () => {
  if (mode === 'walk' && !walkControls.isLocked && !isTouchDevice() && !isMobileQuery.matches) {
    walkControls.lock();
  }
});

// Touch drag look-around when in mobile walk mode
let walkTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;
const walkEuler = new THREE.Euler(0, 0, 0, 'YXZ');

renderer.domElement.addEventListener('touchstart', (e) => {
  if (mode !== 'walk') return;
  const t = e.changedTouches[0];
  walkTouchId = t.identifier;
  lastTouchX = t.clientX;
  lastTouchY = t.clientY;
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
  if (mode !== 'walk' || walkTouchId === null) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier === walkTouchId) {
      const dx = t.clientX - lastTouchX;
      const dy = t.clientY - lastTouchY;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
      walkEuler.setFromQuaternion(camera.quaternion);
      walkEuler.y -= dx * 0.0045;
      walkEuler.x = Math.max(-Math.PI * 0.42, Math.min(Math.PI * 0.42, walkEuler.x - dy * 0.0045));
      camera.quaternion.setFromEuler(walkEuler);
      break;
    }
  }
}, { passive: true });

const endWalkTouch = (e) => {
  if (walkTouchId === null) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === walkTouchId) {
      walkTouchId = null;
      break;
    }
  }
};
renderer.domElement.addEventListener('touchend', endWalkTouch, { passive: true });
renderer.domElement.addEventListener('touchcancel', endWalkTouch, { passive: true });

btnPanorama.addEventListener('click', () => {
  flyToLandmark(LANDMARKS_1996[0]);
});

btnTopdown.addEventListener('click', () => {
  const td = LANDMARKS_1996.find((l) => l.id === 'topdown');
  if (td) flyToLandmark(td);
});

const TIME_PRESETS = [
  {
    key: 'day',
    name: '晴朗白天',
    fog: 0xa6cbe3,
    fogDensity: 0.0018,
    sunColor: 0xfff5e0,
    sunIntensity: 1.85,
    sunPos: [120, 160, -90],
    hemiSky: 0xdff2ff,
    hemiGround: 0x3b5234,
    hemiIntensity: 0.85,
    cloudOpacity: 0.72,
    cloudColor: 0xffffff,
    nightFactor: 0.0,
    envIntensity: 0.45,
  },
  {
    key: 'mist',
    name: '午後山嵐',
    fog: 0xc2d0da,
    fogDensity: 0.0046,
    sunColor: 0xfff8eb,
    sunIntensity: 1.15,
    sunPos: [80, 130, -40],
    hemiSky: 0xdbe5ec,
    hemiGround: 0x455844,
    hemiIntensity: 1.05,
    cloudOpacity: 0.85,
    cloudColor: 0xe6edf2,
    nightFactor: 0.08,
    envIntensity: 0.35,
  },
  {
    key: 'sunset',
    name: '黃昏夕照',
    fog: 0xd6967a,
    fogDensity: 0.0024,
    sunColor: 0xffa65c,
    sunIntensity: 1.65,
    sunPos: [-150, 55, 40],
    hemiSky: 0xffcbb0,
    hemiGround: 0x362a2e,
    hemiIntensity: 0.72,
    cloudOpacity: 0.65,
    cloudColor: 0xffd2b3,
    nightFactor: 0.35,
    envIntensity: 0.38,
  },
  {
    key: 'night',
    name: '校園夜景',
    fog: 0x101c2b,
    fogDensity: 0.0026,
    sunColor: 0x7aa2d4,
    sunIntensity: 0.52,
    sunPos: [-90, 140, -70],
    hemiSky: 0x263b59,
    hemiGround: 0x101816,
    hemiIntensity: 0.55,
    cloudOpacity: 0.14,
    cloudColor: 0x2b3e57,
    nightFactor: 1.0,
    envIntensity: 0.16,
  }
];
let timeIdx = 0;

btnTime.addEventListener('click', () => {
  timeIdx = (timeIdx + 1) % TIME_PRESETS.length;
  const p = TIME_PRESETS[timeIdx];
  btnTime.textContent = `光影：${p.name}`;

  skyMat.map = texLib.skyEquirect(p.key);
  skyMat.needsUpdate = true;

  scene.fog.color.setHex(p.fog);
  scene.fog.density = p.fogDensity;
  scene.environmentIntensity = p.envIntensity;

  sunLight.color.setHex(p.sunColor);
  sunLight.intensity = p.sunIntensity;
  sunLight.position.set(...p.sunPos);

  hemiLight.color.setHex(p.hemiSky);
  hemiLight.groundColor.setHex(p.hemiGround);
  hemiLight.intensity = p.hemiIntensity;

  cloudMat.opacity = p.cloudOpacity;
  cloudMat.color.setHex(p.cloudColor);

  // Ramp building window lights & street lamps
  nightEmissiveMaterials.forEach((m) => {
    m.emissiveIntensity = p.nightFactor * 1.15;
  });
  streetLampEmissiveMat.emissiveIntensity = p.nightFactor * 2.2;
  streetLampLights.forEach((l) => {
    l.intensity = p.nightFactor * 18.0;
  });
});

btnLabels.addEventListener('click', () => {
  showLabels = !showLabels;
  btnLabels.classList.toggle('active', showLabels);
  labelsLayer.style.display = showLabels ? 'block' : 'none';
});

let showMinimap = !isMobileQuery.matches;
function syncMinimapVisibility() {
  minimapBox.classList.toggle('hidden-map', !showMinimap);
  btnMinimapToggle.classList.toggle('active', showMinimap);
}

btnMinimapToggle.addEventListener('click', () => {
  showMinimap = !showMinimap;
  syncMinimapVisibility();
});

btnMobileAbout.addEventListener('click', () => {
  const expanded = titleCard.classList.toggle('expanded');
  btnMobileAbout.textContent = expanded ? '收合 ▴' : '簡介 ▾';
});

btnAuto.addEventListener('click', () => {
  if (mode === 'walk') setMode('orbit');
  orbitControls.autoRotate = !orbitControls.autoRotate;
  orbitControls.autoRotateSpeed = 0.65;
  btnAuto.classList.toggle('active', orbitControls.autoRotate);
});

toggleSidebarBtn.addEventListener('click', () => {
  const nextCollapsed = !sidebar.classList.contains('collapsed');
  setSidebarCollapsed(nextCollapsed);
});

document.getElementById('sidebar-close-mobile').addEventListener('click', () => {
  setSidebarCollapsed(true);
});

mobileBackdrop.addEventListener('click', () => {
  setSidebarCollapsed(true);
});

document.getElementById('info-close').addEventListener('click', () => {
  infoCard.classList.add('hidden');
});

// 8b. 4D Time Axis (1993 -> 1996 -> 1997 -> 2001) & Share URL
const ERA_DATA = {
  1993: {
    label: '1993 年',
    caption: '高雄工學院創校初期：校門直書「高雄工學院」，科技大樓與泳池尚未興建，高層為男宿、低層為女宿。',
  },
  1996: {
    label: '1996 年',
    caption: '高雄工學院時期：科技大樓與泳池已啟用，體育館施工中，操場正舉辦 1996/10/16 校慶拔河比賽。',
  },
  1997: {
    label: '1997 年',
    caption: '改名「義守大學」元年：校門換掛「義守大學」，高層與低層男女宿正式對調，活動中心噴水池啟用。',
  },
  2001: {
    label: '2001 年',
    caption: '義守大學千禧校園：紅磚紅瓦大屋頂體育館全面完工，構成完整山城大學風貌。',
  },
  2026: {
    label: '2026 年',
    caption: '2026 現況智慧山城：依實景照片與 Google 地球，管理學院、國際學院（第二綜合教學大樓）、工學院材料科學與工程學系、觀光餐旅學院、圖資館與星座廣場全面成形。',
  },
};
const ERA_ORDER = [1993, 1996, 1997, 2001, 2026];
let currentEra = 1996;
let play4dTimer = null;

function setEra(year) {
  const y = ERA_DATA[year] ? Number(year) : 1996;
  currentEra = y;
  const info = ERA_DATA[y];

  document.getElementById('era-year-badge').textContent = info.label;
  document.getElementById('era-caption').textContent = info.caption;
  document.querySelectorAll('.era-btn').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.era) === y);
  });

  // Update 3D scene visibility & gate sign texture
  if (animatedParts.gateSignMat) {
    animatedParts.gateSignMat.map = y >= 1997 ? texLib.gateTowerSignISU : texLib.gateTowerSign;
    animatedParts.gateSignMat.needsUpdate = true;
  }
  if (animatedParts.eraPool) animatedParts.eraPool.visible = y >= 1996;
  if (animatedParts.eraTech) animatedParts.eraTech.visible = y >= 1996;
  if (animatedParts.tugGroup) animatedParts.tugGroup.visible = y === 1996;
  if (animatedParts.eraFountain) animatedParts.eraFountain.visible = y >= 1997;
  if (animatedParts.eraGymBuild) animatedParts.eraGymBuild.visible = y === 1996 || y === 1997;
  if (animatedParts.eraGymDone) animatedParts.eraGymDone.visible = y >= 2001;
  if (animatedParts.eraWaterTower) animatedParts.eraWaterTower.visible = y <= 2001;
  if (animatedParts.eraFemaleDorm) animatedParts.eraFemaleDorm.visible = y <= 2001;
  if (animatedParts.beaconLight) animatedParts.beaconLight.visible = y <= 2001;
  if (animatedParts.era2026) animatedParts.era2026.visible = y === 2026;

  // Swap / update pins dynamically according to era
  const is2026 = y === 2026;
  const isSwapped = y >= 1997;

  // 2026-only pins
  const era2026Pins = ['management', 'international', 'zodiac-plaza', 'tourism', 'dorm-complex-2026'];
  era2026Pins.forEach((pid) => {
    const el = pinElements.get(pid);
    if (el) el.style.display = is2026 ? '' : 'none';
  });

  // Historical-only pins
  const waterTowerPin = pinElements.get('water-tower');
  if (waterTowerPin) waterTowerPin.style.display = y <= 2001 ? '' : 'none';

  const tugPin = pinElements.get('tug-of-war');
  if (tugPin) tugPin.style.display = y === 1996 ? '' : 'none';

  // Dynamic pin labels
  const malePin = pinElements.get('dorm-male')?.querySelector('.pin-text');
  const femalePin = pinElements.get('dorm-female')?.querySelector('.pin-text');
  if (malePin) {
    malePin.textContent = is2026 ? '學生第一宿舍（高層）' : (isSwapped ? '女宿（原男宿）' : '男宿');
  }
  if (femalePin) {
    femalePin.textContent = is2026 ? '學生第二宿舍（低層）' : (isSwapped ? '男宿（原女宿）' : '女宿');
  }

  const gymPin = pinElements.get('gym')?.querySelector('.pin-text');
  if (gymPin) {
    gymPin.textContent = y >= 2001 ? '體育館（完工）' : (y >= 1996 ? '體育館（施工中）' : '體育館（預定地）');
  }

  const techPinText = pinElements.get('engineering')?.querySelector('.pin-text');
  if (techPinText) {
    techPinText.textContent = is2026 ? '科技大樓（電機資訊學院）' : '科技大樓';
  }
  const techPinEl = pinElements.get('engineering');
  if (techPinEl) techPinEl.style.display = y >= 1996 ? '' : 'none';

  const adminPin = pinElements.get('admin')?.querySelector('.pin-text');
  if (adminPin) {
    adminPin.textContent = is2026 ? '綜合教學大樓（觀光餐旅學院）' : '行政大樓';
  }

  const tourismPin = pinElements.get('tourism')?.querySelector('.pin-text');
  if (tourismPin) {
    tourismPin.textContent = is2026 ? '義咖啡 (ISU-Cafe)' : '觀光餐旅學院';
  }

  const teachPin = pinElements.get('old-teaching')?.querySelector('.pin-text');
  if (teachPin) {
    teachPin.textContent = is2026 ? '材料科學與工程學系' : '教學大樓';
  }

  const url = new URL(window.location.href);
  url.searchParams.set('era', String(y));
  window.history.replaceState({}, '', url);
}

document.querySelectorAll('.era-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (play4dTimer) {
      clearInterval(play4dTimer);
      play4dTimer = null;
      document.getElementById('btn-play-4d').classList.remove('active');
      document.getElementById('btn-play-4d').textContent = '▶ 4D 演進';
    }
    setEra(Number(btn.dataset.era));
  });
});

const btnPlay4d = document.getElementById('btn-play-4d');
btnPlay4d.addEventListener('click', () => {
  if (play4dTimer) {
    clearInterval(play4dTimer);
    play4dTimer = null;
    btnPlay4d.classList.remove('active');
    btnPlay4d.textContent = '▶ 4D 演進';
  } else {
    btnPlay4d.classList.add('active');
    btnPlay4d.textContent = '⏸ 暫停演進';
    play4dTimer = setInterval(() => {
      const idx = ERA_ORDER.indexOf(currentEra);
      setEra(ERA_ORDER[(idx + 1) % ERA_ORDER.length]);
    }, 2600);
  }
});

const shareToast = document.getElementById('share-toast');
document.getElementById('btn-share').addEventListener('click', async () => {
  const shareUrl = `${window.location.origin}${window.location.pathname}?era=${currentEra}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
  } catch (_) {
    // Fallback ignored
  }
  shareToast.textContent = `已複製 ${currentEra} 年 4D 校園分享網址！`;
  shareToast.style.display = 'block';
  setTimeout(() => { shareToast.style.display = 'none'; }, 2400);
});

const initEra = Number(new URLSearchParams(window.location.search).get('era'));
setEra(ERA_DATA[initEra] ? initEra : 1996);

// Apply responsive defaults on load & breakpoint change
function applyResponsiveDefaults(isMobile) {
  if (isMobile) {
    setSidebarCollapsed(true);
    infoCard.classList.add('hidden');
    showMinimap = false;
    syncMinimapVisibility();
    camera.fov = 60;
  } else {
    setSidebarCollapsed(false);
    infoCard.classList.remove('hidden');
    showMinimap = true;
    syncMinimapVisibility();
    camera.fov = 52;
  }
  camera.updateProjectionMatrix();
}

applyResponsiveDefaults(isMobileQuery.matches);
isMobileQuery.addEventListener('change', (e) => applyResponsiveDefaults(e.matches));

// 9. Keyboard & Mobile Pad Walk Movement
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

document.querySelectorAll('.pad-btn').forEach((btn) => {
  const keyCode = btn.dataset.key;
  const press = (e) => {
    e.preventDefault();
    keys[keyCode] = true;
  };
  const release = (e) => {
    e.preventDefault();
    keys[keyCode] = false;
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
});

// 10. Minimap Drawing
function drawMinimap() {
  if (!showMinimap) return;
  const w = minimapCanvas.width;
  const h = minimapCanvas.height;
  minimapCtx.clearRect(0, 0, w, h);

  minimapCtx.fillStyle = '#172b1e';
  minimapCtx.fillRect(0, 0, w, h);

  const toMap = (x, z) => [
    w / 2 + (x / 330) * w,
    h / 2 + ((z - 40) / 360) * h
  ];

  minimapCtx.strokeStyle = '#55606e';
  minimapCtx.lineWidth = 2.8;
  Object.values(ROAD_PATHS).forEach((pts) => {
    minimapCtx.beginPath();
    pts.forEach(([x, z], i) => {
      const [mx, my] = toMap(x, z);
      if (i === 0) minimapCtx.moveTo(mx, my);
      else minimapCtx.lineTo(mx, my);
    });
    minimapCtx.stroke();
  });

  LANDMARKS_1996.forEach((lm) => {
    if (lm.id === 'panorama' || lm.id === 'topdown') return;
    const [mx, my] = toMap(lm.pos[0], lm.pos[2]);
    minimapCtx.fillStyle = lm.id === activeLandmarkId ? '#e06d44' : '#f0b865';
    minimapCtx.beginPath();
    minimapCtx.arc(mx, my, lm.id === activeLandmarkId ? 4 : 2.6, 0, Math.PI * 2);
    minimapCtx.fill();
  });

  const [cx, cy] = toMap(camera.position.x, camera.position.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  minimapCtx.fillStyle = '#5ad2ff';
  minimapCtx.beginPath();
  minimapCtx.arc(cx, cy, 4, 0, Math.PI * 2);
  minimapCtx.fill();

  minimapCtx.strokeStyle = '#5ad2ff';
  minimapCtx.lineWidth = 2;
  minimapCtx.beginPath();
  minimapCtx.moveTo(cx, cy);
  minimapCtx.lineTo(cx + dir.x * 14, cy + dir.z * 14);
  minimapCtx.stroke();

  coordsText.textContent = `X:${Math.round(camera.position.x)} Z:${Math.round(camera.position.z)}`;
}

// 11. Animation Loop
const clock = new THREE.Clock();
const projVec = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (flyAnim) {
    flyAnim.progress += dt * 1.15;
    const t = Math.min(1, flyAnim.progress);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(flyAnim.startPos, flyAnim.endPos, ease);
    orbitControls.target.lerpVectors(flyAnim.startTarget, flyAnim.endTarget, ease);
    if (t >= 1) flyAnim = null;
  }

  if (mode === 'walk') {
    const speed = (keys['ShiftLeft'] || keys['ShiftRight'] ? 28 : 13) * dt;
    if (keys['KeyW'] || keys['ArrowUp']) walkControls.moveForward(speed);
    if (keys['KeyS'] || keys['ArrowDown']) walkControls.moveForward(-speed);
    if (keys['KeyA'] || keys['ArrowLeft']) walkControls.moveRight(-speed);
    if (keys['KeyD'] || keys['ArrowRight']) walkControls.moveRight(speed);
    const groundY = getTerrainHeight(camera.position.x, camera.position.z);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, groundY + 2.1, 0.25);
  } else {
    orbitControls.update();
  }

  // Subtle live-scene motion (hide clouds during high-altitude top-down map view)
  cloudsGroup.visible = camera.position.y < 165;
  cloudClusters.forEach((cg, idx) => {
    cg.position.x += dt * (1.2 + (idx % 3) * 0.4);
    if (cg.position.x > 280) cg.position.x = -280;
  });

  if (animatedParts.poolMat?.map) {
    animatedParts.poolMat.map.offset.x += dt * 0.025;
    animatedParts.poolMat.map.offset.y += dt * 0.015;
  }

  if (animatedParts.fountainJet) {
    const s = 0.88 + Math.sin(elapsed * 5.2) * 0.14;
    animatedParts.fountainJet.scale.set(1, s, 1);
  }

  animatedParts.flags.forEach((flag, idx) => {
    flag.rotation.y = Math.sin(elapsed * 3.2 + idx) * 0.14;
  });

  if (animatedParts.tugGroup) {
    animatedParts.tugGroup.position.x = 6 + Math.sin(elapsed * 2.2) * 0.25;
  }

  if (animatedParts.beaconMat && animatedParts.beaconLight) {
    const nightFactor = TIME_PRESETS[timeIdx].nightFactor;
    const pulse = (Math.sin(elapsed * 4.0) + 1) * 0.5;
    animatedParts.beaconMat.emissiveIntensity = 0.25 + pulse * (0.6 + nightFactor * 2.5);
    animatedParts.beaconLight.intensity = nightFactor * pulse * 14;
  }

  // Update 2D projected landmark pins (with anti-overlap filtering on small mobile screens)
  if (showLabels) {
    const isMobile = isMobileQuery.matches;
    const placedBoxes = [];

    // Process active landmark first so it is always visible on mobile
    const orderedLandmarks = [...LANDMARKS_1996].sort((a, b) => {
      if (a.id === activeLandmarkId) return -1;
      if (b.id === activeLandmarkId) return 1;
      return 0;
    });

    orderedLandmarks.forEach((lm) => {
      const pin = pinElements.get(lm.id);
      if (!pin) return;
      projVec.set(lm.pos[0], lm.pos[1] + 5, lm.pos[2]);
      projVec.project(camera);

      if (projVec.z > 1 || projVec.z < -1) {
        pin.style.opacity = '0';
        pin.style.pointerEvents = 'none';
        return;
      }

      const x = (projVec.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projVec.y * 0.5 + 0.5) * window.innerHeight;
      pin.style.left = `${x}px`;
      pin.style.top = `${y}px`;

      if (isMobile && lm.id !== activeLandmarkId) {
        // Avoid overlapping top bar or other pins on compact phone screens
        if (y < 105 || y > window.innerHeight - 48) {
          pin.style.opacity = '0';
          pin.style.pointerEvents = 'none';
          return;
        }
        const overlaps = placedBoxes.some((b) => Math.abs(b.x - x) < 74 && Math.abs(b.y - y) < 26);
        if (overlaps) {
          pin.style.opacity = '0';
          pin.style.pointerEvents = 'none';
          return;
        }
      }

      placedBoxes.push({ x, y });
      pin.style.opacity = '1';
      pin.style.pointerEvents = 'auto';
    });
  }

  drawMinimap();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
