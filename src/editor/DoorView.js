import * as THREE from 'three';

export class DoorView {
  constructor(doorData, onClose) {
    this.doorData = doorData;
    this.onClose = onClose;
    this.frameId = null;
    this.disposed = false;
    this.entries = [];
    this.notesFileHandle = null;
    this.isCameraDragging = false;
    this.cameraPointerId = null;
    this.lastPointer = new THREE.Vector2();
    this.cameraTarget = new THREE.Vector3(0, 4.5, 0);

    this.element = document.createElement('section');
    this.element.setAttribute('aria-label', `Door for ${doorData.topic}`);
    this.element.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2000;
      overflow: hidden;
      background: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;';
    this.element.appendChild(this.canvas);

    this.sidebar = document.createElement('aside');
    this.sidebar.setAttribute('aria-label', `Entries for ${doorData.topic}`);
    this.sidebar.style.cssText = `
      position: fixed;
      right: 0;
      top: 20px;
      box-sizing: border-box;
      width: min(360px, calc(100vw - 40px));
      max-height: calc(100vh - 40px);
      background: #1e293b;
      color: white;
      padding: 24px;
      overflow-y: auto;
      z-index: 2001;
    `;

    this.sidebar.innerHTML = `
      <h2
        id="door-panel-drag-handle"
        style="margin-top:0;margin-bottom:24px;font-size:20px;border-bottom:1px solid #374151;padding-bottom:12px;cursor:grab;touch-action:none;user-select:none;">
        ${this.escapeHtml(doorData.topic)}
      </h2>

      <button
        id="door-close-btn"
        type="button"
        style="width:100%;margin-bottom:24px;padding:8px 12px;border:1px solid #475569;background:#334155;color:white;border-radius:6px;font-size:14px;cursor:pointer;">
        ← Back to village
      </button>

      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button
          id="door-open-notes-btn"
          type="button"
          style="flex:1;padding:8px;border:1px solid #0891b2;background:#164e63;color:white;border-radius:6px;font-size:13px;cursor:pointer;">
          Open notes file
        </button>
        <button
          id="door-save-notes-btn"
          type="button"
          style="flex:1;padding:8px;border:1px solid #0891b2;background:#164e63;color:white;border-radius:6px;font-size:13px;cursor:pointer;">
          Save notes file
        </button>
      </div>
      <input id="door-notes-file-input" type="file" accept=".json,application/json" style="display:none;">
      <p style="margin:-12px 0 20px;color:#94a3b8;font-size:12px;">Notes are saved in a JSON file, not browser storage.</p>
      
      <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #374151;">
        <label style="display:block;font-size:14px;font-weight:600;color:#9ca3af;margin-bottom:8px;">Description</label>
        <textarea 
          id="door-description"
          rows="4"
          style="width:100%;padding:8px;margin-top:4px;border:1px solid #374151;background:#0f172a;color:white;font-size:14px;border-radius:6px;resize:vertical;"
          placeholder="Enter description..."></textarea>
      </div>
      
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #374151;">
        <label style="display:block;font-size:14px;font-weight:600;color:#9ca3af;margin-bottom:8px;">Upload File</label>
        <input 
          type="file"
          id="door-file-upload"
          style="width:100%;padding:8px;margin-top:4px;border:1px solid #374151;background:#0f172a;color:white;font-size:14px;border-radius:6px;"
          accept=".json,.txt,.md"></input>
      </div>
      
      <div style="margin-top:24px;">
        <button 
          id="door-save-btn"
          type="button"
          style="width:100%;padding:8px;border:1px solid #10b981;background:#059669;color:white;border-radius:6px;font-size:14px;cursor:pointer;">
          Save Entry
        </button>
      </div>
      
      <p id="door-entry-status" role="status" style="min-height:18px;color:#67e8f9;font-size:12px;"></p>
      <div id="door-saved-entries" style="margin-top:24px;max-height:30vh;overflow-y:auto;">
      </div>
    `;

    this.dragHandle = this.sidebar.querySelector('#door-panel-drag-handle');
    this.dragHandle.addEventListener('pointerdown', this.onPanelPointerDown);
    this.dragHandle.addEventListener('pointermove', this.onPanelPointerMove);
    this.dragHandle.addEventListener('pointerup', this.onPanelPointerUp);
    this.dragHandle.addEventListener('pointercancel', this.onPanelPointerUp);
    this.closeBtn = this.sidebar.querySelector('#door-close-btn');
    this.closeBtn.addEventListener('click', () => this.close());
    this.openNotesButton = this.sidebar.querySelector('#door-open-notes-btn');
    this.openNotesButton.addEventListener('click', () => {
      this.openNotesFile().catch(error => this.setEntryStatus(`Unable to open notes: ${error.message}`, true));
    });
    this.saveNotesButton = this.sidebar.querySelector('#door-save-notes-btn');
    this.saveNotesButton.addEventListener('click', () => {
      this.saveNotesFile().catch(error => this.setEntryStatus(`Unable to save notes: ${error.message}`, true));
    });
    this.notesFileInput = this.sidebar.querySelector('#door-notes-file-input');
    this.notesFileInput.addEventListener('change', this.onNotesFileSelected);
    this.saveBtn = this.sidebar.querySelector('#door-save-btn');
    this.saveBtn.addEventListener('click', () => {
      this.saveEntry().catch(error => {
        this.setEntryStatus(`Unable to save entry: ${error.message}`, true);
      });
    });

    this.descriptionInput = this.sidebar.querySelector('#door-description');
    this.fileInput = this.sidebar.querySelector('#door-file-upload');
    this.entryStatus = this.sidebar.querySelector('#door-entry-status');
    this.savedEntriesDiv = this.sidebar.querySelector('#door-saved-entries');
    this.loadSavedEntries();

    this.navigationHint = document.createElement('div');
    this.navigationHint.textContent = 'Drag to orbit · Right-drag to pan · Scroll to zoom';
    this.navigationHint.style.cssText = `
      position:absolute;
      left:16px;
      bottom:16px;
      padding:10px 14px;
      border:1px solid rgba(103,232,249,.4);
      border-radius:8px;
      background:rgba(8,24,39,.8);
      color:#a5f3fc;
      font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      pointer-events:none;
    `;
    this.element.appendChild(this.navigationHint);
    
    document.getElementById('threejs-page').appendChild(this.element);
    document.body.appendChild(this.sidebar);
    
    this.initThree();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 8, 24);
    this.camera.lookAt(this.cameraTarget);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    this.scene.add(dirLight);

