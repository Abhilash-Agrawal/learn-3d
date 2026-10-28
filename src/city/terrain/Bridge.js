import * as THREE from 'three';

export class Bridge {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
  }
  
  generate() {
    const bridgeLength = 120;
    const bridgeWidth = 24;
    const bridgeHeight = 8;
    const archHeight = 12;
    
    const deckGeom = new THREE.BoxGeometry(bridgeLength, 2, bridgeWidth);
    const deckMesh = new THREE.Mesh(deckGeom, this.materials.road);
    deckMesh.position.set(0, bridgeHeight, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    this.mesh.add(deckMesh);
    
    const laneWidth = 3;
    const laneCount = 4;
    const totalWidth = laneCount * laneWidth;
    const startX = -totalWidth / 2 + laneWidth / 2;
    
    for (let i = 0; i < laneCount - 1; i++) {
      const lineX = startX + (i + 0.5) * laneWidth;
      const lineGeom = new THREE.BoxGeometry(0.2, 0.1, bridgeLength);
      const lineMesh = new THREE.Mesh(lineGeom, this.materials.roadLine);
      lineMesh.position.set(lineX, bridgeHeight + 1.1, 0);
      this.mesh.add(lineMesh);
    }
    
    const archSegments = 12;
    for (let i = 0; i <= archSegments; i++) {
      const t = i / archSegments;
      const x = (t - 0.5) * bridgeLength;
      const y = Math.sin(t * Math.PI) * archHeight;
      
      const archGeom = new THREE.CylinderGeometry(1.2, 1.2, bridgeWidth + 4, 8);
      const archMesh = new THREE.Mesh(archGeom, this.materials.concrete);
      archMesh.position.set(x, bridgeHeight - 1 + y / 2, 0);
      archMesh.rotation.z = Math.PI / 2;
      archMesh.castShadow = true;
      this.mesh.add(archMesh);
    }
    
    const cableCount = 10;
    for (let i = 1; i < cableCount; i++) {
      const t = i / cableCount;
      const x = (t - 0.5) * bridgeLength * 0.9;
      const archY = Math.sin(t * Math.PI) * archHeight;
      
      const cableGeom = new THREE.CylinderGeometry(0.15, 0.15, archY + bridgeHeight, 6);
      const cableMesh = new THREE.Mesh(cableGeom, this.materials.buildingDark);
      cableMesh.position.set(x, (archY + bridgeHeight) / 2, -bridgeWidth / 2 - 2);
      cableMesh.castShadow = true;
      this.mesh.add(cableMesh);
      
      const cableMesh2 = cableMesh.clone();
      cableMesh2.position.z = bridgeWidth / 2 + 2;
      this.mesh.add(cableMesh2);
    }
    
    const railGeom = new THREE.BoxGeometry(bridgeLength, 1.2, 0.3);
    const railMesh = new THREE.Mesh(railGeom, this.materials.concrete);
    railMesh.position.set(0, bridgeHeight + 1.7, -bridgeWidth / 2 - 0.5);
    railMesh.castShadow = true;
    this.mesh.add(railMesh);
    
    const railMesh2 = railMesh.clone();
    railMesh2.position.z = bridgeWidth / 2 + 0.5;
    this.mesh.add(railMesh2);
    
    const lightCount = 6;
    for (let i = 0; i < lightCount; i++) {
      const t = (i + 0.5) / lightCount;
      const x = (t - 0.5) * bridgeLength * 0.9;
      
      const poleGeom = new THREE.CylinderGeometry(0.15, 0.2, 5, 6);
      const poleMesh = new THREE.Mesh(poleGeom, this.materials.buildingDark);
      poleMesh.position.set(x, bridgeHeight + 3.5, -bridgeWidth / 2 - 1);
      poleMesh.castShadow = true;
      this.mesh.add(poleMesh);
      
      const lampGeom = new THREE.SphereGeometry(0.5, 10, 10);
      const lampMat = new THREE.MeshStandardMaterial({
        color: 0xFFF8E7,
        emissive: 0xFFF8E7,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.2,
        flatShading: true
      });
      const lampMesh = new THREE.Mesh(lampGeom, lampMat);
      lampMesh.position.y = 2.7;
      poleMesh.add(lampMesh);
      
      const pointLight = new THREE.PointLight(0xFFF8E7, 0.5, 15);
      pointLight.position.y = 2.7;
      poleMesh.add(pointLight);
      
      const poleMesh2 = poleMesh.clone();
      poleMesh2.position.z = bridgeWidth / 2 + 1;
      this.mesh.add(poleMesh2);
    }
    
    const supportCount = 4;
    for (let i = 1; i < supportCount; i++) {
      const t = i / supportCount;
      const x = (t - 0.5) * bridgeLength;
      
      const supportGeom = new THREE.BoxGeometry(3, bridgeHeight * 2, 4);
      const supportMesh = new THREE.Mesh(supportGeom, this.materials.concrete);
      supportMesh.position.set(x, bridgeHeight, -bridgeWidth / 2 - 4);
      supportMesh.castShadow = true;
      this.mesh.add(supportMesh);
      
      const supportMesh2 = supportMesh.clone();
      supportMesh2.position.z = bridgeWidth / 2 + 4;
      this.mesh.add(supportMesh2);
    }
    
    this.mesh.position.set(0, 0, 50);
  }
}