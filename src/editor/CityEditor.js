import * as THREE from 'three';
import { Tower } from '../city/buildings/Tower.js';
import { ResidentialBlock } from '../city/buildings/ResidentialBlock.js';
import { Park } from '../city/buildings/Park.js';
import { FireStation } from '../city/buildings/FireStation.js';
import { PoliceStation } from '../city/buildings/PoliceStation.js';
import { Hospital } from '../city/buildings/Hospital.js';
import { createRoadRibbonGeometry } from '../city/terrain/RoadGeometry.js';

export class CityEditor {
  static TRACK_ROAD_SPACING = 100;
  static TRACK_HOUSE_SPACING = 50;

  constructor(scene, city, camera, canvas, onChange, cameraController = null, tracksData = null, currentTrack = 'frontend', dayNightCycle = null) {
    this.scene = scene;
    this.city = city;
    this.camera = camera;
    this.canvas = canvas;
    this.onChange = onChange;
    this.cameraController = cameraController;
    this.trackData = tracksData?.[currentTrack] ?? null;
    this.dayNightCycle = dayNightCycle;
    
    this.mode = 'select';
    this.buildingType = 'tower';
    this.roadPoints = [];
    this.previewMesh = null;
    this.previewRoad = null;
    this.selectedObject = null;
    this.hoveredObject = null;
    this.currentTrack = currentTrack; // Store the current track
    
    // Track definitions: which building types are relevant for each track
    this.tracks = {
      "frontend": ["tower", "park"],
      "backend": ["fireStation", "policeStation"],
      "gen-ai": ["hospital"],
      "cloud": ["tower"],
      "system-design": ["tower", "residential", "park"]
    };
    
    this.isDragging = false;
    this.draggedObject = null;
    this.dragStartPosition = new THREE.Vector3();
    this.dragOffset = new THREE.Vector3();
    this.dragStartPointer = new THREE.Vector2();
    this.hasDragged = false;
    this.suppressNextClick = false;
    this.roadType = 'small';
    
    this.buildingTypes = [
      { id: 'tower', name: 'Tower', icon: '🏢', color: 0x6B7280 },
      { id: 'residential', name: 'Residential', icon: '🏠', color: 0x9CA3AF },
      { id: 'park', name: 'Park', icon: '🌳', color: 0x2D5A2D },
      { id: 'fireStation', name: 'Fire Station', icon: '🚒', color: 0xEF4444 },
      { id: 'policeStation', name: 'Police Station', icon: '🚓', color: 0x3B82F6 },
      { id: 'hospital', name: 'Hospital', icon: '🏥', color: 0xEF4444 },
      { id: 'cottage', name: 'Cottage', icon: '🏡', color: 0x8B5CF6 },
      { id: 'barn', name: 'Barn', icon: '🐄', color: 0x8B5CF6 },
      { id: 'silo', name: 'Silo', icon: '🌾', color: 0x8B5CF6 },
      { id: 'windmill', name: 'Windmill', icon: '🌬️', color: 0x8B5CF6 },
      { id: 'well', name: 'Well', icon: '💧', color: 0x8B5CF6 }
    ];
    
    this.roadTypes = [
      { id: 'main', name: 'Main Road', icon: '🛣️', color: 0xEF4444 },
      { id: 'small', name: 'Small Road', icon: '🛣️', color: 0xF97316 },
      { id: 'curved', name: 'Curved Road', icon: '🛣️', color: 0xEC4899 },
      { id: 'diversion', name: 'Diversion', icon: '🛣️', color: 0x8B5CF6 }
    ];
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    
    this.initUI();
    this.bindEvents();
    this.createTrackLayout();
  }

