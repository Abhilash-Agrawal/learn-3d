import * as THREE from 'three';

export class Park {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
  }
  
  generate(x, z, size) {
    this.mesh.position.set(x, 0, z);
    
    const grassGeom = new THREE.CircleGeometry(size, 32);
    const grassMesh = new THREE.Mesh(grassGeom, this.materials.grass);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.y = 0.05;
    grassMesh.receiveShadow = true;
    this.mesh.add(grassMesh);
    
    const pathCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < pathCount; i++) {
      const angle = (i / pathCount) * Math.PI * 2;
      const pathGeom = new THREE.BoxGeometry(4, 0.1, size * 2);
      const pathMesh = new THREE.Mesh(pathGeom, this.materials.concrete);
      pathMesh.position.set(
        Math.cos(angle) * size * 0.3,
        0.1,
        Math.sin(angle) * size * 0.3
      );
      pathMesh.rotation.y = angle + Math.PI / 2;
      this.mesh.add(pathMesh);
    }
    
    const treeCount = Math.floor(size / 8);
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = size * 0.3 + Math.random() * size * 0.4;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      
      const treeType = Math.random();
      let tree;
      
      if (treeType < 0.5) {
        const treeGeom = new THREE.ConeGeometry(2.5, 8, 6);
        const trunkGeom = new THREE.CylinderGeometry(0.5, 0.8, 4, 6);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x2D5A2D, roughness: 1, flatShading: true });
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 1, flatShading: true });
        
        tree = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 2;
        const leaves = new THREE.Mesh(treeGeom, treeMat);
        leaves.position.y = 7;
        tree.add(trunk, leaves);
      } else {
        const treeGeom = new THREE.SphereGeometry(3, 10, 8);
        const trunkGeom = new THREE.CylinderGeometry(0.4, 0.6, 3, 6);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x3D7A3D, roughness: 1, flatShading: true });
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 1, flatShading: true });
        
        tree = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 1.5;
        const leaves = new THREE.Mesh(treeGeom, treeMat);
        leaves.position.y = 4.5;
        leaves.scale.y = 1.2;
        tree.add(trunk, leaves);
      }
      
      tree.position.set(tx, 0, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.mesh.add(tree);
    }
    
    const benchCount = Math.floor(size / 12);
    for (let i = 0; i < benchCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = size * 0.4 + Math.random() * size * 0.3;
      const bx = Math.cos(angle) * radius;
      const bz = Math.sin(angle) * radius;
      
      const benchGeom = new THREE.BoxGeometry(4, 0.4, 1.5);
      const benchMesh = new THREE.Mesh(benchGeom, this.materials.buildingDark);
      benchMesh.position.set(bx, 0.6, bz);
      benchMesh.rotation.y = angle + Math.PI / 2;
      benchMesh.castShadow = true;
      this.mesh.add(benchMesh);
      
      const legGeom = new THREE.BoxGeometry(0.3, 0.6, 0.3);
      const legMat = this.materials.buildingDark;
      [-1.5, 1.5].forEach(offset => {
        const leg = new THREE.Mesh(legGeom, legMat);
        leg.position.set(
          bx + Math.cos(angle + Math.PI / 2) * offset,
          0.3,
          bz + Math.sin(angle + Math.PI / 2) * offset
        );
        this.mesh.add(leg);
      });
    }
    
    if (size > 60 && Math.random() < 0.5) {
      this.addPlayground();
    }
    
    if (size > 50 && Math.random() < 0.3) {
      this.addPond(size);
    }
    
    this.addLights(size);
  }
  
  addPlayground() {
    const playgroundGeom = new THREE.BoxGeometry(15, 0.2, 10);
    const playgroundMesh = new THREE.Mesh(playgroundGeom, this.materials.concrete);
    playgroundMesh.position.y = 0.15;
    playgroundMesh.receiveShadow = true;
    this.mesh.add(playgroundMesh);
    
    const slideGeom = new THREE.BoxGeometry(1, 3, 4);
    const slideMesh = new THREE.Mesh(slideGeom, this.materials.alertRed);
    slideMesh.position.set(0, 2, 5);
    slideMesh.castShadow = true;
    this.mesh.add(slideMesh);
    
    const swingGeom = new THREE.BoxGeometry(8, 0.2, 2);
    const swingMesh = new THREE.Mesh(swingGeom, this.materials.buildingDark);
    swingMesh.position.set(0, 3.5, -4);
    this.mesh.add(swingMesh);
    
    for (let i = -3; i <= 3; i += 3) {
      const chainGeom = new THREE.CylinderGeometry(0.05, 0.05, 3, 4);
      const chainMesh = new THREE.Mesh(chainGeom, this.materials.buildingDark);
      chainMesh.position.set(i, 1.75, -4);
      this.mesh.add(chainMesh);
      
      const seatGeom = new THREE.BoxGeometry(1.5, 0.2, 0.5);
      const seatMesh = new THREE.Mesh(seatGeom, this.materials.alertRed);
      seatMesh.position.set(i, 0.25, -4);
      this.mesh.add(seatMesh);
    }
  }
  
  addPond(size) {
    const pondGeom = new THREE.CircleGeometry(size * 0.15, 24);
    const pondMesh = new THREE.Mesh(pondGeom, this.materials.water);
    pondMesh.rotation.x = -Math.PI / 2;
    pondMesh.position.set(
      (Math.random() - 0.5) * size * 0.3,
      0.15,
      (Math.random() - 0.5) * size * 0.3
    );
    this.mesh.add(pondMesh);
    
    const edgeGeom = new THREE.RingGeometry(size * 0.15, size * 0.15 + 1, 24);
    const edgeMesh = new THREE.Mesh(edgeGeom, this.materials.concrete);
    edgeMesh.rotation.x = -Math.PI / 2;
    edgeMesh.position.copy(pondMesh.position);
    edgeMesh.position.y = 0.16;
    this.mesh.add(edgeMesh);
  }
  
  addLights(size) {
    const lightCount = Math.floor(size / 20);
    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = size * 0.6;
      const lx = Math.cos(angle) * radius;
      const lz = Math.sin(angle) * radius;
      
      const poleGeom = new THREE.CylinderGeometry(0.15, 0.2, 6, 6);
      const poleMesh = new THREE.Mesh(poleGeom, this.materials.buildingDark);
      poleMesh.position.set(lx, 3, lz);
      poleMesh.castShadow = true;
      this.mesh.add(poleMesh);
      
      const lampGeom = new THREE.SphereGeometry(0.6, 10, 10);
      const lampMat = new THREE.MeshStandardMaterial({
        color: 0xFFF8E7,
        emissive: 0xFFF8E7,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.2,
        flatShading: true
      });
      const lampMesh = new THREE.Mesh(lampGeom, lampMat);
      lampMesh.position.y = 3.2;
      poleMesh.add(lampMesh);
      
      const pointLight = new THREE.PointLight(0xFFF8E7, 0.8, 20);
      pointLight.position.y = 3.2;
      poleMesh.add(pointLight);
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 2;
  }
}