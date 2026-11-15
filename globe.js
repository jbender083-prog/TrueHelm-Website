import * as THREE from './assets/vendor/three/three.module.min.js';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';
import { GLTFLoader } from './assets/vendor/three/GLTFLoader.js';

(function initTrueHelmLiveGlobe() {
  const canvas = document.getElementById('globe-canvas');
  const stageEl = document.getElementById('globe-stage');
  const loadingOverlay = document.getElementById('globe-loading-overlay');
  const loadingText = document.getElementById('globe-loading-text');
  if (!canvas || !stageEl) return;

  // Constants matching Public/ShipTypes.h + generate_truehelm_globe_assets.py 1-to-1
  const GLOBE_RADIUS = 100.0;
  let globeLonHalfUU = 268000000.0;
  let globeLatHalfUU = 278000000.0;
  let firebaseLiveUrl = 'https://truehelm-global-ocean-default-rtdb.firebaseio.com/us_ocean_players.json';

  const POLL_INTERVAL_MS = 2500;
  const STALE_PLAYER_SEC = 45.0;
  const TOTAL_SHIPS = 35;

  // DOM Elements
  const hudShipsPill = document.getElementById('globe-hud-ships-pill');
  const btnWhole = document.getElementById('globe-btn-whole');
  const btnHub = document.getElementById('globe-btn-hub');
  const btnZoomIn = document.getElementById('globe-btn-zoom-in');
  const btnZoomOut = document.getElementById('globe-btn-zoom-out');
  const btnSpin = document.getElementById('globe-btn-spin');

  const inspBadge = document.getElementById('globe-insp-badge');
  const inspRegion = document.getElementById('globe-insp-region');
  const inspTitle = document.getElementById('globe-insp-title');
  const inspDesc = document.getElementById('globe-insp-desc');
  const inspFocusBtn = document.getElementById('globe-insp-focus-btn');
  const inspPhotoBtn = document.getElementById('globe-insp-photo-btn');

  const serverStatusText = document.getElementById('globe-server-status-text');
  const demoBadgeEl = document.getElementById('globe-demo-badge');
  const syncMetaEl = document.getElementById('globe-sync-meta');
  const zeroNoticeEl = document.getElementById('globe-zero-notice');
  const demoToggleBtn = document.getElementById('globe-demo-toggle-btn');
  const rosterHeadingEl = document.getElementById('globe-roster-heading');
  const rosterCountEl = document.getElementById('globe-roster-count');
  const shipsListEl = document.getElementById('globe-ships-list');

  const filterPills = Array.from(document.querySelectorAll('.globe-filter-pill[data-isl-filter]'));
  const islandSearchInput = document.getElementById('globe-island-search');
  const islandsListEl = document.getElementById('globe-islands-list');

  // Sanitize any external Firebase player/company strings (strips email domains + enforces zero forbidden tokens)
  function sanitizeMaritimeText(raw, fallback = 'Captain') {
    let s = String(raw == null ? '' : raw).trim();
    if (!s) return fallback;
    if (s.includes('@')) {
      s = s.split('@')[0].trim() || fallback;
    }
    s = s.replace(/\b(mac|macos|macbook|apple\s*silicon|apple\s*m[1-9]|\.dmg)\b/gi, 'PC');
    return s.slice(0, 44);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  // =========================================================================
  // 1. EXACT SHARED 1-TO-1 PROJECTION: UNREAL (X, Y) <-> GLOBE 3D SPHERE
  // =========================================================================
  function worldXYToLatLon(xUU, yUU) {
    const lonDeg = (Number(xUU || 0) / globeLonHalfUU) * 180.0;
    const latDeg = -(Number(yUU || 0) / globeLatHalfUU) * 90.0;
    return { latDeg, lonDeg };
  }

  function worldXYToSphere3D(xUU, yUU, radius = GLOBE_RADIUS) {
    const x = Number(xUU || 0);
    const y = Number(yUU || 0);
    const uFrac = (((0.5 + x / (2.0 * globeLonHalfUU)) % 1.0) + 1.0) % 1.0;
    const vTopFrac = Math.min(0.985, Math.max(0.015, 0.5 + y / (2.0 * globeLatHalfUU)));
    const phi = uFrac * Math.PI * 2.0;
    const theta = vTopFrac * Math.PI;
    return new THREE.Vector3(
      -radius * Math.cos(phi) * Math.sin(theta),
       radius * Math.cos(theta),
       radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  const _tmpP0 = new THREE.Vector3();
  const _tmpP1 = new THREE.Vector3();
  const _tmpUp = new THREE.Vector3();
  const _tmpFwd = new THREE.Vector3();
  const _tmpPort = new THREE.Vector3();
  const _tmpMat4 = new THREE.Matrix4();

  function computeShipFrameOnSphere(xUU, yUU, yawDeg, surfaceClearance = 0.08) {
    _tmpP0.copy(worldXYToSphere3D(xUU, yUU, GLOBE_RADIUS));
    _tmpUp.copy(_tmpP0).normalize();

    const yawRad = (Number(yawDeg || 0) * Math.PI) / 180.0;
    const ds = 25000.0; // 250 m tangent step in UU
    _tmpP1.copy(
      worldXYToSphere3D(
        Number(xUU || 0) + Math.cos(yawRad) * ds,
        Number(yUU || 0) + Math.sin(yawRad) * ds,
        GLOBE_RADIUS
      )
    );
    _tmpFwd.subVectors(_tmpP1, _tmpP0).projectOnPlane(_tmpUp);
    if (_tmpFwd.lengthSq() < 1e-8) {
      _tmpFwd.set(0, 1, 0).projectOnPlane(_tmpUp);
    }
    _tmpFwd.normalize();
    // Right-handed basis: (+X = Port, +Y = Up, +Z = Bow Forward) -> det = +1 (zero mirror flip!)
    _tmpPort.crossVectors(_tmpUp, _tmpFwd).normalize();
    _tmpMat4.makeBasis(_tmpPort, _tmpUp, _tmpFwd);

    const quat = new THREE.Quaternion().setFromRotationMatrix(_tmpMat4);
    const pos = _tmpUp.clone().multiplyScalar(GLOBE_RADIUS + surfaceClearance);
    return {
      pos,
      quat,
      up: _tmpUp.clone(),
      fwd: _tmpFwd.clone(),
      port: _tmpPort.clone()
    };
  }

  function shortestAngleDeltaDeg(fromDeg, toDeg) {
    let diff = ((toDeg - fromDeg + 540) % 360) - 180;
    if (diff < -180) diff += 360;
    return diff;
  }

  // =========================================================================
  // 2. THREE.JS WEBGL SCENE, GLOBE, ATMOSPHERE, STARFIELD & ORBIT CONTROLS
  // =========================================================================
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    if (loadingText) {
      loadingText.textContent = '3D WebGL is unavailable in this browser context.';
    }
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.25, 1600);
  // Frame both Port Horizon Hub (#01) + Eastern/Southern Continental Countries (#46, #49, #55, #57, #63)
  const DEFAULT_CAM_POS = new THREE.Vector3(178, -32, -138);
  camera.position.copy(DEFAULT_CAM_POS);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.85;
  controls.minDistance = 103.0;
  controls.maxDistance = 305.0;
  // Keep vertical page scroll smooth unless user clicks/interacts inside the globe
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;

  let wheelZoomArmed = false;
  canvas.addEventListener('pointerdown', () => {
    wheelZoomArmed = true;
    controls.enableZoom = true;
  });
  stageEl.addEventListener('pointerleave', () => {
    wheelZoomArmed = false;
    controls.enableZoom = false;
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        controls.enableZoom = true;
      } else if (!wheelZoomArmed) {
        controls.enableZoom = false;
      }
    },
    { passive: true }
  );

  // Rich 360° Sunlit Maritime Lighting (camera-tracked key sun so no continent or ship is ever hidden in shadow)
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0b2545, 1.38);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
  scene.add(ambientLight);

  const keySunLight = new THREE.DirectionalLight(0xfffbeb, 2.05);
  scene.add(keySunLight);
  scene.add(keySunLight.target);

  const rimCoolLight = new THREE.DirectionalLight(0x38bdf8, 0.72);
  scene.add(rimCoolLight);
  scene.add(rimCoolLight.target);

  // 3D Deep-Space Starfield Backdrop
  (function buildStarfield() {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 460 + ((i * 73) % 260);
      const u = ((i * 0.6180339887) % 1);
      const v = ((i * 0.3819660113 + 0.17) % 1);
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const tint = i % 5 === 0 ? [0.62, 0.86, 1.0] : [0.9, 0.95, 1.0];
      colors[i * 3] = tint[0];
      colors[i * 3 + 1] = tint[1];
      colors[i * 3 + 2] = tint[2];
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    });
    scene.add(new THREE.Points(starGeo, starMat));
  })();

  // Globe Group
  const globeRoot = new THREE.Group();
  scene.add(globeRoot);

  const texLoader = new THREE.TextureLoader();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 4);

  const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 96);
  const globeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.44,
    roughness: 0.86,
    metalness: 0.02,
    bumpScale: 1.45
  });
  const globeMesh = new THREE.Mesh(globeGeo, globeMat);
  globeRoot.add(globeMesh);

  // Load 1-to-1 Baked Albedo + Bump Maps
  texLoader.load(
    './assets/globe/truehelm_globe_albedo.jpg',
    (albedoTex) => {
      albedoTex.colorSpace = THREE.SRGBColorSpace;
      albedoTex.anisotropy = maxAniso;
      albedoTex.wrapS = THREE.RepeatWrapping;
      albedoTex.wrapT = THREE.ClampToEdgeWrapping;
      globeMat.map = albedoTex;
      globeMat.emissiveMap = albedoTex;
      globeMat.needsUpdate = true;
      if (loadingOverlay) loadingOverlay.hidden = true;
    },
    undefined,
    () => {
      globeMat.color.setHex(0x0c345a);
      globeMat.emissive.setHex(0x061d36);
      if (loadingOverlay) loadingOverlay.hidden = true;
    }
  );

  texLoader.load('./assets/globe/truehelm_globe_bump.jpg', (bumpTex) => {
    bumpTex.anisotropy = maxAniso;
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.ClampToEdgeWrapping;
    globeMat.bumpMap = bumpTex;
    globeMat.needsUpdate = true;
  });

  // Outer Fresnel Atmosphere Rim Halo
  const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.042, 64, 48);
  const atmosMat = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x38bdf8) }
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vNormalView = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec3 n = normalize(vNormalView);
        vec3 v = normalize(vViewPos);
        float rim = clamp(1.0 - abs(dot(n, v)), 0.0, 1.0);
        float intensity = pow(rim, 3.2) * 0.68;
        gl_FragColor = vec4(glowColor, intensity);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  globeRoot.add(new THREE.Mesh(atmosGeo, atmosMat));

  // Subtle Equatorial & Prime Meridian Nautical Chart Rings
  (function addChartRings() {
    const segs = 180;
    const eqPts = [];
    const pmPts = [];
    const r = GLOBE_RADIUS + 0.045;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      eqPts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      pmPts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.2
    });
    globeRoot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(eqPts), ringMat));
    globeRoot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pmPts), ringMat));
  })();

  // Pulsing Selection Reticle on Surface
  const selectionRingGeo = new THREE.RingGeometry(0.65, 0.92, 40);
  const selectionRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthTest: true
  });
  const selectionRing = new THREE.Mesh(selectionRingGeo, selectionRingMat);
  selectionRing.visible = false;
  globeRoot.add(selectionRing);

  // =========================================================================
  // 3. CRISP SPRITE TEXT LABELS FOR HUBS, SELECTED ISLAND & LIVE SHIPS
  // =========================================================================
  function createTextSprite(text, accentHex = '#38bdf8', bgAlpha = 0.84) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = '700 24px Inter, Segoe UI, sans-serif';
    ctx.font = font;
    const padX = 18;
    const textW = Math.ceil(ctx.measureText(text).width);
    c.width = Math.max(64, textW + padX * 2 + 8);
    c.height = 46;

    ctx.font = font;
    ctx.fillStyle = `rgba(5, 15, 29, ${bgAlpha})`;
    const r = 11;
    ctx.beginPath();
    ctx.roundRect(2, 2, c.width - 4, c.height - 4, r);
    ctx.fill();

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = accentHex;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, c.width / 2, c.height / 2 + 1);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.userData.aspect = c.width / c.height;
    sprite.renderOrder = 12;
    return sprite;
  }

  // =========================================================================
  // 4. 74 ISLANDS, 32 GOLD PORT BEACONS & 42 EMERALD SCENIC ISLANDS (1:1)
  // =========================================================================
  const islandsGroup = new THREE.Group();
  const shorelinesGroup = new THREE.Group();
  globeRoot.add(shorelinesGroup);
  globeRoot.add(islandsGroup);

  let islandsCatalog = [];
  const islandsById = new Map();
  const islandsByNameLower = new Map();
  const islandPickMeshes = [];
  let activeIslandFilter = 'all';
  let islandSearchQuery = '';

  // Shared Beacon Geometries & Materials
  const portPillarGeo = new THREE.CylinderGeometry(0.11, 0.22, 1.0, 8);
  portPillarGeo.translate(0, 0.5, 0);
  const portLanternGeo = new THREE.SphereGeometry(0.24, 12, 10);
  const portRingGeo = new THREE.RingGeometry(0.32, 0.52, 20);
  portRingGeo.rotateX(-Math.PI / 2);

  const scenicGemGeo = new THREE.OctahedronGeometry(0.22, 0);
  const scenicStemGeo = new THREE.CylinderGeometry(0.07, 0.14, 0.7, 6);
  scenicStemGeo.translate(0, 0.35, 0);
  const scenicRingGeo = new THREE.RingGeometry(0.24, 0.38, 16);
  scenicRingGeo.rotateX(-Math.PI / 2);

  const hitSphereGeo = new THREE.SphereGeometry(1.05, 8, 8);
  const hitInvisibleMat = new THREE.MeshBasicMaterial({ visible: false });

  const goldPillarMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.25
  });
  const goldLanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const goldRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.78
  });

  const emeraldStemMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x047857,
    emissiveIntensity: 0.4,
    roughness: 0.4,
    metalness: 0.2
  });
  const emeraldGemMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
  const emeraldRingMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65
  });

  const portShoreMat = new THREE.LineBasicMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.62
  });
  const scenicShoreMat = new THREE.LineBasicMaterial({
    color: 0x6ee7b7,
    transparent: true,
    opacity: 0.46
  });
  const berthDotGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const berthDotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const landmarkSprites = [];
  let selectedIslandSprite = null;

  function buildIslandsOnGlobe(worldJson) {
    if (worldJson.meta) {
      if (worldJson.meta.globeLonHalfSpanUU) globeLonHalfUU = Number(worldJson.meta.globeLonHalfSpanUU);
      if (worldJson.meta.globeLatHalfSpanUU) globeLatHalfUU = Number(worldJson.meta.globeLatHalfSpanUU);
      if (worldJson.meta.firebaseLivePlayersUrl) firebaseLiveUrl = String(worldJson.meta.firebaseLivePlayersUrl);
    }

    islandsCatalog = Array.isArray(worldJson.islands) ? worldJson.islands : [];
    islandsById.clear();
    islandsByNameLower.clear();

    const majorLabelIds = new Set([1, 9, 15, 23, 24, 46, 49, 55, 57, 63, 74]);

    islandsCatalog.forEach((isl) => {
      islandsById.set(isl.id, isl);
      islandsByNameLower.set(String(isl.name || '').toLowerCase(), isl);

      const pos = worldXYToSphere3D(isl.x, isl.y, GLOBE_RADIUS);
      const up = pos.clone().normalize();
      const markerGroup = new THREE.Group();
      markerGroup.position.copy(pos);
      markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);

      const heightBoost = 0.85 + Math.log2(1 + Number(isl.scale || 1)) * 0.42;

      if (isl.hasPortDock) {
        const pillar = new THREE.Mesh(portPillarGeo, goldPillarMat);
        pillar.scale.set(1, heightBoost * 1.35, 1);
        markerGroup.add(pillar);

        const lantern = new THREE.Mesh(portLanternGeo, goldLanternMat);
        lantern.position.set(0, heightBoost * 1.35 + 0.14, 0);
        markerGroup.add(lantern);

        const baseRing = new THREE.Mesh(portRingGeo, goldRingMat);
        baseRing.position.set(0, 0.05, 0);
        baseRing.scale.setScalar(0.9 + Math.min(1.3, Number(isl.scale || 1) * 0.14));
        markerGroup.add(baseRing);

        // Exact Western Harbor Berth Marker
        const berthPos = worldXYToSphere3D(isl.berthX, isl.berthY, GLOBE_RADIUS + 0.055);
        const berthDot = new THREE.Mesh(berthDotGeo, berthDotMat);
        berthDot.position.copy(berthPos);
        shorelinesGroup.add(berthDot);
      } else {
        const stem = new THREE.Mesh(scenicStemGeo, emeraldStemMat);
        stem.scale.set(1, heightBoost, 1);
        markerGroup.add(stem);

        const gem = new THREE.Mesh(scenicGemGeo, emeraldGemMat);
        gem.position.set(0, heightBoost * 0.7 + 0.14, 0);
        markerGroup.add(gem);

        const baseRing = new THREE.Mesh(scenicRingGeo, emeraldRingMat);
        baseRing.position.set(0, 0.04, 0);
        markerGroup.add(baseRing);
      }

      // Generous invisible raycast hit sphere for effortless touch/click picking
      const hitMesh = new THREE.Mesh(hitSphereGeo, hitInvisibleMat);
      hitMesh.position.set(0, 0.6, 0);
      hitMesh.userData = { pickType: 'island', islandId: isl.id };
      markerGroup.add(hitMesh);
      islandPickMeshes.push(hitMesh);

      markerGroup.userData = { islandId: isl.id, basePos: pos.clone(), up: up.clone() };
      islandsGroup.add(markerGroup);
      isl._markerGroup = markerGroup;

      // Exact 1-to-1 Shoreline Polygon Loop (visible cleanly when zoomed into archipelago/harbor scale)
      if (Array.isArray(isl.shorelinePolygonXY) && isl.shorelinePolygonXY.length >= 3) {
        const pts = isl.shorelinePolygonXY.map((pt) =>
          worldXYToSphere3D(pt[0], pt[1], GLOBE_RADIUS + 0.04)
        );
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineLoop = new THREE.LineLoop(lineGeo, isl.hasPortDock ? portShoreMat : scenicShoreMat);
        shorelinesGroup.add(lineLoop);
      }

      // Key Hub / Continental Landmark Labels
      if (majorLabelIds.has(isl.id)) {
        const tag = `#${pad2(isl.id)} ${isl.name}`;
        const spr = createTextSprite(tag, isl.hasPortDock ? '#fbbf24' : '#34d399', 0.8);
        spr.position.copy(up).multiplyScalar(GLOBE_RADIUS + heightBoost * 1.35 + 1.25);
        spr.userData.normal = up.clone();
        spr.userData.islandId = isl.id;
        globeRoot.add(spr);
        landmarkSprites.push(spr);
      }
    });

    renderIslandsDirectory();
  }

  function findNearestIsland(xUU, yUU) {
    if (!islandsCatalog.length) return null;
    let best = null;
    let bestD2 = Infinity;
    const x = Number(xUU || 0);
    const y = Number(yUU || 0);
    for (let i = 0; i < islandsCatalog.length; i++) {
      const isl = islandsCatalog[i];
      const dx = isl.x - x;
      const dy = isl.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = isl;
      }
    }
    return best
      ? { island: best, distKm: Math.sqrt(bestD2) / 100000.0 }
      : null;
  }

  function resolveDestinationIsland(rawDst) {
    if (rawDst == null || rawDst === '') return null;
    if (typeof rawDst === 'number') {
      const idx = Math.round(rawDst);
      return idx >= 0 && idx < islandsCatalog.length ? islandsCatalog[idx] : null;
    }
    const str = String(rawDst).trim();
    if (!str || str === '-1') return null;
    if (/^\d+$/.test(str)) {
      const idx = Number(str);
      if (idx >= 0 && idx < islandsCatalog.length) return islandsCatalog[idx];
    }
    return islandsByNameLower.get(str.toLowerCase()) || null;
  }

  // =========================================================================
  // 5. 35 SCALED-DOWN BLENDER .GLB SHIP LOADER & CACHE
  // =========================================================================
  const gltfLoader = new GLTFLoader();
  const glbPrototypeCache = new Map();
  const glbLoadingPromises = new Map();
  const loadedGlbIds = new Set();
  const shipManifestById = new Map();

  function getShipCatalogMeta(shipNum) {
    const clamped = Math.min(TOTAL_SHIPS, Math.max(1, Math.round(Number(shipNum) || 1)));
    const fromApp = window.TRUEHELM_SHIPS_BY_NUM && window.TRUEHELM_SHIPS_BY_NUM[clamped];
    const fromManifest = shipManifestById.get(clamped);
    return {
      num: clamped,
      id: `#${pad2(clamped)}`,
      name: fromApp ? fromApp.name.replace(' ★', '') : `Vessel #${pad2(clamped)}`,
      cls: fromApp ? fromApp.cls : 'Ocean Vessel',
      speed: fromApp ? fromApp.speed : '18.0 knots',
      glbUrl: `./assets/models/ships/ship_${pad2(clamped)}.glb`,
      normalizedLen: fromManifest ? Number(fromManifest.glbNormalizedLength || 0.7) : 0.7
    };
  }

  function tuneGlbMaterials(rootObj) {
    rootObj.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = false;
      node.receiveShadow = false;
      if (node.geometry) {
        node.geometry.computeVertexNormals();
      }
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((m) => {
        if (!m) return;
        m.side = THREE.DoubleSide;
        if (typeof m.metalness === 'number') {
          m.metalness = Math.min(m.metalness, 0.22);
        }
        if (typeof m.roughness === 'number') {
          m.roughness = Math.max(m.roughness, 0.42);
        }
        m.needsUpdate = true;
      });
    });
  }

  function loadShipGlbPrototype(shipNum) {
    const clamped = Math.min(TOTAL_SHIPS, Math.max(1, Math.round(Number(shipNum) || 1)));
    if (glbPrototypeCache.has(clamped)) {
      return Promise.resolve(glbPrototypeCache.get(clamped));
    }
    if (glbLoadingPromises.has(clamped)) {
      return glbLoadingPromises.get(clamped);
    }
    const url = `./assets/models/ships/ship_${pad2(clamped)}.glb`;
    const p = new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const proto = gltf.scene;
          tuneGlbMaterials(proto);
          glbPrototypeCache.set(clamped, proto);
          loadedGlbIds.add(clamped);
          resolve(proto);
        },
        undefined,
        (err) => {
          glbLoadingPromises.delete(clamped);
          reject(err);
        }
      );
    });
    glbLoadingPromises.set(clamped, p);
    return p;
  }

  // Sleek temporary placeholder hull shown for the ~40ms before ship_XX.glb finishes loading
  function createFallbackMiniHull() {
    const grp = new THREE.Group();
    const hullGeo = new THREE.BoxGeometry(0.16, 0.08, 0.72);
    hullGeo.translate(0, 0.04, 0);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.45, metalness: 0.2 });
    grp.add(new THREE.Mesh(hullGeo, hullMat));

    const bridgeGeo = new THREE.BoxGeometry(0.14, 0.1, 0.12);
    bridgeGeo.translate(0, 0.12, -0.14);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    grp.add(new THREE.Mesh(bridgeGeo, bridgeMat));
    return grp;
  }

  // =========================================================================
  // 6. ACTIVE 3D SHIPS ON GLOBE (BLENDER .GLB + WAKE + BEACON + COURSE ARC)
  // =========================================================================
  const shipsGroup = new THREE.Group();
  const routesGroup = new THREE.Group();
  globeRoot.add(routesGroup);
  globeRoot.add(shipsGroup);

  const shipEntities = new Map(); // key -> entity
  const shipPickMeshes = [];

  const shipBeaconRingGeo = new THREE.RingGeometry(0.54, 0.585, 36);
  shipBeaconRingGeo.rotateX(-Math.PI / 2);

  function createWakeRibbonMesh(accentHex) {
    // V-wake fan behind stern (-Z in canonical ship space: +Z is Bow, -Z is Stern!)
    const verts = new Float32Array([
      0.0, 0.012, -0.32,
     -0.28, 0.012, -1.25,
      0.28, 0.012, -1.25
    ]);
    const uvs = new Float32Array([
      0.5, 1.0,
      0.0, 0.0,
      1.0, 0.0
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(accentHex) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
          float alpha = pow(vUv.y, 1.35) * (0.35 + 0.65 * smoothstep(0.0, 0.35, edge));
          gl_FragColor = vec4(mix(uColor, vec3(0.92, 0.98, 1.0), 0.55), alpha * 0.58);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    return new THREE.Mesh(geo, mat);
  }

  function rebuildShipPickList() {
    shipPickMeshes.length = 0;
    shipEntities.forEach((ent) => {
      if (ent.hitMesh) shipPickMeshes.push(ent.hitMesh);
    });
  }

  function ensureShipEntity(vesselData) {
    let ent = shipEntities.get(vesselData.key);
    const shipNum = Math.min(TOTAL_SHIPS, Math.max(1, Math.round(Number(vesselData.ship || 1))));
    const accentHex = vesselData.isDemo ? '#fbbf24' : '#38bdf8';
    const accentColor = vesselData.isDemo ? 0xfbbf24 : 0x38bdf8;

    if (!ent) {
      const root = new THREE.Group();
      const modelHolder = new THREE.Group();
      root.add(modelHolder);

      const placeholder = createFallbackMiniHull();
      modelHolder.add(placeholder);

      const ringMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });
      const beaconRing = new THREE.Mesh(shipBeaconRingGeo, ringMat);
      beaconRing.position.set(0, 0.018, 0);
      modelHolder.add(beaconRing);

      const wakeMesh = createWakeRibbonMesh(accentHex);
      modelHolder.add(wakeMesh);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 8, 8),
        hitInvisibleMat
      );
      hitMesh.position.set(0, 0.25, 0);
      hitMesh.userData = { pickType: 'ship', shipKey: vesselData.key };
      modelHolder.add(hitMesh);

      const labelText = `${vesselData.captain} · #${pad2(shipNum)}`;
      const labelSprite = createTextSprite(labelText, accentHex, 0.86);
      globeRoot.add(labelSprite);

      shipsGroup.add(root);

      ent = {
        key: vesselData.key,
        shipNum: 0,
        labelKey: labelText,
        root,
        modelHolder,
        beaconRing,
        wakeMesh,
        hitMesh,
        labelSprite,
        routeLine: null,
        routeDstName: '',
        curX: Number(vesselData.x || 0),
        curY: Number(vesselData.y || 0),
        curYaw: Number(vesselData.yaw || 0),
        targetX: Number(vesselData.x || 0),
        targetY: Number(vesselData.y || 0),
        targetYaw: Number(vesselData.yaw || 0),
        data: vesselData,
        glbLoaded: false
      };
      shipEntities.set(vesselData.key, ent);
      rebuildShipPickList();
    }

    ent.data = vesselData;
    ent.targetX = Number(vesselData.x || 0);
    ent.targetY = Number(vesselData.y || 0);
    ent.targetYaw = Number(vesselData.yaw || 0);

    // Swap or load exact scaled-down Blender .glb model if ship hull ID changed
    if (ent.shipNum !== shipNum) {
      ent.shipNum = shipNum;
      ent.glbLoaded = false;
      loadShipGlbPrototype(shipNum)
        .then((proto) => {
          if (!shipEntities.has(ent.key) || ent.shipNum !== shipNum) return;
          // Remove previous model mesh while keeping beaconRing, wakeMesh, hitMesh
          const keep = new Set([ent.beaconRing, ent.wakeMesh, ent.hitMesh]);
          for (let i = ent.modelHolder.children.length - 1; i >= 0; i--) {
            const ch = ent.modelHolder.children[i];
            if (!keep.has(ch)) ent.modelHolder.remove(ch);
          }
          const clonedGlb = proto.clone(true);
          // Seat hull at true Plimsoll boot-topping waterline so full freeboard & bow flare sit proudly above water
          clonedGlb.position.y = 0.072;
          ent.modelHolder.add(clonedGlb);
          ent.glbLoaded = true;
        })
        .catch(() => {});
    }

    // Update label if captain or ship # changed
    const nextLabel = `${vesselData.captain} · #${pad2(shipNum)}`;
    if (ent.labelKey !== nextLabel) {
      ent.labelKey = nextLabel;
      globeRoot.remove(ent.labelSprite);
      if (ent.labelSprite.material.map) ent.labelSprite.material.map.dispose();
      ent.labelSprite.material.dispose();
      ent.labelSprite = createTextSprite(nextLabel, accentHex, 0.86);
      globeRoot.add(ent.labelSprite);
    }

    // Optional Great-Circle Course Arc toward pkt.dst (0-based island index or island name)
    const dstIsl = resolveDestinationIsland(vesselData.dstRaw != null ? vesselData.dstRaw : vesselData.dst);
    const dstKey = dstIsl ? `isl_${dstIsl.id}` : '';
    if (dstIsl) {
      if (ent.routeDstName !== dstKey || !ent.routeLine) {
        if (ent.routeLine) {
          routesGroup.remove(ent.routeLine);
          ent.routeLine.geometry.dispose();
        }
        ent.routeDstName = dstKey;
        const routeGeo = new THREE.BufferGeometry();
        const routeMat = new THREE.LineDashedMaterial({
          color: accentColor,
          dashSize: 0.75,
          gapSize: 0.45,
          transparent: true,
          opacity: 0.6
        });
        ent.routeLine = new THREE.Line(routeGeo, routeMat);
        routesGroup.add(ent.routeLine);
      }
      const startV = worldXYToSphere3D(ent.curX, ent.curY, GLOBE_RADIUS + 0.14);
      const endV = worldXYToSphere3D(dstIsl.berthX || dstIsl.x, dstIsl.berthY || dstIsl.y, GLOBE_RADIUS + 0.14);
      const arcPts = [];
      const arcSteps = 28;
      for (let s = 0; s <= arcSteps; s++) {
        const t = s / arcSteps;
        const v = new THREE.Vector3().lerpVectors(startV, endV, t).normalize();
        const lift = Math.sin(t * Math.PI) * 0.55;
        v.multiplyScalar(GLOBE_RADIUS + 0.14 + lift);
        arcPts.push(v);
      }
      ent.routeLine.geometry.setFromPoints(arcPts);
      ent.routeLine.computeLineDistances();
    } else if (ent.routeLine) {
      routesGroup.remove(ent.routeLine);
      ent.routeLine.geometry.dispose();
      ent.routeLine = null;
      ent.routeDstName = '';
    }

    return ent;
  }

  function pruneShipEntities(activeKeysSet) {
    let removed = false;
    shipEntities.forEach((ent, key) => {
      if (!activeKeysSet.has(key)) {
        shipsGroup.remove(ent.root);
        globeRoot.remove(ent.labelSprite);
        if (ent.labelSprite.material.map) ent.labelSprite.material.map.dispose();
        ent.labelSprite.material.dispose();
        if (ent.routeLine) {
          routesGroup.remove(ent.routeLine);
          ent.routeLine.geometry.dispose();
        }
        shipEntities.delete(key);
        removed = true;
      }
    });
    if (removed) rebuildShipPickList();
  }

  // =========================================================================
  // 7. LIVE FIREBASE US OCEAN SERVER SYNC + DEMO 3D SHIPS PREVIEW
  // =========================================================================
  const seenFirebaseRecords = new Map(); // key -> { firstSeenMs, lastSeq, lastTs, lastAdvancedMs }
  let rawFirebasePayload = {};
  let injectedTestPackets = null;
  let livePlayersList = [];
  let demoMode = false;
  let userManuallyToggledDemo = false;
  let lastSyncTimeStr = 'connecting...';
  let sseConnected = false;

  // 7 Real Shipping Lane Routes for [Preview 3D Ships on Globe] Demo Mode
  const DEMO_FLEET_SPECS = [
    { key: 'demo_titan_32', captain: 'Capt. Vance', company: 'Horizon Mega-Lines', ship: 32, spd: 11.4, teu: 19400, fromId: 1, toId: 27, phase: 0.22 },
    { key: 'demo_prelude_34', captain: 'Capt. Elena', company: 'Solaria Cryo LNG', ship: 34, spd: 11.0, teu: 24200, fromId: 24, toId: 15, phase: 0.38 },
    { key: 'demo_floflo_35', captain: 'Capt. Kaelen', company: 'Aegis Heavy Lift', ship: 35, spd: 14.6, teu: 3600, fromId: 23, toId: 9, phase: 0.61 },
    { key: 'demo_lng_22', captain: 'Capt. Soren', company: 'Borealis Gas Fleet', ship: 22, spd: 19.2, teu: 4800, fromId: 12, toId: 4, phase: 0.48 },
    { key: 'demo_roro_16', captain: 'Capt. Mira', company: 'Calypso Ro-Ro', ship: 16, spd: 20.5, teu: 2150, fromId: 6, toId: 1, phase: 0.71 },
    { key: 'demo_coastal_08', captain: 'Capt. Rook', company: 'Coral Feeder Co.', ship: 8, spd: 22.4, teu: 420, fromId: 2, toId: 5, phase: 0.31 },
    { key: 'demo_tug_01', captain: 'Capt. Thorne', company: 'Port Horizon Towage', ship: 1, spd: 16.8, teu: 40, fromId: 1, toId: 4, phase: 0.08 }
  ];

  function buildDemoVessels(nowSec) {
    if (!islandsCatalog.length) return [];
    return DEMO_FLEET_SPECS.map((d) => {
      const a = islandsById.get(d.fromId) || islandsCatalog[0];
      const b = islandsById.get(d.toId) || islandsCatalog[Math.min(3, islandsCatalog.length - 1)];
      const ax = a.berthX || a.x;
      const ay = a.berthY || a.y;
      const bx = b.berthX || b.x;
      const by = b.berthY || b.y;

      // Ping-pong smoothly along the shipping lane over ~220 seconds
      const cycle = ((nowSec * 0.0045 + d.phase) % 2.0);
      const t = cycle <= 1.0 ? cycle : 2.0 - cycle;
      const forwardDir = cycle <= 1.0;

      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      const dx = forwardDir ? (bx - ax) : (ax - bx);
      const dy = forwardDir ? (by - ay) : (ay - by);
      const yaw = (Math.atan2(dy, dx) * 180.0) / Math.PI;
      const dstIsl = forwardDir ? b : a;

      return {
        key: d.key,
        captain: d.captain,
        company: d.company,
        ship: d.ship,
        x,
        y,
        yaw,
        spd: d.spd,
        teu: d.teu,
        dst: dstIsl.name,
        autopilot: true,
        crewNames: [],
        isDemo: true
      };
    });
  }

  function parseLiveFirebasePlayers(payloadMap) {
    const merged = Object.assign({}, payloadMap || {}, injectedTestPackets || {});
    const nowMs = Date.now();
    const nowSec = nowMs / 1000.0;

    const activeRecords = [];
    Object.entries(merged).forEach(([key, pkt]) => {
      if (!pkt || typeof pkt !== 'object') return;
      if (pkt.disc === true) return;

      const seq = Number(pkt.seq || 0);
      const ts = Number(pkt.ts || 0);
      let st = seenFirebaseRecords.get(key);
      if (!st) {
        st = { firstSeenMs: nowMs, lastSeq: seq, lastTs: ts, lastAdvancedMs: 0 };
        seenFirebaseRecords.set(key, st);
      } else if (seq !== st.lastSeq || ts !== st.lastTs) {
        st.lastSeq = seq;
        st.lastTs = ts;
        st.lastAdvancedMs = nowMs;
      }

      const ageSec = nowSec - ts;
      const recentlyAdvanced = st.lastAdvancedMs > 0 && (nowMs - st.lastAdvancedMs) <= 15000;
      const frozenCrashGhost =
        (nowMs - st.firstSeenMs) > 6500 &&
        st.lastAdvancedMs === 0 &&
        ageSec > STALE_PLAYER_SEC;

      const isFresh =
        pkt._injectedTest === true ||
        (!frozenCrashGhost && ((ts > 0 && ageSec >= -300 && ageSec <= STALE_PLAYER_SEC) || recentlyAdvanced));

      if (!isFresh) return;

      activeRecords.push({ key, pkt });
    });

    // Separate hull captains vs. shared-ship aboard crewmates (cmp_abd === true)
    const captainsByKey = new Map();
    const captainsByCompany = new Map();
    const aboardCrew = [];

    activeRecords.forEach(({ key, pkt }) => {
      const captainName = sanitizeMaritimeText(pkt.name, 'Captain');
      const companyName = sanitizeMaritimeText(pkt.cmp_nm, '');
      const cmpId = String(pkt.cmp_id || '').trim();
      const shipNum = Math.min(TOTAL_SHIPS, Math.max(1, Math.round(Number(pkt.ship || 1))));

      if (pkt.cmp_abd === true && cmpId) {
        aboardCrew.push({ key, pkt, captainName, companyName, cmpId, shipNum });
        return;
      }

      const resolvedDstIsl = resolveDestinationIsland(pkt.dst);
      const dstDisplay = resolvedDstIsl
        ? `#${pad2(resolvedDstIsl.id)} ${resolvedDstIsl.name}`
        : typeof pkt.dst === 'string'
          ? sanitizeMaritimeText(pkt.dst, '')
          : '';

      const vessel = {
        key,
        captain: captainName,
        company: companyName,
        cmpId,
        ship: shipNum,
        x: Number(pkt.x || 0),
        y: Number(pkt.y || 0),
        yaw: Number(pkt.yaw || 0),
        spd: Math.max(0, Number(pkt.spd || 0)),
        teu: Math.max(0, Math.round(Number(pkt.teu || 0))),
        dstRaw: pkt.dst,
        dst: dstDisplay === 'Captain' ? '' : dstDisplay,
        autopilot: Boolean(pkt.as),
        crewNames: [],
        isDemo: false
      };
      if (vessel.company === 'Captain') vessel.company = '';

      captainsByKey.set(key, vessel);
      if (cmpId && !captainsByCompany.has(cmpId)) {
        captainsByCompany.set(cmpId, vessel);
      }
    });

    // Attach aboard crewmates onto their company vessel
    aboardCrew.forEach((cm) => {
      const hostVessel =
        (cm.pkt.cmp_host && captainsByKey.get(String(cm.pkt.cmp_host))) ||
        captainsByCompany.get(cm.cmpId);
      if (hostVessel) {
        hostVessel.crewNames.push(cm.captainName);
      } else {
        captainsByKey.set(cm.key, {
          key: cm.key,
          captain: cm.captainName,
          company: cm.companyName === 'Captain' ? '' : cm.companyName,
          cmpId: cm.cmpId,
          ship: cm.shipNum,
          x: Number(cm.pkt.x || 0),
          y: Number(cm.pkt.y || 0),
          yaw: Number(cm.pkt.yaw || 0),
          spd: Math.max(0, Number(cm.pkt.spd || 0)),
          teu: Math.max(0, Math.round(Number(cm.pkt.teu || 0))),
          dst: '',
          autopilot: Boolean(cm.pkt.as),
          crewNames: [],
          isDemo: false
        });
      }
    });

    return Array.from(captainsByKey.values());
  }

  function refreshActiveVesselsAndUI() {
    livePlayersList = parseLiveFirebasePlayers(rawFirebasePayload);
    const liveCount = livePlayersList.length;

    // Auto-switch off demo preview as soon as >= 1 real player is sailing live (unless manually overridden right after)
    if (liveCount > 0 && demoMode && !userManuallyToggledDemo) {
      demoMode = false;
    }

    const nowSec = performance.now() * 0.001;
    const displayedVessels = liveCount > 0 && !demoMode
      ? livePlayersList
      : demoMode
        ? buildDemoVessels(nowSec)
        : [];

    // Sync 3D Entities
    const activeKeys = new Set();
    displayedVessels.forEach((v) => {
      activeKeys.add(v.key);
      ensureShipEntity(v);
    });
    pruneShipEntities(activeKeys);

    // Update Top HUD Pill & Server Sidebar Header
    const totalCrewOnline = livePlayersList.reduce((acc, v) => acc + 1 + v.crewNames.length, 0);
    if (serverStatusText) {
      const noun = totalCrewOnline === 1 ? 'CAPTAIN' : 'CAPTAINS';
      serverStatusText.textContent = `LIVE US OCEAN SERVER · ${totalCrewOnline} ${noun} ONLINE`;
    }
    if (hudShipsPill) {
      if (liveCount > 0 && !demoMode) {
        hudShipsPill.innerHTML = `<span class="legend-dot cyan"></span>${liveCount} Live ${liveCount === 1 ? 'Ship' : 'Ships'}`;
      } else if (demoMode) {
        hudShipsPill.innerHTML = `<span class="legend-dot gold"></span>${displayedVessels.length} Demo 3D Ships`;
      } else {
        hudShipsPill.innerHTML = `<span class="legend-dot cyan"></span>0 Live Ships`;
      }
    }

    if (demoBadgeEl) demoBadgeEl.hidden = !demoMode;
    if (zeroNoticeEl) zeroNoticeEl.hidden = liveCount > 0;
    if (demoToggleBtn) {
      demoToggleBtn.classList.toggle('active', demoMode);
      demoToggleBtn.setAttribute('aria-pressed', String(demoMode));
      demoToggleBtn.textContent = demoMode
        ? 'Hide 3D Ship Preview (Demo Active)'
        : 'Preview 3D Ships on Globe';
    }

    if (syncMetaEl) {
      const transportLabel = sseConnected ? 'SSE Stream + 2.5s Sync' : '2.5s Live Poll';
      syncMetaEl.textContent = `US Ocean Server (${transportLabel}) · Synced ${lastSyncTimeStr}`;
    }

    if (rosterHeadingEl) {
      rosterHeadingEl.textContent = demoMode
        ? '3D Blender Fleet Preview (Demo Lanes)'
        : 'Live Vessels on US Ocean Server';
    }
    if (rosterCountEl) {
      rosterCountEl.textContent = `${displayedVessels.length} ${displayedVessels.length === 1 ? 'Ship' : 'Ships'}`;
    }

    renderShipsRoster(displayedVessels);

    // Refresh inspector if currently inspecting an active ship
    if (selectedTarget && selectedTarget.type === 'ship') {
      const match = displayedVessels.find((v) => v.key === selectedTarget.key);
      if (match) updateInspectorForShip(match);
    }
  }

  async function pollFirebasePlayers() {
    try {
      const res = await fetch(`${firebaseLiveUrl}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        rawFirebasePayload = json && typeof json === 'object' ? json : {};
        lastSyncTimeStr = new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    } catch (_) {
      // Keep last known state gracefully if offline
    }
    refreshActiveVesselsAndUI();
  }

  function connectFirebaseSSE() {
    if (typeof EventSource === 'undefined') return;
    try {
      const es = new EventSource(firebaseLiveUrl);
      es.addEventListener('put', (ev) => {
        sseConnected = true;
        try {
          const msg = JSON.parse(ev.data);
          if (msg && msg.path === '/') {
            rawFirebasePayload = msg.data && typeof msg.data === 'object' ? msg.data : {};
          } else if (msg && typeof msg.path === 'string') {
            const subKey = msg.path.replace(/^\//, '').split('/')[0];
            if (subKey) {
              if (msg.data == null) delete rawFirebasePayload[subKey];
              else rawFirebasePayload[subKey] = msg.data;
            }
          }
          lastSyncTimeStr = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
          });
          refreshActiveVesselsAndUI();
        } catch (_) {}
      });
      es.onerror = () => {
        sseConnected = false;
        es.close();
      };
    } catch (_) {}
  }

  // =========================================================================
  // 8. CAMERA FLIGHT, INSPECTOR TELEMETRY CARD & SIDEBAR DIRECTORY UI
  // =========================================================================
  let selectedTarget = null; // { type: 'island', id } | { type: 'ship', key }
  let cameraTween = null;
  let trackingShipKey = null;

  function startCameraFlight(toCamPos, toTargetPos, durationMs = 950) {
    controls.autoRotate = false;
    if (btnSpin) {
      btnSpin.classList.remove('active');
      btnSpin.setAttribute('aria-pressed', 'false');
    }
    cameraTween = {
      fromCam: camera.position.clone(),
      toCam: toCamPos.clone(),
      fromTarget: controls.target.clone(),
      toTarget: toTargetPos.clone(),
      startMs: performance.now(),
      durationMs
    };
  }

  function resetWholeGlobeView() {
    trackingShipKey = null;
    camera.up.set(0, 1, 0);
    controls.minDistance = 103.0;
    controls.maxDistance = 305.0;
    startCameraFlight(DEFAULT_CAM_POS, new THREE.Vector3(0, 0, 0), 900);
  }

  function focusIsland(islandId, zoomClose = true) {
    const isl = islandsById.get(Number(islandId));
    if (!isl) return false;
    trackingShipKey = null;
    camera.up.set(0, 1, 0);
    selectedTarget = { type: 'island', id: isl.id };
    updateInspectorForIsland(isl);
    highlightSelectedSidebarRows();

    const pos = worldXYToSphere3D(isl.x, isl.y, GLOBE_RADIUS);
    const up = pos.clone().normalize();

    // Update pulsing surface selection ring + selected sprite
    selectionRing.position.copy(up).multiplyScalar(GLOBE_RADIUS + 0.08);
    selectionRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up);
    selectionRing.scale.setScalar(1.0 + Math.min(2.2, Number(isl.scale || 1) * 0.25));
    selectionRing.visible = true;

    if (selectedIslandSprite) {
      globeRoot.remove(selectedIslandSprite);
      if (selectedIslandSprite.material.map) selectedIslandSprite.material.map.dispose();
      selectedIslandSprite.material.dispose();
    }
    selectedIslandSprite = createTextSprite(
      `#${pad2(isl.id)} ${isl.name}`,
      isl.hasPortDock ? '#fbbf24' : '#34d399',
      0.9
    );
    selectedIslandSprite.position.copy(up).multiplyScalar(GLOBE_RADIUS + 2.4);
    selectedIslandSprite.userData.normal = up.clone();
    globeRoot.add(selectedIslandSprite);

    if (zoomClose) {
      controls.minDistance = 103.0;
      controls.maxDistance = 305.0;
      const dist = isl.scale >= 3.0 ? 136 : 118;
      const camDest = up.clone().multiplyScalar(dist).add(new THREE.Vector3(0, 6, 0));
      startCameraFlight(camDest, new THREE.Vector3(0, 0, 0), 950);
    }
    return true;
  }

  function focusShip(shipKey) {
    const ent = shipEntities.get(String(shipKey));
    if (!ent) return false;
    trackingShipKey = ent.key;
    selectedTarget = { type: 'ship', key: ent.key };
    updateInspectorForShip(ent.data);
    highlightSelectedSidebarRows();

    // Hide island selection reticle when zoomed directly onto a 3D vessel
    selectionRing.visible = false;

    const frame = computeShipFrameOnSphere(ent.curX, ent.curY, ent.curYaw, 0.028);
    // Align camera vertical with the local ocean normal so the horizon is 100% level behind the 3D ship!
    camera.up.copy(frame.up);

    controls.minDistance = 0.95;
    controls.maxDistance = 240.0;

    // Close 3/4 starboard-bow naval showcase framing right on the scaled-down 3D Blender .glb vessel
    const shipTarget = frame.pos.clone().addScaledVector(frame.up, 0.14);
    const camPos = shipTarget
      .clone()
      .addScaledVector(frame.up, 0.46)
      .addScaledVector(frame.fwd, 1.32)
      .addScaledVector(frame.port, -1.42);

    startCameraFlight(camPos, shipTarget, 900);
    return true;
  }

  function updateInspectorForIsland(isl) {
    if (!isl) return;
    const xKm = (isl.x / 100000.0).toFixed(1);
    const yKm = (isl.y / 100000.0).toFixed(1);
    const kind = isl.hasPortDock
      ? `DOCKED PORT #${pad2(isl.id)}`
      : isl.isCountry
        ? `COUNTRY #${pad2(isl.id)}`
        : `SCENIC ISLAND #${pad2(isl.id)}`;

    if (inspBadge) {
      inspBadge.className = `globe-insp-tag ${isl.hasPortDock ? 'gold' : 'emerald'}`;
      inspBadge.textContent = kind;
    }
    if (inspRegion) inspRegion.textContent = isl.regionName || 'Ocean World';
    if (inspTitle) inspTitle.textContent = isl.name;
    if (inspDesc) {
      const berthTxt = isl.hasPortDock ? `Deepwater Berth (${isl.harborDepthM}m)` : `Anchorage (${isl.harborDepthM}m)`;
      inspDesc.textContent = `Scale ${isl.scale}x · ${berthTxt} · ${isl.specialtyCargo} · X ${xKm} km, Y ${yKm} km`;
    }
    if (inspPhotoBtn) inspPhotoBtn.hidden = true;
  }

  function updateInspectorForShip(v) {
    if (!v) return;
    const shipMeta = getShipCatalogMeta(v.ship);
    const xKm = (v.x / 100000.0).toFixed(1);
    const yKm = (v.y / 100000.0).toFixed(1);
    const hdg = (((Math.round(v.yaw) % 360) + 360) % 360);
    const nearest = findNearestIsland(v.x, v.y);
    const nearStr = nearest
      ? `Near #${pad2(nearest.island.id)} ${nearest.island.name} (${nearest.distKm.toFixed(0)} km)`
      : `X ${xKm} km, Y ${yKm} km`;
    const coStr = v.company ? ` · Co: ${v.company}` : '';
    const crewStr = v.crewNames && v.crewNames.length
      ? ` · Crew Aboard (${v.crewNames.length + 1}): ${[v.captain, ...v.crewNames].join(', ')}`
      : '';
    const dstStr = v.dst ? ` -> ${v.dst}` : '';

    if (inspBadge) {
      inspBadge.className = `globe-insp-tag ${v.isDemo ? 'gold' : 'cyan'}`;
      inspBadge.textContent = v.isDemo
        ? `DEMO 3D SHIP · ${shipMeta.id}`
        : `LIVE CAPTAIN · ${shipMeta.id}`;
    }
    if (inspRegion) {
      inspRegion.textContent = `${shipMeta.name} (${shipMeta.cls})`;
    }
    if (inspTitle) {
      inspTitle.textContent = `${v.captain}${coStr}`;
    }
    if (inspDesc) {
      inspDesc.textContent = `${v.spd.toFixed(1)} knots · Hdg ${String(hdg).padStart(3, '0')}° · ${v.teu.toLocaleString()} TEU${dstStr} · ${nearStr} (${xKm}, ${yKm} km)${crewStr}`;
    }
    if (inspPhotoBtn) {
      inspPhotoBtn.hidden = false;
      inspPhotoBtn.dataset.shipNum = String(shipMeta.num);
    }
  }

  function renderShipsRoster(vessels) {
    if (!shipsListEl) return;
    if (!vessels.length) {
      shipsListEl.innerHTML =
        '<div class="globe-roster-placeholder">Waiting for live captains on the US Ocean Server&mdash;or click <strong>Preview 3D Ships on Globe</strong> above to inspect scaled-down 3D Blender vessels sailing real shipping lanes.</div>';
      return;
    }

    shipsListEl.innerHTML = vessels
      .map((v) => {
        const meta = getShipCatalogMeta(v.ship);
        const isSel = selectedTarget && selectedTarget.type === 'ship' && selectedTarget.key === v.key;
        const nearest = findNearestIsland(v.x, v.y);
        const locTxt = v.dst
          ? `Course -> ${escapeHtml(v.dst)}`
          : nearest
            ? `Near ${escapeHtml(nearest.island.name)}`
            : `(${(v.x / 100000).toFixed(0)}, ${(v.y / 100000).toFixed(0)} km)`;
        const coBadge = v.company ? ` · ${escapeHtml(v.company)}` : '';
        const crewBadge = v.crewNames && v.crewNames.length ? ` (+${v.crewNames.length} crew)` : '';
        return `
          <button type="button" class="globe-ship-item${isSel ? ' is-selected' : ''}" data-ship-key="${escapeHtml(v.key)}">
            <div class="globe-ship-row-top">
              <span class="globe-ship-capt">${escapeHtml(v.captain)}${crewBadge}</span>
              <span class="globe-ship-spd">${v.spd.toFixed(1)} kn</span>
            </div>
            <div class="globe-ship-vessel">${meta.id} ${escapeHtml(meta.name)}${coBadge}</div>
            <div class="globe-ship-meta">${locTxt} &middot; ${v.teu.toLocaleString()} TEU</div>
          </button>`;
      })
      .join('');
  }

  function renderIslandsDirectory() {
    if (!islandsListEl) return;
    const q = islandSearchQuery.trim().toLowerCase();
    const filtered = islandsCatalog.filter((isl) => {
      if (activeIslandFilter === 'ports' && !isl.hasPortDock) return false;
      if (activeIslandFilter === 'countries' && !isl.isCountry) return false;
      if (!q) return true;
      const numStr = `#${pad2(isl.id)}`;
      return (
        numStr.includes(q) ||
        String(isl.id) === q ||
        isl.name.toLowerCase().includes(q) ||
        isl.specialtyCargo.toLowerCase().includes(q) ||
        isl.regionName.toLowerCase().includes(q)
      );
    });

    if (!filtered.length) {
      islandsListEl.innerHTML = '<div class="globe-roster-placeholder">No matching islands or ports found.</div>';
      return;
    }

    islandsListEl.innerHTML = filtered
      .map((isl) => {
        const isSel = selectedTarget && selectedTarget.type === 'island' && selectedTarget.id === isl.id;
        const badgeCls = isl.hasPortDock ? 'port' : 'scenic';
        const kindTxt = isl.hasPortDock ? 'Port' : isl.isCountry ? 'Country' : 'Scenic';
        return `
          <button type="button" class="globe-island-item${isSel ? ' is-selected' : ''}" data-island-id="${isl.id}">
            <span class="globe-isl-left">
              <span class="globe-isl-num ${badgeCls}">#${pad2(isl.id)}</span>
              <span class="globe-isl-name">${escapeHtml(isl.name)}</span>
            </span>
            <span class="globe-isl-scale">${kindTxt} · ${isl.scale}x</span>
          </button>`;
      })
      .join('');
  }

  function highlightSelectedSidebarRows() {
    if (shipsListEl) {
      shipsListEl.querySelectorAll('.globe-ship-item[data-ship-key]').forEach((el) => {
        const match = selectedTarget && selectedTarget.type === 'ship' && el.dataset.shipKey === selectedTarget.key;
        el.classList.toggle('is-selected', Boolean(match));
      });
    }
    if (islandsListEl) {
      islandsListEl.querySelectorAll('.globe-island-item[data-island-id]').forEach((el) => {
        const match =
          selectedTarget && selectedTarget.type === 'island' && Number(el.dataset.islandId) === selectedTarget.id;
        el.classList.toggle('is-selected', Boolean(match));
      });
    }
  }

  // =========================================================================
  // 9. UI CONTROLS & RAYCASTER PICKING ON 3D GLOBE
  // =========================================================================
  if (btnWhole) btnWhole.addEventListener('click', resetWholeGlobeView);
  if (btnHub) btnHub.addEventListener('click', () => focusIsland(1, true));

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      const dir = camera.position.clone().sub(controls.target);
      const nextLen = Math.max(controls.minDistance, dir.length() * 0.76);
      dir.setLength(nextLen);
      startCameraFlight(controls.target.clone().add(dir), controls.target.clone(), 420);
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (trackingShipKey && camera.position.distanceTo(controls.target) > 32) {
        resetWholeGlobeView();
        return;
      }
      const dir = camera.position.clone().sub(controls.target);
      const nextLen = Math.min(controls.maxDistance, dir.length() * 1.32);
      dir.setLength(nextLen);
      startCameraFlight(controls.target.clone().add(dir), controls.target.clone(), 420);
    });
  }

  if (btnSpin) {
    btnSpin.addEventListener('click', () => {
      trackingShipKey = null;
      camera.up.set(0, 1, 0);
      controls.target.set(0, 0, 0);
      controls.minDistance = 103.0;
      controls.autoRotate = !controls.autoRotate;
      btnSpin.classList.toggle('active', controls.autoRotate);
      btnSpin.setAttribute('aria-pressed', String(controls.autoRotate));
    });
  }

  if (inspFocusBtn) {
    inspFocusBtn.addEventListener('click', () => {
      if (!selectedTarget) {
        focusIsland(1, true);
      } else if (selectedTarget.type === 'ship') {
        focusShip(selectedTarget.key);
      } else if (selectedTarget.type === 'island') {
        focusIsland(selectedTarget.id, true);
      }
    });
  }

  if (inspPhotoBtn) {
    inspPhotoBtn.addEventListener('click', () => {
      const num = Number(inspPhotoBtn.dataset.shipNum || 32);
      if (typeof window.openTrueHelmShipModal === 'function') {
        window.openTrueHelmShipModal(num);
      }
    });
  }

  if (demoToggleBtn) {
    demoToggleBtn.addEventListener('click', () => {
      demoMode = !demoMode;
      userManuallyToggledDemo = demoMode;
      refreshActiveVesselsAndUI();
      if (demoMode) {
        // Preload & focus flagship #32 or show active vessels cleanly
        const firstShip = shipEntities.get('demo_titan_32') || shipEntities.values().next().value;
        if (firstShip) {
          selectedTarget = { type: 'ship', key: firstShip.key };
          updateInspectorForShip(firstShip.data);
          highlightSelectedSidebarRows();
        }
      } else {
        resetWholeGlobeView();
        focusIsland(1, false);
      }
    });
  }

  if (shipsListEl) {
    shipsListEl.addEventListener('click', (e) => {
      const row = e.target.closest('.globe-ship-item[data-ship-key]');
      if (!row) return;
      focusShip(row.dataset.shipKey);
    });
  }

  if (islandsListEl) {
    islandsListEl.addEventListener('click', (e) => {
      const row = e.target.closest('.globe-island-item[data-island-id]');
      if (!row) return;
      focusIsland(Number(row.dataset.islandId), true);
    });
  }

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      activeIslandFilter = pill.dataset.islFilter || 'all';
      filterPills.forEach((p) => p.classList.toggle('active', p === pill));
      renderIslandsDirectory();
    });
  });

  if (islandSearchInput) {
    islandSearchInput.addEventListener('input', () => {
      islandSearchQuery = islandSearchInput.value || '';
      renderIslandsDirectory();
    });
  }

  // Click / Tap Raycasting on 3D Ships & 74 Island Beacons
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  let pointerDownXY = null;

  canvas.addEventListener('pointerdown', (e) => {
    pointerDownXY = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!pointerDownXY) return;
    const moved = Math.hypot(e.clientX - pointerDownXY.x, e.clientY - pointerDownXY.y);
    pointerDownXY = null;
    if (moved > 7) return; // Dragged to spin, not a tap

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNDC, camera);

    // Priority 1: Active 3D Ships
    if (shipPickMeshes.length) {
      const shipHits = raycaster.intersectObjects(shipPickMeshes, false);
      if (shipHits.length) {
        const hitShipKey = shipHits[0].object.userData.shipKey;
        if (hitShipKey) {
          focusShip(hitShipKey);
          return;
        }
      }
    }

    // Priority 2: 74 Island & Port Beacons
    if (islandPickMeshes.length) {
      const islHits = raycaster.intersectObjects(islandPickMeshes, false);
      if (islHits.length) {
        const hitIslId = islHits[0].object.userData.islandId;
        if (hitIslId) {
          focusIsland(hitIslId, true);
        }
      }
    }
  });

  // =========================================================================
  // 10. RESIZE & 60FPS ANIMATION LOOP
  // =========================================================================
  function resizeGlobeRenderer() {
    const w = Math.max(1, stageEl.clientWidth);
    const h = Math.max(1, stageEl.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  window.addEventListener('resize', resizeGlobeRenderer, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeGlobeRenderer).observe(stageEl);
  }
  resizeGlobeRenderer();

  let isGlobeNearViewport = true;
  if (typeof IntersectionObserver !== 'undefined') {
    const visObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isGlobeNearViewport = entry.isIntersecting;
        });
      },
      { rootMargin: '320px 0px' }
    );
    visObs.observe(stageEl);
  }

  let lastAnimMs = performance.now();
  const _camDir = new THREE.Vector3();
  const _camRight = new THREE.Vector3();
  const _camUp = new THREE.Vector3(0, 1, 0);
  const _toItem = new THREE.Vector3();

  function animateGlobe(nowMs) {
    requestAnimationFrame(animateGlobe);
    if (document.hidden || !isGlobeNearViewport) {
      lastAnimMs = nowMs;
      return;
    }

    const dt = Math.min(0.06, Math.max(0.001, (nowMs - lastAnimMs) / 1000.0));
    lastAnimMs = nowMs;

    // Advance Demo Preview vessels smoothly at 60fps along real shipping lanes
    if (demoMode && (!livePlayersList.length || userManuallyToggledDemo)) {
      const demoNow = buildDemoVessels(nowMs * 0.001);
      demoNow.forEach((dv) => {
        const ent = shipEntities.get(dv.key);
        if (ent) {
          ent.targetX = dv.x;
          ent.targetY = dv.y;
          ent.targetYaw = dv.yaw;
          ent.data = dv;
        }
      });
    }

    // Smooth camera flight tween
    if (cameraTween) {
      const u = Math.min(1, (nowMs - cameraTween.startMs) / cameraTween.durationMs);
      const ease = 1 - Math.pow(1 - u, 3);
      camera.position.lerpVectors(cameraTween.fromCam, cameraTween.toCam, ease);
      controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, ease);
      if (u >= 1) cameraTween = null;
    }

    // Interpolate all active 3D Ships at 60fps & orient along spherical tangent
    const lerpAlpha = 1 - Math.exp(-dt * 6.5);
    shipEntities.forEach((ent) => {
      ent.curX += (ent.targetX - ent.curX) * lerpAlpha;
      ent.curY += (ent.targetY - ent.curY) * lerpAlpha;
      ent.curYaw += shortestAngleDeltaDeg(ent.curYaw, ent.targetYaw) * lerpAlpha;

      const camDistToShip = camera.position.distanceTo(ent.root.position || camera.position);
      const zoomT = Math.min(1, Math.max(0, (camDistToShip - 1.9) / 155.0));
      const adaptiveScale = THREE.MathUtils.lerp(1.25, 5.95, Math.pow(zoomT, 0.74));
      const clearance = THREE.MathUtils.lerp(0.018, 0.22, zoomT);

      const frame = computeShipFrameOnSphere(ent.curX, ent.curY, ent.curYaw, clearance);
      ent.root.position.copy(frame.pos);
      ent.root.quaternion.copy(frame.quat);
      ent.modelHolder.scale.setScalar(adaptiveScale);

      // Subtle thin live radar ring (fades cleanly when zoomed right up to the hull, clear blip on whole globe)
      const pulse = 0.95 + 0.07 * Math.sin(nowMs * 0.005 + ent.shipNum);
      ent.beaconRing.scale.setScalar(pulse);
      ent.beaconRing.visible = zoomT > 0.012;
      ent.beaconRing.material.opacity = THREE.MathUtils.lerp(0.16, 0.85, Math.min(1, zoomT * 3.8));
      ent.wakeMesh.visible = Number(ent.data.spd || 0) > 0.6;

      // Floating captain callout sprite above the ship (unobtrusive when zoomed close; hide neighbor clutter)
      const isFocusedShip = trackingShipKey === ent.key;
      const labelLift = isFocusedShip && zoomT < 0.06
        ? adaptiveScale * 0.34 + 0.16
        : adaptiveScale * 0.48 + 0.36;
      ent.labelSprite.position.copy(frame.pos).addScaledVector(frame.up, labelLift);
      const spriteH = THREE.MathUtils.lerp(0.105, 2.35, Math.pow(zoomT, 0.82));
      ent.labelSprite.scale.set(spriteH * (ent.labelSprite.userData.aspect || 3.2), spriteH, 1);

      _toItem.copy(camera.position).sub(frame.pos).normalize();
      const onFrontHemisphere = frame.up.dot(_toItem) > 0.06;
      ent.labelSprite.visible =
        onFrontHemisphere && (!trackingShipKey || isFocusedShip || camDistToShip > 14.0);

      // Keep camera target & local level horizon locked smoothly onto tracked live moving ship
      if (isFocusedShip && !cameraTween) {
        camera.up.lerp(frame.up, 0.18).normalize();
        const desiredTarget = _toItem.copy(frame.pos).addScaledVector(frame.up, 0.14);
        const delta = desiredTarget.sub(controls.target);
        if (delta.lengthSq() < 25) {
          controls.target.add(delta);
          camera.position.add(delta);
        }
      }
    });

    controls.update();

    // Prevent camera from ever dipping beneath the ocean surface when orbiting a zoomed-in ship
    if (camera.position.length() < GLOBE_RADIUS + 0.28) {
      camera.position.setLength(GLOBE_RADIUS + 0.28);
    }

    // Update camera-locked key sunlight so whichever ocean hemisphere or 3D ship you inspect is sunlit
    _camDir.copy(camera.position).sub(controls.target).normalize();
    _camRight.crossVectors(camera.up, _camDir);
    if (_camRight.lengthSq() < 1e-5) _camRight.set(1, 0, 0);
    _camRight.normalize();
    const trueCamUp = new THREE.Vector3().crossVectors(_camDir, _camRight).normalize();

    keySunLight.position
      .copy(controls.target)
      .addScaledVector(_camDir, 220)
      .addScaledVector(_camRight, 115)
      .addScaledVector(trueCamUp, 135);
    keySunLight.target.position.copy(controls.target);

    rimCoolLight.position
      .copy(controls.target)
      .addScaledVector(_camDir, -140)
      .addScaledVector(_camRight, -130)
      .addScaledVector(trueCamUp, 75);
    rimCoolLight.target.position.copy(controls.target);

    // Scale island beacons & landmark sprites cleanly with camera altitude & ship-focus distance
    const globeCamDist = camera.position.length();
    const orbitSpan = camera.position.distanceTo(controls.target);
    const effectiveAlt = trackingShipKey ? Math.min(globeCamDist - GLOBE_RADIUS, orbitSpan) : (globeCamDist - GLOBE_RADIUS);
    const globeZoomT = Math.min(1, Math.max(0, effectiveAlt / 145.0));
    const beaconScale = trackingShipKey && orbitSpan < 14.0
      ? THREE.MathUtils.lerp(0.045, 0.28, Math.min(1, orbitSpan / 14.0))
      : THREE.MathUtils.lerp(0.28, 1.05, Math.pow(globeZoomT, 0.75));
    islandsCatalog.forEach((isl) => {
      if (isl._markerGroup) isl._markerGroup.scale.setScalar(beaconScale);
    });

    // Show crisp 1-to-1 vector coastlines when zoomed closer to islands/ports
    shorelinesGroup.visible = globeCamDist < 175 || Boolean(trackingShipKey);

    const camNorm = camera.position.clone().normalize();
    const sprH = THREE.MathUtils.lerp(0.55, 2.5, globeZoomT);
    landmarkSprites.forEach((spr) => {
      const facing = spr.userData.normal.dot(camNorm);
      spr.visible = facing > 0.22 && !trackingShipKey;
      spr.scale.set(sprH * (spr.userData.aspect || 3.4), sprH, 1);
    });

    if (selectedIslandSprite) {
      const facing = selectedIslandSprite.userData.normal.dot(camNorm);
      selectedIslandSprite.visible = facing > 0.08 && (!selectedTarget || selectedTarget.type === 'island');
      const selH = THREE.MathUtils.lerp(0.45, 2.7, globeZoomT);
      selectedIslandSprite.scale.set(selH * (selectedIslandSprite.userData.aspect || 3.4), selH, 1);
    }

    if (selectionRing.visible) {
      selectionRingMat.opacity = 0.55 + 0.35 * Math.sin(nowMs * 0.0045);
    }

    renderer.render(scene, camera);
  }

  // =========================================================================
  // 11. BOOTSTRAP DATA + DETERMINISTIC VERIFICATION HOOK
  // =========================================================================
  async function bootstrap() {
    try {
      const [worldRes, manifestRes] = await Promise.all([
        fetch('./assets/data/world-map-74.json'),
        fetch('./assets/data/fleet-models-manifest.json')
      ]);

      if (manifestRes.ok) {
        const mf = await manifestRes.json();
        if (mf && Array.isArray(mf.ships)) {
          mf.ships.forEach((s) => shipManifestById.set(Number(s.shipId), s));
        }
      }

      if (worldRes.ok) {
        const worldJson = await worldRes.json();
        buildIslandsOnGlobe(worldJson);
        const hub = islandsById.get(1);
        if (hub) {
          selectedTarget = { type: 'island', id: 1 };
          updateInspectorForIsland(hub);
        }
      }
    } catch (_) {}

    // Pre-warm flagship #32 & #01 .glb in background cache for instant preview/live spawn
    loadShipGlbPrototype(32).catch(() => {});
    loadShipGlbPrototype(1).catch(() => {});

    await pollFirebasePlayers();
    connectFirebaseSSE();
    setInterval(pollFirebasePlayers, POLL_INTERVAL_MS);

    requestAnimationFrame(animateGlobe);
  }

  window.__trueHelmGlobeDebug = {
    getState() {
      return {
        islandCount: islandsCatalog.length,
        portCount: islandsCatalog.filter((i) => i.hasPortDock).length,
        scenicCount: islandsCatalog.filter((i) => !i.hasPortDock).length,
        livePlayerCount: livePlayersList.length,
        activeShipEntityCount: shipEntities.size,
        demoMode,
        loadedGlbIds: Array.from(loadedGlbIds).sort((a, b) => a - b),
        trackingShipKey,
        selectedTarget,
        cameraDistance: Number(camera.position.length().toFixed(2))
      };
    },
    worldXYToLatLon,
    worldXYToSphere3D(x, y) {
      const v = worldXYToSphere3D(x, y, GLOBE_RADIUS);
      return { x: Number(v.x.toFixed(4)), y: Number(v.y.toFixed(4)), z: Number(v.z.toFixed(4)) };
    },
    setDemoMode(on) {
      demoMode = Boolean(on);
      userManuallyToggledDemo = demoMode;
      refreshActiveVesselsAndUI();
      return demoMode;
    },
    async injectTestPackets(packetsObj) {
      injectedTestPackets = packetsObj;
      refreshActiveVesselsAndUI();
      const neededIds = [];
      shipEntities.forEach((ent) => neededIds.push(ent.shipNum));
      await Promise.all(neededIds.map((id) => loadShipGlbPrototype(id).catch(() => null)));
      return this.getState();
    },
    focusShip(key, instant = false) {
      const ok = focusShip(key);
      if (ok && instant && cameraTween) {
        camera.position.copy(cameraTween.toCam);
        controls.target.copy(cameraTween.toTarget);
        cameraTween = null;
        controls.update();
      }
      return ok;
    },
    focusIsland(id, instant = false) {
      const ok = focusIsland(id, true);
      if (ok && instant && cameraTween) {
        camera.position.copy(cameraTween.toCam);
        controls.target.copy(cameraTween.toTarget);
        cameraTween = null;
        controls.update();
      }
      return ok;
    },
    resetWholeGlobe(instant = false) {
      resetWholeGlobeView();
      if (instant && cameraTween) {
        camera.position.copy(cameraTween.toCam);
        controls.target.copy(cameraTween.toTarget);
        cameraTween = null;
        controls.update();
      }
    }
  };

  bootstrap();
})();
