import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class River {
  constructor(materials) {
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.waterMesh = null;
    this.flowTime = 0;
  }
  
  generate() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-450, 0, -300),
      new THREE.Vector3(-200, 0, -100),
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(200, 0, 100),
      new THREE.Vector3(450, 0, 300)
    ]);
    
    const points = curve.getPoints(100);
    const width = 40;
    
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x - width / 2, points[0].z);
    
    for (let i = 1; i < points.length; i++) {
      const tangent = new THREE.Vector3().subVectors(points[i], points[i - 1]).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const leftX = points[i].x + normal.x * width / 2;
      const leftZ = points[i].z + normal.z * width / 2;
      shape.lineTo(leftX, leftZ);
    }
    
    for (let i = points.length - 1; i >= 0; i--) {
      const tangent = i > 0 ? new THREE.Vector3().subVectors(points[i], points[i - 1]).normalize() : new THREE.Vector3().subVectors(points[1], points[0]).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const rightX = points[i].x - normal.x * width / 2;
      const rightZ = points[i].z - normal.z * width / 2;
      shape.lineTo(rightX, rightZ);
    }
    
    shape.closePath();
    
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    
    const riverbedMat = new THREE.MeshStandardMaterial({
      color: 0x1E3A8A,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true
    });
    
    const riverbed = new THREE.Mesh(geometry, riverbedMat);
    riverbed.position.y = -2;
    riverbed.receiveShadow = true;
    this.mesh.add(riverbed);
    
    const waterGeom = geometry.clone();
    this.waterMesh = new THREE.Mesh(waterGeom, this.materials.water);
    this.waterMesh.position.y = 0.5;
    this.waterMesh.receiveShadow = true;
    this.mesh.add(this.waterMesh);
    
    const edgeGeom = new THREE.EdgesGeometry(geometry);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1E40AF, transparent: true, opacity: 0.5 });
    const edges = new THREE.LineSegments(edgeGeom, edgeMat);
    edges.rotation.x = -Math.PI / 2;
    edges.position.y = 0.6;
    this.mesh.add(edges);
  }
  
  update(delta, elapsed) {
    this.flowTime += delta;
    if (this.waterMesh && this.waterMesh.material.map) {
      this.waterMesh.material.map.offset.x = this.flowTime * 0.1;
    }
  }
}