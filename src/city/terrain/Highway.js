import * as THREE from 'three';

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
    
    this.addGuardrails();
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
}