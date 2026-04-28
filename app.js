// ============================================================
// State
// ============================================================
const state = {
  plants: [],
  logs: [],
  currentTab: 'dashboard',
  dashboardFilter: 'all',
  selectedYear: new Date().getFullYear(),
  filterPlant: 'all',
  filterType: 'all',
  editingPlantId: null,
  editingLogId: null,
};

function filterDashboard(category) {
  state.dashboardFilter = category;
  renderDashboard();
}

// ============================================================
// API helpers
// ============================================================
async function apiCall(method, url, body) {
  const options = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(url, options);
  if (res.status === 401) { window.location.href = '/login'; return; }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function loadData() {
  const url = window.SHARE_MODE ? '/api/share-data' : '/api/data';
  const data = await apiCall('GET', url);
  state.plants = data.plants || [];
  state.logs = data.logs || [];
}

// ============================================================
// Utility functions
// ============================================================
function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + 'T12:00:00');
  return Math.floor((Date.now() - then) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function relativeTime(dateStr) {
  const d = daysSince(dateStr);
  if (d === null) return null;
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? 's' : ''} ago`;
  return formatDate(dateStr);
}

function getLastWatered(plantId) {
  return state.logs
    .filter(l => l.type === 'water' && (l.plantIds.includes('all') || l.plantIds.includes(plantId)))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || null;
}

function getLastRain() {
  return state.logs
    .filter(l => l.type === 'rain')
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || null;
}

const CATEGORY_LABELS = {
  tomato:   'Tomato',
  pepper:   'Pepper',
  cucumber: 'Cucumber',
  squash:   'Squash / Zucchini',
  beans:    'Beans',
  lettuce:  'Lettuce / Salad Greens',
  herb:     'Herb',
  root:     'Root Vegetable',
  corn:     'Corn',
  eggplant: 'Eggplant',
  melon:    'Melon',
  berries:  'Berries',
  other:    'Other',
};

const CATEGORY_FIELDS = {
  tomato: [
    { name: 'variety',      label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Cherokee Purple, Sungold, Early Girl' },
    { name: 'tomatoType',   label: 'Tomato Type',         type: 'select', options: ['', 'Slicer', 'Cherry', 'Beefsteak', 'Roma / Paste', 'Grape', 'Cocktail'] },
    { name: 'growthHabit',  label: 'Growth Habit',        type: 'select', options: ['', 'Determinate', 'Indeterminate', 'Semi-Determinate'] },
  ],
  pepper: [
    { name: 'variety',    label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. California Wonder, Jalapeño M, Lemon Drop' },
    { name: 'pepperType', label: 'Pepper Type',         type: 'select', options: ['', 'Bell', 'Banana', 'Jalapeño', 'Serrano', 'Cayenne', 'Habanero', 'Ghost', 'Poblano', 'Shishito', 'Other'] },
    { name: 'heatLevel',  label: 'Heat Level',          type: 'select', options: ['', 'Sweet / No Heat', 'Mild', 'Medium', 'Hot', 'Very Hot / Super Hot'] },
  ],
  cucumber: [
    { name: 'variety',      label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Marketmore 76, Lemon, Persian' },
    { name: 'cucumberType', label: 'Cucumber Type',       type: 'select', options: ['', 'Slicing', 'Pickling', 'English / Burpless', 'Asian', 'Lemon'] },
  ],
  squash: [
    { name: 'variety',      label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Black Beauty Zucchini, Delicata, Butternut' },
    { name: 'squashSeason', label: 'Season',              type: 'select', options: ['', 'Summer (Zucchini, Pattypan, etc.)', 'Winter (Butternut, Acorn, etc.)'] },
    { name: 'squashHabit',  label: 'Plant Habit',         type: 'select', options: ['', 'Bush', 'Vining'] },
  ],
  beans: [
    { name: 'variety',       label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Blue Lake, Kentucky Wonder, Dragon Tongue' },
    { name: 'beanPlantType', label: 'Plant Type',          type: 'select', options: ['', 'Bush', 'Pole', 'Half-Runner'] },
    { name: 'beanType',      label: 'Bean Type',           type: 'select', options: ['', 'Green / String', 'Wax / Yellow', 'Lima / Butter', 'Shell / Dry', 'Snap'] },
  ],
  lettuce: [
    { name: 'variety',     label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Buttercrunch, Red Romaine, Oak Leaf' },
    { name: 'lettuceType', label: 'Lettuce Type',        type: 'select', options: ['', 'Leaf', 'Romaine / Cos', 'Butterhead', 'Iceberg / Crisphead', 'Looseleaf', 'Arugula', 'Spinach', 'Mixed Greens'] },
  ],
  herb: [
    { name: 'variety',   label: 'Herb & Variety', type: 'text',   placeholder: 'e.g. Genovese Basil, Italian Flat-Leaf Parsley, French Tarragon' },
    { name: 'herbCycle', label: 'Life Cycle',      type: 'select', options: ['', 'Annual', 'Perennial', 'Biennial'] },
  ],
  root: [
    { name: 'rootCrop', label: 'Specific Crop',     type: 'select', options: ['', 'Carrot', 'Beet', 'Radish', 'Turnip', 'Parsnip', 'Potato', 'Sweet Potato', 'Rutabaga', 'Celeriac', 'Other'] },
    { name: 'variety',  label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Danvers 126, Chioggia, French Breakfast' },
  ],
  corn: [
    { name: 'variety',  label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Peaches and Cream, Silver Queen, Glass Gem' },
    { name: 'cornType', label: 'Corn Type',           type: 'select', options: ['', 'Sweet', 'Popcorn', 'Flint / Flour', 'Ornamental / Decorative'] },
  ],
  eggplant: [
    { name: 'variety',      label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Black Beauty, Fairy Tale, Rosa Bianca' },
    { name: 'eggplantType', label: 'Eggplant Type',       type: 'select', options: ['', 'Standard / Globe', 'Asian / Slender', 'Italian', 'Striped / Graffiti', 'White', 'Other'] },
  ],
  melon: [
    { name: 'variety',   label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Honey Rock, Sugar Baby, Canary' },
    { name: 'melonType', label: 'Melon Type',          type: 'select', options: ['', 'Cantaloupe / Muskmelon', 'Watermelon', 'Honeydew', 'Casaba', 'Crenshaw', 'Other'] },
  ],
  berries: [
    { name: 'berryType', label: 'Berry Type',        type: 'select', options: ['', 'Strawberry', 'Blueberry', 'Raspberry', 'Blackberry', 'Boysenberry', 'Gooseberry', 'Currant', 'Other'] },
    { name: 'variety',   label: 'Variety / Cultivar', type: 'text',   placeholder: 'e.g. Chandler, Bluecrop, Heritage, Triple Crown' },
    { name: 'bearingType', label: 'Bearing Type',     type: 'select', options: ['', 'June-bearing', 'Everbearing', 'Day-neutral', 'Summer-bearing', 'Fall-bearing'] },
  ],
  other: [
    { name: 'variety', label: 'Crop & Variety', type: 'text', placeholder: 'e.g. Okra, Tomatillo Verde, Edamame' },
  ],
};

const TYPE_LABELS = {
  water: 'Water',
  rain: 'Rain',
  fertilize: 'Fertilize',
  observation: 'Observation',
  harvest: 'Harvest',
  treatment: 'Treatment',
  first_flowers: 'First Flowers',
  first_fruit: 'First Fruit',
  harvest_start: 'Harvest Started',
  height: 'Height',
};

// ============================================================
// Category helpers
// ============================================================
function renderCategoryForm(category, values = {}) {
  const fields = CATEGORY_FIELDS[category];
  if (!fields) return '';
  return fields.map(field => {
    if (field.type === 'text') {
      const val = (values[field.name] || '').replace(/"/g, '&quot;');
      return `<label>${field.label}<input name="${field.name}" value="${val}" placeholder="${field.placeholder || ''}"></label>`;
    }
    const opts = field.options.map(opt =>
      opt === ''
        ? `<option value="">— Select —</option>`
        : `<option value="${opt.replace(/"/g, '&quot;')}" ${values[field.name] === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');
    return `<label>${field.label}<select name="${field.name}">${opts}</select></label>`;
  }).join('');
}

