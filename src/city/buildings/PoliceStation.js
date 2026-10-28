import * as THREE from 'three';

export class PoliceStation {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
  }
  
  generate(x, z) {
    this.mesh.position.set(x, 0, z);
    
    const mainGeom = new THREE.BoxGeometry(45, 10, 35);
    const mainMesh = new THREE.Mesh(mainGeom, this.materials.building);
    mainMesh.position.y = 5;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    this.mesh.add(mainMesh);
    
    this.addWindows(mainMesh, 45, 10, 35);
    
    const roofGeom = new THREE.BoxGeometry(49, 2, 39);
    const roofMesh = new THREE.Mesh(roofGeom, this.materials.roofBlue);
    roofMesh.position.y = 11;
    roofMesh.castShadow = true;
    this.mesh.add(roofMesh);
    
    const lightBarGeom = new THREE.BoxGeometry(12, 1.5, 4);
    const lightBarMesh = new THREE.Mesh(lightBarGeom, this.materials.buildingDark);
    lightBarMesh.position.set(0, 12.5, 0);
    lightBarMesh.castShadow = true;
    this.mesh.add(lightBarMesh);
    
    const redLightGeom = new THREE.BoxGeometry(5, 1, 2);
    const blueLightGeom = new THREE.BoxGeometry(5, 1, 2);
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, emissive: 0xEF4444, emissiveIntensity: 1 });
    const blueLightMat = new THREE.MeshBasicMaterial({ color: 0x3B82F6, emissive: 0x3B82F6, emissiveIntensity: 1 });
    
    const redLight = new THREE.Mesh(redLightGeom, redLightMat);
    redLight.position.set(-3.5, 0.8, 0);
    lightBarMesh.add(redLight);
    
    const blueLight = new THREE.Mesh(blueLightGeom, blueLightMat);
    blueLight.position.set(3.5, 0.8, 0);
    lightBarMesh.add(blueLight);
    
    this.pulseLights(redLight, blueLight);
    
    const garageGeom = new THREE.BoxGeometry(20, 6, 12);
    const garageMesh = new THREE.Mesh(garageGeom, this.materials.buildingDark);
    garageMesh.position.set(0, 3, 23.5);
    garageMesh.castShadow = true;
    this.mesh.add(garageMesh);
    
    const doorGeom = new THREE.BoxGeometry(8, 5, 0.2);
    const doorMesh = new THREE.Mesh(doorGeom, this.materials.roofBlue);
    doorMesh.position.set(0, 2.5, 29.5);
    this.mesh.add(doorMesh);
    
    const signGeom = new THREE.BoxGeometry(18, 3, 0.5);
    const signMesh = new THREE.Mesh(signGeom, this.materials.roofBlue);
    signMesh.position.set(0, 15, 20);
    this.mesh.add(signMesh);
    
    this.addLandscaping();
  }
  
  addWindows(mesh, width, height, depth) {
    const windowGeom = new THREE.BoxGeometry(1.8, 1.8, 0.2);
    const floors = Math.floor(height / 3.5);
    
    for (let floor = 0; floor < floors; floor++) {
      for (let side = 0; side < 4; side++) {
        const count = side < 2 ? Math.floor(width / 5) : Math.floor(depth / 5);
        for (let i = 0; i < count; i++) {
          if (Math.random() < 0.7) {
            const windowMat = Math.random() < 0.8 ? this.materials.windowLit : this.materials.window;
            const windowMesh = new THREE.Mesh(windowGeom, windowMat);
            
            const offset = (i - (count - 1) / 2) * 5;
            const y = (floor - (floors - 1) / 2) * 3.5;
            
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
  
  pulseLights(red, blue) {
    const pulse = () => {
      red.visible = !red.visible;
      blue.visible = !blue.visible;
      setTimeout(pulse, 300);
    };
    pulse();
  }
  
  addLandscaping() {
    for (let i = 0; i < 4; i++) {
      const treeGeom = new THREE.ConeGeometry(1.8, 5, 6);
      const trunkGeom = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 6);
      const treeMat = new THREE.MeshStandardMaterial({ color: 0x2D5A2D, roughness: 1, flatShading: true });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 1, flatShading: true });
      
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 1.25;
      const leaves = new THREE.Mesh(treeGeom, treeMat);
      leaves.position.y = 4;
      tree.add(trunk, leaves);
      
      tree.position.set(
        (Math.random() - 0.5) * 50,
        0,
        (Math.random() - 0.5) * 35 - 25
      );
      this.mesh.add(tree);
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 2.2;
  }
}