  createTrackLayout() {
    const categories = this.trackData?.categories;
    if (!Array.isArray(categories)) {
      throw new Error(`Track "${this.currentTrack}" has no categories`);
    }

    const roadSpacing = CityEditor.TRACK_ROAD_SPACING;
    const firstRoadZ = -((categories.length - 1) * roadSpacing) / 2;

    categories.forEach((category, categoryIndex) => {
      if (!Array.isArray(category.topics)) {
        throw new Error(`Track category "${category.name}" has no topics`);
      }

      const topics = category.topics;
      const roadZ = firstRoadZ + categoryIndex * roadSpacing;
      const housePairs = Math.ceil(topics.length / 2);
      const roadLength = Math.max(80, 2 * (28 + (housePairs - 1) * CityEditor.TRACK_HOUSE_SPACING) + 32);
      const road = new THREE.Group();
      road.userData = {
        selectable: true,
        editorObject: true,
        editorType: 'Road',
        roadType: 'neighborhood',
        track: this.currentTrack,
        category: category.name
      };

      const vergeMaterial = new THREE.MeshStandardMaterial({
        color: 0xB49A70,
        roughness: 1
      });
      const villageRoadMaterial = new THREE.MeshStandardMaterial({
        color: 0x756047,
        roughness: 1
      });
      for (const vergeX of [-4.25, 4.25]) {
        const verge = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.12, roadLength),
          vergeMaterial
        );
        verge.position.set(vergeX, 0.06, 0);
        verge.receiveShadow = true;
        road.add(verge);
      }

      const roadSurface = new THREE.Mesh(
        new THREE.BoxGeometry(roadLength, 0.2, 7),
        villageRoadMaterial
      );
      roadSurface.position.y = 0.15;
      roadSurface.receiveShadow = true;
      road.add(roadSurface);

      road.position.z = roadZ;
      this.scene.add(road);
      this.city.roads.push(road);

      topics.forEach((topic, topicIndex) => {
        const x = (topicIndex % 2 === 0 ? -1 : 1) * (28 + Math.floor(topicIndex / 2) * CityEditor.TRACK_HOUSE_SPACING);
        const side = topicIndex % 2 === 0 ? -1 : 1;
        const house = this.createTrackHouse(topic, category, x, roadZ + side * 11.5);
        house.rotation.y = side > 0 ? Math.PI : 0;
        this.scene.add(house);
        this.city.buildings.push({ mesh: house });
      });
    });
  }

  createTrackHouse(topic, category, x, z) {
    const house = new THREE.Group();
    const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
    const floorCount = 3 + subtopics.length;
    const houseHeight = 9;
    const roofHeight = 4.5;
    house.position.set(x, 0, z);
    house.userData = {
      selectable: true,
      editorObject: true,
      editorType: 'House',
      buildingType: 'topicHouse',
      track: this.currentTrack,
      category: category.name,
      topic: topic.name,
      subtopics,
      floors: floorCount
    };

    const wallPalette = [0xD7BC91, 0xC98D68, 0xE4D4A8, 0xC9B6A0];
    const topicColor = Array.from(String(topic.name)).reduce(
      (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
      0
    );
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: wallPalette[topicColor % wallPalette.length],
      roughness: 0.95,
      flatShading: true
    });
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: [0x8B4938, 0x66513E, 0x6C493D][topicColor % 3],
      roughness: 0.95,
      flatShading: true
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(13, houseHeight, 12),
      wallMaterial
    );
    body.position.y = houseHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(9.5, roofHeight, 4),
      roofMaterial
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = houseHeight + roofHeight / 2;
    roof.castShadow = true;
    house.add(roof);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 4.2, 0.2),
      this.city.materials.buildingDark
    );
    door.position.set(0, 2.1, 6.1);
    house.add(door);

    const windowGeometry = new THREE.BoxGeometry(2.2, 2, 0.2);
    for (const windowX of [-4, 4]) {
      const windowMesh = new THREE.Mesh(windowGeometry, this.city.materials.windowLit);
      windowMesh.position.set(windowX, 4.5, 6.1);
      house.add(windowMesh);
    }

    const frontPath = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.12, 4),
      new THREE.MeshStandardMaterial({ color: 0xB49A70, roughness: 1 })
    );
    frontPath.position.set(0, 0.06, 4.5);
    frontPath.receiveShadow = true;
    house.add(frontPath);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 144;
    const context = labelCanvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create topic label canvas');
    }

    context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
    context.font = '600 42px Arial, sans-serif';

    const words = String(topic.name).split(/\s+/);
    let lines = [];
    for (let fontSize = 42; fontSize >= 24; fontSize -= 2) {
      context.font = `600 ${fontSize}px Arial, sans-serif`;
      lines = [];
      let line = '';

      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width > labelCanvas.width - 48 && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
      if (lines.length <= 2) break;
    }

    if (lines.length > 2) {
      lines = [lines[0], `${lines[1].slice(0, 24)}...`];
    }
    context.fillStyle = '#FFFFFF';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '600 72px Arial, sans-serif';
    const lineHeight = 82;
    const firstLineY = labelCanvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      context.fillText(line, labelCanvas.width / 2, firstLineY + index * lineHeight, labelCanvas.width - 48);
    });

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      depthWrite: false
    });
    labelMaterial.userData.ownedMap = true;
    const label = new THREE.Sprite(labelMaterial);
    label.name = `Topic: ${topic.name} (${floorCount}F)`;
    label.position.set(0, houseHeight + roofHeight + 3, 0);
    label.scale.set(19, 5.35, 1);
    house.add(label);

    return house;
  }
  
  initUI() {
    this.panel = document.createElement('div');
    this.panel.id = 'editor-panel';
    this.panel.style.cssText = `
      position: fixed;
      left: 16px;
      bottom: 16px;
      width: 280px;
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    this.panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
        <h3 style="margin:0;font-size:14px;font-weight:600;">City Editor</h3>
        <button id="editor-close" style="background:none;border:none;color:#9CA3AF;cursor:pointer;font-size:18px;line-height:1;">×</button>
      </div>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;font-weight:600;color:#9CA3AF;margin-bottom:8px;">Mode</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button data-mode="select" class="mode-btn active" style="padding:10px;border:1px solid #EF4444;background:#EF4444;color:white;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Select</button>
          <button data-mode="delete" class="mode-btn" style="padding:10px;border:1px solid #374151;background:#1F2937;color:#9CA3AF;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Delete</button>
          <button data-mode="building" class="mode-btn" style="padding:10px;border:1px solid #374151;background:#1F2937;color:#9CA3AF;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Building</button>
          <button data-mode="road" class="mode-btn" style="padding:10px;border:1px solid #374151;background:#1F2937;color:#9CA3AF;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Road</button>
        </div>
      </div>
      
      <div id="building-palette" style="display:none;margin-bottom:16px;">
        <label style="display:block;font-size:12px;font-weight:600;color:#9CA3AF;margin-bottom:8px;">Building Type</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
          ${this.buildingTypes.map(bt => `
            <button data-type="${bt.id}" class="palette-btn" style="padding:8px;border:1px solid #374151;background:#1F2937;color:white;border-radius:6px;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;" title="${bt.name}">
              <span style="font-size:18px;">${bt.icon}</span>
              <span>${bt.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
      
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button id="btn-save" style="flex:1;padding:10px;border:1px solid #374151;background:#1F2937;color:white;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Save City</button>
        <button id="btn-load" style="flex:1;padding:10px;border:1px solid #374151;background:#1F2937;color:white;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Load City</button>
      </div>
      
      <button id="btn-clear" style="width:100%;padding:10px;border:1px solid #7F1D1D;background:#7F1D1D;color:white;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Clear All (Reset)</button>
      
<div style="margin-top:12px;padding:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;font-size:11px;color:#FCA5A5;">
        <strong>Tips:</strong>
        <ul style="margin:4px 0 0 0;padding-left:16px;">
          <li>Select: Click to select, drag to move</li>
          <li>Delete: Click to remove objects</li>
          <li>Building: Click ground to place</li>
          <li>Road: Click start and end</li>
          <li>Curved road: Click start, bend, and end</li>
        </ul>
      </div>
      <button id="btn-daynight" style="width:100%;padding:10px;border:1px solid rgba(220,38,38,0.3);background:#7F1D1D;color:white;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;">Toggle Day/Night</button>
    `;
    
    document.body.appendChild(this.panel);
    
    this.modeButtons = this.panel.querySelectorAll('.mode-btn');
    this.closeBtn = this.panel.querySelector('#editor-close');
    this.saveBtn = this.panel.querySelector('#btn-save');
    this.loadBtn = this.panel.querySelector('#btn-load');
    this.clearBtn = this.panel.querySelector('#btn-clear');
    this.buildingPalette = this.panel.querySelector('#building-palette');
    this.paletteButtons = this.buildingPalette.querySelectorAll('.palette-btn');
    this.roadPalette = this.panel.querySelector('#road-palette');
    this.roadPalette = document.createElement('div');
    this.roadPalette.id = 'road-palette';
    this.roadPalette.className = 'road-palette';
    this.roadPalette.style.cssText = `
      display:none;
      margin-bottom:16px;
    `;
    this.roadPalette.innerHTML = `
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;font-weight:600;color:#9CA3AF;margin-bottom:8px;">Road Type</label>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
          ${this.roadTypes.map(rt => `
            <button data-type="${rt.id}" class="palette-btn" style="padding:8px;border:1px solid #374151;background:#1F2937;color:white;border-radius:6px;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;" title="${rt.name}">
              <span style="font-size:18px;">${rt.icon}</span>
              <span>${rt.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    this.panel.appendChild(this.roadPalette);
    this.roadTypeButtons = this.roadPalette.querySelectorAll('.palette-btn');
    this.setRoadType(this.roadType);
  }
  
bindEvents() {
    // Check if panel exists
    if (!this.panel) {
        console.error('Panel not created yet');
        return;
    }
    
    this.modeButtons = this.panel.querySelectorAll('.mode-btn');
    this.paletteButtons = this.panel.querySelectorAll('.palette-btn');
    this.closeBtn = this.panel.querySelector('#editor-close');
    this.saveBtn = this.panel.querySelector('#btn-save');
    this.loadBtn = this.panel.querySelector('#btn-load');
    this.clearBtn = this.panel.querySelector('#btn-clear');
    this.roadPalette = this.panel.querySelector('#road-palette');
    this.roadTypeButtons = this.panel.querySelectorAll('.road-palette .palette-btn');
    
    // Add event listeners only if elements exist
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
      });
    }
    
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveCity());
    }
    if (this.loadBtn) {
      this.loadBtn.addEventListener('click', () => this.loadCity());
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearCity());
    }
    if (this.dayNightToggleBtn) {
      this.dayNightToggleBtn.addEventListener('click', () => this.toggleDayNight());
    }
    
    if (this.modeButtons) {
      this.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
      });
    }
    
    if (this.paletteButtons) {
      this.paletteButtons.forEach(btn => {
        btn.addEventListener('click', () => this.setBuildingType(btn.dataset.type));
      });
    }
    
    if (this.roadTypeButtons) {
      this.roadTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => this.setRoadType(btn.dataset.type));
      });
    }
    
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
      this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
      this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
      window.addEventListener('mouseup', (e) => this.onMouseUp(e));
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.setMode('select');
          this.roadPoints = [];
          this.clearPreview();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
          if (this.selectedObject) {
            e.preventDefault();
            this.deleteSelected();
          }
        }
      });
    }
  }
  
  setMode(mode) {
    this.mode = mode;
    this.roadPoints = [];
    this.clearPreview();
    
    this.modeButtons.forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.style.background = active ? '#EF4444' : '#1F2937';
      btn.style.borderColor = active ? '#EF4444' : '#374151';
      btn.style.color = active ? 'white' : '#9CA3AF';
      btn.classList.toggle('active', active);
    });
    
    this.buildingPalette.style.display = mode === 'building' ? 'block' : 'none';
    this.roadPalette.style.display = mode === 'road' ? 'block' : 'none';
  }
  
  setBuildingType(type) {
    this.buildingType = type;
    this.paletteButtons.forEach(btn => {
      const active = btn.dataset.type === type;
      btn.style.background = active ? '#EF4444' : '#1F2937';
      btn.style.borderColor = active ? '#EF4444' : '#374151';
    });
  }
  
  setRoadType(type) {
    this.roadType = type;
    this.roadTypeButtons.forEach(btn => {
      const active = btn.dataset.type === type;
      btn.style.background = active ? '#EF4444' : '#1F2937';
      btn.style.borderColor = active ? '#EF4444' : '#374151';
    });
  }
  
  onCanvasClick(event) {
    if (event.target !== this.canvas) return;
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (this.mode === 'select') {
      this.handleSelect(intersects);
    } else if (this.mode === 'delete') {
      this.handleDelete(intersects);
    } else if (this.mode === 'building') {
      this.handlePlaceBuilding(intersects);
    } else if (this.mode === 'road') {
      this.handleRoadClick(intersects);
    }
  }
  
  onMouseMove(event) {
    if (event.target !== this.canvas) return;
    
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (this.mode === 'building' && this.previewMesh) {
      this.updatePreviewPosition();
    } else if (this.mode === 'road' && this.roadPoints.length > 0) {
      this.updateRoadPreview();
    } else if (this.isDragging) {
      this.dragObject(event);
    }
  }
  
  onMouseDown(event) {
    if (event.target !== this.canvas || this.mode !== 'select' || event.button !== 0) return;
    
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let target = null;
    
    for (const hit of intersects) {
      target = this.findEditableObject(hit.object);
      if (target) {
        break;
      }
    }
    
    if (target) {
      const groundPoint = new THREE.Vector3();
      if (!this.raycaster.ray.intersectPlane(this.groundPlane, groundPoint)) return;
      this.isDragging = true;
      this.draggedObject = target;
      this.dragStartPosition.set(target.position.x, target.position.y, target.position.z);
      this.dragOffset.subVectors(target.position, groundPoint);
      this.dragStartPointer.set(event.clientX, event.clientY);
      this.hasDragged = false;
      this.cameraController?.setEnabled(false);
    }
  }

  onMouseUp(event) {
    if (this.isDragging) {
      const didDrag = this.hasDragged;
      this.isDragging = false;
      this.draggedObject = null;
      this.cameraController?.setEnabled(true);
      if (didDrag) {
        this.suppressNextClick = true;
        setTimeout(() => {
          this.suppressNextClick = false;
        }, 0);
      }
    }
  }
  
  dragObject(event) {
    if (!this.draggedObject) return;
    if (!this.hasDragged && Math.hypot(
      event.clientX - this.dragStartPointer.x,
      event.clientY - this.dragStartPointer.y
    ) < 4) return;

    this.hasDragged = true;
    
    const intersect = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, intersect)) return;
    
    this.draggedObject.position.set(
      intersect.x + this.dragOffset.x,
      this.dragStartPosition.y,
      intersect.z + this.dragOffset.z
    );
    this.onChange?.();
  }
  
  handleSelect(intersects) {
    let target = null;
    for (const hit of intersects) {
      target = this.findEditableObject(hit.object);
      if (target) {
        break;
      }
    }
    
    if (target) {
      this.selectObject(target);
    } else {
      this.deselect();
    }
  }
  
  handleDelete(intersects) {
    for (const hit of intersects) {
      const target = this.findEditableObject(hit.object);
      if (target) {
        this.deleteObject(target);
        break;
      }
    }
  }

  findEditableObject(object) {
    let current = object;
    let selectableObject = null;
    while (current) {
      if (
        current.userData.editorObject ||
        this.city.buildings.some(building => building.mesh === current) ||
        this.city.roads.some(road => road === current && road.isObject3D)
      ) {
        return current;
      }
      if (!selectableObject && current.userData.selectable) selectableObject = current;
      current = current.parent;
    }
    return selectableObject;
  }
  
  handlePlaceBuilding(intersects) {
    const groundHit = intersects.find(hit => 
      hit.object === this.city.ground?.mesh || hit.object.userData.isGround
    );
    
    if (groundHit) {
      this.createBuilding(this.buildingType, groundHit.point);
    }
  }
  
  handleRoadClick(intersects) {
    const groundHit = intersects.find(hit => 
      hit.object === this.city.ground?.mesh || hit.object.userData.isGround
    );
    
    if (groundHit) {
      const point = groundHit.point.clone();
      const previousPoint = this.roadPoints[this.roadPoints.length - 1];
      if (previousPoint && previousPoint.distanceTo(point) < 2) return;

      this.roadPoints.push(point);
      const requiredPoints = this.roadType === 'curved' ? 3 : 2;
      
      if (this.roadPoints.length === 1) {
        this.createRoadPreview(this.roadPoints[0]);
      } else if (this.roadPoints.length === requiredPoints) {
        this.createRoad(this.roadPoints);
        this.roadPoints = [];
        this.clearPreview();
        this.setMode('select');
      }
    }
  }
  
  selectObject(object) {
    this.deselect();
    this.selectedObject = object;
    
    this.selectionOutline = new THREE.BoxHelper(object, 0xEF4444);
    this.scene.add(this.selectionOutline);
    
    this.showObjectInfo(object);
  }
  
  deselect() {
    if (this.selectionOutline) {
      this.scene.remove(this.selectionOutline);
      this.selectionOutline.geometry.dispose();
      this.selectionOutline.material.dispose();
      this.selectionOutline = null;
    }
    this.selectedObject = null;
    this.hideObjectInfo();
  }
  
  showObjectInfo(object) {
    let info = this.panel.querySelector('.object-info');
    if (!info) {
      info = document.createElement('div');
      info.className = 'object-info';
      info.style.cssText = 'margin-top:12px;padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:11px;';
      this.panel.appendChild(info);
    }
    
    const data = object.userData;
    info.style.whiteSpace = 'pre-line';
    info.style.overflowWrap = 'anywhere';
    info.textContent = [
      data.editorType || 'Object',
      `Position: ${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)}`,
      data.buildingType && `Type: ${data.buildingType}`,
      data.roadType && `Road: ${data.roadType}`,
      data.category && `Category: ${data.category}`,
      data.topic && `Topic: ${data.topic}`,
      data.floors && `Floors: ${data.floors}`,
      data.subtopic && `Subtopic: ${data.subtopic}`,
      data.subtopics?.length && `Subtopics: ${data.subtopics.length}`
    ].filter(Boolean).join('\n');
  }
  
  hideObjectInfo() {
    const info = this.panel.querySelector('.object-info');
    if (info) info.remove();
  }
  
  deleteObject(object) {
    const buildingIndex = this.city.buildings.findIndex(building => building.mesh === object);
    if (buildingIndex !== -1) {
      const [building] = this.city.buildings.splice(buildingIndex, 1);
      this.city.stations = this.city.stations.filter(station => station.entity !== building);
    }

    const roadIndex = this.city.roads.indexOf(object);
    if (roadIndex !== -1) this.city.roads.splice(roadIndex, 1);

    if (this.selectedObject === object) this.deselect();

    const parent = object.parent;
    if (parent) {
      parent.remove(object);
    }

    const sharedMaterials = new Set(Object.values(this.city.materials));
    object.traverse?.((child) => {
      child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        if (material && !sharedMaterials.has(material)) {
          if (material.userData.ownedMap) material.map?.dispose();
          material.dispose();
        }
      });
    });

    this.onChange?.();
  }
  
  deleteSelected() {
    if (this.selectedObject) {
      this.deleteObject(this.selectedObject);
      this.deselect();
    }
  }
  
  createBuilding(type, position) {
    let building;
    
    switch (type) {
      case 'tower':
        building = new Tower(this.city.materials);
        building.generate(position.x, position.z);
        break;
      case 'cottage': {
        building = new THREE.Group();
        building.position.set(position.x, 0, position.z);
        building.userData = { selectable: true, editorObject: true, editorType: 'Building', buildingType: 'cottage' };
        const cottageHeight = 8 + Math.random() * 10;
        const cottageGeom = new THREE.BoxGeometry(12, cottageHeight, 12);
        const cottageMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
        const cottageMesh = new THREE.Mesh(cottageGeom, cottageMat);
        cottageMesh.position.set(0, cottageHeight / 2, 0);
        cottageMesh.castShadow = true;
        cottageMesh.receiveShadow = true;
        building.add(cottageMesh);
        // Thatched roof
        const roofGeom = new THREE.BoxGeometry(14, 4, 14);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.9, metalness: 0, flatShading: true });
        const roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(0, cottageHeight + 2, 0);
        roofMesh.castShadow = true;
        building.add(roofMesh);
        // Door
        const doorGeom = new THREE.BoxGeometry(3, 5, 0.2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6 });
        const doorMesh = new THREE.Mesh(doorGeom, cottageMat);
        doorMesh.position.set(0, 2.5, 4.1);
        building.add(doorMesh);
        // Window
        const windowGeom = new THREE.BoxGeometry(3, 3, 0.2);
        const windowMat = new THREE.MeshStandardMaterial({ color: 0xFFF3B0, emissive: 0xFFF3B0, emissiveIntensity: 0.5 });
        for (const wx of [-3, 3]) {
          const windowMesh = new THREE.Mesh(windowGeom, windowMat);
          windowMesh.position.set(wx, 4, 4.1);
          building.add(windowMesh);
        }
        break;
      }
      case 'barn': {
        building = new THREE.Group();
        building.position.set(position.x, 0, position.z);
        building.userData = { selectable: true, editorObject: true, editorType: 'Building', buildingType: 'barn' };
        const barnHeight = 12 + Math.random() * 8;
        const barnGeom = new THREE.BoxGeometry(20, barnHeight, 15);
        const barnMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
        const barnMesh = new THREE.Mesh(barnGeom, barnMat);
        barnMesh.position.set(0, barnHeight / 2, 0);
        barnMesh.castShadow = true;
        barnMesh.receiveShadow = true;
        building.add(barnMesh);
        // Roof
        const roofGeom = new THREE.BoxGeometry(22, 5, 17);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.9, metalness: 0, flatShading: true });
        const roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(0, barnHeight + 2.5, 0);
        roofMesh.castShadow = true;
        building.add(roofMesh);
        // Doors
        const doorGeom = new THREE.BoxGeometry(4, 6, 0.2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6 });
        const doorMesh1 = new THREE.Mesh(doorGeom, barnMat);
        doorMesh1.position.set(-6, 3, 7.5);
        building.add(doorMesh1);
        const doorMesh2 = new THREE.Mesh(doorGeom, barnMat);
        doorMesh2.position.set(6, 3, 7.5);
        building.add(doorMesh2);
        // Windows
        const windowGeom = new THREE.BoxGeometry(3, 3, 0.2);
        const windowMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, emissive: 0xFBBF24, emissiveIntensity: 0.3 });
        for (const wx of [-8, -4, 4, 8]) {
          for (const wz of [-5, 5]) {
            const windowMesh = new THREE.Mesh(windowGeom, windowMat);
            windowMesh.position.set(wx, 3, wz);
            building.add(windowMesh);
          }
        }
        break;
      }
      case 'silo': {
        building = new THREE.Group();
        building.position.set(position.x, 0, position.z);
        building.userData = { selectable: true, editorObject: true, editorType: 'Building', buildingType: 'silo' };
        const siloHeight = 20 + Math.random() * 15;
        const siloGeom = new THREE.BoxGeometry(8, siloHeight, 8);
        const siloMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
        const siloMesh = new THREE.Mesh(siloGeom, siloMat);
        siloMesh.position.set(0, siloHeight / 2, 0);
        siloMesh.castShadow = true;
        siloMesh.receiveShadow = true;
        building.add(siloMesh);
        // Bands
        const bandGeom = new THREE.BoxGeometry(8, 2, 8);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.8, metalness: 0.1, flatShading: true });
        for (let i = 1; i < 6; i++) {
          const bandMesh = new THREE.Mesh(bandGeom, bandMat);
          bandMesh.position.set(0, i * (siloHeight / 6), 0);
          building.add(bandMesh);
        }
        // Roof
        const roofGeom = new THREE.BoxGeometry(9, 3, 9);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.9, metalness: 0, flatShading: true });
        const roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(0, siloHeight + 2, 0);
        roofMesh.castShadow = true;
        building.add(roofMesh);
        // Ventilation shafts
        for (let i = 0; i < 4; i++) {
          const ventGeom = new THREE.BoxGeometry(1, 4, 1);
          const ventMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
          const ventMesh = new THREE.Mesh(ventGeom, ventMat);
          const angle = (i * Math.PI / 2);
          ventMesh.position.set(Math.cos(angle) * 3.5, i * (siloHeight / 6) + 2, Math.sin(angle) * 3.5);
          building.add(ventMesh);
        }
        break;
      }
      case 'windmill': {
        building = new THREE.Group();
        building.position.set(position.x, 0, position.z);
        building.userData = { selectable: true, editorObject: true, editorType: 'Building', buildingType: 'windmill' };
        const windmillHeight = 25 + Math.random() * 15;
        const windmillGeom = new THREE.BoxGeometry(12, 5, 12);
        const windmillMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
        const windmillMesh = new THREE.Mesh(windmillGeom, windmillMat);
        windmillMesh.position.set(0, 5, 0);
        windmillMesh.castShadow = true;
        building.add(windmillMesh);
        // Main post
        const postGeom = new THREE.CylinderGeometry(0.5, 0.5, windmillHeight - 5, 12);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6 });
        const postMesh = new THREE.Mesh(postGeom, postMat);
        postMesh.position.set(0, windmillHeight / 2, 0);
        windmillMesh.add(postMesh);
        // Sails
        const sailGeom = new THREE.PlaneGeometry(8, 6);
        const sailMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
        for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
          const sailMesh = new THREE.Mesh(sailGeom, sailMat);
          sailMesh.position.set(0, 12, 0);
          sailMesh.rotation.z = angle;
          windmillMesh.add(sailMesh);
        }
        // Center post
        const postGeom2 = new THREE.CylinderGeometry(0.5, 0.5, 8, 12);
        const postMesh2 = new THREE.Mesh(postGeom2, this.city.materials.buildingDark);
        postMesh2.position.set(0, 6, 0);
        windmillMesh.add(postMesh2);
        // Sail hub
        const hubGeom = new THREE.SphereGeometry(1, 12, 12);
        const hubMesh = new THREE.Mesh(new THREE.MeshBasicMaterial({ color: 0x8B5CF6 }), windmillMesh.material);
        hubMesh.position.set(0, 8, 0);
        windmillMesh.add(hubMesh);
        break;
      }
      case 'well': {
        building = new THREE.Group();
        building.position.set(position.x, 0, position.z);
        building.userData = { selectable: true, editorObject: true, editorType: 'Building', buildingType: 'well' };
        const wellHeight = 6 + Math.random() * 4;
        const wellGeom = new THREE.BoxGeometry(4, wellHeight, 4);
        const wellMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
        const wellMesh = new THREE.Mesh(wellGeom, wellMat);
        wellMesh.position.set(0, wellHeight / 2, 0);
        wellMesh.castShadow = true;
        wellMesh.receiveShadow = true;
        building.add(wellMesh);
        // Rope
        const ropeGeom = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.8, metalness: 0.1, flatShading: true });
        const ropeMesh = new THREE.Mesh(ropeGeom, ropeMat);
        ropeMesh.position.set(0, 3, 0);
        building.add(ropeMesh);
        // Bucket
        const bucketGeom = new THREE.BoxGeometry(2, 2, 2);
        const bucketMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6 });
        const bucketMesh = new THREE.Mesh(bucketGeom, wellMat);
        bucketMesh.position.set(0, 1, 0);
        building.add(bucketMesh);
        // Bucket rope
        const bucketRopeGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
        const bucketRopeMesh = new THREE.Mesh(new THREE.MeshBasicMaterial({ color: 0x8B5CF6 }), ropeMat);
        bucketRopeMesh.position.set(0, 0.5, 0);
        building.add(bucketRopeMesh);
        // Bucket pivot
        const pivotGeom = new THREE.SphereGeometry(0.5, 12, 12);
        const pivotMesh = new THREE.Mesh(new THREE.MeshBasicMaterial({ color: 0x8B5CF6 }), ropeMat);
        pivotMesh.position.set(0, 0.5, 0);
        building.add(pivotMesh);
        break;
      }
      default:
        building = new THREE.Group();
    }
    
    if (building) {
      const mesh = building.mesh ?? building;
      mesh.userData = {
        ...mesh.userData,
        selectable: true,
        editorObject: true,
        editorType: 'Building',
        buildingType: type
      };
      this.scene.add(mesh);
      this.city.buildings.push(building.mesh ? building : { mesh });
      this.onChange?.();
    }
  }
  
  createRoadPreview(startPoint) {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xEF4444, transparent: true, opacity: 0.8 });
    this.previewRoad = new THREE.Mesh(geometry, material);
    this.previewRoad.position.copy(startPoint);
    this.previewRoad.position.y = 0.5;
    this.scene.add(this.previewRoad);
  }
  
  updateRoadPreview() {
    if (!this.previewRoad || this.roadPoints.length === 0) return;
    
    const intersect = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, intersect)) return;

    if (this.previewRoadLine) {
      this.scene.remove(this.previewRoadLine);
      this.previewRoadLine.geometry.dispose();
      this.previewRoadLine.material.dispose();
    }

    let points;
    if (this.roadType === 'curved' && this.roadPoints.length === 2) {
      points = new THREE.CatmullRomCurve3([
        ...this.roadPoints,
        intersect
      ], false, 'centripetal').getPoints(32);
    } else {
      points = [this.roadPoints[0], intersect];
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xEF4444, 
      dashSize: 4, 
      gapSize: 2, 
      linewidth: 3 
    });
    this.previewRoadLine = new THREE.Line(geometry, material);
    this.previewRoadLine.computeLineDistances();
    this.scene.add(this.previewRoadLine);
  }
  
  createRoad(points) {
    const road = new THREE.Group();
    road.userData = { 
      selectable: true, 
      editorObject: true, 
      editorType: 'Road',
      roadType: this.roadType || 'small',
      path: points.map(point => point.toArray())
    };

    const origin = points[0];
    const localPoints = points.map(point => new THREE.Vector3(
      point.x - origin.x,
      0,
      point.z - origin.z
    ));
    const curve = this.roadType === 'curved'
      ? new THREE.CatmullRomCurve3(localPoints, false, 'centripetal')
      : new THREE.LineCurve3(localPoints[0], localPoints[1]);
    const length = curve.getLength();
    const segments = Math.max(2, Math.ceil(length / 4));
    const width = 16;
    const roadGeometry = createRoadRibbonGeometry(curve, width, segments, 0.13);
    const roadMesh = new THREE.Mesh(roadGeometry, this.city.materials.road);
    roadMesh.receiveShadow = true;
    road.add(roadMesh);

    const markingPoints = curve.getPoints(segments).map(point => {
      point.y = 0.15;
      return point;
    });
    const markingGeometry = new THREE.BufferGeometry().setFromPoints(markingPoints);
    const markingMaterial = new THREE.LineBasicMaterial({ color: 0xe7bd43 });
    road.add(new THREE.Line(markingGeometry, markingMaterial));

    road.position.set(origin.x, 0, origin.z);
    this.scene.add(road);
    this.city.roads.push(road);
    this.onChange?.();
  }
  
  updatePreviewPosition() {
    if (!this.previewMesh) return;
    
    const intersect = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
    
    this.previewMesh.position.set(intersect.x, 0, intersect.z);
  }
  
  clearPreview() {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh = null;
    }
    if (this.previewRoad) {
      this.scene.remove(this.previewRoad);
      this.previewRoad = null;
    }
    if (this.previewRoadLine) {
      this.scene.remove(this.previewRoadLine);
      this.previewRoadLine = null;
    }
  }
  
  saveCity() {
    const allowedTypes = this.tracks[this.currentTrack] || this.tracks['frontend'];
    const filteredBuildings = this.city.buildings.filter(b => allowedTypes.includes(b.mesh.userData.buildingType));
    
    const data = {
      buildings: filteredBuildings.map(b => ({
        type: b.mesh.userData.buildingType,
        position: b.mesh.position.toArray(),
        rotation: b.mesh.rotation.toArray()
      })),
      roads: this.city.roads.map(r => {
        const pos = r.position.toArray();
        const rot = r.rotation.toArray();
        return { position: pos, rotation: rot };
      }),
      timestamp: Date.now(),
      track: this.currentTrack
    };
    
    localStorage.setItem('siren-city', JSON.stringify(data));
    alert('City saved!');
  }
  
  loadCity() {
    const data = localStorage.getItem('siren-city');
    if (!data) {
      alert('No saved city found');
      return;
    }
    
    try {
      const parsed = JSON.parse(data);
      this.clearCity();
      
      // Only create buildings that match the current track
      const allowedTypes = this.tracks[this.currentTrack] || this.tracks['frontend'];
      parsed.buildings.forEach(b => {
        if (allowedTypes.includes(b.type)) {
          this.createBuilding(b.type, new THREE.Vector3(...b.position));
        }
      });
      
      // Also rebuild roads
      this.city.roads = [];
      parsed.roads.forEach(r => {
        this.createRoad(r.position, r.rotation);
      });
      
      alert('City loaded!');
    } catch (e) {
      alert('Failed to load: ' + e.message);
    }
  }
  
  clearCity() {
    this.city.buildings.slice().forEach(building => this.deleteObject(building.mesh));
    this.city.roads
      .filter(road => road.isObject3D)
      .forEach(road => this.deleteObject(road));

    this.onChange?.();
  }

  toggleDayNight() {
    if (this.dayNightCycle) {
      this.dayNightCycle.toggle();
    }
  }

  update() {
    if (this.selectionOutline) this.selectionOutline.update();
    if (this.previewRoad && this.mode === 'road' && this.roadPoints.length > 0) {
      this.updateRoadPreview();
    }
  }
}