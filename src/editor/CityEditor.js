import * as THREE from 'three';
import { Tower } from '../city/buildings/Tower.js';
import { ResidentialBlock } from '../city/buildings/ResidentialBlock.js';
import { Park } from '../city/buildings/Park.js';
import { FireStation } from '../city/buildings/FireStation.js';
import { PoliceStation } from '../city/buildings/PoliceStation.js';
import { Hospital } from '../city/buildings/Hospital.js';

export class CityEditor {
  constructor(scene, city, camera, canvas, onChange) {
    this.scene = scene;
    this.city = city;
    this.camera = camera;
    this.canvas = canvas;
    this.onChange = onChange;
    
    this.mode = 'select';
    this.buildingType = 'tower';
    this.roadPoints = [];
    this.previewMesh = null;
    this.previewRoad = null;
    this.selectedObject = null;
    this.hoveredObject = null;
    
    this.isDragging = false;
    this.draggedObject = null;
    this.dragStartPosition = new THREE.Vector3();
    
    this.buildingTypes = [
      { id: 'tower', name: 'Tower', icon: '🏢', color: 0x6B7280 },
      { id: 'residential', name: 'Residential', icon: '🏠', color: 0x9CA3AF },
      { id: 'park', name: 'Park', icon: '🌳', color: 0x2D5A2D },
      { id: 'fireStation', name: 'Fire Station', icon: '🚒', color: 0xEF4444 },
      { id: 'policeStation', name: 'Police Station', icon: '🚓', color: 0x3B82F6 },
      { id: 'hospital', name: 'Hospital', icon: '🏥', color: 0xEF4444 }
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
          <li>Select: Click objects to select</li>
          <li>Delete: Click to remove objects</li>
          <li>Building: Click ground to place</li>
          <li>Road: Click start, click end</li>
        </ul>
      </div>
    `;
    
    document.body.appendChild(this.panel);
    
    this.modeButtons = this.panel.querySelectorAll('.mode-btn');
    this.paletteButtons = this.panel.querySelectorAll('.palette-btn');
    this.closeBtn = this.panel.querySelector('#editor-close');
    this.saveBtn = this.panel.querySelector('#btn-save');
    this.loadBtn = this.panel.querySelector('#btn-load');
    this.clearBtn = this.panel.querySelector('#btn-clear');
    this.buildingPalette = this.panel.querySelector('#building-palette');
    this.roadPalette = this.panel.querySelector('#road-palette');
    this.roadTypeButtons = this.panel.querySelectorAll('.road-palette .palette-btn');
    
    this.roadPalette = document.createElement('div');
    this.roadPalette.id = 'road-palette';
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
  }
  
  bindEvents() {
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
    });
    
    this.paletteButtons.forEach(btn => {
      btn.addEventListener('click', () => this.setBuildingType(btn.dataset.type));
    });
    
    this.roadTypeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.setRoadType(btn.dataset.type));
    });
    
    this.closeBtn.addEventListener('click', () => {
      this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
    });
    
    this.saveBtn.addEventListener('click', () => this.saveCity());
    this.loadBtn.addEventListener('click', () => this.loadCity());
    this.clearBtn.addEventListener('click', () => this.clearCity());
    
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    
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
    } else if (this.mode === 'road' && this.roadPoints.length === 1) {
      this.updateRoadPreview();
    } else if (this.isDragging) {
      this.dragObject(event);
    }
  }
  
  onMouseDown(event) {
    if (event.target !== this.canvas) return;
    
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
      this.isDragging = true;
      this.draggedObject = target;
      this.dragStartPosition.set(target.position.x, target.position.y, target.position.z);
    }
  }
  
  onMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedObject = null;
    }
  }
  
  dragObject(event) {
    if (!this.draggedObject) return;
    
    const intersect = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
    
    this.draggedObject.position.set(intersect.x, 0, intersect.z);
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
      this.roadPoints.push(groundHit.point.clone());
      
      if (this.roadPoints.length === 1) {
        this.createRoadPreview(this.roadPoints[0]);
      } else if (this.roadPoints.length === 2) {
        this.createRoad(this.roadPoints[0], this.roadPoints[1]);
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
    info.innerHTML = `
      <strong>${data.editorType || 'Object'}</strong><br>
      Position: ${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)}<br>
      ${data.buildingType ? `Type: ${data.buildingType}` : ''}
      ${data.roadType ? `Road: ${data.roadType}` : ''}
    `;
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
        if (material && !sharedMaterials.has(material)) material.dispose();
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
        building.generate(position.x, position.z, 40 + Math.random() * 80);
        break;
      case 'residential':
        building = new ResidentialBlock(this.city.materials);
        building.generate(position.x, position.z);
        break;
      case 'park':
        building = new Park(this.city.materials);
        building.generate(position.x, position.z, 30 + Math.random() * 30);
        break;
      case 'fireStation':
        building = new FireStation(this.city.materials);
        building.generate(position.x, position.z);
        break;
      case 'policeStation':
        building = new PoliceStation(this.city.materials);
        building.generate(position.x, position.z);
        break;
      case 'hospital':
        building = new Hospital(this.city.materials);
        building.generate(position.x, position.z);
        break;
    }
    
    if (building) {
      building.mesh.userData = { 
        selectable: true, 
        editorObject: true, 
        editorType: 'Building',
        buildingType: type 
      };
      this.scene.add(building.mesh);
      this.city.buildings.push(building);
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
    if (!this.previewRoad || this.roadPoints.length !== 1) return;
    
    const intersect = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
    
    if (this.previewRoadLine) this.scene.remove(this.previewRoadLine);
    
    const points = [this.roadPoints[0], intersect];
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
  
  createRoad(start, end) {
    const road = new THREE.Group();
    road.userData = { 
      selectable: true, 
      editorObject: true, 
      editorType: 'Road',
      roadType: this.roadType || 'street' 
    };
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();
    
    const angle = Math.atan2(direction.x, direction.z);
    
    const width = 16;
    const roadGeom = new THREE.BoxGeometry(width, 0.25, length);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9, metalness: 0.02, flatShading: true });
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.rotation.y = angle;
    roadMesh.position.set(
      (start.x + end.x) / 2,
      0.125,
      (start.z + end.z) / 2
    );
    roadMesh.receiveShadow = true;
    road.add(roadMesh);
    
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.7, emissive: 0xf59e0b, emissiveIntensity: 0.3, flatShading: true });
    const centerLineGeom = new THREE.BoxGeometry(0.2, 0.16, length);
    const centerLine = new THREE.Mesh(centerLineGeom, lineMat);
    centerLine.rotation.y = angle;
    centerLine.position.set(0, 0.2, 0);
    road.add(centerLine);
    
    road.position.set((start.x + end.x) / 2, 0, (start.z + end.z) / 2);
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
    const data = {
      buildings: this.city.buildings.map(b => ({
        type: b.mesh.userData.buildingType,
        position: b.mesh.position.toArray(),
        rotation: b.mesh.rotation.toArray()
      })),
      roads: this.city.roads.map(r => {
        const pos = r.position.toArray();
        const rot = r.rotation.toArray();
        return { position: pos, rotation: rot };
      }),
      timestamp: Date.now()
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
      
      parsed.buildings.forEach(b => {
        this.createBuilding(b.type, new THREE.Vector3(...b.position));
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
  
  update() {
    if (this.selectionOutline) this.selectionOutline.update();
    if (this.previewRoad && this.mode === 'road' && this.roadPoints.length === 1) {
      this.updateRoadPreview();
    }
  }
}