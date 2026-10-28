import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class Highway {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
    
    this.roadLength = 900;
    this.laneWidth = 3.7;
    this.lanesPerDirection = 2;
    this.medianWidth = 4;
    this.shoulderWidth = 2.5;
    this.totalWidth = (this.lanesPerDirection * 2 * this.laneWidth) + this.medianWidth + (this.shoulderWidth * 2);
  }
  
  generate() {
    const roadLength = this.roadLength;
    const laneWidth = this.laneWidth;
    const lanesPerDirection = this.lanesPerDirection;
    const medianWidth = this.medianWidth;
    const shoulderWidth = this.shoulderWidth;
    const totalWidth = this.totalWidth;
    
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x34383b,
      roughness: 0.96,
      metalness: 0
    });
    
    const roadGeom = new THREE.BoxGeometry(totalWidth, 0.3, roadLength);
    const roadMesh = new THREE.Mesh(roadGeom, asphaltMat);
    roadMesh.position.set(0, 0.15, 0);
    roadMesh.receiveShadow = true;
    this.mesh.add(roadMesh);
    
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x62676a, roughness: 0.95, metalness: 0 });
    const shoulderGeom = new THREE.BoxGeometry(shoulderWidth, 0.2, roadLength);
    
    const leftShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
    leftShoulder.position.set(-totalWidth/2 + shoulderWidth/2, 0.1, 0);
    this.mesh.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
    rightShoulder.position.set(totalWidth/2 - shoulderWidth/2, 0.1, 0);
    this.mesh.add(rightShoulder);
    
    const medianGeom = new THREE.BoxGeometry(medianWidth, 0.4, roadLength);
    const medianMat = new THREE.MeshStandardMaterial({ color: 0x777b78, roughness: 0.9, metalness: 0 });
    const median = new THREE.Mesh(medianGeom, medianMat);
    median.position.set(0, 0.2, 0);
    median.receiveShadow = true;
    this.mesh.add(median);
    
    const barrierGeom = new THREE.BoxGeometry(0.3, 0.8, 20);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8, flatShading: true });
    
    for (let z = -roadLength/2; z < roadLength/2; z += 22) {
      const leftBarrier = new THREE.Mesh(barrierGeom, barrierMat);
      leftBarrier.position.set(-medianWidth/2 - 0.15, 0.4, z + 10);
      leftBarrier.castShadow = true;
      leftBarrier.receiveShadow = true;
      this.mesh.add(leftBarrier);
      
      const rightBarrier = new THREE.Mesh(barrierGeom, barrierMat);
      rightBarrier.position.set(medianWidth/2 + 0.15, 0.4, z + 10);
      rightBarrier.castShadow = true;
      rightBarrier.receiveShadow = true;
      this.mesh.add(rightBarrier);
    }
    
    const dashedLineLength = 6;
    const dashedLineGap = 9;
    const lineHeight = 0.16;
    const laneLineMat = new THREE.MeshStandardMaterial({
      color: 0xf4f3ed,
      roughness: 0.8,
      metalness: 0
    });
    const medianLineMat = new THREE.MeshStandardMaterial({
      color: 0xe7bd43,
      roughness: 0.8,
      metalness: 0
    });
    const markingY = 0.3 + lineHeight / 2 + 0.005;
    
    for (let dir = -1; dir <= 1; dir += 2) {
      const medianEdge = dir * medianWidth / 2;
      
      for (let lane = 0; lane < lanesPerDirection; lane++) {
        const laneCenter = medianEdge + dir * (lane + 0.5) * laneWidth;
        
        if (lane < lanesPerDirection - 1) {
          const lineX = medianEdge + dir * (lane + 1) * laneWidth;
          for (let z = -roadLength/2; z < roadLength/2; z += dashedLineLength + dashedLineGap) {
            const lineGeom = new THREE.BoxGeometry(0.15, lineHeight, dashedLineLength);
            const lineMesh = new THREE.Mesh(lineGeom, laneLineMat);
            lineMesh.position.set(lineX, markingY, z + dashedLineLength/2);
            this.mesh.add(lineMesh);
          }
        }
        
        const edgeLineX = medianEdge + dir * lanesPerDirection * laneWidth;
        const edgeGeom = new THREE.BoxGeometry(0.2, lineHeight, roadLength);
        const edgeMesh = new THREE.Mesh(edgeGeom, laneLineMat);
        edgeMesh.position.set(edgeLineX, markingY, 0);
        this.mesh.add(edgeMesh);
      }

      const medianLineGeom = new THREE.BoxGeometry(0.15, lineHeight, roadLength);
      const medianLine = new THREE.Mesh(medianLineGeom, medianLineMat);
      medianLine.position.set(dir * (medianWidth / 2 + 0.45), markingY, 0);
      this.mesh.add(medianLine);
    }
    
    this.addSigns();
    this.addLightPoles();
    this.addGuardrails();
    this.addOverpasses();
  }
  
  addSigns() {
    const roadLength = this.roadLength;
    const totalWidth = this.totalWidth;
    const signPositions = [-350, -200, -50, 100, 250, 400];
    
    signPositions.forEach(z => {
      ['left', 'right'].forEach(side => {
        const x = side === 'left' ? -totalWidth/2 - 5 : totalWidth/2 + 5;
        
        const poleGeom = new THREE.CylinderGeometry(0.2, 0.25, 8, 8);
        const poleMat = this.materials.buildingDark;
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(x, 4, z);
        pole.castShadow = true;
        this.mesh.add(pole);
        
        const signGeom = new THREE.BoxGeometry(4, 2.5, 0.15);
        const signMat = new THREE.MeshStandardMaterial({
          color: 0x1e3a8a,
          roughness: 0.3,
          metalness: 0.7,
          flatShading: true
        });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(0, 6.5, side === 'left' ? 0.5 : -0.5);
        pole.add(sign);
        
        const reflectiveGeom = new THREE.BoxGeometry(3.5, 0.3, 0.1);
        const reflectiveMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.5,
          roughness: 0.1,
          metalness: 0.9,
          flatShading: true
        });
        const reflective = new THREE.Mesh(reflectiveGeom, reflectiveMat);
        reflective.position.set(0, -1.1, 0.13);
        sign.add(reflective);
      });
    });
    
    const gantryZ = [ -200, 100 ];
    gantryZ.forEach(z => {
      const gantryGeom = new THREE.BoxGeometry(totalWidth + 10, 1, 2);
      const gantryMat = this.materials.buildingDark;
      const gantry = new THREE.Mesh(gantryGeom, gantryMat);
      gantry.position.set(0, 7.5, z);
      gantry.castShadow = true;
      this.mesh.add(gantry);
      
      const supportGeom = new THREE.CylinderGeometry(0.5, 0.6, 7.5, 8);
      const leftSupport = new THREE.Mesh(supportGeom, gantryMat);
      leftSupport.position.set(-totalWidth/2 - 3, 3.75, z);
      leftSupport.castShadow = true;
      this.mesh.add(leftSupport);
      
      const rightSupport = new THREE.Mesh(supportGeom, gantryMat);
      rightSupport.position.set(totalWidth/2 + 3, 3.75, z);
      rightSupport.castShadow = true;
      this.mesh.add(rightSupport);
      
      for (let i = 0; i < 4; i++) {
        const signGeom = new THREE.BoxGeometry(3, 1.2, 0.1);
        const signMat = new THREE.MeshStandardMaterial({
          color: 0x1e3a8a,
          roughness: 0.3,
          metalness: 0.7,
          flatShading: true
        });
        const sign = new THREE.Mesh(signGeom, signMat);
        const laneX = -totalWidth/2 + 2 + i * (totalWidth / 4);
        sign.position.set(laneX, 6.5, z + 1);
        gantry.add(sign);
      }
    });
  }
  
  addLightPoles() {
    const roadLength = this.roadLength;
    const totalWidth = this.totalWidth;
    const shoulderWidth = this.shoulderWidth;
    const poleSpacing = 40;
    const poleHeight = 12;
    
    for (let z = -roadLength/2 + 20; z < roadLength/2; z += poleSpacing) {
      ['left', 'right'].forEach(side => {
        const x = side === 'left' ? -totalWidth/2 - shoulderWidth - 2 : totalWidth/2 + shoulderWidth + 2;
        
        const poleGeom = new THREE.CylinderGeometry(0.15, 0.25, poleHeight, 8);
        const poleMat = this.materials.buildingDark;
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(x, poleHeight/2, z);
        pole.castShadow = true;
        this.mesh.add(pole);
        
        const armGeom = new THREE.BoxGeometry(6, 0.15, 0.15);
        const arm = new THREE.Mesh(armGeom, poleMat);
        arm.position.set(side === 'left' ? 3 : -3, poleHeight - 1, 0);
        pole.add(arm);
        
        const lightGeom = new THREE.BoxGeometry(0.8, 0.4, 0.3);
        const lightMat = new THREE.MeshStandardMaterial({
          color: 0xfff8e7,
          emissive: 0xfff8e7,
          emissiveIntensity: 0.8,
          roughness: 0.3,
          metalness: 0.2,
          flatShading: true
        });
        const light = new THREE.Mesh(lightGeom, lightMat);
        light.position.set(side === 'left' ? 3 : -3, -0.5, 0);
        arm.add(light);
        
        const pointLight = new THREE.PointLight(0xfff8e7, 0.6, 25);
        pointLight.position.set(0, -0.5, 0);
        light.add(pointLight);
      });
    }
  }
  
  addGuardrails() {
    const roadLength = this.roadLength;
    const totalWidth = this.totalWidth;
    const railGeom = new THREE.BoxGeometry(0.2, 0.7, roadLength);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7, flatShading: true });
    
    const leftRail = new THREE.Mesh(railGeom, railMat);
    leftRail.position.set(-totalWidth/2 - 0.1, 0.35, 0);
    leftRail.castShadow = true;
    this.mesh.add(leftRail);
    
    const rightRail = new THREE.Mesh(railGeom, railMat);
    rightRail.position.set(totalWidth/2 + 0.1, 0.35, 0);
    rightRail.castShadow = true;
    this.mesh.add(rightRail);
    
    const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6);
    const postMat = this.materials.buildingDark;
    
    for (let z = -roadLength/2; z < roadLength/2; z += 4) {
      const leftPost = new THREE.Mesh(postGeom, postMat);
      leftPost.position.set(-totalWidth/2 - 0.1, 0.35, z);
      leftPost.castShadow = true;
      this.mesh.add(leftPost);
      
      const rightPost = new THREE.Mesh(postGeom, postMat);
      rightPost.position.set(totalWidth/2 + 0.1, 0.35, z);
      rightPost.castShadow = true;
      this.mesh.add(rightPost);
    }
  }
  
  addOverpasses() {
    const roadLength = this.roadLength;
    const totalWidth = this.totalWidth;
    const overpassPositions = [-200, 50, 300];
    
    overpassPositions.forEach(z => {
      const supportGeom = new THREE.BoxGeometry(3, 14, totalWidth + 4);
      const supportMat = this.materials.concrete;
      
      const leftSupport = new THREE.Mesh(supportGeom, supportMat);
      leftSupport.position.set(-totalWidth/2 - 12, 7, z);
      leftSupport.castShadow = true;
      this.mesh.add(leftSupport);
      
      const rightSupport = new THREE.Mesh(supportGeom, supportMat);
      rightSupport.position.set(totalWidth/2 + 12, 7, z);
      rightSupport.castShadow = true;
      this.mesh.add(rightSupport);
      
      const deckGeom = new THREE.BoxGeometry(28, 2, totalWidth + 4);
      const deckMesh = new THREE.Mesh(deckGeom, this.materials.road);
      deckMesh.position.set(-totalWidth/2 - 12, 15, z);
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      this.mesh.add(deckMesh);
      
      const deckMesh2 = new THREE.Mesh(deckGeom, this.materials.road);
      deckMesh2.position.set(totalWidth/2 + 12, 15, z);
      deckMesh2.castShadow = true;
      deckMesh2.receiveShadow = true;
      this.mesh.add(deckMesh2);
      
      const rampLength = 60;
      const rampGeom = new THREE.BoxGeometry(10, 1, rampLength);
      const rampMat = this.materials.road;
      
      for (let side = -1; side <= 1; side += 2) {
        const rampX = side * (totalWidth/2 + 12);
        const rampZ = z - side * rampLength/2;
        
        const ramp = new THREE.Mesh(rampGeom, rampMat);
        ramp.position.set(rampX, 7.5, rampZ);
        ramp.rotation.y = side * 0.05;
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        this.mesh.add(ramp);
        
        for (let i = 0; i < 5; i++) {
          const lightGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6);
          const lightMat = new THREE.MeshStandardMaterial({
            color: 0xff6b00,
            emissive: 0xff6b00,
            emissiveIntensity: 1,
            flatShading: true
          });
          const light = new THREE.Mesh(lightGeom, lightMat);
          light.position.set(rampX + side * (i - 2) * 1.5, 0.25, rampZ - side * (i - 2) * 12);
          this.mesh.add(light);
        }
      }
    });
  }
}