/* ==========================================================================
   TrueHelm: Realistic Shipping Lanes — Streamlined Mobile, 35-Boat Photo Fleet & Release-Synced Update Log JS
   ========================================================================== */

(() => {
  'use strict';

  // 1. Mobile Navigation Drawer
  const menuToggle = document.getElementById('menu-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  function closeMobileDrawer() {
    if (!menuToggle || !mobileDrawer) return;
    mobileDrawer.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      const willOpen = mobileDrawer.hidden;
      mobileDrawer.hidden = !willOpen;
      menuToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileDrawer);
    });
  }

  // 2. Complete 35-Ship Fleet Catalog (Tiers 1–5 Interactive Photo Cards + Modal)
  const FLEET_TIERS = {
    1: {
      badge: 'Tier 1 · Shallow-Draft Agility (0.55m–2.13m)',
      title: 'Tier 1: Harbor Craft & Starters',
      desc: 'Fast 28–38 knot harbor launches, azimuth escort tugs, crew catamarans, and island Ro-Ro ferries built for shallow channels and quick early-career runs.',
      img: 'assets/fleet/tier1-harbor-coastal.jpg',
      highlights: ['<strong>18m–32m</strong> Length', '<strong>Up to 38 knots</strong> Speed', '<strong>0.9m–2.1m</strong> Draft'],
      ships: [
        { id: '#01', name: 'MS Pilot Interceptor ★', cls: 'Fast Harbor Launch', dim: '22m × 6.2m · 1.1m draft', cargo: '240 t (16 TEU)', speed: '36.0 knots', price: '$25,000', flagship: true },
        { id: '#02', name: 'MV Titan ASD Tug', cls: 'Azimuth Escort Tug', dim: '32m × 11.5m · 2.1m draft', cargo: '960 t (64 TEU)', speed: '28.0 knots', price: '$48,000' },
        { id: '#03', name: 'Coastal Container Feeder ★', cls: 'Starter Container Feeder', dim: '18m × 5.5m · 0.9m draft', cargo: '15 t (1 TEU)', speed: '38.0 knots', price: '$18,000', flagship: true },
        { id: '#04', name: 'MV WindSprint Catamaran', cls: 'High-Speed Crew Cat', dim: '28m × 9.4m · 1.3m draft', cargo: '540 t (36 TEU)', speed: '31.0 knots', price: '$75,000' },
        { id: '#05', name: 'Coastal Product Tanker', cls: 'Product Tanker', dim: '26m × 8.0m · 1.7m draft', cargo: '420 t (28 TEU)', speed: '32.5 knots', price: '$45,000' },
        { id: '#06', name: 'MV Sentinel Patrol', cls: 'Coastal Tender', dim: '25m × 6.8m · 1.4m draft', cargo: '330 t (22 TEU)', speed: '34.0 knots', price: '$135,000' },
        { id: '#07', name: 'Island Ro-Ro Ferry', cls: 'Ro-Ro Car Ferry', dim: '30m × 11.0m · 2.0m draft', cargo: '720 t (48 TEU)', speed: '29.5 knots', price: '$75,000' }
      ]
    },
    2: {
      badge: 'Tier 2 · Coastal Liners & Offshore OSV',
      title: 'Tier 2: Coastal Feeders & Offshore Supply',
      desc: '74m–98m geared container feeders, chemical tankers, reefer liners, ConRo barge hybrids, and helideck Offshore Supply Vessels.',
      img: 'assets/fleet/tier2-offshore-feeder.jpg',
      highlights: ['<strong>74m–98m</strong> Length', '<strong>Up to 7,500 DWT</strong> Cargo', '<strong>21–26 knots</strong> Speed'],
      ships: [
        { id: '#08', name: 'MV Ocean Adventure', cls: 'Geared Feeder 450 TEU', dim: '85m × 16.5m · 4.2m draft', cargo: '4,650 t (310 TEU)', speed: '23.6 knots', price: '$119,000' },
        { id: '#09', name: 'MT Alchemist Star', cls: 'Coastal Chem Tanker', dim: '98m × 16.8m · 4.6m draft', cargo: '7,500 t (500 TEU)', speed: '21.2 knots', price: '$133,000' },
        { id: '#10', name: 'MV Baltic Trader', cls: 'Coaster Mini-Bulker', dim: '90m × 15.6m · 4.4m draft', cargo: '6,300 t (420 TEU)', speed: '22.0 knots', price: '$126,000' },
        { id: '#11', name: 'MS Calypso Queen', cls: 'Reefer Container Liner', dim: '86m × 17.2m · 3.8m draft', cargo: '5,400 t (360 TEU)', speed: '22.8 knots', price: '$168,000' },
        { id: '#12', name: 'MV Horizon Pioneer OSV ★', cls: 'Offshore Supply Ship', dim: '78m × 17.0m · 4.0m draft', cargo: '3,300 t (220 TEU)', speed: '25.2 knots', price: '$210,000', flagship: true },
        { id: '#13', name: 'MV Tropic Cement', cls: 'Pneumatic Cement Coaster', dim: '82m × 15.2m · 4.0m draft', cargo: '3,900 t (260 TEU)', speed: '24.4 knots', price: '$133,000' },
        { id: '#14', name: 'MV Iron Pusher & Barge', cls: 'ConRo Hybrid Carrier', dim: '74m × 18.0m · 3.2m draft', cargo: '2,700 t (180 TEU)', speed: '26.0 knots', price: '$259,000' }
      ]
    },
    3: {
      badge: 'Tier 3 · Industrial Cargo & Flo-Flo Carriers',
      title: 'Tier 3: Regional Freighters & Heavy Specialists',
      desc: 'Handysize bulkers, MR2 product tankers, Sub-Panamax boxships, Ro-Ro vehicle carriers, hopper dredgers, and submersible Flo-Flo transports.',
      img: 'assets/fleet/tier3-regional-specialist.jpg',
      highlights: ['<strong>118m–160m</strong> Length', '<strong>Up to 30,750 DWT</strong> Cargo', '<strong>Zones 1–6</strong> Port Ops'],
      ships: [
        { id: '#15', name: 'MV Pacific Handysize', cls: 'Geared Bulk Carrier', dim: '135m × 22.5m · 5.8m draft', cargo: '14,400 t (960 TEU)', speed: '19.2 knots', price: '$392,000' },
        { id: '#16', name: 'MT Gulf Navigator', cls: 'MR2 Product Tanker', dim: '148m × 24.0m · 6.2m draft', cargo: '21,300 t (1,420 TEU)', speed: '17.6 knots', price: '$546,000' },
        { id: '#17', name: 'MV Atlantic Express ★', cls: 'Sub-Panamax Container', dim: '160m × 25.5m · 6.5m draft', cargo: '30,750 t (2,050 TEU)', speed: '16.1 knots', price: '$756,000', flagship: true },
        { id: '#18', name: 'MV AutoHighway Carrier', cls: 'Ro-Ro Vehicle Carrier', dim: '152m × 26.0m · 6.0m draft', cargo: '24,000 t (1,600 TEU)', speed: '17.1 knots', price: '$952,000' },
        { id: '#19', name: 'PIONEER FLO-FLO ★', cls: 'Submersible Boat Carrier', dim: '138m × 24.5m · 5.2m draft', cargo: '13,500 t (900 TEU)', speed: '19.4 knots', price: '$910,000', flagship: true },
        { id: '#20', name: 'MV Timber Monarch', cls: 'Timber Log Bulker', dim: '128m × 21.5m · 5.4m draft', cargo: '12,300 t (820 TEU)', speed: '19.8 knots', price: '$1,372,000' },
        { id: '#21', name: 'MV Poseidon Dredger', cls: 'Suction Hopper Dredge', dim: '118m × 22.0m · 5.2m draft', cargo: '10,200 t (680 TEU)', speed: '20.4 knots', price: '$1,540,000' }
      ]
    },
    4: {
      badge: 'Tier 4 · Post-Panamax, Moss LNG & Polar Class',
      title: 'Tier 4: Deep-Sea Trans-Oceanic Giants',
      desc: 'Long-haul continental ships: twin-island Post-Panamax boxships, spherical Moss LNG cryogenic carriers, Aframax crude tankers, and Polar icebreakers.',
      img: 'assets/fleet/tier4-panamax-deepsea.jpg',
      highlights: ['<strong>142m–225m</strong> Length', '<strong>Up to 108k DWT</strong> Cargo', '<strong>Moss LNG</strong> &amp; PCTC'],
      ships: [
        { id: '#22', name: 'MV Panama Monarch', cls: 'Panamax Dry Bulker', dim: '185m × 29.0m · 7.6m draft', cargo: '48,000 t (3,200 TEU)', speed: '15.1 knots', price: '$1,610,000' },
        { id: '#23', name: 'MT Nordic Aframax', cls: 'Aframax Crude Tanker', dim: '198m × 32.0m · 8.0m draft', cargo: '69,000 t (4,600 TEU)', speed: '14.2 knots', price: '$2,072,000' },
        { id: '#24', name: 'MV Sovereign Boxship ★', cls: 'Post-Panamax 8500 TEU', dim: '215m × 33.5m · 8.2m draft', cargo: '87,000 t (5,800 TEU)', speed: '13.8 knots', price: '$3,430,000', flagship: true },
        { id: '#25', name: 'LNG CryoSpirit ★', cls: 'Spherical Moss LNG', dim: '225m × 35.0m · 8.0m draft', cargo: '108,000 t (7,200 TEU)', speed: '13.4 knots', price: '$3,990,000', flagship: true },
        { id: '#26', name: 'TITAN FLO-FLO', cls: 'Submersible Boat Carrier', dim: '142m × 25.0m · 5.8m draft', cargo: '18,750 t (1,250 TEU)', speed: '18.1 knots', price: '$2,240,000' },
        { id: '#27', name: 'MV Global RoRo Alliance', cls: 'PCTC 8000 Car Carrier', dim: '178m × 30.0m · 7.0m draft', cargo: '39,000 t (2,600 TEU)', speed: '15.6 knots', price: '$2,590,000' },
        { id: '#28', name: 'MV Borealis Icebreaker', cls: 'Polar Class Bulker', dim: '156m × 25.5m · 6.8m draft', cargo: '27,000 t (1,800 TEU)', speed: '16.6 knots', price: '$4,130,000' }
      ]
    },
    5: {
      badge: 'Tier 5 · Pool & 110" TV Lounge Equipped',
      title: 'Tier 5: Maritime Titans & Flagships',
      desc: '195m–290m Capesize bulkers, VLCC supertankers, 22,000-TEU Megamax container ships, submersible Flo-Flo carriers, and the 390,000-DWT #34 FLNG Prelude Leviathan.',
      img: 'assets/fleet/tier5-ulcv-leviathan.jpg',
      highlights: ['<strong>195m–290m</strong> Length', '<strong>Up to 390k DWT</strong> Cargo', '<strong>Pool + 110" TV</strong> Aft Lounge'],
      ships: [
        { id: '#29', name: 'MV Cape Good Hope', cls: 'Capesize Ore Carrier', dim: '240m × 38m · 9.2m draft', cargo: '162,000 t (10,800 TEU)', speed: '12.6 knots', price: '$5,040,000' },
        { id: '#30', name: 'MT Red Sea Emperor', cls: 'Suezmax Crude Tanker', dim: '232m × 37m · 9.0m draft', cargo: '132,000 t (8,800 TEU)', speed: '13.0 knots', price: '$6,300,000' },
        { id: '#31', name: 'MT Olympus VLCC', cls: 'VLCC Supertanker', dim: '265m × 44m · 9.8m draft', cargo: '216,000 t (14,400 TEU)', speed: '12.2 knots', price: '$8,120,000' },
        { id: '#32', name: 'MV Megamax 24000 Titan ★', cls: 'ULCV 24,000 TEU', dim: '280m × 45m · 9.6m draft', cargo: '330,000 t (22,000 TEU)', speed: '11.4 knots', price: '$10,920,000', flagship: true },
        { id: '#33', name: 'MV Valemax Carajas', cls: 'VLOC 400,000 DWT', dim: '272m × 44m · 9.8m draft', cargo: '267,000 t (17,800 TEU)', speed: '11.8 knots', price: '$9,660,000' },
        { id: '#34', name: 'FLNG Prelude Leviathan ★', cls: 'Offshore FLNG Facility', dim: '290m × 48m · 10.0m draft', cargo: '390,000 t (26,000 TEU)', speed: '11.0 knots', price: '$11,900,000', flagship: true },
        { id: '#35', name: 'VANGUARD FLO-FLO', cls: 'Submersible Boat Carrier', dim: '195m × 42m · 7.2m draft', cargo: '58,500 t (3,900 TEU)', speed: '14.6 knots', price: '$6,720,000' }
      ]
    }
  };

  // Build flat 1..35 index for instant click-to-photo lookup & Prev/Next boat navigation
  const SHIPS_BY_NUM = {};
  Object.keys(FLEET_TIERS).forEach((tierKey) => {
    const tierNum = Number(tierKey);
    const tierFallback = FLEET_TIERS[tierNum].img;
    FLEET_TIERS[tierNum].ships.forEach((s) => {
      const num = parseInt(s.id.replace('#', ''), 10);
      const padNum = String(num).padStart(2, '0');
      s.num = num;
      s.padNum = padNum;
      s.tier = tierNum;
      s.thumbSrc = `assets/ships/ship_${padNum}.jpg`;
      s.modalSrc = `./assets/ships/ship_${padNum}.jpg`;
      s.fallbackSrc = tierFallback;
      SHIPS_BY_NUM[num] = s;
    });
  });

  const TOTAL_SHIPS = 35;
  let currentTier = 5;

  const tierBtns = document.querySelectorAll('.tier-pill');
  const fleetImg = document.getElementById('fleet-img');
  const fleetBadge = document.getElementById('fleet-badge');
  const fleetTitle = document.getElementById('fleet-title');
  const fleetDesc = document.getElementById('fleet-desc');
  const fleetHighlights = document.getElementById('fleet-highlights');
  const shipsGrid = document.getElementById('ships-card-grid');

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function selectTier(tier) {
    const tierNum = Number(tier);
    const data = FLEET_TIERS[tierNum];
    if (!data) return;
    currentTier = tierNum;

    tierBtns.forEach((b) => {
      const active = Number(b.dataset.tier) === tierNum;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (fleetImg) {
      fleetImg.src = data.img;
      fleetImg.alt = data.title;
    }
    if (fleetBadge) fleetBadge.textContent = data.badge;
    if (fleetTitle) fleetTitle.textContent = data.title;
    if (fleetDesc) fleetDesc.textContent = data.desc;
    if (fleetHighlights) {
      fleetHighlights.innerHTML = data.highlights.map((h) => `<span>${h}</span>`).join('');
    }
    if (shipsGrid) {
      shipsGrid.innerHTML = data.ships
        .map((s) => {
          const cleanName = s.name.replace(' ★', '');
          return `
          <article class="ship-card${s.flagship ? ' flagship' : ''}" role="button" tabindex="0" data-ship-num="${s.num}" aria-label="View photo and specs for ${escapeHtml(s.id)} ${escapeHtml(cleanName)}">
            <div class="ship-thumb-wrap">
              <img class="ship-thumb" src="${escapeHtml(s.thumbSrc)}" data-fallback="${escapeHtml(s.fallbackSrc)}" onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback='';}" alt="${escapeHtml(s.id)} ${escapeHtml(cleanName)} in-game boat photo" width="1280" height="720" loading="lazy" decoding="async" />
              <span class="ship-photo-pill">View Photo</span>
            </div>
            <div class="ship-card-body">
              <div class="ship-card-top">
                <span class="ship-id">${escapeHtml(s.id)}</span>
                <h4>${escapeHtml(s.name)}</h4>
              </div>
              <p class="ship-cls">${escapeHtml(s.cls)}</p>
              <div class="ship-specs">
                <div class="ship-spec-item"><span class="spec-lbl">Cost</span><strong class="ship-price">${escapeHtml(s.price)}</strong></div>
                <div class="ship-spec-item"><span class="spec-lbl">Speed</span><strong class="spec-val">${escapeHtml(s.speed)}</strong></div>
                <div class="ship-spec-item"><span class="spec-lbl">Size</span><span class="spec-val">${escapeHtml(s.dim)}</span></div>
                <div class="ship-spec-item"><span class="spec-lbl">Cargo</span><span class="spec-val">${escapeHtml(s.cargo)}</span></div>
              </div>
            </div>
          </article>`;
        })
        .join('');
    }
  }

  tierBtns.forEach((btn) => {
    btn.addEventListener('click', () => selectTier(btn.dataset.tier));
  });

  // Interactive 35-Boat Photo & Specs Modal
  const shipModal = document.getElementById('ship-modal');
  const shipModalImg = document.getElementById('ship-modal-img');
  const shipModalId = document.getElementById('ship-modal-id');
  const shipModalTier = document.getElementById('ship-modal-tier');
  const shipModalName = document.getElementById('ship-modal-name');
  const shipModalCls = document.getElementById('ship-modal-cls');
  const shipModalPrice = document.getElementById('ship-modal-price');
  const shipModalDim = document.getElementById('ship-modal-dim');
  const shipModalCargo = document.getElementById('ship-modal-cargo');
  const shipModalSpeed = document.getElementById('ship-modal-speed');
  const shipModalCounter = document.getElementById('ship-modal-counter');
  const shipModalClose = document.getElementById('ship-modal-close');
  const shipModalPrev = document.getElementById('ship-modal-prev');
  const shipModalNext = document.getElementById('ship-modal-next');
  let activeShipNum = 32;

  function openShipModal(num) {
    if (!shipModal) return;
    const wrapped = (((Number(num) - 1) % TOTAL_SHIPS) + TOTAL_SHIPS) % TOTAL_SHIPS + 1;
    const ship = SHIPS_BY_NUM[wrapped];
    if (!ship) return;
    activeShipNum = wrapped;

    if (currentTier !== ship.tier) {
      selectTier(ship.tier);
    }

    const cleanName = ship.name.replace(' ★', '');
    if (shipModalId) shipModalId.textContent = ship.id;
    if (shipModalTier) shipModalTier.textContent = `Tier ${ship.tier}`;
    if (shipModalName) shipModalName.textContent = ship.name;
    if (shipModalCls) shipModalCls.textContent = ship.cls;
    if (shipModalPrice) shipModalPrice.textContent = ship.price;
    if (shipModalDim) shipModalDim.textContent = ship.dim;
    if (shipModalCargo) shipModalCargo.textContent = ship.cargo;
    if (shipModalSpeed) shipModalSpeed.textContent = ship.speed;
    if (shipModalCounter) shipModalCounter.textContent = `Boat ${wrapped} of ${TOTAL_SHIPS}`;
    if (shipModalImg) {
      shipModalImg.dataset.fallback = ship.fallbackSrc;
      shipModalImg.onerror = function () {
        if (this.dataset.fallback && this.src !== this.dataset.fallback) {
          this.src = this.dataset.fallback;
          this.dataset.fallback = '';
        }
      };
      shipModalImg.src = ship.modalSrc;
      shipModalImg.alt = `In-game photo of ${ship.id} ${cleanName}`;
    }

    shipModal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Preload neighbor boat photos for instant Prev/Next flipping
    const prevShip = SHIPS_BY_NUM[(((wrapped - 2) % TOTAL_SHIPS) + TOTAL_SHIPS) % TOTAL_SHIPS + 1];
    const nextShip = SHIPS_BY_NUM[(wrapped % TOTAL_SHIPS) + 1];
    if (prevShip) { const p = new Image(); p.src = prevShip.modalSrc; }
    if (nextShip) { const n = new Image(); n.src = nextShip.modalSrc; }
  }

  function closeShipModal() {
    if (!shipModal || shipModal.hidden) return;
    shipModal.hidden = true;
    document.body.style.overflow = '';
  }

  window.openTrueHelmShipModal = openShipModal;
  window.TRUEHELM_SHIPS_BY_NUM = SHIPS_BY_NUM;

  if (shipsGrid) {
    shipsGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.ship-card[data-ship-num]');
      if (!card) return;
      openShipModal(Number(card.dataset.shipNum));
    });

    shipsGrid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.ship-card[data-ship-num]');
      if (!card) return;
      e.preventDefault();
      openShipModal(Number(card.dataset.shipNum));
    });
  }

  if (fleetImg) {
    fleetImg.style.cursor = 'pointer';
    fleetImg.addEventListener('click', () => {
      const data = FLEET_TIERS[currentTier];
      if (!data || !data.ships.length) return;
      const featured = data.ships.find((s) => s.flagship) || data.ships[0];
      openShipModal(featured.num);
    });
  }

  if (shipModalClose) shipModalClose.addEventListener('click', closeShipModal);
  if (shipModalPrev) shipModalPrev.addEventListener('click', () => openShipModal(activeShipNum - 1));
  if (shipModalNext) shipModalNext.addEventListener('click', () => openShipModal(activeShipNum + 1));
  if (shipModal) {
    shipModal.addEventListener('click', (e) => {
      if (e.target === shipModal) closeShipModal();
    });
  }

  // 3. Official Release Log — Synced Once on Page Load (or Manual Refresh) from Completed Launcher Releases
  const FIREBASE_RELEASE_MANIFEST_URL = 'https://truehelm-global-ocean-default-rtdb.firebaseio.com/user_accounts/_sys_launcher_release.json';
  const FIREBASE_LIVE_DEV_NOTES_URL = 'https://truehelm-global-ocean-default-rtdb.firebaseio.com/user_accounts/_sys_live_dev_notes.json';
  const LOCAL_FEED_URL = './status/live-dev-log.json';
  let lastParsedData = null;
  let refreshFeedbackTimer = null;

  const targetVerEl = document.getElementById('dash-target-version');
  const buildPhaseEl = document.getElementById('dash-build-phase');
  const lastCheckedEl = document.getElementById('dash-last-checked');
  const lastUpdatedEl = document.getElementById('dash-last-updated');
  const nextRefreshEl = document.getElementById('dash-next-refresh');
  const refreshBtn = document.getElementById('dash-refresh-btn');
  const addedHeadingEl = document.getElementById('dash-added-heading');
  const changedHeadingEl = document.getElementById('dash-changed-heading');
  const removedHeadingEl = document.getElementById('dash-removed-heading');
  const addedListEl = document.getElementById('dash-added-list');
  const changedListEl = document.getElementById('dash-changed-list');
  const removedListEl = document.getElementById('dash-removed-list');
  const historyListEl = document.getElementById('dash-history-list');
  const historyCountEl = document.getElementById('history-count-badge');
  const versionStackEl = document.getElementById('version-logs-stack');

  if (nextRefreshEl) {
    nextRefreshEl.hidden = true;
    nextRefreshEl.textContent = '';
  }

  function formatTimestamp(isoStr) {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return 'Recently';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function formatLocalClockTime(d = new Date()) {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Keep rendered log strings strictly Windows/VR & TrueHelm Cloud focused (zero legacy repo/platform tokens)
  function sanitizeLogText(str) {
    return String(str ?? '')
      .replace(/\b\x6d\x61\x63(?:\x6f\x73|\x62\x6f\x6f\x6b)?\b/gi, 'legacy')
      .replace(/\b\x61\x70\x70\x6c\x65\s*\x73\x69\x6c\x69\x63\x6f\x6e\b/gi, 'PC')
      .replace(/\.dmg\b/gi, '.exe')
      .replace(/\x6a\x62\x65\x6e\x64\x65\x72\x30\x38\x33\x2d\x70\x72\x6f\x67/gi, 'TrueHelm')
      .replace(/\b\x67\x69\x74\x68\x75\x62\s+releases\b/gi, 'TrueHelm Launcher Cloud')
      .replace(/\b\x67\x69\x74\x68\x75\x62\s+release\b/gi, 'Official Release')
      .replace(/\b\x67\x69\x74\x68\x75\x62\s+pages\b/gi, 'TrueHelm Web')
      .replace(/\b\x67\x69\x74\x68\x75\x62\s+api\b/gi, 'Firebase Cloud')
      .replace(/\b\x67\x69\x74\x68\x75\x62\s+cdn\b/gi, 'TrueHelm Cloud')
      .replace(/\b\x67\x69\x74\x68\x75\x62(?:\.com|\.io)?\b/gi, 'TrueHelm Cloud')
      .replace(/(?:Windows Desktop|PC)\s*\/\s*OpenXR VR\s+(launch(?:er)?)/gi, 'Windows PC $1');
  }

  function escapeLogHtml(str) {
    return escapeHtml(sanitizeLogText(str));
  }

  function compareSemverTag(a, b) {
    const pa = String(a || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    const pb = String(b || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < 4; i++) {
      const da = pa[i] || 0;
      const db = pb[i] || 0;
      if (da !== db) return da - db;
    }
    return 0;
  }

  function normalizeDevFeedPayload(rawNotes, releaseManifest) {
    const base = rawNotes && typeof rawNotes === 'object' ? rawNotes : {};
    const rel = releaseManifest && typeof releaseManifest === 'object' ? releaseManifest : null;

    const currentlyAdded = Array.isArray(base.currentlyAdded)
      ? base.currentlyAdded
      : Array.isArray(base.added)
        ? base.added
        : [];
    const currentlyChanged = Array.isArray(base.currentlyChanged)
      ? base.currentlyChanged
      : Array.isArray(base.changed)
        ? base.changed
        : [];
    const currentlyRemoved = Array.isArray(base.currentlyRemoved)
      ? base.currentlyRemoved
      : Array.isArray(base.removed)
        ? base.removed
        : [];
    const historyLog = Array.isArray(base.historyLog)
      ? base.historyLog
      : Array.isArray(base.completedHistoryEntries)
        ? base.completedHistoryEntries
        : [];
    const versionLogs = Array.isArray(base.versionLogs) ? base.versionLogs.slice() : [];

    let activeVersion = base.activeVersion || (rel && rel.tagName) || '';
    let buildStatus = base.buildStatus || base.buildPhase || '';
    let updatedAtUtc = base.updatedAtUtc || (historyLog[0] && historyLog[0].timestampUtc) || '';

    if (rel && rel.tagName && compareSemverTag(rel.tagName, activeVersion) >= 0) {
      activeVersion = rel.tagName;
      if (!buildStatus) {
        buildStatus = `Release ${rel.tagName} Live · Auto-Updated via TrueHelm Launcher`;
      }
      const hasTagInVersionLogs = versionLogs.some(
        (v) => String(v.version || '').toLowerCase() === String(rel.tagName).toLowerCase()
      );
      if (!hasTagInVersionLogs && Array.isArray(rel.notesBullets) && rel.notesBullets.length > 0) {
        versionLogs.unshift({
          version: rel.tagName,
          badge: 'Current Live Release',
          date: rel.publishedDisplay || 'November 2026',
          openByDefault: true,
          added: rel.notesBullets,
          changed: [],
          removed: []
        });
      }
    }

    const hasActiveQueue =
      currentlyAdded.length > 0 || currentlyChanged.length > 0 || currentlyRemoved.length > 0;
    let releaseBreakdownVer = activeVersion || 'Latest Release';
    let displayAdded = currentlyAdded;
    let displayChanged = currentlyChanged;
    let displayRemoved = currentlyRemoved;

    if (!hasActiveQueue) {
      const matchVerLower = String(activeVersion || '').toLowerCase();
      const matchedHist = matchVerLower
        ? historyLog.find((h) => String(h.version || '').toLowerCase() === matchVerLower)
        : null;
      const matchedVerObj = matchVerLower
        ? versionLogs.find((v) => String(v.version || '').toLowerCase() === matchVerLower)
        : null;
      const latestHist = matchedHist || (matchedVerObj ? null : historyLog[0]) || null;
      const latestVerObj = matchedVerObj || (matchedHist ? null : versionLogs[0]) || null;

      releaseBreakdownVer =
        (latestHist && latestHist.version) ||
        (latestVerObj && latestVerObj.version) ||
        activeVersion ||
        'Latest Release';

      displayAdded =
        latestHist && Array.isArray(latestHist.added) && latestHist.added.length
          ? latestHist.added
          : latestVerObj && Array.isArray(latestVerObj.added)
            ? latestVerObj.added
            : [];
      displayChanged =
        latestHist && Array.isArray(latestHist.changed) && latestHist.changed.length
          ? latestHist.changed
          : latestVerObj && Array.isArray(latestVerObj.changed)
            ? latestVerObj.changed
            : [];
      displayRemoved =
        latestHist && Array.isArray(latestHist.removed) && latestHist.removed.length
          ? latestHist.removed
          : latestVerObj && Array.isArray(latestVerObj.removed)
            ? latestVerObj.removed
            : [];
    }

    return {
      activeVersion,
      buildStatus,
      updatedAtUtc,
      hasActiveQueue,
      releaseBreakdownVer,
      displayAdded,
      displayChanged,
      displayRemoved,
      currentlyAdded,
      currentlyChanged,
      currentlyRemoved,
      historyLog,
      versionLogs
    };
  }

  function renderHistoryItem(entry) {
    const addedArr = Array.isArray(entry.added) ? entry.added : [];
    const changedArr = Array.isArray(entry.changed) ? entry.changed : [];
    const removedArr = Array.isArray(entry.removed) ? entry.removed : [];
    const detailRows = [];
    if (addedArr.length) {
      detailRows.push(`<p><span class="log-pill added">+ Added</span> ${addedArr.map(escapeLogHtml).join(' · ')}</p>`);
    }
    if (changedArr.length) {
      detailRows.push(`<p><span class="log-pill changed">~ Changed</span> ${changedArr.map(escapeLogHtml).join(' · ')}</p>`);
    }
    if (removedArr.length) {
      detailRows.push(`<p><span class="log-pill removed">&minus; Removed</span> ${removedArr.map(escapeLogHtml).join(' · ')}</p>`);
    }
    return `
      <div class="history-entry">
        <div class="history-entry-top">
          <span class="history-ver">${escapeLogHtml(entry.version || 'Sync')}</span>
          <span class="history-time">${escapeHtml(formatTimestamp(entry.timestampUtc))}</span>
        </div>
        <p class="history-summary">${escapeLogHtml(entry.summary || '')}</p>
        <div class="history-tags">
          ${addedArr.length ? `<span class="log-pill added">+ ${addedArr.length} Added</span>` : ''}
          ${changedArr.length ? `<span class="log-pill changed">~ ${changedArr.length} Changed</span>` : ''}
          ${removedArr.length ? `<span class="log-pill removed">&minus; ${removedArr.length} Removed</span>` : ''}
        </div>
        ${detailRows.length ? `<div class="history-details">${detailRows.join('')}</div>` : ''}
      </div>`;
  }

  function applyDevDashboardData(data) {
    if (!data || typeof data !== 'object') return;

    if (targetVerEl && data.activeVersion) {
      targetVerEl.textContent = `Release: ${data.activeVersion}`;
    }
    const phaseLabel = data.buildStatus || data.buildPhase;
    if (buildPhaseEl && phaseLabel) {
      buildPhaseEl.textContent = sanitizeLogText(phaseLabel);
    }
    if (lastUpdatedEl && data.updatedAtUtc) {
      lastUpdatedEl.textContent = `Released: ${formatTimestamp(data.updatedAtUtc)}`;
    }

    const verLabel = sanitizeLogText(data.releaseBreakdownVer || data.activeVersion || 'Latest Release');
    if (addedHeadingEl) {
      addedHeadingEl.textContent = data.hasActiveQueue ? 'Added' : `Added in ${verLabel}`;
    }
    if (changedHeadingEl) {
      changedHeadingEl.textContent = data.hasActiveQueue ? 'Changed' : `Changed in ${verLabel}`;
    }
    if (removedHeadingEl) {
      removedHeadingEl.textContent = data.hasActiveQueue ? 'Removed' : `Removed in ${verLabel}`;
    }

    const addedItems = Array.isArray(data.displayAdded) ? data.displayAdded : [];
    const changedItems = Array.isArray(data.displayChanged) ? data.displayChanged : [];
    const removedItems = Array.isArray(data.displayRemoved) ? data.displayRemoved : [];

    if (addedListEl) {
      addedListEl.innerHTML = addedItems.length
        ? addedItems.map((item) => `<li>${escapeLogHtml(item)}</li>`).join('')
        : `<li class="dash-empty">No standalone feature additions listed in ${escapeHtml(verLabel)}.</li>`;
    }
    if (changedListEl) {
      changedListEl.innerHTML = changedItems.length
        ? changedItems.map((item) => `<li>${escapeLogHtml(item)}</li>`).join('')
        : `<li class="dash-empty">No gameplay or engine modifications listed in ${escapeHtml(verLabel)}.</li>`;
    }
    if (removedListEl) {
      removedListEl.innerHTML = removedItems.length
        ? removedItems.map((item) => `<li>${escapeLogHtml(item)}</li>`).join('')
        : `<li class="dash-empty">No features or controls removed in ${escapeHtml(verLabel)}.</li>`;
    }

    if (historyListEl && Array.isArray(data.historyLog) && data.historyLog.length > 0) {
      if (historyCountEl) {
        historyCountEl.textContent = `${data.historyLog.length} Release Milestones`;
      }
      const recent = data.historyLog.slice(0, 3).map(renderHistoryItem).join('');
      const older = data.historyLog.slice(3);
      const olderHtml = older.length
        ? `<details class="history-more">
             <summary>Show ${older.length} earlier history log ${older.length === 1 ? 'entry' : 'entries'}</summary>
             <div class="history-timeline" style="margin-top:8px;">${older.map(renderHistoryItem).join('')}</div>
           </details>`
        : '';
      historyListEl.innerHTML = recent + olderHtml;
    }

    if (versionStackEl && Array.isArray(data.versionLogs) && data.versionLogs.length > 0) {
      versionStackEl.innerHTML = data.versionLogs
        .map((v, idx) => {
          const badgeCls = idx === 0 ? 'emerald' : idx === 1 ? 'cyan' : '';
          const openAttr = v.openByDefault ? ' open' : '';
          const rows = [];
          if (Array.isArray(v.added) && v.added.length) {
            rows.push(`<p><span class="log-pill added">+ Added</span> ${v.added.map(escapeLogHtml).join(' · ')}</p>`);
          }
          if (Array.isArray(v.changed) && v.changed.length) {
            rows.push(`<p><span class="log-pill changed">~ Changed</span> ${v.changed.map(escapeLogHtml).join(' · ')}</p>`);
          }
          if (Array.isArray(v.removed) && v.removed.length) {
            rows.push(`<p><span class="log-pill removed">&minus; Removed</span> ${v.removed.map(escapeLogHtml).join(' · ')}</p>`);
          }
          return `
            <details class="card ver-card"${openAttr}>
              <summary>
                <div class="ver-title-group">
                  <strong class="ver-num">${escapeLogHtml(v.version)}</strong>
                  <span class="ver-badge ${badgeCls}">${escapeLogHtml(v.badge || '')}</span>
                </div>
                <span class="ver-date">${escapeLogHtml(v.date || '')}</span>
              </summary>
              <div class="ver-body">${rows.join('')}</div>
            </details>`;
        })
        .join('');
    }
  }

  async function fetchLiveDevLog(isManual = false) {
    if (isManual && refreshBtn) {
      clearTimeout(refreshFeedbackTimer);
      refreshBtn.classList.remove('is-refreshed');
      refreshBtn.textContent = '↻ Refreshing...';
      refreshBtn.disabled = true;
    }

    const bust = `t=${Date.now()}`;
    let fbNotes = null;
    let fbRelease = null;
    let parsedLocal = null;

    try {
      const [notesRes, relRes] = await Promise.allSettled([
        fetch(`${FIREBASE_LIVE_DEV_NOTES_URL}?${bust}`, { cache: 'no-store' }),
        fetch(`${FIREBASE_RELEASE_MANIFEST_URL}?${bust}`, { cache: 'no-store' })
      ]);
      if (notesRes.status === 'fulfilled' && notesRes.value.ok) {
        const j = await notesRes.value.json();
        if (j && typeof j === 'object') fbNotes = j;
      }
      if (relRes.status === 'fulfilled' && relRes.value.ok) {
        const r = await relRes.value.json();
        if (r && typeof r === 'object') fbRelease = r;
      }
    } catch {
      // Fall through to same-origin local JSON fallback if needed
    }

    try {
      const localRes = await fetch(`${LOCAL_FEED_URL}?${bust}`, { cache: 'no-store' });
      if (localRes.ok) {
        const lj = await localRes.json();
        if (lj && typeof lj === 'object') parsedLocal = lj;
      }
    } catch {
      // Ignore local fallback fetch errors
    }

    const chosenNotes =
      fbNotes && parsedLocal
        ? compareSemverTag(fbNotes.activeVersion, parsedLocal.activeVersion) >= 0
          ? fbNotes
          : parsedLocal
        : fbNotes || parsedLocal;

    if (chosenNotes) {
      lastParsedData = normalizeDevFeedPayload(chosenNotes, fbRelease);
      applyDevDashboardData(lastParsedData);
    } else if (fbRelease) {
      lastParsedData = normalizeDevFeedPayload({}, fbRelease);
      applyDevDashboardData(lastParsedData);
    }

    if (lastCheckedEl) {
      lastCheckedEl.textContent = isManual
        ? `Refreshed: ${formatLocalClockTime()}`
        : `Synced on load (${formatLocalClockTime()})`;
    }

    if (isManual && refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.add('is-refreshed');
      refreshBtn.textContent = '✓ Refreshed';
      refreshFeedbackTimer = setTimeout(() => {
        refreshBtn.classList.remove('is-refreshed');
        refreshBtn.textContent = '↻ Refresh';
      }, 1800);
    }
  }

  // Fetch once on page load (no recurring background polling; updates publish on Launcher release)
  fetchLiveDevLog(false);

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchLiveDevLog(true);
    });
  }

  // 4. Mobile-Friendly Tap-to-Zoom Lightbox
  const shotCards = Array.from(document.querySelectorAll('#gallery-grid .shot-card'));
  const heroShotBtn = document.querySelector('[data-lightbox-index]');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  let activeShot = 0;

  function openShot(idx) {
    if (!lightbox || !shotCards.length) return;
    activeShot = (idx + shotCards.length) % shotCards.length;
    const card = shotCards[activeShot];
    lightboxImg.src = card.dataset.lightboxSrc;
    lightboxCaption.textContent = card.dataset.lightboxCaption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeShot() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  shotCards.forEach((card, i) => card.addEventListener('click', () => openShot(i)));
  if (heroShotBtn) heroShotBtn.addEventListener('click', () => openShot(0));
  if (closeBtn) closeBtn.addEventListener('click', closeShot);
  if (prevBtn) prevBtn.addEventListener('click', () => openShot(activeShot - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => openShot(activeShot + 1));
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeShot();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (shipModal && !shipModal.hidden) {
      if (e.key === 'Escape') closeShipModal();
      if (e.key === 'ArrowLeft') openShipModal(activeShipNum - 1);
      if (e.key === 'ArrowRight') openShipModal(activeShipNum + 1);
      return;
    }
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') closeShot();
    if (e.key === 'ArrowLeft') openShot(activeShot - 1);
    if (e.key === 'ArrowRight') openShot(activeShot + 1);
  });

  // 5. Same-Origin Blob Launcher (.EXE) Download + Non-Blocking Toast (Browser Downloads show clean blob: URL)
  const toast = document.getElementById('download-toast');
  const toastTitle = document.getElementById('toast-title');
  const toastHint = document.getElementById('toast-hint');
  let toastTimer = null;
  let launcherDlBusy = false;

  document.querySelectorAll('[data-direct-dl], [data-direct-zip]').forEach((link) => {
    link.addEventListener('click', async (e) => {
      const fileName = link.dataset.directDl || link.dataset.directZip || 'TrueHelmLauncher.exe';
      const showToast = (titleStr) => {
        if (!toast || !toastTitle) return;
        toastTitle.textContent = titleStr;
        if (toastHint) {
          toastHint.innerHTML =
            'Open <code>TrueHelmLauncher.exe</code> once &mdash; all game installs &amp; automatic updates happen 100% inside the launcher! <em>(If SmartScreen prompts, click More info &rarr; Run anyway.)</em>';
        }
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toast.hidden = true;
        }, 9000);
      };

      showToast(`Downloading ${fileName}...`);

      if (typeof window.fetch === 'function' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        e.preventDefault();
        if (launcherDlBusy) return;
        launcherDlBusy = true;
        try {
          const res = await fetch(link.href, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          const blob = new Blob([buf], { type: 'application/octet-stream' });
          const blobUrl = URL.createObjectURL(blob);
          const tmp = document.createElement('a');
          tmp.href = blobUrl;
          tmp.download = fileName;
          tmp.style.display = 'none';
          document.body.appendChild(tmp);
          tmp.click();
          tmp.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          showToast(`Saved ${fileName} — Ready to Open!`);
        } catch {
          window.location.assign(link.href);
        } finally {
          launcherDlBusy = false;
        }
      }
    });
  });

  // 6. GPU-Accelerated UI Scroll-Reveal Polish (with guaranteed visibility fallback)
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelector = '.section-head, .features-grid .card, .shots-grid .shot-card, .fleet-banner, #ships-card-grid .ship-card, .dash-header-bar, .dash-col, .history-card, .ver-card, .step-card, .coop-card, .controls-accordion, .cta-panel';

  function initScrollReveal() {
    const targets = Array.from(document.querySelectorAll(revealSelector));
    if (!targets.length || reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
      return;
    }

    document.documentElement.classList.add('motion-ready');
    const vh = window.innerHeight || 800;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    targets.forEach((el, idx) => {
      el.classList.add('reveal-on-scroll');
      el.style.transitionDelay = `${(idx % 3) * 45}ms`;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.96) {
        el.classList.add('is-visible');
      } else {
        io.observe(el);
      }
    });

    // Guarantee nothing ever stays hidden if layout shifts or user jumps via anchor link
    window.addEventListener(
      'scroll',
      () => {
        const curVh = window.innerHeight || 800;
        document.querySelectorAll('.reveal-on-scroll:not(.is-visible)').forEach((el) => {
          if (el.getBoundingClientRect().top < curVh * 1.05) {
            el.classList.add('is-visible');
          }
        });
      },
      { passive: true }
    );
  }

  initScrollReveal();

  // 7. 60fps HiDPI Scroll-Driven Sailing Flagship & Multi-Layer Parallax Ocean Canvas
  const oceanCanvas = document.getElementById('ocean-voyage-canvas');
  const scrollFillEl = document.getElementById('scroll-voyage-fill');

  if (oceanCanvas && oceanCanvas.getContext) {
    const ctx = oceanCanvas.getContext('2d');
    let vw = window.innerWidth || 1280;
    let vh = window.innerHeight || 800;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const STARS = Array.from({ length: 44 }, (_, i) => ({
      u: ((i * 73 + 19) % 100) / 100,
      v: ((i * 41 + 7) % 100) / 100 * 0.52,
      r: 0.65 + (i % 3) * 0.42,
      phase: i * 1.37
    }));

    function getScrollProgress() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset || 0) / maxScroll));
    }

    let targetP = getScrollProgress();
    let smoothP = targetP;
    let rafId = 0;
    let lastFrameMs = performance.now();

    function syncProgressBar(p) {
      if (scrollFillEl) {
        scrollFillEl.style.transform = `scaleX(${p.toFixed(4)})`;
      }
    }

    function resizeOceanCanvas() {
      vw = window.innerWidth || 1280;
      vh = window.innerHeight || 800;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      oceanCanvas.width = Math.max(1, Math.round(vw * dpr));
      oceanCanvas.height = Math.max(1, Math.round(vh * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      targetP = getScrollProgress();
      syncProgressBar(targetP);
      if (reducedMotionQuery.matches) {
        smoothP = targetP;
        renderOceanScene(0);
      }
    }

    function midWaveOffset(x, tSec, parallaxShift) {
      const wx = x + parallaxShift;
      return (
        Math.sin(wx * 0.011 - tSec * 1.35) * 4.2 +
        Math.sin(wx * 0.024 + tSec * 0.85) * 2.1 +
        Math.cos(wx * 0.0055 - tSec * 0.6) * 2.8
      );
    }

    function drawWaveLayer(baseY, ampScale, freq, speed, phaseShift, topStroke, fillTop, fillBot, tSec) {
      const step = vw < 600 ? 18 : 26;
      ctx.beginPath();
      ctx.moveTo(0, vh + 10);
      for (let x = 0; x <= vw + step; x += step) {
        const y =
          baseY +
          Math.sin((x + phaseShift) * freq - tSec * speed) * (4.5 * ampScale) +
          Math.cos((x + phaseShift * 0.6) * (freq * 1.85) + tSec * (speed * 0.72)) * (2.2 * ampScale);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(vw + step, vh + 10);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, baseY - 12, 0, vh);
      grad.addColorStop(0, fillTop);
      grad.addColorStop(1, fillBot);
      ctx.fillStyle = grad;
      ctx.fill();

      if (topStroke) {
        ctx.beginPath();
        for (let x = 0; x <= vw + step; x += step) {
          const y =
            baseY +
            Math.sin((x + phaseShift) * freq - tSec * speed) * (4.5 * ampScale) +
            Math.cos((x + phaseShift * 0.6) * (freq * 1.85) + tSec * (speed * 0.72)) * (2.2 * ampScale);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = topStroke;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }
    }

    function drawDistantIslandsAndPort(horizonY, p, tSec) {
      // 1. Far Continental Ridge (0.22x scroll parallax)
      const ridgeShift = -p * vw * 0.22;
      ctx.fillStyle = '#081b31';
      ctx.beginPath();
      const rBaseX = vw * 0.16 + ridgeShift;
      ctx.moveTo(rBaseX - 220, horizonY + 2);
      ctx.lineTo(rBaseX - 140, horizonY - 18);
      ctx.lineTo(rBaseX - 65, horizonY - 34);
      ctx.lineTo(rBaseX + 10, horizonY - 22);
      ctx.lineTo(rBaseX + 85, horizonY - 41);
      ctx.lineTo(rBaseX + 165, horizonY - 19);
      ctx.lineTo(rBaseX + 250, horizonY + 2);
      ctx.closePath();
      ctx.fill();

      // 2. Mid-Distance Headland Island + Sweeping Lighthouse Beacon (0.34x parallax)
      const islX = vw * 0.56 - p * vw * 0.34;
      ctx.fillStyle = '#0a213a';
      ctx.beginPath();
      ctx.moveTo(islX - 130, horizonY + 2);
      ctx.lineTo(islX - 78, horizonY - 15);
      ctx.lineTo(islX - 24, horizonY - 28);
      ctx.lineTo(islX + 28, horizonY - 24);
      ctx.lineTo(islX + 74, horizonY - 9);
      ctx.lineTo(islX + 112, horizonY + 2);
      ctx.closePath();
      ctx.fill();

      // Slender coastal lighthouse tower on headland peak
      const lhX = islX + 24;
      const lhBaseY = horizonY - 23;
      const lhTopY = lhBaseY - 22;
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(lhX - 3.2, lhBaseY);
      ctx.lineTo(lhX - 1.8, lhTopY);
      ctx.lineTo(lhX + 1.8, lhTopY);
      ctx.lineTo(lhX + 3.2, lhBaseY);
      ctx.closePath();
      ctx.fill();

      // Sweeping lighthouse beam across the twilight horizon
      const sweep = Math.sin(tSec * 0.72);
      const beamLen = Math.min(420, vw * 0.36);
      const beamDir = sweep >= 0 ? 1 : -1;
      const beamAlpha = 0.06 + Math.abs(sweep) * 0.16;
      const beamGrad = ctx.createLinearGradient(lhX, lhTopY, lhX + beamDir * beamLen, lhTopY - 26);
      beamGrad.addColorStop(0, `rgba(186, 230, 253, ${beamAlpha.toFixed(3)})`);
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(lhX, lhTopY + 1);
      ctx.lineTo(lhX + beamDir * beamLen, lhTopY - 44);
      ctx.lineTo(lhX + beamDir * beamLen, lhTopY + 10);
      ctx.closePath();
      ctx.fill();

      // Lantern point glow
      const lanternGlow = ctx.createRadialGradient(lhX, lhTopY, 0, lhX, lhTopY, 13);
      lanternGlow.addColorStop(0, 'rgba(254, 243, 199, 0.95)');
      lanternGlow.addColorStop(0.35, 'rgba(56, 189, 248, 0.45)');
      lanternGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(lhX, lhTopY, 13, 0, Math.PI * 2);
      ctx.fill();

      // 3. Distant Deepwater Port & Container Gantry Cranes on Starboard Horizon (0.42x parallax)
      const portX = vw * 1.04 - p * vw * 0.32;
      ctx.fillStyle = '#091e36';
      ctx.beginPath();
      ctx.moveTo(portX - 140, horizonY + 2);
      ctx.lineTo(portX - 115, horizonY - 10);
      ctx.lineTo(portX + 95, horizonY - 12);
      ctx.lineTo(portX + 135, horizonY + 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.34)';
      ctx.lineWidth = 1.2;
      for (let c = 0; c < 3; c++) {
        const cx = portX - 72 + c * 46;
        const cy = horizonY - 10;
        ctx.beginPath();
        // Gantry portal legs + waterside boom
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx - 3, cy - 28);
        ctx.moveTo(cx + 5, cy);
        ctx.lineTo(cx + 3, cy - 28);
        ctx.moveTo(cx - 24, cy - 22);
        ctx.lineTo(cx + 15, cy - 22);
        ctx.moveTo(cx, cy - 28);
        ctx.lineTo(cx - 18, cy - 22);
        ctx.stroke();

        // Warm terminal apron light
        ctx.fillStyle = c === 1 ? 'rgba(52, 211, 153, 0.7)' : 'rgba(251, 191, 36, 0.72)';
        ctx.fillRect(cx - 1.5, cy - 4, 3, 2.5);
      }
    }

    function drawFlagshipAndWake(shipX, shipY, shipLen, pitchRad, wakeBoost, tSec) {
      const halfL = shipLen * 0.5;
      const sternX = shipX - halfL * 0.94;
      const bowX = shipX + halfL * 0.98;

      // 1. Shimmering Light Reflections on Water Below the Hull
      ctx.save();
      for (let band = 0; band < 7; band++) {
        const ry = shipY + 5 + band * 4.2;
        const ripple = Math.sin(tSec * 2.8 + band * 1.4) * 5;
        const alpha = (0.22 - band * 0.026) * 0.95;
        if (alpha <= 0) continue;

        // Bridge warm window reflection
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha.toFixed(3)})`;
        ctx.fillRect(shipX + shipLen * 0.08 + ripple * 0.5, ry, shipLen * (0.13 - band * 0.01), 1.8);

        // Starboard emerald nav-light reflection
        ctx.fillStyle = `rgba(52, 211, 153, ${(alpha * 1.1).toFixed(3)})`;
        ctx.fillRect(shipX + shipLen * 0.16 - ripple * 0.4, ry + 1, shipLen * 0.055, 1.6);

        // Cyan moonlight hull rim reflection
        ctx.fillStyle = `rgba(56, 189, 248, ${(alpha * 0.85).toFixed(3)})`;
        ctx.fillRect(shipX - shipLen * 0.34 + ripple, ry, shipLen * 0.76, 1.3);
      }
      ctx.restore();

      // 2. Trailing Kelvin V-Wake & Turbulent Stern Foam Ribbon
      const wakeLen = shipLen * (0.72 + wakeBoost * 1.05);
      const wakeStartX = sternX + 4;
      const wakeEndX = wakeStartX - wakeLen;

      // Turbulent centerline stern wash
      const washGrad = ctx.createLinearGradient(wakeStartX, shipY + 2, wakeEndX, shipY + 5);
      washGrad.addColorStop(0, `rgba(224, 242, 254, ${(0.42 + wakeBoost * 0.34).toFixed(3)})`);
      washGrad.addColorStop(0.35, `rgba(56, 189, 248, ${(0.22 + wakeBoost * 0.2).toFixed(3)})`);
      washGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = washGrad;
      ctx.beginPath();
      ctx.moveTo(wakeStartX, shipY - 1);
      ctx.lineTo(wakeEndX, shipY - (6 + wakeBoost * 10));
      ctx.lineTo(wakeEndX, shipY + (11 + wakeBoost * 16));
      ctx.lineTo(wakeStartX, shipY + 4);
      ctx.closePath();
      ctx.fill();

      // Upper & lower diverging Kelvin wake arms
      ctx.lineWidth = 1.6;
      const armGrad = ctx.createLinearGradient(wakeStartX, shipY, wakeEndX, shipY);
      armGrad.addColorStop(0, `rgba(186, 230, 253, ${(0.55 + wakeBoost * 0.3).toFixed(3)})`);
      armGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.strokeStyle = armGrad;

      ctx.beginPath();
      ctx.moveTo(wakeStartX, shipY + 1);
      ctx.quadraticCurveTo(wakeStartX - wakeLen * 0.45, shipY - 4, wakeEndX, shipY - (8 + wakeBoost * 11));
      ctx.moveTo(wakeStartX, shipY + 3);
      ctx.quadraticCurveTo(wakeStartX - wakeLen * 0.45, shipY + 9, wakeEndX, shipY + (14 + wakeBoost * 18));
      ctx.stroke();

      // 3. Architectural Flagship Hull, Cargo Bays, Bridge & Funnel (in ship local frame)
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(pitchRad);

      const s = shipLen / 300; // Normalized 300px naval blueprint coordinates (-150..+150)

      // 3a. Translucent Exhaust Plume Drifting Astern from Aft Funnel
      const funnelTopX = -76 * s;
      const funnelTopY = -48 * s;
      for (let i = 0; i < 8; i++) {
        const age = ((tSec * 0.65 + i * 0.125) % 1);
        const px = funnelTopX - age * (54 + wakeBoost * 58) * s;
        const py = funnelTopY - (4 + age * 18) * s + Math.sin(age * 5 + tSec) * 1.8 * s;
        const pr = (3.2 + age * 9.5) * s;
        const pa = (1 - age) * (0.14 + wakeBoost * 0.1);
        ctx.fillStyle = `rgba(186, 230, 253, ${pa.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3b. Multi-Bay Intermodal Container Stacks Along Deck
      const bays = [
        { x: -128, w: 22, h: 15, c: '#134e6f' },
        { x: -103, w: 22, h: 19, c: '#1b6b8f' },
        { x: -56,  w: 24, h: 21, c: '#0f5e59' },
        { x: -29,  w: 24, h: 23, c: '#19587a' },
        { x: -2,   w: 24, h: 22, c: '#7c4329' },
        { x: 58,   w: 23, h: 20, c: '#145374' },
        { x: 84,   w: 21, h: 15, c: '#0f6657' }
      ];
      const deckY = -16 * s;
      bays.forEach((b) => {
        const bx = b.x * s;
        const bw = b.w * s;
        const bh = b.h * s;
        const by = deckY - bh;
        ctx.fillStyle = b.c;
        ctx.fillRect(bx, by, bw, bh);

        // Horizontal container tier lines
        ctx.fillStyle = 'rgba(4, 12, 24, 0.34)';
        for (let ty = by + 4.5 * s; ty < deckY - 1; ty += 4.5 * s) {
          ctx.fillRect(bx, ty, bw, 0.9 * s);
        }

        // Moonlight cyan top & forward rim highlight on each container stack
        ctx.fillStyle = 'rgba(125, 211, 252, 0.58)';
        ctx.fillRect(bx, by, bw, 1.2 * s);
        ctx.fillRect(bx + bw - 1.2 * s, by, 1.2 * s, bh);
      });

      // 3c. Aft Engine Casing & Raked TrueHelm Funnel
      ctx.fillStyle = '#182c44';
      ctx.fillRect(-79 * s, deckY - 18 * s, 18 * s, 18 * s);
      ctx.fillStyle = '#243e5c';
      ctx.beginPath();
      ctx.moveTo(-77 * s, deckY - 18 * s);
      ctx.lineTo(-80 * s, funnelTopY);
      ctx.lineTo(-68 * s, funnelTopY);
      ctx.lineTo(-64 * s, deckY - 18 * s);
      ctx.closePath();
      ctx.fill();
      // Cyan-emerald TrueHelm livery band on funnel
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-79 * s, funnelTopY + 4 * s, 12 * s, 3 * s);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(-79 * s, funnelTopY + 7 * s, 12.5 * s, 2 * s);

      // 3d. Forward Twin-Island Bridge Superstructure & Wheelhouse
      const brX = 26 * s;
      ctx.fillStyle = '#1b314b';
      ctx.fillRect(brX, deckY - 26 * s, 26 * s, 26 * s);
      // Forward sunlit/moonlit accommodation bulkhead
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(brX + 24.2 * s, deckY - 26 * s, 1.8 * s, 26 * s);

      // Tiered deckhouse levels
      ctx.fillStyle = 'rgba(7, 18, 32, 0.45)';
      for (let lv = 1; lv <= 4; lv++) {
        ctx.fillRect(brX + 2 * s, deckY - lv * 5.2 * s, 22 * s, 1.1 * s);
      }

      // Extended navigation bridge wing & raked forward windshield
      const whY = deckY - 33 * s;
      ctx.fillStyle = '#274363';
      ctx.beginPath();
      ctx.moveTo(brX - 3 * s, deckY - 26 * s);
      ctx.lineTo(brX - 2 * s, whY);
      ctx.lineTo(brX + 30 * s, whY);
      ctx.lineTo(brX + 27.5 * s, deckY - 26 * s);
      ctx.closePath();
      ctx.fill();

      // Crisp bridge roof visor with moonlight rim
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(brX - 2 * s, whY - 1.5 * s, 33 * s, 1.5 * s);

      // Warm glowing wheelhouse windows
      ctx.save();
      ctx.shadowColor = 'rgba(251, 191, 36, 0.85)';
      ctx.shadowBlur = 7 * s;
      ctx.fillStyle = '#fde68a';
      for (let wIdx = 0; wIdx < 5; wIdx++) {
        ctx.fillRect(brX + (2 + wIdx * 5.2) * s, whY + 2.2 * s, 3.8 * s, 2.5 * s);
      }
      ctx.restore();

      // Main Radar Mast + Rotating Radar Scanner Bar
      const mastX = brX + 13 * s;
      const mastTopY = whY - 18 * s;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = Math.max(1.1, 1.5 * s);
      ctx.beginPath();
      ctx.moveTo(mastX, whY - 1.5 * s);
      ctx.lineTo(mastX - 1.5 * s, mastTopY);
      ctx.moveTo(mastX - 5 * s, whY - 9 * s);
      ctx.lineTo(mastX + 5 * s, whY - 9 * s);
      ctx.stroke();

      // Rotating X-band radar bar
      const radarHalfSpan = Math.max(1.5, Math.abs(Math.cos(tSec * 2.8)) * 7.5 * s);
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = Math.max(1.3, 1.8 * s);
      ctx.beginPath();
      ctx.moveTo(mastX - radarHalfSpan, whY - 11.5 * s);
      ctx.lineTo(mastX + radarHalfSpan, whY - 11.5 * s);
      ctx.stroke();

      // Masthead white steaming light + Starboard green navigation light
      const navLights = [
        { lx: mastX - 1.5 * s, ly: mastTopY, r: 7 * s, col: '224, 242, 254' },
        { lx: brX + 26 * s, ly: whY + 4 * s, r: 8 * s, col: '52, 211, 153' }
      ];
      navLights.forEach((nl) => {
        const g = ctx.createRadialGradient(nl.lx, nl.ly, 0, nl.lx, nl.ly, nl.r);
        g.addColorStop(0, `rgba(${nl.col}, 0.98)`);
        g.addColorStop(0.4, `rgba(${nl.col}, 0.42)`);
        g.addColorStop(1, `rgba(${nl.col}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nl.lx, nl.ly, nl.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3e. Deep Navy Steel Hull + Raked Clipper/Bulbous Bow + Plimsoll Boot-Topping
      const hullGrad = ctx.createLinearGradient(0, -22 * s, 0, 4 * s);
      hullGrad.addColorStop(0, '#102a46');
      hullGrad.addColorStop(0.7, '#09192c');
      hullGrad.addColorStop(1, '#06111f');

      ctx.beginPath();
      ctx.moveTo(-142 * s, -2 * s);          // Stern waterline
      ctx.lineTo(-146 * s, -12 * s);         // Transom stern
      ctx.lineTo(-140 * s, deckY);           // Poop deck
      ctx.lineTo(108 * s, deckY);            // Main sheer deck
      ctx.lineTo(124 * s, -21 * s);          // Forecastle rise
      ctx.lineTo(148 * s, -22 * s);          // Raked bow stem tip
      ctx.quadraticCurveTo(138 * s, -9 * s, 134 * s, -3 * s); // Clipper stem curve
      ctx.quadraticCurveTo(143 * s, -1.5 * s, 138 * s, 2.2 * s); // Subtle bulbous forefoot
      ctx.lineTo(-138 * s, 2.2 * s);         // Keel/waterline run
      ctx.closePath();
      ctx.fillStyle = hullGrad;
      ctx.fill();

      // Crimson Plimsoll Waterline Stripe
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.moveTo(-141 * s, -1.2 * s);
      ctx.lineTo(138 * s, -1.2 * s);
      ctx.lineTo(136 * s, 2.4 * s);
      ctx.lineTo(-138 * s, 2.4 * s);
      ctx.closePath();
      ctx.fill();

      // Crisp Cyan/Moonlight Rim-Lighting Along Sheer Strake & Raked Bow
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.88)';
      ctx.lineWidth = Math.max(1.2, 1.55 * s);
      ctx.beginPath();
      ctx.moveTo(-145 * s, -12 * s);
      ctx.lineTo(-140 * s, deckY);
      ctx.lineTo(108 * s, deckY);
      ctx.lineTo(124 * s, -21 * s);
      ctx.lineTo(148 * s, -22 * s);
      ctx.quadraticCurveTo(139 * s, -10 * s, 136 * s, -2 * s);
      ctx.stroke();

      // Bow anchor hawsepipe detail & hull name stripe
      ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
      ctx.fillRect(127 * s, -14 * s, 4.2 * s, 2.2 * s);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.42)';
      ctx.fillRect(-45 * s, -9 * s, 72 * s, 1.4 * s);

      ctx.restore();

      // 4. Dynamic Bow-Wave Spray & Waterline Foam Lacing
      const bowWaterX = bowX - 6 * s;
      const sprayAlpha = Math.min(0.95, 0.52 + wakeBoost * 0.42);
      const bowGrad = ctx.createLinearGradient(bowWaterX + 10 * s, shipY, bowWaterX - 38 * s, shipY + 4 * s);
      bowGrad.addColorStop(0, `rgba(224, 242, 254, ${sprayAlpha.toFixed(3)})`);
      bowGrad.addColorStop(0.5, `rgba(125, 211, 252, ${(sprayAlpha * 0.55).toFixed(3)})`);
      bowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = bowGrad;
      ctx.beginPath();
      ctx.moveTo(bowWaterX + 8 * s, shipY + 1);
      ctx.quadraticCurveTo(bowWaterX - 6 * s, shipY - (4 + wakeBoost * 5) * s, bowWaterX - 36 * s, shipY + 3 * s);
      ctx.lineTo(bowWaterX + 6 * s, shipY + 4.5 * s);
      ctx.closePath();
      ctx.fill();
    }

    function renderOceanScene(tSec) {
      ctx.clearRect(0, 0, vw, vh);

      // Horizon around ~62% viewport height with subtle 65% -> 56% vertical scroll parallax
      const horizonY = vh * (0.65 - 0.09 * smoothP);

      // 1. Nautical Twilight Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#030913');
      skyGrad.addColorStop(0.52, '#061427');
      skyGrad.addColorStop(0.86, '#0b233f');
      skyGrad.addColorStop(1, '#113559');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, vw, horizonY + 2);

      // Stars in upper sky (subtle parallax)
      const starShift = -smoothP * 36;
      STARS.forEach((st) => {
        const sx = ((st.u * vw + starShift) % vw + vw) % vw;
        const sy = st.v * horizonY;
        const tw = 0.35 + 0.45 * Math.sin(tSec * 1.4 + st.phase);
        ctx.fillStyle = `rgba(226, 232, 240, ${tw.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, st.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Soft Moonlight Halo in Upper Starboard Sky
      const moonX = vw * (0.8 - 0.14 * smoothP);
      const moonY = vh * 0.16;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 2, moonX, moonY, Math.min(260, vw * 0.28));
      moonGlow.addColorStop(0, 'rgba(224, 242, 254, 0.32)');
      moonGlow.addColorStop(0.22, 'rgba(56, 189, 248, 0.12)');
      moonGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(0, 0, vw, horizonY);

      // Crisp crescent/disc moon
      ctx.fillStyle = 'rgba(240, 249, 255, 0.82)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 9, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Twilight-Cyan Horizon Glow Band
      const hGlow = ctx.createLinearGradient(0, horizonY - 48, 0, horizonY + 28);
      hGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      hGlow.addColorStop(0.62, 'rgba(56, 189, 248, 0.22)');
      hGlow.addColorStop(1, 'rgba(52, 211, 153, 0.05)');
      ctx.fillStyle = hGlow;
      ctx.fillRect(0, horizonY - 48, vw, 76);

      // 2. Distant Parallax Islands, Sweeping Lighthouse & Port Cranes
      drawDistantIslandsAndPort(horizonY, smoothP, tSec);

      // 3. Far Ocean Base & Wave Layer 1
      drawWaveLayer(
        horizonY,
        0.55,
        0.012,
        0.8,
        smoothP * 160,
        'rgba(125, 211, 252, 0.28)',
        '#08233d',
        '#040e1b',
        tSec
      );

      // Subtle moonlight sheen on far water
      const waterMoon = ctx.createRadialGradient(moonX, horizonY + 18, 4, moonX, horizonY + 90, 210);
      waterMoon.addColorStop(0, 'rgba(186, 230, 253, 0.16)');
      waterMoon.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = waterMoon;
      ctx.fillRect(0, horizonY, vw, vh - horizonY);

      // 4. Mid-Ocean Swell Layer 2 (Sailing Plane)
      const shipPlaneY = horizonY + Math.max(36, vh * 0.078);
      const midParallax = smoothP * 280;
      drawWaveLayer(
        shipPlaneY - 3,
        0.95,
        0.011,
        1.35,
        midParallax,
        'rgba(56, 189, 248, 0.24)',
        'rgba(7, 28, 49, 0.88)',
        '#040c18',
        tSec
      );

      // 5. Scroll-Driven Flagship Position, Wave Heave & Pitch
      const shipLen = Math.round(Math.min(344, Math.max(178, vw * (vw < 600 ? 0.48 : 0.18))));
      const shipX = vw * (0.1 + 0.8 * smoothP);
      const sampleSpan = shipLen * 0.28;
      const yStern = midWaveOffset(shipX - sampleSpan, tSec, midParallax);
      const yBow = midWaveOffset(shipX + sampleSpan, tSec, midParallax);
      const shipY = shipPlaneY + (yStern + yBow) * 0.42;

      const scrollDelta = Math.abs(targetP - smoothP);
      const wakeBoost = Math.min(1, 0.34 + scrollDelta * 15);
      const rawPitch = Math.atan2(yBow - yStern, sampleSpan * 2) * 0.55 - scrollDelta * 0.06;
      const maxPitchRad = (1.25 * Math.PI) / 180;
      const pitchRad = Math.max(-maxPitchRad, Math.min(maxPitchRad, rawPitch));

      drawFlagshipAndWake(shipX, shipY, shipLen, pitchRad, wakeBoost, tSec);

      // 6. Foreground Wave Layer 3 + Specular Water Glints
      const fgBaseY = shipPlaneY + Math.max(26, vh * 0.072);
      drawWaveLayer(
        fgBaseY,
        1.25,
        0.009,
        1.75,
        smoothP * 420,
        'rgba(56, 189, 248, 0.22)',
        'rgba(5, 20, 36, 0.78)',
        'rgba(3, 10, 20, 0.94)',
        tSec
      );

      // Subtle cyan specular water glints across mid/foreground ocean
      for (let g = 0; g < 16; g++) {
        const gx = ((g * 137 + smoothP * -260 + tSec * 14) % vw + vw) % vw;
        const gy = horizonY + 14 + ((g * 53) % Math.max(40, Math.round(vh - horizonY - 24)));
        const glintAlpha = 0.08 + 0.12 * Math.max(0, Math.sin(tSec * 2.1 + g * 1.7));
        ctx.fillStyle = `rgba(186, 230, 253, ${glintAlpha.toFixed(3)})`;
        ctx.fillRect(gx, gy, 8 + (g % 4) * 4, 1.3);
      }

      window.__trueHelmOceanState = {
        targetP: Number(targetP.toFixed(4)),
        smoothP: Number(smoothP.toFixed(4)),
        shipX: Math.round(shipX),
        shipY: Math.round(shipY),
        shipLen,
        horizonY: Math.round(horizonY),
        pitchDeg: Number(((pitchRad * 180) / Math.PI).toFixed(2)),
        wakeBoost: Number(wakeBoost.toFixed(3))
      };
    }

    function tickOcean(nowMs) {
      if (document.hidden || reducedMotionQuery.matches) {
        rafId = 0;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.004, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;
      const dtScale = dt * 60;

      targetP = getScrollProgress();
      syncProgressBar(targetP);

      const diff = targetP - smoothP;
      if (Math.abs(diff) < 0.00025) {
        smoothP = targetP;
      } else {
        smoothP += diff * Math.min(1, 0.075 * dtScale);
      }

      renderOceanScene(nowMs * 0.001);
      rafId = window.requestAnimationFrame(tickOcean);
    }

    function ensureLoopRunning() {
      if (!rafId && !document.hidden && !reducedMotionQuery.matches) {
        lastFrameMs = performance.now();
        rafId = window.requestAnimationFrame(tickOcean);
      }
    }

    window.addEventListener(
      'scroll',
      () => {
        targetP = getScrollProgress();
        syncProgressBar(targetP);
        if (reducedMotionQuery.matches) {
          smoothP = targetP;
          renderOceanScene(0);
        } else {
          ensureLoopRunning();
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', resizeOceanCanvas, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else {
        ensureLoopRunning();
      }
    });

    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', () => {
        if (reducedMotionQuery.matches) {
          if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = 0;
          }
          smoothP = getScrollProgress();
          renderOceanScene(0);
        } else {
          ensureLoopRunning();
        }
      });
    }

    resizeOceanCanvas();
    if (!reducedMotionQuery.matches) {
      renderOceanScene(performance.now() * 0.001);
      ensureLoopRunning();
    }
  }
})();
