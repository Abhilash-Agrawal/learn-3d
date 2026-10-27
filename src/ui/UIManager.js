import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class UIManager {
  constructor(overlay, app) {
    this.overlay = overlay;
    this.app = app;
    this.currentArea = 'downtown';
    this.currentWeather = 'clear';
    this.isDay = true;
    this.detailEntity = null;
    this.detailType = null;
    
    this.areas = [
      { id: 'downtown', name: 'Downtown', position: new THREE.Vector3(0, 200, -50) },
      { id: 'riverside', name: 'Riverside', position: new THREE.Vector3(-150, 200, 100) },
      { id: 'highway', name: 'Highway', position: new THREE.Vector3(0, 200, -150) },
      { id: 'residential', name: 'Residential', position: new THREE.Vector3(-300, 200, 100) }
    ];
    
    this.weathers = ['clear', 'monsoon', 'fog', 'heatwave'];
    this.weatherNames = { clear: 'Clear', monsoon: 'Monsoon', fog: 'Fog', heatwave: 'Heatwave' };
    
    this.init();
  }
  
  init() {
    this.renderTopBar();
    this.renderKPICards();
    this.renderDetailPanel();
    this.renderIncidentTracker();
    this.renderTabbedTable();
    this.bindEvents();
    this.startClock();
  }
  
  renderTopBar() {
    const topBar = document.createElement('div');
    topBar.className = 'top-bar panel';
    topBar.innerHTML = `
      <div class="logo">
        <div class="logo-icon">🚨</div>
        <span>SIREN</span>
      </div>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" placeholder="Search incidents, units, stations..." id="search-input">
      </div>
      <div class="area-switcher" id="area-switcher">
        ${this.areas.map(a => `<button class="area-btn ${a.id === this.currentArea ? 'active' : ''}" data-area="${a.id}">${a.name}</button>`).join('')}
      </div>
      <div class="weather-menu">
        <button class="weather-btn" id="weather-btn">
          <span id="weather-icon">☀️</span>
          <span id="weather-text">${this.weatherNames[this.currentWeather]}</span>
        </button>
      </div>
      <div class="clock" id="clock">00:00:00</div>
      <div class="day-night-toggle" id="day-night-toggle">
        <span id="day-night-icon">☀️</span>
        <div class="toggle-track ${this.isDay ? 'day' : 'night'}">
          <div class="toggle-thumb ${this.isDay ? 'day' : 'night'}"></div>
        </div>
      </div>
      <div class="user-menu">
        <div class="user-avatar">AD</div>
        <span class="user-name">Dispatch Admin</span>
      </div>
    `;
    this.overlay.appendChild(topBar);
  }
  
  renderKPICards() {
    const kpiRow = document.createElement('div');
    kpiRow.className = 'kpi-row';
    kpiRow.innerHTML = `
      <div class="kpi-card panel">
        <div class="kpi-label">Active Incidents</div>
        <div class="kpi-value" id="kpi-active">0</div>
        <div class="kpi-trend up" id="kpi-active-trend">▲ 0%</div>
      </div>
      <div class="kpi-card panel">
        <div class="kpi-label">Avg Response Time</div>
        <div class="kpi-value" id="kpi-response">0m 00s</div>
        <div class="kpi-trend down" id="kpi-response-trend">▼ 0%</div>
      </div>
      <div class="kpi-card panel">
        <div class="kpi-label">Units Available</div>
        <div class="kpi-value" id="kpi-units">0</div>
        <div class="kpi-trend" id="kpi-units-trend">● Ready</div>
      </div>
    `;
    this.overlay.appendChild(kpiRow);
  }
  
  renderDetailPanel() {
    const detailPanel = document.createElement('div');
    detailPanel.className = 'detail-panel panel hidden';
    detailPanel.id = 'detail-panel';
    detailPanel.innerHTML = `
      <div class="detail-header">
        <h3 class="detail-title" id="detail-title">No Selection</h3>
        <button class="detail-close" id="detail-close">✕</button>
      </div>
      <div class="detail-content scrollbar-thin" id="detail-content">
        <div class="detail-stat">
          <span class="detail-stat-label">Select an incident, unit, or station</span>
          <span class="detail-stat-value">to view details</span>
        </div>
      </div>
    `;
    this.overlay.appendChild(detailPanel);
  }
  
  renderIncidentTracker() {
    const tracker = document.createElement('div');
    tracker.className = 'incident-tracker panel';
    tracker.innerHTML = `
      <div class="tracker-header">
        <span class="tracker-title">Incident Tracker</span>
        <span class="tracker-count" id="tracker-count">0 Active</span>
      </div>
      <div class="tracker-list scrollbar-thin" id="tracker-list">
        <div style="padding: 16px; text-align: center; color: var(--cool-grey-500); font-size: 13px;">
          No active incidents
        </div>
      </div>
    `;
    this.overlay.appendChild(tracker);
  }
  
  renderTabbedTable() {
    const table = document.createElement('div');
    table.className = 'tabbed-table panel';
    table.innerHTML = `
      <div class="table-tabs">
        <button class="table-tab active" data-tab="incidents">Incidents</button>
        <button class="table-tab" data-tab="units">Units</button>
        <button class="table-tab" data-tab="stations">Stations</button>
      </div>
      <div class="table-container">
        <div class="table-panel active" id="tab-incidents">
          <div class="table-header">
            <div class="table-cell">ID</div>
            <div class="table-cell">Type</div>
            <div class="table-cell">Status</div>
            <div class="table-cell">Location</div>
            <div class="table-cell">Unit</div>
          </div>
          <div class="table-body scrollbar-thin" id="table-incidents-body">
            <div style="padding: 16px; text-align: center; color: var(--cool-grey-500);">No incidents</div>
          </div>
        </div>
        <div class="table-panel" id="tab-units">
          <div class="table-header">
            <div class="table-cell">ID</div>
            <div class="table-cell">Type</div>
            <div class="table-cell">Status</div>
            <div class="table-cell">Location</div>
            <div class="table-cell">Assigned</div>
          </div>
          <div class="table-body scrollbar-thin" id="table-units-body">
            <div style="padding: 16px; text-align: center; color: var(--cool-grey-500);">No units</div>
          </div>
        </div>
        <div class="table-panel" id="tab-stations">
          <div class="table-header">
            <div class="table-cell">ID</div>
            <div class="table-cell">Name</div>
            <div class="table-cell">Type</div>
            <div class="table-cell">Status</div>
            <div class="table-cell">Units</div>
          </div>
          <div class="table-body scrollbar-thin" id="tab-stations-body">
            <div style="padding: 16px; text-align: center; color: var(--cool-grey-500);">No stations</div>
          </div>
        </div>
      </div>
    `;
    this.overlay.appendChild(table);
  }
  
  bindEvents() {
    document.querySelectorAll('.area-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchArea(e.target.dataset.area));
    });
    
    document.getElementById('weather-btn').addEventListener('click', () => this.cycleWeather());
    document.getElementById('day-night-toggle').addEventListener('click', () => this.toggleDayNight());
    document.getElementById('detail-close').addEventListener('click', () => this.hideDetailPanel());
    
    document.querySelectorAll('.table-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    document.getElementById('search-input').addEventListener('input', (e) => this.filterTables(e.target.value));
  }
  
  switchArea(areaId) {
    this.currentArea = areaId;
    document.querySelectorAll('.area-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.area === areaId);
    });
    
    const area = this.areas.find(a => a.id === areaId);
    if (area && this.app.cameraController) {
      this.app.cameraController.animateTo(
        area.position,
        new THREE.Vector3(area.position.x, 0, area.position.z),
        1500
      );
    }
  }
  
  cycleWeather() {
    const currentIndex = this.weathers.indexOf(this.currentWeather);
    this.currentWeather = this.weathers[(currentIndex + 1) % this.weathers.length];
    
    document.getElementById('weather-text').textContent = this.weatherNames[this.currentWeather];
    document.getElementById('weather-icon').textContent = this.getWeatherIcon(this.currentWeather);
    
    if (this.app.weatherSystem) {
      this.app.weatherSystem.setWeather(this.currentWeather);
    }
  }
  
  getWeatherIcon(weather) {
    const icons = { clear: '☀️', monsoon: '🌧️', fog: '🌫️', heatwave: '🔥' };
    return icons[weather] || '☀️';
  }
  
  toggleDayNight() {
    this.isDay = !this.isDay;
    const toggle = document.getElementById('day-night-toggle');
    const icon = document.getElementById('day-night-icon');
    const track = toggle.querySelector('.toggle-track');
    const thumb = toggle.querySelector('.toggle-thumb');
    
    track.className = `toggle-track ${this.isDay ? 'day' : 'night'}`;
    thumb.className = `toggle-thumb ${this.isDay ? 'day' : 'night'}`;
    icon.textContent = this.isDay ? '☀️' : '🌙';
    
    if (this.app.dayNightCycle) {
      this.app.dayNightCycle.toggle();
    }
  }
  
  switchTab(tabId) {
    document.querySelectorAll('.table-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    document.querySelectorAll('.table-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });
  }
  
  filterTables(query) {
    const lowerQuery = query.toLowerCase();
    
    document.querySelectorAll('.table-row').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(lowerQuery) ? 'grid' : 'none';
    });
  }
  
  startClock() {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      document.getElementById('clock').textContent = timeStr;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }
  
  showDetailPanel(entity, type) {
    this.detailEntity = entity;
    this.detailType = type;
    
    const panel = document.getElementById('detail-panel');
    const title = document.getElementById('detail-title');
    const content = document.getElementById('detail-content');
    
    panel.classList.remove('hidden');
    
    let titleText = '';
    let stats = [];
    
    switch (type) {
      case 'incident':
        titleText = `${entity.id} - ${entity.type.toUpperCase()}`;
        stats = [
          { label: 'Status', value: entity.status.charAt(0).toUpperCase() + entity.status.slice(1) },
          { label: 'Severity', value: entity.severity || entity.priority || 'Normal' },
          { label: 'Reported', value: this.formatTime(entity.reportedTime) },
          { label: 'Location', value: this.formatPosition(entity.getPosition()) },
          { label: 'Assigned Unit', value: entity.assignedUnit ? entity.assignedUnit.id : 'None' },
          { label: 'Progress', value: entity.progress ? Math.round(entity.progress * 100) + '%' : '0%' }
        ];
        break;
      case 'unit':
        titleText = `${entity.id} - ${entity.type.toUpperCase()}`;
        stats = [
          { label: 'Status', value: entity.status.charAt(0).toUpperCase() + entity.status.slice(1) },
          { label: 'Type', value: entity.type },
          { label: 'Station', value: entity.station ? entity.station.name : 'Patrol' },
          { label: 'Location', value: this.formatPosition(entity.getPosition()) },
          { label: 'Assigned Incident', value: entity.assignedIncident ? entity.assignedIncident.id : 'None' },
          { label: 'Speed', value: entity.getCurrentSpeed().toFixed(1) + ' m/s' }
        ];
        break;
      case 'station':
        titleText = entity.name;
        stats = [
          { label: 'Type', value: entity.type.charAt(0).toUpperCase() + entity.type.slice(1) },
          { label: 'ID', value: entity.id },
          { label: 'Location', value: this.formatPosition(entity.position) },
          { label: 'Units Stationed', value: this.countStationUnits(entity) },
          { label: 'Status', value: 'Operational' }
        ];
        break;
    }
    
    title.textContent = titleText;
    content.innerHTML = stats.map(s => `
      <div class="detail-stat">
        <span class="detail-stat-label">${s.label}</span>
        <span class="detail-stat-value">${s.value}</span>
      </div>
    `).join('');
  }
  
  hideDetailPanel() {
    document.getElementById('detail-panel').classList.add('hidden');
    this.detailEntity = null;
    this.detailType = null;
    if (this.app.selectionManager) {
      this.app.selectionManager.deselect();
    }
  }
  
  countStationUnits(station) {
    if (!this.app.unitManager) return 0;
    return this.app.unitManager.getUnits().filter(u => u.station === station).length;
  }
  
  formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  }
  
  formatPosition(pos) {
    return `${Math.round(pos.x)}, ${Math.round(pos.z)}`;
  }
  
  addIncidentToTracker(incident) {
    this.updateTracker();
  }
  
  updateTracker() {
    if (!this.app.incidentManager) return;
    
    const incidents = this.app.incidentManager.getActiveIncidents();
    const list = document.getElementById('tracker-list');
    const count = document.getElementById('tracker-count');
    
    count.textContent = `${incidents.length} Active`;
    
    if (incidents.length === 0) {
      list.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--cool-grey-500); font-size: 13px;">No active incidents</div>';
      return;
    }
    
    const statusOrder = ['reported', 'dispatched', 'enroute', 'onscene', 'contained', 'closed'];
    incidents.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
    
    list.innerHTML = incidents.map(incident => `
      <div class="tracker-item ${this.detailEntity === incident && this.detailType === 'incident' ? 'selected' : ''}" data-id="${incident.id}" data-type="incident">
        <div class="tracker-status ${incident.status}"></div>
        <div class="tracker-info">
          <div class="tracker-id">${incident.id}</div>
          <div class="tracker-type">${incident.type} · ${incident.status}</div>
        </div>
      </div>
    `).join('');
    
    list.querySelectorAll('.tracker-item').forEach(item => {
      item.addEventListener('click', () => {
        const incident = this.app.incidentManager.getIncidentById(item.dataset.id);
        if (incident) {
          this.app.selectionManager.select(incident, 'incident');
        }
      });
    });
  }
  
  updateTables() {
    this.updateIncidentsTable();
    this.updateUnitsTable();
    this.updateStationsTable();
  }
  
  updateIncidentsTable() {
    if (!this.app.incidentManager) return;
    
    const incidents = this.app.incidentManager.getIncidents();
    const body = document.getElementById('table-incidents-body');
    
    if (incidents.length === 0) {
      body.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--cool-grey-500);">No incidents</div>';
      return;
    }
    
    body.innerHTML = incidents.map(incident => `
      <div class="table-row ${this.detailEntity === incident && this.detailType === 'incident' ? 'selected' : ''}" data-id="${incident.id}" data-type="incident">
        <div class="table-cell">${incident.id}</div>
        <div class="table-cell">${incident.type}</div>
        <div class="table-cell status">
          <span class="status-dot ${incident.status}"></span>
          ${incident.status}
        </div>
        <div class="table-cell">${this.formatPosition(incident.getPosition())}</div>
        <div class="table-cell">${incident.assignedUnit ? incident.assignedUnit.id : '—'}</div>
      </div>
    `).join('');
    
    body.querySelectorAll('.table-row').forEach(row => {
      row.addEventListener('click', () => {
        const incident = this.app.incidentManager.getIncidentById(row.dataset.id);
        if (incident) this.app.selectionManager.select(incident, 'incident');
      });
    });
  }
  
  updateUnitsTable() {
    if (!this.app.unitManager) return;
    
    const units = this.app.unitManager.getUnits();
    const body = document.getElementById('table-units-body');
    
    if (units.length === 0) {
      body.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--cool-grey-500);">No units</div>';
      return;
    }
    
    body.innerHTML = units.map(unit => `
      <div class="table-row ${this.detailEntity === unit && this.detailType === 'unit' ? 'selected' : ''}" data-id="${unit.id}" data-type="unit">
        <div class="table-cell">${unit.id}</div>
        <div class="table-cell">${unit.type}</div>
        <div class="table-cell status">
          <span class="status-dot ${unit.status}"></span>
          ${unit.status}
        </div>
        <div class="table-cell">${this.formatPosition(unit.getPosition())}</div>
        <div class="table-cell">${unit.assignedIncident ? unit.assignedIncident.id : '—'}</div>
      </div>
    `).join('');
    
    body.querySelectorAll('.table-row').forEach(row => {
      row.addEventListener('click', () => {
        const unit = this.app.unitManager.getUnitById(row.dataset.id);
        if (unit) this.app.selectionManager.select(unit, 'unit');
      });
    });
  }
  
  updateStationsTable() {
    if (!this.app.city) return;
    
    const stations = this.app.city.getStations();
    const body = document.getElementById('tab-stations-body');
    
    if (stations.length === 0) {
      body.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--cool-grey-500);">No stations</div>';
      return;
    }
    
    body.innerHTML = stations.map(station => `
      <div class="table-row ${this.detailEntity === station.entity && this.detailType === 'station' ? 'selected' : ''}" data-id="${station.id}" data-type="station">
        <div class="table-cell">${station.id}</div>
        <div class="table-cell">${station.name}</div>
        <div class="table-cell">${station.type}</div>
        <div class="table-cell status">
          <span class="status-dot active"></span>
          Operational
        </div>
        <div class="table-cell">${this.countStationUnits(station)}</div>
      </div>
    `).join('');
    
    body.querySelectorAll('.table-row').forEach(row => {
      row.addEventListener('click', () => {
        const station = stations.find(s => s.id === row.dataset.id);
        if (station) this.app.selectionManager.select(station.entity, 'station');
      });
    });
  }
  
  updateKPIs() {
    if (!this.app.incidentManager || !this.app.unitManager) return;
    
    const activeIncidents = this.app.incidentManager.getActiveIncidents().length;
    const units = this.app.unitManager.getUnits();
    const availableUnits = units.filter(u => u.status === 'idle').length;
    
    document.getElementById('kpi-active').textContent = activeIncidents;
    document.getElementById('kpi-units').textContent = availableUnits;
    
    const responseTimes = this.app.incidentManager.getIncidents()
      .filter(i => i.responseTime)
      .map(i => i.responseTime);
    const avgResponse = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    const mins = Math.floor(avgResponse / 60000);
    const secs = Math.floor((avgResponse % 60000) / 1000);
    document.getElementById('kpi-response').textContent = `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  
  update(delta, elapsed) {
    this.updateTracker();
    this.updateTables();
    this.updateKPIs();
  }
  
  onResize() {
  }
}