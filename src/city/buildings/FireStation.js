import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class FireStation {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.bayPositions = [];
    this.bayDoors = [];
    this.bayDoorStates = [];
  }
  
  generate(x, z) {
    this.mesh.position.set(x, 0, z);
    
    const mainGeom = new THREE.BoxGeometry(50, 12, 40);
    const mainMesh = new THREE.Mesh(mainGeom, this.materials.building);
    mainMesh.position.y = 6;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    this.mesh.add(mainMesh);
    
    this.addWindows(mainMesh, 50, 12, 40);
    
    const bayCount = 3;
    const bayWidth = 12;
    const bayHeight = 10;
    const bayDepth = 16;
    const totalWidth = bayCount * bayWidth + 4;
    const startX = -totalWidth / 2 + bayWidth / 2;
    
    for (let i = 0; i < bayCount; i++) {
      const bx = startX + i * (bayWidth + 2);
      
      const bayGeom = new THREE.BoxGeometry(bayWidth, bayHeight, bayDepth);
      const bayMesh = new THREE.Mesh(bayGeom, this.materials.buildingDark);
      bayMesh.position.set(bx, bayHeight / 2, 20 + bayDepth / 2);
      bayMesh.castShadow = true;
      this.mesh.add(bayMesh);
      
      const doorGeom = new THREE.BoxGeometry(bayWidth - 1, bayHeight - 1, 0.3);
      const doorMesh = new THREE.Mesh(doorGeom, this.materials.alertRed);
      doorMesh.position.set(bx, bayHeight / 2, 20 + bayDepth / 2 + 0.15);
      doorMesh.castShadow = true;
      doorMesh.userData = { selectable: true, entity: this, type: 'station', bayIndex: i };
      this.mesh.add(doorMesh);
      
      this.bayDoors.push(doorMesh);
      this.bayDoorStates.push({ mesh: doorMesh, open: false, targetY: 0, currentY: 0 });
      this.bayPositions.push(new THREE.Vector3(bx, 0, 20 + bayDepth + 5));
    }
    
    const roofGeom = new THREE.BoxGeometry(totalWidth + 4, 2, 44);
    const roofMesh = new THREE.Mesh(roofGeom, this.materials.roofRed);
    roofMesh.position.y = 12 + 1;
    roofMesh.castShadow = true;
    this.mesh.add(roofMesh);
    
    const towerGeom = new THREE.CylinderGeometry(2, 3, 15, 8);
    const towerMesh = new THREE.Mesh(towerGeom, this.materials.building);
    towerMesh.position.set(-totalWidth / 2 - 5, 12 + 7.5, 0);
    towerMesh.castShadow = true;
    this.mesh.add(towerMesh);
    
    const sirenGeom = new THREE.CylinderGeometry(1, 1.5, 3, 8);
    const sirenMesh = new THREE.Mesh(sirenGeom, this.materials.alertRed);
    sirenMesh.position.y = 1.5;
    towerMesh.add(sirenMesh);
    
    const lightGeom = new THREE.SphereGeometry(0.5, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      emissive: 0xEF4444,
      emissiveIntensity: 1
    });
    const lightMesh = new THREE.Mesh(lightGeom, lightMat);
    lightMesh.position.y = 3;
    sirenMesh.add(lightMesh);
    
    this.blinkLight(lightMesh);
    
    const signGeom = new THREE.BoxGeometry(20, 4, 0.5);
    const signMesh = new THREE.Mesh(signGeom, this.materials.alertRed);
    signMesh.position.set(0, 18, 20 + bayDepth / 2 + 0.3);
    this.mesh.add(signMesh);
    
    const helipadGeom = new THREE.CircleGeometry(8, 32);
    const helipadMesh = new THREE.Mesh(helipadGeom, this.materials.concrete);
    helipadMesh.rotation.x = -Math.PI / 2;
    helipadMesh.position.set(totalWidth / 2 + 12, 0.15, -10);
    this.mesh.add(helipadMesh);
    
    const hGeom = new THREE.BoxGeometry(4, 0.2, 2);
    const hMesh = new THREE.Mesh(hGeom, this.materials.roofRed);
    hMesh.position.set(0, 0.11, 0);
    helipadMesh.add(hMesh);
    
    this.addLandscaping();
  }
  
  addWindows(mesh, width, height, depth) {
    const windowGeom = new THREE.BoxGeometry(2, 2, 0.2);
    const floors = Math.floor(height / 4);
    
    for (let floor = 0; floor < floors; floor++) {
      for (let side = 0; side < 4; side++) {
        const count = side < 2 ? Math.floor(width / 5) : Math.floor(depth / 5);
        for (let i = 0; i < count; i++) {
          if (Math.random() < 0.6) {
            const windowMat = Math.random() < 0.7 ? this.materials.windowLit : this.materials.window;
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
  
  addLandscaping() {
    for (let i = 0; i < 6; i++) {
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
        (Math.random() - 0.5) * 60,
        0,
        (Math.random() - 0.5) * 40 - 30
      );
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.mesh.add(tree);
    }
  }
  
  blinkLight(light) {
    const blink = () => {
      light.visible = !light.visible;
      setTimeout(blink, 500);
    };
    blink();
  }
  
  openBay(index) {
    if (index >= 0 && index < this.bayDoors.length) {
      this.bayDoorStates[index].targetY = -12;
    }
  }
  
  closeBay(index) {
    if (index >= 0 && index < this.bayDoors.length) {
      this.bayDoorStates[index].targetY = 0;
    }
  }
  
  update(delta, elapsed) {
    this.bayDoorStates.forEach(state => {
      state.currentY += (state.targetY - state.currentY) * delta * 8;
      state.mesh.position.y = state.currentY;
    });
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 2.5;
  }
}