    this.entryPanels = new THREE.Group();
    this.entryPanels.name = 'Saved entry holograms';
    this.scene.add(this.entryPanels);
    this.renderEntryPanels(this.getSavedEntries());
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;

    this.cameraSpherical = new THREE.Spherical().setFromVector3(
      this.camera.position.clone().sub(this.cameraTarget)
    );
    this.canvas.addEventListener('pointerdown', this.onCameraPointerDown);
    this.canvas.addEventListener('pointermove', this.onCameraPointerMove);
    this.canvas.addEventListener('pointerup', this.onCameraPointerUp);
    this.canvas.addEventListener('pointercancel', this.onCameraPointerUp);
    this.canvas.addEventListener('wheel', this.onCameraWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.onCameraContextMenu);
    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  animate() {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(() => this.animate());
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  onCameraPointerDown = event => {
    if (event.button !== 0 && event.button !== 2) return;
    this.isCameraDragging = true;
    this.cameraPointerId = event.pointerId;
    this.cameraPanMode = event.button === 2;
    this.lastPointer.set(event.clientX, event.clientY);
    this.canvas.setPointerCapture(event.pointerId);
  };

  onCameraPointerMove = event => {
    if (!this.isCameraDragging || event.pointerId !== this.cameraPointerId) return;
    const deltaX = event.clientX - this.lastPointer.x;
    const deltaY = event.clientY - this.lastPointer.y;
    this.lastPointer.set(event.clientX, event.clientY);

    if (this.cameraPanMode) {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
      const panScale = this.cameraSpherical.radius * 0.0015;
      this.cameraTarget.addScaledVector(right, -deltaX * panScale);
      this.cameraTarget.addScaledVector(up, deltaY * panScale);
    } else {
      this.cameraSpherical.theta -= deltaX * 0.006;
      this.cameraSpherical.phi = THREE.MathUtils.clamp(
        this.cameraSpherical.phi - deltaY * 0.006,
        0.12,
        Math.PI - 0.12
      );
    }
    this.updateCamera();
  };

  onCameraPointerUp = event => {
    if (!this.isCameraDragging || (event.pointerId !== undefined && event.pointerId !== this.cameraPointerId)) return;
    this.isCameraDragging = false;
    if (this.canvas.hasPointerCapture(this.cameraPointerId)) {
      this.canvas.releasePointerCapture(this.cameraPointerId);
    }
    this.cameraPointerId = null;
  };

  onCameraWheel = event => {
    event.preventDefault();
    this.cameraSpherical.radius = THREE.MathUtils.clamp(
      this.cameraSpherical.radius + event.deltaY * 0.025,
      6,
      180
    );
    this.updateCamera();
  };

  onCameraContextMenu = event => event.preventDefault();

  updateCamera() {
    this.camera.position.setFromSpherical(this.cameraSpherical).add(this.cameraTarget);
    this.camera.lookAt(this.cameraTarget);
  }

  onPanelPointerDown = event => {
    if (event.button !== 0) return;
    const bounds = this.sidebar.getBoundingClientRect();
    this.sidebar.style.left = `${bounds.left}px`;
    this.sidebar.style.top = `${bounds.top}px`;
    this.sidebar.style.right = 'auto';
    this.dragStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: bounds.left,
      top: bounds.top
    };
    this.dragHandle.style.cursor = 'grabbing';
    this.dragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  onPanelPointerMove = event => {
    if (!this.dragStart || event.pointerId !== this.dragStart.pointerId) return;
    const maxLeft = Math.max(0, window.innerWidth - this.sidebar.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - Math.min(this.sidebar.offsetHeight, window.innerHeight));
    const left = THREE.MathUtils.clamp(
      this.dragStart.left + event.clientX - this.dragStart.x,
      0,
      maxLeft
    );
    const top = THREE.MathUtils.clamp(
      this.dragStart.top + event.clientY - this.dragStart.y,
      0,
      maxTop
    );
    this.sidebar.style.left = `${left}px`;
    this.sidebar.style.top = `${top}px`;
  };

  onPanelPointerUp = event => {
    if (!this.dragStart || event.pointerId !== this.dragStart.pointerId) return;
    if (this.dragHandle.hasPointerCapture(event.pointerId)) {
      this.dragHandle.releasePointerCapture(event.pointerId);
    }
    this.dragStart = null;
    this.dragHandle.style.cursor = 'grab';
  };

  onResize = () => {
    if (this.disposed) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (this.sidebar.style.left) {
      const maxLeft = Math.max(0, window.innerWidth - this.sidebar.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - Math.min(this.sidebar.offsetHeight, window.innerHeight));
      this.sidebar.style.left = `${THREE.MathUtils.clamp(parseFloat(this.sidebar.style.left), 0, maxLeft)}px`;
      this.sidebar.style.top = `${THREE.MathUtils.clamp(parseFloat(this.sidebar.style.top), 0, maxTop)}px`;
    }
    this.renderEntryPanels(this.getSavedEntries());
  };

  close() {
    if (this.disposed) return;
    this.dispose();
    this.onClose?.();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('pointerdown', this.onCameraPointerDown);
    this.canvas.removeEventListener('pointermove', this.onCameraPointerMove);
    this.canvas.removeEventListener('pointerup', this.onCameraPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onCameraPointerUp);
    this.canvas.removeEventListener('wheel', this.onCameraWheel);
    this.canvas.removeEventListener('contextmenu', this.onCameraContextMenu);
    this.dragHandle.removeEventListener('pointerdown', this.onPanelPointerDown);
    this.dragHandle.removeEventListener('pointermove', this.onPanelPointerMove);
    this.dragHandle.removeEventListener('pointerup', this.onPanelPointerUp);
    this.dragHandle.removeEventListener('pointercancel', this.onPanelPointerUp);
    this.notesFileInput.removeEventListener('change', this.onNotesFileSelected);
    this.scene?.traverse(object => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if (!material) return;
        material.map?.dispose();
        material.dispose();
      });
    });
    this.renderer?.dispose();
    this.element.remove();
    this.sidebar.remove();
  }

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  }

  async saveEntry() {
    const description = this.descriptionInput.value.trim();
    const file = this.fileInput.files[0];
    if (!description && !file) {
      this.setEntryStatus('Add a description or choose a file first.', true);
      return;
    }

    const fileContent = file ? await file.text() : '';
    const entries = this.getSavedEntries();
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topic: String(this.doorData.topic),
      description,
      fileName: file?.name ?? '',
      fileContent,
      createdAt: new Date().toISOString()
    };
    entries.push(newEntry);
    this.entries = entries;
    this.loadSavedEntries();
    this.renderEntryPanels(entries);
    this.descriptionInput.value = '';
    this.fileInput.value = '';
    if (this.notesFileHandle) {
      await this.writeNotesFile();
      this.setEntryStatus('Entry added and saved to the notes file.');
    } else {
      this.setEntryStatus('Entry added. Save the notes file to keep it.');
    }
  }

  getSavedEntries() {
    return this.entries;
  }

  async openNotesFile() {
    if (typeof window.showOpenFilePicker === 'function') {
      let handles;
      try {
        handles = await window.showOpenFilePicker({
          multiple: false,
          mode: 'readwrite',
          types: [{
            description: 'JSON notes',
            accept: { 'application/json': ['.json'] }
          }]
        });
      } catch (error) {
        if (error.name === 'AbortError') return;
        throw error;
      }
      if (!handles.length) return;
      const handle = handles[0];
      await this.loadNotesFile(await handle.getFile());
      this.notesFileHandle = handle;
      return;
    }
    this.notesFileInput.click();
  }

  onNotesFileSelected = async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await this.loadNotesFile(file);
    } catch (error) {
      this.setEntryStatus(`Unable to open notes: ${error.message}`, true);
    } finally {
      this.notesFileInput.value = '';
    }
  };

  async loadNotesFile(file) {
    const parsed = JSON.parse(await file.text());
    const sourceEntries = Array.isArray(parsed) ? parsed : parsed?.entries;
    if (!Array.isArray(sourceEntries)) {
      throw new Error('The JSON file must contain an entries array.');
    }
    if (!sourceEntries.every(entry =>
      entry && typeof entry === 'object' && !Array.isArray(entry) &&
      (entry.description === undefined || typeof entry.description === 'string') &&
      (entry.fileName === undefined || typeof entry.fileName === 'string') &&
      (entry.fileContent === undefined || typeof entry.fileContent === 'string')
    )) {
      throw new Error('The notes file contains an invalid entry.');
    }

    this.entries = sourceEntries.map(entry => ({
      ...entry,
      topic: typeof entry.topic === 'string' ? entry.topic : String(this.doorData.topic),
      description: entry.description ?? '',
      fileName: entry.fileName ?? '',
      fileContent: entry.fileContent ?? ''
    }));
    this.loadSavedEntries();
    this.renderEntryPanels(this.entries);
    this.setEntryStatus(`Loaded ${this.entries.length} entries from ${file.name}.`);
  }

  async saveNotesFile() {
    if (this.notesFileHandle) {
      await this.writeNotesFile();
      this.setEntryStatus(`Saved notes to ${this.notesFileHandle.name}.`);
      return;
    }

    if (typeof window.showSaveFilePicker === 'function') {
      try {
        this.notesFileHandle = await window.showSaveFilePicker({
          suggestedName: `${this.fileNameSlug(this.doorData.topic)}-notes.json`,
          types: [{
            description: 'JSON notes',
            accept: { 'application/json': ['.json'] }
          }]
        });
      } catch (error) {
        if (error.name === 'AbortError') return;
        throw error;
      }
      await this.writeNotesFile();
      this.setEntryStatus(`Saved notes to ${this.notesFileHandle.name}.`);
      return;
    }

    const blob = new Blob([this.serializeNotes()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.fileNameSlug(this.doorData.topic)}-notes.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.setEntryStatus('Downloaded the notes file.');
  }

  async writeNotesFile() {
    const permission = await this.notesFileHandle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      const requestedPermission = await this.notesFileHandle.requestPermission({ mode: 'readwrite' });
      if (requestedPermission !== 'granted') {
        throw new Error('Write permission for the selected notes file was not granted.');
      }
    }
    const writable = await this.notesFileHandle.createWritable();
    try {
      await writable.write(this.serializeNotes());
    } catch (error) {
      await writable.abort();
      throw error;
    }
    await writable.close();
  }

  serializeNotes() {
    return JSON.stringify({
      formatVersion: 1,
      topic: String(this.doorData.topic),
      entries: this.entries
    }, null, 2);
  }

  fileNameSlug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'topic';
  }

  loadSavedEntries() {
    const entries = this.getSavedEntries();
    this.savedEntriesDiv.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = `Holograms · ${entries.length}`;
    heading.style.cssText = 'margin:0 0 12px;font-size:14px;color:#67e8f9;';
    this.savedEntriesDiv.appendChild(heading);

    if (entries.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'No entries yet';
      emptyState.style.cssText = 'color:#94a3b8;font-size:12px;';
      this.savedEntriesDiv.appendChild(emptyState);
      return;
    }

    entries.forEach((entry, index) => {
      const item = document.createElement('div');
      item.style.cssText = 'background:#0f172a;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid #155e75;font-size:12px;';
      const title = document.createElement('strong');
      title.textContent = `ENTRY ${String(index + 1).padStart(2, '0')}`;
      title.style.color = '#67e8f9';
      const summary = document.createElement('p');
      summary.textContent = entry.description || entry.fileName || 'File data';
      summary.style.cssText = 'margin:6px 0;color:#e2e8f0;';
      item.append(title, summary);
      this.savedEntriesDiv.appendChild(item);
    });
  }

  setEntryStatus(message, isError = false) {
    this.entryStatus.textContent = message;
    this.entryStatus.style.color = isError ? '#fca5a5' : '#67e8f9';
  }

  renderEntryPanels(entries) {
    if (!this.entryPanels) return;
    this.entryPanels.traverse(object => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if (!material) return;
        material.map?.dispose();
        material.dispose();
      });
    });
    this.entryPanels.clear();
    if (entries.length === 0) {
      this.cameraTarget.set(0, 0, 0);
      this.camera.position.set(0, 5, 10);
      this.camera.lookAt(this.cameraTarget);
      this.syncCameraOrbit();
      return;
    }

    const panelWidth = 6.4;
    const panelHeight = 3.8;
    const gap = 0.55;
    const columns = Math.min(3, Math.ceil(Math.sqrt(entries.length * 1.6)));
    const rows = Math.ceil(entries.length / columns);
    const totalWidth = columns * panelWidth + (columns - 1) * gap;
    const totalHeight = rows * panelHeight + (rows - 1) * gap;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const availableWidthRatio = Math.max(
      0.5,
      1 - this.sidebar.clientWidth / window.innerWidth
    );
    const fitDistance = Math.max(
      totalWidth / (2 * Math.tan(horizontalFov / 2) * availableWidthRatio),
      totalHeight / (2 * Math.tan(verticalFov / 2))
    );
    const centerY = 4.5;

    entries.forEach((entry, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const rowLength = Math.min(columns, entries.length - row * columns);
      const rowWidth = rowLength * panelWidth + (rowLength - 1) * gap;
      const group = this.createEntryPanel(entry, index);
      group.position.set(
        -rowWidth / 2 + panelWidth / 2 + column * (panelWidth + gap) - 2,
        centerY + totalHeight / 2 - panelHeight / 2 - row * (panelHeight + gap),
        7.8
      );
      this.entryPanels.add(group);
    });

    const distance = Math.max(19, fitDistance * 1.2 + 7.8);
    const viewCenterX = -2 + (1 - availableWidthRatio) * Math.tan(horizontalFov / 2) * (distance - 7.8);
    this.cameraTarget.set(viewCenterX, centerY, 0);
    this.camera.position.set(viewCenterX, centerY + 3, distance);
    this.camera.lookAt(this.cameraTarget);
    this.syncCameraOrbit();
  }

  syncCameraOrbit() {
    if (!this.cameraSpherical) return;
    this.cameraSpherical.setFromVector3(this.camera.position.clone().sub(this.cameraTarget));
  }

  createEntryPanel(entry, index) {
    const width = 6.4;
    const height = 3.8;
    const depth = 0.16;
    const group = new THREE.Group();
    group.name = `Entry hologram ${index + 1}`;

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshPhysicalMaterial({
        color: 0x0b2637,
        emissive: 0x062b3d,
        emissiveIntensity: 0.8,
        metalness: 0.35,
        roughness: 0.16,
        transparent: true,
        opacity: 0.76,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    glass.renderOrder = 1;
    group.add(glass);

    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0x4deaff,
      transparent: true,
      opacity: 0.9
    });
    const edgeWidth = 0.045;
    for (const x of [-width / 2, width / 2]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, height, depth * 2), edgeMaterial.clone());
      edge.position.x = x;
      group.add(edge);
    }
    for (const y of [-height / 2, height / 2]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(width, edgeWidth, depth * 2), edgeMaterial.clone());
      edge.position.y = y;
      group.add(edge);
    }
    edgeMaterial.dispose();

    const display = document.createElement('canvas');
    display.width = 1024;
    display.height = 608;
    this.drawEntryDisplay(display, entry, index);
    const texture = new THREE.CanvasTexture(display);
    texture.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.22, height - 0.22),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false
      })
    );
    screen.position.z = depth / 2 + 0.012;
    screen.renderOrder = 2;
    group.add(screen);
    return group;
  }

  drawEntryDisplay(canvas, entry, index) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create holographic entry display');
    const width = canvas.width;
    const height = canvas.height;
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(5, 26, 43, 0.96)');
    gradient.addColorStop(0.55, 'rgba(6, 48, 67, 0.87)');
    gradient.addColorStop(1, 'rgba(5, 23, 42, 0.94)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(76, 234, 255, 0.2)';
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.fillStyle = '#67e8f9';
    context.font = '600 27px Arial, sans-serif';
    context.fillText(`MEMORY NODE  //  ${String(index + 1).padStart(2, '0')}`, 44, 58);
    context.textAlign = 'right';
    context.fillStyle = '#a5f3fc';
    context.font = '20px Arial, sans-serif';
    context.fillText('ARCHIVE: ONLINE', width - 42, 58);
    context.textAlign = 'left';
    context.fillStyle = 'rgba(103, 232, 249, 0.7)';
    context.fillRect(44, 82, width - 88, 2);

    let y = 132;
    context.fillStyle = '#f0fdff';
    context.font = '600 38px Arial, sans-serif';
    y = this.drawWrappedText(context, String(entry.topic || this.doorData.topic), 44, y, width - 88, 46, 1);
    y += 20;

    if (entry.description) {
      context.fillStyle = '#d7f7ff';
      context.font = '27px Arial, sans-serif';
      y = this.drawWrappedText(context, entry.description, 44, y, width - 88, 38, 5);
    }
    if (entry.fileName) {
      y += 18;
      context.fillStyle = '#67e8f9';
      context.font = '600 22px Arial, sans-serif';
      context.fillText(`ATTACHED FILE  /  ${entry.fileName}`, 44, y);
      y += 36;
      if (entry.fileContent) {
        context.fillStyle = '#d7f7ff';
        context.font = '22px monospace';
        this.drawWrappedText(context, entry.fileContent, 44, y, width - 88, 30, 5);
      }
    }

    context.fillStyle = 'rgba(103, 232, 249, 0.8)';
    context.font = '18px Arial, sans-serif';
    context.fillText(
      entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'RECENTLY STORED',
      44,
      height - 30
    );
    context.textAlign = 'right';
    context.fillText('NEURAL ARCHIVE  •  SECURE', width - 44, height - 30);
  }

  drawWrappedText(context, value, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(value).split(/\s+/);
    let line = '';
    let lines = 0;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > maxWidth && line) {
        context.fillText(line, x, y);
        line = word;
        y += lineHeight;
        lines++;
        if (lines >= maxLines) {
          context.fillText('…', x, y);
          return y + lineHeight;
        }
      } else {
        line = candidate;
      }
    }
    if (line && lines < maxLines) {
      context.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  }
}