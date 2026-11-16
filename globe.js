import * as THREE from './assets/vendor/three/three.module.min.js';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';
import { GLTFLoader } from './assets/vendor/three/GLTFLoader.js';

(function initTrueHelmLiveGlobe() {
  const canvas = document.getElementById('globe-canvas');
  const stageEl = document.getElementById('globe-stage');
  const dragPillEl = document.getElementById('globe-drag-pill');
  const loadingOverlay = document.getElementById('globe-loading-overlay');
  const loadingText = document.getElementById('globe-loading-text');
  if (!canvas || !stageEl) return;

  const ASSET_VER = '20261116b';

  // Constants matching Public/ShipTypes.h + ShippingGameInstance.cpp + generate_truehelm_globe_assets.py 1-to-1
  const GLOBE_RADIUS = 100.0;
  const ATMOS_OUTER_RADIUS = GLOBE_RADIUS * 1.095;
  let globeLonHalfUU = 268000000.0;
  let globeLatHalfUU = 278000000.0;
  let firebaseLiveUrl = 'https://truehelm-global-ocean-default-rtdb.firebaseio.com/us_ocean_players.json';

  const POLL_INTERVAL_MS = 1500;
  const LIVENESS_TICK_MS = 1000;
  const HEARTBEAT_TIMEOUT_MS = 6000;
  const FIRST_SIGHT_GRACE_MS = 3500;
  const SNAP_TELEPORT_DIST_UU = 500000.0; // 5 km in Unreal cm
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
  const syncMetaEl = document.getElementById('globe-sync-meta');
  const zeroNoticeEl = document.getElementById('globe-zero-notice');
  const rosterHeadingEl = document.getElementById('globe-roster-heading');
  const rosterCountEl = document.getElementById('globe-roster-count');
  const shipsListEl = document.getElementById('globe-ships-list');

  const filterPills = Array.from(document.querySelectorAll('.globe-filter-pill[data-isl-filter]'));
  const islandSearchInput = document.getElementById('globe-island-search');
  const islandsListEl = document.getElementById('globe-islands-list');

  // Sanitize external Firebase player/company strings (strips email domains + enforces zero forbidden tokens)
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
    // Right-handed basis: (+X = Port, +Y = Up, +Z = Bow Forward) -> det = +1 (zero mirror flip)
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
  // 2. THREE.JS WEBGL SCENE, SUNLIT EARTH-OCEAN GLOBE, HALO & ORBIT CONTROLS
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
  renderer.toneMappingExposure = 1.18;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(44, 16 / 10, 0.25, 2000);
  const DEFAULT_CAM_DIR = new THREE.Vector3(0.84, 0.24, -0.485).normalize();

  function getWholeGlobeDistance() {
    const w = Math.max(1, stageEl.clientWidth || 360);
    const h = Math.max(1, stageEl.clientHeight || 340);
    const aspect = w / h;
    const halfVRad = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const tanHalfV = Math.tan(halfVRad);
    const minTan = Math.min(tanHalfV, tanHalfV * Math.max(0.45, aspect));
    const desiredSlope = 0.68 * minTan;
    const sinAlpha = desiredSlope / Math.sqrt(1.0 + desiredSlope * desiredSlope);
    const aspectDist = GLOBE_RADIUS / Math.max(0.12, sinAlpha);
    const minMult = window.innerWidth < 768 ? 3.72 : 3.42;
    return Math.max(GLOBE_RADIUS * minMult, aspectDist);
  }

  function getWholeGlobeCamPos() {
    return DEFAULT_CAM_DIR.clone().multiplyScalar(getWholeGlobeDistance());
  }

  camera.position.copy(getWholeGlobeCamPos());

  const controls = new OrbitControls(camera, canvas);
  controls.enableRotate = true;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 0.88;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI - 0.08;
  controls.minDistance = 103.0;
  controls.maxDistance = 540.0;

  let userAutoSpinEnabled = true;
  let isUserDraggingGlobe = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;

  function syncSpinButtonUI() {
    if (!btnSpin) return;
    btnSpin.classList.toggle('active', userAutoSpinEnabled);
    btnSpin.setAttribute('aria-pressed', String(userAutoSpinEnabled));
    btnSpin.textContent = userAutoSpinEnabled ? 'Auto-Spin: ON' : 'Auto-Spin: OFF';
  }
  syncSpinButtonUI();

  controls.enableZoom = false;
  let wheelZoomArmed = false;

  canvas.addEventListener('pointerdown', () => {
    wheelZoomArmed = true;
    controls.enableZoom = true;
    isUserDraggingGlobe = true;
    canvas.classList.add('is-dragging');
  });

  window.addEventListener('pointerup', () => {
    if (isUserDraggingGlobe) {
      isUserDraggingGlobe = false;
      canvas.classList.remove('is-dragging');
    }
  });

  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length >= 2) {
        controls.enableZoom = true;
      }
    },
    { passive: true }
  );

  stageEl.addEventListener('pointerleave', () => {
    if (!isUserDraggingGlobe) {
      wheelZoomArmed = false;
      controls.enableZoom = false;
    }
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

  // Lighting for Extruded Island Meshes, Port Beacons & Scaled-Down Blender .GLB Ships
  const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x071d3b, 1.45);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
  scene.add(ambientLight);

  const keySunLight = new THREE.DirectionalLight(0xfffbeb, 2.25);
  scene.add(keySunLight);
  scene.add(keySunLight.target);

  const rimCoolLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
  scene.add(rimCoolLight);
  scene.add(rimCoolLight.target);

  // Seeded Deep-Space Starfield Surrounding the Planet
  (function buildStarfield() {
    let seed = 0x20261114;
    const rand = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 540 + rand() * 380;
      const u = rand();
      const v = rand();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const p = rand();
      const tint =
        p < 0.22
          ? [0.52, 0.84, 1.0]
          : p < 0.32
            ? [1.0, 0.91, 0.74]
            : [0.92, 0.96, 1.0];
      const bright = 0.55 + 0.45 * rand();
      colors[i * 3] = tint[0] * bright;
      colors[i * 3 + 1] = tint[1] * bright;
      colors[i * 3 + 2] = tint[2] * bright;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.9,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    scene.add(new THREE.Points(starGeo, starMat));
  })();

  // Globe Root
  const globeRoot = new THREE.Group();
  scene.add(globeRoot);

  const texLoader = new THREE.TextureLoader();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 4);

  const defaultAlbedoData = new Uint8Array([16, 86, 168, 255]);
  const fallbackAlbedoTex = new THREE.DataTexture(defaultAlbedoData, 1, 1);
  fallbackAlbedoTex.colorSpace = THREE.SRGBColorSpace;
  fallbackAlbedoTex.needsUpdate = true;

  const defaultBumpData = new Uint8Array([24, 24, 24, 255]);
  const fallbackBumpTex = new THREE.DataTexture(defaultBumpData, 1, 1);
  fallbackBumpTex.needsUpdate = true;

  const planetUniforms = {
    uAlbedoMap: { value: fallbackAlbedoTex },
    uBumpMap: { value: fallbackBumpTex },
    uSunDir: { value: new THREE.Vector3(0.65, 0.45, 0.61).normalize() }
  };

  const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 144, 108);
  const globeMat = new THREE.ShaderMaterial({
    uniforms: planetUniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAlbedoMap;
      uniform sampler2D uBumpMap;
      uniform vec3 uSunDir;

      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        vec4 albSample = texture2D(uAlbedoMap, vUv);
        vec3 baseCol = albSample.rgb;

        vec3 east = vec3(-N.z, 0.0, N.x);
        float eastLen = length(east);
        east = eastLen > 1e-4 ? (east / eastLen) : vec3(1.0, 0.0, 0.0);
        vec3 north = normalize(cross(east, N));

        vec2 texStep = vec2(1.0 / 4096.0, 1.0 / 2048.0);
        float bC = texture2D(uBumpMap, vUv).r;
        float bE = texture2D(uBumpMap, vec2(vUv.x + texStep.x, vUv.y)).r;
        float bN = texture2D(uBumpMap, vec2(vUv.x, clamp(vUv.y - texStep.y, 0.001, 0.999))).r;

        float isLand = smoothstep(0.28, 0.36, bC);
        float isLagoon = smoothstep(0.155, 0.215, bC) * (1.0 - isLand);

        float bumpAmp = mix(2.2, 6.5, isLand);
        vec3 perturbedN = normalize(N - east * ((bE - bC) * bumpAmp) - north * ((bN - bC) * bumpAmp));

        float ndl = dot(N, L);
        float ndlBump = dot(perturbedN, L);
        float dayCurve = smoothstep(-0.46, 0.88, ndl);
        float coreSun = pow(clamp(ndl, 0.0, 1.0), 1.25);

        vec3 twilightOcean = vec3(0.004, 0.015, 0.048);
        vec3 royalOcean    = vec3(0.011, 0.068, 0.235);
        vec3 sunlitOcean   = vec3(0.032, 0.245, 0.610);

        vec3 sphereOceanGrad = mix(twilightOcean, royalOcean, smoothstep(0.0, 0.48, dayCurve));
        sphereOceanGrad = mix(sphereOceanGrad, sunlitOcean, coreSun * 0.88);

        vec3 bathyTinted = mix(sphereOceanGrad, baseCol * (0.34 + 0.98 * dayCurve), 0.56 + 0.34 * isLagoon);

        vec3 H = normalize(L + V);
        float nh = max(dot(perturbedN, H), 0.0);
        float specSheen = pow(nh, 18.0) * 0.21;
        float specSparkle = pow(nh, 64.0) * 0.17;
        vec3 sunGlint = vec3(0.28, 0.74, 1.0) * specSheen + vec3(0.82, 0.95, 1.0) * specSparkle;
        vec3 oceanFinal = bathyTinted + sunGlint * (1.0 - isLand) * smoothstep(-0.1, 0.45, ndl);

        float landDiffuse = 0.26 + 0.92 * clamp(ndlBump * 0.76 + 0.30, 0.0, 1.0);
        vec3 landFinal = baseCol * landDiffuse * (0.45 + 0.68 * smoothstep(-0.45, 0.35, ndl));

        vec3 surfaceCol = mix(oceanFinal, landFinal, isLand);

        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float rim = pow(1.0 - ndv, 2.75);
        float litRim = 0.40 + 0.60 * smoothstep(-0.38, 0.70, ndl);
        vec3 rayleighSky = vec3(0.14, 0.56, 0.98) * rim * litRim * 0.86;

        gl_FragColor = vec4(surfaceCol + rayleighSky, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });

  const globeMesh = new THREE.Mesh(globeGeo, globeMat);
  globeRoot.add(globeMesh);

  texLoader.load(
    `./assets/globe/truehelm_globe_albedo.jpg?v=${ASSET_VER}`,
    (albedoTex) => {
      albedoTex.colorSpace = THREE.SRGBColorSpace;
      albedoTex.anisotropy = maxAniso;
      albedoTex.wrapS = THREE.RepeatWrapping;
      albedoTex.wrapT = THREE.ClampToEdgeWrapping;
      planetUniforms.uAlbedoMap.value = albedoTex;
      if (loadingOverlay) loadingOverlay.hidden = true;
    },
    undefined,
    () => {
      if (loadingOverlay) loadingOverlay.hidden = true;
    }
  );

  texLoader.load(`./assets/globe/truehelm_globe_bump.jpg?v=${ASSET_VER}`, (bumpTex) => {
    bumpTex.anisotropy = maxAniso;
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.ClampToEdgeWrapping;
    planetUniforms.uBumpMap.value = bumpTex;
  });

  // 3D Outer Atmospheric Fresnel Sky-Blue Halo Sphere Around the Rim
  const atmosGeo = new THREE.SphereGeometry(ATMOS_OUTER_RADIUS, 72, 54);
  const atmosMat = new THREE.ShaderMaterial({
    uniforms: {
      uInnerColor: { value: new THREE.Color(0x60a5fa) },
      uOuterColor: { value: new THREE.Color(0x0ea5e9) }
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vNormalView = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uInnerColor;
      uniform vec3 uOuterColor;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        float viewDot = clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0);
        float rimT = clamp(viewDot / 0.415, 0.0, 1.0);
        float halo = pow(rimT, 2.05) * smoothstep(0.0, 0.14, rimT);
        vec3 col = mix(uOuterColor, uInnerColor, rimT);
        gl_FragColor = vec4(col, halo * 0.86);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  globeRoot.add(new THREE.Mesh(atmosGeo, atmosMat));

  // Crisp 3D Latitude & Longitude Meridian Curves Wrapping Around the Sphere
  const graticuleGroup = new THREE.Group();
  globeRoot.add(graticuleGroup);

  (function build3DGraticuleCurves() {
    const r = GLOBE_RADIUS + 0.08;
    const majorMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.52,
      depthWrite: false
    });
    const minorMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.23,
      depthWrite: false
    });

    const latDegs = [-75, -60, -40, -20, 0, 20, 40, 60, 75];
    const segs = 160;
    latDegs.forEach((lat) => {
      const latRad = THREE.MathUtils.degToRad(lat);
      const y = Math.sin(latRad) * r;
      const ringR = Math.cos(latRad) * r;
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * ringR, y, Math.sin(a) * ringR));
      }
      graticuleGroup.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lat === 0 ? majorMat : minorMat)
      );
    });

    for (let lon = 0; lon < 180; lon += 20) {
      const lonRad = THREE.MathUtils.degToRad(lon);
      const ca = Math.cos(lonRad);
      const sa = Math.sin(lonRad);
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        const horiz = Math.sin(t) * r;
        const y = Math.cos(t) * r;
        pts.push(new THREE.Vector3(horiz * ca, y, horiz * sa));
      }
      graticuleGroup.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lon === 0 ? majorMat : minorMat)
      );
    }
  })();

  // Pulsing Selection Reticle on Surface
  const selectionRingGeo = new THREE.RingGeometry(0.85, 1.25, 44);
  const selectionRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    depthTest: true,
    depthWrite: false
  });
  const selectionRing = new THREE.Mesh(selectionRingGeo, selectionRingMat);
  selectionRing.visible = false;
  globeRoot.add(selectionRing);

  // =========================================================================
  // 3. CRISP SPRITE TEXT LABELS FOR HUBS, SELECTED ISLAND & LIVE SHIPS
  // =========================================================================
  function createTextSprite(text, accentHex = '#38bdf8', bgAlpha = 0.88, isLiveShip = false) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = isLiveShip
      ? '800 25px Inter, Segoe UI, sans-serif'
      : '700 22px Inter, Segoe UI, sans-serif';
    ctx.font = font;
    const padX = isLiveShip ? 22 : 16;
    const dotSpace = isLiveShip ? 18 : 0;
    const textW = Math.ceil(ctx.measureText(text).width);
    c.width = Math.max(72, textW + padX * 2 + dotSpace + 8);
    c.height = isLiveShip ? 50 : 44;

    ctx.font = font;
    ctx.fillStyle = `rgba(3, 12, 25, ${bgAlpha})`;
    const r = isLiveShip ? 25 : 10;
    ctx.beginPath();
    ctx.roundRect(2, 2, c.width - 4, c.height - 4, r);
    ctx.fill();

    ctx.lineWidth = isLiveShip ? 2.8 : 2.0;
    ctx.strokeStyle = accentHex;
    ctx.stroke();

    if (isLiveShip) {
      ctx.beginPath();
      ctx.arc(20, c.height / 2, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = accentHex;
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, c.width / 2 + dotSpace * 0.42, c.height / 2 + 1);

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
    sprite.renderOrder = isLiveShip ? 18 : 11;
    return sprite;
  }

  // =========================================================================
  // 4. 74 ISLANDS: 3D EXTRUDED TERRAIN MESHES, CORAL SHELVES & PORT BEACONS
  // =========================================================================
  const extrudedTerrainGroup = new THREE.Group();
  const islandsGroup = new THREE.Group();
  const shorelinesGroup = new THREE.Group();
  globeRoot.add(extrudedTerrainGroup);
  globeRoot.add(shorelinesGroup);
  globeRoot.add(islandsGroup);

  let islandsCatalog = [];
  const islandsById = new Map();
  const islandsByNameLower = new Map();
  const islandPickMeshes = [];
  let activeIslandFilter = 'all';
  let islandSearchQuery = '';
  let extrudedLandMeshRef = null;

  // Shared Beacon Geometries & Materials
  const portPillarGeo = new THREE.CylinderGeometry(0.14, 0.26, 1.0, 8);
  portPillarGeo.translate(0, 0.5, 0);
  const portLanternGeo = new THREE.SphereGeometry(0.30, 12, 10);
  const portRingGeo = new THREE.RingGeometry(0.38, 0.62, 20);
  portRingGeo.rotateX(-Math.PI / 2);

  const scenicGemGeo = new THREE.OctahedronGeometry(0.26, 0);
  const scenicStemGeo = new THREE.CylinderGeometry(0.09, 0.16, 0.72, 6);
  scenicStemGeo.translate(0, 0.36, 0);
  const scenicRingGeo = new THREE.RingGeometry(0.28, 0.44, 16);
  scenicRingGeo.rotateX(-Math.PI / 2);

  const hitSphereGeo = new THREE.SphereGeometry(1.45, 8, 8);
  const hitInvisibleMat = new THREE.MeshBasicMaterial({ visible: false });

  const goldPillarMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.2
  });
  const goldLanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const goldRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.84,
    depthWrite: false
  });

  const emeraldStemMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.18
  });
  const emeraldGemMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
  const emeraldRingMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  const portShoreMat = new THREE.LineBasicMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.66
  });
  const scenicShoreMat = new THREE.LineBasicMaterial({
    color: 0x6ee7b7,
    transparent: true,
    opacity: 0.5
  });
  const berthDotGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const berthDotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const landmarkSprites = [];
  let selectedIslandSprite = null;

  // Build merged 3D extruded emerald/sandy/alpine terrain + turquoise coral lagoon shelves across all 74 landmasses!
  function build3DExtrudedIslandsMesh(islands) {
    while (extrudedTerrainGroup.children.length) {
      const ch = extrudedTerrainGroup.children.pop();
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) ch.material.dispose();
    }
    extrudedLandMeshRef = null;

    const landPos = [];
    const landCol = [];
    const lagoonPos = [];
    const lagoonCol = [];

    const pushTri = (posArr, colArr, a, b, c, ca, cb, cc) => {
      posArr.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      colArr.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
    };

    const pushQuadRing = (posArr, colArr, ringOuter, ringInner, colOuter, colInner) => {
      const n = ringOuter.length;
      for (let k = 0; k < n; k++) {
        const kn = (k + 1) % n;
        pushTri(posArr, colArr, ringOuter[k], ringOuter[kn], ringInner[k], colOuter, colOuter, colInner);
        pushTri(posArr, colArr, ringOuter[kn], ringInner[kn], ringInner[k], colOuter, colInner, colInner);
      }
    };

    islands.forEach((isl) => {
      const poly = Array.isArray(isl.cartographicPolygonXY) && isl.cartographicPolygonXY.length >= 6
        ? isl.cartographicPolygonXY
        : isl.shorelinePolygonXY;
      if (!Array.isArray(poly) || poly.length < 6) return;

      const origSc = Number(isl.scale || 1.0);
      const visSc = Number(isl.globeCartographicScale || origSc);
      const quayXReal = Number(isl.x || 0) - 22500.0 * origSc;
      const berthBaseX = Number(isl.berthX != null ? isl.berthX : quayXReal);
      // Strict eastern clamp on all 32 docked ports so moored ships at (isl.berthX, isl.berthY) sit visibly on blue harbor water!
      const portEastClampX = berthBaseX + 3500.0;
      const harborLatBandUU = Math.max(550000.0, 175000.0 * visSc);

      const rawCtrXY = Array.isArray(isl.cartographicCenterXY) && isl.cartographicCenterXY.length === 2
        ? isl.cartographicCenterXY
        : [isl.x, isl.y];
      const ctrXY = [
        isl.hasPortDock ? Math.max(Number(rawCtrXY[0]), portEastClampX + 12000.0) : Number(rawCtrXY[0]),
        Number(rawCtrXY[1])
      ];

      const n = poly.length;
      const isPolar = (isl.clusterId === 9 || isl.clusterId === 11) && Math.abs(Number(isl.y || 0)) > 135000000;
      const maxElev = isl.isCountry && origSc >= 3.8
        ? Math.min(2.05, 0.95 + origSc * 0.13)
        : isl.isCountry
          ? 0.82
          : origSc <= 0.65
            ? 0.34
            : 0.56;

      const colLagoonOuter = [0.04, 0.52, 0.72];
      const colLagoonInner = [0.10, 0.84, 0.88];
      const colBeach       = [0.95, 0.85, 0.56];
      const colLowForest   = isPolar ? [0.16, 0.56, 0.36] : [0.10, 0.64, 0.28];
      const colHighland    = isPolar ? [0.46, 0.64, 0.56] : [0.30, 0.76, 0.29];
      const colPeak        = isPolar || origSc >= 4.0 ? [0.92, 0.95, 0.98] : [0.62, 0.88, 0.52];

      const ctrUnit = worldXYToSphere3D(ctrXY[0], ctrXY[1], 1.0).normalize();
      const p0u = worldXYToSphere3D(poly[0][0], poly[0][1], 1.0);
      const p1u = worldXYToSphere3D(poly[1][0], poly[1][1], 1.0);
      const crossTest = new THREE.Vector3().subVectors(p0u, ctrUnit).cross(new THREE.Vector3().subVectors(p1u, ctrUnit));
      const orderedPoly = crossTest.dot(ctrUnit) < 0 ? poly.slice().reverse() : poly;

      const rLagoonOuter = [];
      const rLagoonInner = [];
      const rSeaSkirt = [];
      const rBeach = [];
      const rForest = [];
      const rHigh = [];

      for (let k = 0; k < n; k++) {
        const py = Number(orderedPoly[k][1]);
        const inHarborBand = isl.hasPortDock && Math.abs(py - Number(isl.berthY != null ? isl.berthY : isl.y)) <= harborLatBandUU;
        const px = isl.hasPortDock
          ? Math.max(Number(orderedPoly[k][0]), portEastClampX)
          : Number(orderedPoly[k][0]);

        const dx = px - ctrXY[0];
        const dy = py - ctrXY[1];

        const shelfMult = origSc < 1.5 ? 1.55 : 1.28;
        let sx = ctrXY[0] + dx * shelfMult;
        const sy = ctrXY[1] + dy * shelfMult;
        if (inHarborBand || (isl.hasPortDock && sx < portEastClampX)) {
          sx = Math.max(sx, portEastClampX);
        }

        let fx = ctrXY[0] + dx * 0.78;
        let hx = ctrXY[0] + dx * 0.42;
        if (isl.hasPortDock) {
          fx = Math.max(fx, portEastClampX + 1500.0);
          hx = Math.max(hx, portEastClampX + 3500.0);
        }

        const uShelf = worldXYToSphere3D(sx, sy, 1.0).normalize();
        const uCoast = worldXYToSphere3D(px, py, 1.0).normalize();
        const uForest = worldXYToSphere3D(fx, ctrXY[1] + dy * 0.78, 1.0).normalize();
        const uHigh = worldXYToSphere3D(hx, ctrXY[1] + dy * 0.42, 1.0).normalize();

        const ridgeWave = 1.0 + 0.18 * Math.sin(k * 0.9 + isl.id * 1.7);
        rLagoonOuter.push(uShelf.clone().multiplyScalar(GLOBE_RADIUS + 0.035));
        rLagoonInner.push(uCoast.clone().multiplyScalar(GLOBE_RADIUS + 0.055));

        rSeaSkirt.push(uCoast.clone().multiplyScalar(GLOBE_RADIUS - 0.04));
        rBeach.push(uCoast.clone().multiplyScalar(GLOBE_RADIUS + 0.11));
        rForest.push(uForest.clone().multiplyScalar(GLOBE_RADIUS + maxElev * 0.38 * ridgeWave));
        rHigh.push(uHigh.clone().multiplyScalar(GLOBE_RADIUS + maxElev * 0.76 * ridgeWave));
      }

      const peakPos = ctrUnit.clone().multiplyScalar(GLOBE_RADIUS + maxElev);

      pushQuadRing(lagoonPos, lagoonCol, rLagoonOuter, rLagoonInner, colLagoonOuter, colLagoonInner);

      pushQuadRing(landPos, landCol, rSeaSkirt, rBeach, colBeach, colBeach);
      pushQuadRing(landPos, landCol, rBeach, rForest, colBeach, colLowForest);
      pushQuadRing(landPos, landCol, rForest, rHigh, colLowForest, colHighland);
      for (let k = 0; k < n; k++) {
        const kn = (k + 1) % n;
        pushTri(landPos, landCol, rHigh[k], rHigh[kn], peakPos, colHighland, colHighland, colPeak);
      }
    });

    if (lagoonPos.length) {
      const lagGeo = new THREE.BufferGeometry();
      lagGeo.setAttribute('position', new THREE.Float32BufferAttribute(lagoonPos, 3));
      lagGeo.setAttribute('color', new THREE.Float32BufferAttribute(lagoonCol, 3));
      const lagMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      extrudedTerrainGroup.add(new THREE.Mesh(lagGeo, lagMat));
    }

    if (landPos.length) {
      const landGeo = new THREE.BufferGeometry();
      landGeo.setAttribute('position', new THREE.Float32BufferAttribute(landPos, 3));
      landGeo.setAttribute('color', new THREE.Float32BufferAttribute(landCol, 3));
      landGeo.computeVertexNormals();
      const landMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.78,
        metalness: 0.02,
        side: THREE.DoubleSide
      });
      extrudedLandMeshRef = new THREE.Mesh(landGeo, landMat);
      extrudedTerrainGroup.add(extrudedLandMeshRef);
    }
  }

  function buildIslandsOnGlobe(worldJson) {
    if (worldJson.meta) {
      if (worldJson.meta.globeLonHalfSpanUU) globeLonHalfUU = Number(worldJson.meta.globeLonHalfSpanUU);
      if (worldJson.meta.globeLatHalfSpanUU) globeLatHalfUU = Number(worldJson.meta.globeLatHalfSpanUU);
      if (worldJson.meta.firebaseLivePlayersUrl) firebaseLiveUrl = String(worldJson.meta.firebaseLivePlayersUrl);
    }

    islandsCatalog = Array.isArray(worldJson.islands) ? worldJson.islands : [];
    islandsById.clear();
    islandsByNameLower.clear();

    const majorLabelIds = new Set([1, 24, 37, 46, 55, 63, 73, 74]);

    islandsCatalog.forEach((isl) => {
      islandsById.set(isl.id, isl);
      islandsByNameLower.set(String(isl.name || '').toLowerCase(), isl);

      const pos = worldXYToSphere3D(isl.x, isl.y, GLOBE_RADIUS);
      const up = pos.clone().normalize();
      const markerGroup = new THREE.Group();
      markerGroup.position.copy(pos);
      markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);

      const heightBoost = 0.95 + Math.log2(1 + Number(isl.scale || 1)) * 0.48;

      if (isl.hasPortDock) {
        const pillar = new THREE.Mesh(portPillarGeo, goldPillarMat);
        pillar.scale.set(1, heightBoost * 1.45, 1);
        markerGroup.add(pillar);

        const lantern = new THREE.Mesh(portLanternGeo, goldLanternMat);
        lantern.position.set(0, heightBoost * 1.45 + 0.16, 0);
        markerGroup.add(lantern);

        const baseRing = new THREE.Mesh(portRingGeo, goldRingMat);
        baseRing.position.set(0, 0.12, 0);
        baseRing.scale.setScalar(1.0 + Math.min(1.4, Number(isl.scale || 1) * 0.15));
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
        gem.position.set(0, heightBoost * 0.72 + 0.16, 0);
        markerGroup.add(gem);

        const baseRing = new THREE.Mesh(scenicRingGeo, emeraldRingMat);
        baseRing.position.set(0, 0.1, 0);
        markerGroup.add(baseRing);
      }

      const hitMesh = new THREE.Mesh(hitSphereGeo, hitInvisibleMat);
      hitMesh.position.set(0, 0.75, 0);
      hitMesh.userData = { pickType: 'island', islandId: isl.id };
      markerGroup.add(hitMesh);
      islandPickMeshes.push(hitMesh);

      markerGroup.userData = { islandId: isl.id, basePos: pos.clone(), up: up.clone() };
      islandsGroup.add(markerGroup);
      isl._markerGroup = markerGroup;

      if (Array.isArray(isl.shorelinePolygonXY) && isl.shorelinePolygonXY.length >= 3) {
        const pts = isl.shorelinePolygonXY.map((pt) =>
          worldXYToSphere3D(pt[0], pt[1], GLOBE_RADIUS + 0.04)
        );
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineLoop = new THREE.LineLoop(lineGeo, isl.hasPortDock ? portShoreMat : scenicShoreMat);
        shorelinesGroup.add(lineLoop);
      }

      if (majorLabelIds.has(isl.id)) {
        const tag = `#${pad2(isl.id)} ${isl.name}`;
        const spr = createTextSprite(tag, isl.hasPortDock ? '#fbbf24' : '#34d399', 0.78, false);
        spr.position.copy(up).multiplyScalar(GLOBE_RADIUS + heightBoost * 1.6 + 2.2);
        spr.userData.normal = up.clone();
        spr.userData.islandId = isl.id;
        globeRoot.add(spr);
        landmarkSprites.push(spr);
      }
    });

    build3DExtrudedIslandsMesh(islandsCatalog);
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

  function clampCatalogShipId(shipNum) {
    const raw = Math.round(Number(shipNum) || 1);
    if (raw > TOTAL_SHIPS) return 1;
    return Math.max(1, raw);
  }

  function getShipCatalogMeta(shipNum) {
    const clamped = clampCatalogShipId(shipNum);
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
    const clamped = clampCatalogShipId(shipNum);
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
  // 6. ACTIVE LIVE 3D SHIPS ON GLOBE (STRICTLY REAL ACTIVE PLAYERS ONLY)
  // =========================================================================
  const shipsGroup = new THREE.Group();
  const routesGroup = new THREE.Group();
  globeRoot.add(routesGroup);
  globeRoot.add(shipsGroup);

  const shipEntities = new Map();
  const shipPickMeshes = [];

  const shipBeaconRingGeo = new THREE.RingGeometry(0.56, 0.68, 36);
  shipBeaconRingGeo.rotateX(-Math.PI / 2);

  const shipPulseWaveGeo = new THREE.RingGeometry(0.62, 0.82, 36);
  shipPulseWaveGeo.rotateX(-Math.PI / 2);

  const shipSpireBeamGeo = new THREE.CylinderGeometry(0.06, 0.24, 1.0, 10, 1, true);
  shipSpireBeamGeo.translate(0, 0.5, 0);
  const shipSpireOrbGeo = new THREE.SphereGeometry(0.32, 12, 10);

  function createWakeRibbonMesh(accentHex) {
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

  function formatShipPillLabel(vesselData, shipNum) {
    const kn = Math.max(0, Number(vesselData.spd || 0)).toFixed(1);
    return `${vesselData.captain} · #${pad2(shipNum)} · ${kn} kn`;
  }

  function rebuildShipPickList() {
    shipPickMeshes.length = 0;
    shipEntities.forEach((ent) => {
      if (ent.hitMesh) shipPickMeshes.push(ent.hitMesh);
    });
  }

  function applyEntityTransformImmediate(ent) {
    const camDistToShip = camera.position.distanceTo(ent.root.position || camera.position);
    const zoomT = Math.min(1, Math.max(0, (camDistToShip - 2.0) / 235.0));
    const clearance = THREE.MathUtils.lerp(0.018, 0.28, zoomT);
    const frame = computeShipFrameOnSphere(ent.curX, ent.curY, ent.curYaw, clearance);
    ent.root.position.copy(frame.pos);
    ent.root.quaternion.copy(frame.quat);
    return frame;
  }

  function ensureShipEntity(vesselData) {
    let ent = shipEntities.get(vesselData.key);
    const shipNum = clampCatalogShipId(vesselData.ship || 1);
    const accentHex = '#22d3ee';
    const accentColor = 0x22d3ee;
    const incomingX = Number(vesselData.x || 0);
    const incomingY = Number(vesselData.y || 0);
    const incomingYaw = Number(vesselData.yaw || 0);

    if (!ent) {
      const root = new THREE.Group();
      const modelHolder = new THREE.Group();
      root.add(modelHolder);

      const orbitalBeaconGroup = new THREE.Group();
      root.add(orbitalBeaconGroup);

      const spireMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const spireBeam = new THREE.Mesh(shipSpireBeamGeo, spireMat);
      orbitalBeaconGroup.add(spireBeam);

      const spireOrbMat = new THREE.MeshBasicMaterial({
        color: 0xa5f3fc,
        transparent: true,
        opacity: 0.96
      });
      const spireOrb = new THREE.Mesh(shipSpireOrbGeo, spireOrbMat);
      orbitalBeaconGroup.add(spireOrb);

      const pulseWaveMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const pulseWaveRing = new THREE.Mesh(shipPulseWaveGeo, pulseWaveMat);
      pulseWaveRing.position.set(0, 0.14, 0);
      orbitalBeaconGroup.add(pulseWaveRing);

      const placeholder = createFallbackMiniHull();
      modelHolder.add(placeholder);

      const ringMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      });
      const beaconRing = new THREE.Mesh(shipBeaconRingGeo, ringMat);
      beaconRing.position.set(0, 0.022, 0);
      modelHolder.add(beaconRing);

      const wakeMesh = createWakeRibbonMesh(accentHex);
      modelHolder.add(wakeMesh);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 8, 8),
        hitInvisibleMat
      );
      hitMesh.position.set(0, 0.35, 0);
      hitMesh.userData = { pickType: 'ship', shipKey: vesselData.key };
      modelHolder.add(hitMesh);

      const labelText = formatShipPillLabel(vesselData, shipNum);
      const labelSprite = createTextSprite(labelText, accentHex, 0.9, true);
      globeRoot.add(labelSprite);

      shipsGroup.add(root);

      ent = {
        key: vesselData.key,
        shipNum: 0,
        labelKey: labelText,
        root,
        modelHolder,
        orbitalBeaconGroup,
        spireBeam,
        spireOrb,
        pulseWaveRing,
        beaconRing,
        wakeMesh,
        hitMesh,
        labelSprite,
        routeLine: null,
        routeDstName: '',
        curX: incomingX,
        curY: incomingY,
        curYaw: incomingYaw,
        targetX: incomingX,
        targetY: incomingY,
        targetYaw: incomingYaw,
        lastFacingDot: 1.0,
        data: vesselData,
        glbLoaded: false
      };
      // Snap immediately on entity creation to exact 1-to-1 sphere coordinates!
      applyEntityTransformImmediate(ent);
      shipEntities.set(vesselData.key, ent);
      rebuildShipPickList();
    }

    ent.data = vesselData;
    ent.targetX = incomingX;
    ent.targetY = incomingY;
    ent.targetYaw = incomingYaw;

    // Snap immediately on port spawn / Fast-Launch teleport (> 5 km = 500,000 UU) so ships never slide across the ocean!
    if (Math.hypot(ent.targetX - ent.curX, ent.targetY - ent.curY) > SNAP_TELEPORT_DIST_UU) {
      ent.curX = ent.targetX;
      ent.curY = ent.targetY;
      ent.curYaw = ent.targetYaw;
      applyEntityTransformImmediate(ent);
    }

    if (ent.shipNum !== shipNum) {
      ent.shipNum = shipNum;
      ent.glbLoaded = false;
      loadShipGlbPrototype(shipNum)
        .then((proto) => {
          if (!shipEntities.has(ent.key) || ent.shipNum !== shipNum) return;
          const keep = new Set([ent.beaconRing, ent.wakeMesh, ent.hitMesh]);
          for (let i = ent.modelHolder.children.length - 1; i >= 0; i--) {
            const ch = ent.modelHolder.children[i];
            if (!keep.has(ch)) ent.modelHolder.remove(ch);
          }
          const clonedGlb = proto.clone(true);
          clonedGlb.position.y = 0.072;
          ent.modelHolder.add(clonedGlb);
          ent.glbLoaded = true;
        })
        .catch(() => {});
    }

    const nextLabel = formatShipPillLabel(vesselData, shipNum);
    if (ent.labelKey !== nextLabel) {
      ent.labelKey = nextLabel;
      globeRoot.remove(ent.labelSprite);
      if (ent.labelSprite.material.map) ent.labelSprite.material.map.dispose();
      ent.labelSprite.material.dispose();
      ent.labelSprite = createTextSprite(nextLabel, accentHex, 0.9, true);
      globeRoot.add(ent.labelSprite);
    }

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
          dashSize: 0.95,
          gapSize: 0.52,
          transparent: true,
          opacity: 0.78
        });
        ent.routeLine = new THREE.Line(routeGeo, routeMat);
        routesGroup.add(ent.routeLine);
      }
      const startV = worldXYToSphere3D(ent.curX, ent.curY, GLOBE_RADIUS + 0.22);
      const endV = worldXYToSphere3D(dstIsl.berthX || dstIsl.x, dstIsl.berthY || dstIsl.y, GLOBE_RADIUS + 0.22);
      const arcPts = [];
      const arcSteps = 32;
      for (let s = 0; s <= arcSteps; s++) {
        const t = s / arcSteps;
        const v = new THREE.Vector3().lerpVectors(startV, endV, t).normalize();
        const lift = Math.sin(t * Math.PI) * 1.05;
        v.multiplyScalar(GLOBE_RADIUS + 0.22 + lift);
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
  // 7. STRICT REAL-TIME FIREBASE US OCEAN SERVER LIVENESS (NO FAKE/DEMO BOATS)
  // =========================================================================
  const seenFirebaseRecords = new Map(); // key -> { firstSeenMs, lastSeq, lastTs, lastAdvancedMs }
  let rawFirebasePayload = {};
  let injectedTestPackets = null;
  let livePlayersList = [];
  let lastSyncTimeStr = 'connecting...';
  let sseConnected = false;

  function parseLiveFirebasePlayers(payloadMap) {
    const merged = Object.assign({}, payloadMap || {}, injectedTestPackets || {});
    const nowMs = Date.now();
    const nowSec = nowMs / 1000.0;

    // Clean tracking entries for keys no longer present in Firebase payload
    Array.from(seenFirebaseRecords.keys()).forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(merged, k)) {
        seenFirebaseRecords.delete(k);
      }
    });

    const activeRecords = [];
    Object.entries(merged).forEach(([key, pkt]) => {
      if (!pkt || typeof pkt !== 'object') return;
      if (pkt.disc === true) return;

      // Require valid finite 1-to-1 Unreal world coordinates (X, Y in cm)
      if (pkt.x == null || pkt.y == null) return;
      const rawX = Number(pkt.x);
      const rawY = Number(pkt.y);
      if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return;

      // Reject private-room or automated verification test packets
      const roomStr = String(pkt.room == null ? 'PUBLIC' : pkt.room).trim().toUpperCase();
      if (roomStr !== 'PUBLIC') return;
      const idStr = String(pkt.id || '').trim();
      const rawNameStr = String(pkt.name || '').trim();
      if (/^verify/i.test(key) || /^verify/i.test(idStr) || /^verify/i.test(rawNameStr)) return;

      // Reject unlaunched UShippingGameInstance::Init placeholder packet before pawn possession
      const seq = Number(pkt.seq || 0);
      if (
        rawNameStr === 'CAPT-01' &&
        seq <= 1 &&
        Math.abs(rawX - 65000) < 5 &&
        Math.abs(rawY + 600) < 5
      ) {
        return;
      }

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
      const advancedWithin6s =
        st.lastAdvancedMs > 0 && (nowMs - st.lastAdvancedMs) <= HEARTBEAT_TIMEOUT_MS;
      const firstSightFresh =
        (nowMs - st.firstSeenMs) <= FIRST_SIGHT_GRACE_MS &&
        Number.isFinite(ts) &&
        ts > 1700000000 &&
        ageSec >= -4.0 &&
        ageSec <= 6.0;
      const explicitlyStale = Number.isFinite(ts) && ts > 0 && ageSec > 6.0 && !advancedWithin6s;

      const isLive =
        (!explicitlyStale && pkt._injectedTest === true) ||
        advancedWithin6s ||
        firstSightFresh;

      if (!isLive) return;

      activeRecords.push({ key, pkt, rawX, rawY });
    });

    const captainsByKey = new Map();
    const captainsByCompany = new Map();
    const aboardCrew = [];

    activeRecords.forEach(({ key, pkt, rawX, rawY }) => {
      const captainName = sanitizeMaritimeText(pkt.name, 'Captain');
      const companyName = sanitizeMaritimeText(pkt.cmp_nm, '');
      const cmpId = String(pkt.cmp_id || '').trim();
      const shipNum = clampCatalogShipId(pkt.ship || 1);

      if (pkt.cmp_abd === true && cmpId) {
        aboardCrew.push({ key, pkt, rawX, rawY, captainName, companyName, cmpId, shipNum });
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
        x: rawX,
        y: rawY,
        yaw: Number(pkt.yaw || 0),
        spd: Math.max(0, Number(pkt.spd || 0)),
        teu: Math.max(0, Math.round(Number(pkt.teu || 0))),
        dstRaw: pkt.dst,
        dst: dstDisplay === 'Captain' ? '' : dstDisplay,
        autopilot: Boolean(pkt.as),
        crewNames: []
      };
      if (vessel.company === 'Captain') vessel.company = '';

      captainsByKey.set(key, vessel);
      if (cmpId && !captainsByCompany.has(cmpId)) {
        captainsByCompany.set(cmpId, vessel);
      }
    });

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
          x: cm.rawX,
          y: cm.rawY,
          yaw: Number(cm.pkt.yaw || 0),
          spd: Math.max(0, Number(cm.pkt.spd || 0)),
          teu: Math.max(0, Math.round(Number(cm.pkt.teu || 0))),
          dst: '',
          autopilot: Boolean(cm.pkt.as),
          crewNames: []
        });
      }
    });

    return Array.from(captainsByKey.values());
  }

  function refreshActiveVesselsAndUI() {
    livePlayersList = parseLiveFirebasePlayers(rawFirebasePayload);
    const liveCount = livePlayersList.length;

    const activeKeys = new Set();
    livePlayersList.forEach((v) => {
      activeKeys.add(v.key);
      ensureShipEntity(v);
    });
    pruneShipEntities(activeKeys);

    const totalCrewOnline = livePlayersList.reduce((acc, v) => acc + 1 + v.crewNames.length, 0);
    if (serverStatusText) {
      const noun = totalCrewOnline === 1 ? 'CAPTAIN' : 'CAPTAINS';
      serverStatusText.textContent = `LIVE US OCEAN SERVER · ${totalCrewOnline} ${noun} ONLINE`;
    }
    if (hudShipsPill) {
      hudShipsPill.innerHTML = `<span class="legend-dot cyan"></span>${liveCount} Live ${liveCount === 1 ? 'Ship' : 'Ships'}`;
    }

    if (zeroNoticeEl) zeroNoticeEl.hidden = liveCount > 0;
    if (shipsListEl) shipsListEl.hidden = liveCount === 0;

    if (syncMetaEl) {
      const transportLabel = sseConnected ? 'SSE Stream + 1.5s Sync' : '1.5s Live Poll';
      syncMetaEl.textContent = `US Ocean Server (${transportLabel}) · Synced ${lastSyncTimeStr}`;
    }

    if (rosterHeadingEl) {
      rosterHeadingEl.textContent = 'Live Vessels on US Ocean Server';
    }
    if (rosterCountEl) {
      rosterCountEl.textContent = `${liveCount} ${liveCount === 1 ? 'Ship' : 'Ships'}`;
    }

    renderShipsRoster(livePlayersList);

    if (selectedTarget && selectedTarget.type === 'ship') {
      const match = livePlayersList.find((v) => v.key === selectedTarget.key);
      if (match) {
        updateInspectorForShip(match);
      } else {
        trackingShipKey = null;
        const hub = islandsById.get(1);
        if (hub) {
          selectedTarget = { type: 'island', id: 1 };
          updateInspectorForIsland(hub);
          highlightSelectedSidebarRows();
        }
      }
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
    } catch (_) {}
    refreshActiveVesselsAndUI();
  }

  function applySsePayloadEvent(ev, isPatch) {
    sseConnected = true;
    try {
      const msg = JSON.parse(ev.data);
      if (!msg || typeof msg.path !== 'string') return;
      if (msg.path === '/') {
        if (msg.data == null) {
          rawFirebasePayload = {};
        } else if (isPatch && typeof msg.data === 'object') {
          Object.entries(msg.data).forEach(([k, val]) => {
            if (val == null) delete rawFirebasePayload[k];
            else rawFirebasePayload[k] = val;
          });
        } else if (typeof msg.data === 'object') {
          rawFirebasePayload = msg.data;
        }
      } else {
        const subKey = msg.path.replace(/^\//, '').split('/')[0];
        if (subKey) {
          if (msg.data == null) {
            delete rawFirebasePayload[subKey];
          } else if (isPatch && typeof msg.data === 'object' && rawFirebasePayload[subKey]) {
            Object.assign(rawFirebasePayload[subKey], msg.data);
          } else {
            rawFirebasePayload[subKey] = msg.data;
          }
        }
      }
      lastSyncTimeStr = new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      });
      refreshActiveVesselsAndUI();
    } catch (_) {}
  }

  function connectFirebaseSSE() {
    if (typeof EventSource === 'undefined') return;
    try {
      const es = new EventSource(firebaseLiveUrl);
      es.addEventListener('put', (ev) => applySsePayloadEvent(ev, false));
      es.addEventListener('patch', (ev) => applySsePayloadEvent(ev, true));
      es.onerror = () => {
        sseConnected = false;
        es.close();
      };
    } catch (_) {}
  }

  // =========================================================================
  // 8. CAMERA FLIGHT, INSPECTOR TELEMETRY CARD & SIDEBAR DIRECTORY UI
  // =========================================================================
  let selectedTarget = null;
  let cameraTween = null;
  let trackingShipKey = null;

  function startCameraFlight(toCamPos, toTargetPos, durationMs = 920, keepAutoSpin = false) {
    if (!keepAutoSpin) {
      userAutoSpinEnabled = false;
      syncSpinButtonUI();
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
    controls.maxDistance = 540.0;
    userAutoSpinEnabled = true;
    syncSpinButtonUI();
    startCameraFlight(getWholeGlobeCamPos(), new THREE.Vector3(0, 0, 0), 880, true);
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

    selectionRing.position.copy(up).multiplyScalar(GLOBE_RADIUS + 0.16);
    selectionRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up);
    selectionRing.scale.setScalar(1.1 + Math.min(2.4, Number(isl.scale || 1) * 0.28));
    selectionRing.visible = true;

    if (selectedIslandSprite) {
      globeRoot.remove(selectedIslandSprite);
      if (selectedIslandSprite.material.map) selectedIslandSprite.material.map.dispose();
      selectedIslandSprite.material.dispose();
    }
    selectedIslandSprite = createTextSprite(
      `#${pad2(isl.id)} ${isl.name}`,
      isl.hasPortDock ? '#fbbf24' : '#34d399',
      0.9,
      false
    );
    selectedIslandSprite.position.copy(up).multiplyScalar(GLOBE_RADIUS + 3.2);
    selectedIslandSprite.userData.normal = up.clone();
    globeRoot.add(selectedIslandSprite);

    if (zoomClose) {
      controls.minDistance = 103.0;
      controls.maxDistance = 540.0;
      const dist = isl.scale >= 3.0 ? 156 : 128;
      const camDest = up.clone().multiplyScalar(dist).add(new THREE.Vector3(0, 7, 0));
      startCameraFlight(camDest, new THREE.Vector3(0, 0, 0), 920, false);
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

    selectionRing.visible = false;

    const frame = computeShipFrameOnSphere(ent.curX, ent.curY, ent.curYaw, 0.028);
    camera.up.copy(frame.up);

    controls.minDistance = 0.95;
    controls.maxDistance = 320.0;

    const shipTarget = frame.pos.clone().addScaledVector(frame.up, 0.14);
    const camPos = shipTarget
      .clone()
      .addScaledVector(frame.up, 0.46)
      .addScaledVector(frame.fwd, 1.32)
      .addScaledVector(frame.port, -1.42);

    startCameraFlight(camPos, shipTarget, 900, false);
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
      inspBadge.className = 'globe-insp-tag cyan';
      inspBadge.textContent = `LIVE CAPTAIN · ${shipMeta.id}`;
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
      shipsListEl.innerHTML = '';
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
  // 9. UI CONTROLS, DOUBLE-CLICK ZOOM & RAYCASTER PICKING ON 3D GLOBE
  // =========================================================================
  if (btnWhole) btnWhole.addEventListener('click', resetWholeGlobeView);
  if (btnHub) btnHub.addEventListener('click', () => focusIsland(1, true));

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      const dir = camera.position.clone().sub(controls.target);
      const nextLen = Math.max(controls.minDistance, dir.length() * 0.75);
      dir.setLength(nextLen);
      startCameraFlight(controls.target.clone().add(dir), controls.target.clone(), 400, userAutoSpinEnabled);
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (trackingShipKey && camera.position.distanceTo(controls.target) > 28) {
        resetWholeGlobeView();
        return;
      }
      const dir = camera.position.clone().sub(controls.target);
      const nextLen = Math.min(controls.maxDistance, dir.length() * 1.32);
      dir.setLength(nextLen);
      startCameraFlight(controls.target.clone().add(dir), controls.target.clone(), 400, userAutoSpinEnabled);
    });
  }

  if (btnSpin) {
    btnSpin.addEventListener('click', () => {
      trackingShipKey = null;
      camera.up.set(0, 1, 0);
      controls.target.set(0, 0, 0);
      controls.minDistance = 103.0;
      userAutoSpinEnabled = !userAutoSpinEnabled;
      syncSpinButtonUI();
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

  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  let pointerDownXY = null;

  canvas.addEventListener('pointerdown', (e) => {
    pointerDownXY = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointerDownXY || !dragPillEl) return;
    if (Math.hypot(e.clientX - pointerDownXY.x, e.clientY - pointerDownXY.y) > 8) {
      dragPillEl.classList.add('is-hidden');
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!pointerDownXY) return;
    const moved = Math.hypot(e.clientX - pointerDownXY.x, e.clientY - pointerDownXY.y);
    pointerDownXY = null;
    if (moved > 7) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNDC, camera);

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

  canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObject(globeMesh, false);
    if (hits.length) {
      trackingShipKey = null;
      camera.up.set(0, 1, 0);
      const hitNormal = hits[0].point.clone().normalize();
      const nextDist = Math.max(122, camera.position.length() * 0.68);
      startCameraFlight(hitNormal.multiplyScalar(nextDist), new THREE.Vector3(0, 0, 0), 650, false);
    }
  });

  // =========================================================================
  // 10. RESIZE & 60FPS ANIMATION LOOP
  // =========================================================================
  let initializedWholeDist = false;

  function resizeGlobeRenderer() {
    const w = Math.max(1, stageEl.clientWidth);
    const h = Math.max(1, stageEl.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);

    if (!trackingShipKey && !cameraTween && (!initializedWholeDist || camera.position.length() > 260)) {
      const targetWhole = getWholeGlobeDistance();
      camera.position.setLength(targetWhole);
      initializedWholeDist = true;
    }
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
  const _toItem = new THREE.Vector3();

  function animateGlobe(nowMs) {
    requestAnimationFrame(animateGlobe);
    if (document.hidden || !isGlobeNearViewport) {
      lastAnimMs = nowMs;
      return;
    }

    const dt = Math.min(0.06, Math.max(0.001, (nowMs - lastAnimMs) / 1000.0));
    lastAnimMs = nowMs;

    if (cameraTween) {
      const u = Math.min(1, (nowMs - cameraTween.startMs) / cameraTween.durationMs);
      const ease = 1 - Math.pow(1 - u, 3);
      camera.position.lerpVectors(cameraTween.fromCam, cameraTween.toCam, ease);
      controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, ease);
      if (u >= 1) cameraTween = null;
    }

    controls.autoRotate = Boolean(
      userAutoSpinEnabled && !isUserDraggingGlobe && !trackingShipKey && !cameraTween
    );

    const lerpAlpha = 1 - Math.exp(-dt * 6.5);
    const activeEntries = Array.from(shipEntities.values());

    activeEntries.forEach((ent, idxA) => {
      if (Math.hypot(ent.targetX - ent.curX, ent.targetY - ent.curY) > SNAP_TELEPORT_DIST_UU) {
        ent.curX = ent.targetX;
        ent.curY = ent.targetY;
        ent.curYaw = ent.targetYaw;
      } else {
        ent.curX += (ent.targetX - ent.curX) * lerpAlpha;
        ent.curY += (ent.targetY - ent.curY) * lerpAlpha;
        ent.curYaw += shortestAngleDeltaDeg(ent.curYaw, ent.targetYaw) * lerpAlpha;
      }

      const camDistToShip = camera.position.distanceTo(ent.root.position || camera.position);
      const zoomT = Math.min(1, Math.max(0, (camDistToShip - 2.0) / 235.0));
      const adaptiveScale = THREE.MathUtils.lerp(1.25, 6.2, Math.pow(zoomT, 0.76));
      const clearance = THREE.MathUtils.lerp(0.018, 0.28, zoomT);

      const frame = computeShipFrameOnSphere(ent.curX, ent.curY, ent.curYaw, clearance);
      ent.root.position.copy(frame.pos);
      ent.root.quaternion.copy(frame.quat);
      ent.modelHolder.scale.setScalar(adaptiveScale);

      let nearbyPeerRank = 0;
      for (let j = 0; j < idxA; j++) {
        const peer = activeEntries[j];
        const peerUp = worldXYToSphere3D(peer.curX, peer.curY, 1.0).normalize();
        if (frame.up.dot(peerUp) > 0.974) {
          nearbyPeerRank++;
        }
      }

      const isFocusedShip = trackingShipKey === ent.key;
      const showOrbitalSpire = !isFocusedShip && zoomT > 0.08;
      ent.orbitalBeaconGroup.visible = showOrbitalSpire;
      if (showOrbitalSpire) {
        const spireAlpha = Math.min(1, (zoomT - 0.08) / 0.25);
        const spireHeight = THREE.MathUtils.lerp(1.2, 6.4 + nearbyPeerRank * 3.8, Math.pow(zoomT, 0.85));
        const spireRadius = THREE.MathUtils.lerp(0.45, 2.35, zoomT);
        ent.spireBeam.scale.set(spireRadius, spireHeight, spireRadius);
        ent.spireBeam.material.opacity = 0.68 * spireAlpha;
        ent.spireOrb.position.set(0, spireHeight, 0);
        ent.spireOrb.scale.setScalar(spireRadius * 1.15);

        const wavePhase = ((nowMs * 0.00085 + idxA * 0.37) % 1.0);
        const waveScale = THREE.MathUtils.lerp(1.4, 5.8, wavePhase) * THREE.MathUtils.lerp(0.5, 1.65, zoomT);
        ent.pulseWaveRing.scale.setScalar(waveScale);
        ent.pulseWaveRing.material.opacity = (1.0 - wavePhase) * 0.82 * spireAlpha;
      }

      const pulse = 0.95 + 0.07 * Math.sin(nowMs * 0.005 + ent.shipNum);
      ent.beaconRing.scale.setScalar(pulse);
      ent.beaconRing.visible = zoomT > 0.012;
      ent.beaconRing.material.opacity = THREE.MathUtils.lerp(0.18, 0.88, Math.min(1, zoomT * 3.8));
      ent.wakeMesh.visible = Number(ent.data.spd || 0) > 0.6;

      const spireTop = showOrbitalSpire
        ? THREE.MathUtils.lerp(1.2, 6.4 + nearbyPeerRank * 3.8, Math.pow(zoomT, 0.85)) + 1.85
        : adaptiveScale * 0.34 + 0.16;
      ent.labelSprite.position.copy(frame.pos).addScaledVector(frame.up, spireTop);

      const spriteH = THREE.MathUtils.lerp(0.11, 3.65, Math.pow(zoomT, 0.85));
      ent.labelSprite.scale.set(spriteH * (ent.labelSprite.userData.aspect || 3.8), spriteH, 1);

      _toItem.copy(camera.position).sub(frame.pos).normalize();
      const facingDot = frame.up.dot(_toItem);
      ent.lastFacingDot = facingDot;
      const onFrontHemisphere = facingDot >= 0.05;
      ent.labelSprite.visible =
        onFrontHemisphere && (!trackingShipKey || isFocusedShip || camDistToShip > 14.0);

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

    if (camera.position.length() < GLOBE_RADIUS + 0.28) {
      camera.position.setLength(GLOBE_RADIUS + 0.28);
    }

    _camDir.copy(camera.position).sub(controls.target).normalize();
    _camRight.crossVectors(camera.up, _camDir);
    if (_camRight.lengthSq() < 1e-5) _camRight.set(1, 0, 0);
    _camRight.normalize();
    const trueCamUp = new THREE.Vector3().crossVectors(_camDir, _camRight).normalize();

    planetUniforms.uSunDir.value
      .copy(_camDir)
      .multiplyScalar(0.66)
      .addScaledVector(_camRight, 0.54)
      .addScaledVector(trueCamUp, 0.52)
      .normalize();

    keySunLight.position
      .copy(controls.target)
      .addScaledVector(_camDir, 240)
      .addScaledVector(_camRight, 165)
      .addScaledVector(trueCamUp, 155);
    keySunLight.target.position.copy(controls.target);

    rimCoolLight.position
      .copy(controls.target)
      .addScaledVector(_camDir, -150)
      .addScaledVector(_camRight, -140)
      .addScaledVector(trueCamUp, 80);
    rimCoolLight.target.position.copy(controls.target);

    const globeCamDist = camera.position.length();
    const orbitSpan = camera.position.distanceTo(controls.target);
    const effectiveAlt = trackingShipKey ? Math.min(globeCamDist - GLOBE_RADIUS, orbitSpan) : (globeCamDist - GLOBE_RADIUS);
    const globeZoomT = Math.min(1, Math.max(0, effectiveAlt / 220.0));

    extrudedTerrainGroup.visible = !(trackingShipKey && orbitSpan < 24.0);
    graticuleGroup.visible = !(trackingShipKey && orbitSpan < 18.0);

    const beaconScale = trackingShipKey && orbitSpan < 14.0
      ? THREE.MathUtils.lerp(0.045, 0.30, Math.min(1, orbitSpan / 14.0))
      : THREE.MathUtils.lerp(0.32, 1.32, Math.pow(globeZoomT, 0.72));
    islandsCatalog.forEach((isl) => {
      if (isl._markerGroup) isl._markerGroup.scale.setScalar(beaconScale);
    });

    shorelinesGroup.visible = globeCamDist < 185 || Boolean(trackingShipKey);

    const sprH = THREE.MathUtils.lerp(0.55, 2.75, globeZoomT);
    landmarkSprites.forEach((spr) => {
      _toItem.copy(camera.position).sub(spr.position).normalize();
      const facing = spr.userData.normal.dot(_toItem);
      let nearLiveShip = false;
      shipEntities.forEach((ent) => {
        const shipUp = worldXYToSphere3D(ent.curX, ent.curY, 1.0).normalize();
        if (spr.userData.normal.dot(shipUp) > 0.965) nearLiveShip = true;
      });
      spr.visible = facing >= 0.14 && !trackingShipKey && !nearLiveShip;
      spr.scale.set(sprH * (spr.userData.aspect || 3.4), sprH, 1);
    });

    if (selectedIslandSprite) {
      _toItem.copy(camera.position).sub(selectedIslandSprite.position).normalize();
      const facing = selectedIslandSprite.userData.normal.dot(_toItem);
      selectedIslandSprite.visible =
        facing >= 0.05 && (!selectedTarget || selectedTarget.type === 'island') && !trackingShipKey;
      const selH = THREE.MathUtils.lerp(0.45, 3.0, globeZoomT);
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
        fetch(`./assets/data/world-map-74.json?v=${ASSET_VER}`),
        fetch(`./assets/data/fleet-models-manifest.json?v=${ASSET_VER}`)
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

    await pollFirebasePlayers();
    connectFirebaseSSE();
    setInterval(pollFirebasePlayers, POLL_INTERVAL_MS);
    setInterval(refreshActiveVesselsAndUI, LIVENESS_TICK_MS);

    requestAnimationFrame(animateGlobe);
  }

  window.__trueHelmGlobeDebug = {
    getState() {
      const w = Math.max(1, stageEl.clientWidth);
      const h = Math.max(1, stageEl.clientHeight);
      const camDist = camera.position.length();
      const halfVRad = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const tanHalfV = Math.tan(halfVRad);
      const tanHalfH = tanHalfV * (w / h);

      const calcNDCFrac = (rad) => {
        if (camDist <= rad) return { halfFracX: 99, halfFracY: 99 };
        const sinA = rad / camDist;
        const tanA = sinA / Math.sqrt(Math.max(1e-6, 1 - sinA * sinA));
        return {
          halfFracX: tanA / tanHalfH,
          halfFracY: tanA / tanHalfV
        };
      };
      const sphereBounds = calcNDCFrac(GLOBE_RADIUS);
      const atmosBounds = calcNDCFrac(ATMOS_OUTER_RADIUS);

      const shipVisibility = [];
      shipEntities.forEach((ent) => {
        const expectedSphere = worldXYToSphere3D(ent.targetX, ent.targetY, GLOBE_RADIUS);
        const actualSphere = ent.root.position.clone().normalize().multiplyScalar(GLOBE_RADIUS);
        const sphereCoordErr = actualSphere.distanceTo(expectedSphere);
        shipVisibility.push({
          key: ent.key,
          captain: ent.data.captain,
          ship: ent.shipNum,
          x: ent.curX,
          y: ent.curY,
          sphereCoordError: Number(sphereCoordErr.toFixed(6)),
          facingDot: Number((ent.lastFacingDot || 0).toFixed(4)),
          labelVisible: Boolean(ent.labelSprite && ent.labelSprite.visible),
          spireVisible: Boolean(ent.orbitalBeaconGroup && ent.orbitalBeaconGroup.visible)
        });
      });

      return {
        assetVer: ASSET_VER,
        islandCount: islandsCatalog.length,
        portCount: islandsCatalog.filter((i) => i.hasPortDock).length,
        scenicCount: islandsCatalog.filter((i) => !i.hasPortDock).length,
        extrudedMeshCount: extrudedTerrainGroup.children.length,
        livePlayerCount: livePlayersList.length,
        activeShipEntityCount: shipEntities.size,
        autoSpinEnabled: userAutoSpinEnabled,
        autoRotateActive: controls.autoRotate,
        autoRotateSpeed: controls.autoRotateSpeed,
        loadedGlbIds: Array.from(loadedGlbIds).sort((a, b) => a - b),
        trackingShipKey,
        selectedTarget,
        cameraDistance: Number(camDist.toFixed(2)),
        cameraDistanceOverR: Number((camDist / GLOBE_RADIUS).toFixed(3)),
        cameraPosition: {
          x: Number(camera.position.x.toFixed(3)),
          y: Number(camera.position.y.toFixed(3)),
          z: Number(camera.position.z.toFixed(3))
        },
        globeSilhouette: {
          canvasWidth: w,
          canvasHeight: h,
          sphereHalfWidthPct: Number((sphereBounds.halfFracX * 100).toFixed(1)),
          sphereHalfHeightPct: Number((sphereBounds.halfFracY * 100).toFixed(1)),
          atmosHalfWidthPct: Number((atmosBounds.halfFracX * 100).toFixed(1)),
          atmosHalfHeightPct: Number((atmosBounds.halfFracY * 100).toFixed(1)),
          sphereUnclipped: sphereBounds.halfFracX < 0.92 && sphereBounds.halfFracY < 0.92,
          atmosUnclipped: atmosBounds.halfFracX < 0.995 && atmosBounds.halfFracY < 0.995
        },
        shipVisibility
      };
    },
    getIslandById(id) {
      return islandsById.get(Number(id)) || null;
    },
    checkPortBerthOnOpenWater(id) {
      const isl = islandsById.get(Number(id));
      if (!isl) return { found: false };
      const bx = Number(isl.berthX != null ? isl.berthX : isl.x);
      const by = Number(isl.berthY != null ? isl.berthY : isl.y);
      const outwardDir = worldXYToSphere3D(bx, by, 1.0).normalize();
      const rayOrigin = outwardDir.clone().multiplyScalar(GLOBE_RADIUS + 20.0);
      const rayInward = outwardDir.clone().negate();
      const rc = new THREE.Raycaster(rayOrigin, rayInward, 0.1, 40.0);
      scene.updateMatrixWorld(true);
      const landHits = extrudedLandMeshRef ? rc.intersectObject(extrudedLandMeshRef, false) : [];
      return {
        found: true,
        islandId: isl.id,
        name: isl.name,
        berthX: bx,
        berthY: by,
        landHitsAboveWater: landHits.filter((h) => h.point.length() > GLOBE_RADIUS - 0.01).length,
        onOpenHarborWater: landHits.filter((h) => h.point.length() > GLOBE_RADIUS - 0.01).length === 0
      };
    },
    worldXYToLatLon,
    worldXYToSphere3D(x, y) {
      const v = worldXYToSphere3D(x, y, GLOBE_RADIUS);
      return { x: Number(v.x.toFixed(4)), y: Number(v.y.toFixed(4)), z: Number(v.z.toFixed(4)) };
    },
    setAutoSpin(on) {
      userAutoSpinEnabled = Boolean(on);
      syncSpinButtonUI();
      return userAutoSpinEnabled;
    },
    async injectTestPackets(packetsObj) {
      injectedTestPackets = packetsObj;
      if (!packetsObj) {
        seenFirebaseRecords.clear();
      }
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
