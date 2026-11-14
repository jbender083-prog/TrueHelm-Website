/* ==========================================================================
   TrueHelm: Realistic Shipping Lanes — Interactive Bridge & ECDIS Logic
   ========================================================================== */

(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Live UTC Bridge Clock & Subtle Compass Sea-Keeping Drift
  // --------------------------------------------------------------------------
  const utcClockEl = document.getElementById('utc-bridge-clock');
  const compassDegEl = document.getElementById('compass-deg-value');
  const compassTrackEl = document.getElementById('compass-ticks-track');

  function updateBridgeClock() {
    if (!utcClockEl) return;
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    utcClockEl.textContent = `US OCEAN · ${hh}:${mm} UTC`;
  }
  updateBridgeClock();
  setInterval(updateBridgeClock, 15000);

  let pointerNormX = 0;
  window.addEventListener('pointermove', (e) => {
    pointerNormX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
  }, { passive: true });

  // --------------------------------------------------------------------------
  // 2. Complete Authentic 35-Ship Fleet Catalog (from ShipTypes.h)
  // --------------------------------------------------------------------------
  const FLEET_TIERS = {
    1: {
      badge: 'TIER 1 · SHALLOW SANDBAR AGILITY (0.55m–2.13m DRAFT)',
      kicker: 'SHIPS #01 – #07 // HARBOR CRAFT, TUGS & HIGH-SPEED LAUNCHES',
      title: 'Tier 1: Harbor Craft & Starters',
      desc: 'Nimble 28–38 knot harbor interceptors, azimuth escort tugs, high-speed crew catamarans, and island Ro-Ro ferries engineered for shallow coral channels and rapid early-career turnarounds.',
      img: 'assets/fleet/tier1-harbor-coastal.jpg',
      highlights: [
        ['LENGTH RANGE', '18m – 32m'],
        ['TOP SPEED', 'Up to 38.0 Knots'],
        ['DRAFT RANGE', '0.91m – 2.13m']
      ],
      ships: [
        { id: '#01', name: 'MS Pilot Interceptor ★', cls: 'Fast Harbor Launch', dim: '22m × 6.2m', draft: '1.10m', cargo: '240 t (16 TEU)', speed: '36.0 kts', price: '$25,000', flagship: true },
        { id: '#02', name: 'MV Titan ASD Tug', cls: 'Azimuth Escort Tug', dim: '32m × 11.5m', draft: '2.13m', cargo: '960 t (64 TEU)', speed: '28.0 kts', price: '$48,000' },
        { id: '#03', name: 'Coastal Container Feeder ★', cls: 'Starter Container Feeder', dim: '18m × 5.5m', draft: '0.91m', cargo: '15 t (1 TEU)', speed: '38.0 kts', price: '$18,000', flagship: true },
        { id: '#04', name: 'MV WindSprint Catamaran', cls: 'High-Speed Crew Cat', dim: '28m × 9.4m', draft: '1.34m', cargo: '540 t (36 TEU)', speed: '31.0 kts', price: '$75,000' },
        { id: '#05', name: 'Coastal Product Tanker', cls: 'Product Tanker', dim: '26m × 8.0m', draft: '1.65m', cargo: '420 t (28 TEU)', speed: '32.5 kts', price: '$45,000' },
        { id: '#06', name: 'MV Sentinel Patrol', cls: 'Coastal Tender', dim: '25m × 6.8m', draft: '1.40m', cargo: '330 t (22 TEU)', speed: '34.0 kts', price: '$135,000' },
        { id: '#07', name: 'Island Ro-Ro Ferry', cls: 'Ro-Ro Car Ferry', dim: '30m × 11.0m', draft: '2.01m', cargo: '720 t (48 TEU)', speed: '29.5 kts', price: '$75,000' }
      ]
    },
    2: {
      badge: 'TIER 2 · INTER-ISLAND FEEDERS & OFFSHORE OSV',
      kicker: 'SHIPS #08 – #14 // COASTAL LINERS, REEFERS & OFFSHORE SUPPLY',
      title: 'Tier 2: Coastal Feeders & Offshore Supply',
      desc: 'Step up to 74m–98m geared container feeders, chemical tankers, reefer liners, ConRo barge hybrids, and helideck-equipped Offshore Supply Vessels built for multi-island trade lanes.',
      img: 'assets/fleet/tier2-offshore-feeder.jpg',
      highlights: [
        ['LENGTH RANGE', '74m – 98m'],
        ['MAX DEADWEIGHT', 'Up to 7,500 DWT'],
        ['TOP SPEED', '21.2 – 26.0 Knots']
      ],
      ships: [
        { id: '#08', name: 'MV Ocean Adventure', cls: 'Geared Feeder 450 TEU', dim: '85m × 16.5m', draft: '4.20m', cargo: '4,650 t (310 TEU)', speed: '23.6 kts', price: '$119,000' },
        { id: '#09', name: 'MT Alchemist Star', cls: 'Coastal Chem Tanker', dim: '98m × 16.8m', draft: '4.60m', cargo: '7,500 t (500 TEU)', speed: '21.2 kts', price: '$133,000' },
        { id: '#10', name: 'MV Baltic Trader', cls: 'Coaster Mini-Bulker', dim: '90m × 15.6m', draft: '4.40m', cargo: '6,300 t (420 TEU)', speed: '22.0 kts', price: '$126,000' },
        { id: '#11', name: 'MS Calypso Queen', cls: 'Reefer Container Liner', dim: '86m × 17.2m', draft: '3.80m', cargo: '5,400 t (360 TEU)', speed: '22.8 kts', price: '$168,000' },
        { id: '#12', name: 'MV Horizon Pioneer OSV ★', cls: 'Offshore Supply Ship', dim: '78m × 17.0m', draft: '4.00m', cargo: '3,300 t (220 TEU)', speed: '25.2 kts', price: '$210,000', flagship: true },
        { id: '#13', name: 'MV Tropic Cement', cls: 'Pneumatic Cement Coaster', dim: '82m × 15.2m', draft: '4.00m', cargo: '3,900 t (260 TEU)', speed: '24.4 kts', price: '$133,000' },
        { id: '#14', name: 'MV Iron Pusher & Barge', cls: 'ConRo Hybrid Carrier', dim: '74m × 18.0m', draft: '3.20m', cargo: '2,700 t (180 TEU)', speed: '26.0 kts', price: '$259,000' }
      ]
    },
    3: {
      badge: 'TIER 3 · SPECIALIST INDUSTRIAL & FLO-FLO HEAVY LIFT',
      kicker: 'SHIPS #15 – #21 // REGIONAL BULKERS, RO-RO & SUBMERSIBLE CARRIERS',
      title: 'Tier 3: Regional Freighters & Heavy Specialists',
      desc: 'Unlock specialized port zones across the 5x ocean: Handysize bulkers, MR2 product tankers, Sub-Panamax boxships, Ro-Ro vehicle carriers, suction hopper dredgers, and your first submersible Flo-Flo hull.',
      img: 'assets/fleet/tier3-regional-specialist.jpg',
      highlights: [
        ['LENGTH RANGE', '118m – 160m'],
        ['MAX DEADWEIGHT', 'Up to 30,750 DWT'],
        ['SPECIALTY', 'Zone 1–6 Industrial Cargo']
      ],
      ships: [
        { id: '#15', name: 'MV Pacific Handysize', cls: 'Geared Bulk Carrier', dim: '135m × 22.5m', draft: '5.80m', cargo: '14,400 t (960 TEU)', speed: '19.2 kts', price: '$392,000' },
        { id: '#16', name: 'MT Gulf Navigator', cls: 'MR2 Product Tanker', dim: '148m × 24.0m', draft: '6.20m', cargo: '21,300 t (1,420 TEU)', speed: '17.6 kts', price: '$546,000' },
        { id: '#17', name: 'MV Atlantic Express ★', cls: 'Sub-Panamax Container', dim: '160m × 25.5m', draft: '6.50m', cargo: '30,750 t (2,050 TEU)', speed: '16.1 kts', price: '$756,000', flagship: true },
        { id: '#18', name: 'MV AutoHighway Carrier', cls: 'Ro-Ro Vehicle Carrier', dim: '152m × 26.0m', draft: '6.00m', cargo: '24,000 t (1,600 TEU)', speed: '17.1 kts', price: '$952,000' },
        { id: '#19', name: 'PIONEER FLO-FLO ★', cls: 'Submersible Boat Carrier', dim: '138m × 24.5m', draft: '5.20m', cargo: '13,500 t (900 TEU)', speed: '19.4 kts', price: '$910,000', flagship: true },
        { id: '#20', name: 'MV Timber Monarch', cls: 'Timber Log Bulker', dim: '128m × 21.5m', draft: '5.40m', cargo: '12,300 t (820 TEU)', speed: '19.8 kts', price: '$1,372,000' },
        { id: '#21', name: 'MV Poseidon Dredger', cls: 'Suction Hopper Dredge', dim: '118m × 22.0m', draft: '5.20m', cargo: '10,200 t (680 TEU)', speed: '20.4 kts', price: '$1,540,000' }
      ]
    },
    4: {
      badge: 'TIER 4 · TRANS-OCEANIC PANAMAX, LNG & POLAR CLASS',
      kicker: 'SHIPS #22 – #28 // POST-PANAMAX BOXSHIPS, MOSS LNG & PCTC LINERS',
      title: 'Tier 4: Deep-Sea Trans-Oceanic Giants',
      desc: 'Built for long-haul continental crossings and storm hazard contracts: twin-island Post-Panamax container ships, spherical Moss LNG cryogenic carriers, Aframax tankers, and Polar Class icebreakers.',
      img: 'assets/fleet/tier4-panamax-deepsea.jpg',
      highlights: [
        ['LENGTH RANGE', '142m – 225m'],
        ['MAX DEADWEIGHT', 'Up to 108,000 DWT'],
        ['HIGHLIGHT', 'Spherical Moss LNG & PCTC']
      ],
      ships: [
        { id: '#22', name: 'MV Panama Monarch', cls: 'Panamax Dry Bulker', dim: '185m × 29.0m', draft: '7.60m', cargo: '48,000 t (3,200 TEU)', speed: '15.1 kts', price: '$1,610,000' },
        { id: '#23', name: 'MT Nordic Aframax', cls: 'Aframax Crude Tanker', dim: '198m × 32.0m', draft: '8.00m', cargo: '69,000 t (4,600 TEU)', speed: '14.2 kts', price: '$2,072,000' },
        { id: '#24', name: 'MV Sovereign Boxship ★', cls: 'Post-Panamax 8500 TEU', dim: '215m × 33.5m', draft: '8.20m', cargo: '87,000 t (5,800 TEU)', speed: '13.8 kts', price: '$3,430,000', flagship: true },
        { id: '#25', name: 'LNG CryoSpirit ★', cls: 'Spherical Moss LNG', dim: '225m × 35.0m', draft: '8.00m', cargo: '108,000 t (7,200 TEU)', speed: '13.4 kts', price: '$3,990,000', flagship: true },
        { id: '#26', name: 'TITAN FLO-FLO', cls: 'Submersible Boat Carrier', dim: '142m × 25.0m', draft: '5.80m', cargo: '18,750 t (1,250 TEU)', speed: '18.1 kts', price: '$2,240,000' },
        { id: '#27', name: 'MV Global RoRo Alliance', cls: 'PCTC 8000 Car Carrier', dim: '178m × 30.0m', draft: '7.00m', cargo: '39,000 t (2,600 TEU)', speed: '15.6 kts', price: '$2,590,000' },
        { id: '#28', name: 'MV Borealis Icebreaker', cls: 'Polar Class Bulker', dim: '156m × 25.5m', draft: '6.80m', cargo: '27,000 t (1,800 TEU)', speed: '16.6 kts', price: '$4,130,000' }
      ]
    },
    5: {
      badge: 'TIER 5 · AFT POOL & 110" TV LOUNGE EQUIPPED',
      kicker: 'SHIPS #29 – #35 // ULTRA-LARGE OCEAN FLAGSHIPS',
      title: 'Tier 5: Maritime Titans & Flagships',
      desc: 'The apex of global shipping: 232m–290m Capesize bulkers, VLCC supertankers, 22,000-TEU Megamax container liners, submersible Flo-Flo heavy transports, and the 390,000-DWT #34 FLNG Prelude Leviathan—all featuring walkable aft crew lounges with 9-ft billiards and 110" cinema TVs.',
      img: 'assets/fleet/tier5-ulcv-leviathan.jpg',
      highlights: [
        ['LENGTH RANGE', '195m – 290m'],
        ['MAX DEADWEIGHT', 'Up to 390,000 DWT'],
        ['CREW LOUNGE', 'Pool + 110" Cinema TV']
      ],
      ships: [
        { id: '#29', name: 'MV Cape Good Hope', cls: 'Capesize Ore Carrier', dim: '240m × 38.0m', draft: '9.20m', cargo: '162,000 t (10,800 TEU)', speed: '12.6 kts', price: '$5,040,000' },
        { id: '#30', name: 'MT Red Sea Emperor', cls: 'Suezmax Crude Tanker', dim: '232m × 37.0m', draft: '9.00m', cargo: '132,000 t (8,800 TEU)', speed: '13.0 kts', price: '$6,300,000' },
        { id: '#31', name: 'MT Olympus VLCC', cls: 'VLCC Supertanker', dim: '265m × 44.0m', draft: '9.80m', cargo: '216,000 t (14,400 TEU)', speed: '12.2 kts', price: '$8,120,000' },
        { id: '#32', name: 'MV Megamax 24000 Titan ★', cls: 'ULCV 24,000 TEU', dim: '280m × 45.0m', draft: '9.60m', cargo: '330,000 t (22,000 TEU)', speed: '11.4 kts', price: '$10,920,000', flagship: true },
        { id: '#33', name: 'MV Valemax Carajas', cls: 'VLOC 400,000 DWT', dim: '272m × 44.0m', draft: '9.80m', cargo: '267,000 t (17,800 TEU)', speed: '11.8 kts', price: '$9,660,000' },
        { id: '#34', name: 'FLNG Prelude Leviathan ★', cls: 'Offshore FLNG Facility', dim: '290m × 48.0m', draft: '10.00m', cargo: '390,000 t (26,000 TEU)', speed: '11.0 kts', price: '$11,900,000', flagship: true },
        { id: '#35', name: 'VANGUARD FLO-FLO', cls: 'Submersible Boat Carrier', dim: '195m × 42.0m', draft: '7.20m', cargo: '58,500 t (3,900 TEU)', speed: '14.6 kts', price: '$6,720,000' }
      ]
    }
  };

  const tierTabs = document.querySelectorAll('.tier-tab');
  const tierImg = document.getElementById('fleet-tier-img');
  const tierBadge = document.getElementById('fleet-tier-badge');
  const tierKicker = document.getElementById('fleet-tier-kicker');
  const tierTitle = document.getElementById('fleet-tier-title');
  const tierDesc = document.getElementById('fleet-tier-desc');
  const tierHighlights = document.getElementById('fleet-tier-highlights');
  const tierTbody = document.getElementById('fleet-ships-tbody');

  function renderFleetTier(tierNum) {
    const data = FLEET_TIERS[tierNum];
    if (!data) return;

    tierTabs.forEach((btn) => {
      const isMatch = Number(btn.dataset.tier) === Number(tierNum);
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    if (tierImg) {
      tierImg.src = data.img;
      tierImg.alt = data.title;
    }
    if (tierBadge) tierBadge.textContent = data.badge;
    if (tierKicker) tierKicker.textContent = data.kicker;
    if (tierTitle) tierTitle.textContent = data.title;
    if (tierDesc) tierDesc.textContent = data.desc;

    if (tierHighlights) {
      tierHighlights.innerHTML = data.highlights
        .map(([lbl, val]) => `<div><span>${lbl}</span><strong>${val}</strong></div>`)
        .join('');
    }

    if (tierTbody) {
      tierTbody.innerHTML = data.ships
        .map((s) => `
          <tr class="${s.flagship ? 'flagship-row' : ''}">
            <td><span class="hull-id">${s.id}</span> <strong>${s.name}</strong></td>
            <td>${s.cls}</td>
            <td>${s.dim}</td>
            <td>${s.draft}</td>
            <td>${s.cargo}</td>
            <td>${s.speed}</td>
            <td class="price-cell">${s.price}</td>
          </tr>
        `)
        .join('');
    }
  }

  tierTabs.forEach((btn) => {
    btn.addEventListener('click', () => renderFleetTier(btn.dataset.tier));
  });

  // --------------------------------------------------------------------------
  // 3. Click-to-Zoom 1080p Lightbox Viewer
  // --------------------------------------------------------------------------
  const galleryItems = Array.from(document.querySelectorAll('#screenshot-gallery .gallery-item'));
  const heroFrame = document.querySelector('.hero-hud-frame');
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalCaption = document.getElementById('lightbox-caption');
  const modalCounter = document.getElementById('lightbox-counter');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  let activeIndex = 0;

  function openLightbox(index) {
    if (!modal || !galleryItems.length) return;
    activeIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[activeIndex];
    modalImg.src = item.dataset.lightboxSrc;
    modalCaption.textContent = item.dataset.lightboxCaption || '';
    modalCounter.textContent = `CAPTURE ${activeIndex + 1} / ${galleryItems.length}`;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  galleryItems.forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(idx));
  });

  if (heroFrame) {
    heroFrame.addEventListener('click', () => openLightbox(0));
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', () => openLightbox(activeIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => openLightbox(activeIndex + 1));

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') openLightbox(activeIndex - 1);
    if (e.key === 'ArrowRight') openLightbox(activeIndex + 1);
  });

  // --------------------------------------------------------------------------
  // 4. Non-Blocking Direct .ZIP Download Toast (Zero preventDefault!)
  // --------------------------------------------------------------------------
  const toastEl = document.getElementById('download-toast');
  const toastTitle = document.getElementById('toast-title');
  let toastTimer = null;

  document.querySelectorAll('[data-direct-zip]').forEach((link) => {
    link.addEventListener('click', () => {
      // Intentionally NO event.preventDefault() — native same-tab .ZIP download begins immediately!
      if (!toastEl || !toastTitle) return;
      toastTitle.textContent = `Starting Direct Download: ${link.dataset.directZip}`;
      toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toastEl.hidden = true;
      }, 8500);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Animated ECDIS Radar & Ocean Wave Backdrop + Hero Mini PPI Radar
  // --------------------------------------------------------------------------
  const bgCanvas = document.getElementById('ocean-radar-canvas');
  const miniCanvas = document.getElementById('mini-radar-canvas');
  const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
  const miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;

  const blips = [
    { angle: 0.55, dist: 0.36, color: '#2ee59d', label: 'AIS-34' },
    { angle: 1.85, dist: 0.62, color: '#00e5ff', label: 'AIS-32' },
    { angle: 3.05, dist: 0.48, color: '#ffb74d', label: 'SQUALL' },
    { angle: 4.42, dist: 0.71, color: '#2ee59d', label: 'PORT-08' },
    { angle: 5.35, dist: 0.29, color: '#00e5ff', label: 'CREW-COOP' }
  ];

  function resizeBg() {
    if (!bgCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    bgCanvas.width = Math.floor(window.innerWidth * dpr);
    bgCanvas.height = Math.floor(window.innerHeight * dpr);
    if (bgCtx) bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeBg();
  window.addEventListener('resize', resizeBg, { passive: true });

  function drawFrame(ts) {
    const t = ts * 0.001;

    // Gentle compass oscillation (332° - 334°)
    if (compassDegEl && compassTrackEl) {
      const drift = Math.sin(t * 0.55) * 1.2 + pointerNormX * 1.8;
      const deg = Math.round((333 + drift + 360) % 360);
      compassDegEl.textContent = `${String(deg).padStart(3, '0')}°`;
      compassTrackEl.style.transform = `translateX(${(-drift * 4.5).toFixed(1)}px)`;
    }

    // Background ECDIS Chart + Sweeping Radar + Ocean Swell Contours
    if (bgCtx && bgCanvas) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      bgCtx.clearRect(0, 0, w, h);

      // Subtle Lat/Lon Nautical Grid
      bgCtx.strokeStyle = 'rgba(0, 229, 255, 0.038)';
      bgCtx.lineWidth = 1;
      const step = 96;
      for (let x = 0; x < w; x += step) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, h);
        bgCtx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(w, y);
        bgCtx.stroke();
      }

      // Large ECDIS Range Rings centered near upper-right hero area
      const cx = w * 0.74;
      const cy = h * 0.42;
      const maxR = Math.min(w, h) * 0.52;

      for (let i = 1; i <= 4; i++) {
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, (maxR * i) / 4, 0, Math.PI * 2);
        bgCtx.strokeStyle = 'rgba(0, 229, 255, 0.065)';
        bgCtx.stroke();
      }

      // Sweeping Radar Sector
      const sweepAngle = (t * 0.68) % (Math.PI * 2);
      const grad = bgCtx.createConicGradient
        ? bgCtx.createConicGradient(sweepAngle - 0.55, cx, cy)
        : null;

      if (grad) {
        grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
        grad.addColorStop(0.085, 'rgba(0, 229, 255, 0.095)');
        grad.addColorStop(0.09, 'rgba(46, 229, 157, 0.16)');
        grad.addColorStop(0.091, 'rgba(0, 229, 255, 0)');
        bgCtx.fillStyle = grad;
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, maxR, 0, Math.PI * 2);
        bgCtx.fill();
      }

      // Leading Sweep Ray
      bgCtx.beginPath();
      bgCtx.moveTo(cx, cy);
      bgCtx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      bgCtx.strokeStyle = 'rgba(46, 229, 157, 0.28)';
      bgCtx.lineWidth = 1.4;
      bgCtx.stroke();

      // AIS Blips
      blips.forEach((b) => {
        const bx = cx + Math.cos(b.angle) * (maxR * b.dist);
        const by = cy + Math.sin(b.angle) * (maxR * b.dist);
        let diff = (sweepAngle - b.angle) % (Math.PI * 2);
        if (diff < 0) diff += Math.PI * 2;
        const glow = Math.max(0.22, 1 - diff / (Math.PI * 1.6));

        bgCtx.fillStyle = b.color;
        bgCtx.globalAlpha = glow * 0.72;
        bgCtx.beginPath();
        bgCtx.arc(bx, by, 3, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.globalAlpha = 1;
      });

      // Layered Ocean Wave Contours along bottom horizon
      for (let layer = 0; layer < 3; layer++) {
        bgCtx.beginPath();
        const baseH = h - 90 + layer * 28;
        for (let x = 0; x <= w; x += 18) {
          const y =
            baseH +
            Math.sin(x * 0.0045 + t * (0.9 + layer * 0.25) + layer) * (11 - layer * 2) +
            Math.cos(x * 0.009 - t * 0.55) * 5;
          if (x === 0) bgCtx.moveTo(x, y);
          else bgCtx.lineTo(x, y);
        }
        bgCtx.strokeStyle = layer === 0
          ? 'rgba(0, 229, 255, 0.14)'
          : 'rgba(46, 229, 157, 0.08)';
        bgCtx.lineWidth = 1.2;
        bgCtx.stroke();
      }
    }

    // Mini PPI Doppler Radar Widget inside Hero Showcase Frame
    if (miniCtx && miniCanvas) {
      const mw = miniCanvas.width;
      const mh = miniCanvas.height;
      const mcx = mw / 2;
      const mcy = mh / 2;
      const mr = mw / 2 - 4;

      miniCtx.clearRect(0, 0, mw, mh);

      miniCtx.beginPath();
      miniCtx.arc(mcx, mcy, mr, 0, Math.PI * 2);
      miniCtx.fillStyle = 'rgba(3, 12, 22, 0.9)';
      miniCtx.fill();
      miniCtx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
      miniCtx.lineWidth = 1.2;
      miniCtx.stroke();

      [0.36, 0.68].forEach((f) => {
        miniCtx.beginPath();
        miniCtx.arc(mcx, mcy, mr * f, 0, Math.PI * 2);
        miniCtx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
        miniCtx.lineWidth = 0.8;
        miniCtx.stroke();
      });

      miniCtx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      miniCtx.beginPath();
      miniCtx.moveTo(mcx - mr, mcy);
      miniCtx.lineTo(mcx + mr, mcy);
      miniCtx.moveTo(mcx, mcy - mr);
      miniCtx.lineTo(mcx, mcy + mr);
      miniCtx.stroke();

      const ang = (t * 1.45) % (Math.PI * 2);
      miniCtx.beginPath();
      miniCtx.moveTo(mcx, mcy);
      miniCtx.arc(mcx, mcy, mr, ang - 0.55, ang);
      miniCtx.closePath();
      miniCtx.fillStyle = 'rgba(46, 229, 157, 0.26)';
      miniCtx.fill();

      miniCtx.beginPath();
      miniCtx.moveTo(mcx, mcy);
      miniCtx.lineTo(mcx + Math.cos(ang) * mr, mcy + Math.sin(ang) * mr);
      miniCtx.strokeStyle = '#2ee59d';
      miniCtx.lineWidth = 1.4;
      miniCtx.stroke();

      // Radar Contacts
      [
        [0.9, 0.52, '#2ee59d'],
        [2.4, 0.68, '#ffb74d'],
        [4.7, 0.42, '#00e5ff']
      ].forEach(([a, d, col]) => {
        miniCtx.fillStyle = col;
        miniCtx.beginPath();
        miniCtx.arc(mcx + Math.cos(a) * mr * d, mcy + Math.sin(a) * mr * d, 2.3, 0, Math.PI * 2);
        miniCtx.fill();
      });

      // Center Ship Hull Triangle
      miniCtx.fillStyle = '#ffffff';
      miniCtx.beginPath();
      miniCtx.moveTo(mcx, mcy - 5);
      miniCtx.lineTo(mcx - 3.2, mcy + 4);
      miniCtx.lineTo(mcx + 3.2, mcy + 4);
      miniCtx.closePath();
      miniCtx.fill();
    }

    requestAnimationFrame(drawFrame);
  }

  requestAnimationFrame(drawFrame);
})();
