import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class Tower {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.height = 0;
    this.baseSize = 0;
  }
  
  generate(x, z, height) {
    this.height = height;
    this.baseSize = 20 + Math.random() * 10;
    this.mesh.position.set(x, 0, z);
    
    const floors = Math.floor(height / 8);
    const floorHeight = height / floors;
    
    const baseGeom = new THREE.BoxGeometry(this.baseSize, floorHeight, this.baseSize);
    const baseMesh = new THREE.Mesh(baseGeom, this.materials.building);
    baseMesh.position.y = floorHeight / 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.mesh.add(baseMesh);
    
    this.addWindows(baseMesh, this.baseSize, floorHeight);
    
    for (let i = 1; i < floors; i++) {
      const taper = 1 - (i / floors) * 0.15;
      const size = this.baseSize * taper;
      const y = floorHeight / 2 + i * floorHeight;
      
      const geom = new THREE.BoxGeometry(size, floorHeight, size);
      const mat = Math.random() < 0.5 ? this.materials.building : this.materials.buildingDark;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.mesh.add(mesh);
      
      this.addWindows(mesh, size, floorHeight);
    }
    
    this.addRoof(floors * floorHeight);
    this.addAntenna(height);
  }
  
  addWindows(mesh, size, floorHeight) {
    const windowSize = 1.5;
    const spacing = 3;
    const cols = Math.floor(size / spacing);
    const rows = Math.floor(floorHeight / spacing);
    
    const windowGeom = new THREE.BoxGeometry(windowSize, windowSize, 0.2);
    
    for (let side = 0; side < 4; side++) {
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          if (Math.random() < 0.7) {
            const windowMat = Math.random() < 0.6 ? this.materials.windowLit : this.materials.window;
            const windowMesh = new THREE.Mesh(windowGeom, windowMat);
            
            const x = (col - (cols - 1) / 2) * spacing;
            const y = (row - (rows - 1) / 2) * spacing;
            const z = size / 2 + 0.11;
            
            switch (side) {
              case 0: windowMesh.position.set(x, y, z); break;
              case 1: windowMesh.position.set(-z, y, x); windowMesh.rotation.y = Math.PI / 2; break;
              case 2: windowMesh.position.set(-x, y, -z); windowMesh.rotation.y = Math.PI; break;
              case 3: windowMesh.position.set(z, y, -x); windowMesh.rotation.y = -Math.PI / 2; break;
            }
            
            mesh.add(windowMesh);
          }
        }
      }
    }
  }
  
  addRoof(y) {
    const roofHeight = 4;
    const roofGeom = new THREE.BoxGeometry(this.baseSize * 0.95, roofHeight, this.baseSize * 0.95);
    const roofMesh = new THREE.Mesh(roofGeom, this.materials.roof);
    roofMesh.position.y = y + roofHeight / 2;
    roofMesh.castShadow = true;
    this.mesh.add(roofMesh);
    
    const hvacCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < hvacCount; i++) {
      const hvacGeom = new THREE.BoxGeometry(3, 2, 3);
      const hvacMesh = new THREE.Mesh(hvacGeom, this.materials.buildingDark);
      hvacMesh.position.set(
        (Math.random() - 0.5) * this.baseSize * 0.6,
        y + roofHeight + 1,
        (Math.random() - 0.5) * this.baseSize * 0.6
      );
      hvacMesh.castShadow = true;
      this.mesh.add(hvacMesh);
    }
  }
  
  addAntenna(y) {
    if (Math.random() < 0.4) {
      const antennaGeom = new THREE.CylinderGeometry(0.2, 0.1, 10, 6);
      const antennaMesh = new THREE.Mesh(antennaGeom, this.materials.buildingDark);
      antennaMesh.position.set(0, y + 5, 0);
      this.mesh.add(antennaMesh);
      
      const lightGeom = new THREE.SphereGeometry(0.4, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xEF4444,
        emissive: 0xEF4444,
        emissiveIntensity: 1
      });
      const lightMesh = new THREE.Mesh(lightGeom, lightMat);
      lightMesh.position.y = 5.5;
      antennaMesh.add(lightMesh);
      
      this.blinkLight(lightMesh);
    }
  }
  
  blinkLight(light) {
    const blink = () => {
      light.visible = !light.visible;
      setTimeout(blink, 1000 + Math.random() * 1000);
    };
    blink();
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return this.baseSize / 20;
  }
}