function updateCategoryFields(category, values = {}) {
  const container = document.getElementById('category-specific-fields');
  if (!category || !CATEGORY_FIELDS[category]) {
    // No category selected — always show a basic variety field so it's never lost
    const val = (values.variety || '').replace(/"/g, '&quot;');
    container.innerHTML = `<label>Variety / Cultivar<input name="variety" value="${val}" placeholder="e.g. Cherokee Purple, Sungold"></label>`;
    container.classList.remove('hidden');
    return;
  }
  container.innerHTML = renderCategoryForm(category, values);
  container.classList.remove('hidden');
}

function renderCategoryDetails(plant) {
  const fields = plant.category ? CATEGORY_FIELDS[plant.category] : null;
  const rows = [];

  if (plant.category) {
    rows.push(`<span class="cat-item"><strong>Category:</strong> ${CATEGORY_LABELS[plant.category] || plant.category}</span>`);
  }
  if (fields) {
    for (const f of fields) {
      if (plant[f.name]) rows.push(`<span class="cat-item"><strong>${f.label}:</strong> ${plant[f.name]}</span>`);
    }
  } else if (plant.variety) {
    rows.push(`<span class="cat-item"><strong>Variety:</strong> ${plant.variety}</span>`);
  }
  if (plant.heirloom) {
    const hLabels = { heirloom: 'Heirloom', hybrid: 'Hybrid', unknown: 'Not sure', yes: 'Heirloom', no: 'Hybrid' };
    rows.push(`<span class="cat-item"><strong>Heirloom:</strong> ${hLabels[plant.heirloom] || plant.heirloom}</span>`);
  }

  return rows.length ? `<div class="cat-details">${rows.join('')}</div>` : '';
}

function getCategorySubtitle(plant) {
  const parts = [];
  if (plant.category) parts.push(CATEGORY_LABELS[plant.category] || plant.category);
  const v = plant.variety || plant.rootCrop || null;
  if (v) parts.push(v);
  return parts.join(' · ');
}

// ============================================================
// Milestone helpers
// ============================================================
function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const a = new Date(dateA + 'T12:00:00');
  const b = new Date(dateB + 'T12:00:00');
  return Math.round(Math.abs(b - a) / 86400000);
}

