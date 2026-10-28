import * as THREE from 'three';

export class MedicalIncident {
  constructor(scene, city, id, position) {
    this.scene = scene;
    this.city = city;
    this.id = id;
    this.type = 'medical';
    this.status = 'reported';
    this.priority = Math.random() < 0.2 ? 'critical' : 'urgent';
    this.progress = 0;
    this.closeTimer = 0;
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.position.y = 0;
    this.mesh.userData = { selectable: true, entity: this, type: 'incident' };
    
    this.createVisuals();
  }
  
  createVisuals() {
    const baseGeom = new THREE.CylinderGeometry(4, 5, 0.3, 12);
    const baseMesh = new THREE.Mesh(baseGeom, new THREE.MeshStandardMaterial({
      color: 0x1F2937,
      roughness: 0.9,
      flatShading: true
    }));
    baseMesh.position.y = 0.15;
    this.mesh.add(baseMesh);
    
    const crossGeom = new THREE.BoxGeometry(0.5, 3, 0.5);
    const crossMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      emissive: 0xEF4444,
      emissiveIntensity: 1
    });
    const crossV = new THREE.Mesh(crossGeom, crossMat);
    crossV.position.y = 2;
    this.mesh.add(crossV);
    
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.5), crossMat);
    crossH.position.y = 2;
    this.mesh.add(crossH);
    
    this.crossGroup = new THREE.Group();
    this.crossGroup.add(crossV, crossH);
    this.crossGroup.position.y = 2;
    this.mesh.add(this.crossGroup);
    
    this.pulseLight = new THREE.PointLight(0xEF4444, this.priority === 'critical' ? 2 : 1, 20);
    this.pulseLight.position.set(0, 4, 0);
    this.mesh.add(this.pulseLight);
    
    if (this.priority === 'critical') {
      for (let i = 0; i < 3; i++) {
        const markerGeom = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 6);
        const markerMat = new THREE.MeshBasicMaterial({
          color: 0xEF4444,
          emissive: 0xEF4444,
          emissiveIntensity: 1
        });
        const marker = new THREE.Mesh(markerGeom, markerMat);
        
        const angle = (i / 3) * Math.PI * 2;
        marker.position.set(
          Math.cos(angle) * 4,
          0.75,
          Math.sin(angle) * 4
        );
        marker.userData = { angle, phase: Math.random() * Math.PI * 2 };
        this.mesh.add(marker);
        marker.userData.isMarker = true;
      }
    }
  }
  
  update(delta, elapsed, unitManager) {
    this.crossGroup.rotation.y += delta;
    
    const pulse = Math.sin(elapsed * 3) * 0.5 + 0.5;
    this.pulseLight.intensity = (this.priority === 'critical' ? 2 : 1) * pulse;
    
    this.mesh.children.forEach(child => {
      if (child.userData.isMarker) {
        child.position.y = 0.75 + Math.sin(elapsed * 4 + child.userData.phase) * 0.3;
        child.material.emissiveIntensity = 0.5 + Math.sin(elapsed * 6 + child.userData.phase) * 0.5;
      }
    });
    
    if (this.status === 'onscene' || this.status === 'contained') {
      this.progress += delta * 0.15;
      
      if (this.progress >= 1) {
        this.status = 'contained';
        setTimeout(() => {
          this.status = 'closed';
        }, 1500);
      }
    } else if (this.status === 'closed') {
      this.closeTimer += delta;
      this.pulseLight.intensity *= 0.98;
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 1;
  }
}