/* ==========================================================================
   TrueHelm: Realistic Shipping Lanes — Streamlined Mobile, 35-Boat Photo Fleet & Live 30-Sec Dev Log JS
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

  // 3. Live 30-Second Dev Dashboard + Instant GitHub API Sync + Graduated History & Version Logs
  const GITHUB_API_FEED_URL = 'https://api.github.com/repos/jbender083-prog/TrueHelm-Website/contents/status/live-dev-log.json?ref=main';
  const RAW_FEED_URL = 'https://raw.githubusercontent.com/jbender083-prog/TrueHelm-Website/main/status/live-dev-log.json';
  const LOCAL_FEED_URL = './status/live-dev-log.json';
  const REFRESH_INTERVAL_SEC = 30;
  let secondsUntilRefresh = REFRESH_INTERVAL_SEC;
  let lastETag = '';
  let lastParsedData = null;
  let refreshFeedbackTimer = null;

  const targetVerEl = document.getElementById('dash-target-version');
  const buildPhaseEl = document.getElementById('dash-build-phase');
  const lastCheckedEl = document.getElementById('dash-last-checked');
  const lastUpdatedEl = document.getElementById('dash-last-updated');
  const nextRefreshEl = document.getElementById('dash-next-refresh');
  const refreshBtn = document.getElementById('dash-refresh-btn');
  const addedListEl = document.getElementById('dash-added-list');
  const changedListEl = document.getElementById('dash-changed-list');
  const removedListEl = document.getElementById('dash-removed-list');
  const historyListEl = document.getElementById('dash-history-list');
  const historyCountEl = document.getElementById('history-count-badge');
  const versionStackEl = document.getElementById('version-logs-stack');

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

  function decodeGitHubBase64Utf8(b64) {
    const clean = String(b64 || '').replace(/\s/g, '');
    const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }

  function renderHistoryItem(entry) {
    const addedArr = Array.isArray(entry.added) ? entry.added : [];
    const changedArr = Array.isArray(entry.changed) ? entry.changed : [];
    const removedArr = Array.isArray(entry.removed) ? entry.removed : [];
    const detailRows = [];
    if (addedArr.length) {
      detailRows.push(`<p><span class="log-pill added">+ Added</span> ${addedArr.map(escapeHtml).join(' · ')}</p>`);
    }
    if (changedArr.length) {
      detailRows.push(`<p><span class="log-pill changed">~ Changed</span> ${changedArr.map(escapeHtml).join(' · ')}</p>`);
    }
    if (removedArr.length) {
      detailRows.push(`<p><span class="log-pill removed">&minus; Removed</span> ${removedArr.map(escapeHtml).join(' · ')}</p>`);
    }
    return `
      <div class="history-entry">
        <div class="history-entry-top">
          <span class="history-ver">${escapeHtml(entry.version || 'Sync')}</span>
          <span class="history-time">${escapeHtml(formatTimestamp(entry.timestampUtc))}</span>
        </div>
        <p class="history-summary">${escapeHtml(entry.summary || '')}</p>
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
      targetVerEl.textContent = `Target: ${data.activeVersion}`;
    }
    const phaseLabel = data.buildStatus || data.buildPhase;
    if (buildPhaseEl && phaseLabel) {
      buildPhaseEl.textContent = phaseLabel;
    }
    if (lastUpdatedEl && data.updatedAtUtc) {
      lastUpdatedEl.textContent = `Last change: ${formatTimestamp(data.updatedAtUtc)}`;
    }

    if (addedListEl && Array.isArray(data.currentlyAdded)) {
      addedListEl.innerHTML = data.currentlyAdded.length
        ? data.currentlyAdded.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
        : '<li class="dash-empty">✓ All active additions completed — moved to Release &amp; Version Update Logs below.</li>';
    }
    if (changedListEl && Array.isArray(data.currentlyChanged)) {
      changedListEl.innerHTML = data.currentlyChanged.length
        ? data.currentlyChanged.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
        : '<li class="dash-empty">✓ No active modifications in progress — completed changes logged below.</li>';
    }
    if (removedListEl && Array.isArray(data.currentlyRemoved)) {
      removedListEl.innerHTML = data.currentlyRemoved.length
        ? data.currentlyRemoved.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
        : '<li class="dash-empty">✓ All removals completed — archived in History &amp; Release Logs below.</li>';
    }

    if (historyListEl && Array.isArray(data.historyLog) && data.historyLog.length > 0) {
      if (historyCountEl) {
        historyCountEl.textContent = `${data.historyLog.length} Saved Sync Entries`;
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
            rows.push(`<p><span class="log-pill added">+ Added</span> ${v.added.map(escapeHtml).join(' · ')}</p>`);
          }
          if (Array.isArray(v.changed) && v.changed.length) {
            rows.push(`<p><span class="log-pill changed">~ Changed</span> ${v.changed.map(escapeHtml).join(' · ')}</p>`);
          }
          if (Array.isArray(v.removed) && v.removed.length) {
            rows.push(`<p><span class="log-pill removed">&minus; Removed</span> ${v.removed.map(escapeHtml).join(' · ')}</p>`);
          }
          return `
            <details class="card ver-card"${openAttr}>
              <summary>
                <div class="ver-title-group">
                  <strong class="ver-num">${escapeHtml(v.version)}</strong>
                  <span class="ver-badge ${badgeCls}">${escapeHtml(v.badge || '')}</span>
                </div>
                <span class="ver-date">${escapeHtml(v.date || '')}</span>
              </summary>
              <div class="ver-body">${rows.join('')}</div>
            </details>`;
        })
        .join('');
    }
  }

  function updateCountdownLabel() {
    if (!nextRefreshEl) return;
    const mm = Math.floor(secondsUntilRefresh / 60);
    const ss = String(secondsUntilRefresh % 60).padStart(2, '0');
    nextRefreshEl.textContent = `Next refresh in ${mm}:${ss}`;
  }

  async function fetchLiveDevLog(isManual = false) {
    if (isManual && refreshBtn) {
      clearTimeout(refreshFeedbackTimer);
      refreshBtn.classList.remove('is-refreshed');
      refreshBtn.textContent = '↻ Refreshing...';
      refreshBtn.disabled = true;
    }

    let syncedOk = false;
    try {
      const headers = { Accept: 'application/vnd.github+json' };
      if (!isManual && lastETag) {
        headers['If-None-Match'] = lastETag;
      }
      const res = await fetch(GITHUB_API_FEED_URL, { headers, cache: 'no-store' });
      if (res.status === 304 && lastParsedData) {
        applyDevDashboardData(lastParsedData);
        syncedOk = true;
      } else if (res.ok) {
        const etag = res.headers.get('ETag');
        if (etag) lastETag = etag;
        const wrapper = await res.json();
        if (wrapper && wrapper.content) {
          const parsed = JSON.parse(decodeGitHubBase64Utf8(wrapper.content));
          lastParsedData = parsed;
          applyDevDashboardData(parsed);
          syncedOk = true;
        }
      }
    } catch {
      // Fall through to local/raw fallback
    }

    if (!syncedOk) {
      const bust = `t=${Date.now()}`;
      try {
        const localRes = await fetch(`${LOCAL_FEED_URL}?${bust}`, { cache: 'no-store' });
        if (localRes.ok) {
          const parsed = await localRes.json();
          lastParsedData = parsed;
          applyDevDashboardData(parsed);
          syncedOk = true;
        }
      } catch {
        // Fall through to raw fallback
      }
    }

    if (!syncedOk) {
      const bust = `t=${Date.now()}`;
      try {
        const rawRes = await fetch(`${RAW_FEED_URL}?${bust}`, { cache: 'no-store' });
        if (rawRes.ok) {
          const parsed = await rawRes.json();
          lastParsedData = parsed;
          applyDevDashboardData(parsed);
        }
      } catch {
        // Keep current DOM state
      }
    }

    if (lastCheckedEl) {
      lastCheckedEl.textContent = `Last checked: ${formatLocalClockTime()}`;
    }
    secondsUntilRefresh = REFRESH_INTERVAL_SEC;
    updateCountdownLabel();

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

  fetchLiveDevLog(false);
  setInterval(() => fetchLiveDevLog(false), REFRESH_INTERVAL_SEC * 1000);

  setInterval(() => {
    secondsUntilRefresh = Math.max(0, secondsUntilRefresh - 1);
    updateCountdownLabel();
  }, 1000);

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

  // 5. Non-Blocking Direct .ZIP Download Toast (Zero preventDefault!)
  const toast = document.getElementById('download-toast');
  const toastTitle = document.getElementById('toast-title');
  let toastTimer = null;

  document.querySelectorAll('[data-direct-zip]').forEach((link) => {
    link.addEventListener('click', () => {
      if (!toast || !toastTitle) return;
      toastTitle.textContent = `Downloading ${link.dataset.directZip}...`;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.hidden = true;
      }, 8000);
    });
  });
})();