function getPlantMilestones(plantId, datePlanted) {
  const plantLogs = state.logs.filter(l => l.plantIds.includes('all') || l.plantIds.includes(plantId));

  const getFirst = (type) => plantLogs
    .filter(l => l.type === type)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;

  const heights = plantLogs
    .filter(l => l.type === 'height')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    firstFlowers: getFirst('first_flowers'),
    firstFruit: getFirst('first_fruit'),
    harvestStart: getFirst('harvest_start'),
    latestHeight: heights[0] || null,
    allHeights: heights,
  };
}

function renderMilestones(plantId, datePlanted) {
  const { firstFlowers, firstFruit, harvestStart, latestHeight, allHeights } = getPlantMilestones(plantId, datePlanted);

  function row(label, entry, daysLabel) {
    if (entry) {
      return `
        <div class="milestone-row achieved">
          <span class="milestone-dot">✓</span>
          <span class="milestone-label">${label}</span>
          <span class="milestone-date">${formatDate(entry.date)}</span>
          ${daysLabel ? `<span class="milestone-days">${daysLabel}</span>` : ''}
          ${entry.notes ? `<span class="milestone-note"> — ${entry.notes}</span>` : ''}
        </div>`;
    }
    return `
      <div class="milestone-row pending">
        <span class="milestone-dot">○</span>
        <span class="milestone-label">${label}</span>
        <span class="milestone-pending">Not logged yet</span>
      </div>`;
  }

  const daysToFlowers = firstFlowers && datePlanted
    ? `${daysBetween(datePlanted, firstFlowers.date)} days after planting`
    : null;
  const daysToFruit = firstFruit && firstFlowers
    ? `${daysBetween(firstFlowers.date, firstFruit.date)} days after first flowers`
    : null;
  const daysToHarvest = harvestStart && firstFruit
    ? `${daysBetween(firstFruit.date, harvestStart.date)} days after first fruit`
    : null;

  let heightHtml = '';
  if (allHeights.length > 0) {
    const history = allHeights
      .slice()
      .reverse()
      .map(h => `<span class="height-entry">${h.amount || h.notes || '?'} <span class="muted">(${formatDate(h.date)})</span></span>`)
      .join(' → ');
    heightHtml = `
      <div class="milestone-row height-row">
        <span class="milestone-dot">↕</span>
        <span class="milestone-label">Height</span>
        <span class="height-history">${history}</span>
      </div>`;
  } else {
    heightHtml = `
      <div class="milestone-row pending">
        <span class="milestone-dot">↕</span>
        <span class="milestone-label">Height</span>
        <span class="milestone-pending">No measurements yet</span>
      </div>`;
  }

  return `<div class="milestones">
    ${row('First Flowers', firstFlowers, daysToFlowers)}
    ${row('First Fruit', firstFruit, daysToFruit)}
    ${row('Harvest Started', harvestStart, daysToHarvest)}
    ${heightHtml}
  </div>`;
}

