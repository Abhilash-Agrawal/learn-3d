import * as THREE from 'three';

export class Road {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.roadLength = 900;
    this.laneWidth = 3.7;
    this.lanesPerDirection = 2;
    this.medianWidth = 3;
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
      color: 0x374151,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true
    });
    
    const roadGeom = new THREE.BoxGeometry(totalWidth, 0.3, roadLength);
    const roadMesh = new THREE.Mesh(roadGeom, asphaltMat);
    roadMesh.position.set(0, 0.15, 0);
    roadMesh.receiveShadow = true;
    this.mesh.add(roadMesh);
    
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      roughness: 0.95,
      metalness: 0,
      flatShading: true
    });
    
    const shoulderGeom = new THREE.BoxGeometry(shoulderWidth, 0.2, roadLength);
    
    const leftShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
    leftShoulder.position.set(-totalWidth/2 + shoulderWidth/2, 0.1, 0);
    leftShoulder.receiveShadow = true;
    this.mesh.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
    rightShoulder.position.set(totalWidth/2 - shoulderWidth/2, 0.1, 0);
    rightShoulder.receiveShadow = true;
    this.mesh.add(rightShoulder);
    
    const medianGeom = new THREE.BoxGeometry(medianWidth, 0.4, roadLength);
    const medianMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9, flatShading: true });
    const median = new THREE.Mesh(medianGeom, medianMat);
    median.position.set(0, 0.2, 0);
    median.receiveShadow = true;
    this.mesh.add(median);
    
    const lineHeight = 0.16;
    
    const yellowLineMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
      flatShading: true
    });
    
    const whiteLineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
      flatShading: true
    });
    
    const dashedWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0xffffff,
      emissiveIntensity: 0.15,
      flatShading: true
    });
    
    const dashedLength = 4;
    const dashedGap = 6;
    
    for (let dir = -1; dir <= 1; dir += 2) {
      const medianEdge = dir * medianWidth / 2;
      const shoulderEdge = dir * (medianWidth/2 + lanesPerDirection * laneWidth + shoulderWidth);
      
      for (let lane = 0; lane < lanesPerDirection; lane++) {
        if (lane < lanesPerDirection - 1) {
          const lineX = medianEdge + dir * (lane + 1) * laneWidth;
          for (let z = -roadLength/2; z < roadLength/2; z += dashedLength + dashedGap) {
            const lineGeom = new THREE.BoxGeometry(0.15, lineHeight, dashedLength);
            const lineMesh = new THREE.Mesh(lineGeom, dashedWhiteMat);
            lineMesh.position.set(lineX, lineHeight/2, z + dashedLength/2);
            this.mesh.add(lineMesh);
          }
        }
        
        if (lane === 0) {
          const yellowX = medianEdge + dir * 0.15;
          const yellowGeom = new THREE.BoxGeometry(0.15, lineHeight, roadLength);
          const yellowMesh = new THREE.Mesh(yellowGeom, yellowLineMat);
          yellowMesh.position.set(yellowX, lineHeight/2, 0);
          this.mesh.add(yellowMesh);
          
          const yellowX2 = medianEdge + dir * 0.45;
          const yellowMesh2 = new THREE.Mesh(yellowGeom, yellowLineMat);
          yellowMesh2.position.set(yellowX2, lineHeight/2, 0);
          this.mesh.add(yellowMesh2);
        }
        
        if (lane === lanesPerDirection - 1) {
          const edgeX = medianEdge + dir * lanesPerDirection * laneWidth;
          const edgeGeom = new THREE.BoxGeometry(0.2, lineHeight, roadLength);
          const edgeMesh = new THREE.Mesh(edgeGeom, whiteLineMat);
          edgeMesh.position.set(edgeX, lineHeight/2, 0);
          this.mesh.add(edgeMesh);
        }
      }
      
      const shoulderLineX = dir * (medianWidth/2 + lanesPerDirection * laneWidth);
      const shoulderLineGeom = new THREE.BoxGeometry(0.15, lineHeight, roadLength);
      const shoulderLineMesh = new THREE.Mesh(shoulderLineGeom, whiteLineMat);
      shoulderLineMesh.position.set(shoulderLineX, lineHeight/2, 0);
      this.mesh.add(shoulderLineMesh);
    }
    
    const centerYellowGeom = new THREE.BoxGeometry(0.3, lineHeight, roadLength);
    const centerYellowMesh = new THREE.Mesh(centerYellowGeom, yellowLineMat);
    centerYellowMesh.position.set(0, lineHeight/2, 0);
    this.mesh.add(centerYellowMesh);
  }
}