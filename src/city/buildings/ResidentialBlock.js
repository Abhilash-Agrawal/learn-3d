import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class ResidentialBlock {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.buildingCount = 0;
  }
  
  generate(x, z) {
    this.mesh.position.set(x, 0, z);
    this.createHouse(0, 0);
    this.addLandscaping();
  }
  
  createHouse(x, z) {
    const width = 14 + Math.random() * 6;
    const depth = 16 + Math.random() * 6;
    const height = 6 + Math.random() * 4;
    const floors = height > 8 ? 2 : 1;
    
    const houseGroup = new THREE.Group();
    houseGroup.position.set(x, 0, z);
    
    const bodyGeom = new THREE.BoxGeometry(width, height, depth);
    const bodyMat = Math.random() < 0.5 ? this.materials.building : this.materials.buildingLight;
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    houseGroup.add(bodyMesh);
    
    this.addHouseWindows(bodyMesh, width, height, depth);
    
    const roofHeight = 3;
    const roofGeom = new THREE.BoxGeometry(width + 1, roofHeight, depth + 1);
    const roofMesh = new THREE.Mesh(roofGeom, this.materials.roof);
    roofMesh.position.y = height + roofHeight / 2;
    roofMesh.castShadow = true;
    houseGroup.add(roofMesh);
    
    if (Math.random() < 0.3) {
      const chimneyGeom = new THREE.BoxGeometry(1.5, 4, 1.5);
      const chimneyMesh = new THREE.Mesh(chimneyGeom, this.materials.buildingDark);
      chimneyMesh.position.set(
        (Math.random() - 0.5) * (width * 0.4),
        height + roofHeight + 2,
        (Math.random() - 0.5) * (depth * 0.4)
      );
      chimneyMesh.castShadow = true;
      houseGroup.add(chimneyMesh);
    }
    
    if (floors === 2) {
      const balconyGeom = new THREE.BoxGeometry(width * 0.8, 0.3, 2);
      const balconyMesh = new THREE.Mesh(balconyGeom, this.materials.concrete);
      balconyMesh.position.set(0, height / 2, depth / 2 + 1.1);
      houseGroup.add(balconyMesh);
    }
    
    this.mesh.add(houseGroup);
    this.buildingCount++;
  }
  
  addHouseWindows(mesh, width, height, depth) {
    const windowGeom = new THREE.BoxGeometry(1.2, 1.5, 0.15);
    const perSide = Math.floor(width / 4);
    const perFloor = Math.floor(height / 3);
    
    for (let floor = 0; floor < perFloor; floor++) {
      for (let side = 0; side < 4; side++) {
        const count = side < 2 ? perSide : Math.floor(depth / 4);
        for (let i = 0; i < count; i++) {
          if (Math.random() < 0.6) {
            const windowMat = Math.random() < 0.5 ? this.materials.windowLit : this.materials.window;
            const windowMesh = new THREE.Mesh(windowGeom, windowMat);
            
            const offset = (i - (count - 1) / 2) * 4;
            const y = (floor - (perFloor - 1) / 2) * 3;
            
            switch (side) {
              case 0: windowMesh.position.set(offset, y, depth / 2 + 0.08); break;
              case 1: windowMesh.position.set(-depth / 2 - 0.08, y, offset); windowMesh.rotation.y = Math.PI / 2; break;
              case 2: windowMesh.position.set(-offset, y, -depth / 2 - 0.08); windowMesh.rotation.y = Math.PI; break;
              case 3: windowMesh.position.set(depth / 2 + 0.08, y, -offset); windowMesh.rotation.y = -Math.PI / 2; break;
            }
            
            mesh.add(windowMesh);
          }
        }
      }
    }
  }
  
  addLandscaping() {
    for (let i = 0; i < 8; i++) {
      const type = Math.random();
      let tree;
      
      if (type < 0.4) {
        const treeGeom = new THREE.ConeGeometry(1.5, 4, 6);
        const trunkGeom = new THREE.CylinderGeometry(0.25, 0.4, 2, 6);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x2D5A2D, roughness: 1, flatShading: true });
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 1, flatShading: true });
        
        tree = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 1;
        const leaves = new THREE.Mesh(treeGeom, treeMat);
        leaves.position.y = 3.5;
        tree.add(trunk, leaves);
      } else if (type < 0.7) {
        const bushGeom = new THREE.SphereGeometry(1.5, 8, 6);
        const bushMat = new THREE.MeshStandardMaterial({ color: 0x2D5A2D, roughness: 1, flatShading: true });
        tree = new THREE.Mesh(bushGeom, bushMat);
        tree.position.y = 1.5;
        tree.scale.y = 0.6;
      } else {
        const treeGeom = new THREE.CylinderGeometry(0.1, 2, 5, 6);
        const trunkGeom = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x1A4A1A, roughness: 1, flatShading: true });
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 1, flatShading: true });
        
        tree = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 0.75;
        const leaves = new THREE.Mesh(treeGeom, treeMat);
        leaves.position.y = 3.5;
        tree.add(trunk, leaves);
      }
      
      tree.position.set(
        (Math.random() - 0.5) * 50,
        0,
        (Math.random() - 0.5) * 50
      );
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.mesh.add(tree);
    }
    
    for (let i = 0; i < 3; i++) {
      const carGeom = new THREE.BoxGeometry(3, 1.2, 5);
      const carMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.5, 0.4),
        roughness: 0.7,
        metalness: 0.3,
        flatShading: true
      });
      const carMesh = new THREE.Mesh(carGeom, carMat);
      carMesh.position.set(
        (Math.random() - 0.5) * 40,
        0.6,
        (Math.random() - 0.5) * 40 - 20
      );
      carMesh.rotation.y = Math.random() * Math.PI * 2;
      carMesh.castShadow = true;
      this.mesh.add(carMesh);
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 1.5;
  }
}