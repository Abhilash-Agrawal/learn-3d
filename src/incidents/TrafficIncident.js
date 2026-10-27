import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class TrafficIncident {
  constructor(scene, city, id, position) {
    this.scene = scene;
    this.city = city;
    this.id = id;
    this.type = 'traffic';
    this.status = 'reported';
    this.vehiclesInvolved = 2 + Math.floor(Math.random() * 3);
    this.progress = 0;
    this.closeTimer = 0;
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.position.y = 0;
    this.mesh.userData = { selectable: true, entity: this, type: 'incident' };
    
    this.vehicles = [];
    this.debris = [];
    this.lights = [];
    
    this.createVisuals();
  }
  
  createVisuals() {
    const baseGeom = new THREE.CylinderGeometry(8, 10, 0.3, 12);
    const baseMesh = new THREE.Mesh(baseGeom, new THREE.MeshStandardMaterial({
      color: 0x1F2937,
      roughness: 0.9,
      flatShading: true
    }));
    baseMesh.position.y = 0.15;
    this.mesh.add(baseMesh);
    
    for (let i = 0; i < this.vehiclesInvolved; i++) {
      this.createVehicle(i);
    }
    
    for (let i = 0; i < 10; i++) {
      this.createDebris(i);
    }
    
    const colors = [0xEF4444, 0x3B82F6, 0xFBBF24];
    colors.forEach((color, i) => {
      const light = new THREE.PointLight(color, 1, 15);
      light.position.set(
        (Math.random() - 0.5) * 10,
        2,
        (Math.random() - 0.5) * 10
      );
      light.userData = { color, phase: Math.random() * Math.PI * 2 };
      this.mesh.add(light);
      this.lights.push(light);
    });
  }
  
  createVehicle(index) {
    const vehicleGroup = new THREE.Group();
    
    const bodyGeom = new THREE.BoxGeometry(2.5, 1.2, 5);
    const hue = Math.random();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.6, 0.4),
      roughness: 0.7,
      metalness: 0.3,
      flatShading: true
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = true;
    vehicleGroup.add(bodyMesh);
    
    const roofGeom = new THREE.BoxGeometry(2, 0.8, 2.5);
    const roofMesh = new THREE.Mesh(roofGeom, bodyMat);
    roofMesh.position.y = 1.6;
    vehicleGroup.add(roofMesh);
    
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1E3A8A,
      roughness: 0.1,
      metalness: 0.9,
      flatShading: true
    });
    const windowGeom = new THREE.BoxGeometry(1.8, 0.6, 0.1);
    
    const frontWindow = new THREE.Mesh(windowGeom, glassMat);
    frontWindow.position.set(0, 1.5, 1.4);
    vehicleGroup.add(frontWindow);
    
    const rearWindow = new THREE.Mesh(windowGeom, glassMat);
    rearWindow.position.set(0, 1.5, -1.4);
    vehicleGroup.add(rearWindow);
    
    const angle = (index / this.vehiclesInvolved) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const radius = 4 + Math.random() * 3;
    
    vehicleGroup.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    vehicleGroup.rotation.y = angle + Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    
    this.mesh.add(vehicleGroup);
    this.vehicles.push(vehicleGroup);
  }
  
  createDebris(index) {
    const geom = new THREE.BoxGeometry(
      0.3 + Math.random() * 0.5,
      0.1,
      0.3 + Math.random() * 0.5
    );
    const mat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.8,
      flatShading: true
    });
    const debris = new THREE.Mesh(geom, mat);
    
    debris.position.set(
      (Math.random() - 0.5) * 12,
      0.1,
      (Math.random() - 0.5) * 12
    );
    debris.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    this.mesh.add(debris);
    this.debris.push(debris);
  }
  
  update(delta, elapsed, unitManager) {
    if (this.status === 'reported' || this.status === 'dispatched') {
      this.animateLights(elapsed);
    } else if (this.status === 'onscene' || this.status === 'contained') {
      this.progress += delta * 0.08;
      this.animateLights(elapsed);
      
      if (this.progress >= 1) {
        this.status = 'contained';
        setTimeout(() => {
          this.status = 'closed';
        }, 2000);
      }
    } else if (this.status === 'closed') {
      this.closeTimer += delta;
    }
  }
  
  animateLights(elapsed) {
    this.lights.forEach(light => {
      const ud = light.userData;
      light.intensity = 0.5 + Math.sin(elapsed * 4 + ud.phase) * 0.5;
    });
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 1.2;
  }
}