// ============================================================
// Tab switching
// ============================================================
function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== `tab-${tab}`);
  });
}

// ============================================================
// Dashboard
// ============================================================
function renderDashboard() {
  document.getElementById('stat-plants').textContent = state.plants.length;

  const waterThisWeek = state.logs.filter(l => l.type === 'water' && daysSince(l.date) <= 7).length;
  document.getElementById('stat-watered').textContent = waterThisWeek;

  const lastRain = getLastRain();
  document.getElementById('stat-rain').textContent = lastRain ? relativeTime(lastRain) : '—';

  // Build filter bar from categories that have plants
  const presentCategories = [...new Set(state.plants.map(p => p.category).filter(Boolean))];
  // Reset filter if the selected category no longer has any plants
  if (state.dashboardFilter !== 'all' && !presentCategories.includes(state.dashboardFilter)) {
    state.dashboardFilter = 'all';
  }
  const filterBar = document.getElementById('dashboard-filter-bar');
  if (presentCategories.length >= 1) {
    filterBar.innerHTML = ['all', ...presentCategories].map(cat => {
      const plurals = { tomato:'Tomatoes', pepper:'Peppers', cucumber:'Cucumbers', squash:'Squash / Zucchini', beans:'Beans', lettuce:'Lettuce / Salad Greens', herb:'Herbs', root:'Root Vegetables', corn:'Corn', eggplant:'Eggplant', melon:'Melons', berries:'Berries', other:'Other' };
      const label = cat === 'all' ? 'All' : (plurals[cat] || CATEGORY_LABELS[cat] || cat);
      return `<button class="filter-btn ${state.dashboardFilter === cat ? 'active' : ''}" onclick="filterDashboard('${cat}')">${label}</button>`;
    }).join('');
  } else {
    filterBar.innerHTML = '';
  }

  const grid = document.getElementById('plants-grid');
  const visiblePlants = state.dashboardFilter === 'all'
    ? state.plants
    : state.plants.filter(p => p.category === state.dashboardFilter);

  if (state.plants.length === 0) {
    grid.innerHTML = `<p class="empty-state">No plants added yet — click the <strong>Plants</strong> tab above to add your first one.</p>`;
    return;
  }
  if (visiblePlants.length === 0) {
    grid.innerHTML = `<p class="empty-state">No plants in this category.</p>`;
    return;
  }

  grid.innerHTML = visiblePlants.map(plant => {
    const lastWatered = getLastWatered(plant.id);
    const daysWater = daysSince(lastWatered);
    const waterLabel = lastWatered
      ? `Last watered ${relativeTime(lastWatered)}`
      : 'Not watered yet';
    const isOverdue = daysWater !== null && daysWater > 3;
    const { latestHeight } = getPlantMilestones(plant.id, plant.datePlanted);

    return `
      <div class="plant-card card-cat-${plant.category || 'other'}">
        <div class="plant-card-top">
          ${plant.location ? `<span class="plant-loc">${plant.location}</span>` : ''}
        </div>
        <h3 class="plant-card-name">${plant.name}</h3>
        ${(plant.variety || plant.rootCrop) && !plant.name?.includes(plant.variety || plant.rootCrop) ? `<div class="plant-card-sub">${plant.variety || plant.rootCrop}</div>` : ''}
        ${plant.datePlanted ? `<div class="plant-card-meta">Planted ${formatDate(plant.datePlanted)}</div>` : ''}
        <div class="water-status ${isOverdue ? 'overdue' : ''}">${waterLabel}</div>
        ${latestHeight ? `<div class="card-height">Height: ${latestHeight.amount || latestHeight.notes || '?'}</div>` : ''}
        <div class="plant-card-actions">
          <button class="btn-sm btn-card-water" onclick="quickWater('${plant.id}')">Water</button>
          <button class="btn-sm btn-card-note" onclick="quickNote('${plant.id}')">Note</button>
          <button class="btn-sm btn-card-view" onclick="openModal('${plant.id}')">Details</button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// Plants tab
// ============================================================
function renderPlants() {
  const list = document.getElementById('plant-list');

  if (state.plants.length === 0) {
    list.innerHTML = `<p class="empty-state">No plants yet. Click <strong>+ Add Plant</strong> above to get started.</p>`;
    return;
  }

  list.innerHTML = state.plants.map(plant => `
    <div class="plant-row" id="prow-${plant.id}">
      <div class="plant-row-head" onclick="toggleRow('${plant.id}')">
        <span class="plant-row-name">
          <strong>${plant.name}</strong>
          ${getCategorySubtitle(plant) ? `<span class="plant-row-sub"> · ${getCategorySubtitle(plant)}</span>` : ''}
          ${plant.location ? `<span class="muted"> · ${plant.location}</span>` : ''}
        </span>
        <span class="expand-arrow" id="arrow-${plant.id}">▼</span>
      </div>
      <div class="plant-row-body hidden" id="pbody-${plant.id}">
        <div class="row-actions">
          <button class="btn-sm" onclick="startEditPlant('${plant.id}')">Edit Plant</button>
          <button class="btn-sm btn-danger" onclick="confirmDeletePlant('${plant.id}')">Delete</button>
        </div>
        <div class="row-detail-grid">
          <div>
            ${renderCategoryDetails(plant)}
            <p><strong>Planted:</strong> ${formatDate(plant.datePlanted)}</p>
            <p><strong>Container:</strong> ${plant.location || '—'}</p>
            ${plant.notes ? `<p><strong>Notes:</strong> ${plant.notes}</p>` : ''}
          </div>
          <div>
            <p><strong>Care Instructions:</strong></p>
            ${plant.careInstructions
              ? `<div class="care-box">${plant.careInstructions.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`
              : `<p class="muted">None added yet. Click Edit to add care instructions.</p>`
            }
          </div>
        </div>
        <div class="plant-milestones">
          <strong>Growth Milestones:</strong>
          ${renderMilestones(plant.id, plant.datePlanted)}
        </div>
        <div class="plant-history">
          <strong>Activity Log:</strong>
          ${renderPlantHistory(plant.id)}
        </div>
      </div>
    </div>
  `).join('');
}

function renderPlantHistory(plantId) {
  const entries = state.logs
    .filter(l => l.plantIds.includes('all') || l.plantIds.includes(plantId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  if (entries.length === 0) return `<p class="muted">No activity logged yet.</p>`;

  return `<ul class="history-list">${entries.map(log => `
    <li>
      <span class="log-date-sm">${formatDate(log.date)}</span>
      <span class="type-badge t-${log.type}">${TYPE_LABELS[log.type] || log.type}</span>
      ${log.amount ? `<span class="log-amt">${log.amount}</span>` : ''}
      ${log.notes ? `<span class="log-note-sm"> — ${log.notes}</span>` : ''}
    </li>
  `).join('')}</ul>`;
}

function toggleRow(plantId) {
  const body = document.getElementById(`pbody-${plantId}`);
  const arrow = document.getElementById(`arrow-${plantId}`);
  const isHidden = body.classList.toggle('hidden');
  arrow.textContent = isHidden ? '▼' : '▲';
}

// ============================================================
// Journal
// ============================================================
function renderJournal() {
  // Year filter options
  const logYears = [...new Set(state.logs.map(l => new Date(l.date).getFullYear()))];
  const currentYear = new Date().getFullYear();
  if (!logYears.includes(currentYear)) logYears.push(currentYear);
  logYears.sort((a, b) => b - a);

  const yearSelect = document.getElementById('filter-year');
  const activeYear = state.selectedYear;
  yearSelect.innerHTML = logYears.map(y =>
    `<option value="${y}" ${y === activeYear ? 'selected' : ''}>${y}</option>`
  ).join('');

  // Plant filter options
  const plantSelect = document.getElementById('filter-plant');
  const activePlant = state.filterPlant;
  plantSelect.innerHTML = '<option value="all">All Plants</option>' +
    state.plants.map(p =>
      `<option value="${p.id}" ${p.id === activePlant ? 'selected' : ''}>${p.name}${p.variety ? ` (${p.variety})` : ''}</option>`
    ).join('');

  // Filter + sort logs
  let logs = state.logs.filter(l => new Date(l.date).getFullYear() === state.selectedYear);
  if (state.filterPlant !== 'all') {
    logs = logs.filter(l => l.plantIds.includes('all') || l.plantIds.includes(state.filterPlant));
  }
  if (state.filterType !== 'all') {
    logs = logs.filter(l => l.type === state.filterType);
  }
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Render log list
  const logList = document.getElementById('log-list');
  if (logs.length === 0) {
    logList.innerHTML = `<p class="empty-state">No entries for this period.</p>`;
    return;
  }

  logList.innerHTML = logs.map(log => {
    const plantNames = log.plantIds.includes('all')
      ? 'All Plants'
      : log.plantIds.map(id => {
          const p = state.plants.find(p => p.id === id);
          return p ? `${p.name}${p.variety ? ` (${p.variety})` : ''}` : 'Unknown plant';
        }).join(', ');

    return `
      <div class="log-entry">
        <div class="log-entry-top">
          <span class="log-date">${formatDate(log.date)}</span>
          <span class="type-badge t-${log.type}">${TYPE_LABELS[log.type] || log.type}</span>
          <span class="log-plants">${plantNames}</span>
          <div class="log-entry-actions">
            <button class="btn-edit-log" onclick="startEditLog('${log.id}')" title="Edit entry">Edit</button>
            <button class="btn-del" onclick="confirmDeleteLog('${log.id}')" title="Delete entry">✕</button>
          </div>
        </div>
        ${log.amount ? `<div class="log-amount">Amount: ${log.amount}</div>` : ''}
        ${log.notes ? `<div class="log-notes">${log.notes}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ============================================================
// Plant detail modal
// ============================================================
function openModal(plantId) {
  const plant = state.plants.find(p => p.id === plantId);
  if (!plant) return;

  document.getElementById('modal-plant-name').textContent =
    plant.name + (plant.variety ? ` (${plant.variety})` : '');
  document.getElementById('modal-status').innerHTML = '';
  document.getElementById('modal-details').innerHTML = `
    ${renderCategoryDetails(plant)}
    <p><strong>Planted:</strong> ${formatDate(plant.datePlanted)}</p>
    <p><strong>Container:</strong> ${plant.location || '—'}</p>
    ${plant.notes ? `<p><strong>Notes:</strong> ${plant.notes}</p>` : ''}
  `;
  document.getElementById('modal-milestones').innerHTML = renderMilestones(plantId, plant.datePlanted);
  document.getElementById('modal-care').innerHTML = plant.careInstructions
    ? `<div class="care-box">${plant.careInstructions.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`
    : `<p class="muted">No care instructions added yet. Edit this plant to add them.</p>`;
  document.getElementById('modal-history').innerHTML = renderPlantHistory(plantId);

  document.getElementById('plant-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('plant-modal').classList.add('hidden');
}

// ============================================================
// Quick actions (from dashboard)
// ============================================================
async function quickWater(plantId) {
  await apiCall('POST', '/api/logs', {
    date: today(),
    type: 'water',
    plantIds: [plantId],
  });
  await loadData();
  renderAll();
}

async function quickNote(plantId) {
  const notes = prompt('Add a note for this plant:');
  if (notes === null) return;
  await apiCall('POST', '/api/logs', {
    date: today(),
    type: 'observation',
    plantIds: [plantId],
    notes,
  });
  await loadData();
  renderAll();
}

// ============================================================
// Plant CRUD
// ============================================================
function startEditPlant(plantId) {
  const plant = state.plants.find(p => p.id === plantId);
  if (!plant) return;
  state.editingPlantId = plantId;

  const form = document.getElementById('plant-form');
  form.elements['datePlanted'].value = plant.datePlanted || '';
  form.elements['location'].value = plant.location || '';
  form.elements['careInstructions'].value = plant.careInstructions || '';
  form.elements['notes'].value = plant.notes || '';
  // Category + dynamic fields
  document.getElementById('plant-category-select').value = plant.category || '';
  updateCategoryFields(plant.category || '', plant);
  if (form.elements['heirloom']) form.elements['heirloom'].value = plant.heirloom || '';

  document.getElementById('plant-form-title').textContent = 'Edit Plant';
  document.getElementById('plant-form-container').classList.remove('hidden');
  switchTab('plants');
  setTimeout(() => {
    document.getElementById('plant-form-container').scrollIntoView({ behavior: 'smooth' });
  }, 50);
}

async function confirmDeletePlant(plantId) {
  const plant = state.plants.find(p => p.id === plantId);
  if (!plant) return;
  if (!confirm(`Delete "${plant.name}"? This will also remove any logs specific to this plant.`)) return;
  await apiCall('DELETE', `/api/plants/${plantId}`);
  await loadData();
  renderAll();
}

function startEditLog(logId) {
  const log = state.logs.find(l => l.id === logId);
  if (!log) return;
  state.editingLogId = logId;

  const form = document.getElementById('log-form');
  form.elements['date'].value = log.date || today();
  form.elements['type'].value = log.type || 'water';
  form.elements['amount'].value = log.amount || '';
  form.elements['notes'].value = log.notes || '';

  // Set plant checkboxes
  updatePlantPicker(log.plantIds);

  document.getElementById('log-form-title').textContent = 'Edit Log Entry';
  document.getElementById('log-form-container').classList.remove('hidden');
  document.getElementById('log-form-container').scrollIntoView({ behavior: 'smooth' });
}

async function confirmDeleteLog(logId) {
  if (!confirm('Delete this log entry?')) return;
  await apiCall('DELETE', `/api/logs/${logId}`);
  await loadData();
  renderAll();
}

// ============================================================
// CSV export
// ============================================================
function exportLogsCSV() {
  if (state.logs.length === 0) {
    alert('No journal entries to export yet.');
    return;
  }

  function esc(val) {
    return `"${String(val ?? '').replace(/"/g, '""')}"`;
  }

  const headers = ['Date', 'Type', 'Plant(s)', 'Amount', 'Notes'];

  const rows = state.logs
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(log => {
      const plantNames = log.plantIds.includes('all')
        ? 'All Plants'
        : log.plantIds.map(id => {
            const p = state.plants.find(p => p.id === id);
            return p ? p.name : 'Unknown plant';
          }).join('; ');

      return [
        formatDate(log.date),
        TYPE_LABELS[log.type] || log.type,
        plantNames,
        log.amount || '',
        log.notes || '',
      ].map(esc).join(',');
    });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `garden-journal-${new Date().getFullYear()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// Render all views
// ============================================================
function renderAll() {
  renderDashboard();
  renderPlants();
  renderJournal();
  updatePlantPicker();
}

function updatePlantPicker(selectedIds = null) {
  const isAll = !selectedIds || selectedIds.includes('all');
  const picker = document.getElementById('log-plant-picker');
  picker.innerHTML = [
    `<button type="button" class="pick-pill${isAll ? ' selected' : ''}" data-id="all">All Plants</button>`,
    ...state.plants.map(p =>
      `<button type="button" class="pick-pill${!isAll && selectedIds?.includes(p.id) ? ' selected' : ''}" data-id="${p.id}">${p.name}</button>`
    ),
  ].join('');
}

// ============================================================
// Init — wire everything up on page load
// ============================================================
async function init() {
  if (window.SHARE_MODE) document.body.classList.add('share-mode');
  await loadData();
  renderAll();

  // Set today's date as default in log form
  document.getElementById('log-date').value = today();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Quick: log rain for all plants
  document.getElementById('quick-rain-btn').addEventListener('click', async () => {
    const notes = prompt('Any notes about this rain? (press OK to skip)');
    if (notes === null) return; // user pressed Cancel
    await apiCall('POST', '/api/logs', {
      date: today(),
      type: 'rain',
      plantIds: ['all'],
      notes: notes || '',
    });
    await loadData();
    renderAll();
  });

  // Quick: log watering for all plants
  document.getElementById('quick-water-all-btn').addEventListener('click', async () => {
    if (!confirm('Log that you watered all plants today?')) return;
    await apiCall('POST', '/api/logs', {
      date: today(),
      type: 'water',
      plantIds: ['all'],
    });
    await loadData();
    renderAll();
  });

  // Category dropdown — show/hide category-specific fields
  document.getElementById('plant-category-select').addEventListener('change', (e) => {
    updateCategoryFields(e.target.value);
  });

  // Toggle add plant form
  document.getElementById('add-plant-btn').addEventListener('click', () => {
    const isHidden = document.getElementById('plant-form-container').classList.contains('hidden');
    if (isHidden) {
      state.editingPlantId = null;
      document.getElementById('plant-form').reset();
      updateCategoryFields(''); // clear dynamic fields
      document.getElementById('plant-form-title').textContent = 'Add New Plant';
      document.getElementById('plant-form-container').classList.remove('hidden');
    } else {
      document.getElementById('plant-form-container').classList.add('hidden');
    }
  });

  // Plant form submit
  document.getElementById('plant-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const category = form.elements['category']?.value || '';
    const payload = {
      category,
      heirloom: form.elements['heirloom']?.value || '',
      datePlanted: form.elements['datePlanted'].value || null,
      location: form.elements['location'].value.trim() || null,
      careInstructions: form.elements['careInstructions'].value.trim(),
      notes: form.elements['notes'].value.trim(),
    };

    // Collect category-specific fields
    if (category && CATEGORY_FIELDS[category]) {
      for (const field of CATEGORY_FIELDS[category]) {
        payload[field.name] = form.elements[field.name]?.value?.trim() || '';
      }
    } else {
      payload.variety = form.elements['variety']?.value?.trim() || '';
    }

    // Auto-generate name from category + variety
    const catLabel = (category === 'root' && payload.rootCrop)
      ? payload.rootCrop
      : (CATEGORY_LABELS[category] || category || '');
    const varietyVal = payload.variety || '';
    if (catLabel && varietyVal) payload.name = `${catLabel} — ${varietyVal}`;
    else if (varietyVal)        payload.name = varietyVal;
    else if (catLabel)          payload.name = catLabel;
    else                        payload.name = 'Plant';

    if (state.editingPlantId) {
      await apiCall('PUT', `/api/plants/${state.editingPlantId}`, payload);
    } else {
      await apiCall('POST', '/api/plants', payload);
    }

    form.reset();
    state.editingPlantId = null;
    document.getElementById('plant-form-container').classList.add('hidden');
    await loadData();
    renderAll();
  });

  // Cancel plant form
  document.getElementById('cancel-plant-btn').addEventListener('click', () => {
    document.getElementById('plant-form').reset();
    state.editingPlantId = null;
    document.getElementById('plant-form-container').classList.add('hidden');
  });

  // Plant picker pill toggle
  document.getElementById('log-plant-picker').addEventListener('click', (e) => {
    const pill = e.target.closest('.pick-pill');
    if (!pill) return;
    const allPill = document.querySelector('.pick-pill[data-id="all"]');
    if (pill.dataset.id === 'all') {
      document.querySelectorAll('.pick-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    } else {
      allPill.classList.remove('selected');
      pill.classList.toggle('selected');
      if (!document.querySelector('.pick-pill.selected')) {
        allPill.classList.add('selected'); // re-select All if nothing chosen
      }
    }
  });

  // Export journal to CSV
  document.getElementById('export-csv-btn').addEventListener('click', exportLogsCSV);

  // Toggle add log form
  document.getElementById('add-log-btn').addEventListener('click', () => {
    document.getElementById('log-form-container').classList.toggle('hidden');
  });

  // Log form submit
  document.getElementById('log-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const selected = [...document.querySelectorAll('.pick-pill.selected')];
    const plantIds = selected.some(p => p.dataset.id === 'all')
      ? ['all']
      : selected.map(p => p.dataset.id);
    if (plantIds.length === 0) {
      alert('Please select at least one plant.');
      return;
    }
    const payload = {
      date: form.elements['date'].value || today(),
      type: form.elements['type'].value,
      plantIds,
      amount: form.elements['amount'].value.trim(),
      notes: form.elements['notes'].value.trim(),
    };
    if (state.editingLogId) {
      await apiCall('PUT', `/api/logs/${state.editingLogId}`, payload);
    } else {
      await apiCall('POST', '/api/logs', payload);
    }
    form.reset();
    document.getElementById('log-date').value = today();
    document.getElementById('log-form-title').textContent = 'New Log Entry';
    document.getElementById('log-form-container').classList.add('hidden');
    state.editingLogId = null;
    await loadData();
    renderAll(); // resets picker to All Plants via updatePlantPicker()
  });

  // Cancel log form
  document.getElementById('cancel-log-btn').addEventListener('click', () => {
    document.getElementById('log-form').reset();
    document.getElementById('log-date').value = today();
    document.getElementById('log-form-title').textContent = 'New Log Entry';
    document.getElementById('log-form-container').classList.add('hidden');
    state.editingLogId = null;
    updatePlantPicker(); // reset to All Plants
  });

  // Journal filters
  document.getElementById('filter-year').addEventListener('change', (e) => {
    state.selectedYear = parseInt(e.target.value);
    renderJournal();
  });
  document.getElementById('filter-plant').addEventListener('change', (e) => {
    state.filterPlant = e.target.value;
    renderJournal();
  });
  document.getElementById('filter-type').addEventListener('change', (e) => {
    state.filterType = e.target.value;
    renderJournal();
  });

  // Logout (not present on share page)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    });
  }

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('plant-modal').addEventListener('click', (e) => {
    if (e.target.id === 'plant-modal') closeModal();
  });
}

init();
