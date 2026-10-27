import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';
import { CSS2DObject } from '../lib/CSS2DRenderer.js';

export class SelectionManager {
  constructor(scene, camera, city) {
    this.scene = scene;
    this.camera = camera;
    this.city = city;
    
    this.selectedObject = null;
    this.selectedType = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.ring = null;
    this.label = null;
    this.labelElement = null;
    this.labelObject = null;
    
    this.hoveredObject = null;
    this.hoverRing = null;
    
    this.initRing();
    this.initLabel();
    this.bindEvents();
  }
  
  initRing() {
    const geometry = new THREE.RingGeometry(8, 10, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    this.ring = new THREE.Mesh(geometry, material);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    this.scene.add(this.ring);
    
    const hoverGeometry = new THREE.RingGeometry(8, 9.5, 32);
    const hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    this.hoverRing = new THREE.Mesh(hoverGeometry, hoverMaterial);
    this.hoverRing.rotation.x = -Math.PI / 2;
    this.hoverRing.visible = false;
    this.scene.add(this.hoverRing);
  }
  
  initLabel() {
    this.labelElement = document.createElement('div');
    this.labelElement.className = 'label-badge';
    this.labelObject = new CSS2DObject(this.labelElement);
    this.labelObject.visible = false;
    this.scene.add(this.labelObject);
  }
  
  bindEvents() {
    document.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    document.addEventListener('pointermove', (e) => this.onPointerMove(e));
  }
  
  getCamera() {
    return this.camera;
  }
  
  onPointerDown(event) {
    if (event.target.closest('.panel, .area-btn, .weather-btn, .table-tab, .tracker-item, .table-row, .search-box input, .day-night-toggle, .user-menu')) {
      return;
    }
    
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    if (this.camera) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
    }
    
    const objects = this.getSelectableObjects();
    const intersects = this.raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      const userData = object.userData;
      if (userData.selectable) {
        this.select(userData.entity, userData.type);
      }
    } else {
      this.deselect();
    }
  }
  
  onPointerMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    if (this.camera) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
    }
    
    const objects = this.getSelectableObjects();
    const intersects = this.raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      const userData = object.userData;
      if (userData.selectable && userData.entity !== this.hoveredObject) {
        this.hover(userData.entity, userData.type);
      }
    } else {
      this.unhover();
    }
  }
  
  getSelectableObjects() {
    const objects = [];
    this.scene.traverse((obj) => {
      if (obj.userData.selectable) {
        objects.push(obj);
      }
    });
    return objects;
  }
  
  select(entity, type) {
    this.deselect();
    
    this.selectedObject = entity;
    this.selectedType = type;
    
    const position = entity.getPosition ? entity.getPosition() : entity.position.clone();
    
    this.ring.position.copy(position);
    this.ring.position.y = 0.5;
    this.ring.scale.setScalar(entity.getRingScale ? entity.getRingScale() : 1);
    this.ring.visible = true;
    
    this.updateLabel(entity, type);
    this.labelObject.visible = true;
  }
  
  deselect() {
    this.selectedObject = null;
    this.selectedType = null;
    this.ring.visible = false;
    this.labelObject.visible = false;
  }
  
  hover(entity, type) {
    this.unhover();
    this.hoveredObject = entity;
    
    const position = entity.getPosition ? entity.getPosition() : entity.position.clone();
    this.hoverRing.position.copy(position);
    this.hoverRing.position.y = 0.5;
    this.hoverRing.scale.setScalar(entity.getRingScale ? entity.getRingScale() : 1);
    this.hoverRing.visible = true;
  }
  
  unhover() {
    if (this.hoveredObject && this.hoveredObject !== this.selectedObject) {
      this.hoverRing.visible = false;
      this.hoveredObject = null;
    }
  }
  
  updateLabel(entity, type) {
    let label = '';
    let className = 'label-badge';
    
    switch (type) {
      case 'incident':
        label = `${entity.id} - ${entity.type}`;
        className += ' incident';
        break;
      case 'unit':
        label = `${entity.id} - ${entity.type} (${entity.status})`;
        className += ' unit';
        break;
      case 'station':
        label = entity.name;
        className += ' station';
        break;
    }
    
    this.labelElement.textContent = label;
    this.labelElement.className = className;
    
    const position = entity.getPosition ? entity.getPosition() : entity.position.clone();
    this.labelObject.position.copy(position);
    this.labelObject.position.y += (entity.getRingScale ? entity.getRingScale() : 1) * 10 + 15;
  }
  
  update(delta, elapsed) {
    if (this.ring.visible) {
      this.ring.rotation.z += delta * 0.5;
      this.ring.material.opacity = 0.6 + Math.sin(elapsed * 3) * 0.2;
    }
    
    if (this.hoverRing.visible) {
      this.hoverRing.rotation.z -= delta * 0.3;
    }
    
    if (this.selectedObject) {
      this.updateLabel(this.selectedObject, this.selectedType);
    }
  }
  
  getSelected() {
    return { object: this.selectedObject, type: this.selectedType };
  }
}