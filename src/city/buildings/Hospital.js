import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class Hospital {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.helipadPosition = new THREE.Vector3();
  }
  
  generate(x, z) {
    this.mesh.position.set(x, 0, z);
    
    const mainGeom = new THREE.BoxGeometry(60, 16, 45);
    const mainMesh = new THREE.Mesh(mainGeom, this.materials.buildingLight);
    mainMesh.position.y = 8;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    this.mesh.add(mainMesh);
    
    this.addWindows(mainMesh, 60, 16, 45);
    
    const wingGeom = new THREE.BoxGeometry(25, 12, 30);
    const wingMat = this.materials.buildingLight;
    
    const leftWing = new THREE.Mesh(wingGeom, wingMat);
    leftWing.position.set(-42.5, 6, 0);
    leftWing.castShadow = true;
    this.mesh.add(leftWing);
    this.addWindows(leftWing, 25, 12, 30);
    
    const rightWing = new THREE.Mesh(wingGeom, wingMat);
    rightWing.position.set(42.5, 6, 0);
    rightWing.castShadow = true;
    this.mesh.add(rightWing);
    this.addWindows(rightWing, 25, 12, 30);
    
    const centerGeom = new THREE.BoxGeometry(20, 20, 20);
    const centerMesh = new THREE.Mesh(centerGeom, this.materials.buildingLight);
    centerMesh.position.set(0, 18, 0);
    centerMesh.castShadow = true;
    this.mesh.add(centerMesh);
    this.addWindows(centerMesh, 20, 20, 20);
    
    const roofGeom = new THREE.BoxGeometry(64, 2, 49);
    const roofMesh = new THREE.Mesh(roofGeom, this.materials.roof);
    roofMesh.position.y = 17;
    roofMesh.castShadow = true;
    this.mesh.add(roofMesh);
    
    this.helipadPosition.set(0, 17.2, -30);
    const helipadGeom = new THREE.CircleGeometry(10, 32);
    const helipadMesh = new THREE.Mesh(helipadGeom, this.materials.concrete);
    helipadMesh.rotation.x = -Math.PI / 2;
    helipadMesh.position.copy(this.helipadPosition);
    helipadMesh.position.y = 17.15;
    this.mesh.add(helipadMesh);
    
    const hGeom = new THREE.BoxGeometry(5, 0.2, 3);
    const hMesh = new THREE.Mesh(hGeom, this.materials.alertRed);
    hMesh.position.set(0, 0.11, 0);
    helipadMesh.add(hMesh);
    
    const crossGeom = new THREE.BoxGeometry(6, 12, 1);
    const crossMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      emissive: 0xEF4444,
      emissiveIntensity: 0.8
    });
    const crossV = new THREE.Mesh(crossGeom, crossMat);
    crossV.position.set(0, 26, 0);
    this.mesh.add(crossV);
    
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 1), crossMat);
    crossH.position.set(0, 26, 0);
    this.mesh.add(crossH);
    
    this.pulseCross(crossV, crossH);
    
    const erGeom = new THREE.BoxGeometry(20, 6, 15);
    const erMesh = new THREE.Mesh(erGeom, this.materials.buildingLight);
    erMesh.position.set(0, 3, 30);
    erMesh.castShadow = true;
    this.mesh.add(erMesh);
    
    const erSignGeom = new THREE.BoxGeometry(15, 2.5, 0.3);
    const erSignMesh = new THREE.Mesh(erSignGeom, this.materials.alertRed);
    erSignMesh.position.set(0, 6, 37.5);
    this.mesh.add(erSignMesh);
    
    this.addAmbulanceBay();
    this.addLandscaping();
  }
  
  addWindows(mesh, width, height, depth) {
    const windowGeom = new THREE.BoxGeometry(2, 2, 0.2);
    const floors = Math.floor(height / 4);
    
    for (let floor = 0; floor < floors; floor++) {
      for (let side = 0; side < 4; side++) {
        const count = side < 2 ? Math.floor(width / 5) : Math.floor(depth / 5);
        for (let i = 0; i < count; i++) {
          if (Math.random() < 0.8) {
            const windowMat = Math.random() < 0.75 ? this.materials.windowLit : this.materials.window;
            const windowMesh = new THREE.Mesh(windowGeom, windowMat);
            
            const offset = (i - (count - 1) / 2) * 5;
            const y = (floor - (floors - 1) / 2) * 4;
            
            switch (side) {
              case 0: windowMesh.position.set(offset, y, depth / 2 + 0.11); break;
              case 1: windowMesh.position.set(-depth / 2 - 0.11, y, offset); windowMesh.rotation.y = Math.PI / 2; break;
              case 2: windowMesh.position.set(-offset, y, -depth / 2 - 0.11); windowMesh.rotation.y = Math.PI; break;
              case 3: windowMesh.position.set(depth / 2 + 0.11, y, -offset); windowMesh.rotation.y = -Math.PI / 2; break;
            }
            
            mesh.add(windowMesh);
          }
        }
      }
    }
  }
  
  pulseCross(v, h) {
    const pulse = () => {
      const intensity = 0.5 + Math.random() * 0.5;
      v.material.emissiveIntensity = intensity;
      h.material.emissiveIntensity = intensity;
      setTimeout(pulse, 2000 + Math.random() * 2000);
    };
    pulse();
  }
  
  addAmbulanceBay() {
    const bayGeom = new THREE.BoxGeometry(12, 5, 8);
    const bayMesh = new THREE.Mesh(bayGeom, this.materials.buildingDark);
    bayMesh.position.set(0, 2.5, 34);
    bayMesh.castShadow = true;
    this.mesh.add(bayMesh);
    
    const doorGeom = new THREE.BoxGeometry(10, 4, 0.2);
    const doorMesh = new THREE.Mesh(doorGeom, this.materials.concrete);
    doorMesh.position.set(0, 2.5, 38);
    this.mesh.add(doorMesh);
  }
  
  addLandscaping() {
    for (let i = 0; i < 5; i++) {
      const treeGeom = new THREE.ConeGeometry(2, 6, 6);
      const trunkGeom = new THREE.CylinderGeometry(0.4, 0.6, 3, 6);
      const treeMat = new THREE.MeshStandardMaterial({ color: 0x2D5A2D, roughness: 1, flatShading: true });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 1, flatShading: true });
      
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 1.5;
      const leaves = new THREE.Mesh(treeGeom, treeMat);
      leaves.position.y = 5;
      tree.add(trunk, leaves);
      
      tree.position.set(
        (Math.random() - 0.5) * 70,
        0,
        (Math.random() - 0.5) * 55 - 40
      );
      this.mesh.add(tree);
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 3;
  }
}